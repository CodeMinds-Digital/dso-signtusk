import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import * as mammoth from 'mammoth';
import puppeteer, { Browser } from 'puppeteer';
import sharp from 'sharp';
import JSZip from 'jszip';
import { z } from 'zod';
import {
    PDFConversionEngine,
    ConversionResult,
    DOCXConversionOptions,
    HTMLConversionOptions,
    ImageConversionOptions,
    PDFAConversionOptions,
    BatchConversionOptions,
    BatchConversionResult,
    ConversionInputFormat,
    ConversionOutputFormat,
    PDFConversionError,
    DOCXConversionError,
    HTMLConversionError,
    ImageConversionError,
    PDFAConversionError
} from './types';

/**
 * Validation schemas for conversion options
 */
const DOCXConversionOptionsSchema = z.object({
    preserveFormatting: z.boolean().default(true),
    includeImages: z.boolean().default(true),
    includeHeaders: z.boolean().default(true),
    includeFooters: z.boolean().default(true),
    pageMargins: z.object({
        top: z.number().min(0).max(100).default(20),
        bottom: z.number().min(0).max(100).default(20),
        left: z.number().min(0).max(100).default(20),
        right: z.number().min(0).max(100).default(20)
    }).optional(),
    pageSize: z.enum(['A4', 'Letter', 'Legal', 'A3', 'A5']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    imageQuality: z.number().min(1).max(100).default(85),
    fontEmbedding: z.boolean().default(true)
}).optional();

const HTMLConversionOptionsSchema = z.object({
    pageSize: z.enum(['A4', 'Letter', 'Legal', 'A3', 'A5']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    margins: z.object({
        top: z.string().default('1in'),
        bottom: z.string().default('1in'),
        left: z.string().default('1in'),
        right: z.string().default('1in')
    }).optional(),
    printBackground: z.boolean().default(true),
    displayHeaderFooter: z.boolean().default(false),
    headerTemplate: z.string().optional(),
    footerTemplate: z.string().optional(),
    scale: z.number().min(0.1).max(2).default(1),
    waitForSelector: z.string().optional(),
    timeout: z.number().min(1000).max(60000).default(30000),
    baseUrl: z.string().url().optional()
}).optional();

const ImageConversionOptionsSchema = z.object({
    pageSize: z.enum(['A4', 'Letter', 'Legal', 'A3', 'A5']).default('A4'),
    orientation: z.enum(['portrait', 'landscape']).default('portrait'),
    fitToPage: z.boolean().default(true),
    maintainAspectRatio: z.boolean().default(true),
    imageQuality: z.number().min(1).max(100).default(85),
    compression: z.enum(['none', 'jpeg', 'flate']).default('jpeg'),
    margins: z.object({
        top: z.number().min(0).default(20),
        bottom: z.number().min(0).default(20),
        left: z.number().min(0).default(20),
        right: z.number().min(0).default(20)
    }).optional(),
    centerImage: z.boolean().default(true)
}).optional();

const PDFAConversionOptionsSchema = z.object({
    conformanceLevel: z.enum(['pdf-a1a', 'pdf-a1b', 'pdf-a2a', 'pdf-a2b', 'pdf-a2u', 'pdf-a3a', 'pdf-a3b', 'pdf-a3u']),
    embedFonts: z.boolean().default(true),
    embedColorProfile: z.boolean().default(true),
    validateCompliance: z.boolean().default(true),
    metadata: z.object({
        title: z.string().optional(),
        author: z.string().optional(),
        subject: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        creator: z.string().optional()
    }).optional()
});

/**
 * PDF Conversion Engine Implementation
 * 
 * Provides comprehensive PDF conversion capabilities including:
 * - DOCX to PDF with formatting preservation
 * - HTML to PDF for web content
 * - Image to PDF with optimization
 * - PDF to PDF/A for long-term archival
 */
export class PDFConversionEngineImpl implements PDFConversionEngine {
    private puppeteerBrowser?: Browser;

    constructor() {
        // Initialize browser lazily for HTML conversion
    }

    /**
     * Convert DOCX to PDF with formatting preservation
     */
    async convertDOCXToPDF(
        docxBuffer: Buffer,
        options?: DOCXConversionOptions
    ): Promise<ConversionResult> {
        const startTime = Date.now();
        const validatedOptions = DOCXConversionOptionsSchema.parse(options);

        try {
            // Extract HTML from DOCX using mammoth
            const result = await mammoth.convertToHtml(
                { buffer: docxBuffer },
                {
                    includeDefaultStyleMap: validatedOptions?.preserveFormatting,
                    includeEmbeddedStyleMap: validatedOptions?.preserveFormatting,
                    convertImage: validatedOptions?.includeImages ? mammoth.images.imgElement((image) => {
                        return image.read("base64").then((imageBuffer) => {
                            return {
                                src: `data:${image.contentType};base64,${imageBuffer}`
                            };
                        });
                    }) : undefined
                }
            );

            // Convert extracted HTML to PDF
            const htmlConversionOptions: HTMLConversionOptions = {
                pageSize: validatedOptions?.pageSize,
                orientation: validatedOptions?.orientation,
                margins: validatedOptions?.pageMargins ? {
                    top: `${validatedOptions.pageMargins.top}mm`,
                    bottom: `${validatedOptions.pageMargins.bottom}mm`,
                    left: `${validatedOptions.pageMargins.left}mm`,
                    right: `${validatedOptions.pageMargins.right}mm`
                } : undefined,
                printBackground: true
            };

            const htmlResult = await this.convertHTMLToPDF(result.value, htmlConversionOptions);

            if (!htmlResult.success || !htmlResult.outputBuffer) {
                throw new DOCXConversionError('Failed to convert DOCX content to PDF', {
                    htmlErrors: htmlResult.error,
                    mammothMessages: result.messages
                });
            }

            return {
                success: true,
                outputBuffer: htmlResult.outputBuffer,
                inputFormat: 'docx',
                outputFormat: 'pdf',
                originalSize: docxBuffer.length,
                convertedSize: htmlResult.outputBuffer.length,
                processingTime: Date.now() - startTime,
                metadata: {
                    pageCount: htmlResult.metadata?.pageCount,
                    hasImages: validatedOptions?.includeImages && result.messages.some(m => m.message.includes('image')),
                    hasFonts: validatedOptions?.fontEmbedding,
                    pdfVersion: '1.7'
                },
                warnings: result.messages.map(m => m.message)
            };

        } catch (error) {
            throw new DOCXConversionError(
                `DOCX conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                { originalError: error }
            );
        }
    }

    /**
     * Convert HTML to PDF for web content
     */
    async convertHTMLToPDF(
        htmlContent: string,
        options?: HTMLConversionOptions
    ): Promise<ConversionResult> {
        const startTime = Date.now();
        const validatedOptions = HTMLConversionOptionsSchema.parse(options);

        try {
            // Initialize browser if not already done
            if (!this.puppeteerBrowser) {
                this.puppeteerBrowser = await puppeteer.launch({
                    headless: true,
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });
            }

            const page = await this.puppeteerBrowser.newPage();

            try {
                // Set content and wait for rendering
                await page.setContent(htmlContent, {
                    waitUntil: 'networkidle0',
                    timeout: validatedOptions?.timeout
                });

                // Wait for specific selector if provided
                if (validatedOptions?.waitForSelector) {
                    await page.waitForSelector(validatedOptions.waitForSelector, {
                        timeout: validatedOptions.timeout
                    });
                }

                // Configure page format
                const pageFormat = this.getPageFormat(validatedOptions?.pageSize, validatedOptions?.orientation);

                // Generate PDF
                const pdfBuffer = await page.pdf({
                    format: pageFormat.format as any,
                    landscape: pageFormat.landscape,
                    margin: validatedOptions?.margins,
                    printBackground: validatedOptions?.printBackground,
                    displayHeaderFooter: validatedOptions?.displayHeaderFooter,
                    headerTemplate: validatedOptions?.headerTemplate,
                    footerTemplate: validatedOptions?.footerTemplate,
                    scale: validatedOptions?.scale
                });

                // Get page count from PDF
                const pdfDoc = await PDFDocument.load(pdfBuffer);
                const pageCount = pdfDoc.getPageCount();

                return {
                    success: true,
                    outputBuffer: Buffer.from(pdfBuffer),
                    inputFormat: 'html',
                    outputFormat: 'pdf',
                    originalSize: Buffer.byteLength(htmlContent, 'utf8'),
                    convertedSize: pdfBuffer.length,
                    processingTime: Date.now() - startTime,
                    metadata: {
                        pageCount,
                        hasImages: htmlContent.includes('<img'),
                        pdfVersion: '1.4'
                    }
                };

            } finally {
                await page.close();
            }

        } catch (error) {
            throw new HTMLConversionError(
                `HTML conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                { originalError: error }
            );
        }
    }

    /**
     * Convert image to PDF with optimization
     */
    async convertImageToPDF(
        imageBuffer: Buffer,
        imageFormat: 'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'tiff' | 'svg',
        options?: ImageConversionOptions
    ): Promise<ConversionResult> {
        const startTime = Date.now();
        const validatedOptions = ImageConversionOptionsSchema.parse(options);

        try {
            // Process image with Sharp
            let processedImage = sharp(imageBuffer);

            // Get image metadata
            const metadata = await processedImage.metadata();
            if (!metadata.width || !metadata.height) {
                throw new ImageConversionError(
                    'Unable to determine image dimensions',
                    imageFormat as ConversionInputFormat
                );
            }

            // Apply quality settings
            if (validatedOptions?.imageQuality && validatedOptions.imageQuality < 100) {
                if (imageFormat === 'jpg' || imageFormat === 'jpeg') {
                    processedImage = processedImage.jpeg({ quality: validatedOptions.imageQuality });
                } else {
                    processedImage = processedImage.png({ quality: validatedOptions.imageQuality });
                }
            }

            // Convert to buffer
            const processedBuffer = await processedImage.toBuffer();

            // Create PDF document
            const pdfDoc = await PDFDocument.create();
            const pageFormat = this.getPageDimensions(validatedOptions?.pageSize, validatedOptions?.orientation);

            // Calculate image dimensions for PDF
            const imageDimensions = this.calculateImageDimensions(
                metadata.width,
                metadata.height,
                pageFormat.width,
                pageFormat.height,
                validatedOptions?.fitToPage,
                validatedOptions?.maintainAspectRatio,
                validatedOptions?.margins
            );

            // Add page and embed image
            const page = pdfDoc.addPage([pageFormat.width, pageFormat.height]);

            let pdfImage;
            if (imageFormat === 'png') {
                pdfImage = await pdfDoc.embedPng(processedBuffer);
            } else {
                pdfImage = await pdfDoc.embedJpg(processedBuffer);
            }

            // Position image on page
            const x = validatedOptions?.centerImage
                ? (pageFormat.width - imageDimensions.width) / 2
                : (validatedOptions?.margins?.left || 0);

            const y = validatedOptions?.centerImage
                ? (pageFormat.height - imageDimensions.height) / 2
                : pageFormat.height - imageDimensions.height - (validatedOptions?.margins?.top || 0);

            page.drawImage(pdfImage, {
                x,
                y,
                width: imageDimensions.width,
                height: imageDimensions.height
            });

            // Generate PDF buffer
            const pdfBuffer = await pdfDoc.save();

            return {
                success: true,
                outputBuffer: Buffer.from(pdfBuffer),
                inputFormat: imageFormat as ConversionInputFormat,
                outputFormat: 'pdf',
                originalSize: imageBuffer.length,
                convertedSize: pdfBuffer.length,
                processingTime: Date.now() - startTime,
                metadata: {
                    pageCount: 1,
                    hasImages: true,
                    pdfVersion: '1.7'
                }
            };

        } catch (error) {
            throw new ImageConversionError(
                `Image conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                imageFormat as ConversionInputFormat,
                { originalError: error }
            );
        }
    }

    /**
     * Convert PDF to PDF/A for long-term archival
     */
    async convertToPDFA(
        pdfBuffer: Buffer,
        options: PDFAConversionOptions
    ): Promise<ConversionResult> {
        const startTime = Date.now();
        const validatedOptions = PDFAConversionOptionsSchema.parse(options);

        try {
            // Load existing PDF
            const pdfDoc = await PDFDocument.load(pdfBuffer);

            // Set PDF/A metadata
            if (validatedOptions.metadata) {
                if (validatedOptions.metadata.title) {
                    pdfDoc.setTitle(validatedOptions.metadata.title);
                }
                if (validatedOptions.metadata.author) {
                    pdfDoc.setAuthor(validatedOptions.metadata.author);
                }
                if (validatedOptions.metadata.subject) {
                    pdfDoc.setSubject(validatedOptions.metadata.subject);
                }
                if (validatedOptions.metadata.keywords) {
                    pdfDoc.setKeywords(validatedOptions.metadata.keywords);
                }
                if (validatedOptions.metadata.creator) {
                    pdfDoc.setCreator(validatedOptions.metadata.creator);
                }
            }

            // Set creation and modification dates
            const now = new Date();
            pdfDoc.setCreationDate(now);
            pdfDoc.setModificationDate(now);

            // Embed standard fonts if font embedding is enabled
            if (validatedOptions.embedFonts) {
                // Note: In a real implementation, you would need to:
                // 1. Analyze existing fonts in the document
                // 2. Ensure all fonts are embedded
                // 3. Replace non-embeddable fonts with embeddable alternatives
                // This is a simplified implementation
                await pdfDoc.embedFont(StandardFonts.Helvetica);
            }

            // Add PDF/A compliance metadata
            // Note: This is a simplified implementation. Full PDF/A compliance requires:
            // 1. Color profile embedding
            // 2. Font embedding validation
            // 3. Metadata schema compliance
            // 4. Structure validation
            // 5. Accessibility features

            // Generate PDF/A buffer
            const pdfABuffer = await pdfDoc.save({
                useObjectStreams: false, // PDF/A requirement
                addDefaultPage: false
            });

            // Validate compliance if requested
            const warnings: string[] = [];
            if (validatedOptions.validateCompliance) {
                warnings.push('PDF/A compliance validation is simplified in this implementation');
                warnings.push('Full compliance requires specialized PDF/A validation tools');
            }

            return {
                success: true,
                outputBuffer: Buffer.from(pdfABuffer),
                inputFormat: 'pdf',
                outputFormat: this.getPDFAOutputFormat(validatedOptions.conformanceLevel),
                originalSize: pdfBuffer.length,
                convertedSize: pdfABuffer.length,
                processingTime: Date.now() - startTime,
                metadata: {
                    pageCount: pdfDoc.getPageCount(),
                    hasImages: true, // Assume images present
                    hasFonts: validatedOptions.embedFonts,
                    colorSpace: 'RGB', // Simplified
                    pdfVersion: this.getPDFVersionForConformance(validatedOptions.conformanceLevel)
                },
                warnings
            };

        } catch (error) {
            throw new PDFAConversionError(
                `PDF/A conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                { originalError: error }
            );
        }
    }

    /**
     * Batch convert multiple files
     */
    async batchConvert(
        batchOptions: BatchConversionOptions
    ): Promise<BatchConversionResult> {
        const startTime = Date.now();
        const results: Array<ConversionResult & { fileName: string }> = [];
        let successCount = 0;
        let failureCount = 0;
        let totalOriginalSize = 0;
        let totalConvertedSize = 0;

        const processFile = async (file: typeof batchOptions.files[0]) => {
            try {
                let result: ConversionResult;

                switch (batchOptions.inputFormat) {
                    case 'docx':
                        result = await this.convertDOCXToPDF(
                            file.buffer,
                            file.options as DOCXConversionOptions
                        );
                        break;
                    case 'html':
                        result = await this.convertHTMLToPDF(
                            file.buffer.toString('utf8'),
                            file.options as HTMLConversionOptions
                        );
                        break;
                    case 'png':
                    case 'jpg':
                    case 'jpeg':
                    case 'gif':
                    case 'bmp':
                    case 'tiff':
                    case 'svg':
                        result = await this.convertImageToPDF(
                            file.buffer,
                            batchOptions.inputFormat,
                            file.options as ImageConversionOptions
                        );
                        break;
                    default:
                        throw new PDFConversionError(
                            `Unsupported input format: ${batchOptions.inputFormat}`,
                            batchOptions.inputFormat,
                            batchOptions.outputFormat
                        );
                }

                if (result.success) {
                    successCount++;
                    totalConvertedSize += result.convertedSize;
                } else {
                    failureCount++;
                }

                totalOriginalSize += result.originalSize;

                return { ...result, fileName: file.name };

            } catch (error) {
                failureCount++;
                totalOriginalSize += file.buffer.length;

                return {
                    success: false,
                    fileName: file.name,
                    inputFormat: batchOptions.inputFormat,
                    outputFormat: batchOptions.outputFormat,
                    originalSize: file.buffer.length,
                    convertedSize: 0,
                    processingTime: 0,
                    error: error instanceof Error ? error.message : 'Unknown error'
                };
            }
        };

        // Process files in parallel or sequentially
        if (batchOptions.parallelProcessing) {
            const concurrency = batchOptions.maxConcurrency || 3;
            const chunks = this.chunkArray(batchOptions.files, concurrency);

            for (const chunk of chunks) {
                const chunkResults = await Promise.all(chunk.map(processFile));
                results.push(...chunkResults);
            }
        } else {
            for (const file of batchOptions.files) {
                const result = await processFile(file);
                results.push(result);
            }
        }

        return {
            success: successCount > 0,
            results,
            totalProcessingTime: Date.now() - startTime,
            successCount,
            failureCount,
            totalOriginalSize,
            totalConvertedSize
        };
    }

    /**
     * Validate conversion capabilities for a given format
     */
    async validateConversionSupport(
        inputFormat: ConversionInputFormat,
        outputFormat: ConversionOutputFormat
    ): Promise<boolean> {
        const supportedConversions: Record<ConversionInputFormat, ConversionOutputFormat[]> = {
            'docx': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'doc': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'html': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'png': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'jpg': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'jpeg': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'gif': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'bmp': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'tiff': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'svg': ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'],
            'pdf': ['pdf-a1', 'pdf-a2', 'pdf-a3']
        };

        return supportedConversions[inputFormat]?.includes(outputFormat) || false;
    }

    /**
     * Get conversion metadata without performing conversion
     */
    async analyzeConversionRequirements(
        inputBuffer: Buffer,
        inputFormat: ConversionInputFormat
    ): Promise<{
        estimatedOutputSize: number;
        processingComplexity: 'low' | 'medium' | 'high';
        supportedOutputFormats: ConversionOutputFormat[];
        warnings: string[];
    }> {
        const warnings: string[] = [];
        let processingComplexity: 'low' | 'medium' | 'high' = 'low';
        let estimatedOutputSize = inputBuffer.length;

        // Analyze based on input format
        switch (inputFormat) {
            case 'docx':
            case 'doc':
                processingComplexity = 'high';
                estimatedOutputSize = Math.floor(inputBuffer.length * 1.2); // DOCX typically expands

                // Check for complex content
                try {
                    const zip = await JSZip.loadAsync(inputBuffer);
                    const hasImages = Object.keys(zip.files).some(name => name.includes('media/'));
                    const hasComplexFormatting = Object.keys(zip.files).some(name => name.includes('styles.xml'));

                    if (hasImages) {
                        warnings.push('Document contains images - conversion may take longer');
                        estimatedOutputSize = Math.floor(estimatedOutputSize * 1.5);
                    }

                    if (hasComplexFormatting) {
                        warnings.push('Document has complex formatting - some elements may not convert perfectly');
                    }
                } catch {
                    warnings.push('Unable to analyze DOCX structure');
                }
                break;

            case 'html':
                processingComplexity = 'medium';
                estimatedOutputSize = Math.floor(inputBuffer.length * 0.8);

                const htmlContent = inputBuffer.toString('utf8');
                if (htmlContent.includes('<img')) {
                    warnings.push('HTML contains images - ensure all image URLs are accessible');
                }
                if (htmlContent.includes('<script')) {
                    warnings.push('HTML contains JavaScript - dynamic content may not render correctly');
                }
                break;

            case 'png':
            case 'jpg':
            case 'jpeg':
            case 'gif':
            case 'bmp':
            case 'tiff':
            case 'svg':
                processingComplexity = 'low';
                estimatedOutputSize = Math.floor(inputBuffer.length * 1.1); // Slight overhead for PDF structure

                if (inputBuffer.length > 10 * 1024 * 1024) { // 10MB
                    warnings.push('Large image file - consider optimizing before conversion');
                    processingComplexity = 'medium';
                }
                break;

            case 'pdf':
                processingComplexity = 'medium';
                estimatedOutputSize = Math.floor(inputBuffer.length * 1.05); // PDF/A conversion has minimal overhead

                if (inputBuffer.length > 50 * 1024 * 1024) { // 50MB
                    warnings.push('Large PDF file - PDF/A conversion may take longer');
                    processingComplexity = 'high';
                }
                warnings.push('PDF/A conversion requires compliance validation');
                break;
        }

        // Get supported output formats based on input format
        const supportedFormats: ConversionOutputFormat[] = inputFormat === 'pdf'
            ? ['pdf-a1', 'pdf-a2', 'pdf-a3']
            : ['pdf', 'pdf-a1', 'pdf-a2', 'pdf-a3'];

        return {
            estimatedOutputSize,
            processingComplexity,
            supportedOutputFormats: supportedFormats,
            warnings
        };
    }

    /**
     * Cleanup resources
     */
    async cleanup(): Promise<void> {
        if (this.puppeteerBrowser) {
            await this.puppeteerBrowser.close();
            this.puppeteerBrowser = undefined;
        }
    }

    // Helper methods

    private getPageFormat(pageSize?: string, orientation?: string) {
        const formats: Record<string, { format: string; landscape: boolean }> = {
            'A4-portrait': { format: 'A4', landscape: false },
            'A4-landscape': { format: 'A4', landscape: true },
            'Letter-portrait': { format: 'Letter', landscape: false },
            'Letter-landscape': { format: 'Letter', landscape: true },
            'Legal-portrait': { format: 'Legal', landscape: false },
            'Legal-landscape': { format: 'Legal', landscape: true },
            'A3-portrait': { format: 'A3', landscape: false },
            'A3-landscape': { format: 'A3', landscape: true },
            'A5-portrait': { format: 'A5', landscape: false },
            'A5-landscape': { format: 'A5', landscape: true }
        };

        const key = `${pageSize || 'A4'}-${orientation || 'portrait'}`;
        return formats[key] || formats['A4-portrait'];
    }

    private getPageDimensions(pageSize?: string, orientation?: string) {
        // Dimensions in points (1 inch = 72 points)
        const dimensions: Record<string, { width: number; height: number }> = {
            'A4': { width: 595, height: 842 },
            'Letter': { width: 612, height: 792 },
            'Legal': { width: 612, height: 1008 },
            'A3': { width: 842, height: 1191 },
            'A5': { width: 420, height: 595 }
        };

        const size = dimensions[pageSize || 'A4'];

        if (orientation === 'landscape') {
            return { width: size.height, height: size.width };
        }

        return size;
    }

    private calculateImageDimensions(
        imageWidth: number,
        imageHeight: number,
        pageWidth: number,
        pageHeight: number,
        fitToPage?: boolean,
        maintainAspectRatio?: boolean,
        margins?: { top: number; bottom: number; left: number; right: number }
    ) {
        const marginTop = margins?.top || 0;
        const marginBottom = margins?.bottom || 0;
        const marginLeft = margins?.left || 0;
        const marginRight = margins?.right || 0;

        const availableWidth = pageWidth - marginLeft - marginRight;
        const availableHeight = pageHeight - marginTop - marginBottom;

        if (!fitToPage) {
            return { width: Math.min(imageWidth, availableWidth), height: Math.min(imageHeight, availableHeight) };
        }

        if (!maintainAspectRatio) {
            return { width: availableWidth, height: availableHeight };
        }

        const aspectRatio = imageWidth / imageHeight;
        const availableAspectRatio = availableWidth / availableHeight;

        if (aspectRatio > availableAspectRatio) {
            // Image is wider relative to available space
            return {
                width: availableWidth,
                height: availableWidth / aspectRatio
            };
        } else {
            // Image is taller relative to available space
            return {
                width: availableHeight * aspectRatio,
                height: availableHeight
            };
        }
    }

    private getPDFAOutputFormat(conformanceLevel: string): ConversionOutputFormat {
        if (conformanceLevel.startsWith('pdf-a1')) return 'pdf-a1';
        if (conformanceLevel.startsWith('pdf-a2')) return 'pdf-a2';
        if (conformanceLevel.startsWith('pdf-a3')) return 'pdf-a3';
        return 'pdf-a1';
    }

    private getPDFVersionForConformance(conformanceLevel: string): string {
        if (conformanceLevel.startsWith('pdf-a1')) return '1.4';
        if (conformanceLevel.startsWith('pdf-a2')) return '1.7';
        if (conformanceLevel.startsWith('pdf-a3')) return '1.7';
        return '1.4';
    }

    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
}

/**
 * Factory function to create PDF Conversion Engine
 */
export function createPDFConversionEngine(): PDFConversionEngine {
    return new PDFConversionEngineImpl();
}

/**
 * Default export
 */
export default PDFConversionEngineImpl;