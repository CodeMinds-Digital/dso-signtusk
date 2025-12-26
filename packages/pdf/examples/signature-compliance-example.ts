/**
 * Signature Compliance Engine Example
 * 
 * This example demonstrates how to use the Signature Compliance Engine
 * to collect compliance metadata, validate signatures against legal frameworks,
 * and generate compliance reports for regulatory requirements.
 */

import {
    SignatureComplianceEngine,
    SignatureComplianceMetadata,
    SignatureComplianceValidationResult,
    SignatureComplianceReport
} from '../src/signature-compliance-engine';
import {
    CMSSignature,
    X509Certificate,
    Timestamp,
    SignatureValidationResult,
    CertificateValidationResult,
    TimestampVerificationResult
} from '../src/types';

async function demonstrateSignatureCompliance() {
    console.log('🔒 Signature Compliance Engine Example\n');

    // Initialize the compliance engine
    const complianceEngine = new SignatureComplianceEngine();

    // ========================================================================
    // Example 1: Collect Compliance Metadata for ESIGN Framework
    // ========================================================================
    console.log('📋 Example 1: Collecting Compliance Metadata for ESIGN Framework');

    const documentId = 'contract-2024-001';
    const signatureId = 'sig-john-doe-001';

    // Signer information collected during signing process
    const signerInfo = {
        userId: 'user-12345',
        email: 'john.doe@company.com',
        name: 'John Doe',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: {
            country: 'US',
            region: 'CA',
            city: 'San Francisco'
        }
    };

    // Mock certificate and signature data (in real implementation, these would come from actual signing)
    const mockCertificate: X509Certificate = {
        subject: {
            commonName: 'John Doe',
            organizationName: 'Acme Corporation',
            countryName: 'US',
            emailAddress: 'john.doe@company.com'
        },
        issuer: {
            commonName: 'Trusted CA',
            organizationName: 'Certificate Authority Inc'
        },
        serialNumber: 'ABC123456789',
        notBefore: new Date('2023-01-01'),
        notAfter: new Date('2025-12-31'),
        publicKey: {
            algorithm: 'RSA',
            keySize: 2048,
            raw: Buffer.from('mock-public-key')
        },
        fingerprint: 'SHA1:AB:CD:EF:12:34:56:78:90',
        extensions: [],
        raw: Buffer.from('mock-certificate-data')
    };

    const mockSignature: CMSSignature = {
        signerInfo: {
            certificate: mockCertificate,
            signedAttributes: [],
            unsignedAttributes: [],
            signatureAlgorithm: 'SHA256withRSA',
            signature: Buffer.from('mock-signature-data')
        },
        certificates: [mockCertificate],
        content: Buffer.from('document-content-hash'),
        signature: Buffer.from('cms-signature-data'),
        raw: Buffer.from('complete-cms-structure')
    };

    const signatureData = {
        signature: mockSignature,
        certificate: mockCertificate
    };

    // Compliance collection options
    const complianceOptions = {
        legalFramework: 'ESIGN' as const,
        consentMethod: 'EXPLICIT' as const,
        identityVerificationMethod: 'EMAIL' as const,
        documentHash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef',
        hashAlgorithm: 'SHA-256'
    };

    try {
        const complianceMetadata = await complianceEngine.collectComplianceMetadata(
            documentId,
            signatureId,
            signerInfo,
            signatureData,
            complianceOptions
        );

        console.log('✅ Compliance metadata collected successfully:');
        console.log(`   Legal Framework: ${complianceMetadata.legalFramework}`);
        console.log(`   Consent Method: ${complianceMetadata.signerConsent.consentMethod}`);
        console.log(`   Identity Verification: ${complianceMetadata.identityVerification.method} (${complianceMetadata.identityVerification.verificationLevel})`);
        console.log(`   Document Hash: ${complianceMetadata.documentIntegrity.documentHash}`);
        console.log(`   Retention Period: ${complianceMetadata.auditTrail.retentionPeriod} years`);
        console.log();

    } catch (error) {
        console.error('❌ Error collecting compliance metadata:', error);
        return;
    }

    // ========================================================================
    // Example 2: Generate Audit Trail for Signature Events
    // ========================================================================
    console.log('📝 Example 2: Generating Audit Trail for Signature Events');

    const signatureEvents = [
        {
            eventType: 'DOCUMENT_PREPARED' as const,
            userId: 'admin-001',
            userEmail: 'admin@company.com',
            ipAddress: '10.0.0.1',
            userAgent: 'Internal System v1.0',
            location: {
                country: 'US',
                region: 'CA',
                city: 'San Francisco'
            },
            details: {
                action: 'document_prepared',
                documentId,
                templateId: 'template-001',
                fieldsAdded: 3
            }
        },
        {
            eventType: 'SIGNATURE_REQUESTED' as const,
            userId: 'admin-001',
            userEmail: 'admin@company.com',
            ipAddress: '10.0.0.1',
            userAgent: 'Internal System v1.0',
            location: {
                country: 'US',
                region: 'CA',
                city: 'San Francisco'
            },
            details: {
                action: 'signature_requested',
                recipientEmail: signerInfo.email,
                requestMethod: 'email',
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        },
        {
            eventType: 'SIGNATURE_APPLIED' as const,
            userId: signerInfo.userId,
            userEmail: signerInfo.email,
            ipAddress: signerInfo.ipAddress,
            userAgent: signerInfo.userAgent,
            location: signerInfo.location,
            details: {
                action: 'signature_applied',
                signatureMethod: 'drawn',
                signatureFieldId: 'signature-field-1',
                certificateFingerprint: mockCertificate.fingerprint
            }
        },
        {
            eventType: 'DOCUMENT_COMPLETED' as const,
            userId: 'system',
            userEmail: 'system@company.com',
            details: {
                action: 'document_completed',
                completionTime: new Date(),
                allSignaturesApplied: true,
                finalDocumentHash: 'sha256:final-document-hash-here'
            }
        }
    ];

    try {
        const auditTrail = await complianceEngine.generateAuditTrail(signatureId, signatureEvents);

        console.log('✅ Audit trail generated successfully:');
        console.log(`   Total Events: ${auditTrail.length}`);
        console.log('   Event Chain:');

        auditTrail.forEach((event, index) => {
            console.log(`   ${index + 1}. ${event.eventType} at ${event.timestamp.toISOString()}`);
            console.log(`      Hash: ${event.hash.substring(0, 16)}...`);
            if (event.previousHash) {
                console.log(`      Previous Hash: ${event.previousHash.substring(0, 16)}...`);
            }
        });
        console.log();

    } catch (error) {
        console.error('❌ Error generating audit trail:', error);
        return;
    }

    // ========================================================================
    // Example 3: Validate Signature Compliance for eIDAS Framework
    // ========================================================================
    console.log('🔍 Example 3: Validating Signature Compliance for eIDAS Framework');

    // Create eIDAS-compliant metadata
    const eidasMetadata: SignatureComplianceMetadata = {
        legalFramework: 'EIDAS',
        signerConsent: {
            consentGiven: true,
            consentMethod: 'EXPLICIT',
            consentTimestamp: new Date(),
            consentEvidence: 'Signer explicitly clicked "I agree to sign this document electronically"',
            ipAddress: signerInfo.ipAddress,
            userAgent: signerInfo.userAgent,
            location: signerInfo.location
        },
        identityVerification: {
            method: 'ID_DOCUMENT',
            verificationLevel: 'HIGH',
            verificationTimestamp: new Date(),
            verificationDetails: {
                documentType: 'passport',
                documentNumber: 'P123456789',
                issuingCountry: 'US',
                verificationProvider: 'TrustedID Services'
            },
            verificationProvider: 'TrustedID Services'
        },
        documentIntegrity: {
            hashAlgorithm: 'SHA-256',
            documentHash: 'sha256:a1b2c3d4e5f6789012345678901234567890abcdef',
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
            retentionPeriod: 10, // 10 years for eIDAS
            auditEvents: [] // Would be populated with actual events
        },
        certifications: [
            {
                framework: 'eIDAS',
                certificationLevel: 'Qualified',
                certifyingAuthority: 'EU Trust Service Provider',
                certificationDate: new Date('2023-01-01'),
                expiryDate: new Date('2025-12-31'),
                certificationId: 'EIDAS-CERT-001'
            }
        ],
        customFields: {
            qualifiedSignature: true,
            trustServiceProvider: 'EU-TSP-001'
        }
    };

    // Mock validation results
    const signatureValidation: SignatureValidationResult = {
        isValid: true,
        signerCertificate: mockCertificate,
        signatureTime: new Date(),
        timestampValid: true,
        certificateChainValid: true,
        documentIntegrityValid: true,
        errors: [],
        warnings: []
    };

    const certificateValidation: CertificateValidationResult = {
        isValid: true,
        chainValid: true,
        notExpired: true,
        notRevoked: true,
        trustedRoot: true,
        errors: [],
        warnings: []
    };

    const timestampValidation: TimestampVerificationResult = {
        isValid: true,
        timestamp: new Date(),
        tsaUrl: 'https://tsa.eu-trust-provider.com',
        certificate: mockCertificate,
        messageImprint: {
            hashAlgorithm: 'SHA-256',
            hashedMessage: Buffer.from('document-hash')
        },
        errors: [],
        warnings: []
    };

    try {
        const validationResult = await complianceEngine.validateSignatureCompliance(
            eidasMetadata,
            signatureValidation,
            certificateValidation,
            timestampValidation
        );

        console.log('✅ Signature compliance validation completed:');
        console.log(`   Compliant: ${validationResult.isCompliant ? 'Yes' : 'No'}`);
        console.log(`   Compliance Level: ${validationResult.complianceLevel}`);
        console.log(`   Framework: ${validationResult.framework}`);
        console.log('   Compliance Checks:');
        console.log(`     Signer Consent: ${validationResult.checks.signerConsent.passed ? '✅' : '❌'}`);
        console.log(`     Identity Verification: ${validationResult.checks.identityVerification.passed ? '✅' : '❌'} (${validationResult.checks.identityVerification.verificationLevel})`);
        console.log(`     Document Integrity: ${validationResult.checks.documentIntegrity.passed ? '✅' : '❌'}`);
        console.log(`     Signature Validity: ${validationResult.checks.signatureValidity.passed ? '✅' : '❌'}`);
        console.log(`     Audit Trail: ${validationResult.checks.auditTrail.passed ? '✅' : '❌'} (${validationResult.checks.auditTrail.completeness}% complete)`);

        console.log('   Legal Admissibility:');
        console.log(`     Admissible: ${validationResult.legalAdmissibility.admissible ? 'Yes' : 'No'}`);
        console.log(`     Confidence: ${validationResult.legalAdmissibility.confidence}%`);
        console.log(`     Jurisdiction: ${validationResult.legalAdmissibility.jurisdiction}`);

        if (validationResult.violations.length > 0) {
            console.log('   Violations:');
            validationResult.violations.forEach((violation, index) => {
                console.log(`     ${index + 1}. ${violation.type} (${violation.severity}): ${violation.description}`);
            });
        }

        if (validationResult.recommendations.length > 0) {
            console.log('   Recommendations:');
            validationResult.recommendations.forEach((rec, index) => {
                console.log(`     ${index + 1}. ${rec}`);
            });
        }
        console.log();

        // ====================================================================
        // Example 4: Generate Compliance Report
        // ====================================================================
        console.log('📊 Example 4: Generating Compliance Report');

        const reportOptions = {
            includeAuditTrail: true,
            includeCertificateChain: true,
            includeTimestamps: true,
            includeMetadata: true,
            format: 'JSON' as const,
            jurisdiction: 'EU',
            language: 'en'
        };

        const complianceReport = await complianceEngine.generateComplianceReport(
            documentId,
            signatureId,
            eidasMetadata,
            validationResult,
            reportOptions
        );

        console.log('✅ Compliance report generated successfully:');
        console.log(`   Report ID: ${complianceReport.reportId}`);
        console.log(`   Document: ${complianceReport.document.title}`);
        console.log(`   Signer: ${complianceReport.signature.signerName} (${complianceReport.signature.signerEmail})`);
        console.log(`   Signature Time: ${complianceReport.signature.signatureTime.toISOString()}`);
        console.log(`   Compliance Level: ${complianceReport.compliance.complianceLevel}`);
        console.log(`   Legal Framework: ${complianceReport.compliance.framework}`);
        console.log(`   Audit Events: ${complianceReport.auditTrail.length}`);
        console.log('   Framework-Specific Data:');
        Object.entries(complianceReport.frameworkSpecific).forEach(([key, value]) => {
            console.log(`     ${key}: ${value}`);
        });
        console.log();

    } catch (error) {
        console.error('❌ Error validating signature compliance:', error);
        return;
    }

    // ========================================================================
    // Example 5: Demonstrate Different Legal Frameworks
    // ========================================================================
    console.log('🌍 Example 5: Compliance Requirements for Different Legal Frameworks');

    const frameworks = ['ESIGN', 'EIDAS', '21CFR11', 'UETA', 'PIPEDA'] as const;

    for (const framework of frameworks) {
        console.log(`\n📋 ${framework} Framework Requirements:`);

        const frameworkMetadata = await complianceEngine.collectComplianceMetadata(
            `doc-${framework.toLowerCase()}`,
            `sig-${framework.toLowerCase()}`,
            {
                userId: 'test-user',
                email: 'test@example.com',
                name: 'Test User'
            },
            {
                signature: mockSignature,
                certificate: mockCertificate
            },
            {
                legalFramework: framework,
                consentMethod: 'EXPLICIT',
                identityVerificationMethod: framework === 'EIDAS' || framework === '21CFR11' ? 'ID_DOCUMENT' : 'EMAIL',
                documentHash: 'test-hash',
                hashAlgorithm: 'SHA-256'
            }
        );

        console.log(`   Retention Period: ${frameworkMetadata.auditTrail.retentionPeriod} years`);
        console.log(`   Identity Verification Level: ${frameworkMetadata.identityVerification.verificationLevel}`);
        console.log(`   Certifications Required: ${frameworkMetadata.certifications.length}`);

        if (frameworkMetadata.certifications.length > 0) {
            frameworkMetadata.certifications.forEach(cert => {
                console.log(`     - ${cert.framework}: ${cert.certificationLevel}`);
            });
        }
    }

    console.log('\n🎉 Signature Compliance Engine examples completed successfully!');
    console.log('\n💡 Key Takeaways:');
    console.log('   • Compliance metadata collection ensures legal requirements are met');
    console.log('   • Audit trails provide immutable evidence of signature events');
    console.log('   • Validation checks verify compliance against specific legal frameworks');
    console.log('   • Compliance reports provide comprehensive documentation for regulatory purposes');
    console.log('   • Different frameworks have varying requirements for retention, verification, and certification');
}

// Run the example
if (require.main === module) {
    demonstrateSignatureCompliance().catch(console.error);
}

export { demonstrateSignatureCompliance };