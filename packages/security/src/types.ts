import type { Context, Next } from 'hono';
import type { z } from 'zod';

// ============================================================================
// SECURITY CONFIGURATION TYPES
// ============================================================================

export interface SecurityConfig {
    headers: SecurityHeadersConfig;
    cors: CorsConfig;
    rateLimit: RateLimitConfig;
    validation: ValidationConfig;
    audit: AuditConfig;
}

export interface SecurityHeadersConfig {
    contentSecurityPolicy?: string;
    strictTransportSecurity?: string;
    xFrameOptions?: string;
    xContentTypeOptions?: boolean;
    referrerPolicy?: string;
    permissionsPolicy?: string;
    crossOriginEmbedderPolicy?: string;
    crossOriginOpenerPolicy?: string;
    crossOriginResourcePolicy?: string;
}

export interface CorsConfig {
    origin?: string | string[] | ((origin: string) => boolean) | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
}

export interface RateLimitConfig {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (c: Context) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    onLimitReached?: (c: Context) => void;
    store?: 'redis' | 'memory';
    redisConfig?: {
        host: string;
        port: number;
        password?: string;
        db?: number;
    };
}

export interface ValidationConfig {
    sanitizeInput?: boolean;
    maxBodySize?: number;
    allowedMimeTypes?: string[];
    customValidators?: Record<string, z.ZodSchema>;
}

export interface AuditConfig {
    enabled?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    includeRequestBody?: boolean;
    includeResponseBody?: boolean;
    sensitiveFields?: string[];
    storage?: 'console' | 'file' | 'database';
}

// ============================================================================
// MIDDLEWARE TYPES
// ============================================================================

export type SecurityMiddleware = (c: Context, next: Next) => Promise<void | Response>;

export interface SecurityHeaders {
    'Content-Security-Policy'?: string;
    'Strict-Transport-Security'?: string;
    'X-Frame-Options'?: string;
    'X-Content-Type-Options'?: string;
    'Referrer-Policy'?: string;
    'Permissions-Policy'?: string;
    'Cross-Origin-Embedder-Policy'?: string;
    'Cross-Origin-Opener-Policy'?: string;
    'Cross-Origin-Resource-Policy'?: string;
}

// ============================================================================
// RATE LIMITING TYPES
// ============================================================================

export interface RateLimitInfo {
    limit: number;
    remaining: number;
    reset: number;
    retryAfter?: number;
}

export interface TokenBucket {
    tokens: number;
    lastRefill: number;
    capacity: number;
    refillRate: number;
}

// ============================================================================
// AUDIT LOGGING TYPES
// ============================================================================

export interface SecurityEvent {
    id: string;
    timestamp: Date;
    type: SecurityEventType;
    severity: SecurityEventSeverity;
    source: string;
    userId?: string;
    organizationId?: string;
    ipAddress: string;
    userAgent: string;
    requestId: string;
    path: string;
    method: string;
    statusCode?: number;
    message: string;
    metadata?: Record<string, any>;
}

export enum SecurityEventType {
    // Authentication Events
    AUTHENTICATION_SUCCESS = 'authentication_success',
    AUTHENTICATION_FAILURE = 'authentication_failure',
    PASSWORD_CHANGE = 'password_change',
    TWO_FACTOR_AUTH = 'two_factor_auth',
    SESSION_MANAGEMENT = 'session_management',

    // Authorization Events
    AUTHORIZATION_FAILURE = 'authorization_failure',
    PRIVILEGE_ESCALATION = 'privilege_escalation',
    UNAUTHORIZED_ACCESS = 'unauthorized_access',

    // Security Events
    RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
    VALIDATION_FAILURE = 'validation_failure',
    SUSPICIOUS_ACTIVITY = 'suspicious_activity',
    SECURITY_HEADER_VIOLATION = 'security_header_violation',
    CORS_VIOLATION = 'cors_violation',
    INPUT_SANITIZATION = 'input_sanitization',
    MALICIOUS_REQUEST = 'malicious_request',
    SECURITY_ALERT = 'security_alert',

    // Compliance Events
    COMPLIANCE_EVENT = 'compliance_event',
    DATA_ACCESS = 'data_access',
    DATA_MODIFICATION = 'data_modification',
    DATA_DELETION = 'data_deletion',
    DATA_EXPORT = 'data_export'
}

export enum SecurityEventSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
    isValid: boolean;
    errors?: ValidationError[];
    sanitizedData?: any;
}

export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
}

// ============================================================================
// SECURITY CONTEXT TYPES
// ============================================================================

export interface SecurityContext {
    rateLimitInfo?: RateLimitInfo;
    validationResult?: ValidationResult;
    auditEvent?: SecurityEvent;
    securityHeaders?: SecurityHeaders;
    corsAllowed?: boolean;
}

// ============================================================================
// ENHANCED SECURITY EVENT TYPES
// ============================================================================

export interface AuthenticationEvent extends SecurityEvent {
    authMethod: string;
    failureReason?: string;
    twoFactorEnabled?: boolean;
}

export interface AuthorizationEvent extends SecurityEvent {
    resource: string;
    action: string;
    currentRole?: string;
    requiredRole?: string;
    failureReason: string;
}

export interface SecurityAlert {
    id: string;
    timestamp: Date;
    severity: SecurityEventSeverity;
    eventType: SecurityEventType;
    message: string;
    triggeringEvent: SecurityEvent;
    count: number;
    timeWindow: number;
    action: 'log' | 'alert' | 'block';
    metadata?: Record<string, any>;
}

export interface ComplianceEvent extends SecurityEvent {
    complianceEventType: 'data_access' | 'data_modification' | 'data_deletion' | 'export' | 'retention_policy';
    entityType: string;
    entityId: string;
    details: Record<string, any>;
}

// ============================================================================
// AUDIT QUERY AND REPORTING TYPES
// ============================================================================

export interface AuditQueryFilters {
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

export interface AuditReport {
    id: string;
    title: string;
    description?: string;
    filters: AuditQueryFilters;
    events: SecurityEvent[];
    summary: AuditSummary;
    generatedAt: Date;
    generatedBy: string;
}

export interface AuditSummary {
    totalEvents: number;
    eventsByType: Record<SecurityEventType, number>;
    eventsBySeverity: Record<SecurityEventSeverity, number>;
    uniqueUsers: number;
    uniqueIPs: number;
    timeRange: {
        start: Date;
        end: Date;
    };
}

// ============================================================================
// ALERTING AND MONITORING TYPES
// ============================================================================

export interface AlertRule {
    id: string;
    name: string;
    description?: string;
    eventType: SecurityEventType;
    threshold: number;
    timeWindow: number; // in minutes
    severity: SecurityEventSeverity;
    action: 'log' | 'alert' | 'block';
    conditions?: AlertCondition[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface AlertCondition {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
    value: string | number;
}

export interface SecurityMetrics {
    authenticationFailures: number;
    authorizationFailures: number;
    suspiciousActivities: number;
    rateLimitExceeded: number;
    activeAlerts: number;
    uniqueThreats: number;
    timeRange: {
        start: Date;
        end: Date;
    };
}

declare module 'hono' {
    interface ContextVariableMap {
        security: SecurityContext;
    }
}