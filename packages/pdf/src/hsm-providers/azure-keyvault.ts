// @ts-ignore - Optional dependencies
let KeyClient: any, CryptographyClient: any, DefaultAzureCredential: any, ClientSecretCredential: any;
try {
    const keyVaultKeys = require('@azure/keyvault-keys');
    KeyClient = keyVaultKeys.KeyClient;
    CryptographyClient = keyVaultKeys.CryptographyClient;

    const identity = require('@azure/identity');
    DefaultAzureCredential = identity.DefaultAzureCredential;
    ClientSecretCredential = identity.ClientSecretCredential;
} catch (error) {
    KeyClient = class MockKeyClient {
        constructor() {
            throw new Error('@azure/keyvault-keys dependency not installed');
        }
    };
    CryptographyClient = class MockCryptographyClient {
        constructor() {
            throw new Error('@azure/keyvault-keys dependency not installed');
        }
    };
    DefaultAzureCredential = class MockDefaultAzureCredential {
        constructor() {
            throw new Error('@azure/identity dependency not installed');
        }
    };
    ClientSecretCredential = class MockClientSecretCredential {
        constructor() {
            throw new Error('@azure/identity dependency not installed');
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
 * Azure Key Vault Service Implementation
 * 
 * Provides integration with Azure Key Vault
 * for hardware-backed cryptographic operations.
 */
export class AzureKeyVaultService implements HSMService {
    private keyClient: any = null;
    private config: HSMConfig | null = null;
    private vaultUrl: string | null = null;

    /**
     * Initialize Azure Key Vault connection
     */
    async initialize(config: HSMConfig): Promise<void> {
        try {
            this.config = config;

            // Extract vault URL from configuration
            this.vaultUrl = config.credentials?.vaultUrl || null;
            if (!this.vaultUrl) {
                throw new HSMAuthenticationError(
                    'azure-keyvault',
                    'Vault URL not found in configuration'
                );
            }

            // Initialize Azure credentials
            let credential;
            if (config.credentials?.azureClientId &&
                config.credentials?.azureClientSecret &&
                config.credentials?.azureTenantId) {
                // Use service principal authentication
                credential = new ClientSecretCredential(
                    config.credentials.azureTenantId,
                    config.credentials.azureClientId,
                    config.credentials.azureClientSecret
                );
            } else {
                // Use default Azure credential (managed identity, Azure CLI, etc.)
                credential = new DefaultAzureCredential();
            }

            // Initialize Key Vault client
            this.keyClient = new KeyClient(this.vaultUrl, credential);

            // Test the connection
            await this.testConnection();
        } catch (error) {
            throw new HSMConnectionError(
                'azure-keyvault',
                `Failed to initialize Azure Key Vault: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Sign data using Azure Key Vault key
     */
    async sign(request: HSMSigningRequest): Promise<HSMSigningResult> {
        try {
            if (!this.keyClient || !this.vaultUrl) {
                throw new HSMConnectionError('azure-keyvault', 'HSM client not initialized');
            }

            // Get the key to create cryptography client
            const key = await this.keyClient.getKey(request.keyReference.keyId);
            if (!key.key) {
                throw new HSMKeyNotFoundError(
                    'azure-keyvault',
                    request.keyReference.keyId
                );
            }

            // Create cryptography client for signing operations
            const cryptoClient = new CryptographyClient(key, this.keyClient.credential);

            // Convert signing algorithm to Azure format
            const algorithm = this.convertSigningAlgorithm(request.algorithm);

            // Sign with Azure Key Vault
            const result = await cryptoClient.sign(algorithm, request.data);

            if (!result.result) {
                throw new HSMSigningError(
                    'azure-keyvault',
                    'No signature returned from Azure Key Vault'
                );
            }

            return {
                signature: Buffer.from(result.result),
                algorithm: request.algorithm,
                keyId: key.name || request.keyReference.keyId,
                timestamp: new Date(),
                metadata: {
                    keyId: key.key?.id,
                    algorithm,
                    keyVersion: key.properties.version,
                },
            };
        } catch (error) {
            if (error instanceof HSMError) {
                throw error;
            }

            // Handle specific Azure errors
            if (error && typeof error === 'object' && 'code' in error) {
                const azureError = error as any;
                switch (azureError.code) {
                    case 'KeyNotFound':
                        throw new HSMKeyNotFoundError(
                            'azure-keyvault',
                            request.keyReference.keyId,
                            error
                        );
                    case 'Forbidden':
                    case 'Unauthorized':
                        throw new HSMAuthenticationError(
                            'azure-keyvault',
                            'Permission denied accessing Azure Key Vault',
                            error
                        );
                    default:
                        throw new HSMSigningError(
                            'azure-keyvault',
                            `Azure Key Vault error: ${azureError.message || 'Unknown error'}`,
                            error
                        );
                }
            }

            throw new HSMSigningError(
                'azure-keyvault',
                `Failed to sign with Azure Key Vault: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Get public key from Azure Key Vault
     */
    async getPublicKey(keyReference: HSMKeyReference): Promise<PublicKey> {
        try {
            if (!this.keyClient) {
                throw new HSMConnectionError('azure-keyvault', 'HSM client not initialized');
            }

            const key = await this.keyClient.getKey(keyReference.keyId);

            if (!key.key) {
                throw new HSMError(
                    'No key returned from Azure Key Vault',
                    'NO_KEY',
                    'azure-keyvault'
                );
            }

            // Parse key type and size
            const { algorithm, keySize } = this.parseKeyType(key.key.keyType, key.key.keySize);

            // Export public key (Azure Key Vault stores it in JWK format)
            const publicKeyData = this.exportPublicKeyFromJWK(key.key);

            return {
                algorithm,
                keySize,
                raw: publicKeyData,
            };
        } catch (error) {
            if (error instanceof HSMError) {
                throw error;
            }

            throw new HSMError(
                `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'GET_PUBLIC_KEY_ERROR',
                'azure-keyvault',
                error
            );
        }
    }

    /**
     * List available keys in Azure Key Vault
     */
    async listKeys(): Promise<HSMKeyInfo[]> {
        try {
            if (!this.keyClient) {
                throw new HSMConnectionError('azure-keyvault', 'HSM client not initialized');
            }

            const keys: HSMKeyInfo[] = [];

            for await (const keyProperties of this.keyClient.listPropertiesOfKeys()) {
                try {
                    const key = await this.keyClient.getKey(keyProperties.name);
                    if (key.key && this.isSigningKey(key.key)) {
                        keys.push(this.convertToHSMKeyInfo(key));
                    }
                } catch (error) {
                    // Skip keys we can't access
                    continue;
                }
            }

            return keys;
        } catch (error) {
            throw new HSMError(
                `Failed to list keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'LIST_KEYS_ERROR',
                'azure-keyvault',
                error
            );
        }
    }

    /**
     * Create new key in Azure Key Vault
     */
    async createKey(keyType: 'RSA' | 'EC', keySize: number, keyId?: string): Promise<HSMKeyInfo> {
        try {
            if (!this.keyClient) {
                throw new HSMConnectionError('azure-keyvault', 'HSM client not initialized');
            }

            const keyName = keyId || `key-${Date.now()}`;

            // Determine key options based on type and size
            const keyOptions = this.createKeyOptions(keyType, keySize);

            const key = await this.keyClient.createKey(keyName, keyType, keyOptions);

            return this.convertToHSMKeyInfo(key);
        } catch (error) {
            throw new HSMError(
                `Failed to create key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'CREATE_KEY_ERROR',
                'azure-keyvault',
                error
            );
        }
    }

    /**
     * Delete key from Azure Key Vault
     */
    async deleteKey(keyReference: HSMKeyReference): Promise<void> {
        try {
            if (!this.keyClient) {
                throw new HSMConnectionError('azure-keyvault', 'HSM client not initialized');
            }

            // Begin delete operation (soft delete)
            const deletePoller = await this.keyClient.beginDeleteKey(keyReference.keyId);
            await deletePoller.pollUntilDone();

            // Purge the key (permanent deletion)
            await this.keyClient.purgeDeletedKey(keyReference.keyId);
        } catch (error) {
            throw new HSMError(
                `Failed to delete key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DELETE_KEY_ERROR',
                'azure-keyvault',
                error
            );
        }
    }

    /**
     * Test Azure Key Vault connectivity
     */
    async testConnection(): Promise<boolean> {
        try {
            if (!this.keyClient) {
                return false;
            }

            // Try to list keys to test connectivity
            const iterator = this.keyClient.listPropertiesOfKeys();
            await iterator.next();
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Close Azure Key Vault connection
     */
    async close(): Promise<void> {
        // Azure SDK doesn't require explicit connection closing
        this.keyClient = null;
        this.config = null;
        this.vaultUrl = null;
    }

    // Private helper methods

    /**
     * Convert signing algorithm to Azure format
     */
    private convertSigningAlgorithm(algorithm: SigningAlgorithm): string {
        const algorithmMap: Record<SigningAlgorithm, string> = {
            'RSA_PKCS1_SHA256': 'RS256',
            'RSA_PKCS1_SHA384': 'RS384',
            'RSA_PKCS1_SHA512': 'RS512',
            'RSA_PSS_SHA256': 'PS256',
            'RSA_PSS_SHA384': 'PS384',
            'RSA_PSS_SHA512': 'PS512',
            'ECDSA_SHA256': 'ES256',
            'ECDSA_SHA384': 'ES384',
            'ECDSA_SHA512': 'ES512',
        };

        return algorithmMap[algorithm] || 'RS256';
    }

    /**
     * Parse Azure key type to determine algorithm and size
     */
    private parseKeyType(keyType?: string, keySize?: number): { algorithm: string; keySize: number } {
        if (keyType === 'RSA' || keyType === 'RSA-HSM') {
            return { algorithm: 'RSA', keySize: keySize || 2048 };
        } else if (keyType === 'EC' || keyType === 'EC-HSM') {
            return { algorithm: 'EC', keySize: keySize || 256 };
        }

        return { algorithm: 'RSA', keySize: 2048 };
    }

    /**
     * Check if key can be used for signing
     */
    private isSigningKey(key: any): boolean {
        const keyOps = key.keyOps || [];
        return keyOps.includes('sign');
    }

    /**
     * Create key options for Azure Key Vault
     */
    private createKeyOptions(keyType: 'RSA' | 'EC', keySize: number): any {
        const options: any = {
            keySize,
            keyOps: ['sign', 'verify'],
            hsm: true, // Use HSM-backed keys
        };

        if (keyType === 'EC') {
            // Set curve for EC keys
            if (keySize >= 521) {
                options.curve = 'P-521';
            } else if (keySize >= 384) {
                options.curve = 'P-384';
            } else {
                options.curve = 'P-256';
            }
        }

        return options;
    }

    /**
     * Export public key from JWK format
     */
    private exportPublicKeyFromJWK(key: any): Buffer {
        // Convert JWK to PEM format
        // This is a simplified implementation - in production, use proper JWK to PEM conversion
        const jwk = {
            kty: key.keyType,
            n: key.n,
            e: key.e,
            x: key.x,
            y: key.y,
            crv: key.crv,
        };

        // For now, return the JWK as JSON
        return Buffer.from(JSON.stringify(jwk), 'utf8');
    }

    /**
     * Convert Azure key to HSMKeyInfo
     */
    private convertToHSMKeyInfo(key: any): HSMKeyInfo {
        const keyName = key.name || '';
        const { algorithm, keySize } = this.parseKeyType(key.key?.keyType, key.key?.keySize);

        return {
            keyId: keyName,
            keyType: algorithm as 'RSA' | 'EC',
            keySize,
            algorithm: this.getSupportedAlgorithms(algorithm, keySize),
            created: key.properties?.createdOn || new Date(),
            enabled: key.properties?.enabled !== false,
            metadata: {
                id: key.key?.id,
                version: key.properties?.version,
                keyType: key.key?.keyType,
                keyOps: key.key?.keyOps,
                curve: key.key?.crv,
                vaultUrl: this.vaultUrl,
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