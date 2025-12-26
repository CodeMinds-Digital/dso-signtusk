import { z } from 'zod';

// Backup Configuration Schema
export const BackupConfigSchema = z.object({
    enabled: z.boolean().default(true),
    schedule: z.string().default('0 2 * * *'), // Daily at 2 AM
    retention: z.object({
        daily: z.number().default(7),
        weekly: z.number().default(4),
        monthly: z.number().default(12),
        yearly: z.number().default(3),
    }),
    encryption: z.object({
        enabled: z.boolean().default(true),
        algorithm: z.string().default('AES-256-GCM'),
        keyRotationDays: z.number().default(90),
    }),
    compression: z.object({
        enabled: z.boolean().default(true),
        algorithm: z.string().default('gzip'),
        level: z.number().min(1).max(9).default(6),
    }),
    storage: z.object({
        primary: z.string(), // Primary storage location
        replicas: z.array(z.string()).default([]), // Cross-region replicas
        verifyIntegrity: z.boolean().default(true),
    }),
});

// Replication Configuration Schema
export const ReplicationConfigSchema = z.object({
    enabled: z.boolean().default(true),
    mode: z.enum(['synchronous', 'asynchronous']).default('asynchronous'),
    regions: z.array(z.object({
        name: z.string(),
        endpoint: z.string(),
        priority: z.number().default(1), // Lower number = higher priority
        healthCheckInterval: z.number().default(30000), // 30 seconds
    })),
    consistency: z.object({
        level: z.enum(['eventual', 'strong']).default('eventual'),
        maxLagMs: z.number().default(5000), // 5 seconds
    }),
    failover: z.object({
        automatic: z.boolean().default(true),
        threshold: z.number().default(3), // Failed health checks before failover
        cooldownMs: z.number().default(300000), // 5 minutes
    }),
});

// Disaster Recovery Configuration Schema
export const DisasterRecoveryConfigSchema = z.object({
    backup: BackupConfigSchema,
    replication: ReplicationConfigSchema,
    monitoring: z.object({
        enabled: z.boolean().default(true),
        alerting: z.object({
            email: z.array(z.string()).default([]),
            webhook: z.string().optional(),
            slack: z.string().optional(),
        }),
        metrics: z.object({
            retentionDays: z.number().default(90),
            aggregationInterval: z.number().default(300000), // 5 minutes
        }),
    }),
    recovery: z.object({
        rto: z.number().default(3600), // Recovery Time Objective in seconds (1 hour)
        rpo: z.number().default(900), // Recovery Point Objective in seconds (15 minutes)
        testSchedule: z.string().default('0 0 1 * *'), // Monthly on 1st at midnight
        autoRecovery: z.boolean().default(false), // Manual approval required by default
    }),
});

export type BackupConfig = z.infer<typeof BackupConfigSchema>;
export type ReplicationConfig = z.infer<typeof ReplicationConfigSchema>;
export type DisasterRecoveryConfig = z.infer<typeof DisasterRecoveryConfigSchema>;

// Backup Types
export interface BackupMetadata {
    id: string;
    timestamp: Date;
    type: BackupType;
    size: number;
    checksum: string;
    encrypted: boolean;
    compressed: boolean;
    location: string;
    replicas: string[];
    status: BackupStatus;
    retentionUntil: Date;
    tags: Record<string, string>;
}

export enum BackupType {
    FULL = 'full',
    INCREMENTAL = 'incremental',
    DIFFERENTIAL = 'differential',
    TRANSACTION_LOG = 'transaction_log',
}

export enum BackupStatus {
    PENDING = 'pending',
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    FAILED = 'failed',
    EXPIRED = 'expired',
    CORRUPTED = 'corrupted',
}

// Replication Types
export interface ReplicationStatus {
    region: string;
    status: ReplicationHealth;
    lastSync: Date;
    lagMs: number;
    errorCount: number;
    lastError?: string;
}

export enum ReplicationHealth {
    HEALTHY = 'healthy',
    DEGRADED = 'degraded',
    UNHEALTHY = 'unhealthy',
    OFFLINE = 'offline',
    UNKNOWN = 'unknown',
}

// Recovery Types
export interface RecoveryPlan {
    id: string;
    name: string;
    description: string;
    priority: RecoveryPriority;
    steps: RecoveryStep[];
    dependencies: string[];
    estimatedRTO: number; // seconds
    estimatedRPO: number; // seconds
    lastTested: Date;
    testResults: TestResult[];
}

export enum RecoveryPriority {
    CRITICAL = 'critical',
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low',
}

export interface RecoveryStep {
    id: string;
    name: string;
    description: string;
    type: RecoveryStepType;
    automated: boolean;
    estimatedDuration: number; // seconds
    dependencies: string[];
    script?: string;
    rollbackScript?: string;
    validation: ValidationCheck[];
}

export enum RecoveryStepType {
    BACKUP_RESTORE = 'backup_restore',
    FAILOVER = 'failover',
    SERVICE_START = 'service_start',
    SERVICE_STOP = 'service_stop',
    DATA_SYNC = 'data_sync',
    VALIDATION = 'validation',
    NOTIFICATION = 'notification',
    CUSTOM_SCRIPT = 'custom_script',
}

export interface ValidationCheck {
    name: string;
    type: ValidationType;
    target: string;
    expected: any;
    timeout: number;
}

export enum ValidationType {
    HTTP_STATUS = 'http_status',
    DATABASE_QUERY = 'database_query',
    FILE_EXISTS = 'file_exists',
    SERVICE_RUNNING = 'service_running',
    CUSTOM_SCRIPT = 'custom_script',
}

export interface TestResult {
    id: string;
    timestamp: Date;
    success: boolean;
    duration: number;
    steps: StepResult[];
    issues: string[];
    recommendations: string[];
}

export interface StepResult {
    stepId: string;
    success: boolean;
    duration: number;
    error?: string;
    output?: string;
}

// Disaster Recovery Service Interface
export interface DisasterRecoveryService {
    // Backup Management
    createBackup(type: BackupType, tags?: Record<string, string>): Promise<BackupMetadata>;
    listBackups(filters?: BackupFilters): Promise<BackupMetadata[]>;
    restoreBackup(backupId: string, options?: RestoreOptions): Promise<RestoreResult>;
    deleteBackup(backupId: string): Promise<void>;
    verifyBackup(backupId: string): Promise<VerificationResult>;

    // Replication Management
    getReplicationStatus(): Promise<ReplicationStatus[]>;
    triggerReplication(region?: string): Promise<void>;
    pauseReplication(region: string): Promise<void>;
    resumeReplication(region: string): Promise<void>;

    // Recovery Management
    createRecoveryPlan(plan: Omit<RecoveryPlan, 'id' | 'lastTested' | 'testResults'>): Promise<RecoveryPlan>;
    executeRecoveryPlan(planId: string, options?: ExecutionOptions): Promise<ExecutionResult>;
    testRecoveryPlan(planId: string): Promise<TestResult>;
    listRecoveryPlans(): Promise<RecoveryPlan[]>;

    // Monitoring and Alerting
    getHealthStatus(): Promise<DisasterRecoveryHealth>;
    getMetrics(timeRange: TimeRange): Promise<DisasterRecoveryMetrics>;

    // Configuration
    updateConfig(config: Partial<DisasterRecoveryConfig>): Promise<void>;
    getConfig(): Promise<DisasterRecoveryConfig>;
}

export interface BackupFilters {
    type?: BackupType;
    status?: BackupStatus;
    fromDate?: Date;
    toDate?: Date;
    tags?: Record<string, string>;
}

export interface RestoreOptions {
    targetLocation?: string;
    pointInTime?: Date;
    validateOnly?: boolean;
    overwrite?: boolean;
}

export interface RestoreResult {
    success: boolean;
    duration: number;
    restoredSize: number;
    location: string;
    error?: string;
    warnings: string[];
}

export interface VerificationResult {
    valid: boolean;
    checksum: string;
    size: number;
    error?: string;
    details: Record<string, any>;
}

export interface ExecutionOptions {
    dryRun?: boolean;
    skipSteps?: string[];
    continueOnError?: boolean;
    notifyOnCompletion?: boolean;
}

export interface ExecutionResult {
    success: boolean;
    duration: number;
    steps: StepResult[];
    rollbackRequired: boolean;
    rollbackSteps?: StepResult[];
}

export interface DisasterRecoveryHealth {
    overall: HealthStatus;
    backup: {
        status: HealthStatus;
        lastBackup: Date;
        nextBackup: Date;
        failedBackups: number;
    };
    replication: {
        status: HealthStatus;
        regions: ReplicationStatus[];
        maxLag: number;
    };
    recovery: {
        status: HealthStatus;
        plansCount: number;
        lastTest: Date;
        nextTest: Date;
    };
}

export enum HealthStatus {
    HEALTHY = 'healthy',
    WARNING = 'warning',
    CRITICAL = 'critical',
    UNKNOWN = 'unknown',
}

export interface DisasterRecoveryMetrics {
    backups: {
        total: number;
        successful: number;
        failed: number;
        averageSize: number;
        averageDuration: number;
    };
    replication: {
        averageLag: number;
        syncErrors: number;
        dataTransferred: number;
    };
    recovery: {
        testsExecuted: number;
        testsSuccessful: number;
        averageRTO: number;
        averageRPO: number;
    };
    storage: {
        totalUsed: number;
        totalAvailable: number;
        utilizationPercent: number;
    };
}

export interface TimeRange {
    start: Date;
    end: Date;
}