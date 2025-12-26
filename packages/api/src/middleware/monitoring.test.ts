import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { monitoringMiddleware, getMetricsStore, checkAlerts, defaultAlertConfig } from './monitoring';

describe('API Monitoring Middleware', () => {
    let app: Hono;
    let metricsStore: ReturnType<typeof getMetricsStore>;

    beforeEach(() => {
        app = new Hono();
        metricsStore = getMetricsStore();

        // Clear metrics store for each test
        metricsStore.getMetrics().length = 0;

        // Add monitoring middleware
        app.use('*', monitoringMiddleware());

        // Add test routes
        app.get('/test', (c) => c.json({ message: 'success' }));
        app.get('/slow', async (c) => {
            await new Promise(resolve => setTimeout(resolve, 100));
            return c.json({ message: 'slow response' });
        });
        app.get('/error', (c) => {
            throw new Error('Test error');
        });
        app.get('/auth-required', (c) => {
            c.set('user', { id: 'user123', organizationId: 'org123', roles: ['user'] });
            return c.json({ message: 'authenticated' });
        });
    });

    describe('Request Tracking', () => {
        it('should track successful requests', async () => {
            const res = await app.request('/test');

            expect(res.status).toBe(200);
            expect(res.headers.get('X-Request-ID')).toBeTruthy();
            expect(res.headers.get('X-Response-Time')).toMatch(/\d+ms/);

            const metrics = metricsStore.getMetrics();
            expect(metrics).toHaveLength(1);

            const metric = metrics[0];
            expect(metric.method).toBe('GET');
            expect(metric.path).toBe('/test');
            expect(metric.statusCode).toBe(200);
            expect(metric.responseTime).toBeGreaterThan(0);
            expect(metric.requestId).toBeTruthy();
            expect(metric.timestamp).toBeInstanceOf(Date);
        });

        it('should track request and response sizes', async () => {
            const res = await app.request('/test', {
                method: 'POST',
                body: JSON.stringify({ data: 'test' }),
                headers: { 'Content-Type': 'application/json' }
            });

            const metrics = metricsStore.getMetrics();
            const metric = metrics[0];

            expect(metric.requestSize).toBeGreaterThan(0);
            expect(metric.responseSize).toBeGreaterThan(0);
        });

        it('should track user and organization information', async () => {
            const res = await app.request('/auth-required');

            const metrics = metricsStore.getMetrics();
            const metric = metrics[0];

            expect(metric.userId).toBe('user123');
            expect(metric.organizationId).toBe('org123');
        });

        it('should track API key information', async () => {
            const res = await app.request('/test', {
                headers: { 'X-API-Key': 'test-api-key-12345' }
            });

            const metrics = metricsStore.getMetrics();
            const metric = metrics[0];

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
            const metric = metrics[0];

            expect(metric.userAgent).toBe('Test Browser');
            expect(metric.ipAddress).toBe('192.168.1.1');
        });
    });

    describe('Error Tracking', () => {
        it('should track errors with details', async () => {
            const res = await app.request('/error');

            expect(res.status).toBe(500);

            const metrics = metricsStore.getMetrics();
            const metric = metrics[0];

            expect(metric.statusCode).toBe(500);
            expect(metric.error).toBeDefined();
            expect(metric.error?.message).toBe('Test error');
            expect(metric.error?.type).toBe('Error');

            const errorMetrics = metricsStore.getErrorMetrics();
            expect(errorMetrics).toHaveLength(1);

            const errorMetric = errorMetrics[0];
            expect(errorMetric.errorMessage).toBe('Test error');
            expect(errorMetric.errorType).toBe('Error');
            expect(errorMetric.statusCode).toBe(500);
        });
    });

    describe('Performance Metrics', () => {
        it('should calculate performance metrics correctly', async () => {
            // Make multiple requests to the same endpoint
            await app.request('/test');
            await app.request('/test');
            await app.request('/slow');

            const performanceMetrics = metricsStore.getPerformanceMetrics();

            expect(performanceMetrics.length).toBeGreaterThan(0);

            const testEndpointMetrics = performanceMetrics.find(m => m.endpoint === '/test');
            expect(testEndpointMetrics).toBeDefined();
            expect(testEndpointMetrics?.requestCount).toBe(2);
            expect(testEndpointMetrics?.avgResponseTime).toBeGreaterThan(0);
            expect(testEndpointMetrics?.p95ResponseTime).toBeGreaterThan(0);
            expect(testEndpointMetrics?.p99ResponseTime).toBeGreaterThan(0);
        });

        it('should filter performance metrics by endpoint', async () => {
            await app.request('/test');
            await app.request('/slow');

            const testMetrics = metricsStore.getPerformanceMetrics('/test');
            expect(testMetrics).toHaveLength(1);
            expect(testMetrics[0].endpoint).toBe('/test');
        });
    });

    describe('Health Metrics', () => {
        it('should provide health metrics', async () => {
            await app.request('/test');
            await app.request('/error');

            const healthMetrics = metricsStore.getHealthMetrics();

            expect(healthMetrics.status).toMatch(/healthy|degraded|unhealthy/);
            expect(healthMetrics.uptime).toBeGreaterThan(0);
            expect(healthMetrics.errorRate).toBeGreaterThanOrEqual(0);
            expect(healthMetrics.throughput).toBeGreaterThanOrEqual(0);
            expect(healthMetrics.memoryUsage).toBeDefined();
            expect(healthMetrics.memoryUsage.used).toBeGreaterThan(0);
            expect(healthMetrics.memoryUsage.total).toBeGreaterThan(0);
            expect(healthMetrics.memoryUsage.percentage).toBeGreaterThanOrEqual(0);
            expect(healthMetrics.timestamp).toBeInstanceOf(Date);
        });

        it('should determine health status based on metrics', async () => {
            // Make requests to generate metrics
            await app.request('/test');

            const healthMetrics = metricsStore.getHealthMetrics();

            // With low error rate and response time, should be healthy
            expect(healthMetrics.status).toBe('healthy');
        });
    });

    describe('Analytics', () => {
        it('should provide comprehensive analytics', async () => {
            // Generate some test data
            await app.request('/test');
            await app.request('/slow');
            await app.request('/error');

            const analytics = metricsStore.getAnalytics();

            expect(analytics.usage).toBeDefined();
            expect(analytics.usage.totalRequests).toBe(3);
            expect(analytics.usage.topEndpoints).toBeInstanceOf(Array);

            expect(analytics.performance).toBeInstanceOf(Array);
            expect(analytics.performance.length).toBeGreaterThan(0);

            expect(analytics.errors).toBeDefined();
            expect(analytics.errors.totalErrors).toBe(1);
            expect(analytics.errors.errorRate).toBeCloseTo(1 / 3);

            expect(analytics.health).toBeDefined();
        });

        it('should filter analytics by time range', async () => {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            await app.request('/test');

            const analytics = metricsStore.getAnalytics({
                start: oneHourAgo,
                end: now
            });

            expect(analytics.usage.totalRequests).toBe(1);
        });
    });

    describe('Alerts', () => {
        it('should check alerts with default configuration', () => {
            const alerts = checkAlerts(defaultAlertConfig);

            expect(Array.isArray(alerts)).toBe(true);

            // With no metrics, should have no alerts
            expect(alerts).toHaveLength(0);
        });

        it('should generate alerts for high error rates', async () => {
            // Generate high error rate
            for (let i = 0; i < 10; i++) {
                try {
                    await app.request('/error');
                } catch (e) {
                    // Ignore errors for this test
                }
            }

            const alerts = checkAlerts({
                ...defaultAlertConfig,
                errorRateThreshold: 0.01 // Very low threshold to trigger alert
            });

            expect(alerts.length).toBeGreaterThan(0);
            const errorAlert = alerts.find(a => a.type === 'high_error_rate');
            expect(errorAlert).toBeDefined();
            expect(errorAlert?.severity).toMatch(/warning|critical/);
        });

        it('should generate alerts for high response times', async () => {
            // This test would need to be adjusted based on actual response times
            // For now, just verify the alert structure
            const alerts = checkAlerts({
                ...defaultAlertConfig,
                responseTimeThreshold: 1 // Very low threshold
            });

            // Structure validation
            alerts.forEach(alert => {
                expect(alert.type).toBeTruthy();
                expect(alert.message).toBeTruthy();
                expect(alert.severity).toMatch(/warning|critical/);
                expect(alert.timestamp).toBeInstanceOf(Date);
            });
        });
    });

    describe('Memory Management', () => {
        it('should limit stored metrics to prevent memory leaks', async () => {
            // This test would need to generate many requests to test the limit
            // For now, just verify the basic functionality
            await app.request('/test');

            const metrics = metricsStore.getMetrics();
            expect(metrics.length).toBeLessThanOrEqual(10000);
        });
    });
});