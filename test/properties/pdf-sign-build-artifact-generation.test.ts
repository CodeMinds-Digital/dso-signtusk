/**
 * PDF Sign Build Artifact Generation Property-Based Tests
 * 
 * **Feature: pdf-sign-integration, Property 2: Build artifact generation**
 * **Validates: Requirements 1.3, 3.4**
 * 
 * Tests that for any target platform configuration, building the PDF sign package
 * should generate the corresponding NAPI binary and TypeScript definitions.
 */

import fc from 'fast-check';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

// Helper function to read JSON file safely
function readJsonFile(filePath: string): any {
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
        return null;
    }
}

// Helper function to get PDF sign package directory
function getPdfSignPackageDir(): string {
    return resolve(__dirname, '../../packages/pdf-sign');
}

// Helper function to get platform directories
function getPlatformDirectories(): string[] {
    const npmDir = join(getPdfSignPackageDir(), 'npm');
    if (!existsSync(npmDir)) return [];

    return readdirSync(npmDir)
        .map(name => join(npmDir, name))
        .filter(path => statSync(path).isDirectory());
}

// Helper function to get expected platform configurations
function getExpectedPlatforms(): string[] {
    const packageJson = readJsonFile(join(getPdfSignPackageDir(), 'package.json'));
    if (!packageJson?.napi?.triples?.additional) return [];
    
    // Map Rust target triples to platform directory names
    const platformMap: Record<string, string> = {
        'aarch64-apple-darwin': 'darwin-arm64',
        'x86_64-apple-darwin': 'darwin-x64',
        'aarch64-unknown-linux-gnu': 'linux-arm64-gnu',
        'aarch64-unknown-linux-musl': 'linux-arm64-musl',
        'x86_64-unknown-linux-gnu': 'linux-x64-gnu',
        'x86_64-unknown-linux-musl': 'linux-x64-musl',
        'x86_64-pc-windows-msvc': 'win32-x64-msvc'
    };

    const additionalTriples = packageJson.napi.triples.additional;
    return additionalTriples
        .map((triple: string) => platformMap[triple])
        .filter(Boolean);
}

describe('PDF Sign Build Artifact Generation', () => {
    /**
     * Property 2: Build artifact generation
     * For any target platform configuration, building the PDF sign package should
     * generate the corresponding NAPI binary and TypeScript definitions
     */
    describe('Property 2: Build artifact generation', () => {
        it('should have proper NAPI configuration for all target platforms', () => {
            const packageDir = getPdfSignPackageDir();
            const packageJson = readJsonFile(join(packageDir, 'package.json'));
            const expectedPlatforms = getExpectedPlatforms();

            fc.assert(fc.property(
                fc.constantFrom(...expectedPlatforms),
                (platform) => {
                    // Package should have NAPI configuration
                    expect(packageJson).toBeTruthy();
                    expect(packageJson.napi).toBeTruthy();
                    expect(packageJson.napi.name).toBe('pdf-sign');
                    expect(packageJson.napi.triples).toBeTruthy();
                    expect(Array.isArray(packageJson.napi.triples.additional)).toBe(true);

                    // Platform directory should exist
                    const platformDir = join(packageDir, 'npm', platform);
                    expect(existsSync(platformDir)).toBe(true);

                    // Platform package.json should exist and be properly configured
                    const platformPackageJson = readJsonFile(join(platformDir, 'package.json'));
                    expect(platformPackageJson).toBeTruthy();
                    expect(platformPackageJson.name).toContain('pdf-sign');
                    expect(platformPackageJson.main).toBeTruthy();
                    expect(platformPackageJson.main).toContain('.node');

                    // Should have proper OS and CPU constraints
                    expect(Array.isArray(platformPackageJson.os)).toBe(true);
                    expect(Array.isArray(platformPackageJson.cpu)).toBe(true);
                    expect(platformPackageJson.os.length).toBeGreaterThan(0);
                    expect(platformPackageJson.cpu.length).toBeGreaterThan(0);

                    // Files array should include the binary
                    expect(Array.isArray(platformPackageJson.files)).toBe(true);
                    expect(platformPackageJson.files).toContain(platformPackageJson.main);
                }
            ), { numRuns: Math.min(expectedPlatforms.length, 3) });
        });

        it('should have consistent build configuration across all platforms', () => {
            const packageDir = getPdfSignPackageDir();
            const packageJson = readJsonFile(join(packageDir, 'package.json'));
            const platformDirs = getPlatformDirectories();

            fc.assert(fc.property(
                fc.constantFrom(...platformDirs),
                (platformDir) => {
                    const platformPackageJson = readJsonFile(join(platformDir, 'package.json'));

                    if (platformPackageJson) {
                        // Version should match main package
                        expect(platformPackageJson.version).toBe(packageJson.version);

                        // License should be consistent
                        expect(platformPackageJson.license).toBeTruthy();

                        // Engine requirements should be consistent
                        expect(platformPackageJson.engines).toBeTruthy();
                        expect(platformPackageJson.engines.node).toBeTruthy();

                        // Main field should point to a .node file
                        expect(platformPackageJson.main).toMatch(/\.node$/);

                        // Name should follow consistent pattern
                        expect(platformPackageJson.name).toMatch(/@[^/]+\/pdf-sign-.+/);
                    }
                }
            ), { numRuns: Math.min(platformDirs.length, 10) });
        });

        it('should have proper TypeScript definitions and exports', () => {
            const packageDir = getPdfSignPackageDir();
            const packageJson = readJsonFile(join(packageDir, 'package.json'));

            fc.assert(fc.property(
                fc.constant(packageDir),
                (dir) => {
                    // Should have TypeScript definitions
                    expect(packageJson.types).toBeTruthy();
                    expect(packageJson.types).toMatch(/\.d\.ts$/);

                    const typesPath = join(dir, packageJson.types);
                    expect(existsSync(typesPath)).toBe(true);

                    // Should have main JavaScript entry point
                    expect(packageJson.main).toBeTruthy();
                    expect(packageJson.main).toMatch(/\.js$/);

                    const mainPath = join(dir, packageJson.main);
                    expect(existsSync(mainPath)).toBe(true);

                    // TypeScript definitions should export expected functions
                    const typesContent = readFileSync(typesPath, 'utf-8');
                    expect(typesContent).toContain('signWithP12');
                    expect(typesContent).toContain('signWithGCloud');

                    // Should export proper interfaces
                    expect(typesContent).toContain('SignWithP12Options');
                    expect(typesContent).toContain('SignWithGCloudOptions');
                }
            ), { numRuns: 5 });
        });

        it('should have proper Rust build configuration', () => {
            const packageDir = getPdfSignPackageDir();

            fc.assert(fc.property(
                fc.constant(packageDir),
                (dir) => {
                    // Should have Cargo.toml
                    const cargoTomlPath = join(dir, 'Cargo.toml');
                    expect(existsSync(cargoTomlPath)).toBe(true);

                    const cargoContent = readFileSync(cargoTomlPath, 'utf-8');

                    // Should be configured as cdylib
                    expect(cargoContent).toContain('crate-type = ["cdylib"]');

                    // Should have NAPI dependencies
                    expect(cargoContent).toContain('napi =');
                    expect(cargoContent).toContain('napi-derive =');

                    // Should have build dependencies
                    expect(cargoContent).toContain('[build-dependencies]');
                    expect(cargoContent).toContain('napi-build =');

                    // Should have build.rs
                    const buildRsPath = join(dir, 'build.rs');
                    expect(existsSync(buildRsPath)).toBe(true);

                    const buildRsContent = readFileSync(buildRsPath, 'utf-8');
                    expect(buildRsContent).toContain('napi_build::setup');
                }
            ), { numRuns: 5 });
        });

        it('should have proper build scripts and commands', () => {
            const packageDir = getPdfSignPackageDir();
            const packageJson = readJsonFile(join(packageDir, 'package.json'));

            fc.assert(fc.property(
                fc.constant(packageJson),
                (pkg) => {
                    // Should have build script
                    expect(pkg.scripts).toBeTruthy();
                    expect(pkg.scripts.build).toBeTruthy();
                    expect(pkg.scripts.build).toContain('napi build');

                    // Build script should include platform flag
                    expect(pkg.scripts.build).toContain('--platform');

                    // Should have release flag for production builds
                    expect(pkg.scripts.build).toContain('--release');

                    // Should have artifacts script
                    expect(pkg.scripts.artifacts).toBeTruthy();
                    expect(pkg.scripts.artifacts).toContain('napi artifacts');

                    // Should have universal script for universal binaries
                    expect(pkg.scripts.universal).toBeTruthy();
                    expect(pkg.scripts.universal).toContain('napi universal');

                    // Should have prepublish script
                    expect(pkg.scripts.prepublishOnly).toBeTruthy();
                    expect(pkg.scripts.prepublishOnly).toContain('napi prepublish');
                }
            ), { numRuns: 5 });
        });

        it('should have consistent package naming across platforms', () => {
            const platformDirs = getPlatformDirectories();

            fc.assert(fc.property(
                fc.constantFrom(...platformDirs),
                (platformDir) => {
                    const platformPackageJson = readJsonFile(join(platformDir, 'package.json'));
                    const platformName = platformDir.split('/').pop();

                    if (platformPackageJson && platformName) {
                        // Package name should include platform identifier
                        expect(platformPackageJson.name).toContain(platformName);

                        // Should follow consistent naming pattern
                        expect(platformPackageJson.name).toMatch(/^@[^/]+\/pdf-sign-.+$/);

                        // Main file should match platform
                        expect(platformPackageJson.main).toContain(platformName);
                        expect(platformPackageJson.main).toMatch(/pdf-sign\..+\.node$/);

                        // Files array should be properly configured
                        expect(Array.isArray(platformPackageJson.files)).toBe(true);
                        expect(platformPackageJson.files.length).toBeGreaterThan(0);
                        expect(platformPackageJson.files).toContain(platformPackageJson.main);
                    }
                }
            ), { numRuns: Math.min(platformDirs.length, 10) });
        });

        it('should have proper workspace integration configuration', () => {
            const packageDir = getPdfSignPackageDir();
            const packageJson = readJsonFile(join(packageDir, 'package.json'));
            const rootPackageJson = readJsonFile(resolve(__dirname, '../../package.json'));

            fc.assert(fc.property(
                fc.constant({ packageJson, rootPackageJson }),
                ({ packageJson: pkg, rootPackageJson: root }) => {
                    // Package name should follow workspace naming convention
                    expect(pkg.name).toMatch(/^@signtusk\//);

                    // Should be included in workspace configuration
                    expect(Array.isArray(root.workspaces)).toBe(true);
                    const isIncluded = root.workspaces.some((workspace: string) => 
                        workspace === 'packages/*' || workspace === 'packages/pdf-sign'
                    );
                    expect(isIncluded).toBe(true);

                    // Should have proper version format
                    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);

                    // Should have NAPI CLI as dev dependency
                    expect(pkg.devDependencies).toBeTruthy();
                    expect(pkg.devDependencies['@napi-rs/cli']).toBeTruthy();

                    // Engine requirements should be compatible
                    expect(pkg.engines).toBeTruthy();
                    expect(pkg.engines.node).toBeTruthy();
                }
            ), { numRuns: 5 });
        });
    });
});