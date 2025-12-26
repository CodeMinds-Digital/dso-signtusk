import { beforeAll, afterAll } from 'vitest';

// Global test setup
beforeAll(() => {
    // Setup any global test configuration
    console.log('Setting up PDF processing tests...');
});

afterAll(() => {
    // Cleanup after all tests
    console.log('Cleaning up PDF processing tests...');
});

// Test utilities
export const createTestPDFBuffer = (): Buffer => {
    // Create a minimal valid PDF buffer for testing
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj

xref
0 4
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000100 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
150
%%EOF`;

    return Buffer.from(pdfContent);
};

export const createInvalidPDFBuffer = (): Buffer => {
    return Buffer.from('This is not a PDF file');
};

export const createLargePDFBuffer = (sizeMB: number): Buffer => {
    const baseContent = createTestPDFBuffer();
    const targetSize = sizeMB * 1024 * 1024;
    const padding = Buffer.alloc(Math.max(0, targetSize - baseContent.length), 0);
    return Buffer.concat([baseContent, padding]);
};