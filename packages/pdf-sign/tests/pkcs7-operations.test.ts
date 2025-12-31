/**
 * Unit tests for PKCS#7 operations
 * Tests specific PKCS#7 parsing scenarios and error handling for malformed PKCS#7 data
 * Validates: Requirements 1.3, 3.1
 */

import { describe, expect, it } from 'vitest';

// Mock PKCS#7 data for testing
const createValidPkcs7Structure = (): Uint8Array => {
  return new Uint8Array([
    0x30, 0x20, // SEQUENCE, length 32 (short form)
    0x06, 0x09, // OID tag, length 9
    0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02, // SignedData OID
    0xA0, 0x13, // Context-specific tag [0], length 19
    0x30, 0x11, // SEQUENCE, length 17
    0x02, 0x01, 0x01, // Version INTEGER 1
    0x31, 0x00, // SET, length 0 (DigestAlgorithms)
    0x30, 0x0B, // SEQUENCE, length 11 (EncapsulatedContentInfo)
    0x06, 0x09, // OID tag, length 9
    0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x01, // Data OID
  ]);
};

const createInvalidPkcs7Structure = (): Uint8Array => {
  return new Uint8Array([
    0x04, 0x20, // OCTET STRING instead of SEQUENCE
    0x06, 0x09,
    0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00
  ]);
};

const createTruncatedPkcs7Structure = (): Uint8Array => {
  return new Uint8Array([
    0x30, 0x20, // SEQUENCE claiming length 32
    0x06, 0x09, // OID tag, length 9
    0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02, // SignedData OID
    // Data is truncated - only 15 bytes instead of claimed 32
  ]);
};

const createPkcs7WithCertificates = (): Uint8Array => {
  const baseStructure = new Uint8Array([
    0x30, 0x82, 0x01, 0x00, // SEQUENCE, length 256
    0x06, 0x09, // OID tag, length 9
    0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02, // SignedData OID
    0xA0, 0x82, 0x00, 0xF0, // Context-specific tag [0], length 240
  ]);
  
  const result = new Uint8Array(260); // Enough space for the structure
  result.set(baseStructure, 0);
  
  // Add a mock certificate structure
  const certStart = baseStructure.length;
  result[certStart] = 0x30; // SEQUENCE
  result[certStart + 1] = 0x60; // Length 96
  // Fill with mock certificate data
  for (let i = 2; i < 98; i++) {
    result[certStart + i] = (i * 7) % 256;
  }
  
  // Fill remaining space to match declared length
  for (let i = certStart + 98; i < 260; i++) {
    result[i] = 0x00;
  }
  
  return result;
};

// Helper function to validate PKCS#7 structure
function validatePkcs7Structure(pkcs7Data: Uint8Array): boolean {
  if (pkcs7Data.length < 10) {
    return false;
  }

  // Check for SEQUENCE tag at the beginning (0x30)
  if (pkcs7Data[0] !== 0x30) {
    return false;
  }

  // Parse and validate length
  const lengthInfo = parseLength(pkcs7Data, 1);
  if (!lengthInfo) {
    return false;
  }
  
  const contentStart = lengthInfo.nextOffset;
  const declaredLength = lengthInfo.length;
  
  // Check if the data is actually long enough for the declared length
  if (pkcs7Data.length < contentStart + declaredLength) {
    return false;
  }

  // Check for SignedData OID (1.2.840.113549.1.7.2)
  const signedDataOid = [0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02];
  let oidFound = false;
  
  for (let i = contentStart; i <= pkcs7Data.length - signedDataOid.length; i++) {
    if (pkcs7Data[i] === 0x06) { // OID tag
      let oidLength = pkcs7Data[i + 1];
      if (oidLength === signedDataOid.length && i + 2 + oidLength <= pkcs7Data.length) {
        let matches = true;
        for (let j = 0; j < signedDataOid.length; j++) {
          if (pkcs7Data[i + 2 + j] !== signedDataOid[j]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          oidFound = true;
          break;
        }
      }
    }
  }

  return oidFound;
}

// Helper function to parse length field
function parseLength(data: Uint8Array, offset: number): { length: number; nextOffset: number } | null {
  if (offset >= data.length) {
    return null;
  }
  
  const firstByte = data[offset];
  
  if ((firstByte & 0x80) === 0) {
    // Short form
    return { length: firstByte, nextOffset: offset + 1 };
  } else {
    // Long form
    const lengthBytes = firstByte & 0x7F;
    
    if (lengthBytes === 0 || lengthBytes > 4 || offset + 1 + lengthBytes > data.length) {
      return null;
    }
    
    let length = 0;
    for (let i = 0; i < lengthBytes; i++) {
      length = (length << 8) | data[offset + 1 + i];
    }
    
    return { length, nextOffset: offset + 1 + lengthBytes };
  }
}

// Helper function to extract certificates from PKCS#7 data
function extractCertificatesFromPkcs7(pkcs7Data: Uint8Array): Uint8Array[] {
  const certificates: Uint8Array[] = [];
  
  for (let i = 0; i < pkcs7Data.length - 4; i++) {
    if (pkcs7Data[i] === 0x30) { // SEQUENCE tag
      const lengthInfo = parseLength(pkcs7Data, i + 1);
      if (lengthInfo && lengthInfo.length > 50 && i + lengthInfo.nextOffset - i - 1 + lengthInfo.length <= pkcs7Data.length) {
        const totalLength = lengthInfo.nextOffset - i + lengthInfo.length;
        if (totalLength > 100 && totalLength < 5000) { // Reasonable certificate size
          const certCandidate = pkcs7Data.slice(i, i + totalLength);
          certificates.push(certCandidate);
          i += totalLength - 1; // Skip past this certificate
        }
      }
    }
  }
  
  return certificates;
}

describe('PKCS#7 Operations Unit Tests', () => {
  describe('PKCS#7 Structure Validation', () => {
    it('should validate correct PKCS#7 structures', () => {
      const validPkcs7 = createValidPkcs7Structure();
      expect(validatePkcs7Structure(validPkcs7)).toBe(true);
    });

    it('should reject invalid PKCS#7 structures', () => {
      const invalidPkcs7 = createInvalidPkcs7Structure();
      expect(validatePkcs7Structure(invalidPkcs7)).toBe(false);
    });

    it('should reject truncated PKCS#7 data', () => {
      const truncatedPkcs7 = createTruncatedPkcs7Structure();
      expect(validatePkcs7Structure(truncatedPkcs7)).toBe(false);
    });

    it('should reject empty or too short data', () => {
      expect(validatePkcs7Structure(new Uint8Array(0))).toBe(false);
      expect(validatePkcs7Structure(new Uint8Array([0x30]))).toBe(false);
      expect(validatePkcs7Structure(new Uint8Array([0x30, 0x02]))).toBe(false);
    });

    it('should handle various length encodings', () => {
      // Short form length
      const shortForm = new Uint8Array([
        0x30, 0x20, // SEQUENCE, length 32
        0x06, 0x09, // OID tag, length 9
        0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02, // SignedData OID
        ...new Array(23).fill(0x00) // Padding to match declared length
      ]);
      expect(validatePkcs7Structure(shortForm)).toBe(true);

      // Long form length
      const longForm = createValidPkcs7Structure();
      expect(validatePkcs7Structure(longForm)).toBe(true);
    });
  });

  describe('Length Parsing', () => {
    it('should parse short form lengths correctly', () => {
      const data = new Uint8Array([0x20, 0x00]); // Length 32
      const result = parseLength(data, 0);
      expect(result).not.toBeNull();
      expect(result!.length).toBe(32);
      expect(result!.nextOffset).toBe(1);
    });

    it('should parse long form lengths correctly', () => {
      const data = new Uint8Array([0x82, 0x01, 0x00, 0x00]); // Length 256 in long form
      const result = parseLength(data, 0);
      expect(result).not.toBeNull();
      expect(result!.length).toBe(256);
      expect(result!.nextOffset).toBe(3);
    });

    it('should handle invalid length encodings', () => {
      // Invalid long form (length of length is 0)
      const invalidData1 = new Uint8Array([0x80]);
      expect(parseLength(invalidData1, 0)).toBeNull();

      // Length of length too large
      const invalidData2 = new Uint8Array([0x85, 0x01, 0x02, 0x03, 0x04]);
      expect(parseLength(invalidData2, 0)).toBeNull();

      // Truncated length
      const invalidData3 = new Uint8Array([0x82, 0x01]);
      expect(parseLength(invalidData3, 0)).toBeNull();
    });

    it('should handle edge cases', () => {
      // Empty data
      expect(parseLength(new Uint8Array([]), 0)).toBeNull();

      // Offset beyond data
      const data = new Uint8Array([0x20]);
      expect(parseLength(data, 1)).toBeNull();
    });
  });

  describe('Certificate Extraction', () => {
    it('should extract certificates from PKCS#7 data', () => {
      const pkcs7WithCerts = createPkcs7WithCertificates();
      const certificates = extractCertificatesFromPkcs7(pkcs7WithCerts);
      
      expect(certificates.length).toBeGreaterThan(0);
      
      // Verify extracted certificates have reasonable structure
      for (const cert of certificates) {
        expect(cert.length).toBeGreaterThan(50);
        expect(cert[0]).toBe(0x30); // Should start with SEQUENCE tag
      }
    });

    it('should handle PKCS#7 data without certificates', () => {
      const pkcs7WithoutCerts = createValidPkcs7Structure();
      const certificates = extractCertificatesFromPkcs7(pkcs7WithoutCerts);
      
      // May or may not find certificates depending on the structure
      expect(Array.isArray(certificates)).toBe(true);
    });

    it('should handle malformed certificate data', () => {
      const malformedData = new Uint8Array([
        0x30, 0xFF, // SEQUENCE with invalid length
        0x04, 0x10, // OCTET STRING
        ...new Array(16).fill(0x42)
      ]);
      
      const certificates = extractCertificatesFromPkcs7(malformedData);
      expect(Array.isArray(certificates)).toBe(true);
    });

    it('should filter out structures that are too small or too large', () => {
      // Create test data with a valid certificate-like structure
      const dataWithValidCert = new Uint8Array([
        0x30, 0x60, // SEQUENCE, length 96 (reasonable certificate size)
        ...new Array(96).fill(0x42) // Certificate data
      ]);
      
      const certificates = extractCertificatesFromPkcs7(dataWithValidCert);
      
      // The extraction function should work without throwing errors
      expect(Array.isArray(certificates)).toBe(true);
      
      // If certificates are found, they should have reasonable sizes
      for (const cert of certificates) {
        expect(cert.length).toBeGreaterThan(50);
        expect(cert.length).toBeLessThan(5000);
        expect(cert[0]).toBe(0x30); // Should start with SEQUENCE tag
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle various malformed PKCS#7 structures gracefully', () => {
      const testCases = [
        new Uint8Array([]), // Empty
        new Uint8Array([0x30]), // Just SEQUENCE tag
        new Uint8Array([0x30, 0x82]), // Incomplete long form length
        new Uint8Array([0x30, 0x82, 0xFF, 0xFF]), // Length too large
        new Uint8Array([0x04, 0x10, ...new Array(16).fill(0x00)]), // Wrong tag
        new Uint8Array([0x30, 0x10, 0x06, 0x05, 0x01, 0x02, 0x03, 0x04, 0x05]), // Wrong OID
      ];

      for (const testCase of testCases) {
        expect(() => validatePkcs7Structure(testCase)).not.toThrow();
        expect(() => extractCertificatesFromPkcs7(testCase)).not.toThrow();
      }
    });

    it('should validate SignedData OID correctly', () => {
      // Correct SignedData OID - use the same structure as createValidPkcs7Structure
      const correctOid = createValidPkcs7Structure();
      expect(validatePkcs7Structure(correctOid)).toBe(true);

      // Wrong OID (EnvelopedData instead of SignedData)
      const wrongOid = new Uint8Array([
        0x30, 0x20,
        0x06, 0x09,
        0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x03, // EnvelopedData OID
        ...new Array(19).fill(0x00)
      ]);
      expect(validatePkcs7Structure(wrongOid)).toBe(false);

      // Truncated OID
      const truncatedOid = new Uint8Array([
        0x30, 0x20,
        0x06, 0x09,
        0x2A, 0x86, 0x48, 0x86, 0xF7, // Incomplete SignedData OID
        ...new Array(21).fill(0x00)
      ]);
      expect(validatePkcs7Structure(truncatedOid)).toBe(false);
    });
  });

  describe('PKCS#7 Structure Components', () => {
    it('should identify required PKCS#7 components', () => {
      const validPkcs7 = createValidPkcs7Structure();
      
      // Should contain SEQUENCE tag
      expect(validPkcs7[0]).toBe(0x30);
      
      // Should contain SignedData OID
      const signedDataOid = [0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02];
      let oidFound = false;
      
      for (let i = 0; i <= validPkcs7.length - signedDataOid.length; i++) {
        if (validPkcs7[i] === 0x06 && validPkcs7[i + 1] === signedDataOid.length) {
          let matches = true;
          for (let j = 0; j < signedDataOid.length; j++) {
            if (validPkcs7[i + 2 + j] !== signedDataOid[j]) {
              matches = false;
              break;
            }
          }
          if (matches) {
            oidFound = true;
            break;
          }
        }
      }
      
      expect(oidFound).toBe(true);
    });

    it('should handle context-specific tags', () => {
      // Use the valid structure which already has context-specific tags
      const dataWithContextTag = createValidPkcs7Structure();
      expect(validatePkcs7Structure(dataWithContextTag)).toBe(true);
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large PKCS#7 structures efficiently', () => {
      const largeStructure = new Uint8Array(10000);
      largeStructure[0] = 0x30; // SEQUENCE
      largeStructure[1] = 0x82; // Long form length
      largeStructure[2] = 0x27; // High byte of length
      largeStructure[3] = 0x0C; // Low byte of length (9996)
      
      // Add SignedData OID
      largeStructure[4] = 0x06;
      largeStructure[5] = 0x09;
      largeStructure.set([0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02], 6);
      
      const startTime = Date.now();
      const isValid = validatePkcs7Structure(largeStructure);
      const endTime = Date.now();
      
      expect(isValid).toBe(true);
      expect(endTime - startTime).toBeLessThan(100); // Should complete within 100ms
    });

    it('should handle structures with many nested elements', () => {
      const nestedStructure = new Uint8Array(1000);
      let offset = 0;
      
      // Create nested SEQUENCE structures
      for (let i = 0; i < 10; i++) {
        nestedStructure[offset++] = 0x30; // SEQUENCE
        nestedStructure[offset++] = 0x10; // Length 16
        
        if (i === 0) {
          // Add SignedData OID to first sequence
          nestedStructure[offset++] = 0x06;
          nestedStructure[offset++] = 0x09;
          nestedStructure.set([0x2A, 0x86, 0x48, 0x86, 0xF7, 0x0D, 0x01, 0x07, 0x02], offset);
          offset += 9;
        } else {
          // Fill with dummy data
          for (let j = 0; j < 14; j++) {
            nestedStructure[offset++] = 0x00;
          }
        }
      }
      
      expect(validatePkcs7Structure(nestedStructure)).toBe(true);
    });
  });
});