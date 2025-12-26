import { z } from 'zod';

// Supported file formats
export enum SupportedFormat {
    // Documents
    PDF = 'pdf',
    DOCX = 'docx',
    DOC = 'doc',
    RTF = 'rtf',
    TXT = 'txt',
    HTML = 'html',

    // Spreadsheets
    XLSX = 'xlsx',
    XLS = 'xls',
    CSV = 'csv',

    // Presentations
    PPTX = 'pptx',
    PPT = 'ppt',

    // Images
    PNG = 'png',
    JPG = 'jpg',
    JPEG = 'jpeg',
    TIFF = 'tiff',
    BMP = 'bmp',
    WEBP = 'webp',

    // Other
    ODT = 'odt',
    ODS = 'ods',
    ODP = 'odp'
}

// Conversion quality settings
export enum ConversionQuality {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    ULTRA = 'ultra'
}

// OCR languages
export enum OCRLanguage {
    ENGLISH = 'eng',
    SPANISH = 'spa',
    FRENCH = 'fra',
    GERMAN = 'deu',
    ITALIAN = 'ita',
    PORTUGUESE = 'por',
    CHINESE_SIMPLIFIED = 'chi_sim',
    CHINESE_TRADITIONAL = 'chi_tra',
    JAPANESE = 'jpn',
    KOREAN = 'kor',
    RUSSIAN = 'rus',
    ARABIC = 'ara'
}

// Processing status
export enum ProcessingStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
    CANCELLED = 'cancelled'
}

// File metadata schema
export const FileMetadataSchema = z.object({
    id: z.string(),
    originalName: z.string(),
    mimeType: z.string(),
    size: z.number(),
    format: z.nativeEnum(SupportedFormat),
    checksum: z.string(),
    uploadedAt: z.date(),
    uploadedBy: z.string(),
    organizationId: z.string().optional(),
    tags: z.array(z.string()).default([]),
    customMetadata: z.record(z.string(), z.any()).default({})
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

// Conversion options schema
export const ConversionOptionsSchema = z.object({
    targetFormat: z.nativeEnum(SupportedFormat),
    quality: z.nativeEnum(ConversionQuality).default(ConversionQuality.HIGH),
    preserveFormatting: z.boolean().default(true),
    embedFonts: z.boolean().default(true),
    optimizeForWeb: z.boolean().default(false),
    password: z.string().optional(),
    watermark: z.object({
        text: z.string(),
        opacity: z.number().min(0).max(1).default(0.5),
        position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']).default('center')
    }).optional(),
    pageRange: z.object({
        start: z.number().min(1),
        end: z.number().min(1)
    }).optional()
});

export type ConversionOptions = z.infer<typeof ConversionOptionsSchema>;

// OCR options schema
export const OCROptionsSchema = z.object({
    languages: z.array(z.nativeEnum(OCRLanguage)).default([OCRLanguage.ENGLISH]),
    confidence: z.number().min(0).max(100).default(80),
    preserveLayout: z.boolean().default(true),
    detectOrientation: z.boolean().default(true),
    enhanceImage: z.boolean().default(true),
    outputFormat: z.enum(['text', 'hocr', 'pdf', 'searchable-pdf']).default('text')
});

export type OCROptions = z.infer<typeof OCROptionsSchema>;

// Batch processing options schema
export const BatchProcessingOptionsSchema = z.object({
    concurrency: z.number().min(1).max(10).default(3),
    priority: z.enum(['low', 'normal', 'high']).default('normal'),
    retryAttempts: z.number().min(0).max(5).default(3),
    retryDelay: z.number().min(1000).default(5000),
    onProgress: z.function().args(z.number(), z.number()).returns(z.void()).optional(),
    onComplete: z.function().args(z.string(), z.any()).returns(z.void()).optional(),
    onError: z.function().args(z.string(), z.instanceof(Error)).returns(z.void()).optional()
});

export type BatchProcessingOptions = z.infer<typeof BatchProcessingOptionsSchema>;

// Processing job schema
export const ProcessingJobSchema = z.object({
    id: z.string(),
    type: z.enum(['conversion', 'ocr', 'extraction', 'optimization']),
    status: z.nativeEnum(ProcessingStatus),
    inputFileId: z.string(),
    outputFileId: z.string().optional(),
    options: z.any(),
    progress: z.number().min(0).max(100).default(0),
    startedAt: z.date().optional(),
    completedAt: z.date().optional(),
    error: z.string().optional(),
    result: z.any().optional(),
    createdBy: z.string(),
    organizationId: z.string().optional()
});

export type ProcessingJob = z.infer<typeof ProcessingJobSchema>;

// Conversion result schema
export const ConversionResultSchema = z.object({
    success: z.boolean(),
    outputFileId: z.string().optional(),
    outputPath: z.string().optional(),
    metadata: z.object({
        originalSize: z.number(),
        convertedSize: z.number(),
        compressionRatio: z.number(),
        processingTime: z.number(),
        quality: z.nativeEnum(ConversionQuality)
    }),
    error: z.string().optional()
});

export type ConversionResult = z.infer<typeof ConversionResultSchema>;

// OCR result schema
export const OCRResultSchema = z.object({
    success: z.boolean(),
    text: z.string().optional(),
    confidence: z.number().min(0).max(100).optional(),
    words: z.array(z.object({
        text: z.string(),
        confidence: z.number(),
        bbox: z.object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number()
        })
    })).optional(),
    blocks: z.array(z.object({
        text: z.string(),
        confidence: z.number(),
        bbox: z.object({
            x: z.number(),
            y: z.number(),
            width: z.number(),
            height: z.number()
        })
    })).optional(),
    metadata: z.object({
        pageCount: z.number(),
        processingTime: z.number(),
        detectedLanguages: z.array(z.nativeEnum(OCRLanguage)),
        orientation: z.number().optional()
    }),
    error: z.string().optional()
});

export type OCRResult = z.infer<typeof OCRResultSchema>;

// Batch processing result schema
export const BatchProcessingResultSchema = z.object({
    totalJobs: z.number(),
    completedJobs: z.number(),
    failedJobs: z.number(),
    results: z.array(z.object({
        jobId: z.string(),
        fileId: z.string(),
        success: z.boolean(),
        result: z.any().optional(),
        error: z.string().optional()
    })),
    processingTime: z.number(),
    summary: z.object({
        successRate: z.number(),
        averageProcessingTime: z.number(),
        totalDataProcessed: z.number(),
        throughput: z.number().optional(),
        efficiency: z.number().optional(),
        resourceUtilization: z.number().optional()
    })
});

export type BatchProcessingResult = z.infer<typeof BatchProcessingResultSchema>;

// File processing service interface
export interface FileProcessingService {
    // Format detection and validation
    detectFormat(filePath: string): Promise<SupportedFormat>;
    validateFile(filePath: string, expectedFormat?: SupportedFormat): Promise<boolean>;

    // Document conversion
    convertDocument(
        inputPath: string,
        outputPath: string,
        options: ConversionOptions
    ): Promise<ConversionResult>;

    // OCR processing
    performOCR(
        filePath: string,
        options: OCROptions
    ): Promise<OCRResult>;

    // Text extraction
    extractText(filePath: string): Promise<string>;
    extractMetadata(filePath: string): Promise<Record<string, any>>;

    // Image processing
    optimizeImage(
        inputPath: string,
        outputPath: string,
        quality: ConversionQuality
    ): Promise<ConversionResult>;

    // Batch processing
    processBatch(
        jobs: Array<{
            id: string;
            inputPath: string;
            outputPath: string;
            operation: 'convert' | 'ocr' | 'extract' | 'optimize';
            options: any;
        }>,
        batchOptions: BatchProcessingOptions
    ): Promise<BatchProcessingResult>;
}

// Document converter interface
export interface DocumentConverter {
    getSupportedFormats(): SupportedFormat[];
    canConvert(from: SupportedFormat, to: SupportedFormat): boolean;
    convert(
        inputPath: string,
        outputPath: string,
        fromFormat: SupportedFormat,
        toFormat: SupportedFormat,
        options: ConversionOptions
    ): Promise<ConversionResult>;
}

// OCR engine interface
export interface OCREngine {
    getSupportedLanguages(): OCRLanguage[];
    processImage(imagePath: string, options: OCROptions): Promise<OCRResult>;
    processDocument(documentPath: string, options: OCROptions): Promise<OCRResult>;
}

// Batch processor interface
export interface BatchProcessor {
    addJob(job: ProcessingJob): Promise<void>;
    processJobs(options: BatchProcessingOptions): Promise<BatchProcessingResult>;
    getJobStatus(jobId: string): Promise<ProcessingJob>;
    cancelJob(jobId: string): Promise<void>;
    clearCompleted(): Promise<void>;
}

// File processing errors
export class FileProcessingError extends Error {
    constructor(
        message: string,
        public code: string,
        public details?: any
    ) {
        super(message);
        this.name = 'FileProcessingError';
    }
}

export class UnsupportedFormatError extends FileProcessingError {
    constructor(format: string) {
        super(`Unsupported file format: ${format}`, 'UNSUPPORTED_FORMAT');
    }
}

export class ConversionError extends FileProcessingError {
    constructor(message: string, details?: any) {
        super(message, 'CONVERSION_ERROR', details);
    }
}

export class OCRError extends FileProcessingError {
    constructor(message: string, details?: any) {
        super(message, 'OCR_ERROR', details);
    }
}

export class BatchProcessingError extends FileProcessingError {
    constructor(message: string, details?: any) {
        super(message, 'BATCH_PROCESSING_ERROR', details);
    }
}