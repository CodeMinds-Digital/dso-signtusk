/**
 * Realistic Error Response Patterns
 * 
 * Provides production-like error responses for mock implementations
 * based on actual PDF signing library error patterns.
 */

import { ErrorType } from '../errors/types';
import { ErrorScenario } from './types';

export interface RealisticErrorConfig {
  includeErrorCodes: boolean;
  includeStackTraces: boolean;
  includeTimestamps: boolean;
  errorCodePrefix: string;
}

export interface ProductionErrorPattern {
  errorType: ErrorType;
  codePattern: string;
  messageTemplate: string;
  contextFields: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class RealisticErrorPatterns {
  private config: RealisticErrorConfig;
  private patterns: Map<ErrorType, ProductionErrorPattern[]> = new Map();

  constructor(config?: Partial<RealisticErrorConfig>) {
    this.config = {
      includeErrorCodes: true,
      includeStackTraces: false,
      includeTimestamps: true,
      errorCodePrefix: 'TST',
      ...config
    };
    
    this.initializeProductionPatterns();
  }

  /**
   * Generate realistic error response for given error type and context
   */
  generateRealisticError(errorType: ErrorType, context: Record<string, any>): ErrorScenario {
    const patterns = this.patterns.get(errorType) || [];
    if (patterns.length === 0) {
      return this.generateGenericError(errorType, context);
    }

    // Select pattern based on context or randomly for consistency
    const pattern = this.selectPattern(patterns, context);
    const errorCode = this.generateErrorCode(pattern.codePattern);
    const message = this.formatRealisticMessage(pattern, context, errorCode);

    return {
      trigger: this.generateTrigger(errorType, context),
      errorType,
      message,
      context: {
        ...context,
        errorCode,
        severity: pattern.severity,
        timestamp: this.config.includeTimestamps ? new Date().toISOString() : undefined,
        stackTrace: this.config.includeStackTraces ? this.generateMockStackTrace() : undefined
      }
    };
  }

  /**
   * Generate multiple realistic error scenarios for testing
   */
  generateErrorScenarios(errorType: ErrorType, count: number = 3): ErrorScenario[] {
    const scenarios: ErrorScenario[] = [];
    const patterns = this.patterns.get(errorType) || [];
    
    for (let i = 0; i < count; i++) {
      const pattern = patterns[i % patterns.length] || this.getGenericPattern(errorType);
      const context = this.generateContextForPattern(pattern, i);
      scenarios.push(this.generateRealisticError(errorType, context));
    }
    
    return scenarios;
  }

  /**
   * Get all supported error types
   */
  getSupportedErrorTypes(): ErrorType[] {
    return Array.from(this.patterns.keys());
  }

  /**
   * Update configuration
   */
  updateConfiguration(config: Partial<RealisticErrorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private initializeProductionPatterns(): void {
    // PDF Load Error patterns (based on production PdfParsing errors)
    this.patterns.set(ErrorType.PDF_LOAD_ERROR, [
      {
        errorType: ErrorType.PDF_LOAD_ERROR,
        codePattern: 'PDF_001',
        messageTemplate: 'PDF parsing failed (Code: {errorCode}): File "{filename}" - {details}',
        contextFields: ['filename', 'details'],
        severity: 'high'
      },
      {
        errorType: ErrorType.PDF_LOAD_ERROR,
        codePattern: 'PDF_002',
        messageTemplate: 'Invalid PDF document (Code: {errorCode}): File "{filename}" - {reason}',
        contextFields: ['filename', 'reason'],
        severity: 'high'
      },
      {
        errorType: ErrorType.PDF_LOAD_ERROR,
        codePattern: 'PDF_003',
        messageTemplate: 'Document serialization failed (Code: {errorCode}): File "{filename}" - {serializationError}',
        contextFields: ['filename', 'serializationError'],
        severity: 'critical'
      }
    ]);

    // Field Error patterns (based on production SignatureField errors)
    this.patterns.set(ErrorType.FIELD_NOT_FOUND, [
      {
        errorType: ErrorType.FIELD_NOT_FOUND,
        codePattern: 'FLD_001',
        messageTemplate: 'Signature field error (Code: {errorCode}): Field "{fieldName}" not found in document',
        contextFields: ['fieldName', 'documentId'],
        severity: 'medium'
      },
      {
        errorType: ErrorType.FIELD_NOT_FOUND,
        codePattern: 'FLD_002',
        messageTemplate: 'Document modification failed (Code: {errorCode}): Cannot locate field "{fieldName}"',
        contextFields: ['fieldName', 'documentId'],
        severity: 'high'
      }
    ]);

    this.patterns.set(ErrorType.FIELD_VALIDATION_ERROR, [
      {
        errorType: ErrorType.FIELD_VALIDATION_ERROR,
        codePattern: 'FLD_101',
        messageTemplate: 'Signature field error (Code: {errorCode}): Validation failed for field "{fieldName}" - {validationReason}',
        contextFields: ['fieldName', 'validationReason', 'value'],
        severity: 'medium'
      },
      {
        errorType: ErrorType.FIELD_VALIDATION_ERROR,
        codePattern: 'FLD_102',
        messageTemplate: 'Content preservation failed (Code: {errorCode}): Field "{fieldName}" contains invalid data',
        contextFields: ['fieldName', 'value'],
        severity: 'high'
      }
    ]);

    // Crypto Error patterns (based on production crypto errors)
    this.patterns.set(ErrorType.CRYPTO_VALIDATION_ERROR, [
      {
        errorType: ErrorType.CRYPTO_VALIDATION_ERROR,
        codePattern: 'CRY_001',
        messageTemplate: 'Signature validation failed (Code: {errorCode}): {cryptoReason}',
        contextFields: ['algorithm', 'cryptoReason'],
        severity: 'high'
      },
      {
        errorType: ErrorType.CRYPTO_VALIDATION_ERROR,
        codePattern: 'CRY_002',
        messageTemplate: 'Hash calculation failed (Code: {errorCode}): {hashError}',
        contextFields: ['algorithm', 'hashError'],
        severity: 'critical'
      }
    ]);

    this.patterns.set(ErrorType.PKCS7_INVALID, [
      {
        errorType: ErrorType.PKCS7_INVALID,
        codePattern: 'PKS_001',
        messageTemplate: 'PKCS#7 format violation (Code: {errorCode}): {pkcs7Error}',
        contextFields: ['pkcs7Error', 'certificate'],
        severity: 'high'
      },
      {
        errorType: ErrorType.PKCS7_INVALID,
        codePattern: 'PKS_002',
        messageTemplate: 'Certificate chain validation failed (Code: {errorCode}): {chainError}',
        contextFields: ['chainError', 'certificate'],
        severity: 'critical'
      }
    ]);

    this.patterns.set(ErrorType.SIGNATURE_ERROR, [
      {
        errorType: ErrorType.SIGNATURE_ERROR,
        codePattern: 'SIG_001',
        messageTemplate: 'Signature creation failed (Code: {errorCode}): {signatureReason}',
        contextFields: ['signatureReason', 'algorithm'],
        severity: 'critical'
      },
      {
        errorType: ErrorType.SIGNATURE_ERROR,
        codePattern: 'SIG_002',
        messageTemplate: 'Timestamp validation failed (Code: {errorCode}): {timestampError}',
        contextFields: ['timestampError', 'timestamp'],
        severity: 'high'
      }
    ]);

    // Mock-specific error patterns
    this.patterns.set(ErrorType.MOCK_CONFIGURATION_ERROR, [
      {
        errorType: ErrorType.MOCK_CONFIGURATION_ERROR,
        codePattern: 'MCK_001',
        messageTemplate: 'Configuration error (Code: {errorCode}): {configError}',
        contextFields: ['configError', 'component'],
        severity: 'medium'
      }
    ]);

    this.patterns.set(ErrorType.DATA_ALIGNMENT_ERROR, [
      {
        errorType: ErrorType.DATA_ALIGNMENT_ERROR,
        codePattern: 'DAT_001',
        messageTemplate: 'Resource allocation failed: Generated data incompatible with mock expectations - {alignmentIssue}',
        contextFields: ['alignmentIssue', 'generatorType'],
        severity: 'medium'
      }
    ]);

    this.patterns.set(ErrorType.INTEGRATION_ERROR, [
      {
        errorType: ErrorType.INTEGRATION_ERROR,
        codePattern: 'INT_001',
        messageTemplate: 'Platform-specific operation failed (Code: {errorCode}): {platformError}',
        contextFields: ['platformError', 'framework'],
        severity: 'high'
      }
    ]);
  }

  private selectPattern(patterns: ProductionErrorPattern[], context: Record<string, any>): ProductionErrorPattern {
    // Use context to select appropriate pattern, or use hash for consistency
    if (context.severity) {
      const matchingPattern = patterns.find(p => p.severity === context.severity);
      if (matchingPattern) return matchingPattern;
    }

    // Use hash of context for consistent selection
    const contextHash = this.hashContext(context);
    return patterns[contextHash % patterns.length];
  }

  private generateErrorCode(codePattern: string): string {
    if (!this.config.includeErrorCodes) {
      return '';
    }
    
    // Generate timestamp-based suffix for uniqueness while maintaining consistency
    const timestamp = Math.floor(Date.now() / 1000);
    const suffix = (timestamp % 1000).toString().padStart(3, '0');
    return `${this.config.errorCodePrefix}_${codePattern}_${suffix}`;
  }

  private formatRealisticMessage(
    pattern: ProductionErrorPattern, 
    context: Record<string, any>, 
    errorCode: string
  ): string {
    let message = pattern.messageTemplate;
    
    // Replace error code placeholder
    message = message.replace('{errorCode}', errorCode);
    
    // Replace context placeholders - handle nested objects
    const flattenedContext = this.flattenContext(context);
    
    // First pass: replace all available context values
    for (const [key, value] of Object.entries(flattenedContext)) {
      const placeholder = `{${key}}`;
      if (message.includes(placeholder) && value !== undefined && value !== null) {
        // Use split/join instead of regex replace to avoid issues with special characters
        message = message.split(placeholder).join(String(value));
      }
    }
    
    // Second pass: handle missing context fields with realistic defaults ONLY if not provided
    for (const field of pattern.contextFields) {
      const placeholder = `{${field}}`;
      if (message.includes(placeholder)) {
        // Only use default if the field wasn't already replaced
        const defaultValue = this.getDefaultValueForField(field);
        message = message.split(placeholder).join(defaultValue);
      }
    }
    
    return message;
  }

  private flattenContext(context: Record<string, any>, prefix: string = ''): Record<string, any> {
    const flattened: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        // Recursively flatten nested objects
        Object.assign(flattened, this.flattenContext(value, newKey));
        // Also add the nested properties directly (e.g., errorContext.reason -> reason)
        Object.assign(flattened, this.flattenContext(value, ''));
      } else {
        flattened[newKey] = value;
        // Also add without prefix for direct access
        if (prefix) {
          flattened[key] = value;
        }
      }
    }
    
    return flattened;
  }

  private generateTrigger(errorType: ErrorType, context: Record<string, any>): string {
    // Generate consistent trigger based on error type and context
    const baseKey = errorType.toLowerCase().replace(/_/g, '-');
    const contextKey = Object.keys(context).sort().join('-');
    return `${baseKey}-${contextKey}`;
  }

  private generateGenericError(errorType: ErrorType, context: Record<string, any>): ErrorScenario {
    const errorCode = this.generateErrorCode('GEN_001');
    return {
      trigger: this.generateTrigger(errorType, context),
      errorType,
      message: `${errorType} (Code: ${errorCode}): ${JSON.stringify(context)}`,
      context: {
        ...context,
        errorCode,
        severity: 'medium',
        timestamp: this.config.includeTimestamps ? new Date().toISOString() : undefined
      }
    };
  }

  private getGenericPattern(errorType: ErrorType): ProductionErrorPattern {
    return {
      errorType,
      codePattern: 'GEN_001',
      messageTemplate: '{errorType} (Code: {errorCode}): {details}',
      contextFields: ['details'],
      severity: 'medium'
    };
  }

  private generateContextForPattern(pattern: ProductionErrorPattern, index: number): Record<string, any> {
    const context: Record<string, any> = {};
    
    for (const field of pattern.contextFields) {
      context[field] = this.getDefaultValueForField(field, index);
    }
    
    return context;
  }

  private getDefaultValueForField(field: string, index: number = 0): string {
    const defaults: Record<string, (index: number) => string> = {
      filename: (i) => `test-document-${i}.pdf`,
      documentId: (i) => `doc_${i}_${Date.now()}`,
      fieldName: (i) => `signature_field_${i}`,
      details: (i) => `Operation failed at step ${i + 1}`,
      reason: (i) => `Invalid format detected in section ${i + 1}`,
      validationReason: (i) => `Required field validation failed (rule ${i + 1})`,
      value: (i) => `invalid_value_${i}`,
      algorithm: (i) => ['SHA256withRSA', 'SHA1withRSA', 'SHA512withRSA'][i % 3],
      cryptoReason: (i) => `Certificate validation failed at depth ${i}`,
      hashError: (i) => `Hash mismatch in block ${i + 1}`,
      pkcs7Error: (i) => `Invalid ASN.1 structure at offset ${i * 100}`,
      certificate: (i) => `CN=Test Certificate ${i}`,
      chainError: (i) => `Certificate chain broken at level ${i}`,
      signatureReason: (i) => `Private key operation failed (attempt ${i + 1})`,
      timestampError: (i) => `Timestamp server unreachable (retry ${i + 1})`,
      timestamp: (i) => new Date(Date.now() - i * 3600000).toISOString(),
      configError: (i) => `Invalid configuration parameter at index ${i}`,
      component: (i) => ['PdfMock', 'FieldMock', 'CryptoMock'][i % 3],
      alignmentIssue: (i) => `Data type mismatch in field ${i + 1}`,
      generatorType: (i) => ['AlignedDataGenerator', 'ConfigurationGenerator'][i % 2],
      platformError: (i) => `System call failed with code ${1000 + i}`,
      framework: (i) => ['Jest', 'Vitest', 'Mocha'][i % 3],
      serializationError: (i) => `Buffer overflow at position ${i * 1024}`,
      errorType: () => 'UNKNOWN_ERROR'
    };
    
    const generator = defaults[field];
    return generator ? generator(index) : `default_${field}_${index}`;
  }

  private generateMockStackTrace(): string {
    return [
      '    at PdfMock.validatePKCS7 (test/infrastructure/mocks/crypto-mock.ts:45:12)',
      '    at TestCoordinator.executeTest (test/infrastructure/integration/test-coordinator.ts:123:8)',
      '    at PropertyTest.run (test/infrastructure/properties/base.test.ts:67:15)',
      '    at Object.<anonymous> (test/infrastructure/mocks/error-response-realism.property.test.ts:89:23)'
    ].join('\n');
  }

  private hashContext(context: Record<string, any>): number {
    const str = JSON.stringify(context, Object.keys(context).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Export singleton instance with default configuration
export const realisticErrorPatterns = new RealisticErrorPatterns();