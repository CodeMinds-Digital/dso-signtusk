import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

/**
 * Comprehensive error classification system
 */
export enum ErrorType {
    VALIDATION = 'validation',
    AUTHENTICATION = 'authentication',
    AUTHORIZATION = 'authorization',
    NETWORK = 'network',
    DATABASE = 'database',
    FILE_PROCESSING = 'file_processing',
    PDF_PROCESSING = 'pdf_processing',
    CRYPTOGRAPHIC = 'cryptographic',
    INTEGRATION = 'integration',
    RATE_LIMIT = 'rate_limit',
    SYSTEM = 'system',
    UNKNOWN = 'unknown'
}

/**
 * Standardized API Error response interface
 */
export interface APIErrorResponse {
    error: string;
    message: string;
    code: string;
    type: ErrorType;
    details?: any;
    timestamp: string;
    path: string;
    requestId?: string;
    traceId?: string;
    suggestions?: string[];
    documentation?: string;
    retryable?: boolean;
    retryAfter?: number;
}

/**
 * Error context for logging and monitoring
 */
export interface ErrorContext {
    userId?: string;
    organizationId?: string;
    requestId: string;
    operation: string;
    timestamp: Date;
    metadata: Record<string, any>;
    userAgent?: string;
    ipAddress?: string;
}

/**
 * Error recovery suggestions mapping
 */
const ERROR_RECOVERY_SUGGESTIONS: Record<string, string[]> = {
    'VALIDATION_ERROR': [
        'Check the request payload format and required fields',
        'Ensure all field types match the expected schema',
        'Review the API documentation for correct parameter formats'
    ],
    'UNAUTHORIZED': [
        'Verify your authentication token is valid and not expired',
        'Check if you are using the correct API key',
        'Ensure proper authentication headers are included'
    ],
    'FORBIDDEN': [
        'Verify you have the required permissions for this operation',
        'Contact your organization administrator to request access',
        'Check if your account has the necessary subscription level'
    ],
    'NOT_FOUND': [
        'Verify the resource ID exists and is accessible',
        'Check if the resource has been deleted or moved',
        'Ensure you have permission to access this resource'
    ],
    'RATE_LIMIT_EXCEEDED': [
        'Wait before making additional requests',
        'Implement exponential backoff in your retry logic',
        'Consider upgrading your plan for higher rate limits'
    ],
    'FILE_PROCESSING_ERROR': [
        'Ensure the file format is supported',
        'Check that the file is not corrupted',
        'Verify the file size is within limits'
    ],
    'DATABASE_ERROR': [
        'Try the request again after a short delay',
        'Contact support if the issue persists',
        'Check system status page for ongoing issues'
    ]
};

/**
 * Documentation links for different error types
 */
const ERROR_DOCUMENTATION: Record<string, string> = {
    'VALIDATION_ERROR': '/docs/api/validation',
    'UNAUTHORIZED': '/docs/api/authentication',
    'FORBIDDEN': '/docs/api/authorization',
    'RATE_LIMIT_EXCEEDED': '/docs/api/rate-limits',
    'FILE_PROCESSING_ERROR': '/docs/api/file-upload',
    'PDF_PROCESSING_ERROR': '/docs/api/pdf-processing'
};

/**
 * Classify error type based on error instance and message
 */
function classifyError(err: Error): ErrorType {
    if (err instanceof ZodError) {
        return ErrorType.VALIDATION;
    }
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return ErrorType.AUTHENTICATION;
    }
    if (err.message.includes('Prisma') || err.message.includes('database')) {
        return ErrorType.DATABASE;
    }
    if (err.message.includes('PDF') || err.message.includes('file')) {
        return ErrorType.FILE_PROCESSING;
    }
    if (err.message.includes('signature') || err.message.includes('certificate')) {
        return ErrorType.PDF_PROCESSING;
    }
    if (err.message.includes('crypto') || err.message.includes('encryption') || err.message.includes('key')) {
        return ErrorType.CRYPTOGRAPHIC;
    }
    if (err.message.includes('external') || err.message.includes('integration')) {
        return ErrorType.INTEGRATION;
    }
    if (err.message.includes('timeout') || err.message.includes('ECONNRESET')) {
        return ErrorType.NETWORK;
    }
    return ErrorType.UNKNOWN;
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(errorType: ErrorType, statusCode: number): boolean {
    const retryableTypes = [
        ErrorType.NETWORK,
        ErrorType.DATABASE,
        ErrorType.SYSTEM,
        ErrorType.INTEGRATION
    ];

    const retryableStatusCodes = [429, 500, 502, 503, 504];

    return retryableTypes.includes(errorType) || retryableStatusCodes.includes(statusCode);
}

/**
 * Get retry-after value for rate limiting and server errors
 */
function getRetryAfter(errorType: ErrorType): number | undefined {
    if (errorType === ErrorType.RATE_LIMIT) {
        return 60; // Default 60 seconds for rate limiting
    }

    if (errorType === ErrorType.NETWORK || errorType === ErrorType.SYSTEM) {
        return 30; // Default 30 seconds for system errors
    }

    return undefined;
}

/**
 * Get error name from HTTP status code
 */
function getErrorName(status: number): string {
    const errorNames: Record<number, string> = {
        400: 'Bad Request',
        401: 'Unauthorized',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        409: 'Conflict',
        422: 'Unprocessable Entity',
        429: 'Too Many Requests',
        500: 'Internal Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout'
    };

    return errorNames[status] || 'Unknown Error';
}

/**
 * Enhanced global error handler for API routes with comprehensive error classification,
 * logging, monitoring, and client-friendly error messages with recovery suggestions
 */
export function errorHandler(err: Error, c: Context): Response {
    const apiContext = c.get('apiContext');
    const timestamp = new Date().toISOString();
    const path = c.req.path;
    const requestId = apiContext?.requestId || crypto.randomUUID();
    const traceId = c.req.header('X-Trace-ID') || `trace_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Classify the error type
    const errorType = classifyError(err);

    // Create error context for logging
    const errorContext: ErrorContext = {
        userId: apiContext?.user?.id,
        organizationId: apiContext?.organizationId,
        requestId,
        operation: `${c.req.method} ${path}`,
        timestamp: new Date(),
        metadata: {
            userAgent: apiContext?.userAgent,
            ipAddress: apiContext?.clientIP,
            errorType,
            traceId
        },
        userAgent: apiContext?.userAgent,
        ipAddress: apiContext?.clientIP
    };

    // Log error with comprehensive context
    console.error('API Error:', {
        error: err.message,
        stack: err.stack,
        context: errorContext,
        timestamp
    });

    // Track error for monitoring
    const errorMonitoring = ErrorMonitoringService.getInstance();
    errorMonitoring.trackError(err, errorContext, 500); // Default status, will be updated below

    // Handle HTTP exceptions
    if (err instanceof HTTPException) {
        const retryable = isRetryableError(errorType, err.status);
        const retryAfter = getRetryAfter(errorType);

        const errorResponse: APIErrorResponse = {
            error: getErrorName(err.status),
            message: err.message,
            code: `HTTP_${err.status}`,
            type: errorType,
            timestamp,
            path,
            requestId,
            traceId,
            suggestions: ERROR_RECOVERY_SUGGESTIONS[`HTTP_${err.status}`] || [],
            documentation: ERROR_DOCUMENTATION[`HTTP_${err.status}`],
            retryable,
            retryAfter
        };

        // Add retry-after header for rate limiting
        if (err.status === 429 && (err as any).cause && typeof (err as any).cause === 'object' && 'retryAfter' in (err as any).cause) {
            c.header('Retry-After', String((err as any).cause.retryAfter));
            errorResponse.retryAfter = (err as any).cause.retryAfter as number;
        } else if (retryAfter) {
            c.header('Retry-After', String(retryAfter));
        }

        c.header('X-Trace-ID', traceId);
        errorMonitoring.trackError(err, errorContext, err.status);
        return c.json(errorResponse, err.status);
    }

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const errorResponse: APIErrorResponse = {
            error: 'Validation Error',
            message: 'Request validation failed',
            code: 'VALIDATION_ERROR',
            type: ErrorType.VALIDATION,
            details: {
                issues: err.issues.map(issue => ({
                    path: issue.path.join('.'),
                    message: issue.message,
                    code: issue.code,
                    ...(('expected' in issue) && { expected: issue.expected }),
                    ...(('received' in issue) && { received: issue.received })
                }))
            },
            timestamp,
            path,
            requestId,
            traceId,
            suggestions: ERROR_RECOVERY_SUGGESTIONS['VALIDATION_ERROR'],
            documentation: ERROR_DOCUMENTATION['VALIDATION_ERROR'],
            retryable: false
        };

        c.header('X-Trace-ID', traceId);
        errorMonitoring.trackError(err, errorContext, 400);
        return c.json(errorResponse, 400);
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        const errorResponse: APIErrorResponse = {
            error: 'Unauthorized',
            message: 'Invalid authentication token',
            code: 'INVALID_TOKEN',
            type: ErrorType.AUTHENTICATION,
            timestamp,
            path,
            requestId,
            traceId,
            suggestions: ERROR_RECOVERY_SUGGESTIONS['UNAUTHORIZED'],
            documentation: ERROR_DOCUMENTATION['UNAUTHORIZED'],
            retryable: false
        };

        c.header('X-Trace-ID', traceId);
        errorMonitoring.trackError(err, errorContext, 401);
        return c.json(errorResponse, 401);
    }

    if (err.name === 'TokenExpiredError') {
        const errorResponse: APIErrorResponse = {
            error: 'Unauthorized',
            message: 'Authentication token has expired',
            code: 'TOKEN_EXPIRED',
            type: ErrorType.AUTHENTICATION,
            timestamp,
            path,
            requestId,
            traceId,
            suggestions: ERROR_RECOVERY_SUGGESTIONS['UNAUTHORIZED'],
            documentation: ERROR_DOCUMENTATION['UNAUTHORIZED'],
            retryable: false
        };

        c.header('X-Trace-ID', traceId);
        errorMonitoring.trackError(err, errorContext, 401);
        return c.json(errorResponse, 401);
    }

    // Handle database errors
    if (err.message.includes('Prisma') || err.message.includes('database')) {
        const errorResponse: APIErrorResponse = {
            error: 'Internal Server Error',
            message: 'Database operation failed',
            code: 'DATABASE_ERROR',
            type: ErrorType.DATABASE,
            timestamp,
            path,
            requestId,
            traceId,
            suggestions: ERROR_RECOVERY_SUGGESTIONS['DATABASE_ERROR'],
            retryable: true,
            retryAfter: 30
        };

        c.header('Retry-After', '30');
        c.header('X-Trace-ID', traceId);
        errorMonitoring.trackError(err, errorContext, 500);
        return c.json(errorResponse, 500);
    }

    // Handle file processing errors
    if (err.message.includes('PDF') || err.message.includes('file')) {
        const errorResponse: APIErrorResponse = {
            error: 'Bad Request',
            message: 'File processing failed',
            code: 'FILE_PROCESSING_ERROR',
            type: ErrorType.FILE_PROCESSING,
            details: {
                originalError: process.env.NODE_ENV === 'production' ? undefined : err.message
            },
            timestamp,
            path,
            requestId,
            traceId,
            suggestions: ERROR_RECOVERY_SUGGESTIONS['FILE_PROCESSING_ERROR'],
            documentation: ERROR_DOCUMENTATION['FILE_PROCESSING_ERROR'],
            retryable: false
        };

        c.header('X-Trace-ID', traceId);
        errorMonitoring.trackError(err, errorContext, 400);
        return c.json(errorResponse, 400);
    }

    // Handle network/timeout errors
    if (err.message.includes('timeout') || err.message.includes('ECONNRESET') || err.message.includes('ENOTFOUND')) {
        const errorResponse: APIErrorResponse = {
            error: 'Service Unavailable',
            message: 'Network operation failed',
            code: 'NETWORK_ERROR',
            type: ErrorType.NETWORK,
            timestamp,
            path,
            requestId,
            traceId,
            suggestions: [
                'Try the request again after a short delay',
                'Check your network connection',
                'Contact support if the issue persists'
            ],
            retryable: true,
            retryAfter: 30
        };

        c.header('Retry-After', '30');
        c.header('X-Trace-ID', traceId);
        errorMonitoring.trackError(err, errorContext, 503);
        return c.json(errorResponse, 503);
    }

    // Generic server error
    const statusCode = 500;
    const retryable = isRetryableError(errorType, statusCode);
    const retryAfter = getRetryAfter(errorType);

    const errorResponse: APIErrorResponse = {
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred'
            : err.message,
        code: 'INTERNAL_ERROR',
        type: errorType,
        timestamp,
        path,
        requestId,
        traceId,
        suggestions: [
            'Try the request again after a short delay',
            'Contact support if the issue persists',
            'Check the system status page for ongoing issues'
        ],
        retryable,
        retryAfter
    };

    // Include stack trace in development
    if (process.env.NODE_ENV !== 'production') {
        errorResponse.details = {
            stack: err.stack,
            name: err.name
        };
    }

    if (retryAfter) {
        c.header('Retry-After', String(retryAfter));
    }

    c.header('X-Trace-ID', traceId);
    errorMonitoring.trackError(err, errorContext, statusCode);
    return c.json(errorResponse, statusCode);
}

/**
 * Error monitoring and alerting service
 */
export class ErrorMonitoringService {
    private static instance: ErrorMonitoringService;
    private errorCounts: Map<string, number> = new Map();
    private errorRates: Map<string, { count: number; timestamp: number }[]> = new Map();
    private alertThresholds = {
        errorRate: 0.05, // 5% error rate threshold
        errorCount: 100, // 100 errors per hour threshold
        criticalErrorCount: 10 // 10 critical errors per hour threshold
    };

    static getInstance(): ErrorMonitoringService {
        if (!ErrorMonitoringService.instance) {
            ErrorMonitoringService.instance = new ErrorMonitoringService();
        }
        return ErrorMonitoringService.instance;
    }

    /**
     * Track error occurrence for monitoring
     */
    trackError(error: Error, context: ErrorContext, statusCode: number) {
        const errorKey = `${error.constructor.name}:${statusCode}`;
        const now = Date.now();

        // Update error counts
        this.errorCounts.set(errorKey, (this.errorCounts.get(errorKey) || 0) + 1);

        // Update error rates (sliding window of 1 hour)
        if (!this.errorRates.has(errorKey)) {
            this.errorRates.set(errorKey, []);
        }

        const rates = this.errorRates.get(errorKey)!;
        rates.push({ count: 1, timestamp: now });

        // Clean up old entries (older than 1 hour)
        const oneHourAgo = now - (60 * 60 * 1000);
        this.errorRates.set(errorKey, rates.filter(r => r.timestamp > oneHourAgo));

        // Check for alert conditions
        this.checkAlertConditions(errorKey, statusCode, context);
    }

    /**
     * Check if error conditions warrant alerts
     */
    private checkAlertConditions(errorKey: string, statusCode: number, context: ErrorContext) {
        const rates = this.errorRates.get(errorKey) || [];
        const hourlyCount = rates.length;

        // Critical error alert (5xx errors)
        if (statusCode >= 500 && hourlyCount >= this.alertThresholds.criticalErrorCount) {
            this.sendAlert({
                type: 'critical_error_threshold',
                message: `Critical error threshold exceeded: ${errorKey} occurred ${hourlyCount} times in the last hour`,
                severity: 'critical',
                context,
                metadata: { errorKey, count: hourlyCount, statusCode }
            });
        }

        // High error count alert
        if (hourlyCount >= this.alertThresholds.errorCount) {
            this.sendAlert({
                type: 'high_error_count',
                message: `High error count: ${errorKey} occurred ${hourlyCount} times in the last hour`,
                severity: 'warning',
                context,
                metadata: { errorKey, count: hourlyCount, statusCode }
            });
        }
    }

    /**
     * Send alert (in production, this would integrate with alerting systems like PagerDuty, Slack, etc.)
     */
    private sendAlert(alert: {
        type: string;
        message: string;
        severity: 'warning' | 'critical';
        context: ErrorContext;
        metadata: Record<string, any>;
    }) {
        // Log alert for now (in production, send to alerting system)
        console.error('🚨 ERROR ALERT:', {
            ...alert,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Get error statistics
     */
    getErrorStats() {
        const stats = {
            totalErrors: Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0),
            errorsByType: Object.fromEntries(this.errorCounts),
            hourlyRates: {} as Record<string, number>
        };

        // Calculate hourly rates
        for (const [errorKey, rates] of this.errorRates.entries()) {
            stats.hourlyRates[errorKey] = rates.length;
        }

        return stats;
    }

    /**
     * Reset error statistics (useful for testing)
     */
    reset() {
        this.errorCounts.clear();
        this.errorRates.clear();
    }
}

/**
 * Error recovery mechanisms
 */
export class ErrorRecoveryService {
    /**
     * Implement retry logic with exponential backoff
     */
    static async retry<T>(
        operation: () => Promise<T>,
        maxAttempts: number = 3,
        baseDelayMs: number = 1000
    ): Promise<T> {
        let lastError: Error;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;

                if (attempt === maxAttempts) {
                    throw lastError;
                }

                // Exponential backoff with jitter
                const delay = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw lastError!;
    }

    /**
     * Implement circuit breaker pattern
     */
    static createCircuitBreaker<T>(
        operation: () => Promise<T>,
        threshold: number = 5,
        timeoutMs: number = 60000
    ) {
        let failureCount = 0;
        let lastFailureTime = 0;
        let state: 'closed' | 'open' | 'half-open' = 'closed';

        return async (): Promise<T> => {
            const now = Date.now();

            // Check if circuit should be half-open
            if (state === 'open' && now - lastFailureTime > timeoutMs) {
                state = 'half-open';
            }

            // Reject if circuit is open
            if (state === 'open') {
                throw new Error('Circuit breaker is open');
            }

            try {
                const result = await operation();

                // Reset on success
                if (state === 'half-open') {
                    state = 'closed';
                    failureCount = 0;
                }

                return result;
            } catch (error) {
                failureCount++;
                lastFailureTime = now;

                // Open circuit if threshold exceeded
                if (failureCount >= threshold) {
                    state = 'open';
                }

                throw error;
            }
        };
    }

    /**
     * Implement fallback mechanism
     */
    static async withFallback<T>(
        primaryOperation: () => Promise<T>,
        fallbackOperation: () => Promise<T>
    ): Promise<T> {
        try {
            return await primaryOperation();
        } catch (error) {
            console.warn('Primary operation failed, using fallback:', (error as Error).message);
            return await fallbackOperation();
        }
    }
}