import pino from 'pino';
import {
    SearchAnalyticsEvent,
    SearchQuery,
    SearchResult,
    SearchMetrics,
    SearchEntityType,
    SearchPersonalizationProfile
} from './types';

const logger = pino({ name: 'search-analytics-service' });

export interface SearchAnalyticsConfig {
    batchSize: number;
    flushInterval: number;
    retentionDays: number;
    enableRealTimeAnalytics: boolean;
    enableMLOptimization: boolean;
}

export interface SearchInsight {
    type: 'query_performance' | 'relevance_issue' | 'zero_results' | 'popular_content' | 'user_behavior';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
    recommendation: string;
    data: Record<string, any>;
    timestamp: Date;
}

export class SearchAnalyticsService {
    private config: SearchAnalyticsConfig;
    private eventBuffer: SearchAnalyticsEvent[] = [];
    private flushTimer?: NodeJS.Timeout;

    constructor(config: Partial<SearchAnalyticsConfig> = {}) {
        this.config = {
            batchSize: 100,
            flushInterval: 30000, // 30 seconds
            retentionDays: 90,
            enableRealTimeAnalytics: true,
            enableMLOptimization: true,
            ...config
        };

        this.startFlushTimer();
    }

    /**
     * Track search event
     */
    async trackSearchEvent(
        query: SearchQuery,
        result: SearchResult,
        userId?: string,
        organizationId?: string,
        sessionId?: string
    ): Promise<void> {
        try {
            const event: SearchAnalyticsEvent = {
                id: this.generateEventId(),
                userId,
                organizationId: organizationId || '',
                query: query.query || '',
                entityTypes: query.entityTypes || [],
                filters: query.filters || {},
                resultsCount: result.total,
                clickedResults: [], // Will be updated when clicks are tracked
                searchTime: result.searchTime,
                timestamp: new Date(),
                sessionId: sessionId || this.generateSessionId()
            };

            this.eventBuffer.push(event);

            if (this.eventBuffer.length >= this.config.batchSize) {
                await this.flushEvents();
            }

            logger.debug({ eventId: event.id }, 'Search event tracked');
        } catch (error) {
            logger.error({ error }, 'Failed to track search event');
        }
    }

    /**
     * Track click event on search result
     */
    async trackClickEvent(
        queryId: string,
        documentId: string,
        position: number,
        userId?: string,
        organizationId?: string
    ): Promise<void> {
        try {
            // Find the corresponding search event and update clicked results
            const event = this.eventBuffer.find(e =>
                e.id === queryId ||
                (e.userId === userId && e.organizationId === organizationId)
            );

            if (event) {
                event.clickedResults.push(documentId);
            }

            // Also track as separate click event for detailed analysis
            const clickEvent = {
                id: this.generateEventId(),
                type: 'click',
                queryId,
                documentId,
                position,
                userId,
                organizationId,
                timestamp: new Date()
            };

            // Store click event (implementation would depend on storage backend)
            logger.debug({ clickEvent }, 'Click event tracked');
        } catch (error) {
            logger.error({ error }, 'Failed to track click event');
        }
    }

    /**
     * Get search metrics for organization
     */
    async getSearchMetrics(
        organizationId: string,
        timeRange: { start: Date; end: Date }
    ): Promise<SearchMetrics> {
        try {
            // This would query the analytics database
            // For now, return mock metrics structure
            return {
                queryPerformance: {
                    averageResponseTime: await this.calculateAverageResponseTime(organizationId, timeRange),
                    p95ResponseTime: await this.calculatePercentileResponseTime(organizationId, timeRange, 95),
                    p99ResponseTime: await this.calculatePercentileResponseTime(organizationId, timeRange, 99),
                    throughput: await this.calculateThroughput(organizationId, timeRange)
                },
                relevance: {
                    clickThroughRate: await this.calculateClickThroughRate(organizationId, timeRange),
                    meanReciprocalRank: await this.calculateMeanReciprocalRank(organizationId, timeRange),
                    normalizedDiscountedCumulativeGain: await this.calculateNDCG(organizationId, timeRange)
                },
                usage: {
                    totalQueries: await this.getTotalQueries(organizationId, timeRange),
                    uniqueUsers: await this.getUniqueUsers(organizationId, timeRange),
                    topQueries: await this.getTopQueries(organizationId, timeRange),
                    zeroResultQueries: await this.getZeroResultQueries(organizationId, timeRange)
                },
                indexHealth: {
                    documentCount: 0, // Would be fetched from Elasticsearch
                    indexSize: 0,
                    shardHealth: 'green',
                    lastIndexed: new Date()
                }
            };
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to get search metrics');
            throw error;
        }
    }

    /**
     * Generate search insights and recommendations
     */
    async generateSearchInsights(
        organizationId: string,
        timeRange: { start: Date; end: Date }
    ): Promise<SearchInsight[]> {
        try {
            const insights: SearchInsight[] = [];

            // Analyze query performance
            const performanceInsights = await this.analyzeQueryPerformance(organizationId, timeRange);
            insights.push(...performanceInsights);

            // Analyze relevance issues
            const relevanceInsights = await this.analyzeRelevanceIssues(organizationId, timeRange);
            insights.push(...relevanceInsights);

            // Analyze zero result queries
            const zeroResultInsights = await this.analyzeZeroResultQueries(organizationId, timeRange);
            insights.push(...zeroResultInsights);

            // Analyze popular content
            const popularContentInsights = await this.analyzePopularContent(organizationId, timeRange);
            insights.push(...popularContentInsights);

            // Analyze user behavior patterns
            const behaviorInsights = await this.analyzeUserBehavior(organizationId, timeRange);
            insights.push(...behaviorInsights);

            return insights.sort((a, b) => {
                const impactOrder = { high: 3, medium: 2, low: 1 };
                return impactOrder[b.impact] - impactOrder[a.impact];
            });
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to generate search insights');
            return [];
        }
    }

    /**
     * Get personalization profile for user
     */
    async getPersonalizationProfile(userId: string, organizationId: string): Promise<SearchPersonalizationProfile> {
        try {
            // This would query user behavior data
            // For now, return a basic profile structure
            return {
                userId,
                organizationId,
                preferences: {
                    entityTypes: [SearchEntityType.DOCUMENT, SearchEntityType.TEMPLATE],
                    sortPreference: 'relevance',
                    facetPreferences: ['type', 'tags', 'createdAt']
                },
                behavior: {
                    searchHistory: [],
                    clickPatterns: {},
                    dwellTime: {}
                },
                contextual: {
                    recentDocuments: [],
                    collaborators: [],
                    workingHours: {
                        start: '09:00',
                        end: '17:00',
                        timezone: 'UTC'
                    }
                }
            };
        } catch (error) {
            logger.error({ error, userId }, 'Failed to get personalization profile');
            throw error;
        }
    }

    /**
     * Update personalization profile based on user behavior
     */
    async updatePersonalizationProfile(
        userId: string,
        organizationId: string,
        behaviorData: Partial<SearchPersonalizationProfile['behavior']>
    ): Promise<void> {
        try {
            // This would update the user's personalization profile
            logger.debug({ userId, behaviorData }, 'Personalization profile updated');
        } catch (error) {
            logger.error({ error, userId }, 'Failed to update personalization profile');
        }
    }

    /**
     * Get search optimization recommendations using ML
     */
    async getMLOptimizationRecommendations(organizationId: string): Promise<Array<{
        type: string;
        description: string;
        expectedImprovement: number;
        implementation: string;
    }>> {
        if (!this.config.enableMLOptimization) {
            return [];
        }

        try {
            // This would use ML models to analyze search patterns and suggest optimizations
            const recommendations = [
                {
                    type: 'query_expansion',
                    description: 'Add synonyms for common terms to improve recall',
                    expectedImprovement: 15,
                    implementation: 'Configure synonym analyzer with domain-specific terms'
                },
                {
                    type: 'boosting_optimization',
                    description: 'Adjust field boosting based on click patterns',
                    expectedImprovement: 12,
                    implementation: 'Increase title field boost to 4x, reduce content boost to 1.5x'
                },
                {
                    type: 'facet_optimization',
                    description: 'Reorder facets based on usage patterns',
                    expectedImprovement: 8,
                    implementation: 'Move "type" and "tags" facets to top, hide low-usage facets'
                }
            ];

            return recommendations;
        } catch (error) {
            logger.error({ error }, 'Failed to get ML optimization recommendations');
            return [];
        }
    }

    /**
     * Flush buffered events to storage
     */
    private async flushEvents(): Promise<void> {
        if (this.eventBuffer.length === 0) return;

        try {
            const events = [...this.eventBuffer];
            this.eventBuffer = [];

            // Store events in analytics database
            // Implementation would depend on chosen storage backend (e.g., ClickHouse, BigQuery)
            logger.info({ count: events.length }, 'Flushed search analytics events');
        } catch (error) {
            logger.error({ error }, 'Failed to flush analytics events');
            // Re-add events to buffer for retry
            this.eventBuffer.unshift(...this.eventBuffer);
        }
    }

    /**
     * Start flush timer
     */
    private startFlushTimer(): void {
        this.flushTimer = setInterval(() => {
            this.flushEvents();
        }, this.config.flushInterval);
    }

    /**
     * Stop flush timer
     */
    public stopFlushTimer(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
    }

    // Analytics calculation methods (would be implemented with actual data queries)

    private async calculateAverageResponseTime(organizationId: string, timeRange: { start: Date; end: Date }): Promise<number> {
        // Implementation would query analytics database
        return 150; // Mock value in milliseconds
    }

    private async calculatePercentileResponseTime(organizationId: string, timeRange: { start: Date; end: Date }, percentile: number): Promise<number> {
        // Implementation would query analytics database
        return percentile === 95 ? 300 : 500; // Mock values
    }

    private async calculateThroughput(organizationId: string, timeRange: { start: Date; end: Date }): Promise<number> {
        // Implementation would query analytics database
        return 25.5; // Mock value in queries per second
    }

    private async calculateClickThroughRate(organizationId: string, timeRange: { start: Date; end: Date }): Promise<number> {
        // Implementation would query analytics database
        return 0.65; // Mock value (65%)
    }

    private async calculateMeanReciprocalRank(organizationId: string, timeRange: { start: Date; end: Date }): Promise<number> {
        // Implementation would query analytics database
        return 0.78; // Mock value
    }

    private async calculateNDCG(organizationId: string, timeRange: { start: Date; end: Date }): Promise<number> {
        // Implementation would query analytics database
        return 0.82; // Mock value
    }

    private async getTotalQueries(organizationId: string, timeRange: { start: Date; end: Date }): Promise<number> {
        // Implementation would query analytics database
        return 15420; // Mock value
    }

    private async getUniqueUsers(organizationId: string, timeRange: { start: Date; end: Date }): Promise<number> {
        // Implementation would query analytics database
        return 342; // Mock value
    }

    private async getTopQueries(organizationId: string, timeRange: { start: Date; end: Date }): Promise<Array<{ query: string; count: number }>> {
        // Implementation would query analytics database
        return [
            { query: 'contract template', count: 156 },
            { query: 'invoice', count: 134 },
            { query: 'NDA', count: 98 }
        ];
    }

    private async getZeroResultQueries(organizationId: string, timeRange: { start: Date; end: Date }): Promise<Array<{ query: string; count: number }>> {
        // Implementation would query analytics database
        return [
            { query: 'quarterly report 2024', count: 23 },
            { query: 'employee handbook v3', count: 18 }
        ];
    }

    // Insight analysis methods

    private async analyzeQueryPerformance(organizationId: string, timeRange: { start: Date; end: Date }): Promise<SearchInsight[]> {
        const insights: SearchInsight[] = [];

        // Mock performance analysis
        const avgResponseTime = await this.calculateAverageResponseTime(organizationId, timeRange);

        if (avgResponseTime > 200) {
            insights.push({
                type: 'query_performance',
                title: 'Slow Query Performance Detected',
                description: `Average response time is ${avgResponseTime}ms, which exceeds the 200ms target`,
                impact: 'high',
                recommendation: 'Consider optimizing index mappings and query structure',
                data: { averageResponseTime: avgResponseTime, target: 200 },
                timestamp: new Date()
            });
        }

        return insights;
    }

    private async analyzeRelevanceIssues(organizationId: string, timeRange: { start: Date; end: Date }): Promise<SearchInsight[]> {
        const insights: SearchInsight[] = [];

        const ctr = await this.calculateClickThroughRate(organizationId, timeRange);

        if (ctr < 0.5) {
            insights.push({
                type: 'relevance_issue',
                title: 'Low Click-Through Rate',
                description: `Click-through rate is ${(ctr * 100).toFixed(1)}%, indicating potential relevance issues`,
                impact: 'medium',
                recommendation: 'Review and adjust search result ranking algorithms',
                data: { clickThroughRate: ctr, target: 0.6 },
                timestamp: new Date()
            });
        }

        return insights;
    }

    private async analyzeZeroResultQueries(organizationId: string, timeRange: { start: Date; end: Date }): Promise<SearchInsight[]> {
        const insights: SearchInsight[] = [];

        const zeroResultQueries = await this.getZeroResultQueries(organizationId, timeRange);

        if (zeroResultQueries.length > 0) {
            insights.push({
                type: 'zero_results',
                title: 'High Number of Zero-Result Queries',
                description: `${zeroResultQueries.length} queries returned no results, indicating content gaps`,
                impact: 'medium',
                recommendation: 'Review zero-result queries and consider adding relevant content or improving query handling',
                data: { zeroResultQueries: zeroResultQueries.slice(0, 5) },
                timestamp: new Date()
            });
        }

        return insights;
    }

    private async analyzePopularContent(organizationId: string, timeRange: { start: Date; end: Date }): Promise<SearchInsight[]> {
        const insights: SearchInsight[] = [];

        const topQueries = await this.getTopQueries(organizationId, timeRange);

        if (topQueries.length > 0) {
            insights.push({
                type: 'popular_content',
                title: 'Popular Search Terms Identified',
                description: `Top search terms indicate high demand for specific content types`,
                impact: 'low',
                recommendation: 'Consider creating more content around popular search terms',
                data: { topQueries: topQueries.slice(0, 5) },
                timestamp: new Date()
            });
        }

        return insights;
    }

    private async analyzeUserBehavior(organizationId: string, timeRange: { start: Date; end: Date }): Promise<SearchInsight[]> {
        const insights: SearchInsight[] = [];

        // Mock user behavior analysis
        insights.push({
            type: 'user_behavior',
            title: 'Search Pattern Analysis',
            description: 'Users frequently search for documents but rarely use advanced filters',
            impact: 'low',
            recommendation: 'Improve discoverability of advanced search features',
            data: { filterUsage: 0.15, documentSearches: 0.78 },
            timestamp: new Date()
        });

        return insights;
    }

    private generateEventId(): string {
        return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}