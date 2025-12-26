import { PrismaClient } from '@signtusk/database';
import { pino } from 'pino';
import {
    TemplateCreate,
    TemplateUpdate,
    TemplateValidationResult,
} from './types';

const logger = pino({ name: 'enterprise-template-manager' });

// Enterprise template management types
export interface BulkTemplateOperation {
    type: 'create' | 'update' | 'delete' | 'duplicate' | 'archive' | 'restore';
    templateId?: string;
    data?: TemplateCreate | TemplateUpdate;
    targetOrganizationId?: string;
}

export interface BulkOperationResult {
    success: boolean;
    processedCount: number;
    failedCount: number;
    results: Array<{
        operation: BulkTemplateOperation;
        success: boolean;
        templateId?: string;
        error?: string;
    }>;
    validationErrors: string[];
}

export interface TemplateVersion {
    id: string;
    templateId: string;
    version: number;
    name: string;
    description?: string;
    changes: TemplateChangeRecord[];
    createdBy: string;
    createdAt: Date;
    isActive: boolean;
}

export interface TemplateChangeRecord {
    field: string;
    oldValue: any;
    newValue: any;
    changeType: 'added' | 'modified' | 'removed';
    timestamp: Date;
    userId: string;
}

export interface GovernancePolicy {
    id: string;
    organizationId: string;
    name: string;
    description?: string;
    rules: GovernanceRule[];
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface GovernanceRule {
    type: 'approval_required' | 'field_validation' | 'recipient_restriction' | 'sharing_restriction' | 'retention_policy';
    conditions: Record<string, any>;
    actions: Record<string, any>;
    severity: 'warning' | 'error' | 'block';
}

export interface ComplianceAuditResult {
    templateId: string;
    complianceScore: number;
    violations: ComplianceViolation[];
    recommendations: ComplianceRecommendation[];
    lastAuditDate: Date;
}

export interface ComplianceViolation {
    ruleId: string;
    ruleName: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    field?: string;
    suggestedFix?: string;
}

export interface ComplianceRecommendation {
    type: 'security' | 'accessibility' | 'legal' | 'performance';
    priority: 'low' | 'medium' | 'high';
    description: string;
    implementation: string;
}

export class EnterpriseTemplateManager {
    constructor(private db: PrismaClient) { }

    /**
     * Execute bulk template operations with comprehensive validation
     */
    async executeBulkOperations(
        operations: BulkTemplateOperation[],
        userId: string,
        organizationId: string
    ): Promise<BulkOperationResult> {
        const result: BulkOperationResult = {
            success: true,
            processedCount: 0,
            failedCount: 0,
            results: [],
            validationErrors: [],
        };

        // Pre-validate all operations
        const validationErrors = await this.validateBulkOperations(operations, organizationId);
        if (validationErrors.length > 0) {
            result.success = false;
            result.validationErrors = validationErrors;
            return result;
        }

        // Execute operations in transaction for consistency
        try {
            await this.db.$transaction(async (tx) => {
                for (const operation of operations) {
                    try {
                        const operationResult = await this.executeSingleOperation(
                            operation,
                            userId,
                            organizationId,
                            tx
                        );

                        result.results.push({
                            operation,
                            success: operationResult.success,
                            templateId: operationResult.templateId,
                            error: operationResult.error,
                        });

                        if (operationResult.success) {
                            result.processedCount++;
                        } else {
                            result.failedCount++;
                            result.success = false;
                        }
                    } catch (error) {
                        result.results.push({
                            operation,
                            success: false,
                            error: error instanceof Error ? error.message : 'Unknown error',
                        });
                        result.failedCount++;
                        result.success = false;
                    }
                }
            });

            logger.info(
                {
                    operationCount: operations.length,
                    processedCount: result.processedCount,
                    failedCount: result.failedCount,
                    userId,
                    organizationId
                },
                'Bulk template operations completed'
            );

            return result;
        } catch (error) {
            logger.error({ error, userId, organizationId }, 'Bulk template operations failed');
            result.success = false;
            result.validationErrors.push('Transaction failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
            return result;
        }
    }

    /**
     * Create a new template version with change tracking
     */
    async createTemplateVersion(
        templateId: string,
        changes: TemplateUpdate,
        userId: string,
        organizationId: string,
        changeDescription?: string
    ): Promise<{ success: boolean; version?: TemplateVersion; error?: string }> {
        try {
            // Get current template
            const currentTemplate = await this.db.template.findFirst({
                where: {
                    id: templateId,
                    organizationId,
                },
                include: {
                    templateFields: true,
                    templateRecipients: true,
                },
            });

            if (!currentTemplate) {
                return { success: false, error: 'Template not found' };
            }

            // Calculate changes
            const changeRecords = this.calculateTemplateChanges(
                currentTemplate,
                changes,
                userId
            );

            // Create version record
            const version = await this.db.$transaction(async (tx) => {
                // Get next version number
                const lastVersion = await tx.templateVersion.findFirst({
                    where: { templateId },
                    orderBy: { version: 'desc' },
                });

                const nextVersion = (lastVersion?.version || 0) + 1;

                // Create version record
                const newVersion = await tx.templateVersion.create({
                    data: {
                        templateId,
                        version: nextVersion,
                        name: (changes as any).name || (currentTemplate as any).name,
                        description: changeDescription,
                        changes: JSON.parse(JSON.stringify(changeRecords)),
                        createdBy: userId,
                        isActive: true,
                    },
                });

                // Deactivate previous versions
                await tx.templateVersion.updateMany({
                    where: {
                        templateId,
                        id: { not: newVersion.id },
                    },
                    data: { isActive: false },
                });

                // Update template with changes
                const templateData = currentTemplate as any;
                const changesData = changes as any;
                await tx.template.update({
                    where: { id: templateId },
                    data: {
                        name: changesData.name,
                        description: changesData.description,
                        category: changesData.category,
                        tags: changesData.tags,
                        isPublic: changesData.isPublic,
                        settings: changesData.settings ?
                            { ...templateData.settings as any, ...changesData.settings } :
                            undefined,
                        workflow: changesData.workflow || templateData.workflow,
                        updatedAt: new Date(),
                    },
                });

                return newVersion;
            });

            logger.info(
                { templateId, version: version.version, userId },
                'Template version created successfully'
            );

            return {
                success: true,
                version: {
                    id: version.id,
                    templateId: version.templateId,
                    version: version.version,
                    name: version.name,
                    description: version.description || undefined,
                    changes: changeRecords,
                    createdBy: version.createdBy,
                    createdAt: version.createdAt,
                    isActive: version.isActive,
                },
            };
        } catch (error) {
            logger.error({ error, templateId, userId }, 'Failed to create template version');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create version',
            };
        }
    }

    /**
     * Get template version history
     */
    async getTemplateVersionHistory(
        templateId: string,
        organizationId: string
    ): Promise<TemplateVersion[]> {
        try {
            const versions = await this.db.templateVersion.findMany({
                where: {
                    templateId,
                    template: {
                        organizationId,
                    },
                },
                orderBy: { version: 'desc' },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            return versions.map(version => ({
                id: version.id,
                templateId: version.templateId,
                version: version.version,
                name: version.name,
                description: version.description || undefined,
                changes: Array.isArray(version.changes)
                    ? version.changes as unknown as TemplateChangeRecord[]
                    : [],
                createdBy: version.createdBy,
                createdAt: version.createdAt,
                isActive: version.isActive,
            }));
        } catch (error) {
            logger.error({ error, templateId }, 'Failed to get template version history');
            return [];
        }
    }

    /**
     * Restore template to a specific version
     */
    async restoreTemplateVersion(
        templateId: string,
        versionId: string,
        userId: string,
        organizationId: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const version = await this.db.templateVersion.findFirst({
                where: {
                    id: versionId,
                    templateId,
                    template: {
                        organizationId,
                    },
                },
            });

            if (!version) {
                return { success: false, error: 'Version not found' };
            }

            // Create a new version based on the restored version
            const restoreResult = await this.createTemplateVersion(
                templateId,
                { name: version.name, description: version.description || undefined },
                userId,
                organizationId,
                `Restored from version ${version.version}`
            );

            if (!restoreResult.success) {
                return { success: false, error: restoreResult.error };
            }

            logger.info(
                { templateId, versionId, userId },
                'Template version restored successfully'
            );

            return { success: true };
        } catch (error) {
            logger.error({ error, templateId, versionId, userId }, 'Failed to restore template version');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to restore version',
            };
        }
    }

    /**
     * Create or update governance policy
     */
    async createGovernancePolicy(
        policy: Omit<GovernancePolicy, 'id' | 'createdAt' | 'updatedAt'>,
        userId: string
    ): Promise<{ success: boolean; policy?: GovernancePolicy; error?: string }> {
        try {
            const newPolicy = await this.db.governancePolicy.create({
                data: {
                    organizationId: policy.organizationId,
                    name: policy.name,
                    description: policy.description,
                    rules: JSON.parse(JSON.stringify(policy.rules)),
                    isActive: policy.isActive,
                    createdBy: userId,
                },
            });

            logger.info(
                { policyId: newPolicy.id, organizationId: policy.organizationId, userId },
                'Governance policy created successfully'
            );

            return {
                success: true,
                policy: {
                    id: newPolicy.id,
                    organizationId: newPolicy.organizationId,
                    name: newPolicy.name,
                    description: newPolicy.description || undefined,
                    rules: Array.isArray(newPolicy.rules)
                        ? newPolicy.rules as unknown as GovernanceRule[]
                        : [],
                    isActive: newPolicy.isActive,
                    createdBy: newPolicy.createdBy,
                    createdAt: newPolicy.createdAt,
                    updatedAt: newPolicy.updatedAt,
                },
            };
        } catch (error) {
            logger.error({ error, policy, userId }, 'Failed to create governance policy');
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to create policy',
            };
        }
    }

    /**
     * Validate template against governance policies
     */
    async validateTemplateCompliance(
        templateId: string,
        organizationId: string
    ): Promise<ComplianceAuditResult> {
        try {
            // Get template and governance policies
            const [template, policies] = await Promise.all([
                this.db.template.findFirst({
                    where: { id: templateId, organizationId },
                    include: {
                        templateFields: true,
                        templateRecipients: true,
                    },
                }),
                this.db.governancePolicy.findMany({
                    where: { organizationId, isActive: true },
                }),
            ]);

            if (!template) {
                throw new Error('Template not found');
            }

            const violations: ComplianceViolation[] = [];
            const recommendations: ComplianceRecommendation[] = [];

            // Check each policy
            for (const policy of policies) {
                const policyViolations = this.checkPolicyCompliance(
                    template,
                    Array.isArray(policy.rules)
                        ? policy.rules as unknown as GovernanceRule[]
                        : []
                );
                violations.push(...policyViolations);
            }

            // Generate recommendations
            recommendations.push(...this.generateComplianceRecommendations(template, violations));

            // Calculate compliance score
            const complianceScore = this.calculateComplianceScore(violations);

            // Record audit
            await this.db.complianceAudit.create({
                data: {
                    templateId,
                    organizationId,
                    complianceScore,
                    violations: JSON.parse(JSON.stringify(violations)),
                    recommendations: JSON.parse(JSON.stringify(recommendations)),
                    auditedBy: 'system',
                },
            });

            return {
                templateId,
                complianceScore,
                violations,
                recommendations,
                lastAuditDate: new Date(),
            };
        } catch (error) {
            logger.error({ error, templateId, organizationId }, 'Failed to validate template compliance');
            throw error;
        }
    }

    /**
     * Get compliance audit history for a template
     */
    async getComplianceAuditHistory(
        templateId: string,
        organizationId: string
    ): Promise<ComplianceAuditResult[]> {
        try {
            const audits = await this.db.complianceAudit.findMany({
                where: {
                    templateId,
                    organizationId,
                },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });

            return audits.map(audit => ({
                templateId: audit.templateId,
                complianceScore: audit.complianceScore,
                violations: Array.isArray(audit.violations)
                    ? audit.violations as unknown as ComplianceViolation[]
                    : [],
                recommendations: Array.isArray(audit.recommendations)
                    ? audit.recommendations as unknown as ComplianceRecommendation[]
                    : [],
                lastAuditDate: audit.createdAt,
            }));
        } catch (error) {
            logger.error({ error, templateId, organizationId }, 'Failed to get compliance audit history');
            return [];
        }
    }

    /**
     * Generate compliance report for organization
     */
    async generateOrganizationComplianceReport(
        organizationId: string,
        startDate?: Date,
        endDate?: Date
    ): Promise<{
        totalTemplates: number;
        compliantTemplates: number;
        averageComplianceScore: number;
        criticalViolations: number;
        topViolations: Array<{ type: string; count: number }>;
        trends: Array<{ date: string; score: number }>;
    }> {
        try {
            const dateFilter = {
                ...(startDate && { gte: startDate }),
                ...(endDate && { lte: endDate }),
            };

            const [templates, audits] = await Promise.all([
                this.db.template.count({
                    where: { organizationId },
                }),
                this.db.complianceAudit.findMany({
                    where: {
                        organizationId,
                        ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
                    },
                    orderBy: { createdAt: 'desc' },
                }),
            ]);

            // Calculate metrics
            const compliantTemplates = audits.filter(audit => audit.complianceScore >= 80).length;
            const averageScore = audits.length > 0
                ? audits.reduce((sum, audit) => sum + audit.complianceScore, 0) / audits.length
                : 0;

            // Count violations
            const allViolations = audits.flatMap(audit =>
                Array.isArray(audit.violations)
                    ? audit.violations as unknown as ComplianceViolation[]
                    : []
            );
            const criticalViolations = allViolations.filter(v => v.severity === 'critical').length;

            // Top violations
            const violationCounts = allViolations.reduce((acc, violation) => {
                acc[violation.ruleName] = (acc[violation.ruleName] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const topViolations = Object.entries(violationCounts)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => ({ type, count }));

            // Trends (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const recentAudits = audits.filter(audit => audit.createdAt >= thirtyDaysAgo);
            const trends = this.calculateComplianceTrends(recentAudits);

            return {
                totalTemplates: templates,
                compliantTemplates,
                averageComplianceScore: Math.round(averageScore * 100) / 100,
                criticalViolations,
                topViolations,
                trends,
            };
        } catch (error) {
            logger.error({ error, organizationId }, 'Failed to generate compliance report');
            throw error;
        }
    }

    // Private helper methods

    private async validateBulkOperations(
        operations: BulkTemplateOperation[],
        organizationId: string
    ): Promise<string[]> {
        const errors: string[] = [];

        if (operations.length === 0) {
            errors.push('No operations provided');
            return errors;
        }

        if (operations.length > 100) {
            errors.push('Maximum 100 operations allowed per batch');
        }

        // Validate each operation
        for (let i = 0; i < operations.length; i++) {
            const operation = operations[i];

            switch (operation.type) {
                case 'create':
                    if (!operation.data) {
                        errors.push(`Operation ${i}: Create operation requires data`);
                    }
                    break;
                case 'update':
                    if (!operation.templateId || !operation.data) {
                        errors.push(`Operation ${i}: Update operation requires templateId and data`);
                    }
                    break;
                case 'delete':
                case 'duplicate':
                case 'archive':
                case 'restore':
                    if (!operation.templateId) {
                        errors.push(`Operation ${i}: ${operation.type} operation requires templateId`);
                    }
                    break;
            }
        }

        return errors;
    }

    private async executeSingleOperation(
        operation: BulkTemplateOperation,
        userId: string,
        organizationId: string,
        tx: any
    ): Promise<{ success: boolean; templateId?: string; error?: string }> {
        switch (operation.type) {
            case 'create':
                return await this.executeCreateOperation(operation, userId, organizationId, tx);
            case 'update':
                return await this.executeUpdateOperation(operation, userId, organizationId, tx);
            case 'delete':
                return await this.executeDeleteOperation(operation, userId, organizationId, tx);
            case 'duplicate':
                return await this.executeDuplicateOperation(operation, userId, organizationId, tx);
            case 'archive':
                return await this.executeArchiveOperation(operation, userId, organizationId, tx);
            case 'restore':
                return await this.executeRestoreOperation(operation, userId, organizationId, tx);
            default:
                return { success: false, error: 'Unknown operation type' };
        }
    }

    private async executeCreateOperation(
        operation: BulkTemplateOperation,
        userId: string,
        organizationId: string,
        tx: any
    ): Promise<{ success: boolean; templateId?: string; error?: string }> {
        try {
            const template = await tx.template.create({
                data: {
                    ...operation.data,
                    organizationId,
                    createdBy: userId,
                },
            });
            return { success: true, templateId: template.id };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Create failed' };
        }
    }

    private async executeUpdateOperation(
        operation: BulkTemplateOperation,
        userId: string,
        organizationId: string,
        tx: any
    ): Promise<{ success: boolean; templateId?: string; error?: string }> {
        try {
            await tx.template.update({
                where: {
                    id: operation.templateId,
                    organizationId,
                },
                data: {
                    ...operation.data,
                    updatedAt: new Date(),
                },
            });
            return { success: true, templateId: operation.templateId };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Update failed' };
        }
    }

    private async executeDeleteOperation(
        operation: BulkTemplateOperation,
        userId: string,
        organizationId: string,
        tx: any
    ): Promise<{ success: boolean; templateId?: string; error?: string }> {
        try {
            await tx.template.delete({
                where: {
                    id: operation.templateId,
                    organizationId,
                },
            });
            return { success: true, templateId: operation.templateId };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
        }
    }

    private async executeDuplicateOperation(
        operation: BulkTemplateOperation,
        userId: string,
        organizationId: string,
        tx: any
    ): Promise<{ success: boolean; templateId?: string; error?: string }> {
        try {
            const original = await tx.template.findUnique({
                where: { id: operation.templateId },
                include: {
                    templateFields: true,
                    templateRecipients: true,
                },
            });

            if (!original) {
                return { success: false, error: 'Template not found' };
            }

            const duplicate = await tx.template.create({
                data: {
                    name: `${original.name} (Copy)`,
                    description: original.description,
                    documentId: original.documentId,
                    organizationId: operation.targetOrganizationId || organizationId,
                    createdBy: userId,
                    isPublic: false,
                    category: original.category,
                    tags: original.tags,
                    settings: original.settings,
                    workflow: original.workflow,
                },
            });

            return { success: true, templateId: duplicate.id };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Duplicate failed' };
        }
    }

    private async executeArchiveOperation(
        operation: BulkTemplateOperation,
        userId: string,
        organizationId: string,
        tx: any
    ): Promise<{ success: boolean; templateId?: string; error?: string }> {
        try {
            await tx.template.update({
                where: {
                    id: operation.templateId,
                    organizationId,
                },
                data: {
                    isArchived: true,
                    archivedAt: new Date(),
                    archivedBy: userId,
                },
            });
            return { success: true, templateId: operation.templateId };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Archive failed' };
        }
    }

    private async executeRestoreOperation(
        operation: BulkTemplateOperation,
        userId: string,
        organizationId: string,
        tx: any
    ): Promise<{ success: boolean; templateId?: string; error?: string }> {
        try {
            await tx.template.update({
                where: {
                    id: operation.templateId,
                    organizationId,
                },
                data: {
                    isArchived: false,
                    archivedAt: null,
                    archivedBy: null,
                },
            });
            return { success: true, templateId: operation.templateId };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : 'Restore failed' };
        }
    }

    private calculateTemplateChanges(
        currentTemplate: any,
        changes: TemplateUpdate,
        userId: string
    ): TemplateChangeRecord[] {
        const changeRecords: TemplateChangeRecord[] = [];
        const timestamp = new Date();

        // Compare each field
        const fieldsToCheck = ['name', 'description', 'category', 'tags', 'isPublic', 'settings', 'workflow'];

        for (const field of fieldsToCheck) {
            if (changes[field as keyof TemplateUpdate] !== undefined) {
                const oldValue = currentTemplate[field];
                const newValue = changes[field as keyof TemplateUpdate];

                if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
                    changeRecords.push({
                        field,
                        oldValue,
                        newValue,
                        changeType: oldValue === null || oldValue === undefined ? 'added' : 'modified',
                        timestamp,
                        userId,
                    });
                }
            }
        }

        return changeRecords;
    }

    private checkPolicyCompliance(
        template: any,
        rules: GovernanceRule[]
    ): ComplianceViolation[] {
        const violations: ComplianceViolation[] = [];

        for (const rule of rules) {
            switch (rule.type) {
                case 'approval_required':
                    if (template.isPublic && !rule.conditions.allowPublicTemplates) {
                        violations.push({
                            ruleId: `approval_${Date.now()}`,
                            ruleName: 'Public Template Approval Required',
                            severity: 'medium',
                            description: 'Public templates require approval before activation',
                            field: 'isPublic',
                            suggestedFix: 'Submit template for approval or make it private',
                        });
                    }
                    break;

                case 'field_validation':
                    if (rule.conditions.requiredFields) {
                        const requiredFields = rule.conditions.requiredFields as string[];
                        const templateFields = template.templateFields?.map((f: any) => f.type) || [];

                        for (const requiredField of requiredFields) {
                            if (!templateFields.includes(requiredField)) {
                                violations.push({
                                    ruleId: `field_${requiredField}`,
                                    ruleName: 'Required Field Missing',
                                    severity: 'high',
                                    description: `Template must include ${requiredField} field`,
                                    field: 'templateFields',
                                    suggestedFix: `Add a ${requiredField} field to the template`,
                                });
                            }
                        }
                    }
                    break;

                case 'recipient_restriction':
                    const maxRecipients = rule.conditions.maxRecipients as number;
                    if (maxRecipients && template.templateRecipients?.length > maxRecipients) {
                        violations.push({
                            ruleId: 'recipient_limit',
                            ruleName: 'Recipient Limit Exceeded',
                            severity: 'medium',
                            description: `Template exceeds maximum of ${maxRecipients} recipients`,
                            field: 'templateRecipients',
                            suggestedFix: `Reduce recipients to ${maxRecipients} or fewer`,
                        });
                    }
                    break;

                case 'sharing_restriction':
                    if (template.isPublic && rule.conditions.blockPublicSharing) {
                        violations.push({
                            ruleId: 'sharing_blocked',
                            ruleName: 'Public Sharing Blocked',
                            severity: 'high',
                            description: 'Public sharing is not allowed by organization policy',
                            field: 'isPublic',
                            suggestedFix: 'Make template private or request policy exception',
                        });
                    }
                    break;
            }
        }

        return violations;
    }

    private generateComplianceRecommendations(
        template: any,
        violations: ComplianceViolation[]
    ): ComplianceRecommendation[] {
        const recommendations: ComplianceRecommendation[] = [];

        // Security recommendations
        if (!template.settings?.requireAuthentication) {
            recommendations.push({
                type: 'security',
                priority: 'medium',
                description: 'Enable recipient authentication for enhanced security',
                implementation: 'Set requireAuthentication to true in template settings',
            });
        }

        // Accessibility recommendations
        if (!template.settings?.accessibilityCompliant) {
            recommendations.push({
                type: 'accessibility',
                priority: 'high',
                description: 'Ensure template meets accessibility standards',
                implementation: 'Review field placement and add alternative text for images',
            });
        }

        // Performance recommendations
        if (template.templateFields?.length > 50) {
            recommendations.push({
                type: 'performance',
                priority: 'low',
                description: 'Consider reducing the number of fields for better performance',
                implementation: 'Combine related fields or split into multiple templates',
            });
        }

        // Legal recommendations based on violations
        const hasLegalViolations = violations.some(v => v.severity === 'critical');
        if (hasLegalViolations) {
            recommendations.push({
                type: 'legal',
                priority: 'high',
                description: 'Address critical compliance violations before using template',
                implementation: 'Review and fix all critical violations listed above',
            });
        }

        return recommendations;
    }

    private calculateComplianceScore(violations: ComplianceViolation[]): number {
        if (violations.length === 0) return 100;

        const severityWeights = {
            low: 5,
            medium: 15,
            high: 30,
            critical: 50,
        };

        const totalDeduction = violations.reduce((sum, violation) => {
            return sum + severityWeights[violation.severity];
        }, 0);

        return Math.max(0, 100 - totalDeduction);
    }

    private calculateComplianceTrends(audits: any[]): Array<{ date: string; score: number }> {
        const dailyScores = audits.reduce((acc, audit) => {
            const date = audit.createdAt.toISOString().split('T')[0];
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(audit.complianceScore);
            return acc;
        }, {} as Record<string, number[]>);

        return Object.entries(dailyScores)
            .map(([date, scores]) => ({
                date,
                score: Math.round(((scores as number[]).reduce((sum: number, score: number) => sum + score, 0) / (scores as number[]).length) * 100) / 100,
            }))
            .sort((a, b) => a.date.localeCompare(b.date));
    }
}