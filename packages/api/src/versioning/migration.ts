/**
 * API Migration Tools
 * 
 * This module provides automated migration tools and utilities
 * to help developers transition between API versions.
 */

import { APIVersion, MigrationStep, MigrationGuide } from './types';
import { getMigrationGuide, getVersionMetadata } from './config';

/**
 * Migration analysis result
 */
export interface MigrationAnalysis {
    /** Source version */
    from: APIVersion;

    /** Target version */
    to: APIVersion;

    /** Whether migration is possible */
    possible: boolean;

    /** Migration complexity */
    complexity: 'low' | 'medium' | 'high';

    /** Estimated migration time */
    estimatedTime: string;

    /** Breaking changes count */
    breakingChanges: number;

    /** Required steps */
    steps: MigrationStep[];

    /** Automated transformation availability */
    automatedTransforms: number;

    /** Manual steps required */
    manualSteps: number;

    /** Migration guide URL */
    guideUrl: string | null;

    /** Recommended migration path */
    recommendedPath: APIVersion[];
}

/**
 * Data transformation result
 */
export interface TransformationResult {
    /** Whether transformation was successful */
    success: boolean;

    /** Transformed data */
    data: any;

    /** Transformation warnings */
    warnings: string[];

    /** Transformation errors */
    errors: string[];

    /** Applied transformations */
    appliedTransforms: string[];
}

/**
 * Migration compatibility checker
 */
export class MigrationCompatibilityChecker {
    /**
     * Check if direct migration is possible between versions
     */
    static canMigrateDirectly(from: APIVersion, to: APIVersion): boolean {
        const guide = getMigrationGuide(from, to);
        return guide !== null;
    }

    /**
     * Find migration path between versions
     */
    static findMigrationPath(from: APIVersion, to: APIVersion): APIVersion[] {
        // Direct migration available
        if (this.canMigrateDirectly(from, to)) {
            return [from, to];
        }

        // Multi-step migration (simplified - in real implementation, use graph traversal)
        const versions: APIVersion[] = ['v1', 'v2', 'v3'];
        const fromIndex = versions.indexOf(from);
        const toIndex = versions.indexOf(to);

        if (fromIndex === -1 || toIndex === -1) {
            return [];
        }

        // Sequential migration path
        const path: APIVersion[] = [];
        const step = fromIndex < toIndex ? 1 : -1;

        for (let i = fromIndex; i !== toIndex + step; i += step) {
            path.push(versions[i]);
        }

        return path;
    }

    /**
     * Analyze migration requirements
     */
    static analyzeMigration(from: APIVersion, to: APIVersion): MigrationAnalysis {
        const guide = getMigrationGuide(from, to);
        const path = this.findMigrationPath(from, to);

        if (!guide || path.length === 0) {
            return {
                from,
                to,
                possible: false,
                complexity: 'high',
                estimatedTime: 'Unknown',
                breakingChanges: 0,
                steps: [],
                automatedTransforms: 0,
                manualSteps: 0,
                guideUrl: null,
                recommendedPath: []
            };
        }

        const breakingSteps = guide.steps.filter(step => step.breaking);
        const automatedSteps = guide.steps.filter(step => step.transform);
        const manualSteps = guide.steps.reduce(
            (total, step) => total + step.manualSteps.length,
            0
        );

        return {
            from,
            to,
            possible: true,
            complexity: guide.complexity,
            estimatedTime: guide.estimatedTime,
            breakingChanges: breakingSteps.length,
            steps: guide.steps,
            automatedTransforms: automatedSteps.length,
            manualSteps,
            guideUrl: guide.resources.documentation,
            recommendedPath: path
        };
    }
}

/**
 * Automated data transformer
 */
export class DataTransformer {
    /**
     * Transform data between API versions
     */
    static transform(
        data: any,
        from: APIVersion,
        to: APIVersion
    ): TransformationResult {
        const guide = getMigrationGuide(from, to);

        if (!guide) {
            return {
                success: false,
                data,
                warnings: [],
                errors: [`No migration guide available from ${from} to ${to}`],
                appliedTransforms: []
            };
        }

        let transformedData = JSON.parse(JSON.stringify(data)); // Deep clone
        const warnings: string[] = [];
        const errors: string[] = [];
        const appliedTransforms: string[] = [];

        // Apply automated transformations
        for (const step of guide.steps) {
            if (step.transform) {
                try {
                    transformedData = step.transform(transformedData);
                    appliedTransforms.push(step.id);
                } catch (error) {
                    errors.push(`Transformation failed for step ${step.id}: ${error}`);
                }
            } else if (step.breaking) {
                warnings.push(
                    `Manual intervention required for step ${step.id}: ${step.description}`
                );
            }
        }

        return {
            success: errors.length === 0,
            data: transformedData,
            warnings,
            errors,
            appliedTransforms
        };
    }

    /**
     * Validate transformed data
     */
    static validateTransformation(
        original: any,
        transformed: any,
        from: APIVersion,
        to: APIVersion
    ): { valid: boolean; issues: string[] } {
        const issues: string[] = [];

        // Basic validation - ensure no data loss
        if (typeof original === 'object' && typeof transformed === 'object') {
            const originalKeys = Object.keys(original);
            const transformedKeys = Object.keys(transformed);

            // Check for missing required fields (simplified validation)
            const missingKeys = originalKeys.filter(key =>
                !transformedKeys.includes(key) &&
                !this.isFieldRemoved(key, from, to)
            );

            if (missingKeys.length > 0) {
                issues.push(`Missing fields after transformation: ${missingKeys.join(', ')}`);
            }
        }

        return {
            valid: issues.length === 0,
            issues
        };
    }

    /**
     * Check if field was intentionally removed in migration
     */
    private static isFieldRemoved(field: string, from: APIVersion, to: APIVersion): boolean {
        const guide = getMigrationGuide(from, to);
        if (!guide) return false;

        // Check if any migration step mentions this field removal
        return guide.steps.some(step =>
            step.description.toLowerCase().includes(field.toLowerCase()) &&
            step.description.toLowerCase().includes('remove')
        );
    }
}

/**
 * Migration planning utilities
 */
export class MigrationPlanner {
    /**
     * Generate migration checklist
     */
    static generateChecklist(from: APIVersion, to: APIVersion): {
        preRequisites: string[];
        steps: Array<{
            id: string;
            title: string;
            description: string;
            type: 'automated' | 'manual' | 'verification';
            estimatedTime: string;
            dependencies: string[];
        }>;
        postMigration: string[];
    } {
        const analysis = MigrationCompatibilityChecker.analyzeMigration(from, to);

        if (!analysis.possible) {
            return {
                preRequisites: ['Migration not possible - no direct path available'],
                steps: [],
                postMigration: []
            };
        }

        const preRequisites = [
            'Backup current implementation',
            'Set up development environment for testing',
            'Review breaking changes documentation',
            'Plan rollback strategy'
        ];

        const steps = analysis.steps.map(step => ({
            id: step.id,
            title: step.description,
            description: step.manualSteps.join('\n'),
            type: step.transform ? 'automated' as const : 'manual' as const,
            estimatedTime: step.breaking ? '2-4 hours' : '30-60 minutes',
            dependencies: [] // Could be enhanced to track step dependencies
        }));

        // Add verification steps
        steps.push({
            id: 'verification',
            title: 'Verify migration completeness',
            description: 'Test all functionality with new API version',
            type: 'verification',
            estimatedTime: '4-8 hours',
            dependencies: steps.map(s => s.id)
        });

        const postMigration = [
            'Update documentation',
            'Monitor error rates and performance',
            'Communicate changes to team',
            'Schedule old version deprecation'
        ];

        return {
            preRequisites,
            steps,
            postMigration
        };
    }

    /**
     * Estimate migration effort
     */
    static estimateEffort(from: APIVersion, to: APIVersion): {
        totalHours: number;
        breakdown: {
            planning: number;
            implementation: number;
            testing: number;
            deployment: number;
        };
        riskLevel: 'low' | 'medium' | 'high';
        recommendations: string[];
    } {
        const analysis = MigrationCompatibilityChecker.analyzeMigration(from, to);

        if (!analysis.possible) {
            return {
                totalHours: 0,
                breakdown: { planning: 0, implementation: 0, testing: 0, deployment: 0 },
                riskLevel: 'high',
                recommendations: ['Migration not possible without intermediate steps']
            };
        }

        // Base effort calculation
        const baseHours = {
            low: { planning: 4, implementation: 8, testing: 8, deployment: 4 },
            medium: { planning: 8, implementation: 16, testing: 16, deployment: 8 },
            high: { planning: 16, implementation: 32, testing: 24, deployment: 16 }
        };

        const breakdown = baseHours[analysis.complexity];
        const totalHours = Object.values(breakdown).reduce((sum, hours) => sum + hours, 0);

        const recommendations = [
            'Start with non-production environment',
            'Implement feature flags for gradual rollout',
            'Set up comprehensive monitoring',
            'Prepare rollback procedures'
        ];

        if (analysis.breakingChanges > 3) {
            recommendations.push('Consider phased migration approach');
        }

        if (analysis.manualSteps > 10) {
            recommendations.push('Allocate additional time for manual steps');
        }

        return {
            totalHours,
            breakdown,
            riskLevel: analysis.complexity,
            recommendations
        };
    }
}

/**
 * Migration status tracking
 */
export interface MigrationStatus {
    id: string;
    from: APIVersion;
    to: APIVersion;
    status: 'planned' | 'in-progress' | 'completed' | 'failed' | 'rolled-back';
    startedAt: string;
    completedAt?: string;
    completedSteps: string[];
    failedSteps: string[];
    currentStep?: string;
    progress: number; // 0-100
    issues: Array<{
        step: string;
        severity: 'warning' | 'error';
        message: string;
        timestamp: string;
    }>;
}

/**
 * Migration tracker for monitoring progress
 */
export class MigrationTracker {
    private static migrations = new Map<string, MigrationStatus>();

    /**
     * Start tracking a migration
     */
    static startMigration(
        id: string,
        from: APIVersion,
        to: APIVersion
    ): MigrationStatus {
        const status: MigrationStatus = {
            id,
            from,
            to,
            status: 'in-progress',
            startedAt: new Date().toISOString(),
            completedSteps: [],
            failedSteps: [],
            progress: 0,
            issues: []
        };

        this.migrations.set(id, status);
        return status;
    }

    /**
     * Update migration progress
     */
    static updateProgress(
        id: string,
        stepId: string,
        success: boolean,
        issues?: string[]
    ): MigrationStatus | null {
        const migration = this.migrations.get(id);
        if (!migration) return null;

        if (success) {
            migration.completedSteps.push(stepId);
        } else {
            migration.failedSteps.push(stepId);
        }

        // Add issues
        if (issues) {
            issues.forEach(issue => {
                migration.issues.push({
                    step: stepId,
                    severity: success ? 'warning' : 'error',
                    message: issue,
                    timestamp: new Date().toISOString()
                });
            });
        }

        // Calculate progress
        const analysis = MigrationCompatibilityChecker.analyzeMigration(
            migration.from,
            migration.to
        );
        const totalSteps = analysis.steps.length;
        migration.progress = Math.round(
            (migration.completedSteps.length / totalSteps) * 100
        );

        // Update status
        if (migration.failedSteps.length > 0) {
            migration.status = 'failed';
        } else if (migration.progress === 100) {
            migration.status = 'completed';
            migration.completedAt = new Date().toISOString();
        }

        this.migrations.set(id, migration);
        return migration;
    }

    /**
     * Get migration status
     */
    static getStatus(id: string): MigrationStatus | null {
        return this.migrations.get(id) || null;
    }

    /**
     * List all migrations
     */
    static listMigrations(): MigrationStatus[] {
        return Array.from(this.migrations.values());
    }
}