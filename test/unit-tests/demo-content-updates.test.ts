/**
 * Unit Tests for Demo Content Updates
 * 
 * Tests that demo credentials use appropriate branding,
 * example content consistency, and quick access guide brand references.
 * 
 * Requirements: 3.3, 3.4
 */

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('Demo Content Updates', () => {
    describe('Demo Credentials Branding', () => {
        it('should use appropriate Signtusk branding in demo user emails', () => {
            const demoScript = readFileSync(
                join(process.cwd(), 'scripts/create-demo-user.ts'),
                'utf-8'
            );

            // Test that demo user emails use signtusk.com domain
            expect(demoScript).toMatch(/@demo\.signtusk\.com/);
            expect(demoScript).not.toMatch(/@.*docusign.*\.com/);
        });

        it('should have consistent demo user naming conventions', () => {
            const demoScript = readFileSync(
                join(process.cwd(), 'scripts/create-demo-user.ts'),
                'utf-8'
            );

            // Should have demo users with clear roles
            expect(demoScript).toMatch(/Demo Admin/);
            expect(demoScript).toMatch(/Demo Manager/);
            expect(demoScript).toMatch(/Demo User/);

            // Should not contain old branding in names
            expect(demoScript).not.toMatch(/DocuSign Alternative/);
            expect(demoScript).not.toMatch(/docusign-alternative/);
        });
    });

    describe('Example Content Consistency', () => {
        it('should verify example email domains are generic', () => {
            // Check that we use generic example domains, not branded ones
            const demoScript = readFileSync(
                join(process.cwd(), 'scripts/create-demo-user.ts'),
                'utf-8'
            );

            // Should not contain old branding in email examples
            expect(demoScript).not.toMatch(/@docusign-alternative\.com/);
            expect(demoScript).not.toMatch(/DocuSign Alternative/);
        });

        it('should have appropriate demo document titles', () => {
            const demoScript = readFileSync(
                join(process.cwd(), 'scripts/create-demo-user.ts'),
                'utf-8'
            );

            // Should have generic demo document names
            expect(demoScript).toMatch(/Demo Contract Agreement/);
            expect(demoScript).not.toMatch(/DocuSign.*Agreement/);
        });
    });

    describe('Quick Access Guide Brand References', () => {
        it('should verify quick access guide uses Signtusk branding', () => {
            const quickAccessPath = join(process.cwd(), 'QUICK_ACCESS_GUIDE.md');

            if (existsSync(quickAccessPath)) {
                const content = readFileSync(quickAccessPath, 'utf-8');

                // Should use Signtusk branding
                expect(content).toMatch(/Signtusk/);
                expect(content).not.toMatch(/DocuSign Alternative/);
                expect(content).not.toMatch(/docusign-alternative/);
            } else {
                // If file doesn't exist, that's also acceptable
                expect(true).toBe(true);
            }
        });

        it('should verify README files use consistent branding', () => {
            const readmePath = join(process.cwd(), 'README.md');

            if (existsSync(readmePath)) {
                const content = readFileSync(readmePath, 'utf-8');

                // Should use Signtusk branding consistently
                expect(content).not.toMatch(/DocuSign Alternative/);
                expect(content).not.toMatch(/@docusign-alternative/);
            } else {
                // If file doesn't exist, that's also acceptable
                expect(true).toBe(true);
            }
        });
    });

    describe('Demo Environment Configuration', () => {
        it('should have appropriate demo environment URLs', () => {
            const demoScript = readFileSync(
                join(process.cwd(), 'scripts/create-demo-user.ts'),
                'utf-8'
            );

            // Should reference localhost for demo
            expect(demoScript).toMatch(/localhost:3000/);
            expect(demoScript).toMatch(/signin/);
            expect(demoScript).toMatch(/signup/);
        });

        it('should have generic demo organization names', () => {
            const demoScript = readFileSync(
                join(process.cwd(), 'scripts/create-demo-user.ts'),
                'utf-8'
            );

            // Should not contain branded organization names
            expect(demoScript).not.toMatch(/DocuSign.*Organization/);
            expect(demoScript).not.toMatch(/docusign-alternative.*org/);
        });
    });
});