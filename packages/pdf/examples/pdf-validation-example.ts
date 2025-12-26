import { PDFValidationEngine } from '../src/pdf-validation-engine';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

/**
 * Example demonstrating comprehensive PDF validation including:
 * - PDF structure validation
 * - Digital signature validation
 * - Certificate chain validation
 * - Timestamp validation
 */
async function demonstratePDFValidation() {
    console.log('🔍 PDF Validation Engine Example\n');

    const validationEngine = new PDFValidationEngine();

    // Example 1: Create and validate a simple PDF
    console.log('📄 Example 1: Validating a simple PDF document');
    const simplePDF = await createSimplePDF();
    const simpleResult = await validationEngine.validatePDF(simplePDF);

    console.log('Simple PDF Validation Result:');
    console.log(`- Valid: ${simpleResult.isValid}`);
    console.log(`- Pages: ${simpleResult.pageCount}`);
    console.log(`- File Size: ${simpleResult.fileSize} bytes`);
    console.log(`- PDF Version: ${simpleResult.version}`);
    console.log(`- Has Form Fields: ${simpleResult.hasFormFields}`);
    console.log(`- Has Signatures: ${simpleResult.hasSignatures}`);
    console.log(`- Processing Time: ${simpleResult.processingTime}ms`);

    if (simpleResult.errors.length > 0) {
        console.log('- Errors:', simpleResult.errors);
    }
    if (simpleResult.warnings.length > 0) {
        console.log('- Warnings:', simpleResult.warnings);
    }
    console.log();

    // Example 2: Validate PDF structure details
    console.log('🏗️ Example 2: Detailed structure validation');
    console.log('Structure Validation:');
    console.log(`- PDF Version: ${simpleResult.structureValidation.pdfVersion}`);
    console.log(`- Cross-Reference Valid: ${simpleResult.structureValidation.crossReferenceValid}`);
    console.log(`- Trailer Valid: ${simpleResult.structureValidation.trailerValid}`);
    console.log(`- Objects Valid: ${simpleResult.structureValidation.objectsValid}`);

    if (simpleResult.structureValidation.errors.length > 0) {
        console.log('- Structure Errors:', simpleResult.structureValidation.errors);
    }
    if (simpleResult.structureValidation.warnings.length > 0) {
        console.log('- Structure Warnings:', simpleResult.structureValidation.warnings);
    }
    console.log();

    // Example 3: Create and validate a PDF with form fields
    console.log('📝 Example 3: Validating PDF with form fields');
    const formPDF = await createPDFWithFormFields();
    const formResult = await validationEngine.validatePDF(formPDF);

    console.log('Form PDF Validation Result:');
    console.log(`- Valid: ${formResult.isValid}`);
    console.log(`- Has Form Fields: ${formResult.hasFormFields}`);
    console.log(`- Pages: ${formResult.pageCount}`);
    console.log();

    // Example 4: Validate an invalid PDF
    console.log('❌ Example 4: Validating an invalid PDF');
    const invalidPDF = Buffer.from('This is not a PDF file content');
    const invalidResult = await validationEngine.validatePDF(invalidPDF);

    console.log('Invalid PDF Validation Result:');
    console.log(`- Valid: ${invalidResult.isValid}`);
    console.log(`- Errors: ${invalidResult.errors.length}`);
    console.log('- Error Details:', invalidResult.errors);
    console.log();

    // Example 5: Signature validation (when signatures are present)
    console.log('✍️ Example 5: Signature validation status');
    console.log('Signature Validation:');
    console.log(`- Has Signatures: ${simpleResult.signatureValidation.hasSignatures}`);
    console.log(`- All Signatures Valid: ${simpleResult.signatureValidation.allSignaturesValid}`);
    console.log(`- Signature Count: ${simpleResult.signatureValidation.signatures.length}`);

    if (simpleResult.signatureValidation.errors.length > 0) {
        console.log('- Signature Errors:', simpleResult.signatureValidation.errors);
    }
    console.log();

    // Example 6: Certificate validation (when certificates are present)
    console.log('🔐 Example 6: Certificate validation status');
    console.log('Certificate Validation:');
    console.log(`- All Certificates Valid: ${simpleResult.certificateValidation.allCertificatesValid}`);
    console.log(`- Certificate Count: ${simpleResult.certificateValidation.certificates.length}`);

    if (simpleResult.certificateValidation.errors.length > 0) {
        console.log('- Certificate Errors:', simpleResult.certificateValidation.errors);
    }
    console.log();

    // Example 7: Timestamp validation (when timestamps are present)
    console.log('⏰ Example 7: Timestamp validation status');
    console.log('Timestamp Validation:');
    console.log(`- Has Timestamps: ${simpleResult.timestampValidation.hasTimestamps}`);
    console.log(`- All Timestamps Valid: ${simpleResult.timestampValidation.allTimestampsValid}`);
    console.log(`- Timestamp Count: ${simpleResult.timestampValidation.timestamps.length}`);

    if (simpleResult.timestampValidation.errors.length > 0) {
        console.log('- Timestamp Errors:', simpleResult.timestampValidation.errors);
    }
    console.log();

    // Example 8: Performance measurement
    console.log('⚡ Example 8: Performance measurement');
    const performanceTests = [];

    for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await validationEngine.validatePDF(simplePDF);
        const endTime = Date.now();
        performanceTests.push(endTime - startTime);
    }

    const avgTime = performanceTests.reduce((a, b) => a + b, 0) / performanceTests.length;
    console.log(`- Average validation time: ${avgTime.toFixed(2)}ms`);
    console.log(`- Min time: ${Math.min(...performanceTests)}ms`);
    console.log(`- Max time: ${Math.max(...performanceTests)}ms`);
    console.log();

    console.log('✅ PDF Validation Engine demonstration completed!');
}

/**
 * Create a simple PDF document for testing
 */
async function createSimplePDF(): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText('PDF Validation Test Document', {
        x: 50,
        y: 350,
        size: 24,
        font,
        color: rgb(0, 0, 0),
    });

    page.drawText('This document is used to test the PDF validation engine.', {
        x: 50,
        y: 300,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2),
    });

    page.drawText('Features tested:', {
        x: 50,
        y: 250,
        size: 14,
        font,
        color: rgb(0, 0, 0),
    });

    const features = [
        '• PDF structure validation',
        '• Header and trailer validation',
        '• Cross-reference table validation',
        '• Object structure validation',
        '• Metadata extraction',
    ];

    features.forEach((feature, index) => {
        page.drawText(feature, {
            x: 70,
            y: 220 - (index * 20),
            size: 10,
            font,
            color: rgb(0.3, 0.3, 0.3),
        });
    });

    return Buffer.from(await pdfDoc.save());
}

/**
 * Create a PDF document with form fields for testing
 */
async function createPDFWithFormFields(): Promise<Buffer> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const form = pdfDoc.getForm();

    page.drawText('PDF Form Validation Test', {
        x: 50,
        y: 350,
        size: 20,
        font,
        color: rgb(0, 0, 0),
    });

    // Create text field
    const nameField = form.createTextField('name');
    nameField.setText('John Doe');
    nameField.addToPage(page, {
        x: 150,
        y: 300,
        width: 200,
        height: 20,
    });

    page.drawText('Name:', {
        x: 50,
        y: 305,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    // Create checkbox
    const agreeField = form.createCheckBox('agree');
    agreeField.check();
    agreeField.addToPage(page, {
        x: 50,
        y: 250,
        width: 15,
        height: 15,
    });

    page.drawText('I agree to the terms and conditions', {
        x: 75,
        y: 252,
        size: 10,
        font,
        color: rgb(0, 0, 0),
    });

    // Create dropdown
    const countryField = form.createDropdown('country');
    countryField.setOptions(['USA', 'Canada', 'UK', 'Germany', 'France']);
    countryField.select('USA');
    countryField.addToPage(page, {
        x: 150,
        y: 200,
        width: 100,
        height: 20,
    });

    page.drawText('Country:', {
        x: 50,
        y: 205,
        size: 12,
        font,
        color: rgb(0, 0, 0),
    });

    return Buffer.from(await pdfDoc.save());
}

/**
 * Save validation results to a file for analysis
 */
async function saveValidationResults(result: any, filename: string) {
    try {
        const outputDir = path.join(__dirname, 'validation-results');
        await fs.mkdir(outputDir, { recursive: true });

        const outputPath = path.join(outputDir, filename);
        await fs.writeFile(outputPath, JSON.stringify(result, null, 2));

        console.log(`📁 Validation results saved to: ${outputPath}`);
    } catch (error) {
        console.error('Failed to save validation results:', error);
    }
}

// Run the demonstration
if (require.main === module) {
    demonstratePDFValidation().catch(console.error);
}

export {
    demonstratePDFValidation,
    createSimplePDF,
    createPDFWithFormFields,
    saveValidationResults,
};