// Main exports for the PDF processing package
export * from './types/index.js';
export * from './engines/base-generator.js';
export * from './engines/certificate-generator.js';
export * from './engines/audit-log-generator.js';

// Convenience functions for easy usage
import { CertificateGenerator } from './engines/certificate-generator.js';
import { AuditLogGenerator } from './engines/audit-log-generator.js';
import {
    type CertificateData,
    type AuditLogData,
    type PDFGenerationOptions,
    ZCertificateDataSchema,
    ZAuditLogDataSchema,
    ZPDFGenerationOptionsSchema,
    PDFProcessingError,
    PDF_ERROR_CODES
} from './types/index.js';

/**
 * Generate a certificate PDF
 */
export async function generateCertificate(
    certificateData: CertificateData,
    options: PDFGenerationOptions = { format: 'A4', language: 'en', includeBackground: true }
): Promise<Buffer> {
    try {
        // Validate input data
        const validatedData = ZCertificateDataSchema.parse(certificateData);
        const validatedOptions = ZPDFGenerationOptionsSchema.parse(options);

        const generator = new CertificateGenerator(validatedData, validatedOptions);
        return await generator.generate();
    } catch (error) {
        if (error instanceof PDFProcessingError) {
            throw error;
        }
        throw new PDFProcessingError(
            'Failed to generate certificate',
            PDF_ERROR_CODES.VALIDATION_FAILED,
            { error: error instanceof Error ? error.message : String(error) }
        );
    }
}

/**
 * Generate an audit log PDF
 */
export async function generateAuditLog(
    auditLogData: AuditLogData,
    options: PDFGenerationOptions = { format: 'A4', language: 'en', includeBackground: true }
): Promise<Buffer> {
    try {
        // Validate input data
        const validatedData = ZAuditLogDataSchema.parse(auditLogData);
        const validatedOptions = ZPDFGenerationOptionsSchema.parse(options);

        const generator = new AuditLogGenerator(validatedData, validatedOptions);
        return await generator.generate();
    } catch (error) {
        if (error instanceof PDFProcessingError) {
            throw error;
        }
        throw new PDFProcessingError(
            'Failed to generate audit log',
            PDF_ERROR_CODES.VALIDATION_FAILED,
            { error: error instanceof Error ? error.message : String(error) }
        );
    }
}