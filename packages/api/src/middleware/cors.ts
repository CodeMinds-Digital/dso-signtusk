import type { Context, Next } from 'hono';

/**
 * CORS configuration interface
 */
interface CORSConfig {
    origin?: string | string[] | ((origin: string) => string | null);
    allowMethods?: string[];
    allowHeaders?: string[];
    exposeHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}

/**
 * Create CORS middleware with configuration
 */
export function createCORSMiddleware(config: CORSConfig = {}) {
    const {
        origin = '*',
        allowMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders = [
            'Content-Type',
            'Authorization',
            'X-API-Key',
            'X-Requested-With',
            'Accept',
            'Origin'
        ],
        exposeHeaders = [
            'X-RateLimit-Limit',
            'X-RateLimit-Remaining',
            'X-RateLimit-Reset'
        ],
        credentials = true,
        maxAge = 86400 // 24 hours
    } = config;

    return async (c: Context, next: Next) => {
        const requestOrigin = c.req.header('Origin');

        // Determine allowed origin
        let allowedOrigin: string | null = null;

        if (typeof origin === 'string') {
            allowedOrigin = origin;
        } else if (Array.isArray(origin)) {
            allowedOrigin = requestOrigin && origin.includes(requestOrigin) ? requestOrigin : null;
        } else if (typeof origin === 'function') {
            allowedOrigin = requestOrigin ? origin(requestOrigin) : null;
        }

        // Set CORS headers
        if (allowedOrigin) {
            c.header('Access-Control-Allow-Origin', allowedOrigin);
        }

        if (credentials) {
            c.header('Access-Control-Allow-Credentials', 'true');
        }

        c.header('Access-Control-Allow-Methods', allowMethods.join(', '));
        c.header('Access-Control-Allow-Headers', allowHeaders.join(', '));

        if (exposeHeaders.length > 0) {
            c.header('Access-Control-Expose-Headers', exposeHeaders.join(', '));
        }

        c.header('Access-Control-Max-Age', maxAge.toString());

        // Handle preflight requests
        if (c.req.method === 'OPTIONS') {
            return c.text('', 204);
        }

        await next();
    };
}

/**
 * Enhanced CORS validation with security logging
 */
function validateOrigin(origin: string): string | null {
    // Allow requests from development and production domains
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173', // Vite dev server
        'https://app.docusign-alternative.com',
        'https://docusign-alternative.com',
        'https://api.docusign-alternative.com'
    ];

    if (!origin) {
        // Allow requests without origin (e.g., mobile apps, Postman)
        return null;
    }

    if (allowedOrigins.includes(origin)) {
        return origin;
    }

    // Allow subdomains in production with validation
    if (origin.endsWith('.docusign-alternative.com')) {
        // Validate subdomain format
        const subdomain = origin.replace(/^https?:\/\//, '').replace('.docusign-alternative.com', '');
        if (/^[a-z0-9-]+$/.test(subdomain) && subdomain.length <= 63) {
            return origin;
        }
    }

    // Log blocked origins for security monitoring
    console.warn('CORS: Blocked origin', {
        origin,
        timestamp: new Date().toISOString(),
        type: 'CORS_VIOLATION'
    });

    return null;
}

/**
 * Default CORS middleware for API with enhanced security
 */
export const corsMiddleware = createCORSMiddleware({
    origin: validateOrigin,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-Request-ID',
        'X-Client-Version'
    ],
    exposeHeaders: [
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'X-RateLimit-Policy',
        'X-RateLimit-Bypass',
        'Retry-After',
        'X-Request-ID',
        'X-Response-Time'
    ],
    credentials: true,
    maxAge: 86400 // 24 hours
});

/**
 * Strict CORS middleware for sensitive endpoints
 */
export const strictCorsMiddleware = createCORSMiddleware({
    origin: (origin) => {
        // Only allow specific production domains for sensitive endpoints
        const strictOrigins = [
            'https://app.docusign-alternative.com',
            'https://docusign-alternative.com'
        ];

        if (process.env.NODE_ENV === 'development') {
            strictOrigins.push('http://localhost:3000', 'http://localhost:3001');
        }

        return origin && strictOrigins.includes(origin) ? origin : null;
    },
    allowMethods: ['POST', 'PUT', 'PATCH', 'DELETE'], // No GET for sensitive operations
    allowHeaders: [
        'Content-Type',
        'Authorization',
        'X-API-Key',
        'X-Requested-With'
    ],
    credentials: true,
    maxAge: 3600 // 1 hour (shorter for sensitive endpoints)
});