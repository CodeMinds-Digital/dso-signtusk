/**
 * Unit Tests for License Text Updates
 * 
 * Tests that license text is correctly updated from old branding 
 * to "Signtusk Platform" and verifies package descriptions use new branding.
 * 
 * Requirements: 1.3
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

describe('License Text Updates', () => {
    describe('Package.json License Updates', () => {
        it('should update all package.json files to use Signtusk Platform in license field', async () => {
            const packageJsonFiles = await glob('**/package.json', {
                cwd: process.cwd(),
                ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
            });

            const failedFiles: string[] = [];

            for (const file of packageJsonFiles) {
                const content = fs.readFileSync(file, 'utf-8');
                try {
                    const packageData = JSON.parse(content);

                    if (packageData.license && typeof packageData.license === 'string') {
                        // Check if license contains old branding
                        if (packageData.license.includes('DocuSign Alternative Platform')) {
                            failedFiles.push(`${file}: Still contains "DocuSign Alternative Platform" in license`);
                        }

                        // If it's a private license, it should reference Signtusk Platform
                        if (packageData.license.includes('Private - Part of') &&
                            !packageData.license.includes('Signtusk Platform')) {
                            failedFiles.push(`${file}: Private license should reference "Signtusk Platform"`);
                        }
                    }
                } catch (error) {
                    // Skip invalid JSON files
                    continue;
                }
            }

            if (failedFiles.length > 0) {
                throw new Error(`License text not properly updated in:\n${failedFiles.join('\n')}`);
            }
        });

        it('should verify package descriptions use Signtusk branding', async () => {
            const packageJsonFiles = await glob('**/package.json', {
                cwd: process.cwd(),
                ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
            });

            const failedFiles: string[] = [];

            for (const file of packageJsonFiles) {
                const content = fs.readFileSync(file, 'utf-8');
                try {
                    const packageData = JSON.parse(content);

                    if (packageData.description && typeof packageData.description === 'string') {
                        // Check if description contains old branding
                        if (packageData.description.includes('DocuSign Alternative')) {
                            failedFiles.push(`${file}: Description still contains "DocuSign Alternative"`);
                        }
                    }
                } catch (error) {
                    // Skip invalid JSON files
                    continue;
                }
            }

            if (failedFiles.length > 0) {
                throw new Error(`Package descriptions not properly updated in:\n${failedFiles.join('\n')}`);
            }
        });
    });

    describe('README File Brand Consistency', () => {
        it('should verify README files use Signtusk branding consistently', async () => {
            const readmeFiles = await glob('**/README.md', {
                cwd: process.cwd(),
                ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
            });

            const failedFiles: string[] = [];

            for (const file of readmeFiles) {
                const content = fs.readFileSync(file, 'utf-8');

                // Check for old branding patterns
                const oldBrandingPatterns = [
                    /DocuSign Alternative platform/gi,
                    /DocuSign Alternative project/gi,
                    /@docusign-alternative\//g,
                    /Part of the DocuSign Alternative/gi,
                    /Private - Part of DocuSign Alternative Platform/gi
                ];

                const foundIssues: string[] = [];

                oldBrandingPatterns.forEach((pattern, index) => {
                    const matches = content.match(pattern);
                    if (matches) {
                        foundIssues.push(`Pattern ${index + 1}: ${matches.join(', ')}`);
                    }
                });

                if (foundIssues.length > 0) {
                    failedFiles.push(`${file}:\n  ${foundIssues.join('\n  ')}`);
                }
            }

            if (failedFiles.length > 0) {
                throw new Error(`README files contain old branding:\n${failedFiles.join('\n\n')}`);
            }
        });

        it('should verify README files contain appropriate Signtusk references', async () => {
            const readmeFiles = await glob('packages/**/README.md', {
                cwd: process.cwd(),
                ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
            });

            const failedFiles: string[] = [];

            for (const file of readmeFiles) {
                const content = fs.readFileSync(file, 'utf-8');

                // Skip if this is not a package README that should have branding
                if (!content.includes('@signtusk/') && !content.includes('Signtusk')) {
                    continue;
                }

                // If it mentions @signtusk scope, it should consistently use Signtusk branding
                if (content.includes('@signtusk/')) {
                    if (!content.includes('Signtusk') && !content.includes('signtusk')) {
                        failedFiles.push(`${file}: Uses @signtusk scope but missing Signtusk branding in text`);
                    }
                }
            }

            if (failedFiles.length > 0) {
                throw new Error(`README files missing proper Signtusk branding:\n${failedFiles.join('\n')}`);
            }
        });
    });

    describe('License File Content Validation', () => {
        it('should verify LICENSE files use appropriate branding', async () => {
            const licenseFiles = await glob('**/LICENSE*', {
                cwd: process.cwd(),
                ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/test/**']
            });

            const failedFiles: string[] = [];

            for (const file of licenseFiles) {
                // Skip binary files
                if (file.endsWith('.exe') || file.endsWith('.bin')) {
                    continue;
                }

                try {
                    const content = fs.readFileSync(file, 'utf-8');

                    // Check for old branding in license content
                    if (content.includes('DocuSign Alternative Platform')) {
                        failedFiles.push(`${file}: Contains "DocuSign Alternative Platform"`);
                    }
                } catch (error) {
                    // Skip files that can't be read as text
                    continue;
                }
            }

            if (failedFiles.length > 0) {
                throw new Error(`License files contain old branding:\n${failedFiles.join('\n')}`);
            }
        });
    });

    describe('Composer.json PHP Package Updates', () => {
        it('should verify PHP composer.json files use Signtusk branding', async () => {
            const composerFiles = await glob('**/composer.json', {
                cwd: process.cwd(),
                ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**']
            });

            const failedFiles: string[] = [];

            for (const file of composerFiles) {
                const content = fs.readFileSync(file, 'utf-8');
                try {
                    const composerData = JSON.parse(content);

                    if (composerData.description && typeof composerData.description === 'string') {
                        if (composerData.description.includes('DocuSign Alternative')) {
                            failedFiles.push(`${file}: Description contains "DocuSign Alternative"`);
                        }
                    }

                    if (composerData.name && typeof composerData.name === 'string') {
                        if (composerData.name.includes('docusign-alternative')) {
                            failedFiles.push(`${file}: Package name still uses "docusign-alternative"`);
                        }
                    }
                } catch (error) {
                    // Skip invalid JSON files
                    continue;
                }
            }

            if (failedFiles.length > 0) {
                throw new Error(`Composer.json files not properly updated:\n${failedFiles.join('\n')}`);
            }
        });
    });
});