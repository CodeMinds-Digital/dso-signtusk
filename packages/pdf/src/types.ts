import { z } from 'zod';
import type { PDFDocument, PDFField } from 'pdf-lib';

// Core PDF processing types
export interface PDFProcessingEngine {
    loadPDF(buffer: Buffer): Promise<PDFDocument>;
    createField(document: PDFDocument, field: FieldDefinition): Promise<PDFField>;
    getFormFields(document: PDFDocument): Promise<PDFField[]>;
    getFormField(document: PDFDocument, fieldName: string): Promise<PDFField | null>;
    removeFormField(document: PDFDocument, fieldName: string): Promise<boolean>;
    updateFieldValue(document: PDFDocument, fieldName: string, value: string): Promise<void>;
    validateFormFields(document: PDFDocument, fieldDefinitions?: FieldDefinition[]): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }>;
    mergePDFs(documents: PDFDocument[]): Promise<PDFDocument>;
    splitPDF(document: PDFDocument, pageRanges: PageRange[]): Promise<PDFDocument[]>;
    optimizePDF(document: PDFDocument, options: OptimizationOptions): Promise<PDFDocument>;
    extractText(document: PDFDocument): Promise<string>;
    generateThumbnail(document: PDFDocument, page: number): Promise<Buffer>;
    extractPages(document: PDFDocument, pageNumbers: number[]): Promise<PDFDocument>;
    addWatermark(document: PDFDocument, watermark: WatermarkOptions): Promise<PDFDocument>;
    validatePDF(buffer: Buffer): Promise<ValidationResult>;
}

// Field definition schema
export const FieldDefinitionSchema = z.object({
    type: z.enum(['signature', 'text', 'checkbox', 'radio', 'dropdown', 'date', 'list']),
    name: z.string().min(1).max(100),
    page: z.number().min(0),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
    required: z.boolean().default(false),
    readonly: z.boolean().default(false),
    value: z.string().optional().nullable().transform(val => val || undefined),
    options: z.array(z.string()).optional().nullable().transform(val => val || undefined),
    fontSize: z.number().min(1).max(72).default(12),
    fontColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#000000'),
    backgroundColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    borderColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    borderWidth: z.number().min(0).max(10).default(1),
    // Additional properties for enhanced field support
    placeholder: z.string().optional(),
    maxLength: z.number().min(1).optional(),
    multiline: z.boolean().default(false),
    alignment: z.enum(['left', 'center', 'right']).default('left'),
    // Signature field specific properties
    signatureType: z.enum(['drawn', 'typed', 'uploaded']).optional(),
    // Radio field specific properties
    radioGroup: z.string().optional(), // Group name for radio buttons
    // Validation properties
    validation: z.object({
        pattern: z.string().optional(), // Regex pattern for validation
        minLength: z.number().min(0).optional(),
        maxLength: z.number().min(1).optional(),
        required: z.boolean().default(false),
    }).optional(),
}).refine((data) => {
    // Ensure dropdown and radio fields have options
    if ((data.type === 'dropdown' || data.type === 'radio' || data.type === 'list') && !data.options) {
        return false;
    }
    return true;
}, {
    message: "Dropdown, radio, and list fields must have options",
    path: ["options"]
});

export type FieldDefinition = z.infer<typeof FieldDefinitionSchema>;

// Page range for splitting
export const PageRangeSchema = z.object({
    start: z.number().min(1),
    end: z.number().min(1),
});

export type PageRange = z.infer<typeof PageRangeSchema>;

// Optimization options
export const OptimizationOptionsSchema = z.object({
    compressImages: z.boolean().default(true),
    removeUnusedObjects: z.boolean().default(true),
    optimizeFonts: z.boolean().default(true),
    linearize: z.boolean().default(false),
    quality: z.number().min(0).max(100).default(85),
});

export type OptimizationOptions = z.infer<typeof OptimizationOptionsSchema>;

// Watermark options
export const WatermarkOptionsSchema = z.object({
    text: z.string(),
    opacity: z.number().min(0).max(1).default(0.3),
    fontSize: z.number().min(1).default(48),
    color: z.string().default('#CCCCCC'),
    rotation: z.number().default(45),
    position: z.enum(['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).default('center'),
});

export type WatermarkOptions = z.infer<typeof WatermarkOptionsSchema>;

// Validation result
export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    pageCount: number;
    hasFormFields: boolean;
    hasSignatures: boolean;
    isEncrypted: boolean;
    version: string;
    fileSize: number;
}

// PDF metadata
export interface PDFMetadata {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
    pageCount: number;
    fileSize: number;
    version: string;
}

// Text extraction result
export interface TextExtractionResult {
    text: string;
    pageTexts: string[];
    metadata: PDFMetadata;
}

// Processing result
export interface ProcessingResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    warnings?: string[];
    processingTime: number;
}

// PDF processing errors
export class PDFProcessingError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'PDFProcessingError';
    }
}

export class PDFValidationError extends PDFProcessingError {
    constructor(message: string, details?: any) {
        super(message, 'PDF_VALIDATION_ERROR', details);
        this.name = 'PDFValidationError';
    }
}

export class PDFCorruptionError extends PDFProcessingError {
    constructor(message: string, details?: any) {
        super(message, 'PDF_CORRUPTION_ERROR', details);
        this.name = 'PDFCorruptionError';
    }
}

// Processing options
export interface ProcessingOptions {
    timeout?: number; // in milliseconds
    maxFileSize?: number; // in bytes
    allowEncrypted?: boolean;
    preserveMetadata?: boolean;
}

// Digital Signature Types
export interface DigitalSignatureEngine {
    createSignature(document: Buffer, certificate: X509Certificate, privateKey: PrivateKey): Promise<CMSSignature>;
    validateSignature(signature: CMSSignature): Promise<SignatureValidationResult>;
    validateCertificateChain(certificates: X509Certificate[]): Promise<CertificateValidationResult>;
    timestampDocument(document: Buffer, tsaUrl: string): Promise<Timestamp>;
    addSignatureToDocument(document: PDFDocument, signature: CMSSignature, field: SignatureFieldInfo): Promise<PDFDocument>;
    extractSignatures(document: PDFDocument): Promise<ExtractedSignature[]>;
}

// X.509 Certificate interface
export interface X509Certificate {
    subject: CertificateSubject;
    issuer: CertificateSubject;
    serialNumber: string;
    notBefore: Date;
    notAfter: Date;
    publicKey: PublicKey;
    fingerprint: string;
    extensions: CertificateExtension[];
    raw: Buffer;
}

// Certificate subject/issuer information
export interface CertificateSubject {
    commonName?: string;
    organizationName?: string;
    organizationalUnitName?: string;
    countryName?: string;
    stateOrProvinceName?: string;
    localityName?: string;
    emailAddress?: string;
}

// Certificate extension
export interface CertificateExtension {
    oid: string;
    critical: boolean;
    value: Buffer;
}

// Private key interface
export interface PrivateKey {
    algorithm: string;
    keySize: number;
    raw: Buffer;
}

// Public key interface
export interface PublicKey {
    algorithm: string;
    keySize: number;
    raw: Buffer;
}

// CMS/PKCS#7 signature
export interface CMSSignature {
    signerInfo: SignerInfo;
    certificates: X509Certificate[];
    content: Buffer;
    signature: Buffer;
    timestamp?: Timestamp;
    raw: Buffer;
}

// Signer information
export interface SignerInfo {
    certificate: X509Certificate;
    signedAttributes: SignedAttribute[];
    unsignedAttributes: UnsignedAttribute[];
    signatureAlgorithm: string;
    signature: Buffer;
}

// Signed attributes
export interface SignedAttribute {
    oid: string;
    value: Buffer;
}

// Unsigned attributes
export interface UnsignedAttribute {
    oid: string;
    value: Buffer;
}

// Timestamp from TSA
export interface Timestamp {
    timestamp: Date;
    tsaUrl: string;
    serialNumber: string;
    certificate: X509Certificate;
    signature: Buffer;
    raw: Buffer;
}

// Signature validation result
export interface SignatureValidationResult {
    isValid: boolean;
    signerCertificate: X509Certificate;
    signatureTime: Date;
    timestampValid: boolean;
    certificateChainValid: boolean;
    documentIntegrityValid: boolean;
    errors: string[];
    warnings: string[];
}

// Certificate validation result
export interface CertificateValidationResult {
    isValid: boolean;
    chainValid: boolean;
    notExpired: boolean;
    notRevoked: boolean;
    trustedRoot: boolean;
    errors: string[];
    warnings: string[];
}

// Signature field information for PDF
export interface SignatureFieldInfo {
    name: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    reason?: string;
    location?: string;
    contactInfo?: string;
}

// Extracted signature from PDF
export interface ExtractedSignature {
    fieldName: string;
    signature: CMSSignature;
    signatureTime: Date;
    reason?: string;
    location?: string;
    contactInfo?: string;
}

// Certificate revocation status
export interface RevocationStatus {
    isRevoked: boolean;
    revocationTime?: Date;
    reason?: string;
    checkedAt: Date;
    method: 'CRL' | 'OCSP';
}

// Digital signature validation schemas
export const SignatureFieldInfoSchema = z.object({
    name: z.string(),
    page: z.number().min(0),
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().min(1),
    height: z.number().min(1),
    reason: z.string().optional(),
    location: z.string().optional(),
    contactInfo: z.string().optional(),
});

export type SignatureFieldInfoType = z.infer<typeof SignatureFieldInfoSchema>;

// Digital signature errors
export class DigitalSignatureError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'DigitalSignatureError';
    }
}

export class CertificateError extends DigitalSignatureError {
    constructor(message: string, details?: any) {
        super(message, 'CERTIFICATE_ERROR', details);
        this.name = 'CertificateError';
    }
}

export class SignatureValidationError extends DigitalSignatureError {
    constructor(message: string, details?: any) {
        super(message, 'SIGNATURE_VALIDATION_ERROR', details);
        this.name = 'SignatureValidationError';
    }
}

export class TimestampError extends DigitalSignatureError {
    constructor(message: string, details?: any) {
        super(message, 'TIMESTAMP_ERROR', details);
        this.name = 'TimestampError';
    }
}

// Hardware Security Module (HSM) Integration Types

/**
 * HSM Provider types
 */
export type HSMProvider = 'google-cloud-hsm' | 'aws-kms' | 'azure-keyvault' | 'pkcs11';

/**
 * HSM Key reference for cloud providers
 */
export interface HSMKeyReference {
    provider: HSMProvider;
    keyId: string;
    keyVersion?: string;
    region?: string;
    projectId?: string; // For Google Cloud
    vaultUrl?: string; // For Azure Key Vault
}

/**
 * HSM Configuration for different providers
 */
export interface HSMConfig {
    provider: HSMProvider;
    credentials?: HSMCredentials;
    timeout?: number;
    retryAttempts?: number;
}

/**
 * HSM Credentials for authentication
 */
export interface HSMCredentials {
    // Google Cloud HSM
    googleCloudKeyPath?: string;
    googleApplicationCredentials?: string;

    // AWS KMS
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
    awsRegion?: string;
    awsSessionToken?: string;

    // Azure Key Vault
    azureClientId?: string;
    azureClientSecret?: string;
    azureTenantId?: string;
    vaultUrl?: string;

    // PKCS#11
    pkcs11LibraryPath?: string;
    pkcs11SlotId?: number;
    pkcs11Pin?: string;
}

/**
 * HSM Signing Request
 */
export interface HSMSigningRequest {
    keyReference: HSMKeyReference;
    data: Buffer;
    algorithm: SigningAlgorithm;
    certificate?: X509Certificate;
}

/**
 * HSM Signing Result
 */
export interface HSMSigningResult {
    signature: Buffer;
    algorithm: SigningAlgorithm;
    keyId: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}

/**
 * Supported signing algorithms for HSM
 */
export type SigningAlgorithm =
    | 'RSA_PKCS1_SHA256'
    | 'RSA_PKCS1_SHA384'
    | 'RSA_PKCS1_SHA512'
    | 'RSA_PSS_SHA256'
    | 'RSA_PSS_SHA384'
    | 'RSA_PSS_SHA512'
    | 'ECDSA_SHA256'
    | 'ECDSA_SHA384'
    | 'ECDSA_SHA512';

/**
 * HSM Key Information
 */
export interface HSMKeyInfo {
    keyId: string;
    keyType: 'RSA' | 'EC';
    keySize: number;
    algorithm: SigningAlgorithm[];
    created: Date;
    enabled: boolean;
    metadata?: Record<string, any>;
}

/**
 * HSM Service Interface
 */
export interface HSMService {
    /**
     * Initialize HSM connection
     */
    initialize(config: HSMConfig): Promise<void>;

    /**
     * Sign data using HSM key
     */
    sign(request: HSMSigningRequest): Promise<HSMSigningResult>;

    /**
     * Get public key from HSM
     */
    getPublicKey(keyReference: HSMKeyReference): Promise<PublicKey>;

    /**
     * List available keys
     */
    listKeys(): Promise<HSMKeyInfo[]>;

    /**
     * Create new key in HSM
     */
    createKey(keyType: 'RSA' | 'EC', keySize: number, keyId?: string): Promise<HSMKeyInfo>;

    /**
     * Delete key from HSM
     */
    deleteKey(keyReference: HSMKeyReference): Promise<void>;

    /**
     * Test HSM connectivity
     */
    testConnection(): Promise<boolean>;

    /**
     * Close HSM connection
     */
    close(): Promise<void>;
}

/**
 * HSM Integration Manager Interface
 */
export interface HSMIntegrationManager {
    /**
     * Register HSM provider
     */
    registerProvider(provider: HSMProvider, service: HSMService): void;

    /**
     * Get HSM service by provider
     */
    getProvider(provider: HSMProvider): HSMService | null;

    /**
     * Sign document using specified HSM provider
     */
    signWithHSM(
        document: Buffer,
        keyReference: HSMKeyReference,
        certificate: X509Certificate,
        config?: HSMConfig
    ): Promise<CMSSignature>;

    /**
     * Validate HSM signature
     */
    validateHSMSignature(signature: CMSSignature): Promise<SignatureValidationResult>;

    /**
     * Get available HSM providers
     */
    getAvailableProviders(): HSMProvider[];
}

// HSM-specific errors
export class HSMError extends Error {
    constructor(
        message: string,
        public code: string,
        public provider: HSMProvider,
        public details?: any
    ) {
        super(message);
        this.name = 'HSMError';
    }
}

export class HSMConnectionError extends HSMError {
    constructor(provider: HSMProvider, message: string, details?: any) {
        super(message, 'HSM_CONNECTION_ERROR', provider, details);
        this.name = 'HSMConnectionError';
    }
}

export class HSMSigningError extends HSMError {
    constructor(provider: HSMProvider, message: string, details?: any) {
        super(message, 'HSM_SIGNING_ERROR', provider, details);
        this.name = 'HSMSigningError';
    }
}

export class HSMKeyNotFoundError extends HSMError {
    constructor(provider: HSMProvider, keyId: string, details?: any) {
        super(`Key not found: ${keyId}`, 'HSM_KEY_NOT_FOUND', provider, details);
        this.name = 'HSMKeyNotFoundError';
    }
}

export class HSMAuthenticationError extends HSMError {
    constructor(provider: HSMProvider, message: string, details?: any) {
        super(message, 'HSM_AUTHENTICATION_ERROR', provider, details);
        this.name = 'HSMAuthenticationError';
    }
}

// Timestamp Server Integration Types

/**
 * RFC 3161 Timestamp Authority (TSA) Configuration
 */
export interface TSAConfig {
    url: string;
    username?: string;
    password?: string;
    timeout?: number;
    retryAttempts?: number;
    certificate?: X509Certificate;
    requireNonce?: boolean;
    requestPolicy?: string;
    hashAlgorithm?: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
}

/**
 * Multiple TSA Configuration with failover support
 */
export interface TSAFailoverConfig {
    primary: TSAConfig;
    fallbacks: TSAConfig[];
    maxFailoverAttempts?: number;
    failoverTimeout?: number;
}

/**
 * RFC 3161 Timestamp Request
 */
export interface TimestampRequest {
    messageImprint: MessageImprint;
    reqPolicy?: string;
    nonce?: Buffer;
    certReq?: boolean;
    extensions?: TSAExtension[];
}

/**
 * Message Imprint for timestamp request
 */
export interface MessageImprint {
    hashAlgorithm: string;
    hashedMessage: Buffer;
}

/**
 * TSA Extension
 */
export interface TSAExtension {
    oid: string;
    critical: boolean;
    value: Buffer;
}

/**
 * RFC 3161 Timestamp Response
 */
export interface TimestampResponse {
    status: TSAStatus;
    timeStampToken?: TimeStampToken;
    failInfo?: TSAFailureInfo;
}

/**
 * TSA Response Status
 */
export interface TSAStatus {
    status: TSAStatusCode;
    statusString?: string[];
    failInfo?: TSAFailureInfo;
}

/**
 * TSA Status Codes
 */
export enum TSAStatusCode {
    GRANTED = 0,
    GRANTED_WITH_MODS = 1,
    REJECTION = 2,
    WAITING = 3,
    REVOCATION_WARNING = 4,
    REVOCATION_NOTIFICATION = 5
}

/**
 * TSA Failure Information
 */
export enum TSAFailureInfo {
    BAD_ALG = 0,
    BAD_REQUEST = 2,
    BAD_DATA_FORMAT = 5,
    TIME_NOT_AVAILABLE = 14,
    UNACCEPTED_POLICY = 15,
    UNACCEPTED_EXTENSION = 16,
    ADD_INFO_NOT_AVAILABLE = 17,
    SYSTEM_FAILURE = 25
}

/**
 * Time Stamp Token (TST)
 */
export interface TimeStampToken {
    contentInfo: ContentInfo;
    timeStampInfo: TSTInfo;
    certificates?: X509Certificate[];
    crls?: CRL[];
}

/**
 * Content Info structure
 */
export interface ContentInfo {
    contentType: string;
    content: Buffer;
}

/**
 * Time Stamp Info (TSTInfo)
 */
export interface TSTInfo {
    version: number;
    policy: string;
    messageImprint: MessageImprint;
    serialNumber: Buffer;
    genTime: Date;
    accuracy?: TSAAccuracy;
    ordering?: boolean;
    nonce?: Buffer;
    tsa?: GeneralName;
    extensions?: TSAExtension[];
}

/**
 * TSA Accuracy
 */
export interface TSAAccuracy {
    seconds?: number;
    millis?: number;
    micros?: number;
}

/**
 * General Name for TSA identification
 */
export interface GeneralName {
    type: GeneralNameType;
    value: string | Buffer;
}

/**
 * General Name Types
 */
export enum GeneralNameType {
    OTHER_NAME = 0,
    RFC822_NAME = 1,
    DNS_NAME = 2,
    X400_ADDRESS = 3,
    DIRECTORY_NAME = 4,
    EDI_PARTY_NAME = 5,
    UNIFORM_RESOURCE_IDENTIFIER = 6,
    IP_ADDRESS = 7,
    REGISTERED_ID = 8
}

/**
 * Certificate Revocation List
 */
export interface CRL {
    issuer: CertificateSubject;
    thisUpdate: Date;
    nextUpdate?: Date;
    revokedCertificates: RevokedCertificate[];
    signature: Buffer;
    raw: Buffer;
}

/**
 * Revoked Certificate entry
 */
export interface RevokedCertificate {
    serialNumber: string;
    revocationDate: Date;
    reason?: CRLReason;
}

/**
 * CRL Revocation Reasons
 */
export enum CRLReason {
    UNSPECIFIED = 0,
    KEY_COMPROMISE = 1,
    CA_COMPROMISE = 2,
    AFFILIATION_CHANGED = 3,
    SUPERSEDED = 4,
    CESSATION_OF_OPERATION = 5,
    CERTIFICATE_HOLD = 6,
    REMOVE_FROM_CRL = 8,
    PRIVILEGE_WITHDRAWN = 9,
    AA_COMPROMISE = 10
}

/**
 * Timestamp Verification Result
 */
export interface TimestampVerificationResult {
    isValid: boolean;
    timestamp: Date;
    tsaUrl: string;
    certificate: X509Certificate;
    messageImprint: MessageImprint;
    policy?: string;
    accuracy?: TSAAccuracy;
    errors: string[];
    warnings: string[];
}

/**
 * Timestamp Server Integration Manager Interface
 */
export interface TimestampServerManager {
    /**
     * Create RFC 3161 compliant timestamp request
     */
    createTimestampRequest(
        data: Buffer,
        options?: TimestampRequestOptions
    ): Promise<TimestampRequest>;

    /**
     * Send timestamp request to TSA
     */
    requestTimestamp(
        request: TimestampRequest,
        config: TSAConfig
    ): Promise<TimestampResponse>;

    /**
     * Request timestamp with failover support
     */
    requestTimestampWithFailover(
        request: TimestampRequest,
        config: TSAFailoverConfig
    ): Promise<TimestampResponse>;

    /**
     * Verify timestamp response
     */
    verifyTimestampResponse(
        response: TimestampResponse,
        originalData: Buffer
    ): Promise<TimestampVerificationResult>;

    /**
     * Extract timestamp from CMS signature
     */
    extractTimestamp(signature: CMSSignature): Promise<Timestamp | null>;

    /**
     * Verify timestamp integrity
     */
    verifyTimestamp(
        timestamp: Timestamp,
        originalData: Buffer
    ): Promise<TimestampVerificationResult>;

    /**
     * Add timestamp to existing signature
     */
    addTimestampToSignature(
        signature: CMSSignature,
        config: TSAConfig
    ): Promise<CMSSignature>;

    /**
     * Generate audit trail for timestamp operations
     */
    generateTimestampAuditTrail(
        operation: TimestampOperation,
        result: TimestampVerificationResult
    ): Promise<TimestampAuditEntry>;
}

/**
 * Timestamp Request Options
 */
export interface TimestampRequestOptions {
    hashAlgorithm?: 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512';
    includeNonce?: boolean;
    requestCertificate?: boolean;
    policy?: string;
    extensions?: TSAExtension[];
}

/**
 * Timestamp Operation for audit trail
 */
export interface TimestampOperation {
    type: 'REQUEST' | 'VERIFY' | 'EXTRACT' | 'ADD_TO_SIGNATURE';
    documentHash: string;
    tsaUrl: string;
    timestamp: Date;
    userId?: string;
    organizationId?: string;
    metadata?: Record<string, any>;
}

/**
 * Timestamp Audit Entry
 */
export interface TimestampAuditEntry {
    id: string;
    operation: TimestampOperation;
    result: TimestampVerificationResult;
    duration: number;
    success: boolean;
    error?: string;
    createdAt: Date;
}

// Timestamp-specific errors
export class TimestampServerError extends Error {
    constructor(
        message: string,
        public code: string,
        public tsaUrl?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'TimestampServerError';
    }
}

export class TSAConnectionError extends TimestampServerError {
    constructor(tsaUrl: string, message: string, details?: any) {
        super(message, 'TSA_CONNECTION_ERROR', tsaUrl, details);
        this.name = 'TSAConnectionError';
    }
}

export class TSAResponseError extends TimestampServerError {
    constructor(tsaUrl: string, status: TSAStatusCode, message: string, details?: any) {
        super(message, 'TSA_RESPONSE_ERROR', tsaUrl, { status, ...details });
        this.name = 'TSAResponseError';
    }
}

export class TimestampValidationError extends TimestampServerError {
    constructor(message: string, details?: any) {
        super(message, 'TIMESTAMP_VALIDATION_ERROR', undefined, details);
        this.name = 'TimestampValidationError';
    }
}

// Signature Appearance System Types

/**
 * Signature appearance configuration
 */
export interface SignatureAppearanceConfig {
    // Image-based signature
    imageData?: string; // Base64 encoded image
    imageFormat?: 'png' | 'jpg' | 'jpeg';

    // Text-based signature
    text?: string;
    font?: 'Helvetica' | 'Times-Roman' | 'Courier';
    fontSize?: number;

    // Positioning and sizing
    x: number;
    y: number;
    width: number;
    height: number;
    page?: number;

    // Appearance customization
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    textColor?: string;

    // Branding elements
    logo?: string; // Base64 encoded logo
    logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
    logoSize?: number;

    // Signature metadata display
    showTimestamp?: boolean;
    showSignerName?: boolean;
    showReason?: boolean;
    showLocation?: boolean;

    // Multi-page support
    multiPageCoordination?: boolean;
    pageReferences?: Array<{
        page: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;

    // Rotation and scaling
    rotation?: number;
    scaleX?: number;
    scaleY?: number;

    // Quality settings
    imageQuality?: number;
    antiAliasing?: boolean;
}

/**
 * Signature appearance metadata
 */
export interface SignatureAppearanceMetadata {
    signerName?: string;
    signingTime?: Date;
    reason?: string;
    location?: string;
    contactInfo?: string;
    certificateInfo?: {
        subject: string;
        issuer: string;
        serialNumber: string;
        validFrom: Date;
        validTo: Date;
    };
}

/**
 * Signature appearance result
 */
export interface SignatureAppearanceResult {
    success: boolean;
    signatureId: string;
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
        page: number;
    };
    multiPageReferences?: Array<{
        page: number;
        x: number;
        y: number;
        width: number;
        height: number;
    }>;
    metadata: SignatureAppearanceMetadata;
    processingTime: number;
}

/**
 * Signature appearance engine interface
 */
export interface SignatureAppearanceEngine {
    generateSignatureAppearance(
        document: PDFDocument,
        config: SignatureAppearanceConfig,
        metadata: SignatureAppearanceMetadata
    ): Promise<SignatureAppearanceResult>;

    clearCache(): void;
}

// Signature appearance errors
export class SignatureAppearanceError extends PDFProcessingError {
    constructor(message: string, details?: any) {
        super(message, 'SIGNATURE_APPEARANCE_ERROR', details);
        this.name = 'SignatureAppearanceError';
    }
}
// PDF Optimization System Types

/**
 * Comprehensive optimization result
 */
export interface OptimizationResult {
    success: boolean;
    compressionStats: CompressionStats;
    pageOptimizations: ImageOptimizationResult[];
    fontOptimization?: FontOptimizationResult;
    removedObjectsCount: number;
    processingTime: number;
    optimizationsApplied: string[];
}

/**
 * Compression statistics
 */
export interface CompressionStats {
    originalSize: number;
    optimizedSize: number;
    compressionRatio: number;
    spaceSaved: number;
    compressionPercentage: number;
}

/**
 * Image optimization result for a page
 */
export interface ImageOptimizationResult {
    pageNumber: number;
    imagesProcessed: number;
    originalTotalSize: number;
    optimizedTotalSize: number;
    compressionRatio: number;
}

/**
 * Font optimization result
 */
export interface FontOptimizationResult {
    fontsProcessed: number;
    originalTotalSize: number;
    optimizedTotalSize: number;
    subsetFonts: FontSubsetInfo[];
    removedFonts: string[];
}

/**
 * Font subset information
 */
export interface FontSubsetInfo {
    fontName: string;
    originalSize: number;
    subsetSize: number;
    charactersRemoved: number;
}

/**
 * Incremental update options for performance optimization
 */
export interface IncrementalUpdateOptions {
    preserveOriginalStructure?: boolean;
    minimizeChanges?: boolean;
    compressUpdates?: boolean;
}

/**
 * PDF Optimization Engine interface
 */
export interface PDFOptimizationEngine {
    /**
     * Optimize a PDF document with comprehensive optimization techniques
     */
    optimizePDF(
        document: PDFDocument,
        options?: OptimizationOptions
    ): Promise<{ document: PDFDocument; result: OptimizationResult }>;

    /**
     * Optimize PDF with incremental updates for better performance
     */
    optimizeWithIncrementalUpdates(
        document: PDFDocument,
        options?: IncrementalUpdateOptions
    ): Promise<{ document: PDFDocument; updateInfo: any }>;

    /**
     * Analyze document for optimization opportunities
     */
    analyzeOptimizationOpportunities(document: PDFDocument): Promise<{
        recommendations: string[];
        estimatedSavings: number;
        analysisDetails: any;
    }>;
}

// PDF Optimization errors
export class PDFOptimizationError extends PDFProcessingError {
    constructor(message: string, details?: any) {
        super(message, 'PDF_OPTIMIZATION_ERROR', details);
        this.name = 'PDFOptimizationError';
    }
}

export class ImageOptimizationError extends PDFOptimizationError {
    constructor(message: string, details?: any) {
        super(message, details);
        this.name = 'ImageOptimizationError';
    }
}

export class FontOptimizationError extends PDFOptimizationError {
    constructor(message: string, details?: any) {
        super(message, details);
        this.name = 'FontOptimizationError';
    }
}

// PDF Conversion System Types

/**
 * Supported input formats for conversion
 */
export type ConversionInputFormat = 'docx' | 'doc' | 'html' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'tiff' | 'svg' | 'pdf';

/**
 * Supported output formats for conversion
 */
export type ConversionOutputFormat = 'pdf' | 'pdf-a1' | 'pdf-a2' | 'pdf-a3';

/**
 * DOCX to PDF conversion options
 */
export interface DOCXConversionOptions {
    preserveFormatting?: boolean;
    includeImages?: boolean;
    includeHeaders?: boolean;
    includeFooters?: boolean;
    pageMargins?: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    orientation?: 'portrait' | 'landscape';
    imageQuality?: number; // 1-100
    fontEmbedding?: boolean;
}

/**
 * HTML to PDF conversion options
 */
export interface HTMLConversionOptions {
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    orientation?: 'portrait' | 'landscape';
    margins?: {
        top: string;
        bottom: string;
        left: string;
        right: string;
    };
    printBackground?: boolean;
    displayHeaderFooter?: boolean;
    headerTemplate?: string;
    footerTemplate?: string;
    scale?: number; // 0.1 to 2
    waitForSelector?: string;
    timeout?: number;
    baseUrl?: string;
}

/**
 * Image to PDF conversion options
 */
export interface ImageConversionOptions {
    pageSize?: 'A4' | 'Letter' | 'Legal' | 'A3' | 'A5';
    orientation?: 'portrait' | 'landscape';
    fitToPage?: boolean;
    maintainAspectRatio?: boolean;
    imageQuality?: number; // 1-100
    compression?: 'none' | 'jpeg' | 'flate';
    margins?: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    centerImage?: boolean;
}

/**
 * PDF/A conversion options for archival
 */
export interface PDFAConversionOptions {
    conformanceLevel: 'pdf-a1a' | 'pdf-a1b' | 'pdf-a2a' | 'pdf-a2b' | 'pdf-a2u' | 'pdf-a3a' | 'pdf-a3b' | 'pdf-a3u';
    embedFonts?: boolean;
    embedColorProfile?: boolean;
    validateCompliance?: boolean;
    metadata?: {
        title?: string;
        author?: string;
        subject?: string;
        keywords?: string[];
        creator?: string;
    };
}

/**
 * Conversion result
 */
export interface ConversionResult {
    success: boolean;
    outputBuffer?: Buffer;
    inputFormat: ConversionInputFormat;
    outputFormat: ConversionOutputFormat;
    originalSize: number;
    convertedSize: number;
    processingTime: number;
    metadata?: {
        pageCount?: number;
        hasImages?: boolean;
        hasFonts?: boolean;
        colorSpace?: string;
        pdfVersion?: string;
    };
    warnings?: string[];
    error?: string;
}

/**
 * Batch conversion options
 */
export interface BatchConversionOptions {
    inputFormat: ConversionInputFormat;
    outputFormat: ConversionOutputFormat;
    files: Array<{
        name: string;
        buffer: Buffer;
        options?: DOCXConversionOptions | HTMLConversionOptions | ImageConversionOptions | PDFAConversionOptions;
    }>;
    parallelProcessing?: boolean;
    maxConcurrency?: number;
}

/**
 * Batch conversion result
 */
export interface BatchConversionResult {
    success: boolean;
    results: Array<ConversionResult & { fileName: string }>;
    totalProcessingTime: number;
    successCount: number;
    failureCount: number;
    totalOriginalSize: number;
    totalConvertedSize: number;
}

/**
 * PDF Conversion Engine interface
 */
export interface PDFConversionEngine {
    /**
     * Convert DOCX to PDF with formatting preservation
     */
    convertDOCXToPDF(
        docxBuffer: Buffer,
        options?: DOCXConversionOptions
    ): Promise<ConversionResult>;

    /**
     * Convert HTML to PDF for web content
     */
    convertHTMLToPDF(
        htmlContent: string,
        options?: HTMLConversionOptions
    ): Promise<ConversionResult>;

    /**
     * Convert image to PDF with optimization
     */
    convertImageToPDF(
        imageBuffer: Buffer,
        imageFormat: 'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'tiff' | 'svg',
        options?: ImageConversionOptions
    ): Promise<ConversionResult>;

    /**
     * Convert PDF to PDF/A for long-term archival
     */
    convertToPDFA(
        pdfBuffer: Buffer,
        options: PDFAConversionOptions
    ): Promise<ConversionResult>;

    /**
     * Batch convert multiple files
     */
    batchConvert(
        batchOptions: BatchConversionOptions
    ): Promise<BatchConversionResult>;

    /**
     * Validate conversion capabilities for a given format
     */
    validateConversionSupport(
        inputFormat: ConversionInputFormat,
        outputFormat: ConversionOutputFormat
    ): Promise<boolean>;

    /**
     * Get conversion metadata without performing conversion
     */
    analyzeConversionRequirements(
        inputBuffer: Buffer,
        inputFormat: ConversionInputFormat
    ): Promise<{
        estimatedOutputSize: number;
        processingComplexity: 'low' | 'medium' | 'high';
        supportedOutputFormats: ConversionOutputFormat[];
        warnings: string[];
    }>;
}

// PDF Conversion errors
export class PDFConversionError extends PDFProcessingError {
    constructor(
        message: string,
        public inputFormat: ConversionInputFormat,
        public outputFormat: ConversionOutputFormat,
        details?: any
    ) {
        super(message, 'PDF_CONVERSION_ERROR', details);
        this.name = 'PDFConversionError';
    }
}

export class DOCXConversionError extends PDFConversionError {
    constructor(message: string, details?: any) {
        super(message, 'docx', 'pdf', details);
        this.name = 'DOCXConversionError';
    }
}

export class HTMLConversionError extends PDFConversionError {
    constructor(message: string, details?: any) {
        super(message, 'html', 'pdf', details);
        this.name = 'HTMLConversionError';
    }
}

export class ImageConversionError extends PDFConversionError {
    constructor(message: string, inputFormat: ConversionInputFormat, details?: any) {
        super(message, inputFormat, 'pdf', details);
        this.name = 'ImageConversionError';
    }
}

export class PDFAConversionError extends PDFConversionError {
    constructor(message: string, details?: any) {
        super(message, 'docx', 'pdf-a1', details); // Using 'docx' as a valid input format
        this.name = 'PDFAConversionError';
    }
}

// Signature Capture System Types

/**
 * Signature capture method types
 */
export type SignatureCaptureMethod = 'drawn' | 'typed' | 'uploaded';

/**
 * Signature quality levels
 */
export type SignatureQualityLevel = 'low' | 'medium' | 'high' | 'ultra';

/**
 * Drawn signature stroke data
 */
export interface SignatureStroke {
    points: Array<{
        x: number;
        y: number;
        pressure?: number;
        timestamp?: number;
    }>;
    strokeWidth: number;
    color: string;
    opacity: number;
}

/**
 * Drawn signature data
 */
export interface DrawnSignatureData {
    method: 'drawn';
    strokes: SignatureStroke[];
    canvasWidth: number;
    canvasHeight: number;
    smoothing: boolean;
    antiAliasing: boolean;
}

/**
 * Typed signature data
 */
export interface TypedSignatureData {
    method: 'typed';
    text: string;
    fontFamily: 'Helvetica' | 'Times-Roman' | 'Courier' | 'Arial' | 'Georgia' | 'Verdana';
    fontSize: number;
    fontWeight: 'normal' | 'bold';
    fontStyle: 'normal' | 'italic';
    color: string;
    backgroundColor?: string;
    textAlign: 'left' | 'center' | 'right';
    letterSpacing: number;
    lineHeight: number;
}

/**
 * Uploaded signature data
 */
export interface UploadedSignatureData {
    method: 'uploaded';
    imageData: string; // Base64 encoded
    originalFormat: 'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'svg';
    originalWidth: number;
    originalHeight: number;
    preserveAspectRatio: boolean;
    removeBackground: boolean;
    enhanceContrast: boolean;
}

/**
 * Union type for all signature capture data
 */
export type SignatureCaptureData = DrawnSignatureData | TypedSignatureData | UploadedSignatureData;

/**
 * Signature capture options
 */
export interface SignatureCaptureOptions {
    targetWidth: number;
    targetHeight: number;
    qualityLevel: SignatureQualityLevel;
    outputFormat: 'png' | 'jpeg';
    backgroundColor?: string;
    padding: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    dpi: number;
    compression: number;
}

/**
 * Signature quality metrics
 */
export interface SignatureQualityMetrics {
    score: number;
    factors: {
        resolution: number;
        contrast: number;
        strokeConsistency: number;
        aspectRatio: number;
        backgroundNoise: number;
    };
    recommendations: string[];
    isAcceptable: boolean;
    enhancementApplied: boolean;
}

/**
 * Signature capture result
 */
export interface SignatureCaptureResult {
    success: boolean;
    signatureId: string;
    imageData: string; // Base64 encoded processed signature
    format: 'png' | 'jpeg';
    width: number;
    height: number;
    qualityMetrics: SignatureQualityMetrics;
    processingTime: number;
    metadata: {
        captureMethod: SignatureCaptureMethod;
        originalDimensions: {
            width: number;
            height: number;
        };
        processingSteps: string[];
        timestamp: Date;
    };
}

/**
 * Signature Capture Engine Interface
 */
export interface SignatureCaptureEngine {
    /**
     * Capture and process a signature from various input methods
     */
    captureSignature(
        signatureData: SignatureCaptureData,
        options?: Partial<SignatureCaptureOptions>
    ): Promise<SignatureCaptureResult>;
}

// Note: Signature capture error classes are defined in signature-capture-engine.ts

// Batch Signing System Types

/**
 * Batch signing request configuration
 */
export interface BatchSigningRequest {
    documents: Array<{
        documentId: string;
        documentBuffer: Buffer;
        signatures: Array<{
            fieldName?: string;
            page: number;
            x: number;
            y: number;
            width: number;
            height: number;
            signerName?: string;
            reason?: string;
            location?: string;
            contactInfo?: string;
            certificate?: X509Certificate;
            privateKey?: PrivateKey;
            appearance?: SignatureAppearanceConfig;
        }>;
    }>;
    options?: BatchSigningOptions;
}

/**
 * Batch signing options
 */
export interface BatchSigningOptions {
    useJobQueue?: boolean;
    parallelSigning?: boolean;
    optimizeDocuments?: boolean;
    continueOnError?: boolean;
    enableErrorRecovery?: boolean;
    maxRetries?: number;
    timeout?: number;
    concurrency?: number;
    progressReporting?: boolean;
}

/**
 * Batch signing result
 */
export interface BatchSigningResult {
    batchId: string;
    success: boolean;
    processedDocuments: Array<{
        documentId: string;
        success: boolean;
        signatures: any[];
        processingTime: number;
        errors?: BatchSigningError[];
    }>;
    totalDocuments: number;
    successfulDocuments: number;
    failedDocuments: number;
    processingTime: number;
    errors: BatchSigningError[];
    metrics: {
        averageDocumentTime: number;
        throughputPerMinute: number;
        errorRate: number;
    };
}

/**
 * Batch signing progress tracking
 */
export interface BatchSigningProgress {
    batchId: string;
    status: BatchOperationStatus;
    totalDocuments: number;
    processedDocuments: number;
    successfulDocuments: number;
    failedDocuments: number;
    startedAt: Date;
    completedAt?: Date;
    estimatedCompletion?: Date;
    documents: BatchDocumentStatus[];
    errors: BatchSigningError[];
}

/**
 * Batch operation status
 */
export type BatchOperationStatus =
    | 'preparing'
    | 'signing'
    | 'completed'
    | 'failed'
    | 'cancelled'
    | 'partial';

/**
 * Individual document status within a batch
 */
export interface BatchDocumentStatus {
    documentId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    progress: number; // 0-100
    signatures: Array<{
        signatureId: string;
        fieldName: string;
        success: boolean;
        timestamp: Date;
    }>;
    startedAt?: Date;
    completedAt?: Date;
    errors?: BatchSigningError[];
}

/**
 * Document preparation result for batch processing
 */
export interface BatchDocumentPreparation {
    documentId: string;
    pdfDocument: PDFDocument;
    signatures: any[];
    metadata: {
        originalSize: number;
        optimizedSize: number;
        pageCount: number;
        signatureCount: number;
    };
}

/**
 * Batch signature application configuration
 */
export interface BatchSignatureApplication {
    batchId: string;
    documentId: string;
    signatures: Array<{
        signatureId: string;
        fieldInfo: SignatureFieldInfo;
        certificate?: X509Certificate;
        privateKey?: PrivateKey;
        appearance?: SignatureAppearanceConfig;
        metadata?: SignatureAppearanceMetadata;
    }>;
    options: {
        parallelApplication: boolean;
        validateAfterSigning: boolean;
        generateAuditTrail: boolean;
    };
}

/**
 * Batch progress report
 */
export interface BatchProgressReport {
    batchId: string;
    status: BatchOperationStatus;
    summary: {
        totalDocuments: number;
        processedDocuments: number;
        successfulDocuments: number;
        failedDocuments: number;
        progressPercentage: number;
    };
    timing: {
        startedAt: Date;
        completedAt?: Date;
        estimatedCompletion?: Date;
        totalProcessingTime: number;
        averageDocumentTime: number;
    };
    performance: {
        throughputPerMinute: number;
        errorRate: number;
        retryCount: number;
    };
    documents: BatchDocumentStatus[];
    errors: BatchSigningError[];
}

/**
 * Batch error recovery configuration
 */
export interface BatchErrorRecovery {
    enableAutoRetry: boolean;
    maxRetryAttempts: number;
    retryDelay: number;
    recoverableErrorTypes: string[];
    fallbackStrategies: Array<{
        errorType: string;
        strategy: 'skip' | 'retry' | 'fallback' | 'manual';
        parameters?: Record<string, any>;
    }>;
}

/**
 * Batch signing metrics
 */
export interface BatchSigningMetrics {
    batchId: string;
    totalDocuments: number;
    totalSignatures: number;
    processingStartTime: number;
    documentPreparationTime: number;
    signatureApplicationTime: number;
    totalProcessingTime: number;
    averageDocumentTime: number;
    throughputPerMinute: number;
    errorRate: number;
    retryCount: number;
}

/**
 * Batch signing audit entry
 */
export interface BatchSigningAuditEntry {
    id: string;
    batchId: string;
    documentId?: string;
    signatureId?: string;
    action: 'batch_started' | 'document_processed' | 'signature_applied' | 'batch_completed' | 'error_occurred' | 'recovery_attempted';
    timestamp: Date;
    userId?: string;
    organizationId?: string;
    details: Record<string, any>;
    result: 'success' | 'failure' | 'partial';
    processingTime?: number;
}

/**
 * Batch signing error types
 */
export interface BatchSigningError {
    type: 'batch_initialization' | 'document_preparation' | 'signature_application' | 'document_processing' | 'batch_processing' | 'job_processing';
    documentId?: string;
    signatureIndex?: number;
    message: string;
    timestamp: Date;
    recoverable: boolean;
    retryCount?: number;
    details?: Record<string, any>;
}

/**
 * Batch Signing Engine Interface
 */
export interface BatchSigningEngine {
    /**
     * Start a batch signing operation
     */
    startBatchSigning(request: BatchSigningRequest): Promise<BatchSigningResult>;

    /**
     * Get progress of a batch operation
     */
    getBatchProgress(batchId: string): Promise<BatchSigningProgress | null>;

    /**
     * Get detailed report of a batch operation
     */
    getBatchReport(batchId: string): Promise<BatchProgressReport | null>;

    /**
     * Cancel a batch operation
     */
    cancelBatch(batchId: string): Promise<boolean>;

    /**
     * Clean up completed batch data
     */
    cleanupBatch(batchId: string): Promise<void>;

    /**
     * Get health status of the batch signing engine
     */
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        activeBatches: number;
        totalProcessedDocuments: number;
        averageProcessingTime: number;
    }>;
}

// Batch Signing errors
export class BatchSigningError extends Error {
    constructor(
        message: string,
        public code: string,
        public batchId?: string,
        public documentId?: string
    ) {
        super(message);
        this.name = 'BatchSigningError';
    }
}

export class BatchPreparationError extends BatchSigningError {
    constructor(message: string, batchId: string, documentId?: string) {
        super(message, 'BATCH_PREPARATION_ERROR', batchId, documentId);
        this.name = 'BatchPreparationError';
    }
}

export class BatchProcessingError extends BatchSigningError {
    constructor(message: string, batchId: string, documentId?: string) {
        super(message, 'BATCH_PROCESSING_ERROR', batchId, documentId);
        this.name = 'BatchProcessingError';
    }
}

export class BatchTimeoutError extends BatchSigningError {
    constructor(message: string, batchId: string) {
        super(message, 'BATCH_TIMEOUT_ERROR', batchId);
        this.name = 'BatchTimeoutError';
    }
}