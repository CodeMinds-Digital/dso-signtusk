import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@signtusk/database';
import {
    TemplateInstantiationEngine,
    TemplateInstantiationData,
    TemplateVariable,
    FieldMapping,
    RecipientMapping
} from '../template-instantiation-engine';

// Mock Prisma client
const mockDb = {
    template: {
        findFirst: vi.fn(),
    },
    document: {
        create: vi.fn(),
    },
    signingRequest: {
        create: vi.fn(),
    },
    documentField: {
        create: vi.fn(),
        updateMany: vi.fn(),
    },
    recipient: {
        create: vi.fn(),
    },
    $transaction: vi.fn(),
} as unknown as PrismaClient;

describe('TemplateInstantiationEngine', () => {
    let engine: TemplateInstantiationEngine;
    const userId = 'user-123';
    const organizationId = 'org-456';

    beforeEach(() => {
        vi.clearAllMocks();
        engine = new TemplateInstantiationEngine(mockDb);
    });

    describe('validateInstantiationData', () => {
        it('should validate complete instantiation data successfully', async () => {
            const mockTemplate = {
                id: 'template-123',
                name: 'Test Template',
                templateFields: [
                    {
                        id: 'field-1',
                        name: 'Signature Field',
                        type: 'SIGNATURE',
                        isRequired: true,
                        recipientRole: 'signer',
                    },
                ],
                templateRecipients: [
                    {
                        id: 'recipient-1',
                        role: 'signer',
                        isRequired: true,
                    },
                ],
                workflow: {
                    type: 'sequential',
                    steps: [],
                },
            };

            mockDb.template.findFirst = vi.fn().mockResolvedValue(mockTemplate);

            const instantiationData: TemplateInstantiationData = {
                templateId: 'template-123',
                documentName: 'Test Document {{timestamp}}',
                variables: [
                    { name: 'companyName', value: 'Acme Corp', type: 'string' },
                ],
                fieldMappings: [
                    {
                        templateFieldId: 'field-1',
                        recipientEmail: 'signer@example.com',
                        recipientName: 'John Doe',
                    },
                ],
                recipientMappings: [
                    {
                        templateRole: 'signer',
                        email: 'signer@example.com',
                        name: 'John Doe',
                    },
                ],
                metadata: {},
                settings: {},
            };

            const result = await engine.validateInstantiationData(
                instantiationData,
                userId,
                organizationId
            );

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.missingMappings.recipients).toHaveLength(0);
        });

        it('should detect missing required recipient mappings', async () => {
            const mockTemplate = {
                id: 'template-123',
                name: 'Test Template',
                templateFields: [],
                templateRecipients: [
                    {
                        id: 'recipient-1',
                        role: 'signer',
                        isRequired: true,
                    },
                    {
                        id: 'recipient-2',
                        role: 'approver',
                        isRequired: true,
                    },
                ],
                workflow: {},
            };

            mockDb.template.findFirst = vi.fn().mockResolvedValue(mockTemplate);

            const instantiationData: TemplateInstantiationData = {
                templateId: 'template-123',
                documentName: 'Test Document',
                variables: [],
                fieldMappings: [],
                recipientMappings: [
                    {
                        templateRole: 'signer',
                        email: 'signer@example.com',
                        name: 'John Doe',
                    },
                ],
                metadata: {},
                settings: {},
            };

            const result = await engine.validateInstantiationData(
                instantiationData,
                userId,
                organizationId
            );

            expect(result.isValid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0].message).toContain('approver');
            expect(result.missingMappings.recipients).toContain('approver');
        });

        it('should detect duplicate email addresses in recipient mappings', async () => {
            const mockTemplate = {
                id: 'template-123',
                name: 'Test Template',
                templateFields: [],
                templateRecipients: [
                    { id: 'recipient-1', role: 'signer', isRequired: true },
                    { id: 'recipient-2', role: 'approver', isRequired: true },
                ],
                workflow: {},
            };

            mockDb.template.findFirst = vi.fn().mockResolvedValue(mockTemplate);

            const instantiationData: TemplateInstantiationData = {
                templateId: 'template-123',
                documentName: 'Test Document',
                variables: [],
                fieldMappings: [],
                recipientMappings: [
                    {
                        templateRole: 'signer',
                        email: 'same@example.com',
                        name: 'John Doe',
                    },
                    {
                        templateRole: 'approver',
                        email: 'same@example.com',
                        name: 'Jane Smith',
                    },
                ],
                metadata: {},
                settings: {},
            };

            const result = await engine.validateInstantiationData(
                instantiationData,
                userId,
                organizationId
            );

            expect(result.isValid).toBe(false);
            expect(result.errors.some(e => e.message.includes('Duplicate email'))).toBe(true);
        });

        it('should return error when template is not found', async () => {
            mockDb.template.findFirst = vi.fn().mockResolvedValue(null);

            const instantiationData: TemplateInstantiationData = {
                templateId: 'nonexistent-template',
                documentName: 'Test Document',
                variables: [],
                fieldMappings: [],
                recipientMappings: [],
                metadata: {},
                settings: {},
            };

            const result = await engine.validateInstantiationData(
                instantiationData,
                userId,
                organizationId
            );

            expect(result.isValid).toBe(false);
            expect(result.errors[0].message).toContain('Template not found');
        });
    });

    describe('previewTemplateInstantiation', () => {
        it('should generate preview with variable substitution', async () => {
            const mockTemplate = {
                id: 'template-123',
                name: 'Test Template',
                description: 'Template for {{companyName}}',
                templateFields: [
                    {
                        id: 'field-1',
                        name: 'Company Name: {{companyName}}',
                        type: 'TEXT',
                        properties: {
                            placeholder: 'Enter {{companyName}} name',
                        },
                        recipientRole: 'signer',
                    },
                ],
                templateRecipients: [
                    {
                        id: 'recipient-1',
                        role: 'signer',
                        isRequired: true,
                    },
                ],
                workflow: {
                    type: 'sequential',
                    steps: [],
                },
            };

            mockDb.template.findFirst = vi.fn().mockResolvedValue(mockTemplate);

            const instantiationData: TemplateInstantiationData = {
                templateId: 'template-123',
                documentName: 'Contract for {{companyName}}',
                variables: [
                    { name: 'companyName', value: 'Acme Corp', type: 'string' },
                ],
                fieldMappings: [
                    {
                        templateFieldId: 'field-1',
                        properties: {
                            customProperty: 'Value for {{companyName}}',
                        },
                    },
                ],
                recipientMappings: [
                    {
                        templateRole: 'signer',
                        email: 'signer@example.com',
                        name: 'John Doe from {{companyName}}',
                    },
                ],
                metadata: {},
                settings: {},
            };

            const result = await engine.previewTemplateInstantiation(
                instantiationData,
                userId,
                organizationId
            );

            expect(result.success).toBe(true);
            expect(result.preview).toBeDefined();
            expect(result.preview!.documentName).toBe('Contract for Acme Corp');
            expect(result.preview!.fields[0].name).toBe('Company Name: Acme Corp');
            expect(result.preview!.fields[0].processedProperties.placeholder).toBe('Enter Acme Corp name');
            expect(result.preview!.fields[0].processedProperties.customProperty).toBe('Value for Acme Corp');
            expect(result.preview!.recipients[0].name).toBe('John Doe from Acme Corp');
        });

        it('should handle built-in variables', async () => {
            const mockTemplate = {
                id: 'template-123',
                name: 'Test Template',
                templateFields: [
                    {
                        id: 'field-1',
                        name: 'Date: {{date}}',
                        type: 'TEXT',
                        properties: {},
                        recipientRole: 'signer',
                    },
                ],
                templateRecipients: [
                    {
                        id: 'recipient-1',
                        role: 'signer',
                        isRequired: true,
                    },
                ],
                workflow: {},
            };

            mockDb.template.findFirst = vi.fn().mockResolvedValue(mockTemplate);

            const instantiationData: TemplateInstantiationData = {
                templateId: 'template-123',
                documentName: 'Document created on {{date}}',
                variables: [],
                fieldMappings: [],
                recipientMappings: [
                    {
                        templateRole: 'signer',
                        email: 'signer@example.com',
                        name: 'John Doe',
                    },
                ],
                metadata: {},
                settings: {},
            };

            const result = await engine.previewTemplateInstantiation(
                instantiationData,
                userId,
                organizationId
            );

            expect(result.success).toBe(true);
            expect(result.preview!.documentName).toMatch(/Document created on \d+\/\d+\/\d+/);
            expect(result.preview!.fields[0].name).toMatch(/Date: \d+\/\d+\/\d+/);
        });
    });

    describe('instantiateTemplate', () => {
        it('should successfully instantiate template with all components', async () => {
            const mockTemplate = {
                id: 'template-123',
                name: 'Test Template',
                document: {
                    id: 'doc-123',
                    name: 'Template Document',
                    originalName: 'template.pdf',
                    mimeType: 'application/pdf',
                    size: 1024,
                    hash: 'hash123',
                    metadata: {},
                },
                templateFields: [
                    {
                        id: 'field-1',
                        name: 'Signature Field',
                        type: 'SIGNATURE',
                        page: 1,
                        x: 100,
                        y: 200,
                        width: 150,
                        height: 50,
                        properties: {},
                        isRequired: true,
                        recipientRole: 'signer',
                    },
                ],
                templateRecipients: [
                    {
                        id: 'recipient-1',
                        role: 'signer',
                        order: 1,
                        authMethod: 'EMAIL',
                        isRequired: true,
                    },
                ],
                workflow: {
                    type: 'sequential',
                    settings: {},
                },
            };

            const mockDocument = { id: 'new-doc-123' };
            const mockSigningRequest = { id: 'signing-request-123' };
            const mockField = { id: 'new-field-123' };
            const mockRecipient = { id: 'new-recipient-123', role: 'signer' };

            mockDb.template.findFirst = vi.fn().mockResolvedValue(mockTemplate);
            mockDb.$transaction = vi.fn().mockImplementation(async (callback) => {
                const mockTx = {
                    document: { create: vi.fn().mockResolvedValue(mockDocument) },
                    signingRequest: { create: vi.fn().mockResolvedValue(mockSigningRequest) },
                    documentField: {
                        create: vi.fn().mockResolvedValue(mockField),
                        updateMany: vi.fn(),
                    },
                    recipient: { create: vi.fn().mockResolvedValue(mockRecipient) },
                };
                return await callback(mockTx);
            });

            const instantiationData: TemplateInstantiationData = {
                templateId: 'template-123',
                documentName: 'New Contract',
                variables: [],
                fieldMappings: [],
                recipientMappings: [
                    {
                        templateRole: 'signer',
                        email: 'signer@example.com',
                        name: 'John Doe',
                    },
                ],
                metadata: {},
                settings: {
                    autoSend: false,
                    expirationDays: 30,
                },
            };

            const result = await engine.instantiateTemplate(
                instantiationData,
                userId,
                organizationId
            );

            expect(result.success).toBe(true);
            expect(result.documentId).toBe('new-doc-123');
            expect(result.signingRequestId).toBe('signing-request-123');
            expect(mockDb.$transaction).toHaveBeenCalled();
        });

        it('should handle validation errors during instantiation', async () => {
            const mockTemplate = {
                id: 'template-123',
                name: 'Test Template',
                templateFields: [],
                templateRecipients: [
                    {
                        id: 'recipient-1',
                        role: 'signer',
                        isRequired: true,
                    },
                ],
                workflow: {},
            };

            mockDb.template.findFirst = vi.fn().mockResolvedValue(mockTemplate);

            const instantiationData: TemplateInstantiationData = {
                templateId: 'template-123',
                documentName: 'New Contract',
                variables: [],
                fieldMappings: [],
                recipientMappings: [], // Missing required recipient
                metadata: {},
                settings: {},
            };

            const result = await engine.instantiateTemplate(
                instantiationData,
                userId,
                organizationId
            );

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
            expect(result.errors![0]).toContain('signer');
        });

        it('should handle template not found error', async () => {
            mockDb.template.findFirst = vi.fn().mockResolvedValue(null);

            const instantiationData: TemplateInstantiationData = {
                templateId: 'nonexistent-template',
                documentName: 'New Contract',
                variables: [],
                fieldMappings: [],
                recipientMappings: [],
                metadata: {},
                settings: {},
            };

            const result = await engine.instantiateTemplate(
                instantiationData,
                userId,
                organizationId
            );

            expect(result.success).toBe(false);
            expect(result.errors![0]).toContain('Template not found');
        });
    });

    describe('variable substitution', () => {
        it('should substitute simple variables correctly', () => {
            const context = {
                variables: { companyName: 'Acme Corp', amount: '1000' },
                recipients: {},
                metadata: {},
                timestamp: new Date('2023-01-01T12:00:00Z'),
                organizationId,
                userId,
            };

            // Access private method for testing
            const result = (engine as any).substituteVariables(
                'Contract for {{companyName}} with amount ${{amount}}',
                context
            );

            expect(result).toBe('Contract for Acme Corp with amount $1000');
        });

        it('should handle nested object properties', () => {
            const context = {
                variables: {},
                recipients: {
                    signer: {
                        templateRole: 'signer',
                        email: 'john@example.com',
                        name: 'John Doe',
                    },
                },
                metadata: {},
                timestamp: new Date('2023-01-01T12:00:00Z'),
                organizationId,
                userId,
            };

            const result = (engine as any).substituteVariables(
                'Signer: {{recipients.signer.name}} ({{recipients.signer.email}})',
                context
            );

            expect(result).toBe('Signer: John Doe (john@example.com)');
        });

        it('should handle built-in variables', () => {
            const testDate = new Date('2023-01-01T12:00:00Z');
            const context = {
                variables: {},
                recipients: {},
                metadata: {},
                timestamp: testDate,
                organizationId: 'org-123',
                userId: 'user-456',
            };

            const result = (engine as any).substituteVariables(
                'Created on {{date}} at {{time}} by {{userId}} for {{organizationId}}',
                context
            );

            expect(result).toContain('Created on');
            expect(result).toContain('user-456');
            expect(result).toContain('org-123');
        });

        it('should leave unknown variables unchanged', () => {
            const context = {
                variables: { knownVar: 'value' },
                recipients: {},
                metadata: {},
                timestamp: new Date(),
                organizationId,
                userId,
            };

            const result = (engine as any).substituteVariables(
                'Known: {{knownVar}}, Unknown: {{unknownVar}}',
                context
            );

            expect(result).toBe('Known: value, Unknown: {{unknownVar}}');
        });
    });
});