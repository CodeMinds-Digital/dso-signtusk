//! Synchronization primitives for thread-safe PDF operations
//! 
//! This module provides specialized synchronization primitives optimized
//! for PDF signing operations, including reader-writer locks with priority
//! and resource-aware mutexes.

use crate::{
    error::{PdfSignError, Result},
};
use std::sync::{Arc, Mutex, RwLock, Condvar};
use std::collections::HashMap;
use std::time::{Duration, Instant};
use std::thread;

/// Priority-aware reader-writer lock for PDF operations
pub struct PriorityRwLock<T> {
    /// The protected data
    data: RwLock<T>,
    /// Priority queue for waiting operations
    priority_queue: Mutex<PriorityQueue>,
    /// Condition variable for notifications
    condition: Condvar,
    /// Configuration
    config: PriorityRwLockConfig,
}

/// Configuration for priority reader-writer lock
#[derive(Debug, Clone)]
pub struct PriorityRwLockConfig {
    /// Maximum number of concurrent readers
    pub max_concurrent_readers: usize,
    /// Whether to prioritize writers over readers
    pub writer_priority: bool,
    /// Timeout for lock acquisition
    pub lock_timeout: Duration,
    /// Whether to enable starvation prevention
    pub prevent_starvation: bool,
}

impl Default for PriorityRwLockConfig {
    fn default() -> Self {
        Self {
            max_concurrent_readers: num_cpus::get() * 2,
            writer_priority: true,
            lock_timeout: Duration::from_secs(30),
            prevent_starvation: true,
        }
    }
}

/// Priority queue for managing waiting operations
#[derive(Debug, Default)]
struct PriorityQueue {
    /// Waiting readers
    waiting_readers: Vec<WaitingOperation>,
    /// Waiting writers
    waiting_writers: Vec<WaitingOperation>,
    /// Current active readers
    active_readers: usize,
    /// Whether a writer is active
    active_writer: bool,
}

/// Information about a waiting operation
#[derive(Debug, Clone)]
struct WaitingOperation {
    /// Thread ID of the waiting operation
    thread_id: thread::ThreadId,
    /// Priority level
    priority: LockPriority,
    /// Time when the operation started waiting
    wait_start: Instant,
}

/// Priority levels for lock acquisition
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord)]
pub enum LockPriority {
    Low = 0,
    Normal = 1,
    High = 2,
    Critical = 3,
}

impl<T> PriorityRwLock<T> {
    pub fn new(data: T, config: PriorityRwLockConfig) -> Self {
        Self {
            data: RwLock::new(data),
            priority_queue: Mutex::new(PriorityQueue::default()),
            condition: Condvar::new(),
            config,
        }
    }
    
    /// Acquire a read lock with priority
    pub fn read_with_priority(&self, priority: LockPriority) -> Result<PriorityReadGuard<T>> {
        let start_time = Instant::now();
        
        loop {
            // Check timeout
            if start_time.elapsed() > self.config.lock_timeout {
                return Err(PdfSignError::Concurrency {
                    message: "Read lock acquisition timed out".to_string(),
                });
            }
            
            let mut queue = self.priority_queue.lock().unwrap();
            
            // Check if we can acquire the read lock
            if self.can_acquire_read_lock(&queue, &priority) {
                // Try to acquire the actual read lock
                if let Ok(guard) = self.data.try_read() {
                    queue.active_readers += 1;
                    return Ok(PriorityReadGuard {
                        guard,
                        priority_lock: self,
                    });
                }
            }
            
            // Add to waiting queue if not already there
            let thread_id = thread::current().id();
            if !queue.waiting_readers.iter().any(|op| op.thread_id == thread_id) {
                queue.waiting_readers.push(WaitingOperation {
                    thread_id,
                    priority: priority.clone(),
                    wait_start: start_time,
                });
                
                // Sort by priority (highest first)
                queue.waiting_readers.sort_by(|a, b| b.priority.cmp(&a.priority));
            }
            
            // Wait for notification
            queue = self.condition.wait_timeout(queue, Duration::from_millis(100)).unwrap().0;
        }
    }
    
    /// Acquire a write lock with priority
    pub fn write_with_priority(&self, priority: LockPriority) -> Result<PriorityWriteGuard<T>> {
        let start_time = Instant::now();
        
        loop {
            // Check timeout
            if start_time.elapsed() > self.config.lock_timeout {
                return Err(PdfSignError::Concurrency {
                    message: "Write lock acquisition timed out".to_string(),
                });
            }
            
            let mut queue = self.priority_queue.lock().unwrap();
            
            // Check if we can acquire the write lock
            if self.can_acquire_write_lock(&queue, &priority) {
                // Try to acquire the actual write lock
                if let Ok(guard) = self.data.try_write() {
                    queue.active_writer = true;
                    return Ok(PriorityWriteGuard {
                        guard,
                        priority_lock: self,
                    });
                }
            }
            
            // Add to waiting queue if not already there
            let thread_id = thread::current().id();
            if !queue.waiting_writers.iter().any(|op| op.thread_id == thread_id) {
                queue.waiting_writers.push(WaitingOperation {
                    thread_id,
                    priority: priority.clone(),
                    wait_start: start_time,
                });
                
                // Sort by priority (highest first)
                queue.waiting_writers.sort_by(|a, b| b.priority.cmp(&a.priority));
            }
            
            // Wait for notification
            queue = self.condition.wait_timeout(queue, Duration::from_millis(100)).unwrap().0;
        }
    }
    
    /// Check if a read lock can be acquired
    fn can_acquire_read_lock(&self, queue: &PriorityQueue, priority: &LockPriority) -> bool {
        // Cannot read if writer is active
        if queue.active_writer {
            return false;
        }
        
        // Check reader limit
        if queue.active_readers >= self.config.max_concurrent_readers {
            return false;
        }
        
        // Check writer priority
        if self.config.writer_priority && !queue.waiting_writers.is_empty() {
            // Allow read only if this reader has higher priority than waiting writers
            let highest_writer_priority = queue.waiting_writers.iter()
                .map(|op| &op.priority)
                .max()
                .unwrap_or(&LockPriority::Low);
            
            if priority <= highest_writer_priority {
                return false;
            }
        }
        
        // Check starvation prevention
        if self.config.prevent_starvation {
            let starvation_threshold = Duration::from_secs(10);
            if let Some(oldest_writer) = queue.waiting_writers.iter()
                .min_by_key(|op| op.wait_start) {
                if oldest_writer.wait_start.elapsed() > starvation_threshold {
                    return false; // Prevent reader starvation of writers
                }
            }
        }
        
        true
    }
    
    /// Check if a write lock can be acquired
    fn can_acquire_write_lock(&self, queue: &PriorityQueue, _priority: &LockPriority) -> bool {
        // Cannot write if any readers or writers are active
        queue.active_readers == 0 && !queue.active_writer
    }
    
    /// Notify waiting operations when a lock is released
    fn notify_waiting_operations(&self) {
        let mut queue = self.priority_queue.lock().unwrap();
        
        // Remove completed operations from waiting queues
        let current_thread = thread::current().id();
        queue.waiting_readers.retain(|op| op.thread_id != current_thread);
        queue.waiting_writers.retain(|op| op.thread_id != current_thread);
        
        // Notify all waiting operations
        self.condition.notify_all();
    }
}

/// Read guard with priority tracking
pub struct PriorityReadGuard<'a, T> {
    guard: std::sync::RwLockReadGuard<'a, T>,
    priority_lock: &'a PriorityRwLock<T>,
}

impl<'a, T> std::ops::Deref for PriorityReadGuard<'a, T> {
    type Target = T;
    
    fn deref(&self) -> &Self::Target {
        &*self.guard
    }
}

impl<'a, T> Drop for PriorityReadGuard<'a, T> {
    fn drop(&mut self) {
        // Decrement active readers count
        {
            let mut queue = self.priority_lock.priority_queue.lock().unwrap();
            if queue.active_readers > 0 {
                queue.active_readers -= 1;
            }
        }
        
        // Notify waiting operations
        self.priority_lock.notify_waiting_operations();
    }
}

/// Write guard with priority tracking
pub struct PriorityWriteGuard<'a, T> {
    guard: std::sync::RwLockWriteGuard<'a, T>,
    priority_lock: &'a PriorityRwLock<T>,
}

impl<'a, T> std::ops::Deref for PriorityWriteGuard<'a, T> {
    type Target = T;
    
    fn deref(&self) -> &Self::Target {
        &*self.guard
    }
}

impl<'a, T> std::ops::DerefMut for PriorityWriteGuard<'a, T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut *self.guard
    }
}

impl<'a, T> Drop for PriorityWriteGuard<'a, T> {
    fn drop(&mut self) {
        // Mark writer as inactive
        {
            let mut queue = self.priority_lock.priority_queue.lock().unwrap();
            queue.active_writer = false;
        }
        
        // Notify waiting operations
        self.priority_lock.notify_waiting_operations();
    }
}

/// Resource-aware mutex that tracks resource usage
pub struct ResourceAwareMutex<T> {
    /// The protected data
    data: Mutex<T>,
    /// Resource usage tracking
    resource_tracker: Mutex<ResourceTracker>,
    /// Configuration
    config: ResourceAwareMutexConfig,
}

/// Configuration for resource-aware mutex
#[derive(Debug, Clone)]
pub struct ResourceAwareMutexConfig {
    /// Maximum memory usage allowed (in bytes)
    pub max_memory_usage: usize,
    /// Maximum number of file handles
    pub max_file_handles: usize,
    /// Resource cleanup threshold
    pub cleanup_threshold: f64, // 0.0 to 1.0
}

impl Default for ResourceAwareMutexConfig {
    fn default() -> Self {
        Self {
            max_memory_usage: 1024 * 1024 * 1024, // 1GB
            max_file_handles: 1000,
            cleanup_threshold: 0.8, // 80%
        }
    }
}

/// Tracks resource usage for the mutex
#[derive(Debug, Default)]
struct ResourceTracker {
    /// Current memory usage in bytes
    current_memory_usage: usize,
    /// Current number of file handles
    current_file_handles: usize,
    /// Peak memory usage
    peak_memory_usage: usize,
    /// Peak file handles
    peak_file_handles: usize,
}

impl<T> ResourceAwareMutex<T> {
    pub fn new(data: T, config: ResourceAwareMutexConfig) -> Self {
        Self {
            data: Mutex::new(data),
            resource_tracker: Mutex::new(ResourceTracker::default()),
            config,
        }
    }
    
    /// Lock with resource checking
    pub fn lock_with_resources(&self, required_memory: usize, required_files: usize) -> Result<ResourceAwareGuard<T>> {
        // Check resource availability
        {
            let tracker = self.resource_tracker.lock().unwrap();
            
            if tracker.current_memory_usage + required_memory > self.config.max_memory_usage {
                return Err(PdfSignError::Resource {
                    message: format!(
                        "Insufficient memory: required {}, available {}",
                        required_memory,
                        self.config.max_memory_usage - tracker.current_memory_usage
                    ),
                });
            }
            
            if tracker.current_file_handles + required_files > self.config.max_file_handles {
                return Err(PdfSignError::Resource {
                    message: format!(
                        "Insufficient file handles: required {}, available {}",
                        required_files,
                        self.config.max_file_handles - tracker.current_file_handles
                    ),
                });
            }
        }
        
        // Acquire the lock
        let guard = self.data.lock().unwrap();
        
        // Update resource tracking
        {
            let mut tracker = self.resource_tracker.lock().unwrap();
            tracker.current_memory_usage += required_memory;
            tracker.current_file_handles += required_files;
            tracker.peak_memory_usage = tracker.peak_memory_usage.max(tracker.current_memory_usage);
            tracker.peak_file_handles = tracker.peak_file_handles.max(tracker.current_file_handles);
        }
        
        Ok(ResourceAwareGuard {
            guard,
            mutex: self,
            allocated_memory: required_memory,
            allocated_files: required_files,
        })
    }
    
    /// Get current resource usage
    pub fn get_resource_usage(&self) -> ResourceUsage {
        let tracker = self.resource_tracker.lock().unwrap();
        ResourceUsage {
            current_memory_usage: tracker.current_memory_usage,
            current_file_handles: tracker.current_file_handles,
            peak_memory_usage: tracker.peak_memory_usage,
            peak_file_handles: tracker.peak_file_handles,
            memory_usage_ratio: tracker.current_memory_usage as f64 / self.config.max_memory_usage as f64,
            file_handle_usage_ratio: tracker.current_file_handles as f64 / self.config.max_file_handles as f64,
        }
    }
    
    /// Check if cleanup is needed
    pub fn needs_cleanup(&self) -> bool {
        let usage = self.get_resource_usage();
        usage.memory_usage_ratio > self.config.cleanup_threshold ||
        usage.file_handle_usage_ratio > self.config.cleanup_threshold
    }
}

/// Guard for resource-aware mutex
pub struct ResourceAwareGuard<'a, T> {
    guard: std::sync::MutexGuard<'a, T>,
    mutex: &'a ResourceAwareMutex<T>,
    allocated_memory: usize,
    allocated_files: usize,
}

impl<'a, T> std::ops::Deref for ResourceAwareGuard<'a, T> {
    type Target = T;
    
    fn deref(&self) -> &Self::Target {
        &*self.guard
    }
}

impl<'a, T> std::ops::DerefMut for ResourceAwareGuard<'a, T> {
    fn deref_mut(&mut self) -> &mut Self::Target {
        &mut *self.guard
    }
}

impl<'a, T> Drop for ResourceAwareGuard<'a, T> {
    fn drop(&mut self) {
        // Release allocated resources
        let mut tracker = self.mutex.resource_tracker.lock().unwrap();
        tracker.current_memory_usage = tracker.current_memory_usage.saturating_sub(self.allocated_memory);
        tracker.current_file_handles = tracker.current_file_handles.saturating_sub(self.allocated_files);
    }
}

/// Resource usage information
#[derive(Debug, Clone)]
pub struct ResourceUsage {
    pub current_memory_usage: usize,
    pub current_file_handles: usize,
    pub peak_memory_usage: usize,
    pub peak_file_handles: usize,
    pub memory_usage_ratio: f64,
    pub file_handle_usage_ratio: f64,
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::thread;
    use std::time::Duration;
    
    #[test]
    fn test_priority_rw_lock_config_default() {
        let config = PriorityRwLockConfig::default();
        assert!(config.max_concurrent_readers > 0);
        assert!(config.writer_priority);
        assert!(config.prevent_starvation);
    }
    
    #[test]
    fn test_lock_priority_ordering() {
        assert!(LockPriority::Critical > LockPriority::High);
        assert!(LockPriority::High > LockPriority::Normal);
        assert!(LockPriority::Normal > LockPriority::Low);
    }
    
    #[test]
    fn test_priority_rw_lock_read() {
        let config = PriorityRwLockConfig::default();
        let lock = PriorityRwLock::new(42, config);
        
        let guard = lock.read_with_priority(LockPriority::Normal).unwrap();
        assert_eq!(*guard, 42);
    }
    
    #[test]
    fn test_priority_rw_lock_write() {
        let config = PriorityRwLockConfig::default();
        let lock = PriorityRwLock::new(42, config);
        
        {
            let mut guard = lock.write_with_priority(LockPriority::Normal).unwrap();
            *guard = 100;
        }
        
        let guard = lock.read_with_priority(LockPriority::Normal).unwrap();
        assert_eq!(*guard, 100);
    }
    
    #[test]
    fn test_concurrent_readers() {
        let config = PriorityRwLockConfig {
            max_concurrent_readers: 3,
            ..PriorityRwLockConfig::default()
        };
        let lock = Arc::new(PriorityRwLock::new(42, config));
        
        let mut handles = vec![];
        
        // Start multiple concurrent readers
        for i in 0..3 {
            let lock_clone = Arc::clone(&lock);
            let handle = thread::spawn(move || {
                let guard = lock_clone.read_with_priority(LockPriority::Normal).unwrap();
                thread::sleep(Duration::from_millis(10));
                *guard + i
            });
            handles.push(handle);
        }
        
        // Wait for all readers to complete
        let mut results = vec![];
        for handle in handles {
            let result = handle.join().unwrap();
            results.push(result);
        }
        
        assert_eq!(results.len(), 3);
        for (i, result) in results.iter().enumerate() {
            assert_eq!(*result, 42 + i);
        }
    }
    
    #[test]
    fn test_resource_aware_mutex() {
        let config = ResourceAwareMutexConfig {
            max_memory_usage: 1000,
            max_file_handles: 10,
            cleanup_threshold: 0.8,
        };
        let mutex = ResourceAwareMutex::new(42, config);
        
        // Lock with reasonable resource requirements
        {
            let guard = mutex.lock_with_resources(100, 2).unwrap();
            assert_eq!(*guard, 42);
            
            let usage = mutex.get_resource_usage();
            assert_eq!(usage.current_memory_usage, 100);
            assert_eq!(usage.current_file_handles, 2);
        }
        
        // Resources should be released after guard is dropped
        let usage = mutex.get_resource_usage();
        assert_eq!(usage.current_memory_usage, 0);
        assert_eq!(usage.current_file_handles, 0);
    }
    
    #[test]
    fn test_resource_aware_mutex_insufficient_resources() {
        let config = ResourceAwareMutexConfig {
            max_memory_usage: 100,
            max_file_handles: 5,
            cleanup_threshold: 0.8,
        };
        let mutex = ResourceAwareMutex::new(42, config);
        
        // Try to lock with excessive memory requirement
        let result = mutex.lock_with_resources(200, 2);
        assert!(result.is_err());
        
        // Try to lock with excessive file handle requirement
        let result = mutex.lock_with_resources(50, 10);
        assert!(result.is_err());
    }
    
    #[test]
    fn test_resource_cleanup_threshold() {
        let config = ResourceAwareMutexConfig {
            max_memory_usage: 100,
            max_file_handles: 10,
            cleanup_threshold: 0.8,
        };
        let mutex = ResourceAwareMutex::new(42, config);
        
        // Use resources below threshold
        {
            let _guard = mutex.lock_with_resources(70, 7).unwrap();
            assert!(!mutex.needs_cleanup());
        }
        
        // Use resources above threshold
        {
            let _guard = mutex.lock_with_resources(90, 9).unwrap();
            assert!(mutex.needs_cleanup());
        }
    }
}