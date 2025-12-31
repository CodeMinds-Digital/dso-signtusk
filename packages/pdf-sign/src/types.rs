//! Core data types for the PDF signing library

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Represents a PDF document in memory
#[derive(Debug, Clone)]
pub struct PdfDocument {
    /// PDF version (e.g., "1.7")
    pub version: String,
    /// Number of pages in the document
    pub page_count: u32,
    /// Document metadata
    pub metadata: PdfMetadata,
    /// Existing signature fields in the document
    pub signature_fields: Vec<SignatureField>,
    /// Existing digital signatures
    pub existing_signatures: Vec<DigitalSignature>,
    /// Raw PDF data
    pub data: Vec<u8>,
}

/// PDF document metadata
#[derive(Debug, Clone, Default)]
pub struct PdfMetadata {
    pub title: Option<String>,
    pub author: Option<String>,
    pub subject: Option<String>,
    pub keywords: Option<String>,
    pub creator: Option<String>,
    pub producer: Option<String>,
    pub creation_date: Option<DateTime<Utc>>,
    pub modification_date: Option<DateTime<Utc>>,
    pub custom_properties: HashMap<String, String>,
}

/// Signing credentials containing certificate and private key
#[derive(Debug, Clone)]
pub struct SigningCredentials {
    /// The signing certificate
    pub certificate: X509Certificate,
    /// The private key for signing
    pub private_key: PrivateKey,
    /// Certificate chain (including intermediate certificates)
    pub certificate_chain: Vec<X509Certificate>,
}

/// X.509 certificate representation
#[derive(Debug, Clone)]
pub struct X509Certificate {
    /// DER-encoded certificate data
    pub der_data: Vec<u8>,
    /// Certificate subject name
    pub subject: String,
    /// Certificate issuer name
    pub issuer: String,
    /// Certificate serial number
    pub serial_number: String,
    /// Certificate validity period start
    pub not_before: DateTime<Utc>,
    /// Certificate validity period end
    pub not_after: DateTime<Utc>,
    /// Public key algorithm
    pub public_key_algorithm: String,
    /// Key usage extensions
    pub key_usage: Vec<String>,
}

/// Private key for signing operations
#[derive(Debug, Clone)]
pub struct PrivateKey {
    /// Key algorithm (RSA, ECDSA)
    pub algorithm: KeyAlgorithm,
    /// Key size in bits
    pub key_size: u32,
    /// DER-encoded private key data
    pub der_data: Vec<u8>,
}

/// Supported key algorithms
#[derive(Debug, Clone, PartialEq)]
pub enum KeyAlgorithm {
    Rsa,
    EcdsaP256,
    EcdsaP384,
    EcdsaP521,
}

/// Digital signature information
#[derive(Debug, Clone)]
pub struct DigitalSignature {
    /// PKCS#7 signature data
    pub signature_data: Vec<u8>,
    /// Time when the signature was created
    pub signing_time: DateTime<Utc>,
    /// Name of the signer
    pub signer_name: String,
    /// Reason for signing
    pub reason: Option<String>,
    /// Location where signing occurred
    pub location: Option<String>,
    /// Contact information
    pub contact_info: Option<String>,
    /// Certificate information
    pub certificate_info: CertificateInfo,
    /// Signature field name
    pub field_name: String,
}

/// Certificate information extracted from a signature
#[derive(Debug, Clone)]
pub struct CertificateInfo {
    pub subject: String,
    pub issuer: String,
    pub serial_number: String,
    pub not_before: DateTime<Utc>,
    pub not_after: DateTime<Utc>,
    pub key_algorithm: String,
    pub key_size: u32,
    /// DER-encoded certificate data
    pub der_data: Vec<u8>,
}

/// Signature field in a PDF document
#[derive(Debug, Clone)]
pub struct SignatureField {
    /// Field name
    pub name: String,
    /// Page number (0-based)
    pub page: u32,
    /// Field bounds on the page
    pub bounds: Rectangle,
    /// Visual appearance configuration
    pub appearance: Option<SignatureAppearance>,
    /// Whether the field is already signed
    pub is_signed: bool,
}

/// Rectangle coordinates
#[derive(Debug, Clone, PartialEq)]
pub struct Rectangle {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

/// Signature appearance configuration
#[derive(Debug, Clone)]
pub struct SignatureAppearance {
    /// Whether the signature should be visible
    pub visible: bool,
    /// Page number for visible signature (0-based)
    pub page: Option<u32>,
    /// Position and size of the signature
    pub bounds: Option<Rectangle>,
    /// Text to display in the signature
    pub text: Option<String>,
    /// Image data for signature appearance
    pub image: Option<Vec<u8>>,
    /// Background color (RGB)
    pub background_color: Option<Color>,
    /// Border color (RGB)
    pub border_color: Option<Color>,
}

/// RGB color representation
#[derive(Debug, Clone)]
pub struct Color {
    pub r: u8,
    pub g: u8,
    pub b: u8,
}

/// Signing options and configuration
#[derive(Debug, Clone, Default)]
pub struct SigningOptions {
    /// Reason for signing
    pub reason: Option<String>,
    /// Location where signing occurred
    pub location: Option<String>,
    /// Contact information
    pub contact_info: Option<String>,
    /// Signature appearance
    pub appearance: Option<SignatureAppearance>,
    /// Timestamp server URL for RFC 3161 timestamps
    pub timestamp_server: Option<String>,
    /// Hash algorithm to use
    pub hash_algorithm: Option<HashAlgorithm>,
    /// Signature algorithm to use
    pub signature_algorithm: Option<SignatureAlgorithm>,
}

/// Supported hash algorithms
#[derive(Debug, Clone, PartialEq)]
pub enum HashAlgorithm {
    Sha256,
    Sha384,
    Sha512,
}

/// Supported signature algorithms
#[derive(Debug, Clone, PartialEq)]
pub enum SignatureAlgorithm {
    RsaPkcs1Sha256,
    RsaPkcs1Sha384,
    RsaPkcs1Sha512,
    RsaPss,
    EcdsaP256Sha256,
    EcdsaP384Sha384,
    EcdsaP521Sha512,
}

/// Signature validation result
#[derive(Debug, Clone)]
pub struct ValidationResult {
    /// Whether the signature is valid
    pub is_valid: bool,
    /// Index of the signature in the document
    pub signature_index: u32,
    /// Name of the signer
    pub signer_name: String,
    /// Time when the signature was created
    pub signing_time: DateTime<Utc>,
    /// Whether the certificate is valid
    pub certificate_valid: bool,
    /// Whether the document is intact (not modified after signing)
    pub document_intact: bool,
    /// Validation errors
    pub errors: Vec<ValidationError>,
    /// Validation warnings
    pub warnings: Vec<ValidationWarning>,
}

/// Validation error information
#[derive(Debug, Clone)]
pub struct ValidationError {
    pub code: String,
    pub message: String,
    pub severity: ErrorSeverity,
}

/// Validation warning information
#[derive(Debug, Clone)]
pub struct ValidationWarning {
    pub code: String,
    pub message: String,
}

/// Error severity levels
#[derive(Debug, Clone, PartialEq)]
pub enum ErrorSeverity {
    Low,
    Medium,
    High,
    Critical,
}

/// Certificate validation result
#[derive(Debug, Clone)]
pub struct CertificateValidationResult {
    pub is_valid: bool,
    pub chain_valid: bool,
    pub not_expired: bool,
    pub not_revoked: bool,
    pub trusted: bool,
    pub errors: Vec<ValidationError>,
    pub warnings: Vec<ValidationWarning>,
}

/// Library capabilities information
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capabilities {
    pub hash_algorithms: Vec<String>,
    pub signature_algorithms: Vec<String>,
    pub pdf_versions: Vec<String>,
    pub standards: Vec<String>,
}

/// System capabilities including platform and performance features
#[derive(Debug, Clone)]
pub struct SystemCapabilities {
    pub hash_algorithms: Vec<String>,
    pub signature_algorithms: Vec<String>,
    pub pdf_versions: Vec<String>,
    pub standards: Vec<String>,
    pub platform_features: Vec<String>,
    pub performance_features: Vec<String>,
}

/// Platform information
#[derive(Debug, Clone)]
pub struct PlatformInfo {
    pub os: String,
    pub arch: String,
    pub has_hardware_crypto: bool,
    pub crypto_providers: Vec<String>,
}

/// PKCS#7 signer information
#[derive(Debug, Clone)]
pub struct SignerInfo {
    pub issuer: String,
    pub serial_number: String,
    pub digest_algorithm: String,
    pub signature_algorithm: String,
    pub signature: Vec<u8>,
}

/// Signature field definition for creating new fields
#[derive(Debug, Clone)]
pub struct SignatureFieldDefinition {
    pub name: String,
    pub page: u32,
    pub bounds: Rectangle,
    pub appearance: Option<SignatureAppearance>,
}

/// PDF modification operation
#[derive(Debug, Clone)]
pub enum PdfModification {
    AddSignatureField(SignatureFieldDefinition),
    EmbedSignature {
        field_name: String,
        signature_data: Vec<u8>,
        appearance: Option<SignatureAppearance>,
    },
    UpdateMetadata(PdfMetadata),
}

/// PKCS#7 creation options
#[derive(Debug, Clone, Default)]
pub struct Pkcs7Options {
    pub include_signing_time: bool,
    pub include_content: bool,
    pub detached_signature: bool,
    pub timestamp_server: Option<String>,
}

/// Extracted signature information with full metadata
#[derive(Debug, Clone)]
pub struct ExtractedSignature {
    /// Index of the signature in the document
    pub signature_index: usize,
    /// Name of the signature field
    pub field_name: String,
    /// Signature field information (if available)
    pub signature_field: Option<SignatureField>,
    /// Name of the signer
    pub signer_name: String,
    /// Time when the signature was created
    pub signing_time: DateTime<Utc>,
    /// Reason for signing
    pub reason: Option<String>,
    /// Location where signing occurred
    pub location: Option<String>,
    /// Contact information
    pub contact_info: Option<String>,
    /// Certificate chain
    pub certificate_chain: Vec<CertificateInfo>,
    /// Signature algorithm information
    pub signature_algorithm: SignatureAlgorithmInfo,
    /// Raw signature data
    pub signature_data: Vec<u8>,
    /// Document hash at time of signing
    pub document_hash: Vec<u8>,
    /// PKCS#7 signature information
    pub pkcs7_info: Pkcs7SignatureInfo,
}

/// Signature algorithm information
#[derive(Debug, Clone)]
pub struct SignatureAlgorithmInfo {
    /// Signature algorithm
    pub algorithm: SignatureAlgorithm,
    /// Hash algorithm used
    pub hash_algorithm: HashAlgorithm,
    /// Key size in bits
    pub key_size: u32,
}

/// Signature verification result
#[derive(Debug, Clone)]
pub struct SignatureVerificationResult {
    /// Whether the signature is valid overall
    pub is_valid: bool,
    /// Index of the signature in the document
    pub signature_index: usize,
    /// Name of the signer
    pub signer_name: String,
    /// Time when the signature was created
    pub signing_time: DateTime<Utc>,
    /// Whether the certificate is valid
    pub certificate_valid: bool,
    /// Whether the document is intact (not modified after signing)
    pub document_intact: bool,
    /// Validation errors
    pub errors: Vec<String>,
    /// Validation warnings
    pub warnings: Vec<String>,
}

/// Document tampering detection result
#[derive(Debug, Clone)]
pub struct TamperingDetectionResult {
    /// Index of the signature being checked
    pub signature_index: usize,
    /// Whether the document is intact for this signature
    pub is_document_intact: bool,
    /// List of detected modifications
    pub modifications_detected: Vec<ModificationInfo>,
    /// Overall integrity status
    pub integrity_status: DocumentIntegrityStatus,
}

/// Information about a detected modification
#[derive(Debug, Clone)]
pub struct ModificationInfo {
    /// Type of modification detected
    pub modification_type: ModificationType,
    /// Description of the modification
    pub description: String,
    /// Pages affected by the modification (if applicable)
    pub affected_pages: Option<Vec<u32>>,
}

/// Types of document modifications
#[derive(Debug, Clone, PartialEq)]
pub enum ModificationType {
    ContentChanged,
    SignatureFieldModified,
    SignatureFieldRemoved,
    MetadataChanged,
    AnnotationAdded,
    AnnotationModified,
    AnnotationRemoved,
    FormFieldModified,
    PageAdded,
    PageRemoved,
    Unknown,
}

/// Document integrity status
#[derive(Debug, Clone, PartialEq)]
pub enum DocumentIntegrityStatus {
    Intact,
    Modified,
    Corrupted,
    Unknown,
}

/// Enhanced PKCS#7 signature information
#[derive(Debug, Clone)]
pub struct Pkcs7SignatureInfo {
    /// Signer certificate
    pub signer_certificate: CertificateInfo,
    /// Certificate chain (excluding signer certificate)
    pub certificate_chain: Vec<CertificateInfo>,
    /// Signature algorithm used
    pub signature_algorithm: SignatureAlgorithm,
    /// Hash algorithm used
    pub hash_algorithm: HashAlgorithm,
    /// Key size in bits
    pub key_size: u32,
    /// Raw signature value
    pub signature_value: Vec<u8>,
    /// Signing time (if included in PKCS#7)
    pub signing_time: Option<DateTime<Utc>>,
    /// Content type
    pub content_type: String,
    /// Message digest
    pub message_digest: Vec<u8>,
}

/// ECDSA curve types
#[derive(Debug, Clone, PartialEq)]
pub enum EcdsaCurve {
    P256,
    P384,
    P521,
}

/// Public key information
#[derive(Debug, Clone)]
pub struct PublicKey {
    /// Key algorithm
    pub algorithm: KeyAlgorithm,
    /// Key size in bits
    pub key_size: u32,
    /// DER-encoded public key data
    pub der_data: Vec<u8>,
}