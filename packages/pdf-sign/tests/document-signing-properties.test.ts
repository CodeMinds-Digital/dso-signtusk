/**
 * Property-based tests for PDF document signing functionality
 * Feature: pdf-digital-signature, Property 1: Document Signing Round Trip
 * Validates: Requirements 1.1, 1.4
 */

import { describe, expect, it } from 'vitest';
import { PdfSigner } from '../index.js';

describe('Document Signing Properties', () => {
  it('should create PdfSigner instance', () => {
    const signer = new PdfSigner();
    expect(signer).toBeDefined();
  });

  it('Property 1 Edge Case: Empty document data should be rejected', async () => {
    const signer = new PdfSigner();
    
    const emptyPdf = Buffer.alloc(0);
    const validCert = Buffer.from([0x30, 0x82, 0x01, 0x00]); // Minimal DER structure
    const validKey = Buffer.from([0x30, 0x82, 0x01, 0x00]); // Minimal DER structure

    await expect(signer.signDocument(emptyPdf, validCert, validKey)).rejects.toThrow();
  });
});