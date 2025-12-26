import { describe, test, expect, vi } from 'vitest';
import fc from 'fast-check';

/**
 * Simple tests to validate that our testing infrastructure is working correctly
 */

describe('Testing Infrastructure Validation', () => {
    test('Vitest is working correctly', () => {
        expect(1 + 1).toBe(2);
        expect('hello').toBe('hello');
        expect([1, 2, 3]).toHaveLength(3);
    });

    test('Fast-check property testing is working', () => {
        fc.assert(
            fc.property(fc.integer(), (n) => {
                return n + 0 === n;
            })
        );
    });

    test('Async tests work correctly', async () => {
        const result = await Promise.resolve('async result');
        expect(result).toBe('async result');
    });

    test('Mock functions work correctly', () => {
        const mockFn = vi.fn();
        mockFn('test');
        expect(mockFn).toHaveBeenCalledWith('test');
        expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('Custom matchers work correctly', () => {
        expect('test@example.com').toBeValidEmail();
        expect('550e8400-e29b-41d4-a716-446655440000').toBeValidUUID();
        expect(new Date()).toBeValidDate();
    });

    test('Test utilities are available', () => {
        expect(typeof vi).toBe('object');
        expect(typeof fc).toBe('object');
        expect(typeof expect).toBe('function');
    });

    test('Environment variables are set for testing', () => {
        expect(process.env.NODE_ENV).toBe('test');
        expect(process.env.DATABASE_URL).toBeDefined();
        expect(process.env.JWT_SECRET).toBeDefined();
    });
});