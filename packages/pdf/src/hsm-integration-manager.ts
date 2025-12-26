import * as forge from 'node-forge';
import type {
    HSMProvider,
    HSMService,
    HSMConfig,
    HSMKeyReference,
    HSMIntegrationManager,
    HSMSigningRequest,
    HSMSigningResult,
    X509Certificate,
    CMSSignature,
    SignatureValidationResult,
    SigningAlgorithm,
    PublicKey,
} from './types';
import {
    HSMError,
    HSMConnectionError,
    HSMSigningError,
    DigitalSignatureError,
} from './types';

/**
 * HSM Integration Manager Implementation
 * 
 * Provides a unified interface for working with multiple Hardware Security Module providers:
 * - Google Cloud HSM
 * - AWS KMS
 * - Azure Key Vault
 * - PKCS#11 compatible HSMs
 */
export class HSMIntegrationManagerImpl implements HSMIntegrationManager {
    private providers = new Map<HSMProvider, HSMService>();
    private initialized = new Set<HSMProvider>();

    /**
     * Register HSM provider service
     */
    registerProvider(provider: HSMProvider, service: HSMService): void {
        this.providers.set(provider, service);
    }

    /**
     * Get HSM service by provider type
     */
    getProvider(provider: HSMProvider): HSMService | null {
        return this.providers.get(provider) || null;
    }

    /**
     * Sign document using specified HSM provider
     */
    async signWithHSM(
        document: Buffer,
        keyReference: HSMKeyReference,
        certificate: X509Certificate,
        config?: HSMConfig
    ): Promise<CMSSignature> {
        try {
            const service = this.getProvider(keyReference.provider);
            if (!service) {
                throw new HSMError(
                    `HSM provider not registered: ${keyReference.provider}`,
                    'PROVIDER_NOT_REGISTERED',
                    keyReference.provider
                );
            }

            // Initialize service if not already done
            if (!this.initialized.has(keyReference.provider) && config) {
                await service.initialize(config);
                this.initialized.add(keyReference.provider);
            }

            // Test connection
            const isConnected = await service.testConnection();
            if (!isConnected) {
                throw new HSMConnectionError(
                    keyReference.provider,
                    'Failed to connect to HSM provider'
                );
            }

            // Prepare document hash for signing
            const documentHash = this.createDocumentHash(document);

            // Create signing request
            const signingRequest: HSMSigningRequest = {
                keyReference,
                data: documentHash,
                algorithm: this.selectSigningAlgorithm(certificate),
                certificate,
            };

            // Sign with HSM
            const signingResult = await service.sign(signingRequest);

            // Create CMS signature structure
            const cmsSignature = await this.createCMSSignature(
                document,
                certificate,
                signingResult,
                keyReference
            );

            return cmsSignature;
        } catch (error) {
            if (error instanceof HSMError) {
                throw error;
            }
            throw new HSMSigningError(
                keyReference.provider,
                `Failed to sign with HSM: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Validate HSM signature
     */
    async validateHSMSignature(signature: CMSSignature): Promise<SignatureValidationResult> {
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

            // Validate certificate chain
            try {
                const chainValidation = await this.validateCertificateChain(signature.certificates);
                result.certificateChainValid = chainValidation.isValid;
                if (!chainValidation.isValid) {
                    result.errors.push('Certificate chain validation failed');
                }
            } catch (error) {
                result.errors.push(`Certificate chain validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }

            // Validate signature cryptographically
            try {
                const signatureValid = await this.validateSignatureCryptographically(signature);
                result.documentIntegrityValid = signatureValid;
                if (!signatureValid) {
                    result.errors.push('Cryptographic signature validation failed');
                }
            } catch (error) {
                result.errors.push(`Signature validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
                result.warnings.push('No timestamp present in signature');
                result.timestampValid = true; // Not required, so consider valid
            }

            // Overall validation result
            result.isValid = result.certificateChainValid &&
                result.documentIntegrityValid &&
                result.timestampValid &&
                result.errors.length === 0;

            return result;
        } catch (error) {
            throw new DigitalSignatureError(
                `Failed to validate HSM signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'HSM_SIGNATURE_VALIDATION_ERROR',
                error
            );
        }
    }

    /**
     * Get list of available HSM providers
     */
    getAvailableProviders(): HSMProvider[] {
        return Array.from(this.providers.keys());
    }

    /**
     * Initialize all registered providers
     */
    async initializeAllProviders(configs: Map<HSMProvider, HSMConfig>): Promise<void> {
        const initPromises = Array.from(this.providers.entries()).map(async ([provider, service]) => {
            const config = configs.get(provider);
            if (config) {
                try {
                    await service.initialize(config);
                    this.initialized.add(provider);
                } catch (error) {
                    throw new HSMConnectionError(
                        provider,
                        `Failed to initialize ${provider}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                        error
                    );
                }
            }
        });

        await Promise.all(initPromises);
    }

    /**
     * Test connectivity to all providers
     */
    async testAllConnections(): Promise<Map<HSMProvider, boolean>> {
        const results = new Map<HSMProvider, boolean>();

        for (const [provider, service] of this.providers) {
            try {
                const isConnected = await service.testConnection();
                results.set(provider, isConnected);
            } catch (error) {
                results.set(provider, false);
            }
        }

        return results;
    }

    /**
     * Close all HSM connections
     */
    async closeAllConnections(): Promise<void> {
        const closePromises = Array.from(this.providers.values()).map(service =>
            service.close().catch(() => {
                // Ignore errors when closing
            })
        );

        await Promise.all(closePromises);
        this.initialized.clear();
    }

    // Private helper methods

    /**
     * Create document hash for signing
     */
    private createDocumentHash(document: Buffer): Buffer {
        const md = forge.md.sha256.create();
        md.update(document.toString('binary'));
        return Buffer.from(md.digest().toHex(), 'hex');
    }

    /**
     * Select appropriate signing algorithm based on certificate
     */
    private selectSigningAlgorithm(certificate: X509Certificate): SigningAlgorithm {
        // Determine algorithm based on certificate public key
        const keyAlgorithm = certificate.publicKey.algorithm;
        const keySize = certificate.publicKey.keySize;

        if (keyAlgorithm === 'RSA') {
            // Use SHA-256 for most cases, SHA-512 for larger keys
            return keySize >= 4096 ? 'RSA_PKCS1_SHA512' : 'RSA_PKCS1_SHA256';
        } else if (keyAlgorithm === 'EC' || keyAlgorithm === 'ECDSA') {
            // Use appropriate ECDSA algorithm based on key size
            if (keySize >= 521) {
                return 'ECDSA_SHA512';
            } else if (keySize >= 384) {
                return 'ECDSA_SHA384';
            } else {
                return 'ECDSA_SHA256';
            }
        }

        // Default to RSA with SHA-256
        return 'RSA_PKCS1_SHA256';
    }

    /**
     * Create CMS signature structure from HSM signing result
     */
    private async createCMSSignature(
        document: Buffer,
        certificate: X509Certificate,
        signingResult: HSMSigningResult,
        keyReference: HSMKeyReference
    ): Promise<CMSSignature> {
        try {
            // Create signed attributes
            const signedAttributes = [
                {
                    oid: '1.2.840.113549.1.9.3', // contentType
                    value: Buffer.from('1.2.840.113549.1.7.1', 'utf8'), // id-data
                },
                {
                    oid: '1.2.840.113549.1.9.4', // messageDigest
                    value: this.createDocumentHash(document),
                },
                {
                    oid: '1.2.840.113549.1.9.5', // signingTime
                    value: Buffer.from(signingResult.timestamp.toISOString()),
                },
            ];

            // Create signer info
            const signerInfo = {
                certificate,
                signedAttributes,
                unsignedAttributes: [],
                signatureAlgorithm: signingResult.algorithm,
                signature: signingResult.signature,
            };

            // Create CMS signature
            const cmsSignature: CMSSignature = {
                signerInfo,
                certificates: [certificate],
                content: document,
                signature: signingResult.signature,
                raw: Buffer.alloc(0), // Will be populated by actual CMS encoding
            };

            return cmsSignature;
        } catch (error) {
            throw new HSMSigningError(
                keyReference.provider,
                `Failed to create CMS signature: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Validate certificate chain
     */
    private async validateCertificateChain(certificates: X509Certificate[]): Promise<{ isValid: boolean }> {
        // Simplified validation - in production, this would use the certificate manager
        return { isValid: certificates.length > 0 };
    }

    /**
     * Validate signature cryptographically
     */
    private async validateSignatureCryptographically(signature: CMSSignature): Promise<boolean> {
        try {
            // Convert certificate to forge format for verification
            const forgeCert = forge.pki.certificateFromPem(signature.signerInfo.certificate.raw.toString());

            // Create document hash
            const documentHash = this.createDocumentHash(signature.content);

            // Verify signature using certificate public key
            const publicKey = forgeCert.publicKey;
            const md = forge.md.sha256.create();
            md.update(documentHash.toString('binary'));

            return (publicKey as any).verify(md.digest().bytes(), signature.signature.toString('binary'));
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate timestamp
     */
    private async validateTimestamp(timestamp: any): Promise<boolean> {
        // Simplified timestamp validation
        // In production, this would verify the timestamp signature and certificate
        return timestamp && timestamp.timestamp instanceof Date;
    }
}

/**
 * Create and configure HSM Integration Manager with default providers
 */
export function createHSMIntegrationManager(): HSMIntegrationManager {
    const manager = new HSMIntegrationManagerImpl();

    // Register default providers (they will be imported and registered separately)
    // This allows for lazy loading of provider implementations

    return manager;
}

/**
 * Default HSM configuration factory
 */
export function createDefaultHSMConfig(provider: HSMProvider, credentials: any): HSMConfig {
    return {
        provider,
        credentials,
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
    };
}