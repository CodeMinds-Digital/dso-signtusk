// Main service
export { FileProcessingServiceImpl } from './file-processing-service';
import { FileProcessingServiceImpl } from './file-processing-service';

// Individual components
export { DocumentConverterImpl } from './document-converter';
export { OCREngineImpl } from './ocr-engine';
export { BatchProcessorImpl } from './batch-processor';

// Types and interfaces
export * from './types';

// Factory function for easy instantiation
export function createFileProcessingService() {
    return new FileProcessingServiceImpl();
}

// Utility functions
export function getSupportedFormats() {
    const service = new FileProcessingServiceImpl();
    return service.getProcessingCapabilities();
}

export function validateFileFormat(filePath: string, expectedFormat?: string) {
    const service = new FileProcessingServiceImpl();
    return service.validateFile(filePath, expectedFormat as any);
}