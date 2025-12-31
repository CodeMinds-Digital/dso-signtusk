//! Platform abstraction layer implementation

use crate::{
    error::{PdfSignError, Result},
    traits::{PlatformAbstraction, PlatformInfo},
    types::*,
};
use std::{
    fs,
    path::{Path, PathBuf},
};

#[cfg(target_os = "windows")]
use crate::platform::windows::{WindowsCertificateStore, WindowsCryptoProvider};

#[cfg(target_os = "macos")]
use crate::platform::macos::{MacOSKeychain, MacOSCryptoProvider};

#[cfg(target_os = "linux")]
use crate::platform::linux::{LinuxCertificateStore, LinuxCryptoProvider};

/// Platform abstraction implementation
pub struct PlatformAbstractionImpl {
    #[cfg(target_os = "windows")]
    cert_store: WindowsCertificateStore,
    #[cfg(target_os = "windows")]
    crypto_provider: WindowsCryptoProvider,
    
    #[cfg(target_os = "macos")]
    keychain: MacOSKeychain,
    #[cfg(target_os = "macos")]
    crypto_provider: MacOSCryptoProvider,
    
    #[cfg(target_os = "linux")]
    cert_store: LinuxCertificateStore,
    #[cfg(target_os = "linux")]
    crypto_provider: LinuxCryptoProvider,
}

impl PlatformAbstractionImpl {
    pub fn new() -> Self {
        Self {
            #[cfg(target_os = "windows")]
            cert_store: WindowsCertificateStore::new(),
            #[cfg(target_os = "windows")]
            crypto_provider: WindowsCryptoProvider::new(),
            
            #[cfg(target_os = "macos")]
            keychain: MacOSKeychain::new(),
            #[cfg(target_os = "macos")]
            crypto_provider: MacOSCryptoProvider::new(),
            
            #[cfg(target_os = "linux")]
            cert_store: LinuxCertificateStore::new(),
            #[cfg(target_os = "linux")]
            crypto_provider: LinuxCryptoProvider::new(),
        }
    }

    /// Get platform-specific file path separator
    pub fn get_path_separator(&self) -> &'static str {
        std::path::MAIN_SEPARATOR_STR
    }

    /// Create platform-appropriate temporary file
    pub fn create_temp_file(&self, prefix: &str, suffix: &str) -> Result<PathBuf> {
        let temp_dir = self.get_temp_directory()?;
        let filename = format!("{}{}{}", prefix, chrono::Utc::now().timestamp_nanos_opt().unwrap_or(0), suffix);
        Ok(temp_dir.join(filename))
    }

    /// Ensure directory exists with platform-appropriate permissions
    pub fn ensure_directory(&self, path: &Path) -> Result<()> {
        if !path.exists() {
            fs::create_dir_all(path).map_err(|e| PdfSignError::Platform {
                message: format!("Failed to create directory {,
                code: crate::error::ErrorCode::Platform,}: {}", path.display(), e),
                code: crate::error::ErrorCode::Platform,
            })?;
        }

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(path)
                .map_err(|e| PdfSignError::Platform {
                    message: format!("Failed to get directory permissions: {,
                code: crate::error::ErrorCode::Platform,}", e),
                    code: crate::error::ErrorCode::Platform,
                })?
                .permissions();
            perms.set_mode(0o700); // Owner read/write/execute only
            fs::set_permissions(path, perms).map_err(|e| PdfSignError::Platform {
                message: format!("Failed to set directory permissions: {,
                code: crate::error::ErrorCode::Platform,}", e),
                code: crate::error::ErrorCode::Platform,
            })?;
        }

        Ok(())
    }

    /// Get platform-specific certificate store paths
    pub fn get_certificate_store_paths(&self) -> Vec<PathBuf> {
        #[cfg(target_os = "windows")]
        {
            // Windows uses registry-based certificate stores
            vec![]
        }
        #[cfg(target_os = "macos")]
        {
            vec![
                PathBuf::from("/System/Library/Keychains/SystemRootCertificates.keychain"),
                PathBuf::from("/Library/Keychains/System.keychain"),
            ]
        }
        #[cfg(target_os = "linux")]
        {
            vec![
                PathBuf::from("/etc/ssl/certs"),
                PathBuf::from("/etc/pki/tls/certs"),
                PathBuf::from("/usr/share/ca-certificates"),
                PathBuf::from("/usr/local/share/ca-certificates"),
            ]
        }
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            vec![]
        }
    }

    /// Check if hardware security module is available
    pub fn has_hardware_security_module(&self) -> bool {
        #[cfg(target_os = "windows")]
        {
            self.crypto_provider.has_tpm() || self.crypto_provider.has_smart_card()
        }
        #[cfg(target_os = "macos")]
        {
            self.crypto_provider.has_secure_enclave() || self.crypto_provider.has_smart_card()
        }
        #[cfg(target_os = "linux")]
        {
            self.crypto_provider.has_pkcs11() || self.crypto_provider.has_tpm()
        }
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            false
        }
    }
}

impl Default for PlatformAbstractionImpl {
    fn default() -> Self {
        Self::new()
    }
}

impl PlatformAbstraction for PlatformAbstractionImpl {
    fn get_system_certificates(&self) -> Result<Vec<X509Certificate>> {
        #[cfg(target_os = "windows")]
        {
            self.cert_store.get_certificates()
        }
        #[cfg(target_os = "macos")]
        {
            self.keychain.get_certificates()
        }
        #[cfg(target_os = "linux")]
        {
            self.cert_store.get_certificates()
        }
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            Err(PdfSignError::Platform {
                message: "Unsupported platform for certificate store access".to_string(),
                code: crate::error::ErrorCode::Platform,
            ,
                code: crate::error::ErrorCode::Platform,})
        }
    }

    fn get_temp_directory(&self) -> Result<PathBuf> {
        let temp_dir = std::env::temp_dir();
        
        // Create platform-specific subdirectory for PDF signing operations
        let pdf_sign_temp = temp_dir.join("pdf-sign");
        self.ensure_directory(&pdf_sign_temp)?;
        
        pdf_sign_temp.canonicalize().map_err(|e| PdfSignError::Platform {
            message: format!("Failed to canonicalize temp directory: {,
                code: crate::error::ErrorCode::Platform,}", e),
            code: crate::error::ErrorCode::Platform,
        })
    }

    fn use_platform_crypto(&self) -> bool {
        #[cfg(target_os = "windows")]
        {
            self.crypto_provider.use_crypto_api() || self.crypto_provider.use_cng()
        }
        #[cfg(target_os = "macos")]
        {
            self.crypto_provider.use_security_framework() || self.crypto_provider.use_common_crypto()
        }
        #[cfg(target_os = "linux")]
        {
            // Prefer ring for consistency, but allow OpenSSL if specifically configured
            self.crypto_provider.use_system_openssl()
        }
        #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
        {
            false
        }
    }

    fn get_platform_info(&self) -> PlatformInfo {
        PlatformInfo {
            os: std::env::consts::OS.to_string(),
            arch: std::env::consts::ARCH.to_string(),
            has_hardware_crypto: self.has_hardware_security_module(),
            crypto_providers: self.get_crypto_providers(),
        }
    }
}

impl PlatformAbstractionImpl {
    fn get_crypto_providers(&self) -> Vec<String> {
        let mut providers = vec!["ring".to_string()];
        
        #[cfg(target_os = "windows")]
        {
            if self.crypto_provider.use_crypto_api() {
                providers.push("CryptoAPI".to_string());
            }
            if self.crypto_provider.use_cng() {
                providers.push("CNG".to_string());
            }
            if self.crypto_provider.has_tpm() {
                providers.push("TPM".to_string());
            }
        }
        
        #[cfg(target_os = "macos")]
        {
            if self.crypto_provider.use_security_framework() {
                providers.push("Security Framework".to_string());
            }
            if self.crypto_provider.use_common_crypto() {
                providers.push("CommonCrypto".to_string());
            }
            if self.crypto_provider.has_secure_enclave() {
                providers.push("Secure Enclave".to_string());
            }
        }
        
        #[cfg(target_os = "linux")]
        {
            if self.crypto_provider.has_openssl() {
                providers.push("OpenSSL".to_string());
            }
            if self.crypto_provider.has_pkcs11() {
                providers.push("PKCS#11".to_string());
            }
            if self.crypto_provider.has_tpm() {
                providers.push("TPM".to_string());
            }
        }
        
        providers
    }
}