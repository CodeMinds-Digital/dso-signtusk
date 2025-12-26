import { PrismaClient } from '@signtusk/database';
import { pino } from 'pino';
import { z } from 'zod';
import {
    TemplateField,
    TemplateRecipient,
    WorkflowConfig,
} from './types';

const logger = pino({ name: 'template-instantiation-engine' });

// Template instantiation schemas
export const TemplateVariableSchema = z.object({
    name: z.string().min(1),
    value: z.any(),
    type: z.enum(['string', 'number', 'boolean', 'date', 'array', 'object']).default('string'),
});

export const FieldMappingSchema = z.object({
    templateFieldId: z.string(),
    value: z.any().optional(),
    recipientEmail: z.string().email().optional(),
    recipientName: z.string().optional(),
    isRequired: z.boolean().optional(),
    properties: z.record(z.any()).optional(),
});

export const RecipientMappingSchema = z.object({
    templateRole: z.string(),
    email: z.string().email(),
    name: z.string(),
    authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']).optional(),
    customData: z.record(z.any()).optional(),
});

export const TemplateInstantiationDataSchema = z.object({
    templateId: z.string(),
    documentName: z.string().min(1).max(255),
    variables: z.array(TemplateVariableSchema).default([]),
    fieldMappings: z.array(FieldMappingSchema).default([]),
    recipientMappings: z.array(RecipientMappingSchema),
    workflowOverrides: z.object({
        type: z.enum(['sequential', 'parallel', 'conditional', 'hybrid']).optional(),
        settings: z.record(z.any()).optional(),
    }).optional(),
    metadata: z.record(z.any()).default({}),
    settings: z.object({
        autoSend: z.boolean().default(false),
        expirationDays: z.number().min(1).max(365).optional(),
        reminderInterval: z.number().min(1).max(30).default(3),
        allowDecline: z.boolean().default(true),
        requireAllSignatures: z.boolean().default(true),
        customBranding: z.object({
            logo: z.string().optional(),
            primaryColor: z.string().optional(),
            secondaryColor: z.string().optional(),
        }).optional(),
    }).default({}),
});

// Type exports
export type TemplateVariable = z.infer<typeof TemplateVariableSchema>;
export type FieldMapping = z.infer<typeof FieldMappingSchema>;
export type RecipientMapping = z.infer<typeof RecipientMappingSchema>;
export type TemplateInstantiationData = z.infer<typeof TemplateInstantiationDataSchema>;

// Instantiation result types
export interface TemplateInstantiationResult {
    success: boolean;
    documentId?: string;
    signingRequestId?: string;
    errors?: string[];
    warnings?: string[];
    validationResults?: TemplateInstantiationValidation;
}

export interface TemplateInstantiationValidation {
    isValid: boolean;
    errors: Array<{
        field: string;
        message: string;
        severity: 'error' | 'warning';
    }>;
    warnings: Array<{
        field: string;
        message: string;
    }>;
    missingMappings: {
        fields: string[];
        recipients: string[];
    };
}

// Variable substitution context
export interface VariableContext {
    variables: Record<string, any>;
    recipients: Record<string, RecipientMapping>;
    metadata: Record<string, any>;
    timestamp: Date;
    organizationId: string;
    userId: string;
}

/**
 * Template Instantiation Engine
 * 
 * Converts templates into documents with field mapping, dynamic field population,
 * variable substitution, and comprehensive validation.
 */
export class TemplateInstantiationEngine {
    constructor(private db: PrismaClient) { }

    /**
     * Instantiate a template into a document with signing request
     */
    async instantiateTemplate(
        data: TemplateInstantiationData,
        userId: string,
        organizationId: string
    ): Promise<TemplateInstantiationResult> {
        try {
            logger.info({ templateId: data.templateId, userId }, 'Starting template instantiation');

            // Validate instantiation data
            const validation = await this.validateInstantiationData(data, userId, organizationId);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors.map(e => e.message),
                    validationResults: validation,
                };
            }

            // Get template with all related data
            const template = await this.getTemplateForInstantiation(data.templateId, organizationId);
            if (!template) {
                return {
                    success: false,
                    errors: ['Template not found or access denied'],
                };
            }

            // Create variable context
            const context = this.createVariableContext(data, userId, organizationId);

            // Process template instantiation in transaction
            const result = await this.db.$transaction(async (tx) => {
                // Create new document from template
                const document = await this.createDocumentFromTemplate(
                    template,
                    data,
                    context,
                    userId,
                    organizationId,
                    tx
                );

                // Create signing request
                const signingRequest = await this.createSigningRequestFromTemplate(
                    template,
                    document.id,
                    data,
                    context,
                    userId,
                    organizationId,
                    tx
                );

                // Create document fields with mappings
                await this.createDocumentFieldsFromTemplate(
                    template.templateFields,
                    document.id,
                    signingRequest.id,
                    data.fieldMappings,
                    context,
                    tx
                );

                // Create recipients with mappings
                await this.createRecipientsFromTemplate(
                    template.templateRecipients,
                    signingRequest.id,
                    data.recipientMappings,
                    context,
                    tx
                );

                return {
                    documentId: document.id,
                    signingRequestId: signingRequest.id,
                };
            });

            logger.info(
                {
                    templateId: data.templateId,
                    documentId: result.documentId,
                    signingRequestId: result.signingRequestId,
                    userId
                },
                'Template instantiation completed successfully'
            );

            return {
                success: true,
                documentId: result.documentId,
                signingRequestId: result.signingRequestId,
                warnings: validation.warnings.map(w => w.message),
                validationResults: validation,
            };

        } catch (error) {
            logger.error({ error, templateId: data.templateId, userId }, 'Template instantiation failed');
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Template instantiation failed'],
            };
        }
    }

    /**
     * Validate template instantiation data
     */
    async validateInstantiationData(
        data: TemplateInstantiationData,
        userId: string,
        organizationId: string
    ): Promise<TemplateInstantiationValidation> {
        const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' }> = [];
        const warnings: Array<{ field: string; message: string }> = [];

        // Get template for validation
        const template = await this.getTemplateForInstantiation(data.templateId, organizationId);
        if (!template) {
            errors.push({
                field: 'templateId',
                message: 'Template not found or access denied',
                severity: 'error',
            });
            return {
                isValid: false,
                errors,
                warnings,
                missingMappings: { fields: [], recipients: [] },
            };
        }

        // Validate recipient mappings
        const missingRecipients: string[] = [];
        const providedRoles = new Set(data.recipientMappings.map(r => r.templateRole));

        for (const templateRecipient of template.templateRecipients) {
            if (templateRecipient.isRequired && !providedRoles.has(templateRecipient.role)) {
                missingRecipients.push(templateRecipient.role);
                errors.push({
                    field: 'recipientMappings',
                    message: `Missing required recipient mapping for role: ${templateRecipient.role}`,
                    severity: 'error',
                });
            }
        }

        // Validate field mappings
        const missingFields: string[] = [];
        const providedFieldIds = new Set(data.fieldMappings.map(f => f.templateFieldId));

        for (const templateField of template.templateFields) {
            if (templateField.isRequired && !providedFieldIds.has(templateField.id)) {
                // Check if field has a recipient role that's mapped
                if (templateField.recipientRole) {
                    const hasRecipientMapping = data.recipientMappings.some(
                        r => r.templateRole === templateField.recipientRole
                    );
                    if (!hasRecipientMapping) {
                        missingFields.push(templateField.name);
                        warnings.push({
                            field: 'fieldMappings',
                            message: `Required field "${templateField.name}" has no recipient mapping`,
                        });
                    }
                } else {
                    missingFields.push(templateField.name);
                    warnings.push({
                        field: 'fieldMappings',
                        message: `Required field "${templateField.name}" has no mapping or default value`,
                    });
                }
            }
        }

        // Validate variable references
        const variableNames = new Set(data.variables.map(v => v.name));
        const referencedVariables = this.extractVariableReferences(template);

        for (const varName of referencedVariables) {
            if (!variableNames.has(varName)) {
                warnings.push({
                    field: 'variables',
                    message: `Template references variable "${varName}" but no value provided`,
                });
            }
        }

        // Validate email uniqueness in recipient mappings
        const emails = data.recipientMappings.map(r => r.email.toLowerCase());
        const uniqueEmails = new Set(emails);
        if (emails.length !== uniqueEmails.size) {
            errors.push({
                field: 'recipientMappings',
                message: 'Duplicate email addresses found in recipient mappings',
                severity: 'error',
            });
        }

        // Validate workflow overrides
        if (data.workflowOverrides) {
            const templateWorkflow = template.workflow as WorkflowConfig;
            if (templateWorkflow && data.workflowOverrides.type) {
                if (data.workflowOverrides.type !== templateWorkflow.type) {
                    warnings.push({
                        field: 'workflowOverrides',
                        message: `Workflow type override changes from "${templateWorkflow.type}" to "${data.workflowOverrides.type}"`,
                    });
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            missingMappings: {
                fields: missingFields,
                recipients: missingRecipients,
            },
        };
    }

    /**
     * Get template with all related data for instantiation
     */
    private async getTemplateForInstantiation(templateId: string, organizationId: string) {
        return await this.db.template.findFirst({
            where: {
                id: templateId,
                OR: [
                    { organizationId },
                    { isPublic: true },
                ],
                isArchived: false,
            },
            include: {
                document: true,
                templateFields: {
                    orderBy: [
                        { page: 'asc' },
                        { y: 'asc' },
                        { x: 'asc' },
                    ],
                },
                templateRecipients: {
                    orderBy: { order: 'asc' },
                },
            },
        });
    }

    /**
     * Create variable context for substitution
     */
    private createVariableContext(
        data: TemplateInstantiationData,
        userId: string,
        organizationId: string
    ): VariableContext {
        const variables: Record<string, any> = {};
        for (const variable of data.variables) {
            variables[variable.name] = variable.value;
        }

        const recipients: Record<string, RecipientMapping> = {};
        for (const recipient of data.recipientMappings) {
            recipients[recipient.templateRole] = recipient;
        }

        return {
            variables,
            recipients,
            metadata: data.metadata,
            timestamp: new Date(),
            organizationId,
            userId,
        };
    }

    /**
     * Create document from template
     */
    private async createDocumentFromTemplate(
        template: any,
        data: TemplateInstantiationData,
        context: VariableContext,
        userId: string,
        organizationId: string,
        tx: any
    ) {
        // Substitute variables in document name
        const documentName = this.substituteVariables(data.documentName, context);

        return await tx.document.create({
            data: {
                name: documentName,
                originalName: template.document.originalName,
                mimeType: template.document.mimeType,
                size: template.document.size,
                hash: template.document.hash + '_' + Date.now(), // Make unique
                status: 'READY',
                organizationId,
                createdBy: userId,
                ownedBy: userId,
                metadata: {
                    ...template.document.metadata,
                    ...data.metadata,
                    instantiatedFrom: template.id,
                    instantiatedAt: context.timestamp.toISOString(),
                },
            },
        });
    }

    /**
     * Create signing request from template
     */
    private async createSigningRequestFromTemplate(
        template: any,
        documentId: string,
        data: TemplateInstantiationData,
        context: VariableContext,
        userId: string,
        organizationId: string,
        tx: any
    ) {
        // Merge template workflow with overrides
        const templateWorkflow = template.workflow as WorkflowConfig;
        const workflow = {
            ...templateWorkflow,
            ...data.workflowOverrides,
            settings: {
                ...templateWorkflow?.settings,
                ...data.workflowOverrides?.settings,
                ...data.settings,
            },
        };

        // Calculate expiration date
        let expiresAt: Date | undefined;
        if (data.settings.expirationDays) {
            expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + data.settings.expirationDays);
        }

        return await tx.signingRequest.create({
            data: {
                documentId,
                templateId: template.id,
                organizationId,
                createdBy: userId,
                title: this.substituteVariables(data.documentName, context),
                message: template.description ? this.substituteVariables(template.description, context) : undefined,
                status: data.settings.autoSend ? 'SENT' : 'DRAFT',
                workflow,
                settings: data.settings,
                expiresAt,
            },
        });
    }

    /**
     * Create document fields from template with mappings
     */
    private async createDocumentFieldsFromTemplate(
        templateFields: any[],
        documentId: string,
        signingRequestId: string,
        fieldMappings: FieldMapping[],
        context: VariableContext,
        tx: any
    ) {
        const mappingsByFieldId = new Map(
            fieldMappings.map(mapping => [mapping.templateFieldId, mapping])
        );

        const fieldsToCreate = [];

        for (const templateField of templateFields) {
            const mapping = mappingsByFieldId.get(templateField.id);

            // Determine recipient for field
            let recipientId: string | undefined;
            if (templateField.recipientRole && context.recipients[templateField.recipientRole]) {
                // Will be set after recipients are created
                recipientId = undefined;
            }

            // Process field properties with variable substitution
            const properties = {
                ...templateField.properties,
                ...mapping?.properties,
            };

            // Substitute variables in properties
            const processedProperties = this.substituteVariablesInObject(properties, context);

            // Set default value if provided in mapping
            if (mapping?.value !== undefined) {
                processedProperties.defaultValue = mapping.value;
            }

            fieldsToCreate.push({
                documentId,
                type: templateField.type,
                name: this.substituteVariables(templateField.name, context),
                page: templateField.page,
                x: templateField.x,
                y: templateField.y,
                width: templateField.width,
                height: templateField.height,
                properties: processedProperties,
                isRequired: mapping?.isRequired ?? templateField.isRequired,
                recipientId, // Will be updated after recipients are created
            });
        }

        // Create all fields
        const createdFields = [];
        for (const fieldData of fieldsToCreate) {
            const field = await tx.documentField.create({ data: fieldData });
            createdFields.push(field);
        }

        return createdFields;
    }

    /**
     * Create recipients from template with mappings
     */
    private async createRecipientsFromTemplate(
        templateRecipients: any[],
        signingRequestId: string,
        recipientMappings: RecipientMapping[],
        context: VariableContext,
        tx: any
    ) {
        const mappingsByRole = new Map(
            recipientMappings.map(mapping => [mapping.templateRole, mapping])
        );

        const recipientsToCreate = [];

        for (const templateRecipient of templateRecipients) {
            const mapping = mappingsByRole.get(templateRecipient.role);

            if (!mapping) {
                if (templateRecipient.isRequired) {
                    throw new Error(`Missing required recipient mapping for role: ${templateRecipient.role}`);
                }
                continue;
            }

            recipientsToCreate.push({
                signingRequestId,
                email: mapping.email,
                name: this.substituteVariables(mapping.name, context),
                role: templateRecipient.role,
                order: templateRecipient.order,
                status: 'PENDING',
                authMethod: mapping.authMethod || templateRecipient.authMethod,
                accessToken: this.generateAccessToken(),
            });
        }

        // Create all recipients
        const createdRecipients = [];
        for (const recipientData of recipientsToCreate) {
            const recipient = await tx.recipient.create({ data: recipientData });
            createdRecipients.push(recipient);
        }

        // Update document fields with recipient IDs
        for (const recipient of createdRecipients) {
            await tx.documentField.updateMany({
                where: {
                    documentId: recipientsToCreate[0].signingRequestId, // This should be documentId
                    properties: {
                        path: ['recipientRole'],
                        equals: recipient.role,
                    },
                },
                data: {
                    recipientId: recipient.id,
                },
            });
        }

        return createdRecipients;
    }

    /**
     * Substitute variables in text
     */
    private substituteVariables(text: string, context: VariableContext): string {
        if (!text) return text;

        return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
            const trimmedName = variableName.trim();

            // Check for nested properties (e.g., {{recipient.signer.name}})
            if (trimmedName.includes('.')) {
                const parts = trimmedName.split('.');
                let value: any = context;

                for (const part of parts) {
                    if (value && typeof value === 'object' && part in value) {
                        value = value[part];
                    } else {
                        return match; // Return original if path not found
                    }
                }

                return String(value);
            }

            // Simple variable lookup
            if (trimmedName in context.variables) {
                return String(context.variables[trimmedName]);
            }

            // Built-in variables
            switch (trimmedName) {
                case 'timestamp':
                    return context.timestamp.toISOString();
                case 'date':
                    return context.timestamp.toLocaleDateString();
                case 'time':
                    return context.timestamp.toLocaleTimeString();
                case 'organizationId':
                    return context.organizationId;
                case 'userId':
                    return context.userId;
                default:
                    return match; // Return original if variable not found
            }
        });
    }

    /**
     * Substitute variables in object recursively
     */
    private substituteVariablesInObject(obj: any, context: VariableContext): any {
        if (typeof obj === 'string') {
            return this.substituteVariables(obj, context);
        }

        if (Array.isArray(obj)) {
            return obj.map(item => this.substituteVariablesInObject(item, context));
        }

        if (obj && typeof obj === 'object') {
            const result: any = {};
            for (const [key, value] of Object.entries(obj)) {
                result[key] = this.substituteVariablesInObject(value, context);
            }
            return result;
        }

        return obj;
    }

    /**
     * Extract variable references from template
     */
    private extractVariableReferences(template: any): Set<string> {
        const variables = new Set<string>();

        // Extract from template name and description
        this.extractVariablesFromText(template.name, variables);
        if (template.description) {
            this.extractVariablesFromText(template.description, variables);
        }

        // Extract from template fields
        for (const field of template.templateFields) {
            this.extractVariablesFromText(field.name, variables);
            this.extractVariablesFromObject(field.properties, variables);
        }

        // Extract from workflow
        if (template.workflow) {
            this.extractVariablesFromObject(template.workflow, variables);
        }

        return variables;
    }

    /**
     * Extract variable names from text
     */
    private extractVariablesFromText(text: string, variables: Set<string>): void {
        if (!text) return;

        const matches = text.match(/\{\{([^}]+)\}\}/g);
        if (matches) {
            for (const match of matches) {
                const variableName = match.slice(2, -2).trim();
                if (!variableName.includes('.')) { // Only simple variables
                    variables.add(variableName);
                }
            }
        }
    }

    /**
     * Extract variable names from object recursively
     */
    private extractVariablesFromObject(obj: any, variables: Set<string>): void {
        if (typeof obj === 'string') {
            this.extractVariablesFromText(obj, variables);
        } else if (Array.isArray(obj)) {
            for (const item of obj) {
                this.extractVariablesFromObject(item, variables);
            }
        } else if (obj && typeof obj === 'object') {
            for (const value of Object.values(obj)) {
                this.extractVariablesFromObject(value, variables);
            }
        }
    }

    /**
     * Generate secure access token for recipients
     */
    private generateAccessToken(): string {
        return Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15) +
            Date.now().toString(36);
    }

    /**
     * Preview template instantiation without creating actual records
     */
    async previewTemplateInstantiation(
        data: TemplateInstantiationData,
        userId: string,
        organizationId: string
    ): Promise<{
        success: boolean;
        preview?: {
            documentName: string;
            fields: Array<{
                name: string;
                type: string;
                recipientRole?: string;
                processedProperties: any;
            }>;
            recipients: Array<{
                role: string;
                email: string;
                name: string;
            }>;
            workflow: any;
            variables: Record<string, any>;
        };
        validation?: TemplateInstantiationValidation;
        errors?: string[];
    }> {
        try {
            // Validate instantiation data
            const validation = await this.validateInstantiationData(data, userId, organizationId);

            // Get template
            const template = await this.getTemplateForInstantiation(data.templateId, organizationId);
            if (!template) {
                return {
                    success: false,
                    errors: ['Template not found or access denied'],
                };
            }

            // Create context
            const context = this.createVariableContext(data, userId, organizationId);

            // Process preview data
            const documentName = this.substituteVariables(data.documentName, context);

            const fields = template.templateFields.map((field: any) => {
                const mapping = data.fieldMappings.find(m => m.templateFieldId === field.id);
                return {
                    name: this.substituteVariables(field.name, context),
                    type: field.type,
                    recipientRole: field.recipientRole,
                    processedProperties: this.substituteVariablesInObject({
                        ...field.properties,
                        ...mapping?.properties,
                    }, context),
                };
            });

            const recipients = data.recipientMappings.map(mapping => ({
                role: mapping.templateRole,
                email: mapping.email,
                name: this.substituteVariables(mapping.name, context),
            }));

            const workflow = {
                ...(template.workflow as Record<string, any> || {}),
                ...(data.workflowOverrides || {}),
            };

            return {
                success: true,
                preview: {
                    documentName,
                    fields,
                    recipients,
                    workflow,
                    variables: context.variables,
                },
                validation,
            };

        } catch (error) {
            logger.error({ error, templateId: data.templateId, userId }, 'Template preview failed');
            return {
                success: false,
                errors: [error instanceof Error ? error.message : 'Template preview failed'],
            };
        }
    }
}