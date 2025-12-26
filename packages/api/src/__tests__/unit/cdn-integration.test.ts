import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Context } from 'hono';
import {
    CDNIntegrationService,
    CDNCacheStrategy,
    createCDNMiddleware,
    createCDNService
} from '../../cache/cdn';

// Mock fetch globally
global.fetch = vi.fn();

// Mock context helper
function createMockContext(
    method: string = 'GET',
    url: string = 'http://localhost/api/v1/test',
    user?: any
): Context {
    const mockHeaders = new Map<string, string>();

    const mockResponse = {
        status: 200,
        headers: mockHeaders,
        ok: true,
    };

    return {
        req: {
            method,
            url,
            header: vi.fn((name: string) => {
                const headers: Record<string, string> = {
                    'X-Cache-Tags': 'test-tag',
                    'X-Vary-Headers': 'Custom-Header',
                };
                return headers[name];
            }),
        },
        res: mockResponse,
        get: vi.fn((key: string) => {
            if (key === 'user') return user;
            return undefined;
        }),
    } as any;
}

describe('CDN Integration Service', () => {
    let cdnService: CDNIntegrationService;

    beforeEach(() => {
        vi.clearAllMocks();

        cdnService = new CDNIntegrationService({
            provider: 'cloudflare',
            defaultTtl: 300,
            maxTtl: 86400,
            enablePurging: true,
            credentials: {
                apiKey: 'test-api-key',
                zoneId: 'test-zone-id',
            },
        });
    });

    describe('Cache Header Setting', () => {
        it('should set short cache headers', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.SHORT);

            const cacheControl = context.res.headers.get('Cache-Control');
            expect(cacheControl).toContain('max-age=60');
            expect(cacheControl).toContain('s-maxage=300');
            expect(cacheControl).toContain('public');
            expect(cacheControl).toContain('stale-while-revalidate=60');
        });

        it('should set medium cache headers', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            const cacheControl = context.res.headers.get('Cache-Control');
            expect(cacheControl).toContain('max-age=300');
            expect(cacheControl).toContain('s-maxage=1800');
            expect(cacheControl).toContain('public');
            expect(cacheControl).toContain('stale-while-revalidate=300');
        });

        it('should set long cache headers', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.LONG);

            const cacheControl = context.res.headers.get('Cache-Control');
            expect(cacheControl).toContain('max-age=3600');
            expect(cacheControl).toContain('s-maxage=86400');
            expect(cacheControl).toContain('public');
            expect(cacheControl).toContain('stale-while-revalidate=3600');
        });

        it('should set immutable cache headers', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.IMMUTABLE);

            const cacheControl = context.res.headers.get('Cache-Control');
            expect(cacheControl).toContain('max-age=31536000');
            expect(cacheControl).toContain('s-maxage=31536000');
            expect(cacheControl).toContain('public');
            expect(cacheControl).toContain('immutable');
        });

        it('should set no-cache headers', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.NO_CACHE);

            const cacheControl = context.res.headers.get('Cache-Control');
            expect(cacheControl).toContain('no-cache');
            expect(cacheControl).toContain('no-store');
            expect(cacheControl).toContain('must-revalidate');
        });

        it('should use custom TTL when provided', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM, 600);

            const cacheControl = context.res.headers.get('Cache-Control');
            expect(cacheControl).toContain('max-age=600');
            expect(cacheControl).toContain('s-maxage=600');
        });
    });

    describe('Provider-Specific Headers', () => {
        it('should set Cloudflare-specific headers', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            expect(context.res.headers.get('CF-Edge-Cache')).toContain('max-age=1800');
            expect(context.res.headers.get('CF-Browser-Cache')).toContain('max-age=300');
        });

        it('should set Cloudflare bypass for no-cache', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.NO_CACHE);

            expect(context.res.headers.get('CF-Cache-Status')).toBe('BYPASS');
        });

        it('should set AWS CloudFront headers', () => {
            const cloudFrontService = new CDNIntegrationService({
                provider: 'aws-cloudfront',
                defaultTtl: 300,
                maxTtl: 86400,
                enablePurging: false,
            });

            const context = createMockContext();

            cloudFrontService.setCDNCacheHeaders(context, CDNCacheStrategy.IMMUTABLE);

            expect(context.res.headers.get('CloudFront-Policy')).toBe('immutable');
            expect(context.res.headers.get('CloudFront-Origin-Request-Policy')).toBe('CORS-S3Origin');
        });

        it('should set Fastly headers', () => {
            const fastlyService = new CDNIntegrationService({
                provider: 'fastly',
                defaultTtl: 300,
                maxTtl: 86400,
                enablePurging: true,
                credentials: {
                    apiKey: 'test-fastly-key',
                },
            });

            const context = createMockContext();

            fastlyService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            expect(context.res.headers.get('Surrogate-Control')).toContain('max-age=1800');
            expect(context.res.headers.get('Surrogate-Key')).toBeDefined();
        });
    });

    describe('Vary Header Setting', () => {
        it('should set basic Vary headers', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            const varyHeader = context.res.headers.get('Vary');
            expect(varyHeader).toContain('Accept');
            expect(varyHeader).toContain('Accept-Encoding');
        });

        it('should include Authorization in Vary for authenticated users', () => {
            const user = { id: 'user1', organizationId: 'org1' };
            const context = createMockContext('GET', 'http://localhost/api/v1/test', user);

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            const varyHeader = context.res.headers.get('Vary');
            expect(varyHeader).toContain('Authorization');
        });

        it('should include custom Vary headers', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            const varyHeader = context.res.headers.get('Vary');
            expect(varyHeader).toContain('Custom-Header');
        });
    });

    describe('Cache Tags', () => {
        it('should set Cloudflare cache tags', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            const cacheTags = context.res.headers.get('Cache-Tag');
            expect(cacheTags).toBeDefined();
            expect(cacheTags).toContain('api-v1');
        });

        it('should set Fastly surrogate keys', () => {
            const fastlyService = new CDNIntegrationService({
                provider: 'fastly',
                defaultTtl: 300,
                maxTtl: 86400,
                enablePurging: true,
            });

            const context = createMockContext();

            fastlyService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            const surrogateKey = context.res.headers.get('Surrogate-Key');
            expect(surrogateKey).toBeDefined();
        });

        it('should set generic cache tags for unknown providers', () => {
            const genericService = new CDNIntegrationService({
                provider: 'generic',
                defaultTtl: 300,
                maxTtl: 86400,
                enablePurging: false,
            });

            const context = createMockContext();

            genericService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            const cacheTags = context.res.headers.get('X-Cache-Tags');
            expect(cacheTags).toBeDefined();
        });

        it('should include organization tags for authenticated users', () => {
            const user = { id: 'user1', organizationId: 'org1' };
            const context = createMockContext('GET', 'http://localhost/api/v1/test', user);

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            const cacheTags = context.res.headers.get('Cache-Tag');
            expect(cacheTags).toContain('org-org1');
        });

        it('should include custom cache tags from headers', () => {
            const context = createMockContext();

            cdnService.setCDNCacheHeaders(context, CDNCacheStrategy.MEDIUM);

            const cacheTags = context.res.headers.get('Cache-Tag');
            expect(cacheTags).toContain('test-tag');
        });
    });

    describe('CDN Purging', () => {
        it('should purge Cloudflare cache by URL', async () => {
            const mockFetch = vi.mocked(fetch);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            } as Response);

            const result = await cdnService.purgeByUrl('https://example.com/test');

            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.cloudflare.com/client/v4/zones/test-zone-id/purge_cache',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test-api-key',
                        'Content-Type': 'application/json',
                    }),
                    body: JSON.stringify({
                        files: ['https://example.com/test'],
                    }),
                })
            );
        });

        it('should purge Cloudflare cache by tags', async () => {
            const mockFetch = vi.mocked(fetch);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true }),
            } as Response);

            const result = await cdnService.purgeByTags(['tag1', 'tag2']);

            expect(result).toBe(true);
            expect(mockFetch).toHaveBeenCalledWith(
                'https://api.cloudflare.com/client/v4/zones/test-zone-id/purge_cache',
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        tags: ['tag1', 'tag2'],
                    }),
                })
            );
        });

        it('should handle purge failures gracefully', async () => {
            const mockFetch = vi.mocked(fetch);
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
            } as Response);

            const result = await cdnService.purgeByUrl('https://example.com/test');

            expect(result).toBe(false);
        });

        it('should handle purge errors gracefully', async () => {
            const mockFetch = vi.mocked(fetch);
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await cdnService.purgeByUrl('https://example.com/test');

            expect(result).toBe(false);
        });

        it('should return false when purging is disabled', async () => {
            // Clear previous mock calls
            vi.clearAllMocks();

            const noPurgeService = new CDNIntegrationService({
                provider: 'cloudflare',
                defaultTtl: 300,
                maxTtl: 86400,
                enablePurging: false,
            });

            const result = await noPurgeService.purgeByUrl('https://example.com/test');

            expect(result).toBe(false);
            expect(fetch).not.toHaveBeenCalled();
        });

        it('should return false when credentials are missing', async () => {
            const noCredsService = new CDNIntegrationService({
                provider: 'cloudflare',
                defaultTtl: 300,
                maxTtl: 86400,
                enablePurging: true,
            });

            const result = await noCredsService.purgeByUrl('https://example.com/test');

            expect(result).toBe(false);
            expect(fetch).not.toHaveBeenCalled();
        });
    });

    describe('CDN Middleware', () => {
        it('should apply CDN headers to successful GET requests', async () => {
            const middleware = createCDNMiddleware(cdnService);
            const context = createMockContext('GET', 'http://localhost/api/v1/test');
            context.res.status = 200;

            let nextCalled = false;
            const next = async () => {
                nextCalled = true;
            };

            await middleware(context, next);

            expect(nextCalled).toBe(true);
            expect(context.res.headers.get('Cache-Control')).toBeDefined();
        });

        it('should not apply CDN headers to non-GET requests', async () => {
            const middleware = createCDNMiddleware(cdnService);
            const context = createMockContext('POST', 'http://localhost/api/v1/test');

            let nextCalled = false;
            const next = async () => {
                nextCalled = true;
            };

            await middleware(context, next);

            expect(nextCalled).toBe(true);
            expect(context.res.headers.get('Cache-Control')).toBeUndefined();
        });

        it('should not apply CDN headers to error responses', async () => {
            const middleware = createCDNMiddleware(cdnService);
            const context = createMockContext('GET', 'http://localhost/api/v1/test');
            context.res.status = 500;

            let nextCalled = false;
            const next = async () => {
                nextCalled = true;
            };

            await middleware(context, next);

            expect(nextCalled).toBe(true);
            expect(context.res.headers.get('Cache-Control')).toBeUndefined();
        });
    });

    describe('Environment-based CDN Service Creation', () => {
        it('should create CDN service with environment variables', () => {
            // Mock environment variables
            const originalEnv = process.env;
            process.env = {
                ...originalEnv,
                CDN_PROVIDER: 'cloudflare',
                CDN_DEFAULT_TTL: '600',
                CDN_MAX_TTL: '172800',
                CDN_ENABLE_PURGING: 'true',
                CDN_API_KEY: 'env-api-key',
                CDN_ZONE_ID: 'env-zone-id',
            };

            const service = createCDNService();
            expect(service).toBeInstanceOf(CDNIntegrationService);

            // Restore environment
            process.env = originalEnv;
        });

        it('should use default values when environment variables are not set', () => {
            // Mock environment variables
            const originalEnv = process.env;
            process.env = {};

            const service = createCDNService();
            expect(service).toBeInstanceOf(CDNIntegrationService);

            // Restore environment
            process.env = originalEnv;
        });
    });
});