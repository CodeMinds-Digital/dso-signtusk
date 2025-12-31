//! Cryptographic engine implementation

use crate::{
    error::{PdfSignError, Result},
    traits::CryptographicEngine,
    types::*,
};
use async_trait::async_trait;
use sha2::{Sha256, Sha384, Sha512, Digest};
use rsa::{RsaPrivateKey, RsaPublicKey, Pkcs1v15Sign, Pss};
use rsa::pkcs1::DecodeRsaPrivateKey;
use rsa::pkcs8::{DecodePrivateKey, DecodePublicKey};
use rsa::traits::PublicKeyParts;
use p256::{ecdsa::SigningKey as P256SigningKey, ecdsa::VerifyingKey as P256VerifyingKey, ecdsa::Signature as P256Signature};
use p384::{ecdsa::SigningKey as P384SigningKey, ecdsa::VerifyingKey as P384VerifyingKey, ecdsa::Signature as P384Signature};
use ecdsa::signature::{Signer, Verifier};
use rand;

/// Cryptographic engine implementation
pub struct CryptographicEngineImpl {
    // Engine configuration and state
}

impl CryptographicEngineImpl {
    pub fn new() -> Self {
        Self {}
    }

    /// Extract byte ranges of signature fields that should be excluded from hash calculation
    fn extract_signature_field_ranges(&self, document: &PdfDocument) -> Result<Vec<(usize, usize)>> {
        let mut ranges = Vec::new();
        
        // For each existing signature, find its byte range in the PDF
        for signature in &document.existing_signatures {
            // Parse the PDF to find the signature object and its byte range
            // This is a simplified implementation - in practice, we'd need to parse
            // the PDF structure to find the exact byte ranges of signature contents
            if let Some(range) = self.find_signature_byte_range(&document.data, &signature.field_name)? {
                ranges.push(range);
            }
        }
        
        Ok(ranges)
    }

    /// Find the byte range of a signature field in the PDF data
    fn find_signature_byte_range(&self, _pdf_data: &[u8], _field_name: &str) -> Result<Option<(usize, usize)>> {
        // This is a simplified implementation
        // In a real implementation, we would parse the PDF structure to find:
        // 1. The signature dictionary for the given field name
        // 2. The /ByteRange array that specifies which bytes to exclude
        // 3. The /Contents field that contains the actual signature data
        
        // For now, we'll return None to indicate no signature ranges found
        // This means we'll hash the entire document, which is safe for unsigned documents
        Ok(None)
    }

    /// Filter document data by excluding specified byte ranges
    fn filter_document_data(&self, data: &[u8], exclude_ranges: &[(usize, usize)]) -> Result<Vec<u8>> {
        if exclude_ranges.is_empty() {
            // No ranges to exclude, return the entire document
            return Ok(data.to_vec());
        }

        let mut filtered_data = Vec::new();
        let mut current_pos = 0;

        // Sort ranges by start position to process them in order
        let mut sorted_ranges = exclude_ranges.to_vec();
        sorted_ranges.sort_by_key(|&(start, _)| start);

        for (start, end) in sorted_ranges {
            // Validate range bounds
            if start > data.len() || end > data.len() || start > end {
                return Err(PdfSignError::HashCalculation {
                    message: format!("Invalid byte range: {,
                code: crate::error::ErrorCode::HashCalculation,}-{}", start, end),
                });
            }

            // Add data before the excluded range
            if current_pos < start {
                filtered_data.extend_from_slice(&data[current_pos..start]);
            }

            // Skip the excluded range
            current_pos = end;
        }

        // Add remaining data after the last excluded range
        if current_pos < data.len() {
            filtered_data.extend_from_slice(&data[current_pos..]);
        }

        Ok(filtered_data)
    }

    /// Create RSA signature
    async fn create_rsa_signature(
        &self,
        hash: &[u8],
        private_key: &PrivateKey,
        algorithm: SignatureAlgorithm,
    ) -> Result<Vec<u8>> {
        // Parse the RSA private key from DER format
        let rsa_key = self.parse_rsa_private_key(&private_key.der_data)?;
        
        match algorithm {
            SignatureAlgorithm::RsaPkcs1Sha256 | SignatureAlgorithm::RsaPkcs1Sha384 | SignatureAlgorithm::RsaPkcs1Sha512 => {
                // Use PKCS#1 v1.5 padding with appropriate hash
                let signature = match hash.len() {
                    32 => {
                        let signing_key = Pkcs1v15Sign::new_unprefixed();
                        rsa_key.sign(signing_key, hash)
                    }
                    48 => {
                        let signing_key = Pkcs1v15Sign::new_unprefixed();
                        rsa_key.sign(signing_key, hash)
                    }
                    64 => {
                        let signing_key = Pkcs1v15Sign::new_unprefixed();
                        rsa_key.sign(signing_key, hash)
                    }
                    _ => return Err(PdfSignError::SignatureCreation {
                        message: format!("Unsupported hash length: {,
                code: crate::error::ErrorCode::SignatureCreation,}", hash.len()),
                    }),
                };

                signature.map_err(|e| PdfSignError::SignatureCreation {
                    message: format!("RSA PKCS#1 signature creation failed: {,
                code: crate::error::ErrorCode::SignatureCreation,}", e),
                }).map(|s| s)
            }
            SignatureAlgorithm::RsaPss => {
                // Use PSS padding
                let signature = match hash.len() {
                    32 => {
                        let mut rng = rand::thread_rng();
                        let signing_key = Pss::new_with_salt::<sha2::Sha256>(32);
                        rsa_key.sign_with_rng(&mut rng, signing_key, hash)
                    }
                    48 => {
                        let mut rng = rand::thread_rng();
                        let signing_key = Pss::new_with_salt::<sha2::Sha384>(48);
                        rsa_key.sign_with_rng(&mut rng, signing_key, hash)
                    }
                    64 => {
                        let mut rng = rand::thread_rng();
                        let signing_key = Pss::new_with_salt::<sha2::Sha512>(64);
                        rsa_key.sign_with_rng(&mut rng, signing_key, hash)
                    }
                    _ => return Err(PdfSignError::SignatureCreation {
                        message: format!("Unsupported hash length: {,
                code: crate::error::ErrorCode::SignatureCreation,}", hash.len()),
                    }),
                };

                signature.map_err(|e| PdfSignError::SignatureCreation {
                    message: format!("RSA PSS signature creation failed: {,
                code: crate::error::ErrorCode::SignatureCreation,}", e),
                })
            }
            _ => Err(PdfSignError::SignatureCreation {
                message: format!("Unsupported RSA signature algorithm: {:?,
                code: crate::error::ErrorCode::SignatureCreation,}", algorithm),
            }),
        }
    }

    /// Verify RSA signature
    async fn verify_rsa_signature(
        &self,
        signature: &[u8],
        hash: &[u8],
        certificate: &X509Certificate,
    ) -> Result<bool> {
        // Extract RSA public key from certificate
        let public_key = self.extract_rsa_public_key_from_certificate(certificate)?;
        
        // Try both PKCS#1 and PSS verification since we don't know which was used
        let pkcs1_result = self.verify_rsa_pkcs1_signature(&public_key, signature, hash);
        if pkcs1_result.is_ok() && pkcs1_result.unwrap() {
            return Ok(true);
        }

        let pss_result = self.verify_rsa_pss_signature(&public_key, signature, hash);
        if pss_result.is_ok() && pss_result.unwrap() {
            return Ok(true);
        }

        Ok(false)
    }

    /// Parse RSA private key from DER format
    fn parse_rsa_private_key(&self, der_data: &[u8]) -> Result<RsaPrivateKey> {
        // Try PKCS#8 format first
        if let Ok(key) = RsaPrivateKey::from_pkcs8_der(der_data) {
            return Ok(key);
        }

        // Try PKCS#1 format
        if let Ok(key) = RsaPrivateKey::from_pkcs1_der(der_data) {
            return Ok(key);
        }

        Err(PdfSignError::SignatureCreation {
            message: "Failed to parse RSA private key from DER data".to_string(),
                code: crate::error::ErrorCode::SignatureCreation,
        ,
                code: crate::error::ErrorCode::SignatureCreation,})
    }

    /// Extract RSA public key from X.509 certificate
    fn extract_rsa_public_key_from_certificate(&self, certificate: &X509Certificate) -> Result<RsaPublicKey> {
        // Parse the certificate and extract the public key
        // This is a simplified implementation - in practice, we'd use a proper X.509 parser
        use x509_certificate::X509Certificate as X509Cert;
        
        let cert = X509Cert::from_der(&certificate.der_data)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to parse X.509 certificate: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        // Extract the public key from the certificate
        let public_key_info = cert.public_key_data();
        
        // Parse the RSA public key from the SubjectPublicKeyInfo
        let public_key = RsaPublicKey::from_public_key_der(&public_key_info)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to extract RSA public key from certificate: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        Ok(public_key)
    }

    /// Verify RSA PKCS#1 signature
    fn verify_rsa_pkcs1_signature(
        &self,
        public_key: &RsaPublicKey,
        signature: &[u8],
        hash: &[u8],
    ) -> Result<bool> {
        let verifying_key = Pkcs1v15Sign::new_unprefixed();

        match public_key.verify(verifying_key, hash, signature) {
            Ok(()) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Verify RSA PSS signature
    fn verify_rsa_pss_signature(
        &self,
        public_key: &RsaPublicKey,
        signature: &[u8],
        hash: &[u8],
    ) -> Result<bool> {
        let verifying_key = match hash.len() {
            32 => Pss::new_with_salt::<sha2::Sha256>(32),
            48 => Pss::new_with_salt::<sha2::Sha384>(48),
            64 => Pss::new_with_salt::<sha2::Sha512>(64),
            _ => return Err(PdfSignError::SignatureValidation {
                message: format!("Unsupported hash length: {,
                code: crate::error::ErrorCode::SignatureValidation,}", hash.len()),
            }),
        };

        match public_key.verify(verifying_key, hash, signature) {
            Ok(()) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Extract key algorithm from X.509 certificate
    fn extract_key_algorithm_from_certificate(&self, certificate: &X509Certificate) -> Result<KeyAlgorithm> {
        // Parse the certificate to determine the key algorithm
        use x509_certificate::X509Certificate as X509Cert;
        
        let cert = X509Cert::from_der(&certificate.der_data)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to parse X.509 certificate: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        // Check the public key algorithm identifier
        let algorithm_oid = cert.key_algorithm_oid();
        
        // RSA encryption OID: 1.2.840.113549.1.1.1
        if algorithm_oid.to_string() == "1.2.840.113549.1.1.1" {
            return Ok(KeyAlgorithm::Rsa);
        }

        // ECDSA OIDs
        match algorithm_oid.to_string().as_str() {
            "1.2.840.10045.2.1" => {
                // This is the general EC public key OID, need to check the curve
                // For now, default to P-256
                Ok(KeyAlgorithm::EcdsaP256)
            }
            _ => Err(PdfSignError::SignatureValidation {
                message: format!("Unsupported key algorithm OID: {,
                code: crate::error::ErrorCode::SignatureValidation,}", algorithm_oid),
            }),
        }
    }

    /// Create ECDSA P-256 signature
    async fn create_ecdsa_p256_signature(
        &self,
        hash: &[u8],
        private_key: &PrivateKey,
        _algorithm: SignatureAlgorithm,
    ) -> Result<Vec<u8>> {
        // Parse the ECDSA P-256 private key from DER format
        let signing_key = P256SigningKey::from_pkcs8_der(&private_key.der_data)
            .map_err(|e| PdfSignError::SignatureCreation {
                message: format!("Failed to parse ECDSA P-256 private key: {,
                code: crate::error::ErrorCode::SignatureCreation,}", e),
            })?;

        // Create signature
        let signature: P256Signature = signing_key.sign(hash);
        
        Ok(signature.to_der().as_bytes().to_vec())
    }

    /// Create ECDSA P-384 signature
    async fn create_ecdsa_p384_signature(
        &self,
        hash: &[u8],
        private_key: &PrivateKey,
        _algorithm: SignatureAlgorithm,
    ) -> Result<Vec<u8>> {
        // Parse the ECDSA P-384 private key from DER format
        let signing_key = P384SigningKey::from_pkcs8_der(&private_key.der_data)
            .map_err(|e| PdfSignError::SignatureCreation {
                message: format!("Failed to parse ECDSA P-384 private key: {,
                code: crate::error::ErrorCode::SignatureCreation,}", e),
            })?;

        // Create signature
        let signature: P384Signature = signing_key.sign(hash);
        
        Ok(signature.to_der().as_bytes().to_vec())
    }

    /// Verify ECDSA P-256 signature
    async fn verify_ecdsa_p256_signature(
        &self,
        signature: &[u8],
        hash: &[u8],
        certificate: &X509Certificate,
    ) -> Result<bool> {
        // Extract ECDSA P-256 public key from certificate
        let verifying_key = self.extract_ecdsa_p256_public_key_from_certificate(certificate)?;
        
        // Parse signature from DER format
        let signature = P256Signature::from_der(signature)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to parse ECDSA P-256 signature: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        // Verify signature
        match verifying_key.verify(hash, &signature) {
            Ok(()) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Verify ECDSA P-384 signature
    async fn verify_ecdsa_p384_signature(
        &self,
        signature: &[u8],
        hash: &[u8],
        certificate: &X509Certificate,
    ) -> Result<bool> {
        // Extract ECDSA P-384 public key from certificate
        let verifying_key = self.extract_ecdsa_p384_public_key_from_certificate(certificate)?;
        
        // Parse signature from DER format
        let signature = P384Signature::from_der(signature)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to parse ECDSA P-384 signature: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        // Verify signature
        match verifying_key.verify(hash, &signature) {
            Ok(()) => Ok(true),
            Err(_) => Ok(false),
        }
    }

    /// Extract ECDSA P-256 public key from X.509 certificate
    fn extract_ecdsa_p256_public_key_from_certificate(&self, certificate: &X509Certificate) -> Result<P256VerifyingKey> {
        use x509_certificate::X509Certificate as X509Cert;
        
        let cert = X509Cert::from_der(&certificate.der_data)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to parse X.509 certificate: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        // Extract the public key from the certificate
        let public_key_info = cert.public_key_data();
        
        // Parse the ECDSA P-256 public key from the SubjectPublicKeyInfo
        let verifying_key = P256VerifyingKey::from_public_key_der(&public_key_info)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to extract ECDSA P-256 public key from certificate: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        Ok(verifying_key)
    }

    /// Extract ECDSA P-384 public key from X.509 certificate
    fn extract_ecdsa_p384_public_key_from_certificate(&self, certificate: &X509Certificate) -> Result<P384VerifyingKey> {
        use x509_certificate::X509Certificate as X509Cert;
        
        let cert = X509Cert::from_der(&certificate.der_data)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to parse X.509 certificate: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        // Extract the public key from the certificate
        let public_key_info = cert.public_key_data();
        
        // Parse the ECDSA P-384 public key from the SubjectPublicKeyInfo
        let verifying_key = P384VerifyingKey::from_public_key_der(&public_key_info)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to extract ECDSA P-384 public key from certificate: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        Ok(verifying_key)
    }
}

impl Default for CryptographicEngineImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl CryptographicEngine for CryptographicEngineImpl {
    async fn compute_document_hash(
        &self,
        document: &PdfDocument,
        algorithm: HashAlgorithm,
    ) -> Result<Vec<u8>> {
        // Extract signature field byte ranges to exclude from hash calculation
        let signature_ranges = self.extract_signature_field_ranges(document)?;
        
        // Create filtered document data excluding signature field contents
        let filtered_data = self.filter_document_data(&document.data, &signature_ranges)?;
        
        // Compute hash of the filtered data
        self.compute_hash(&filtered_data, algorithm)
    }

    fn compute_hash(&self, data: &[u8], algorithm: HashAlgorithm) -> Result<Vec<u8>> {
        match algorithm {
            HashAlgorithm::Sha256 => {
                let mut hasher = Sha256::new();
                hasher.update(data);
                Ok(hasher.finalize().to_vec())
            }
            HashAlgorithm::Sha384 => {
                let mut hasher = Sha384::new();
                hasher.update(data);
                Ok(hasher.finalize().to_vec())
            }
            HashAlgorithm::Sha512 => {
                let mut hasher = Sha512::new();
                hasher.update(data);
                Ok(hasher.finalize().to_vec())
            }
        }
    }

    async fn create_signature(
        &self,
        hash: &[u8],
        private_key: &PrivateKey,
        algorithm: SignatureAlgorithm,
    ) -> Result<Vec<u8>> {
        match private_key.algorithm {
            KeyAlgorithm::Rsa => {
                self.create_rsa_signature(hash, private_key, algorithm).await
            }
            KeyAlgorithm::EcdsaP256 => {
                self.create_ecdsa_p256_signature(hash, private_key, algorithm).await
            }
            KeyAlgorithm::EcdsaP384 => {
                self.create_ecdsa_p384_signature(hash, private_key, algorithm).await
            }
            KeyAlgorithm::EcdsaP521 => {
                // P-521 implementation would go here
                Err(PdfSignError::SignatureCreation {
                    message: "ECDSA P-521 signature creation not yet implemented".to_string(),
                code: crate::error::ErrorCode::SignatureCreation,
                ,
                code: crate::error::ErrorCode::SignatureCreation,})
            }
        }
    }

    async fn verify_signature(
        &self,
        signature: &[u8],
        hash: &[u8],
        public_key: &X509Certificate,
    ) -> Result<bool> {
        // Extract public key algorithm from certificate
        let key_algorithm = self.extract_key_algorithm_from_certificate(public_key)?;
        
        match key_algorithm {
            KeyAlgorithm::Rsa => {
                self.verify_rsa_signature(signature, hash, public_key).await
            }
            KeyAlgorithm::EcdsaP256 => {
                self.verify_ecdsa_p256_signature(signature, hash, public_key).await
            }
            KeyAlgorithm::EcdsaP384 => {
                self.verify_ecdsa_p384_signature(signature, hash, public_key).await
            }
            KeyAlgorithm::EcdsaP521 => {
                // P-521 implementation would go here
                Err(PdfSignError::SignatureValidation {
                    message: "ECDSA P-521 signature verification not yet implemented".to_string(),
                code: crate::error::ErrorCode::SignatureValidation,
                ,
                code: crate::error::ErrorCode::SignatureValidation,})
            }
        }
    }

    async fn create_pkcs7_signature(
        &self,
        hash: &[u8],
        credentials: &SigningCredentials,
        options: &Pkcs7Options,
    ) -> Result<Vec<u8>> {
        // Use the PKCS#7 builder to create the signature
        use crate::crypto::pkcs7::Pkcs7Builder;
        let builder = Pkcs7Builder::new();
        builder.create_signature(hash, credentials, options).await
    }

    async fn parse_pkcs7_signature(&self, pkcs7_data: &[u8]) -> Result<Pkcs7SignatureInfo> {
        // Use the PKCS#7 parser to parse the signature
        use crate::crypto::pkcs7_parser::Pkcs7Parser;
        let parser = Pkcs7Parser::new();
        parser.parse_signature(pkcs7_data).await
    }

    async fn extract_public_key_from_certificate(&self, cert_der: &[u8]) -> Result<PublicKey> {
        use x509_certificate::X509Certificate as X509Cert;
        
        let cert = X509Cert::from_der(cert_der)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to parse X.509 certificate: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        // Extract the public key from the certificate
        let public_key_info = cert.public_key_data();
        
        // Determine the key algorithm
        let algorithm_oid = cert.key_algorithm_oid();
        
        let (algorithm, key_size) = match algorithm_oid.to_string().as_str() {
            "1.2.840.113549.1.1.1" => {
                // RSA encryption
                let rsa_key = RsaPublicKey::from_public_key_der(&public_key_info)
                    .map_err(|e| PdfSignError::SignatureValidation {
                        message: format!("Failed to parse RSA public key: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
                    })?;
                (KeyAlgorithm::Rsa, rsa_key.size() as u32 * 8)
            }
            "1.2.840.10045.2.1" => {
                // ECDSA - need to determine curve from parameters
                // For now, default to P-256
                (KeyAlgorithm::EcdsaP256, 256)
            }
            _ => return Err(PdfSignError::SignatureValidation {
                message: format!("Unsupported key algorithm OID: {,
                code: crate::error::ErrorCode::SignatureValidation,}", algorithm_oid),
            }),
        };

        Ok(PublicKey {
            algorithm,
            key_size,
            der_data: public_key_info.to_vec(),
        })
    }

    async fn verify_rsa_signature(
        &self,
        hash: &[u8],
        signature: &[u8],
        public_key: &PublicKey,
        hash_algorithm: HashAlgorithm,
    ) -> Result<bool> {
        // Parse the RSA public key
        let rsa_key = RsaPublicKey::from_public_key_der(&public_key.der_data)
            .map_err(|e| PdfSignError::SignatureValidation {
                message: format!("Failed to parse RSA public key: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
            })?;

        // Try PKCS#1 v1.5 verification first
        let pkcs1_result = self.verify_rsa_pkcs1_signature(&rsa_key, signature, hash);
        if pkcs1_result.is_ok() && pkcs1_result.unwrap() {
            return Ok(true);
        }

        // Try PSS verification
        let pss_result = self.verify_rsa_pss_signature(&rsa_key, signature, hash);
        if pss_result.is_ok() && pss_result.unwrap() {
            return Ok(true);
        }

        Ok(false)
    }

    async fn verify_ecdsa_signature(
        &self,
        hash: &[u8],
        signature: &[u8],
        public_key: &PublicKey,
        curve: EcdsaCurve,
    ) -> Result<bool> {
        match curve {
            EcdsaCurve::P256 => {
                let verifying_key = P256VerifyingKey::from_public_key_der(&public_key.der_data)
                    .map_err(|e| PdfSignError::SignatureValidation {
                        message: format!("Failed to parse ECDSA P-256 public key: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
                    })?;
                
                let signature = P256Signature::from_der(signature)
                    .map_err(|e| PdfSignError::SignatureValidation {
                        message: format!("Failed to parse ECDSA P-256 signature: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
                    })?;

                match verifying_key.verify(hash, &signature) {
                    Ok(()) => Ok(true),
                    Err(_) => Ok(false),
                }
            }
            EcdsaCurve::P384 => {
                let verifying_key = P384VerifyingKey::from_public_key_der(&public_key.der_data)
                    .map_err(|e| PdfSignError::SignatureValidation {
                        message: format!("Failed to parse ECDSA P-384 public key: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
                    })?;
                
                let signature = P384Signature::from_der(signature)
                    .map_err(|e| PdfSignError::SignatureValidation {
                        message: format!("Failed to parse ECDSA P-384 signature: {,
                code: crate::error::ErrorCode::SignatureValidation,}", e),
                    })?;

                match verifying_key.verify(hash, &signature) {
                    Ok(()) => Ok(true),
                    Err(_) => Ok(false),
                }
            }
            EcdsaCurve::P521 => {
                Err(PdfSignError::SignatureValidation {
                    message: "ECDSA P-521 signature verification not yet implemented".to_string(),
                code: crate::error::ErrorCode::SignatureValidation,
                ,
                code: crate::error::ErrorCode::SignatureValidation,})
            }
        }
    }
}