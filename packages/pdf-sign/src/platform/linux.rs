//! Linux-specific implementations

#[cfg(target_os = "linux")]
use crate::{
    error::{PdfSignError, Result},
    types::*,
};
#[cfg(target_os = "linux")]
use std::{
    fs,
    path::{Path, PathBuf},
};

#[cfg(target_os = "linux")]
/// Linux certificate store integration
pub struct LinuxCertificateStore {
    cert_paths: Vec<PathBuf>,
    cert_files: Vec<PathBuf>,
}

#[cfg(target_os = "linux")]
impl LinuxCertificateStore {
    pub fn new() -> Self {
        Self {
            cert_paths: vec![
                PathBuf::from("/etc/ssl/certs"),
                PathBuf::from("/etc/pki/tls/certs"),
                PathBuf::from("/usr/share/ca-certificates"),
                PathBuf::from("/usr/local/share/ca-certificates"),
                PathBuf::from("/etc/ca-certificates"),
            ],
            cert_files: vec![
                PathBuf::from("/etc/ssl/ca-bundle.pem"),
                PathBuf::from("/etc/pki/tls/cert.pem"),
                PathBuf::from("/etc/ssl/certs/ca-certificates.crt"),
                PathBuf::from("/usr/share/ca-certificates/ca-bundle.crt"),
            ],
        }
    }

    /// Get certificates from system certificate directories
    pub fn get_certificates(&self) -> Result<Vec<X509Certificate>> {
        let mut certificates = Vec::new();
        
        // Load certificates from directories
        for cert_dir in &self.cert_paths {
            if cert_dir.exists() && cert_dir.is_dir() {
                certificates.extend(self.load_certificates_from_directory(cert_dir)?);
            }
        }
        
        // Load certificates from bundle files
        for cert_file in &self.cert_files {
            if cert_file.exists() && cert_file.is_file() {
                certificates.extend(self.load_certificates_from_file(cert_file)?);
            }
        }
        
        log::info!("Linux certificate store loaded {} certificates", certificates.len());
        Ok(certificates)
    }

    /// Get system root certificates
    pub fn get_root_certificates(&self) -> Result<Vec<X509Certificate>> {
        // Focus on root certificate bundles
        let mut certificates = Vec::new();
        
        for cert_file in &self.cert_files {
            if cert_file.exists() && cert_file.is_file() {
                certificates.extend(self.load_certificates_from_file(cert_file)?);
            }
        }
        
        log::info!("Linux root certificate store loaded {} certificates", certificates.len());
        Ok(certificates)
    }

    /// Add custom certificate path
    pub fn add_cert_path<P: AsRef<Path>>(&mut self, path: P) {
        let path_buf = path.as_ref().to_path_buf();
        if !self.cert_paths.contains(&path_buf) {
            self.cert_paths.push(path_buf);
        }
    }

    /// Add custom certificate file
    pub fn add_cert_file<P: AsRef<Path>>(&mut self, path: P) {
        let path_buf = path.as_ref().to_path_buf();
        if !self.cert_files.contains(&path_buf) {
            self.cert_files.push(path_buf);
        }
    }

    /// Load certificates from a directory
    fn load_certificates_from_directory(&self, dir: &Path) -> Result<Vec<X509Certificate>> {
        let mut certificates = Vec::new();
        
        let entries = fs::read_dir(dir).map_err(|e| PdfSignError::Platform {
            message: format!("Failed to read certificate directory {,
                code: crate::error::ErrorCode::Platform,}: {}", dir.display(), e),
        })?;
        
        for entry in entries {
            let entry = entry.map_err(|e| PdfSignError::Platform {
                message: format!("Failed to read directory entry: {,
                code: crate::error::ErrorCode::Platform,}", e),
            })?;
            
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension() {
                    if ext == "crt" || ext == "pem" || ext == "cer" {
                        if let Ok(certs) = self.load_certificates_from_file(&path) {
                            certificates.extend(certs);
                        }
                    }
                }
            }
        }
        
        Ok(certificates)
    }

    /// Load certificates from a PEM file
    fn load_certificates_from_file(&self, file: &Path) -> Result<Vec<X509Certificate>> {
        // For now, return empty vector as we need proper PEM parsing
        // In a real implementation, this would:
        // 1. Read the PEM file
        // 2. Parse PEM blocks
        // 3. Convert to X509Certificate structs
        
        log::debug!("Would load certificates from file: {}", file.display());
        Ok(vec![])
    }

    /// Get available certificate paths
    pub fn get_available_paths(&self) -> Vec<PathBuf> {
        self.cert_paths
            .iter()
            .chain(self.cert_files.iter())
            .filter(|path| path.exists())
            .cloned()
            .collect()
    }
}

#[cfg(target_os = "linux")]
impl Default for LinuxCertificateStore {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(target_os = "linux")]
/// Linux cryptographic provider
pub struct LinuxCryptoProvider {
    has_openssl: bool,
    has_pkcs11: bool,
    has_tpm: bool,
    openssl_version: Option<String>,
}

#[cfg(target_os = "linux")]
impl LinuxCryptoProvider {
    pub fn new() -> Self {
        Self {
            has_openssl: Self::detect_openssl(),
            has_pkcs11: Self::detect_pkcs11(),
            has_tpm: Self::detect_tpm(),
            openssl_version: Self::get_openssl_version(),
        }
    }

    /// Check if OpenSSL is available
    pub fn has_openssl(&self) -> bool {
        self.has_openssl
    }

    /// Use system OpenSSL for operations
    pub fn use_system_openssl(&self) -> bool {
        // Prefer ring for consistency, but allow OpenSSL if specifically needed
        false
    }

    /// Check if PKCS#11 is available
    pub fn has_pkcs11(&self) -> bool {
        self.has_pkcs11
    }

    /// Check if TPM is available
    pub fn has_tpm(&self) -> bool {
        self.has_tpm
    }

    /// Get OpenSSL version if available
    pub fn get_openssl_version(&self) -> Option<String> {
        self.openssl_version.clone()
    }

    /// Detect OpenSSL availability
    fn detect_openssl() -> bool {
        // Check if OpenSSL libraries are available
        std::process::Command::new("openssl")
            .arg("version")
            .output()
            .is_ok()
    }

    /// Get OpenSSL version string
    fn get_openssl_version() -> Option<String> {
        std::process::Command::new("openssl")
            .arg("version")
            .output()
            .ok()
            .and_then(|output| String::from_utf8(output.stdout).ok())
            .map(|s| s.trim().to_string())
    }

    /// Detect PKCS#11 availability
    fn detect_pkcs11() -> bool {
        // Check for common PKCS#11 libraries
        let pkcs11_paths = [
            "/usr/lib/pkcs11",
            "/usr/lib64/pkcs11",
            "/usr/local/lib/pkcs11",
        ];
        
        pkcs11_paths.iter().any(|path| Path::new(path).exists())
    }

    /// Detect TPM availability
    fn detect_tpm() -> bool {
        // Check for TPM device files
        Path::new("/dev/tpm0").exists() || Path::new("/dev/tpmrm0").exists()
    }

    /// Get preferred cryptographic provider
    pub fn get_preferred_provider(&self) -> String {
        if self.has_openssl && self.use_system_openssl() {
            format!("OpenSSL ({})", self.openssl_version.as_deref().unwrap_or("unknown"))
        } else {
            "ring".to_string()
        }
    }
}

#[cfg(target_os = "linux")]
impl Default for LinuxCryptoProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(target_os = "linux")]
/// Linux file handling utilities
pub struct LinuxFileHandler;

#[cfg(target_os = "linux")]
impl LinuxFileHandler {
    /// Create file with Linux-specific security attributes
    pub fn create_secure_file(path: &std::path::Path) -> Result<std::fs::File> {
        use std::{fs::OpenOptions, os::unix::fs::OpenOptionsExt};
        
        // Create file with restricted permissions (owner only)
        OpenOptions::new()
            .create(true)
            .write(true)
            .truncate(true)
            .mode(0o600) // Owner read/write only
            .open(path)
            .map_err(|e| PdfSignError::Platform {
                message: format!("Failed to create secure file: {,
                code: crate::error::ErrorCode::Platform,}", e),
            })
    }

    /// Get Linux-specific temporary directory
    pub fn get_linux_temp_dir() -> Result<std::path::PathBuf> {
        std::env::var("TMPDIR")
            .or_else(|_| std::env::var("TMP"))
            .map(std::path::PathBuf::from)
            .or_else(|_| Ok(std::path::PathBuf::from("/tmp")))
            .map_err(|e: std::convert::Infallible| PdfSignError::Platform {
                message: format!("Could not determine Linux temporary directory: {:?,
                code: crate::error::ErrorCode::Platform,}", e),
            })
    }

    /// Check if running in a container
    pub fn is_container() -> bool {
        Path::new("/.dockerenv").exists() || 
        std::env::var("container").is_ok() ||
        fs::read_to_string("/proc/1/cgroup")
            .map(|content| content.contains("docker") || content.contains("lxc"))
            .unwrap_or(false)
    }
}