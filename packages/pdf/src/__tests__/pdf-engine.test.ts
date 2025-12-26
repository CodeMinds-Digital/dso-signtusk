import { describe, it, expect, beforeEach } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { PDFEngine } from '../pdf-engine';
import {
    PDFProcessingError,
    PDFValidationError,
    PDFCorruptionError,
    type FieldDefinition,
    type PageRange,
    type OptimizationOptions,
    type WatermarkOptions,
} from '../types';
import { createTestPDFBuffer, createInvalidPDFBuffer, createLargePDFBuffer } from './setup';

describe('PDFEngine', () => {
    let pdfEngine: PDFEngine;
    let testPDFBuffer: Buffer;

    beforeEach(() => {
        pdfEngine = new PDFEngine();
        testPDFBuffer = createTestPDFBuffer();
    });

    describe('loadPDF', () => {
        it('should load a valid PDF document', async () => {
            const document = await pdfEngine.loadPDF(testPDFBuffer);
            expect(document).toBeInstanceOf(PDFDocument);
            expect(document.getPageCount()).toBeGreaterThan(0);
        });

        it('should throw PDFProcessingError for invalid PDF', async () => {
            const invalidBuffer = createInvalidPDFBuffer();
            await expect(pdfEngine.loadPDF(invalidBuffer)).rejects.toThrow(PDFProcessingError);
        });

        it('should throw PDFValidationError for oversized files', async () => {
            const engine = new PDFEngine({ maxFileSize: 1024 }); // 1KB limit
            const largeBuffer = createLargePDFBuffer(2); // 2MB file

            await expect(engine.loadPDF(largeBuffer)).rejects.toThrow(PDFValidationError);
        });

        it('should handle encrypted PDFs based on options', async () => {
            const engine = new PDFEngine({ allowEncrypted: false });
            // Note: We'd need an actual encrypted PDF for this test
            // This is a placeholder test structure
            expect(engine).toBeDefined();
        });
    });

    describe('createField', () => {
        let document: PDFDocument;

        beforeEach(async () => {
            document = await pdfEngine.loadPDF(testPDFBuffer);
        });

        it('should create a text field', async () => {
            const fieldDef: FieldDefinition = {
                type: 'text',
                name: 'testTextField',
                page: 0,
                x: 100,
                y: 100,
                width: 200,
                height: 30,
                required: false,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            const field = await pdfEngine.createField(document, fieldDef);
            expect(field).toBeDefined();
            expect(field.getName()).toBe('testTextField');
        });

        it('should create a checkbox field', async () => {
            const fieldDef: FieldDefinition = {
                type: 'checkbox',
                name: 'testCheckbox',
                page: 0,
                x: 100,
                y: 200,
                width: 20,
                height: 20,
                required: false,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            const field = await pdfEngine.createField(document, fieldDef);
            expect(field).toBeDefined();
            expect(field.getName()).toBe('testCheckbox');
        });

        it('should create a dropdown field with options', async () => {
            const fieldDef: FieldDefinition = {
                type: 'dropdown',
                name: 'testDropdown',
                page: 0,
                x: 100,
                y: 300,
                width: 150,
                height: 25,
                required: false,
                readonly: false,
                options: ['Option 1', 'Option 2', 'Option 3'],
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            const field = await pdfEngine.createField(document, fieldDef);
            expect(field).toBeDefined();
            expect(field.getName()).toBe('testDropdown');
        });

        it('should throw error for dropdown without options', async () => {
            const fieldDef: FieldDefinition = {
                type: 'dropdown',
                name: 'invalidDropdown',
                page: 0,
                x: 100,
                y: 100,
                width: 150,
                height: 25,
                required: false,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            await expect(pdfEngine.createField(document, fieldDef)).rejects.toThrow(PDFValidationError);
        });

        it('should create a radio field with multiple options', async () => {
            const fieldDef: FieldDefinition = {
                type: 'radio',
                name: 'testRadio',
                page: 0,
                x: 100,
                y: 400,
                width: 20,
                height: 70, // Enough height for 3 options (3 * 20 + 2 * 5 = 70)
                required: false,
                readonly: false,
                options: ['Option A', 'Option B', 'Option C'],
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            const field = await pdfEngine.createField(document, fieldDef);
            expect(field).toBeDefined();
            expect(field.getName()).toBe('testRadio');
        });

        it('should create a signature field', async () => {
            const fieldDef: FieldDefinition = {
                type: 'signature',
                name: 'testSignature',
                page: 0,
                x: 100,
                y: 500,
                width: 200,
                height: 50,
                required: true,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
                placeholder: 'Sign here',
            };

            const field = await pdfEngine.createField(document, fieldDef);
            expect(field).toBeDefined();
            expect(field.getName()).toBe('testSignature');
        });

        it('should create a date field', async () => {
            const fieldDef: FieldDefinition = {
                type: 'date',
                name: 'testDate',
                page: 0,
                x: 100,
                y: 600,
                width: 150,
                height: 25,
                required: false,
                readonly: false,
                value: '2024-01-01',
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            const field = await pdfEngine.createField(document, fieldDef);
            expect(field).toBeDefined();
            expect(field.getName()).toBe('testDate');
        });

        it('should create a list field', async () => {
            const fieldDef: FieldDefinition = {
                type: 'list',
                name: 'testList',
                page: 0,
                x: 300,
                y: 300,
                width: 150,
                height: 100,
                required: false,
                readonly: false,
                options: ['Item 1', 'Item 2', 'Item 3', 'Item 4'],
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            const field = await pdfEngine.createField(document, fieldDef);
            expect(field).toBeDefined();
            expect(field.getName()).toBe('testList');
        });

        it('should validate field boundaries', async () => {
            const fieldDef: FieldDefinition = {
                type: 'text',
                name: 'boundaryTest',
                page: 0,
                x: 500, // This might exceed page width
                y: 100,
                width: 200,
                height: 30,
                required: false,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            // This should throw an error if the field exceeds page boundaries
            await expect(pdfEngine.createField(document, fieldDef)).rejects.toThrow(PDFValidationError);
        });

        it('should prevent duplicate field names', async () => {
            const fieldDef1: FieldDefinition = {
                type: 'text',
                name: 'duplicateName',
                page: 0,
                x: 100,
                y: 100,
                width: 200,
                height: 30,
                required: false,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            const fieldDef2: FieldDefinition = {
                type: 'checkbox',
                name: 'duplicateName', // Same name
                page: 0,
                x: 100,
                y: 200,
                width: 20,
                height: 20,
                required: false,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            await pdfEngine.createField(document, fieldDef1);
            await expect(pdfEngine.createField(document, fieldDef2)).rejects.toThrow(PDFValidationError);
        });

        it('should throw error for invalid page number', async () => {
            const fieldDef: FieldDefinition = {
                type: 'text',
                name: 'invalidPageField',
                page: 999,
                x: 100,
                y: 100,
                width: 200,
                height: 30,
                required: false,
                readonly: false,
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            await expect(pdfEngine.createField(document, fieldDef)).rejects.toThrow(PDFValidationError);
        });

        it('should throw error for invalid date format', async () => {
            const fieldDef: FieldDefinition = {
                type: 'date',
                name: 'invalidDate',
                page: 0,
                x: 100,
                y: 100,
                width: 150,
                height: 25,
                required: false,
                readonly: false,
                value: 'invalid-date',
                fontSize: 12,
                fontColor: '#000000',
                borderWidth: 1,
            };

            await expect(pdfEngine.createField(document, fieldDef)).rejects.toThrow(PDFValidationError);
        });

        it('should validate field definition schema', async () => {
            const invalidFieldDef = {
                type: 'invalid-type',
                name: '',
                page: -1,
                x: -10,
                y: -10,
                width: 0,
                height: 0,
                fontSize: 100,
                fontColor: 'invalid-color',
            };

            await expect(pdfEngine.createField(document, invalidFieldDef as any)).rejects.toThrow();
        });
    });

    describe('mergePDFs', () => {
        it('should merge multiple PDF documents', async () => {
            const doc1 = await pdfEngine.loadPDF(testPDFBuffer);
            const doc2 = await pdfEngine.loadPDF(testPDFBuffer);

            const mergedDoc = await pdfEngine.mergePDFs([doc1, doc2]);
            expect(mergedDoc.getPageCount()).toBe(doc1.getPageCount() + doc2.getPageCount());
        });

        it('should return single document when merging one document', async () => {
            const doc = await pdfEngine.loadPDF(testPDFBuffer);
            const mergedDoc = await pdfEngine.mergePDFs([doc]);
            expect(mergedDoc).toBe(doc);
        });

        it('should throw error when merging empty array', async () => {
            await expect(pdfEngine.mergePDFs([])).rejects.toThrow(PDFValidationError);
        });
    });

    describe('splitPDF', () => {
        let document: PDFDocument;

        beforeEach(async () => {
            // Create a document with multiple pages for testing
            document = await PDFDocument.create();
            document.addPage();
            document.addPage();
            document.addPage();
        });

        it('should split PDF into multiple documents', async () => {
            const pageRanges: PageRange[] = [
                { start: 1, end: 1 },
                { start: 2, end: 3 },
            ];

            const splitDocs = await pdfEngine.splitPDF(document, pageRanges);
            expect(splitDocs).toHaveLength(2);
            expect(splitDocs[0].getPageCount()).toBe(1);
            expect(splitDocs[1].getPageCount()).toBe(2);
        });

        it('should throw error for invalid page ranges', async () => {
            const pageRanges: PageRange[] = [
                { start: 1, end: 10 }, // Beyond document pages
            ];

            await expect(pdfEngine.splitPDF(document, pageRanges)).rejects.toThrow(PDFValidationError);
        });

        it('should throw error for empty page ranges', async () => {
            await expect(pdfEngine.splitPDF(document, [])).rejects.toThrow(PDFValidationError);
        });
    });

    describe('extractPages', () => {
        let document: PDFDocument;

        beforeEach(async () => {
            document = await PDFDocument.create();
            document.addPage();
            document.addPage();
            document.addPage();
        });

        it('should extract specific pages', async () => {
            const extractedDoc = await pdfEngine.extractPages(document, [1, 3]);
            expect(extractedDoc.getPageCount()).toBe(2);
        });

        it('should filter out invalid page numbers', async () => {
            const extractedDoc = await pdfEngine.extractPages(document, [1, 10, 2]);
            expect(extractedDoc.getPageCount()).toBe(2);
        });

        it('should throw error when no valid pages provided', async () => {
            await expect(pdfEngine.extractPages(document, [10, 20])).rejects.toThrow(PDFValidationError);
        });

        it('should throw error when no pages provided', async () => {
            await expect(pdfEngine.extractPages(document, [])).rejects.toThrow(PDFValidationError);
        });
    });

    describe('optimizePDF', () => {
        let document: PDFDocument;

        beforeEach(async () => {
            document = await pdfEngine.loadPDF(testPDFBuffer);
        });

        it('should optimize PDF document', async () => {
            const options: OptimizationOptions = {
                compressImages: true,
                removeUnusedObjects: true,
                optimizeFonts: true,
                linearize: false,
                quality: 85,
            };

            const optimizedDoc = await pdfEngine.optimizePDF(document, options);
            expect(optimizedDoc).toBeInstanceOf(PDFDocument);
            expect(optimizedDoc.getPageCount()).toBe(document.getPageCount());
        });

        it('should handle optimization with different quality settings', async () => {
            const highQualityOptions: OptimizationOptions = {
                compressImages: true,
                removeUnusedObjects: false,
                optimizeFonts: false,
                linearize: false,
                quality: 95,
            };

            const optimizedDoc = await pdfEngine.optimizePDF(document, highQualityOptions);
            expect(optimizedDoc).toBeInstanceOf(PDFDocument);
            expect(optimizedDoc.getPageCount()).toBe(document.getPageCount());
        });

        it('should handle optimization with all features enabled', async () => {
            const fullOptions: OptimizationOptions = {
                compressImages: true,
                removeUnusedObjects: true,
                optimizeFonts: true,
                linearize: true,
                quality: 75,
            };

            const optimizedDoc = await pdfEngine.optimizePDF(document, fullOptions);
            expect(optimizedDoc).toBeInstanceOf(PDFDocument);
            expect(optimizedDoc.getPageCount()).toBe(document.getPageCount());
        });
    });

    describe('addWatermark', () => {
        let document: PDFDocument;

        beforeEach(async () => {
            document = await pdfEngine.loadPDF(testPDFBuffer);
        });

        it('should add watermark to PDF document', async () => {
            const watermark: WatermarkOptions = {
                text: 'CONFIDENTIAL',
                opacity: 0.3,
                fontSize: 48,
                color: '#CCCCCC',
                rotation: 45,
                position: 'center',
            };

            const watermarkedDoc = await pdfEngine.addWatermark(document, watermark);
            expect(watermarkedDoc).toBeInstanceOf(PDFDocument);
        });

        it('should handle different watermark positions', async () => {
            const positions: Array<WatermarkOptions['position']> = [
                'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
            ];

            for (const position of positions) {
                const watermark: WatermarkOptions = {
                    text: 'TEST',
                    opacity: 0.5,
                    fontSize: 24,
                    color: '#FF0000',
                    rotation: 0,
                    position,
                };

                const watermarkedDoc = await pdfEngine.addWatermark(document, watermark);
                expect(watermarkedDoc).toBeInstanceOf(PDFDocument);
            }
        });
    });

    describe('validatePDF', () => {
        it('should validate a valid PDF', async () => {
            const result = await pdfEngine.validatePDF(testPDFBuffer);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.pageCount).toBeGreaterThan(0);
        });

        it('should detect invalid PDF', async () => {
            const invalidBuffer = createInvalidPDFBuffer();
            const result = await pdfEngine.validatePDF(invalidBuffer);
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
        });

        it('should include file size in validation result', async () => {
            const result = await pdfEngine.validatePDF(testPDFBuffer);
            expect(result.fileSize).toBe(testPDFBuffer.length);
        });
    });

    describe('getMetadata', () => {
        let document: PDFDocument;

        beforeEach(async () => {
            document = await pdfEngine.loadPDF(testPDFBuffer);
        });

        it('should extract PDF metadata', async () => {
            const metadata = await pdfEngine.getMetadata(document);
            expect(metadata).toBeDefined();
            expect(metadata.pageCount).toBe(document.getPageCount());
            expect(typeof metadata.version).toBe('string');
        });
    });

    describe('serialize', () => {
        let document: PDFDocument;

        beforeEach(async () => {
            document = await pdfEngine.loadPDF(testPDFBuffer);
        });

        it('should serialize PDF document to buffer', async () => {
            const buffer = await pdfEngine.serialize(document);
            expect(buffer).toBeInstanceOf(Buffer);
            expect(buffer.length).toBeGreaterThan(0);
        });

        it('should create valid PDF when serialized', async () => {
            const buffer = await pdfEngine.serialize(document);
            const reloadedDoc = await pdfEngine.loadPDF(buffer);
            expect(reloadedDoc.getPageCount()).toBe(document.getPageCount());
        });
    });

    describe('field management', () => {
        let document: PDFDocument;
        let fieldDefinitions: FieldDefinition[];

        beforeEach(async () => {
            document = await pdfEngine.loadPDF(testPDFBuffer);

            // Define test fields
            fieldDefinitions = [
                {
                    type: 'text',
                    name: 'testField1',
                    page: 0,
                    x: 100,
                    y: 100,
                    width: 200,
                    height: 30,
                    required: true,
                    readonly: false,
                    fontSize: 12,
                    fontColor: '#000000',
                    borderWidth: 1,
                },
                {
                    type: 'checkbox',
                    name: 'testField2',
                    page: 0,
                    x: 100,
                    y: 200,
                    width: 20,
                    height: 20,
                    required: false,
                    readonly: false,
                    fontSize: 12,
                    fontColor: '#000000',
                    borderWidth: 1,
                }
            ];

            // Add test fields to document
            for (const fieldDef of fieldDefinitions) {
                await pdfEngine.createField(document, fieldDef);
            }
        });

        it('should get all form fields', async () => {
            const fields = await pdfEngine.getFormFields(document);
            expect(fields).toHaveLength(2);
            expect(fields.map(f => f.getName())).toContain('testField1');
            expect(fields.map(f => f.getName())).toContain('testField2');
        });

        it('should get specific form field by name', async () => {
            const field = await pdfEngine.getFormField(document, 'testField1');
            expect(field).toBeDefined();
            expect(field?.getName()).toBe('testField1');
        });

        it('should return null for non-existent field', async () => {
            const field = await pdfEngine.getFormField(document, 'nonExistentField');
            expect(field).toBeNull();
        });

        it('should update text field value', async () => {
            await pdfEngine.updateFieldValue(document, 'testField1', 'Updated text');
            const field = await pdfEngine.getFormField(document, 'testField1');
            expect((field as PDFTextField).getText()).toBe('Updated text');
        });

        it('should update checkbox field value', async () => {
            await pdfEngine.updateFieldValue(document, 'testField2', 'true');
            const field = await pdfEngine.getFormField(document, 'testField2');
            expect((field as PDFCheckBox).isChecked()).toBe(true);
        });

        it('should validate form fields', async () => {
            const validation = await pdfEngine.validateFormFields(document, fieldDefinitions);
            expect(validation.isValid).toBe(false); // testField1 is required but empty
            expect(validation.errors).toContain("Required field 'testField1' is empty");
        });

        it('should validate form fields after filling required fields', async () => {
            await pdfEngine.updateFieldValue(document, 'testField1', 'Some text');
            const validation = await pdfEngine.validateFormFields(document, fieldDefinitions);
            expect(validation.isValid).toBe(true);
            expect(validation.errors).toHaveLength(0);
        });
    });

    describe('error handling', () => {
        it('should throw PDFProcessingError for general errors', async () => {
            // Test with null buffer to trigger error
            await expect(pdfEngine.loadPDF(null as any)).rejects.toThrow(PDFProcessingError);
        });

        it('should preserve error context in processing errors', async () => {
            try {
                await pdfEngine.loadPDF(createInvalidPDFBuffer());
            } catch (error) {
                expect(error).toBeInstanceOf(PDFProcessingError);
                expect((error as PDFProcessingError).code).toBeDefined();
            }
        });
    });
});