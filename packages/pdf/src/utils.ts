import type { PDFDocument } from 'pdf-lib';
import type { ProcessingResult, PDFMetadata } from './types';

/**
 * Utility functions for PDF processing
 */

/**
 * Create a processing result wrapper
 */
export function createProcessingResult<T>(
    success: boolean,
    data?: T,
    error?: string,
    warnings?: string[],
    startTime?: number
): ProcessingResult<T> {
    return {
        success,
        data,
        error,
        warnings,
        processingTime: startTime ? Date.now() - startTime : 0,
    };
}

/**
 * Validate PDF buffer format
 */
export function isValidPDFBuffer(buffer: Buffer): boolean {
    if (!buffer || buffer.length < 4) {
        return false;
    }

    // Check for PDF header
    const header = buffer.subarray(0, 4).toString();
    return header === '%PDF';
}

/**
 * Get PDF version from buffer
 */
export function getPDFVersion(buffer: Buffer): string | null {
    if (!isValidPDFBuffer(buffer)) {
        return null;
    }

    // Look for version in first 20 bytes
    const header = buffer.subarray(0, 20).toString();
    const versionMatch = header.match(/%PDF-(\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : null;
}

/**
 * Calculate file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Validate field coordinates
 */
export function validateFieldCoordinates(
    x: number,
    y: number,
    width: number,
    height: number,
    pageWidth: number,
    pageHeight: number
): boolean {
    return (
        x >= 0 &&
        y >= 0 &&
        width > 0 &&
        height > 0 &&
        x + width <= pageWidth &&
        y + height <= pageHeight
    );
}

/**
 * Convert RGB hex color to PDF-lib RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
        ? {
            r: parseInt(result[1], 16) / 255,
            g: parseInt(result[2], 16) / 255,
            b: parseInt(result[3], 16) / 255,
        }
        : null;
}

/**
 * Generate unique field name
 */
export function generateFieldName(type: string, page: number, index: number): string {
    return `${type}_page${page}_field${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Sanitize filename for PDF output
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/_{2,}/g, '_')
        .replace(/^_|_$/g, '');
}

/**
 * Calculate optimal page size for content
 */
export function calculateOptimalPageSize(contentWidth: number, contentHeight: number) {
    const margin = 72; // 1 inch margin
    return {
        width: contentWidth + margin * 2,
        height: contentHeight + margin * 2,
    };
}

/**
 * Merge PDF metadata
 */
export function mergeMetadata(metadataList: PDFMetadata[]): PDFMetadata {
    if (metadataList.length === 0) {
        throw new Error('No metadata to merge');
    }

    if (metadataList.length === 1) {
        return metadataList[0];
    }

    const merged: PDFMetadata = {
        title: metadataList[0].title,
        author: metadataList[0].author,
        subject: 'Merged Document',
        keywords: [],
        creator: 'Signtusk PDF Engine',
        producer: 'Signtusk PDF Engine',
        creationDate: new Date(),
        modificationDate: new Date(),
        pageCount: metadataList.reduce((sum, meta) => sum + meta.pageCount, 0),
        fileSize: metadataList.reduce((sum, meta) => sum + meta.fileSize, 0),
        version: metadataList[0].version,
    };

    // Merge keywords
    const allKeywords = metadataList
        .flatMap(meta => meta.keywords || [])
        .filter((keyword, index, array) => array.indexOf(keyword) === index);
    merged.keywords = allKeywords;

    return merged;
}

/**
 * Validate page range
 */
export function validatePageRange(start: number, end: number, totalPages: number): boolean {
    return (
        start >= 1 &&
        end >= 1 &&
        start <= totalPages &&
        end <= totalPages &&
        start <= end
    );
}

/**
 * Convert page coordinates from top-left to bottom-left (PDF standard)
 */
export function convertCoordinates(
    x: number,
    y: number,
    height: number,
    pageHeight: number
): { x: number; y: number } {
    return {
        x,
        y: pageHeight - y - height,
    };
}

/**
 * Estimate processing time based on file size and operation
 */
export function estimateProcessingTime(
    fileSize: number,
    operation: 'load' | 'merge' | 'split' | 'optimize' | 'extract'
): number {
    const baseTimes = {
        load: 100, // ms per MB
        merge: 200,
        split: 150,
        optimize: 300,
        extract: 250,
    };

    const fileSizeMB = fileSize / (1024 * 1024);
    return Math.ceil(fileSizeMB * baseTimes[operation]);
}

/**
 * Create error context for debugging
 */
export function createErrorContext(
    operation: string,
    params: Record<string, any>
): Record<string, any> {
    return {
        operation,
        timestamp: new Date().toISOString(),
        params: JSON.stringify(params, null, 2),
    };
}

/**
 * Validate PDF processing options
 */
export function validateProcessingOptions(options: any): string[] {
    const errors: string[] = [];

    if (options.timeout && (typeof options.timeout !== 'number' || options.timeout <= 0)) {
        errors.push('Timeout must be a positive number');
    }

    if (options.maxFileSize !== undefined && (typeof options.maxFileSize !== 'number' || options.maxFileSize <= 0)) {
        errors.push('Max file size must be a positive number');
    }

    return errors;
}