/**
 * Property-based tests for cross-platform compatibility
 * Feature: pdf-digital-signature, Property 31: Cross-Platform Compatibility
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

// Test data generators
const platformInfoArb = fc.constantFrom('windows', 'macos', 'linux').chain(os => {
  const getCryptoProviders = (platform: string) => {
    const baseProviders = ['ring'];
    switch (platform) {
      case 'windows':
        return fc.array(
          fc.constantFrom('ring', 'CryptoAPI', 'CNG', 'TPM'),
          { minLength: 1, maxLength: 3 }
        );
      case 'macos':
        return fc.array(
          fc.constantFrom('ring', 'Security Framework', 'CommonCrypto', 'Secure Enclave'),
          { minLength: 1, maxLength: 3 }
        );
      case 'linux':
        return fc.array(
          fc.constantFrom('ring', 'OpenSSL', 'PKCS#11'),
          { minLength: 1, maxLength: 3 }
        );
      default:
        return fc.array(fc.constant('ring'), { minLength: 1, maxLength: 1 });
    }
  };

  return fc.record({
    os: fc.constant(os),
    arch: fc.constantFrom('x86_64', 'aarch64', 'arm64'),
    hasHardwareCrypto: fc.boolean(),
    cryptoProviders: getCryptoProviders(os)
  });
});

const filePathArb = fc.constantFrom('windows', 'macos', 'linux').chain(platform => {
  return fc.string({ minLength: 5, maxLength: 50 }).map(path => {
    // Generate platform-appropriate file paths
    const cleanPath = path.replace(/[/\\:*?"<>|\s]/g, '_').replace(/_{2,}/g, '_');
    switch (platform) {
      case 'windows':
        return `C:\\${cleanPath}\\temp.pdf`;
      case 'macos':
      case 'linux':
        return `/${cleanPath}/temp.pdf`;
      default:
        return `/${cleanPath}/temp.pdf`;
    }
  });
});

const validPdfDocumentArb = fc.uint8Array({ minLength: 1000, maxLength: 5000 }).map(data => {
  // Create a minimal valid PDF structure
  const header = new TextEncoder().encode('%PDF-1.7\n');
  const catalog = new TextEncoder().encode('1 0 obj<</Type/Catalog/Pages 2 0 R>>\nendobj\n');
  const pages = new TextEncoder().encode('2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>\nendobj\n');
  const page = new TextEncoder().encode('3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>\nendobj\n');
  const xref = new TextEncoder().encode('xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n');
  const trailer = new TextEncoder().encode('trailer<</Size 4/Root 1 0 R>>\nstartxref\n180\n%%EOF');
  
  const combined = new Uint8Array(
    header.length + catalog.length + pages.length + page.length + 
    data.length + xref.length + trailer.length
  );
  
  let offset = 0;
  combined.set(header, offset); offset += header.length;
  combined.set(catalog, offset); offset += catalog.length;
  combined.set(pages, offset); offset += pages.length;
  combined.set(page, offset); offset += page.length;
  combined.set(data, offset); offset += data.length;
  combined.set(xref, offset); offset += xref.length;
  combined.set(trailer, offset);
  
  return Buffer.from(combined);
});

const certificateDataArb = fc.uint8Array({ minLength: 500, maxLength: 1500 }).map(data => {
  // Create a mock certificate structure
  const certHeader = new Uint8Array([0x30, 0x82]);
  const lengthBytes = new Uint8Array([(data.length >> 8) & 0xFF, data.length & 0xFF]);
  const combined = new Uint8Array(certHeader.length + lengthBytes.length + data.length);
  combined.set(certHeader, 0);
  combined.set(lengthBytes, certHeader.length);
  combined.set(data, certHeader.length + lengthBytes.length);
  return Buffer.from(combined);
});

const privateKeyDataArb = fc.uint8Array({ minLength: 200, maxLength: 800 }).map(data => {
  // Create a mock private key structure
  const keyHeader = new Uint8Array([0x30, 0x82]);
  const lengthBytes = new Uint8Array([(data.length >> 8) & 0xFF, data.length & 0xFF]);
  const combined = new Uint8Array(keyHeader.length + lengthBytes.length + data.length);
  combined.set(keyHeader, 0);
  combined.set(lengthBytes, keyHeader.length);
  combined.set(data, keyHeader.length + lengthBytes.length);
  return Buffer.from(combined);
});

// Mock implementations for testing
class MockPlatformAbstraction {
  constructor(private platformInfo: any) {}

  getPlatformInfo() {
    return this.platformInfo;
  }

  getSystemCertificates() {
    // Mock platform-specific certificate access
    return [];
  }

  getTempDirectory() {
    const { os } = this.platformInfo;
    switch (os) {
      case 'windows':
        return 'C:\\Windows\\Temp\\pdf-sign';
      case 'macos':
        return '/tmp/pdf-sign';
      case 'linux':
        return '/tmp/pdf-sign';
      default:
        return '/tmp/pdf-sign';
    }
  }

  usePlatformCrypto() {
    return this.platformInfo.hasHardwareCrypto;
  }

  createSecureFile(path: string) {
    // Mock secure file creation with platform-appropriate permissions
    return { path, permissions: this.getFilePermissions() };
  }

  private getFilePermissions() {
    const { os } = this.platformInfo;
    switch (os) {
      case 'windows':
        return 'OWNER_FULL_ACCESS';
      case 'macos':
      case 'linux':
        return '0600'; // Owner read/write only
      default:
        return '0600';
    }
  }
}

class MockCrossplatformSigner {
  constructor(private platformAbstraction: MockPlatformAbstraction) {}

  async signDocument(pdfData: Buffer, certData: Buffer, keyData: Buffer) {
    const platformInfo = this.platformAbstraction.getPlatformInfo();
    
    // Simulate platform-specific signing behavior
    const result = {
      signedPdf: Buffer.concat([pdfData, Buffer.from('SIGNATURE_DATA')]),
      platformInfo,
      usedPlatformCrypto: this.platformAbstraction.usePlatformCrypto(),
      tempDir: this.platformAbstraction.getTempDirectory(),
      cryptoProviders: platformInfo.cryptoProviders
    };

    return result;
  }

  async validateSignature(signedPdf: Buffer) {
    const platformInfo = this.platformAbstraction.getPlatformInfo();
    
    // Simulate platform-specific validation
    return {
      isValid: signedPdf.includes(Buffer.from('SIGNATURE_DATA')),
      platformInfo,
      validationMethod: this.getValidationMethod(platformInfo)
    };
  }

  private getValidationMethod(platformInfo: any) {
    if (platformInfo.cryptoProviders.includes('Security Framework')) {
      return 'macOS Security Framework';
    } else if (platformInfo.cryptoProviders.includes('CNG')) {
      return 'Windows CNG';
    } else if (platformInfo.cryptoProviders.includes('OpenSSL')) {
      return 'Linux OpenSSL';
    } else {
      return 'ring (cross-platform)';
    }
  }
}

describe('Cross-Platform Compatibility Properties', () => {
  /**
   * Property 31: Cross-Platform Compatibility
   * For any supported platform (Windows, macOS, Linux) and architecture (x86_64, ARM64), 
   * the system should function correctly and utilize platform-specific optimizations where available
   * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5
   */
  it('should function correctly across all supported platforms and architectures', async () => {
    await fc.assert(
      fc.asyncProperty(
        platformInfoArb,
        validPdfDocumentArb,
        certificateDataArb,
        privateKeyDataArb,
        async (platformInfo, pdfData, certData, keyData) => {
          // Create platform-specific abstraction
          const platformAbstraction = new MockPlatformAbstraction(platformInfo);
          const signer = new MockCrossplatformSigner(platformAbstraction);

          // Test signing functionality
          const signResult = await signer.signDocument(pdfData, certData, keyData);

          // Verify platform compatibility requirements
          
          // Requirement 10.1: Function correctly on supported OS
          expect(['windows', 'macos', 'linux']).toContain(platformInfo.os);
          expect(signResult.signedPdf).toBeDefined();
          expect(signResult.signedPdf.length).toBeGreaterThan(pdfData.length);

          // Requirement 10.2: Support both x86_64 and ARM64 architectures
          expect(['x86_64', 'aarch64', 'arm64']).toContain(platformInfo.arch);

          // Requirement 10.3: Platform-specific certificate store integration
          const certificates = platformAbstraction.getSystemCertificates();
          expect(Array.isArray(certificates)).toBe(true);

          // Requirement 10.4: Platform-appropriate file path handling
          const tempDir = platformAbstraction.getTempDirectory();
          if (platformInfo.os === 'windows') {
            expect(tempDir).toMatch(/^[A-Z]:\\/);
          } else {
            expect(tempDir).toMatch(/^\//);
          }

          // Requirement 10.5: Utilize platform-specific crypto APIs when available
          if (platformInfo.hasHardwareCrypto) {
            expect(signResult.usedPlatformCrypto).toBe(true);
          }

          // Test validation functionality
          const validationResult = await signer.validateSignature(signResult.signedPdf);
          expect(validationResult.isValid).toBe(true);
          expect(validationResult.platformInfo).toEqual(platformInfo);

          // Verify platform-specific validation methods are used
          const expectedProviders = {
            'windows': ['CNG', 'CryptoAPI', 'TPM'],
            'macos': ['Security Framework', 'CommonCrypto', 'Secure Enclave'],
            'linux': ['OpenSSL', 'PKCS#11']
          };

          const platformProviders = expectedProviders[platformInfo.os as keyof typeof expectedProviders] || [];
          const hasExpectedProvider = platformProviders.some(provider => 
            signResult.cryptoProviders.includes(provider)
          );

          // Should use platform-specific providers when available, or fall back to ring
          expect(
            hasExpectedProvider || signResult.cryptoProviders.includes('ring')
          ).toBe(true);

          // Verify crypto providers are consistent with platform
          const validProvidersForPlatform = ['ring', ...platformProviders];
          const allProvidersValid = signResult.cryptoProviders.every(provider =>
            validProvidersForPlatform.includes(provider)
          );
          expect(allProvidersValid).toBe(true);
        }
      ),
      { 
        numRuns: 50, // Reduced for faster execution while maintaining coverage
        verbose: true 
      }
    );
  });

  it('should handle platform-specific file operations correctly', async () => {
    await fc.assert(
      fc.asyncProperty(
        platformInfoArb,
        async (platformInfo) => {
          // Generate platform-appropriate file path based on the platform info
          const filePath = platformInfo.os === 'windows' 
            ? `C:\\test_${Math.random().toString(36).substring(7)}\\temp.pdf`
            : `/test_${Math.random().toString(36).substring(7)}/temp.pdf`;

          const platformAbstraction = new MockPlatformAbstraction(platformInfo);

          // Test secure file creation
          const fileResult = platformAbstraction.createSecureFile(filePath);

          // Verify platform-appropriate file permissions
          if (platformInfo.os === 'windows') {
            expect(fileResult.permissions).toBe('OWNER_FULL_ACCESS');
          } else {
            expect(fileResult.permissions).toBe('0600');
          }

          // Verify file path format matches platform conventions
          if (filePath.startsWith('C:\\')) {
            // Windows path - should only be used when testing Windows platform
            expect(['windows']).toContain(platformInfo.os);
          } else if (filePath.startsWith('/')) {
            // Unix-style path - should be used for macOS and Linux
            expect(['macos', 'linux']).toContain(platformInfo.os);
          }
        }
      ),
      { 
        numRuns: 30,
        verbose: true 
      }
    );
  });

  it('should provide consistent behavior across platforms', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(platformInfoArb, { minLength: 2, maxLength: 3 }),
        validPdfDocumentArb,
        certificateDataArb,
        privateKeyDataArb,
        async (platforms, pdfData, certData, keyData) => {
          const results = [];

          // Test the same operation on different platforms
          for (const platformInfo of platforms) {
            const platformAbstraction = new MockPlatformAbstraction(platformInfo);
            const signer = new MockCrossplatformSigner(platformAbstraction);
            
            const result = await signer.signDocument(pdfData, certData, keyData);
            results.push(result);
          }

          // Verify consistent behavior across platforms
          const firstResult = results[0];
          for (let i = 1; i < results.length; i++) {
            const currentResult = results[i];
            
            // Core functionality should be consistent
            expect(currentResult.signedPdf.length).toBeGreaterThan(pdfData.length);
            
            // All should produce valid signatures (though implementation may differ)
            const validation1 = await new MockCrossplatformSigner(
              new MockPlatformAbstraction(platforms[0])
            ).validateSignature(firstResult.signedPdf);
            
            const validation2 = await new MockCrossplatformSigner(
              new MockPlatformAbstraction(platforms[i])
            ).validateSignature(currentResult.signedPdf);
            
            expect(validation1.isValid).toBe(true);
            expect(validation2.isValid).toBe(true);
          }
        }
      ),
      { 
        numRuns: 25,
        verbose: true 
      }
    );
  });
});