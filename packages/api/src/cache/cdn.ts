import { Context } from 'hono';

/**
 * CDN configuration interface
 */
export interface CDNConfig {
    /** CDN provider type */
    provider: 'cloudflare' | 'aws-cloudfront' | 'fastly' | 'generic';
    /** CDN base URL */
    baseUrl?: string;
    /** Default cache TTL for CDN */
    defaultTtl: number;
    /** Maximum cache TTL for CDN */
    maxTtl: number;
    /** Whether to enable cache purging */
    enablePurging: boolean;
    /** CDN API credentials */
    credentials?: {
        apiKey?: string;
        apiSecret?: string;
        zoneId?: string;
        distributionId?: string;
    };
}

/**
 * CDN cache control strategies
 */
export enum CDNCacheStrategy {
    /** Cache for a short time, good for frequently changing data */
    SHORT = 'short',
    /** Cache for a medium time, good for semi-static data */
    MEDIUM = 'medium',
    /** Cache for a long time, good for static data */
    LONG = 'long',
    /** Cache indefinitely until manually purged */
    IMMUTABLE = 'immutable',
    /** Don't cache at CDN level */
    NO_CACHE = 'no-cache',
}

/**
 * CDN cache configuration mapping
 */
const CDN_CACHE_CONFIGS: Record<CDNCacheStrategy, { maxAge: number; sMaxAge: number; directives: string[] }> = {
    [CDNCacheStrategy.SHORT]: {
        maxAge: 60, // 1 minute
        sMaxAge: 300, // 5 minutes
        directives: ['public', 'stale-while-revalidate=60'],
    },
    [CDNCacheStrategy.MEDIUM]: {
        maxAge: 300, // 5 minutes
        sMaxAge: 1800, // 30 minutes
        directives: ['public', 'stale-while-revalidate=300'],
    },
    [CDNCacheStrategy.LONG]: {
        maxAge: 3600, // 1 hour
        sMaxAge: 86400, // 24 hours
        directives: ['public', 'stale-while-revalidate=3600'],
    },
    [CDNCacheStrategy.IMMUTABLE]: {
        maxAge: 31536000, // 1 year
        sMaxAge: 31536000, // 1 year
        directives: ['public', 'immutable'],
    },
    [CDNCacheStrategy.NO_CACHE]: {
        maxAge: 0,
        sMaxAge: 0,
        directives: ['no-cache', 'no-store', 'must-revalidate'],
    },
};

/**
 * CDN integration service
 */
export class CDNIntegrationService {
    private config: CDNConfig;

    constructor(config: CDNConfig) {
        this.config = config;
    }

    /**
     * Set CDN cache headers on response
     */
    setCDNCacheHeaders(
        c: Context,
        strategy: CDNCacheStrategy = CDNCacheStrategy.MEDIUM,
        customTtl?: number
    ): void {
        const cacheConfig = CDN_CACHE_CONFIGS[strategy];

        // Use custom TTL if provided
        const maxAge = customTtl || cacheConfig.maxAge;
        const sMaxAge = customTtl || cacheConfig.sMaxAge;

        // Build Cache-Control header
        const directives = [...cacheConfig.directives];

        if (strategy !== CDNCacheStrategy.NO_CACHE) {
            directives.push(`max-age=${maxAge}`);
            directives.push(`s-maxage=${sMaxAge}`);
        }

        c.res.headers.set('Cache-Control', directives.join(', '));

        // Set additional CDN headers
        this.setProviderSpecificHeaders(c, strategy);

        // Set Vary header for proper caching
        this.setVaryHeader(c);

        // Set CDN cache tags for purging
        this.setCDNCacheTags(c);
    }

    /**
     * Set provider-specific CDN headers
     */
    private setProviderSpecificHeaders(c: Context, strategy: CDNCacheStrategy): void {
        switch (this.config.provider) {
            case 'cloudflare':
                this.setCloudflareHeaders(c, strategy);
                break;
            case 'aws-cloudfront':
                this.setCloudFrontHeaders(c, strategy);
                break;
            case 'fastly':
                this.setFastlyHeaders(c, strategy);
                break;
            default:
                // Generic CDN headers
                break;
        }
    }

    /**
     * Set Cloudflare-specific headers
     */
    private setCloudflareHeaders(c: Context, strategy: CDNCacheStrategy): void {
        // Cloudflare cache level
        if (strategy === CDNCacheStrategy.NO_CACHE) {
            c.res.headers.set('CF-Cache-Status', 'BYPASS');
        }

        // Cloudflare edge cache TTL
        const edgeTtl = CDN_CACHE_CONFIGS[strategy].sMaxAge;
        if (edgeTtl > 0) {
            c.res.headers.set('CF-Edge-Cache', `max-age=${edgeTtl}`);
        }

        // Cloudflare browser cache TTL
        const browserTtl = CDN_CACHE_CONFIGS[strategy].maxAge;
        if (browserTtl > 0) {
            c.res.headers.set('CF-Browser-Cache', `max-age=${browserTtl}`);
        }
    }

    /**
     * Set AWS CloudFront-specific headers
     */
    private setCloudFrontHeaders(c: Context, strategy: CDNCacheStrategy): void {
        // CloudFront cache policy
        if (strategy === CDNCacheStrategy.IMMUTABLE) {
            c.res.headers.set('CloudFront-Policy', 'immutable');
        }

        // CloudFront origin request policy
        c.res.headers.set('CloudFront-Origin-Request-Policy', 'CORS-S3Origin');
    }

    /**
     * Set Fastly-specific headers
     */
    private setFastlyHeaders(c: Context, strategy: CDNCacheStrategy): void {
        // Fastly surrogate control
        const ttl = CDN_CACHE_CONFIGS[strategy].sMaxAge;
        if (ttl > 0) {
            c.res.headers.set('Surrogate-Control', `max-age=${ttl}`);
        }

        // Fastly cache tags
        c.res.headers.set('Surrogate-Key', this.generateCacheKey(c));
    }

    /**
     * Set Vary header for proper caching
     */
    private setVaryHeader(c: Context): void {
        const varyHeaders = ['Accept', 'Accept-Encoding'];

        // Add Authorization to Vary if user-specific content
        const user = c.get('user');
        if (user) {
            varyHeaders.push('Authorization');
        }

        // Add custom headers that affect response
        const customVaryHeaders = c.req.header('X-Vary-Headers');
        if (customVaryHeaders) {
            varyHeaders.push(...customVaryHeaders.split(',').map(h => h.trim()));
        }

        c.res.headers.set('Vary', varyHeaders.join(', '));
    }

    /**
     * Set CDN cache tags for purging
     */
    private setCDNCacheTags(c: Context): void {
        const tags = this.generateCacheTags(c);

        switch (this.config.provider) {
            case 'cloudflare':
                c.res.headers.set('Cache-Tag', tags.join(','));
                break;
            case 'fastly':
                c.res.headers.set('Surrogate-Key', tags.join(' '));
                break;
            case 'aws-cloudfront':
                // CloudFront doesn't support cache tags directly
                // Use custom header for application-level tracking
                c.res.headers.set('X-Cache-Tags', tags.join(','));
                break;
            default:
                c.res.headers.set('X-Cache-Tags', tags.join(','));
                break;
        }
    }

    /**
     * Generate cache key for the request
     */
    private generateCacheKey(c: Context): string {
        const url = new URL(c.req.url);
        const pathSegments = url.pathname.split('/').filter(Boolean);

        // Create hierarchical cache key
        const keyParts = [
            'api',
            ...pathSegments.slice(0, 3), // First 3 path segments
        ];

        return keyParts.join('-');
    }

    /**
     * Generate cache tags for the request
     */
    private generateCacheTags(c: Context): string[] {
        const url = new URL(c.req.url);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        const tags: string[] = [];

        // Add API version tag
        if (pathSegments[1]) {
            tags.push(`api-${pathSegments[1]}`);
        }

        // Add resource type tag
        if (pathSegments[2]) {
            tags.push(`resource-${pathSegments[2]}`);
        }

        // Add user-specific tag if authenticated
        const user = c.get('user');
        if (user?.organizationId) {
            tags.push(`org-${user.organizationId}`);
        }

        // Add custom tags from headers
        const customTags = c.req.header('X-Cache-Tags');
        if (customTags) {
            tags.push(...customTags.split(',').map(tag => tag.trim()));
        }

        return tags;
    }

    /**
     * Purge CDN cache by URL
     */
    async purgeByUrl(url: string): Promise<boolean> {
        if (!this.config.enablePurging || !this.config.credentials) {
            return false;
        }

        try {
            switch (this.config.provider) {
                case 'cloudflare':
                    return await this.purgeCloudflareUrl(url);
                case 'aws-cloudfront':
                    return await this.purgeCloudFrontUrl(url);
                case 'fastly':
                    return await this.purgeFastlyUrl(url);
                default:
                    console.warn(`Purging not implemented for provider: ${this.config.provider}`);
                    return false;
            }
        } catch (error) {
            console.error('CDN purge error:', error);
            return false;
        }
    }

    /**
     * Purge CDN cache by tags
     */
    async purgeByTags(tags: string[]): Promise<boolean> {
        if (!this.config.enablePurging || !this.config.credentials) {
            return false;
        }

        try {
            switch (this.config.provider) {
                case 'cloudflare':
                    return await this.purgeCloudflareByTags(tags);
                case 'fastly':
                    return await this.purgeFastlyByTags(tags);
                default:
                    console.warn(`Tag-based purging not supported for provider: ${this.config.provider}`);
                    return false;
            }
        } catch (error) {
            console.error('CDN tag purge error:', error);
            return false;
        }
    }

    /**
     * Purge Cloudflare cache by URL
     */
    private async purgeCloudflareUrl(url: string): Promise<boolean> {
        const { apiKey, zoneId } = this.config.credentials!;

        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                files: [url],
            }),
        });

        return response.ok;
    }

    /**
     * Purge Cloudflare cache by tags
     */
    private async purgeCloudflareByTags(tags: string[]): Promise<boolean> {
        const { apiKey, zoneId } = this.config.credentials!;

        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tags,
            }),
        });

        return response.ok;
    }

    /**
     * Purge CloudFront cache by URL
     */
    private async purgeCloudFrontUrl(url: string): Promise<boolean> {
        // CloudFront invalidation would require AWS SDK
        // This is a placeholder for the actual implementation
        console.log(`CloudFront invalidation for URL: ${url}`);
        return true;
    }

    /**
     * Purge Fastly cache by URL
     */
    private async purgeFastlyUrl(url: string): Promise<boolean> {
        const { apiKey } = this.config.credentials!;

        const response = await fetch(`https://api.fastly.com/purge/${encodeURIComponent(url)}`, {
            method: 'POST',
            headers: {
                'Fastly-Token': apiKey!,
            },
        });

        return response.ok;
    }

    /**
     * Purge Fastly cache by tags
     */
    private async purgeFastlyByTags(tags: string[]): Promise<boolean> {
        const { apiKey } = this.config.credentials!;

        // Fastly requires individual purge requests for each tag
        const purgePromises = tags.map(tag =>
            fetch(`https://api.fastly.com/service/SERVICE_ID/purge/${tag}`, {
                method: 'POST',
                headers: {
                    'Fastly-Token': apiKey!,
                },
            })
        );

        const results = await Promise.all(purgePromises);
        return results.every(response => response.ok);
    }
}

/**
 * CDN middleware factory
 */
export function createCDNMiddleware(cdnService: CDNIntegrationService) {
    return async (c: Context, next: Function) => {
        await next();

        // Only apply CDN headers to successful GET requests
        if (c.req.method === 'GET' && c.res.status === 200) {
            // Determine cache strategy based on URL pattern
            const strategy = determineCacheStrategy(c);
            cdnService.setCDNCacheHeaders(c, strategy);
        }
    };
}

/**
 * Determine cache strategy based on request context
 */
function determineCacheStrategy(c: Context): CDNCacheStrategy {
    const url = new URL(c.req.url);
    const path = url.pathname;

    // Static assets - cache for a long time
    if (path.includes('/static/') || path.includes('/assets/')) {
        return CDNCacheStrategy.IMMUTABLE;
    }

    // Public API endpoints - short cache
    if (path.includes('/public/')) {
        return CDNCacheStrategy.SHORT;
    }

    // Template data - medium cache
    if (path.includes('/templates/')) {
        return CDNCacheStrategy.MEDIUM;
    }

    // User-specific data - short cache
    if (path.includes('/user/') || path.includes('/documents/')) {
        return CDNCacheStrategy.SHORT;
    }

    // Organization data - medium cache
    if (path.includes('/organizations/')) {
        return CDNCacheStrategy.MEDIUM;
    }

    // Default to medium cache
    return CDNCacheStrategy.MEDIUM;
}

/**
 * Create CDN service with environment-based configuration
 */
export function createCDNService(): CDNIntegrationService {
    const config: CDNConfig = {
        provider: (process.env.CDN_PROVIDER as any) || 'generic',
        baseUrl: process.env.CDN_BASE_URL,
        defaultTtl: parseInt(process.env.CDN_DEFAULT_TTL || '300'),
        maxTtl: parseInt(process.env.CDN_MAX_TTL || '86400'),
        enablePurging: process.env.CDN_ENABLE_PURGING === 'true',
        credentials: {
            apiKey: process.env.CDN_API_KEY,
            apiSecret: process.env.CDN_API_SECRET,
            zoneId: process.env.CDN_ZONE_ID,
            distributionId: process.env.CDN_DISTRIBUTION_ID,
        },
    };

    return new CDNIntegrationService(config);
}