//! Streaming operations for memory-efficient PDF processing
//! 
//! This module implements streaming operations that allow processing of large PDF documents
//! without loading the entire document into memory at once.

use crate::{
    error::{PdfSignError, Result},
    types::*,
};
use sha2::Digest;
use std::io::{Read, Seek, SeekFrom, BufReader, BufRead};
use std::fs::File;
use std::path::Path;

/// Configuration for streaming operations
#[derive(Debug, Clone)]
pub struct StreamingConfig {
    /// Buffer size for reading operations (in bytes)
    pub buffer_size: usize,
    /// Maximum memory usage for streaming operations (in bytes)
    pub max_memory_usage: usize,
    /// Whether to use memory mapping for large files
    pub use_memory_mapping: bool,
    /// Threshold size for switching to streaming mode (in bytes)
    pub streaming_threshold: usize,
}

impl Default for StreamingConfig {
    fn default() -> Self {
        Self {
            buffer_size: 64 * 1024, // 64KB buffer
            max_memory_usage: 100 * 1024 * 1024, // 100MB max memory
            use_memory_mapping: true,
            streaming_threshold: 50 * 1024 * 1024, // 50MB threshold
        }
    }
}

/// Streaming PDF reader for memory-efficient processing
pub struct StreamingPdfReader<R: Read + Seek> {
    reader: BufReader<R>,
    config: StreamingConfig,
    file_size: u64,
    current_position: u64,
}

impl<R: Read + Seek> StreamingPdfReader<R> {
    /// Create a new streaming PDF reader
    pub fn new(mut reader: R, config: StreamingConfig) -> Result<Self> {
        // Get file size
        let file_size = reader.seek(SeekFrom::End(0))
            .map_err(|e| PdfSignError::Io {
                message: format!("Failed to determine file size: {,
                code: crate::error::ErrorCode::Io,}", e),
                code: crate::error::ErrorCode::Io,
            })?;
        
        // Reset to beginning
        reader.seek(SeekFrom::Start(0))
            .map_err(|e| PdfSignError::Io {
                message: format!("Failed to seek to start: {,
                code: crate::error::ErrorCode::Io,}", e),
                code: crate::error::ErrorCode::Io,
            })?;
        
        let buf_reader = BufReader::with_capacity(config.buffer_size, reader);
        
        Ok(Self {
            reader: buf_reader,
            config,
            file_size,
            current_position: 0,
        })
    }
    
    /// Read PDF header without loading entire file
    pub fn read_header(&mut self) -> Result<String> {
        self.seek_to_position(0)?;
        
        let mut header_buffer = vec![0u8; 16]; // PDF header is typically 8-16 bytes
        let bytes_read = self.reader.read(&mut header_buffer)
            .map_err(|e| PdfSignError::Io {
                message: format!("Failed to read PDF header: {,
                code: crate::error::ErrorCode::Io,}", e),
                code: crate::error::ErrorCode::Io,
            })?;
        
        if bytes_read < 8 {
            return Err(PdfSignError::PdfParsing {
                message: "File too small to contain valid PDF header".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        let header_str = std::str::from_utf8(&header_buffer[0..8])
            .map_err(|_| PdfSignError::PdfParsing {
                message: "Invalid PDF header encoding".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,})?;
        
        if !header_str.starts_with("%PDF-") {
            return Err(PdfSignError::PdfParsing {
                message: "Invalid PDF header signature".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        Ok(header_str[5..].trim().to_string())
    }
    
    /// Find cross-reference table offset using streaming approach
    pub fn find_xref_offset(&mut self) -> Result<u64> {
        // Start from end of file and work backwards
        let search_size = 1024.min(self.file_size); // Search last 1KB
        let start_pos = self.file_size.saturating_sub(search_size);
        
        self.seek_to_position(start_pos)?;
        
        let mut buffer = vec![0u8; search_size as usize];
        let bytes_read = self.reader.read(&mut buffer)
            .map_err(|e| PdfSignError::Io {
                message: format!("Failed to read end of file: {,
                code: crate::error::ErrorCode::Io,}", e),
                code: crate::error::ErrorCode::Io,
            })?;
        
        // Find "startxref" keyword
        let search_bytes = b"startxref";
        let mut last_pos = None;
        
        for i in 0..bytes_read.saturating_sub(search_bytes.len()) {
            if &buffer[i..i + search_bytes.len()] == search_bytes {
                last_pos = Some(i);
            }
        }
        
        let startxref_pos = last_pos.ok_or_else(|| PdfSignError::PdfParsing {
            message: "No startxref found in PDF".to_string(),
            code: crate::error::ErrorCode::PdfParsing,
        ,
                code: crate::error::ErrorCode::PdfParsing,})?;
        
        // Parse offset after startxref
        let offset_start = startxref_pos + search_bytes.len();
        let offset_end = bytes_read.min(offset_start + 20);
        
        let offset_str = std::str::from_utf8(&buffer[offset_start..offset_end])
            .map_err(|_| PdfSignError::PdfParsing {
                message: "Invalid encoding in startxref section".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,})?
            .trim()
            .lines()
            .next()
            .ok_or_else(|| PdfSignError::PdfParsing {
                message: "No offset found after startxref".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,})?;
        
        offset_str.parse::<u64>()
            .map_err(|_| PdfSignError::PdfParsing {
                message: format!("Invalid xref offset: {,
                code: crate::error::ErrorCode::PdfParsing,}", offset_str),
                code: crate::error::ErrorCode::PdfParsing,
            })
    }
    
    /// Read a chunk of data at specific position
    pub fn read_chunk_at(&mut self, position: u64, size: usize) -> Result<Vec<u8>> {
        self.seek_to_position(position)?;
        
        let mut buffer = vec![0u8; size];
        let bytes_read = self.reader.read(&mut buffer)
            .map_err(|e| PdfSignError::Io {
                message: format!("Failed to read chunk at position {,
                code: crate::error::ErrorCode::Io,}: {}", position, e),
                code: crate::error::ErrorCode::Io,
            })?;
        
        buffer.truncate(bytes_read);
        Ok(buffer)
    }
    
    /// Stream through PDF objects without loading all into memory
    pub fn stream_objects<F>(&mut self, mut callback: F) -> Result<()>
    where
        F: FnMut(u32, Vec<u8>) -> Result<bool>, // Returns true to continue, false to stop
    {
        let xref_offset = self.find_xref_offset()?;
        self.seek_to_position(xref_offset)?;
        
        // Parse xref table to get object positions
        let object_positions = self.parse_xref_table_streaming()?;
        
        // Stream through each object
        for (obj_num, offset) in object_positions {
            // Read object header to determine size
            let chunk_size = self.estimate_object_size(offset)?;
            let object_data = self.read_chunk_at(offset, chunk_size)?;
            
            // Call callback with object data
            if !callback(obj_num, object_data)? {
                break; // Stop streaming if callback returns false
            }
        }
        
        Ok(())
    }
    
    /// Calculate document hash excluding signature fields (streaming approach)
    pub fn calculate_document_hash_streaming(&mut self, hash_algorithm: &HashAlgorithm) -> Result<Vec<u8>> {
        use sha2::{Sha256, Sha384, Sha512, Digest};
        
        match hash_algorithm {
            HashAlgorithm::Sha256 => {
                let mut hasher = Sha256::new();
                self.hash_document_content(&mut hasher)?;
                Ok(hasher.finalize().to_vec())
            }
            HashAlgorithm::Sha384 => {
                let mut hasher = Sha384::new();
                self.hash_document_content(&mut hasher)?;
                Ok(hasher.finalize().to_vec())
            }
            HashAlgorithm::Sha512 => {
                let mut hasher = Sha512::new();
                self.hash_document_content(&mut hasher)?;
                Ok(hasher.finalize().to_vec())
            }
        }
    }
    
    /// Hash document content in chunks to avoid memory issues
    fn hash_document_content<D: Digest>(&mut self, hasher: &mut D) -> Result<()> {
        self.seek_to_position(0)?;
        
        let mut buffer = vec![0u8; self.config.buffer_size];
        let mut total_read = 0u64;
        
        while total_read < self.file_size {
            let bytes_read = self.reader.read(&mut buffer)
                .map_err(|e| PdfSignError::Io {
                    message: format!("Failed to read chunk for hashing: {,
                code: crate::error::ErrorCode::Io,}", e),
                    code: crate::error::ErrorCode::Io,
                })?;
            
            if bytes_read == 0 {
                break;
            }
            
            // TODO: In a full implementation, we would need to exclude signature field content
            // For now, hash all content
            hasher.update(&buffer[..bytes_read]);
            total_read += bytes_read as u64;
        }
        
        Ok(())
    }
    
    /// Seek to specific position in file
    fn seek_to_position(&mut self, position: u64) -> Result<()> {
        self.reader.seek(SeekFrom::Start(position))
            .map_err(|e| PdfSignError::Io {
                message: format!("Failed to seek to position {,
                code: crate::error::ErrorCode::Io,}: {}", position, e),
                code: crate::error::ErrorCode::Io,
            })?;
        self.current_position = position;
        Ok(())
    }
    
    /// Parse cross-reference table using streaming approach
    fn parse_xref_table_streaming(&mut self) -> Result<Vec<(u32, u64)>> {
        let mut object_positions = Vec::new();
        let mut line = String::new();
        
        // Read "xref" keyword
        self.reader.read_line(&mut line)
            .map_err(|e| PdfSignError::Io {
                message: format!("Failed to read xref line: {,
                code: crate::error::ErrorCode::Io,}", e),
                code: crate::error::ErrorCode::Io,
            })?;
        
        if line.trim() != "xref" {
            return Err(PdfSignError::PdfParsing {
                message: format!("Expected 'xref', found '{,
                code: crate::error::ErrorCode::PdfParsing,}'", line.trim()),
                code: crate::error::ErrorCode::PdfParsing,
            });
        }
        
        // Parse xref subsections
        loop {
            line.clear();
            let bytes_read = self.reader.read_line(&mut line)
                .map_err(|e| PdfSignError::Io {
                    message: format!("Failed to read xref subsection: {,
                code: crate::error::ErrorCode::Io,}", e),
                    code: crate::error::ErrorCode::Io,
                })?;
            
            if bytes_read == 0 || line.trim() == "trailer" {
                break;
            }
            
            // Parse subsection header
            let parts: Vec<&str> = line.trim().split_whitespace().collect();
            if parts.len() != 2 {
                continue; // Skip invalid lines
            }
            
            let start_num: u32 = parts[0].parse().unwrap_or(0);
            let count: u32 = parts[1].parse().unwrap_or(0);
            
            // Parse xref entries
            for i in 0..count {
                line.clear();
                self.reader.read_line(&mut line)
                    .map_err(|e| PdfSignError::Io {
                        message: format!("Failed to read xref entry: {,
                code: crate::error::ErrorCode::Io,}", e),
                        code: crate::error::ErrorCode::Io,
                    })?;
                
                let entry_parts: Vec<&str> = line.trim().split_whitespace().collect();
                if entry_parts.len() == 3 && entry_parts[2] == "n" {
                    if let Ok(offset) = entry_parts[0].parse::<u64>() {
                        object_positions.push((start_num + i, offset));
                    }
                }
            }
        }
        
        Ok(object_positions)
    }
    
    /// Estimate object size by reading ahead
    fn estimate_object_size(&mut self, offset: u64) -> Result<usize> {
        let current_pos = self.current_position;
        self.seek_to_position(offset)?;
        
        let mut size = 0;
        let mut buffer = vec![0u8; 1024]; // Read in 1KB chunks
        let mut found_endobj = false;
        
        while size < 10 * 1024 * 1024 { // Max 10MB per object
            let bytes_read = self.reader.read(&mut buffer)
                .map_err(|e| PdfSignError::Io {
                    message: format!("Failed to read for size estimation: {,
                code: crate::error::ErrorCode::Io,}", e),
                    code: crate::error::ErrorCode::Io,
                })?;
            
            if bytes_read == 0 {
                break;
            }
            
            // Look for "endobj" keyword
            if let Ok(content) = std::str::from_utf8(&buffer[..bytes_read]) {
                if content.contains("endobj") {
                    // Find position of endobj and add some padding
                    if let Some(endobj_pos) = content.find("endobj") {
                        size += endobj_pos + 6; // "endobj" length
                        found_endobj = true;
                        break;
                    }
                }
            }
            
            size += bytes_read;
        }
        
        // Restore original position
        self.seek_to_position(current_pos)?;
        
        if !found_endobj && size >= 10 * 1024 * 1024 {
            return Err(PdfSignError::PdfParsing {
                message: "Object too large or malformed".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        Ok(size.max(1024)) // Minimum 1KB
    }
    
    /// Get file size
    pub fn file_size(&self) -> u64 {
        self.file_size
    }
    
    /// Check if file should use streaming mode
    pub fn should_use_streaming(&self) -> bool {
        self.file_size > self.config.streaming_threshold as u64
    }
}

/// Create streaming reader from file path
pub fn create_streaming_reader_from_file(
    path: &Path,
    config: Option<StreamingConfig>,
) -> Result<StreamingPdfReader<File>> {
    let file = File::open(path)
        .map_err(|e| PdfSignError::Io {
            message: format!("Failed to open file {,
                code: crate::error::ErrorCode::Io,}: {}", path.display(), e),
            code: crate::error::ErrorCode::Io,
        })?;
    
    let config = config.unwrap_or_default();
    StreamingPdfReader::new(file, config)
}

/// Create streaming reader from byte slice
pub fn create_streaming_reader_from_bytes(
    data: &[u8],
    config: Option<StreamingConfig>,
) -> Result<StreamingPdfReader<std::io::Cursor<&[u8]>>> {
    let cursor = std::io::Cursor::new(data);
    let config = config.unwrap_or_default();
    StreamingPdfReader::new(cursor, config)
}

/// Memory usage tracker for streaming operations
#[derive(Debug)]
pub struct MemoryTracker {
    current_usage: usize,
    peak_usage: usize,
    max_allowed: usize,
}

impl MemoryTracker {
    pub fn new(max_allowed: usize) -> Self {
        Self {
            current_usage: 0,
            peak_usage: 0,
            max_allowed,
        }
    }
    
    pub fn allocate(&mut self, size: usize) -> Result<()> {
        if self.current_usage + size > self.max_allowed {
            return Err(PdfSignError::ResourceLimit {
                message: format!(
                    "Memory allocation would exceed limit: {,
                code: crate::error::ErrorCode::ResourceLimit,} + {} > {}",
                    self.current_usage, size, self.max_allowed
                ),
                code: crate::error::ErrorCode::ResourceLimit,
            });
        }
        
        self.current_usage += size;
        self.peak_usage = self.peak_usage.max(self.current_usage);
        Ok(())
    }
    
    pub fn deallocate(&mut self, size: usize) {
        self.current_usage = self.current_usage.saturating_sub(size);
    }
    
    pub fn current_usage(&self) -> usize {
        self.current_usage
    }
    
    pub fn peak_usage(&self) -> usize {
        self.peak_usage
    }
    
    pub fn available(&self) -> usize {
        self.max_allowed.saturating_sub(self.current_usage)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Cursor;
    
    #[test]
    fn test_streaming_config_default() {
        let config = StreamingConfig::default();
        assert_eq!(config.buffer_size, 64 * 1024);
        assert_eq!(config.max_memory_usage, 100 * 1024 * 1024);
        assert!(config.use_memory_mapping);
        assert_eq!(config.streaming_threshold, 50 * 1024 * 1024);
    }
    
    #[test]
    fn test_memory_tracker() {
        let mut tracker = MemoryTracker::new(1000);
        
        assert!(tracker.allocate(500).is_ok());
        assert_eq!(tracker.current_usage(), 500);
        
        assert!(tracker.allocate(400).is_ok());
        assert_eq!(tracker.current_usage(), 900);
        assert_eq!(tracker.peak_usage(), 900);
        
        // Should fail - would exceed limit
        assert!(tracker.allocate(200).is_err());
        
        tracker.deallocate(300);
        assert_eq!(tracker.current_usage(), 600);
        assert_eq!(tracker.peak_usage(), 900); // Peak should remain
    }
    
    #[test]
    fn test_streaming_reader_creation() {
        let pdf_data = b"%PDF-1.7\n%\xE2\xE3\xCF\xD3\n";
        let cursor = Cursor::new(&pdf_data[..]);
        let config = StreamingConfig::default();
        
        let reader = StreamingPdfReader::new(cursor, config);
        assert!(reader.is_ok());
        
        let reader = reader.unwrap();
        assert_eq!(reader.file_size(), pdf_data.len() as u64);
        assert!(!reader.should_use_streaming()); // Small file
    }
}