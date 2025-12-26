import * as forge from 'node-forge';
import type {
    X509Certificate,
    CertificateSubject,
    CertificateExtension,
    PublicKey,
    CertificateValidationResult,
    RevocationStatus,
} from './types';
import { CertificateError } from './types';

/**
 * Certificate Management System
 * 
 * Implements comprehensive X.509 certificate management including:
 * - Certificate parsing and validation
 * - Certificate chain building and verification
 * - Certificate revocation checking with OCSP
 * - Certificate store management and caching
 */
export interface CertificateManager {
    /**
     * Parse X.509 certificate from various formats
     */
    parseCertificate(certificateData: Buffer): Promise<X509Certificate>;

    /**
     * Build and validate certificate chain
     */
    validateCertificateChain(certificates: X509Certificate[]): Promise<CertificateValidationResult>;

    /**
     * Check certificate revocation status using OCSP
     */
    checkRevocationStatus(certificate: X509Certificate): Promise<RevocationStatus>;

    /**
     * Store certificate in cache with metadata
     */
    storeCertificate(certificate: X509Certificate, metadata: CertificateMetadata): Promise<void>;

    /**
     * Retrieve certificate from cache
     */
    getCertificate(fingerprint: string): Promise<X509Certificate | null>;

    /**
     * Build certificate chain from available certificates
     */
    buildCertificateChain(certificate: X509Certificate): Promise<X509Certificate[]>;

    /**
     * Validate certificate against trusted root CAs
     */
    validateAgainstTrustedRoots(certificate: X509Certificate): Promise<boolean>;

    /**
     * Add trusted root CA certificate
     */
    addTrustedRoot(certificate: X509Certificate): Promise<void>;

    /**
     * Remove certificate from cache
     */
    removeCertificate(fingerprint: string): Promise<void>;

    /**
     * Clear certificate cache
     */
    clearCache(): Promise<void>;
}

/**
 * Certificate metadata for storage and management
 */
export interface CertificateMetadata {
    source: 'uploaded' | 'chain' | 'trusted_root' | 'intermediate';
    addedAt: Date;
    lastValidated?: Date;
    validationResult?: CertificateValidationResult;
    tags?: string[];
    description?: string;
}

/**
 * OCSP request configuration
 */
export interface OCSPConfig {
    timeout: number;
    maxRetries: number;
    userAgent: string;
}

/**
 * Certificate store configuration
 */
export interface CertificateStoreConfig {
    maxCacheSize: number;
    cacheExpirationMs: number;
    enableOCSP: boolean;
    ocspConfig: OCSPConfig;
    trustedRootsPath?: string;
}

/**
 * Default configuration for certificate management
 */
const DEFAULT_CONFIG: CertificateStoreConfig = {
    maxCacheSize: 1000,
    cacheExpirationMs: 24 * 60 * 60 * 1000, // 24 hours
    enableOCSP: true,
    ocspConfig: {
        timeout: 10000, // 10 seconds
        maxRetries: 3,
        userAgent: 'DocuSign-Alternative-Certificate-Manager/1.0',
    },
};

/**
 * Certificate cache entry
 */
interface CertificateCacheEntry {
    certificate: X509Certificate;
    metadata: CertificateMetadata;
    cachedAt: Date;
    expiresAt: Date;
}

/**
 * Implementation of the Certificate Management System
 */
export class CertificateManagerImpl implements CertificateManager {
    private certificateCache = new Map<string, CertificateCacheEntry>();
    private trustedRoots = new Map<string, X509Certificate>();
    private intermediates = new Map<string, X509Certificate>();
    private config: CertificateStoreConfig;

    constructor(config: Partial<CertificateStoreConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.initializeTrustedRoots();
    }

    /**
     * Parse X.509 certificate from buffer data
     */
    async parseCertificate(certificateData: Buffer): Promise<X509Certificate> {
        try {
            let forgeCert: forge.pki.Certificate;

            // Try to parse as PEM first
            const pemString = certificateData.toString('utf8');
            if (pemString.includes('BEGIN CERTIFICATE')) {
                forgeCert = forge.pki.certificateFromPem(pemString);
            } else {
                // Try DER format
                const derString = certificateData.toString('binary');
                const asn1 = forge.asn1.fromDer(derString);
                forgeCert = forge.pki.certificateFromAsn1(asn1);
            }

            // Convert to our X509Certificate format
            const certificate = this.convertFromForgeCertificate(forgeCert, certificateData);

            return certificate;
        } catch (error) {
            throw new CertificateError(
                `Failed to parse certificate: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

            const leafCert = certificates[0];
            const now = new Date();

            // Check leaf certificate expiration
            if (leafCert.notBefore > now) {
                result.errors.push('Certificate is not yet valid');
            } else if (leafCert.notAfter < now) {
                result.errors.push('Certificate has expired');
            } else {
                result.notExpired = true;
            }

            // Build complete certificate chain
            const completeChain = await this.buildCompleteChain(certificates);

            // Validate chain structure
            const chainValidation = await this.validateChainStructure(completeChain);
            result.chainValid = chainValidation.isValid;
            result.errors.push(...chainValidation.errors);
            result.warnings.push(...chainValidation.warnings);

            // Check if chain leads to trusted root
            const rootCert = completeChain[completeChain.length - 1];
            result.trustedRoot = this.trustedRoots.has(rootCert.fingerprint);

            if (!result.trustedRoot) {
                result.warnings.push('Certificate chain does not lead to a trusted root');
            }

            // Check revocation status if OCSP is enabled
            if (this.config.enableOCSP) {
                try {
                    const revocationStatus = await this.checkRevocationStatus(leafCert);
                    result.notRevoked = !revocationStatus.isRevoked;

                    if (revocationStatus.isRevoked) {
                        result.errors.push(`Certificate is revoked: ${revocationStatus.reason || 'Unknown reason'}`);
                    }
                } catch (error) {
                    result.warnings.push(`Could not check revocation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    // Assume not revoked if we can't check
                    result.notRevoked = true;
                }
            } else {
                result.notRevoked = true;
                result.warnings.push('Revocation checking is disabled');
            }

            // Overall validation result
            result.isValid = result.chainValid &&
                result.notExpired &&
                result.notRevoked &&
                result.trustedRoot &&
                result.errors.length === 0;

            return result;
        } catch (error) {
            throw new CertificateError(
                `Failed to validate certificate chain: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Check certificate revocation status using OCSP
     */
    async checkRevocationStatus(certificate: X509Certificate): Promise<RevocationStatus> {
        try {
            // Find OCSP URL from certificate extensions
            const ocspUrl = this.extractOCSPUrl(certificate);

            if (!ocspUrl) {
                // Try CRL if no OCSP URL
                return this.checkCRLStatus(certificate);
            }

            // Create OCSP request
            const ocspRequest = await this.createOCSPRequest(certificate);

            // Send OCSP request
            const response = await this.sendOCSPRequest(ocspUrl, ocspRequest);

            // Parse OCSP response
            return this.parseOCSPResponse(response);
        } catch (error) {
            // If OCSP fails, try CRL as fallback
            try {
                return await this.checkCRLStatus(certificate);
            } catch (crlError) {
                throw new CertificateError(
                    `Failed to check revocation status: OCSP failed (${error instanceof Error ? error.message : 'Unknown error'}), CRL failed (${crlError instanceof Error ? crlError.message : 'Unknown error'})`,
                    error
                );
            }
        }
    }

    /**
     * Store certificate in cache with metadata
     */
    async storeCertificate(certificate: X509Certificate, metadata: CertificateMetadata): Promise<void> {
        try {
            // Check cache size limit
            if (this.certificateCache.size >= this.config.maxCacheSize) {
                await this.evictOldestEntries();
            }

            const now = new Date();
            const expiresAt = new Date(now.getTime() + this.config.cacheExpirationMs);

            const entry: CertificateCacheEntry = {
                certificate,
                metadata,
                cachedAt: now,
                expiresAt,
            };

            this.certificateCache.set(certificate.fingerprint, entry);

            // Store in appropriate collection based on metadata
            if (metadata.source === 'trusted_root') {
                this.trustedRoots.set(certificate.fingerprint, certificate);
            } else if (metadata.source === 'intermediate') {
                this.intermediates.set(certificate.fingerprint, certificate);
            }
        } catch (error) {
            throw new CertificateError(
                `Failed to store certificate: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Retrieve certificate from cache
     */
    async getCertificate(fingerprint: string): Promise<X509Certificate | null> {
        try {
            const entry = this.certificateCache.get(fingerprint);

            if (!entry) {
                return null;
            }

            // Check if entry has expired
            if (new Date() > entry.expiresAt) {
                this.certificateCache.delete(fingerprint);
                return null;
            }

            return entry.certificate;
        } catch (error) {
            throw new CertificateError(
                `Failed to retrieve certificate: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Build certificate chain from available certificates
     */
    async buildCertificateChain(certificate: X509Certificate): Promise<X509Certificate[]> {
        try {
            const chain: X509Certificate[] = [certificate];
            let currentCert = certificate;

            // Build chain up to root
            while (!this.isSelfSigned(currentCert)) {
                const issuerCert = await this.findIssuerCertificate(currentCert);

                if (!issuerCert) {
                    break;
                }

                // Avoid infinite loops
                if (chain.some(cert => cert.fingerprint === issuerCert.fingerprint)) {
                    break;
                }

                chain.push(issuerCert);
                currentCert = issuerCert;
            }

            return chain;
        } catch (error) {
            throw new CertificateError(
                `Failed to build certificate chain: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Validate certificate against trusted root CAs
     */
    async validateAgainstTrustedRoots(certificate: X509Certificate): Promise<boolean> {
        try {
            const chain = await this.buildCertificateChain(certificate);
            const rootCert = chain[chain.length - 1];

            return this.trustedRoots.has(rootCert.fingerprint);
        } catch (error) {
            return false;
        }
    }

    /**
     * Add trusted root CA certificate
     */
    async addTrustedRoot(certificate: X509Certificate): Promise<void> {
        try {
            this.trustedRoots.set(certificate.fingerprint, certificate);

            await this.storeCertificate(certificate, {
                source: 'trusted_root',
                addedAt: new Date(),
                description: 'Trusted root CA certificate',
            });
        } catch (error) {
            throw new CertificateError(
                `Failed to add trusted root: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Remove certificate from cache
     */
    async removeCertificate(fingerprint: string): Promise<void> {
        try {
            this.certificateCache.delete(fingerprint);
            this.trustedRoots.delete(fingerprint);
            this.intermediates.delete(fingerprint);
        } catch (error) {
            throw new CertificateError(
                `Failed to remove certificate: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Clear certificate cache
     */
    async clearCache(): Promise<void> {
        try {
            this.certificateCache.clear();
            // Don't clear trusted roots as they should persist
        } catch (error) {
            throw new CertificateError(
                `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    // Private helper methods

    /**
     * Initialize trusted root certificates
     */
    private async initializeTrustedRoots(): Promise<void> {
        // In a production system, you would load trusted root CAs from:
        // - System certificate store
        // - Mozilla CA bundle
        // - Custom trusted roots configuration

        // For now, we'll create a minimal set for testing
        // This would be replaced with actual root CA loading
    }

    /**
     * Convert forge certificate to our X509Certificate format
     */
    private convertFromForgeCertificate(forgeCert: forge.pki.Certificate, rawData: Buffer): X509Certificate {
        const subject = this.parseCertificateSubject(forgeCert.subject.attributes);
        const issuer = this.parseCertificateSubject(forgeCert.issuer.attributes);

        const publicKey: PublicKey = {
            algorithm: 'RSA', // Simplified - would need to detect actual algorithm
            keySize: (forgeCert.publicKey as any).n?.bitLength() || 2048,
            raw: Buffer.from(forge.pki.publicKeyToPem(forgeCert.publicKey)),
        };

        const extensions: CertificateExtension[] = forgeCert.extensions.map(ext => ({
            oid: ext.id || '',
            critical: ext.critical || false,
            value: Buffer.from(ext.value || '', 'binary'),
        }));

        // Calculate fingerprint
        const fingerprint = forge.md.sha256.create()
            .update(forge.asn1.toDer(forge.pki.certificateToAsn1(forgeCert)).getBytes())
            .digest()
            .toHex();

        return {
            subject,
            issuer,
            serialNumber: forgeCert.serialNumber,
            notBefore: forgeCert.validity.notBefore,
            notAfter: forgeCert.validity.notAfter,
            publicKey,
            fingerprint,
            extensions,
            raw: rawData,
        };
    }

    /**
     * Parse certificate subject/issuer information
     */
    private parseCertificateSubject(attributes: forge.pki.CertificateField[]): CertificateSubject {
        const subject: CertificateSubject = {};

        attributes.forEach(attr => {
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
     * Build complete certificate chain including intermediates
     */
    private async buildCompleteChain(certificates: X509Certificate[]): Promise<X509Certificate[]> {
        const chain = [...certificates];
        let currentCert = certificates[certificates.length - 1];

        // Try to extend chain with cached intermediates
        while (!this.isSelfSigned(currentCert)) {
            const issuer = await this.findIssuerCertificate(currentCert);
            if (!issuer || chain.some(cert => cert.fingerprint === issuer.fingerprint)) {
                break;
            }
            chain.push(issuer);
            currentCert = issuer;
        }

        return chain;
    }

    /**
     * Validate certificate chain structure
     */
    private async validateChainStructure(chain: X509Certificate[]): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
        const result = { isValid: true, errors: [] as string[], warnings: [] as string[] };

        for (let i = 0; i < chain.length - 1; i++) {
            const cert = chain[i];
            const issuer = chain[i + 1];

            // Verify that issuer's subject matches cert's issuer
            if (!this.subjectsMatch(cert.issuer, issuer.subject)) {
                result.errors.push(`Certificate ${i} issuer does not match certificate ${i + 1} subject`);
                result.isValid = false;
            }

            // Verify signature (simplified check)
            try {
                const isValidSignature = await this.verifyCertificateSignature(cert, issuer);
                if (!isValidSignature) {
                    result.errors.push(`Certificate ${i} signature verification failed`);
                    result.isValid = false;
                }
            } catch (error) {
                result.warnings.push(`Could not verify signature for certificate ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return result;
    }

    /**
     * Check if certificate is self-signed
     */
    private isSelfSigned(certificate: X509Certificate): boolean {
        return this.subjectsMatch(certificate.subject, certificate.issuer);
    }

    /**
     * Check if two certificate subjects match
     */
    private subjectsMatch(subject1: CertificateSubject, subject2: CertificateSubject): boolean {
        return subject1.commonName === subject2.commonName &&
            subject1.organizationName === subject2.organizationName &&
            subject1.countryName === subject2.countryName;
    }

    /**
     * Find issuer certificate for a given certificate
     */
    private async findIssuerCertificate(certificate: X509Certificate): Promise<X509Certificate | null> {
        // Search in trusted roots first
        for (const [, rootCert] of this.trustedRoots) {
            if (this.subjectsMatch(certificate.issuer, rootCert.subject)) {
                return rootCert;
            }
        }

        // Search in intermediates
        for (const [, intermediateCert] of this.intermediates) {
            if (this.subjectsMatch(certificate.issuer, intermediateCert.subject)) {
                return intermediateCert;
            }
        }

        // Search in cache
        for (const [, entry] of this.certificateCache) {
            if (this.subjectsMatch(certificate.issuer, entry.certificate.subject)) {
                return entry.certificate;
            }
        }

        return null;
    }

    /**
     * Verify certificate signature against issuer
     */
    private async verifyCertificateSignature(certificate: X509Certificate, issuer: X509Certificate): Promise<boolean> {
        try {
            // Convert to forge format for verification
            const forgeCert = forge.pki.certificateFromPem(certificate.raw.toString());
            const forgeIssuer = forge.pki.certificateFromPem(issuer.raw.toString());

            // Create CA store with issuer
            const caStore = forge.pki.createCaStore();
            caStore.addCertificate(forgeIssuer);

            // Verify certificate
            return forge.pki.verifyCertificateChain(caStore, [forgeCert]);
        } catch (error) {
            return false;
        }
    }

    /**
     * Extract OCSP URL from certificate extensions
     */
    private extractOCSPUrl(certificate: X509Certificate): string | null {
        // Look for Authority Information Access extension
        const aiaExtension = certificate.extensions.find(ext =>
            ext.oid === '1.3.6.1.5.5.7.1.1' // id-pe-authorityInfoAccess
        );

        if (!aiaExtension) {
            return null;
        }

        // Parse AIA extension to extract OCSP URL
        // This is a simplified implementation - real parsing would be more complex
        const aiaValue = aiaExtension.value.toString();
        const ocspMatch = aiaValue.match(/http[s]?:\/\/[^\s]+/);

        return ocspMatch ? ocspMatch[0] : null;
    }

    /**
     * Create OCSP request for certificate
     */
    private async createOCSPRequest(certificate: X509Certificate): Promise<Buffer> {
        // This is a placeholder for OCSP request creation
        // Real implementation would create proper OCSP request according to RFC 6960
        throw new CertificateError('OCSP request creation not implemented', 'NOT_IMPLEMENTED');
    }

    /**
     * Send OCSP request to OCSP responder
     */
    private async sendOCSPRequest(url: string, request: Buffer): Promise<Buffer> {
        // This is a placeholder for OCSP HTTP request
        // Real implementation would make HTTP POST request to OCSP responder
        throw new CertificateError('OCSP request sending not implemented', 'NOT_IMPLEMENTED');
    }

    /**
     * Parse OCSP response
     */
    private parseOCSPResponse(response: Buffer): RevocationStatus {
        // This is a placeholder for OCSP response parsing
        // Real implementation would parse OCSP response according to RFC 6960
        return {
            isRevoked: false,
            checkedAt: new Date(),
            method: 'OCSP',
        };
    }

    /**
     * Check certificate revocation status using CRL
     */
    private async checkCRLStatus(certificate: X509Certificate): Promise<RevocationStatus> {
        // This is a placeholder for CRL checking
        // Real implementation would download and parse CRL
        return {
            isRevoked: false,
            checkedAt: new Date(),
            method: 'CRL',
        };
    }

    /**
     * Evict oldest cache entries when cache is full
     */
    private async evictOldestEntries(): Promise<void> {
        const entries = Array.from(this.certificateCache.entries());
        entries.sort((a, b) => a[1].cachedAt.getTime() - b[1].cachedAt.getTime());

        // Remove oldest 10% of entries
        const toRemove = Math.ceil(entries.length * 0.1);
        for (let i = 0; i < toRemove; i++) {
            this.certificateCache.delete(entries[i][0]);
        }
    }
}