/**
 * Netlify Deployment Build Context Configuration Property-Based Tests
 * 
 * **Feature: netlify-deployment, Property 1: Build Context Configuration Correctness**
 * **Validates: Requirements 1.2**
 * 
 * Tests that for any site configuration, the build context specifies the correct 
 * application directory and build commands for the application type.
 */

import fc from 'fast-check';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

// Helper function to get workspace root
function getWorkspaceRoot(): string {
    return resolve(__dirname, '../..');
}

// Helper function to read TOML file safely
function readTomlFile(filePath: string): string | null {
    try {
        return readFileSync(filePath, 'utf-8');
    } catch {
        return null;
    }
}

// Helper function to parse basic TOML values
function parseTomlValue(content: string, key: string): string | null {
    const lines = content.split('\n');
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith(`${key} = `)) {
            const value = trimmed.substring(`${key} = `.length);
            return value.replace(/^["']|["']$/g, ''); // Remove quotes
        }
    }
    return null;
}

// Helper function to check if TOML contains a section
function hasTomlSection(content: string, section: string): boolean {
    return content.includes(`[${section}]`);
}

// Helper function to get application type from directory
function getApplicationType(appDir: string): string {
    const workspaceRoot = getWorkspaceRoot();
    const packageJsonPath = join(workspaceRoot, appDir, 'package.json');
    
    if (!existsSync(packageJsonPath)) {
        return 'unknown';
    }
    
    try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        if (dependencies['next']) {
            return 'nextjs';
        } else if (dependencies['react-router'] || dependencies['@react-router/dev']) {
            return 'remix';
        } else {
            return 'unknown';
        }
    } catch {
        return 'unknown';
    }
}

// Helper function to get expected build configuration for app type
function getExpectedBuildConfig(appType: string, appDir: string) {
    const appName = appDir.split('/').pop(); // Extract app name from directory
    
    switch (appType) {
        case 'nextjs':
            return {
                base: appDir,
                command: `cd ../.. && NETLIFY_APP_NAME=${appName} node scripts/netlify-build.js`,
                publish: `${appDir}/.next`,
                functions: null
            };
        case 'remix':
            return {
                base: appDir,
                command: `cd ../.. && NETLIFY_APP_NAME=${appName} node scripts/netlify-build.js`,
                publish: `${appDir}/build/client`,
                functions: `${appDir}/build/server`
            };
        default:
            return null;
    }
}

// Application configurations to test
const applicationConfigs = [
    { dir: 'apps/web', configFile: 'apps/web/netlify.toml' },
    { dir: 'apps/remix', configFile: 'apps/remix/netlify.toml' },
    { dir: 'apps/docs', configFile: 'apps/docs/netlify.toml' }
];

describe('Netlify Deployment Build Context Configuration', () => {
    /**
     * Property 1: Build Context Configuration Correctness
     * For any site configuration, the build context should specify the correct 
     * application directory and build commands for the application type
     */
    describe('Property 1: Build Context Configuration Correctness', () => {
        it('should have correct base directory for each application', () => {
            fc.assert(fc.property(
                fc.constantFrom(...applicationConfigs),
                (appConfig) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, appConfig.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Config file ${appConfig.configFile} does not exist, skipping`);
                        return true;
                    }
                    
                    const tomlContent = readTomlFile(configPath);
                    expect(tomlContent).toBeTruthy();
                    
                    const baseDir = parseTomlValue(tomlContent!, 'base');
                    expect(baseDir).toBe(appConfig.dir);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should have workspace-aware build commands for each application', () => {
            fc.assert(fc.property(
                fc.constantFrom(...applicationConfigs),
                (appConfig) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, appConfig.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Config file ${appConfig.configFile} does not exist, skipping`);
                        return true;
                    }
                    
                    const tomlContent = readTomlFile(configPath);
                    expect(tomlContent).toBeTruthy();
                    
                    const buildCommand = parseTomlValue(tomlContent!, 'command');
                    expect(buildCommand).toBeTruthy();
                    
                    // Should navigate to workspace root
                    expect(buildCommand).toContain('cd ../..');
                    
                    // Should use our custom Netlify build script
                    expect(buildCommand).toContain('node scripts/netlify-build.js');
                    
                    // Should set the NETLIFY_APP_NAME environment variable
                    expect(buildCommand).toContain('NETLIFY_APP_NAME=');
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should have correct publish directory based on application type', () => {
            fc.assert(fc.property(
                fc.constantFrom(...applicationConfigs),
                (appConfig) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, appConfig.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Config file ${appConfig.configFile} does not exist, skipping`);
                        return true;
                    }
                    
                    const appType = getApplicationType(appConfig.dir);
                    const expectedConfig = getExpectedBuildConfig(appType, appConfig.dir);
                    
                    if (!expectedConfig) {
                        console.log(`Could not determine expected config for ${appConfig.dir}, skipping`);
                        return true;
                    }
                    
                    const tomlContent = readTomlFile(configPath);
                    expect(tomlContent).toBeTruthy();
                    
                    const publishDir = parseTomlValue(tomlContent!, 'publish');
                    expect(publishDir).toBe(expectedConfig.publish);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should configure functions directory for SSR applications', () => {
            fc.assert(fc.property(
                fc.constantFrom(...applicationConfigs.filter(config => 
                    getApplicationType(config.dir) === 'remix'
                )),
                (appConfig) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, appConfig.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Config file ${appConfig.configFile} does not exist, skipping`);
                        return true;
                    }
                    
                    const appType = getApplicationType(appConfig.dir);
                    const expectedConfig = getExpectedBuildConfig(appType, appConfig.dir);
                    
                    if (!expectedConfig || !expectedConfig.functions) {
                        console.log(`No functions expected for ${appConfig.dir}, skipping`);
                        return true;
                    }
                    
                    const tomlContent = readTomlFile(configPath);
                    expect(tomlContent).toBeTruthy();
                    
                    const functionsDir = parseTomlValue(tomlContent!, 'functions');
                    expect(functionsDir).toBe(expectedConfig.functions);
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should have production environment configuration', () => {
            fc.assert(fc.property(
                fc.constantFrom(...applicationConfigs),
                (appConfig) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, appConfig.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Config file ${appConfig.configFile} does not exist, skipping`);
                        return true;
                    }
                    
                    const tomlContent = readTomlFile(configPath);
                    expect(tomlContent).toBeTruthy();
                    
                    // Should have production context
                    expect(hasTomlSection(tomlContent!, 'context.production')).toBe(true);
                    
                    // Should have build environment section
                    expect(hasTomlSection(tomlContent!, 'build.environment')).toBe(true);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should have appropriate redirects for application type', () => {
            fc.assert(fc.property(
                fc.constantFrom(...applicationConfigs),
                (appConfig) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, appConfig.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Config file ${appConfig.configFile} does not exist, skipping`);
                        return true;
                    }
                    
                    const appType = getApplicationType(appConfig.dir);
                    const tomlContent = readTomlFile(configPath);
                    expect(tomlContent).toBeTruthy();
                    
                    // Should have redirects section
                    expect(tomlContent!.includes('[[redirects]]')).toBe(true);
                    
                    if (appType === 'remix') {
                        // Remix apps should redirect to Netlify Functions
                        expect(tomlContent!.includes('/.netlify/functions/server')).toBe(true);
                    } else if (appType === 'nextjs') {
                        // Next.js apps should have SPA routing
                        expect(tomlContent!.includes('/index.html')).toBe(true);
                    }
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should have security headers configured', () => {
            fc.assert(fc.property(
                fc.constantFrom(...applicationConfigs),
                (appConfig) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, appConfig.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Config file ${appConfig.configFile} does not exist, skipping`);
                        return true;
                    }
                    
                    const tomlContent = readTomlFile(configPath);
                    expect(tomlContent).toBeTruthy();
                    
                    // Should have headers section
                    expect(tomlContent!.includes('[[headers]]')).toBe(true);
                    
                    // Should have basic security headers
                    expect(tomlContent!.includes('X-Frame-Options')).toBe(true);
                    expect(tomlContent!.includes('X-Content-Type-Options')).toBe(true);
                    expect(tomlContent!.includes('Content-Security-Policy')).toBe(true);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should have consistent Node.js and npm versions across all configurations', () => {
            fc.assert(fc.property(
                fc.constant('version-consistency'),
                () => {
                    const workspaceRoot = getWorkspaceRoot();
                    const versions = new Set<string>();
                    const npmVersions = new Set<string>();
                    
                    for (const appConfig of applicationConfigs) {
                        const configPath = join(workspaceRoot, appConfig.configFile);
                        
                        if (!existsSync(configPath)) {
                            continue;
                        }
                        
                        const tomlContent = readTomlFile(configPath);
                        if (!tomlContent) continue;
                        
                        // Extract NODE_VERSION and NPM_VERSION from environment section
                        const lines = tomlContent.split('\n');
                        let inBuildEnv = false;
                        
                        for (const line of lines) {
                            const trimmed = line.trim();
                            
                            if (trimmed === '[build.environment]') {
                                inBuildEnv = true;
                                continue;
                            }
                            
                            if (trimmed.startsWith('[') && trimmed !== '[build.environment]') {
                                inBuildEnv = false;
                                continue;
                            }
                            
                            if (inBuildEnv) {
                                if (trimmed.startsWith('NODE_VERSION = ')) {
                                    const version = trimmed.substring('NODE_VERSION = '.length).replace(/^["']|["']$/g, '');
                                    versions.add(version);
                                }
                                if (trimmed.startsWith('NPM_VERSION = ')) {
                                    const version = trimmed.substring('NPM_VERSION = '.length).replace(/^["']|["']$/g, '');
                                    npmVersions.add(version);
                                }
                            }
                        }
                    }
                    
                    // All configurations should use the same Node.js version
                    expect(versions.size).toBeLessThanOrEqual(1);
                    
                    // All configurations should use the same npm version
                    expect(npmVersions.size).toBeLessThanOrEqual(1);
                    
                    return true;
                }
            ), { numRuns: 1 });
        });
    });
});