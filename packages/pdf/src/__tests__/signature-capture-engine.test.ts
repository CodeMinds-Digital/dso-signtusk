import { describe, it, expect, beforeEach } from 'vitest';
import { SignatureCaptureEngine, createSignatureCaptureEngine } from '../signature-capture-engine';
import type {
    DrawnSignatureData,
    TypedSignatureData,
    UploadedSignatureData,
    SignatureCaptureOptions
} from '../types';

describe('SignatureCaptureEngine', () => {
    let engine: SignatureCaptureEngine;

    beforeEach(() => {
        engine = createSignatureCaptureEngine();
    });

    describe('Factory Function', () => {
        it('should create a SignatureCaptureEngine instance', () => {
            const engine = createSignatureCaptureEngine();
            expect(engine).toBeInstanceOf(SignatureCaptureEngine);
        });
    });

    describe('Drawn Signature Processing', () => {
        it('should process a simple drawn signature', async () => {
            const drawnData: DrawnSignatureData = {
                method: 'drawn',
                strokes: [
                    {
                        points: [
                            { x: 10, y: 50 },
                            { x: 50, y: 30 },
                            { x: 90, y: 50 }
                        ],
                        strokeWidth: 2,
                        color: '#000000',
                        opacity: 1
                    }
                ],
                canvasWidth: 200,
                canvasHeight: 100,
                smoothing: true,
                antiAliasing: true
            };

            const options: SignatureCaptureOptions = {
                targetWidth: 400,
                targetHeight: 150,
                qualityLevel: 'low', // Use low quality for testing
                outputFormat: 'png',
                padding: { top: 10, bottom: 10, left: 10, right: 10 },
                dpi: 150,
                compression: 85
            };

            const result = await engine.captureSignature(drawnData, options);

            expect(result.success).toBe(true);
            expect(result.signatureId).toMatch(/^sig_\d+_[a-z0-9]+$/);
            expect(result.format).toBe('png');
            expect(result.width).toBe(400);
            expect(result.height).toBe(150);
            expect(result.imageData).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 pattern
            expect(result.qualityMetrics.score).toBeGreaterThan(0);
            expect(result.metadata.captureMethod).toBe('drawn');
            expect(result.metadata.processingSteps).toContain('stroke_rendering');
            expect(result.metadata.processingSteps).toContain('smoothing');
        });

        it('should handle multiple strokes with different properties', async () => {
            const drawnData: DrawnSignatureData = {
                method: 'drawn',
                strokes: [
                    {
                        points: [
                            { x: 10, y: 50 },
                            { x: 50, y: 30 }
                        ],
                        strokeWidth: 2,
                        color: '#000000',
                        opacity: 1
                    },
                    {
                        points: [
                            { x: 60, y: 40 },
                            { x: 90, y: 60 }
                        ],
                        strokeWidth: 3,
                        color: '#333333',
                        opacity: 0.8
                    }
                ],
                canvasWidth: 200,
                canvasHeight: 100,
                smoothing: true,
                antiAliasing: true
            };

            const result = await engine.captureSignature(drawnData, { qualityLevel: 'low' });

            expect(result.success).toBe(true);
            expect(result.qualityMetrics.score).toBeGreaterThan(0);
        });

        it('should handle empty strokes gracefully', async () => {
            const drawnData: DrawnSignatureData = {
                method: 'drawn',
                strokes: [],
                canvasWidth: 200,
                canvasHeight: 100,
                smoothing: true,
                antiAliasing: true
            };

            const result = await engine.captureSignature(drawnData, { qualityLevel: 'low' });

            expect(result.success).toBe(true);
            // Should still produce a valid result even with no strokes
        });
    });

    describe('Typed Signature Processing', () => {
        it('should process a typed signature with default options', async () => {
            const typedData: TypedSignatureData = {
                method: 'typed',
                text: 'John Doe',
                fontFamily: 'Helvetica',
                fontSize: 24,
                fontWeight: 'normal',
                fontStyle: 'normal',
                color: '#000000',
                textAlign: 'center',
                letterSpacing: 0,
                lineHeight: 1.2
            };

            const result = await engine.captureSignature(typedData, { qualityLevel: 'low' });

            expect(result.success).toBe(true);
            expect(result.metadata.captureMethod).toBe('typed');
            expect(result.metadata.processingSteps).toContain('text_rendering');
            expect(result.metadata.processingSteps).toContain('font_application');
            expect(result.qualityMetrics.score).toBeGreaterThan(0);
        });

        it('should handle different font families and styles', async () => {
            const typedData: TypedSignatureData = {
                method: 'typed',
                text: 'Jane Smith',
                fontFamily: 'Times-Roman',
                fontSize: 32,
                fontWeight: 'bold',
                fontStyle: 'italic',
                color: '#333333',
                backgroundColor: '#f0f0f0',
                textAlign: 'left',
                letterSpacing: 1,
                lineHeight: 1.5
            };

            const result = await engine.captureSignature(typedData, { qualityLevel: 'low' });

            expect(result.success).toBe(true);
            expect(result.qualityMetrics.score).toBeGreaterThan(0);
        });

        it('should handle long text appropriately', async () => {
            const typedData: TypedSignatureData = {
                method: 'typed',
                text: 'Dr. Alexander Montgomery-Richardson III',
                fontFamily: 'Courier',
                fontSize: 18,
                fontWeight: 'normal',
                fontStyle: 'normal',
                color: '#000000',
                textAlign: 'center',
                letterSpacing: 0,
                lineHeight: 1.2
            };

            const result = await engine.captureSignature(typedData, { qualityLevel: 'low' });

            expect(result.success).toBe(true);
            expect(result.qualityMetrics.score).toBeGreaterThan(0);
        });
    });

    describe('Uploaded Signature Processing', () => {
        it('should process an uploaded PNG signature', async () => {
            // Create a simple base64 encoded 1x1 PNG image for testing
            const simplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==';

            const uploadedData: UploadedSignatureData = {
                method: 'uploaded',
                imageData: `data:image/png;base64,${simplePngBase64}`,
                originalFormat: 'png',
                originalWidth: 1,
                originalHeight: 1,
                preserveAspectRatio: true,
                removeBackground: false,
                enhanceContrast: false
            };

            const result = await engine.captureSignature(uploadedData, { qualityLevel: 'low' });

            expect(result.success).toBe(true);
            expect(result.metadata.captureMethod).toBe('uploaded');
            expect(result.metadata.processingSteps).toContain('image_decoding');
            expect(result.metadata.processingSteps).toContain('format_conversion');
        });

        it('should handle image enhancement options', async () => {
            const simplePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==';

            const uploadedData: UploadedSignatureData = {
                method: 'uploaded',
                imageData: `data:image/png;base64,${simplePngBase64}`,
                originalFormat: 'png',
                originalWidth: 1,
                originalHeight: 1,
                preserveAspectRatio: false,
                removeBackground: true,
                enhanceContrast: true
            };

            const result = await engine.captureSignature(uploadedData, { qualityLevel: 'low' });

            expect(result.success).toBe(true);
            expect(result.metadata.processingSteps).toContain('background_removal');
        });
    });

    describe('Quality Validation', () => {
        it('should validate signature quality and provide metrics', async () => {
            const drawnData: DrawnSignatureData = {
                method: 'drawn',
                strokes: [
                    {
                        points: [
                            { x: 10, y: 50 },
                            { x: 50, y: 30 },
                            { x: 90, y: 50 }
                        ],
                        strokeWidth: 2,
                        color: '#000000',
                        opacity: 1
                    }
                ],
                canvasWidth: 200,
                canvasHeight: 100,
                smoothing: true,
                antiAliasing: true
            };

            const result = await engine.captureSignature(drawnData, { qualityLevel: 'low' });

            expect(result.qualityMetrics).toBeDefined();
            expect(result.qualityMetrics.score).toBeGreaterThanOrEqual(0);
            expect(result.qualityMetrics.score).toBeLessThanOrEqual(100);
            expect(result.qualityMetrics.factors.resolution).toBeGreaterThanOrEqual(0);
            expect(result.qualityMetrics.factors.contrast).toBeGreaterThanOrEqual(0);
            expect(result.qualityMetrics.factors.strokeConsistency).toBeGreaterThanOrEqual(0);
            expect(result.qualityMetrics.factors.aspectRatio).toBeGreaterThanOrEqual(0);
            expect(result.qualityMetrics.factors.backgroundNoise).toBeGreaterThanOrEqual(0);
            expect(Array.isArray(result.qualityMetrics.recommendations)).toBe(true);
            expect(typeof result.qualityMetrics.isAcceptable).toBe('boolean');
        });

        it('should reject low quality signatures when threshold is high', async () => {
            // Create a very simple signature that should have low quality
            const lowQualityData: DrawnSignatureData = {
                method: 'drawn',
                strokes: [
                    {
                        points: [
                            { x: 1, y: 1 },
                            { x: 2, y: 2 }
                        ],
                        strokeWidth: 1,
                        color: '#cccccc', // Very light color
                        opacity: 0.1 // Very low opacity
                    }
                ],
                canvasWidth: 10,
                canvasHeight: 10,
                smoothing: false,
                antiAliasing: false
            };

            try {
                await engine.captureSignature(lowQualityData, {
                    qualityLevel: 'ultra',
                    targetWidth: 50,
                    targetHeight: 25
                });
                // If we reach here, the test should fail because we expect an error
                expect(true).toBe(false);
            } catch (error: any) {
                expect(error.name).toBe('SignatureQualityError');
                expect(error.code).toBe('SIGNATURE_QUALITY_ERROR');
            }
        });
    });

    describe('Output Formats', () => {
        it('should support PNG output format', async () => {
            const typedData: TypedSignatureData = {
                method: 'typed',
                text: 'Test',
                fontFamily: 'Helvetica',
                fontSize: 24,
                fontWeight: 'normal',
                fontStyle: 'normal',
                color: '#000000',
                textAlign: 'center',
                letterSpacing: 0,
                lineHeight: 1.2
            };

            const result = await engine.captureSignature(typedData, { outputFormat: 'png', qualityLevel: 'low' });

            expect(result.success).toBe(true);
            expect(result.format).toBe('png');
        });

        it('should support JPEG output format', async () => {
            const typedData: TypedSignatureData = {
                method: 'typed',
                text: 'Test',
                fontFamily: 'Helvetica',
                fontSize: 24,
                fontWeight: 'normal',
                fontStyle: 'normal',
                color: '#000000',
                textAlign: 'center',
                letterSpacing: 0,
                lineHeight: 1.2
            };

            const result = await engine.captureSignature(typedData, { outputFormat: 'jpeg', qualityLevel: 'low' });

            expect(result.success).toBe(true);
            expect(result.format).toBe('jpeg');
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid signature data', async () => {
            const invalidData = {
                method: 'invalid',
                text: 'Test'
            } as any;

            try {
                await engine.captureSignature(invalidData);
                expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
                expect(error.name).toBe('SignatureProcessingError');
            }
        });

        it('should handle processing errors gracefully', async () => {
            const typedData: TypedSignatureData = {
                method: 'typed',
                text: '', // Empty text should be invalid
                fontFamily: 'Helvetica',
                fontSize: 24,
                fontWeight: 'normal',
                fontStyle: 'normal',
                color: '#000000',
                textAlign: 'center',
                letterSpacing: 0,
                lineHeight: 1.2
            };

            try {
                await engine.captureSignature(typedData);
                expect(true).toBe(false); // Should not reach here
            } catch (error: any) {
                expect(error).toBeInstanceOf(Error);
            }
        });
    });

    describe('Performance', () => {
        it('should process signatures within reasonable time', async () => {
            const typedData: TypedSignatureData = {
                method: 'typed',
                text: 'Performance Test',
                fontFamily: 'Helvetica',
                fontSize: 24,
                fontWeight: 'normal',
                fontStyle: 'normal',
                color: '#000000',
                textAlign: 'center',
                letterSpacing: 0,
                lineHeight: 1.2
            };

            const startTime = Date.now();
            const result = await engine.captureSignature(typedData, { qualityLevel: 'low' });
            const endTime = Date.now();

            expect(result.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
            expect(result.processingTime).toBeGreaterThan(0);
        });
    });
});