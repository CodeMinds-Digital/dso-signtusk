import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000, // 30 seconds for property tests
    hookTimeout: 10000,
    teardownTimeout: 5000,
  },
  resolve: {
    alias: {
      '@test-infrastructure/errors': resolve(__dirname, './errors/index.ts'),
      '@test-infrastructure/config': resolve(__dirname, './config/index.ts'),
      '@test-infrastructure/mocks': resolve(__dirname, './mocks/index.ts'),
      '@test-infrastructure/generators': resolve(__dirname, './generators/index.ts'),
      '@test-infrastructure/integration': resolve(__dirname, './integration/index.ts'),
    },
  },
});