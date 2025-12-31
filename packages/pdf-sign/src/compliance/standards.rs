//! Standards definitions and compliance requirements
//! 
//! Defines the specific requirements for PDF 1.7, PAdES, X.509, and PKCS standards

use crate::types::*;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Supported standards for compliance validation
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub enum Standard {
    /// PDF 1.7 specification (ISO 32000-1)
    Pdf17,
    /// PAdES baseline profiles
    PadesBaseline,
    /// X.509 certificate standards
    X509,
    /// PKCS#7 cryptographic message syntax
    Pkcs7,
    /// RFC 3161 timestamp protocol
    Rfc3161,
}

/// Compliance validation result for a specific standard
#[derive(Debug, Clone, serde::Serialize)]
pub struct StandardComplianceResult {
    /// The standard being validated
    pub standard: Standard,
    /// Whether the document/signature complies with the standard
    pub is_compliant: bool,
    /// Compliance level achieved (if applicable)
    pub compliance_level: Option<ComplianceLevel>,
    /// List of compliance violations found
    pub violations: Vec<ComplianceViolation>,
    /// List of compliance warnings
    pub warnings: Vec<ComplianceWarning>,
    /// Additional metadata about the compliance check
    pub metadata: HashMap<String, String>,
}

/// Compliance levels for standards that support multiple levels
#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub enum ComplianceLevel {
    /// Basic compliance level
    Basic,
    /// Enhanced compliance level
    Enhanced,
    /// Full compliance level
    Full,
}

/// A compliance violation found during validation
#[derive(Debug, Clone, serde::Serialize)]
pub struct ComplianceViolation {
    /// Unique identifier for the violation type
    pub violation_id: String,
    /// Human-readable description of the violation
    pub description: String,
    /// Severity of the violation
    pub severity: ViolationSeverity,
    /// Location where the violation was found (if applicable)
    pub location: Option<String>,
    /// Suggested remediation action
    pub remediation: Option<String>,
}

/// A compliance warning found during validation
#[derive(Debug, Clone, serde::Serialize)]
pub struct ComplianceWarning {
    /// Unique identifier for the warning type
    pub warning_id: String,
    /// Human-readable description of the warning
    pub description: String,
    /// Location where the warning was found (if applicable)
    pub location: Option<String>,
    /// Recommendation for addressing the warning
    pub recommendation: Option<String>,
}

/// Severity levels for compliance violations
#[derive(Debug, Clone, PartialEq, Ord, PartialOrd, Eq, Hash, serde::Serialize)]
pub enum ViolationSeverity {
    /// Low severity - minor compliance issue
    Low,
    /// Medium severity - significant compliance issue
    Medium,
    /// High severity - major compliance issue
    High,
    /// Critical severity - compliance failure
    Critical,
}

/// PDF 1.7 compliance requirements
#[derive(Debug, Clone)]
pub struct Pdf17Requirements {
    /// Required PDF version
    pub min_version: String,
    /// Maximum PDF version
    pub max_version: String,
    /// Required document structure elements
    pub required_elements: Vec<String>,
    /// Allowed signature types
    pub allowed_signature_types: Vec<String>,
    /// Maximum file size (if applicable)
    pub max_file_size: Option<usize>,
}

impl Default for Pdf17Requirements {
    fn default() -> Self {
        Self {
            min_version: "1.4".to_string(),
            max_version: "1.7".to_string(),
            required_elements: vec![
                "Catalog".to_string(),
                "Pages".to_string(),
                "Page".to_string(),
            ],
            allowed_signature_types: vec![
                "adbe.pkcs7.detached".to_string(),
                "adbe.pkcs7.sha1".to_string(),
                "adbe.x509.rsa_sha1".to_string(),
            ],
            max_file_size: None,
        }
    }
}

/// PAdES compliance requirements
#[derive(Debug, Clone)]
pub struct PadesRequirements {
    /// PAdES profile level
    pub profile_level: ComplianceLevel,
    /// Required signature format
    pub signature_format: String,
    /// Required hash algorithms
    pub required_hash_algorithms: Vec<HashAlgorithm>,
    /// Certificate requirements
    pub certificate_requirements: CertificateRequirements,
    /// Timestamp requirements
    pub timestamp_required: bool,
}

impl Default for PadesRequirements {
    fn default() -> Self {
        Self {
            profile_level: ComplianceLevel::Basic,
            signature_format: "CAdES".to_string(),
            required_hash_algorithms: vec![
                HashAlgorithm::Sha256,
                HashAlgorithm::Sha384,
                HashAlgorithm::Sha512,
            ],
            certificate_requirements: CertificateRequirements::default(),
            timestamp_required: false,
        }
    }
}

/// X.509 certificate compliance requirements
#[derive(Debug, Clone)]
pub struct CertificateRequirements {
    /// Minimum key size for RSA keys
    pub min_rsa_key_size: u32,
    /// Allowed ECDSA curves
    pub allowed_ecdsa_curves: Vec<EcdsaCurve>,
    /// Required key usage extensions
    pub required_key_usage: Vec<String>,
    /// Maximum certificate validity period
    pub max_validity_period: Option<chrono::Duration>,
    /// Required certificate extensions
    pub required_extensions: Vec<String>,
}

impl Default for CertificateRequirements {
    fn default() -> Self {
        Self {
            min_rsa_key_size: 2048,
            allowed_ecdsa_curves: vec![
                EcdsaCurve::P256,
                EcdsaCurve::P384,
                EcdsaCurve::P521,
            ],
            required_key_usage: vec![
                "digitalSignature".to_string(),
                "nonRepudiation".to_string(),
            ],
            max_validity_period: Some(chrono::Duration::days(365 * 10)), // 10 years
            required_extensions: vec![
                "keyUsage".to_string(),
                "basicConstraints".to_string(),
            ],
        }
    }
}

/// PKCS#7 compliance requirements
#[derive(Debug, Clone)]
pub struct Pkcs7Requirements {
    /// Required content type
    pub content_type: String,
    /// Required signature algorithms
    pub required_signature_algorithms: Vec<SignatureAlgorithm>,
    /// Whether to include signing time
    pub include_signing_time: bool,
    /// Whether to include certificate chain
    pub include_certificate_chain: bool,
    /// Maximum signature size
    pub max_signature_size: Option<usize>,
}

impl Default for Pkcs7Requirements {
    fn default() -> Self {
        Self {
            content_type: "1.2.840.113549.1.7.1".to_string(), // data
            required_signature_algorithms: vec![
                SignatureAlgorithm::RsaPkcs1Sha256,
                SignatureAlgorithm::RsaPkcs1Sha384,
                SignatureAlgorithm::RsaPkcs1Sha512,
                SignatureAlgorithm::EcdsaP256Sha256,
                SignatureAlgorithm::EcdsaP384Sha384,
                SignatureAlgorithm::EcdsaP521Sha512,
            ],
            include_signing_time: true,
            include_certificate_chain: true,
            max_signature_size: Some(64 * 1024), // 64KB
        }
    }
}

/// RFC 3161 timestamp compliance requirements
#[derive(Debug, Clone)]
pub struct Rfc3161Requirements {
    /// Required timestamp accuracy
    pub required_accuracy: Option<chrono::Duration>,
    /// Required hash algorithm for timestamp
    pub timestamp_hash_algorithm: HashAlgorithm,
    /// Whether TSA certificate must be included
    pub include_tsa_certificate: bool,
    /// Maximum timestamp response size
    pub max_response_size: Option<usize>,
}

impl Default for Rfc3161Requirements {
    fn default() -> Self {
        Self {
            required_accuracy: Some(chrono::Duration::seconds(1)),
            timestamp_hash_algorithm: HashAlgorithm::Sha256,
            include_tsa_certificate: true,
            max_response_size: Some(16 * 1024), // 16KB
        }
    }
}

/// Complete compliance configuration for all standards
#[derive(Debug, Clone)]
pub struct ComplianceConfiguration {
    /// PDF 1.7 requirements
    pub pdf17: Pdf17Requirements,
    /// PAdES requirements
    pub pades: PadesRequirements,
    /// X.509 certificate requirements
    pub x509: CertificateRequirements,
    /// PKCS#7 requirements
    pub pkcs7: Pkcs7Requirements,
    /// RFC 3161 timestamp requirements
    pub rfc3161: Rfc3161Requirements,
    /// Whether to perform strict validation
    pub strict_mode: bool,
}

impl Default for ComplianceConfiguration {
    fn default() -> Self {
        Self {
            pdf17: Pdf17Requirements::default(),
            pades: PadesRequirements::default(),
            x509: CertificateRequirements::default(),
            pkcs7: Pkcs7Requirements::default(),
            rfc3161: Rfc3161Requirements::default(),
            strict_mode: true,
        }
    }
}

/// Compliance validation context
#[derive(Debug, Clone)]
pub struct ComplianceContext {
    /// The document being validated
    pub document: PdfDocument,
    /// Signatures to validate
    pub signatures: Vec<ExtractedSignature>,
    /// Validation timestamp
    pub validation_time: DateTime<Utc>,
    /// Additional context information
    pub context_data: HashMap<String, String>,
}

impl ComplianceContext {
    /// Create a new compliance context
    pub fn new(document: PdfDocument, signatures: Vec<ExtractedSignature>) -> Self {
        Self {
            document,
            signatures,
            validation_time: Utc::now(),
            context_data: HashMap::new(),
        }
    }

    /// Add context data
    pub fn with_context_data(mut self, key: String, value: String) -> Self {
        self.context_data.insert(key, value);
        self
    }
}