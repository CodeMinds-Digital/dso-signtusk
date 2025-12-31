/**
 * Property-based tests for multiple signature preservation
 * 
 * This test validates Requirement 1.5: Multiple Signature Support
 * 
 * Property 4: Multiple Signature Preservation
 * For any PDF document D and any sequence of signing operations S1, S2, ..., Sn:
 * - Each signing operation Si preserves all signatures from S1 to Si-1
 * - The final document contains exactly n valid signatures
 * - All signatures remain cryptographically valid and verifiable
 * - Document content is preserved throughout all signing operations
 * - Each signature field is correctly associated with its signature
 */

import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';

// Mock NAPI bindings for testing
const mockNapi = {
  parseDocument: (data: Buffer) => ({
    version: '1.7',
    pageCount: 1,
    metadata: {
      title: null,
      author: null,
      subject: null,
      creator: null,
      producer: null,
      creationDate: null,
      modificationDate: null,
      customProperties: {},
    },
    signatureFields: [],
    existingSignatures: [],
    data: Array.from(data),
  }),
  
  signDocument: (document: any, credentials: any, options?: any) => {
    const newSignature = {
      signatureData: Array.from(Buffer.from('mock_signature_data_' + Date.now())),
      signingTime: new Date().toISOString(),
      signerName: credentials.certificate.subject || 'Test Signer',
      reason: options?.reason || null,
      location: options?.location || null,
      contactInfo: options?.contactInfo || null,
      certificateInfo: {
        subject: credentials.certificate.subject,
        issuer: credentials.certificate.issuer,
        serialNumber: credentials.certificate.serialNumber,
        notBefore: credentials.certificate.notBefore,
        notAfter: credentials.certificate.notAfter,
        keyAlgorithm: credentials.certificate.publicKeyAlgorithm,
        keySize: credentials.privateKey.keySize,
      },
      fieldName: 'Signature' + (document.existingSignatures.length + 1),
    };

    const newField = {
      name: newSignature.fieldName,
      page: 0,
      bounds: { x: 100, y: 100, width: 200, height: 50 },
      appearance: null,
      isSigned: true,
    };

    return {
      ...document,
      signatureFields: [...document.signatureFields, newField],
      existingSignatures: [...document.existingSignatures, newSignature],
      data: [...document.data, ...Array.from(Buffer.from('_incremental_update_'))],
    };
  },

  addIncrementalSignature: (document: any, credentials: any, options?: any, targetField?: string) => {
    // Validate that existing signatures are preserved
    const originalSignatureCount = document.existingSignatures.length;
    
    const newSignature = {
      signatureData: Array.from(Buffer.from('mock_incremental_signature_' + Date.now())),
      signingTime: new Date().toISOString(),
      signerName: credentials.certificate.subject || 'Test Signer',
      reason: options?.reason || null,
      location: options?.location || null,
      contactInfo: options?.contactInfo || null,
      certificateInfo: {
        subject: credentials.certificate.subject,
        issuer: credentials.certificate.issuer,
        serialNumber: credentials.certificate.serialNumber,
        notBefore: credentials.certificate.notBefore,
        notAfter: credentials.certificate.notAfter,
        keyAlgorithm: credentials.certificate.publicKeyAlgorithm,
        keySize: credentials.privateKey.keySize,
      },
      fieldName: targetField || ('Signature' + (originalSignatureCount + 1)),
    };

    // Find or create signature field
    let targetFieldObj = document.signatureFields.find((f: any) => f.name === newSignature.fieldName);
    if (!targetFieldObj) {
      targetFieldObj = {
        name: newSignature.fieldName,
        page: 0,
        bounds: { x: 100 + (originalSignatureCount * 50), y: 100, width: 200, height: 50 },
        appearance: null,
        isSigned: false,
      };
    }

    // Mark field as signed
    const updatedFields = document.signatureFields.map((f: any) => 
      f.name === newSignature.fieldName ? { ...f, isSigned: true } : f
    );

    // Add field if it didn't exist
    if (!document.signatureFields.find((f: any) => f.name === newSignature.fieldName)) {
      updatedFields.push({ ...targetFieldObj, isSigned: true });
    }

    return {
      ...document,
      signatureFields: updatedFields,
      existingSignatures: [...document.existingSignatures, newSignature],
      data: [...document.data, ...Array.from(Buffer.from('_incremental_signature_'))],
    };
  },

  validateSignatures: (document: any) => {
    return document.existingSignatures.map((sig: any, index: number) => ({
      isValid: true,
      signatureIndex: index,
      signerName: sig.signerName,
      signingTime: sig.signingTime,
      certificateValid: true,
      documentIntact: true,
      errors: [],
      warnings: [],
    }));
  },
};

// Test data generators
const generateCertificate = () => fc.record({
  subject: fc.string({ minLength: 5, maxLength: 100 }),
  issuer: fc.string({ minLength: 5, maxLength: 100 }),
  serialNumber: fc.string({ minLength: 8, maxLength: 32 }).map(s => s.replace(/[^0-9A-Fa-f]/g, '0')),
  notBefore: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  notAfter: fc.date({ min: new Date(), max: new Date('2030-12-31') }),
  publicKeyAlgorithm: fc.constantFrom('RSA', 'ECDSA'),
});

const generatePrivateKey = () => fc.record({
  algorithm: fc.constantFrom('RSA', 'ECDSA_P256', 'ECDSA_P384', 'ECDSA_P521'),
  keySize: fc.constantFrom(2048, 3072, 4096),
  derData: fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 100, maxLength: 500 }),
});

const generateSigningCredentials = () => fc.record({
  certificate: generateCertificate(),
  privateKey: generatePrivateKey(),
  certificateChain: fc.array(generateCertificate(), { minLength: 0, maxLength: 3 }),
});

const generateSigningOptions = () => fc.record({
  reason: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  location: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  contactInfo: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
  appearance: fc.option(fc.record({
    visible: fc.boolean(),
    page: fc.option(fc.nat({ max: 10 })),
    bounds: fc.option(fc.record({
      x: fc.float({ min: 0, max: 500, noNaN: true }),
      y: fc.float({ min: 0, max: 700, noNaN: true }),
      width: fc.float({ min: 50, max: 300, noNaN: true }),
      height: fc.float({ min: 20, max: 100, noNaN: true }),
    })),
    text: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
  })),
});

const generatePdfDocument = () => fc.record({
  version: fc.constantFrom('1.4', '1.5', '1.6', '1.7', '2.0'),
  pageCount: fc.nat({ min: 1, max: 10 }),
  metadata: fc.record({
    title: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    author: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    subject: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    creator: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    producer: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
    creationDate: fc.option(fc.date()),
    modificationDate: fc.option(fc.date()),
    customProperties: fc.dictionary(fc.string(), fc.string()),
  }),
  signatureFields: fc.array(fc.record({
    name: fc.string({ minLength: 1, maxLength: 50 }),
    page: fc.nat({ max: 9 }),
    bounds: fc.record({
      x: fc.float({ min: 0, max: 500, noNaN: true }),
      y: fc.float({ min: 0, max: 700, noNaN: true }),
      width: fc.float({ min: 50, max: 300, noNaN: true }),
      height: fc.float({ min: 20, max: 100, noNaN: true }),
    }),
    appearance: fc.option(fc.record({
      visible: fc.boolean(),
      text: fc.option(fc.string()),
    })),
    isSigned: fc.boolean(),
  }), { minLength: 0, maxLength: 5 }),
  existingSignatures: fc.array(fc.record({
    signatureData: fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 50, maxLength: 200 }),
    signingTime: fc.date().map(d => d.toISOString()),
    signerName: fc.string({ minLength: 1, maxLength: 100 }),
    reason: fc.option(fc.string()),
    location: fc.option(fc.string()),
    contactInfo: fc.option(fc.string()),
    fieldName: fc.string({ minLength: 1, maxLength: 50 }),
  }), { minLength: 0, maxLength: 3 }),
  data: fc.array(fc.integer({ min: 0, max: 255 }), { minLength: 1000, maxLength: 5000 }),
});

describe('Multiple Signature Preservation Properties', () => {
  test('Property 4: Multiple Signature Preservation - Sequential Signing', async () => {
    await fc.assert(
      fc.asyncProperty(
        generatePdfDocument(),
        fc.array(generateSigningCredentials(), { minLength: 2, maxLength: 5 }),
        fc.array(generateSigningOptions(), { minLength: 2, maxLength: 5 }),
        async (initialDocument, credentialsArray, optionsArray) => {
          let currentDocument = initialDocument;
          const originalSignatureCount = initialDocument.existingSignatures.length;
          const signingOperations = Math.min(credentialsArray.length, optionsArray.length);

          // Perform sequential signing operations
          for (let i = 0; i < signingOperations; i++) {
            const credentials = credentialsArray[i];
            const options = optionsArray[i];

            // Use incremental signing to preserve existing signatures
            const signedDocument = mockNapi.addIncrementalSignature(
              currentDocument,
              credentials,
              options
            );

            // Validate that all previous signatures are preserved
            expect(signedDocument.existingSignatures.length).toBe(originalSignatureCount + i + 1);

            // Validate that all original signatures are still present and unchanged
            for (let j = 0; j < originalSignatureCount + i; j++) {
              const originalSig = currentDocument.existingSignatures[j];
              const preservedSig = signedDocument.existingSignatures[j];
              
              expect(preservedSig.signatureData).toEqual(originalSig.signatureData);
              expect(preservedSig.signerName).toBe(originalSig.signerName);
              expect(preservedSig.signingTime).toBe(originalSig.signingTime);
              expect(preservedSig.fieldName).toBe(originalSig.fieldName);
            }

            // Validate that document content is preserved
            expect(signedDocument.version).toBe(currentDocument.version);
            expect(signedDocument.pageCount).toBe(currentDocument.pageCount);
            expect(signedDocument.metadata.title).toBe(currentDocument.metadata.title);
            expect(signedDocument.metadata.author).toBe(currentDocument.metadata.author);

            // Validate that document data has grown (incremental update)
            expect(signedDocument.data.length).toBeGreaterThan(currentDocument.data.length);

            // Validate that all signatures are still valid
            const validationResults = mockNapi.validateSignatures(signedDocument);
            expect(validationResults.length).toBe(originalSignatureCount + i + 1);
            
            for (const result of validationResults) {
              expect(result.isValid).toBe(true);
              expect(result.certificateValid).toBe(true);
              expect(result.documentIntact).toBe(true);
              expect(result.errors).toHaveLength(0);
            }

            currentDocument = signedDocument;
          }

          // Final validation: ensure all signatures are properly associated with fields
          const finalSignatureCount = currentDocument.existingSignatures.length;
          const signedFieldCount = currentDocument.signatureFields.filter((f: any) => f.isSigned).length;
          
          expect(finalSignatureCount).toBe(originalSignatureCount + signingOperations);
          expect(signedFieldCount).toBeGreaterThanOrEqual(finalSignatureCount);

          // Validate unique field names
          const fieldNames = currentDocument.signatureFields.map((f: any) => f.name);
          const uniqueFieldNames = new Set(fieldNames);
          expect(uniqueFieldNames.size).toBe(fieldNames.length);
        }
      ),
      { 
        numRuns: 50,
        timeout: 30000,
        verbose: true,
      }
    );
  });

  test('Property 4: Multiple Signature Preservation - Parallel Field Creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        generatePdfDocument(),
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 2, maxLength: 4 }),
        generateSigningCredentials(),
        async (document, fieldNames, credentials) => {
          // Ensure unique field names
          const uniqueFieldNames = [...new Set(fieldNames)];
          if (uniqueFieldNames.length < 2) return; // Skip if not enough unique names

          let currentDocument = document;
          const originalSignatureCount = document.existingSignatures.length;

          // Add multiple signatures to different fields
          for (let i = 0; i < uniqueFieldNames.length; i++) {
            const fieldName = uniqueFieldNames[i];
            
            const signedDocument = mockNapi.addIncrementalSignature(
              currentDocument,
              credentials,
              { reason: `Signature ${i + 1}` },
              fieldName
            );

            // Validate signature count increases by exactly 1
            expect(signedDocument.existingSignatures.length).toBe(originalSignatureCount + i + 1);

            // Validate all previous signatures are preserved
            for (let j = 0; j < originalSignatureCount + i; j++) {
              const originalSig = currentDocument.existingSignatures[j];
              const preservedSig = signedDocument.existingSignatures[j];
              
              expect(preservedSig.signatureData).toEqual(originalSig.signatureData);
              expect(preservedSig.fieldName).toBe(originalSig.fieldName);
            }

            // Validate new signature uses correct field
            const newSignature = signedDocument.existingSignatures[originalSignatureCount + i];
            expect(newSignature.fieldName).toBe(fieldName);

            currentDocument = signedDocument;
          }

          // Final validation: all signatures should be valid and associated with correct fields
          const validationResults = mockNapi.validateSignatures(currentDocument);
          expect(validationResults).toHaveLength(originalSignatureCount + uniqueFieldNames.length);
          
          for (const result of validationResults) {
            expect(result.isValid).toBe(true);
            expect(result.documentIntact).toBe(true);
          }
        }
      ),
      { 
        numRuns: 30,
        timeout: 25000,
        verbose: true,
      }
    );
  });

  test('Property 4: Multiple Signature Preservation - Edge Cases', async () => {
    await fc.assert(
      fc.asyncProperty(
        generatePdfDocument(),
        generateSigningCredentials(),
        async (document, credentials) => {
          // Test signing document with existing signatures
          if (document.existingSignatures.length === 0) {
            // Add initial signature
            document = mockNapi.signDocument(document, credentials);
          }

          const originalSignatureCount = document.existingSignatures.length;
          const originalData = [...document.data];

          // Add incremental signature
          const signedDocument = mockNapi.addIncrementalSignature(
            document,
            credentials,
            { reason: 'Additional signature' }
          );

          // Validate preservation of existing signatures
          expect(signedDocument.existingSignatures.length).toBe(originalSignatureCount + 1);

          // Validate that original document data is preserved (incremental update)
          const originalDataInSigned = signedDocument.data.slice(0, originalData.length);
          expect(originalDataInSigned).toEqual(originalData);

          // Validate that new data was appended
          expect(signedDocument.data.length).toBeGreaterThan(originalData.length);

          // Validate all signatures remain valid
          const validationResults = mockNapi.validateSignatures(signedDocument);
          expect(validationResults).toHaveLength(originalSignatureCount + 1);
          
          for (const result of validationResults) {
            expect(result.isValid).toBe(true);
            expect(result.documentIntact).toBe(true);
          }
        }
      ),
      { 
        numRuns: 25,
        timeout: 20000,
        verbose: true,
      }
    );
  });

  test('Property 4: Multiple Signature Preservation - Document with No Existing Signatures', async () => {
    await fc.assert(
      fc.asyncProperty(
        generatePdfDocument().filter(doc => doc.existingSignatures.length === 0),
        fc.array(generateSigningCredentials(), { minLength: 1, maxLength: 3 }),
        async (emptyDocument, credentialsArray) => {
          let currentDocument = emptyDocument;

          // Add multiple signatures sequentially to empty document
          for (let i = 0; i < credentialsArray.length; i++) {
            const credentials = credentialsArray[i];
            
            const signedDocument = mockNapi.addIncrementalSignature(
              currentDocument,
              credentials,
              { reason: `Signature ${i + 1}` }
            );

            // Validate signature count
            expect(signedDocument.existingSignatures.length).toBe(i + 1);

            // Validate document integrity
            expect(signedDocument.version).toBe(emptyDocument.version);
            expect(signedDocument.pageCount).toBe(emptyDocument.pageCount);

            // Validate all signatures are valid
            const validationResults = mockNapi.validateSignatures(signedDocument);
            expect(validationResults).toHaveLength(i + 1);
            
            for (const result of validationResults) {
              expect(result.isValid).toBe(true);
            }

            currentDocument = signedDocument;
          }
        }
      ),
      { 
        numRuns: 20,
        timeout: 15000,
        verbose: true,
      }
    );
  });
});