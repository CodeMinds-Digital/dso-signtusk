import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

/**
 * SQL Injection Prevention Middleware
 * Detects and blocks potential SQL injection attempts
 */
export function sqlInjectionPrevention() {
    // Common SQL injection patterns
    const sqlInjectionPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
        /('|(\\')|(;)|(--)|(\s(OR|AND)\s+\d+\s*=\s*\d+))/i,
        /(\/\*|\*\/|@@|@)/,
        /(\b(WAITFOR|DELAY|SLEEP)\b)/i,
        /(\b(XP_|SP_)\w+)/i,
        /(INFORMATION_SCHEMA|SYSOBJECTS|SYSCOLUMNS)/i
    ];

    return async (c: Context, next: Next) => {
        try {
            // Check query parameters
            const url = new URL(c.req.url);
            for (const [key, value] of url.searchParams.entries()) {
                if (containsSqlInjection(value, sqlInjectionPatterns)) {
                    throw new HTTPException(400, {
                        message: `Potential SQL injection detected in query parameter: ${key}`,
                        cause: { type: 'SQL_INJECTION_ATTEMPT', parameter: key }
                    });
                }
            }

            // Check path parameters
            const pathParams = c.req.param();
            for (const [key, value] of Object.entries(pathParams)) {
                if (typeof value === 'string' && containsSqlInjection(value, sqlInjectionPatterns)) {
                    throw new HTTPException(400, {
                        message: `Potential SQL injection detected in path parameter: ${key}`,
                        cause: { type: 'SQL_INJECTION_ATTEMPT', parameter: key }
                    });
                }
            }

            // Check request body for POST/PUT/PATCH requests
            if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
                try {
                    const body = await c.req.json();
                    checkObjectForSqlInjection(body, sqlInjectionPatterns);
                } catch (error) {
                    // If JSON parsing fails, check raw text
                    try {
                        const text = await c.req.text();
                        if (containsSqlInjection(text, sqlInjectionPatterns)) {
                            throw new HTTPException(400, {
                                message: 'Potential SQL injection detected in request body',
                                cause: { type: 'SQL_INJECTION_ATTEMPT', location: 'body' }
                            });
                        }
                    } catch {
                        // If both fail, continue - might be binary data
                    }
                }
            }

            await next();
        } catch (error) {
            if (error instanceof HTTPException) {
                // Log security incident
                console.warn('SQL Injection attempt blocked:', {
                    ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown',
                    userAgent: c.req.header('User-Agent'),
                    path: c.req.path,
                    method: c.req.method,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
            throw new HTTPException(500, { message: 'Security validation error' });
        }
    };
}

/**
 * XSS Prevention Middleware
 * Sanitizes input to prevent cross-site scripting attacks
 */
export function xssPrevention() {
    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<img[^>]+src[^>]*>/gi,
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi
    ];

    return async (c: Context, next: Next) => {
        try {
            // Check query parameters
            const url = new URL(c.req.url);
            for (const [key, value] of url.searchParams.entries()) {
                if (containsXss(value, xssPatterns)) {
                    throw new HTTPException(400, {
                        message: `Potential XSS detected in query parameter: ${key}`,
                        cause: { type: 'XSS_ATTEMPT', parameter: key }
                    });
                }
            }

            // Check request body
            if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
                try {
                    const body = await c.req.json();
                    checkObjectForXss(body, xssPatterns);
                } catch {
                    // Continue if JSON parsing fails
                }
            }

            await next();
        } catch (error) {
            if (error instanceof HTTPException) {
                console.warn('XSS attempt blocked:', {
                    ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown',
                    userAgent: c.req.header('User-Agent'),
                    path: c.req.path,
                    method: c.req.method,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
            throw new HTTPException(500, { message: 'Security validation error' });
        }
    };
}

/**
 * Input Sanitization Middleware
 * Comprehensive input validation and sanitization
 */
export function inputSanitization() {
    return async (c: Context, next: Next) => {
        try {
            // Sanitize headers
            const sanitizedHeaders: Record<string, string> = {};
            for (const [key, value] of Object.entries(c.req.header())) {
                if (typeof value === 'string') {
                    sanitizedHeaders[key] = sanitizeString(value);
                }
            }

            // Sanitize query parameters
            const url = new URL(c.req.url);
            const sanitizedParams = new URLSearchParams();
            for (const [key, value] of url.searchParams.entries()) {
                sanitizedParams.set(sanitizeString(key), sanitizeString(value));
            }

            // Sanitize request body
            if (['POST', 'PUT', 'PATCH'].includes(c.req.method)) {
                try {
                    const body = await c.req.json();
                    const sanitizedBody = sanitizeObject(body);
                    c.set('sanitizedBody', sanitizedBody);
                } catch {
                    // Continue if JSON parsing fails
                }
            }

            await next();
        } catch (error) {
            throw new HTTPException(500, { message: 'Input sanitization error' });
        }
    };
}

/**
 * Security Headers Middleware
 * Enhanced security headers beyond Hono's default
 */
export function enhancedSecurityHeaders() {
    return async (c: Context, next: Next) => {
        // Content Security Policy
        c.header('Content-Security-Policy', [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self' data:",
            "connect-src 'self' https:",
            "media-src 'self'",
            "object-src 'none'",
            "child-src 'none'",
            "worker-src 'self'",
            "frame-ancestors 'none'",
            "form-action 'self'",
            "base-uri 'self'",
            "manifest-src 'self'"
        ].join('; '));

        // Additional security headers
        c.header('X-Content-Type-Options', 'nosniff');
        c.header('X-Frame-Options', 'DENY');
        c.header('X-XSS-Protection', '1; mode=block');
        c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
        c.header('Permissions-Policy', [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'accelerometer=()',
            'gyroscope=()'
        ].join(', '));

        // HSTS (only in production with HTTPS)
        if (process.env.NODE_ENV === 'production' && c.req.header('X-Forwarded-Proto') === 'https') {
            c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        // Remove server information
        c.header('Server', '');

        await next();
    };
}

/**
 * Request Size Limiting Middleware
 * Prevents large payload attacks
 */
export function requestSizeLimiting(maxSize: number = 10 * 1024 * 1024) { // 10MB default
    return async (c: Context, next: Next) => {
        const contentLength = c.req.header('Content-Length');

        if (contentLength) {
            const size = parseInt(contentLength, 10);
            if (size > maxSize) {
                throw new HTTPException(413, {
                    message: `Request entity too large. Maximum size is ${maxSize} bytes`,
                    cause: { type: 'REQUEST_TOO_LARGE', size, maxSize }
                });
            }
        }

        await next();
    };
}

/**
 * IP Whitelisting Middleware
 * Allows only specific IP addresses or ranges
 */
export function ipWhitelisting(allowedIPs: string[] = []) {
    return async (c: Context, next: Next) => {
        if (allowedIPs.length === 0) {
            await next();
            return;
        }

        const clientIP = c.req.header('X-Forwarded-For')?.split(',')[0].trim() ||
            c.req.header('X-Real-IP') ||
            c.env?.ip ||
            'unknown';

        const isAllowed = allowedIPs.some(allowedIP => {
            if (allowedIP.includes('/')) {
                // CIDR notation support (simplified)
                return isIPInCIDR(clientIP, allowedIP);
            }
            return clientIP === allowedIP;
        });

        if (!isAllowed) {
            throw new HTTPException(403, {
                message: 'Access denied from this IP address',
                cause: { type: 'IP_NOT_WHITELISTED', ip: clientIP }
            });
        }

        await next();
    };
}

/**
 * Threat Detection Middleware
 * Detects and blocks suspicious patterns
 */
export function threatDetection() {
    const suspiciousPatterns = [
        // Path traversal
        /\.\.[\/\\]/,
        // Command injection
        /[;&|`$(){}[\]]/,
        // File inclusion
        /(file|http|ftp|php|data):/i,
        // Null bytes
        /\x00/,
        // Excessive repeating characters (potential DoS)
        /(.)\1{100,}/
    ];

    return async (c: Context, next: Next) => {
        const path = c.req.path;
        const userAgent = c.req.header('User-Agent') || '';
        const referer = c.req.header('Referer') || '';

        // Check for suspicious patterns in path
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(path) || pattern.test(userAgent) || pattern.test(referer)) {
                console.warn('Threat detected:', {
                    ip: c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown',
                    userAgent,
                    path,
                    referer,
                    pattern: pattern.toString(),
                    timestamp: new Date().toISOString()
                });

                throw new HTTPException(400, {
                    message: 'Suspicious request pattern detected',
                    cause: { type: 'THREAT_DETECTED' }
                });
            }
        }

        await next();
    };
}

// Helper functions

function containsSqlInjection(value: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(value));
}

function containsXss(value: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(value));
}

function checkObjectForSqlInjection(obj: any, patterns: RegExp[], path: string = ''): void {
    if (typeof obj === 'string') {
        if (containsSqlInjection(obj, patterns)) {
            throw new HTTPException(400, {
                message: `Potential SQL injection detected in request body at path: ${path}`,
                cause: { type: 'SQL_INJECTION_ATTEMPT', path }
            });
        }
    } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            const newPath = path ? `${path}.${key}` : key;
            checkObjectForSqlInjection(value, patterns, newPath);
        }
    }
}

function checkObjectForXss(obj: any, patterns: RegExp[], path: string = ''): void {
    if (typeof obj === 'string') {
        if (containsXss(obj, patterns)) {
            throw new HTTPException(400, {
                message: `Potential XSS detected in request body at path: ${path}`,
                cause: { type: 'XSS_ATTEMPT', path }
            });
        }
    } else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            const newPath = path ? `${path}.${key}` : key;
            checkObjectForXss(value, patterns, newPath);
        }
    }
}

function sanitizeString(str: string): string {
    return str
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, '') // Remove event handlers
        .trim();
}

function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
    } else if (typeof obj === 'object' && obj !== null) {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[sanitizeString(key)] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}

function isIPInCIDR(ip: string, cidr: string): boolean {
    // Simplified CIDR check - in production, use a proper IP library
    const [network, prefixLength] = cidr.split('/');
    if (!prefixLength) return ip === network;

    // This is a simplified implementation
    // In production, use libraries like 'ip' or 'netmask'
    return ip.startsWith(network.split('.').slice(0, Math.floor(parseInt(prefixLength) / 8)).join('.'));
}