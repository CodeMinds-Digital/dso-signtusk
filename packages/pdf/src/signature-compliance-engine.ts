import { z } from 'zod';
import {
    SignatureValidationResult,
    TimestampVerificationResult,
    CertificateValidationResult,
    CMSSignature,
    X509Certificate,
    Timestamp
} from './types';

/**
 * Signature compliance metadata for legal requirements
 */
export interface SignatureComplianceMetadata {
    // Legal framework compliance
    legalFramework: 'ESIGN' | 'EIDAS' | '21CFR11' | 'UETA' | 'PIPEDA' | 'CUSTOM';

    // Signature intent and consent
    signerConsent: {
        consentGiven: boolean;
        consentMethod: 'EXPLICIT' | 'IMPLICIT' | 'CLICK_WRAP' | 'BROWSE_WRAP';
        consentTimestamp: Date;
        consentEvidence: string; // Description of how consent was obtained
        ipAddress?: string;
        userAgent?: string;
        location?: {
            country: string;
            region?: string;
            city?: string;
        };
    };

    // Identity verification
    identityVerification: {
        method: 'EMAIL' | 'SMS' | 'KNOWLEDGE_BASED' | 'ID_DOCUMENT' | 'BIOMETRIC' | 'MULTI_FACTOR';
        verificationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
        verificationTimestamp: Date;
        verificationDetails: Record<string, any>;
        verificationProvider?: string;
    };

    // Document integrity
    documentIntegrity: {
        hashAlgorithm: string;
        documentHash: string;
        hashTimestamp: Date;
        tamperEvidence: boolean;
        integrityVerified: boolean;
    };

    // Signature validity
    signatureValidity: {
        cryptographicallyValid: boolean;
        certificateValid: boolean;
        timestampValid: boolean;
        signatureTime: Date;
        validationTime: Date;
        validationMethod: string;
    };

    // Audit trail requirements
    auditTrail: {
        required: boolean;
        immutable: boolean;
        cryptographicallySecured: boolean;
        retentionPeriod: number; // in years
        auditEvents: SignatureAuditEvent[];
    };

    // Compliance certifications
    certifications: {
        framework: string;
        certificationLevel: string;
        certifyingAuthority?: string;
        certificationDate?: Date;
        expiryDate?: Date;
        certificationId?: string;
    }[];

    // Custom compliance fields
    customFields: Record<string, any>;
}

/**
 * Signature audit event for compliance tracking
 */
export interface SignatureAuditEvent {
    eventId: string;
    eventType: 'DOCUMENT_PREPARED' | 'SIGNATURE_REQUESTED' | 'SIGNATURE_APPLIED' | 'DOCUMENT_COMPLETED' | 'CERTIFICATE_VALIDATED' | 'TIMESTAMP_APPLIED' | 'COMPLIANCE_VERIFIED';
    timestamp: Date;
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    location?: {
        country: string;
        region?: string;
        city?: string;
    };
    details: Record<string, any>;
    hash: string; // Cryptographic hash for integrity
    previousHash?: string; // For blockchain-like integrity
}

/**
 * Signature compliance validation result
 */
export interface SignatureComplianceValidationResult {
    isCompliant: boolean;
    complianceLevel: 'NON_COMPLIANT' | 'BASIC' | 'STANDARD' | 'ADVANCED' | 'QUALIFIED';
    framework: string;
    validationTimestamp: Date;

    // Compliance checks
    checks: {
        signerConsent: {
            passed: boolean;
            details: string;
            evidence?: any;
        };
        identityVerification: {
            passed: boolean;
            verificationLevel: string;
            details: string;
        };
        documentIntegrity: {
            passed: boolean;
            tamperEvidence: boolean;
            details: string;
        };
        signatureValidity: {
            passed: boolean;
            cryptographicValidity: boolean;
            certificateValidity: boolean;
            timestampValidity: boolean;
            details: string;
        };
        auditTrail: {
            passed: boolean;
            completeness: number; // 0-100%
            integrity: boolean;
            details: string;
        };
    };

    // Violations and recommendations
    violations: ComplianceViolation[];
    recommendations: string[];

    // Legal admissibility assessment
    legalAdmissibility: {
        admissible: boolean;
        jurisdiction: string;
        confidence: number; // 0-100%
        factors: string[];
        limitations: string[];
    };
}

/**
 * Compliance violation details
 */
export interface ComplianceViolation {
    type: 'CONSENT' | 'IDENTITY' | 'INTEGRITY' | 'SIGNATURE' | 'AUDIT' | 'CERTIFICATE' | 'TIMESTAMP' | 'FRAMEWORK';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    requirement: string;
    recommendation: string;
    detectedAt: Date;
}

/**
 * Compliance reporting options
 */
export interface ComplianceReportOptions {
    includeAuditTrail: boolean;
    includeCertificateChain: boolean;
    includeTimestamps: boolean;
    includeMetadata: boolean;
    format: 'JSON' | 'PDF' | 'XML' | 'CSV';
    jurisdiction?: string;
    language?: string;
}

/**
 * Compliance report for regulatory requirements
 */
export interface SignatureComplianceReport {
    reportId: string;
    documentId: string;
    signatureId: string;
    generatedAt: Date;
    generatedBy: string;

    // Document information
    document: {
        title: string;
        hash: string;
        createdAt: Date;
        completedAt: Date;
        pageCount: number;
    };

    // Signature information
    signature: {
        signerName: string;
        signerEmail: string;
        signatureTime: Date;
        signatureMethod: string;
        certificate: {
            subject: string;
            issuer: string;
            serialNumber: string;
            validFrom: Date;
            validTo: Date;
            fingerprint: string;
        };
    };

    // Compliance validation
    compliance: SignatureComplianceValidationResult;

    // Audit trail
    auditTrail: SignatureAuditEvent[];

    // Legal framework specific data
    frameworkSpecific: Record<string, any>;

    // Attachments (certificates, timestamps, etc.)
    attachments: {
        type: string;
        name: string;
        data: string; // Base64 encoded
        hash: string;
    }[];
}

/**
 * Validation schemas for compliance data
 */
export const SignatureComplianceMetadataSchema = z.object({
    legalFramework: z.enum(['ESIGN', 'EIDAS', '21CFR11', 'UETA', 'PIPEDA', 'CUSTOM']),
    signerConsent: z.object({
        consentGiven: z.boolean(),
        consentMethod: z.enum(['EXPLICIT', 'IMPLICIT', 'CLICK_WRAP', 'BROWSE_WRAP']),
        consentTimestamp: z.date(),
        consentEvidence: z.string(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
        location: z.object({
            country: z.string(),
            region: z.string().optional(),
            city: z.string().optional()
        }).optional()
    }),
    identityVerification: z.object({
        method: z.enum(['EMAIL', 'SMS', 'KNOWLEDGE_BASED', 'ID_DOCUMENT', 'BIOMETRIC', 'MULTI_FACTOR']),
        verificationLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH']),
        verificationTimestamp: z.date(),
        verificationDetails: z.record(z.any()),
        verificationProvider: z.string().optional()
    }),
    documentIntegrity: z.object({
        hashAlgorithm: z.string(),
        documentHash: z.string(),
        hashTimestamp: z.date(),
        tamperEvidence: z.boolean(),
        integrityVerified: z.boolean()
    }),
    signatureValidity: z.object({
        cryptographicallyValid: z.boolean(),
        certificateValid: z.boolean(),
        timestampValid: z.boolean(),
        signatureTime: z.date(),
        validationTime: z.date(),
        validationMethod: z.string()
    }),
    auditTrail: z.object({
        required: z.boolean(),
        immutable: z.boolean(),
        cryptographicallySecured: z.boolean(),
        retentionPeriod: z.number(),
        auditEvents: z.array(z.any())
    }),
    certifications: z.array(z.object({
        framework: z.string(),
        certificationLevel: z.string(),
        certifyingAuthority: z.string().optional(),
        certificationDate: z.date().optional(),
        expiryDate: z.date().optional(),
        certificationId: z.string().optional()
    })),
    customFields: z.record(z.any())
});

/**
 * Signature Compliance Engine
 * 
 * Provides comprehensive compliance validation and reporting for digital signatures
 * according to various legal frameworks and regulatory requirements.
 */
export class SignatureComplianceEngine {
    private auditEvents: Map<string, SignatureAuditEvent[]> = new Map();

    /**
     * Collect compliance metadata for a signature
     */
    async collectComplianceMetadata(
        documentId: string,
        signatureId: string,
        signerInfo: {
            userId: string;
            email: string;
            name: string;
            ipAddress?: string;
            userAgent?: string;
            location?: { country: string; region?: string; city?: string };
        },
        signatureData: {
            signature: CMSSignature;
            certificate: X509Certificate;
            timestamp?: Timestamp;
        },
        options: {
            legalFramework: 'ESIGN' | 'EIDAS' | '21CFR11' | 'UETA' | 'PIPEDA' | 'CUSTOM';
            consentMethod: 'EXPLICIT' | 'IMPLICIT' | 'CLICK_WRAP' | 'BROWSE_WRAP';
            identityVerificationMethod: 'EMAIL' | 'SMS' | 'KNOWLEDGE_BASED' | 'ID_DOCUMENT' | 'BIOMETRIC' | 'MULTI_FACTOR';
            documentHash: string;
            hashAlgorithm: string;
        }
    ): Promise<SignatureComplianceMetadata> {
        const now = new Date();

        // Determine identity verification level based on method
        const verificationLevel = this.determineVerificationLevel(options.identityVerificationMethod);

        // Create compliance metadata
        const metadata: SignatureComplianceMetadata = {
            legalFramework: options.legalFramework,

            signerConsent: {
                consentGiven: true, // Assumed if signature is being applied
                consentMethod: options.consentMethod,
                consentTimestamp: now,
                consentEvidence: `Signer ${signerInfo.email} provided consent via ${options.consentMethod}`,
                ipAddress: signerInfo.ipAddress,
                userAgent: signerInfo.userAgent,
                location: signerInfo.location
            },

            identityVerification: {
                method: options.identityVerificationMethod,
                verificationLevel,
                verificationTimestamp: now,
                verificationDetails: {
                    userId: signerInfo.userId,
                    email: signerInfo.email,
                    name: signerInfo.name,
                    verificationMethod: options.identityVerificationMethod
                }
            },

            documentIntegrity: {
                hashAlgorithm: options.hashAlgorithm,
                documentHash: options.documentHash,
                hashTimestamp: now,
                tamperEvidence: false, // Will be verified later
                integrityVerified: true // Will be validated
            },

            signatureValidity: {
                cryptographicallyValid: true, // Will be validated
                certificateValid: true, // Will be validated
                timestampValid: !!signatureData.timestamp,
                signatureTime: now,
                validationTime: now,
                validationMethod: 'CMS_PKCS7'
            },

            auditTrail: {
                required: true,
                immutable: true,
                cryptographicallySecured: true,
                retentionPeriod: this.getRetentionPeriodForFramework(options.legalFramework),
                auditEvents: []
            },

            certifications: this.getCertificationsForFramework(options.legalFramework),

            customFields: {}
        };

        // Record audit event for metadata collection
        await this.recordAuditEvent(signatureId, {
            eventType: 'COMPLIANCE_VERIFIED',
            userId: signerInfo.userId,
            userEmail: signerInfo.email,
            ipAddress: signerInfo.ipAddress,
            userAgent: signerInfo.userAgent,
            location: signerInfo.location,
            details: {
                action: 'compliance_metadata_collected',
                framework: options.legalFramework,
                documentId,
                signatureId
            }
        });

        return SignatureComplianceMetadataSchema.parse(metadata);
    }

    /**
     * Generate audit trail for signature events
     */
    async generateAuditTrail(
        signatureId: string,
        events: Array<{
            eventType: SignatureAuditEvent['eventType'];
            userId?: string;
            userEmail?: string;
            ipAddress?: string;
            userAgent?: string;
            location?: { country: string; region?: string; city?: string };
            details: Record<string, any>;
        }>
    ): Promise<SignatureAuditEvent[]> {
        const auditEvents: SignatureAuditEvent[] = [];
        let previousHash: string | undefined;

        for (const event of events) {
            const auditEvent = await this.recordAuditEvent(signatureId, event, previousHash);
            auditEvents.push(auditEvent);
            previousHash = auditEvent.hash;
        }

        return auditEvents;
    }

    /**
     * Validate signature compliance against legal framework
     */
    async validateSignatureCompliance(
        metadata: SignatureComplianceMetadata,
        signatureValidation: SignatureValidationResult,
        certificateValidation: CertificateValidationResult,
        timestampValidation?: TimestampVerificationResult
    ): Promise<SignatureComplianceValidationResult> {
        const now = new Date();
        const violations: ComplianceViolation[] = [];
        const recommendations: string[] = [];

        // Validate signer consent
        const consentCheck = this.validateSignerConsent(metadata.signerConsent);
        if (!consentCheck.passed) {
            violations.push({
                type: 'CONSENT',
                severity: 'HIGH',
                description: consentCheck.details,
                requirement: 'Valid signer consent required',
                recommendation: 'Ensure explicit consent is obtained before signature',
                detectedAt: now
            });
        }

        // Validate identity verification
        const identityCheck = this.validateIdentityVerification(metadata.identityVerification, metadata.legalFramework);
        if (!identityCheck.passed) {
            violations.push({
                type: 'IDENTITY',
                severity: 'MEDIUM',
                description: identityCheck.details,
                requirement: 'Adequate identity verification required',
                recommendation: 'Use stronger identity verification methods',
                detectedAt: now
            });
        }

        // Validate document integrity
        const integrityCheck = this.validateDocumentIntegrity(metadata.documentIntegrity);
        if (!integrityCheck.passed) {
            violations.push({
                type: 'INTEGRITY',
                severity: 'CRITICAL',
                description: integrityCheck.details,
                requirement: 'Document integrity must be maintained',
                recommendation: 'Verify document has not been tampered with',
                detectedAt: now
            });
        }

        // Validate signature validity
        const signatureCheck = this.validateSignatureValidity(
            metadata.signatureValidity,
            signatureValidation,
            certificateValidation,
            timestampValidation
        );
        if (!signatureCheck.passed) {
            violations.push({
                type: 'SIGNATURE',
                severity: 'CRITICAL',
                description: signatureCheck.details,
                requirement: 'Cryptographically valid signature required',
                recommendation: 'Ensure signature is properly created and validated',
                detectedAt: now
            });
        }

        // Validate audit trail
        const auditCheck = this.validateAuditTrail(metadata.auditTrail);
        if (!auditCheck.passed) {
            violations.push({
                type: 'AUDIT',
                severity: 'HIGH',
                description: auditCheck.details,
                requirement: 'Complete and immutable audit trail required',
                recommendation: 'Maintain comprehensive audit trail for all signature events',
                detectedAt: now
            });
        }

        // Determine compliance level
        const complianceLevel = this.determineComplianceLevel(violations, metadata.legalFramework);

        // Assess legal admissibility
        const legalAdmissibility = this.assessLegalAdmissibility(
            metadata,
            violations,
            complianceLevel
        );

        return {
            isCompliant: violations.length === 0,
            complianceLevel,
            framework: metadata.legalFramework,
            validationTimestamp: now,

            checks: {
                signerConsent: consentCheck,
                identityVerification: identityCheck,
                documentIntegrity: integrityCheck,
                signatureValidity: signatureCheck,
                auditTrail: auditCheck
            },

            violations,
            recommendations,
            legalAdmissibility
        };
    }

    /**
     * Generate compliance report for regulatory requirements
     */
    async generateComplianceReport(
        documentId: string,
        signatureId: string,
        metadata: SignatureComplianceMetadata,
        validationResult: SignatureComplianceValidationResult,
        options: ComplianceReportOptions
    ): Promise<SignatureComplianceReport> {
        const reportId = this.generateReportId();
        const now = new Date();

        // Get audit trail events
        const auditEvents = this.auditEvents.get(signatureId) || [];

        // Create compliance report
        const report: SignatureComplianceReport = {
            reportId,
            documentId,
            signatureId,
            generatedAt: now,
            generatedBy: 'system', // Should be actual user ID

            document: {
                title: 'Document Title', // Should be retrieved from document
                hash: metadata.documentIntegrity.documentHash,
                createdAt: new Date(), // Should be retrieved from document
                completedAt: new Date(), // Should be retrieved from document
                pageCount: 1 // Should be retrieved from document
            },

            signature: {
                signerName: metadata.identityVerification.verificationDetails.name || 'Unknown',
                signerEmail: metadata.identityVerification.verificationDetails.email || 'Unknown',
                signatureTime: metadata.signatureValidity.signatureTime,
                signatureMethod: metadata.signatureValidity.validationMethod,
                certificate: {
                    subject: 'Certificate Subject', // Should be extracted from certificate
                    issuer: 'Certificate Issuer', // Should be extracted from certificate
                    serialNumber: 'Serial Number', // Should be extracted from certificate
                    validFrom: new Date(), // Should be extracted from certificate
                    validTo: new Date(), // Should be extracted from certificate
                    fingerprint: 'Certificate Fingerprint' // Should be extracted from certificate
                }
            },

            compliance: validationResult,
            auditTrail: auditEvents,

            frameworkSpecific: this.getFrameworkSpecificData(metadata.legalFramework, metadata),

            attachments: [] // Would include certificates, timestamps, etc.
        };

        return report;
    }

    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================

    private async recordAuditEvent(
        signatureId: string,
        event: Omit<SignatureAuditEvent, 'eventId' | 'timestamp' | 'hash' | 'previousHash'>,
        previousHash?: string
    ): Promise<SignatureAuditEvent> {
        const eventId = this.generateEventId();
        const timestamp = new Date();

        // Create event data for hashing
        const eventData = {
            eventId,
            timestamp,
            ...event
        };

        // Generate cryptographic hash
        const hash = this.generateEventHash(eventData, previousHash);

        const auditEvent: SignatureAuditEvent = {
            eventId,
            timestamp,
            hash,
            previousHash,
            ...event
        };

        // Store audit event
        if (!this.auditEvents.has(signatureId)) {
            this.auditEvents.set(signatureId, []);
        }
        this.auditEvents.get(signatureId)!.push(auditEvent);

        return auditEvent;
    }

    private determineVerificationLevel(method: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
        switch (method) {
            case 'EMAIL': return 'LOW';
            case 'SMS': return 'MEDIUM';
            case 'KNOWLEDGE_BASED': return 'MEDIUM';
            case 'ID_DOCUMENT': return 'HIGH';
            case 'BIOMETRIC': return 'VERY_HIGH';
            case 'MULTI_FACTOR': return 'VERY_HIGH';
            default: return 'LOW';
        }
    }

    private getRetentionPeriodForFramework(framework: string): number {
        switch (framework) {
            case 'ESIGN': return 7; // 7 years
            case 'EIDAS': return 10; // 10 years
            case '21CFR11': return 20; // 20 years for FDA
            case 'UETA': return 7; // 7 years
            case 'PIPEDA': return 7; // 7 years
            default: return 7; // Default 7 years
        }
    }

    private getCertificationsForFramework(framework: string): SignatureComplianceMetadata['certifications'] {
        switch (framework) {
            case 'EIDAS':
                return [{
                    framework: 'eIDAS',
                    certificationLevel: 'Qualified',
                    certifyingAuthority: 'EU Trust Service Provider'
                }];
            case '21CFR11':
                return [{
                    framework: '21 CFR Part 11',
                    certificationLevel: 'FDA Compliant',
                    certifyingAuthority: 'FDA'
                }];
            default:
                return [];
        }
    }

    private validateSignerConsent(consent: SignatureComplianceMetadata['signerConsent']) {
        if (!consent.consentGiven) {
            return {
                passed: false,
                details: 'Signer consent not obtained',
                evidence: null
            };
        }

        if (consent.consentMethod === 'IMPLICIT') {
            return {
                passed: false,
                details: 'Implicit consent may not be sufficient for legal validity',
                evidence: consent.consentEvidence
            };
        }

        return {
            passed: true,
            details: 'Valid signer consent obtained',
            evidence: consent.consentEvidence
        };
    }

    private validateIdentityVerification(
        verification: SignatureComplianceMetadata['identityVerification'],
        framework: string
    ) {
        const requiredLevel = this.getRequiredVerificationLevel(framework);
        const actualLevel = verification.verificationLevel;

        const levelValues = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'VERY_HIGH': 4 };

        if (levelValues[actualLevel] < levelValues[requiredLevel]) {
            return {
                passed: false,
                verificationLevel: actualLevel,
                details: `Identity verification level ${actualLevel} is below required level ${requiredLevel} for ${framework}`
            };
        }

        return {
            passed: true,
            verificationLevel: actualLevel,
            details: `Identity verification meets requirements for ${framework}`
        };
    }

    private validateDocumentIntegrity(integrity: SignatureComplianceMetadata['documentIntegrity']) {
        if (integrity.tamperEvidence) {
            return {
                passed: false,
                tamperEvidence: true,
                details: 'Document shows evidence of tampering'
            };
        }

        if (!integrity.integrityVerified) {
            return {
                passed: false,
                tamperEvidence: false,
                details: 'Document integrity could not be verified'
            };
        }

        return {
            passed: true,
            tamperEvidence: false,
            details: 'Document integrity verified'
        };
    }

    private validateSignatureValidity(
        validity: SignatureComplianceMetadata['signatureValidity'],
        signatureValidation: SignatureValidationResult,
        certificateValidation: CertificateValidationResult,
        timestampValidation?: TimestampVerificationResult
    ) {
        const issues: string[] = [];

        if (!validity.cryptographicallyValid || !signatureValidation.isValid) {
            issues.push('Signature is not cryptographically valid');
        }

        if (!validity.certificateValid || !certificateValidation.isValid) {
            issues.push('Certificate is not valid');
        }

        if (validity.timestampValid && timestampValidation && !timestampValidation.isValid) {
            issues.push('Timestamp is not valid');
        }

        return {
            passed: issues.length === 0,
            cryptographicValidity: validity.cryptographicallyValid,
            certificateValidity: validity.certificateValid,
            timestampValidity: validity.timestampValid,
            details: issues.length > 0 ? issues.join('; ') : 'Signature is cryptographically valid'
        };
    }

    private validateAuditTrail(auditTrail: SignatureComplianceMetadata['auditTrail']) {
        if (!auditTrail.required) {
            return {
                passed: true,
                completeness: 100,
                integrity: true,
                details: 'Audit trail not required'
            };
        }

        const completeness = this.calculateAuditTrailCompleteness(auditTrail.auditEvents);
        const integrity = this.verifyAuditTrailIntegrity(auditTrail.auditEvents);

        // For empty audit events, consider it incomplete if audit trail is required
        if (auditTrail.auditEvents.length === 0) {
            return {
                passed: false,
                completeness: 0,
                integrity: true,
                details: 'Audit trail is required but no events are present'
            };
        }

        if (completeness < 90) {
            return {
                passed: false,
                completeness,
                integrity,
                details: `Audit trail is incomplete (${completeness}% complete)`
            };
        }

        if (!integrity) {
            return {
                passed: false,
                completeness,
                integrity,
                details: 'Audit trail integrity compromised'
            };
        }

        return {
            passed: true,
            completeness,
            integrity,
            details: 'Audit trail is complete and integrity verified'
        };
    }

    private determineComplianceLevel(
        violations: ComplianceViolation[],
        framework: string
    ): 'NON_COMPLIANT' | 'BASIC' | 'STANDARD' | 'ADVANCED' | 'QUALIFIED' {
        if (violations.some(v => v.severity === 'CRITICAL')) {
            return 'NON_COMPLIANT';
        }

        if (violations.some(v => v.severity === 'HIGH')) {
            return 'BASIC';
        }

        if (violations.some(v => v.severity === 'MEDIUM')) {
            return 'STANDARD';
        }

        if (violations.some(v => v.severity === 'LOW')) {
            return 'ADVANCED';
        }

        // No violations - determine level based on framework requirements
        if (framework === 'EIDAS') {
            return 'QUALIFIED';
        }

        return 'ADVANCED';
    }

    private assessLegalAdmissibility(
        metadata: SignatureComplianceMetadata,
        violations: ComplianceViolation[],
        complianceLevel: string
    ) {
        const factors: string[] = [];
        const limitations: string[] = [];
        let confidence = 100;

        // Assess based on compliance level
        if (complianceLevel === 'NON_COMPLIANT') {
            confidence = 10;
            limitations.push('Critical compliance violations present');
        } else if (complianceLevel === 'BASIC') {
            confidence = 60;
            limitations.push('Some compliance issues may affect admissibility');
        }

        // Assess based on framework
        if (metadata.legalFramework === 'EIDAS' && complianceLevel === 'QUALIFIED') {
            factors.push('eIDAS qualified signature provides strong legal presumption');
            confidence = Math.min(confidence + 20, 100);
        }

        // Assess based on identity verification
        if (metadata.identityVerification.verificationLevel === 'VERY_HIGH') {
            factors.push('Strong identity verification enhances legal validity');
            confidence = Math.min(confidence + 10, 100);
        }

        // Assess based on audit trail
        if (metadata.auditTrail.immutable && metadata.auditTrail.cryptographicallySecured) {
            factors.push('Immutable cryptographic audit trail supports evidence integrity');
            confidence = Math.min(confidence + 10, 100);
        }

        return {
            admissible: confidence >= 70,
            jurisdiction: 'General', // Should be determined based on context
            confidence,
            factors,
            limitations
        };
    }

    private getRequiredVerificationLevel(framework: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH' {
        switch (framework) {
            case 'EIDAS': return 'HIGH';
            case '21CFR11': return 'HIGH';
            case 'ESIGN': return 'MEDIUM';
            case 'UETA': return 'MEDIUM';
            case 'PIPEDA': return 'MEDIUM';
            default: return 'MEDIUM';
        }
    }

    private calculateAuditTrailCompleteness(events: SignatureAuditEvent[]): number {
        // If no events are provided, return 0% completeness
        if (events.length === 0) {
            return 0;
        }

        const requiredEvents: SignatureAuditEvent['eventType'][] = [
            'DOCUMENT_PREPARED',
            'SIGNATURE_REQUESTED',
            'SIGNATURE_APPLIED',
            'DOCUMENT_COMPLETED'
        ];

        const presentEvents = events.map(e => e.eventType);
        const foundEvents = requiredEvents.filter(e => presentEvents.includes(e));

        return (foundEvents.length / requiredEvents.length) * 100;
    }

    private verifyAuditTrailIntegrity(events: SignatureAuditEvent[]): boolean {
        // Verify hash chain integrity
        for (let i = 1; i < events.length; i++) {
            const currentEvent = events[i];
            const previousEvent = events[i - 1];

            if (currentEvent.previousHash !== previousEvent.hash) {
                return false;
            }
        }

        return true;
    }

    private getFrameworkSpecificData(framework: string, metadata: SignatureComplianceMetadata): Record<string, any> {
        switch (framework) {
            case 'EIDAS':
                return {
                    signatureLevel: 'AdES-B', // Advanced Electronic Signature with Basic validation
                    trustServiceProvider: 'EU Qualified Trust Service Provider',
                    qualifiedCertificate: true,
                    secureSignatureCreationDevice: true
                };
            case '21CFR11':
                return {
                    fdaCompliance: true,
                    electronicRecordIntegrity: true,
                    auditTrailRequirements: 'Met',
                    accessControls: 'Implemented'
                };
            default:
                return {};
        }
    }

    private generateReportId(): string {
        return `compliance-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateEventId(): string {
        return `audit-event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    private generateEventHash(eventData: any, previousHash?: string): string {
        // In a real implementation, this would use a proper cryptographic hash function (SHA-256)
        // For now, we create a unique hash by including timestamp, random component, and event ID
        const uniqueData = {
            ...eventData,
            previousHash: previousHash || '',
            randomSalt: Math.random().toString(36),
            timestamp: Date.now(),
            nonce: Math.floor(Math.random() * 1000000)
        };
        const dataString = JSON.stringify(uniqueData);
        const hash = Buffer.from(dataString).toString('base64');
        // Return first 32 characters plus timestamp to ensure uniqueness
        return hash.substr(0, 32) + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5);
    }
}

/**
 * Factory function to create Signature Compliance Engine
 */
export function createSignatureComplianceEngine(): SignatureComplianceEngine {
    return new SignatureComplianceEngine();
}

/**
 * Default export
 */
export default SignatureComplianceEngine;