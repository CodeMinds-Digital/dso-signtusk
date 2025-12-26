import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { getMetricsStore, checkAlerts, defaultAlertConfig } from '../../middleware/monitoring';

/**
 * API Monitoring and Analytics Routes
 * Provides endpoints for accessing API usage analytics, performance metrics, and health monitoring
 */

const monitoringRouter = new OpenAPIHono();

// Schemas for API documentation
const TimeRangeSchema = z.object({
    start: z.string().datetime().optional().describe('Start time in ISO format'),
    end: z.string().datetime().optional().describe('End time in ISO format')
});

const APIMetricsSchema = z.object({
    requestId: z.string(),
    method: z.string(),
    path: z.string(),
    statusCode: z.number(),
    responseTime: z.number(),
    requestSize: z.number(),
    responseSize: z.number(),
    userAgent: z.string().optional(),
    ipAddress: z.string().optional(),
    userId: z.string().optional(),
    organizationId: z.string().optional(),
    apiKey: z.string().optional(),
    timestamp: z.string().datetime(),
    error: z.object({
        message: z.string(),
        stack: z.string().optional(),
        type: z.string()
    }).optional()
});

const PerformanceMetricsSchema = z.object({
    endpoint: z.string(),
    method: z.string(),
    avgResponseTime: z.number(),
    p95ResponseTime: z.number(),
    p99ResponseTime: z.number(),
    requestCount: z.number(),
    errorRate: z.number(),
    throughput: z.number(),
    timestamp: z.string().datetime()
});

const HealthMetricsSchema = z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy']),
    uptime: z.number(),
    responseTime: z.number(),
    errorRate: z.number(),
    throughput: z.number(),
    activeConnections: z.number(),
    memoryUsage: z.object({
        used: z.number(),
        total: z.number(),
        percentage: z.number()
    }),
    cpuUsage: z.number(),
    timestamp: z.string().datetime()
});

const AlertSchema = z.object({
    type: z.string(),
    message: z.string(),
    severity: z.enum(['warning', 'critical']),
    timestamp: z.string().datetime()
});

const AnalyticsResponseSchema = z.object({
    usage: z.object({
        totalRequests: z.number(),
        uniqueUsers: z.number(),
        uniqueOrganizations: z.number(),
        topEndpoints: z.array(z.object({
            endpoint: z.string(),
            count: z.number()
        }))
    }),
    performance: z.array(PerformanceMetricsSchema),
    errors: z.object({
        totalErrors: z.number(),
        errorRate: z.number(),
        topErrors: z.array(z.object({
            errorType: z.string(),
            count: z.number()
        }))
    }),
    health: HealthMetricsSchema
});

// Get comprehensive analytics
const getAnalyticsRoute = createRoute({
    method: 'get',
    path: '/analytics',
    summary: 'Get comprehensive API analytics',
    description: 'Retrieve detailed analytics including usage, performance, errors, and health metrics',
    request: {
        query: TimeRangeSchema
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: AnalyticsResponseSchema
                }
            },
            description: 'Analytics data retrieved successfully'
        },
        401: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                        message: z.string()
                    })
                }
            },
            description: 'Unauthorized - Admin access required'
        }
    },
    tags: ['Monitoring']
});

monitoringRouter.openapi(getAnalyticsRoute, async (c) => {
    // Check if user has admin access
    const user = c.get('user');
    if (!user || !user.roles?.includes('admin')) {
        return c.json({
            error: 'Unauthorized',
            message: 'Admin access required for analytics'
        }, 401);
    }

    const { start, end } = c.req.valid('query');

    const timeRange = start && end ? {
        start: new Date(start),
        end: new Date(end)
    } : undefined;

    const metricsStore = getMetricsStore();
    const analytics = metricsStore.getAnalytics(timeRange);

    return c.json(analytics);
});

// Get API usage metrics
const getUsageMetricsRoute = createRoute({
    method: 'get',
    path: '/metrics/usage',
    summary: 'Get API usage metrics',
    description: 'Retrieve detailed API usage metrics for monitoring and analysis',
    request: {
        query: TimeRangeSchema
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(APIMetricsSchema)
                }
            },
            description: 'Usage metrics retrieved successfully'
        },
        401: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                        message: z.string()
                    })
                }
            },
            description: 'Unauthorized - Admin access required'
        }
    },
    tags: ['Monitoring']
});

monitoringRouter.openapi(getUsageMetricsRoute, async (c) => {
    // Check if user has admin access
    const user = c.get('user');
    if (!user || !user.roles?.includes('admin')) {
        return c.json({
            error: 'Unauthorized',
            message: 'Admin access required for usage metrics'
        }, 401);
    }

    const { start, end } = c.req.valid('query');

    const timeRange = start && end ? {
        start: new Date(start),
        end: new Date(end)
    } : undefined;

    const metricsStore = getMetricsStore();
    const metrics = metricsStore.getMetrics(timeRange);

    return c.json(metrics);
});

// Get performance metrics
const getPerformanceMetricsRoute = createRoute({
    method: 'get',
    path: '/metrics/performance',
    summary: 'Get API performance metrics',
    description: 'Retrieve performance metrics including response times, throughput, and error rates',
    request: {
        query: z.object({
            endpoint: z.string().optional().describe('Filter by specific endpoint')
        })
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(PerformanceMetricsSchema)
                }
            },
            description: 'Performance metrics retrieved successfully'
        },
        401: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                        message: z.string()
                    })
                }
            },
            description: 'Unauthorized - Admin access required'
        }
    },
    tags: ['Monitoring']
});

monitoringRouter.openapi(getPerformanceMetricsRoute, async (c) => {
    // Check if user has admin access
    const user = c.get('user');
    if (!user || !user.roles?.includes('admin')) {
        return c.json({
            error: 'Unauthorized',
            message: 'Admin access required for performance metrics'
        }, 401);
    }

    const { endpoint } = c.req.valid('query');

    const metricsStore = getMetricsStore();
    const performanceMetrics = metricsStore.getPerformanceMetrics(endpoint);

    return c.json(performanceMetrics);
});

// Get error metrics
const getErrorMetricsRoute = createRoute({
    method: 'get',
    path: '/metrics/errors',
    summary: 'Get API error metrics',
    description: 'Retrieve detailed error metrics for troubleshooting and analysis',
    request: {
        query: TimeRangeSchema
    },
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(z.object({
                        requestId: z.string(),
                        endpoint: z.string(),
                        method: z.string(),
                        statusCode: z.number(),
                        errorType: z.string(),
                        errorMessage: z.string(),
                        errorStack: z.string().optional(),
                        userId: z.string().optional(),
                        organizationId: z.string().optional(),
                        timestamp: z.string().datetime(),
                        userAgent: z.string().optional(),
                        ipAddress: z.string().optional()
                    }))
                }
            },
            description: 'Error metrics retrieved successfully'
        },
        401: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                        message: z.string()
                    })
                }
            },
            description: 'Unauthorized - Admin access required'
        }
    },
    tags: ['Monitoring']
});

monitoringRouter.openapi(getErrorMetricsRoute, async (c) => {
    // Check if user has admin access
    const user = c.get('user');
    if (!user || !user.roles?.includes('admin')) {
        return c.json({
            error: 'Unauthorized',
            message: 'Admin access required for error metrics'
        }, 401);
    }

    const { start, end } = c.req.valid('query');

    const timeRange = start && end ? {
        start: new Date(start),
        end: new Date(end)
    } : undefined;

    const metricsStore = getMetricsStore();
    const errorMetrics = metricsStore.getErrorMetrics(timeRange);

    return c.json(errorMetrics);
});

// Get health metrics
const getHealthMetricsRoute = createRoute({
    method: 'get',
    path: '/health/metrics',
    summary: 'Get API health metrics',
    description: 'Retrieve current health status and system metrics',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: HealthMetricsSchema
                }
            },
            description: 'Health metrics retrieved successfully'
        }
    },
    tags: ['Monitoring']
});

monitoringRouter.openapi(getHealthMetricsRoute, async (c) => {
    const metricsStore = getMetricsStore();
    const healthMetrics = metricsStore.getHealthMetrics();

    return c.json(healthMetrics);
});

// Get uptime status
const getUptimeRoute = createRoute({
    method: 'get',
    path: '/health/uptime',
    summary: 'Get API uptime status',
    description: 'Retrieve uptime information and availability metrics',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        uptime: z.number().describe('Uptime in milliseconds'),
                        uptimeFormatted: z.string().describe('Human-readable uptime'),
                        startTime: z.string().datetime(),
                        currentTime: z.string().datetime(),
                        availability: z.object({
                            last24Hours: z.number().describe('Availability percentage in last 24 hours'),
                            last7Days: z.number().describe('Availability percentage in last 7 days'),
                            last30Days: z.number().describe('Availability percentage in last 30 days')
                        })
                    })
                }
            },
            description: 'Uptime status retrieved successfully'
        }
    },
    tags: ['Monitoring']
});

monitoringRouter.openapi(getUptimeRoute, async (c) => {
    const metricsStore = getMetricsStore();
    const healthMetrics = metricsStore.getHealthMetrics();

    const startTime = new Date(Date.now() - healthMetrics.uptime);
    const currentTime = new Date();

    // Format uptime
    const uptimeSeconds = Math.floor(healthMetrics.uptime / 1000);
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;

    const uptimeFormatted = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    // Calculate availability (simplified - in production would use proper monitoring data)
    const availability = {
        last24Hours: 99.9,
        last7Days: 99.8,
        last30Days: 99.7
    };

    return c.json({
        uptime: healthMetrics.uptime,
        uptimeFormatted,
        startTime: startTime.toISOString(),
        currentTime: currentTime.toISOString(),
        availability
    });
});

// Get alerts
const getAlertsRoute = createRoute({
    method: 'get',
    path: '/alerts',
    summary: 'Get active alerts',
    description: 'Retrieve current alerts based on monitoring thresholds',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.array(AlertSchema)
                }
            },
            description: 'Alerts retrieved successfully'
        },
        401: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                        message: z.string()
                    })
                }
            },
            description: 'Unauthorized - Admin access required'
        }
    },
    tags: ['Monitoring']
});

monitoringRouter.openapi(getAlertsRoute, async (c) => {
    // Check if user has admin access
    const user = c.get('user');
    if (!user || !user.roles?.includes('admin')) {
        return c.json({
            error: 'Unauthorized',
            message: 'Admin access required for alerts'
        }, 401);
    }

    const alerts = checkAlerts(defaultAlertConfig);
    return c.json(alerts);
});

// Dashboard endpoint - comprehensive monitoring dashboard data
const getDashboardRoute = createRoute({
    method: 'get',
    path: '/dashboard',
    summary: 'Get monitoring dashboard data',
    description: 'Retrieve comprehensive dashboard data including all key metrics and alerts',
    responses: {
        200: {
            content: {
                'application/json': {
                    schema: z.object({
                        overview: z.object({
                            totalRequests: z.number(),
                            activeUsers: z.number(),
                            errorRate: z.number(),
                            avgResponseTime: z.number(),
                            uptime: z.number()
                        }),
                        analytics: AnalyticsResponseSchema,
                        alerts: z.array(AlertSchema),
                        recentErrors: z.array(z.object({
                            requestId: z.string(),
                            endpoint: z.string(),
                            errorMessage: z.string(),
                            timestamp: z.string().datetime()
                        })),
                        topEndpoints: z.array(z.object({
                            endpoint: z.string(),
                            count: z.number(),
                            avgResponseTime: z.number(),
                            errorRate: z.number()
                        }))
                    })
                }
            },
            description: 'Dashboard data retrieved successfully'
        },
        401: {
            content: {
                'application/json': {
                    schema: z.object({
                        error: z.string(),
                        message: z.string()
                    })
                }
            },
            description: 'Unauthorized - Admin access required'
        }
    },
    tags: ['Monitoring']
});

monitoringRouter.openapi(getDashboardRoute, async (c) => {
    // Check if user has admin access
    const user = c.get('user');
    if (!user || !user.roles?.includes('admin')) {
        return c.json({
            error: 'Unauthorized',
            message: 'Admin access required for dashboard'
        }, 401);
    }

    const metricsStore = getMetricsStore();
    const analytics = metricsStore.getAnalytics();
    const alerts = checkAlerts(defaultAlertConfig);
    const errorMetrics = metricsStore.getErrorMetrics();

    // Recent errors (last 10)
    const recentErrors = errorMetrics
        .slice(-10)
        .map(error => ({
            requestId: error.requestId,
            endpoint: error.endpoint,
            errorMessage: error.errorMessage,
            timestamp: error.timestamp.toISOString()
        }));

    // Top endpoints with performance data
    const performanceMetrics = metricsStore.getPerformanceMetrics();
    const topEndpoints = performanceMetrics
        .sort((a, b) => b.requestCount - a.requestCount)
        .slice(0, 10)
        .map(metric => ({
            endpoint: `${metric.method} ${metric.endpoint}`,
            count: metric.requestCount,
            avgResponseTime: metric.avgResponseTime,
            errorRate: metric.errorRate
        }));

    const overview = {
        totalRequests: analytics.usage.totalRequests,
        activeUsers: analytics.usage.uniqueUsers,
        errorRate: analytics.errors.errorRate,
        avgResponseTime: analytics.health.responseTime,
        uptime: analytics.health.uptime
    };

    return c.json({
        overview,
        analytics,
        alerts,
        recentErrors,
        topEndpoints
    });
});

export { monitoringRouter };