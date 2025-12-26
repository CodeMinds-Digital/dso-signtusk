import { EventEmitter } from 'events';
import { StorageService } from '@signtusk/storage';
import { CacheService } from '@signtusk/cache';
import { JobService } from '@signtusk/jobs';
import {
    DisasterRecoveryService,
    DisasterRecoveryConfig,
    DisasterRecoveryConfigSchema,
    BackupMetadata,
    BackupType,
    BackupFilters,
    RestoreOptions,
    RestoreResult,
    VerificationResult,
    ReplicationStatus,
    RecoveryPlan,
    RecoveryPriority,
    RecoveryStepType,
    ValidationType,
    TestResult,
    ExecutionOptions,
    ExecutionResult,
    DisasterRecoveryHealth,
    DisasterRecoveryMetrics,
    TimeRange,
    HealthStatus,
} from './types';
import { BackupService } from './backup-service';
import { ReplicationService } from './replication-service';
import { RecoveryService } from './recovery-service';
import { MonitoringService } from './monitoring-service';

export class DisasterRecoveryServiceImpl extends EventEmitter implements DisasterRecoveryService {
    private config: DisasterRecoveryConfig;
    private storage: StorageService;
    private cache: CacheService;
    private jobs: JobService;

    private backupService!: BackupService;
    private replicationService!: ReplicationService;
    private recoveryService!: RecoveryService;
    private monitoringService!: MonitoringService;

    private initialized: boolean = false;

    constructor(
        config: DisasterRecoveryConfig,
        storage: StorageService,
        cache: CacheService,
        jobs: JobService
    ) {
        super();

        // Validate configuration
        this.config = DisasterRecoveryConfigSchema.parse(config);
        this.storage = storage;
        this.cache = cache;
        this.jobs = jobs;

        this.initializeServices();
    }

    // Backup Management Methods
    async createBackup(type: BackupType, tags: Record<string, string> = {}): Promise<BackupMetadata> {
        this.ensureInitialized();

        try {
            const metadata = await this.backupService.createBackup(type, tags);
            this.emit('backupCreated', { backupId: metadata.id, type, tags });
            return metadata;
        } catch (error) {
            this.emit('backupFailed', { type, tags, error });
            throw error;
        }
    }

    async listBackups(filters: BackupFilters = {}): Promise<BackupMetadata[]> {
        this.ensureInitialized();
        return await this.backupService.listBackups(filters);
    }

    async restoreBackup(backupId: string, options: RestoreOptions = {}): Promise<RestoreResult> {
        this.ensureInitialized();

        try {
            const result = await this.backupService.restoreBackup(backupId, options);
            this.emit('backupRestored', { backupId, options, result });
            return result;
        } catch (error) {
            this.emit('backupRestoreFailed', { backupId, options, error });
            throw error;
        }
    }

    async deleteBackup(backupId: string): Promise<void> {
        this.ensureInitialized();

        try {
            await this.backupService.deleteBackup(backupId);
            this.emit('backupDeleted', { backupId });
        } catch (error) {
            this.emit('backupDeleteFailed', { backupId, error });
            throw error;
        }
    }

    async verifyBackup(backupId: string): Promise<VerificationResult> {
        this.ensureInitialized();

        try {
            const result = await this.backupService.verifyBackup(backupId);
            this.emit('backupVerified', { backupId, result });
            return result;
        } catch (error) {
            this.emit('backupVerificationFailed', { backupId, error });
            throw error;
        }
    }

    // Replication Management Methods
    async getReplicationStatus(): Promise<ReplicationStatus[]> {
        this.ensureInitialized();
        return await this.replicationService.getReplicationStatus();
    }

    async triggerReplication(region?: string): Promise<void> {
        this.ensureInitialized();

        try {
            await this.replicationService.triggerReplication(region);
            this.emit('replicationTriggered', { region });
        } catch (error) {
            this.emit('replicationFailed', { region, error });
            throw error;
        }
    }

    async pauseReplication(region: string): Promise<void> {
        this.ensureInitialized();

        try {
            await this.replicationService.pauseReplication(region);
            this.emit('replicationPaused', { region });
        } catch (error) {
            this.emit('replicationPauseFailed', { region, error });
            throw error;
        }
    }

    async resumeReplication(region: string): Promise<void> {
        this.ensureInitialized();

        try {
            await this.replicationService.resumeReplication(region);
            this.emit('replicationResumed', { region });
        } catch (error) {
            this.emit('replicationResumeFailed', { region, error });
            throw error;
        }
    }

    // Recovery Management Methods
    async createRecoveryPlan(
        plan: Omit<RecoveryPlan, 'id' | 'lastTested' | 'testResults'>
    ): Promise<RecoveryPlan> {
        this.ensureInitialized();

        try {
            const createdPlan = await this.recoveryService.createRecoveryPlan(plan);
            this.emit('recoveryPlanCreated', { planId: createdPlan.id, name: createdPlan.name });
            return createdPlan;
        } catch (error) {
            this.emit('recoveryPlanCreationFailed', { plan, error });
            throw error;
        }
    }

    async executeRecoveryPlan(planId: string, options: ExecutionOptions = {}): Promise<ExecutionResult> {
        this.ensureInitialized();

        try {
            const result = await this.recoveryService.executeRecoveryPlan(planId, options);
            this.emit('recoveryPlanExecuted', { planId, options, result });
            return result;
        } catch (error) {
            this.emit('recoveryPlanExecutionFailed', { planId, options, error });
            throw error;
        }
    }

    async testRecoveryPlan(planId: string): Promise<TestResult> {
        this.ensureInitialized();

        try {
            const result = await this.recoveryService.testRecoveryPlan(planId);
            this.emit('recoveryPlanTested', { planId, result });
            return result;
        } catch (error) {
            this.emit('recoveryPlanTestFailed', { planId, error });
            throw error;
        }
    }

    async listRecoveryPlans(): Promise<RecoveryPlan[]> {
        this.ensureInitialized();
        return await this.recoveryService.listRecoveryPlans();
    }

    // Monitoring and Alerting Methods
    async getHealthStatus(): Promise<DisasterRecoveryHealth> {
        this.ensureInitialized();

        try {
            const health = await this.monitoringService.getHealthStatus();
            this.emit('healthStatusChecked', { health });
            return health;
        } catch (error) {
            this.emit('healthStatusCheckFailed', { error });
            throw error;
        }
    }

    async getMetrics(timeRange: TimeRange): Promise<DisasterRecoveryMetrics> {
        this.ensureInitialized();

        try {
            const metrics = await this.monitoringService.getMetrics(timeRange);
            this.emit('metricsRetrieved', { timeRange, metrics });
            return metrics;
        } catch (error) {
            this.emit('metricsRetrievalFailed', { timeRange, error });
            throw error;
        }
    }

    // Configuration Methods
    async updateConfig(configUpdate: Partial<DisasterRecoveryConfig>): Promise<void> {
        try {
            // Merge with existing config
            const newConfig = { ...this.config, ...configUpdate };

            // Validate new configuration
            const validatedConfig = DisasterRecoveryConfigSchema.parse(newConfig);

            // Update configuration
            this.config = validatedConfig;

            // Reinitialize services with new config
            await this.reinitializeServices();

            this.emit('configUpdated', { config: this.config });
        } catch (error) {
            this.emit('configUpdateFailed', { configUpdate, error });
            throw error;
        }
    }

    async getConfig(): Promise<DisasterRecoveryConfig> {
        return { ...this.config }; // Return a copy to prevent external modification
    }

    // Business Continuity Methods
    async createBusinessContinuityPlan(): Promise<RecoveryPlan> {
        this.ensureInitialized();

        const bcpPlan: Omit<RecoveryPlan, 'id' | 'lastTested' | 'testResults'> = {
            name: 'Business Continuity Plan',
            description: 'Comprehensive business continuity and disaster recovery plan',
            priority: RecoveryPriority.CRITICAL,
            steps: [
                {
                    id: 'assess-situation',
                    name: 'Assess Disaster Situation',
                    description: 'Evaluate the scope and impact of the disaster',
                    type: RecoveryStepType.VALIDATION,
                    automated: false,
                    estimatedDuration: 300, // 5 minutes
                    dependencies: [],
                    validation: [
                        {
                            name: 'Disaster Assessment',
                            type: ValidationType.CUSTOM_SCRIPT,
                            target: 'disaster-assessment',
                            expected: 'completed',
                            timeout: 300,
                        },
                    ],
                },
                {
                    id: 'activate-emergency-team',
                    name: 'Activate Emergency Response Team',
                    description: 'Notify and activate the emergency response team',
                    type: RecoveryStepType.NOTIFICATION,
                    automated: true,
                    estimatedDuration: 120, // 2 minutes
                    dependencies: ['assess-situation'],
                    validation: [],
                },
                {
                    id: 'failover-primary-systems',
                    name: 'Failover Primary Systems',
                    description: 'Failover critical systems to backup infrastructure',
                    type: RecoveryStepType.FAILOVER,
                    automated: this.config.replication.failover.automatic,
                    estimatedDuration: 600, // 10 minutes
                    dependencies: ['activate-emergency-team'],
                    validation: [
                        {
                            name: 'System Availability',
                            type: ValidationType.HTTP_STATUS,
                            target: 'https://api.docusign-alternative.com/health',
                            expected: 200,
                            timeout: 30,
                        },
                    ],
                },
                {
                    id: 'restore-from-backup',
                    name: 'Restore Critical Data',
                    description: 'Restore critical data from latest backup',
                    type: RecoveryStepType.BACKUP_RESTORE,
                    automated: false,
                    estimatedDuration: 1800, // 30 minutes
                    dependencies: ['failover-primary-systems'],
                    validation: [
                        {
                            name: 'Data Integrity Check',
                            type: ValidationType.DATABASE_QUERY,
                            target: 'SELECT COUNT(*) FROM users',
                            expected: 'positive',
                            timeout: 60,
                        },
                    ],
                },
                {
                    id: 'validate-services',
                    name: 'Validate All Services',
                    description: 'Comprehensive validation of all system services',
                    type: RecoveryStepType.VALIDATION,
                    automated: true,
                    estimatedDuration: 300, // 5 minutes
                    dependencies: ['restore-from-backup'],
                    validation: [
                        {
                            name: 'Authentication Service',
                            type: ValidationType.HTTP_STATUS,
                            target: 'https://api.docusign-alternative.com/auth/health',
                            expected: 200,
                            timeout: 30,
                        },
                        {
                            name: 'Document Service',
                            type: ValidationType.HTTP_STATUS,
                            target: 'https://api.docusign-alternative.com/documents/health',
                            expected: 200,
                            timeout: 30,
                        },
                        {
                            name: 'Signing Service',
                            type: ValidationType.HTTP_STATUS,
                            target: 'https://api.docusign-alternative.com/signing/health',
                            expected: 200,
                            timeout: 30,
                        },
                    ],
                },
                {
                    id: 'notify-stakeholders',
                    name: 'Notify Stakeholders',
                    description: 'Inform stakeholders about system recovery status',
                    type: RecoveryStepType.NOTIFICATION,
                    automated: true,
                    estimatedDuration: 60, // 1 minute
                    dependencies: ['validate-services'],
                    validation: [],
                },
            ],
            dependencies: [],
            estimatedRTO: this.config.recovery.rto,
            estimatedRPO: this.config.recovery.rpo,
        };

        return await this.createRecoveryPlan(bcpPlan);
    }

    async performDisasterRecoveryTest(): Promise<TestResult> {
        this.ensureInitialized();

        try {
            // Create a comprehensive test plan
            const testPlan = await this.createBusinessContinuityPlan();

            // Execute the test
            const testResult = await this.testRecoveryPlan(testPlan.id);

            this.emit('disasterRecoveryTestCompleted', { testResult });
            return testResult;

        } catch (error) {
            this.emit('disasterRecoveryTestFailed', { error });
            throw error;
        }
    }

    // Utility Methods
    private initializeServices(): void {
        // Initialize backup service
        this.backupService = new BackupService(
            this.config.backup,
            this.storage,
            this.cache,
            this.jobs
        );

        // Initialize replication service
        this.replicationService = new ReplicationService(
            this.config.replication,
            this.storage,
            this.cache,
            this.jobs
        );

        // Initialize recovery service
        this.recoveryService = new RecoveryService(
            this.storage,
            this.cache,
            this.jobs
        );

        // Initialize monitoring service
        this.monitoringService = new MonitoringService(
            this.config,
            this.cache,
            this.jobs,
            this.backupService,
            this.replicationService,
            this.recoveryService
        );

        // Set up event forwarding
        this.setupEventForwarding();

        this.initialized = true;
        this.emit('initialized', { config: this.config });
    }

    private async reinitializeServices(): Promise<void> {
        // Shutdown existing services
        await this.shutdown();

        // Reinitialize with new config
        this.initializeServices();
    }

    private setupEventForwarding(): void {
        // Forward events from child services that are EventEmitters
        const eventEmitterServices = [
            this.replicationService,
            this.recoveryService,
            this.monitoringService,
        ];

        for (const service of eventEmitterServices) {
            if (service && typeof service.on === 'function') {
                // Forward all events from child services
                const originalEmit = service.emit.bind(service);
                service.emit = (eventName: string | symbol, ...args: any[]) => {
                    // Emit on child service first
                    const result = originalEmit(eventName, ...args);
                    // Then forward to parent
                    this.emit(eventName as string, ...args);
                    return result;
                };
            }
        }
    }

    private ensureInitialized(): void {
        if (!this.initialized) {
            throw new Error('Disaster Recovery Service not initialized');
        }
    }

    async shutdown(): Promise<void> {
        if (!this.initialized) {
            return;
        }

        try {
            // Shutdown monitoring service
            await this.monitoringService.shutdown();

            // Shutdown replication service
            await this.replicationService.shutdown();

            // Recovery service doesn't need explicit shutdown

            // Backup service doesn't need explicit shutdown

            this.initialized = false;
            this.emit('shutdown');

        } catch (error) {
            this.emit('shutdownError', { error });
            throw error;
        }
    }
}