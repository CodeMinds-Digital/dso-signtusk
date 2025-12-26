# @signtusk/integrations

Third-party integrations package for DocuSign Alternative, providing seamless connectivity with popular platforms including Zapier, Microsoft 365, Google Workspace, and Salesforce.

## Features

- **Zapier Integration**: Webhook-based triggers and actions for workflow automation
- **Microsoft 365 Integration**: SharePoint document sync and Teams notifications
- **Google Workspace Integration**: Google Drive storage and Gmail notifications
- **Salesforce Integration**: Bidirectional sync with contacts, opportunities, and accounts
- **Unified API**: Consistent interface across all integration types
- **Batch Processing**: Efficient handling of multiple events and integrations
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Type Safety**: Full TypeScript support with strict typing

## Installation

```bash
npm install @signtusk/integrations
```

## Quick Start

```typescript
import { 
  IntegrationManager, 
  IntegrationType, 
  SyncEventType 
} from '@signtusk/integrations';

// Initialize the integration manager
const integrationManager = new IntegrationManager();

// Configure a Zapier integration
const zapierConfig = {
  id: 'zapier-1',
  organizationId: 'org-123',
  type: IntegrationType.ZAPIER,
  name: 'Document Automation',
  status: IntegrationStatus.ACTIVE,
  syncDirection: SyncDirection.OUTBOUND,
  webhookUrl: 'https://hooks.zapier.com/hooks/catch/123/abc',
  apiKey: 'your-api-key',
  triggers: ['document_created', 'document_signed'],
  actions: ['send_notification'],
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Test the connection
const testResult = await integrationManager.testConnection(zapierConfig);
console.log('Connection test:', testResult);

// Sync events
const events = [{
  id: 'event-1',
  integrationId: 'zapier-1',
  eventType: SyncEventType.DOCUMENT_SIGNED,
  entityId: 'doc-123',
  entityType: 'document',
  data: { documentName: 'Contract.pdf', signerEmail: 'user@example.com' },
  timestamp: new Date(),
  processed: false,
}];

await integrationManager.sync(zapierConfig, events);
```

## Integration Types

### Zapier Integration

Provides webhook-based integration with Zapier for workflow automation.

```typescript
import { ZapierIntegration, ZapierConfig } from '@signtusk/integrations';

const zapierConfig: ZapierConfig = {
  // ... base config
  webhookUrl: 'https://hooks.zapier.com/hooks/catch/123/abc',
  apiKey: 'your-zapier-api-key',
  triggers: ['document_created', 'document_signed', 'document_completed'],
  actions: ['send_email', 'create_task'],
};
```

**Supported Events:**
- Document created, signed, completed, declined
- Contact created, updated

### Microsoft 365 Integration

Integrates with SharePoint for document storage and Teams for notifications.

```typescript
import { Microsoft365Integration, Microsoft365Config } from '@signtusk/integrations';

const msConfig: Microsoft365Config = {
  // ... base config
  tenantId: 'your-tenant-id',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  sharepointSiteId: 'site-id',
  teamsChannelId: 'channel-id',
  syncSharePoint: true,
  syncTeams: true,
};
```

**Features:**
- Document upload to SharePoint
- Teams channel notifications
- OAuth 2.0 authentication
- Token refresh handling

### Google Workspace Integration

Connects with Google Drive and Gmail for document storage and notifications.

```typescript
import { GoogleWorkspaceIntegration, GoogleWorkspaceConfig } from '@signtusk/integrations';

const googleConfig: GoogleWorkspaceConfig = {
  // ... base config
  clientId: 'your-client-id.googleusercontent.com',
  clientSecret: 'your-client-secret',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  driveId: 'drive-folder-id',
  gmailEnabled: true,
  driveEnabled: true,
};
```

**Features:**
- Google Drive document storage
- Gmail email notifications
- OAuth 2.0 authentication
- Automatic token refresh

### Salesforce Integration

Bidirectional sync with Salesforce CRM for contacts, opportunities, and accounts.

```typescript
import { SalesforceIntegration, SalesforceConfig } from '@signtusk/integrations';

const salesforceConfig: SalesforceConfig = {
  // ... base config
  instanceUrl: 'https://your-instance.salesforce.com',
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  accessToken: 'access-token',
  refreshToken: 'refresh-token',
  syncContacts: true,
  syncOpportunities: true,
  syncAccounts: true,
};
```

**Features:**
- Contact synchronization
- Opportunity management
- Account creation and updates
- Custom field mapping

## Advanced Usage

### Batch Processing

Process multiple integrations and events efficiently:

```typescript
const configs = [zapierConfig, msConfig, googleConfig];
const events = [/* array of sync events */];

const result = await integrationManager.batchSync(configs, events, {
  maxConcurrency: 3,
  retryAttempts: 2,
  retryDelay: 1000,
});

console.log('Successful syncs:', result.successful);
console.log('Failed syncs:', result.failed);
```

### Error Handling

All integrations provide comprehensive error handling:

```typescript
import { IntegrationError, AuthenticationError, SyncError } from '@signtusk/integrations';

try {
  await integrationManager.sync(config, events);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('Authentication failed:', error.message);
    // Handle re-authentication
  } else if (error instanceof SyncError) {
    console.log('Sync failed:', error.message);
    // Handle sync retry
  } else if (error instanceof IntegrationError) {
    console.log('Integration error:', error.message);
    // Handle general integration error
  }
}
```

### Repository Pattern

Use the repository for persistent storage:

```typescript
import { createIntegrationRepository } from '@signtusk/integrations';

const repository = createIntegrationRepository();

// Store integration config
const stored = await repository.create(config);

// Find integrations
const orgIntegrations = await repository.findByOrganizationId('org-123');
const activeIntegrations = await repository.findActiveIntegrations();

// Manage sync events
const syncEvent = await repository.createSyncEvent({
  integrationId: 'integration-1',
  eventType: SyncEventType.DOCUMENT_SIGNED,
  entityId: 'doc-123',
  entityType: 'document',
  data: { /* event data */ },
  timestamp: new Date(),
  processed: false,
});
```

## Configuration

### Environment Variables

```bash
# Microsoft 365
MS365_TENANT_ID=your-tenant-id
MS365_CLIENT_ID=your-client-id
MS365_CLIENT_SECRET=your-client-secret

# Google Workspace
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Salesforce
SALESFORCE_CLIENT_ID=your-client-id
SALESFORCE_CLIENT_SECRET=your-client-secret
```

### OAuth Setup

Each integration requires OAuth setup:

1. **Microsoft 365**: Register app in Azure AD
2. **Google Workspace**: Create project in Google Cloud Console
3. **Salesforce**: Create Connected App in Salesforce Setup
4. **Zapier**: Generate webhook URL and API key

## Testing

The package includes comprehensive property-based tests:

```bash
npm test
npm run test:coverage
```

## API Reference

### IntegrationManager

Main class for managing all integrations.

#### Methods

- `authenticate(config)`: Authenticate an integration
- `sync(config, events)`: Sync events to an integration
- `syncToMultiple(configs, events)`: Sync to multiple integrations
- `validateConfig(config)`: Validate integration configuration
- `getStatus(config)`: Get integration status
- `testConnection(config)`: Test integration connectivity
- `batchSync(configs, events, options)`: Batch process multiple integrations

### Integration Services

Each integration type implements the `IntegrationService` interface:

- `ZapierIntegration`
- `Microsoft365Integration`
- `GoogleWorkspaceIntegration`
- `SalesforceIntegration`

### Repository

Persistent storage interface for integration configurations and sync events.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.