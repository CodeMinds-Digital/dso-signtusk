/**
 * Unit Testing Example
 * 
 * Demonstrates how to use the test infrastructure for unit testing scenarios.
 * Requirements: 4.3, 4.5
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestInfrastructure } from '../workflow';

describe('Unit Testing Example', () => {
  let infrastructure: TestInfrastructure;
  let setup: any;

  beforeEach(() => {
    // Configure for unit testing - minimal complexity, fast execution
    infrastructure = TestInfrastructure.create().configureForScenario('unit');
    setup = infrastructure.setupTestWorkflow();
  });

  afterEach(() => {
    // Always cleanup after each test
    setup.cleanup();
  });

  describe('PDF Mock Unit Tests', () => {
    it('should load a simple PDF document', async () => {
      // Use generated test data that's compatible with mocks
      const result = await setup.mocks.pdf.loadDocument('unit-test-doc', setup.data);
      
      expect(result).toBeDefined();
      expect(result.documentId).toBe('unit-test-doc');
      
      // Verify mock usage
      const feedback = setup.feedback();
      expect(feedback.mockUsage.pdf).toBe(true);
      expect(feedback.realImplementationUsage.pdf).toBe(false);
    });

    it('should track loaded documents', async () => {
      await setup.mocks.pdf.loadDocument('doc1', setup.data);
      await setup.mocks.pdf.loadDocument('doc2', setup.data);
      
      const loadedDocs = setup.mocks.pdf.getLoadedDocuments();
      expect(loadedDocs).toHaveLength(2);
      expect(loadedDocs).toContain('doc1');
      expect(loadedDocs).toContain('doc2');
    });

    it('should maintain operation history', async () => {
      await setup.mocks.pdf.loadDocument('history-test', setup.data);
      
      const history = setup.mocks.pdf.getOperationHistory();
      expect(history).toHaveLength(1);
      expect(history[0].operation).toBe('loadDocument');
      expect(history[0].documentId).toBe('history-test');
    });
  });

  describe('Field Mock Unit Tests', () => {
    it('should register and lookup fields', async () => {
      // Register document fields
      setup.mocks.field.registerDocument('field-test-doc', [
        { name: 'signature', type: 'signature', required: true },
        { name: 'date', type: 'text', required: false }
      ]);

      // Look up fields
      const fields = await setup.mocks.field.lookupFields(['signature', 'date'], 'field-test-doc');
      
      expect(fields).toBeDefined();
      expect(fields.fields).toHaveLength(2);
      expect(fields.fields[0].name).toBe('signature');
      expect(fields.fields[1].name).toBe('date');
    });

    it('should handle field lookup errors', async () => {
      try {
        // Try to lookup fields for unregistered document
        await setup.mocks.field.lookupFields(['nonexistent'], 'unregistered-doc');
        fail('Expected error was not thrown');
      } catch (error) {
        // Validate error follows expected pattern
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBe(true);
      }
    });

    it('should track lookup history', async () => {
      setup.mocks.field.registerDocument('history-doc', [
        { name: 'field1', type: 'text', required: true }
      ]);

      await setup.mocks.field.lookupFields(['field1'], 'history-doc');
      
      const history = setup.mocks.field.getLookupHistory();
      expect(history).toHaveLength(1);
      expect(history[0].fieldNames).toContain('field1');
      expect(history[0].documentId).toBe('history-doc');
    });
  });

  describe('Crypto Mock Unit Tests', () => {
    it('should validate signatures', async () => {
      const result = await setup.mocks.crypto.validateSignature(
        'test-signature-data',
        'test-certificate-data'
      );
      
      expect(result).toBeDefined();
      expect(typeof result.isValid).toBe('boolean');
      expect(result.algorithm).toBeDefined();
    });

    it('should track operation counts', async () => {
      await setup.mocks.crypto.validateSignature('sig1', 'cert1');
      await setup.mocks.crypto.validateSignature('sig2', 'cert2');
      
      const totalCount = setup.mocks.crypto.getOperationCount();
      const validateCount = setup.mocks.crypto.getOperationCount('validate');
      
      expect(totalCount).toBe(2);
      expect(validateCount).toBe(2);
    });

    it('should handle different signature algorithms', async () => {
      // Configure crypto mock for specific algorithm
      setup.mocks.crypto.updateConfiguration({
        validationResults: [
          { isValid: true, algorithm: 'RSA-SHA256' },
          { isValid: false, algorithm: 'RSA-SHA1', error: 'Weak algorithm' }
        ],
        errorScenarios: []
      });

      const result = await setup.mocks.crypto.validateSignature('test-sig', 'test-cert');
      expect(['RSA-SHA256', 'RSA-SHA1']).toContain(result.algorithm);
    });
  });

  describe('Error Validation Unit Tests', () => {
    it('should validate error structure', () => {
      const testError = new Error('PDF parsing failed (Code: TST_PDF_001): Test error');
      const validation = setup.validateError(testError);
      
      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.diagnostics).toBeDefined();
      expect(validation.diagnostics.structureAnalysis).toBeDefined();
    });

    it('should validate against specific patterns', () => {
      const testError = new Error('PDF parsing failed (Code: TST_PDF_001): Test error');
      const validation = setup.validateError(testError, 'PDF_LOAD_ERROR');
      
      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
    });

    it('should provide diagnostic information', () => {
      const testError = new Error('Invalid error format');
      const validation = setup.validateError(testError);
      
      expect(validation.diagnostics).toBeDefined();
      expect(validation.diagnostics.actualMessage).toBe('Invalid error format');
      expect(validation.diagnostics.structureAnalysis).toBeDefined();
      expect(typeof validation.diagnostics.structureAnalysis.wordCount).toBe('number');
    });
  });

  describe('Data Generation Unit Tests', () => {
    it('should generate compatible test data', () => {
      const data = setup.data;
      
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
      
      // Data should be compatible with PDF mock
      expect(() => setup.mocks.pdf.loadDocument('data-test', data)).not.toThrow();
    });

    it('should generate consistent data structure', () => {
      const data1 = infrastructure.generateTestData();
      const data2 = infrastructure.generateTestData();
      
      // Structure should be consistent (though values may differ)
      expect(typeof data1).toBe(typeof data2);
      expect(data1).toBeDefined();
      expect(data2).toBeDefined();
    });
  });

  describe('Mock Coordination Unit Tests', () => {
    it('should coordinate mock reset', () => {
      // Perform operations to create state
      setup.mocks.pdf.loadDocument('reset-test', setup.data);
      
      // Reset should clear all state
      infrastructure.resetMocks();
      
      // Verify reset worked
      const loadedDocs = setup.mocks.pdf.getLoadedDocuments();
      expect(loadedDocs).toHaveLength(0);
    });

    it('should provide mock status', () => {
      const feedback = setup.feedback();
      
      expect(feedback).toBeDefined();
      expect(feedback.mockUsage).toBeDefined();
      expect(feedback.realImplementationUsage).toBeDefined();
      expect(feedback.executionTime).toBeDefined();
      expect(feedback.diagnosticInfo).toBeDefined();
    });
  });

  describe('Configuration Unit Tests', () => {
    it('should use unit testing configuration', () => {
      // Unit testing should use minimal complexity
      const feedback = setup.feedback();
      expect(feedback).toBeDefined();
      
      // Should be using mocks (not real implementations)
      expect(feedback.realImplementationUsage.pdf).toBe(false);
      expect(feedback.realImplementationUsage.field).toBe(false);
      expect(feedback.realImplementationUsage.crypto).toBe(false);
    });

    it('should support scenario reconfiguration', () => {
      // Should be able to reconfigure for different scenarios
      expect(() => infrastructure.configureForScenario('integration')).not.toThrow();
      expect(() => infrastructure.configureForScenario('error')).not.toThrow();
      expect(() => infrastructure.configureForScenario('property')).not.toThrow();
    });
  });
});

/**
 * Example of testing a specific function with the infrastructure
 */
describe('Function Testing Example', () => {
  let setup: any;

  beforeEach(() => {
    const infrastructure = TestInfrastructure.create().configureForScenario('unit');
    setup = infrastructure.setupTestWorkflow();
  });

  afterEach(() => {
    setup.cleanup();
  });

  // Example function to test
  async function processPdfDocument(documentId: string, documentData: any, pdfMock: any) {
    const result = await pdfMock.loadDocument(documentId, documentData);
    if (!result.success) {
      throw new Error(`Failed to load document: ${documentId}`);
    }
    return {
      documentId: result.documentId,
      fieldCount: result.fields?.length || 0,
      processed: true
    };
  }

  it('should process PDF document successfully', async () => {
    const result = await processPdfDocument('test-doc', setup.data, setup.mocks.pdf);
    
    expect(result).toBeDefined();
    expect(result.documentId).toBe('test-doc');
    expect(result.processed).toBe(true);
    expect(typeof result.fieldCount).toBe('number');
  });

  it('should handle processing errors', async () => {
    try {
      // Use invalid data to trigger error
      await processPdfDocument('invalid-doc', { invalid: 'data' }, setup.mocks.pdf);
      fail('Expected error was not thrown');
    } catch (error) {
      expect(error.message).toContain('Failed to load document');
      
      // Validate error structure
      const validation = setup.validateError(error as Error);
      expect(validation.isValid).toBe(true);
    }
  });
});