/**
 * Package Configuration Validity Property-Based Tests
 * 
 * **Feature: build-failure-fixes, Property 7: Package Configuration Validity**
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
 * 
 * Tests that package.json configurations are valid and complete across all packages,
 * ensuring dependency declarations, build scripts, export configurations, workspace
 * dependencies, and package metadata are properly configured.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { createRequire } from 'module';

// Helper function to get all package directories
function getPackageDirectories(): string[] {
    const packagesDir = resolve(__dirname, '../../packages');
    if (!existsSync(packagesDir)) return [];

    return readdirSync(packagesDir)
        .map(name => join(packagesDir, name))
        .filter(path => statSync(path).isDirectory())
        .filter(path => existsSync(join(path, 'package.json')))
        .filter(path => {
            // Exclude tsconfig package from configuration tests since it's config-only
            const packageJson = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'));
            return packageJson.name !== '@signtusk/tsconfig';
        });
}

// Helper function to get all app directories
function getAppDirectories(): string[] {
    const appsDir = resolve(__dirname, '../../apps');
    if (!existsSync(appsDir)) return [];

    return readdirSync(appsDir)
        .map(name => join(appsDir, name))
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

// Helper function to validate semver version
function isValidSemver(version: string): boolean {
    const semverRegex = /^(\^|~|>=|<=|>|<)?(\d+)\.(\d+)\.(\d+)(-[\w.-]+)?(\+[\w.-]+)?$/;
    return semverRegex.test(version) ||
        version === '*' ||
        version === 'latest' ||
        version.startsWith('workspace:') ||
        version.startsWith('file:') ||
        version.startsWith('git:') ||
        version.startsWith('http:') ||
        version.startsWith('https:');
}

// Helper function to check if a command exists
function commandExists(command: string): boolean {
    const require = createRequire(import.meta.url);
    try {
        require.resolve(command);
        return true;
    } catch {
        return false;
    }
}

describe('Package Configuration Validity', () => {
    /**
     * Property 7: Package Configuration Validity
     * For any package.json file, all dependency declarations, build scripts,
     * and export configurations should be valid and reference existing resources
     */
    describe('Property 7: Package Configuration Validity', () => {
        it('should contain valid dependency declarations with correct version ranges', () => {
            const allDirs = [...getPackageDirectories(), ...getAppDirectories()];

            fc.assert(fc.property(
                fc.constantFrom(...allDirs),
                (packageDir) => {
                    const packageJsonPath = join(packageDir, 'package.json');
                    const packageJson = readJsonFile(packageJsonPath);

                    expect(packageJson).toBeTruthy();

                    // Check dependencies
                    if (packageJson.dependencies) {
                        Object.entries(packageJson.dependencies).forEach(([name, version]) => {
                            expect(typeof name).toBe('string');
                            expect(name.length).toBeGreaterThan(0);
                            expect(typeof version).toBe('string');
                            expect(isValidSemver(version as string)).toBe(true);

                            // Package names should not contain invalid characters
                            expect(name).toMatch(/^[@a-z0-9][a-z0-9._/-]*$/);
                        });
                    }

                    // Check devDependencies
                    if (packageJson.devDependencies) {
                        Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
                            expect(typeof name).toBe('string');
                            expect(name.length).toBeGreaterThan(0);
                            expect(typeof version).toBe('string');
                            expect(isValidSemver(version as string)).toBe(true);

                            // Package names should not contain invalid characters
                            expect(name).toMatch(/^[@a-z0-9][a-z0-9._/-]*$/);
                        });
                    }

                    // Check peerDependencies
                    if (packageJson.peerDependencies) {
                        Object.entries(packageJson.peerDependencies).forEach(([name, version]) => {
                            expect(typeof name).toBe('string');
                            expect(name.length).toBeGreaterThan(0);
                            expect(typeof version).toBe('string');
                            expect(isValidSemver(version as string)).toBe(true);
                        });
                    }
                }
            ), { numRuns: Math.min(allDirs.length, 20) });
        });

        it('should reference existing and executable build commands', () => {
            const allDirs = [...getPackageDirectories(), ...getAppDirectories()];

            fc.assert(fc.property(
                fc.constantFrom(...allDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));

                    if (packageJson?.scripts) {
                        Object.entries(packageJson.scripts).forEach(([scriptName, scriptCommand]) => {
                            expect(typeof scriptName).toBe('string');
                            expect(scriptName.length).toBeGreaterThan(0);
                            expect(typeof scriptCommand).toBe('string');
                            expect((scriptCommand as string).length).toBeGreaterThan(0);

                            // Script names should be valid
                            expect(scriptName).toMatch(/^[a-z0-9][a-z0-9:_-]*$/);

                            // Common build tools should be recognizable
                            const command = (scriptCommand as string).split(' ')[0];
                            const validCommands = [
                                'tsc', 'tsup', 'vite', 'webpack', 'rollup', 'esbuild',
                                'next', 'nuxt', 'remix', 'astro', 'svelte-kit',
                                'npm', 'yarn', 'pnpm', 'node', 'npx', 'turbo',
                                'vitest', 'jest', 'playwright', 'eslint', 'prettier',
                                'concurrently', 'cross-env', 'rimraf', 'cp', 'mkdir',
                                'echo', 'cd', './scripts/dev-setup.sh', './scripts/dev-start.sh',
                                './scripts/dev-stop.sh', './scripts/dev-reset.sh',
                                './scripts/deploy-hybrid.sh', './scripts/health-check.sh',
                                'curl', 'docker-compose', 'docker', 'fly', 'railway',
                                'vercel', 'prisma', 'react-native', 'rm', 'xcodebuild',
                                'tsx', 'remix-serve', 'pact-broker', './gradlew', 'metro', 'pod',
                                'storybook'
                            ];

                            const isValidCommand = validCommands.some(validCmd =>
                                command === validCmd || command.endsWith(validCmd)
                            );
                            expect(isValidCommand).toBe(true);
                        });
                    }
                }
            ), { numRuns: Math.min(allDirs.length, 20) });
        });

        it('should specify correct file paths and export conditions', () => {
            const allDirs = [...getPackageDirectories(), ...getAppDirectories()];

            fc.assert(fc.property(
                fc.constantFrom(...allDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));

                    if (packageJson) {
                        // Check main field
                        if (packageJson.main) {
                            expect(typeof packageJson.main).toBe('string');
                            expect(packageJson.main.length).toBeGreaterThan(0);

                            // Should be a valid file path
                            expect(packageJson.main).toMatch(/\.(js|ts|mjs|cjs)$/);

                            // Should not start with /
                            expect(packageJson.main).not.toMatch(/^\//);
                        }

                        // Check types field
                        if (packageJson.types) {
                            expect(typeof packageJson.types).toBe('string');
                            expect(packageJson.types.length).toBeGreaterThan(0);

                            // Should be a TypeScript declaration file
                            expect(packageJson.types).toMatch(/\.d\.ts$|\.ts$/);

                            // Should not start with /
                            expect(packageJson.types).not.toMatch(/^\//);
                        }

                        // Check exports field
                        if (packageJson.exports) {
                            expect(typeof packageJson.exports).toBe('object');

                            // Should have main export
                            if (packageJson.exports['.']) {
                                const mainExport = packageJson.exports['.'];

                                if (typeof mainExport === 'string') {
                                    expect(mainExport).toMatch(/\.(js|ts|mjs|cjs)$/);
                                } else if (typeof mainExport === 'object') {
                                    // Check conditional exports
                                    if (mainExport.import) {
                                        expect(mainExport.import).toMatch(/\.(js|mjs|ts)$/);
                                    }
                                    if (mainExport.require) {
                                        expect(mainExport.require).toMatch(/\.(js|cjs|ts)$/);
                                    }
                                    if (mainExport.types) {
                                        expect(mainExport.types).toMatch(/\.d\.ts$|\.ts$/);
                                    }
                                }
                            }
                        }

                        // Check files field
                        if (packageJson.files) {
                            expect(Array.isArray(packageJson.files)).toBe(true);
                            packageJson.files.forEach((file: string) => {
                                expect(typeof file).toBe('string');
                                expect(file.length).toBeGreaterThan(0);
                                // Should not start with /
                                expect(file).not.toMatch(/^\//);
                            });
                        }
                    }
                }
            ), { numRuns: Math.min(allDirs.length, 20) });
        });

        it('should reference existing packages within the workspace', () => {
            const allDirs = [...getPackageDirectories(), ...getAppDirectories()];
            const allPackageNames = allDirs.map(dir => {
                const packageJson = readJsonFile(join(dir, 'package.json'));
                return packageJson?.name;
            }).filter(Boolean);

            fc.assert(fc.property(
                fc.constantFrom(...allDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));

                    if (packageJson) {
                        // Check workspace dependencies
                        const checkWorkspaceDeps = (deps: Record<string, string>) => {
                            Object.entries(deps).forEach(([name, version]) => {
                                if (name.startsWith('@signtusk/')) {
                                    // Should reference an existing package in the workspace
                                    expect(allPackageNames).toContain(name);

                                    // Should use workspace protocol, wildcard, or file reference
                                    expect(['workspace:*', '*', 'file:../database']).toContain(version);
                                }
                            });
                        };

                        if (packageJson.dependencies) {
                            checkWorkspaceDeps(packageJson.dependencies);
                        }

                        if (packageJson.devDependencies) {
                            checkWorkspaceDeps(packageJson.devDependencies);
                        }

                        if (packageJson.peerDependencies) {
                            Object.entries(packageJson.peerDependencies).forEach(([name, version]) => {
                                if (name.startsWith('@signtusk/')) {
                                    expect(allPackageNames).toContain(name);
                                }
                            });
                        }
                    }
                }
            ), { numRuns: Math.min(allDirs.length, 20) });
        });

        it('should provide complete and accurate package information', () => {
            const allDirs = [...getPackageDirectories(), ...getAppDirectories()];

            fc.assert(fc.property(
                fc.constantFrom(...allDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));

                    expect(packageJson).toBeTruthy();

                    // Required fields
                    expect(packageJson.name).toBeTruthy();
                    expect(typeof packageJson.name).toBe('string');
                    expect(packageJson.name.length).toBeGreaterThan(0);

                    expect(packageJson.version).toBeTruthy();
                    expect(typeof packageJson.version).toBe('string');
                    expect(isValidSemver(packageJson.version)).toBe(true);

                    // Name should follow npm naming conventions
                    expect(packageJson.name).toMatch(/^[@a-z0-9][a-z0-9._/-]*$/);

                    // Version should be valid semver
                    expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+/);

                    // Optional but recommended fields
                    if (packageJson.description) {
                        expect(typeof packageJson.description).toBe('string');
                        expect(packageJson.description.length).toBeGreaterThan(0);
                    }

                    if (packageJson.keywords) {
                        expect(Array.isArray(packageJson.keywords)).toBe(true);
                        packageJson.keywords.forEach((keyword: string) => {
                            expect(typeof keyword).toBe('string');
                            expect(keyword.length).toBeGreaterThan(0);
                        });
                    }

                    if (packageJson.author) {
                        expect(typeof packageJson.author === 'string' || typeof packageJson.author === 'object').toBe(true);
                    }

                    if (packageJson.license) {
                        expect(typeof packageJson.license).toBe('string');
                        expect(packageJson.license.length).toBeGreaterThan(0);
                    }

                    if (packageJson.repository) {
                        expect(typeof packageJson.repository === 'string' || typeof packageJson.repository === 'object').toBe(true);
                    }

                    // Private field should be boolean if present
                    if (packageJson.private !== undefined) {
                        expect(typeof packageJson.private).toBe('boolean');
                    }
                }
            ), { numRuns: Math.min(allDirs.length, 20) });
        });

        it('should have consistent engine requirements', () => {
            const allDirs = [...getPackageDirectories(), ...getAppDirectories()];
            const rootPackageJson = readJsonFile(resolve(__dirname, '../../package.json'));

            fc.assert(fc.property(
                fc.constantFrom(...allDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));

                    if (packageJson?.engines) {
                        // Node version should be consistent with root
                        if (packageJson.engines.node && rootPackageJson?.engines?.node) {
                            const nodeVersion = packageJson.engines.node;
                            expect(typeof nodeVersion).toBe('string');
                            expect(nodeVersion).toMatch(/>=?\d+(\.\d+(\.\d+)?)?/);

                            // Should be compatible with root requirement
                            const rootNodeVersion = rootPackageJson.engines.node;
                            if (rootNodeVersion.includes('>=18')) {
                                expect(nodeVersion).toMatch(/>=1[89]/);
                            }
                        }

                        // NPM version should be reasonable
                        if (packageJson.engines.npm) {
                            const npmVersion = packageJson.engines.npm;
                            expect(typeof npmVersion).toBe('string');
                            expect(npmVersion).toMatch(/>=?\d+\.\d+\.\d+/);
                        }
                    }
                }
            ), { numRuns: Math.min(allDirs.length, 20) });
        });

        it('should have valid script dependencies and cross-references', () => {
            const allDirs = [...getPackageDirectories(), ...getAppDirectories()];

            fc.assert(fc.property(
                fc.constantFrom(...allDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));

                    if (packageJson?.scripts) {
                        // Check for common script patterns
                        const scripts = packageJson.scripts;

                        // If there's a build script using tsc directly, there should be a type-check script
                        if (scripts.build && scripts.build === 'tsc') {
                            // Only require type-check if using tsc as the only build command
                            expect(scripts['type-check']).toBeTruthy();
                        }

                        // If there's a test script, it should be properly configured
                        if (scripts.test) {
                            const testScript = scripts.test;
                            expect(testScript).toMatch(/vitest|jest|playwright/);
                        }

                        // Dev scripts should not conflict with build scripts
                        if (scripts.dev && scripts.build) {
                            expect(scripts.dev).not.toBe(scripts.build);
                        }

                        // Lint script should use eslint or next lint if present
                        if (scripts.lint) {
                            expect(scripts.lint).toMatch(/eslint|next lint/);
                        }

                        // Scripts that reference other scripts should be valid
                        Object.values(scripts).forEach((script: any) => {
                            if (typeof script === 'string' && script.includes('npm run ')) {
                                const referencedScript = script.match(/npm run (\w+)/)?.[1];
                                if (referencedScript) {
                                    expect(scripts[referencedScript]).toBeTruthy();
                                }
                            }
                        });
                    }
                }
            ), { numRuns: Math.min(allDirs.length, 20) });
        });

        it('should have proper TypeScript configuration references', () => {
            const allDirs = [...getPackageDirectories(), ...getAppDirectories()];

            fc.assert(fc.property(
                fc.constantFrom(...allDirs),
                (packageDir) => {
                    const packageJson = readJsonFile(join(packageDir, 'package.json'));
                    const tsconfigPath = join(packageDir, 'tsconfig.json');

                    if (packageJson && existsSync(tsconfigPath)) {
                        const tsconfig = readJsonFile(tsconfigPath);

                        // If package uses TypeScript, should have proper configuration
                        if (packageJson.devDependencies?.typescript || packageJson.dependencies?.typescript) {
                            expect(tsconfig).toBeTruthy();

                            if (tsconfig.compilerOptions) {
                                // Should have proper module resolution
                                if (tsconfig.compilerOptions.moduleResolution) {
                                    expect(['bundler', 'node', 'node16', 'nodenext']).toContain(
                                        tsconfig.compilerOptions.moduleResolution
                                    );
                                }

                                // Should have proper target
                                if (tsconfig.compilerOptions.target) {
                                    expect(['ES2022', 'ES2021', 'ES2020', 'ESNext', 'es5', 'ES5']).toContain(
                                        tsconfig.compilerOptions.target
                                    );
                                }
                            }
                        }

                        // If package has build script with tsc, should have tsconfig
                        if (packageJson.scripts?.build?.includes('tsc')) {
                            expect(tsconfig).toBeTruthy();
                        }

                        // If package has type-check script, should have tsconfig
                        if (packageJson.scripts?.['type-check']) {
                            expect(tsconfig).toBeTruthy();
                        }
                    }
                }
            ), { numRuns: Math.min(allDirs.length, 20) });
        });
    });
});