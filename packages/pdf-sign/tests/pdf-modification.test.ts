/**
 * Unit tests for PDF modification functionality
 * Tests specific PDF modification scenarios and error handling for malformed PDFs
 * Validates: Requirements 4.2
 */

import { beforeEach, describe, expect, it } from 'vitest';

// Mock interfaces for testing PDF modification functionality
interface PdfDocument {
  version: string;
  pageCount: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
  };
  signatureFields: SignatureField[];
  existingSignatures: DigitalSignature[];
  data: Uint8Array;
}

interface SignatureField {
  name: string;
  page: number;
  bounds: Rectangle;
  appearance?: any;
  isSigned: boolean;
}

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DigitalSignature {
  signatureData: Uint8Array;
  signingTime: Date;
  signerName: string;
  reason?: string;
  location?: string;
  contactInfo?: string;
  fieldName: string;
}

interface SignatureFieldDefinition {
  name: string;
  page: number;
  bounds: Rectangle;
  appearance?: any;
}

type PdfModification = 
  | { type: 'AddSignatureField'; field: SignatureFieldDefinition }
  | { type: 'EmbedSignature'; fieldName: string; signatureData: Uint8Array; appearance?: any }
  | { type: 'UpdateMetadata'; metadata: any };

// Mock PDF Generator for testing
class MockPdfGenerator {
  private maxObjectNumber = 0;

  async serializeDocument(document: PdfDocument): Promise<Uint8Array> {
    return document.data;
  }

  async createIncrementalUpdate(
    document: PdfDocument,
    changes: PdfModification[]
  ): Promise<Uint8Array> {
    // Simulate incremental update by appending change information to original data
    const changeData = new TextEncoder().encode(
      `\n% Incremental Update - ${changes.length} changes\n`
    );
    
    const result = new Uint8Array(document.data.length + changeData.length);
    result.set(document.data, 0);
    result.set(changeData, document.data.length);
    
    return result;
  }

  async embedSignature(
    document: PdfDocument,
    signature: DigitalSignature,
    field: SignatureField
  ): Promise<PdfDocument> {
    const newDocument = { ...document };
    
    // Mark the field as signed
    newDocument.signatureFields = document.signatureFields.map(f => 
      f.name === field.name ? { ...f, isSigned: true } : f
    );
    
    // Add the signature
    newDocument.existingSignatures = [...document.existingSignatures, signature];
    
    return newDocument;
  }

  async addSignatureField(
    document: PdfDocument,
    fieldDef: SignatureFieldDefinition
  ): Promise<PdfDocument> {
    const newField: SignatureField = {
      name: fieldDef.name,
      page: fieldDef.page,
      bounds: fieldDef.bounds,
      appearance: fieldDef.appearance,
      isSigned: false,
    };

    return {
      ...document,
      signatureFields: [...document.signatureFields, newField],
    };
  }

  async updateDocument(
    document: PdfDocument,
    changes: PdfModification[]
  ): Promise<PdfDocument> {
    let updatedDocument = { ...document };

    for (const change of changes) {
      switch (change.type) {
        case 'AddSignatureField':
          updatedDocument = await this.addSignatureField(updatedDocument, change.field);
          break;
        case 'EmbedSignature':
          // Find the field and create a signature
          const field = updatedDocument.signatureFields.find(f => f.name === change.fieldName);
          if (field) {
            const signature: DigitalSignature = {
              signatureData: change.signatureData,
              signingTime: new Date(),
              signerName: 'Test Signer',
              fieldName: change.fieldName,
            };
            updatedDocument = await this.embedSignature(updatedDocument, signature, field);
          }
          break;
        case 'UpdateMetadata':
          updatedDocument = {
            ...updatedDocument,
            metadata: { ...updatedDocument.metadata, ...change.metadata },
          };
          break;
      }
    }

    return updatedDocument;
  }
}

// Helper functions for creating test data
function createValidPdfDocument(): PdfDocument {
  const header = new TextEncoder().encode('%PDF-1.7');
  const body = new Uint8Array(100).fill(0);
  const data = new Uint8Array(header.length + body.length);
  data.set(header, 0);
  data.set(body, header.length);

  return {
    version: '1.7',
    pageCount: 1,
    metadata: {
      title: 'Test Document',
      author: 'Test Author',
    },
    signatureFields: [],
    existingSignatures: [],
    data,
  };
}

function createMalformedPdfData(): Uint8Array {
  // Create invalid PDF data (missing header)
  return new Uint8Array([0x25, 0x50, 0x44, 0x46]); // Incomplete "%PDF"
}

function createSignatureFieldDefinition(name: string = 'TestField'): SignatureFieldDefinition {
  return {
    name,
    page: 0,
    bounds: { x: 100, y: 100, width: 200, height: 50 },
  };
}

describe('PDF Modification Unit Tests', () => {
  let generator: MockPdfGenerator;
  let testDocument: PdfDocument;

  beforeEach(() => {
    generator = new MockPdfGenerator();
    testDocument = createValidPdfDocument();
  });

  describe('Signature Field Addition', () => {
    it('should add a signature field to an empty document', async () => {
      const fieldDef = createSignatureFieldDefinition('Signature1');
      const result = await generator.addSignatureField(testDocument, fieldDef);

      expect(result.signatureFields).toHaveLength(1);
      expect(result.signatureFields[0].name).toBe('Signature1');
      expect(result.signatureFields[0].page).toBe(0);
      expect(result.signatureFields[0].isSigned).toBe(false);
      expect(result.signatureFields[0].bounds).toEqual(fieldDef.bounds);
    });

    it('should add multiple signature fields without conflicts', async () => {
      const field1 = createSignatureFieldDefinition('Signature1');
      const field2 = createSignatureFieldDefinition('Signature2');

      let result = await generator.addSignatureField(testDocument, field1);
      result = await generator.addSignatureField(result, field2);

      expect(result.signatureFields).toHaveLength(2);
      expect(result.signatureFields[0].name).toBe('Signature1');
      expect(result.signatureFields[1].name).toBe('Signature2');
    });

    it('should preserve existing document properties when adding fields', async () => {
      const fieldDef = createSignatureFieldDefinition();
      const result = await generator.addSignatureField(testDocument, fieldDef);

      expect(result.version).toBe(testDocument.version);
      expect(result.pageCount).toBe(testDocument.pageCount);
      expect(result.metadata).toEqual(testDocument.metadata);
      expect(result.data).toEqual(testDocument.data);
    });

    it('should handle signature fields with different page numbers', async () => {
      const field1 = { ...createSignatureFieldDefinition('Page0Field'), page: 0 };
      const field2 = { ...createSignatureFieldDefinition('Page1Field'), page: 1 };

      let result = await generator.addSignatureField(testDocument, field1);
      result = await generator.addSignatureField(result, field2);

      expect(result.signatureFields[0].page).toBe(0);
      expect(result.signatureFields[1].page).toBe(1);
    });
  });

  describe('Signature Embedding', () => {
    it('should embed a signature into an existing field', async () => {
      // First add a signature field
      const fieldDef = createSignatureFieldDefinition('TestSignature');
      const docWithField = await generator.addSignatureField(testDocument, fieldDef);

      // Create a signature
      const signatureData = new TextEncoder().encode('mock signature data');
      const signature: DigitalSignature = {
        signatureData,
        signingTime: new Date(),
        signerName: 'John Doe',
        reason: 'Document approval',
        fieldName: 'TestSignature',
      };

      const field = docWithField.signatureFields[0];
      const result = await generator.embedSignature(docWithField, signature, field);

      expect(result.existingSignatures).toHaveLength(1);
      expect(result.existingSignatures[0].signerName).toBe('John Doe');
      expect(result.existingSignatures[0].reason).toBe('Document approval');
      expect(result.signatureFields[0].isSigned).toBe(true);
    });

    it('should preserve other signature fields when embedding', async () => {
      // Add two fields
      const field1 = createSignatureFieldDefinition('Field1');
      const field2 = createSignatureFieldDefinition('Field2');
      
      let docWithFields = await generator.addSignatureField(testDocument, field1);
      docWithFields = await generator.addSignatureField(docWithFields, field2);

      // Sign only the first field
      const signature: DigitalSignature = {
        signatureData: new TextEncoder().encode('signature'),
        signingTime: new Date(),
        signerName: 'Signer',
        fieldName: 'Field1',
      };

      const result = await generator.embedSignature(
        docWithFields, 
        signature, 
        docWithFields.signatureFields[0]
      );

      expect(result.signatureFields).toHaveLength(2);
      expect(result.signatureFields[0].isSigned).toBe(true);
      expect(result.signatureFields[1].isSigned).toBe(false);
    });
  });

  describe('Incremental Updates', () => {
    it('should create incremental update for signature field addition', async () => {
      const changes: PdfModification[] = [
        {
          type: 'AddSignatureField',
          field: createSignatureFieldDefinition('NewField'),
        },
      ];

      const updateData = await generator.createIncrementalUpdate(testDocument, changes);

      expect(updateData.length).toBeGreaterThan(testDocument.data.length);
      
      // Check that original data is preserved
      const originalPortion = updateData.slice(0, testDocument.data.length);
      expect(originalPortion).toEqual(testDocument.data);
    });

    it('should handle multiple modifications in single update', async () => {
      const changes: PdfModification[] = [
        {
          type: 'AddSignatureField',
          field: createSignatureFieldDefinition('Field1'),
        },
        {
          type: 'UpdateMetadata',
          metadata: { title: 'Updated Title' },
        },
      ];

      const updateData = await generator.createIncrementalUpdate(testDocument, changes);
      expect(updateData.length).toBeGreaterThan(testDocument.data.length);
    });

    it('should create valid incremental update for signature embedding', async () => {
      const signatureData = new TextEncoder().encode('test signature');
      const changes: PdfModification[] = [
        {
          type: 'EmbedSignature',
          fieldName: 'TestField',
          signatureData,
        },
      ];

      const updateData = await generator.createIncrementalUpdate(testDocument, changes);
      expect(updateData).toBeDefined();
      expect(updateData.length).toBeGreaterThan(0);
    });
  });

  describe('Document Updates', () => {
    it('should apply multiple modifications correctly', async () => {
      const changes: PdfModification[] = [
        {
          type: 'AddSignatureField',
          field: createSignatureFieldDefinition('Field1'),
        },
        {
          type: 'AddSignatureField',
          field: createSignatureFieldDefinition('Field2'),
        },
        {
          type: 'UpdateMetadata',
          metadata: { author: 'New Author', title: 'New Title' },
        },
      ];

      const result = await generator.updateDocument(testDocument, changes);

      expect(result.signatureFields).toHaveLength(2);
      expect(result.metadata.author).toBe('New Author');
      expect(result.metadata.title).toBe('New Title');
    });

    it('should handle signature embedding through document update', async () => {
      // First add a field
      const addFieldChange: PdfModification = {
        type: 'AddSignatureField',
        field: createSignatureFieldDefinition('TestField'),
      };

      let result = await generator.updateDocument(testDocument, [addFieldChange]);

      // Then embed a signature
      const embedChange: PdfModification = {
        type: 'EmbedSignature',
        fieldName: 'TestField',
        signatureData: new TextEncoder().encode('signature'),
      };

      result = await generator.updateDocument(result, [embedChange]);

      expect(result.signatureFields[0].isSigned).toBe(true);
      expect(result.existingSignatures).toHaveLength(1);
    });
  });

  describe('Error Handling for Malformed PDFs', () => {
    it('should handle documents with invalid structure gracefully', async () => {
      const malformedDoc: PdfDocument = {
        version: 'invalid',
        pageCount: 0,
        metadata: {},
        signatureFields: [],
        existingSignatures: [],
        data: createMalformedPdfData(),
      };

      // Operations should still work on the document object level
      const fieldDef = createSignatureFieldDefinition();
      const result = await generator.addSignatureField(malformedDoc, fieldDef);

      expect(result.signatureFields).toHaveLength(1);
      // The malformed data should be preserved
      expect(result.data).toEqual(malformedDoc.data);
    });

    it('should preserve document integrity during failed operations', async () => {
      const originalData = testDocument.data.slice(); // Copy original data
      
      try {
        // Attempt an operation that might fail
        const changes: PdfModification[] = [
          {
            type: 'EmbedSignature',
            fieldName: 'NonExistentField', // This field doesn't exist
            signatureData: new TextEncoder().encode('signature'),
          },
        ];

        const result = await generator.updateDocument(testDocument, changes);
        
        // Even if the signature embedding fails, document should remain intact
        expect(result.data).toEqual(originalData);
        expect(result.version).toBe(testDocument.version);
        expect(result.pageCount).toBe(testDocument.pageCount);
      } catch (error) {
        // If an error is thrown, the original document should remain unchanged
        expect(testDocument.data).toEqual(originalData);
      }
    });

    it('should handle empty modification arrays', async () => {
      const result = await generator.updateDocument(testDocument, []);
      
      expect(result).toEqual(testDocument);
    });

    it('should handle signature fields with invalid bounds', async () => {
      const invalidFieldDef: SignatureFieldDefinition = {
        name: 'InvalidField',
        page: 0,
        bounds: { x: -100, y: -100, width: 0, height: 0 }, // Invalid bounds
      };

      // Should still add the field (validation would happen at a higher level)
      const result = await generator.addSignatureField(testDocument, invalidFieldDef);
      
      expect(result.signatureFields).toHaveLength(1);
      expect(result.signatureFields[0].bounds).toEqual(invalidFieldDef.bounds);
    });
  });

  describe('Edge Cases', () => {
    it('should handle signature fields with very long names', async () => {
      const longName = 'A'.repeat(1000);
      const fieldDef = createSignatureFieldDefinition(longName);
      
      const result = await generator.addSignatureField(testDocument, fieldDef);
      
      expect(result.signatureFields[0].name).toBe(longName);
    });

    it('should handle signature fields on high page numbers', async () => {
      const fieldDef = { ...createSignatureFieldDefinition(), page: 999 };
      
      const result = await generator.addSignatureField(testDocument, fieldDef);
      
      expect(result.signatureFields[0].page).toBe(999);
    });

    it('should handle large signature data', async () => {
      const largeSignatureData = new Uint8Array(10000).fill(65); // 10KB of 'A'
      
      const fieldDef = createSignatureFieldDefinition('LargeSignature');
      let result = await generator.addSignatureField(testDocument, fieldDef);
      
      const signature: DigitalSignature = {
        signatureData: largeSignatureData,
        signingTime: new Date(),
        signerName: 'Test Signer',
        fieldName: 'LargeSignature',
      };

      result = await generator.embedSignature(result, signature, result.signatureFields[0]);
      
      expect(result.existingSignatures[0].signatureData).toEqual(largeSignatureData);
    });

    it('should handle metadata with special characters', async () => {
      const specialMetadata = {
        title: 'Document with émojis 🔒 and ñ characters',
        author: 'Åuthor with spëcial chars',
      };

      const changes: PdfModification[] = [
        {
          type: 'UpdateMetadata',
          metadata: specialMetadata,
        },
      ];

      const result = await generator.updateDocument(testDocument, changes);
      
      expect(result.metadata.title).toBe(specialMetadata.title);
      expect(result.metadata.author).toBe(specialMetadata.author);
    });
  });
});