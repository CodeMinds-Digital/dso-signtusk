# @signtusk/compliance

Comprehensive compliance and audit features package for the Signtusk platform, implementing SOC 2, GDPR, and immutable audit trail capabilities.

## Features

- **SOC 2 Compliance**: Complete SOC 2 Type II compliance controls and monitoring
- **GDPR Data Handling**: Privacy by design with data subject rights management
- **Immutable Audit Trail**: Cryptographically secured audit records with chain integrity
- **Compliance Dashboard**: Real-time compliance reporting and certification management

## Quick Start

```typescript
import { 
  SOC2ComplianceManager,
  GDPRComplianceManager,
  ImmutableAuditTrailManager,
  ComplianceDashboardManager
} from '@signtusk/compliance';

// Initialize compliance managers
const soc2Manager = new SOC2ComplianceManager();
const gdprManager = new GDPRComplianceManager();
const auditManager = new ImmutableAuditTrailManager();

const dashboardManager = new ComplianceDashboardManager(
  soc2Manager,
  gdprManager,
  auditManager,
  complianceConfig
);

// Generate comprehensive compliance report
const report = await dashboardManager.generateComprehensiveReport('org-123');
console.log(`Compliance Score: ${report.score}%`);
```

## SOC 2 Compliance

### Assess Controls

```typescript
import { SOC2ComplianceManager, SOC2ControlStatus } from '@signtusk/compliance';

const soc2Manager = new SOC2ComplianceManager();

// Assess a specific control
await soc2Manager.assessControl(
  'CC6.1',
  SOC2ControlStatus.IMPLEMENTED,
  ['access-control-policy.pdf', 'security-audit-2024.pdf'],
  'auditor@company.com',
  'Access controls fully implemented and tested'
);

// Generate compliance report
const report = await soc2Manager.generateComplianceReport('org-123');
console.log(`SOC 2 Score: ${report.overallScore}%`);
```

### Control Framework

The package includes all standard SOC 2 controls:

- **Security Controls**: CC6.1, CC6.2, CC6.3, CC6.7, CC6.8
- **Availability Controls**: A1.1, A1.2
- **Processing Integrity**: PI1.1
- **Confidentiality**: C1.1, C1.2
- **Privacy**: P1.1, P2.1

## GDPR Compliance

### Data Processing Records

```typescript
import { 
  GDPRComplianceManager, 
  DataProcessingPurpose, 
  GDPRLegalBasis 
} from '@signtusk/compliance';

const gdprManager = new GDPRComplianceManager();

// Record data processing activity
await gdprManager.recordDataProcessing({
  dataSubject: 'user@example.com',
  dataTypes: ['email', 'name', 'signature'],
  purpose: DataProcessingPurpose.DOCUMENT_PROCESSING,
  legalBasis: GDPRLegalBasis.CONTRACT,
  retentionPeriod: 2555, // 7 years
  processingDate: new Date(),
  dataMinimized: true,
  encrypted: true,
});
```

### Data Subject Rights

```typescript
// Handle access request (Article 15)
const requestId = await gdprManager.handleAccessRequest(
  'user@example.com',
  'privacy-officer@company.com'
);

// Handle erasure request - "Right to be Forgotten" (Article 17)
await gdprManager.handleErasureRequest(
  'user@example.com',
  'privacy-officer@company.com'
);

// Handle data portability request (Article 20)
await gdprManager.handlePortabilityRequest(
  'user@example.com',
  'privacy-officer@company.com'
);
```

### Consent Management

```typescript
// Record consent
const consentId = await gdprManager.recordConsent(
  'user@example.com',
  DataProcessingPurpose.MARKETING,
  'explicit',
  '192.168.1.1',
  'Mozilla/5.0...'
);

// Withdraw consent
await gdprManager.withdrawConsent(consentId);

// Check if consent is valid
const hasConsent = gdprManager.hasValidConsent(
  'user@example.com',
  DataProcessingPurpose.MARKETING
);
```

## Immutable Audit Trail

### Creating Audit Records

```typescript
import { 
  ImmutableAuditTrailManager,
  AuditEventType,
  AuditEventSeverity 
} from '@signtusk/compliance';

const auditManager = new ImmutableAuditTrailManager({
  enableChaining: true,
  enableEncryption: true,
  retentionDays: 2555,
});

// Create audit record
const recordId = await auditManager.createAuditRecord(
  AuditEventType.DOCUMENT_SIGNED,
  'org-123',
  'document',
  'doc-456',
  'signature_completed',
  {
    documentName: 'Contract.pdf',
    signerEmail: 'signer@example.com',
    signatureMethod: 'digital'
  },
  {
    userId: 'user-789',
    severity: AuditEventSeverity.MEDIUM,
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0...'
  }
);
```

### Querying Audit Records

```typescript
// Query audit records
const records = await auditManager.queryAuditRecords({
  organizationId: 'org-123',
  eventType: AuditEventType.DOCUMENT_SIGNED,
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  limit: 100
});

// Verify audit trail integrity
const integrityReport = await auditManager.verifyTrailIntegrity('org-123');
console.log(`Chain integrity: ${integrityReport.chainIntegrityValid}`);
console.log(`Verified records: ${integrityReport.verifiedRecords}/${integrityReport.totalRecords}`);
```

### Export Audit Data

```typescript
// Export audit records
const csvData = await auditManager.exportAuditRecords(
  { organizationId: 'org-123' },
  'csv'
);

const jsonData = await auditManager.exportAuditRecords(
  { organizationId: 'org-123' },
  'json'
);
```

## Compliance Dashboard

### Dashboard Metrics

```typescript
import { ComplianceDashboardManager } from '@signtusk/compliance';

// Get dashboard metrics
const metrics = await dashboardManager.getDashboardMetrics('org-123');

console.log(`Overall Score: ${metrics.overallScore}%`);
console.log(`Critical Findings: ${metrics.criticalFindings}`);
console.log(`Active Certifications: ${metrics.activeCertifications}`);
```

### Certification Management

```typescript
// Add certification
const certId = await dashboardManager.addCertification({
  name: 'SOC 2 Type II',
  type: 'soc2',
  status: ComplianceStatus.COMPLIANT,
  issuedDate: new Date('2024-01-15'),
  validUntil: new Date('2025-01-15'),
  certificateUrl: 'https://example.com/soc2-cert.pdf',
  issuer: 'Audit Firm LLC'
});

// Update certification
await dashboardManager.updateCertification(certId, {
  status: ComplianceStatus.UNDER_REVIEW
});
```

### Compliance Findings

```typescript
// Add finding
const findingId = await dashboardManager.addFinding({
  type: 'soc2',
  severity: AuditEventSeverity.HIGH,
  title: 'Missing Access Control Documentation',
  description: 'Control CC6.1 lacks sufficient documentation',
  recommendation: 'Update access control policies and procedures',
  status: 'open',
  discoveredDate: new Date(),
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
});

// Update finding
await dashboardManager.updateFinding(findingId, {
  status: 'resolved',
  assignedTo: 'security-team@company.com'
});
```

## Configuration

```typescript
import { ComplianceConfig } from '@signtusk/compliance';

const config: ComplianceConfig = {
  soc2: {
    enabled: true,
    autoAssessment: true,
    assessmentInterval: 90, // days
    requiredControls: ['CC6.1', 'CC6.2', 'CC6.3']
  },
  gdpr: {
    enabled: true,
    dataRetentionDays: 2555, // 7 years
    consentRequired: true,
    rightToBeForgettenEnabled: true,
    dataPortabilityEnabled: true
  },
  auditTrail: {
    enabled: true,
    immutableRecords: true,
    retentionDays: 2555, // 7 years
    encryptionEnabled: true,
    hashChainEnabled: true
  },
  reporting: {
    autoGeneration: true,
    reportInterval: 30, // days
    emailNotifications: true,
    dashboardEnabled: true
  }
};
```

## Testing

The package includes comprehensive property-based tests using Fast-check:

```bash
npm test
```

## Requirements Validation

This package validates **Requirements 11.3** from the DocuSign Alternative specification:

- ✅ SOC 2 compliance implementation with controls
- ✅ GDPR data handling with privacy by design
- ✅ Immutable audit trail generation with cryptographic integrity
- ✅ Compliance reporting dashboard with certifications

## License

Private - Part of Signtusk Platform