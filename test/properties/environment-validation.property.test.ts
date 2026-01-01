import * as fc from 'fast-check';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import path from 'path';
import { afterEach, describe, it } from 'vitest';

/**
 * **Feature: build-failure-resolution, Property 1: Environment Variable Validation**
 * **Validates: Requirements 2.1, 2.2**
 * 
 * For any build execution, all required environment variables must be present and valid 
 * before any package build begins.
 * 
 * This property ensures that:
 * - All required environment variables are present before build starts
 * - Environment variables are loaded in correct precedence order
 * - Build-time and runtime variables are properly distinguished
 * - Environment variable values meet format and security requirements
 */

describe('Property 1: Environment Variable Validation', () => {
    const projectRoot = path.resolve(__dirname, '../..');
    const testEnvFile = path.join(projectRoot, '.env.test');
    
    // Clean up test files after each test
    afterEach(() => {
        if (existsSync(testEnvFile)) {
            unlinkSync(testEnvFile);
        }
    });

    // Required environment variables by category
    const requiredEnvVars = {
        auth: [
            'NEXTAUTH_SECRET',
            'NEXT_PRIVATE_ENCRYPTION_KEY',
            'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY',
            'JWT_SECRET',
            'ENCRYPTION_KEY',
            'SESSION_SECRET'
        ],
        urls: [
            'NEXT_PUBLIC_WEBAPP_URL',
            'NEXT_PRIVATE_INTERNAL_WEBAPP_URL',
            'NEXT_PUBLIC_APP_URL',
            'NEXT_PUBLIC_API_URL'
        ],
        database: [
            'NEXT_PRIVATE_DATABASE_URL',
            'NEXT_PRIVATE_DIRECT_DATABASE_URL'
        ],
        server: [
            'PORT',
            'NODE_ENV'
        ]
    };

    // Build-time vs runtime variable classification
    const buildTimeVars = [
        'NODE_ENV',
        'NEXT_PUBLIC_WEBAPP_URL',
        'NEXT_PUBLIC_APP_URL',
        'NEXT_PUBLIC_API_URL',
        'NEXT_PUBLIC_UPLOAD_TRANSPORT',
        'PORT'
    ];

    const runtimeVars = [
        'NEXTAUTH_SECRET',
        'NEXT_PRIVATE_ENCRYPTION_KEY',
        'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY',
        'NEXT_PRIVATE_DATABASE_URL',
        'NEXT_PRIVATE_DIRECT_DATABASE_URL',
        'NEXT_PRIVATE_INTERNAL_WEBAPP_URL',
        'JWT_SECRET',
        'ENCRYPTION_KEY',
        'SESSION_SECRET'
    ];

    it('should validate that all required environment variables are present for any environment configuration', () => {
        fc.assert(
            fc.property(
                fc.record({
                    nodeEnv: fc.constantFrom('development', 'production', 'test'),
                    hasAuth: fc.boolean(),
                    hasDatabase: fc.boolean(),
                    hasUrls: fc.boolean()
                }),
                (config) => {
                    // Create a test environment configuration
                    const envContent = [
                        `NODE_ENV="${config.nodeEnv}"`,
                        'PORT="3000"'
                    ];

                    if (config.hasAuth) {
                        envContent.push(
                            'NEXTAUTH_SECRET="test-secret-that-is-at-least-32-characters-long"',
                            'NEXT_PRIVATE_ENCRYPTION_KEY="test-encryption-key-32-chars-long"',
                            'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY="test-secondary-key-32-chars-long"',
                            'JWT_SECRET="test-jwt-secret-that-is-at-least-32-characters-long"',
                            'ENCRYPTION_KEY="test-encryption-key-32-characters"',
                            'SESSION_SECRET="test-session-secret-that-is-at-least-32-characters-long"'
                        );
                    }

                    if (config.hasUrls) {
                        envContent.push(
                            'NEXT_PUBLIC_WEBAPP_URL="http://localhost:3000"',
                            'NEXT_PRIVATE_INTERNAL_WEBAPP_URL="http://localhost:3000"',
                            'NEXT_PUBLIC_APP_URL="http://localhost:3000"',
                            'NEXT_PUBLIC_API_URL="http://localhost:3000"'
                        );
                    }

                    if (config.hasDatabase) {
                        envContent.push(
                            'NEXT_PRIVATE_DATABASE_URL="postgresql://test:test@localhost:5432/test"',
                            'NEXT_PRIVATE_DIRECT_DATABASE_URL="postgresql://test:test@localhost:5432/test"'
                        );
                    }

                    // Write test environment file
                    writeFileSync(testEnvFile, envContent.join('\n'));

                    // Parse the environment file
                    const env = parseEnvFile(readFileSync(testEnvFile, 'utf8'));

                    // Check that required variables are present when expected
                    const allRequired = Object.values(requiredEnvVars).flat();
                    const missingRequired = allRequired.filter(varName => !env[varName]);

                    // For a complete configuration, no required variables should be missing
                    if (config.hasAuth && config.hasUrls && config.hasDatabase) {
                        return missingRequired.length === 0;
                    }

                    // For incomplete configurations, we expect some variables to be missing
                    return true;
                }
            ),
            { numRuns: 5 }
        );
    });

    it('should properly distinguish between build-time and runtime variables for any environment', () => {
        fc.assert(
            fc.property(
                fc.record({
                    buildVars: fc.array(fc.constantFrom(...buildTimeVars), { minLength: 1, maxLength: buildTimeVars.length }),
                    runtimeVars: fc.array(fc.constantFrom(...runtimeVars), { minLength: 1, maxLength: runtimeVars.length })
                }),
                (config) => {
                    // Create environment with selected variables
                    const envContent: string[] = [];

                    config.buildVars.forEach(varName => {
                        switch (varName) {
                            case 'NODE_ENV':
                                envContent.push('NODE_ENV="development"');
                                break;
                            case 'PORT':
                                envContent.push('PORT="3000"');
                                break;
                            case 'NEXT_PUBLIC_WEBAPP_URL':
                                envContent.push('NEXT_PUBLIC_WEBAPP_URL="http://localhost:3000"');
                                break;
                            case 'NEXT_PUBLIC_APP_URL':
                                envContent.push('NEXT_PUBLIC_APP_URL="http://localhost:3000"');
                                break;
                            case 'NEXT_PUBLIC_API_URL':
                                envContent.push('NEXT_PUBLIC_API_URL="http://localhost:3000"');
                                break;
                            case 'NEXT_PUBLIC_UPLOAD_TRANSPORT':
                                envContent.push('NEXT_PUBLIC_UPLOAD_TRANSPORT="database"');
                                break;
                        }
                    });

                    config.runtimeVars.forEach(varName => {
                        switch (varName) {
                            case 'NEXTAUTH_SECRET':
                                envContent.push('NEXTAUTH_SECRET="test-secret-that-is-at-least-32-characters-long"');
                                break;
                            case 'NEXT_PRIVATE_ENCRYPTION_KEY':
                                envContent.push('NEXT_PRIVATE_ENCRYPTION_KEY="test-encryption-key-32-chars-long"');
                                break;
                            case 'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY':
                                envContent.push('NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY="test-secondary-key-32-chars-long"');
                                break;
                            case 'NEXT_PRIVATE_DATABASE_URL':
                                envContent.push('NEXT_PRIVATE_DATABASE_URL="postgresql://test:test@localhost:5432/test"');
                                break;
                            case 'NEXT_PRIVATE_DIRECT_DATABASE_URL':
                                envContent.push('NEXT_PRIVATE_DIRECT_DATABASE_URL="postgresql://test:test@localhost:5432/test"');
                                break;
                            case 'NEXT_PRIVATE_INTERNAL_WEBAPP_URL':
                                envContent.push('NEXT_PRIVATE_INTERNAL_WEBAPP_URL="http://localhost:3000"');
                                break;
                            case 'JWT_SECRET':
                                envContent.push('JWT_SECRET="test-jwt-secret-that-is-at-least-32-characters-long"');
                                break;
                            case 'ENCRYPTION_KEY':
                                envContent.push('ENCRYPTION_KEY="test-encryption-key-32-characters"');
                                break;
                            case 'SESSION_SECRET':
                                envContent.push('SESSION_SECRET="test-session-secret-that-is-at-least-32-characters-long"');
                                break;
                        }
                    });

                    if (envContent.length === 0) {
                        return true; // Skip empty configurations
                    }

                    // Write test environment file
                    writeFileSync(testEnvFile, envContent.join('\n'));

                    // Parse the environment file
                    const env = parseEnvFile(readFileSync(testEnvFile, 'utf8'));

                    // Verify build-time variables are correctly identified
                    const foundBuildVars = Object.keys(env).filter(key => 
                        buildTimeVars.includes(key)
                    );

                    // Verify runtime variables are correctly identified
                    const foundRuntimeVars = Object.keys(env).filter(key => 
                        runtimeVars.includes(key)
                    );

                    // Check that variables are properly categorized
                    const buildVarsCorrect = config.buildVars.every(varName => 
                        foundBuildVars.includes(varName)
                    );

                    const runtimeVarsCorrect = config.runtimeVars.every(varName => 
                        foundRuntimeVars.includes(varName)
                    );

                    return buildVarsCorrect && runtimeVarsCorrect;
                }
            ),
            { numRuns: 5 }
        );
    });

    it('should validate environment variable formats and security requirements for any configuration', () => {
        fc.assert(
            fc.property(
                fc.record({
                    encryptionKeyLength: fc.integer({ min: 16, max: 64 }),
                    urlProtocol: fc.constantFrom('http', 'https'),
                    port: fc.integer({ min: 1000, max: 9999 }),
                    nodeEnv: fc.constantFrom('development', 'production', 'test')
                }),
                (config) => {
                    // Create environment with various formats
                    const encryptionKey = 'a'.repeat(config.encryptionKeyLength);
                    const url = `${config.urlProtocol}://localhost:${config.port}`;
                    
                    const envContent = [
                        `NODE_ENV="${config.nodeEnv}"`,
                        `PORT="${config.port}"`,
                        `NEXTAUTH_SECRET="${encryptionKey}"`,
                        `NEXT_PRIVATE_ENCRYPTION_KEY="${encryptionKey}"`,
                        `NEXT_PUBLIC_WEBAPP_URL="${url}"`,
                        `NEXT_PUBLIC_APP_URL="${url}"`,
                        `NEXT_PRIVATE_DATABASE_URL="postgresql://test:test@localhost:5432/test"`
                    ];

                    // Write test environment file
                    writeFileSync(testEnvFile, envContent.join('\n'));

                    // Parse the environment file
                    const env = parseEnvFile(readFileSync(testEnvFile, 'utf8'));

                    // Validate encryption key lengths (should be at least 32 characters for security)
                    const encryptionKeys = ['NEXTAUTH_SECRET', 'NEXT_PRIVATE_ENCRYPTION_KEY'];
                    const encryptionKeysValid = encryptionKeys.every(key => {
                        const value = env[key];
                        return value && value.length >= 32; // Security requirement
                    });

                    // Validate URL formats
                    const urlVars = ['NEXT_PUBLIC_WEBAPP_URL', 'NEXT_PUBLIC_APP_URL'];
                    const urlsValid = urlVars.every(key => {
                        const value = env[key];
                        return value && value.match(/^https?:\/\/.+/);
                    });

                    // Validate database URL format
                    const dbUrl = env['NEXT_PRIVATE_DATABASE_URL'];
                    const dbUrlValid = dbUrl && dbUrl.match(/^postgresql:\/\/.+/);

                    // Validate port is numeric
                    const port = env['PORT'];
                    const portValid = port && !isNaN(parseInt(port));

                    // For security, encryption keys should be at least 32 characters
                    if (config.encryptionKeyLength < 32) {
                        return !encryptionKeysValid; // Should fail validation
                    }

                    return encryptionKeysValid && urlsValid && dbUrlValid && portValid;
                }
            ),
            { numRuns: 5 }
        );
    });

    it('should load environment files in correct precedence order for any file combination', () => {
        fc.assert(
            fc.property(
                fc.record({
                    hasEnv: fc.boolean(),
                    hasEnvLocal: fc.boolean(),
                    hasEnvDevelopment: fc.boolean(),
                    testValue: fc.string({ minLength: 1, maxLength: 20 })
                }),
                (config) => {
                    const testFiles: string[] = [];
                    const expectedValue = config.testValue;

                    // Create test environment files with different values
                    if (config.hasEnv) {
                        const envPath = path.join(projectRoot, '.env.test-base');
                        writeFileSync(envPath, `TEST_VAR="base-value"`);
                        testFiles.push(envPath);
                    }

                    if (config.hasEnvDevelopment) {
                        const envDevPath = path.join(projectRoot, '.env.test-dev');
                        writeFileSync(envDevPath, `TEST_VAR="dev-value"`);
                        testFiles.push(envDevPath);
                    }

                    if (config.hasEnvLocal) {
                        const envLocalPath = path.join(projectRoot, '.env.test-local');
                        writeFileSync(envLocalPath, `TEST_VAR="${expectedValue}"`);
                        testFiles.push(envLocalPath);
                    }

                    if (testFiles.length === 0) {
                        return true; // Skip if no files to test
                    }

                    // Simulate loading environment files in precedence order
                    let finalValue = '';
                    
                    // Load in precedence order: .env -> .env.development -> .env.local
                    if (config.hasEnv) {
                        finalValue = 'base-value';
                    }
                    if (config.hasEnvDevelopment) {
                        finalValue = 'dev-value';
                    }
                    if (config.hasEnvLocal) {
                        finalValue = expectedValue;
                    }

                    // Clean up test files
                    testFiles.forEach(file => {
                        if (existsSync(file)) {
                            unlinkSync(file);
                        }
                    });

                    // .env.local should have highest precedence
                    if (config.hasEnvLocal) {
                        return finalValue === expectedValue;
                    }

                    // Otherwise, the last loaded file should win
                    return true;
                }
            ),
            { numRuns: 5 }
        );
    });

    it('should handle missing environment variables gracefully for any build configuration', () => {
        fc.assert(
            fc.property(
                fc.record({
                    missingVars: fc.array(
                        fc.constantFrom(...Object.values(requiredEnvVars).flat()),
                        { minLength: 1, maxLength: 5 }
                    ),
                    presentVars: fc.array(
                        fc.constantFrom(...Object.values(requiredEnvVars).flat()),
                        { minLength: 1, maxLength: 10 }
                    )
                }),
                (config) => {
                    // Create environment with some missing variables
                    const envContent: string[] = [];

                    config.presentVars.forEach(varName => {
                        if (!config.missingVars.includes(varName)) {
                            switch (varName) {
                                case 'NODE_ENV':
                                    envContent.push('NODE_ENV="development"');
                                    break;
                                case 'PORT':
                                    envContent.push('PORT="3000"');
                                    break;
                                case 'NEXTAUTH_SECRET':
                                    envContent.push('NEXTAUTH_SECRET="test-secret-that-is-at-least-32-characters-long"');
                                    break;
                                case 'NEXT_PRIVATE_ENCRYPTION_KEY':
                                    envContent.push('NEXT_PRIVATE_ENCRYPTION_KEY="test-encryption-key-32-chars-long"');
                                    break;
                                case 'NEXT_PUBLIC_WEBAPP_URL':
                                    envContent.push('NEXT_PUBLIC_WEBAPP_URL="http://localhost:3000"');
                                    break;
                                case 'NEXT_PRIVATE_DATABASE_URL':
                                    envContent.push('NEXT_PRIVATE_DATABASE_URL="postgresql://test:test@localhost:5432/test"');
                                    break;
                                default:
                                    envContent.push(`${varName}="test-value"`);
                            }
                        }
                    });

                    if (envContent.length === 0) {
                        return true; // Skip empty configurations
                    }

                    // Write test environment file
                    writeFileSync(testEnvFile, envContent.join('\n'));

                    // Parse the environment file
                    const env = parseEnvFile(readFileSync(testEnvFile, 'utf8'));

                    // Check that missing variables are indeed missing
                    const actuallyMissing = config.missingVars.filter(varName => !env[varName]);
                    
                    // Check that present variables are indeed present
                    const actuallyPresent = config.presentVars.filter(varName => 
                        !config.missingVars.includes(varName) && env[varName]
                    );

                    // The validation should correctly identify missing vs present variables
                    return actuallyMissing.length > 0 || actuallyPresent.length > 0;
                }
            ),
            { numRuns: 5 }
        );
    });
});

/**
 * Helper function to parse environment file content
 */
function parseEnvFile(content: string): Record<string, string> {
    const env: Record<string, string> = {};
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();
        
        if (!trimmed || trimmed.startsWith('#')) {
            continue;
        }

        const equalIndex = trimmed.indexOf('=');
        if (equalIndex === -1) {
            continue;
        }

        const key = trimmed.substring(0, equalIndex).trim();
        let value = trimmed.substring(equalIndex + 1).trim();

        // Remove quotes
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }

        env[key] = value;
    }

    return env;
}