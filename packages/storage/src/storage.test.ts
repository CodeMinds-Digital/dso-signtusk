import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StorageServiceFactory } from './factory';
import { StorageService, FileNotFoundError } from './types';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('Storage Service', () => {
    let storageService: StorageService;
    let testDir: string;

    beforeEach(async () => {
        // Create a temporary directory for testing
        testDir = join(tmpdir(), `storage-test-${Date.now()}`);
        await fs.mkdir(testDir, { recursive: true });

        storageService = StorageServiceFactory.create({
            provider: 'local',
            local: {
                basePath: testDir,
                createDirectories: true,
            },
        });
    });

    afterEach(async () => {
        // Clean up test directory
        try {
            await fs.rm(testDir, { recursive: true, force: true });
        } catch {
            // Ignore cleanup errors
        }
    });

    describe('Basic Operations', () => {
        it('should upload and download a file', async () => {
            const key = 'test-file.txt';
            const content = 'Hello, World!';

            // Upload file
            const metadata = await storageService.upload(key, content, {
                mimeType: 'text/plain',
            });

            expect(metadata.key).toBe(key);
            expect(metadata.size).toBe(content.length);
            expect(metadata.mimeType).toBe('text/plain');

            // Download file
            const downloadedContent = await storageService.download(key);
            expect(downloadedContent.toString()).toBe(content);
        });

        it('should check if file exists', async () => {
            const key = 'test-exists.txt';
            const content = 'Test content';

            // File should not exist initially
            expect(await storageService.exists(key)).toBe(false);

            // Upload file
            await storageService.upload(key, content);

            // File should exist now
            expect(await storageService.exists(key)).toBe(true);
        });

        it('should delete a file', async () => {
            const key = 'test-delete.txt';
            const content = 'To be deleted';

            // Upload file
            await storageService.upload(key, content);
            expect(await storageService.exists(key)).toBe(true);

            // Delete file
            await storageService.delete(key);
            expect(await storageService.exists(key)).toBe(false);
        });

        it('should get file metadata', async () => {
            const key = 'test-metadata.txt';
            const content = 'Metadata test';

            await storageService.upload(key, content, {
                mimeType: 'text/plain',
                metadata: { author: 'test-user' },
            });

            const metadata = await storageService.getMetadata(key);
            expect(metadata.key).toBe(key);
            expect(metadata.size).toBe(content.length);
            expect(metadata.mimeType).toBe('text/plain');
            expect(metadata.customMetadata).toEqual({ author: 'test-user' });
        });
    });

    describe('Stream Operations', () => {
        it('should upload and download using streams', async () => {
            const key = 'test-stream.txt';
            const content = 'Stream test content';

            // Create a readable stream from string
            const { Readable } = await import('stream');
            const uploadStream = Readable.from([content]);

            // Upload using stream
            const metadata = await storageService.uploadStream(key, uploadStream, {
                mimeType: 'text/plain',
            });

            expect(metadata.key).toBe(key);
            expect(metadata.size).toBe(content.length);

            // Download using stream
            const downloadStream = await storageService.downloadStream(key);
            const chunks: Buffer[] = [];

            for await (const chunk of downloadStream) {
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            }

            const downloadedContent = Buffer.concat(chunks).toString();
            expect(downloadedContent).toBe(content);
        });

        it('should handle range downloads', async () => {
            const key = 'test-range.txt';
            const content = 'This is a test for range downloads';

            await storageService.upload(key, content);

            // Download a range (first 10 characters)
            const rangeContent = await storageService.download(key, {
                range: { start: 0, end: 9 }
            });

            expect(rangeContent.toString()).toBe('This is a ');
        });
    });

    describe('Error Handling', () => {
        it('should throw FileNotFoundError for non-existent files', async () => {
            const key = 'non-existent-file.txt';

            await expect(storageService.download(key)).rejects.toThrow(FileNotFoundError);
            await expect(storageService.getMetadata(key)).rejects.toThrow(FileNotFoundError);
        });

        it('should handle invalid range requests gracefully', async () => {
            const key = 'test-invalid-range.txt';
            const content = 'Short';

            await storageService.upload(key, content);

            // Request range beyond file size
            const result = await storageService.download(key, {
                range: { start: 0, end: 100 }
            });

            // Should return the entire file content
            expect(result.toString()).toBe(content);
        });
    });

    describe('Health Check', () => {
        it('should report healthy status', async () => {
            const health = await storageService.healthCheck?.();
            expect(health?.status).toBe('healthy');
            expect(health?.details?.provider).toBe('local');
        });
    });

    describe('List Operations', () => {
        it('should list files', async () => {
            // Upload multiple files
            await storageService.upload('file1.txt', 'Content 1');
            await storageService.upload('file2.txt', 'Content 2');
            await storageService.upload('folder/file3.txt', 'Content 3');

            const result = await storageService.list();
            expect(result.files.length).toBeGreaterThanOrEqual(3);

            const fileNames = result.files.map(f => f.key);
            expect(fileNames).toContain('file1.txt');
            expect(fileNames).toContain('file2.txt');
            expect(fileNames).toContain('folder/file3.txt');
        });

        it('should list files with prefix filter', async () => {
            await storageService.upload('prefix/file1.txt', 'Content 1');
            await storageService.upload('prefix/file2.txt', 'Content 2');
            await storageService.upload('other/file3.txt', 'Content 3');

            const result = await storageService.list({ prefix: 'prefix/' });
            expect(result.files.length).toBe(2);

            const fileNames = result.files.map(f => f.key);
            expect(fileNames).toContain('prefix/file1.txt');
            expect(fileNames).toContain('prefix/file2.txt');
            expect(fileNames).not.toContain('other/file3.txt');
        });
    });

    describe('Copy and Move Operations', () => {
        it('should copy files', async () => {
            const sourceKey = 'source.txt';
            const destKey = 'destination.txt';
            const content = 'Copy test content';

            await storageService.upload(sourceKey, content);

            const metadata = await storageService.copy(sourceKey, destKey);
            expect(metadata.key).toBe(destKey);

            // Both files should exist
            expect(await storageService.exists(sourceKey)).toBe(true);
            expect(await storageService.exists(destKey)).toBe(true);

            // Content should be the same
            const destContent = await storageService.download(destKey);
            expect(destContent.toString()).toBe(content);
        });

        it('should move files', async () => {
            const sourceKey = 'move-source.txt';
            const destKey = 'move-destination.txt';
            const content = 'Move test content';

            await storageService.upload(sourceKey, content);

            const metadata = await storageService.move(sourceKey, destKey);
            expect(metadata.key).toBe(destKey);

            // Source should not exist, destination should exist
            expect(await storageService.exists(sourceKey)).toBe(false);
            expect(await storageService.exists(destKey)).toBe(true);

            // Content should be preserved
            const destContent = await storageService.download(destKey);
            expect(destContent.toString()).toBe(content);
        });
    });
});