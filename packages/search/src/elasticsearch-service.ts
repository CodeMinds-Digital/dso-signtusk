import { Client } from '@elastic/elasticsearch';
import pino from 'pino';
import {
    SearchServiceConfig,
    SearchDocument,
    SearchQuery,
    SearchResult,
    SearchEntityType,
    FacetResult,
    SearchIndexConfig,
    SearchMetrics
} from './types';

const logger = pino({ name: 'elasticsearch-service' });

export class ElasticsearchService {
    private client: Client;
    private config: SearchServiceConfig;

    constructor(config: SearchServiceConfig) {
        this.config = config;
        this.client = new Client({
            nodes: config.elasticsearch.nodes,
            auth: config.elasticsearch.auth,
            tls: config.elasticsearch.ssl,
            requestTimeout: config.elasticsearch.requestTimeout || 30000,
            maxRetries: config.elasticsearch.maxRetries || 3
        });
    }

    /**
     * Initialize Elasticsearch indices and mappings
     */
    async initialize(): Promise<void> {
        try {
            logger.info('Initializing Elasticsearch indices...');

            for (const indexConfig of this.config.indices) {
                await this.createIndex(indexConfig);
            }

            logger.info('Elasticsearch initialization completed');
        } catch (error) {
            logger.error({ error }, 'Failed to initialize Elasticsearch');
            throw error;
        }
    }

    /**
     * Create or update an index with mappings and settings
     */
    private async createIndex(config: SearchIndexConfig): Promise<void> {
        try {
            const exists = await this.client.indices.exists({ index: config.name });

            if (!exists) {
                await this.client.indices.create({
                    index: config.name,
                    body: {
                        mappings: config.mappings,
                        settings: config.settings
                    }
                });
                logger.info({ index: config.name }, 'Created Elasticsearch index');
            } else {
                // Update mappings if index exists
                await this.client.indices.putMapping({
                    index: config.name,
                    body: config.mappings
                });
                logger.info({ index: config.name }, 'Updated Elasticsearch index mappings');
            }

            // Create aliases
            for (const alias of config.aliases) {
                await this.client.indices.putAlias({
                    index: config.name,
                    name: alias
                });
            }
        } catch (error) {
            logger.error({ error, index: config.name }, 'Failed to create/update index');
            throw error;
        }
    }

    /**
     * Index a document
     */
    async indexDocument(document: SearchDocument): Promise<void> {
        try {
            const indexName = this.getIndexName(document.type);

            await this.client.index({
                index: indexName,
                id: document.id,
                body: {
                    ...document,
                    indexed_at: new Date().toISOString()
                }
            });

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
            const body = documents.flatMap(doc => [
                {
                    index: {
                        _index: this.getIndexName(doc.type),
                        _id: doc.id
                    }
                },
                {
                    ...doc,
                    indexed_at: new Date().toISOString()
                }
            ]);

            const response = await this.client.bulk({ body });

            if (response.errors) {
                const errors = response.items
                    .filter(item => item.index?.error)
                    .map(item => item.index?.error);
                logger.error({ errors }, 'Bulk indexing errors occurred');
            }

            logger.info({ count: documents.length }, 'Bulk indexed documents');
        } catch (error) {
            logger.error({ error }, 'Failed to bulk index documents');
            throw error;
        }
    }

    /**
     * Delete a document
     */
    async deleteDocument(id: string, type: SearchEntityType): Promise<void> {
        try {
            const indexName = this.getIndexName(type);

            await this.client.delete({
                index: indexName,
                id
            });

            logger.debug({ documentId: id, type }, 'Document deleted');
        } catch (error) {
            if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode !== 404) {
                logger.error({ error, documentId: id }, 'Failed to delete document');
                throw error;
            }
        }
    }

    /**
     * Search documents with advanced features
     */
    async search(query: SearchQuery, organizationId: string, userId?: string): Promise<SearchResult> {
        const startTime = Date.now();

        try {
            const searchBody = this.buildSearchQuery(query, organizationId, userId);
            const indices = this.getSearchIndices(query.entityTypes);

            const response = await this.client.search({
                index: indices.join(','),
                body: searchBody
            });

            const searchTime = Date.now() - startTime;

            return this.parseSearchResponse(response, query, searchTime);
        } catch (error) {
            logger.error({ error, query }, 'Search failed');
            throw error;
        }
    }

    /**
     * Build Elasticsearch query from search parameters
     */
    private buildSearchQuery(query: SearchQuery, organizationId: string, userId?: string): any {
        const must: any[] = [
            // Organization filter
            { term: { organizationId } }
        ];

        const should: any[] = [];
        const filter: any[] = [];

        // Text query
        if (query.query) {
            must.push({
                multi_match: {
                    query: query.query,
                    fields: [
                        'title^3',
                        'content^2',
                        'tags^2',
                        'metadata.description^1.5',
                        'metadata.*'
                    ],
                    type: 'best_fields',
                    fuzziness: 'AUTO',
                    operator: 'and'
                }
            });

            // Boost exact matches
            should.push({
                multi_match: {
                    query: query.query,
                    fields: ['title^5', 'content^3'],
                    type: 'phrase',
                    boost: 2
                }
            });
        }

        // Entity type filters
        if (query.entityTypes && query.entityTypes.length > 0) {
            filter.push({
                terms: { type: query.entityTypes }
            });
        }

        // Custom filters
        if (query.filters) {
            Object.entries(query.filters).forEach(([field, value]) => {
                if (Array.isArray(value)) {
                    filter.push({ terms: { [field]: value } });
                } else if (typeof value === 'object' && value.from !== undefined || value.to !== undefined) {
                    filter.push({ range: { [field]: value } });
                } else {
                    filter.push({ term: { [field]: value } });
                }
            });
        }

        // Permission filter (user can only see documents they have access to)
        if (userId) {
            should.push(
                { term: { userId } },
                { terms: { permissions: ['public', `user:${userId}`, `org:${organizationId}`] } }
            );
        }

        const searchBody: any = {
            query: {
                bool: {
                    must,
                    should,
                    filter,
                    minimum_should_match: should.length > 0 ? 1 : 0
                }
            },
            highlight: query.highlight ? {
                fields: {
                    title: {},
                    content: { fragment_size: 150, number_of_fragments: 3 },
                    'metadata.*': {}
                },
                pre_tags: ['<mark>'],
                post_tags: ['</mark>']
            } : undefined,
            sort: this.buildSortClause(query),
            from: ((query.pagination?.page || 1) - 1) * (query.pagination?.limit || 20),
            size: query.pagination?.limit || 20
        };

        // Add facets/aggregations
        if (query.facets && query.facets.length > 0) {
            searchBody.aggs = this.buildFacetAggregations(query.facets);
        }

        return searchBody;
    }

    /**
     * Build sort clause for search query
     */
    private buildSortClause(query: SearchQuery): any[] {
        const sort: any[] = [];

        if (query.sort) {
            sort.push({ [query.sort.field]: { order: query.sort.order } });
        }

        // Default relevance and recency scoring
        if (query.query) {
            sort.push('_score');
        }

        sort.push({ updatedAt: { order: 'desc' } });

        return sort;
    }

    /**
     * Build facet aggregations
     */
    private buildFacetAggregations(facetFields: string[]): Record<string, any> {
        const aggs: Record<string, any> = {};

        facetFields.forEach(field => {
            const facetConfig = this.config.facets[field];
            if (!facetConfig) return;

            switch (facetConfig.type) {
                case 'terms':
                    aggs[field] = {
                        terms: {
                            field: facetConfig.field,
                            size: facetConfig.size || 10
                        }
                    };
                    break;

                case 'range':
                    aggs[field] = {
                        range: {
                            field: facetConfig.field,
                            ranges: facetConfig.ranges || []
                        }
                    };
                    break;

                case 'date_histogram':
                    aggs[field] = {
                        date_histogram: {
                            field: facetConfig.field,
                            calendar_interval: facetConfig.interval || 'month'
                        }
                    };
                    break;

                case 'nested':
                    if (facetConfig.nested) {
                        aggs[field] = {
                            nested: {
                                path: facetConfig.nested.path
                            },
                            aggs: this.buildFacetAggregations(Object.keys(facetConfig.nested.facets))
                        };
                    }
                    break;
            }
        });

        return aggs;
    }

    /**
     * Parse Elasticsearch response into SearchResult
     */
    private parseSearchResponse(response: any, query: SearchQuery, searchTime: number): SearchResult {
        const documents: SearchDocument[] = response.hits.hits.map((hit: any) => ({
            ...hit._source,
            score: {
                total: hit._score || 0,
                textMatch: hit._score || 0,
                fieldMatch: 0,
                recency: 0,
                popularity: 0,
                personalization: 0
            },
            highlight: hit.highlight
        }));

        const facets: FacetResult[] = [];
        if (response.aggregations) {
            Object.entries(response.aggregations).forEach(([field, agg]: [string, any]) => {
                facets.push({
                    field,
                    type: this.config.facets[field]?.type || 'terms',
                    buckets: agg.buckets?.map((bucket: any) => ({
                        key: bucket.key,
                        count: bucket.doc_count
                    })) || []
                });
            });
        }

        return {
            documents,
            facets,
            suggestions: [], // Will be populated by AI service
            total: response.hits.total.value,
            page: query.pagination?.page || 1,
            limit: query.pagination?.limit || 20,
            searchTime,
            analytics: {
                queryId: this.generateQueryId(),
                suggestions: []
            }
        };
    }

    /**
     * Get search suggestions
     */
    async getSuggestions(query: string, organizationId: string): Promise<string[]> {
        try {
            const response = await this.client.search({
                index: this.getAllIndices().join(','),
                body: {
                    suggest: {
                        text: query,
                        completion_suggest: {
                            completion: {
                                field: 'suggest',
                                size: 10,
                                contexts: {
                                    organizationId: [organizationId]
                                }
                            }
                        },
                        term_suggest: {
                            term: {
                                field: 'title',
                                size: 5
                            }
                        }
                    },
                    size: 0
                }
            });

            const suggestions: string[] = [];

            // Extract completion suggestions
            if (response.suggest?.completion_suggest?.[0]?.options) {
                const completionOptions = response.suggest.completion_suggest[0].options;
                if (Array.isArray(completionOptions)) {
                    completionOptions.forEach((option: any) => {
                        suggestions.push(option.text);
                    });
                }
            }

            // Extract term suggestions
            if (response.suggest?.term_suggest) {
                response.suggest.term_suggest.forEach((termSuggestion: any) => {
                    if (termSuggestion.options && Array.isArray(termSuggestion.options)) {
                        termSuggestion.options.forEach((option: any) => {
                            suggestions.push(option.text);
                        });
                    }
                });
            }

            return [...new Set(suggestions)]; // Remove duplicates
        } catch (error) {
            logger.error({ error, query }, 'Failed to get suggestions');
            return [];
        }
    }

    /**
     * Get search metrics and analytics
     */
    async getSearchMetrics(organizationId: string): Promise<SearchMetrics> {
        try {
            const indices = this.getAllIndices();

            // Get index stats
            const statsResponse = await this.client.indices.stats({
                index: indices.join(',')
            });

            // Get cluster health
            const healthResponse = await this.client.cluster.health({
                index: indices.join(',')
            });

            return {
                queryPerformance: {
                    averageResponseTime: 0, // Would be calculated from analytics
                    p95ResponseTime: 0,
                    p99ResponseTime: 0,
                    throughput: 0
                },
                relevance: {
                    clickThroughRate: 0,
                    meanReciprocalRank: 0,
                    normalizedDiscountedCumulativeGain: 0
                },
                usage: {
                    totalQueries: 0,
                    uniqueUsers: 0,
                    topQueries: [],
                    zeroResultQueries: []
                },
                indexHealth: {
                    documentCount: statsResponse._all?.total?.docs?.count || 0,
                    indexSize: statsResponse._all?.total?.store?.size_in_bytes || 0,
                    shardHealth: healthResponse.status,
                    lastIndexed: new Date()
                }
            };
        } catch (error) {
            logger.error({ error }, 'Failed to get search metrics');
            throw error;
        }
    }

    /**
     * Reindex all documents for an organization
     */
    async reindexOrganization(organizationId: string): Promise<void> {
        try {
            logger.info({ organizationId }, 'Starting organization reindex');

            const indices = this.getAllIndices();

            for (const index of indices) {
                await this.client.updateByQuery({
                    index,
                    body: {
                        query: {
                            term: { organizationId }
                        },
                        script: {
                            source: 'ctx._source.indexed_at = params.timestamp',
                            params: {
                                timestamp: new Date().toISOString()
                            }
                        }
                    }
                });
            }

            logger.info({ organizationId }, 'Organization reindex completed');
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to reindex organization');
            throw error;
        }
    }

    /**
     * Health check for Elasticsearch cluster
     */
    async healthCheck(): Promise<{ status: string; details: any }> {
        try {
            const health = await this.client.cluster.health();
            const info = await this.client.info();

            return {
                status: health.status === 'green' ? 'healthy' : 'degraded',
                details: {
                    cluster: health,
                    version: info.version.number,
                    indices: this.config.indices.length
                }
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }

    /**
     * Get index name for entity type
     */
    private getIndexName(type: SearchEntityType): string {
        const config = this.config.indices.find(idx => idx.entityType === type);
        return config?.name || `search-${type}`;
    }

    /**
     * Get search indices for entity types
     */
    private getSearchIndices(entityTypes?: SearchEntityType[]): string[] {
        if (!entityTypes || entityTypes.length === 0) {
            return this.getAllIndices();
        }

        return entityTypes.map(type => this.getIndexName(type));
    }

    /**
     * Get all configured indices
     */
    private getAllIndices(): string[] {
        return this.config.indices.map(idx => idx.name);
    }

    /**
     * Generate unique query ID for analytics
     */
    private generateQueryId(): string {
        return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}