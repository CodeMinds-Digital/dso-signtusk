//! Performance optimization module
//! 
//! This module provides memory-efficient processing capabilities for large PDF documents
//! and cryptographic context reuse for improved performance.

pub mod streaming;
pub mod context_pool;
pub mod batch_processor;

pub use streaming::*;
pub use context_pool::*;
pub use batch_processor::*;

use crate::error::Result;

/// Initialize performance optimization features
pub fn initialize_performance_features() -> Result<()> {
    // Initialize performance optimization state
    Ok(())
}

/// Cleanup performance optimization features
pub fn cleanup_performance_features() -> Result<()> {
    // Cleanup performance optimization state
    Ok(())
}