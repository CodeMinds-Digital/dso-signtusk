/**
 * Signature Capture System Example
 * 
 * This example demonstrates the comprehensive signature capture capabilities
 * including canvas-based drawing, typed signatures, and image uploads with
 * quality validation and enhancement.
 */

import { createSignatureCaptureEngine } from '../src/signature-capture-engine';
import type {
    DrawnSignatureData,
    TypedSignatureData,
    UploadedSignatureData,
    SignatureCaptureOptions
} from '../src/types';

async function demonstrateSignatureCapture() {
    console.log('🖊️  Signature Capture System Demo\n');

    const engine = createSignatureCaptureEngine();

    // Common options for all examples
    const commonOptions: SignatureCaptureOptions = {
        targetWidth: 400,
        targetHeight: 150,
        qualityLevel: 'high',
        outputFormat: 'png',
        padding: { top: 10, bottom: 10, left: 10, right: 10 },
        dpi: 150,
        compression: 85
    };

    // Example 1: Canvas-based drawn signature
    console.log('📝 Example 1: Canvas-based Drawn Signature');
    console.log('==========================================');

    const drawnSignature: DrawnSignatureData = {
        method: 'drawn',
        strokes: [
            {
                points: [
                    { x: 20, y: 80, pressure: 0.8 },
                    { x: 40, y: 60, pressure: 0.9 },
                    { x: 80, y: 70, pressure: 1.0 },
                    { x: 120, y: 50, pressure: 0.8 },
                    { x: 160, y: 80, pressure: 0.6 }
                ],
                strokeWidth: 3,
                color: '#000080',
                opacity: 1.0
            },
            {
                points: [
                    { x: 180, y: 60 },
                    { x: 200, y: 90 },
                    { x: 220, y: 70 }
                ],
                strokeWidth: 2,
                color: '#000080',
                opacity: 0.9
            }
        ],
        canvasWidth: 300,
        canvasHeight: 120,
        smoothing: true,
        antiAliasing: true
    };

    try {
        const drawnResult = await engine.captureSignature(drawnSignature, commonOptions);
        console.log(`✅ Drawn signature captured successfully!`);
        console.log(`   Signature ID: ${drawnResult.signatureId}`);
        console.log(`   Quality Score: ${drawnResult.qualityMetrics.score}/100`);
        console.log(`   Processing Time: ${drawnResult.processingTime}ms`);
        console.log(`   Image Size: ${drawnResult.width}x${drawnResult.height}`);
        console.log(`   Processing Steps: ${drawnResult.metadata.processingSteps.join(', ')}`);

        if (drawnResult.qualityMetrics.recommendations.length > 0) {
            console.log(`   Recommendations: ${drawnResult.qualityMetrics.recommendations.join('; ')}`);
        }
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n');

    // Example 2: Typed signature with custom styling
    console.log('✍️  Example 2: Typed Signature with Custom Styling');
    console.log('================================================');

    const typedSignature: TypedSignatureData = {
        method: 'typed',
        text: 'Dr. Alexandra Johnson',
        fontFamily: 'Times-Roman',
        fontSize: 28,
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: '#2c3e50',
        backgroundColor: '#ecf0f1',
        textAlign: 'center',
        letterSpacing: 1.2,
        lineHeight: 1.3
    };

    try {
        const typedResult = await engine.captureSignature(typedSignature, {
            ...commonOptions,
            backgroundColor: '#ffffff'
        });
        console.log(`✅ Typed signature captured successfully!`);
        console.log(`   Signature ID: ${typedResult.signatureId}`);
        console.log(`   Quality Score: ${typedResult.qualityMetrics.score}/100`);
        console.log(`   Processing Time: ${typedResult.processingTime}ms`);
        console.log(`   Font: ${typedSignature.fontFamily} ${typedSignature.fontSize}px`);
        console.log(`   Style: ${typedSignature.fontWeight} ${typedSignature.fontStyle}`);
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n');

    // Example 3: Uploaded signature with enhancement
    console.log('📤 Example 3: Uploaded Signature with Enhancement');
    console.log('===============================================');

    // Simple base64 encoded signature image (1x1 pixel for demo)
    const sampleImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77yQAAAABJRU5ErkJggg==';

    const uploadedSignature: UploadedSignatureData = {
        method: 'uploaded',
        imageData: `data:image/png;base64,${sampleImageBase64}`,
        originalFormat: 'png',
        originalWidth: 200,
        originalHeight: 80,
        preserveAspectRatio: true,
        removeBackground: true,
        enhanceContrast: true
    };

    try {
        const uploadedResult = await engine.captureSignature(uploadedSignature, {
            ...commonOptions,
            qualityLevel: 'medium' // Lower threshold for uploaded images
        });
        console.log(`✅ Uploaded signature processed successfully!`);
        console.log(`   Signature ID: ${uploadedResult.signatureId}`);
        console.log(`   Quality Score: ${uploadedResult.qualityMetrics.score}/100`);
        console.log(`   Processing Time: ${uploadedResult.processingTime}ms`);
        console.log(`   Original: ${uploadedSignature.originalWidth}x${uploadedSignature.originalHeight}`);
        console.log(`   Final: ${uploadedResult.width}x${uploadedResult.height}`);
        console.log(`   Enhancements: Background removal, Contrast enhancement`);
    } catch (error: any) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n');

    // Example 4: Quality validation demonstration
    console.log('🔍 Example 4: Quality Validation Demonstration');
    console.log('=============================================');

    const lowQualitySignature: DrawnSignatureData = {
        method: 'drawn',
        strokes: [
            {
                points: [
                    { x: 1, y: 1 },
                    { x: 2, y: 2 }
                ],
                strokeWidth: 0.5,
                color: '#cccccc', // Very light color
                opacity: 0.2 // Very low opacity
            }
        ],
        canvasWidth: 20,
        canvasHeight: 10,
        smoothing: false,
        antiAliasing: false
    };

    try {
        const lowQualityResult = await engine.captureSignature(lowQualitySignature, {
            ...commonOptions,
            qualityLevel: 'ultra', // High threshold
            targetWidth: 100,
            targetHeight: 50
        });
        console.log(`✅ Low quality signature accepted (unexpected)`);
    } catch (error: any) {
        if (error.name === 'SignatureQualityError') {
            console.log(`❌ Signature rejected due to low quality`);
            console.log(`   Quality Score: ${error.details.qualityScore}/100`);
            console.log(`   Required Threshold: 90/100 (ultra quality)`);
            console.log(`   This demonstrates the quality validation system working correctly`);
        } else {
            console.log(`❌ Unexpected error: ${error.message}`);
        }
    }

    console.log('\n');

    // Example 5: Different output formats
    console.log('🖼️  Example 5: Different Output Formats');
    console.log('=====================================');

    const formatTestSignature: TypedSignatureData = {
        method: 'typed',
        text: 'Format Test',
        fontFamily: 'Helvetica',
        fontSize: 24,
        fontWeight: 'normal',
        fontStyle: 'normal',
        color: '#000000',
        textAlign: 'center',
        letterSpacing: 0,
        lineHeight: 1.2
    };

    // PNG format
    try {
        const pngResult = await engine.captureSignature(formatTestSignature, {
            ...commonOptions,
            outputFormat: 'png'
        });
        console.log(`✅ PNG format: ${pngResult.imageData.length} characters (base64)`);
    } catch (error: any) {
        console.log(`❌ PNG Error: ${error.message}`);
    }

    // JPEG format
    try {
        const jpegResult = await engine.captureSignature(formatTestSignature, {
            ...commonOptions,
            outputFormat: 'jpeg',
            compression: 75
        });
        console.log(`✅ JPEG format: ${jpegResult.imageData.length} characters (base64)`);
    } catch (error: any) {
        console.log(`❌ JPEG Error: ${error.message}`);
    }

    console.log('\n');

    // Example 6: Performance testing
    console.log('⚡ Example 6: Performance Testing');
    console.log('===============================');

    const performanceSignature: DrawnSignatureData = {
        method: 'drawn',
        strokes: Array.from({ length: 5 }, (_, i) => ({
            points: Array.from({ length: 20 }, (_, j) => ({
                x: j * 10 + i * 5,
                y: 50 + Math.sin(j * 0.3) * 20,
                pressure: 0.5 + Math.random() * 0.5
            })),
            strokeWidth: 2 + Math.random() * 2,
            color: '#000000',
            opacity: 0.8 + Math.random() * 0.2
        })),
        canvasWidth: 300,
        canvasHeight: 100,
        smoothing: true,
        antiAliasing: true
    };

    const performanceStart = Date.now();
    try {
        const performanceResult = await engine.captureSignature(performanceSignature, {
            ...commonOptions,
            qualityLevel: 'ultra'
        });
        const totalTime = Date.now() - performanceStart;
        console.log(`✅ Complex signature processed successfully!`);
        console.log(`   Total Time: ${totalTime}ms`);
        console.log(`   Engine Processing Time: ${performanceResult.processingTime}ms`);
        console.log(`   Strokes: ${performanceSignature.strokes.length}`);
        console.log(`   Total Points: ${performanceSignature.strokes.reduce((sum, stroke) => sum + stroke.points.length, 0)}`);
        console.log(`   Quality Score: ${performanceResult.qualityMetrics.score}/100`);
    } catch (error: any) {
        console.log(`❌ Performance test error: ${error.message}`);
    }

    console.log('\n🎉 Signature Capture System Demo Complete!');
}

// Run the demonstration
if (require.main === module) {
    demonstrateSignatureCapture().catch(console.error);
}

export { demonstrateSignatureCapture };