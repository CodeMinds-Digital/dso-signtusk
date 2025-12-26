import type { Context, Next } from 'hono';
import type Redis from 'ioredis';
import type { RateLimitConfig, RateLimitInfo, TokenBucket, SecurityMiddleware } from './types';
import { createSecurityEvent, SecurityEventType, SecurityEventSeverity } from './audit';

// ============================================================================
// RATE LIMITING WITH TOKEN BUCKET ALGORITHM
// ============================================================================

/**
 * Default rate limiting configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100, // 100 requests per minute
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    store: 'memory'
};

/**
 * In-memory store for rate limiting (fallback when Redis is not available)
 */
class MemoryStore {
    private store = new Map<string, TokenBucket>();
    private cleanupInterval: NodeJS.Timeout;

    constructor() {
        // Clean up expired entries every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 5 * 60 * 1000);
    }

    async get(key: string): Promise<TokenBucket | null> {
        return this.store.get(key) || null;
    }

    async set(key: string, bucket: TokenBucket, ttl: number): Promise<void> {
        this.store.set(key, bucket);

        // Set expiration
        setTimeout(() => {
            this.store.delete(key);
        }, ttl * 1000);
    }

    async increment(key: string): Promise<number> {
        const current = this.store.get(key);
        const newValue = (current?.tokens || 0) + 1;

        if (current) {
            current.tokens = newValue;
            this.store.set(key, current);
        }

        return newValue;
    }

    private cleanup(): void {
        const now = Date.now();
        for (const [key, bucket] of this.store.entries()) {
            // Remove buckets that haven't been accessed in the last hour
            if (now - bucket.lastRefill > 60 * 60 * 1000) {
                this.store.delete(key);
            }
        }
    }

    destroy(): void {
        clearInterval(this.cleanupInterval);
        this.store.clear();
    }
}

/**
 * Redis store for distributed rate limiting
 */
class RedisStore {
    constructor(private redis: Redis) { }

    async get(key: string): Promise<TokenBucket | null> {
        const data = await this.redis.get(key);
        return data ? JSON.parse(data) : null;
    }

    async set(key: string, bucket: TokenBucket, ttl: number): Promise<void> {
        await this.redis.setex(key, ttl, JSON.stringify(bucket));
    }

    async increment(key: string): Promise<number> {
        return await this.redis.incr(key);
    }
}

/**
 * Token bucket implementation for rate limiting
 */
class TokenBucketRateLimiter {
    private store: MemoryStore | RedisStore;

    constructor(
        private config: RateLimitConfig,
        redis?: Redis
    ) {
        this.store = redis ? new RedisStore(redis) : new MemoryStore();
    }

    async checkLimit(key: string): Promise<RateLimitInfo> {
        const now = Date.now();
        const bucket = await this.getBucket(key, now);

        // Calculate tokens to add based on time elapsed
        const timeElapsed = now - bucket.lastRefill;
        const tokensToAdd = Math.floor(timeElapsed * bucket.refillRate / 1000);

        // Refill bucket
        bucket.tokens = Math.min(bucket.capacity, bucket.tokens + tokensToAdd);
        bucket.lastRefill = now;

        // Check if request can be processed
        const canProcess = bucket.tokens > 0;

        if (canProcess) {
            bucket.tokens--;
        }

        // Save updated bucket
        const windowMs = this.config.windowMs ?? 60000; // Default 1 minute
        await this.store.set(key, bucket, Math.ceil(windowMs / 1000));

        const resetTime = now + (bucket.capacity - bucket.tokens) * (1000 / bucket.refillRate);

        const maxRequests = this.config.maxRequests ?? 100; // Default 100 requests
        return {
            limit: maxRequests,
            remaining: bucket.tokens,
            reset: Math.ceil(resetTime / 1000),
            retryAfter: canProcess ? undefined : Math.ceil((1000 / bucket.refillRate) / 1000)
        };
    }

    private async getBucket(key: string, now: number): Promise<TokenBucket> {
        const existing = await this.store.get(key);

        if (existing) {
            return existing;
        }

        // Create new bucket
        const maxRequests = this.config.maxRequests ?? 100;
        const windowMs = this.config.windowMs ?? 60000;
        return {
            tokens: maxRequests - 1, // Subtract 1 for current request
            lastRefill: now,
            capacity: maxRequests,
            refillRate: maxRequests / (windowMs / 1000) // tokens per second
        };
    }
}

/**
 * Creates rate limiting middleware with token bucket algorithm
 */
export function createRateLimitMiddleware(
    config: Partial<RateLimitConfig> = {},
    redis?: Redis
): SecurityMiddleware {
    const finalConfig = { ...DEFAULT_RATE_LIMIT_CONFIG, ...config };
    const rateLimiter = new TokenBucketRateLimiter(finalConfig, redis);

    return async (c: Context, next: Next) => {
        try {
            // Generate rate limit key
            const key = finalConfig.keyGenerator
                ? finalConfig.keyGenerator(c)
                : generateDefaultKey(c);

            // Check rate limit
            const rateLimitInfo = await rateLimiter.checkLimit(key);

            // Add rate limit headers
            c.header('X-Rate-Limit-Limit', rateLimitInfo.limit.toString());
            c.header('X-Rate-Limit-Remaining', rateLimitInfo.remaining.toString());
            c.header('X-Rate-Limit-Reset', rateLimitInfo.reset.toString());

            if (rateLimitInfo.retryAfter) {
                c.header('Retry-After', rateLimitInfo.retryAfter.toString());
            }

            // Store rate limit info in security context
            const securityContext = c.get('security') || {};
            securityContext.rateLimitInfo = rateLimitInfo;
            c.set('security', securityContext);

            // Check if rate limit exceeded
            if (rateLimitInfo.remaining < 0) {
                // Log rate limit violation
                const auditEvent = createSecurityEvent({
                    type: SecurityEventType.RATE_LIMIT_EXCEEDED,
                    severity: SecurityEventSeverity.MEDIUM,
                    message: `Rate limit exceeded for key: ${key}`,
                    context: c,
                    metadata: {
                        key,
                        limit: rateLimitInfo.limit,
                        remaining: rateLimitInfo.remaining,
                        reset: rateLimitInfo.reset
                    }
                });

                securityContext.auditEvent = auditEvent;
                c.set('security', securityContext);

                // Call rate limit callback if provided
                if (finalConfig.onLimitReached) {
                    finalConfig.onLimitReached(c);
                }

                return c.json({
                    error: 'Rate limit exceeded',
                    message: 'Too many requests, please try again later',
                    retryAfter: rateLimitInfo.retryAfter
                }, 429);
            }

            await next();

            // Skip counting if configured to skip successful requests
            const shouldSkip = (
                (finalConfig.skipSuccessfulRequests && c.res.status < 400) ||
                (finalConfig.skipFailedRequests && c.res.status >= 400)
            );

            if (shouldSkip) {
                // Restore the token since we're skipping this request
                await rateLimiter.checkLimit(key); // This will add the token back
            }

        } catch (error) {
            // Log rate limiting error
            const auditEvent = createSecurityEvent({
                type: SecurityEventType.RATE_LIMIT_EXCEEDED,
                severity: SecurityEventSeverity.HIGH,
                message: 'Rate limiting error',
                context: c,
                metadata: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });

            const securityContext = c.get('security') || {};
            securityContext.auditEvent = auditEvent;
            c.set('security', securityContext);

            // Continue processing on rate limiting errors to avoid blocking legitimate requests
            await next();
        }
    };
}

/**
 * Generates default rate limiting key based on IP address and user ID
 */
function generateDefaultKey(c: Context): string {
    const ip = getClientIP(c);
    const userId = c.get('userId') || 'anonymous';
    return `rate_limit:${ip}:${userId}`;
}

/**
 * Extracts client IP address from request
 */
function getClientIP(c: Context): string {
    // Check various headers for the real IP address
    const headers = [
        'x-forwarded-for',
        'x-real-ip',
        'x-client-ip',
        'cf-connecting-ip', // Cloudflare
        'x-cluster-client-ip',
        'forwarded'
    ];

    for (const header of headers) {
        const value = c.req.header(header);
        if (value) {
            // Handle comma-separated IPs (take the first one)
            const ip = value.split(',')[0].trim();
            if (isValidIP(ip)) {
                return ip;
            }
        }
    }

    // Fallback to connection remote address
    return 'unknown';
}

/**
 * Validates IP address format
 */
function isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;

    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Rate limit configuration builder utility
 */
export class RateLimitConfigBuilder {
    private config: Partial<RateLimitConfig> = {};

    constructor() {
        this.config = { ...DEFAULT_RATE_LIMIT_CONFIG };
    }

    window(ms: number): this {
        this.config.windowMs = ms;
        return this;
    }

    max(requests: number): this {
        this.config.maxRequests = requests;
        return this;
    }

    keyGenerator(fn: (c: Context) => string): this {
        this.config.keyGenerator = fn;
        return this;
    }

    skipSuccessful(skip: boolean = true): this {
        this.config.skipSuccessfulRequests = skip;
        return this;
    }

    skipFailed(skip: boolean = true): this {
        this.config.skipFailedRequests = skip;
        return this;
    }

    onLimitReached(callback: (c: Context) => void): this {
        this.config.onLimitReached = callback;
        return this;
    }

    useRedis(config: RateLimitConfig['redisConfig']): this {
        this.config.store = 'redis';
        this.config.redisConfig = config;
        return this;
    }

    perMinute(requests: number): this {
        return this.window(60 * 1000).max(requests);
    }

    perHour(requests: number): this {
        return this.window(60 * 60 * 1000).max(requests);
    }

    perDay(requests: number): this {
        return this.window(24 * 60 * 60 * 1000).max(requests);
    }

    build(): RateLimitConfig {
        return this.config as RateLimitConfig;
    }
}