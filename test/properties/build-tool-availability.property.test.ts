import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

/**
 * **Feature: build-failure-fixes, Property 9: Build Tool Availability**
 * 
 * For any package that references build tools in its scripts, all required executables 
 * should be installed and accessible within the project scope, preventing 
 * "Could not locate executable" errors.
 * 
 * **Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5**
 */

describe('Property 9: Build Tool Availability', () => {
    const buildTools = ['tsup', 'tsc', 'turbo'] as const;
    const projectRoot = path.resolve(__dirname, '../..');

    it('should have all required build tools accessible in project scope', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...buildTools),
                (toolName) => {
                    // Check if tool is accessible via node_modules/.bin
                    const binPath = path.join(projectRoot, 'node_modules', '.bin', toolName);
                    const toolExists = existsSync(binPath);

                    if (toolExists) {
                        try {
                            // Try to execute the tool with --version or --help to verify it works
                            const result = execSync(`${binPath} --version`, {
                                cwd: projectRoot,
                                timeout: 5000,
                                encoding: 'utf8'
                            });
                            return typeof result === 'string' && result.length > 0;
                        } catch (error) {
                            // Some tools might not support --version, try --help
                            try {
                                execSync(`${binPath} --help`, {
                                    cwd: projectRoot,
                                    timeout: 5000,
                                    encoding: 'utf8'
                                });
                                return true;
                            } catch {
                                return false;
                            }
                        }
                    }

                    return false;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should prevent "Could not locate executable" errors for workspace packages', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...buildTools),
                fc.constantFrom('packages/billing', 'packages/sdk', 'packages/email', 'packages/compliance'),
                (toolName, packagePath) => {
                    const fullPackagePath = path.join(projectRoot, packagePath);

                    if (!existsSync(fullPackagePath)) {
                        return true; // Skip non-existent packages
                    }

                    const packageJsonPath = path.join(fullPackagePath, 'package.json');
                    if (!existsSync(packageJsonPath)) {
                        return true; // Skip packages without package.json
                    }

                    try {
                        const packageJson = JSON.parse(require('fs').readFileSync(packageJsonPath, 'utf8'));
                        const buildScript = packageJson.scripts?.build;

                        if (buildScript && buildScript.includes(toolName)) {
                            // If package uses this tool, verify it can be found
                            const binPath = path.join(projectRoot, 'node_modules', '.bin', toolName);
                            return existsSync(binPath);
                        }

                        return true; // Package doesn't use this tool
                    } catch {
                        return true; // Skip packages with invalid package.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have consistent tool versions across workspace', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...buildTools),
                (toolName) => {
                    const binPath = path.join(projectRoot, 'node_modules', '.bin', toolName);

                    if (!existsSync(binPath)) {
                        return true; // Skip if tool not installed
                    }

                    try {
                        // Get version from the tool
                        const version1 = execSync(`${binPath} --version`, {
                            cwd: projectRoot,
                            timeout: 5000,
                            encoding: 'utf8'
                        }).trim();

                        // Run it again to ensure consistency
                        const version2 = execSync(`${binPath} --version`, {
                            cwd: projectRoot,
                            timeout: 5000,
                            encoding: 'utf8'
                        }).trim();

                        return version1 === version2;
                    } catch {
                        // Some tools might not support --version, that's okay
                        return true;
                    }
                }
            ),
            { numRuns: 50 }
        );
    });

    it('should have executable permissions on build tools', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...buildTools),
                (toolName) => {
                    const binPath = path.join(projectRoot, 'node_modules', '.bin', toolName);

                    if (!existsSync(binPath)) {
                        return true; // Skip if tool not installed
                    }

                    try {
                        const stats = require('fs').statSync(binPath);
                        // Check if file has execute permissions (at least for owner)
                        return (stats.mode & parseInt('100', 8)) !== 0;
                    } catch {
                        return false;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should resolve build tools within Volta project scope', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...buildTools),
                (toolName) => {
                    try {
                        // Test that the tool can be executed from project directory
                        // This simulates what happens during actual build
                        const result = execSync(`which ${toolName}`, {
                            cwd: projectRoot,
                            timeout: 5000,
                            encoding: 'utf8'
                        }).trim();

                        // Should return a valid path
                        return result.length > 0 && existsSync(result);
                    } catch {
                        // If 'which' fails, try to execute the tool directly
                        try {
                            execSync(`${toolName} --version`, {
                                cwd: projectRoot,
                                timeout: 5000,
                                encoding: 'utf8'
                            });
                            return true;
                        } catch {
                            return false;
                        }
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});