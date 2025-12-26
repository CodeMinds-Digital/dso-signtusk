import { ConflictResolution, ConflictResolutionSchema } from './types';

// Simple logger implementation
const logger = {
    info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
    error: (message: string, meta?: any) => console.error(`[ERROR] ${message}`, meta || ''),
    warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
    debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
};

interface DocumentChange {
    field: string;
    value: any;
    userId: string;
    timestamp: Date;
    version: number;
}

interface ConflictDetectionResult {
    field: string;
    currentValue: any;
    incomingValue: any;
    userId: string;
    timestamp: Date;
}

export class ConflictResolver {
    private documentVersions = new Map<string, number>();
    private pendingChanges = new Map<string, DocumentChange[]>();
    private activeConflicts = new Map<string, ConflictResolution>();

    /**
     * Detect conflicts in document changes
     */
    async detectConflicts(
        documentId: string,
        changes: Record<string, any>,
        userId: string,
        timestamp: Date
    ): Promise<ConflictDetectionResult[]> {
        const conflicts: ConflictDetectionResult[] = [];
        const pendingChangesForDoc = this.pendingChanges.get(documentId) || [];

        // Check each incoming change against pending changes
        for (const [field, incomingValue] of Object.entries(changes)) {
            const conflictingChanges = pendingChangesForDoc.filter(change =>
                change.field === field &&
                change.userId !== userId &&
                Math.abs(change.timestamp.getTime() - timestamp.getTime()) < 30000 // 30 seconds window
            );

            if (conflictingChanges.length > 0) {
                const latestConflict = conflictingChanges.sort((a, b) =>
                    b.timestamp.getTime() - a.timestamp.getTime()
                )[0];

                conflicts.push({
                    field,
                    currentValue: latestConflict.value,
                    incomingValue,
                    userId: latestConflict.userId,
                    timestamp: latestConflict.timestamp,
                });
            }
        }

        // Add incoming changes to pending changes
        for (const [field, value] of Object.entries(changes)) {
            const change: DocumentChange = {
                field,
                value,
                userId,
                timestamp,
                version: this.getNextVersion(documentId),
            };

            if (!this.pendingChanges.has(documentId)) {
                this.pendingChanges.set(documentId, []);
            }
            this.pendingChanges.get(documentId)!.push(change);
        }

        // Clean up old pending changes (older than 5 minutes)
        this.cleanupOldChanges(documentId);

        return conflicts;
    }

    /**
     * Resolve conflicts using different strategies
     */
    async resolveConflicts(
        documentId: string,
        conflicts: ConflictDetectionResult[],
        resolution: ConflictResolution['resolution'],
        resolvedBy: string
    ): Promise<ConflictResolution> {
        const conflictResolution: ConflictResolution = {
            documentId,
            conflictType: this.determineConflictType(conflicts),
            conflicts: conflicts.map(conflict => ({
                field: conflict.field,
                currentValue: conflict.currentValue,
                incomingValue: conflict.incomingValue,
                userId: conflict.userId,
                timestamp: conflict.timestamp,
            })),
            resolution,
            resolvedBy,
            resolvedAt: new Date(),
        };

        // Validate the conflict resolution
        const validatedResolution = ConflictResolutionSchema.parse(conflictResolution);

        // Apply resolution strategy
        const resolvedChanges = await this.applyResolutionStrategy(validatedResolution);

        // Store the resolution
        this.activeConflicts.set(documentId, validatedResolution);

        logger.info('Conflict resolved', {
            documentId,
            conflictType: validatedResolution.conflictType,
            resolution,
            resolvedBy,
            conflictCount: conflicts.length,
        });

        return validatedResolution;
    }

    /**
     * Get active conflicts for a document
     */
    getActiveConflicts(documentId: string): ConflictResolution | undefined {
        return this.activeConflicts.get(documentId);
    }

    /**
     * Clear resolved conflicts
     */
    clearResolvedConflicts(documentId: string): void {
        this.activeConflicts.delete(documentId);
        this.pendingChanges.delete(documentId);

        logger.debug('Cleared resolved conflicts', { documentId });
    }

    /**
     * Get document version
     */
    getDocumentVersion(documentId: string): number {
        return this.documentVersions.get(documentId) || 0;
    }

    /**
     * Increment document version
     */
    incrementDocumentVersion(documentId: string): number {
        const currentVersion = this.getDocumentVersion(documentId);
        const newVersion = currentVersion + 1;
        this.documentVersions.set(documentId, newVersion);
        return newVersion;
    }

    /**
     * Apply three-way merge for complex conflicts
     */
    async applyThreeWayMerge(
        documentId: string,
        baseValue: any,
        currentValue: any,
        incomingValue: any
    ): Promise<any> {
        // Simple three-way merge logic
        if (currentValue === baseValue) {
            // No changes in current, use incoming
            return incomingValue;
        } else if (incomingValue === baseValue) {
            // No changes in incoming, use current
            return currentValue;
        } else {
            // Both changed, need manual resolution or smart merge
            if (typeof currentValue === 'object' && typeof incomingValue === 'object') {
                return this.mergeObjects(currentValue, incomingValue);
            } else {
                // For primitive values, prefer the most recent change
                return incomingValue; // Could be configurable
            }
        }
    }

    /**
     * Merge two objects intelligently
     */
    private mergeObjects(current: Record<string, any>, incoming: Record<string, any>): Record<string, any> {
        const merged = { ...current };

        for (const [key, value] of Object.entries(incoming)) {
            if (!(key in current)) {
                // New field, add it
                merged[key] = value;
            } else if (current[key] !== value) {
                // Field changed, use incoming value (could be more sophisticated)
                merged[key] = value;
            }
        }

        return merged;
    }

    /**
     * Determine conflict type based on conflicts
     */
    private determineConflictType(conflicts: ConflictDetectionResult[]): ConflictResolution['conflictType'] {
        const fieldTypes = conflicts.map(c => c.field);

        if (fieldTypes.some(field => field.includes('field_'))) {
            return 'field_collision';
        } else if (fieldTypes.some(field => field === 'version')) {
            return 'version_mismatch';
        } else {
            return 'concurrent_edit';
        }
    }

    /**
     * Apply resolution strategy
     */
    private async applyResolutionStrategy(resolution: ConflictResolution): Promise<Record<string, any>> {
        const resolvedChanges: Record<string, any> = {};

        switch (resolution.resolution) {
            case 'merge':
                // Attempt to merge changes intelligently
                for (const conflict of resolution.conflicts) {
                    resolvedChanges[conflict.field] = await this.applyThreeWayMerge(
                        resolution.documentId,
                        null, // Would need base value from document history
                        conflict.currentValue,
                        conflict.incomingValue
                    );
                }
                break;

            case 'overwrite':
                // Use incoming values
                for (const conflict of resolution.conflicts) {
                    resolvedChanges[conflict.field] = conflict.incomingValue;
                }
                break;

            case 'reject':
                // Keep current values
                for (const conflict of resolution.conflicts) {
                    resolvedChanges[conflict.field] = conflict.currentValue;
                }
                break;

            case 'manual':
                // Manual resolution required - don't auto-apply changes
                logger.info('Manual conflict resolution required', {
                    documentId: resolution.documentId,
                    conflictCount: resolution.conflicts.length,
                });
                break;
        }

        return resolvedChanges;
    }

    /**
     * Get next version number for document
     */
    private getNextVersion(documentId: string): number {
        const currentVersion = this.documentVersions.get(documentId) || 0;
        const nextVersion = currentVersion + 1;
        this.documentVersions.set(documentId, nextVersion);
        return nextVersion;
    }

    /**
     * Clean up old pending changes
     */
    private cleanupOldChanges(documentId: string): void {
        const pendingChanges = this.pendingChanges.get(documentId);
        if (!pendingChanges) return;

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentChanges = pendingChanges.filter(change =>
            change.timestamp > fiveMinutesAgo
        );

        if (recentChanges.length !== pendingChanges.length) {
            this.pendingChanges.set(documentId, recentChanges);

            logger.debug('Cleaned up old pending changes', {
                documentId,
                removedCount: pendingChanges.length - recentChanges.length,
                remainingCount: recentChanges.length,
            });
        }
    }

    /**
     * Get conflict statistics
     */
    getConflictStatistics(): {
        activeConflicts: number;
        pendingChanges: number;
        documentsWithConflicts: number;
    } {
        return {
            activeConflicts: this.activeConflicts.size,
            pendingChanges: Array.from(this.pendingChanges.values()).reduce((sum, changes) => sum + changes.length, 0),
            documentsWithConflicts: this.activeConflicts.size,
        };
    }
}