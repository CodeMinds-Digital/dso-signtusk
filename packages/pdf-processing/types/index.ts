import { z } from 'zod';

// Base PDF generation options
export const ZPDFGenerationOptionsSchema = z.object({
    format: z.enum(['A4', 'Letter']).default('A4'),
    language: z.string().default('en'),
    includeBackground: z.boolean().default(true),
});

export type PDFGenerationOptions = z.infer<typeof ZPDFGenerationOptionsSchema>;

// Certificate generation types
export const ZCertificateDataSchema = z.object({
    documentId: z.number(),
    documentTitle: z.string(),
    signerName: z.string(),
    signerEmail: z.string(),
    signedAt: z.date(),
    verificationUrl: z.string().url(),
    certificateId: z.string(),
    language: z.string().optional(),
});

export type CertificateData = z.infer<typeof ZCertificateDataSchema>;

// Audit log generation types
export const ZAuditLogEntrySchema = z.object({
    id: z.string(),
    timestamp: z.date(),
    action: z.string(),
    user: z.string().optional(),
    email: z.string().optional(),
    ipAddress: z.string().optional(),
    userAgent: z.string().optional(),
    details: z.record(z.any()).optional(),
});

export const ZAuditLogDataSchema = z.object({
    documentId: z.number(),
    documentTitle: z.string(),
    entries: z.array(ZAuditLogEntrySchema),
    generatedAt: z.date(),
    language: z.string().optional(),
});

export type AuditLogEntry = z.infer<typeof ZAuditLogEntrySchema>;
export type AuditLogData = z.infer<typeof ZAuditLogDataSchema>;

// PDF processing result
export const ZPDFProcessingResultSchema = z.object({
    success: z.boolean(),
    data: z.instanceof(Buffer).optional(),
    error: z.string().optional(),
    metadata: z.object({
        pageCount: z.number().optional(),
        fileSize: z.number().optional(),
        generatedAt: z.date(),
    }),
});

export type PDFProcessingResult = z.infer<typeof ZPDFProcessingResultSchema>;

// Error types
export class PDFProcessingError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: Record<string, any>
    ) {
        super(message);
        this.name = 'PDFProcessingError';
    }
}

export const PDF_ERROR_CODES = {
    INVALID_INPUT: 'INVALID_INPUT',
    GENERATION_FAILED: 'GENERATION_FAILED',
    FONT_LOADING_FAILED: 'FONT_LOADING_FAILED',
    QR_CODE_GENERATION_FAILED: 'QR_CODE_GENERATION_FAILED',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
} as const;