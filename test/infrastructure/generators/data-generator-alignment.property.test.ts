/**
 * Property Test: Data Generator Alignment
 * 
 * Feature: test-infrastructure-improvement, Property 5: Data Generator Alignment
 * Validates: Requirements 2.1, 2.2, 2.3
 * 
 * Tests that generated test data is compatible with and processable by mock implementations
 * without causing unexpected failures.
 */

import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { CryptoMock } from '../mocks/crypto-mock';
import { FieldMock } from '../mocks/field-mock';
import { DocumentState, FieldType } from '../mocks/types';
import { AlignedDataGenerator } from './aligned-data-generator';

describe('Property Test: Data Generator Alignment', () => {
  test('Property 5: Data Generator Alignment - Basic compatibility test', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }),
        (fieldCount) => {
          const generator = new AlignedDataGenerator();
          
          // Test basic PDF document generation
          const pdfDocument = generator.generatePdfDocument({
            fieldCount: { min: fieldCount, max: fieldCount },
            documentState: DocumentState.LOADED,
            includeMetadata: true
          });

          // Basic validation
          expect(pdfDocument.id).toBeDefined();
          expect(pdfDocument.fields).toBeDefined();
          expect(pdfDocument.fields.length).toBe(fieldCount);
          expect(pdfDocument.state).toBe(DocumentState.LOADED);
          
          // Test field generation
          pdfDocument.fields.forEach(field => {
            expect(field.name).toBeDefined();
            expect(field.name.trim().length).toBeGreaterThan(0);
            expect(Object.values(FieldType)).toContain(field.type);
            expect(typeof field.required).toBe('boolean');
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 5a: Field mock compatibility', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (fieldCount) => {
          const generator = new AlignedDataGenerator();
          const fields = generator.generateFieldDefinitions(fieldCount);
          
          const fieldMock = new FieldMock();
          const documentId = 'test-doc';

          // Register fields with the mock first
          fieldMock.registerFields(documentId, fields);

          // Test that field mock can process generated fields
          fields.forEach(field => {
            const lookupResult = fieldMock.lookupField(documentId, field.name, fields);
            expect(lookupResult).toBeDefined();
            expect(lookupResult.name).toBe(field.name);
            expect(lookupResult.type).toBe(field.type);
          });
        }
      ),
      { numRuns: 10 }
    );
  });

  test('Property 5b: Crypto mock compatibility', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }),
        (validationCount) => {
          const generator = new AlignedDataGenerator();
          const cryptoData = generator.generateCryptoValidationData({
            validationCount,
            includeSuccessScenarios: true,
            includeFailureScenarios: true
          });

          const cryptoMock = new CryptoMock();

          // Test that crypto mock can process generated data
          expect(() => {
            cryptoMock.validatePKCS7({
              signature: cryptoData.pkcs7Data,
              certificate: cryptoData.certificateData
            });
          }).not.toThrow();

          // Validate structure
          expect(cryptoData.validationResults).toBeDefined();
          expect(Array.isArray(cryptoData.validationResults)).toBe(true);
          expect(cryptoData.pkcs7Data).toBeDefined();
          expect(cryptoData.certificateData).toBeDefined();
        }
      ),
      { numRuns: 10 }
    );
  });
});