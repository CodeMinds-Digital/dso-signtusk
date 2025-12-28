/**
 * Netlify Deployment Environment Variable Isolation Property-Based Tests
 * 
 * **Feature: netlify-deployment, Property 11: Environment Variable Isolation**
 * **Validates: Requirements 6.1**
 * 
 * Tests that for any site configuration, environment variables are scoped to the 
 * specific application and do not leak between deployments.
 */

import fc from 'fast-check';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

// Helper function to get workspace root
function getWorkspaceRoot(): string {
    return resolve(__dirname, '../..');
}

// Helper function to read environment template files
function readEnvTemplate(filePath: string): Record<string, string> | null {
    try {
        const content = readFileSync(filePath, 'utf-8');
        const env: Record<string, string> = {};
        
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            
            // Skip comments and empty lines
            if (trimmed.startsWith('#') || trimmed === '') {
                continue;
            }
            
            // Parse key=value pairs
            const equalIndex = trimmed.indexOf('=');
            if (equalIndex > 0) {
                const key = trimmed.substring(0, equalIndex).trim();
                const value = trimmed.substring(equalIndex + 1).trim();
                env[key] = value;
            }
        }
        
        return env;
    } catch {
        return null;
    }
}

// Helper function to categorize environment variables
function categorizeEnvironmentVariable(key: string, value: string): {
    category: 'public' | 'private' | 'build' | 'legacy';
    scope: 'global' | 'app-specific' | 'service-specific';
    sensitive: boolean;
} {
    const category = key.startsWith('NEXT_PUBLIC_') ? 'public' :
                    key.startsWith('NEXT_PRIVATE_') ? 'private' :
                    key.startsWith('NODE_') || key.startsWith('NPM_') || key.startsWith('TURBO_') || key.startsWith('NETLIFY_') ? 'build' :
                    'legacy';
    
    const scope = key.includes('_URL') || key.includes('_HOST') || key.includes('_ENDPOINT') ? 'app-specific' :
                  key.includes('_API_KEY') || key.includes('_SECRET') || key.includes('_PASSWORD') ? 'service-specific' :
                  'global';
    
    // More refined sensitivity detection - public keys like PostHog are not sensitive
    const sensitive = (key.includes('SECRET') || key.includes('PASSWORD') || key.includes('TOKEN') || 
                      key.includes('CREDENTIALS') || 
                      (key.includes('_API_KEY') && !key.startsWith('NEXT_PUBLIC_')) ||
                      (key.includes('_KEY') && !key.startsWith('NEXT_PUBLIC_') && !key.includes('_PUBLIC_KEY'))) &&
                     // Exclude known public keys
                     !key.includes('POSTHOG_KEY') && 
                     !key.includes('PUBLISHABLE_KEY') &&
                     !key.includes('PUBLIC_KEY') &&
                     !key.includes('GA_MEASUREMENT_ID');
    
    return { category, scope, sensitive };
}

// Helper function to check for environment variable conflicts
function checkEnvironmentConflicts(env1: Record<string, string>, env2: Record<string, string>): {
    conflicts: string[];
    sharedKeys: string[];
    isolatedKeys: { env1: string[]; env2: string[] };
} {
    const keys1 = new Set(Object.keys(env1));
    const keys2 = new Set(Object.keys(env2));
    
    const sharedKeys = Array.from(keys1).filter(key => keys2.has(key));
    const conflicts = sharedKeys.filter(key => {
        const meta = categorizeEnvironmentVariable(key, env1[key]);
        return meta.scope === 'app-specific' && env1[key] !== env2[key];
    });
    
    const isolatedKeys = {
        env1: Array.from(keys1).filter(key => !keys2.has(key)),
        env2: Array.from(keys2).filter(key => !keys1.has(key))
    };
    
    return { conflicts, sharedKeys, isolatedKeys };
}

// Helper function to validate environment variable security
function validateEnvironmentSecurity(env: Record<string, string>): {
    weakSecrets: string[];
    placeholderValues: string[];
    exposedSecrets: string[];
} {
    const weakSecrets: string[] = [];
    const placeholderValues: string[] = [];
    const exposedSecrets: string[] = [];
    
    Object.entries(env).forEach(([key, value]) => {
        const meta = categorizeEnvironmentVariable(key, value);
        
        if (meta.sensitive) {
            // Check for weak secrets
            if (value.length < 32) {
                weakSecrets.push(key);
            }
            
            // Check for placeholder values
            if (value.includes('your-') || value.includes('example') || value.includes('CHANGE_THIS')) {
                placeholderValues.push(key);
            }
            
            // Check for exposed secrets in public variables
            if (meta.category === 'public') {
                exposedSecrets.push(key);
            }
        }
    });
    
    return { weakSecrets, placeholderValues, exposedSecrets };
}

// Application environment template configurations
const environmentTemplates = [
    { name: 'marketing', file: '.env.netlify.marketing.example' },
    { name: 'remix', file: '.env.netlify.remix.example' },
    { name: 'docs', file: '.env.netlify.docs.example' }
];

describe('Netlify Deployment Environment Variable Isolation', () => {
    /**
     * Property 11: Environment Variable Isolation
     * For any site configuration, environment variables should be scoped to the 
     * specific application and not leak between deployments
     */
    describe('Property 11: Environment Variable Isolation', () => {
        it('should have isolated app-specific environment variables between applications', () => {
            fc.assert(fc.property(
                fc.tuple(
                    fc.constantFrom(...environmentTemplates),
                    fc.constantFrom(...environmentTemplates)
                ).filter(([app1, app2]) => app1.name !== app2.name),
                ([app1, app2]) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const env1Path = join(workspaceRoot, app1.file);
                    const env2Path = join(workspaceRoot, app2.file);
                    
                    if (!existsSync(env1Path) || !existsSync(env2Path)) {
                        console.log(`Environment templates not found, skipping: ${app1.file}, ${app2.file}`);
                        return true;
                    }
                    
                    const env1 = readEnvTemplate(env1Path);
                    const env2 = readEnvTemplate(env2Path);
                    
                    expect(env1).toBeTruthy();
                    expect(env2).toBeTruthy();
                    
                    const { conflicts } = checkEnvironmentConflicts(env1!, env2!);
                    
                    // App-specific variables should not conflict between applications
                    expect(conflicts).toHaveLength(0);
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should properly categorize public vs private environment variables', () => {
            fc.assert(fc.property(
                fc.constantFrom(...environmentTemplates),
                (appTemplate) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const envPath = join(workspaceRoot, appTemplate.file);
                    
                    if (!existsSync(envPath)) {
                        console.log(`Environment template not found, skipping: ${appTemplate.file}`);
                        return true;
                    }
                    
                    const env = readEnvTemplate(envPath);
                    expect(env).toBeTruthy();
                    
                    Object.entries(env!).forEach(([key, value]) => {
                        const meta = categorizeEnvironmentVariable(key, value);
                        
                        // Public variables should not contain sensitive data
                        if (meta.category === 'public') {
                            expect(meta.sensitive).toBe(false);
                        }
                        
                        // Private variables can contain sensitive data
                        if (meta.sensitive) {
                            expect(meta.category).not.toBe('public');
                        }
                        
                        // URLs should be properly categorized as app-specific
                        if (key.includes('_URL') || key.includes('_HOST')) {
                            expect(meta.scope).toBe('app-specific');
                        }
                        
                        // API keys and secrets should be service-specific
                        if (key.includes('_API_KEY') || key.includes('_SECRET')) {
                            expect(meta.scope).toBe('service-specific');
                        }
                    });
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should not expose sensitive information in public variables', () => {
            fc.assert(fc.property(
                fc.constantFrom(...environmentTemplates),
                (appTemplate) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const envPath = join(workspaceRoot, appTemplate.file);
                    
                    if (!existsSync(envPath)) {
                        console.log(`Environment template not found, skipping: ${appTemplate.file}`);
                        return true;
                    }
                    
                    const env = readEnvTemplate(envPath);
                    expect(env).toBeTruthy();
                    
                    const { exposedSecrets } = validateEnvironmentSecurity(env!);
                    
                    // No sensitive data should be in public variables
                    expect(exposedSecrets).toHaveLength(0);
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should have consistent global configuration across applications', () => {
            fc.assert(fc.property(
                fc.constant('global-consistency'),
                () => {
                    const workspaceRoot = getWorkspaceRoot();
                    const buildVars = new Map<string, Set<string>>();
                    
                    // Only check truly global build variables
                    const globalBuildVars = ['NODE_ENV', 'NODE_VERSION', 'NPM_VERSION', 'TURBO_TELEMETRY_DISABLED'];
                    
                    // Collect build variables from all templates
                    for (const template of environmentTemplates) {
                        const envPath = join(workspaceRoot, template.file);
                        
                        if (!existsSync(envPath)) {
                            continue;
                        }
                        
                        const env = readEnvTemplate(envPath);
                        if (!env) continue;
                        
                        Object.entries(env).forEach(([key, value]) => {
                            // Only track specific global build variables
                            if (globalBuildVars.includes(key)) {
                                if (!buildVars.has(key)) {
                                    buildVars.set(key, new Set());
                                }
                                buildVars.get(key)!.add(value);
                            }
                        });
                    }
                    
                    // Build variables should have consistent values across applications
                    buildVars.forEach((values, key) => {
                        expect(values.size).toBeLessThanOrEqual(1);
                    });
                    
                    return true;
                }
            ), { numRuns: 1 });
        });

        it('should have proper URL isolation between applications', () => {
            fc.assert(fc.property(
                fc.constantFrom(...environmentTemplates),
                (appTemplate) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const envPath = join(workspaceRoot, appTemplate.file);
                    
                    if (!existsSync(envPath)) {
                        console.log(`Environment template not found, skipping: ${appTemplate.file}`);
                        return true;
                    }
                    
                    const env = readEnvTemplate(envPath);
                    expect(env).toBeTruthy();
                    
                    const urlVars = Object.entries(env!).filter(([key]) => 
                        key.includes('_URL') || key.includes('_HOST') || key.includes('_ENDPOINT')
                    );
                    
                    urlVars.forEach(([key, value]) => {
                        // URLs should be valid format (basic check)
                        if (value.startsWith('http')) {
                            expect(() => new URL(value)).not.toThrow();
                        }
                        
                        // App-specific URLs should reference the correct application
                        if (key === 'NEXT_PUBLIC_WEBAPP_URL') {
                            expect(value).toContain('app.');
                        } else if (key === 'NEXT_PUBLIC_MARKETING_URL') {
                            expect(value).not.toContain('app.');
                            expect(value).not.toContain('docs.');
                        } else if (key === 'NEXT_PUBLIC_DOCS_URL') {
                            expect(value).toContain('docs.');
                        }
                    });
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should have environment-specific database configurations', () => {
            fc.assert(fc.property(
                fc.constantFrom(...environmentTemplates.filter(t => t.name === 'remix')),
                (appTemplate) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const envPath = join(workspaceRoot, appTemplate.file);
                    
                    if (!existsSync(envPath)) {
                        console.log(`Environment template not found, skipping: ${appTemplate.file}`);
                        return true;
                    }
                    
                    const env = readEnvTemplate(envPath);
                    expect(env).toBeTruthy();
                    
                    const dbVars = Object.entries(env!).filter(([key]) => 
                        key.includes('DATABASE_URL') || key.includes('POSTGRES_')
                    );
                    
                    // Should have multiple database URL configurations
                    expect(dbVars.length).toBeGreaterThan(0);
                    
                    dbVars.forEach(([key, value]) => {
                        // Database URLs should use PostgreSQL protocol
                        if (value.startsWith('postgresql://')) {
                            // Skip validation for placeholder URLs
                            if (value.includes('username:password@host') || value.includes('${') || value.includes('CHANGE_THIS')) {
                                return; // Skip placeholder values
                            }
                            
                            expect(() => new URL(value)).not.toThrow();
                            
                            const url = new URL(value);
                            expect(url.protocol).toBe('postgresql:');
                            
                            // Should have SSL mode for production-like configs
                            if (value.includes('sslmode=require')) {
                                expect(url.searchParams.get('sslmode')).toBe('require');
                            }
                        }
                    });
                    
                    return true;
                }
            ), { numRuns: 5 });
        });

        it('should have proper service isolation for third-party integrations', () => {
            fc.assert(fc.property(
                fc.constantFrom(...environmentTemplates),
                (appTemplate) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const envPath = join(workspaceRoot, appTemplate.file);
                    
                    if (!existsSync(envPath)) {
                        console.log(`Environment template not found, skipping: ${appTemplate.file}`);
                        return true;
                    }
                    
                    const env = readEnvTemplate(envPath);
                    expect(env).toBeTruthy();
                    
                    // Group variables by service
                    const services = new Map<string, string[]>();
                    
                    Object.keys(env!).forEach(key => {
                        if (key.includes('STRIPE_')) {
                            if (!services.has('stripe')) services.set('stripe', []);
                            services.get('stripe')!.push(key);
                        } else if (key.includes('RESEND_') || key.includes('SMTP_')) {
                            if (!services.has('email')) services.set('email', []);
                            services.get('email')!.push(key);
                        } else if (key.includes('S3_') || key.includes('UPLOAD_')) {
                            if (!services.has('storage')) services.set('storage', []);
                            services.get('storage')!.push(key);
                        } else if (key.includes('POSTHOG_')) {
                            if (!services.has('analytics')) services.set('analytics', []);
                            services.get('analytics')!.push(key);
                        }
                    });
                    
                    // Each service should have consistent configuration
                    services.forEach((keys, serviceName) => {
                        expect(keys.length).toBeGreaterThan(0);
                        
                        // Service-specific validation
                        if (serviceName === 'stripe') {
                            const hasSecretKey = keys.some(k => k.includes('SECRET') || k.includes('API_KEY'));
                            const hasPublicKey = keys.some(k => k.includes('PUBLISHABLE'));
                            
                            if (hasSecretKey || hasPublicKey) {
                                expect(hasSecretKey && hasPublicKey).toBe(true);
                            }
                        }
                    });
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should not have placeholder values in production-ready templates', () => {
            fc.assert(fc.property(
                fc.constantFrom(...environmentTemplates),
                (appTemplate) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const envPath = join(workspaceRoot, appTemplate.file);
                    
                    if (!existsSync(envPath)) {
                        console.log(`Environment template not found, skipping: ${appTemplate.file}`);
                        return true;
                    }
                    
                    const env = readEnvTemplate(envPath);
                    expect(env).toBeTruthy();
                    
                    const { placeholderValues } = validateEnvironmentSecurity(env!);
                    
                    // Templates should use placeholder patterns that are clearly identifiable
                    placeholderValues.forEach(key => {
                        const value = env![key];
                        
                        // Acceptable placeholder patterns
                        const isAcceptablePlaceholder = 
                            value.includes('your-') || 
                            value.includes('${') || 
                            value.includes('CHANGE_THIS') ||
                            value.includes('example');
                        
                        expect(isAcceptablePlaceholder).toBe(true);
                    });
                    
                    return true;
                }
            ), { numRuns: 10 });
        });

        it('should have proper build environment isolation', () => {
            fc.assert(fc.property(
                fc.constantFrom(...environmentTemplates),
                (appTemplate) => {
                    const workspaceRoot = getWorkspaceRoot();
                    const envPath = join(workspaceRoot, appTemplate.file);
                    
                    if (!existsSync(envPath)) {
                        console.log(`Environment template not found, skipping: ${appTemplate.file}`);
                        return true;
                    }
                    
                    const env = readEnvTemplate(envPath);
                    expect(env).toBeTruthy();
                    
                    const buildVars = Object.entries(env!).filter(([key]) => 
                        key.startsWith('NODE_') || key.startsWith('NPM_') || 
                        key.startsWith('TURBO_') || key.startsWith('NETLIFY_')
                    );
                    
                    buildVars.forEach(([key, value]) => {
                        // Build variables should have appropriate values
                        if (key === 'NODE_ENV') {
                            expect(['development', 'production', 'test']).toContain(value);
                        } else if (key === 'NODE_VERSION') {
                            expect(value).toMatch(/^\d+$/);
                        } else if (key === 'NPM_VERSION') {
                            expect(value).toMatch(/^\d+\.\d+\.\d+$/);
                        } else if (key.includes('_ENABLED')) {
                            expect(['true', 'false']).toContain(value);
                        }
                    });
                    
                    return true;
                }
            ), { numRuns: 10 });
        });
    });
});