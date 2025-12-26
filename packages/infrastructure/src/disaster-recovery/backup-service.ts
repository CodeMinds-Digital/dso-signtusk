import { createHash, createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { createGzip, createGunzip } from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable, Writable } from 'stream';
import { StorageService } from '@signtusk/storage';
import { CacheService } from '@signtusk/cache';
import { JobService } from '@signtusk/jobs';
import {
    BackupConfig,
    BackupMetadata,
    BackupType,
    BackupStatus,
    BackupFilters,
    RestoreOptions,
    RestoreResult,
    VerificationResult,
} from './types';

export class BackupService {
    private config: BackupConfig;
    private storage: StorageService;
    private cache: CacheService;
    private jobs: JobService;
    private encryptionKeys: Map<string, Buffer> = new Map();

    constructor(
        config: BackupConfig,
        storage: StorageService,
        cache: CacheService,
        jobs: JobService
    ) {
        this.config = config;
        this.storage = storage;
        this.cache = cache;
        this.jobs = jobs;
        this.initializeEncryptionKeys();
        this.scheduleBackups();
    }

    async createBackup(type: BackupType, tags: Record<string, string> = {}): Promise<BackupMetadata> {
        const backupId = this.generateBackupId();
        const timestamp = new Date();

        try {
            // Create backup metadata
            const metadata: BackupMetadata = {
                id: backupId,
                timestamp,
                type,
                size: 0,
                checksum: '',
                encrypted: this.config.encryption.enabled,
                compressed: this.config.compression.enabled,
                location: '',
                replicas: [],
                status: BackupStatus.PENDING,
                retentionUntil: this.calculateRetentionDate(timestamp, type),
                tags,
            };

            // Update status to in progress
            metadata.status = BackupStatus.IN_PROGRESS;
            await this.saveBackupMetadata(metadata);

            // Create backup data stream
            const backupData = await this.createBackupData(type);
            let processedStream = backupData;

            // Apply compression if enabled
            if (this.config.compression.enabled) {
                const gzipStream = createGzip({ level: this.config.compression.level });
                processedStream = processedStream.pipe(gzipStream);
            }

            // Apply encryption if enabled
            if (this.config.encryption.enabled) {
                const encryptionKey = this.getCurrentEncryptionKey();
                const iv = randomBytes(16);
                const cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);
                processedStream = processedStream.pipe(cipher);
            }

            // Calculate checksum and size
            const { checksum, size } = await this.calculateChecksumAndSize(processedStream);
            metadata.checksum = checksum;
            metadata.size = size;

            // Store backup to primary location
            const primaryLocation = this.generateBackupPath(backupId, type);
            await this.storage.uploadStream(primaryLocation, processedStream);
            metadata.location = primaryLocation;

            // Replicate to other regions
            if (this.config.storage.replicas.length > 0) {
                metadata.replicas = await this.replicateBackup(backupId, processedStream);
            }

            // Verify backup integrity if enabled
            if (this.config.storage.verifyIntegrity) {
                const verification = await this.verifyBackup(backupId);
                if (!verification.valid) {
                    throw new Error(`Backup verification failed: ${verification.error}`);
                }
            }

            // Update status to completed
            metadata.status = BackupStatus.COMPLETED;
            await this.saveBackupMetadata(metadata);

            // Schedule cleanup of old backups
            await this.scheduleBackupCleanup();

            return metadata;
        } catch (error) {
            // Update status to failed
            const failedMetadata: BackupMetadata = {
                id: backupId,
                timestamp,
                type,
                size: 0,
                checksum: '',
                encrypted: this.config.encryption.enabled,
                compressed: this.config.compression.enabled,
                location: '',
                replicas: [],
                status: BackupStatus.FAILED,
                retentionUntil: this.calculateRetentionDate(timestamp, type),
                tags: { ...tags, error: error instanceof Error ? error.message : 'Unknown error' },
            };
            await this.saveBackupMetadata(failedMetadata);
            throw error;
        }
    }

    async listBackups(filters: BackupFilters = {}): Promise<BackupMetadata[]> {
        const cacheKey = `backups:list:${JSON.stringify(filters)}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }

        // In a real implementation, this would query a database
        // For now, we'll simulate with storage metadata
        const allBackups = await this.getAllBackupMetadata();

        let filteredBackups = allBackups;

        if (filters.type) {
            filteredBackups = filteredBackups.filter(b => b.type === filters.type);
        }

        if (filters.status) {
            filteredBackups = filteredBackups.filter(b => b.status === filters.status);
        }

        if (filters.fromDate) {
            filteredBackups = filteredBackups.filter(b => b.timestamp >= filters.fromDate!);
        }

        if (filters.toDate) {
            filteredBackups = filteredBackups.filter(b => b.timestamp <= filters.toDate!);
        }

        if (filters.tags) {
            filteredBackups = filteredBackups.filter(b => {
                return Object.entries(filters.tags!).every(([key, value]) => b.tags[key] === value);
            });
        }

        // Sort by timestamp descending
        filteredBackups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        // Cache results for 5 minutes
        await this.cache.set(cacheKey, JSON.stringify(filteredBackups), { ttl: 300 });

        return filteredBackups;
    }

    async restoreBackup(backupId: string, options: RestoreOptions = {}): Promise<RestoreResult> {
        const startTime = Date.now();
        const warnings: string[] = [];

        try {
            // Get backup metadata
            const metadata = await this.getBackupMetadata(backupId);
            if (!metadata) {
                throw new Error(`Backup ${backupId} not found`);
            }

            if (metadata.status !== BackupStatus.COMPLETED) {
                throw new Error(`Backup ${backupId} is not in completed state`);
            }

            // Verify backup before restore
            if (!options.validateOnly) {
                const verification = await this.verifyBackup(backupId);
                if (!verification.valid) {
                    throw new Error(`Backup verification failed: ${verification.error}`);
                }
            }

            // Get backup data stream
            let backupStream = await this.storage.downloadStream(metadata.location);

            // Apply decryption if backup was encrypted
            if (metadata.encrypted) {
                const encryptionKey = this.getEncryptionKeyForBackup(metadata);
                const iv = randomBytes(16); // In real implementation, IV would be stored with backup
                const decipher = createDecipheriv('aes-256-gcm', encryptionKey, iv);
                backupStream = backupStream.pipe(decipher);
            }

            // Apply decompression if backup was compressed
            if (metadata.compressed) {
                const gunzipStream = createGunzip();
                backupStream = backupStream.pipe(gunzipStream);
            }

            if (options.validateOnly) {
                // Just validate the stream can be read
                let size = 0;
                await pipeline(
                    backupStream,
                    new Writable({
                        write(chunk, encoding, callback) {
                            size += chunk.length;
                            callback();
                        }
                    })
                );

                return {
                    success: true,
                    duration: Date.now() - startTime,
                    restoredSize: size,
                    location: 'validation-only',
                    warnings,
                };
            }

            // Determine target location
            const targetLocation = options.targetLocation || this.generateRestoreLocation(backupId);

            // Check if target exists and handle overwrite
            if (await this.storage.exists(targetLocation)) {
                if (!options.overwrite) {
                    throw new Error(`Target location ${targetLocation} already exists. Use overwrite option to replace.`);
                }
                warnings.push(`Overwriting existing data at ${targetLocation}`);
            }

            // Restore the backup
            await this.storage.uploadStream(targetLocation, backupStream);

            // Verify restored data
            const restoredSize = await this.getRestoredSize(targetLocation);

            return {
                success: true,
                duration: Date.now() - startTime,
                restoredSize,
                location: targetLocation,
                warnings,
            };
        } catch (error) {
            return {
                success: false,
                duration: Date.now() - startTime,
                restoredSize: 0,
                location: '',
                error: error instanceof Error ? error.message : 'Unknown error',
                warnings,
            };
        }
    }

    async deleteBackup(backupId: string): Promise<void> {
        const metadata = await this.getBackupMetadata(backupId);
        if (!metadata) {
            throw new Error(`Backup ${backupId} not found`);
        }

        // Delete from primary location
        if (metadata.location) {
            await this.storage.delete(metadata.location);
        }

        // Delete from replicas
        for (const replica of metadata.replicas) {
            try {
                await this.storage.delete(replica);
            } catch (error) {
                console.warn(`Failed to delete replica ${replica}:`, error);
            }
        }

        // Remove metadata
        await this.deleteBackupMetadata(backupId);

        // Clear cache
        await this.cache.del(`backup:metadata:${backupId}`);
    }

    async verifyBackup(backupId: string): Promise<VerificationResult> {
        try {
            const metadata = await this.getBackupMetadata(backupId);
            if (!metadata) {
                return {
                    valid: false,
                    checksum: '',
                    size: 0,
                    error: 'Backup metadata not found',
                    details: {},
                };
            }

            // Check if backup file exists
            if (!await this.storage.exists(metadata.location)) {
                return {
                    valid: false,
                    checksum: metadata.checksum,
                    size: metadata.size,
                    error: 'Backup file not found',
                    details: { location: metadata.location },
                };
            }

            // Get backup stream and calculate checksum
            const backupStream = await this.storage.downloadStream(metadata.location);
            const { checksum, size } = await this.calculateChecksumAndSize(backupStream as any);

            // Verify checksum and size
            const checksumValid = checksum === metadata.checksum;
            const sizeValid = size === metadata.size;

            return {
                valid: checksumValid && sizeValid,
                checksum,
                size,
                error: !checksumValid ? 'Checksum mismatch' : !sizeValid ? 'Size mismatch' : undefined,
                details: {
                    expectedChecksum: metadata.checksum,
                    actualChecksum: checksum,
                    expectedSize: metadata.size,
                    actualSize: size,
                },
            };
        } catch (error) {
            return {
                valid: false,
                checksum: '',
                size: 0,
                error: error instanceof Error ? error.message : 'Unknown error',
                details: {},
            };
        }
    }

    private generateBackupId(): string {
        return `backup_${Date.now()}_${randomBytes(8).toString('hex')}`;
    }

    private generateBackupPath(backupId: string, type: BackupType): string {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `backups/${year}/${month}/${day}/${type}/${backupId}.backup`;
    }

    private generateRestoreLocation(backupId: string): string {
        return `restores/${backupId}_${Date.now()}`;
    }

    private calculateRetentionDate(timestamp: Date, type: BackupType): Date {
        const retention = this.config.retention;
        const retentionDate = new Date(timestamp);

        switch (type) {
            case BackupType.FULL:
                retentionDate.setDate(retentionDate.getDate() + retention.daily);
                break;
            case BackupType.INCREMENTAL:
                retentionDate.setDate(retentionDate.getDate() + retention.daily);
                break;
            case BackupType.DIFFERENTIAL:
                retentionDate.setDate(retentionDate.getDate() + retention.weekly * 7);
                break;
            case BackupType.TRANSACTION_LOG:
                retentionDate.setDate(retentionDate.getDate() + 1); // Keep for 1 day
                break;
        }

        return retentionDate;
    }

    private initializeEncryptionKeys(): void {
        if (this.config.encryption.enabled) {
            // In a real implementation, keys would be loaded from a secure key management system
            const currentKey = randomBytes(32); // 256-bit key
            this.encryptionKeys.set('current', currentKey);
        }
    }

    private getCurrentEncryptionKey(): Buffer {
        const key = this.encryptionKeys.get('current');
        if (!key) {
            throw new Error('No encryption key available');
        }
        return key;
    }

    private getEncryptionKeyForBackup(metadata: BackupMetadata): Buffer {
        // In a real implementation, this would retrieve the key used for this specific backup
        return this.getCurrentEncryptionKey();
    }

    private async createBackupData(type: BackupType): Promise<Readable> {
        // This is a simplified implementation
        // In a real system, this would create different types of backups based on the type parameter
        const data = JSON.stringify({
            type,
            timestamp: new Date().toISOString(),
            data: 'Sample backup data - in real implementation this would be actual system data',
        });

        return Readable.from([Buffer.from(data)]);
    }

    private async calculateChecksumAndSize(stream: Readable): Promise<{ checksum: string; size: number }> {
        const hash = createHash('sha256');
        let size = 0;

        await pipeline(
            stream,
            new Writable({
                write(chunk, encoding, callback) {
                    hash.update(chunk);
                    size += chunk.length;
                    callback();
                }
            })
        );

        return {
            checksum: hash.digest('hex'),
            size,
        };
    }

    private async replicateBackup(backupId: string, stream: Readable): Promise<string[]> {
        const replicas: string[] = [];

        for (const replicaLocation of this.config.storage.replicas) {
            try {
                const replicaPath = `${replicaLocation}/${this.generateBackupPath(backupId, BackupType.FULL)}`;
                await this.storage.uploadStream(replicaPath, stream);
                replicas.push(replicaPath);
            } catch (error) {
                console.warn(`Failed to replicate backup to ${replicaLocation}:`, error);
            }
        }

        return replicas;
    }

    private async saveBackupMetadata(metadata: BackupMetadata): Promise<void> {
        // In a real implementation, this would save to a database
        const cacheKey = `backup:metadata:${metadata.id}`;
        await this.cache.set(cacheKey, JSON.stringify(metadata), { ttl: 86400 }); // 24 hours
    }

    private async getBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
        const cacheKey = `backup:metadata:${backupId}`;
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            const metadata = JSON.parse(cached);
            // Convert date strings back to Date objects
            metadata.timestamp = new Date(metadata.timestamp);
            metadata.retentionUntil = new Date(metadata.retentionUntil);
            return metadata;
        }
        return null;
    }

    private async deleteBackupMetadata(backupId: string): Promise<void> {
        const cacheKey = `backup:metadata:${backupId}`;
        await this.cache.del(cacheKey);
    }

    private async getAllBackupMetadata(): Promise<BackupMetadata[]> {
        // In a real implementation, this would query a database
        // For now, we'll return an empty array as this is a simplified implementation
        return [];
    }

    private async getRestoredSize(location: string): Promise<number> {
        // In a real implementation, this would get the actual size of the restored data
        return 0;
    }

    private async scheduleBackups(): Promise<void> {
        if (!this.config.enabled) {
            return;
        }

        // Schedule regular backups using the job service
        this.jobs.defineJob({
            name: 'scheduled-backup',
            handler: async (payload: { type: BackupType; tags?: Record<string, string> }) => {
                try {
                    const result = await this.createBackup(payload.type, payload.tags);
                    return { success: true, data: result };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Backup failed'
                    };
                }
            },
        });

        // Enqueue initial backup
        await this.jobs.enqueue('scheduled-backup', {
            type: BackupType.FULL,
            tags: { scheduled: 'true', type: 'daily' },
        });
    }

    private async scheduleBackupCleanup(): Promise<void> {
        // Schedule cleanup job to remove expired backups
        this.jobs.enqueue('backup-cleanup', {});
    }
}