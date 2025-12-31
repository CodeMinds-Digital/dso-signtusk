# @documenso/pdf-sign

A clean room PDF digital signature library built with Rust and NAPI-RS for Node.js integration.

## Features

- **Digital PDF Signing**: Sign PDF documents with X.509 certificates
- **Signature Validation**: Verify existing digital signatures in PDF documents
- **Multiple Formats**: Support for PKCS#12 and PEM certificate formats
- **Standards Compliance**: PDF 1.7, PAdES, PKCS#7, and X.509 standards
- **Cross-Platform**: Windows, macOS, and Linux support
- **Performance**: Native Rust implementation with Node.js bindings

## Installation

```bash
npm install @documenso/pdf-sign
```

## Quick Start

```typescript
import { PdfSigner } from '@documenso/pdf-sign';
import { readFileSync } from 'fs';

const signer = new PdfSigner();

// Sign a PDF document
const pdfData = readFileSync('document.pdf');
const certData = readFileSync('certificate.p12');

const signedPdf = await signer.signDocument(
  pdfData,
  certData,
  Buffer.alloc(0), // key data (included in PKCS#12)
  'password',
  {
    reason: 'Document approval',
    location: 'New York, NY',
    appearance: {
      visible: true,
      text: 'Digitally signed by John Doe'
    }
  }
);

// Validate signatures
const validationResults = await signer.validateSignatures(signedPdf);
console.log('Signature valid:', validationResults[0].isValid);
```

## API Reference

### PdfSigner

The main class for PDF signing operations.

#### Methods

- `signDocument(pdfData, certData, keyData, password?, options?)`: Sign a PDF document
- `validateSignatures(pdfData)`: Validate all signatures in a PDF document
- `loadPkcs12Credentials(p12Data, password)`: Load credentials from PKCS#12 data
- `getCapabilities()`: Get library capabilities and supported features

### Types

#### SigningOptions

```typescript
interface SigningOptions {
  reason?: string;
  location?: string;
  contactInfo?: string;
  appearance?: SignatureAppearance;
  timestampServer?: string;
  hashAlgorithm?: string;
  signatureAlgorithm?: string;
}
```

#### SignatureAppearance

```typescript
interface SignatureAppearance {
  visible: boolean;
  page?: number;
  bounds?: Rectangle;
  text?: string;
  image?: Buffer;
  backgroundColor?: Color;
  borderColor?: Color;
}
```

#### ValidationResult

```typescript
interface ValidationResult {
  isValid: boolean;
  signatureIndex: number;
  signerName: string;
  signingTime: string;
  certificateValid: boolean;
  documentIntact: boolean;
  errors: string[];
  warnings: string[];
}
```

## Supported Algorithms

### Hash Algorithms
- SHA-256
- SHA-384
- SHA-512

### Signature Algorithms
- RSA (2048, 3072, 4096 bits)
- ECDSA (P-256, P-384, P-521)

### Standards Compliance
- PDF 1.7 (ISO 32000-1)
- PAdES (PDF Advanced Electronic Signatures)
- PKCS#7 (Cryptographic Message Syntax)
- X.509 (Public Key Infrastructure)
- RFC 3161 (Time-Stamp Protocol)

## Platform Support

- **Windows**: x86_64, i686, ARM64
- **macOS**: x86_64, ARM64 (Apple Silicon)
- **Linux**: x86_64, ARM64, ARMv7, musl

## Development

This package is built with Rust and uses NAPI-RS for Node.js bindings.

### Prerequisites

- Rust 1.70+
- Node.js 16+
- Platform-specific build tools

### Building

```bash
# Install dependencies
npm install

# Build the native module
npm run build

# Run tests
npm test
```

## License

MIT License - see LICENSE file for details.

## Contributing

Please read our contributing guidelines and code of conduct before submitting pull requests.

## Security

For security issues, please email security@documenso.com instead of using the issue tracker.