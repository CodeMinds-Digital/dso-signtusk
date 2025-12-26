import { z } from 'zod';

// Performance Monitoring Configuration
export const PerformanceConfigSchema = z.object({
    tracing: z.object({
        enabled: z.boolean().default(true),
        serviceName: z.string().default('docusign-alternative'),
        jaegerEndpoint: z.string().optional(),
        sampleRate: z.number().min(0).max(1).default(0.1),
    }),
    metrics: z.object({
        enabled: z.boolean().default(true),
        prometheusPort: z.number().default(9090),
        collectInterval: z.number().default(15000), // 15 seconds
    }),
    database: z.object({
        monitoring: z.boolean().default(true),
        slowQueryThreshold: z.number().default(1000), // 1 second
        connectionPoolMonitoring: z.boolean().default(true),
    }),
    caching: z.object({
        monitoring: z.boolean().default(true),
        hitRateThreshold: z.number().min(0).max(1).default(0.8), // 80%
        responseTimeThreshold: z.number().default(100), // 100ms
    }),
    loadBalancing: z.object({
        enabled: z.boolean().default(true),
        algorithm: z.enum(['round-robin', 'least-connections', 'weighted', 'ip-hash']).default('round-robin'),
        healthCheckInterval: z.number().default(30000), // 30 seconds
    }),
    autoScaling: z.object({
        enabled: z.boolean().default(true),
        cpuThreshold: z.number().min(0).max(100).default(70), // 70%
        memoryThreshold: z.number().min(0).max(100).default(80), // 80%
        scaleUpCooldown: z.number().default(300000), // 5 minutes
        scaleDownCooldown: z.number().default(600000), // 10 minutes
        minInstances: z.number().default(2),
        maxInstances: z.number().default(20),
    }),
    alerts: z.object({
        enabled: z.boolean().default(true),
        responseTimeThreshold: z.number().default(2000), // 2 seconds
        errorRateThreshold: z.number().min(0).max(1).default(0.05), // 5%
        uptimeThreshold: z.number().min(0).max(1).default(0.999), // 99.9%
    }),
});

export type PerformanceConfig = z.infer<typeof PerformanceConfigSchema>;

// Metrics Types
export interface PerformanceMetrics {
    timestamp: Date;
    system: SystemMetrics;
    application: ApplicationMetrics;
    database: DatabaseMetrics;
    cache: CacheMetrics;
    network: NetworkMetrics;
}

export interface SystemMetrics {
    cpu: {
        usage: number; // percentage
        loadAverage: number[];
    };
    memory: {
        used: number; // bytes
        total: number; // bytes
        usage: number; // percentage
    };
    disk: {
        used: number; // bytes
        total: number; // bytes
        usage: number; // percentage
    };
    uptime: number; // seconds
}

export interface ApplicationMetrics {
    requests: {
        total: number;
        rate: number; // requests per second
        errors: number;
        errorRate: number; // percentage
    };
    response: {
        averageTime: number; // milliseconds
        p50: number;
        p95: number;
        p99: number;
    };
    activeConnections: number;
    throughput: number; // requests per second
}

export interface DatabaseMetrics {
    connections: {
        active: number;
        idle: number;
        total: number;
        poolSize: number;
    };
    queries: {
        total: number;
        slow: number;
        failed: number;
        averageTime: number; // milliseconds
    };
    transactions: {
        committed: number;
        rolledBack: number;
        active: number;
    };
}

export interface CacheMetrics {
    hits: number;
    misses: number;
    hitRate: number; // percentage
    evictions: number;
    memory: {
        used: number; // bytes
        max: number; // bytes
        usage: number; // percentage
    };
    operations: {
        gets: number;
        sets: number;
        deletes: number;
        averageResponseTime: number; // milliseconds
    };
}

export interface NetworkMetrics {
    bandwidth: {
        inbound: number; // bytes per second
        outbound: number; // bytes per second
    };
    latency: {
        average: number; // milliseconds
        p95: number;
        p99: number;
    };
    connections: {
        established: number;
        timeWait: number;
        closeWait: number;
    };
}

// Tracing Types
export interface TraceSpan {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    operationName: string;
    startTime: Date;
    endTime?: Date;
    duration?: number; // milliseconds
    tags: Record<string, any>;
    logs: TraceLog[];
    status: 'ok' | 'error' | 'timeout';
}

export interface TraceLog {
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    fields?: Record<string, any>;
}

// Load Balancing Types
export interface LoadBalancerNode {
    id: string;
    host: string;
    port: number;
    weight: number;
    healthy: boolean;
    connections: number;
    responseTime: number; // milliseconds
    lastHealthCheck: Date;
}

export interface LoadBalancerConfig {
    algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash';
    nodes: LoadBalancerNode[];
    healthCheck: {
        path: string;
        interval: number; // milliseconds
        timeout: number; // milliseconds
        retries: number;
    };
}

// Auto Scaling Types
export interface ScalingMetrics {
    cpu: number; // percentage
    memory: number; // percentage
    requestRate: number; // requests per second
    responseTime: number; // milliseconds
    errorRate: number; // percentage
}

export interface ScalingDecision {
    action: 'scale-up' | 'scale-down' | 'no-action';
    reason: string;
    currentInstances: number;
    targetInstances: number;
    timestamp: Date;
}

export interface AutoScalingRule {
    metric: keyof ScalingMetrics;
    threshold: number;
    comparison: 'greater-than' | 'less-than';
    action: 'scale-up' | 'scale-down';
    cooldown: number; // milliseconds
}

// Alert Types
export interface Alert {
    id: string;
    type: 'performance' | 'error' | 'availability' | 'security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    metric: string;
    threshold: number;
    currentValue: number;
    timestamp: Date;
    resolved: boolean;
    resolvedAt?: Date;
}

export interface AlertRule {
    id: string;
    name: string;
    metric: string;
    condition: 'greater-than' | 'less-than' | 'equals';
    threshold: number;
    duration: number; // milliseconds - how long condition must persist
    severity: Alert['severity'];
    enabled: boolean;
    notifications: AlertNotification[];
}

export interface AlertNotification {
    type: 'email' | 'slack' | 'webhook' | 'sms';
    target: string;
    template?: string;
}

// Performance Monitoring Service Interface
export interface PerformanceMonitoringService {
    initialize(config: PerformanceConfig): Promise<void>;
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;

    // Metrics
    collectMetrics(): Promise<PerformanceMetrics>;
    getMetrics(timeRange?: { start: Date; end: Date }): Promise<PerformanceMetrics[]>;

    // Tracing
    startTrace(operationName: string, tags?: Record<string, any>): TraceSpan;
    finishTrace(span: TraceSpan): void;
    getTraces(filters?: TraceFilters): Promise<TraceSpan[]>;

    // Load Balancing
    configureLoadBalancer(config: LoadBalancerConfig): Promise<void>;
    getHealthyNodes(): LoadBalancerNode[];
    selectNode(clientIp?: string): LoadBalancerNode | null;

    // Auto Scaling
    evaluateScaling(): Promise<ScalingDecision>;
    executeScaling(decision: ScalingDecision): Promise<void>;

    // Alerts
    createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert>;
    resolveAlert(alertId: string): Promise<void>;
    getActiveAlerts(): Promise<Alert[]>;

    // Health Check
    healthCheck(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, { status: string; responseTime?: number; error?: string }>;
        timestamp: Date;
    }>;
}

export interface TraceFilters {
    traceId?: string;
    operationName?: string;
    status?: TraceSpan['status'];
    minDuration?: number;
    maxDuration?: number;
    startTime?: Date;
    endTime?: Date;
    tags?: Record<string, any>;
}

// Database Performance Types
export interface QueryPerformance {
    query: string;
    executionTime: number; // milliseconds
    rowsAffected: number;
    timestamp: Date;
    parameters?: any[];
    error?: string;
}

export interface DatabaseOptimization {
    type: 'index' | 'query' | 'schema' | 'connection';
    recommendation: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    estimatedImprovement: string;
}

// Cache Performance Types
export interface CacheInvalidationStrategy {
    type: 'ttl' | 'lru' | 'lfu' | 'manual' | 'event-based';
    config: Record<string, any>;
}

export interface CacheOptimization {
    key: string;
    hitRate: number;
    accessFrequency: number;
    size: number; // bytes
    ttl: number; // seconds
    recommendation: 'increase-ttl' | 'decrease-ttl' | 'remove' | 'optimize-size';
}