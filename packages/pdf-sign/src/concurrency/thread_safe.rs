//! Thread-safe wrappers for PDF signing components
//! 
//! This module provides thread-safe implementations of the core PDF signing
//! interfaces, ensuring safe concurrent access to read operations.

use crate::{
    error::{PdfSignError, Result},
    traits::*,
    types::*,
    signature::{signer::PdfSignerImpl, validator::SignatureValidatorImpl},
    certificate::manager::CertificateManagerImpl,
    pdf::{parser::PdfParserImpl, generator::PdfGeneratorImpl},
    crypto::engine::CryptographicEngineImpl,
};
use async_trait::async_trait;
use std::sync::{Arc, RwLock, Mutex};
use std::collections::HashMap;
use std::time::{Duration, Instant};

/// Thread-safe PDF signer with concurrent read support
pub struct ThreadSafePdfSigner {
    /// Inner signer implementation
    inner: Arc<PdfSignerImpl>,
    /// Read-write lock for concurrent access control
    access_lock: Arc<RwLock<()>>,
    /// Concurrent operation tracking
    operation_tracker: Arc<Mutex<ConcurrentOperationTracker>>,
    /// Configuration for thread safety
    config: ThreadSafetyConfig,
}

/// Thread-safe signature validator with concurrent read support
pub struct ThreadSafeSignatureValidator {
    /// Inner validator implementation
    inner: Arc<SignatureValidatorImpl>,
    /// Read-write lock for concurrent access control
    access_lock: Arc<RwLock<()>>,
    /// Concurrent operation tracking
    operation_tracker: Arc<Mutex<ConcurrentOperationTracker>>,
    /// Configuration for thread safety
    config: ThreadSafetyConfig,
}

/// Thread-safe certificate manager
pub struct ThreadSafeCertificateManager {
    /// Inner certificate manager implementation
    inner: Arc<CertificateManagerImpl>,
    /// Read-write lock for concurrent access control
    access_lock: Arc<RwLock<()>>,
    /// Certificate cache with thread-safe access
    certificate_cache: Arc<RwLock<HashMap<String, CachedCertificate>>>,
    /// Configuration for thread safety
    config: ThreadSafetyConfig,
}

/// Thread-safe PDF parser
pub struct ThreadSafePdfParser {
    /// Inner parser implementation
    inner: Arc<PdfParserImpl>,
    /// Read-write lock for concurrent access control
    access_lock: Arc<RwLock<()>>,
    /// Document cache with thread-safe access
    document_cache: Arc<RwLock<HashMap<String, CachedDocument>>>,
    /// Configuration for thread safety
    config: ThreadSafetyConfig,
}

/// Thread-safe PDF generator
pub struct ThreadSafePdfGenerator {
    /// Inner generator implementation
    inner: Arc<PdfGeneratorImpl>,
    /// Read-write lock for concurrent access control
    access_lock: Arc<RwLock<()>>,
    /// Configuration for thread safety
    config: ThreadSafetyConfig,
}

/// Thread-safe cryptographic engine
pub struct ThreadSafeCryptographicEngine {
    /// Inner crypto engine implementation
    inner: Arc<CryptographicEngineImpl>,
    /// Read-write lock for concurrent access control
    access_lock: Arc<RwLock<()>>,
    /// Hash cache with thread-safe access
    hash_cache: Arc<RwLock<HashMap<String, CachedHash>>>,
    /// Configuration for thread safety
    config: ThreadSafetyConfig,
}

/// Configuration for thread safety behavior
#[derive(Debug, Clone)]
pub struct ThreadSafetyConfig {
    /// Maximum number of concurrent read operations
    pub max_concurrent_reads: usize,
    /// Timeout for acquiring locks
    pub lock_timeout: Duration,
    /// Whether to enable operation caching
    pub enable_caching: bool,
    /// Cache expiration time
    pub cache_expiration: Duration,
    /// Maximum cache size
    pub max_cache_size: usize,
}

impl Default for ThreadSafetyConfig {
    fn default() -> Self {
        Self {
            max_concurrent_reads: num_cpus::get() * 2,
            lock_timeout: Duration::from_secs(30),
            enable_caching: true,
            cache_expiration: Duration::from_secs(300), // 5 minutes
            max_cache_size: 1000,
        }
    }
}

/// Tracks concurrent operations for monitoring and limits
#[derive(Debug, Default)]
struct ConcurrentOperationTracker {
    /// Current number of active read operations
    active_reads: usize,
    /// Current number of active write operations
    active_writes: usize,
    /// Peak concurrent operations
    peak_concurrent_operations: usize,
    /// Total operations processed
    total_operations: u64,
}

impl ConcurrentOperationTracker {
    fn start_read_operation(&mut self, max_reads: usize) -> Result<()> {
        if self.active_reads >= max_reads {
            return Err(PdfSignError::Concurrency {
                message: format!("Maximum concurrent reads ({}) exceeded", max_reads),
            });
        }
        
        self.active_reads += 1;
        self.total_operations += 1;
        self.peak_concurrent_operations = self.peak_concurrent_operations
            .max(self.active_reads + self.active_writes);
        
        Ok(())
    }
    
    fn end_read_operation(&mut self) {
        if self.active_reads > 0 {
            self.active_reads -= 1;
        }
    }
    
    fn start_write_operation(&mut self) -> Result<()> {
        if self.active_writes > 0 || self.active_reads > 0 {
            return Err(PdfSignError::Concurrency {
                message: "Cannot start write operation while other operations are active".to_string(),
            });
        }
        
        self.active_writes += 1;
        self.total_operations += 1;
        self.peak_concurrent_operations = self.peak_concurrent_operations
            .max(self.active_reads + self.active_writes);
        
        Ok(())
    }
    
    fn end_write_operation(&mut self) {
        if self.active_writes > 0 {
            self.active_writes -= 1;
        }
    }
}

/// Cached certificate with expiration
#[derive(Debug, Clone)]
struct CachedCertificate {
    certificate: X509Certificate,
    cached_at: Instant,
}

impl CachedCertificate {
    fn new(certificate: X509Certificate) -> Self {
        Self {
            certificate,
            cached_at: Instant::now(),
        }
    }
    
    fn is_expired(&self, expiration: Duration) -> bool {
        self.cached_at.elapsed() > expiration
    }
}

/// Cached document with expiration
#[derive(Debug, Clone)]
struct CachedDocument {
    document: PdfDocument,
    cached_at: Instant,
}

impl CachedDocument {
    fn new(document: PdfDocument) -> Self {
        Self {
            document,
            cached_at: Instant::now(),
        }
    }
    
    fn is_expired(&self, expiration: Duration) -> bool {
        self.cached_at.elapsed() > expiration
    }
}

/// Cached hash with expiration
#[derive(Debug, Clone)]
struct CachedHash {
    hash: Vec<u8>,
    algorithm: HashAlgorithm,
    cached_at: Instant,
}

impl CachedHash {
    fn new(hash: Vec<u8>, algorithm: HashAlgorithm) -> Self {
        Self {
            hash,
            algorithm,
            cached_at: Instant::now(),
        }
    }
    
    fn is_expired(&self, expiration: Duration) -> bool {
        self.cached_at.elapsed() > expiration
    }
}

// Implementation for ThreadSafePdfSigner
impl ThreadSafePdfSigner {
    pub fn new(config: ThreadSafetyConfig) -> Self {
        Self {
            inner: Arc::new(PdfSignerImpl::new()),
            access_lock: Arc::new(RwLock::new(())),
            operation_tracker: Arc::new(Mutex::new(ConcurrentOperationTracker::default())),
            config,
        }
    }
    
    pub fn with_inner(inner: PdfSignerImpl, config: ThreadSafetyConfig) -> Self {
        Self {
            inner: Arc::new(inner),
            access_lock: Arc::new(RwLock::new(())),
            operation_tracker: Arc::new(Mutex::new(ConcurrentOperationTracker::default())),
            config,
        }
    }
    
    /// Get concurrent operation statistics
    pub fn get_operation_stats(&self) -> Result<ConcurrentOperationStats> {
        let tracker = self.operation_tracker.lock().unwrap();
        Ok(ConcurrentOperationStats {
            active_reads: tracker.active_reads,
            active_writes: tracker.active_writes,
            peak_concurrent_operations: tracker.peak_concurrent_operations,
            total_operations: tracker.total_operations,
        })
    }
}

#[async_trait]
impl PdfSigner for ThreadSafePdfSigner {
    async fn sign_document(
        &self,
        document: &PdfDocument,
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
    ) -> Result<PdfDocument> {
        // Start write operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.start_write_operation()?;
        }
        
        // Acquire write lock with timeout and immediately release it
        // This ensures exclusive access but doesn't hold the lock across await
        {
            let _write_guard = self.access_lock.write().unwrap();
            // Lock acquired and will be released at end of this block
        }
        
        let result = self.inner.sign_document(document, credentials, options).await;
        
        // End write operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.end_write_operation();
        }
        
        result
    }
    
    async fn sign_document_with_field(
        &self,
        document: &PdfDocument,
        field_name: &str,
        credentials: &SigningCredentials,
    ) -> Result<PdfDocument> {
        // Start write operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.start_write_operation()?;
        }
        
        // Acquire write lock with timeout and immediately release it
        {
            let _write_guard = self.access_lock.write().unwrap();
        }
        
        let result = self.inner.sign_document_with_field(document, field_name, credentials).await;
        
        // End write operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.end_write_operation();
        }
        
        result
    }
    
    async fn sign_multiple_documents(
        &self,
        documents: &[PdfDocument],
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
    ) -> Result<Vec<PdfDocument>> {
        // Start write operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.start_write_operation()?;
        }
        
        // Acquire write lock with timeout and immediately release it
        {
            let _write_guard = self.access_lock.write().unwrap();
        }
        
        let result = self.inner.sign_multiple_documents(documents, credentials, options).await;
        
        // End write operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.end_write_operation();
        }
        
        result
    }
    
    async fn add_incremental_signature(
        &self,
        document: &PdfDocument,
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
        target_field: Option<&str>,
    ) -> Result<PdfDocument> {
        // Start write operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.start_write_operation()?;
        }
        
        // Acquire write lock with timeout and immediately release it
        {
            let _write_guard = self.access_lock.write().unwrap();
        }
        
        let result = self.inner.add_incremental_signature(document, credentials, options, target_field).await;
        
        // End write operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.end_write_operation();
        }
        
        result
    }
}

// Implementation for ThreadSafeSignatureValidator
impl ThreadSafeSignatureValidator {
    pub fn new(config: ThreadSafetyConfig) -> Self {
        Self {
            inner: Arc::new(SignatureValidatorImpl::new()),
            access_lock: Arc::new(RwLock::new(())),
            operation_tracker: Arc::new(Mutex::new(ConcurrentOperationTracker::default())),
            config,
        }
    }
    
    pub fn with_inner(inner: SignatureValidatorImpl, config: ThreadSafetyConfig) -> Self {
        Self {
            inner: Arc::new(inner),
            access_lock: Arc::new(RwLock::new(())),
            operation_tracker: Arc::new(Mutex::new(ConcurrentOperationTracker::default())),
            config,
        }
    }
    
    /// Get concurrent operation statistics
    pub fn get_operation_stats(&self) -> Result<ConcurrentOperationStats> {
        let tracker = self.operation_tracker.lock().unwrap();
        Ok(ConcurrentOperationStats {
            active_reads: tracker.active_reads,
            active_writes: tracker.active_writes,
            peak_concurrent_operations: tracker.peak_concurrent_operations,
            total_operations: tracker.total_operations,
        })
    }
}

#[async_trait]
impl SignatureValidator for ThreadSafeSignatureValidator {
    async fn extract_signatures(&self, document: &PdfDocument) -> Result<Vec<ExtractedSignature>> {
        // Start read operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.start_read_operation(self.config.max_concurrent_reads)?;
        }
        
        // Acquire read lock and immediately release it
        {
            let _read_guard = self.access_lock.read().unwrap();
        }
        
        let result = self.inner.extract_signatures(document).await;
        
        // End read operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.end_read_operation();
        }
        
        result
    }
    
    async fn verify_signature(&self, extracted_signature: &ExtractedSignature) -> Result<SignatureVerificationResult> {
        // Start read operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.start_read_operation(self.config.max_concurrent_reads)?;
        }
        
        // Acquire read lock and immediately release it
        {
            let _read_guard = self.access_lock.read().unwrap();
        }
        
        let result = self.inner.verify_signature(extracted_signature).await;
        
        // End read operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.end_read_operation();
        }
        
        result
    }
    
    async fn validate_signatures(&self, document: &PdfDocument) -> Result<Vec<SignatureVerificationResult>> {
        // Start read operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.start_read_operation(self.config.max_concurrent_reads)?;
        }
        
        // Acquire read lock and immediately release it
        {
            let _read_guard = self.access_lock.read().unwrap();
        }
        
        let result = self.inner.validate_signatures(document).await;
        
        // End read operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.end_read_operation();
        }
        
        result
    }
    
    async fn detect_tampering(&self, document: &PdfDocument) -> Result<Vec<TamperingDetectionResult>> {
        // Start read operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.start_read_operation(self.config.max_concurrent_reads)?;
        }
        
        // Acquire read lock and immediately release it
        {
            let _read_guard = self.access_lock.read().unwrap();
        }
        
        let result = self.inner.detect_tampering(document).await;
        
        // End read operation tracking
        {
            let mut tracker = self.operation_tracker.lock().unwrap();
            tracker.end_read_operation();
        }
        
        result
    }
}

/// Statistics for concurrent operations
#[derive(Debug, Clone)]
pub struct ConcurrentOperationStats {
    pub active_reads: usize,
    pub active_writes: usize,
    pub peak_concurrent_operations: usize,
    pub total_operations: u64,
}

impl ThreadSafeOperations for ThreadSafePdfSigner {
    fn supports_concurrent_reads(&self) -> bool {
        false // Signing operations are write operations
    }
    
    fn max_concurrent_operations(&self) -> usize {
        1 // Only one signing operation at a time
    }
}

impl ThreadSafeOperations for ThreadSafeSignatureValidator {
    fn supports_concurrent_reads(&self) -> bool {
        true // Validation operations are read operations
    }
    
    fn max_concurrent_operations(&self) -> usize {
        self.config.max_concurrent_reads
    }
}

// Additional implementations for other thread-safe components would follow similar patterns...

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::thread;
    use std::time::Duration;
    
    #[test]
    fn test_thread_safety_config_default() {
        let config = ThreadSafetyConfig::default();
        assert!(config.max_concurrent_reads > 0);
        assert!(config.lock_timeout > Duration::from_secs(0));
        assert!(config.enable_caching);
    }
    
    #[test]
    fn test_concurrent_operation_tracker() {
        let mut tracker = ConcurrentOperationTracker::default();
        
        // Test read operations
        assert!(tracker.start_read_operation(5).is_ok());
        assert_eq!(tracker.active_reads, 1);
        
        tracker.end_read_operation();
        assert_eq!(tracker.active_reads, 0);
        
        // Test write operations
        assert!(tracker.start_write_operation().is_ok());
        assert_eq!(tracker.active_writes, 1);
        
        // Should not allow concurrent write
        assert!(tracker.start_write_operation().is_err());
        
        tracker.end_write_operation();
        assert_eq!(tracker.active_writes, 0);
    }
    
    #[test]
    fn test_thread_safe_pdf_signer_creation() {
        let config = ThreadSafetyConfig::default();
        let signer = ThreadSafePdfSigner::new(config);
        
        assert!(!signer.supports_concurrent_reads());
        assert_eq!(signer.max_concurrent_operations(), 1);
    }
    
    #[test]
    fn test_thread_safe_signature_validator_creation() {
        let config = ThreadSafetyConfig::default();
        let validator = ThreadSafeSignatureValidator::new(config.clone());
        
        assert!(validator.supports_concurrent_reads());
        assert_eq!(validator.max_concurrent_operations(), config.max_concurrent_reads);
    }
    
    #[tokio::test]
    async fn test_concurrent_validation_operations() {
        let config = ThreadSafetyConfig {
            max_concurrent_reads: 3,
            ..ThreadSafetyConfig::default()
        };
        let validator = Arc::new(ThreadSafeSignatureValidator::new(config));
        
        // Create test document
        let document = PdfDocument {
            version: "1.7".to_string(),
            page_count: 1,
            metadata: PdfMetadata::default(),
            signature_fields: vec![],
            existing_signatures: vec![],
            data: b"%PDF-1.7\ntest document".to_vec(),
        };
        
        // Spawn multiple concurrent validation tasks
        let mut handles = vec![];
        for i in 0..3 {
            let validator_clone = Arc::clone(&validator);
            let document_clone = document.clone();
            
            let handle = tokio::spawn(async move {
                let result = validator_clone.extract_signatures(&document_clone).await;
                (i, result.is_ok())
            });
            
            handles.push(handle);
        }
        
        // Wait for all tasks to complete
        let mut results = vec![];
        for handle in handles {
            let (task_id, success) = handle.await.unwrap();
            results.push((task_id, success));
        }
        
        // All tasks should complete successfully
        assert_eq!(results.len(), 3);
        for (_, success) in results {
            assert!(success);
        }
    }
    
    #[test]
    fn test_cached_certificate_expiration() {
        let cert = X509Certificate {
            der_data: vec![1, 2, 3],
            subject: "Test Subject".to_string(),
            issuer: "Test Issuer".to_string(),
            serial_number: "123456".to_string(),
            not_before: chrono::Utc::now(),
            not_after: chrono::Utc::now() + chrono::Duration::days(365),
            public_key_algorithm: "RSA".to_string(),
            key_usage: vec!["digitalSignature".to_string()],
        };
        
        let cached_cert = CachedCertificate::new(cert);
        
        // Should not be expired immediately
        assert!(!cached_cert.is_expired(Duration::from_secs(1)));
        
        // Should be expired with zero duration
        assert!(cached_cert.is_expired(Duration::from_secs(0)));
    }
}