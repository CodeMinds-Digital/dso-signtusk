import { beforeAll, afterAll, beforeEach, afterEach, expect } from 'vitest';
import { vi } from 'vitest';

// Import DOM testing utilities if in jsdom environment
if (typeof window !== 'undefined') {
    // We're in jsdom environment, import DOM testing utilities
    import('@testing-library/jest-dom');
}

// Mock environment variables for testing
beforeAll(() => {
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
    process.env.REDIS_URL = 'redis://localhost:6379/1';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
    process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars-long';

    // Mock console methods to reduce noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });

    // Set up DOM mocks if in jsdom environment
    if (typeof window !== 'undefined') {
        // Mock IntersectionObserver
        global.IntersectionObserver = class IntersectionObserver {
            root: Element | null = null;
            rootMargin: string = '';
            thresholds: ReadonlyArray<number> = [];

            constructor() { }
            disconnect() { }
            observe() { }
            unobserve() { }
            takeRecords(): IntersectionObserverEntry[] { return []; }
        } as any;

        // Mock ResizeObserver
        global.ResizeObserver = class ResizeObserver {
            constructor() { }
            disconnect() { }
            observe() { }
            unobserve() { }
        } as any;

        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: (query: string) => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: () => { },
                removeListener: () => { },
                addEventListener: () => { },
                removeEventListener: () => { },
                dispatchEvent: () => { },
            }),
        });
    }
});

afterAll(() => {
    // Restore console methods
    vi.restoreAllMocks();
});

beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
});

afterEach(() => {
    // Clean up after each test
    vi.clearAllTimers();
});

// Global test utilities
declare global {
    namespace Vi {
        interface JestAssertion<T = any> {
            toBeValidUUID(): T;
            toBeValidEmail(): T;
            toBeValidDate(): T;
        }
    }
}

// Custom matchers
expect.extend({
    toBeValidUUID(received: string) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        const pass = uuidRegex.test(received);

        return {
            pass,
            message: () =>
                pass
                    ? `Expected ${received} not to be a valid UUID`
                    : `Expected ${received} to be a valid UUID`,
        };
    },

    toBeValidEmail(received: string) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const pass = emailRegex.test(received);

        return {
            pass,
            message: () =>
                pass
                    ? `Expected ${received} not to be a valid email`
                    : `Expected ${received} to be a valid email`,
        };
    },

    toBeValidDate(received: any) {
        const pass = received instanceof Date && !isNaN(received.getTime());

        return {
            pass,
            message: () =>
                pass
                    ? `Expected ${received} not to be a valid date`
                    : `Expected ${received} to be a valid date`,
        };
    },
});