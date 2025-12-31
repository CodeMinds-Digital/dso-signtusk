/**
 * Property Test: Error Pattern Consistency
 * 
 * Feature: test-infrastructure-improvement, Property 8: Error Pattern Consistency
 * Validates: Requirements 3.1, 3.2, 3.4
 * 
 * Property: For any error produced by mock implementations, the error message should 
 * match expected patterns, contain sufficient diagnostic information, and maintain 
 * consistent structure across similar error types.
 */

import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { createPropertyTestTag, getPropertyTestConfig } from '../config/fast-check.config';
import {
    ErrorContext,
    ErrorPattern,
    ErrorPatternRegistry,
    ErrorType,
    ValidationRuleType
} from './index';

describe('Error Pattern Consistency Properties', () => {
  const propertyConfig = getPropertyTestConfig();

  test(createPropertyTestTag(8, 'Error Pattern Consistency'), () => {
    fc.assert(
      fc.property(
        // Generate simpler error patterns without complex validation rules
        fc.record({
          type: fc.constantFrom(...Object.values(ErrorType)),
          // Generate templates that match the required fields
          templateData: fc.record({
            field1: fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
            field2: fc.string({ minLength: 3, maxLength: 15 }).filter(s => /^[a-zA-Z][a-zA-Z0-9]*$/.test(s)),
            baseMessage: fc.string({ minLength: 10, maxLength: 50 })
          })
        }).map(data => ({
          type: data.type,
          messageTemplate: `${data.templateData.baseMessage}: {${data.templateData.field1}} in {${data.templateData.field2}}`,
          requiredFields: [data.templateData.field1, data.templateData.field2],
          validationRules: [] // Simplified - no validation rules to avoid complexity
        })),
        (pattern: ErrorPattern) => {
          const registry = new ErrorPatternRegistry();
          const patternKey = `test.pattern.${Math.random().toString(36).substr(2, 9)}`;
          
          // Generate context that matches the pattern's required fields
          const context: ErrorContext = {};
          
          // Ensure all required fields are present with valid values
          for (const field of pattern.requiredFields) {
            context[field] = fc.sample(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), 1)[0];
          }
          
          // Add some additional context fields
          context.timestamp = new Date().toISOString();
          context.component = fc.sample(fc.constantFrom('PDF', 'Field', 'Crypto', 'Mock'), 1)[0];

          // Register the pattern
          registry.registerPattern(patternKey, pattern);

          // Format error using the pattern
          const formattedError = registry.formatError(patternKey, context);

          // Property 1: Error type consistency
          expect(formattedError.type).toBe(pattern.type);

          // Property 2: Message template formatting consistency
          expect(formattedError.message).toBeDefined();
          expect(typeof formattedError.message).toBe('string');
          expect(formattedError.message.length).toBeGreaterThan(0);

          // Property 3: Required fields presence in formatted message
          for (const requiredField of pattern.requiredFields) {
            if (context[requiredField]) {
              expect(formattedError.message).toContain(String(context[requiredField]));
            }
          }

          // Property 4: Context preservation
          expect(formattedError.context).toEqual(context);

          // Property 5: Timestamp consistency
          expect(formattedError.timestamp).toBeInstanceOf(Date);
          expect(formattedError.timestamp.getTime()).toBeLessThanOrEqual(Date.now());

          // Property 6: Pattern retrieval consistency
          const retrievedPattern = registry.getPattern(patternKey);
          expect(retrievedPattern).toEqual(pattern);

          // Property 7: Error message structure consistency for same error type
          // If we format the same pattern with different contexts, the structure should be consistent
          const alternativeContext: ErrorContext = {};
          for (const field of pattern.requiredFields) {
            alternativeContext[field] = `alt_${context[field]}`;
          }
          
          const alternativeError = registry.formatError(patternKey, alternativeContext);
          expect(alternativeError.type).toBe(formattedError.type);
          expect(typeof alternativeError.message).toBe('string');
          
          // The message structure should be similar (same template, different values)
          const originalWords = formattedError.message.split(/\s+/);
          const alternativeWords = alternativeError.message.split(/\s+/);
          
          // Should have similar word count (within reasonable range)
          expect(Math.abs(originalWords.length - alternativeWords.length)).toBeLessThanOrEqual(5);
        }
      ),
      propertyConfig
    );
  });

  test('Error Pattern Registry State Consistency', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            key: fc.string({ minLength: 5, maxLength: 30 }),
            pattern: fc.record({
              type: fc.constantFrom(...Object.values(ErrorType)),
              messageTemplate: fc.string({ minLength: 10, maxLength: 100 }).map(s => 
                s.includes('{') ? s : `Error: {reason}`
              ),
              requiredFields: fc.array(fc.string({ minLength: 1, maxLength: 15 }), { minLength: 1, maxLength: 3 }),
              validationRules: fc.array(
                fc.record({
                  type: fc.constantFrom(...Object.values(ValidationRuleType)),
                  parameter: fc.oneof(fc.string(), fc.integer({ min: 1, max: 50 }))
                }),
                { maxLength: 2 }
              )
            })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (patternEntries) => {
          const registry = new ErrorPatternRegistry();
          
          // Register all patterns
          for (const entry of patternEntries) {
            registry.registerPattern(entry.key, entry.pattern);
          }

          // Property: All registered patterns should be retrievable
          for (const entry of patternEntries) {
            expect(registry.hasPattern(entry.key)).toBe(true);
            const retrieved = registry.getPattern(entry.key);
            expect(retrieved).toEqual(entry.pattern);
          }

          // Property: Pattern count consistency
          const allPatterns = registry.getAllPatterns();
          const registeredKeys = patternEntries.map(e => e.key);
          
          // Should contain at least our registered patterns (may have defaults too)
          for (const key of registeredKeys) {
            expect(allPatterns).toHaveProperty(key);
          }

          // Property: Pattern type filtering consistency
          const uniqueTypes = [...new Set(patternEntries.map(e => e.pattern.type))];
          for (const errorType of uniqueTypes) {
            const filteredPatterns = registry.getPatternsByType(errorType);
            const expectedCount = patternEntries.filter(e => e.pattern.type === errorType).length;
            
            // Should find at least the patterns we registered of this type
            expect(filteredPatterns.length).toBeGreaterThanOrEqual(expectedCount);
            
            // All returned patterns should be of the requested type
            for (const pattern of filteredPatterns) {
              expect(pattern.type).toBe(errorType);
            }
          }
        }
      ),
      propertyConfig
    );
  });

  test('Error Context Validation Consistency', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.constantFrom(...Object.values(ErrorType)),
          messageTemplate: fc.string().map(s => `Error in {component}: {reason}`),
          requiredFields: fc.constant(['component', 'reason']),
          validationRules: fc.constant([
            { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'component' },
            { type: ValidationRuleType.REQUIRED_FIELD, parameter: 'reason' }
          ])
        }),
        fc.record({
          component: fc.string({ minLength: 1, maxLength: 20 }),
          reason: fc.string({ minLength: 1, maxLength: 50 }),
          additionalField: fc.option(fc.string())
        }),
        (pattern: ErrorPattern, baseContext: any) => {
          const registry = new ErrorPatternRegistry();
          const patternKey = 'test.validation.pattern';
          
          registry.registerPattern(patternKey, pattern);

          // Property: Valid context should always produce valid error
          const validContext = { ...baseContext };
          delete validContext.additionalField; // Remove optional field
          
          const error = registry.formatError(patternKey, validContext);
          expect(error).toBeDefined();
          expect(error.type).toBe(pattern.type);
          expect(error.message).toContain(validContext.component);
          expect(error.message).toContain(validContext.reason);

          // Property: Missing required field should throw error
          const invalidContext = { ...validContext };
          delete invalidContext.reason; // Remove required field
          
          expect(() => {
            registry.formatError(patternKey, invalidContext);
          }).toThrow(/Required field.*missing/);

          // Property: Extra fields should not break formatting
          const extendedContext = {
            ...validContext,
            extraField: 'extra value',
            anotherField: 123
          };
          
          const extendedError = registry.formatError(patternKey, extendedContext);
          expect(extendedError).toBeDefined();
          expect(extendedError.context).toEqual(extendedContext);
        }
      ),
      propertyConfig
    );
  });
});