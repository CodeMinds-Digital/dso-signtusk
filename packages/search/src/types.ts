import { z } from 'zod';

// Search entity types
export enum SearchEntityType {
    DOCUMENT = 'document',
    TEMPLATE = 'template',
    USER = 'user',
    ORGANIZATION = 'organization',
    SIGNATURE_REQUEST = 'signature_request',
    FOLDER = 'folder',
    AUDIT_LOG = 'audit_log'
}

// Search result relevance scoring
export interface SearchScore {
    total: number;
    textMatch: number;
    fieldMatch: number;
    recency: number;
    popularity: number;
    personalization: number;
}

// Base search document interface
export interface SearchDocument {
    id: string;
    type: SearchEntityType;
    title: string;
    content: string;
    metadata: Record<string, any>;
    organizationId: string;
    userId?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    permissions: string[];
    score?: SearchScore;
}

// Search query schema
export const SearchQuerySchema = z.object({
    query: z.string().optional(),
    entityTypes: z.array(z.nativeEnum(SearchEntityType)).optional(),
    filters: z.record(z.any()).optional(),
    facets: z.array(z.string()).optional(),
    sort: z.object({
        field: z.string(),
        order: z.enum(['asc', 'desc'])
    }).optional(),
    pagination: z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20)
    }).optional(),
    highlight: z.boolean().default(true),
    suggestions: z.boolean().default(true),
    personalize: z.boolean().default(true)
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;

// Facet configuration
export interface FacetConfig {
    field: string;
    type: 'terms' | 'range' | 'date_histogram' | 'nested';
    size?: number;
    ranges?: Array<{ from?: number; to?: number; key: string }>;
    interval?: string;
    nested?: {
        path: string;
        facets: Record<string, FacetConfig>;
    };
}

// Facet result
export interface FacetResult {
    field: string;
    type: string;
    buckets: Array<{
        key: string | number;
        count: number;
        selected?: boolean;
    }>;
}

// Search suggestions
export interface SearchSuggestion {
    text: string;
    type: 'completion' | 'correction' | 'phrase';
    score: number;
    highlight?: string;
}

// Search analytics event
export interface SearchAnalyticsEvent {
    id: string;
    userId?: string;
    organizationId: string;
    query: string;
    entityTypes: SearchEntityType[];
    filters: Record<string, any>;
    resultsCount: number;
    clickedResults: string[];
    searchTime: number;
    timestamp: Date;
    sessionId: string;
}

// Search result
export interface SearchResult {
    documents: SearchDocument[];
    facets: FacetResult[];
    suggestions: SearchSuggestion[];
    total: number;
    page: number;
    limit: number;
    searchTime: number;
    analytics: {
        queryId: string;
        suggestions: SearchSuggestion[];
    };
}

// AI-powered search features
export interface AISearchFeatures {
    semanticSearch: boolean;
    intentRecognition: boolean;
    queryExpansion: boolean;
    personalizedRanking: boolean;
    autoComplete: boolean;
    spellCorrection: boolean;
}

// Search index configuration
export interface SearchIndexConfig {
    name: string;
    entityType: SearchEntityType;
    mappings: Record<string, any>;
    settings: Record<string, any>;
    aliases: string[];
}

// Search service configuration
export interface SearchServiceConfig {
    elasticsearch: {
        nodes: string[];
        auth?: {
            username: string;
            password: string;
        };
        ssl?: {
            ca?: string;
            cert?: string;
            key?: string;
            rejectUnauthorized?: boolean;
        };
        requestTimeout?: number;
        maxRetries?: number;
    };
    indices: SearchIndexConfig[];
    facets: Record<string, FacetConfig>;
    ai: AISearchFeatures;
    analytics: {
        enabled: boolean;
        batchSize: number;
        flushInterval: number;
    };
    cache: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
    };
}

// Search personalization profile
export interface SearchPersonalizationProfile {
    userId: string;
    organizationId: string;
    preferences: {
        entityTypes: SearchEntityType[];
        sortPreference: string;
        facetPreferences: string[];
    };
    behavior: {
        searchHistory: Array<{
            query: string;
            timestamp: Date;
            clickedResults: string[];
        }>;
        clickPatterns: Record<string, number>;
        dwellTime: Record<string, number>;
    };
    contextual: {
        currentProject?: string;
        recentDocuments: string[];
        collaborators: string[];
        workingHours: {
            start: string;
            end: string;
            timezone: string;
        };
    };
}

// Search optimization metrics
export interface SearchMetrics {
    queryPerformance: {
        averageResponseTime: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        throughput: number;
    };
    relevance: {
        clickThroughRate: number;
        meanReciprocalRank: number;
        normalizedDiscountedCumulativeGain: number;
    };
    usage: {
        totalQueries: number;
        uniqueUsers: number;
        topQueries: Array<{ query: string; count: number }>;
        zeroResultQueries: Array<{ query: string; count: number }>;
    };
    indexHealth: {
        documentCount: number;
        indexSize: number;
        shardHealth: string;
        lastIndexed: Date;
    };
}

// Export schemas for validation
export const SearchDocumentSchema = z.object({
    id: z.string(),
    type: z.nativeEnum(SearchEntityType),
    title: z.string(),
    content: z.string(),
    metadata: z.record(z.any()),
    organizationId: z.string(),
    userId: z.string().optional(),
    tags: z.array(z.string()),
    createdAt: z.date(),
    updatedAt: z.date(),
    permissions: z.array(z.string())
});

export const SearchAnalyticsEventSchema = z.object({
    id: z.string(),
    userId: z.string().optional(),
    organizationId: z.string(),
    query: z.string(),
    entityTypes: z.array(z.nativeEnum(SearchEntityType)),
    filters: z.record(z.any()),
    resultsCount: z.number(),
    clickedResults: z.array(z.string()),
    searchTime: z.number(),
    timestamp: z.date(),
    sessionId: z.string()
});