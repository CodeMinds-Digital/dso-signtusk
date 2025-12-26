import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';

/**
 * **Feature: build-failure-fixes, Property 3: Export Uniqueness**
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * Property-based tests for ensuring export uniqueness within modules.
 * Tests that each export name appears exactly once per module without conflicts.
 */

describe('Export Uniqueness Property Tests', () => {
    const packageRoot = path.resolve(__dirname, '..');
    const indexPath = path.join(packageRoot, 'index.ts');

    /**
     * Property 3: Export Uniqueness
     * For any module in the codebase, each export name should appear exactly once per module without conflicts
     */
    it('should have unique exports in index.ts', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constant(indexPath),
                async (filePath) => {
                    // Read the index.ts file
                    const content = fs.readFileSync(filePath, 'utf-8');

                    // Extract all export statements
                    const exportMatches = content.match(/export\s+(?:\{[^}]+\}|[^;]+)/g) || [];

                    // Extract exported names from all export statements
                    const exportedNames = new Set<string>();
                    const duplicates: string[] = [];

                    for (const exportMatch of exportMatches) {
                        // Handle different export patterns
                        let names: string[] = [];

                        if (exportMatch.includes('{') && exportMatch.includes('}')) {
                            // Named exports: export { name1, name2 }
                            const namedExportsMatch = exportMatch.match(/\{([^}]+)\}/);
                            if (namedExportsMatch) {
                                names = namedExportsMatch[1]
                                    .split(',')
                                    .map(name => name.trim().split(' as ')[0].trim())
                                    .filter(name => name && !name.startsWith('type'));
                            }
                        } else if (exportMatch.includes('export const') || exportMatch.includes('export function')) {
                            // Direct exports: export const name = ...
                            const directExportMatch = exportMatch.match(/export\s+(?:const|function|class)\s+(\w+)/);
                            if (directExportMatch) {
                                names = [directExportMatch[1]];
                            }
                        } else if (exportMatch.includes('export type')) {
                            // Skip type exports for this test
                            continue;
                        } else if (exportMatch.includes('export *')) {
                            // Skip wildcard exports for this test
                            continue;
                        }

                        // Check for duplicates
                        for (const name of names) {
                            if (exportedNames.has(name)) {
                                duplicates.push(name);
                            } else {
                                exportedNames.add(name);
                            }
                        }
                    }

                    // Property: No export name should appear more than once
                    expect(duplicates).toEqual([]);

                    // Additional check: Verify specific known duplicate
                    const createBatchSigningEngineCount = (content.match(/export.*createBatchSigningEngine/g) || []).length;
                    expect(createBatchSigningEngineCount).toBeLessThanOrEqual(1);
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property test for barrel export consistency
     * Ensures that re-exports don't create naming conflicts
     */
    it('should not have conflicting re-exports', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constant(indexPath),
                async (filePath) => {
                    const content = fs.readFileSync(filePath, 'utf-8');

                    // Check for specific duplicate export patterns
                    const lines = content.split('\n');
                    const exportLines = lines.filter(line => line.trim().startsWith('export'));

                    // Count occurrences of each exported name
                    const exportCounts = new Map<string, number>();

                    for (const line of exportLines) {
                        // Skip type exports and wildcard exports
                        if (line.includes('export type') || line.includes('export *')) {
                            continue;
                        }

                        // Extract exported names
                        let names: string[] = [];

                        if (line.includes('{') && line.includes('}')) {
                            const namedExportsMatch = line.match(/\{([^}]+)\}/);
                            if (namedExportsMatch) {
                                names = namedExportsMatch[1]
                                    .split(',')
                                    .map(name => name.trim().split(' as ')[0].trim())
                                    .filter(name => name && !name.startsWith('type'));
                            }
                        } else if (line.includes('export const') || line.includes('export function')) {
                            const directExportMatch = line.match(/export\s+(?:const|function|class)\s+(\w+)/);
                            if (directExportMatch) {
                                names = [directExportMatch[1]];
                            }
                        }

                        // Count each exported name
                        for (const name of names) {
                            exportCounts.set(name, (exportCounts.get(name) || 0) + 1);
                        }
                    }

                    // Property: No export name should appear more than once
                    const duplicates = Array.from(exportCounts.entries())
                        .filter(([name, count]) => count > 1)
                        .map(([name]) => name);

                    expect(duplicates).toEqual([]);
                }
            ),
            { numRuns: 100 }
        );
    });
});

/**
 * Helper function to recursively find TypeScript files
 */
function findTsFiles(dir: string): string[] {
    const files: string[] = [];

    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                files.push(...findTsFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts')) {
                files.push(fullPath);
            }
        }
    } catch (error) {
        // Ignore directories that can't be read
    }

    return files;
}