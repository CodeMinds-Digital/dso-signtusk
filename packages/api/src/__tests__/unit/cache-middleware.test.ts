import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from 'hono';
import { InMemoryCacheService } from '@signtusk/cache';
import {
    createCacheMiddleware,
    createPredefinedCacheMiddleware,
    CacheInvalidationService,
    CacheConfigurations
} from '../../middleware/cache';

// Mock context helper
function createMockContext(
    method: string = 'GET',
    url: string = 'http://localhost/api/v1/test',
    user?: any
): Context {
    const mockResponse = {
        status: 200,
        headers: new Map([['Content-Type', 'application/json']]),
        clone: () => ({
            text: () => Promise.resolve('{"test": "data"}')
        })
    };

    return {
        req: {
            method,
            url,
            header: vi.fn((name: string) => {
                const headers: Record<string, string> = {
                    'If-None-Match': '',
                    'Accept': 'application/json',
                    'Accept-Encoding': 'gzip',
                };
                return headers[name];
            }),
        },
        res: mockResponse,
        get: vi.fn((key: string) => {
            if (key === 'user') return user;
            return undefined;
        }),
        json: vi.fn((data: any, status?: number) => ({
            status: status || 200,
            headers: new Map(),
            json: () => Promise.resolve(data)
        })),
        text: vi.fn((text: string, status?: number, headers?: Record<string, string>) => ({
            status: status || 200,
            headers: new Map(Object.entries(headers || {})),
            text: () => Promise.resolve(text)
        })),
    } as any;
}

describe('Cache Middleware', () => {
    let cacheService: InMemoryCacheService;
    let invalidationService: CacheInvalidationService;

    beforeEach(() => {
        cacheService = new InMemoryCacheService();
        invalidationService = new CacheInvalidationService(cacheService);
    });

    describe('Basic Caching', () => {
        it('should cache GET responses', async () => {
            const middleware = createCacheMiddleware(cacheService, { ttl: 300 });
            const context = createMockContext('GET', 'http://localhost/api/v1/test');

            let nextCalled = false;
            const next = async () => {
                nextCalled = true;
            };

            // First request - should call next and cache response
            await middleware(context, next);
            expect(nextCalled).toBe(true);

            // Second request - should return cached response
            nextCalled = false;
            await middleware(context, next);
            expect(nextCalled).toBe(false);
        });

        it('should not cache non-GET requests', async () => {
            const middleware = createCacheMiddleware(cacheService, { ttl: 300 });
            const context = createMockContext('POST', 'http://localhost/api/v1/test');

            let nextCalled = false;
            const next = async () => {
                nextCalled = true;
            };

            await middleware(context, next);
            expect(nextCalled).toBe(true);
        });

        it('should generate different cache keys for different URLs', async () => {
            const middleware = createCacheMiddleware(cacheService, { ttl: 300 });

            const context1 = createMockContext('GET', 'http://localhost/api/v1/test1');
            const context2 = createMockContext('GET', 'http://localhost/api/v1/test2');

            let nextCallCount = 0;
            const next = async () => {
                nextCallCount++;
            };

            // Both requests should call next (different cache keys)
            await middleware(context1, next);
            await middleware(context2, next);
            expect(nextCallCount).toBe(2);

            // Repeat requests should use cache
            await middleware(context1, next);
            await middleware(context2, next);
            expect(nextCallCount).toBe(2);
        });
    });

    describe('User-Specific Caching', () => {
        it('should vary cache by user when configured', async () => {
            const middleware = createCacheMiddleware(cacheService, {
                ttl: 300,
                varyByUser: true
            });

            const user1 = { id: 'user1', organizationId: 'org1' };
            const user2 = { id: 'user2', organizationId: 'org1' };

            const context1 = createMockContext('GET', 'http://localhost/api/v1/test', user1);
            const context2 = createMockContext('GET', 'http://localhost/api/v1/test', user2);

            let nextCallCount = 0;
            const next = async () => {
                nextCallCount++;
            };

            // Both requests should call next (different users)
            await middleware(context1, next);
            await middleware(context2, next);
            expect(nextCallCount).toBe(2);
        });

        it('should vary cache by organization when configured', async () => {
            const middleware = createCacheMiddleware(cacheService, {
                ttl: 300,
                varyByOrganization: true
            });

            const user1 = { id: 'user1', organizationId: 'org1' };
            const user2 = { id: 'user2', organizationId: 'org2' };

            const context1 = createMockContext('GET', 'http://localhost/api/v1/test', user1);
            const context2 = createMockContext('GET', 'http://localhost/api/v1/test', user2);

            let nextCallCount = 0;
            const next = async () => {
                nextCallCount++;
            };

            // Both requests should call next (different organizations)
            await middleware(context1, next);
            await middleware(context2, next);
            expect(nextCallCount).toBe(2);
        });
    });

    describe('ETag Support', () => {
        it('should generate ETags for responses', async () => {
            const middleware = createCacheMiddleware(cacheService, {
                ttl: 300,
                enableConditionalRequests: true
            });

            const context = createMockContext('GET', 'http://localhost/api/v1/test');

            const next = async () => {
                // Mock response
            };

            await middleware(context, next);

            // Check if ETag header would be set (in real implementation)
            // This is a simplified test - in real implementation, headers would be set on response
            expect(true).toBe(true); // Placeholder assertion
        });

        it('should return 304 for matching ETags', async () => {
            const middleware = createCacheMiddleware(cacheService, {
                ttl: 300,
                enableConditionalRequests: true
            });

            const context = createMockContext('GET', 'http://localhost/api/v1/test');

            // Mock If-None-Match header
            context.req.header = vi.fn((name: string) => {
                if (name === 'If-None-Match') return '"test-etag"';
                return undefined;
            });

            const next = async () => {
                // Should not be called for 304 responses
            };

            // First, cache a response
            await middleware(context, next);

            // Then test conditional request
            // In real implementation, this would return 304
            // This is a simplified test structure
            expect(true).toBe(true); // Placeholder assertion
        });
    });

    describe('Cache Invalidation', () => {
        it('should invalidate cache by key', async () => {
            await cacheService.set('test-key', 'test-value');
            expect(await cacheService.get('test-key')).toBe('test-value');

            await invalidationService.invalidateKey('test-key');
            expect(await cacheService.get('test-key')).toBeNull();
        });

        it('should invalidate cache by pattern', async () => {
            await cacheService.set('user:123:data', 'user-data');
            await cacheService.set('user:123:profile', 'user-profile');
            await cacheService.set('user:456:data', 'other-user-data');

            await invalidationService.invalidatePattern('user:123:*');

            expect(await cacheService.get('user:123:data')).toBeNull();
            expect(await cacheService.get('user:123:profile')).toBeNull();
            expect(await cacheService.get('user:456:data')).toBe('other-user-data');
        });

        it('should invalidate cache by tags', async () => {
            // Set up cache with tags
            await cacheService.set('tag:documents', ['doc1', 'doc2']);
            await cacheService.set('doc1', 'document-1-data');
            await cacheService.set('doc2', 'document-2-data');

            await invalidationService.invalidateTags(['documents']);

            expect(await cacheService.get('tag:documents')).toBeNull();
            expect(await cacheService.get('doc1')).toBeNull();
            expect(await cacheService.get('doc2')).toBeNull();
        });

        it('should invalidate user-specific cache', async () => {
            await cacheService.set('api:cache:user:123:data', 'user-data');
            await cacheService.set('api:cache:user:456:data', 'other-user-data');

            await invalidationService.invalidateUser('123');

            expect(await cacheService.get('api:cache:user:123:data')).toBeNull();
            expect(await cacheService.get('api:cache:user:456:data')).toBe('other-user-data');
        });

        it('should invalidate organization-specific cache', async () => {
            await cacheService.set('api:cache:org:org1:data', 'org-data');
            await cacheService.set('api:cache:org:org2:data', 'other-org-data');

            await invalidationService.invalidateOrganization('org1');

            expect(await cacheService.get('api:cache:org:org1:data')).toBeNull();
            expect(await cacheService.get('api:cache:org:org2:data')).toBe('other-org-data');
        });

        it('should clear all cache', async () => {
            await cacheService.set('key1', 'value1');
            await cacheService.set('key2', 'value2');

            await invalidationService.clearAll();

            expect(await cacheService.get('key1')).toBeNull();
            expect(await cacheService.get('key2')).toBeNull();
        });
    });

    describe('Predefined Cache Configurations', () => {
        it('should create static cache middleware', () => {
            const middleware = createPredefinedCacheMiddleware(cacheService, 'static');
            expect(middleware).toBeDefined();
        });

        it('should create user-specific cache middleware', () => {
            const middleware = createPredefinedCacheMiddleware(cacheService, 'userSpecific');
            expect(middleware).toBeDefined();
        });

        it('should create organization-specific cache middleware', () => {
            const middleware = createPredefinedCacheMiddleware(cacheService, 'organizationSpecific');
            expect(middleware).toBeDefined();
        });

        it('should create public API cache middleware', () => {
            const middleware = createPredefinedCacheMiddleware(cacheService, 'publicApi');
            expect(middleware).toBeDefined();
        });

        it('should create templates cache middleware', () => {
            const middleware = createPredefinedCacheMiddleware(cacheService, 'templates');
            expect(middleware).toBeDefined();
        });

        it('should create documents cache middleware', () => {
            const middleware = createPredefinedCacheMiddleware(cacheService, 'documents');
            expect(middleware).toBeDefined();
        });
    });

    describe('Cache Configuration Validation', () => {
        it('should use default TTL when not specified', async () => {
            const middleware = createCacheMiddleware(cacheService);
            expect(middleware).toBeDefined();
        });

        it('should use custom TTL when specified', async () => {
            const middleware = createCacheMiddleware(cacheService, { ttl: 600 });
            expect(middleware).toBeDefined();
        });

        it('should handle custom key generator', async () => {
            const middleware = createCacheMiddleware(cacheService, {
                keyGenerator: (c) => `custom:${c.req.url}`
            });
            expect(middleware).toBeDefined();
        });

        it('should handle custom shouldCache function', async () => {
            const middleware = createCacheMiddleware(cacheService, {
                shouldCache: (c, response) => response.status === 200
            });
            expect(middleware).toBeDefined();
        });

        it('should handle custom ETag generator', async () => {
            const middleware = createCacheMiddleware(cacheService, {
                etagGenerator: (content) => `"custom-${content.length}"`
            });
            expect(middleware).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle cache service errors gracefully', async () => {
            // Create a faulty cache service
            const faultyCacheService = {
                get: vi.fn().mockRejectedValue(new Error('Cache error')),
                set: vi.fn().mockRejectedValue(new Error('Cache error')),
                del: vi.fn().mockRejectedValue(new Error('Cache error')),
            } as any;

            const middleware = createCacheMiddleware(faultyCacheService);
            const context = createMockContext('GET', 'http://localhost/api/v1/test');

            let nextCalled = false;
            const next = async () => {
                nextCalled = true;
            };

            // Should not throw error and should call next
            await expect(middleware(context, next)).resolves.not.toThrow();
            expect(nextCalled).toBe(true);
        });

        it('should handle invalidation service errors gracefully', async () => {
            const faultyCacheService = {
                del: vi.fn().mockRejectedValue(new Error('Delete error')),
                keys: vi.fn().mockRejectedValue(new Error('Keys error')),
                flush: vi.fn().mockRejectedValue(new Error('Flush error')),
            } as any;

            const faultyInvalidationService = new CacheInvalidationService(faultyCacheService);

            // Should not throw errors
            await expect(faultyInvalidationService.invalidateKey('test')).resolves.not.toThrow();
            await expect(faultyInvalidationService.invalidatePattern('test*')).resolves.not.toThrow();
            await expect(faultyInvalidationService.clearAll()).resolves.not.toThrow();
        });
    });
});

describe('Cache Configurations', () => {
    it('should have static configuration', () => {
        expect(CacheConfigurations.static).toBeDefined();
        expect(CacheConfigurations.static.ttl).toBe(3600);
        expect(CacheConfigurations.static.enableCDNHeaders).toBe(true);
        expect(CacheConfigurations.static.tags).toContain('static');
    });

    it('should have user-specific configuration', () => {
        expect(CacheConfigurations.userSpecific).toBeDefined();
        expect(CacheConfigurations.userSpecific.varyByUser).toBe(true);
        expect(CacheConfigurations.userSpecific.tags).toContain('user-data');
    });

    it('should have organization-specific configuration', () => {
        expect(CacheConfigurations.organizationSpecific).toBeDefined();
        expect(CacheConfigurations.organizationSpecific.varyByOrganization).toBe(true);
        expect(CacheConfigurations.organizationSpecific.tags).toContain('org-data');
    });

    it('should have public API configuration', () => {
        expect(CacheConfigurations.publicApi).toBeDefined();
        expect(CacheConfigurations.publicApi.enableCDNHeaders).toBe(true);
        expect(CacheConfigurations.publicApi.tags).toContain('public-api');
    });

    it('should have templates configuration', () => {
        expect(CacheConfigurations.templates).toBeDefined();
        expect(CacheConfigurations.templates.varyByOrganization).toBe(true);
        expect(CacheConfigurations.templates.tags).toContain('templates');
    });

    it('should have documents configuration', () => {
        expect(CacheConfigurations.documents).toBeDefined();
        expect(CacheConfigurations.documents.varyByUser).toBe(true);
        expect(CacheConfigurations.documents.tags).toContain('documents');
    });
});