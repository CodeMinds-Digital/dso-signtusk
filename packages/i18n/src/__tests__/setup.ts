import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
};

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
    value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
    },
    writable: true,
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
    value: {
        language: 'en-US',
        languages: ['en-US', 'en'],
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
    writable: true,
});

// Mock document
Object.defineProperty(document, 'documentElement', {
    value: {
        lang: 'en',
        dir: 'ltr',
    },
    writable: true,
});