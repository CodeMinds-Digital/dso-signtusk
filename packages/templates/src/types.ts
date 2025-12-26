import { z } from 'zod';

// Template creation and management types
export const TemplateFieldSchema = z.object({
    id: z.string().optional(),
    type: z.enum(['SIGNATURE', 'INITIAL', 'TEXT', 'DATE', 'CHECKBOX', 'RADIO', 'DROPDOWN', 'ATTACHMENT']),
    name: z.string().min(1).max(255),
    page: z.number().min(1),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
    properties: z.record(z.any()).default({}),
    isRequired: z.boolean().default(false),
    recipientRole: z.string().optional(),
});

export const TemplateRecipientSchema = z.object({
    id: z.string().optional(),
    role: z.string().min(1).max(100),
    name: z.string().optional(),
    email: z.string().email().optional(),
    order: z.number().min(1).default(1),
    authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']).default('EMAIL'),
    isRequired: z.boolean().default(true),
});

export const WorkflowConfigSchema = z.object({
    type: z.enum(['sequential', 'parallel', 'conditional', 'hybrid']).default('sequential'),
    steps: z.array(z.object({
        id: z.string(),
        name: z.string(),
        type: z.enum(['signing', 'approval', 'review', 'notification']),
        recipients: z.array(z.string()),
        conditions: z.array(z.object({
            field: z.string(),
            operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']),
            value: z.any(),
        })).optional(),
        settings: z.record(z.any()).default({}),
    })),
    settings: z.object({
        autoReminders: z.boolean().default(true),
        reminderInterval: z.number().min(1).max(30).default(3), // days
        expirationDays: z.number().min(1).max(365).optional(),
        allowDecline: z.boolean().default(true),
        requireAllSignatures: z.boolean().default(true),
    }).default({}),
});

export const TemplateCreateSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    documentId: z.string(),
    category: z.string().max(100).optional(),
    tags: z.array(z.string().max(50)).max(20).default([]),
    isPublic: z.boolean().default(false),
    fields: z.array(TemplateFieldSchema).default([]),
    recipients: z.array(TemplateRecipientSchema).default([]),
    workflow: WorkflowConfigSchema.optional(),
    settings: z.object({
        allowDuplication: z.boolean().default(true),
        requireApproval: z.boolean().default(false),
        defaultLanguage: z.string().default('en'),
        autoReminders: z.boolean().default(true),
        expirationDays: z.number().min(1).max(365).optional(),
        brandingEnabled: z.boolean().default(false),
        customBranding: z.object({
            logo: z.string().optional(),
            primaryColor: z.string().optional(),
            secondaryColor: z.string().optional(),
        }).optional(),
    }).default({}),
});

export const TemplateUpdateSchema = TemplateCreateSchema.omit({ documentId: true }).partial();

export const TemplateShareSchema = z.object({
    templateId: z.string(),
    permissions: z.object({
        canView: z.boolean().default(true),
        canEdit: z.boolean().default(false),
        canDuplicate: z.boolean().default(true),
        canShare: z.boolean().default(false),
    }),
    shareWith: z.array(z.object({
        type: z.enum(['user', 'team', 'organization', 'public']),
        id: z.string().optional(), // user/team/org id, not needed for public
        email: z.string().email().optional(), // for external sharing
    })),
    expiresAt: z.date().optional(),
    message: z.string().max(500).optional(),
});

export const RecipientRoleDefinitionSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    permissions: z.object({
        canSign: z.boolean().default(true),
        canApprove: z.boolean().default(false),
        canReview: z.boolean().default(false),
        canDelegate: z.boolean().default(false),
        mustAuthenticate: z.boolean().default(false),
    }),
    order: z.number().min(1),
    isRequired: z.boolean().default(true),
    color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(), // hex color for UI
});

// Type exports
export type TemplateField = z.infer<typeof TemplateFieldSchema>;
export type TemplateRecipient = z.infer<typeof TemplateRecipientSchema>;
export type WorkflowConfig = z.infer<typeof WorkflowConfigSchema>;
export type TemplateCreate = z.infer<typeof TemplateCreateSchema>;
export type TemplateUpdate = z.infer<typeof TemplateUpdateSchema>;
export type TemplateShare = z.infer<typeof TemplateShareSchema>;
export type RecipientRoleDefinition = z.infer<typeof RecipientRoleDefinitionSchema>;

// Template wizard step types
export type TemplateWizardStep =
    | 'document-selection'
    | 'field-placement'
    | 'recipient-setup'
    | 'workflow-configuration'
    | 'settings-review'
    | 'completion';

export interface TemplateWizardState {
    currentStep: TemplateWizardStep;
    completedSteps: TemplateWizardStep[];
    template: Partial<TemplateCreate>;
    validation: {
        isValid: boolean;
        errors: Record<string, string[]>;
    };
}

// Template analytics types
export interface TemplateAnalytics {
    templateId: string;
    usageCount: number;
    completionRate: number;
    averageCompletionTime: number; // in minutes
    popularFields: Array<{
        fieldName: string;
        usageCount: number;
    }>;
    recipientEngagement: Array<{
        role: string;
        averageTimeToSign: number;
        completionRate: number;
    }>;
    timeSeriesData: Array<{
        date: string;
        usageCount: number;
        completionCount: number;
    }>;
}

// Template validation result
export interface TemplateValidationResult {
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
}

// Template permission types
export interface TemplatePermissions {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canDuplicate: boolean;
    canShare: boolean;
    canUse: boolean;
}

export interface TemplateWithPermissions {
    id: string;
    name: string;
    description?: string;
    category?: string;
    tags: string[];
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: {
        id: string;
        name: string;
        email: string;
    };
    usageCount: number;
    permissions: TemplatePermissions;
}