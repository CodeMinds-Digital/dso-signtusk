//! Error types and handling for the PDF signing library

use thiserror::Error;

/// Error codes for programmatic error handling
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum ErrorCode {
    // Input validation error codes (1000-1999)
    InvalidPdf = 1001,
    InvalidCertificate = 1002,
    InvalidKey = 1003,
    InvalidPassword = 1004,
    
    // Cryptographic error codes (2000-2999)
    SignatureCreation = 2001,
    SignatureValidation = 2002,
    HashCalculation = 2003,
    UnsupportedAlgorithm = 2004,
    
    // PDF processing error codes (3000-3999)
    PdfParsing = 3001,
    SignatureField = 3002,
    DocumentModification = 3003,
    Serialization = 3004,
    ContentPreservation = 3005,
    
    // System error codes (4000-4999)
    Resource = 4001,
    Io = 4002,
    Platform = 4003,
    Configuration = 4004,
    Concurrency = 4005,
    
    // Certificate chain validation error codes (5000-5999)
    CertificateChainValidation = 5001,
    CertificateExpired = 5002,
    CertificateRevoked = 5003,
    
    // Standards compliance error codes (6000-6999)
    PdfCompliance = 6001,
    PadesCompliance = 6002,
    Pkcs7Compliance = 6003,
    
    // Timestamp error codes (7000-7999)
    TimestampRequest = 7001,
    TimestampValidation = 7002,
    TimestampServer = 7003,
    
    // Processing error codes (8000-8999)
    Processing = 8001,
    ResourceLimit = 8002,
}

impl std::fmt::Display for ErrorCode {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.code())
    }
}

impl ErrorCode {
    /// Get the numeric error code
    pub fn code(&self) -> u32 {
        *self as u32
    }
    
    /// Get the error category name
    pub fn category(&self) -> &'static str {
        match self {
            ErrorCode::InvalidPdf | ErrorCode::InvalidCertificate | 
            ErrorCode::InvalidKey | ErrorCode::InvalidPassword => "Input Validation",
            
            ErrorCode::SignatureCreation | ErrorCode::SignatureValidation | 
            ErrorCode::HashCalculation | ErrorCode::UnsupportedAlgorithm => "Cryptographic",
            
            ErrorCode::PdfParsing | ErrorCode::SignatureField | 
            ErrorCode::DocumentModification | ErrorCode::Serialization | 
            ErrorCode::ContentPreservation => "PDF Processing",
            
            ErrorCode::Resource | ErrorCode::Io | 
            ErrorCode::Platform | ErrorCode::Configuration | 
            ErrorCode::Concurrency => "System",
            
            ErrorCode::CertificateChainValidation | ErrorCode::CertificateExpired | 
            ErrorCode::CertificateRevoked => "Certificate Validation",
            
            ErrorCode::PdfCompliance | ErrorCode::PadesCompliance | 
            ErrorCode::Pkcs7Compliance => "Standards Compliance",
            
            ErrorCode::TimestampRequest | ErrorCode::TimestampValidation | 
            ErrorCode::TimestampServer => "Timestamp",
            
            ErrorCode::Processing | ErrorCode::ResourceLimit => "Processing",
        }
    }
}

/// Main error type for the PDF signing library
#[derive(Error, Debug)]
pub enum PdfSignError {
    // Input validation errors
    #[error("Invalid PDF document (Code: {code}): {message}")]
    InvalidPdf { message: String, code: ErrorCode },
    
    #[error("Invalid certificate (Code: {code}): {message}")]
    InvalidCertificate { message: String, code: ErrorCode },
    
    #[error("Invalid private key (Code: {code}): {message}")]
    InvalidKey { message: String, code: ErrorCode },
    
    #[error("Invalid password for protected key material (Code: {code})")]
    InvalidPassword { code: ErrorCode },
    
    // Cryptographic errors
    #[error("Signature creation failed (Code: {code}): {message}")]
    SignatureCreation { message: String, code: ErrorCode },
    
    #[error("Signature validation failed (Code: {code}): {message}")]
    SignatureValidation { message: String, code: ErrorCode },
    
    #[error("Hash calculation failed (Code: {code}): {message}")]
    HashCalculation { message: String, code: ErrorCode },
    
    #[error("Unsupported algorithm (Code: {code}): {algorithm}")]
    UnsupportedAlgorithm { algorithm: String, code: ErrorCode },
    
    // PDF processing errors
    #[error("PDF parsing failed (Code: {code}): {message}")]
    PdfParsing { message: String, code: ErrorCode },
    
    #[error("Signature field error (Code: {code}): {message}")]
    SignatureField { message: String, code: ErrorCode },
    
    #[error("Document modification failed (Code: {code}): {message}")]
    DocumentModification { message: String, code: ErrorCode },
    
    #[error("Document serialization failed (Code: {code}): {message}")]
    Serialization { message: String, code: ErrorCode },
    
    #[error("Content preservation failed (Code: {code}): {message}")]
    ContentPreservation { message: String, code: ErrorCode },
    
    // System errors
    #[error("Resource allocation failed: {message}")]
    Resource { message: String },
    
    #[error("I/O operation failed (Code: {code}): {message}")]
    Io { message: String, code: ErrorCode },
    
    #[error("Platform-specific operation failed (Code: {code}): {message}")]
    Platform { message: String, code: ErrorCode },
    
    #[error("Configuration error (Code: {code}): {message}")]
    Configuration { message: String, code: ErrorCode },
    
    #[error("Concurrency error: {message}")]
    Concurrency { message: String },
    
    // Certificate chain validation errors
    #[error("Certificate chain validation failed (Code: {code}): {message}")]
    CertificateChainValidation { message: String, code: ErrorCode },
    
    #[error("Certificate expired or not yet valid (Code: {code})")]
    CertificateExpired { code: ErrorCode },
    
    #[error("Certificate revoked (Code: {code})")]
    CertificateRevoked { code: ErrorCode },
    
    // Standards compliance errors
    #[error("PDF specification compliance violation (Code: {code}): {message}")]
    PdfCompliance { message: String, code: ErrorCode },
    
    #[error("PAdES compliance violation (Code: {code}): {message}")]
    PadesCompliance { message: String, code: ErrorCode },
    
    #[error("PKCS#7 format violation (Code: {code}): {message}")]
    Pkcs7Compliance { message: String, code: ErrorCode },
    
    // Timestamp errors
    #[error("Timestamp request failed (Code: {code}): {message}")]
    TimestampRequest { message: String, code: ErrorCode },
    
    #[error("Timestamp validation failed (Code: {code}): {message}")]
    TimestampValidation { message: String, code: ErrorCode },
    
    #[error("Timestamp server error (Code: {code}): {message}")]
    TimestampServer { message: String, code: ErrorCode },
    
    // Processing errors
    #[error("Processing error (Code: {code}): {message}")]
    Processing { message: String, code: ErrorCode },
    
    #[error("Resource limit exceeded (Code: {code}): {message}")]
    ResourceLimit { message: String, code: ErrorCode },
}

impl PdfSignError {
    /// Get the error code for programmatic handling
    pub fn error_code(&self) -> ErrorCode {
        match self {
            PdfSignError::InvalidPdf { code, .. } => *code,
            PdfSignError::InvalidCertificate { code, .. } => *code,
            PdfSignError::InvalidKey { code, .. } => *code,
            PdfSignError::InvalidPassword { code } => *code,
            PdfSignError::SignatureCreation { code, .. } => *code,
            PdfSignError::SignatureValidation { code, .. } => *code,
            PdfSignError::HashCalculation { code, .. } => *code,
            PdfSignError::UnsupportedAlgorithm { code, .. } => *code,
            PdfSignError::PdfParsing { code, .. } => *code,
            PdfSignError::SignatureField { code, .. } => *code,
            PdfSignError::DocumentModification { code, .. } => *code,
            PdfSignError::Serialization { code, .. } => *code,
            PdfSignError::ContentPreservation { code, .. } => *code,
            PdfSignError::Resource { .. } => ErrorCode::Resource,
            PdfSignError::Io { code, .. } => *code,
            PdfSignError::Platform { code, .. } => *code,
            PdfSignError::Configuration { code, .. } => *code,
            PdfSignError::Concurrency { .. } => ErrorCode::Concurrency,
            PdfSignError::CertificateChainValidation { code, .. } => *code,
            PdfSignError::CertificateExpired { code } => *code,
            PdfSignError::CertificateRevoked { code } => *code,
            PdfSignError::PdfCompliance { code, .. } => *code,
            PdfSignError::PadesCompliance { code, .. } => *code,
            PdfSignError::Pkcs7Compliance { code, .. } => *code,
            PdfSignError::TimestampRequest { code, .. } => *code,
            PdfSignError::TimestampValidation { code, .. } => *code,
            PdfSignError::TimestampServer { code, .. } => *code,
            PdfSignError::Processing { code, .. } => *code,
            PdfSignError::ResourceLimit { code, .. } => *code,
        }
    }
    
    /// Get the error category
    pub fn category(&self) -> &'static str {
        self.error_code().category()
    }
    
    /// Get the numeric error code
    pub fn code(&self) -> u32 {
        self.error_code().code()
    }
    
    /// Create a new InvalidPdf error with context
    pub fn invalid_pdf<S: Into<String>>(message: S) -> Self {
        PdfSignError::InvalidPdf {
            message: message.into(),
            code: ErrorCode::InvalidPdf,
        ,
                code: crate::error::ErrorCode::InvalidPdf,}
    }
    
    /// Create a new InvalidCertificate error with context
    pub fn invalid_certificate<S: Into<String>>(message: S) -> Self {
        PdfSignError::InvalidCertificate {
            message: message.into(),
            code: ErrorCode::InvalidCertificate,
        ,
                code: crate::error::ErrorCode::InvalidCertificate,}
    }
    
    /// Create a new InvalidKey error with context
    pub fn invalid_key<S: Into<String>>(message: S) -> Self {
        PdfSignError::InvalidKey {
            message: message.into(),
            code: ErrorCode::InvalidKey,
        ,
                code: crate::error::ErrorCode::InvalidKey,}
    }
    
    /// Create a new InvalidPassword error
    pub fn invalid_password() -> Self {
        PdfSignError::InvalidPassword {
            code: ErrorCode::InvalidPassword,
        }
    }
    
    /// Create a new SignatureCreation error with context
    pub fn signature_creation<S: Into<String>>(message: S) -> Self {
        PdfSignError::SignatureCreation {
            message: message.into(),
            code: ErrorCode::SignatureCreation,
        ,
                code: crate::error::ErrorCode::SignatureCreation,}
    }
    
    /// Create a new SignatureValidation error with context
    pub fn signature_validation<S: Into<String>>(message: S) -> Self {
        PdfSignError::SignatureValidation {
            message: message.into(),
            code: ErrorCode::SignatureValidation,
        ,
                code: crate::error::ErrorCode::SignatureValidation,}
    }
    
    /// Create a new HashCalculation error with context
    pub fn hash_calculation<S: Into<String>>(message: S) -> Self {
        PdfSignError::HashCalculation {
            message: message.into(),
            code: ErrorCode::HashCalculation,
        ,
                code: crate::error::ErrorCode::HashCalculation,}
    }
    
    /// Create a new UnsupportedAlgorithm error with context
    pub fn unsupported_algorithm<S: Into<String>>(algorithm: S) -> Self {
        PdfSignError::UnsupportedAlgorithm {
            algorithm: algorithm.into(),
            code: ErrorCode::UnsupportedAlgorithm,
        }
    }
    
    /// Create a new PdfParsing error with context
    pub fn pdf_parsing<S: Into<String>>(message: S) -> Self {
        PdfSignError::PdfParsing {
            message: message.into(),
            code: ErrorCode::PdfParsing,
        ,
                code: crate::error::ErrorCode::PdfParsing,}
    }
    
    /// Create a new SignatureField error with context
    pub fn signature_field<S: Into<String>>(message: S) -> Self {
        PdfSignError::SignatureField {
            message: message.into(),
            code: ErrorCode::SignatureField,
        ,
                code: crate::error::ErrorCode::SignatureField,}
    }
    
    /// Create a new DocumentModification error with context
    pub fn document_modification<S: Into<String>>(message: S) -> Self {
        PdfSignError::DocumentModification {
            message: message.into(),
            code: ErrorCode::DocumentModification,
        ,
                code: crate::error::ErrorCode::DocumentModification,}
    }
    
    /// Create a new Serialization error with context
    pub fn serialization<S: Into<String>>(message: S) -> Self {
        PdfSignError::Serialization {
            message: message.into(),
            code: ErrorCode::Serialization,
        ,
                code: crate::error::ErrorCode::Serialization,}
    }
    
    /// Create a new ContentPreservation error with context
    pub fn content_preservation<S: Into<String>>(message: S) -> Self {
        PdfSignError::ContentPreservation {
            message: message.into(),
            code: ErrorCode::ContentPreservation,
        ,
                code: crate::error::ErrorCode::ContentPreservation,}
    }
    
    /// Create a new Resource error with context
    pub fn resource<S: Into<String>>(message: S) -> Self {
        PdfSignError::Resource {
            message: message.into(),
        }
    }
    
    /// Create a new Io error with context
    pub fn io<S: Into<String>>(message: S) -> Self {
        PdfSignError::Io {
            message: message.into(),
            code: ErrorCode::Io,
        ,
                code: crate::error::ErrorCode::Io,}
    }
    
    /// Create a new Platform error with context
    pub fn platform<S: Into<String>>(message: S) -> Self {
        PdfSignError::Platform {
            message: message.into(),
            code: ErrorCode::Platform,
        ,
                code: crate::error::ErrorCode::Platform,}
    }
    
    /// Create a new Configuration error with context
    pub fn configuration<S: Into<String>>(message: S) -> Self {
        PdfSignError::Configuration {
            message: message.into(),
            code: ErrorCode::Configuration,
        ,
                code: crate::error::ErrorCode::Configuration,}
    }
    
    /// Create a new Concurrency error with context
    pub fn concurrency<S: Into<String>>(message: S) -> Self {
        PdfSignError::Concurrency {
            message: message.into(),
        }
    }
    
    /// Create a new CertificateChainValidation error with context
    pub fn certificate_chain_validation<S: Into<String>>(message: S) -> Self {
        PdfSignError::CertificateChainValidation {
            message: message.into(),
            code: ErrorCode::CertificateChainValidation,
        ,
                code: crate::error::ErrorCode::CertificateChainValidation,}
    }
    
    /// Create a new CertificateExpired error
    pub fn certificate_expired() -> Self {
        PdfSignError::CertificateExpired {
            code: ErrorCode::CertificateExpired,
        }
    }
    
    /// Create a new CertificateRevoked error
    pub fn certificate_revoked() -> Self {
        PdfSignError::CertificateRevoked {
            code: ErrorCode::CertificateRevoked,
        }
    }
    
    /// Create a new PdfCompliance error with context
    pub fn pdf_compliance<S: Into<String>>(message: S) -> Self {
        PdfSignError::PdfCompliance {
            message: message.into(),
            code: ErrorCode::PdfCompliance,
        ,
                code: crate::error::ErrorCode::PdfCompliance,}
    }
    
    /// Create a new PadesCompliance error with context
    pub fn pades_compliance<S: Into<String>>(message: S) -> Self {
        PdfSignError::PadesCompliance {
            message: message.into(),
            code: ErrorCode::PadesCompliance,
        ,
                code: crate::error::ErrorCode::PadesCompliance,}
    }
    
    /// Create a new Pkcs7Compliance error with context
    pub fn pkcs7_compliance<S: Into<String>>(message: S) -> Self {
        PdfSignError::Pkcs7Compliance {
            message: message.into(),
            code: ErrorCode::Pkcs7Compliance,
        ,
                code: crate::error::ErrorCode::Pkcs7Compliance,}
    }
    
    /// Create a new TimestampRequest error with context
    pub fn timestamp_request<S: Into<String>>(message: S) -> Self {
        PdfSignError::TimestampRequest {
            message: message.into(),
            code: ErrorCode::TimestampRequest,
        ,
                code: crate::error::ErrorCode::TimestampRequest,}
    }
    
    /// Create a new TimestampValidation error with context
    pub fn timestamp_validation<S: Into<String>>(message: S) -> Self {
        PdfSignError::TimestampValidation {
            message: message.into(),
            code: ErrorCode::TimestampValidation,
        ,
                code: crate::error::ErrorCode::TimestampValidation,}
    }
    
    /// Create a new TimestampServer error with context
    pub fn timestamp_server<S: Into<String>>(message: S) -> Self {
        PdfSignError::TimestampServer {
            message: message.into(),
            code: ErrorCode::TimestampServer,
        ,
                code: crate::error::ErrorCode::TimestampServer,}
    }
    
    /// Create a new Processing error with context
    pub fn processing<S: Into<String>>(message: S) -> Self {
        PdfSignError::Processing {
            message: message.into(),
            code: ErrorCode::Processing,
        ,
                code: crate::error::ErrorCode::Processing,}
    }
    
    /// Create a new ResourceLimit error with context
    pub fn resource_limit<S: Into<String>>(message: S) -> Self {
        PdfSignError::ResourceLimit {
            message: message.into(),
            code: ErrorCode::ResourceLimit,
        ,
                code: crate::error::ErrorCode::ResourceLimit,}
    }
}

/// Result type alias for the PDF signing library
pub type Result<T> = std::result::Result<T, PdfSignError>;

impl From<std::io::Error> for PdfSignError {
    fn from(err: std::io::Error) -> Self {
        PdfSignError::Io {
            message: format!("I/O operation failed: {,
                code: crate::error::ErrorCode::Io,}", err),
            code: ErrorCode::Io,
        }
    }
}

impl From<ring::error::Unspecified> for PdfSignError {
    fn from(_: ring::error::Unspecified) -> Self {
        PdfSignError::SignatureCreation {
            message: "Cryptographic operation failed with unspecified error".to_string(),
            code: ErrorCode::SignatureCreation,
        ,
                code: crate::error::ErrorCode::SignatureCreation,}
    }
}

impl From<serde_json::Error> for PdfSignError {
    fn from(err: serde_json::Error) -> Self {
        PdfSignError::Serialization {
            message: format!("JSON serialization failed: {,
                code: crate::error::ErrorCode::Serialization,}", err),
            code: ErrorCode::Serialization,
        }
    }
}

// NAPI integration for Node.js bindings
impl From<PdfSignError> for napi::Error {
    fn from(err: PdfSignError) -> Self {
        napi::Error::new(
            napi::Status::GenericFailure,
            format!("{} (Category: {}, Code: {})", err, err.category(), err.code())
        )
    }
}

/// Error context for providing additional debugging information
#[derive(Debug, Clone)]
pub struct ErrorContext {
    pub operation: String,
    pub file_name: Option<String>,
    pub line_number: Option<u32>,
    pub additional_info: std::collections::HashMap<String, String>,
}

impl ErrorContext {
    /// Create a new error context
    pub fn new<S: Into<String>>(operation: S) -> Self {
        Self {
            operation: operation.into(),
            file_name: None,
            line_number: None,
            additional_info: std::collections::HashMap::new(),
        }
    }
    
    /// Add file context
    pub fn with_file<S: Into<String>>(mut self, file_name: S) -> Self {
        self.file_name = Some(file_name.into());
        self
    }
    
    /// Add line number context
    pub fn with_line(mut self, line_number: u32) -> Self {
        self.line_number = Some(line_number);
        self
    }
    
    /// Add additional context information
    pub fn with_info<K: Into<String>, V: Into<String>>(mut self, key: K, value: V) -> Self {
        self.additional_info.insert(key.into(), value.into());
        self
    }
}

/// Enhanced result type with error context
pub type ContextResult<T> = std::result::Result<T, (PdfSignError, ErrorContext)>;

/// Trait for adding context to errors
pub trait ErrorContextExt<T> {
    fn with_context<F>(self, f: F) -> ContextResult<T>
    where
        F: FnOnce() -> ErrorContext;
}

impl<T> ErrorContextExt<T> for Result<T> {
    fn with_context<F>(self, f: F) -> ContextResult<T>
    where
        F: FnOnce() -> ErrorContext,
    {
        self.map_err(|err| (err, f()))
    }
}

/// Macro for creating error context with file and line information
#[macro_export]
macro_rules! error_context {
    ($operation:expr) => {
        $crate::error::ErrorContext::new($operation)
            .with_file(file!())
            .with_line(line!())
    };
    ($operation:expr, $($key:expr => $value:expr),*) => {
        {
            let mut ctx = $crate::error::ErrorContext::new($operation)
                .with_file(file!())
                .with_line(line!());
            $(
                ctx = ctx.with_info($key, $value);
            )*
            ctx
        }
    };
}