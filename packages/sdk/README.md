# Signtusk SDK

Official multi-language SDK for the Signtusk e-signature platform. This SDK provides comprehensive client libraries for JavaScript/TypeScript, Python, PHP, and .NET, enabling developers to integrate e-signature functionality into their applications with ease.

## Features

- **Full API Coverage**: Complete access to all Signtusk APIs
- **Multi-Language Support**: JavaScript/TypeScript, Python, PHP, and .NET
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Async/Await**: Modern async patterns across all languages
- **Error Handling**: Comprehensive error handling and retry mechanisms
- **Authentication**: Built-in support for API keys, OAuth, and JWT tokens
- **Real-time Events**: WebSocket support for real-time document updates
- **File Upload**: Streamlined document upload with progress tracking
- **Comprehensive Documentation**: Detailed guides and API reference

## Quick Start

### JavaScript/TypeScript

```bash
npm install @signtusk/sdk
```

```typescript
import { DocuSignAlternativeSDK } from '@signtusk/sdk';

const client = new DocuSignAlternativeSDK({
  apiKey: 'your-api-key',
  baseURL: 'https://api.docusign-alternative.com'
});

// Upload and send a document for signature
const document = await client.documents.upload({
  file: fs.createReadStream('contract.pdf'),
  name: 'Contract Agreement'
});

const signingRequest = await client.signing.create({
  documentId: document.id,
  recipients: [
    {
      email: 'signer@example.com',
      name: 'John Doe',
      role: 'signer'
    }
  ]
});

console.log('Signing URL:', signingRequest.signingUrl);
```

### Python

```bash
pip install docusign-alternative-sdk
```

```python
from docusign_alternative_sdk import DocuSignAlternativeSDK

client = DocuSignAlternativeSDK(
    api_key='your-api-key',
    base_url='https://api.docusign-alternative.com'
)

# Upload and send a document for signature
with open('contract.pdf', 'rb') as file:
    document = client.documents.upload(
        file=file,
        name='Contract Agreement'
    )

signing_request = client.signing.create(
    document_id=document.id,
    recipients=[
        {
            'email': 'signer@example.com',
            'name': 'John Doe',
            'role': 'signer'
        }
    ]
)

print(f'Signing URL: {signing_request.signing_url}')
```

### PHP

```bash
composer require docusign-alternative/sdk
```

```php
<?php
require_once 'vendor/autoload.php';

use DocuSignAlternative\SDK\DocuSignAlternativeSDK;

$client = new DocuSignAlternativeSDK([
    'apiKey' => 'your-api-key',
    'baseURL' => 'https://api.docusign-alternative.com'
]);

// Upload and send a document for signature
$document = $client->documents()->upload([
    'file' => fopen('contract.pdf', 'r'),
    'name' => 'Contract Agreement'
]);

$signingRequest = $client->signing()->create([
    'documentId' => $document->id,
    'recipients' => [
        [
            'email' => 'signer@example.com',
            'name' => 'John Doe',
            'role' => 'signer'
        ]
    ]
]);

echo "Signing URL: " . $signingRequest->signingUrl;
?>
```

### .NET

```bash
dotnet add package DocuSignAlternative.SDK
```

```csharp
using DocuSignAlternative.SDK;

var client = new DocuSignAlternativeSDK(new SDKConfiguration
{
    ApiKey = "your-api-key",
    BaseURL = "https://api.docusign-alternative.com"
});

// Upload and send a document for signature
var document = await client.Documents.UploadAsync(new DocumentUploadRequest
{
    File = File.OpenRead("contract.pdf"),
    Name = "Contract Agreement"
});

var signingRequest = await client.Signing.CreateAsync(new SigningRequest
{
    DocumentId = document.Id,
    Recipients = new[]
    {
        new Recipient
        {
            Email = "signer@example.com",
            Name = "John Doe",
            Role = "signer"
        }
    }
});

Console.WriteLine($"Signing URL: {signingRequest.SigningUrl}");
```

## Authentication

The SDK supports multiple authentication methods:

### API Key Authentication

```typescript
const client = new DocuSignAlternativeSDK({
  apiKey: 'your-api-key'
});
```

### OAuth 2.0

```typescript
const client = new DocuSignAlternativeSDK({
  oauth: {
    clientId: 'your-client-id',
    clientSecret: 'your-client-secret',
    redirectUri: 'https://your-app.com/callback'
  }
});

// Get authorization URL
const authUrl = client.auth.getAuthorizationUrl(['documents:read', 'documents:write']);

// Exchange code for token
const tokens = await client.auth.exchangeCodeForToken(authorizationCode);
```

### JWT Token

```typescript
const client = new DocuSignAlternativeSDK({
  jwt: {
    token: 'your-jwt-token'
  }
});
```

## Core Features

### Document Management

```typescript
// Upload document
const document = await client.documents.upload({
  file: fileStream,
  name: 'Document Name',
  metadata: { category: 'contract' }
});

// Get document
const document = await client.documents.get(documentId);

// List documents
const documents = await client.documents.list({
  page: 1,
  limit: 50,
  filter: { status: 'active' }
});

// Update document
const updatedDocument = await client.documents.update(documentId, {
  name: 'New Document Name'
});

// Delete document
await client.documents.delete(documentId);
```

### Template Management

```typescript
// Create template
const template = await client.templates.create({
  name: 'Contract Template',
  documentId: documentId,
  fields: [
    {
      type: 'signature',
      position: { x: 100, y: 200, page: 1 },
      recipient: 'signer1'
    }
  ]
});

// Use template
const signingRequest = await client.signing.createFromTemplate({
  templateId: template.id,
  recipients: [
    {
      role: 'signer1',
      email: 'signer@example.com',
      name: 'John Doe'
    }
  ]
});
```

### Signing Workflows

```typescript
// Create signing request
const signingRequest = await client.signing.create({
  documentId: documentId,
  workflow: {
    type: 'sequential', // or 'parallel'
    steps: [
      {
        recipients: ['signer1@example.com'],
        action: 'sign'
      },
      {
        recipients: ['approver@example.com'],
        action: 'approve'
      }
    ]
  }
});

// Get signing status
const status = await client.signing.getStatus(signingRequest.id);

// Cancel signing request
await client.signing.cancel(signingRequest.id);
```

### Real-time Events

```typescript
// Subscribe to document events
client.events.subscribe('document.signed', (event) => {
  console.log('Document signed:', event.documentId);
});

// Subscribe to signing request events
client.events.subscribe('signing.completed', (event) => {
  console.log('Signing completed:', event.signingRequestId);
});

// Unsubscribe from events
client.events.unsubscribe('document.signed');
```

### Webhooks

```typescript
// Create webhook
const webhook = await client.webhooks.create({
  url: 'https://your-app.com/webhooks',
  events: ['document.signed', 'signing.completed'],
  secret: 'webhook-secret'
});

// Verify webhook signature
const isValid = client.webhooks.verifySignature(
  payload,
  signature,
  'webhook-secret'
);
```

## Error Handling

The SDK provides comprehensive error handling:

```typescript
try {
  const document = await client.documents.get('invalid-id');
} catch (error) {
  if (error instanceof DocuSignAlternativeError) {
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    console.log('HTTP status:', error.status);
    console.log('Request ID:', error.requestId);
  }
}
```

## Configuration

### Environment Configuration

```typescript
const client = new DocuSignAlternativeSDK({
  environment: 'production', // 'development', 'staging', 'production'
  timeout: 30000, // Request timeout in milliseconds
  retries: 3, // Number of retry attempts
  retryDelay: 1000 // Delay between retries in milliseconds
});
```

### Custom HTTP Client

```typescript
const client = new DocuSignAlternativeSDK({
  httpClient: customAxiosInstance
});
```

## Language-Specific Documentation

- [JavaScript/TypeScript Documentation](./docs/typescript/README.md)
- [Python Documentation](./python/README.md)
- [PHP Documentation](./php/README.md)
- [.NET Documentation](./dotnet/README.md)

## Examples

Comprehensive examples are available in the `/examples` directory:

- [Basic Document Signing](./examples/basic-signing.md)
- [Template Usage](./examples/templates.md)
- [Bulk Operations](./examples/bulk-operations.md)
- [Webhook Integration](./examples/webhooks.md)
- [Real-time Events](./examples/real-time-events.md)

## API Reference

Complete API reference documentation is available at:
- [Online Documentation](https://docs.docusign-alternative.com/sdk)
- [TypeScript API Reference](./docs/typescript/api/index.html)

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This SDK is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Support

- [Documentation](https://docs.docusign-alternative.com)
- [API Reference](https://api-docs.docusign-alternative.com)
- [GitHub Issues](https://github.com/docusign-alternative/sdk/issues)
- [Community Forum](https://community.docusign-alternative.com)
- [Email Support](mailto:support@docusign-alternative.com)