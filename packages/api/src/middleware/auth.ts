import type { Context, Next } from 'hono';
import { HTTPException } from 'hono/http-exception';
import {
    APIAuthenticationOrchestrator,
    AuthenticationMethod,
    RequestContext
} from '@signtusk/auth';
import { createAPIContext } from '../context';

/**
 * Enhanced authentication middleware using the API Authentication Orchestrator
 */
export async function authMiddleware(c: Context, next: Next) {
    const apiContext = createAPIContext(c);
    c.set('apiContext', apiContext);

    // Get orchestrator from context (should be set up during app initialization)
    const orchestrator = c.get('authOrchestrator') as APIAuthenticationOrchestrator;

    if (!orchestrator) {
        throw new HTTPException(500, {
            message: 'Authentication system not properly configured'
        });
    }

    // Create request context
    const requestContext: RequestContext = {
        headers: Object.fromEntries(
            Object.entries(c.req.header()).map(([key, value]) => [key.toLowerCase(), value])
        ),
        ipAddress: c.req.header('X-Forwarded-For') ||
            c.req.header('X-Real-IP') ||
            c.env?.ip ||
            'unknown',
        userAgent: c.req.header('User-Agent'),
        path: c.req.path,
        method: c.req.method,
    };

    try {
        // Authenticate using the orchestrator
        const authResult = await orchestrator.authenticate(requestContext);

        if (!authResult.success) {
            if (authResult.rateLimitExceeded) {
                throw new HTTPException(429, {
                    message: authResult.blocked
                        ? 'You have been temporarily blocked due to excessive requests'
                        : 'Rate limit exceeded'
                });
            }

            throw new HTTPException(401, {
                message: authResult.error || 'Authentication failed'
            });
        }

        // Set authentication context based on method
        if (authResult.method === AuthenticationMethod.API_KEY) {
            const apiAuthContext = authResult.context as any;
            apiContext.apiKey = 'authenticated'; // Don't expose actual key
            apiContext.user = {
                id: apiAuthContext.userId,
                email: 'api@example.com', // API keys don't have email
                name: 'API User',
                organizationId: apiAuthContext.organizationId,
                emailVerified: true,
                roles: ['api_user']
            };
            apiContext.organizationId = apiAuthContext.organizationId;
        } else if (authResult.method === AuthenticationMethod.JWT_BEARER) {
            const jwtAuthContext = authResult.context as any;
            apiContext.user = {
                id: jwtAuthContext.userId,
                email: jwtAuthContext.email,
                name: jwtAuthContext.name,
                organizationId: jwtAuthContext.organizationId,
                emailVerified: true,
                roles: jwtAuthContext.roles
            };
            apiContext.organizationId = jwtAuthContext.organizationId;
        }

        await next();
    } catch (error) {
        if (error instanceof HTTPException) {
            throw error;
        }

        throw new HTTPException(500, {
            message: 'Authentication system error'
        });
    }
}

/**
 * Optional authentication middleware (doesn't throw on missing auth)
 */
export async function optionalAuthMiddleware(c: Context, next: Next) {
    const apiContext = createAPIContext(c);
    c.set('apiContext', apiContext);

    try {
        await authMiddleware(c, async () => { });
    } catch {
        // Continue without authentication
    }

    await next();
}

/**
 * Admin-only authentication middleware
 */
export async function adminAuthMiddleware(c: Context, next: Next) {
    await authMiddleware(c, async () => { });

    const apiContext = c.get('apiContext');
    if (!apiContext.user?.roles?.includes('admin')) {
        throw new HTTPException(403, {
            message: 'Admin access required'
        });
    }

    await next();
}