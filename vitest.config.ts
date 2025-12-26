import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        // Use jsdom for UI component tests, node for everything else
        environment: 'jsdom',
        setupFiles: ['./test/setup.ts'],
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.turbo/**',
            '**/e2e/**', // Exclude E2E tests from unit test runs
            '**/playwright-report/**',
            '**/test-results/**',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
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
            thresholds: {
                global: {
                    branches: 80,
                    functions: 80,
                    lines: 80,
                    statements: 80,
                },
            },
        },
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 10000,
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './packages'),
            '@signtusk/lib': resolve(__dirname, './packages/lib/src'),
            '@signtusk/ui': resolve(__dirname, './packages/ui/src'),
            '@signtusk/email': resolve(__dirname, './packages/email/src'),
            '@signtusk/auth': resolve(__dirname, './packages/auth/src'),
            '@signtusk/database': resolve(__dirname, './packages/database/src'),
            '@signtusk/cache': resolve(__dirname, './packages/cache/src'),
            '@signtusk/security': resolve(__dirname, './packages/security/src'),
            '@signtusk/storage': resolve(__dirname, './packages/storage/src'),
            '@signtusk/jobs': resolve(__dirname, './packages/jobs/src'),
            '@signtusk/infrastructure': resolve(__dirname, './packages/infrastructure/src'),
        },
    },
});