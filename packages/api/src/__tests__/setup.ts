import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { vi } from 'vitest';

/**
 * Test setup for API package
 * Configures test environment, mocks, and utilities
 */

// Mock environment variables for testing
beforeAll(() => {
    // Set up test environment variables
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-jwt-secret-key-for-api-testing-only';
    process.env.API_PORT = '3333';
    process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';
    process.env.RATE_LIMIT_WINDOW_MS = '60000';
    process.env.RATE_LIMIT_MAX_REQUESTS = '100';

    // Mock console methods to reduce noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
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

// Global test utilities for API testing
declare global {
    namespace Vi {
        interface JestAssertion<T = any> {
            toBeValidJWT(): T;
            toBeValidAPIResponse(): T;
            toHaveValidPagination(): T;
            toHaveValidErrorStructure(): T;
        }
    }
}

// Custom matchers for API testing
expect.extend({
    toBeValidJWT(received: string) {
        // Basic JWT format validation (header.payload.signature)
        const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
        const pass = typeof received === 'string' && jwtRegex.test(received);

        return {
            pass,
            message: () =>
                pass
                    ? `Expected ${received} not to be a valid JWT`
                    : `Expected ${received} to be a valid JWT format`,
        };
    },

    toBeValidAPIResponse(received: any) {
        const pass = received &&
            typeof received === 'object' &&
            !Array.isArray(received);

        return {
            pass,
            message: () =>
                pass
                    ? `Expected ${JSON.stringify(received)} not to be a valid API response`
                    : `Expected ${JSON.stringify(received)} to be a valid API response object`,
        };
    },

    toHaveValidPagination(received: any) {
        const pass = received &&
            typeof received === 'object' &&
            typeof received.page === 'number' &&
            typeof received.pageSize === 'number' &&
            typeof received.total === 'number' &&
            received.page > 0 &&
            received.pageSize > 0 &&
            received.total >= 0;

        return {
            pass,
            message: () =>
                pass
                    ? `Expected ${JSON.stringify(received)} not to have valid pagination`
                    : `Expected ${JSON.stringify(received)} to have valid pagination (page, pageSize, total)`,
        };
    },

    toHaveValidErrorStructure(received: any) {
        const pass = received &&
            typeof received === 'object' &&
            typeof received.error === 'string' &&
            typeof received.message === 'string' &&
            typeof received.timestamp === 'string' &&
            typeof received.path === 'string';

        return {
            pass,
            message: () =>
                pass
                    ? `Expected ${JSON.stringify(received)} not to have valid error structure`
                    : `Expected ${JSON.stringify(received)} to have valid error structure (error, message, timestamp, path)`,
        };
    },
});

// Test data generators
export const testData = {
    validUser: {
        id: 'test_user_123',
        email: 'test@example.com',
        name: 'Test User',
        organizationId: 'test_org_123',
        roles: ['user'],
        emailVerified: true,
    },

    validDocument: {
        id: 'test_doc_123',
        name: 'Test Document',
        description: 'A test document',
        status: 'DRAFT' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },

    validSigningRequest: {
        id: 'test_req_123',
        documentId: 'test_doc_123',
        title: 'Test Signing Request',
        message: 'Please sign this test document',
        status: 'DRAFT' as const,
        recipients: [
            {
                id: 'test_recipient_123',
                email: 'signer@example.com',
                name: 'Test Signer',
                role: 'signer' as const,
                order: 1,
                status: 'PENDING' as const,
            }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    },

    validCredentials: {
        email: 'test@example.com',
        password: 'password',
    },

    validRegistration: {
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
    },

    invalidCredentials: {
        email: 'test@example.com',
        password: 'wrongpassword',
    },

    invalidEmail: 'invalid-email-format',
    weakPassword: 'weak',
    strongPassword: 'StrongPassword123!@#',
};

// Test utilities
export const testUtils = {
    /**
     * Generate a test JWT token
     */
    generateTestToken: (payload: any = testData.validUser, expiresIn: string = '1h'): string => {
        const jwt = require('jsonwebtoken');
        return jwt.sign(
            payload,
            process.env.JWT_SECRET || 'test-jwt-secret',
            { expiresIn }
        );
    },

    /**
     * Create authorization headers
     */
    createAuthHeaders: (token?: string): Record<string, string> => {
        const authToken = token || testUtils.generateTestToken();
        return {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
        };
    },

    /**
     * Create test request options
     */
    createRequestOptions: (method: string, body?: any, headers?: Record<string, string>) => ({
        method,
        headers: {
            'Content-Type': 'application/json',
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
    }),

    /**
     * Wait for a specified amount of time
     */
    wait: (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * Generate random test data
     */
    randomString: (length: number = 10): string => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    },

    randomEmail: (): string => {
        return `test${testUtils.randomString(8)}@example.com`;
    },

    randomId: (prefix: string = 'test'): string => {
        return `${prefix}_${testUtils.randomString(12)}`;
    },
};

// Performance testing utilities
export const performanceUtils = {
    /**
     * Measure execution time of a function
     */
    measureTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
        const start = Date.now();
        const result = await fn();
        const duration = Date.now() - start;
        return { result, duration };
    },

    /**
     * Run multiple concurrent requests
     */
    runConcurrent: async <T>(
        requests: (() => Promise<T>)[],
        maxConcurrency: number = 10
    ): Promise<T[]> => {
        const results: T[] = [];

        for (let i = 0; i < requests.length; i += maxConcurrency) {
            const batch = requests.slice(i, i + maxConcurrency);
            const batchResults = await Promise.all(batch.map(req => req()));
            results.push(...batchResults);
        }

        return results;
    },

    /**
     * Calculate percentiles from an array of numbers
     */
    calculatePercentiles: (values: number[]): { p50: number; p95: number; p99: number } => {
        const sorted = values.sort((a, b) => a - b);
        const len = sorted.length;

        return {
            p50: sorted[Math.floor(len * 0.5)] || 0,
            p95: sorted[Math.floor(len * 0.95)] || 0,
            p99: sorted[Math.floor(len * 0.99)] || 0,
        };
    },
};

// Mock implementations for external dependencies
export const mocks = {
    /**
     * Mock database operations
     */
    mockDatabase: {
        users: new Map(),
        documents: new Map(),
        signingRequests: new Map(),

        reset: () => {
            mocks.mockDatabase.users.clear();
            mocks.mockDatabase.documents.clear();
            mocks.mockDatabase.signingRequests.clear();
        },
    },

    /**
     * Mock email service
     */
    mockEmailService: {
        sentEmails: [] as any[],

        send: vi.fn().mockImplementation((email) => {
            mocks.mockEmailService.sentEmails.push(email);
            return Promise.resolve({ messageId: testUtils.randomId('msg') });
        }),

        reset: () => {
            mocks.mockEmailService.sentEmails = [];
            mocks.mockEmailService.send.mockClear();
        },
    },

    /**
     * Mock storage service
     */
    mockStorageService: {
        files: new Map(),

        upload: vi.fn().mockImplementation((key, data) => {
            mocks.mockStorageService.files.set(key, data);
            return Promise.resolve({ key, size: data.length });
        }),

        download: vi.fn().mockImplementation((key) => {
            const data = mocks.mockStorageService.files.get(key);
            return data ? Promise.resolve(data) : Promise.reject(new Error('File not found'));
        }),

        delete: vi.fn().mockImplementation((key) => {
            const existed = mocks.mockStorageService.files.has(key);
            mocks.mockStorageService.files.delete(key);
            return Promise.resolve(existed);
        }),

        reset: () => {
            mocks.mockStorageService.files.clear();
            mocks.mockStorageService.upload.mockClear();
            mocks.mockStorageService.download.mockClear();
            mocks.mockStorageService.delete.mockClear();
        },
    },
};

// Reset all mocks before each test
beforeEach(() => {
    Object.values(mocks).forEach(mock => {
        if (typeof mock.reset === 'function') {
            mock.reset();
        }
    });
});