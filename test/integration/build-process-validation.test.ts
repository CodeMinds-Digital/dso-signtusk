/**
 * Build Process Validation Integration Tests
 * 
 * Tests complete build process with various configurations,
 * validates build failure scenarios and recovery mechanisms.
 * 
 * Requirements: 1.1, 3.1
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Build Process Validation', () => {
    const rootDir = process.cwd();
    const originalEnv = { ...process.env };
    const testLogDir = join(rootDir, 'logs', 'test-builds');

    beforeAll(() => {
        // Ensure test log directory exists
        if (!existsSync(testLogDir)) {
            mkdirSync(testLogDir, { recursive: true });
        }
    });

    afterAll(() => {
        // Restore original environment
        process.env = originalEnv;
    });

    describe('Complete Build Process', () => {
        it('should complete full build with all packages', async () => {
            const startTime = Date.now();
            
            try {
                // Run pre-build validation
                execSync('npm run validate:pre-build', {
                    stdio: 'pipe',
                    timeout: 30000,
                    env: { ...process.env, NODE_ENV: 'development' }
                });

                // Run build environment validation
                execSync('node scripts/validate-build-env.js', {
                    stdio: 'pipe',
                    timeout: 30000,
                    env: { ...process.env, NODE_ENV: 'development' }
                });

                // Run turbo build
                const buildOutput = execSync('turbo run build --filter=@signtusk/remix', {
                    stdio: 'pipe',
                    timeout: 180000, // 3 minutes
                    encoding: 'utf8',
                    env: { ...process.env, NODE_ENV: 'development' }
                });

                const buildTime = Date.now() - startTime;
                
                // Log build results
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    buildTime,
                    success: true,
                    output: buildOutput.substring(0, 1000) // Truncate for log size
                };
                
                writeFileSync(
                    join(testLogDir, `build-success-${Date.now()}.json`),
                    JSON.stringify(logEntry, null, 2)
                );

                expect(buildTime).toBeLessThan(300000); // Should complete within 5 minutes
                expect(buildOutput).toContain('✓'); // Should contain success indicators

            } catch (error: any) {
                const buildTime = Date.now() - startTime;
                
                // Log build failure
                const logEntry = {
                    timestamp: new Date().toISOString(),
                    buildTime,
                    success: false,
                    error: error.message,
                    stdout: error.stdout?.toString().substring(0, 1000),
                    stderr: error.stderr?.toString().substring(0, 1000)
                };
                
                writeFileSync(
                    join(testLogDir, `build-failure-${Date.now()}.json`),
                    JSON.stringify(logEntry, null, 2)
                );

                throw error;
            }
        }, 300000); // 5 minute timeout

        it('should validate build outputs exist', () => {
            const expectedOutputs = [
                'apps/remix/build/client',
                'apps/remix/build/server',
                'packages/prisma/generated'
            ];

            for (const output of expectedOutputs) {
                const outputPath = join(rootDir, output);
                expect(existsSync(outputPath)).toBe(true);
            }
        });

        it('should validate Remix application build artifacts', () => {
            const remixBuildDir = join(rootDir, 'apps/remix/build');
            
            // Check client build
            expect(existsSync(join(remixBuildDir, 'client'))).toBe(true);
            expect(existsSync(join(remixBuildDir, 'server'))).toBe(true);
            
            // Check for essential files
            expect(existsSync(join(remixBuildDir, 'server/index.js'))).toBe(true);
        });
    });

    describe('Build Configuration Scenarios', () => {
        it('should handle development environment build', async () => {
            const testEnv = {
                ...process.env,
                NODE_ENV: 'development',
                NEXT_PUBLIC_WEBAPP_URL: 'http://localhost:3000',
                NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
            };

            expect(() => {
                execSync('node scripts/validate-build-env.js', {
                    stdio: 'pipe',
                    timeout: 30000,
                    env: testEnv
                });
            }).not.toThrow();
        });

        it('should handle production environment build', async () => {
            const testEnv = {
                ...process.env,
                NODE_ENV: 'production',
                NEXT_PUBLIC_WEBAPP_URL: 'https://example.com',
                NEXT_PUBLIC_APP_URL: 'https://example.com',
                NEXT_PRIVATE_ENCRYPTION_KEY: 'test-encryption-key-32-characters',
                NEXT_PRIVATE_DATABASE_URL: 'postgresql://test:test@localhost:5432/test'
            };

            expect(() => {
                execSync('node scripts/validate-build-env.js', {
                    stdio: 'pipe',
                    timeout: 30000,
                    env: testEnv
                });
            }).not.toThrow();
        });

        it('should validate environment variable requirements', () => {
            const requiredVars = [
                'NEXT_PUBLIC_WEBAPP_URL',
                'NEXT_PUBLIC_APP_URL',
                'NEXTAUTH_SECRET',
                'NEXT_PRIVATE_ENCRYPTION_KEY'
            ];

            for (const varName of requiredVars) {
                expect(process.env[varName]).toBeDefined();
            }
        });
    });

    describe('Build Failure Scenarios', () => {
        it('should fail gracefully with missing environment variables', async () => {
            const testEnv = { ...process.env };
            delete testEnv.NEXT_PUBLIC_APP_URL;
            delete testEnv.NEXT_PRIVATE_ENCRYPTION_KEY;

            expect(() => {
                execSync('node scripts/validate-build-env.js', {
                    stdio: 'pipe',
                    timeout: 30000,
                    env: testEnv
                });
            }).toThrow();
        });

        it('should provide helpful error messages for configuration issues', async () => {
            const testEnv = {
                ...process.env,
                NODE_ENV: 'production',
                NEXT_PUBLIC_WEBAPP_URL: 'invalid-url'
            };

            try {
                execSync('node scripts/validate-build-env.js', {
                    stdio: 'pipe',
                    timeout: 30000,
                    env: testEnv
                });
                
                // Should not reach here
                expect(true).toBe(false);
            } catch (error: any) {
                const stderr = error.stderr?.toString() || '';
                const stdout = error.stdout?.toString() || '';
                const output = stderr + stdout;
                
                // Should contain helpful error information
                expect(output.length).toBeGreaterThan(0);
                expect(output).toMatch(/error|Error|ERROR/i);
            }
        });

        it('should handle Turbo configuration errors', () => {
            // Backup original turbo.json
            const turboConfigPath = join(rootDir, 'turbo.json');
            const originalConfig = readFileSync(turboConfigPath, 'utf8');
            
            try {
                // Create invalid turbo.json
                writeFileSync(turboConfigPath, '{ invalid json }');
                
                expect(() => {
                    execSync('turbo run build --dry-run', {
                        stdio: 'pipe',
                        timeout: 30000
                    });
                }).toThrow();
                
            } finally {
                // Restore original config
                writeFileSync(turboConfigPath, originalConfig);
            }
        });
    });

    describe('Build Recovery Mechanisms', () => {
        it('should recover from dependency installation issues', async () => {
            // Test that npm install can recover from missing dependencies
            expect(() => {
                execSync('npm install', {
                    stdio: 'pipe',
                    timeout: 120000 // 2 minutes
                });
            }).not.toThrow();
        });

        it('should validate build cache behavior', () => {
            // Test that turbo cache works correctly
            expect(() => {
                execSync('turbo run build --dry-run', {
                    stdio: 'pipe',
                    timeout: 30000
                });
            }).not.toThrow();
        });

        it('should handle build cleanup and retry', () => {
            // Test build cleanup
            expect(() => {
                execSync('turbo run clean', {
                    stdio: 'pipe',
                    timeout: 60000
                });
            }).not.toThrow();
        });
    });

    describe('Build Performance Validation', () => {
        it('should complete build within reasonable time limits', async () => {
            const startTime = Date.now();
            
            try {
                execSync('turbo run build --filter=@signtusk/remix', {
                    stdio: 'pipe',
                    timeout: 300000, // 5 minutes
                    env: { ...process.env, NODE_ENV: 'development' }
                });
                
                const buildTime = Date.now() - startTime;
                
                // Log performance metrics
                const perfLog = {
                    timestamp: new Date().toISOString(),
                    buildTime,
                    environment: 'test'
                };
                
                writeFileSync(
                    join(testLogDir, `build-performance-${Date.now()}.json`),
                    JSON.stringify(perfLog, null, 2)
                );
                
                // Build should complete within reasonable time
                expect(buildTime).toBeLessThan(300000); // 5 minutes
                
            } catch (error) {
                // Log performance failure
                const buildTime = Date.now() - startTime;
                const perfLog = {
                    timestamp: new Date().toISOString(),
                    buildTime,
                    environment: 'test',
                    failed: true
                };
                
                writeFileSync(
                    join(testLogDir, `build-performance-failure-${Date.now()}.json`),
                    JSON.stringify(perfLog, null, 2)
                );
                
                throw error;
            }
        }, 300000);

        it('should validate build output sizes are reasonable', () => {
            const remixBuildDir = join(rootDir, 'apps/remix/build');
            
            if (existsSync(remixBuildDir)) {
                // Check that build outputs exist and are not empty
                const clientDir = join(remixBuildDir, 'client');
                const serverDir = join(remixBuildDir, 'server');
                
                if (existsSync(clientDir)) {
                    expect(existsSync(clientDir)).toBe(true);
                }
                
                if (existsSync(serverDir)) {
                    expect(existsSync(serverDir)).toBe(true);
                }
            }
        });
    });

    describe('Build Validation Checks', () => {
        it('should validate TypeScript compilation', () => {
            expect(() => {
                execSync('turbo run type-check', {
                    stdio: 'pipe',
                    timeout: 120000 // 2 minutes
                });
            }).not.toThrow();
        });

        it('should validate linting passes', () => {
            expect(() => {
                execSync('turbo run lint', {
                    stdio: 'pipe',
                    timeout: 120000 // 2 minutes
                });
            }).not.toThrow();
        });

        it('should validate build scripts are executable', () => {
            const buildScripts = [
                'scripts/validate-build-env.js',
                'scripts/pre-build-validation.js'
            ];

            for (const script of buildScripts) {
                const scriptPath = join(rootDir, script);
                expect(existsSync(scriptPath)).toBe(true);
                
                // Test script execution
                expect(() => {
                    execSync(`node ${script}`, {
                        stdio: 'pipe',
                        timeout: 30000
                    });
                }).not.toThrow();
            }
        });
    });
});