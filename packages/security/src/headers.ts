import type { Context, Next } from 'hono';
import type { SecurityHeadersConfig, SecurityHeaders, SecurityMiddleware } from './types';
import { createSecurityEvent, SecurityEventType, SecurityEventSeverity } from './audit';

// ============================================================================
// OWASP COMPLIANT SECURITY HEADERS
// ============================================================================

/**
 * Default OWASP-compliant security headers configuration
 */
export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
    contentSecurityPolicy: [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "media-src 'self'",
        "object-src 'none'",
        "child-src 'self'",
        "frame-ancestors 'none'",
        "form-action 'self'",
        "base-uri 'self'",
        "upgrade-insecure-requests"
    ].join('; '),

    strictTransportSecurity: 'max-age=31536000; includeSubDomains; preload',

    xFrameOptions: 'DENY',

    xContentTypeOptions: true,

    referrerPolicy: 'strict-origin-when-cross-origin',

    permissionsPolicy: [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'interest-cohort=()',
        'payment=()',
        'usb=()'
    ].join(', '),

    crossOriginEmbedderPolicy: 'require-corp',

    crossOriginOpenerPolicy: 'same-origin',

    crossOriginResourcePolicy: 'same-origin'
};

/**
 * Creates security headers middleware with OWASP compliance
 */
export function createSecurityHeadersMiddleware(
    config: Partial<SecurityHeadersConfig> = {}
): SecurityMiddleware {
    const finalConfig = { ...DEFAULT_SECURITY_HEADERS, ...config };

    return async (c: Context, next: Next) => {
        try {
            // Apply security headers
            const headers = buildSecurityHeaders(finalConfig);

            Object.entries(headers).forEach(([key, value]) => {
                if (value !== undefined) {
                    c.header(key, value);
                }
            });

            // Store security headers in context for audit logging
            const securityContext = c.get('security') || {};
            securityContext.securityHeaders = headers;
            c.set('security', securityContext);

            await next();

            // Log successful security header application
            const auditEvent = createSecurityEvent({
                type: SecurityEventType.SECURITY_HEADER_VIOLATION,
                severity: SecurityEventSeverity.LOW,
                message: 'Security headers applied successfully',
                context: c,
                metadata: { appliedHeaders: Object.keys(headers) }
            });

            // Store audit event in context
            securityContext.auditEvent = auditEvent;
            c.set('security', securityContext);

        } catch (error) {
            // Log security header application failure
            const auditEvent = createSecurityEvent({
                type: SecurityEventType.SECURITY_HEADER_VIOLATION,
                severity: SecurityEventSeverity.HIGH,
                message: 'Failed to apply security headers',
                context: c,
                metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
            });

            const securityContext = c.get('security') || {};
            securityContext.auditEvent = auditEvent;
            c.set('security', securityContext);

            throw error;
        }
    };
}

/**
 * Builds security headers object from configuration
 */
function buildSecurityHeaders(config: SecurityHeadersConfig): SecurityHeaders {
    const headers: SecurityHeaders = {};

    if (config.contentSecurityPolicy) {
        headers['Content-Security-Policy'] = config.contentSecurityPolicy;
    }

    if (config.strictTransportSecurity) {
        headers['Strict-Transport-Security'] = config.strictTransportSecurity;
    }

    if (config.xFrameOptions) {
        headers['X-Frame-Options'] = config.xFrameOptions;
    }

    if (config.xContentTypeOptions) {
        headers['X-Content-Type-Options'] = 'nosniff';
    }

    if (config.referrerPolicy) {
        headers['Referrer-Policy'] = config.referrerPolicy;
    }

    if (config.permissionsPolicy) {
        headers['Permissions-Policy'] = config.permissionsPolicy;
    }

    if (config.crossOriginEmbedderPolicy) {
        headers['Cross-Origin-Embedder-Policy'] = config.crossOriginEmbedderPolicy;
    }

    if (config.crossOriginOpenerPolicy) {
        headers['Cross-Origin-Opener-Policy'] = config.crossOriginOpenerPolicy;
    }

    if (config.crossOriginResourcePolicy) {
        headers['Cross-Origin-Resource-Policy'] = config.crossOriginResourcePolicy;
    }

    return headers;
}

/**
 * Validates that required security headers are present in response
 */
export function validateSecurityHeaders(headers: Record<string, string>): {
    isValid: boolean;
    missingHeaders: string[];
    recommendations: string[];
} {
    const requiredHeaders = [
        'Content-Security-Policy',
        'X-Frame-Options',
        'X-Content-Type-Options',
        'Referrer-Policy'
    ];

    const recommendedHeaders = [
        'Strict-Transport-Security',
        'Permissions-Policy',
        'Cross-Origin-Embedder-Policy',
        'Cross-Origin-Opener-Policy'
    ];

    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    const missingRecommended = recommendedHeaders.filter(header => !headers[header]);

    return {
        isValid: missingHeaders.length === 0,
        missingHeaders,
        recommendations: missingRecommended
    };
}

/**
 * Content Security Policy builder utility
 */
export class CSPBuilder {
    private directives: Record<string, string[]> = {};

    constructor() {
        // Set secure defaults
        this.directive('default-src', ["'self'"]);
        this.directive('object-src', ["'none'"]);
        this.directive('base-uri', ["'self'"]);
        this.directive('frame-ancestors', ["'none'"]);
    }

    directive(name: string, values: string[]): this {
        this.directives[name] = values;
        return this;
    }

    addSource(directive: string, source: string): this {
        if (!this.directives[directive]) {
            this.directives[directive] = [];
        }
        if (!this.directives[directive].includes(source)) {
            this.directives[directive].push(source);
        }
        return this;
    }

    allowInlineScripts(): this {
        return this.addSource('script-src', "'unsafe-inline'");
    }

    allowInlineStyles(): this {
        return this.addSource('style-src', "'unsafe-inline'");
    }

    allowEval(): this {
        return this.addSource('script-src', "'unsafe-eval'");
    }

    upgradeInsecureRequests(): this {
        this.directives['upgrade-insecure-requests'] = [];
        return this;
    }

    build(): string {
        return Object.entries(this.directives)
            .map(([directive, sources]) => {
                if (sources.length === 0) {
                    return directive;
                }
                return `${directive} ${sources.join(' ')}`;
            })
            .join('; ');
    }
}