import { beforeAll, afterAll, beforeEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';

// Test data directory
export const TEST_DATA_DIR = path.join(__dirname, 'test-data');

// Create test data directory and sample files
beforeAll(async () => {
    try {
        await fs.mkdir(TEST_DATA_DIR, { recursive: true });

        // Create sample text file
        await fs.writeFile(
            path.join(TEST_DATA_DIR, 'sample.txt'),
            'This is a sample text file for testing file processing capabilities.'
        );

        // Create sample HTML file
        await fs.writeFile(
            path.join(TEST_DATA_DIR, 'sample.html'),
            `<!DOCTYPE html>
<html>
<head>
    <title>Sample HTML</title>
</head>
<body>
    <h1>Sample Document</h1>
    <p>This is a sample HTML document for testing.</p>
</body>
</html>`
        );

        // Create sample CSV file
        await fs.writeFile(
            path.join(TEST_DATA_DIR, 'sample.csv'),
            'Name,Age,City\nJohn Doe,30,New York\nJane Smith,25,Los Angeles\nBob Johnson,35,Chicago'
        );

        // Create a simple PNG image (1x1 pixel)
        const pngBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
            0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
            0x49, 0x48, 0x44, 0x52, // IHDR
            0x00, 0x00, 0x00, 0x01, // Width: 1
            0x00, 0x00, 0x00, 0x01, // Height: 1
            0x08, 0x02, 0x00, 0x00, 0x00, // Bit depth, color type, compression, filter, interlace
            0x90, 0x77, 0x53, 0xDE, // CRC
            0x00, 0x00, 0x00, 0x0C, // IDAT chunk length
            0x49, 0x44, 0x41, 0x54, // IDAT
            0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
            0xE2, 0x21, 0xBC, 0x33, // CRC
            0x00, 0x00, 0x00, 0x00, // IEND chunk length
            0x49, 0x45, 0x4E, 0x44, // IEND
            0xAE, 0x42, 0x60, 0x82  // CRC
        ]);

        await fs.writeFile(path.join(TEST_DATA_DIR, 'sample.png'), pngBuffer);

        console.log('Test data setup completed');
    } catch (error) {
        console.error('Failed to setup test data:', error);
    }
});

// Clean up test data
afterAll(async () => {
    try {
        await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
        console.log('Test data cleanup completed');
    } catch (error) {
        console.error('Failed to cleanup test data:', error);
    }
});

// Clean up temp files before each test
beforeEach(async () => {
    try {
        // Clean up any existing temp files
        const files = await fs.readdir(TEST_DATA_DIR);
        const tempFiles = files.filter(file => file.startsWith('temp_'));
        await Promise.all(tempFiles.map(file =>
            fs.unlink(path.join(TEST_DATA_DIR, file)).catch(() => { })
        ));
    } catch (error) {
        // Ignore cleanup errors
    }
});

// Helper functions for tests
export function getTestFilePath(filename: string): string {
    return path.join(TEST_DATA_DIR, filename);
}

export function getTempFilePath(filename: string): string {
    return path.join(TEST_DATA_DIR, `temp_${filename}`);
}

export async function createTempFile(filename: string, content: string | Buffer): Promise<string> {
    const filePath = getTempFilePath(filename);
    // Ensure directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    return filePath;
}

export async function cleanupTempFile(filePath: string): Promise<void> {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        // Ignore cleanup errors
    }
}