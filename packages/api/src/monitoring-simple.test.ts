import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { monitoringMiddleware, getMetricsStore } from './middleware/monitoring';

describe('API Monitoring System', () => {
    let app: Hono;
    let metricsStore: ReturnType<typeof getMetricsStore>;

    beforeEach(() => {
        app = new Hono();
        metricsStore = getMetricsStore();

        // Clear metrics for clean tests
        const metrics = metricsStore.getMetrics();
        metrics.length = 0;

        // Add monitoring middleware
        app.use('*', monitoringMiddleware());

        // Add error handler
        app.onError((err, c) => {
            return c.json({ error: err.message }, 500);
        });

        // Add test routes
        app.get('/test', (c) => c.json({ message: 'success' }));
        app.get('/error', (c) => {
            throw new Error('Test error');
        });
    });

    describe('Basic Monitoring', () => {
        it('should track successful API requests', async () => {
            const res = await app.request('/test');

            expect(res.status).toBe(200);
            expect(res.headers.get('X-Request-ID')).toBeTruthy();
            expect(res.headers.get('X-Response-Time')).toMatch(/\d+ms/);

            const metrics = metricsStore.getMetrics();
            expect(metrics.length).toBeGreaterThan(0);

            const metric = metrics[metrics.length - 1]; // Get the last metric
            expect(metric.method).toBe('GET');
            expect(metric.path).toBe('/test');
            expect(metric.statusCode).toBe(200);
            expect(metric.responseTime).toBeGreaterThan(0);
            expect(metric.requestId).toBeTruthy();
        });

        it('should track API key information when provided', async () => {
            const res = await app.request('/test', {
                headers: { 'X-API-Key': 'test-api-key-12345' }
            });

            const metrics = metricsStore.getMetrics();
            const metric = metrics[metrics.length - 1];

            expect(metric.apiKey).toBe('test-api...');
        });

        it('should track user agent and IP address', async () => {
            const res = await app.request('/test', {
                headers: {
                    'User-Agent': 'Test Browser',
                    'X-Forwarded-For': '192.168.1.1'
                }
            });

            const metrics = metricsStore.getMetrics();
            const metric = metrics[metrics.length - 1];

            expect(metric.userAgent).toBe('Test Browser');
            expect(metric.ipAddress).toBe('192.168.1.1');
        });
    });

    describe('Error Tracking', () => {
        it('should track errors with details', async () => {
            // The error route will throw, but the middleware should catch it
            const res = await app.request('/error');

            // The response should be a 500 error
            expect(res.status).toBe(500);

            // Check if the error was tracked in general metrics
            const allMetrics = metricsStore.getMetrics();
            const errorMetric = allMetrics.find(m => m.statusCode === 500);
            expect(errorMetric).toBeDefined();
            expect(errorMetric?.error?.message).toBe('Test error');

            // Also check error-specific metrics
            const errorMetrics = metricsStore.getErrorMetrics();
            if (errorMetrics.length > 0) {
                const specificErrorMetric = errorMetrics[errorMetrics.length - 1];
                expect(specificErrorMetric.errorMessage).toBe('Test error');
                expect(specificErrorMetric.errorType).toBe('Error');
                expect(specificErrorMetric.statusCode).toBe(500);
            }
        });
    });

    describe('Performance Analytics', () => {
        it('should provide performance metrics', async () => {
            // Make a few requests
            await app.request('/test');
            await app.request('/test');

            const performanceMetrics = metricsStore.getPerformanceMetrics();

            expect(performanceMetrics.length).toBeGreaterThan(0);

            const testMetrics = performanceMetrics.find(m => m.endpoint === '/test');
            if (testMetrics) {
                expect(testMetrics.requestCount).toBeGreaterThan(0);
                expect(testMetrics.avgResponseTime).toBeGreaterThan(0);
            }
        });

        it('should provide health metrics', async () => {
            const healthMetrics = metricsStore.getHealthMetrics();

            expect(healthMetrics.status).toMatch(/healthy|degraded|unhealthy/);
            expect(healthMetrics.uptime).toBeGreaterThanOrEqual(0);
            expect(healthMetrics.memoryUsage).toBeDefined();
            expect(healthMetrics.memoryUsage.used).toBeGreaterThan(0);
            expect(healthMetrics.memoryUsage.total).toBeGreaterThan(0);
        });
    });

    describe('Analytics Dashboard', () => {
        it('should provide comprehensive analytics', async () => {
            // Generate some test data
            await app.request('/test');

            const analytics = metricsStore.getAnalytics();

            expect(analytics.usage).toBeDefined();
            expect(analytics.usage.totalRequests).toBeGreaterThan(0);
            expect(analytics.performance).toBeInstanceOf(Array);
            expect(analytics.errors).toBeDefined();
            expect(analytics.health).toBeDefined();
        });
    });
});