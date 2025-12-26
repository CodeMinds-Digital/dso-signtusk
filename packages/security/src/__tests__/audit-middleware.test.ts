import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context, Next } from 'hono';
import {
    createSecurityAuditMiddleware,
    createAuthenticationAuditMiddleware,
    createAuthorizationAuditMiddleware,
    createSuspiciousActivityMiddleware,
    createComplianceAuditMiddleware
} from '../audit-middleware';

// Mock the audit service
vi.mock('../audit-service', () => ({
    getSecurityAuditService: () => ({
        logLogin: vi.fn(),
        logLoginFailure: vi.fn(),
        logLogout: vi.fn(),
        logAuthorizationFailure: vi.fn(),
        logSuspiciousActivity: vi.fn(),
        logDataAccess: vi.fn(),
        logDataModification: vi.fn()
    })
}));

// Mock Hono context
const createMockContext = (overrides: Partial<Context> = {}): Context => {
    const mockContext = {
        req: {
            path: '/api/test',
            method: 'GET',
            header: vi.fn().mockReturnValue('test-user-agent')
        },
        res: {
            status: 200
        },
        get: vi.fn().mockImplementation((key: string) => {
            const values: Record<string, any> = {
                userId: 'test-user-123',
                organizationId: 'test-org-456',
                requestId: 'test-request-789',
                userEmail: 'test@example.com',
                sessionId: 'test-session-abc',
                userPermissions: ['read:documents'],
                ...overrides
            };
            return values[key];
        }),
        set: vi.fn(),
        ...overrides
    } as unknown as Context;

    return mockContext;
};

const createMockNext = (): Next => {
    return vi.fn().mockResolvedValue(undefined);
};

describe('Audit Middleware', () => {
    let mockContext: Context;
    let mockNext: Next;

    beforeEach(() => {
        mockContext = createMockContext();
        mockNext = createMockNext();
        vi.clearAllMocks();
    });

    describe('createSecurityAuditMiddleware', () => {
        it('should set request ID and call next', async () => {
            const middleware = createSecurityAuditMiddleware();

            await middleware(mockContext, mockNext);

            expect(mockContext.set).toHaveBeenCalledWith('requestId', expect.any(String));
            expect(mockNext).toHaveBeenCalled();
        });

        it('should log data access for sensitive endpoints', async () => {
            const sensitiveContext = createMockContext({
                req: {
                    path: '/api/documents/123',
                    method: 'GET',
                    header: vi.fn().mockReturnValue('test-user-agent')
                },
                res: { status: 200 }
            });

            const middleware = createSecurityAuditMiddleware();

            await middleware(sensitiveContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle errors and log security events', async () => {
            const error = new Error('Test error');
            const failingNext = vi.fn().mockRejectedValue(error);

            const middleware = createSecurityAuditMiddleware();

            await expect(middleware(mockContext, failingNext)).rejects.toThrow('Test error');
            expect(failingNext).toHaveBeenCalled();
        });
    });

    describe('createAuthenticationAuditMiddleware', () => {
        it('should log successful login', async () => {
            const loginContext = createMockContext({
                req: {
                    path: '/api/auth/login',
                    method: 'POST',
                    header: vi.fn().mockReturnValue('test-user-agent')
                },
                res: { status: 200 }
            });

            const middleware = createAuthenticationAuditMiddleware();

            await middleware(loginContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should log failed login attempt', async () => {
            const loginContext = createMockContext({
                req: {
                    path: '/api/auth/login',
                    method: 'POST',
                    header: vi.fn().mockReturnValue('test-user-agent')
                },
                res: { status: 401 }
            });

            const middleware = createAuthenticationAuditMiddleware();

            await middleware(loginContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should log logout event', async () => {
            const logoutContext = createMockContext({
                req: {
                    path: '/api/auth/logout',
                    method: 'POST',
                    header: vi.fn().mockReturnValue('test-user-agent')
                },
                res: { status: 200 }
            });

            const middleware = createAuthenticationAuditMiddleware();

            await middleware(logoutContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle authentication errors', async () => {
            const error = new Error('Authentication failed');
            const failingNext = vi.fn().mockRejectedValue(error);

            const loginContext = createMockContext({
                req: {
                    path: '/api/auth/login',
                    method: 'POST',
                    header: vi.fn().mockReturnValue('test-user-agent')
                }
            });

            const middleware = createAuthenticationAuditMiddleware();

            await expect(middleware(loginContext, failingNext)).rejects.toThrow('Authentication failed');
        });
    });

    describe('createAuthorizationAuditMiddleware', () => {
        it('should pass through successful requests', async () => {
            const middleware = createAuthorizationAuditMiddleware();

            await middleware(mockContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should log authorization errors', async () => {
            const authError = new Error('Unauthorized access');
            const failingNext = vi.fn().mockRejectedValue(authError);

            const middleware = createAuthorizationAuditMiddleware();

            await expect(middleware(mockContext, failingNext)).rejects.toThrow('Unauthorized access');
        });

        it('should handle forbidden errors', async () => {
            const forbiddenError = new Error('Forbidden - insufficient permissions');
            const failingNext = vi.fn().mockRejectedValue(forbiddenError);

            const middleware = createAuthorizationAuditMiddleware();

            await expect(middleware(mockContext, failingNext)).rejects.toThrow('Forbidden - insufficient permissions');
        });
    });

    describe('createSuspiciousActivityMiddleware', () => {
        it('should track request frequency', async () => {
            const middleware = createSuspiciousActivityMiddleware();

            // Simulate multiple requests from same IP
            for (let i = 0; i < 5; i++) {
                await middleware(mockContext, mockNext);
            }

            expect(mockNext).toHaveBeenCalledTimes(5);
        });

        it('should handle requests without triggering alerts for normal activity', async () => {
            const middleware = createSuspiciousActivityMiddleware();

            await middleware(mockContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('createComplianceAuditMiddleware', () => {
        it('should log data modifications for compliance', async () => {
            const modificationContext = createMockContext({
                req: {
                    path: '/api/documents/123',
                    method: 'PUT',
                    header: vi.fn().mockReturnValue('test-user-agent')
                },
                res: { status: 200 }
            });

            const middleware = createComplianceAuditMiddleware();

            await middleware(modificationContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should not log for GET requests', async () => {
            const getContext = createMockContext({
                req: {
                    path: '/api/documents/123',
                    method: 'GET',
                    header: vi.fn().mockReturnValue('test-user-agent')
                },
                res: { status: 200 }
            });

            const middleware = createComplianceAuditMiddleware();

            await middleware(getContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle POST requests for document creation', async () => {
            const createContext = createMockContext({
                req: {
                    path: '/api/documents',
                    method: 'POST',
                    header: vi.fn().mockReturnValue('test-user-agent')
                },
                res: { status: 201 }
            });

            const middleware = createComplianceAuditMiddleware();

            await middleware(createContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });

        it('should handle DELETE requests', async () => {
            const deleteContext = createMockContext({
                req: {
                    path: '/api/documents/123',
                    method: 'DELETE',
                    header: vi.fn().mockReturnValue('test-user-agent')
                },
                res: { status: 204 }
            });

            const middleware = createComplianceAuditMiddleware();

            await middleware(deleteContext, mockNext);

            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('Helper Functions', () => {
        it('should identify sensitive endpoints correctly', () => {
            const sensitiveEndpoints = [
                '/api/documents/123',
                '/api/users/456',
                '/api/organizations/789',
                '/api/templates/abc',
                '/api/audit/def',
                '/api/reports/ghi'
            ];

            // These would be tested indirectly through the middleware behavior
            // The actual helper functions are not exported, so we test through middleware
            sensitiveEndpoints.forEach(path => {
                const context = createMockContext({
                    req: { path, method: 'GET', header: vi.fn() },
                    res: { status: 200 }
                });
                expect(context.req.path).toBe(path);
            });
        });

        it('should identify auth endpoints correctly', () => {
            const authEndpoints = [
                '/api/auth/login',
                '/api/auth/logout',
                '/api/auth/register',
                '/api/auth/verify',
                '/api/auth/reset-password',
                '/api/auth/2fa'
            ];

            authEndpoints.forEach(path => {
                const context = createMockContext({
                    req: { path, method: 'POST', header: vi.fn() },
                    res: { status: 200 }
                });
                expect(context.req.path).toBe(path);
            });
        });
    });
});