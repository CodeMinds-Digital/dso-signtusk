import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { InMemoryCacheService } from '@signtusk/cache';
import {
    TokenBucketRateLimiter,
    createRateLimitMiddleware,
    createDefaultRateLimitMiddleware,
    createAuthRateLimitMiddleware,
    createApiKeyRateLimitMiddleware,
    createUserRateLimitMiddleware,
    createOrganizationRateLimitMiddleware
} from './rate-limit';

// Mock Hono Context
function createMockContext(overrides: Partial<Context> = {}): Context {
    const mockHeaders = new Map<string, string>();

    return {
        req: {
            header: (name: string) => mockHeaders.get(name.toLowerCase()),
            path: '/api/test',
            ...overrides.req
        },
        header: vi.fn(),
        get: vi.fn(),
        env: {},
        ...overrides
    } as any;
}

describe('TokenBucketRateLimiter', () => {
    let cache: InMemoryCacheService;
    let limiter: TokenBucketRateLimiter;

    beforeEach(() => {
        cache = new InMemoryCacheService();
        limiter = new TokenBucketRateLimiter(cache);
    });

    it('should allow requests within rate limit', async () => {
        const result = await limiter.consume('test-key', 1, 10, 10, 60000);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
        expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it('should deny requests when rate limit exceeded', async () => {
        // Consume all tokens
        for (let i = 0; i < 10; i++) {
            await limiter.consume('test-key', 1, 10, 10, 60000);
        }

        // This should be denied
        const result = await limiter.consume('test-key', 1, 10, 10, 60000);

        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
    });

    it('should reset tokens after window expires', async () => {
        // Consume all tokens
        for (let i = 0; i < 10; i++) {
            await limiter.consume('test-key', 1, 10, 10, 60000);
        }

        // Verify all tokens are consumed
        let result = await limiter.consume('test-key', 1, 10, 10, 60000);
        expect(result.allowed).toBe(false);

        // Mock time passage (simulate 30 seconds = half window)
        vi.useFakeTimers();
        const originalNow = Date.now;
        const startTime = Date.now();

        // Mock Date.now to return time after window expires
        vi.spyOn(Date, 'now').mockImplementation(() => startTime + 60001);

        // Should have tokens reset after window expires
        result = await limiter.consume('test-key', 1, 10, 10, 60000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);

        // Restore original Date.now and timers
        vi.mocked(Date.now).mockRestore();
        vi.useRealTimers();
    });

    it('should handle different keys independently', async () => {
        await limiter.consume('key1', 5, 10, 10, 60000);
        const result = await limiter.consume('key2', 1, 10, 10, 60000);

        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(9);
    });
});

describe('Rate Limit Middleware', () => {
    let cache: InMemoryCacheService;
    let mockNext: vi.Mock;

    beforeEach(() => {
        cache = new InMemoryCacheService();
        mockNext = vi.fn();
    });

    describe('createRateLimitMiddleware', () => {
        it('should allow requests within limit', async () => {
            const middleware = createRateLimitMiddleware({
                windowMs: 60000,
                maxRequests: 10
            }, cache);

            const context = createMockContext();

            await middleware(context, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(context.header).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
            expect(context.header).toHaveBeenCalledWith('X-RateLimit-Policy', 'token-bucket');
        });

        it('should deny requests when limit exceeded', async () => {
            const middleware = createRateLimitMiddleware({
                windowMs: 60000,
                maxRequests: 2
            }, cache);

            const context = createMockContext();

            // First two requests should pass
            await middleware(context, mockNext);
            await middleware(context, mockNext);

            // Third request should fail
            await expect(middleware(context, mockNext)).rejects.toThrow(HTTPException);
        });

        it('should bypass premium users when configured', async () => {
            const middleware = createRateLimitMiddleware({
                windowMs: 60000,
                maxRequests: 1,
                bypassPremium: true
            }, cache);

            const context = createMockContext();
            context.get = vi.fn().mockReturnValue({
                id: 'user1',
                organizationId: 'org1',
                subscriptionPlan: 'premium'
            });

            // Should bypass rate limiting
            await middleware(context, mockNext);

            expect(mockNext).toHaveBeenCalled();
            expect(context.header).toHaveBeenCalledWith('X-RateLimit-Bypass', 'true');
        });

        it('should apply organization-based limits', async () => {
            const middleware = createRateLimitMiddleware({
                windowMs: 60000,
                maxRequests: 100, // Default
                organizationLimits: {
                    free: 10,
                    basic: 50,
                    premium: 200,
                    enterprise: 1000
                }
            }, cache);

            const context = createMockContext();
            context.get = vi.fn().mockReturnValue({
                id: 'user1',
                organizationId: 'org1',
                subscriptionPlan: 'basic'
            });

            await middleware(context, mockNext);

            expect(context.header).toHaveBeenCalledWith('X-RateLimit-Limit', '50');
        });

        it('should use custom key generator', async () => {
            const customKeyGenerator = vi.fn().mockReturnValue('custom-key');
            const middleware = createRateLimitMiddleware({
                windowMs: 60000,
                maxRequests: 10,
                keyGenerator: customKeyGenerator
            }, cache);

            const context = createMockContext();

            await middleware(context, mockNext);

            expect(customKeyGenerator).toHaveBeenCalledWith(context);
        });
    });

    describe('Specific Middleware Factories', () => {
        it('should create default rate limit middleware', () => {
            const middleware = createDefaultRateLimitMiddleware(cache);
            expect(middleware).toBeDefined();
        });

        it('should create auth rate limit middleware', () => {
            const middleware = createAuthRateLimitMiddleware(cache);
            expect(middleware).toBeDefined();
        });

        it('should create API key rate limit middleware', () => {
            const middleware = createApiKeyRateLimitMiddleware(cache);
            expect(middleware).toBeDefined();
        });

        it('should create user rate limit middleware', () => {
            const middleware = createUserRateLimitMiddleware(cache);
            expect(middleware).toBeDefined();
        });

        it('should create organization rate limit middleware', () => {
            const middleware = createOrganizationRateLimitMiddleware(cache);
            expect(middleware).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle cache errors gracefully', async () => {
            const faultyCache = {
                get: vi.fn().mockRejectedValue(new Error('Cache error')),
                set: vi.fn().mockRejectedValue(new Error('Cache error')),
                increment: vi.fn().mockRejectedValue(new Error('Cache error'))
            } as any;

            const middleware = createRateLimitMiddleware({
                windowMs: 60000,
                maxRequests: 10
            }, faultyCache);

            const context = createMockContext();

            // Should not throw and should allow request to proceed
            await middleware(context, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Rate Limit Headers', () => {
        it('should set correct rate limit headers', async () => {
            const middleware = createRateLimitMiddleware({
                windowMs: 60000,
                maxRequests: 10
            }, cache);

            const context = createMockContext();

            await middleware(context, mockNext);

            expect(context.header).toHaveBeenCalledWith('X-RateLimit-Limit', '10');
            expect(context.header).toHaveBeenCalledWith('X-RateLimit-Remaining', '9');
            expect(context.header).toHaveBeenCalledWith('X-RateLimit-Policy', 'token-bucket');
            expect(context.header).toHaveBeenCalledWith(
                'X-RateLimit-Reset',
                expect.any(String)
            );
        });

        it('should set retry-after header when rate limited', async () => {
            const middleware = createRateLimitMiddleware({
                windowMs: 60000,
                maxRequests: 1
            }, cache);

            const context = createMockContext();

            // First request passes
            await middleware(context, mockNext);

            // Second request should be rate limited
            try {
                await middleware(context, mockNext);
            } catch (error) {
                expect(error).toBeInstanceOf(HTTPException);
                expect(context.header).toHaveBeenCalledWith(
                    'Retry-After',
                    expect.any(String)
                );
            }
        });
    });
});

describe('Integration Tests', () => {
    let cache: InMemoryCacheService;

    beforeEach(() => {
        cache = new InMemoryCacheService();
    });

    it('should handle concurrent requests correctly', async () => {
        const middleware = createRateLimitMiddleware({
            windowMs: 60000,
            maxRequests: 5
        }, cache);

        // Use a consistent context that will generate the same key
        const context = createMockContext({
            req: {
                header: (name: string) => {
                    if (name.toLowerCase() === 'x-forwarded-for') return '192.168.1.1';
                    return undefined;
                },
                path: '/api/test'
            }
        });
        const mockNext = vi.fn();

        // Send requests sequentially first to verify rate limiting works
        const sequentialResults = [];
        for (let i = 0; i < 7; i++) {
            try {
                await middleware(context, mockNext);
                sequentialResults.push('success');
            } catch (error) {
                sequentialResults.push(error);
            }
        }

        const successful = sequentialResults.filter(r => r === 'success');
        const rateLimited = sequentialResults.filter(r => r instanceof HTTPException);

        // Should have exactly 5 successful and 2 rate limited
        expect(successful.length).toBe(5);
        expect(rateLimited.length).toBe(2);
    });

    it('should handle different subscription plans correctly', async () => {
        const middleware = createRateLimitMiddleware({
            windowMs: 60000,
            maxRequests: 100,
            organizationLimits: {
                free: 10,
                basic: 50,
                premium: 200,
                enterprise: 1000
            }
        }, cache);

        const mockNext = vi.fn();

        // Test free plan
        const freeContext = createMockContext();
        freeContext.get = vi.fn().mockReturnValue({
            subscriptionPlan: 'free'
        });

        await middleware(freeContext, mockNext);
        expect(freeContext.header).toHaveBeenCalledWith('X-RateLimit-Limit', '10');

        // Test enterprise plan
        const enterpriseContext = createMockContext();
        enterpriseContext.get = vi.fn().mockReturnValue({
            subscriptionPlan: 'enterprise'
        });

        await middleware(enterpriseContext, mockNext);
        expect(enterpriseContext.header).toHaveBeenCalledWith('X-RateLimit-Limit', '1000');
    });
});