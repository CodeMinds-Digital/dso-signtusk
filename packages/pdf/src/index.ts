// Main exports for the PDF processing package
export { PDFEngine } from './pdf-engine';
export { DigitalSignatureEngineImpl } from './digital-signature-engine';
export { CertificateManagerImpl } from './certificate-manager';
export type { CertificateManager, CertificateMetadata, CertificateStoreConfig, OCSPConfig } from './certificate-manager';

// Signature Appearance System exports
export { SignatureAppearanceEngine } from './signature-appearance-engine';
export type {
    SignatureAppearanceConfig,
    SignatureAppearanceMetadata,
    SignatureAppearanceResult
} from './types';

// HSM Integration exports
export { HSMIntegrationManagerImpl } from './hsm-integration-manager';
export * from './hsm-providers';

// Timestamp Server Integration exports
export { TimestampServerManagerImpl, createTimestampServerManager } from './timestamp-server-manager';
export type {
    TimestampServerManager,
    TSAConfig,
    TSAFailoverConfig,
    TimestampRequest,
    TimestampResponse,
    TimestampVerificationResult,
    TimestampRequestOptions,
    TimestampOperation,
    TimestampAuditEntry
} from './types';

// PDF Validation Engine exports
export { PDFValidationEngine } from './pdf-validation-engine';
export type {
    PDFValidationResult,
    PDFStructureValidationResult,
    PDFSignatureValidationResult,
    PDFSignatureValidation,
    PDFCertificateValidationResult,
    PDFCertificateValidation,
    PDFTimestampValidationResult,
    PDFTimestampValidation
} from './pdf-validation-engine';

// PDF Optimization Engine exports
export { PDFOptimizationEngine } from './pdf-optimization-engine';
export type {
    OptimizationResult,
    CompressionStats,
    ImageOptimizationResult,
    FontOptimizationResult,
    FontSubsetInfo,
    IncrementalUpdateOptions,
    PDFOptimizationError,
    ImageOptimizationError,
    FontOptimizationError
} from './types';

// PDF Accessibility Engine exports
export { PDFAccessibilityEngine } from './pdf-accessibility-engine';
export type {
    AccessibilityLevel,
    StructureElementType,
    AccessibilityMetadata,
    StructureElement,
    AccessibilityValidationResult,
    AccessibilityIssue,
    AccessibilityWarning,
    AccessibilityIssueType,
    StructureAnalysis,
    HeadingStructure,
    ReadingOrderElement,
    TaggedPDFOptions,
    ScreenReaderOptions
} from './pdf-accessibility-engine';

// PDF Security Engine exports
export { PDFSecurityEngine, createPDFSecurityEngine, PDFSecurityError } from './pdf-security-engine';
export type {
    PDFEncryptionConfig,
    WatermarkConfig,
    StampConfig,
    DRMConfig,
    SecurityPolicy,
    SecurityOperationResult,
    EncryptionResult,
    WatermarkResult,
    StampResult,
    DRMResult,
    SecurityValidationResult,
    SecurityAuditEntry
} from './pdf-security-engine';

// PDF Conversion Engine exports
export { PDFConversionEngineImpl, createPDFConversionEngine } from './pdf-conversion-engine';
export type {
    PDFConversionEngine,
    ConversionResult,
    DOCXConversionOptions,
    HTMLConversionOptions,
    ImageConversionOptions,
    PDFAConversionOptions,
    BatchConversionOptions,
    BatchConversionResult,
    ConversionInputFormat,
    ConversionOutputFormat,
    PDFConversionError,
    DOCXConversionError,
    HTMLConversionError,
    ImageConversionError,
    PDFAConversionError
} from './types';

// Signature Capture Engine exports
export { SignatureCaptureEngine, createSignatureCaptureEngine } from './signature-capture-engine';
export type {
    SignatureCaptureMethod,
    SignatureQualityLevel,
    SignatureStroke,
    DrawnSignatureData,
    TypedSignatureData,
    UploadedSignatureData,
    SignatureCaptureData,
    SignatureCaptureOptions,
    SignatureQualityMetrics,
    SignatureCaptureResult
} from './types';

export type {
    SignatureCaptureError,
    SignatureValidationError,
    SignatureProcessingError,
    SignatureQualityError
} from './signature-capture-engine';

// PDF Viewer Engine exports
export { PDFViewerEngine, createPDFViewerEngine, PDFViewerError } from './pdf-viewer-engine';
export type {
    ZoomLevel,
    ViewerMode,
    FieldHighlightStyle,
    ViewerConfig,
    PageRenderOptions,
    RenderedPage,
    FieldPosition,
    ViewportState,
    TouchGesture,
    NavigationEvent,
    FieldInteractionEvent
} from './pdf-viewer-engine';

// Signature Compliance Engine exports
export { SignatureComplianceEngine, createSignatureComplianceEngine } from './signature-compliance-engine';
export type {
    SignatureComplianceMetadata,
    SignatureAuditEvent,
    SignatureComplianceValidationResult,
    ComplianceViolation,
    ComplianceReportOptions,
    SignatureComplianceReport,
    SignatureComplianceMetadataSchema
} from './signature-compliance-engine';

// Batch Signing Engine exports
export { BatchSigningEngine, createBatchSigningEngine, BatchSigningError } from './batch-signing-engine';
export type {
    BatchSigningRequest,
    BatchSigningOptions,
    BatchSigningResult,
    BatchSigningProgress,
    BatchOperationStatus,
    BatchDocumentStatus,
    BatchDocumentPreparation,
    BatchSignatureApplication,
    BatchProgressReport,
    BatchErrorRecovery,
    BatchSigningMetrics,
    BatchSigningAuditEntry,
    BatchPreparationError,
    BatchProcessingError,
    BatchTimeoutError
} from './types';

// Signature Analytics Engine exports - temporarily disabled due to missing database models
// export { SignatureAnalyticsEngine } from './signature-analytics-engine';
// export type {
//     SignatureEvent,
//     SignatureWorkflowEvent,
//     SignatureCompletionMetrics,
//     SignaturePerformanceMetrics,
//     SignatureOptimizationRecommendation,
//     SignatureAnalyticsDashboard,
//     SignatureEventSchema,
//     SignatureWorkflowEventSchema
// } from './signature-analytics-engine';

export * from './types';
export * from './utils';

// Re-export commonly used pdf-lib types for convenience
export type { PDFDocument, PDFPage, PDFField, PDFForm } from 'pdf-lib';

// Import classes for factory functions
import { PDFEngine } from './pdf-engine';
import { DigitalSignatureEngineImpl } from './digital-signature-engine';
import { CertificateManagerImpl } from './certificate-manager';
import { createFullHSMIntegrationManager } from './hsm-providers';
import { createTimestampServerManager as createTSManager } from './timestamp-server-manager';
import { SignatureAppearanceEngine } from './signature-appearance-engine';
import { PDFValidationEngine } from './pdf-validation-engine';
import { PDFOptimizationEngine } from './pdf-optimization-engine';
import { createPDFAccessibilityEngine } from './pdf-accessibility-engine';
import { createPDFSecurityEngine } from './pdf-security-engine';
import { createPDFConversionEngine } from './pdf-conversion-engine';
import { createSignatureCaptureEngine } from './signature-capture-engine';
import { createPDFViewerEngine } from './pdf-viewer-engine';
import { createSignatureComplianceEngine } from './signature-compliance-engine';
import { createBatchSigningEngine } from './batch-signing-engine';
// import { SignatureAnalyticsEngine } from './signature-analytics-engine';

// Create factory functions
export const createPDFEngine = (options?: any) => new PDFEngine(options);
export const createDigitalSignatureEngine = (options?: any) => new DigitalSignatureEngineImpl(options);
export const createCertificateManager = (options?: any) => new CertificateManagerImpl(options);
export const createHSMIntegrationManager = createFullHSMIntegrationManager;
export const createTimestampManager = createTSManager;
export const createSignatureAppearanceEngine = () => new SignatureAppearanceEngine();
export const createPDFValidationEngine = () => new PDFValidationEngine();
export const createPDFOptimizationEngine = (options?: any) => new PDFOptimizationEngine(options);
export { createPDFAccessibilityEngine };
// export const createSignatureAnalyticsEngine = (db: any) => new SignatureAnalyticsEngine(db);

// Version information
export const VERSION = '0.1.0';