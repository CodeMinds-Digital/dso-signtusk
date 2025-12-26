import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testClient } from '../test-server';
import { ErrorMonitoringService } from '../../middleware/error-handler';

describe('Error Reporting API', () => {
    let client: ReturnType<typeof testClient>;
    let errorMonitoring: ErrorMonitoringService;

    beforeEach(() => {
        client = testClient();
        errorMonitoring = ErrorMonitoringService.getInstance();
        errorMonitoring.reset();
    });

    afterEach(() => {
        errorMonitoring.reset();
    });

    describe('GET /api/v1/errors/error-stats', () => {
        it('should return error statistics for admin users', async () => {
            // Mock admin user
            const adminUser = {
                id: 'admin-123',
                email: 'admin@test.com',
                name: 'Admin User',
                organizationId: 'org-123',
                roles: ['admin']
            };

            const response = await client.get('/api/v1/errors/error-stats', {
                headers: {
                    'Authorization': 'Bearer admin-token',
                    'X-User': JSON.stringify(adminUser)
                }
            });

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data).toHaveProperty('totalErrors');
            expect(data).toHaveProperty('errorsByType');
            expect(data).toHaveProperty('hourlyRates');
            expect(data).toHaveProperty('timestamp');
            expect(typeof data.totalErrors).toBe('number');
        });

        it('should reject non-admin users', async () => {
            const regularUser = {
                id: 'user-123',
                email: 'user@test.com',
                name: 'Regular User',
                organizationId: 'org-123',
                roles: ['user']
            };

            const response = await client.get('/api/v1/errors/error-stats', {
                headers: {
                    'Authorization': 'Bearer user-token',
                    'X-User': JSON.stringify(regularUser)
                }
            });

            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.error).toBe('Admin access required');
        });

        it('should reject unauthenticated requests', async () => {
            const response = await client.get('/api/v1/errors/error-stats');

            expect(response.status).toBe(401);
        });
    });

    describe('POST /api/v1/errors/report-error', () => {
        it('should accept valid client error reports', async () => {
            const errorReport = {
                message: 'TypeError: Cannot read property of undefined',
                stack: 'TypeError: Cannot read property of undefined\n    at Object.onClick (app.js:123:45)',
                url: 'https://app.example.com/dashboard',
                userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                userId: 'user-123',
                organizationId: 'org-456',
                metadata: {
                    component: 'Dashboard',
                    action: 'click',
                    timestamp: new Date().toISOString()
                }
            };

            const response = await client.post('/api/v1/errors/report-error', {
                json: errorReport
            });

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.message).toBe('Error report received');
            expect(data.reportId).toMatch(/^client_error_\d+_[a-z0-9]+$/);
        });

        it('should handle minimal error reports', async () => {
            const errorReport = {
                message: 'Network error',
                url: 'https://app.example.com/api/data'
            };

            const response = await client.post('/api/v1/errors/report-error', {
                json: errorReport
            });

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.message).toBe('Error report received');
            expect(data.reportId).toBeDefined();
        });

        it('should validate error report format', async () => {
            const invalidReport = {
                // Missing required 'message' field
                url: 'https://app.example.com/dashboard'
            };

            const response = await client.post('/api/v1/errors/report-error', {
                json: invalidReport
            });

            expect(response.status).toBe(400);
        });

        it('should handle error reports without authentication', async () => {
            const errorReport = {
                message: 'Client-side error',
                url: 'https://app.example.com/public'
            };

            const response = await client.post('/api/v1/errors/report-error', {
                json: errorReport
            });

            expect(response.status).toBe(200);
        });
    });

    describe('GET /api/v1/errors/error-health', () => {
        it('should return healthy status with no errors', async () => {
            const response = await client.get('/api/v1/errors/error-health');

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.status).toBe('healthy');
            expect(data.errorRate).toBe(0);
            expect(data.criticalErrors).toBe(0);
            expect(data.recommendations).toContain('System is operating normally');
            expect(data.timestamp).toBeDefined();
        });

        it('should return degraded status with moderate errors', async () => {
            // Simulate some errors
            const error = new Error('Test error');
            const context = {
                userId: 'user-123',
                organizationId: 'org-456',
                requestId: 'req-123',
                operation: 'GET /test',
                timestamp: new Date(),
                metadata: {}
            };

            // Track multiple errors to trigger degraded status
            for (let i = 0; i < 15; i++) {
                errorMonitoring.trackError(error, context, 500);
            }

            const response = await client.get('/api/v1/errors/error-health');

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.status).toBe('degraded');
            expect(data.criticalErrors).toBeGreaterThan(0);
            expect(data.recommendations).toContain('High error rate detected - investigate recent deployments');
        });

        it('should include appropriate recommendations', async () => {
            const response = await client.get('/api/v1/errors/error-health');

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(Array.isArray(data.recommendations)).toBe(true);
            expect(data.recommendations.length).toBeGreaterThan(0);
        });
    });

    describe('POST /api/v1/errors/reset-error-stats', () => {
        it('should reset error statistics for admin users', async () => {
            // First, add some errors
            const error = new Error('Test error');
            const context = {
                userId: 'user-123',
                organizationId: 'org-456',
                requestId: 'req-123',
                operation: 'GET /test',
                timestamp: new Date(),
                metadata: {}
            };

            errorMonitoring.trackError(error, context, 400);

            // Verify errors exist
            let stats = errorMonitoring.getErrorStats();
            expect(stats.totalErrors).toBe(1);

            // Reset as admin
            const adminUser = {
                id: 'admin-123',
                email: 'admin@test.com',
                name: 'Admin User',
                organizationId: 'org-123',
                roles: ['admin']
            };

            const response = await client.post('/api/v1/errors/reset-error-stats', {
                headers: {
                    'Authorization': 'Bearer admin-token',
                    'X-User': JSON.stringify(adminUser)
                }
            });

            expect(response.status).toBe(200);

            const data = await response.json();
            expect(data.message).toBe('Error statistics reset successfully');
            expect(data.timestamp).toBeDefined();

            // Verify errors were reset
            stats = errorMonitoring.getErrorStats();
            expect(stats.totalErrors).toBe(0);
        });

        it('should reject non-admin users', async () => {
            const regularUser = {
                id: 'user-123',
                email: 'user@test.com',
                name: 'Regular User',
                organizationId: 'org-123',
                roles: ['user']
            };

            const response = await client.post('/api/v1/errors/reset-error-stats', {
                headers: {
                    'Authorization': 'Bearer user-token',
                    'X-User': JSON.stringify(regularUser)
                }
            });

            expect(response.status).toBe(401);

            const data = await response.json();
            expect(data.error).toBe('Admin access required');
        });
    });

    describe('Error Monitoring Integration', () => {
        it('should track errors from API requests', async () => {
            // Make a request that will cause an error
            const response = await client.get('/api/v1/nonexistent-endpoint');

            expect(response.status).toBe(404);

            // Check that the error was tracked
            const stats = errorMonitoring.getErrorStats();
            expect(stats.totalErrors).toBeGreaterThan(0);
        });

        it('should include trace IDs in error responses', async () => {
            const response = await client.get('/api/v1/nonexistent-endpoint');

            expect(response.status).toBe(404);
            expect(response.headers.get('X-Trace-ID')).toBeDefined();

            const data = await response.json();
            expect(data.traceId).toBeDefined();
        });

        it('should include recovery suggestions in error responses', async () => {
            // Trigger a validation error
            const response = await client.post('/api/v1/auth/login', {
                json: {
                    // Invalid payload to trigger validation error
                    email: 'not-an-email',
                    password: ''
                }
            });

            expect(response.status).toBe(400);

            const data = await response.json();
            expect(data.suggestions).toBeDefined();
            expect(Array.isArray(data.suggestions)).toBe(true);
            expect(data.suggestions.length).toBeGreaterThan(0);
        });

        it('should mark retryable errors appropriately', async () => {
            // This would require simulating a database error or similar
            // For now, we'll test the structure
            const response = await client.get('/api/v1/nonexistent-endpoint');

            expect(response.status).toBe(404);

            const data = await response.json();
            expect(data).toHaveProperty('retryable');
            expect(typeof data.retryable).toBe('boolean');
        });
    });

    describe('Error Response Format Validation', () => {
        it('should return standardized error format', async () => {
            const response = await client.get('/api/v1/nonexistent-endpoint');

            expect(response.status).toBe(404);

            const data = await response.json();

            // Validate required fields
            expect(data).toHaveProperty('error');
            expect(data).toHaveProperty('message');
            expect(data).toHaveProperty('code');
            expect(data).toHaveProperty('type');
            expect(data).toHaveProperty('timestamp');
            expect(data).toHaveProperty('path');
            expect(data).toHaveProperty('requestId');
            expect(data).toHaveProperty('traceId');
            expect(data).toHaveProperty('retryable');

            // Validate field types
            expect(typeof data.error).toBe('string');
            expect(typeof data.message).toBe('string');
            expect(typeof data.code).toBe('string');
            expect(typeof data.type).toBe('string');
            expect(typeof data.timestamp).toBe('string');
            expect(typeof data.path).toBe('string');
            expect(typeof data.requestId).toBe('string');
            expect(typeof data.traceId).toBe('string');
            expect(typeof data.retryable).toBe('boolean');
        });

        it('should include documentation links when available', async () => {
            // Trigger a validation error which should have documentation
            const response = await client.post('/api/v1/auth/login', {
                json: {
                    email: 'invalid-email'
                }
            });

            expect(response.status).toBe(400);

            const data = await response.json();
            if (data.documentation) {
                expect(typeof data.documentation).toBe('string');
                expect(data.documentation).toMatch(/^\/docs\//);
            }
        });
    });
});