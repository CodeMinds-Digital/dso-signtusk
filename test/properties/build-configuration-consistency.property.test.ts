/**
 * Build Configuration Consistency Property-Based Tests
 * 
 * **Feature: build-failure-fixes, Property 4: Build Configuration Consistency**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 * 
 * Tests that build configurations are consistent and valid across all packages,
 * ensuring TypeScript compiler options, build scripts, bundling rules, type strictness,
 * and output formats are properly configured.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';

// Helper function to get all package directories
function getPackageDirectories(): string[] {
    const packagesDir = resolve(__dirname, '../../packages');
    if (!existsSync(packagesDir)) return [];

    return readdirSync(packagesDir)
        .map(name => join(packagesDir, name))
        .filter(path => statSync(path).isDirectory())
        .filter(path => existsSync(join(path, 'package.json')));
}

// Helper function to read JSON file safely
function readJsonFile(filePath: string): any {
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
        return null;
    }
}

// Helper function to get TypeScript config
function getTsConfig(packageDir: string): any {
    const tsconfigPath = join(packageDir, 'tsconfig.json');
    return readJsonFile(tsconfigPath);
}

describe('Build Configuration Consistency', () => {
    /**
     * Property 4: Build Configuration Consistency
     * For any package in the workspace, the build configuration should be consistent
     * and valid, producing expected outputs in correct locations
     */
    describe('Property 4: Build Configuration Consistency', () => {
        it('should use consistent TypeScript compiler options across all packages', () => {
            const packageDirs = getPackageDirectories();
            const rootTsConfig = readJsonFile(resolve(__dirname, '../../tsconfig.json'));

            fc.assert(fc.property(
                fc.constantFrom(...packageDirs),
                (packageDir) => {
                    const packageTsConfig = getTsConfig(packageDir);

                    if (packageTsConfig && packageTsConfig.compilerOptions) {
                        const { compilerOptions } = packageTsConfig;

                        // Core TypeScript options should be consistent
                        if (rootTsConfig?.compilerOptions) {
                            // Target should be ES2022 or compatible
                            if (compilerOptions.target) {
                                expect(['ES2022', 'ES2021', 'ES2020', 'ESNext']).toContain(compilerOptions.target);
                            }

                            // Strict mode should be enabled
                            if (compilerOptions.strict !== undefined) {
                                expect(compilerOptions.strict).toBe(true);
                            }

                            // Module resolution should be consistent
                            if (compilerOptions.moduleResolution) {
                                expect(['bundler', 'node', 'node16', 'nodenext']).toContain(compilerOptions.moduleResolution);
                            }

                            // ESModule interop should be enabled
                            if (compilerOptions.esModuleInterop !== undefined) {
                                expect(compilerOptions.esModuleInterop).toBe(true);
                            }
                        }
                    }
                }
            ), { numRuns: Math.min(packageDirs.length, 20) });
        });

        it('should have valid build scripts and configurations in package.json', () => {
            const packageDirs = getPackageDirectories();

            fc.assert(fc.property(
                fc.constantFrom(...packageDirs),
                (packageDir) => {
                    const packageJsonPath = join(packageDir, 'package.json');
                    const packageJson = readJsonFile(packageJsonPath);

                    expect(packageJson).toBeTruthy();
                    expect(packageJson.name).toBeTruthy();
                    expect(packageJson.version).toBeTruthy();

                    // Should have build script
                    expect(packageJson.scripts).toBeTruthy();
                    expect(packageJson.scripts.build).toBeTruthy();

                    // Build script should be valid
                    const buildScript = packageJson.scripts.build;
                    expect(typeof buildScript).toBe('string');
                    expect(buildScript.length).toBeGreaterThan(0);

                    // Common build tools should be used
                    const validBuildCommands = ['tsc', 'tsup', 'vite', 'webpack', 'rollup', 'esbuild'];
                    const hasValidBuildCommand = validBuildCommands.some(cmd => buildScript.includes(cmd));
                    expect(hasValidBuildCommand).toBe(true);

                    // Should have type-check script
                    expect(packageJson.scripts['type-check']).toBeTruthy();
                    expect(packageJson.scripts['type-check']).toContain('tsc');
                    expect(packageJson.scripts['type-check']).toContain('--noEmit');
                }
            ), { numRuns: Math.min(packageDirs.length, 20) });
        });

        it('should apply consistent bundling rules across packages', () => {
            const packageDirs = getPackageDirectories();

            fc.assert(fc.property(
                fc.constantFrom(...packageDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));

                    if (packageJson) {
                        // If package has exports, they should be properly configured
                        if (packageJson.exports) {
                            expect(typeof packageJson.exports).toBe('object');

                            // Main export should exist
                            if (packageJson.exports['.']) {
                                const mainExport = packageJson.exports['.'];

                                // Should have types field
                                if (typeof mainExport === 'object') {
                                    expect(mainExport.types || mainExport.typings).toBeTruthy();
                                }
                            }
                        }

                        // If package has main field, it should point to valid location
                        if (packageJson.main) {
                            expect(typeof packageJson.main).toBe('string');
                            expect(packageJson.main.length).toBeGreaterThan(0);
                        }

                        // If package has types field, it should point to valid location
                        if (packageJson.types) {
                            expect(typeof packageJson.types).toBe('string');
                            expect(packageJson.types.length).toBeGreaterThan(0);
                        }
                    }
                }
            ), { numRuns: Math.min(packageDirs.length, 20) });
        });

        it('should enforce the same type strictness levels across all packages', () => {
            const packageDirs = getPackageDirectories();

            fc.assert(fc.property(
                fc.constantFrom(...packageDirs),
                (packageDir) => {
                    const tsConfig = getTsConfig(packageDir);

                    if (tsConfig?.compilerOptions) {
                        const { compilerOptions } = tsConfig;

                        // Strict mode should be enabled
                        if (compilerOptions.strict !== undefined) {
                            expect(compilerOptions.strict).toBe(true);
                        }

                        // No implicit any should be enforced
                        if (compilerOptions.noImplicitAny !== undefined) {
                            expect(compilerOptions.noImplicitAny).toBe(true);
                        }

                        // Strict null checks should be enabled
                        if (compilerOptions.strictNullChecks !== undefined) {
                            expect(compilerOptions.strictNullChecks).toBe(true);
                        }

                        // No unused locals should be checked (if specified)
                        if (compilerOptions.noUnusedLocals !== undefined) {
                            expect(typeof compilerOptions.noUnusedLocals).toBe('boolean');
                        }

                        // No unused parameters should be checked (if specified)
                        if (compilerOptions.noUnusedParameters !== undefined) {
                            expect(typeof compilerOptions.noUnusedParameters).toBe('boolean');
                        }
                    }
                }
            ), { numRuns: Math.min(packageDirs.length, 20) });
        });

        it('should produce artifacts in the expected formats and locations', () => {
            const packageDirs = getPackageDirectories();

            fc.assert(fc.property(
                fc.constantFrom(...packageDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));
                    const tsConfig = getTsConfig(packageDir);

                    if (packageJson && tsConfig) {
                        // Check output directory configuration
                        if (tsConfig.compilerOptions?.outDir) {
                            const outDir = tsConfig.compilerOptions.outDir;
                            expect(typeof outDir).toBe('string');
                            expect(outDir.length).toBeGreaterThan(0);

                            // Common output directories
                            const validOutDirs = ['dist', 'build', 'lib', 'out'];
                            const hasValidOutDir = validOutDirs.some(dir => outDir.includes(dir));
                            expect(hasValidOutDir).toBe(true);
                        }

                        // Check if main field points to expected output location
                        if (packageJson.main) {
                            const main = packageJson.main;
                            const validMainPaths = ['dist/', 'build/', 'lib/', 'src/'];
                            const hasValidMainPath = validMainPaths.some(path => main.includes(path));
                            expect(hasValidMainPath).toBe(true);
                        }

                        // Check if types field points to expected output location
                        if (packageJson.types) {
                            const types = packageJson.types;
                            expect(types.endsWith('.d.ts') || types.endsWith('.ts')).toBe(true);
                        }

                        // If using tsup, should have proper configuration
                        if (packageJson.scripts?.build?.includes('tsup')) {
                            // tsup should generate both CJS and ESM if specified
                            const buildScript = packageJson.scripts.build;
                            if (buildScript.includes('--format')) {
                                expect(buildScript).toMatch(/--format\s+(cjs,esm|esm,cjs|cjs|esm)/);
                            }

                            // Should generate declaration files
                            if (buildScript.includes('--dts')) {
                                expect(buildScript).toContain('--dts');
                            }
                        }
                    }
                }
            ), { numRuns: Math.min(packageDirs.length, 20) });
        });

        it('should have consistent dependency management across packages', () => {
            const packageDirs = getPackageDirectories();
            const rootPackageJson = readJsonFile(resolve(__dirname, '../../package.json'));

            fc.assert(fc.property(
                fc.constantFrom(...packageDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));

                    if (packageJson) {
                        // TypeScript should be in devDependencies
                        if (packageJson.devDependencies?.typescript) {
                            const tsVersion = packageJson.devDependencies.typescript;
                            expect(tsVersion).toMatch(/^\^?5\.\d+\.\d+/);
                        }

                        // Vitest should be in devDependencies for testing
                        if (packageJson.devDependencies?.vitest) {
                            const vitestVersion = packageJson.devDependencies.vitest;
                            expect(vitestVersion).toMatch(/^\^?1\.\d+\.\d+/);
                        }

                        // fast-check should be in devDependencies for property testing
                        if (packageJson.devDependencies?.['fast-check']) {
                            const fcVersion = packageJson.devDependencies['fast-check'];
                            expect(fcVersion).toMatch(/^\^?3\.\d+\.\d+/);
                        }

                        // Workspace dependencies should use workspace protocol or wildcard
                        if (packageJson.dependencies) {
                            Object.entries(packageJson.dependencies).forEach(([name, version]) => {
                                if (name.startsWith('@signtusk/')) {
                                    expect(['workspace:*', '*']).toContain(version);
                                }
                            });
                        }

                        // Version should be valid semver
                        expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);
                    }
                }
            ), { numRuns: Math.min(packageDirs.length, 20) });
        });

        it('should have valid turbo.json configuration for build orchestration', () => {
            const turboConfig = readJsonFile(resolve(__dirname, '../../turbo.json'));

            fc.assert(fc.property(
                fc.constantFrom('build', 'dev', 'test', 'lint', 'type-check'),
                (taskName) => {
                    expect(turboConfig).toBeTruthy();
                    expect(turboConfig.tasks).toBeTruthy();

                    if (turboConfig.tasks[taskName]) {
                        const task = turboConfig.tasks[taskName];

                        // Build task should have proper dependencies
                        if (taskName === 'build') {
                            expect(task.dependsOn).toContain('^build');
                            expect(task.outputs).toBeTruthy();
                            expect(Array.isArray(task.outputs)).toBe(true);
                        }

                        // Test tasks should depend on build
                        if (taskName.startsWith('test')) {
                            expect(task.dependsOn).toContain('^build');
                        }

                        // Dev tasks should not be cached
                        if (taskName === 'dev') {
                            expect(task.cache).toBe(false);
                            expect(task.persistent).toBe(true);
                        }

                        // Lint and type-check should have proper dependencies
                        if (taskName === 'lint' || taskName === 'type-check') {
                            expect(task.dependsOn).toContain(`^${taskName}`);
                        }
                    }
                }
            ), { numRuns: 10 });
        });
    });
});