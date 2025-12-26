import {
    ReminderAnalytics,
    ReminderOptimizationRecommendation,
    ReminderChannel,
    ReminderType,
    OptimizeReminderJob,
} from './reminder-types';
import { JobContext, JobResult, JobService } from './types';

/**
 * Reminder Analytics and Optimization Service
 * 
 * Tracks reminder effectiveness and provides optimization recommendations
 * to improve response rates and reduce manual follow-up.
 */
export class ReminderAnalyticsService {
    constructor(
        private databaseService: any,
        private jobService: JobService
    ) {
        this.registerOptimizationJobs();
    }

    /**
     * Register optimization job handlers
     */
    private registerOptimizationJobs(): void {
        this.jobService.defineJob({
            name: 'optimize-reminders',
            handler: this.handleOptimizeReminders.bind(this),
            config: {
                maxRetries: 2,
                retryDelay: 30000,
                priority: 5,
            },
        });

        this.jobService.defineJob({
            name: 'generate-analytics-report',
            handler: this.handleGenerateAnalyticsReport.bind(this),
            config: {
                maxRetries: 2,
                retryDelay: 15000,
                priority: 4,
            },
        });
    }

    /**
     * Generate comprehensive reminder analytics for an organization
     */
    async generateReminderAnalytics(
        organizationId: string,
        timeRange: { start: Date; end: Date }
    ): Promise<ReminderAnalytics> {
        try {
            // Get raw analytics data
            const rawData = await this.getRawAnalyticsData(organizationId, timeRange);

            // Calculate core metrics
            const metrics = await this.calculateMetrics(rawData);

            // Generate optimization recommendations
            const recommendations = await this.generateRecommendations(organizationId, metrics, rawData);

            return {
                organizationId,
                timeRange,
                metrics,
                recommendations,
            };
        } catch (error) {
            console.error('Failed to generate reminder analytics:', error);
            throw error;
        }
    }

    /**
     * Track reminder interaction (open, click, response)
     */
    async trackReminderInteraction(
        reminderDeliveryId: string,
        interactionType: 'opened' | 'clicked' | 'responded' | 'bounced' | 'unsubscribed',
        metadata?: Record<string, any>
    ): Promise<void> {
        try {
            await this.databaseService.createReminderInteraction({
                reminderDeliveryId,
                interactionType: interactionType.toUpperCase(),
                timestamp: new Date(),
                ipAddress: metadata?.ipAddress,
                userAgent: metadata?.userAgent,
                location: metadata?.location,
                metadata: metadata || {},
            });

            // Update reminder effectiveness in real-time
            await this.updateReminderEffectiveness(reminderDeliveryId, interactionType);

            // Record analytics event
            await this.recordAnalyticsEvent({
                eventType: interactionType.toUpperCase() as any,
                eventData: {
                    reminderDeliveryId,
                    interactionType,
                    timestamp: new Date(),
                    metadata,
                },
            });
        } catch (error) {
            console.error('Failed to track reminder interaction:', error);
            throw error;
        }
    }

    /**
     * Schedule automatic optimization analysis
     */
    async scheduleOptimizationAnalysis(
        organizationId: string,
        analysisType: 'effectiveness' | 'timing' | 'channels' | 'content' = 'effectiveness'
    ): Promise<string> {
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days

        return await this.jobService.enqueue('optimize-reminders', {
            organizationId,
            analysisType,
            timeRange: {
                start: startDate,
                end: endDate,
            },
            metadata: {
                scheduledAt: new Date(),
                automated: true,
            },
        } as OptimizeReminderJob);
    }

    /**
     * Handle optimize reminders job
     */
    private async handleOptimizeReminders(
        payload: OptimizeReminderJob,
        context: JobContext
    ): Promise<JobResult> {
        try {
            // Generate analytics
            const analytics = await this.generateReminderAnalytics(
                payload.organizationId,
                payload.timeRange
            );

            // Store optimization results
            const optimizationId = await this.databaseService.createReminderOptimization({
                organizationId: payload.organizationId,
                optimizationType: payload.analysisType.toUpperCase(),
                analysisData: {
                    timeRange: payload.timeRange,
                    metrics: analytics.metrics,
                    analysisType: payload.analysisType,
                },
                recommendations: analytics.recommendations,
                isActive: true,
                createdAt: new Date(),
            });

            // Auto-implement low-risk optimizations if configured
            const autoImplemented = await this.autoImplementOptimizations(
                payload.organizationId,
                analytics.recommendations
            );

            return {
                success: true,
                data: {
                    optimizationId,
                    analytics,
                    autoImplemented,
                    recommendationsCount: analytics.recommendations.length,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to optimize reminders: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Handle generate analytics report job
     */
    private async handleGenerateAnalyticsReport(
        payload: { organizationId: string; reportType: string; timeRange: { start: Date; end: Date } },
        context: JobContext
    ): Promise<JobResult> {
        try {
            const analytics = await this.generateReminderAnalytics(
                payload.organizationId,
                payload.timeRange
            );

            // Generate formatted report
            const report = await this.generateFormattedReport(analytics, payload.reportType);

            // Store report
            const reportId = await this.databaseService.createAnalyticsReport({
                organizationId: payload.organizationId,
                reportType: payload.reportType,
                timeRange: payload.timeRange,
                data: analytics,
                formattedReport: report,
                createdAt: new Date(),
            });

            return {
                success: true,
                data: {
                    reportId,
                    analytics,
                    report,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: `Failed to generate analytics report: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
    }

    /**
     * Get raw analytics data from database
     */
    private async getRawAnalyticsData(
        organizationId: string,
        timeRange: { start: Date; end: Date }
    ): Promise<any> {
        const [reminders, deliveries, interactions, escalations] = await Promise.all([
            this.databaseService.getReminderSchedules({
                organizationId,
                createdAt: {
                    gte: timeRange.start,
                    lte: timeRange.end,
                },
            }),
            this.databaseService.getReminderDeliveries({
                organizationId,
                createdAt: {
                    gte: timeRange.start,
                    lte: timeRange.end,
                },
            }),
            this.databaseService.getReminderInteractions({
                organizationId,
                timestamp: {
                    gte: timeRange.start,
                    lte: timeRange.end,
                },
            }),
            this.databaseService.getReminderEscalations({
                organizationId,
                triggeredAt: {
                    gte: timeRange.start,
                    lte: timeRange.end,
                },
            }),
        ]);

        return {
            reminders,
            deliveries,
            interactions,
            escalations,
        };
    }

    /**
     * Calculate comprehensive metrics from raw data
     */
    private async calculateMetrics(rawData: any): Promise<any> {
        const { reminders, deliveries, interactions, escalations } = rawData;

        // Basic counts
        const totalReminders = reminders.length;
        const totalDeliveries = deliveries.length;
        const totalInteractions = interactions.length;
        const totalEscalations = escalations.length;

        // Delivery metrics
        const successfulDeliveries = deliveries.filter((d: any) => d.status === 'DELIVERED').length;
        const deliveryRate = totalDeliveries > 0 ? successfulDeliveries / totalDeliveries : 0;

        // Interaction metrics
        const opens = interactions.filter((i: any) => i.interactionType === 'OPENED').length;
        const clicks = interactions.filter((i: any) => i.interactionType === 'CLICKED').length;
        const responses = interactions.filter((i: any) => i.interactionType === 'RESPONDED').length;

        const openRate = successfulDeliveries > 0 ? opens / successfulDeliveries : 0;
        const clickRate = opens > 0 ? clicks / opens : 0;
        const responseRate = successfulDeliveries > 0 ? responses / successfulDeliveries : 0;

        // Response time calculation
        const responseInteractions = interactions.filter((i: any) => i.interactionType === 'RESPONDED');
        const responseTimes = responseInteractions.map((interaction: any) => {
            const delivery = deliveries.find((d: any) => d.id === interaction.reminderDeliveryId);
            if (delivery && delivery.deliveredAt) {
                return (new Date(interaction.timestamp).getTime() - new Date(delivery.deliveredAt).getTime()) / (1000 * 60 * 60); // hours
            }
            return null;
        }).filter((time: any) => time !== null);

        const averageResponseTime = responseTimes.length > 0
            ? responseTimes.reduce((sum: number, time: number) => sum + time, 0) / responseTimes.length
            : 0;

        // Escalation rate
        const escalationRate = totalReminders > 0 ? totalEscalations / totalReminders : 0;

        // Channel effectiveness
        const channelEffectiveness: Record<ReminderChannel, any> = {} as any;

        for (const channel of Object.values(ReminderChannel)) {
            const channelDeliveries = deliveries.filter((d: any) => d.channel === channel);
            const channelSuccessful = channelDeliveries.filter((d: any) => d.status === 'DELIVERED');
            const channelInteractions = interactions.filter((i: any) => {
                const delivery = deliveries.find((d: any) => d.id === i.reminderDeliveryId);
                return delivery && delivery.channel === channel;
            });

            const channelOpens = channelInteractions.filter((i: any) => i.interactionType === 'OPENED');
            const channelClicks = channelInteractions.filter((i: any) => i.interactionType === 'CLICKED');
            const channelResponses = channelInteractions.filter((i: any) => i.interactionType === 'RESPONDED');

            channelEffectiveness[channel] = {
                deliveryRate: channelDeliveries.length > 0 ? channelSuccessful.length / channelDeliveries.length : 0,
                openRate: channelSuccessful.length > 0 ? channelOpens.length / channelSuccessful.length : 0,
                clickRate: channelOpens.length > 0 ? channelClicks.length / channelOpens.length : 0,
                responseRate: channelSuccessful.length > 0 ? channelResponses.length / channelSuccessful.length : 0,
            };
        }

        // Time effectiveness (hour of day analysis)
        const timeEffectiveness: Record<string, number> = {};
        for (let hour = 0; hour < 24; hour++) {
            const hourDeliveries = deliveries.filter((d: any) => {
                if (!d.deliveredAt) return false;
                return new Date(d.deliveredAt).getHours() === hour;
            });

            const hourResponses = hourDeliveries.filter((d: any) => {
                return interactions.some((i: any) =>
                    i.reminderDeliveryId === d.id && i.interactionType === 'RESPONDED'
                );
            });

            timeEffectiveness[hour.toString()] = hourDeliveries.length > 0
                ? hourResponses.length / hourDeliveries.length
                : 0;
        }

        // Type effectiveness
        const typeEffectiveness: Record<ReminderType, any> = {} as any;

        for (const type of Object.values(ReminderType)) {
            const typeReminders = reminders.filter((r: any) => r.reminderType === type);
            const typeResponses = typeReminders.filter((r: any) => {
                return interactions.some((i: any) => {
                    const delivery = deliveries.find((d: any) => d.reminderScheduleId === r.id);
                    return delivery && i.reminderDeliveryId === delivery.id && i.interactionType === 'RESPONDED';
                });
            });

            const typeResponseTimes = typeResponses.map((reminder: any) => {
                const delivery = deliveries.find((d: any) => d.reminderScheduleId === reminder.id);
                const response = interactions.find((i: any) =>
                    delivery && i.reminderDeliveryId === delivery.id && i.interactionType === 'RESPONDED'
                );

                if (delivery && response && delivery.deliveredAt) {
                    return (new Date(response.timestamp).getTime() - new Date(delivery.deliveredAt).getTime()) / (1000 * 60 * 60);
                }
                return null;
            }).filter((time: any) => time !== null);

            typeEffectiveness[type] = {
                responseRate: typeReminders.length > 0 ? typeResponses.length / typeReminders.length : 0,
                averageResponseTime: typeResponseTimes.length > 0
                    ? typeResponseTimes.reduce((sum: number, time: number) => sum + time, 0) / typeResponseTimes.length
                    : 0,
            };
        }

        return {
            totalReminders,
            deliveryRate,
            openRate,
            clickRate,
            responseRate,
            averageResponseTime,
            escalationRate,
            channelEffectiveness,
            timeEffectiveness,
            typeEffectiveness,
        };
    }
    /**
     * Generate optimization recommendations based on metrics
     */
    private async generateRecommendations(
        organizationId: string,
        metrics: any,
        rawData: any
    ): Promise<ReminderOptimizationRecommendation[]> {
        const recommendations: ReminderOptimizationRecommendation[] = [];

        // Low response rate recommendations
        if (metrics.responseRate < 0.4) {
            recommendations.push({
                id: `response-rate-${organizationId}`,
                type: 'content',
                priority: 'high',
                title: 'Low Response Rate Detected',
                description: `Current response rate is ${(metrics.responseRate * 100).toFixed(1)}%, which is below the recommended 40% threshold.`,
                expectedImprovement: {
                    metric: 'response_rate',
                    value: 15,
                    unit: 'percentage_points',
                },
                implementation: {
                    action: 'optimize_content',
                    parameters: {
                        personalizeSubjects: true,
                        addUrgencyIndicators: true,
                        simplifyCallToAction: true,
                        testMultipleVariants: true,
                    },
                    effort: 'medium',
                },
            });
        }

        // Channel optimization recommendations
        const bestChannel = Object.entries(metrics.channelEffectiveness)
            .sort(([, a], [, b]) => (b as any).responseRate - (a as any).responseRate)[0];

        const worstChannel = Object.entries(metrics.channelEffectiveness)
            .sort(([, a], [, b]) => (a as any).responseRate - (b as any).responseRate)[0];

        if (bestChannel && worstChannel && (bestChannel[1] as any).responseRate > (worstChannel[1] as any).responseRate * 2) {
            recommendations.push({
                id: `channel-optimization-${organizationId}`,
                type: 'channel',
                priority: 'medium',
                title: 'Channel Performance Imbalance',
                description: `${bestChannel[0]} performs ${((bestChannel[1] as any).responseRate / (worstChannel[1] as any).responseRate).toFixed(1)}x better than ${worstChannel[0]}.`,
                expectedImprovement: {
                    metric: 'overall_response_rate',
                    value: 10,
                    unit: 'percentage_points',
                },
                implementation: {
                    action: 'rebalance_channels',
                    parameters: {
                        prioritizeChannel: bestChannel[0],
                        reduceChannel: worstChannel[0],
                        testAlternatives: true,
                    },
                    effort: 'low',
                },
            });
        }

        // Timing optimization recommendations
        const bestHours = Object.entries(metrics.timeEffectiveness)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 3)
            .map(([hour]) => parseInt(hour));

        const currentPeakHour = bestHours[0];
        if (metrics.timeEffectiveness[currentPeakHour.toString()] > 0.6) {
            recommendations.push({
                id: `timing-optimization-${organizationId}`,
                type: 'timing',
                priority: 'medium',
                title: 'Optimal Timing Opportunity',
                description: `Reminders sent at ${currentPeakHour}:00 have ${(metrics.timeEffectiveness[currentPeakHour.toString()] * 100).toFixed(1)}% response rate.`,
                expectedImprovement: {
                    metric: 'response_rate',
                    value: 8,
                    unit: 'percentage_points',
                },
                implementation: {
                    action: 'optimize_timing',
                    parameters: {
                        preferredHours: bestHours,
                        avoidHours: Object.entries(metrics.timeEffectiveness)
                            .filter(([, rate]) => (rate as number) < 0.2)
                            .map(([hour]) => parseInt(hour)),
                    },
                    effort: 'low',
                },
            });
        }

        // Escalation rate recommendations
        if (metrics.escalationRate > 0.3) {
            recommendations.push({
                id: `escalation-rate-${organizationId}`,
                type: 'schedule',
                priority: 'high',
                title: 'High Escalation Rate',
                description: `${(metrics.escalationRate * 100).toFixed(1)}% of reminders are escalating, indicating ineffective initial outreach.`,
                expectedImprovement: {
                    metric: 'escalation_rate',
                    value: -10,
                    unit: 'percentage_points',
                },
                implementation: {
                    action: 'improve_initial_reminders',
                    parameters: {
                        increaseFrequency: true,
                        improvePersonalization: true,
                        addMultipleChannels: true,
                        shortenEscalationDelay: false,
                    },
                    effort: 'high',
                },
            });
        }

        // Response time recommendations
        if (metrics.averageResponseTime > 72) { // More than 3 days
            recommendations.push({
                id: `response-time-${organizationId}`,
                type: 'schedule',
                priority: 'medium',
                title: 'Slow Response Times',
                description: `Average response time is ${metrics.averageResponseTime.toFixed(1)} hours, which may indicate timing or urgency issues.`,
                expectedImprovement: {
                    metric: 'average_response_time',
                    value: -24,
                    unit: 'hours',
                },
                implementation: {
                    action: 'improve_urgency',
                    parameters: {
                        addDeadlineIndicators: true,
                        increaseReminderFrequency: true,
                        improveSubjectLines: true,
                        addProgressIndicators: true,
                    },
                    effort: 'medium',
                },
            });
        }

        // Low delivery rate recommendations
        if (metrics.deliveryRate < 0.9) {
            recommendations.push({
                id: `delivery-rate-${organizationId}`,
                type: 'channel',
                priority: 'high',
                title: 'Low Delivery Rate',
                description: `Only ${(metrics.deliveryRate * 100).toFixed(1)}% of reminders are being delivered successfully.`,
                expectedImprovement: {
                    metric: 'delivery_rate',
                    value: 5,
                    unit: 'percentage_points',
                },
                implementation: {
                    action: 'improve_delivery',
                    parameters: {
                        validateEmailAddresses: true,
                        updateContactInformation: true,
                        implementFallbackChannels: true,
                        monitorBounceRates: true,
                    },
                    effort: 'high',
                },
            });
        }

        return recommendations;
    }

    /**
     * Auto-implement low-risk optimizations
     */
    private async autoImplementOptimizations(
        organizationId: string,
        recommendations: ReminderOptimizationRecommendation[]
    ): Promise<any[]> {
        const autoImplemented: any[] = [];

        // Get organization's auto-optimization settings
        const settings = await this.databaseService.getOrganizationSettings(organizationId);
        const autoOptimizationEnabled = settings?.autoOptimization?.enabled || false;
        const autoApplyLowRisk = settings?.autoOptimization?.autoApplyLowRisk || false;

        if (!autoOptimizationEnabled || !autoApplyLowRisk) {
            return autoImplemented;
        }

        for (const recommendation of recommendations) {
            // Only auto-implement low-effort, low-risk optimizations
            if (recommendation.implementation.effort === 'low' && recommendation.priority !== 'high') {
                try {
                    const result = await this.implementOptimization(organizationId, recommendation);
                    autoImplemented.push({
                        recommendationId: recommendation.id,
                        success: true,
                        result,
                    });
                } catch (error) {
                    autoImplemented.push({
                        recommendationId: recommendation.id,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    });
                }
            }
        }

        return autoImplemented;
    }

    /**
     * Implement a specific optimization recommendation
     */
    private async implementOptimization(
        organizationId: string,
        recommendation: ReminderOptimizationRecommendation
    ): Promise<any> {
        switch (recommendation.implementation.action) {
            case 'optimize_timing':
                return await this.optimizeTiming(organizationId, recommendation.implementation.parameters);

            case 'rebalance_channels':
                return await this.rebalanceChannels(organizationId, recommendation.implementation.parameters);

            case 'optimize_content':
                return await this.optimizeContent(organizationId, recommendation.implementation.parameters);

            default:
                throw new Error(`Unknown optimization action: ${recommendation.implementation.action}`);
        }
    }

    /**
     * Optimize timing based on recommendations
     */
    private async optimizeTiming(organizationId: string, parameters: any): Promise<any> {
        const currentConfig = await this.databaseService.getOrganizationReminderConfig(organizationId);

        const updatedConfig = {
            ...currentConfig,
            schedule: {
                ...currentConfig.schedule,
                preferredHours: parameters.preferredHours,
                avoidHours: parameters.avoidHours,
                businessHoursOnly: true,
            },
            optimization: {
                ...currentConfig.optimization,
                timeOptimization: true,
                lastOptimizedAt: new Date(),
            },
        };

        await this.databaseService.updateOrganizationReminderConfig(organizationId, updatedConfig);

        return {
            action: 'timing_optimized',
            preferredHours: parameters.preferredHours,
            avoidHours: parameters.avoidHours,
        };
    }

    /**
     * Rebalance channels based on effectiveness
     */
    private async rebalanceChannels(organizationId: string, parameters: any): Promise<any> {
        const currentConfig = await this.databaseService.getOrganizationReminderConfig(organizationId);

        const updatedChannels = currentConfig.channels.filter((channel: string) =>
            channel !== parameters.reduceChannel
        );

        // Ensure prioritized channel is first
        if (!updatedChannels.includes(parameters.prioritizeChannel)) {
            updatedChannels.unshift(parameters.prioritizeChannel);
        } else {
            const index = updatedChannels.indexOf(parameters.prioritizeChannel);
            updatedChannels.splice(index, 1);
            updatedChannels.unshift(parameters.prioritizeChannel);
        }

        const updatedConfig = {
            ...currentConfig,
            channels: updatedChannels,
            optimization: {
                ...currentConfig.optimization,
                channelOptimization: true,
                lastOptimizedAt: new Date(),
            },
        };

        await this.databaseService.updateOrganizationReminderConfig(organizationId, updatedConfig);

        return {
            action: 'channels_rebalanced',
            prioritizedChannel: parameters.prioritizeChannel,
            reducedChannel: parameters.reduceChannel,
            newChannelOrder: updatedChannels,
        };
    }

    /**
     * Optimize content based on recommendations
     */
    private async optimizeContent(organizationId: string, parameters: any): Promise<any> {
        const templates = await this.databaseService.getReminderTemplates(organizationId);
        const optimizedTemplates = [];

        for (const template of templates) {
            let updatedContent = template.content;
            let updatedSubject = template.subject;

            if (parameters.personalizeSubjects && !updatedSubject.includes('{{recipientName}}')) {
                updatedSubject = `Hi {{recipientName}}, ${updatedSubject}`;
            }

            if (parameters.addUrgencyIndicators && !updatedContent.includes('urgent')) {
                updatedContent = updatedContent.replace(
                    'Please sign',
                    'Action Required: Please sign'
                );
            }

            if (parameters.simplifyCallToAction) {
                updatedContent = updatedContent.replace(
                    /Please review and sign the document/g,
                    'Sign now'
                );
            }

            await this.databaseService.updateReminderTemplate(template.id, {
                subject: updatedSubject,
                content: updatedContent,
                updatedAt: new Date(),
            });

            optimizedTemplates.push({
                templateId: template.id,
                changes: {
                    subjectPersonalized: parameters.personalizeSubjects,
                    urgencyAdded: parameters.addUrgencyIndicators,
                    callToActionSimplified: parameters.simplifyCallToAction,
                },
            });
        }

        return {
            action: 'content_optimized',
            templatesUpdated: optimizedTemplates.length,
            optimizations: optimizedTemplates,
        };
    }

    /**
     * Update reminder effectiveness in real-time
     */
    private async updateReminderEffectiveness(
        reminderDeliveryId: string,
        interactionType: string
    ): Promise<void> {
        const delivery = await this.databaseService.getReminderDelivery(reminderDeliveryId);
        if (!delivery) return;

        const reminderSchedule = await this.databaseService.getReminderSchedule(delivery.reminderScheduleId);
        if (!reminderSchedule) return;

        // Calculate response time if this is a response
        let responseTime: number | undefined;
        if (interactionType === 'responded' && delivery.deliveredAt) {
            responseTime = (Date.now() - new Date(delivery.deliveredAt).getTime()) / (1000 * 60); // minutes
        }

        // Update effectiveness metrics
        const currentEffectiveness = reminderSchedule.metadata?.effectiveness || {};
        const updatedEffectiveness = {
            ...currentEffectiveness,
            [interactionType]: true,
            responseTime: responseTime || currentEffectiveness.responseTime,
            lastInteraction: new Date(),
        };

        await this.databaseService.updateReminderSchedule(reminderSchedule.id, {
            metadata: {
                ...reminderSchedule.metadata,
                effectiveness: updatedEffectiveness,
            },
        });
    }

    /**
     * Record analytics event
     */
    private async recordAnalyticsEvent(eventData: {
        reminderScheduleId?: string;
        eventType: string;
        eventData: any;
    }): Promise<void> {
        await this.databaseService.createReminderAnalyticsEvent({
            reminderScheduleId: eventData.reminderScheduleId,
            eventType: eventData.eventType,
            eventData: eventData.eventData,
            timestamp: new Date(),
        });
    }

    /**
     * Generate formatted report for different audiences
     */
    private async generateFormattedReport(
        analytics: ReminderAnalytics,
        reportType: string
    ): Promise<any> {
        switch (reportType) {
            case 'executive':
                return this.generateExecutiveReport(analytics);
            case 'operational':
                return this.generateOperationalReport(analytics);
            case 'technical':
                return this.generateTechnicalReport(analytics);
            default:
                return this.generateStandardReport(analytics);
        }
    }

    /**
     * Generate executive summary report
     */
    private generateExecutiveReport(analytics: ReminderAnalytics): any {
        return {
            summary: {
                totalReminders: analytics.metrics.totalReminders,
                responseRate: `${(analytics.metrics.responseRate * 100).toFixed(1)}%`,
                averageResponseTime: `${analytics.metrics.averageResponseTime.toFixed(1)} hours`,
                escalationRate: `${(analytics.metrics.escalationRate * 100).toFixed(1)}%`,
            },
            keyInsights: [
                `Response rate is ${analytics.metrics.responseRate > 0.5 ? 'above' : 'below'} industry average`,
                `Most effective channel: ${this.getBestChannel(analytics.metrics.channelEffectiveness)}`,
                `${analytics.recommendations.filter(r => r.priority === 'high').length} high-priority optimizations available`,
            ],
            recommendations: analytics.recommendations
                .filter(r => r.priority === 'high')
                .map(r => ({
                    title: r.title,
                    impact: r.expectedImprovement,
                    effort: r.implementation.effort,
                })),
        };
    }

    /**
     * Generate operational report
     */
    private generateOperationalReport(analytics: ReminderAnalytics): any {
        return {
            metrics: analytics.metrics,
            channelPerformance: analytics.metrics.channelEffectiveness,
            timeAnalysis: analytics.metrics.timeEffectiveness,
            recommendations: analytics.recommendations,
            actionItems: analytics.recommendations.map(r => ({
                id: r.id,
                title: r.title,
                priority: r.priority,
                action: r.implementation.action,
                parameters: r.implementation.parameters,
                effort: r.implementation.effort,
            })),
        };
    }

    /**
     * Generate technical report
     */
    private generateTechnicalReport(analytics: ReminderAnalytics): any {
        return {
            rawMetrics: analytics.metrics,
            detailedAnalysis: {
                channelEffectiveness: analytics.metrics.channelEffectiveness,
                timeEffectiveness: analytics.metrics.timeEffectiveness,
                typeEffectiveness: analytics.metrics.typeEffectiveness,
            },
            optimizationRecommendations: analytics.recommendations,
            implementationGuide: analytics.recommendations.map(r => ({
                recommendation: r,
                technicalSteps: this.generateTechnicalSteps(r),
                estimatedImpact: r.expectedImprovement,
            })),
        };
    }

    /**
     * Generate standard report
     */
    private generateStandardReport(analytics: ReminderAnalytics): any {
        return {
            period: analytics.timeRange,
            overview: {
                totalReminders: analytics.metrics.totalReminders,
                deliveryRate: analytics.metrics.deliveryRate,
                responseRate: analytics.metrics.responseRate,
                averageResponseTime: analytics.metrics.averageResponseTime,
            },
            performance: {
                channels: analytics.metrics.channelEffectiveness,
                timing: analytics.metrics.timeEffectiveness,
            },
            recommendations: analytics.recommendations.slice(0, 5), // Top 5 recommendations
        };
    }

    /**
     * Helper methods
     */
    private getBestChannel(channelEffectiveness: any): string {
        return Object.entries(channelEffectiveness)
            .sort(([, a], [, b]) => (b as any).responseRate - (a as any).responseRate)[0][0];
    }

    private generateTechnicalSteps(recommendation: ReminderOptimizationRecommendation): string[] {
        const steps = [];

        switch (recommendation.implementation.action) {
            case 'optimize_timing':
                steps.push('Update organization reminder configuration');
                steps.push('Modify scheduling algorithm parameters');
                steps.push('Test with A/B split for validation');
                break;
            case 'rebalance_channels':
                steps.push('Update channel priority configuration');
                steps.push('Modify channel selection logic');
                steps.push('Monitor delivery rates for 7 days');
                break;
            case 'optimize_content':
                steps.push('Update reminder templates');
                steps.push('Implement personalization variables');
                steps.push('A/B test new vs old content');
                break;
        }

        return steps;
    }
}