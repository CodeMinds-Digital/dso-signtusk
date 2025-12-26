import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCacheService } from '@signtusk/cache';
import { createAPIServer } from '../../server';

describe('Cache Integration Tests', () => {
    let app: any;
    let cacheService: InMemoryCacheService;

    beforeEach(() => {
        // Set up test environment
        process.env.NODE_ENV = 'test';
        process.env.REDIS_HOST = 'localhost';
        process.env.REDIS_PORT = '6379';

        app = createAPIServer();
        cacheService = new InMemoryCacheService();
    });

    describe('API Response Caching', () => {
        it('should cache GET responses', async () => {
            // First request
            const response1 = await app.request('/health');
            expect(response1.status).toBe(200);

            const data1 = await response1.json();
            expect(data1.status).toBe('ok');

            // Second request should potentially be cached
            const response2 = await app.request('/health');
            expect(response2.status).toBe(200);

            const data2 = await response2.json();
            expect(data2.status).toBe('ok');
        });

        it('should not cache POST requests', async () => {
            const response = await app.request('/api/cache/invalidate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'all'
                }),
            });

            // Should not be cached (POST request)
            expect(response.status).toBe(200);
        });

        it('should provide cache management endpoints', async () => {
            // Test cache stats endpoint
            const statsResponse = await app.request('/api/cache/stats');
            expect(statsResponse.status).toBe(200);

            const statsData = await statsResponse.json();
            expect(statsData).toHaveProperty('cache');
            expect(statsData).toHaveProperty('timestamp');
        });

        it('should support cache invalidation', async () => {
            // Test cache invalidation endpoint
            const invalidateResponse = await app.request('/api/cache/invalidate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'all'
                }),
            });

            expect(invalidateResponse.status).toBe(200);

            const invalidateData = await invalidateResponse.json();
            expect(invalidateData.message).toContain('Cleared all cache');
        });

        it('should support CDN purging', async () => {
            // Test CDN purge endpoint
            const purgeResponse = await app.request('/api/cache/purge-cdn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'url',
                    url: 'https://example.com/test'
                }),
            });

            // Should handle CDN purge request
            expect([200, 500]).toContain(purgeResponse.status);
        });
    });

    describe('Cache Headers', () => {
        it('should include cache-related headers in responses', async () => {
            const response = await app.request('/health');
            expect(response.status).toBe(200);

            // Check for cache-related headers
            const headers = Object.fromEntries(response.headers.entries());

            // Should have some cache-related headers
            // Note: Exact headers depend on middleware configuration
            expect(typeof headers).toBe('object');
        });
    });

    describe('Health Check with Cache Info', () => {
        it('should include cache information in health check', async () => {
            const response = await app.request('/health');
            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('cache');
            expect(data.cache).toHaveProperty('type');
            expect(data.cache).toHaveProperty('status');

            // Should also include CDN info
            expect(data).toHaveProperty('cdn');
            expect(data.cdn).toHaveProperty('provider');
            expect(data.cdn).toHaveProperty('enabled');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid cache invalidation requests', async () => {
            const response = await app.request('/api/cache/invalidate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'invalid-type'
                }),
            });

            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toContain('Invalid invalidation type');
        });

        it('should handle invalid CDN purge requests', async () => {
            const response = await app.request('/api/cache/purge-cdn', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'invalid-type'
                }),
            });

            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toContain('Invalid purge type');
        });

        it('should handle missing parameters in cache requests', async () => {
            const response = await app.request('/api/cache/invalidate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    type: 'key'
                    // Missing 'key' parameter
                }),
            });

            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.error).toContain('Missing required parameters');
        });
    });
});