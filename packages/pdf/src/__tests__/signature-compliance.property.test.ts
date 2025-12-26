import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
    SignatureComplianceEngine,
    SignatureComplianceMetadata,
    SignatureAuditEvent,
    ComplianceViolation
} from '../signature-compliance-engine';
import {
    SignatureValidationResult,
    CertificateValidationResult,
    CMSSignature,
    X509Certificate
} from '../types';

describe('SignatureComplianceEngine - Property-Based Tests', () => {
    const engine = new SignatureComplianceEngine();

    // Arbitraries for generating test data
    const legalFrameworkArb = fc.constantFrom('ESIGN', 'EIDAS', '21CFR11', 'UETA', 'PIPEDA', 'CUSTOM');
    const consentMethodArb = fc.constantFrom('EXPLICIT', 'IMPLICIT', 'CLICK_WRAP', 'BROWSE_WRAP');
    const verificationMethodArb = fc.constantFrom('EMAIL', 'SMS', 'KNOWLEDGE_BASED', 'ID_DOCUMENT', 'BIOMETRIC', 'MULTI_FACTOR');
    const verificationLevelArb = fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH');
    const severityArb = fc.constantFrom('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

    const signerInfoArb = fc.record({
        userId: fc.string({ minLength: 1, maxLength: 50 }),
        email: fc.emailAddress(),
        name: fc.string({ minLength: 1, maxLength: 100 }),
        ipAddress: fc.ipV4(),
        userAgent: fc.string({ minLength: 10, maxLength: 200 }),
        location: fc.record({
            country: fc.string({ minLength: 2, maxLength: 2 }),
            region: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.toUpperCase()),
            city: fc.string({ minLength: 1, maxLength: 100 })
        })
    });

    const complianceOptionsArb = fc.record({
        legalFramework: legalFrameworkArb,
        consentMethod: consentMethodArb,
        identityVerificationMethod: verificationMethodArb,
        documentHash: fc.string({ minLength: 32, maxLength: 64 }),
        hashAlgorithm: fc.constantFrom('SHA-256', 'SHA-384', 'SHA-512')
    });

    const auditEventArb = fc.record({
        eventType: fc.constantFrom('DOCUMENT_PREPARED', 'SIGNATURE_REQUESTED', 'SIGNATURE_APPLIED', 'DOCUMENT_COMPLETED', 'CERTIFICATE_VALIDATED', 'TIMESTAMP_APPLIED', 'COMPLIANCE_VERIFIED'),
        userId: fc.string({ minLength: 1, maxLength: 50 }),
        userEmail: fc.emailAddress(),
        ipAddress: fc.ipV4(),
        userAgent: fc.string({ minLength: 10, maxLength: 200 }),
        location: fc.record({
            country: fc.string({ minLength: 2, maxLength: 2 }),
            region: fc.string({ minLength: 1, maxLength: 50 }),
            city: fc.string({ minLength: 1, maxLength: 100 })
        }),
        details: fc.dictionary(fc.string(), fc.anything())
    });

    const violationArb = fc.record({
        type: fc.constantFrom('CONSENT', 'IDENTITY', 'INTEGRITY', 'SIGNATURE', 'AUDIT', 'CERTIFICATE', 'TIMESTAMP', 'FRAMEWORK'),
        severity: severityArb,
        description: fc.string({ minLength: 10, maxLength: 200 }),
        requirement: fc.string({ minLength: 10, maxLength: 200 }),
        recommendation: fc.string({ minLength: 10, maxLength: 200 }),
        detectedAt: fc.date()
    });

    /**
     * **Feature: Signature Compliance System, Property 71: Compliance Metadata Collection Consistency**
     * 
     * For any valid signature compliance collection request, the metadata should be:
     * 1. Complete with all required fields populated
     * 2. Consistent with the input parameters
     * 3. Compliant with the specified legal framework requirements
     * 4. Include proper audit trail initialization
     */
    it('should collect consistent compliance metadata for any valid input', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 50 }), // documentId
                fc.string({ minLength: 1, maxLength: 50 }), // signatureId
                signerInfoArb,
                complianceOptionsArb,
                async (documentId, signatureId, signerInfo, options) => {
                    // Create mock signature data
                    const mockCertificate: X509Certificate = {
                        subject: { commonName: signerInfo.name },
                        issuer: { commonName: 'Test CA' },
                        serialNumber: '123456',
                        notBefore: new Date('2023-01-01'),
                        notAfter: new Date('2025-01-01'),
                        publicKey: { algorithm: 'RSA', keySize: 2048, raw: Buffer.from('') },
                        fingerprint: 'abc123',
                        extensions: [],
                        raw: Buffer.from('')
                    };

                    const mockSignature: CMSSignature = {
                        signerInfo: {
                            certificate: mockCertificate,
                            signedAttributes: [],
                            unsignedAttributes: [],
                            signatureAlgorithm: 'SHA256withRSA',
                            signature: Buffer.from('')
                        },
                        certificates: [mockCertificate],
                        content: Buffer.from(''),
                        signature: Buffer.from(''),
                        raw: Buffer.from('')
                    };

                    const signatureData = {
                        signature: mockSignature,
                        certificate: mockCertificate
                    };

                    const metadata = await engine.collectComplianceMetadata(
                        documentId,
                        signatureId,
                        signerInfo,
                        signatureData,
                        options
                    );

                    // Property 1: Metadata completeness
                    expect(metadata.legalFramework).toBeDefined();
                    expect(metadata.signerConsent).toBeDefined();
                    expect(metadata.identityVerification).toBeDefined();
                    expect(metadata.documentIntegrity).toBeDefined();
                    expect(metadata.signatureValidity).toBeDefined();
                    expect(metadata.auditTrail).toBeDefined();
                    expect(metadata.certifications).toBeDefined();
                    expect(metadata.customFields).toBeDefined();

                    // Property 2: Input consistency
                    expect(metadata.legalFramework).toBe(options.legalFramework);
                    expect(metadata.signerConsent.consentMethod).toBe(options.consentMethod);
                    expect(metadata.identityVerification.method).toBe(options.identityVerificationMethod);
                    expect(metadata.documentIntegrity.documentHash).toBe(options.documentHash);
                    expect(metadata.documentIntegrity.hashAlgorithm).toBe(options.hashAlgorithm);

                    // Property 3: Framework-specific requirements
                    const expectedRetentionPeriods: Record<string, number> = {
                        'ESIGN': 7,
                        'EIDAS': 10,
                        '21CFR11': 20,
                        'UETA': 7,
                        'PIPEDA': 7,
                        'CUSTOM': 7
                    };
                    expect(metadata.auditTrail.retentionPeriod).toBe(expectedRetentionPeriods[options.legalFramework]);

                    // Property 4: Audit trail initialization
                    expect(metadata.auditTrail.required).toBe(true);
                    expect(metadata.auditTrail.immutable).toBe(true);
                    expect(metadata.auditTrail.cryptographicallySecured).toBe(true);
                    expect(Array.isArray(metadata.auditTrail.auditEvents)).toBe(true);

                    // Property 5: Verification level consistency
                    const expectedLevels: Record<string, string> = {
                        'EMAIL': 'LOW',
                        'SMS': 'MEDIUM',
                        'KNOWLEDGE_BASED': 'MEDIUM',
                        'ID_DOCUMENT': 'HIGH',
                        'BIOMETRIC': 'VERY_HIGH',
                        'MULTI_FACTOR': 'VERY_HIGH'
                    };
                    expect(metadata.identityVerification.verificationLevel).toBe(expectedLevels[options.identityVerificationMethod]);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: Signature Compliance System, Property 72: Audit Trail Integrity**
     * 
     * For any sequence of audit events, the generated audit trail should maintain:
     * 1. Chronological ordering of events
     * 2. Cryptographic hash chain integrity
     * 3. Complete event metadata preservation
     * 4. Immutable event records
     */
    it('should maintain audit trail integrity for any sequence of events', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 50 }), // signatureId
                fc.array(auditEventArb, { minLength: 1, maxLength: 10 }),
                async (signatureId, events) => {
                    const auditTrail = await engine.generateAuditTrail(signatureId, events);

                    // Property 1: Event count preservation
                    expect(auditTrail).toHaveLength(events.length);

                    // Property 2: Chronological ordering
                    for (let i = 1; i < auditTrail.length; i++) {
                        expect(auditTrail[i].timestamp.getTime()).toBeGreaterThanOrEqual(
                            auditTrail[i - 1].timestamp.getTime()
                        );
                    }

                    // Property 3: Hash chain integrity
                    if (auditTrail.length > 0) {
                        // First event should have no previous hash
                        expect(auditTrail[0].previousHash).toBeUndefined();
                        expect(auditTrail[0].hash).toBeDefined();
                        expect(auditTrail[0].hash.length).toBeGreaterThan(0);

                        // Subsequent events should form a valid chain
                        for (let i = 1; i < auditTrail.length; i++) {
                            expect(auditTrail[i].previousHash).toBe(auditTrail[i - 1].hash);
                            expect(auditTrail[i].hash).toBeDefined();
                            expect(auditTrail[i].hash.length).toBeGreaterThan(0);
                            expect(auditTrail[i].hash).not.toBe(auditTrail[i - 1].hash);
                        }
                    }

                    // Property 4: Event metadata preservation
                    for (let i = 0; i < events.length; i++) {
                        const originalEvent = events[i];
                        const auditEvent = auditTrail[i];

                        expect(auditEvent.eventType).toBe(originalEvent.eventType);
                        expect(auditEvent.userId).toBe(originalEvent.userId);
                        expect(auditEvent.userEmail).toBe(originalEvent.userEmail);
                        expect(auditEvent.ipAddress).toBe(originalEvent.ipAddress);
                        expect(auditEvent.userAgent).toBe(originalEvent.userAgent);
                        expect(auditEvent.location).toEqual(originalEvent.location);
                        expect(auditEvent.details).toEqual(originalEvent.details);
                    }

                    // Property 5: Immutable event IDs
                    const eventIds = auditTrail.map(e => e.eventId);
                    const uniqueEventIds = new Set(eventIds);
                    expect(uniqueEventIds.size).toBe(eventIds.length); // All IDs should be unique
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: Signature Compliance System, Property 73: Compliance Validation Consistency**
     * 
     * For any compliance validation request, the validation result should be:
     * 1. Deterministic for the same input
     * 2. Consistent with violation severity levels
     * 3. Properly categorized by compliance level
     * 4. Include appropriate legal admissibility assessment
     */
    it('should provide consistent compliance validation results', async () => {
        await fc.assert(
            fc.asyncProperty(
                legalFrameworkArb,
                fc.boolean(), // consentGiven
                consentMethodArb,
                verificationLevelArb,
                fc.boolean(), // tamperEvidence
                fc.boolean(), // cryptographicallyValid
                fc.boolean(), // certificateValid
                fc.boolean(), // timestampValid
                async (framework, consentGiven, consentMethod, verificationLevel, tamperEvidence, cryptoValid, certValid, timestampValid) => {
                    // Create test metadata
                    const metadata: SignatureComplianceMetadata = {
                        legalFramework: framework,
                        signerConsent: {
                            consentGiven,
                            consentMethod,
                            consentTimestamp: new Date(),
                            consentEvidence: 'Test evidence'
                        },
                        identityVerification: {
                            method: 'EMAIL',
                            verificationLevel,
                            verificationTimestamp: new Date(),
                            verificationDetails: {}
                        },
                        documentIntegrity: {
                            hashAlgorithm: 'SHA-256',
                            documentHash: 'test-hash',
                            hashTimestamp: new Date(),
                            tamperEvidence,
                            integrityVerified: !tamperEvidence
                        },
                        signatureValidity: {
                            cryptographicallyValid: cryptoValid,
                            certificateValid: certValid,
                            timestampValid: timestampValid,
                            signatureTime: new Date(),
                            validationTime: new Date(),
                            validationMethod: 'CMS_PKCS7'
                        },
                        auditTrail: {
                            required: true,
                            immutable: true,
                            cryptographicallySecured: true,
                            retentionPeriod: 7,
                            auditEvents: [
                                {
                                    eventId: 'event-1',
                                    eventType: 'DOCUMENT_PREPARED',
                                    timestamp: new Date(),
                                    details: {},
                                    hash: 'hash1'
                                },
                                {
                                    eventId: 'event-2',
                                    eventType: 'SIGNATURE_APPLIED',
                                    timestamp: new Date(),
                                    details: {},
                                    hash: 'hash2',
                                    previousHash: 'hash1'
                                }
                            ]
                        },
                        certifications: [],
                        customFields: {}
                    };

                    const mockSignatureValidation: SignatureValidationResult = {
                        isValid: cryptoValid,
                        signerCertificate: {} as X509Certificate,
                        signatureTime: new Date(),
                        timestampValid: timestampValid,
                        certificateChainValid: certValid,
                        documentIntegrityValid: !tamperEvidence,
                        errors: [],
                        warnings: []
                    };

                    const mockCertificateValidation: CertificateValidationResult = {
                        isValid: certValid,
                        chainValid: certValid,
                        notExpired: true,
                        notRevoked: true,
                        trustedRoot: true,
                        errors: [],
                        warnings: []
                    };

                    const result = await engine.validateSignatureCompliance(
                        metadata,
                        mockSignatureValidation,
                        mockCertificateValidation
                    );

                    // Property 1: Deterministic results
                    const result2 = await engine.validateSignatureCompliance(
                        metadata,
                        mockSignatureValidation,
                        mockCertificateValidation
                    );
                    expect(result.isCompliant).toBe(result2.isCompliant);
                    expect(result.complianceLevel).toBe(result2.complianceLevel);
                    expect(result.violations.length).toBe(result2.violations.length);

                    // Property 2: Violation consistency with input
                    if (!consentGiven || consentMethod === 'IMPLICIT') {
                        expect(result.violations.some(v => v.type === 'CONSENT')).toBe(true);
                        expect(result.checks.signerConsent.passed).toBe(false);
                    }

                    if (tamperEvidence) {
                        expect(result.violations.some(v => v.type === 'INTEGRITY')).toBe(true);
                        expect(result.checks.documentIntegrity.passed).toBe(false);
                    }

                    if (!cryptoValid || !certValid) {
                        expect(result.violations.some(v => v.type === 'SIGNATURE')).toBe(true);
                        expect(result.checks.signatureValidity.passed).toBe(false);
                    }

                    // Property 3: Compliance level consistency
                    const hasCriticalViolations = result.violations.some(v => v.severity === 'CRITICAL');
                    const hasHighViolations = result.violations.some(v => v.severity === 'HIGH');
                    const hasMediumViolations = result.violations.some(v => v.severity === 'MEDIUM');

                    if (hasCriticalViolations) {
                        expect(result.complianceLevel).toBe('NON_COMPLIANT');
                        expect(result.isCompliant).toBe(false);
                    } else if (hasHighViolations) {
                        expect(result.complianceLevel).toBe('BASIC');
                        expect(result.isCompliant).toBe(false);
                    } else if (hasMediumViolations) {
                        expect(result.complianceLevel).toBe('STANDARD');
                        expect(result.isCompliant).toBe(false);
                    }

                    // Property 4: Legal admissibility consistency
                    if (result.complianceLevel === 'NON_COMPLIANT') {
                        expect(result.legalAdmissibility.confidence).toBeLessThan(50);
                        expect(result.legalAdmissibility.admissible).toBe(false);
                    } else if (result.complianceLevel === 'QUALIFIED') {
                        expect(result.legalAdmissibility.confidence).toBeGreaterThan(80);
                        expect(result.legalAdmissibility.admissible).toBe(true);
                    }

                    // Property 5: Framework consistency
                    expect(result.framework).toBe(framework);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: Signature Compliance System, Property 74: Compliance Report Generation Completeness**
     * 
     * For any compliance report generation request, the report should:
     * 1. Include all required sections and metadata
     * 2. Maintain data consistency with input
     * 3. Include framework-specific information
     * 4. Provide complete audit trail when requested
     */
    it('should generate complete and consistent compliance reports', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1, maxLength: 50 }), // documentId
                fc.string({ minLength: 1, maxLength: 50 }), // signatureId
                legalFrameworkArb,
                fc.boolean(), // includeAuditTrail
                fc.boolean(), // includeCertificateChain
                fc.boolean(), // includeTimestamps
                fc.boolean(), // includeMetadata
                async (documentId, signatureId, framework, includeAuditTrail, includeCertificateChain, includeTimestamps, includeMetadata) => {
                    // Create test metadata and validation result
                    const metadata: SignatureComplianceMetadata = {
                        legalFramework: framework,
                        signerConsent: {
                            consentGiven: true,
                            consentMethod: 'EXPLICIT',
                            consentTimestamp: new Date(),
                            consentEvidence: 'Test evidence'
                        },
                        identityVerification: {
                            method: 'EMAIL',
                            verificationLevel: 'MEDIUM',
                            verificationTimestamp: new Date(),
                            verificationDetails: {
                                name: 'Test Signer',
                                email: 'test@example.com'
                            }
                        },
                        documentIntegrity: {
                            hashAlgorithm: 'SHA-256',
                            documentHash: 'test-hash-123',
                            hashTimestamp: new Date(),
                            tamperEvidence: false,
                            integrityVerified: true
                        },
                        signatureValidity: {
                            cryptographicallyValid: true,
                            certificateValid: true,
                            timestampValid: true,
                            signatureTime: new Date(),
                            validationTime: new Date(),
                            validationMethod: 'CMS_PKCS7'
                        },
                        auditTrail: {
                            required: true,
                            immutable: true,
                            cryptographicallySecured: true,
                            retentionPeriod: 7,
                            auditEvents: []
                        },
                        certifications: [],
                        customFields: {}
                    };

                    const validationResult = {
                        isCompliant: true,
                        complianceLevel: 'ADVANCED' as const,
                        framework,
                        validationTimestamp: new Date(),
                        checks: {
                            signerConsent: { passed: true, details: 'Valid', evidence: 'Test evidence' },
                            identityVerification: { passed: true, verificationLevel: 'MEDIUM', details: 'Valid' },
                            documentIntegrity: { passed: true, tamperEvidence: false, details: 'Valid' },
                            signatureValidity: { passed: true, cryptographicValidity: true, certificateValidity: true, timestampValidity: true, details: 'Valid' },
                            auditTrail: { passed: true, completeness: 100, integrity: true, details: 'Valid' }
                        },
                        violations: [],
                        recommendations: [],
                        legalAdmissibility: {
                            admissible: true,
                            jurisdiction: 'General',
                            confidence: 95,
                            factors: [],
                            limitations: []
                        }
                    };

                    const options = {
                        includeAuditTrail,
                        includeCertificateChain,
                        includeTimestamps,
                        includeMetadata,
                        format: 'JSON' as const
                    };

                    const report = await engine.generateComplianceReport(
                        documentId,
                        signatureId,
                        metadata,
                        validationResult,
                        options
                    );

                    // Property 1: Required sections completeness
                    expect(report.reportId).toBeDefined();
                    expect(report.reportId.length).toBeGreaterThan(0);
                    expect(report.documentId).toBe(documentId);
                    expect(report.signatureId).toBe(signatureId);
                    expect(report.generatedAt).toBeInstanceOf(Date);
                    expect(report.generatedBy).toBeDefined();
                    expect(report.document).toBeDefined();
                    expect(report.signature).toBeDefined();
                    expect(report.compliance).toBeDefined();
                    expect(report.auditTrail).toBeDefined();
                    expect(report.frameworkSpecific).toBeDefined();
                    expect(report.attachments).toBeDefined();

                    // Property 2: Data consistency
                    expect(report.document.hash).toBe(metadata.documentIntegrity.documentHash);
                    expect(report.signature.signerName).toBe(metadata.identityVerification.verificationDetails.name);
                    expect(report.signature.signerEmail).toBe(metadata.identityVerification.verificationDetails.email);
                    expect(report.compliance).toBe(validationResult);

                    // Property 3: Framework-specific information
                    if (framework === 'EIDAS') {
                        expect(report.frameworkSpecific.signatureLevel).toBeDefined();
                        expect(report.frameworkSpecific.trustServiceProvider).toBeDefined();
                        expect(report.frameworkSpecific.qualifiedCertificate).toBeDefined();
                    } else if (framework === '21CFR11') {
                        expect(report.frameworkSpecific.fdaCompliance).toBeDefined();
                        expect(report.frameworkSpecific.electronicRecordIntegrity).toBeDefined();
                    }

                    // Property 4: Audit trail inclusion consistency
                    expect(Array.isArray(report.auditTrail)).toBe(true);

                    // Property 5: Report metadata consistency
                    expect(report.generatedAt.getTime()).toBeLessThanOrEqual(Date.now());
                    expect(report.generatedAt.getTime()).toBeGreaterThan(Date.now() - 10000); // Within last 10 seconds
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * **Feature: Signature Compliance System, Property 75: Legal Framework Requirements Adherence**
     * 
     * For any legal framework, the compliance system should:
     * 1. Apply framework-specific validation rules
     * 2. Set appropriate retention periods
     * 3. Include required certifications
     * 4. Enforce minimum verification levels
     */
    it('should adhere to legal framework requirements consistently', async () => {
        await fc.assert(
            fc.asyncProperty(
                legalFrameworkArb,
                verificationMethodArb,
                async (framework, verificationMethod) => {
                    const metadata = await engine.collectComplianceMetadata(
                        'doc-123',
                        'sig-456',
                        {
                            userId: 'user-789',
                            email: 'test@example.com',
                            name: 'Test User'
                        },
                        {
                            signature: {} as CMSSignature,
                            certificate: {} as X509Certificate
                        },
                        {
                            legalFramework: framework,
                            consentMethod: 'EXPLICIT',
                            identityVerificationMethod: verificationMethod,
                            documentHash: 'hash123',
                            hashAlgorithm: 'SHA-256'
                        }
                    );

                    // Property 1: Framework-specific retention periods
                    const expectedRetentionPeriods: Record<string, number> = {
                        'ESIGN': 7,
                        'EIDAS': 10,
                        '21CFR11': 20,
                        'UETA': 7,
                        'PIPEDA': 7,
                        'CUSTOM': 7
                    };
                    expect(metadata.auditTrail.retentionPeriod).toBe(expectedRetentionPeriods[framework]);

                    // Property 2: Framework-specific certifications
                    if (framework === 'EIDAS') {
                        expect(metadata.certifications.some(c => c.framework === 'eIDAS')).toBe(true);
                    } else if (framework === '21CFR11') {
                        expect(metadata.certifications.some(c => c.framework === '21 CFR Part 11')).toBe(true);
                    }

                    // Property 3: Verification level mapping consistency
                    const expectedLevels: Record<string, string> = {
                        'EMAIL': 'LOW',
                        'SMS': 'MEDIUM',
                        'KNOWLEDGE_BASED': 'MEDIUM',
                        'ID_DOCUMENT': 'HIGH',
                        'BIOMETRIC': 'VERY_HIGH',
                        'MULTI_FACTOR': 'VERY_HIGH'
                    };
                    expect(metadata.identityVerification.verificationLevel).toBe(expectedLevels[verificationMethod]);

                    // Property 4: Framework validation requirements
                    const mockValidationResult = {
                        isValid: true,
                        signerCertificate: {} as X509Certificate,
                        signatureTime: new Date(),
                        timestampValid: true,
                        certificateChainValid: true,
                        documentIntegrityValid: true,
                        errors: [],
                        warnings: []
                    };

                    const mockCertValidation = {
                        isValid: true,
                        chainValid: true,
                        notExpired: true,
                        notRevoked: true,
                        trustedRoot: true,
                        errors: [],
                        warnings: []
                    };

                    const complianceResult = await engine.validateSignatureCompliance(
                        metadata,
                        mockValidationResult,
                        mockCertValidation
                    );

                    // Check framework-specific validation requirements
                    if (framework === 'EIDAS' && metadata.identityVerification.verificationLevel === 'LOW') {
                        expect(complianceResult.checks.identityVerification.passed).toBe(false);
                    }

                    if (framework === '21CFR11' && metadata.identityVerification.verificationLevel === 'LOW') {
                        expect(complianceResult.checks.identityVerification.passed).toBe(false);
                    }

                    // Property 5: Framework consistency in reports
                    expect(complianceResult.framework).toBe(framework);
                }
            ),
            { numRuns: 100 }
        );
    });
});