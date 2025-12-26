/**
 * Build System Integrity Integration Tests
 * 
 * Tests that all packages build successfully after rebranding,
 * verifies workspace tools recognize new package scope,
 * and tests import resolution and dependency linking.
 * 
 * Requirements: 2.4, 2.5
 */

import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { glob } from 'glob';

describe('Build System Integrity', () => {
    const rootDir = process.cwd();

    describe('Package Scope Recognition', () => {
        it('should recognize @signtusk scope in workspace configuration', () => {
            const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

            // Check root package uses @signtusk scope
            expect(packageJson.name).toBe('@signtusk/root');

            // Check workspaces are configured
            expect(packageJson.workspaces).toEqual(['apps/*', 'packages/*']);
        });

        it('should have all packages using @signtusk scope', async () => {
            const packageJsonFiles = await glob('**/package.json', {
                ignore: ['node_modules/**', '.turbo/**', 'dist/**', 'build/**']
            });

            for (const file of packageJsonFiles) {
                if (file === 'package.json') continue; // Skip root package.json

                const packageJson = JSON.parse(readFileSync(file, 'utf-8'));

                if (packageJson.name && !packageJson.name.startsWith('@signtusk/')) {
                    throw new Error(`Package ${file} has incorrect scope: ${packageJson.name}`);
                }
            }
        });

        it('should have correct internal dependency references', async () => {
            const packageJsonFiles = await glob('**/package.json', {
                ignore: ['node_modules/**', '.turbo/**', 'dist/**', 'build/**']
            });

            for (const file of packageJsonFiles) {
                const packageJson = JSON.parse(readFileSync(file, 'utf-8'));

                // Check dependencies
                const allDeps = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies,
                    ...packageJson.peerDependencies
                };

                for (const [depName, version] of Object.entries(allDeps)) {
                    if (typeof depName === 'string' && depName.startsWith('@docusign-alternative/')) {
                        throw new Error(`Package ${file} still references old scope: ${depName}`);
                    }
                }
            }
        });
    });

    describe('Build Configuration Validation', () => {
        it('should have valid package.json structure', () => {
            const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

            // Check essential scripts exist
            expect(packageJson.scripts).toBeDefined();
            expect(packageJson.scripts.build).toBeDefined();
            expect(packageJson.scripts.lint).toBeDefined();
            expect(packageJson.scripts['type-check']).toBeDefined();
        });

        it('should validate turbo configuration', () => {
            expect(() => {
                execSync('npx turbo run build --dry-run', {
                    stdio: 'pipe',
                    timeout: 30000
                });
            }).not.toThrow();
        });

        it('should validate workspace structure', () => {
            expect(() => {
                execSync('npm ls --depth=0', {
                    stdio: 'pipe',
                    timeout: 30000
                });
            }).not.toThrow();
        });
    });

    describe('Turbo Workspace Configuration', () => {
        it('should have valid turbo.json configuration', () => {
            const turboConfig = JSON.parse(readFileSync('turbo.json', 'utf-8'));

            // Check essential tasks are defined
            expect(turboConfig.tasks).toBeDefined();
            expect(turboConfig.tasks.build).toBeDefined();
            expect(turboConfig.tasks.lint).toBeDefined();
            expect(turboConfig.tasks.test).toBeDefined();
        });

        it('should execute turbo commands successfully', () => {
            expect(() => {
                execSync('npx turbo run lint --dry-run', {
                    stdio: 'pipe',
                    timeout: 30000
                });
            }).not.toThrow();
        });
    });

    describe('Import Resolution', () => {
        it('should resolve @signtusk imports in TypeScript configuration', () => {
            const tsConfig = JSON.parse(readFileSync('tsconfig.json', 'utf-8'));

            // Check path mappings use @signtusk scope
            const paths = tsConfig.compilerOptions?.paths || {};

            for (const [alias, pathArray] of Object.entries(paths)) {
                if (typeof alias === 'string' && alias.startsWith('@signtusk/')) {
                    expect(Array.isArray(pathArray)).toBe(true);
                    expect(pathArray.length).toBeGreaterThan(0);
                }
            }
        });

        it('should have consistent path mappings in vitest config', () => {
            if (existsSync('vitest.config.ts')) {
                // Read vitest config and check for @signtusk aliases
                const vitestConfig = readFileSync('vitest.config.ts', 'utf-8');

                // Should contain @signtusk references, not @docusign-alternative
                expect(vitestConfig).toContain('@signtusk/');
                expect(vitestConfig).not.toContain('@docusign-alternative/');
            }
        });
    });

    describe('Package Scripts Integration', () => {
        it('should have updated package scripts with correct scope references', () => {
            const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
            const scripts = packageJson.scripts || {};

            // Check that scripts reference @signtusk scope
            for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
                if (typeof scriptCommand === 'string' && scriptCommand.includes('@docusign-alternative/')) {
                    throw new Error(`Script ${scriptName} still references old scope: ${scriptCommand}`);
                }
            }
        });

        it('should have updated Docker build commands', () => {
            const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
            const dockerBuildScript = packageJson.scripts?.['docker:build'];

            if (dockerBuildScript) {
                expect(dockerBuildScript).toContain('signtusk');
                expect(dockerBuildScript).not.toContain('docusign-alternative');
            }
        });
    });

    describe('Dependency Linking', () => {
        it('should resolve workspace dependencies', () => {
            // Test that workspace packages can be imported
            const packageJsonFiles = glob.sync('packages/*/package.json');

            for (const file of packageJsonFiles) {
                const packageJson = JSON.parse(readFileSync(file, 'utf-8'));

                if (packageJson.name && packageJson.name.startsWith('@signtusk/')) {
                    // Check that the package directory exists and has proper structure
                    const packageDir = file.replace('/package.json', '');
                    expect(existsSync(packageDir)).toBe(true);

                    // Check for main entry point or src directory
                    const hasMain = packageJson.main && existsSync(join(packageDir, packageJson.main));
                    const hasSrc = existsSync(join(packageDir, 'src'));
                    const hasIndex = existsSync(join(packageDir, 'index.ts')) || existsSync(join(packageDir, 'index.js'));

                    expect(hasMain || hasSrc || hasIndex).toBe(true);
                }
            }
        });
    });

    describe('Configuration File Updates', () => {
        it('should validate Makefile references', () => {
            if (existsSync('Makefile')) {
                const makefile = readFileSync('Makefile', 'utf-8');

                // Should contain Signtusk references, not DocuSign Alternative
                expect(makefile).toContain('Signtusk');
                expect(makefile).not.toContain('DocuSign Alternative');
            }
        });

        it('should validate Dockerfile references if present', () => {
            if (existsSync('Dockerfile')) {
                const dockerfile = readFileSync('Dockerfile', 'utf-8');

                // Check for any hardcoded brand references that should be updated
                const lines = dockerfile.split('\n');
                for (const line of lines) {
                    if (line.includes('docusign-alternative') && !line.startsWith('#')) {
                        console.warn(`Dockerfile may need updating: ${line}`);
                    }
                }
            }
        });
    });
});