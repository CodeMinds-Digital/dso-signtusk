/**
 * Error classes for the Signtusk SDK
 */

export class DocuSignAlternativeError extends Error {
    public readonly code: string;
    public readonly status?: number;
    public readonly requestId?: string;
    public readonly details?: any;

    constructor(
        message: string,
        code: string,
        status?: number,
        requestId?: string,
        details?: any
    ) {
        super(message);
        this.name = 'DocuSignAlternativeError';
        this.code = code;
        this.status = status;
        this.requestId = requestId;
        this.details = details;

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, DocuSignAlternativeError);
        }
    }
}

export class AuthenticationError extends DocuSignAlternativeError {
    constructor(message: string = 'Authentication failed', requestId?: string) {
        super(message, 'AUTHENTICATION_ERROR', 401, requestId);
        this.name = 'AuthenticationError';
    }
}

export class AuthorizationError extends DocuSignAlternativeError {
    constructor(message: string = 'Insufficient permissions', requestId?: string) {
        super(message, 'AUTHORIZATION_ERROR', 403, requestId);
        this.name = 'AuthorizationError';
    }
}

export class ValidationError extends DocuSignAlternativeError {
    constructor(message: string, details?: any, requestId?: string) {
        super(message, 'VALIDATION_ERROR', 400, requestId, details);
        this.name = 'ValidationError';
    }
}

export class NotFoundError extends DocuSignAlternativeError {
    constructor(resource: string, id?: string, requestId?: string) {
        const message = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
        super(message, 'NOT_FOUND_ERROR', 404, requestId);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends DocuSignAlternativeError {
    constructor(message: string, requestId?: string) {
        super(message, 'CONFLICT_ERROR', 409, requestId);
        this.name = 'ConflictError';
    }
}

export class RateLimitError extends DocuSignAlternativeError {
    public readonly retryAfter?: number;

    constructor(message: string = 'Rate limit exceeded', retryAfter?: number, requestId?: string) {
        super(message, 'RATE_LIMIT_ERROR', 429, requestId);
        this.name = 'RateLimitError';
        this.retryAfter = retryAfter;
    }
}

export class ServerError extends DocuSignAlternativeError {
    constructor(message: string = 'Internal server error', status: number = 500, requestId?: string) {
        super(message, 'SERVER_ERROR', status, requestId);
        this.name = 'ServerError';
    }
}

export class NetworkError extends DocuSignAlternativeError {
    constructor(message: string = 'Network error occurred', originalError?: Error) {
        super(message, 'NETWORK_ERROR', undefined, undefined, originalError);
        this.name = 'NetworkError';
    }
}

export class TimeoutError extends DocuSignAlternativeError {
    constructor(message: string = 'Request timeout', requestId?: string) {
        super(message, 'TIMEOUT_ERROR', 408, requestId);
        this.name = 'TimeoutError';
    }
}

export class ConfigurationError extends DocuSignAlternativeError {
    constructor(message: string) {
        super(message, 'CONFIGURATION_ERROR');
        this.name = 'ConfigurationError';
    }
}

export class WebhookVerificationError extends DocuSignAlternativeError {
    constructor(message: string = 'Webhook signature verification failed') {
        super(message, 'WEBHOOK_VERIFICATION_ERROR');
        this.name = 'WebhookVerificationError';
    }
}

/**
 * Factory function to create appropriate error instances based on HTTP response
 */
export function createErrorFromResponse(
    status: number,
    data: any,
    requestId?: string
): DocuSignAlternativeError {
    const message = data?.message || data?.error || 'Unknown error occurred';
    const code = data?.code;
    const details = data?.details;

    switch (status) {
        case 400:
            return new ValidationError(message, details, requestId);
        case 401:
            return new AuthenticationError(message, requestId);
        case 403:
            return new AuthorizationError(message, requestId);
        case 404:
            return new NotFoundError(message, undefined, requestId);
        case 409:
            return new ConflictError(message, requestId);
        case 429:
            return new RateLimitError(message, data?.retryAfter, requestId);
        case 408:
            return new TimeoutError(message, requestId);
        default:
            if (status >= 500) {
                return new ServerError(message, status, requestId);
            }
            return new DocuSignAlternativeError(message, code || 'UNKNOWN_ERROR', status, requestId, details);
    }
}

/**
 * Type guard to check if an error is a Signtusk error
 */
export function isDocuSignAlternativeError(error: any): error is DocuSignAlternativeError {
    return error instanceof DocuSignAlternativeError;
}

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
    if (!isDocuSignAlternativeError(error)) {
        return false;
    }

    // Retry on network errors, timeouts, and server errors (5xx)
    return (
        error instanceof NetworkError ||
        error instanceof TimeoutError ||
        (error instanceof ServerError && error.status !== undefined && error.status >= 500) ||
        error instanceof RateLimitError
    );
}