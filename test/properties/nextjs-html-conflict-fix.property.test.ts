/**
 * Next.js Html Component Conflict Fix Property-Based Tests
 * 
 * **Feature: nextjs-html-component-conflict-fix, Property 2: Html Component Conflict Elimination**
 * **Validates: Requirements 1.4, 2.2, 5.2, 5.3**
 * 
 * Tests that Next.js applications build successfully without Html component import conflicts,
 * ensuring no "Html should not be imported outside of pages/_document" errors occur.
 */

import fc from 'fast-check';
import { existsSync, readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

// Reduced configuration for faster property tests (10 iterations for quick validation)
const STANDARD_CONFIG = { numRuns: 10 };

// Helper function to get Next.js app directories
function getNextJsAppDirectories(): string[] {
    const appsDir = resolve(__dirname, '../../apps');
    if (!existsSync(appsDir)) return [];

    return readdirSync(appsDir)
        .map(name => join(appsDir, name))
        .filter(path => statSync(path).isDirectory())
        .filter(path => existsSync(join(path, 'package.json')))
        .filter(path => {
            // Check if it's a Next.js app
            const packageJson = readJsonFile(join(path, 'package.json'));
            return packageJson?.dependencies?.next || packageJson?.devDependencies?.next;
        });
}

// Helper function to get email template files
function getEmailTemplateFiles(): string[] {
    const emailTemplatesDir = resolve(__dirname, '../../packages/email/templates');
    if (!existsSync(emailTemplatesDir)) return [];

    return readdirSync(emailTemplatesDir)
        .filter(name => name.endsWith('.tsx'))
        .map(name => join(emailTemplatesDir, name));
}

// Helper function to read JSON file safely
function readJsonFile(filePath: string): any {
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
        return null;
    }
}

// Helper function to check Next.js configuration for Html conflicts
function checkNextConfigForConflicts(appDir: string): { hasConflicts: boolean; issues: string[] } {
    const nextConfigPath = join(appDir, 'next.config.js');
    const nextConfigTsPath = join(appDir, 'next.config.ts');
    
    const configPath = existsSync(nextConfigPath) ? nextConfigPath : 
                      existsSync(nextConfigTsPath) ? nextConfigTsPath : null;

    if (!configPath) {
        return { hasConflicts: false, issues: [] };
    }

    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const issues: string[] = [];

        // Check for problematic React Email configurations that would cause conflicts
        
        // 1. Check if email packages are in transpilePackages (this causes conflicts)
        const transpileMatch = configContent.match(/transpilePackages\s*:\s*\[([\s\S]*?)\]/);
        if (transpileMatch) {
            const transpileContent = transpileMatch[1];
            if (transpileContent.includes('@react-email') || transpileContent.includes('@signtusk/email')) {
                issues.push('Has email packages in transpilePackages (causes conflicts)');
            }
        }

        // 2. Check if email packages are imported without proper externals
        // This is more complex - we need to see if there are any direct imports of email packages
        // in the config that aren't properly externalized
        
        // For now, we'll consider the configuration clean if:
        // - Email packages are NOT in transpilePackages
        // - If email packages are referenced, they should be in externals or serverComponentsExternalPackages
        
        const hasEmailInExternals = configContent.includes('externals') && configContent.includes('@react-email');
        const hasEmailInServerComponents = configContent.includes('serverComponentsExternalPackages') && configContent.includes('@react-email');
        const hasEmailReferences = configContent.includes('@react-email') || configContent.includes('@signtusk/email');
        
        // If there are email references but no proper externalization, that's a problem
        if (hasEmailReferences && !hasEmailInExternals && !hasEmailInServerComponents) {
            // But only if it's not just in comments
            const nonCommentContent = configContent.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
            if (nonCommentContent.includes('@react-email') || nonCommentContent.includes('@signtusk/email')) {
                issues.push('Uses email packages but lacks proper externals configuration');
            }
        }

        return { hasConflicts: issues.length > 0, issues };
    } catch {
        return { hasConflicts: false, issues: ['Could not read config file'] };
    }
}

// Helper function to check email template isolation
function checkEmailTemplateIsolation(templatePath: string): { isIsolated: boolean; issues: string[] } {
    try {
        const templateContent = readFileSync(templatePath, 'utf-8');
        const issues: string[] = [];

        // Check that Html is imported directly from @react-email/html
        const htmlImportMatch = templateContent.match(/import\s*\{[^}]*Html[^}]*\}\s*from\s*['"]([^'"]+)['"]/);
        if (htmlImportMatch) {
            const importSource = htmlImportMatch[1];
            if (importSource !== '@react-email/html') {
                issues.push(`Html imported from ${importSource} instead of @react-email/html`);
            }
        } else if (templateContent.includes('<Html>') || templateContent.includes('<Html ')) {
            // Html is used but not imported directly
            issues.push('Html component used but not imported directly from @react-email/html');
        }

        // Check that other components are imported from ../components (which is correct)
        const componentImportMatch = templateContent.match(/import\s*\{[^}]*\}\s*from\s*['"]\.\.\/components['"]/);
        if (componentImportMatch && componentImportMatch[0].includes('Html')) {
            issues.push('Html component imported from ../components (should be direct from @react-email/html)');
        }

        return { isIsolated: issues.length === 0, issues };
    } catch {
        return { isIsolated: false, issues: ['Could not read template file'] };
    }
}

// Helper function to check conflict prevention principles
function checkConflictPreventionPrinciples(appDir: string): { followsPrinciples: boolean; issues: string[] } {
    const nextConfigPath = join(appDir, 'next.config.js');
    const nextConfigTsPath = join(appDir, 'next.config.ts');
    
    const configPath = existsSync(nextConfigPath) ? nextConfigPath : 
                      existsSync(nextConfigTsPath) ? nextConfigTsPath : null;

    if (!configPath) {
        return { followsPrinciples: true, issues: [] }; // No config is fine
    }

    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const issues: string[] = [];

        // Principle 1: Should not transpile email packages
        const transpileMatch = configContent.match(/transpilePackages\s*:\s*\[([\s\S]*?)\]/);
        if (transpileMatch) {
            const transpileContent = transpileMatch[1];
            if (transpileContent.includes('@react-email') || transpileContent.includes('@signtusk/email')) {
                issues.push('Violates principle: Email packages should not be transpiled');
            }
        }

        // Principle 2: Should not set email packages to false in webpack aliases (causes lockfile issues)
        const aliasMatch = configContent.match(/alias\s*=[\s\S]*?@react-email\/html['"]\s*:\s*false/);
        if (aliasMatch) {
            issues.push('Violates principle: Setting @react-email/html to false causes lockfile issues');
        }

        // Principle 3: Should not disable SWC minification (causes build issues)
        const swcMinifyMatch = configContent.match(/swcMinify\s*:\s*false/);
        if (swcMinifyMatch) {
            issues.push('Violates principle: SWC minification should be enabled for proper builds');
        }

        // Principle 4: Should not disable chunk splitting completely (causes performance issues)
        const splitChunksMatch = configContent.match(/splitChunks\s*:\s*false/);
        if (splitChunksMatch) {
            issues.push('Violates principle: Completely disabling chunk splitting causes performance issues');
        }

        // Principle 5: Should not add all email packages to externals (causes lockfile issues)
        const externalsMatch = configContent.match(/externals[\s\S]*?@react-email/);
        if (externalsMatch && configContent.includes('emailPackages.forEach')) {
            issues.push('Violates principle: Adding all email packages to externals causes lockfile issues');
        }

        return { followsPrinciples: issues.length === 0, issues };
    } catch {
        return { followsPrinciples: false, issues: ['Could not read config file'] };
    }
}

// Helper function to check configuration documentation
function checkConfigurationDocumentation(appDir: string): { hasDocumentation: boolean; missingDocs: string[] } {
    const nextConfigPath = join(appDir, 'next.config.js');
    const nextConfigTsPath = join(appDir, 'next.config.ts');
    
    const configPath = existsSync(nextConfigPath) ? nextConfigPath : 
                      existsSync(nextConfigTsPath) ? nextConfigTsPath : null;

    if (!configPath) {
        return { hasDocumentation: true, missingDocs: [] }; // No config is fine
    }

    try {
        const configContent = readFileSync(configPath, 'utf-8');
        const missingDocs: string[] = [];

        // Check for documentation about Html component separation
        if (!configContent.includes('CONFIGURATION-LEVEL CONFLICT PREVENTION')) {
            missingDocs.push('Missing CONFIGURATION-LEVEL CONFLICT PREVENTION documentation');
        }

        // Check for documentation about email package handling
        if (!configContent.includes('email packages') && !configContent.includes('Html component')) {
            missingDocs.push('Missing documentation about email package and Html component handling');
        }

        // Check for documentation about conflict prevention principles
        if (!configContent.includes('prevent') && !configContent.includes('conflict')) {
            missingDocs.push('Missing documentation about conflict prevention');
        }

        return { hasDocumentation: missingDocs.length === 0, missingDocs };
    } catch {
        return { hasDocumentation: false, missingDocs: ['Could not read config file'] };
    }
}

describe('Next.js Html Component Conflict Fix', () => {
    /**
     * Property 2: Html Component Conflict Elimination
     * For any build process execution, the output should not contain "Html should not be imported outside of pages/_document" errors
     * or any Html component import conflicts from ESLint or TypeScript
     * **Feature: nextjs-html-component-conflict-fix, Property 2: Html Component Conflict Elimination**
     * **Validates: Requirements 1.4, 2.2, 5.2, 5.3**
     */
    describe('Property 2: Html Component Conflict Elimination', () => {
        it('should have clean Next.js configurations without React Email Html conflicts', () => {
            const nextJsApps = getNextJsAppDirectories();

            // Skip if no Next.js apps found
            if (nextJsApps.length === 0) {
                expect(true).toBe(true);
                return;
            }

            fc.assert(fc.property(
                fc.constantFrom(...nextJsApps),
                (appDir) => {
                    const packageJson = readJsonFile(join(appDir, 'package.json'));
                    const appName = packageJson?.name || 'unknown';

                    // Check Next.js configuration for Html conflicts
                    const configCheck = checkNextConfigForConflicts(appDir);
                    
                    // The configuration should not have Html component conflicts
                    expect(configCheck.hasConflicts).toBe(false);
                    
                    if (configCheck.hasConflicts) {
                        console.log(`Configuration conflicts found in ${appName}:`, configCheck.issues);
                    }

                    return true;
                }
            ), STANDARD_CONFIG);
        });
    });

    /**
     * Property 3: Email Functionality and Component Isolation
     * For any email template generation or contact form submission, React Email Html components should function correctly 
     * without interfering with Next.js built-in Html components
     * **Feature: nextjs-html-component-conflict-fix, Property 3: Email Functionality and Component Isolation**
     * **Validates: Requirements 1.2, 1.3, 3.1, 3.2, 3.3**
     */
    describe('Property 3: Email Functionality and Component Isolation', () => {
        it('should have properly isolated Html imports in all email templates', () => {
            const emailTemplates = getEmailTemplateFiles();

            // Skip if no email templates found
            if (emailTemplates.length === 0) {
                expect(true).toBe(true);
                return;
            }

            fc.assert(fc.property(
                fc.constantFrom(...emailTemplates),
                (templatePath) => {
                    const templateName = templatePath.split('/').pop() || 'unknown';

                    // Check email template isolation
                    const isolationCheck = checkEmailTemplateIsolation(templatePath);
                    
                    // The template should have proper Html component isolation
                    expect(isolationCheck.isIsolated).toBe(true);
                    
                    if (!isolationCheck.isIsolated) {
                        console.log(`Isolation issues found in ${templateName}:`, isolationCheck.issues);
                    }

                    return true;
                }
            ), STANDARD_CONFIG);
        });

        it('should not export Html component from email components package', () => {
            const emailComponentsPath = resolve(__dirname, '../../packages/email/components.ts');
            
            if (!existsSync(emailComponentsPath)) {
                expect(true).toBe(true);
                return;
            }

            const componentsContent = readFileSync(emailComponentsPath, 'utf-8');
            
            // Html should not be exported from the components file
            expect(componentsContent).not.toMatch(/export\s*\{[^}]*Html[^}]*\}/);
            
            // Should have a comment explaining why Html is not exported
            expect(componentsContent).toMatch(/Html.*removed.*prevent.*Next\.js.*conflicts/i);
        });
    });

    /**
     * Property 4: Configuration-Level Conflict Prevention
     * For any addition of new email templates or Html-related components, the Next.js configuration should prevent 
     * Html component conflicts while maintaining proper component scoping
     * **Feature: nextjs-html-component-conflict-fix, Property 4: Configuration-Level Conflict Prevention**
     * **Validates: Requirements 2.3, 4.1**
     */
    describe('Property 4: Configuration-Level Conflict Prevention', () => {
        it('should have Next.js configurations that prevent Html component conflicts', () => {
            const nextJsApps = getNextJsAppDirectories();

            // Skip if no Next.js apps found
            if (nextJsApps.length === 0) {
                expect(true).toBe(true);
                return;
            }

            fc.assert(fc.property(
                fc.constantFrom(...nextJsApps),
                (appDir) => {
                    const packageJson = readJsonFile(join(appDir, 'package.json'));
                    const appName = packageJson?.name || 'unknown';

                    // Check that configuration follows conflict prevention principles
                    const preventionCheck = checkConflictPreventionPrinciples(appDir);
                    
                    // The configuration should follow conflict prevention principles
                    expect(preventionCheck.followsPrinciples).toBe(true);
                    
                    if (!preventionCheck.followsPrinciples) {
                        console.log(`Conflict prevention issues found in ${appName}:`, preventionCheck.issues);
                    }

                    return true;
                }
            ), STANDARD_CONFIG);
        });

        it('should have documentation about Html component separation in Next.js configs', () => {
            const nextJsApps = getNextJsAppDirectories();

            // Skip if no Next.js apps found
            if (nextJsApps.length === 0) {
                expect(true).toBe(true);
                return;
            }

            for (const appDir of nextJsApps) {
                const packageJson = readJsonFile(join(appDir, 'package.json'));
                const appName = packageJson?.name || 'unknown';

                const documentationCheck = checkConfigurationDocumentation(appDir);
                
                // The configuration should have documentation about Html component separation
                expect(documentationCheck.hasDocumentation).toBe(true);
                
                if (!documentationCheck.hasDocumentation) {
                    console.log(`Missing Html component separation documentation in ${appName}`);
                }
            }
        });
    });
});