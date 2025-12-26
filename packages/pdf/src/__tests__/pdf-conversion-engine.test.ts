import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { PDFConversionEngineImpl, createPDFConversionEngine } from '../pdf-conversion-engine';
import {
    DOCXConversionOptions,
    HTMLConversionOptions,
    ImageConversionOptions,
    PDFAConversionOptions,
    BatchConversionOptions,
    PDFConversionError,
    DOCXConversionError,
    HTMLConversionError,
    ImageConversionError,
    PDFAConversionError
} from '../types';

// Mock dependencies
vi.mock('mammoth', () => ({
    convertToHtml: vi.fn(),
    images: {
        imgElement: vi.fn()
    }
}));

vi.mock('puppeteer', () => ({
    default: {
        launch: vi.fn()
    }
}));

vi.mock('sharp', () => ({
    default: vi.fn()
}));

vi.mock('jszip', () => ({
    default: {
        loadAsync: vi.fn()
    }
}));

describe('PDFConversionEngine', () => {
    let engine: PDFConversionEngineImpl;

    beforeEach(() => {
        engine = new PDFConversionEngineImpl();
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await engine.cleanup();
    });

    describe('Factory Function', () => {
        it('should create PDF conversion engine instance', () => {
            const createdEngine = createPDFConversionEngine();
            expect(createdEngine).toBeInstanceOf(PDFConversionEngineImpl);
        });
    });

    describe('DOCX to PDF Conversion', () => {
        it('should convert DOCX to PDF with default options', async () => {
            // Mock mammoth conversion
            const mammoth = await import('mammoth');
            vi.mocked(mammoth.convertToHtml).mockResolvedValue({
                value: '<p>Test content</p>',
                messages: []
            });

            // Mock HTML to PDF conversion with proper PDF buffer
            const mockPuppeteer = await import('puppeteer');

            // Create a simple PDF buffer for testing
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            pdfDoc.addPage();
            const validPdfBuffer = await pdfDoc.save();

            const mockBrowser = {
                newPage: vi.fn().mockResolvedValue({
                    setContent: vi.fn(),
                    waitForSelector: vi.fn(),
                    pdf: vi.fn().mockResolvedValue(validPdfBuffer),
                    close: vi.fn()
                }),
                close: vi.fn()
            };
            vi.mocked(mockPuppeteer.default.launch).mockResolvedValue(mockBrowser as any);

            const docxBuffer = Buffer.from('mock-docx-content');
            const result = await engine.convertDOCXToPDF(docxBuffer);

            expect(result.success).toBe(true);
            expect(result.inputFormat).toBe('docx');
            expect(result.outputFormat).toBe('pdf');
            expect(result.originalSize).toBe(docxBuffer.length);
            expect(result.outputBuffer).toBeDefined();
            expect(mammoth.convertToHtml).toHaveBeenCalled();
        });

        it('should convert DOCX with custom options', async () => {
            const mammoth = await import('mammoth');
            vi.mocked(mammoth.convertToHtml).mockResolvedValue({
                value: '<p>Test content</p>',
                messages: []
            });

            const mockPuppeteer = await import('puppeteer');

            // Create a simple PDF buffer for testing
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            pdfDoc.addPage();
            const validPdfBuffer = await pdfDoc.save();

            const mockBrowser = {
                newPage: vi.fn().mockResolvedValue({
                    setContent: vi.fn(),
                    pdf: vi.fn().mockResolvedValue(validPdfBuffer),
                    close: vi.fn()
                }),
                close: vi.fn()
            };
            vi.mocked(mockPuppeteer.default.launch).mockResolvedValue(mockBrowser as any);

            const options: DOCXConversionOptions = {
                preserveFormatting: false,
                includeImages: false,
                pageSize: 'Letter',
                orientation: 'landscape',
                imageQuality: 75
            };

            const docxBuffer = Buffer.from('mock-docx-content');
            const result = await engine.convertDOCXToPDF(docxBuffer, options);

            expect(result.success).toBe(true);
            expect(mammoth.convertToHtml).toHaveBeenCalledWith(
                { buffer: docxBuffer },
                expect.objectContaining({
                    includeDefaultStyleMap: false,
                    includeEmbeddedStyleMap: false,
                    convertImage: undefined
                })
            );
        });

        it('should handle DOCX conversion errors', async () => {
            const mammoth = await import('mammoth');
            vi.mocked(mammoth.convertToHtml).mockRejectedValue(new Error('Mammoth error'));

            const docxBuffer = Buffer.from('invalid-docx-content');

            await expect(engine.convertDOCXToPDF(docxBuffer)).rejects.toThrow(DOCXConversionError);
        });

        it('should validate DOCX conversion options', async () => {
            const mammoth = await import('mammoth');
            vi.mocked(mammoth.convertToHtml).mockResolvedValue({
                value: '<p>Test content</p>',
                messages: []
            });

            const mockPuppeteer = await import('puppeteer');
            const mockBrowser = {
                newPage: vi.fn().mockResolvedValue({
                    setContent: vi.fn(),
                    pdf: vi.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
                    close: vi.fn()
                }),
                close: vi.fn()
            };
            vi.mocked(mockPuppeteer.default.launch).mockResolvedValue(mockBrowser as any);

            const invalidOptions = {
                imageQuality: 150 // Invalid: should be 1-100
            } as DOCXConversionOptions;

            const docxBuffer = Buffer.from('mock-docx-content');

            await expect(engine.convertDOCXToPDF(docxBuffer, invalidOptions)).rejects.toThrow();
        });
    });

    describe('HTML to PDF Conversion', () => {
        it('should convert HTML to PDF with default options', async () => {
            const mockPuppeteer = await import('puppeteer');

            // Create a simple PDF buffer for testing
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            pdfDoc.addPage();
            const validPdfBuffer = await pdfDoc.save();

            const mockPage = {
                setContent: vi.fn(),
                pdf: vi.fn().mockResolvedValue(validPdfBuffer),
                close: vi.fn()
            };
            const mockBrowser = {
                newPage: vi.fn().mockResolvedValue(mockPage),
                close: vi.fn()
            };
            vi.mocked(mockPuppeteer.default.launch).mockResolvedValue(mockBrowser as any);

            const htmlContent = '<html><body><h1>Test</h1></body></html>';
            const result = await engine.convertHTMLToPDF(htmlContent);

            expect(result.success).toBe(true);
            expect(result.inputFormat).toBe('html');
            expect(result.outputFormat).toBe('pdf');
            expect(result.outputBuffer).toBeDefined();
            expect(mockPage.setContent).toHaveBeenCalledWith(
                htmlContent,
                expect.objectContaining({
                    waitUntil: 'networkidle0'
                })
            );
        });

        it('should convert HTML with custom options', async () => {
            const mockPuppeteer = await import('puppeteer');

            // Create a simple PDF buffer for testing
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            pdfDoc.addPage();
            const validPdfBuffer = await pdfDoc.save();

            const mockPage = {
                setContent: vi.fn(),
                waitForSelector: vi.fn(),
                pdf: vi.fn().mockResolvedValue(validPdfBuffer),
                close: vi.fn()
            };
            const mockBrowser = {
                newPage: vi.fn().mockResolvedValue(mockPage),
                close: vi.fn()
            };
            vi.mocked(mockPuppeteer.default.launch).mockResolvedValue(mockBrowser as any);

            const options: HTMLConversionOptions = {
                pageSize: 'A3',
                orientation: 'landscape',
                printBackground: false,
                waitForSelector: '.content',
                timeout: 10000
            };

            const htmlContent = '<html><body><div class="content">Test</div></body></html>';
            const result = await engine.convertHTMLToPDF(htmlContent, options);

            expect(result.success).toBe(true);
            expect(mockPage.waitForSelector).toHaveBeenCalledWith('.content', {
                timeout: 10000
            });
        });

        it('should handle HTML conversion errors', async () => {
            const mockPuppeteer = await import('puppeteer');
            vi.mocked(mockPuppeteer.default.launch).mockRejectedValue(new Error('Puppeteer error'));

            const htmlContent = '<html><body><h1>Test</h1></body></html>';

            await expect(engine.convertHTMLToPDF(htmlContent)).rejects.toThrow(HTMLConversionError);
        });
    });

    describe('Image to PDF Conversion', () => {
        it('should convert image to PDF with default options', async () => {
            const sharp = await import('sharp');

            // Create a minimal PNG buffer for testing
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
                0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
                0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
                0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
                0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
            ]);

            const mockSharp = {
                metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
                toBuffer: vi.fn().mockResolvedValue(pngBuffer)
            };
            vi.mocked(sharp.default).mockReturnValue(mockSharp as any);

            const result = await engine.convertImageToPDF(pngBuffer, 'png');

            expect(result.success).toBe(true);
            expect(result.inputFormat).toBe('png');
            expect(result.outputFormat).toBe('pdf');
            expect(result.metadata?.hasImages).toBe(true);
            expect(result.metadata?.pageCount).toBe(1);
        });

        it('should convert image with custom options', async () => {
            const sharp = await import('sharp');

            // Create a minimal PNG buffer for testing
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
                0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
                0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
                0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
                0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
            ]);

            const mockSharp = {
                metadata: vi.fn().mockResolvedValue({ width: 1200, height: 800 }),
                png: vi.fn().mockReturnThis(),
                toBuffer: vi.fn().mockResolvedValue(pngBuffer)
            };
            vi.mocked(sharp.default).mockReturnValue(mockSharp as any);

            const options: ImageConversionOptions = {
                pageSize: 'Letter',
                orientation: 'landscape',
                imageQuality: 80,
                fitToPage: true,
                maintainAspectRatio: true,
                centerImage: true
            };

            const result = await engine.convertImageToPDF(pngBuffer, 'png', options);

            expect(result.success).toBe(true);
            expect(mockSharp.png).toHaveBeenCalledWith({ quality: 80 });
        });

        it('should handle image conversion errors', async () => {
            const sharp = await import('sharp');
            vi.mocked(sharp.default).mockImplementation(() => {
                throw new Error('Sharp error');
            });

            const imageBuffer = Buffer.from('invalid-image-content');

            await expect(engine.convertImageToPDF(imageBuffer, 'png')).rejects.toThrow(ImageConversionError);
        });

        it('should handle images without dimensions', async () => {
            const sharp = await import('sharp');
            const mockSharp = {
                metadata: vi.fn().mockResolvedValue({ width: undefined, height: undefined })
            };
            vi.mocked(sharp.default).mockReturnValue(mockSharp as any);

            const imageBuffer = Buffer.from('mock-image-content');

            await expect(engine.convertImageToPDF(imageBuffer, 'png')).rejects.toThrow(ImageConversionError);
        });
    });

    describe('PDF to PDF/A Conversion', () => {
        it('should convert PDF to PDF/A with required options', async () => {
            const options: PDFAConversionOptions = {
                conformanceLevel: 'pdf-a1b',
                embedFonts: true,
                embedColorProfile: true,
                validateCompliance: true
            };

            // Create a simple PDF for testing
            const pdfDoc = await PDFDocument.create();
            pdfDoc.addPage();
            const pdfBuffer = await pdfDoc.save();

            const result = await engine.convertToPDFA(Buffer.from(pdfBuffer), options);

            expect(result.success).toBe(true);
            expect(result.inputFormat).toBe('pdf');
            expect(result.outputFormat).toBe('pdf-a1');
            expect(result.metadata?.pdfVersion).toBe('1.4');
            expect(result.warnings).toContain('PDF/A compliance validation is simplified in this implementation');
        });

        it('should convert PDF to PDF/A with metadata', async () => {
            const options: PDFAConversionOptions = {
                conformanceLevel: 'pdf-a2b',
                metadata: {
                    title: 'Test Document',
                    author: 'Test Author',
                    subject: 'Test Subject',
                    keywords: ['test', 'pdf'],
                    creator: 'Test Creator'
                }
            };

            const pdfDoc = await PDFDocument.create();
            pdfDoc.addPage();
            const pdfBuffer = await pdfDoc.save();

            const result = await engine.convertToPDFA(Buffer.from(pdfBuffer), options);

            expect(result.success).toBe(true);
            expect(result.outputFormat).toBe('pdf-a2');
            expect(result.metadata?.pdfVersion).toBe('1.7');
        });

        it('should handle PDF/A conversion errors', async () => {
            const options: PDFAConversionOptions = {
                conformanceLevel: 'pdf-a1b'
            };

            const invalidPdfBuffer = Buffer.from('invalid-pdf-content');

            await expect(engine.convertToPDFA(invalidPdfBuffer, options)).rejects.toThrow(PDFAConversionError);
        });
    });

    describe('Batch Conversion', () => {
        it('should perform batch conversion sequentially', async () => {
            const sharp = await import('sharp');

            // Create a minimal PNG buffer for testing
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
                0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
                0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
                0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
                0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
            ]);

            const mockSharp = {
                metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
                toBuffer: vi.fn().mockResolvedValue(pngBuffer)
            };
            vi.mocked(sharp.default).mockReturnValue(mockSharp as any);

            const batchOptions: BatchConversionOptions = {
                inputFormat: 'png',
                outputFormat: 'pdf',
                files: [
                    { name: 'image1.png', buffer: pngBuffer },
                    { name: 'image2.png', buffer: pngBuffer }
                ],
                parallelProcessing: false
            };

            const result = await engine.batchConvert(batchOptions);

            expect(result.success).toBe(true);
            expect(result.results).toHaveLength(2);
            expect(result.successCount).toBe(2);
            expect(result.failureCount).toBe(0);
            expect(result.results[0].fileName).toBe('image1.png');
            expect(result.results[1].fileName).toBe('image2.png');
        });

        it('should perform batch conversion in parallel', async () => {
            const sharp = await import('sharp');

            // Create a minimal PNG buffer for testing
            const pngBuffer = Buffer.from([
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
                0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE,
                0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
                0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
                0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND chunk
            ]);

            const mockSharp = {
                metadata: vi.fn().mockResolvedValue({ width: 800, height: 600 }),
                toBuffer: vi.fn().mockResolvedValue(pngBuffer)
            };
            vi.mocked(sharp.default).mockReturnValue(mockSharp as any);

            const batchOptions: BatchConversionOptions = {
                inputFormat: 'png',
                outputFormat: 'pdf',
                files: [
                    { name: 'image1.png', buffer: pngBuffer },
                    { name: 'image2.png', buffer: pngBuffer },
                    { name: 'image3.png', buffer: pngBuffer }
                ],
                parallelProcessing: true,
                maxConcurrency: 2
            };

            const result = await engine.batchConvert(batchOptions);

            expect(result.success).toBe(true);
            expect(result.results).toHaveLength(3);
            expect(result.successCount).toBe(3);
            expect(result.failureCount).toBe(0);
        });

        it('should handle batch conversion with failures', async () => {
            const sharp = await import('sharp');
            vi.mocked(sharp.default).mockImplementation(() => {
                throw new Error('Sharp error');
            });

            const batchOptions: BatchConversionOptions = {
                inputFormat: 'png',
                outputFormat: 'pdf',
                files: [
                    { name: 'image1.png', buffer: Buffer.from('image1-content') },
                    { name: 'image2.png', buffer: Buffer.from('image2-content') }
                ]
            };

            const result = await engine.batchConvert(batchOptions);

            expect(result.success).toBe(false);
            expect(result.successCount).toBe(0);
            expect(result.failureCount).toBe(2);
            expect(result.results[0].success).toBe(false);
            expect(result.results[0].error).toBeDefined();
        });
    });

    describe('Conversion Support Validation', () => {
        it('should validate supported conversions', async () => {
            expect(await engine.validateConversionSupport('docx', 'pdf')).toBe(true);
            expect(await engine.validateConversionSupport('html', 'pdf-a1')).toBe(true);
            expect(await engine.validateConversionSupport('png', 'pdf-a2')).toBe(true);
            expect(await engine.validateConversionSupport('jpg', 'pdf-a3')).toBe(true);
        });

        it('should reject unsupported conversions', async () => {
            // Note: All current formats support PDF conversion, so this test uses a hypothetical format
            expect(await engine.validateConversionSupport('xyz' as any, 'pdf')).toBe(false);
        });
    });

    describe('Conversion Requirements Analysis', () => {
        it('should analyze DOCX conversion requirements', async () => {
            const JSZip = await import('jszip');
            const mockZip = {
                files: {
                    'word/media/image1.png': {},
                    'word/styles.xml': {}
                }
            };
            vi.mocked(JSZip.default.loadAsync).mockResolvedValue(mockZip as any);

            const docxBuffer = Buffer.from('mock-docx-content');
            const analysis = await engine.analyzeConversionRequirements(docxBuffer, 'docx');

            expect(analysis.processingComplexity).toBe('high');
            expect(analysis.supportedOutputFormats).toContain('pdf');
            expect(analysis.supportedOutputFormats).toContain('pdf-a1');
            expect(analysis.warnings).toContain('Document contains images - conversion may take longer');
            expect(analysis.warnings).toContain('Document has complex formatting - some elements may not convert perfectly');
        });

        it('should analyze HTML conversion requirements', async () => {
            const htmlBuffer = Buffer.from('<html><body><img src="test.png"><script>alert("test")</script></body></html>');
            const analysis = await engine.analyzeConversionRequirements(htmlBuffer, 'html');

            expect(analysis.processingComplexity).toBe('medium');
            expect(analysis.warnings).toContain('HTML contains images - ensure all image URLs are accessible');
            expect(analysis.warnings).toContain('HTML contains JavaScript - dynamic content may not render correctly');
        });

        it('should analyze image conversion requirements', async () => {
            const imageBuffer = Buffer.from('mock-image-content');
            const analysis = await engine.analyzeConversionRequirements(imageBuffer, 'png');

            expect(analysis.processingComplexity).toBe('low');
            expect(analysis.supportedOutputFormats).toContain('pdf');
        });

        it('should analyze large image conversion requirements', async () => {
            const largeImageBuffer = Buffer.alloc(15 * 1024 * 1024); // 15MB
            const analysis = await engine.analyzeConversionRequirements(largeImageBuffer, 'png');

            expect(analysis.processingComplexity).toBe('medium');
            expect(analysis.warnings).toContain('Large image file - consider optimizing before conversion');
        });

        it('should handle analysis errors gracefully', async () => {
            const JSZip = await import('jszip');
            vi.mocked(JSZip.default.loadAsync).mockRejectedValue(new Error('ZIP error'));

            const docxBuffer = Buffer.from('invalid-docx-content');
            const analysis = await engine.analyzeConversionRequirements(docxBuffer, 'docx');

            expect(analysis.warnings).toContain('Unable to analyze DOCX structure');
        });
    });

    describe('Resource Cleanup', () => {
        it('should cleanup resources properly', async () => {
            const mockPuppeteer = await import('puppeteer');

            // Create a simple PDF buffer for testing
            const { PDFDocument } = await import('pdf-lib');
            const pdfDoc = await PDFDocument.create();
            pdfDoc.addPage();
            const validPdfBuffer = await pdfDoc.save();

            const mockBrowser = {
                newPage: vi.fn().mockResolvedValue({
                    setContent: vi.fn(),
                    pdf: vi.fn().mockResolvedValue(validPdfBuffer),
                    close: vi.fn()
                }),
                close: vi.fn()
            };
            vi.mocked(mockPuppeteer.default.launch).mockResolvedValue(mockBrowser as any);

            // Trigger browser initialization
            await engine.convertHTMLToPDF('<html><body>Test</body></html>');

            // Cleanup should close the browser
            await engine.cleanup();

            expect(mockBrowser.close).toHaveBeenCalled();
        });

        it('should handle cleanup when no browser is initialized', async () => {
            // Should not throw error when no browser to cleanup
            await expect(engine.cleanup()).resolves.not.toThrow();
        });
    });

    describe('Error Handling', () => {
        it('should throw PDFConversionError for unsupported formats in batch conversion', async () => {
            const batchOptions: BatchConversionOptions = {
                inputFormat: 'xyz' as any,
                outputFormat: 'pdf',
                files: [
                    { name: 'test.xyz', buffer: Buffer.from('test-content') }
                ]
            };

            const result = await engine.batchConvert(batchOptions);

            expect(result.success).toBe(false);
            expect(result.failureCount).toBe(1);
            expect(result.results[0].success).toBe(false);
            expect(result.results[0].error).toContain('Unsupported input format');
        });
    });
});