import type { Context } from 'hono';
import type {
    SecurityEvent,
    SecurityEventType,
    SecurityEventSeverity,
    AuditQueryFilters,
    AuditReport,
    AuditSummary,
    SecurityMetrics,
    AlertRule
} from './types';
import {
    getAuditManager,
    initializeSecurityMonitoring,
    logSecurityEventWithMonitoring,
    createSecurityEvent
} from './audit';

// ============================================================================
// COMPREHENSIVE SECURITY AUDIT SERVICE
// ============================================================================

/**
 * Comprehensive security audit service for authentication and authorization events
 */
export class SecurityAuditService {
    private auditManager = getAuditManager();

    constructor() {
        // Initialize security monitoring
        initializeSecurityMonitoring(this.auditManager);
    }

    // ========================================================================
    // AUTHENTICATION EVENT LOGGING
    // ========================================================================

    /**
     * Log successful login
     */
    async logLogin(params: {
        context: Context;
        userId: string;
        email: string;
        authMethod: 'password' | 'oauth' | 'sso' | 'webauthn';
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, email, authMethod, metadata } = params;

        const event = createSecurityEvent({
            type: 'authentication_success' as SecurityEventType,
            severity: 'low' as SecurityEventSeverity,
            message: `User ${email} logged in successfully via ${authMethod}`,
            context,
            metadata: {
                userId,
                email,
                authMethod,
                loginTimestamp: new Date().toISOString(),
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    /**
     * Log failed login attempt
     */
    async logLoginFailure(params: {
        context: Context;
        email: string;
        reason: 'invalid_credentials' | 'account_locked' | 'account_disabled' | 'invalid_2fa' | 'expired_session';
        attemptCount?: number;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, email, reason, attemptCount, metadata } = params;

        const event = createSecurityEvent({
            type: 'authentication_failure' as SecurityEventType,
            severity: attemptCount && attemptCount > 3 ? 'high' as SecurityEventSeverity : 'medium' as SecurityEventSeverity,
            message: `Login failed for ${email}: ${reason}`,
            context,
            metadata: {
                email,
                failureReason: reason,
                attemptCount,
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    /**
     * Log logout event
     */
    async logLogout(params: {
        context: Context;
        userId: string;
        sessionId: string;
        reason: 'user_initiated' | 'session_expired' | 'forced_logout' | 'security_logout';
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, sessionId, reason, metadata } = params;

        const event = createSecurityEvent({
            type: 'session_management' as SecurityEventType,
            severity: 'low' as SecurityEventSeverity,
            message: `User logged out: ${reason}`,
            context,
            metadata: {
                userId,
                sessionId,
                logoutReason: reason,
                sessionDuration: metadata?.sessionDuration,
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    /**
     * Log password change
     */
    async logPasswordChange(params: {
        context: Context;
        userId: string;
        initiatedBy: 'user' | 'admin' | 'system';
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, initiatedBy, metadata } = params;

        const event = createSecurityEvent({
            type: 'password_change' as SecurityEventType,
            severity: 'medium' as SecurityEventSeverity,
            message: `Password changed (initiated by: ${initiatedBy})`,
            context,
            metadata: {
                userId,
                initiatedBy,
                changeTimestamp: new Date().toISOString(),
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    /**
     * Log two-factor authentication events
     */
    async logTwoFactorAuth(params: {
        context: Context;
        userId: string;
        action: 'setup' | 'enabled' | 'disabled' | 'verified' | 'failed' | 'backup_used';
        method?: 'totp' | 'sms' | 'email' | 'backup_code';
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, action, method, metadata } = params;

        const severity = action === 'failed' ? 'medium' as SecurityEventSeverity : 'low' as SecurityEventSeverity;

        const event = createSecurityEvent({
            type: 'two_factor_auth' as SecurityEventType,
            severity,
            message: `Two-factor authentication ${action}${method ? ` via ${method}` : ''}`,
            context,
            metadata: {
                userId,
                twoFactorAction: action,
                method,
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    // ========================================================================
    // AUTHORIZATION EVENT LOGGING
    // ========================================================================

    /**
     * Log authorization failure
     */
    async logAuthorizationFailure(params: {
        context: Context;
        userId?: string;
        resource: string;
        action: string;
        reason: string;
        currentPermissions?: string[];
        requiredPermissions?: string[];
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, resource, action, reason, currentPermissions, requiredPermissions, metadata } = params;

        const event = createSecurityEvent({
            type: 'authorization_failure' as SecurityEventType,
            severity: 'medium' as SecurityEventSeverity,
            message: `Authorization failed: ${action} on ${resource} - ${reason}`,
            context,
            metadata: {
                userId,
                resource,
                action,
                failureReason: reason,
                currentPermissions,
                requiredPermissions,
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    /**
     * Log privilege escalation attempt
     */
    async logPrivilegeEscalation(params: {
        context: Context;
        userId: string;
        attemptedAction: string;
        currentRole: string;
        targetRole: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, attemptedAction, currentRole, targetRole, metadata } = params;

        const event = createSecurityEvent({
            type: 'privilege_escalation' as SecurityEventType,
            severity: 'high' as SecurityEventSeverity,
            message: `Privilege escalation attempt: ${currentRole} → ${targetRole}`,
            context,
            metadata: {
                userId,
                attemptedAction,
                currentRole,
                targetRole,
                escalationTimestamp: new Date().toISOString(),
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    /**
     * Log unauthorized access attempt
     */
    async logUnauthorizedAccess(params: {
        context: Context;
        userId?: string;
        resource: string;
        attemptedAction: string;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, resource, attemptedAction, metadata } = params;

        const event = createSecurityEvent({
            type: 'unauthorized_access' as SecurityEventType,
            severity: 'high' as SecurityEventSeverity,
            message: `Unauthorized access attempt to ${resource}`,
            context,
            metadata: {
                userId,
                resource,
                attemptedAction,
                accessTimestamp: new Date().toISOString(),
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    // ========================================================================
    // SUSPICIOUS ACTIVITY DETECTION
    // ========================================================================

    /**
     * Log suspicious activity
     */
    async logSuspiciousActivity(params: {
        context: Context;
        userId?: string;
        activityType: 'brute_force' | 'credential_stuffing' | 'session_hijacking' | 'unusual_location' | 'rapid_requests' | 'data_exfiltration';
        description: string;
        riskScore: number; // 1-10
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, activityType, description, riskScore, metadata } = params;

        const severity = riskScore >= 8 ? 'critical' as SecurityEventSeverity :
            riskScore >= 6 ? 'high' as SecurityEventSeverity :
                riskScore >= 4 ? 'medium' as SecurityEventSeverity :
                    'low' as SecurityEventSeverity;

        const event = createSecurityEvent({
            type: 'suspicious_activity' as SecurityEventType,
            severity,
            message: `Suspicious activity detected: ${description}`,
            context,
            metadata: {
                userId,
                activityType,
                riskScore,
                detectionTimestamp: new Date().toISOString(),
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    // ========================================================================
    // COMPLIANCE AND DATA EVENTS
    // ========================================================================

    /**
     * Log data access for compliance
     */
    async logDataAccess(params: {
        context: Context;
        userId: string;
        dataType: 'document' | 'user_profile' | 'organization_data' | 'audit_log' | 'template';
        entityId: string;
        accessType: 'read' | 'download' | 'export' | 'print';
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, dataType, entityId, accessType, metadata } = params;

        const event = createSecurityEvent({
            type: 'data_access' as SecurityEventType,
            severity: 'low' as SecurityEventSeverity,
            message: `Data access: ${accessType} ${dataType}`,
            context,
            metadata: {
                userId,
                dataType,
                entityId,
                accessType,
                accessTimestamp: new Date().toISOString(),
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    /**
     * Log data modification for compliance
     */
    async logDataModification(params: {
        context: Context;
        userId: string;
        dataType: string;
        entityId: string;
        modificationType: 'create' | 'update' | 'delete' | 'sign';
        changes?: Record<string, any>;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const { context, userId, dataType, entityId, modificationType, changes, metadata } = params;

        const event = createSecurityEvent({
            type: 'data_modification' as SecurityEventType,
            severity: 'medium' as SecurityEventSeverity,
            message: `Data modification: ${modificationType} ${dataType}`,
            context,
            metadata: {
                userId,
                dataType,
                entityId,
                modificationType,
                changes,
                modificationTimestamp: new Date().toISOString(),
                ...metadata
            }
        });

        await logSecurityEventWithMonitoring(event);
    }

    // ========================================================================
    // AUDIT QUERYING AND REPORTING
    // ========================================================================

    /**
     * Query audit events
     */
    async queryAuditEvents(filters: AuditQueryFilters): Promise<SecurityEvent[]> {
        return await this.auditManager.queryEvents(filters);
    }

    /**
     * Generate audit report
     */
    async generateAuditReport(params: {
        title: string;
        description?: string;
        filters: AuditQueryFilters;
        generatedBy: string;
    }): Promise<AuditReport> {
        const { title, description, filters, generatedBy } = params;

        const events = await this.queryAuditEvents(filters);
        const summary = this.generateAuditSummary(events, filters);

        return {
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title,
            description,
            filters,
            events,
            summary,
            generatedAt: new Date(),
            generatedBy
        };
    }

    /**
     * Generate audit summary
     */
    private generateAuditSummary(events: SecurityEvent[], filters: AuditQueryFilters): AuditSummary {
        const eventsByType: Record<SecurityEventType, number> = {} as Record<SecurityEventType, number>;
        const eventsBySeverity: Record<SecurityEventSeverity, number> = {} as Record<SecurityEventSeverity, number>;
        const uniqueUsers = new Set<string>();
        const uniqueIPs = new Set<string>();

        events.forEach(event => {
            // Count by type
            eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

            // Count by severity
            eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;

            // Track unique users and IPs
            if (event.userId) uniqueUsers.add(event.userId);
            if (event.ipAddress) uniqueIPs.add(event.ipAddress);
        });

        return {
            totalEvents: events.length,
            eventsByType,
            eventsBySeverity,
            uniqueUsers: uniqueUsers.size,
            uniqueIPs: uniqueIPs.size,
            timeRange: {
                start: filters.startDate || new Date(0),
                end: filters.endDate || new Date()
            }
        };
    }

    /**
     * Get security metrics
     */
    async getSecurityMetrics(timeRange: { start: Date; end: Date }): Promise<SecurityMetrics> {
        const filters: AuditQueryFilters = {
            startDate: timeRange.start,
            endDate: timeRange.end
        };

        const events = await this.queryAuditEvents(filters);

        const authenticationFailures = events.filter(e => e.type === 'authentication_failure').length;
        const authorizationFailures = events.filter(e => e.type === 'authorization_failure').length;
        const suspiciousActivities = events.filter(e => e.type === 'suspicious_activity').length;
        const rateLimitExceeded = events.filter(e => e.type === 'rate_limit_exceeded').length;
        const activeAlerts = events.filter(e => e.type === 'security_alert').length;

        // Count unique threat sources (IPs with suspicious activity)
        const threatIPs = new Set(
            events
                .filter(e => [
                    'suspicious_activity',
                    'authentication_failure',
                    'unauthorized_access'
                ].includes(e.type))
                .map(e => e.ipAddress)
        );

        return {
            authenticationFailures,
            authorizationFailures,
            suspiciousActivities,
            rateLimitExceeded,
            activeAlerts,
            uniqueThreats: threatIPs.size,
            timeRange
        };
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let securityAuditService: SecurityAuditService | null = null;

/**
 * Get the security audit service instance
 */
export function getSecurityAuditService(): SecurityAuditService {
    if (!securityAuditService) {
        securityAuditService = new SecurityAuditService();
    }
    return securityAuditService;
}

/**
 * Initialize the security audit service
 */
export function initializeSecurityAuditService(): SecurityAuditService {
    securityAuditService = new SecurityAuditService();
    return securityAuditService;
}