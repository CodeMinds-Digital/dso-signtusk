import { describe, it, expect, beforeEach } from 'vitest';
import {
    SignatureComplianceEngine,
    SignatureComplianceMetadata,
    SignatureComplianceValidationResult,
    SignatureAuditEvent,
    ComplianceViolation
} from '../signature-compliance-engine';
import {
    SignatureValidationResult,
    CertificateValidationResult,
    TimestampVerificationResult,
    CMSSignature,
    X509Certificate,
    Timestamp
} from '../types';

describe('SignatureComplianceEngine', () => {
    let engine: SignatureComplianceEngine;

    beforeEach(() => {
        engine = new SignatureComplianceEngine();
    });

    describe('collectComplianceMetadata', () => {
        it('should collect comprehensive compliance metadata for ESIGN framework', async () => {
            const documentId = 'doc-123';
            const signatureId = 'sig-456';

            const signerInfo = {
                userId: 'user-789',
                email: 'signer@example.com',
                name: 'John Doe',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...',
                location: {
                    country: 'US',
                    region: 'CA',
                    city: 'San Francisco'
                }
            };

            const mockCertificate: X509Certificate = {
                subject: { commonName: 'John Doe' },
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

            const options = {
                legalFramework: 'ESIGN' as const,
                consentMethod: 'EXPLICIT' as const,
                identityVerificationMethod: 'EMAIL' as const,
                documentHash: 'sha256:abcdef123456',
                hashAlgorithm: 'SHA-256'
            };

            const metadata = await engine.collectComplianceMetadata(
                documentId,
                signatureId,
                signerInfo,
                signatureData,
                options
            );

            expect(metadata.legalFramework).toBe('ESIGN');
            expect(metadata.signerConsent.consentGiven).toBe(true);
            expect(metadata.signerConsent.consentMethod).toBe('EXPLICIT');
            expect(metadata.signerConsent.ipAddress).toBe('192.168.1.1');
            expect(metadata.identityVerification.method).toBe('EMAIL');
            expect(metadata.identityVerification.verificationLevel).toBe('LOW');
            expect(metadata.documentIntegrity.hashAlgorithm).toBe('SHA-256');
            expect(metadata.documentIntegrity.documentHash).toBe('sha256:abcdef123456');
            expect(metadata.auditTrail.required).toBe(true);
            expect(metadata.auditTrail.retentionPeriod).toBe(7); // 7 years for ESIGN
        });

        it('should set appropriate verification level based on method', async () => {
            const testCases = [
                { method: 'EMAIL' as const, expectedLevel: 'LOW' },
                { method: 'SMS' as const, expectedLevel: 'MEDIUM' },
                { method: 'KNOWLEDGE_BASED' as const, expectedLevel: 'MEDIUM' },
                { method: 'ID_DOCUMENT' as const, expectedLevel: 'HIGH' },
                { method: 'BIOMETRIC' as const, expectedLevel: 'VERY_HIGH' },
                { method: 'MULTI_FACTOR' as const, expectedLevel: 'VERY_HIGH' }
            ];

            for (const testCase of testCases) {
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
                        legalFramework: 'ESIGN',
                        consentMethod: 'EXPLICIT',
                        identityVerificationMethod: testCase.method,
                        documentHash: 'hash123',
                        hashAlgorithm: 'SHA-256'
                    }
                );

                expect(metadata.identityVerification.verificationLevel).toBe(testCase.expectedLevel);
            }
        });

        it('should set appropriate retention period for different frameworks', async () => {
            const testCases = [
                { framework: 'ESIGN' as const, expectedPeriod: 7 },
                { framework: 'EIDAS' as const, expectedPeriod: 10 },
                { framework: '21CFR11' as const, expectedPeriod: 20 },
                { framework: 'UETA' as const, expectedPeriod: 7 },
                { framework: 'PIPEDA' as const, expectedPeriod: 7 }
            ];

            for (const testCase of testCases) {
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
                        legalFramework: testCase.framework,
                        consentMethod: 'EXPLICIT',
                        identityVerificationMethod: 'EMAIL',
                        documentHash: 'hash123',
                        hashAlgorithm: 'SHA-256'
                    }
                );

                expect(metadata.auditTrail.retentionPeriod).toBe(testCase.expectedPeriod);
            }
        });
    });

    describe('generateAuditTrail', () => {
        it('should generate complete audit trail with proper hash chain', async () => {
            const signatureId = 'sig-123';
            const events = [
                {
                    eventType: 'DOCUMENT_PREPARED' as const,
                    userId: 'user-1',
                    userEmail: 'user1@example.com',
                    details: { action: 'document_prepared' }
                },
                {
                    eventType: 'SIGNATURE_REQUESTED' as const,
                    userId: 'user-2',
                    userEmail: 'user2@example.com',
                    details: { action: 'signature_requested' }
                },
                {
                    eventType: 'SIGNATURE_APPLIED' as const,
                    userId: 'user-2',
                    userEmail: 'user2@example.com',
                    details: { action: 'signature_applied' }
                }
            ];

            const auditTrail = await engine.generateAuditTrail(signatureId, events);

            expect(auditTrail).toHaveLength(3);

            // Check first event has no previous hash
            expect(auditTrail[0].previousHash).toBeUndefined();
            expect(auditTrail[0].hash).toBeDefined();

            // Check hash chain integrity
            for (let i = 1; i < auditTrail.length; i++) {
                expect(auditTrail[i].previousHash).toBe(auditTrail[i - 1].hash);
                expect(auditTrail[i].hash).toBeDefined();
                expect(auditTrail[i].hash).not.toBe(auditTrail[i - 1].hash);
            }

            // Check event details
            expect(auditTrail[0].eventType).toBe('DOCUMENT_PREPARED');
            expect(auditTrail[1].eventType).toBe('SIGNATURE_REQUESTED');
            expect(auditTrail[2].eventType).toBe('SIGNATURE_APPLIED');
        });

        it('should include all required event metadata', async () => {
            const signatureId = 'sig-123';
            const events = [{
                eventType: 'SIGNATURE_APPLIED' as const,
                userId: 'user-123',
                userEmail: 'signer@example.com',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0...',
                location: {
                    country: 'US',
                    region: 'CA',
                    city: 'San Francisco'
                },
                details: {
                    signatureMethod: 'drawn',
                    documentId: 'doc-456'
                }
            }];

            const auditTrail = await engine.generateAuditTrail(signatureId, events);

            expect(auditTrail).toHaveLength(1);
            const event = auditTrail[0];

            expect(event.eventId).toBeDefined();
            expect(event.timestamp).toBeInstanceOf(Date);
            expect(event.userId).toBe('user-123');
            expect(event.userEmail).toBe('signer@example.com');
            expect(event.ipAddress).toBe('192.168.1.1');
            expect(event.userAgent).toBe('Mozilla/5.0...');
            expect(event.location).toEqual({
                country: 'US',
                region: 'CA',
                city: 'San Francisco'
            });
            expect(event.details.signatureMethod).toBe('drawn');
            expect(event.hash).toBeDefined();
        });
    });

    describe('validateSignatureCompliance', () => {
        let mockMetadata: SignatureComplianceMetadata;
        let mockSignatureValidation: SignatureValidationResult;
        let mockCertificateValidation: CertificateValidationResult;

        beforeEach(() => {
            mockMetadata = {
                legalFramework: 'ESIGN',
                signerConsent: {
                    consentGiven: true,
                    consentMethod: 'EXPLICIT',
                    consentTimestamp: new Date(),
                    consentEvidence: 'Explicit consent obtained'
                },
                identityVerification: {
                    method: 'EMAIL',
                    verificationLevel: 'MEDIUM',
                    verificationTimestamp: new Date(),
                    verificationDetails: {}
                },
                documentIntegrity: {
                    hashAlgorithm: 'SHA-256',
                    documentHash: 'hash123',
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
                            eventType: 'SIGNATURE_REQUESTED',
                            timestamp: new Date(),
                            details: {},
                            hash: 'hash2',
                            previousHash: 'hash1'
                        },
                        {
                            eventId: 'event-3',
                            eventType: 'SIGNATURE_APPLIED',
                            timestamp: new Date(),
                            details: {},
                            hash: 'hash3',
                            previousHash: 'hash2'
                        },
                        {
                            eventId: 'event-4',
                            eventType: 'DOCUMENT_COMPLETED',
                            timestamp: new Date(),
                            details: {},
                            hash: 'hash4',
                            previousHash: 'hash3'
                        }
                    ]
                },
                certifications: [],
                customFields: {}
            };

            mockSignatureValidation = {
                isValid: true,
                signerCertificate: {} as X509Certificate,
                signatureTime: new Date(),
                timestampValid: true,
                certificateChainValid: true,
                documentIntegrityValid: true,
                errors: [],
                warnings: []
            };

            mockCertificateValidation = {
                isValid: true,
                chainValid: true,
                notExpired: true,
                notRevoked: true,
                trustedRoot: true,
                errors: [],
                warnings: []
            };
        });

        it('should validate compliant signature successfully', async () => {
            const result = await engine.validateSignatureCompliance(
                mockMetadata,
                mockSignatureValidation,
                mockCertificateValidation
            );

            expect(result.isCompliant).toBe(true);
            expect(result.complianceLevel).toBe('ADVANCED');
            expect(result.framework).toBe('ESIGN');
            expect(result.violations).toHaveLength(0);
            expect(result.checks.signerConsent.passed).toBe(true);
            expect(result.checks.identityVerification.passed).toBe(true);
            expect(result.checks.documentIntegrity.passed).toBe(true);
            expect(result.checks.signatureValidity.passed).toBe(true);
            expect(result.legalAdmissibility.admissible).toBe(true);
        });

        it('should detect consent violations', async () => {
            mockMetadata.signerConsent.consentGiven = false;

            const result = await engine.validateSignatureCompliance(
                mockMetadata,
                mockSignatureValidation,
                mockCertificateValidation
            );

            expect(result.isCompliant).toBe(false);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].type).toBe('CONSENT');
            expect(result.violations[0].severity).toBe('HIGH');
            expect(result.checks.signerConsent.passed).toBe(false);
        });

        it('should detect implicit consent issues', async () => {
            mockMetadata.signerConsent.consentMethod = 'IMPLICIT';

            const result = await engine.validateSignatureCompliance(
                mockMetadata,
                mockSignatureValidation,
                mockCertificateValidation
            );

            expect(result.isCompliant).toBe(false);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].type).toBe('CONSENT');
            expect(result.checks.signerConsent.passed).toBe(false);
        });

        it('should detect insufficient identity verification for eIDAS', async () => {
            mockMetadata.legalFramework = 'EIDAS';
            mockMetadata.identityVerification.verificationLevel = 'LOW';

            const result = await engine.validateSignatureCompliance(
                mockMetadata,
                mockSignatureValidation,
                mockCertificateValidation
            );

            expect(result.isCompliant).toBe(false);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].type).toBe('IDENTITY');
            expect(result.checks.identityVerification.passed).toBe(false);
        });

        it('should detect document tampering', async () => {
            mockMetadata.documentIntegrity.tamperEvidence = true;

            const result = await engine.validateSignatureCompliance(
                mockMetadata,
                mockSignatureValidation,
                mockCertificateValidation
            );

            expect(result.isCompliant).toBe(false);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].type).toBe('INTEGRITY');
            expect(result.violations[0].severity).toBe('CRITICAL');
            expect(result.checks.documentIntegrity.passed).toBe(false);
        });

        it('should detect signature validation failures', async () => {
            mockSignatureValidation.isValid = false;
            mockMetadata.signatureValidity.cryptographicallyValid = false;

            const result = await engine.validateSignatureCompliance(
                mockMetadata,
                mockSignatureValidation,
                mockCertificateValidation
            );

            expect(result.isCompliant).toBe(false);
            expect(result.violations).toHaveLength(1);
            expect(result.violations[0].type).toBe('SIGNATURE');
            expect(result.violations[0].severity).toBe('CRITICAL');
            expect(result.checks.signatureValidity.passed).toBe(false);
        });

        it('should determine appropriate compliance levels', async () => {
            // Test QUALIFIED level for eIDAS with no violations
            mockMetadata.legalFramework = 'EIDAS';
            mockMetadata.identityVerification.verificationLevel = 'HIGH';

            let result = await engine.validateSignatureCompliance(
                mockMetadata,
                mockSignatureValidation,
                mockCertificateValidation
            );
            expect(result.complianceLevel).toBe('QUALIFIED');

            // Test NON_COMPLIANT with critical violation
            mockMetadata.documentIntegrity.tamperEvidence = true;
            result = await engine.validateSignatureCompliance(
                mockMetadata,
                mockSignatureValidation,
                mockCertificateValidation
            );
            expect(result.complianceLevel).toBe('NON_COMPLIANT');
        });

        it('should assess legal admissibility correctly', async () => {
            // High confidence for qualified eIDAS signature
            mockMetadata.legalFramework = 'EIDAS';
            mockMetadata.identityVerification.verificationLevel = 'VERY_HIGH';

            const result = await engine.validateSignatureCompliance(
                mockMetadata,
                mockSignatureValidation,
                mockCertificateValidation
            );

            expect(result.legalAdmissibility.admissible).toBe(true);
            expect(result.legalAdmissibility.confidence).toBeGreaterThan(90);
            expect(result.legalAdmissibility.factors).toContain('eIDAS qualified signature provides strong legal presumption');
        });
    });

    describe('generateComplianceReport', () => {
        it('should generate comprehensive compliance report', async () => {
            const documentId = 'doc-123';
            const signatureId = 'sig-456';

            const mockMetadata: SignatureComplianceMetadata = {
                legalFramework: 'ESIGN',
                signerConsent: {
                    consentGiven: true,
                    consentMethod: 'EXPLICIT',
                    consentTimestamp: new Date(),
                    consentEvidence: 'Explicit consent obtained'
                },
                identityVerification: {
                    method: 'EMAIL',
                    verificationLevel: 'MEDIUM',
                    verificationTimestamp: new Date(),
                    verificationDetails: {
                        name: 'John Doe',
                        email: 'john@example.com'
                    }
                },
                documentIntegrity: {
                    hashAlgorithm: 'SHA-256',
                    documentHash: 'hash123',
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

            const mockValidationResult: SignatureComplianceValidationResult = {
                isCompliant: true,
                complianceLevel: 'ADVANCED',
                framework: 'ESIGN',
                validationTimestamp: new Date(),
                checks: {
                    signerConsent: { passed: true, details: 'Valid', evidence: 'Explicit consent' },
                    identityVerification: { passed: true, verificationLevel: 'MEDIUM', details: 'Valid' },
                    documentIntegrity: { passed: true, tamperEvidence: false, details: 'Valid' },
                    signatureValidity: { passed: true, cryptographicValidity: true, certificateValidity: true, timestampValidity: true, details: 'Valid' },
                    auditTrail: { passed: true, completeness: 100, integrity: true, details: 'Valid' }
                },
                violations: [],
                recommendations: [],
                legalAdmissibility: {
                    admissible: true,
                    jurisdiction: 'US',
                    confidence: 95,
                    factors: ['Strong identity verification'],
                    limitations: []
                }
            };

            const options = {
                includeAuditTrail: true,
                includeCertificateChain: true,
                includeTimestamps: true,
                includeMetadata: true,
                format: 'JSON' as const
            };

            const report = await engine.generateComplianceReport(
                documentId,
                signatureId,
                mockMetadata,
                mockValidationResult,
                options
            );

            expect(report.reportId).toBeDefined();
            expect(report.documentId).toBe(documentId);
            expect(report.signatureId).toBe(signatureId);
            expect(report.generatedAt).toBeInstanceOf(Date);
            expect(report.document.hash).toBe('hash123');
            expect(report.signature.signerName).toBe('John Doe');
            expect(report.signature.signerEmail).toBe('john@example.com');
            expect(report.compliance).toBe(mockValidationResult);
            expect(report.frameworkSpecific).toBeDefined();
        });

        it('should include framework-specific data for eIDAS', async () => {
            const mockMetadata: SignatureComplianceMetadata = {
                legalFramework: 'EIDAS',
                signerConsent: {
                    consentGiven: true,
                    consentMethod: 'EXPLICIT',
                    consentTimestamp: new Date(),
                    consentEvidence: 'Explicit consent obtained'
                },
                identityVerification: {
                    method: 'ID_DOCUMENT',
                    verificationLevel: 'HIGH',
                    verificationTimestamp: new Date(),
                    verificationDetails: {}
                },
                documentIntegrity: {
                    hashAlgorithm: 'SHA-256',
                    documentHash: 'hash123',
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
                    retentionPeriod: 10,
                    auditEvents: []
                },
                certifications: [],
                customFields: {}
            };

            const mockValidationResult: SignatureComplianceValidationResult = {
                isCompliant: true,
                complianceLevel: 'QUALIFIED',
                framework: 'EIDAS',
                validationTimestamp: new Date(),
                checks: {
                    signerConsent: { passed: true, details: 'Valid', evidence: 'Explicit consent' },
                    identityVerification: { passed: true, verificationLevel: 'HIGH', details: 'Valid' },
                    documentIntegrity: { passed: true, tamperEvidence: false, details: 'Valid' },
                    signatureValidity: { passed: true, cryptographicValidity: true, certificateValidity: true, timestampValidity: true, details: 'Valid' },
                    auditTrail: { passed: true, completeness: 100, integrity: true, details: 'Valid' }
                },
                violations: [],
                recommendations: [],
                legalAdmissibility: {
                    admissible: true,
                    jurisdiction: 'EU',
                    confidence: 98,
                    factors: ['eIDAS qualified signature'],
                    limitations: []
                }
            };

            const report = await engine.generateComplianceReport(
                'doc-123',
                'sig-456',
                mockMetadata,
                mockValidationResult,
                {
                    includeAuditTrail: true,
                    includeCertificateChain: true,
                    includeTimestamps: true,
                    includeMetadata: true,
                    format: 'JSON'
                }
            );

            expect(report.frameworkSpecific.signatureLevel).toBe('AdES-B');
            expect(report.frameworkSpecific.trustServiceProvider).toBe('EU Qualified Trust Service Provider');
            expect(report.frameworkSpecific.qualifiedCertificate).toBe(true);
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle missing audit events gracefully', async () => {
            const mockMetadata: SignatureComplianceMetadata = {
                legalFramework: 'ESIGN',
                signerConsent: {
                    consentGiven: true,
                    consentMethod: 'EXPLICIT',
                    consentTimestamp: new Date(),
                    consentEvidence: 'Explicit consent obtained'
                },
                identityVerification: {
                    method: 'EMAIL',
                    verificationLevel: 'LOW',
                    verificationTimestamp: new Date(),
                    verificationDetails: {}
                },
                documentIntegrity: {
                    hashAlgorithm: 'SHA-256',
                    documentHash: 'hash123',
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
                    auditEvents: [] // Empty audit events
                },
                certifications: [],
                customFields: {}
            };

            const result = await engine.validateSignatureCompliance(
                mockMetadata,
                { isValid: true } as SignatureValidationResult,
                { isValid: true } as CertificateValidationResult
            );

            expect(result.checks.auditTrail.passed).toBe(false);
            expect(result.checks.auditTrail.completeness).toBe(0);
            expect(result.violations.some(v => v.type === 'AUDIT')).toBe(true);
        });

        it('should handle unknown legal frameworks', async () => {
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
                    legalFramework: 'CUSTOM',
                    consentMethod: 'EXPLICIT',
                    identityVerificationMethod: 'EMAIL',
                    documentHash: 'hash123',
                    hashAlgorithm: 'SHA-256'
                }
            );

            expect(metadata.legalFramework).toBe('CUSTOM');
            expect(metadata.auditTrail.retentionPeriod).toBe(7); // Default retention period
            expect(metadata.certifications).toHaveLength(0); // No specific certifications
        });
    });
});