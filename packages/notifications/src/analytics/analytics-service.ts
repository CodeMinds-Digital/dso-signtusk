import {
    AnalyticsService,
    CommunicationAnalytics,
    EngagementMetrics,
    TemplatePerformanceMetrics,
    AnalyticsFilters,
    AnalyticsReport,
    NotificationChannel,
    NotificationError
} from '../types';
import { Logger } from 'pino';
import { v4 as uuidv4 } from 'uuid';

/**
 * Analytics Service Implementation
 * Provides comprehensive communication analytics with engagement tracking
 */
export class AnalyticsServiceImpl implements AnalyticsService {
    private events: Map<string, CommunicationAnalytics> = new Map();
    private logger: Logger;

    constructor(logger: Logger) {
        this.logger = logger.child({ service: 'analytics' });
        this.logger.info('Analytics service initialized');
    }

    async trackEvent(event: CommunicationAnalytics): Promise<void> {
        try {
            // Validate event
            this.validateEvent(event);

            // Generate ID if not provided
            const eventId = event.id || uuidv4();
            const eventWithId = { ...event, id: eventId };

            // Store event
            this.events.set(eventId, eventWithId);

            this.logger.debug({
                eventId,
                eventType: event.eventType,
                channel: event.channel,
                userId: event.userId,
                organizationId: event.organizationId
            }, 'Analytics event tracked');

        } catch (error) {
            this.logger.error({ error, event }, 'Failed to track analytics event');
            throw new NotificationError(`Failed to track event: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ANALYTICS_ERROR');
        }
    }

    async getEngagementMetrics(filters: AnalyticsFilters): Promise<EngagementMetrics> {
        try {
            const events = this.filterEvents(filters);
            return this.calculateEngagementMetrics(events);
        } catch (error) {
            this.logger.error({ error, filters }, 'Failed to get engagement metrics');
            throw new NotificationError(`Failed to get engagement metrics: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ANALYTICS_ERROR');
        }
    }

    async getTemplatePerformance(templateId: string, timeRange: { start: Date; end: Date }): Promise<TemplatePerformanceMetrics> {
        try {
            const filters: AnalyticsFilters = {
                templateId,
                timeRange
            };

            const events = this.filterEvents(filters);
            const metrics = this.calculateEngagementMetrics(events);

            // Get template info (stub - would come from template service in production)
            const templateName = `Template ${templateId}`;
            const channel = events.length > 0 ? events[0].channel : NotificationChannel.EMAIL;

            // Calculate trends (simplified - would use proper time series analysis in production)
            const trends = this.calculateTrends(events, timeRange, 'day');

            return {
                templateId,
                templateName,
                channel,
                metrics,
                timeRange,
                trends
            };

        } catch (error) {
            this.logger.error({ error, templateId, timeRange }, 'Failed to get template performance');
            throw new NotificationError(`Failed to get template performance: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ANALYTICS_ERROR');
        }
    }

    async getChannelPerformance(channel: NotificationChannel, timeRange: { start: Date; end: Date }): Promise<EngagementMetrics> {
        try {
            const filters: AnalyticsFilters = {
                channel,
                timeRange
            };

            const events = this.filterEvents(filters);
            return this.calculateEngagementMetrics(events);

        } catch (error) {
            this.logger.error({ error, channel, timeRange }, 'Failed to get channel performance');
            throw new NotificationError(`Failed to get channel performance: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ANALYTICS_ERROR');
        }
    }

    async getUserEngagement(userId: string, timeRange: { start: Date; end: Date }): Promise<EngagementMetrics> {
        try {
            const filters: AnalyticsFilters = {
                userId,
                timeRange
            };

            const events = this.filterEvents(filters);
            return this.calculateEngagementMetrics(events);

        } catch (error) {
            this.logger.error({ error, userId, timeRange }, 'Failed to get user engagement');
            throw new NotificationError(`Failed to get user engagement: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ANALYTICS_ERROR');
        }
    }

    async getOrganizationAnalytics(organizationId: string, timeRange: { start: Date; end: Date }): Promise<EngagementMetrics> {
        try {
            const filters: AnalyticsFilters = {
                organizationId,
                timeRange
            };

            const events = this.filterEvents(filters);
            return this.calculateEngagementMetrics(events);

        } catch (error) {
            this.logger.error({ error, organizationId, timeRange }, 'Failed to get organization analytics');
            throw new NotificationError(`Failed to get organization analytics: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ANALYTICS_ERROR');
        }
    }

    async generateReport(filters: AnalyticsFilters): Promise<AnalyticsReport> {
        try {
            this.logger.info({ filters }, 'Generating analytics report');

            const events = this.filterEvents(filters);
            const summary = this.calculateEngagementMetrics(events);

            // Channel breakdown
            const channelBreakdown: Record<NotificationChannel, EngagementMetrics> = {} as any;
            for (const channel of Object.values(NotificationChannel)) {
                const channelEvents = events.filter(e => e.channel === channel);
                channelBreakdown[channel] = this.calculateEngagementMetrics(channelEvents);
            }

            // Template performance
            const templateIds = [...new Set(events.filter(e => e.templateId).map(e => e.templateId!))];
            const templatePerformance: TemplatePerformanceMetrics[] = [];

            for (const templateId of templateIds) {
                const templateEvents = events.filter(e => e.templateId === templateId);
                const metrics = this.calculateEngagementMetrics(templateEvents);
                const channel = templateEvents.length > 0 ? templateEvents[0].channel : NotificationChannel.EMAIL;

                templatePerformance.push({
                    templateId,
                    templateName: `Template ${templateId}`,
                    channel,
                    metrics,
                    timeRange: filters.timeRange,
                    trends: this.calculateTrends(templateEvents, filters.timeRange, filters.groupBy || 'day')
                });
            }

            // Trends
            const trends = this.calculateTrends(events, filters.timeRange, filters.groupBy || 'day');

            // Top performing templates
            const topPerformingTemplates = templatePerformance
                .sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore)
                .slice(0, 10)
                .map(t => ({
                    templateId: t.templateId,
                    templateName: t.templateName,
                    engagementScore: t.metrics.engagementScore
                }));

            // Generate recommendations
            const recommendations = this.generateRecommendations(summary, channelBreakdown, templatePerformance);

            const report: AnalyticsReport = {
                summary,
                channelBreakdown,
                templatePerformance,
                trends,
                topPerformingTemplates,
                recommendations
            };

            this.logger.info({
                eventCount: events.length,
                templateCount: templatePerformance.length,
                recommendationCount: recommendations.length
            }, 'Analytics report generated');

            return report;

        } catch (error) {
            this.logger.error({ error, filters }, 'Failed to generate analytics report');
            throw new NotificationError(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`, 'ANALYTICS_ERROR');
        }
    }

    private validateEvent(event: CommunicationAnalytics): void {
        if (!event.channel) {
            throw new NotificationError('Event channel is required', 'VALIDATION_ERROR');
        }

        if (!event.eventType) {
            throw new NotificationError('Event type is required', 'VALIDATION_ERROR');
        }

        if (!event.timestamp) {
            throw new NotificationError('Event timestamp is required', 'VALIDATION_ERROR');
        }

        const validEventTypes = ['sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed'];
        if (!validEventTypes.includes(event.eventType)) {
            throw new NotificationError(`Invalid event type: ${event.eventType}`, 'VALIDATION_ERROR');
        }
    }

    private filterEvents(filters: AnalyticsFilters): CommunicationAnalytics[] {
        const events = Array.from(this.events.values());

        return events.filter(event => {
            // Time range filter
            if (event.timestamp < filters.timeRange.start || event.timestamp > filters.timeRange.end) {
                return false;
            }

            // Organization filter
            if (filters.organizationId && event.organizationId !== filters.organizationId) {
                return false;
            }

            // User filter
            if (filters.userId && event.userId !== filters.userId) {
                return false;
            }

            // Channel filter
            if (filters.channel && event.channel !== filters.channel) {
                return false;
            }

            // Template filter
            if (filters.templateId && event.templateId !== filters.templateId) {
                return false;
            }

            return true;
        });
    }

    private calculateEngagementMetrics(events: CommunicationAnalytics[]): EngagementMetrics {
        const totalSent = events.filter(e => e.eventType === 'sent').length;
        const totalDelivered = events.filter(e => e.eventType === 'delivered').length;
        const totalOpened = events.filter(e => e.eventType === 'opened').length;
        const totalClicked = events.filter(e => e.eventType === 'clicked').length;
        const totalBounced = events.filter(e => e.eventType === 'bounced').length;
        const totalComplained = events.filter(e => e.eventType === 'complained').length;
        const totalUnsubscribed = events.filter(e => e.eventType === 'unsubscribed').length;

        const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
        const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
        const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;
        const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
        const complaintRate = totalDelivered > 0 ? (totalComplained / totalDelivered) * 100 : 0;
        const unsubscribeRate = totalDelivered > 0 ? (totalUnsubscribed / totalDelivered) * 100 : 0;

        // Calculate engagement score (weighted average)
        const engagementScore = (
            (deliveryRate * 0.2) +
            (openRate * 0.3) +
            (clickRate * 0.4) +
            ((100 - bounceRate) * 0.05) +
            ((100 - complaintRate) * 0.03) +
            ((100 - unsubscribeRate) * 0.02)
        );

        return {
            totalSent,
            totalDelivered,
            totalOpened,
            totalClicked,
            totalBounced,
            totalComplained,
            totalUnsubscribed,
            deliveryRate: Math.round(deliveryRate * 100) / 100,
            openRate: Math.round(openRate * 100) / 100,
            clickRate: Math.round(clickRate * 100) / 100,
            bounceRate: Math.round(bounceRate * 100) / 100,
            complaintRate: Math.round(complaintRate * 100) / 100,
            unsubscribeRate: Math.round(unsubscribeRate * 100) / 100,
            engagementScore: Math.round(engagementScore * 100) / 100
        };
    }

    private calculateTrends(
        events: CommunicationAnalytics[],
        timeRange: { start: Date; end: Date },
        groupBy: 'day' | 'week' | 'month'
    ): { period: string; metrics: EngagementMetrics }[] {
        const trends: { period: string; metrics: EngagementMetrics }[] = [];

        // Simplified trend calculation - in production, use proper time series analysis
        const periods = this.generateTimePeriods(timeRange, groupBy);

        for (const period of periods) {
            const periodEvents = events.filter(e => {
                return e.timestamp >= period.start && e.timestamp < period.end;
            });

            const metrics = this.calculateEngagementMetrics(periodEvents);
            trends.push({
                period: period.label,
                metrics
            });
        }

        return trends;
    }

    private generateTimePeriods(
        timeRange: { start: Date; end: Date },
        groupBy: 'day' | 'week' | 'month'
    ): Array<{ start: Date; end: Date; label: string }> {
        const periods: Array<{ start: Date; end: Date; label: string }> = [];
        const current = new Date(timeRange.start);

        while (current < timeRange.end) {
            const periodStart = new Date(current);
            let periodEnd: Date;
            let label: string;

            switch (groupBy) {
                case 'day':
                    periodEnd = new Date(current);
                    periodEnd.setDate(periodEnd.getDate() + 1);
                    label = periodStart.toISOString().split('T')[0];
                    current.setDate(current.getDate() + 1);
                    break;
                case 'week':
                    periodEnd = new Date(current);
                    periodEnd.setDate(periodEnd.getDate() + 7);
                    label = `Week of ${periodStart.toISOString().split('T')[0]}`;
                    current.setDate(current.getDate() + 7);
                    break;
                case 'month':
                    periodEnd = new Date(current);
                    periodEnd.setMonth(periodEnd.getMonth() + 1);
                    label = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
                    current.setMonth(current.getMonth() + 1);
                    break;
            }

            if (periodEnd > timeRange.end) {
                periodEnd = timeRange.end;
            }

            periods.push({ start: periodStart, end: periodEnd, label });
        }

        return periods;
    }

    private generateRecommendations(
        summary: EngagementMetrics,
        channelBreakdown: Record<NotificationChannel, EngagementMetrics>,
        templatePerformance: TemplatePerformanceMetrics[]
    ): string[] {
        const recommendations: string[] = [];

        // Delivery rate recommendations
        if (summary.deliveryRate < 95) {
            recommendations.push('Consider reviewing your sender reputation and email authentication settings to improve delivery rates.');
        }

        // Open rate recommendations
        if (summary.openRate < 20) {
            recommendations.push('Try A/B testing different subject lines to improve open rates.');
        }

        // Click rate recommendations
        if (summary.clickRate < 3) {
            recommendations.push('Consider improving your email content and call-to-action buttons to increase click rates.');
        }

        // Bounce rate recommendations
        if (summary.bounceRate > 5) {
            recommendations.push('Clean your email list regularly to reduce bounce rates and maintain sender reputation.');
        }

        // Channel-specific recommendations
        const bestChannel = Object.entries(channelBreakdown)
            .sort(([, a], [, b]) => b.engagementScore - a.engagementScore)[0];

        if (bestChannel && bestChannel[1].engagementScore > summary.engagementScore) {
            recommendations.push(`Consider increasing usage of ${bestChannel[0]} channel as it shows higher engagement rates.`);
        }

        // Template recommendations
        const lowPerformingTemplates = templatePerformance.filter(t => t.metrics.engagementScore < 50);
        if (lowPerformingTemplates.length > 0) {
            recommendations.push(`${lowPerformingTemplates.length} templates are underperforming. Consider redesigning or A/B testing them.`);
        }

        // Unsubscribe rate recommendations
        if (summary.unsubscribeRate > 2) {
            recommendations.push('High unsubscribe rate detected. Review your content relevance and sending frequency.');
        }

        return recommendations;
    }

    /**
     * Get real-time analytics dashboard data
     */
    async getDashboardData(organizationId?: string): Promise<{
        todayMetrics: EngagementMetrics;
        weeklyTrend: { period: string; metrics: EngagementMetrics }[];
        topChannels: Array<{ channel: NotificationChannel; metrics: EngagementMetrics }>;
        recentEvents: CommunicationAnalytics[];
    }> {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Today's metrics
        const todayFilters: AnalyticsFilters = {
            organizationId,
            timeRange: { start: todayStart, end: now }
        };
        const todayMetrics = await this.getEngagementMetrics(todayFilters);

        // Weekly trend
        const weeklyFilters: AnalyticsFilters = {
            organizationId,
            timeRange: { start: weekStart, end: now },
            groupBy: 'day'
        };
        const weeklyEvents = this.filterEvents(weeklyFilters);
        const weeklyTrend = this.calculateTrends(weeklyEvents, weeklyFilters.timeRange, 'day');

        // Top channels
        const topChannels: Array<{ channel: NotificationChannel; metrics: EngagementMetrics }> = [];
        for (const channel of Object.values(NotificationChannel)) {
            const channelMetrics = await this.getChannelPerformance(channel, { start: weekStart, end: now });
            topChannels.push({ channel, metrics: channelMetrics });
        }
        topChannels.sort((a, b) => b.metrics.engagementScore - a.metrics.engagementScore);

        // Recent events
        const recentEvents = this.filterEvents({
            organizationId,
            timeRange: { start: new Date(now.getTime() - 24 * 60 * 60 * 1000), end: now }
        }).slice(0, 50);

        return {
            todayMetrics,
            weeklyTrend,
            topChannels,
            recentEvents
        };
    }

    /**
     * Export analytics data
     */
    async exportData(filters: AnalyticsFilters, format: 'json' | 'csv'): Promise<string> {
        const events = this.filterEvents(filters);

        if (format === 'json') {
            return JSON.stringify(events, null, 2);
        } else {
            // CSV export
            const headers = ['id', 'channel', 'eventType', 'timestamp', 'userId', 'organizationId', 'templateId'];
            const csvRows = [headers.join(',')];

            for (const event of events) {
                const row = headers.map(header => {
                    const value = (event as any)[header];
                    return value ? `"${value}"` : '';
                });
                csvRows.push(row.join(','));
            }

            return csvRows.join('\n');
        }
    }
}