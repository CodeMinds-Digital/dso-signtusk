import type { Context, Next } from 'hono';
import type { SecurityMiddleware } from './types';
import { getSecurityAuditService } from './audit-service';
import { SecurityEventType, SecurityEventSeverity } from './types';

// ============================================================================
// SECURITY AUDIT MIDDLEWARE
// ============================================================================

/**
 * Middleware to automatically log authentication and authorization events
 */
export function createSecurityAuditMiddleware(): SecurityMiddleware {
    const auditService = getSecurityAuditService();

    return async (context: Context, next: Next) => {
        const startTime = Date.now();
        const requestId = context.get('requestId') || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Set request ID for tracking
        context.set('requestId', requestId);

        try {
            await next();

            // Log successful requests for sensitive endpoints
            const path = context.req.path;
            const method = context.req.method;
            const userId = context.get('userId');
            const statusCode = context.res.status;

            // Log data access for sensitive endpoints
            if (shouldLogDataAccess(path, method, statusCode)) {
                await logDataAccessEvent(context, auditService, path, method, userId);
            }

            // Log authentication success for auth endpoints
            if (isAuthEndpoint(path) && statusCode >= 200 && statusCode < 300) {
                await logAuthenticationEvent(context, auditService, path, method, userId);
            }

        } catch (error) {
            // Log security-related errors
            await logSecurityError(context, auditService, error, Date.now() - startTime);
            throw error;
        }
    };
}

/**
 * Middleware specifically for authentication endpoints
 */
export function createAuthenticationAuditMiddleware(): SecurityMiddleware {
    const auditService = getSecurityAuditService();

    return async (context: Context, next: Next) => {
        const path = context.req.path;
        const method = context.req.method;

        try {
            await next();

            const statusCode = context.res.status;
            const userId = context.get('userId');
            const email = context.get('userEmail');

            // Log based on endpoint and status
            if (path.includes('/login') || path.includes('/signin')) {
                if (statusCode >= 200 && statusCode < 300) {
                    await auditService.logLogin({
                        context,
                        userId: userId || 'unknown',
                        email: email || 'unknown',
                        authMethod: determineAuthMethod(context),
                        metadata: {
                            endpoint: path,
                            method,
                            statusCode
                        }
                    });
                } else {
                    await auditService.logLoginFailure({
                        context,
                        email: email || 'unknown',
                        reason: determineFailureReason(statusCode),
                        metadata: {
                            endpoint: path,
                            method,
                            statusCode
                        }
                    });
                }
            }

            if (path.includes('/logout') && statusCode >= 200 && statusCode < 300) {
                await auditService.logLogout({
                    context,
                    userId: userId || 'unknown',
                    sessionId: context.get('sessionId') || 'unknown',
                    reason: 'user_initiated',
                    metadata: {
                        endpoint: path,
                        method,
                        statusCode
                    }
                });
            }

        } catch (error) {
            // Log authentication errors
            const email = context.get('userEmail') || 'unknown';
            await auditService.logLoginFailure({
                context,
                email,
                reason: 'invalid_credentials',
                metadata: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    endpoint: path,
                    method
                }
            });
            throw error;
        }
    };
}

/**
 * Middleware for authorization events
 */
export function createAuthorizationAuditMiddleware(): SecurityMiddleware {
    const auditService = getSecurityAuditService();

    return async (context: Context, next: Next) => {
        try {
            await next();
        } catch (error) {
            // Check if this is an authorization error
            if (isAuthorizationError(error)) {
                const userId = context.get('userId');
                const path = context.req.path;
                const method = context.req.method;

                await auditService.logAuthorizationFailure({
                    context,
                    userId,
                    resource: path,
                    action: method,
                    reason: getAuthorizationErrorReason(error),
                    currentPermissions: context.get('userPermissions'),
                    metadata: {
                        error: error instanceof Error ? error.message : 'Unknown error'
                    }
                });
            }
            throw error;
        }
    };
}

/**
 * Middleware for suspicious activity detection
 */
export function createSuspiciousActivityMiddleware(): SecurityMiddleware {
    const auditService = getSecurityAuditService();
    const requestCounts = new Map<string, { count: number; firstRequest: Date }>();

    return async (context: Context, next: Next) => {
        const clientIP = getClientIP(context);
        const now = new Date();

        // Track request frequency per IP
        const key = clientIP;
        let requestData = requestCounts.get(key);

        if (!requestData) {
            requestData = { count: 1, firstRequest: now };
            requestCounts.set(key, requestData);
        } else {
            requestData.count++;

            // Check for rapid requests (more than 100 requests in 1 minute)
            const timeWindow = 60 * 1000; // 1 minute
            const timeDiff = now.getTime() - requestData.firstRequest.getTime();

            if (timeDiff < timeWindow && requestData.count > 100) {
                await auditService.logSuspiciousActivity({
                    context,
                    userId: context.get('userId'),
                    activityType: 'rapid_requests',
                    description: `Rapid requests detected: ${requestData.count} requests in ${Math.round(timeDiff / 1000)} seconds`,
                    riskScore: 7,
                    metadata: {
                        requestCount: requestData.count,
                        timeWindow: timeDiff,
                        requestsPerSecond: requestData.count / (timeDiff / 1000)
                    }
                });

                // Reset counter after logging
                requestCounts.delete(key);
            }
        }

        // Clean up old entries periodically
        if (Math.random() < 0.01) { // 1% chance to clean up
            const cutoff = now.getTime() - (5 * 60 * 1000); // 5 minutes ago
            for (const [ip, data] of requestCounts.entries()) {
                if (data.firstRequest.getTime() < cutoff) {
                    requestCounts.delete(ip);
                }
            }
        }

        await next();
    };
}

/**
 * Middleware for compliance data tracking
 */
export function createComplianceAuditMiddleware(): SecurityMiddleware {
    const auditService = getSecurityAuditService();

    return async (context: Context, next: Next) => {
        await next();

        const path = context.req.path;
        const method = context.req.method;
        const statusCode = context.res.status;
        const userId = context.get('userId');

        // Log data modifications for compliance
        if (shouldLogForCompliance(path, method, statusCode)) {
            const { dataType, entityId, modificationType } = extractComplianceInfo(path, method);

            if (dataType && entityId) {
                await auditService.logDataModification({
                    context,
                    userId: userId || 'anonymous',
                    dataType,
                    entityId,
                    modificationType,
                    metadata: {
                        endpoint: path,
                        method,
                        statusCode,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        }
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function shouldLogDataAccess(path: string, method: string, statusCode: number): boolean {
    // Log successful GET requests to sensitive endpoints
    if (method !== 'GET' || statusCode < 200 || statusCode >= 300) {
        return false;
    }

    const sensitiveEndpoints = [
        '/api/documents',
        '/api/users',
        '/api/organizations',
        '/api/templates',
        '/api/audit',
        '/api/reports'
    ];

    return sensitiveEndpoints.some(endpoint => path.startsWith(endpoint));
}

function isAuthEndpoint(path: string): boolean {
    const authEndpoints = [
        '/api/auth/login',
        '/api/auth/logout',
        '/api/auth/register',
        '/api/auth/verify',
        '/api/auth/reset-password',
        '/api/auth/2fa'
    ];

    return authEndpoints.some(endpoint => path.includes(endpoint));
}

function determineAuthMethod(context: Context): 'password' | 'oauth' | 'sso' | 'webauthn' {
    const path = context.req.path;

    if (path.includes('oauth')) return 'oauth';
    if (path.includes('sso')) return 'sso';
    if (path.includes('webauthn')) return 'webauthn';
    return 'password';
}

function determineFailureReason(statusCode: number): 'invalid_credentials' | 'account_locked' | 'account_disabled' | 'invalid_2fa' | 'expired_session' {
    switch (statusCode) {
        case 401: return 'invalid_credentials';
        case 423: return 'account_locked';
        case 403: return 'account_disabled';
        case 422: return 'invalid_2fa';
        case 419: return 'expired_session';
        default: return 'invalid_credentials';
    }
}

function isAuthorizationError(error: any): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('unauthorized') ||
            message.includes('forbidden') ||
            message.includes('access denied') ||
            message.includes('insufficient permissions');
    }
    return false;
}

function getAuthorizationErrorReason(error: any): string {
    if (error instanceof Error) {
        return error.message;
    }
    return 'Unknown authorization error';
}

function shouldLogForCompliance(path: string, method: string, statusCode: number): boolean {
    // Log successful modifications (POST, PUT, PATCH, DELETE)
    if (statusCode < 200 || statusCode >= 300) {
        return false;
    }

    const modificationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    return modificationMethods.includes(method);
}

function extractComplianceInfo(path: string, method: string): {
    dataType: string | null;
    entityId: string | null;
    modificationType: 'create' | 'update' | 'delete' | 'sign';
} {
    // Extract entity type and ID from path
    const pathParts = path.split('/').filter(Boolean);

    let dataType: string | null = null;
    let entityId: string | null = null;
    let modificationType: 'create' | 'update' | 'delete' | 'sign' = 'create';

    // Determine data type from path
    if (path.includes('/documents')) dataType = 'document';
    else if (path.includes('/users')) dataType = 'user';
    else if (path.includes('/organizations')) dataType = 'organization';
    else if (path.includes('/templates')) dataType = 'template';
    else if (path.includes('/signatures')) dataType = 'signature';

    // Extract entity ID (usually the last part of the path if it looks like an ID)
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && (lastPart.length > 10 || /^[a-f0-9-]+$/i.test(lastPart))) {
        entityId = lastPart;
    }

    // Determine modification type
    switch (method) {
        case 'POST':
            modificationType = path.includes('/sign') ? 'sign' : 'create';
            break;
        case 'PUT':
        case 'PATCH':
            modificationType = 'update';
            break;
        case 'DELETE':
            modificationType = 'delete';
            break;
    }

    return { dataType, entityId, modificationType };
}

async function logDataAccessEvent(
    context: Context,
    auditService: any,
    path: string,
    method: string,
    userId?: string
): Promise<void> {
    const { dataType, entityId } = extractComplianceInfo(path, method);

    if (dataType && userId) {
        await auditService.logDataAccess({
            context,
            userId,
            dataType,
            entityId: entityId || 'unknown',
            accessType: 'read',
            metadata: {
                endpoint: path,
                method
            }
        });
    }
}

async function logAuthenticationEvent(
    context: Context,
    auditService: any,
    path: string,
    method: string,
    userId?: string
): Promise<void> {
    // This is handled by the authentication audit middleware
    // This function is kept for consistency but may not be needed
}

async function logSecurityError(
    context: Context,
    auditService: any,
    error: any,
    processingTime: number
): Promise<void> {
    await auditService.logSuspiciousActivity({
        context,
        userId: context.get('userId'),
        activityType: 'rapid_requests',
        description: `Request processing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        riskScore: 3,
        metadata: {
            error: error instanceof Error ? error.message : 'Unknown error',
            processingTime,
            stack: error instanceof Error ? error.stack : undefined
        }
    });
}

function getClientIP(context: Context): string {
    const headers = [
        'x-forwarded-for',
        'x-real-ip',
        'x-client-ip',
        'cf-connecting-ip',
        'x-cluster-client-ip'
    ];

    for (const header of headers) {
        const value = context.req.header(header);
        if (value) {
            return value.split(',')[0].trim();
        }
    }

    return 'unknown';
}