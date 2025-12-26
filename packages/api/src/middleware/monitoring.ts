import { Context, Next } from 'hono';
import { APIContext } from '../context';

/**
 * API Monitoring and Analytics Middleware
 * Tracks API usage, performance, and errors for comprehensive monitoring
 */

export interface APIMetrics {
    requestId: string;
    method: string;
    path: string;
    statusCode: number;
    responseTime: number;
    requestSize: number;
    responseSize: number;
    userAgent?: string;
    ipAddress?: string;
    userId?: string;
    organizationId?: string;
    apiKey?: string;
    timestamp: Date;
    error?: {
        message: string;
        stack?: string;
        type: string;
    };
}

export interface PerformanceMetrics {
    endpoint: string;
    method: string;
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestCount: number;
    errorRate: number;
    throughput: number;
    timestamp: Date;
}

export interface ErrorMetrics {
    requestId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    errorType: string;
    errorMessage: string;
    errorStack?: string;
    userId?: string;
    organizationId?: string;
    timestamp: Date;
    userAgent?: string;
    ipAddress?: string;
}

export interface HealthMetrics {
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
    activeConnections: number;
    memoryUsage: {
        used: number;
        total: number;
        percentage: number;
    };
    cpuUsage: number;
    timestamp: Date;
}

/**
 * In-memory metrics storage for development
 * In production, this would be replaced with a proper metrics store (Redis, InfluxDB, etc.)
 */
class MetricsStore {
    private metrics: APIMetrics[] = [];
    private performanceMetrics: Map<string, number[]> = new Map();
    private errorMetrics: ErrorMetrics[] = [];
    private healthMetrics: HealthMetrics[] = [];
    private startTime = Date.now();

    addMetric(metric: APIMetrics) {
        this.metrics.push(metric);

        // Keep only last 10000 metrics in memory
        if (this.metrics.length > 10000) {
            this.metrics = this.metrics.slice(-10000);
        }

        // Track performance metrics
        const key = `${metric.method}:${metric.path}`;
        if (!this.performanceMetrics.has(key)) {
            this.performanceMetrics.set(key, []);
        }
        const times = this.performanceMetrics.get(key)!;
        times.push(metric.responseTime);

        // Keep only last 1000 response times per endpoint
        if (times.length > 1000) {
            times.splice(0, times.length - 1000);
        }
    }

    addErrorMetric(errorMetric: ErrorMetrics) {
        this.errorMetrics.push(errorMetric);

        // Keep only last 5000 error metrics
        if (this.errorMetrics.length > 5000) {
            this.errorMetrics = this.errorMetrics.slice(-5000);
        }
    }

    addHealthMetric(healthMetric: HealthMetrics) {
        this.healthMetrics.push(healthMetric);

        // Keep only last 1000 health metrics
        if (this.healthMetrics.length > 1000) {
            this.healthMetrics = this.healthMetrics.slice(-1000);
        }
    }

    getMetrics(timeRange?: { start: Date; end: Date }): APIMetrics[] {
        if (!timeRange) {
            return this.metrics;
        }

        return this.metrics.filter(m =>
            m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
        );
    }

    getPerformanceMetrics(endpoint?: string): PerformanceMetrics[] {
        const results: PerformanceMetrics[] = [];

        for (const [key, times] of this.performanceMetrics.entries()) {
            const [method, path] = key.split(':');

            if (endpoint && path !== endpoint) {
                continue;
            }

            if (times.length === 0) continue;

            const sorted = [...times].sort((a, b) => a - b);
            const p95Index = Math.floor(sorted.length * 0.95);
            const p99Index = Math.floor(sorted.length * 0.99);

            const recentMetrics = this.metrics.filter(m =>
                m.method === method && m.path === path
            );

            const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;

            results.push({
                endpoint: path,
                method,
                avgResponseTime: times.reduce((a, b) => a + b, 0) / times.length,
                p95ResponseTime: sorted[p95Index] || 0,
                p99ResponseTime: sorted[p99Index] || 0,
                requestCount: times.length,
                errorRate: recentMetrics.length > 0 ? errorCount / recentMetrics.length : 0,
                throughput: times.length / 60, // requests per minute (simplified)
                timestamp: new Date()
            });
        }

        return results;
    }

    getErrorMetrics(timeRange?: { start: Date; end: Date }): ErrorMetrics[] {
        if (!timeRange) {
            return this.errorMetrics;
        }

        return this.errorMetrics.filter(m =>
            m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
        );
    }

    getHealthMetrics(): HealthMetrics {
        const now = Date.now();
        const uptime = now - this.startTime;

        // Calculate recent metrics (last 5 minutes)
        const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
        const recentMetrics = this.getMetrics({ start: fiveMinutesAgo, end: new Date() });

        const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
        const errorRate = recentMetrics.length > 0 ? errorCount / recentMetrics.length : 0;

        const avgResponseTime = recentMetrics.length > 0
            ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
            : 0;

        const throughput = recentMetrics.length / 5; // requests per minute

        // Memory usage (simplified)
        const memUsed = process.memoryUsage();
        const memoryUsage = {
            used: memUsed.heapUsed,
            total: memUsed.heapTotal,
            percentage: (memUsed.heapUsed / memUsed.heapTotal) * 100
        };

        // Determine health status
        let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
        if (errorRate > 0.1 || avgResponseTime > 2000 || memoryUsage.percentage > 90) {
            status = 'degraded';
        }
        if (errorRate > 0.25 || avgResponseTime > 5000 || memoryUsage.percentage > 95) {
            status = 'unhealthy';
        }

        return {
            status,
            uptime,
            responseTime: avgResponseTime,
            errorRate,
            throughput,
            activeConnections: recentMetrics.length, // Simplified
            memoryUsage,
            cpuUsage: 0, // Would need proper CPU monitoring
            timestamp: new Date()
        };
    }

    getAnalytics(timeRange?: { start: Date; end: Date }) {
        const metrics = this.getMetrics(timeRange);
        const performanceMetrics = this.getPerformanceMetrics();
        const errorMetrics = this.getErrorMetrics(timeRange);
        const healthMetrics = this.getHealthMetrics();

        // Usage analytics
        const totalRequests = metrics.length;
        const uniqueUsers = new Set(metrics.map(m => m.userId).filter(Boolean)).size;
        const uniqueOrganizations = new Set(metrics.map(m => m.organizationId).filter(Boolean)).size;

        // Top endpoints
        const endpointCounts = new Map<string, number>();
        metrics.forEach(m => {
            const key = `${m.method} ${m.path}`;
            endpointCounts.set(key, (endpointCounts.get(key) || 0) + 1);
        });

        const topEndpoints = Array.from(endpointCounts.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([endpoint, count]) => ({ endpoint, count }));

        // Error analysis
        const errorsByType = new Map<string, number>();
        errorMetrics.forEach(e => {
            errorsByType.set(e.errorType, (errorsByType.get(e.errorType) || 0) + 1);
        });

        const topErrors = Array.from(errorsByType.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([errorType, count]) => ({ errorType, count }));

        return {
            usage: {
                totalRequests,
                uniqueUsers,
                uniqueOrganizations,
                topEndpoints
            },
            performance: performanceMetrics,
            errors: {
                totalErrors: errorMetrics.length,
                errorRate: totalRequests > 0 ? errorMetrics.length / totalRequests : 0,
                topErrors
            },
            health: healthMetrics
        };
    }
}

// Global metrics store instance
const metricsStore = new MetricsStore();

/**
 * Monitoring middleware that tracks API usage and performance
 */
export function monitoringMiddleware() {
    return async (c: Context<{ Variables: APIContext }>, next: Next) => {
        const startTime = Date.now();
        const requestId = crypto.randomUUID();

        // Set request ID in context
        c.set('requestId', requestId);

        // Get request information
        const method = c.req.method;
        const path = c.req.path;
        const userAgent = c.req.header('User-Agent');
        const ipAddress = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';
        const user = c.get('user');
        const apiKey = c.req.header('X-API-Key');

        // Calculate request size
        const requestSize = await getRequestSize(c.req);

        let error: { message: string; stack?: string; type: string } | undefined;
        let statusCode = 200;
        let responseSize = 0;

        try {
            await next();

            // Get response information
            statusCode = c.res.status;
            responseSize = await getResponseSize(c.res);

        } catch (err: any) {
            statusCode = err.status || 500;
            error = {
                message: err.message || 'Unknown error',
                stack: err.stack,
                type: err.constructor.name || 'Error'
            };

            // Track error metrics
            const errorMetric: ErrorMetrics = {
                requestId,
                endpoint: path,
                method,
                statusCode,
                errorType: error.type,
                errorMessage: error.message,
                errorStack: error.stack,
                userId: user?.id,
                organizationId: user?.organizationId,
                timestamp: new Date(),
                userAgent,
                ipAddress
            };

            metricsStore.addErrorMetric(errorMetric);

            throw err;
        } finally {
            const endTime = Date.now();
            const responseTime = endTime - startTime;

            // Create API metric
            const metric: APIMetrics = {
                requestId,
                method,
                path,
                statusCode,
                responseTime,
                requestSize,
                responseSize,
                userAgent,
                ipAddress,
                userId: user?.id,
                organizationId: user?.organizationId,
                apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : undefined,
                timestamp: new Date(),
                error
            };

            // Store metric
            metricsStore.addMetric(metric);

            // Add response headers for monitoring
            c.res.headers.set('X-Request-ID', requestId);
            c.res.headers.set('X-Response-Time', `${responseTime}ms`);
        }
    };
}

/**
 * Get metrics store instance (for testing and analytics endpoints)
 */
export function getMetricsStore() {
    return metricsStore;
}

/**
 * Calculate request size
 */
async function getRequestSize(req: Request): Promise<number> {
    try {
        const contentLength = req.headers.get('Content-Length');
        if (contentLength) {
            return parseInt(contentLength, 10);
        }

        // If no content-length header, try to get body size
        const body = await req.text();
        return new TextEncoder().encode(body).length;
    } catch {
        return 0;
    }
}

/**
 * Calculate response size
 */
async function getResponseSize(res: Response): Promise<number> {
    try {
        const contentLength = res.headers.get('Content-Length');
        if (contentLength) {
            return parseInt(contentLength, 10);
        }

        // Estimate based on response body
        const body = await res.text();
        return new TextEncoder().encode(body).length;
    } catch {
        return 0;
    }
}

/**
 * Alert thresholds and configuration
 */
export interface AlertConfig {
    responseTimeThreshold: number; // ms
    errorRateThreshold: number; // percentage (0-1)
    throughputThreshold: number; // requests per minute
    memoryUsageThreshold: number; // percentage (0-100)
}

export const defaultAlertConfig: AlertConfig = {
    responseTimeThreshold: 2000, // 2 seconds
    errorRateThreshold: 0.05, // 5%
    throughputThreshold: 1000, // 1000 requests per minute
    memoryUsageThreshold: 85 // 85%
};

/**
 * Check if alerts should be triggered
 */
export function checkAlerts(config: AlertConfig = defaultAlertConfig): Array<{
    type: string;
    message: string;
    severity: 'warning' | 'critical';
    timestamp: Date;
}> {
    const alerts: Array<{
        type: string;
        message: string;
        severity: 'warning' | 'critical';
        timestamp: Date;
    }> = [];

    const healthMetrics = metricsStore.getHealthMetrics();
    const performanceMetrics = metricsStore.getPerformanceMetrics();

    // Check response time
    const avgResponseTime = performanceMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / performanceMetrics.length;
    if (avgResponseTime > config.responseTimeThreshold) {
        alerts.push({
            type: 'high_response_time',
            message: `Average response time (${avgResponseTime.toFixed(2)}ms) exceeds threshold (${config.responseTimeThreshold}ms)`,
            severity: avgResponseTime > config.responseTimeThreshold * 2 ? 'critical' : 'warning',
            timestamp: new Date()
        });
    }

    // Check error rate
    if (healthMetrics.errorRate > config.errorRateThreshold) {
        alerts.push({
            type: 'high_error_rate',
            message: `Error rate (${(healthMetrics.errorRate * 100).toFixed(2)}%) exceeds threshold (${(config.errorRateThreshold * 100).toFixed(2)}%)`,
            severity: healthMetrics.errorRate > config.errorRateThreshold * 2 ? 'critical' : 'warning',
            timestamp: new Date()
        });
    }

    // Check memory usage
    if (healthMetrics.memoryUsage.percentage > config.memoryUsageThreshold) {
        alerts.push({
            type: 'high_memory_usage',
            message: `Memory usage (${healthMetrics.memoryUsage.percentage.toFixed(2)}%) exceeds threshold (${config.memoryUsageThreshold}%)`,
            severity: healthMetrics.memoryUsage.percentage > 95 ? 'critical' : 'warning',
            timestamp: new Date()
        });
    }

    return alerts;
}