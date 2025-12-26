import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileProcessingServiceImpl } from '../file-processing-service';
import { SupportedFormat, ConversionQuality, OCRLanguage } from '../types';
import { getTestFilePath, getTempFilePath, createTempFile, cleanupTempFile } from './setup';

describe('FileProcessingService', () => {
    let service: FileProcessingServiceImpl;
    let tempFiles: string[] = [];

    beforeEach(() => {
        service = new FileProcessingServiceImpl();
    });

    afterEach(async () => {
        // Clean up temporary files
        for (const file of tempFiles) {
            await cleanupTempFile(file);
        }
        tempFiles = [];

        // Clean up service
        await service.cleanup();
    });

    describe('Format Detection', () => {
        it('should detect text file format', async () => {
            const filePath = getTestFilePath('sample.txt');
            const format = await service.detectFormat(filePath);
            expect(format).toBe(SupportedFormat.TXT);
        });

        it('should detect HTML file format', async () => {
            const filePath = getTestFilePath('sample.html');
            const format = await service.detectFormat(filePath);
            expect(format).toBe(SupportedFormat.HTML);
        });

        it('should detect CSV file format', async () => {
            const filePath = getTestFilePath('sample.csv');
            const format = await service.detectFormat(filePath);
            expect(format).toBe(SupportedFormat.CSV);
        });

        it('should detect PNG image format', async () => {
            const filePath = getTestFilePath('sample.png');
            const format = await service.detectFormat(filePath);
            expect(format).toBe(SupportedFormat.PNG);
        });

        it('should throw error for unsupported format', async () => {
            const unsupportedFile = await createTempFile('test.xyz', 'unsupported content');
            tempFiles.push(unsupportedFile);

            await expect(service.detectFormat(unsupportedFile)).rejects.toThrow();
        });
    });

    describe('File Validation', () => {
        it('should validate existing text file', async () => {
            const filePath = getTestFilePath('sample.txt');
            const isValid = await service.validateFile(filePath);
            expect(isValid).toBe(true);
        });

        it('should validate file against expected format', async () => {
            const filePath = getTestFilePath('sample.txt');
            const isValid = await service.validateFile(filePath, SupportedFormat.TXT);
            expect(isValid).toBe(true);
        });

        it('should reject file with wrong expected format', async () => {
            const filePath = getTestFilePath('sample.txt');
            const isValid = await service.validateFile(filePath, SupportedFormat.PDF);
            expect(isValid).toBe(false);
        });

        it('should reject non-existent file', async () => {
            const isValid = await service.validateFile('/non/existent/file.txt');
            expect(isValid).toBe(false);
        });

        it('should reject empty file', async () => {
            const emptyFile = await createTempFile('empty.txt', '');
            tempFiles.push(emptyFile);

            const isValid = await service.validateFile(emptyFile);
            expect(isValid).toBe(false);
        });
    });

    describe('Text Extraction', () => {
        it('should extract text from text file', async () => {
            const filePath = getTestFilePath('sample.txt');
            const text = await service.extractText(filePath);
            expect(text).toContain('sample text file');
        });

        it('should extract text from HTML file', async () => {
            const filePath = getTestFilePath('sample.html');
            const text = await service.extractText(filePath);
            expect(text).toContain('Sample Document');
        });

        it('should throw error for unsupported format', async () => {
            const unsupportedFile = await createTempFile('test.xyz', 'content');
            tempFiles.push(unsupportedFile);

            await expect(service.extractText(unsupportedFile)).rejects.toThrow();
        });
    });

    describe('Metadata Extraction', () => {
        it('should extract basic metadata from file', async () => {
            const filePath = getTestFilePath('sample.txt');
            const metadata = await service.extractMetadata(filePath);

            expect(metadata).toHaveProperty('fileName');
            expect(metadata).toHaveProperty('format');
            expect(metadata).toHaveProperty('size');
            expect(metadata).toHaveProperty('checksum');
            expect(metadata).toHaveProperty('createdAt');
            expect(metadata).toHaveProperty('modifiedAt');

            expect(metadata.fileName).toBe('sample.txt');
            expect(metadata.format).toBe(SupportedFormat.TXT);
            expect(metadata.size).toBeGreaterThan(0);
            expect(metadata.checksum).toMatch(/^[a-f0-9]{64}$/); // SHA-256 hash
        });

        it('should extract format-specific metadata', async () => {
            const filePath = getTestFilePath('sample.png');
            const metadata = await service.extractMetadata(filePath);

            expect(metadata.type).toBe('image');
            expect(metadata).toHaveProperty('width');
            expect(metadata).toHaveProperty('height');
        });
    });

    describe('Document Conversion', () => {
        it('should convert HTML to text', async () => {
            const inputPath = getTestFilePath('sample.html');
            const outputPath = getTempFilePath('converted.txt');
            tempFiles.push(outputPath);

            const result = await service.convertDocument(inputPath, outputPath, {
                targetFormat: SupportedFormat.TXT
            });

            expect(result.success).toBe(true);
            expect(result.outputPath).toBe(outputPath);
            expect(result.metadata.originalSize).toBeGreaterThan(0);
            expect(result.metadata.convertedSize).toBeGreaterThan(0);
        });

        it('should convert CSV to HTML', async () => {
            const inputPath = getTestFilePath('sample.csv');
            const outputPath = getTempFilePath('converted.html');
            tempFiles.push(outputPath);

            const result = await service.convertDocument(inputPath, outputPath, {
                targetFormat: SupportedFormat.HTML
            });

            expect(result.success).toBe(true);
            expect(result.outputPath).toBe(outputPath);
        });

        it('should handle conversion with quality settings', async () => {
            const inputPath = getTestFilePath('sample.txt');
            const outputPath = getTempFilePath('converted.html');
            tempFiles.push(outputPath);

            const result = await service.convertDocument(inputPath, outputPath, {
                targetFormat: SupportedFormat.HTML,
                quality: ConversionQuality.HIGH,
                preserveFormatting: true
            });

            expect(result.success).toBe(true);
            expect(result.metadata.quality).toBe(ConversionQuality.HIGH);
        });

        it('should fail for unsupported conversion', async () => {
            const inputPath = getTestFilePath('sample.png');
            const outputPath = getTempFilePath('converted.docx');

            await expect(service.convertDocument(inputPath, outputPath, {
                targetFormat: SupportedFormat.DOCX
            })).rejects.toThrow();
        });
    });

    describe('OCR Processing', () => {
        it('should perform OCR on image file', async () => {
            const filePath = getTestFilePath('sample.png');

            const result = await service.performOCR(filePath, {
                languages: [OCRLanguage.ENGLISH],
                confidence: 70,
                preserveLayout: true,
                detectOrientation: true,
                enhanceImage: true,
                outputFormat: 'text'
            });

            expect(result.success).toBe(true);
            expect(result.metadata.pageCount).toBe(1);
            expect(result.metadata.detectedLanguages).toContain(OCRLanguage.ENGLISH);
            expect(result.metadata.processingTime).toBeGreaterThan(0);
        });

        it('should handle OCR with multiple languages', async () => {
            const filePath = getTestFilePath('sample.png');

            const result = await service.performOCR(filePath, {
                languages: [OCRLanguage.ENGLISH, OCRLanguage.SPANISH],
                confidence: 80,
                preserveLayout: false,
                detectOrientation: false,
                enhanceImage: false,
                outputFormat: 'text'
            });

            expect(result.success).toBe(true);
            expect(result.metadata.detectedLanguages).toEqual([OCRLanguage.ENGLISH, OCRLanguage.SPANISH]);
        });

        it('should fail OCR for non-image/PDF files', async () => {
            const filePath = getTestFilePath('sample.txt');

            await expect(service.performOCR(filePath, {
                languages: [OCRLanguage.ENGLISH],
                confidence: 70,
                preserveLayout: true,
                detectOrientation: true,
                enhanceImage: true,
                outputFormat: 'text'
            })).rejects.toThrow();
        });
    });

    describe('Image Optimization', () => {
        it('should optimize PNG image', async () => {
            const inputPath = getTestFilePath('sample.png');
            const outputPath = getTempFilePath('optimized.png');
            tempFiles.push(outputPath);

            const result = await service.optimizeImage(inputPath, outputPath, ConversionQuality.MEDIUM);

            expect(result.success).toBe(true);
            expect(result.outputPath).toBe(outputPath);
            expect(result.metadata.quality).toBe(ConversionQuality.MEDIUM);
        });

        it('should fail optimization for non-image files', async () => {
            const inputPath = getTestFilePath('sample.txt');
            const outputPath = getTempFilePath('optimized.txt');

            await expect(service.optimizeImage(inputPath, outputPath, ConversionQuality.HIGH))
                .rejects.toThrow();
        });
    });

    describe('Batch Processing', () => {
        it('should process batch of conversion jobs', async () => {
            const jobs = [
                {
                    id: 'job1',
                    inputPath: getTestFilePath('sample.txt'),
                    outputPath: getTempFilePath('batch1.html'),
                    operation: 'convert' as const,
                    options: { targetFormat: SupportedFormat.HTML }
                },
                {
                    id: 'job2',
                    inputPath: getTestFilePath('sample.csv'),
                    outputPath: getTempFilePath('batch2.html'),
                    operation: 'convert' as const,
                    options: { targetFormat: SupportedFormat.HTML }
                }
            ];

            tempFiles.push(...jobs.map(j => j.outputPath));

            const result = await service.processBatch(jobs, {
                concurrency: 2,
                priority: 'normal',
                retryAttempts: 1,
                retryDelay: 1000
            });

            expect(result.totalJobs).toBe(2);
            expect(result.completedJobs).toBeGreaterThan(0);
            expect(result.results).toHaveLength(2);
            expect(result.summary.successRate).toBeGreaterThan(0);
        });

        it('should handle batch processing with progress callback', async () => {
            const progressUpdates: number[] = [];

            const jobs = [{
                id: 'job1',
                inputPath: getTestFilePath('sample.txt'),
                outputPath: getTempFilePath('batch_progress.html'),
                operation: 'convert' as const,
                options: { targetFormat: SupportedFormat.HTML }
            }];

            tempFiles.push(jobs[0].outputPath);

            const result = await service.processBatch(jobs, {
                concurrency: 1,
                priority: 'high',
                retryAttempts: 0,
                retryDelay: 1000,
                onProgress: (current, total) => {
                    progressUpdates.push(current);
                }
            });

            expect(result.totalJobs).toBe(1);
            expect(progressUpdates.length).toBeGreaterThan(0);
        });

        it('should handle empty batch', async () => {
            const result = await service.processBatch([], {
                concurrency: 1,
                priority: 'normal',
                retryAttempts: 1,
                retryDelay: 1000
            });

            expect(result.totalJobs).toBe(0);
            expect(result.completedJobs).toBe(0);
            expect(result.failedJobs).toBe(0);
            expect(result.results).toHaveLength(0);
        });
    });

    describe('Service Capabilities', () => {
        it('should return processing capabilities', async () => {
            const capabilities = await service.getProcessingCapabilities();

            expect(capabilities).toHaveProperty('supportedFormats');
            expect(capabilities).toHaveProperty('supportedConversions');
            expect(capabilities).toHaveProperty('ocrLanguages');
            expect(capabilities).toHaveProperty('maxFileSize');
            expect(capabilities).toHaveProperty('maxBatchSize');

            expect(Array.isArray(capabilities.supportedFormats)).toBe(true);
            expect(Array.isArray(capabilities.supportedConversions)).toBe(true);
            expect(Array.isArray(capabilities.ocrLanguages)).toBe(true);
            expect(capabilities.maxFileSize).toBeGreaterThan(0);
            expect(capabilities.maxBatchSize).toBeGreaterThan(0);
        });

        it('should return processing statistics', async () => {
            const stats = await service.getProcessingStats();

            expect(stats).toHaveProperty('totalProcessed');
            expect(stats).toHaveProperty('successRate');
            expect(stats).toHaveProperty('averageProcessingTime');
            expect(stats).toHaveProperty('queueStatus');

            expect(typeof stats.totalProcessed).toBe('number');
            expect(typeof stats.successRate).toBe('number');
            expect(typeof stats.averageProcessingTime).toBe('number');
            expect(typeof stats.queueStatus).toBe('object');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid input file gracefully', async () => {
            await expect(service.detectFormat('/non/existent/file.txt')).rejects.toThrow();
            await expect(service.validateFile('/non/existent/file.txt')).resolves.toBe(false);
            await expect(service.extractText('/non/existent/file.txt')).rejects.toThrow();
            await expect(service.extractMetadata('/non/existent/file.txt')).rejects.toThrow();
        });

        it('should handle conversion errors gracefully', async () => {
            const inputPath = getTestFilePath('sample.txt');
            const outputPath = getTempFilePath('invalid_conversion.xyz');

            await expect(service.convertDocument(inputPath, outputPath, {
                targetFormat: 'invalid' as any
            })).rejects.toThrow();
        });

        it('should handle OCR errors gracefully', async () => {
            const filePath = getTestFilePath('sample.txt');

            await expect(service.performOCR(filePath, {
                languages: [OCRLanguage.ENGLISH],
                confidence: 70,
                preserveLayout: true,
                detectOrientation: true,
                enhanceImage: true,
                outputFormat: 'text'
            })).rejects.toThrow();
        });
    });
});