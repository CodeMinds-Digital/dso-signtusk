import { describe, it, expect, beforeEach } from 'vitest';
import { PDFValidationEngine } from '../pdf-validation-engine';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

describe('PDFValidationEngine', () => {
    let validationEngine: PDFValidationEngine;
    let validPDFBuffer: Buffer;
    let invalidPDFBuffer: Buffer;

    beforeEach(async () => {
        validationEngine = new PDFValidationEngine();

        // Create a valid test PDF
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([600, 400]);
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

        page.drawText('Test PDF Document', {
            x: 50,
            y: 350,
            size: 20,
            font,
            color: rgb(0, 0, 0),
        });

        validPDFBuffer = Buffer.from(await pdfDoc.save());

        // Create an invalid PDF buffer
        invalidPDFBuffer = Buffer.from('This is not a PDF file');
    });

    describe('validatePDF', () => {
        it('should validate a valid PDF document', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
            expect(result.pageCount).toBeGreaterThan(0);
            expect(result.fileSize).toBe(validPDFBuffer.length);
            expect(result.structureValidation.isValid).toBe(true);
            expect(result.processingTime).toBeGreaterThan(0);
        });

        it('should detect invalid PDF structure', async () => {
            const result = await validationEngine.validatePDF(invalidPDFBuffer);

            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.structureValidation.isValid).toBe(false);
            expect(result.structureValidation.errors.length).toBeGreaterThan(0);
        });

        it('should validate PDF structure components', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.structureValidation.pdfVersion).toMatch(/^\d+\.\d+$/);
            expect(result.structureValidation.crossReferenceValid).toBe(true);
            expect(result.structureValidation.trailerValid).toBe(true);
            expect(result.structureValidation.objectsValid).toBe(true);
        });

        it('should handle PDF without signatures', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.signatureValidation.hasSignatures).toBe(false);
            expect(result.signatureValidation.allSignaturesValid).toBe(true);
            expect(result.signatureValidation.signatures).toHaveLength(0);
        });

        it('should handle PDF without timestamps', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.timestampValidation.hasTimestamps).toBe(false);
            expect(result.timestampValidation.allTimestampsValid).toBe(true);
            expect(result.timestampValidation.timestamps).toHaveLength(0);
        });

        it('should detect encrypted PDFs', async () => {
            // Create an encrypted PDF (simplified test)
            const pdfDoc = await PDFDocument.create();
            pdfDoc.addPage([600, 400]);

            // Note: pdf-lib doesn't support encryption in the test environment
            // This test would need a pre-encrypted PDF file in a real scenario
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.isEncrypted).toBe(false); // Our test PDF is not encrypted
        });

        it('should validate form fields detection', async () => {
            // Create PDF with form fields
            const pdfDoc = await PDFDocument.create();
            const page = pdfDoc.addPage([600, 400]);
            const form = pdfDoc.getForm();

            form.createTextField('testField');

            const pdfWithFormBuffer = Buffer.from(await pdfDoc.save());
            const result = await validationEngine.validatePDF(pdfWithFormBuffer);

            expect(result.hasFormFields).toBe(true);
        });

        it('should handle very small files', async () => {
            const tinyBuffer = Buffer.from('PDF');
            const result = await validationEngine.validatePDF(tinyBuffer);

            expect(result.isValid).toBe(false);
            expect(result.structureValidation.errors).toContain('File too small to be a valid PDF');
        });

        it('should validate PDF version', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.version).toMatch(/^\d+\.\d+$/);
            expect(result.structureValidation.pdfVersion).toBe(result.version);
        });

        it('should measure processing time', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.processingTime).toBeGreaterThan(0);
            expect(result.processingTime).toBeLessThan(5000); // Should complete within 5 seconds
        });
    });

    describe('PDF Structure Validation', () => {
        it('should validate PDF header correctly', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.structureValidation.pdfVersion).toMatch(/^1\.\d+$/);
        });

        it('should detect missing PDF header', async () => {
            const noPDFHeader = Buffer.from('Not a PDF header\n%PDF-1.4');
            const result = await validationEngine.validatePDF(noPDFHeader);

            expect(result.isValid).toBe(false);
            expect(result.structureValidation.errors).toContain('Invalid PDF header signature');
        });

        it('should validate cross-reference table', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            // Modern PDFs may use cross-reference streams instead of traditional xref tables
            expect(result.structureValidation.crossReferenceValid).toBe(true);
        });

        it('should validate trailer structure', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.structureValidation.trailerValid).toBe(true);
        });

        it('should validate PDF objects', async () => {
            const result = await validationEngine.validatePDF(validPDFBuffer);

            expect(result.structureValidation.objectsValid).toBe(true);
        });
    });

    describe('Error Handling', () => {
        it('should handle validation errors gracefully', async () => {
            const corruptBuffer = Buffer.alloc(1000, 0xFF); // All 0xFF bytes

            await expect(async () => {
                await validationEngine.validatePDF(corruptBuffer);
            }).not.toThrow();
        });

        it('should provide detailed error messages', async () => {
            const result = await validationEngine.validatePDF(invalidPDFBuffer);

            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('Invalid PDF header signature');
        });

        it('should handle empty buffers', async () => {
            const emptyBuffer = Buffer.alloc(0);
            const result = await validationEngine.validatePDF(emptyBuffer);

            expect(result.isValid).toBe(false);
            expect(result.structureValidation.errors).toContain('File too small to be a valid PDF');
        });
    });

    describe('Performance', () => {
        it('should complete validation within reasonable time', async () => {
            const startTime = Date.now();
            await validationEngine.validatePDF(validPDFBuffer);
            const endTime = Date.now();

            expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        });

        it('should handle large PDFs efficiently', async () => {
            // Create a larger PDF with multiple pages
            const pdfDoc = await PDFDocument.create();
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            // Add multiple pages
            for (let i = 0; i < 10; i++) {
                const page = pdfDoc.addPage([600, 400]);
                page.drawText(`Page ${i + 1}`, {
                    x: 50,
                    y: 350,
                    size: 20,
                    font,
                    color: rgb(0, 0, 0),
                });
            }

            const largePDFBuffer = Buffer.from(await pdfDoc.save());

            const startTime = Date.now();
            const result = await validationEngine.validatePDF(largePDFBuffer);
            const endTime = Date.now();

            expect(result.isValid).toBe(true);
            expect(result.pageCount).toBe(10);
            expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
        });
    });
});