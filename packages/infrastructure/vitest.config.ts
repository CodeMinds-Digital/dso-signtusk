import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/.turbo/**',
        ],
        testTimeout: 10000,
        hookTimeout: 10000,
        teardownTimeout: 10000,
    },
    resolve: {
        alias: {
            '@signtusk/lib': resolve(__dirname, '../lib/src'),
            '@signtusk/auth': resolve(__dirname, '../auth/src'),
            '@signtusk/cache': resolve(__dirname, '../cache/src'),
            '@signtusk/storage': resolve(__dirname, '../storage/src'),
            '@signtusk/jobs': resolve(__dirname, '../jobs/src'),
            '@signtusk/performance': resolve(__dirname, '../performance/src'),
        },
    },
});