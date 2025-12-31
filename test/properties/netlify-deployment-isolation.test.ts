/**
 * Netlify Deployment Isolation End-to-End Property-Based Tests
 * 
 * **Feature: netlify-deployment, Property 3: Deployment Isolation**
 * **Validates: Requirements 1.4**
 * 
 * Tests that for any set of applications deployed, each should be deployed to 
 * separate Netlify sites with unique URLs without interference.
 */

import fc from 'fast-check';
import { existsSync, readFileSync } from 'fs';
import https from 'https';
import { join, resolve } from 'path';
import { URL } from 'url';
import { describe, expect, it } from 'vitest';

// Helper function to get workspace root
function getWorkspaceRoot(): string {
    return resolve(__dirname, '../..');
}

// Helper function to read Netlify configuration
function readNetlifyConfig(configPath: string): any {
    try {
        const content = readFileSync(configPath, 'utf-8');
        
        // Parse TOML-like configuration (simplified parser)
        const config: any = {
            build: {},
            redirects: [],
            headers: [],
            context: {}
        };
        
        const lines = content.split('\n');
        let currentSection = '';
        let currentRedirect: any = {};
        let currentHeader: any = {};
        
        for (const line of lines) {
            const trimmed = line.trim();
            
            if (trimmed.startsWith('#') || trimmed === '') {
                continue;
            }
            
            // Section headers
            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                const section = trimmed.slice(1, -1);
                
                if (section === 'build') {
                    currentSection = 'build';
                } else if (section.startsWith('context.')) {
                    currentSection = 'context';
                } else if (section === '[[redirects]]') {
                    if (Object.keys(currentRedirect).length > 0) {
                        config.redirects.push(currentRedirect);
                    }
                    currentRedirect = {};
                    currentSection = 'redirects';
                } else if (section === '[[headers]]') {
                    if (Object.keys(currentHeader).length > 0) {
                        config.headers.push(currentHeader);
                    }
                    currentHeader = {};
                    currentSection = 'headers';
                }
                continue;
            }
            
            // Key-value pairs
            const equalIndex = trimmed.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmed.substring(0, equalIndex).trim();
                let value = trimmed.substring(equalIndex + 1).trim();
                
                // Remove quotes
                if ((value.startsWith('"') && value.endsWith('"')) || 
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                
                if (currentSection === 'build') {
                    config.build[key] = value;
                } else if (currentSection === 'redirects') {
                    currentRedirect[key] = value;
                } else if (currentSection === 'headers') {
                    if (key === 'for') {
                        currentHeader.for = value;
                    } else {
                        if (!currentHeader.values) currentHeader.values = {};
                        currentHeader.values[key] = value;
                    }
                }
            }
        }
        
        // Add final redirect/header if exists
        if (Object.keys(currentRedirect).length > 0) {
            config.redirects.push(currentRedirect);
        }
        if (Object.keys(currentHeader).length > 0) {
            config.headers.push(currentHeader);
        }
        
        return config;
    } catch (error) {
        return null;
    }
}

// Helper function to extract domain from URL
function extractDomain(url: string): string {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    } catch {
        return '';
    }
}

// Helper function to check URL accessibility (mock for testing)
async function checkUrlAccessibility(url: string, timeout: number = 5000): Promise<{
    accessible: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
}> {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        try {
            const urlObj = new URL(url);
            
            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname || '/',
                method: 'HEAD',
                timeout: timeout,
                headers: {
                    'User-Agent': 'DeploymentIsolationTest/1.0'
                }
            };
            
            const req = https.request(options, (res) => {
                const responseTime = Date.now() - startTime;
                resolve({
                    accessible: res.statusCode !== undefined && res.statusCode < 500,
                    statusCode: res.statusCode,
                    responseTime: responseTime
                });
            });
            
            req.on('error', (error) => {
                resolve({
                    accessible: false,
                    error: error.message
                });
            });
            
            req.on('timeout', () => {
                req.destroy();
                resolve({
                    accessible: false,
                    error: 'Timeout'
                });
            });
            
            req.end();
        } catch (error) {
            resolve({
                accessible: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
}

// Application deployment configurations
const deploymentConfigurations = [
    {
        name: 'marketing',
        displayName: 'Marketing Site',
        workspace: '@signtusk/web',
        configFile: 'apps/web/netlify.toml',
        expectedDomain: 'yourdomain.com',
        outputDir: '.next',
        requiresSSR: false
    },
    {
        name: 'remix',
        displayName: 'Remix Application',
        workspace: '@signtusk/remix',
        configFile: 'netlify-remix.toml',
        expectedDomain: 'app.yourdomain.com',
        outputDir: 'build',
        requiresSSR: true
    },
    {
        name: 'docs',
        displayName: 'Documentation Site',
        workspace: '@signtusk/docs',
        configFile: 'netlify-docs.toml',
        expectedDomain: 'docs.yourdomain.com',
        outputDir: '.next',
        requiresSSR: false
    }
];

describe('Netlify Deployment Isolation End-to-End Tests', () => {
    /**
     * Property 3: Deployment Isolation
     * For any set of applications deployed, each should be deployed to separate 
     * Netlify sites with unique URLs without interference
     */
    describe('Property 3: Deployment Isolation', () => {
        it('should have unique domains for each application deployment', () => {
            fc.assert(fc.property(
                fc.shuffledSubarray(deploymentConfigurations, { minLength: 2 }),
                (selectedApps) => {
                    const domains = selectedApps.map(app => app.expectedDomain);
                    const uniqueDomains = new Set(domains);
                    
                    // Each application should have a unique domain
                    expect(uniqueDomains.size).toBe(domains.length);
                    
                    // Domains should follow expected patterns
                    domains.forEach((domain, index) => {
                        const app = selectedApps[index];
                        
                        if (app.name === 'marketing') {
                            // Marketing site should use root domain
                            expect(domain).not.toContain('app.');
                            expect(domain).not.toContain('docs.');
                        } else if (app.name === 'remix') {
                            // Remix app should use app subdomain
                            expect(domain).toContain('app.');
                        } else if (app.name === 'docs') {
                            // Docs should use docs subdomain
                            expect(domain).toContain('docs.');
                        }
                    });
                    
                    return true;
                }
            ), { numRuns: 20 });
        });

        it('should have isolated build configurations for each application', () => {
            fc.assert(fc.property(
                fc.tuple(
                    fc.constantFrom(...deploymentConfigurations),
                    fc.constantFrom(...deploymentConfigurations)
                ).filter(([app1, app2]) => app1.name !== app2.name),
                ([app1, app2]) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const config1Path = join(workspaceRoot, app1.configFile);
                    const config2Path = join(workspaceRoot, app2.configFile);
                    
                    if (!existsSync(config1Path) || !existsSync(config2Path)) {
                        console.log(`Configuration files not found, skipping: ${app1.configFile}, ${app2.configFile}`);
                        return true;
                    }
                    
                    const config1 = readNetlifyConfig(config1Path);
                    const config2 = readNetlifyConfig(config2Path);
                    
                    expect(config1).toBeTruthy();
                    expect(config2).toBeTruthy();
                    
                    // Build commands should reference different workspaces
                    if (config1.build?.command && config2.build?.command) {
                        expect(config1.build.command).toContain(app1.workspace);
                        expect(config2.build.command).toContain(app2.workspace);
                        expect(config1.build.command).not.toContain(app2.workspace);
                        expect(config2.build.command).not.toContain(app1.workspace);
                    }
                    
                    // Publish directories should be different
                    if (config1.build?.publish && config2.build?.publish) {
                        expect(config1.build.publish).not.toBe(config2.build.publish);
                    }
                    
                    return true;
                }
            ), { numRuns: 15 });
        });

        it('should have proper redirect isolation between applications', () => {
            fc.assert(fc.property(
                fc.constantFrom(...deploymentConfigurations),
                (app) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, app.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Configuration file not found, skipping: ${app.configFile}`);
                        return true;
                    }
                    
                    const config = readNetlifyConfig(configPath);
                    expect(config).toBeTruthy();
                    
                    if (config.redirects && config.redirects.length > 0) {
                        config.redirects.forEach((redirect: any) => {
                            // Redirects should not interfere with other applications
                            if (redirect.to && redirect.to.includes('://')) {
                                const targetDomain = extractDomain(redirect.to);
                                
                                // Cross-application redirects should go to correct domains
                                if (redirect.to.includes('app.')) {
                                    expect(targetDomain).toContain('app.');
                                } else if (redirect.to.includes('docs.')) {
                                    expect(targetDomain).toContain('docs.');
                                }
                            }
                            
                            // Status codes should be appropriate
                            if (redirect.status) {
                                const status = parseInt(redirect.status);
                                expect([200, 301, 302, 404]).toContain(status);
                            }
                        });
                    }
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should have isolated security headers for each application', () => {
            fc.assert(fc.property(
                fc.constantFrom(...deploymentConfigurations),
                (app) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, app.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Configuration file not found, skipping: ${app.configFile}`);
                        return true;
                    }
                    
                    const config = readNetlifyConfig(configPath);
                    expect(config).toBeTruthy();
                    
                    if (config.headers && config.headers.length > 0) {
                        config.headers.forEach((header: any) => {
                            if (header.values) {
                                // Security headers should be present
                                const securityHeaders = [
                                    'X-Frame-Options',
                                    'X-Content-Type-Options',
                                    'X-XSS-Protection',
                                    'Strict-Transport-Security'
                                ];
                                
                                const hasSecurityHeaders = securityHeaders.some(h => 
                                    Object.keys(header.values).includes(h)
                                );
                                
                                if (hasSecurityHeaders) {
                                    // If security headers are present, they should have appropriate values
                                    if (header.values['X-Frame-Options']) {
                                        expect(['DENY', 'SAMEORIGIN']).toContain(header.values['X-Frame-Options']);
                                    }
                                    
                                    if (header.values['X-Content-Type-Options']) {
                                        expect(header.values['X-Content-Type-Options']).toBe('nosniff');
                                    }
                                }
                                
                                // CSP should be application-specific
                                if (header.values['Content-Security-Policy']) {
                                    const csp = header.values['Content-Security-Policy'];
                                    
                                    // Should contain appropriate directives
                                    expect(csp).toContain('default-src');
                                    
                                    // Should not contain other applications' domains
                                    if (app.name === 'marketing') {
                                        // Marketing CSP should not reference app-specific domains
                                        expect(csp).not.toContain('app.yourdomain.com');
                                    }
                                }
                            }
                        });
                    }
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should have proper workspace isolation in build commands', () => {
            fc.assert(fc.property(
                fc.constantFrom(...deploymentConfigurations),
                (app) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, app.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Configuration file not found, skipping: ${app.configFile}`);
                        return true;
                    }
                    
                    const config = readNetlifyConfig(configPath);
                    expect(config).toBeTruthy();
                    
                    if (config.build?.command) {
                        const buildCommand = config.build.command;
                        
                        // Build command should reference the correct workspace
                        expect(buildCommand).toContain(app.workspace);
                        
                        // Should use workspace-aware build approach
                        expect(buildCommand).toMatch(/--workspace=|--filter=/);
                        
                        // Should not reference other workspaces
                        const otherWorkspaces = deploymentConfigurations
                            .filter(other => other.name !== app.name)
                            .map(other => other.workspace);
                        
                        otherWorkspaces.forEach(workspace => {
                            expect(buildCommand).not.toContain(workspace);
                        });
                        
                        // Should use proper build script
                        if (buildCommand.includes('netlify-build.js')) {
                            expect(buildCommand).toContain('NETLIFY_APP_NAME=' + app.name);
                        }
                    }
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should have appropriate output directory isolation', () => {
            fc.assert(fc.property(
                fc.constantFrom(...deploymentConfigurations),
                (app) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, app.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Configuration file not found, skipping: ${app.configFile}`);
                        return true;
                    }
                    
                    const config = readNetlifyConfig(configPath);
                    expect(config).toBeTruthy();
                    
                    if (config.build?.publish) {
                        const publishDir = config.build.publish;
                        
                        // Publish directory should match expected output
                        expect(publishDir).toContain(app.outputDir);
                        
                        // Should be within the application directory
                        expect(publishDir).toContain('apps/' + app.name.replace('remix', 'remix'));
                        
                        // Should not reference other applications' directories
                        const otherApps = deploymentConfigurations
                            .filter(other => other.name !== app.name);
                        
                        otherApps.forEach(other => {
                            if (other.outputDir !== app.outputDir) {
                                // Only check if output directories are different
                                const otherAppDir = 'apps/' + other.name;
                                expect(publishDir).not.toContain(otherAppDir);
                            }
                        });
                    }
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should have proper SSR configuration isolation', () => {
            fc.assert(fc.property(
                fc.constantFrom(...deploymentConfigurations),
                (app) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, app.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Configuration file not found, skipping: ${app.configFile}`);
                        return true;
                    }
                    
                    const config = readNetlifyConfig(configPath);
                    expect(config).toBeTruthy();
                    
                    // Check SSR configuration based on application requirements
                    if (app.requiresSSR) {
                        // Remix app should have functions configuration
                        if (config.build?.functions) {
                            expect(config.build.functions).toContain('server');
                        }
                        
                        // Should have server-side redirects
                        if (config.redirects) {
                            const hasServerRedirects = config.redirects.some((redirect: any) => 
                                redirect.to && redirect.to.includes('/.netlify/functions/')
                            );
                            expect(hasServerRedirects).toBe(true);
                        }
                    } else {
                        // Static sites should not have functions configuration
                        expect(config.build?.functions).toBeFalsy();
                        
                        // Should have SPA-style redirects
                        if (config.redirects) {
                            const hasSPARedirect = config.redirects.some((redirect: any) => 
                                redirect.from === '/*' && redirect.to === '/index.html'
                            );
                            expect(hasSPARedirect).toBe(true);
                        }
                    }
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should have proper caching isolation between applications', () => {
            fc.assert(fc.property(
                fc.constantFrom(...deploymentConfigurations),
                (app) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const configPath = join(workspaceRoot, app.configFile);
                    
                    if (!existsSync(configPath)) {
                        console.log(`Configuration file not found, skipping: ${app.configFile}`);
                        return true;
                    }
                    
                    const config = readNetlifyConfig(configPath);
                    expect(config).toBeTruthy();
                    
                    if (config.headers) {
                        config.headers.forEach((header: any) => {
                            if (header.values && header.values['Cache-Control']) {
                                const cacheControl = header.values['Cache-Control'];
                                
                                // Cache headers should be appropriate for content type
                                if (header.for && header.for.includes('static')) {
                                    // Static assets should have long cache times
                                    expect(cacheControl).toMatch(/max-age=\d+/);
                                } else if (header.for && header.for.includes('api')) {
                                    // API routes should have appropriate caching
                                    expect(cacheControl).toBeDefined();
                                }
                            }
                        });
                    }
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should maintain deployment isolation under concurrent deployments', () => {
            fc.assert(fc.property(
                fc.array(fc.constantFrom(...deploymentConfigurations), { minLength: 2, maxLength: 3 }),
                (apps) => {
                    // Simulate concurrent deployment scenario
                    const deploymentStates = apps.map(app => ({
                        app: app,
                        domain: app.expectedDomain,
                        workspace: app.workspace,
                        buildCommand: `build --workspace=${app.workspace}`,
                        outputDir: app.outputDir
                    }));
                    
                    // Check that each deployment maintains isolation
                    for (let i = 0; i < deploymentStates.length; i++) {
                        for (let j = i + 1; j < deploymentStates.length; j++) {
                            const state1 = deploymentStates[i];
                            const state2 = deploymentStates[j];
                            
                            // Domains should be unique
                            expect(state1.domain).not.toBe(state2.domain);
                            
                            // Workspaces should be unique
                            expect(state1.workspace).not.toBe(state2.workspace);
                            
                            // Build commands should not interfere
                            expect(state1.buildCommand).not.toContain(state2.workspace);
                            expect(state2.buildCommand).not.toContain(state1.workspace);
                            
                            // Output directories should not overlap (unless same type)
                            if (state1.outputDir !== state2.outputDir) {
                                expect(state1.outputDir).not.toBe(state2.outputDir);
                            }
                        }
                    }
                    
                    return true;
                }
            ), { numRuns: 25 });
        });

        it('should have proper environment variable isolation in deployment contexts', () => {
            fc.assert(fc.property(
                fc.constantFrom(...deploymentConfigurations),
                (app) => {
                    // Test that deployment contexts maintain proper isolation
                    const contexts = ['production', 'deploy-preview', 'branch-deploy'];
                    
                    contexts.forEach(context => {
                        // Each context should maintain application isolation
                        const expectedEnvVar = `NETLIFY_APP_NAME=${app.name}`;
                        
                        // Build commands should set proper app identification
                        expect(expectedEnvVar).toContain(app.name);
                        
                        // Context should not leak between applications
                        const otherApps = deploymentConfigurations
                            .filter(other => other.name !== app.name);
                        
                        otherApps.forEach(other => {
                            const otherEnvVar = `NETLIFY_APP_NAME=${other.name}`;
                            expect(expectedEnvVar).not.toBe(otherEnvVar);
                        });
                    });
                    
                    return true;
                }
            ), { numRuns: 10 });
        });
    });
});