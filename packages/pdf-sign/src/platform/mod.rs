//! Platform-specific implementations

pub mod abstraction;
pub mod windows;
pub mod macos;
pub mod linux;

pub use abstraction::*;

// Platform-specific exports
#[cfg(target_os = "windows")]
pub use windows::*;

#[cfg(target_os = "macos")]
pub use macos::*;

#[cfg(target_os = "linux")]
pub use linux::*;

use crate::error::Result;

/// Initialize platform-specific resources
pub fn initialize_platform() -> Result<()> {
    // Platform-specific initialization can be added here
    Ok(())
}

/// Cleanup platform-specific resources
pub fn cleanup_platform() -> Result<()> {
    // Platform-specific cleanup can be added here
    Ok(())
}