import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    ListObjectsV2Command,
    CopyObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand,
    AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
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

export class S3StorageService implements StorageService {
    private client: S3Client;
    private bucket: string;

    constructor(config: StorageConfig) {
        if (!config.s3) {
            throw new Error('S3 configuration is required');
        }

        this.bucket = config.s3.bucket;
        this.client = new S3Client({
            region: config.s3.region,
            credentials: config.s3.accessKeyId && config.s3.secretAccessKey ? {
                accessKeyId: config.s3.accessKeyId,
                secretAccessKey: config.s3.secretAccessKey,
            } : undefined,
            endpoint: config.s3.endpoint,
            forcePathStyle: config.s3.forcePathStyle,
        });
    }

    async upload(key: string, data: Buffer | Uint8Array | string, options: UploadOptions = {}): Promise<FileMetadata> {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: buffer,
            ContentType: options.mimeType,
            Metadata: options.metadata,
            ACL: options.acl,
            CacheControl: options.cacheControl,
            Expires: options.expires,
        });

        const result = await this.client.send(command);

        return {
            key,
            size: buffer.length,
            mimeType: options.mimeType || 'application/octet-stream',
            lastModified: new Date(),
            etag: result.ETag?.replace(/"/g, ''),
            customMetadata: options.metadata,
        };
    }

    async download(key: string, options: DownloadOptions = {}): Promise<Buffer> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Range: options.range ? `bytes=${options.range.start}-${options.range.end || ''}` : undefined,
        });

        const result = await this.client.send(command);

        if (!result.Body) {
            throw new Error('No data received from S3');
        }

        // Convert stream to buffer
        const chunks: Uint8Array[] = [];
        const reader = result.Body.transformToWebStream().getReader();

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
            }
        } finally {
            reader.releaseLock();
        }

        return Buffer.concat(chunks);
    }

    async uploadStream(key: string, stream: NodeJS.ReadableStream, options: UploadOptions = {}): Promise<FileMetadata> {
        // For S3, we need to convert the stream to a buffer or use multipart upload for large streams
        // For simplicity, we'll convert to buffer here, but in production you might want to use multipart upload
        const chunks: Buffer[] = [];
        let totalSize = 0;

        for await (const chunk of stream) {
            const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            chunks.push(buffer);
            totalSize += buffer.length;
        }

        const combinedBuffer = Buffer.concat(chunks);

        // Use the existing upload method
        return this.upload(key, combinedBuffer, options);
    }

    async downloadStream(key: string, options: DownloadOptions = {}): Promise<NodeJS.ReadableStream> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Range: options.range ? `bytes=${options.range.start}-${options.range.end || ''}` : undefined,
        });

        const result = await this.client.send(command);

        if (!result.Body) {
            throw new Error('No data received from S3');
        }

        // Convert AWS SDK v3 body to Node.js readable stream
        if ('transformToWebStream' in result.Body) {
            // For newer AWS SDK versions, convert web stream to Node.js stream
            const webStream = result.Body.transformToWebStream();
            const { Readable } = await import('stream');
            return Readable.fromWeb(webStream as any);
        }

        // Fallback for older versions or direct stream
        return result.Body as NodeJS.ReadableStream;
    }

    async delete(key: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        await this.client.send(command);
    }

    async exists(key: string): Promise<boolean> {
        try {
            await this.getMetadata(key);
            return true;
        } catch (error: any) {
            if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw new StorageError(`Failed to check file existence: ${error.message}`, 'EXISTENCE_CHECK_FAILED');
        }
    }

    async getMetadata(key: string): Promise<FileMetadata> {
        const command = new HeadObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });

        const result = await this.client.send(command);

        return {
            key,
            size: result.ContentLength || 0,
            mimeType: result.ContentType || 'application/octet-stream',
            lastModified: result.LastModified || new Date(),
            etag: result.ETag?.replace(/"/g, ''),
            customMetadata: result.Metadata,
        };
    }

    async list(options: ListOptions = {}): Promise<ListResult> {
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: options.prefix,
            MaxKeys: options.maxKeys,
            ContinuationToken: options.continuationToken,
        });

        const result = await this.client.send(command);

        const files: FileMetadata[] = (result.Contents || []).map(obj => ({
            key: obj.Key!,
            size: obj.Size || 0,
            mimeType: 'application/octet-stream', // S3 doesn't return content type in list
            lastModified: obj.LastModified || new Date(),
            etag: obj.ETag?.replace(/"/g, ''),
        }));

        return {
            files,
            continuationToken: result.NextContinuationToken,
            isTruncated: result.IsTruncated || false,
        };
    }

    async copy(sourceKey: string, destinationKey: string): Promise<FileMetadata> {
        const command = new CopyObjectCommand({
            Bucket: this.bucket,
            Key: destinationKey,
            CopySource: `${this.bucket}/${sourceKey}`,
        });

        await this.client.send(command);
        return this.getMetadata(destinationKey);
    }

    async move(sourceKey: string, destinationKey: string): Promise<FileMetadata> {
        const metadata = await this.copy(sourceKey, destinationKey);
        await this.delete(sourceKey);
        return metadata;
    }

    async getPresignedUrl(key: string, options: PresignedUrlOptions): Promise<string> {
        let command;

        switch (options.method) {
            case 'PUT':
                command = new PutObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                    ContentType: options.contentType,
                });
                break;
            case 'DELETE':
                command = new DeleteObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                });
                break;
            default:
                command = new GetObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                });
        }

        return getSignedUrl(this.client, command, {
            expiresIn: options.expiresIn,
        });
    }

    async createMultipartUpload(key: string, options: UploadOptions = {}): Promise<string> {
        const command = new CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: options.mimeType,
            Metadata: options.metadata,
            ACL: options.acl,
        });

        const result = await this.client.send(command);

        if (!result.UploadId) {
            throw new Error('Failed to create multipart upload');
        }

        return result.UploadId;
    }

    async uploadPart(uploadId: string, key: string, partNumber: number, data: Buffer): Promise<string> {
        const command = new UploadPartCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
            Body: data,
        });

        const result = await this.client.send(command);

        if (!result.ETag) {
            throw new Error('Failed to upload part');
        }

        return result.ETag;
    }

    async completeMultipartUpload(
        uploadId: string,
        key: string,
        parts: Array<{ partNumber: number; etag: string }>
    ): Promise<FileMetadata> {
        const command = new CompleteMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: {
                Parts: parts.map(part => ({
                    PartNumber: part.partNumber,
                    ETag: part.etag,
                })),
            },
        });

        await this.client.send(command);
        return this.getMetadata(key);
    }

    async abortMultipartUpload(uploadId: string, key: string): Promise<void> {
        const command = new AbortMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
        });

        await this.client.send(command);
    }

    async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
        try {
            // Try to list objects to verify connection
            const command = new ListObjectsV2Command({
                Bucket: this.bucket,
                MaxKeys: 1,
            });

            await this.client.send(command);

            return {
                status: 'healthy',
                details: {
                    provider: 's3',
                    bucket: this.bucket,
                    region: this.client.config.region,
                }
            };
        } catch (error: any) {
            return {
                status: 'unhealthy',
                details: {
                    provider: 's3',
                    bucket: this.bucket,
                    error: error.message,
                }
            };
        }
    }
}