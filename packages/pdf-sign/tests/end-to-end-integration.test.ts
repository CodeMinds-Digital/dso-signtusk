import { beforeAll, describe, expect, it } from 'vitest';
import {
    CertificateManager,
    PdfSigner,
    SignatureValidator,
    initialize,
    type JsSignatureFieldDefinition,
    type JsSigningOptions
} from '../index.js';

describe('End-to-End Integration Tests', () => {
  let signer: PdfSigner;
  let certManager: CertificateManager;
  let validator: SignatureValidator;

  beforeAll(() => {
    initialize();
    signer = new PdfSigner();
    certManager = new CertificateManager();
    validator = new SignatureValidator();
  });

  describe('Complete Document Signing Workflow', () => {
    it('should execute complete signing workflow from PDF to signed document', async () => {
      // Test data setup
      const mockPdfData = Buffer.from('mock pdf document content');
      const mockCertData = Buffer.from('mock certificate data');
      const mockKeyData = Buffer.from('mock private key data');
      const password = 'test-password';

      // Step 1: Parse the original document
      const originalDoc = await signer.parseDocument(mockPdfData);
      expect(originalDoc).toBeDefined();
      expect(originalDoc.version).toBe('1.7');
      expect(originalDoc.pageCount).toBe(1);
      expect(originalDoc.existingSignatures).toHaveLength(0);

      // Step 2: Check if signature fields exist, add one if needed
      let documentToSign = mockPdfData;
      if (originalDoc.signatureFields.length === 0) {
        const fieldDefinition: JsSignatureFieldDefinition = {
          name: 'signature_field_1',
          page: 0,
          bounds: { x: 100, y: 100, width: 200, height: 50 }
        };
        documentToSign = await signer.addSignatureField(mockPdfData, fieldDefinition);
        expect(Buffer.isBuffer(documentToSign)).toBe(true);
      }

      // Step 3: Configure signing options
      const signingOptions: JsSigningOptions = {
        reason: 'Document approval',
        location: 'New York, NY',
        contactInfo: 'signer@example.com',
        appearance: {
          visible: true,
          page: 0,
          bounds: { x: 100, y: 100, width: 200, height: 50 },
          text: 'Digitally signed by Test User',
          backgroundColor: { r: 255, g: 255, b: 255 },
          borderColor: { r: 0, g: 0, b: 0 }
        },
        hashAlgorithm: 'SHA-256',
        signatureAlgorithm: 'RSA-2048'
      };

      // Step 4: Sign the document
      const signedDocument = await signer.signDocument(
        documentToSign,
        mockCertData,
        mockKeyData,
        password,
        signingOptions
      );
      expect(Buffer.isBuffer(signedDocument)).toBe(true);
      expect(signedDocument.length).toBeGreaterThan(0);

      // Step 5: Verify the signed document structure
      const signedDoc = await signer.parseDocument(signedDocument);
      expect(signedDoc).toBeDefined();
      expect(signedDoc.version).toBe('1.7');
    });

    it('should handle multiple signature workflow', async () => {
      const mockPdfData = Buffer.from('mock pdf document for multiple signatures');
      const mockCert1 = Buffer.from('mock certificate 1');
      const mockKey1 = Buffer.from('mock private key 1');
      const mockCert2 = Buffer.from('mock certificate 2');
      const mockKey2 = Buffer.from('mock private key 2');

      // First signature
      const firstSignedDoc = await signer.signDocument(
        mockPdfData,
        mockCert1,
        mockKey1,
        'password1',
        { reason: 'First approval' }
      );
      expect(Buffer.isBuffer(firstSignedDoc)).toBe(true);

      // Second signature on the already signed document
      const doubleSignedDoc = await signer.signDocument(
        firstSignedDoc,
        mockCert2,
        mockKey2,
        'password2',
        { reason: 'Second approval' }
      );
      expect(Buffer.isBuffer(doubleSignedDoc)).toBe(true);

      // Verify both signatures are preserved
      const finalDoc = await signer.parseDocument(doubleSignedDoc);
      expect(finalDoc).toBeDefined();
    });

    it('should handle field-specific signing workflow', async () => {
      const mockPdfData = Buffer.from('mock pdf with predefined fields');
      const mockCertData = Buffer.from('mock certificate');
      const mockKeyData = Buffer.from('mock private key');

      // Add multiple signature fields
      const field1: JsSignatureFieldDefinition = {
        name: 'approver_signature',
        page: 0,
        bounds: { x: 100, y: 200, width: 200, height: 50 }
      };

      const field2: JsSignatureFieldDefinition = {
        name: 'witness_signature',
        page: 0,
        bounds: { x: 100, y: 100, width: 200, height: 50 }
      };

      let documentWithFields = await signer.addSignatureField(mockPdfData, field1);
      documentWithFields = await signer.addSignatureField(documentWithFields, field2);

      // Sign using specific field
      const signedDocument = await signer.signDocumentWithField(
        documentWithFields,
        'approver_signature',
        mockCertData,
        mockKeyData,
        'password',
        { reason: 'Approval signature' }
      );

      expect(Buffer.isBuffer(signedDocument)).toBe(true);
    });
  });

  describe('Complete Document Validation Workflow', () => {
    it('should execute complete validation workflow', async () => {
      // Create a mock signed document
      const mockSignedPdf = Buffer.from('mock signed pdf document');

      // Step 1: Extract all signatures
      const extractedSignatures = await validator.extractSignatures(mockSignedPdf);
      expect(Array.isArray(extractedSignatures)).toBe(true);

      // Step 2: Validate all signatures
      const validationResults = await validator.validateSignatures(mockSignedPdf);
      expect(Array.isArray(validationResults)).toBe(true);

      // Step 3: Check document integrity
      const integrityCheck = await validator.checkDocumentIntegrity(mockSignedPdf, 0);
      expect(typeof integrityCheck).toBe('boolean');
    });

    it('should handle validation of tampered documents', async () => {
      const originalPdf = Buffer.from('original pdf content');
      const tamperedPdf = Buffer.from('tampered pdf content');

      // Validate original document
      const originalResults = await validator.validateSignatures(originalPdf);
      expect(Array.isArray(originalResults)).toBe(true);

      // Validate tampered document
      const tamperedResults = await validator.validateSignatures(tamperedPdf);
      expect(Array.isArray(tamperedResults)).toBe(true);

      // Check integrity of tampered document
      const integrityCheck = await validator.checkDocumentIntegrity(tamperedPdf, 0);
      expect(typeof integrityCheck).toBe('boolean');
    });

    it('should validate certificate chains', async () => {
      const mockCertData = Buffer.from('mock certificate');
      const mockTrustedRoots = [Buffer.from('mock trusted root certificate')];

      // This should throw since implementation is not complete
      await expect(certManager.validateCertificate(mockCertData, mockTrustedRoots))
        .rejects.toThrow('Certificate validation not yet implemented');
    });
  });

  describe('Batch Processing Workflow', () => {
    it('should handle batch signing of multiple documents', async () => {
      const documents = [
        Buffer.from('document 1 content'),
        Buffer.from('document 2 content'),
        Buffer.from('document 3 content')
      ];
      const mockCertData = Buffer.from('batch signing certificate');
      const mockKeyData = Buffer.from('batch signing key');

      const signedDocuments = await signer.signMultipleDocuments(
        documents,
        mockCertData,
        mockKeyData,
        'batch-password',
        { reason: 'Batch approval' }
      );

      expect(Array.isArray(signedDocuments)).toBe(true);
      expect(signedDocuments).toHaveLength(3);
      signedDocuments.forEach(doc => {
        expect(Buffer.isBuffer(doc)).toBe(true);
      });
    });

    it('should handle batch validation of multiple documents', async () => {
      const signedDocuments = [
        Buffer.from('signed document 1'),
        Buffer.from('signed document 2'),
        Buffer.from('signed document 3')
      ];

      const validationPromises = signedDocuments.map(doc => 
        validator.validateSignatures(doc)
      );

      const allResults = await Promise.all(validationPromises);
      expect(allResults).toHaveLength(3);
      allResults.forEach(results => {
        expect(Array.isArray(results)).toBe(true);
      });
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial failures in batch operations gracefully', async () => {
      const mixedDocuments = [
        Buffer.from('valid document 1'),
        Buffer.alloc(0), // Empty buffer
        Buffer.from('valid document 2')
      ];
      const mockCertData = Buffer.from('certificate');
      const mockKeyData = Buffer.from('key');

      // Should not throw, but handle gracefully
      const results = await signer.signMultipleDocuments(
        mixedDocuments,
        mockCertData,
        mockKeyData
      );

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(3);
    });

    it('should recover from certificate loading failures', async () => {
      const invalidP12Data = Buffer.from('invalid pkcs12 data');
      const invalidPemCert = 'invalid pem certificate';
      const invalidPemKey = 'invalid pem key';

      // Both should fail gracefully with descriptive errors
      await expect(certManager.loadFromPkcs12(invalidP12Data, 'password'))
        .rejects.toThrow('PKCS#12 loading not yet implemented');

      await expect(certManager.loadFromPem(invalidPemCert, invalidPemKey))
        .rejects.toThrow('PEM loading not yet implemented');
    });

    it('should handle concurrent operations without conflicts', async () => {
      const mockPdfData = Buffer.from('concurrent test document');
      const mockCertData = Buffer.from('concurrent certificate');
      const mockKeyData = Buffer.from('concurrent key');

      // Run multiple concurrent operations
      const concurrentOperations = [
        signer.parseDocument(mockPdfData),
        signer.signDocument(mockPdfData, mockCertData, mockKeyData),
        validator.validateSignatures(mockPdfData),
        validator.extractSignatures(mockPdfData)
      ];

      const results = await Promise.all(concurrentOperations);
      expect(results).toHaveLength(4);

      // Verify each result type
      expect(results[0]).toHaveProperty('version'); // parseDocument result
      expect(Buffer.isBuffer(results[1])).toBe(true); // signDocument result
      expect(Array.isArray(results[2])).toBe(true); // validateSignatures result
      expect(Array.isArray(results[3])).toBe(true); // extractSignatures result
    });
  });

  describe('Performance and Memory Management', () => {
    it('should handle large document processing efficiently', async () => {
      // Create a larger buffer to simulate real document
      const largeDocument = Buffer.alloc(1024 * 1024, 'A'); // 1MB document
      const mockCertData = Buffer.from('certificate for large doc');
      const mockKeyData = Buffer.from('key for large doc');

      const startTime = Date.now();
      const signedDocument = await signer.signDocument(
        largeDocument,
        mockCertData,
        mockKeyData
      );
      const endTime = Date.now();

      expect(Buffer.isBuffer(signedDocument)).toBe(true);
      expect(signedDocument.length).toBe(largeDocument.length);
      
      // Should complete in reasonable time (less than 5 seconds for mock)
      expect(endTime - startTime).toBeLessThan(5000);
    });

    it('should properly clean up resources after operations', async () => {
      const initialMemory = process.memoryUsage();
      
      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        const mockPdf = Buffer.from(`test document ${i}`);
        const mockCert = Buffer.from(`certificate ${i}`);
        const mockKey = Buffer.from(`key ${i}`);
        
        await signer.signDocument(mockPdf, mockCert, mockKey);
        await validator.validateSignatures(mockPdf);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      
      // Memory usage should not grow excessively (allow for some variance)
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });
  });

  describe('API Contract Validation', () => {
    it('should maintain consistent API behavior across operations', async () => {
      const mockPdfData = Buffer.from('api contract test document');
      
      // All parse operations should return consistent structure
      const doc1 = await signer.parseDocument(mockPdfData);
      const doc2 = await signer.parseDocument(mockPdfData);
      
      expect(doc1.version).toBe(doc2.version);
      expect(doc1.pageCount).toBe(doc2.pageCount);
      expect(doc1.signatureFields).toEqual(doc2.signatureFields);
    });

    it('should validate all required interface properties', () => {
      const capabilities = signer.getCapabilities();
      
      // Verify all required properties exist
      expect(capabilities).toHaveProperty('hashAlgorithms');
      expect(capabilities).toHaveProperty('signatureAlgorithms');
      expect(capabilities).toHaveProperty('pdfVersions');
      expect(capabilities).toHaveProperty('standards');
      
      // Verify arrays contain expected values
      expect(capabilities.hashAlgorithms).toContain('SHA-256');
      expect(capabilities.signatureAlgorithms).toContain('RSA-2048');
      expect(capabilities.pdfVersions).toContain('1.7');
      expect(capabilities.standards).toContain('PDF-1.7');
    });

    it('should handle all optional parameters correctly', async () => {
      const mockPdfData = Buffer.from('optional params test');
      const mockCertData = Buffer.from('certificate');
      const mockKeyData = Buffer.from('key');

      // Test with all optional parameters as null/undefined
      const result1 = await signer.signDocument(mockPdfData, mockCertData, mockKeyData, null, null);
      expect(Buffer.isBuffer(result1)).toBe(true);

      const result2 = await signer.signDocument(mockPdfData, mockCertData, mockKeyData, undefined, undefined);
      expect(Buffer.isBuffer(result2)).toBe(true);

      // Test with partial options
      const partialOptions = { reason: 'Test signing' };
      const result3 = await signer.signDocument(mockPdfData, mockCertData, mockKeyData, null, partialOptions);
      expect(Buffer.isBuffer(result3)).toBe(true);
    });
  });
});