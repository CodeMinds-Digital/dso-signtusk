//! Certificate validation implementation

use crate::{
    error::{PdfSignError, Result},
    types::*,
};
use chrono::Utc;

/// Certificate validator
pub struct CertificateValidator {
    // Validator configuration
}

impl CertificateValidator {
    pub fn new() -> Self {
        Self {}
    }

    /// Validate a certificate chain
    pub async fn validate_chain(
        &self,
        certificate: &X509Certificate,
        trusted_roots: &[X509Certificate],
    ) -> Result<CertificateValidationResult> {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();

        // Check if certificate is expired
        let now = Utc::now();
        let not_expired = now >= certificate.not_before && now <= certificate.not_after;
        
        if !not_expired {
            errors.push(ValidationError {
                code: "CERT_EXPIRED".to_string(),
                message: "Certificate is expired or not yet valid".to_string(),
                severity: ErrorSeverity::High,
            });
        }

        // Check if certificate is in trusted roots
        let trusted = self.is_certificate_trusted(certificate, trusted_roots);
        
        if !trusted && trusted_roots.len() > 0 {
            warnings.push(ValidationWarning {
                code: "CERT_NOT_TRUSTED".to_string(),
                message: "Certificate is not in the trusted root store".to_string(),
            });
        }

        // Validate certificate signature (simplified implementation)
        let signature_valid = self.validate_certificate_signature(certificate)?;
        
        if !signature_valid {
            errors.push(ValidationError {
                code: "INVALID_SIGNATURE".to_string(),
                message: "Certificate signature is invalid".to_string(),
                severity: ErrorSeverity::High,
            });
        }

        // Check key usage extensions
        let key_usage_valid = self.validate_key_usage(certificate);
        
        if !key_usage_valid {
            warnings.push(ValidationWarning {
                code: "INVALID_KEY_USAGE".to_string(),
                message: "Certificate key usage may not be appropriate for digital signing".to_string(),
            });
        }

        let is_valid = errors.is_empty();
        let chain_valid = is_valid && signature_valid;

        Ok(CertificateValidationResult {
            is_valid,
            chain_valid,
            not_expired,
            not_revoked: true, // Would need CRL/OCSP check in full implementation
            trusted,
            errors,
            warnings,
        })
    }

    /// Check if certificate is expired
    pub fn is_expired(&self, certificate: &X509Certificate) -> Result<bool> {
        let now = Utc::now();
        Ok(now < certificate.not_before || now > certificate.not_after)
    }

    /// Check if certificate is revoked (simplified implementation)
    pub async fn is_revoked(&self, _certificate: &X509Certificate) -> Result<bool> {
        // In a full implementation, this would:
        // 1. Check Certificate Revocation Lists (CRL)
        // 2. Query OCSP responders
        // 3. Check against local revocation databases
        // For now, we assume certificates are not revoked
        Ok(false)
    }

    /// Validate certificate chain against trusted roots
    pub async fn validate_certificate_chain(
        &self,
        certificate_chain: &[X509Certificate],
        trusted_roots: &[X509Certificate],
    ) -> Result<CertificateValidationResult> {
        if certificate_chain.is_empty() {
            return Err(PdfSignError::CertificateChainValidation {
                message: "Certificate chain is empty".to_string(),
                code: crate::error::ErrorCode::CertificateChainValidation,
            ,
                code: crate::error::ErrorCode::CertificateChainValidation,});
        }

        let mut all_errors = Vec::new();
        let mut all_warnings = Vec::new();
        let mut chain_valid = true;

        // Validate each certificate in the chain
        for (index, cert) in certificate_chain.iter().enumerate() {
            let validation_result = self.validate_chain(cert, trusted_roots).await?;
            
            if !validation_result.is_valid {
                chain_valid = false;
            }
            
            // Prefix errors and warnings with certificate index
            for error in validation_result.errors {
                all_errors.push(ValidationError {
                    code: format!("CERT_{}: {}", index, error.code),
                    message: format!("Certificate {}: {}", index, error.message),
                    severity: error.severity,
                });
            }
            
            for warning in validation_result.warnings {
                all_warnings.push(ValidationWarning {
                    code: format!("CERT_{}: {}", index, warning.code),
                    message: format!("Certificate {}: {}", index, warning.message),
                });
            }
        }

        // Validate chain structure (each certificate should be signed by the next)
        if certificate_chain.len() > 1 {
            for i in 0..certificate_chain.len() - 1 {
                let cert = &certificate_chain[i];
                let issuer_cert = &certificate_chain[i + 1];
                
                if cert.issuer != issuer_cert.subject {
                    all_errors.push(ValidationError {
                        code: "CHAIN_BROKEN".to_string(),
                        message: format!(
                            "Certificate {} issuer does not match certificate {} subject",
                            i, i + 1
                        ),
                        severity: ErrorSeverity::High,
                    });
                    chain_valid = false;
                }
            }
        }

        // Check if the root certificate is trusted
        let root_cert = certificate_chain.last().unwrap();
        let trusted = self.is_certificate_trusted(root_cert, trusted_roots);
        
        if !trusted && trusted_roots.len() > 0 {
            all_warnings.push(ValidationWarning {
                code: "ROOT_NOT_TRUSTED".to_string(),
                message: "Root certificate is not in the trusted root store".to_string(),
            });
        }

        let is_valid = all_errors.is_empty();
        let leaf_cert = &certificate_chain[0];
        let not_expired = !self.is_expired(leaf_cert)?;

        Ok(CertificateValidationResult {
            is_valid,
            chain_valid: chain_valid && is_valid,
            not_expired,
            not_revoked: true, // Would need CRL/OCSP check
            trusted,
            errors: all_errors,
            warnings: all_warnings,
        })
    }

    /// Check if a certificate is in the trusted root store
    fn is_certificate_trusted(&self, certificate: &X509Certificate, trusted_roots: &[X509Certificate]) -> bool {
        trusted_roots.iter().any(|root| {
            // Compare by subject and serial number (simplified)
            root.subject == certificate.subject && root.serial_number == certificate.serial_number
        })
    }

    /// Validate certificate signature (simplified implementation)
    fn validate_certificate_signature(&self, _certificate: &X509Certificate) -> Result<bool> {
        // In a full implementation, this would:
        // 1. Extract the public key from the issuer certificate
        // 2. Verify the signature using the public key
        // 3. Check the signature algorithm compatibility
        // For now, we assume signatures are valid
        Ok(true)
    }

    /// Validate key usage extensions
    fn validate_key_usage(&self, certificate: &X509Certificate) -> bool {
        // Check if the certificate has appropriate key usage for digital signing
        certificate.key_usage.iter().any(|usage| {
            usage == "digitalSignature" || usage == "nonRepudiation" || usage == "keyEncipherment"
        })
    }

    /// Validate certificate against a specific trusted root
    pub async fn validate_against_root(
        &self,
        certificate: &X509Certificate,
        root_certificate: &X509Certificate,
    ) -> Result<CertificateValidationResult> {
        let trusted_roots = vec![root_certificate.clone()];
        self.validate_chain(certificate, &trusted_roots).await
    }

    /// Build certificate chain from a collection of certificates
    pub fn build_certificate_chain(
        &self,
        leaf_certificate: &X509Certificate,
        intermediate_certificates: &[X509Certificate],
    ) -> Result<Vec<X509Certificate>> {
        let mut chain = vec![leaf_certificate.clone()];
        let mut current_cert = leaf_certificate;

        // Find intermediate certificates in order
        while current_cert.issuer != current_cert.subject {
            // Look for the issuer certificate
            let issuer_cert = intermediate_certificates.iter()
                .find(|cert| cert.subject == current_cert.issuer);

            match issuer_cert {
                Some(cert) => {
                    chain.push(cert.clone());
                    current_cert = cert;
                }
                None => {
                    // Chain is incomplete - missing intermediate certificate
                    break;
                }
            }

            // Prevent infinite loops
            if chain.len() > 10 {
                return Err(PdfSignError::CertificateChainValidation {
                    message: "Certificate chain too long or contains cycles".to_string(),
                code: crate::error::ErrorCode::CertificateChainValidation,
                ,
                code: crate::error::ErrorCode::CertificateChainValidation,});
            }
        }

        Ok(chain)
    }
}

impl Default for CertificateValidator {
    fn default() -> Self {
        Self::new()
    }
}