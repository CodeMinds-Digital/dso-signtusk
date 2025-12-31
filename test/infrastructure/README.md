# Test Infrastructure

A comprehensive test infrastructure for PDF signing functionality that provides reliable mock implementations, aligned test data generators, and consistent error handling patterns.

## Overview

This test infrastructure addresses critical issues in PDF signing test reliability by providing:

- **Mock Implementations**: Reliable test doubles for PDF, field, and crypto operations
- **Test Data Generators**: Aligned data generation that works seamlessly with mocks
- **Error Handling**: Consistent error patterns and validation
- **Integration Coordination**: Unified coordination between all components

## Quick Start

```typescript
import { TestInfrastructure } from './test/infrastructure';

// Create infrastructure and set up test workflow
const infrastructure = TestInfrastructure.create();
const setup = infrastructure.setupTestWorkflow();

// Use in your tests
describe('PDF Signing Tests', () => {
  afterEach(() => {
    setup.cleanup(); // Always cleanup
  });

  it('should sign PDF documents', async () => {
    // Generated data is automatically compatible with mocks
    const result = await setup.mocks.pdf.loadDocument('test-doc', setup.data);
    expect(result).toBeDefined();
    
    // Validate errors if they occur
    if (!result.success) {
      const validation = setup.validateError(result.error);
      expect(validation.isValid).toBe(true);
    }
  });
});
```

## Documentation

- **[Usage Guide](./USAGE_GUIDE.md)** - Comprehensive examples and best practices
- **[Configuration Guide](./CONFIGURATION.md)** - All configuration options and scenarios

## Examples

- **[Unit Testing](./examples/unit-testing-example.ts)** - Fast, isolated unit tests
- **[Property Testing](./examples/property-testing-example.ts)** - Property-based testing patterns
- **[Error Testing](./examples/error-testing-example.ts)** - Error scenario and edge case testing

## Architecture

The infrastructure follows a layered architecture:

```
┌─────────────────────────────────────────┐
│           Test Framework                │
│         (Jest/Vitest/etc.)              │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│        Integration Layer                │
│  TestCoordinator | ConfigurationFactory │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Mock Layer    │ Generator Layer         │
│ PdfMock       │ AlignedDataGenerator    │
│ FieldMock     │ ConfigurationGenerator  │
│ CryptoMock    │                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│           Error Handling Layer          │
│  ErrorPatternRegistry | ErrorValidator  │
└─────────────────────────────────────────┘
```

## Component Structure

- `mocks/` - Mock implementation components (PDF, Field, Crypto)
- `generators/` - Test data generators aligned with mock implementations
- `errors/` - Error handling and pattern validation components
- `integration/` - Integration coordination and configuration components
- `config/` - Configuration files and utilities
- `types/` - TypeScript type definitions for test infrastructure
- `examples/` - Usage examples for different testing scenarios

## Key Features

### Scenario-Based Configuration

```typescript
// Configure for different test scenarios
const unitInfrastructure = TestInfrastructure.create().configureForScenario('unit');
const integrationInfrastructure = TestInfrastructure.create().configureForScenario('integration');
const propertyInfrastructure = TestInfrastructure.create().configureForScenario('property');
const errorInfrastructure = TestInfrastructure.create().configureForScenario('error');
```

### Automatic Data Compatibility

```typescript
const setup = infrastructure.setupTestWorkflow();

// Generated data is automatically compatible with all mocks
const pdfResult = await setup.mocks.pdf.loadDocument('test', setup.data);
const fieldResult = await setup.mocks.field.lookupFields(['field1'], 'test');
const cryptoResult = await setup.mocks.crypto.validateSignature('sig', 'cert');
```

### Error Pattern Validation

```typescript
try {
  await someOperation();
} catch (error) {
  // Validate error follows expected patterns
  const validation = setup.validateError(error as Error, 'EXPECTED_PATTERN');
  expect(validation.isValid).toBe(true);
  expect(validation.diagnostics.errorType).toBeDefined();
}
```

### Mock vs Real Implementation Feedback

```typescript
const feedback = setup.feedback();

// Clear indication of what's being used
expect(feedback.mockUsage.pdf).toBe(true);
expect(feedback.realImplementationUsage.pdf).toBe(false);

// Diagnostic information for debugging
console.log('Execution time:', feedback.executionTime);
console.log('Diagnostic info:', feedback.diagnosticInfo);
```

## Testing Scenarios

### Unit Testing
- **Purpose**: Fast, isolated unit tests
- **Complexity**: Low (1-3 fields)
- **Error Scenarios**: Disabled
- **Best For**: Testing individual functions

### Integration Testing  
- **Purpose**: Component interaction testing
- **Complexity**: Medium (3-10 fields)
- **Error Scenarios**: Enabled
- **Best For**: Testing component integration

### Property Testing
- **Purpose**: Property-based testing with high variation
- **Complexity**: High (5-20 fields)  
- **Error Scenarios**: Comprehensive
- **Best For**: Testing universal properties

### Error Testing
- **Purpose**: Error scenario and edge case testing
- **Complexity**: High (2-8 fields)
- **Error Scenarios**: Extensive (8+ scenarios)
- **Best For**: Testing error handling

## Best Practices

1. **Always Cleanup**: Use `setup.cleanup()` in `afterEach`
2. **Use Appropriate Scenarios**: Choose the right scenario for your test type
3. **Validate Errors**: Always validate errors against expected patterns
4. **Use Generated Data**: Use `setup.data` for compatibility
5. **Check Feedback**: Use `setup.feedback()` for debugging

## Requirements Validation

This infrastructure validates the following requirements:

- **4.1**: Property-based tests run with automatic data compatibility
- **4.2**: Integration tests execute with clean test framework integration  
- **4.3**: Clear feedback on mock vs real implementation usage
- **4.4**: Seamless integration between mocks, generators, and test frameworks
- **4.5**: Clear separation between mock behavior and test logic issues