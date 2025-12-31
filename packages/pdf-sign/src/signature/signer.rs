//! PDF document signing implementation

use crate::{
    crypto::{engine::CryptographicEngineImpl, pkcs7::Pkcs7Builder},
    error::{PdfSignError, Result},
    pdf::{generator::PdfGeneratorImpl, parser::PdfParserImpl},
    resource::{ScopedResourceManager, ResourceGuard},
    traits::{CryptographicEngine, PdfGenerator, PdfParser, PdfSigner},
    types::*,
};
use async_trait::async_trait;
use chrono::Utc;

/// PDF signer implementation that orchestrates the signing process
pub struct PdfSignerImpl {
    /// PDF parser for document structure handling
    pdf_parser: PdfParserImpl,
    /// PDF generator for document serialization
    pdf_generator: PdfGeneratorImpl,
    /// Cryptographic engine for signature operations
    crypto_engine: CryptographicEngineImpl,
    /// PKCS#7 builder for signature containers
    pkcs7_builder: Pkcs7Builder,
}

impl PdfSignerImpl {
    pub fn new() -> Self {
        Self {
            pdf_parser: PdfParserImpl::new(),
            pdf_generator: PdfGeneratorImpl::new(),
            crypto_engine: CryptographicEngineImpl::new(),
            pkcs7_builder: Pkcs7Builder::new(),
        }
    }

    /// Main signing orchestration workflow
    async fn sign_document_internal(
        &self,
        document: &PdfDocument,
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
        target_field: Option<&str>,
    ) -> Result<PdfDocument> {
        // Create scoped resource manager for automatic cleanup
        let mut resource_manager = ScopedResourceManager::new();
        
        // Register cryptographic contexts for cleanup
        let _crypto_guard = resource_manager.register_crypto_context("signing_operation")?;
        
        // Step 1: Validate inputs
        self.validate_signing_inputs(document, credentials, &options)?;

        // Step 2: Determine or create signature field
        let signature_field = self.resolve_signature_field(document, target_field).await?;

        // Step 3: Prepare document for signing (ensure signature field exists)
        let prepared_document = self.prepare_document_for_signing(document, &signature_field).await?;

        // Step 4: Calculate document hash (excluding signature field contents)
        let hash_algorithm = options.as_ref()
            .and_then(|o| o.hash_algorithm.clone())
            .unwrap_or(HashAlgorithm::Sha256);
        
        let document_hash = self.crypto_engine
            .compute_document_hash(&prepared_document, hash_algorithm)
            .await?;

        // Register secure memory for hash cleanup
        let _hash_guard = resource_manager.register_secure_memory(document_hash.len())?;

        // Step 5: Create PKCS#7 signature container
        let pkcs7_options = Pkcs7Options {
            include_signing_time: true,
            include_content: false, // Detached signature for PDF
            detached_signature: true,
            timestamp_server: options.as_ref().and_then(|o| o.timestamp_server.clone()),
        };

        let pkcs7_signature = self.pkcs7_builder
            .create_signature(&document_hash, credentials, &pkcs7_options)
            .await?;

        // Register PKCS#7 signature data for cleanup
        let _pkcs7_guard = resource_manager.register_secure_memory(pkcs7_signature.len())?;

        // Step 6: Create digital signature metadata
        let digital_signature = self.create_digital_signature_metadata(
            pkcs7_signature,
            credentials,
            &options,
            &signature_field.name,
        )?;

        // Step 7: Embed signature into PDF document
        let signed_document = self.pdf_generator
            .embed_signature(&prepared_document, &digital_signature, &signature_field)
            .await?;

        // Step 8: Validate content preservation
        self.validate_content_preservation(&prepared_document, &signed_document)?;

        // Step 9: Validate the signed document
        self.validate_signed_document(&signed_document)?;

        // Resources will be automatically cleaned up when resource_manager drops
        Ok(signed_document)
    }

    /// Validate signing inputs for correctness
    fn validate_signing_inputs(
        &self,
        document: &PdfDocument,
        credentials: &SigningCredentials,
        options: &Option<SigningOptions>,
    ) -> Result<()> {
        // Validate document
        if document.data.is_empty() {
            return Err(PdfSignError::pdf_parsing("Document data is empty"));
        }

        if document.page_count == 0 {
            return Err(PdfSignError::pdf_parsing("Document has no pages"));
        }

        // Validate credentials
        if credentials.certificate.der_data.is_empty() {
            return Err(PdfSignError::invalid_certificate("Certificate data is empty"));
        }

        if credentials.private_key.der_data.is_empty() {
            return Err(PdfSignError::invalid_key("Private key data is empty"));
        }

        // Validate certificate is not expired
        let now = Utc::now();
        if now < credentials.certificate.not_before || now > credentials.certificate.not_after {
            return Err(PdfSignError::certificate_expired());
        }

        // Validate options if provided
        if let Some(opts) = options {
            if let Some(appearance) = &opts.appearance {
                if let Some(bounds) = &appearance.bounds {
                    if bounds.width <= 0.0 || bounds.height <= 0.0 {
                        return Err(PdfSignError::signature_field(
                            "Signature appearance bounds must have positive dimensions"
                        ));
                    }
                }
            }
        }

        Ok(())
    }

    /// Resolve which signature field to use for signing with field positioning respect
    /// Implements Requirements 6.4: respect existing field dimensions and positioning
    async fn resolve_signature_field(
        &self,
        document: &PdfDocument,
        target_field: Option<&str>,
    ) -> Result<SignatureField> {
        if let Some(field_name) = target_field {
            // Use specific field - must respect its pre-defined dimensions per Requirements 6.4
            let field = document.signature_fields
                .iter()
                .find(|f| f.name == field_name)
                .cloned()
                .ok_or_else(|| PdfSignError::SignatureField {
                    message: format!("Signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' not found", field_name),
                    code: crate::error::ErrorCode::SignatureField,
                })?;

            // Validate that pre-defined field is suitable for signing
            self.validate_predefined_field_suitability(&field)?;
            
            Ok(field)
        } else {
            // Find first unsigned field or create a new one
            if let Some(unsigned_field) = document.signature_fields.iter().find(|f| !f.is_signed) {
                // Use existing unsigned field - respect its dimensions per Requirements 6.4
                self.validate_predefined_field_suitability(unsigned_field)?;
                Ok(unsigned_field.clone())
            } else {
                // Create a default signature field with appropriate positioning
                let field_def = self.pdf_parser.create_default_signature_field(document)?;
                Ok(SignatureField {
                    name: field_def.name,
                    page: field_def.page,
                    bounds: field_def.bounds,
                    appearance: field_def.appearance,
                    is_signed: false,
                })
            }
        }
    }

    /// Validate that a pre-defined signature field is suitable for signing
    /// Implements Requirements 6.4: respect existing field dimensions and positioning
    fn validate_predefined_field_suitability(&self, field: &SignatureField) -> Result<()> {
        // Validate field bounds are reasonable per Requirements 6.4
        if field.bounds.width <= 0.0 || field.bounds.height <= 0.0 {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Pre-defined signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' has invalid dimensions ({}x{})",
                    field.name, field.bounds.width, field.bounds.height
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }

        // Validate minimum dimensions for usability
        if field.bounds.width < 50.0 || field.bounds.height < 20.0 {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Pre-defined signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' is too small ({}x{}) for readable signature",
                    field.name, field.bounds.width, field.bounds.height
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }

        // Validate field positioning is within reasonable page bounds
        if field.bounds.x < 0.0 || field.bounds.y < 0.0 {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Pre-defined signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' has invalid position ({}, {})",
                    field.name, field.bounds.x, field.bounds.y
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }

        // Validate field is not already signed
        if field.is_signed {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Pre-defined signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' is already signed",
                    field.name
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }

        Ok(())
    }

    /// Prepare document for signing by ensuring signature field exists with proper positioning
    /// Implements Requirements 6.4: respect existing field dimensions and positioning
    async fn prepare_document_for_signing(
        &self,
        document: &PdfDocument,
        signature_field: &SignatureField,
    ) -> Result<PdfDocument> {
        // Check if the signature field already exists in the document
        let field_exists = document.signature_fields
            .iter()
            .any(|f| f.name == signature_field.name);

        if field_exists {
            // Field already exists, validate it respects positioning requirements
            self.validate_existing_field_positioning(document, signature_field)?;
            Ok(document.clone())
        } else {
            // Need to add the signature field to the document with proper positioning
            let field_definition = SignatureFieldDefinition {
                name: signature_field.name.clone(),
                page: signature_field.page,
                bounds: signature_field.bounds.clone(),
                appearance: signature_field.appearance.clone(),
            };

            // Validate field positioning before adding
            self.validate_new_field_positioning(document, &field_definition)?;

            self.pdf_parser.add_signature_field(document, &field_definition).await
        }
    }

    /// Validate existing field positioning meets requirements
    fn validate_existing_field_positioning(
        &self,
        document: &PdfDocument,
        signature_field: &SignatureField,
    ) -> Result<()> {
        // Validate page number is valid
        if signature_field.page >= document.page_count {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' references invalid page {} (document has {} pages)",
                    signature_field.name, signature_field.page, document.page_count
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }

        // Validate field bounds are within reasonable page limits
        // Assuming standard page sizes (this would be more precise with actual page dimensions)
        let max_page_width = 2000.0; // Points (roughly 28 inches)
        let max_page_height = 2000.0;

        if signature_field.bounds.x + signature_field.bounds.width > max_page_width {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' extends beyond reasonable page width",
                    signature_field.name
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }

        if signature_field.bounds.y + signature_field.bounds.height > max_page_height {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' extends beyond reasonable page height",
                    signature_field.name
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }

        Ok(())
    }

    /// Validate new field positioning before adding to document
    fn validate_new_field_positioning(
        &self,
        document: &PdfDocument,
        field_definition: &SignatureFieldDefinition,
    ) -> Result<()> {
        // Validate page number
        if field_definition.page >= document.page_count {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Cannot add signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' to page {} (document has {} pages)",
                    field_definition.name, field_definition.page, document.page_count
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }

        // Check for field name conflicts
        if document.signature_fields.iter().any(|f| f.name == field_definition.name) {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Signature field name '{,
                code: crate::error::ErrorCode::SignatureField,}' already exists in document",
                    field_definition.name
                ),
                code: crate::error::ErrorCode::SignatureField,
            });
        }

        // Validate field positioning doesn't overlap with existing fields
        for existing_field in &document.signature_fields {
            if existing_field.page == field_definition.page {
                if self.fields_overlap(&existing_field.bounds, &field_definition.bounds) {
                    return Err(PdfSignError::SignatureField {
                        message: format!(
                            "New signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' overlaps with existing field '{}'",
                            field_definition.name, existing_field.name
                        ),
                        code: crate::error::ErrorCode::SignatureField,
                    });
                }
            }
        }

        Ok(())
    }

    /// Check if two field bounds overlap
    fn fields_overlap(&self, bounds1: &Rectangle, bounds2: &Rectangle) -> bool {
        let left1 = bounds1.x;
        let right1 = bounds1.x + bounds1.width;
        let top1 = bounds1.y + bounds1.height;
        let bottom1 = bounds1.y;

        let left2 = bounds2.x;
        let right2 = bounds2.x + bounds2.width;
        let top2 = bounds2.y + bounds2.height;
        let bottom2 = bounds2.y;

        // Check if rectangles overlap
        !(right1 <= left2 || right2 <= left1 || top1 <= bottom2 || top2 <= bottom1)
    }

    /// Create digital signature metadata from PKCS#7 signature and options with comprehensive metadata
    /// Implements Requirements 6.2: embed signing time, signer name, and reason for signing
    fn create_digital_signature_metadata(
        &self,
        pkcs7_signature: Vec<u8>,
        credentials: &SigningCredentials,
        options: &Option<SigningOptions>,
        field_name: &str,
    ) -> Result<DigitalSignature> {
        let now = Utc::now();

        // Extract signer name from certificate (always required per Requirements 6.2)
        let signer_name = if credentials.certificate.subject.is_empty() {
            "Unknown Signer".to_string()
        } else {
            // Extract common name from subject DN if available
            self.extract_common_name_from_subject(&credentials.certificate.subject)
                .unwrap_or_else(|| credentials.certificate.subject.clone())
        };

        // Extract certificate information for comprehensive metadata
        let certificate_info = CertificateInfo {
            subject: credentials.certificate.subject.clone(),
            issuer: credentials.certificate.issuer.clone(),
            serial_number: credentials.certificate.serial_number.clone(),
            not_before: credentials.certificate.not_before,
            not_after: credentials.certificate.not_after,
            key_algorithm: credentials.certificate.public_key_algorithm.clone(),
            key_size: credentials.private_key.key_size,
            der_data: credentials.certificate.der_data.clone(),
        };

        // Extract comprehensive metadata from signing options per Requirements 6.2
        let (reason, location, contact_info) = if let Some(opts) = options {
            (
                opts.reason.clone(),
                opts.location.clone(), 
                opts.contact_info.clone()
            )
        } else {
            (None, None, None)
        };

        // Validate metadata completeness for Requirements 6.2
        self.validate_signature_metadata(&signer_name, &reason)?;

        Ok(DigitalSignature {
            signature_data: pkcs7_signature,
            signing_time: now, // Always embed signing time per Requirements 6.2
            signer_name,       // Always embed signer name per Requirements 6.2
            reason,            // Embed reason if provided per Requirements 6.2
            location,
            contact_info,
            certificate_info,
            field_name: field_name.to_string(),
        })
    }

    /// Extract common name from certificate subject DN
    fn extract_common_name_from_subject(&self, subject_dn: &str) -> Option<String> {
        // Parse subject DN to extract CN (Common Name)
        for component in subject_dn.split(',') {
            let component = component.trim();
            if component.starts_with("CN=") {
                return Some(component[3..].to_string());
            }
        }
        None
    }

    /// Validate signature metadata completeness per Requirements 6.2
    fn validate_signature_metadata(&self, signer_name: &str, reason: &Option<String>) -> Result<()> {
        // Validate signer name is meaningful (Requirements 6.2)
        if signer_name.is_empty() || signer_name == "Unknown Signer" {
            return Err(PdfSignError::SignatureCreation {
                message: "Signer name is required for signature metadata (Requirements 6.2)".to_string(),
                code: crate::error::ErrorCode::SignatureCreation,
            ,
                code: crate::error::ErrorCode::SignatureCreation,});
        }

        // Validate reason if provided (Requirements 6.2)
        if let Some(reason_text) = reason {
            if reason_text.trim().is_empty() {
                return Err(PdfSignError::SignatureCreation {
                    message: "Reason for signing cannot be empty if provided (Requirements 6.2)".to_string(),
                    code: crate::error::ErrorCode::SignatureCreation,
                ,
                code: crate::error::ErrorCode::SignatureCreation,});
            }
            
            // Validate reason length for PDF compatibility
            if reason_text.len() > 1000 {
                return Err(PdfSignError::SignatureCreation {
                    message: "Reason for signing is too long (max 1000 characters)".to_string(),
                    code: crate::error::ErrorCode::SignatureCreation,
                ,
                code: crate::error::ErrorCode::SignatureCreation,});
            }
        }

        Ok(())
    }

    /// Validate content preservation during signing
    fn validate_content_preservation(
        &self,
        original: &PdfDocument,
        signed: &PdfDocument,
    ) -> Result<()> {
        // Verify core document properties are preserved
        if original.version != signed.version {
            return Err(PdfSignError::ContentPreservation {
                message: format!(
                    "PDF version changed from {,
                code: crate::error::ErrorCode::ContentPreservation,} to {}",
                    original.version, signed.version
                ),
                code: crate::error::ErrorCode::ContentPreservation,
            });
        }
        
        if original.page_count != signed.page_count {
            return Err(PdfSignError::ContentPreservation {
                message: format!(
                    "Page count changed from {,
                code: crate::error::ErrorCode::ContentPreservation,} to {}",
                    original.page_count, signed.page_count
                ),
                code: crate::error::ErrorCode::ContentPreservation,
            });
        }
        
        // Verify metadata preservation
        if original.metadata.title != signed.metadata.title {
            return Err(PdfSignError::ContentPreservation {
                message: "Document title was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        if original.metadata.author != signed.metadata.author {
            return Err(PdfSignError::ContentPreservation {
                message: "Document author was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        if original.metadata.subject != signed.metadata.subject {
            return Err(PdfSignError::ContentPreservation {
                message: "Document subject was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        if original.metadata.creator != signed.metadata.creator {
            return Err(PdfSignError::ContentPreservation {
                message: "Document creator was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        if original.metadata.creation_date != signed.metadata.creation_date {
            return Err(PdfSignError::ContentPreservation {
                message: "Document creation date was not preserved".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        // Verify custom properties are preserved
        for (key, original_value) in &original.metadata.custom_properties {
            if let Some(signed_value) = signed.metadata.custom_properties.get(key) {
                if original_value != signed_value {
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
        
        // Verify existing signatures are preserved (should have at least the original count)
        if original.existing_signatures.len() > signed.existing_signatures.len() {
            return Err(PdfSignError::ContentPreservation {
                message: "Existing signatures were lost during signing".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        // Verify original signature fields are preserved
        for original_field in &original.signature_fields {
            let found = signed.signature_fields.iter().any(|signed_field| {
                signed_field.name == original_field.name &&
                signed_field.page == original_field.page &&
                signed_field.bounds == original_field.bounds
            });
            
            if !found {
                return Err(PdfSignError::ContentPreservation {
                    message: format!("Signature field '{,
                code: crate::error::ErrorCode::ContentPreservation,}' was not preserved", original_field.name),
                });
            }
        }
        
        // Verify document data has grown (signature was added) but original content is preserved
        if signed.data.len() < original.data.len() {
            return Err(PdfSignError::ContentPreservation {
                message: "Document data was truncated during signing".to_string(),
                code: crate::error::ErrorCode::ContentPreservation,
            ,
                code: crate::error::ErrorCode::ContentPreservation,});
        }
        
        Ok(())
    }

    /// Validate the signed document for correctness
    fn validate_signed_document(&self, document: &PdfDocument) -> Result<()> {
        // Basic validation checks
        if document.data.is_empty() {
            return Err(PdfSignError::SignatureCreation {
                message: "Signed document data is empty".to_string(),
                code: crate::error::ErrorCode::SignatureCreation,
            ,
                code: crate::error::ErrorCode::SignatureCreation,});
        }

        // Verify that signature fields are marked as signed
        let signed_fields_count = document.signature_fields.iter().filter(|f| f.is_signed).count();
        if signed_fields_count == 0 {
            return Err(PdfSignError::SignatureCreation {
                message: "No signature fields are marked as signed".to_string(),
                code: crate::error::ErrorCode::SignatureCreation,
            ,
                code: crate::error::ErrorCode::SignatureCreation,});
        }

        // Verify that we have corresponding digital signatures
        if document.existing_signatures.is_empty() {
            return Err(PdfSignError::SignatureCreation {
                message: "No digital signatures found in signed document".to_string(),
                code: crate::error::ErrorCode::SignatureCreation,
            ,
                code: crate::error::ErrorCode::SignatureCreation,});
        }

        Ok(())
    }

    /// Process multiple documents efficiently with shared cryptographic context
    async fn process_documents_batch(
        &self,
        documents: &[PdfDocument],
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
    ) -> Result<Vec<PdfDocument>> {
        let mut signed_documents = Vec::with_capacity(documents.len());

        // Process each document
        for document in documents {
            let signed_doc = self.sign_document_internal(document, credentials, options.clone(), None).await?;
            signed_documents.push(signed_doc);
        }

        Ok(signed_documents)
    }

    /// Add an incremental signature to a document that may already have signatures
    /// This preserves all existing signatures and adds a new one
    async fn add_incremental_signature(
        &self,
        document: &PdfDocument,
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
        target_field: Option<&str>,
    ) -> Result<PdfDocument> {
        // Step 1: Validate that we can add another signature
        self.validate_multiple_signature_capability(document)?;

        // Step 2: Validate inputs
        self.validate_signing_inputs(document, credentials, &options)?;

        // Step 3: Determine or create signature field for the new signature
        let signature_field = self.resolve_signature_field_for_incremental(document, target_field).await?;

        // Step 4: Prepare document for incremental signing (preserve all existing content)
        let prepared_document = self.prepare_document_for_incremental_signing(document, &signature_field).await?;

        // Step 5: Calculate document hash (excluding all signature field contents)
        let hash_algorithm = options.as_ref()
            .and_then(|o| o.hash_algorithm.clone())
            .unwrap_or(HashAlgorithm::Sha256);
        
        let document_hash = self.crypto_engine
            .compute_document_hash(&prepared_document, hash_algorithm)
            .await?;

        // Step 6: Create PKCS#7 signature container
        let pkcs7_options = Pkcs7Options {
            include_signing_time: true,
            include_content: false, // Detached signature for PDF
            detached_signature: true,
            timestamp_server: options.as_ref().and_then(|o| o.timestamp_server.clone()),
        };

        let pkcs7_signature = self.pkcs7_builder
            .create_signature(&document_hash, credentials, &pkcs7_options)
            .await?;

        // Step 7: Create digital signature metadata
        let digital_signature = self.create_digital_signature_metadata(
            pkcs7_signature,
            credentials,
            &options,
            &signature_field.name,
        )?;

        // Step 8: Embed signature using incremental update to preserve existing signatures
        let signed_document = self.pdf_generator
            .embed_signature_incrementally(&prepared_document, &digital_signature, &signature_field)
            .await?;

        // Step 9: Validate that all existing signatures are preserved
        self.validate_existing_signatures_preserved(&prepared_document, &signed_document)?;

        // Step 10: Validate content preservation
        self.validate_content_preservation(&prepared_document, &signed_document)?;

        // Step 11: Validate the signed document
        self.validate_signed_document(&signed_document)?;

        Ok(signed_document)
    }

    /// Validate that the document can accept multiple signatures
    fn validate_multiple_signature_capability(&self, document: &PdfDocument) -> Result<()> {
        // Check if document already has the maximum number of signatures
        // PDF specification doesn't define a hard limit, but we'll use a reasonable limit
        const MAX_SIGNATURES: usize = 100;
        
        if document.existing_signatures.len() >= MAX_SIGNATURES {
            return Err(PdfSignError::SignatureField {
                message: format!(
                    "Document already has maximum number of signatures ({,
                code: crate::error::ErrorCode::SignatureField,})",
                    MAX_SIGNATURES
                ),
            });
        }

        // Validate that existing signatures are still valid (basic check)
        for (index, signature) in document.existing_signatures.iter().enumerate() {
            if signature.signature_data.is_empty() {
                return Err(PdfSignError::SignatureValidation {
                    message: format!("Existing signature {,
                code: crate::error::ErrorCode::SignatureValidation,} has empty signature data", index),
                });
            }
        }

        Ok(())
    }

    /// Resolve signature field for incremental signing (find unused field or create new one)
    async fn resolve_signature_field_for_incremental(
        &self,
        document: &PdfDocument,
        target_field: Option<&str>,
    ) -> Result<SignatureField> {
        if let Some(field_name) = target_field {
            // Use specific field - must be unsigned
            let field = document.signature_fields
                .iter()
                .find(|f| f.name == field_name)
                .ok_or_else(|| PdfSignError::SignatureField {
                    message: format!("Signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' not found", field_name),
                })?;

            if field.is_signed {
                return Err(PdfSignError::SignatureField {
                    message: format!("Signature field '{,
                code: crate::error::ErrorCode::SignatureField,}' is already signed", field_name),
                });
            }

            Ok(field.clone())
        } else {
            // Find first unsigned field or create a new one
            if let Some(unsigned_field) = document.signature_fields.iter().find(|f| !f.is_signed) {
                Ok(unsigned_field.clone())
            } else {
                // Create a new signature field with unique name
                let field_name = self.generate_unique_field_name(document);
                let field_def = SignatureFieldDefinition {
                    name: field_name.clone(),
                    page: 0, // Default to first page
                    bounds: Rectangle {
                        x: 100.0,
                        y: 100.0,
                        width: 200.0,
                        height: 50.0,
                    },
                    appearance: None,
                };

                Ok(SignatureField {
                    name: field_def.name,
                    page: field_def.page,
                    bounds: field_def.bounds,
                    appearance: field_def.appearance,
                    is_signed: false,
                })
            }
        }
    }

    /// Generate a unique signature field name
    fn generate_unique_field_name(&self, document: &PdfDocument) -> String {
        let mut counter = 1;
        loop {
            let candidate_name = format!("Signature{}", counter);
            if !document.signature_fields.iter().any(|f| f.name == candidate_name) {
                return candidate_name;
            }
            counter += 1;
        }
    }

    /// Prepare document for incremental signing (preserve all existing signatures and content)
    async fn prepare_document_for_incremental_signing(
        &self,
        document: &PdfDocument,
        signature_field: &SignatureField,
    ) -> Result<PdfDocument> {
        // Start with a complete copy of the document to preserve everything
        let mut prepared_document = document.clone();

        // Check if the signature field already exists in the document
        let field_exists = prepared_document.signature_fields
            .iter()
            .any(|f| f.name == signature_field.name);

        if !field_exists {
            // Need to add the signature field to the document using incremental update
            let field_definition = SignatureFieldDefinition {
                name: signature_field.name.clone(),
                page: signature_field.page,
                bounds: signature_field.bounds.clone(),
                appearance: signature_field.appearance.clone(),
            };

            // Add field using incremental update to preserve existing signatures
            prepared_document = self.pdf_parser.add_signature_field_incrementally(&prepared_document, &field_definition).await?;
        }

        Ok(prepared_document)
    }

    /// Validate that all existing signatures are preserved after incremental signing
    fn validate_existing_signatures_preserved(
        &self,
        original: &PdfDocument,
        signed: &PdfDocument,
    ) -> Result<()> {
        // Check that we have at least as many signatures as before
        if signed.existing_signatures.len() < original.existing_signatures.len() {
            return Err(PdfSignError::SignatureValidation {
                message: format!(
                    "Signature count decreased from {,
                code: crate::error::ErrorCode::SignatureValidation,} to {} during incremental signing",
                    original.existing_signatures.len(),
                    signed.existing_signatures.len()
                ),
            });
        }

        // Check that we have exactly one more signature
        if signed.existing_signatures.len() != original.existing_signatures.len() + 1 {
            return Err(PdfSignError::SignatureValidation {
                message: format!(
                    "Expected {,
                code: crate::error::ErrorCode::SignatureValidation,} signatures after incremental signing, found {}",
                    original.existing_signatures.len() + 1,
                    signed.existing_signatures.len()
                ),
            });
        }

        // Validate that all original signatures are still present and unchanged
        for (index, original_sig) in original.existing_signatures.iter().enumerate() {
            if let Some(signed_sig) = signed.existing_signatures.get(index) {
                // Check that signature data is preserved
                if original_sig.signature_data != signed_sig.signature_data {
                    return Err(PdfSignError::SignatureValidation {
                        message: format!("Signature {,
                code: crate::error::ErrorCode::SignatureValidation,} data was modified during incremental signing", index),
                    });
                }

                // Check that signature metadata is preserved
                if original_sig.signer_name != signed_sig.signer_name {
                    return Err(PdfSignError::SignatureValidation {
                        message: format!("Signature {,
                code: crate::error::ErrorCode::SignatureValidation,} signer name was modified during incremental signing", index),
                    });
                }

                if original_sig.signing_time != signed_sig.signing_time {
                    return Err(PdfSignError::SignatureValidation {
                        message: format!("Signature {,
                code: crate::error::ErrorCode::SignatureValidation,} signing time was modified during incremental signing", index),
                    });
                }

                if original_sig.field_name != signed_sig.field_name {
                    return Err(PdfSignError::SignatureValidation {
                        message: format!("Signature {,
                code: crate::error::ErrorCode::SignatureValidation,} field name was modified during incremental signing", index),
                    });
                }
            } else {
                return Err(PdfSignError::SignatureValidation {
                    message: format!("Signature {,
                code: crate::error::ErrorCode::SignatureValidation,} was lost during incremental signing", index),
                });
            }
        }

        Ok(())
    }
}

impl Default for PdfSignerImpl {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl PdfSigner for PdfSignerImpl {
    async fn sign_document(
        &self,
        document: &PdfDocument,
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
    ) -> Result<PdfDocument> {
        self.sign_document_internal(document, credentials, options, None).await
    }

    async fn sign_document_with_field(
        &self,
        document: &PdfDocument,
        field_name: &str,
        credentials: &SigningCredentials,
    ) -> Result<PdfDocument> {
        self.sign_document_internal(document, credentials, None, Some(field_name)).await
    }

    async fn sign_multiple_documents(
        &self,
        documents: &[PdfDocument],
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
    ) -> Result<Vec<PdfDocument>> {
        if documents.is_empty() {
            return Ok(Vec::new());
        }

        self.process_documents_batch(documents, credentials, options).await
    }

    /// Add an incremental signature to a document that may already have signatures
    async fn add_incremental_signature(
        &self,
        document: &PdfDocument,
        credentials: &SigningCredentials,
        options: Option<SigningOptions>,
        target_field: Option<&str>,
    ) -> Result<PdfDocument> {
        self.add_incremental_signature(document, credentials, options, target_field).await
    }
}