/**
 * Property-based tests for automatic signature field creation functionality
 * Feature: pdf-digital-signature, Property 15: Automatic Signature Field Creation
 * Validates: Requirements 4.4
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

// Mock PDF parser since we're testing the Rust implementation through TypeScript bindings
// In a real implementation, this would import the actual NAPI bindings
interface SignatureField {
  name: string;
  page: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  appearance?: {
    visible: boolean;
    page?: number;
    bounds?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    text?: string;
    image?: Uint8Array;
    backgroundColor?: { r: number; g: number; b: number };
    borderColor?: { r: number; g: number; b: number };
  };
  isSigned: boolean;
}

interface SignatureFieldDefinition {
  name: string;
  page: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  appearance?: {
    visible: boolean;
    page?: number;
    bounds?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    text?: string;
    image?: Uint8Array;
    backgroundColor?: { r: number; g: number; b: number };
    borderColor?: { r: number; g: number; b: number };
  };
}

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
  existingSignatures: any[];
  data: Uint8Array;
}

interface PdfParser {
  parseDocument(pdfData: Uint8Array): Promise<PdfDocument>;
  addSignatureField(document: PdfDocument, field: SignatureFieldDefinition): Promise<PdfDocument>;
  createDefaultSignatureField(document: PdfDocument): SignatureFieldDefinition;
  autoPositionSignatureField(document: PdfDocument, fieldName: string, page: number): SignatureFieldDefinition;
  createMultipleSignatureFields(document: PdfDocument, fieldNames: string[], preferredPage?: number): SignatureFieldDefinition[];
  generateUniqueFieldName(document: PdfDocument, baseName: string): string;
  suggestFieldSize(document: PdfDocument, page: number): { width: number; height: number };
}

// Mock implementation for testing signature field creation
class MockPdfParser implements PdfParser {
  async parseDocument(pdfData: Uint8Array): Promise<PdfDocument> {
    // Validate PDF header
    if (pdfData.length < 8) {
      throw new Error('File too small to be a valid PDF');
    }

    const header = new TextDecoder().decode(pdfData.slice(0, 8));
    if (!header.startsWith('%PDF-')) {
      throw new Error('Invalid PDF header signature');
    }

    const version = header.slice(5).trim();
    const validVersions = ['1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0'];
    
    if (!validVersions.includes(version)) {
      throw new Error(`Unsupported PDF version: ${version}`);
    }

    return {
      version,
      pageCount: Math.max(1, Math.floor(pdfData.length / 1000)), // Mock page count
      metadata: {
        title: 'Test Document',
        creator: 'Test Creator',
      },
      signatureFields: [], // Start with no signature fields
      existingSignatures: [],
      data: pdfData,
    };
  }

  async addSignatureField(document: PdfDocument, field: SignatureFieldDefinition): Promise<PdfDocument> {
    // Validate field definition
    this.validateSignatureFieldDefinition(field);
    
    // Check if field name already exists
    if (document.signatureFields.some(f => f.name === field.name)) {
      throw new Error(`Signature field with name '${field.name}' already exists`);
    }
    
    // Validate page number
    if (field.page >= document.pageCount) {
      throw new Error(`Page ${field.page} does not exist (document has ${document.pageCount} pages)`);
    }
    
    // Create new signature field
    const signatureField: SignatureField = {
      name: field.name,
      page: field.page,
      bounds: field.bounds,
      appearance: field.appearance,
      isSigned: false,
    };
    
    // Return new document with added field
    return {
      ...document,
      signatureFields: [...document.signatureFields, signatureField],
    };
  }

  createDefaultSignatureField(document: PdfDocument): SignatureFieldDefinition {
    // Check if document already has signature fields
    if (document.signatureFields.length > 0) {
      throw new Error('Document already contains signature fields');
    }
    
    // Create a default signature field on the last page
    const page = document.pageCount > 0 ? document.pageCount - 1 : 0;
    
    // Position signature field in bottom-right corner
    const bounds = {
      x: 400,  // 400 points from left
      y: 50,   // 50 points from bottom
      width: 150,  // 150 points wide
      height: 50,  // 50 points tall
    };
    
    // Create default appearance
    const appearance = {
      visible: true,
      page,
      bounds,
      text: 'Digitally signed',
      backgroundColor: { r: 240, g: 240, b: 240 }, // Light gray
      borderColor: { r: 0, g: 0, b: 0 }, // Black border
    };
    
    return {
      name: 'Signature1',
      page,
      bounds,
      appearance,
    };
  }

  autoPositionSignatureField(document: PdfDocument, fieldName: string, page: number): SignatureFieldDefinition {
    // Validate page number
    if (page >= document.pageCount) {
      throw new Error(`Page ${page} does not exist`);
    }
    
    // Get existing fields on the specified page
    const existingFieldsOnPage = document.signatureFields.filter(f => f.page === page);
    
    // Standard signature field size
    const fieldWidth = 150;
    const fieldHeight = 50;
    const margin = 10;
    
    // Try different positions (bottom-right, bottom-left, top-right, top-left)
    const positions = [
      { x: 400, y: 50 },   // Bottom-right
      { x: 50, y: 50 },    // Bottom-left  
      { x: 400, y: 700 },  // Top-right
      { x: 50, y: 700 },   // Top-left
    ];
    
    for (const pos of positions) {
      const candidateBounds = {
        x: pos.x,
        y: pos.y,
        width: fieldWidth,
        height: fieldHeight,
      };
      
      // Check if this position overlaps with existing fields
      const overlaps = existingFieldsOnPage.some(field => 
        this.rectanglesOverlap(candidateBounds, field.bounds)
      );
      
      if (!overlaps) {
        const appearance = {
          visible: true,
          page,
          bounds: candidateBounds,
          text: 'Digitally signed',
          backgroundColor: { r: 240, g: 240, b: 240 },
          borderColor: { r: 0, g: 0, b: 0 },
        };
        
        return {
          name: fieldName,
          page,
          bounds: candidateBounds,
          appearance,
        };
      }
    }
    
    // If all standard positions are taken, place field at bottom with offset
    const yOffset = existingFieldsOnPage.length * (fieldHeight + margin);
    const bounds = {
      x: 50,
      y: 50 + yOffset,
      width: fieldWidth,
      height: fieldHeight,
    };
    
    const appearance = {
      visible: true,
      page,
      bounds,
      text: 'Digitally signed',
      backgroundColor: { r: 240, g: 240, b: 240 },
      borderColor: { r: 0, g: 0, b: 0 },
    };
    
    return {
      name: fieldName,
      page,
      bounds,
      appearance,
    };
  }

  createMultipleSignatureFields(document: PdfDocument, fieldNames: string[], preferredPage?: number): SignatureFieldDefinition[] {
    const fieldDefinitions: SignatureFieldDefinition[] = [];
    let workingDocument = { ...document };
    
    // Determine which page to use
    const targetPage = preferredPage !== undefined ? preferredPage : 
      (document.pageCount > 0 ? document.pageCount - 1 : 0);
    
    // Validate page number
    if (targetPage >= document.pageCount) {
      throw new Error(`Page ${targetPage} does not exist (document has ${document.pageCount} pages)`);
    }
    
    for (const fieldName of fieldNames) {
      // Validate field name uniqueness
      if (workingDocument.signatureFields.some(f => f.name === fieldName)) {
        throw new Error(`Signature field with name '${fieldName}' already exists`);
      }
      
      // Create field definition with auto-positioning
      const fieldDef = this.autoPositionSignatureField(workingDocument, fieldName, targetPage);
      
      // Add the field to working document for next iteration
      const signatureField: SignatureField = {
        name: fieldDef.name,
        page: fieldDef.page,
        bounds: fieldDef.bounds,
        appearance: fieldDef.appearance,
        isSigned: false,
      };
      workingDocument.signatureFields.push(signatureField);
      
      fieldDefinitions.push(fieldDef);
    }
    
    return fieldDefinitions;
  }

  generateUniqueFieldName(document: PdfDocument, baseName: string): string {
    const existingNames = new Set(document.signatureFields.map(f => f.name));
    
    // Try base name first
    if (!existingNames.has(baseName)) {
      return baseName;
    }
    
    // Try numbered variations
    for (let i = 1; i <= 1000; i++) {
      const candidate = `${baseName}${i}`;
      if (!existingNames.has(candidate)) {
        return candidate;
      }
    }
    
    // Fallback with timestamp
    const timestamp = Date.now();
    return `${baseName}_${timestamp}`;
  }

  suggestFieldSize(document: PdfDocument, page: number): { width: number; height: number } {
    // Validate page number
    if (page >= document.pageCount) {
      throw new Error(`Page ${page} does not exist`);
    }
    
    // Standard PDF page sizes (in points)
    // A4: 595 x 842 points
    const pageWidth = 595;
    
    // Signature should be about 25% of page width, max 200 points
    const suggestedWidth = Math.min(Math.max(pageWidth * 0.25, 100), 200);
    
    // Height should maintain reasonable aspect ratio (3:1 to 4:1)
    const suggestedHeight = Math.min(Math.max(suggestedWidth / 3.5, 30), 80);
    
    return {
      width: suggestedWidth,
      height: suggestedHeight,
    };
  }

  private validateSignatureFieldDefinition(field: SignatureFieldDefinition): void {
    // Validate field name
    if (!field.name || field.name.trim().length === 0) {
      throw new Error('Signature field name cannot be empty');
    }
    
    // Validate field name characters (PDF names have restrictions)
    if (!/^[a-zA-Z0-9_-]+$/.test(field.name)) {
      throw new Error('Signature field name contains invalid characters');
    }
    
    // Validate bounds
    if (field.bounds.width <= 0 || field.bounds.height <= 0) {
      throw new Error('Signature field bounds must have positive width and height');
    }
    
    if (field.bounds.x < 0 || field.bounds.y < 0) {
      throw new Error('Signature field bounds cannot have negative coordinates');
    }
  }

  private rectanglesOverlap(rect1: { x: number; y: number; width: number; height: number }, 
                           rect2: { x: number; y: number; width: number; height: number }): boolean {
    const r1Right = rect1.x + rect1.width;
    const r1Top = rect1.y + rect1.height;
    const r2Right = rect2.x + rect2.width;
    const r2Top = rect2.y + rect2.height;
    
    return !(rect1.x >= r2Right || rect2.x >= r1Right || rect1.y >= r2Top || rect2.y >= r1Top);
  }
}

// Generators for property-based testing
const validPdfVersionArbitrary = fc.constantFrom('1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '2.0');

const validFieldNameArbitrary = fc.string({ minLength: 1, maxLength: 30 })
  .filter(s => /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(s));

const pdfDocumentArbitrary = fc.tuple(
  validPdfVersionArbitrary,
  fc.integer({ min: 1, max: 10 }), // page count
  fc.array(validFieldNameArbitrary, { maxLength: 3 }) // existing fields
).map(([version, pageCount, existingFieldNames]) => {
  const header = `%PDF-${version}\n`;
  const content = header + 'mock pdf content';
  const encoder = new TextEncoder();
  
  // Create existing signature fields
  const existingFields: SignatureField[] = existingFieldNames.map((name, index) => ({
    name,
    page: index % pageCount,
    bounds: {
      x: 100 + index * 20,
      y: 100 + index * 20,
      width: 150,
      height: 50,
    },
    isSigned: false,
  }));
  
  return {
    version,
    pageCount,
    metadata: { title: 'Test Document' },
    signatureFields: existingFields,
    existingSignatures: [],
    data: encoder.encode(content),
  };
});

const emptyPdfDocumentArbitrary = fc.tuple(
  validPdfVersionArbitrary,
  fc.integer({ min: 1, max: 5 }) // page count
).map(([version, pageCount]) => {
  const header = `%PDF-${version}\n`;
  const content = header + 'mock pdf content';
  const encoder = new TextEncoder();
  
  return {
    version,
    pageCount,
    metadata: { title: 'Test Document' },
    signatureFields: [],
    existingSignatures: [],
    data: encoder.encode(content),
  };
});

describe('Signature Field Creation Properties', () => {
  const parser = new MockPdfParser();

  describe('Property 15: Automatic Signature Field Creation', () => {
    it('should create default signature field when document has no existing fields', async () => {
      await fc.assert(
        fc.asyncProperty(emptyPdfDocumentArbitrary, async (document) => {
          const fieldDef = parser.createDefaultSignatureField(document);
          
          // Property: Default field should have valid properties
          expect(fieldDef.name).toBeTruthy();
          expect(typeof fieldDef.name).toBe('string');
          expect(fieldDef.name.length).toBeGreaterThan(0);
          
          // Property: Field should be positioned on a valid page
          expect(fieldDef.page).toBeGreaterThanOrEqual(0);
          expect(fieldDef.page).toBeLessThan(document.pageCount);
          
          // Property: Field should have positive dimensions
          expect(fieldDef.bounds.width).toBeGreaterThan(0);
          expect(fieldDef.bounds.height).toBeGreaterThan(0);
          expect(fieldDef.bounds.x).toBeGreaterThanOrEqual(0);
          expect(fieldDef.bounds.y).toBeGreaterThanOrEqual(0);
          
          // Property: Field should have appearance configuration
          expect(fieldDef.appearance).toBeDefined();
          expect(fieldDef.appearance?.visible).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject creating default field when document already has fields', async () => {
      await fc.assert(
        fc.asyncProperty(pdfDocumentArbitrary, async (document) => {
          // Skip documents that have no existing fields
          if (document.signatureFields.length === 0) return;
          
          // Property: Should throw error when document already has fields
          expect(() => parser.createDefaultSignatureField(document)).toThrow();
        }),
        { numRuns: 50 }
      );
    });

    it('should auto-position signature fields to avoid overlaps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(pdfDocumentArbitrary, validFieldNameArbitrary, fc.integer({ min: 0, max: 4 })),
          async ([document, fieldName, pageIndex]) => {
            const targetPage = pageIndex % document.pageCount;
            
            // Skip if field name already exists
            if (document.signatureFields.some(f => f.name === fieldName)) return;
            
            const fieldDef = parser.autoPositionSignatureField(document, fieldName, targetPage);
            
            // Property: Field should be positioned on the correct page
            expect(fieldDef.page).toBe(targetPage);
            expect(fieldDef.name).toBe(fieldName);
            
            // Property: Field should not overlap with existing fields on same page
            const existingFieldsOnPage = document.signatureFields.filter(f => f.page === targetPage);
            for (const existingField of existingFieldsOnPage) {
              const overlaps = parser['rectanglesOverlap'](fieldDef.bounds, existingField.bounds);
              expect(overlaps).toBe(false);
            }
            
            // Property: Field should have valid bounds
            expect(fieldDef.bounds.width).toBeGreaterThan(0);
            expect(fieldDef.bounds.height).toBeGreaterThan(0);
            expect(fieldDef.bounds.x).toBeGreaterThanOrEqual(0);
            expect(fieldDef.bounds.y).toBeGreaterThanOrEqual(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should create multiple signature fields without overlaps', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            emptyPdfDocumentArbitrary,
            fc.array(validFieldNameArbitrary, { minLength: 1, maxLength: 5 }).filter(names => 
              new Set(names).size === names.length // Ensure unique names
            )
          ),
          async ([document, fieldNames]) => {
            const fieldDefs = parser.createMultipleSignatureFields(document, fieldNames);
            
            // Property: Should create exactly the requested number of fields
            expect(fieldDefs.length).toBe(fieldNames.length);
            
            // Property: All field names should match requested names
            const createdNames = fieldDefs.map(f => f.name).sort();
            const expectedNames = fieldNames.sort();
            expect(createdNames).toEqual(expectedNames);
            
            // Property: No two fields should overlap
            for (let i = 0; i < fieldDefs.length; i++) {
              for (let j = i + 1; j < fieldDefs.length; j++) {
                const field1 = fieldDefs[i];
                const field2 = fieldDefs[j];
                
                // Only check overlap if on same page
                if (field1.page === field2.page) {
                  const overlaps = parser['rectanglesOverlap'](field1.bounds, field2.bounds);
                  expect(overlaps).toBe(false);
                }
              }
            }
            
            // Property: All fields should have valid properties
            fieldDefs.forEach(field => {
              expect(field.name).toBeTruthy();
              expect(field.bounds.width).toBeGreaterThan(0);
              expect(field.bounds.height).toBeGreaterThan(0);
              expect(field.bounds.x).toBeGreaterThanOrEqual(0);
              expect(field.bounds.y).toBeGreaterThanOrEqual(0);
            });
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate unique field names when conflicts exist', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(pdfDocumentArbitrary, fc.string({ minLength: 1, maxLength: 20 })),
          async ([document, baseName]) => {
            const uniqueName = parser.generateUniqueFieldName(document, baseName);
            
            // Property: Generated name should not conflict with existing names
            const existingNames = document.signatureFields.map(f => f.name);
            expect(existingNames).not.toContain(uniqueName);
            
            // Property: Generated name should be non-empty
            expect(uniqueName).toBeTruthy();
            expect(uniqueName.length).toBeGreaterThan(0);
            
            // Property: If base name is available, it should be returned
            if (!existingNames.includes(baseName)) {
              expect(uniqueName).toBe(baseName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should suggest reasonable field sizes for any page', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(pdfDocumentArbitrary, fc.integer({ min: 0, max: 4 })),
          async ([document, pageIndex]) => {
            const targetPage = pageIndex % document.pageCount;
            const suggestedSize = parser.suggestFieldSize(document, targetPage);
            
            // Property: Suggested size should be reasonable
            expect(suggestedSize.width).toBeGreaterThan(50);
            expect(suggestedSize.width).toBeLessThan(300);
            expect(suggestedSize.height).toBeGreaterThan(20);
            expect(suggestedSize.height).toBeLessThan(150);
            
            // Property: Aspect ratio should be reasonable (width > height)
            expect(suggestedSize.width).toBeGreaterThan(suggestedSize.height);
            
            // Property: Aspect ratio should be between 2:1 and 5:1
            const aspectRatio = suggestedSize.width / suggestedSize.height;
            expect(aspectRatio).toBeGreaterThan(2);
            expect(aspectRatio).toBeLessThan(5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate field definitions and reject invalid ones', async () => {
      const invalidFieldDefinitions = [
        // Empty name
        { name: '', page: 0, bounds: { x: 0, y: 0, width: 100, height: 50 } },
        // Invalid characters in name
        { name: 'field with spaces', page: 0, bounds: { x: 0, y: 0, width: 100, height: 50 } },
        // Negative coordinates
        { name: 'ValidName', page: 0, bounds: { x: -10, y: 0, width: 100, height: 50 } },
        // Zero or negative dimensions
        { name: 'ValidName', page: 0, bounds: { x: 0, y: 0, width: 0, height: 50 } },
        { name: 'ValidName', page: 0, bounds: { x: 0, y: 0, width: 100, height: -10 } },
      ];

      await fc.assert(
        fc.asyncProperty(
          fc.tuple(emptyPdfDocumentArbitrary, fc.constantFrom(...invalidFieldDefinitions)),
          async ([document, invalidField]) => {
            // Property: Invalid field definitions should be rejected
            await expect(parser.addSignatureField(document, invalidField)).rejects.toThrow();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should handle edge cases in field positioning gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            emptyPdfDocumentArbitrary,
            fc.array(validFieldNameArbitrary, { minLength: 10, maxLength: 20 }).filter(names => 
              new Set(names).size === names.length // Ensure unique names
            )
          ),
          async ([document, manyFieldNames]) => {
            // Try to create many fields on the same page
            const targetPage = 0;
            const fieldDefs = parser.createMultipleSignatureFields(document, manyFieldNames, targetPage);
            
            // Property: Should create all requested fields even when space is limited
            expect(fieldDefs.length).toBe(manyFieldNames.length);
            
            // Property: All fields should be on the target page
            fieldDefs.forEach(field => {
              expect(field.page).toBe(targetPage);
            });
            
            // Property: Fields should have reasonable positioning even when crowded
            fieldDefs.forEach(field => {
              expect(field.bounds.x).toBeGreaterThanOrEqual(0);
              expect(field.bounds.y).toBeGreaterThanOrEqual(0);
              expect(field.bounds.x + field.bounds.width).toBeLessThan(1000); // Reasonable page width
              expect(field.bounds.y + field.bounds.height).toBeLessThan(2000); // Allow stacking
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should maintain field creation consistency across multiple calls', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(emptyPdfDocumentArbitrary, validFieldNameArbitrary),
          async ([document, fieldName]) => {
            const field1 = parser.autoPositionSignatureField(document, fieldName, 0);
            const field2 = parser.autoPositionSignatureField(document, fieldName, 0);
            const field3 = parser.autoPositionSignatureField(document, fieldName, 0);
            
            // Property: Field positioning should be deterministic
            expect(field1).toEqual(field2);
            expect(field2).toEqual(field3);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});