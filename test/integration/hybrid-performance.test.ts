import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { appRouter, createContext } from '@signtusk/trpc';

/**
 * Hybrid Architecture Performance Tests
 * 
 * Tests performance characteristics of the hybrid architecture:
 * - API response times
 * - Concurrent request handling
 * - Memory usage patterns
 * - Data processing efficiency
 */

describe('Hybrid Architecture Performance', () => {
    let mockContext: any;

    beforeAll(async () => {
        mockContext = await createContext({
            req: { headers: {}, url: '/api/trpc' } as any,
            res: {} as any,
        });
    });

    describe('API Response Time Performance', () => {
        it('should respond to health checks within 50ms', async () => {
            const caller = appRouter.createCaller(mockContext);

            const startTime = performance.now();
            await caller.auth.health();
            const endTime = performance.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(50);
        });

        it('should handle authentication within 200ms', async () => {
            const caller = appRouter.createCaller(mockContext);

            const startTime = performance.now();
            try {
                await caller.auth.login({
                    email: 'test@example.com',
                    password: 'password',
                });
            } catch (error) {
                // Expected for test credentials
            }
            const endTime = performance.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(200);
        });

        it('should validate passwords within 10ms', async () => {
            const caller = appRouter.createCaller(mockContext);

            const startTime = performance.now();
            await caller.auth.validatePassword({
                password: 'TestPassword123!',
            });
            const endTime = performance.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(10);
        });
    });

    describe('Concurrent Request Handling', () => {
        it('should handle 100 concurrent health checks efficiently', async () => {
            const caller = appRouter.createCaller(mockContext);

            const startTime = performance.now();
            const promises = Array.from({ length: 100 }, () =>
                caller.auth.health()
            );

            const results = await Promise.all(promises);
            const endTime = performance.now();

            const totalTime = endTime - startTime;
            const averageTime = totalTime / 100;

            expect(results).toHaveLength(100);
            expect(averageTime).toBeLessThan(5); // Average should be under 5ms per request
            expect(totalTime).toBeLessThan(1000); // Total should be under 1 second
        });

        it('should handle mixed concurrent operations', async () => {
            const caller = appRouter.createCaller(mockContext);

            const operations = [
                () => caller.auth.health(),
                () => caller.auth.validatePassword({ password: 'Test123!' }),
                () => caller.document.list().catch(() => null), // May fail due to auth
                () => caller.auth.health(),
                () => caller.auth.validatePassword({ password: 'Another123!' }),
            ];

            const startTime = performance.now();
            const promises = Array.from({ length: 20 }, (_, i) =>
                operations[i % operations.length]()
            );

            const results = await Promise.all(promises);
            const endTime = performance.now();

            const totalTime = endTime - startTime;

            expect(results).toHaveLength(20);
            expect(totalTime).toBeLessThan(500); // Should complete within 500ms
        });
    });

    describe('Memory Usage Performance', () => {
        it('should not leak memory during repeated operations', async () => {
            const caller = appRouter.createCaller(mockContext);

            // Get initial memory usage
            const initialMemory = process.memoryUsage();

            // Perform many operations
            for (let i = 0; i < 1000; i++) {
                await caller.auth.health();
                await caller.auth.validatePassword({ password: `Test${i}!` });
            }

            // Force garbage collection if available
            if (global.gc) {
                global.gc();
            }

            const finalMemory = process.memoryUsage();

            // Memory should not increase significantly (allow for 10MB increase)
            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // 10MB
        });

        it('should handle large data sets efficiently', async () => {
            const caller = appRouter.createCaller(mockContext);

            // Test with large password validation requests
            const largePasswords = Array.from({ length: 100 }, (_, i) =>
                `VeryLongPasswordWithLotsOfCharacters${i}!@#$%^&*()`
            );

            const startTime = performance.now();
            const startMemory = process.memoryUsage();

            const promises = largePasswords.map(password =>
                caller.auth.validatePassword({ password })
            );

            const results = await Promise.all(promises);

            const endTime = performance.now();
            const endMemory = process.memoryUsage();

            const totalTime = endTime - startTime;
            const memoryUsed = endMemory.heapUsed - startMemory.heapUsed;

            expect(results).toHaveLength(100);
            expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
            expect(memoryUsed).toBeLessThan(50 * 1024 * 1024); // Should use less than 50MB
        });
    });

    describe('Data Processing Efficiency', () => {
        it('should process input validation efficiently', async () => {
            const caller = appRouter.createCaller(mockContext);

            // Property-based test for validation performance
            await fc.assert(
                fc.asyncProperty(
                    fc.array(fc.string({ minLength: 8, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
                    async (passwords) => {
                        const startTime = performance.now();

                        const promises = passwords.map(password =>
                            caller.auth.validatePassword({ password })
                        );

                        await Promise.all(promises);

                        const endTime = performance.now();
                        const totalTime = endTime - startTime;
                        const averageTime = totalTime / passwords.length;

                        // Each validation should take less than 5ms on average
                        expect(averageTime).toBeLessThan(5);
                        return true;
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should handle error cases efficiently', async () => {
            const caller = appRouter.createCaller(mockContext);

            const invalidInputs = [
                { email: 'invalid', password: 'test' },
                { email: '', password: '' },
                { email: 'test@', password: '123' },
                { email: 'very-long-email-address-that-might-cause-performance-issues@example.com', password: 'short' },
            ];

            const startTime = performance.now();

            const promises = invalidInputs.map(async (input) => {
                try {
                    await caller.auth.login(input);
                } catch (error) {
                    return error;
                }
            });

            const results = await Promise.all(promises);
            const endTime = performance.now();

            const totalTime = endTime - startTime;
            const averageTime = totalTime / invalidInputs.length;

            expect(results).toHaveLength(invalidInputs.length);
            expect(averageTime).toBeLessThan(10); // Error handling should be fast
        });
    });

    describe('Scalability Performance', () => {
        it('should maintain performance under increasing load', async () => {
            const caller = appRouter.createCaller(mockContext);

            const loadLevels = [10, 50, 100, 200];
            const results: Array<{ load: number; averageTime: number; totalTime: number }> = [];

            for (const load of loadLevels) {
                const startTime = performance.now();

                const promises = Array.from({ length: load }, () =>
                    caller.auth.health()
                );

                await Promise.all(promises);

                const endTime = performance.now();
                const totalTime = endTime - startTime;
                const averageTime = totalTime / load;

                results.push({ load, averageTime, totalTime });
            }

            // Performance should not degrade significantly with increased load
            const firstResult = results[0];
            const lastResult = results[results.length - 1];

            // Average time per request should not increase by more than 5x
            expect(lastResult.averageTime).toBeLessThan(firstResult.averageTime * 5);

            // All loads should complete within reasonable time
            results.forEach(result => {
                expect(result.totalTime).toBeLessThan(5000); // 5 seconds max
            });
        });

        it('should handle burst traffic patterns', async () => {
            const caller = appRouter.createCaller(mockContext);

            // Simulate burst traffic: quick succession of requests
            const burstSizes = [20, 50, 20, 10];
            const burstResults: number[] = [];

            for (const burstSize of burstSizes) {
                const startTime = performance.now();

                const promises = Array.from({ length: burstSize }, () =>
                    caller.auth.health()
                );

                await Promise.all(promises);

                const endTime = performance.now();
                burstResults.push(endTime - startTime);

                // Small delay between bursts
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            // Each burst should complete within reasonable time
            burstResults.forEach(burstTime => {
                expect(burstTime).toBeLessThan(1000); // 1 second per burst
            });
        });
    });

    describe('Resource Utilization', () => {
        it('should efficiently utilize CPU resources', async () => {
            const caller = appRouter.createCaller(mockContext);

            // CPU-intensive operation simulation
            const startTime = process.hrtime.bigint();

            // Perform CPU-bound validation operations
            const promises = Array.from({ length: 100 }, (_, i) =>
                caller.auth.validatePassword({
                    password: `ComplexPassword${i}WithManyCharacters!@#$%^&*()`
                })
            );

            await Promise.all(promises);

            const endTime = process.hrtime.bigint();
            const duration = Number(endTime - startTime) / 1_000_000; // Convert to milliseconds

            // Should complete within reasonable time for CPU-bound operations
            expect(duration).toBeLessThan(1000); // 1 second
        });

        it('should handle I/O operations efficiently', async () => {
            const caller = appRouter.createCaller(mockContext);

            // Simulate I/O-bound operations (document listing)
            const startTime = performance.now();

            const promises = Array.from({ length: 50 }, () =>
                caller.document.list().catch(() => []) // May fail due to auth, but that's OK
            );

            await Promise.all(promises);

            const endTime = performance.now();
            const totalTime = endTime - startTime;

            // I/O operations should be efficient
            expect(totalTime).toBeLessThan(2000); // 2 seconds for 50 operations
        });
    });
});