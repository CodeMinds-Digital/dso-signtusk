import { describe, it, expect } from 'vitest';
import {
    createProcessingResult,
    isValidPDFBuffer,
    getPDFVersion,
    formatFileSize,
    validateFieldCoordinates,
    hexToRgb,
    generateFieldName,
    sanitizeFilename,
    calculateOptimalPageSize,
    mergeMetadata,
    validatePageRange,
    convertCoordinates,
    estimateProcessingTime,
    createErrorContext,
    validateProcessingOptions,
} from '../utils';
import type { PDFMetadata } from '../types';
import { createTestPDFBuffer, createInvalidPDFBuffer } from './setup';

describe('PDF Utils', () => {
    describe('createProcessingResult', () => {
        it('should create successful processing result', () => {
            const result = createProcessingResult(true, 'test data', undefined, [], Date.now() - 100);
            expect(result.success).toBe(true);
            expect(result.data).toBe('test data');
            expect(result.error).toBeUndefined();
            expect(result.processingTime).toBeGreaterThan(0);
        });

        it('should create error processing result', () => {
            const result = createProcessingResult(false, undefined, 'Test error', ['Warning 1']);
            expect(result.success).toBe(false);
            expect(result.error).toBe('Test error');
            expect(result.warnings).toEqual(['Warning 1']);
        });
    });

    describe('isValidPDFBuffer', () => {
        it('should validate correct PDF buffer', () => {
            const pdfBuffer = createTestPDFBuffer();
            expect(isValidPDFBuffer(pdfBuffer)).toBe(true);
        });

        it('should reject invalid PDF buffer', () => {
            const invalidBuffer = createInvalidPDFBuffer();
            expect(isValidPDFBuffer(invalidBuffer)).toBe(false);
        });

        it('should reject empty buffer', () => {
            expect(isValidPDFBuffer(Buffer.alloc(0))).toBe(false);
        });

        it('should reject null/undefined buffer', () => {
            expect(isValidPDFBuffer(null as any)).toBe(false);
            expect(isValidPDFBuffer(undefined as any)).toBe(false);
        });
    });

    describe('getPDFVersion', () => {
        it('should extract PDF version from valid buffer', () => {
            const pdfBuffer = createTestPDFBuffer();
            const version = getPDFVersion(pdfBuffer);
            expect(version).toBe('1.4');
        });

        it('should return null for invalid buffer', () => {
            const invalidBuffer = createInvalidPDFBuffer();
            expect(getPDFVersion(invalidBuffer)).toBeNull();
        });
    });

    describe('formatFileSize', () => {
        it('should format bytes correctly', () => {
            expect(formatFileSize(1024)).toBe('1.00 KB');
            expect(formatFileSize(1048576)).toBe('1.00 MB');
            expect(formatFileSize(1073741824)).toBe('1.00 GB');
            expect(formatFileSize(500)).toBe('500.00 B');
        });
    });

    describe('validateFieldCoordinates', () => {
        it('should validate correct coordinates', () => {
            expect(validateFieldCoordinates(10, 10, 100, 50, 612, 792)).toBe(true);
        });

        it('should reject coordinates outside page bounds', () => {
            expect(validateFieldCoordinates(600, 10, 100, 50, 612, 792)).toBe(false);
            expect(validateFieldCoordinates(10, 750, 100, 50, 612, 792)).toBe(false);
        });

        it('should reject negative coordinates', () => {
            expect(validateFieldCoordinates(-10, 10, 100, 50, 612, 792)).toBe(false);
            expect(validateFieldCoordinates(10, -10, 100, 50, 612, 792)).toBe(false);
        });

        it('should reject zero or negative dimensions', () => {
            expect(validateFieldCoordinates(10, 10, 0, 50, 612, 792)).toBe(false);
            expect(validateFieldCoordinates(10, 10, 100, -50, 612, 792)).toBe(false);
        });
    });

    describe('hexToRgb', () => {
        it('should convert hex color to RGB', () => {
            const rgb = hexToRgb('#FF0000');
            expect(rgb).toEqual({ r: 1, g: 0, b: 0 });
        });

        it('should handle hex without hash', () => {
            const rgb = hexToRgb('00FF00');
            expect(rgb).toEqual({ r: 0, g: 1, b: 0 });
        });

        it('should return null for invalid hex', () => {
            expect(hexToRgb('invalid')).toBeNull();
            expect(hexToRgb('#GG0000')).toBeNull();
        });
    });

    describe('generateFieldName', () => {
        it('should generate unique field names', () => {
            const name1 = generateFieldName('text', 1, 1);
            const name2 = generateFieldName('text', 1, 1);
            expect(name1).not.toBe(name2);
            expect(name1).toMatch(/^text_page1_field1_\d+_[a-z0-9]+$/);
        });
    });

    describe('sanitizeFilename', () => {
        it('should sanitize filename', () => {
            expect(sanitizeFilename('test file.pdf')).toBe('test_file.pdf');
            expect(sanitizeFilename('file@#$%^&*().pdf')).toBe('file_.pdf');
            expect(sanitizeFilename('___test___')).toBe('test');
        });
    });

    describe('calculateOptimalPageSize', () => {
        it('should calculate page size with margins', () => {
            const size = calculateOptimalPageSize(400, 600);
            expect(size.width).toBe(544); // 400 + 72*2
            expect(size.height).toBe(744); // 600 + 72*2
        });
    });

    describe('mergeMetadata', () => {
        const metadata1: PDFMetadata = {
            title: 'Doc 1',
            author: 'Author 1',
            pageCount: 5,
            fileSize: 1000,
            version: '1.4',
            keywords: ['keyword1', 'keyword2'],
        };

        const metadata2: PDFMetadata = {
            title: 'Doc 2',
            author: 'Author 2',
            pageCount: 3,
            fileSize: 800,
            version: '1.4',
            keywords: ['keyword2', 'keyword3'],
        };

        it('should merge multiple metadata objects', () => {
            const merged = mergeMetadata([metadata1, metadata2]);
            expect(merged.pageCount).toBe(8);
            expect(merged.fileSize).toBe(1800);
            expect(merged.keywords).toEqual(['keyword1', 'keyword2', 'keyword3']);
        });

        it('should return single metadata when only one provided', () => {
            const merged = mergeMetadata([metadata1]);
            expect(merged).toBe(metadata1);
        });

        it('should throw error for empty array', () => {
            expect(() => mergeMetadata([])).toThrow('No metadata to merge');
        });
    });

    describe('validatePageRange', () => {
        it('should validate correct page ranges', () => {
            expect(validatePageRange(1, 5, 10)).toBe(true);
            expect(validatePageRange(3, 3, 10)).toBe(true);
        });

        it('should reject invalid page ranges', () => {
            expect(validatePageRange(0, 5, 10)).toBe(false); // start < 1
            expect(validatePageRange(1, 15, 10)).toBe(false); // end > totalPages
            expect(validatePageRange(5, 3, 10)).toBe(false); // start > end
        });
    });

    describe('convertCoordinates', () => {
        it('should convert top-left to bottom-left coordinates', () => {
            const converted = convertCoordinates(100, 50, 30, 792);
            expect(converted.x).toBe(100);
            expect(converted.y).toBe(712); // 792 - 50 - 30
        });
    });

    describe('estimateProcessingTime', () => {
        it('should estimate processing time based on file size and operation', () => {
            const fileSize = 2 * 1024 * 1024; // 2MB
            const loadTime = estimateProcessingTime(fileSize, 'load');
            const mergeTime = estimateProcessingTime(fileSize, 'merge');

            expect(loadTime).toBeGreaterThan(0);
            expect(mergeTime).toBeGreaterThan(loadTime);
        });
    });

    describe('createErrorContext', () => {
        it('should create error context with operation and params', () => {
            const context = createErrorContext('loadPDF', { fileSize: 1000 });
            expect(context.operation).toBe('loadPDF');
            expect(context.timestamp).toBeDefined();
            expect(context.params).toContain('fileSize');
        });
    });

    describe('validateProcessingOptions', () => {
        it('should validate correct options', () => {
            const errors = validateProcessingOptions({
                timeout: 5000,
                maxFileSize: 1024 * 1024,
            });
            expect(errors).toHaveLength(0);
        });

        it('should detect invalid timeout', () => {
            const errors = validateProcessingOptions({ timeout: -1000 });
            expect(errors).toContain('Timeout must be a positive number');
        });

        it('should detect invalid max file size', () => {
            const errors = validateProcessingOptions({ maxFileSize: 0 });
            expect(errors).toContain('Max file size must be a positive number');
        });
    });
});