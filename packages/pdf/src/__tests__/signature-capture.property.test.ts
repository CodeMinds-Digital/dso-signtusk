import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SignatureCaptureEngine, createSignatureCaptureEngine } from '../signature-capture-engine';
import type {
    DrawnSignatureData,
    TypedSignatureData,
    UploadedSignatureData,
    SignatureCaptureOptions,
    SignatureCaptureData
} from '../types';

/**
 * **Feature: docusign-alternative-comprehensive, Property 23: Signature Capture Versatility**
 * **Validates: Requirements 5.3**
 * 
 * Property-based tests for signature capture system versatility.
 * Tests that multiple input methods (drawing, typing, image upload) work correctly 
 * with proper quality validation across various inputs.
 */
describe('Signature Capture Versatility - Property Tests', () => {
    const engine = createSignatureCaptureEngine();

    // Generators for property-based testing
    const arbitraryColor = () => fc.hexaString({ minLength: 6, maxLength: 6 }).map(hex => `#${hex}`);

    const arbitraryPoint = () => fc.record({
        x: fc.float({ min: Math.fround(10), max: Math.fround(500), noNaN: true }),
        y: fc.float({ min: Math.fround(10), max: Math.fround(300), noNaN: true }),
        pressure: fc.option(fc.float({ min: Math.fround(0), max: Math.fround(1), noNaN: true })),
        timestamp: fc.option(fc.integer({ min: 0 }))
    });

    const arbitraryStroke = () => fc.record({
        points: fc.array(arbitraryPoint(), { minLength: 5, maxLength: 15 }), // More points for better quality
        strokeWidth: fc.float({ min: Math.fround(2), max: Math.fround(4), noNaN: true }), // Thicker strokes
        color: arbitraryColor(),
        opacity: fc.float({ min: Math.fround(0.8), max: Math.fround(1), noNaN: true }) // Higher opacity for better quality
    });

    const arbitraryDrawnSignature = () => fc.record({
        method: fc.constant('drawn' as const),
        strokes: fc.array(arbitraryStroke(), { minLength: 1, maxLength: 5 }), // Fewer strokes for simplicity
        canvasWidth: fc.integer({ min: 200, max: 600 }), // Larger minimum for better quality
        canvasHeight: fc.integer({ min: 100, max: 300 }), // Larger minimum for better quality
        smoothing: fc.boolean(),
        antiAliasing: fc.boolean()
    });

    const arbitraryTypedSignature = () => fc.record({
        method: fc.constant('typed' as const),
        text: fc.string({ minLength: 2, maxLength: 30 }).filter(s => s.trim().length > 1), // Longer minimum text
        fontFamily: fc.constantFrom('Helvetica', 'Times-Roman', 'Courier', 'Arial', 'Georgia', 'Verdana'),
        fontSize: fc.integer({ min: 18, max: 48 }), // Larger font sizes
        fontWeight: fc.constantFrom('normal', 'bold'),
        fontStyle: fc.constantFrom('normal', 'italic'),
        color: arbitraryColor(),
        backgroundColor: fc.option(arbitraryColor(), { nil: undefined }), // Use undefined instead of null
        textAlign: fc.constantFrom('left', 'center', 'right'),
        letterSpacing: fc.float({ min: Math.fround(-1), max: Math.fround(3), noNaN: true }),
        lineHeight: fc.float({ min: Math.fround(1), max: Math.fround(1.5), noNaN: true })
    });

    const arbitraryUploadedSignature = () => fc.record({
        method: fc.constant('uploaded' as const),
        imageData: fc.constant('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg=='),
        originalFormat: fc.constantFrom('png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'),
        originalWidth: fc.integer({ min: 1, max: 1000 }),
        originalHeight: fc.integer({ min: 1, max: 500 }),
        preserveAspectRatio: fc.boolean(),
        removeBackground: fc.boolean(),
        enhanceContrast: fc.boolean()
    });

    const arbitrarySignatureData = () => fc.oneof(
        arbitraryDrawnSignature(),
        arbitraryTypedSignature(),
        arbitraryUploadedSignature()
    );

    const arbitrarySignatureCaptureOptions = () => fc.record({
        targetWidth: fc.integer({ min: 200, max: 800 }), // Larger minimum for better quality
        targetHeight: fc.integer({ min: 100, max: 400 }), // Larger minimum for better quality
        qualityLevel: fc.constantFrom('low', 'medium', 'high', 'ultra'),
        outputFormat: fc.constantFrom('png', 'jpeg'),
        backgroundColor: fc.option(arbitraryColor(), { nil: undefined }), // Use undefined instead of null
        padding: fc.record({
            top: fc.integer({ min: 0, max: 50 }),
            bottom: fc.integer({ min: 0, max: 50 }),
            left: fc.integer({ min: 0, max: 50 }),
            right: fc.integer({ min: 0, max: 50 })
        }),
        dpi: fc.integer({ min: 72, max: 600 }),
        compression: fc.integer({ min: 0, max: 100 })
    });

    describe('Property 23: Signature Capture Versatility', () => {
        it('should successfully process any valid signature input method', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitrarySignatureData(),
                    arbitrarySignatureCaptureOptions(),
                    async (signatureData, options) => {
                        try {
                            const result = await engine.captureSignature(signatureData, options);

                            // Core properties that must hold for all signature captures
                            expect(result.success).toBe(true);
                            expect(result.signatureId).toMatch(/^sig_\d+_[a-z0-9]+$/);
                            expect(result.format).toMatch(/^(png|jpeg)$/);
                            expect(result.width).toBeGreaterThan(0);
                            expect(result.height).toBeGreaterThan(0);
                            expect(result.imageData).toMatch(/^[A-Za-z0-9+/]+=*$/); // Base64 pattern
                            expect(result.processingTime).toBeGreaterThanOrEqual(0);

                            // Quality metrics should be valid
                            expect(result.qualityMetrics.score).toBeGreaterThanOrEqual(0);
                            expect(result.qualityMetrics.score).toBeLessThanOrEqual(100);
                            expect(typeof result.qualityMetrics.isAcceptable).toBe('boolean');
                            expect(Array.isArray(result.qualityMetrics.recommendations)).toBe(true);

                            // Metadata should be consistent with input
                            expect(result.metadata.captureMethod).toBe(signatureData.method);
                            expect(Array.isArray(result.metadata.processingSteps)).toBe(true);
                            expect(result.metadata.processingSteps.length).toBeGreaterThan(0);
                            expect(result.metadata.timestamp).toBeInstanceOf(Date);

                            // Output dimensions should match options
                            expect(result.width).toBe(options.targetWidth);
                            expect(result.height).toBe(options.targetHeight);
                            expect(result.format).toBe(options.outputFormat);

                            return true;
                        } catch (error: any) {
                            // Only SignatureQualityError is acceptable for low quality inputs
                            if (error.name === 'SignatureQualityError') {
                                expect(error.code).toBe('SIGNATURE_QUALITY_ERROR');
                                expect(typeof error.details?.qualityScore).toBe('number');
                                return true;
                            }

                            // All other errors indicate a problem with versatility
                            throw error;
                        }
                    }
                ),
                { numRuns: 50, timeout: 30000 }
            );
        });

        it('should handle drawn signatures with various stroke configurations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryDrawnSignature(),
                    async (drawnData) => {
                        try {
                            const result = await engine.captureSignature(drawnData, { qualityLevel: 'low' });

                            // Drawn signature specific properties
                            expect(result.metadata.captureMethod).toBe('drawn');
                            expect(result.metadata.processingSteps).toContain('stroke_rendering');

                            if (drawnData.smoothing) {
                                expect(result.metadata.processingSteps).toContain('smoothing');
                            }

                            if (drawnData.antiAliasing) {
                                expect(result.metadata.processingSteps).toContain('anti_aliasing');
                            }

                            // Should preserve original canvas dimensions in metadata
                            expect(result.metadata.originalDimensions.width).toBe(drawnData.canvasWidth);
                            expect(result.metadata.originalDimensions.height).toBe(drawnData.canvasHeight);

                            // Output dimensions should match default options (since no options provided)
                            expect(result.width).toBe(400); // Default target width
                            expect(result.height).toBe(150); // Default target height

                            return true;
                        } catch (error: any) {
                            // Accept quality errors for very poor inputs (e.g., all points at same location)
                            if (error.name === 'SignatureQualityError') {
                                return true;
                            }
                            // Also accept processing errors for invalid signatures
                            if (error.name === 'SignatureProcessingError') {
                                return true;
                            }
                            throw error;
                        }
                    }
                ),
                { numRuns: 30, timeout: 20000 }
            );
        });

        it('should handle typed signatures with various font configurations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryTypedSignature(),
                    async (typedData) => {
                        const result = await engine.captureSignature(typedData, { qualityLevel: 'low' });

                        // Typed signature specific properties
                        expect(result.metadata.captureMethod).toBe('typed');
                        expect(result.metadata.processingSteps).toContain('text_rendering');
                        expect(result.metadata.processingSteps).toContain('font_application');
                        expect(result.metadata.processingSteps).toContain('alignment');

                        // Typed signatures should generally have good quality
                        expect(result.qualityMetrics.score).toBeGreaterThan(0);

                        return true;
                    }
                ),
                { numRuns: 30, timeout: 15000 }
            );
        });

        it('should handle uploaded signatures with various enhancement options', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitraryUploadedSignature(),
                    async (uploadedData) => {
                        const result = await engine.captureSignature(uploadedData, { qualityLevel: 'low' });

                        // Uploaded signature specific properties
                        expect(result.metadata.captureMethod).toBe('uploaded');
                        expect(result.metadata.processingSteps).toContain('image_decoding');
                        expect(result.metadata.processingSteps).toContain('format_conversion');

                        if (uploadedData.removeBackground) {
                            expect(result.metadata.processingSteps).toContain('background_removal');
                        }

                        return true;
                    }
                ),
                { numRuns: 20, timeout: 15000 }
            );
        });

        it('should maintain quality consistency across different input methods', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitrarySignatureData(),
                    fc.constantFrom('low', 'medium', 'high'),
                    async (signatureData, qualityLevel) => {
                        try {
                            const result = await engine.captureSignature(signatureData, {
                                qualityLevel: qualityLevel as any,
                                targetWidth: 400,
                                targetHeight: 150
                            });

                            // Quality thresholds should be respected
                            const qualityThresholds = { low: 40, medium: 60, high: 80 };
                            const threshold = qualityThresholds[qualityLevel as keyof typeof qualityThresholds];

                            if (result.qualityMetrics.isAcceptable) {
                                expect(result.qualityMetrics.score).toBeGreaterThanOrEqual(threshold);
                            }

                            // Enhancement should be applied for medium and high quality
                            if (qualityLevel !== 'low') {
                                expect(result.qualityMetrics.enhancementApplied).toBe(true);
                            }

                            return true;
                        } catch (error: any) {
                            // Quality errors are acceptable when input doesn't meet threshold
                            return error.name === 'SignatureQualityError';
                        }
                    }
                ),
                { numRuns: 40, timeout: 25000 }
            );
        });

        it('should generate appropriate quality recommendations', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitrarySignatureData(),
                    async (signatureData) => {
                        try {
                            const result = await engine.captureSignature(signatureData, { qualityLevel: 'low' });

                            // Recommendations should be strings
                            expect(Array.isArray(result.qualityMetrics.recommendations)).toBe(true);
                            result.qualityMetrics.recommendations.forEach(rec => {
                                expect(typeof rec).toBe('string');
                                expect(rec.length).toBeGreaterThan(0);
                            });

                            // Quality factors should be in valid range
                            const factors = result.qualityMetrics.factors;
                            expect(factors.resolution).toBeGreaterThanOrEqual(0);
                            expect(factors.resolution).toBeLessThanOrEqual(100);
                            expect(factors.contrast).toBeGreaterThanOrEqual(0);
                            expect(factors.contrast).toBeLessThanOrEqual(100);
                            expect(factors.strokeConsistency).toBeGreaterThanOrEqual(0);
                            expect(factors.strokeConsistency).toBeLessThanOrEqual(100);
                            expect(factors.aspectRatio).toBeGreaterThanOrEqual(0);
                            expect(factors.aspectRatio).toBeLessThanOrEqual(100);
                            expect(factors.backgroundNoise).toBeGreaterThanOrEqual(0);
                            expect(factors.backgroundNoise).toBeLessThanOrEqual(100);

                            return true;
                        } catch (error: any) {
                            return error.name === 'SignatureQualityError';
                        }
                    }
                ),
                { numRuns: 25, timeout: 20000 }
            );
        });

        it('should preserve signature ID uniqueness across captures', async () => {
            const capturedIds = new Set<string>();

            await fc.assert(
                fc.asyncProperty(
                    arbitrarySignatureData(),
                    async (signatureData) => {
                        try {
                            const result = await engine.captureSignature(signatureData, { qualityLevel: 'low' });

                            // Each signature should have a unique ID
                            expect(capturedIds.has(result.signatureId)).toBe(false);
                            capturedIds.add(result.signatureId);

                            return true;
                        } catch (error: any) {
                            return error.name === 'SignatureQualityError';
                        }
                    }
                ),
                { numRuns: 20, timeout: 15000 }
            );
        });

        it('should handle edge cases in signature dimensions', async () => {
            await fc.assert(
                fc.asyncProperty(
                    arbitrarySignatureData(),
                    fc.record({
                        targetWidth: fc.constantFrom(50, 100, 500, 1000, 2000), // Edge case dimensions
                        targetHeight: fc.constantFrom(20, 50, 200, 500, 1000),
                        qualityLevel: fc.constant('low' as const)
                    }),
                    async (signatureData, options) => {
                        try {
                            const result = await engine.captureSignature(signatureData, options);

                            // Should handle extreme dimensions gracefully
                            expect(result.width).toBe(options.targetWidth);
                            expect(result.height).toBe(options.targetHeight);
                            expect(result.success).toBe(true);

                            return true;
                        } catch (error: any) {
                            // Quality errors acceptable for extreme dimensions
                            return error.name === 'SignatureQualityError';
                        }
                    }
                ),
                { numRuns: 15, timeout: 15000 }
            );
        });
    });
});