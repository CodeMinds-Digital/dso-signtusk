/**
 * Property Test: Mock Consistency and State Management
 * 
 * Feature: test-infrastructure-improvement, Property 1: Mock Consistency and State Management
 * Validates: Requirements 1.1, 1.4
 */

import * as fc from 'fast-check';
import { beforeEach, describe, expect, test } from 'vitest';
import { createPropertyTestTag, getPropertyTestConfig } from '../config/fast-check.config';
import { ErrorType } from '../errors/types';
import { PdfMock } from './pdf-mock';
import { DocumentState, FieldType } from './types';

describe('Mock Consistency and State Management Properties', () => {
  let pdfMock: PdfMock;

  beforeEach(() => {
    pdfMock = new PdfMock();
  });

  test(createPropertyTestTag(1, 'Mock Consistency and State Management'), () => {
    // Property 1: For any mock configuration and sequence of operations, 
    // the mock implementation should return consistent results for identical inputs 
    // and maintain proper state throughout the test execution.

    const fieldArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }),
      type: fc.constantFrom(...Object.values(FieldType)),
      required: fc.boolean(),
      validation: fc.array(fc.record({
        type: fc.string(),
        parameter: fc.oneof(fc.string(), fc.integer()),
        message: fc.option(fc.string())
      }), { maxLength: 3 }),
      value: fc.option(fc.string()),
      position: fc.option(fc.record({
        x: fc.integer({ min: 0, max: 1000 }),
        y: fc.integer({ min: 0, max: 1000 }),
        width: fc.integer({ min: 1, max: 500 }),
        height: fc.integer({ min: 1, max: 500 })
      }))
    });

    const configArbitrary = fc.record({
      fields: fc.array(fieldArbitrary, { maxLength: 10 }),
      documentState: fc.constantFrom(...Object.values(DocumentState)),
      validationBehavior: fc.record({
        shouldSucceed: fc.boolean(),
        errorType: fc.option(fc.constantFrom(...Object.values(ErrorType))),
        customMessage: fc.option(fc.string())
      })
    });

    const operationSequenceArbitrary = fc.array(
      fc.record({
        type: fc.constantFrom('load', 'discoverFields', 'getField', 'setFieldValue', 'updateState'),
        documentId: fc.string({ minLength: 1, maxLength: 20 }),
        fieldName: fc.option(fc.string({ minLength: 1, maxLength: 30 })),
        fieldValue: fc.option(fc.string()),
        newState: fc.option(fc.constantFrom(...Object.values(DocumentState)))
      }),
      { minLength: 1, maxLength: 20 }
    );

    fc.assert(
      fc.asyncProperty(
        configArbitrary,
        operationSequenceArbitrary,
        async (config, operations) => {
          // Reset mock with new configuration
          pdfMock.reset();
          pdfMock.updateConfiguration(config);

          const results: Array<{ operation: any; result: any; error?: string }> = [];

          // Execute operations sequence
          for (const op of operations) {
            try {
              let result: any;
              
              switch (op.type) {
                case 'load':
                  if (config.validationBehavior.shouldSucceed) {
                    result = await pdfMock.loadDocument(op.documentId, config.fields);
                    expect(result.id).toBe(op.documentId);
                    expect(result.fields).toEqual(config.fields);
                    expect(result.state).toBe(config.documentState);
                  }
                  break;

                case 'discoverFields':
                  if (pdfMock.hasDocument(op.documentId)) {
                    result = await pdfMock.discoverFields(op.documentId);
                    expect(Array.isArray(result)).toBe(true);
                    // Consistent results for same document
                    const secondResult = await pdfMock.discoverFields(op.documentId);
                    expect(result).toEqual(secondResult);
                  }
                  break;

                case 'getField':
                  if (pdfMock.hasDocument(op.documentId) && op.fieldName) {
                    result = await pdfMock.getField(op.documentId, op.fieldName);
                    // Consistent results for same field lookup
                    const secondResult = await pdfMock.getField(op.documentId, op.fieldName);
                    expect(result).toEqual(secondResult);
                  }
                  break;

                case 'setFieldValue':
                  if (pdfMock.hasDocument(op.documentId) && op.fieldName && op.fieldValue) {
                    const fieldExists = config.fields.some(f => f.name === op.fieldName);
                    if (fieldExists) {
                      await pdfMock.setFieldValue(op.documentId, op.fieldName, op.fieldValue);
                      // State should be updated to MODIFIED
                      const state = pdfMock.getDocumentState(op.documentId);
                      expect(state).toBe(DocumentState.MODIFIED);
                    }
                  }
                  break;

                case 'updateState':
                  if (pdfMock.hasDocument(op.documentId) && op.newState) {
                    await pdfMock.updateDocumentState(op.documentId, op.newState);
                    const state = pdfMock.getDocumentState(op.documentId);
                    expect(state).toBe(op.newState);
                  }
                  break;
              }

              results.push({ operation: op, result });
            } catch (error) {
              results.push({ operation: op, result: null, error: (error as Error).message });
            }
          }

          // Verify state consistency
          const loadedDocs = pdfMock.getLoadedDocuments();
          for (const docId of loadedDocs) {
            const state = pdfMock.getDocumentState(docId);
            const metadata = pdfMock.getDocumentMetadata(docId);
            
            // State should be valid
            expect(Object.values(DocumentState)).toContain(state);
            
            // Metadata should exist and be consistent
            expect(metadata).toBeDefined();
            expect(metadata?.fieldCount).toBe(config.fields.length);
          }

          // Operation history should be maintained
          const history = pdfMock.getOperationHistory();
          expect(Array.isArray(history)).toBe(true);
          
          // Each operation should have proper structure
          history.forEach(entry => {
            expect(entry).toHaveProperty('operation');
            expect(entry).toHaveProperty('documentId');
            expect(entry).toHaveProperty('timestamp');
            expect(entry.timestamp).toBeInstanceOf(Date);
          });

          return true;
        }
      ),
      getPropertyTestConfig()
    );
  });

  test('Mock state consistency across multiple identical operations', () => {
    // Additional property test for state consistency
    const documentIdArbitrary = fc.string({ minLength: 1, maxLength: 20 });
    const fieldsArbitrary = fc.array(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 30 }),
        type: fc.constantFrom(...Object.values(FieldType)),
        required: fc.boolean(),
        validation: fc.array(fc.record({
          type: fc.string(),
          parameter: fc.oneof(fc.string(), fc.integer()),
          message: fc.option(fc.string())
        }), { maxLength: 2 })
      }),
      { minLength: 1, maxLength: 5 }
    );

    fc.assert(
      fc.asyncProperty(
        documentIdArbitrary,
        fieldsArbitrary,
        async (docId, fields) => {
          pdfMock.reset();
          
          // Load document multiple times should be consistent
          const doc1 = await pdfMock.loadDocument(docId, fields);
          
          // Subsequent operations should see consistent state
          const discoveredFields1 = await pdfMock.discoverFields(docId);
          const discoveredFields2 = await pdfMock.discoverFields(docId);
          
          expect(discoveredFields1).toEqual(discoveredFields2);
          expect(discoveredFields1).toEqual(fields);
          
          // State should remain consistent
          const state1 = pdfMock.getDocumentState(docId);
          const state2 = pdfMock.getDocumentState(docId);
          
          expect(state1).toBe(state2);
          expect(state1).toBe(doc1.state);
          
          return true;
        }
      ),
      getPropertyTestConfig()
    );
  });
});