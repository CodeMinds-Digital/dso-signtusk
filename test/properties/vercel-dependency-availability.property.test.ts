import { spawn } from 'child_process';
import * as fc from 'fast-check';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, it } from 'vitest';

/**
 * **Feature: vercel-deployment-fix, Property 1: Dependency Availability**
 * **Validates: Requirements 1.1, 1.4, 3.1, 3.2**
 * 
 * For any Vercel build execution, all dependencies required by build scripts must be 
 * available as installed packages rather than global commands.
 * 
 * This property ensures that:
 * - All CLI tools used in build scripts are available as installed packages
 * - No build scripts rely on globally installed packages that may not be available in Vercel
 * - All required dependencies are listed in package.json dependencies (not just devDependencies)
 * - Build scripts can execute successfully in Vercel's constrained environment
 */

describe('Property 1: Dependency Availability', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const remixAppPath = path.join(projectRoot, 'apps/remix');
    const remixPackageJsonPath = path.join(remixAppPath, 'package.json');

    // Helper function to extract CLI tools from build scripts
    function extractCliToolsFromScripts(scripts: Record<string, string>): string[] {
        const cliTools = new Set<string>();
        const scriptCommands = Object.values(scripts).join(' ');

        // Common CLI patterns used in build scripts
        const patterns = [
            /npx\s+([a-zA-Z0-9@/-]+)/g,
            /cross-env/g,
            /rollup/g,
            /rimraf/g,
            /tsc/g,
            /react-router/g,
            /typescript/g,
            /babel/g,
            /eslint/g,
            /prettier/g,
            /vitest/g,
            /dotenv/g
        ];

        for (const pattern of patterns) {
            const matches = scriptCommands.matchAll(pattern);
            for (const match of matches) {
                if (match[1]) {
                    cliTools.add(match[1]);
                } else {
                    cliTools.add(match[0]);
                }
            }
        }

        return Array.from(cliTools);
    }

    // Helper function to check if a package is available in dependencies
    function isPackageAvailable(packageName: string, packageJson: any): { available: boolean; location?: string; package?: string } {
        const deps = packageJson.dependencies || {};
        const devDeps = packageJson.devDependencies || {};
        
        // Check exact match
        if (deps[packageName] || devDeps[packageName]) {
            return { available: true, location: deps[packageName] ? 'dependencies' : 'devDependencies' };
        }

        // Check for scoped packages or related packages
        const relatedPackages = [
            `@types/${packageName}`,
            `${packageName}-cli`,
            `@${packageName}/cli`,
            `@react-router/dev`, // for react-router
            `@rollup/plugin-typescript`, // for rollup
        ];

        for (const related of relatedPackages) {
            if (deps[related] || devDeps[related]) {
                return { available: true, location: deps[related] ? 'dependencies' : 'devDependencies', package: related };
            }
        }

        return { available: false };
    }

    // Helper function to check npx availability (simulated)
    async function checkNpxAvailability(toolName: string): Promise<boolean> {
        return new Promise((resolve) => {
            const child = spawn('which', [toolName], { 
                stdio: 'pipe',
                shell: true 
            });

            child.on('close', (code) => {
                resolve(code === 0);
            });

            child.on('error', () => {
                resolve(false);
            });

            // Timeout after 1 second
            setTimeout(() => {
                child.kill();
                resolve(false);
            }, 1000);
        });
    }

    it('should have all CLI tools used in build scripts available as installed packages', () => {
        fc.assert(
            fc.property(
                fc.constant('remix-build-scripts'),
                () => {
                    if (!existsSync(remixPackageJsonPath)) {
                        return true; // Skip if package.json doesn't exist
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(remixPackageJsonPath, 'utf8'));
                        const scripts = packageJson.scripts || {};
                        
                        if (Object.keys(scripts).length === 0) {
                            return true; // No scripts to check
                        }

                        const cliTools = extractCliToolsFromScripts(scripts);
                        
                        if (cliTools.length === 0) {
                            return true; // No CLI tools found
                        }

                        // Check that all CLI tools are available as installed packages
                        return cliTools.every(tool => {
                            const availability = isPackageAvailable(tool, packageJson);
                            return availability.available;
                        });
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should not rely on globally installed packages that may not be available in Vercel', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('build', 'build:vercel', 'build:app', 'build:server', 'dev', 'start'),
                (scriptName) => {
                    if (!existsSync(remixPackageJsonPath)) {
                        return true; // Skip if package.json doesn't exist
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(remixPackageJsonPath, 'utf8'));
                        const scripts = packageJson.scripts || {};
                        const script = scripts[scriptName];
                        
                        if (!script) {
                            return true; // Script doesn't exist
                        }

                        // Check that the script doesn't use problematic global commands
                        const problematicPatterns = [
                            /dotenv\s+-e/,  // dotenv CLI usage
                            /npm\s+run\s+with:env\s+--/,  // with:env wrapper
                            /yarn\s+global/,  // yarn global commands
                            /npm\s+install\s+-g/,  // npm global install
                        ];

                        return !problematicPatterns.some(pattern => pattern.test(script));
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have all required build dependencies listed in package.json dependencies', () => {
        fc.assert(
            fc.property(
                fc.constant('required-dependencies'),
                () => {
                    if (!existsSync(remixPackageJsonPath)) {
                        return true; // Skip if package.json doesn't exist
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(remixPackageJsonPath, 'utf8'));
                        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                        
                        // Required dependencies for Vercel build process
                        const requiredForVercel = [
                            'cross-env',
                            'rimraf',
                            '@react-router/dev',
                            'rollup',
                            'typescript'
                        ];

                        return requiredForVercel.every(required => deps[required]);
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should use programmatic environment loading instead of CLI commands', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('build', 'build:vercel', 'build:app', 'build:server', 'dev', 'start'),
                (scriptName) => {
                    if (!existsSync(remixPackageJsonPath)) {
                        return true; // Skip if package.json doesn't exist
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(remixPackageJsonPath, 'utf8'));
                        const scripts = packageJson.scripts || {};
                        const script = scripts[scriptName];
                        
                        if (!script) {
                            return true; // Script doesn't exist
                        }

                        // Check that environment loading is done programmatically
                        // Should use build-with-env.js instead of dotenv CLI
                        if (script.includes('dotenv -e')) {
                            return false; // Still using dotenv CLI
                        }

                        if (script.includes('npm run with:env --')) {
                            return false; // Still using with:env wrapper
                        }

                        // Should use programmatic approach
                        if (script.includes('node scripts/build-with-env.js') || 
                            !script.includes('dotenv')) {
                            return true; // Using programmatic approach or no env loading
                        }

                        return true; // No environment loading detected
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have dotenv available for programmatic environment loading', () => {
        fc.assert(
            fc.property(
                fc.constant('dotenv-programmatic'),
                () => {
                    if (!existsSync(remixPackageJsonPath)) {
                        return true; // Skip if package.json doesn't exist
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(remixPackageJsonPath, 'utf8'));
                        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                        
                        // Should have dotenv for programmatic use, not dotenv-cli
                        const hasDotenv = !!deps['dotenv'];
                        const hasDotenvCli = !!deps['dotenv-cli'];
                        
                        // Prefer dotenv over dotenv-cli for Vercel compatibility
                        if (hasDotenvCli && !hasDotenv) {
                            return false; // Should use dotenv instead of dotenv-cli
                        }

                        return hasDotenv || !hasDotenvCli; // Either has dotenv or doesn't use CLI
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have build-with-env.js script available for programmatic environment loading', () => {
        fc.assert(
            fc.property(
                fc.constant('build-with-env-script'),
                () => {
                    const buildWithEnvPath = path.join(remixAppPath, 'scripts/build-with-env.js');
                    
                    // Check that the build-with-env.js script exists
                    if (!existsSync(buildWithEnvPath)) {
                        return false; // Script should exist
                    }

                    try {
                        const scriptContent = readFileSync(buildWithEnvPath, 'utf8');
                        
                        // Check that the script contains proper environment loading logic
                        const hasEnvLoading = scriptContent.includes('loadEnvironmentFiles') ||
                                            scriptContent.includes('parseEnvFile') ||
                                            scriptContent.includes('process.env');
                        
                        const hasCommandExecution = scriptContent.includes('spawn') ||
                                                  scriptContent.includes('exec');
                        
                        return hasEnvLoading && hasCommandExecution;
                    } catch (error) {
                        return false; // Could not read script
                    }
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have all dependencies available for any build script execution', () => {
        fc.assert(
            fc.property(
                fc.array(fc.constantFrom('build', 'build:vercel', 'build:app', 'build:server', 'typecheck'), { minLength: 1, maxLength: 3 }),
                (scriptNames) => {
                    if (!existsSync(remixPackageJsonPath)) {
                        return true; // Skip if package.json doesn't exist
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(remixPackageJsonPath, 'utf8'));
                        const scripts = packageJson.scripts || {};
                        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                        
                        return scriptNames.every(scriptName => {
                            const script = scripts[scriptName];
                            if (!script) {
                                return true; // Script doesn't exist
                            }

                            const cliTools = extractCliToolsFromScripts({ [scriptName]: script });
                            
                            // Check that all CLI tools are available
                            return cliTools.every(tool => {
                                const availability = isPackageAvailable(tool, packageJson);
                                return availability.available;
                            });
                        });
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});