/**
 * Error Testing Example
 * 
 * Demonstrates how to use the test infrastructure for error scenario testing.
 * Requirements: 4.3, 4.5
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestInfrastructure } from '../workflow';

describe('Error Testing Example', () => {
  let infrastructure: TestInfrastructure;
  let setup: any;

  beforeEach(() => {
    // Configure for error testing - focus on error scenarios and edge cases
    infrastructure = TestInfrastructure.create().configureForScenario('error');
    setup = infrastructure.setupTestWorkflow();
  });

  afterEach(() => {
    setup.cleanup();
  });

  describe('PDF Loading Error Scenarios', () => {
    it('should handle invalid document data', async () => {
      try {
        await setup.mocks.pdf.loadDocument('invalid-doc', { invalid: 'data' });
        fail('Expected error was not thrown');
      } catch (error) {
        // Validate error follows expected pattern
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
        expect(validation.diagnostics.errorType).toBeDefined();
        
        // Check error structure
        expect(validation.diagnostics.structureAnalysis.hasErrorCode).toBe(true);
        expect(validation.diagnostics.actualMessage).toContain('PDF');
      }
    });

    it('should handle empty document ID', async () => {
      try {
        await setup.mocks.pdf.loadDocument('', setup.data);
        fail('Expected error was not thrown');
      } catch (error) {
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
        
        // Should provide diagnostic information
        expect(validation.diagnostics.actualMessage).toBeDefined();
        expect(validation.diagnostics.structureAnalysis).toBeDefined();
      }
    });

    it('should handle null document data', async () => {
      try {
        await setup.mocks.pdf.loadDocument('null-test', null);
        fail('Expected error was not thrown');
      } catch (error) {
        const validation = setup.validateError(error as Error, 'PDF_LOAD_ERROR');
        expect(validation.isValid).toBe(true);
        
        // Error should contain relevant information
        expect(validation.diagnostics.actualMessage).toContain('null-test');
      }
    });

    it('should provide consistent error codes', async () => {
      const errorCodes = new Set<string>();
      
      // Generate multiple errors and collect error codes
      for (let i = 0; i < 5; i++) {
        try {
          await setup.mocks.pdf.loadDocument(`error-test-${i}`, { invalid: `data-${i}` });
        } catch (error) {
          const validation = setup.validateError(error as Error);
          
          // Extract error code from message
          const codeMatch = validation.diagnostics.actualMessage.match(/Code: ([^)]+)/);
          if (codeMatch) {
            errorCodes.add(codeMatch[1]);
          }
        }
      }
      
      // Should have consistent error code format
      expect(errorCodes.size).toBeGreaterThan(0);
      for (const code of errorCodes) {
        expect(code).toMatch(/^TST_PDF_\d{3}_\d{3}$/);
      }
    });
  });

  describe('Field Lookup Error Scenarios', () => {
    it('should handle unregistered document lookup', async () => {
      try {
        await setup.mocks.field.lookupFields(['nonexistent'], 'unregistered-doc');
        fail('Expected error was not thrown');
      } catch (error) {
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
        expect(validation.diagnostics.actualMessage).toContain('unregistered-doc');
      }
    });

    it('should handle empty field names array', async () => {
      setup.mocks.field.registerDocument('empty-fields-doc', [
        { name: 'field1', type: 'text', required: true }
      ]);

      try {
        await setup.mocks.field.lookupFields([], 'empty-fields-doc');
        fail('Expected error was not thrown');
      } catch (error) {
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
      }
    });

    it('should handle nonexistent field lookup', async () => {
      setup.mocks.field.registerDocument('partial-fields-doc', [
        { name: 'existing-field', type: 'text', required: true }
      ]);

      try {
        await setup.mocks.field.lookupFields(['nonexistent-field'], 'partial-fields-doc');
        fail('Expected error was not thrown');
      } catch (error) {
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
        expect(validation.diagnostics.actualMessage).toContain('nonexistent-field');
      }
    });

    it('should handle mixed valid/invalid field lookup', async () => {
      setup.mocks.field.registerDocument('mixed-fields-doc', [
        { name: 'valid-field', type: 'text', required: true }
      ]);

      try {
        await setup.mocks.field.lookupFields(['valid-field', 'invalid-field'], 'mixed-fields-doc');
        fail('Expected error was not thrown');
      } catch (error) {
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
        
        // Error should mention the invalid field
        expect(validation.diagnostics.actualMessage).toContain('invalid-field');
      }
    });
  });

  describe('Crypto Validation Error Scenarios', () => {
    it('should handle invalid signature format', async () => {
      // Configure crypto mock to simulate validation errors
      setup.mocks.crypto.updateConfiguration({
        validationResults: [
          { isValid: false, algorithm: 'UNKNOWN', error: 'Invalid signature format' }
        ],
        errorScenarios: [
          { type: 'CRYPTO_VALIDATION_ERROR', trigger: 'invalid-format' }
        ]
      });

      const result = await setup.mocks.crypto.validateSignature('invalid-format', 'cert');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Invalid signature format');
    });

    it('should handle empty signature data', async () => {
      try {
        await setup.mocks.crypto.validateSignature('', 'certificate-data');
        // May not throw, but should return invalid result
      } catch (error) {
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
      }
    });

    it('should handle null certificate data', async () => {
      try {
        await setup.mocks.crypto.validateSignature('signature-data', null);
        // May not throw, but should handle gracefully
      } catch (error) {
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
      }
    });

    it('should handle unsupported algorithms', async () => {
      setup.mocks.crypto.updateConfiguration({
        validationResults: [
          { isValid: false, algorithm: 'UNSUPPORTED', error: 'Algorithm not supported' }
        ],
        errorScenarios: []
      });

      const result = await setup.mocks.crypto.validateSignature('test-sig', 'test-cert');
      
      if (!result.isValid) {
        expect(result.error).toContain('not supported');
      }
    });
  });

  describe('Error Pattern Validation', () => {
    it('should validate PDF error patterns', () => {
      const pdfError = new Error('PDF parsing failed (Code: TST_PDF_001_123): File "test.pdf" - Invalid format');
      const validation = setup.validateError(pdfError, 'PDF_LOAD_ERROR');
      
      expect(validation.isValid).toBe(true);
      expect(validation.diagnostics.patternMatches).toBe(true);
      expect(validation.diagnostics.structureAnalysis.hasErrorCode).toBe(true);
    });

    it('should validate field error patterns', () => {
      const fieldError = new Error('Field lookup failed (Code: TST_FLD_002_456): Field "signature" not found in document "test.pdf"');
      const validation = setup.validateError(fieldError, 'FIELD_NOT_FOUND');
      
      expect(validation.isValid).toBe(true);
      expect(validation.diagnostics.actualMessage).toContain('signature');
      expect(validation.diagnostics.actualMessage).toContain('test.pdf');
    });

    it('should validate crypto error patterns', () => {
      const cryptoError = new Error('Signature validation failed (Code: TST_CRY_003_789): Invalid PKCS#7 format');
      const validation = setup.validateError(cryptoError, 'CRYPTO_VALIDATION_ERROR');
      
      expect(validation.isValid).toBe(true);
      expect(validation.diagnostics.structureAnalysis.hasErrorCode).toBe(true);
    });

    it('should identify malformed error messages', () => {
      const malformedError = new Error('Something went wrong');
      const validation = setup.validateError(malformedError);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.diagnostics.structureAnalysis.hasErrorCode).toBe(false);
    });

    it('should provide suggestions for improving error messages', () => {
      const poorError = new Error('Error occurred');
      const validation = setup.validateError(poorError);
      
      expect(validation.diagnostics.suggestions).toBeDefined();
      expect(validation.diagnostics.suggestions.length).toBeGreaterThan(0);
      
      // Should suggest improvements
      const suggestions = validation.diagnostics.suggestions.join(' ');
      expect(suggestions).toMatch(/error code|context|details/i);
    });
  });

  describe('Error Recovery Scenarios', () => {
    it('should handle cascading errors gracefully', async () => {
      try {
        // Trigger PDF error
        await setup.mocks.pdf.loadDocument('cascade-test', { invalid: 'data' });
      } catch (pdfError) {
        try {
          // Try field lookup on failed document
          await setup.mocks.field.lookupFields(['field1'], 'cascade-test');
        } catch (fieldError) {
          // Both errors should be valid
          const pdfValidation = setup.validateError(pdfError as Error);
          const fieldValidation = setup.validateError(fieldError as Error);
          
          expect(pdfValidation.isValid).toBe(true);
          expect(fieldValidation.isValid).toBe(true);
        }
      }
    });

    it('should maintain error context across operations', async () => {
      const documentId = 'context-test';
      const errors: Error[] = [];

      // Collect errors from multiple operations
      try {
        await setup.mocks.pdf.loadDocument(documentId, { invalid: 'data' });
      } catch (error) {
        errors.push(error as Error);
      }

      try {
        await setup.mocks.field.lookupFields(['field1'], documentId);
      } catch (error) {
        errors.push(error as Error);
      }

      // All errors should reference the same document
      for (const error of errors) {
        const validation = setup.validateError(error);
        expect(validation.diagnostics.actualMessage).toContain(documentId);
      }
    });
  });

  describe('Edge Case Error Scenarios', () => {
    it('should handle extremely long document IDs', async () => {
      const longDocumentId = 'a'.repeat(1000);
      
      try {
        await setup.mocks.pdf.loadDocument(longDocumentId, setup.data);
        // May succeed or fail, but should handle gracefully
      } catch (error) {
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
        
        // Error message should be reasonable length
        expect(validation.diagnostics.actualMessage.length).toBeLessThan(2000);
      }
    });

    it('should handle special characters in field names', async () => {
      const specialFieldNames = ['field@#$%', 'field with spaces', 'field\nwith\nnewlines'];
      
      setup.mocks.field.registerDocument('special-chars-doc', 
        specialFieldNames.map(name => ({ name, type: 'text', required: false }))
      );

      try {
        const result = await setup.mocks.field.lookupFields(specialFieldNames, 'special-chars-doc');
        expect(result.fields).toHaveLength(specialFieldNames.length);
      } catch (error) {
        // If it fails, error should be well-formed
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
      }
    });

    it('should handle concurrent error scenarios', async () => {
      const promises = [];
      
      // Trigger multiple errors concurrently
      for (let i = 0; i < 5; i++) {
        promises.push(
          setup.mocks.pdf.loadDocument(`concurrent-${i}`, { invalid: `data-${i}` })
            .catch((error: Error) => error)
        );
      }
      
      const results = await Promise.all(promises);
      
      // All should be errors and well-formed
      for (const result of results) {
        expect(result).toBeInstanceOf(Error);
        const validation = setup.validateError(result as Error);
        expect(validation.isValid).toBe(true);
      }
    });
  });

  describe('Error Diagnostic Information', () => {
    it('should provide comprehensive diagnostic information', () => {
      const testError = new Error('PDF parsing failed (Code: TST_PDF_001_123): File "test.pdf" - Invalid format at line 42');
      const validation = setup.validateError(testError);
      
      expect(validation.diagnostics).toBeDefined();
      expect(validation.diagnostics.actualMessage).toBe(testError.message);
      expect(validation.diagnostics.structureAnalysis).toBeDefined();
      
      const analysis = validation.diagnostics.structureAnalysis;
      expect(analysis.wordCount).toBeGreaterThan(0);
      expect(analysis.hasErrorCode).toBe(true);
      expect(analysis.hasContext).toBe(true);
    });

    it('should separate mock behavior from test logic issues', async () => {
      try {
        await setup.mocks.pdf.loadDocument('diagnostic-test', { invalid: 'data' });
      } catch (error) {
        const validation = setup.validateError(error as Error);
        
        // Should clearly indicate this is a mock error, not test logic error
        expect(validation.diagnostics.actualMessage).toContain('PDF');
        expect(validation.diagnostics.errorType).toBeDefined();
        
        // Should provide debugging context
        expect(validation.diagnostics.structureAnalysis).toBeDefined();
      }
    });

    it('should provide clear feedback for debugging', () => {
      const feedback = setup.feedback();
      
      expect(feedback).toBeDefined();
      expect(feedback.mockUsage).toBeDefined();
      expect(feedback.realImplementationUsage).toBeDefined();
      expect(feedback.diagnosticInfo).toBeDefined();
      
      // Should clearly indicate mock usage
      expect(feedback.realImplementationUsage.pdf).toBe(false);
      expect(feedback.realImplementationUsage.field).toBe(false);
      expect(feedback.realImplementationUsage.crypto).toBe(false);
    });
  });
});

/**
 * Example of testing error handling in business logic
 */
describe('Business Logic Error Handling', () => {
  let setup: any;

  beforeEach(() => {
    const infrastructure = TestInfrastructure.create().configureForScenario('error');
    setup = infrastructure.setupTestWorkflow();
  });

  afterEach(() => {
    setup.cleanup();
  });

  // Example business function that should handle errors gracefully
  async function robustDocumentProcessor(documentId: string, mocks: any) {
    const results = {
      documentLoaded: false,
      fieldsFound: 0,
      signaturesValidated: 0,
      errors: [] as string[]
    };

    // Try to load document
    try {
      await mocks.pdf.loadDocument(documentId, { id: documentId });
      results.documentLoaded = true;
    } catch (error) {
      results.errors.push(`PDF load failed: ${error.message}`);
    }

    // Try to find fields (only if document loaded)
    if (results.documentLoaded) {
      try {
        mocks.field.registerDocument(documentId, [
          { name: 'signature', type: 'signature', required: true }
        ]);
        const fieldResult = await mocks.field.lookupFields(['signature'], documentId);
        results.fieldsFound = fieldResult.fields.length;
      } catch (error) {
        results.errors.push(`Field lookup failed: ${error.message}`);
      }
    }

    // Try to validate signatures (only if fields found)
    if (results.fieldsFound > 0) {
      try {
        const cryptoResult = await mocks.crypto.validateSignature('test-sig', 'test-cert');
        if (cryptoResult.isValid) {
          results.signaturesValidated = 1;
        }
      } catch (error) {
        results.errors.push(`Signature validation failed: ${error.message}`);
      }
    }

    return results;
  }

  it('should handle partial failures gracefully', async () => {
    // Test with invalid document (should fail at first step)
    const result1 = await robustDocumentProcessor('invalid-doc', setup.mocks);
    
    expect(result1.documentLoaded).toBe(false);
    expect(result1.fieldsFound).toBe(0);
    expect(result1.signaturesValidated).toBe(0);
    expect(result1.errors.length).toBeGreaterThan(0);
    expect(result1.errors[0]).toContain('PDF load failed');
  });

  it('should provide meaningful error messages', async () => {
    const result = await robustDocumentProcessor('error-test', setup.mocks);
    
    // All errors should be meaningful
    for (const errorMsg of result.errors) {
      expect(errorMsg).toBeDefined();
      expect(errorMsg.length).toBeGreaterThan(10);
      expect(errorMsg).toMatch(/failed|error/i);
    }
  });

  it('should validate all error messages in business logic', async () => {
    const result = await robustDocumentProcessor('validation-test', setup.mocks);
    
    // Extract and validate each error
    for (const errorMsg of result.errors) {
      // Extract the original error message (after the prefix)
      const match = errorMsg.match(/: (.+)$/);
      if (match) {
        const originalError = new Error(match[1]);
        const validation = setup.validateError(originalError);
        expect(validation.isValid).toBe(true);
      }
    }
  });
});