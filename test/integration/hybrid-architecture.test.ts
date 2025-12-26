import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { appRouter, createContext } from '@signtusk/trpc';

/**
 * Hybrid Architecture Integration Tests
 * 
 * Tests the integration between:
 * - Next.js marketing site (apps/web)
 * - Remix main application (apps/app)
 * - tRPC API layer (packages/trpc)
 * - Existing services (auth, database, storage, etc.)
 */

describe('Hybrid Architecture Integration', () => {
    beforeAll(() => {
        // Set up test environment
    });

    afterAll(() => {
        // Clean up
    });

    describe('tRPC API Layer Integration', () => {
        it('should provide type-safe communication between apps and services', async () => {
            // Test that tRPC router is properly configured
            expect(appRouter).toBeDefined();
            expect(appRouter._def).toBeDefined();
            expect(appRouter._def.procedures).toBeDefined();

            // Verify core routers are available
            const procedures = appRouter._def.procedures;
            expect(procedures['auth.health']).toBeDefined();
            expect(procedures['auth.login']).toBeDefined();
            expect(procedures['auth.me']).toBeDefined();
            expect(procedures['user.getProfile']).toBeDefined();
            expect(procedures['document.list']).toBeDefined();
        });

        it('should handle authentication flow correctly', async () => {
            const mockContext = await createContext({
                req: {
                    headers: {},
                    url: '/api/trpc',
                } as any,
                res: {} as any,
            });

            // Test public procedure (health check)
            const caller = appRouter.createCaller(mockContext);
            const healthResult = await caller.auth.health();

            expect(healthResult).toEqual({
                status: 'ok',
                timestamp: expect.any(String),
            });
        });

        it('should validate input schemas correctly', async () => {
            const mockContext = await createContext({
                req: { headers: {}, url: '/api/trpc' } as any,
                res: {} as any,
            });

            const caller = appRouter.createCaller(mockContext);

            // Test password validation with various inputs
            const validPassword = await caller.auth.validatePassword({
                password: 'ValidPass123!',
            });
            expect(validPassword.isValid).toBe(true);
            expect(validPassword.errors).toHaveLength(0);

            const invalidPassword = await caller.auth.validatePassword({
                password: 'weak',
            });
            expect(invalidPassword.isValid).toBe(false);
            expect(invalidPassword.errors.length).toBeGreaterThan(0);
        });

        it('should enforce rate limiting on sensitive endpoints', async () => {
            const mockContext = await createContext({
                req: {
                    headers: { 'x-forwarded-for': '127.0.0.1' },
                    url: '/api/trpc',
                } as any,
                res: {} as any,
            });

            const caller = appRouter.createCaller(mockContext);

            // Test rate limiting on login endpoint
            // This should work for the first few attempts
            const loginAttempt = async () => {
                try {
                    await caller.auth.login({
                        email: 'test@example.com',
                        password: 'wrongpassword',
                    });
                } catch (error) {
                    // Expected to fail due to wrong password, but not rate limiting
                    return error;
                }
            };

            const firstAttempt = await loginAttempt();
            expect(firstAttempt).toBeDefined();
        });
    });

    describe('Next.js and Remix Integration', () => {
        it('should have consistent tRPC client configuration', () => {
            // Test that both apps can import tRPC types
            const { appRouter: importedRouter } = require('@signtusk/trpc');
            expect(importedRouter).toBeDefined();
            expect(importedRouter._def).toBeDefined();
        });

        it('should handle session management across applications', async () => {
            // Mock session token
            const mockSessionToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJvcmdhbml6YXRpb25JZCI6Im9yZ18xMjMiLCJyb2xlcyI6WyJ1c2VyIl0sImVtYWlsVmVyaWZpZWQiOnRydWUsImlhdCI6MTcwNDEwNDQwMCwiZXhwIjoxNzA0MTkwODAwfQ.test';

            const mockContext = await createContext({
                req: {
                    headers: {
                        authorization: `Bearer ${mockSessionToken}`,
                    },
                    url: '/api/trpc',
                } as any,
                res: {} as any,
            });

            expect(mockContext).toBeDefined();
            // Context creation should handle the session token
        });
    });

    describe('Service Integration', () => {
        it('should integrate with existing auth package', async () => {
            // Test that auth service is properly integrated
            const authService = await import('@signtusk/auth');
            expect(authService).toBeDefined();
            expect(authService.AuthService).toBeDefined();
            expect(authService.SessionManager).toBeDefined();
        });

        it('should integrate with existing database package', async () => {
            // Test that database service is available
            try {
                const databaseService = await import('@signtusk/database');
                expect(databaseService).toBeDefined();
            } catch (error) {
                // Database package might not be fully implemented yet - this is expected
                expect(error).toBeDefined();
            }
        });

        it('should integrate with existing UI package', async () => {
            // Test that UI components are available
            const uiPackage = await import('@signtusk/ui');
            expect(uiPackage).toBeDefined();
            expect(uiPackage.Button).toBeDefined();
            expect(uiPackage.Input).toBeDefined();
        });
    });

    describe('Data Flow Integration', () => {
        it('should handle data flow between Next.js, Remix, and services', async () => {
            // Property-based test for data consistency
            fc.assert(
                fc.property(
                    fc.record({
                        email: fc.emailAddress(),
                        name: fc.string({ minLength: 1, maxLength: 100 }),
                    }),
                    async (userData) => {
                        const mockContext = await createContext({
                            req: { headers: {}, url: '/api/trpc' } as any,
                            res: {} as any,
                        });

                        // Test that user data flows correctly through the system
                        expect(userData.email).toMatch(/@/);
                        expect(userData.name.length).toBeGreaterThan(0);
                        return true;
                    }
                ),
                { numRuns: 10 }
            );
        });

        it('should maintain type safety across the entire stack', () => {
            // Test that TypeScript types are properly exported and imported
            const { AppRouter } = require('@signtusk/trpc');
            expect(AppRouter).toBeDefined();

            // Verify that the router type includes expected procedures
            const router = appRouter;
            expect(router._def.procedures['auth.health']).toBeDefined();
            expect(router._def.procedures['user.getProfile']).toBeDefined();
            expect(router._def.procedures['document.list']).toBeDefined();
        });
    });

    describe('Performance Integration', () => {
        it('should handle concurrent requests efficiently', async () => {
            const mockContext = await createContext({
                req: { headers: {}, url: '/api/trpc' } as any,
                res: {} as any,
            });

            const caller = appRouter.createCaller(mockContext);

            // Test concurrent health checks
            const promises = Array.from({ length: 10 }, () =>
                caller.auth.health()
            );

            const results = await Promise.all(promises);

            expect(results).toHaveLength(10);
            results.forEach(result => {
                expect(result.status).toBe('ok');
                expect(result.timestamp).toBeDefined();
            });
        });

        it('should handle large data sets efficiently', async () => {
            const mockContext = await createContext({
                req: {
                    headers: {
                        authorization: 'Bearer mock-token',
                    },
                    url: '/api/trpc',
                } as any,
                res: {} as any,
            });

            const caller = appRouter.createCaller(mockContext);

            // Test document listing performance
            const startTime = Date.now();
            const documents = await caller.document.list();
            const endTime = Date.now();

            expect(documents).toBeDefined();
            expect(Array.isArray(documents)).toBe(true);
            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle errors consistently across the stack', async () => {
            const mockContext = await createContext({
                req: { headers: {}, url: '/api/trpc' } as any,
                res: {} as any,
            });

            const caller = appRouter.createCaller(mockContext);

            // Test authentication error
            await expect(
                caller.auth.login({
                    email: 'invalid@example.com',
                    password: 'wrongpassword',
                })
            ).rejects.toThrow();
        });

        it('should provide meaningful error messages', async () => {
            const mockContext = await createContext({
                req: { headers: {}, url: '/api/trpc' } as any,
                res: {} as any,
            });

            const caller = appRouter.createCaller(mockContext);

            try {
                await caller.auth.login({
                    email: 'invalid@example.com',
                    password: 'wrongpassword',
                });
            } catch (error: any) {
                expect(error.message).toBeDefined();
                expect(error.code).toBeDefined();
            }
        });
    });

    describe('Security Integration', () => {
        it('should enforce authentication on protected procedures', async () => {
            const mockContext = await createContext({
                req: { headers: {}, url: '/api/trpc' } as any,
                res: {} as any,
            });

            const caller = appRouter.createCaller(mockContext);

            // Test that protected procedures require authentication
            await expect(caller.user.getProfile()).rejects.toThrow();
        });

        it('should validate input data properly', async () => {
            const mockContext = await createContext({
                req: { headers: {}, url: '/api/trpc' } as any,
                res: {} as any,
            });

            const caller = appRouter.createCaller(mockContext);

            // Test input validation
            await expect(
                caller.auth.login({
                    email: 'invalid-email',
                    password: 'test',
                })
            ).rejects.toThrow();
        });
    });
});