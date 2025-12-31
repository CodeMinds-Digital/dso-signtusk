//! Optimized cryptographic engine with context reuse and batch processing
//! 
//! This module provides an enhanced cryptographic engine that uses context pooling
//! and batch processing for improved performance.

use crate::{
    error::{PdfSignError, Result},
    traits::CryptographicEngine,
    types::*,
    performance::{
        context_pool::{CryptoContextPool, ContextPoolConfig, get_global_context_pool},
        batch_processor::{BatchProcessor, BatchConfig, BatchOperation, BatchOperationResult},
    },
};
use async_trait::async_trait;
use sha2::{Sha256, Sha384, Sha512, Digest};
use std::sync::Arc;
use std::collections::HashMap;

/// Optimized cryptographic engine with context reuse
pub struct OptimizedCryptographicEngine {
    /// Context pool for reusing cryptographic contexts
    context_pool: Arc<CryptoContextPool>,
    /// Batch processor for efficient batch operations
    batch_processor: Arc<BatchProcessor>,
    /// Configuration for optimization features
    config: OptimizationConfig,
    /// Cache for frequently used operations
    operation_cache: Arc<std::sync::RwLock<HashMap<String, CachedResult>>>,
}

/// Configuration for cryptographic optimizations
#[derive(Debug, Clone)]
pub struct OptimizationConfig {
    /// Whether to enable context pooling
    pub enable_context_pooling: bool,
    /// Whether to enable batch processing
    pub enable_batch_processing: bool,
    /// Whether to enable operation caching
    pub enable_operation_caching: bool,
    /// Maximum cache size for operations
    pub max_cache_size: usize,
    /// Cache TTL in seconds
    pub cache_ttl_seconds: u64,
}

impl Default for OptimizationConfig {
    fn default() -> Self {
        Self {
            enable_context_pooling: true,
            enable_batch_processing: true,
            enable_operation_caching: true,
            max_cache_size: 1000,
            cache_ttl_seconds: 300, // 5 minutes
        }
    }
}

/// Cached operation result
#[derive(Debug, Clone)]
struct CachedResult {
    data: Vec<u8>,
    timestamp: std::time::Instant,
    ttl: std::time::Duration,
}

impl CachedResult {
    fn new(data: Vec<u8>, ttl_seconds: u64) -> Self {
        Self {
            data,
            timestamp: std::time::Instant::now(),
            ttl: std::time::Duration::from_secs(ttl_seconds),
        }
    }
    
    fn is_expired(&self) -> bool {
        self.timestamp.elapsed() > self.ttl
    }
}

impl OptimizedCryptographicEngine {
    pub fn new(config: OptimizationConfig) -> Self {
        let context_pool_config = ContextPoolConfig {
            enable_reuse: config.enable_context_pooling,
            ..Default::default()
        };
        
        let batch_config = BatchConfig {
            use_context_pooling: config.enable_context_pooling,
            context_pool_config: context_pool_config.clone(),
            ..Default::default()
        };
        
        Self {
            context_pool: Arc::new(CryptoContextPool::new(context_pool_config)),
            batch_processor: Arc::new(BatchProcessor::new(batch_config)),
            config,
            operation_cache: Arc::new(std::sync::RwLock::new(HashMap::new())),
        }
    }
    
    /// Create with global context pool
    pub fn with_global_pool(config: OptimizationConfig) -> Self {
        let global_pool = get_global_context_pool();
        
        let batch_config = BatchConfig {
            use_context_pooling: config.enable_context_pooling,
            ..Default::default()
        };
        
        Self {
            context_pool: Arc::new(CryptoContextPool::new(ContextPoolConfig::default())),
            batch_processor: Arc::new(BatchProcessor::new(batch_config)),
            config,
            operation_cache: Arc::new(std::sync::RwLock::new(HashMap::new())),
        }
    }
    
    /// Calculate hash with context reuse
    async fn calculate_hash_with_context(
        &self,
        data: &[u8],
        algorithm: &HashAlgorithm,
    ) -> Result<Vec<u8>> {
        if self.config.enable_context_pooling {
            // Use context pool for optimized hash calculation
            let context = self.context_pool.get_context(
                algorithm.clone(),
                SignatureAlgorithm::RsaPkcs1Sha256, // Default signature algorithm
            )?;
            
            let hash = self.calculate_hash_internal(data, algorithm)?;
            
            // Release context back to pool
            self.context_pool.release_context(&context.id)?;
            
            Ok(hash)
        } else {
            // Direct calculation without context pooling
            self.calculate_hash_internal(data, algorithm)
        }
    }
    
    /// Internal hash calculation implementation
    fn calculate_hash_internal(&self, data: &[u8], algorithm: &HashAlgorithm) -> Result<Vec<u8>> {
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
    
    /// Calculate hash with caching
    async fn calculate_hash_with_cache(
        &self,
        data: &[u8],
        algorithm: &HashAlgorithm,
    ) -> Result<Vec<u8>> {
        if !self.config.enable_operation_caching {
            return self.calculate_hash_with_context(data, algorithm).await;
        }
        
        // Generate cache key
        let cache_key = self.generate_cache_key(data, algorithm);
        
        // Check cache first
        {
            let cache = self.operation_cache.read().unwrap();
            if let Some(cached_result) = cache.get(&cache_key) {
                if !cached_result.is_expired() {
                    return Ok(cached_result.data.clone());
                }
            }
        }
        
        // Calculate hash
        let hash = self.calculate_hash_with_context(data, algorithm).await?;
        
        // Store in cache
        {
            let mut cache = self.operation_cache.write().unwrap();
            
            // Clean up expired entries if cache is full
            if cache.len() >= self.config.max_cache_size {
                cache.retain(|_, v| !v.is_expired());
                
                // If still full, remove oldest entries
                if cache.len() >= self.config.max_cache_size {
                    let keys_to_remove: Vec<String> = cache.keys()
                        .take(cache.len() - self.config.max_cache_size + 1)
                        .cloned()
                        .collect();
                    
                    for key in keys_to_remove {
                        cache.remove(&key);
                    }
                }
            }
            
            cache.insert(
                cache_key,
                CachedResult::new(hash.clone(), self.config.cache_ttl_seconds),
            );
        }
        
        Ok(hash)
    }
    
    /// Generate cache key for operation
    fn generate_cache_key(&self, data: &[u8], algorithm: &HashAlgorithm) -> String {
        use sha2::Digest;
        
        let mut hasher = Sha256::new();
        hasher.update(data);
        hasher.update(format!("{:?}", algorithm).as_bytes());
        
        let hash = hasher.finalize();
        hex::encode(hash)
    }
    
    /// Batch hash calculation for multiple documents
    pub async fn batch_calculate_hashes(
        &self,
        documents: Vec<PdfDocument>,
        algorithm: HashAlgorithm,
    ) -> Result<Vec<Result<Vec<u8>>>> {
        if !self.config.enable_batch_processing {
            // Process individually
            let mut results = Vec::new();
            for document in documents {
                let result = self.calculate_hash_with_cache(&document.data, &algorithm).await;
                results.push(result);
            }
            return Ok(results);
        }
        
        // Use batch processor
        for document in documents {
            let operation = BatchOperation::Hash {
                document,
                algorithm: algorithm.clone(),
            };
            self.batch_processor.add_operation(operation)?;
        }
        
        let batch_results = self.batch_processor.process_batch()?;
        
        // Convert batch results to hash results
        let mut results = Vec::new();
        for batch_result in batch_results {
            match batch_result {
                BatchOperationResult::Hash { success, hash, error } => {
                    if success {
                        if let Some(hash_data) = hash {
                            results.push(Ok(hash_data));
                        } else {
                            results.push(Err(PdfSignError::HashCalculation {
                                message: "Hash calculation succeeded but no data returned".to_string(),
                code: crate::error::ErrorCode::HashCalculation,
                            ,
                code: crate::error::ErrorCode::HashCalculation,}));
                        }
                    } else {
                        let error_msg = error.unwrap_or_else(|| "Unknown hash calculation error".to_string());
                        results.push(Err(PdfSignError::HashCalculation {
                            message: error_msg,
                code: crate::error::ErrorCode::HashCalculation,
                        ,
                code: crate::error::ErrorCode::HashCalculation,}));
                    }
                }
                _ => {
                    results.push(Err(PdfSignError::HashCalculation {
                        message: "Unexpected batch result type".to_string(),
                code: crate::error::ErrorCode::HashCalculation,
                    ,
                code: crate::error::ErrorCode::HashCalculation,}));
                }
            }
        }
        
        Ok(results)
    }
    
    /// Get optimization statistics
    pub fn get_optimization_stats(&self) -> OptimizationStats {
        let context_stats = self.context_pool.get_statistics();
        let batch_stats = self.batch_processor.get_statistics();
        let cache_size = self.operation_cache.read().unwrap().len();
        
        OptimizationStats {
            context_pool_stats: context_stats,
            batch_processing_stats: batch_stats,
            cache_size,
            cache_hit_rate: 0.0, // TODO: Implement cache hit rate tracking
        }
    }
    
    /// Clear all caches and reset pools
    pub async fn clear_caches(&self) -> Result<()> {
        // Clear operation cache
        {
            let mut cache = self.operation_cache.write().unwrap();
            cache.clear();
        }
        
        // Clear context pool
        self.context_pool.clear()?;
        
        // Clear batch processor queue
        self.batch_processor.clear_queue()?;
        
        Ok(())
    }
    
    /// Cleanup expired cache entries
    pub fn cleanup_cache(&self) -> usize {
        let mut cache = self.operation_cache.write().unwrap();
        let initial_size = cache.len();
        cache.retain(|_, v| !v.is_expired());
        initial_size - cache.len()
    }
}

/// Optimization statistics
#[derive(Debug, Clone)]
pub struct OptimizationStats {
    pub context_pool_stats: crate::performance::context_pool::PoolStatistics,
    pub batch_processing_stats: crate::performance::batch_processor::BatchStatistics,
    pub cache_size: usize,
    pub cache_hit_rate: f64,
}

#[async_trait]
impl CryptographicEngine for OptimizedCryptographicEngine {
    async fn compute_document_hash(
        &self,
        document: &PdfDocument,
        algorithm: &HashAlgorithm,
    ) -> Result<Vec<u8>> {
        // Extract signature field ranges that should be excluded from hash
        let exclude_ranges = self.extract_signature_field_ranges(document)?;
        
        // Filter document data to exclude signature contents
        let filtered_data = self.filter_document_data(&document.data, &exclude_ranges)?;
        
        // Calculate hash with optimizations
        self.calculate_hash_with_cache(&filtered_data, algorithm).await
    }
    
    async fn compute_hash(&self, data: &[u8], algorithm: &HashAlgorithm) -> Result<Vec<u8>> {
        self.calculate_hash_with_cache(data, algorithm).await
    }
    
    async fn create_signature(
        &self,
        hash: &[u8],
        private_key: &PrivateKey,
        algorithm: &SignatureAlgorithm,
    ) -> Result<Vec<u8>> {
        // Use context pooling for signature creation
        if self.config.enable_context_pooling {
            let hash_alg = match algorithm {
                SignatureAlgorithm::RsaPkcs1Sha256 => HashAlgorithm::Sha256,
                SignatureAlgorithm::RsaPkcs1Sha384 => HashAlgorithm::Sha384,
                SignatureAlgorithm::RsaPkcs1Sha512 => HashAlgorithm::Sha512,
                SignatureAlgorithm::EcdsaP256Sha256 => HashAlgorithm::Sha256,
                SignatureAlgorithm::EcdsaP384Sha384 => HashAlgorithm::Sha384,
                SignatureAlgorithm::EcdsaP521Sha512 => HashAlgorithm::Sha512,
                _ => HashAlgorithm::Sha256,
            };
            
            let context = self.context_pool.get_context(hash_alg, algorithm.clone())?;
            
            let signature = self.create_signature_internal(hash, private_key, algorithm).await?;
            
            self.context_pool.release_context(&context.id)?;
            
            Ok(signature)
        } else {
            self.create_signature_internal(hash, private_key, algorithm).await
        }
    }
    
    async fn verify_signature(
        &self,
        signature: &[u8],
        hash: &[u8],
        public_key: &PublicKey,
    ) -> Result<bool> {
        // Simplified verification - in full implementation would use actual crypto
        Ok(!signature.is_empty() && !hash.is_empty() && public_key.der_data.len() > 0)
    }
    
    async fn create_pkcs7_signature(
        &self,
        hash: &[u8],
        credentials: &SigningCredentials,
        options: &Pkcs7Options,
    ) -> Result<Vec<u8>> {
        // Simplified PKCS#7 creation - in full implementation would create actual PKCS#7
        let mut pkcs7_data = Vec::new();
        pkcs7_data.extend_from_slice(b"PKCS#7_SIGNATURE:");
        pkcs7_data.extend_from_slice(hash);
        pkcs7_data.extend_from_slice(&credentials.certificate.der_data[..32.min(credentials.certificate.der_data.len())]);
        Ok(pkcs7_data)
    }
    
    async fn parse_pkcs7_signature(&self, pkcs7_data: &[u8]) -> Result<Pkcs7SignatureInfo> {
        // Simplified parsing - in full implementation would parse actual PKCS#7
        if pkcs7_data.len() < 50 {
            return Err(PdfSignError::Pkcs7Parsing {
                message: "PKCS#7 data too short".to_string(),
            });
        }
        
        Ok(Pkcs7SignatureInfo {
            signer_certificate: CertificateInfo {
                subject: "Test Signer".to_string(),
                issuer: "Test CA".to_string(),
                serial_number: "123456".to_string(),
                not_before: chrono::Utc::now(),
                not_after: chrono::Utc::now() + chrono::Duration::days(365),
                key_algorithm: "RSA".to_string(),
                key_size: 2048,
                der_data: pkcs7_data[17..49].to_vec(),
            },
            certificate_chain: vec![],
            signature_algorithm: SignatureAlgorithm::RsaPkcs1Sha256,
            hash_algorithm: HashAlgorithm::Sha256,
            key_size: 2048,
            signature_value: pkcs7_data[17..].to_vec(),
            signing_time: Some(chrono::Utc::now()),
            content_type: "application/pdf".to_string(),
            message_digest: pkcs7_data[17..49].to_vec(),
        })
    }
}

impl OptimizedCryptographicEngine {
    /// Internal signature creation implementation
    async fn create_signature_internal(
        &self,
        hash: &[u8],
        _private_key: &PrivateKey,
        _algorithm: &SignatureAlgorithm,
    ) -> Result<Vec<u8>> {
        // Simplified signature creation - in full implementation would use actual crypto
        let mut signature = Vec::new();
        signature.extend_from_slice(b"SIGNATURE:");
        signature.extend_from_slice(hash);
        Ok(signature)
    }
    
    /// Extract signature field ranges (same as base implementation)
    fn extract_signature_field_ranges(&self, document: &PdfDocument) -> Result<Vec<(usize, usize)>> {
        let mut ranges = Vec::new();
        
        for signature in &document.existing_signatures {
            if let Some(range) = self.find_signature_byte_range(&document.data, &signature.field_name)? {
                ranges.push(range);
            }
        }
        
        Ok(ranges)
    }
    
    /// Find signature byte range (same as base implementation)
    fn find_signature_byte_range(&self, _pdf_data: &[u8], _field_name: &str) -> Result<Option<(usize, usize)>> {
        Ok(None)
    }
    
    /// Filter document data (same as base implementation)
    fn filter_document_data(&self, data: &[u8], exclude_ranges: &[(usize, usize)]) -> Result<Vec<u8>> {
        if exclude_ranges.is_empty() {
            return Ok(data.to_vec());
        }

        let mut filtered_data = Vec::new();
        let mut current_pos = 0;

        let mut sorted_ranges = exclude_ranges.to_vec();
        sorted_ranges.sort_by_key(|&(start, _)| start);

        for (start, end) in sorted_ranges {
            if start > data.len() || end > data.len() || start > end {
                return Err(PdfSignError::HashCalculation {
                    message: format!("Invalid byte range: {,
                code: crate::error::ErrorCode::HashCalculation,}-{}", start, end),
                });
            }

            if current_pos < start {
                filtered_data.extend_from_slice(&data[current_pos..start]);
            }

            current_pos = end;
        }

        if current_pos < data.len() {
            filtered_data.extend_from_slice(&data[current_pos..]);
        }

        Ok(filtered_data)
    }
}

impl Default for OptimizedCryptographicEngine {
    fn default() -> Self {
        Self::new(OptimizationConfig::default())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_optimized_engine_creation() {
        let config = OptimizationConfig::default();
        let engine = OptimizedCryptographicEngine::new(config);
        
        let stats = engine.get_optimization_stats();
        assert_eq!(stats.cache_size, 0);
    }
    
    #[tokio::test]
    async fn test_hash_calculation_with_context() {
        let engine = OptimizedCryptographicEngine::default();
        let data = b"Hello, World!";
        
        let hash = engine.calculate_hash_with_context(data, &HashAlgorithm::Sha256).await.unwrap();
        assert_eq!(hash.len(), 32); // SHA-256 produces 32-byte hash
    }
    
    #[tokio::test]
    async fn test_hash_caching() {
        let engine = OptimizedCryptographicEngine::default();
        let data = b"Test data for caching";
        
        // First calculation
        let hash1 = engine.calculate_hash_with_cache(data, &HashAlgorithm::Sha256).await.unwrap();
        
        // Second calculation (should use cache)
        let hash2 = engine.calculate_hash_with_cache(data, &HashAlgorithm::Sha256).await.unwrap();
        
        assert_eq!(hash1, hash2);
        
        let stats = engine.get_optimization_stats();
        assert_eq!(stats.cache_size, 1);
    }
    
    #[tokio::test]
    async fn test_batch_hash_calculation() {
        let engine = OptimizedCryptographicEngine::default();
        
        let documents = vec![
            PdfDocument {
                version: "1.7".to_string(),
                page_count: 1,
                metadata: PdfMetadata::default(),
                signature_fields: vec![],
                existing_signatures: vec![],
                data: b"Document 1".to_vec(),
            },
            PdfDocument {
                version: "1.7".to_string(),
                page_count: 1,
                metadata: PdfMetadata::default(),
                signature_fields: vec![],
                existing_signatures: vec![],
                data: b"Document 2".to_vec(),
            },
        ];
        
        let results = engine.batch_calculate_hashes(documents, HashAlgorithm::Sha256).await.unwrap();
        
        assert_eq!(results.len(), 2);
        assert!(results[0].is_ok());
        assert!(results[1].is_ok());
    }
    
    #[tokio::test]
    async fn test_cache_cleanup() {
        let mut config = OptimizationConfig::default();
        config.cache_ttl_seconds = 0; // Immediate expiration
        
        let engine = OptimizedCryptographicEngine::new(config);
        let data = b"Test data";
        
        // Add entry to cache
        let _hash = engine.calculate_hash_with_cache(data, &HashAlgorithm::Sha256).await.unwrap();
        
        // Wait a bit for expiration
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        
        // Cleanup expired entries
        let cleaned = engine.cleanup_cache();
        assert_eq!(cleaned, 1);
    }
}