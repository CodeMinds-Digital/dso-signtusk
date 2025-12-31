/**
 * Error Pattern Registry
 * 
 * Manages error patterns and provides consistent error message formatting
 * across all test infrastructure components.
 */

import {
    ErrorContext,
    ErrorPattern,
    ErrorPatternMap,
    ErrorType,
    FormattedError,
    ValidationRuleType
} from './types';

export class ErrorPatternRegistry {
  private patterns: ErrorPatternMap = {};

  constructor() {
    this.initializeDefaultPatterns();
  }

  /**
   * Register a new error pattern
   */
  registerPattern(key: string, pattern: ErrorPattern): void {
    this.validatePattern(pattern);
    this.patterns[key] = pattern;
  }

  /**
   * Get an error pattern by key
   */
  getPattern(key: string): ErrorPattern | undefined {
    return this.patterns[key];
  }

  /**
   * Get all registered patterns
   */
  getAllPatterns(): ErrorPatternMap {
    return { ...this.patterns };
  }

  /**
   * Format an error message using a pattern
   */
  formatError(patternKey: string, context: ErrorContext): FormattedError {
    const pattern = this.getPattern(patternKey);
    if (!pattern) {
      throw new Error(`Error pattern not found: ${patternKey}`);
    }

    // Validate required fields are present in context
    this.validateRequiredFields(pattern, context);

    // Apply validation rules
    this.applyValidationRules(pattern, context);

    // Format the message template
    const message = this.formatMessageTemplate(pattern.messageTemplate, context);

    return {
      type: pattern.type,
      message,
      context,
      timestamp: new Date()
    };
  }

  /**
   * Check if a pattern exists
   */
  hasPattern(key: string): boolean {
    return key in this.patterns;
  }

  /**
   * Remove a pattern
   */
  removePattern(key: string): boolean {
    if (this.hasPattern(key)) {
      delete this.patterns[key];
      return true;
    }
    return false;
  }

  /**
   * Clear all patterns
   */
  clearPatterns(): void {
    this.patterns = {};
  }

  /**
   * Get patterns by error type
   */
  getPatternsByType(errorType: ErrorType): ErrorPattern[] {
    return Object.values(this.patterns).filter(pattern => pattern.type === errorType);
  }

  private initializeDefaultPatterns(): void {
    // PDF-related error patterns
    this.registerPattern('pdf.load.failed', {
      type: ErrorType.PDF_LOAD_ERROR,
      messageTemplate: 'Failed to load PDF document: {reason}. File: {filename}',
      requiredFields: ['reason', 'filename'],
      validationRules: [
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'reason' },
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'filename' }
      ]
    });

    // Field-related error patterns
    this.registerPattern('field.not.found', {
      type: ErrorType.FIELD_NOT_FOUND,
      messageTemplate: 'Field "{fieldName}" not found in PDF document. Available fields: {availableFields}',
      requiredFields: ['fieldName'],
      validationRules: [
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'fieldName' }
      ]
    });

    this.registerPattern('field.validation.failed', {
      type: ErrorType.FIELD_VALIDATION_ERROR,
      messageTemplate: 'Field validation failed for "{fieldName}": {validationError}. Value: {value}',
      requiredFields: ['fieldName', 'validationError'],
      validationRules: [
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'fieldName' },
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'validationError' }
      ]
    });

    // Crypto-related error patterns
    this.registerPattern('crypto.validation.failed', {
      type: ErrorType.CRYPTO_VALIDATION_ERROR,
      messageTemplate: 'Cryptographic validation failed: {reason}. Algorithm: {algorithm}',
      requiredFields: ['reason'],
      validationRules: [
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'reason' }
      ]
    });

    this.registerPattern('pkcs7.invalid', {
      type: ErrorType.PKCS7_INVALID,
      messageTemplate: 'Invalid PKCS#7 signature: {details}. Certificate: {certificate}',
      requiredFields: ['details'],
      validationRules: [
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'details' }
      ]
    });

    // Mock-related error patterns
    this.registerPattern('mock.configuration.invalid', {
      type: ErrorType.MOCK_CONFIGURATION_ERROR,
      messageTemplate: 'Mock configuration error: {configError}. Component: {component}',
      requiredFields: ['configError', 'component'],
      validationRules: [
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'configError' },
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'component' }
      ]
    });

    // Generator-related error patterns
    this.registerPattern('generator.data.misaligned', {
      type: ErrorType.DATA_ALIGNMENT_ERROR,
      messageTemplate: 'Generated data misaligned with mock expectations: {alignmentIssue}. Generator: {generatorType}',
      requiredFields: ['alignmentIssue', 'generatorType'],
      validationRules: [
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'alignmentIssue' },
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'generatorType' }
      ]
    });

    // Integration error patterns
    this.registerPattern('integration.framework.incompatible', {
      type: ErrorType.INTEGRATION_ERROR,
      messageTemplate: 'Integration framework incompatibility: {incompatibilityReason}. Framework: {framework}',
      requiredFields: ['incompatibilityReason', 'framework'],
      validationRules: [
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'incompatibilityReason' },
        { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'framework' }
      ]
    });
  }

  private validatePattern(pattern: ErrorPattern): void {
    if (!pattern.type) {
      throw new Error('Error pattern must have a type');
    }
    if (!pattern.messageTemplate) {
      throw new Error('Error pattern must have a message template');
    }
    if (!Array.isArray(pattern.requiredFields)) {
      throw new Error('Error pattern must have requiredFields array');
    }
    if (!Array.isArray(pattern.validationRules)) {
      throw new Error('Error pattern must have validationRules array');
    }
  }

  private validateRequiredFields(pattern: ErrorPattern, context: ErrorContext): void {
    for (const field of pattern.requiredFields) {
      if (!(field in context)) {
        throw new Error(`Required field "${field}" missing from error context`);
      }
    }
  }

  private applyValidationRules(pattern: ErrorPattern, context: ErrorContext): void {
    for (const rule of pattern.validationRules) {
      switch (rule.type) {
        case ValidationRuleType.REQUIRED_FIELD:
          if (rule.parameter && typeof rule.parameter === 'string' && !(rule.parameter in context)) {
            throw new Error(`Required field "${rule.parameter}" missing from context`);
          }
          break;
        case ValidationRuleType.FORMAT_VALIDATION:
          if (rule.parameter && context[rule.parameter] && typeof rule.parameter === 'string') {
            // Basic format validation - can be extended
            if (typeof context[rule.parameter] !== 'string') {
              throw new Error(`Field "${rule.parameter}" must be a string`);
            }
          }
          break;
        case ValidationRuleType.LENGTH_VALIDATION:
          if (rule.parameter && typeof rule.parameter === 'number') {
            // Apply length validation to the entire message, not individual fields
            // This will be checked during message validation, not context validation
          }
          break;
        // Additional validation rules can be implemented as needed
      }
    }
  }

  private formatMessageTemplate(template: string, context: ErrorContext): string {
    let formatted = template;
    
    // Replace placeholders in the format {fieldName}
    for (const [key, value] of Object.entries(context)) {
      const placeholder = `{${key}}`;
      formatted = formatted.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return formatted;
  }
}

// Export singleton instance
export const errorPatternRegistry = new ErrorPatternRegistry();