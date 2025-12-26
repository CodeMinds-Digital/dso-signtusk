/**
 * PDF Security Engine Usage Examples
 * 
 * This file demonstrates how to use the PDF Security Engine for:
 * - Document encryption and password protection
 * - Watermarking and stamping
 * - Digital Rights Management (DRM)
 * - Comprehensive security policies
 */

import { PDFDocument } from 'pdf-lib';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
    createPDFSecurityEngine,
    type SecurityPolicy,
    type PDFEncryptionConfig,
    type WatermarkConfig,
    type StampConfig,
    type DRMConfig,
} from '../src/pdf-security-engine';

async function demonstratePDFSecurity() {
    console.log('🔒 PDF Security Engine Examples\n');

    // Create security engine
    const securityEngine = createPDFSecurityEngine({
        enableAuditLogging: true,
        maxAuditEntries: 1000,
        defaultSecurityLevel: 'high',
    });

    // Load a sample PDF (you would replace this with your actual PDF)
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage([612, 792]); // Standard letter size
    const page = pdfDoc.getPages()[0];
    page.drawText('Sample Document for Security Testing', {
        x: 50,
        y: 750,
        size: 16,
    });

    console.log('📄 Created sample PDF document');

    // Example 1: Basic Document Encryption
    console.log('\n1️⃣ Document Encryption Example');

    const encryptionConfig: PDFEncryptionConfig = {
        userPassword: 'user123',
        ownerPassword: 'owner456',
        permissions: {
            printing: 'low-resolution',
            modifying: false,
            copying: false,
            annotating: true,
            fillingForms: true,
            contentAccessibility: true,
            documentAssembly: false,
            highQualityPrinting: false,
        },
        encryptionLevel: '256-bit',
        algorithm: 'AES',
    };

    const encryptionResult = await securityEngine.encryptDocument(pdfDoc, encryptionConfig);
    console.log('✅ Encryption applied:', {
        success: encryptionResult.success,
        encryptionLevel: encryptionResult.encryptionLevel,
        passwordProtected: encryptionResult.passwordProtected,
        permissionsApplied: encryptionResult.permissionsApplied,
    });

    // Example 2: Advanced Watermarking
    console.log('\n2️⃣ Advanced Watermarking Example');

    const watermarkConfig: WatermarkConfig = {
        text: 'CONFIDENTIAL',
        opacity: 0.3,
        fontSize: 48,
        color: '#FF0000',
        rotation: 45,
        position: 'center',
        font: 'Helvetica',
        repeat: false,
    };

    const watermarkResult = await securityEngine.addWatermark(pdfDoc, watermarkConfig);
    console.log('✅ Watermark applied:', {
        success: watermarkResult.success,
        pagesProcessed: watermarkResult.pagesProcessed,
        watermarkCount: watermarkResult.watermarkCount,
    });

    // Example 3: Repeating Watermarks
    console.log('\n3️⃣ Repeating Watermarks Example');

    const repeatingWatermark: WatermarkConfig = {
        text: 'DRAFT',
        opacity: 0.1,
        fontSize: 24,
        color: '#CCCCCC',
        rotation: 0,
        position: 'center',
        repeat: true,
        spacing: { x: 200, y: 200 },
    };

    const repeatingResult = await securityEngine.addWatermark(pdfDoc, repeatingWatermark);
    console.log('✅ Repeating watermarks applied:', {
        success: repeatingResult.success,
        watermarkCount: repeatingResult.watermarkCount,
    });

    // Example 4: Security Stamps
    console.log('\n4️⃣ Security Stamps Example');

    const textStamp: StampConfig = {
        type: 'text',
        content: 'APPROVED',
        position: { x: 450, y: 700, page: 1 },
        size: { width: 100, height: 30 },
        style: {
            backgroundColor: '#00FF00',
            borderColor: '#008000',
            borderWidth: 2,
            fontSize: 14,
            fontColor: '#FFFFFF',
            opacity: 0.9,
            rotation: 0,
        },
        metadata: {
            approver: 'John Doe',
            approvalDate: new Date().toISOString(),
        },
    };

    const stampResult = await securityEngine.addStamp(pdfDoc, textStamp);
    console.log('✅ Security stamp applied:', {
        success: stampResult.success,
        stampsApplied: stampResult.stampsApplied,
        stampType: stampResult.stampPositions[0]?.type,
    });

    // Example 5: QR Code Stamp (placeholder)
    const qrStamp: StampConfig = {
        type: 'qr-code',
        content: 'https://verify.example.com/doc/12345',
        position: { x: 50, y: 50, page: 1 },
        size: { width: 60, height: 60 },
    };

    const qrResult = await securityEngine.addStamp(pdfDoc, qrStamp);
    console.log('✅ QR Code stamp applied:', {
        success: qrResult.success,
        position: qrResult.stampPositions[0],
    });

    // Example 6: Digital Rights Management (DRM)
    console.log('\n5️⃣ Digital Rights Management Example');

    const drmConfig: DRMConfig = {
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        maxViews: 50,
        maxPrints: 5,
        allowedDomains: ['example.com', 'trusted.org'],
        allowedIPs: ['192.168.1.0/24'],
        trackingEnabled: true,
        requireAuthentication: true,
        authenticationMethod: 'password',
        watermarkOnView: true,
        preventScreenshots: true,
        auditLogging: true,
    };

    const drmResult = await securityEngine.applyDRM(pdfDoc, drmConfig);
    console.log('✅ DRM applied:', {
        success: drmResult.success,
        drmId: drmResult.drmId,
        restrictions: drmResult.restrictions,
        expirationDate: drmResult.expirationDate,
    });

    // Example 7: Comprehensive Security Policy
    console.log('\n6️⃣ Comprehensive Security Policy Example');

    const comprehensivePolicy: SecurityPolicy = {
        encryption: {
            userPassword: 'secure123',
            ownerPassword: 'admin456',
            permissions: {
                printing: 'none',
                modifying: false,
                copying: false,
                annotating: false,
                fillingForms: true,
                contentAccessibility: true,
                documentAssembly: false,
                highQualityPrinting: false,
            },
            encryptionLevel: '256-bit',
            algorithm: 'AES',
        },
        watermark: {
            text: 'HIGHLY CONFIDENTIAL',
            opacity: 0.2,
            fontSize: 36,
            color: '#FF0000',
            rotation: 45,
            position: 'diagonal',
            repeat: true,
            spacing: { x: 300, y: 300 },
        },
        stamps: [
            {
                type: 'text',
                content: 'CLASSIFIED',
                position: { x: 50, y: 750, page: 1 },
                size: { width: 120, height: 25 },
                style: {
                    backgroundColor: '#FF0000',
                    borderColor: '#800000',
                    borderWidth: 2,
                    fontSize: 12,
                    fontColor: '#FFFFFF',
                    opacity: 1,
                },
            },
            {
                type: 'qr-code',
                content: 'https://verify.secure.com/doc/classified-001',
                position: { x: 500, y: 50, page: 1 },
                size: { width: 50, height: 50 },
            },
        ],
        drm: {
            expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            maxViews: 10,
            maxPrints: 2,
            allowedDomains: ['secure.example.com'],
            trackingEnabled: true,
            requireAuthentication: true,
            watermarkOnView: true,
            preventScreenshots: true,
            auditLogging: true,
        },
        accessControl: {
            requirePassword: true,
            allowedUsers: ['admin', 'manager'],
            allowedRoles: ['executive', 'security'],
            sessionTimeout: 30, // 30 minutes
        },
    };

    // Create a new document for comprehensive policy
    const secureDoc = await PDFDocument.create();
    secureDoc.addPage([612, 792]);
    const securePage = secureDoc.getPages()[0];
    securePage.drawText('Highly Secure Document', {
        x: 50,
        y: 750,
        size: 20,
    });

    const { document: finalDoc, results } = await securityEngine.applySecurityPolicy(
        secureDoc,
        comprehensivePolicy,
        {
            userId: 'admin-user',
            documentId: 'secure-doc-001',
        }
    );

    console.log('✅ Comprehensive security policy applied:', {
        totalOperations: results.length,
        operations: results.map(r => ({
            type: r.operationType,
            success: r.success,
            processingTime: r.processingTime,
        })),
    });

    // Example 8: Security Validation
    console.log('\n7️⃣ Security Validation Example');

    const validation = await securityEngine.validateSecurity(finalDoc);
    console.log('🔍 Security validation results:', {
        isSecure: validation.isSecure,
        securityScore: validation.securityScore,
        encryptionStatus: validation.encryptionStatus,
        drmActive: validation.drm?.isActive,
        recommendations: validation.recommendations,
    });

    // Example 9: Audit Log Review
    console.log('\n8️⃣ Security Audit Log Example');

    const auditLog = securityEngine.getAuditLog();
    console.log('📋 Audit log entries:', auditLog.length);

    if (auditLog.length > 0) {
        const recentEntries = auditLog.slice(-3); // Last 3 entries
        console.log('Recent audit entries:');
        recentEntries.forEach((entry, index) => {
            console.log(`  ${index + 1}. ${entry.operation} - ${entry.success ? '✅' : '❌'} - ${entry.timestamp.toISOString()}`);
        });
    }

    // Example 10: Custom Watermark Positions
    console.log('\n9️⃣ Custom Watermark Positions Example');

    const customWatermark: WatermarkConfig = {
        text: 'SAMPLE',
        opacity: 0.4,
        fontSize: 20,
        color: '#0000FF',
        rotation: 0,
        position: 'custom',
        customPosition: { x: 300, y: 400 },
    };

    const customResult = await securityEngine.addWatermark(pdfDoc, customWatermark);
    console.log('✅ Custom positioned watermark:', {
        success: customResult.success,
        position: customResult.watermarkPositions[0],
    });

    // Example 11: Multiple Stamp Types
    console.log('\n🔟 Multiple Stamp Types Example');

    const multipleStamps: StampConfig[] = [
        {
            type: 'text',
            content: 'REVIEWED',
            position: { x: 100, y: 600, page: 1 },
            size: { width: 80, height: 25 },
            style: { backgroundColor: '#0000FF', fontColor: '#FFFFFF' },
        },
        {
            type: 'barcode',
            content: '123456789012',
            position: { x: 200, y: 600, page: 1 },
            size: { width: 100, height: 30 },
        },
        {
            type: 'image',
            content: 'company-logo-base64',
            position: { x: 320, y: 600, page: 1 },
            size: { width: 60, height: 40 },
        },
    ];

    for (const stamp of multipleStamps) {
        const result = await securityEngine.addStamp(pdfDoc, stamp);
        console.log(`✅ ${stamp.type} stamp applied:`, result.success);
    }

    console.log('\n🎉 All PDF security examples completed successfully!');
    console.log('\n📊 Final Security Summary:');
    console.log('- Document encryption: Applied with 256-bit AES');
    console.log('- Watermarks: Multiple types and positions');
    console.log('- Security stamps: Text, QR codes, barcodes, images');
    console.log('- DRM protection: Expiration, view limits, domain restrictions');
    console.log('- Audit logging: All operations tracked');
    console.log('- Security validation: Comprehensive analysis');

    // Clean up audit log
    securityEngine.clearAuditLog();
    console.log('\n🧹 Audit log cleared');
}

// Error handling example
async function demonstrateErrorHandling() {
    console.log('\n⚠️  Error Handling Examples\n');

    const securityEngine = createPDFSecurityEngine();
    const pdfDoc = await PDFDocument.create();
    pdfDoc.addPage();

    try {
        // Invalid encryption config
        const invalidEncryption = {
            ownerPassword: '', // Invalid empty password
        } as PDFEncryptionConfig;

        await securityEngine.encryptDocument(pdfDoc, invalidEncryption);
    } catch (error) {
        console.log('❌ Caught encryption error:', error.message);
    }

    try {
        // Invalid watermark config
        const invalidWatermark = {
            text: '', // Invalid empty text
            opacity: 2, // Invalid opacity > 1
        } as WatermarkConfig;

        await securityEngine.addWatermark(pdfDoc, invalidWatermark);
    } catch (error) {
        console.log('❌ Caught watermark error:', error.message);
    }

    try {
        // Invalid stamp page
        const invalidStamp: StampConfig = {
            type: 'text',
            content: 'TEST',
            position: { x: 100, y: 100, page: 999 }, // Non-existent page
            size: { width: 100, height: 30 },
        };

        await securityEngine.addStamp(pdfDoc, invalidStamp);
    } catch (error) {
        console.log('❌ Caught stamp error:', error.message);
    }

    console.log('✅ Error handling demonstration completed');
}

// Run examples
async function runExamples() {
    try {
        await demonstratePDFSecurity();
        await demonstrateErrorHandling();
    } catch (error) {
        console.error('❌ Example execution failed:', error);
    }
}

// Export for use in other files
export {
    demonstratePDFSecurity,
    demonstrateErrorHandling,
    runExamples,
};

// Run if this file is executed directly
if (require.main === module) {
    runExamples();
}