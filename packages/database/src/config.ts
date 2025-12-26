/**
 * Database Configuration and Optimization Settings
 * 
 * This file contains comprehensive database configuration for the DocuSign Alternative
 * e-signature platform, including connection pooling, performance optimization,
 * and audit trail settings.
 */

export interface DatabaseConfig {
    // Connection settings
    url: string;
    poolSize: number;
    poolTimeout: number;
    connectionTimeout: number;

    // Performance settings
    queryTimeout: number;
    statementTimeout: number;
    idleTimeout: number;

    // Logging settings
    logLevel: 'query' | 'info' | 'warn' | 'error';
    logQueries: boolean;
    logSlowQueries: boolean;
    slowQueryThreshold: number;

    // Migration settings
    migrationLockTimeout: number;
    migrationTimeout: number;

    // Audit trail settings
    auditRetentionDays: number;
    auditCompressionEnabled: boolean;
    auditIntegrityChecks: boolean;
}

// Default configuration
export const defaultDatabaseConfig: DatabaseConfig = {
    // Connection settings
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/docusign_alternative',
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE || '10'),
    poolTimeout: parseInt(process.env.DATABASE_POOL_TIMEOUT || '20000'),
    connectionTimeout: parseInt(process.env.DATABASE_CONNECTION_TIMEOUT || '10000'),

    // Performance settings
    queryTimeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || '30000'),
    statementTimeout: parseInt(process.env.DATABASE_STATEMENT_TIMEOUT || '60000'),
    idleTimeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '300000'),

    // Logging settings
    logLevel: (process.env.DATABASE_LOG_LEVEL as any) || 'error',
    logQueries: process.env.NODE_ENV === 'development',
    logSlowQueries: process.env.DATABASE_LOG_SLOW_QUERIES === 'true',
    slowQueryThreshold: parseInt(process.env.DATABASE_SLOW_QUERY_THRESHOLD || '1000'),

    // Migration settings
    migrationLockTimeout: parseInt(process.env.MIGRATION_LOCK_TIMEOUT || '10000'),
    migrationTimeout: parseInt(process.env.MIGRATION_TIMEOUT || '300000'),

    // Audit trail settings
    auditRetentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '2555'), // 7 years
    auditCompressionEnabled: process.env.AUDIT_COMPRESSION_ENABLED !== 'false',
    auditIntegrityChecks: process.env.AUDIT_INTEGRITY_CHECKS !== 'false',
};

// Production optimizations
export const productionDatabaseConfig: Partial<DatabaseConfig> = {
    poolSize: 20,
    poolTimeout: 30000,
    queryTimeout: 60000,
    logLevel: 'warn',
    logQueries: false,
    logSlowQueries: true,
    slowQueryThreshold: 500,
};

// Development optimizations
export const developmentDatabaseConfig: Partial<DatabaseConfig> = {
    poolSize: 5,
    poolTimeout: 10000,
    queryTimeout: 10000,
    logLevel: 'query',
    logQueries: true,
    logSlowQueries: true,
    slowQueryThreshold: 100,
};

// Test environment optimizations
export const testDatabaseConfig: Partial<DatabaseConfig> = {
    poolSize: 2,
    poolTimeout: 5000,
    queryTimeout: 5000,
    logLevel: 'error',
    logQueries: false,
    logSlowQueries: false,
    auditIntegrityChecks: false,
};

// Get environment-specific configuration
export function getDatabaseConfig(): DatabaseConfig {
    const baseConfig = { ...defaultDatabaseConfig };

    switch (process.env.NODE_ENV) {
        case 'production':
            return { ...baseConfig, ...productionDatabaseConfig };
        case 'development':
            return { ...baseConfig, ...developmentDatabaseConfig };
        case 'test':
            return { ...baseConfig, ...testDatabaseConfig };
        default:
            return baseConfig;
    }
}

// PostgreSQL-specific optimization settings
export const postgresOptimizations = {
    // Connection pool settings
    maxConnections: 100,
    sharedBuffers: '256MB',
    effectiveCacheSize: '1GB',
    workMem: '4MB',
    maintenanceWorkMem: '64MB',

    // Query optimization
    randomPageCost: 1.1,
    effectiveIoConcurrency: 200,

    // WAL settings for performance
    walBuffers: '16MB',
    checkpointCompletionTarget: 0.9,

    // Logging settings
    logMinDurationStatement: 1000, // Log queries taking more than 1 second
    logLinePrefix: '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ',
    logCheckpoints: true,
    logConnections: true,
    logDisconnections: true,

    // Audit trail optimizations
    auditLogFormat: 'json',
    auditLogRotation: 'daily',
    auditLogRetention: '7 years',
};

// Database monitoring configuration
export interface MonitoringConfig {
    healthCheckInterval: number;
    performanceMetricsInterval: number;
    connectionPoolMonitoring: boolean;
    queryPerformanceMonitoring: boolean;
    auditTrailMonitoring: boolean;
    alertThresholds: {
        connectionPoolUtilization: number;
        queryLatency: number;
        errorRate: number;
        diskUsage: number;
    };
}

export const defaultMonitoringConfig: MonitoringConfig = {
    healthCheckInterval: 30000, // 30 seconds
    performanceMetricsInterval: 60000, // 1 minute
    connectionPoolMonitoring: true,
    queryPerformanceMonitoring: true,
    auditTrailMonitoring: true,
    alertThresholds: {
        connectionPoolUtilization: 0.8, // 80%
        queryLatency: 1000, // 1 second
        errorRate: 0.01, // 1%
        diskUsage: 0.85, // 85%
    },
};

// Security configuration for audit trails
export interface AuditSecurityConfig {
    encryptionEnabled: boolean;
    encryptionAlgorithm: string;
    integrityChecksEnabled: boolean;
    hashAlgorithm: string;
    immutableStorage: boolean;
    accessLogging: boolean;
    retentionPolicy: {
        enabled: boolean;
        retentionPeriodDays: number;
        archiveAfterDays: number;
        compressionEnabled: boolean;
    };
}

export const defaultAuditSecurityConfig: AuditSecurityConfig = {
    encryptionEnabled: process.env.AUDIT_ENCRYPTION_ENABLED === 'true',
    encryptionAlgorithm: 'AES-256-GCM',
    integrityChecksEnabled: true,
    hashAlgorithm: 'SHA-256',
    immutableStorage: true,
    accessLogging: true,
    retentionPolicy: {
        enabled: true,
        retentionPeriodDays: 2555, // 7 years
        archiveAfterDays: 365, // 1 year
        compressionEnabled: true,
    },
};

// Export configuration getter
export function getAuditSecurityConfig(): AuditSecurityConfig {
    return {
        ...defaultAuditSecurityConfig,
        encryptionEnabled: process.env.NODE_ENV === 'production' ||
            process.env.AUDIT_ENCRYPTION_ENABLED === 'true',
    };
}