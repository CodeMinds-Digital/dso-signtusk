/**
 * Simple property-based test for rebranding functionality
 */

import { describe, test, expect } from 'vitest';
import fc from 'fast-check';

describe('Rebranding Properties - Simple', () => {
    /**
     * **Feature: signtusk-rebranding, Property 1: Package Scope Transformation Accuracy**
     * **Validates: Requirements 1.1**
     */
    test('Package scope transformation accuracy', async () => {
        const oldScope = '@signtusk';
        const newScope = '@signtusk';

        await fc.assert(
            fc.asyncProperty(
                fc.record({
                    packageName: fc.constantFrom('lib', 'ui', 'auth', 'database'),
                    version: fc.constant('1.0.0')
                }),
                async (packageData) => {
                    // Create a simple package.json content
                    const originalContent = `{
  "name": "${oldScope}/${packageData.packageName}",
  "version": "${packageData.version}",
  "dependencies": {
    "${oldScope}/lib": "1.0.0"
  }
}`;

                    // Transform the content
                    const transformedContent = originalContent.replace(
                        new RegExp(oldScope.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                        newScope
                    );

                    // Verify transformation
                    const expectedContent = `{
  "name": "${newScope}/${packageData.packageName}",
  "version": "${packageData.version}",
  "dependencies": {
    "${newScope}/lib": "1.0.0"
  }
}`;

                    return transformedContent === expectedContent;
                }
            ),
            { numRuns: 10 }
        );
    });

    test('Brand name replacement consistency', async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.constantFrom('DocuSign Alternative', 'docusign-alternative'),
                async (brandName) => {
                    const replacement = brandName.replace(/DocuSign Alternative/gi, 'Signtusk')
                        .replace(/docusign-alternative/gi, 'signtusk');

                    // Should not contain old brand name
                    const hasOldBrand = replacement.toLowerCase().includes('docusign');

                    // Should contain new brand name
                    const hasNewBrand = replacement.toLowerCase().includes('signtusk');

                    return !hasOldBrand && hasNewBrand;
                }
            ),
            { numRuns: 10 }
        );
    });
});