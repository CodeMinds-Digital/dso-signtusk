import { PrismaClient } from '@signtusk/database';
import { pino } from 'pino';
import { z } from 'zod';
import { createHash } from 'node:crypto';
import { TemplateCreate, TemplateField, TemplateRecipient, WorkflowConfig } from './types';

const logger = pino({ name: 'template-import-export-service' });

// ============================================================================
// EXPORT SCHEMAS AND TYPES
// ============================================================================

export const TemplateExportFormatSchema = z.enum([
    'JSON',
    'XML',
    'DOCUSIGN_TEMPLATE',
    'ADOBE_SIGN_TEMPLATE',
    'PANDADOC_TEMPLATE',
    'HELLOSIGN_TEMPLATE',
    'SIGNREQUEST_TEMPLATE',
    'BACKUP_ARCHIVE'
]);

export const TemplateExportOptionsSchema = z.object({
    format: TemplateExportFormatSchema,
    includeDocument: z.boolean().default(true),
    includeAnalytics: z.boolean().default(false),
    includeAuditTrail: z.boolean().default(false),
    includeCollaborationData: z.boolean().default(false),
    includeVersionHistory: z.boolean().default(false),
    compression: z.enum(['none', 'gzip', 'zip']).default('none'),
    encryption: z.object({
        enabled: z.boolean().default(false),
        password: z.string().optional(),
        algorithm: z.enum(['AES-256-GCM', 'AES-192-GCM', 'AES-128-GCM']).default('AES-256-GCM')
    }).optional()
});

export const TemplateImportOptionsSchema = z.object({
    sourceFormat: TemplateExportFormatSchema,
    conflictResolution: z.enum(['skip', 'overwrite', 'rename', 'merge']).default('rename'),
    validateFields: z.boolean().default(true),
    preserveIds: z.boolean().default(false),
    organizationMapping: z.record(z.string()).optional(),
    userMapping: z.record(z.string()).optional(),
    documentMapping: z.record(z.string()).optional()
});

export const BulkExportOptionsSchema = z.object({
    templateIds: z.array(z.string()).optional(),
    organizationId: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
        from: z.date(),
        to: z.date()
    }).optional(),
    exportOptions: TemplateExportOptionsSchema
});

export const MigrationOptionsSchema = z.object({
    sourceSystem: z.enum(['DOCUSIGN', 'ADOBE_SIGN', 'PANDADOC', 'HELLOSIGN', 'SIGNREQUEST', 'OTHER']),
    targetOrganizationId: z.string(),
    fieldMapping: z.record(z.string()).optional(),
    recipientRoleMapping: z.record(z.string()).optional(),
    preserveWorkflow: z.boolean().default(true),
    dryRun: z.boolean().default(false)
});

// Type exports
export type TemplateExportFormat = z.infer<typeof TemplateExportFormatSchema>;
export type TemplateExportOptions = z.infer<typeof TemplateExportOptionsSchema>;
export type TemplateImportOptions = z.infer<typeof TemplateImportOptionsSchema>;
export type BulkExportOptions = z.infer<typeof BulkExportOptionsSchema>;
export type MigrationOptions = z.infer<typeof MigrationOptionsSchema>;

// ============================================================================
// RESULT INTERFACES
// ============================================================================

export interface TemplateExportResult {
    success: boolean;
    exportId?: string;
    data?: Buffer | string;
    metadata?: {
        format: TemplateExportFormat;
        size: number;
        checksum: string;
        exportedAt: Date;
        templateCount: number;
    };
    errors?: string[];
}

export interface TemplateImportResult {
    success: boolean;
    importId?: string;
    importedTemplates?: Array<{
        originalId?: string;
        newId: string;
        name: string;
        status: 'imported' | 'skipped' | 'failed';
        errors?: string[];
    }>;
    summary?: {
        total: number;
        imported: number;
        skipped: number;
        failed: number;
    };
    errors?: string[];
}

export interface MigrationResult {
    success: boolean;
    migrationId?: string;
    migratedTemplates?: Array<{
        sourceId: string;
        targetId?: string;
        name: string;
        status: 'migrated' | 'failed' | 'skipped';
        fieldsMigrated: number;
        recipientsMigrated: number;
        errors?: string[];
    }>;
    summary?: {
        total: number;
        migrated: number;
        failed: number;
        skipped: number;
    };
    errors?: string[];
}

export interface BackupResult {
    success: boolean;
    backupId?: string;
    backupPath?: string;
    metadata?: {
        createdAt: Date;
        templateCount: number;
        size: number;
        checksum: string;
        retention: Date;
    };
    errors?: string[];
}

// ============================================================================
// TEMPLATE IMPORT/EXPORT SERVICE
// ============================================================================

export class TemplateImportExportService {
    constructor(private db: PrismaClient) { }

    /**
     * Export a single template in the specified format
     */
    async exportTemplate(
        templateId: string,
        options: TemplateExportOptions,
        userId: string,
        organizationId: string
    ): Promise<TemplateExportResult> {
        try {
            logger.info({ templateId, format: options.format, userId }, 'Starting template export');

            // Get template with all related data
            const template = await this.getTemplateForExport(
                templateId,
                options,
                userId,
                organizationId
            );

            if (!template) {
                return {
                    success: false,
                    errors: ['Template not found or access denied']
                };
            }

            // Generate export data based on format
            let exportData: Buffer | string;
            let metadata: any;

            switch (options.format) {
                case 'JSON':
                    ({ data: exportData, metadata } = await this.exportToJSON(template, options));
                    break;
                case 'XML':
                    ({ data: exportData, metadata } = await this.exportToXML(template, options));
                    break;
                case 'DOCUSIGN_TEMPLATE':
                    ({ data: exportData, metadata } = await this.exportToDocuSign(template, options));
                    break;
                case 'ADOBE_SIGN_TEMPLATE':
                    ({ data: exportData, metadata } = await this.exportToAdobeSign(template, options));
                    break;
                case 'PANDADOC_TEMPLATE':
                    ({ data: exportData, metadata } = await this.exportToPandaDoc(template, options));
                    break;
                case 'HELLOSIGN_TEMPLATE':
                    ({ data: exportData, metadata } = await this.exportToHelloSign(template, options));
                    break;
                case 'SIGNREQUEST_TEMPLATE':
                    ({ data: exportData, metadata } = await this.exportToSignRequest(template, options));
                    break;
                case 'BACKUP_ARCHIVE':
                    ({ data: exportData, metadata } = await this.exportToBackupArchive(template, options));
                    break;
                default:
                    return {
                        success: false,
                        errors: [`Unsupported export format: ${options.format}`]
                    };
            }

            // Apply compression if requested
            if (options.compression && options.compression !== 'none') {
                exportData = await this.compressData(exportData, options.compression);
            }

            // Apply encryption if requested
            if (options.encryption?.enabled && options.encryption.password) {
                exportData = await this.encryptData(exportData, {
                    password: options.encryption.password,
                    algorithm: options.encryption.algorithm
                });
            }

            // Generate export ID and store metadata
            const exportId = this.generateExportId();
            const checksum = this.calculateChecksum(exportData);

            await this.storeExportMetadata(exportId, {
                templateId,
                format: options.format,
                size: Buffer.isBuffer(exportData) ? exportData.length : Buffer.byteLength(exportData),
                checksum,
                exportedAt: new Date(),
                exportedBy: userId,
                organizationId,
                options
            });

            logger.info({ templateId, exportId, format: options.format }, 'Template export completed');

            return {
                success: true,
                exportId,
                data: exportData,
                metadata: {
                    format: options.format,
                    size: Buffer.isBuffer(exportData) ? exportData.length : Buffer.byteLength(exportData),
                    checksum,
                    exportedAt: new Date(),
                    templateCount: 1
                }
            };

        } catch (error) {
            logger.error({ error, templateId, userId }, 'Template export failed');
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Export failed']
            };
        }
    }

    /**
     * Export multiple templates in bulk
     */
    async bulkExportTemplates(
        options: BulkExportOptions,
        userId: string,
        organizationId: string
    ): Promise<TemplateExportResult> {
        try {
            logger.info({ options, userId }, 'Starting bulk template export');

            // Get templates based on criteria
            const templates = await this.getTemplatesForBulkExport(options, userId, organizationId);

            if (templates.length === 0) {
                return {
                    success: false,
                    errors: ['No templates found matching the criteria']
                };
            }

            // Export each template
            const exportedTemplates = [];
            for (const template of templates) {
                const templateData = await this.getTemplateForExport(
                    template.id,
                    options.exportOptions,
                    userId,
                    organizationId
                );
                if (templateData) {
                    exportedTemplates.push(templateData);
                }
            }

            // Create bulk export package
            const { data: exportData, metadata } = await this.createBulkExportPackage(
                exportedTemplates,
                options.exportOptions
            );

            // Apply compression
            let finalData = exportData;
            if (options.exportOptions.compression && options.exportOptions.compression !== 'none') {
                finalData = await this.compressData(exportData, options.exportOptions.compression);
            }

            // Apply encryption
            if (options.exportOptions.encryption?.enabled && options.exportOptions.encryption.password) {
                finalData = await this.encryptData(finalData, {
                    password: options.exportOptions.encryption.password,
                    algorithm: options.exportOptions.encryption.algorithm
                });
            }

            const exportId = this.generateExportId();
            const checksum = this.calculateChecksum(finalData);

            await this.storeExportMetadata(exportId, {
                templateIds: templates.map(t => t.id),
                format: options.exportOptions.format,
                size: Buffer.isBuffer(finalData) ? finalData.length : Buffer.byteLength(finalData),
                checksum,
                exportedAt: new Date(),
                exportedBy: userId,
                organizationId,
                options: options.exportOptions,
                templateCount: exportedTemplates.length
            });

            logger.info({ exportId, templateCount: exportedTemplates.length }, 'Bulk template export completed');

            return {
                success: true,
                exportId,
                data: finalData,
                metadata: {
                    format: options.exportOptions.format,
                    size: Buffer.isBuffer(finalData) ? finalData.length : Buffer.byteLength(finalData),
                    checksum,
                    exportedAt: new Date(),
                    templateCount: exportedTemplates.length
                }
            };

        } catch (error) {
            logger.error({ error, options, userId }, 'Bulk template export failed');
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Bulk export failed']
            };
        }
    }

    /**
     * Import templates from external data
     */
    async importTemplates(
        importData: Buffer | string,
        options: TemplateImportOptions,
        userId: string,
        organizationId: string
    ): Promise<TemplateImportResult> {
        try {
            logger.info({ format: options.sourceFormat, userId }, 'Starting template import');

            // Decrypt data if needed
            let processedData = importData;
            if (typeof importData === 'string' && importData.startsWith('encrypted:')) {
                // Handle encrypted data (would need password from user)
                throw new Error('Encrypted import data requires decryption password');
            }

            // Decompress data if needed
            if (Buffer.isBuffer(processedData) && this.isCompressed(processedData)) {
                processedData = await this.decompressData(processedData);
            }

            // Parse templates based on source format
            let parsedTemplates: any[];
            switch (options.sourceFormat) {
                case 'JSON':
                    parsedTemplates = await this.parseJSONImport(processedData);
                    break;
                case 'XML':
                    parsedTemplates = await this.parseXMLImport(processedData);
                    break;
                case 'DOCUSIGN_TEMPLATE':
                    parsedTemplates = await this.parseDocuSignImport(processedData);
                    break;
                case 'ADOBE_SIGN_TEMPLATE':
                    parsedTemplates = await this.parseAdobeSignImport(processedData);
                    break;
                case 'PANDADOC_TEMPLATE':
                    parsedTemplates = await this.parsePandaDocImport(processedData);
                    break;
                case 'HELLOSIGN_TEMPLATE':
                    parsedTemplates = await this.parseHelloSignImport(processedData);
                    break;
                case 'SIGNREQUEST_TEMPLATE':
                    parsedTemplates = await this.parseSignRequestImport(processedData);
                    break;
                case 'BACKUP_ARCHIVE':
                    parsedTemplates = await this.parseBackupArchiveImport(processedData);
                    break;
                default:
                    return {
                        success: false,
                        errors: [`Unsupported import format: ${options.sourceFormat}`]
                    };
            }

            // Import each template
            const importResults = [];
            let imported = 0, skipped = 0, failed = 0;

            for (const templateData of parsedTemplates) {
                try {
                    const result = await this.importSingleTemplate(
                        templateData,
                        options,
                        userId,
                        organizationId
                    );

                    importResults.push(result);

                    switch (result.status) {
                        case 'imported':
                            imported++;
                            break;
                        case 'skipped':
                            skipped++;
                            break;
                        case 'failed':
                            failed++;
                            break;
                    }
                } catch (error) {
                    failed++;
                    importResults.push({
                        originalId: templateData.id,
                        newId: '',
                        name: templateData.name || 'Unknown',
                        status: 'failed' as const,
                        errors: [error instanceof Error ? error.message : 'Import failed']
                    });
                }
            }

            const importId = this.generateImportId();
            await this.storeImportMetadata(importId, {
                sourceFormat: options.sourceFormat,
                importedAt: new Date(),
                importedBy: userId,
                organizationId,
                summary: { total: parsedTemplates.length, imported, skipped, failed },
                options
            });

            logger.info({ importId, imported, skipped, failed }, 'Template import completed');

            return {
                success: true,
                importId,
                importedTemplates: importResults,
                summary: {
                    total: parsedTemplates.length,
                    imported,
                    skipped,
                    failed
                }
            };

        } catch (error) {
            logger.error({ error, userId }, 'Template import failed');
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Import failed']
            };
        }
    }

    /**
     * Migrate templates from external systems
     */
    async migrateFromExternalSystem(
        migrationData: any,
        options: MigrationOptions,
        userId: string
    ): Promise<MigrationResult> {
        try {
            logger.info({ sourceSystem: options.sourceSystem, userId }, 'Starting template migration');

            // Parse migration data based on source system
            let parsedTemplates: any[];
            switch (options.sourceSystem) {
                case 'DOCUSIGN':
                    parsedTemplates = await this.parseDocuSignMigration(migrationData);
                    break;
                case 'ADOBE_SIGN':
                    parsedTemplates = await this.parseAdobeSignMigration(migrationData);
                    break;
                case 'PANDADOC':
                    parsedTemplates = await this.parsePandaDocMigration(migrationData);
                    break;
                case 'HELLOSIGN':
                    parsedTemplates = await this.parseHelloSignMigration(migrationData);
                    break;
                case 'SIGNREQUEST':
                    parsedTemplates = await this.parseSignRequestMigration(migrationData);
                    break;
                case 'OTHER':
                    parsedTemplates = await this.parseGenericMigration(migrationData);
                    break;
                default:
                    return {
                        success: false,
                        errors: [`Unsupported source system: ${options.sourceSystem}`]
                    };
            }

            if (options.dryRun) {
                // Return preview of what would be migrated
                const preview = parsedTemplates.map(template => ({
                    sourceId: template.id,
                    name: template.name,
                    status: 'migrated' as const,
                    fieldsMigrated: template.fields?.length || 0,
                    recipientsMigrated: template.recipients?.length || 0
                }));

                return {
                    success: true,
                    migrationId: 'dry-run',
                    migratedTemplates: preview,
                    summary: {
                        total: parsedTemplates.length,
                        migrated: parsedTemplates.length,
                        failed: 0,
                        skipped: 0
                    }
                };
            }

            // Perform actual migration
            const migrationResults = [];
            let migrated = 0, failed = 0, skipped = 0;

            for (const templateData of parsedTemplates) {
                try {
                    const result = await this.migrateSingleTemplate(
                        templateData,
                        options,
                        userId
                    );

                    migrationResults.push(result);

                    switch (result.status) {
                        case 'migrated':
                            migrated++;
                            break;
                        case 'skipped':
                            skipped++;
                            break;
                        case 'failed':
                            failed++;
                            break;
                    }
                } catch (error) {
                    failed++;
                    migrationResults.push({
                        sourceId: templateData.id,
                        name: templateData.name || 'Unknown',
                        status: 'failed' as const,
                        fieldsMigrated: 0,
                        recipientsMigrated: 0,
                        errors: [error instanceof Error ? error.message : 'Migration failed']
                    });
                }
            }

            const migrationId = this.generateMigrationId();
            await this.storeMigrationMetadata(migrationId, {
                sourceSystem: options.sourceSystem,
                migratedAt: new Date(),
                migratedBy: userId,
                targetOrganizationId: options.targetOrganizationId,
                summary: { total: parsedTemplates.length, migrated, failed, skipped },
                options
            });

            logger.info({ migrationId, migrated, failed, skipped }, 'Template migration completed');

            return {
                success: true,
                migrationId,
                migratedTemplates: migrationResults,
                summary: {
                    total: parsedTemplates.length,
                    migrated,
                    failed,
                    skipped
                }
            };

        } catch (error) {
            logger.error({ error, sourceSystem: options.sourceSystem, userId }, 'Template migration failed');
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Migration failed']
            };
        }
    }

    /**
     * Create a backup of templates
     */
    async createBackup(
        organizationId: string,
        options: {
            templateIds?: string[];
            includeAnalytics?: boolean;
            includeAuditTrail?: boolean;
            compression?: 'none' | 'gzip' | 'zip';
            encryption?: {
                enabled: boolean;
                password?: string;
            };
        },
        userId: string
    ): Promise<BackupResult> {
        try {
            logger.info({ organizationId, userId }, 'Starting template backup');

            // Get templates to backup
            const templates = await this.getTemplatesForBackup(organizationId, options.templateIds);

            if (templates.length === 0) {
                return {
                    success: false,
                    errors: ['No templates found for backup']
                };
            }

            // Create backup data
            const backupData = await this.createBackupData(templates, options);

            // Apply compression
            let finalData = Buffer.from(JSON.stringify(backupData));
            if (options.compression && options.compression !== 'none') {
                finalData = await this.compressData(finalData, options.compression);
            }

            // Apply encryption
            if (options.encryption?.enabled && options.encryption.password) {
                finalData = await this.encryptData(finalData, {
                    password: options.encryption.password,
                    algorithm: 'AES-256-GCM'
                });
            }

            const backupId = this.generateBackupId();
            const checksum = this.calculateChecksum(finalData);
            const backupPath = await this.storeBackup(backupId, finalData);

            // Store backup metadata
            await this.storeBackupMetadata(backupId, {
                organizationId,
                createdAt: new Date(),
                createdBy: userId,
                templateCount: templates.length,
                size: finalData.length,
                checksum,
                retention: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year retention
                options
            });

            logger.info({ backupId, templateCount: templates.length }, 'Template backup completed');

            return {
                success: true,
                backupId,
                backupPath,
                metadata: {
                    createdAt: new Date(),
                    templateCount: templates.length,
                    size: finalData.length,
                    checksum,
                    retention: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                }
            };

        } catch (error) {
            logger.error({ error, organizationId, userId }, 'Template backup failed');
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Backup failed']
            };
        }
    }

    /**
     * Restore templates from backup
     */
    async restoreFromBackup(
        backupId: string,
        options: {
            targetOrganizationId?: string;
            conflictResolution?: 'skip' | 'overwrite' | 'rename';
            templateIds?: string[];
        },
        userId: string
    ): Promise<TemplateImportResult> {
        try {
            logger.info({ backupId, userId }, 'Starting template restore from backup');

            // Get backup data
            const backupData = await this.getBackupData(backupId);
            if (!backupData) {
                return {
                    success: false,
                    errors: ['Backup not found']
                };
            }

            // Parse backup and filter templates if specified
            let templatesToRestore = backupData.templates;
            if (options.templateIds) {
                templatesToRestore = templatesToRestore.filter((t: any) =>
                    options.templateIds!.includes(t.id)
                );
            }

            // Restore templates
            const restoreResults = [];
            let imported = 0, skipped = 0, failed = 0;

            for (const templateData of templatesToRestore) {
                try {
                    const result = await this.restoreSingleTemplate(
                        templateData,
                        options,
                        userId
                    );

                    restoreResults.push(result);

                    switch (result.status) {
                        case 'imported':
                            imported++;
                            break;
                        case 'skipped':
                            skipped++;
                            break;
                        case 'failed':
                            failed++;
                            break;
                    }
                } catch (error) {
                    failed++;
                    restoreResults.push({
                        originalId: templateData.id,
                        newId: '',
                        name: templateData.name || 'Unknown',
                        status: 'failed' as const,
                        errors: [error instanceof Error ? error.message : 'Restore failed']
                    });
                }
            }

            logger.info({ backupId, imported, skipped, failed }, 'Template restore completed');

            return {
                success: true,
                importId: `restore-${backupId}`,
                importedTemplates: restoreResults,
                summary: {
                    total: templatesToRestore.length,
                    imported,
                    skipped,
                    failed
                }
            };

        } catch (error) {
            logger.error({ error, backupId, userId }, 'Template restore failed');
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Restore failed']
            };
        }
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private async getTemplateForExport(
        templateId: string,
        options: TemplateExportOptions,
        userId: string,
        organizationId: string
    ): Promise<any | null> {
        const includeRelations: any = {
            creator: {
                select: { id: true, name: true, email: true }
            },
            templateFields: true,
            templateRecipients: true,
            organization: {
                select: { id: true, name: true }
            }
        };

        if (options.includeAnalytics) {
            includeRelations.analytics = true;
        }

        if (options.includeCollaborationData) {
            includeRelations.comments = true;
            includeRelations.collaborators = true;
            includeRelations.reviews = true;
        }

        if (options.includeVersionHistory) {
            includeRelations.versions = true;
        }

        if (options.includeDocument) {
            includeRelations.document = true;
        }

        return await this.db.template.findFirst({
            where: {
                id: templateId,
                OR: [
                    { organizationId },
                    { isPublic: true }
                ]
            },
            include: includeRelations
        });
    }

    private async exportToJSON(template: any, options: TemplateExportOptions): Promise<{ data: string; metadata: any }> {
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            format: 'JSON',
            template: {
                id: template.id,
                name: template.name,
                description: template.description,
                category: template.category,
                tags: template.tags,
                isPublic: template.isPublic,
                settings: template.settings,
                workflow: template.workflow,
                fields: template.templateFields,
                recipients: template.templateRecipients,
                creator: template.creator,
                organization: template.organization,
                ...(options.includeDocument && { document: template.document }),
                ...(options.includeAnalytics && { analytics: template.analytics }),
                ...(options.includeCollaborationData && {
                    comments: template.comments,
                    collaborators: template.collaborators,
                    reviews: template.reviews
                }),
                ...(options.includeVersionHistory && { versions: template.versions })
            }
        };

        return {
            data: JSON.stringify(exportData, null, 2),
            metadata: {
                fieldCount: template.templateFields?.length || 0,
                recipientCount: template.templateRecipients?.length || 0
            }
        };
    }

    private async exportToXML(template: any, options: TemplateExportOptions): Promise<{ data: string; metadata: any }> {
        // Convert template to XML format
        const xmlData = this.convertToXML(template, options);
        return {
            data: xmlData,
            metadata: {
                fieldCount: template.templateFields?.length || 0,
                recipientCount: template.templateRecipients?.length || 0
            }
        };
    }

    private async exportToDocuSign(template: any, options: TemplateExportOptions): Promise<{ data: string; metadata: any }> {
        // Convert to DocuSign template format
        const docuSignTemplate = {
            templateId: template.id,
            name: template.name,
            description: template.description,
            documents: options.includeDocument ? [template.document] : [],
            recipients: {
                signers: template.templateRecipients?.filter((r: any) => r.role === 'signer') || [],
                carbonCopies: template.templateRecipients?.filter((r: any) => r.role === 'cc') || []
            },
            tabs: this.convertFieldsToDocuSignTabs(template.templateFields || []),
            workflow: template.workflow
        };

        return {
            data: JSON.stringify(docuSignTemplate, null, 2),
            metadata: {
                fieldCount: template.templateFields?.length || 0,
                recipientCount: template.templateRecipients?.length || 0
            }
        };
    }

    private async exportToAdobeSign(template: any, options: TemplateExportOptions): Promise<{ data: string; metadata: any }> {
        // Convert to Adobe Sign template format
        const adobeSignTemplate = {
            libraryDocumentId: template.id,
            name: template.name,
            templateTypes: ['DOCUMENT'],
            sharingMode: template.isPublic ? 'GLOBAL' : 'ACCOUNT',
            formFields: this.convertFieldsToAdobeSignFields(template.templateFields || []),
            participantSetsInfo: this.convertRecipientsToAdobeSignParticipants(template.templateRecipients || [])
        };

        return {
            data: JSON.stringify(adobeSignTemplate, null, 2),
            metadata: {
                fieldCount: template.templateFields?.length || 0,
                recipientCount: template.templateRecipients?.length || 0
            }
        };
    }

    private async exportToPandaDoc(template: any, options: TemplateExportOptions): Promise<{ data: string; metadata: any }> {
        // Convert to PandaDoc template format
        const pandaDocTemplate = {
            id: template.id,
            name: template.name,
            fields: this.convertFieldsToPandaDocFields(template.templateFields || []),
            recipients: this.convertRecipientsToPandaDocRecipients(template.templateRecipients || [])
        };

        return {
            data: JSON.stringify(pandaDocTemplate, null, 2),
            metadata: {
                fieldCount: template.templateFields?.length || 0,
                recipientCount: template.templateRecipients?.length || 0
            }
        };
    }

    private async exportToHelloSign(template: any, options: TemplateExportOptions): Promise<{ data: string; metadata: any }> {
        // Convert to HelloSign template format
        const helloSignTemplate = {
            template_id: template.id,
            title: template.name,
            message: template.description,
            signer_roles: this.convertRecipientsToHelloSignRoles(template.templateRecipients || []),
            form_fields: this.convertFieldsToHelloSignFields(template.templateFields || [])
        };

        return {
            data: JSON.stringify(helloSignTemplate, null, 2),
            metadata: {
                fieldCount: template.templateFields?.length || 0,
                recipientCount: template.templateRecipients?.length || 0
            }
        };
    }

    private async exportToSignRequest(template: any, options: TemplateExportOptions): Promise<{ data: string; metadata: any }> {
        // Convert to SignRequest template format
        const signRequestTemplate = {
            uuid: template.id,
            name: template.name,
            signers: this.convertRecipientsToSignRequestSigners(template.templateRecipients || []),
            prefill_tags: this.convertFieldsToSignRequestTags(template.templateFields || [])
        };

        return {
            data: JSON.stringify(signRequestTemplate, null, 2),
            metadata: {
                fieldCount: template.templateFields?.length || 0,
                recipientCount: template.templateRecipients?.length || 0
            }
        };
    }

    private async exportToBackupArchive(template: any, options: TemplateExportOptions): Promise<{ data: Buffer; metadata: any }> {
        // Create comprehensive backup archive
        const backupData = {
            version: '1.0',
            type: 'TEMPLATE_BACKUP',
            createdAt: new Date().toISOString(),
            template,
            metadata: {
                exportOptions: options,
                systemVersion: process.env.npm_package_version || '1.0.0'
            }
        };

        return {
            data: Buffer.from(JSON.stringify(backupData, null, 2)),
            metadata: {
                fieldCount: template.templateFields?.length || 0,
                recipientCount: template.templateRecipients?.length || 0
            }
        };
    }

    // Field conversion helpers
    private convertFieldsToDocuSignTabs(fields: any[]): any {
        const tabs: any = {};

        fields.forEach(field => {
            const tabType = this.mapFieldTypeToDocuSignTab(field.type);
            if (!tabs[tabType]) tabs[tabType] = [];

            tabs[tabType].push({
                tabLabel: field.name,
                xPosition: field.x.toString(),
                yPosition: field.y.toString(),
                width: field.width.toString(),
                height: field.height.toString(),
                pageNumber: field.page.toString(),
                recipientId: field.recipientRole,
                required: field.isRequired ? 'true' : 'false'
            });
        });

        return tabs;
    }

    private convertFieldsToAdobeSignFields(fields: any[]): any[] {
        return fields.map(field => ({
            fieldType: this.mapFieldTypeToAdobeSign(field.type),
            name: field.name,
            locations: [{
                left: field.x,
                top: field.y,
                width: field.width,
                height: field.height,
                pageIndex: field.page - 1
            }],
            required: field.isRequired,
            recipientIndex: 0 // Would need proper mapping
        }));
    }

    private convertFieldsToPandaDocFields(fields: any[]): any[] {
        return fields.map(field => ({
            name: field.name,
            type: this.mapFieldTypeToPandaDoc(field.type),
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            page: field.page,
            required: field.isRequired,
            role: field.recipientRole
        }));
    }

    private convertFieldsToHelloSignFields(fields: any[]): any[] {
        return fields.map(field => ({
            name: field.name,
            type: this.mapFieldTypeToHelloSign(field.type),
            x: field.x,
            y: field.y,
            width: field.width,
            height: field.height,
            page: field.page,
            required: field.isRequired,
            signer: field.recipientRole
        }));
    }

    private convertFieldsToSignRequestTags(fields: any[]): any[] {
        return fields.map(field => ({
            external_id: field.name,
            type: this.mapFieldTypeToSignRequest(field.type),
            location: {
                x: field.x,
                y: field.y,
                width: field.width,
                height: field.height,
                page_index: field.page - 1
            },
            required: field.isRequired
        }));
    }

    // Recipient conversion helpers
    private convertRecipientsToAdobeSignParticipants(recipients: any[]): any[] {
        return recipients.map((recipient, index) => ({
            memberInfos: [{
                email: recipient.email,
                name: recipient.name
            }],
            order: recipient.order,
            role: this.mapRecipientRoleToAdobeSign(recipient.role)
        }));
    }

    private convertRecipientsToPandaDocRecipients(recipients: any[]): any[] {
        return recipients.map(recipient => ({
            email: recipient.email,
            first_name: recipient.name?.split(' ')[0] || '',
            last_name: recipient.name?.split(' ').slice(1).join(' ') || '',
            role: recipient.role,
            signing_order: recipient.order
        }));
    }

    private convertRecipientsToHelloSignRoles(recipients: any[]): any[] {
        return recipients.map(recipient => ({
            name: recipient.role,
            order: recipient.order
        }));
    }

    private convertRecipientsToSignRequestSigners(recipients: any[]): any[] {
        return recipients.map(recipient => ({
            email: recipient.email,
            display_name: recipient.name,
            order: recipient.order
        }));
    }

    // Field type mapping helpers
    private mapFieldTypeToDocuSignTab(fieldType: string): string {
        const mapping: Record<string, string> = {
            'SIGNATURE': 'signHereTabs',
            'INITIAL': 'initialHereTabs',
            'TEXT': 'textTabs',
            'DATE': 'dateTabs',
            'CHECKBOX': 'checkboxTabs',
            'RADIO': 'radioGroupTabs',
            'DROPDOWN': 'listTabs'
        };
        return mapping[fieldType] || 'textTabs';
    }

    private mapFieldTypeToAdobeSign(fieldType: string): string {
        const mapping: Record<string, string> = {
            'SIGNATURE': 'SIGNATURE',
            'INITIAL': 'INITIAL',
            'TEXT': 'TEXT',
            'DATE': 'DATE',
            'CHECKBOX': 'CHECKBOX',
            'RADIO': 'RADIO',
            'DROPDOWN': 'DROP_DOWN'
        };
        return mapping[fieldType] || 'TEXT';
    }

    private mapFieldTypeToPandaDoc(fieldType: string): string {
        const mapping: Record<string, string> = {
            'SIGNATURE': 'signature',
            'INITIAL': 'initial',
            'TEXT': 'text',
            'DATE': 'date',
            'CHECKBOX': 'checkbox',
            'RADIO': 'radio',
            'DROPDOWN': 'dropdown'
        };
        return mapping[fieldType] || 'text';
    }

    private mapFieldTypeToHelloSign(fieldType: string): string {
        const mapping: Record<string, string> = {
            'SIGNATURE': 'signature',
            'INITIAL': 'initial',
            'TEXT': 'text',
            'DATE': 'date_signed',
            'CHECKBOX': 'checkbox',
            'RADIO': 'radio',
            'DROPDOWN': 'dropdown'
        };
        return mapping[fieldType] || 'text';
    }

    private mapFieldTypeToSignRequest(fieldType: string): string {
        const mapping: Record<string, string> = {
            'SIGNATURE': 's',
            'INITIAL': 'i',
            'TEXT': 't',
            'DATE': 'd',
            'CHECKBOX': 'c'
        };
        return mapping[fieldType] || 't';
    }

    private mapRecipientRoleToAdobeSign(role: string): string {
        const mapping: Record<string, string> = {
            'signer': 'SIGNER',
            'cc': 'APPROVER',
            'viewer': 'DELEGATE_TO_SIGNER'
        };
        return mapping[role] || 'SIGNER';
    }

    // Utility methods
    private convertToXML(template: any, options: TemplateExportOptions): string {
        // Simple XML conversion - in production, use a proper XML library
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<template>\n';
        xml += `  <id>${template.id}</id>\n`;
        xml += `  <name><![CDATA[${template.name}]]></name>\n`;
        xml += `  <description><![CDATA[${template.description || ''}]]></description>\n`;

        if (template.templateFields?.length > 0) {
            xml += '  <fields>\n';
            template.templateFields.forEach((field: any) => {
                xml += '    <field>\n';
                xml += `      <name><![CDATA[${field.name}]]></name>\n`;
                xml += `      <type>${field.type}</type>\n`;
                xml += `      <x>${field.x}</x>\n`;
                xml += `      <y>${field.y}</y>\n`;
                xml += `      <width>${field.width}</width>\n`;
                xml += `      <height>${field.height}</height>\n`;
                xml += `      <page>${field.page}</page>\n`;
                xml += `      <required>${field.isRequired}</required>\n`;
                xml += `      <recipientRole><![CDATA[${field.recipientRole}]]></recipientRole>\n`;
                xml += '    </field>\n';
            });
            xml += '  </fields>\n';
        }

        if (template.templateRecipients?.length > 0) {
            xml += '  <recipients>\n';
            template.templateRecipients.forEach((recipient: any) => {
                xml += '    <recipient>\n';
                xml += `      <role><![CDATA[${recipient.role}]]></role>\n`;
                xml += `      <name><![CDATA[${recipient.name}]]></name>\n`;
                xml += `      <email><![CDATA[${recipient.email}]]></email>\n`;
                xml += `      <order>${recipient.order}</order>\n`;
                xml += '    </recipient>\n';
            });
            xml += '  </recipients>\n';
        }

        xml += '</template>';
        return xml;
    }

    private async compressData(data: Buffer | string, compression: 'gzip' | 'zip'): Promise<Buffer> {
        const zlib = await import('zlib');
        const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        switch (compression) {
            case 'gzip':
                return zlib.gzipSync(inputBuffer);
            case 'zip':
                // For ZIP, we'd need a proper ZIP library like 'node-stream-zip'
                // For now, fall back to gzip
                return zlib.gzipSync(inputBuffer);
            default:
                return inputBuffer;
        }
    }

    private async decompressData(data: Buffer): Promise<Buffer> {
        const zlib = await import('zlib');

        // Try to detect compression type and decompress
        try {
            return zlib.gunzipSync(data);
        } catch {
            // If decompression fails, return original data
            return data;
        }
    }

    private isCompressed(data: Buffer): boolean {
        // Check for gzip magic number
        return data.length >= 2 && data[0] === 0x1f && data[1] === 0x8b;
    }

    private async encryptData(data: Buffer | string, encryption: { password: string; algorithm: string }): Promise<Buffer> {
        const crypto = await import('crypto');
        const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        const key = crypto.scryptSync(encryption.password, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher('aes-256-gcm', key);

        const encrypted = Buffer.concat([cipher.update(inputBuffer), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return Buffer.concat([iv, authTag, encrypted]);
    }

    private calculateChecksum(data: Buffer | string): string {
        const inputBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        return createHash('sha256').update(inputBuffer).digest('hex');
    }

    private generateExportId(): string {
        return `export_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    private generateImportId(): string {
        return `import_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    private generateMigrationId(): string {
        return `migration_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    private generateBackupId(): string {
        return `backup_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    // Placeholder methods for database operations
    private async storeExportMetadata(exportId: string, metadata: any): Promise<void> {
        // Store export metadata in database
        // TODO: Uncomment when database models are available
        /*
        await this.db.templateExport.create({
            data: {
                id: exportId,
                ...metadata,
                metadata: JSON.stringify(metadata)
            }
        });
        */
    }

    private async storeImportMetadata(importId: string, metadata: any): Promise<void> {
        // Store import metadata in database
        // TODO: Uncomment when database models are available
        /*
        await this.db.templateImport.create({
            data: {
                id: importId,
                ...metadata,
                metadata: JSON.stringify(metadata)
            }
        });
        */
    }

    private async storeMigrationMetadata(migrationId: string, metadata: any): Promise<void> {
        // Store migration metadata in database
        // TODO: Uncomment when database models are available
        /*
        await this.db.templateMigration.create({
            data: {
                id: migrationId,
                ...metadata,
                metadata: JSON.stringify(metadata)
            }
        });
        */
    }

    private async storeBackupMetadata(backupId: string, metadata: any): Promise<void> {
        // Store backup metadata in database
        // TODO: Uncomment when database models are available
        /*
        await this.db.templateBackup.create({
            data: {
                id: backupId,
                ...metadata,
                metadata: JSON.stringify(metadata)
            }
        });
        */
    }

    private async storeBackup(backupId: string, data: Buffer): Promise<string> {
        // Store backup file - in production, this would go to S3 or similar
        const fs = await import('fs/promises');
        const path = await import('path');

        const backupDir = path.join(process.cwd(), 'backups');
        await fs.mkdir(backupDir, { recursive: true });

        const backupPath = path.join(backupDir, `${backupId}.backup`);
        await fs.writeFile(backupPath, data);

        return backupPath;
    }

    // Placeholder parsing methods - these would contain the actual parsing logic
    private async parseJSONImport(data: Buffer | string): Promise<any[]> {
        const jsonData = typeof data === 'string' ? data : data.toString();
        const parsed = JSON.parse(jsonData);
        return Array.isArray(parsed) ? parsed : [parsed];
    }

    private async parseXMLImport(data: Buffer | string): Promise<any[]> {
        // XML parsing logic would go here
        throw new Error('XML import not yet implemented');
    }

    private async parseDocuSignImport(data: Buffer | string): Promise<any[]> {
        // DocuSign parsing logic would go here
        throw new Error('DocuSign import not yet implemented');
    }

    private async parseAdobeSignImport(data: Buffer | string): Promise<any[]> {
        // Adobe Sign parsing logic would go here
        throw new Error('Adobe Sign import not yet implemented');
    }

    private async parsePandaDocImport(data: Buffer | string): Promise<any[]> {
        // PandaDoc parsing logic would go here
        throw new Error('PandaDoc import not yet implemented');
    }

    private async parseHelloSignImport(data: Buffer | string): Promise<any[]> {
        // HelloSign parsing logic would go here
        throw new Error('HelloSign import not yet implemented');
    }

    private async parseSignRequestImport(data: Buffer | string): Promise<any[]> {
        // SignRequest parsing logic would go here
        throw new Error('SignRequest import not yet implemented');
    }

    private async parseBackupArchiveImport(data: Buffer | string): Promise<any[]> {
        const jsonData = typeof data === 'string' ? data : data.toString();
        const parsed = JSON.parse(jsonData);
        return Array.isArray(parsed.templates) ? parsed.templates : [parsed.template];
    }

    // Placeholder migration parsing methods
    private async parseDocuSignMigration(data: any): Promise<any[]> {
        // DocuSign migration parsing logic
        throw new Error('DocuSign migration not yet implemented');
    }

    private async parseAdobeSignMigration(data: any): Promise<any[]> {
        // Adobe Sign migration parsing logic
        throw new Error('Adobe Sign migration not yet implemented');
    }

    private async parsePandaDocMigration(data: any): Promise<any[]> {
        // PandaDoc migration parsing logic
        throw new Error('PandaDoc migration not yet implemented');
    }

    private async parseHelloSignMigration(data: any): Promise<any[]> {
        // HelloSign migration parsing logic
        throw new Error('HelloSign migration not yet implemented');
    }

    private async parseSignRequestMigration(data: any): Promise<any[]> {
        // SignRequest migration parsing logic
        throw new Error('SignRequest migration not yet implemented');
    }

    private async parseGenericMigration(data: any): Promise<any[]> {
        // Generic migration parsing logic
        return Array.isArray(data) ? data : [data];
    }

    // Placeholder helper methods
    private async getTemplatesForBulkExport(options: BulkExportOptions, userId: string, organizationId: string): Promise<any[]> {
        const where: any = {};

        if (options.templateIds) {
            where.id = { in: options.templateIds };
        }

        if (options.organizationId) {
            where.organizationId = options.organizationId;
        } else {
            where.organizationId = organizationId;
        }

        if (options.category) {
            where.category = options.category;
        }

        if (options.tags && options.tags.length > 0) {
            where.tags = { hasSome: options.tags };
        }

        if (options.dateRange) {
            where.createdAt = {
                gte: options.dateRange.from,
                lte: options.dateRange.to
            };
        }

        return await this.db.template.findMany({ where });
    }

    private async createBulkExportPackage(templates: any[], options: TemplateExportOptions): Promise<{ data: Buffer; metadata: any }> {
        const packageData = {
            version: '1.0',
            type: 'BULK_EXPORT',
            exportedAt: new Date().toISOString(),
            format: options.format,
            templates,
            metadata: {
                templateCount: templates.length,
                exportOptions: options
            }
        };

        return {
            data: Buffer.from(JSON.stringify(packageData, null, 2)),
            metadata: {
                templateCount: templates.length
            }
        };
    }

    private async importSingleTemplate(templateData: any, options: TemplateImportOptions, userId: string, organizationId: string): Promise<any> {
        // Check for conflicts
        const existingTemplate = await this.db.template.findFirst({
            where: {
                name: templateData.name,
                organizationId
            }
        });

        if (existingTemplate) {
            switch (options.conflictResolution) {
                case 'skip':
                    return {
                        originalId: templateData.id,
                        newId: existingTemplate.id,
                        name: templateData.name,
                        status: 'skipped'
                    };
                case 'overwrite':
                    // Update existing template
                    break;
                case 'rename':
                    templateData.name = `${templateData.name} (Imported)`;
                    break;
                case 'merge':
                    // Merge logic would go here
                    break;
            }
        }

        // Create template directly using database transaction
        try {
            const result = await this.db.$transaction(async (tx) => {
                // Create the template
                const newTemplate = await tx.template.create({
                    data: {
                        name: templateData.name,
                        description: templateData.description,
                        documentId: templateData.documentId, // Would need document mapping
                        category: templateData.category,
                        tags: templateData.tags || [],
                        isPublic: templateData.isPublic || false,
                        organizationId,
                        createdBy: userId,
                        settings: templateData.settings || {},
                        workflow: templateData.workflow || {},
                    },
                });

                // Create template fields
                if (templateData.fields && templateData.fields.length > 0) {
                    await Promise.all(
                        templateData.fields.map((field: any) =>
                            tx.templateField.create({
                                data: {
                                    templateId: newTemplate.id,
                                    type: field.type,
                                    name: field.name,
                                    page: field.page,
                                    x: field.x,
                                    y: field.y,
                                    width: field.width,
                                    height: field.height,
                                    properties: field.properties || {},
                                    isRequired: field.isRequired,
                                    recipientRole: field.recipientRole,
                                },
                            })
                        )
                    );
                }

                // Create template recipients
                if (templateData.recipients && templateData.recipients.length > 0) {
                    await Promise.all(
                        templateData.recipients.map((recipient: any) =>
                            tx.templateRecipient.create({
                                data: {
                                    templateId: newTemplate.id,
                                    role: recipient.role,
                                    name: recipient.name,
                                    email: recipient.email,
                                    order: recipient.order,
                                    authMethod: recipient.authMethod,
                                    isRequired: recipient.isRequired,
                                },
                            })
                        )
                    );
                }

                return newTemplate;
            });

            return {
                originalId: templateData.id,
                newId: result.id,
                name: templateData.name,
                status: 'imported'
            };
        } catch (error) {
            return {
                originalId: templateData.id,
                newId: '',
                name: templateData.name,
                status: 'failed',
                errors: [error instanceof Error ? error.message : 'Import failed']
            };
        }
    }

    private async migrateSingleTemplate(templateData: any, options: MigrationOptions, userId: string): Promise<any> {
        // Apply field and recipient mappings
        if (options.fieldMapping) {
            templateData.fields = templateData.fields?.map((field: any) => ({
                ...field,
                type: options.fieldMapping![field.type] || field.type
            }));
        }

        if (options.recipientRoleMapping) {
            templateData.recipients = templateData.recipients?.map((recipient: any) => ({
                ...recipient,
                role: options.recipientRoleMapping![recipient.role] || recipient.role
            }));
        }

        // Import the template
        return await this.importSingleTemplate(
            templateData,
            {
                sourceFormat: 'JSON',
                conflictResolution: 'rename',
                validateFields: true,
                preserveIds: false
            },
            userId,
            options.targetOrganizationId
        );
    }

    private async restoreSingleTemplate(templateData: any, options: any, userId: string): Promise<any> {
        const targetOrgId = options.targetOrganizationId || templateData.organizationId;

        return await this.importSingleTemplate(
            templateData,
            {
                sourceFormat: 'BACKUP_ARCHIVE',
                conflictResolution: options.conflictResolution || 'rename',
                validateFields: true,
                preserveIds: false
            },
            userId,
            targetOrgId
        );
    }

    private async getTemplatesForBackup(organizationId: string, templateIds?: string[]): Promise<any[]> {
        const where: any = { organizationId };

        if (templateIds) {
            where.id = { in: templateIds };
        }

        return await this.db.template.findMany({
            where,
            include: {
                templateFields: true,
                templateRecipients: true,
                creator: { select: { id: true, name: true, email: true } },
                organization: { select: { id: true, name: true } }
            }
        });
    }

    private async createBackupData(templates: any[], options: any): Promise<any> {
        return {
            version: '1.0',
            type: 'TEMPLATE_BACKUP',
            createdAt: new Date().toISOString(),
            templates,
            options,
            metadata: {
                templateCount: templates.length,
                systemVersion: process.env.npm_package_version || '1.0.0'
            }
        };
    }

    private async getBackupData(backupId: string): Promise<any | null> {
        // TODO: Uncomment when database models are available
        /*
        const backup = await this.db.templateBackup.findUnique({
            where: { id: backupId }
        });

        if (!backup) return null;
        */

        // In production, this would read from the backup file
        const fs = await import('fs/promises');
        const path = await import('path');

        try {
            const backupPath = path.join(process.cwd(), 'backups', `${backupId}.backup`);
            const backupData = await fs.readFile(backupPath);
            return JSON.parse(backupData.toString());
        } catch {
            return null;
        }
    }
}