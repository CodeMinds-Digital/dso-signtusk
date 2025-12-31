/**
 * Property Test: Mock Reset Reliability
 * 
 * Feature: test-infrastructure-improvement, Property 2: Mock Reset Reliability
 * Validates: Requirements 1.5
 */

import * as fc from 'fast-check';
import { beforeEach, describe, expect, test } from 'vitest';
import { createPropertyTestTag, getPropertyTestConfig } from '../config/fast-check.config';
import { MockCoordinator, MockResetUtils } from './mock-coordinator';
import { FieldType } from './types';

describe('Mock Reset Reliability Properties', () => {
  let mockCoordinator: MockCoordinator;

  beforeEach(() => {
    // Create a completely fresh instance for each test
    mockCoordinator = new MockCoordinator();
    // Ensure clean state
    mockCoordinator.resetAll('beforeEach setup');
  });

  test(createPropertyTestTag(2, 'Mock Reset Reliability'), () => {
    // Property 2: For any mock state modifications, resetting the mock should restore 
    // it to a clean initial state with no residual data from previous operations.

    const fieldArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 30 }),
      type: fc.constantFrom(...Object.values(FieldType)),
      required: fc.boolean(),
      validation: fc.array(fc.record({
        type: fc.string(),
        parameter: fc.oneof(fc.string(), fc.integer()),
        message: fc.option(fc.string())
      }), { maxLength: 2 }),
      value: fc.option(fc.string())
    });

    const operationSequenceArbitrary = fc.array(
      fc.record({
        type: fc.constantFrom('pdf_load', 'field_register', 'crypto_validate', 'field_lookup', 'crypto_sign'),
        documentId: fc.string({ minLength: 1, maxLength: 20 }),
        fields: fc.option(fc.array(fieldArbitrary, { maxLength: 5 })),
        fieldName: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
        signature: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
        content: fc.option(fc.string({ minLength: 1, maxLength: 100 }))
      }),
      { minLength: 1, maxLength: 15 }
    );

    fc.assert(
      fc.asyncProperty(
        operationSequenceArbitrary,
        async (operations) => {
          // Start with clean state
          mockCoordinator.resetAll('test start');
          expect(mockCoordinator.verifyCleanState()).toBe(true);

          const { pdf, field, crypto } = mockCoordinator.getMocks();

          // Perform operations to modify state
          for (const op of operations) {
            try {
              switch (op.type) {
                case 'pdf_load':
                  if (op.fields) {
                    await pdf.loadDocument(op.documentId, op.fields);
                  }
                  break;

                case 'field_register':
                  if (op.fields) {
                    field.registerFields(op.documentId, op.fields);
                  }
                  break;

                case 'crypto_validate':
                  if (op.signature) {
                    await crypto.validatePKCS7({
                      signature: op.signature,
                      certificate: 'test-cert',
                      timestamp: new Date()
                    });
                  }
                  break;

                case 'field_lookup':
                  if (field.getRegisteredDocuments().includes(op.documentId)) {
                    field.lookupFields(op.documentId);
                  }
                  break;

                case 'crypto_sign':
                  if (op.content) {
                    await crypto.createSignature({
                      content: op.content,
                      certificate: 'test-cert'
                    });
                  }
                  break;
              }
            } catch (error) {
              // Some operations may fail, which is expected
            }
          }

          // Verify state has been modified (at least some operations should have succeeded)
          const statusBeforeReset = mockCoordinator.getStatus();
          const hasModifications = 
            statusBeforeReset.pdf.operationsPerformed > 0 ||
            statusBeforeReset.field.lookupsPerformed > 0 ||
            statusBeforeReset.crypto.operationsPerformed > 0;

          // Reset all mocks
          mockCoordinator.resetAll('property test reset');

          // Verify clean state after reset
          expect(mockCoordinator.verifyCleanState()).toBe(true);

          // Verify specific clean state conditions
          const statusAfterReset = mockCoordinator.getStatus();
          
          // PDF mock should be clean
          expect(statusAfterReset.pdf.documentsLoaded).toBe(0);
          expect(statusAfterReset.pdf.operationsPerformed).toBe(0);
          expect(statusAfterReset.pdf.isClean).toBe(true);
          
          // Field mock should be clean
          expect(statusAfterReset.field.documentsRegistered).toBe(0);
          expect(statusAfterReset.field.lookupsPerformed).toBe(0);
          expect(statusAfterReset.field.isClean).toBe(true);
          
          // Crypto mock should be clean
          expect(statusAfterReset.crypto.operationsPerformed).toBe(0);
          expect(statusAfterReset.crypto.validationCount).toBe(0);
          expect(statusAfterReset.crypto.signCount).toBe(0);
          expect(statusAfterReset.crypto.verifyCount).toBe(0);
          expect(statusAfterReset.crypto.isClean).toBe(true);
          
          // Overall status should be clean
          expect(statusAfterReset.overall.isClean).toBe(true);
          expect(statusAfterReset.overall.resetCount).toBeGreaterThan(0);

          // Verify no residual data
          expect(pdf.getLoadedDocuments()).toEqual([]);
          expect(pdf.getOperationHistory()).toEqual([]);
          expect(field.getRegisteredDocuments()).toEqual([]);
          expect(field.getLookupHistory()).toEqual([]);
          expect(crypto.getOperationHistory()).toEqual([]);

          return true;
        }
      ),
      getPropertyTestConfig()
    );
  });

  test('Individual mock reset reliability', () => {
    const mockTypeArbitrary = fc.constantFrom('pdf', 'field', 'crypto');
    const operationCountArbitrary = fc.integer({ min: 1, max: 10 });

    fc.assert(
      fc.asyncProperty(
        mockTypeArbitrary,
        operationCountArbitrary,
        async (mockType, operationCount) => {
          mockCoordinator.resetAll('test start');
          const { pdf, field, crypto } = mockCoordinator.getMocks();

          // Perform operations on the specific mock type
          for (let i = 0; i < operationCount; i++) {
            try {
              switch (mockType) {
                case 'pdf':
                  await pdf.loadDocument(`doc_${i}`, []);
                  break;
                case 'field':
                  field.registerFields(`doc_${i}`, []);
                  break;
                case 'crypto':
                  await crypto.validatePKCS7({
                    signature: `sig_${i}`,
                    certificate: 'test-cert'
                  });
                  break;
              }
            } catch (error) {
              // Expected for some operations
            }
          }

          // Reset specific mock
          mockCoordinator.resetMock(mockType, 'individual reset test');

          // Verify the specific mock is clean
          const status = mockCoordinator.getStatus();
          switch (mockType) {
            case 'pdf':
              expect(status.pdf.isClean).toBe(true);
              expect(pdf.getLoadedDocuments()).toEqual([]);
              expect(pdf.getOperationHistory()).toEqual([]);
              break;
            case 'field':
              expect(status.field.isClean).toBe(true);
              expect(field.getRegisteredDocuments()).toEqual([]);
              expect(field.getLookupHistory()).toEqual([]);
              break;
            case 'crypto':
              expect(status.crypto.isClean).toBe(true);
              expect(crypto.getOperationHistory()).toEqual([]);
              break;
          }

          return true;
        }
      ),
      getPropertyTestConfig()
    );
  });

  test('Reset history tracking reliability', () => {
    const resetReasonArbitrary = fc.option(fc.string({ minLength: 1, maxLength: 50 }));
    const resetCountArbitrary = fc.integer({ min: 1, max: 10 });

    fc.assert(
      fc.property(
        fc.array(resetReasonArbitrary, { minLength: 1, maxLength: 10 }),
        (resetReasons) => {
          const coordinator = new MockCoordinator();
          const initialHistoryLength = coordinator.getResetHistory().length;

          // Perform resets with different reasons
          resetReasons.forEach(reason => {
            coordinator.resetAll(reason || undefined);
          });

          // Verify reset history
          const history = coordinator.getResetHistory();
          expect(history.length).toBe(initialHistoryLength + resetReasons.length);

          // Verify each reset is recorded
          const recentHistory = history.slice(initialHistoryLength);
          recentHistory.forEach((entry, index) => {
            expect(entry).toHaveProperty('timestamp');
            expect(entry.timestamp).toBeInstanceOf(Date);
            
            if (resetReasons[index]) {
              expect(entry.reason).toBe(resetReasons[index]);
            }
          });

          // Verify timestamps are in order
          for (let i = 1; i < recentHistory.length; i++) {
            expect(recentHistory[i].timestamp.getTime())
              .toBeGreaterThanOrEqual(recentHistory[i - 1].timestamp.getTime());
          }

          return true;
        }
      ),
      getPropertyTestConfig()
    );
  });

  test('State restoration after multiple operations', () => {
    const documentIdArbitrary = fc.string({ minLength: 1, maxLength: 20 });
    const fieldsArbitrary = fc.array(
      fc.record({
        name: fc.string({ minLength: 1, maxLength: 20 }),
        type: fc.constantFrom(...Object.values(FieldType)),
        required: fc.boolean(),
        validation: fc.array(fc.record({
          type: fc.string(),
          parameter: fc.string()
        }), { maxLength: 2 })
      }),
      { minLength: 0, maxLength: 5 }
    );

    fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            documentId: documentIdArbitrary,
            fields: fieldsArbitrary
          }),
          { minLength: 1, maxLength: 8 }
        ),
        async (documentConfigs) => {
          mockCoordinator.resetAll('test start');
          const { pdf, field, crypto } = mockCoordinator.getMocks();

          // Capture initial clean state
          const initialStatus = mockCoordinator.getStatus();
          expect(initialStatus.overall.isClean).toBe(true);

          // Perform complex operations
          for (const config of documentConfigs) {
            try {
              // Load PDF document
              await pdf.loadDocument(config.documentId, config.fields);
              
              // Register fields
              field.registerFields(config.documentId, config.fields);
              
              // Perform field lookups
              field.lookupFields(config.documentId);
              
              // Validate some crypto operations
              await crypto.validatePKCS7({
                signature: `signature_for_${config.documentId}`,
                certificate: 'test-cert'
              });
              
              // Set field values
              for (const fieldDef of config.fields) {
                if (pdf.hasDocument(config.documentId)) {
                  await pdf.setFieldValue(config.documentId, fieldDef.name, 'test-value');
                }
              }
            } catch (error) {
              // Some operations may fail, which is expected
            }
          }

          // Verify state has been modified (check if any operations were recorded)
          const modifiedStatus = mockCoordinator.getStatus();
          const hasOperations = 
            modifiedStatus.pdf.operationsPerformed > 0 ||
            modifiedStatus.field.lookupsPerformed > 0 ||
            modifiedStatus.crypto.operationsPerformed > 0;
          
          // Only test reset if operations were actually performed
          if (hasOperations) {
            expect(modifiedStatus.overall.isClean).toBe(false);
          }

          // Reset to initial state
          mockCoordinator.restoreToInitialState();

          // Verify restoration to clean state
          const restoredStatus = mockCoordinator.getStatus();
          expect(restoredStatus.overall.isClean).toBe(true);
          expect(restoredStatus.pdf.isClean).toBe(true);
          expect(restoredStatus.field.isClean).toBe(true);
          expect(restoredStatus.crypto.isClean).toBe(true);

          // Verify no residual data exists
          expect(pdf.getLoadedDocuments()).toEqual([]);
          expect(field.getRegisteredDocuments()).toEqual([]);
          expect(crypto.getOperationCount()).toBe(0);

          return true;
        }
      ),
      getPropertyTestConfig()
    );
  });

  test('Utility functions reliability', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 30 }),
        (reason) => {
          // Test resetAndVerify utility
          const result = MockResetUtils.resetAndVerify(reason);
          expect(result).toBe(true);
          expect(MockResetUtils.verifyClean()).toBe(true);

          const status = MockResetUtils.getStatus();
          expect(status.overall.isClean).toBe(true);

          return true;
        }
      ),
      getPropertyTestConfig()
    );
  });
});