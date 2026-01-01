import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

// User schemas
export const CreateUserSchema = z.object({
    email: z.string().email(),
    name: z.string().min(1).max(255),
    organizationId: z.string().cuid(),
    avatar: z.string().url().optional(),
    password: z.string().min(8).optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ organizationId: true });

// Organization schemas
export const CreateOrganizationSchema = z.object({
    name: z.string().min(1).max(255),
    domain: z.string().optional(),
    slug: z.string().min(1).max(100),
    settings: z.record(z.any()).default({}),
    branding: z.record(z.any()).default({}),
});

export const UpdateOrganizationSchema = CreateOrganizationSchema.partial();

// Document schemas
export const CreateDocumentSchema = z.object({
    name: z.string().min(1).max(255),
    originalName: z.string().min(1).max(255),
    mimeType: z.string(),
    size: z.number().positive(),
    hash: z.string(),
    organizationId: z.string().cuid(),
    createdBy: z.string().cuid(),
    ownedBy: z.string().cuid(),
    folderId: z.string().cuid().optional(),
    metadata: z.record(z.any()).default({}),
});

export const UpdateDocumentSchema = CreateDocumentSchema.partial().omit({
    organizationId: true,
    createdBy: true,
    hash: true,
});

// Signing request schemas
export const CreateSigningRequestSchema = z.object({
    documentId: z.string().cuid(),
    templateId: z.string().cuid().optional(),
    organizationId: z.string().cuid(),
    createdBy: z.string().cuid(),
    title: z.string().min(1).max(255),
    message: z.string().max(1000).optional(),
    workflow: z.record(z.any()).default({}),
    settings: z.record(z.any()).default({}),
    expiresAt: z.date().optional(),
});

// Recipient schemas
export const CreateRecipientSchema = z.object({
    signingRequestId: z.string().cuid(),
    userId: z.string().cuid().optional(),
    email: z.string().email(),
    name: z.string().min(1).max(255),
    role: z.string().default('signer'),
    order: z.number().int().positive().default(1),
    authMethod: z.enum(['EMAIL', 'SMS', 'PHONE', 'ID_VERIFICATION', 'KNOWLEDGE_BASED']).default('EMAIL'),
});

// Template schemas
export const CreateTemplateSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    documentId: z.string().cuid(),
    organizationId: z.string().cuid(),
    createdBy: z.string().cuid(),
    isPublic: z.boolean().default(false),
    category: z.string().optional(),
    tags: z.array(z.string()).default([]),
    settings: z.record(z.any()).default({}),
    workflow: z.record(z.any()).default({}),
});

// Document field schemas
export const CreateDocumentFieldSchema = z.object({
    documentId: z.string().cuid(),
    type: z.enum(['SIGNATURE', 'INITIAL', 'TEXT', 'DATE', 'CHECKBOX', 'RADIO', 'DROPDOWN', 'ATTACHMENT']),
    name: z.string().min(1).max(255),
    page: z.number().int().min(1),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().positive(),
    height: z.number().positive(),
    properties: z.record(z.any()).default({}),
    isRequired: z.boolean().default(false),
    recipientId: z.string().cuid().optional(),
});

// Signature schemas
export const CreateSignatureSchema = z.object({
    fieldId: z.string().cuid(),
    recipientId: z.string().cuid(),
    type: z.enum(['DRAWN', 'TYPED', 'UPLOADED', 'DIGITAL']),
    data: z.string(), // Base64 encoded signature data
    ipAddress: z.string().ip(),
    userAgent: z.string(),
    certificate: z.record(z.any()).optional(),
    biometricData: z.record(z.any()).optional(),
});

// Audit event schemas
export const CreateAuditEventSchema = z.object({
    organizationId: z.string().cuid(),
    userId: z.string().cuid().optional(),
    entityType: z.string(),
    entityId: z.string().cuid(),
    action: z.string(),
    details: z.record(z.any()).default({}),
    ipAddress: z.string().ip().optional(),
    userAgent: z.string().optional(),
});

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type CreateOrganizationInput = z.infer<typeof CreateOrganizationSchema>;
export type UpdateOrganizationInput = z.infer<typeof UpdateOrganizationSchema>;
export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>;
export type CreateSigningRequestInput = z.infer<typeof CreateSigningRequestSchema>;
export type CreateRecipientInput = z.infer<typeof CreateRecipientSchema>;
export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type CreateDocumentFieldInput = z.infer<typeof CreateDocumentFieldSchema>;
export type CreateSignatureInput = z.infer<typeof CreateSignatureSchema>;
export type CreateAuditEventInput = z.infer<typeof CreateAuditEventSchema>;

// Extended types with relations (simplified to avoid circular dependencies)
export interface UserWithOrganization {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    organization: {
        id: string;
        name: string;
        domain?: string;
    };
}

export interface DocumentWithDetails {
    id: string;
    name: string;
    organizationId: string;
    createdBy: string;
    ownedBy: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface SigningRequestWithDetails {
    id: string;
    documentId: string;
    organizationId: string;
    createdBy: string;
    title: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface TemplateWithDetails {
    id: string;
    name: string;
    documentId: string;
    organizationId: string;
    createdBy: string;
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Database query options
export interface PaginationOptions {
    page?: number;
    limit?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}

export interface FilterOptions {
    search?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
    organizationId?: string;
    userId?: string;
}

// Database operation results
export interface DatabaseResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    count?: number;
}

export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

// ============================================================================
// UTILITY FUNCTION RE-EXPORTS (imported from utils.ts)
// ============================================================================

// These functions are defined in utils.ts and re-exported through index.ts