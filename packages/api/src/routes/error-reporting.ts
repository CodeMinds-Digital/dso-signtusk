import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { ErrorMonitoringService } from '../middleware/error-handler';

const app = new OpenAPIHono();

/**
 * Error statistics schema
 */
const ErrorStatsSchema = z.object({
    totalErrors: z.number().describe('Total number of errors tracked'),
    errorsByType: z.record(z.string(), z.number()).describe('Error counts by type'),
    hourlyRates: z.record(z.string(), z.number()).describe('Hourly error rates by type'),
    timestamp: z.string().describe('Timestamp of the statistics')
});

/**
 * Error report schema
 */
const ErrorReportSchema = z.object({
    message: z.string().describe('Error message'),
    stack: z.string().optional().describe('Error stack trace'),
    url: z.string().describe('URL where error occurred'),
    userAgent: z.string().optional().describe('User agent string'),
    userId: z.string().optional().describe('User ID if authenticated'),
    organizationId: z.string().optional().describe('Organization ID if applicable'),
    metadata: z.record(z.string(), z.any()).optional().describe('Additional error metadata')
});

/**
 * Get error statistics endpoint
 */
const getErrorStatsRoute = createRoute({
    method: 'get',
    path: '/error-stats',
    tags: ['Error Reporting'],
    summary: 'Get error statistics',
    description: 'Retrieve comprehensive error statistics and monitoring data',
    responses: {
        200: {
            description: 'Error statistics retrieved successfully',
            content: {
                'application/json': {
                    schema: ErrorStatsSchema
                }
            }
        },
        401: {
            description: 'Unauthorized - Admin access required'
        }
    }
});

app.openapi(getErrorStatsRoute, async (c) => {
    // Check if user has admin permissions
    const user = c.get('user');
    if (!user || !user.roles.includes('admin')) {
        return c.json({ error: 'Admin access required' }, 401);
    }

    const errorMonitoring = ErrorMonitoringService.getInstance();
    const stats = errorMonitoring.getErrorStats();

    return c.json({
        ...stats,
        timestamp: new Date().toISOString()
    });
});

/**
 * Client-side error reporting endpoint
 */
const reportClientErrorRoute = createRoute({
    method: 'post',
    path: '/report-error',
    tags: ['Error Reporting'],
    summary: 'Report client-side error',
    description: 'Allow clients to report JavaScript errors and other client-side issues',
    requestBody: {
        required: true,
        content: {
            'application/json': {
                schema: ErrorReportSchema
            }
        }
    },
    responses: {
        200: {
            description: 'Error report received successfully'
        },
        400: {
            description: 'Invalid error report format'
        }
    }
});

app.openapi(reportClientErrorRoute, async (c) => {
    const errorReport = c.req.valid('json');
    const apiContext = c.get('apiContext');

    // Log client-side error
    console.error('Client-side error reported:', {
        ...errorReport,
        requestId: apiContext?.requestId,
        timestamp: new Date().toISOString(),
        serverUserAgent: apiContext?.userAgent,
        serverIpAddress: apiContext?.clientIP
    });

    // In production, you might want to:
    // 1. Store in a dedicated error tracking service (Sentry, Bugsnag, etc.)
    // 2. Send to analytics platform
    // 3. Trigger alerts for critical client errors
    // 4. Aggregate for error trend analysis

    return c.json({
        message: 'Error report received',
        reportId: `client_error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    });
});

/**
 * Error health check endpoint
 */
const errorHealthRoute = createRoute({
    method: 'get',
    path: '/error-health',
    tags: ['Error Reporting'],
    summary: 'Get error health status',
    description: 'Check the health status based on error rates and patterns',
    responses: {
        200: {
            description: 'Error health status',
            content: {
                'application/json': {
                    schema: z.object({
                        status: z.enum(['healthy', 'degraded', 'unhealthy']),
                        errorRate: z.number().describe('Current error rate (0-1)'),
                        criticalErrors: z.number().describe('Number of critical errors in last hour'),
                        recommendations: z.array(z.string()).describe('Health improvement recommendations'),
                        timestamp: z.string()
                    })
                }
            }
        }
    }
});

app.openapi(errorHealthRoute, async (c) => {
    const errorMonitoring = ErrorMonitoringService.getInstance();
    const stats = errorMonitoring.getErrorStats();

    // Calculate error rate (simplified - in production, you'd use more sophisticated metrics)
    const totalRequests = 1000; // This would come from request metrics
    const errorRate = stats.totalErrors / totalRequests;

    // Count critical errors (5xx status codes)
    const criticalErrors = Object.entries(stats.hourlyRates)
        .filter(([key]) => key.includes(':5'))
        .reduce((sum, [, count]) => sum + count, 0);

    // Determine health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const recommendations: string[] = [];

    if (errorRate > 0.05 || criticalErrors > 10) {
        status = 'degraded';
        recommendations.push('High error rate detected - investigate recent deployments');
        recommendations.push('Review error logs for patterns');
    }

    if (errorRate > 0.15 || criticalErrors > 50) {
        status = 'unhealthy';
        recommendations.push('Critical error threshold exceeded - immediate attention required');
        recommendations.push('Consider rolling back recent changes');
        recommendations.push('Scale up infrastructure if needed');
    }

    if (errorRate < 0.01 && criticalErrors === 0) {
        recommendations.push('System is operating normally');
    }

    return c.json({
        status,
        errorRate,
        criticalErrors,
        recommendations,
        timestamp: new Date().toISOString()
    });
});

/**
 * Reset error statistics endpoint (for testing/maintenance)
 */
const resetErrorStatsRoute = createRoute({
    method: 'post',
    path: '/reset-error-stats',
    tags: ['Error Reporting'],
    summary: 'Reset error statistics',
    description: 'Reset all error statistics (admin only, primarily for testing)',
    responses: {
        200: {
            description: 'Error statistics reset successfully'
        },
        401: {
            description: 'Unauthorized - Admin access required'
        }
    }
});

app.openapi(resetErrorStatsRoute, async (c) => {
    // Check if user has admin permissions
    const user = c.get('user');
    if (!user || !user.roles.includes('admin')) {
        return c.json({ error: 'Admin access required' }, 401);
    }

    const errorMonitoring = ErrorMonitoringService.getInstance();
    errorMonitoring.reset();

    return c.json({
        message: 'Error statistics reset successfully',
        timestamp: new Date().toISOString()
    });
});

export { app as errorReportingRouter };