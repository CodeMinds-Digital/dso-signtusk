import * as fc from 'fast-check';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { describe, it } from 'vitest';

/**
 * **Feature: vercel-deployment-fix, Property 8: Turbo Configuration Compatibility**
 * **Validates: Requirements 4.4**
 * 
 * For any Turbo build task, all required environment variables must be properly declared 
 * in turbo.json and accessible during Vercel execution.
 * 
 * This property ensures that:
 * - All required environment variables are declared in turbo.json globalEnv
 * - Task-specific environment variables are properly scoped in task configurations
 * - Vercel-specific environment variables are included in passThroughEnv
 * - Cache keys include relevant environment variables for proper invalidation
 * - Environment variable scoping is consistent across all build tasks
 */

describe('Property 8: Turbo Configuration Compatibility', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const turboConfigPath = path.join(projectRoot, 'turbo.json');

    // Helper function to get turbo.json configuration
    function getTurboConfig(): any {
        if (!existsSync(turboConfigPath)) {
            return null;
        }
        
        try {
            return JSON.parse(readFileSync(turboConfigPath, 'utf8'));
        } catch (error) {
            return null;
        }
    }

    // Helper function to extract environment variables from package.json scripts
    function extractEnvVarsFromScripts(packageJsonPath: string): string[] {
        if (!existsSync(packageJsonPath)) {
            return [];
        }

        try {
            const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
            const scripts = packageJson.scripts || {};
            const envVars = new Set<string>();

            // Extract environment variables from script commands
            const scriptCommands = Object.values(scripts).join(' ');
            const envVarPattern = /\$\{?([A-Z_][A-Z0-9_]*)\}?/g;
            
            let match;
            while ((match = envVarPattern.exec(scriptCommands)) !== null) {
                envVars.add(match[1]);
            }

            return Array.from(envVars);
        } catch (error) {
            return [];
        }
    }

    // Required environment variables for different contexts
    const requiredBuildEnvVars = [
        'NODE_ENV',
        'NEXT_PUBLIC_APP_URL',
        'NEXT_PUBLIC_WEBAPP_URL',
        'NEXT_PUBLIC_PROJECT'
    ];

    const requiredDatabaseEnvVars = [
        'DATABASE_URL',
        'NEXT_PRIVATE_DATABASE_URL',
        'POSTGRES_PRISMA_URL'
    ];

    const vercelSpecificEnvVars = [
        'VERCEL',
        'VERCEL_ENV',
        'VERCEL_URL',
        'VERCEL_BRANCH_URL',
        'VERCEL_REGION'
    ];

    it('should have all required environment variables declared in globalEnv', () => {
        fc.assert(
            fc.property(
                fc.constant('global-env-vars'),
                () => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const globalEnv = turboConfig.globalEnv || [];
                    
                    // Check that all required environment variables are in globalEnv
                    const allRequiredVars = [
                        ...requiredBuildEnvVars,
                        ...requiredDatabaseEnvVars,
                        'AWS_ACCESS_KEY_ID',
                        'AWS_SECRET_ACCESS_KEY',
                        'AWS_REGION',
                        'ENCRYPTION_KEY',
                        'JWT_SECRET',
                        'NEXTAUTH_SECRET'
                    ];

                    return allRequiredVars.every(envVar => globalEnv.includes(envVar));
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have proper environment variable scoping for build tasks', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('build', 'build:vercel'),
                (taskName) => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const tasks = turboConfig.tasks || {};
                    const task = tasks[taskName];
                    
                    if (!task) {
                        return true; // Task doesn't exist, skip
                    }

                    const taskEnv = task.env || [];
                    
                    // Build tasks should have essential environment variables
                    const essentialBuildVars = ['NODE_ENV'];
                    
                    if (taskName === 'build:vercel') {
                        // Vercel build should have public environment variables
                        const publicVars = [
                            'NEXT_PUBLIC_APP_URL',
                            'NEXT_PUBLIC_WEBAPP_URL',
                            'NEXT_PUBLIC_PROJECT'
                        ];
                        return essentialBuildVars.every(envVar => taskEnv.includes(envVar)) &&
                               publicVars.some(envVar => taskEnv.includes(envVar));
                    }

                    return essentialBuildVars.every(envVar => taskEnv.includes(envVar));
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have proper environment variable scoping for database tasks', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('@signtusk/prisma#build', '@signtusk/prisma#prebuild'),
                (taskName) => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const tasks = turboConfig.tasks || {};
                    const task = tasks[taskName];
                    
                    if (!task) {
                        return true; // Task doesn't exist, skip
                    }

                    const taskEnv = task.env || [];
                    
                    // Database tasks should have database environment variables
                    return requiredDatabaseEnvVars.every(envVar => taskEnv.includes(envVar));
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have Vercel-specific environment variables in passThroughEnv for build:vercel task', () => {
        fc.assert(
            fc.property(
                fc.constant('vercel-passthrough'),
                () => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const tasks = turboConfig.tasks || {};
                    const vercelBuildTask = tasks['build:vercel'];
                    
                    if (!vercelBuildTask) {
                        return true; // Task doesn't exist, skip
                    }

                    const passThroughEnv = vercelBuildTask.passThroughEnv || [];
                    
                    // Should have Vercel-specific environment variables
                    return vercelSpecificEnvVars.every(envVar => passThroughEnv.includes(envVar));
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have cache configuration enabled for build tasks', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('build', 'build:vercel', 'type-check'),
                (taskName) => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const tasks = turboConfig.tasks || {};
                    const task = tasks[taskName];
                    
                    if (!task) {
                        return true; // Task doesn't exist, skip
                    }

                    // Cache should be enabled (true) or not explicitly disabled
                    const cache = task.cache;
                    return cache !== false;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have proper global dependencies for environment files', () => {
        fc.assert(
            fc.property(
                fc.constant('global-dependencies'),
                () => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const globalDependencies = turboConfig.globalDependencies || [];
                    
                    // Should include environment files and Vercel configuration
                    const requiredDependencies = [
                        '**/.env.*local',
                        '.env',
                        'vercel.json'
                    ];

                    return requiredDependencies.every(dep => 
                        globalDependencies.some((globalDep: string) => 
                            globalDep.includes(dep) || dep.includes(globalDep)
                        )
                    );
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have consistent environment variable declarations across tasks', () => {
        fc.assert(
            fc.property(
                fc.array(fc.constantFrom('build', 'build:vercel', '@signtusk/prisma#build', '@signtusk/prisma#prebuild'), { minLength: 2, maxLength: 4 }),
                (taskNames) => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const tasks = turboConfig.tasks || {};
                    const globalEnv = turboConfig.globalEnv || [];
                    
                    return taskNames.every(taskName => {
                        const task = tasks[taskName];
                        if (!task) {
                            return true; // Task doesn't exist, skip
                        }

                        const taskEnv = task.env || [];
                        
                        // All task-specific environment variables should also be in globalEnv
                        return taskEnv.every((envVar: string) => globalEnv.includes(envVar));
                    });
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have proper outputs configuration for caching', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('build', 'build:vercel', '@signtusk/prisma#build'),
                (taskName) => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const tasks = turboConfig.tasks || {};
                    const task = tasks[taskName];
                    
                    if (!task) {
                        return true; // Task doesn't exist, skip
                    }

                    const outputs = task.outputs || [];
                    
                    // Should have outputs defined for proper caching
                    if (outputs.length === 0) {
                        return false;
                    }

                    // Build tasks should exclude cache directories
                    if (taskName.includes('build') && !taskName.includes('prisma')) {
                        return outputs.some((output: string) => output.includes('!') && output.includes('cache'));
                    }

                    // Prisma tasks should have generated outputs
                    if (taskName.includes('prisma')) {
                        return outputs.some((output: string) => output.includes('generated'));
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have proper inputs configuration for cache invalidation', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('build', 'build:vercel', 'type-check', '@signtusk/prisma#build'),
                (taskName) => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const tasks = turboConfig.tasks || {};
                    const task = tasks[taskName];
                    
                    if (!task) {
                        return true; // Task doesn't exist, skip
                    }

                    const inputs = task.inputs || [];
                    
                    // Should have inputs defined for proper cache invalidation
                    if (inputs.length === 0) {
                        return false;
                    }

                    // Should include package.json for dependency changes
                    return inputs.includes('package.json');
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should have remote cache configuration for Vercel optimization', () => {
        fc.assert(
            fc.property(
                fc.constant('remote-cache'),
                () => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const remoteCache = turboConfig.remoteCache;
                    
                    // Should have remote cache configuration
                    if (!remoteCache) {
                        return false;
                    }

                    // Should have signature enabled for security
                    return remoteCache.signature === true;
                }
            ),
            { numRuns: 100 }
        );
    });

    it('should not have conflicting environment variable declarations', () => {
        fc.assert(
            fc.property(
                fc.constant('no-conflicts'),
                () => {
                    const turboConfig = getTurboConfig();
                    if (!turboConfig) {
                        return false; // turbo.json should exist
                    }

                    const globalEnv = turboConfig.globalEnv || [];
                    const tasks = turboConfig.tasks || {};
                    
                    // Check for duplicate environment variables in globalEnv
                    const globalEnvSet = new Set(globalEnv);
                    if (globalEnvSet.size !== globalEnv.length) {
                        return false; // Duplicates found
                    }

                    // Check that task-specific env vars don't conflict with each other inappropriately
                    const buildTasks = ['build', 'build:vercel'];
                    const databaseTasks = ['@signtusk/prisma#build', '@signtusk/prisma#prebuild'];
                    
                    // Build tasks should have consistent public environment variables
                    const buildEnvVars = buildTasks.map(taskName => {
                        const task = tasks[taskName];
                        return task ? (task.env || []) : [];
                    }).filter(env => env.length > 0);

                    if (buildEnvVars.length > 1) {
                        const commonPublicVars = ['NODE_ENV', 'NEXT_PUBLIC_APP_URL'];
                        return buildEnvVars.every(envVars => 
                            commonPublicVars.every(commonVar => envVars.includes(commonVar))
                        );
                    }

                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });
});