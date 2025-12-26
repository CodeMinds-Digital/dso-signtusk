import { promises as fs } from 'fs';
import { join, dirname, extname } from 'path';
import { randomBytes } from 'node:crypto';
import {
    StorageService,
    StorageConfig,
    FileMetadata,
    UploadOptions,
    DownloadOptions,
    PresignedUrlOptions,
    ListOptions,
    ListResult,
    FileNotFoundError,
    StorageError,
} from './types';

export class LocalStorageService implements StorageService {
    private basePath: string;
    private createDirectories: boolean;
    private multipartUploads: Map<string, { key: string; parts: Map<number, Buffer> }> = new Map();

    private generateId(): string {
        return randomBytes(16).toString('hex');
    }

    constructor(config: StorageConfig) {
        if (!config.local) {
            throw new Error('Local storage configuration is required');
        }

        this.basePath = config.local.basePath;
        this.createDirectories = config.local.createDirectories;
    }

    private getFilePath(key: string): string {
        return join(this.basePath, key);
    }

    private async ensureDirectory(filePath: string): Promise<void> {
        if (this.createDirectories) {
            const dir = dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
        }
    }

    private getMimeType(key: string, providedMimeType?: string): string {
        if (providedMimeType) {
            return providedMimeType;
        }

        const ext = extname(key).toLowerCase();
        const mimeTypes: Record<string, string> = {
            '.pdf': 'application/pdf',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.xml': 'application/xml',
            '.zip': 'application/zip',
        };

        return mimeTypes[ext] || 'application/octet-stream';
    }

    async upload(key: string, data: Buffer | Uint8Array | string, options: UploadOptions = {}): Promise<FileMetadata> {
        const filePath = this.getFilePath(key);
        await this.ensureDirectory(filePath);

        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
        await fs.writeFile(filePath, buffer);

        // Store metadata in a separate file
        const metadata = {
            mimeType: this.getMimeType(key, options.mimeType),
            customMetadata: options.metadata || {},
            uploadedAt: new Date().toISOString(),
        };

        await fs.writeFile(`${filePath}.meta`, JSON.stringify(metadata, null, 2));

        return {
            key,
            size: buffer.length,
            mimeType: metadata.mimeType,
            lastModified: new Date(),
            etag: this.generateId(), // Generate a simple etag
            customMetadata: options.metadata,
        };
    }

    async download(key: string, options: DownloadOptions = {}): Promise<Buffer> {
        const filePath = this.getFilePath(key);

        try {
            let buffer = await fs.readFile(filePath);

            if (options.range) {
                const start = options.range.start;
                const end = options.range.end || buffer.length - 1;
                buffer = buffer.subarray(start, end + 1);
            }

            return buffer;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                throw new FileNotFoundError(key);
            }
            throw new StorageError(`Failed to download file: ${error.message}`, 'DOWNLOAD_FAILED');
        }
    }

    async uploadStream(key: string, stream: NodeJS.ReadableStream, options: UploadOptions = {}): Promise<FileMetadata> {
        const filePath = this.getFilePath(key);
        await this.ensureDirectory(filePath);

        // Use pipeline to efficiently stream data to file
        const { createWriteStream } = await import('fs');
        const { pipeline } = await import('stream/promises');

        const writeStream = createWriteStream(filePath);

        try {
            await pipeline(stream, writeStream);
        } catch (error) {
            // Clean up partial file on error
            try {
                await fs.unlink(filePath);
            } catch {
                // Ignore cleanup errors
            }
            throw error;
        }

        // Get file stats to return metadata
        const stats = await fs.stat(filePath);

        // Store metadata in a separate file
        const metadata = {
            mimeType: this.getMimeType(key, options.mimeType),
            customMetadata: options.metadata || {},
            uploadedAt: new Date().toISOString(),
        };

        await fs.writeFile(`${filePath}.meta`, JSON.stringify(metadata, null, 2));

        return {
            key,
            size: stats.size,
            mimeType: metadata.mimeType,
            lastModified: stats.mtime,
            etag: this.generateId(), // Generate a simple etag
            customMetadata: options.metadata,
        };
    }

    async downloadStream(key: string, options: DownloadOptions = {}): Promise<NodeJS.ReadableStream> {
        const { createReadStream } = await import('fs');
        const filePath = this.getFilePath(key);

        // Check if file exists first
        try {
            await fs.access(filePath);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                throw new FileNotFoundError(key);
            }
            throw new StorageError(`Failed to access file: ${error.message}`, 'ACCESS_FAILED');
        }

        const streamOptions: any = {};
        if (options.range) {
            streamOptions.start = options.range.start;
            if (options.range.end !== undefined) {
                streamOptions.end = options.range.end;
            }
        }

        return createReadStream(filePath, streamOptions);
    }

    async delete(key: string): Promise<void> {
        const filePath = this.getFilePath(key);

        try {
            await fs.unlink(filePath);
            // Also delete metadata file if it exists
            try {
                await fs.unlink(`${filePath}.meta`);
            } catch {
                // Ignore if metadata file doesn't exist
            }
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }
    }

    async exists(key: string): Promise<boolean> {
        const filePath = this.getFilePath(key);

        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async getMetadata(key: string): Promise<FileMetadata> {
        const filePath = this.getFilePath(key);

        try {
            const stats = await fs.stat(filePath);

            // Try to read metadata file
            let metadata: any = {};
            try {
                const metaContent = await fs.readFile(`${filePath}.meta`, 'utf-8');
                metadata = JSON.parse(metaContent);
            } catch {
                // Use defaults if metadata file doesn't exist
                metadata = {
                    mimeType: this.getMimeType(key),
                    customMetadata: {},
                };
            }

            return {
                key,
                size: stats.size,
                mimeType: metadata.mimeType,
                lastModified: stats.mtime,
                etag: this.generateId(), // Generate a simple etag
                customMetadata: metadata.customMetadata,
            };
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                throw new FileNotFoundError(key);
            }
            throw new StorageError(`Failed to get file metadata: ${error.message}`, 'METADATA_FAILED');
        }
    }

    async list(options: ListOptions = {}): Promise<ListResult> {
        try {
            const files: FileMetadata[] = [];

            const scanDirectory = async (dirPath: string, currentPrefix: string = ''): Promise<void> => {
                try {
                    const entries = await fs.readdir(dirPath, { withFileTypes: true });

                    for (const entry of entries) {
                        if (options.maxKeys && files.length >= options.maxKeys) {
                            break;
                        }

                        const fullPath = join(dirPath, entry.name);
                        const relativePath = currentPrefix ? join(currentPrefix, entry.name) : entry.name;

                        if (entry.isDirectory()) {
                            await scanDirectory(fullPath, relativePath);
                        } else if (entry.isFile() && !entry.name.endsWith('.meta')) {
                            // Skip metadata files

                            // Apply prefix filter
                            if (options.prefix && !relativePath.startsWith(options.prefix)) {
                                continue;
                            }

                            const stats = await fs.stat(fullPath);

                            files.push({
                                key: relativePath,
                                size: stats.size,
                                mimeType: this.getMimeType(relativePath),
                                lastModified: stats.mtime,
                                etag: this.generateId(),
                            });
                        }
                    }
                } catch (error: any) {
                    // Ignore directory access errors and continue
                    if (error.code !== 'ENOENT' && error.code !== 'EACCES') {
                        throw error;
                    }
                }
            };

            await scanDirectory(this.basePath);

            return {
                files,
                isTruncated: false, // Local storage doesn't support pagination
            };
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return { files: [], isTruncated: false };
            }
            throw error;
        }
    }

    async copy(sourceKey: string, destinationKey: string): Promise<FileMetadata> {
        const sourcePath = this.getFilePath(sourceKey);
        const destPath = this.getFilePath(destinationKey);

        await this.ensureDirectory(destPath);
        await fs.copyFile(sourcePath, destPath);

        // Copy metadata file if it exists
        try {
            await fs.copyFile(`${sourcePath}.meta`, `${destPath}.meta`);
        } catch {
            // Ignore if metadata file doesn't exist
        }

        return this.getMetadata(destinationKey);
    }

    async move(sourceKey: string, destinationKey: string): Promise<FileMetadata> {
        const metadata = await this.copy(sourceKey, destinationKey);
        await this.delete(sourceKey);
        return metadata;
    }

    async getPresignedUrl(key: string, options: PresignedUrlOptions): Promise<string> {
        // For local storage, we'll return a simple URL with a token
        // In a real implementation, this would be handled by a web server
        const token = this.generateId();
        return `http://localhost:3000/storage/${key}?token=${token}&expires=${Date.now() + (options.expiresIn * 1000)}`;
    }

    async createMultipartUpload(key: string, options: UploadOptions = {}): Promise<string> {
        const uploadId = this.generateId();
        this.multipartUploads.set(uploadId, {
            key,
            parts: new Map(),
        });
        return uploadId;
    }

    async uploadPart(uploadId: string, key: string, partNumber: number, data: Buffer): Promise<string> {
        const upload = this.multipartUploads.get(uploadId);
        if (!upload) {
            throw new Error('Multipart upload not found');
        }

        upload.parts.set(partNumber, data);
        return this.generateId(); // Return a simple etag
    }

    async completeMultipartUpload(
        uploadId: string,
        key: string,
        parts: Array<{ partNumber: number; etag: string }>
    ): Promise<FileMetadata> {
        const upload = this.multipartUploads.get(uploadId);
        if (!upload) {
            throw new Error('Multipart upload not found');
        }

        // Combine all parts in order
        const sortedParts = parts.sort((a, b) => a.partNumber - b.partNumber);
        const buffers: Buffer[] = [];

        for (const part of sortedParts) {
            const buffer = upload.parts.get(part.partNumber);
            if (!buffer) {
                throw new Error(`Part ${part.partNumber} not found`);
            }
            buffers.push(buffer);
        }

        const combinedBuffer = Buffer.concat(buffers);
        const metadata = await this.upload(key, combinedBuffer);

        // Clean up multipart upload
        this.multipartUploads.delete(uploadId);

        return metadata;
    }

    async abortMultipartUpload(uploadId: string, key: string): Promise<void> {
        this.multipartUploads.delete(uploadId);
    }

    async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
        try {
            // Try to access the base path to verify it's accessible
            await fs.access(this.basePath);

            // Try to write a test file
            const testFile = join(this.basePath, '.health-check');
            await fs.writeFile(testFile, 'health-check');
            await fs.unlink(testFile);

            return {
                status: 'healthy',
                details: {
                    provider: 'local',
                    basePath: this.basePath,
                    createDirectories: this.createDirectories,
                }
            };
        } catch (error: any) {
            return {
                status: 'unhealthy',
                details: {
                    provider: 'local',
                    basePath: this.basePath,
                    error: error.message,
                }
            };
        }
    }
}