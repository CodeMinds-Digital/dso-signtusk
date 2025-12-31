/**
 * Error handling types for test infrastructure
 */

export enum ErrorType {
  PDF_LOAD_ERROR = 'PDF_LOAD_ERROR',
  FIELD_NOT_FOUND = 'FIELD_NOT_FOUND',
  FIELD_VALIDATION_ERROR = 'FIELD_VALIDATION_ERROR',
  CRYPTO_VALIDATION_ERROR = 'CRYPTO_VALIDATION_ERROR',
  PKCS7_INVALID = 'PKCS7_INVALID',
  SIGNATURE_ERROR = 'SIGNATURE_ERROR',
  MOCK_CONFIGURATION_ERROR = 'MOCK_CONFIGURATION_ERROR',
  DATA_ALIGNMENT_ERROR = 'DATA_ALIGNMENT_ERROR',
  GENERATOR_ERROR = 'GENERATOR_ERROR',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
  MOCK_ERROR = 'MOCK_ERROR',
  TEST_EXECUTION_ERROR = 'TEST_EXECUTION_ERROR'
}

export enum ValidationRuleType {
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  FORMAT_VALIDATION = 'FORMAT_VALIDATION',
  LENGTH_VALIDATION = 'LENGTH_VALIDATION',
  PATTERN_MATCH = 'PATTERN_MATCH',
  CUSTOM_VALIDATION = 'CUSTOM_VALIDATION'
}

export interface ValidationRule {
  type: ValidationRuleType;
  parameter?: string | number;
  message?: string;
}

export interface ErrorPattern {
  type: ErrorType;
  messageTemplate: string;
  requiredFields: string[];
  validationRules: ValidationRule[];
}

export interface ErrorPatternMap {
  [key: string]: ErrorPattern;
}

export interface ErrorContext {
  [key: string]: any;
}

export interface FormattedError {
  type: ErrorType;
  message: string;
  context: ErrorContext;
  timestamp: Date;
}