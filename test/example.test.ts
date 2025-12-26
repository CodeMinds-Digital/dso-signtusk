import { describe, it, expect, vi } from 'vitest';

/**
 * Example unit tests demonstrating the testing infrastructure
 */

describe('Testing Infrastructure Example', () => {
    describe('Basic Test Functionality', () => {
        it('should run basic assertions', () => {
            expect(true).toBe(true);
            expect('hello').toContain('ell');
            expect([1, 2, 3]).toHaveLength(3);
        });

        it('should support async tests', async () => {
            const promise = Promise.resolve('async result');
            await expect(promise).resolves.toBe('async result');
        });

        it('should support custom matchers', () => {
            expect('550e8400-e29b-41d4-a716-446655440000').toBeValidUUID();
            expect('test@example.com').toBeValidEmail();
            expect(new Date()).toBeValidDate();
        });
    });

    describe('Mock Functionality', () => {
        it('should create and use database mocks', async () => {
            // Create inline mock for demonstration
            const mockDb = {
                user: {
                    findUnique: vi.fn(),
                },
            };

            // Configure mock behavior
            mockDb.user.findUnique.mockResolvedValue({
                id: '123',
                email: 'test@example.com',
                name: 'Test User',
            });

            // Test the mock
            const user = await mockDb.user.findUnique({ where: { id: '123' } });

            expect(user).toBeDefined();
            expect(user.email).toBe('test@example.com');
            expect(mockDb.user.findUnique).toHaveBeenCalledWith({ where: { id: '123' } });
        });

        it('should create and use cache mocks', async () => {
            // Create inline cache mock for demonstration
            const cache = new Map();
            const mockCache = {
                get: vi.fn((key: string) => Promise.resolve(cache.get(key))),
                set: vi.fn((key: string, value: any) => {
                    cache.set(key, value);
                    return Promise.resolve();
                }),
            };

            // Test cache operations
            await mockCache.set('key1', 'value1');
            const value = await mockCache.get('key1');

            expect(value).toBe('value1');
            expect(mockCache.set).toHaveBeenCalledWith('key1', 'value1');
            expect(mockCache.get).toHaveBeenCalledWith('key1');
        });
    });

    describe('Error Handling', () => {
        it('should handle thrown errors', async () => {
            const errorFunction = async () => {
                throw new Error('Test error');
            };

            await expect(errorFunction()).rejects.toThrow('Test error');
        });

        it('should test error conditions', () => {
            const mockFn = vi.fn().mockImplementation(() => {
                throw new Error('Mock error');
            });

            expect(() => mockFn()).toThrow('Mock error');
            expect(mockFn).toHaveBeenCalled();
        });
    });

    describe('Timer and Date Mocking', () => {
        it('should mock timers', () => {
            vi.useFakeTimers();

            const callback = vi.fn();
            setTimeout(callback, 1000);

            // Fast-forward time
            vi.advanceTimersByTime(1000);

            expect(callback).toHaveBeenCalled();

            vi.useRealTimers();
        });

        it('should mock dates', () => {
            const mockDate = new Date('2024-01-01T00:00:00Z');
            vi.setSystemTime(mockDate);

            expect(new Date().getFullYear()).toBe(2024);
            expect(new Date().getMonth()).toBe(0); // January

            vi.useRealTimers();
        });
    });

    describe('Spy Functionality', () => {
        it('should spy on object methods', () => {
            const obj = {
                method: (x: number) => x * 2,
            };

            const spy = vi.spyOn(obj, 'method');

            const result = obj.method(5);

            expect(result).toBe(10);
            expect(spy).toHaveBeenCalledWith(5);
            expect(spy).toHaveReturnedWith(10);
        });
    });
});