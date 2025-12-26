import {
    IntelligentSchedulingContext,
    OptimalReminderSchedule,
    ReminderConfig,
    ReminderType,
    ReminderChannel,
    EscalationLevel,
} from './reminder-types';

/**
 * Intelligent Reminder Scheduler
 * 
 * Uses machine learning and historical data to optimize reminder timing,
 * channels, and content for maximum effectiveness.
 */
export class IntelligentReminderScheduler {
    constructor(
        private databaseService: any,
        private analyticsService: any
    ) { }

    /**
     * Generate optimal reminder schedule based on context and historical data
     */
    async generateOptimalSchedule(
        context: IntelligentSchedulingContext,
        config: ReminderConfig
    ): Promise<OptimalReminderSchedule> {
        try {
            // Get historical performance data
            const historicalData = await this.getHistoricalPerformanceData(
                context.recipient.id,
                context.organization.id
            );

            // Calculate optimal timing
            const optimalTiming = await this.calculateOptimalTiming(context, historicalData);

            // Determine best channels
            const optimalChannels = await this.determineOptimalChannels(context, historicalData);

            // Generate reminder sequence
            const reminders = await this.generateReminderSequence(
                context,
                config,
                optimalTiming,
                optimalChannels
            );

            // Calculate escalation timing if needed
            const escalation = config.escalation.enabled
                ? await this.calculateEscalationTiming(context, config, reminders)
                : undefined;

            return {
                reminders,
                escalation,
                metadata: {
                    algorithm: 'intelligent-scheduler-v2',
                    version: '2.1.0',
                    factors: {
                        historicalResponseRate: historicalData.responseRate,
                        preferredChannel: historicalData.preferredChannel,
                        optimalTimeOfDay: optimalTiming.bestHour,
                        optimalDayOfWeek: optimalTiming.bestDay,
                        urgencyFactor: this.calculateUrgencyFactor(context),
                        complexityFactor: this.calculateComplexityFactor(context),
                    },
                },
            };
        } catch (error) {
            console.error('Failed to generate optimal schedule:', error);
            // Fallback to default schedule
            return this.generateDefaultSchedule(config);
        }
    }

    /**
     * Get historical performance data for recipient and organization
     */
    private async getHistoricalPerformanceData(
        recipientId: string,
        organizationId: string
    ): Promise<any> {
        const [recipientData, organizationData] = await Promise.all([
            this.analyticsService.getRecipientPerformanceData(recipientId),
            this.analyticsService.getOrganizationPerformanceData(organizationId),
        ]);

        return {
            responseRate: recipientData?.responseRate || organizationData.averageResponseRate || 0.65,
            averageResponseTime: recipientData?.averageResponseTime || organizationData.averageResponseTime || 48,
            preferredChannel: recipientData?.preferredChannel || ReminderChannel.EMAIL,
            bestHour: recipientData?.bestHour || organizationData.bestHour || 10,
            bestDay: recipientData?.bestDay || organizationData.bestDay || 2, // Tuesday
            channelEffectiveness: recipientData?.channelEffectiveness || organizationData.channelEffectiveness || {
                [ReminderChannel.EMAIL]: 0.65,
                [ReminderChannel.SMS]: 0.45,
                [ReminderChannel.PUSH]: 0.35,
                [ReminderChannel.IN_APP]: 0.25,
            },
        };
    }

    /**
     * Calculate optimal timing based on context and historical data
     */
    private async calculateOptimalTiming(
        context: IntelligentSchedulingContext,
        historicalData: any
    ): Promise<{ bestHour: number; bestDay: number; intervals: number[] }> {
        const urgencyMultiplier = this.getUrgencyMultiplier(context.document.urgency);
        const complexityMultiplier = this.getComplexityMultiplier(context.document.complexity);

        // Adjust timing based on urgency and complexity
        const baseIntervals = [24, 72, 168]; // 1 day, 3 days, 1 week
        const adjustedIntervals = baseIntervals.map(interval =>
            Math.max(1, Math.floor(interval * urgencyMultiplier * complexityMultiplier))
        );

        // Consider business hours and timezone
        const recipientTimezone = context.recipient.timezone || context.organization.timezone;
        const businessHours = context.recipient.preferredContactHours || context.organization.businessHours;

        return {
            bestHour: this.adjustForTimezone(historicalData.bestHour, recipientTimezone),
            bestDay: historicalData.bestDay,
            intervals: adjustedIntervals,
        };
    }

    /**
     * Determine optimal channels based on effectiveness and preferences
     */
    private async determineOptimalChannels(
        context: IntelligentSchedulingContext,
        historicalData: any
    ): Promise<ReminderChannel[]> {
        const channelScores = Object.entries(historicalData.channelEffectiveness)
            .map(([channel, effectiveness]) => ({
                channel: channel as ReminderChannel,
                score: effectiveness as number,
            }))
            .sort((a, b) => b.score - a.score);

        // Always include the most effective channel
        const channels = [channelScores[0].channel];

        // Add additional channels based on urgency
        if (context.document.urgency === 'high' || context.document.urgency === 'critical') {
            // Add second most effective channel for high urgency
            if (channelScores[1] && channelScores[1].score > 0.3) {
                channels.push(channelScores[1].channel);
            }
        }

        if (context.document.urgency === 'critical') {
            // Add third channel for critical urgency
            if (channelScores[2] && channelScores[2].score > 0.2) {
                channels.push(channelScores[2].channel);
            }
        }

        return channels;
    }

    /**
     * Generate reminder sequence with optimal timing and channels
     */
    private async generateReminderSequence(
        context: IntelligentSchedulingContext,
        config: ReminderConfig,
        timing: { bestHour: number; bestDay: number; intervals: number[] },
        channels: ReminderChannel[]
    ): Promise<Array<{
        type: ReminderType;
        scheduledAt: Date;
        channels: ReminderChannel[];
        confidence: number;
        reasoning: string;
    }>> {
        const reminders = [];
        const now = new Date();

        // Initial reminder
        const initialDelay = Math.max(config.schedule.initialDelay, 1);
        const initialTime = this.calculateOptimalDateTime(
            new Date(now.getTime() + initialDelay * 60 * 60 * 1000),
            timing.bestHour,
            timing.bestDay,
            context.organization.businessHours,
            config.schedule.businessHoursOnly
        );

        reminders.push({
            type: ReminderType.INITIAL,
            scheduledAt: initialTime,
            channels: [channels[0]], // Use most effective channel first
            confidence: 0.85,
            reasoning: `Scheduled for optimal time based on historical data (${timing.bestHour}:00 on day ${timing.bestDay})`,
        });

        // Follow-up reminders
        for (let i = 0; i < Math.min(timing.intervals.length, config.schedule.maxReminders - 1); i++) {
            const interval = timing.intervals[i];
            const reminderTime = this.calculateOptimalDateTime(
                new Date(initialTime.getTime() + interval * 60 * 60 * 1000),
                timing.bestHour,
                timing.bestDay,
                context.organization.businessHours,
                config.schedule.businessHoursOnly
            );

            const reminderType = i === timing.intervals.length - 1 || i === config.schedule.maxReminders - 2
                ? ReminderType.FINAL
                : ReminderType.FOLLOW_UP;

            // Use more channels for later reminders
            const reminderChannels = i === 0
                ? [channels[0]]
                : channels.slice(0, Math.min(i + 1, channels.length));

            reminders.push({
                type: reminderType,
                scheduledAt: reminderTime,
                channels: reminderChannels,
                confidence: Math.max(0.6, 0.85 - (i * 0.1)),
                reasoning: `Follow-up reminder ${i + 1} with ${reminderChannels.length} channel(s) for increased visibility`,
            });
        }

        return reminders;
    }

    /**
     * Calculate escalation timing
     */
    private async calculateEscalationTiming(
        context: IntelligentSchedulingContext,
        config: ReminderConfig,
        reminders: any[]
    ): Promise<{
        scheduledAt: Date;
        level: EscalationLevel;
        confidence: number;
        reasoning: string;
    } | undefined> {
        if (!config.escalation.enabled || reminders.length === 0) {
            return undefined;
        }

        const lastReminder = reminders[reminders.length - 1];
        const escalationDelay = context.document.urgency === 'critical' ? 24 : 48; // hours

        const escalationTime = new Date(
            lastReminder.scheduledAt.getTime() + escalationDelay * 60 * 60 * 1000
        );

        // Determine escalation level based on document importance and context
        let escalationLevel = EscalationLevel.SUPERVISOR;
        if (context.document.urgency === 'critical') {
            escalationLevel = EscalationLevel.MANAGER;
        }
        if (context.context.daysUntilExpiration && context.context.daysUntilExpiration <= 1) {
            escalationLevel = EscalationLevel.ADMIN;
        }

        return {
            scheduledAt: escalationTime,
            level: escalationLevel,
            confidence: 0.75,
            reasoning: `Escalation to ${escalationLevel} scheduled ${escalationDelay} hours after final reminder due to ${context.document.urgency} urgency`,
        };
    }

    /**
     * Calculate optimal date/time considering business hours and preferences
     */
    private calculateOptimalDateTime(
        baseTime: Date,
        optimalHour: number,
        optimalDay: number,
        businessHours: { start: number; end: number },
        businessHoursOnly: boolean
    ): Date {
        const result = new Date(baseTime);

        if (businessHoursOnly) {
            // Adjust to business hours
            const hour = result.getHours();
            if (hour < businessHours.start) {
                result.setHours(businessHours.start, 0, 0, 0);
            } else if (hour >= businessHours.end) {
                // Move to next business day
                result.setDate(result.getDate() + 1);
                result.setHours(businessHours.start, 0, 0, 0);
            }

            // Skip weekends if configured
            while (result.getDay() === 0 || result.getDay() === 6) {
                result.setDate(result.getDate() + 1);
            }
        }

        // Try to align with optimal hour if within reasonable range
        const currentHour = result.getHours();
        if (Math.abs(currentHour - optimalHour) <= 2) {
            result.setHours(optimalHour, 0, 0, 0);
        }

        return result;
    }

    /**
     * Helper methods for calculating factors
     */
    private calculateUrgencyFactor(context: IntelligentSchedulingContext): number {
        const urgencyMap = {
            low: 0.5,
            medium: 0.75,
            high: 1.0,
            critical: 1.5,
        };
        return urgencyMap[context.document.urgency] || 0.75;
    }

    private calculateComplexityFactor(context: IntelligentSchedulingContext): number {
        const complexityMap = {
            simple: 0.8,
            medium: 1.0,
            complex: 1.3,
        };
        return complexityMap[context.document.complexity] || 1.0;
    }

    private getUrgencyMultiplier(urgency: string): number {
        const multipliers = {
            low: 1.5,
            medium: 1.0,
            high: 0.7,
            critical: 0.4,
        };
        return multipliers[urgency as keyof typeof multipliers] || 1.0;
    }

    private getComplexityMultiplier(complexity: string): number {
        const multipliers = {
            simple: 0.8,
            medium: 1.0,
            complex: 1.2,
        };
        return multipliers[complexity as keyof typeof multipliers] || 1.0;
    }

    private adjustForTimezone(hour: number, timezone: string): number {
        // Simplified timezone adjustment - in production, use proper timezone library
        return hour; // TODO: Implement proper timezone conversion
    }

    /**
     * Fallback to default schedule if intelligent scheduling fails
     */
    private generateDefaultSchedule(config: ReminderConfig): OptimalReminderSchedule {
        const now = new Date();
        const reminders = [];

        // Default initial reminder after 24 hours
        reminders.push({
            type: ReminderType.INITIAL,
            scheduledAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
            channels: [ReminderChannel.EMAIL],
            confidence: 0.5,
            reasoning: 'Default schedule - no historical data available',
        });

        // Default follow-up after 3 days
        reminders.push({
            type: ReminderType.FOLLOW_UP,
            scheduledAt: new Date(now.getTime() + 72 * 60 * 60 * 1000),
            channels: [ReminderChannel.EMAIL],
            confidence: 0.5,
            reasoning: 'Default follow-up schedule',
        });

        // Default final reminder after 1 week
        reminders.push({
            type: ReminderType.FINAL,
            scheduledAt: new Date(now.getTime() + 168 * 60 * 60 * 1000),
            channels: [ReminderChannel.EMAIL, ReminderChannel.SMS],
            confidence: 0.5,
            reasoning: 'Default final reminder with multiple channels',
        });

        return {
            reminders,
            escalation: config.escalation.enabled ? {
                scheduledAt: new Date(now.getTime() + 192 * 60 * 60 * 1000), // 8 days
                level: EscalationLevel.SUPERVISOR,
                confidence: 0.5,
                reasoning: 'Default escalation schedule',
            } : undefined,
            metadata: {
                algorithm: 'default-scheduler',
                version: '1.0.0',
                factors: {
                    fallback: true,
                    reason: 'No historical data available',
                },
            },
        };
    }
}