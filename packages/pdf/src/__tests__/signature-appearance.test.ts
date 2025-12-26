import { PDFDocument } from 'pdf-lib';
import {
    SignatureAppearanceEngine,
    createSignatureAppearanceEngine,
    SignatureAppearanceConfig,
    SignatureAppearanceMetadata,
    PDFEngine,
    createPDFEngine,
    PDFProcessingError
} from '../index';

describe('SignatureAppearanceEngine', () => {
    let signatureEngine: SignatureAppearanceEngine;
    let pdfEngine: PDFEngine;
    let document: PDFDocument;

    beforeEach(async () => {
        signatureEngine = createSignatureAppearanceEngine();
        pdfEngine = createPDFEngine();
        document = await PDFDocument.create();
        document.addPage([612, 792]); // Letter size
    });

    afterEach(() => {
        signatureEngine.clearCache();
    });

    describe('Text-based signatures', () => {
        it('should create a basic text signature', async () => {
            const config: SignatureAppearanceConfig = {
                text: 'John Doe',
                font: 'Helvetica',
                fontSize: 14,
                x: 100,
                y: 100,
                width: 150,
                height: 50,
                page: 0,
                textColor: '#000000',
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'John Doe',
                signingTime: new Date(),
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                config,
                metadata
            );

            expect(result.success).toBe(true);
            expect(result.signatureId).toBeDefined();
            expect(result.boundingBox).toEqual({
                x: 100,
                y: 100,
                width: 150,
                height: 50,
                page: 0,
            });
            expect(result.processingTime).toBeGreaterThan(0);
        });

        it('should create text signature with background and border', async () => {
            const config: SignatureAppearanceConfig = {
                text: 'Jane Smith',
                font: 'Times-Roman',
                fontSize: 16,
                x: 200,
                y: 200,
                width: 180,
                height: 60,
                page: 0,
                backgroundColor: '#f8f9fa',
                borderColor: '#007bff',
                borderWidth: 2,
                textColor: '#212529',
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Jane Smith',
                signingTime: new Date(),
                reason: 'Document approval',
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                config,
                metadata
            );

            expect(result.success).toBe(true);
            expect(result.signatureId).toBeDefined();
        });

        it('should create text signature with metadata display', async () => {
            const config: SignatureAppearanceConfig = {
                text: 'Executive Signature',
                font: 'Helvetica',
                fontSize: 12,
                x: 50,
                y: 300,
                width: 200,
                height: 80,
                page: 0,
                showTimestamp: true,
                showSignerName: true,
                showReason: true,
                showLocation: true,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Chief Executive Officer',
                signingTime: new Date(),
                reason: 'Executive approval',
                location: 'New York, NY',
                contactInfo: 'ceo@company.com',
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                config,
                metadata
            );

            expect(result.success).toBe(true);
            expect(result.metadata).toEqual(metadata);
        });
    });

    describe('Image-based signatures', () => {
        const sampleImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

        it('should create an image-based signature', async () => {
            const config: SignatureAppearanceConfig = {
                imageData: sampleImageData,
                imageFormat: 'png',
                x: 100,
                y: 400,
                width: 160,
                height: 70,
                page: 0,
                borderColor: '#28a745',
                borderWidth: 1,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Digital Signer',
                signingTime: new Date(),
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                config,
                metadata
            );

            expect(result.success).toBe(true);
            expect(result.signatureId).toBeDefined();
        });

        it('should create image signature with logo branding', async () => {
            const config: SignatureAppearanceConfig = {
                imageData: sampleImageData,
                imageFormat: 'png',
                x: 250,
                y: 450,
                width: 180,
                height: 80,
                page: 0,
                logo: sampleImageData,
                logoPosition: 'top-right',
                logoSize: 24,
                showTimestamp: true,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Corporate User',
                signingTime: new Date(),
                reason: 'Contract execution',
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                config,
                metadata
            );

            expect(result.success).toBe(true);
        });

        it('should handle different image formats', async () => {
            const jpegConfig: SignatureAppearanceConfig = {
                imageData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
                imageFormat: 'jpg',
                x: 100,
                y: 500,
                width: 120,
                height: 50,
                page: 0,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'JPEG Signer',
                signingTime: new Date(),
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                jpegConfig,
                metadata
            );

            expect(result.success).toBe(true);
        });
    });

    describe('Default signatures', () => {
        it('should create default signature when no image or text provided', async () => {
            const config: SignatureAppearanceConfig = {
                x: 300,
                y: 300,
                width: 140,
                height: 60,
                page: 0,
                backgroundColor: '#f0f0f0',
                borderColor: '#666666',
                borderWidth: 1,
                showTimestamp: true,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Default User',
                signingTime: new Date(),
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                config,
                metadata
            );

            expect(result.success).toBe(true);
            expect(result.signatureId).toBeDefined();
        });
    });

    describe('Multi-page coordination', () => {
        it('should create multi-page signature references', async () => {
            // Add a second page
            document.addPage([612, 792]);

            const config: SignatureAppearanceConfig = {
                text: 'Multi-Page Signature',
                font: 'Helvetica',
                fontSize: 12,
                x: 100,
                y: 600,
                width: 180,
                height: 50,
                page: 0,
                multiPageCoordination: true,
                pageReferences: [
                    { page: 1, x: 450, y: 50, width: 100, height: 30 },
                ],
                showTimestamp: false,
                showSignerName: true,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Multi-Page Signer',
                signingTime: new Date(),
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                config,
                metadata
            );

            expect(result.success).toBe(true);
            expect(result.multiPageReferences).toBeDefined();
            expect(result.multiPageReferences).toHaveLength(1);
            expect(result.multiPageReferences![0]).toEqual({
                page: 1,
                x: 450,
                y: 50,
                width: 100,
                height: 30,
            });
        });
    });

    describe('Positioning and sizing controls', () => {
        it('should apply rotation and scaling', async () => {
            const config: SignatureAppearanceConfig = {
                text: 'Rotated Signature',
                font: 'Courier',
                fontSize: 10,
                x: 200,
                y: 200,
                width: 120,
                height: 40,
                page: 0,
                rotation: 45,
                scaleX: 1.5,
                scaleY: 0.8,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Rotated Signer',
                signingTime: new Date(),
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                config,
                metadata
            );

            expect(result.success).toBe(true);
        });

        it('should validate positioning within page bounds', async () => {
            const config: SignatureAppearanceConfig = {
                text: 'Out of bounds',
                x: 700, // Beyond page width (612)
                y: 100,
                width: 100,
                height: 50,
                page: 0,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Invalid Position',
                signingTime: new Date(),
            };

            await expect(
                signatureEngine.generateSignatureAppearance(document, config, metadata)
            ).rejects.toThrow(PDFProcessingError);
        });

        it('should validate negative positioning', async () => {
            const config: SignatureAppearanceConfig = {
                text: 'Negative position',
                x: -10,
                y: 100,
                width: 100,
                height: 50,
                page: 0,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Negative Position',
                signingTime: new Date(),
            };

            await expect(
                signatureEngine.generateSignatureAppearance(document, config, metadata)
            ).rejects.toThrow(PDFProcessingError);
        });
    });

    describe('Error handling', () => {
        it('should handle invalid page numbers', async () => {
            const config: SignatureAppearanceConfig = {
                text: 'Invalid page',
                x: 100,
                y: 100,
                width: 100,
                height: 50,
                page: 5, // Page doesn't exist
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Invalid Page User',
                signingTime: new Date(),
            };

            await expect(
                signatureEngine.generateSignatureAppearance(document, config, metadata)
            ).rejects.toThrow(PDFProcessingError);
        });

        it('should handle malformed image data gracefully', async () => {
            const config: SignatureAppearanceConfig = {
                imageData: 'invalid-base64-data',
                x: 100,
                y: 100,
                width: 100,
                height: 50,
                page: 0,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Invalid Image User',
                signingTime: new Date(),
            };

            await expect(
                signatureEngine.generateSignatureAppearance(document, config, metadata)
            ).rejects.toThrow(PDFProcessingError);
        });
    });

    describe('PDF Engine integration', () => {
        it('should create signature with appearance using PDF engine', async () => {
            const config: SignatureAppearanceConfig = {
                text: 'Engine Integration',
                font: 'Helvetica',
                fontSize: 14,
                x: 100,
                y: 300,
                width: 160,
                height: 50,
                page: 0,
                backgroundColor: '#e9ecef',
                borderColor: '#6c757d',
                borderWidth: 1,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Engine User',
                signingTime: new Date(),
                reason: 'Integration test',
            };

            const result = await pdfEngine.createSignatureWithAppearance(
                document,
                'engineSignature',
                config,
                metadata
            );

            expect(result.field).toBeDefined();
            expect(result.field.getName()).toBe('engineSignature');
            expect(result.appearance.success).toBe(true);
            expect(result.appearance.signatureId).toBeDefined();
        });

        it('should update existing signature appearance', async () => {
            // First create a signature field
            const fieldDef = {
                type: 'signature' as const,
                name: 'updateTest',
                page: 0,
                x: 200,
                y: 400,
                width: 140,
                height: 60,
                required: false,
                readonly: false,
            };

            await pdfEngine.createField(document, fieldDef);

            // Then update its appearance
            const config: SignatureAppearanceConfig = {
                text: 'Updated Signature',
                font: 'Times-Roman',
                fontSize: 12,
                x: 200,
                y: 400,
                width: 140,
                height: 60,
                page: 0,
                backgroundColor: '#fff3cd',
                textColor: '#856404',
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Updated User',
                signingTime: new Date(),
            };

            const result = await pdfEngine.updateSignatureAppearance(
                document,
                'updateTest',
                config,
                metadata
            );

            expect(result.success).toBe(true);
        });

        it('should handle multi-page signatures through PDF engine', async () => {
            // Add second page
            document.addPage([612, 792]);

            const primaryConfig: SignatureAppearanceConfig = {
                text: 'Primary Signature',
                font: 'Helvetica',
                fontSize: 14,
                x: 100,
                y: 500,
                width: 150,
                height: 60,
                page: 0,
            };

            const pageReferences = [
                { page: 1, x: 400, y: 100, width: 120, height: 40 },
            ];

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Multi-Page User',
                signingTime: new Date(),
            };

            const result = await pdfEngine.applyMultiPageSignature(
                document,
                primaryConfig,
                pageReferences,
                metadata
            );

            expect(result.success).toBe(true);
            expect(result.multiPageReferences).toHaveLength(1);
        });

        it('should clear signature cache', () => {
            expect(() => pdfEngine.clearSignatureCache()).not.toThrow();
            expect(() => signatureEngine.clearCache()).not.toThrow();
        });
    });

    describe('Configuration validation', () => {
        it('should validate required positioning fields', async () => {
            const invalidConfig = {
                text: 'Missing position',
                // Missing x, y, width, height
            } as SignatureAppearanceConfig;

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Invalid Config User',
                signingTime: new Date(),
            };

            await expect(
                signatureEngine.generateSignatureAppearance(document, invalidConfig, metadata)
            ).rejects.toThrow();
        });

        it('should validate color format', async () => {
            const config: SignatureAppearanceConfig = {
                text: 'Invalid color',
                x: 100,
                y: 100,
                width: 100,
                height: 50,
                page: 0,
                textColor: 'invalid-color', // Invalid color format
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Invalid Color User',
                signingTime: new Date(),
            };

            await expect(
                signatureEngine.generateSignatureAppearance(document, config, metadata)
            ).rejects.toThrow();
        });
    });

    describe('Performance and quality settings', () => {
        it('should apply image quality settings', async () => {
            const config: SignatureAppearanceConfig = {
                imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
                x: 100,
                y: 100,
                width: 100,
                height: 50,
                page: 0,
                imageQuality: 0.7,
                antiAliasing: true,
            };

            const metadata: SignatureAppearanceMetadata = {
                signerName: 'Quality Test User',
                signingTime: new Date(),
            };

            const result = await signatureEngine.generateSignatureAppearance(
                document,
                config,
                metadata
            );

            expect(result.success).toBe(true);
            expect(result.processingTime).toBeGreaterThanOrEqual(0);
        });
    });
});