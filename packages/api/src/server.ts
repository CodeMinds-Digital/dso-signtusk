import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { secureHeaders } from 'hono/secure-headers';

import { apiRouter } from './router';
import { createAPIContext } from './context';
import { errorHandler } from './middleware/error-handler';
import {
    createDefaultRateLimitMiddleware,
    createAuthRateLimitMiddleware,
    createApiKeyRateLimitMiddleware,
    createUserRateLimitMiddleware,
    createOrganizationRateLimitMiddleware
} from './middleware/rate-limit';
import { authMiddleware } from './middleware/auth';
import { monitoringMiddleware } from './middleware/monitoring';
import { corsMiddleware, strictCorsMiddleware } from './middleware/cors';
import {
    sqlInjectionPrevention,
    xssPrevention,
    inputSanitization,
    enhancedSecurityHeaders,
    requestSizeLimiting,
    ipWhitelisting,
    threatDetection
} from './middleware/security';
import {
    createCacheMiddleware,
    createPredefinedCacheMiddleware,
    CacheInvalidationService,
    CacheConfigurations
} from './middleware/cache';
import { initializeCacheEventManager } from './cache/events';
import { createCDNService, createCDNMiddleware } from './cache/cdn';
import { openAPISpec } from './openapi/spec';
import { RedisCacheService, InMemoryCacheService } from '@signtusk/cache';

/**
 * Create comprehensive REST API server with OpenAPI documentation
 */
export function createAPIServer() {
    const app = new OpenAPIHono();

    // Initialize cache service (Redis in production, in-memory for development)
    const cacheService = process.env.NODE_ENV === 'production'
        ? new RedisCacheService({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            keyPrefix: 'docusign-alt:api:',
        })
        : new InMemoryCacheService();

    // Initialize cache invalidation service
    const cacheInvalidationService = new CacheInvalidationService(cacheService);

    // Initialize cache event manager
    const cacheEventManager = initializeCacheEventManager(cacheInvalidationService);

    // Initialize CDN service
    const cdnService = createCDNService();

    // Create cache middleware instances
    const staticCacheMiddleware = createPredefinedCacheMiddleware(cacheService, 'static');
    const userCacheMiddleware = createPredefinedCacheMiddleware(cacheService, 'userSpecific');
    const orgCacheMiddleware = createPredefinedCacheMiddleware(cacheService, 'organizationSpecific');
    const publicApiCacheMiddleware = createPredefinedCacheMiddleware(cacheService, 'publicApi');
    const templatesCacheMiddleware = createPredefinedCacheMiddleware(cacheService, 'templates');
    const documentsCacheMiddleware = createPredefinedCacheMiddleware(cacheService, 'documents');

    // Create CDN middleware
    const cdnMiddleware = createCDNMiddleware(cdnService);

    // Create rate limiting middleware instances
    const defaultRateLimit = createDefaultRateLimitMiddleware(cacheService);
    const authRateLimit = createAuthRateLimitMiddleware(cacheService);
    const apiKeyRateLimit = createApiKeyRateLimitMiddleware(cacheService);
    const userRateLimit = createUserRateLimitMiddleware(cacheService);
    const orgRateLimit = createOrganizationRateLimitMiddleware(cacheService);

    // Global middleware - order matters for security
    app.use('*', logger());
    app.use('*', prettyJSON());

    // Enhanced security headers (must be early in the chain)
    app.use('*', enhancedSecurityHeaders());
    app.use('*', secureHeaders());

    // Request size limiting (prevent large payload attacks)
    app.use('*', requestSizeLimiting(10 * 1024 * 1024)); // 10MB limit

    // Threat detection (check for suspicious patterns)
    app.use('*', threatDetection());

    // Input sanitization and validation
    app.use('*', inputSanitization());
    app.use('*', sqlInjectionPrevention());
    app.use('*', xssPrevention());

    // Monitoring middleware - track all requests
    app.use('*', monitoringMiddleware());

    // CORS configuration with enhanced security
    app.use('*', corsMiddleware);

    // IP whitelisting for admin endpoints (if configured)
    const adminWhitelistIPs = process.env.ADMIN_WHITELIST_IPS?.split(',') || [];
    if (adminWhitelistIPs.length > 0) {
        app.use('/api/v1/admin/*', ipWhitelisting(adminWhitelistIPs));
    }

    // Strict CORS for sensitive endpoints
    app.use('/api/v1/auth/login', strictCorsMiddleware);
    app.use('/api/v1/auth/register', strictCorsMiddleware);
    app.use('/api/v1/auth/reset-password', strictCorsMiddleware);
    app.use('/api/v1/signing/*', strictCorsMiddleware);

    // Rate limiting - Apply different limits to different endpoints

    // Strict rate limiting for authentication endpoints
    app.use('/api/v1/auth/login', authRateLimit);
    app.use('/api/v1/auth/register', authRateLimit);
    app.use('/api/v1/auth/reset-password', authRateLimit);
    app.use('/api/v1/auth/verify-email', authRateLimit);

    // API key rate limiting for API endpoints
    app.use('/api/v1/*', (c, next) => {
        const apiKey = c.req.header('X-API-Key');
        if (apiKey) {
            return apiKeyRateLimit(c, next);
        }
        return next();
    });

    // Organization-level rate limiting for high-volume endpoints
    app.use('/api/v1/documents/*', orgRateLimit);
    app.use('/api/v1/templates/*', orgRateLimit);
    app.use('/api/v1/signing/*', orgRateLimit);

    // User-level rate limiting for user-specific endpoints
    app.use('/api/v1/user/*', userRateLimit);

    // Default rate limiting for all other API endpoints
    app.use('/api/*', defaultRateLimit);

    // Authentication middleware for protected routes
    app.use('/api/v1/auth/*', authMiddleware);
    app.use('/api/v1/user/*', authMiddleware);
    app.use('/api/v1/documents/*', authMiddleware);
    app.use('/api/v1/templates/*', authMiddleware);
    app.use('/api/v1/signing/*', authMiddleware);
    app.use('/api/v1/organizations/*', authMiddleware);

    // CDN middleware for all API responses
    app.use('/api/*', cdnMiddleware);

    // Cache middleware for specific endpoints
    // Static content caching
    app.use('/api/v1/static/*', staticCacheMiddleware);

    // Public API caching (no authentication required)
    app.use('/api/v1/public/*', publicApiCacheMiddleware);

    // User-specific data caching
    app.use('/api/v1/user/*', userCacheMiddleware);
    app.use('/api/v1/documents/*', documentsCacheMiddleware);

    // Organization-specific data caching
    app.use('/api/v1/organizations/*', orgCacheMiddleware);
    app.use('/api/v1/templates/*', templatesCacheMiddleware);

    // Medium-term caching for analytics and reports
    app.use('/api/v1/analytics/*', createCacheMiddleware(cacheService, {
        ttl: 900, // 15 minutes
        varyByOrganization: true,
        tags: ['analytics'],
        enableCDNHeaders: true,
        cdnTtl: 1800, // 30 minutes
    }));

    // Health check endpoint (no rate limiting)
    app.get('/health', (c) => {
        return c.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            cache: {
                type: process.env.NODE_ENV === 'production' ? 'redis' : 'memory',
                status: 'connected'
            },
            cdn: {
                provider: process.env.CDN_PROVIDER || 'generic',
                enabled: process.env.CDN_ENABLE_PURGING === 'true'
            }
        });
    });

    // Cache management endpoints
    app.get('/api/cache/stats', async (c) => {
        try {
            const stats = (cacheService as any).getStats?.() || { message: 'Stats not available' };
            return c.json({
                cache: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            return c.json({ error: 'Failed to get cache stats' }, 500);
        }
    });

    app.post('/api/cache/invalidate', async (c) => {
        try {
            const body = await c.req.json();
            const { type, key, pattern, tags } = body;

            switch (type) {
                case 'key':
                    if (key) {
                        await cacheInvalidationService.invalidateKey(key);
                        return c.json({ message: `Invalidated key: ${key}` });
                    }
                    break;
                case 'pattern':
                    if (pattern) {
                        await cacheInvalidationService.invalidatePattern(pattern);
                        return c.json({ message: `Invalidated pattern: ${pattern}` });
                    }
                    break;
                case 'tags':
                    if (tags && Array.isArray(tags)) {
                        await cacheInvalidationService.invalidateTags(tags);
                        return c.json({ message: `Invalidated tags: ${tags.join(', ')}` });
                    }
                    break;
                case 'all':
                    await cacheInvalidationService.clearAll();
                    return c.json({ message: 'Cleared all cache' });
                default:
                    return c.json({ error: 'Invalid invalidation type' }, 400);
            }

            return c.json({ error: 'Missing required parameters' }, 400);
        } catch (error) {
            return c.json({ error: 'Cache invalidation failed' }, 500);
        }
    });

    app.post('/api/cache/purge-cdn', async (c) => {
        try {
            const body = await c.req.json();
            const { type, url, tags } = body;

            let success = false;
            switch (type) {
                case 'url':
                    if (url) {
                        success = await cdnService.purgeByUrl(url);
                    }
                    break;
                case 'tags':
                    if (tags && Array.isArray(tags)) {
                        success = await cdnService.purgeByTags(tags);
                    }
                    break;
                default:
                    return c.json({ error: 'Invalid purge type' }, 400);
            }

            if (success) {
                return c.json({ message: 'CDN purge initiated successfully' });
            } else {
                return c.json({ error: 'CDN purge failed' }, 500);
            }
        } catch (error) {
            return c.json({ error: 'CDN purge failed' }, 500);
        }
    });

    // Rate limit status endpoint
    app.get('/api/rate-limit-status', async (c) => {
        try {
            // This endpoint shows current rate limit status without consuming tokens
            const user = c.get('user');
            const organizationId = user?.organizationId;

            if (!organizationId) {
                return c.json({ error: 'Authentication required' }, 401);
            }

            // Get rate limit status for different scopes
            const status = {
                organization: {
                    limit: 5000, // This would be dynamic based on subscription
                    remaining: 4850, // This would come from the rate limiter
                    resetTime: Date.now() + (60 * 60 * 1000)
                },
                user: {
                    limit: 500,
                    remaining: 485,
                    resetTime: Date.now() + (60 * 60 * 1000)
                }
            };

            return c.json(status);
        } catch (error) {
            return c.json({ error: 'Failed to get rate limit status' }, 500);
        }
    });

    // API versioning - redirect root to latest version
    app.get('/api', (c) => {
        return c.redirect('/api/v1');
    });

    // Mount API routes
    app.route('/api', apiRouter);

    // OpenAPI documentation
    app.doc('/api/openapi.json', openAPISpec);

    // Swagger UI
    app.get('/api/docs', swaggerUI({
        url: '/api/openapi.json',
        config: {
            displayRequestDuration: true,
            tryItOutEnabled: true,
            requestInterceptor: (req: any) => {
                // Add API key header if available
                const apiKey = localStorage.getItem('api-key');
                if (apiKey) {
                    req.headers['X-API-Key'] = apiKey;
                }
                return req;
            }
        }
    }));

    // Content negotiation - support multiple response formats
    app.use('*', async (c, next) => {
        await next();

        const accept = c.req.header('Accept');
        const response = c.res;

        // Handle different content types
        if (accept?.includes('application/xml') && response.headers.get('content-type')?.includes('application/json')) {
            // Convert JSON to XML if requested (simplified)
            const jsonData = await response.json();
            const xmlData = jsonToXML(jsonData);
            return c.text(xmlData, 200, { 'Content-Type': 'application/xml' });
        }

        return response;
    });

    // Global error handler
    app.onError(errorHandler);

    // 404 handler
    app.notFound((c) => {
        return c.json({
            error: 'Not Found',
            message: 'The requested resource was not found',
            path: c.req.path,
            timestamp: new Date().toISOString()
        }, 404);
    });

    return app;
}

/**
 * Start the API server
 */
export function startAPIServer(port: number = 8080) {
    const app = createAPIServer();

    console.log(`🚀 REST API Server starting on port ${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
    console.log(`🔍 OpenAPI Spec: http://localhost:${port}/api/openapi.json`);
    console.log(`❤️  Health Check: http://localhost:${port}/health`);
    console.log(`⚡ Rate Limit Status: http://localhost:${port}/api/rate-limit-status`);

    return serve({
        fetch: app.fetch,
        port
    });
}

/**
 * Simple JSON to XML converter (for content negotiation)
 */
function jsonToXML(obj: any, rootName: string = 'response'): string {
    function objectToXML(obj: any, indent: string = ''): string {
        if (typeof obj !== 'object' || obj === null) {
            return String(obj);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => `${indent}<item>${objectToXML(item)}</item>`).join('\n');
        }

        return Object.entries(obj)
            .map(([key, value]) => {
                const xmlValue = objectToXML(value, indent + '  ');
                return `${indent}<${key}>${xmlValue}</${key}>`;
            })
            .join('\n');
    }

    return `<?xml version="1.0" encoding="UTF-8"?>\n<${rootName}>\n${objectToXML(obj, '  ')}\n</${rootName}>`;
}