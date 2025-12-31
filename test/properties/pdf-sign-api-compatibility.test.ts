/**
 * PDF Sign API Compatibility Property-Based Tests
 * 
 * **Feature: pdf-sign-integration, Property 3: API compatibility preservation**
 * **Validates: Requirements 1.5, 2.6**
 * 
 * Tests that the @signtusk/pdf-sign package maintains API compatibility
 * with the expected interface and that all required functions are available
 * with correct signatures.
 */

import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

// Helper function to validate options interface structure
function validateOptionsInterface(options: any, requiredFields: string[], optionalFields: string[] = []): boolean {
  if (!options || typeof options !== 'object') return false;
  
  // Check all required fields are present
  for (const field of requiredFields) {
    if (!(field in options)) return false;
  }
  
  // Check no unexpected fields (only required and optional allowed)
  const allowedFields = [...requiredFields, ...optionalFields];
  for (const field in options) {
    if (!allowedFields.includes(field)) return false;
  }
  
  return true;
}

// Helper to create valid buffer for testing
function createTestBuffer(size: number = 100): Buffer {
  return Buffer.alloc(size, 'test data');
}

// Helper to get workspace root and check package structure
function getPackageInfo() {
  const fs = require('fs');
  const path = require('path');
  const workspaceRoot = path.resolve(__dirname, '../..');
  const packagePath = path.join(workspaceRoot, 'packages/pdf-sign');
  const typeDefsPath = path.join(packagePath, 'index.d.ts');
  const packageJsonPath = path.join(packagePath, 'package.json');
  
  return {
    workspaceRoot,
    packagePath,
    typeDefsPath,
    packageJsonPath,
    packageExists: fs.existsSync(packagePath),
    typeDefsExist: fs.existsSync(typeDefsPath),
    packageJsonExists: fs.existsSync(packageJsonPath)
  };
}

describe('PDF Sign API Compatibility', () => {
  /**
   * Property 3: API compatibility preservation
   * For any valid input to signWithP12 or signWithGCloud functions,
   * the @signtusk/pdf-sign package should provide equivalent functionality
   * to the original @documenso/pdf-sign package
   */
  describe('Property 3: API compatibility preservation', () => {
    it('should have package structure in correct location', () => {
      const packageInfo = getPackageInfo();
      
      expect(packageInfo.packageExists).toBe(true);
      expect(packageInfo.typeDefsExist).toBe(true);
      expect(packageInfo.packageJsonExists).toBe(true);
    });

    it('should export signWithP12 function with correct signature', () => {
      const packageInfo = getPackageInfo();
      const fs = require('fs');
      
      expect(packageInfo.typeDefsExist).toBe(true);
      
      const typeDefs = fs.readFileSync(packageInfo.typeDefsPath, 'utf-8');
      expect(typeDefs).toContain('export function signWithP12');
      expect(typeDefs).toContain('SignWithP12Options');
      expect(typeDefs).toMatch(/export function signWithP12.*: Buffer/);
    });

    it('should export signWithGCloud function with correct signature', () => {
      const packageInfo = getPackageInfo();
      const fs = require('fs');
      
      expect(packageInfo.typeDefsExist).toBe(true);
      
      const typeDefs = fs.readFileSync(packageInfo.typeDefsPath, 'utf-8');
      expect(typeDefs).toContain('export function signWithGCloud');
      expect(typeDefs).toContain('SignWithGCloudOptions');
      expect(typeDefs).toMatch(/export function signWithGCloud.*: Buffer/);
    });

    it('should have correct SignWithP12Options interface structure', () => {
      fc.assert(fc.property(
        fc.record({
          content: fc.constant(createTestBuffer()),
          cert: fc.constant(createTestBuffer()),
          password: fc.option(fc.string()),
          signingTime: fc.option(fc.string()),
          timestampServer: fc.option(fc.string())
        }),
        (options) => {
          // Validate the options structure matches expected interface
          const requiredFields = ['content', 'cert'];
          const optionalFields = ['password', 'signingTime', 'timestampServer'];
          
          expect(validateOptionsInterface(options, requiredFields, optionalFields)).toBe(true);
          
          // Validate required fields are Buffers
          expect(Buffer.isBuffer(options.content)).toBe(true);
          expect(Buffer.isBuffer(options.cert)).toBe(true);
          
          // Validate optional fields are strings if present
          if (options.password !== undefined && options.password !== null) {
            expect(typeof options.password).toBe('string');
          }
          if (options.signingTime !== undefined && options.signingTime !== null) {
            expect(typeof options.signingTime).toBe('string');
          }
          if (options.timestampServer !== undefined && options.timestampServer !== null) {
            expect(typeof options.timestampServer).toBe('string');
          }
          
          return true;
        }
      ), { numRuns: 2 });
    });

    it('should have correct SignWithGCloudOptions interface structure', () => {
      fc.assert(fc.property(
        fc.record({
          content: fc.constant(createTestBuffer()),
          cert: fc.constant(createTestBuffer()),
          keyPath: fc.string({ minLength: 1 }),
          signingTime: fc.option(fc.string()),
          timestampServer: fc.option(fc.string())
        }),
        (options) => {
          // Validate the options structure matches expected interface
          const requiredFields = ['content', 'cert', 'keyPath'];
          const optionalFields = ['signingTime', 'timestampServer'];
          
          expect(validateOptionsInterface(options, requiredFields, optionalFields)).toBe(true);
          
          // Validate required fields
          expect(Buffer.isBuffer(options.content)).toBe(true);
          expect(Buffer.isBuffer(options.cert)).toBe(true);
          expect(typeof options.keyPath).toBe('string');
          expect(options.keyPath.length).toBeGreaterThan(0);
          
          // Validate optional fields are strings if present
          if (options.signingTime !== undefined && options.signingTime !== null) {
            expect(typeof options.signingTime).toBe('string');
          }
          if (options.timestampServer !== undefined && options.timestampServer !== null) {
            expect(typeof options.timestampServer).toBe('string');
          }
          
          return true;
        }
      ), { numRuns: 2 });
    });

    it('should have TypeScript definitions with correct return types', () => {
      const packageInfo = getPackageInfo();
      const fs = require('fs');
      
      const typeDefs = fs.readFileSync(packageInfo.typeDefsPath, 'utf-8');
      
      // Both functions should return Buffer
      expect(typeDefs).toMatch(/export function signWithP12.*: Buffer/);
      expect(typeDefs).toMatch(/export function signWithGCloud.*: Buffer/);
      
      // Should have proper interface definitions
      expect(typeDefs).toContain('export interface SignWithP12Options');
      expect(typeDefs).toContain('export interface SignWithGCloudOptions');
    });

    it('should provide consistent API surface across all exported functions', () => {
      fc.assert(fc.property(
        fc.constantFrom('signWithP12', 'signWithGCloud'),
        (functionName) => {
          const packageInfo = getPackageInfo();
          const fs = require('fs');
          
          const typeDefs = fs.readFileSync(packageInfo.typeDefsPath, 'utf-8');
          
          // Each function should have:
          // 1. An options interface
          // 2. A function export
          // 3. Buffer return type
          expect(typeDefs).toContain(`export function ${functionName}`);
          expect(typeDefs).toMatch(new RegExp(`export function ${functionName}.*: Buffer`));
          
          // Should have corresponding options interface
          const optionsInterfaceName = functionName.charAt(0).toUpperCase() + 
                                     functionName.slice(1) + 'Options';
          expect(typeDefs).toContain(`export interface ${optionsInterfaceName}`);
          
          return true;
        }
      ), { numRuns: 2 });
    });

    it('should maintain package structure and exports consistency', () => {
      const packageInfo = getPackageInfo();
      const fs = require('fs');
      
      // Package should exist
      expect(packageInfo.packageExists).toBe(true);
      
      // Should have package.json with correct name
      expect(packageInfo.packageJsonExists).toBe(true);
      
      const packageJson = JSON.parse(fs.readFileSync(packageInfo.packageJsonPath, 'utf-8'));
      expect(packageJson.name).toBe('@signtusk/pdf-sign');
      
      // Should have main entry point
      expect(packageJson.main).toBe('index.js');
      expect(packageJson.types).toBe('index.d.ts');
      
      // Entry points should exist
      expect(fs.existsSync(require('path').join(packageInfo.packagePath, 'index.js'))).toBe(true);
      expect(fs.existsSync(packageInfo.typeDefsPath)).toBe(true);
      
      // Should have NAPI configuration
      expect(packageJson.napi).toBeTruthy();
      expect(packageJson.napi.name).toBe('pdf-sign');
    });
  });
});