import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { CacheService } from '@signtusk/cache';

/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (c: Context) => Promise<string> | string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    bypassPremium?: boolean;
    organizationLimits?: {
        free: number;
        basic: number;
        premium: number;
        enterprise: number;
    };
}

/**
 * Token bucket rate limiter using Redis for distributed rate limiting
 */
export class TokenBucketRateLimiter {
    private cache: CacheService;
    private fallbackStore: MemoryRateLimitStore;

    constructor(cache: CacheService) {
        this.cache = cache;
        this.fallbackStore = new MemoryRateLimitStore();
    }

    /**
     * Token bucket algorithm implementation
     * Uses fixed window approach - tokens reset at window boundaries
     */
    async consume(
        key: string,
        tokens: number,
        maxTokens: number,
        refillRate: number,
        windowMs: number
    ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
        try {
            const now = Date.now();
            const bucketKey = `rate_limit:bucket:${key}`;

            // Get current bucket state
            const bucketData = await this.cache.get<{
                tokens: number;
                lastRefill: number;
                resetTime: number;
            }>(bucketKey);

            let currentTokens: number;
            let resetTime: number;

            if (bucketData && bucketData.resetTime > now) {
                // Use existing bucket within the same window - no refill
                currentTokens = bucketData.tokens;
                resetTime = bucketData.resetTime;
            } else {
                // Initialize new bucket or reset expired bucket
                currentTokens = maxTokens;
                resetTime = now + windowMs;
            }

            // Check if we have enough tokens
            const allowed = currentTokens >= tokens;
            const newTokenCount = allowed ? currentTokens - tokens : currentTokens;

            // Update bucket state
            await this.cache.set(
                bucketKey,
                {
                    tokens: newTokenCount,
                    lastRefill: now,
                    resetTime
                },
                { ttl: Math.ceil(windowMs / 1000) * 2 } // TTL is 2x window for safety
            );

            return {
                allowed,
                remaining: Math.max(0, newTokenCount),
                resetTime
            };
        } catch (error) {
            console.error('Redis rate limiter error, falling back to memory:', error);
            // Fallback to in-memory store
            return this.fallbackStore.consumeTokens(key, tokens, maxTokens, windowMs);
        }
    }

    /**
     * Get current rate limit status without consuming tokens
     */
    async getStatus(
        key: string,
        maxTokens: number,
        refillRate: number,
        windowMs: number
    ): Promise<{ remaining: number; resetTime: number }> {
        try {
            const now = Date.now();
            const bucketKey = `rate_limit:bucket:${key}`;

            const bucketData = await this.cache.get<{
                tokens: number;
                lastRefill: number;
                resetTime: number;
            }>(bucketKey);

            if (!bucketData) {
                return {
                    remaining: maxTokens,
                    resetTime: now + windowMs
                };
            }

            const timeSinceLastRefill = now - bucketData.lastRefill;
            const tokensToAdd = Math.floor((timeSinceLastRefill / windowMs) * refillRate);
            const currentTokens = Math.min(bucketData.tokens + tokensToAdd, maxTokens);

            return {
                remaining: currentTokens,
                resetTime: bucketData.resetTime
            };
        } catch (error) {
            console.error('Error getting rate limit status:', error);
            return {
                remaining: maxTokens,
                resetTime: Date.now() + windowMs
            };
        }
    }
}

/**
 * In-memory rate limit store (fallback when Redis is unavailable)
 */
class MemoryRateLimitStore {
    private store = new Map<string, { tokens: number; lastRefill: number; resetTime: number }>();

    consumeTokens(
        key: string,
        tokens: number,
        maxTokens: number,
        windowMs: number
    ): { allowed: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        const existing = this.store.get(key);

        let currentTokens: number;
        let resetTime: number;

        if (existing && existing.resetTime > now) {
            // Use existing bucket within the same window - no refill
            currentTokens = existing.tokens;
            resetTime = existing.resetTime;
        } else {
            // Initialize new bucket or reset expired bucket
            currentTokens = maxTokens;
            resetTime = now + windowMs;
        }

        const allowed = currentTokens >= tokens;
        const newTokenCount = allowed ? currentTokens - tokens : currentTokens;

        this.store.set(key, {
            tokens: newTokenCount,
            lastRefill: now,
            resetTime
        });

        return {
            allowed,
            remaining: Math.max(0, newTokenCount),
            resetTime
        };
    }

    cleanup(): void {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (entry.resetTime <= now) {
                this.store.delete(key);
            }
        }
    }
}

/**
 * Get user and organization information from context
 */
async function getUserOrgInfo(c: Context): Promise<{
    userId?: string;
    organizationId?: string;
    subscriptionPlan?: string;
}> {
    try {
        // Try to get from authenticated user context
        const user = c.get('user');
        if (user) {
            return {
                userId: user.id,
                organizationId: user.organizationId,
                subscriptionPlan: user.subscriptionPlan || 'free'
            };
        }

        // Try to get from API token
        const apiToken = c.get('apiToken');
        if (apiToken) {
            return {
                userId: apiToken.userId,
                organizationId: apiToken.organizationId,
                subscriptionPlan: apiToken.subscriptionPlan || 'free'
            };
        }

        return {};
    } catch (error) {
        console.error('Error getting user/org info:', error);
        return {};
    }
}

/**
 * Determine rate limit based on subscription plan
 */
function getRateLimitForPlan(
    config: RateLimitConfig,
    plan: string = 'free'
): number {
    if (!config.organizationLimits) {
        return config.maxRequests;
    }

    const limits = config.organizationLimits;
    switch (plan.toLowerCase()) {
        case 'enterprise':
            return limits.enterprise;
        case 'premium':
            return limits.premium;
        case 'basic':
            return limits.basic;
        case 'free':
        default:
            return limits.free;
    }
}

/**
 * Create rate limiting middleware with token bucket algorithm
 */
export function createRateLimitMiddleware(
    config: RateLimitConfig,
    cache: CacheService
) {
    const limiter = new TokenBucketRateLimiter(cache);

    return async (c: Context, next: Next) => {
        try {
            // Get user and organization info
            const { userId, organizationId, subscriptionPlan } = await getUserOrgInfo(c);

            // Check if premium bypass is enabled
            if (config.bypassPremium && subscriptionPlan &&
                ['premium', 'enterprise'].includes(subscriptionPlan.toLowerCase())) {
                // Premium users bypass rate limiting
                c.header('X-RateLimit-Bypass', 'true');
                await next();
                return;
            }

            // Generate rate limit key
            let key: string;
            if (config.keyGenerator) {
                key = await config.keyGenerator(c);
            } else {
                // Default key generation strategy
                if (organizationId) {
                    key = `org:${organizationId}`;
                } else if (userId) {
                    key = `user:${userId}`;
                } else {
                    key = getDefaultKey(c);
                }
            }

            // Determine rate limit based on subscription plan
            const maxRequests = getRateLimitForPlan(config, subscriptionPlan);
            const refillRate = maxRequests; // Refill all tokens per window

            // Consume tokens using token bucket algorithm
            const result = await limiter.consume(
                key,
                1, // Consume 1 token per request
                maxRequests,
                refillRate,
                config.windowMs
            );

            // Set rate limit headers
            c.header('X-RateLimit-Limit', maxRequests.toString());
            c.header('X-RateLimit-Remaining', result.remaining.toString());
            c.header('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString());
            c.header('X-RateLimit-Policy', 'token-bucket');

            if (!result.allowed) {
                const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
                c.header('Retry-After', retryAfter.toString());

                throw new HTTPException(429, {
                    message: 'Too Many Requests - Rate limit exceeded',
                    cause: {
                        retryAfter,
                        limit: maxRequests,
                        remaining: result.remaining,
                        resetTime: result.resetTime
                    }
                });
            }

            await next();
        } catch (error) {
            if (error instanceof HTTPException) {
                throw error;
            }
            console.error('Rate limiting error:', error);
            // On error, allow the request to proceed
            await next();
        }
    };
}

/**
 * Default rate limiting middleware (100 requests per 15 minutes)
 * With organization-based limits
 */
export function createDefaultRateLimitMiddleware(cache: CacheService) {
    return createRateLimitMiddleware({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        bypassPremium: true,
        organizationLimits: {
            free: 100,
            basic: 500,
            premium: 2000,
            enterprise: 10000
        }
    }, cache);
}

/**
 * Strict rate limiting for authentication endpoints (10 requests per 15 minutes)
 * Per IP address to prevent brute force attacks
 */
export function createAuthRateLimitMiddleware(cache: CacheService) {
    return createRateLimitMiddleware({
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 10,
        bypassPremium: false, // No bypass for auth endpoints
        keyGenerator: getDefaultKey
    }, cache);
}

/**
 * API key rate limiting (1000 requests per hour)
 * With organization-based limits
 */
export function createApiKeyRateLimitMiddleware(cache: CacheService) {
    return createRateLimitMiddleware({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 1000,
        bypassPremium: true,
        organizationLimits: {
            free: 1000,
            basic: 5000,
            premium: 20000,
            enterprise: 100000
        },
        keyGenerator: async (c) => {
            const apiKey = c.req.header('X-API-Key');
            if (apiKey) {
                // Get organization from API key
                const { organizationId } = await getUserOrgInfo(c);
                return organizationId ? `api_key:org:${organizationId}` : `api_key:${apiKey}`;
            }
            return getDefaultKey(c);
        }
    }, cache);
}

/**
 * Per-user rate limiting (500 requests per hour)
 */
export function createUserRateLimitMiddleware(cache: CacheService) {
    return createRateLimitMiddleware({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 500,
        bypassPremium: true,
        organizationLimits: {
            free: 500,
            basic: 2000,
            premium: 10000,
            enterprise: 50000
        },
        keyGenerator: async (c) => {
            const { userId } = await getUserOrgInfo(c);
            return userId ? `user:${userId}` : getDefaultKey(c);
        }
    }, cache);
}

/**
 * Per-organization rate limiting (5000 requests per hour)
 */
export function createOrganizationRateLimitMiddleware(cache: CacheService) {
    return createRateLimitMiddleware({
        windowMs: 60 * 60 * 1000, // 1 hour
        maxRequests: 5000,
        bypassPremium: true,
        organizationLimits: {
            free: 5000,
            basic: 20000,
            premium: 100000,
            enterprise: 500000
        },
        keyGenerator: async (c) => {
            const { organizationId } = await getUserOrgInfo(c);
            return organizationId ? `org:${organizationId}` : getDefaultKey(c);
        }
    }, cache);
}

/**
 * Get default rate limit key based on IP address
 */
function getDefaultKey(c: Context): string {
    const ip = c.req.header('X-Forwarded-For')?.split(',')[0].trim() ||
        c.req.header('X-Real-IP') ||
        c.env?.ip ||
        'unknown';
    return `ip:${ip}`;
}

// Create a default instance for backwards compatibility
// Note: This requires a cache service to be initialized
let defaultCache: CacheService | null = null;

export function setDefaultCache(cache: CacheService) {
    defaultCache = cache;
}

export const authRateLimitMiddleware = async (c: Context, next: Next) => {
    if (!defaultCache) {
        console.warn('No cache service configured for rate limiting, skipping...');
        await next();
        return;
    }
    const middleware = createAuthRateLimitMiddleware(defaultCache);
    return middleware(c, next);
};