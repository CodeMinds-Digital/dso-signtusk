// Test setup for security package
import { vi } from 'vitest';

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
};

// Mock Date.now for consistent timestamps in tests
const mockNow = 1640995200000; // 2022-01-01T00:00:00.000Z
vi.spyOn(Date, 'now').mockReturnValue(mockNow);

// Mock Math.random for consistent IDs in tests
vi.spyOn(Math, 'random').mockReturnValue(0.123456789);

// Setup test environment
beforeEach(() => {
    vi.clearAllMocks();
});