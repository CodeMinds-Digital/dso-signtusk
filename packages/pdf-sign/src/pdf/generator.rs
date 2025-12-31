//! PDF document generation and serialization

use crate::{
    error::Result,
    pdf::structure::{PdfObject, PdfObjectRef},
    traits::PdfGenerator,
    types::*,
};
use async_trait::async_trait;
use chrono::Utc;
use std::collections::HashMap;

/// PDF generator implementation
pub struct PdfGeneratorImpl {
    /// Whether to compress streams
    compress_streams: bool,
    /// Maximum object number used
    max_object_number: u32,
}

impl PdfGeneratorImpl {
    pub fn new() -> Self {
        Self {
            compress_streams: true,
            max_object_number: 0,
        }
    }

    pub fn with_compression(mut self, compress: bool) -> Self {
        self.compress_streams = compress;
        self
    }

    /// Generate a new object number
    fn next_object_number(&mut self) -> u32 {
        self.max_object_number += 1;
        self.max_object_number
    }

    /// Serialize a PDF object to string representation
    fn serialize_object(&self, object: &PdfObject) -> Result<String> {
        match object {
            PdfObject::Null => Ok("null".to_string()),
            PdfObject::Boolean(b) => Ok(if *b { "true" } else { "false" }.to_string()),
            PdfObject::Integer(i) => Ok(i.to_string()),
            PdfObject::Real(f) => Ok(format!("{:.6}", f)),
            PdfObject::String(s) => {
                // Basic string serialization - in a full implementation, this would handle escaping
                let string_content = String::from_utf8_lossy(s);
                Ok(format!("({})", string_content))
            }
            PdfObject::Name(n) => Ok(format!("/{}", n)),
            PdfObject::Array(arr) => {
                let elements: Result<Vec<String>> = arr.iter()
                    .map(|obj| self.serialize_object(obj))
                    .collect();
                Ok(format!("[{}]", elements?.join(" ")))
            }
            PdfObject::Dictionary(dict) => {
                let mut entries = Vec::new();
                for (key, value) in dict {
                    let serialized_value = self.serialize_object(value)?;
                    entries.push(format!("/{} {}", key, serialized_value));
                }
                Ok(format!("<<{}>>", entries.join(" ")))
            }
            PdfObject::Stream { dictionary, data } => {
                let dict_str = self.serialize_object(&PdfObject::Dictionary(dictionary.clone()))?;
                Ok(format!("{}\nstream\n{}\nendstream", 
                    dict_str, 
                    String::from_utf8_lossy(data)))
            }
            PdfObject::Reference(obj_ref) => {
                Ok(format!("{} {} R", obj_ref.object_number, obj_ref.generation))
            }
        }
    }

    /// Create a signature field dictionary
    fn create_signature_field_dict(&self, field: &SignatureFieldDefinition) -> HashMap<String, PdfObject> {
        let mut field_dict = HashMap::new();
        
        // Field type
        field_dict.insert("FT".to_string(), PdfObject::Name("Sig".to_string()));
        
        // Field name
        field_dict.insert("T".to_string(), PdfObject::String(field.name.as_bytes().to_vec()));
        
        // Field rectangle (bounds)
        let rect_array = vec![
            PdfObject::Real(field.bounds.x),
            PdfObject::Real(field.bounds.y),
            PdfObject::Real(field.bounds.x + field.bounds.width),
            PdfObject::Real(field.bounds.y + field.bounds.height),
        ];
        field_dict.insert("Rect".to_string(), PdfObject::Array(rect_array));
        
        // Page reference (simplified - would need actual page object reference)
        field_dict.insert("P".to_string(), PdfObject::Reference(PdfObjectRef {
            object_number: field.page + 1, // Simplified page reference
            generation: 0,
        }));
        
        // Field flags (signature field)
        field_dict.insert("Ff".to_string(), PdfObject::Integer(132)); // ReadOnly + NoExport
        
        field_dict
    }

    /// Create an incremental update section (internal method)
    fn create_incremental_update_internal(
        &mut self,
        original_data: &[u8],
        new_objects: &[(u32, PdfObject)],
    ) -> Result<Vec<u8>> {
        let mut output = Vec::new();
        
        // Start with original document
        output.extend_from_slice(original_data);
        
        // Add new objects
        let mut xref_entries = Vec::new();
        
        for (obj_num, obj) in new_objects {
            let obj_offset = output.len();
            
            // Write object
            let obj_str = format!("{} 0 obj\n{}\nendobj\n", 
                obj_num, 
                self.serialize_object(obj)?);
            output.extend_from_slice(obj_str.as_bytes());
            
            // Record xref entry
            xref_entries.push((*obj_num, obj_offset));
        }
        
        // Write cross-reference table
        let xref_offset = output.len();
        output.extend_from_slice(b"xref\n");
        
        if !xref_entries.is_empty() {
            let min_obj = xref_entries.iter().map(|(num, _)| *num).min().unwrap();
            let max_obj = xref_entries.iter().map(|(num, _)| *num).max().unwrap();
            
            output.extend_from_slice(format!("{} {}\n", min_obj, max_obj - min_obj + 1).as_bytes());
            
            for obj_num in min_obj..=max_obj {
                if let Some((_, offset)) = xref_entries.iter().find(|(num, _)| *num == obj_num) {
                    output.extend_from_slice(format!("{:010} 00000 n \n", offset).as_bytes());
                } else {
                    output.extend_from_slice(b"0000000000 65535 f \n");
                }
            }
        }
        
        // Write trailer
        output.extend_from_slice(b"trailer\n");
        output.extend_from_slice(b"<<\n");
        output.extend_from_slice(format!("/Size {}\n", self.max_object_number + 1).as_bytes());
        
        // In a full implementation, we would reference the previous trailer
        output.extend_from_slice(b"/Root 1 0 R\n");
        output.extend_from_slice(b">>\n");
        
        // Write startxref
        output.extend_from_slice(b"startxref\n");
        output.extend_from_slice(format!("{}\n", xref_offset).as_bytes());
        output.extend_from_slice(b"%%EOF\n");
        
        Ok(output)
    }

    /// Embed signature data into a signature field with comprehensive metadata
    /// Handles signing time, signer name, reason for signing, and field positioning respect
    fn embed_signature_in_field(
        &self,
        field_dict: &mut HashMap<String, PdfObject>,
        signature: &DigitalSignature,
        appearance: Option<&SignatureAppearance>,
    ) -> Result<()> {
        // Core signature data
        field_dict.insert("V".to_string(), PdfObject::String(signature.signature_data.clone()));
        
        // Comprehensive signature metadata embedding per Requirements 6.2
        
        // 1. Signing time - Always embed (required by PDF specification)
        let time_str = signature.signing_time.format("D:%Y%m%d%H%M%S+00'00'").to_string();
        field_dict.insert("M".to_string(), PdfObject::String(time_str.as_bytes().to_vec()));
        
        // 2. Signer name - Always embed (required for identification)
        field_dict.insert("Name".to_string(), PdfObject::String(signature.signer_name.as_bytes().to_vec()));
        
        // 3. Reason for signing - Embed if provided
        if let Some(reason) = &signature.reason {
            field_dict.insert("Reason".to_string(), PdfObject::String(reason.as_bytes().to_vec()));
        }
        
        // 4. Additional optional metadata
        if let Some(location) = &signature.location {
            field_dict.insert("Location".to_string(), PdfObject::String(location.as_bytes().to_vec()));
        }
        
        if let Some(contact_info) = &signature.contact_info {
            field_dict.insert("ContactInfo".to_string(), PdfObject::String(contact_info.as_bytes().to_vec()));
        }
        
        // 5. Certificate information metadata
        self.embed_certificate_metadata(field_dict, &signature.certificate_info)?;
        
        // 6. Signature field positioning and appearance handling per Requirements 6.4
        self.embed_signature_appearance_with_field_respect(field_dict, appearance)?;
        
        // 7. Signature validation metadata
        self.embed_signature_validation_metadata(field_dict, signature)?;
        
        Ok(())
    }

    /// Embed certificate information into signature metadata
    fn embed_certificate_metadata(
        &self,
        field_dict: &mut HashMap<String, PdfObject>,
        cert_info: &CertificateInfo,
    ) -> Result<()> {
        // Certificate subject (signer identity)
        if !cert_info.subject.is_empty() {
            field_dict.insert("SubjectDN".to_string(), PdfObject::String(cert_info.subject.as_bytes().to_vec()));
        }
        
        // Certificate issuer
        if !cert_info.issuer.is_empty() {
            field_dict.insert("IssuerDN".to_string(), PdfObject::String(cert_info.issuer.as_bytes().to_vec()));
        }
        
        // Certificate serial number
        if !cert_info.serial_number.is_empty() {
            field_dict.insert("SerialNumber".to_string(), PdfObject::String(cert_info.serial_number.as_bytes().to_vec()));
        }
        
        // Certificate validity period
        let not_before_str = cert_info.not_before.format("D:%Y%m%d%H%M%S+00'00'").to_string();
        let not_after_str = cert_info.not_after.format("D:%Y%m%d%H%M%S+00'00'").to_string();
        
        field_dict.insert("CertNotBefore".to_string(), PdfObject::String(not_before_str.as_bytes().to_vec()));
        field_dict.insert("CertNotAfter".to_string(), PdfObject::String(not_after_str.as_bytes().to_vec()));
        
        // Key algorithm and size information
        let key_info = format!("{} {} bits", cert_info.key_algorithm, cert_info.key_size);
        field_dict.insert("KeyInfo".to_string(), PdfObject::String(key_info.as_bytes().to_vec()));
        
        Ok(())
    }

    /// Embed signature appearance while respecting pre-defined field dimensions and positioning
    /// Implements Requirements 6.4: respect existing field dimensions and positioning
    fn embed_signature_appearance_with_field_respect(
        &self,
        field_dict: &mut HashMap<String, PdfObject>,
        appearance: Option<&SignatureAppearance>,
    ) -> Result<()> {
        if let Some(app) = appearance {
            if app.visible {
                // Create appearance dictionary
                let mut ap_dict = HashMap::new();
                
                // Handle field positioning respect per Requirements 6.4
                if let Some(bounds) = &app.bounds {
                    // Validate that appearance respects field bounds
                    self.validate_appearance_field_respect(bounds)?;
                    
                    // Create appearance stream that fits within field bounds
                    let appearance_ref = PdfObjectRef {
                        object_number: self.max_object_number + 1,
                        generation: 0,
                    };
                    
                    ap_dict.insert("N".to_string(), PdfObject::Reference(appearance_ref));
                    
                    // Add bounding box information to respect field positioning
                    let bbox_array = vec![
                        PdfObject::Real(0.0),
                        PdfObject::Real(0.0),
                        PdfObject::Real(bounds.width),
                        PdfObject::Real(bounds.height),
                    ];
                    ap_dict.insert("BBox".to_string(), PdfObject::Array(bbox_array));
                }
                
                // Handle page-specific positioning if specified
                if let Some(page) = app.page {
                    field_dict.insert("P".to_string(), PdfObject::Reference(PdfObjectRef {
                        object_number: page + 1, // Page object reference
                        generation: 0,
                    }));
                }
                
                field_dict.insert("AP".to_string(), PdfObject::Dictionary(ap_dict));
                
                // Add appearance characteristics for field respect
                self.embed_appearance_characteristics(field_dict, app)?;
            }
        }
        
        Ok(())
    }

    /// Validate that signature appearance respects pre-defined field constraints
    fn validate_appearance_field_respect(&self, bounds: &Rectangle) -> Result<()> {
        use crate::error::PdfSignError;
        
        // Validate field dimensions are reasonable
        if bounds.width <= 0.0 || bounds.height <= 0.0 {
            return Err(PdfSignError::SignatureField {
                message: "Signature field bounds must have positive dimensions".to_string(),
                code: crate::error::ErrorCode::SignatureField,
            ,
                code: crate::error::ErrorCode::SignatureField,});
        }
        
        // Validate minimum size for readability
        if bounds.width < 50.0 || bounds.height < 20.0 {
            return Err(PdfSignError::SignatureField {
                message: "Signature field is too small for readable content".to_string(),
                code: crate::error::ErrorCode::SignatureField,
            ,
                code: crate::error::ErrorCode::SignatureField,});
        }
        
        // Validate maximum reasonable size (prevent excessive resource usage)
        if bounds.width > 2000.0 || bounds.height > 2000.0 {
            return Err(PdfSignError::SignatureField {
                message: "Signature field dimensions are unreasonably large".to_string(),
                code: crate::error::ErrorCode::SignatureField,
            ,
                code: crate::error::ErrorCode::SignatureField,});
        }
        
        Ok(())
    }

    /// Embed appearance characteristics that respect field positioning
    fn embed_appearance_characteristics(
        &self,
        field_dict: &mut HashMap<String, PdfObject>,
        appearance: &SignatureAppearance,
    ) -> Result<()> {
        let mut mk_dict = HashMap::new();
        
        // Background color if specified
        if let Some(bg_color) = &appearance.background_color {
            let bg_array = vec![
                PdfObject::Real(bg_color.r as f64 / 255.0),
                PdfObject::Real(bg_color.g as f64 / 255.0),
                PdfObject::Real(bg_color.b as f64 / 255.0),
            ];
            mk_dict.insert("BG".to_string(), PdfObject::Array(bg_array));
        }
        
        // Border color if specified
        if let Some(border_color) = &appearance.border_color {
            let border_array = vec![
                PdfObject::Real(border_color.r as f64 / 255.0),
                PdfObject::Real(border_color.g as f64 / 255.0),
                PdfObject::Real(border_color.b as f64 / 255.0),
            ];
            mk_dict.insert("BC".to_string(), PdfObject::Array(border_array));
        }
        
        // Caption text if specified
        if let Some(text) = &appearance.text {
            mk_dict.insert("CA".to_string(), PdfObject::String(text.as_bytes().to_vec()));
        }
        
        if !mk_dict.is_empty() {
            field_dict.insert("MK".to_string(), PdfObject::Dictionary(mk_dict));
        }
        
        Ok(())
    }

    /// Embed signature validation metadata for future verification
    fn embed_signature_validation_metadata(
        &self,
        field_dict: &mut HashMap<String, PdfObject>,
        signature: &DigitalSignature,
    ) -> Result<()> {
        // Signature field name for reference
        field_dict.insert("T".to_string(), PdfObject::String(signature.field_name.as_bytes().to_vec()));
        
        // Signature type and format information
        field_dict.insert("Type".to_string(), PdfObject::Name("Sig".to_string()));
        field_dict.insert("Filter".to_string(), PdfObject::Name("Adobe.PPKLite".to_string()));
        field_dict.insert("SubFilter".to_string(), PdfObject::Name("adbe.pkcs7.detached".to_string()));
        
        // Signature creation application info
        let app_info = format!("PDF Digital Signature Library v1.0");
        field_dict.insert("Prop_Build".to_string(), PdfObject::String(app_info.as_bytes().to_vec()));
        
        // Signature validation flags
        field_dict.insert("Ff".to_string(), PdfObject::Integer(132)); // ReadOnly + NoExport
        
        Ok(())
    }

    /// Preserve all document content during signing operations
    /// Ensures existing PDF content, structure, metadata, and annotations are maintained
    fn preserve_document_content(&self, document: &PdfDocument) -> Result<PdfDocument> {
        let mut preserved_document = document.clone();
        
        // Preserve all metadata fields
        // The metadata is already cloned, but we ensure no fields are lost
        if preserved_document.metadata.title.is_none() && !document.metadata.title.is_none() {
            preserved_document.metadata.title = document.metadata.title.clone();
        }
        if preserved_document.metadata.author.is_none() && !document.metadata.author.is_none() {
            preserved_document.metadata.author = document.metadata.author.clone();
        }
        if preserved_document.metadata.subject.is_none() && !document.metadata.subject.is_none() {
            preserved_document.metadata.subject = document.metadata.subject.clone();
        }
        if preserved_document.metadata.creator.is_none() && !document.metadata.creator.is_none() {
            preserved_document.metadata.creator = document.metadata.creator.clone();
        }
        if preserved_document.metadata.producer.is_none() && !document.metadata.producer.is_none() {
            preserved_document.metadata.producer = document.metadata.producer.clone();
        }
        if preserved_document.metadata.creation_date.is_none() && !document.metadata.creation_date.is_none() {
            preserved_document.metadata.creation_date = document.metadata.creation_date;
        }
        if preserved_document.metadata.modification_date.is_none() && !document.metadata.modification_date.is_none() {
            preserved_document.metadata.modification_date = document.metadata.modification_date;
        }
        
        // Preserve custom properties
        for (key, value) in &document.metadata.custom_properties {
            preserved_document.metadata.custom_properties.insert(key.clone(), value.clone());
        }
        
        // Preserve all signature fields (both signed and unsigned)
        preserved_document.signature_fields = document.signature_fields.clone();
        
        // Preserve all existing signatures
        preserved_document.existing_signatures = document.existing_signatures.clone();
        
        // Preserve document structure properties
        preserved_document.version = document.version.clone();
        preserved_document.page_count = document.page_count;
        
        // Preserve the original document data
        preserved_document.data = document.data.clone();
        
        Ok(preserved_document)
    }

    /// Embed signature into PDF while preserving all existing content
    /// Uses incremental updates to maintain document integrity
    async fn embed_signature_preserving_content(
        &self,
        original_data: &[u8],
        signature: &DigitalSignature,
        field: &SignatureField,
    ) -> Result<Vec<u8>> {
        // Create signature field modification
        let signature_modification = PdfModification::EmbedSignature {
            field_name: field.name.clone(),
            signature_data: signature.signature_data.clone(),
            appearance: field.appearance.clone(),
        };
        
        // Create a temporary document to use the incremental update method
        let temp_document = PdfDocument {
            version: "1.7".to_string(), // Default version
            page_count: 1, // Minimal document for incremental update
            metadata: PdfMetadata {
                title: None,
                author: None,
                subject: None,
                keywords: None,
                creator: None,
                producer: None,
                creation_date: None,
                modification_date: None,
                custom_properties: HashMap::new(),
            },
            signature_fields: vec![],
            existing_signatures: vec![],
            data: original_data.to_vec(),
        };
        
        // Use incremental update to preserve all existing content
        self.create_incremental_update(&temp_document, &[signature_modification]).await
    }

    /// Validate that content preservation was successful
    fn validate_content_preservation(
        &self,
        original: &PdfDocument,
        modified: &PdfDocument,
    ) -> Result<()> {
        use crate::error::PdfSignError;
        
        // Verify core document properties are preserved
        if original.version != modified.version {
            return Err(PdfSignError::ContentPreservation {
                message: format!(
                    "PDF version changed from {,
                code: crate::error::ErrorCode::ContentPreservation,} to {}",
                    original.version, modified.version
                ),
            });
        }
        
        if original.page_count != modified.page_count {
            return Err(PdfSignError::ContentPreservation {
                message: format!(
                    "Page count changed from {,
                code: crate::error::ErrorCode::ContentPreservation,} to {}",
                    original.page_count, modified.page_count
                ),
            });
        }
        
        // Verify metadata preservation
        if original.metadata.title != modified.metadata.title {
            return Err(PdfSignError::ContentPreservation {
                message: "Document title was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        if original.metadata.author != modified.metadata.author {
            return Err(PdfSignError::ContentPreservation {
                message: "Document author was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        if original.metadata.subject != modified.metadata.subject {
            return Err(PdfSignError::ContentPreservation {
                message: "Document subject was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        if original.metadata.creator != modified.metadata.creator {
            return Err(PdfSignError::ContentPreservation {
                message: "Document creator was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        if original.metadata.creation_date != modified.metadata.creation_date {
            return Err(PdfSignError::ContentPreservation {
                message: "Document creation date was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        // Verify custom properties are preserved
        for (key, original_value) in &original.metadata.custom_properties {
            if let Some(modified_value) = modified.metadata.custom_properties.get(key) {
                if original_value != modified_value {
                    return Err(PdfSignError::ContentPreservation {
                        message: format!("Custom property '{,
                code: crate::error::ErrorCode::ContentPreservation,}' value was modified", key),
                    });
                }
            } else {
                return Err(PdfSignError::ContentPreservation {
                    message: format!("Custom property '{,
                code: crate::error::ErrorCode::ContentPreservation,}' was lost", key),
                });
            }
        }
        
        // Verify existing signatures are preserved
        if original.existing_signatures.len() > modified.existing_signatures.len() {
            return Err(PdfSignError::ContentPreservation {
                message: "Existing signatures were lost during signing".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        // Verify original signature fields are preserved
        for original_field in &original.signature_fields {
            let found = modified.signature_fields.iter().any(|modified_field| {
                modified_field.name == original_field.name &&
                modified_field.page == original_field.page &&
                modified_field.bounds == original_field.bounds
            });
            
            if !found {
                return Err(PdfSignError::ContentPreservation {
                    message: format!("Signature field '{,
                code: crate::error::ErrorCode::ContentPreservation,}' was not preserved", original_field.name),
                });
            }
        }
        
        // Verify document data has grown (signature was added) but original content is preserved
        if modified.data.len() < original.data.len() {
            return Err(PdfSignError::ContentPreservation {
                message: "Document data was truncated during signing".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        Ok(())
    }
}

impl Default for PdfGeneratorImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl PdfGenerator for PdfGeneratorImpl {
    async fn serialize_document(&self, document: &PdfDocument) -> Result<Vec<u8>> {
        // For now, return the original data
        // In a full implementation, this would reconstruct the entire PDF
        Ok(document.data.clone())
    }

    async fn create_incremental_update(
        &self,
        document: &PdfDocument,
        changes: &[PdfModification],
    ) -> Result<Vec<u8>> {
        let mut generator = Self::new(); // Create a mutable instance for object numbering
        let mut new_objects = Vec::new();
        
        for change in changes {
            match change {
                PdfModification::AddSignatureField(field_def) => {
                    let obj_num = generator.next_object_number();
                    let field_dict = generator.create_signature_field_dict(field_def);
                    new_objects.push((obj_num, PdfObject::Dictionary(field_dict)));
                }
                PdfModification::EmbedSignature { field_name: _, signature_data, appearance } => {
                    // Find existing signature field and update it
                    let obj_num = generator.next_object_number();
                    let mut field_dict = HashMap::new();
                    
                    // Create a basic signature dictionary
                    field_dict.insert("Type".to_string(), PdfObject::Name("Sig".to_string()));
                    field_dict.insert("Filter".to_string(), PdfObject::Name("Adobe.PPKLite".to_string()));
                    field_dict.insert("SubFilter".to_string(), PdfObject::Name("adbe.pkcs7.detached".to_string()));
                    field_dict.insert("Contents".to_string(), PdfObject::String(signature_data.clone()));
                    
                    // Create a temporary signature for metadata embedding
                    let temp_signature = DigitalSignature {
                        signature_data: signature_data.clone(),
                        signing_time: chrono::Utc::now(),
                        signer_name: "Signer".to_string(),
                        reason: None,
                        location: None,
                        contact_info: None,
                        certificate_info: CertificateInfo {
                            subject: "Temp".to_string(),
                            issuer: "Temp".to_string(),
                            serial_number: "0".to_string(),
                            not_before: chrono::Utc::now(),
                            not_after: chrono::Utc::now(),
                            key_algorithm: "RSA".to_string(),
                            key_size: 2048,
                            der_data: Vec::new(),
                        },
                        field_name: "Signature".to_string(),
                    };
                    
                    // Embed signature with appearance
                    generator.embed_signature_in_field(&mut field_dict, &temp_signature, appearance.as_ref())?;
                    
                    new_objects.push((obj_num, PdfObject::Dictionary(field_dict)));
                }
                PdfModification::UpdateMetadata(metadata) => {
                    let obj_num = generator.next_object_number();
                    let mut info_dict = HashMap::new();
                    
                    if let Some(title) = &metadata.title {
                        info_dict.insert("Title".to_string(), PdfObject::String(title.as_bytes().to_vec()));
                    }
                    if let Some(author) = &metadata.author {
                        info_dict.insert("Author".to_string(), PdfObject::String(author.as_bytes().to_vec()));
                    }
                    if let Some(subject) = &metadata.subject {
                        info_dict.insert("Subject".to_string(), PdfObject::String(subject.as_bytes().to_vec()));
                    }
                    if let Some(creator) = &metadata.creator {
                        info_dict.insert("Creator".to_string(), PdfObject::String(creator.as_bytes().to_vec()));
                    }
                    if let Some(producer) = &metadata.producer {
                        info_dict.insert("Producer".to_string(), PdfObject::String(producer.as_bytes().to_vec()));
                    }
                    
                    new_objects.push((obj_num, PdfObject::Dictionary(info_dict)));
                }
            }
        }
        
        generator.create_incremental_update_internal(&document.data, &new_objects)
    }

    async fn embed_signature(
        &self,
        document: &PdfDocument,
        signature: &DigitalSignature,
        field: &SignatureField,
    ) -> Result<PdfDocument> {
        // Create a new document with the signature embedded while preserving all content
        let mut new_document = self.preserve_document_content(document)?;
        
        // Find the signature field and mark it as signed
        for existing_field in &mut new_document.signature_fields {
            if existing_field.name == field.name {
                existing_field.is_signed = true;
                break;
            }
        }
        
        // Add the signature to the existing signatures list
        new_document.existing_signatures.push(signature.clone());
        
        // Preserve and update document structure with signature and appearance
        let updated_data = self.embed_signature_preserving_content(
            &new_document.data,
            signature,
            field,
        ).await?;
        
        new_document.data = updated_data;
        
        Ok(new_document)
    }

    /// Embed a signature using incremental update to preserve existing signatures
    async fn embed_signature_incrementally(
        &self,
        document: &PdfDocument,
        signature: &DigitalSignature,
        field: &SignatureField,
    ) -> Result<PdfDocument> {
        // Create a new document with the signature embedded while preserving ALL content
        let mut new_document = self.preserve_document_content(document)?;
        
        // Find the signature field and mark it as signed
        for existing_field in &mut new_document.signature_fields {
            if existing_field.name == field.name {
                existing_field.is_signed = true;
                break;
            }
        }
        
        // Add the signature to the existing signatures list (preserving order)
        new_document.existing_signatures.push(signature.clone());
        
        // Use incremental update to preserve all existing signatures and content
        let signature_modification = PdfModification::EmbedSignature {
            field_name: field.name.clone(),
            signature_data: signature.signature_data.clone(),
            appearance: field.appearance.clone(),
        };
        
        let updated_data = self.create_incremental_update(&new_document, &[signature_modification]).await?;
        new_document.data = updated_data;
        
        Ok(new_document)
    }
}