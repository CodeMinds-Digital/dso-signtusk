// ============================================================================
// DOCUSIGN ALTERNATIVE - COMPREHENSIVE SECURITY MIDDLEWARE
// ============================================================================

/**
 * Main exports for the security middleware package
 * 
 * This package provides OWASP-compliant security middleware including:
 * - Security headers with CSP, HSTS, and other protective headers
 * - CORS policy enforcement with configurable origins
 * - Rate limiting with Redis-backed token bucket algorithm
 * - Input validation and sanitization with Zod schemas
 * - Comprehensive security audit logging
 */

// Main middleware factory and orchestrator
export {
    SecurityMiddlewareFactory,
    createSecurityMiddleware,
    SecurityConfigBuilder,
    SecurityPresets
} from './middleware';

// Individual middleware creators
export {
    createSecurityHeadersMiddleware,
    createCorsMiddleware,
    createRateLimitMiddleware,
    createValidationMiddleware,
    createAuditMiddleware
} from './middleware';

// Security headers utilities
export {
    DEFAULT_SECURITY_HEADERS,
    CSPBuilder
} from './headers';

// CORS utilities
export {
    DEFAULT_CORS_CONFIG,
    CorsConfigBuilder
} from './cors';

// Rate limiting utilities
export {
    DEFAULT_RATE_LIMIT_CONFIG,
    RateLimitConfigBuilder
} from './rate-limit';

// Validation utilities
export {
    DEFAULT_VALIDATION_CONFIG,
    ValidationSchemaBuilder,
    InputSanitizer,
    CommonSchemas
} from './validation';

// Audit logging utilities
export {
    DEFAULT_AUDIT_CONFIG,
    initializeAuditSystem,
    getAuditManager,
    createSecurityEvent,
    logSecurityEvent,
    logAuthenticationSuccess,
    logAuthenticationFailure,
    logSuspiciousAuthActivity,
    logPasswordChange,
    logTwoFactorEvent,
    logSessionEvent,
    logAuthorizationFailure,
    logPrivilegeEscalation,
    logUnauthorizedAccess,
    logComplianceEvent,
    logDocumentSigningCompliance,
    logDataExportCompliance,
    logSecurityEventWithMonitoring,
    initializeSecurityMonitoring,
    getSecurityMonitor,
    SecurityEventType,
    SecurityEventSeverity
} from './audit';

// Comprehensive security audit service
export {
    SecurityAuditService,
    getSecurityAuditService,
    initializeSecurityAuditService
} from './audit-service';

// Security audit middleware
export {
    createSecurityAuditMiddleware,
    createAuthenticationAuditMiddleware,
    createAuthorizationAuditMiddleware,
    createSuspiciousActivityMiddleware,
    createComplianceAuditMiddleware
} from './audit-middleware';

// Type definitions
export type {
    SecurityConfig,
    SecurityHeadersConfig,
    CorsConfig,
    RateLimitConfig,
    ValidationConfig,
    AuditConfig,
    SecurityMiddleware,
    SecurityHeaders,
    RateLimitInfo,
    TokenBucket,
    SecurityEvent,
    AuthenticationEvent,
    AuthorizationEvent,
    SecurityAlert,
    ComplianceEvent,
    AuditQueryFilters,
    AuditReport,
    AuditSummary,
    SecurityMetrics,
    AlertRule,
    AlertCondition,
    ValidationResult,
    ValidationError,
    SecurityContext
} from './types';

// Default comprehensive configuration
export { DEFAULT_SECURITY_CONFIG } from './middleware';

// Advanced security features
export {
    AdvancedSecurityService,
    DEFAULT_ADVANCED_SECURITY_CONFIG,
    ThreatType,
    ThreatSeverity,
    IncidentStatus,
    VulnerabilityStatus
} from './advanced-security';

export type {
    AdvancedSecurityConfig,
    IPWhitelistingConfig,
    GeofencingConfig,
    ThreatDetectionConfig,
    BehavioralAnalysisConfig,
    IncidentResponseConfig,
    VulnerabilityScanningConfig,
    SecurityThreat,
    SecurityIncident,
    VulnerabilityReport,
    Vulnerability,
    BehavioralProfile,
    EscalationRule,
    SecurityPlaybook,
    NotificationChannel,
    VulnerabilityIntegration
} from './advanced-security';