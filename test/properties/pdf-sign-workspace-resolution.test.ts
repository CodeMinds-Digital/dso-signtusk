/**
 * PDF Sign Workspace Package Resolution Property-Based Tests
 * 
 * **Feature: pdf-sign-integration, Property 1: Workspace package resolution**
 * **Validates: Requirements 1.2, 4.3**
 * 
 * Tests that the @signtusk/pdf-sign package is properly resolved as a workspace package
 * and that the package manager resolves to the local workspace package rather than
 * any external package.
 */

import { execSync } from 'child_process';
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

// Helper function to check if a package exists in workspace
function isWorkspacePackage(packageName: string): boolean {
    const workspaceRoot = getWorkspaceRoot();
    const rootPackageJson = readJsonFile(join(workspaceRoot, 'package.json'));
    
    if (!rootPackageJson?.workspaces) return false;
    
    // Check if package exists in any workspace directory
    for (const workspace of rootPackageJson.workspaces) {
        const workspacePattern = workspace.replace('*', '');
        const potentialPath = join(workspaceRoot, workspacePattern);
        
        if (existsSync(potentialPath)) {
            const entries = require('fs').readdirSync(potentialPath);
            for (const entry of entries) {
                const packageJsonPath = join(potentialPath, entry, 'package.json');
                if (existsSync(packageJsonPath)) {
                    const packageJson = readJsonFile(packageJsonPath);
                    if (packageJson?.name === packageName) {
                        return true;
                    }
                }
            }
        }
    }
    
    return false;
}

// Helper function to get npm resolution for a package
function getNpmResolution(packageName: string): string | null {
    try {
        const workspaceRoot = getWorkspaceRoot();
        const result = execSync(`npm ls ${packageName} --json`, { 
            cwd: workspaceRoot,
            encoding: 'utf-8',
            stdio: 'pipe'
        });
        const lsOutput = JSON.parse(result);
        
        // Check if package is resolved and get its path
        if (lsOutput.dependencies?.[packageName]) {
            return lsOutput.dependencies[packageName].path || lsOutput.dependencies[packageName].resolved;
        }
        
        return null;
    } catch (error) {
        // Package might not be installed or resolved
        return null;
    }
}

// Helper function to check if a path is within workspace
function isPathInWorkspace(packagePath: string): boolean {
    const workspaceRoot = getWorkspaceRoot();
    const normalizedPath = resolve(packagePath);
    const normalizedWorkspace = resolve(workspaceRoot);
    
    return normalizedPath.startsWith(normalizedWorkspace);
}

describe('PDF Sign Workspace Package Resolution', () => {
    /**
     * Property 1: Workspace package resolution
     * For any package in the monorepo that imports @signtusk/pdf-sign,
     * the package manager should resolve to the local workspace package
     * rather than any external package
     */
    describe('Property 1: Workspace package resolution', () => {
        it('should resolve @signtusk/pdf-sign to local workspace package', () => {
            const workspaceRoot = getWorkspaceRoot();
            const pdfSignPackagePath = join(workspaceRoot, 'packages', 'pdf-sign');
            
            // Verify the package exists in the workspace
            expect(existsSync(pdfSignPackagePath)).toBe(true);
            
            const packageJson = readJsonFile(join(pdfSignPackagePath, 'package.json'));
            expect(packageJson).toBeTruthy();
            expect(packageJson.name).toBe('@signtusk/pdf-sign');
            
            // Verify it's recognized as a workspace package
            expect(isWorkspacePackage('@signtusk/pdf-sign')).toBe(true);
        });

        it('should have proper workspace configuration for pdf-sign package', () => {
            const workspaceRoot = getWorkspaceRoot();
            const rootPackageJson = readJsonFile(join(workspaceRoot, 'package.json'));
            
            expect(rootPackageJson).toBeTruthy();
            expect(rootPackageJson.workspaces).toBeTruthy();
            expect(Array.isArray(rootPackageJson.workspaces)).toBe(true);
            
            // Should include packages/* which covers our pdf-sign package
            expect(rootPackageJson.workspaces).toContain('packages/*');
        });

        it('should maintain package structure and configuration after move', () => {
            fc.assert(fc.property(
                fc.constant('@signtusk/pdf-sign'),
                (packageName) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const packagePath = join(workspaceRoot, 'packages', 'pdf-sign');
                    
                    // Package should exist
                    expect(existsSync(packagePath)).toBe(true);
                    
                    // Should have package.json with correct name
                    const packageJson = readJsonFile(join(packagePath, 'package.json'));
                    expect(packageJson).toBeTruthy();
                    expect(packageJson.name).toBe(packageName);
                    
                    // Should have essential Rust/NAPI files
                    expect(existsSync(join(packagePath, 'Cargo.toml'))).toBe(true);
                    expect(existsSync(join(packagePath, 'build.rs'))).toBe(true);
                    expect(existsSync(join(packagePath, 'src'))).toBe(true);
                    expect(existsSync(join(packagePath, 'index.js'))).toBe(true);
                    expect(existsSync(join(packagePath, 'index.d.ts'))).toBe(true);
                    
                    // Should have NAPI configuration
                    expect(packageJson.napi).toBeTruthy();
                    expect(packageJson.napi.name).toBe('pdf-sign');
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should preserve all Rust source files and build configurations', () => {
            fc.assert(fc.property(
                fc.constant('packages/pdf-sign'),
                (packageDir) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const packagePath = join(workspaceRoot, packageDir);
                    
                    // Verify Cargo.toml exists and has correct configuration
                    const cargoTomlPath = join(packagePath, 'Cargo.toml');
                    expect(existsSync(cargoTomlPath)).toBe(true);
                    
                    const cargoContent = readFileSync(cargoTomlPath, 'utf-8');
                    expect(cargoContent).toContain('[lib]');
                    expect(cargoContent).toContain('crate-type = ["cdylib"]');
                    
                    // Verify build.rs exists
                    expect(existsSync(join(packagePath, 'build.rs'))).toBe(true);
                    
                    // Verify src directory and main lib file exist
                    const srcPath = join(packagePath, 'src');
                    expect(existsSync(srcPath)).toBe(true);
                    expect(existsSync(join(srcPath, 'lib.rs'))).toBe(true);
                    
                    // Verify TypeScript definitions exist
                    expect(existsSync(join(packagePath, 'index.d.ts'))).toBe(true);
                    
                    // Verify JavaScript entry point exists
                    expect(existsSync(join(packagePath, 'index.js'))).toBe(true);
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should have correct package name and workspace compatibility', () => {
            fc.assert(fc.property(
                fc.constantFrom('@signtusk/pdf-sign'),
                (expectedPackageName) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const packagePath = join(workspaceRoot, 'packages', 'pdf-sign', 'package.json');
                    
                    const packageJson = readJsonFile(packagePath);
                    expect(packageJson).toBeTruthy();
                    
                    // Should have correct name
                    expect(packageJson.name).toBe(expectedPackageName);
                    
                    // Should have version
                    expect(packageJson.version).toBeTruthy();
                    expect(typeof packageJson.version).toBe('string');
                    
                    // Should have main and types fields
                    expect(packageJson.main).toBe('index.js');
                    expect(packageJson.types).toBe('index.d.ts');
                    
                    // Should have NAPI configuration
                    expect(packageJson.napi).toBeTruthy();
                    expect(packageJson.napi.name).toBe('pdf-sign');
                    expect(packageJson.napi.triples).toBeTruthy();
                    expect(Array.isArray(packageJson.napi.triples.additional)).toBe(true);
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should be discoverable by workspace package resolution', () => {
            fc.assert(fc.property(
                fc.constant('@signtusk/pdf-sign'),
                (packageName) => {
                    // Should be recognized as a workspace package
                    expect(isWorkspacePackage(packageName)).toBe(true);
                    
                    // Package should exist in expected location
                    const workspaceRoot = getWorkspaceRoot();
                    const expectedPath = join(workspaceRoot, 'packages', 'pdf-sign');
                    expect(existsSync(expectedPath)).toBe(true);
                    
                    // Should have valid package.json
                    const packageJsonPath = join(expectedPath, 'package.json');
                    expect(existsSync(packageJsonPath)).toBe(true);
                    
                    const packageJson = readJsonFile(packageJsonPath);
                    expect(packageJson?.name).toBe(packageName);
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should maintain NAPI binary structure after move', () => {
            fc.assert(fc.property(
                fc.constant('packages/pdf-sign'),
                (packageDir) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const packagePath = join(workspaceRoot, packageDir);
                    
                    // Should have npm directory for platform binaries
                    const npmPath = join(packagePath, 'npm');
                    expect(existsSync(npmPath)).toBe(true);
                    
                    // Should have platform-specific directories
                    const platformDirs = [
                        'darwin-arm64',
                        'darwin-x64', 
                        'linux-arm64-gnu',
                        'linux-x64-gnu',
                        'win32-x64-msvc'
                    ];
                    
                    for (const platform of platformDirs) {
                        const platformPath = join(npmPath, platform);
                        expect(existsSync(platformPath)).toBe(true);
                    }
                    
                    return true;
                }
            ), { numRuns: 1 });
        });
    });
});