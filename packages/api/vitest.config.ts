import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./src/__tests__/setup.ts'],
        include: [
            'src/**/*.test.ts',
            'src/**/*.spec.ts',
            'src/__tests__/**/*.test.ts'
        ],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.turbo/**',
            '**/coverage/**'
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
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
                'src/__tests__/setup.ts'
            ],
            thresholds: {
                global: {
                    branches: 85,
                    functions: 90,
                    lines: 90,
                    statements: 90,
                },
            },
        },
        testTimeout: 30000, // 30 seconds for API tests
        hookTimeout: 10000,
        teardownTimeout: 5000,
        // Separate test patterns for different types of tests
        pool: 'threads',
        poolOptions: {
            threads: {
                singleThread: false,
                maxThreads: 4,
                minThreads: 1,
            }
        },
        // Test categorization
        sequence: {
            concurrent: true,
            shuffle: false,
        },
        // Performance test specific configuration
        benchmark: {
            include: ['**/*.bench.{js,ts}'],
            exclude: ['node_modules/**/*'],
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '@tests': resolve(__dirname, './src/__tests__'),
        },
    },
    define: {
        // Define test environment variables
        'process.env.NODE_ENV': '"test"',
        'process.env.JWT_SECRET': '"test-jwt-secret"',
    },
});