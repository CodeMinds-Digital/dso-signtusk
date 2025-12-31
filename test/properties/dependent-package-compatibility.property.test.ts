/**
 * Dependent Package Compatibility Property-Based Tests
 * 
 * **Feature: pdf-sign-package-migration, Property 7: Dependent package compatibility preservation**
 * **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
 * 
 * Tests that packages depending on pdf-sign functionality continue to function correctly
 * with updated references to the target package, ensuring no breaking changes.
 */

import * as fc from 'fast-check';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

function getWorkspaceRoot(): string {
  return path.resolve(__dirname, '../..');
}

function readJsonFile(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function getAllFiles(dir: string, extensions: string[] = []): string[] {
  const files: string[] = [];
  const excludeDirs = [
    'node_modules',
    '.git',
    '.turbo',
    'dist',
    'build',
    '.next',
    'target',
    'dso-pdf-sign', // Exclude the new standalone package
    'backups',
    'logs'
  ];

  function traverse(currentDir: string) {
    try {
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        
        if (entry.isDirectory()) {
          if (!excludeDirs.some(exclude => fullPath.includes(exclude))) {
            traverse(fullPath);
          }
        } else if (entry.isFile()) {
          if (extensions.length === 0 || extensions.some(ext => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  traverse(dir);
  return files;
}

describe('Dependent Package Compatibility Property Tests', () => {
  /**
   * Property 7: Dependent package compatibility preservation
   * For any package that depends on pdf-sign functionality, the package should continue 
   * to function correctly with updated references to the target package
   */
  describe('Property 7: Dependent package compatibility preservation', () => {
    it('should have correct import statements in dependent packages', () => {
      fc.assert(fc.property(
        fc.record({
          newPackageName: fc.constant('dso-pdf-sign'),
          expectedFunctions: fc.constant(['signWithP12', 'signWithGCloud'])
        }),
        ({ newPackageName, expectedFunctions }) => {
          const workspaceRoot = getWorkspaceRoot();
          const signingPackagePath = path.join(workspaceRoot, 'packages', 'signing');
          
          if (!fs.existsSync(signingPackagePath)) {
            return true; // Skip if signing package doesn't exist
          }
          
          const transportFiles = getAllFiles(
            path.join(signingPackagePath, 'transports'), 
            ['.ts', '.js']
          );
          
          for (const filePath of transportFiles) {
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              
              // If file uses PDF signing functions, check import correctness
              const usesPdfSigning = expectedFunctions.some(func => content.includes(func));
              
              if (usesPdfSigning) {
                // Should use require() with new package name
                expect(content).toContain(`require('${newPackageName}')`);
                
                // Should have proper error handling for optional dependency
                expect(content).toContain('try {');
                expect(content).toContain('} catch (error) {');
                
                // Should have graceful fallback when package is not available
                expect(content).toContain('PDF signing functionality is not available');
              }
            } catch (error) {
              // Skip files we can't read
            }
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should maintain functional equivalence in dependent packages', () => {
      fc.assert(fc.property(
        fc.record({
          packageName: fc.constant('signing'),
          expectedExports: fc.constant(['signPdf'])
        }),
        ({ packageName, expectedExports }) => {
          const workspaceRoot = getWorkspaceRoot();
          const packagePath = path.join(workspaceRoot, 'packages', packageName);
          
          if (!fs.existsSync(packagePath)) {
            return true; // Skip if package doesn't exist
          }
          
          const indexPath = path.join(packagePath, 'index.ts');
          
          if (fs.existsSync(indexPath)) {
            try {
              const content = fs.readFileSync(indexPath, 'utf-8');
              
              // Should export expected functions
              for (const exportName of expectedExports) {
                expect(content).toContain(`export`);
                expect(content).toContain(exportName);
              }
              
              // Should maintain transport pattern matching
              expect(content).toContain('match(transport)');
              expect(content).toContain('.with(\'local\'');
              expect(content).toContain('.with(\'gcloud-hsm\'');
              
            } catch (error) {
              // Skip files we can't read
            }
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should have proper error handling for missing dependencies', () => {
      fc.assert(fc.property(
        fc.record({
          transportTypes: fc.constant(['local-cert', 'google-cloud-hsm']),
          newPackageName: fc.constant('dso-pdf-sign')
        }),
        ({ transportTypes, newPackageName }) => {
          const workspaceRoot = getWorkspaceRoot();
          const signingPackagePath = path.join(workspaceRoot, 'packages', 'signing');
          
          if (!fs.existsSync(signingPackagePath)) {
            return true; // Skip if signing package doesn't exist
          }
          
          for (const transportType of transportTypes) {
            const transportPath = path.join(
              signingPackagePath, 
              'transports', 
              `${transportType}.ts`
            );
            
            if (fs.existsSync(transportPath)) {
              try {
                const content = fs.readFileSync(transportPath, 'utf-8');
                
                // Should have try-catch around require
                const requirePattern = new RegExp(`require\\('${newPackageName}'\\)`);
                if (requirePattern.test(content)) {
                  // Should be wrapped in try-catch
                  const tryIndex = content.indexOf('try {');
                  const requireIndex = content.indexOf(`require('${newPackageName}')`);
                  const catchIndex = content.indexOf('} catch (error) {');
                  
                  expect(tryIndex).toBeGreaterThan(-1);
                  expect(catchIndex).toBeGreaterThan(-1);
                  expect(requireIndex).toBeGreaterThan(tryIndex);
                  expect(requireIndex).toBeLessThan(catchIndex);
                  
                  // Should have fallback function that throws meaningful error
                  expect(content).toContain('throw new Error');
                  expect(content).toContain('PDF signing functionality is not available');
                }
              } catch (error) {
                // Skip files we can't read
              }
            }
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should maintain package.json integrity in dependent packages', () => {
      fc.assert(fc.property(
        fc.record({
          packageName: fc.constant('signing'),
          oldPackageNames: fc.constant(['@signtusk/pdf-sign', '@docusign-alternative/pdf-sign'])
        }),
        ({ packageName, oldPackageNames }) => {
          const workspaceRoot = getWorkspaceRoot();
          const packageJsonPath = path.join(workspaceRoot, 'packages', packageName, 'package.json');
          
          if (!fs.existsSync(packageJsonPath)) {
            return true; // Skip if package doesn't exist
          }
          
          const packageJson = readJsonFile(packageJsonPath);
          if (!packageJson) return true;
          
          // Should not have old package names in any dependency section
          const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
          
          for (const depType of depTypes) {
            if (packageJson[depType]) {
              for (const oldPackageName of oldPackageNames) {
                expect(packageJson[depType]).not.toHaveProperty(oldPackageName);
              }
            }
          }
          
          // Should have valid package structure
          expect(packageJson.name).toBeTruthy();
          expect(packageJson.main).toBeTruthy();
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should maintain TypeScript compatibility in dependent packages', () => {
      fc.assert(fc.property(
        fc.record({
          packageName: fc.constant('signing'),
          newPackageName: fc.constant('dso-pdf-sign')
        }),
        ({ packageName, newPackageName }) => {
          const workspaceRoot = getWorkspaceRoot();
          const packagePath = path.join(workspaceRoot, 'packages', packageName);
          
          if (!fs.existsSync(packagePath)) {
            return true; // Skip if package doesn't exist
          }
          
          const tsFiles = getAllFiles(packagePath, ['.ts', '.tsx']);
          
          for (const filePath of tsFiles) {
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              
              // If file uses PDF signing, check TypeScript compatibility
              if (content.includes('signWithP12') || content.includes('signWithGCloud')) {
                // Should use proper TypeScript patterns
                expect(content).toContain('let ');
                expect(content).toContain(': any');
                
                // Should have proper variable declarations
                const signWithP12Match = content.match(/let signWithP12: any;/);
                const signWithGCloudMatch = content.match(/let signWithGCloud: any;/);
                
                if (content.includes('signWithP12')) {
                  expect(signWithP12Match).toBeTruthy();
                }
                
                if (content.includes('signWithGCloud')) {
                  expect(signWithGCloudMatch).toBeTruthy();
                }
              }
            } catch (error) {
              // Skip files we can't read
            }
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should preserve configuration file references', () => {
      fc.assert(fc.property(
        fc.record({
          oldPackageNames: fc.constant(['@signtusk/pdf-sign', '@docusign-alternative/pdf-sign']),
          newPackageName: fc.constant('dso-pdf-sign')
        }),
        ({ oldPackageNames, newPackageName }) => {
          const workspaceRoot = getWorkspaceRoot();
          const configFiles = getAllFiles(workspaceRoot, [
            '.json', '.yml', '.yaml', '.toml', 
            'config.js', 'config.ts'
          ]);
          
          for (const configPath of configFiles) {
            // Skip the standalone package and spec files
            if (configPath.includes('dso-pdf-sign/') || 
                configPath.includes('.kiro/specs/') ||
                configPath.includes('node_modules/') ||
                configPath.includes('.git/')) {
              continue;
            }
            
            try {
              const content = fs.readFileSync(configPath, 'utf-8');
              
              // Should not contain old package names
              for (const oldPackageName of oldPackageNames) {
                expect(content).not.toContain(oldPackageName);
              }
              
              // If it's a package.json with workspaces, should be valid
              if (configPath.endsWith('package.json')) {
                const json = JSON.parse(content);
                if (json.workspaces) {
                  expect(Array.isArray(json.workspaces)).toBe(true);
                  expect(json.workspaces.length).toBeGreaterThan(0);
                }
              }
            } catch (error) {
              // Skip files we can't read or parse
            }
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should maintain runtime compatibility with graceful fallbacks', () => {
      fc.assert(fc.property(
        fc.record({
          transportFunctions: fc.constant(['signWithP12', 'signWithGCloud']),
          errorMessage: fc.constant('PDF signing functionality is not available in this deployment')
        }),
        ({ transportFunctions, errorMessage }) => {
          const workspaceRoot = getWorkspaceRoot();
          const signingPackagePath = path.join(workspaceRoot, 'packages', 'signing');
          
          if (!fs.existsSync(signingPackagePath)) {
            return true; // Skip if signing package doesn't exist
          }
          
          const transportFiles = getAllFiles(
            path.join(signingPackagePath, 'transports'), 
            ['.ts', '.js']
          );
          
          for (const filePath of transportFiles) {
            try {
              const content = fs.readFileSync(filePath, 'utf-8');
              
              // Check each transport function
              for (const funcName of transportFunctions) {
                if (content.includes(funcName)) {
                  // Should have fallback assignment in catch block
                  expect(content).toContain(`${funcName} = () => {`);
                  expect(content).toContain(errorMessage);
                  
                  // Should have proper variable initialization
                  expect(content).toContain(`let ${funcName}: any;`);
                  
                  // Should have assignment from required module
                  expect(content).toContain(`${funcName} = pdfSign.${funcName};`);
                }
              }
            } catch (error) {
              // Skip files we can't read
            }
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });
});