# API Versioning System

A comprehensive API versioning system that provides multiple versioning strategies, deprecation management, and automated migration tools.

## Features

- **Multiple Versioning Strategies**: URL-based, header-based, query parameter, and subdomain versioning
- **Deprecation Management**: Automated deprecation timeline with notifications and warnings
- **Migration Tools**: Automated data transformation and migration planning utilities
- **Version Negotiation**: Intelligent version resolution with fallback strategies
- **Standards Compliance**: Follows HTTP standards for deprecation headers and status codes

## Quick Start

```typescript
import { setupVersioning } from '@signtusk/api/versioning';

// Basic setup with default configuration
const { middleware, config } = setupVersioning();

// Custom configuration
const { middleware: customMiddleware } = setupVersioning({
  defaultVersion: 'v2',
  requireVersionSpecification: true,
  includeDeprecationWarnings: true
});

// Apply middleware to your API
app.use('*', middleware);
```

## Versioning Strategies

### 1. URL-based Versioning (Recommended)

```
GET /api/v1/documents
GET /api/v2/documents
```

### 2. Header-based Versioning

```http
Accept: application/vnd.docusign-alternative.v1+json
Accept: application/json; version=v1
```

### 3. Query Parameter Versioning

```
GET /api/documents?version=v1
GET /api/documents?v=2
```

### 4. Subdomain Versioning

```
https://v1.api.example.com/documents
https://api-v2.example.com/documents
```

## Version Configuration

```typescript
import { versionConfig } from '@signtusk/api/versioning';

// Current configuration
console.log(versionConfig.defaultVersion);    // 'v1'
console.log(versionConfig.latestVersion);     // 'v1'
console.log(versionConfig.supportedVersions); // ['v1', 'v2', 'v3']
```

## Migration Tools

### Compatibility Checking

```typescript
import { MigrationCompatibilityChecker } from '@signtusk/api/versioning';

// Check if direct migration is possible
const canMigrate = MigrationCompatibilityChecker.canMigrateDirectly('v1', 'v2');

// Find migration path
const path = MigrationCompatibilityChecker.findMigrationPath('v1', 'v3');
// Returns: ['v1', 'v2', 'v3']

// Analyze migration requirements
const analysis = MigrationCompatibilityChecker.analyzeMigration('v1', 'v2');
console.log(analysis.complexity);        // 'medium'
console.log(analysis.estimatedTime);     // '2-4 weeks'
console.log(analysis.breakingChanges);   // 4
```

### Data Transformation

```typescript
import { DataTransformer } from '@signtusk/api/versioning';

// Transform data between versions
const v1Data = { status: 'completed', id: 'doc-1' };
const result = DataTransformer.transform(v1Data, 'v1', 'v2');

console.log(result.success);           // true
console.log(result.data.state);       // 'completed' (status -> state)
console.log(result.appliedTransforms); // ['document-status']
```

### Migration Planning

```typescript
import { MigrationPlanner } from '@signtusk/api/versioning';

// Generate migration checklist
const checklist = MigrationPlanner.generateChecklist('v1', 'v2');
console.log(checklist.preRequisites);  // ['Backup current implementation', ...]
console.log(checklist.steps);          // [{ id: 'auth-tokens', title: '...', ... }]

// Estimate migration effort
const estimate = MigrationPlanner.estimateEffort('v1', 'v2');
console.log(estimate.totalHours);      // 48
console.log(estimate.riskLevel);       // 'medium'
```

## Deprecation Management

### Deprecation Warnings

```typescript
import { DeprecationManager } from '@signtusk/api/versioning';

// Get deprecation warnings
const warnings = DeprecationManager.getDeprecationWarnings('v1');
console.log(warnings); // ['API v1 is deprecated...']

// Check deprecation phase
const phase = DeprecationManager.getCurrentPhase('v1');
console.log(phase); // 'deprecated' | 'sunset' | null

// Get deprecation timeline
const timeline = DeprecationManager.getDeprecationTimeline('v1');
```

### Automated Notifications

```typescript
import { DeprecationNotificationService } from '@signtusk/api/versioning';

// Send deprecation notification
await DeprecationNotificationService.sendDeprecationNotification(
  'v1',
  'deprecated',
  ['developer@example.com']
);

// Schedule automated notifications
DeprecationNotificationService.scheduleNotifications('v1');
```

## Version Negotiation

### Manual Negotiation

```typescript
import { negotiateVersion } from '@signtusk/api/versioning';

// Negotiate version from request context
const result = negotiateVersion(context);
console.log(result.version);   // 'v2'
console.log(result.strategy);  // 'url'
console.log(result.explicit);  // true
console.log(result.warnings);  // ['API v2 is deprecated...']
```

### Middleware Integration

```typescript
import { createVersionNegotiationMiddleware } from '@signtusk/api/versioning';

// Create middleware
const versionMiddleware = createVersionNegotiationMiddleware();

// Apply to routes
app.use('*', versionMiddleware);

// Access version in handlers
app.get('/documents', (c) => {
  const version = c.get('apiVersion');     // 'v1'
  const versionResult = c.get('versionResult'); // Full negotiation result
  
  // Version-specific logic
  if (version === 'v1') {
    return c.json({ status: 'completed' });
  } else {
    return c.json({ state: 'completed' });
  }
});
```

## Response Headers

The versioning system automatically adds appropriate headers to responses:

```http
HTTP/1.1 200 OK
API-Version: v1
API-Version-Strategy: url
API-Supported-Versions: v1, v2, v3
API-Latest-Version: v1
API-Deprecation-Warning: API v1 is deprecated...
Deprecation: true
Sunset: 2025-01-01T00:00:00Z
```

## Error Handling

### Unsupported Version

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "code": "UNSUPPORTED_VERSION",
    "message": "API version 'v99' is not supported. Supported versions: v1, v2, v3",
    "version": "v99",
    "supportedVersions": ["v1", "v2", "v3"],
    "latestVersion": "v1"
  }
}
```

### Sunset Version

```http
HTTP/1.1 410 Gone
Content-Type: application/json

{
  "error": {
    "code": "SUNSET_VERSION",
    "message": "API version 'v0' has been sunset and is no longer supported.",
    "version": "v0",
    "migrationTarget": "v1",
    "migrationGuide": "/api/docs/migration/v0-to-v1"
  }
}
```

## Configuration Options

```typescript
interface VersionConfig {
  defaultVersion: APIVersion;              // Default when none specified
  latestVersion: APIVersion;               // Latest stable version
  supportedVersions: APIVersion[];         // All supported versions
  strategies: VersioningStrategy[];        // Enabled strategies
  includeDeprecationWarnings: boolean;     // Include warnings in responses
  requireVersionSpecification: boolean;    // Require explicit version
}
```

## Best Practices

### 1. Version Strategy Selection

- **URL-based**: Best for public APIs, clear and cacheable
- **Header-based**: Good for content negotiation, less visible
- **Query parameter**: Useful for debugging and testing
- **Subdomain**: Good for major version differences

### 2. Deprecation Timeline

1. **Announcement** (6 months before deprecation)
2. **Deprecation** (Version marked deprecated, warnings issued)
3. **Sunset Warning** (3 months before sunset)
4. **Sunset** (Version returns 410 Gone)
5. **Removal** (Version completely removed)

### 3. Migration Planning

- Start migration planning early
- Use automated transformation tools where possible
- Test thoroughly in development environment
- Plan for rollback scenarios
- Monitor error rates during migration

### 4. Backward Compatibility

- Maintain backward compatibility within major versions
- Use semantic versioning principles
- Provide clear migration guides
- Offer automated migration tools

## Examples

### Basic Version Detection

```typescript
import { negotiateVersion } from '@signtusk/api/versioning';

app.use('*', async (c, next) => {
  const versionResult = negotiateVersion(c);
  c.set('apiVersion', versionResult.version);
  await next();
});
```

### Version-Specific Response Format

```typescript
app.get('/documents', (c) => {
  const version = c.get('apiVersion');
  const documents = getDocuments();
  
  if (version === 'v1') {
    return c.json({
      documents: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        status: doc.state // v1 uses 'status'
      }))
    });
  } else {
    return c.json({
      data: documents.map(doc => ({
        id: doc.id,
        name: doc.name,
        state: doc.state // v2+ uses 'state'
      })),
      pagination: { /* ... */ }
    });
  }
});
```

### Migration Automation

```typescript
import { DataTransformer, MigrationTracker } from '@signtusk/api/versioning';

async function migrateUserData(userId: string) {
  const migrationId = `user-${userId}-v1-to-v2`;
  
  // Start tracking
  MigrationTracker.startMigration(migrationId, 'v1', 'v2');
  
  try {
    // Get user data
    const userData = await getUserData(userId);
    
    // Transform data
    const result = DataTransformer.transform(userData, 'v1', 'v2');
    
    if (result.success) {
      // Save transformed data
      await saveUserData(userId, result.data);
      MigrationTracker.updateProgress(migrationId, 'data-transform', true);
    } else {
      MigrationTracker.updateProgress(migrationId, 'data-transform', false, result.errors);
    }
  } catch (error) {
    MigrationTracker.updateProgress(migrationId, 'data-transform', false, [error.message]);
  }
}
```

## Testing

The versioning system includes comprehensive tests covering:

- Version negotiation from all sources
- Migration tool functionality
- Deprecation management
- Error handling
- Middleware integration

Run tests with:

```bash
npm test packages/api/src/versioning
```

## Contributing

When adding new versions:

1. Update version metadata in `config.ts`
2. Create migration guide in `migration.ts`
3. Add deprecation timeline if needed
4. Update tests
5. Update documentation

## Support

For questions or issues with the versioning system:

- Check the [API Documentation](/api/docs)
- Review [Migration Guides](/api/docs/migration)
- Contact [API Support](mailto:api-support@docusign-alternative.com)