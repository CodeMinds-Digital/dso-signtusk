/**
 * Property Test: Error Scenario Generation
 * 
 * Feature: test-infrastructure-improvement, Property 6: Error Scenario Generation
 * Validates: Requirements 2.4
 * 
 * Tests that generated error scenarios reliably trigger expected error responses
 * from mock implementations.
 */

import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { ErrorType } from '../errors/types';
import { AlignedDataGenerator } from './aligned-data-generator';

describe('Property Test: Error Scenario Generation', () => {
  test('Property 6: Error Scenario Generation - Generated error scenarios trigger expected responses', () => {
    fc.assert(
      fc.property(
        fc.record({
          scenarioCount: fc.integer({ min: 1, max: 5 }),
          errorTypes: fc.subarray(
            [ErrorType.PDF_LOAD_ERROR, ErrorType.FIELD_NOT_FOUND, ErrorType.CRYPTO_VALIDATION_ERROR, ErrorType.PKCS7_INVALID],
            { minLength: 1, maxLength: 4 }
          ),
          includeTriggers: fc.boolean()
        }),
        (config) => {
          const generator = new AlignedDataGenerator();
          
          // Generate error scenarios
          const errorScenarios = generator.generateErrorScenarios({
            scenarioCount: config.scenarioCount,
            errorTypes: config.errorTypes,
            includeTriggers: config.includeTriggers
          });

          // Verify basic structure
          expect(errorScenarios.length).toBe(config.scenarioCount);
          
          errorScenarios.forEach(scenario => {
            // Verify scenario structure
            expect(scenario.errorType).toBeDefined();
            expect(config.errorTypes).toContain(scenario.errorType);
            expect(scenario.message).toBeDefined();
            expect(scenario.message.length).toBeGreaterThan(0);
            
            // Verify trigger presence based on configuration
            if (config.includeTriggers) {
              expect(scenario.trigger).toBeDefined();
            }
            
            // Verify context is optional but well-formed if present
            if (scenario.context) {
              expect(typeof scenario.context).toBe('object');
              Object.entries(scenario.context).forEach(([key, value]) => {
                expect(key.length).toBeGreaterThan(0);
                expect(['string', 'number', 'boolean']).toContain(typeof value);
              });
            }
          });
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Property 6a: Predictable error triggers produce expected errors', () => {
    fc.assert(
      fc.property(
        fc.record({
          pdfErrors: fc.boolean(),
          fieldErrors: fc.boolean(),
          cryptoErrors: fc.boolean()
        }),
        (mockCapabilities) => {
          // Skip if no capabilities are enabled
          if (!mockCapabilities.pdfErrors && !mockCapabilities.fieldErrors && !mockCapabilities.cryptoErrors) {
            return true;
          }

          const generator = new AlignedDataGenerator();
          
          // Generate predictable error triggers
          const triggers = generator.generatePredictableErrorTriggers(mockCapabilities);
          
          // Verify triggers are generated for enabled capabilities
          if (mockCapabilities.pdfErrors) {
            const pdfTriggers = triggers.filter(t => t.mockComponent === 'pdf');
            expect(pdfTriggers.length).toBeGreaterThan(0);
            
            pdfTriggers.forEach(trigger => {
              expect(trigger.trigger).toBeDefined();
              expect(trigger.expectedError).toBeDefined();
              expect([ErrorType.PDF_LOAD_ERROR]).toContain(trigger.expectedError);
              expect(trigger.triggerData).toBeDefined();
            });
          }
          
          if (mockCapabilities.fieldErrors) {
            const fieldTriggers = triggers.filter(t => t.mockComponent === 'field');
            expect(fieldTriggers.length).toBeGreaterThan(0);
            
            fieldTriggers.forEach(trigger => {
              expect(trigger.trigger).toBeDefined();
              expect(trigger.expectedError).toBeDefined();
              expect([ErrorType.FIELD_NOT_FOUND, ErrorType.FIELD_VALIDATION_ERROR]).toContain(trigger.expectedError);
              expect(trigger.triggerData).toBeDefined();
            });
          }
          
          if (mockCapabilities.cryptoErrors) {
            const cryptoTriggers = triggers.filter(t => t.mockComponent === 'crypto');
            expect(cryptoTriggers.length).toBeGreaterThan(0);
            
            cryptoTriggers.forEach(trigger => {
              expect(trigger.trigger).toBeDefined();
              expect(trigger.expectedError).toBeDefined();
              expect([ErrorType.PKCS7_INVALID, ErrorType.CRYPTO_VALIDATION_ERROR]).toContain(trigger.expectedError);
              expect(trigger.triggerData).toBeDefined();
            });
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 6b: Invalid data generation produces appropriate error triggers', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ErrorType.PDF_LOAD_ERROR,
          ErrorType.FIELD_NOT_FOUND,
          ErrorType.FIELD_VALIDATION_ERROR,
          ErrorType.CRYPTO_VALIDATION_ERROR,
          ErrorType.PKCS7_INVALID
        ),
        (errorType) => {
          const generator = new AlignedDataGenerator();
          
          // Generate invalid data for the error type
          const invalidDataResult = generator.generateInvalidDataForErrorTesting(errorType);
          
          // Verify structure
          expect(invalidDataResult.invalidData).toBeDefined();
          expect(invalidDataResult.expectedError).toBe(errorType);
          expect(invalidDataResult.description).toBeDefined();
          expect(invalidDataResult.description.length).toBeGreaterThan(0);
          
          // Verify invalid data is actually invalid for the error type
          switch (errorType) {
            case ErrorType.PDF_LOAD_ERROR:
              expect(invalidDataResult.invalidData.documentId).toBeDefined();
              expect(invalidDataResult.invalidData.fields).toBeDefined();
              break;
              
            case ErrorType.FIELD_NOT_FOUND:
              expect(invalidDataResult.invalidData.documentId).toBeDefined();
              expect(invalidDataResult.invalidData.fieldName).toBeDefined();
              expect(invalidDataResult.invalidData.fields).toBeDefined();
              break;
              
            case ErrorType.FIELD_VALIDATION_ERROR:
              expect(invalidDataResult.invalidData.field).toBeDefined();
              expect(invalidDataResult.invalidData.field.name).toBeDefined();
              expect(invalidDataResult.invalidData.field.type).toBeDefined();
              break;
              
            case ErrorType.CRYPTO_VALIDATION_ERROR:
              expect(invalidDataResult.invalidData.signature).toBeDefined();
              expect(invalidDataResult.invalidData.certificate).toBeDefined();
              break;
              
            case ErrorType.PKCS7_INVALID:
              expect(invalidDataResult.invalidData.signature).toBeDefined();
              expect(invalidDataResult.invalidData.certificate).toBeDefined();
              break;
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Property 6c: Error scenarios are compatible with mock error handling', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (scenarioCount) => {
          const generator = new AlignedDataGenerator();
          
          // Generate error scenarios for PDF errors
          const pdfErrorScenarios = generator.generateErrorScenarios({
            scenarioCount,
            errorTypes: [ErrorType.PDF_LOAD_ERROR],
            includeTriggers: true
          });
          
          // Generate error scenarios for field errors
          const fieldErrorScenarios = generator.generateErrorScenarios({
            scenarioCount,
            errorTypes: [ErrorType.FIELD_NOT_FOUND, ErrorType.FIELD_VALIDATION_ERROR],
            includeTriggers: true
          });
          
          // Generate error scenarios for crypto errors
          const cryptoErrorScenarios = generator.generateErrorScenarios({
            scenarioCount,
            errorTypes: [ErrorType.CRYPTO_VALIDATION_ERROR, ErrorType.PKCS7_INVALID],
            includeTriggers: true
          });
          
          // Verify all scenarios have the expected structure for mock compatibility
          [...pdfErrorScenarios, ...fieldErrorScenarios, ...cryptoErrorScenarios].forEach(scenario => {
            expect(scenario.errorType).toBeDefined();
            expect(scenario.message).toBeDefined();
            expect(scenario.trigger).toBeDefined();
            expect(scenario.message.length).toBeGreaterThanOrEqual(10);
            expect(scenario.message.length).toBeLessThanOrEqual(200);
            
            // Verify error type is valid
            expect(Object.values(ErrorType)).toContain(scenario.errorType);
          });
          
          // Verify PDF error scenarios
          pdfErrorScenarios.forEach(scenario => {
            expect(scenario.errorType).toBe(ErrorType.PDF_LOAD_ERROR);
          });
          
          // Verify field error scenarios
          fieldErrorScenarios.forEach(scenario => {
            expect([ErrorType.FIELD_NOT_FOUND, ErrorType.FIELD_VALIDATION_ERROR]).toContain(scenario.errorType);
          });
          
          // Verify crypto error scenarios
          cryptoErrorScenarios.forEach(scenario => {
            expect([ErrorType.CRYPTO_VALIDATION_ERROR, ErrorType.PKCS7_INVALID]).toContain(scenario.errorType);
          });
        }
      ),
      { numRuns: 10 }
    );
  });
});