import { z } from 'zod';

// SOC 2 Types
export enum SOC2ControlType {
    SECURITY = 'security',
    AVAILABILITY = 'availability',
    PROCESSING_INTEGRITY = 'processing_integrity',
    CONFIDENTIALITY = 'confidentiality',
    PRIVACY = 'privacy'
}

export enum SOC2ControlStatus {
    IMPLEMENTED = 'implemented',
    PARTIALLY_IMPLEMENTED = 'partially_implemented',
    NOT_IMPLEMENTED = 'not_implemented',
    NOT_APPLICABLE = 'not_applicable'
}

export const SOC2ControlSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    type: z.nativeEnum(SOC2ControlType),
    status: z.nativeEnum(SOC2ControlStatus),
    evidence: z.array(z.string()).optional(),
    lastAssessed: z.date().optional(),
    assessedBy: z.string().optional(),
    notes: z.string().optional(),
});

export type SOC2Control = z.infer<typeof SOC2ControlSchema>;

// GDPR Types
export enum GDPRLegalBasis {
    CONSENT = 'consent',
    CONTRACT = 'contract',
    LEGAL_OBLIGATION = 'legal_obligation',
    VITAL_INTERESTS = 'vital_interests',
    PUBLIC_TASK = 'public_task',
    LEGITIMATE_INTERESTS = 'legitimate_interests'
}

export enum DataProcessingPurpose {
    AUTHENTICATION = 'authentication',
    DOCUMENT_PROCESSING = 'document_processing',
    SIGNATURE_VERIFICATION = 'signature_verification',
    AUDIT_LOGGING = 'audit_logging',
    ANALYTICS = 'analytics',
    MARKETING = 'marketing',
    SUPPORT = 'support'
}

export const GDPRDataProcessingRecordSchema = z.object({
    id: z.string(),
    dataSubject: z.string(),
    dataTypes: z.array(z.string()),
    purpose: z.nativeEnum(DataProcessingPurpose),
    legalBasis: z.nativeEnum(GDPRLegalBasis),
    retentionPeriod: z.number(), // in days
    processingDate: z.date(),
    consentGiven: z.boolean().optional(),
    consentWithdrawn: z.boolean().optional(),
    dataMinimized: z.boolean().default(true),
    encrypted: z.boolean().default(true),
});

export type GDPRDataProcessingRecord = z.infer<typeof GDPRDataProcessingRecordSchema>;

// Audit Trail Types
export enum AuditEventType {
    USER_LOGIN = 'user_login',
    USER_LOGOUT = 'user_logout',
    DOCUMENT_CREATED = 'document_created',
    DOCUMENT_VIEWED = 'document_viewed',
    DOCUMENT_SIGNED = 'document_signed',
    DOCUMENT_DELETED = 'document_deleted',
    TEMPLATE_CREATED = 'template_created',
    TEMPLATE_MODIFIED = 'template_modified',
    PERMISSION_CHANGED = 'permission_changed',
    COMPLIANCE_CHECK = 'compliance_check',
    DATA_EXPORT = 'data_export',
    DATA_DELETION = 'data_deletion'
}

export enum AuditEventSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export const ImmutableAuditRecordSchema = z.object({
    id: z.string(),
    timestamp: z.date(),
    eventType: z.nativeEnum(AuditEventType),
    severity: z.nativeEnum(AuditEventSeverity),
    userId: z.string().optional(),
    organizationId: z.string(),
    entityType: z.string(),
    entityId: z.string(),
    action: z.string(),
    details: z.record(z.any()),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    hash: z.string(), // Cryptographic hash for immutability
    previousHash: z.string().optional(), // Chain of hashes
});

export type ImmutableAuditRecord = z.infer<typeof ImmutableAuditRecordSchema>;

// Compliance Dashboard Types
export enum ComplianceStatus {
    COMPLIANT = 'compliant',
    NON_COMPLIANT = 'non_compliant',
    PARTIALLY_COMPLIANT = 'partially_compliant',
    UNDER_REVIEW = 'under_review'
}

export const ComplianceReportSchema = z.object({
    id: z.string(),
    organizationId: z.string(),
    reportType: z.enum(['soc2', 'gdpr', 'comprehensive']),
    status: z.nativeEnum(ComplianceStatus),
    score: z.number().min(0).max(100),
    generatedAt: z.date(),
    generatedBy: z.string(),
    validUntil: z.date(),
    findings: z.array(z.object({
        type: z.string(),
        severity: z.nativeEnum(AuditEventSeverity),
        description: z.string(),
        recommendation: z.string().optional(),
    })),
    certifications: z.array(z.object({
        name: z.string(),
        status: z.nativeEnum(ComplianceStatus),
        validUntil: z.date().optional(),
        certificateUrl: z.string().optional(),
    })),
});

export type ComplianceReport = z.infer<typeof ComplianceReportSchema>;

// Configuration Types
export const ComplianceConfigSchema = z.object({
    soc2: z.object({
        enabled: z.boolean().default(true),
        autoAssessment: z.boolean().default(true),
        assessmentInterval: z.number().default(90), // days
        requiredControls: z.array(z.string()).default([]),
    }),
    gdpr: z.object({
        enabled: z.boolean().default(true),
        dataRetentionDays: z.number().default(2555), // 7 years
        consentRequired: z.boolean().default(true),
        rightToBeForgettenEnabled: z.boolean().default(true),
        dataPortabilityEnabled: z.boolean().default(true),
    }),
    auditTrail: z.object({
        enabled: z.boolean().default(true),
        immutableRecords: z.boolean().default(true),
        retentionDays: z.number().default(2555), // 7 years
        encryptionEnabled: z.boolean().default(true),
        hashChainEnabled: z.boolean().default(true),
    }),
    reporting: z.object({
        autoGeneration: z.boolean().default(true),
        reportInterval: z.number().default(30), // days
        emailNotifications: z.boolean().default(true),
        dashboardEnabled: z.boolean().default(true),
    }),
});

export type ComplianceConfig = z.infer<typeof ComplianceConfigSchema>;