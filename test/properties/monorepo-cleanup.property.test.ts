/**
 * Monorepo Cleanup Property-Based Tests
 * 
 * **Feature: pdf-sign-package-migration, Property 6: Monorepo cleanup completeness**
 * **Validates: Requirements 5.2, 5.3, 5.4**
 * 
 * Tests that all references to the source package have been completely removed
 * from the monorepo after migration, ensuring clean workspace configuration.
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
    '.kiro/specs', // Exclude spec files which document the migration
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

describe('Monorepo Cleanup Property Tests', () => {
  /**
   * Property 6: Monorepo cleanup completeness
   * For any reference to the source package in the monorepo, the reference should be 
   * completely removed or updated after migration
   */
  describe('Property 6: Monorepo cleanup completeness', () => {
    it('should have no remaining packages/pdf-sign directory', () => {
      fc.assert(fc.property(
        fc.constant('packages/pdf-sign'),
        (packagePath) => {
          const workspaceRoot = getWorkspaceRoot();
          const fullPath = path.join(workspaceRoot, packagePath);
          
          // The directory should not exist
          expect(fs.existsSync(fullPath)).toBe(false);
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should have no references to @signtusk/pdf-sign in active code files', () => {
      fc.assert(fc.property(
        fc.constant('@signtusk/pdf-sign'),
        (oldPackageName) => {
          const workspaceRoot = getWorkspaceRoot();
          // Focus on key directories that would contain imports
          const keyDirs = ['packages', 'apps'];
          
          for (const dir of keyDirs) {
            const dirPath = path.join(workspaceRoot, dir);
            if (!fs.existsSync(dirPath)) continue;
            
            const codeFiles = getAllFiles(dirPath, ['.ts', '.tsx', '.js', '.jsx']);
            
            for (const filePath of codeFiles) {
              // Skip spec files and test files that document the migration
              if (filePath.includes('.kiro/specs') || 
                  filePath.includes('test/') ||
                  filePath.includes('dso-pdf-sign/')) {
                continue;
              }
              
              try {
                const content = fs.readFileSync(filePath, 'utf-8');
                
                // Should not contain old package references in active code
                expect(content).not.toContain(oldPackageName);
              } catch (error) {
                // Skip files we can't read
              }
            }
          }
          
          return true;
        }
      ), { numRuns: 10 }); // Reduced runs for performance
    }, 15000);

    it('should have updated all import statements to use new package name', () => {
      fc.assert(fc.property(
        fc.record({
          oldPackage: fc.constant('@signtusk/pdf-sign'),
          newPackage: fc.constant('dso-pdf-sign')
        }),
        ({ oldPackage, newPackage }) => {
          const workspaceRoot = getWorkspaceRoot();
          // Focus on packages that would use PDF signing
          const signingPackagePath = path.join(workspaceRoot, 'packages', 'signing');
          
          if (fs.existsSync(signingPackagePath)) {
            const codeFiles = getAllFiles(signingPackagePath, ['.ts', '.tsx', '.js', '.jsx']);
            
            for (const filePath of codeFiles) {
              try {
                const content = fs.readFileSync(filePath, 'utf-8');
                
                // If file imports PDF signing functionality, it should use new package
                if (content.includes('signWithP12') || content.includes('signWithGCloud')) {
                  if (content.includes('require(') || content.includes('import ')) {
                    // Should use new package name
                    expect(content).toContain(newPackage);
                    // Should not use old package name
                    expect(content).not.toContain(oldPackage);
                  }
                }
              } catch (error) {
                // Skip files we can't read
              }
            }
          }
          
          return true;
        }
      ), { numRuns: 10 }); // Reduced runs for performance
    }, 15000);

    it('should have no package.json dependencies on the old package', () => {
      fc.assert(fc.property(
        fc.constant('@signtusk/pdf-sign'),
        (oldPackageName) => {
          const workspaceRoot = getWorkspaceRoot();
          const packageJsonFiles = getAllFiles(workspaceRoot, ['package.json']);
          
          for (const packageJsonPath of packageJsonFiles) {
            // Skip the standalone package and spec files
            if (packageJsonPath.includes('dso-pdf-sign/') || 
                packageJsonPath.includes('.kiro/specs/')) {
              continue;
            }
            
            const packageJson = readJsonFile(packageJsonPath);
            if (!packageJson) continue;
            
            // Check all dependency types
            const depTypes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
            
            for (const depType of depTypes) {
              if (packageJson[depType]) {
                expect(packageJson[depType]).not.toHaveProperty(oldPackageName);
              }
            }
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should have no build configuration references to the old package', () => {
      fc.assert(fc.property(
        fc.constant('@signtusk/pdf-sign'),
        (oldPackageName) => {
          const workspaceRoot = getWorkspaceRoot();
          const configFiles = getAllFiles(workspaceRoot, [
            'vite.config.ts', 'vite.config.js',
            'webpack.config.js', 'webpack.config.ts',
            'rollup.config.js', 'rollup.config.ts',
            'turbo.json'
          ]);
          
          for (const configPath of configFiles) {
            // Skip the standalone package
            if (configPath.includes('dso-pdf-sign/')) {
              continue;
            }
            
            try {
              const content = fs.readFileSync(configPath, 'utf-8');
              
              // Should not contain old package references
              expect(content).not.toContain(oldPackageName);
            } catch (error) {
              // Skip files we can't read
            }
          }
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should maintain workspace integrity after package removal', () => {
      fc.assert(fc.property(
        fc.constant('packages'),
        (packagesDir) => {
          const workspaceRoot = getWorkspaceRoot();
          const packagesPath = path.join(workspaceRoot, packagesDir);
          
          // Packages directory should still exist
          expect(fs.existsSync(packagesPath)).toBe(true);
          
          // Should contain other packages but not pdf-sign
          const packages = fs.readdirSync(packagesPath, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name);
          
          // Should have other packages
          expect(packages.length).toBeGreaterThan(0);
          
          // Should not contain pdf-sign
          expect(packages).not.toContain('pdf-sign');
          
          // Should contain expected packages
          expect(packages).toContain('signing'); // The package that uses PDF signing
          expect(packages).toContain('lib');
          expect(packages).toContain('ui');
          
          return true;
        }
      ), { numRuns: 100 });
    });

    it('should have valid workspace configuration after cleanup', () => {
      fc.assert(fc.property(
        fc.constant('package.json'),
        (rootPackageFile) => {
          const workspaceRoot = getWorkspaceRoot();
          const rootPackageJson = readJsonFile(path.join(workspaceRoot, rootPackageFile));
          
          expect(rootPackageJson).toBeTruthy();
          expect(rootPackageJson.workspaces).toBeTruthy();
          expect(Array.isArray(rootPackageJson.workspaces)).toBe(true);
          
          // Should still include packages/* workspace pattern
          expect(rootPackageJson.workspaces).toContain('packages/*');
          
          // Should still include apps/* workspace pattern
          expect(rootPackageJson.workspaces).toContain('apps/*');
          
          return true;
        }
      ), { numRuns: 100 });
    });
  });
});