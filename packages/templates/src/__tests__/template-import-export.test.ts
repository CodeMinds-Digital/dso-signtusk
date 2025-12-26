import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TemplateImportExportService } from '../template-import-export-service';

// Mock PrismaClient
const mockPrismaClient = {
    template: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
    },
    templateExport: {
        create: vi.fn(),
    },
    templateImport: {
        create: vi.fn(),
    },
    templateMigration: {
        create: vi.fn(),
    },
    templateBackup: {
        create: vi.fn(),
        findUnique: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrismaClient)),
} as any;

describe('TemplateImportExportService', () => {
    let service: TemplateImportExportService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new TemplateImportExportService(mockPrismaClient);
    });

    describe('exportTemplate', () => {
        it('should export a template in JSON format', async () => {
            const mockTemplate = {
                id: 'template-1',
                name: 'Test Template',
                description: 'Test Description',
                category: 'test',
                tags: ['tag1', 'tag2'],
                isPublic: false,
                settings: {},
                workflow: {},
                templateFields: [
                    {
                        id: 'field-1',
                        name: 'Signature',
                        type: 'SIGNATURE',
                        page: 1,
                        x: 100,
                        y: 200,
                        width: 150,
                        height: 50,
                        isRequired: true,
                        recipientRole: 'signer'
                    }
                ],
                templateRecipients: [
                    {
                        id: 'recipient-1',
                        role: 'signer',
                        name: 'John Doe',
                        email: 'john@example.com',
                        order: 1,
                        authMethod: 'email',
                        isRequired: true
                    }
                ],
                creator: {
                    id: 'user-1',
                    name: 'Creator',
                    email: 'creator@example.com'
                },
                organization: {
                    id: 'org-1',
                    name: 'Test Org'
                }
            };

            mockPrismaClient.template.findFirst.mockResolvedValue(mockTemplate);
            mockPrismaClient.templateExport.create.mockResolvedValue({
                id: 'export-1'
            });

            const result = await service.exportTemplate(
                'template-1',
                {
                    format: 'JSON',
                    includeDocument: false,
                    includeAnalytics: false,
                    includeAuditTrail: false,
                    includeCollaborationData: false,
                    includeVersionHistory: false,
                    compression: 'none'
                },
                'user-1',
                'org-1'
            );

            expect(result.success).toBe(true);
            expect(result.exportId).toBeDefined();
            expect(result.data).toBeDefined();
            expect(result.metadata?.format).toBe('JSON');
            expect(result.metadata?.templateCount).toBe(1);
        });

        it('should return error if template not found', async () => {
            mockPrismaClient.template.findFirst.mockResolvedValue(null);

            const result = await service.exportTemplate(
                'non-existent',
                {
                    format: 'JSON',
                    includeDocument: false,
                    compression: 'none'
                },
                'user-1',
                'org-1'
            );

            expect(result.success).toBe(false);
            expect(result.errors).toContain('Template not found or access denied');
        });
    });

    describe('bulkExportTemplates', () => {
        it('should export multiple templates', async () => {
            const mockTemplates = [
                { id: 'template-1', name: 'Template 1' },
                { id: 'template-2', name: 'Template 2' }
            ];

            mockPrismaClient.template.findMany.mockResolvedValue(mockTemplates);
            mockPrismaClient.template.findFirst
                .mockResolvedValueOnce({
                    ...mockTemplates[0],
                    templateFields: [],
                    templateRecipients: [],
                    creator: { id: 'user-1', name: 'Creator', email: 'creator@example.com' },
                    organization: { id: 'org-1', name: 'Test Org' }
                })
                .mockResolvedValueOnce({
                    ...mockTemplates[1],
                    templateFields: [],
                    templateRecipients: [],
                    creator: { id: 'user-1', name: 'Creator', email: 'creator@example.com' },
                    organization: { id: 'org-1', name: 'Test Org' }
                });
            mockPrismaClient.templateExport.create.mockResolvedValue({
                id: 'export-1'
            });

            const result = await service.bulkExportTemplates(
                {
                    templateIds: ['template-1', 'template-2'],
                    exportOptions: {
                        format: 'JSON',
                        includeDocument: false,
                        compression: 'none'
                    }
                },
                'user-1',
                'org-1'
            );

            expect(result.success).toBe(true);
            expect(result.metadata?.templateCount).toBe(2);
        });

        it('should return error if no templates found', async () => {
            mockPrismaClient.template.findMany.mockResolvedValue([]);

            const result = await service.bulkExportTemplates(
                {
                    templateIds: ['non-existent'],
                    exportOptions: {
                        format: 'JSON',
                        includeDocument: false,
                        compression: 'none'
                    }
                },
                'user-1',
                'org-1'
            );

            expect(result.success).toBe(false);
            expect(result.errors).toContain('No templates found matching the criteria');
        });
    });

    describe('importTemplates', () => {
        it('should import templates from JSON', async () => {
            const importData = JSON.stringify([
                {
                    id: 'old-template-1',
                    name: 'Imported Template',
                    description: 'Imported',
                    documentId: 'doc-1',
                    category: 'test',
                    tags: [],
                    isPublic: false,
                    settings: {},
                    workflow: {},
                    fields: [],
                    recipients: []
                }
            ]);

            mockPrismaClient.template.findFirst.mockResolvedValue(null);
            mockPrismaClient.template.create.mockResolvedValue({
                id: 'new-template-1',
                name: 'Imported Template'
            });
            mockPrismaClient.templateImport.create.mockResolvedValue({
                id: 'import-1'
            });

            const result = await service.importTemplates(
                importData,
                {
                    sourceFormat: 'JSON',
                    conflictResolution: 'rename',
                    validateFields: true,
                    preserveIds: false
                },
                'user-1',
                'org-1'
            );

            expect(result.success).toBe(true);
            expect(result.importId).toBeDefined();
            expect(result.summary?.total).toBe(1);
        });
    });

    describe('createBackup', () => {
        it('should create a backup of templates', async () => {
            const mockTemplates = [
                {
                    id: 'template-1',
                    name: 'Template 1',
                    templateFields: [],
                    templateRecipients: [],
                    creator: { id: 'user-1', name: 'Creator', email: 'creator@example.com' },
                    organization: { id: 'org-1', name: 'Test Org' }
                }
            ];

            mockPrismaClient.template.findMany.mockResolvedValue(mockTemplates);
            mockPrismaClient.templateBackup.create.mockResolvedValue({
                id: 'backup-1'
            });

            const result = await service.createBackup(
                'org-1',
                {
                    templateIds: ['template-1'],
                    includeAnalytics: false,
                    includeAuditTrail: false,
                    compression: 'none',
                    encryption: { enabled: false }
                },
                'user-1'
            );

            expect(result.success).toBe(true);
            expect(result.backupId).toBeDefined();
            expect(result.metadata?.templateCount).toBe(1);
        });

        it('should return error if no templates found for backup', async () => {
            mockPrismaClient.template.findMany.mockResolvedValue([]);

            const result = await service.createBackup(
                'org-1',
                {
                    templateIds: ['non-existent'],
                    compression: 'none',
                    encryption: { enabled: false }
                },
                'user-1'
            );

            expect(result.success).toBe(false);
            expect(result.errors).toContain('No templates found for backup');
        });
    });

    describe('Field Type Mapping', () => {
        it('should correctly map field types to DocuSign format', async () => {
            const mockTemplate = {
                id: 'template-1',
                name: 'Test Template',
                templateFields: [
                    { type: 'SIGNATURE', name: 'sig1', x: 100, y: 100, width: 150, height: 50, page: 1, isRequired: true, recipientRole: 'signer' },
                    { type: 'TEXT', name: 'text1', x: 100, y: 200, width: 150, height: 30, page: 1, isRequired: false, recipientRole: 'signer' },
                    { type: 'DATE', name: 'date1', x: 100, y: 300, width: 100, height: 30, page: 1, isRequired: true, recipientRole: 'signer' }
                ],
                templateRecipients: [],
                creator: { id: 'user-1', name: 'Creator', email: 'creator@example.com' },
                organization: { id: 'org-1', name: 'Test Org' }
            };

            mockPrismaClient.template.findFirst.mockResolvedValue(mockTemplate);
            mockPrismaClient.templateExport.create.mockResolvedValue({ id: 'export-1' });

            const result = await service.exportTemplate(
                'template-1',
                {
                    format: 'DOCUSIGN_TEMPLATE',
                    includeDocument: false,
                    compression: 'none'
                },
                'user-1',
                'org-1'
            );

            expect(result.success).toBe(true);

            const exportedData = JSON.parse(result.data as string);
            expect(exportedData.tabs).toBeDefined();
            expect(exportedData.tabs.signHereTabs).toBeDefined();
            expect(exportedData.tabs.textTabs).toBeDefined();
            expect(exportedData.tabs.dateTabs).toBeDefined();
        });
    });
});
