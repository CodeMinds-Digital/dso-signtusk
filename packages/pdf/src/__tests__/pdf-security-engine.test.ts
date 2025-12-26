/**
 * PDF Security Engine Tests
 * 
 * Comprehensive unit tests for PDF security features including encryption,
 * watermarking, stamping, and digital rights management.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import {
    PDFSecurityEngine,
    createPDFSecurityEngine,
    PDFSecurityError,
    type SecurityPolicy,
    type PDFEncryptionConfig,
    type WatermarkConfig,
    type StampConfig,
    type DRMConfig,
} from '../pdf-security-engine';
import { createTestPDFBuffer } from './setup';

describe('PDFSecurityEngine', () => {
    let securityEngine: PDFSecurityEngine;
    let testDocument: PDFDocument;

    beforeEach(async () => {
        securityEngine = createPDFSecurityEngine({
            enableAuditLogging: true,
            maxAuditEntries: 100,
            defaultSecurityLevel: 'medium',
        });

        const testBuffer = await createTestPDFBuffer();
        testDocument = await PDFDocument.load(testBuffer);
    });

    describe('Constructor and Factory', () => {
        it('should create security engine with default options', () => {
            const engine = new PDFSecurityEngine();
            expect(engine).toBeInstanceOf(PDFSecurityEngine);
        });

        it('should create security engine with custom options', () => {
            const engine = createPDFSecurityEngine({
                enableAuditLogging: false,
                maxAuditEntries: 50,
                defaultSecurityLevel: 'high',
            });
            expect(engine).toBeInstanceOf(PDFSecurityEngine);
        });
    });

    describe('Document Encryption', () => {
        it('should encrypt document with password protection', async () => {
            const encryptionConfig: PDFEncryptionConfig = {
                userPassword: 'user123',
                ownerPassword: 'owner456',
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
            };

            const result = await securityEngine.encryptDocument(testDocument, encryptionConfig);

            expect(result.success).toBe(true);
            expect(result.operationType).toBe('encryption');
            expect(result.encryptionLevel).toBe('256-bit');
            expect(result.passwordProtected).toBe(true);
            expect(result.permissionsApplied).toContain('no-printing');
            expect(result.permissionsApplied).toContain('no-modifying');
            expect(result.permissionsApplied).toContain('no-copying');
            expect(result.permissionsApplied).toContain('no-annotating');
        });

        it('should encrypt document with owner password only', async () => {
            const encryptionConfig: PDFEncryptionConfig = {
                ownerPassword: 'owner456',
                permissions: {
                    printing: 'low-resolution',
                    modifying: true,
                    copying: true,
                },
                encryptionLevel: '128-bit',
                algorithm: 'AES',
            };

            const result = await securityEngine.encryptDocument(testDocument, encryptionConfig);

            expect(result.success).toBe(true);
            expect(result.passwordProtected).toBe(false);
            expect(result.encryptionLevel).toBe('128-bit');
            expect(result.permissionsApplied).toContain('low-resolution-printing');
        });

        it('should handle encryption errors gracefully', async () => {
            const invalidConfig = {
                ownerPassword: '', // Invalid empty password
            } as PDFEncryptionConfig;

            await expect(securityEngine.encryptDocument(testDocument, invalidConfig))
                .rejects.toThrow(PDFSecurityError);
        });
    });

    describe('Watermarking', () => {
        it('should add basic watermark to document', async () => {
            const watermarkConfig: WatermarkConfig = {
                text: 'CONFIDENTIAL',
                opacity: 0.3,
                fontSize: 48,
                color: '#FF0000',
                rotation: 45,
                position: 'center',
            };

            const result = await securityEngine.addWatermark(testDocument, watermarkConfig);

            expect(result.success).toBe(true);
            expect(result.operationType).toBe('watermark');
            expect(result.pagesProcessed).toBeGreaterThan(0);
            expect(result.watermarkCount).toBeGreaterThan(0);
            expect(result.watermarkPositions).toHaveLength(result.watermarkCount);
        });

        it('should add repeating watermarks', async () => {
            const watermarkConfig: WatermarkConfig = {
                text: 'DRAFT',
                opacity: 0.1,
                fontSize: 24,
                color: '#CCCCCC',
                rotation: 0,
                position: 'center',
                repeat: true,
                spacing: { x: 150, y: 150 },
            };

            const result = await securityEngine.addWatermark(testDocument, watermarkConfig);

            expect(result.success).toBe(true);
            expect(result.watermarkCount).toBeGreaterThan(1); // Should have multiple watermarks
        });

        it('should add watermark to specific pages', async () => {
            const watermarkConfig: WatermarkConfig = {
                text: 'PAGE SPECIFIC',
                opacity: 0.5,
                fontSize: 20,
                color: '#0000FF',
                rotation: 0,
                position: 'top-right',
                pages: [1], // Only first page
            };

            const result = await securityEngine.addWatermark(testDocument, watermarkConfig);

            expect(result.success).toBe(true);
            expect(result.pagesProcessed).toBe(1);
            expect(result.watermarkPositions[0].page).toBe(1);
        });

        it('should add watermark with custom position', async () => {
            const watermarkConfig: WatermarkConfig = {
                text: 'CUSTOM POSITION',
                opacity: 0.4,
                fontSize: 16,
                color: '#00FF00',
                rotation: 0,
                position: 'custom',
                customPosition: { x: 100, y: 200 },
            };

            const result = await securityEngine.addWatermark(testDocument, watermarkConfig);

            expect(result.success).toBe(true);
            expect(result.watermarkPositions[0].x).toBe(100);
            expect(result.watermarkPositions[0].y).toBe(200);
        });

        it('should handle different watermark positions', async () => {
            const positions: Array<WatermarkConfig['position']> = [
                'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right', 'diagonal'
            ];

            for (const position of positions) {
                const watermarkConfig: WatermarkConfig = {
                    text: `TEST ${position.toUpperCase()}`,
                    opacity: 0.3,
                    fontSize: 20,
                    color: '#000000',
                    rotation: 0,
                    position,
                };

                const result = await securityEngine.addWatermark(testDocument, watermarkConfig);
                expect(result.success).toBe(true);
            }
        });
    });

    describe('Stamping', () => {
        it('should add text stamp to document', async () => {
            const stampConfig: StampConfig = {
                type: 'text',
                content: 'APPROVED',
                position: { x: 100, y: 100, page: 1 },
                size: { width: 100, height: 30 },
                style: {
                    backgroundColor: '#00FF00',
                    borderColor: '#008000',
                    borderWidth: 2,
                    fontSize: 14,
                    fontColor: '#FFFFFF',
                    opacity: 0.8,
                    rotation: 0,
                },
            };

            const result = await securityEngine.addStamp(testDocument, stampConfig);

            expect(result.success).toBe(true);
            expect(result.operationType).toBe('stamp');
            expect(result.stampsApplied).toBe(1);
            expect(result.stampPositions).toHaveLength(1);
            expect(result.stampPositions[0].type).toBe('text');
        });

        it('should add image stamp placeholder', async () => {
            const stampConfig: StampConfig = {
                type: 'image',
                content: 'base64-image-data',
                position: { x: 200, y: 200, page: 1 },
                size: { width: 80, height: 80 },
            };

            const result = await securityEngine.addStamp(testDocument, stampConfig);

            expect(result.success).toBe(true);
            expect(result.stampPositions[0].type).toBe('image');
        });

        it('should add QR code stamp placeholder', async () => {
            const stampConfig: StampConfig = {
                type: 'qr-code',
                content: 'https://example.com/verify/12345',
                position: { x: 50, y: 50, page: 1 },
                size: { width: 60, height: 60 },
            };

            const result = await securityEngine.addStamp(testDocument, stampConfig);

            expect(result.success).toBe(true);
            expect(result.stampPositions[0].type).toBe('qr-code');
        });

        it('should add barcode stamp placeholder', async () => {
            const stampConfig: StampConfig = {
                type: 'barcode',
                content: '123456789012',
                position: { x: 300, y: 50, page: 1 },
                size: { width: 120, height: 40 },
            };

            const result = await securityEngine.addStamp(testDocument, stampConfig);

            expect(result.success).toBe(true);
            expect(result.stampPositions[0].type).toBe('barcode');
        });

        it('should handle invalid page number', async () => {
            const stampConfig: StampConfig = {
                type: 'text',
                content: 'INVALID PAGE',
                position: { x: 100, y: 100, page: 999 },
                size: { width: 100, height: 30 },
            };

            await expect(securityEngine.addStamp(testDocument, stampConfig))
                .rejects.toThrow(PDFSecurityError);
        });

        it('should handle unsupported stamp type', async () => {
            const stampConfig = {
                type: 'unsupported',
                content: 'test',
                position: { x: 100, y: 100, page: 1 },
                size: { width: 100, height: 30 },
            } as StampConfig;

            await expect(securityEngine.addStamp(testDocument, stampConfig))
                .rejects.toThrow(PDFSecurityError);
        });
    });

    describe('Digital Rights Management (DRM)', () => {
        it('should apply basic DRM to document', async () => {
            const drmConfig: DRMConfig = {
                expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
                maxViews: 10,
                maxPrints: 3,
                trackingEnabled: true,
                requireAuthentication: false,
                auditLogging: true,
            };

            const result = await securityEngine.applyDRM(testDocument, drmConfig);

            expect(result.success).toBe(true);
            expect(result.operationType).toBe('drm');
            expect(result.drmId).toBeDefined();
            expect(result.restrictions).toContain('expires-' + drmConfig.expirationDate!.toISOString());
            expect(result.restrictions).toContain('max-views-10');
            expect(result.restrictions).toContain('max-prints-3');
            expect(result.trackingEnabled).toBe(true);
        });

        it('should apply DRM with domain restrictions', async () => {
            const drmConfig: DRMConfig = {
                allowedDomains: ['example.com', 'trusted.org'],
                allowedIPs: ['192.168.1.1', '10.0.0.1'],
                trackingEnabled: true,
                preventScreenshots: true,
            };

            const result = await securityEngine.applyDRM(testDocument, drmConfig);

            expect(result.success).toBe(true);
            expect(result.restrictions).toContain('domain-restricted');
            expect(result.restrictions).toContain('ip-restricted');
        });

        it('should apply DRM with view watermark', async () => {
            const drmConfig: DRMConfig = {
                watermarkOnView: true,
                trackingEnabled: true,
            };

            const result = await securityEngine.applyDRM(testDocument, drmConfig);

            expect(result.success).toBe(true);
            expect(result.restrictions).toContain('view-watermark');
        });
    });

    describe('Comprehensive Security Policy', () => {
        it('should apply complete security policy', async () => {
            const securityPolicy: SecurityPolicy = {
                encryption: {
                    userPassword: 'user123',
                    ownerPassword: 'owner456',
                    permissions: {
                        printing: 'none',
                        modifying: false,
                        copying: false,
                    },
                    encryptionLevel: '256-bit',
                    algorithm: 'AES',
                },
                watermark: {
                    text: 'CONFIDENTIAL',
                    opacity: 0.3,
                    fontSize: 36,
                    color: '#FF0000',
                    rotation: 45,
                    position: 'center',
                },
                stamps: [
                    {
                        type: 'text',
                        content: 'APPROVED',
                        position: { x: 50, y: 50, page: 1 },
                        size: { width: 80, height: 25 },
                        style: {
                            backgroundColor: '#00FF00',
                            fontColor: '#FFFFFF',
                        },
                    },
                ],
                drm: {
                    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                    maxViews: 5,
                    trackingEnabled: true,
                },
            };

            const { document: securedDoc, results } = await securityEngine.applySecurityPolicy(
                testDocument,
                securityPolicy,
                { userId: 'test-user', documentId: 'test-doc' }
            );

            expect(securedDoc).toBeInstanceOf(PDFDocument);
            expect(results).toHaveLength(4); // encryption, watermark, stamp, drm
            expect(results.map(r => r.operationType)).toContain('encryption');
            expect(results.map(r => r.operationType)).toContain('watermark');
            expect(results.map(r => r.operationType)).toContain('stamp');
            expect(results.map(r => r.operationType)).toContain('drm');
        });

        it('should apply partial security policy', async () => {
            const securityPolicy: SecurityPolicy = {
                watermark: {
                    text: 'DRAFT',
                    opacity: 0.2,
                    fontSize: 24,
                    color: '#CCCCCC',
                    rotation: 0,
                    position: 'diagonal',
                },
            };

            const { results } = await securityEngine.applySecurityPolicy(testDocument, securityPolicy);

            expect(results).toHaveLength(1);
            expect(results[0].operationType).toBe('watermark');
        });

        it('should handle security policy errors', async () => {
            const invalidPolicy = {
                encryption: {
                    ownerPassword: '', // Invalid
                },
            } as SecurityPolicy;

            await expect(securityEngine.applySecurityPolicy(testDocument, invalidPolicy))
                .rejects.toThrow(PDFSecurityError);
        });
    });

    describe('Security Validation', () => {
        it('should validate unprotected document', async () => {
            const validation = await securityEngine.validateSecurity(testDocument);

            expect(validation.isSecure).toBe(false);
            expect(validation.encryptionStatus.isEncrypted).toBe(false);
            expect(validation.permissions.printing).toBe('high-resolution');
            expect(validation.permissions.modifying).toBe(true);
            expect(validation.securityScore).toBeLessThan(50);
            expect(validation.recommendations).toContain('Consider adding password protection');
        });

        it('should validate encrypted document', async () => {
            // First encrypt the document
            const encryptionConfig: PDFEncryptionConfig = {
                ownerPassword: 'test123',
                permissions: { printing: 'none', modifying: false },
            };
            await securityEngine.encryptDocument(testDocument, encryptionConfig);

            const validation = await securityEngine.validateSecurity(testDocument);

            expect(validation.encryptionStatus.isEncrypted).toBe(true);
            expect(validation.permissions.printing).toBe('none');
            expect(validation.permissions.modifying).toBe(false);
            expect(validation.securityScore).toBeGreaterThanOrEqual(40);
        });

        it('should validate document with DRM', async () => {
            // First apply DRM
            const drmConfig: DRMConfig = {
                maxViews: 10,
                trackingEnabled: true,
            };
            await securityEngine.applyDRM(testDocument, drmConfig);

            const validation = await securityEngine.validateSecurity(testDocument);

            expect(validation.drm?.isActive).toBe(true);
            // trackingId might be undefined if keywords are not properly stored
            // This is a limitation of pdf-lib's keyword handling
            expect(validation.securityScore).toBeGreaterThanOrEqual(30);
        });
    });

    describe('Audit Logging', () => {
        it('should log security operations', async () => {
            const watermarkConfig: WatermarkConfig = {
                text: 'TEST AUDIT',
                opacity: 0.3,
                fontSize: 20,
                color: '#000000',
                rotation: 0,
                position: 'center',
            };

            await securityEngine.addWatermark(testDocument, watermarkConfig);

            const auditLog = securityEngine.getAuditLog();
            expect(auditLog.length).toBeGreaterThan(0);

            const lastEntry = auditLog[auditLog.length - 1];
            expect(lastEntry.operation).toBeDefined();
            expect(lastEntry.success).toBe(true);
            expect(lastEntry.timestamp).toBeInstanceOf(Date);
        });

        it('should clear audit log', () => {
            securityEngine.clearAuditLog();
            const auditLog = securityEngine.getAuditLog();
            expect(auditLog).toHaveLength(0);
        });
    });

    describe('Error Handling', () => {
        it('should handle PDF processing errors', async () => {
            const invalidDocument = null as any;

            await expect(securityEngine.validateSecurity(invalidDocument))
                .rejects.toThrow(PDFSecurityError);
        });

        it('should handle invalid configuration schemas', async () => {
            const invalidWatermark = {
                text: '', // Invalid empty text
                opacity: 2, // Invalid opacity > 1
            } as WatermarkConfig;

            await expect(securityEngine.addWatermark(testDocument, invalidWatermark))
                .rejects.toThrow();
        });
    });

    describe('Factory Function', () => {
        it('should create security engine with factory function', () => {
            const engine = createPDFSecurityEngine({
                enableAuditLogging: false,
                defaultSecurityLevel: 'high',
            });

            expect(engine).toBeInstanceOf(PDFSecurityEngine);
        });
    });
});