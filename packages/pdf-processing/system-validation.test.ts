import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { generateAuditLog, generateCertificate } from "./index";
import {
  type AuditLogData,
  type AuditLogEntry,
  type CertificateData,
  type PDFGenerationOptions,
} from "./types";

/**
 * System validation tests for simplified Signtusk functionality
 * These tests validate that the system works without browser dependencies
 * Requirements: 8.2
 */
describe("Simplified System Functionality Validation", () => {
  let mockCertificateData: CertificateData;
  let mockAuditLogData: AuditLogData;
  let defaultOptions: PDFGenerationOptions;

  beforeAll(() => {
    // Setup test data
    mockCertificateData = {
      documentId: 12345,
      documentTitle: "System Validation Test Document",
      signerName: "John Doe",
      signerEmail: "john.doe@example.com",
      signedAt: new Date("2024-01-15T10:30:00Z"),
      verificationUrl: "https://example.com/verify/abc123",
      certificateId: "CERT-12345-67890",
      language: "en",
    };

    const mockAuditEntries: AuditLogEntry[] = [
      {
        id: "1",
        timestamp: new Date("2024-01-15T09:00:00Z"),
        action: "DOCUMENT_CREATED",
        user: "Admin User",
        email: "admin@example.com",
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Test Browser)",
        details: {
          action: "Document created",
          metadata: "Initial document creation",
        },
      },
      {
        id: "2",
        timestamp: new Date("2024-01-15T10:30:00Z"),
        action: "DOCUMENT_SIGNED",
        user: "John Doe",
        email: "john.doe@example.com",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Mobile Browser)",
        details: {
          action: "Document signed",
          metadata: "Digital signature applied",
        },
      },
    ];

    mockAuditLogData = {
      documentId: 12345,
      documentTitle: "System Validation Audit Log",
      entries: mockAuditEntries,
      generatedAt: new Date("2024-01-15T11:00:00Z"),
      language: "en",
    };

    defaultOptions = {
      format: "A4",
      language: "en",
      includeBackground: true,
    };
  });

  describe("Browser Dependency Validation", () => {
    it("should not require browser dependencies for PDF generation", async () => {
      // Test that PDF generation works without any browser process
      let browserError = false;
      let generationError: Error | null = null;

      try {
        const certificateResult = await generateCertificate(
          mockCertificateData,
          defaultOptions
        );
        const auditLogResult = await generateAuditLog(
          mockAuditLogData,
          defaultOptions
        );

        // Validate that PDFs were generated successfully
        expect(certificateResult).toBeInstanceOf(Buffer);
        expect(certificateResult.length).toBeGreaterThan(1000);
        expect(certificateResult.subarray(0, 4).toString()).toBe("%PDF");

        expect(auditLogResult).toBeInstanceOf(Buffer);
        expect(auditLogResult.length).toBeGreaterThan(1000);
        expect(auditLogResult.subarray(0, 4).toString()).toBe("%PDF");
      } catch (error) {
        generationError = error as Error;

        // Check if error is browser-related
        const errorMessage =
          error instanceof Error ? error.message.toLowerCase() : "";
        if (
          errorMessage.includes("browser") ||
          errorMessage.includes("chromium") ||
          errorMessage.includes("playwright") ||
          errorMessage.includes("puppeteer") ||
          errorMessage.includes("headless")
        ) {
          browserError = true;
        }
      }

      // Should not have browser-related errors
      expect(browserError).toBe(false);

      // Should not have any generation errors
      if (generationError) {
        throw generationError;
      }
    });

    it("should not import browser-related modules", async () => {
      // Check that the PDF processing package doesn't import browser dependencies
      const packageJsonPath = join(process.cwd(), "package.json");

      if (existsSync(packageJsonPath)) {
        const packageContent = JSON.parse(
          readFileSync(packageJsonPath, "utf-8")
        );

        // Check dependencies
        const allDeps = {
          ...packageContent.dependencies,
          ...packageContent.devDependencies,
        };

        // Should not have browser-related dependencies as required dependencies
        expect(allDeps.playwright).toBeUndefined();
        expect(allDeps.puppeteer).toBeUndefined();
        expect(allDeps.chromium).toBeUndefined();
        expect(allDeps["@playwright/test"]).toBeUndefined();

        // Should have PDF processing dependencies
        expect(allDeps["pdf-lib"]).toBeDefined();
        expect(allDeps.qrcode).toBeDefined();
        expect(allDeps.zod).toBeDefined();
      }
    });

    it("should work with server-side only dependencies", async () => {
      // Test that all required server-side dependencies are available
      let importError = false;

      try {
        // These should all import successfully
        const pdfLib = await import("pdf-lib");
        const qrcode = await import("qrcode");
        const zod = await import("zod");
        const luxon = await import("luxon");

        expect(pdfLib).toBeDefined();
        expect(qrcode).toBeDefined();
        expect(zod).toBeDefined();
        expect(luxon).toBeDefined();
      } catch (error) {
        importError = true;
        console.error("Failed to import server-side dependencies:", error);
      }

      expect(importError).toBe(false);
    });
  });

  describe("Core Document Signing Workflow Validation", () => {
    it("should generate certificate PDFs for completed documents", async () => {
      // Simulate a completed document signing workflow
      const completedDocumentData = {
        ...mockCertificateData,
        documentTitle: "Completed Contract Agreement",
        signerName: "Jane Smith",
        signerEmail: "jane.smith@company.com",
        signedAt: new Date(), // Recently signed
      };

      const result = await generateCertificate(
        completedDocumentData,
        defaultOptions
      );

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(1000);
      expect(result.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("should generate audit logs for document workflows", async () => {
      // Simulate a complete document workflow with audit entries
      const workflowAuditEntries: AuditLogEntry[] = [
        {
          id: "1",
          timestamp: new Date("2024-01-15T09:00:00Z"),
          action: "DOCUMENT_CREATED",
          user: "Document Owner",
          email: "owner@company.com",
          ipAddress: "192.168.1.10",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        {
          id: "2",
          timestamp: new Date("2024-01-15T09:15:00Z"),
          action: "DOCUMENT_SENT",
          user: "Document Owner",
          email: "owner@company.com",
          ipAddress: "192.168.1.10",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
        {
          id: "3",
          timestamp: new Date("2024-01-15T10:00:00Z"),
          action: "DOCUMENT_OPENED",
          user: "Jane Smith",
          email: "jane.smith@company.com",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
        },
        {
          id: "4",
          timestamp: new Date("2024-01-15T10:30:00Z"),
          action: "DOCUMENT_SIGNED",
          user: "Jane Smith",
          email: "jane.smith@company.com",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
        },
        {
          id: "5",
          timestamp: new Date("2024-01-15T10:31:00Z"),
          action: "DOCUMENT_COMPLETED",
          user: "System",
          email: "system@company.com",
          ipAddress: "10.0.0.1",
          userAgent: "Signtusk/1.0",
        },
      ];

      const workflowAuditData = {
        ...mockAuditLogData,
        documentTitle: "Contract Agreement Workflow",
        entries: workflowAuditEntries,
      };

      const result = await generateAuditLog(workflowAuditData, defaultOptions);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(1000);
      expect(result.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("should handle multi-recipient document workflows", async () => {
      // Simulate a document with multiple signers
      const multiRecipientEntries: AuditLogEntry[] = [
        {
          id: "1",
          timestamp: new Date("2024-01-15T09:00:00Z"),
          action: "DOCUMENT_CREATED",
          user: "Document Owner",
          email: "owner@company.com",
        },
        {
          id: "2",
          timestamp: new Date("2024-01-15T09:15:00Z"),
          action: "DOCUMENT_SENT",
          user: "Document Owner",
          email: "owner@company.com",
        },
        // First recipient
        {
          id: "3",
          timestamp: new Date("2024-01-15T10:00:00Z"),
          action: "DOCUMENT_OPENED",
          user: "John Doe",
          email: "john.doe@company.com",
        },
        {
          id: "4",
          timestamp: new Date("2024-01-15T10:30:00Z"),
          action: "DOCUMENT_SIGNED",
          user: "John Doe",
          email: "john.doe@company.com",
        },
        // Second recipient
        {
          id: "5",
          timestamp: new Date("2024-01-15T11:00:00Z"),
          action: "DOCUMENT_OPENED",
          user: "Jane Smith",
          email: "jane.smith@company.com",
        },
        {
          id: "6",
          timestamp: new Date("2024-01-15T11:30:00Z"),
          action: "DOCUMENT_SIGNED",
          user: "Jane Smith",
          email: "jane.smith@company.com",
        },
        {
          id: "7",
          timestamp: new Date("2024-01-15T11:31:00Z"),
          action: "DOCUMENT_COMPLETED",
          user: "System",
          email: "system@company.com",
        },
      ];

      const multiRecipientData = {
        ...mockAuditLogData,
        documentTitle: "Multi-Party Agreement",
        entries: multiRecipientEntries,
      };

      const result = await generateAuditLog(multiRecipientData, defaultOptions);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(2000); // Should be larger with more entries
      expect(result.subarray(0, 4).toString()).toBe("%PDF");
    });

    it("should handle document rejection workflows", async () => {
      // Simulate a document that was rejected
      const rejectionEntries: AuditLogEntry[] = [
        {
          id: "1",
          timestamp: new Date("2024-01-15T09:00:00Z"),
          action: "DOCUMENT_CREATED",
          user: "Document Owner",
          email: "owner@company.com",
        },
        {
          id: "2",
          timestamp: new Date("2024-01-15T09:15:00Z"),
          action: "DOCUMENT_SENT",
          user: "Document Owner",
          email: "owner@company.com",
        },
        {
          id: "3",
          timestamp: new Date("2024-01-15T10:00:00Z"),
          action: "DOCUMENT_OPENED",
          user: "John Doe",
          email: "john.doe@company.com",
        },
        {
          id: "4",
          timestamp: new Date("2024-01-15T10:30:00Z"),
          action: "DOCUMENT_REJECTED",
          user: "John Doe",
          email: "john.doe@company.com",
          details: {
            action: "Document rejected",
            metadata: "Terms not acceptable",
          },
        },
      ];

      const rejectionData = {
        ...mockAuditLogData,
        documentTitle: "Rejected Contract",
        entries: rejectionEntries,
      };

      const result = await generateAuditLog(rejectionData, defaultOptions);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(1000);
      expect(result.subarray(0, 4).toString()).toBe("%PDF");
    });
  });

  describe("PDF Generation Performance Validation", () => {
    it("should meet or exceed original system performance for certificates", async () => {
      const performanceTestData = {
        ...mockCertificateData,
        documentTitle: "Performance Test Certificate",
      };

      // Measure performance
      const startTime = Date.now();
      const result = await generateCertificate(
        performanceTestData,
        defaultOptions
      );
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Validate result
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(1000);
      expect(result.subarray(0, 4).toString()).toBe("%PDF");

      // Performance should be better than browser-based generation
      // Browser-based generation typically takes 2-5 seconds
      // Server-side generation should be faster
      expect(duration).toBeLessThan(3000); // Should be under 3 seconds

      console.log(`Certificate generation took ${duration}ms`);
    });

    it("should meet or exceed original system performance for audit logs", async () => {
      // Create a moderately sized audit log for performance testing
      const performanceEntries: AuditLogEntry[] = Array.from(
        { length: 25 },
        (_, i) => ({
          id: `perf-${i + 1}`,
          timestamp: new Date(Date.now() + i * 60000),
          action: i % 2 === 0 ? "DOCUMENT_OPENED" : "DOCUMENT_VIEWED",
          user: `User ${i + 1}`,
          email: `user${i + 1}@example.com`,
          ipAddress: `192.168.1.${(i % 254) + 1}`,
          userAgent: "Mozilla/5.0 (Performance Test)",
          details: {
            action: `Performance test action ${i + 1}`,
            metadata: `Test metadata ${i + 1}`,
          },
        })
      );

      const performanceData = {
        ...mockAuditLogData,
        documentTitle: "Performance Test Audit Log",
        entries: performanceEntries,
      };

      // Measure performance
      const startTime = Date.now();
      const result = await generateAuditLog(performanceData, defaultOptions);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Validate result
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(2000);
      expect(result.subarray(0, 4).toString()).toBe("%PDF");

      // Performance should be better than browser-based generation
      expect(duration).toBeLessThan(4000); // Should be under 4 seconds

      console.log(`Audit log generation took ${duration}ms`);
    });

    it("should handle concurrent generation efficiently", async () => {
      // Test concurrent generation performance
      const concurrentData = Array.from({ length: 3 }, (_, i) => ({
        ...mockCertificateData,
        documentId: mockCertificateData.documentId + i,
        documentTitle: `Concurrent Test Document ${i + 1}`,
        certificateId: `CERT-${mockCertificateData.documentId + i}`,
      }));

      const startTime = Date.now();

      const results = await Promise.all([
        generateCertificate(concurrentData[0], defaultOptions),
        generateCertificate(concurrentData[1], defaultOptions),
        generateCertificate(concurrentData[2], defaultOptions),
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Validate all results
      results.forEach((result) => {
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(1000);
        expect(result.subarray(0, 4).toString()).toBe("%PDF");
      });

      // Concurrent generation should be efficient
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds

      console.log(`Concurrent generation of 3 certificates took ${duration}ms`);
    });
  });

  describe("System Integration Validation", () => {
    it("should work with different document types and formats", async () => {
      const documentTypes = [
        "Contract Agreement",
        "Non-Disclosure Agreement",
        "Employment Contract",
        "Service Agreement",
        "Purchase Order",
      ];

      for (const docType of documentTypes) {
        const testData = {
          ...mockCertificateData,
          documentTitle: docType,
          documentId:
            mockCertificateData.documentId + documentTypes.indexOf(docType),
        };

        const result = await generateCertificate(testData, defaultOptions);

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(1000);
        expect(result.subarray(0, 4).toString()).toBe("%PDF");
      }
    });

    it("should work with different languages and locales", async () => {
      const languages = [
        { code: "en", name: "English" },
        { code: "es", name: "Español" },
        { code: "fr", name: "Français" },
        { code: "de", name: "Deutsch" },
        { code: "it", name: "Italiano" },
      ];

      for (const lang of languages) {
        const testData = {
          ...mockCertificateData,
          language: lang.code,
          documentTitle: `Test Document in ${lang.name}`,
        };

        const result = await generateCertificate(testData, {
          ...defaultOptions,
          language: lang.code,
        });

        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(1000);
        expect(result.subarray(0, 4).toString()).toBe("%PDF");
      }
    });

    it("should maintain data integrity across generation cycles", async () => {
      // Generate the same certificate multiple times and ensure consistency
      const testData = {
        ...mockCertificateData,
        documentTitle: "Data Integrity Test",
      };

      const results = await Promise.all([
        generateCertificate(testData, defaultOptions),
        generateCertificate(testData, defaultOptions),
        generateCertificate(testData, defaultOptions),
      ]);

      // All results should be valid PDFs
      results.forEach((result) => {
        expect(result).toBeInstanceOf(Buffer);
        expect(result.length).toBeGreaterThan(1000);
        expect(result.subarray(0, 4).toString()).toBe("%PDF");
      });

      // Results should be similar in size (within reasonable variance)
      const sizes = results.map((r) => r.length);
      const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      const maxVariance = avgSize * 0.1; // 10% variance allowed

      sizes.forEach((size) => {
        expect(Math.abs(size - avgSize)).toBeLessThan(maxVariance);
      });
    });
  });
});
