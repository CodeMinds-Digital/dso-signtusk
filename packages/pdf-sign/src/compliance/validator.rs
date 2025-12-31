//! Standards compliance validator implementation
//! 
//! Provides comprehensive validation against PDF 1.7, PAdES, X.509, and PKCS standards

use crate::types::*;
use crate::error::{PdfSignError, Result};
use super::standards::*;
use super::reporting::*;
use chrono::{DateTime, Utc};
use std::collections::HashMap;

/// Main standards compliance validator
#[derive(Debug)]
pub struct StandardsComplianceValidator {
    /// Compliance configuration
    pub config: ComplianceConfiguration,
    /// Validation cache for performance
    validation_cache: HashMap<String, StandardComplianceResult>,
}

impl StandardsComplianceValidator {
    /// Create a new standards compliance validator
    pub fn new(config: ComplianceConfiguration) -> Self {
        Self {
            config,
            validation_cache: HashMap::new(),
        }
    }

    /// Create a validator with default configuration
    pub fn with_defaults() -> Self {
        Self::new(ComplianceConfiguration::default())
    }

    /// Validate compliance for all supported standards
    pub async fn validate_all_standards(
        &mut self,
        context: &ComplianceContext,
    ) -> Result<ComplianceReport> {
        let mut results = Vec::new();

        // Validate PDF 1.7 compliance
        results.push(self.validate_pdf17_compliance(context).await?);

        // Validate PAdES compliance
        results.push(self.validate_pades_compliance(context).await?);

        // Validate X.509 compliance
        results.push(self.validate_x509_compliance(context).await?);

        // Validate PKCS#7 compliance
        results.push(self.validate_pkcs7_compliance(context).await?);

        // Validate RFC 3161 compliance (if timestamps are present)
        if self.has_timestamps(context) {
            results.push(self.validate_rfc3161_compliance(context).await?);
        }

        Ok(ComplianceReport::new(results, context.validation_time))
    }

    /// Validate PDF 1.7 specification compliance
    pub async fn validate_pdf17_compliance(
        &mut self,
        context: &ComplianceContext,
    ) -> Result<StandardComplianceResult> {
        let mut violations = Vec::new();
        let mut warnings = Vec::new();
        let mut metadata = HashMap::new();

        // Check PDF version
        if !self.is_valid_pdf_version(&context.document.version) {
            violations.push(ComplianceViolation {
                violation_id: "PDF17_001".to_string(),
                description: format!(
                    "PDF version {} is not supported. Supported versions: {}-{}",
                    context.document.version,
                    self.config.pdf17.min_version,
                    self.config.pdf17.max_version
                ),
                severity: ViolationSeverity::High,
                location: Some("Document header".to_string()),
                remediation: Some("Use a supported PDF version".to_string()),
            });
        }

        // Check document structure
        self.validate_pdf_structure(&context.document, &mut violations, &mut warnings)?;

        // Check signature fields compliance
        self.validate_signature_fields_compliance(
            &context.document.signature_fields,
            &mut violations,
            &mut warnings,
        )?;

        // Check file size if limit is configured
        if let Some(max_size) = self.config.pdf17.max_file_size {
            if context.document.data.len() > max_size {
                violations.push(ComplianceViolation {
                    violation_id: "PDF17_002".to_string(),
                    description: format!(
                        "Document size {} exceeds maximum allowed size {}",
                        context.document.data.len(),
                        max_size
                    ),
                    severity: ViolationSeverity::Medium,
                    location: Some("Document".to_string()),
                    remediation: Some("Reduce document size or increase limit".to_string()),
                });
            }
        }

        metadata.insert("pdf_version".to_string(), context.document.version.clone());
        metadata.insert("page_count".to_string(), context.document.page_count.to_string());
        metadata.insert("signature_fields".to_string(), context.document.signature_fields.len().to_string());

        Ok(StandardComplianceResult {
            standard: Standard::Pdf17,
            is_compliant: violations.is_empty(),
            compliance_level: Some(if violations.is_empty() && warnings.is_empty() {
                ComplianceLevel::Full
            } else if violations.is_empty() {
                ComplianceLevel::Enhanced
            } else {
                ComplianceLevel::Basic
            }),
            violations,
            warnings,
            metadata,
        })
    }

    /// Validate PAdES baseline profile compliance
    pub async fn validate_pades_compliance(
        &mut self,
        context: &ComplianceContext,
    ) -> Result<StandardComplianceResult> {
        let mut violations = Vec::new();
        let mut warnings = Vec::new();
        let mut metadata = HashMap::new();

        // Check signature format compliance
        for (index, signature) in context.signatures.iter().enumerate() {
            self.validate_pades_signature_format(signature, index, &mut violations, &mut warnings)?;
        }

        // Check hash algorithm compliance
        for (index, signature) in context.signatures.iter().enumerate() {
            if !self.config.pades.required_hash_algorithms.contains(&signature.signature_algorithm.hash_algorithm) {
                violations.push(ComplianceViolation {
                    violation_id: "PADES_001".to_string(),
                    description: format!(
                        "Signature {} uses unsupported hash algorithm: {:?}",
                        index,
                        signature.signature_algorithm.hash_algorithm
                    ),
                    severity: ViolationSeverity::High,
                    location: Some(format!("Signature {}", index)),
                    remediation: Some("Use a supported hash algorithm".to_string()),
                });
            }
        }

        // Check timestamp requirements for enhanced profiles
        if self.config.pades.timestamp_required {
            for (index, signature) in context.signatures.iter().enumerate() {
                if signature.pkcs7_info.signing_time.is_none() {
                    violations.push(ComplianceViolation {
                        violation_id: "PADES_002".to_string(),
                        description: format!("Signature {} missing required timestamp", index),
                        severity: ViolationSeverity::Medium,
                        location: Some(format!("Signature {}", index)),
                        remediation: Some("Add RFC 3161 timestamp to signature".to_string()),
                    });
                }
            }
        }

        metadata.insert("profile_level".to_string(), format!("{:?}", self.config.pades.profile_level));
        metadata.insert("signatures_count".to_string(), context.signatures.len().to_string());

        Ok(StandardComplianceResult {
            standard: Standard::PadesBaseline,
            is_compliant: violations.is_empty(),
            compliance_level: Some(self.config.pades.profile_level.clone()),
            violations,
            warnings,
            metadata,
        })
    }

    /// Validate X.509 certificate compliance
    pub async fn validate_x509_compliance(
        &mut self,
        context: &ComplianceContext,
    ) -> Result<StandardComplianceResult> {
        let mut violations = Vec::new();
        let mut warnings = Vec::new();
        let mut metadata = HashMap::new();

        for (sig_index, signature) in context.signatures.iter().enumerate() {
            // Validate signer certificate
            self.validate_certificate_compliance(
                &signature.pkcs7_info.signer_certificate,
                sig_index,
                "signer",
                &mut violations,
                &mut warnings,
            )?;

            // Validate certificate chain
            for (cert_index, cert) in signature.pkcs7_info.certificate_chain.iter().enumerate() {
                self.validate_certificate_compliance(
                    cert,
                    sig_index,
                    &format!("chain[{}]", cert_index),
                    &mut violations,
                    &mut warnings,
                )?;
            }
        }

        metadata.insert("certificates_validated".to_string(), 
            context.signatures.iter()
                .map(|s| 1 + s.pkcs7_info.certificate_chain.len())
                .sum::<usize>()
                .to_string()
        );

        Ok(StandardComplianceResult {
            standard: Standard::X509,
            is_compliant: violations.is_empty(),
            compliance_level: Some(if violations.is_empty() && warnings.is_empty() {
                ComplianceLevel::Full
            } else if violations.is_empty() {
                ComplianceLevel::Enhanced
            } else {
                ComplianceLevel::Basic
            }),
            violations,
            warnings,
            metadata,
        })
    }

    /// Validate PKCS#7 cryptographic message syntax compliance
    pub async fn validate_pkcs7_compliance(
        &mut self,
        context: &ComplianceContext,
    ) -> Result<StandardComplianceResult> {
        let mut violations = Vec::new();
        let mut warnings = Vec::new();
        let mut metadata = HashMap::new();

        for (index, signature) in context.signatures.iter().enumerate() {
            // Check signature algorithm compliance
            if !self.config.pkcs7.required_signature_algorithms.contains(&signature.signature_algorithm.algorithm) {
                violations.push(ComplianceViolation {
                    violation_id: "PKCS7_001".to_string(),
                    description: format!(
                        "Signature {} uses unsupported signature algorithm: {:?}",
                        index,
                        signature.signature_algorithm.algorithm
                    ),
                    severity: ViolationSeverity::High,
                    location: Some(format!("Signature {}", index)),
                    remediation: Some("Use a supported signature algorithm".to_string()),
                });
            }

            // Check signing time inclusion
            if self.config.pkcs7.include_signing_time && signature.pkcs7_info.signing_time.is_none() {
                violations.push(ComplianceViolation {
                    violation_id: "PKCS7_002".to_string(),
                    description: format!("Signature {} missing required signing time", index),
                    severity: ViolationSeverity::Medium,
                    location: Some(format!("Signature {}", index)),
                    remediation: Some("Include signing time in PKCS#7 structure".to_string()),
                });
            }

            // Check certificate chain inclusion
            if self.config.pkcs7.include_certificate_chain && signature.pkcs7_info.certificate_chain.is_empty() {
                warnings.push(ComplianceWarning {
                    warning_id: "PKCS7_W001".to_string(),
                    description: format!("Signature {} has empty certificate chain", index),
                    location: Some(format!("Signature {}", index)),
                    recommendation: Some("Include intermediate certificates in chain".to_string()),
                });
            }

            // Check signature size
            if let Some(max_size) = self.config.pkcs7.max_signature_size {
                if signature.signature_data.len() > max_size {
                    violations.push(ComplianceViolation {
                        violation_id: "PKCS7_003".to_string(),
                        description: format!(
                            "Signature {} size {} exceeds maximum {}",
                            index,
                            signature.signature_data.len(),
                            max_size
                        ),
                        severity: ViolationSeverity::Low,
                        location: Some(format!("Signature {}", index)),
                        remediation: Some("Reduce signature size or increase limit".to_string()),
                    });
                }
            }

            // Validate PKCS#7 structure format
            self.validate_pkcs7_structure(&signature.signature_data, index, &mut violations)?;
        }

        metadata.insert("pkcs7_signatures".to_string(), context.signatures.len().to_string());

        Ok(StandardComplianceResult {
            standard: Standard::Pkcs7,
            is_compliant: violations.is_empty(),
            compliance_level: Some(ComplianceLevel::Basic),
            violations,
            warnings,
            metadata,
        })
    }

    /// Validate RFC 3161 timestamp compliance
    pub async fn validate_rfc3161_compliance(
        &mut self,
        context: &ComplianceContext,
    ) -> Result<StandardComplianceResult> {
        let mut violations = Vec::new();
        let mut warnings = Vec::new();
        let mut metadata = HashMap::new();

        let mut timestamp_count = 0;

        for (index, signature) in context.signatures.iter().enumerate() {
            if let Some(signing_time) = signature.pkcs7_info.signing_time {
                timestamp_count += 1;

                // Check timestamp accuracy
                if let Some(required_accuracy) = self.config.rfc3161.required_accuracy {
                    let time_diff = (context.validation_time - signing_time).abs();
                    if time_diff > required_accuracy {
                        warnings.push(ComplianceWarning {
                            warning_id: "RFC3161_W001".to_string(),
                            description: format!(
                                "Signature {} timestamp accuracy {} exceeds required accuracy {}",
                                index,
                                time_diff,
                                required_accuracy
                            ),
                            location: Some(format!("Signature {}", index)),
                            recommendation: Some("Use more accurate timestamp server".to_string()),
                        });
                    }
                }

                // Check hash algorithm
                if signature.signature_algorithm.hash_algorithm != self.config.rfc3161.timestamp_hash_algorithm {
                    warnings.push(ComplianceWarning {
                        warning_id: "RFC3161_W002".to_string(),
                        description: format!(
                            "Signature {} timestamp uses different hash algorithm than recommended",
                            index
                        ),
                        location: Some(format!("Signature {}", index)),
                        recommendation: Some(format!(
                            "Use recommended hash algorithm: {:?}",
                            self.config.rfc3161.timestamp_hash_algorithm
                        )),
                    });
                }
            }
        }

        metadata.insert("timestamps_found".to_string(), timestamp_count.to_string());

        Ok(StandardComplianceResult {
            standard: Standard::Rfc3161,
            is_compliant: violations.is_empty(),
            compliance_level: Some(ComplianceLevel::Basic),
            violations,
            warnings,
            metadata,
        })
    }

    // Helper methods

    fn is_valid_pdf_version(&self, version: &str) -> bool {
        let version_parts: Vec<&str> = version.split('.').collect();
        if version_parts.len() != 2 {
            return false;
        }

        let major: f32 = version_parts[0].parse().unwrap_or(0.0);
        let minor: f32 = version_parts[1].parse().unwrap_or(0.0);
        let version_num = major + minor / 10.0;

        let min_parts: Vec<&str> = self.config.pdf17.min_version.split('.').collect();
        let min_major: f32 = min_parts[0].parse().unwrap_or(0.0);
        let min_minor: f32 = min_parts[1].parse().unwrap_or(0.0);
        let min_version = min_major + min_minor / 10.0;

        let max_parts: Vec<&str> = self.config.pdf17.max_version.split('.').collect();
        let max_major: f32 = max_parts[0].parse().unwrap_or(0.0);
        let max_minor: f32 = max_parts[1].parse().unwrap_or(0.0);
        let max_version = max_major + max_minor / 10.0;

        version_num >= min_version && version_num <= max_version
    }

    fn validate_pdf_structure(
        &self,
        document: &PdfDocument,
        violations: &mut Vec<ComplianceViolation>,
        warnings: &mut Vec<ComplianceWarning>,
    ) -> Result<()> {
        // Check for required PDF elements
        // This is a simplified check - in a full implementation, we would parse the PDF structure
        let pdf_content = String::from_utf8_lossy(&document.data);

        for required_element in &self.config.pdf17.required_elements {
            if !pdf_content.contains(required_element) {
                violations.push(ComplianceViolation {
                    violation_id: "PDF17_STRUCT_001".to_string(),
                    description: format!("Required PDF element '{}' not found", required_element),
                    severity: ViolationSeverity::High,
                    location: Some("Document structure".to_string()),
                    remediation: Some(format!("Ensure '{}' element is present", required_element)),
                });
            }
        }

        // Check page count consistency
        if document.page_count == 0 {
            violations.push(ComplianceViolation {
                violation_id: "PDF17_STRUCT_002".to_string(),
                description: "Document has no pages".to_string(),
                severity: ViolationSeverity::Critical,
                location: Some("Document structure".to_string()),
                remediation: Some("Document must contain at least one page".to_string()),
            });
        }

        Ok(())
    }

    fn validate_signature_fields_compliance(
        &self,
        fields: &[SignatureField],
        violations: &mut Vec<ComplianceViolation>,
        warnings: &mut Vec<ComplianceWarning>,
    ) -> Result<()> {
        for (index, field) in fields.iter().enumerate() {
            // Check field name validity
            if field.name.is_empty() {
                violations.push(ComplianceViolation {
                    violation_id: "PDF17_FIELD_001".to_string(),
                    description: format!("Signature field {} has empty name", index),
                    severity: ViolationSeverity::Medium,
                    location: Some(format!("Signature field {}", index)),
                    remediation: Some("Provide a valid field name".to_string()),
                });
            }

            // Check field bounds validity
            if field.bounds.width <= 0.0 || field.bounds.height <= 0.0 {
                warnings.push(ComplianceWarning {
                    warning_id: "PDF17_FIELD_W001".to_string(),
                    description: format!("Signature field {} has invalid dimensions", index),
                    location: Some(format!("Signature field {}", index)),
                    recommendation: Some("Ensure field has positive width and height".to_string()),
                });
            }

            // Check page number validity
            if field.page > 1000 {  // Reasonable upper limit
                warnings.push(ComplianceWarning {
                    warning_id: "PDF17_FIELD_W002".to_string(),
                    description: format!("Signature field {} on very high page number {}", index, field.page),
                    location: Some(format!("Signature field {}", index)),
                    recommendation: Some("Verify page number is correct".to_string()),
                });
            }
        }

        Ok(())
    }

    fn validate_pades_signature_format(
        &self,
        signature: &ExtractedSignature,
        index: usize,
        violations: &mut Vec<ComplianceViolation>,
        warnings: &mut Vec<ComplianceWarning>,
    ) -> Result<()> {
        // Check signature format matches PAdES requirements
        if self.config.pades.signature_format == "CAdES" {
            // Validate CAdES-specific requirements
            if signature.pkcs7_info.content_type != "1.2.840.113549.1.7.1" {
                violations.push(ComplianceViolation {
                    violation_id: "PADES_FORMAT_001".to_string(),
                    description: format!("Signature {} has incorrect content type for CAdES", index),
                    severity: ViolationSeverity::High,
                    location: Some(format!("Signature {}", index)),
                    remediation: Some("Use correct CAdES content type".to_string()),
                });
            }
        }

        // Check certificate chain completeness
        if signature.pkcs7_info.certificate_chain.is_empty() {
            warnings.push(ComplianceWarning {
                warning_id: "PADES_FORMAT_W001".to_string(),
                description: format!("Signature {} has incomplete certificate chain", index),
                location: Some(format!("Signature {}", index)),
                recommendation: Some("Include complete certificate chain".to_string()),
            });
        }

        Ok(())
    }

    fn validate_certificate_compliance(
        &self,
        cert: &CertificateInfo,
        sig_index: usize,
        cert_type: &str,
        violations: &mut Vec<ComplianceViolation>,
        warnings: &mut Vec<ComplianceWarning>,
    ) -> Result<()> {
        // Check key size for RSA certificates
        if cert.key_algorithm.contains("RSA") && cert.key_size < self.config.x509.min_rsa_key_size {
            violations.push(ComplianceViolation {
                violation_id: "X509_001".to_string(),
                description: format!(
                    "Signature {} {} certificate has insufficient RSA key size: {} < {}",
                    sig_index,
                    cert_type,
                    cert.key_size,
                    self.config.x509.min_rsa_key_size
                ),
                severity: ViolationSeverity::High,
                location: Some(format!("Signature {} {} certificate", sig_index, cert_type)),
                remediation: Some(format!("Use RSA key size >= {}", self.config.x509.min_rsa_key_size)),
            });
        }

        // Check certificate validity period
        let now = Utc::now();
        if cert.not_after < now {
            violations.push(ComplianceViolation {
                violation_id: "X509_002".to_string(),
                description: format!(
                    "Signature {} {} certificate has expired: {}",
                    sig_index,
                    cert_type,
                    cert.not_after
                ),
                severity: ViolationSeverity::Critical,
                location: Some(format!("Signature {} {} certificate", sig_index, cert_type)),
                remediation: Some("Use a valid, non-expired certificate".to_string()),
            });
        }

        if cert.not_before > now {
            violations.push(ComplianceViolation {
                violation_id: "X509_003".to_string(),
                description: format!(
                    "Signature {} {} certificate is not yet valid: {}",
                    sig_index,
                    cert_type,
                    cert.not_before
                ),
                severity: ViolationSeverity::High,
                location: Some(format!("Signature {} {} certificate", sig_index, cert_type)),
                remediation: Some("Use a certificate that is currently valid".to_string()),
            });
        }

        // Check maximum validity period
        if let Some(max_period) = self.config.x509.max_validity_period {
            let cert_period = cert.not_after - cert.not_before;
            if cert_period > max_period {
                warnings.push(ComplianceWarning {
                    warning_id: "X509_W001".to_string(),
                    description: format!(
                        "Signature {} {} certificate has long validity period: {} days",
                        sig_index,
                        cert_type,
                        cert_period.num_days()
                    ),
                    location: Some(format!("Signature {} {} certificate", sig_index, cert_type)),
                    recommendation: Some("Consider using certificates with shorter validity periods".to_string()),
                });
            }
        }

        Ok(())
    }

    fn validate_pkcs7_structure(
        &self,
        signature_data: &[u8],
        index: usize,
        violations: &mut Vec<ComplianceViolation>,
    ) -> Result<()> {
        // Basic PKCS#7 structure validation
        if signature_data.len() < 10 {
            violations.push(ComplianceViolation {
                violation_id: "PKCS7_STRUCT_001".to_string(),
                description: format!("Signature {} has invalid PKCS#7 structure: too short", index),
                severity: ViolationSeverity::Critical,
                location: Some(format!("Signature {}", index)),
                remediation: Some("Ensure valid PKCS#7 signature structure".to_string()),
            });
            return Ok(());
        }

        // Check for SEQUENCE tag
        if signature_data[0] != 0x30 {
            violations.push(ComplianceViolation {
                violation_id: "PKCS7_STRUCT_002".to_string(),
                description: format!("Signature {} has invalid PKCS#7 structure: missing SEQUENCE tag", index),
                severity: ViolationSeverity::Critical,
                location: Some(format!("Signature {}", index)),
                remediation: Some("Ensure valid PKCS#7 ASN.1 structure".to_string()),
            });
        }

        // Check for SignedData OID
        let signed_data_oid = [0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02];
        let mut oid_found = false;
        
        for i in 2..signature_data.len().saturating_sub(signed_data_oid.len()) {
            if signature_data[i] == 0x06 && i + 1 < signature_data.len() {
                let oid_length = signature_data[i + 1] as usize;
                if oid_length == signed_data_oid.len() && i + 2 + oid_length <= signature_data.len() {
                    if signature_data[i + 2..i + 2 + oid_length] == signed_data_oid {
                        oid_found = true;
                        break;
                    }
                }
            }
        }

        if !oid_found {
            violations.push(ComplianceViolation {
                violation_id: "PKCS7_STRUCT_003".to_string(),
                description: format!("Signature {} missing SignedData OID in PKCS#7 structure", index),
                severity: ViolationSeverity::High,
                location: Some(format!("Signature {}", index)),
                remediation: Some("Ensure PKCS#7 contains SignedData OID".to_string()),
            });
        }

        Ok(())
    }

    fn has_timestamps(&self, context: &ComplianceContext) -> bool {
        context.signatures.iter().any(|sig| sig.pkcs7_info.signing_time.is_some())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::Utc;

    #[test]
    fn test_pdf_version_validation() {
        let config = ComplianceConfiguration::default();
        let validator = StandardsComplianceValidator::new(config);

        assert!(validator.is_valid_pdf_version("1.7"));
        assert!(validator.is_valid_pdf_version("1.4"));
        assert!(!validator.is_valid_pdf_version("1.3"));
        assert!(!validator.is_valid_pdf_version("2.0"));
        assert!(!validator.is_valid_pdf_version("invalid"));
    }

    #[test]
    fn test_compliance_violation_severity_ordering() {
        assert!(ViolationSeverity::Critical > ViolationSeverity::High);
        assert!(ViolationSeverity::High > ViolationSeverity::Medium);
        assert!(ViolationSeverity::Medium > ViolationSeverity::Low);
    }
}