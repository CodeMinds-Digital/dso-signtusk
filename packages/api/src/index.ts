// Core API exports
export { createAPIServer } from './server';
export { apiRouter } from './router';
export { createAPIContext } from './context';

// OpenAPI exports
export { openAPISpec } from './openapi/spec';
export { generateOpenAPISpec } from './openapi/generator';

// Middleware exports
export * from './middleware/auth';
export * from './middleware/cors';
export * from './middleware/rate-limit';
export * from './middleware/validation';
export * from './middleware/error-handler';
export * from './middleware/monitoring';
export * from './middleware/security';
export * from './middleware/cache';

// Error handling exports
export {
    ErrorMonitoringService,
    ErrorRecoveryService
} from './middleware/error-handler';
export type {
    ErrorType,
    APIErrorResponse,
    ErrorContext
} from './middleware/error-handler';

// Error reporting exports
export { errorReportingRouter } from './routes/error-reporting';

// Cache exports
export * from './cache';

// Version exports
export * from './v1';
export { v1Router } from './v1';
export * from './v2';
export { v2Router } from './v2';
export * from './v3';
export { v3Router } from './v3';

// Versioning system exports
export * from './versioning';

// Type exports
export type { APIContext } from './context';
export type { APIRouter } from './router';
export type { OpenAPISpec } from './openapi/spec';