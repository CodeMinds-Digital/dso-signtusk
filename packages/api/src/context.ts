import type { Context } from 'hono';

// Simple User interface for testing
interface User {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    emailVerified: boolean;
    roles: string[];
}

/**
 * API Context interface extending Hono context
 */
export interface APIContext {
    user?: User;
    organizationId?: string;
    apiKey?: string;
    requestId: string;
    startTime: number;
    clientIP: string;
    userAgent: string;
}

/**
 * Create API context from Hono context
 */
export function createAPIContext(c: Context): APIContext {
    const requestId = c.req.header('X-Request-ID') || generateRequestId();
    const startTime = Date.now();
    const clientIP = c.req.header('X-Forwarded-For') ||
        c.req.header('X-Real-IP') ||
        c.env?.ip ||
        'unknown';
    const userAgent = c.req.header('User-Agent') || 'unknown';

    return {
        requestId,
        startTime,
        clientIP,
        userAgent,
        // These will be populated by auth middleware
        user: undefined,
        organizationId: undefined,
        apiKey: undefined
    };
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extend Hono context with API context
 */
declare module 'hono' {
    interface ContextVariableMap {
        apiContext: APIContext;
    }
}