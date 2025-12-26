import { z } from 'zod';

// Storage-specific error types
export class StorageError extends Error {
    constructor(message: string, public code?: string, public statusCode?: number) {
        super(message);
        this.name = 'StorageError';
    }
}

export class FileNotFoundError extends StorageError {
    constructor(key: string) {
        super(`File not found: ${key}`, 'FILE_NOT_FOUND', 404);
        this.name = 'FileNotFoundError';
    }
}

export class InsufficientStorageError extends StorageError {
    constructor(message: string = 'Insufficient storage space') {
        super(message, 'INSUFFICIENT_STORAGE', 507);
        this.name = 'InsufficientStorageError';
    }
}

export class InvalidFileTypeError extends StorageError {
    constructor(mimeType: string) {
        super(`Invalid file type: ${mimeType}`, 'INVALID_FILE_TYPE', 415);
        this.name = 'InvalidFileTypeError';
    }
}

export class FileSizeExceededError extends StorageError {
    constructor(size: number, maxSize: number) {
        super(`File size ${size} exceeds maximum allowed size ${maxSize}`, 'FILE_SIZE_EXCEEDED', 413);
        this.name = 'FileSizeExceededError';
    }
}

export const StorageConfigSchema = z.object({
    provider: z.enum(['s3', 'local']),
    s3: z.object({
        region: z.string(),
        bucket: z.string(),
        accessKeyId: z.string().optional(),
        secretAccessKey: z.string().optional(),
        endpoint: z.string().optional(),
        forcePathStyle: z.boolean().default(false),
    }).optional(),
    local: z.object({
        basePath: z.string(),
        createDirectories: z.boolean().default(true),
    }).optional(),
});

export type StorageConfig = z.infer<typeof StorageConfigSchema>;

export interface FileMetadata {
    key: string;
    size: number;
    mimeType: string;
    lastModified: Date;
    etag?: string;
    customMetadata?: Record<string, string>;
}

export interface UploadOptions {
    mimeType?: string;
    metadata?: Record<string, string>;
    acl?: 'private' | 'public-read' | 'public-read-write';
    cacheControl?: string;
    expires?: Date;
    signal?: AbortSignal; // Add support for request cancellation
}

export interface DownloadOptions {
    range?: {
        start: number;
        end?: number;
    };
    signal?: AbortSignal; // Add support for request cancellation
}

export interface PresignedUrlOptions {
    expiresIn: number; // seconds
    method?: 'GET' | 'PUT' | 'DELETE';
    contentType?: string;
}

export interface ListOptions {
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
}

export interface ListResult {
    files: FileMetadata[];
    continuationToken?: string;
    isTruncated: boolean;
}

export interface StorageService {
    upload(key: string, data: Buffer | Uint8Array | string, options?: UploadOptions): Promise<FileMetadata>;
    uploadStream(key: string, stream: NodeJS.ReadableStream, options?: UploadOptions): Promise<FileMetadata>;
    download(key: string, options?: DownloadOptions): Promise<Buffer>;
    downloadStream(key: string, options?: DownloadOptions): Promise<NodeJS.ReadableStream>;
    delete(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    getMetadata(key: string): Promise<FileMetadata>;
    list(options?: ListOptions): Promise<ListResult>;
    copy(sourceKey: string, destinationKey: string): Promise<FileMetadata>;
    move(sourceKey: string, destinationKey: string): Promise<FileMetadata>;
    getPresignedUrl(key: string, options: PresignedUrlOptions): Promise<string>;
    createMultipartUpload(key: string, options?: UploadOptions): Promise<string>;
    uploadPart(uploadId: string, key: string, partNumber: number, data: Buffer): Promise<string>;
    completeMultipartUpload(uploadId: string, key: string, parts: Array<{ partNumber: number; etag: string }>): Promise<FileMetadata>;
    abortMultipartUpload(uploadId: string, key: string): Promise<void>;

    // Health check method for monitoring
    healthCheck?(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>;
}