//! Concurrent operation management and coordination
//! 
//! This module provides utilities for managing concurrent operations,
//! including operation queuing, resource coordination, and deadlock prevention.

use crate::{
    error::{PdfSignError, Result},
    types::*,
};
use std::sync::{Arc, Mutex, Condvar, RwLock};
use std::collections::{HashMap, VecDeque};
use std::time::{Duration, Instant};
use std::thread;
use tokio::sync::{Semaphore, SemaphorePermit};

/// Manages concurrent operations with resource coordination
pub struct ConcurrentOperationManager {
    /// Configuration for concurrent operations
    config: ConcurrentOperationConfig,
    /// Active operations tracking
    active_operations: Arc<Mutex<HashMap<String, OperationInfo>>>,
    /// Operation queue for managing backpressure
    operation_queue: Arc<Mutex<VecDeque<QueuedOperation>>>,
    /// Semaphore for limiting concurrent operations
    operation_semaphore: Arc<Semaphore>,
    /// Condition variable for operation completion notifications
    completion_notifier: Arc<(Mutex<bool>, Condvar)>,
    /// Statistics tracking
    statistics: Arc<Mutex<ConcurrentOperationStatistics>>,
}

/// Configuration for concurrent operations
#[derive(Debug, Clone)]
pub struct ConcurrentOperationConfig {
    /// Maximum number of concurrent read operations
    pub max_concurrent_reads: usize,
    /// Maximum number of concurrent write operations (typically 1)
    pub max_concurrent_writes: usize,
    /// Maximum queue size for pending operations
    pub max_queue_size: usize,
    /// Timeout for operation completion
    pub operation_timeout: Duration,
    /// Whether to enable operation prioritization
    pub enable_prioritization: bool,
    /// Deadlock detection timeout
    pub deadlock_detection_timeout: Duration,
}

impl Default for ConcurrentOperationConfig {
    fn default() -> Self {
        Self {
            max_concurrent_reads: num_cpus::get() * 2,
            max_concurrent_writes: 1,
            max_queue_size: 1000,
            operation_timeout: Duration::from_secs(300), // 5 minutes
            enable_prioritization: true,
            deadlock_detection_timeout: Duration::from_secs(60),
        }
    }
}

/// Information about an active operation
#[derive(Debug, Clone)]
struct OperationInfo {
    /// Unique operation ID
    operation_id: String,
    /// Operation type
    operation_type: OperationType,
    /// Thread ID executing the operation
    thread_id: thread::ThreadId,
    /// Start time of the operation
    start_time: Instant,
    /// Priority level
    priority: OperationPriority,
    /// Resources held by this operation
    held_resources: Vec<String>,
}

/// Queued operation waiting for execution
struct QueuedOperation {
    /// Operation ID
    operation_id: String,
    /// Operation type
    operation_type: OperationType,
    /// Priority level
    priority: OperationPriority,
    /// Queued time
    queued_at: Instant,
    /// Completion callback
    completion_callback: Box<dyn FnOnce(Result<()>) + Send + 'static>,
}

/// Type of operation for resource management
#[derive(Debug, Clone, PartialEq)]
pub enum OperationType {
    /// Read operation (can be concurrent)
    Read,
    /// Write operation (exclusive)
    Write,
    /// Mixed operation (requires careful coordination)
    Mixed,
}

/// Priority levels for operation scheduling
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum OperationPriority {
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3,
}

/// Statistics for concurrent operations
#[derive(Debug, Clone, Default)]
pub struct ConcurrentOperationStatistics {
    /// Total operations started
    pub total_operations_started: u64,
    /// Total operations completed
    pub total_operations_completed: u64,
    /// Total operations failed
    pub total_operations_failed: u64,
    /// Total operations queued
    pub total_operations_queued: u64,
    /// Peak concurrent operations
    pub peak_concurrent_operations: usize,
    /// Average operation duration
    pub average_operation_duration_ms: f64,
    /// Current queue size
    pub current_queue_size: usize,
    /// Deadlocks detected
    pub deadlocks_detected: u64,
}

/// Resource coordinator for preventing deadlocks
pub struct ResourceCoordinator {
    /// Resource allocation tracking
    resource_allocations: Arc<RwLock<HashMap<String, ResourceAllocation>>>,
    /// Resource dependency graph for deadlock detection
    dependency_graph: Arc<Mutex<HashMap<String, Vec<String>>>>,
    /// Configuration
    config: ResourceCoordinatorConfig,
}

/// Resource allocation information
#[derive(Debug, Clone)]
struct ResourceAllocation {
    /// Operation holding the resource
    operation_id: String,
    /// Thread ID holding the resource
    thread_id: thread::ThreadId,
    /// Allocation time
    allocated_at: Instant,
    /// Resource type
    resource_type: ResourceType,
}

/// Configuration for resource coordination
#[derive(Debug, Clone)]
pub struct ResourceCoordinatorConfig {
    /// Maximum time a resource can be held
    pub max_resource_hold_time: Duration,
    /// Deadlock detection interval
    pub deadlock_detection_interval: Duration,
    /// Whether to enable automatic deadlock resolution
    pub enable_deadlock_resolution: bool,
}

impl Default for ResourceCoordinatorConfig {
    fn default() -> Self {
        Self {
            max_resource_hold_time: Duration::from_secs(300), // 5 minutes
            deadlock_detection_interval: Duration::from_secs(10),
            enable_deadlock_resolution: true,
        }
    }
}

/// Types of resources that can be coordinated
#[derive(Debug, Clone, PartialEq)]
pub enum ResourceType {
    /// PDF document resource
    Document,
    /// Cryptographic context
    CryptoContext,
    /// Certificate resource
    Certificate,
    /// File system resource
    FileSystem,
    /// Memory resource
    Memory,
}

impl ConcurrentOperationManager {
    pub fn new(config: ConcurrentOperationConfig) -> Self {
        let total_permits = config.max_concurrent_reads + config.max_concurrent_writes;
        
        Self {
            config,
            active_operations: Arc::new(Mutex::new(HashMap::new())),
            operation_queue: Arc::new(Mutex::new(VecDeque::new())),
            operation_semaphore: Arc::new(Semaphore::new(total_permits)),
            completion_notifier: Arc::new((Mutex::new(false), Condvar::new())),
            statistics: Arc::new(Mutex::new(ConcurrentOperationStatistics::default())),
        }
    }
    
    /// Start a new operation with resource coordination
    pub async fn start_operation(
        &self,
        operation_type: OperationType,
        priority: OperationPriority,
        resources: Vec<String>,
    ) -> Result<OperationHandle> {
        let operation_id = self.generate_operation_id();
        
        // Check if we can start immediately or need to queue
        if self.can_start_operation(&operation_type).await? {
            self.start_operation_immediately(operation_id.clone(), operation_type, priority, resources).await
        } else {
            self.queue_operation(operation_id.clone(), operation_type, priority).await?;
            self.wait_for_operation_start(operation_id).await
        }
    }
    
    /// Check if an operation can start immediately
    async fn can_start_operation(&self, operation_type: &OperationType) -> Result<bool> {
        let active_ops = self.active_operations.lock().unwrap();
        
        match operation_type {
            OperationType::Read => {
                let active_reads = active_ops.values()
                    .filter(|op| op.operation_type == OperationType::Read)
                    .count();
                Ok(active_reads < self.config.max_concurrent_reads)
            }
            OperationType::Write => {
                // Write operations require exclusive access
                Ok(active_ops.is_empty())
            }
            OperationType::Mixed => {
                // Mixed operations require exclusive access
                Ok(active_ops.is_empty())
            }
        }
    }
    
    /// Start an operation immediately
    async fn start_operation_immediately(
        &self,
        operation_id: String,
        operation_type: OperationType,
        priority: OperationPriority,
        resources: Vec<String>,
    ) -> Result<OperationHandle> {
        // Acquire semaphore permit
        let permit = self.operation_semaphore.acquire().await
            .map_err(|_| PdfSignError::Concurrency {
                message: "Failed to acquire operation permit".to_string(),
            })?;
        
        // Register the operation
        {
            let mut active_ops = self.active_operations.lock().unwrap();
            let operation_info = OperationInfo {
                operation_id: operation_id.clone(),
                operation_type: operation_type.clone(),
                thread_id: thread::current().id(),
                start_time: Instant::now(),
                priority,
                held_resources: resources.clone(),
            };
            active_ops.insert(operation_id.clone(), operation_info);
            
            // Update statistics
            let mut stats = self.statistics.lock().unwrap();
            stats.total_operations_started += 1;
            stats.peak_concurrent_operations = stats.peak_concurrent_operations.max(active_ops.len());
        }
        
        Ok(OperationHandle {
            operation_id,
            operation_type,
            manager: Arc::new(self.clone()),
            _permit: permit,
        })
    }
    
    /// Queue an operation for later execution
    async fn queue_operation(
        &self,
        operation_id: String,
        operation_type: OperationType,
        priority: OperationPriority,
    ) -> Result<()> {
        let mut queue = self.operation_queue.lock().unwrap();
        
        if queue.len() >= self.config.max_queue_size {
            return Err(PdfSignError::Concurrency {
                message: format!("Operation queue is full ({})", self.config.max_queue_size),
            });
        }
        
        // Create a placeholder callback for now
        let queued_op = QueuedOperation {
            operation_id: operation_id.clone(),
            operation_type,
            priority,
            queued_at: Instant::now(),
            completion_callback: Box::new(|_| {}),
        };
        
        // Insert in priority order
        let insert_pos = queue.iter().position(|op| op.priority < priority)
            .unwrap_or(queue.len());
        queue.insert(insert_pos, queued_op);
        
        // Update statistics
        {
            let mut stats = self.statistics.lock().unwrap();
            stats.total_operations_queued += 1;
            stats.current_queue_size = queue.len();
        }
        
        Ok(())
    }
    
    /// Wait for a queued operation to start
    async fn wait_for_operation_start(&self, operation_id: String) -> Result<OperationHandle> {
        let timeout = self.config.operation_timeout;
        let start_time = Instant::now();
        
        loop {
            if start_time.elapsed() > timeout {
                return Err(PdfSignError::Concurrency {
                    message: format!("Operation {} timed out waiting to start", operation_id),
                });
            }
            
            // Check if operation has started
            {
                let active_ops = self.active_operations.lock().unwrap();
                if let Some(op_info) = active_ops.get(&operation_id) {
                    // Operation has started, create handle
                    let permit = self.operation_semaphore.acquire().await
                        .map_err(|_| PdfSignError::Concurrency {
                            message: "Failed to acquire operation permit".to_string(),
                        })?;
                    
                    return Ok(OperationHandle {
                        operation_id: operation_id.clone(),
                        operation_type: op_info.operation_type.clone(),
                        manager: Arc::new(self.clone()),
                        _permit: permit,
                    });
                }
            }
            
            // Wait for notification or timeout
            let (lock, cvar) = &*self.completion_notifier;
            let _guard = cvar.wait_timeout(
                lock.lock().unwrap(),
                Duration::from_millis(100)
            ).unwrap();
        }
    }
    
    /// Complete an operation and potentially start queued operations
    pub fn complete_operation(&self, operation_id: &str) -> Result<()> {
        let start_time = {
            let mut active_ops = self.active_operations.lock().unwrap();
            let op_info = active_ops.remove(operation_id)
                .ok_or_else(|| PdfSignError::Concurrency {
                    message: format!("Operation {} not found", operation_id),
                })?;
            op_info.start_time
        };
        
        // Update statistics
        {
            let mut stats = self.statistics.lock().unwrap();
            stats.total_operations_completed += 1;
            
            let duration_ms = start_time.elapsed().as_millis() as f64;
            let total_duration = stats.average_operation_duration_ms * (stats.total_operations_completed - 1) as f64;
            stats.average_operation_duration_ms = (total_duration + duration_ms) / stats.total_operations_completed as f64;
        }
        
        // Notify waiting operations
        let (lock, cvar) = &*self.completion_notifier;
        let mut started = lock.lock().unwrap();
        *started = true;
        cvar.notify_all();
        
        // Try to start queued operations
        self.try_start_queued_operations()?;
        
        Ok(())
    }
    
    /// Try to start queued operations
    fn try_start_queued_operations(&self) -> Result<()> {
        let mut queue = self.operation_queue.lock().unwrap();
        let mut operations_to_start = Vec::new();
        
        // Find operations that can start
        let mut i = 0;
        while i < queue.len() {
            let can_start = match queue[i].operation_type {
                OperationType::Read => {
                    let active_ops = self.active_operations.lock().unwrap();
                    let active_reads = active_ops.values()
                        .filter(|op| op.operation_type == OperationType::Read)
                        .count();
                    active_reads < self.config.max_concurrent_reads
                }
                OperationType::Write | OperationType::Mixed => {
                    let active_ops = self.active_operations.lock().unwrap();
                    active_ops.is_empty()
                }
            };
            
            if can_start {
                let op = queue.remove(i).unwrap();
                operations_to_start.push(op);
            } else {
                i += 1;
            }
        }
        
        // Update queue size statistics
        {
            let mut stats = self.statistics.lock().unwrap();
            stats.current_queue_size = queue.len();
        }
        
        drop(queue); // Release queue lock
        
        // Start the operations
        for op in operations_to_start {
            // In a real implementation, we would start these operations
            // For now, just call the completion callback
            (op.completion_callback)(Ok(()));
        }
        
        Ok(())
    }
    
    /// Generate unique operation ID
    fn generate_operation_id(&self) -> String {
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_nanos();
        
        format!("op_{}_{}", timestamp, fastrand::u64(..))
    }
    
    /// Get current statistics
    pub fn get_statistics(&self) -> ConcurrentOperationStatistics {
        self.statistics.lock().unwrap().clone()
    }
    
    /// Detect potential deadlocks
    pub fn detect_deadlocks(&self) -> Result<Vec<String>> {
        let active_ops = self.active_operations.lock().unwrap();
        let mut potential_deadlocks = Vec::new();
        
        // Simple deadlock detection: operations running longer than threshold
        let deadlock_threshold = self.config.deadlock_detection_timeout;
        
        for (op_id, op_info) in active_ops.iter() {
            if op_info.start_time.elapsed() > deadlock_threshold {
                potential_deadlocks.push(format!(
                    "Operation {} has been running for {:?}",
                    op_id,
                    op_info.start_time.elapsed()
                ));
            }
        }
        
        if !potential_deadlocks.is_empty() {
            let mut stats = self.statistics.lock().unwrap();
            stats.deadlocks_detected += potential_deadlocks.len() as u64;
        }
        
        Ok(potential_deadlocks)
    }
}

// Clone implementation for ConcurrentOperationManager
impl Clone for ConcurrentOperationManager {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            active_operations: Arc::clone(&self.active_operations),
            operation_queue: Arc::clone(&self.operation_queue),
            operation_semaphore: Arc::clone(&self.operation_semaphore),
            completion_notifier: Arc::clone(&self.completion_notifier),
            statistics: Arc::clone(&self.statistics),
        }
    }
}

/// Handle for managing an active operation
pub struct OperationHandle {
    operation_id: String,
    operation_type: OperationType,
    manager: Arc<ConcurrentOperationManager>,
    _permit: SemaphorePermit<'static>,
}

impl OperationHandle {
    /// Get the operation ID
    pub fn operation_id(&self) -> &str {
        &self.operation_id
    }
    
    /// Get the operation type
    pub fn operation_type(&self) -> &OperationType {
        &self.operation_type
    }
    
    /// Complete the operation
    pub fn complete(self) -> Result<()> {
        self.manager.complete_operation(&self.operation_id)
    }
}

impl Drop for OperationHandle {
    fn drop(&mut self) {
        // Ensure operation is completed when handle is dropped
        let _ = self.manager.complete_operation(&self.operation_id);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tokio::time::sleep;
    
    #[test]
    fn test_concurrent_operation_config_default() {
        let config = ConcurrentOperationConfig::default();
        assert!(config.max_concurrent_reads > 0);
        assert_eq!(config.max_concurrent_writes, 1);
        assert!(config.max_queue_size > 0);
    }
    
    #[test]
    fn test_operation_priority_ordering() {
        assert!(OperationPriority::Critical > OperationPriority::High);
        assert!(OperationPriority::High > OperationPriority::Normal);
        assert!(OperationPriority::Normal > OperationPriority::Low);
    }
    
    #[tokio::test]
    async fn test_concurrent_operation_manager_creation() {
        let config = ConcurrentOperationConfig::default();
        let manager = ConcurrentOperationManager::new(config);
        
        let stats = manager.get_statistics();
        assert_eq!(stats.total_operations_started, 0);
        assert_eq!(stats.current_queue_size, 0);
    }
    
    #[tokio::test]
    async fn test_start_read_operation() {
        let config = ConcurrentOperationConfig {
            max_concurrent_reads: 2,
            ..ConcurrentOperationConfig::default()
        };
        let manager = ConcurrentOperationManager::new(config);
        
        let handle = manager.start_operation(
            OperationType::Read,
            OperationPriority::Normal,
            vec!["test_resource".to_string()],
        ).await.unwrap();
        
        assert_eq!(handle.operation_type(), &OperationType::Read);
        
        let stats = manager.get_statistics();
        assert_eq!(stats.total_operations_started, 1);
        
        handle.complete().unwrap();
        
        let stats = manager.get_statistics();
        assert_eq!(stats.total_operations_completed, 1);
    }
    
    #[tokio::test]
    async fn test_concurrent_read_operations() {
        let config = ConcurrentOperationConfig {
            max_concurrent_reads: 3,
            ..ConcurrentOperationConfig::default()
        };
        let manager = Arc::new(ConcurrentOperationManager::new(config));
        
        // Start multiple read operations concurrently
        let mut handles = vec![];
        for i in 0..3 {
            let manager_clone = Arc::clone(&manager);
            let handle = tokio::spawn(async move {
                let op_handle = manager_clone.start_operation(
                    OperationType::Read,
                    OperationPriority::Normal,
                    vec![format!("resource_{}", i)],
                ).await.unwrap();
                
                // Simulate some work
                sleep(Duration::from_millis(10)).await;
                
                op_handle.complete().unwrap();
                i
            });
            handles.push(handle);
        }
        
        // Wait for all operations to complete
        let mut results = vec![];
        for handle in handles {
            let result = handle.await.unwrap();
            results.push(result);
        }
        
        assert_eq!(results.len(), 3);
        
        let stats = manager.get_statistics();
        assert_eq!(stats.total_operations_completed, 3);
        assert!(stats.peak_concurrent_operations <= 3);
    }
    
    #[tokio::test]
    async fn test_write_operation_exclusivity() {
        let config = ConcurrentOperationConfig::default();
        let manager = Arc::new(ConcurrentOperationManager::new(config));
        
        // Start a write operation
        let write_handle = manager.start_operation(
            OperationType::Write,
            OperationPriority::Normal,
            vec!["exclusive_resource".to_string()],
        ).await.unwrap();
        
        // Try to start another operation (should be queued)
        let manager_clone = Arc::clone(&manager);
        let read_task = tokio::spawn(async move {
            let start_time = Instant::now();
            let _read_handle = manager_clone.start_operation(
                OperationType::Read,
                OperationPriority::Normal,
                vec!["read_resource".to_string()],
            ).await.unwrap();
            start_time.elapsed()
        });
        
        // Let the read operation get queued
        sleep(Duration::from_millis(10)).await;
        
        // Complete the write operation
        write_handle.complete().unwrap();
        
        // The read operation should now start
        let read_duration = read_task.await.unwrap();
        assert!(read_duration >= Duration::from_millis(10));
        
        let stats = manager.get_statistics();
        assert_eq!(stats.total_operations_completed, 2);
    }
    
    #[test]
    fn test_deadlock_detection() {
        let config = ConcurrentOperationConfig {
            deadlock_detection_timeout: Duration::from_millis(1),
            ..ConcurrentOperationConfig::default()
        };
        let manager = ConcurrentOperationManager::new(config);
        
        // Simulate a long-running operation by manually adding it
        {
            let mut active_ops = manager.active_operations.lock().unwrap();
            let operation_info = OperationInfo {
                operation_id: "long_running_op".to_string(),
                operation_type: OperationType::Write,
                thread_id: thread::current().id(),
                start_time: Instant::now() - Duration::from_secs(1), // Started 1 second ago
                priority: OperationPriority::Normal,
                held_resources: vec!["test_resource".to_string()],
            };
            active_ops.insert("long_running_op".to_string(), operation_info);
        }
        
        // Wait a bit to ensure the operation is considered long-running
        thread::sleep(Duration::from_millis(10));
        
        let deadlocks = manager.detect_deadlocks().unwrap();
        assert!(!deadlocks.is_empty());
        assert!(deadlocks[0].contains("long_running_op"));
    }
}