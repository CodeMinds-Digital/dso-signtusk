import { EventEmitter } from 'events';
import { z } from 'zod';
import { IConnector } from './connector-framework';

// Data Synchronization Types
export enum SyncStrategy {
    FULL_SYNC = 'full_sync',
    INCREMENTAL = 'incremental',
    REAL_TIME = 'real_time',
    BATCH = 'batch',
}

export enum ConflictResolutionStrategy {
    SOURCE_WINS = 'source_wins',
    TARGET_WINS = 'target_wins',
    TIMESTAMP_WINS = 'timestamp_wins',
    MERGE = 'merge',
    MANUAL = 'manual',
    CUSTOM = 'custom',
}

export enum SyncDirection {
    UNIDIRECTIONAL = 'unidirectional',
    BIDIRECTIONAL = 'bidirectional',
}

export enum SyncStatus {
    IDLE = 'idle',
    RUNNING = 'running',
    PAUSED = 'paused',
    ERROR = 'error',
    COMPLETED = 'completed',
}

// Sync Configuration Schema
export const SyncConfigSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),

    // Source and target connectors
    sourceConnectorId: z.string(),
    targetConnectorId: z.string(),

    // Sync settings
    strategy: z.nativeEnum(SyncStrategy),
    direction: z.nativeEnum(SyncDirection),
    conflictResolution: z.nativeEnum(ConflictResolutionStrategy),

    // Scheduling
    schedule: z.object({
        enabled: z.boolean().default(false),
        cron: z.string().optional(),
        interval: z.number().optional(), // milliseconds
    }),

    // Filtering and transformation
    sourceFilter: z.string().optional(), // SQL-like filter expression
    targetFilter: z.string().optional(),
    transformationRules: z.array(z.object({
        field: z.string(),
        rule: z.string(), // JavaScript transformation
    })).default([]),

    // Conflict resolution settings
    conflictResolutionRules: z.array(z.object({
        field: z.string(),
        strategy: z.nativeEnum(ConflictResolutionStrategy),
        customRule: z.string().optional(),
    })).default([]),

    // Performance settings
    batchSize: z.number().default(1000),
    maxConcurrency: z.number().default(5),
    retryAttempts: z.number().default(3),

    // Monitoring
    enableMetrics: z.boolean().default(true),
    enableAuditLog: z.boolean().default(true),

    createdAt: z.date(),
    updatedAt: z.date(),
    lastSyncAt: z.date().optional(),
});

export type SyncConfig = z.infer<typeof SyncConfigSchema>;

// Sync Result Types
export interface SyncResult {
    syncId: string;
    status: SyncStatus;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    recordsProcessed: number;
    recordsSuccessful: number;
    recordsFailed: number;
    conflicts: ConflictRecord[];
    errors: SyncError[];
    metrics: SyncMetrics;
}

export interface ConflictRecord {
    id: string;
    sourceRecord: any;
    targetRecord: any;
    conflictFields: string[];
    resolution: ConflictResolutionStrategy;
    resolvedRecord?: any;
    timestamp: Date;
}

export interface SyncError {
    id: string;
    type: 'connection' | 'transformation' | 'validation' | 'conflict' | 'unknown';
    message: string;
    record?: any;
    timestamp: Date;
    stack?: string;
}

export interface SyncMetrics {
    throughputPerSecond: number;
    averageLatency: number;
    memoryUsage: number;
    networkBandwidth: number;
    errorRate: number;
}

// Data Synchronization Engine
export class DataSyncEngine extends EventEmitter {
    private syncConfigs = new Map<string, SyncConfig>();
    private connectors = new Map<string, IConnector>();
    private activeSyncs = new Map<string, SyncExecution>();
    private scheduledSyncs = new Map<string, NodeJS.Timeout>();

    constructor() {
        super();
    }

    // Configuration Management
    addSyncConfig(config: SyncConfig): void {
        this.syncConfigs.set(config.id, config);

        if (config.schedule.enabled) {
            this.scheduleSync(config);
        }

        this.emit('configAdded', config);
    }

    removeSyncConfig(configId: string): void {
        this.syncConfigs.delete(configId);

        // Cancel scheduled sync if exists
        const scheduledSync = this.scheduledSyncs.get(configId);
        if (scheduledSync) {
            clearTimeout(scheduledSync);
            this.scheduledSyncs.delete(configId);
        }

        // Stop active sync if running
        const activeSync = this.activeSyncs.get(configId);
        if (activeSync) {
            activeSync.stop();
        }

        this.emit('configRemoved', configId);
    }

    updateSyncConfig(config: SyncConfig): void {
        const existingConfig = this.syncConfigs.get(config.id);
        if (!existingConfig) {
            throw new Error(`Sync config ${config.id} not found`);
        }

        this.syncConfigs.set(config.id, config);

        // Update scheduling
        const scheduledSync = this.scheduledSyncs.get(config.id);
        if (scheduledSync) {
            clearTimeout(scheduledSync);
            this.scheduledSyncs.delete(config.id);
        }

        if (config.schedule.enabled) {
            this.scheduleSync(config);
        }

        this.emit('configUpdated', config);
    }

    // Connector Management
    registerConnector(connector: IConnector): void {
        this.connectors.set(connector.id, connector);
        this.emit('connectorRegistered', connector.id);
    }

    unregisterConnector(connectorId: string): void {
        this.connectors.delete(connectorId);
        this.emit('connectorUnregistered', connectorId);
    }

    // Sync Execution
    async startSync(configId: string): Promise<SyncResult> {
        const config = this.syncConfigs.get(configId);
        if (!config) {
            throw new Error(`Sync config ${configId} not found`);
        }

        const sourceConnector = this.connectors.get(config.sourceConnectorId);
        const targetConnector = this.connectors.get(config.targetConnectorId);

        if (!sourceConnector || !targetConnector) {
            throw new Error('Source or target connector not found');
        }

        // Check if sync is already running
        if (this.activeSyncs.has(configId)) {
            throw new Error(`Sync ${configId} is already running`);
        }

        const syncExecution = new SyncExecution(config, sourceConnector, targetConnector);
        this.activeSyncs.set(configId, syncExecution);

        try {
            const result = await syncExecution.execute();
            this.activeSyncs.delete(configId);

            // Update last sync time
            config.lastSyncAt = new Date();
            this.syncConfigs.set(configId, config);

            this.emit('syncCompleted', result);
            return result;
        } catch (error) {
            this.activeSyncs.delete(configId);
            this.emit('syncFailed', { configId, error });
            throw error;
        }
    }

    async stopSync(configId: string): Promise<void> {
        const syncExecution = this.activeSyncs.get(configId);
        if (!syncExecution) {
            throw new Error(`No active sync found for config ${configId}`);
        }

        await syncExecution.stop();
        this.activeSyncs.delete(configId);
        this.emit('syncStopped', configId);
    }

    async pauseSync(configId: string): Promise<void> {
        const syncExecution = this.activeSyncs.get(configId);
        if (!syncExecution) {
            throw new Error(`No active sync found for config ${configId}`);
        }

        await syncExecution.pause();
        this.emit('syncPaused', configId);
    }

    async resumeSync(configId: string): Promise<void> {
        const syncExecution = this.activeSyncs.get(configId);
        if (!syncExecution) {
            throw new Error(`No active sync found for config ${configId}`);
        }

        await syncExecution.resume();
        this.emit('syncResumed', configId);
    }

    // Status and Monitoring
    getSyncStatus(configId: string): SyncStatus {
        const syncExecution = this.activeSyncs.get(configId);
        return syncExecution ? syncExecution.getStatus() : SyncStatus.IDLE;
    }

    getAllSyncStatuses(): Map<string, SyncStatus> {
        const statuses = new Map<string, SyncStatus>();

        for (const configId of this.syncConfigs.keys()) {
            statuses.set(configId, this.getSyncStatus(configId));
        }

        return statuses;
    }

    getSyncMetrics(configId: string): SyncMetrics | null {
        const syncExecution = this.activeSyncs.get(configId);
        return syncExecution ? syncExecution.getMetrics() : null;
    }

    // Scheduling
    private scheduleSync(config: SyncConfig): void {
        if (!config.schedule.enabled) {
            return;
        }

        let timeout: NodeJS.Timeout;

        if (config.schedule.interval) {
            // Interval-based scheduling
            timeout = setInterval(() => {
                this.startSync(config.id).catch(error => {
                    this.emit('scheduledSyncFailed', { configId: config.id, error });
                });
            }, config.schedule.interval);
        } else if (config.schedule.cron) {
            // Cron-based scheduling (simplified implementation)
            // In production, use a proper cron library like node-cron
            const cronInterval = this.parseCronToInterval(config.schedule.cron);
            timeout = setInterval(() => {
                this.startSync(config.id).catch(error => {
                    this.emit('scheduledSyncFailed', { configId: config.id, error });
                });
            }, cronInterval);
        } else {
            return;
        }

        this.scheduledSyncs.set(config.id, timeout);
    }

    private parseCronToInterval(cron: string): number {
        // Simplified cron parsing - in production use a proper cron library
        // This is just for demonstration
        return 60000; // Default to 1 minute
    }
}

// Sync Execution Class
class SyncExecution extends EventEmitter {
    private config: SyncConfig;
    private sourceConnector: IConnector;
    private targetConnector: IConnector;
    private status: SyncStatus = SyncStatus.IDLE;
    private startTime?: Date;
    private endTime?: Date;
    private recordsProcessed = 0;
    private recordsSuccessful = 0;
    private recordsFailed = 0;
    private conflicts: ConflictRecord[] = [];
    private errors: SyncError[] = [];
    private metrics: SyncMetrics = {
        throughputPerSecond: 0,
        averageLatency: 0,
        memoryUsage: 0,
        networkBandwidth: 0,
        errorRate: 0,
    };
    private shouldStop = false;
    private isPaused = false;

    constructor(config: SyncConfig, sourceConnector: IConnector, targetConnector: IConnector) {
        super();
        this.config = config;
        this.sourceConnector = sourceConnector;
        this.targetConnector = targetConnector;
    }

    async execute(): Promise<SyncResult> {
        this.status = SyncStatus.RUNNING;
        this.startTime = new Date();
        this.shouldStop = false;
        this.isPaused = false;

        try {
            // Connect to both connectors
            await this.sourceConnector.connect();
            await this.targetConnector.connect();

            // Execute sync based on strategy
            switch (this.config.strategy) {
                case SyncStrategy.FULL_SYNC:
                    await this.executeFullSync();
                    break;
                case SyncStrategy.INCREMENTAL:
                    await this.executeIncrementalSync();
                    break;
                case SyncStrategy.REAL_TIME:
                    await this.executeRealTimeSync();
                    break;
                case SyncStrategy.BATCH:
                    await this.executeBatchSync();
                    break;
            }

            this.status = SyncStatus.COMPLETED;
            this.endTime = new Date();

            return this.buildResult();
        } catch (error) {
            this.status = SyncStatus.ERROR;
            this.endTime = new Date();
            this.addError('unknown', error instanceof Error ? error.message : String(error));
            throw error;
        } finally {
            // Disconnect connectors
            try {
                await this.sourceConnector.disconnect();
                await this.targetConnector.disconnect();
            } catch (error) {
                // Log disconnect errors but don't throw
                console.warn('Error disconnecting connectors:', error);
            }
        }
    }

    async stop(): Promise<void> {
        this.shouldStop = true;
        this.status = SyncStatus.IDLE;
    }

    async pause(): Promise<void> {
        this.isPaused = true;
        this.status = SyncStatus.PAUSED;
    }

    async resume(): Promise<void> {
        this.isPaused = false;
        this.status = SyncStatus.RUNNING;
    }

    getStatus(): SyncStatus {
        return this.status;
    }

    getMetrics(): SyncMetrics {
        return { ...this.metrics };
    }

    private async executeFullSync(): Promise<void> {
        // Read all data from source
        const sourceData = await this.sourceConnector.read();

        // Process in batches
        const batches = this.createBatches(sourceData, this.config.batchSize);

        for (const batch of batches) {
            if (this.shouldStop) break;

            while (this.isPaused) {
                await this.sleep(1000);
            }

            await this.processBatch(batch);
        }
    }

    private async executeIncrementalSync(): Promise<void> {
        // Get last sync timestamp
        const lastSyncTime = this.config.lastSyncAt;

        // Read incremental data from source
        const query = lastSyncTime ? { modifiedSince: lastSyncTime } : undefined;
        const sourceData = await this.sourceConnector.read(query);

        // Process in batches
        const batches = this.createBatches(sourceData, this.config.batchSize);

        for (const batch of batches) {
            if (this.shouldStop) break;

            while (this.isPaused) {
                await this.sleep(1000);
            }

            await this.processBatch(batch);
        }
    }

    private async executeRealTimeSync(): Promise<void> {
        // Set up real-time listeners on source connector
        this.sourceConnector.on('data', async (data) => {
            if (this.shouldStop || this.isPaused) return;

            try {
                await this.processBatch([data]);
            } catch (error) {
                this.addError('unknown', error instanceof Error ? error.message : String(error));
            }
        });

        // Keep sync running until stopped
        while (!this.shouldStop) {
            await this.sleep(1000);
        }
    }

    private async executeBatchSync(): Promise<void> {
        // Similar to full sync but with specific batch processing optimizations
        await this.executeFullSync();
    }

    private async processBatch(batch: any[]): Promise<void> {
        const batchStartTime = Date.now();

        for (const record of batch) {
            if (this.shouldStop) break;

            try {
                await this.processRecord(record);
                this.recordsSuccessful++;
            } catch (error) {
                this.recordsFailed++;
                this.addError('unknown', error instanceof Error ? error.message : String(error), record);
            }

            this.recordsProcessed++;
        }

        // Update metrics
        const batchDuration = Date.now() - batchStartTime;
        this.updateMetrics(batch.length, batchDuration);
    }

    private async processRecord(record: any): Promise<void> {
        // Apply source filter if configured
        if (this.config.sourceFilter && !this.evaluateFilter(record, this.config.sourceFilter)) {
            return;
        }

        // Apply transformations
        const transformedRecord = await this.applyTransformations(record);

        // Check for conflicts if bidirectional sync
        if (this.config.direction === SyncDirection.BIDIRECTIONAL) {
            const conflict = await this.detectConflict(transformedRecord);
            if (conflict) {
                const resolvedRecord = await this.resolveConflict(conflict);
                if (resolvedRecord) {
                    await this.targetConnector.write([resolvedRecord]);
                }
                return;
            }
        }

        // Write to target
        await this.targetConnector.write([transformedRecord]);
    }

    private async applyTransformations(record: any): Promise<any> {
        let transformedRecord = { ...record };

        for (const rule of this.config.transformationRules) {
            try {
                const transformFn = new Function('record', 'value', rule.rule);
                const currentValue = this.getNestedValue(transformedRecord, rule.field);
                const newValue = transformFn(transformedRecord, currentValue);
                this.setNestedValue(transformedRecord, rule.field, newValue);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.addError('transformation', `Transformation failed for field ${rule.field}: ${errorMessage}`, record);
            }
        }

        return transformedRecord;
    }

    private async detectConflict(record: any): Promise<ConflictRecord | null> {
        // Try to find existing record in target
        const existingRecords = await this.targetConnector.read({ id: record.id });

        if (existingRecords.length === 0) {
            return null; // No conflict, new record
        }

        const existingRecord = existingRecords[0];
        const conflictFields: string[] = [];

        // Compare fields to detect conflicts
        for (const key in record) {
            if (record[key] !== existingRecord[key]) {
                conflictFields.push(key);
            }
        }

        if (conflictFields.length === 0) {
            return null; // No actual conflicts
        }

        return {
            id: record.id,
            sourceRecord: record,
            targetRecord: existingRecord,
            conflictFields,
            resolution: this.config.conflictResolution,
            timestamp: new Date(),
        };
    }

    private async resolveConflict(conflict: ConflictRecord): Promise<any | null> {
        let resolvedRecord: any;

        switch (conflict.resolution) {
            case ConflictResolutionStrategy.SOURCE_WINS:
                resolvedRecord = conflict.sourceRecord;
                break;

            case ConflictResolutionStrategy.TARGET_WINS:
                resolvedRecord = conflict.targetRecord;
                break;

            case ConflictResolutionStrategy.TIMESTAMP_WINS:
                const sourceTime = new Date(conflict.sourceRecord.updatedAt || conflict.sourceRecord.createdAt);
                const targetTime = new Date(conflict.targetRecord.updatedAt || conflict.targetRecord.createdAt);
                resolvedRecord = sourceTime > targetTime ? conflict.sourceRecord : conflict.targetRecord;
                break;

            case ConflictResolutionStrategy.MERGE:
                resolvedRecord = { ...conflict.targetRecord, ...conflict.sourceRecord };
                break;

            case ConflictResolutionStrategy.MANUAL:
                // Store conflict for manual resolution
                this.conflicts.push(conflict);
                return null;

            case ConflictResolutionStrategy.CUSTOM:
                // Apply custom resolution rules
                resolvedRecord = await this.applyCustomConflictResolution(conflict);
                break;

            default:
                resolvedRecord = conflict.sourceRecord;
        }

        conflict.resolvedRecord = resolvedRecord;
        this.conflicts.push(conflict);

        return resolvedRecord;
    }

    private async applyCustomConflictResolution(conflict: ConflictRecord): Promise<any> {
        // Apply field-specific conflict resolution rules
        let resolvedRecord = { ...conflict.targetRecord };

        for (const rule of this.config.conflictResolutionRules) {
            if (conflict.conflictFields.includes(rule.field)) {
                switch (rule.strategy) {
                    case ConflictResolutionStrategy.SOURCE_WINS:
                        resolvedRecord[rule.field] = conflict.sourceRecord[rule.field];
                        break;
                    case ConflictResolutionStrategy.TARGET_WINS:
                        // Keep target value (already set)
                        break;
                    case ConflictResolutionStrategy.CUSTOM:
                        if (rule.customRule) {
                            try {
                                const customFn = new Function('source', 'target', 'field', rule.customRule);
                                resolvedRecord[rule.field] = customFn(
                                    conflict.sourceRecord,
                                    conflict.targetRecord,
                                    rule.field
                                );
                            } catch (error) {
                                const errorMessage = error instanceof Error ? error.message : String(error);
                                this.addError('conflict', `Custom conflict resolution failed for field ${rule.field}: ${errorMessage}`);
                            }
                        }
                        break;
                }
            }
        }

        return resolvedRecord;
    }

    private evaluateFilter(record: any, filter: string): boolean {
        // Simplified filter evaluation - in production use a proper expression evaluator
        try {
            const filterFn = new Function('record', `return ${filter}`);
            return filterFn(record);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.addError('validation', `Filter evaluation failed: ${errorMessage}`, record);
            return true; // Default to include record if filter fails
        }
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    private setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;
        const target = keys.reduce((current, key) => {
            if (!(key in current)) {
                current[key] = {};
            }
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    private createBatches<T>(items: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }

    private addError(type: SyncError['type'], message: string, record?: any): void {
        this.errors.push({
            id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            message,
            record,
            timestamp: new Date(),
        });
    }

    private updateMetrics(recordCount: number, duration: number): void {
        this.metrics.throughputPerSecond = recordCount / (duration / 1000);
        this.metrics.averageLatency = duration / recordCount;
        this.metrics.memoryUsage = process.memoryUsage().heapUsed;
        this.metrics.errorRate = this.recordsFailed / this.recordsProcessed;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private buildResult(): SyncResult {
        return {
            syncId: this.config.id,
            status: this.status,
            startTime: this.startTime!,
            endTime: this.endTime,
            duration: this.endTime && this.startTime ? this.endTime.getTime() - this.startTime.getTime() : undefined,
            recordsProcessed: this.recordsProcessed,
            recordsSuccessful: this.recordsSuccessful,
            recordsFailed: this.recordsFailed,
            conflicts: this.conflicts,
            errors: this.errors,
            metrics: this.metrics,
        };
    }
}