//! PDF signature validation implementation

use crate::{
    crypto::{engine::CryptographicEngineImpl, pkcs7::Pkcs7Parser},
    error::{PdfSignError, Result},
    pdf::parser::PdfParserImpl,
    traits::{CryptographicEngine, PdfParser, SignatureValidator},
    types::*,
};
use async_trait::async_trait;
use chrono::{DateTime, Utc};

/// PDF signature validator implementation
pub struct SignatureValidatorImpl {
    /// PDF parser for document structure handling
    pdf_parser: PdfParserImpl,
    /// Cryptographic engine for signature verification
    crypto_engine: CryptographicEngineImpl,
    /// PKCS#7 parser for signature container parsing
    pkcs7_parser: Pkcs7Parser,
}

impl SignatureValidatorImpl {
    pub fn new() -> Self {
        Self {
            pdf_parser: PdfParserImpl::new(),
            crypto_engine: CryptographicEngineImpl::new(),
            pkcs7_parser: Pkcs7Parser::new(),
        }
    }

    /// Extract all digital signatures from a PDF document
    async fn extract_signatures_internal(&self, document: &PdfDocument) -> Result<Vec<ExtractedSignature>> {
        let mut extracted_signatures = Vec::new();

        // Process each existing signature in the document
        for (index, signature) in document.existing_signatures.iter().enumerate() {
            let extracted = self.extract_single_signature(document, signature, index).await?;
            extracted_signatures.push(extracted);
        }

        Ok(extracted_signatures)
    }

    /// Extract a single signature with full metadata
    async fn extract_single_signature(
        &self,
        document: &PdfDocument,
        signature: &DigitalSignature,
        signature_index: usize,
    ) -> Result<ExtractedSignature> {
        // Parse PKCS#7 signature container
        let pkcs7_info = self.pkcs7_parser
            .parse_signature(&signature.signature_data)
            .await?;

        // Find the corresponding signature field
        let signature_field = document.signature_fields
            .iter()
            .find(|f| f.name == signature.field_name)
            .cloned();

        // Extract certificate chain from PKCS#7
        let certificate_chain = self.extract_certificate_chain(&pkcs7_info)?;

        // Extract signature algorithm information
        let signature_algorithm = self.extract_signature_algorithm(&pkcs7_info)?;

        // Calculate document hash for this signature (excluding this and later signatures)
        let document_hash = self.calculate_signature_document_hash(document, signature_index).await?;

        Ok(ExtractedSignature {
            signature_index,
            field_name: signature.field_name.clone(),
            signature_field,
            signer_name: signature.signer_name.clone(),
            signing_time: signature.signing_time,
            reason: signature.reason.clone(),
            location: signature.location.clone(),
            contact_info: signature.contact_info.clone(),
            certificate_chain,
            signature_algorithm,
            signature_data: signature.signature_data.clone(),
            document_hash,
            pkcs7_info,
        })
    }

    /// Extract certificate chain from PKCS#7 signature
    fn extract_certificate_chain(&self, pkcs7_info: &Pkcs7SignatureInfo) -> Result<Vec<CertificateInfo>> {
        let mut chain = Vec::new();

        // Add signer certificate
        chain.push(pkcs7_info.signer_certificate.clone());

        // Add intermediate certificates
        for cert in &pkcs7_info.certificate_chain {
            chain.push(cert.clone());
        }

        Ok(chain)
    }

    /// Extract signature algorithm information from PKCS#7
    fn extract_signature_algorithm(&self, pkcs7_info: &Pkcs7SignatureInfo) -> Result<SignatureAlgorithmInfo> {
        Ok(SignatureAlgorithmInfo {
            algorithm: pkcs7_info.signature_algorithm.clone(),
            hash_algorithm: pkcs7_info.hash_algorithm.clone(),
            key_size: pkcs7_info.key_size,
        })
    }

    /// Calculate document hash for a specific signature (excluding this and later signatures)
    async fn calculate_signature_document_hash(
        &self,
        document: &PdfDocument,
        signature_index: usize,
    ) -> Result<Vec<u8>> {
        // Create a version of the document that excludes this signature and all later ones
        let mut document_for_hash = document.clone();
        
        // Remove signatures from the specified index onwards
        document_for_hash.existing_signatures.truncate(signature_index);
        
        // Mark corresponding signature fields as unsigned
        for sig in document.existing_signatures.iter().skip(signature_index) {
            if let Some(field) = document_for_hash.signature_fields.iter_mut().find(|f| f.name == sig.field_name) {
                field.is_signed = false;
            }
        }

        // Calculate hash using SHA-256 (most common for PDF signatures)
        self.crypto_engine
            .compute_document_hash(&document_for_hash, HashAlgorithm::Sha256)
            .await
    }

    /// Verify cryptographic integrity of a signature
    async fn verify_signature_cryptography(
        &self,
        extracted_signature: &ExtractedSignature,
    ) -> Result<SignatureVerificationResult> {
        let mut result = SignatureVerificationResult {
            is_valid: false,
            signature_index: extracted_signature.signature_index,
            signer_name: extracted_signature.signer_name.clone(),
            signing_time: extracted_signature.signing_time,
            certificate_valid: false,
            document_intact: false,
            errors: Vec::new(),
            warnings: Vec::new(),
        };

        // Step 1: Verify PKCS#7 signature container integrity
        match self.verify_pkcs7_integrity(&extracted_signature.pkcs7_info).await {
            Ok(_) => {},
            Err(e) => {
                result.errors.push(format!("PKCS#7 integrity check failed: {}", e));
                return Ok(result);
            }
        }

        // Step 2: Verify certificate chain
        match self.verify_certificate_chain(&extracted_signature.certificate_chain).await {
            Ok(chain_valid) => {
                result.certificate_valid = chain_valid;
                if !chain_valid {
                    result.warnings.push("Certificate chain validation failed".to_string());
                }
            },
            Err(e) => {
                result.errors.push(format!("Certificate chain verification failed: {}", e));
                return Ok(result);
            }
        }

        // Step 3: Verify signature against document hash
        match self.verify_signature_against_hash(
            &extracted_signature.signature_data,
            &extracted_signature.document_hash,
            &extracted_signature.certificate_chain[0], // Signer certificate
            &extracted_signature.signature_algorithm,
        ).await {
            Ok(signature_valid) => {
                result.document_intact = signature_valid;
                if !signature_valid {
                    result.errors.push("Signature verification against document hash failed".to_string());
                    return Ok(result);
                }
            },
            Err(e) => {
                result.errors.push(format!("Signature verification failed: {}", e));
                return Ok(result);
            }
        }

        // Step 4: Check certificate validity period
        let now = Utc::now();
        let signer_cert = &extracted_signature.certificate_chain[0];
        
        if now < signer_cert.not_before {
            result.warnings.push("Certificate was not yet valid at signing time".to_string());
        }
        
        if now > signer_cert.not_after {
            result.warnings.push("Certificate has expired".to_string());
        }

        // Step 5: Validate signing time
        if let Err(e) = self.validate_signing_time(extracted_signature) {
            result.warnings.push(format!("Signing time validation: {}", e));
        }

        // Overall validity determination
        result.is_valid = result.certificate_valid && result.document_intact && result.errors.is_empty();

        Ok(result)
    }

    /// Verify PKCS#7 signature container integrity
    async fn verify_pkcs7_integrity(&self, pkcs7_info: &Pkcs7SignatureInfo) -> Result<()> {
        // Verify PKCS#7 structure is well-formed
        if pkcs7_info.signer_certificate.der_data.is_empty() {
            return Err(PdfSignError::SignatureValidation {
                message: "PKCS#7 signature missing signer certificate".to_string(),
                code: crate::error::ErrorCode::SignatureValidation,
            ,
                code: crate::error::ErrorCode::SignatureValidation,});
        }

        if pkcs7_info.signature_value.is_empty() {
            return Err(PdfSignError::SignatureValidation {
                message: "PKCS#7 signature missing signature value".to_string(),
                code: crate::error::ErrorCode::SignatureValidation,
            ,
                code: crate::error::ErrorCode::SignatureValidation,});
        }

        // Verify signature algorithm is supported
        match pkcs7_info.signature_algorithm {
            SignatureAlgorithm::RsaPkcs1Sha256 |
            SignatureAlgorithm::RsaPkcs1Sha384 |
            SignatureAlgorithm::RsaPkcs1Sha512 |
            SignatureAlgorithm::EcdsaP256Sha256 |
            SignatureAlgorithm::EcdsaP384Sha384 |
            SignatureAlgorithm::EcdsaP521Sha512 => {},
            _ => {
                return Err(PdfSignError::SignatureValidation {
                    message: format!("Unsupported signature algorithm: {:?,
                code: crate::error::ErrorCode::SignatureValidation,}", pkcs7_info.signature_algorithm),
                });
            }
        }

        Ok(())
    }

    /// Verify certificate chain validity
    async fn verify_certificate_chain(&self, certificate_chain: &[CertificateInfo]) -> Result<bool> {
        if certificate_chain.is_empty() {
            return Ok(false);
        }

        // For now, we'll do basic validation
        // In a full implementation, this would verify against trusted CAs
        
        // Check that signer certificate is present
        let signer_cert = &certificate_chain[0];
        
        // Basic certificate validation
        if signer_cert.der_data.is_empty() {
            return Ok(false);
        }

        if signer_cert.subject.is_empty() {
            return Ok(false);
        }

        // Check certificate validity period
        let now = Utc::now();
        if now < signer_cert.not_before || now > signer_cert.not_after {
            return Ok(false);
        }

        // TODO: Implement full certificate chain validation against trusted CAs
        // For now, we'll return true if basic checks pass
        Ok(true)
    }

    /// Verify signature against document hash
    async fn verify_signature_against_hash(
        &self,
        signature_data: &[u8],
        document_hash: &[u8],
        signer_certificate: &CertificateInfo,
        signature_algorithm: &SignatureAlgorithmInfo,
    ) -> Result<bool> {
        // Extract public key from certificate
        let public_key = self.crypto_engine
            .extract_public_key_from_certificate(&signer_certificate.der_data)
            .await?;

        // Verify signature using the appropriate algorithm
        match signature_algorithm.algorithm {
            SignatureAlgorithm::RsaPkcs1Sha256 => {
                self.crypto_engine
                    .verify_rsa_signature(document_hash, signature_data, &public_key, HashAlgorithm::Sha256)
                    .await
            },
            SignatureAlgorithm::RsaPkcs1Sha384 => {
                self.crypto_engine
                    .verify_rsa_signature(document_hash, signature_data, &public_key, HashAlgorithm::Sha384)
                    .await
            },
            SignatureAlgorithm::RsaPkcs1Sha512 => {
                self.crypto_engine
                    .verify_rsa_signature(document_hash, signature_data, &public_key, HashAlgorithm::Sha512)
                    .await
            },
            SignatureAlgorithm::EcdsaP256Sha256 => {
                self.crypto_engine
                    .verify_ecdsa_signature(document_hash, signature_data, &public_key, EcdsaCurve::P256)
                    .await
            },
            SignatureAlgorithm::EcdsaP384Sha384 => {
                self.crypto_engine
                    .verify_ecdsa_signature(document_hash, signature_data, &public_key, EcdsaCurve::P384)
                    .await
            },
            SignatureAlgorithm::EcdsaP521Sha512 => {
                self.crypto_engine
                    .verify_ecdsa_signature(document_hash, signature_data, &public_key, EcdsaCurve::P521)
                    .await
            },
            _ => {
                Err(PdfSignError::SignatureValidation {
                    message: format!("Unsupported signature algorithm for verification: {:?,
                code: crate::error::ErrorCode::SignatureValidation,}", signature_algorithm.algorithm),
                })
            }
        }
    }

    /// Validate signing time consistency
    fn validate_signing_time(&self, extracted_signature: &ExtractedSignature) -> Result<()> {
        // Check if signing time is reasonable (not too far in the future or past)
        let now = Utc::now();
        let signing_time = extracted_signature.signing_time;

        // Allow up to 1 hour in the future (for clock skew)
        let max_future = now + chrono::Duration::hours(1);
        if signing_time > max_future {
            return Err(PdfSignError::SignatureValidation {
                message: "Signing time is too far in the future".to_string(),
                code: crate::error::ErrorCode::SignatureValidation,
            ,
                code: crate::error::ErrorCode::SignatureValidation,});
        }

        // Allow up to 50 years in the past (reasonable for document archival)
        let max_past = now - chrono::Duration::days(365 * 50);
        if signing_time < max_past {
            return Err(PdfSignError::SignatureValidation {
                message: "Signing time is too far in the past".to_string(),
                code: crate::error::ErrorCode::SignatureValidation,
            ,
                code: crate::error::ErrorCode::SignatureValidation,});
        }

        Ok(())
    }

    /// Detect document tampering by comparing signatures
    async fn detect_document_tampering(
        &self,
        document: &PdfDocument,
        extracted_signatures: &[ExtractedSignature],
    ) -> Result<Vec<TamperingDetectionResult>> {
        let mut results = Vec::new();

        for (index, signature) in extracted_signatures.iter().enumerate() {
            let result = self.detect_tampering_for_signature(document, signature, index).await?;
            results.push(result);
        }

        Ok(results)
    }

    /// Detect tampering for a specific signature
    async fn detect_tampering_for_signature(
        &self,
        document: &PdfDocument,
        signature: &ExtractedSignature,
        signature_index: usize,
    ) -> Result<TamperingDetectionResult> {
        let mut result = TamperingDetectionResult {
            signature_index,
            is_document_intact: true,
            modifications_detected: Vec::new(),
            integrity_status: DocumentIntegrityStatus::Intact,
        };

        // Recalculate document hash for this signature
        let current_hash = self.calculate_signature_document_hash(document, signature_index).await?;

        // Compare with stored hash
        if current_hash != signature.document_hash {
            result.is_document_intact = false;
            result.integrity_status = DocumentIntegrityStatus::Modified;
            result.modifications_detected.push(ModificationInfo {
                modification_type: ModificationType::ContentChanged,
                description: "Document content has been modified since signing".to_string(),
                affected_pages: None, // TODO: Implement page-level detection
            });
        }

        // Check for signature field modifications
        if let Some(field) = &signature.signature_field {
            if let Some(current_field) = document.signature_fields.iter().find(|f| f.name == signature.field_name) {
                if field.bounds != current_field.bounds {
                    result.modifications_detected.push(ModificationInfo {
                        modification_type: ModificationType::SignatureFieldModified,
                        description: "Signature field bounds have been modified".to_string(),
                        affected_pages: Some(vec![field.page]),
                    });
                }
            } else {
                result.is_document_intact = false;
                result.integrity_status = DocumentIntegrityStatus::Corrupted;
                result.modifications_detected.push(ModificationInfo {
                    modification_type: ModificationType::SignatureFieldRemoved,
                    description: "Signature field has been removed".to_string(),
                    affected_pages: Some(vec![field.page]),
                });
            }
        }

        // Check for metadata modifications
        // This would involve comparing stored metadata hashes with current values
        // For now, we'll skip this as it requires more complex implementation

        Ok(result)
    }

    /// Validate all signatures in a document comprehensively
    async fn validate_all_signatures_internal(&self, document: &PdfDocument) -> Result<Vec<SignatureVerificationResult>> {
        // Step 1: Extract all signatures
        let extracted_signatures = self.extract_signatures_internal(document).await?;

        if extracted_signatures.is_empty() {
            return Ok(Vec::new());
        }

        // Step 2: Verify each signature cryptographically
        let mut verification_results = Vec::new();
        for signature in &extracted_signatures {
            let result = self.verify_signature_cryptography(signature).await?;
            verification_results.push(result);
        }

        // Step 3: Detect document tampering
        let tampering_results = self.detect_document_tampering(document, &extracted_signatures).await?;

        // Step 4: Merge tampering detection results into verification results
        for (verification_result, tampering_result) in verification_results.iter_mut().zip(tampering_results.iter()) {
            if !tampering_result.is_document_intact {
                verification_result.document_intact = false;
                verification_result.is_valid = false;
                
                for modification in &tampering_result.modifications_detected {
                    verification_result.errors.push(format!("Document tampering detected: {}", modification.description));
                }
            }
        }

        Ok(verification_results)
    }
}

impl Default for SignatureValidatorImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl SignatureValidator for SignatureValidatorImpl {
    async fn extract_signatures(&self, document: &PdfDocument) -> Result<Vec<ExtractedSignature>> {
        self.extract_signatures_internal(document).await
    }

    async fn verify_signature(&self, extracted_signature: &ExtractedSignature) -> Result<SignatureVerificationResult> {
        self.verify_signature_cryptography(extracted_signature).await
    }

    async fn validate_signatures(&self, document: &PdfDocument) -> Result<Vec<SignatureVerificationResult>> {
        self.validate_all_signatures_internal(document).await
    }

    async fn detect_tampering(&self, document: &PdfDocument) -> Result<Vec<TamperingDetectionResult>> {
        let extracted_signatures = self.extract_signatures_internal(document).await?;
        self.detect_document_tampering(document, &extracted_signatures).await
    }
}