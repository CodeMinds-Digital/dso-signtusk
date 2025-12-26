/**
 * Integration Tests for Workspace Functionality
 * 
 * Tests package installation and linking, monorepo workspace recognition,
 * and dependency resolution after scope changes.
 * 
 * Requirements: 2.5
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Workspace Functionality Integration', () => {
    describe('Package Installation and Linking', () => {
        it('should have all workspace packages using @signtusk scope', () => {
            const packageJson = JSON.parse(
                readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
            );

            // Check that root package uses @signtusk scope
            expect(packageJson.name).toMatch(/@signtusk\//);

            // Check workspaces configuration
            expect(packageJson.workspaces).toBeDefined();
            expect(Array.isArray(packageJson.workspaces)).toBe(true);
        });

        it('should have correct internal dependency references', () => {
            // Check a few key packages for correct internal dependencies
            const packagesToCheck = [
                'packages/lib/package.json',
                'packages/database/package.json',
                'apps/remix/package.json'
            ];

            packagesToCheck.forEach(packagePath => {
                const fullPath = join(process.cwd(), packagePath);
                if (existsSync(fullPath)) {
                    const packageJson = JSON.parse(
                        readFileSync(fullPath, 'utf-8')
                    );

                    // Check dependencies for correct scope
                    const allDeps = {
                        ...packageJson.dependencies,
                        ...packageJson.devDependencies,
                        ...packageJson.peerDependencies
                    };

                    Object.keys(allDeps).forEach(depName => {
                        if (depName.startsWith('@signtusk/') || depName.startsWith('@docusign-alternative/')) {
                            // Should use @signtusk scope, not old scope
                            expect(depName).toMatch(/^@signtusk\//);
                            expect(depName).not.toMatch(/@docusign-alternative/);
                        }
                    });
                }
            });
        });
    });

    describe('Monorepo Workspace Recognition', () => {
        it('should have valid turbo.json configuration', () => {
            const turboConfigPath = join(process.cwd(), 'turbo.json');
            expect(existsSync(turboConfigPath)).toBe(true);

            const turboConfig = JSON.parse(
                readFileSync(turboConfigPath, 'utf-8')
            );

            // Should have tasks configuration (new turbo format)
            expect(turboConfig.tasks || turboConfig.pipeline).toBeDefined();

            // Should have build task
            const tasks = turboConfig.tasks || turboConfig.pipeline;
            expect(tasks.build).toBeDefined();
        });

        it('should have consistent package naming across workspace', () => {
            const workspaces = [
                'packages/lib/package.json',
                'packages/database/package.json',
                'packages/auth/package.json',
                'packages/ui/package.json'
            ];

            workspaces.forEach(workspacePath => {
                const fullPath = join(process.cwd(), workspacePath);
                if (existsSync(fullPath)) {
                    const packageJson = JSON.parse(
                        readFileSync(fullPath, 'utf-8')
                    );

                    // Should use @signtusk scope
                    expect(packageJson.name).toMatch(/^@signtusk\//);
                    expect(packageJson.name).not.toMatch(/@docusign-alternative/);
                }
            });
        });
    });

    describe('Dependency Resolution After Scope Changes', () => {
        it('should resolve TypeScript path mappings correctly', () => {
            const tsconfigPath = join(process.cwd(), 'tsconfig.json');
            if (existsSync(tsconfigPath)) {
                const tsconfig = JSON.parse(
                    readFileSync(tsconfigPath, 'utf-8')
                );

                if (tsconfig.compilerOptions?.paths) {
                    const paths = tsconfig.compilerOptions.paths;

                    // Should have @signtusk/* mappings
                    const signTuskPaths = Object.keys(paths).filter(key =>
                        key.startsWith('@signtusk/')
                    );
                    expect(signTuskPaths.length).toBeGreaterThan(0);

                    // Should not have old scope mappings
                    const oldPaths = Object.keys(paths).filter(key =>
                        key.startsWith('@docusign-alternative/')
                    );
                    expect(oldPaths.length).toBe(0);
                }
            }
        });

        it('should have workspace packages with consistent versions', () => {
            // Test that workspace packages have consistent internal versions
            const rootPackage = JSON.parse(
                readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
            );

            // Should have workspaces defined
            expect(rootPackage.workspaces).toBeDefined();

            // Should use consistent versioning strategy
            if (rootPackage.version) {
                expect(rootPackage.version).toMatch(/^\d+\.\d+\.\d+/);
            }
        });

        it('should have npm scripts that reference correct scopes', () => {
            const packageJson = JSON.parse(
                readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
            );

            if (packageJson.scripts) {
                const scriptContent = JSON.stringify(packageJson.scripts);

                // Should not reference old scope in scripts
                expect(scriptContent).not.toMatch(/@docusign-alternative/);

                // Should have common workspace scripts
                expect(packageJson.scripts.build).toBeDefined();
                expect(packageJson.scripts.test).toBeDefined();
            }
        });
    });

    describe('Package Configuration Validation', () => {
        it('should have all packages properly configured', () => {
            // Check that key packages exist and are properly configured
            const keyPackages = [
                'packages/lib',
                'packages/database',
                'packages/prisma',
                'apps/remix'
            ];

            keyPackages.forEach(packageDir => {
                const packageJsonPath = join(process.cwd(), packageDir, 'package.json');
                if (existsSync(packageJsonPath)) {
                    const packageJson = JSON.parse(
                        readFileSync(packageJsonPath, 'utf-8')
                    );

                    // Should have name
                    expect(packageJson.name).toBeDefined();
                    expect(packageJson.name).toMatch(/^@signtusk\//);

                    // Should have version
                    expect(packageJson.version).toBeDefined();

                    // Should have scripts
                    expect(packageJson.scripts).toBeDefined();
                }
            });
        });

        it('should have consistent dependency patterns', () => {
            // Check that packages follow consistent dependency patterns
            const packageJsonPath = join(process.cwd(), 'packages/lib/package.json');
            if (existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(
                    readFileSync(packageJsonPath, 'utf-8')
                );

                // Lib package should be foundational
                expect(packageJson.name).toBe('@signtusk/lib');

                // Should have minimal external dependencies
                if (packageJson.dependencies) {
                    const internalDeps = Object.keys(packageJson.dependencies)
                        .filter(dep => dep.startsWith('@signtusk/'));

                    // Lib should have few internal dependencies
                    expect(internalDeps.length).toBeLessThan(5);
                }
            }
        });
    });
});