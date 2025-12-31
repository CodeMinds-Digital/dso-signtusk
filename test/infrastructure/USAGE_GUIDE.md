# Test Infrastructure Usage Guide

This guide provides comprehensive examples and best practices for using the test infrastructure components.

## Overview

The test infrastructure provides a unified system for testing PDF signing functionality with:
- **Mock implementations** for PDF, field, and crypto operations
- **Test data generators** that create compatible data
- **Error handling** with consistent patterns
- **Integration coordination** between all components

## Quick Start

### Basic Usage

```typescript
import { TestInfrastructure } from './test/infrastructure';

// Create infrastructure instance
const infrastructure = TestInfrastructure.create();

// Set up a complete test workflow
const setup = infrastructure.setupTestWorkflow();

// Use in your tests
describe('PDF Signing Tests', () => {
  afterEach(() => {
    setup.cleanup(); // Always cleanup after tests
  });

  it('should sign PDF documents', async () => {
    // Generated data is automatically compatible with mocks
    const pdfResult = await setup.mocks.pdf.loadDocument('test-doc', setup.data);
    expect(pdfResult).toBeDefined();
    
    // Get feedback on mock usage
    const feedback = setup.feedback();
    expect(feedback.mockUsage.pdf).toBe(true);
  });
});
```

### Scenario-Based Configuration

```typescript
// Configure for different test scenarios
const unitInfrastructure = TestInfrastructure.create().configureForScenario('unit');
const integrationInfrastructure = TestInfrastructure.create().configureForScenario('integration');
const propertyInfrastructure = TestInfrastructure.create().configureForScenario('property');
const errorInfrastructure = TestInfrastructure.create().configureForScenario('error');

// Each scenario has different complexity and behavior
const unitSetup = unitInfrastructure.setupTestWorkflow();
const errorSetup = errorInfrastructure.setupTestWorkflow();
```

## Component Usage Examples

### PDF Mock Usage

```typescript
import { TestInfrastructure } from './test/infrastructure';

const infrastructure = TestInfrastructure.create();
const pdfMock = infrastructure.createPdfMock();

// Load a document
const result = await pdfMock.loadDocument('test-doc', {
  id: 'test-doc',
  content: 'PDF content',
  fields: [
    { name: 'signature', type: 'signature', required: true }
  ]
});

// Check loaded documents
const loadedDocs = pdfMock.getLoadedDocuments();
console.log('Loaded documents:', loadedDocs);

// Get operation history
const history = pdfMock.getOperationHistory();
console.log('Operations performed:', history);
```

### Field Mock Usage

```typescript
const fieldMock = infrastructure.createFieldMock();

// Register document fields first
fieldMock.registerDocument('test-doc', [
  { name: 'signature', type: 'signature', required: true },
  { name: 'date', type: 'text', required: false }
]);

// Look up fields
const fields = await fieldMock.lookupFields(['signature', 'date'], 'test-doc');
console.log('Found fields:', fields);

// Get lookup history
const lookupHistory = fieldMock.getLookupHistory();
console.log('Lookup history:', lookupHistory);
```

### Crypto Mock Usage

```typescript
const cryptoMock = infrastructure.createCryptoMock();

// Validate a signature
const validationResult = await cryptoMock.validateSignature(
  'pkcs7-signature-data',
  'certificate-data'
);

console.log('Validation result:', validationResult);

// Get operation count
const operationCount = cryptoMock.getOperationCount();
console.log('Total operations:', operationCount);

// Get specific operation counts
const validateCount = cryptoMock.getOperationCount('validate');
const signCount = cryptoMock.getOperationCount('sign');
```

### Data Generation

```typescript
import { AlignedDataGenerator } from './test/infrastructure';

const generator = new AlignedDataGenerator();

// Generate PDF document data
const pdfData = generator.generatePdfDocument({
  fieldCount: { min: 2, max: 5 },
  documentState: 'loaded'
});

// Generate field definitions
const fieldDefinitions = generator.generateFieldDefinitions(3);

// Generate crypto validation data
const cryptoData = generator.generateCryptoValidationData({
  validationCount: 1,
  includeSuccessScenarios: true,
  includeFailureScenarios: true
});

// Generate error scenarios
const errorScenarios = generator.generateErrorScenarios({
  scenarioCount: 2,
  errorTypes: ['PDF_LOAD_ERROR', 'FIELD_NOT_FOUND'],
  includeTriggers: true
});
```

### Error Handling

```typescript
import { ErrorValidator } from './test/infrastructure';

const errorValidator = new ErrorValidator();

// Validate error against pattern
const validation = errorValidator.validateAgainstPattern(
  'PDF parsing failed (Code: TST_PDF_001): File not found',
  'PDF_LOAD_ERROR'
);

console.log('Validation result:', validation);
console.log('Is valid:', validation.isValid);
console.log('Diagnostics:', validation.diagnostics);

// Validate error structure without specific pattern
const structureValidation = errorValidator.validateErrorStructure(
  'PDF parsing failed (Code: TST_PDF_001): File not found'
);

console.log('Structure analysis:', structureValidation.diagnostics.structureAnalysis);
```

## Advanced Usage Patterns

### Property-Based Testing Integration

```typescript
import { TestInfrastructure } from './test/infrastructure';
import { fc } from 'fast-check';

describe('PDF Signing Properties', () => {
  const infrastructure = TestInfrastructure.create().configureForScenario('property');

  it('should handle any valid PDF document', () => {
    fc.assert(fc.property(
      fc.string({ minLength: 1 }), // Document ID
      fc.array(fc.record({
        name: fc.string({ minLength: 1 }),
        type: fc.constantFrom('text', 'signature', 'checkbox'),
        required: fc.boolean()
      }), { minLength: 1, maxLength: 10 }), // Fields
      async (docId, fields) => {
        const setup = infrastructure.setupTestWorkflow();
        
        try {
          const result = await setup.mocks.pdf.loadDocument(docId, {
            id: docId,
            fields: fields
          });
          
          // Property: Loading should either succeed or fail with valid error
          if (!result.success) {
            const validation = setup.validateError(result.error);
            expect(validation.isValid).toBe(true);
          }
        } finally {
          setup.cleanup();
        }
      }
    ), { numRuns: 100 });
  });
});
```

### Custom Configuration

```typescript
import { ConfigurationFactory } from './test/infrastructure';

const configFactory = new ConfigurationFactory();

// Create custom configuration
const customConfig = configFactory.createConfiguration('integration-testing', {
  complexity: 'HIGH',
  documentState: 'LOADED',
  fieldTypes: ['signature', 'text'],
  errorTypes: ['PDF_LOAD_ERROR', 'FIELD_NOT_FOUND'],
  customOverrides: {
    pdf: {
      fields: [
        { name: 'custom-field', type: 'signature', required: true }
      ]
    }
  }
});

// Use custom configuration
const infrastructure = TestInfrastructure.create();
// Apply configuration through scenario setup
```

### Test Framework Integration

```typescript
import { ConfigurationFactory } from './test/infrastructure';

// Vitest integration
const vitestIntegration = configFactory.createTestFrameworkIntegration('vitest', {
  autoReset: true,
  enableLogging: false,
  customSetup: {
    beforeEach: async () => {
      console.log('Setting up test infrastructure');
    },
    afterEach: async () => {
      console.log('Cleaning up test infrastructure');
    }
  }
});

// Use in test setup
beforeEach(vitestIntegration.setupHooks.beforeEach);
afterEach(vitestIntegration.setupHooks.afterEach);
```

### Error Scenario Testing

```typescript
describe('Error Scenarios', () => {
  const errorInfrastructure = TestInfrastructure.create().configureForScenario('error');

  it('should handle PDF load errors', async () => {
    const setup = errorInfrastructure.setupTestWorkflow();

    try {
      // This should trigger an error
      await setup.mocks.pdf.loadDocument('invalid-doc', { invalid: 'data' });
      fail('Expected error was not thrown');
    } catch (error) {
      // Validate the error follows expected patterns
      const validation = setup.validateError(error as Error);
      expect(validation.isValid).toBe(true);
      expect(validation.diagnostics.errorType).toBeDefined();
    } finally {
      setup.cleanup();
    }
  });
});
```

## Best Practices

### 1. Always Cleanup

```typescript
describe('My Tests', () => {
  let setup: any;

  beforeEach(() => {
    const infrastructure = TestInfrastructure.create();
    setup = infrastructure.setupTestWorkflow();
  });

  afterEach(() => {
    // Always cleanup to prevent test interference
    setup.cleanup();
  });
});
```

### 2. Use Appropriate Scenarios

```typescript
// For fast unit tests
const unitSetup = TestInfrastructure.create()
  .configureForScenario('unit')
  .setupTestWorkflow();

// For comprehensive integration tests
const integrationSetup = TestInfrastructure.create()
  .configureForScenario('integration')
  .setupTestWorkflow();

// For property-based testing
const propertySetup = TestInfrastructure.create()
  .configureForScenario('property')
  .setupTestWorkflow();

// For error testing
const errorSetup = TestInfrastructure.create()
  .configureForScenario('error')
  .setupTestWorkflow();
```

### 3. Validate Errors Properly

```typescript
try {
  await someOperation();
  fail('Expected error was not thrown');
} catch (error) {
  // Always validate errors against expected patterns
  const validation = setup.validateError(error as Error, 'EXPECTED_PATTERN');
  expect(validation.isValid).toBe(true);
  
  // Check diagnostic information for debugging
  if (!validation.isValid) {
    console.log('Error validation failed:', validation.diagnostics);
  }
}
```

### 4. Use Feedback for Debugging

```typescript
it('should use mocks correctly', async () => {
  const setup = infrastructure.setupTestWorkflow();

  // Perform operations
  await setup.mocks.pdf.loadDocument('test', setup.data);

  // Check feedback
  const feedback = setup.feedback();
  
  // Ensure we're using mocks, not real implementations
  expect(feedback.mockUsage.pdf).toBe(true);
  expect(feedback.realImplementationUsage.pdf).toBe(false);
  
  // Use diagnostic info for debugging
  console.log('Execution time:', feedback.executionTime);
  console.log('Diagnostic info:', feedback.diagnosticInfo);

  setup.cleanup();
});
```

### 5. Property-Based Test Configuration

```typescript
// Configure property tests with appropriate iterations
fc.assert(fc.property(
  // ... property definition
), { 
  numRuns: 100, // Minimum recommended for property tests
  verbose: true, // Enable for debugging
  seed: 42 // Use for reproducible tests
});
```

## Troubleshooting

### Common Issues

1. **Tests interfering with each other**
   - Solution: Always call `setup.cleanup()` in `afterEach`

2. **Mock not behaving as expected**
   - Solution: Check mock configuration and use `feedback()` to debug

3. **Error validation failing**
   - Solution: Use `validateErrorStructure()` to analyze error format

4. **Data compatibility issues**
   - Solution: Use generated data from `setup.data` instead of custom data

### Debugging Tips

```typescript
// Enable logging for configuration factory
const configFactory = new ConfigurationFactory({
  logConfigurationChanges: true
});

// Check mock status
const mockCoordinator = new MockCoordinator();
const status = mockCoordinator.getStatus();
console.log('Mock status:', status);

// Analyze error structure
const errorValidator = new ErrorValidator();
const analysis = errorValidator.validateErrorStructure('Your error message');
console.log('Error analysis:', analysis.diagnostics);
```

## Configuration Options

### Infrastructure Configuration

```typescript
interface TestInfrastructureConfig {
  // Mock configuration
  mock: {
    pdf: {
      defaultFieldCount: number;
      maxFieldCount: number;
      defaultDocumentSize: number;
      maxDocumentSize: number;
      supportedFieldTypes: FieldType[];
    };
    field: {
      defaultLookupBehavior: 'success' | 'failure' | 'mixed';
      cacheEnabled: boolean;
      validationEnabled: boolean;
    };
    crypto: {
      defaultValidationResult: boolean;
      supportedAlgorithms: string[];
      errorRate: number; // 0-1, for error scenario testing
    };
  };
  
  // Generator configuration
  generator: {
    dataAlignment: {
      mockCompatibility: boolean;
      fieldConsistency: boolean;
      errorScenarioSupport: boolean;
    };
    constraints: {
      fieldCount: { min: number; max: number };
      documentSize: { min: number; max: number };
      validationComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
    };
  };
  
  // Error handling configuration
  errorHandling: {
    strictValidation: boolean;
    includeStackTraces: boolean;
    logErrors: boolean;
  };
}
```

### Scenario Configurations

- **Unit Testing**: Minimal complexity, fast execution, no error scenarios
- **Integration Testing**: Balanced complexity, realistic scenarios, some error cases
- **Property Testing**: High variation, comprehensive coverage, all error types
- **Error Testing**: Focus on error scenarios, edge cases, validation

## API Reference

See individual component documentation:
- [Mock Components](./mocks/README.md)
- [Data Generators](./generators/README.md)
- [Error Handling](./errors/README.md)
- [Integration Components](./integration/README.md)

## Examples Repository

For more examples, see the test files:
- `integration/basic-integration.test.ts` - Basic usage patterns
- `integration/complete-workflow.integration.test.ts` - Advanced workflows
- `integration/test-framework-integration.test.ts` - Framework integration
- Property test examples in individual component test files