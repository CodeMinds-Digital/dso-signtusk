import type { Context, Next } from 'hono';
import { z } from 'zod';
import type { ValidationConfig, ValidationResult, ValidationError, SecurityMiddleware } from './types';
import { createSecurityEvent, SecurityEventType, SecurityEventSeverity } from './audit';

// ============================================================================
// INPUT VALIDATION AND SANITIZATION
// ============================================================================

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
    sanitizeInput: true,
    maxBodySize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data',
        'text/plain',
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
    ],
    customValidators: {}
};

/**
 * Common validation schemas
 */
export const CommonSchemas = {
    // Basic types
    email: z.string().email().max(254),
    password: z.string().min(8).max(128),
    uuid: z.string().uuid(),
    cuid: z.string().regex(/^c[a-z0-9]{24}$/),
    url: z.string().url().max(2048),

    // Security-focused schemas
    safeString: z.string().max(1000).regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/),
    alphanumeric: z.string().regex(/^[a-zA-Z0-9]+$/),
    filename: z.string().max(255).regex(/^[a-zA-Z0-9\-_. ]+$/),

    // Numeric validations
    positiveInt: z.number().int().positive(),
    nonNegativeInt: z.number().int().min(0),
    percentage: z.number().min(0).max(100),

    // Date validations
    futureDate: z.date().refine(date => date > new Date(), {
        message: "Date must be in the future"
    }),
    pastDate: z.date().refine(date => date < new Date(), {
        message: "Date must be in the past"
    }),

    // File validations
    fileSize: (maxBytes: number) => z.number().max(maxBytes),
    mimeType: (allowed: string[]) => z.string().refine(
        type => allowed.includes(type),
        { message: "File type not allowed" }
    )
};

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
    /**
     * Sanitizes string input to prevent XSS and injection attacks
     */
    static sanitizeString(input: string): string {
        return input
            .replace(/[<>]/g, '') // Remove potential HTML tags
            .replace(/['"]/g, '') // Remove quotes that could break SQL/JS
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+=/gi, '') // Remove event handlers
            .replace(/script/gi, '') // Remove script tags
            .trim();
    }

    /**
     * Sanitizes HTML content (basic implementation)
     */
    static sanitizeHtml(input: string): string {
        const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'];
        const tagRegex = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;

        return input.replace(tagRegex, (match, tagName) => {
            return allowedTags.includes(tagName.toLowerCase()) ? match : '';
        });
    }

    /**
     * Sanitizes SQL input to prevent injection
     */
    static sanitizeSql(input: string): string {
        return input
            .replace(/[';-]/g, '') // Remove SQL comment and statement terminators
            .replace(/--/g, '') // Remove SQL comments
            .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '') // Remove SQL keywords
            .trim();
    }

    /**
     * Sanitizes file paths to prevent directory traversal
     */
    static sanitizePath(input: string): string {
        return input
            .replace(/\.\./g, '') // Remove parent directory references
            .replace(/[<>:"|?*]/g, '') // Remove invalid filename characters
            .replace(/^\/+/, '') // Remove leading slashes
            .trim();
    }

    /**
     * Recursively sanitizes object properties
     */
    static sanitizeObject(obj: any): any {
        if (typeof obj === 'string') {
            return this.sanitizeString(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.sanitizeObject(item));
        }

        if (obj && typeof obj === 'object') {
            const sanitized: any = {};
            for (const [key, value] of Object.entries(obj)) {
                const sanitizedKey = this.sanitizeString(key);
                sanitized[sanitizedKey] = this.sanitizeObject(value);
            }
            return sanitized;
        }

        return obj;
    }
}

/**
 * Creates input validation middleware
 */
export function createValidationMiddleware(
    config: Partial<ValidationConfig> = {}
): SecurityMiddleware {
    const finalConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };

    return async (c: Context, next: Next) => {
        try {
            const contentType = c.req.header('content-type') || '';
            const contentLength = parseInt(c.req.header('content-length') || '0');

            // Validate content type
            if (contentType && finalConfig.allowedMimeTypes) {
                const mimeType = contentType.split(';')[0].trim();
                if (!finalConfig.allowedMimeTypes.includes(mimeType)) {
                    const auditEvent = createSecurityEvent({
                        type: SecurityEventType.VALIDATION_FAILURE,
                        severity: SecurityEventSeverity.MEDIUM,
                        message: `Invalid content type: ${mimeType}`,
                        context: c,
                        metadata: {
                            contentType: mimeType,
                            allowedTypes: finalConfig.allowedMimeTypes
                        }
                    });

                    const securityContext = c.get('security') || {};
                    securityContext.auditEvent = auditEvent;
                    c.set('security', securityContext);

                    return c.json({ error: 'Invalid content type' }, 400);
                }
            }

            // Validate content length
            if (finalConfig.maxBodySize && contentLength > finalConfig.maxBodySize) {
                const auditEvent = createSecurityEvent({
                    type: SecurityEventType.VALIDATION_FAILURE,
                    severity: SecurityEventSeverity.MEDIUM,
                    message: `Request body too large: ${contentLength} bytes`,
                    context: c,
                    metadata: {
                        contentLength,
                        maxAllowed: finalConfig.maxBodySize
                    }
                });

                const securityContext = c.get('security') || {};
                securityContext.auditEvent = auditEvent;
                c.set('security', securityContext);

                return c.json({ error: 'Request body too large' }, 413);
            }

            // Validate and sanitize request body if present
            if (c.req.method !== 'GET' && c.req.method !== 'HEAD') {
                const validationResult = await validateRequestBody(c, finalConfig);

                const securityContext = c.get('security') || {};
                securityContext.validationResult = validationResult;
                c.set('security', securityContext);

                if (!validationResult.isValid) {
                    const auditEvent = createSecurityEvent({
                        type: SecurityEventType.VALIDATION_FAILURE,
                        severity: SecurityEventSeverity.MEDIUM,
                        message: 'Request validation failed',
                        context: c,
                        metadata: {
                            errors: validationResult.errors
                        }
                    });

                    securityContext.auditEvent = auditEvent;
                    c.set('security', securityContext);

                    return c.json({
                        error: 'Validation failed',
                        details: validationResult.errors
                    }, 400);
                }
            }

            await next();

        } catch (error) {
            const auditEvent = createSecurityEvent({
                type: SecurityEventType.VALIDATION_FAILURE,
                severity: SecurityEventSeverity.HIGH,
                message: 'Validation middleware error',
                context: c,
                metadata: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            });

            const securityContext = c.get('security') || {};
            securityContext.auditEvent = auditEvent;
            c.set('security', securityContext);

            throw error;
        }
    };
}

/**
 * Validates request body against schemas
 */
async function validateRequestBody(
    c: Context,
    config: ValidationConfig
): Promise<ValidationResult> {
    try {
        const contentType = c.req.header('content-type') || '';

        if (contentType.includes('application/json')) {
            const body = await c.req.json();
            return validateJsonBody(body, config);
        }

        if (contentType.includes('application/x-www-form-urlencoded')) {
            const body = await c.req.parseBody();
            return validateFormBody(body, config);
        }

        // For other content types, perform basic sanitization
        if (config.sanitizeInput) {
            // Note: This is a simplified implementation
            // In practice, you'd want more sophisticated handling for different content types
            return {
                isValid: true,
                sanitizedData: null
            };
        }

        return { isValid: true };

    } catch (error) {
        return {
            isValid: false,
            errors: [{
                field: 'body',
                message: 'Invalid request body format',
                code: 'INVALID_FORMAT',
                value: error instanceof Error ? error.message : 'Unknown error'
            }]
        };
    }
}

/**
 * Validates JSON request body
 */
function validateJsonBody(body: any, config: ValidationConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // Basic structure validation
    if (typeof body !== 'object' || body === null) {
        errors.push({
            field: 'body',
            message: 'Request body must be a valid JSON object',
            code: 'INVALID_TYPE'
        });
        return { isValid: false, errors };
    }

    // Sanitize if configured
    let sanitizedData = body;
    if (config.sanitizeInput) {
        sanitizedData = InputSanitizer.sanitizeObject(body);

        // Log if sanitization changed the data
        if (JSON.stringify(body) !== JSON.stringify(sanitizedData)) {
            // This would be logged as a security event
        }
    }

    // Apply custom validators if configured
    if (config.customValidators) {
        for (const [field, schema] of Object.entries(config.customValidators)) {
            if (body[field] !== undefined) {
                const result = schema.safeParse(body[field]);
                if (!result.success) {
                    errors.push({
                        field,
                        message: result.error.errors[0]?.message || 'Validation failed',
                        code: 'CUSTOM_VALIDATION_FAILED',
                        value: body[field]
                    });
                }
            }
        }
    }

    return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        sanitizedData
    };
}

/**
 * Validates form data request body
 */
function validateFormBody(body: any, config: ValidationConfig): ValidationResult {
    const errors: ValidationError[] = [];

    // Sanitize form data if configured
    let sanitizedData = body;
    if (config.sanitizeInput) {
        sanitizedData = InputSanitizer.sanitizeObject(body);
    }

    return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined,
        sanitizedData
    };
}

/**
 * Validation schema builder utility
 */
export class ValidationSchemaBuilder {
    private schemas: Record<string, z.ZodSchema> = {};

    addSchema(field: string, schema: z.ZodSchema): this {
        this.schemas[field] = schema;
        return this;
    }

    email(field: string): this {
        return this.addSchema(field, CommonSchemas.email);
    }

    password(field: string): this {
        return this.addSchema(field, CommonSchemas.password);
    }

    uuid(field: string): this {
        return this.addSchema(field, CommonSchemas.uuid);
    }

    safeString(field: string, maxLength: number = 1000): this {
        return this.addSchema(field, z.string().max(maxLength).regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/));
    }

    build(): Record<string, z.ZodSchema> {
        return this.schemas;
    }
}