//! Cryptographic operations module

pub mod engine;
pub mod algorithms;
pub mod pkcs7;
pub mod pkcs7_parser;
pub mod timestamp;
pub mod optimized_engine;

pub use engine::*;
pub use algorithms::*;
pub use pkcs7::*;
pub use pkcs7_parser::*;
pub use timestamp::*;
pub use optimized_engine::*;

use crate::error::Result;

/// Initialize cryptographic contexts and resources
pub fn initialize_crypto_contexts() -> Result<()> {
    // Initialize global cryptographic state if needed
    Ok(())
}

/// Cleanup cryptographic contexts and resources
pub fn cleanup_crypto_contexts() -> Result<()> {
    // Cleanup cryptographic state and sensitive data
    Ok(())
}