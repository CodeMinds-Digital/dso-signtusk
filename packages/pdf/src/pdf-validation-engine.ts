import { PDFDocument } from 'pdf-lib';
import type {
    ValidationResult,
    CMSSignature,
    SignatureValidationResult,
    CertificateValidationResult,
    TimestampVerificationResult,
    X509Certificate,
    Timestamp,
    ExtractedSignature,
} from './types';
import {
    PDFProcessingError,
    PDFValidationError,
    PDFCorruptionError,
    SignatureValidationError,
    CertificateError,
    TimestampValidationError,
} from './types';
import { DigitalSignatureEngineImpl } from './digital-signature-engine';
import { CertificateManagerImpl } from './certificate-manager';
import { TimestampServerManagerImpl } from './timestamp-server-manager';

/**
 * Comprehensive PDF validation engine that validates:
 * - PDF structure and integrity
 * - Digital signatures (CMS/PKCS#7)
 * - Certificate chains
 * - Timestamps (RFC 3161)
 */
export class PDFValidationEngine {
    private readonly digitalSignatureEngine: DigitalSignatureEngineImpl;
    private readonly certificateManager: CertificateManagerImpl;
    private readonly timestampManager: TimestampServerManagerImpl;

    constructor() {
        this.digitalSignatureEngine = new DigitalSignatureEngineImpl();
        this.certificateManager = new CertificateManagerImpl();
        this.timestampManager = new TimestampServerManagerImpl();
    }

    /**
     * Comprehensive PDF validation including structure, signatures, certificates, and timestamps
     */
    async validatePDF(buffer: Buffer): Promise<PDFValidationResult> {
        const startTime = Date.now();

        try {
            const result: PDFValidationResult = {
                isValid: false,
                errors: [],
                warnings: [],
                pageCount: 0,
                hasFormFields: false,
                hasSignatures: false,
                isEncrypted: false,
                version: '',
                fileSize: buffer.length,
                structureValidation: {
                    isValid: false,
                    errors: [],
                    warnings: [],
                    pdfVersion: '',
                    crossReferenceValid: false,
                    trailerValid: false,
                    objectsValid: false,
                },
                signatureValidation: {
                    hasSignatures: false,
                    allSignaturesValid: false,
                    signatures: [],
                    errors: [],
                    warnings: [],
                },
                certificateValidation: {
                    allCertificatesValid: false,
                    certificates: [],
                    errors: [],
                    warnings: [],
                },
                timestampValidation: {
                    hasTimestamps: false,
                    allTimestampsValid: false,
                    timestamps: [],
                    errors: [],
                    warnings: [],
                },
                processingTime: 0,
            };

            // 1. Validate PDF structure
            const structureResult = await this.validatePDFStructure(buffer);
            result.structureValidation = structureResult;
            result.errors.push(...structureResult.errors);
            result.warnings.push(...structureResult.warnings);

            // Continue validation even if structure has issues (unless it's completely invalid)
            if (structureResult.errors.length > 0 && structureResult.errors.some(e => e.includes('Invalid PDF header'))) {
                result.isValid = false;
                result.processingTime = Date.now() - startTime;
                return result;
            }

            // Load PDF document for further validation
            let document: PDFDocument;
            try {
                document = await PDFDocument.load(buffer, {
                    ignoreEncryption: false,
                    parseSpeed: 1,
                    throwOnInvalidObject: false,
                });

                result.pageCount = document.getPageCount();
                result.version = structureResult.pdfVersion;

                // Check for form fields
                try {
                    const form = document.getForm();
                    const fields = form.getFields();
                    result.hasFormFields = fields.length > 0;
                } catch {
                    result.hasFormFields = false;
                }
            } catch (error) {
                if (error instanceof Error && error.message.includes('encrypted')) {
                    result.isEncrypted = true;
                    result.errors.push('PDF is encrypted');
                } else {
                    result.errors.push(`Failed to load PDF for validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
                result.isValid = false;
                result.processingTime = Date.now() - startTime;
                return result;
            }

            // 2. Extract and validate signatures
            const signatureResult = await this.validateSignatures(document);
            result.signatureValidation = signatureResult;
            result.hasSignatures = signatureResult.hasSignatures;

            if (signatureResult.hasSignatures) {
                result.isValid = result.isValid && signatureResult.allSignaturesValid;
                result.errors.push(...signatureResult.errors);
                result.warnings.push(...signatureResult.warnings);
            }

            // 3. Validate certificates from signatures
            if (signatureResult.signatures.length > 0) {
                const certificateResult = await this.validateCertificatesFromSignatures(signatureResult.signatures);
                result.certificateValidation = certificateResult;
                result.isValid = result.isValid && certificateResult.allCertificatesValid;
                result.errors.push(...certificateResult.errors);
                result.warnings.push(...certificateResult.warnings);
            }

            // 4. Validate timestamps from signatures
            const timestampResult = await this.validateTimestampsFromSignatures(signatureResult.signatures);
            result.timestampValidation = timestampResult;

            if (timestampResult.hasTimestamps) {
                result.isValid = result.isValid && timestampResult.allTimestampsValid;
                result.errors.push(...timestampResult.errors);
                result.warnings.push(...timestampResult.warnings);
            }

            // Final validation result - if we got here and no critical errors, it's valid
            if (result.errors.length === 0) {
                result.isValid = true;
            }

            result.processingTime = Date.now() - startTime;
            return result;

        } catch (error) {
            throw new PDFValidationError(
                `Comprehensive PDF validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Validate PDF structure and integrity
     */
    private async validatePDFStructure(buffer: Buffer): Promise<PDFStructureValidationResult> {
        const result: PDFStructureValidationResult = {
            isValid: false,
            errors: [],
            warnings: [],
            pdfVersion: '',
            crossReferenceValid: false,
            trailerValid: false,
            objectsValid: false,
        };

        try {
            // Check PDF header
            const headerResult = this.validatePDFHeader(buffer);
            result.pdfVersion = headerResult.version;
            if (!headerResult.isValid) {
                result.errors.push(...headerResult.errors);
                return result;
            }

            // Check PDF trailer
            const trailerResult = this.validatePDFTrailer(buffer);
            result.trailerValid = trailerResult.isValid;
            if (!trailerResult.isValid) {
                result.errors.push(...trailerResult.errors);
                result.warnings.push(...trailerResult.warnings);
            }

            // Check cross-reference table
            const xrefResult = this.validateCrossReferenceTable(buffer);
            result.crossReferenceValid = xrefResult.isValid;
            if (!xrefResult.isValid) {
                result.errors.push(...xrefResult.errors);
                result.warnings.push(...xrefResult.warnings);
            }

            // Validate PDF objects structure
            const objectsResult = this.validatePDFObjects(buffer);
            result.objectsValid = objectsResult.isValid;
            if (!objectsResult.isValid) {
                result.errors.push(...objectsResult.errors);
                result.warnings.push(...objectsResult.warnings);
            }

            // Overall structure validation
            result.isValid = headerResult.isValid &&
                result.trailerValid &&
                result.crossReferenceValid &&
                result.objectsValid;

            return result;

        } catch (error) {
            result.errors.push(`PDF structure validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }

    /**
     * Validate PDF header
     */
    private validatePDFHeader(buffer: Buffer): { isValid: boolean; version: string; errors: string[] } {
        const result = { isValid: false, version: '', errors: [] as string[] };

        try {
            // Check minimum file size
            if (buffer.length < 8) {
                result.errors.push('File too small to be a valid PDF');
                return result;
            }

            // Check PDF signature
            const header = buffer.subarray(0, 8).toString('ascii');
            const pdfSignatureRegex = /^%PDF-(\d+\.\d+)/;
            const match = header.match(pdfSignatureRegex);

            if (!match) {
                result.errors.push('Invalid PDF header signature');
                return result;
            }

            result.version = match[1];
            result.isValid = true;

            // Validate PDF version
            const version = parseFloat(result.version);
            if (version < 1.0 || version > 2.0) {
                result.errors.push(`Unsupported PDF version: ${result.version}`);
                result.isValid = false;
            }

            return result;

        } catch (error) {
            result.errors.push(`Header validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }

    /**
     * Validate PDF trailer
     */
    private validatePDFTrailer(buffer: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
        const result = { isValid: false, errors: [] as string[], warnings: [] as string[] };

        try {
            // Look for startxref (required)
            const content = buffer.toString('ascii');
            const startxrefIndex = content.lastIndexOf('startxref');
            if (startxrefIndex === -1) {
                result.errors.push('startxref not found');
                return result;
            }

            // Look for EOF marker (required)
            const eofIndex = content.lastIndexOf('%%EOF');
            if (eofIndex === -1) {
                result.errors.push('EOF marker not found');
                return result;
            }

            // Look for trailer keyword (may not be present in newer PDFs with cross-reference streams)
            const trailerIndex = content.lastIndexOf('trailer');
            if (trailerIndex === -1) {
                result.warnings.push('Traditional trailer not found (may use cross-reference streams)');
            } else {
                // Validate trailer structure order if present
                if (trailerIndex > startxrefIndex) {
                    result.warnings.push('Trailer appears after startxref');
                }
            }

            result.isValid = true;
            return result;

        } catch (error) {
            result.errors.push(`Trailer validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }

    /**
     * Validate cross-reference table
     */
    private validateCrossReferenceTable(buffer: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
        const result = { isValid: false, errors: [] as string[], warnings: [] as string[] };

        try {
            const content = buffer.toString('ascii');

            // Look for xref table
            const xrefIndex = content.indexOf('xref');
            if (xrefIndex === -1) {
                result.warnings.push('Traditional xref table not found (may use cross-reference streams)');
                result.isValid = true; // Cross-reference streams are valid in newer PDFs
                return result;
            }

            // Basic xref structure validation
            const xrefSection = content.substring(xrefIndex, xrefIndex + 1000); // Check first 1000 chars
            const lines = xrefSection.split('\n');

            if (lines.length < 2) {
                result.errors.push('Invalid xref table structure');
                return result;
            }

            // Validate xref entries format (simplified)
            let validEntries = 0;
            for (let i = 2; i < Math.min(lines.length, 10); i++) {
                const line = lines[i].trim();
                if (line === 'trailer') break;

                // Basic xref entry format: "nnnnnnnnnn ggggg n/f"
                if (/^\d{10} \d{5} [nf]$/.test(line)) {
                    validEntries++;
                }
            }

            if (validEntries === 0) {
                result.warnings.push('No valid xref entries found in sample');
            }

            result.isValid = true;
            return result;

        } catch (error) {
            result.errors.push(`Cross-reference validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }

    /**
     * Validate PDF objects structure
     */
    private validatePDFObjects(buffer: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
        const result = { isValid: false, errors: [] as string[], warnings: [] as string[] };

        try {
            const content = buffer.toString('ascii');

            // Count objects
            const objMatches = content.match(/\d+ \d+ obj/g);
            const endobjMatches = content.match(/endobj/g);

            if (!objMatches || !endobjMatches) {
                result.errors.push('No PDF objects found');
                return result;
            }

            if (objMatches.length !== endobjMatches.length) {
                result.errors.push(`Mismatched object count: ${objMatches.length} obj vs ${endobjMatches.length} endobj`);
                return result;
            }

            // Look for required objects (more flexible matching for modern PDFs)
            const hasRoot = content.includes('/Type') && (content.includes('/Catalog') || content.includes('Catalog'));
            if (!hasRoot) {
                result.warnings.push('Root catalog object not clearly identified (may be compressed)');
            }

            const hasPages = content.includes('/Type') && (content.includes('/Pages') || content.includes('Pages'));
            if (!hasPages) {
                result.warnings.push('Pages object not clearly identified (may be compressed)');
            }

            result.isValid = true;
            return result;

        } catch (error) {
            result.errors.push(`Object validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return result;
        }
    }

    /**
     * Validate all signatures in the PDF
     */
    private async validateSignatures(document: PDFDocument): Promise<PDFSignatureValidationResult> {
        const result: PDFSignatureValidationResult = {
            hasSignatures: false,
            allSignaturesValid: true,
            signatures: [],
            errors: [],
            warnings: [],
        };

        try {
            // Extract signatures from the PDF
            const extractedSignatures = await this.digitalSignatureEngine.extractSignatures(document);

            if (extractedSignatures.length === 0) {
                return result; // No signatures to validate
            }

            result.hasSignatures = true;

            // Validate each signature
            for (const extractedSig of extractedSignatures) {
                try {
                    const validationResult = await this.digitalSignatureEngine.validateSignature(extractedSig.signature);

                    result.signatures.push({
                        fieldName: extractedSig.fieldName,
                        validationResult,
                        extractedSignature: extractedSig,
                    });

                    if (!validationResult.isValid) {
                        result.allSignaturesValid = false;
                        result.errors.push(`Signature '${extractedSig.fieldName}' is invalid: ${validationResult.errors.join(', ')}`);
                    }

                    result.warnings.push(...validationResult.warnings.map(w => `Signature '${extractedSig.fieldName}': ${w}`));

                } catch (error) {
                    result.allSignaturesValid = false;
                    result.errors.push(`Failed to validate signature '${extractedSig.fieldName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            }

            return result;

        } catch (error) {
            result.errors.push(`Signature validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.allSignaturesValid = false;
            return result;
        }
    }

    /**
     * Validate certificates from signatures
     */
    private async validateCertificatesFromSignatures(signatures: PDFSignatureValidation[]): Promise<PDFCertificateValidationResult> {
        const result: PDFCertificateValidationResult = {
            allCertificatesValid: true,
            certificates: [],
            errors: [],
            warnings: [],
        };

        try {
            const processedCertificates = new Set<string>();

            for (const sigValidation of signatures) {
                const signature = sigValidation.extractedSignature.signature;

                // Validate each certificate in the signature
                for (const certificate of signature.certificates) {
                    // Skip if already processed
                    if (processedCertificates.has(certificate.fingerprint)) {
                        continue;
                    }
                    processedCertificates.add(certificate.fingerprint);

                    try {
                        const certValidationResult = await this.certificateManager.validateCertificateChain([certificate]);

                        result.certificates.push({
                            certificate,
                            validationResult: certValidationResult,
                        });

                        if (!certValidationResult.isValid) {
                            result.allCertificatesValid = false;
                            result.errors.push(`Certificate ${certificate.subject.commonName || certificate.fingerprint} is invalid: ${certValidationResult.errors.join(', ')}`);
                        }

                        result.warnings.push(...certValidationResult.warnings.map(w => `Certificate ${certificate.subject.commonName || certificate.fingerprint}: ${w}`));

                    } catch (error) {
                        result.allCertificatesValid = false;
                        result.errors.push(`Failed to validate certificate ${certificate.subject.commonName || certificate.fingerprint}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }

            return result;

        } catch (error) {
            result.errors.push(`Certificate validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.allCertificatesValid = false;
            return result;
        }
    }

    /**
     * Validate timestamps from signatures
     */
    private async validateTimestampsFromSignatures(signatures: PDFSignatureValidation[]): Promise<PDFTimestampValidationResult> {
        const result: PDFTimestampValidationResult = {
            hasTimestamps: false,
            allTimestampsValid: true,
            timestamps: [],
            errors: [],
            warnings: [],
        };

        try {
            for (const sigValidation of signatures) {
                const signature = sigValidation.extractedSignature.signature;

                if (signature.timestamp) {
                    result.hasTimestamps = true;

                    try {
                        // Extract original document data for timestamp validation
                        const documentData = signature.content; // This should be the original document data

                        const timestampValidationResult = await this.timestampManager.verifyTimestamp(
                            signature.timestamp,
                            documentData
                        );

                        result.timestamps.push({
                            signatureFieldName: sigValidation.fieldName,
                            timestamp: signature.timestamp,
                            validationResult: timestampValidationResult,
                        });

                        if (!timestampValidationResult.isValid) {
                            result.allTimestampsValid = false;
                            result.errors.push(`Timestamp for signature '${sigValidation.fieldName}' is invalid: ${timestampValidationResult.errors.join(', ')}`);
                        }

                        result.warnings.push(...timestampValidationResult.warnings.map(w => `Timestamp for '${sigValidation.fieldName}': ${w}`));

                    } catch (error) {
                        result.allTimestampsValid = false;
                        result.errors.push(`Failed to validate timestamp for signature '${sigValidation.fieldName}': ${error instanceof Error ? error.message : 'Unknown error'}`);
                    }
                }
            }

            return result;

        } catch (error) {
            result.errors.push(`Timestamp validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            result.allTimestampsValid = false;
            return result;
        }
    }
}

// Extended validation result types

export interface PDFValidationResult extends ValidationResult {
    structureValidation: PDFStructureValidationResult;
    signatureValidation: PDFSignatureValidationResult;
    certificateValidation: PDFCertificateValidationResult;
    timestampValidation: PDFTimestampValidationResult;
    processingTime: number;
}

export interface PDFStructureValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    pdfVersion: string;
    crossReferenceValid: boolean;
    trailerValid: boolean;
    objectsValid: boolean;
}

export interface PDFSignatureValidationResult {
    hasSignatures: boolean;
    allSignaturesValid: boolean;
    signatures: PDFSignatureValidation[];
    errors: string[];
    warnings: string[];
}

export interface PDFSignatureValidation {
    fieldName: string;
    validationResult: SignatureValidationResult;
    extractedSignature: ExtractedSignature;
}

export interface PDFCertificateValidationResult {
    allCertificatesValid: boolean;
    certificates: PDFCertificateValidation[];
    errors: string[];
    warnings: string[];
}

export interface PDFCertificateValidation {
    certificate: X509Certificate;
    validationResult: CertificateValidationResult;
}

export interface PDFTimestampValidationResult {
    hasTimestamps: boolean;
    allTimestampsValid: boolean;
    timestamps: PDFTimestampValidation[];
    errors: string[];
    warnings: string[];
}

export interface PDFTimestampValidation {
    signatureFieldName: string;
    timestamp: Timestamp;
    validationResult: TimestampVerificationResult;
}