import type { Context, Next } from 'hono';
import type Redis from 'ioredis';
import type {
    SecurityConfig,
    SecurityMiddleware,
    SecurityHeadersConfig,
    CorsConfig,
    RateLimitConfig,
    ValidationConfig,
    AuditConfig
} from './types';

import { createSecurityHeadersMiddleware, DEFAULT_SECURITY_HEADERS } from './headers';
import { createCorsMiddleware, DEFAULT_CORS_CONFIG } from './cors';
import { createRateLimitMiddleware, DEFAULT_RATE_LIMIT_CONFIG } from './rate-limit';
import { createValidationMiddleware, DEFAULT_VALIDATION_CONFIG } from './validation';
import { createAuditMiddleware, initializeAuditSystem, DEFAULT_AUDIT_CONFIG } from './audit';

// ============================================================================
// COMPREHENSIVE SECURITY MIDDLEWARE ORCHESTRATOR
// ============================================================================

/**
 * Default comprehensive security configuration
 */
export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
    headers: DEFAULT_SECURITY_HEADERS,
    cors: DEFAULT_CORS_CONFIG,
    rateLimit: DEFAULT_RATE_LIMIT_CONFIG,
    validation: DEFAULT_VALIDATION_CONFIG,
    audit: DEFAULT_AUDIT_CONFIG
};

/**
 * Security middleware factory
 */
export class SecurityMiddlewareFactory {
    private config: SecurityConfig;
    private redis?: Redis;

    constructor(config: Partial<SecurityConfig> = {}, redis?: Redis) {
        this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
        this.redis = redis;

        // Initialize audit system
        initializeAuditSystem(this.config.audit);
    }

    /**
     * Creates comprehensive security middleware stack
     */
    createSecurityStack(): SecurityMiddleware[] {
        const middlewares: SecurityMiddleware[] = [];

        // 1. Audit middleware (should be first to capture all requests)
        middlewares.push(createAuditMiddleware(this.config.audit));

        // 2. Security headers middleware
        middlewares.push(createSecurityHeadersMiddleware(this.config.headers));

        // 3. CORS middleware
        middlewares.push(createCorsMiddleware(this.config.cors));

        // 4. Rate limiting middleware
        middlewares.push(createRateLimitMiddleware(this.config.rateLimit, this.redis));

        // 5. Input validation middleware
        middlewares.push(createValidationMiddleware(this.config.validation));

        return middlewares;
    }

    /**
     * Creates a single combined security middleware
     */
    createCombinedMiddleware(): SecurityMiddleware {
        const middlewares = this.createSecurityStack();

        return async (c: Context, next: Next) => {
            // Execute middlewares in sequence
            let index = 0;

            const executeNext = async (): Promise<void> => {
                if (index < middlewares.length) {
                    const middleware = middlewares[index++];
                    await middleware(c, executeNext);
                } else {
                    await next();
                }
            };

            await executeNext();
        };
    }

    /**
     * Creates individual middleware components
     */
    createHeaders(): SecurityMiddleware {
        return createSecurityHeadersMiddleware(this.config.headers);
    }

    createCors(): SecurityMiddleware {
        return createCorsMiddleware(this.config.cors);
    }

    createRateLimit(): SecurityMiddleware {
        return createRateLimitMiddleware(this.config.rateLimit, this.redis);
    }

    createValidation(): SecurityMiddleware {
        return createValidationMiddleware(this.config.validation);
    }

    createAudit(): SecurityMiddleware {
        return createAuditMiddleware(this.config.audit);
    }
}

/**
 * Convenience function to create security middleware with default configuration
 */
export function createSecurityMiddleware(
    config: Partial<SecurityConfig> = {},
    redis?: Redis
): SecurityMiddleware {
    const factory = new SecurityMiddlewareFactory(config, redis);
    return factory.createCombinedMiddleware();
}

/**
 * Security configuration builder for different environments
 */
export class SecurityConfigBuilder {
    private config: Partial<SecurityConfig> = {};

    constructor() {
        this.config = { ...DEFAULT_SECURITY_CONFIG };
    }

    // Headers configuration
    headers(config: Partial<SecurityHeadersConfig>): this {
        this.config.headers = { ...this.config.headers, ...config };
        return this;
    }

    strictCSP(): this {
        if (this.config.headers) {
            this.config.headers.contentSecurityPolicy = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; media-src 'self'; object-src 'none'; child-src 'none'; frame-ancestors 'none'; form-action 'self'; base-uri 'self';";
        }
        return this;
    }

    // CORS configuration
    cors(config: Partial<CorsConfig>): this {
        this.config.cors = { ...this.config.cors, ...config };
        return this;
    }

    allowOrigins(origins: string[]): this {
        if (this.config.cors) {
            this.config.cors.origin = origins;
        }
        return this;
    }

    // Rate limiting configuration
    rateLimit(config: Partial<RateLimitConfig>): this {
        this.config.rateLimit = { ...this.config.rateLimit, ...config };
        return this;
    }

    rateLimitPerMinute(requests: number): this {
        if (this.config.rateLimit) {
            this.config.rateLimit.windowMs = 60 * 1000;
            this.config.rateLimit.maxRequests = requests;
        }
        return this;
    }

    // Validation configuration
    validation(config: Partial<ValidationConfig>): this {
        this.config.validation = { ...this.config.validation, ...config };
        return this;
    }

    maxBodySize(bytes: number): this {
        if (this.config.validation) {
            this.config.validation.maxBodySize = bytes;
        }
        return this;
    }

    // Audit configuration
    audit(config: Partial<AuditConfig>): this {
        this.config.audit = { ...this.config.audit, ...config };
        return this;
    }

    auditToFile(filePath?: string): this {
        if (this.config.audit) {
            this.config.audit.storage = 'file';
        }
        return this;
    }

    auditToDatabase(): this {
        if (this.config.audit) {
            this.config.audit.storage = 'database';
        }
        return this;
    }

    // Environment presets
    development(): this {
        return this
            .allowOrigins(['http://localhost:3000', 'http://localhost:3001'])
            .rateLimitPerMinute(1000)
            .audit({ logLevel: 'debug' });
    }

    production(allowedDomains: string[]): this {
        return this
            .strictCSP()
            .allowOrigins(allowedDomains)
            .rateLimitPerMinute(100)
            .maxBodySize(5 * 1024 * 1024) // 5MB
            .auditToDatabase();
    }

    testing(): this {
        return this
            .allowOrigins(['*'])
            .rateLimitPerMinute(10000)
            .audit({ enabled: false });
    }

    build(): SecurityConfig {
        return this.config as SecurityConfig;
    }
}

/**
 * Predefined security configurations for common scenarios
 */
export const SecurityPresets = {
    /**
     * Strict security configuration for production environments
     */
    strict: (): SecurityConfig => new SecurityConfigBuilder()
        .strictCSP()
        .rateLimitPerMinute(60)
        .maxBodySize(1024 * 1024) // 1MB
        .auditToDatabase()
        .build(),

    /**
     * Balanced security configuration for most applications
     */
    balanced: (): SecurityConfig => new SecurityConfigBuilder()
        .rateLimitPerMinute(100)
        .maxBodySize(5 * 1024 * 1024) // 5MB
        .build(),

    /**
     * Relaxed security configuration for development
     */
    relaxed: (): SecurityConfig => new SecurityConfigBuilder()
        .development()
        .build(),

    /**
     * API-focused security configuration
     */
    api: (): SecurityConfig => new SecurityConfigBuilder()
        .rateLimitPerMinute(1000)
        .maxBodySize(10 * 1024 * 1024) // 10MB
        .audit({ includeRequestBody: true, includeResponseBody: false })
        .build()
};

// Export all middleware creators for individual use
export {
    createSecurityHeadersMiddleware,
    createCorsMiddleware,
    createRateLimitMiddleware,
    createValidationMiddleware,
    createAuditMiddleware
};

// Export configuration defaults
export {
    DEFAULT_SECURITY_HEADERS,
    DEFAULT_CORS_CONFIG,
    DEFAULT_RATE_LIMIT_CONFIG,
    DEFAULT_VALIDATION_CONFIG,
    DEFAULT_AUDIT_CONFIG
};

// Export utility classes
export { CSPBuilder } from './headers';
export { CorsConfigBuilder } from './cors';
export { RateLimitConfigBuilder } from './rate-limit';
export { ValidationSchemaBuilder, InputSanitizer, CommonSchemas } from './validation';
export {
    initializeAuditSystem,
    getAuditManager,
    createSecurityEvent,
    logSecurityEvent,
    SecurityEventType,
    SecurityEventSeverity
} from './audit';