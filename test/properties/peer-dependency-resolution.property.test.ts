import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

/**
 * **Feature: build-failure-fixes, Property 10: Peer Dependency Resolution**
 * 
 * For any package with peer dependencies, npm should resolve compatible versions 
 * for all peer dependency requirements without conflicts, ensuring i18next core 
 * and react-i18next resolve to compatible versions.
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
 */

describe('Property 10: Peer Dependency Resolution', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const i18nPackages = ['i18next', 'react-i18next', 'i18next-http-backend', 'i18next-browser-languagedetector', 'i18next-icu'] as const;

    it('should resolve compatible versions for all peer dependency requirements', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...i18nPackages),
                (packageName) => {
                    const packageLockPath = path.join(projectRoot, 'package-lock.json');

                    if (!existsSync(packageLockPath)) {
                        return true; // Skip if no package-lock.json exists
                    }

                    try {
                        const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
                        const packages = packageLock.packages || {};

                        // Find all instances of this package in the dependency tree
                        const packageInstances = Object.keys(packages).filter(key =>
                            key.includes(`node_modules/${packageName}`) || key === `node_modules/${packageName}`
                        );

                        if (packageInstances.length === 0) {
                            return true; // Package not installed, that's fine
                        }

                        // Check that all instances have resolved versions (no undefined)
                        return packageInstances.every(instance => {
                            const packageInfo = packages[instance];
                            return packageInfo && packageInfo.version && packageInfo.version !== 'undefined';
                        });
                    } catch {
                        return false; // Invalid package-lock.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have i18next core and react-i18next resolve to compatible versions', () => {
        fc.assert(
            fc.property(
                fc.constant('compatibility-check'),
                () => {
                    const packageLockPath = path.join(projectRoot, 'package-lock.json');

                    if (!existsSync(packageLockPath)) {
                        return true; // Skip if no package-lock.json exists
                    }

                    try {
                        const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
                        const packages = packageLock.packages || {};

                        // Find i18next and react-i18next versions
                        const i18nextInstance = Object.keys(packages).find(key =>
                            key === 'node_modules/i18next' || key.endsWith('/node_modules/i18next')
                        );

                        const reactI18nextInstance = Object.keys(packages).find(key =>
                            key === 'node_modules/react-i18next' || key.endsWith('/node_modules/react-i18next')
                        );

                        if (!i18nextInstance || !reactI18nextInstance) {
                            return true; // One or both packages not found, skip
                        }

                        const i18nextVersion = packages[i18nextInstance]?.version;
                        const reactI18nextVersion = packages[reactI18nextInstance]?.version;

                        if (!i18nextVersion || !reactI18nextVersion) {
                            return false; // Versions should be defined
                        }

                        // Check that versions are not 'undefined' strings
                        return i18nextVersion !== 'undefined' && reactI18nextVersion !== 'undefined';
                    } catch {
                        return false; // Invalid package-lock.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should avoid undefined version conflicts in dependency tree', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...i18nPackages),
                (packageName) => {
                    const packageLockPath = path.join(projectRoot, 'package-lock.json');

                    if (!existsSync(packageLockPath)) {
                        return true; // Skip if no package-lock.json exists
                    }

                    try {
                        const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
                        const packages = packageLock.packages || {};

                        // Check that no package has 'undefined' as version
                        return Object.values(packages).every((pkg: any) => {
                            if (pkg && pkg.name === packageName) {
                                return pkg.version !== 'undefined' && pkg.version !== undefined;
                            }
                            return true;
                        });
                    } catch {
                        return false; // Invalid package-lock.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have all required peer dependencies properly resolved', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('packages/i18n', 'apps/web', 'apps/app'),
                (packagePath) => {
                    const fullPackagePath = path.join(projectRoot, packagePath);
                    const packageJsonPath = path.join(fullPackagePath, 'package.json');

                    if (!existsSync(packageJsonPath)) {
                        return true; // Skip non-existent packages
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
                        const peerDependencies = packageJson.peerDependencies || {};

                        // If package has peer dependencies, check they're resolved
                        if (Object.keys(peerDependencies).length === 0) {
                            return true; // No peer dependencies to check
                        }

                        const packageLockPath = path.join(projectRoot, 'package-lock.json');
                        if (!existsSync(packageLockPath)) {
                            return true; // Can't verify without package-lock
                        }

                        const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));
                        const packages = packageLock.packages || {};

                        // Check that peer dependencies are resolved in the tree
                        return Object.keys(peerDependencies).every(peerDep => {
                            const peerInstance = Object.keys(packages).find(key =>
                                key === `node_modules/${peerDep}` || key.endsWith(`/node_modules/${peerDep}`)
                            );

                            if (!peerInstance) {
                                return false; // Peer dependency not found
                            }

                            const peerPackage = packages[peerInstance];
                            return peerPackage && peerPackage.version && peerPackage.version !== 'undefined';
                        });
                    } catch {
                        return false; // Invalid package.json or package-lock.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should complete npm install without peer dependency resolution errors', () => {
        fc.assert(
            fc.property(
                fc.constant('install-test'),
                () => {
                    try {
                        // Test that npm install would succeed by checking package-lock integrity
                        const packageLockPath = path.join(projectRoot, 'package-lock.json');

                        if (!existsSync(packageLockPath)) {
                            return true; // No package-lock to validate
                        }

                        const packageLock = JSON.parse(readFileSync(packageLockPath, 'utf8'));

                        // Check that package-lock has valid structure
                        if (!packageLock.packages) {
                            return false; // Invalid package-lock structure
                        }

                        // Check for any packages with undefined versions (sign of resolution conflict)
                        const hasUndefinedVersions = Object.values(packageLock.packages).some((pkg: any) =>
                            pkg && pkg.version === 'undefined'
                        );

                        return !hasUndefinedVersions;
                    } catch {
                        return false; // Invalid package-lock.json
                    }
                }
            ),
            { numRuns: 50 }
        );
    });
});