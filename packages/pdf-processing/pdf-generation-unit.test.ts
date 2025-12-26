import { describe, it, expect, beforeEach } from 'vitest';
import { generateCertificate, generateAuditLog } from './index';
import {
    type CertificateData,
    type AuditLogData,
    type AuditLogEntry,
    type PDFGenerationOptions,
    PDFProcessingError,
    PDF_ERROR_CODES
} from './types';

/**
 * Unit tests for PDF generation functionality
 * These tests validate specific scenarios and edge cases for certificate and audit log generation
 * Requirements: 8.1
 */
describe('PDF Generation Unit Tests', () => {
    let mockCertificateData: CertificateData;
    let mockAuditLogData: AuditLogData;
    let defaultOptions: PDFGenerationOptions;

    beforeEach(() => {
        // Setup mock data for consistent testing
        mockCertificateData = {
            documentId: 12345,
            documentTitle: 'Test Document for Certificate Generation',
            signerName: 'John Doe',
            signerEmail: 'john.doe@example.com',
            signedAt: new Date('2024-01-15T10:30:00Z'),
            verificationUrl: 'https://example.com/verify/abc123',
            certificateId: 'CERT-12345-67890',
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
                timestamp: new Date('2024-01-15T09:15:00Z'),
                action: 'DOCUMENT_SENT',
                user: 'Admin User',
                email: 'admin@example.com',
                ipAddress: '192.168.1.1',
                userAgent: 'Mozilla/5.0 (Test Browser)',
                details: {
                    action: 'Document sent to recipient',
                    metadata: 'Sent to john.doe@example.com',
                },
            },
            {
                id: '3',
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
            documentTitle: 'Test Document for Audit Log',
            entries: mockAuditEntries,
            generatedAt: new Date('2024-01-15T11:00:00Z'),
            language: 'en',
        };

        defaultOptions = {
            format: 'A4',
            language: 'en',
            includeBackground: true,
        };
    });

    describe('Certificate Generation Unit Tests', () => {
        it('should generate certificate PDF with standard document data', async () => {
            const result = await generateCertificate(mockCertificateData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate certificate PDF with long document title', async () => {
            const longTitleData = {
                ...mockCertificateData,
                documentTitle: 'This is a very long document title that should be properly wrapped and formatted in the certificate PDF to ensure readability and professional appearance',
            };

            const result = await generateCertificate(longTitleData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate certificate PDF with special characters in signer name', async () => {
            const specialCharData = {
                ...mockCertificateData,
                signerName: 'José María González-Pérez',
                signerEmail: 'jose.maria@example.com',
            };

            const result = await generateCertificate(specialCharData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate certificate PDF with different languages', async () => {
            const languages = ['en', 'es', 'fr', 'de', 'it'] as const;

            for (const language of languages) {
                const langData = {
                    ...mockCertificateData,
                    language,
                };

                const result = await generateCertificate(langData, { ...defaultOptions, language });

                expect(result).toBeInstanceOf(Buffer);
                expect(result.length).toBeGreaterThan(1000);
                expect(result.subarray(0, 4).toString()).toBe('%PDF');
            }
        });

        it('should generate certificate PDF with Letter format', async () => {
            const letterOptions = {
                ...defaultOptions,
                format: 'Letter' as const,
            };

            const result = await generateCertificate(mockCertificateData, letterOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate certificate PDF without background', async () => {
            const noBackgroundOptions = {
                ...defaultOptions,
                includeBackground: false,
            };

            const result = await generateCertificate(mockCertificateData, noBackgroundOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should handle very long verification URLs', async () => {
            const longUrlData = {
                ...mockCertificateData,
                verificationUrl: 'https://very-long-domain-name-for-testing-purposes.example.com/verify/very-long-token-that-might-be-used-in-some-systems/abc123def456ghi789',
            };

            const result = await generateCertificate(longUrlData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should throw error for invalid certificate data', async () => {
            const invalidData = {
                ...mockCertificateData,
                verificationUrl: 'not-a-valid-url', // Invalid URL will fail validation
            };

            await expect(generateCertificate(invalidData as any, defaultOptions))
                .rejects.toThrow();
        });
    });

    describe('Audit Log Generation Unit Tests', () => {
        it('should generate audit log PDF with standard data', async () => {
            const result = await generateAuditLog(mockAuditLogData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate audit log PDF with single entry', async () => {
            const singleEntryData = {
                ...mockAuditLogData,
                entries: [mockAuditLogData.entries[0]],
            };

            const result = await generateAuditLog(singleEntryData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate audit log PDF with many entries (pagination test)', async () => {
            // Create 50 entries to test pagination
            const manyEntries: AuditLogEntry[] = Array.from({ length: 50 }, (_, i) => ({
                id: `entry-${i + 1}`,
                timestamp: new Date(Date.now() + i * 60000), // 1 minute apart
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

            const manyEntriesData = {
                ...mockAuditLogData,
                entries: manyEntries,
            };

            const result = await generateAuditLog(manyEntriesData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(5000); // Should be larger with more entries
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate audit log PDF with entries missing optional fields', async () => {
            const minimalEntries: AuditLogEntry[] = [
                {
                    id: '1',
                    timestamp: new Date('2024-01-15T09:00:00Z'),
                    action: 'DOCUMENT_CREATED',
                    // Missing user, email, ipAddress, userAgent, details
                },
                {
                    id: '2',
                    timestamp: new Date('2024-01-15T09:15:00Z'),
                    action: 'DOCUMENT_SENT',
                    user: 'Admin User',
                    // Missing email, ipAddress, userAgent, details
                },
            ];

            const minimalData = {
                ...mockAuditLogData,
                entries: minimalEntries,
            };

            const result = await generateAuditLog(minimalData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate audit log PDF with different action types', async () => {
            const actionTypes = [
                'DOCUMENT_CREATED',
                'DOCUMENT_SENT',
                'DOCUMENT_OPENED',
                'DOCUMENT_SIGNED',
                'DOCUMENT_COMPLETED',
            ] as const;

            const diverseEntries: AuditLogEntry[] = actionTypes.map((action, i) => ({
                id: `${i + 1}`,
                timestamp: new Date(Date.now() + i * 60000),
                action,
                user: `User ${i + 1}`,
                email: `user${i + 1}@example.com`,
                ipAddress: `192.168.1.${i + 1}`,
                userAgent: 'Mozilla/5.0 (Test Browser)',
                details: {
                    action: `${action} performed`,
                    metadata: `Details for ${action}`,
                },
            }));

            const diverseData = {
                ...mockAuditLogData,
                entries: diverseEntries,
            };

            const result = await generateAuditLog(diverseData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate audit log PDF with long document title', async () => {
            const longTitleData = {
                ...mockAuditLogData,
                documentTitle: 'This is a very long document title that should be properly handled in the audit log header without breaking the layout or causing formatting issues',
            };

            const result = await generateAuditLog(longTitleData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });

        it('should generate audit log PDF with different languages', async () => {
            const languages = ['en', 'es', 'fr', 'de', 'it'] as const;

            for (const language of languages) {
                const langData = {
                    ...mockAuditLogData,
                    language,
                };

                const result = await generateAuditLog(langData, { ...defaultOptions, language });

                expect(result).toBeInstanceOf(Buffer);
                expect(result.length).toBeGreaterThan(1000);
                expect(result.subarray(0, 4).toString()).toBe('%PDF');
            }
        });

        it('should throw error for invalid audit log data', async () => {
            const invalidData = {
                ...mockAuditLogData,
                generatedAt: 'not-a-date', // Invalid date will fail validation
            };

            await expect(generateAuditLog(invalidData as any, defaultOptions))
                .rejects.toThrow();
        });
    });

    describe('Error Handling Unit Tests', () => {
        it('should throw PDFProcessingError with correct error code for validation failures', async () => {
            const invalidCertData = {
                ...mockCertificateData,
                verificationUrl: 'not-a-valid-url', // Invalid URL
            };

            try {
                await generateCertificate(invalidCertData as any, defaultOptions);
                expect.fail('Should have thrown an error');
            } catch (error) {
                expect(error).toBeInstanceOf(PDFProcessingError);
                expect((error as PDFProcessingError).code).toBe(PDF_ERROR_CODES.VALIDATION_FAILED);
            }
        });

        it('should handle missing optional fields gracefully', async () => {
            const minimalCertData = {
                documentId: 12345,
                documentTitle: 'Test Document',
                signerName: 'Test Signer',
                signerEmail: 'test@example.com',
                signedAt: new Date(),
                verificationUrl: 'https://example.com/verify',
                certificateId: 'CERT-123',
                language: 'en',
            };

            const result = await generateCertificate(minimalCertData, defaultOptions);

            expect(result).toBeInstanceOf(Buffer);
            expect(result.length).toBeGreaterThan(1000);
            expect(result.subarray(0, 4).toString()).toBe('%PDF');
        });
    });

    describe('Performance Unit Tests', () => {
        it('should generate certificate PDF within reasonable time', async () => {
            const startTime = Date.now();

            await generateCertificate(mockCertificateData, defaultOptions);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within 5 seconds
            expect(duration).toBeLessThan(5000);
        });

        it('should generate audit log PDF within reasonable time', async () => {
            const startTime = Date.now();

            await generateAuditLog(mockAuditLogData, defaultOptions);

            const endTime = Date.now();
            const duration = endTime - startTime;

            // Should complete within 5 seconds
            expect(duration).toBeLessThan(5000);
        });

        it('should handle concurrent PDF generation', async () => {
            const promises = Array.from({ length: 5 }, (_, i) => {
                const data = {
                    ...mockCertificateData,
                    documentId: mockCertificateData.documentId + i,
                    certificateId: `CERT-${mockCertificateData.documentId + i}`,
                };
                return generateCertificate(data, defaultOptions);
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
});