// Main search service
export { SearchService } from './search-service';

// Individual services
export { ElasticsearchService } from './elasticsearch-service';
export { FacetedSearchService } from './faceted-search-service';
export { SearchAnalyticsService } from './search-analytics-service';
export { AISearchService } from './ai-search-service';

// Types and interfaces
export * from './types';

// Import SearchEntityType for use in configuration
import { SearchEntityType } from './types';

// Configuration helpers
export const createDefaultSearchConfig = (elasticsearchNodes: string[]) => ({
    elasticsearch: {
        nodes: elasticsearchNodes,
        requestTimeout: 30000,
        maxRetries: 3
    },
    indices: [
        {
            name: 'search-documents',
            entityType: SearchEntityType.DOCUMENT,
            mappings: {
                properties: {
                    id: { type: 'keyword' },
                    type: { type: 'keyword' },
                    title: {
                        type: 'text',
                        analyzer: 'standard',
                        fields: {
                            keyword: { type: 'keyword' },
                            suggest: {
                                type: 'completion',
                                contexts: [
                                    {
                                        name: 'organizationId',
                                        type: 'category'
                                    }
                                ]
                            }
                        }
                    },
                    content: {
                        type: 'text',
                        analyzer: 'standard'
                    },
                    organizationId: { type: 'keyword' },
                    userId: { type: 'keyword' },
                    tags: { type: 'keyword' },
                    createdAt: { type: 'date' },
                    updatedAt: { type: 'date' },
                    permissions: { type: 'keyword' },
                    metadata: {
                        type: 'object',
                        properties: {
                            fileType: { type: 'keyword' },
                            fileSize: { type: 'long' },
                            pageCount: { type: 'integer' },
                            language: { type: 'keyword' },
                            category: { type: 'keyword' },
                            industry: { type: 'keyword' },
                            author: { type: 'keyword' },
                            description: { type: 'text' }
                        }
                    }
                }
            },
            settings: {
                number_of_shards: 3,
                number_of_replicas: 1,
                analysis: {
                    analyzer: {
                        standard: {
                            type: 'standard',
                            stopwords: '_english_'
                        }
                    }
                }
            },
            aliases: ['documents']
        },
        {
            name: 'search-templates',
            entityType: SearchEntityType.TEMPLATE,
            mappings: {
                properties: {
                    id: { type: 'keyword' },
                    type: { type: 'keyword' },
                    title: {
                        type: 'text',
                        analyzer: 'standard',
                        fields: {
                            keyword: { type: 'keyword' },
                            suggest: {
                                type: 'completion',
                                contexts: [
                                    {
                                        name: 'organizationId',
                                        type: 'category'
                                    }
                                ]
                            }
                        }
                    },
                    content: { type: 'text' },
                    organizationId: { type: 'keyword' },
                    userId: { type: 'keyword' },
                    tags: { type: 'keyword' },
                    createdAt: { type: 'date' },
                    updatedAt: { type: 'date' },
                    permissions: { type: 'keyword' },
                    isPublic: { type: 'boolean' },
                    metadata: {
                        type: 'object',
                        properties: {
                            category: { type: 'keyword' },
                            industry: { type: 'keyword' },
                            complexity: { type: 'keyword' },
                            usage_count: { type: 'integer' }
                        }
                    }
                }
            },
            settings: {
                number_of_shards: 2,
                number_of_replicas: 1
            },
            aliases: ['templates']
        },
        {
            name: 'search-users',
            entityType: SearchEntityType.USER,
            mappings: {
                properties: {
                    id: { type: 'keyword' },
                    type: { type: 'keyword' },
                    title: { type: 'text' },
                    content: { type: 'text' },
                    organizationId: { type: 'keyword' },
                    tags: { type: 'keyword' },
                    createdAt: { type: 'date' },
                    updatedAt: { type: 'date' },
                    permissions: { type: 'keyword' },
                    isActive: { type: 'boolean' },
                    metadata: {
                        type: 'object',
                        properties: {
                            role: { type: 'keyword' },
                            department: { type: 'keyword' },
                            location: { type: 'keyword' }
                        }
                    }
                }
            },
            settings: {
                number_of_shards: 1,
                number_of_replicas: 1
            },
            aliases: ['users']
        }
    ],
    facets: {
        type: {
            field: 'type',
            type: 'terms' as const,
            size: 10
        },
        tags: {
            field: 'tags',
            type: 'terms' as const,
            size: 20
        },
        createdAt: {
            field: 'createdAt',
            type: 'date_histogram' as const,
            interval: 'month'
        },
        'metadata.fileType': {
            field: 'metadata.fileType',
            type: 'terms' as const,
            size: 15
        },
        'metadata.category': {
            field: 'metadata.category',
            type: 'terms' as const,
            size: 15
        },
        'metadata.fileSize': {
            field: 'metadata.fileSize',
            type: 'range' as const,
            ranges: [
                { to: 1000000, key: 'small' },
                { from: 1000000, to: 10000000, key: 'medium' },
                { from: 10000000, key: 'large' }
            ]
        }
    },
    ai: {
        semanticSearch: true,
        intentRecognition: true,
        queryExpansion: true,
        personalizedRanking: true,
        autoComplete: true,
        spellCorrection: true
    },
    analytics: {
        enabled: true,
        batchSize: 100,
        flushInterval: 30000
    },
    cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 1000
    }
});

export const createDefaultAIConfig = () => ({
    features: {
        semanticSearch: true,
        intentRecognition: true,
        queryExpansion: true,
        personalizedRanking: true,
        autoComplete: true,
        spellCorrection: true
    },
    semanticSearch: {
        enabled: true,
        embeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
        similarityThreshold: 0.7
    },
    intentRecognition: {
        enabled: true,
        confidenceThreshold: 0.6
    },
    queryExpansion: {
        enabled: true,
        synonyms: {
            'contract': ['agreement', 'deal', 'pact'],
            'document': ['file', 'paper', 'record'],
            'template': ['form', 'format', 'pattern'],
            'invoice': ['bill', 'receipt', 'statement'],
            'user': ['person', 'individual', 'member'],
            'create': ['make', 'generate', 'build'],
            'find': ['search', 'locate', 'discover'],
            'recent': ['latest', 'new', 'current'],
            'old': ['previous', 'past', 'former']
        },
        maxExpansions: 5
    },
    personalizedRanking: {
        enabled: true,
        userWeightFactor: 0.3,
        recencyWeightFactor: 0.2,
        popularityWeightFactor: 0.1
    },
    autoComplete: {
        enabled: true,
        maxSuggestions: 10,
        minQueryLength: 2
    },
    spellCorrection: {
        enabled: true,
        maxDistance: 2,
        suggestions: 5
    }
});