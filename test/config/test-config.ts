/**
 * Comprehensive test configuration for all testing types
 */

export const testConfig = {
    // Unit test configuration
    unit: {
        timeout: 5000,
        retries: 0,
        coverage: {
            threshold: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
                perFile: {
                    branches: 70,
                    functions: 70,
                    lines: 70,
                    statements: 70,
                },
            },
            exclude: [
                'node_modules/',
                'dist/',
                '.turbo/',
                'coverage/',
                '**/*.d.ts',
                '**/*.config.{js,ts}',
                '**/test/**',
                '**/__tests__/**',
                '**/*.test.{js,ts}',
                '**/*.spec.{js,ts}',
            ],
        },
    },

    // Integration test configuration
    integration: {
        timeout: 30000,
        retries: 1,
        setupTimeout: 60000,
        teardownTimeout: 30000,
    },

    // E2E test configuration
    e2e: {
        timeout: 60000,
        retries: 2,
        workers: process.env.CI ? 1 : 2,
        browsers: ['chromium', 'firefox', 'webkit'],
        baseURL: process.env.BASE_URL || 'http://localhost:3000',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        trace: 'on-first-retry',
    },

    // Property-based test configuration
    property: {
        numRuns: process.env.CI ? 1000 : 100,
        timeout: 10000,
        seed: process.env.PROPERTY_TEST_SEED ? parseInt(process.env.PROPERTY_TEST_SEED) : undefined,
        verbose: process.env.PROPERTY_TEST_VERBOSE === 'true',
    },

    // Performance test configuration
    performance: {
        timeout: 30000,
        thresholds: {
            // API response times (ms)
            api: {
                fast: 100,
                acceptable: 500,
                slow: 1000,
            },
            // Database query times (ms)
            database: {
                fast: 50,
                acceptable: 200,
                slow: 500,
            },
            // File processing times (ms per MB)
            fileProcessing: {
                fast: 100,
                acceptable: 500,
                slow: 1000,
            },
        },
    },

    // Database test configuration
    database: {
        testUrl: process.env.TEST_DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db',
        poolSize: 5,
        timeout: 10000,
        migrations: {
            run: true,
            rollback: true,
        },
        seeding: {
            enabled: true,
            cleanup: true,
        },
    },

    // Mock configuration
    mocks: {
        // External services to mock in tests
        externalServices: {
            email: true,
            storage: true,
            payment: true,
            oauth: true,
        },
        // API endpoints to mock
        apis: {
            timestampServer: true,
            certificateAuthority: true,
            webhooks: true,
        },
    },

    // Test data configuration
    testData: {
        // Faker.js configuration
        faker: {
            locale: 'en',
            seed: 12345,
        },
        // Test file paths
        fixtures: {
            documents: './test/fixtures/documents/',
            images: './test/fixtures/images/',
            certificates: './test/fixtures/certificates/',
        },
        // Generated data limits
        limits: {
            maxUsers: 100,
            maxDocuments: 50,
            maxOrganizations: 10,
        },
    },

    // Parallel execution configuration
    parallel: {
        unit: true,
        integration: false, // Database conflicts
        e2e: true,
        property: true,
    },

    // Reporting configuration
    reporting: {
        formats: ['text', 'json', 'html'],
        outputDir: './test-results/',
        coverage: {
            formats: ['text', 'json', 'html', 'lcov'],
            outputDir: './coverage/',
        },
        junit: {
            enabled: process.env.CI === 'true',
            outputFile: './test-results/junit.xml',
        },
    },

    // Environment-specific overrides
    environments: {
        development: {
            unit: { timeout: 10000 },
            e2e: { retries: 0, headed: true },
            property: { numRuns: 50 },
        },
        ci: {
            unit: { timeout: 15000 },
            e2e: { retries: 3, workers: 1 },
            property: { numRuns: 500 },
            reporting: {
                junit: { enabled: true },
                coverage: { threshold: { global: { lines: 85 } } },
            },
        },
        production: {
            // Production testing configuration (smoke tests only)
            unit: { enabled: false },
            integration: { enabled: false },
            e2e: {
                enabled: true,
                tests: ['smoke/**/*.spec.ts'],
                timeout: 30000,
            },
            property: { enabled: false },
        },
    },
};

/**
 * Get configuration for current environment
 */
export function getTestConfig() {
    const env = process.env.NODE_ENV || 'development';
    const baseConfig = testConfig;
    const envOverrides = testConfig.environments[env as keyof typeof testConfig.environments] || {};

    // Deep merge configuration
    return mergeDeep(baseConfig, envOverrides);
}

/**
 * Deep merge utility for configuration objects
 */
function mergeDeep(target: any, source: any): any {
    const output = { ...target };

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            if (isObject(source[key])) {
                if (!(key in target)) {
                    Object.assign(output, { [key]: source[key] });
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                Object.assign(output, { [key]: source[key] });
            }
        });
    }

    return output;
}

function isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Test environment setup utilities
 */
export const testEnvironment = {
    /**
     * Check if running in CI environment
     */
    isCI: () => process.env.CI === 'true',

    /**
     * Check if running in debug mode
     */
    isDebug: () => process.env.DEBUG === 'true',

    /**
     * Get test database URL
     */
    getDatabaseUrl: () => {
        const config = getTestConfig();
        return config.database.testUrl;
    },

    /**
     * Get base URL for E2E tests
     */
    getBaseUrl: () => {
        const config = getTestConfig();
        return config.e2e.baseURL;
    },

    /**
     * Check if specific test type is enabled
     */
    isTestTypeEnabled: (testType: 'unit' | 'integration' | 'e2e' | 'property') => {
        const config = getTestConfig();
        const envConfig = config.environments[process.env.NODE_ENV as keyof typeof config.environments];
        return envConfig?.[testType]?.enabled !== false;
    },
};