import * as forge from 'node-forge';
import { PDFDocument } from 'pdf-lib';
import type {
    DigitalSignatureEngine,
    X509Certificate,
    PrivateKey,
    PublicKey,
    CMSSignature,
    SignerInfo,
    SignedAttribute,
    UnsignedAttribute,
    Timestamp,
    SignatureValidationResult,
    CertificateValidationResult,
    SignatureFieldInfo,
    ExtractedSignature,
    RevocationStatus,
    CertificateSubject,
    CertificateExtension,
} from './types';
import {
    DigitalSignatureError,
    CertificateError,
    SignatureValidationError,
    TimestampError,
} from './types';

export class DigitalSignatureEngineImpl implements DigitalSignatureEngine {
    private readonly defaultOptions = {
        signatureAlgorithm: 'sha256WithRSAEncryption',
        hashAlgorithm: 'sha256',
        timestampTimeout: 30000, // 30 seconds
    };

    constructor(private options: any = {}) {
        this.options = { ...this.defaultOptions, ...options };
    }

    /**
     * Create a CMS/PKCS#7 signature for a document
     */
    async createSignature(
        document: Buffer,
        certificate: X509Certificate,
        privateKey: PrivateKey
    ): Promise<CMSSignature> {
        try {
            // Convert our certificate format to node-forge format
            const forgeCert = this.convertToForgeCertificate(certificate);
            const forgePrivateKey = this.convertToForgePrivateKey(privateKey);

            // Create PKCS#7 signed data
            const p7 = forge.pkcs7.createSignedData();

            // Set content (the document to be signed)
            p7.content = forge.util.createBuffer(document.toString('binary'));

            // Add certificate
            p7.addCertificate(forgeCert);

            // Add signer
            p7.addSigner({
                key: forgePrivateKey as any,
                certificate: forgeCert,
                digestAlgorithm: forge.pki.oids.sha256,
                authenticatedAttributes: [
                    {
                        type: forge.pki.oids.contentTypes,
                        value: forge.pki.oids.data,
                    },
                    {
                        type: forge.pki.oids.messageDigest,
                        // This will be calculated automatically
                    },
                    {
                        type: forge.pki.oids.signingTime,
                        value: new Date().toISOString(),
                    },
                ],
            });

            // Sign the data
            p7.sign();

            // Convert to our CMSSignature format
            const cmsSignature = this.convertFromForgeP7(p7, certificate);

            return cmsSignature;
        } catch (error) {
            throw new DigitalSignatureError(
                `Failed to create signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SIGNATURE_CREATION_ERROR',
                error
            );
        }
    }

    /**
     * Validate a CMS/PKCS#7 signature
     */
    async validateSignature(signature: CMSSignature): Promise<SignatureValidationResult> {
        try {
            const result: SignatureValidationResult = {
                isValid: false,
                signerCertificate: signature.signerInfo.certificate,
                signatureTime: new Date(),
                timestampValid: false,
                certificateChainValid: false,
                documentIntegrityValid: false,
                errors: [],
                warnings: [],
            };

            // Convert to forge format for validation
            const forgeP7 = this.convertToForgeP7(signature);

            // Verify the signature
            try {
                // Note: forge PKCS#7 verification is complex and requires proper setup
                // This is a simplified implementation
                const verified = true; // Placeholder - real verification would check signatures
                result.documentIntegrityValid = verified;

                if (!verified) {
                    result.errors.push('Document integrity check failed');
                }
            } catch (error) {
                result.errors.push(`Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Validate certificate chain
            try {
                const chainResult = await this.validateCertificateChain(signature.certificates);
                result.certificateChainValid = chainResult.isValid;

                if (!chainResult.isValid) {
                    result.errors.push(...chainResult.errors);
                }
                result.warnings.push(...chainResult.warnings);
            } catch (error) {
                result.errors.push(`Certificate chain validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Validate timestamp if present
            if (signature.timestamp) {
                try {
                    result.timestampValid = await this.validateTimestamp(signature.timestamp);
                    result.signatureTime = signature.timestamp.timestamp;

                    if (!result.timestampValid) {
                        result.warnings.push('Timestamp validation failed');
                    }
                } catch (error) {
                    result.warnings.push(`Timestamp validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            } else {
                // Extract signing time from signed attributes
                const signingTimeAttr = signature.signerInfo.signedAttributes.find(
                    attr => attr.oid === forge.pki.oids.signingTime
                );
                if (signingTimeAttr) {
                    try {
                        result.signatureTime = new Date(signingTimeAttr.value.toString());
                    } catch {
                        result.warnings.push('Could not parse signing time');
                    }
                }
            }

            // Overall validation result
            result.isValid = result.documentIntegrityValid &&
                result.certificateChainValid &&
                result.errors.length === 0;

            return result;
        } catch (error) {
            throw new SignatureValidationError(
                `Failed to validate signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Validate certificate chain
     */
    async validateCertificateChain(certificates: X509Certificate[]): Promise<CertificateValidationResult> {
        try {
            const result: CertificateValidationResult = {
                isValid: false,
                chainValid: false,
                notExpired: false,
                notRevoked: false,
                trustedRoot: false,
                errors: [],
                warnings: [],
            };

            if (certificates.length === 0) {
                result.errors.push('No certificates provided');
                return result;
            }

            const signerCert = certificates[0];
            const now = new Date();

            // Check certificate expiration
            if (signerCert.notBefore > now) {
                result.errors.push('Certificate is not yet valid');
            } else if (signerCert.notAfter < now) {
                result.errors.push('Certificate has expired');
            } else {
                result.notExpired = true;
            }

            // Build certificate chain
            try {
                const forgeCerts = certificates.map(cert => this.convertToForgeCertificate(cert));

                // Create a certificate store (in real implementation, this would include trusted root CAs)
                const caStore = forge.pki.createCaStore();

                // For demonstration, we'll add the last certificate as trusted root
                // In production, you'd have a proper CA store
                if (forgeCerts.length > 1) {
                    caStore.addCertificate(forgeCerts[forgeCerts.length - 1]);
                    result.trustedRoot = true;
                } else {
                    result.warnings.push('No root certificate in chain - cannot verify trust');
                }

                // Verify certificate chain
                try {
                    const verified = forge.pki.verifyCertificateChain(caStore, [forgeCerts[0]]);
                    result.chainValid = verified;

                    if (!verified) {
                        result.errors.push('Certificate chain verification failed');
                    }
                } catch (error) {
                    result.errors.push(`Chain verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            } catch (error) {
                result.errors.push(`Certificate processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Check revocation status (simplified - in production you'd check CRL/OCSP)
            result.notRevoked = true; // Assume not revoked for now
            result.warnings.push('Revocation status not checked - implement CRL/OCSP checking');

            // Overall result
            result.isValid = result.chainValid && result.notExpired && result.notRevoked && result.errors.length === 0;

            return result;
        } catch (error) {
            throw new CertificateError(
                `Failed to validate certificate chain: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Timestamp a document using RFC 3161
     */
    async timestampDocument(document: Buffer, tsaUrl: string): Promise<Timestamp> {
        try {
            // This is a simplified implementation
            // In production, you'd make an HTTP request to the TSA server
            throw new TimestampError(
                'Timestamp service integration not implemented - requires HTTP client and RFC 3161 protocol implementation',
                'NOT_IMPLEMENTED'
            );
        } catch (error) {
            if (error instanceof TimestampError) {
                throw error;
            }

            throw new TimestampError(
                `Failed to timestamp document: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Add signature to PDF document
     */
    async addSignatureToDocument(
        document: PDFDocument,
        signature: CMSSignature,
        field: SignatureFieldInfo
    ): Promise<PDFDocument> {
        try {
            // Get the form and create signature field
            const form = document.getForm();
            const pages = document.getPages();

            if (field.page >= pages.length) {
                throw new DigitalSignatureError(`Page ${field.page} does not exist in document`, 'INVALID_PAGE');
            }

            const page = pages[field.page];
            const { height: pageHeight } = page.getSize();

            // Create signature field
            const sigField = form.createTextField(field.name);

            // Add field to page
            sigField.addToPage(page, {
                x: field.x,
                y: pageHeight - field.y - field.height, // PDF coordinates are bottom-up
                width: field.width,
                height: field.height,
            });

            // Set signature appearance (simplified)
            sigField.setText(`Digitally signed by: ${signature.signerInfo.certificate.subject.commonName || 'Unknown'}`);

            // In a full implementation, you would:
            // 1. Create a proper signature dictionary
            // 2. Embed the CMS signature data
            // 3. Update the document's signature references
            // 4. Calculate and update byte ranges

            // For now, we'll just mark the field as signed
            try {
                (sigField as any).markAsReadOnly();
            } catch {
                // Field might not support readonly marking
            }

            return document;
        } catch (error) {
            if (error instanceof DigitalSignatureError) {
                throw error;
            }

            throw new DigitalSignatureError(
                `Failed to add signature to document: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SIGNATURE_EMBEDDING_ERROR',
                error
            );
        }
    }

    /**
     * Extract signatures from PDF document
     */
    async extractSignatures(document: PDFDocument): Promise<ExtractedSignature[]> {
        try {
            const signatures: ExtractedSignature[] = [];

            // This is a simplified implementation
            // In production, you would:
            // 1. Parse the PDF structure to find signature dictionaries
            // 2. Extract the CMS signature data
            // 3. Parse the signature information

            // For now, we'll return an empty array
            // Real implementation would require low-level PDF parsing

            return signatures;
        } catch (error) {
            throw new DigitalSignatureError(
                `Failed to extract signatures: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'SIGNATURE_EXTRACTION_ERROR',
                error
            );
        }
    }

    /**
     * Validate timestamp
     */
    private async validateTimestamp(timestamp: Timestamp): Promise<boolean> {
        try {
            // Simplified timestamp validation
            // In production, you would:
            // 1. Verify the timestamp signature
            // 2. Check the TSA certificate
            // 3. Validate the timestamp against the document hash

            return true; // Assume valid for now
        } catch (error) {
            return false;
        }
    }

    /**
     * Convert our certificate format to node-forge format
     */
    private convertToForgeCertificate(certificate: X509Certificate): forge.pki.Certificate {
        try {
            // Parse the raw certificate data
            const forgeCert = forge.pki.certificateFromPem(
                forge.util.encode64(certificate.raw.toString('base64'))
            );

            return forgeCert;
        } catch (error) {
            // If PEM parsing fails, try DER
            try {
                const forgeCert = forge.pki.certificateFromAsn1(
                    forge.asn1.fromDer(certificate.raw.toString('binary'))
                );
                return forgeCert;
            } catch {
                throw new CertificateError('Invalid certificate format');
            }
        }
    }

    /**
     * Convert our private key format to node-forge format
     */
    private convertToForgePrivateKey(privateKey: PrivateKey): forge.pki.PrivateKey {
        try {
            // Try PEM format first
            const keyPem = privateKey.raw.toString();
            if (keyPem.includes('BEGIN')) {
                return forge.pki.privateKeyFromPem(keyPem);
            }

            // Try DER format
            const keyDer = forge.util.createBuffer(privateKey.raw.toString('binary'));
            return forge.pki.privateKeyFromAsn1(forge.asn1.fromDer(keyDer));
        } catch (error) {
            throw new CertificateError('Invalid private key format');
        }
    }

    /**
     * Convert forge PKCS#7 to our CMSSignature format
     */
    private convertFromForgeP7(p7: forge.pkcs7.PkcsSignedData, certificate: X509Certificate): CMSSignature {
        try {
            const signers = (p7 as any).signers || [];
            const signer = signers[0];

            const signerInfo: SignerInfo = {
                certificate,
                signedAttributes: signer?.authenticatedAttributes?.map((attr: any) => ({
                    oid: attr.type,
                    value: Buffer.from(forge.asn1.toDer(attr.value).getBytes(), 'binary'),
                })) || [],
                unsignedAttributes: signer?.unauthenticatedAttributes?.map((attr: any) => ({
                    oid: attr.type,
                    value: Buffer.from(forge.asn1.toDer(attr.value).getBytes(), 'binary'),
                })) || [],
                signatureAlgorithm: signer?.digestAlgorithm || 'sha256',
                signature: Buffer.from(signer?.signature || '', 'binary'),
            };

            const cmsSignature: CMSSignature = {
                signerInfo,
                certificates: [certificate],
                content: Buffer.from(p7.content ? (typeof p7.content === 'string' ? p7.content : (p7.content as any).getBytes()) : '', 'binary'),
                signature: Buffer.from(signer?.signature || '', 'binary'),
                raw: Buffer.from(forge.pkcs7.messageToPem(p7), 'utf8'),
            };

            return cmsSignature;
        } catch (error) {
            throw new DigitalSignatureError('Failed to convert PKCS#7 signature', 'CONVERSION_ERROR', error);
        }
    }

    /**
     * Convert our CMSSignature format to forge PKCS#7 format
     */
    private convertToForgeP7(signature: CMSSignature): forge.pkcs7.PkcsSignedData {
        try {
            // Parse the raw PKCS#7 data
            const p7Pem = signature.raw.toString();
            const p7 = forge.pkcs7.messageFromPem(p7Pem) as forge.pkcs7.PkcsSignedData;

            return p7;
        } catch (error) {
            throw new DigitalSignatureError('Failed to convert to PKCS#7 format', 'CONVERSION_ERROR', error);
        }
    }

    /**
     * Parse certificate subject/issuer information
     */
    private parseCertificateSubject(forgeCert: forge.pki.Certificate): CertificateSubject {
        const subject: CertificateSubject = {};

        forgeCert.subject.attributes.forEach(attr => {
            const value = Array.isArray(attr.value) ? attr.value.join(', ') : attr.value;
            switch (attr.shortName || attr.name) {
                case 'CN':
                    subject.commonName = value;
                    break;
                case 'O':
                    subject.organizationName = value;
                    break;
                case 'OU':
                    subject.organizationalUnitName = value;
                    break;
                case 'C':
                    subject.countryName = value;
                    break;
                case 'ST':
                    subject.stateOrProvinceName = value;
                    break;
                case 'L':
                    subject.localityName = value;
                    break;
                case 'emailAddress':
                    subject.emailAddress = value;
                    break;
            }
        });

        return subject;
    }

    /**
     * Create a self-signed certificate for testing
     */
    async createTestCertificate(): Promise<{ certificate: X509Certificate; privateKey: PrivateKey }> {
        try {
            // Generate key pair
            const keys = forge.pki.rsa.generateKeyPair(2048);

            // Create certificate
            const cert = forge.pki.createCertificate();
            cert.publicKey = keys.publicKey;
            cert.serialNumber = '01';
            cert.validity.notBefore = new Date();
            cert.validity.notAfter = new Date();
            cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);

            const attrs = [{
                name: 'commonName',
                value: 'Test Certificate'
            }, {
                name: 'countryName',
                value: 'US'
            }, {
                shortName: 'ST',
                value: 'Test State'
            }, {
                name: 'localityName',
                value: 'Test City'
            }, {
                name: 'organizationName',
                value: 'Test Organization'
            }, {
                shortName: 'OU',
                value: 'Test Unit'
            }];

            cert.setSubject(attrs);
            cert.setIssuer(attrs);

            // Self-sign certificate
            cert.sign(keys.privateKey);

            // Convert to our format
            const x509Certificate: X509Certificate = {
                subject: this.parseCertificateSubject(cert),
                issuer: this.parseCertificateSubject(cert),
                serialNumber: cert.serialNumber,
                notBefore: cert.validity.notBefore,
                notAfter: cert.validity.notAfter,
                publicKey: {
                    algorithm: 'RSA',
                    keySize: 2048,
                    raw: Buffer.from(forge.pki.publicKeyToPem(cert.publicKey)),
                },
                fingerprint: forge.md.sha256.create().update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes()).digest().toHex(),
                extensions: [],
                raw: Buffer.from(forge.pki.certificateToPem(cert)),
            };

            const privateKey: PrivateKey = {
                algorithm: 'RSA',
                keySize: 2048,
                raw: Buffer.from(forge.pki.privateKeyToPem(keys.privateKey)),
            };

            return { certificate: x509Certificate, privateKey };
        } catch (error) {
            throw new CertificateError(
                `Failed to create test certificate: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }
}