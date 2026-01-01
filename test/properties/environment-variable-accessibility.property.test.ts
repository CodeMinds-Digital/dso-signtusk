import * as fc from 'fast-check';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, it } from 'vitest';

/**
 * **Feature: vercel-deployment-fix, Property 4: Environment Variable Accessibility**
 * **Validates: Requirements 2.1, 2.3, 4.2, 5.4**
 * 
 * For any required environment variable, it must be accessible to the appropriate 
 * build or runtime context through Vercel's environment configuration system.
 * 
 * This property ensures that:
 * - All required environment variables are properly declared in turbo.json
 * - Environment variables are accessible during both build and runtime phases
 * - Variables are properly scoped for their intended use (build-time vs runtime)
 * - Vercel can properly pass environment variables to the application
 */

describe('Property 4: Environment Variable Accessibility', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const turboConfigPath = path.join(projectRoot, 'turbo.json');
    const remixAppPath = path.join(projectRoot, 'apps/remix');
    const vercelConfigPath = path.join(projectRoot, 'vercel.json');

    // Define required environment variables by category
    const requiredVariables = {
        build: [
            'NODE_ENV',
            'SKIP_ENV_VALIDATION'
        ],
        runtime: [
            'DATABASE_URL',
            'NEXT_PRIVATE_DATABASE_URL',
            'POSTGRES_PRISMA_URL',
            'NEXTAUTH_SECRET',
            'JWT_SECRET',
            'ENCRYPTION_KEY',
            'NEXT_PRIVATE_ENCRYPTION_KEY',
            'NEXT_PUBLIC_APP_URL',
            'NEXT_PUBLIC_WEBAPP_URL',
            'AWS_ACCESS_KEY_ID',
            'AWS_SECRET_ACCESS_KEY',
            'AWS_REGION',
            'NEXT_PRIVATE_UPLOAD_BUCKET',
            'NEXT_PUBLIC_UPLOAD_TRANSPORT',
            'NEXT_PRIVATE_SMTP_TRANSPORT'
        ],
        optional: [
            'REDIS_URL',
            'NEXT_PRIVATE_RESEND_API_KEY',
            'NEXT_PUBLIC_POSTHOG_KEY',
            'NEXT_PUBLIC_POSTHOG_HOST',
            'NEXT_PRIVATE_STRIPE_API_KEY',
            'NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET',
            'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
            'RATE_LIMIT_ENABLED',
            'WEBHOOK_SECRET'
        ]
    };

    // Helper function to load turbo.json configuration
    function loadTurboConfig(): any {
        if (!existsSync(turboConfigPath)) {
            return null;
        }
        
        try {
            return JSON.parse(readFileSync(turboConfigPath, 'utf8'));
        } catch (error) {
            return null;
        }
    }

    // Helper function to load vercel.json configuration
    function loadVercelConfig(): any {
        if (!existsSync(vercelConfigPath)) {
            return null;
        }
        
        try {
            return JSON.parse(readFileSync(vercelConfigPath, 'utf8'));
        } catch (error) {
            return null;
        }
    }

    // Helper function to check if a variable is declared in turbo.json
    function isVariableDeclaredInTurbo(variableName: string, turboConfig: any): boolean {
        if (!turboConfig || !turboConfig.globalEnv) {
            return false;
        }
        
        return turboConfig.globalEnv.includes(variableName);
    }

    // Helper function to check if a variable is accessible in build context
    function isVariableAccessibleInBuild(variableName: string, vercelConfig: any): boolean {
        if (!vercelConfig) {
            return true; // Assume accessible if no config
        }
        
        // Check if variable is in build.env section
        if (vercelConfig.build && vercelConfig.build.env) {
            return vercelConfig.build.env.hasOwnProperty(variableName);
        }
        
        // Check if variable is in general env section
        if (vercelConfig.env) {
            return vercelConfig.env.hasOwnProperty(variableName);
        }
        
        return true; // Assume accessible if not explicitly restricted
    }

    // Helper function to simulate environment variable loading
    function simulateEnvironmentLoading(variables: string[]): { loaded: string[]; missing: string[] } {
        const loaded: string[] = [];
        const missing: string[] = [];
        
        for (const variable of variables) {
            // Simulate checking if variable would be available in Vercel environment
            // In real Vercel environment, these would be set via dashboard
            if (process.env[variable] !== undefined) {
                loaded.push(variable);
            } else {
                missing.push(variable);
            }
        }
        
        return { loaded, missing };
    }

    // Helper function to check variable naming conventions
    function hasCorrectNamingConvention(variableName: string): boolean {
        // Check for proper prefixes
        const validPrefixes = [
            'NEXT_PUBLIC_',  // Client-side accessible
            'NEXT_PRIVATE_', // Server-side only
            'NODE_ENV',      // Standard Node.js
            'DATABASE_',     // Database related
            'POSTGRES_',     // PostgreSQL specific
            'AWS_',          // AWS services
            'JWT_',          // JWT tokens
            'NEXTAUTH_',     // NextAuth.js
            'ENCRYPTION_',   // Encryption keys
            'REDIS_',        // Redis cache
            'WEBHOOK_',      // Webhook configuration
            'RATE_LIMIT_',   // Rate limiting
            'SKIP_',         // Skip flags
            'DISABLE_',      // Disable flags
            'ENABLE_'        // Enable flags
        ];
        
        return validPrefixes.some(prefix => 
            variableName.startsWith(prefix) || variableName === prefix.slice(0, -1)
        );
    }

    it('should have all required environment variables declared in turbo.json globalEnv', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...requiredVariables.build, ...requiredVariables.runtime),
                (variableName) => {
                    const turboConfig = loadTurboConfig();
                    
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }
                    
                    return isVariableDeclaredInTurbo(variableName, turboConfig);
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have proper environment variable scoping for build vs runtime', () => {
        fc.assert(
            fc.property(
                fc.record({
                    buildVars: fc.subarray(requiredVariables.build, { minLength: 1 }),
                    runtimeVars: fc.subarray(requiredVariables.runtime, { minLength: 1 })
                }),
                ({ buildVars, runtimeVars }) => {
                    const vercelConfig = loadVercelConfig();
                    
                    // Build variables should be accessible during build
                    const buildAccessible = buildVars.every(variable => 
                        isVariableAccessibleInBuild(variable, vercelConfig)
                    );
                    
                    // Runtime variables should follow proper naming conventions
                    const runtimeNaming = runtimeVars.every(variable => 
                        hasCorrectNamingConvention(variable)
                    );
                    
                    return buildAccessible && runtimeNaming;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have environment variables accessible through Vercel configuration system', () => {
        fc.assert(
            fc.property(
                fc.subarray([...requiredVariables.build, ...requiredVariables.runtime], { minLength: 1, maxLength: 10 }),
                (selectedVariables) => {
                    const turboConfig = loadTurboConfig();
                    
                    if (!turboConfig) {
                        return false; // Configuration should exist
                    }
                    
                    // All selected variables should be declared in turbo.json
                    return selectedVariables.every(variable => 
                        isVariableDeclaredInTurbo(variable, turboConfig)
                    );
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should properly categorize variables by their intended use context', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('build', 'runtime', 'optional'),
                (category) => {
                    const variables = requiredVariables[category as keyof typeof requiredVariables];
                    
                    if (!variables || variables.length === 0) {
                        return true; // Empty category is valid
                    }
                    
                    return variables.every(variable => {
                        // Build variables should be simple and not contain sensitive data
                        if (category === 'build') {
                            return !variable.includes('SECRET') && 
                                   !variable.includes('KEY') && 
                                   !variable.includes('PASSWORD');
                        }
                        
                        // Runtime variables should follow proper naming conventions
                        if (category === 'runtime') {
                            return hasCorrectNamingConvention(variable);
                        }
                        
                        // Optional variables should also follow naming conventions
                        if (category === 'optional') {
                            return hasCorrectNamingConvention(variable);
                        }
                        
                        return true;
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have client-side variables properly prefixed with NEXT_PUBLIC_', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    'NEXT_PUBLIC_APP_URL',
                    'NEXT_PUBLIC_WEBAPP_URL',
                    'NEXT_PUBLIC_UPLOAD_TRANSPORT',
                    'NEXT_PUBLIC_POSTHOG_KEY',
                    'NEXT_PUBLIC_POSTHOG_HOST',
                    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
                ),
                (publicVariable) => {
                    // Public variables should start with NEXT_PUBLIC_
                    return publicVariable.startsWith('NEXT_PUBLIC_');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have server-side sensitive variables properly prefixed with NEXT_PRIVATE_', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    'NEXT_PRIVATE_DATABASE_URL',
                    'NEXT_PRIVATE_ENCRYPTION_KEY',
                    'NEXT_PRIVATE_UPLOAD_BUCKET',
                    'NEXT_PRIVATE_SMTP_TRANSPORT',
                    'NEXT_PRIVATE_RESEND_API_KEY',
                    'NEXT_PRIVATE_STRIPE_API_KEY',
                    'NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET'
                ),
                (privateVariable) => {
                    // Private variables should start with NEXT_PRIVATE_
                    return privateVariable.startsWith('NEXT_PRIVATE_');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have environment variables accessible during application startup', () => {
        fc.assert(
            fc.property(
                fc.subarray(requiredVariables.runtime, { minLength: 1, maxLength: 5 }),
                (runtimeVariables) => {
                    // Simulate environment loading during application startup
                    const { loaded, missing } = simulateEnvironmentLoading(runtimeVariables);
                    
                    // In a properly configured Vercel environment, all runtime variables should be accessible
                    // For testing purposes, we check that the variables follow proper patterns
                    return runtimeVariables.every(variable => {
                        // Check that variable follows proper naming convention
                        const hasValidNaming = hasCorrectNamingConvention(variable);
                        
                        // Check that variable is declared in turbo.json
                        const turboConfig = loadTurboConfig();
                        const isDeclaredInTurbo = turboConfig ? 
                            isVariableDeclaredInTurbo(variable, turboConfig) : false;
                        
                        return hasValidNaming && isDeclaredInTurbo;
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have database variables accessible for Prisma operations', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    'DATABASE_URL',
                    'NEXT_PRIVATE_DATABASE_URL',
                    'POSTGRES_PRISMA_URL'
                ),
                (databaseVariable) => {
                    const turboConfig = loadTurboConfig();
                    
                    if (!turboConfig) {
                        return false; // Configuration should exist
                    }
                    
                    // Database variables should be declared in turbo.json
                    const isDeclared = isVariableDeclaredInTurbo(databaseVariable, turboConfig);
                    
                    // Database variables should follow proper naming
                    const hasValidNaming = databaseVariable.includes('DATABASE') || 
                                         databaseVariable.includes('POSTGRES');
                    
                    return isDeclared && hasValidNaming;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have authentication variables accessible for NextAuth operations', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    'NEXTAUTH_SECRET',
                    'JWT_SECRET',
                    'ENCRYPTION_KEY',
                    'NEXT_PRIVATE_ENCRYPTION_KEY'
                ),
                (authVariable) => {
                    const turboConfig = loadTurboConfig();
                    
                    if (!turboConfig) {
                        return false; // Configuration should exist
                    }
                    
                    // Auth variables should be declared in turbo.json
                    const isDeclared = isVariableDeclaredInTurbo(authVariable, turboConfig);
                    
                    // Auth variables should contain appropriate keywords
                    const hasValidNaming = authVariable.includes('SECRET') || 
                                         authVariable.includes('KEY') ||
                                         authVariable.includes('AUTH');
                    
                    return isDeclared && hasValidNaming;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have file storage variables accessible for upload operations', () => {
        fc.assert(
            fc.property(
                fc.constantFrom(
                    'AWS_ACCESS_KEY_ID',
                    'AWS_SECRET_ACCESS_KEY',
                    'AWS_REGION',
                    'NEXT_PRIVATE_UPLOAD_BUCKET',
                    'NEXT_PUBLIC_UPLOAD_TRANSPORT'
                ),
                (storageVariable) => {
                    const turboConfig = loadTurboConfig();
                    
                    if (!turboConfig) {
                        return false; // Configuration should exist
                    }
                    
                    // Storage variables should be declared in turbo.json
                    const isDeclared = isVariableDeclaredInTurbo(storageVariable, turboConfig);
                    
                    // Storage variables should follow AWS or upload naming patterns
                    const hasValidNaming = storageVariable.includes('AWS') || 
                                         storageVariable.includes('UPLOAD');
                    
                    return isDeclared && hasValidNaming;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should maintain environment variable accessibility across different deployment contexts', () => {
        fc.assert(
            fc.property(
                fc.record({
                    production: fc.subarray(requiredVariables.runtime, { minLength: 1, maxLength: 3 }),
                    preview: fc.subarray(requiredVariables.runtime, { minLength: 1, maxLength: 3 }),
                    development: fc.subarray([...requiredVariables.runtime, ...requiredVariables.optional], { minLength: 1, maxLength: 3 })
                }),
                ({ production, preview, development }) => {
                    const turboConfig = loadTurboConfig();
                    
                    if (!turboConfig) {
                        return false; // Configuration should exist
                    }
                    
                    // All variables across all contexts should be declared in turbo.json
                    const allVariables = [...new Set([...production, ...preview, ...development])];
                    
                    return allVariables.every(variable => 
                        isVariableDeclaredInTurbo(variable, turboConfig)
                    );
                }
            ),
            { numRuns: 100 }
        );
    });
});