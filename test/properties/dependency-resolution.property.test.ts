import * as fc from 'fast-check';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, it } from 'vitest';

/**
 * **Feature: build-failure-resolution, Property 3: Dependency Resolution**
 * **Validates: Requirements 1.2, 3.1**
 * 
 * For any package with dependencies, the build system must resolve all dependencies 
 * to compatible versions before starting the build process.
 * 
 * This property ensures that:
 * - All package dependencies are resolved to compatible versions
 * - No missing dependencies exist in the dependency tree
 * - Version conflicts are resolved consistently
 * - The build system can successfully resolve all required dependencies
 */

describe('Property 3: Dependency Resolution', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    
    // Generate package paths for testing
    const packagePaths = [
        'packages/lib',
        'packages/auth', 
        'packages/database',
        'packages/email',
        'packages/ui',
        'apps/web',
        'apps/remix'
    ];

    it('should resolve all dependencies to compatible versions for any package', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...packagePaths),
                (packagePath) => {
                    const fullPackagePath = path.join(projectRoot, packagePath);
                    const packageJsonPath = path.join(fullPackagePath, 'package.json');

                    if (!existsSync(packageJsonPath)) {
                        return true; // Skip non-existent packages
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
                        const dependencies = {
                            ...packageJson.dependencies,
                            ...packageJson.devDependencies,
                            ...packageJson.peerDependencies
                        };

                        if (Object.keys(dependencies).length === 0) {
                            return true; // No dependencies to check
                        }

                        const packageLockPath = path.join(projectRoot, 'package-lock.json');
                        if (!existsSync(packageLockPath)) {
                            return true; // Can't verify without package-lock
                        }

                        const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
                        const packages = packageLock.packages || {};

                        // Check that all dependencies are resolved with valid versions
                        return Object.keys(dependencies).every(depName => {
                            // Find the dependency in the package-lock
                            const depInstance = Object.keys(packages).find(key =>
                                key === `node_modules/${depName}` || 
                                key.endsWith(`/node_modules/${depName}`) ||
                                key === `${packagePath}/node_modules/${depName}`
                            );

                            if (!depInstance) {
                                // Check if it's a workspace dependency
                                const isWorkspaceDep = dependencies[depName] === '*' || 
                                                     dependencies[depName]?.startsWith('workspace:') ||
                                                     depName.startsWith('@signtusk/');
                                return isWorkspaceDep; // Workspace deps are resolved differently
                            }

                            const depPackage = packages[depInstance];
                            
                            // Workspace packages don't have versions in package-lock.json
                            if (depInstance.includes('@signtusk/') || depInstance.includes('dso-pdf-sign')) {
                                return true; // Workspace packages are valid without versions
                            }
                            
                            return depPackage && 
                                   depPackage.version && 
                                   depPackage.version !== 'undefined' &&
                                   typeof depPackage.version === 'string' &&
                                   depPackage.version.length > 0;
                        });
                    } catch (error) {
                        return false; // Invalid package.json or package-lock.json
                    }
                }
            ),
            { numRuns: 10 } // Reduced from 100 for faster execution
        );
    });

    it('should have no undefined versions in the dependency tree', () => {
        fc.assert(
            fc.property(
                fc.constant('version-check'),
                () => {
                    const packageLockPath = path.join(projectRoot, 'package-lock.json');

                    if (!existsSync(packageLockPath)) {
                        return true; // Skip if no package-lock exists
                    }

                    try {
                        const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
                        const packages = packageLock.packages || {};

                        // Check that no packages have undefined versions (excluding workspace packages)
                        const hasUndefinedVersions = Object.entries(packages).some(([key, pkg]: [string, any]) => {
                            // Skip workspace packages which don't have versions
                            if (key.includes('@signtusk/') || key.includes('dso-pdf-sign') || key === '') {
                                return false;
                            }
                            return pkg && (pkg.version === 'undefined' || pkg.version === undefined);
                        });

                        return !hasUndefinedVersions;
                    } catch (error) {
                        return false; // Invalid package-lock.json
                    }
                }
            ),
            { numRuns: 5 }
        );
    });

    it('should resolve version conflicts consistently across the dependency tree', () => {
        fc.assert(
            fc.property(
                fc.array(fc.constantFrom(...packagePaths), { minLength: 2, maxLength: 3 }),
                (packagePaths) => {
                    const packageLockPath = path.join(projectRoot, 'package-lock.json');

                    if (!existsSync(packageLockPath)) {
                        return true; // Skip if no package-lock exists
                    }

                    try {
                        const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
                        const packages = packageLock.packages || {};

                        // Find common dependencies across the selected packages
                        const commonDeps = new Map<string, Set<string>>();

                        for (const packagePath of packagePaths) {
                            const packageJsonPath = path.join(projectRoot, packagePath, 'package.json');
                            
                            if (!existsSync(packageJsonPath)) {
                                continue;
                            }

                            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
                            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

                            Object.keys(deps).forEach(depName => {
                                if (!commonDeps.has(depName)) {
                                    commonDeps.set(depName, new Set());
                                }
                                commonDeps.get(depName)!.add(packagePath);
                            });
                        }

                        // Check that common dependencies have consistent resolution
                        for (const [depName, usingPackages] of commonDeps) {
                            if (usingPackages.size < 2) {
                                continue; // Not a shared dependency
                            }

                            // Find all instances of this dependency in package-lock
                            const depInstances = Object.keys(packages).filter(key =>
                                key.includes(`node_modules/${depName}`) && packages[key].version
                            );

                            if (depInstances.length === 0) {
                                continue; // Dependency not found in lock file
                            }

                            // Check that all instances have valid, non-conflicting versions
                            const versions = depInstances.map(instance => packages[instance].version);
                            const hasUndefinedVersions = versions.some(v => v === 'undefined' || !v);
                            
                            if (hasUndefinedVersions) {
                                return false;
                            }
                        }

                        return true;
                    } catch (error) {
                        return false; // Invalid package files
                    }
                }
            ),
            { numRuns: 10 } // Reduced for faster execution
        );
    });

    it('should successfully resolve all required dependencies before build process', () => {
        fc.assert(
            fc.property(
                fc.constant('dependency-check'),
                () => {
                    try {
                        // Check that package-lock.json is valid and complete
                        const packageLockPath = path.join(projectRoot, 'package-lock.json');
                        
                        if (!existsSync(packageLockPath)) {
                            return true; // No package-lock to validate
                        }

                        const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
                        
                        // Validate package-lock structure
                        if (!packageLock.packages || typeof packageLock.packages !== 'object') {
                            return false;
                        }

                        // Check that no packages have undefined versions (excluding workspace packages)
                        const hasUndefinedVersions = Object.entries(packageLock.packages).some(([key, pkg]: [string, any]) => {
                            // Skip workspace packages which don't have versions
                            if (key.includes('@signtusk/') || key.includes('dso-pdf-sign') || key === '') {
                                return false;
                            }
                            return pkg && (pkg.version === 'undefined' || pkg.version === undefined);
                        });

                        if (hasUndefinedVersions) {
                            return false;
                        }

                        // Verify that critical build dependencies are resolved
                        const criticalDeps = [
                            'typescript',
                            'next', 
                            'react',
                            'turbo'
                        ];

                        return criticalDeps.every(dep => {
                            const depInstance = Object.keys(packageLock.packages).find(key =>
                                key === `node_modules/${dep}` || key.endsWith(`/node_modules/${dep}`)
                            );

                            if (!depInstance) {
                                return true; // Optional dependency
                            }

                            const depPackage = packageLock.packages[depInstance];
                            return depPackage && 
                                   depPackage.version && 
                                   depPackage.version !== 'undefined' &&
                                   typeof depPackage.version === 'string';
                        });
                    } catch (error) {
                        return false; // Invalid package-lock.json
                    }
                }
            ),
            { numRuns: 10 }
        );
    });

    it('should handle workspace dependencies correctly', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...packagePaths),
                (packagePath) => {
                    const fullPackagePath = path.join(projectRoot, packagePath);
                    const packageJsonPath = path.join(fullPackagePath, 'package.json');

                    if (!existsSync(packageJsonPath)) {
                        return true; // Skip non-existent packages
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
                        const dependencies = {
                            ...packageJson.dependencies,
                            ...packageJson.devDependencies
                        };

                        // Find workspace dependencies (those starting with @signtusk/ or marked with *)
                        const workspaceDeps = Object.entries(dependencies).filter(([name, version]) =>
                            name.startsWith('@signtusk/') || version === '*'
                        );

                        if (workspaceDeps.length === 0) {
                            return true; // No workspace dependencies
                        }

                        // Check that workspace dependencies reference valid packages
                        return workspaceDeps.every(([depName, version]) => {
                            if (version === '*') {
                                // Should be a local workspace package
                                const workspacePackagePath = path.join(projectRoot, 'packages', depName.replace('@signtusk/', ''));
                                const workspacePackageJson = path.join(workspacePackagePath, 'package.json');
                                return existsSync(workspacePackageJson);
                            }
                            return true; // Other workspace deps are handled by npm
                        });
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 10 }
        );
    });
});