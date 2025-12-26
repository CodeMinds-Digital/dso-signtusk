import { vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock crypto for Node.js compatibility
if (!global.crypto) {
    const { webcrypto } = await import('node:crypto');
    global.crypto = webcrypto as any;
}

// Setup test environment
beforeEach(() => {
    vi.clearAllMocks();
});