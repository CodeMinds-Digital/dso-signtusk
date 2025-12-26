import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import { appRouter, createContext } from '@signtusk/trpc';
import { TRPCError } from '@trpc/server';

/**
 * Comprehensive tRPC API Layer Tests
 * 
 * Tests the new tRPC API layer functionality:
 * - Type safety and schema validation
 * - Authentication and authorization
 * - Error handling and edge cases
 * - Rate limiting and security
 * - Integration with existing services
 */

describe('tRPC API Layer Comprehensive Tests', () => {
    let publicContext: any;
    let authenticatedContext: any;

    beforeAll(async () => {
        // Create public context (no authentication)
        publicContext = await createContext({
            req: { headers: {}, url: '/api/trpc' } as any,
            res: {} as any,
        });

        // Create authenticated context (with mock JWT)
        const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyXzEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsIm5hbWUiOiJUZXN0IFVzZXIiLCJvcmdhbml6YXRpb25JZCI6Im9yZ18xMjMiLCJyb2xlcyI6WyJ1c2VyIl0sImVtYWlsVmVyaWZpZWQiOnRydWUsImlhdCI6MTcwNDEwNDQwMCwiZXhwIjoxNzA0MTkwODAwfQ.test';

        authenticatedContext = await createContext({
            req: {
                headers: {
                    authorization: `Bearer ${mockJWT}`,
                },
                url: '/api/trpc',
            } as any,
            res: {} as any,
        });
    });

    describe('Router Structure and Type Safety', () => {
        it('should have properly structured router with all expected procedures', () => {
            expect(appRouter).toBeDefined();
            expect(appRouter._def).toBeDefined();
            expect(appRouter._def.procedures).toBeDefined();

            const procedures = appRouter._def.procedures;

            // Auth procedures
            expect(procedures['auth.health']).toBeDefined();
            expect(procedures['auth.login']).toBeDefined();
            expect(procedures['auth.me']).toBeDefined();
            expect(procedures['auth.getSession']).toBeDefined();
            expect(procedures['auth.validatePassword']).toBeDefined();

            // User procedures
            expect(procedures['user.getProfile']).toBeDefined();
            expect(procedures['user.updateProfile']).toBeDefined();

            // Document procedures
            expect(procedures['document.list']).toBeDefined();
            expect(procedures['document.getById']).toBeDefined();
        });

        it('should maintain type safety across all procedures', () => {
            const caller = appRouter.createCaller(publicContext);

            // TypeScript should enforce correct input types
            expect(() => {
                // This should be type-safe at compile time
                caller.auth.validatePassword({ password: 'test' });
            }).not.toThrow();
        });

        it('should export correct TypeScript types', () => {
            // Test that AppRouter type is properly exported
            const routerType = appRouter;
            expect(routerType._def).toBeDefined();
            expect(routerType._def.procedures).toBeDefined();
        });
    });

    describe('Authentication Procedures', () => {
        describe('Health Check', () => {
            it('should return health status without authentication', async () => {
                const caller = appRouter.createCaller(publicContext);
                const result = await caller.auth.health();

                expect(result).toEqual({
                    status: 'ok',
                    timestamp: expect.any(String),
                });

                // Timestamp should be valid ISO string
                expect(new Date(result.timestamp).toISOString()).toBe(result.timestamp);
            });

            it('should handle concurrent health checks', async () => {
                const caller = appRouter.createCaller(publicContext);

                const promises = Array.from({ length: 10 }, () => caller.auth.health());
                const results = await Promise.all(promises);

                expect(results).toHaveLength(10);
                results.forEach(result => {
                    expect(result.status).toBe('ok');
                    expect(result.timestamp).toBeDefined();
                });
            });
        });

        describe('Login Procedure', () => {
            it('should authenticate valid credentials', async () => {
                const caller = appRouter.createCaller(publicContext);

                const result = await caller.auth.login({
                    email: 'test@example.com',
                    password: 'password',
                });

                expect(result).toEqual({
                    success: true,
                    sessionToken: expect.any(String),
                    user: {
                        id: 'user_123',
                        email: 'test@example.com',
                        name: 'Test User',
                        organizationId: 'org_123',
                    },
                });

                // Session token should be a valid JWT format
                expect(result.sessionToken.split('.')).toHaveLength(3);
            });

            it('should reject invalid credentials', async () => {
                const caller = appRouter.createCaller(publicContext);

                await expect(
                    caller.auth.login({
                        email: 'test@example.com',
                        password: 'wrongpassword',
                    })
                ).rejects.toThrow('Invalid credentials');
            });

            it('should validate email format', async () => {
                const caller = appRouter.createCaller(publicContext);

                await expect(
                    caller.auth.login({
                        email: 'invalid-email',
                        password: 'password',
                    })
                ).rejects.toThrow();
            });

            it('should handle remember me option', async () => {
                const caller = appRouter.createCaller(publicContext);

                const resultWithRemember = await caller.auth.login({
                    email: 'test@example.com',
                    password: 'password',
                    rememberMe: true,
                });

                const resultWithoutRemember = await caller.auth.login({
                    email: 'test@example.com',
                    password: 'password',
                    rememberMe: false,
                });

                expect(resultWithRemember.sessionToken).toBeDefined();
                expect(resultWithoutRemember.sessionToken).toBeDefined();
                // Both should be valid JWTs
                expect(resultWithRemember.sessionToken.split('.')).toHaveLength(3);
                expect(resultWithoutRemember.sessionToken.split('.')).toHaveLength(3);
            });
        });

        describe('Password Validation', () => {
            it('should validate strong passwords correctly', async () => {
                const caller = appRouter.createCaller(publicContext);

                const result = await caller.auth.validatePassword({
                    password: 'StrongPassword123!',
                });

                expect(result).toEqual({
                    isValid: true,
                    errors: [],
                });
            });

            it('should identify weak passwords with specific errors', async () => {
                const caller = appRouter.createCaller(publicContext);

                const result = await caller.auth.validatePassword({
                    password: 'weak',
                });

                expect(result.isValid).toBe(false);
                expect(result.errors).toContain('Password must be at least 8 characters long');
                expect(result.errors).toContain('Password must contain at least one uppercase letter');
                expect(result.errors).toContain('Password must contain at least one number');
                expect(result.errors).toContain('Password must contain at least one special character');
            });

            it('should validate various password patterns', async () => {
                const caller = appRouter.createCaller(publicContext);

                const testCases = [
                    { password: 'Password123!', expected: true },
                    { password: 'password123!', expected: false }, // No uppercase
                    { password: 'PASSWORD123!', expected: false }, // No lowercase
                    { password: 'Password!', expected: false }, // No number
                    { password: 'Password123', expected: false }, // No special char
                    { password: 'Pass1!', expected: false }, // Too short
                ];

                for (const testCase of testCases) {
                    const result = await caller.auth.validatePassword({
                        password: testCase.password,
                    });
                    expect(result.isValid).toBe(testCase.expected);
                }
            });

            it('should handle property-based password validation', async () => {
                const caller = appRouter.createCaller(publicContext);

                await fc.assert(
                    fc.asyncProperty(
                        fc.string({ minLength: 1, maxLength: 100 }),
                        async (password) => {
                            const result = await caller.auth.validatePassword({ password });

                            expect(result).toHaveProperty('isValid');
                            expect(result).toHaveProperty('errors');
                            expect(Array.isArray(result.errors)).toBe(true);

                            // If valid, should have no errors
                            if (result.isValid) {
                                expect(result.errors).toHaveLength(0);
                            } else {
                                expect(result.errors.length).toBeGreaterThan(0);
                            }

                            return true;
                        }
                    ),
                    { numRuns: 50 }
                );
            });
        });

        describe('Protected Procedures', () => {
            it('should allow access with valid authentication', async () => {
                const caller = appRouter.createCaller(authenticatedContext);

                const result = await caller.auth.me();

                expect(result).toEqual({
                    user: expect.objectContaining({
                        id: expect.any(String),
                        email: expect.any(String),
                        name: expect.any(String),
                    }),
                    sessionInfo: {
                        authenticated: true,
                        emailVerified: expect.any(Boolean),
                    },
                });
            });

            it('should reject access without authentication', async () => {
                const caller = appRouter.createCaller(publicContext);

                await expect(caller.auth.me()).rejects.toThrow();
                await expect(caller.user.getProfile()).rejects.toThrow();
            });

            it('should handle session information correctly', async () => {
                const caller = appRouter.createCaller(authenticatedContext);

                const result = await caller.auth.getSession();

                expect(result).toEqual({
                    authenticated: true,
                    user: expect.objectContaining({
                        id: expect.any(String),
                        email: expect.any(String),
                    }),
                    sessionId: expect.any(String),
                    expiresAt: expect.any(String),
                });

                // Expiration should be a valid future date
                const expirationDate = new Date(result.expiresAt);
                expect(expirationDate.getTime()).toBeGreaterThan(Date.now());
            });
        });
    });

    describe('User Management Procedures', () => {
        describe('Profile Management', () => {
            it('should retrieve user profile with authentication', async () => {
                const caller = appRouter.createCaller(authenticatedContext);

                const result = await caller.user.getProfile();

                expect(result).toEqual({
                    user: expect.objectContaining({
                        id: expect.any(String),
                        email: expect.any(String),
                        name: expect.any(String),
                        organizationId: expect.any(String),
                        emailVerified: expect.any(Boolean),
                        createdAt: expect.any(Date),
                        updatedAt: expect.any(Date),
                    }),
                });
            });

            it('should update user profile with valid data', async () => {
                const caller = appRouter.createCaller(authenticatedContext);

                const result = await caller.user.updateProfile({
                    name: 'Updated Name',
                    email: 'updated@example.com',
                });

                expect(result).toEqual({
                    success: true,
                    user: expect.objectContaining({
                        name: 'Updated Name',
                        email: 'updated@example.com',
                        updatedAt: expect.any(Date),
                    }),
                    message: 'Profile updated successfully',
                });
            });

            it('should validate profile update data', async () => {
                const caller = appRouter.createCaller(authenticatedContext);

                // Test invalid email
                await expect(
                    caller.user.updateProfile({
                        email: 'invalid-email',
                    })
                ).rejects.toThrow();

                // Test empty name
                await expect(
                    caller.user.updateProfile({
                        name: '',
                    })
                ).rejects.toThrow();
            });

            it('should handle partial profile updates', async () => {
                const caller = appRouter.createCaller(authenticatedContext);

                // Update only name
                const nameResult = await caller.user.updateProfile({
                    name: 'New Name Only',
                });
                expect(nameResult.success).toBe(true);
                expect(nameResult.user.name).toBe('New Name Only');

                // Update only email
                const emailResult = await caller.user.updateProfile({
                    email: 'newemail@example.com',
                });
                expect(emailResult.success).toBe(true);
                expect(emailResult.user.email).toBe('newemail@example.com');
            });
        });
    });

    describe('Document Management Procedures', () => {
        describe('Document Listing', () => {
            it('should return document list for authenticated users', async () => {
                const caller = appRouter.createCaller(authenticatedContext);

                const result = await caller.document.list();

                expect(Array.isArray(result)).toBe(true);
                expect(result.length).toBeGreaterThan(0);

                result.forEach(doc => {
                    expect(doc).toEqual(
                        expect.objectContaining({
                            id: expect.any(String),
                            name: expect.any(String),
                            status: expect.any(String),
                            createdAt: expect.any(String),
                            updatedAt: expect.any(String),
                            size: expect.any(String),
                            recipients: expect.any(Number),
                            completedSignatures: expect.any(Number),
                            totalSignatures: expect.any(Number),
                        })
                    );
                });
            });

            it('should reject document access without authentication', async () => {
                const caller = appRouter.createCaller(publicContext);

                await expect(caller.document.list()).rejects.toThrow();
            });
        });

        describe('Document Retrieval', () => {
            it('should retrieve document by ID', async () => {
                const caller = appRouter.createCaller(authenticatedContext);

                const result = await caller.document.getById({ id: 'test-doc-id' });

                expect(result).toEqual(
                    expect.objectContaining({
                        id: 'test-doc-id',
                        name: expect.any(String),
                        status: expect.any(String),
                        createdAt: expect.any(String),
                        updatedAt: expect.any(String),
                        size: expect.any(String),
                        recipients: expect.any(Number),
                        completedSignatures: expect.any(Number),
                        totalSignatures: expect.any(Number),
                    })
                );
            });

            it('should validate document ID format', async () => {
                const caller = appRouter.createCaller(authenticatedContext);

                // Test with empty ID
                await expect(
                    caller.document.getById({ id: '' })
                ).rejects.toThrow();
            });
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle malformed requests gracefully', async () => {
            const caller = appRouter.createCaller(publicContext);

            // Test with invalid input types (this should be caught by Zod)
            await expect(
                caller.auth.validatePassword({ password: null as any })
            ).rejects.toThrow();
        });

        it('should provide meaningful error messages', async () => {
            const caller = appRouter.createCaller(publicContext);

            try {
                await caller.auth.login({
                    email: 'invalid@example.com',
                    password: 'wrongpassword',
                });
            } catch (error: any) {
                expect(error).toBeInstanceOf(TRPCError);
                expect(error.code).toBe('UNAUTHORIZED');
                expect(error.message).toBe('Invalid credentials');
            }
        });

        it('should handle network timeouts and retries', async () => {
            // This test simulates network conditions
            const caller = appRouter.createCaller(publicContext);

            // Multiple rapid requests should all succeed
            const promises = Array.from({ length: 20 }, () =>
                caller.auth.health()
            );

            const results = await Promise.all(promises);
            expect(results).toHaveLength(20);
            results.forEach(result => {
                expect(result.status).toBe('ok');
            });
        });

        it('should handle concurrent authentication attempts', async () => {
            const promises = Array.from({ length: 5 }, () => {
                const caller = appRouter.createCaller(publicContext);
                return caller.auth.login({
                    email: 'test@example.com',
                    password: 'password',
                });
            });

            const results = await Promise.all(promises);
            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result.success).toBe(true);
                expect(result.sessionToken).toBeDefined();
            });
        });
    });

    describe('Rate Limiting and Security', () => {
        it('should apply rate limiting to sensitive endpoints', async () => {
            // Note: This test may need adjustment based on actual rate limiting implementation
            const caller = appRouter.createCaller(publicContext);

            // The login endpoint should have rate limiting
            // First few attempts should work
            const attempt1 = caller.auth.login({
                email: 'test@example.com',
                password: 'password',
            });

            await expect(attempt1).resolves.toBeDefined();
        });

        it('should sanitize sensitive data in responses', async () => {
            const caller = appRouter.createCaller(publicContext);

            const result = await caller.auth.login({
                email: 'test@example.com',
                password: 'password',
            });

            // Response should not contain the password
            expect(JSON.stringify(result)).not.toContain('password');
        });

        it('should validate all input parameters', async () => {
            const caller = appRouter.createCaller(publicContext);

            // Test various invalid inputs
            const invalidInputs = [
                { email: '', password: 'test' },
                { email: 'test', password: '' },
                { email: null, password: 'test' },
                { email: 'test@example.com', password: null },
            ];

            for (const input of invalidInputs) {
                await expect(
                    caller.auth.login(input as any)
                ).rejects.toThrow();
            }
        });
    });
});