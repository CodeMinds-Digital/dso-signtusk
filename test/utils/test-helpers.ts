import { vi } from 'vitest';
import { faker } from '@faker-js/faker';

/**
 * Comprehensive test utilities for all domains
 */

// Mock data generators
export const mockData = {
    user: () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        password: faker.internet.password({ length: 12 }),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    }),

    organization: () => ({
        id: faker.string.uuid(),
        name: faker.company.name(),
        domain: faker.internet.domainName(),
        settings: {
            requireTwoFactor: faker.datatype.boolean(),
            allowPublicSigning: faker.datatype.boolean(),
            documentRetentionDays: faker.number.int({ min: 30, max: 2555 }),
        },
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    }),

    document: () => ({
        id: faker.string.uuid(),
        name: faker.system.fileName({ extensionCount: 0 }) + '.pdf',
        originalName: faker.system.fileName({ extensionCount: 0 }) + '.pdf',
        size: faker.number.int({ min: 1024, max: 10485760 }), // 1KB to 10MB
        mimeType: 'application/pdf',
        status: faker.helpers.arrayElement(['draft', 'pending', 'completed', 'cancelled']),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    }),

    signingRequest: () => ({
        id: faker.string.uuid(),
        documentId: faker.string.uuid(),
        status: faker.helpers.arrayElement(['pending', 'in_progress', 'completed', 'expired']),
        expiresAt: faker.date.future(),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    }),

    recipient: () => ({
        id: faker.string.uuid(),
        email: faker.internet.email(),
        name: faker.person.fullName(),
        role: faker.helpers.arrayElement(['signer', 'approver', 'viewer']),
        status: faker.helpers.arrayElement(['pending', 'viewed', 'signed', 'declined']),
        signedAt: faker.datatype.boolean() ? faker.date.recent() : null,
    }),

    template: () => ({
        id: faker.string.uuid(),
        name: faker.lorem.words(3),
        description: faker.lorem.sentence(),
        category: faker.helpers.arrayElement(['HR', 'Legal', 'Sales', 'Finance']),
        isPublic: faker.datatype.boolean(),
        usageCount: faker.number.int({ min: 0, max: 1000 }),
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
    }),

    signatureField: () => ({
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement(['signature', 'text', 'date', 'checkbox']),
        page: faker.number.int({ min: 1, max: 10 }),
        x: faker.number.int({ min: 0, max: 600 }),
        y: faker.number.int({ min: 0, max: 800 }),
        width: faker.number.int({ min: 50, max: 300 }),
        height: faker.number.int({ min: 20, max: 100 }),
        required: faker.datatype.boolean(),
    }),
};

// Database test utilities
export const dbTestUtils = {
    async cleanupDatabase() {
        // Mock database cleanup
        console.log('Cleaning up test database...');
    },

    async seedTestData() {
        // Mock database seeding
        console.log('Seeding test data...');
        return {
            users: Array.from({ length: 5 }, () => mockData.user()),
            organizations: Array.from({ length: 3 }, () => mockData.organization()),
            documents: Array.from({ length: 10 }, () => mockData.document()),
        };
    },

    async createTestUser(overrides = {}) {
        const user = { ...mockData.user(), ...overrides };
        console.log('Creating test user:', user.email);
        return user;
    },

    async createTestOrganization(overrides = {}) {
        const org = { ...mockData.organization(), ...overrides };
        console.log('Creating test organization:', org.name);
        return org;
    },
};

// Authentication test utilities
export const authTestUtils = {
    mockJwtToken: () => 'mock.jwt.token',

    mockAuthenticatedUser: () => ({
        ...mockData.user(),
        role: 'user',
        organizationId: faker.string.uuid(),
    }),

    mockSession: () => ({
        id: faker.string.uuid(),
        userId: faker.string.uuid(),
        token: 'mock.session.token',
        expiresAt: faker.date.future(),
        createdAt: faker.date.recent(),
    }),

    createMockAuthContext: (user = authTestUtils.mockAuthenticatedUser()) => ({
        user,
        session: authTestUtils.mockSession(),
        isAuthenticated: true,
    }),
};

// Email test utilities
export const emailTestUtils = {
    mockEmailProvider: () => ({
        send: vi.fn().mockResolvedValue({ messageId: faker.string.uuid() }),
        verify: vi.fn().mockResolvedValue(true),
    }),

    mockEmailTemplate: () => ({
        subject: faker.lorem.sentence(),
        html: `<html><body>${faker.lorem.paragraphs(2)}</body></html>`,
        text: faker.lorem.paragraphs(2),
    }),

    captureEmails: () => {
        const emails: any[] = [];
        return {
            emails,
            mockSend: vi.fn().mockImplementation((email) => {
                emails.push(email);
                return Promise.resolve({ messageId: faker.string.uuid() });
            }),
        };
    },
};

// File/Storage test utilities
export const storageTestUtils = {
    mockFile: (overrides = {}) => ({
        originalname: faker.system.fileName(),
        mimetype: 'application/pdf',
        size: faker.number.int({ min: 1024, max: 10485760 }),
        buffer: Buffer.from('mock file content'),
        ...overrides,
    }),

    mockStorageProvider: () => ({
        upload: vi.fn().mockResolvedValue({
            key: faker.string.uuid(),
            url: faker.internet.url(),
        }),
        download: vi.fn().mockResolvedValue(Buffer.from('mock file content')),
        delete: vi.fn().mockResolvedValue(true),
        exists: vi.fn().mockResolvedValue(true),
    }),

    createMockPdfBuffer: () => {
        // Minimal valid PDF structure
        return Buffer.from(`%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
>>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000074 00000 n 
0000000120 00000 n 
trailer
<<
/Size 4
/Root 1 0 R
>>
startxref
178
%%EOF`);
    },
};

// API test utilities
export const apiTestUtils = {
    mockRequest: (overrides = {}) => ({
        method: 'GET',
        url: '/',
        headers: {},
        body: {},
        query: {},
        params: {},
        user: null,
        ...overrides,
    }),

    mockResponse: () => {
        const res = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis(),
            cookie: vi.fn().mockReturnThis(),
            clearCookie: vi.fn().mockReturnThis(),
            redirect: vi.fn().mockReturnThis(),
            header: vi.fn().mockReturnThis(),
        };
        return res;
    },

    mockNext: () => vi.fn(),

    createMockApiContext: () => ({
        req: apiTestUtils.mockRequest(),
        res: apiTestUtils.mockResponse(),
        next: apiTestUtils.mockNext(),
    }),
};

// Validation test utilities
export const validationTestUtils = {
    generateValidEmail: () => faker.internet.email(),
    generateInvalidEmail: () => faker.lorem.word(),

    generateValidPassword: () => faker.internet.password({ length: 12, memorable: false }),
    generateWeakPassword: () => '123',

    generateValidUUID: () => faker.string.uuid(),
    generateInvalidUUID: () => faker.lorem.word(),

    generateValidUrl: () => faker.internet.url(),
    generateInvalidUrl: () => faker.lorem.word(),
};

// Time and date utilities
export const timeTestUtils = {
    mockDate: (date?: Date) => {
        const mockDate = date || new Date('2024-01-01T00:00:00Z');
        vi.useFakeTimers();
        vi.setSystemTime(mockDate);
        return mockDate;
    },

    restoreTime: () => {
        vi.useRealTimers();
    },

    addDays: (date: Date, days: number) => {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    addHours: (date: Date, hours: number) => {
        const result = new Date(date);
        result.setHours(result.getHours() + hours);
        return result;
    },
};

// Property-based testing utilities
export const pbtTestUtils = {
    generateTestCases: <T>(generator: () => T, count = 100): T[] => {
        return Array.from({ length: count }, generator);
    },

    runPropertyTest: <T>(
        generator: () => T,
        predicate: (value: T) => boolean,
        options = { numRuns: 100 }
    ) => {
        for (let i = 0; i < options.numRuns; i++) {
            const value = generator();
            if (!predicate(value)) {
                throw new Error(`Property test failed on iteration ${i + 1} with value: ${JSON.stringify(value)}`);
            }
        }
    },
};

// Performance testing utilities
export const performanceTestUtils = {
    measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> => {
        const start = performance.now();
        const result = await fn();
        const end = performance.now();
        return { result, duration: end - start };
    },

    expectExecutionTime: (duration: number, maxMs: number) => {
        if (duration > maxMs) {
            throw new Error(`Execution took ${duration}ms, expected less than ${maxMs}ms`);
        }
    },
};

// Cleanup utilities
export const cleanupTestUtils = {
    afterEach: () => {
        vi.clearAllMocks();
        vi.clearAllTimers();
    },

    afterAll: () => {
        vi.restoreAllMocks();
        timeTestUtils.restoreTime();
    },
};