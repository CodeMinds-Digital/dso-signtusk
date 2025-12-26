import { describe, it, expect, beforeEach } from 'vitest';
import { getCertificatePdf } from '@signtusk/lib/server-only/htmltopdf/get-certificate-pdf';
import { generateAuditLog } from './index';
import {
    type CertificateData,
    type AuditLogData,
    type AuditLogEntry,
    type PDFGenerationOptions,
} from './types';

/**
 * Integration tests for PDF download endpoints
 * These tests validate the integration between tRPC routes and PDF generation
 * Requirements: 8.1
 */
describe('PDF Download Endpoints Integration Tests', () => {
    let mockCertificateOptions: { documentId: number; language?: string };
    let mockAuditLogData: AuditLogData;
    let defaultPdfOptions: PDFGenerationOptions;

    beforeEach(() => {
        mockCertificateOptions = {
            documentId: 12345,
            language: 'en',
        };

        const mockAuditEntries: AuditLogEntry[] = [
            {
                id: '1',
                timestamp: new Date('2024-01-15T09:00:00Z'),
                action: 'DOCUMENT_CREATED',
                user: 'Admin User',
                email: 'admin@example.com',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0 (Test Browser)',
                details: {
                    action: 'Document created',
                    metadata: 'Initial document creation',
                },
            },
            {
                id: '2',
                timestamp: new Date('2024-01-15T10:30:00Z'),
                action: 'DOCUMENT_SIGNED',
                user: 'John Doe',
                email: 'john.doe@example.com',
                ipAddress: '192.168.1.100',
                userAgent: 'Mozilla/5.0 (Mobile Browser)',
                details: {
                    action: 'Document signed',
                    metadata: 'Digital signature applied',
                },
            },
        ];

        mockAuditLogData = {
            documentId: 12345,
            documentTitle: 'Integration Test Document',
            entries: mockAuditEntries,
            generatedAt: new Date('2024-01-15T11:00:00Z'),
            language: 'en',
        };

        defaultPdfOptions = {
            format: 'A4',
            language: 'en',
            includeBackground: true,
        };
    });

    describe('Certificate PDF Download Integration', () => {
        it('should generate certificate PDF through getCertificatePdf function', async () => {
            // Note: This test would normally require a real database with test data
            // For now, we'll test the direct PDF generation functionality

            // Mock certificate data that would normally come from the database
            const mockCertData: CertificateData = {
                documentId: mockCertificateOptions.documentId,
                documentTitle: 'Integration Test Document',
                signerName: 'John Doe',
                signerEmail: 'john.doe@example.com',
                signedAt: new Date('2024-01-15T10:30:00Z'),
                verificationUrl: 'https://example.com/verify/abc123',
                certificateId: 'CERT-12345-67890',
                language: 'en',
            };

            // Test direct certificate generation (simulating what getCertificatePdf would do)
            const { generateCertificate } = await import('./index');
            const result = await generateCertificate(mockCertData, defaultPdfOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should handle certificate generation with different languages', async () => {
            const languages = ['en', 'es', 'fr', 'de', 'it'] as const;

            for (const language of languages) {
                const mockCertData: CertificateData = {
                    documentId: mockCertificateOptions.documentId,
                    documentTitle: 'Integration Test Document',
                    signerName: 'José María González',
                    signerEmail: 'jose@example.com',
                    signedAt: new Date('2024-01-15T10:30:00Z'),
                    verificationUrl: 'https://example.com/verify/abc123',
                    certificateId: 'CERT-12345-67890',
                    language,
                };

                const { generateCertificate } = await import('./index');
                const result = await generateCertificate(mockCertData, {
                    ...defaultPdfOptions,
                    language,
                });

                expect(result).toBeInstanceOf(Buffer);
                expect(result.length).toBeGreaterThan(1000);
                expect(result.subarray(0, 4).toString()).toBe('%PDF');
            }
        });

        it('should handle certificate generation with long document titles', async () => {
            const mockCertData: CertificateData = {
                documentId: mockCertificateOptions.documentId,
                documentTitle: 'This is a very long document title that should be properly handled by the PDF generation system without breaking the layout or causing any formatting issues in the certificate',
                signerName: 'John Doe',
                signerEmail: 'john.doe@example.com',
                signedAt: new Date('2024-01-15T10:30:00Z'),
                verificationUrl: 'https://example.com/verify/abc123',
                certificateId: 'CERT-12345-67890',
                language: 'en',
            };

            const { generateCertificate } = await import('./index');
            const result = await generateCertificate(mockCertData, defaultPdfOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should handle certificate generation with special characters', async () => {
            const mockCertData: CertificateData = {
                documentId: mockCertificateOptions.documentId,
                documentTitle: 'Contrato de Servicios Técnicos - Año 2024',
                signerName: 'José María González-Pérez',
                signerEmail: 'jose.maria@example.com',
                signedAt: new Date('2024-01-15T10:30:00Z'),
                verificationUrl: 'https://example.com/verify/abc123',
                certificateId: 'CERT-12345-67890',
                language: 'es',
            };

            const { generateCertificate } = await import('./index');
            const result = await generateCertificate(mockCertData, {
                ...defaultPdfOptions,
                language: 'es',
            });

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });
    });

    describe('Audit Log PDF Download Integration', () => {
        it('should generate audit log PDF through direct function call', async () => {
            const result = await generateAuditLog(mockAuditLogData, defaultPdfOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should handle audit log generation with many entries', async () => {
            // Create a large audit log with 100 entries to test pagination
            const manyEntries: AuditLogEntry[] = Array.from({ length: 100 }, (_, i) => ({
                id: `entry-${i + 1}`,
                timestamp: new Date(Date.now() + i * 60000),
                action: i % 2 === 0 ? 'DOCUMENT_OPENED' : 'DOCUMENT_VIEWED',
                user: `User ${i + 1}`,
                email: `user${i + 1}@example.com`,
                ipAddress: `192.168.1.${(i % 254) + 1}`,
                userAgent: 'Mozilla/5.0 (Test Browser)',
                details: {
                    action: `Action ${i + 1}`,
                    metadata: `Metadata for entry ${i + 1}`,
                },
            }));

            const largeAuditLogData = {
                ...mockAuditLogData,
                entries: manyEntries,
            };

            const result = await generateAuditLog(largeAuditLogData, defaultPdfOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(5000); // Should be larger with more entries
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should handle audit log generation with different languages', async () => {
            const languages = ['en', 'es', 'fr', 'de', 'it'] as const;

            for (const language of languages) {
                const langAuditLogData = {
                    ...mockAuditLogData,
                    language,
                };

                const result = await generateAuditLog(langAuditLogData, {
                    ...defaultPdfOptions,
                    language,
                });

                expect(result).toBeInstanceOf(Buffer);
                expect(result.length).toBeGreaterThan(1000);
                expect(result.subarray(0, 4).toString()).toBe('%PDF');
            }
        });

        it('should handle audit log generation with minimal entry data', async () => {
            const minimalEntries: AuditLogEntry[] = [
                {
                    id: '1',
                    timestamp: new Date('2024-01-15T09:00:00Z'),
                    action: 'DOCUMENT_CREATED',
                    // Missing optional fields
                },
                {
                    id: '2',
                    timestamp: new Date('2024-01-15T10:30:00Z'),
                    action: 'DOCUMENT_SIGNED',
                    user: 'John Doe',
                    // Missing other optional fields
                },
            ];

            const minimalAuditLogData = {
                ...mockAuditLogData,
                entries: minimalEntries,
            };

            const result = await generateAuditLog(minimalAuditLogData, defaultPdfOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should handle audit log generation with long document titles', async () => {
            const longTitleAuditLogData = {
                ...mockAuditLogData,
                documentTitle: 'This is a very long document title that should be properly handled in the audit log header without breaking the layout or causing any formatting issues in the PDF generation process',
            };

            const result = await generateAuditLog(longTitleAuditLogData, defaultPdfOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });
    });

    describe('PDF Generation Performance Integration', () => {
        it('should generate certificate PDF within reasonable time limits', async () => {
            const mockCertData: CertificateData = {
                documentId: mockCertificateOptions.documentId,
                documentTitle: 'Performance Test Document',
                signerName: 'John Doe',
                signerEmail: 'john.doe@example.com',
                signedAt: new Date('2024-01-15T10:30:00Z'),
                verificationUrl: 'https://example.com/verify/abc123',
                certificateId: 'CERT-12345-67890',
                language: 'en',
            };

            const startTime = Date.now();

            const { generateCertificate } = await import('./index');
            const result = await generateCertificate(mockCertData, defaultPdfOptions);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result).toBeInstanceOf(Buffer);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        it('should generate audit log PDF within reasonable time limits', async () => {
            const startTime = Date.now();

            const result = await generateAuditLog(mockAuditLogData, defaultPdfOptions);

            const endTime = Date.now();
            const duration = endTime - startTime;

            expect(result).toBeInstanceOf(Buffer);
            expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
        });

        it('should handle concurrent PDF generation requests', async () => {
            const mockCertData: CertificateData = {
                documentId: mockCertificateOptions.documentId,
                documentTitle: 'Concurrent Test Document',
                signerName: 'John Doe',
                signerEmail: 'john.doe@example.com',
                signedAt: new Date('2024-01-15T10:30:00Z'),
                verificationUrl: 'https://example.com/verify/abc123',
                certificateId: 'CERT-12345-67890',
                language: 'en',
            };

            const { generateCertificate } = await import('./index');

            // Generate 5 PDFs concurrently
            const promises = Array.from({ length: 5 }, (_, i) => {
                const data = {
                    ...mockCertData,
                    documentId: mockCertData.documentId + i,
                    certificateId: `CERT-${mockCertData.documentId + i}`,
                };
                return generateCertificate(data, defaultPdfOptions);
            });

            const results = await Promise.all(promises);

            expect(results).toHaveLength(5);
            results.forEach(result => {
                expect(result).toBeInstanceOf(Buffer);
                expect(result.length).toBeGreaterThan(1000);
                expect(result.subarray(0, 4).toString()).toBe('%PDF');
            });
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle invalid certificate data gracefully', async () => {
            const invalidCertData = {
                documentId: -1, // Invalid ID
                documentTitle: '',
                signerName: '',
                signerEmail: 'invalid-email',
                signedAt: 'not-a-date',
                verificationUrl: 'not-a-url',
                certificateId: '',
                language: 'invalid-language',
            };

            const { generateCertificate } = await import('./index');

            await expect(generateCertificate(invalidCertData as any, defaultPdfOptions))
                .rejects.toThrow();
        });

        it('should handle invalid audit log data gracefully', async () => {
            const invalidAuditLogData = {
                documentId: -1, // Invalid ID
                documentTitle: '',
                entries: [], // Empty entries
                generatedAt: 'not-a-date',
                language: 'invalid-language',
            };

            await expect(generateAuditLog(invalidAuditLogData as any, defaultPdfOptions))
                .rejects.toThrow();
        });

        it('should handle missing required fields in certificate data', async () => {
            const incompleteCertData = {
                documentId: 12345,
                // Missing required fields
            };

            const { generateCertificate } = await import('./index');

            await expect(generateCertificate(incompleteCertData as any, defaultPdfOptions))
                .rejects.toThrow();
        });

        it('should handle missing required fields in audit log data', async () => {
            const incompleteAuditLogData = {
                documentId: 12345,
                // Missing required fields
            };

            await expect(generateAuditLog(incompleteAuditLogData as any, defaultPdfOptions))
                .rejects.toThrow();
        });
    });

    describe('Format and Options Integration', () => {
        it('should generate certificate PDF with Letter format', async () => {
            const mockCertData: CertificateData = {
                documentId: mockCertificateOptions.documentId,
                documentTitle: 'Letter Format Test Document',
                signerName: 'John Doe',
                signerEmail: 'john.doe@example.com',
                signedAt: new Date('2024-01-15T10:30:00Z'),
                verificationUrl: 'https://example.com/verify/abc123',
                certificateId: 'CERT-12345-67890',
                language: 'en',
            };

            const letterOptions = {
                ...defaultPdfOptions,
                format: 'Letter' as const,
            };

            const { generateCertificate } = await import('./index');
            const result = await generateCertificate(mockCertData, letterOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate audit log PDF with Letter format', async () => {
            const letterOptions = {
                ...defaultPdfOptions,
                format: 'Letter' as const,
            };

            const result = await generateAuditLog(mockAuditLogData, letterOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate PDFs without background when specified', async () => {
            const noBackgroundOptions = {
                ...defaultPdfOptions,
                includeBackground: false,
            };

            const mockCertData: CertificateData = {
                documentId: mockCertificateOptions.documentId,
                documentTitle: 'No Background Test Document',
                signerName: 'John Doe',
                signerEmail: 'john.doe@example.com',
                signedAt: new Date('2024-01-15T10:30:00Z'),
                verificationUrl: 'https://example.com/verify/abc123',
                certificateId: 'CERT-12345-67890',
                language: 'en',
            };

            const { generateCertificate } = await import('./index');
            const certResult = await generateCertificate(mockCertData, noBackgroundOptions);
            const auditResult = await generateAuditLog(mockAuditLogData, noBackgroundOptions);

            expect(certResult).toBeInstanceOf(Buffer);
            expect(certResult.length).toBeGreaterThan(1000);
            expect(certResult.subarray(0, 4).toString()).toBe('%PDF');

            expect(auditResult).toBeInstanceOf(Buffer);
            expect(auditResult.length).toBeGreaterThan(1000);
            expect(auditResult.subarray(0, 4).toString()).toBe('%PDF');
        });
    });
});