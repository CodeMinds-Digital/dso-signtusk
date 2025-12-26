import type { Context, Next } from 'hono';
import type { CorsConfig, SecurityMiddleware } from './types';
import { createSecurityEvent, SecurityEventType, SecurityEventSeverity } from './audit';

// ============================================================================
// CORS MIDDLEWARE IMPLEMENTATION
// ============================================================================

/**
 * Default CORS configuration for security
 */
export const DEFAULT_CORS_CONFIG: CorsConfig = {
    origin: false, // Deny all origins by default for security
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-Request-ID'
    ],
    exposedHeaders: [
        'X-Request-ID',
        'X-Rate-Limit-Limit',
        'X-Rate-Limit-Remaining',
        'X-Rate-Limit-Reset'
    ],
    credentials: false,
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204
};

/**
 * Creates CORS middleware with security-first configuration
 */
export function createCorsMiddleware(config: Partial<CorsConfig> = {}): SecurityMiddleware {
    const finalConfig = { ...DEFAULT_CORS_CONFIG, ...config };

    return async (c: Context, next: Next) => {
        const origin = c.req.header('Origin');
        const method = c.req.method;

        try {
            // Check if origin is allowed
            const originConfig = finalConfig.origin ?? false;
            const isOriginAllowed = checkOriginAllowed(origin, originConfig);

            if (!isOriginAllowed && origin) {
                // Log CORS violation
                const auditEvent = createSecurityEvent({
                    type: SecurityEventType.CORS_VIOLATION,
                    severity: SecurityEventSeverity.MEDIUM,
                    message: `CORS violation: Origin '${origin}' not allowed`,
                    context: c,
                    metadata: {
                        origin,
                        allowedOrigins: typeof finalConfig.origin === 'string'
                            ? finalConfig.origin
                            : Array.isArray(finalConfig.origin)
                                ? finalConfig.origin
                                : 'function'
                    }
                });

                const securityContext = c.get('security') || {};
                securityContext.auditEvent = auditEvent;
                securityContext.corsAllowed = false;
                c.set('security', securityContext);

                return c.json({ error: 'CORS policy violation' }, 403);
            }

            // Handle preflight requests
            if (method === 'OPTIONS') {
                return handlePreflightRequest(c, finalConfig, origin);
            }

            // Apply CORS headers for actual requests
            applyCorsHeaders(c, finalConfig, origin);

            // Store CORS status in security context
            const securityContext = c.get('security') || {};
            securityContext.corsAllowed = true;
            c.set('security', securityContext);

            await next();

        } catch (error) {
            // Log CORS processing error
            const auditEvent = createSecurityEvent({
                type: SecurityEventType.CORS_VIOLATION,
                severity: SecurityEventSeverity.HIGH,
                message: 'CORS processing error',
                context: c,
                metadata: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    origin
                }
            });

            const securityContext = c.get('security') || {};
            securityContext.auditEvent = auditEvent;
            securityContext.corsAllowed = false;
            c.set('security', securityContext);

            throw error;
        }
    };
}

/**
 * Checks if origin is allowed based on CORS configuration
 */
function checkOriginAllowed(
    origin: string | undefined,
    allowedOrigin: string | string[] | ((origin: string) => boolean) | boolean
): boolean {
    if (!origin) {
        return true; // Same-origin requests don't have Origin header
    }

    if (allowedOrigin === false) {
        return false;
    }

    if (allowedOrigin === true) {
        return true; // Allow all origins
    }

    if (typeof allowedOrigin === 'string') {
        return allowedOrigin === '*' || allowedOrigin === origin;
    }

    if (Array.isArray(allowedOrigin)) {
        return allowedOrigin.includes(origin) || allowedOrigin.includes('*');
    }

    if (typeof allowedOrigin === 'function') {
        return allowedOrigin(origin);
    }

    return false;
}

/**
 * Handles preflight OPTIONS requests
 */
function handlePreflightRequest(
    c: Context,
    config: CorsConfig,
    origin?: string
): Response {
    const requestMethod = c.req.header('Access-Control-Request-Method');
    const requestHeaders = c.req.header('Access-Control-Request-Headers');

    // Validate requested method
    if (requestMethod && config.methods && !config.methods.includes(requestMethod)) {
        return c.json({ error: 'Method not allowed by CORS policy' }, 405);
    }

    // Validate requested headers
    if (requestHeaders && config.allowedHeaders) {
        const headers = requestHeaders.split(',').map(h => h.trim().toLowerCase());
        const allowed = config.allowedHeaders.map(h => h.toLowerCase());

        const hasDisallowedHeader = headers.some(header => !allowed.includes(header));
        if (hasDisallowedHeader) {
            return c.json({ error: 'Headers not allowed by CORS policy' }, 400);
        }
    }

    // Apply preflight headers
    const response = new Response(null, { status: config.optionsSuccessStatus || 204 });

    if (origin && checkOriginAllowed(origin, config.origin ?? false)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
    }

    if (config.methods) {
        response.headers.set('Access-Control-Allow-Methods', config.methods.join(', '));
    }

    if (config.allowedHeaders) {
        response.headers.set('Access-Control-Allow-Headers', config.allowedHeaders.join(', '));
    }

    if (config.credentials) {
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    if (config.maxAge) {
        response.headers.set('Access-Control-Max-Age', config.maxAge.toString());
    }

    return response;
}

/**
 * Applies CORS headers to actual requests
 */
function applyCorsHeaders(c: Context, config: CorsConfig, origin?: string): void {
    if (origin && checkOriginAllowed(origin, config.origin ?? false)) {
        c.header('Access-Control-Allow-Origin', origin);
    }

    if (config.credentials) {
        c.header('Access-Control-Allow-Credentials', 'true');
    }

    if (config.exposedHeaders && config.exposedHeaders.length > 0) {
        c.header('Access-Control-Expose-Headers', config.exposedHeaders.join(', '));
    }

    // Add Vary header for proper caching
    const varyHeaders = ['Origin'];
    if (config.credentials) {
        varyHeaders.push('Access-Control-Request-Headers');
        varyHeaders.push('Access-Control-Request-Method');
    }
    c.header('Vary', varyHeaders.join(', '));
}

/**
 * Utility to create secure CORS configuration for different environments
 */
export class CorsConfigBuilder {
    private config: Partial<CorsConfig> = {};

    constructor() {
        this.config = { ...DEFAULT_CORS_CONFIG };
    }

    allowOrigin(origin: string | string[] | ((origin: string) => boolean)): this {
        this.config.origin = origin;
        return this;
    }

    allowMethods(methods: string[]): this {
        this.config.methods = methods;
        return this;
    }

    allowHeaders(headers: string[]): this {
        this.config.allowedHeaders = headers;
        return this;
    }

    exposeHeaders(headers: string[]): this {
        this.config.exposedHeaders = headers;
        return this;
    }

    allowCredentials(allow: boolean = true): this {
        this.config.credentials = allow;
        return this;
    }

    maxAge(seconds: number): this {
        this.config.maxAge = seconds;
        return this;
    }

    development(): this {
        return this.allowOrigin(['http://localhost:3000', 'http://localhost:3001'])
            .allowCredentials(true);
    }

    production(allowedDomains: string[]): this {
        return this.allowOrigin(allowedDomains)
            .allowCredentials(false);
    }

    build(): CorsConfig {
        return this.config as CorsConfig;
    }
}