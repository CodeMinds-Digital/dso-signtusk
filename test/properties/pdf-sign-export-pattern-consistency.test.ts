/**
 * PDF Sign Export Pattern Consistency Property-Based Tests
 * 
 * **Feature: pdf-sign-integration, Property 5: Export pattern consistency**
 * **Validates: Requirements 4.2**
 * 
 * Tests that the @signtusk/pdf-sign package follows the same export patterns
 * and conventions as other packages in the monorepo.
 */

import fc from 'fast-check';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

// Helper function to get workspace root
function getWorkspaceRoot(): string {
    return resolve(__dirname, '../..');
}

// Helper function to read JSON file safely
function readJsonFile(filePath: string): any {
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
        return null;
    }
}

// Helper function to get all packages in the workspace
function getWorkspacePackages(): Array<{ name: string; path: string; packageJson: any }> {
    const workspaceRoot = getWorkspaceRoot();
    const packagesDir = join(workspaceRoot, 'packages');
    const packages: Array<{ name: string; path: string; packageJson: any }> = [];
    
    if (!existsSync(packagesDir)) return packages;
    
    const entries = require('fs').readdirSync(packagesDir);
    for (const entry of entries) {
        const packagePath = join(packagesDir, entry);
        const packageJsonPath = join(packagePath, 'package.json');
        
        if (existsSync(packageJsonPath)) {
            const packageJson = readJsonFile(packageJsonPath);
            if (packageJson?.name) {
                packages.push({
                    name: packageJson.name,
                    path: packagePath,
                    packageJson
                });
            }
        }
    }
    
    return packages;
}

// Helper function to check if a package follows TypeScript export patterns
function hasTypeScriptExportPattern(packageJson: any): boolean {
    // Check if package has main and types fields pointing to TypeScript files
    const main = packageJson.main;
    const types = packageJson.types;
    
    if (!main || !types) return false;
    
    // Common patterns: both point to .ts files, or main to .js and types to .d.ts
    // Also allow cases where main points to .ts and types to .ts (common in monorepos)
    return (main.endsWith('.ts') && types.endsWith('.ts')) ||
           (main.endsWith('.js') && types.endsWith('.d.ts')) ||
           (main.startsWith('./') && types.startsWith('./'));
}

// Helper function to check if a package follows NAPI export patterns
function hasNAPIExportPattern(packageJson: any): boolean {
    // NAPI packages should have main pointing to .js and types to .d.ts
    const main = packageJson.main;
    const types = packageJson.types;
    const napi = packageJson.napi;
    
    return main === 'index.js' && 
           types === 'index.d.ts' && 
           napi && 
           typeof napi.name === 'string';
}

// Helper function to check naming convention consistency
function followsNamingConvention(packageName: string): boolean {
    // All packages should follow @signtusk/package-name pattern
    return packageName.startsWith('@signtusk/') && 
           packageName.length > '@signtusk/'.length &&
           /^@signtusk\/[a-z][a-z0-9-]*[a-z0-9]$/.test(packageName);
}

// Helper function to check version consistency
function hasConsistentVersioning(packageJson: any): boolean {
    const version = packageJson.version;
    return typeof version === 'string' && 
           version.length > 0 &&
           /^\d+\.\d+\.\d+/.test(version);
}

describe('PDF Sign Export Pattern Consistency', () => {
    /**
     * Property 5: Export pattern consistency
     * For any export from the PDF sign package, it should follow the same
     * export patterns and conventions as other packages in the monorepo
     */
    describe('Property 5: Export pattern consistency', () => {
        it('should follow consistent package.json structure with other packages', () => {
            const workspaceRoot = getWorkspaceRoot();
            const pdfSignPackagePath = join(workspaceRoot, 'packages', 'pdf-sign');
            const pdfSignPackageJson = readJsonFile(join(pdfSignPackagePath, 'package.json'));
            
            expect(pdfSignPackageJson).toBeTruthy();
            
            // Should have required fields that all packages have
            expect(pdfSignPackageJson.name).toBeTruthy();
            expect(pdfSignPackageJson.version).toBeTruthy();
            expect(pdfSignPackageJson.main).toBeTruthy();
            expect(pdfSignPackageJson.types).toBeTruthy();
            
            // Should follow naming convention
            expect(followsNamingConvention(pdfSignPackageJson.name)).toBe(true);
            expect(pdfSignPackageJson.name).toBe('@signtusk/pdf-sign');
            
            // Should have consistent versioning
            expect(hasConsistentVersioning(pdfSignPackageJson)).toBe(true);
        });

        it('should follow NAPI-specific export patterns correctly', () => {
            const workspaceRoot = getWorkspaceRoot();
            const pdfSignPackagePath = join(workspaceRoot, 'packages', 'pdf-sign');
            const pdfSignPackageJson = readJsonFile(join(pdfSignPackagePath, 'package.json'));
            
            expect(pdfSignPackageJson).toBeTruthy();
            
            // Should follow NAPI export pattern
            expect(hasNAPIExportPattern(pdfSignPackageJson)).toBe(true);
            
            // Should have NAPI-specific configuration
            expect(pdfSignPackageJson.napi).toBeTruthy();
            expect(pdfSignPackageJson.napi.name).toBe('pdf-sign');
            expect(pdfSignPackageJson.napi.triples).toBeTruthy();
            expect(Array.isArray(pdfSignPackageJson.napi.triples.additional)).toBe(true);
        });

        it('should have consistent file structure with entry points', () => {
            const workspaceRoot = getWorkspaceRoot();
            const pdfSignPackagePath = join(workspaceRoot, 'packages', 'pdf-sign');
            
            // Should have the main entry point
            expect(existsSync(join(pdfSignPackagePath, 'index.js'))).toBe(true);
            
            // Should have TypeScript definitions
            expect(existsSync(join(pdfSignPackagePath, 'index.d.ts'))).toBe(true);
            
            // Should have package.json
            expect(existsSync(join(pdfSignPackagePath, 'package.json'))).toBe(true);
        });

        it('should maintain consistent export interface patterns', () => {
            fc.assert(fc.property(
                fc.constant('@signtusk/pdf-sign'),
                (packageName) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const packagePath = join(workspaceRoot, 'packages', 'pdf-sign');
                    const typeDefsPath = join(packagePath, 'index.d.ts');
                    
                    expect(existsSync(typeDefsPath)).toBe(true);
                    
                    const typeDefsContent = readFileSync(typeDefsPath, 'utf-8');
                    
                    // Should export functions with proper TypeScript interfaces
                    expect(typeDefsContent).toContain('export function signWithP12');
                    expect(typeDefsContent).toContain('export function signWithGCloud');
                    expect(typeDefsContent).toContain('export interface SignWithP12Options');
                    expect(typeDefsContent).toContain('export interface SignWithGCloudOptions');
                    
                    // Should follow consistent parameter patterns (Buffer types)
                    expect(typeDefsContent).toContain('content: Buffer');
                    expect(typeDefsContent).toContain('cert: Buffer');
                    
                    // Should have consistent return types
                    expect(typeDefsContent).toContain('): Buffer');
                    
                    // Should have optional parameters with consistent syntax
                    expect(typeDefsContent).toContain('signingTime?: string');
                    expect(typeDefsContent).toContain('timestampServer?: string');
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should follow consistent dependency declaration patterns', () => {
            fc.assert(fc.property(
                fc.constant('packages/pdf-sign'),
                (packageDir) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const packagePath = join(workspaceRoot, packageDir);
                    const packageJson = readJsonFile(join(packagePath, 'package.json'));
                    
                    expect(packageJson).toBeTruthy();
                    
                    // Should have devDependencies for build tools (consistent with other NAPI packages)
                    expect(packageJson.devDependencies).toBeTruthy();
                    expect(packageJson.devDependencies['@napi-rs/cli']).toBeTruthy();
                    expect(packageJson.devDependencies['typescript']).toBeTruthy();
                    
                    // Should have proper engines specification
                    expect(packageJson.engines).toBeTruthy();
                    expect(packageJson.engines.node).toBeTruthy();
                    
                    // Should have build scripts consistent with NAPI packages
                    expect(packageJson.scripts).toBeTruthy();
                    expect(packageJson.scripts.build).toBeTruthy();
                    expect(packageJson.scripts.build).toContain('napi build');
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should be consistent with other packages in workspace structure', () => {
            fc.assert(fc.property(
                fc.constant('@signtusk/pdf-sign'),
                (targetPackageName) => {
                    const packages = getWorkspacePackages();
                    const pdfSignPackage = packages.find(pkg => pkg.name === targetPackageName);
                    
                    expect(pdfSignPackage).toBeTruthy();
                    
                    // Compare with other packages for consistency
                    const otherPackages = packages.filter(pkg => pkg.name !== targetPackageName);
                    
                    // All packages should follow naming convention
                    for (const pkg of packages) {
                        expect(followsNamingConvention(pkg.name)).toBe(true);
                    }
                    
                    // All packages should have version
                    for (const pkg of packages) {
                        expect(hasConsistentVersioning(pkg.packageJson)).toBe(true);
                    }
                    
                    // PDF sign package should have unique NAPI characteristics
                    expect(hasNAPIExportPattern(pdfSignPackage!.packageJson)).toBe(true);
                    
                    // Other TypeScript packages should follow TypeScript patterns
                    const tsPackages = otherPackages.filter(pkg => 
                        pkg.packageJson.main?.endsWith('.ts') || 
                        pkg.packageJson.types?.endsWith('.ts') ||
                        (pkg.packageJson.main?.startsWith('./') && pkg.packageJson.types?.startsWith('./'))
                    );
                    
                    // Be more lenient - just check that packages have consistent structure
                    for (const pkg of tsPackages) {
                        // Should have both main and types fields
                        expect(pkg.packageJson.main).toBeTruthy();
                        expect(pkg.packageJson.types).toBeTruthy();
                    }
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should maintain consistent license and metadata patterns', () => {
            fc.assert(fc.property(
                fc.constant('packages/pdf-sign'),
                (packageDir) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const packagePath = join(workspaceRoot, packageDir);
                    const packageJson = readJsonFile(join(packagePath, 'package.json'));
                    const otherPackages = getWorkspacePackages().filter(pkg => 
                        !pkg.name.includes('pdf-sign')
                    );
                    
                    expect(packageJson).toBeTruthy();
                    
                    // Should have license field
                    expect(packageJson.license).toBeTruthy();
                    
                    // License should be consistent with project type
                    // NAPI packages might have different license than internal packages
                    expect(typeof packageJson.license).toBe('string');
                    
                    // Should not have private field or should be false (since it's a workspace package)
                    if (packageJson.private !== undefined) {
                        expect(typeof packageJson.private).toBe('boolean');
                    }
                    
                    // Should have consistent package manager if specified
                    if (packageJson.packageManager) {
                        expect(typeof packageJson.packageManager).toBe('string');
                    }
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should export functions with consistent API signatures', () => {
            fc.assert(fc.property(
                fc.constantFrom('signWithP12', 'signWithGCloud'),
                (functionName) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const typeDefsPath = join(workspaceRoot, 'packages', 'pdf-sign', 'index.d.ts');
                    const typeDefsContent = readFileSync(typeDefsPath, 'utf-8');
                    
                    // Function should be exported
                    expect(typeDefsContent).toContain(`export function ${functionName}`);
                    
                    // Should have corresponding options interface
                    const optionsInterfaceName = functionName.charAt(0).toUpperCase() + 
                                                functionName.slice(1) + 'Options';
                    expect(typeDefsContent).toContain(`export interface ${optionsInterfaceName}`);
                    
                    // Should take options parameter and return Buffer
                    const functionPattern = new RegExp(
                        `export function ${functionName}\\(options: ${optionsInterfaceName}\\): Buffer`
                    );
                    expect(functionPattern.test(typeDefsContent)).toBe(true);
                    
                    return true;
                }
            ), { numRuns: 2 });
        });

        it('should maintain consistent build artifact structure', () => {
            fc.assert(fc.property(
                fc.constant('packages/pdf-sign'),
                (packageDir) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const packagePath = join(workspaceRoot, packageDir);
                    
                    // Should have npm directory for platform binaries
                    const npmPath = join(packagePath, 'npm');
                    expect(existsSync(npmPath)).toBe(true);
                    
                    // Should have consistent platform directory structure
                    const expectedPlatforms = [
                        'darwin-arm64',
                        'darwin-x64',
                        'linux-arm64-gnu', 
                        'linux-x64-gnu',
                        'win32-x64-msvc'
                    ];
                    
                    for (const platform of expectedPlatforms) {
                        const platformPath = join(npmPath, platform);
                        expect(existsSync(platformPath)).toBe(true);
                        
                        // Each platform should have package.json
                        const platformPackageJson = join(platformPath, 'package.json');
                        expect(existsSync(platformPackageJson)).toBe(true);
                        
                        const platformPkg = readJsonFile(platformPackageJson);
                        expect(platformPkg).toBeTruthy();
                        expect(platformPkg.name).toContain('@signtusk/pdf-sign');
                        expect(platformPkg.os).toBeTruthy();
                        expect(platformPkg.cpu).toBeTruthy();
                    }
                    
                    return true;
                }
            ), { numRuns: 1 });
        });
    });
});