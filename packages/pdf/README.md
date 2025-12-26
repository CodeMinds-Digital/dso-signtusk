# @signtusk/pdf

A comprehensive PDF processing engine for the Signtusk platform, providing robust PDF manipulation capabilities including field creation, merging, splitting, optimization, and validation.

## Features

- **PDF Loading & Validation**: Load and validate PDF documents with comprehensive error handling
- **Field Management**: Create various types of form fields (text, checkbox, dropdown, radio, signature)
- **Document Manipulation**: Merge, split, and extract pages from PDF documents
- **Optimization**: Compress and optimize PDF documents for better performance
- **Watermarking**: Add customizable watermarks to PDF documents
- **Text Extraction**: Extract text content from PDF documents (placeholder implementation)
- **Thumbnail Generation**: Generate thumbnails for PDF pages (placeholder implementation)
- **Digital Signatures**: Create and validate digital signatures with certificate management
- **HSM Integration**: Hardware Security Module support for enterprise-grade key management
- **Comprehensive Error Handling**: Detailed error types and validation
- **Property-Based Testing**: Extensive test coverage with property-based tests

## Installation

```bash
npm install @signtusk/pdf
```

## Usage

### Basic PDF Operations

```typescript
import { PDFEngine, createPDFEngine } from '@signtusk/pdf';

// Create a PDF engine instance
const pdfEngine = createPDFEngine({
  timeout: 30000,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowEncrypted: false,
});

// Load a PDF document
const pdfBuffer = fs.readFileSync('document.pdf');
const document = await pdfEngine.loadPDF(pdfBuffer);

// Get document metadata
const metadata = await pdfEngine.getMetadata(document);
console.log(`Document has ${metadata.pageCount} pages`);
```

### Creating Form Fields

```typescript
import { FieldDefinition } from '@signtusk/pdf';

// Create a text field
const textField: FieldDefinition = {
  type: 'text',
  name: 'fullName',
  page: 0,
  x: 100,
  y: 200,
  width: 200,
  height: 30,
  required: true,
  fontSize: 12,
  fontColor: '#000000',
};

const field = await pdfEngine.createField(document, textField);

// Create a checkbox field
const checkboxField: FieldDefinition = {
  type: 'checkbox',
  name: 'agree',
  page: 0,
  x: 100,
  y: 300,
  width: 20,
  height: 20,
  required: true,
};

await pdfEngine.createField(document, checkboxField);
```

### Document Manipulation

```typescript
// Merge multiple PDFs
const doc1 = await pdfEngine.loadPDF(buffer1);
const doc2 = await pdfEngine.loadPDF(buffer2);
const mergedDoc = await pdfEngine.mergePDFs([doc1, doc2]);

// Split PDF into ranges
const pageRanges = [
  { start: 1, end: 3 },
  { start: 4, end: 6 }
];
const splitDocs = await pdfEngine.splitPDF(mergedDoc, pageRanges);

// Extract specific pages
const extractedDoc = await pdfEngine.extractPages(mergedDoc, [1, 3, 5]);
```

### Adding Watermarks

```typescript
import { WatermarkOptions } from '@signtusk/pdf';

const watermark: WatermarkOptions = {
  text: 'CONFIDENTIAL',
  opacity: 0.3,
  fontSize: 48,
  color: '#CCCCCC',
  rotation: 45,
  position: 'center',
};

const watermarkedDoc = await pdfEngine.addWatermark(document, watermark);
```

### PDF Optimization

```typescript
import { OptimizationOptions } from '@signtusk/pdf';

const options: OptimizationOptions = {
  compressImages: true,
  removeUnusedObjects: true,
  optimizeFonts: true,
  linearize: false,
  quality: 85,
};

const optimizedDoc = await pdfEngine.optimizePDF(document, options);
```

### Validation

```typescript
// Validate a PDF buffer
const validation = await pdfEngine.validatePDF(pdfBuffer);

if (validation.isValid) {
  console.log(`Valid PDF with ${validation.pageCount} pages`);
} else {
  console.error('Invalid PDF:', validation.errors);
}
```

### Serialization

```typescript
// Convert document back to buffer
const outputBuffer = await pdfEngine.serialize(document);
fs.writeFileSync('output.pdf', outputBuffer);
```

## Error Handling

The package provides comprehensive error handling with specific error types:

```typescript
import { 
  PDFProcessingError, 
  PDFValidationError, 
  PDFCorruptionError 
} from '@signtusk/pdf';

try {
  const document = await pdfEngine.loadPDF(buffer);
} catch (error) {
  if (error instanceof PDFValidationError) {
    console.error('Validation error:', error.message);
  } else if (error instanceof PDFCorruptionError) {
    console.error('Corrupted PDF:', error.message);
  } else if (error instanceof PDFProcessingError) {
    console.error('Processing error:', error.message, error.code);
  }
}
```

## Configuration Options

```typescript
interface ProcessingOptions {
  timeout?: number;        // Processing timeout in milliseconds (default: 30000)
  maxFileSize?: number;    // Maximum file size in bytes (default: 50MB)
  allowEncrypted?: boolean; // Allow encrypted PDFs (default: false)
  preserveMetadata?: boolean; // Preserve original metadata (default: true)
}
```

## Field Types

Supported field types:
- `text`: Text input fields
- `checkbox`: Checkbox fields
- `dropdown`: Dropdown selection fields
- `radio`: Radio button groups
- `signature`: Signature fields

## Limitations

- Text extraction requires additional libraries (placeholder implementation)
- Thumbnail generation requires additional libraries (placeholder implementation)
- Some advanced PDF features may not be supported by the underlying pdf-lib library
- Field appearance customization is limited by pdf-lib capabilities

## Testing

The package includes comprehensive test coverage with both unit tests and property-based tests:

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

## Hardware Security Module (HSM) Integration

The package provides enterprise-grade HSM integration for secure key management and digital signing operations.

### Supported HSM Providers

- **Google Cloud HSM**: Google Cloud Key Management Service (KMS)
- **AWS KMS**: Amazon Web Services Key Management Service
- **Azure Key Vault**: Microsoft Azure Key Vault
- **PKCS#11**: Standard interface for hardware security modules

### Installation

Install the required dependencies for your HSM provider:

```bash
# Google Cloud HSM
npm install @google-cloud/kms

# AWS KMS
npm install aws-sdk

# Azure Key Vault
npm install @azure/keyvault-keys @azure/identity

# PKCS#11 compatible HSMs
npm install pkcs11js
```

### Usage Example

```typescript
import { 
  createHSMIntegrationManager, 
  createHSMService,
  createDefaultHSMConfig 
} from '@signtusk/pdf';

// Create HSM integration manager
const hsmManager = createHSMIntegrationManager();

// Register Google Cloud HSM provider
const googleService = createHSMService('google-cloud-hsm');
hsmManager.registerProvider('google-cloud-hsm', googleService);

// Configure Google Cloud HSM
const config = createDefaultHSMConfig('google-cloud-hsm', {
  googleCloudKeyPath: 'projects/my-project/locations/global/keyRings/my-ring/cryptoKeys/my-key/cryptoKeyVersions/1',
  googleApplicationCredentials: '/path/to/service-account.json',
});

// Initialize HSM service
await googleService.initialize(config);

// Create key reference
const keyReference = {
  provider: 'google-cloud-hsm',
  keyId: 'my-signing-key',
  projectId: 'my-project',
  region: 'global',
};

// Sign document with HSM
const document = Buffer.from('Document content to sign');
const signature = await hsmManager.signWithHSM(
  document,
  keyReference,
  certificate,
  config
);

// Validate HSM signature
const validationResult = await hsmManager.validateHSMSignature(signature);
console.log('Signature valid:', validationResult.isValid);
```

### HSM Configuration Examples

#### Google Cloud HSM
```typescript
const googleConfig = {
  provider: 'google-cloud-hsm',
  credentials: {
    googleCloudKeyPath: 'projects/PROJECT_ID/locations/LOCATION/keyRings/RING_ID/cryptoKeys/KEY_ID/cryptoKeyVersions/VERSION',
    googleApplicationCredentials: '/path/to/service-account.json',
  },
  timeout: 30000,
  retryAttempts: 3,
};
```

#### AWS KMS
```typescript
const awsConfig = {
  provider: 'aws-kms',
  credentials: {
    awsAccessKeyId: 'YOUR_ACCESS_KEY_ID',
    awsSecretAccessKey: 'YOUR_SECRET_ACCESS_KEY',
    awsRegion: 'us-east-1',
  },
  timeout: 30000,
  retryAttempts: 3,
};
```

#### Azure Key Vault
```typescript
const azureConfig = {
  provider: 'azure-keyvault',
  credentials: {
    vaultUrl: 'https://my-vault.vault.azure.net/',
    azureClientId: 'YOUR_CLIENT_ID',
    azureClientSecret: 'YOUR_CLIENT_SECRET',
    azureTenantId: 'YOUR_TENANT_ID',
  },
  timeout: 30000,
  retryAttempts: 3,
};
```

#### PKCS#11 HSM
```typescript
const pkcs11Config = {
  provider: 'pkcs11',
  credentials: {
    pkcs11LibraryPath: '/usr/lib/softhsm/libsofthsm2.so',
    pkcs11SlotId: 0,
    pkcs11Pin: 'YOUR_PIN',
  },
  timeout: 30000,
  retryAttempts: 3,
};
```

### HSM Key Management

```typescript
// List available keys
const keys = await hsmService.listKeys();

// Create new key
const keyInfo = await hsmService.createKey('RSA', 2048, 'my-new-key');

// Get public key
const publicKey = await hsmService.getPublicKey(keyReference);

// Delete key
await hsmService.deleteKey(keyReference);
```

### Supported Signing Algorithms

- RSA PKCS#1 v1.5: SHA-256, SHA-384, SHA-512
- RSA PSS: SHA-256, SHA-384, SHA-512
- ECDSA: SHA-256, SHA-384, SHA-512

## Timestamp Server Integration

The package provides RFC 3161 compliant timestamp server integration for adding trusted timestamps to documents and signatures, ensuring legal compliance and non-repudiation.

### Features

- **RFC 3161 Compliance**: Full compliance with RFC 3161 timestamp protocol
- **Multiple TSA Support**: Support for multiple Timestamp Authorities with failover
- **Timestamp Verification**: Comprehensive timestamp validation and verification
- **Audit Trail**: Complete audit trail generation for compliance requirements
- **Signature Integration**: Add timestamps to existing CMS signatures
- **Error Handling**: Robust error handling with retry mechanisms

### Installation

The timestamp server integration requires the `axios` dependency for HTTP requests:

```bash
npm install axios
```

### Usage Example

```typescript
import { 
  createTimestampServerManager,
  TSAConfig,
  TSAFailoverConfig,
  TimestampRequestOptions 
} from '@signtusk/pdf';

// Create timestamp server manager
const timestampManager = createTimestampServerManager();

// Document to timestamp
const documentData = Buffer.from('Document content to timestamp');

// Create RFC 3161 compliant timestamp request
const requestOptions: TimestampRequestOptions = {
  hashAlgorithm: 'SHA-256',
  includeNonce: true,
  requestCertificate: true,
  policy: '1.2.3.4.5.6.7.8.9' // Optional policy OID
};

const timestampRequest = await timestampManager.createTimestampRequest(
  documentData, 
  requestOptions
);
```

### Single TSA Configuration

```typescript
const tsaConfig: TSAConfig = {
  url: 'http://timestamp.digicert.com',
  username: 'optional-username',
  password: 'optional-password',
  timeout: 30000,
  retryAttempts: 3,
  requireNonce: true,
  hashAlgorithm: 'SHA-256'
};

// Request timestamp from TSA
const response = await timestampManager.requestTimestamp(timestampRequest, tsaConfig);

// Verify timestamp response
const verificationResult = await timestampManager.verifyTimestampResponse(
  response, 
  documentData
);

console.log('Timestamp valid:', verificationResult.isValid);
console.log('Timestamp:', verificationResult.timestamp);
```

### Failover TSA Configuration

```typescript
const failoverConfig: TSAFailoverConfig = {
  primary: {
    url: 'http://timestamp.digicert.com',
    timeout: 15000,
    retryAttempts: 2
  },
  fallbacks: [
    {
      url: 'http://timestamp.sectigo.com',
      timeout: 15000,
      retryAttempts: 2
    },
    {
      url: 'http://timestamp.globalsign.com',
      timeout: 15000,
      retryAttempts: 2
    }
  ],
  maxFailoverAttempts: 3,
  failoverTimeout: 45000
};

// Request timestamp with automatic failover
const failoverResponse = await timestampManager.requestTimestampWithFailover(
  timestampRequest, 
  failoverConfig
);
```

### Signature Timestamping

```typescript
// Add timestamp to existing CMS signature
const timestampedSignature = await timestampManager.addTimestampToSignature(
  existingSignature,
  tsaConfig
);

// Extract timestamp from signature
const extractedTimestamp = await timestampManager.extractTimestamp(timestampedSignature);

if (extractedTimestamp) {
  console.log('Signature timestamp:', extractedTimestamp.timestamp);
  console.log('TSA URL:', extractedTimestamp.tsaUrl);
  console.log('Serial number:', extractedTimestamp.serialNumber);
}
```

### Timestamp Verification

```typescript
// Verify extracted timestamp
const verificationResult = await timestampManager.verifyTimestamp(
  extractedTimestamp,
  originalDocumentData
);

console.log('Timestamp verification results:');
console.log('- Valid:', verificationResult.isValid);
console.log('- Timestamp:', verificationResult.timestamp);
console.log('- TSA Certificate:', verificationResult.certificate.subject.commonName);
console.log('- Policy:', verificationResult.policy);
console.log('- Accuracy:', verificationResult.accuracy);

if (!verificationResult.isValid) {
  console.log('Errors:', verificationResult.errors);
}
```

### Audit Trail Generation

```typescript
// Generate audit trail for timestamp operations
const operation = {
  type: 'REQUEST' as const,
  documentHash: crypto.createHash('sha256').update(documentData).digest('hex'),
  tsaUrl: tsaConfig.url,
  timestamp: new Date(),
  userId: 'user-123',
  organizationId: 'org-456',
  metadata: {
    documentName: 'contract.pdf',
    requestId: 'req-789'
  }
};

const auditEntry = await timestampManager.generateTimestampAuditTrail(
  operation,
  verificationResult
);

console.log('Audit entry created:', auditEntry.id);
console.log('Operation success:', auditEntry.success);
console.log('Created at:', auditEntry.createdAt);

// Retrieve audit trail
const auditTrail = timestampManager.getAuditTrail();
console.log(`Total audit entries: ${auditTrail.length}`);
```

### Supported Hash Algorithms

- SHA-1 (legacy support)
- SHA-256 (recommended)
- SHA-384
- SHA-512

### Error Handling

```typescript
import { 
  TimestampServerError,
  TSAConnectionError,
  TSAResponseError,
  TimestampValidationError 
} from '@signtusk/pdf';

try {
  const response = await timestampManager.requestTimestamp(request, config);
} catch (error) {
  if (error instanceof TSAConnectionError) {
    console.error('TSA connection failed:', error.message);
    console.error('TSA URL:', error.tsaUrl);
  } else if (error instanceof TSAResponseError) {
    console.error('TSA rejected request:', error.message);
    console.error('Status code:', error.details?.status);
  } else if (error instanceof TimestampValidationError) {
    console.error('Timestamp validation failed:', error.message);
  }
}
```

### RFC 3161 Compliance Features

- **Message Imprint**: Proper hash algorithm identification and message hashing
- **Nonce Support**: Optional nonce generation for replay attack prevention
- **Policy Support**: TSA policy OID specification
- **Certificate Requests**: Request TSA certificate inclusion in response
- **Status Validation**: Proper TSA response status handling
- **Timestamp Token**: Complete TimeStampToken parsing and validation
- **Certificate Chain**: TSA certificate chain validation
- **Accuracy Information**: Timestamp accuracy parsing and verification

## Dependencies

- `pdf-lib`: Core PDF manipulation library
- `node-forge`: Cryptographic operations and certificate management
- `zod`: Schema validation
- `axios`: HTTP requests for timestamp server communication
- `fast-check`: Property-based testing (dev dependency)

### Optional HSM Dependencies

- `@google-cloud/kms`: Google Cloud HSM support
- `aws-sdk`: AWS KMS support
- `@azure/keyvault-keys` & `@azure/identity`: Azure Key Vault support
- `pkcs11js`: PKCS#11 HSM support

## License

This package is part of the Signtusk project.