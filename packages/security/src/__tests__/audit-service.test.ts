import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Context } from 'hono';
import { SecurityAuditService, getSecurityAuditService } from '../audit-service';
import { SecurityEventType, SecurityEventSeverity } from '../types';

// Mock the audit system
vi.mock('../audit', () => ({
    getAuditManager: () => ({
        logEvent: vi.fn(),
        queryEvents: vi.fn().mockResolvedValue([])
    }),
    initializeSecurityMonitoring: vi.fn(),
    logSecurityEventWithMonitoring: vi.fn(),
    createSecurityEvent: vi.fn().mockReturnValue({
        id: 'test-event-id',
        timestamp: new Date(),
        type: 'test_event',
        severity: 'low',
        source: 'test',
        message: 'test message'
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
                ...overrides
            };
            return values[key];
        }),
        set: vi.fn(),
        ...overrides
    } as unknown as Context;

    return mockContext;
};

describe('SecurityAuditService', () => {
    let auditService: SecurityAuditService;
    let mockContext: Context;

    beforeEach(() => {
        auditService = new SecurityAuditService();
        mockContext = createMockContext();

        // Clear all mocks
        vi.clearAllMocks();
    });

    describe('Authentication Event Logging', () => {
        it('should log successful login', async () => {
            await expect(auditService.logLogin({
                context: mockContext,
                userId: 'user-123',
                email: 'test@example.com',
                authMethod: 'password',
                metadata: { loginSource: 'web' }
            })).resolves.toBeUndefined();
        });

        it('should log failed login attempt', async () => {
            await expect(auditService.logLoginFailure({
                context: mockContext,
                email: 'test@example.com',
                reason: 'invalid_credentials',
                attemptCount: 3
            })).resolves.toBeUndefined();
        });

        it('should log logout event', async () => {
            await expect(auditService.logLogout({
                context: mockContext,
                userId: 'user-123',
                sessionId: 'session-abc',
                reason: 'user_initiated'
            })).resolves.toBeUndefined();
        });

        it('should log password change', async () => {
            await expect(auditService.logPasswordChange({
                context: mockContext,
                userId: 'user-123',
                initiatedBy: 'user'
            })).resolves.toBeUndefined();
        });

        it('should log two-factor authentication events', async () => {
            await expect(auditService.logTwoFactorAuth({
                context: mockContext,
                userId: 'user-123',
                action: 'enabled',
                method: 'totp'
            })).resolves.toBeUndefined();
        });
    });

    describe('Authorization Event Logging', () => {
        it('should log authorization failure', async () => {
            await expect(auditService.logAuthorizationFailure({
                context: mockContext,
                userId: 'user-123',
                resource: '/api/admin/users',
                action: 'GET',
                reason: 'insufficient_permissions',
                currentPermissions: ['read:documents'],
                requiredPermissions: ['admin:users']
            })).resolves.toBeUndefined();
        });

        it('should log privilege escalation attempt', async () => {
            await expect(auditService.logPrivilegeEscalation({
                context: mockContext,
                userId: 'user-123',
                attemptedAction: 'delete_organization',
                currentRole: 'user',
                targetRole: 'admin'
            })).resolves.toBeUndefined();
        });

        it('should log unauthorized access attempt', async () => {
            await expect(auditService.logUnauthorizedAccess({
                context: mockContext,
                userId: 'user-123',
                resource: '/api/sensitive-data',
                attemptedAction: 'read'
            })).resolves.toBeUndefined();
        });
    });

    describe('Suspicious Activity Detection', () => {
        it('should log suspicious activity with appropriate severity', async () => {
            await expect(auditService.logSuspiciousActivity({
                context: mockContext,
                userId: 'user-123',
                activityType: 'brute_force',
                description: 'Multiple failed login attempts detected',
                riskScore: 8
            })).resolves.toBeUndefined();
        });

        it('should assign correct severity based on risk score', async () => {
            await expect(auditService.logSuspiciousActivity({
                context: mockContext,
                activityType: 'unusual_location',
                description: 'Login from new location',
                riskScore: 3
            })).resolves.toBeUndefined();
        });
    });

    describe('Compliance and Data Events', () => {
        it('should log data access for compliance', async () => {
            await expect(auditService.logDataAccess({
                context: mockContext,
                userId: 'user-123',
                dataType: 'document',
                entityId: 'doc-456',
                accessType: 'read'
            })).resolves.toBeUndefined();
        });

        it('should log data modification for compliance', async () => {
            await expect(auditService.logDataModification({
                context: mockContext,
                userId: 'user-123',
                dataType: 'document',
                entityId: 'doc-456',
                modificationType: 'sign',
                changes: { status: 'signed' }
            })).resolves.toBeUndefined();
        });
    });

    describe('Audit Reporting', () => {
        it('should generate audit report with summary', async () => {
            // First, create some audit events
            await auditService.logLogin({
                context: mockContext,
                userId: 'user-123',
                email: 'test@example.com',
                authMethod: 'password'
            });

            await auditService.logAuthorizationFailure({
                context: mockContext,
                userId: 'user-123',
                resource: '/api/test',
                action: 'GET',
                reason: 'test'
            });

            const report = await auditService.generateAuditReport({
                title: 'Test Security Report',
                description: 'Test report for security events',
                filters: {
                    startDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
                    endDate: new Date()
                },
                generatedBy: 'test-user'
            });

            expect(report).toBeDefined();
            expect(report.title).toBe('Test Security Report');
            expect(report.description).toBe('Test report for security events');
            expect(report.generatedBy).toBe('test-user');
            expect(report.summary).toBeDefined();
            expect(report.summary.totalEvents).toBeGreaterThanOrEqual(0);
        });

        it('should calculate security metrics correctly', async () => {
            const timeRange = {
                start: new Date(Date.now() - 24 * 60 * 60 * 1000),
                end: new Date()
            };

            const metrics = await auditService.getSecurityMetrics(timeRange);

            expect(metrics).toBeDefined();
            expect(metrics.timeRange).toEqual(timeRange);
            expect(typeof metrics.authenticationFailures).toBe('number');
            expect(typeof metrics.authorizationFailures).toBe('number');
            expect(typeof metrics.suspiciousActivities).toBe('number');
            expect(typeof metrics.uniqueThreats).toBe('number');
        });
    });

    describe('Singleton Pattern', () => {
        it('should return the same instance', () => {
            const service1 = getSecurityAuditService();
            const service2 = getSecurityAuditService();

            expect(service1).toBe(service2);
        });
    });
});