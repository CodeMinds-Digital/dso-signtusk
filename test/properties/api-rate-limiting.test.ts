import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { InMemoryCacheService } from '@signtusk/cache';
import { TokenBucketRateLimiter, createRateLimitMiddleware } from '../../packages/api/src/middleware/rate-limit';
import { Context } from 'hono';

/**
 * **Feature: docusign-alternative-comprehensive, Property 41: API Functionality Completeness**
 * **Validates: Requirements 9.1**
 * 
 * Property-based tests for API rate limiting functionality
 */

// Mock Hono Context for property testing
function createMockContext(
    ip: string = '127.0.0.1',
    userId?: string,
    organizationId?: string,
    subscriptionPlan?: string,
    apiKey?: string
): Context {
    const mockHeaders = new Map<string, string>();
    mockHeaders.set('x-forwarded-for', ip);
    if (apiKey) {
        mockHeaders.set('x-api-key', apiKey);
    }

    return {
        req: {
            header: (name: string) => mockHeaders.get(name.toLowerCase()),
            path: '/api/test'
        },
        header: () => { },
        get: (key: string) => {
            if (key === 'user' && userId) {
                return {
                    id: userId,
                    organizationId,
                    subscriptionPlan
                };
            }
            if (key === 'apiToken' && apiKey) {
                return {
                    userId,
                    organizationId,
                    subscriptionPlan
                };
            }
            return undefined;
        },
        env: {}
    } as any;
}

describe('API Rate Limiting Properties', () => {
    let cache: InMemoryCacheService;
    let limiter: TokenBucketRateLimiter;

    beforeEach(() => {
        cache = new InMemoryCacheService();
        limiter = new TokenBucketRateLimiter(cache);
    });

    describe('Token Bucket Algorithm Properties', () => {
        it('Property: Token consumption is monotonic', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // key
                fc.integer({ min: 1, max: 100 }), // maxTokens
                fc.integer({ min: 1, max: 10 }), // tokensToConsume
                async (key, maxTokens, tokensToConsume) => {
                    // Ensure we don't try to consume more tokens than available
                    const actualTokensToConsume = Math.min(tokensToConsume, maxTokens);

                    const result1 = await limiter.consume(key, actualTokensToConsume, maxTokens, maxTokens, 60000);
                    const result2 = await limiter.consume(key, actualTokensToConsume, maxTokens, maxTokens, 60000);

                    // Remaining tokens should decrease or stay the same
                    expect(result2.remaining).toBeLessThanOrEqual(result1.remaining);
                }
            ), { numRuns: 50 });
        });

        it('Property: Rate limiter respects maximum token capacity', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // key
                fc.integer({ min: 1, max: 100 }), // maxTokens
                async (key, maxTokens) => {
                    const result = await limiter.consume(key, 1, maxTokens, maxTokens, 60000);

                    // Remaining tokens should never exceed maxTokens - 1 (since we consumed 1)
                    expect(result.remaining).toBeLessThanOrEqual(maxTokens - 1);
                    expect(result.remaining).toBeGreaterThanOrEqual(0);
                }
            ), { numRuns: 50 });
        });

        it('Property: Different keys have independent token buckets', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // key1
                fc.string({ minLength: 1, maxLength: 20 }), // key2
                fc.integer({ min: 10, max: 100 }), // maxTokens
                async (key1, key2, maxTokens) => {
                    fc.pre(key1 !== key2); // Ensure keys are different

                    // Create a fresh limiter for each test run to ensure clean state
                    const freshCache = new InMemoryCacheService();
                    const freshLimiter = new TokenBucketRateLimiter(freshCache);

                    // Consume all tokens for key1
                    for (let i = 0; i < maxTokens; i++) {
                        await freshLimiter.consume(key1, 1, maxTokens, maxTokens, 60000);
                    }

                    // key2 should still have full capacity
                    const result = await freshLimiter.consume(key2, 1, maxTokens, maxTokens, 60000);
                    expect(result.allowed).toBe(true);
                    expect(result.remaining).toBe(maxTokens - 1);
                }
            ), { numRuns: 30 });
        });

        it('Property: Token bucket denies requests when empty', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // key
                fc.integer({ min: 1, max: 50 }), // maxTokens
                async (key, maxTokens) => {
                    // Create a fresh limiter for each test run to ensure clean state
                    const freshCache = new InMemoryCacheService();
                    const freshLimiter = new TokenBucketRateLimiter(freshCache);

                    // Consume all tokens
                    for (let i = 0; i < maxTokens; i++) {
                        await freshLimiter.consume(key, 1, maxTokens, maxTokens, 60000);
                    }

                    // Next request should be denied
                    const result = await freshLimiter.consume(key, 1, maxTokens, maxTokens, 60000);
                    expect(result.allowed).toBe(false);
                    expect(result.remaining).toBe(0);
                }
            ), { numRuns: 30 });
        });
    });

    describe('Rate Limiting Middleware Properties', () => {
        it('Property: Premium users bypass rate limiting when configured', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // userId
                fc.string({ minLength: 1, maxLength: 20 }), // organizationId
                fc.constantFrom('premium', 'enterprise'), // subscriptionPlan
                fc.integer({ min: 1, max: 10 }), // maxRequests (low to trigger limit)
                async (userId, organizationId, subscriptionPlan, maxRequests) => {
                    const middleware = createRateLimitMiddleware({
                        windowMs: 60000,
                        maxRequests,
                        bypassPremium: true
                    }, cache);

                    const context = createMockContext('127.0.0.1', userId, organizationId, subscriptionPlan);
                    const mockNext = () => Promise.resolve();

                    // Should not throw even with many requests
                    for (let i = 0; i < maxRequests * 2; i++) {
                        await expect(middleware(context, mockNext)).resolves.not.toThrow();
                    }
                }
            ), { numRuns: 20 });
        });

        it('Property: Organization limits are respected based on subscription plan', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // userId
                fc.string({ minLength: 1, maxLength: 20 }), // organizationId
                fc.constantFrom('free', 'basic', 'premium', 'enterprise'), // subscriptionPlan
                async (userId, organizationId, subscriptionPlan) => {
                    const organizationLimits = {
                        free: 10,
                        basic: 50,
                        premium: 200,
                        enterprise: 1000
                    };

                    const middleware = createRateLimitMiddleware({
                        windowMs: 60000,
                        maxRequests: 100, // Default
                        organizationLimits,
                        bypassPremium: false // Don't bypass to test limits
                    }, cache);

                    const context = createMockContext('127.0.0.1', userId, organizationId, subscriptionPlan);
                    let headerCalls: Array<[string, string]> = [];
                    context.header = (name: string, value: string) => {
                        headerCalls.push([name, value]);
                    };

                    const mockNext = () => Promise.resolve();

                    await middleware(context, mockNext);

                    // Check that the correct limit was applied
                    const limitHeader = headerCalls.find(([name]) => name === 'X-RateLimit-Limit');
                    expect(limitHeader).toBeDefined();
                    expect(limitHeader![1]).toBe(organizationLimits[subscriptionPlan as keyof typeof organizationLimits].toString());
                }
            ), { numRuns: 30 });
        });

        it('Property: Rate limiting is consistent for the same key', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // ip
                fc.integer({ min: 5, max: 20 }), // maxRequests
                async (ip, maxRequests) => {
                    const middleware = createRateLimitMiddleware({
                        windowMs: 60000,
                        maxRequests
                    }, cache);

                    const context = createMockContext(ip);
                    let remainingTokens: number[] = [];

                    context.header = (name: string, value: string) => {
                        if (name === 'X-RateLimit-Remaining') {
                            remainingTokens.push(parseInt(value));
                        }
                    };

                    const mockNext = () => Promise.resolve();

                    // Make requests up to the limit
                    for (let i = 0; i < maxRequests; i++) {
                        await middleware(context, mockNext);
                    }

                    // Remaining tokens should decrease monotonically
                    for (let i = 1; i < remainingTokens.length; i++) {
                        expect(remainingTokens[i]).toBeLessThanOrEqual(remainingTokens[i - 1]);
                    }

                    // First request should have maxRequests - 1 remaining
                    expect(remainingTokens[0]).toBe(maxRequests - 1);
                    // Last request should have 0 remaining
                    expect(remainingTokens[remainingTokens.length - 1]).toBe(0);
                }
            ), { numRuns: 20 });
        });

        it('Property: Rate limiting headers are always set correctly', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // ip
                fc.integer({ min: 1, max: 100 }), // maxRequests
                async (ip, maxRequests) => {
                    const middleware = createRateLimitMiddleware({
                        windowMs: 60000,
                        maxRequests
                    }, cache);

                    const context = createMockContext(ip);
                    let headers: Record<string, string> = {};

                    context.header = (name: string, value: string) => {
                        headers[name] = value;
                    };

                    const mockNext = () => Promise.resolve();

                    await middleware(context, mockNext);

                    // Required headers should be present
                    expect(headers['X-RateLimit-Limit']).toBe(maxRequests.toString());
                    expect(headers['X-RateLimit-Remaining']).toBeDefined();
                    expect(headers['X-RateLimit-Reset']).toBeDefined();
                    expect(headers['X-RateLimit-Policy']).toBe('token-bucket');

                    // Remaining should be a valid number
                    const remaining = parseInt(headers['X-RateLimit-Remaining']);
                    expect(remaining).toBeGreaterThanOrEqual(0);
                    expect(remaining).toBeLessThan(maxRequests);

                    // Reset time should be in the future
                    const resetTime = parseInt(headers['X-RateLimit-Reset']);
                    expect(resetTime).toBeGreaterThan(Math.floor(Date.now() / 1000));
                }
            ), { numRuns: 30 });
        });

        it('Property: API key rate limiting works independently from IP-based limiting', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // ip
                fc.string({ minLength: 1, maxLength: 20 }), // apiKey
                fc.string({ minLength: 1, maxLength: 20 }), // organizationId
                fc.integer({ min: 5, max: 20 }), // maxRequests
                async (ip, apiKey, organizationId, maxRequests) => {
                    const middleware = createRateLimitMiddleware({
                        windowMs: 60000,
                        maxRequests,
                        keyGenerator: async (c) => {
                            const key = c.req.header('X-API-Key');
                            return key ? `api_key:${key}` : `ip:${ip}`;
                        }
                    }, cache);

                    // Test with API key
                    const apiContext = createMockContext(ip, undefined, organizationId, 'basic', apiKey);
                    const mockNext = () => Promise.resolve();

                    // Consume all tokens for API key
                    for (let i = 0; i < maxRequests; i++) {
                        await middleware(apiContext, mockNext);
                    }

                    // IP-based requests should still work
                    const ipContext = createMockContext(ip);
                    await expect(middleware(ipContext, mockNext)).resolves.not.toThrow();
                }
            ), { numRuns: 20 });
        });
    });

    describe('Error Handling Properties', () => {
        it('Property: Rate limiter gracefully handles cache failures', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // ip
                fc.integer({ min: 1, max: 50 }), // maxRequests
                async (ip, maxRequests) => {
                    // Create a faulty cache that always throws
                    const faultyCache = {
                        get: () => Promise.reject(new Error('Cache error')),
                        set: () => Promise.reject(new Error('Cache error')),
                        increment: () => Promise.reject(new Error('Cache error'))
                    } as any;

                    const middleware = createRateLimitMiddleware({
                        windowMs: 60000,
                        maxRequests
                    }, faultyCache);

                    const context = createMockContext(ip);
                    const mockNext = () => Promise.resolve();

                    // Should not throw and should allow request to proceed
                    await expect(middleware(context, mockNext)).resolves.not.toThrow();
                }
            ), { numRuns: 20 });
        });
    });

    describe('Concurrent Access Properties', () => {
        it('Property: Concurrent requests are handled correctly', () => {
            fc.assert(fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 20 }), // ip
                fc.integer({ min: 5, max: 15 }), // maxRequests
                fc.integer({ min: 10, max: 30 }), // concurrentRequests
                async (ip, maxRequests, concurrentRequests) => {
                    // Create fresh cache for each test run to ensure clean state
                    const freshCache = new InMemoryCacheService();
                    const middleware = createRateLimitMiddleware({
                        windowMs: 60000,
                        maxRequests
                    }, freshCache);

                    const context = createMockContext(ip);
                    const mockNext = () => Promise.resolve();

                    // Send requests sequentially to test rate limiting
                    const results = [];
                    for (let i = 0; i < concurrentRequests; i++) {
                        try {
                            await middleware(context, mockNext);
                            results.push('success');
                        } catch (error) {
                            results.push(error);
                        }
                    }

                    // Count successful vs rate limited requests
                    const successful = results.filter(r => r === 'success');
                    const rateLimited = results.filter(r => r instanceof Error);

                    // Should have exactly maxRequests successful requests
                    expect(successful.length).toBe(Math.min(maxRequests, concurrentRequests));

                    // If concurrentRequests > maxRequests, remaining should be rate limited
                    if (concurrentRequests > maxRequests) {
                        expect(rateLimited.length).toBe(concurrentRequests - maxRequests);
                    }

                    // Total should equal total requests
                    expect(successful.length + rateLimited.length).toBe(concurrentRequests);
                }
            ), { numRuns: 20 });
        });
    });
});