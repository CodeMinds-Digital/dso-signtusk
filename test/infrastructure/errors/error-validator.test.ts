/**
 * Unit Tests: Error Validator Component
 * 
 * Tests specific error message validation scenarios and diagnostic information extraction.
 * Requirements: 3.2, 4.5
 */

import { beforeEach, describe, expect, test } from 'vitest';
import {
    ErrorContext,
    ErrorPattern,
    ErrorPatternRegistry,
    ErrorType,
    ErrorValidator,
    FormattedError,
    ValidationRuleType
} from './index';

describe('ErrorValidator', () => {
  let validator: ErrorValidator;
  let registry: ErrorPatternRegistry;

  beforeEach(() => {
    registry = new ErrorPatternRegistry();
    validator = new ErrorValidator(registry);
  });

  describe('validateAgainstPattern', () => {
    test('should validate message against existing pattern successfully', () => {
      const context: ErrorContext = {
        reason: 'File not found',
        filename: 'test.pdf'
      };

      const result = validator.validateAgainstPattern(
        'Failed to load PDF document: File not found. File: test.pdf',
        'pdf.load.failed',
        context
      );

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.diagnostics.patternMatches).toBe(true);
      expect(result.diagnostics.missingFields).toHaveLength(0);
    });

    test('should fail validation when pattern does not exist', () => {
      const result = validator.validateAgainstPattern(
        'Some error message',
        'nonexistent.pattern'
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pattern not found: nonexistent.pattern');
    });

    test('should detect missing required fields in message', () => {
      const context: ErrorContext = {
        reason: 'File not found',
        filename: 'test.pdf'
      };

      // Message missing the filename
      const result = validator.validateAgainstPattern(
        'Failed to load PDF document: File not found',
        'pdf.load.failed',
        context
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Required field "filename" not found in message');
      expect(result.diagnostics.missingFields).toContain('filename');
    });

    test('should handle empty or whitespace messages', () => {
      const context: ErrorContext = {
        reason: 'File not found',
        filename: 'test.pdf'
      };

      const result = validator.validateAgainstPattern(
        '   ',
        'pdf.load.failed',
        context
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Error message is empty');
    });
  });

  describe('validateFormattedError', () => {
    test('should validate formatted error successfully', () => {
      const formattedError: FormattedError = {
        type: ErrorType.PDF_LOAD_ERROR,
        message: 'Failed to load PDF document: Corrupted file. File: document.pdf',
        context: {
          reason: 'Corrupted file',
          filename: 'document.pdf'
        },
        timestamp: new Date()
      };

      const result = validator.validateFormattedError(formattedError, 'pdf.load.failed');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.diagnostics.errorType).toBe(ErrorType.PDF_LOAD_ERROR);
    });

    test('should detect error type mismatch', () => {
      const formattedError: FormattedError = {
        type: ErrorType.FIELD_NOT_FOUND, // Wrong type
        message: 'Failed to load PDF document: Corrupted file. File: document.pdf',
        context: {
          reason: 'Corrupted file',
          filename: 'document.pdf'
        },
        timestamp: new Date()
      };

      const result = validator.validateFormattedError(formattedError, 'pdf.load.failed');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Error type mismatch: expected PDF_LOAD_ERROR, got FIELD_NOT_FOUND'
      );
    });
  });

  describe('validateErrorStructure', () => {
    test('should validate basic error message structure', () => {
      const message = 'Failed to process document: Invalid format detected';
      const result = validator.validateErrorStructure(message);

      expect(result.isValid).toBe(true);
      expect(result.diagnostics.structureAnalysis.hasErrorCode).toBe(true);
      expect(result.diagnostics.structureAnalysis.wordCount).toBeGreaterThan(5);
    });

    test('should warn about very short messages', () => {
      const message = 'Error';
      const result = validator.validateErrorStructure(message);

      expect(result.warnings).toContain(
        'Error message is very short, may lack sufficient detail'
      );
    });

    test('should warn about very long messages', () => {
      const longMessage = 'Error '.repeat(100); // 600 characters
      const result = validator.validateErrorStructure(longMessage);

      expect(result.warnings).toContain(
        'Error message is very long, may be too verbose'
      );
    });

    test('should warn about messages without error indicators', () => {
      const message = 'Something happened with the document processing';
      const result = validator.validateErrorStructure(message);

      expect(result.warnings).toContain(
        'Message does not contain common error indicators'
      );
    });

    test('should validate type-specific error messages', () => {
      const message = 'PDF document could not be loaded';
      const result = validator.validateErrorStructure(message, ErrorType.PDF_LOAD_ERROR);

      expect(result.isValid).toBe(true);
      expect(result.diagnostics.errorType).toBe(ErrorType.PDF_LOAD_ERROR);
    });
  });

  describe('extractDiagnosticInfo', () => {
    test('should extract comprehensive diagnostic information', () => {
      const message = 'Failed to validate field "signature": Invalid format detected';
      const pattern: ErrorPattern = {
        type: ErrorType.FIELD_VALIDATION_ERROR,
        messageTemplate: 'Failed to validate field "{fieldName}": {validationError}',
        requiredFields: ['fieldName', 'validationError'],
        validationRules: []
      };
      const context: ErrorContext = {
        fieldName: 'signature',
        validationError: 'Invalid format detected'
      };

      const diagnostics = validator.extractDiagnosticInfo(message, pattern, context);

      expect(diagnostics.errorType).toBe(ErrorType.FIELD_VALIDATION_ERROR);
      expect(diagnostics.expectedPattern).toBe(pattern.messageTemplate);
      expect(diagnostics.actualMessage).toBe(message);
      expect(diagnostics.missingFields).toHaveLength(0);
      expect(diagnostics.patternMatches).toBe(true);
      expect(diagnostics.structureAnalysis.hasErrorCode).toBe(true);
      expect(diagnostics.suggestions).toBeDefined();
    });

    test('should identify missing fields in diagnostic info', () => {
      const message = 'Failed to validate field: Invalid format detected';
      const pattern: ErrorPattern = {
        type: ErrorType.FIELD_VALIDATION_ERROR,
        messageTemplate: 'Failed to validate field "{fieldName}": {validationError}',
        requiredFields: ['fieldName', 'validationError'],
        validationRules: []
      };
      const context: ErrorContext = {
        fieldName: 'signature',
        validationError: 'Invalid format detected'
      };

      const diagnostics = validator.extractDiagnosticInfo(message, pattern, context);

      expect(diagnostics.missingFields).toContain('fieldName');
      expect(diagnostics.patternMatches).toBe(false);
    });

    test('should identify extra fields in context', () => {
      const message = 'Failed to validate field "signature": Invalid format detected';
      const pattern: ErrorPattern = {
        type: ErrorType.FIELD_VALIDATION_ERROR,
        messageTemplate: 'Failed to validate field "{fieldName}": {validationError}',
        requiredFields: ['fieldName', 'validationError'],
        validationRules: []
      };
      const context: ErrorContext = {
        fieldName: 'signature',
        validationError: 'Invalid format detected',
        extraField: 'not used in template',
        anotherExtra: 'also not used'
      };

      const diagnostics = validator.extractDiagnosticInfo(message, pattern, context);

      expect(diagnostics.extraFields).toContain('extraField');
      expect(diagnostics.extraFields).toContain('anotherExtra');
    });
  });

  describe('compareErrorMessages', () => {
    test('should detect similar error messages', () => {
      const message1 = 'Failed to load PDF document: File not found';
      const message2 = 'Failed to load PDF document: File missing';

      const result = validator.compareErrorMessages(message1, message2, 0.7);

      expect(result.isValid).toBe(true);
      expect(result.diagnostics.patternMatches).toBe(true);
    });

    test('should detect dissimilar error messages', () => {
      const message1 = 'Failed to load PDF document: File not found';
      const message2 = 'Cryptographic validation error: Invalid signature';

      const result = validator.compareErrorMessages(message1, message2, 0.7);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('Error messages are not sufficiently similar');
    });

    test('should warn about significant word count differences', () => {
      const message1 = 'Error';
      const message2 = 'This is a very long error message with many words that describes the problem in great detail';

      const result = validator.compareErrorMessages(message1, message2, 0.1);

      expect(result.warnings).toContain('Significant word count difference:');
    });
  });

  describe('validation rules application', () => {
    test('should apply required field validation rules', () => {
      const pattern: ErrorPattern = {
        type: ErrorType.FIELD_VALIDATION_ERROR,
        messageTemplate: 'Field validation failed for "{fieldName}": {validationError}',
        requiredFields: ['fieldName', 'validationError'],
        validationRules: [
          { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'fieldName' },
          { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'validationError' }
        ]
      };

      registry.registerPattern('test.field.validation', pattern);

      const context: ErrorContext = {
        fieldName: 'email',
        // Missing validationError
      };

      const result = validator.validateAgainstPattern(
        'Field validation failed for "email": ',
        'test.field.validation',
        context
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Required field "validationError" missing from context');
    });

    test('should apply length validation rules', () => {
      const pattern: ErrorPattern = {
        type: ErrorType.GENERATOR_ERROR,
        messageTemplate: 'Generator error: {details}',
        requiredFields: ['details'],
        validationRules: [
          { type: ValidationRuleType.LENGTH_VALIDATION, parameter: 20 }
        ]
      };

      registry.registerPattern('test.length.validation', pattern);

      const context: ErrorContext = {
        details: 'X'
      };

      const result = validator.validateAgainstPattern(
        'Generator error: X',
        'test.length.validation',
        context
      );

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Message too short: 18 < 20');
    });

    test('should apply pattern match validation rules', () => {
      const pattern: ErrorPattern = {
        type: ErrorType.CRYPTO_VALIDATION_ERROR,
        messageTemplate: 'Crypto error: {details}',
        requiredFields: ['details'],
        validationRules: [
          { type: ValidationRuleType.PATTERN_MATCH, parameter: '\\d{4}' } // Requires 4 digits
        ]
      };

      registry.registerPattern('test.pattern.validation', pattern);

      const context: ErrorContext = {
        details: 'No digits here'
      };

      const result = validator.validateAgainstPattern(
        'Crypto error: No digits here',
        'test.pattern.validation',
        context
      );

      expect(result.isValid).toBe(true); // Pattern match is a warning, not error
      expect(result.warnings).toContain('Message does not match pattern: \\d{4}');
    });
  });

  describe('structure analysis', () => {
    test('should analyze message structure correctly', () => {
      const message = 'Error occurred at 2023-12-01 14:30:00 during PDF processing: Invalid signature found';
      const result = validator.validateErrorStructure(message);

      const analysis = result.diagnostics.structureAnalysis;
      expect(analysis.hasTimestamp).toBe(true);
      expect(analysis.hasErrorCode).toBe(true);
      expect(analysis.hasContext).toBe(true);
      expect(analysis.wordCount).toBeGreaterThan(10);
    });

    test('should detect placeholder patterns', () => {
      const message = 'Error in {component}: {reason} at {timestamp}';
      const result = validator.validateErrorStructure(message);

      const analysis = result.diagnostics.structureAnalysis;
      expect(analysis.placeholderCount).toBe(3);
    });
  });

  describe('suggestions generation', () => {
    test('should generate helpful suggestions for improvement', () => {
      const shortMessage = 'Err';
      const result = validator.validateErrorStructure(shortMessage);

      expect(result.diagnostics.suggestions).toContain(
        'Consider adding more descriptive information to the error message'
      );
      expect(result.diagnostics.suggestions).toContain(
        'Consider including error indicators like "failed", "error", or "invalid"'
      );
    });

    test('should suggest contextual improvements', () => {
      const message = 'Something went wrong';
      const result = validator.validateErrorStructure(message);

      expect(result.diagnostics.suggestions).toContain(
        'Consider adding contextual information about where the error occurred'
      );
    });
  });
});