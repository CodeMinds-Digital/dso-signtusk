// @ts-ignore - Optional dependency
let AWS: any;
try {
    AWS = require('aws-sdk');
} catch (error) {
    AWS = {
        KMS: class MockKMS {
            constructor() {
                throw new Error('aws-sdk dependency not installed');
            }
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
 * AWS KMS Service Implementation
 * 
 * Provides integration with AWS Key Management Service (KMS)
 * for hardware-backed cryptographic operations.
 */
export class AWSKMSService implements HSMService {
    private client: any = null;
    private config: HSMConfig | null = null;
    private region: string = 'us-east-1';

    /**
     * Initialize AWS KMS connection
     */
    async initialize(config: HSMConfig): Promise<void> {
        try {
            this.config = config;

            // Configure AWS SDK
            const awsConfig: any = {
                region: config.credentials?.awsRegion || this.region,
            };

            if (config.credentials?.awsAccessKeyId && config.credentials?.awsSecretAccessKey) {
                awsConfig.accessKeyId = config.credentials.awsAccessKeyId;
                awsConfig.secretAccessKey = config.credentials.awsSecretAccessKey;

                if (config.credentials.awsSessionToken) {
                    awsConfig.sessionToken = config.credentials.awsSessionToken;
                }
            }

            this.client = new AWS.KMS(awsConfig);
            this.region = awsConfig.region || this.region;

            // Test the connection
            await this.testConnection();
        } catch (error) {
            throw new HSMConnectionError(
                'aws-kms',
                `Failed to initialize AWS KMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Sign data using AWS KMS key
     */
    async sign(request: HSMSigningRequest): Promise<HSMSigningResult> {
        try {
            if (!this.client) {
                throw new HSMConnectionError('aws-kms', 'HSM client not initialized');
            }

            // Convert signing algorithm to AWS format
            const signingAlgorithm = this.convertSigningAlgorithm(request.algorithm);
            const messageType = 'DIGEST'; // We're signing a pre-computed hash

            // Prepare signing request
            const params: any = {
                KeyId: request.keyReference.keyId,
                Message: request.data,
                MessageType: messageType,
                SigningAlgorithm: signingAlgorithm,
            };

            // Sign with AWS KMS
            const response = await this.client.sign(params).promise();

            if (!response.Signature) {
                throw new HSMSigningError(
                    'aws-kms',
                    'No signature returned from AWS KMS'
                );
            }

            return {
                signature: Buffer.from(response.Signature),
                algorithm: request.algorithm,
                keyId: response.KeyId || request.keyReference.keyId,
                timestamp: new Date(),
                metadata: {
                    signingAlgorithm,
                    messageType,
                },
            };
        } catch (error) {
            if (error instanceof HSMError) {
                throw error;
            }

            // Handle specific AWS errors
            if (error && typeof error === 'object' && 'code' in error) {
                const awsError = error as any;
                switch (awsError.code) {
                    case 'NotFoundException':
                        throw new HSMKeyNotFoundError(
                            'aws-kms',
                            request.keyReference.keyId,
                            error
                        );
                    case 'AccessDeniedException':
                    case 'UnauthorizedException':
                        throw new HSMAuthenticationError(
                            'aws-kms',
                            'Permission denied accessing AWS KMS',
                            error
                        );
                    case 'InvalidKeyUsageException':
                        throw new HSMSigningError(
                            'aws-kms',
                            'Key cannot be used for signing operations',
                            error
                        );
                    default:
                        throw new HSMSigningError(
                            'aws-kms',
                            `AWS KMS error: ${awsError.message || 'Unknown error'}`,
                            error
                        );
                }
            }

            throw new HSMSigningError(
                'aws-kms',
                `Failed to sign with AWS KMS: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Get public key from AWS KMS
     */
    async getPublicKey(keyReference: HSMKeyReference): Promise<PublicKey> {
        try {
            if (!this.client) {
                throw new HSMConnectionError('aws-kms', 'HSM client not initialized');
            }

            const params: any = {
                KeyId: keyReference.keyId,
            };

            const response = await this.client.getPublicKey(params).promise();

            if (!response.PublicKey) {
                throw new HSMError(
                    'No public key returned from AWS KMS',
                    'NO_PUBLIC_KEY',
                    'aws-kms'
                );
            }

            // Parse key spec to determine algorithm and size
            const { algorithm, keySize } = this.parseKeySpec(response.KeySpec || '');

            return {
                algorithm,
                keySize,
                raw: Buffer.from(response.PublicKey),
            };
        } catch (error) {
            if (error instanceof HSMError) {
                throw error;
            }

            throw new HSMError(
                `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'GET_PUBLIC_KEY_ERROR',
                'aws-kms',
                error
            );
        }
    }

    /**
     * List available keys in AWS KMS
     */
    async listKeys(): Promise<HSMKeyInfo[]> {
        try {
            if (!this.client) {
                throw new HSMConnectionError('aws-kms', 'HSM client not initialized');
            }

            const keys: HSMKeyInfo[] = [];
            let nextMarker: string | undefined;

            do {
                const params: any = {
                    Limit: 100,
                    Marker: nextMarker,
                };

                const response = await this.client.listKeys(params).promise();

                if (response.Keys) {
                    for (const key of response.Keys) {
                        if (key.KeyId) {
                            try {
                                const keyInfo = await this.getKeyInfo(key.KeyId);
                                // Only include keys that can be used for signing
                                if (keyInfo.metadata?.keyUsage === 'SIGN_VERIFY') {
                                    keys.push(keyInfo);
                                }
                            } catch (error) {
                                // Skip keys we can't access
                                continue;
                            }
                        }
                    }
                }

                nextMarker = response.NextMarker;
            } while (nextMarker);

            return keys;
        } catch (error) {
            throw new HSMError(
                `Failed to list keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'LIST_KEYS_ERROR',
                'aws-kms',
                error
            );
        }
    }

    /**
     * Create new key in AWS KMS
     */
    async createKey(keyType: 'RSA' | 'EC', keySize: number, keyId?: string): Promise<HSMKeyInfo> {
        try {
            if (!this.client) {
                throw new HSMConnectionError('aws-kms', 'HSM client not initialized');
            }

            // Determine key spec based on type and size
            const keySpec = this.determineKeySpec(keyType, keySize);

            const params: any = {
                KeyUsage: 'SIGN_VERIFY',
                KeySpec: keySpec,
                Origin: 'AWS_KMS',
                Description: keyId ? `HSM key: ${keyId}` : 'HSM signing key',
                Tags: keyId ? [{ TagKey: 'Name', TagValue: keyId }] : undefined,
            };

            const response = await this.client.createKey(params).promise();

            if (!response.KeyMetadata || !response.KeyMetadata.KeyId) {
                throw new HSMError(
                    'Failed to create key in AWS KMS',
                    'CREATE_KEY_ERROR',
                    'aws-kms'
                );
            }

            return await this.getKeyInfo(response.KeyMetadata.KeyId);
        } catch (error) {
            throw new HSMError(
                `Failed to create key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'CREATE_KEY_ERROR',
                'aws-kms',
                error
            );
        }
    }

    /**
     * Delete key from AWS KMS
     */
    async deleteKey(keyReference: HSMKeyReference): Promise<void> {
        try {
            if (!this.client) {
                throw new HSMConnectionError('aws-kms', 'HSM client not initialized');
            }

            // AWS KMS doesn't allow immediate deletion, schedule for deletion
            const params: any = {
                KeyId: keyReference.keyId,
                PendingWindowInDays: 7, // Minimum allowed
            };

            await this.client.scheduleKeyDeletion(params).promise();
        } catch (error) {
            throw new HSMError(
                `Failed to delete key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DELETE_KEY_ERROR',
                'aws-kms',
                error
            );
        }
    }

    /**
     * Test AWS KMS connectivity
     */
    async testConnection(): Promise<boolean> {
        try {
            if (!this.client) {
                return false;
            }

            // Try to list keys to test connectivity
            await this.client.listKeys({ Limit: 1 }).promise();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Close AWS KMS connection
     */
    async close(): Promise<void> {
        // AWS SDK doesn't require explicit connection closing
        this.client = null;
        this.config = null;
    }

    // Private helper methods

    /**
     * Convert signing algorithm to AWS format
     */
    private convertSigningAlgorithm(algorithm: SigningAlgorithm): string {
        const algorithmMap: Record<SigningAlgorithm, string> = {
            'RSA_PKCS1_SHA256': 'RSASSA_PKCS1_V1_5_SHA_256',
            'RSA_PKCS1_SHA384': 'RSASSA_PKCS1_V1_5_SHA_384',
            'RSA_PKCS1_SHA512': 'RSASSA_PKCS1_V1_5_SHA_512',
            'RSA_PSS_SHA256': 'RSASSA_PSS_SHA_256',
            'RSA_PSS_SHA384': 'RSASSA_PSS_SHA_384',
            'RSA_PSS_SHA512': 'RSASSA_PSS_SHA_512',
            'ECDSA_SHA256': 'ECDSA_SHA_256',
            'ECDSA_SHA384': 'ECDSA_SHA_384',
            'ECDSA_SHA512': 'ECDSA_SHA_512',
        };

        return algorithmMap[algorithm] || 'RSASSA_PKCS1_V1_5_SHA_256';
    }

    /**
     * Parse AWS key spec to determine algorithm and size
     */
    private parseKeySpec(keySpec: string): { algorithm: string; keySize: number } {
        if (keySpec.startsWith('RSA_')) {
            const sizeMatch = keySpec.match(/(\d+)/);
            const keySize = sizeMatch ? parseInt(sizeMatch[1], 10) : 2048;
            return { algorithm: 'RSA', keySize };
        } else if (keySpec.startsWith('ECC_')) {
            if (keySpec.includes('521')) return { algorithm: 'EC', keySize: 521 };
            if (keySpec.includes('384')) return { algorithm: 'EC', keySize: 384 };
            return { algorithm: 'EC', keySize: 256 };
        }

        return { algorithm: 'RSA', keySize: 2048 };
    }

    /**
     * Determine AWS key spec for key creation
     */
    private determineKeySpec(keyType: 'RSA' | 'EC', keySize: number): string {
        if (keyType === 'RSA') {
            if (keySize >= 4096) return 'RSA_4096';
            if (keySize >= 3072) return 'RSA_3072';
            return 'RSA_2048';
        } else if (keyType === 'EC') {
            if (keySize >= 521) return 'ECC_NIST_P521';
            if (keySize >= 384) return 'ECC_NIST_P384';
            return 'ECC_NIST_P256';
        }

        return 'RSA_2048';
    }

    /**
     * Get detailed key information
     */
    private async getKeyInfo(keyId: string): Promise<HSMKeyInfo> {
        if (!this.client) {
            throw new HSMConnectionError('aws-kms', 'HSM client not initialized');
        }

        const params: any = {
            KeyId: keyId,
        };

        const response = await this.client.describeKey(params).promise();

        if (!response.KeyMetadata) {
            throw new HSMError(
                'No key metadata returned from AWS KMS',
                'NO_KEY_METADATA',
                'aws-kms'
            );
        }

        const metadata = response.KeyMetadata;
        const { algorithm, keySize } = this.parseKeySpec(metadata.KeySpec || '');

        return {
            keyId: metadata.KeyId,
            keyType: algorithm as 'RSA' | 'EC',
            keySize,
            algorithm: this.getSupportedAlgorithms(algorithm, keySize),
            created: metadata.CreationDate || new Date(),
            enabled: metadata.Enabled || false,
            metadata: {
                arn: metadata.Arn,
                keyUsage: metadata.KeyUsage,
                keySpec: metadata.KeySpec,
                keyState: metadata.KeyState,
                description: metadata.Description,
            },
        };
    }

    /**
     * Get supported algorithms for key type and size
     */
    private getSupportedAlgorithms(keyType: string, keySize: number): SigningAlgorithm[] {
        if (keyType === 'RSA') {
            const algorithms: SigningAlgorithm[] = [
                'RSA_PKCS1_SHA256',
                'RSA_PSS_SHA256',
            ];
            if (keySize >= 3072) {
                algorithms.push('RSA_PKCS1_SHA384', 'RSA_PSS_SHA384');
            }
            if (keySize >= 4096) {
                algorithms.push('RSA_PKCS1_SHA512', 'RSA_PSS_SHA512');
            }
            return algorithms;
        } else if (keyType === 'EC') {
            if (keySize >= 521) return ['ECDSA_SHA512'];
            if (keySize >= 384) return ['ECDSA_SHA384'];
            return ['ECDSA_SHA256'];
        }
        return ['RSA_PKCS1_SHA256'];
    }
}