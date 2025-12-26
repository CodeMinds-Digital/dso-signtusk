/**
 * Integration example showing how to use the performance monitoring system
 * in a real application
 */

import { createPerformanceMonitoringService, createDatabaseOptimizer, createCacheOptimizer } from './index';
import type { PerformanceConfig } from './types';

// Example configuration for production environment
const productionConfig: PerformanceConfig = {
    tracing: {
        enabled: true,
        serviceName: 'docusign-alternative-prod',
        jaegerEndpoint: 'http://jaeger:14268/api/traces',
        sampleRate: 0.1, // Sample 10% of traces in production
    },
    metrics: {
        enabled: true,
        prometheusPort: 9090,
        collectInterval: 15000, // Collect metrics every 15 seconds
    },
    database: {
        monitoring: true,
        slowQueryThreshold: 1000, // 1 second
        connectionPoolMonitoring: true,
    },
    caching: {
        monitoring: true,
        hitRateThreshold: 0.8, // Alert if hit rate drops below 80%
        responseTimeThreshold: 100, // Alert if response time exceeds 100ms
    },
    loadBalancing: {
        enabled: true,
        algorithm: 'least-connections',
        healthCheckInterval: 30000, // Check health every 30 seconds
    },
    autoScaling: {
        enabled: true,
        cpuThreshold: 70, // Scale up if CPU > 70%
        memoryThreshold: 80, // Scale up if memory > 80%
        scaleUpCooldown: 300000, // 5 minutes
        scaleDownCooldown: 600000, // 10 minutes
        minInstances: 2,
        maxInstances: 20,
    },
    alerts: {
        enabled: true,
        responseTimeThreshold: 2000, // 2 seconds
        errorRateThreshold: 0.05, // 5%
        uptimeThreshold: 0.999, // 99.9%
    },
};

// Example usage in an Express.js application
export async function setupPerformanceMonitoring() {
    // Initialize performance monitoring service
    const performanceService = createPerformanceMonitoringService();
    await performanceService.initialize(productionConfig);

    // Start monitoring
    await performanceService.startMonitoring();

    // Initialize database optimizer
    const dbOptimizer = createDatabaseOptimizer(1000);

    // Initialize cache optimizer
    const cacheOptimizer = createCacheOptimizer();

    return {
        performanceService,
        dbOptimizer,
        cacheOptimizer,
    };
}

// Example middleware for Express.js to track HTTP requests
export function createPerformanceMiddleware(performanceService: any) {
    return (req: any, res: any, next: any) => {
        const startTime = Date.now();
        const trace = performanceService.startTrace(`HTTP ${req.method} ${req.path}`, {
            method: req.method,
            path: req.path,
            userAgent: req.get('User-Agent'),
            ip: req.ip,
        });

        // Override res.end to capture response metrics
        const originalEnd = res.end;
        res.end = function (...args: any[]) {
            const duration = Date.now() - startTime;

            // Add response information to trace
            trace.tags.statusCode = res.statusCode;
            trace.tags.responseTime = duration;

            // Finish the trace
            performanceService.finishTrace(trace);

            // Call original end method
            originalEnd.apply(res, args);
        };

        next();
    };
}

// Example database query monitoring
export function createDatabaseMiddleware(dbOptimizer: any) {
    return {
        beforeQuery: (query: string, parameters?: any[]) => {
            const monitor = dbOptimizer.createQueryMonitoringMiddleware();
            return monitor(query, parameters);
        },
        afterQuery: (monitor: any, error?: Error, rowsAffected = 0) => {
            monitor.finish(error, rowsAffected);
        },
    };
}

// Example cache monitoring
export function createCacheMiddleware(cacheOptimizer: any) {
    return {
        recordAccess: (key: string, hit: boolean, responseTime: number, value?: any, size?: number) => {
            cacheOptimizer.recordCacheAccess(key, hit, responseTime, value, size);
        },
        recordEviction: (key: string, reason: string) => {
            cacheOptimizer.recordCacheEviction(key, reason);
        },
    };
}

// Example load balancer configuration
export async function setupLoadBalancer(performanceService: any) {
    const loadBalancerConfig = {
        algorithm: 'least-connections' as const,
        nodes: [
            {
                id: 'node-1',
                host: 'app-1.internal',
                port: 3000,
                weight: 100,
                healthy: true,
                connections: 0,
                responseTime: 0,
                lastHealthCheck: new Date(),
            },
            {
                id: 'node-2',
                host: 'app-2.internal',
                port: 3000,
                weight: 100,
                healthy: true,
                connections: 0,
                responseTime: 0,
                lastHealthCheck: new Date(),
            },
            {
                id: 'node-3',
                host: 'app-3.internal',
                port: 3000,
                weight: 100,
                healthy: true,
                connections: 0,
                responseTime: 0,
                lastHealthCheck: new Date(),
            },
        ],
        healthCheck: {
            path: '/health',
            interval: 30000,
            timeout: 5000,
            retries: 3,
        },
    };

    await performanceService.configureLoadBalancer(loadBalancerConfig);
}

// Example usage in a Next.js API route
export function withPerformanceMonitoring(handler: any, performanceService: any) {
    return async (req: any, res: any) => {
        const trace = performanceService.startTrace(`API ${req.method} ${req.url}`, {
            method: req.method,
            url: req.url,
            userAgent: req.headers['user-agent'],
        });

        try {
            const result = await handler(req, res);
            trace.status = 'ok';
            return result;
        } catch (error) {
            trace.status = 'error';
            trace.tags.error = error instanceof Error ? error.message : 'Unknown error';
            throw error;
        } finally {
            performanceService.finishTrace(trace);
        }
    };
}

// Example health check endpoint
export async function healthCheckHandler(performanceService: any) {
    const healthCheck = await performanceService.healthCheck();

    return {
        status: healthCheck.status,
        timestamp: healthCheck.timestamp,
        services: healthCheck.services,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.version,
    };
}

// Example metrics endpoint for Prometheus scraping
export async function metricsHandler(performanceService: any) {
    const metrics = await performanceService.getMetrics();

    // Convert to Prometheus format (simplified)
    const prometheusMetrics = [
        `# HELP docusign_alternative_cpu_usage_percent System CPU usage percentage`,
        `# TYPE docusign_alternative_cpu_usage_percent gauge`,
        `docusign_alternative_cpu_usage_percent ${metrics[metrics.length - 1]?.system.cpu.usage || 0}`,

        `# HELP docusign_alternative_memory_usage_percent System memory usage percentage`,
        `# TYPE docusign_alternative_memory_usage_percent gauge`,
        `docusign_alternative_memory_usage_percent ${metrics[metrics.length - 1]?.system.memory.usage || 0}`,

        `# HELP docusign_alternative_cache_hit_rate Cache hit rate percentage`,
        `# TYPE docusign_alternative_cache_hit_rate gauge`,
        `docusign_alternative_cache_hit_rate ${metrics[metrics.length - 1]?.cache.hitRate || 0}`,
    ].join('\n');

    return prometheusMetrics;
}

// Example alert handler
export async function handleAlert(alert: any) {
    console.log(`🚨 Alert: ${alert.title}`);
    console.log(`Severity: ${alert.severity}`);
    console.log(`Description: ${alert.description}`);
    console.log(`Metric: ${alert.metric} = ${alert.currentValue} (threshold: ${alert.threshold})`);

    // In a real implementation, you would send notifications via:
    // - Email
    // - Slack
    // - PagerDuty
    // - SMS
    // - Webhook
}

// Example graceful shutdown
export async function gracefulShutdown(performanceService: any) {
    console.log('Shutting down performance monitoring...');

    try {
        await performanceService.stopMonitoring();
        console.log('Performance monitoring stopped successfully');
    } catch (error) {
        console.error('Error stopping performance monitoring:', error);
    }
}