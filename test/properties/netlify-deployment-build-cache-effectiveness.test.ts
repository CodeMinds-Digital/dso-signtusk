/**
 * Netlify Deployment Build Cache Effectiveness Property-Based Tests
 * 
 * **Feature: netlify-deployment, Property 9: Build Cache Effectiveness**
 * **Validates: Requirements 5.2**
 * 
 * Tests that for any subsequent build with unchanged dependencies, cached node_modules 
 * should be used to reduce build time.
 */

import fc from 'fast-check';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Import cache management utilities
const { CacheInvalidationManager } = require('../../scripts/cache-invalidation.js');
const { NetlifyCacheManager } = require('../../scripts/netlify-cache-config.js');

// Helper function to get workspace root
function getWorkspaceRoot(): string {
    return resolve(__dirname, '../..');
}

// Helper function to create temporary test files
function createTempFile(filePath: string, content: string): void {
    const fullPath = join(getWorkspaceRoot(), filePath);
    const dir = fullPath.substring(0, fullPath.lastIndexOf('/'));
    
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(fullPath, content);
}

// Helper function to remove temporary test files
function removeTempFile(filePath: string): void {
    const fullPath = join(getWorkspaceRoot(), filePath);
    if (existsSync(fullPath)) {
        rmSync(fullPath, { force: true });
    }
}

// Helper function to simulate file changes
function simulateFileChange(filePath: string, changeType: 'dependency' | 'source' | 'config'): void {
    const workspaceRoot = getWorkspaceRoot();
    const fullPath = join(workspaceRoot, filePath);
    
    if (!existsSync(fullPath)) {
        return;
    }
    
    let content = readFileSync(fullPath, 'utf8');
    
    switch (changeType) {
        case 'dependency':
            // Simulate dependency change by modifying package.json
            if (filePath.includes('package.json')) {
                const packageJson = JSON.parse(content);
                packageJson.version = `${packageJson.version || '1.0.0'}-test-${Date.now()}`;
                content = JSON.stringify(packageJson, null, 2);
            }
            break;
        case 'source':
            // Simulate source change by adding a comment
            content += `\n// Test change ${Date.now()}`;
            break;
        case 'config':
            // Simulate config change by adding a comment
            content += `\n# Test config change ${Date.now()}`;
            break;
    }
    
    writeFileSync(fullPath, content);
}

// Helper function to restore file from backup
function restoreFile(filePath: string, backupContent: string): void {
    const fullPath = join(getWorkspaceRoot(), filePath);
    writeFileSync(fullPath, backupContent);
}

// Helper function to get file backup
function getFileBackup(filePath: string): string | null {
    const fullPath = join(getWorkspaceRoot(), filePath);
    if (!existsSync(fullPath)) {
        return null;
    }
    return readFileSync(fullPath, 'utf8');
}

// Test applications
const testApplications = ['web', 'remix', 'docs'];

// Cache types to test
const cacheTypes = ['node_modules', 'build', 'turbo'];

describe('Netlify Deployment Build Cache Effectiveness', () => {
    let cacheManager: any;
    let invalidationManager: any;
    let fileBackups: Map<string, string>;

    beforeEach(() => {
        cacheManager = new NetlifyCacheManager();
        invalidationManager = new CacheInvalidationManager();
        fileBackups = new Map();
    });

    afterEach(() => {
        // Restore any modified files
        for (const [filePath, content] of fileBackups) {
            restoreFile(filePath, content);
        }
        fileBackups.clear();
    });

    /**
     * Property 9: Build Cache Effectiveness
     * For any subsequent build with unchanged dependencies, cached node_modules 
     * should be used to reduce build time
     */
    describe('Property 9: Build Cache Effectiveness', () => {
        it('should not invalidate cache when no files change', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                fc.constantFrom(...cacheTypes),
                (appName, cacheType) => {
                    // Get initial cache status
                    const initialStatus = invalidationManager.shouldInvalidateCache(appName, cacheType);
                    
                    // Check cache status again without any changes
                    const secondStatus = invalidationManager.shouldInvalidateCache(appName, cacheType);
                    
                    // Cache should not be invalidated on second check if no files changed
                    expect(secondStatus).toBe(false);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should invalidate node_modules cache when dependencies change', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                (appName) => {
                    const packageJsonPath = `apps/${appName}/package.json`;
                    const workspaceRoot = getWorkspaceRoot();
                    const fullPath = join(workspaceRoot, packageJsonPath);
                    
                    if (!existsSync(fullPath)) {
                        console.log(`Package.json not found for ${appName}, skipping`);
                        return true;
                    }
                    
                    // Backup original file
                    const originalContent = getFileBackup(packageJsonPath);
                    if (originalContent) {
                        fileBackups.set(packageJsonPath, originalContent);
                    }
                    
                    // Get initial cache status
                    const initialStatus = invalidationManager.shouldInvalidateCache(appName, 'node_modules');
                    
                    // Simulate dependency change
                    simulateFileChange(packageJsonPath, 'dependency');
                    
                    // Check cache status after change
                    const afterChangeStatus = invalidationManager.shouldInvalidateCache(appName, 'node_modules');
                    
                    // Cache should be invalidated after dependency change
                    expect(afterChangeStatus).toBe(true);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should invalidate build cache when source code changes', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                fc.constantFrom('src/test-file.ts', 'app/test-file.tsx'),
                (appName, testFile) => {
                    const sourceFilePath = `apps/${appName}/${testFile}`;
                    
                    // Create temporary test file
                    createTempFile(sourceFilePath, '// Test file for cache invalidation');
                    
                    try {
                        // Get initial cache status
                        const initialStatus = invalidationManager.shouldInvalidateCache(appName, 'build');
                        
                        // Simulate source code change
                        simulateFileChange(sourceFilePath, 'source');
                        
                        // Check cache status after change
                        const afterChangeStatus = invalidationManager.shouldInvalidateCache(appName, 'build');
                        
                        // Cache should be invalidated after source change
                        expect(afterChangeStatus).toBe(true);
                        
                        return true;
                    } finally {
                        // Clean up temporary file
                        removeTempFile(sourceFilePath);
                    }
                }
            ), { numRuns: 3 });
        });

        it('should invalidate turbo cache when configuration changes', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                (appName) => {
                    const turboConfigPath = 'turbo.json';
                    const workspaceRoot = getWorkspaceRoot();
                    const fullPath = join(workspaceRoot, turboConfigPath);
                    
                    if (!existsSync(fullPath)) {
                        console.log('turbo.json not found, skipping');
                        return true;
                    }
                    
                    // Backup original file
                    const originalContent = getFileBackup(turboConfigPath);
                    if (originalContent) {
                        fileBackups.set(turboConfigPath, originalContent);
                    }
                    
                    // Get initial cache status
                    const initialStatus = invalidationManager.shouldInvalidateCache(appName, 'turbo');
                    
                    // Simulate configuration change
                    simulateFileChange(turboConfigPath, 'config');
                    
                    // Check cache status after change
                    const afterChangeStatus = invalidationManager.shouldInvalidateCache(appName, 'turbo');
                    
                    // Cache should be invalidated after config change
                    expect(afterChangeStatus).toBe(true);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should have consistent cache keys across multiple checks with same files', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                fc.constantFrom(...cacheTypes),
                (appName, cacheType) => {
                    // Generate cache key multiple times
                    const rules = invalidationManager.getInvalidationRules(appName, cacheType);
                    const key1 = invalidationManager.generateCacheKey(rules.files);
                    const key2 = invalidationManager.generateCacheKey(rules.files);
                    const key3 = invalidationManager.generateCacheKey(rules.files);
                    
                    // All keys should be identical for same files
                    expect(key1).toBe(key2);
                    expect(key2).toBe(key3);
                    
                    // Keys should be non-empty strings
                    expect(key1).toBeTruthy();
                    expect(typeof key1).toBe('string');
                    expect(key1.length).toBeGreaterThan(0);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should have different cache keys for different file sets', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                (appName) => {
                    // Get cache keys for different cache types
                    const nodeModulesRules = invalidationManager.getInvalidationRules(appName, 'node_modules');
                    const buildRules = invalidationManager.getInvalidationRules(appName, 'build');
                    const turboRules = invalidationManager.getInvalidationRules(appName, 'turbo');
                    
                    const nodeModulesKey = invalidationManager.generateCacheKey(nodeModulesRules.files);
                    const buildKey = invalidationManager.generateCacheKey(buildRules.files);
                    const turboKey = invalidationManager.generateCacheKey(turboRules.files);
                    
                    // Different cache types should have different keys (unless they happen to have identical file sets)
                    // We'll check that at least some are different
                    const keys = [nodeModulesKey, buildKey, turboKey];
                    const uniqueKeys = new Set(keys);
                    
                    // Should have at least 2 different keys (build and turbo typically include more files)
                    expect(uniqueKeys.size).toBeGreaterThanOrEqual(2);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should properly handle missing files in cache key generation', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 10 }),
                (appName, randomFiles) => {
                    // Create list of files that likely don't exist
                    const nonExistentFiles = randomFiles.map(f => `non-existent/${f}.txt`);
                    
                    // Should not throw error when generating cache key for non-existent files
                    expect(() => {
                        const key = invalidationManager.generateCacheKey(nonExistentFiles);
                        expect(typeof key).toBe('string');
                    }).not.toThrow();
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should have cache configuration in Netlify TOML files', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                (appName) => {
                    const netlifyConfigPath = `apps/${appName}/netlify.toml`;
                    const workspaceRoot = getWorkspaceRoot();
                    const fullPath = join(workspaceRoot, netlifyConfigPath);
                    
                    if (!existsSync(fullPath)) {
                        console.log(`Netlify config not found for ${appName}, skipping`);
                        return true;
                    }
                    
                    const tomlContent = readFileSync(fullPath, 'utf8');
                    
                    // Should have cache-related configuration
                    const hasCacheConfig = tomlContent.includes('[build.cache]') || 
                                         tomlContent.includes('TURBO_CACHE_DIR') ||
                                         tomlContent.includes('NPM_CONFIG_CACHE');
                    
                    expect(hasCacheConfig).toBe(true);
                    
                    // Should have optimized build command or reference to build script
                    const hasOptimizedBuild = tomlContent.includes('netlify-build.js') ||
                                            tomlContent.includes('TURBO_TELEMETRY_DISABLED') ||
                                            tomlContent.includes('NODE_OPTIONS');
                    
                    expect(hasOptimizedBuild).toBe(true);
                    
                    return true;
                }
            ), { numRuns: 3 });
        });

        it('should maintain cache effectiveness across different environments', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                fc.constantFrom(['production', 'deploy-preview', 'branch-deploy']),
                (appName, environment) => {
                    // Simulate different environment contexts
                    const originalEnv = process.env.NODE_ENV;
                    const originalContext = process.env.CONTEXT;
                    
                    try {
                        process.env.NODE_ENV = environment === 'production' ? 'production' : 'development';
                        process.env.CONTEXT = environment;
                        
                        // Cache invalidation logic should work consistently across environments
                        const cacheStatus = invalidationManager.checkAllCaches(appName);
                        
                        // Should have results for all cache types
                        expect(cacheStatus).toHaveProperty('node_modules');
                        expect(cacheStatus).toHaveProperty('build');
                        expect(cacheStatus).toHaveProperty('turbo');
                        
                        // Each cache type should have proper structure
                        Object.values(cacheStatus).forEach((status: any) => {
                            expect(status).toHaveProperty('shouldInvalidate');
                            expect(status).toHaveProperty('reason');
                            expect(status).toHaveProperty('files');
                            expect(typeof status.shouldInvalidate).toBe('boolean');
                            expect(typeof status.reason).toBe('string');
                            expect(typeof status.files).toBe('number');
                        });
                        
                        return true;
                    } finally {
                        // Restore environment
                        if (originalEnv) {
                            process.env.NODE_ENV = originalEnv;
                        } else {
                            delete process.env.NODE_ENV;
                        }
                        
                        if (originalContext) {
                            process.env.CONTEXT = originalContext;
                        } else {
                            delete process.env.CONTEXT;
                        }
                    }
                }
            ), { numRuns: 3 });
        });

        it('should generate reasonable file counts for cache invalidation rules', () => {
            fc.assert(fc.property(
                fc.constantFrom(...testApplications),
                fc.constantFrom(...cacheTypes),
                (appName, cacheType) => {
                    const rules = invalidationManager.getInvalidationRules(appName, cacheType);
                    
                    // Should have some files to check
                    expect(rules.files.length).toBeGreaterThan(0);
                    
                    // Should have reasonable upper bound (limited by our optimization)
                    expect(rules.files.length).toBeLessThan(200);
                    
                    // Should have a reason for invalidation
                    expect(rules.reason).toBeTruthy();
                    expect(typeof rules.reason).toBe('string');
                    
                    // Different cache types should have different file counts
                    if (cacheType === 'node_modules') {
                        // Dependencies should have fewer files to check
                        expect(rules.files.length).toBeLessThan(50);
                    }
                    
                    return true;
                }
            ), { numRuns: 3 });
        });
    });
});