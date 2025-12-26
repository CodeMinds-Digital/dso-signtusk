import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Mock Stripe for testing
const mockStripe = {
    customers: {
        create: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
        search: vi.fn(),
    },
    products: {
        create: vi.fn(),
    },
    prices: {
        create: vi.fn(),
    },
    subscriptions: {
        create: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
        cancel: vi.fn(),
        list: vi.fn(),
    },
    subscriptionItems: {
        createUsageRecord: vi.fn(),
        listUsageRecordSummaries: vi.fn(),
    },
    paymentMethods: {
        attach: vi.fn(),
        detach: vi.fn(),
        list: vi.fn(),
    },
    invoices: {
        create: vi.fn(),
        finalizeInvoice: vi.fn(),
        pay: vi.fn(),
        list: vi.fn(),
    },
    invoiceItems: {
        create: vi.fn(),
    },
    setupIntents: {
        create: vi.fn(),
    },
    webhooks: {
        constructEvent: vi.fn(),
    },
};

// Mock the Stripe module
vi.mock('stripe', () => {
    return {
        default: vi.fn(() => mockStripe),
    };
});

// Mock database
const mockDb = {
    organization: {
        findUnique: vi.fn(),
    },
    user: {
        findFirst: vi.fn(),
    },
    subscription: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        upsert: vi.fn(),
    },
    usageRecord: {
        create: vi.fn(),
        findMany: vi.fn(),
        aggregate: vi.fn(),
    },
};

beforeAll(() => {
    // Global test setup
});

afterAll(() => {
    // Global test cleanup
});

beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
});

afterEach(() => {
    // Cleanup after each test
});

export { mockStripe, mockDb };