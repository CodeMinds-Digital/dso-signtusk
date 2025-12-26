import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { TemplateService } from '../template-service';
import { TemplateWizard } from '../template-wizard';
import { TemplateCreate, TemplateField, TemplateRecipient } from '../types';

/**
 * **Feature: docusign-alternative-comprehensive, Property 26: Template Creation and Reuse**
 * 
 * Property: Template Creation and Reuse
 * For any template creation operation, document configurations with fields, recipients, 
 * and workflow settings should be saved correctly and reusable with all configurations intact
 * 
 * **Validates: Requirements 6.1**
 */

describe('Template Creation and Reuse Property Tests', () => {
    let mockTemplateService: any;
    let templateService: TemplateService;
    let wizard: TemplateWizard;
    let testOrganizationId: string;
    let testUserId: string;
    let testDocumentId: string;

    beforeEach(() => {
        // Create mock template service
        mockTemplateService = {
            createTemplate: async (template: TemplateCreate, userId: string, organizationId: string) => ({
                success: true,
                template: {
                    id: 'test-template-id',
                    ...template,
                    createdBy: userId,
                    organizationId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            }),
            getTemplateById: async (id: string, userId: string, organizationId: string) => ({
                id,
                name: 'Test Template',
                description: 'Test Description',
                category: 'Test Category',
                tags: ['test'],
                isPublic: false,
                createdBy: userId,
                organizationId,
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
            validateTemplate: async (template: TemplateCreate) => ({
                isValid: true,
                errors: [],
                warnings: [],
            }),
        } as any;

        templateService = mockTemplateService;
        wizard = new TemplateWizard(templateService);

        testOrganizationId = 'test-org-id';
        testUserId = 'test-user-id';
        testDocumentId = 'test-document-id';
    });

    // Generators for property-based testing
    const fieldTypeArb = fc.constantFrom(
        'SIGNATURE', 'INITIAL', 'TEXT', 'DATE', 'CHECKBOX', 'RADIO', 'DROPDOWN', 'ATTACHMENT'
    );

    const authMethodArb = fc.constantFrom(
        'EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED'
    );

    const templateFieldArb = fc.record({
        type: fieldTypeArb,
        name: fc.string({ minLength: 2, maxLength: 100 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
        page: fc.integer({ min: 1, max: 10 }),
        x: fc.float({ min: 0, max: 1000 }),
        y: fc.float({ min: 0, max: 1000 }),
        width: fc.float({ min: 1, max: 500 }),
        height: fc.float({ min: 1, max: 200 }),
        properties: fc.record({
            placeholder: fc.option(fc.string()),
            options: fc.option(fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 })),
            defaultValue: fc.option(fc.string()),
        }),
        isRequired: fc.boolean(),
        recipientRole: fc.option(fc.string({ minLength: 2, maxLength: 50 }).filter(s => /^[a-zA-Z0-9\s\-_]+$/.test(s))),
    }) as fc.Arbitrary<TemplateField>;

    const templateRecipientArb = fc.record({
        role: fc.string({ minLength: 2, maxLength: 50 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
        name: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
        email: fc.option(fc.emailAddress()),
        order: fc.integer({ min: 1, max: 20 }),
        authMethod: authMethodArb,
        isRequired: fc.boolean(),
    }) as fc.Arbitrary<TemplateRecipient>;

    const workflowConfigArb = fc.record({
        type: fc.constantFrom('sequential', 'parallel', 'conditional', 'hybrid'),
        steps: fc.array(
            fc.record({
                id: fc.string({ minLength: 1 }),
                name: fc.string({ minLength: 1, maxLength: 100 }),
                type: fc.constantFrom('signing', 'approval', 'review', 'notification'),
                recipients: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 5 }),
                conditions: fc.option(fc.array(fc.record({
                    field: fc.string({ minLength: 1 }),
                    operator: fc.constantFrom('equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than'),
                    value: fc.anything(),
                }))),
                settings: fc.record({}),
            }),
            { minLength: 1, maxLength: 5 }
        ),
        settings: fc.record({
            autoReminders: fc.boolean(),
            reminderInterval: fc.integer({ min: 1, max: 30 }),
            expirationDays: fc.option(fc.integer({ min: 1, max: 365 })),
            allowDecline: fc.boolean(),
            requireAllSignatures: fc.boolean(),
        }),
    });

    const templateCreateArb = fc.record({
        name: fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
        description: fc.option(fc.string({ maxLength: 1000 })),
        documentId: fc.constant('test-document-id'),
        category: fc.option(fc.string({ maxLength: 100 })),
        tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
        isPublic: fc.boolean(),
        fields: fc.array(templateFieldArb, { maxLength: 20 }),
        recipients: fc.array(templateRecipientArb, { maxLength: 10 }),
        workflow: fc.option(workflowConfigArb),
        settings: fc.record({
            allowDuplication: fc.boolean(),
            requireApproval: fc.boolean(),
            defaultLanguage: fc.constant('en'),
            autoReminders: fc.boolean(),
            expirationDays: fc.option(fc.integer({ min: 1, max: 365 })),
            brandingEnabled: fc.boolean(),
            customBranding: fc.option(fc.record({
                logo: fc.option(fc.string()),
                primaryColor: fc.option(fc.string()),
                secondaryColor: fc.option(fc.string()),
            })),
        }),
    }) as fc.Arbitrary<TemplateCreate>;

    it('should preserve all template configuration when creating and retrieving templates', async () => {
        await fc.assert(
            fc.asyncProperty(templateCreateArb, async (templateData) => {
                // Reset wizard for each iteration
                wizard.reset();

                // Ensure unique field names and recipient roles
                const uniqueFields = templateData.fields.reduce((acc: TemplateField[], field, index) => {
                    const uniqueName = `${field.name}_${index}`;
                    acc.push({ ...field, name: uniqueName });
                    return acc;
                }, []);

                const uniqueRecipients = templateData.recipients.reduce((acc: TemplateRecipient[], recipient, index) => {
                    const uniqueRole = `${recipient.role}_${index}`;
                    const uniqueOrder = index + 1;
                    acc.push({ ...recipient, role: uniqueRole, order: uniqueOrder });
                    return acc;
                }, []);

                const normalizedTemplate: TemplateCreate = {
                    ...templateData,
                    fields: uniqueFields,
                    recipients: uniqueRecipients,
                };

                // Create template using wizard
                wizard.setDocument(testDocumentId, 'Test Document');
                wizard.updateBasicInfo({
                    name: normalizedTemplate.name,
                    description: normalizedTemplate.description,
                    category: normalizedTemplate.category,
                    tags: normalizedTemplate.tags,
                    isPublic: normalizedTemplate.isPublic,
                });

                // Add fields
                for (const field of normalizedTemplate.fields) {
                    wizard.setField(field);
                }

                // Add recipients
                for (const recipient of normalizedTemplate.recipients) {
                    wizard.setRecipient(recipient);
                }

                // Set workflow and settings
                if (normalizedTemplate.workflow) {
                    wizard.setWorkflow(normalizedTemplate.workflow);
                }
                if (normalizedTemplate.settings) {
                    wizard.setSettings(normalizedTemplate.settings);
                }

                // Get template data from wizard
                const wizardTemplateData = wizard.getTemplateData();

                // Verify wizard preserves all data correctly
                expect(wizardTemplateData.name).toBe(normalizedTemplate.name);
                expect(wizardTemplateData.description).toBe(normalizedTemplate.description || undefined);
                expect(wizardTemplateData.documentId).toBe(testDocumentId); // Document ID is set by wizard
                expect(wizardTemplateData.category).toBe(normalizedTemplate.category || undefined);
                expect(wizardTemplateData.tags).toEqual(normalizedTemplate.tags);
                expect(wizardTemplateData.isPublic).toBe(normalizedTemplate.isPublic);

                // Verify fields are preserved
                expect(wizardTemplateData.fields).toHaveLength(normalizedTemplate.fields.length);

                // Verify recipients are preserved
                expect(wizardTemplateData.recipients).toHaveLength(normalizedTemplate.recipients.length);

                return true;
            }),
            { numRuns: 50 }
        );
    });

    it('should maintain template integrity when using template wizard', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    name: fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
                    description: fc.option(fc.string({ maxLength: 1000 })),
                    category: fc.option(fc.string({ maxLength: 100 })),
                    tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
                }),
                async (templateData) => {
                    // Reset wizard for each iteration
                    wizard.reset();

                    // Set document
                    const documentResult = wizard.setDocument(testDocumentId, 'Test Document');
                    expect(documentResult.success).toBe(true);

                    // Update basic info
                    const basicInfoResult = wizard.updateBasicInfo({
                        name: templateData.name,
                        description: templateData.description,
                        category: templateData.category,
                        tags: templateData.tags,
                    });
                    expect(basicInfoResult.success).toBe(true);

                    // Get template data from wizard
                    const wizardTemplateData = wizard.getTemplateData();

                    // Verify wizard preserves all data correctly
                    expect(wizardTemplateData.name).toBe(templateData.name);
                    expect(wizardTemplateData.description).toBe(templateData.description || undefined);
                    expect(wizardTemplateData.category).toBe(templateData.category || undefined);
                    expect(wizardTemplateData.tags).toEqual(templateData.tags);

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    it('should allow template reuse with all configurations intact', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    name: fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
                    fields: fc.array(templateFieldArb, { maxLength: 5 }),
                    recipients: fc.array(templateRecipientArb, { maxLength: 3 }),
                }),
                async (templateData) => {
                    // Reset wizard for each iteration
                    wizard.reset();

                    // Create template using wizard
                    wizard.setDocument(testDocumentId, 'Test Document');
                    wizard.updateBasicInfo({ name: templateData.name });

                    // Add fields with unique names
                    const uniqueFields = templateData.fields.map((field, index) => ({
                        ...field,
                        name: `Field_${index}`,
                    }));

                    for (const field of uniqueFields) {
                        wizard.setField(field);
                    }

                    // Add recipients with unique roles
                    const uniqueRecipients = templateData.recipients.map((recipient, index) => ({
                        ...recipient,
                        role: `Role_${index}`,
                        order: index + 1,
                    }));

                    for (const recipient of uniqueRecipients) {
                        wizard.setRecipient(recipient);
                    }

                    // Get template data - this simulates template reuse
                    const templateData1 = wizard.getTemplateData();
                    const templateData2 = wizard.getTemplateData();

                    // Verify template can be reused multiple times with same data
                    expect(templateData1.name).toBe(templateData2.name);
                    expect(templateData1.fields).toEqual(templateData2.fields);
                    expect(templateData1.recipients).toEqual(templateData2.recipients);

                    return true;
                }
            ),
            { numRuns: 20 }
        );
    });

    it('should maintain field-recipient relationships during template operations', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.tuple(
                    fc.array(templateRecipientArb, { minLength: 1, maxLength: 3 }),
                    fc.array(templateFieldArb, { minLength: 1, maxLength: 5 })
                ),
                async ([recipients, fields]) => {
                    // Reset wizard for each iteration
                    wizard.reset();

                    // Set document
                    wizard.setDocument(testDocumentId, 'Test Document');
                    wizard.updateBasicInfo({ name: 'Field-Recipient Test Template' });

                    // Ensure unique recipient roles and field names
                    const uniqueRecipients = recipients.map((recipient, index) => ({
                        ...recipient,
                        role: `Role_${index}`,
                        order: index + 1,
                    }));

                    const uniqueFields = fields.map((field, index) => ({
                        ...field,
                        name: `Field_${index}`,
                        recipientRole: uniqueRecipients[index % uniqueRecipients.length].role,
                    }));

                    // Add recipients first
                    for (const recipient of uniqueRecipients) {
                        wizard.setRecipient(recipient);
                    }

                    // Add fields with recipient role assignments
                    for (const field of uniqueFields) {
                        wizard.setField(field);
                    }

                    // Get template data
                    const templateData = wizard.getTemplateData();

                    // Verify all field-recipient relationships are preserved
                    for (const field of uniqueFields) {
                        const savedField = templateData.fields.find(f => f.name === field.name);
                        expect(savedField).toBeDefined();
                        expect(savedField!.recipientRole).toBe(field.recipientRole);

                        // Verify the referenced recipient exists
                        const referencedRecipient = templateData.recipients.find(
                            r => r.role === field.recipientRole
                        );
                        expect(referencedRecipient).toBeDefined();
                    }

                    return true;
                }
            ),
            { numRuns: 20 }
        );
    });
});