import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { TemplateWizard } from '../template-wizard';
import { TemplateService } from '../template-service';
import { TemplateCreate, TemplateField, TemplateRecipient } from '../types';

/**
 * **Feature: docusign-alternative-comprehensive, Property 26: Template Creation and Reuse**
 * 
 * Property: Template Wizard State Management
 * For any template wizard operations, all configuration data should be preserved
 * correctly throughout the wizard steps and be retrievable with all settings intact
 * 
 * **Validates: Requirements 6.1**
 */

describe('Template Wizard Property Tests', () => {
    let mockTemplateService: TemplateService;
    let wizard: TemplateWizard;

    beforeEach(() => {
        // Create a mock template service
        mockTemplateService = {
            validateTemplate: async (template: TemplateCreate) => ({
                isValid: true,
                errors: [],
                warnings: [],
            }),
        } as any;

        wizard = new TemplateWizard(mockTemplateService);
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

    it('should preserve basic template information throughout wizard steps', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    documentId: fc.string({ minLength: 1 }),
                    documentName: fc.string({ minLength: 1 }),
                    name: fc.string({ minLength: 2, maxLength: 255 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
                    description: fc.option(fc.string({ maxLength: 1000 })),
                    category: fc.option(fc.string({ maxLength: 100 })),
                    tags: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 20 }),
                }),
                async (basicInfo) => {
                    // Reset wizard for each iteration
                    wizard.reset();

                    // Set document
                    const documentResult = wizard.setDocument(basicInfo.documentId, basicInfo.documentName);
                    expect(documentResult.success).toBe(true);

                    // Update basic info
                    const basicInfoResult = wizard.updateBasicInfo({
                        name: basicInfo.name,
                        description: basicInfo.description,
                        category: basicInfo.category,
                        tags: basicInfo.tags,
                    });
                    expect(basicInfoResult.success).toBe(true);

                    // Get template data and verify preservation
                    const templateData = wizard.getTemplateData();

                    expect(templateData.documentId).toBe(basicInfo.documentId);
                    expect(templateData.name).toBe(basicInfo.name);
                    expect(templateData.description).toBe(basicInfo.description || undefined);
                    expect(templateData.category).toBe(basicInfo.category || undefined);
                    expect(templateData.tags).toEqual(basicInfo.tags);

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should maintain field configurations correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(templateFieldArb, { minLength: 1, maxLength: 10 }),
                async (fields) => {
                    // Reset wizard for each iteration
                    wizard.reset();

                    // Set document first
                    wizard.setDocument('test-doc-id', 'Test Document');
                    wizard.updateBasicInfo({ name: 'Test Template' });

                    // Add fields with unique names
                    const uniqueFields = fields.map((field, index) => ({
                        ...field,
                        name: `${field.name}_${index}`,
                    }));

                    const addedFields: TemplateField[] = [];

                    for (const field of uniqueFields) {
                        const result = wizard.setField(field);
                        if (result.success) {
                            addedFields.push(field);
                        }
                    }

                    // Get template data and verify fields
                    const templateData = wizard.getTemplateData();

                    expect(templateData.fields).toHaveLength(addedFields.length);

                    for (const originalField of addedFields) {
                        const savedField = templateData.fields.find(f => f.name === originalField.name);
                        expect(savedField).toBeDefined();
                        expect(savedField!.type).toBe(originalField.type);
                        expect(savedField!.page).toBe(originalField.page);
                        expect(savedField!.x).toBe(originalField.x);
                        expect(savedField!.y).toBe(originalField.y);
                        expect(savedField!.width).toBe(originalField.width);
                        expect(savedField!.height).toBe(originalField.height);
                        expect(savedField!.isRequired).toBe(originalField.isRequired);
                        expect(savedField!.recipientRole).toBe(originalField.recipientRole);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    it('should maintain recipient configurations correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(templateRecipientArb, { minLength: 1, maxLength: 10 }),
                async (recipients) => {
                    // Reset wizard for each iteration
                    wizard.reset();

                    // Set document first
                    wizard.setDocument('test-doc-id', 'Test Document');
                    wizard.updateBasicInfo({ name: 'Test Template' });

                    // Add recipients with unique roles and orders
                    const uniqueRecipients = recipients.map((recipient, index) => ({
                        ...recipient,
                        role: `${recipient.role}_${index}`,
                        order: index + 1,
                    }));

                    const addedRecipients: TemplateRecipient[] = [];

                    for (const recipient of uniqueRecipients) {
                        const result = wizard.setRecipient(recipient);
                        if (result.success) {
                            addedRecipients.push(recipient);
                        }
                    }

                    // Get template data and verify recipients
                    const templateData = wizard.getTemplateData();

                    expect(templateData.recipients).toHaveLength(addedRecipients.length);

                    for (const originalRecipient of addedRecipients) {
                        const savedRecipient = templateData.recipients.find(r => r.role === originalRecipient.role);
                        expect(savedRecipient).toBeDefined();
                        expect(savedRecipient!.name).toBe(originalRecipient.name);
                        expect(savedRecipient!.email).toBe(originalRecipient.email);
                        expect(savedRecipient!.order).toBe(originalRecipient.order);
                        expect(savedRecipient!.authMethod).toBe(originalRecipient.authMethod);
                        expect(savedRecipient!.isRequired).toBe(originalRecipient.isRequired);
                    }

                    return true;
                }
            ),
            { numRuns: 50 }
        );
    });

    it('should handle field removal correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(templateFieldArb, { minLength: 2, maxLength: 5 }),
                async (fields) => {
                    // Reset wizard for each iteration
                    wizard.reset();

                    // Set document first
                    wizard.setDocument('test-doc-id', 'Test Document');
                    wizard.updateBasicInfo({ name: 'Test Template' });

                    // Add fields with unique names
                    const uniqueFields = fields.map((field, index) => ({
                        ...field,
                        name: `Field_${index}`,
                        id: `field_${index}`,
                    }));

                    // Add all fields
                    for (const field of uniqueFields) {
                        wizard.setField(field);
                    }

                    // Remove first field
                    const fieldToRemove = uniqueFields[0];
                    const removeResult = wizard.removeField(fieldToRemove.id!);
                    expect(removeResult.success).toBe(true);

                    // Verify field was removed
                    const templateData = wizard.getTemplateData();
                    expect(templateData.fields).toHaveLength(uniqueFields.length - 1);

                    const removedField = templateData.fields.find(f => f.id === fieldToRemove.id);
                    expect(removedField).toBeUndefined();

                    // Verify other fields are still present
                    for (let i = 1; i < uniqueFields.length; i++) {
                        const field = uniqueFields[i];
                        const savedField = templateData.fields.find(f => f.name === field.name);
                        expect(savedField).toBeDefined();
                    }

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    it('should handle recipient removal correctly', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(templateRecipientArb, { minLength: 2, maxLength: 5 }),
                async (recipients) => {
                    // Reset wizard for each iteration
                    wizard.reset();

                    // Set document first
                    wizard.setDocument('test-doc-id', 'Test Document');
                    wizard.updateBasicInfo({ name: 'Test Template' });

                    // Add recipients with unique roles
                    const uniqueRecipients = recipients.map((recipient, index) => ({
                        ...recipient,
                        role: `Role_${index}`,
                        order: index + 1,
                        id: `recipient_${index}`,
                    }));

                    // Add all recipients
                    for (const recipient of uniqueRecipients) {
                        wizard.setRecipient(recipient);
                    }

                    // Remove first recipient
                    const recipientToRemove = uniqueRecipients[0];
                    const removeResult = wizard.removeRecipient(recipientToRemove.id!);
                    expect(removeResult.success).toBe(true);

                    // Verify recipient was removed
                    const templateData = wizard.getTemplateData();
                    expect(templateData.recipients).toHaveLength(uniqueRecipients.length - 1);

                    const removedRecipient = templateData.recipients.find(r => r.id === recipientToRemove.id);
                    expect(removedRecipient).toBeUndefined();

                    // Verify other recipients are still present
                    for (let i = 1; i < uniqueRecipients.length; i++) {
                        const recipient = uniqueRecipients[i];
                        const savedRecipient = templateData.recipients.find(r => r.role === recipient.role);
                        expect(savedRecipient).toBeDefined();
                    }

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });

    it('should maintain wizard state consistency across operations', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    documentId: fc.string({ minLength: 1 }),
                    documentName: fc.string({ minLength: 1 }),
                    templateName: fc.string({ minLength: 2 }).filter(s => s.trim().length >= 2 && /^[a-zA-Z0-9\s\-_]+$/.test(s.trim())),
                    fields: fc.array(templateFieldArb, { maxLength: 5 }),
                    recipients: fc.array(templateRecipientArb, { maxLength: 3 }),
                }),
                async (testData) => {
                    // Reset wizard for each iteration
                    wizard.reset();

                    // Initialize wizard
                    wizard.setDocument(testData.documentId, testData.documentName);
                    wizard.updateBasicInfo({ name: testData.templateName });

                    // Add recipients first (with unique roles)
                    const uniqueRecipients = testData.recipients.map((recipient, index) => ({
                        ...recipient,
                        role: `Role_${index}`,
                        order: index + 1,
                    }));

                    for (const recipient of uniqueRecipients) {
                        wizard.setRecipient(recipient);
                    }

                    // Add fields (with unique names and assign to recipients)
                    const uniqueFields = testData.fields.map((field, index) => ({
                        ...field,
                        name: `Field_${index}`,
                        recipientRole: uniqueRecipients.length > 0
                            ? uniqueRecipients[index % uniqueRecipients.length].role
                            : undefined,
                    }));

                    for (const field of uniqueFields) {
                        wizard.setField(field);
                    }

                    // Get initial state
                    const initialState = wizard.getState();
                    const initialTemplateData = wizard.getTemplateData();

                    // Perform some operations and verify state consistency
                    const progress1 = wizard.getProgress();
                    expect(progress1).toBeGreaterThanOrEqual(0);
                    expect(progress1).toBeLessThanOrEqual(100);

                    // Verify template data is consistent
                    const finalTemplateData = wizard.getTemplateData();
                    expect(finalTemplateData.name).toBe(testData.templateName);
                    expect(finalTemplateData.documentId).toBe(testData.documentId);

                    // Verify all added recipients are present
                    expect(finalTemplateData.recipients).toHaveLength(uniqueRecipients.length);

                    // Verify all added fields are present
                    expect(finalTemplateData.fields).toHaveLength(uniqueFields.length);

                    return true;
                }
            ),
            { numRuns: 30 }
        );
    });
});