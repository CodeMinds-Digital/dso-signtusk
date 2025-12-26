import { StorageService } from '@signtusk/storage';
import { CacheService } from '@signtusk/cache';
import { JobService } from '@signtusk/jobs';
import { DisasterRecoveryConfig, DisasterRecoveryService } from './types';
import { DisasterRecoveryServiceImpl } from './disaster-recovery-service';

/**
 * Factory function to create a disaster recovery service instance
 */
export function createDisasterRecoveryService(
    config: DisasterRecoveryConfig,
    storage: StorageService,
    cache: CacheService,
    jobs: JobService
): DisasterRecoveryService {
    return new DisasterRecoveryServiceImpl(config, storage, cache, jobs);
}

/**
 * Create a default disaster recovery configuration
 */
export function createDefaultDisasterRecoveryConfig(): DisasterRecoveryConfig {
    return {
        backup: {
            enabled: true,
            schedule: '0 2 * * *', // Daily at 2 AM
            retention: {
                daily: 7,
                weekly: 4,
                monthly: 12,
                yearly: 3,
            },
            encryption: {
                enabled: true,
                algorithm: 'AES-256-GCM',
                keyRotationDays: 90,
            },
            compression: {
                enabled: true,
                algorithm: 'gzip',
                level: 6,
            },
            storage: {
                primary: 's3://disaster-recovery-primary',
                replicas: [
                    's3://disaster-recovery-replica-us-west',
                    's3://disaster-recovery-replica-eu-west',
                ],
                verifyIntegrity: true,
            },
        },
        replication: {
            enabled: true,
            mode: 'asynchronous',
            regions: [
                {
                    name: 'us-east-1',
                    endpoint: 'https://us-east-1.docusign-alternative.com',
                    priority: 1,
                    healthCheckInterval: 30000,
                },
                {
                    name: 'us-west-2',
                    endpoint: 'https://us-west-2.docusign-alternative.com',
                    priority: 2,
                    healthCheckInterval: 30000,
                },
                {
                    name: 'eu-west-1',
                    endpoint: 'https://eu-west-1.docusign-alternative.com',
                    priority: 3,
                    healthCheckInterval: 30000,
                },
            ],
            consistency: {
                level: 'eventual',
                maxLagMs: 5000,
            },
            failover: {
                automatic: true,
                threshold: 3,
                cooldownMs: 300000,
            },
        },
        monitoring: {
            enabled: true,
            alerting: {
                email: ['ops@signtusk.com'],
                webhook: 'https://hooks.slack.com/services/...',
                slack: 'https://hooks.slack.com/services/...',
            },
            metrics: {
                retentionDays: 90,
                aggregationInterval: 300000,
            },
        },
        recovery: {
            rto: 3600, // 1 hour
            rpo: 900,  // 15 minutes
            testSchedule: '0 0 1 * *', // Monthly
            autoRecovery: false,
        },
    };
}

/**
 * Validate disaster recovery configuration
 */
export function validateDisasterRecoveryConfig(config: DisasterRecoveryConfig): string[] {
    const errors: string[] = [];

    // Validate backup configuration
    if (config.backup.enabled) {
        if (!config.backup.storage.primary) {
            errors.push('Backup primary storage location is required when backup is enabled');
        }

        if (config.backup.retention.daily < 1) {
            errors.push('Daily backup retention must be at least 1 day');
        }

        if (config.backup.encryption.enabled && config.backup.encryption.keyRotationDays < 1) {
            errors.push('Key rotation days must be at least 1 when encryption is enabled');
        }
    }

    // Validate replication configuration
    if (config.replication.enabled) {
        if (config.replication.regions.length === 0) {
            errors.push('At least one replication region is required when replication is enabled');
        }

        for (const region of config.replication.regions) {
            if (!region.name || !region.endpoint) {
                errors.push(`Region ${region.name || 'unnamed'} must have both name and endpoint`);
            }

            if (region.healthCheckInterval < 1000) {
                errors.push(`Health check interval for region ${region.name} must be at least 1000ms`);
            }
        }

        if (config.replication.consistency.maxLagMs < 0) {
            errors.push('Maximum replication lag must be non-negative');
        }

        if (config.replication.failover.threshold < 1) {
            errors.push('Failover threshold must be at least 1');
        }
    }

    // Validate monitoring configuration
    if (config.monitoring.enabled) {
        if (config.monitoring.metrics.retentionDays < 1) {
            errors.push('Metrics retention must be at least 1 day');
        }

        if (config.monitoring.metrics.aggregationInterval < 60000) {
            errors.push('Metrics aggregation interval must be at least 60 seconds');
        }
    }

    // Validate recovery configuration
    if (config.recovery.rto < 0 || config.recovery.rpo < 0) {
        errors.push('RTO and RPO must be non-negative');
    }

    if (config.recovery.rpo > config.recovery.rto) {
        errors.push('RPO cannot be greater than RTO');
    }

    return errors;
}