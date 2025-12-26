import pino from 'pino';
import {
    SearchQuery,
    SearchResult,
    FacetConfig,
    FacetResult,
    SearchEntityType,
    SearchDocument
} from './types';
import { ElasticsearchService } from './elasticsearch-service';

const logger = pino({ name: 'faceted-search-service' });

export interface FacetedSearchOptions {
    dynamicFacets: boolean;
    maxFacetValues: number;
    facetMinCount: number;
    hierarchicalFacets: string[];
    rangeFacets: Record<string, { min: number; max: number; step: number }>;
}

export class FacetedSearchService {
    private elasticsearchService: ElasticsearchService;
    private options: FacetedSearchOptions;

    constructor(
        elasticsearchService: ElasticsearchService,
        options: Partial<FacetedSearchOptions> = {}
    ) {
        this.elasticsearchService = elasticsearchService;
        this.options = {
            dynamicFacets: true,
            maxFacetValues: 50,
            facetMinCount: 1,
            hierarchicalFacets: ['categories', 'tags'],
            rangeFacets: {
                fileSize: { min: 0, max: 100000000, step: 1000000 }, // 1MB steps
                createdAt: { min: 0, max: Date.now(), step: 86400000 }, // 1 day steps
                pageCount: { min: 1, max: 1000, step: 10 }
            },
            ...options
        };
    }

    /**
     * Perform faceted search with dynamic facet generation
     */
    async search(query: SearchQuery, organizationId: string, userId?: string): Promise<SearchResult> {
        try {
            // Enhance query with dynamic facets if enabled
            if (this.options.dynamicFacets && (!query.facets || query.facets.length === 0)) {
                query.facets = await this.generateDynamicFacets(query, organizationId);
            }

            // Perform the search
            const result = await this.elasticsearchService.search(query, organizationId, userId);

            // Enhance facets with additional metadata
            result.facets = await this.enhanceFacets(result.facets, query, organizationId);

            // Add hierarchical facet support
            result.facets = this.processHierarchicalFacets(result.facets);

            // Add range facet support
            result.facets = this.processRangeFacets(result.facets, query);

            return result;
        } catch (error) {
            logger.error({ error, query }, 'Faceted search failed');
            throw error;
        }
    }

    /**
     * Generate dynamic facets based on search context and data distribution
     */
    private async generateDynamicFacets(query: SearchQuery, organizationId: string): Promise<string[]> {
        try {
            const facets: string[] = [];

            // Always include common facets
            facets.push('type', 'tags', 'userId', 'createdAt');

            // Add entity-specific facets
            if (query.entityTypes) {
                for (const entityType of query.entityTypes) {
                    facets.push(...this.getEntitySpecificFacets(entityType));
                }
            }

            // Add facets based on data distribution analysis
            const distributionFacets = await this.analyzeDataDistribution(organizationId, query.entityTypes);
            facets.push(...distributionFacets);

            // Remove duplicates and limit count
            return [...new Set(facets)].slice(0, 10);
        } catch (error) {
            logger.error({ error }, 'Failed to generate dynamic facets');
            return ['type', 'tags', 'createdAt']; // Fallback facets
        }
    }

    /**
     * Get entity-specific facets
     */
    private getEntitySpecificFacets(entityType: SearchEntityType): string[] {
        const facetMap: Record<SearchEntityType, string[]> = {
            [SearchEntityType.DOCUMENT]: [
                'metadata.fileType',
                'metadata.fileSize',
                'metadata.pageCount',
                'metadata.language',
                'status'
            ],
            [SearchEntityType.TEMPLATE]: [
                'metadata.category',
                'metadata.industry',
                'metadata.complexity',
                'isPublic',
                'usage_count'
            ],
            [SearchEntityType.USER]: [
                'metadata.role',
                'metadata.department',
                'metadata.location',
                'isActive'
            ],
            [SearchEntityType.ORGANIZATION]: [
                'metadata.industry',
                'metadata.size',
                'metadata.plan',
                'metadata.region'
            ],
            [SearchEntityType.SIGNATURE_REQUEST]: [
                'status',
                'metadata.priority',
                'metadata.deadline',
                'recipientCount'
            ],
            [SearchEntityType.FOLDER]: [
                'metadata.access_level',
                'metadata.project',
                'documentCount'
            ],
            [SearchEntityType.AUDIT_LOG]: [
                'metadata.action',
                'metadata.severity',
                'metadata.source'
            ]
        };

        return facetMap[entityType] || [];
    }

    /**
     * Analyze data distribution to suggest relevant facets
     */
    private async analyzeDataDistribution(
        organizationId: string,
        entityTypes?: SearchEntityType[]
    ): Promise<string[]> {
        try {
            // This would analyze the actual data distribution in Elasticsearch
            // For now, return commonly useful facets
            const suggestedFacets: string[] = [];

            // Analyze field cardinality and distribution
            const analysisQuery = {
                query: { term: { organizationId } },
                aggs: {
                    field_analysis: {
                        terms: {
                            field: '_field_names',
                            size: 100
                        }
                    }
                },
                size: 0
            };

            // This would be implemented with actual Elasticsearch field analysis
            // For now, return static suggestions based on entity types
            if (!entityTypes || entityTypes.includes(SearchEntityType.DOCUMENT)) {
                suggestedFacets.push('metadata.fileType', 'metadata.language');
            }

            if (!entityTypes || entityTypes.includes(SearchEntityType.TEMPLATE)) {
                suggestedFacets.push('metadata.category', 'isPublic');
            }

            return suggestedFacets;
        } catch (error) {
            logger.error({ error }, 'Failed to analyze data distribution');
            return [];
        }
    }

    /**
     * Enhance facets with additional metadata and filtering options
     */
    private async enhanceFacets(
        facets: FacetResult[],
        query: SearchQuery,
        organizationId: string
    ): Promise<FacetResult[]> {
        return facets.map(facet => {
            // Mark selected facet values
            if (query.filters && query.filters[facet.field]) {
                const selectedValues = Array.isArray(query.filters[facet.field])
                    ? query.filters[facet.field]
                    : [query.filters[facet.field]];

                facet.buckets = facet.buckets.map(bucket => ({
                    ...bucket,
                    selected: selectedValues.includes(bucket.key)
                }));
            }

            // Filter out low-count buckets
            facet.buckets = facet.buckets.filter(bucket => bucket.count >= this.options.facetMinCount);

            // Limit number of facet values
            facet.buckets = facet.buckets.slice(0, this.options.maxFacetValues);

            return facet;
        });
    }

    /**
     * Process hierarchical facets (e.g., categories with subcategories)
     */
    private processHierarchicalFacets(facets: FacetResult[]): FacetResult[] {
        return facets.map(facet => {
            if (this.options.hierarchicalFacets.includes(facet.field)) {
                // Process hierarchical structure
                facet.buckets = this.buildHierarchy(facet.buckets);
            }
            return facet;
        });
    }

    /**
     * Build hierarchical structure from flat facet buckets
     */
    private buildHierarchy(buckets: Array<{ key: string | number; count: number; selected?: boolean }>): any[] {
        const hierarchy: any[] = [];
        const bucketMap = new Map();

        // Group buckets by hierarchy level (assuming delimiter like "category > subcategory")
        buckets.forEach(bucket => {
            const key = String(bucket.key);
            const parts = key.split(' > ');

            if (parts.length === 1) {
                // Top-level category
                if (!bucketMap.has(parts[0])) {
                    bucketMap.set(parts[0], {
                        key: parts[0],
                        count: bucket.count,
                        selected: bucket.selected,
                        children: []
                    });
                    hierarchy.push(bucketMap.get(parts[0]));
                } else {
                    bucketMap.get(parts[0]).count += bucket.count;
                }
            } else {
                // Subcategory
                const parent = parts[0];
                const child = parts[1];

                if (!bucketMap.has(parent)) {
                    bucketMap.set(parent, {
                        key: parent,
                        count: 0,
                        children: []
                    });
                    hierarchy.push(bucketMap.get(parent));
                }

                bucketMap.get(parent).children.push({
                    key: child,
                    count: bucket.count,
                    selected: bucket.selected,
                    fullPath: key
                });
                bucketMap.get(parent).count += bucket.count;
            }
        });

        return hierarchy;
    }

    /**
     * Process range facets with intelligent bucketing
     */
    private processRangeFacets(facets: FacetResult[], query: SearchQuery): FacetResult[] {
        return facets.map(facet => {
            const rangeConfig = this.options.rangeFacets[facet.field];

            if (rangeConfig && facet.type === 'range') {
                // Generate intelligent range buckets
                facet.buckets = this.generateRangeBuckets(rangeConfig, facet.buckets);
            }

            return facet;
        });
    }

    /**
     * Generate intelligent range buckets
     */
    private generateRangeBuckets(
        config: { min: number; max: number; step: number },
        existingBuckets: Array<{ key: string | number; count: number }>
    ): Array<{ key: string | number; count: number }> {
        const buckets: Array<{ key: string | number; count: number }> = [];

        // Create range buckets
        for (let i = config.min; i < config.max; i += config.step) {
            const rangeEnd = Math.min(i + config.step, config.max);
            const key = `${i}-${rangeEnd}`;

            // Find matching count from existing buckets
            const matchingBucket = existingBuckets.find(bucket => {
                const bucketKey = String(bucket.key);
                return bucketKey === key || bucketKey.includes(`${i}`) || bucketKey.includes(`${rangeEnd}`);
            });

            buckets.push({
                key,
                count: matchingBucket?.count || 0
            });
        }

        return buckets.filter(bucket => bucket.count > 0);
    }

    /**
     * Get facet suggestions based on search context
     */
    async getFacetSuggestions(
        query: SearchQuery,
        organizationId: string
    ): Promise<Array<{ field: string; label: string; type: string; priority: number }>> {
        try {
            const suggestions: Array<{ field: string; label: string; type: string; priority: number }> = [];

            // Analyze current search context
            const contextFacets = await this.analyzeSearchContext(query, organizationId);

            // Add context-based suggestions
            contextFacets.forEach((facet, index) => {
                suggestions.push({
                    field: facet,
                    label: this.getFacetLabel(facet),
                    type: this.getFacetType(facet),
                    priority: 10 - index
                });
            });

            // Add commonly used facets
            const commonFacets = ['type', 'tags', 'createdAt', 'userId'];
            commonFacets.forEach((facet, index) => {
                if (!suggestions.find(s => s.field === facet)) {
                    suggestions.push({
                        field: facet,
                        label: this.getFacetLabel(facet),
                        type: this.getFacetType(facet),
                        priority: 5 - index
                    });
                }
            });

            return suggestions.sort((a, b) => b.priority - a.priority);
        } catch (error) {
            logger.error({ error }, 'Failed to get facet suggestions');
            return [];
        }
    }

    /**
     * Analyze search context to suggest relevant facets
     */
    private async analyzeSearchContext(query: SearchQuery, organizationId: string): Promise<string[]> {
        const contextFacets: string[] = [];

        // Analyze query text for context clues
        if (query.query) {
            const queryLower = query.query.toLowerCase();

            // Document-related keywords
            if (queryLower.includes('pdf') || queryLower.includes('document') || queryLower.includes('file')) {
                contextFacets.push('metadata.fileType', 'metadata.fileSize');
            }

            // Template-related keywords
            if (queryLower.includes('template') || queryLower.includes('form')) {
                contextFacets.push('metadata.category', 'isPublic');
            }

            // Time-related keywords
            if (queryLower.includes('recent') || queryLower.includes('today') || queryLower.includes('yesterday')) {
                contextFacets.push('createdAt', 'updatedAt');
            }

            // User-related keywords
            if (queryLower.includes('user') || queryLower.includes('author') || queryLower.includes('creator')) {
                contextFacets.push('userId', 'metadata.role');
            }
        }

        // Analyze entity types
        if (query.entityTypes) {
            query.entityTypes.forEach(entityType => {
                contextFacets.push(...this.getEntitySpecificFacets(entityType));
            });
        }

        return [...new Set(contextFacets)];
    }

    /**
     * Get human-readable label for facet field
     */
    private getFacetLabel(field: string): string {
        const labelMap: Record<string, string> = {
            'type': 'Content Type',
            'tags': 'Tags',
            'createdAt': 'Created Date',
            'updatedAt': 'Modified Date',
            'userId': 'Author',
            'metadata.fileType': 'File Type',
            'metadata.fileSize': 'File Size',
            'metadata.pageCount': 'Page Count',
            'metadata.language': 'Language',
            'metadata.category': 'Category',
            'metadata.industry': 'Industry',
            'metadata.role': 'Role',
            'metadata.department': 'Department',
            'status': 'Status',
            'isPublic': 'Visibility',
            'isActive': 'Active Status'
        };

        return labelMap[field] || field.replace(/^metadata\./, '').replace(/([A-Z])/g, ' $1').trim();
    }

    /**
     * Get facet type for proper UI rendering
     */
    private getFacetType(field: string): string {
        if (field.includes('Date') || field.includes('At')) return 'date';
        if (field.includes('Size') || field.includes('Count')) return 'range';
        if (field.includes('is') || field.includes('Active')) return 'boolean';
        return 'terms';
    }
}