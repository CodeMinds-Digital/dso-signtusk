/**
 * Next.js Dual App Builds Integration Tests
 * 
 * **Feature: nextjs-html-component-conflict-fix**
 * **Validates: Requirements 5.1, 5.4**
 * 
 * Tests that both web and docs Next.js applications build successfully without Html component conflicts.
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { describe, expect, it } from 'vitest';

// Helper function to run build command and capture result
function runBuildCommand(appPath: string): { success: boolean; output: string; exitCode: number } {
    try {
        const output = execSync('NODE_ENV=production npm run build', {
            cwd: appPath,
            encoding: 'utf-8',
            timeout: 120000, // 2 minute timeout
        });
        return { success: true, output, exitCode: 0 };
    } catch (error: any) {
        return {
            success: error.status === 0,
            output: error.stdout + error.stderr,
            exitCode: error.status || 1
        };
    }
}

// Helper function to check if build artifacts exist
function checkBuildArtifacts(appPath: string): { hasArtifacts: boolean; missingFiles: string[] } {
    const expectedFiles = [
        '.next/BUILD_ID',
        '.next/build-manifest.json',
        '.next/export'
    ];

    const missingFiles: string[] = [];
    
    for (const file of expectedFiles) {
        if (!existsSync(join(appPath, file))) {
            missingFiles.push(file);
        }
    }

    return {
        hasArtifacts: missingFiles.length === 0,
        missingFiles
    };
}

describe('Next.js Dual App Builds Integration', () => {
    const webAppPath = resolve(__dirname, '../../apps/web');
    const docsAppPath = resolve(__dirname, '../../apps/docs');

    /**
     * Integration Test: Web App Build Success
     * Validates: Requirements 5.1, 5.4
     */
    it('should build web app successfully without Html component conflicts', () => {
        // Skip if web app doesn't exist
        if (!existsSync(webAppPath)) {
            expect(true).toBe(true);
            return;
        }

        const buildResult = runBuildCommand(webAppPath);
        
        // Build should complete successfully
        expect(buildResult.success).toBe(true);
        expect(buildResult.exitCode).toBe(0);
        
        // Should not contain Html component conflict errors
        expect(buildResult.output).not.toMatch(/Html should not be imported outside of pages\/_document/);
        expect(buildResult.output).not.toMatch(/Error.*Html.*conflict/i);
        
        // Should generate build artifacts
        const artifacts = checkBuildArtifacts(webAppPath);
        expect(artifacts.hasArtifacts).toBe(true);
        
        if (!artifacts.hasArtifacts) {
            console.log('Missing build artifacts:', artifacts.missingFiles);
        }
    }, 150000); // 2.5 minute timeout

    /**
     * Integration Test: Docs App Build Success
     * Validates: Requirements 5.1, 5.4
     */
    it('should build docs app successfully without Html component conflicts', () => {
        // Skip if docs app doesn't exist
        if (!existsSync(docsAppPath)) {
            expect(true).toBe(true);
            return;
        }

        const buildResult = runBuildCommand(docsAppPath);
        
        // Build should complete successfully
        expect(buildResult.success).toBe(true);
        expect(buildResult.exitCode).toBe(0);
        
        // Should not contain Html component conflict errors
        expect(buildResult.output).not.toMatch(/Html should not be imported outside of pages\/_document/);
        expect(buildResult.output).not.toMatch(/Error.*Html.*conflict/i);
        
        // Should generate build artifacts
        const artifacts = checkBuildArtifacts(docsAppPath);
        expect(artifacts.hasArtifacts).toBe(true);
        
        if (!artifacts.hasArtifacts) {
            console.log('Missing build artifacts:', artifacts.missingFiles);
        }
    }, 150000); // 2.5 minute timeout

    /**
     * Integration Test: Both Apps Build Successfully
     * Validates: Requirements 5.1, 5.4
     */
    it('should build both apps successfully in sequence', () => {
        const apps = [
            { name: 'web', path: webAppPath },
            { name: 'docs', path: docsAppPath }
        ].filter(app => existsSync(app.path));

        // Skip if no apps found
        if (apps.length === 0) {
            expect(true).toBe(true);
            return;
        }

        const results: Array<{ name: string; success: boolean; exitCode: number }> = [];

        for (const app of apps) {
            const buildResult = runBuildCommand(app.path);
            results.push({
                name: app.name,
                success: buildResult.success,
                exitCode: buildResult.exitCode
            });

            // Each app should build successfully
            expect(buildResult.success).toBe(true);
            expect(buildResult.exitCode).toBe(0);
        }

        // All apps should have built successfully
        const allSuccessful = results.every(result => result.success && result.exitCode === 0);
        expect(allSuccessful).toBe(true);

        console.log('Build results:', results);
    }, 300000); // 5 minute timeout for both apps
});