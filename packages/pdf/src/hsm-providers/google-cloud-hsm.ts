// @ts-ignore - Optional dependency
let KeyManagementServiceClient: any;
try {
    KeyManagementServiceClient = require('@google-cloud/kms').KeyManagementServiceClient;
} catch (error) {
    KeyManagementServiceClient = class MockKeyManagementServiceClient {
        constructor() {
            throw new Error('@google-cloud/kms dependency not installed');
        }
    };
}
import type {
    HSMService,
    HSMConfig,
    HSMKeyReference,
    HSMSigningRequest,
    HSMSigningResult,
    HSMKeyInfo,
    PublicKey,
    SigningAlgorithm,
} from '../types';
import {
    HSMError,
    HSMConnectionError,
    HSMSigningError,
    HSMKeyNotFoundError,
    HSMAuthenticationError,
} from '../types';

/**
 * Google Cloud HSM Service Implementation
 * 
 * Provides integration with Google Cloud Key Management Service (KMS)
 * for hardware-backed cryptographic operations.
 */
export class GoogleCloudHSMService implements HSMService {
    private client: any = null;
    private config: HSMConfig | null = null;
    private projectId: string | null = null;
    private locationId: string = 'global';

    /**
     * Initialize Google Cloud HSM connection
     */
    async initialize(config: HSMConfig): Promise<void> {
        try {
            this.config = config;

            // Extract project ID from credentials or environment
            this.projectId = this.extractProjectId(config);
            if (!this.projectId) {
                throw new HSMAuthenticationError(
                    'google-cloud-hsm',
                    'Project ID not found in configuration or environment'
                );
            }

            // Initialize KMS client with credentials
            const clientOptions: any = {};

            if (config.credentials?.googleApplicationCredentials) {
                clientOptions.keyFilename = config.credentials.googleApplicationCredentials;
            }

            if (config.credentials?.googleCloudKeyPath) {
                // Parse key path to extract project and location
                const keyPathParts = config.credentials.googleCloudKeyPath.split('/');
                if (keyPathParts.length >= 6) {
                    this.projectId = keyPathParts[1];
                    this.locationId = keyPathParts[3];
                }
            }

            this.client = new KeyManagementServiceClient(clientOptions);

            // Test the connection
            await this.testConnection();
        } catch (error) {
            throw new HSMConnectionError(
                'google-cloud-hsm',
                `Failed to initialize Google Cloud HSM: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Sign data using Google Cloud HSM key
     */
    async sign(request: HSMSigningRequest): Promise<HSMSigningResult> {
        try {
            if (!this.client) {
                throw new HSMConnectionError('google-cloud-hsm', 'HSM client not initialized');
            }

            // Build key name for Google Cloud KMS
            const keyName = this.buildKeyName(request.keyReference);

            // Convert signing algorithm to Google Cloud format
            const algorithm = this.convertSigningAlgorithm(request.algorithm);

            // Prepare signing request
            const [response] = await this.client.asymmetricSign({
                name: keyName,
                digest: {
                    sha256: request.data,
                },
                digestCrc32c: this.calculateCRC32C(request.data),
            });

            if (!response.signature) {
                throw new HSMSigningError(
                    'google-cloud-hsm',
                    'No signature returned from Google Cloud KMS'
                );
            }

            // Verify the signature CRC32C if provided
            if (response.signatureCrc32c && response.signatureCrc32c.value) {
                const expectedCrc = this.calculateCRC32C(Buffer.from(response.signature));
                if (expectedCrc !== response.signatureCrc32c.value) {
                    throw new HSMSigningError(
                        'google-cloud-hsm',
                        'Signature CRC32C verification failed'
                    );
                }
            }

            return {
                signature: Buffer.from(response.signature),
                algorithm: request.algorithm,
                keyId: request.keyReference.keyId,
                timestamp: new Date(),
                metadata: {
                    keyName,
                    algorithm,
                    crc32c: response.signatureCrc32c?.value,
                },
            };
        } catch (error) {
            if (error instanceof HSMError) {
                throw error;
            }

            // Handle specific Google Cloud errors
            if (error && typeof error === 'object' && 'code' in error) {
                const gcloudError = error as any;
                switch (gcloudError.code) {
                    case 5: // NOT_FOUND
                        throw new HSMKeyNotFoundError(
                            'google-cloud-hsm',
                            request.keyReference.keyId,
                            error
                        );
                    case 7: // PERMISSION_DENIED
                        throw new HSMAuthenticationError(
                            'google-cloud-hsm',
                            'Permission denied accessing Google Cloud KMS',
                            error
                        );
                    default:
                        throw new HSMSigningError(
                            'google-cloud-hsm',
                            `Google Cloud KMS error: ${gcloudError.message || 'Unknown error'}`,
                            error
                        );
                }
            }

            throw new HSMSigningError(
                'google-cloud-hsm',
                `Failed to sign with Google Cloud HSM: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Get public key from Google Cloud HSM
     */
    async getPublicKey(keyReference: HSMKeyReference): Promise<PublicKey> {
        try {
            if (!this.client) {
                throw new HSMConnectionError('google-cloud-hsm', 'HSM client not initialized');
            }

            const keyName = this.buildKeyName(keyReference);

            const [response] = await this.client.getPublicKey({
                name: keyName,
            });

            if (!response.pem) {
                throw new HSMError(
                    'No public key returned from Google Cloud KMS',
                    'NO_PUBLIC_KEY',
                    'google-cloud-hsm'
                );
            }

            // Parse the public key to determine algorithm and size
            const { algorithm, keySize } = this.parsePublicKeyInfo(response.pem, response.algorithm);

            return {
                algorithm,
                keySize,
                raw: Buffer.from(response.pem, 'utf8'),
            };
        } catch (error) {
            if (error instanceof HSMError) {
                throw error;
            }

            throw new HSMError(
                `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'GET_PUBLIC_KEY_ERROR',
                'google-cloud-hsm',
                error
            );
        }
    }

    /**
     * List available keys in Google Cloud HSM
     */
    async listKeys(): Promise<HSMKeyInfo[]> {
        try {
            if (!this.client || !this.projectId) {
                throw new HSMConnectionError('google-cloud-hsm', 'HSM client not initialized');
            }

            const keyRingName = `projects/${this.projectId}/locations/${this.locationId}/keyRings/default`;

            const [keys] = await this.client.listCryptoKeys({
                parent: keyRingName,
            });

            return keys
                .filter((key: any) => key.purpose === 'ASYMMETRIC_SIGN')
                .map((key: any) => this.convertToHSMKeyInfo(key));
        } catch (error) {
            throw new HSMError(
                `Failed to list keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'LIST_KEYS_ERROR',
                'google-cloud-hsm',
                error
            );
        }
    }

    /**
     * Create new key in Google Cloud HSM
     */
    async createKey(keyType: 'RSA' | 'EC', keySize: number, keyId?: string): Promise<HSMKeyInfo> {
        try {
            if (!this.client || !this.projectId) {
                throw new HSMConnectionError('google-cloud-hsm', 'HSM client not initialized');
            }

            const keyRingName = `projects/${this.projectId}/locations/${this.locationId}/keyRings/default`;
            const cryptoKeyId = keyId || `key-${Date.now()}`;

            // Determine algorithm based on key type and size
            const algorithm = this.determineKeyAlgorithm(keyType, keySize);

            const [key] = await this.client.createCryptoKey({
                parent: keyRingName,
                cryptoKeyId,
                cryptoKey: {
                    purpose: 'ASYMMETRIC_SIGN',
                    versionTemplate: {
                        algorithm,
                        protectionLevel: 'HSM',
                    },
                },
            });

            return this.convertToHSMKeyInfo(key);
        } catch (error) {
            throw new HSMError(
                `Failed to create key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'CREATE_KEY_ERROR',
                'google-cloud-hsm',
                error
            );
        }
    }

    /**
     * Delete key from Google Cloud HSM
     */
    async deleteKey(keyReference: HSMKeyReference): Promise<void> {
        try {
            if (!this.client) {
                throw new HSMConnectionError('google-cloud-hsm', 'HSM client not initialized');
            }

            const keyName = this.buildKeyName(keyReference);

            await this.client.destroyCryptoKeyVersion({
                name: keyName,
            });
        } catch (error) {
            throw new HSMError(
                `Failed to delete key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DELETE_KEY_ERROR',
                'google-cloud-hsm',
                error
            );
        }
    }

    /**
     * Test Google Cloud HSM connectivity
     */
    async testConnection(): Promise<boolean> {
        try {
            if (!this.client || !this.projectId) {
                return false;
            }

            // Try to list key rings to test connectivity
            const locationName = `projects/${this.projectId}/locations/${this.locationId}`;
            await this.client.listKeyRings({
                parent: locationName,
                pageSize: 1,
            });

            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Close Google Cloud HSM connection
     */
    async close(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
        }
        this.config = null;
        this.projectId = null;
    }

    // Private helper methods

    /**
     * Extract project ID from configuration
     */
    private extractProjectId(config: HSMConfig): string | null {
        // Try to get from key path first
        if (config.credentials?.googleCloudKeyPath) {
            const keyPathParts = config.credentials.googleCloudKeyPath.split('/');
            if (keyPathParts.length >= 2 && keyPathParts[0] === 'projects') {
                return keyPathParts[1];
            }
        }

        // Try environment variables
        return process.env.GOOGLE_CLOUD_PROJECT ||
            process.env.GCLOUD_PROJECT ||
            process.env.GCP_PROJECT ||
            null;
    }

    /**
     * Build full key name for Google Cloud KMS
     */
    private buildKeyName(keyReference: HSMKeyReference): string {
        if (keyReference.keyId.startsWith('projects/')) {
            return keyReference.keyId;
        }

        const projectId = keyReference.projectId || this.projectId;
        const location = keyReference.region || this.locationId;
        const version = keyReference.keyVersion || '1';

        return `projects/${projectId}/locations/${location}/keyRings/default/cryptoKeys/${keyReference.keyId}/cryptoKeyVersions/${version}`;
    }

    /**
     * Convert signing algorithm to Google Cloud format
     */
    private convertSigningAlgorithm(algorithm: SigningAlgorithm): string {
        const algorithmMap: Record<SigningAlgorithm, string> = {
            'RSA_PKCS1_SHA256': 'RSA_SIGN_PKCS1_2048_SHA256',
            'RSA_PKCS1_SHA384': 'RSA_SIGN_PKCS1_3072_SHA384',
            'RSA_PKCS1_SHA512': 'RSA_SIGN_PKCS1_4096_SHA512',
            'RSA_PSS_SHA256': 'RSA_SIGN_PSS_2048_SHA256',
            'RSA_PSS_SHA384': 'RSA_SIGN_PSS_3072_SHA384',
            'RSA_PSS_SHA512': 'RSA_SIGN_PSS_4096_SHA512',
            'ECDSA_SHA256': 'EC_SIGN_P256_SHA256',
            'ECDSA_SHA384': 'EC_SIGN_P384_SHA384',
            'ECDSA_SHA512': 'EC_SIGN_P521_SHA512',
        };

        return algorithmMap[algorithm] || 'RSA_SIGN_PKCS1_2048_SHA256';
    }

    /**
     * Calculate CRC32C checksum
     */
    private calculateCRC32C(data: Buffer): number {
        // Simplified CRC32C calculation
        // In production, use a proper CRC32C library
        let crc = 0xFFFFFFFF;
        for (let i = 0; i < data.length; i++) {
            crc ^= data[i];
            for (let j = 0; j < 8; j++) {
                crc = (crc >>> 1) ^ (0x82F63B78 & (-(crc & 1)));
            }
        }
        return (crc ^ 0xFFFFFFFF) >>> 0;
    }

    /**
     * Parse public key information from PEM
     */
    private parsePublicKeyInfo(pem: string, gcpAlgorithm?: string): { algorithm: string; keySize: number } {
        // Simplified parsing - in production, use proper ASN.1 parsing
        if (pem.includes('BEGIN RSA PUBLIC KEY') || gcpAlgorithm?.includes('RSA')) {
            // Determine RSA key size from algorithm name or PEM content
            if (gcpAlgorithm?.includes('4096')) return { algorithm: 'RSA', keySize: 4096 };
            if (gcpAlgorithm?.includes('3072')) return { algorithm: 'RSA', keySize: 3072 };
            return { algorithm: 'RSA', keySize: 2048 };
        } else if (pem.includes('BEGIN EC PUBLIC KEY') || gcpAlgorithm?.includes('EC')) {
            // Determine EC key size from algorithm name
            if (gcpAlgorithm?.includes('P521')) return { algorithm: 'EC', keySize: 521 };
            if (gcpAlgorithm?.includes('P384')) return { algorithm: 'EC', keySize: 384 };
            return { algorithm: 'EC', keySize: 256 };
        }

        return { algorithm: 'RSA', keySize: 2048 };
    }

    /**
     * Convert Google Cloud key to HSMKeyInfo
     */
    private convertToHSMKeyInfo(key: any): HSMKeyInfo {
        const keyName = key.name || '';
        const keyId = keyName.split('/').pop() || '';
        const algorithm = key.versionTemplate?.algorithm || '';

        const { algorithm: keyType, keySize } = this.parsePublicKeyInfo('', algorithm);

        return {
            keyId,
            keyType: keyType as 'RSA' | 'EC',
            keySize,
            algorithm: this.getSupportedAlgorithms(keyType, keySize),
            created: key.createTime ? new Date(key.createTime.seconds * 1000) : new Date(),
            enabled: key.state === 'ENABLED',
            metadata: {
                name: keyName,
                gcpAlgorithm: algorithm,
                protectionLevel: key.versionTemplate?.protectionLevel,
            },
        };
    }

    /**
     * Get supported algorithms for key type and size
     */
    private getSupportedAlgorithms(keyType: string, keySize: number): SigningAlgorithm[] {
        if (keyType === 'RSA') {
            const algorithms: SigningAlgorithm[] = ['RSA_PKCS1_SHA256'];
            if (keySize >= 3072) algorithms.push('RSA_PKCS1_SHA384', 'RSA_PSS_SHA384');
            if (keySize >= 4096) algorithms.push('RSA_PKCS1_SHA512', 'RSA_PSS_SHA512');
            return algorithms;
        } else if (keyType === 'EC') {
            if (keySize >= 521) return ['ECDSA_SHA512'];
            if (keySize >= 384) return ['ECDSA_SHA384'];
            return ['ECDSA_SHA256'];
        }
        return ['RSA_PKCS1_SHA256'];
    }

    /**
     * Determine Google Cloud algorithm for key creation
     */
    private determineKeyAlgorithm(keyType: 'RSA' | 'EC', keySize: number): string {
        if (keyType === 'RSA') {
            if (keySize >= 4096) return 'RSA_SIGN_PKCS1_4096_SHA512';
            if (keySize >= 3072) return 'RSA_SIGN_PKCS1_3072_SHA384';
            return 'RSA_SIGN_PKCS1_2048_SHA256';
        } else if (keyType === 'EC') {
            if (keySize >= 521) return 'EC_SIGN_P521_SHA512';
            if (keySize >= 384) return 'EC_SIGN_P384_SHA384';
            return 'EC_SIGN_P256_SHA256';
        }

        return 'RSA_SIGN_PKCS1_2048_SHA256';
    }
}