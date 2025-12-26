# @signtusk/security

Comprehensive OWASP-compliant security middleware package for the Signtusk platform.

## Features

- **Security Headers**: OWASP-compliant security headers with CSP, HSTS, and other protective headers
- **CORS Policy**: Configurable CORS enforcement with origin validation
- **Rate Limiting**: Redis-backed token bucket algorithm for distributed rate limiting
- **Input Validation**: Zod-based validation and sanitization with XSS/SQL injection prevention
- **Audit Logging**: Comprehensive security event logging with configurable storage

## Quick Start

```typescript
import { Hono } from 'hono';
import { createSecurityMiddleware, SecurityConfigBuilder } from '@signtusk/security';

const app = new Hono();

// Create security middleware with default configuration
const securityMiddleware = createSecurityMiddleware();
app.use(securityMiddleware);

// Or use the configuration builder for custom settings
const customSecurity = createSecurityMiddleware(
  new SecurityConfigBuilder()
    .production(['https://yourdomain.com'])
    .rateLimitPerMinute(100)
    .maxBodySize(5 * 1024 * 1024) // 5MB
    .auditToDatabase()
    .build()
);

app.use(customSecurity);
```

## Configuration

### Environment Presets

```typescript
import { SecurityConfigBuilder } from '@signtusk/security';

// Development environment
const devConfig = new SecurityConfigBuilder()
  .development()
  .build();

// Production environment
const prodConfig = new SecurityConfigBuilder()
  .production(['https://yourdomain.com', 'https://api.yourdomain.com'])
  .build();

// Testing environment
const testConfig = new SecurityConfigBuilder()
  .testing()
  .build();
```

### Individual Middleware Components

```typescript
import {
  createSecurityHeadersMiddleware,
  createCorsMiddleware,
  createRateLimitMiddleware,
  createValidationMiddleware,
  createAuditMiddleware
} from '@signtusk/security';

// Use individual components
app.use(createSecurityHeadersMiddleware());
app.use(createCorsMiddleware({ origin: ['https://yourdomain.com'] }));
app.use(createRateLimitMiddleware({ windowMs: 60000, maxRequests: 100 }));
app.use(createValidationMiddleware({ maxBodySize: 1024 * 1024 }));
app.use(createAuditMiddleware({ enabled: true }));
```

## Security Headers

### Content Security Policy Builder

```typescript
import { CSPBuilder } from '@signtusk/security';

const csp = new CSPBuilder()
  .directive('default-src', ["'self'"])
  .directive('script-src', ["'self'", "'unsafe-inline'"])
  .directive('style-src', ["'self'", "'unsafe-inline'"])
  .allowInlineScripts()
  .upgradeInsecureRequests()
  .build();
```

## Input Sanitization

```typescript
import { InputSanitizer, CommonSchemas } from '@signtusk/security';

// Sanitize user input
const safeString = InputSanitizer.sanitizeString(userInput);
const safeHtml = InputSanitizer.sanitizeHtml(htmlContent);
const safeSql = InputSanitizer.sanitizeSql(sqlInput);

// Validate with schemas
const emailResult = CommonSchemas.email.safeParse(email);
const passwordResult = CommonSchemas.password.safeParse(password);
```

## Rate Limiting

```typescript
import { RateLimitConfigBuilder } from '@signtusk/security';

const rateLimitConfig = new RateLimitConfigBuilder()
  .perMinute(100)
  .keyGenerator((c) => `user:${c.get('userId')}`)
  .useRedis({ host: 'localhost', port: 6379 })
  .build();
```

## Audit Logging

```typescript
import { 
  initializeAuditSystem, 
  createSecurityEvent, 
  SecurityEventType, 
  SecurityEventSeverity 
} from '@signtusk/security';

// Initialize audit system
initializeAuditSystem({
  enabled: true,
  storage: 'database',
  logLevel: 'info'
});

// Create custom security events
const event = createSecurityEvent({
  type: SecurityEventType.AUTHENTICATION_SUCCESS,
  severity: SecurityEventSeverity.LOW,
  message: 'User logged in successfully',
  context: honoContext,
  metadata: { userId: '123' }
});
```

## Testing

The package includes comprehensive property-based tests using Fast-check to ensure security measures work correctly across all valid inputs.

```bash
npm test
```

## Requirements Validation

This package validates **Requirements 1.4** from the DocuSign Alternative specification:

- ✅ Security headers middleware with OWASP compliance
- ✅ Input validation and sanitization with Zod schemas  
- ✅ Rate limiting with Redis-backed token bucket algorithm
- ✅ CORS policies and security audit logging

## License

Private - Part of Signtusk Platform