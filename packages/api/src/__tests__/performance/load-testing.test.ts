import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestAPIServer } from '../test-server';
import type { Hono } from 'hono';
import jwt from 'jsonwebtoken';

/**
 * Load testing and performance validation for API endpoints
 * Tests API performance under various load conditions
 */

interface PerformanceMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
}

interface LoadTestConfig {
    concurrentUsers: number;
    requestsPerUser: number;
    rampUpTime: number; // seconds
    testDuration: number; // seconds
}

describe('API Load Testing and Performance Validation', () => {
    let app: Hono;
    let authToken: string;

    beforeAll(async () => {
        app = createTestAPIServer();

        // Generate test auth token
        authToken = jwt.sign(
            {
                userId: 'test_user_123',
                email: 'test@example.com',
                name: 'Test User',
                organizationId: 'test_org_123',
                roles: ['user'],
                emailVerified: true,
            },
            process.env.JWT_SECRET || 'default-jwt-secret',
            { expiresIn: '1h' }
        );
    });

    /**
     * Utility function to run load tests
     */
    async function runLoadTest(
        endpoint: string,
        method: string,
        config: LoadTestConfig,
        requestOptions: any = {}
    ): Promise<PerformanceMetrics> {
        const responseTimes: number[] = [];
        const results: { success: boolean; responseTime: number }[] = [];
        const startTime = Date.now();

        // Create concurrent users
        const userPromises = Array.from({ length: config.concurrentUsers }, async (_, userIndex) => {
            // Stagger user start times for ramp-up
            const delay = (config.rampUpTime * 1000 * userIndex) / config.concurrentUsers;
            await new Promise(resolve => setTimeout(resolve, delay));

            // Each user makes multiple requests
            const userRequests = Array.from({ length: config.requestsPerUser }, async () => {
                const requestStart = Date.now();

                try {
                    const response = await app.request(endpoint, {
                        method,
                        headers: {
                            'Authorization': `Bearer ${authToken}`,
                            'Content-Type': 'application/json',
                            ...requestOptions.headers
                        },
                        body: requestOptions.body ? JSON.stringify(requestOptions.body) : undefined
                    });

                    const responseTime = Date.now() - requestStart;
                    responseTimes.push(responseTime);

                    return {
                        success: response.status >= 200 && response.status < 400,
                        responseTime
                    };
                } catch (error) {
                    const responseTime = Date.now() - requestStart;
                    responseTimes.push(responseTime);

                    return {
                        success: false,
                        responseTime
                    };
                }
            });

            return Promise.all(userRequests);
        });

        // Wait for all users to complete
        const allResults = await Promise.all(userPromises);
        const flatResults = allResults.flat();
        results.push(...flatResults);

        const totalTime = Date.now() - startTime;
        const successfulRequests = results.filter(r => r.success).length;
        const failedRequests = results.length - successfulRequests;

        // Calculate percentiles
        const sortedTimes = responseTimes.sort((a, b) => a - b);
        const p95Index = Math.floor(sortedTimes.length * 0.95);
        const p99Index = Math.floor(sortedTimes.length * 0.99);

        return {
            totalRequests: results.length,
            successfulRequests,
            failedRequests,
            averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
            minResponseTime: Math.min(...responseTimes),
            maxResponseTime: Math.max(...responseTimes),
            requestsPerSecond: (results.length / totalTime) * 1000,
            p95ResponseTime: sortedTimes[p95Index] || 0,
            p99ResponseTime: sortedTimes[p99Index] || 0
        };
    }

    describe('Authentication Endpoint Performance', () => {
        it('should handle moderate load on login endpoint', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 10,
                requestsPerUser: 5,
                rampUpTime: 2,
                testDuration: 10
            };

            const metrics = await runLoadTest(
                '/api/v1/auth/login',
                'POST',
                config,
                {
                    body: {
                        email: 'test@example.com',
                        password: 'password'
                    }
                }
            );

            // Performance assertions
            expect(metrics.averageResponseTime).toBeLessThan(500); // < 500ms average
            expect(metrics.p95ResponseTime).toBeLessThan(1000); // < 1s for 95th percentile
            expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.95); // > 95% success rate
            expect(metrics.requestsPerSecond).toBeGreaterThan(10); // > 10 RPS

            console.log('Login endpoint performance:', metrics);
        }, 30000); // 30 second timeout

        it('should handle high load on session validation', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 20,
                requestsPerUser: 10,
                rampUpTime: 3,
                testDuration: 15
            };

            const metrics = await runLoadTest(
                '/api/v1/auth/session',
                'GET',
                config
            );

            // Performance assertions for read-heavy endpoint
            expect(metrics.averageResponseTime).toBeLessThan(200); // < 200ms average
            expect(metrics.p95ResponseTime).toBeLessThan(500); // < 500ms for 95th percentile
            expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.98); // > 98% success rate
            expect(metrics.requestsPerSecond).toBeGreaterThan(50); // > 50 RPS

            console.log('Session validation performance:', metrics);
        }, 45000);
    });

    describe('Document Endpoint Performance', () => {
        it('should handle moderate load on document listing', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 15,
                requestsPerUser: 8,
                rampUpTime: 2,
                testDuration: 12
            };

            const metrics = await runLoadTest(
                '/api/v1/documents',
                'GET',
                config
            );

            // Performance assertions
            expect(metrics.averageResponseTime).toBeLessThan(300); // < 300ms average
            expect(metrics.p95ResponseTime).toBeLessThan(800); // < 800ms for 95th percentile
            expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.95); // > 95% success rate
            expect(metrics.requestsPerSecond).toBeGreaterThan(20); // > 20 RPS

            console.log('Document listing performance:', metrics);
        }, 30000);

        it('should handle document creation under load', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 8,
                requestsPerUser: 3,
                rampUpTime: 2,
                testDuration: 10
            };

            const metrics = await runLoadTest(
                '/api/v1/documents',
                'POST',
                config,
                {
                    body: {
                        name: 'Load Test Document',
                        description: 'Document created during load testing'
                    }
                }
            );

            // Performance assertions for write operations
            expect(metrics.averageResponseTime).toBeLessThan(800); // < 800ms average
            expect(metrics.p95ResponseTime).toBeLessThan(2000); // < 2s for 95th percentile
            expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.90); // > 90% success rate
            expect(metrics.requestsPerSecond).toBeGreaterThan(5); // > 5 RPS

            console.log('Document creation performance:', metrics);
        }, 30000);
    });

    describe('Signing Endpoint Performance', () => {
        it('should handle signing request creation under load', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 12,
                requestsPerUser: 4,
                rampUpTime: 3,
                testDuration: 15
            };

            const metrics = await runLoadTest(
                '/api/v1/signing/requests',
                'POST',
                config,
                {
                    body: {
                        documentId: 'doc_123',
                        title: 'Load Test Signing Request',
                        recipients: [
                            {
                                email: 'signer@example.com',
                                name: 'Test Signer',
                                role: 'signer',
                                order: 1
                            }
                        ]
                    }
                }
            );

            // Performance assertions
            expect(metrics.averageResponseTime).toBeLessThan(1000); // < 1s average
            expect(metrics.p95ResponseTime).toBeLessThan(2500); // < 2.5s for 95th percentile
            expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.85); // > 85% success rate
            expect(metrics.requestsPerSecond).toBeGreaterThan(8); // > 8 RPS

            console.log('Signing request creation performance:', metrics);
        }, 45000);

        it('should handle status checks under high load', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 25,
                requestsPerUser: 12,
                rampUpTime: 2,
                testDuration: 10
            };

            const metrics = await runLoadTest(
                '/api/v1/signing/requests/req_123/status',
                'GET',
                config
            );

            // Performance assertions for read-heavy operations
            expect(metrics.averageResponseTime).toBeLessThan(150); // < 150ms average
            expect(metrics.p95ResponseTime).toBeLessThan(400); // < 400ms for 95th percentile
            expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.95); // > 95% success rate
            expect(metrics.requestsPerSecond).toBeGreaterThan(60); // > 60 RPS

            console.log('Status check performance:', metrics);
        }, 30000);
    });

    describe('Mixed Workload Performance', () => {
        it('should handle mixed read/write operations', async () => {
            const readConfig: LoadTestConfig = {
                concurrentUsers: 20,
                requestsPerUser: 15,
                rampUpTime: 2,
                testDuration: 20
            };

            const writeConfig: LoadTestConfig = {
                concurrentUsers: 5,
                requestsPerUser: 8,
                rampUpTime: 1,
                testDuration: 20
            };

            // Run read and write operations concurrently
            const [readMetrics, writeMetrics] = await Promise.all([
                runLoadTest('/api/v1/documents', 'GET', readConfig),
                runLoadTest('/api/v1/documents', 'POST', writeConfig, {
                    body: {
                        name: 'Mixed Workload Document',
                        description: 'Document created during mixed workload test'
                    }
                })
            ]);

            // Read operations should maintain good performance
            expect(readMetrics.averageResponseTime).toBeLessThan(400);
            expect(readMetrics.successfulRequests / readMetrics.totalRequests).toBeGreaterThan(0.95);

            // Write operations should still perform acceptably
            expect(writeMetrics.averageResponseTime).toBeLessThan(1200);
            expect(writeMetrics.successfulRequests / writeMetrics.totalRequests).toBeGreaterThan(0.85);

            console.log('Mixed workload - Read performance:', readMetrics);
            console.log('Mixed workload - Write performance:', writeMetrics);
        }, 60000);
    });

    describe('Stress Testing', () => {
        it('should handle peak load gracefully', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 50,
                requestsPerUser: 20,
                rampUpTime: 5,
                testDuration: 30
            };

            const metrics = await runLoadTest(
                '/api/v1/auth/session',
                'GET',
                config
            );

            // Under stress, we expect some degradation but system should remain stable
            expect(metrics.averageResponseTime).toBeLessThan(2000); // < 2s average under stress
            expect(metrics.successfulRequests / metrics.totalRequests).toBeGreaterThan(0.80); // > 80% success rate
            expect(metrics.requestsPerSecond).toBeGreaterThan(20); // > 20 RPS under stress

            // No single request should take more than 10 seconds
            expect(metrics.maxResponseTime).toBeLessThan(10000);

            console.log('Stress test performance:', metrics);
        }, 120000); // 2 minute timeout
    });

    describe('Rate Limiting Performance', () => {
        it('should enforce rate limits without degrading performance for valid requests', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 30,
                requestsPerUser: 10,
                rampUpTime: 1,
                testDuration: 5
            };

            const metrics = await runLoadTest(
                '/api/v1/auth/login',
                'POST',
                config,
                {
                    body: {
                        email: 'test@example.com',
                        password: 'wrongpassword' // This will trigger rate limiting
                    }
                }
            );

            // Some requests should be rate limited (429 status)
            expect(metrics.failedRequests).toBeGreaterThan(0);

            // But the system should still respond quickly
            expect(metrics.averageResponseTime).toBeLessThan(1000);
            expect(metrics.p95ResponseTime).toBeLessThan(2000);

            console.log('Rate limiting performance:', metrics);
        }, 30000);
    });

    describe('Memory and Resource Usage', () => {
        it('should maintain stable memory usage under load', async () => {
            const initialMemory = process.memoryUsage();

            const config: LoadTestConfig = {
                concurrentUsers: 20,
                requestsPerUser: 25,
                rampUpTime: 3,
                testDuration: 20
            };

            await runLoadTest('/api/v1/documents', 'GET', config);

            const finalMemory = process.memoryUsage();
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

            // Memory increase should be reasonable (less than 100MB)
            expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);

            console.log('Memory usage - Initial:', initialMemory);
            console.log('Memory usage - Final:', finalMemory);
            console.log('Memory increase:', memoryIncrease / 1024 / 1024, 'MB');
        }, 60000);
    });

    describe('Error Rate Under Load', () => {
        it('should maintain low error rates under normal load', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 15,
                requestsPerUser: 10,
                rampUpTime: 2,
                testDuration: 15
            };

            const metrics = await runLoadTest('/api/v1/auth/session', 'GET', config);

            // Error rate should be very low under normal load
            const errorRate = metrics.failedRequests / metrics.totalRequests;
            expect(errorRate).toBeLessThan(0.05); // < 5% error rate

            console.log('Error rate under normal load:', errorRate * 100, '%');
        }, 45000);

        it('should handle database connection limits gracefully', async () => {
            const config: LoadTestConfig = {
                concurrentUsers: 100, // High concurrency to test connection limits
                requestsPerUser: 5,
                rampUpTime: 2,
                testDuration: 10
            };

            const metrics = await runLoadTest('/api/v1/documents', 'GET', config);

            // Even with high concurrency, system should handle gracefully
            const errorRate = metrics.failedRequests / metrics.totalRequests;
            expect(errorRate).toBeLessThan(0.20); // < 20% error rate even under extreme load

            // Response times may be higher but should not timeout
            expect(metrics.maxResponseTime).toBeLessThan(30000); // < 30s max response time

            console.log('High concurrency performance:', metrics);
        }, 60000);
    });
});