//! Batch processing for efficient handling of multiple PDF operations
//! 
//! This module provides batch processing capabilities to optimize performance
//! when handling multiple PDF documents or operations.

use crate::{
    error::{PdfSignError, Result},
    types::*,
    performance::context_pool::{CryptoContextPool, ContextPoolConfig},
};
use std::sync::{Arc, Mutex};
use std::collections::VecDeque;
use std::time::{Duration, Instant};

/// Batch operation types
#[derive(Debug, Clone)]
pub enum BatchOperation {
    Sign {
        document: PdfDocument,
        credentials: SigningCredentials,
        options: SigningOptions,
    },
    Validate {
        document: PdfDocument,
    },
    Hash {
        document: PdfDocument,
        algorithm: HashAlgorithm,
    },
}

/// Result of a batch operation
#[derive(Debug, Clone)]
pub enum BatchOperationResult {
    Sign {
        success: bool,
        signed_document: Option<PdfDocument>,
        error: Option<String>,
    },
    Validate {
        success: bool,
        results: Vec<ValidationResult>,
        error: Option<String>,
    },
    Hash {
        success: bool,
        hash: Option<Vec<u8>>,
        error: Option<String>,
    },
}

/// Batch processing configuration
#[derive(Debug, Clone)]
pub struct BatchConfig {
    /// Maximum number of operations to process in parallel
    pub max_parallel_operations: usize,
    /// Maximum batch size before forcing processing
    pub max_batch_size: usize,
    /// Maximum time to wait before processing incomplete batch
    pub max_batch_wait_time: Duration,
    /// Whether to use context pooling for batch operations
    pub use_context_pooling: bool,
    /// Context pool configuration
    pub context_pool_config: ContextPoolConfig,
    /// Whether to continue processing on individual failures
    pub continue_on_error: bool,
}

impl Default for BatchConfig {
    fn default() -> Self {
        Self {
            max_parallel_operations: num_cpus::get().max(1),
            max_batch_size: 100,
            max_batch_wait_time: Duration::from_secs(5),
            use_context_pooling: true,
            context_pool_config: ContextPoolConfig::default(),
            continue_on_error: true,
        }
    }
}

/// Batch processing statistics
#[derive(Debug, Clone, Default)]
pub struct BatchStatistics {
    pub total_operations_processed: u64,
    pub total_operations_succeeded: u64,
    pub total_operations_failed: u64,
    pub total_batches_processed: u64,
    pub average_batch_size: f64,
    pub average_processing_time_ms: f64,
    pub peak_parallel_operations: usize,
}

/// Batch processor for efficient PDF operations
pub struct BatchProcessor {
    /// Configuration
    config: BatchConfig,
    /// Pending operations queue
    pending_operations: Arc<Mutex<VecDeque<(BatchOperation, Instant)>>>,
    /// Context pool for reuse
    context_pool: Option<Arc<CryptoContextPool>>,
    /// Processing statistics
    statistics: Arc<Mutex<BatchStatistics>>,
    /// Whether processor is currently running
    is_processing: Arc<Mutex<bool>>,
}

impl BatchProcessor {
    pub fn new(config: BatchConfig) -> Self {
        let context_pool = if config.use_context_pooling {
            Some(Arc::new(CryptoContextPool::new(config.context_pool_config.clone())))
        } else {
            None
        };
        
        Self {
            config,
            pending_operations: Arc::new(Mutex::new(VecDeque::new())),
            context_pool,
            statistics: Arc::new(Mutex::new(BatchStatistics::default())),
            is_processing: Arc::new(Mutex::new(false)),
        }
    }
    
    /// Add operation to batch queue
    pub fn add_operation(&self, operation: BatchOperation) -> Result<()> {
        let mut queue = self.pending_operations.lock().unwrap();
        queue.push_back((operation, Instant::now()));
        
        // Check if we should trigger immediate processing
        if queue.len() >= self.config.max_batch_size {
            drop(queue); // Release lock before processing
            self.process_batch()?;
        }
        
        Ok(())
    }
    
    /// Process all pending operations in batch
    pub fn process_batch(&self) -> Result<Vec<BatchOperationResult>> {
        let mut is_processing = self.is_processing.lock().unwrap();
        if *is_processing {
            return Err(PdfSignError::Configuration {
                message: "Batch processing already in progress".to_string(),
                code: crate::error::ErrorCode::Configuration,
            ,
                code: crate::error::ErrorCode::Configuration,});
        }
        *is_processing = true;
        drop(is_processing);
        
        let start_time = Instant::now();
        let operations = self.collect_pending_operations();
        
        if operations.is_empty() {
            *self.is_processing.lock().unwrap() = false;
            return Ok(Vec::new());
        }
        
        let results = self.process_operations_parallel(operations)?;
        
        // Update statistics
        self.update_statistics(&results, start_time.elapsed());
        
        *self.is_processing.lock().unwrap() = false;
        Ok(results)
    }
    
    /// Process operations with timeout
    pub fn process_batch_with_timeout(&self, timeout: Duration) -> Result<Vec<BatchOperationResult>> {
        let start_time = Instant::now();
        
        while start_time.elapsed() < timeout {
            let queue_size = self.pending_operations.lock().unwrap().len();
            
            if queue_size >= self.config.max_batch_size {
                return self.process_batch();
            }
            
            // Check if oldest operation has exceeded wait time
            if let Some((_, oldest_time)) = self.pending_operations.lock().unwrap().front() {
                if oldest_time.elapsed() >= self.config.max_batch_wait_time {
                    return self.process_batch();
                }
            }
            
            // Short sleep to avoid busy waiting
            std::thread::sleep(Duration::from_millis(10));
        }
        
        // Timeout reached, process whatever we have
        self.process_batch()
    }
    
    /// Collect pending operations from queue
    fn collect_pending_operations(&self) -> Vec<BatchOperation> {
        let mut queue = self.pending_operations.lock().unwrap();
        let operations: Vec<BatchOperation> = queue
            .drain(..)
            .map(|(op, _)| op)
            .collect();
        operations
    }
    
    /// Process operations in parallel
    fn process_operations_parallel(&self, operations: Vec<BatchOperation>) -> Result<Vec<BatchOperationResult>> {
        use std::sync::mpsc;
        use std::thread;
        
        let chunk_size = (operations.len() + self.config.max_parallel_operations - 1) 
            / self.config.max_parallel_operations;
        
        let (tx, rx) = mpsc::channel();
        let mut handles = Vec::new();
        
        // Split operations into chunks for parallel processing
        for (chunk_index, chunk) in operations.chunks(chunk_size).enumerate() {
            let chunk = chunk.to_vec();
            let tx = tx.clone();
            let context_pool = self.context_pool.clone();
            let continue_on_error = self.config.continue_on_error;
            
            let handle = thread::spawn(move || {
                let chunk_results = Self::process_operation_chunk(
                    chunk, 
                    context_pool, 
                    continue_on_error
                );
                tx.send((chunk_index, chunk_results)).unwrap();
            });
            
            handles.push(handle);
        }
        
        drop(tx); // Close sender
        
        // Collect results from all threads
        let mut all_results = Vec::new();
        let mut chunk_results: Vec<(usize, Vec<BatchOperationResult>)> = Vec::new();
        
        for received in rx {
            chunk_results.push(received);
        }
        
        // Wait for all threads to complete
        for handle in handles {
            handle.join().map_err(|_| PdfSignError::Processing {
                message: "Thread panicked during batch processing".to_string(),
                code: crate::error::ErrorCode::Processing,
            ,
                code: crate::error::ErrorCode::Processing,})?;
        }
        
        // Sort results by chunk index to maintain order
        chunk_results.sort_by_key(|(index, _)| *index);
        
        for (_, mut results) in chunk_results {
            all_results.append(&mut results);
        }
        
        Ok(all_results)
    }
    
    /// Process a chunk of operations
    fn process_operation_chunk(
        operations: Vec<BatchOperation>,
        context_pool: Option<Arc<CryptoContextPool>>,
        continue_on_error: bool,
    ) -> Vec<BatchOperationResult> {
        let mut results = Vec::new();
        
        for operation in operations {
            let result = Self::process_single_operation(operation, &context_pool);
            
            match &result {
                BatchOperationResult::Sign { success, .. } |
                BatchOperationResult::Validate { success, .. } |
                BatchOperationResult::Hash { success, .. } => {
                    if !success && !continue_on_error {
                        results.push(result);
                        break; // Stop processing on first error
                    }
                }
            }
            
            results.push(result);
        }
        
        results
    }
    
    /// Process a single operation
    fn process_single_operation(
        operation: BatchOperation,
        context_pool: &Option<Arc<CryptoContextPool>>,
    ) -> BatchOperationResult {
        match operation {
            BatchOperation::Sign { document, credentials, options } => {
                // In a full implementation, this would use the actual signing logic
                // For now, return a mock result
                BatchOperationResult::Sign {
                    success: true,
                    signed_document: Some(document),
                    error: None,
                }
            }
            
            BatchOperation::Validate { document } => {
                // In a full implementation, this would use the actual validation logic
                // For now, return a mock result
                BatchOperationResult::Validate {
                    success: true,
                    results: vec![],
                    error: None,
                }
            }
            
            BatchOperation::Hash { document, algorithm } => {
                // Use context pool if available
                let hash_result = if let Some(pool) = context_pool {
                    Self::calculate_hash_with_pool(&document, &algorithm, pool)
                } else {
                    Self::calculate_hash_simple(&document, &algorithm)
                };
                
                match hash_result {
                    Ok(hash) => BatchOperationResult::Hash {
                        success: true,
                        hash: Some(hash),
                        error: None,
                    },
                    Err(e) => BatchOperationResult::Hash {
                        success: false,
                        hash: None,
                        error: Some(e.to_string()),
                    },
                }
            }
        }
    }
    
    /// Calculate hash using context pool
    fn calculate_hash_with_pool(
        document: &PdfDocument,
        algorithm: &HashAlgorithm,
        pool: &Arc<CryptoContextPool>,
    ) -> Result<Vec<u8>> {
        use sha2::{Sha256, Sha384, Sha512, Digest};
        
        // Get context from pool (using RSA as default signature algorithm)
        let _context = pool.get_context(
            algorithm.clone(),
            SignatureAlgorithm::RsaPkcs1Sha256,
        )?;
        
        // Calculate hash
        match algorithm {
            HashAlgorithm::Sha256 => {
                let mut hasher = Sha256::new();
                hasher.update(&document.data);
                Ok(hasher.finalize().to_vec())
            }
            HashAlgorithm::Sha384 => {
                let mut hasher = Sha384::new();
                hasher.update(&document.data);
                Ok(hasher.finalize().to_vec())
            }
            HashAlgorithm::Sha512 => {
                let mut hasher = Sha512::new();
                hasher.update(&document.data);
                Ok(hasher.finalize().to_vec())
            }
        }
    }
    
    /// Calculate hash without context pool
    fn calculate_hash_simple(document: &PdfDocument, algorithm: &HashAlgorithm) -> Result<Vec<u8>> {
        use sha2::{Sha256, Sha384, Sha512, Digest};
        
        match algorithm {
            HashAlgorithm::Sha256 => {
                let mut hasher = Sha256::new();
                hasher.update(&document.data);
                Ok(hasher.finalize().to_vec())
            }
            HashAlgorithm::Sha384 => {
                let mut hasher = Sha384::new();
                hasher.update(&document.data);
                Ok(hasher.finalize().to_vec())
            }
            HashAlgorithm::Sha512 => {
                let mut hasher = Sha512::new();
                hasher.update(&document.data);
                Ok(hasher.finalize().to_vec())
            }
        }
    }
    
    /// Update processing statistics
    fn update_statistics(&self, results: &[BatchOperationResult], processing_time: Duration) {
        let mut stats = self.statistics.lock().unwrap();
        
        stats.total_batches_processed += 1;
        stats.total_operations_processed += results.len() as u64;
        
        let successful_operations = results.iter().filter(|result| {
            match result {
                BatchOperationResult::Sign { success, .. } |
                BatchOperationResult::Validate { success, .. } |
                BatchOperationResult::Hash { success, .. } => *success,
            }
        }).count() as u64;
        
        stats.total_operations_succeeded += successful_operations;
        stats.total_operations_failed += (results.len() as u64) - successful_operations;
        
        // Update averages
        stats.average_batch_size = stats.total_operations_processed as f64 
            / stats.total_batches_processed as f64;
        
        let total_time_ms = (stats.average_processing_time_ms * (stats.total_batches_processed - 1) as f64)
            + processing_time.as_millis() as f64;
        stats.average_processing_time_ms = total_time_ms / stats.total_batches_processed as f64;
        
        stats.peak_parallel_operations = stats.peak_parallel_operations
            .max(self.config.max_parallel_operations);
    }
    
    /// Get processing statistics
    pub fn get_statistics(&self) -> BatchStatistics {
        self.statistics.lock().unwrap().clone()
    }
    
    /// Get current queue size
    pub fn queue_size(&self) -> usize {
        self.pending_operations.lock().unwrap().len()
    }
    
    /// Check if processor is currently processing
    pub fn is_processing(&self) -> bool {
        *self.is_processing.lock().unwrap()
    }
    
    /// Clear pending operations
    pub fn clear_queue(&self) -> Result<usize> {
        let mut queue = self.pending_operations.lock().unwrap();
        let cleared_count = queue.len();
        queue.clear();
        Ok(cleared_count)
    }
    
    /// Flush all pending operations (process immediately)
    pub fn flush(&self) -> Result<Vec<BatchOperationResult>> {
        self.process_batch()
    }
}

/// Batch operation builder for convenient batch creation
pub struct BatchOperationBuilder {
    operations: Vec<BatchOperation>,
}

impl BatchOperationBuilder {
    pub fn new() -> Self {
        Self {
            operations: Vec::new(),
        }
    }
    
    pub fn add_sign_operation(
        mut self,
        document: PdfDocument,
        credentials: SigningCredentials,
        options: SigningOptions,
    ) -> Self {
        self.operations.push(BatchOperation::Sign {
            document,
            credentials,
            options,
        });
        self
    }
    
    pub fn add_validate_operation(mut self, document: PdfDocument) -> Self {
        self.operations.push(BatchOperation::Validate { document });
        self
    }
    
    pub fn add_hash_operation(mut self, document: PdfDocument, algorithm: HashAlgorithm) -> Self {
        self.operations.push(BatchOperation::Hash { document, algorithm });
        self
    }
    
    pub fn build(self) -> Vec<BatchOperation> {
        self.operations
    }
    
    pub fn execute_with_processor(self, processor: &BatchProcessor) -> Result<Vec<BatchOperationResult>> {
        for operation in self.operations {
            processor.add_operation(operation)?;
        }
        processor.process_batch()
    }
}

impl Default for BatchOperationBuilder {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::*;
    
    fn create_test_document() -> PdfDocument {
        PdfDocument {
            version: "1.7".to_string(),
            page_count: 1,
            metadata: PdfMetadata::default(),
            signature_fields: vec![],
            existing_signatures: vec![],
            data: b"%PDF-1.7\ntest document".to_vec(),
        }
    }
    
    #[test]
    fn test_batch_config_default() {
        let config = BatchConfig::default();
        assert!(config.max_parallel_operations >= 1);
        assert_eq!(config.max_batch_size, 100);
        assert!(config.use_context_pooling);
        assert!(config.continue_on_error);
    }
    
    #[test]
    fn test_batch_processor_creation() {
        let config = BatchConfig::default();
        let processor = BatchProcessor::new(config);
        
        assert_eq!(processor.queue_size(), 0);
        assert!(!processor.is_processing());
    }
    
    #[test]
    fn test_add_operation() {
        let processor = BatchProcessor::new(BatchConfig::default());
        let document = create_test_document();
        
        let operation = BatchOperation::Hash {
            document,
            algorithm: HashAlgorithm::Sha256,
        };
        
        processor.add_operation(operation).unwrap();
        assert_eq!(processor.queue_size(), 1);
    }
    
    #[test]
    fn test_batch_operation_builder() {
        let document = create_test_document();
        
        let operations = BatchOperationBuilder::new()
            .add_hash_operation(document.clone(), HashAlgorithm::Sha256)
            .add_validate_operation(document)
            .build();
        
        assert_eq!(operations.len(), 2);
    }
    
    #[test]
    fn test_process_batch() {
        let processor = BatchProcessor::new(BatchConfig::default());
        let document = create_test_document();
        
        let operation = BatchOperation::Hash {
            document,
            algorithm: HashAlgorithm::Sha256,
        };
        
        processor.add_operation(operation).unwrap();
        let results = processor.process_batch().unwrap();
        
        assert_eq!(results.len(), 1);
        match &results[0] {
            BatchOperationResult::Hash { success, hash, .. } => {
                assert!(success);
                assert!(hash.is_some());
            }
            _ => panic!("Expected hash result"),
        }
    }
    
    #[test]
    fn test_statistics_update() {
        let processor = BatchProcessor::new(BatchConfig::default());
        let document = create_test_document();
        
        let operation = BatchOperation::Hash {
            document,
            algorithm: HashAlgorithm::Sha256,
        };
        
        processor.add_operation(operation).unwrap();
        processor.process_batch().unwrap();
        
        let stats = processor.get_statistics();
        assert_eq!(stats.total_operations_processed, 1);
        assert_eq!(stats.total_operations_succeeded, 1);
        assert_eq!(stats.total_batches_processed, 1);
    }
}