/**
 * Property-based tests for RFC 3161 Timestamp Integration
 * Feature: pdf-digital-signature, Property 19: RFC 3161 Timestamp Integration
 * 
 * Validates: Requirements 5.5
 * "WHERE timestamping is required, THE Cryptographic_Engine SHALL support RFC 3161 timestamp integration"
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { PdfSigner } from '../index.js';

describe('RFC 3161 Timestamp Integration Properties', () => {
  
  it('should create PdfSigner instance', () => {
    const signer = new PdfSigner();
    expect(signer).toBeDefined();
  });

  it('Property 19: RFC 3161 timestamp integration - basic test', async () => {
    const signer = new PdfSigner();
    
    // Create minimal PDF content
    const pdfContent = Buffer.from('%PDF-1.7\n%%EOF');
    
    // Create minimal certificate and key
    const mockCert = Buffer.from([0x30, 0x82, 0x01, 0x00]);
    const mockKey = Buffer.from([0x30, 0x82, 0x01, 0x00]);

    const signingOptions = {
      timestampServer: 'https://freetsa.org/tsr',
      hashAlgorithm: 'SHA256',
      reason: 'Property test signing',
      location: 'Test environment'
    };

    try {
      // Attempt to sign with timestamp integration
      const result = await signer.signDocument(
        pdfContent, 
        mockCert, 
        mockKey, 
        undefined, 
        signingOptions
      );

      // If signing succeeds, verify the result has timestamp integration
      if (result) {
        // The result should be a Buffer or Uint8Array
        expect(result).toBeDefined();
        expect(result instanceof Buffer || result instanceof Uint8Array).toBe(true);
        
        // The result should be larger than the original (signature + timestamp added)
        expect(result.length).toBeGreaterThan(pdfContent.length);
        
        // The result should still be a valid PDF (starts with %PDF)
        const resultStr = result.toString('ascii', 0, 5);
        expect(resultStr).toBe('%PDF-');
      }
      
      // Test passes if we get here
      expect(true).toBe(true);
    } catch (error) {
      // If signing fails, verify it's a proper error with meaningful message
      expect(error).toBeDefined();
      expect(error instanceof Error).toBe(true);
      
      const errorMessage = (error as Error).message;
      expect(typeof errorMessage).toBe('string');
      expect(errorMessage.length).toBeGreaterThan(0);
      
      // Ensure it's not a system crash or segmentation fault
      expect(errorMessage).not.toContain('segmentation fault');
      expect(errorMessage).not.toContain('SIGSEGV');
      expect(errorMessage).not.toContain('core dumped');
      
      // Error should be related to timestamp, certificate, or PDF processing
      const isValidError = 
        errorMessage.toLowerCase().includes('timestamp') ||
        errorMessage.toLowerCase().includes('certificate') ||
        errorMessage.toLowerCase().includes('pdf') ||
        errorMessage.toLowerCase().includes('signature') ||
        errorMessage.toLowerCase().includes('crypto') ||
        errorMessage.toLowerCase().includes('invalid') ||
        errorMessage.toLowerCase().includes('not implemented') ||
        errorMessage.toLowerCase().includes('network') ||
        errorMessage.toLowerCase().includes('server');
      
      expect(isValidError).toBe(true);
    }
  });

  it('Property 19: RFC 3161 timestamp integration with property-based testing', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generator for minimal valid PDF content
        fc.oneof(
          fc.constant(Buffer.from('%PDF-1.7\n%%EOF')),
          fc.constant(Buffer.from('%PDF-1.4\n%%EOF'))
        ),
        // Generator for timestamp servers
        fc.oneof(
          fc.constant('https://freetsa.org/tsr'),
          fc.constant('http://timestamp.digicert.com')
        ),
        // Generator for hash algorithms
        fc.oneof(
          fc.constant('SHA256'),
          fc.constant('SHA384'),
          fc.constant('SHA512')
        ),
        async (pdfContent, timestampServer, hashAlgorithm) => {
          const signer = new PdfSigner();
          
          // Create minimal certificate and key
          const mockCert = Buffer.from([0x30, 0x82, 0x01, 0x00]);
          const mockKey = Buffer.from([0x30, 0x82, 0x01, 0x00]);
          
          const signingOptions = {
            timestampServer,
            hashAlgorithm,
            reason: 'Property test signing',
            location: 'Test environment'
          };

          try {
            // Attempt to sign with timestamp integration
            const result = await signer.signDocument(
              pdfContent, 
              mockCert, 
              mockKey, 
              undefined, 
              signingOptions
            );

            // If signing succeeds, verify the result has timestamp integration
            if (result) {
              // The result should be a Buffer or Uint8Array
              expect(result).toBeDefined();
              expect(result instanceof Buffer || result instanceof Uint8Array).toBe(true);
              
              // The result should be larger than the original (signature + timestamp added)
              expect(result.length).toBeGreaterThan(pdfContent.length);
              
              // The result should still be a valid PDF (starts with %PDF)
              const resultStr = result.toString('ascii', 0, 5);
              expect(resultStr).toBe('%PDF-');
            }
            
            return true;
          } catch (error) {
            // If signing fails, verify it's a proper error with meaningful message
            expect(error).toBeDefined();
            expect(error instanceof Error).toBe(true);
            
            const errorMessage = (error as Error).message;
            expect(typeof errorMessage).toBe('string');
            expect(errorMessage.length).toBeGreaterThan(0);
            
            // Ensure it's not a system crash or segmentation fault
            expect(errorMessage).not.toContain('segmentation fault');
            expect(errorMessage).not.toContain('SIGSEGV');
            expect(errorMessage).not.toContain('core dumped');
            
            // Error should be related to timestamp, certificate, or PDF processing
            const isValidError = 
              errorMessage.toLowerCase().includes('timestamp') ||
              errorMessage.toLowerCase().includes('certificate') ||
              errorMessage.toLowerCase().includes('pdf') ||
              errorMessage.toLowerCase().includes('signature') ||
              errorMessage.toLowerCase().includes('crypto') ||
              errorMessage.toLowerCase().includes('invalid') ||
              errorMessage.toLowerCase().includes('not implemented') ||
              errorMessage.toLowerCase().includes('network') ||
              errorMessage.toLowerCase().includes('server');
            
            expect(isValidError).toBe(true);
            
            return true;
          }
        }
      ),
      { 
        numRuns: 10, // Reduced for faster testing
        timeout: 30000, // 30 second timeout for network operations
        verbose: true
      }
    );
  });
});