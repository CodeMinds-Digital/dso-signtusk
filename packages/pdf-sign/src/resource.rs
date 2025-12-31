//! Resource management and cleanup for the PDF signing library
//! 
//! This module provides utilities for managing cryptographic resources,
//! temporary files, and ensuring proper cleanup on success or failure.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, Weak};
use std::sync::atomic::{AtomicBool, Ordering};
use crate::error::{PdfSignError, Result};

/// Initialize resource management system
pub fn initialize_resource_manager() -> Result<()> {
    // Initialize global resource tracking if needed
    Ok(())
}

/// Cleanup resource management system
pub fn cleanup_resource_manager() -> Result<()> {
    // Cleanup global resource state
    Ok(())
}

/// Unique identifier for resources
pub type ResourceId = u64;

/// Resource types that need cleanup
#[derive(Debug, Clone)]
pub enum ResourceType {
    /// Temporary file that should be deleted
    TempFile(PathBuf),
    /// Cryptographic context that should be cleared
    CryptoContext(String),
    /// Memory buffer that should be zeroed
    SecureMemory(usize),
    /// Custom resource with cleanup callback
    Custom(String),
}

/// Resource cleanup callback
pub type CleanupCallback = Box<dyn Fn() -> Result<()> + Send + Sync>;

/// Resource entry with cleanup information
struct ResourceEntry {
    resource_type: ResourceType,
    cleanup_callback: Option<CleanupCallback>,
    is_cleaned: AtomicBool,
}

/// Resource manager for tracking and cleaning up resources
pub struct ResourceManager {
    resources: Arc<Mutex<HashMap<ResourceId, ResourceEntry>>>,
    next_id: Arc<Mutex<ResourceId>>,
    auto_cleanup: AtomicBool,
}

impl ResourceManager {
    /// Create a new resource manager
    pub fn new() -> Self {
        Self {
            resources: Arc::new(Mutex::new(HashMap::new())),
            next_id: Arc::new(Mutex::new(1)),
            auto_cleanup: AtomicBool::new(true),
        }
    }
    
    /// Register a resource for cleanup
    pub fn register_resource(&self, resource_type: ResourceType) -> Result<ResourceId> {
        let mut next_id = self.next_id.lock()
            .map_err(|_| PdfSignError::resource("Failed to acquire resource ID lock"))?;
        
        let id = *next_id;
        *next_id += 1;
        
        let entry = ResourceEntry {
            resource_type,
            cleanup_callback: None,
            is_cleaned: AtomicBool::new(false),
        };
        
        let mut resources = self.resources.lock()
            .map_err(|_| PdfSignError::resource("Failed to acquire resources lock"))?;
        
        resources.insert(id, entry);
        Ok(id)
    }
    
    /// Register a resource with custom cleanup callback
    pub fn register_resource_with_callback(
        &self,
        resource_type: ResourceType,
        cleanup_callback: CleanupCallback,
    ) -> Result<ResourceId> {
        let mut next_id = self.next_id.lock()
            .map_err(|_| PdfSignError::resource("Failed to acquire resource ID lock"))?;
        
        let id = *next_id;
        *next_id += 1;
        
        let entry = ResourceEntry {
            resource_type,
            cleanup_callback: Some(cleanup_callback),
            is_cleaned: AtomicBool::new(false),
        };
        
        let mut resources = self.resources.lock()
            .map_err(|_| PdfSignError::resource("Failed to acquire resources lock"))?;
        
        resources.insert(id, entry);
        Ok(id)
    }
    
    /// Clean up a specific resource
    pub fn cleanup_resource(&self, id: ResourceId) -> Result<()> {
        let mut resources = self.resources.lock()
            .map_err(|_| PdfSignError::resource("Failed to acquire resources lock"))?;
        
        if let Some(entry) = resources.get(&id) {
            if entry.is_cleaned.load(Ordering::Acquire) {
                return Ok(()); // Already cleaned
            }
            
            // Perform cleanup based on resource type
            let cleanup_result = match &entry.resource_type {
                ResourceType::TempFile(path) => {
                    if path.exists() {
                        std::fs::remove_file(path)
                            .map_err(|e| PdfSignError::io(format!("Failed to remove temp file: {}", e)))?;
                    }
                    Ok(())
                }
                ResourceType::CryptoContext(context_name) => {
                    // In a real implementation, this would clear cryptographic contexts
                    log::debug!("Cleaning up crypto context: {}", context_name);
                    Ok(())
                }
                ResourceType::SecureMemory(size) => {
                    // In a real implementation, this would zero sensitive memory
                    log::debug!("Zeroing {} bytes of secure memory", size);
                    Ok(())
                }
                ResourceType::Custom(_name) => {
                    // Custom cleanup handled by callback
                    Ok(())
                }
            };
            
            // Execute custom cleanup callback if present
            if let Some(callback) = &entry.cleanup_callback {
                callback()?;
            }
            
            entry.is_cleaned.store(true, Ordering::Release);
            cleanup_result
        } else {
            Err(PdfSignError::resource(format!("Resource {} not found", id)))
        }
    }
    
    /// Clean up all registered resources
    pub fn cleanup_all(&self) -> Result<()> {
        let resources = self.resources.lock()
            .map_err(|_| PdfSignError::resource("Failed to acquire resources lock"))?;
        
        let mut errors = Vec::new();
        
        for (&id, _) in resources.iter() {
            if let Err(e) = self.cleanup_resource(id) {
                errors.push(format!("Resource {}: {}", id, e));
            }
        }
        
        if !errors.is_empty() {
            return Err(PdfSignError::resource(format!(
                "Failed to cleanup {} resources: {}",
                errors.len(),
                errors.join(", ")
            )));
        }
        
        Ok(())
    }
    
    /// Remove a resource from tracking (without cleanup)
    pub fn unregister_resource(&self, id: ResourceId) -> Result<()> {
        let mut resources = self.resources.lock()
            .map_err(|_| PdfSignError::resource("Failed to acquire resources lock"))?;
        
        resources.remove(&id);
        Ok(())
    }
    
    /// Get the number of registered resources
    pub fn resource_count(&self) -> usize {
        self.resources.lock()
            .map(|resources| resources.len())
            .unwrap_or(0)
    }
    
    /// Enable or disable automatic cleanup on drop
    pub fn set_auto_cleanup(&self, enabled: bool) {
        self.auto_cleanup.store(enabled, Ordering::Release);
    }
    
    /// Check if a resource is registered
    pub fn is_resource_registered(&self, id: ResourceId) -> bool {
        self.resources.lock()
            .map(|resources| resources.contains_key(&id))
            .unwrap_or(false)
    }
    
    /// Check if a resource has been cleaned up
    pub fn is_resource_cleaned(&self, id: ResourceId) -> Result<bool, crate::error::PdfSignError> {
        let resources = self.resources.lock()
            .map_err(|_| crate::error::PdfSignError::concurrency("Failed to acquire resource lock"))?;
        
        Ok(resources.get(&id)
            .map(|entry| entry.is_cleaned.load(Ordering::Acquire))
            .unwrap_or(false))
    }
}

impl Drop for ResourceManager {
    fn drop(&mut self) {
        if self.auto_cleanup.load(Ordering::Acquire) {
            if let Err(e) = self.cleanup_all() {
                log::error!("Failed to cleanup resources on drop: {}", e);
            }
        }
    }
}

/// RAII guard for automatic resource cleanup
pub struct ResourceGuard {
    manager: Weak<ResourceManager>,
    resource_id: ResourceId,
    auto_cleanup: bool,
}

impl ResourceGuard {
    /// Create a new resource guard
    pub fn new(manager: Arc<ResourceManager>, resource_id: ResourceId) -> Self {
        Self {
            manager: Arc::downgrade(&manager),
            resource_id,
            auto_cleanup: true,
        }
    }
    
    /// Disable automatic cleanup on drop
    pub fn disable_auto_cleanup(&mut self) {
        self.auto_cleanup = false;
    }
    
    /// Manually trigger cleanup
    pub fn cleanup(&mut self) -> Result<()> {
        if let Some(manager) = self.manager.upgrade() {
            manager.cleanup_resource(self.resource_id)?;
            self.auto_cleanup = false; // Prevent double cleanup
        }
        Ok(())
    }
    
    /// Get the resource ID
    pub fn resource_id(&self) -> ResourceId {
        self.resource_id
    }
}

impl Drop for ResourceGuard {
    fn drop(&mut self) {
        if self.auto_cleanup {
            if let Some(manager) = self.manager.upgrade() {
                if let Err(e) = manager.cleanup_resource(self.resource_id) {
                    log::error!("Failed to cleanup resource {} on drop: {}", self.resource_id, e);
                }
            }
        }
    }
}

/// Scoped resource manager for automatic cleanup
pub struct ScopedResourceManager {
    manager: Arc<ResourceManager>,
    resource_ids: Vec<ResourceId>,
}

impl ScopedResourceManager {
    /// Create a new scoped resource manager
    pub fn new() -> Self {
        Self {
            manager: Arc::new(ResourceManager::new()),
            resource_ids: Vec::new(),
        }
    }
    
    /// Register a temporary file for cleanup
    pub fn register_temp_file<P: Into<PathBuf>>(&mut self, path: P) -> Result<ResourceGuard> {
        let resource_type = ResourceType::TempFile(path.into());
        let id = self.manager.register_resource(resource_type)?;
        self.resource_ids.push(id);
        Ok(ResourceGuard::new(self.manager.clone(), id))
    }
    
    /// Register a cryptographic context for cleanup
    pub fn register_crypto_context<S: Into<String>>(&mut self, name: S) -> Result<ResourceGuard> {
        let resource_type = ResourceType::CryptoContext(name.into());
        let id = self.manager.register_resource(resource_type)?;
        self.resource_ids.push(id);
        Ok(ResourceGuard::new(self.manager.clone(), id))
    }
    
    /// Register secure memory for cleanup
    pub fn register_secure_memory(&mut self, size: usize) -> Result<ResourceGuard> {
        let resource_type = ResourceType::SecureMemory(size);
        let id = self.manager.register_resource(resource_type)?;
        self.resource_ids.push(id);
        Ok(ResourceGuard::new(self.manager.clone(), id))
    }
    
    /// Register a custom resource with cleanup callback
    pub fn register_custom_resource<S: Into<String>>(
        &mut self,
        name: S,
        cleanup_callback: CleanupCallback,
    ) -> Result<ResourceGuard> {
        let resource_type = ResourceType::Custom(name.into());
        let id = self.manager.register_resource_with_callback(resource_type, cleanup_callback)?;
        self.resource_ids.push(id);
        Ok(ResourceGuard::new(self.manager.clone(), id))
    }
    
    /// Get the underlying resource manager
    pub fn manager(&self) -> Arc<ResourceManager> {
        self.manager.clone()
    }
    
    /// Get the number of registered resources
    pub fn resource_count(&self) -> usize {
        self.resource_ids.len()
    }
}

impl Drop for ScopedResourceManager {
    fn drop(&mut self) {
        // Clean up all resources in reverse order
        for &id in self.resource_ids.iter().rev() {
            if let Err(e) = self.manager.cleanup_resource(id) {
                log::error!("Failed to cleanup resource {} in scoped manager: {}", id, e);
            }
        }
    }
}

/// Utility functions for common resource management patterns
pub mod utils {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    
    /// Create a temporary file and register it for cleanup
    pub fn create_temp_file(
        manager: &mut ScopedResourceManager,
        prefix: &str,
        suffix: &str,
    ) -> Result<(File, PathBuf, ResourceGuard)> {
        let temp_dir = std::env::temp_dir();
        let file_name = format!("{}_{}{}", prefix, uuid::Uuid::new_v4(), suffix);
        let path = temp_dir.join(file_name);
        
        let file = File::create(&path)
            .map_err(|e| PdfSignError::io(format!("Failed to create temp file: {}", e)))?;
        
        let guard = manager.register_temp_file(&path)?;
        
        Ok((file, path, guard))
    }
    
    /// Write data to a temporary file and register it for cleanup
    pub fn write_temp_file(
        manager: &mut ScopedResourceManager,
        prefix: &str,
        suffix: &str,
        data: &[u8],
    ) -> Result<(PathBuf, ResourceGuard)> {
        let (mut file, path, guard) = create_temp_file(manager, prefix, suffix)?;
        
        file.write_all(data)
            .map_err(|e| PdfSignError::io(format!("Failed to write temp file: {}", e)))?;
        
        file.sync_all()
            .map_err(|e| PdfSignError::io(format!("Failed to sync temp file: {}", e)))?;
        
        Ok((path, guard))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;
    
    #[test]
    fn test_resource_manager_basic() {
        let manager = ResourceManager::new();
        
        // Register a temp file resource
        let temp_path = std::env::temp_dir().join("test_resource.tmp");
        let resource_type = ResourceType::TempFile(temp_path.clone());
        let id = manager.register_resource(resource_type).unwrap();
        
        // Create the file
        File::create(&temp_path).unwrap();
        assert!(temp_path.exists());
        
        // Clean up the resource
        manager.cleanup_resource(id).unwrap();
        assert!(!temp_path.exists());
    }
    
    #[test]
    fn test_scoped_resource_manager() {
        let temp_path = std::env::temp_dir().join("test_scoped.tmp");
        
        {
            let mut scoped = ScopedResourceManager::new();
            
            // Create a temp file
            File::create(&temp_path).unwrap();
            let _guard = scoped.register_temp_file(&temp_path).unwrap();
            
            assert!(temp_path.exists());
            assert_eq!(scoped.resource_count(), 1);
        } // scoped drops here, should clean up the file
        
        assert!(!temp_path.exists());
    }
    
    #[test]
    fn test_resource_guard() {
        let manager = Arc::new(ResourceManager::new());
        let temp_path = std::env::temp_dir().join("test_guard.tmp");
        
        // Create the file
        File::create(&temp_path).unwrap();
        
        {
            let resource_type = ResourceType::TempFile(temp_path.clone());
            let id = manager.register_resource(resource_type).unwrap();
            let _guard = ResourceGuard::new(manager.clone(), id);
            
            assert!(temp_path.exists());
        } // guard drops here, should clean up the file
        
        assert!(!temp_path.exists());
    }
}