/**
 * Configuration Generator
 * 
 * Generates mock configurations with constraint-based generation and customizable parameters.
 * Ensures configurations are compatible with mock implementations and test requirements.
 */

import * as fc from 'fast-check';
import { ErrorType } from '../errors/types';
import {
    ComplexityLevel,
    DocumentState,
    GeneratorConfiguration,
    MockConfiguration,
    Range,
    ValidationBehavior
} from '../mocks/types';
import { AlignedDataGenerator } from './aligned-data-generator';

export class ConfigurationGenerator {
  private readonly alignedDataGenerator: AlignedDataGenerator;

  constructor() {
    this.alignedDataGenerator = new AlignedDataGenerator();
  }

  /**
   * Generate mock configuration with customizable constraints
   */
  generateMockConfiguration(config?: Partial<{
    fieldCount: Range;
    documentState: DocumentState;
    validationComplexity: ComplexityLevel;
    includeErrorScenarios: boolean;
    errorScenarioCount: number;
  }>): MockConfiguration {
    const fieldCount = config?.fieldCount || { min: 1, max: 5 };
    const documentState = config?.documentState || DocumentState.LOADED;
    const complexity = config?.validationComplexity || ComplexityLevel.MEDIUM;
    const includeErrors = config?.includeErrorScenarios ?? true;
    const errorCount = config?.errorScenarioCount || 3;

    // Generate PDF configuration
    const pdfDocument = this.alignedDataGenerator.generatePdfDocument({
      fieldCount,
      documentState,
      includeMetadata: true
    });

    const validationBehavior = this.generateValidationBehaviorByComplexity(complexity);

    // Generate crypto configuration
    const cryptoData = this.alignedDataGenerator.generateCryptoValidationData({
      validationCount: this.getValidationCountByComplexity(complexity),
      includeSuccessScenarios: true,
      includeFailureScenarios: includeErrors
    });

    const errorScenarios = includeErrors 
      ? this.alignedDataGenerator.generateErrorScenarios({
          scenarioCount: errorCount,
          errorTypes: this.getErrorTypesByComplexity(complexity),
          includeTriggers: true
        })
      : [];

    return {
      pdf: {
        fields: pdfDocument.fields,
        documentState: pdfDocument.state,
        validationBehavior
      },
      crypto: {
        validationResults: cryptoData.validationResults,
        errorScenarios
      },
      errorPatterns: this.generateErrorPatterns(complexity)
    };
  }

  /**
   * Generate generator configuration with different characteristics
   */
  generateGeneratorConfiguration(profile?: 'minimal' | 'standard' | 'comprehensive'): GeneratorConfiguration {
    const selectedProfile = profile || 'standard';

    switch (selectedProfile) {
      case 'minimal':
        return this.generateMinimalConfiguration();
      case 'comprehensive':
        return this.generateComprehensiveConfiguration();
      default:
        return this.generateStandardConfiguration();
    }
  }

  /**
   * Generate configuration for specific test scenarios
   */
  generateScenarioConfiguration(scenario: 'error-testing' | 'performance-testing' | 'integration-testing'): GeneratorConfiguration {
    const baseConfig = this.generateStandardConfiguration();

    switch (scenario) {
      case 'error-testing':
        return {
          ...baseConfig,
          dataAlignment: {
            ...baseConfig.dataAlignment,
            errorScenarioSupport: true
          },
          constraints: {
            ...baseConfig.constraints,
            validationComplexity: ComplexityLevel.HIGH
          }
        };

      case 'performance-testing':
        return {
          ...baseConfig,
          constraints: {
            fieldCount: { min: 50, max: 200 },
            documentSize: { min: 1048576, max: 10485760 }, // 1MB to 10MB
            validationComplexity: ComplexityLevel.HIGH
          }
        };

      case 'integration-testing':
        return {
          ...baseConfig,
          dataAlignment: {
            mockCompatibility: true,
            fieldConsistency: true,
            errorScenarioSupport: true
          },
          constraints: {
            ...baseConfig.constraints,
            validationComplexity: ComplexityLevel.MEDIUM
          }
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Generate batch of configurations with different characteristics
   */
  generateConfigurationBatch(count: number, options?: {
    includeVariations: boolean;
    complexityLevels: ComplexityLevel[];
    documentStates: DocumentState[];
  }): MockConfiguration[] {
    const includeVariations = options?.includeVariations ?? true;
    const complexityLevels = options?.complexityLevels || Object.values(ComplexityLevel);
    const documentStates = options?.documentStates || [DocumentState.LOADED, DocumentState.MODIFIED];

    const configurations: MockConfiguration[] = [];

    for (let i = 0; i < count; i++) {
      const complexity = includeVariations 
        ? fc.sample(fc.constantFrom(...complexityLevels), 1)[0]
        : ComplexityLevel.MEDIUM;

      const documentState = includeVariations
        ? fc.sample(fc.constantFrom(...documentStates), 1)[0]
        : DocumentState.LOADED;

      const fieldCount = this.generateFieldCountByComplexity(complexity);

      configurations.push(this.generateMockConfiguration({
        fieldCount,
        documentState,
        validationComplexity: complexity,
        includeErrorScenarios: true,
        errorScenarioCount: this.getErrorScenarioCountByComplexity(complexity)
      }));
    }

    return configurations;
  }

  // Private helper methods

  private generateMinimalConfiguration(): GeneratorConfiguration {
    return {
      dataAlignment: {
        mockCompatibility: true,
        fieldConsistency: true,
        errorScenarioSupport: false
      },
      constraints: {
        fieldCount: { min: 1, max: 3 },
        documentSize: { min: 1024, max: 10240 }, // 1KB to 10KB
        validationComplexity: ComplexityLevel.LOW
      }
    };
  }

  private generateStandardConfiguration(): GeneratorConfiguration {
    return {
      dataAlignment: {
        mockCompatibility: true,
        fieldConsistency: true,
        errorScenarioSupport: true
      },
      constraints: {
        fieldCount: { min: 3, max: 10 },
        documentSize: { min: 10240, max: 1048576 }, // 10KB to 1MB
        validationComplexity: ComplexityLevel.MEDIUM
      }
    };
  }

  private generateComprehensiveConfiguration(): GeneratorConfiguration {
    return {
      dataAlignment: {
        mockCompatibility: true,
        fieldConsistency: true,
        errorScenarioSupport: true
      },
      constraints: {
        fieldCount: { min: 10, max: 50 },
        documentSize: { min: 1048576, max: 10485760 }, // 1MB to 10MB
        validationComplexity: ComplexityLevel.HIGH
      }
    };
  }

  private generateValidationBehaviorByComplexity(complexity: ComplexityLevel): ValidationBehavior {
    switch (complexity) {
      case ComplexityLevel.LOW:
        return this.alignedDataGenerator.generateValidationBehavior(true);
      case ComplexityLevel.HIGH:
        return this.alignedDataGenerator.generateValidationBehavior(false);
      default:
        return this.alignedDataGenerator.generateValidationBehavior();
    }
  }

  private getValidationCountByComplexity(complexity: ComplexityLevel): number {
    switch (complexity) {
      case ComplexityLevel.LOW:
        return 2;
      case ComplexityLevel.HIGH:
        return 8;
      default:
        return 4;
    }
  }

  private getErrorTypesByComplexity(complexity: ComplexityLevel): ErrorType[] {
    const baseErrors = [ErrorType.PDF_LOAD_ERROR, ErrorType.FIELD_NOT_FOUND];
    
    switch (complexity) {
      case ComplexityLevel.LOW:
        return baseErrors;
      case ComplexityLevel.HIGH:
        return [
          ...baseErrors,
          ErrorType.CRYPTO_VALIDATION_ERROR,
          ErrorType.PKCS7_INVALID,
          ErrorType.SIGNATURE_ERROR,
          ErrorType.DATA_ALIGNMENT_ERROR
        ];
      default:
        return [
          ...baseErrors,
          ErrorType.CRYPTO_VALIDATION_ERROR,
          ErrorType.FIELD_VALIDATION_ERROR
        ];
    }
  }

  private generateFieldCountByComplexity(complexity: ComplexityLevel): Range {
    switch (complexity) {
      case ComplexityLevel.LOW:
        return { min: 1, max: 3 };
      case ComplexityLevel.HIGH:
        return { min: 10, max: 25 };
      default:
        return { min: 3, max: 10 };
    }
  }

  private getErrorScenarioCountByComplexity(complexity: ComplexityLevel): number {
    switch (complexity) {
      case ComplexityLevel.LOW:
        return 1;
      case ComplexityLevel.HIGH:
        return 6;
      default:
        return 3;
    }
  }

  private generateErrorPatterns(complexity: ComplexityLevel): Record<string, any> {
    const basePatterns = {
      'PDF_LOAD_ERROR': {
        template: 'Failed to load PDF: {reason}',
        fields: ['reason']
      },
      'FIELD_NOT_FOUND': {
        template: 'Field "{fieldName}" not found in document',
        fields: ['fieldName']
      }
    };

    if (complexity === ComplexityLevel.LOW) {
      return basePatterns;
    }

    const extendedPatterns = {
      ...basePatterns,
      'CRYPTO_VALIDATION_ERROR': {
        template: 'Cryptographic validation failed: {details}',
        fields: ['details']
      },
      'PKCS7_INVALID': {
        template: 'Invalid PKCS#7 signature: {reason}',
        fields: ['reason']
      }
    };

    if (complexity === ComplexityLevel.HIGH) {
      return {
        ...extendedPatterns,
        'SIGNATURE_ERROR': {
          template: 'Signature operation failed: {operation} - {error}',
          fields: ['operation', 'error']
        },
        'DATA_ALIGNMENT_ERROR': {
          template: 'Data alignment error: {expected} vs {actual}',
          fields: ['expected', 'actual']
        }
      };
    }

    return extendedPatterns;
  }
}