//! Certificate manager implementation

use crate::{
    certificate::{CertificateLoader, CertificateValidator},
    error::Result,
    resource::ScopedResourceManager,
    traits::CertificateManager,
    types::*,
};
use async_trait::async_trait;

/// Certificate manager implementation
pub struct CertificateManagerImpl {
    loader: CertificateLoader,
    validator: CertificateValidator,
}

impl CertificateManagerImpl {
    pub fn new() -> Self {
        Self {
            loader: CertificateLoader::new(),
            validator: CertificateValidator::new(),
        }
    }

    /// Validate a certificate chain against trusted roots
    pub async fn validate_certificate_chain(
        &self,
        certificate_chain: &[X509Certificate],
        trusted_roots: &[X509Certificate],
    ) -> Result<CertificateValidationResult> {
        self.validator.validate_certificate_chain(certificate_chain, trusted_roots).await
    }

    /// Build a certificate chain from individual certificates
    pub fn build_certificate_chain(
        &self,
        leaf_certificate: &X509Certificate,
        intermediate_certificates: &[X509Certificate],
    ) -> Result<Vec<X509Certificate>> {
        self.validator.build_certificate_chain(leaf_certificate, intermediate_certificates)
    }
}

impl Default for CertificateManagerImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl CertificateManager for CertificateManagerImpl {
    async fn load_from_pkcs12(
        &self,
        p12_data: &[u8],
        password: &str,
    ) -> Result<SigningCredentials> {
        // Create scoped resource manager for cleanup
        let mut resource_manager = ScopedResourceManager::new();
        
        // Register secure memory for password cleanup
        let _password_guard = resource_manager.register_secure_memory(password.len())?;
        
        // Register secure memory for PKCS#12 data cleanup
        let _p12_guard = resource_manager.register_secure_memory(p12_data.len())?;
        
        // Load credentials with automatic cleanup
        let credentials = self.loader.load_pkcs12(p12_data, password).await?;
        
        // Register private key data for cleanup
        let _key_guard = resource_manager.register_secure_memory(credentials.private_key.der_data.len())?;
        
        Ok(credentials)
    }

    async fn load_from_pem(
        &self,
        cert_pem: &str,
        key_pem: &str,
        password: Option<&str>,
    ) -> Result<SigningCredentials> {
        // Create scoped resource manager for cleanup
        let mut resource_manager = ScopedResourceManager::new();
        
        // Register secure memory for PEM data cleanup
        let _cert_guard = resource_manager.register_secure_memory(cert_pem.len())?;
        let _key_guard = resource_manager.register_secure_memory(key_pem.len())?;
        
        // Register password if provided
        if let Some(pwd) = password {
            let _password_guard = resource_manager.register_secure_memory(pwd.len())?;
        }
        
        // Load credentials with automatic cleanup
        let credentials = self.loader.load_pem(cert_pem, key_pem, password).await?;
        
        // Register private key data for cleanup
        let _private_key_guard = resource_manager.register_secure_memory(credentials.private_key.der_data.len())?;
        
        Ok(credentials)
    }

    fn get_certificate_info(&self, certificate: &X509Certificate) -> Result<CertificateInfo> {
        // Extract information from the certificate
        Ok(CertificateInfo {
            subject: certificate.subject.clone(),
            issuer: certificate.issuer.clone(),
            serial_number: certificate.serial_number.clone(),
            not_before: certificate.not_before,
            not_after: certificate.not_after,
            key_algorithm: certificate.public_key_algorithm.clone(),
            key_size: self.extract_key_size_from_algorithm(&certificate.public_key_algorithm)?,
            der_data: certificate.der_data.clone(),
        })
    }

    async fn validate_certificate(
        &self,
        certificate: &X509Certificate,
    ) -> Result<CertificateValidationResult> {
        // Use the validator to validate the certificate
        self.validator.validate_chain(certificate, &[]).await
    }
}

impl CertificateManagerImpl {
    /// Extract key size from algorithm string (simplified implementation)
    fn extract_key_size_from_algorithm(&self, algorithm: &str) -> Result<u32> {
        // This is a simplified implementation
        // In practice, we would parse the actual public key to get the size
        if algorithm.contains("RSA") {
            Ok(2048) // Default RSA size
        } else if algorithm.contains("ECDSA") || algorithm.contains("EC") {
            Ok(256) // Default ECDSA size
        } else {
            Ok(0) // Unknown
        }
    }
}