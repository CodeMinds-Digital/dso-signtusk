import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { SearchService } from '../search-service';
import { createDefaultSearchConfig, createDefaultAIConfig } from '../index';

// Mock Elasticsearch client
const mockElasticsearchClient = {
    indices: {
        exists: vi.fn().mockResolvedValue(false),
        create: vi.fn().mockResolvedValue({ acknowledged: true }),
        putMapping: vi.fn().mockResolvedValue({ acknowledged: true }),
        putAlias: vi.fn().mockResolvedValue({ acknowledged: true }),
        stats: vi.fn().mockResolvedValue({
            _all: {
                total: {
                    docs: { count: 1000 },
                    store: { size_in_bytes: 50000000 }
                }
            }
        })
    },
    cluster: {
        health: vi.fn().mockResolvedValue({
            status: 'green',
            number_of_nodes: 3,
            active_shards: 6
        })
    },
    info: vi.fn().mockResolvedValue({
        version: { number: '8.11.0' }
    }),
    index: vi.fn().mockResolvedValue({
        _id: 'test-doc-1',
        result: 'created'
    }),
    bulk: vi.fn().mockResolvedValue({
        errors: false,
        items: []
    }),
    delete: vi.fn().mockResolvedValue({
        result: 'deleted'
    }),
    search: vi.fn().mockResolvedValue({
        hits: {
            total: { value: 10 },
            hits: [
                {
                    _id: 'doc1',
                    _score: 1.5,
                    _source: {
                        id: 'doc1',
                        type: 'document',
                        title: 'Test Document',
                        content: 'This is a test document',
                        organizationId: 'org1',
                        userId: 'user1',
                        tags: ['test', 'document'],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        permissions: ['public'],
                        metadata: {
                            fileType: 'pdf',
                            fileSize: 1024000
                        }
                    }
                }
            ]
        },
        aggregations: {
            type: {
                buckets: [
                    { key: 'document', doc_count: 8 },
                    { key: 'template', doc_count: 2 }
                ]
            }
        },
        suggest: {
            completion_suggest: [{
                options: [
                    { text: 'test document' },
                    { text: 'test template' }
                ]
            }],
            term_suggest: [{
                options: [
                    { text: 'document' }
                ]
            }]
        }
    }),
    updateByQuery: vi.fn().mockResolvedValue({
        updated: 100
    })
};

// Mock the Elasticsearch client
vi.mock('@elastic/elasticsearch', () => ({
    Client: vi.fn().mockImplementation(() => mockElasticsearchClient)
}));

// Global test configuration
export const testConfig = createDefaultSearchConfig(['http://localhost:9200']);
export const testAIConfig = createDefaultAIConfig();

// Global search service instance for tests
export let searchService: SearchService;

beforeAll(async () => {
    // Initialize search service for tests
    searchService = new SearchService(testConfig, testAIConfig);
    await searchService.initialize();
});

afterAll(async () => {
    // Cleanup
    if (searchService) {
        await searchService.shutdown();
    }
});

beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
});

// Test utilities
export const createTestDocument = (overrides = {}) => ({
    id: 'test-doc-1',
    type: 'document' as const,
    title: 'Test Document',
    content: 'This is a test document for search functionality',
    organizationId: 'test-org-1',
    userId: 'test-user-1',
    tags: ['test', 'document', 'search'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    permissions: ['public'],
    metadata: {
        fileType: 'pdf',
        fileSize: 1024000,
        pageCount: 5,
        language: 'en'
    },
    ...overrides
});

export const createTestQuery = (overrides = {}) => ({
    query: 'test document',
    entityTypes: ['document' as const],
    pagination: {
        page: 1,
        limit: 20
    },
    highlight: true,
    suggestions: true,
    personalize: true,
    ...overrides
});

export const createTestPersonalizationProfile = (overrides = {}) => ({
    userId: 'test-user-1',
    organizationId: 'test-org-1',
    preferences: {
        entityTypes: ['document' as const, 'template' as const],
        sortPreference: 'relevance',
        facetPreferences: ['type', 'tags', 'createdAt']
    },
    behavior: {
        searchHistory: [
            {
                query: 'contract template',
                timestamp: new Date('2024-01-01'),
                clickedResults: ['doc1', 'doc2']
            }
        ],
        clickPatterns: {
            'doc1': 5,
            'doc2': 3
        },
        dwellTime: {
            'doc1': 120000, // 2 minutes
            'doc2': 60000   // 1 minute
        }
    },
    contextual: {
        currentProject: 'project-1',
        recentDocuments: ['doc1', 'doc3', 'doc5'],
        collaborators: ['user2', 'user3'],
        workingHours: {
            start: '09:00',
            end: '17:00',
            timezone: 'UTC'
        }
    },
    ...overrides
});