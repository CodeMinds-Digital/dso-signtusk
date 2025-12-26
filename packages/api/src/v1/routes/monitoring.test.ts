import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { monitoringRouter } from './monitoring';
import { monitoringMiddleware, getMetricsStore } from '../../middleware/monitoring';

describe('Monitoring Routes', () => {
    let app: Hono;
    let metricsStore: ReturnType<typeof getMetricsStore>;

    beforeEach(() => {
        app = new Hono();
        metricsStore = getMetricsStore();

        // Clear metrics store
        metricsStore.getMetrics().length = 0;

        // Add monitoring middleware
        app.use('*', monitoringMiddleware());

        // Mock authentication middleware
        app.use('*', (c, next) => {
            // Mock admin user for testing
            c.set('user', {
                id: 'admin123',
                organizationId: 'org123',
                roles: ['admin']
            });
            return next();
        });

        // Mount monitoring routes
        app.route('/monitoring', monitoringRouter);

        // Add test routes to generate metrics
        app.get('/test', (c) => c.json({ message: 'success' }));
        app.get('/error', (c) => {
            throw new Error('Test error');
        });
    });

    describe('GET /monitoring/analytics', () => {
        it('should return comprehensive analytics', async () => {
            // Generate some test data
            await app.request('/test');
            await app.request('/test');

            const res = await app.request('/monitoring/analytics');

            expect(res.status).toBe(200);

            const analytics = await res.json();

            expect(analytics.usage).toBeDefined();
            expect(analytics.usage.totalRequests).toBeGreaterThan(0);
            expect(analytics.usage.uniqueUsers).toBeGreaterThanOrEqual(0);
            expect(analytics.usage.uniqueOrganizations).toBeGreaterThanOrEqual(0);
            expect(analytics.usage.topEndpoints).toBeInstanceOf(Array);

            expect(analytics.performance).toBeInstanceOf(Array);
            expect(analytics.errors).toBeDefined();
            expect(analytics.health).toBeDefined();
        });

        it('should filter analytics by time range', async () => {
            await app.request('/test');

            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            const res = await app.request(
                `/monitoring/analytics?start=${oneHourAgo.toISOString()}&end=${now.toISOString()}`
            );

            expect(res.status).toBe(200);

            const analytics = await res.json();
            expect(analytics.usage.totalRequests).toBeGreaterThanOrEqual(0);
        });

        it('should require admin access', async () => {
            // Create app without admin user
            const nonAdminApp = new Hono();
            nonAdminApp.use('*', (c, next) => {
                c.set('user', {
                    id: 'user123',
                    organizationId: 'org123',
                    roles: ['user']
                });
                return next();
            });
            nonAdminApp.route('/monitoring', monitoringRouter);

            const res = await nonAdminApp.request('/monitoring/analytics');

            expect(res.status).toBe(401);

            const error = await res.json();
            expect(error.error).toBe('Unauthorized');
        });
    });

    describe('GET /monitoring/metrics/usage', () => {
        it('should return usage metrics', async () => {
            await app.request('/test');

            const res = await app.request('/monitoring/metrics/usage');

            expect(res.status).toBe(200);

            const metrics = await res.json();
            expect(Array.isArray(metrics)).toBe(true);
            expect(metrics.length).toBeGreaterThan(0);

            const metric = metrics[0];
            expect(metric.requestId).toBeTruthy();
            expect(metric.method).toBeTruthy();
            expect(metric.path).toBeTruthy();
            expect(metric.statusCode).toBeTruthy();
            expect(metric.responseTime).toBeGreaterThanOrEqual(0);
            expect(metric.timestamp).toBeTruthy();
        });

        it('should filter by time range', async () => {
            await app.request('/test');

            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            const res = await app.request(
                `/monitoring/metrics/usage?start=${oneHourAgo.toISOString()}&end=${now.toISOString()}`
            );

            expect(res.status).toBe(200);

            const metrics = await res.json();
            expect(Array.isArray(metrics)).toBe(true);
        });
    });

    describe('GET /monitoring/metrics/performance', () => {
        it('should return performance metrics', async () => {
            await app.request('/test');
            await app.request('/test');

            const res = await app.request('/monitoring/metrics/performance');

            expect(res.status).toBe(200);

            const metrics = await res.json();
            expect(Array.isArray(metrics)).toBe(true);

            if (metrics.length > 0) {
                const metric = metrics[0];
                expect(metric.endpoint).toBeTruthy();
                expect(metric.method).toBeTruthy();
                expect(metric.avgResponseTime).toBeGreaterThanOrEqual(0);
                expect(metric.p95ResponseTime).toBeGreaterThanOrEqual(0);
                expect(metric.p99ResponseTime).toBeGreaterThanOrEqual(0);
                expect(metric.requestCount).toBeGreaterThan(0);
                expect(metric.errorRate).toBeGreaterThanOrEqual(0);
                expect(metric.throughput).toBeGreaterThanOrEqual(0);
            }
        });

        it('should filter by endpoint', async () => {
            await app.request('/test');

            const res = await app.request('/monitoring/metrics/performance?endpoint=/test');

            expect(res.status).toBe(200);

            const metrics = await res.json();
            expect(Array.isArray(metrics)).toBe(true);

            if (metrics.length > 0) {
                expect(metrics[0].endpoint).toBe('/test');
            }
        });
    });

    describe('GET /monitoring/metrics/errors', () => {
        it('should return error metrics', async () => {
            try {
                await app.request('/error');
            } catch (e) {
                // Ignore error for test
            }

            const res = await app.request('/monitoring/metrics/errors');

            expect(res.status).toBe(200);

            const metrics = await res.json();
            expect(Array.isArray(metrics)).toBe(true);

            if (metrics.length > 0) {
                const metric = metrics[0];
                expect(metric.requestId).toBeTruthy();
                expect(metric.endpoint).toBeTruthy();
                expect(metric.method).toBeTruthy();
                expect(metric.statusCode).toBeGreaterThanOrEqual(400);
                expect(metric.errorType).toBeTruthy();
                expect(metric.errorMessage).toBeTruthy();
                expect(metric.timestamp).toBeTruthy();
            }
        });
    });

    describe('GET /monitoring/health/metrics', () => {
        it('should return health metrics', async () => {
            const res = await app.request('/monitoring/health/metrics');

            expect(res.status).toBe(200);

            const health = await res.json();
            expect(health.status).toMatch(/healthy|degraded|unhealthy/);
            expect(health.uptime).toBeGreaterThanOrEqual(0);
            expect(health.responseTime).toBeGreaterThanOrEqual(0);
            expect(health.errorRate).toBeGreaterThanOrEqual(0);
            expect(health.throughput).toBeGreaterThanOrEqual(0);
            expect(health.activeConnections).toBeGreaterThanOrEqual(0);
            expect(health.memoryUsage).toBeDefined();
            expect(health.memoryUsage.used).toBeGreaterThan(0);
            expect(health.memoryUsage.total).toBeGreaterThan(0);
            expect(health.memoryUsage.percentage).toBeGreaterThanOrEqual(0);
            expect(health.cpuUsage).toBeGreaterThanOrEqual(0);
            expect(health.timestamp).toBeTruthy();
        });

        it('should not require authentication', async () => {
            // Create app without authentication
            const publicApp = new Hono();
            publicApp.route('/monitoring', monitoringRouter);

            const res = await publicApp.request('/monitoring/health/metrics');

            expect(res.status).toBe(200);
        });
    });

    describe('GET /monitoring/health/uptime', () => {
        it('should return uptime information', async () => {
            const res = await app.request('/monitoring/health/uptime');

            expect(res.status).toBe(200);

            const uptime = await res.json();
            expect(uptime.uptime).toBeGreaterThanOrEqual(0);
            expect(uptime.uptimeFormatted).toBeTruthy();
            expect(uptime.startTime).toBeTruthy();
            expect(uptime.currentTime).toBeTruthy();
            expect(uptime.availability).toBeDefined();
            expect(uptime.availability.last24Hours).toBeGreaterThanOrEqual(0);
            expect(uptime.availability.last7Days).toBeGreaterThanOrEqual(0);
            expect(uptime.availability.last30Days).toBeGreaterThanOrEqual(0);
        });
    });

    describe('GET /monitoring/alerts', () => {
        it('should return current alerts', async () => {
            const res = await app.request('/monitoring/alerts');

            expect(res.status).toBe(200);

            const alerts = await res.json();
            expect(Array.isArray(alerts)).toBe(true);

            // Alerts structure validation
            alerts.forEach((alert: any) => {
                expect(alert.type).toBeTruthy();
                expect(alert.message).toBeTruthy();
                expect(alert.severity).toMatch(/warning|critical/);
                expect(alert.timestamp).toBeTruthy();
            });
        });

        it('should require admin access', async () => {
            const nonAdminApp = new Hono();
            nonAdminApp.use('*', (c, next) => {
                c.set('user', {
                    id: 'user123',
                    organizationId: 'org123',
                    roles: ['user']
                });
                return next();
            });
            nonAdminApp.route('/monitoring', monitoringRouter);

            const res = await nonAdminApp.request('/monitoring/alerts');

            expect(res.status).toBe(401);
        });
    });

    describe('GET /monitoring/dashboard', () => {
        it('should return comprehensive dashboard data', async () => {
            // Generate test data
            await app.request('/test');
            await app.request('/test');

            const res = await app.request('/monitoring/dashboard');

            expect(res.status).toBe(200);

            const dashboard = await res.json();

            expect(dashboard.overview).toBeDefined();
            expect(dashboard.overview.totalRequests).toBeGreaterThan(0);
            expect(dashboard.overview.activeUsers).toBeGreaterThanOrEqual(0);
            expect(dashboard.overview.errorRate).toBeGreaterThanOrEqual(0);
            expect(dashboard.overview.avgResponseTime).toBeGreaterThanOrEqual(0);
            expect(dashboard.overview.uptime).toBeGreaterThanOrEqual(0);

            expect(dashboard.analytics).toBeDefined();
            expect(dashboard.alerts).toBeInstanceOf(Array);
            expect(dashboard.recentErrors).toBeInstanceOf(Array);
            expect(dashboard.topEndpoints).toBeInstanceOf(Array);
        });

        it('should include recent errors in dashboard', async () => {
            try {
                await app.request('/error');
            } catch (e) {
                // Ignore error for test
            }

            const res = await app.request('/monitoring/dashboard');

            expect(res.status).toBe(200);

            const dashboard = await res.json();

            if (dashboard.recentErrors.length > 0) {
                const error = dashboard.recentErrors[0];
                expect(error.requestId).toBeTruthy();
                expect(error.endpoint).toBeTruthy();
                expect(error.errorMessage).toBeTruthy();
                expect(error.timestamp).toBeTruthy();
            }
        });

        it('should include top endpoints with performance data', async () => {
            await app.request('/test');
            await app.request('/test');

            const res = await app.request('/monitoring/dashboard');

            expect(res.status).toBe(200);

            const dashboard = await res.json();

            if (dashboard.topEndpoints.length > 0) {
                const endpoint = dashboard.topEndpoints[0];
                expect(endpoint.endpoint).toBeTruthy();
                expect(endpoint.count).toBeGreaterThan(0);
                expect(endpoint.avgResponseTime).toBeGreaterThanOrEqual(0);
                expect(endpoint.errorRate).toBeGreaterThanOrEqual(0);
            }
        });

        it('should require admin access', async () => {
            const nonAdminApp = new Hono();
            nonAdminApp.use('*', (c, next) => {
                c.set('user', {
                    id: 'user123',
                    organizationId: 'org123',
                    roles: ['user']
                });
                return next();
            });
            nonAdminApp.route('/monitoring', monitoringRouter);

            const res = await nonAdminApp.request('/monitoring/dashboard');

            expect(res.status).toBe(401);
        });
    });

    describe('Authentication and Authorization', () => {
        it('should allow unauthenticated access to health endpoints', async () => {
            const publicApp = new Hono();
            publicApp.route('/monitoring', monitoringRouter);

            const healthRes = await publicApp.request('/monitoring/health/metrics');
            expect(healthRes.status).toBe(200);

            const uptimeRes = await publicApp.request('/monitoring/health/uptime');
            expect(uptimeRes.status).toBe(200);
        });

        it('should require admin access for sensitive endpoints', async () => {
            const userApp = new Hono();
            userApp.use('*', (c, next) => {
                c.set('user', {
                    id: 'user123',
                    organizationId: 'org123',
                    roles: ['user']
                });
                return next();
            });
            userApp.route('/monitoring', monitoringRouter);

            const endpoints = [
                '/monitoring/analytics',
                '/monitoring/metrics/usage',
                '/monitoring/metrics/performance',
                '/monitoring/metrics/errors',
                '/monitoring/alerts',
                '/monitoring/dashboard'
            ];

            for (const endpoint of endpoints) {
                const res = await userApp.request(endpoint);
                expect(res.status).toBe(401);
            }
        });

        it('should handle missing user context gracefully', async () => {
            const noUserApp = new Hono();
            noUserApp.route('/monitoring', monitoringRouter);

            const res = await noUserApp.request('/monitoring/analytics');
            expect(res.status).toBe(401);
        });
    });
});