// @ts-ignore - Optional dependency
let pkcs11js: any;
try {
    pkcs11js = require('pkcs11js');
} catch (error) {
    pkcs11js = {
        PKCS11: class MockPKCS11 {
            constructor() {
                throw new Error('pkcs11js dependency not installed');
            }
        },
        CKF_SERIAL_SESSION: 0x00000004,
        CKF_RW_SESSION: 0x00000002,
        CKU_USER: 1,
        CKA_CLASS: 0x00000000,
        CKA_KEY_TYPE: 0x00000100,
        CKA_LABEL: 0x00000003,
        CKA_MODULUS_BITS: 0x00000121,
        CKA_MODULUS: 0x00000120,
        CKA_PUBLIC_EXPONENT: 0x00000122,
        CKA_EC_PARAMS: 0x00000180,
        CKA_EC_POINT: 0x00000181,
        CKA_TOKEN: 0x00000001,
        CKA_VERIFY: 0x0000010A,
        CKA_ENCRYPT: 0x00000104,
        CKA_PRIVATE: 0x00000002,
        CKA_SENSITIVE: 0x00000103,
        CKA_SIGN: 0x00000108,
        CKA_DECRYPT: 0x00000105,
        CKO_PUBLIC_KEY: 0x00000002,
        CKO_PRIVATE_KEY: 0x00000003,
        CKK_RSA: 0x00000000,
        CKK_EC: 0x00000003,
        CKM_RSA_PKCS_KEY_PAIR_GEN: 0x00000000,
        CKM_EC_KEY_PAIR_GEN: 0x00001040,
        CKM_SHA256_RSA_PKCS: 0x00000040,
        CKM_SHA384_RSA_PKCS: 0x00000041,
        CKM_SHA512_RSA_PKCS: 0x00000042,
        CKM_SHA256_RSA_PKCS_PSS: 0x00000043,
        CKM_SHA384_RSA_PKCS_PSS: 0x00000044,
        CKM_SHA512_RSA_PKCS_PSS: 0x00000045,
        CKM_ECDSA_SHA256: 0x00001042,
        CKM_ECDSA_SHA384: 0x00001043,
        CKM_ECDSA_SHA512: 0x00001044,
        CKR_OBJECT_HANDLE_INVALID: 0x00000082,
        CKR_USER_NOT_LOGGED_IN: 0x00000101,
        CKR_MECHANISM_INVALID: 0x00000070,
    };
}
import * as crypto from 'node:crypto';
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
 * PKCS#11 HSM Service Implementation
 * 
 * Provides integration with PKCS#11 compatible Hardware Security Modules
 * including SafeNet, Thales, Utimaco, and other HSM devices.
 */
export class PKCS11HSMService implements HSMService {
    private pkcs11: any = null;
    private session: any = null;
    private config: HSMConfig | null = null;
    private slotId: number = 0;
    private isLoggedIn: boolean = false;

    /**
     * Initialize PKCS#11 HSM connection
     */
    async initialize(config: HSMConfig): Promise<void> {
        try {
            this.config = config;

            // Validate required configuration
            if (!config.credentials?.pkcs11LibraryPath) {
                throw new HSMAuthenticationError(
                    'pkcs11',
                    'PKCS#11 library path not provided'
                );
            }

            this.slotId = config.credentials.pkcs11SlotId || 0;

            // Load PKCS#11 library
            this.pkcs11 = new pkcs11js.PKCS11();
            this.pkcs11.load(config.credentials.pkcs11LibraryPath);

            // Initialize PKCS#11 library
            this.pkcs11.C_Initialize();

            // Get slot list
            const slots = this.pkcs11.C_GetSlotList(true);
            if (slots.length === 0) {
                throw new HSMConnectionError(
                    'pkcs11',
                    'No PKCS#11 slots available'
                );
            }

            // Use specified slot or first available
            if (this.slotId >= slots.length) {
                this.slotId = 0;
            }

            // Open session
            this.session = this.pkcs11.C_OpenSession(
                slots[this.slotId],
                pkcs11js.CKF_SERIAL_SESSION | pkcs11js.CKF_RW_SESSION
            );

            // Login if PIN is provided
            if (config.credentials.pkcs11Pin) {
                this.pkcs11.C_Login(
                    this.session,
                    pkcs11js.CKU_USER,
                    config.credentials.pkcs11Pin
                );
                this.isLoggedIn = true;
            }

            // Test the connection
            await this.testConnection();
        } catch (error) {
            throw new HSMConnectionError(
                'pkcs11',
                `Failed to initialize PKCS#11 HSM: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Sign data using PKCS#11 HSM key
     */
    async sign(request: HSMSigningRequest): Promise<HSMSigningResult> {
        try {
            if (!this.pkcs11 || !this.session) {
                throw new HSMConnectionError('pkcs11', 'HSM client not initialized');
            }

            // Find the private key object
            const privateKey = await this.findPrivateKey(request.keyReference.keyId);
            if (!privateKey) {
                throw new HSMKeyNotFoundError(
                    'pkcs11',
                    request.keyReference.keyId
                );
            }

            // Convert signing algorithm to PKCS#11 mechanism
            const mechanism = this.convertSigningAlgorithm(request.algorithm);

            // Initialize signing operation
            this.pkcs11.C_SignInit(this.session, mechanism, privateKey);

            // Perform signing
            const signature = this.pkcs11.C_Sign(this.session, request.data, Buffer.alloc(1024));

            return {
                signature: Buffer.from(signature),
                algorithm: request.algorithm,
                keyId: request.keyReference.keyId,
                timestamp: new Date(),
                metadata: {
                    mechanism: mechanism.mechanism,
                    slotId: this.slotId,
                },
            };
        } catch (error) {
            if (error instanceof HSMError) {
                throw error;
            }

            // Handle specific PKCS#11 errors
            if (error && typeof error === 'object' && 'pkcs11Code' in error) {
                const pkcs11Error = error as any;
                switch (pkcs11Error.pkcs11Code) {
                    case pkcs11js.CKR_OBJECT_HANDLE_INVALID:
                        throw new HSMKeyNotFoundError(
                            'pkcs11',
                            request.keyReference.keyId,
                            error
                        );
                    case pkcs11js.CKR_USER_NOT_LOGGED_IN:
                        throw new HSMAuthenticationError(
                            'pkcs11',
                            'User not logged in to PKCS#11 token',
                            error
                        );
                    case pkcs11js.CKR_MECHANISM_INVALID:
                        throw new HSMSigningError(
                            'pkcs11',
                            'Invalid signing mechanism',
                            error
                        );
                    default:
                        throw new HSMSigningError(
                            'pkcs11',
                            `PKCS#11 error: ${pkcs11Error.message || 'Unknown error'}`,
                            error
                        );
                }
            }

            throw new HSMSigningError(
                'pkcs11',
                `Failed to sign with PKCS#11 HSM: ${error instanceof Error ? error.message : 'Unknown error'}`,
                error
            );
        }
    }

    /**
     * Get public key from PKCS#11 HSM
     */
    async getPublicKey(keyReference: HSMKeyReference): Promise<PublicKey> {
        try {
            if (!this.pkcs11 || !this.session) {
                throw new HSMConnectionError('pkcs11', 'HSM client not initialized');
            }

            // Find the public key object
            const publicKey = await this.findPublicKey(keyReference.keyId);
            if (!publicKey) {
                throw new HSMKeyNotFoundError(
                    'pkcs11',
                    keyReference.keyId
                );
            }

            // Get key attributes
            const attributes = this.pkcs11.C_GetAttributeValue(this.session, publicKey, [
                { type: pkcs11js.CKA_KEY_TYPE },
                { type: pkcs11js.CKA_MODULUS_BITS },
                { type: pkcs11js.CKA_MODULUS },
                { type: pkcs11js.CKA_PUBLIC_EXPONENT },
                { type: pkcs11js.CKA_EC_PARAMS },
                { type: pkcs11js.CKA_EC_POINT },
            ]);

            // Parse key information
            const { algorithm, keySize, keyData } = this.parseKeyAttributes(attributes);

            return {
                algorithm,
                keySize,
                raw: keyData,
            };
        } catch (error) {
            if (error instanceof HSMError) {
                throw error;
            }

            throw new HSMError(
                `Failed to get public key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'GET_PUBLIC_KEY_ERROR',
                'pkcs11',
                error
            );
        }
    }

    /**
     * List available keys in PKCS#11 HSM
     */
    async listKeys(): Promise<HSMKeyInfo[]> {
        try {
            if (!this.pkcs11 || !this.session) {
                throw new HSMConnectionError('pkcs11', 'HSM client not initialized');
            }

            const keys: HSMKeyInfo[] = [];

            // Find all private key objects
            this.pkcs11.C_FindObjectsInit(this.session, [
                { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY },
            ]);

            let objects = this.pkcs11.C_FindObjects(this.session, 100);
            while (objects.length > 0) {
                for (const obj of objects) {
                    try {
                        const keyInfo = await this.getKeyInfoFromObject(obj);
                        if (keyInfo) {
                            keys.push(keyInfo);
                        }
                    } catch (error) {
                        // Skip keys we can't access
                        continue;
                    }
                }
                objects = this.pkcs11.C_FindObjects(this.session, 100);
            }

            this.pkcs11.C_FindObjectsFinal(this.session);

            return keys;
        } catch (error) {
            throw new HSMError(
                `Failed to list keys: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'LIST_KEYS_ERROR',
                'pkcs11',
                error
            );
        }
    }

    /**
     * Create new key in PKCS#11 HSM
     */
    async createKey(keyType: 'RSA' | 'EC', keySize: number, keyId?: string): Promise<HSMKeyInfo> {
        try {
            if (!this.pkcs11 || !this.session) {
                throw new HSMConnectionError('pkcs11', 'HSM client not initialized');
            }

            const label = keyId || `key-${Date.now()}`;

            let publicKey: any;
            let privateKey: any;

            if (keyType === 'RSA') {
                // Generate RSA key pair
                const mechanism = { mechanism: pkcs11js.CKM_RSA_PKCS_KEY_PAIR_GEN };

                const publicKeyTemplate = [
                    { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PUBLIC_KEY },
                    { type: pkcs11js.CKA_KEY_TYPE, value: pkcs11js.CKK_RSA },
                    { type: pkcs11js.CKA_TOKEN, value: true },
                    { type: pkcs11js.CKA_VERIFY, value: true },
                    { type: pkcs11js.CKA_ENCRYPT, value: false },
                    { type: pkcs11js.CKA_MODULUS_BITS, value: keySize },
                    { type: pkcs11js.CKA_PUBLIC_EXPONENT, value: Buffer.from([0x01, 0x00, 0x01]) },
                    { type: pkcs11js.CKA_LABEL, value: label },
                ];

                const privateKeyTemplate = [
                    { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY },
                    { type: pkcs11js.CKA_KEY_TYPE, value: pkcs11js.CKK_RSA },
                    { type: pkcs11js.CKA_TOKEN, value: true },
                    { type: pkcs11js.CKA_PRIVATE, value: true },
                    { type: pkcs11js.CKA_SENSITIVE, value: true },
                    { type: pkcs11js.CKA_SIGN, value: true },
                    { type: pkcs11js.CKA_DECRYPT, value: false },
                    { type: pkcs11js.CKA_LABEL, value: label },
                ];

                const keyPair = this.pkcs11.C_GenerateKeyPair(
                    this.session,
                    mechanism,
                    publicKeyTemplate,
                    privateKeyTemplate
                );

                publicKey = keyPair.publicKey;
                privateKey = keyPair.privateKey;
            } else if (keyType === 'EC') {
                // Generate EC key pair
                const mechanism = { mechanism: pkcs11js.CKM_EC_KEY_PAIR_GEN };

                // Determine curve parameters
                const ecParams = this.getECParams(keySize);

                const publicKeyTemplate = [
                    { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PUBLIC_KEY },
                    { type: pkcs11js.CKA_KEY_TYPE, value: pkcs11js.CKK_EC },
                    { type: pkcs11js.CKA_TOKEN, value: true },
                    { type: pkcs11js.CKA_VERIFY, value: true },
                    { type: pkcs11js.CKA_EC_PARAMS, value: ecParams },
                    { type: pkcs11js.CKA_LABEL, value: label },
                ];

                const privateKeyTemplate = [
                    { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY },
                    { type: pkcs11js.CKA_KEY_TYPE, value: pkcs11js.CKK_EC },
                    { type: pkcs11js.CKA_TOKEN, value: true },
                    { type: pkcs11js.CKA_PRIVATE, value: true },
                    { type: pkcs11js.CKA_SENSITIVE, value: true },
                    { type: pkcs11js.CKA_SIGN, value: true },
                    { type: pkcs11js.CKA_LABEL, value: label },
                ];

                const keyPair = this.pkcs11.C_GenerateKeyPair(
                    this.session,
                    mechanism,
                    publicKeyTemplate,
                    privateKeyTemplate
                );

                publicKey = keyPair.publicKey;
                privateKey = keyPair.privateKey;
            } else {
                throw new HSMError(
                    `Unsupported key type: ${keyType}`,
                    'UNSUPPORTED_KEY_TYPE',
                    'pkcs11'
                );
            }

            return await this.getKeyInfoFromObject(privateKey);
        } catch (error) {
            throw new HSMError(
                `Failed to create key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'CREATE_KEY_ERROR',
                'pkcs11',
                error
            );
        }
    }

    /**
     * Delete key from PKCS#11 HSM
     */
    async deleteKey(keyReference: HSMKeyReference): Promise<void> {
        try {
            if (!this.pkcs11 || !this.session) {
                throw new HSMConnectionError('pkcs11', 'HSM client not initialized');
            }

            // Find and delete private key
            const privateKey = await this.findPrivateKey(keyReference.keyId);
            if (privateKey) {
                this.pkcs11.C_DestroyObject(this.session, privateKey);
            }

            // Find and delete public key
            const publicKey = await this.findPublicKey(keyReference.keyId);
            if (publicKey) {
                this.pkcs11.C_DestroyObject(this.session, publicKey);
            }
        } catch (error) {
            throw new HSMError(
                `Failed to delete key: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'DELETE_KEY_ERROR',
                'pkcs11',
                error
            );
        }
    }

    /**
     * Test PKCS#11 HSM connectivity
     */
    async testConnection(): Promise<boolean> {
        try {
            if (!this.pkcs11 || !this.session) {
                return false;
            }

            // Try to get session info to test connectivity
            this.pkcs11.C_GetSessionInfo(this.session);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Close PKCS#11 HSM connection
     */
    async close(): Promise<void> {
        try {
            if (this.session) {
                if (this.isLoggedIn) {
                    this.pkcs11.C_Logout(this.session);
                    this.isLoggedIn = false;
                }
                this.pkcs11.C_CloseSession(this.session);
                this.session = null;
            }

            if (this.pkcs11) {
                this.pkcs11.C_Finalize();
                this.pkcs11 = null;
            }
        } catch (error) {
            // Ignore errors during cleanup
        }

        this.config = null;
    }

    // Private helper methods

    /**
     * Convert signing algorithm to PKCS#11 mechanism
     */
    private convertSigningAlgorithm(algorithm: SigningAlgorithm): any {
        const mechanismMap: Record<SigningAlgorithm, number> = {
            'RSA_PKCS1_SHA256': pkcs11js.CKM_SHA256_RSA_PKCS,
            'RSA_PKCS1_SHA384': pkcs11js.CKM_SHA384_RSA_PKCS,
            'RSA_PKCS1_SHA512': pkcs11js.CKM_SHA512_RSA_PKCS,
            'RSA_PSS_SHA256': pkcs11js.CKM_SHA256_RSA_PKCS_PSS,
            'RSA_PSS_SHA384': pkcs11js.CKM_SHA384_RSA_PKCS_PSS,
            'RSA_PSS_SHA512': pkcs11js.CKM_SHA512_RSA_PKCS_PSS,
            'ECDSA_SHA256': pkcs11js.CKM_ECDSA_SHA256,
            'ECDSA_SHA384': pkcs11js.CKM_ECDSA_SHA384,
            'ECDSA_SHA512': pkcs11js.CKM_ECDSA_SHA512,
        };

        const mechanism = mechanismMap[algorithm] || pkcs11js.CKM_SHA256_RSA_PKCS;
        return { mechanism };
    }

    /**
     * Find private key object by label
     */
    private async findPrivateKey(keyId: string): Promise<any> {
        this.pkcs11.C_FindObjectsInit(this.session, [
            { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PRIVATE_KEY },
            { type: pkcs11js.CKA_LABEL, value: keyId },
        ]);

        const objects = this.pkcs11.C_FindObjects(this.session, 1);
        this.pkcs11.C_FindObjectsFinal(this.session);

        return objects.length > 0 ? objects[0] : null;
    }

    /**
     * Find public key object by label
     */
    private async findPublicKey(keyId: string): Promise<any> {
        this.pkcs11.C_FindObjectsInit(this.session, [
            { type: pkcs11js.CKA_CLASS, value: pkcs11js.CKO_PUBLIC_KEY },
            { type: pkcs11js.CKA_LABEL, value: keyId },
        ]);

        const objects = this.pkcs11.C_FindObjects(this.session, 1);
        this.pkcs11.C_FindObjectsFinal(this.session);

        return objects.length > 0 ? objects[0] : null;
    }

    /**
     * Parse key attributes to extract key information
     */
    private parseKeyAttributes(attributes: any[]): { algorithm: string; keySize: number; keyData: Buffer } {
        let algorithm = 'RSA';
        let keySize = 2048;
        let keyData = Buffer.alloc(0);

        for (const attr of attributes) {
            switch (attr.type) {
                case pkcs11js.CKA_KEY_TYPE:
                    if (attr.value === pkcs11js.CKK_RSA) {
                        algorithm = 'RSA';
                    } else if (attr.value === pkcs11js.CKK_EC) {
                        algorithm = 'EC';
                    }
                    break;
                case pkcs11js.CKA_MODULUS_BITS:
                    keySize = attr.value;
                    break;
                case pkcs11js.CKA_MODULUS:
                    keyData = Buffer.from(attr.value);
                    break;
                case pkcs11js.CKA_EC_POINT:
                    keyData = Buffer.from(attr.value);
                    // Determine EC key size from point data
                    if (keyData.length >= 133) keySize = 521;
                    else if (keyData.length >= 97) keySize = 384;
                    else keySize = 256;
                    break;
            }
        }

        return { algorithm, keySize, keyData };
    }

    /**
     * Get key information from PKCS#11 object
     */
    private async getKeyInfoFromObject(obj: any): Promise<HSMKeyInfo> {
        const attributes = this.pkcs11.C_GetAttributeValue(this.session, obj, [
            { type: pkcs11js.CKA_LABEL },
            { type: pkcs11js.CKA_KEY_TYPE },
            { type: pkcs11js.CKA_MODULUS_BITS },
            { type: pkcs11js.CKA_EC_PARAMS },
        ]);

        let keyId = '';
        let algorithm = 'RSA';
        let keySize = 2048;

        for (const attr of attributes) {
            switch (attr.type) {
                case pkcs11js.CKA_LABEL:
                    keyId = attr.value.toString();
                    break;
                case pkcs11js.CKA_KEY_TYPE:
                    if (attr.value === pkcs11js.CKK_RSA) {
                        algorithm = 'RSA';
                    } else if (attr.value === pkcs11js.CKK_EC) {
                        algorithm = 'EC';
                    }
                    break;
                case pkcs11js.CKA_MODULUS_BITS:
                    keySize = attr.value;
                    break;
                case pkcs11js.CKA_EC_PARAMS:
                    // Parse EC parameters to determine key size
                    keySize = this.parseECKeySize(attr.value);
                    break;
            }
        }

        return {
            keyId,
            keyType: algorithm as 'RSA' | 'EC',
            keySize,
            algorithm: this.getSupportedAlgorithms(algorithm, keySize),
            created: new Date(), // PKCS#11 doesn't typically store creation date
            enabled: true,
            metadata: {
                slotId: this.slotId,
                objectHandle: obj,
            },
        };
    }

    /**
     * Get EC parameters for key generation
     */
    private getECParams(keySize: number): Buffer {
        // OID for NIST curves
        if (keySize >= 521) {
            // P-521
            return Buffer.from([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x23]);
        } else if (keySize >= 384) {
            // P-384
            return Buffer.from([0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x22]);
        } else {
            // P-256
            return Buffer.from([0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07]);
        }
    }

    /**
     * Parse EC key size from parameters
     */
    private parseECKeySize(params: Buffer): number {
        // Simplified parsing - in production, use proper ASN.1 parsing
        if (params.includes(Buffer.from([0x00, 0x23]))) return 521; // P-521
        if (params.includes(Buffer.from([0x00, 0x22]))) return 384; // P-384
        return 256; // P-256
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