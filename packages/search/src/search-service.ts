import pino from 'pino';
import {
    SearchServiceConfig,
    SearchQuery,
    SearchResult,
    SearchDocument,
    SearchEntityType,
    SearchPersonalizationProfile,
    SearchMetrics,
    SearchSuggestion
} from './types';
import { ElasticsearchService } from './elasticsearch-service';
import { FacetedSearchService } from './faceted-search-service';
import { SearchAnalyticsService } from './search-analytics-service';
import { AISearchService, AISearchConfig } from './ai-search-service';

const logger = pino({ name: 'search-service' });

export class SearchService {
    private elasticsearchService: ElasticsearchService;
    private facetedSearchService: FacetedSearchService;
    private analyticsService: SearchAnalyticsService;
    private aiSearchService: AISearchService;
    private config: SearchServiceConfig;

    constructor(config: SearchServiceConfig, aiConfig?: Partial<AISearchConfig>) {
        this.config = config;

        // Initialize core services
        this.elasticsearchService = new ElasticsearchService(config);
        this.facetedSearchService = new FacetedSearchService(this.elasticsearchService);
        this.analyticsService = new SearchAnalyticsService(config.analytics);
        this.aiSearchService = new AISearchService(aiConfig);
    }

    /**
     * Initialize the search service
     */
    async initialize(): Promise<void> {
        try {
            logger.info('Initializing search service...');

            await this.elasticsearchService.initialize();

            logger.info('Search service initialized successfully');
        } catch (error) {
            logger.error({ error }, 'Failed to initialize search service');
            throw error;
        }
    }

    /**
     * Perform comprehensive search with all AI features
     */
    async search(
        query: SearchQuery,
        organizationId: string,
        userId?: string,
        sessionId?: string
    ): Promise<SearchResult> {
        const startTime = Date.now();

        try {
            logger.debug({ query, organizationId, userId }, 'Starting search');

            // Get user personalization profile
            let personalizationProfile: SearchPersonalizationProfile | undefined;
            if (userId && this.config.ai.personalizedRanking) {
                try {
                    personalizationProfile = await this.analyticsService.getPersonalizationProfile(userId, organizationId);
                } catch (error) {
                    logger.warn({ error, userId }, 'Failed to get personalization profile');
                }
            }

            // Enhance query with AI features
            let enhancedQuery = query;
            if (this.config.ai.semanticSearch || this.config.ai.intentRecognition || this.config.ai.queryExpansion) {
                enhancedQuery = await this.aiSearchService.enhanceQuery(query, personalizationProfile);
            }

            // Perform faceted search
            let searchResult = await this.facetedSearchService.search(enhancedQuery, organizationId, userId);

            // Enhance results with AI features
            if (this.config.ai.personalizedRanking || this.config.ai.semanticSearch) {
                searchResult = await this.aiSearchService.enhanceResults(searchResult, enhancedQuery, personalizationProfile);
            }

            // Track analytics
            if (this.config.analytics.enabled) {
                await this.analyticsService.trackSearchEvent(
                    query,
                    searchResult,
                    userId,
                    organizationId,
                    sessionId
                );
            }

            const totalTime = Date.now() - startTime;
            searchResult.searchTime = totalTime;

            logger.debug({
                query: query.query,
                resultsCount: searchResult.total,
                searchTime: totalTime
            }, 'Search completed');

            return searchResult;
        } catch (error) {
            logger.error({ error, query }, 'Search failed');
            throw error;
        }
    }

    /**
     * Get search suggestions and auto-complete
     */
    async getSuggestions(
        query: string,
        organizationId: string,
        userId?: string
    ): Promise<SearchSuggestion[]> {
        try {
            const suggestions: SearchSuggestion[] = [];

            // Get Elasticsearch suggestions
            const esSuggestions = await this.elasticsearchService.getSuggestions(query, organizationId);
            suggestions.push(...esSuggestions.map(text => ({
                text,
                type: 'completion' as const,
                score: 0.8
            })));

            // Get AI-powered suggestions
            if (this.config.ai.autoComplete) {
                let personalizationProfile: SearchPersonalizationProfile | undefined;
                if (userId) {
                    try {
                        personalizationProfile = await this.analyticsService.getPersonalizationProfile(userId, organizationId);
                    } catch (error) {
                        logger.warn({ error, userId }, 'Failed to get personalization profile for suggestions');
                    }
                }

                const aiSuggestions = await this.aiSearchService.generateSuggestions(
                    {
                        query,
                        highlight: false,
                        suggestions: true,
                        personalize: false
                    },
                    { documents: [], facets: [], suggestions: [], total: 0, page: 1, limit: 20, searchTime: 0, analytics: { queryId: '', suggestions: [] } },
                    personalizationProfile
                );
                suggestions.push(...aiSuggestions);
            }

            // Remove duplicates and sort by score
            const uniqueSuggestions = suggestions
                .filter((suggestion, index, self) =>
                    index === self.findIndex(s => s.text === suggestion.text)
                )
                .sort((a, b) => b.score - a.score)
                .slice(0, 10);

            return uniqueSuggestions;
        } catch (error) {
            logger.error({ error, query }, 'Failed to get suggestions');
            return [];
        }
    }

    /**
     * Index a document for search
     */
    async indexDocument(document: SearchDocument): Promise<void> {
        try {
            await this.elasticsearchService.indexDocument(document);
            logger.debug({ documentId: document.id, type: document.type }, 'Document indexed');
        } catch (error) {
            logger.error({ error, documentId: document.id }, 'Failed to index document');
            throw error;
        }
    }

    /**
     * Bulk index documents
     */
    async bulkIndexDocuments(documents: SearchDocument[]): Promise<void> {
        try {
            await this.elasticsearchService.bulkIndexDocuments(documents);
            logger.info({ count: documents.length }, 'Documents bulk indexed');
        } catch (error) {
            logger.error({ error, count: documents.length }, 'Failed to bulk index documents');
            throw error;
        }
    }

    /**
     * Delete a document from search index
     */
    async deleteDocument(id: string, type: SearchEntityType): Promise<void> {
        try {
            await this.elasticsearchService.deleteDocument(id, type);
            logger.debug({ documentId: id, type }, 'Document deleted from index');
        } catch (error) {
            logger.error({ error, documentId: id }, 'Failed to delete document from index');
            throw error;
        }
    }

    /**
     * Track click event for analytics and personalization
     */
    async trackClick(
        queryId: string,
        documentId: string,
        position: number,
        userId?: string,
        organizationId?: string
    ): Promise<void> {
        try {
            if (this.config.analytics.enabled) {
                await this.analyticsService.trackClickEvent(queryId, documentId, position, userId, organizationId);
            }

            // Update personalization profile
            if (userId && organizationId) {
                await this.analyticsService.updatePersonalizationProfile(userId, organizationId, {
                    clickPatterns: { [documentId]: 1 }
                });
            }

            logger.debug({ queryId, documentId, position }, 'Click event tracked');
        } catch (error) {
            logger.error({ error, queryId, documentId }, 'Failed to track click event');
        }
    }

    /**
     * Get search metrics and analytics
     */
    async getSearchMetrics(
        organizationId: string,
        timeRange: { start: Date; end: Date }
    ): Promise<SearchMetrics> {
        try {
            const [analyticsMetrics, elasticsearchMetrics] = await Promise.all([
                this.analyticsService.getSearchMetrics(organizationId, timeRange),
                this.elasticsearchService.getSearchMetrics(organizationId)
            ]);

            // Merge metrics from different sources
            return {
                ...analyticsMetrics,
                indexHealth: elasticsearchMetrics.indexHealth
            };
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to get search metrics');
            throw error;
        }
    }

    /**
     * Get search insights and optimization recommendations
     */
    async getSearchInsights(
        organizationId: string,
        timeRange: { start: Date; end: Date }
    ): Promise<Array<{
        type: string;
        title: string;
        description: string;
        impact: 'high' | 'medium' | 'low';
        recommendation: string;
        data: Record<string, any>;
        timestamp: Date;
    }>> {
        try {
            const [analyticsInsights, mlRecommendations] = await Promise.all([
                this.analyticsService.generateSearchInsights(organizationId, timeRange),
                this.analyticsService.getMLOptimizationRecommendations(organizationId)
            ]);

            // Convert ML recommendations to insights format
            const mlInsights = mlRecommendations.map(rec => ({
                type: rec.type,
                title: `ML Optimization: ${rec.type.replace('_', ' ').toUpperCase()}`,
                description: rec.description,
                impact: rec.expectedImprovement > 10 ? 'high' as const : 'medium' as const,
                recommendation: rec.implementation,
                data: { expectedImprovement: rec.expectedImprovement },
                timestamp: new Date()
            }));

            return [...analyticsInsights, ...mlInsights];
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to get search insights');
            return [];
        }
    }

    /**
     * Reindex all documents for an organization
     */
    async reindexOrganization(organizationId: string): Promise<void> {
        try {
            logger.info({ organizationId }, 'Starting organization reindex');
            await this.elasticsearchService.reindexOrganization(organizationId);
            logger.info({ organizationId }, 'Organization reindex completed');
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to reindex organization');
            throw error;
        }
    }

    /**
     * Get facet suggestions for query building
     */
    async getFacetSuggestions(
        query: SearchQuery,
        organizationId: string
    ): Promise<Array<{ field: string; label: string; type: string; priority: number }>> {
        try {
            return await this.facetedSearchService.getFacetSuggestions(query, organizationId);
        } catch (error) {
            logger.error({ error, query }, 'Failed to get facet suggestions');
            return [];
        }
    }

    /**
     * Update user personalization profile
     */
    async updatePersonalizationProfile(
        userId: string,
        organizationId: string,
        profileUpdates: Partial<SearchPersonalizationProfile>
    ): Promise<void> {
        try {
            await this.analyticsService.updatePersonalizationProfile(
                userId,
                organizationId,
                profileUpdates.behavior || {}
            );
            logger.debug({ userId, organizationId }, 'Personalization profile updated');
        } catch (error) {
            logger.error({ error, userId }, 'Failed to update personalization profile');
            throw error;
        }
    }

    /**
     * Health check for all search components
     */
    async healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        components: Record<string, { status: string; details?: any }>;
    }> {
        try {
            const elasticsearchHealth = await this.elasticsearchService.healthCheck();

            const components = {
                elasticsearch: elasticsearchHealth,
                analytics: { status: 'healthy' },
                ai: { status: 'healthy' },
                facets: { status: 'healthy' }
            };

            const overallStatus = Object.values(components).every(c => c.status === 'healthy')
                ? 'healthy'
                : Object.values(components).some(c => c.status === 'unhealthy')
                    ? 'unhealthy'
                    : 'degraded';

            return {
                status: overallStatus,
                components
            };
        } catch (error) {
            logger.error({ error }, 'Health check failed');
            return {
                status: 'unhealthy',
                components: {
                    elasticsearch: { status: 'unhealthy', details: { error: error instanceof Error ? error.message : 'Unknown error' } },
                    analytics: { status: 'unknown' },
                    ai: { status: 'unknown' },
                    facets: { status: 'unknown' }
                }
            };
        }
    }

    /**
     * Shutdown the search service gracefully
     */
    async shutdown(): Promise<void> {
        try {
            logger.info('Shutting down search service...');

            // Stop analytics flush timer
            this.analyticsService.stopFlushTimer();

            logger.info('Search service shutdown completed');
        } catch (error) {
            logger.error({ error }, 'Error during search service shutdown');
        }
    }
}