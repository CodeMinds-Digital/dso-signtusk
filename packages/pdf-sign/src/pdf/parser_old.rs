//! PDF document parsing implementation

use crate::{
    error::{PdfSignError, Result},
    pdf::structure::{PdfDocumentStructure, PdfObject, PdfObjectRef, XrefEntry},
    traits::PdfParser,
    types::*,
};
use async_trait::async_trait;
use std::collections::HashMap;
use std::io::{Cursor, Read, Seek, SeekFrom};

/// PDF parser implementation
pub struct PdfParserImpl {
    /// Maximum file size to process (in bytes)
    max_file_size: usize,
    /// Whether to validate PDF structure strictly
    strict_validation: bool,
}

impl PdfParserImpl {
    pub fn new() -> Self {
        Self {
            max_file_size: 100 * 1024 * 1024, // 100MB default limit
            strict_validation: true,
        }
    }

    pub fn with_max_file_size(mut self, max_size: usize) -> Self {
        self.max_file_size = max_size;
        self
    }

    pub fn with_strict_validation(mut self, strict: bool) -> Self {
        self.strict_validation = strict;
        self
    }

    /// Parse PDF structure from raw data
    fn parse_pdf_structure(&self, pdf_data: &[u8]) -> Result<PdfDocumentStructure> {
        let version = self.parse_header(pdf_data)?;
        let (xref_table, trailer) = self.parse_xref_table(pdf_data)?;
        
        // Load all objects referenced in the xref table
        let mut objects = HashMap::new();
        for (obj_num, xref_entry) in &xref_table {
            if xref_entry.in_use {
                if let Ok(obj) = self.parse_object_at_offset(pdf_data, xref_entry.offset as usize) {
                    objects.insert(*obj_num, obj);
                }
            }
        }
        
        Ok(PdfDocumentStructure {
            version,
            xref_table,
            trailer,
            objects,
        })
    }

    /// Parse AcroForm fields to find signature fields
    fn parse_acroform_fields(
        &self,
        structure: &PdfDocumentStructure,
        acroform_ref: &PdfObjectRef,
    ) -> Result<Vec<SignatureField>> {
        let mut signature_fields = Vec::new();
        
        if let Some(PdfObject::Dictionary(acroform_dict)) = structure.get_object(acroform_ref) {
            // Get the Fields array
            if let Some(PdfObject::Array(fields_array)) = acroform_dict.get("Fields") {
                for field_obj in fields_array {
                    if let PdfObject::Reference(field_ref) = field_obj {
                        if let Some(signature_field) = self.parse_field_if_signature(structure, field_ref)? {
                            signature_fields.push(signature_field);
                        }
                    }
                }
            }
        }
        
        Ok(signature_fields)
    }

    /// Parse a field and return SignatureField if it's a signature field
    fn parse_field_if_signature(
        &self,
        structure: &PdfDocumentStructure,
        field_ref: &PdfObjectRef,
    ) -> Result<Option<SignatureField>> {
        if let Some(PdfObject::Dictionary(field_dict)) = structure.get_object(field_ref) {
            // Check if this is a signature field (FT = Sig)
            if let Some(PdfObject::Name(field_type)) = field_dict.get("FT") {
                if field_type == "Sig" {
                    return Ok(Some(self.extract_signature_field_properties(field_dict)?));
                }
            }
            
            // Check for inherited field type from parent
            if let Some(PdfObject::Reference(parent_ref)) = field_dict.get("Parent") {
                if let Some(parent_field) = self.parse_field_if_signature(structure, parent_ref)? {
                    // This field inherits from a signature field parent
                    let mut field = self.extract_signature_field_properties(field_dict)?;
                    // Use parent's name if this field doesn't have one
                    if field.name.is_empty() {
                        field.name = parent_field.name;
                    }
                    return Ok(Some(field));
                }
            }
        }
        
        Ok(None)
    }

    /// Extract signature field properties from field dictionary
    fn extract_signature_field_properties(&self, field_dict: &HashMap<String, PdfObject>) -> Result<SignatureField> {
        // Extract field name
        let name = if let Some(PdfObject::String(name_bytes)) = field_dict.get("T") {
            String::from_utf8(name_bytes.clone()).unwrap_or_else(|_| "UnknownField".to_string())
        } else {
            "UnknownField".to_string()
        };

        // Extract field rectangle (bounds)
        let bounds = if let Some(PdfObject::Array(rect_array)) = field_dict.get("Rect") {
            self.parse_rectangle_from_array(rect_array)?
        } else {
            Rectangle { x: 0.0, y: 0.0, width: 100.0, height: 50.0 } // Default bounds
        };

        // Extract page number (simplified - assumes field is on page 0)
        let page = 0; // TODO: Implement proper page detection by traversing page tree

        // Check if field is already signed
        let is_signed = field_dict.contains_key("V"); // V key contains signature value

        // Extract appearance information if available
        let appearance = self.extract_signature_appearance(field_dict)?;

        Ok(SignatureField {
            name,
            page,
            bounds,
            appearance,
            is_signed,
        })
    }

    /// Parse rectangle from PDF array
    fn parse_rectangle_from_array(&self, rect_array: &[PdfObject]) -> Result<Rectangle> {
        if rect_array.len() != 4 {
            return Err(PdfSignError::PdfParsing {
                message: "Invalid rectangle array - must have 4 elements".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }

        let coords: Result<Vec<f64>> = rect_array.iter()
            .map(|obj| match obj {
                PdfObject::Integer(i) => Ok(*i as f64),
                PdfObject::Real(r) => Ok(*r),
                _ => Err(PdfSignError::PdfParsing {
                    message: "Invalid coordinate type in rectangle".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
                ,
                code: crate::error::ErrorCode::PdfParsing,}),
            })
            .collect();

        let coords = coords?;
        
        // PDF rectangles are [x1, y1, x2, y2] where (x1,y1) is lower-left, (x2,y2) is upper-right
        let x = coords[0].min(coords[2]);
        let y = coords[1].min(coords[3]);
        let width = (coords[2] - coords[0]).abs();
        let height = (coords[3] - coords[1]).abs();

        Ok(Rectangle { x, y, width, height })
    }

    /// Extract signature appearance information from field dictionary
    fn extract_signature_appearance(&self, field_dict: &HashMap<String, PdfObject>) -> Result<Option<SignatureAppearance>> {
        // Check for appearance dictionary (AP key)
        if let Some(PdfObject::Dictionary(_ap_dict)) = field_dict.get("AP") {
            // Basic appearance extraction - in full implementation would parse appearance streams
            let appearance = SignatureAppearance {
                visible: true, // Assume visible if AP dictionary exists
                page: Some(0), // TODO: Determine actual page
                bounds: None, // Will use field bounds
                text: None, // TODO: Extract from appearance stream
                image: None, // TODO: Extract from appearance stream
                background_color: None,
                border_color: None,
            };
            Ok(Some(appearance))
        } else {
            Ok(None)
        }
    }

    /// Parse a PDF object at a specific offset
    fn parse_object_at_offset(&self, pdf_data: &[u8], offset: usize) -> Result<PdfObject> {
        if offset >= pdf_data.len() {
            return Err(PdfSignError::PdfParsing {
                message: format!("Object offset {,
                code: crate::error::ErrorCode::PdfParsing,} exceeds file size", offset),
            });
        }

        let mut cursor = Cursor::new(&pdf_data[offset..]);
        let mut line = String::new();
        
        // Read object header (e.g., "1 0 obj")
        self.read_line(&mut cursor, &mut line)?;
        let parts: Vec<&str> = line.trim().split_whitespace().collect();
        
        if parts.len() != 3 || parts[2] != "obj" {
            return Err(PdfSignError::PdfParsing {
                message: format!("Invalid object header: {,
                code: crate::error::ErrorCode::PdfParsing,}", line.trim()),
            });
        }

        // Parse object content
        self.parse_object_content(&mut cursor)
    }

    /// Parse the content of a PDF object
    fn parse_object_content(&self, cursor: &mut Cursor<&[u8]>) -> Result<PdfObject> {
        let mut line = String::new();
        self.read_line(cursor, &mut line)?;
        let content = line.trim();

        // Handle different object types
        if content.starts_with("<<") {
            // Dictionary object
            self.parse_dictionary_object(cursor, content)
        } else if content.starts_with('[') {
            // Array object
            self.parse_array_object(content)
        } else {
            // Simple object
            self.parse_simple_object(content)
        }
    }

    /// Parse a dictionary object
    fn parse_dictionary_object(&self, cursor: &mut Cursor<&[u8]>, first_line: &str) -> Result<PdfObject> {
        let mut dict = HashMap::new();
        let mut content = first_line.to_string();
        
        // If the dictionary doesn't end on the first line, read more
        if !content.contains(">>") {
            let mut line = String::new();
            while self.read_line(cursor, &mut line).is_ok() {
                content.push(' ');
                content.push_str(line.trim());
                if content.contains(">>") {
                    break;
                }
                line.clear();
            }
        }

        // Parse dictionary entries
        let dict_content = content.trim_start_matches("<<").trim_end_matches(">>");
        let mut tokens = dict_content.split_whitespace().peekable();
        
        while let Some(key_token) = tokens.next() {
            if key_token.starts_with('/') {
                let key = key_token[1..].to_string();
                if let Some(value_token) = tokens.next() {
                    let value = self.parse_simple_object(value_token)?;
                    dict.insert(key, value);
                }
            }
        }

        Ok(PdfObject::Dictionary(dict))
    }

    /// Parse an array object
    fn parse_array_object(&self, content: &str) -> Result<PdfObject> {
        let array_content = content.trim_start_matches('[').trim_end_matches(']');
        let mut array = Vec::new();
        
        for token in array_content.split_whitespace() {
            if !token.is_empty() {
                array.push(self.parse_simple_object(token)?);
            }
        }
        
        Ok(PdfObject::Array(array))
    }

    /// Validate signature field definition
    fn validate_signature_field_definition(&self, field: &SignatureFieldDefinition) -> Result<()> {
        // Validate field name
        if field.name.is_empty() {
            return Err(PdfSignError::PdfParsing {
                message: "Signature field name cannot be empty".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        // Validate field name characters (PDF names have restrictions)
        if !field.name.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
            return Err(PdfSignError::PdfParsing {
                message: "Signature field name contains invalid characters".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        // Validate bounds
        if field.bounds.width <= 0.0 || field.bounds.height <= 0.0 {
            return Err(PdfSignError::PdfParsing {
                message: "Signature field bounds must have positive width and height".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        if field.bounds.x < 0.0 || field.bounds.y < 0.0 {
            return Err(PdfSignError::PdfParsing {
                message: "Signature field bounds cannot have negative coordinates".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        Ok(())
    }

    /// Embed signature field in PDF data (simplified implementation)
    fn embed_signature_field_in_pdf(
        &self,
        document: &PdfDocument,
        _field: &SignatureFieldDefinition,
    ) -> Result<Vec<u8>> {
        // In a full implementation, this would:
        // 1. Parse the existing PDF structure
        // 2. Find or create the AcroForm dictionary
        // 3. Add the new signature field to the Fields array
        // 4. Create the field dictionary with proper PDF objects
        // 5. Update cross-reference table and trailer
        // 6. Serialize the modified PDF
        
        // For now, return the original data as this is a complex operation
        // that would require a full PDF writer implementation
        Ok(document.data.clone())
    }

    /// Create signature field automatically when none exist
    fn create_default_signature_field(&self, document: &PdfDocument) -> Result<SignatureFieldDefinition> {
        // Check if document already has signature fields
        if !document.signature_fields.is_empty() {
            return Err(PdfSignError::PdfParsing {
                message: "Document already contains signature fields".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        // Create a default signature field on the last page
        let page = if document.page_count > 0 { document.page_count - 1 } else { 0 };
        
        // Position signature field in bottom-right corner
        let bounds = Rectangle {
            x: 400.0,  // 400 points from left
            y: 50.0,   // 50 points from bottom
            width: 150.0,  // 150 points wide
            height: 50.0,  // 50 points tall
        };
        
        // Create default appearance
        let appearance = SignatureAppearance {
            visible: true,
            page: Some(page),
            bounds: Some(bounds.clone()),
            text: Some("Digitally signed".to_string()),
            image: None,
            background_color: Some(Color { r: 240, g: 240, b: 240 }), // Light gray
            border_color: Some(Color { r: 0, g: 0, b: 0 }), // Black border
        };
        
        Ok(SignatureFieldDefinition {
            name: "Signature1".to_string(),
            page,
            bounds,
            appearance: Some(appearance),
        })
    }

    /// Automatically position signature field to avoid overlaps
    fn auto_position_signature_field(
        &self,
        document: &PdfDocument,
        field_name: &str,
        page: u32,
    ) -> Result<SignatureFieldDefinition> {
        // Validate page number
        if page >= document.page_count {
            return Err(PdfSignError::PdfParsing {
                message: format!("Page {,
                code: crate::error::ErrorCode::PdfParsing,} does not exist", page),
            });
        }
        
        // Get existing fields on the specified page
        let existing_fields_on_page: Vec<&SignatureField> = document.signature_fields
            .iter()
            .filter(|f| f.page == page)
            .collect();
        
        // Standard signature field size
        let field_width = 150.0;
        let field_height = 50.0;
        let margin = 10.0;
        
        // Try different positions (bottom-right, bottom-left, top-right, top-left)
        let positions = vec![
            (400.0, 50.0),   // Bottom-right
            (50.0, 50.0),    // Bottom-left  
            (400.0, 700.0),  // Top-right
            (50.0, 700.0),   // Top-left
        ];
        
        for (x, y) in positions {
            let candidate_bounds = Rectangle {
                x,
                y,
                width: field_width,
                height: field_height,
            };
            
            // Check if this position overlaps with existing fields
            let overlaps = existing_fields_on_page.iter().any(|field| {
                self.rectangles_overlap(&candidate_bounds, &field.bounds)
            });
            
            if !overlaps {
                let appearance = SignatureAppearance {
                    visible: true,
                    page: Some(page),
                    bounds: Some(candidate_bounds.clone()),
                    text: Some("Digitally signed".to_string()),
                    image: None,
                    background_color: Some(Color { r: 240, g: 240, b: 240 }),
                    border_color: Some(Color { r: 0, g: 0, b: 0 }),
                };
                
                return Ok(SignatureFieldDefinition {
                    name: field_name.to_string(),
                    page,
                    bounds: candidate_bounds,
                    appearance: Some(appearance),
                });
            }
        }
        
        // If all standard positions are taken, place field at bottom with offset
        let y_offset = existing_fields_on_page.len() as f64 * (field_height + margin);
        let bounds = Rectangle {
            x: 50.0,
            y: 50.0 + y_offset,
            width: field_width,
            height: field_height,
        };
        
        let appearance = SignatureAppearance {
            visible: true,
            page: Some(page),
            bounds: Some(bounds.clone()),
            text: Some("Digitally signed".to_string()),
            image: None,
            background_color: Some(Color { r: 240, g: 240, b: 240 }),
            border_color: Some(Color { r: 0, g: 0, b: 0 }),
        };
        
        Ok(SignatureFieldDefinition {
            name: field_name.to_string(),
            page,
            bounds,
            appearance: Some(appearance),
        })
    }

    /// Check if two rectangles overlap
    fn rectangles_overlap(&self, rect1: &Rectangle, rect2: &Rectangle) -> bool {
        let r1_right = rect1.x + rect1.width;
        let r1_top = rect1.y + rect1.height;
        let r2_right = rect2.x + rect2.width;
        let r2_top = rect2.y + rect2.height;
        
        !(rect1.x >= r2_right || rect2.x >= r1_right || rect1.y >= r2_top || rect2.y >= r1_top)
    }

    /// Parse PDF header and extract version
    fn parse_header(&self, data: &[u8]) -> Result<String> {
        if data.len() < 8 {
            return Err(PdfSignError::PdfParsing {
                message: "File too small to be a valid PDF".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }

        let header = std::str::from_utf8(&data[0..8])
            .map_err(|_| PdfSignError::PdfParsing {
                message: "Invalid PDF header encoding".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,})?;

        if !header.starts_with("%PDF-") {
            return Err(PdfSignError::PdfParsing {
                message: "Invalid PDF header signature".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }

        let version = header[5..].trim();
        
        // Validate PDF version
        match version {
            "1.0" | "1.1" | "1.2" | "1.3" | "1.4" | "1.5" | "1.6" | "1.7" | "2.0" => {
                Ok(version.to_string())
            }
            _ => {
                if self.strict_validation {
                    Err(PdfSignError::PdfParsing {
                        message: format!("Unsupported PDF version: {,
                code: crate::error::ErrorCode::PdfParsing,}", version),
                    })
                } else {
                    // Default to 1.7 for unknown versions in non-strict mode
                    Ok("1.7".to_string())
                }
            }
        }
    }

    /// Find and parse the cross-reference table
    fn parse_xref_table(&self, data: &[u8]) -> Result<(HashMap<u32, XrefEntry>, HashMap<String, PdfObject>)> {
        // Find the last occurrence of "startxref"
        let startxref_pos = self.find_last_startxref(data)?;
        let xref_offset = self.parse_xref_offset(data, startxref_pos)?;
        
        // Parse cross-reference table at the found offset
        let mut cursor = Cursor::new(data);
        cursor.seek(SeekFrom::Start(xref_offset as u64))
            .map_err(|e| PdfSignError::PdfParsing {
                message: format!("Failed to seek to xref table: {,
                code: crate::error::ErrorCode::PdfParsing,}", e),
            })?;

        let mut xref_table = HashMap::new();
        let trailer = self.parse_xref_section(&mut cursor, &mut xref_table)?;

        Ok((xref_table, trailer))
    }

    /// Find the last occurrence of "startxref" in the PDF
    fn find_last_startxref(&self, data: &[u8]) -> Result<usize> {
        let search_bytes = b"startxref";
        let mut last_pos = None;
        
        for i in 0..data.len().saturating_sub(search_bytes.len()) {
            if &data[i..i + search_bytes.len()] == search_bytes {
                last_pos = Some(i);
            }
        }

        last_pos.ok_or_else(|| PdfSignError::PdfParsing {
            message: "No startxref found in PDF".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
        ,
                code: crate::error::ErrorCode::PdfParsing,})
    }

    /// Parse the xref offset from startxref section
    fn parse_xref_offset(&self, data: &[u8], startxref_pos: usize) -> Result<usize> {
        let start = startxref_pos + 9; // Length of "startxref"
        let end = data.len().min(start + 20); // Look for offset in next 20 bytes
        
        let offset_str = std::str::from_utf8(&data[start..end])
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

        offset_str.parse::<usize>()
            .map_err(|_| PdfSignError::PdfParsing {
                message: format!("Invalid xref offset: {,
                code: crate::error::ErrorCode::PdfParsing,}", offset_str),
            })
    }

    /// Parse a cross-reference section
    fn parse_xref_section(
        &self,
        cursor: &mut Cursor<&[u8]>,
        xref_table: &mut HashMap<u32, XrefEntry>,
    ) -> Result<HashMap<String, PdfObject>> {
        let mut line = String::new();
        
        // Read "xref" keyword
        self.read_line(cursor, &mut line)?;
        if line.trim() != "xref" {
            return Err(PdfSignError::PdfParsing {
                message: format!("Expected 'xref', found '{,
                code: crate::error::ErrorCode::PdfParsing,}'", line.trim()),
            });
        }

        // Parse xref subsections
        loop {
            line.clear();
            self.read_line(cursor, &mut line)?;
            let line_trimmed = line.trim();
            
            if line_trimmed == "trailer" {
                break;
            }

            // Parse subsection header (start_num count)
            let parts: Vec<&str> = line_trimmed.split_whitespace().collect();
            if parts.len() != 2 {
                return Err(PdfSignError::PdfParsing {
                    message: format!("Invalid xref subsection header: {,
                code: crate::error::ErrorCode::PdfParsing,}", line_trimmed),
                });
            }

            let start_num: u32 = parts[0].parse()
                .map_err(|_| PdfSignError::PdfParsing {
                    message: format!("Invalid start number in xref: {,
                code: crate::error::ErrorCode::PdfParsing,}", parts[0]),
                })?;
            
            let count: u32 = parts[1].parse()
                .map_err(|_| PdfSignError::PdfParsing {
                    message: format!("Invalid count in xref: {,
                code: crate::error::ErrorCode::PdfParsing,}", parts[1]),
                })?;

            // Parse xref entries
            for i in 0..count {
                line.clear();
                self.read_line(cursor, &mut line)?;
                let entry_parts: Vec<&str> = line.trim().split_whitespace().collect();
                
                if entry_parts.len() != 3 {
                    return Err(PdfSignError::PdfParsing {
                        message: format!("Invalid xref entry: {,
                code: crate::error::ErrorCode::PdfParsing,}", line.trim()),
                    });
                }

                let offset: u64 = entry_parts[0].parse()
                    .map_err(|_| PdfSignError::PdfParsing {
                        message: format!("Invalid offset in xref entry: {,
                code: crate::error::ErrorCode::PdfParsing,}", entry_parts[0]),
                    })?;
                
                let generation: u16 = entry_parts[1].parse()
                    .map_err(|_| PdfSignError::PdfParsing {
                        message: format!("Invalid generation in xref entry: {,
                code: crate::error::ErrorCode::PdfParsing,}", entry_parts[1]),
                    })?;
                
                let in_use = match entry_parts[2] {
                    "n" => true,
                    "f" => false,
                    _ => return Err(PdfSignError::PdfParsing {
                        message: format!("Invalid usage flag in xref entry: {,
                code: crate::error::ErrorCode::PdfParsing,}", entry_parts[2]),
                    }),
                };

                xref_table.insert(start_num + i, XrefEntry {
                    offset,
                    generation,
                    in_use,
                });
            }
        }

        // Parse trailer dictionary
        self.parse_trailer_dictionary(cursor)
    }

    /// Parse the trailer dictionary
    fn parse_trailer_dictionary(&self, cursor: &mut Cursor<&[u8]>) -> Result<HashMap<String, PdfObject>> {
        let mut trailer = HashMap::new();
        let mut line = String::new();
        
        // Read until we find "<<"
        loop {
            line.clear();
            self.read_line(cursor, &mut line)?;
            if line.trim().contains("<<") {
                break;
            }
        }

        // Simple dictionary parsing (basic implementation)
        // In a full implementation, this would be more sophisticated
        loop {
            line.clear();
            self.read_line(cursor, &mut line)?;
            let line_content = line.trim();
            
            if line_content.contains(">>") {
                break;
            }

            if line_content.starts_with('/') {
                let parts: Vec<&str> = line_content.splitn(2, ' ').collect();
                if parts.len() == 2 {
                    let key = parts[0][1..].to_string(); // Remove leading '/'
                    let value = self.parse_simple_object(parts[1])?;
                    trailer.insert(key, value);
                }
            }
        }

        Ok(trailer)
    }

    /// Parse a simple PDF object (basic implementation)
    fn parse_simple_object(&self, value_str: &str) -> Result<PdfObject> {
        let value_str = value_str.trim();
        
        if value_str == "null" {
            Ok(PdfObject::Null)
        } else if value_str == "true" {
            Ok(PdfObject::Boolean(true))
        } else if value_str == "false" {
            Ok(PdfObject::Boolean(false))
        } else if let Ok(int_val) = value_str.parse::<i64>() {
            Ok(PdfObject::Integer(int_val))
        } else if let Ok(real_val) = value_str.parse::<f64>() {
            Ok(PdfObject::Real(real_val))
        } else if value_str.starts_with('/') {
            Ok(PdfObject::Name(value_str[1..].to_string()))
        } else if value_str.starts_with('(') && value_str.ends_with(')') {
            let string_content = value_str[1..value_str.len()-1].as_bytes().to_vec();
            Ok(PdfObject::String(string_content))
        } else if value_str.contains(' ') && value_str.ends_with(" R") {
            // Object reference
            let parts: Vec<&str> = value_str.split_whitespace().collect();
            if parts.len() == 3 && parts[2] == "R" {
                let object_number: u32 = parts[0].parse()
                    .map_err(|_| PdfSignError::PdfParsing {
                        message: format!("Invalid object reference: {,
                code: crate::error::ErrorCode::PdfParsing,}", value_str),
                    })?;
                let generation: u16 = parts[1].parse()
                    .map_err(|_| PdfSignError::PdfParsing {
                        message: format!("Invalid object reference: {,
                code: crate::error::ErrorCode::PdfParsing,}", value_str),
                    })?;
                Ok(PdfObject::Reference(PdfObjectRef { object_number, generation }))
            } else {
                Err(PdfSignError::PdfParsing {
                    message: format!("Invalid object reference format: {,
                code: crate::error::ErrorCode::PdfParsing,}", value_str),
                })
            }
        } else {
            // Default to string for unknown formats
            Ok(PdfObject::String(value_str.as_bytes().to_vec()))
        }
    }

    /// Read a line from the cursor
    fn read_line(&self, cursor: &mut Cursor<&[u8]>, line: &mut String) -> Result<()> {
        line.clear();
        let mut byte = [0u8; 1];
        
        loop {
            match cursor.read_exact(&mut byte) {
                Ok(()) => {
                    let ch = byte[0] as char;
                    if ch == '\n' {
                        break;
                    } else if ch != '\r' {
                        line.push(ch);
                    }
                }
                Err(_) => break, // End of file
            }
        }
        
        Ok(())
    }

    /// Count pages in the PDF document
    fn count_pages(&self, structure: &PdfDocumentStructure) -> Result<u32> {
        // Look for the root object in the trailer
        let root_ref = structure.trailer.get("Root")
            .ok_or_else(|| PdfSignError::PdfParsing {
                message: "No Root entry found in trailer".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,})?;

        if let PdfObject::Reference(root_obj_ref) = root_ref {
            if let Some(PdfObject::Dictionary(root_dict)) = structure.get_object(root_obj_ref) {
                // Look for Pages entry
                if let Some(PdfObject::Reference(pages_ref)) = root_dict.get("Pages") {
                    if let Some(PdfObject::Dictionary(pages_dict)) = structure.get_object(pages_ref) {
                        if let Some(PdfObject::Integer(count)) = pages_dict.get("Count") {
                            return Ok(*count as u32);
                        }
                    }
                }
            }
        }

        // Fallback: try to count manually (basic implementation)
        Ok(1) // Default to 1 page if we can't determine
    }

    /// Extract basic metadata from the document
    fn extract_metadata(&self, structure: &PdfDocumentStructure) -> Result<PdfMetadata> {
        let mut metadata = PdfMetadata::default();

        // Look for Info dictionary in trailer
        if let Some(PdfObject::Reference(info_ref)) = structure.trailer.get("Info") {
            if let Some(PdfObject::Dictionary(info_dict)) = structure.get_object(info_ref) {
                // Extract common metadata fields
                if let Some(PdfObject::String(title)) = info_dict.get("Title") {
                    metadata.title = String::from_utf8(title.clone()).ok();
                }
                if let Some(PdfObject::String(author)) = info_dict.get("Author") {
                    metadata.author = String::from_utf8(author.clone()).ok();
                }
                if let Some(PdfObject::String(subject)) = info_dict.get("Subject") {
                    metadata.subject = String::from_utf8(subject.clone()).ok();
                }
                if let Some(PdfObject::String(creator)) = info_dict.get("Creator") {
                    metadata.creator = String::from_utf8(creator.clone()).ok();
                }
                if let Some(PdfObject::String(producer)) = info_dict.get("Producer") {
                    metadata.producer = String::from_utf8(producer.clone()).ok();
                }
            }
        }

        Ok(metadata)
    }
}

impl Default for PdfParserImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl PdfParser for PdfParserImpl {
    async fn parse_document(&self, pdf_data: &[u8]) -> Result<PdfDocument> {
        // Validate file size
        if pdf_data.len() > self.max_file_size {
            return Err(PdfSignError::PdfParsing {
                message: format!("File size {,
                code: crate::error::ErrorCode::PdfParsing,} exceeds maximum allowed size {}", 
                    pdf_data.len(), self.max_file_size),
            });
        }

        // Parse PDF header and version
        let version = self.parse_header(pdf_data)?;

        // Parse cross-reference table and trailer
        let (xref_table, trailer) = self.parse_xref_table(pdf_data)?;

        // Create document structure
        let structure = PdfDocumentStructure {
            version: version.clone(),
            xref_table,
            trailer,
            objects: HashMap::new(), // Objects will be loaded on demand
        };

        // Count pages
        let page_count = self.count_pages(&structure)?;

        // Extract metadata
        let metadata = self.extract_metadata(&structure)?;

        // Create initial PDF document
        let mut document = PdfDocument {
            version,
            page_count,
            metadata,
            signature_fields: vec![],
            existing_signatures: vec![],
            data: pdf_data.to_vec(),
        };

        // Extract signature fields using the enhanced implementation
        document.signature_fields = self.extract_signature_fields(&document)?;

        Ok(document)
    }

    fn extract_signature_fields(&self, document: &PdfDocument) -> Result<Vec<SignatureField>> {
        let mut signature_fields = Vec::new();
        
        // Parse the PDF structure to find AcroForm fields
        let structure = self.parse_pdf_structure(&document.data)?;
        
        // Find the document catalog (root object)
        let root_ref = structure.trailer.get("Root")
            .ok_or_else(|| PdfSignError::PdfParsing {
                message: "No Root entry found in trailer".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,})?;

        if let PdfObject::Reference(root_obj_ref) = root_ref {
            if let Some(PdfObject::Dictionary(root_dict)) = structure.get_object(root_obj_ref) {
                // Look for AcroForm dictionary
                if let Some(PdfObject::Reference(acroform_ref)) = root_dict.get("AcroForm") {
                    signature_fields = self.parse_acroform_fields(&structure, acroform_ref)?;
                }
            }
        }
        
        Ok(signature_fields)
    }

    /// Parse PDF structure from raw data
    fn parse_pdf_structure(&self, pdf_data: &[u8]) -> Result<PdfDocumentStructure> {
        let version = self.parse_header(pdf_data)?;
        let (xref_table, trailer) = self.parse_xref_table(pdf_data)?;
        
        // Load all objects referenced in the xref table
        let mut objects = HashMap::new();
        for (obj_num, xref_entry) in &xref_table {
            if xref_entry.in_use {
                if let Ok(obj) = self.parse_object_at_offset(pdf_data, xref_entry.offset as usize) {
                    objects.insert(*obj_num, obj);
                }
            }
        }
        
        Ok(PdfDocumentStructure {
            version,
            xref_table,
            trailer,
            objects,
        })
    }

    /// Parse AcroForm fields to find signature fields
    fn parse_acroform_fields(
        &self,
        structure: &PdfDocumentStructure,
        acroform_ref: &PdfObjectRef,
    ) -> Result<Vec<SignatureField>> {
        let mut signature_fields = Vec::new();
        
        if let Some(PdfObject::Dictionary(acroform_dict)) = structure.get_object(acroform_ref) {
            // Get the Fields array
            if let Some(PdfObject::Array(fields_array)) = acroform_dict.get("Fields") {
                for field_obj in fields_array {
                    if let PdfObject::Reference(field_ref) = field_obj {
                        if let Some(signature_field) = self.parse_field_if_signature(structure, field_ref)? {
                            signature_fields.push(signature_field);
                        }
                    }
                }
            }
        }
        
        Ok(signature_fields)
    }

    /// Parse a field and return SignatureField if it's a signature field
    fn parse_field_if_signature(
        &self,
        structure: &PdfDocumentStructure,
        field_ref: &PdfObjectRef,
    ) -> Result<Option<SignatureField>> {
        if let Some(PdfObject::Dictionary(field_dict)) = structure.get_object(field_ref) {
            // Check if this is a signature field (FT = Sig)
            if let Some(PdfObject::Name(field_type)) = field_dict.get("FT") {
                if field_type == "Sig" {
                    return Ok(Some(self.extract_signature_field_properties(field_dict)?));
                }
            }
            
            // Check for inherited field type from parent
            if let Some(PdfObject::Reference(parent_ref)) = field_dict.get("Parent") {
                if let Some(parent_field) = self.parse_field_if_signature(structure, parent_ref)? {
                    // This field inherits from a signature field parent
                    let mut field = self.extract_signature_field_properties(field_dict)?;
                    // Use parent's name if this field doesn't have one
                    if field.name.is_empty() {
                        field.name = parent_field.name;
                    }
                    return Ok(Some(field));
                }
            }
        }
        
        Ok(None)
    }

    /// Extract signature field properties from field dictionary
    fn extract_signature_field_properties(&self, field_dict: &HashMap<String, PdfObject>) -> Result<SignatureField> {
        // Extract field name
        let name = if let Some(PdfObject::String(name_bytes)) = field_dict.get("T") {
            String::from_utf8(name_bytes.clone()).unwrap_or_else(|_| "UnknownField".to_string())
        } else {
            "UnknownField".to_string()
        };

        // Extract field rectangle (bounds)
        let bounds = if let Some(PdfObject::Array(rect_array)) = field_dict.get("Rect") {
            self.parse_rectangle_from_array(rect_array)?
        } else {
            Rectangle { x: 0.0, y: 0.0, width: 100.0, height: 50.0 } // Default bounds
        };

        // Extract page number (simplified - assumes field is on page 0)
        let page = 0; // TODO: Implement proper page detection by traversing page tree

        // Check if field is already signed
        let is_signed = field_dict.contains_key("V"); // V key contains signature value

        // Extract appearance information if available
        let appearance = self.extract_signature_appearance(field_dict)?;

        Ok(SignatureField {
            name,
            page,
            bounds,
            appearance,
            is_signed,
        })
    }

    /// Parse rectangle from PDF array
    fn parse_rectangle_from_array(&self, rect_array: &[PdfObject]) -> Result<Rectangle> {
        if rect_array.len() != 4 {
            return Err(PdfSignError::PdfParsing {
                message: "Invalid rectangle array - must have 4 elements".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }

        let coords: Result<Vec<f64>> = rect_array.iter()
            .map(|obj| match obj {
                PdfObject::Integer(i) => Ok(*i as f64),
                PdfObject::Real(r) => Ok(*r),
                _ => Err(PdfSignError::PdfParsing {
                    message: "Invalid coordinate type in rectangle".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
                ,
                code: crate::error::ErrorCode::PdfParsing,}),
            })
            .collect();

        let coords = coords?;
        
        // PDF rectangles are [x1, y1, x2, y2] where (x1,y1) is lower-left, (x2,y2) is upper-right
        let x = coords[0].min(coords[2]);
        let y = coords[1].min(coords[3]);
        let width = (coords[2] - coords[0]).abs();
        let height = (coords[3] - coords[1]).abs();

        Ok(Rectangle { x, y, width, height })
    }

    /// Extract signature appearance information from field dictionary
    fn extract_signature_appearance(&self, field_dict: &HashMap<String, PdfObject>) -> Result<Option<SignatureAppearance>> {
        // Check for appearance dictionary (AP key)
        if let Some(PdfObject::Dictionary(ap_dict)) = field_dict.get("AP") {
            // Basic appearance extraction - in full implementation would parse appearance streams
            let appearance = SignatureAppearance {
                visible: true, // Assume visible if AP dictionary exists
                page: Some(0), // TODO: Determine actual page
                bounds: None, // Will use field bounds
                text: None, // TODO: Extract from appearance stream
                image: None, // TODO: Extract from appearance stream
                background_color: None,
                border_color: None,
            };
            Ok(Some(appearance))
        } else {
            Ok(None)
        }
    }

    /// Parse a PDF object at a specific offset
    fn parse_object_at_offset(&self, pdf_data: &[u8], offset: usize) -> Result<PdfObject> {
        if offset >= pdf_data.len() {
            return Err(PdfSignError::PdfParsing {
                message: format!("Object offset {,
                code: crate::error::ErrorCode::PdfParsing,} exceeds file size", offset),
            });
        }

        let mut cursor = Cursor::new(&pdf_data[offset..]);
        let mut line = String::new();
        
        // Read object header (e.g., "1 0 obj")
        self.read_line(&mut cursor, &mut line)?;
        let parts: Vec<&str> = line.trim().split_whitespace().collect();
        
        if parts.len() != 3 || parts[2] != "obj" {
            return Err(PdfSignError::PdfParsing {
                message: format!("Invalid object header: {,
                code: crate::error::ErrorCode::PdfParsing,}", line.trim()),
            });
        }

        // Parse object content
        self.parse_object_content(&mut cursor)
    }

    /// Parse the content of a PDF object
    fn parse_object_content(&self, cursor: &mut Cursor<&[u8]>) -> Result<PdfObject> {
        let mut line = String::new();
        self.read_line(cursor, &mut line)?;
        let content = line.trim();

        // Handle different object types
        if content.starts_with("<<") {
            // Dictionary object
            self.parse_dictionary_object(cursor, content)
        } else if content.starts_with('[') {
            // Array object
            self.parse_array_object(content)
        } else {
            // Simple object
            self.parse_simple_object(content)
        }
    }

    /// Parse a dictionary object
    fn parse_dictionary_object(&self, cursor: &mut Cursor<&[u8]>, first_line: &str) -> Result<PdfObject> {
        let mut dict = HashMap::new();
        let mut content = first_line.to_string();
        
        // If the dictionary doesn't end on the first line, read more
        if !content.contains(">>") {
            let mut line = String::new();
            while self.read_line(cursor, &mut line).is_ok() {
                content.push(' ');
                content.push_str(line.trim());
                if content.contains(">>") {
                    break;
                }
                line.clear();
            }
        }

        // Parse dictionary entries
        let dict_content = content.trim_start_matches("<<").trim_end_matches(">>");
        let mut tokens = dict_content.split_whitespace().peekable();
        
        while let Some(key_token) = tokens.next() {
            if key_token.starts_with('/') {
                let key = key_token[1..].to_string();
                if let Some(value_token) = tokens.next() {
                    let value = self.parse_simple_object(value_token)?;
                    dict.insert(key, value);
                }
            }
        }

        Ok(PdfObject::Dictionary(dict))
    }

    /// Parse an array object
    fn parse_array_object(&self, content: &str) -> Result<PdfObject> {
        let array_content = content.trim_start_matches('[').trim_end_matches(']');
        let mut array = Vec::new();
        
        for token in array_content.split_whitespace() {
            if !token.is_empty() {
                array.push(self.parse_simple_object(token)?);
            }
        }
        
        Ok(PdfObject::Array(array))
    }

    async fn add_signature_field(
        &self,
        document: &PdfDocument,
        field: &SignatureFieldDefinition,
    ) -> Result<PdfDocument> {
        let mut new_document = document.clone();
        
        // Validate field definition
        self.validate_signature_field_definition(field)?;
        
        // Check if field name already exists
        if new_document.signature_fields.iter().any(|f| f.name == field.name) {
            return Err(PdfSignError::PdfParsing {
                message: format!("Signature field with name '{,
                code: crate::error::ErrorCode::PdfParsing,}' already exists", field.name),
            });
        }
        
        // Validate page number
        if field.page >= new_document.page_count {
            return Err(PdfSignError::PdfParsing {
                message: format!("Page {,
                code: crate::error::ErrorCode::PdfParsing,} does not exist (document has {} pages)", 
                    field.page, new_document.page_count),
            });
        }
        
        // Create a new signature field
        let signature_field = SignatureField {
            name: field.name.clone(),
            page: field.page,
            bounds: field.bounds.clone(),
            appearance: field.appearance.clone(),
            is_signed: false,
        };
        
        new_document.signature_fields.push(signature_field);
        
        // In a full implementation, this would modify the actual PDF structure
        // by adding the field to the AcroForm dictionary and updating the PDF data
        new_document.data = self.embed_signature_field_in_pdf(&new_document, field)?;
        
        Ok(new_document)
    }

    /// Validate signature field definition
    fn validate_signature_field_definition(&self, field: &SignatureFieldDefinition) -> Result<()> {
        // Validate field name
        if field.name.is_empty() {
            return Err(PdfSignError::PdfParsing {
                message: "Signature field name cannot be empty".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        // Validate field name characters (PDF names have restrictions)
        if !field.name.chars().all(|c| c.is_alphanumeric() || c == '_' || c == '-') {
            return Err(PdfSignError::PdfParsing {
                message: "Signature field name contains invalid characters".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        // Validate bounds
        if field.bounds.width <= 0.0 || field.bounds.height <= 0.0 {
            return Err(PdfSignError::PdfParsing {
                message: "Signature field bounds must have positive width and height".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        if field.bounds.x < 0.0 || field.bounds.y < 0.0 {
            return Err(PdfSignError::PdfParsing {
                message: "Signature field bounds cannot have negative coordinates".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        Ok(())
    }

    /// Embed signature field in PDF data (simplified implementation)
    fn embed_signature_field_in_pdf(
        &self,
        document: &PdfDocument,
        field: &SignatureFieldDefinition,
    ) -> Result<Vec<u8>> {
        // In a full implementation, this would:
        // 1. Parse the existing PDF structure
        // 2. Find or create the AcroForm dictionary
        // 3. Add the new signature field to the Fields array
        // 4. Create the field dictionary with proper PDF objects
        // 5. Update cross-reference table and trailer
        // 6. Serialize the modified PDF
        
        // For now, return the original data as this is a complex operation
        // that would require a full PDF writer implementation
        Ok(document.data.clone())
    }

    /// Create signature field automatically when none exist
    pub fn create_default_signature_field(&self, document: &PdfDocument) -> Result<SignatureFieldDefinition> {
        // Check if document already has signature fields
        if !document.signature_fields.is_empty() {
            return Err(PdfSignError::PdfParsing {
                message: "Document already contains signature fields".to_string(),
                code: crate::error::ErrorCode::PdfParsing,
            ,
                code: crate::error::ErrorCode::PdfParsing,});
        }
        
        // Create a default signature field on the last page
        let page = if document.page_count > 0 { document.page_count - 1 } else { 0 };
        
        // Position signature field in bottom-right corner
        let bounds = Rectangle {
            x: 400.0,  // 400 points from left
            y: 50.0,   // 50 points from bottom
            width: 150.0,  // 150 points wide
            height: 50.0,  // 50 points tall
        };
        
        // Create default appearance
        let appearance = SignatureAppearance {
            visible: true,
            page: Some(page),
            bounds: Some(bounds.clone()),
            text: Some("Digitally signed".to_string()),
            image: None,
            background_color: Some(Color { r: 240, g: 240, b: 240 }), // Light gray
            border_color: Some(Color { r: 0, g: 0, b: 0 }), // Black border
        };
        
        Ok(SignatureFieldDefinition {
            name: "Signature1".to_string(),
            page,
            bounds,
            appearance: Some(appearance),
        })
    }

    /// Automatically position signature field to avoid overlaps
    pub fn auto_position_signature_field(
        &self,
        document: &PdfDocument,
        field_name: &str,
        page: u32,
    ) -> Result<SignatureFieldDefinition> {
        // Validate page number
        if page >= document.page_count {
            return Err(PdfSignError::PdfParsing {
                message: format!("Page {,
                code: crate::error::ErrorCode::PdfParsing,} does not exist", page),
            });
        }
        
        // Get existing fields on the specified page
        let existing_fields_on_page: Vec<&SignatureField> = document.signature_fields
            .iter()
            .filter(|f| f.page == page)
            .collect();
        
        // Standard signature field size
        let field_width = 150.0;
        let field_height = 50.0;
        let margin = 10.0;
        
        // Try different positions (bottom-right, bottom-left, top-right, top-left)
        let positions = vec![
            (400.0, 50.0),   // Bottom-right
            (50.0, 50.0),    // Bottom-left  
            (400.0, 700.0),  // Top-right
            (50.0, 700.0),   // Top-left
        ];
        
        for (x, y) in positions {
            let candidate_bounds = Rectangle {
                x,
                y,
                width: field_width,
                height: field_height,
            };
            
            // Check if this position overlaps with existing fields
            let overlaps = existing_fields_on_page.iter().any(|field| {
                self.rectangles_overlap(&candidate_bounds, &field.bounds)
            });
            
            if !overlaps {
                let appearance = SignatureAppearance {
                    visible: true,
                    page: Some(page),
                    bounds: Some(candidate_bounds.clone()),
                    text: Some("Digitally signed".to_string()),
                    image: None,
                    background_color: Some(Color { r: 240, g: 240, b: 240 }),
                    border_color: Some(Color { r: 0, g: 0, b: 0 }),
                };
                
                return Ok(SignatureFieldDefinition {
                    name: field_name.to_string(),
                    page,
                    bounds: candidate_bounds,
                    appearance: Some(appearance),
                });
            }
        }
        
        // If all standard positions are taken, place field at bottom with offset
        let y_offset = existing_fields_on_page.len() as f64 * (field_height + margin);
        let bounds = Rectangle {
            x: 50.0,
            y: 50.0 + y_offset,
            width: field_width,
            height: field_height,
        };
        
        let appearance = SignatureAppearance {
            visible: true,
            page: Some(page),
            bounds: Some(bounds.clone()),
            text: Some("Digitally signed".to_string()),
            image: None,
            background_color: Some(Color { r: 240, g: 240, b: 240 }),
            border_color: Some(Color { r: 0, g: 0, b: 0 }),
        };
        
        Ok(SignatureFieldDefinition {
            name: field_name.to_string(),
            page,
            bounds,
            appearance: Some(appearance),
        })
    }

    /// Check if two rectangles overlap
    fn rectangles_overlap(&self, rect1: &Rectangle, rect2: &Rectangle) -> bool {
        let r1_right = rect1.x + rect1.width;
        let r1_top = rect1.y + rect1.height;
        let r2_right = rect2.x + rect2.width;
        let r2_top = rect2.y + rect2.height;
        
        !(rect1.x >= r2_right || rect2.x >= r1_right || rect1.y >= r2_top || rect2.y >= r1_top)
    }

    async fn update_document(
        &self,
        document: &PdfDocument,
        changes: &[PdfModification],
    ) -> Result<PdfDocument> {
        let mut updated_document = document.clone();
        
        for change in changes {
            match change {
                PdfModification::AddSignatureField(field_def) => {
                    let signature_field = SignatureField {
                        name: field_def.name.clone(),
                        page: field_def.page,
                        bounds: field_def.bounds.clone(),
                        appearance: field_def.appearance.clone(),
                        is_signed: false,
                    };
                    updated_document.signature_fields.push(signature_field);
                }
                PdfModification::EmbedSignature { field_name, signature_data, appearance } => {
                    // Find the signature field and mark it as signed
                    for field in &mut updated_document.signature_fields {
                        if field.name == *field_name {
                            field.is_signed = true;
                            if let Some(app) = appearance {
                                field.appearance = Some(app.clone());
                            }
                            break;
                        }
                    }
                    
                    // Create a digital signature entry
                    let signature = DigitalSignature {
                        signature_data: signature_data.clone(),
                        signing_time: chrono::Utc::now(),
                        signer_name: "Unknown".to_string(), // Would be extracted from certificate
                        reason: None,
                        location: None,
                        contact_info: None,
                        certificate_info: CertificateInfo {
                            subject: "Unknown".to_string(),
                            issuer: "Unknown".to_string(),
                            serial_number: "Unknown".to_string(),
                            not_before: chrono::Utc::now(),
                            not_after: chrono::Utc::now(),
                            key_algorithm: "RSA".to_string(),
                            key_size: 2048,
                        },
                        field_name: field_name.clone(),
                    };
                    
                    updated_document.existing_signatures.push(signature);
                }
                PdfModification::UpdateMetadata(new_metadata) => {
                    updated_document.metadata = new_metadata.clone();
                }
            }
        }
        
        Ok(updated_document)
    }
}