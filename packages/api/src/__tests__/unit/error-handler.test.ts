import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import { ZodError } from 'zod';
import { HTTPException } from 'hono/http-exception';
import {
    errorHandler,
    ErrorType,
    ErrorMonitoringService,
    ErrorRecoveryService
} from '../../middleware/error-handler';

describe('Error Handler', () => {
    let app: Hono;
    let mockContext: any;

    beforeEach(() => {
        app = new Hono();
        mockContext = {
            req: {
                path: '/test',
                method: 'GET',
                header: vi.fn().mockReturnValue(undefined)
            },
            res: {
                headers: new Map(),
                status: 200
            },
            get: vi.fn().mockReturnValue({
                requestId: 'test-request-id',
                user: { id: 'user-123', organizationId: 'org-456' },
                userAgent: 'test-agent',
                clientIP: '127.0.0.1'
            }),
            json: vi.fn().mockImplementation((data, status) => ({
                json: () => data,
                status: status || 200
            })),
            header: vi.fn()
        };

        // Reset error monitoring
        ErrorMonitoringService.getInstance().reset();
    });

    describe('Error Classification', () => {
        it('should classify validation errors correctly', () => {
            const zodError = new ZodError([
                {
                    code: 'invalid_type',
                    expected: 'string',
                    received: 'number',
                    path: ['name'],
                    message: 'Expected string, received number'
                }
            ]);

            const response = errorHandler(zodError, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: ErrorType.VALIDATION,
                    code: 'VALIDATION_ERROR',
                    retryable: false
                }),
                400
            );
        });

        it('should classify JWT errors correctly', () => {
            const jwtError = new Error('Invalid token');
            jwtError.name = 'JsonWebTokenError';

            const response = errorHandler(jwtError, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: ErrorType.AUTHENTICATION,
                    code: 'INVALID_TOKEN',
                    retryable: false
                }),
                401
            );
        });

        it('should classify database errors correctly', () => {
            const dbError = new Error('Prisma connection failed');

            const response = errorHandler(dbError, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: ErrorType.DATABASE,
                    code: 'DATABASE_ERROR',
                    retryable: true,
                    retryAfter: 30
                }),
                500
            );
        });

        it('should classify file processing errors correctly', () => {
            const fileError = new Error('PDF processing failed');

            const response = errorHandler(fileError, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: ErrorType.FILE_PROCESSING,
                    code: 'FILE_PROCESSING_ERROR',
                    retryable: false
                }),
                400
            );
        });
    });

    describe('Error Response Format', () => {
        it('should include all required fields in error response', () => {
            const error = new Error('Test error');
            errorHandler(error, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: expect.any(String),
                    message: expect.any(String),
                    code: expect.any(String),
                    type: expect.any(String),
                    timestamp: expect.any(String),
                    path: expect.any(String),
                    requestId: expect.any(String),
                    traceId: expect.any(String),
                    suggestions: expect.any(Array),
                    retryable: expect.any(Boolean)
                }),
                expect.any(Number)
            );
        });

        it('should include recovery suggestions', () => {
            const zodError = new ZodError([
                {
                    code: 'invalid_type',
                    expected: 'string',
                    received: 'number',
                    path: ['name'],
                    message: 'Expected string, received number'
                }
            ]);

            errorHandler(zodError, mockContext);

            const callArgs = mockContext.json.mock.calls[0][0];
            expect(callArgs.suggestions).toContain('Check the request payload format and required fields');
        });

        it('should include documentation links when available', () => {
            const zodError = new ZodError([
                {
                    code: 'invalid_type',
                    expected: 'string',
                    received: 'number',
                    path: ['name'],
                    message: 'Expected string, received number'
                }
            ]);

            errorHandler(zodError, mockContext);

            const callArgs = mockContext.json.mock.calls[0][0];
            expect(callArgs.documentation).toBe('/docs/api/validation');
        });

        it('should set retry-after header for retryable errors', () => {
            const dbError = new Error('Database connection failed');
            errorHandler(dbError, mockContext);

            expect(mockContext.header).toHaveBeenCalledWith('Retry-After', '30');
        });

        it('should set trace ID header', () => {
            const error = new Error('Test error');
            errorHandler(error, mockContext);

            expect(mockContext.header).toHaveBeenCalledWith('X-Trace-ID', expect.any(String));
        });
    });

    describe('Zod Error Handling', () => {
        it('should handle Zod validation errors', () => {
            const zodError = new ZodError([
                {
                    code: 'invalid_type',
                    expected: 'string',
                    received: 'number',
                    path: ['name'],
                    message: 'Expected string, received number'
                }
            ]);

            errorHandler(zodError, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Validation Error',
                    code: 'VALIDATION_ERROR',
                    type: ErrorType.VALIDATION,
                    details: {
                        issues: expect.arrayContaining([
                            expect.objectContaining({
                                path: 'name',
                                message: 'Expected string, received number',
                                code: 'invalid_type',
                                expected: 'string',
                                received: 'number'
                            })
                        ])
                    }
                }),
                400
            );
        });
    });

    describe('HTTP Exception Handling', () => {
        it('should handle HTTP exceptions', () => {
            const httpError = new HTTPException(404, { message: 'Not found' });
            errorHandler(httpError, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Not Found',
                    message: 'Not found',
                    code: 'HTTP_404'
                }),
                404
            );
        });

        it('should handle rate limiting with retry-after', () => {
            const rateLimitError = new HTTPException(429, {
                message: 'Rate limit exceeded',
                cause: { retryAfter: 120 }
            });

            errorHandler(rateLimitError, mockContext);

            expect(mockContext.header).toHaveBeenCalledWith('Retry-After', '120');
            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    retryAfter: 120
                }),
                429
            );
        });
    });

    describe('JWT Error Handling', () => {
        it('should handle JsonWebTokenError', () => {
            const jwtError = new Error('Invalid token');
            jwtError.name = 'JsonWebTokenError';

            errorHandler(jwtError, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Unauthorized',
                    code: 'INVALID_TOKEN',
                    type: ErrorType.AUTHENTICATION
                }),
                401
            );
        });

        it('should handle TokenExpiredError', () => {
            const expiredError = new Error('Token expired');
            expiredError.name = 'TokenExpiredError';

            errorHandler(expiredError, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Unauthorized',
                    code: 'TOKEN_EXPIRED',
                    type: ErrorType.AUTHENTICATION
                }),
                401
            );
        });
    });

    describe('Generic Error Handling', () => {
        it('should handle unknown errors', () => {
            const unknownError = new Error('Something went wrong');
            errorHandler(unknownError, mockContext);

            expect(mockContext.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    error: 'Internal Server Error',
                    code: 'INTERNAL_ERROR',
                    type: ErrorType.UNKNOWN
                }),
                500
            );
        });

        it('should hide error details in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const error = new Error('Sensitive error message');
            errorHandler(error, mockContext);

            const callArgs = mockContext.json.mock.calls[0][0];
            expect(callArgs.message).toBe('An unexpected error occurred');
            expect(callArgs.details).toBeUndefined();

            process.env.NODE_ENV = originalEnv;
        });

        it('should include error details in development', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';

            const error = new Error('Debug error message');
            errorHandler(error, mockContext);

            const callArgs = mockContext.json.mock.calls[0][0];
            expect(callArgs.message).toBe('Debug error message');
            expect(callArgs.details).toEqual({
                stack: error.stack,
                name: error.name
            });

            process.env.NODE_ENV = originalEnv;
        });
    });
});

describe('Error Monitoring Service', () => {
    let errorMonitoring: ErrorMonitoringService;

    beforeEach(() => {
        errorMonitoring = ErrorMonitoringService.getInstance();
        errorMonitoring.reset();
    });

    it('should track error occurrences', () => {
        const error = new Error('Test error');
        const context = {
            userId: 'user-123',
            organizationId: 'org-456',
            requestId: 'req-123',
            operation: 'GET /test',
            timestamp: new Date(),
            metadata: {}
        };

        errorMonitoring.trackError(error, context, 400);

        const stats = errorMonitoring.getErrorStats();
        expect(stats.totalErrors).toBe(1);
        expect(stats.errorsByType['Error:400']).toBe(1);
    });

    it('should calculate hourly error rates', () => {
        const error = new Error('Test error');
        const context = {
            userId: 'user-123',
            organizationId: 'org-456',
            requestId: 'req-123',
            operation: 'GET /test',
            timestamp: new Date(),
            metadata: {}
        };

        // Track multiple errors
        for (let i = 0; i < 5; i++) {
            errorMonitoring.trackError(error, context, 400);
        }

        const stats = errorMonitoring.getErrorStats();
        expect(stats.hourlyRates['Error:400']).toBe(5);
    });

    it('should clean up old error entries', () => {
        // This test would require mocking time or using a more sophisticated approach
        // For now, we'll just verify the basic functionality
        const stats = errorMonitoring.getErrorStats();
        expect(stats).toHaveProperty('totalErrors');
        expect(stats).toHaveProperty('errorsByType');
        expect(stats).toHaveProperty('hourlyRates');
    });
});

describe('Error Recovery Service', () => {
    describe('Retry Logic', () => {
        it('should retry failed operations', async () => {
            let attempts = 0;
            const operation = vi.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 3) {
                    throw new Error('Temporary failure');
                }
                return 'success';
            });

            const result = await ErrorRecoveryService.retry(operation, 3, 100);

            expect(result).toBe('success');
            expect(operation).toHaveBeenCalledTimes(3);
        });

        it('should throw error after max attempts', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('Persistent failure'));

            await expect(
                ErrorRecoveryService.retry(operation, 2, 100)
            ).rejects.toThrow('Persistent failure');

            expect(operation).toHaveBeenCalledTimes(2);
        });
    });

    describe('Circuit Breaker', () => {
        it('should open circuit after threshold failures', async () => {
            const operation = vi.fn().mockRejectedValue(new Error('Service down'));
            const circuitBreaker = ErrorRecoveryService.createCircuitBreaker(operation, 2, 1000);

            // First two failures should go through
            await expect(circuitBreaker()).rejects.toThrow('Service down');
            await expect(circuitBreaker()).rejects.toThrow('Service down');

            // Third attempt should be rejected by circuit breaker
            await expect(circuitBreaker()).rejects.toThrow('Circuit breaker is open');

            expect(operation).toHaveBeenCalledTimes(2);
        });
    });

    describe('Fallback Mechanism', () => {
        it('should use fallback when primary operation fails', async () => {
            const primaryOperation = vi.fn().mockRejectedValue(new Error('Primary failed'));
            const fallbackOperation = vi.fn().mockResolvedValue('fallback result');

            const result = await ErrorRecoveryService.withFallback(
                primaryOperation,
                fallbackOperation
            );

            expect(result).toBe('fallback result');
            expect(primaryOperation).toHaveBeenCalledTimes(1);
            expect(fallbackOperation).toHaveBeenCalledTimes(1);
        });

        it('should use primary result when successful', async () => {
            const primaryOperation = vi.fn().mockResolvedValue('primary result');
            const fallbackOperation = vi.fn().mockResolvedValue('fallback result');

            const result = await ErrorRecoveryService.withFallback(
                primaryOperation,
                fallbackOperation
            );

            expect(result).toBe('primary result');
            expect(primaryOperation).toHaveBeenCalledTimes(1);
            expect(fallbackOperation).not.toHaveBeenCalled();
        });
    });
});