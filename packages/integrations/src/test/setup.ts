import { beforeEach, afterEach } from 'vitest';

// Global test setup
beforeEach(() => {
    // Reset any global state before each test
    process.env.NODE_ENV = 'test';
});

afterEach(() => {
    // Clean up after each test
    // Reset environment variables if needed
});

// Mock fetch for HTTP requests in tests
global.fetch = global.fetch || (() => {
    throw new Error('fetch is not available in test environment. Mock it in your tests.');
});

// Extend expect with custom matchers if needed
// expect.extend({
//   // Custom matchers can be added here
// });