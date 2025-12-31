/**
 * Aligned Data Generator
 * 
 * Creates test data compatible with mock implementations for PDF signing components.
 * Ensures data consistency across PDF, field, and crypto operations.
 */

import * as fc from 'fast-check';
import { ErrorType, ValidationRule, ValidationRuleType } from '../errors/types';
import {
    DocumentState,
    ErrorScenario,
    FieldDefinition,
    FieldType,
    PdfDocument,
    Range,
    ValidationBehavior,
    ValidationResult
} from '../mocks/types';

export class AlignedDataGenerator {
  private readonly defaultFieldCount: Range = { min: 1, max: 10 };
  private readonly defaultDocumentSize: Range = { min: 1024, max: 1048576 }; // 1KB to 1MB

  /**
   * Generate PDF document data compatible with PDF mock
   */
  generatePdfDocument(config?: Partial<{
    fieldCount: Range;
    documentState: DocumentState;
    includeMetadata: boolean;
  }>): PdfDocument {
    const fieldCount = config?.fieldCount || this.defaultFieldCount;
    const state = config?.documentState || DocumentState.LOADED;
    const includeMetadata = config?.includeMetadata ?? true;

    const fieldCountValue = fc.sample(fc.integer({ min: fieldCount.min, max: fieldCount.max }), 1)[0];
    const fields = this.generateFieldDefinitions(fieldCountValue);

    return {
      id: this.generateDocumentId(),
      fields,
      state,
      metadata: includeMetadata ? this.generateDocumentMetadata() : {}
    };
  }

  /**
   * Generate field definitions compatible with field mock
   */
  generateFieldDefinitions(count: number): FieldDefinition[] {
    return fc.sample(
      fc.array(this.generateFieldDefinition(), { minLength: count, maxLength: count }),
      1
    )[0];
  }

  /**
   * Generate single field definition
   */
  generateFieldDefinition(): fc.Arbitrary<FieldDefinition> {
    return fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.trim() || 'field'),
      type: fc.constantFrom(...Object.values(FieldType)),
      required: fc.boolean(),
      validation: fc.array(this.generateValidationRule(), { maxLength: 3 }),
      value: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
      position: fc.option(
        fc.record({
          x: fc.integer({ min: 0, max: 1000 }),
          y: fc.integer({ min: 0, max: 1000 }),
          width: fc.integer({ min: 10, max: 200 }),
          height: fc.integer({ min: 10, max: 100 })
        }),
        { nil: undefined }
      )
    });
  }

  /**
   * Generate validation rules compatible with error handling
   */
  generateValidationRule(): fc.Arbitrary<ValidationRule> {
    return fc.record({
      type: fc.constantFrom(...Object.values(ValidationRuleType)),
      parameter: fc.option(
        fc.oneof(
          fc.string({ maxLength: 50 }),
          fc.integer({ min: 1, max: 1000 }).map(n => n)
        ),
        { nil: undefined }
      ),
      message: fc.option(fc.string({ maxLength: 100 }), { nil: undefined })
    });
  }

  /**
   * Generate crypto validation data compatible with crypto mock
   */
  generateCryptoValidationData(config?: Partial<{
    validationCount: number;
    includeSuccessScenarios: boolean;
    includeFailureScenarios: boolean;
  }>): {
    validationResults: ValidationResult[];
    pkcs7Data: string;
    certificateData: string;
  } {
    const validationCount = config?.validationCount || 3;
    const includeSuccess = config?.includeSuccessScenarios ?? true;
    const includeFailure = config?.includeFailureScenarios ?? true;

    const validationResults: ValidationResult[] = [];

    if (includeSuccess) {
      validationResults.push(...this.generateSuccessValidationResults(Math.ceil(validationCount / 2)));
    }

    if (includeFailure) {
      validationResults.push(...this.generateFailureValidationResults(Math.floor(validationCount / 2)));
    }

    return {
      validationResults,
      pkcs7Data: this.generatePkcs7Data(),
      certificateData: this.generateCertificateData()
    };
  }

  /**
   * Generate error scenarios compatible with mock error handling
   */
  generateErrorScenarios(config?: Partial<{
    scenarioCount: number;
    errorTypes: ErrorType[];
    includeTriggers: boolean;
  }>): ErrorScenario[] {
    const scenarioCount = config?.scenarioCount || 5;
    const errorTypes = config?.errorTypes || [
      ErrorType.PDF_LOAD_ERROR,
      ErrorType.FIELD_NOT_FOUND,
      ErrorType.CRYPTO_VALIDATION_ERROR,
      ErrorType.PKCS7_INVALID
    ];
    const includeTriggers = config?.includeTriggers ?? true;

    return fc.sample(
      fc.array(
        fc.record({
          trigger: includeTriggers ? fc.string({ minLength: 1, maxLength: 50 }) : fc.constant(''),
          errorType: fc.constantFrom(...errorTypes),
          message: fc.string({ minLength: 10, maxLength: 200 }),
          context: fc.option(
            fc.dictionary(
              fc.string({ minLength: 1, maxLength: 20 }),
              fc.oneof(fc.string(), fc.integer(), fc.boolean())
            ),
            { nil: undefined }
          )
        }),
        { minLength: scenarioCount, maxLength: scenarioCount }
      ),
      1
    )[0];
  }

  /**
   * Generate predictable error triggers aligned with mock capabilities
   */
  generatePredictableErrorTriggers(mockCapabilities: {
    pdfErrors: boolean;
    fieldErrors: boolean;
    cryptoErrors: boolean;
  }): Array<{
    trigger: string;
    expectedError: ErrorType;
    mockComponent: 'pdf' | 'field' | 'crypto';
    triggerData: Record<string, any>;
  }> {
    const triggers: Array<{
      trigger: string;
      expectedError: ErrorType;
      mockComponent: 'pdf' | 'field' | 'crypto';
      triggerData: Record<string, any>;
    }> = [];

    if (mockCapabilities.pdfErrors) {
      triggers.push(
        {
          trigger: 'invalid-document-id',
          expectedError: ErrorType.PDF_LOAD_ERROR,
          mockComponent: 'pdf',
          triggerData: { documentId: 'non-existent-doc' }
        },
        {
          trigger: 'corrupted-pdf-data',
          expectedError: ErrorType.PDF_LOAD_ERROR,
          mockComponent: 'pdf',
          triggerData: { corruptedData: true }
        }
      );
    }

    if (mockCapabilities.fieldErrors) {
      triggers.push(
        {
          trigger: 'missing-field-name',
          expectedError: ErrorType.FIELD_NOT_FOUND,
          mockComponent: 'field',
          triggerData: { fieldName: 'non-existent-field' }
        },
        {
          trigger: 'invalid-field-validation',
          expectedError: ErrorType.FIELD_VALIDATION_ERROR,
          mockComponent: 'field',
          triggerData: { invalidValidation: true }
        }
      );
    }

    if (mockCapabilities.cryptoErrors) {
      triggers.push(
        {
          trigger: 'invalid-pkcs7-signature',
          expectedError: ErrorType.PKCS7_INVALID,
          mockComponent: 'crypto',
          triggerData: { invalidSignature: true }
        },
        {
          trigger: 'crypto-validation-failure',
          expectedError: ErrorType.CRYPTO_VALIDATION_ERROR,
          mockComponent: 'crypto',
          triggerData: { validationFailure: true }
        }
      );
    }

    return triggers;
  }

  /**
   * Generate invalid data that should trigger specific errors
   */
  generateInvalidDataForErrorTesting(errorType: ErrorType): {
    invalidData: any;
    expectedError: ErrorType;
    description: string;
  } {
    switch (errorType) {
      case ErrorType.PDF_LOAD_ERROR:
        return {
          invalidData: {
            documentId: '',
            fields: null,
            state: 'INVALID_STATE'
          },
          expectedError: ErrorType.PDF_LOAD_ERROR,
          description: 'Empty document ID and null fields should trigger PDF load error'
        };

      case ErrorType.FIELD_NOT_FOUND:
        return {
          invalidData: {
            documentId: 'valid-doc',
            fieldName: '',
            fields: []
          },
          expectedError: ErrorType.FIELD_NOT_FOUND,
          description: 'Empty field name with empty field list should trigger field not found error'
        };

      case ErrorType.FIELD_VALIDATION_ERROR:
        return {
          invalidData: {
            field: {
              name: 'test-field',
              type: 'INVALID_TYPE',
              required: true,
              validation: [{ type: 'INVALID_RULE' }]
            }
          },
          expectedError: ErrorType.FIELD_VALIDATION_ERROR,
          description: 'Invalid field type and validation rule should trigger validation error'
        };

      case ErrorType.CRYPTO_VALIDATION_ERROR:
        return {
          invalidData: {
            signature: '',
            certificate: 'invalid-cert-data',
            algorithm: 'UNKNOWN_ALGORITHM'
          },
          expectedError: ErrorType.CRYPTO_VALIDATION_ERROR,
          description: 'Empty signature with invalid certificate should trigger crypto validation error'
        };

      case ErrorType.PKCS7_INVALID:
        return {
          invalidData: {
            signature: 'not-base64-data!@#$',
            certificate: 'also-not-base64!@#$'
          },
          expectedError: ErrorType.PKCS7_INVALID,
          description: 'Non-base64 signature and certificate data should trigger PKCS7 invalid error'
        };

      default:
        return {
          invalidData: null,
          expectedError: ErrorType.GENERATOR_ERROR,
          description: 'Unknown error type should trigger generator error'
        };
    }
  }

  /**
   * Generate validation behavior configuration
   */
  generateValidationBehavior(shouldSucceed?: boolean): ValidationBehavior {
    const success = shouldSucceed ?? fc.sample(fc.boolean(), 1)[0];
    
    if (success) {
      return { shouldSucceed: true };
    }

    const errorType = fc.sample(
      fc.constantFrom(
        ErrorType.PDF_LOAD_ERROR,
        ErrorType.FIELD_VALIDATION_ERROR,
        ErrorType.CRYPTO_VALIDATION_ERROR
      ),
      1
    )[0];

    return {
      shouldSucceed: false,
      errorType,
      customMessage: fc.sample(fc.string({ minLength: 10, maxLength: 100 }), 1)[0]
    };
  }

  // Private helper methods

  private generateDocumentId(): string {
    return fc.sample(
      fc.string({ minLength: 8, maxLength: 32 }).map(s => 
        s.replace(/[^a-zA-Z0-9_-]/g, 'a') || 'document-id'
      ),
      1
    )[0];
  }

  private generateDocumentMetadata(): Record<string, any> {
    return fc.sample(
      fc.dictionary(
        fc.constantFrom('title', 'author', 'subject', 'creator', 'producer', 'creationDate'),
        fc.oneof(
          fc.string({ maxLength: 100 }),
          fc.date({ min: new Date('2020-01-01'), max: new Date() }),
          fc.integer({ min: 1, max: 1000 })
        )
      ),
      1
    )[0];
  }

  private generateSuccessValidationResults(count: number): ValidationResult[] {
    return fc.sample(
      fc.array(
        fc.record({
          isValid: fc.constant(true),
          errorType: fc.constant(undefined),
          message: fc.option(fc.string({ maxLength: 50 }), { nil: undefined }),
          context: fc.option(
            fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer())),
            { nil: undefined }
          )
        }),
        { minLength: count, maxLength: count }
      ),
      1
    )[0];
  }

  private generateFailureValidationResults(count: number): ValidationResult[] {
    return fc.sample(
      fc.array(
        fc.record({
          isValid: fc.constant(false),
          errorType: fc.constantFrom(
            ErrorType.CRYPTO_VALIDATION_ERROR,
            ErrorType.PKCS7_INVALID,
            ErrorType.SIGNATURE_ERROR
          ),
          message: fc.string({ minLength: 10, maxLength: 100 }),
          context: fc.option(
            fc.dictionary(fc.string(), fc.oneof(fc.string(), fc.integer())),
            { nil: undefined }
          )
        }),
        { minLength: count, maxLength: count }
      ),
      1
    )[0];
  }

  private generatePkcs7Data(): string {
    // Generate base64-like string representing PKCS#7 data
    return fc.sample(
      fc.string({ minLength: 100, maxLength: 500 })
        .map(s => s.replace(/[^A-Za-z0-9+/]/g, 'A') + '=='),
      1
    )[0];
  }

  private generateCertificateData(): string {
    // Generate base64-like string representing certificate data
    return fc.sample(
      fc.string({ minLength: 200, maxLength: 1000 })
        .map(s => s.replace(/[^A-Za-z0-9+/]/g, 'A') + '=='),
      1
    )[0];
  }
}