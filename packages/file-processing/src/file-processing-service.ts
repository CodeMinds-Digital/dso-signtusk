import { promises as fs } from 'fs';
import path from 'path';
import mimeTypes from 'mime-types';
import crypto from 'node:crypto';
import {
    FileProcessingService,
    SupportedFormat,
    ConversionOptions,
    ConversionResult,
    OCROptions,
    OCRResult,
    OCRLanguage,
    BatchProcessingOptions,
    BatchProcessingResult,
    ProcessingJob,
    ProcessingStatus,
    ConversionQuality,
    FileProcessingError,
    UnsupportedFormatError
} from './types';
import { DocumentConverterImpl } from './document-converter';
import { OCREngineImpl } from './ocr-engine';
import { BatchProcessorImpl } from './batch-processor';

export class FileProcessingServiceImpl implements FileProcessingService {
    private documentConverter: DocumentConverterImpl;
    private ocrEngine: OCREngineImpl;
    private batchProcessor: BatchProcessorImpl;

    constructor() {
        this.documentConverter = new DocumentConverterImpl();
        this.ocrEngine = new OCREngineImpl();
        this.batchProcessor = new BatchProcessorImpl();
    }

    async detectFormat(filePath: string): Promise<SupportedFormat> {
        try {
            // Check if file exists first
            await fs.access(filePath, fs.constants.R_OK);

            // Enhanced format detection with MIME type validation
            const ext = path.extname(filePath).toLowerCase().substring(1);
            const formatFromExt = this.extensionToFormat(ext);

            if (formatFromExt) {
                // Validate with MIME type if possible
                const mimeType = mimeTypes.lookup(filePath);
                if (mimeType) {
                    const formatFromMime = this.mimeTypeToFormat(mimeType);
                    if (formatFromMime && formatFromMime !== formatFromExt) {
                        // If MIME type suggests different format, do additional validation
                        const buffer = await fs.readFile(filePath);
                        const actualFormat = await this.detectFormatFromBuffer(buffer, formatFromExt, formatFromMime);
                        return actualFormat;
                    }
                }
                return formatFromExt;
            }

            throw new UnsupportedFormatError(`Cannot detect format for file: ${filePath}`);

        } catch (error) {
            if (error instanceof UnsupportedFormatError) {
                throw error;
            }
            throw new FileProcessingError(
                `Failed to detect file format: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'FORMAT_DETECTION_ERROR'
            );
        }
    }

    async validateFile(filePath: string, expectedFormat?: SupportedFormat): Promise<boolean> {
        try {
            // Enhanced file validation with security checks
            await fs.access(filePath, fs.constants.R_OK);

            const stats = await fs.stat(filePath);

            // Check if it's a file (not directory)
            if (!stats.isFile()) {
                return false;
            }

            // Enhanced size validation (not empty, not too large - 500MB limit for advanced processing)
            if (stats.size === 0 || stats.size > 500 * 1024 * 1024) {
                return false;
            }

            // Security check: validate file header for known formats
            if (expectedFormat) {
                const isValidHeader = await this.validateFileHeader(filePath, expectedFormat);
                if (!isValidHeader) {
                    return false;
                }
            }

            // If expected format is provided, validate against it
            if (expectedFormat) {
                const detectedFormat = await this.detectFormat(filePath);
                return detectedFormat === expectedFormat;
            }

            // Otherwise, check if format is supported
            const detectedFormat = await this.detectFormat(filePath);
            return this.documentConverter.getSupportedFormats().includes(detectedFormat);

        } catch (error) {
            return false;
        }
    }

    async convertDocument(
        inputPath: string,
        outputPath: string,
        options: ConversionOptions
    ): Promise<ConversionResult> {
        try {
            // Enhanced validation and preprocessing
            if (!await this.validateFile(inputPath)) {
                throw new FileProcessingError('Invalid input file', 'INVALID_INPUT');
            }

            const inputFormat = await this.detectFormat(inputPath);

            if (!this.documentConverter.canConvert(inputFormat, options.targetFormat)) {
                throw new UnsupportedFormatError(
                    `Cannot convert from ${inputFormat} to ${options.targetFormat}`
                );
            }

            // Enhanced conversion with quality preservation
            const result = await this.documentConverter.convert(
                inputPath,
                outputPath,
                inputFormat,
                options.targetFormat,
                options
            );

            // Post-processing validation
            if (result.success && result.outputPath) {
                const isValidOutput = await this.validateConversionOutput(result.outputPath, options.targetFormat);
                if (!isValidOutput) {
                    return {
                        ...result,
                        success: false,
                        error: 'Conversion output validation failed'
                    };
                }
            }

            return result;

        } catch (error) {
            if (error instanceof FileProcessingError || error instanceof UnsupportedFormatError) {
                throw error;
            }

            throw new FileProcessingError(
                `Document conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'CONVERSION_ERROR'
            );
        }
    }

    async performOCR(filePath: string, options: OCROptions): Promise<OCRResult> {
        try {
            // Enhanced OCR with preprocessing
            if (!await this.validateFile(filePath)) {
                throw new FileProcessingError('Invalid input file', 'INVALID_INPUT');
            }

            const format = await this.detectFormat(filePath);

            if (!this.isOCRApplicable(format)) {
                throw new UnsupportedFormatError(`OCR not supported for format: ${format}`);
            }

            // Enhanced OCR processing with automatic language detection if not specified
            let enhancedOptions = { ...options };
            if (options.languages.length === 0) {
                const detectedLanguages = await this.ocrEngine.detectLanguage(filePath);
                enhancedOptions.languages = detectedLanguages;
            }

            let result: OCRResult;

            if (this.isImageFormat(format)) {
                result = await this.ocrEngine.processImage(filePath, enhancedOptions);
            } else {
                result = await this.ocrEngine.processDocument(filePath, enhancedOptions);
            }

            // Post-processing: enhance results with confidence filtering
            if (result.success && result.words) {
                result.words = result.words.filter(word => word.confidence >= options.confidence);
                result.blocks = result.blocks?.filter(block => block.confidence >= options.confidence);
            }

            return result;

        } catch (error) {
            if (error instanceof FileProcessingError || error instanceof UnsupportedFormatError) {
                throw error;
            }

            throw new FileProcessingError(
                `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'OCR_ERROR'
            );
        }
    }

    async extractText(filePath: string): Promise<string> {
        try {
            // Enhanced text extraction with format-specific optimizations
            if (!await this.validateFile(filePath)) {
                throw new FileProcessingError('Invalid input file', 'INVALID_INPUT');
            }

            const format = await this.detectFormat(filePath);

            // For text-based formats, read directly with encoding detection
            if (format === SupportedFormat.TXT) {
                const buffer = await fs.readFile(filePath);
                const encoding = this.detectTextEncoding(buffer);
                return buffer.toString(encoding);
            }

            // For document formats with native text extraction
            if ([SupportedFormat.DOCX, SupportedFormat.HTML, SupportedFormat.RTF].includes(format)) {
                try {
                    // Use document converter for better text extraction
                    const tempTextFile = filePath.replace(/\.[^.]+$/, '_temp_extract.txt');

                    const conversionResult = await this.convertDocument(
                        filePath,
                        tempTextFile,
                        {
                            targetFormat: SupportedFormat.TXT,
                            quality: ConversionQuality.HIGH,
                            preserveFormatting: false,
                            embedFonts: false,
                            optimizeForWeb: false
                        }
                    );

                    if (conversionResult.success) {
                        const text = await fs.readFile(tempTextFile, 'utf-8');
                        await fs.unlink(tempTextFile).catch(() => { }); // Clean up
                        return text;
                    }
                } catch (conversionError) {
                    // Fall back to OCR if conversion fails
                }
            }

            // For OCR-applicable formats, use enhanced OCR
            if (this.isOCRApplicable(format)) {
                const ocrResult = await this.performOCR(filePath, {
                    languages: [OCRLanguage.ENGLISH],
                    confidence: 60, // Lower threshold for text extraction
                    preserveLayout: false,
                    detectOrientation: true,
                    enhanceImage: true,
                    outputFormat: 'text'
                });

                return ocrResult.text || '';
            }

            throw new UnsupportedFormatError(`Text extraction not supported for format: ${format}`);

        } catch (error) {
            if (error instanceof FileProcessingError || error instanceof UnsupportedFormatError) {
                throw error;
            }

            throw new FileProcessingError(
                `Text extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'EXTRACTION_ERROR'
            );
        }
    }

    async extractMetadata(filePath: string): Promise<Record<string, any>> {
        try {
            // Enhanced metadata extraction with format-specific analysis
            if (!await this.validateFile(filePath)) {
                throw new FileProcessingError('Invalid input file', 'INVALID_INPUT');
            }

            const stats = await fs.stat(filePath);
            const format = await this.detectFormat(filePath);
            const checksum = await this.calculateChecksum(filePath);

            const baseMetadata = {
                fileName: path.basename(filePath),
                filePath,
                format,
                size: stats.size,
                checksum,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                accessedAt: stats.atime,
                mimeType: mimeTypes.lookup(filePath) || 'application/octet-stream'
            };

            // Enhanced format-specific metadata extraction
            const formatSpecificMetadata = await this.extractEnhancedFormatMetadata(filePath, format);

            // Security metadata
            const securityMetadata = await this.extractSecurityMetadata(filePath);

            return {
                ...baseMetadata,
                ...formatSpecificMetadata,
                ...securityMetadata
            };

        } catch (error) {
            if (error instanceof FileProcessingError) {
                throw error;
            }

            throw new FileProcessingError(
                `Metadata extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'METADATA_EXTRACTION_ERROR'
            );
        }
    }

    async optimizeImage(
        inputPath: string,
        outputPath: string,
        quality: ConversionQuality
    ): Promise<ConversionResult> {
        try {
            // Enhanced image optimization with advanced algorithms
            if (!await this.validateFile(inputPath)) {
                throw new FileProcessingError('Invalid input file', 'INVALID_INPUT');
            }

            const format = await this.detectFormat(inputPath);

            if (!this.isImageFormat(format)) {
                throw new UnsupportedFormatError(`Image optimization not supported for format: ${format}`);
            }

            // Enhanced optimization with format-specific settings
            const result = await this.documentConverter.convert(
                inputPath,
                outputPath,
                format,
                format, // Same format
                {
                    targetFormat: format,
                    quality,
                    preserveFormatting: false,
                    embedFonts: false,
                    optimizeForWeb: true
                }
            );

            return result;

        } catch (error) {
            if (error instanceof FileProcessingError || error instanceof UnsupportedFormatError) {
                throw error;
            }

            throw new FileProcessingError(
                `Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'OPTIMIZATION_ERROR'
            );
        }
    }

    async processBatch(
        jobs: Array<{
            id: string;
            inputPath: string;
            outputPath: string;
            operation: 'convert' | 'ocr' | 'extract' | 'optimize';
            options: any;
        }>,
        batchOptions: BatchProcessingOptions
    ): Promise<BatchProcessingResult> {
        try {
            // Enhanced batch processing with job optimization
            const processingJobs: ProcessingJob[] = jobs.map(job => ({
                id: job.id,
                type: this.mapOperationToJobType(job.operation),
                status: ProcessingStatus.PENDING,
                inputFileId: job.inputPath,
                options: {
                    inputPath: job.inputPath,
                    outputPath: job.outputPath,
                    operation: job.operation,
                    ...job.options
                },
                progress: 0,
                createdBy: 'system',
                organizationId: undefined
            }));

            // Pre-validate all jobs
            for (const job of processingJobs) {
                const isValid = await this.validateFile(job.options.inputPath);
                if (!isValid) {
                    job.status = ProcessingStatus.FAILED;
                    job.error = `Invalid input file: ${job.options.inputPath}`;
                }
            }

            // Add jobs to enhanced batch processor
            for (const job of processingJobs) {
                if (job.status !== ProcessingStatus.FAILED) {
                    await this.batchProcessor.addJob(job);
                }
            }

            // Process with enhanced parallel processing
            const result = await this.batchProcessor.processJobs(batchOptions);

            return result;

        } catch (error) {
            throw new FileProcessingError(
                `Batch processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                'BATCH_PROCESSING_ERROR'
            );
        }
    }

    // Enhanced helper methods

    private async detectFormatFromBuffer(
        buffer: Buffer,
        extFormat: SupportedFormat,
        mimeFormat: SupportedFormat
    ): Promise<SupportedFormat> {
        // Check file signatures (magic numbers)
        const signatures: Record<string, SupportedFormat> = {
            '25504446': SupportedFormat.PDF, // %PDF
            '504B0304': SupportedFormat.DOCX, // ZIP (DOCX is ZIP-based)
            '89504E47': SupportedFormat.PNG,
            'FFD8FF': SupportedFormat.JPG,
            '474946': SupportedFormat.BMP, // GIF (simplified)
            '52494646': SupportedFormat.WEBP // RIFF (WEBP)
        };

        const header = buffer.subarray(0, 8).toString('hex').toUpperCase();

        for (const [signature, format] of Object.entries(signatures)) {
            if (header.startsWith(signature)) {
                return format;
            }
        }

        // If no signature match, prefer extension-based detection
        return extFormat;
    }

    private async validateFileHeader(filePath: string, expectedFormat: SupportedFormat): Promise<boolean> {
        try {
            const buffer = await fs.readFile(filePath, { flag: 'r' });
            const header = buffer.subarray(0, 16);

            switch (expectedFormat) {
                case SupportedFormat.PDF:
                    return header.toString('ascii', 0, 4) === '%PDF';
                case SupportedFormat.PNG:
                    return header.toString('hex', 0, 8) === '89504e470d0a1a0a';
                case SupportedFormat.JPG:
                case SupportedFormat.JPEG:
                    return header.toString('hex', 0, 3) === 'ffd8ff';
                default:
                    return true; // Skip validation for other formats
            }
        } catch (error) {
            return false;
        }
    }

    private async validateConversionOutput(outputPath: string, expectedFormat: SupportedFormat): Promise<boolean> {
        try {
            const stats = await fs.stat(outputPath);
            if (stats.size === 0) {
                return false;
            }

            // Basic format validation
            const detectedFormat = await this.detectFormat(outputPath);
            return detectedFormat === expectedFormat;
        } catch (error) {
            return false;
        }
    }

    private detectTextEncoding(buffer: Buffer): BufferEncoding {
        // Simple encoding detection (can be enhanced with libraries like chardet)
        const bom = buffer.subarray(0, 3);

        if (bom[0] === 0xEF && bom[1] === 0xBB && bom[2] === 0xBF) {
            return 'utf8'; // UTF-8 BOM
        }

        if (bom[0] === 0xFF && bom[1] === 0xFE) {
            return 'utf16le'; // UTF-16 LE BOM
        }

        if (bom[0] === 0xFE && bom[1] === 0xFF) {
            return 'utf16le'; // UTF-16 BE BOM (use utf16le as closest match)
        }

        return 'utf8'; // Default to UTF-8
    }

    private async extractEnhancedFormatMetadata(filePath: string, format: SupportedFormat): Promise<Record<string, any>> {
        const metadata: Record<string, any> = {};

        try {
            switch (format) {
                case SupportedFormat.PDF:
                    metadata.type = 'document';
                    metadata.pages = await this.estimatePdfPages(filePath);
                    metadata.hasText = await this.checkPdfHasText(filePath);
                    break;

                case SupportedFormat.DOCX:
                case SupportedFormat.DOC:
                    metadata.type = 'document';
                    metadata.wordCount = await this.estimateWordCount(filePath);
                    metadata.hasImages = await this.checkDocumentHasImages(filePath);
                    break;

                case SupportedFormat.XLSX:
                case SupportedFormat.XLS:
                    metadata.type = 'spreadsheet';
                    metadata.sheets = await this.estimateSheetCount(filePath);
                    metadata.hasFormulas = await this.checkSpreadsheetHasFormulas(filePath);
                    break;

                case SupportedFormat.PNG:
                case SupportedFormat.JPG:
                case SupportedFormat.JPEG:
                case SupportedFormat.TIFF:
                case SupportedFormat.BMP:
                case SupportedFormat.WEBP:
                    metadata.type = 'image';
                    const imageInfo = await this.getImageInfo(filePath);
                    metadata.width = imageInfo.width;
                    metadata.height = imageInfo.height;
                    metadata.colorDepth = imageInfo.colorDepth;
                    metadata.hasAlpha = imageInfo.hasAlpha;
                    break;

                default:
                    metadata.type = 'unknown';
            }
        } catch (error) {
            console.warn(`Failed to extract enhanced metadata for ${format}:`, error);
        }

        return metadata;
    }

    private async extractSecurityMetadata(filePath: string): Promise<Record<string, any>> {
        const securityMetadata: Record<string, any> = {};

        try {
            // Check for potential security issues
            const stats = await fs.stat(filePath);
            securityMetadata.permissions = stats.mode;
            securityMetadata.isExecutable = !!(stats.mode & parseInt('111', 8));

            // Check for suspicious file characteristics
            const buffer = await fs.readFile(filePath, { flag: 'r' });
            securityMetadata.hasBinaryContent = this.hasBinaryContent(buffer);
            securityMetadata.entropy = this.calculateEntropy(buffer.subarray(0, 1024));

        } catch (error) {
            console.warn('Failed to extract security metadata:', error);
        }

        return securityMetadata;
    }

    // Estimation methods for enhanced metadata

    private async estimatePdfPages(filePath: string): Promise<number> {
        try {
            const buffer = await fs.readFile(filePath);
            const text = buffer.toString('ascii');
            const matches = text.match(/\/Count\s+(\d+)/g);
            if (matches && matches.length > 0) {
                const lastMatch = matches[matches.length - 1];
                const count = parseInt(lastMatch.match(/\d+/)?.[0] || '1');
                return count;
            }
        } catch (error) {
            // Ignore errors
        }
        return 1; // Default estimate
    }

    private async checkPdfHasText(filePath: string): Promise<boolean> {
        try {
            const text = await this.extractText(filePath);
            return text.trim().length > 0;
        } catch (error) {
            return false;
        }
    }

    private async estimateWordCount(filePath: string): Promise<number> {
        try {
            const text = await this.extractText(filePath);
            return text.split(/\s+/).filter(word => word.length > 0).length;
        } catch (error) {
            return 0;
        }
    }

    private async checkDocumentHasImages(filePath: string): Promise<boolean> {
        // Simplified check - in reality, you'd parse the document structure
        try {
            const stats = await fs.stat(filePath);
            return stats.size > 50000; // Assume larger files might have images
        } catch (error) {
            return false;
        }
    }

    private async estimateSheetCount(filePath: string): Promise<number> {
        // Simplified estimation
        return 1;
    }

    private async checkSpreadsheetHasFormulas(filePath: string): Promise<boolean> {
        // Simplified check
        return false;
    }

    private async getImageInfo(filePath: string): Promise<{
        width: number;
        height: number;
        colorDepth: number;
        hasAlpha: boolean;
    }> {
        // Simplified image info - in reality, you'd use image processing libraries
        return {
            width: 800,
            height: 600,
            colorDepth: 24,
            hasAlpha: false
        };
    }

    private hasBinaryContent(buffer: Buffer): boolean {
        // Check for null bytes or high-bit characters
        for (let i = 0; i < Math.min(buffer.length, 1024); i++) {
            if (buffer[i] === 0 || buffer[i] > 127) {
                return true;
            }
        }
        return false;
    }

    private calculateEntropy(buffer: Buffer): number {
        // Calculate Shannon entropy
        const frequencies: Record<number, number> = {};

        for (const byte of buffer) {
            frequencies[byte] = (frequencies[byte] || 0) + 1;
        }

        let entropy = 0;
        const length = buffer.length;

        for (const count of Object.values(frequencies)) {
            const probability = count / length;
            entropy -= probability * Math.log2(probability);
        }

        return entropy;
    }

    // Existing helper methods (updated)

    private mimeTypeToFormat(mimeType: string): SupportedFormat | null {
        const mimeMap: Record<string, SupportedFormat> = {
            'application/pdf': SupportedFormat.PDF,
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': SupportedFormat.DOCX,
            'application/msword': SupportedFormat.DOC,
            'application/rtf': SupportedFormat.RTF,
            'text/plain': SupportedFormat.TXT,
            'text/html': SupportedFormat.HTML,
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': SupportedFormat.XLSX,
            'application/vnd.ms-excel': SupportedFormat.XLS,
            'text/csv': SupportedFormat.CSV,
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': SupportedFormat.PPTX,
            'application/vnd.ms-powerpoint': SupportedFormat.PPT,
            'image/png': SupportedFormat.PNG,
            'image/jpeg': SupportedFormat.JPG,
            'image/tiff': SupportedFormat.TIFF,
            'image/bmp': SupportedFormat.BMP,
            'image/webp': SupportedFormat.WEBP
        };

        return mimeMap[mimeType] || null;
    }

    private extensionToFormat(extension: string): SupportedFormat | null {
        const extMap: Record<string, SupportedFormat> = {
            'pdf': SupportedFormat.PDF,
            'docx': SupportedFormat.DOCX,
            'doc': SupportedFormat.DOC,
            'rtf': SupportedFormat.RTF,
            'txt': SupportedFormat.TXT,
            'html': SupportedFormat.HTML,
            'htm': SupportedFormat.HTML,
            'xlsx': SupportedFormat.XLSX,
            'xls': SupportedFormat.XLS,
            'csv': SupportedFormat.CSV,
            'pptx': SupportedFormat.PPTX,
            'ppt': SupportedFormat.PPT,
            'png': SupportedFormat.PNG,
            'jpg': SupportedFormat.JPG,
            'jpeg': SupportedFormat.JPEG,
            'tiff': SupportedFormat.TIFF,
            'tif': SupportedFormat.TIFF,
            'bmp': SupportedFormat.BMP,
            'webp': SupportedFormat.WEBP,
            'odt': SupportedFormat.ODT,
            'ods': SupportedFormat.ODS,
            'odp': SupportedFormat.ODP
        };

        return extMap[extension] || null;
    }

    private isImageFormat(format: SupportedFormat): boolean {
        return [
            SupportedFormat.PNG,
            SupportedFormat.JPG,
            SupportedFormat.JPEG,
            SupportedFormat.TIFF,
            SupportedFormat.BMP,
            SupportedFormat.WEBP
        ].includes(format);
    }

    private isOCRApplicable(format: SupportedFormat): boolean {
        return [
            SupportedFormat.PDF,
            SupportedFormat.PNG,
            SupportedFormat.JPG,
            SupportedFormat.JPEG,
            SupportedFormat.TIFF,
            SupportedFormat.BMP,
            SupportedFormat.WEBP
        ].includes(format);
    }

    private mapOperationToJobType(operation: string): 'conversion' | 'ocr' | 'extraction' | 'optimization' {
        switch (operation) {
            case 'convert': return 'conversion';
            case 'ocr': return 'ocr';
            case 'extract': return 'extraction';
            case 'optimize': return 'optimization';
            default: return 'conversion';
        }
    }

    private async calculateChecksum(filePath: string): Promise<string> {
        const hash = crypto.createHash('sha256');
        const stream = require('fs').createReadStream(filePath);

        return new Promise((resolve, reject) => {
            stream.on('data', (data: Buffer) => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    // Cleanup method
    async cleanup(): Promise<void> {
        try {
            await this.ocrEngine.cleanup();
            await this.batchProcessor.clearQueue();
        } catch (error) {
            console.warn('Cleanup error:', error);
        }
    }

    // Enhanced service capabilities
    async getProcessingCapabilities(): Promise<{
        supportedFormats: SupportedFormat[];
        supportedConversions: Array<{ from: SupportedFormat; to: SupportedFormat[] }>;
        ocrLanguages: string[];
        maxFileSize: number;
        maxBatchSize: number;
        advancedFeatures: string[];
    }> {
        const supportedFormats = this.documentConverter.getSupportedFormats();
        const supportedConversions = supportedFormats.map(format => ({
            from: format,
            to: supportedFormats.filter(target => this.documentConverter.canConvert(format, target))
        }));

        return {
            supportedFormats,
            supportedConversions,
            ocrLanguages: this.ocrEngine.getSupportedLanguages(),
            maxFileSize: 500 * 1024 * 1024, // 500MB
            maxBatchSize: 1000,
            advancedFeatures: [
                'multi_format_conversion',
                'advanced_ocr',
                'parallel_batch_processing',
                'quality_preservation',
                'automatic_optimization',
                'security_validation',
                'metadata_extraction',
                'format_detection'
            ]
        };
    }

    async getProcessingStats(): Promise<{
        totalProcessed: number;
        successRate: number;
        averageProcessingTime: number;
        queueStatus: any;
        resourceUsage: any;
    }> {
        const queueStatus = this.batchProcessor.getQueueStatus();
        const processingStats = this.batchProcessor.getProcessingStats();
        const resourceUsage = await this.batchProcessor.getResourceUsage();

        return {
            totalProcessed: processingStats.totalJobs,
            successRate: processingStats.successRate,
            averageProcessingTime: processingStats.averageProcessingTime,
            queueStatus,
            resourceUsage
        };
    }
}