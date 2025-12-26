import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DisasterRecoveryServiceImpl } from '../disaster-recovery/disaster-recovery-service';
import { createDefaultDisasterRecoveryConfig, validateDisasterRecoveryConfig } from '../disaster-recovery/factory';
import { BackupType, BackupStatus, RecoveryPriority, RecoveryStepType, HealthStatus } from '../disaster-recovery/types';

// Mock dependencies
const mockStorage = {
    upload: vi.fn(),
    uploadStream: vi.fn(),
    download: vi.fn(),
    downloadStream: vi.fn(),
    delete: vi.fn(),
    exists: vi.fn(),
    list: vi.fn(),
    getMetadata: vi.fn(),
};

const mockCache = {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    clear: vi.fn(),
    disconnect: vi.fn(),
};

const mockJobs = {
    defineJob: vi.fn(),
    enqueue: vi.fn(),
    scheduleJob: vi.fn(),
    getJobStatus: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
};

describe('Disaster Recovery System Unit Tests', () => {
    let drService: DisasterRecoveryServiceImpl;

    beforeEach(() => {
        vi.clearAllMocks();
        const config = createDefaultDisasterRecoveryConfig();
        drService = new DisasterRecoveryServiceImpl(
            config,
            mockStorage as any,
            mockCache as any,
            mockJobs as any
        );
    });

    afterEach(async () => {
        await drService.shutdown();
    });

    describe('Configuration Management', () => {
        it('should create default configuration with valid values', () => {
            const config = createDefaultDisasterRecoveryConfig();

            expect(config.backup.enabled).toBe(true);
            expect(config.backup.schedule).toBe('0 2 * * *');
            expect(config.backup.retention.daily).toBe(7);
            expect(config.backup.encryption.enabled).toBe(true);
            expect(config.replication.enabled).toBe(true);
            expect(config.replication.regions).toHaveLength(3);
            expect(config.monitoring.enabled).toBe(true);
            expect(config.recovery.rto).toBe(3600);
            expect(config.recovery.rpo).toBe(900);
        });

        it('should validate configuration correctly', () => {
            const validConfig = createDefaultDisasterRecoveryConfig();
            const errors = validateDisasterRecoveryConfig(validConfig);
            expect(errors).toHaveLength(0);

            // Test invalid configuration
            const invalidConfig = {
                ...validConfig,
                backup: {
                    ...validConfig.backup,
                    storage: {
                        ...validConfig.backup.storage,
                        primary: '', // Invalid empty primary storage
                    },
                },
                recovery: {
                    ...validConfig.recovery,
                    rpo: 7200, // RPO > RTO (invalid)
                },
            };

            const invalidErrors = validateDisasterRecoveryConfig(invalidConfig);
            expect(invalidErrors.length).toBeGreaterThan(0);
            expect(invalidErrors.some(e => e.includes('primary storage'))).toBe(true);
            expect(invalidErrors.some(e => e.includes('RPO cannot be greater than RTO'))).toBe(true);
        });

        it('should update configuration correctly', async () => {
            const originalConfig = await drService.getConfig();

            const configUpdate = {
                backup: {
                    ...originalConfig.backup,
                    enabled: false,
                },
                recovery: {
                    ...originalConfig.recovery,
                    rto: 7200,
                    rpo: 1800,
                },
            };

            await drService.updateConfig(configUpdate);
            const updatedConfig = await drService.getConfig();

            expect(updatedConfig.backup.enabled).toBe(false);
            expect(updatedConfig.recovery.rto).toBe(7200);
            expect(updatedConfig.recovery.rpo).toBe(1800);
        });
    });

    describe('Backup Management', () => {
        beforeEach(() => {
            mockStorage.uploadStream.mockResolvedValue(undefined);
            mockStorage.exists.mockResolvedValue(true);
            mockCache.set.mockResolvedValue(undefined);
            mockCache.get.mockResolvedValue(null);
        });

        it('should create backup with correct metadata', async () => {
            const tags = { environment: 'test', priority: 'high' };
            const backup = await drService.createBackup(BackupType.FULL, tags);

            expect(backup.id).toBeDefined();
            expect(backup.type).toBe(BackupType.FULL);
            expect(backup.tags).toEqual(tags);
            expect(backup.timestamp).toBeInstanceOf(Date);
            expect(backup.encrypted).toBe(true);
            expect(backup.compressed).toBe(true);
            expect(backup.status).toBe('completed');
        });

        it('should list backups with filters', async () => {
            mockCache.get.mockResolvedValue(null);

            const backups = await drService.listBackups({
                type: BackupType.FULL,
                status: BackupStatus.COMPLETED,
            });

            expect(Array.isArray(backups)).toBe(true);
        });

        it('should restore backup successfully', async () => {
            // Create a backup first
            const backup = await drService.createBackup(BackupType.FULL);

            // Mock restoration
            mockStorage.downloadStream.mockResolvedValue({
                pipe: vi.fn().mockReturnThis(),
            });
            mockCache.get.mockResolvedValue(JSON.stringify(backup));

            const restoreResult = await drService.restoreBackup(backup.id);

            expect(restoreResult.success).toBe(true);
            expect(restoreResult.duration).toBeGreaterThan(0);
        });

        it('should verify backup integrity', async () => {
            const backup = await drService.createBackup(BackupType.INCREMENTAL);

            mockStorage.downloadStream.mockResolvedValue({
                pipe: vi.fn().mockReturnThis(),
            });
            mockCache.get.mockResolvedValue(JSON.stringify(backup));

            const verification = await drService.verifyBackup(backup.id);

            expect(verification.valid).toBe(true);
            expect(verification.checksum).toBeDefined();
            expect(verification.size).toBeGreaterThanOrEqual(0);
        });

        it('should delete backup and cleanup', async () => {
            const backup = await drService.createBackup(BackupType.DIFFERENTIAL);

            mockStorage.delete.mockResolvedValue(undefined);
            mockCache.del.mockResolvedValue(undefined);
            mockCache.get.mockResolvedValue(JSON.stringify(backup));

            await expect(drService.deleteBackup(backup.id)).resolves.not.toThrow();
            expect(mockStorage.delete).toHaveBeenCalled();
            expect(mockCache.del).toHaveBeenCalled();
        });
    });

    describe('Recovery Plan Management', () => {
        it('should create recovery plan with valid structure', async () => {
            const planData = {
                name: 'Test Recovery Plan',
                description: 'A test recovery plan',
                priority: RecoveryPriority.HIGH,
                steps: [
                    {
                        id: 'step1',
                        name: 'Test Step',
                        description: 'A test step',
                        type: RecoveryStepType.VALIDATION,
                        automated: true,
                        estimatedDuration: 300,
                        dependencies: [],
                        validation: [],
                    },
                ],
                dependencies: [],
                estimatedRTO: 1800,
                estimatedRPO: 600,
            };

            const plan = await drService.createRecoveryPlan(planData);

            expect(plan.id).toBeDefined();
            expect(plan.name).toBe(planData.name);
            expect(plan.priority).toBe(planData.priority);
            expect(plan.steps).toHaveLength(1);
            expect(plan.lastTested).toBeInstanceOf(Date);
            expect(plan.testResults).toEqual([]);
        });

        it('should test recovery plan and return results', async () => {
            const plan = await drService.createRecoveryPlan({
                name: 'Test Plan',
                description: 'Test',
                priority: RecoveryPriority.MEDIUM,
                steps: [
                    {
                        id: 'test-step',
                        name: 'Test Step',
                        description: 'Test step',
                        type: RecoveryStepType.VALIDATION,
                        automated: true,
                        estimatedDuration: 100,
                        dependencies: [],
                        validation: [],
                    },
                ],
                dependencies: [],
                estimatedRTO: 600,
                estimatedRPO: 300,
            });

            const testResult = await drService.testRecoveryPlan(plan.id);

            expect(testResult.id).toBeDefined();
            expect(testResult.timestamp).toBeInstanceOf(Date);
            expect(typeof testResult.success).toBe('boolean');
            expect(testResult.duration).toBeGreaterThan(0);
            expect(testResult.steps).toHaveLength(1);
            expect(Array.isArray(testResult.issues)).toBe(true);
            expect(Array.isArray(testResult.recommendations)).toBe(true);
        });

        it('should execute recovery plan with dry run option', async () => {
            const plan = await drService.createRecoveryPlan({
                name: 'Execution Test Plan',
                description: 'Test execution',
                priority: RecoveryPriority.CRITICAL,
                steps: [
                    {
                        id: 'exec-step',
                        name: 'Execution Step',
                        description: 'Test execution step',
                        type: RecoveryStepType.SERVICE_START,
                        automated: true,
                        estimatedDuration: 200,
                        dependencies: [],
                        validation: [],
                    },
                ],
                dependencies: [],
                estimatedRTO: 1200,
                estimatedRPO: 400,
            });

            const executionResult = await drService.executeRecoveryPlan(plan.id, {
                dryRun: true,
            });

            expect(executionResult.success).toBe(true);
            expect(executionResult.duration).toBeGreaterThan(0);
            expect(executionResult.steps).toHaveLength(1);
            expect(executionResult.rollbackRequired).toBe(false);
        });

        it('should list recovery plans sorted by priority', async () => {
            // Create plans with different priorities
            await drService.createRecoveryPlan({
                name: 'Low Priority Plan',
                description: 'Low priority',
                priority: RecoveryPriority.LOW,
                steps: [],
                dependencies: [],
                estimatedRTO: 3600,
                estimatedRPO: 1800,
            });

            await drService.createRecoveryPlan({
                name: 'Critical Priority Plan',
                description: 'Critical priority',
                priority: RecoveryPriority.CRITICAL,
                steps: [],
                dependencies: [],
                estimatedRTO: 600,
                estimatedRPO: 300,
            });

            const plans = await drService.listRecoveryPlans();

            expect(plans).toHaveLength(2);
            expect(plans[0].priority).toBe(RecoveryPriority.CRITICAL);
            expect(plans[1].priority).toBe(RecoveryPriority.LOW);
        });
    });

    describe('Business Continuity Planning', () => {
        it('should create comprehensive business continuity plan', async () => {
            const bcpPlan = await drService.createBusinessContinuityPlan();

            expect(bcpPlan.name).toBe('Business Continuity Plan');
            expect(bcpPlan.priority).toBe(RecoveryPriority.CRITICAL);
            expect(bcpPlan.steps.length).toBeGreaterThan(0);

            // Check for essential BCP steps
            const stepNames = bcpPlan.steps.map(s => s.name);
            expect(stepNames.some(name => name.includes('Assess'))).toBe(true);
            expect(stepNames.some(name => name.includes('Emergency'))).toBe(true);
            expect(stepNames.some(name => name.includes('Failover'))).toBe(true);
            expect(stepNames.some(name => name.includes('Restore'))).toBe(true);
            expect(stepNames.some(name => name.includes('Validate'))).toBe(true);
        });

        it('should perform disaster recovery test', async () => {
            const testResult = await drService.performDisasterRecoveryTest();

            expect(testResult.id).toBeDefined();
            expect(testResult.timestamp).toBeInstanceOf(Date);
            expect(typeof testResult.success).toBe('boolean');
            expect(testResult.duration).toBeGreaterThan(0);
            expect(testResult.steps.length).toBeGreaterThan(0);
        });
    });

    describe('Health Monitoring', () => {
        it('should provide health status with all components', async () => {
            const health = await drService.getHealthStatus();

            expect(health.overall).toMatch(/^(healthy|warning|critical|unknown)$/);
            expect(health.backup).toBeDefined();
            expect(health.replication).toBeDefined();
            expect(health.recovery).toBeDefined();

            // Check backup health structure
            expect(health.backup.status).toMatch(/^(healthy|warning|critical|unknown)$/);
            expect(health.backup.lastBackup).toBeInstanceOf(Date);
            expect(health.backup.nextBackup).toBeInstanceOf(Date);
            expect(typeof health.backup.failedBackups).toBe('number');

            // Check replication health structure
            expect(health.replication.status).toMatch(/^(healthy|warning|critical|unknown)$/);
            expect(Array.isArray(health.replication.regions)).toBe(true);
            expect(typeof health.replication.maxLag).toBe('number');

            // Check recovery health structure
            expect(health.recovery.status).toMatch(/^(healthy|warning|critical|unknown)$/);
            expect(typeof health.recovery.plansCount).toBe('number');
            expect(health.recovery.lastTest).toBeInstanceOf(Date);
            expect(health.recovery.nextTest).toBeInstanceOf(Date);
        });

        it('should provide metrics for specified time range', async () => {
            const timeRange = {
                start: new Date('2024-01-01'),
                end: new Date('2024-01-02'),
            };

            const metrics = await drService.getMetrics(timeRange);

            // Check backup metrics
            expect(typeof metrics.backups.total).toBe('number');
            expect(typeof metrics.backups.successful).toBe('number');
            expect(typeof metrics.backups.failed).toBe('number');
            expect(typeof metrics.backups.averageSize).toBe('number');
            expect(typeof metrics.backups.averageDuration).toBe('number');

            // Check replication metrics
            expect(typeof metrics.replication.averageLag).toBe('number');
            expect(typeof metrics.replication.syncErrors).toBe('number');
            expect(typeof metrics.replication.dataTransferred).toBe('number');

            // Check recovery metrics
            expect(typeof metrics.recovery.testsExecuted).toBe('number');
            expect(typeof metrics.recovery.testsSuccessful).toBe('number');
            expect(typeof metrics.recovery.averageRTO).toBe('number');
            expect(typeof metrics.recovery.averageRPO).toBe('number');

            // Check storage metrics
            expect(typeof metrics.storage.totalUsed).toBe('number');
            expect(typeof metrics.storage.totalAvailable).toBe('number');
            expect(typeof metrics.storage.utilizationPercent).toBe('number');
        });
    });

    describe('Replication Management', () => {
        it('should get replication status for all regions', async () => {
            const statuses = await drService.getReplicationStatus();

            expect(Array.isArray(statuses)).toBe(true);

            for (const status of statuses) {
                expect(typeof status.region).toBe('string');
                expect(status.status).toMatch(/^(healthy|degraded|unhealthy|offline)$/);
                expect(status.lastSync).toBeInstanceOf(Date);
                expect(typeof status.lagMs).toBe('number');
                expect(typeof status.errorCount).toBe('number');
            }
        });

        it('should trigger replication for specific region', async () => {
            await expect(drService.triggerReplication('us-east-1')).resolves.not.toThrow();
        });

        it('should pause and resume replication', async () => {
            await expect(drService.pauseReplication('us-west-2')).resolves.not.toThrow();
            await expect(drService.resumeReplication('us-west-2')).resolves.not.toThrow();
        });
    });

    describe('Service Lifecycle', () => {
        it('should initialize and shutdown cleanly', async () => {
            const config = createDefaultDisasterRecoveryConfig();
            const service = new DisasterRecoveryServiceImpl(
                config,
                mockStorage as any,
                mockCache as any,
                mockJobs as any
            );

            // Service should be functional after initialization
            const health = await service.getHealthStatus();
            expect(health).toBeDefined();

            // Should shutdown without errors
            await expect(service.shutdown()).resolves.not.toThrow();
        });

        it('should handle errors gracefully', async () => {
            // Test with failing storage
            const failingStorage = {
                ...mockStorage,
                uploadStream: vi.fn().mockRejectedValue(new Error('Storage failure')),
            };

            const service = new DisasterRecoveryServiceImpl(
                createDefaultDisasterRecoveryConfig(),
                failingStorage as any,
                mockCache as any,
                mockJobs as any
            );

            await expect(service.createBackup(BackupType.FULL)).rejects.toThrow('Storage failure');
            await service.shutdown();
        });
    });
});