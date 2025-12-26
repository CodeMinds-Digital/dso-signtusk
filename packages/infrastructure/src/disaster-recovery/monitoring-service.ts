import { EventEmitter } from 'events';
import { CacheService } from '@signtusk/cache';
import { JobService } from '@signtusk/jobs';
import {
    DisasterRecoveryConfig,
    DisasterRecoveryHealth,
    DisasterRecoveryMetrics,
    HealthStatus,
    TimeRange,
    BackupMetadata,
    ReplicationStatus,
    RecoveryPlan,
} from './types';
import { BackupService } from './backup-service';
import { ReplicationService } from './replication-service';
import { RecoveryService } from './recovery-service';

export class MonitoringService extends EventEmitter {
    private config: DisasterRecoveryConfig;
    private cache: CacheService;
    private jobs: JobService;
    private backupService: BackupService;
    private replicationService: ReplicationService;
    private recoveryService: RecoveryService;
    private metricsCollectionInterval?: NodeJS.Timeout;
    private alertingEnabled: boolean = true;

    constructor(
        config: DisasterRecoveryConfig,
        cache: CacheService,
        jobs: JobService,
        backupService: BackupService,
        replicationService: ReplicationService,
        recoveryService: RecoveryService
    ) {
        super();
        this.config = config;
        this.cache = cache;
        this.jobs = jobs;
        this.backupService = backupService;
        this.replicationService = replicationService;
        this.recoveryService = recoveryService;

        this.initializeMonitoring();
    }

    async getHealthStatus(): Promise<DisasterRecoveryHealth> {
        try {
            // Get backup health
            const backupHealth = await this.getBackupHealth();

            // Get replication health
            const replicationHealth = await this.getReplicationHealth();

            // Get recovery health
            const recoveryHealth = await this.getRecoveryHealth();

            // Determine overall health
            const overallHealth = this.calculateOverallHealth([
                backupHealth.status,
                replicationHealth.status,
                recoveryHealth.status,
            ]);

            const health: DisasterRecoveryHealth = {
                overall: overallHealth,
                backup: backupHealth,
                replication: replicationHealth,
                recovery: recoveryHealth,
            };

            // Cache health status
            await this.cache.set('dr:health', JSON.stringify(health), { ttl: 60 }); // 1 minute

            // Check for alerts
            await this.checkHealthAlerts(health);

            return health;

        } catch (error) {
            const errorHealth: DisasterRecoveryHealth = {
                overall: HealthStatus.CRITICAL,
                backup: {
                    status: HealthStatus.UNKNOWN,
                    lastBackup: new Date(0),
                    nextBackup: new Date(0),
                    failedBackups: 0,
                },
                replication: {
                    status: HealthStatus.UNKNOWN,
                    regions: [],
                    maxLag: 0,
                },
                recovery: {
                    status: HealthStatus.UNKNOWN,
                    plansCount: 0,
                    lastTest: new Date(0),
                    nextTest: new Date(0),
                },
            };

            this.emit('healthCheckError', { error });
            return errorHealth;
        }
    }

    async getMetrics(timeRange: TimeRange): Promise<DisasterRecoveryMetrics> {
        try {
            // Get backup metrics
            const backupMetrics = await this.getBackupMetrics(timeRange);

            // Get replication metrics
            const replicationMetrics = await this.getReplicationMetrics(timeRange);

            // Get recovery metrics
            const recoveryMetrics = await this.getRecoveryMetrics(timeRange);

            // Get storage metrics
            const storageMetrics = await this.getStorageMetrics();

            const metrics: DisasterRecoveryMetrics = {
                backups: backupMetrics,
                replication: replicationMetrics,
                recovery: recoveryMetrics,
                storage: storageMetrics,
            };

            // Cache metrics
            const cacheKey = `dr:metrics:${timeRange.start.getTime()}-${timeRange.end.getTime()}`;
            await this.cache.set(cacheKey, JSON.stringify(metrics), { ttl: 300 }); // 5 minutes

            return metrics;

        } catch (error) {
            this.emit('metricsError', { error, timeRange });
            throw error;
        }
    }

    async collectMetrics(): Promise<void> {
        try {
            const timestamp = new Date();

            // Collect current metrics
            const timeRange: TimeRange = {
                start: new Date(timestamp.getTime() - this.config.monitoring.metrics.aggregationInterval),
                end: timestamp,
            };

            const metrics = await this.getMetrics(timeRange);

            // Store metrics for historical analysis
            await this.storeMetrics(timestamp, metrics);

            this.emit('metricsCollected', { timestamp, metrics });

        } catch (error) {
            this.emit('metricsCollectionError', { error });
        }
    }

    private async getBackupHealth(): Promise<DisasterRecoveryHealth['backup']> {
        try {
            // Get recent backups
            const recentBackups = await this.backupService.listBackups({
                fromDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            });

            const completedBackups = recentBackups.filter(b => b.status === 'completed');
            const failedBackups = recentBackups.filter(b => b.status === 'failed');

            const lastBackup = completedBackups.length > 0
                ? completedBackups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0].timestamp
                : new Date(0);

            // Calculate next backup time (simplified)
            const nextBackup = new Date(lastBackup.getTime() + 24 * 60 * 60 * 1000); // Next day

            let status: HealthStatus;
            if (failedBackups.length > 3) {
                status = HealthStatus.CRITICAL;
            } else if (failedBackups.length > 0 || Date.now() - lastBackup.getTime() > 36 * 60 * 60 * 1000) {
                status = HealthStatus.WARNING;
            } else {
                status = HealthStatus.HEALTHY;
            }

            return {
                status,
                lastBackup,
                nextBackup,
                failedBackups: failedBackups.length,
            };

        } catch (error) {
            return {
                status: HealthStatus.CRITICAL,
                lastBackup: new Date(0),
                nextBackup: new Date(0),
                failedBackups: 0,
            };
        }
    }

    private async getReplicationHealth(): Promise<DisasterRecoveryHealth['replication']> {
        try {
            const replicationStatuses = await this.replicationService.getReplicationStatus();

            const healthyRegions = replicationStatuses.filter(r => r.status === 'healthy').length;
            const totalRegions = replicationStatuses.length;
            const maxLag = Math.max(...replicationStatuses.map(r => r.lagMs), 0);

            let status: HealthStatus;
            if (healthyRegions === 0) {
                status = HealthStatus.CRITICAL;
            } else if (healthyRegions < totalRegions * 0.5) {
                status = HealthStatus.CRITICAL;
            } else if (healthyRegions < totalRegions || maxLag > this.config.replication.consistency.maxLagMs) {
                status = HealthStatus.WARNING;
            } else {
                status = HealthStatus.HEALTHY;
            }

            return {
                status,
                regions: replicationStatuses,
                maxLag,
            };

        } catch (error) {
            return {
                status: HealthStatus.CRITICAL,
                regions: [],
                maxLag: 0,
            };
        }
    }

    private async getRecoveryHealth(): Promise<DisasterRecoveryHealth['recovery']> {
        try {
            const recoveryPlans = await this.recoveryService.listRecoveryPlans();
            const criticalPlans = recoveryPlans.filter(p => p.priority === 'critical');

            // Check when plans were last tested
            const now = Date.now();
            const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

            const recentlyTested = recoveryPlans.filter(p => p.lastTested.getTime() > monthAgo);
            const lastTest = recoveryPlans.length > 0
                ? Math.max(...recoveryPlans.map(p => p.lastTested.getTime()))
                : 0;

            // Calculate next test time (simplified)
            const nextTest = new Date(lastTest + 30 * 24 * 60 * 60 * 1000); // Next month

            let status: HealthStatus;
            if (criticalPlans.length === 0) {
                status = HealthStatus.WARNING; // No critical recovery plans
            } else if (recentlyTested.length < recoveryPlans.length * 0.8) {
                status = HealthStatus.WARNING; // Many plans not recently tested
            } else {
                status = HealthStatus.HEALTHY;
            }

            return {
                status,
                plansCount: recoveryPlans.length,
                lastTest: new Date(lastTest),
                nextTest,
            };

        } catch (error) {
            return {
                status: HealthStatus.CRITICAL,
                plansCount: 0,
                lastTest: new Date(0),
                nextTest: new Date(0),
            };
        }
    }

    private async getBackupMetrics(timeRange: TimeRange): Promise<DisasterRecoveryMetrics['backups']> {
        const backups = await this.backupService.listBackups({
            fromDate: timeRange.start,
            toDate: timeRange.end,
        });

        const successful = backups.filter(b => b.status === 'completed');
        const failed = backups.filter(b => b.status === 'failed');

        const averageSize = successful.length > 0
            ? successful.reduce((sum, b) => sum + b.size, 0) / successful.length
            : 0;

        // In a real implementation, we would track backup duration
        const averageDuration = 300000; // 5 minutes (mock)

        return {
            total: backups.length,
            successful: successful.length,
            failed: failed.length,
            averageSize,
            averageDuration,
        };
    }

    private async getReplicationMetrics(timeRange: TimeRange): Promise<DisasterRecoveryMetrics['replication']> {
        const replicationStatuses = await this.replicationService.getReplicationStatus();

        const averageLag = replicationStatuses.length > 0
            ? replicationStatuses.reduce((sum, r) => sum + r.lagMs, 0) / replicationStatuses.length
            : 0;

        const syncErrors = replicationStatuses.reduce((sum, r) => sum + r.errorCount, 0);

        // In a real implementation, we would track actual data transferred
        const dataTransferred = 1024 * 1024 * 100; // 100MB (mock)

        return {
            averageLag,
            syncErrors,
            dataTransferred,
        };
    }

    private async getRecoveryMetrics(timeRange: TimeRange): Promise<DisasterRecoveryMetrics['recovery']> {
        const recoveryPlans = await this.recoveryService.listRecoveryPlans();

        // Count tests executed in time range
        let testsExecuted = 0;
        let testsSuccessful = 0;
        let totalRTO = 0;
        let totalRPO = 0;

        for (const plan of recoveryPlans) {
            const testsInRange = plan.testResults.filter(t =>
                t.timestamp >= timeRange.start && t.timestamp <= timeRange.end
            );

            testsExecuted += testsInRange.length;
            testsSuccessful += testsInRange.filter(t => t.success).length;
            totalRTO += plan.estimatedRTO;
            totalRPO += plan.estimatedRPO;
        }

        const averageRTO = recoveryPlans.length > 0 ? totalRTO / recoveryPlans.length : 0;
        const averageRPO = recoveryPlans.length > 0 ? totalRPO / recoveryPlans.length : 0;

        return {
            testsExecuted,
            testsSuccessful,
            averageRTO,
            averageRPO,
        };
    }

    private async getStorageMetrics(): Promise<DisasterRecoveryMetrics['storage']> {
        // In a real implementation, this would query actual storage usage
        return {
            totalUsed: 1024 * 1024 * 1024 * 50, // 50GB (mock)
            totalAvailable: 1024 * 1024 * 1024 * 1000, // 1TB (mock)
            utilizationPercent: 5, // 5% (mock)
        };
    }

    private calculateOverallHealth(statuses: HealthStatus[]): HealthStatus {
        if (statuses.includes(HealthStatus.CRITICAL)) {
            return HealthStatus.CRITICAL;
        }
        if (statuses.includes(HealthStatus.WARNING)) {
            return HealthStatus.WARNING;
        }
        if (statuses.includes(HealthStatus.UNKNOWN)) {
            return HealthStatus.UNKNOWN;
        }
        return HealthStatus.HEALTHY;
    }

    private async checkHealthAlerts(health: DisasterRecoveryHealth): Promise<void> {
        if (!this.alertingEnabled || !this.config.monitoring.enabled) {
            return;
        }

        const alerts: string[] = [];

        // Check backup alerts
        if (health.backup.status === HealthStatus.CRITICAL) {
            alerts.push(`Backup system is in critical state. Failed backups: ${health.backup.failedBackups}`);
        } else if (health.backup.status === HealthStatus.WARNING) {
            alerts.push(`Backup system needs attention. Last backup: ${health.backup.lastBackup.toISOString()}`);
        }

        // Check replication alerts
        if (health.replication.status === HealthStatus.CRITICAL) {
            const unhealthyRegions = health.replication.regions.filter(r => r.status !== 'healthy');
            alerts.push(`Replication system is in critical state. Unhealthy regions: ${unhealthyRegions.map(r => r.region).join(', ')}`);
        } else if (health.replication.status === HealthStatus.WARNING) {
            alerts.push(`Replication system has issues. Max lag: ${health.replication.maxLag}ms`);
        }

        // Check recovery alerts
        if (health.recovery.status === HealthStatus.CRITICAL) {
            alerts.push('Recovery system is in critical state. Check recovery plans.');
        } else if (health.recovery.status === HealthStatus.WARNING) {
            alerts.push(`Recovery system needs attention. Plans count: ${health.recovery.plansCount}, Last test: ${health.recovery.lastTest.toISOString()}`);
        }

        // Send alerts
        for (const alert of alerts) {
            await this.sendAlert(alert, health.overall);
        }
    }

    private async sendAlert(message: string, severity: HealthStatus): Promise<void> {
        try {
            const alertData = {
                message,
                severity,
                timestamp: new Date(),
                service: 'disaster-recovery',
            };

            // Send email alerts
            if (this.config.monitoring.alerting.email.length > 0) {
                await this.sendEmailAlert(alertData);
            }

            // Send webhook alerts
            if (this.config.monitoring.alerting.webhook) {
                await this.sendWebhookAlert(alertData);
            }

            // Send Slack alerts
            if (this.config.monitoring.alerting.slack) {
                await this.sendSlackAlert(alertData);
            }

            this.emit('alertSent', alertData);

        } catch (error) {
            this.emit('alertError', { message, error });
        }
    }

    private async sendEmailAlert(alertData: any): Promise<void> {
        // In a real implementation, this would send actual emails
        console.log(`Email alert: ${alertData.message}`);
    }

    private async sendWebhookAlert(alertData: any): Promise<void> {
        // In a real implementation, this would send HTTP POST to webhook URL
        console.log(`Webhook alert: ${alertData.message}`);
    }

    private async sendSlackAlert(alertData: any): Promise<void> {
        // In a real implementation, this would send to Slack
        console.log(`Slack alert: ${alertData.message}`);
    }

    private async storeMetrics(timestamp: Date, metrics: DisasterRecoveryMetrics): Promise<void> {
        // Store metrics for historical analysis
        const metricsKey = `dr:metrics:${timestamp.getTime()}`;
        await this.cache.set(metricsKey, JSON.stringify(metrics), {
            ttl: this.config.monitoring.metrics.retentionDays * 24 * 60 * 60
        });
    }

    private async initializeMonitoring(): Promise<void> {
        if (!this.config.monitoring.enabled) {
            return;
        }

        // Start metrics collection
        this.metricsCollectionInterval = setInterval(
            () => this.collectMetrics(),
            this.config.monitoring.metrics.aggregationInterval
        );

        // Set up monitoring jobs
        this.jobs.defineJob({
            name: 'dr-health-check',
            handler: async () => {
                try {
                    const result = await this.getHealthStatus();
                    return { success: true, data: result };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Health check failed'
                    };
                }
            },
        });

        this.jobs.defineJob({
            name: 'dr-metrics-collection',
            handler: async () => {
                try {
                    await this.collectMetrics();
                    return { success: true };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Metrics collection failed'
                    };
                }
            },
        });

        // Enqueue initial health check
        await this.jobs.enqueue('dr-health-check', {});

        // Enqueue initial metrics collection
        await this.jobs.enqueue('dr-metrics-collection', {});

        this.emit('monitoringInitialized');
    }

    async shutdown(): Promise<void> {
        if (this.metricsCollectionInterval) {
            clearInterval(this.metricsCollectionInterval);
        }

        this.alertingEnabled = false;
        this.emit('monitoringShutdown');
    }
}