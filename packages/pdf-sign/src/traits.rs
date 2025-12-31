//! Core traits defining the library's interfaces

use crate::{
    error::Result,
    types::*,
};
use async_trait::async_trait;

/// Main PDF signing interface
#[async_trait]
pub trait PdfSigner {
    /// Sign a PDF document with the provided credentials and options
    async fn sign_document(
        &self,
        document: &PdfDocument,
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
    ) -> Result<PdfDocument>;

    /// Sign a PDF document using a specific signature field
    async fn sign_document_with_field(
        &self,
        document: &PdfDocument,
        field_name: &str,
        credentials: &SigningCredentials,
    ) -> Result<PdfDocument>;

    /// Sign multiple documents in batch
    async fn sign_multiple_documents(
        &self,
        documents: &[PdfDocument],
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
    ) -> Result<Vec<PdfDocument>>;

    /// Add an incremental signature to a document that may already have signatures
    /// This preserves all existing signatures and adds a new one
    async fn add_incremental_signature(
        &self,
        document: &PdfDocument,
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
        target_field: Option<&str>,
    ) -> Result<PdfDocument>;
}

/// Signature validation interface
#[async_trait]
pub trait SignatureValidator {
    /// Extract all signatures from a PDF document with full metadata
    async fn extract_signatures(&self, document: &PdfDocument) -> Result<Vec<ExtractedSignature>>;

    /// Verify a specific extracted signature
    async fn verify_signature(&self, extracted_signature: &ExtractedSignature) -> Result<SignatureVerificationResult>;

    /// Validate all signatures in a PDF document
    async fn validate_signatures(&self, document: &PdfDocument) -> Result<Vec<SignatureVerificationResult>>;

    /// Detect document tampering for all signatures
    async fn detect_tampering(&self, document: &PdfDocument) -> Result<Vec<TamperingDetectionResult>>;
}

/// Certificate and key management interface
#[async_trait]
pub trait CertificateManager {
    /// Load signing credentials from PKCS#12 data
    async fn load_from_pkcs12(
        &self,
        p12_data: &[u8],
        password: &str,
    ) -> Result<SigningCredentials>;

    /// Load signing credentials from PEM-encoded certificate and key
    async fn load_from_pem(
        &self,
        cert_pem: &str,
        key_pem: &str,
        password: Option<&str>,
    ) -> Result<SigningCredentials>;

    /// Get certificate information
    fn get_certificate_info(&self, certificate: &X509Certificate) -> Result<CertificateInfo>;

    /// Validate a certificate
    async fn validate_certificate(
        &self,
        certificate: &X509Certificate,
    ) -> Result<CertificateValidationResult>;
}

/// PDF document parsing and manipulation interface
#[async_trait]
pub trait PdfParser {
    /// Parse a PDF document from byte data
    async fn parse_document(&self, pdf_data: &[u8]) -> Result<PdfDocument>;

    /// Extract signature fields from a PDF document
    fn extract_signature_fields(&self, document: &PdfDocument) -> Result<Vec<SignatureField>>;

    /// Add a signature field to a PDF document
    async fn add_signature_field(
        &self,
        document: &PdfDocument,
        field: &SignatureFieldDefinition,
    ) -> Result<PdfDocument>;

    /// Add a signature field using incremental update to preserve existing signatures
    async fn add_signature_field_incrementally(
        &self,
        document: &PdfDocument,
        field: &SignatureFieldDefinition,
    ) -> Result<PdfDocument>;

    /// Create a default signature field definition
    fn create_default_signature_field(&self, document: &PdfDocument) -> Result<SignatureFieldDefinition>;

    /// Update a PDF document with modifications
    async fn update_document(
        &self,
        document: &PdfDocument,
        changes: &[PdfModification],
    ) -> Result<PdfDocument>;
}

/// PDF document generation and serialization interface
#[async_trait]
pub trait PdfGenerator {
    /// Serialize a PDF document to bytes
    async fn serialize_document(&self, document: &PdfDocument) -> Result<Vec<u8>>;

    /// Create an incremental update for a PDF document
    async fn create_incremental_update(
        &self,
        document: &PdfDocument,
        changes: &[PdfModification],
    ) -> Result<Vec<u8>>;

    /// Embed a signature into a PDF document
    async fn embed_signature(
        &self,
        document: &PdfDocument,
        signature: &DigitalSignature,
        field: &SignatureField,
    ) -> Result<PdfDocument>;

    /// Embed a signature using incremental update to preserve existing signatures
    async fn embed_signature_incrementally(
        &self,
        document: &PdfDocument,
        signature: &DigitalSignature,
        field: &SignatureField,
    ) -> Result<PdfDocument>;
}

/// Cryptographic operations interface
#[async_trait]
pub trait CryptographicEngine {
    /// Compute hash of PDF document content (excluding signature fields)
    async fn compute_document_hash(
        &self,
        document: &PdfDocument,
        algorithm: HashAlgorithm,
    ) -> Result<Vec<u8>>;

    /// Compute hash of arbitrary data
    fn compute_hash(&self, data: &[u8], algorithm: HashAlgorithm) -> Result<Vec<u8>>;

    /// Create a digital signature
    async fn create_signature(
        &self,
        hash: &[u8],
        private_key: &PrivateKey,
        algorithm: SignatureAlgorithm,
    ) -> Result<Vec<u8>>;

    /// Verify a digital signature
    async fn verify_signature(
        &self,
        signature: &[u8],
        hash: &[u8],
        public_key: &X509Certificate,
    ) -> Result<bool>;

    /// Extract public key from certificate
    async fn extract_public_key_from_certificate(&self, cert_der: &[u8]) -> Result<PublicKey>;

    /// Verify RSA signature
    async fn verify_rsa_signature(
        &self,
        hash: &[u8],
        signature: &[u8],
        public_key: &PublicKey,
        hash_algorithm: HashAlgorithm,
    ) -> Result<bool>;

    /// Verify ECDSA signature
    async fn verify_ecdsa_signature(
        &self,
        hash: &[u8],
        signature: &[u8],
        public_key: &PublicKey,
        curve: EcdsaCurve,
    ) -> Result<bool>;

    /// Create a PKCS#7 signature container
    async fn create_pkcs7_signature(
        &self,
        hash: &[u8],
        credentials: &SigningCredentials,
        options: &Pkcs7Options,
    ) -> Result<Vec<u8>>;

    /// Parse a PKCS#7 signature container
    async fn parse_pkcs7_signature(&self, pkcs7_data: &[u8]) -> Result<Pkcs7SignatureInfo>;
}

/// Platform-specific operations interface
pub trait PlatformAbstraction {
    /// Get platform-specific certificate store integration
    fn get_system_certificates(&self) -> Result<Vec<X509Certificate>>;

    /// Get platform-appropriate temporary directory
    fn get_temp_directory(&self) -> Result<std::path::PathBuf>;

    /// Perform platform-specific cryptographic operations
    fn use_platform_crypto(&self) -> bool;

    /// Get platform information
    fn get_platform_info(&self) -> PlatformInfo;
}

/// Platform information
#[derive(Debug, Clone)]
pub struct PlatformInfo {
    pub os: String,
    pub arch: String,
    pub has_hardware_crypto: bool,
    pub crypto_providers: Vec<String>,
}

/// Resource management interface
pub trait ResourceManager {
    /// Clean up temporary files and resources
    fn cleanup(&self) -> Result<()>;

    /// Get memory usage statistics
    fn get_memory_usage(&self) -> MemoryUsage;

    /// Set memory usage limits
    fn set_memory_limit(&self, limit_mb: usize) -> Result<()>;
}

/// Memory usage statistics
#[derive(Debug, Clone)]
pub struct MemoryUsage {
    pub allocated_mb: usize,
    pub peak_mb: usize,
    pub temp_files_count: usize,
    pub temp_files_size_mb: usize,
}

/// Thread-safe operations interface
pub trait ThreadSafeOperations: Send + Sync {
    /// Perform concurrent read operations
    fn supports_concurrent_reads(&self) -> bool;

    /// Get maximum concurrent operations
    fn max_concurrent_operations(&self) -> usize;
}

/// Batch processing interface
#[async_trait]
pub trait BatchProcessor {
    /// Process multiple documents efficiently
    async fn process_batch<T, F, R>(&self, items: Vec<T>, processor: F) -> Result<Vec<R>>
    where
        T: Send + 'static,
        F: Fn(T) -> Result<R> + Send + Sync + 'static,
        R: Send + 'static;

    /// Get optimal batch size for the current system
    fn get_optimal_batch_size(&self) -> usize;
}

/// Standards compliance validation interface
#[async_trait]
pub trait ComplianceValidator {
    /// Validate compliance against all supported standards
    async fn validate_all_standards(
        &self,
        document: &PdfDocument,
        signatures: &[ExtractedSignature],
    ) -> Result<crate::compliance::ComplianceReport>;

    /// Validate compliance against a specific standard
    async fn validate_standard(
        &self,
        standard: crate::compliance::Standard,
        document: &PdfDocument,
        signatures: &[ExtractedSignature],
    ) -> Result<crate::compliance::StandardComplianceResult>;

    /// Get compliance configuration
    fn get_compliance_config(&self) -> &crate::compliance::ComplianceConfiguration;

    /// Update compliance configuration
    fn set_compliance_config(&mut self, config: crate::compliance::ComplianceConfiguration);
}