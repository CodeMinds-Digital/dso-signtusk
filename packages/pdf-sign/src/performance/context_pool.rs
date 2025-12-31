//! Cryptographic context pooling for performance optimization
//! 
//! This module implements reusable cryptographic contexts to avoid the overhead
//! of repeatedly initializing cryptographic operations.

use crate::{
    error::{PdfSignError, Result},
    types::*,
};
use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use std::time::{Duration, Instant};

/// Cryptographic context for reuse
#[derive(Debug, Clone)]
pub struct CryptoContext {
    /// Context ID for tracking
    pub id: String,
    /// Hash algorithm this context is configured for
    pub hash_algorithm: HashAlgorithm,
    /// Signature algorithm this context is configured for
    pub signature_algorithm: SignatureAlgorithm,
    /// Creation time for expiration tracking
    pub created_at: Instant,
    /// Last used time for LRU eviction
    pub last_used: Instant,
    /// Usage count for statistics
    pub usage_count: u64,
    /// Whether context is currently in use
    pub in_use: bool,
}

impl CryptoContext {
    pub fn new(
        id: String,
        hash_algorithm: HashAlgorithm,
        signature_algorithm: SignatureAlgorithm,
    ) -> Self {
        let now = Instant::now();
        Self {
            id,
            hash_algorithm,
            signature_algorithm,
            created_at: now,
            last_used: now,
            usage_count: 0,
            in_use: false,
        }
    }
    
    pub fn mark_used(&mut self) {
        self.last_used = Instant::now();
        self.usage_count += 1;
        self.in_use = true;
    }
    
    pub fn mark_released(&mut self) {
        self.in_use = false;
    }
    
    pub fn is_expired(&self, max_age: Duration) -> bool {
        self.created_at.elapsed() > max_age
    }
    
    pub fn idle_time(&self) -> Duration {
        self.last_used.elapsed()
    }
}

/// Configuration for cryptographic context pool
#[derive(Debug, Clone)]
pub struct ContextPoolConfig {
    /// Maximum number of contexts to keep in pool
    pub max_pool_size: usize,
    /// Maximum age of a context before it's considered expired
    pub max_context_age: Duration,
    /// Maximum idle time before a context is evicted
    pub max_idle_time: Duration,
    /// Cleanup interval for expired contexts
    pub cleanup_interval: Duration,
    /// Whether to enable context reuse
    pub enable_reuse: bool,
}

impl Default for ContextPoolConfig {
    fn default() -> Self {
        Self {
            max_pool_size: 50,
            max_context_age: Duration::from_secs(3600), // 1 hour
            max_idle_time: Duration::from_secs(300),     // 5 minutes
            cleanup_interval: Duration::from_secs(60),   // 1 minute
            enable_reuse: true,
        }
    }
}

/// Pool statistics for monitoring
#[derive(Debug, Clone, Default)]
pub struct PoolStatistics {
    pub total_contexts_created: u64,
    pub total_contexts_reused: u64,
    pub total_contexts_expired: u64,
    pub current_pool_size: usize,
    pub peak_pool_size: usize,
    pub cache_hit_rate: f64,
}

/// Cryptographic context pool for performance optimization
pub struct CryptoContextPool {
    /// Pool of available contexts
    contexts: Arc<RwLock<HashMap<String, CryptoContext>>>,
    /// Pool configuration
    config: ContextPoolConfig,
    /// Pool statistics
    statistics: Arc<Mutex<PoolStatistics>>,
    /// Last cleanup time
    last_cleanup: Arc<Mutex<Instant>>,
}

impl CryptoContextPool {
    pub fn new(config: ContextPoolConfig) -> Self {
        Self {
            contexts: Arc::new(RwLock::new(HashMap::new())),
            config,
            statistics: Arc::new(Mutex::new(PoolStatistics::default())),
            last_cleanup: Arc::new(Mutex::new(Instant::now())),
        }
    }
    
    /// Get or create a cryptographic context
    pub fn get_context(
        &self,
        hash_algorithm: HashAlgorithm,
        signature_algorithm: SignatureAlgorithm,
    ) -> Result<CryptoContext> {
        if !self.config.enable_reuse {
            return self.create_new_context(hash_algorithm, signature_algorithm);
        }
        
        // Try to find existing compatible context
        let context_key = self.make_context_key(&hash_algorithm, &signature_algorithm);
        
        {
            let mut contexts = self.contexts.write().unwrap();
            
            // Look for available context
            if let Some(context) = contexts.get_mut(&context_key) {
                if !context.in_use && !context.is_expired(self.config.max_context_age) {
                    context.mark_used();
                    
                    // Update statistics
                    let mut stats = self.statistics.lock().unwrap();
                    stats.total_contexts_reused += 1;
                    stats.cache_hit_rate = stats.total_contexts_reused as f64 
                        / (stats.total_contexts_created + stats.total_contexts_reused) as f64;
                    
                    return Ok(context.clone());
                }
            }
        }
        
        // No suitable context found, create new one
        let mut new_context = self.create_new_context(hash_algorithm, signature_algorithm)?;
        new_context.mark_used();
        
        // Add to pool if there's space
        {
            let mut contexts = self.contexts.write().unwrap();
            if contexts.len() < self.config.max_pool_size {
                contexts.insert(context_key, new_context.clone());
                
                // Update statistics
                let mut stats = self.statistics.lock().unwrap();
                stats.current_pool_size = contexts.len();
                stats.peak_pool_size = stats.peak_pool_size.max(contexts.len());
            }
        }
        
        Ok(new_context)
    }
    
    /// Release a context back to the pool
    pub fn release_context(&self, context_id: &str) -> Result<()> {
        let mut contexts = self.contexts.write().unwrap();
        
        if let Some(context) = contexts.get_mut(context_id) {
            context.mark_released();
        }
        
        Ok(())
    }
    
    /// Create a new cryptographic context
    fn create_new_context(
        &self,
        hash_algorithm: HashAlgorithm,
        signature_algorithm: SignatureAlgorithm,
    ) -> Result<CryptoContext> {
        let context_id = self.generate_context_id(&hash_algorithm, &signature_algorithm);
        
        // Update statistics
        {
            let mut stats = self.statistics.lock().unwrap();
            stats.total_contexts_created += 1;
        }
        
        Ok(CryptoContext::new(context_id, hash_algorithm, signature_algorithm))
    }
    
    /// Generate unique context ID
    fn generate_context_id(
        &self,
        hash_algorithm: &HashAlgorithm,
        signature_algorithm: &SignatureAlgorithm,
    ) -> String {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        
        format!("ctx_{}_{:?}_{:?}_{}", 
            timestamp, hash_algorithm, signature_algorithm, 
            fastrand::u64(..)
        )
    }
    
    /// Make context key for lookup
    fn make_context_key(
        &self,
        hash_algorithm: &HashAlgorithm,
        signature_algorithm: &SignatureAlgorithm,
    ) -> String {
        format!("{:?}_{:?}", hash_algorithm, signature_algorithm)
    }
    
    /// Clean up expired and idle contexts
    pub fn cleanup(&self) -> Result<usize> {
        let mut last_cleanup = self.last_cleanup.lock().unwrap();
        
        // Check if cleanup is needed
        if last_cleanup.elapsed() < self.config.cleanup_interval {
            return Ok(0);
        }
        
        let mut contexts = self.contexts.write().unwrap();
        let mut removed_count = 0;
        
        // Collect keys to remove
        let keys_to_remove: Vec<String> = contexts
            .iter()
            .filter_map(|(key, context)| {
                if context.in_use {
                    return None; // Don't remove contexts in use
                }
                
                if context.is_expired(self.config.max_context_age) 
                    || context.idle_time() > self.config.max_idle_time {
                    Some(key.clone())
                } else {
                    None
                }
            })
            .collect();
        
        // Remove expired contexts
        for key in keys_to_remove {
            contexts.remove(&key);
            removed_count += 1;
        }
        
        // Update statistics
        {
            let mut stats = self.statistics.lock().unwrap();
            stats.total_contexts_expired += removed_count as u64;
            stats.current_pool_size = contexts.len();
        }
        
        *last_cleanup = Instant::now();
        Ok(removed_count)
    }
    
    /// Get pool statistics
    pub fn get_statistics(&self) -> PoolStatistics {
        self.statistics.lock().unwrap().clone()
    }
    
    /// Clear all contexts from pool
    pub fn clear(&self) -> Result<()> {
        let mut contexts = self.contexts.write().unwrap();
        contexts.clear();
        
        // Reset statistics
        {
            let mut stats = self.statistics.lock().unwrap();
            stats.current_pool_size = 0;
        }
        
        Ok(())
    }
    
    /// Get current pool size
    pub fn pool_size(&self) -> usize {
        self.contexts.read().unwrap().len()
    }
    
    /// Check if pool is at capacity
    pub fn is_at_capacity(&self) -> bool {
        self.pool_size() >= self.config.max_pool_size
    }
}

/// Global context pool instance
static GLOBAL_CONTEXT_POOL: std::sync::OnceLock<CryptoContextPool> = std::sync::OnceLock::new();

/// Get the global context pool instance
pub fn get_global_context_pool() -> &'static CryptoContextPool {
    GLOBAL_CONTEXT_POOL.get_or_init(|| {
        CryptoContextPool::new(ContextPoolConfig::default())
    })
}

/// Initialize global context pool with custom configuration
pub fn initialize_global_context_pool(config: ContextPoolConfig) -> Result<()> {
    GLOBAL_CONTEXT_POOL.set(CryptoContextPool::new(config))
        .map_err(|_| PdfSignError::Configuration {
            message: "Global context pool already initialized".to_string(),
            code: crate::error::ErrorCode::Configuration,
        ,
                code: crate::error::ErrorCode::Configuration,})?;
    Ok(())
}

/// Cryptographic operation with context reuse
pub struct ContextualCryptoOperation {
    context: CryptoContext,
    pool: Arc<CryptoContextPool>,
}

impl ContextualCryptoOperation {
    pub fn new(
        hash_algorithm: HashAlgorithm,
        signature_algorithm: SignatureAlgorithm,
    ) -> Result<Self> {
        let pool = Arc::new(CryptoContextPool::new(ContextPoolConfig::default()));
        let context = pool.get_context(hash_algorithm, signature_algorithm)?;
        
        Ok(Self { context, pool })
    }
    
    pub fn with_pool(
        pool: Arc<CryptoContextPool>,
        hash_algorithm: HashAlgorithm,
        signature_algorithm: SignatureAlgorithm,
    ) -> Result<Self> {
        let context = pool.get_context(hash_algorithm, signature_algorithm)?;
        Ok(Self { context, pool })
    }
    
    /// Perform hash calculation with context reuse
    pub fn calculate_hash(&self, data: &[u8]) -> Result<Vec<u8>> {
        use sha2::{Sha256, Sha384, Sha512, Digest};
        
        match self.context.hash_algorithm {
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
    
    /// Get context information
    pub fn context(&self) -> &CryptoContext {
        &self.context
    }
}

impl Drop for ContextualCryptoOperation {
    fn drop(&mut self) {
        // Release context back to pool
        let _ = self.pool.release_context(&self.context.id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_crypto_context_creation() {
        let context = CryptoContext::new(
            "test_ctx".to_string(),
            HashAlgorithm::Sha256,
            SignatureAlgorithm::RsaPkcs1Sha256,
        );
        
        assert_eq!(context.id, "test_ctx");
        assert_eq!(context.hash_algorithm, HashAlgorithm::Sha256);
        assert_eq!(context.signature_algorithm, SignatureAlgorithm::RsaPkcs1Sha256);
        assert_eq!(context.usage_count, 0);
        assert!(!context.in_use);
    }
    
    #[test]
    fn test_context_pool_creation() {
        let config = ContextPoolConfig::default();
        let pool = CryptoContextPool::new(config);
        
        assert_eq!(pool.pool_size(), 0);
        assert!(!pool.is_at_capacity());
    }
    
    #[test]
    fn test_context_get_and_release() {
        let pool = CryptoContextPool::new(ContextPoolConfig::default());
        
        // Get context
        let context = pool.get_context(
            HashAlgorithm::Sha256,
            SignatureAlgorithm::RsaPkcs1Sha256,
        ).unwrap();
        
        assert!(context.in_use);
        assert_eq!(context.usage_count, 1);
        
        // Release context
        pool.release_context(&context.id).unwrap();
    }
    
    #[test]
    fn test_context_reuse() {
        let pool = CryptoContextPool::new(ContextPoolConfig::default());
        
        // Get first context
        let context1 = pool.get_context(
            HashAlgorithm::Sha256,
            SignatureAlgorithm::RsaPkcs1Sha256,
        ).unwrap();
        
        let context1_id = context1.id.clone();
        pool.release_context(&context1_id).unwrap();
        
        // Get second context with same algorithms - should reuse
        let context2 = pool.get_context(
            HashAlgorithm::Sha256,
            SignatureAlgorithm::RsaPkcs1Sha256,
        ).unwrap();
        
        // Should be the same context (reused)
        assert_eq!(context1_id, context2.id);
        assert_eq!(context2.usage_count, 2); // Used twice
    }
    
    #[test]
    fn test_contextual_crypto_operation() {
        let operation = ContextualCryptoOperation::new(
            HashAlgorithm::Sha256,
            SignatureAlgorithm::RsaPkcs1Sha256,
        ).unwrap();
        
        let test_data = b"Hello, World!";
        let hash = operation.calculate_hash(test_data).unwrap();
        
        assert_eq!(hash.len(), 32); // SHA-256 produces 32-byte hash
        assert!(operation.context().in_use);
    }
    
    #[test]
    fn test_pool_statistics() {
        let pool = CryptoContextPool::new(ContextPoolConfig::default());
        
        // Get some contexts
        let _ctx1 = pool.get_context(
            HashAlgorithm::Sha256,
            SignatureAlgorithm::RsaPkcs1Sha256,
        ).unwrap();
        
        let _ctx2 = pool.get_context(
            HashAlgorithm::Sha384,
            SignatureAlgorithm::RsaPkcs1Sha384,
        ).unwrap();
        
        let stats = pool.get_statistics();
        assert_eq!(stats.total_contexts_created, 2);
        assert_eq!(stats.current_pool_size, 2);
    }
}