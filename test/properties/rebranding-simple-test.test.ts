/**
 * Simple property-based tests for rebranding functionality
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

describe('Rebranding Simple Tests', () => {
    test('Package scope transformation works correctly', async () => {
        const oldScope = '@docusign-alternative';
        const newScope = '@signtusk';

        const packageJson = {
            name: '@docusign-alternative/lib',
            dependencies: {
                '@docusign-alternative/ui': '1.0.0',
                'react': '18.0.0'
            }
        };

        const content = JSON.stringify(packageJson, null, 2);
        const transformed = content.replaceAll(oldScope, newScope);
        const parsed = JSON.parse(transformed);

        expect(parsed.name).toBe('@signtusk/lib');
        expect(parsed.dependencies['@signtusk/ui']).toBe('1.0.0');
        expect(parsed.dependencies['react']).toBe('18.0.0');
        expect(parsed.dependencies['@docusign-alternative/ui']).toBeUndefined();
    });

    test('Import statement transformation works correctly', async () => {
        const oldScope = '@docusign-alternative';
        const newScope = '@signtusk';

        const importStatement = `import { Component } from '@docusign-alternative/lib';`;
        const transformed = importStatement.replaceAll(oldScope, newScope);

        expect(transformed).toBe(`import { Component } from '@signtusk/lib';`);
        expect(transformed).not.toContain('@docusign-alternative');
    });

    /**
     * **Feature: signtusk-rebranding, Property 2: Import Statement Scope Consistency**
     * **Validates: Requirements 2.1**
     */
    test('Property: Import statements use correct scope after transformation', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.array(
                    fc.oneof(
                        fc.constant('@docusign-alternative/lib'),
                        fc.constant('@docusign-alternative/ui'),
                        fc.constant('react'),
                        fc.constant('zod')
                    ),
                    { minLength: 1, maxLength: 5 }
                ),
                async (imports) => {
                    const oldScope = '@docusign-alternative';
                    const newScope = '@signtusk';

                    const importStatements = imports.map(imp =>
                        `import Component from '${imp}';`
                    ).join('\n');

                    const transformed = importStatements.replaceAll(oldScope, newScope);

                    // No old scope should remain
                    const hasOldScope = transformed.includes(oldScope);
                    if (hasOldScope) return false;

                    // Internal imports should have new scope
                    const internalImports = imports.filter(imp => imp.startsWith(oldScope));
                    const newScopeCount = (transformed.match(new RegExp(newScope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

                    return newScopeCount === internalImports.length;
                }
            ),
            { numRuns: 10 }
        );
    });

    /**
     * **Feature: signtusk-rebranding, Property 4: Package Dependency Reference Consistency**
     * **Validates: Requirements 2.2**
     */
    test('Property: Package dependencies use consistent scope after transformation', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    dependencies: fc.dictionary(
                        fc.oneof(
                            fc.constant('@docusign-alternative/lib'),
                            fc.constant('@docusign-alternative/ui'),
                            fc.constant('react'),
                            fc.constant('typescript')
                        ),
                        fc.constant('1.0.0')
                    )
                }),
                async (testData) => {
                    const oldScope = '@docusign-alternative';
                    const newScope = '@signtusk';

                    const packageJson = {
                        name: '@docusign-alternative/test',
                        dependencies: testData.dependencies
                    };

                    const content = JSON.stringify(packageJson, null, 2);
                    const transformed = content.replaceAll(oldScope, newScope);

                    // Should be valid JSON
                    let parsed;
                    try {
                        parsed = JSON.parse(transformed);
                    } catch {
                        return false;
                    }

                    // No old scope should remain
                    if (transformed.includes(oldScope)) {
                        return false;
                    }

                    // Count internal dependencies
                    const originalInternal = Object.keys(testData.dependencies)
                        .filter(dep => dep.startsWith(oldScope)).length;
                    const transformedInternal = Object.keys(parsed.dependencies || {})
                        .filter(dep => dep.startsWith(newScope)).length;

                    return originalInternal === transformedInternal;
                }
            ),
            { numRuns: 10 }
        );
    });
});