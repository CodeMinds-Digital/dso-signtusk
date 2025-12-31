/**
 * Error Validator Component
 * 
 * Validates error messages against expected patterns and provides diagnostic
 * information for test failures and debugging.
 */

import { ErrorPatternRegistry } from './error-pattern-registry';
import {
    ErrorContext,
    ErrorPattern,
    ErrorType,
    FormattedError,
    ValidationRule,
    ValidationRuleType
} from './types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  diagnostics: DiagnosticInfo;
}

export interface DiagnosticInfo {
  errorType: ErrorType | null;
  expectedPattern: string | null;
  actualMessage: string;
  missingFields: string[];
  extraFields: string[];
  patternMatches: boolean;
  structureAnalysis: StructureAnalysis;
  suggestions: string[];
}

export interface StructureAnalysis {
  wordCount: number;
  hasTimestamp: boolean;
  hasErrorCode: boolean;
  hasContext: boolean;
  placeholderCount: number;
  resolvedPlaceholders: number;
}

export class ErrorValidator {
  private registry: ErrorPatternRegistry;

  constructor(registry?: ErrorPatternRegistry) {
    this.registry = registry || new ErrorPatternRegistry();
  }

  /**
   * Validate an error message against a specific pattern
   */
  validateAgainstPattern(
    message: string, 
    patternKey: string, 
    context?: ErrorContext
  ): ValidationResult {
    const pattern = this.registry.getPattern(patternKey);
    if (!pattern) {
      return this.createFailureResult(
        `Pattern not found: ${patternKey}`,
        message,
        null
      );
    }

    return this.performValidation(message, pattern, context);
  }

  /**
   * Validate a formatted error against its original pattern
   */
  validateFormattedError(
    formattedError: FormattedError,
    patternKey: string
  ): ValidationResult {
    const pattern = this.registry.getPattern(patternKey);
    if (!pattern) {
      return this.createFailureResult(
        `Pattern not found: ${patternKey}`,
        formattedError.message,
        formattedError.type
      );
    }

    // Validate type consistency
    if (formattedError.type !== pattern.type) {
      return this.createFailureResult(
        `Error type mismatch: expected ${pattern.type}, got ${formattedError.type}`,
        formattedError.message,
        formattedError.type
      );
    }

    return this.performValidation(
      formattedError.message, 
      pattern, 
      formattedError.context
    );
  }

  /**
   * Validate error message structure without a specific pattern
   */
  validateErrorStructure(message: string, errorType?: ErrorType): ValidationResult {
    const diagnostics = this.analyzeStructure(message);
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic structure validation
    if (!message || message.trim().length === 0) {
      errors.push('Error message is empty or whitespace only');
    }

    if (message.length < 10) {
      warnings.push('Error message is very short, may lack sufficient detail');
    }

    if (message.length > 500) {
      warnings.push('Error message is very long, may be too verbose');
    }

    // Check for common error message patterns
    if (!this.hasErrorIndicators(message)) {
      warnings.push('Message does not contain common error indicators');
    }

    // Type-specific validation
    if (errorType) {
      const typeValidation = this.validateForErrorType(message, errorType);
      errors.push(...typeValidation.errors);
      warnings.push(...typeValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      diagnostics: {
        errorType: errorType || null,
        expectedPattern: null,
        actualMessage: message,
        missingFields: [],
        extraFields: [],
        patternMatches: false,
        structureAnalysis: diagnostics,
        suggestions: this.generateSuggestions(message, diagnostics, errors, warnings)
      }
    };
  }

  /**
   * Extract diagnostic information from error messages
   */
  extractDiagnosticInfo(
    message: string, 
    expectedPattern?: ErrorPattern,
    context?: ErrorContext
  ): DiagnosticInfo {
    const structureAnalysis = this.analyzeStructure(message);
    const missingFields: string[] = [];
    const extraFields: string[] = [];
    let patternMatches = false;

    if (expectedPattern && context) {
      // Check for missing required fields
      for (const field of expectedPattern.requiredFields) {
        if (context[field] && !message.includes(String(context[field]))) {
          missingFields.push(field);
        }
      }

      // Check pattern matching
      patternMatches = this.checkPatternMatch(message, expectedPattern, context);

      // Identify extra context fields not in pattern
      for (const field of Object.keys(context)) {
        if (!expectedPattern.requiredFields.includes(field) && 
            !expectedPattern.messageTemplate.includes(`{${field}}`)) {
          extraFields.push(field);
        }
      }
    }

    return {
      errorType: expectedPattern?.type || null,
      expectedPattern: expectedPattern?.messageTemplate || null,
      actualMessage: message,
      missingFields,
      extraFields,
      patternMatches,
      structureAnalysis,
      suggestions: this.generateSuggestions(
        message, 
        structureAnalysis, 
        missingFields.map(f => `Missing field: ${f}`),
        extraFields.map(f => `Extra field: ${f}`)
      )
    };
  }

  /**
   * Compare two error messages for consistency
   */
  compareErrorMessages(
    message1: string, 
    message2: string, 
    expectedSimilarity: number = 0.7
  ): ValidationResult {
    const similarity = this.calculateSimilarity(message1, message2);
    const errors: string[] = [];
    const warnings: string[] = [];

    if (similarity < expectedSimilarity) {
      errors.push(
        `Error messages are not sufficiently similar (${similarity.toFixed(2)} < ${expectedSimilarity})`
      );
    }

    const struct1 = this.analyzeStructure(message1);
    const struct2 = this.analyzeStructure(message2);

    // Compare structures
    const wordCountDiff = Math.abs(struct1.wordCount - struct2.wordCount);
    if (wordCountDiff > 10) {
      warnings.push('Significant word count difference:');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      diagnostics: {
        errorType: null,
        expectedPattern: null,
        actualMessage: `Comparison: "${message1}" vs "${message2}"`,
        missingFields: [],
        extraFields: [],
        patternMatches: similarity >= expectedSimilarity,
        structureAnalysis: struct1,
        suggestions: [
          `Similarity score: ${similarity.toFixed(2)}`,
          `Expected similarity: ${expectedSimilarity}`,
          `Word count difference: ${wordCountDiff}`
        ]
      }
    };
  }

  private performValidation(
    message: string, 
    pattern: ErrorPattern, 
    context?: ErrorContext
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic message validation
    if (!message || message.trim().length === 0) {
      errors.push('Error message is empty');
    }

    // Pattern-specific validation
    if (context) {
      // Check required fields presence
      for (const field of pattern.requiredFields) {
        if (context[field] && !message.includes(String(context[field]))) {
          errors.push(`Required field "${field}" not found in message`);
        }
      }

      // Apply validation rules
      for (const rule of pattern.validationRules) {
        const ruleResult = this.applyValidationRule(rule, message, context);
        errors.push(...ruleResult.errors);
        warnings.push(...ruleResult.warnings);
      }
    }

    // Pattern template validation
    const patternMatches = this.checkPatternMatch(message, pattern, context);
    if (!patternMatches) {
      warnings.push('Message structure does not closely match expected pattern');
    }

    const diagnostics = this.extractDiagnosticInfo(message, pattern, context);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      diagnostics
    };
  }

  private checkPatternMatch(
    message: string, 
    pattern: ErrorPattern, 
    context?: ErrorContext
  ): boolean {
    if (!context) return false;

    // Create expected message by replacing placeholders
    let expectedMessage = pattern.messageTemplate;
    for (const [key, value] of Object.entries(context)) {
      expectedMessage = expectedMessage.replace(
        new RegExp(`\\{${key}\\}`, 'g'), 
        String(value)
      );
    }

    // Check if the structure is similar (allowing for some variation)
    const similarity = this.calculateSimilarity(message, expectedMessage);
    return similarity > 0.8; // 80% similarity threshold
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  private analyzeStructure(message: string): StructureAnalysis {
    const words = message.split(/\s+/);
    const placeholderMatches = message.match(/\{[^}]+\}/g) || [];
    
    return {
      wordCount: words.length,
      hasTimestamp: /\d{4}-\d{2}-\d{2}|\d{2}:\d{2}:\d{2}/.test(message),
      hasErrorCode: /error|fail|invalid|missing/i.test(message),
      hasContext: /\b(in|at|during|while)\b/.test(message),
      placeholderCount: placeholderMatches.length,
      resolvedPlaceholders: 0 // Would be calculated based on context
    };
  }

  private hasErrorIndicators(message: string): boolean {
    const indicators = [
      'error', 'failed', 'failure', 'invalid', 'missing', 'not found',
      'unable', 'cannot', 'could not', 'exception', 'problem'
    ];
    
    const lowerMessage = message.toLowerCase();
    return indicators.some(indicator => lowerMessage.includes(indicator));
  }

  private validateForErrorType(message: string, errorType: ErrorType): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (errorType) {
      case ErrorType.PDF_LOAD_ERROR:
        if (!message.toLowerCase().includes('pdf')) {
          warnings.push('PDF error message should mention PDF');
        }
        break;
      case ErrorType.FIELD_NOT_FOUND:
        if (!message.toLowerCase().includes('field')) {
          warnings.push('Field error message should mention field');
        }
        break;
      case ErrorType.CRYPTO_VALIDATION_ERROR:
        if (!message.toLowerCase().includes('crypto') && 
            !message.toLowerCase().includes('validation')) {
          warnings.push('Crypto error message should mention cryptographic validation');
        }
        break;
      // Add more type-specific validations as needed
    }

    return { isValid: errors.length === 0, errors, warnings, diagnostics: {} as DiagnosticInfo };
  }

  private applyValidationRule(
    rule: ValidationRule, 
    message: string, 
    context: ErrorContext
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    switch (rule.type) {
      case ValidationRuleType.REQUIRED_FIELD:
        if (rule.parameter && typeof rule.parameter === 'string') {
          if (!context[rule.parameter]) {
            errors.push(`Required field "${rule.parameter}" missing from context`);
          }
        }
        break;
      case ValidationRuleType.LENGTH_VALIDATION:
        if (typeof rule.parameter === 'number') {
          if (message.length < rule.parameter) {
            errors.push(`Message too short: ${message.length} < ${rule.parameter}`);
          }
        }
        break;
      case ValidationRuleType.PATTERN_MATCH:
        if (typeof rule.parameter === 'string') {
          try {
            const regex = new RegExp(rule.parameter);
            if (!regex.test(message)) {
              warnings.push(`Message does not match pattern: ${rule.parameter}`);
            }
          } catch (e) {
            warnings.push(`Invalid regex pattern: ${rule.parameter}`);
          }
        }
        break;
    }

    return { 
      isValid: errors.length === 0, 
      errors, 
      warnings, 
      diagnostics: {} as DiagnosticInfo 
    };
  }

  private generateSuggestions(
    message: string, 
    structure: StructureAnalysis, 
    errors: string[], 
    warnings: string[]
  ): string[] {
    const suggestions: string[] = [];

    if (structure.wordCount < 5) {
      suggestions.push('Consider adding more descriptive information to the error message');
    }

    if (!structure.hasErrorCode) {
      suggestions.push('Consider including error indicators like "failed", "error", or "invalid"');
    }

    if (!structure.hasContext) {
      suggestions.push('Consider adding contextual information about where the error occurred');
    }

    if (errors.length > 0) {
      suggestions.push('Fix the identified errors to improve message consistency');
    }

    if (warnings.length > 2) {
      suggestions.push('Review warnings to improve message quality');
    }

    return suggestions;
  }

  private createFailureResult(
    error: string, 
    message: string, 
    errorType: ErrorType | null
  ): ValidationResult {
    return {
      isValid: false,
      errors: [error],
      warnings: [],
      diagnostics: {
        errorType,
        expectedPattern: null,
        actualMessage: message,
        missingFields: [],
        extraFields: [],
        patternMatches: false,
        structureAnalysis: this.analyzeStructure(message),
        suggestions: ['Fix the identified error to proceed with validation']
      }
    };
  }
}