import type { Context, Next } from 'hono';
import { z, ZodSchema } from 'zod';
import { HTTPException } from 'hono/http-exception';

/**
 * Enhanced request validation middleware factory with security features
 */
export function validateRequest<T extends ZodSchema>(schema: {
    body?: T;
    query?: T;
    params?: T;
    headers?: T;
}) {
    return async (c: Context, next: Next) => {
        try {
            // Validate request body
            if (schema.body) {
                const contentType = c.req.header('Content-Type') || '';

                // Ensure JSON content type for JSON validation
                if (!contentType.includes('application/json') && !contentType.includes('multipart/form-data')) {
                    throw new HTTPException(400, {
                        message: 'Invalid Content-Type. Expected application/json',
                        cause: { type: 'INVALID_CONTENT_TYPE', received: contentType }
                    });
                }

                const body = await c.req.json().catch(() => ({}));

                // Check for deeply nested objects (potential DoS)
                if (getObjectDepth(body) > 10) {
                    throw new HTTPException(400, {
                        message: 'Request body too deeply nested',
                        cause: { type: 'EXCESSIVE_NESTING' }
                    });
                }

                // Check for excessive array sizes
                if (hasLargeArrays(body, 1000)) {
                    throw new HTTPException(400, {
                        message: 'Request body contains arrays that are too large',
                        cause: { type: 'EXCESSIVE_ARRAY_SIZE' }
                    });
                }

                const validatedBody = schema.body.parse(body);
                c.set('validatedBody', validatedBody);
            }

            // Validate query parameters with size limits
            if (schema.query) {
                const url = new URL(c.req.url);
                const query = Object.fromEntries(url.searchParams.entries());

                // Limit number of query parameters
                if (Object.keys(query).length > 50) {
                    throw new HTTPException(400, {
                        message: 'Too many query parameters',
                        cause: { type: 'EXCESSIVE_QUERY_PARAMS', count: Object.keys(query).length }
                    });
                }

                // Validate individual parameter lengths
                for (const [key, value] of Object.entries(query)) {
                    if (key.length > 100 || value.length > 1000) {
                        throw new HTTPException(400, {
                            message: `Query parameter too long: ${key}`,
                            cause: { type: 'PARAMETER_TOO_LONG', parameter: key }
                        });
                    }
                }

                const validatedQuery = schema.query.parse(query);
                c.set('validatedQuery', validatedQuery);
            }

            // Validate path parameters
            if (schema.params) {
                const params = c.req.param();

                // Validate parameter lengths and formats
                for (const [key, value] of Object.entries(params)) {
                    if (typeof value === 'string') {
                        if (value.length > 100) {
                            throw new HTTPException(400, {
                                message: `Path parameter too long: ${key}`,
                                cause: { type: 'PARAMETER_TOO_LONG', parameter: key }
                            });
                        }

                        // Check for path traversal attempts
                        if (value.includes('..') || value.includes('/') || value.includes('\\')) {
                            throw new HTTPException(400, {
                                message: `Invalid characters in path parameter: ${key}`,
                                cause: { type: 'INVALID_PATH_PARAMETER', parameter: key }
                            });
                        }
                    }
                }

                const validatedParams = schema.params.parse(params);
                c.set('validatedParams', validatedParams);
            }

            // Validate headers with security checks
            if (schema.headers) {
                const headers = Object.fromEntries(
                    Object.entries(c.req.header()).map(([key, value]) => [key.toLowerCase(), value])
                );

                // Check for suspicious headers
                const suspiciousHeaders = ['x-forwarded-host', 'x-original-url', 'x-rewrite-url'];
                for (const suspiciousHeader of suspiciousHeaders) {
                    if (headers[suspiciousHeader]) {
                        console.warn('Suspicious header detected:', {
                            header: suspiciousHeader,
                            value: headers[suspiciousHeader],
                            ip: c.req.header('X-Forwarded-For') || 'unknown',
                            timestamp: new Date().toISOString()
                        });
                    }
                }

                const validatedHeaders = schema.headers.parse(headers);
                c.set('validatedHeaders', validatedHeaders);
            }

            await next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Enhanced error reporting with security context
                const validationErrors = error.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                    received: issue.received
                }));

                throw new HTTPException(400, {
                    message: 'Validation failed',
                    cause: {
                        type: 'VALIDATION_ERROR',
                        errors: validationErrors,
                        timestamp: new Date().toISOString()
                    }
                });
            }
            throw error;
        }
    };
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
    // Pagination
    pagination: z.object({
        page: z.string().transform(Number).pipe(z.number().min(1)).optional().default('1'),
        limit: z.string().transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
        sort: z.string().optional(),
        order: z.enum(['asc', 'desc']).optional().default('desc')
    }),

    // ID parameter
    idParam: z.object({
        id: z.string().min(1)
    }),

    // Organization ID parameter
    organizationIdParam: z.object({
        organizationId: z.string().min(1)
    }),

    // Date range query
    dateRange: z.object({
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional()
    }),

    // Search query
    search: z.object({
        q: z.string().min(1).optional(),
        filter: z.string().optional(),
        category: z.string().optional()
    }),

    // File upload validation
    fileUpload: z.object({
        filename: z.string().min(1),
        mimetype: z.string().min(1),
        size: z.number().min(1).max(50 * 1024 * 1024) // 50MB max
    }),

    // API key header
    apiKeyHeader: z.object({
        'x-api-key': z.string().min(1)
    }),

    // Content type validation
    jsonContentType: z.object({
        'content-type': z.string().includes('application/json')
    })
};

/**
 * Enhanced file upload validation with security checks
 */
export function validateFileUpload(
    allowedTypes: string[] = [],
    maxSize: number = 50 * 1024 * 1024,
    allowedExtensions: string[] = []
) {
    return validateRequest({
        body: z.object({
            filename: z.string()
                .min(1, 'Filename is required')
                .max(255, 'Filename too long')
                .refine(
                    (filename) => {
                        // Check for dangerous file extensions
                        const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
                        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
                        return !dangerousExtensions.includes(ext);
                    },
                    { message: 'File type not allowed for security reasons' }
                )
                .refine(
                    (filename) => {
                        // Check allowed extensions if specified
                        if (allowedExtensions.length === 0) return true;
                        const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
                        return allowedExtensions.includes(ext);
                    },
                    { message: `File extension must be one of: ${allowedExtensions.join(', ')}` }
                ),
            mimetype: z.string()
                .min(1, 'MIME type is required')
                .refine(
                    (type) => allowedTypes.length === 0 || allowedTypes.includes(type),
                    { message: `File type must be one of: ${allowedTypes.join(', ')}` }
                )
                .refine(
                    (type) => {
                        // Block dangerous MIME types
                        const dangerousMimeTypes = [
                            'application/x-executable',
                            'application/x-msdownload',
                            'application/x-msdos-program',
                            'text/javascript',
                            'application/javascript'
                        ];
                        return !dangerousMimeTypes.includes(type);
                    },
                    { message: 'MIME type not allowed for security reasons' }
                ),
            size: z.number()
                .min(1, 'File size must be greater than 0')
                .max(maxSize, `File size must be less than ${maxSize} bytes`)
        })
    });
}

/**
 * Validate email format
 */
export const emailSchema = z.string().email('Invalid email format');

/**
 * Validate password strength
 */
export const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character');

/**
 * Validate UUID format
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Validate URL format
 */
export const urlSchema = z.string().url('Invalid URL format');

// Helper functions for security validation

/**
 * Calculate the depth of nested objects
 */
function getObjectDepth(obj: any, depth: number = 0): number {
    if (typeof obj !== 'object' || obj === null) {
        return depth;
    }

    if (Array.isArray(obj)) {
        return Math.max(depth, ...obj.map(item => getObjectDepth(item, depth + 1)));
    }

    const depths = Object.values(obj).map(value => getObjectDepth(value, depth + 1));
    return depths.length > 0 ? Math.max(...depths) : depth;
}

/**
 * Check if object contains arrays larger than specified size
 */
function hasLargeArrays(obj: any, maxSize: number): boolean {
    if (Array.isArray(obj)) {
        if (obj.length > maxSize) {
            return true;
        }
        return obj.some(item => hasLargeArrays(item, maxSize));
    }

    if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(value => hasLargeArrays(value, maxSize));
    }

    return false;
}