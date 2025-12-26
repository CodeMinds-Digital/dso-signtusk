import { PDFDocument } from 'pdf-lib';
import {
    PDFEngine,
    SignatureAppearanceConfig,
    SignatureAppearanceMetadata,
    createPDFEngine,
    createSignatureAppearanceEngine
} from '../src';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example demonstrating signature appearance system capabilities
 */
async function demonstrateSignatureAppearance() {
    console.log('🖋️  Signature Appearance System Demo');
    console.log('=====================================\n');

    try {
        // Create PDF engine and signature appearance engine
        const pdfEngine = createPDFEngine();
        const signatureEngine = createSignatureAppearanceEngine();

        // Create a new PDF document for demonstration
        const document = await PDFDocument.create();
        const page = document.addPage([612, 792]); // Letter size

        console.log('1. Creating sample signature appearances...\n');

        // Example 1: Text-based signature with branding
        const textSignatureConfig: SignatureAppearanceConfig = {
            text: 'John Smith',
            font: 'Helvetica',
            fontSize: 16,
            x: 100,
            y: 600,
            width: 200,
            height: 60,
            page: 0,
            backgroundColor: '#f8f9fa',
            borderColor: '#007bff',
            borderWidth: 2,
            textColor: '#212529',
            showTimestamp: true,
            showSignerName: true,
            showReason: true,
        };

        const textSignatureMetadata: SignatureAppearanceMetadata = {
            signerName: 'John Smith',
            signingTime: new Date(),
            reason: 'Document approval',
            location: 'New York, NY',
            contactInfo: 'john.smith@example.com',
        };

        const textResult = await signatureEngine.generateSignatureAppearance(
            document,
            textSignatureConfig,
            textSignatureMetadata
        );

        console.log(`✅ Text signature created: ${textResult.signatureId}`);
        console.log(`   Processing time: ${textResult.processingTime}ms`);
        console.log(`   Bounding box: ${JSON.stringify(textResult.boundingBox)}\n`);

        // Example 2: Image-based signature with logo
        const imageSignatureConfig: SignatureAppearanceConfig = {
            // Note: In real usage, this would be actual base64 image data
            imageData: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            imageFormat: 'png',
            x: 100,
            y: 500,
            width: 180,
            height: 80,
            page: 0,
            borderColor: '#28a745',
            borderWidth: 1,
            logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            logoPosition: 'top-right',
            logoSize: 24,
            showTimestamp: true,
            showSignerName: false,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            imageQuality: 0.9,
        };

        const imageSignatureMetadata: SignatureAppearanceMetadata = {
            signerName: 'Jane Doe',
            signingTime: new Date(),
            reason: 'Contract execution',
            location: 'San Francisco, CA',
        };

        const imageResult = await signatureEngine.generateSignatureAppearance(
            document,
            imageSignatureConfig,
            imageSignatureMetadata
        );

        console.log(`✅ Image signature created: ${imageResult.signatureId}`);
        console.log(`   Processing time: ${imageResult.processingTime}ms\n`);

        // Example 3: Multi-page signature coordination
        const multiPageConfig: SignatureAppearanceConfig = {
            text: 'Corporate Seal',
            font: 'Times-Roman',
            fontSize: 14,
            x: 400,
            y: 700,
            width: 150,
            height: 50,
            page: 0,
            backgroundColor: '#fff3cd',
            borderColor: '#856404',
            borderWidth: 2,
            textColor: '#856404',
            multiPageCoordination: true,
            pageReferences: [
                { page: 0, x: 450, y: 50, width: 100, height: 30 },
            ],
            showTimestamp: false,
            showSignerName: true,
        };

        const multiPageMetadata: SignatureAppearanceMetadata = {
            signerName: 'Acme Corporation',
            signingTime: new Date(),
            reason: 'Official company seal',
        };

        const multiPageResult = await signatureEngine.generateSignatureAppearance(
            document,
            multiPageConfig,
            multiPageMetadata
        );

        console.log(`✅ Multi-page signature created: ${multiPageResult.signatureId}`);
        console.log(`   Main signature: ${JSON.stringify(multiPageResult.boundingBox)}`);
        console.log(`   References: ${JSON.stringify(multiPageResult.multiPageReferences)}\n`);

        // Example 4: Using PDF Engine integration
        console.log('2. Demonstrating PDF Engine integration...\n');

        const engineSignatureConfig: SignatureAppearanceConfig = {
            text: 'Digital Signature',
            font: 'Courier',
            fontSize: 12,
            x: 100,
            y: 400,
            width: 160,
            height: 40,
            page: 0,
            backgroundColor: '#e9ecef',
            borderColor: '#6c757d',
            borderWidth: 1,
            textColor: '#495057',
            showTimestamp: true,
            showSignerName: true,
        };

        const engineMetadata: SignatureAppearanceMetadata = {
            signerName: 'System Administrator',
            signingTime: new Date(),
            reason: 'System validation',
            certificateInfo: {
                subject: 'CN=System Admin, O=Example Corp',
                issuer: 'CN=Example CA, O=Example Corp',
                serialNumber: '123456789',
                validFrom: new Date('2024-01-01'),
                validTo: new Date('2025-12-31'),
            },
        };

        const engineResult = await pdfEngine.createSignatureWithAppearance(
            document,
            'systemSignature',
            engineSignatureConfig,
            engineMetadata
        );

        console.log(`✅ PDF Engine signature created: ${engineResult.appearance.signatureId}`);
        console.log(`   Field name: ${engineResult.field.getName()}\n`);

        // Example 5: Positioning and sizing controls
        console.log('3. Demonstrating positioning and sizing controls...\n');

        const precisionConfig: SignatureAppearanceConfig = {
            text: 'Precise Positioning',
            font: 'Helvetica',
            fontSize: 10,
            x: 300,
            y: 300,
            width: 120,
            height: 35,
            page: 0,
            backgroundColor: '#d1ecf1',
            borderColor: '#0c5460',
            borderWidth: 1,
            textColor: '#0c5460',
            rotation: 15, // Rotated signature
            scaleX: 1.2,
            scaleY: 0.8,
            showTimestamp: false,
            showSignerName: false,
        };

        const precisionMetadata: SignatureAppearanceMetadata = {
            signerName: 'Precision Test',
            signingTime: new Date(),
        };

        const precisionResult = await signatureEngine.generateSignatureAppearance(
            document,
            precisionConfig,
            precisionMetadata
        );

        console.log(`✅ Precision signature created: ${precisionResult.signatureId}`);
        console.log(`   Rotation: 15°, Scale: 1.2x0.8\n`);

        // Save the demonstration PDF
        const pdfBytes = await document.save();
        const outputPath = path.join(__dirname, 'signature-appearance-demo.pdf');
        fs.writeFileSync(outputPath, pdfBytes);

        console.log(`📄 Demo PDF saved to: ${outputPath}`);
        console.log('\n🎉 Signature Appearance System demonstration completed successfully!');

        // Clear cache
        signatureEngine.clearCache();
        pdfEngine.clearSignatureCache();

        return {
            success: true,
            outputPath,
            signatures: [
                textResult,
                imageResult,
                multiPageResult,
                engineResult.appearance,
                precisionResult,
            ],
        };

    } catch (error) {
        console.error('❌ Error during signature appearance demonstration:', error);
        throw error;
    }
}

/**
 * Example of advanced signature customization
 */
async function demonstrateAdvancedCustomization() {
    console.log('\n🎨 Advanced Signature Customization Demo');
    console.log('==========================================\n');

    try {
        const pdfEngine = createPDFEngine();
        const document = await PDFDocument.create();
        const page = document.addPage([612, 792]);

        // Corporate signature with full branding
        const corporateConfig: SignatureAppearanceConfig = {
            text: 'APPROVED',
            font: 'Helvetica',
            fontSize: 18,
            x: 200,
            y: 600,
            width: 200,
            height: 100,
            page: 0,
            backgroundColor: '#ffffff',
            borderColor: '#dc3545',
            borderWidth: 3,
            textColor: '#dc3545',
            logo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
            logoPosition: 'top-left',
            logoSize: 32,
            showTimestamp: true,
            showSignerName: true,
            showReason: true,
            showLocation: true,
        };

        const corporateMetadata: SignatureAppearanceMetadata = {
            signerName: 'Chief Executive Officer',
            signingTime: new Date(),
            reason: 'Executive approval',
            location: 'Corporate Headquarters',
            contactInfo: 'ceo@company.com',
            certificateInfo: {
                subject: 'CN=CEO, O=Example Corporation, C=US',
                issuer: 'CN=Corporate CA, O=Example Corporation',
                serialNumber: 'CORP-2024-001',
                validFrom: new Date('2024-01-01'),
                validTo: new Date('2026-12-31'),
            },
        };

        const result = await pdfEngine.applySignatureAppearance(
            document,
            corporateConfig,
            corporateMetadata
        );

        console.log(`✅ Corporate signature applied: ${result.signatureId}`);
        console.log(`   Certificate: ${corporateMetadata.certificateInfo?.subject}`);

        // Save advanced demo
        const pdfBytes = await document.save();
        const outputPath = path.join(__dirname, 'advanced-signature-demo.pdf');
        fs.writeFileSync(outputPath, pdfBytes);

        console.log(`📄 Advanced demo PDF saved to: ${outputPath}`);
        console.log('\n🎉 Advanced customization demonstration completed!');

        return { success: true, outputPath, result };

    } catch (error) {
        console.error('❌ Error during advanced customization:', error);
        throw error;
    }
}

// Run demonstrations if this file is executed directly
if (require.main === module) {
    (async () => {
        try {
            await demonstrateSignatureAppearance();
            await demonstrateAdvancedCustomization();
        } catch (error) {
            console.error('Demo failed:', error);
            process.exit(1);
        }
    })();
}

export {
    demonstrateSignatureAppearance,
    demonstrateAdvancedCustomization,
};