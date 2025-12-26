import { Context, Next } from 'hono';
import { createHash } from 'node:crypto';
import { CacheService } from '@signtusk/cache';

/**
 * Cache configuration options
 */
export interface CacheOptions {
    /** Cache TTL in seconds */
    ttl?: number;
    /** Cache key prefix */
    keyPrefix?: string;
    /** Whether to vary cache by user */
    varyByUser?: boolean;
    /** Whether to vary cache by organization */
    varyByOrganization?: boolean;
    /** Custom cache key generator */
    keyGenerator?: (c: Context) => string;
    /** Condition to determine if response should be cached */
    shouldCache?: (c: Context, response: Response) => boolean;
    /** Custom ETag generator */
    etagGenerator?: (content: string) => string;
    /** Whether to enable conditional requests (ETags) */
    enableConditionalRequests?: boolean;
    /** Cache tags for invalidation */
    tags?: string[];
    /** Whether to add cache headers for CDN */
    enableCDNHeaders?: boolean;
    /** CDN cache TTL in seconds */
    cdnTtl?: number;
}

/**
 * Default cache configuration
 */
const DEFAULT_CACHE_OPTIONS: Required<Omit<CacheOptions, 'keyGenerator' | 'shouldCache' | 'etagGenerator' | 'tags'>> = {
    ttl: 300, // 5 minutes
    keyPrefix: 'api:cache:',
    varyByUser: false,
    varyByOrganization: false,
    enableConditionalRequests: true,
    enableCDNHeaders: false,
    cdnTtl: 3600, // 1 hour
};

/**
 * Cache metadata interface
 */
interface CacheMetadata {
    etag: string;
    timestamp: number;
    contentType: string;
    tags?: string[];
    userId?: string;
    organizationId?: string;
}

/**
 * Cached response interface
 */
interface CachedResponse {
    body: string;
    status: number;
    headers: Record<string, string>;
    metadata: CacheMetadata;
}

/**
 * Create response caching middleware
 */
export function createCacheMiddleware(
    cacheService: CacheService,
    options: CacheOptions = {}
) {
    const config = { ...DEFAULT_CACHE_OPTIONS, ...options };

    return async (c: Context, next: Next) => {
        // Only cache GET requests
        if (c.req.method !== 'GET') {
            return next();
        }

        // Generate cache key
        const cacheKey = generateCacheKey(c, config);

        // Check for cached response
        const cachedResponse = await getCachedResponse(cacheService, cacheKey);

        if (cachedResponse) {
            // Handle conditional requests (ETags)
            if (config.enableConditionalRequests) {
                const ifNoneMatch = c.req.header('If-None-Match');
                if (ifNoneMatch && ifNoneMatch === cachedResponse.metadata.etag) {
                    return c.text('', 304, {
                        'ETag': cachedResponse.metadata.etag,
                        'Cache-Control': getCacheControlHeader(config),
                    });
                }
            }

            // Return cached response
            const headers: Record<string, string> = {
                ...cachedResponse.headers,
                'X-Cache': 'HIT',
                'X-Cache-Key': cacheKey,
            };

            if (config.enableConditionalRequests) {
                headers['ETag'] = cachedResponse.metadata.etag;
            }

            if (config.enableCDNHeaders) {
                headers['Cache-Control'] = getCDNCacheControlHeader(config);
                headers['Vary'] = getVaryHeader(config);
            }

            return c.text(cachedResponse.body, cachedResponse.status, headers);
        }

        // Execute the request
        await next();

        // Check if response should be cached
        if (!shouldCacheResponse(c, c.res, config)) {
            return;
        }

        // Cache the response
        await cacheResponse(cacheService, cacheKey, c, config);
    };
}

/**
 * Generate cache key based on request and configuration
 */
function generateCacheKey(c: Context, config: CacheOptions): string {
    if (config.keyGenerator) {
        return config.keyPrefix + config.keyGenerator(c);
    }

    const parts = [
        c.req.method,
        c.req.url,
    ];

    // Add user-specific key component
    if (config.varyByUser) {
        const user = c.get('user');
        if (user?.id) {
            parts.push(`user:${user.id}`);
        }
    }

    // Add organization-specific key component
    if (config.varyByOrganization) {
        const user = c.get('user');
        if (user?.organizationId) {
            parts.push(`org:${user.organizationId}`);
        }
    }

    // Add query parameters
    const url = new URL(c.req.url);
    const sortedParams = Array.from(url.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('&');

    if (sortedParams) {
        parts.push(sortedParams);
    }

    const keyContent = parts.join('|');
    const hash = createHash('sha256').update(keyContent).digest('hex').substring(0, 16);

    return `${config.keyPrefix}${hash}`;
}

/**
 * Get cached response from cache service
 */
async function getCachedResponse(
    cacheService: CacheService,
    cacheKey: string
): Promise<CachedResponse | null> {
    try {
        return await cacheService.get<CachedResponse>(cacheKey);
    } catch (error) {
        console.error('Cache get error:', error);
        return null;
    }
}

/**
 * Cache the response
 */
async function cacheResponse(
    cacheService: CacheService,
    cacheKey: string,
    c: Context,
    config: CacheOptions
): Promise<void> {
    try {
        const response = c.res;
        const body = await response.clone().text();

        // Generate ETag
        const etag = config.etagGenerator
            ? config.etagGenerator(body)
            : generateETag(body);

        // Create cache metadata
        const user = c.get('user');
        const metadata: CacheMetadata = {
            etag,
            timestamp: Date.now(),
            contentType: response.headers.get('Content-Type') || 'application/json',
            tags: config.tags,
            userId: config.varyByUser ? user?.id : undefined,
            organizationId: config.varyByOrganization ? user?.organizationId : undefined,
        };

        // Create cached response
        const cachedResponse: CachedResponse = {
            body,
            status: response.status,
            headers: Object.fromEntries(response.headers.entries()),
            metadata,
        };

        // Store in cache
        await cacheService.set(cacheKey, cachedResponse, { ttl: config.ttl });

        // Store cache tags for invalidation
        if (config.tags && config.tags.length > 0) {
            await storeCacheTags(cacheService, config.tags, cacheKey);
        }

        // Add cache headers to response
        const headers: Record<string, string> = {
            'X-Cache': 'MISS',
            'X-Cache-Key': cacheKey,
        };

        if (config.enableConditionalRequests) {
            headers['ETag'] = etag;
        }

        if (config.enableCDNHeaders) {
            headers['Cache-Control'] = getCDNCacheControlHeader(config);
            headers['Vary'] = getVaryHeader(config);
        }

        // Set headers on response
        Object.entries(headers).forEach(([key, value]) => {
            c.res.headers.set(key, value);
        });

    } catch (error) {
        console.error('Cache set error:', error);
    }
}

/**
 * Determine if response should be cached
 */
function shouldCacheResponse(c: Context, response: Response, config: CacheOptions): boolean {
    if (config.shouldCache) {
        return config.shouldCache(c, response);
    }

    // Default caching rules
    return (
        response.status === 200 &&
        response.headers.get('Content-Type')?.includes('application/json') === true &&
        !response.headers.get('Set-Cookie') &&
        !response.headers.get('Authorization')
    );
}

/**
 * Generate ETag for content
 */
function generateETag(content: string): string {
    const hash = createHash('sha256').update(content).digest('hex').substring(0, 16);
    return `"${hash}"`;
}

/**
 * Get Cache-Control header for internal caching
 */
function getCacheControlHeader(config: CacheOptions): string {
    return `private, max-age=${config.ttl}`;
}

/**
 * Get Cache-Control header for CDN caching
 */
function getCDNCacheControlHeader(config: CacheOptions): string {
    return `public, max-age=${config.cdnTtl}, s-maxage=${config.cdnTtl}`;
}

/**
 * Get Vary header based on configuration
 */
function getVaryHeader(config: CacheOptions): string {
    const varyHeaders = ['Accept', 'Accept-Encoding'];

    if (config.varyByUser) {
        varyHeaders.push('Authorization');
    }

    return varyHeaders.join(', ');
}

/**
 * Store cache tags for invalidation
 */
async function storeCacheTags(
    cacheService: CacheService,
    tags: string[],
    cacheKey: string
): Promise<void> {
    try {
        for (const tag of tags) {
            const tagKey = `tag:${tag}`;
            const existingKeys = await cacheService.get<string[]>(tagKey) || [];
            if (!existingKeys.includes(cacheKey)) {
                existingKeys.push(cacheKey);
                await cacheService.set(tagKey, existingKeys, { ttl: 86400 }); // 24 hours
            }
        }
    } catch (error) {
        console.error('Error storing cache tags:', error);
    }
}

/**
 * Cache invalidation service
 */
export class CacheInvalidationService {
    constructor(private cacheService: CacheService) { }

    /**
     * Invalidate cache by key
     */
    async invalidateKey(key: string): Promise<void> {
        try {
            await this.cacheService.del(key);
        } catch (error) {
            console.error('Cache invalidation error:', error);
        }
    }

    /**
     * Invalidate cache by pattern
     */
    async invalidatePattern(pattern: string): Promise<void> {
        try {
            const keys = await this.cacheService.keys(pattern);
            if (keys.length > 0) {
                await Promise.all(keys.map(key => this.cacheService.del(key)));
            }
        } catch (error) {
            console.error('Cache pattern invalidation error:', error);
        }
    }

    /**
     * Invalidate cache by tags
     */
    async invalidateTags(tags: string[]): Promise<void> {
        try {
            for (const tag of tags) {
                const tagKey = `tag:${tag}`;
                const cacheKeys = await this.cacheService.get<string[]>(tagKey);

                if (cacheKeys && cacheKeys.length > 0) {
                    // Delete all cached responses with this tag
                    await Promise.all(cacheKeys.map(key => this.cacheService.del(key)));
                    // Delete the tag key itself
                    await this.cacheService.del(tagKey);
                }
            }
        } catch (error) {
            console.error('Cache tag invalidation error:', error);
        }
    }

    /**
     * Invalidate user-specific cache
     */
    async invalidateUser(userId: string): Promise<void> {
        await this.invalidatePattern(`*user:${userId}*`);
    }

    /**
     * Invalidate organization-specific cache
     */
    async invalidateOrganization(organizationId: string): Promise<void> {
        await this.invalidatePattern(`*org:${organizationId}*`);
    }

    /**
     * Clear all cache
     */
    async clearAll(): Promise<void> {
        try {
            await this.cacheService.flush();
        } catch (error) {
            console.error('Cache clear all error:', error);
        }
    }
}

/**
 * Predefined cache configurations for common use cases
 */
export const CacheConfigurations = {
    /**
     * Static content cache (long TTL, CDN-friendly)
     */
    static: {
        ttl: 3600, // 1 hour
        enableCDNHeaders: true,
        cdnTtl: 86400, // 24 hours
        tags: ['static'],
    } as CacheOptions,

    /**
     * User-specific data cache
     */
    userSpecific: {
        ttl: 300, // 5 minutes
        varyByUser: true,
        tags: ['user-data'],
    } as CacheOptions,

    /**
     * Organization-specific data cache
     */
    organizationSpecific: {
        ttl: 600, // 10 minutes
        varyByOrganization: true,
        tags: ['org-data'],
    } as CacheOptions,

    /**
     * Public API cache (short TTL, CDN-friendly)
     */
    publicApi: {
        ttl: 60, // 1 minute
        enableCDNHeaders: true,
        cdnTtl: 300, // 5 minutes
        tags: ['public-api'],
    } as CacheOptions,

    /**
     * Template data cache
     */
    templates: {
        ttl: 1800, // 30 minutes
        varyByOrganization: true,
        tags: ['templates'],
    } as CacheOptions,

    /**
     * Document metadata cache
     */
    documents: {
        ttl: 300, // 5 minutes
        varyByUser: true,
        tags: ['documents'],
    } as CacheOptions,
};

/**
 * Create cache middleware with predefined configuration
 */
export function createPredefinedCacheMiddleware(
    cacheService: CacheService,
    configName: keyof typeof CacheConfigurations
) {
    return createCacheMiddleware(cacheService, CacheConfigurations[configName]);
}