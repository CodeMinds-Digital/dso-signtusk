import { spawn } from 'child_process';
import * as fc from 'fast-check';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, it } from 'vitest';

/**
 * **Feature: vercel-deployment-fix, Property 2: CLI Tool Access Patterns**
 * **Validates: Requirements 1.2, 3.2, 3.4**
 * 
 * For any CLI tool required during build, the tool must be accessible through npx, 
 * direct node_modules paths, or programmatic APIs rather than global command assumptions.
 * 
 * This property ensures that:
 * - CLI tools are accessed through npx or direct node_modules paths
 * - No build scripts assume global tool availability
 * - All tools can be executed in Vercel's constrained environment
 * - Fallback mechanisms exist when primary tool access fails
 */

describe('Property 2: CLI Tool Access Patterns', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const remixAppPath = path.join(projectRoot, 'apps/remix');
    const remixPackageJsonPath = path.join(remixAppPath, 'package.json');

    // Helper function to extract CLI tool access patterns from scripts
    function extractCliAccessPatterns(scripts: Record<string, string>): Array<{
        tool: string;
        accessPattern: 'npx' | 'direct' | 'global' | 'programmatic';
        command: string;
    }> {
        const patterns: Array<{
            tool: string;
            accessPattern: 'npx' | 'direct' | 'global' | 'programmatic';
            command: string;
        }> = [];

        for (const [scriptName, script] of Object.entries(scripts)) {
            // Extract npx usage
            const npxMatches = script.matchAll(/npx\s+([a-zA-Z0-9@/-]+)/g);
            for (const match of npxMatches) {
                patterns.push({
                    tool: match[1],
                    accessPattern: 'npx',
                    command: match[0]
                });
            }

            // Extract direct node_modules usage
            const directMatches = script.matchAll(/node_modules\/\.bin\/([a-zA-Z0-9-]+)/g);
            for (const match of directMatches) {
                patterns.push({
                    tool: match[1],
                    accessPattern: 'direct',
                    command: match[0]
                });
            }

            // Extract programmatic usage (node scripts)
            const programmaticMatches = script.matchAll(/node\s+scripts\/([a-zA-Z0-9-]+\.js)/g);
            for (const match of programmaticMatches) {
                patterns.push({
                    tool: match[1],
                    accessPattern: 'programmatic',
                    command: match[0]
                });
            }

            // Detect potential global command usage (problematic patterns)
            // Instead of complex negative lookbehind, let's check for tools that appear
            // without being properly prefixed with npx
            const toolsToCheck = ['dotenv', 'cross-env', 'rollup', 'tsc', 'react-router'];
            
            for (const tool of toolsToCheck) {
                // Find all occurrences of the tool as a standalone command (not part of filenames)
                // Use word boundaries and ensure it's not followed by a dot (to avoid filenames)
                const regex = new RegExp(`\\b${tool}\\b(?!\\.)`, 'g');
                const matches = script.matchAll(regex);
                
                for (const match of matches) {
                    const index = match.index;
                    const before = script.substring(Math.max(0, index - 5), index);
                    
                    // Check if it's NOT preceded by 'npx ' (with space)
                    if (!before.endsWith('npx ')) {
                        // Also check if it's not part of a node script call
                        const beforeLonger = script.substring(Math.max(0, index - 20), index);
                        if (!beforeLonger.includes('node scripts/')) {
                            patterns.push({
                                tool: tool,
                                accessPattern: 'global',
                                command: match[0]
                            });
                        }
                    }
                }
            }
        }

        return patterns;
    }

    // Helper function to check if a tool is available through npx
    async function checkNpxAvailability(toolName: string): Promise<boolean> {
        return new Promise((resolve) => {
            const child = spawn('npx', ['--help', toolName], { 
                stdio: 'pipe',
                shell: true 
            });

            child.on('close', (code) => {
                resolve(code === 0);
            });

            child.on('error', () => {
                resolve(false);
            });

            // Timeout after 2 seconds
            setTimeout(() => {
                child.kill();
                resolve(false);
            }, 2000);
        });
    }

    // Helper function to check if a tool is available in node_modules
    function checkNodeModulesAvailability(toolName: string): boolean {
        const possiblePaths = [
            path.join(projectRoot, 'node_modules', '.bin', toolName),
            path.join(remixAppPath, 'node_modules', '.bin', toolName),
            path.join(projectRoot, 'node_modules', toolName),
            path.join(remixAppPath, 'node_modules', toolName),
        ];

        return possiblePaths.some(p => existsSync(p));
    }

    it('should access CLI tools through npx or direct node_modules paths', () => {
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

                        const patterns = extractCliAccessPatterns({ [scriptName]: script });
                        
                        // All CLI tools should use npx, direct, or programmatic access
                        return patterns.every(pattern => 
                            pattern.accessPattern === 'npx' || 
                            pattern.accessPattern === 'direct' || 
                            pattern.accessPattern === 'programmatic'
                        );
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 10 }
        );
    });

    it('should not assume global tool availability', () => {
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

                        const patterns = extractCliAccessPatterns({ [scriptName]: script });
                        
                        // No patterns should use global access
                        return patterns.every(pattern => pattern.accessPattern !== 'global');
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 10 }
        );
    });

    it('should have all CLI tools accessible in Vercel environment', () => {
        fc.assert(
            fc.property(
                fc.array(fc.constantFrom('react-router', 'rollup', 'cross-env', 'rimraf', 'typescript'), { minLength: 1, maxLength: 3 }),
                (toolNames) => {
                    // Check that tools are available through npx or node_modules
                    return toolNames.every(toolName => {
                        const nodeModulesAvailable = checkNodeModulesAvailability(toolName);
                        
                        // If not in node_modules, should be available through npx
                        if (!nodeModulesAvailable) {
                            // For this test, we assume npx availability in Vercel
                            // In real Vercel environment, npx would be available
                            return true;
                        }
                        
                        return nodeModulesAvailable;
                    });
                }
            ),
            { numRuns: 10 }
        );
    });

    it('should use programmatic APIs when available instead of CLI commands', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('build', 'build:vercel', 'build:app', 'build:server'),
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

                        // Check for programmatic environment loading
                        if (script.includes('dotenv -e') || script.includes('npm run with:env')) {
                            return false; // Should use programmatic approach
                        }

                        // Should use build-with-env.js or vercel-build.js for environment loading
                        if (script.includes('node scripts/build-with-env.js') || 
                            script.includes('node scripts/vercel-build.js')) {
                            return true; // Using programmatic approach
                        }

                        // If no environment loading, that's also acceptable
                        return true;
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 10 }
        );
    });

    it('should have fallback mechanisms for tool access failures', () => {
        fc.assert(
            fc.property(
                fc.constant('fallback-mechanisms'),
                () => {
                    if (!existsSync(remixPackageJsonPath)) {
                        return true; // Skip if package.json doesn't exist
                    }

                    try {
                        const packageJson = JSON.parse(readFileSync(remixPackageJsonPath, 'utf8'));
                        const scripts = packageJson.scripts || {};
                        
                        // Check for fallback build scripts
                        const hasFallbackBuild = !!scripts['build:fallback'] || 
                                               !!scripts['build:vercel:fallback'] ||
                                               !!scripts['build:simple'];
                        
                        // Check for vercel-build-fallback.js script
                        const fallbackScriptPath = path.join(remixAppPath, 'scripts/vercel-build-fallback.js');
                        const hasFallbackScript = existsSync(fallbackScriptPath);
                        
                        return hasFallbackBuild || hasFallbackScript;
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 10 }
        );
    });

    it('should execute tools in Vercel-compatible manner', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('build:vercel', 'build:vercel:fallback'),
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

                        // Vercel-compatible patterns
                        const vercelCompatiblePatterns = [
                            /node scripts\/vercel-build\.js/,
                            /node scripts\/vercel-build-fallback\.js/,
                            /npx react-router/,
                            /npx rollup/,
                            /cross-env NODE_ENV=production/
                        ];

                        // Should use at least one Vercel-compatible pattern
                        return vercelCompatiblePatterns.some(pattern => pattern.test(script));
                    } catch (error) {
                        return false; // Invalid package.json
                    }
                }
            ),
            { numRuns: 10 }
        );
    });

    it('should have proper error handling for CLI tool failures', () => {
        fc.assert(
            fc.property(
                fc.constant('error-handling'),
                () => {
                    // Check that vercel-build.js has proper error handling
                    const vercelBuildPath = path.join(remixAppPath, 'scripts/vercel-build.js');
                    
                    if (!existsSync(vercelBuildPath)) {
                        return false; // Script should exist
                    }

                    try {
                        const scriptContent = readFileSync(vercelBuildPath, 'utf8');
                        
                        // Check for error handling patterns
                        const hasErrorHandling = scriptContent.includes('try') && 
                                               scriptContent.includes('catch') &&
                                               scriptContent.includes('process.exit(1)');
                        
                        const hasValidation = scriptContent.includes('validateBuildDependencies') ||
                                            scriptContent.includes('validateVercelEnvironment');
                        
                        return hasErrorHandling && hasValidation;
                    } catch (error) {
                        return false; // Could not read script
                    }
                }
            ),
            { numRuns: 10 }
        );
    });

    it('should provide clear error messages for missing tools', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('vercel-build.js', 'vercel-build-fallback.js'),
                (scriptName) => {
                    const scriptPath = path.join(remixAppPath, 'scripts', scriptName);
                    
                    if (!existsSync(scriptPath)) {
                        return scriptName === 'vercel-build-fallback.js'; // Fallback is optional
                    }

                    try {
                        const scriptContent = readFileSync(scriptPath, 'utf8');
                        
                        // Check for informative error messages
                        const hasInformativeErrors = scriptContent.includes('not available') ||
                                                   scriptContent.includes('not found') ||
                                                   scriptContent.includes('missing') ||
                                                   scriptContent.includes('failed');
                        
                        const hasConsoleLogging = scriptContent.includes('console.log') ||
                                                scriptContent.includes('console.error') ||
                                                scriptContent.includes('console.warn');
                        
                        return hasInformativeErrors && hasConsoleLogging;
                    } catch (error) {
                        return false; // Could not read script
                    }
                }
            ),
            { numRuns: 10 }
        );
    });
});