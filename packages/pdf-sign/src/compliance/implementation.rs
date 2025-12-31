//! Concrete implementation of the standards compliance validator
//! 
//! Provides a ready-to-use implementation of the ComplianceValidator trait

use crate::{
    error::Result,
    types::*,
    traits::ComplianceValidator,
};
use super::{
    standards::*,
    validator::StandardsComplianceValidator,
    reporting::ComplianceReport,
};
use async_trait::async_trait;

/// Concrete implementation of standards compliance validation
pub struct ComplianceValidatorImpl {
    /// Internal validator instance
    validator: StandardsComplianceValidator,
}

impl ComplianceValidatorImpl {
    /// Create a new compliance validator with default configuration
    pub fn new() -> Self {
        Self {
            validator: StandardsComplianceValidator::with_defaults(),
        }
    }

    /// Create a new compliance validator with custom configuration
    pub fn with_config(config: ComplianceConfiguration) -> Self {
        Self {
            validator: StandardsComplianceValidator::new(config),
        }
    }

    /// Create a validator for strict compliance checking
    pub fn strict() -> Self {
        let mut config = ComplianceConfiguration::default();
        config.strict_mode = true;
        
        // Set stricter requirements
        config.pdf17.max_file_size = Some(50 * 1024 * 1024); // 50MB limit
        config.pades.timestamp_required = true;
        config.x509.min_rsa_key_size = 3072; // Higher minimum key size
        config.pkcs7.include_certificate_chain = true;
        config.pkcs7.include_signing_time = true;
        
        Self::with_config(config)
    }

    /// Create a validator for lenient compliance checking
    pub fn lenient() -> Self {
        let mut config = ComplianceConfiguration::default();
        config.strict_mode = false;
        
        // Set more lenient requirements
        config.pdf17.max_file_size = None; // No file size limit
        config.pades.timestamp_required = false;
        config.x509.min_rsa_key_size = 2048; // Standard minimum key size
        config.pkcs7.include_certificate_chain = false;
        config.pkcs7.include_signing_time = false;
        
        Self::with_config(config)
    }
}

impl Default for ComplianceValidatorImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ComplianceValidator for ComplianceValidatorImpl {
    async fn validate_all_standards(
        &self,
        document: &PdfDocument,
        signatures: &[ExtractedSignature],
    ) -> Result<ComplianceReport> {
        let context = ComplianceContext::new(document.clone(), signatures.to_vec());
        
        // Create a mutable copy of the validator for the validation process
        let mut validator = StandardsComplianceValidator::new(self.validator.config.clone());
        
        validator.validate_all_standards(&context).await
    }

    async fn validate_standard(
        &self,
        standard: Standard,
        document: &PdfDocument,
        signatures: &[ExtractedSignature],
    ) -> Result<StandardComplianceResult> {
        let context = ComplianceContext::new(document.clone(), signatures.to_vec());
        
        // Create a mutable copy of the validator for the validation process
        let mut validator = StandardsComplianceValidator::new(self.validator.config.clone());
        
        match standard {
            Standard::Pdf17 => validator.validate_pdf17_compliance(&context).await,
            Standard::PadesBaseline => validator.validate_pades_compliance(&context).await,
            Standard::X509 => validator.validate_x509_compliance(&context).await,
            Standard::Pkcs7 => validator.validate_pkcs7_compliance(&context).await,
            Standard::Rfc3161 => validator.validate_rfc3161_compliance(&context).await,
        }
    }

    fn get_compliance_config(&self) -> &ComplianceConfiguration {
        &self.validator.config
    }

    fn set_compliance_config(&mut self, config: ComplianceConfiguration) {
        self.validator.config = config;
    }
}

/// Builder for creating customized compliance validators
pub struct ComplianceValidatorBuilder {
    config: ComplianceConfiguration,
}

impl ComplianceValidatorBuilder {
    /// Create a new builder with default configuration
    pub fn new() -> Self {
        Self {
            config: ComplianceConfiguration::default(),
        }
    }

    /// Set strict mode
    pub fn strict_mode(mut self, strict: bool) -> Self {
        self.config.strict_mode = strict;
        self
    }

    /// Configure PDF 1.7 requirements
    pub fn pdf17_config(mut self, config: Pdf17Requirements) -> Self {
        self.config.pdf17 = config;
        self
    }

    /// Configure PAdES requirements
    pub fn pades_config(mut self, config: PadesRequirements) -> Self {
        self.config.pades = config;
        self
    }

    /// Configure X.509 certificate requirements
    pub fn x509_config(mut self, config: CertificateRequirements) -> Self {
        self.config.x509 = config;
        self
    }

    /// Configure PKCS#7 requirements
    pub fn pkcs7_config(mut self, config: Pkcs7Requirements) -> Self {
        self.config.pkcs7 = config;
        self
    }

    /// Configure RFC 3161 timestamp requirements
    pub fn rfc3161_config(mut self, config: Rfc3161Requirements) -> Self {
        self.config.rfc3161 = config;
        self
    }

    /// Set minimum RSA key size
    pub fn min_rsa_key_size(mut self, size: u32) -> Self {
        self.config.x509.min_rsa_key_size = size;
        self
    }

    /// Require timestamps for PAdES
    pub fn require_timestamps(mut self, required: bool) -> Self {
        self.config.pades.timestamp_required = required;
        self
    }

    /// Set maximum file size for PDF documents
    pub fn max_file_size(mut self, size: Option<usize>) -> Self {
        self.config.pdf17.max_file_size = size;
        self
    }

    /// Build the compliance validator
    pub fn build(self) -> ComplianceValidatorImpl {
        ComplianceValidatorImpl::with_config(self.config)
    }
}

impl Default for ComplianceValidatorBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    fn create_test_document() -> PdfDocument {
        PdfDocument {
            version: "1.7".to_string(),
            page_count: 1,
            metadata: PdfMetadata::default(),
            signature_fields: vec![],
            existing_signatures: vec![],
            data: b"%PDF-1.7\n1 0 obj<</Type/Catalog>>\nendobj\n%%EOF".to_vec(),
        }
    }

    fn create_test_signature() -> ExtractedSignature {
        ExtractedSignature {
            signature_index: 0,
            field_name: "Signature1".to_string(),
            signature_field: None,
            signer_name: "Test Signer".to_string(),
            signing_time: Utc::now(),
            reason: Some("Test signing".to_string()),
            location: None,
            contact_info: None,
            certificate_chain: vec![],
            signature_algorithm: SignatureAlgorithmInfo {
                algorithm: SignatureAlgorithm::RsaPkcs1Sha256,
                hash_algorithm: HashAlgorithm::Sha256,
                key_size: 2048,
            },
            signature_data: vec![0x30, 0x20, 0x06, 0x09, 0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02],
            document_hash: vec![0; 32],
            pkcs7_info: Pkcs7SignatureInfo {
                signer_certificate: CertificateInfo {
                    subject: "CN=Test Signer".to_string(),
                    issuer: "CN=Test CA".to_string(),
                    serial_number: "123456".to_string(),
                    not_before: Utc::now() - chrono::Duration::days(30),
                    not_after: Utc::now() + chrono::Duration::days(365),
                    key_algorithm: "RSA".to_string(),
                    key_size: 2048,
                    der_data: vec![],
                },
                certificate_chain: vec![],
                signature_algorithm: SignatureAlgorithm::RsaPkcs1Sha256,
                hash_algorithm: HashAlgorithm::Sha256,
                key_size: 2048,
                signature_value: vec![],
                signing_time: Some(Utc::now()),
                content_type: "1.2.840.113549.1.7.1".to_string(),
                message_digest: vec![0; 32],
            },
        }
    }

    #[tokio::test]
    async fn test_compliance_validator_creation() {
        let validator = ComplianceValidatorImpl::new();
        assert!(!validator.get_compliance_config().strict_mode || validator.get_compliance_config().strict_mode);

        let strict_validator = ComplianceValidatorImpl::strict();
        assert!(strict_validator.get_compliance_config().strict_mode);

        let lenient_validator = ComplianceValidatorImpl::lenient();
        assert!(!lenient_validator.get_compliance_config().strict_mode);
    }

    #[tokio::test]
    async fn test_compliance_validator_builder() {
        let validator = ComplianceValidatorBuilder::new()
            .strict_mode(true)
            .min_rsa_key_size(3072)
            .require_timestamps(true)
            .max_file_size(Some(10 * 1024 * 1024))
            .build();

        let config = validator.get_compliance_config();
        assert!(config.strict_mode);
        assert_eq!(config.x509.min_rsa_key_size, 3072);
        assert!(config.pades.timestamp_required);
        assert_eq!(config.pdf17.max_file_size, Some(10 * 1024 * 1024));
    }

    #[tokio::test]
    async fn test_validate_all_standards() {
        let validator = ComplianceValidatorImpl::new();
        let document = create_test_document();
        let signatures = vec![create_test_signature()];

        let result = validator.validate_all_standards(&document, &signatures).await;
        assert!(result.is_ok());

        let report = result.unwrap();
        assert!(!report.standard_results.is_empty());
        assert!(report.standard_results.len() >= 4); // At least PDF, PAdES, X.509, PKCS#7
    }

    #[tokio::test]
    async fn test_validate_specific_standard() {
        let validator = ComplianceValidatorImpl::new();
        let document = create_test_document();
        let signatures = vec![create_test_signature()];

        let result = validator.validate_standard(Standard::Pdf17, &document, &signatures).await;
        assert!(result.is_ok());

        let compliance_result = result.unwrap();
        assert_eq!(compliance_result.standard, Standard::Pdf17);
    }

    #[tokio::test]
    async fn test_config_modification() {
        let mut validator = ComplianceValidatorImpl::new();
        
        let mut new_config = ComplianceConfiguration::default();
        new_config.strict_mode = true;
        new_config.x509.min_rsa_key_size = 4096;
        
        validator.set_compliance_config(new_config);
        
        let config = validator.get_compliance_config();
        assert!(config.strict_mode);
        assert_eq!(config.x509.min_rsa_key_size, 4096);
    }
}