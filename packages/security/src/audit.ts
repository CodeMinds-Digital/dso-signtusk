import type { Context } from 'hono';
import type {
    SecurityEvent,
    SecurityEventType,
    AuditConfig,
    SecurityMiddleware,
    AuthenticationEvent,
    AuthorizationEvent,
    SecurityAlert,
    ComplianceEvent
} from './types';
import { SecurityEventSeverity } from './types';

// ============================================================================
// SECURITY AUDIT LOGGING SYSTEM
// ============================================================================

/**
 * Default audit configuration
 */
export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
    enabled: true,
    logLevel: 'info',
    includeRequestBody: false,
    includeResponseBody: false,
    sensitiveFields: [
        'password',
        'token',
        'secret',
        'key',
        'authorization',
        'cookie',
        'session'
    ],
    storage: 'console'
};

/**
 * Security event types for easy import
 */
export { SecurityEventType, SecurityEventSeverity } from './types';

/**
 * Audit logger interface
 */
interface AuditLogger {
    log(event: SecurityEvent): Promise<void>;
    query?(filters: AuditQueryFilters): Promise<SecurityEvent[]>;
}

/**
 * Audit query filters
 */
interface AuditQueryFilters {
    startDate?: Date;
    endDate?: Date;
    eventType?: SecurityEventType;
    severity?: SecurityEventSeverity;
    userId?: string;
    organizationId?: string;
    ipAddress?: string;
    limit?: number;
    offset?: number;
}

/**
 * Console audit logger (default implementation)
 */
class ConsoleAuditLogger implements AuditLogger {
    constructor(private config: AuditConfig) { }

    async log(event: SecurityEvent): Promise<void> {
        const logLevel = this.getLogLevel(event.severity);
        const message = this.formatLogMessage(event);

        switch (logLevel) {
            case 'error':
                console.error(message);
                break;
            case 'warn':
                console.warn(message);
                break;
            case 'info':
                console.info(message);
                break;
            case 'debug':
                console.debug(message);
                break;
        }
    }

    private getLogLevel(severity: SecurityEventSeverity): string {
        switch (severity) {
            case SecurityEventSeverity.CRITICAL:
                return 'error';
            case SecurityEventSeverity.HIGH:
                return 'error';
            case SecurityEventSeverity.MEDIUM:
                return 'warn';
            case SecurityEventSeverity.LOW:
                return 'info';
            default:
                return 'info';
        }
    }

    private formatLogMessage(event: SecurityEvent): string {
        const sanitizedEvent = this.sanitizeEvent(event);
        return JSON.stringify({
            timestamp: sanitizedEvent.timestamp.toISOString(),
            type: sanitizedEvent.type,
            severity: sanitizedEvent.severity,
            message: sanitizedEvent.message,
            source: sanitizedEvent.source,
            userId: sanitizedEvent.userId,
            organizationId: sanitizedEvent.organizationId,
            ipAddress: sanitizedEvent.ipAddress,
            requestId: sanitizedEvent.requestId,
            path: sanitizedEvent.path,
            method: sanitizedEvent.method,
            statusCode: sanitizedEvent.statusCode,
            metadata: sanitizedEvent.metadata
        }, null, 2);
    }

    private sanitizeEvent(event: SecurityEvent): SecurityEvent {
        const sanitized = { ...event };

        // Remove sensitive fields from metadata
        if (sanitized.metadata) {
            sanitized.metadata = this.sanitizeObject(sanitized.metadata);
        }

        return sanitized;
    }

    private sanitizeObject(obj: any): any {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = this.config.sensitiveFields?.some(field =>
                lowerKey.includes(field.toLowerCase())
            );

            if (isSensitive) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = this.sanitizeObject(value);
            }
        }

        return sanitized;
    }
}

/**
 * File audit logger (writes to file system)
 */
class FileAuditLogger implements AuditLogger {
    constructor(
        private config: AuditConfig,
        private filePath: string = './security-audit.log'
    ) { }

    async log(event: SecurityEvent): Promise<void> {
        const fs = await import('fs/promises');
        const logEntry = JSON.stringify(event) + '\n';

        try {
            await fs.appendFile(this.filePath, logEntry, 'utf8');
        } catch (error) {
            // Fallback to console if file writing fails
            console.error('Failed to write audit log to file:', error);
            console.log('Audit event:', logEntry);
        }
    }
}

/**
 * Database audit logger with comprehensive security event storage
 */
class DatabaseAuditLogger implements AuditLogger {
    constructor(private config: AuditConfig) { }

    async log(event: SecurityEvent): Promise<void> {
        try {
            // In a real implementation, this would use Prisma client
            // For now, we'll structure the data for database insertion
            const auditRecord = {
                id: event.id,
                organizationId: event.organizationId || 'system',
                userId: event.userId,
                entityType: 'security_event',
                entityId: event.id,
                action: event.type,
                details: {
                    severity: event.severity,
                    source: event.source,
                    message: event.message,
                    ipAddress: event.ipAddress,
                    userAgent: event.userAgent,
                    requestId: event.requestId,
                    path: event.path,
                    method: event.method,
                    statusCode: event.statusCode,
                    metadata: event.metadata
                },
                ipAddress: event.ipAddress,
                userAgent: event.userAgent,
                timestamp: event.timestamp
            };

            // TODO: Replace with actual Prisma client call
            // await prisma.auditEvent.create({ data: auditRecord });

            console.log('Database audit log (structured):', JSON.stringify(auditRecord, null, 2));
        } catch (error) {
            console.error('Failed to log to database:', error);
            // Fallback to console logging
            console.log('Fallback audit log:', JSON.stringify(event, null, 2));
        }
    }

    async query(filters: AuditQueryFilters): Promise<SecurityEvent[]> {
        try {
            // TODO: Replace with actual Prisma client query
            // const events = await prisma.auditEvent.findMany({
            //     where: {
            //         timestamp: {
            //             gte: filters.startDate,
            //             lte: filters.endDate
            //         },
            //         action: filters.eventType,
            //         userId: filters.userId,
            //         organizationId: filters.organizationId,
            //         ipAddress: filters.ipAddress
            //     },
            //     take: filters.limit || 100,
            //     skip: filters.offset || 0,
            //     orderBy: { timestamp: 'desc' }
            // });

            // For now, return empty array
            return [];
        } catch (error) {
            console.error('Failed to query audit events:', error);
            return [];
        }
    }
}

/**
 * Audit manager - central audit logging system
 */
class AuditManager {
    private logger: AuditLogger;
    private config: AuditConfig;

    constructor(config: Partial<AuditConfig> = {}) {
        this.config = { ...DEFAULT_AUDIT_CONFIG, ...config };
        this.logger = this.createLogger();
    }

    private createLogger(): AuditLogger {
        switch (this.config.storage) {
            case 'file':
                return new FileAuditLogger(this.config);
            case 'database':
                return new DatabaseAuditLogger(this.config);
            case 'console':
            default:
                return new ConsoleAuditLogger(this.config);
        }
    }

    async logEvent(event: SecurityEvent): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        try {
            await this.logger.log(event);
        } catch (error) {
            // Don't let audit logging failures break the application
            console.error('Audit logging failed:', error);
        }
    }

    async queryEvents(filters: AuditQueryFilters): Promise<SecurityEvent[]> {
        if (this.logger.query) {
            return await this.logger.query(filters);
        }
        return [];
    }
}

// Global audit manager instance
let auditManager: AuditManager | null = null;

/**
 * Initializes the audit system
 */
export function initializeAuditSystem(config: Partial<AuditConfig> = {}): void {
    auditManager = new AuditManager(config);
}

/**
 * Gets the audit manager instance
 */
export function getAuditManager(): AuditManager {
    if (!auditManager) {
        auditManager = new AuditManager();
    }
    return auditManager;
}

/**
 * Creates a security event
 */
export function createSecurityEvent(params: {
    type: SecurityEventType;
    severity: SecurityEventSeverity;
    message: string;
    context: Context;
    metadata?: Record<string, any>;
}): SecurityEvent {
    const { type, severity, message, context, metadata } = params;

    return {
        id: generateEventId(),
        timestamp: new Date(),
        type,
        severity,
        source: 'security-middleware',
        userId: context.get('userId'),
        organizationId: context.get('organizationId'),
        ipAddress: getClientIP(context),
        userAgent: context.req.header('user-agent') || 'unknown',
        requestId: context.get('requestId') || generateRequestId(),
        path: context.req.path,
        method: context.req.method,
        statusCode: context.res.status,
        message,
        metadata
    };
}

/**
 * Logs a security event
 */
export async function logSecurityEvent(event: SecurityEvent): Promise<void> {
    const manager = getAuditManager();
    await manager.logEvent(event);
}

/**
 * Creates audit logging middleware
 */
export function createAuditMiddleware(config: Partial<AuditConfig> = {}): SecurityMiddleware {
    const auditConfig = { ...DEFAULT_AUDIT_CONFIG, ...config };

    return async (context: Context, next) => {
        const startTime = Date.now();

        try {
            await next();

            // Log successful request if configured
            if (auditConfig.logLevel === 'debug') {
                const event = createSecurityEvent({
                    type: 'authentication_success' as SecurityEventType,
                    severity: 'low' as SecurityEventSeverity,
                    message: 'Request processed successfully',
                    context,
                    metadata: {
                        processingTime: Date.now() - startTime,
                        statusCode: context.res.status
                    }
                });

                await logSecurityEvent(event);
            }

        } catch (error) {
            // Log error
            const event = createSecurityEvent({
                type: 'suspicious_activity' as SecurityEventType,
                severity: 'high' as SecurityEventSeverity,
                message: 'Request processing error',
                context,
                metadata: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    processingTime: Date.now() - startTime
                }
            });

            await logSecurityEvent(event);
            throw error;
        }
    };
}

/**
 * Utility functions
 */
function generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getClientIP(context: Context): string {
    const headers = [
        'x-forwarded-for',
        'x-real-ip',
        'x-client-ip',
        'cf-connecting-ip',
        'x-cluster-client-ip'
    ];

    for (const header of headers) {
        const value = context.req.header(header);
        if (value) {
            return value.split(',')[0].trim();
        }
    }

    return 'unknown';
}

// ============================================================================
// COMPREHENSIVE AUTHENTICATION EVENT LOGGING
// ============================================================================

/**
 * Logs authentication success events
 */
export async function logAuthenticationSuccess(params: {
    context: Context;
    userId: string;
    method: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, userId, method, metadata } = params;

    const event = createSecurityEvent({
        type: 'authentication_success' as SecurityEventType,
        severity: 'low' as SecurityEventSeverity,
        message: `User authenticated successfully via ${method}`,
        context,
        metadata: {
            authMethod: method,
            userId,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

/**
 * Logs authentication failure events
 */
export async function logAuthenticationFailure(params: {
    context: Context;
    email?: string;
    reason: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, email, reason, metadata } = params;

    const event = createSecurityEvent({
        type: 'authentication_failure' as SecurityEventType,
        severity: 'medium' as SecurityEventSeverity,
        message: `Authentication failed: ${reason}`,
        context,
        metadata: {
            email,
            failureReason: reason,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

/**
 * Logs suspicious authentication attempts
 */
export async function logSuspiciousAuthActivity(params: {
    context: Context;
    email?: string;
    reason: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, email, reason, metadata } = params;

    const event = createSecurityEvent({
        type: 'suspicious_activity' as SecurityEventType,
        severity: 'high' as SecurityEventSeverity,
        message: `Suspicious authentication activity detected: ${reason}`,
        context,
        metadata: {
            email,
            suspiciousReason: reason,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

/**
 * Logs password change events
 */
export async function logPasswordChange(params: {
    context: Context;
    userId: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, userId, metadata } = params;

    const event = createSecurityEvent({
        type: 'password_change' as SecurityEventType,
        severity: 'medium' as SecurityEventSeverity,
        message: 'User password changed',
        context,
        metadata: {
            userId,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

/**
 * Logs two-factor authentication events
 */
export async function logTwoFactorEvent(params: {
    context: Context;
    userId: string;
    action: 'enabled' | 'disabled' | 'verified' | 'failed';
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, userId, action, metadata } = params;

    const severity = action === 'failed' ? 'medium' as SecurityEventSeverity : 'low' as SecurityEventSeverity;

    const event = createSecurityEvent({
        type: 'two_factor_auth' as SecurityEventType,
        severity,
        message: `Two-factor authentication ${action}`,
        context,
        metadata: {
            userId,
            twoFactorAction: action,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

/**
 * Logs session management events
 */
export async function logSessionEvent(params: {
    context: Context;
    userId: string;
    action: 'created' | 'expired' | 'terminated' | 'hijacked';
    sessionId: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, userId, action, sessionId, metadata } = params;

    const severity = action === 'hijacked' ? 'critical' as SecurityEventSeverity : 'low' as SecurityEventSeverity;

    const event = createSecurityEvent({
        type: 'session_management' as SecurityEventType,
        severity,
        message: `Session ${action}`,
        context,
        metadata: {
            userId,
            sessionId,
            sessionAction: action,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

// ============================================================================
// AUTHORIZATION FAILURE LOGGING AND MONITORING
// ============================================================================

/**
 * Logs authorization failure events
 */
export async function logAuthorizationFailure(params: {
    context: Context;
    userId?: string;
    resource: string;
    action: string;
    reason: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, userId, resource, action, reason, metadata } = params;

    const event = createSecurityEvent({
        type: 'authorization_failure' as SecurityEventType,
        severity: 'medium' as SecurityEventSeverity,
        message: `Authorization failed for ${action} on ${resource}: ${reason}`,
        context,
        metadata: {
            userId,
            resource,
            action,
            failureReason: reason,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

/**
 * Logs privilege escalation attempts
 */
export async function logPrivilegeEscalation(params: {
    context: Context;
    userId: string;
    attemptedAction: string;
    currentRole: string;
    requiredRole: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, userId, attemptedAction, currentRole, requiredRole, metadata } = params;

    const event = createSecurityEvent({
        type: 'privilege_escalation' as SecurityEventType,
        severity: 'high' as SecurityEventSeverity,
        message: `Privilege escalation attempt detected`,
        context,
        metadata: {
            userId,
            attemptedAction,
            currentRole,
            requiredRole,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

/**
 * Logs unauthorized access attempts
 */
export async function logUnauthorizedAccess(params: {
    context: Context;
    userId?: string;
    resource: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, userId, resource, metadata } = params;

    const event = createSecurityEvent({
        type: 'unauthorized_access' as SecurityEventType,
        severity: 'high' as SecurityEventSeverity,
        message: `Unauthorized access attempt to ${resource}`,
        context,
        metadata: {
            userId,
            resource,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

// ============================================================================
// SECURITY EVENT MONITORING WITH ALERTING
// ============================================================================

/**
 * Security alert thresholds and rules
 */
interface SecurityAlertRule {
    eventType: SecurityEventType;
    threshold: number;
    timeWindow: number; // in minutes
    severity: SecurityEventSeverity;
    action: 'log' | 'alert' | 'block';
}

const DEFAULT_ALERT_RULES: SecurityAlertRule[] = [
    {
        eventType: 'authentication_failure' as SecurityEventType,
        threshold: 5,
        timeWindow: 15,
        severity: 'high' as SecurityEventSeverity,
        action: 'alert'
    },
    {
        eventType: 'authorization_failure' as SecurityEventType,
        threshold: 10,
        timeWindow: 30,
        severity: 'medium' as SecurityEventSeverity,
        action: 'alert'
    },
    {
        eventType: 'suspicious_activity' as SecurityEventType,
        threshold: 1,
        timeWindow: 5,
        severity: 'critical' as SecurityEventSeverity,
        action: 'alert'
    },
    {
        eventType: 'privilege_escalation' as SecurityEventType,
        threshold: 1,
        timeWindow: 5,
        severity: 'critical' as SecurityEventSeverity,
        action: 'block'
    }
];

/**
 * Security monitoring service
 */
class SecurityMonitor {
    private eventCounts: Map<string, { count: number; firstSeen: Date }> = new Map();
    private alertRules: SecurityAlertRule[] = DEFAULT_ALERT_RULES;

    constructor(private auditManager: AuditManager) { }

    async processSecurityEvent(event: SecurityEvent): Promise<void> {
        // Log the event
        await this.auditManager.logEvent(event);

        // Check for alert conditions
        await this.checkAlertRules(event);
    }

    private async checkAlertRules(event: SecurityEvent): Promise<void> {
        const relevantRules = this.alertRules.filter(rule => rule.eventType === event.type);

        for (const rule of relevantRules) {
            const key = this.getEventKey(event, rule);
            const now = new Date();

            // Get or initialize event count
            let eventCount = this.eventCounts.get(key);
            if (!eventCount) {
                eventCount = { count: 0, firstSeen: now };
                this.eventCounts.set(key, eventCount);
            }

            // Check if within time window
            const timeElapsed = (now.getTime() - eventCount.firstSeen.getTime()) / (1000 * 60);
            if (timeElapsed > rule.timeWindow) {
                // Reset counter if outside time window
                eventCount = { count: 1, firstSeen: now };
                this.eventCounts.set(key, eventCount);
            } else {
                eventCount.count++;
            }

            // Check if threshold exceeded
            if (eventCount.count >= rule.threshold) {
                await this.triggerAlert(event, rule, eventCount.count);

                // Reset counter after alert
                this.eventCounts.delete(key);
            }
        }
    }

    private getEventKey(event: SecurityEvent, rule: SecurityAlertRule): string {
        // Create a unique key based on event type and relevant identifiers
        const identifiers = [
            event.type,
            event.ipAddress,
            event.userId || 'anonymous'
        ].filter(Boolean);

        return identifiers.join(':');
    }

    private async triggerAlert(event: SecurityEvent, rule: SecurityAlertRule, count: number): Promise<void> {
        const alert: SecurityAlert = {
            id: generateEventId(),
            timestamp: new Date(),
            severity: rule.severity,
            eventType: event.type,
            message: `Security alert: ${count} ${event.type} events detected within ${rule.timeWindow} minutes`,
            triggeringEvent: event,
            count,
            timeWindow: rule.timeWindow,
            action: rule.action,
            metadata: {
                rule,
                ipAddress: event.ipAddress,
                userId: event.userId
            }
        };

        // Log the alert as a security event
        const alertEvent = createSecurityEvent({
            type: 'security_alert' as SecurityEventType,
            severity: alert.severity,
            message: alert.message,
            context: {} as Context, // Alert context
            metadata: alert.metadata
        });

        await this.auditManager.logEvent(alertEvent);

        // TODO: Implement actual alerting mechanisms
        // - Send email notifications
        // - Send Slack/Teams notifications
        // - Trigger incident response workflows
        // - Update security dashboards

        console.warn('🚨 SECURITY ALERT:', JSON.stringify(alert, null, 2));
    }

    // Clean up old event counts periodically
    cleanup(): void {
        const now = new Date();
        const maxAge = 60 * 60 * 1000; // 1 hour

        for (const [key, eventCount] of this.eventCounts.entries()) {
            if (now.getTime() - eventCount.firstSeen.getTime() > maxAge) {
                this.eventCounts.delete(key);
            }
        }
    }
}

// Global security monitor instance
let securityMonitor: SecurityMonitor | null = null;

/**
 * Initializes the security monitoring system
 */
export function initializeSecurityMonitoring(auditManager: AuditManager): void {
    securityMonitor = new SecurityMonitor(auditManager);

    // Set up periodic cleanup
    setInterval(() => {
        securityMonitor?.cleanup();
    }, 15 * 60 * 1000); // Every 15 minutes
}

/**
 * Gets the security monitor instance
 */
export function getSecurityMonitor(): SecurityMonitor | null {
    return securityMonitor;
}

// ============================================================================
// COMPLIANCE AUDIT TRAIL GENERATION
// ============================================================================

/**
 * Logs compliance-related events
 */
export async function logComplianceEvent(params: {
    context: Context;
    eventType: 'data_access' | 'data_modification' | 'data_deletion' | 'export' | 'retention_policy';
    entityType: string;
    entityId: string;
    userId?: string;
    details: Record<string, any>;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, eventType, entityType, entityId, userId, details, metadata } = params;

    const event = createSecurityEvent({
        type: 'compliance_event' as SecurityEventType,
        severity: 'low' as SecurityEventSeverity,
        message: `Compliance event: ${eventType} on ${entityType}`,
        context,
        metadata: {
            complianceEventType: eventType,
            entityType,
            entityId,
            userId,
            details,
            ...metadata
        }
    });

    await logSecurityEvent(event);
}

/**
 * Logs document signing events for compliance
 */
export async function logDocumentSigningCompliance(params: {
    context: Context;
    documentId: string;
    signingRequestId: string;
    recipientId: string;
    signatureData: Record<string, any>;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, documentId, signingRequestId, recipientId, signatureData, metadata } = params;

    await logComplianceEvent({
        context,
        eventType: 'data_modification',
        entityType: 'document',
        entityId: documentId,
        userId: context.get('userId'),
        details: {
            signingRequestId,
            recipientId,
            signatureTimestamp: new Date().toISOString(),
            signatureMethod: signatureData.type,
            ipAddress: getClientIP(context),
            userAgent: context.req.header('user-agent'),
            certificateInfo: signatureData.certificate
        },
        metadata
    });
}

/**
 * Logs data export events for compliance
 */
export async function logDataExportCompliance(params: {
    context: Context;
    exportType: string;
    entityIds: string[];
    format: string;
    metadata?: Record<string, any>;
}): Promise<void> {
    const { context, exportType, entityIds, format, metadata } = params;

    await logComplianceEvent({
        context,
        eventType: 'export',
        entityType: exportType,
        entityId: entityIds.join(','),
        userId: context.get('userId'),
        details: {
            exportFormat: format,
            entityCount: entityIds.length,
            exportTimestamp: new Date().toISOString()
        },
        metadata
    });
}

/**
 * Enhanced security event logging with monitoring
 */
export async function logSecurityEventWithMonitoring(event: SecurityEvent): Promise<void> {
    const monitor = getSecurityMonitor();

    if (monitor) {
        await monitor.processSecurityEvent(event);
    } else {
        // Fallback to basic logging
        await logSecurityEvent(event);
    }
}