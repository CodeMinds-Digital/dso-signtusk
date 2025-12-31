# Test Infrastructure Configuration Guide

This guide covers all configuration options and best practices for the test infrastructure.

## Configuration Overview

The test infrastructure supports multiple levels of configuration:

1. **Global Configuration** - Default settings for all components
2. **Scenario Configuration** - Preset configurations for different test types
3. **Component Configuration** - Specific settings for individual components
4. **Runtime Configuration** - Dynamic configuration during test execution

## Configuration Factory

The `ConfigurationFactory` is the central component for managing configurations.

### Basic Usage

```typescript
import { ConfigurationFactory } from './test/infrastructure';

const configFactory = new ConfigurationFactory({
  defaultPreset: 'standard',
  enableCaching: true,
  validateConfigurations: true,
  logConfigurationChanges: false
});
```

### Factory Options

```typescript
interface ConfigurationFactoryOptions {
  defaultPreset?: string;           // Default: 'standard'
  enableCaching?: boolean;          // Default: true
  validateConfigurations?: boolean; // Default: true
  logConfigurationChanges?: boolean; // Default: false
}
```

## Scenario Configurations

### Available Scenarios

#### Unit Testing
- **Purpose**: Fast, isolated unit tests
- **Complexity**: Low
- **Field Count**: 1-3 fields
- **Error Scenarios**: Disabled
- **Use Case**: Testing individual functions/methods

```typescript
const unitConfig = configFactory.createConfiguration('unit-testing');
```

#### Integration Testing
- **Purpose**: Component interaction testing
- **Complexity**: Medium
- **Field Count**: 3-10 fields
- **Error Scenarios**: Enabled
- **Use Case**: Testing component integration

```typescript
const integrationConfig = configFactory.createConfiguration('integration-testing');
```

#### Property Testing
- **Purpose**: Property-based testing with high variation
- **Complexity**: High
- **Field Count**: 5-20 fields
- **Error Scenarios**: Comprehensive
- **Use Case**: Testing universal properties

```typescript
const propertyConfig = configFactory.createConfiguration('property-testing');
```

#### Error Testing
- **Purpose**: Error scenario and edge case testing
- **Complexity**: High
- **Field Count**: 2-8 fields
- **Error Scenarios**: Extensive (8+ scenarios)
- **Use Case**: Testing error handling

```typescript
const errorConfig = configFactory.createConfiguration('error-testing');
```

#### Performance Testing
- **Purpose**: Large-scale performance testing
- **Complexity**: High
- **Field Count**: 20-100 fields
- **Error Scenarios**: Disabled
- **Use Case**: Performance and stress testing

```typescript
const performanceConfig = configFactory.createConfiguration('performance-testing');
```

### Custom Scenario Configuration

```typescript
const customConfig = configFactory.createConfiguration('integration-testing', {
  complexity: ComplexityLevel.HIGH,
  documentState: DocumentState.LOADED,
  fieldTypes: [FieldType.SIGNATURE, FieldType.TEXT],
  errorTypes: [ErrorType.PDF_LOAD_ERROR, ErrorType.FIELD_NOT_FOUND],
  customOverrides: {
    pdf: {
      fields: [
        { name: 'custom-signature', type: FieldType.SIGNATURE, required: true },
        { name: 'custom-date', type: FieldType.TEXT, required: false }
      ],
      documentState: DocumentState.LOADED,
      validationBehavior: {
        shouldSucceed: true
      }
    },
    crypto: {
      validationResults: [
        { isValid: true, algorithm: 'RSA-SHA256' },
        { isValid: false, algorithm: 'RSA-SHA1', error: 'Weak algorithm' }
      ],
      errorScenarios: [
        { type: ErrorType.CRYPTO_VALIDATION_ERROR, trigger: 'invalid-signature' }
      ]
    }
  }
});
```

## Component Configurations

### PDF Mock Configuration

```typescript
interface PdfMockConfiguration {
  fields: FieldDefinition[];
  documentState: DocumentState;
  validationBehavior: ValidationBehavior;
}

interface FieldDefinition {
  name: string;
  type: FieldType;
  required: boolean;
  validation?: ValidationRule[];
}

interface ValidationBehavior {
  shouldSucceed: boolean;
  errorType?: ErrorType;
  customMessage?: string;
}

// Example
const pdfConfig = {
  fields: [
    {
      name: 'signature',
      type: FieldType.SIGNATURE,
      required: true,
      validation: [
        { type: ValidationRuleType.REQUIRED, message: 'Signature is required' }
      ]
    },
    {
      name: 'date',
      type: FieldType.TEXT,
      required: false
    }
  ],
  documentState: DocumentState.LOADED,
  validationBehavior: {
    shouldSucceed: true
  }
};
```

### Field Mock Configuration

```typescript
interface FieldMockConfiguration {
  defaultLookupBehavior: 'success' | 'failure' | 'mixed';
  cacheEnabled: boolean;
  validationEnabled: boolean;
  fieldRegistry: Map<string, FieldDefinition[]>;
}

// Example
const fieldConfig = {
  defaultLookupBehavior: 'success' as const,
  cacheEnabled: true,
  validationEnabled: true,
  fieldRegistry: new Map([
    ['test-doc', [
      { name: 'signature', type: FieldType.SIGNATURE, required: true },
      { name: 'date', type: FieldType.TEXT, required: false }
    ]]
  ])
};
```

### Crypto Mock Configuration

```typescript
interface CryptoMockConfiguration {
  validationResults: ValidationResult[];
  errorScenarios: ErrorScenario[];
  defaultAlgorithm: string;
  supportedAlgorithms: string[];
}

interface ValidationResult {
  isValid: boolean;
  algorithm: string;
  error?: string;
  timestamp?: Date;
}

interface ErrorScenario {
  type: ErrorType;
  trigger: string;
  message?: string;
}

// Example
const cryptoConfig = {
  validationResults: [
    { isValid: true, algorithm: 'RSA-SHA256' },
    { isValid: false, algorithm: 'RSA-SHA1', error: 'Weak algorithm' }
  ],
  errorScenarios: [
    {
      type: ErrorType.CRYPTO_VALIDATION_ERROR,
      trigger: 'invalid-signature',
      message: 'Invalid PKCS#7 signature format'
    }
  ],
  defaultAlgorithm: 'RSA-SHA256',
  supportedAlgorithms: ['RSA-SHA256', 'RSA-SHA512', 'ECDSA-SHA256']
};
```

### Generator Configuration

```typescript
interface GeneratorConfiguration {
  dataAlignment: {
    mockCompatibility: boolean;
    fieldConsistency: boolean;
    errorScenarioSupport: boolean;
  };
  constraints: {
    fieldCount: Range;
    documentSize: Range;
    validationComplexity: ComplexityLevel;
  };
  profiles: {
    minimal: GeneratorProfile;
    standard: GeneratorProfile;
    comprehensive: GeneratorProfile;
  };
}

interface Range {
  min: number;
  max: number;
}

interface GeneratorProfile {
  fieldVariation: number;      // 0-1, amount of field variation
  errorRate: number;           // 0-1, probability of error scenarios
  complexityBias: number;      // 0-1, bias toward complex scenarios
  includeEdgeCases: boolean;   // Include edge case generation
}

// Example
const generatorConfig = {
  dataAlignment: {
    mockCompatibility: true,
    fieldConsistency: true,
    errorScenarioSupport: true
  },
  constraints: {
    fieldCount: { min: 3, max: 10 },
    documentSize: { min: 1024, max: 1048576 }, // 1KB to 1MB
    validationComplexity: ComplexityLevel.MEDIUM
  },
  profiles: {
    minimal: {
      fieldVariation: 0.2,
      errorRate: 0.1,
      complexityBias: 0.1,
      includeEdgeCases: false
    },
    standard: {
      fieldVariation: 0.5,
      errorRate: 0.3,
      complexityBias: 0.5,
      includeEdgeCases: true
    },
    comprehensive: {
      fieldVariation: 0.8,
      errorRate: 0.5,
      complexityBias: 0.8,
      includeEdgeCases: true
    }
  }
};
```

## Error Pattern Configuration

```typescript
interface ErrorPatternConfiguration {
  patterns: Map<ErrorType, ErrorPattern>;
  validationRules: ValidationRule[];
  diagnosticLevel: 'minimal' | 'standard' | 'verbose';
}

interface ErrorPattern {
  type: ErrorType;
  messageTemplate: string;
  requiredFields: string[];
  validationRules: ValidationRule[];
}

// Example
const errorPatternConfig = {
  patterns: new Map([
    [ErrorType.PDF_LOAD_ERROR, {
      type: ErrorType.PDF_LOAD_ERROR,
      messageTemplate: 'PDF parsing failed (Code: {code}): File "{filename}" - {details}',
      requiredFields: ['code', 'filename', 'details'],
      validationRules: [
        { type: ValidationRuleType.REQUIRED, field: 'code' },
        { type: ValidationRuleType.PATTERN, field: 'code', pattern: /^TST_PDF_\d{3}_\d{3}$/ }
      ]
    }]
  ]),
  validationRules: [
    { type: ValidationRuleType.MIN_LENGTH, value: 10 },
    { type: ValidationRuleType.MAX_LENGTH, value: 500 }
  ],
  diagnosticLevel: 'standard' as const
};
```

## Test Framework Integration Configuration

```typescript
interface TestFrameworkIntegration {
  framework: 'jest' | 'vitest' | 'mocha' | 'custom';
  setupHooks: {
    beforeEach?: () => void | Promise<void>;
    afterEach?: () => void | Promise<void>;
    beforeAll?: () => void | Promise<void>;
    afterAll?: () => void | Promise<void>;
  };
  configurationOverrides?: Partial<MockConfiguration>;
  generatorOverrides?: Partial<GeneratorConfiguration>;
}

// Example for Vitest
const vitestIntegration = configFactory.createTestFrameworkIntegration('vitest', {
  autoReset: true,
  enableLogging: false,
  configurationPreset: 'integration-testing',
  customSetup: {
    beforeAll: async () => {
      console.log('Initializing test infrastructure');
    },
    beforeEach: async () => {
      // Reset mocks before each test
    },
    afterEach: async () => {
      // Cleanup after each test
    },
    afterAll: async () => {
      console.log('Cleaning up test infrastructure');
    }
  }
});
```

## Configuration Presets

### Registering Custom Presets

```typescript
const customPreset: ConfigurationPreset = {
  name: 'custom-integration',
  description: 'Custom configuration for specific integration tests',
  mockConfiguration: {
    pdf: {
      fields: [
        { name: 'signature', type: FieldType.SIGNATURE, required: true },
        { name: 'timestamp', type: FieldType.TEXT, required: true }
      ],
      documentState: DocumentState.LOADED,
      validationBehavior: { shouldSucceed: true }
    },
    crypto: {
      validationResults: [
        { isValid: true, algorithm: 'RSA-SHA256' }
      ],
      errorScenarios: []
    },
    errorPatterns: new Map([
      [ErrorType.PDF_LOAD_ERROR, {
        type: ErrorType.PDF_LOAD_ERROR,
        messageTemplate: 'Custom PDF error: {message}',
        requiredFields: ['message'],
        validationRules: []
      }]
    ])
  },
  generatorConfiguration: {
    dataAlignment: {
      mockCompatibility: true,
      fieldConsistency: true,
      errorScenarioSupport: false
    },
    constraints: {
      fieldCount: { min: 2, max: 2 },
      documentSize: { min: 1024, max: 2048 },
      validationComplexity: ComplexityLevel.LOW
    }
  },
  tags: ['custom', 'integration', 'minimal']
};

configFactory.registerPreset(customPreset);
```

### Using Presets

```typescript
// Set active preset
configFactory.setActivePreset('custom-integration');

// Get preset
const preset = configFactory.getPreset('custom-integration');

// List all presets
const allPresets = configFactory.listPresets();
console.log('Available presets:', allPresets.map(p => p.name));
```

## Property-Based Testing Configuration

```typescript
// Configure property tests for different scenarios
const propertyTestBatch = configFactory.createPropertyTestingBatch(100, {
  scenario: 'property-testing',
  complexity: ComplexityLevel.HIGH,
  includeVariations: true
});

// Use with fast-check
import { fc } from 'fast-check';

fc.assert(fc.property(
  fc.constantFrom(...propertyTestBatch),
  (config) => {
    const infrastructure = TestInfrastructure.create();
    // Apply config and test
  }
), { numRuns: 100 });
```

## Configuration Validation

```typescript
// Validate configuration compatibility
const mockConfig = configFactory.createConfiguration('integration-testing');
const generatorConfig = configGenerator.generateGeneratorConfiguration('standard');

const compatibility = configFactory.validateConfigurationCompatibility(
  mockConfig,
  generatorConfig
);

if (!compatibility.isCompatible) {
  console.log('Configuration issues:', compatibility.issues);
  console.log('Recommendations:', compatibility.recommendations);
}
```

## Environment-Specific Configuration

```typescript
// Development environment
const devConfig = {
  enableLogging: true,
  validateConfigurations: true,
  defaultPreset: 'unit-testing'
};

// CI/CD environment
const ciConfig = {
  enableLogging: false,
  validateConfigurations: true,
  defaultPreset: 'integration-testing'
};

// Production testing environment
const prodConfig = {
  enableLogging: false,
  validateConfigurations: false,
  defaultPreset: 'performance-testing'
};

const configFactory = new ConfigurationFactory(
  process.env.NODE_ENV === 'development' ? devConfig :
  process.env.CI ? ciConfig :
  prodConfig
);
```

## Configuration Best Practices

### 1. Use Appropriate Scenarios

```typescript
// Fast unit tests
const unitInfrastructure = TestInfrastructure.create()
  .configureForScenario('unit');

// Comprehensive integration tests
const integrationInfrastructure = TestInfrastructure.create()
  .configureForScenario('integration');

// Property-based testing
const propertyInfrastructure = TestInfrastructure.create()
  .configureForScenario('property');
```

### 2. Cache Configurations

```typescript
// Enable caching for better performance
const configFactory = new ConfigurationFactory({
  enableCaching: true
});

// Clear cache when needed
configFactory.clearCache();
```

### 3. Validate Configurations

```typescript
// Always validate in development
const configFactory = new ConfigurationFactory({
  validateConfigurations: process.env.NODE_ENV === 'development'
});
```

### 4. Use Presets for Consistency

```typescript
// Register team-specific presets
configFactory.registerPreset(teamIntegrationPreset);
configFactory.registerPreset(teamUnitTestPreset);

// Use consistent presets across team
configFactory.setActivePreset('team-integration');
```

### 5. Monitor Configuration Usage

```typescript
// Get factory status
const status = configFactory.getStatus();
console.log('Active preset:', status.presets.active);
console.log('Cache hit rate:', status.cache.hitRate);
console.log('Available presets:', status.presets.available);
```

## Troubleshooting Configuration Issues

### Common Problems

1. **Configuration validation errors**
   ```typescript
   // Check validation details
   try {
     const config = configFactory.createConfiguration('custom-scenario');
   } catch (error) {
     console.log('Validation error:', error.message);
   }
   ```

2. **Incompatible mock and generator configurations**
   ```typescript
   const compatibility = configFactory.validateConfigurationCompatibility(
     mockConfig, generatorConfig
   );
   if (!compatibility.isCompatible) {
     console.log('Issues:', compatibility.issues);
     console.log('Recommendations:', compatibility.recommendations);
   }
   ```

3. **Performance issues with large configurations**
   ```typescript
   // Enable caching
   const configFactory = new ConfigurationFactory({
     enableCaching: true
   });
   
   // Use simpler configurations for unit tests
   const unitConfig = configFactory.createConfiguration('unit-testing');
   ```

4. **Preset not found errors**
   ```typescript
   // List available presets
   const presets = configFactory.listPresets();
   console.log('Available presets:', presets.map(p => p.name));
   
   // Check if preset exists before using
   const preset = configFactory.getPreset('my-preset');
   if (!preset) {
     console.log('Preset not found, using default');
     configFactory.setActivePreset('standard');
   }
   ```

## Configuration Schema Reference

For complete configuration schema definitions, see:
- [Mock Types](./mocks/types.ts)
- [Generator Types](./generators/types.ts)
- [Error Types](./errors/types.ts)
- [Integration Types](./integration/types.ts)