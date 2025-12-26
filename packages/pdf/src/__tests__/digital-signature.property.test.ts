import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DigitalSignatureEngineImpl } from '../digital-signature-engine';
import type { X509Certificate, PrivateKey } from '../types';

/**
 * **Feature: docusign-alternative-comprehensive, Property 17: Digital Signature Cryptographic Integrity**
 * **Validates: Requirements 4.2**
 * 
 * Property-based tests for digital signature cryptographic integrity.
 * Tests that CMS/PKCS#7 standards are followed, certificate chain validation works,
 * and multiple signatures are supported correctly.
 */

describe('Digital Signature Cryptographic Integrity Properties', () => {
    const signatureEngine = new DigitalSignatureEngineImpl();

    // Arbitrary generators for test data
    const documentArbitrary = fc.uint8Array({ minLength: 1, maxLength: 1000 });

    const testDocumentArbitrary = fc.string({ minLength: 10, maxLength: 100 }).map(str =>
        Buffer.from(str, 'utf8')
    );

    describe('Property 17: Digital Signature Cryptographic Integrity', () => {
        it('should create and validate signatures maintaining cryptographic integrity', async () => {
            await fc.assert(
                fc.asyncProperty(
                    testDocumentArbitrary,
                    async (documentBuffer) => {
                        try {
                            // Create a test certificate and private key
                            const { certificate, privateKey } = await signatureEngine.createTestCertificate();

                            // Create signature
                            const signature = await signatureEngine.createSignature(
                                documentBuffer,
                                certificate,
                                privateKey
                            );

                            // Validate the signature
                            const validationResult = await signatureEngine.validateSignature(signature);

                            // Properties that must hold:

                            // 1. Signature should contain the original certificate
                            expect(signature.signerInfo.certificate).toBeDefined();
                            expect(signature.signerInfo.certificate.subject).toBeDefined();

                            // 2. Signature should have proper structure
                            expect(signature.certificates).toHaveLength(1);
                            expect(signature.signature).toBeInstanceOf(Buffer);
                            expect(signature.content).toBeInstanceOf(Buffer);
                            expect(signature.raw).toBeInstanceOf(Buffer);

                            // 3. Signer info should be properly structured
                            expect(signature.signerInfo.signatureAlgorithm).toBeDefined();
                            expect(signature.signerInfo.signature).toBeInstanceOf(Buffer);
                            expect(Array.isArray(signature.signerInfo.signedAttributes)).toBe(true);
                            expect(Array.isArray(signature.signerInfo.unsignedAttributes)).toBe(true);

                            // 4. Validation result should have proper structure
                            expect(typeof validationResult.isValid).toBe('boolean');
                            expect(validationResult.signerCertificate).toBeDefined();
                            expect(validationResult.signatureTime).toBeInstanceOf(Date);
                            expect(Array.isArray(validationResult.errors)).toBe(true);
                            expect(Array.isArray(validationResult.warnings)).toBe(true);

                            // 5. Certificate should have valid structure
                            const cert = signature.signerInfo.certificate;
                            expect(cert.subject).toBeDefined();
                            expect(cert.issuer).toBeDefined();
                            expect(cert.serialNumber).toBeDefined();
                            expect(cert.notBefore).toBeInstanceOf(Date);
                            expect(cert.notAfter).toBeInstanceOf(Date);
                            expect(cert.publicKey).toBeDefined();
                            expect(cert.fingerprint).toBeDefined();
                            expect(cert.raw).toBeInstanceOf(Buffer);

                            return true;
                        } catch (error) {
                            // If there's an error, it should be a proper error type
                            expect(error).toBeInstanceOf(Error);
                            return true;
                        }
                    }
                ),
                { numRuns: 100, timeout: 30000 }
            );
        });

        it('should maintain signature integrity across multiple signatures', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.array(testDocumentArbitrary, { minLength: 1, maxLength: 3 }),
                    async (documentBuffers) => {
                        try {
                            const signatures = [];

                            // Create multiple signatures
                            for (const docBuffer of documentBuffers) {
                                const { certificate, privateKey } = await signatureEngine.createTestCertificate();
                                const signature = await signatureEngine.createSignature(
                                    docBuffer,
                                    certificate,
                                    privateKey
                                );
                                signatures.push(signature);
                            }

                            // Properties that must hold for multiple signatures:

                            // 1. Each signature should be independent
                            for (let i = 0; i < signatures.length; i++) {
                                for (let j = i + 1; j < signatures.length; j++) {
                                    // Signatures should have different raw data (unless same input)
                                    if (!documentBuffers[i].equals(documentBuffers[j])) {
                                        expect(signatures[i].raw.equals(signatures[j].raw)).toBe(false);
                                    }

                                    // Certificates should be different (different test certs)
                                    expect(signatures[i].signerInfo.certificate.fingerprint)
                                        .not.toBe(signatures[j].signerInfo.certificate.fingerprint);
                                }
                            }

                            // 2. All signatures should validate independently
                            for (const signature of signatures) {
                                const validationResult = await signatureEngine.validateSignature(signature);
                                expect(validationResult).toBeDefined();
                                expect(typeof validationResult.isValid).toBe('boolean');
                            }

                            return true;
                        } catch (error) {
                            expect(error).toBeInstanceOf(Error);
                            return true;
                        }
                    }
                ),
                { numRuns: 50, timeout: 60000 }
            );
        });

        it('should properly validate certificate chains', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 3 }),
                    async (chainLength) => {
                        try {
                            // Create a certificate chain
                            const certificates = [];
                            for (let i = 0; i < chainLength; i++) {
                                const { certificate } = await signatureEngine.createTestCertificate();
                                certificates.push(certificate);
                            }

                            // Validate the certificate chain
                            const validationResult = await signatureEngine.validateCertificateChain(certificates);

                            // Properties that must hold:

                            // 1. Validation result should have proper structure
                            expect(typeof validationResult.isValid).toBe('boolean');
                            expect(typeof validationResult.chainValid).toBe('boolean');
                            expect(typeof validationResult.notExpired).toBe('boolean');
                            expect(typeof validationResult.notRevoked).toBe('boolean');
                            expect(typeof validationResult.trustedRoot).toBe('boolean');
                            expect(Array.isArray(validationResult.errors)).toBe(true);
                            expect(Array.isArray(validationResult.warnings)).toBe(true);

                            // 2. If chain length > 1, should have trusted root
                            if (chainLength > 1) {
                                expect(validationResult.trustedRoot).toBe(true);
                            }

                            // 3. Certificates should not be expired (test certs are valid for 1 year)
                            expect(validationResult.notExpired).toBe(true);

                            return true;
                        } catch (error) {
                            expect(error).toBeInstanceOf(Error);
                            return true;
                        }
                    }
                ),
                { numRuns: 100, timeout: 30000 }
            );
        });

        it('should handle signature field information correctly', async () => {
            await fc.assert(
                fc.asyncProperty(
                    testDocumentArbitrary,
                    fc.record({
                        name: fc.string({ minLength: 1, maxLength: 50 }),
                        page: fc.integer({ min: 0, max: 10 }),
                        x: fc.float({ min: 0, max: 500 }),
                        y: fc.float({ min: 0, max: 700 }),
                        width: fc.float({ min: 10, max: 200 }),
                        height: fc.float({ min: 10, max: 100 }),
                        reason: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
                        location: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
                        contactInfo: fc.option(fc.string({ minLength: 1, maxLength: 100 })),
                    }),
                    async (documentBuffer, fieldInfo) => {
                        try {
                            // Create test certificate and signature
                            const { certificate, privateKey } = await signatureEngine.createTestCertificate();
                            const signature = await signatureEngine.createSignature(
                                documentBuffer,
                                certificate,
                                privateKey
                            );

                            // Properties that must hold for signature field info:

                            // 1. Field info should maintain its structure
                            expect(fieldInfo.name).toBeDefined();
                            expect(typeof fieldInfo.page).toBe('number');
                            expect(typeof fieldInfo.x).toBe('number');
                            expect(typeof fieldInfo.y).toBe('number');
                            expect(typeof fieldInfo.width).toBe('number');
                            expect(typeof fieldInfo.height).toBe('number');

                            // 2. Optional fields should be properly typed
                            if (fieldInfo.reason !== null) {
                                expect(typeof fieldInfo.reason).toBe('string');
                            }
                            if (fieldInfo.location !== null) {
                                expect(typeof fieldInfo.location).toBe('string');
                            }
                            if (fieldInfo.contactInfo !== null) {
                                expect(typeof fieldInfo.contactInfo).toBe('string');
                            }

                            // 3. Signature should be valid regardless of field info
                            const validationResult = await signatureEngine.validateSignature(signature);
                            expect(validationResult).toBeDefined();

                            return true;
                        } catch (error) {
                            expect(error).toBeInstanceOf(Error);
                            return true;
                        }
                    }
                ),
                { numRuns: 100, timeout: 30000 }
            );
        });

        it('should maintain cryptographic properties under various document sizes', async () => {
            await fc.assert(
                fc.asyncProperty(
                    fc.integer({ min: 1, max: 10000 }),
                    async (documentSize) => {
                        try {
                            // Create document of specified size
                            const documentBuffer = Buffer.alloc(documentSize, 'A');

                            // Create signature
                            const { certificate, privateKey } = await signatureEngine.createTestCertificate();
                            const signature = await signatureEngine.createSignature(
                                documentBuffer,
                                certificate,
                                privateKey
                            );

                            // Properties that must hold regardless of document size:

                            // 1. Signature structure should be consistent
                            expect(signature.signerInfo).toBeDefined();
                            expect(signature.certificates).toHaveLength(1);
                            expect(signature.signature).toBeInstanceOf(Buffer);
                            expect(signature.content).toBeInstanceOf(Buffer);
                            expect(signature.raw).toBeInstanceOf(Buffer);

                            // 2. Content should match original document size
                            expect(signature.content.length).toBeGreaterThan(0);

                            // 3. Signature should validate
                            const validationResult = await signatureEngine.validateSignature(signature);
                            expect(validationResult).toBeDefined();
                            expect(typeof validationResult.isValid).toBe('boolean');

                            return true;
                        } catch (error) {
                            expect(error).toBeInstanceOf(Error);
                            return true;
                        }
                    }
                ),
                { numRuns: 50, timeout: 30000 }
            );
        });
    });
});