// Type declarations for optional HSM dependencies
// These allow compilation even when dependencies are not installed

declare module '@google-cloud/kms' {
    export class KeyManagementServiceClient {
        constructor(options?: any);
        close(): Promise<void>;
        listKeyRings(request: any): Promise<any>;
        listCryptoKeys(request: any): Promise<any>;
        getPublicKey(request: any): Promise<any>;
        asymmetricSign(request: any): Promise<any>;
        createCryptoKey(request: any): Promise<any>;
        destroyCryptoKeyVersion(request: any): Promise<any>;
    }
}

declare module 'aws-sdk' {
    namespace AWS {
        interface AWSError extends Error {
            code: string;
            message: string;
        }

        namespace KMS {
            interface ClientConfiguration {
                region?: string;
                accessKeyId?: string;
                secretAccessKey?: string;
                sessionToken?: string;
            }

            interface SignRequest {
                KeyId: string;
                Message: Buffer;
                MessageType: string;
                SigningAlgorithm: string;
            }

            interface GetPublicKeyRequest {
                KeyId: string;
            }

            interface ListKeysRequest {
                Limit?: number;
                Marker?: string;
            }

            interface CreateKeyRequest {
                KeyUsage: string;
                KeySpec: string;
                Origin: string;
                Description?: string;
                Tags?: Array<{ TagKey: string; TagValue: string }>;
            }

            interface DescribeKeyRequest {
                KeyId: string;
            }

            interface ScheduleKeyDeletionRequest {
                KeyId: string;
                PendingWindowInDays: number;
            }
        }

        class KMS {
            constructor(config?: KMS.ClientConfiguration);
            sign(params: KMS.SignRequest): { promise(): Promise<any> };
            getPublicKey(params: KMS.GetPublicKeyRequest): { promise(): Promise<any> };
            listKeys(params: KMS.ListKeysRequest): { promise(): Promise<any> };
            createKey(params: KMS.CreateKeyRequest): { promise(): Promise<any> };
            describeKey(params: KMS.DescribeKeyRequest): { promise(): Promise<any> };
            scheduleKeyDeletion(params: KMS.ScheduleKeyDeletionRequest): { promise(): Promise<any> };
        }
    }

    export = AWS;
}

declare module '@azure/keyvault-keys' {
    export class KeyClient {
        constructor(vaultUrl: string, credential: any);
        credential: any;
        getKey(keyName: string): Promise<any>;
        listPropertiesOfKeys(): AsyncIterable<any>;
        createKey(keyName: string, keyType: string, options?: any): Promise<any>;
        beginDeleteKey(keyName: string): Promise<any>;
        purgeDeletedKey(keyName: string): Promise<void>;
    }

    export class CryptographyClient {
        constructor(key: any, credential: any);
        sign(algorithm: string, data: Buffer): Promise<any>;
    }
}

declare module '@azure/identity' {
    export class DefaultAzureCredential {
        constructor();
    }

    export class ClientSecretCredential {
        constructor(tenantId: string, clientId: string, clientSecret: string);
    }
}

declare module 'pkcs11js' {
    export const CKF_SERIAL_SESSION: number;
    export const CKF_RW_SESSION: number;
    export const CKU_USER: number;
    export const CKA_CLASS: number;
    export const CKA_KEY_TYPE: number;
    export const CKA_LABEL: number;
    export const CKA_MODULUS_BITS: number;
    export const CKA_MODULUS: number;
    export const CKA_PUBLIC_EXPONENT: number;
    export const CKA_EC_PARAMS: number;
    export const CKA_EC_POINT: number;
    export const CKA_TOKEN: number;
    export const CKA_VERIFY: number;
    export const CKA_ENCRYPT: number;
    export const CKA_PRIVATE: number;
    export const CKA_SENSITIVE: number;
    export const CKA_SIGN: number;
    export const CKA_DECRYPT: number;
    export const CKO_PUBLIC_KEY: number;
    export const CKO_PRIVATE_KEY: number;
    export const CKK_RSA: number;
    export const CKK_EC: number;
    export const CKM_RSA_PKCS_KEY_PAIR_GEN: number;
    export const CKM_EC_KEY_PAIR_GEN: number;
    export const CKM_SHA256_RSA_PKCS: number;
    export const CKM_SHA384_RSA_PKCS: number;
    export const CKM_SHA512_RSA_PKCS: number;
    export const CKM_SHA256_RSA_PKCS_PSS: number;
    export const CKM_SHA384_RSA_PKCS_PSS: number;
    export const CKM_SHA512_RSA_PKCS_PSS: number;
    export const CKM_ECDSA_SHA256: number;
    export const CKM_ECDSA_SHA384: number;
    export const CKM_ECDSA_SHA512: number;
    export const CKR_OBJECT_HANDLE_INVALID: number;
    export const CKR_USER_NOT_LOGGED_IN: number;
    export const CKR_MECHANISM_INVALID: number;

    export class PKCS11 {
        load(libraryPath: string): void;
        C_Initialize(): void;
        C_Finalize(): void;
        C_GetSlotList(tokenPresent: boolean): number[];
        C_OpenSession(slotId: number, flags: number): any;
        C_CloseSession(session: any): void;
        C_Login(session: any, userType: number, pin: string): void;
        C_Logout(session: any): void;
        C_GetSessionInfo(session: any): any;
        C_FindObjectsInit(session: any, template: any[]): void;
        C_FindObjects(session: any, maxCount: number): any[];
        C_FindObjectsFinal(session: any): void;
        C_GetAttributeValue(session: any, object: any, template: any[]): any[];
        C_SignInit(session: any, mechanism: any, key: any): void;
        C_Sign(session: any, data: Buffer, signature: Buffer): Buffer;
        C_GenerateKeyPair(session: any, mechanism: any, publicTemplate: any[], privateTemplate: any[]): any;
        C_DestroyObject(session: any, object: any): void;
    }
}