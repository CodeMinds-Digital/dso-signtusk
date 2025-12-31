/**
 * Test Coordinator
 * 
 * Coordinates between mock implementations and test data generators for seamless test execution.
 * Provides automatic data compatibility management and unified test infrastructure control.
 */

import { ErrorValidator } from '../errors/error-validator';
import { ErrorType } from '../errors/types';
import { AlignedDataGenerator } from '../generators/aligned-data-generator';
import { ConfigurationGenerator } from '../generators/configuration-generator';
import { MockCoordinator } from '../mocks/mock-coordinator';
import {
    ComplexityLevel,
    DocumentState,
    GeneratorConfiguration,
    MockConfiguration,
    ValidationResult
} from '../mocks/types';

export interface TestCoordinatorOptions {
  autoReset?: boolean;
  enableLogging?: boolean;
  defaultComplexity?: ComplexityLevel;
  mockConfiguration?: Partial<MockConfiguration>;
  generatorConfiguration?: Partial<GeneratorConfiguration>;
}

export interface TestExecutionContext {
  testId: string;
  mockConfiguration: MockConfiguration;
  generatorConfiguration: GeneratorConfiguration;
  executionStartTime: Date;
  mockCoordinator: MockCoordinator;
  dataGenerator: AlignedDataGenerator;
  configGenerator: ConfigurationGenerator;
  errorValidator: ErrorValidator;
}

export interface TestExecutionResult {
  testId: string;
  success: boolean;
  executionTime: number;
  mockStatus: ReturnType<MockCoordinator['getStatus']>;
  generatedDataCount: number;
  validationResults: ValidationResult[];
  errors: Array<{
    type: ErrorType;
    message: string;
    context?: Record<string, any>;
  }>;
  diagnostics: {
    mockUsage: {
      pdf: number;
      field: number;
      crypto: number;
    };
    dataGeneration: {
      documentsGenerated: number;
      fieldsGenerated: number;
      errorScenariosGenerated: number;
    };
    compatibility: {
      dataAlignmentSuccess: boolean;
      mockCompatibilitySuccess: boolean;
      errorHandlingSuccess: boolean;
    };
  };
}

export class TestCoordinator {
  private readonly mockCoordinator: MockCoordinator;
  private readonly dataGenerator: AlignedDataGenerator;
  private readonly configGenerator: ConfigurationGenerator;
  private readonly errorValidator: ErrorValidator;
  private readonly options: Required<TestCoordinatorOptions>;
  private readonly executionHistory: TestExecutionResult[] = [];
  private currentContext: TestExecutionContext | null = null;

  constructor(options: TestCoordinatorOptions = {}) {
    this.options = {
      autoReset: options.autoReset ?? true,
      enableLogging: options.enableLogging ?? false,
      defaultComplexity: options.defaultComplexity ?? ComplexityLevel.MEDIUM,
      mockConfiguration: options.mockConfiguration ?? {},
      generatorConfiguration: options.generatorConfiguration ?? {}
    };

    this.mockCoordinator = new MockCoordinator();
    this.dataGenerator = new AlignedDataGenerator();
    this.configGenerator = new ConfigurationGenerator();
    this.errorValidator = new ErrorValidator();

    this.log('TestCoordinator initialized with options:', this.options);
  }

  /**
   * Create a new test execution context with automatic data compatibility
   */
  async createTestContext(testId: string, options?: {
    complexity?: ComplexityLevel;
    documentState?: DocumentState;
    includeErrorScenarios?: boolean;
    customMockConfig?: Partial<MockConfiguration>;
    customGeneratorConfig?: Partial<GeneratorConfiguration>;
  }): Promise<TestExecutionContext> {
    this.log(`Creating test context for: ${testId}`);

    // Reset mocks if auto-reset is enabled
    if (this.options.autoReset) {
      this.mockCoordinator.resetAll(`Test context creation: ${testId}`);
    }

    // Generate compatible configurations
    const complexity = options?.complexity ?? this.options.defaultComplexity;
    const documentState = options?.documentState ?? DocumentState.LOADED;
    const includeErrorScenarios = options?.includeErrorScenarios ?? true;

    // Generate mock configuration
    const baseMockConfig = this.configGenerator.generateMockConfiguration({
      documentState,
      validationComplexity: complexity,
      includeErrorScenarios,
      fieldCount: this.getFieldCountByComplexity(complexity)
    });

    const mockConfiguration: MockConfiguration = {
      ...baseMockConfig,
      ...this.options.mockConfiguration,
      ...options?.customMockConfig
    };

    // Generate generator configuration
    const baseGeneratorConfig = this.configGenerator.generateGeneratorConfiguration(
      this.getGeneratorProfileByComplexity(complexity)
    );

    const generatorConfiguration: GeneratorConfiguration = {
      ...baseGeneratorConfig,
      ...this.options.generatorConfiguration,
      ...options?.customGeneratorConfig
    };

    // Apply configurations to components
    this.mockCoordinator.updateAllConfigurations(mockConfiguration);

    // Create execution context
    const context: TestExecutionContext = {
      testId,
      mockConfiguration,
      generatorConfiguration,
      executionStartTime: new Date(),
      mockCoordinator: this.mockCoordinator,
      dataGenerator: this.dataGenerator,
      configGenerator: this.configGenerator,
      errorValidator: this.errorValidator
    };

    this.currentContext = context;
    this.log(`Test context created for: ${testId}`, { complexity, documentState, includeErrorScenarios });

    return context;
  }

  /**
   * Execute test with automatic data generation and compatibility management
   */
  async executeTest<T>(
    testId: string,
    testFunction: (context: TestExecutionContext) => Promise<T> | T,
    options?: {
      complexity?: ComplexityLevel;
      documentState?: DocumentState;
      includeErrorScenarios?: boolean;
      validateResults?: boolean;
    }
  ): Promise<{ result: T; executionResult: TestExecutionResult }> {
    const startTime = Date.now();
    this.log(`Executing test: ${testId}`);

    try {
      // Create test context
      const context = await this.createTestContext(testId, options);

      // Execute test function
      const result = await testFunction(context);

      // Validate results if requested
      const validationResults: ValidationResult[] = [];
      if (options?.validateResults ?? true) {
        validationResults.push(...await this.validateTestExecution(context));
      }

      // Create execution result
      const executionResult = this.createExecutionResult(
        testId,
        true,
        Date.now() - startTime,
        validationResults,
        []
      );

      this.executionHistory.push(executionResult);
      this.log(`Test completed successfully: ${testId}`, { executionTime: executionResult.executionTime });

      return { result, executionResult };

    } catch (error) {
      const executionResult = this.createExecutionResult(
        testId,
        false,
        Date.now() - startTime,
        [],
        [{
          type: ErrorType.TEST_EXECUTION_ERROR,
          message: error instanceof Error ? error.message : 'Unknown test execution error',
          context: { error: String(error) }
        }]
      );

      this.executionHistory.push(executionResult);
      this.log(`Test failed: ${testId}`, { error: String(error) });

      throw error;
    } finally {
      // Reset context
      this.currentContext = null;

      // Auto-reset if enabled
      if (this.options.autoReset) {
        this.mockCoordinator.resetAll(`Test completion: ${testId}`);
      }
    }
  }

  /**
   * Generate compatible test data for current context
   */
  generateCompatibleData(dataType: 'pdf' | 'field' | 'crypto' | 'error-scenario', options?: {
    count?: number;
    customConstraints?: Record<string, any>;
  }): any {
    if (!this.currentContext) {
      throw new Error('No active test context. Call createTestContext first.');
    }

    const count = options?.count ?? 1;
    const constraints = options?.customConstraints ?? {};

    this.log(`Generating compatible data: ${dataType}`, { count, constraints });

    switch (dataType) {
      case 'pdf':
        return count === 1 
          ? this.dataGenerator.generatePdfDocument({
              fieldCount: this.currentContext.generatorConfiguration.constraints.fieldCount,
              documentState: this.currentContext.mockConfiguration.pdf.documentState,
              ...constraints
            })
          : Array.from({ length: count }, () => 
              this.dataGenerator.generatePdfDocument({
                fieldCount: this.currentContext.generatorConfiguration.constraints.fieldCount,
                documentState: this.currentContext.mockConfiguration.pdf.documentState,
                ...constraints
              })
            );

      case 'field':
        const fieldCount = constraints.fieldCount ?? 
          this.currentContext.generatorConfiguration.constraints.fieldCount.max;
        return this.dataGenerator.generateFieldDefinitions(fieldCount);

      case 'crypto':
        return this.dataGenerator.generateCryptoValidationData({
          validationCount: count,
          includeSuccessScenarios: true,
          includeFailureScenarios: this.currentContext.generatorConfiguration.dataAlignment.errorScenarioSupport,
          ...constraints
        });

      case 'error-scenario':
        return this.dataGenerator.generateErrorScenarios({
          scenarioCount: count,
          errorTypes: Object.keys(this.currentContext.mockConfiguration.errorPatterns) as ErrorType[],
          includeTriggers: true,
          ...constraints
        });

      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  /**
   * Validate data compatibility with current mock configuration
   */
  async validateDataCompatibility(data: any, dataType: 'pdf' | 'field' | 'crypto'): Promise<ValidationResult> {
    if (!this.currentContext) {
      throw new Error('No active test context. Call createTestContext first.');
    }

    this.log(`Validating data compatibility: ${dataType}`);

    try {
      const mocks = this.mockCoordinator.getMocks();

      switch (dataType) {
        case 'pdf':
          // Test PDF data with PDF mock
          const pdfResult = mocks.pdf.loadDocument(data.id, data);
          return {
            isValid: pdfResult.success,
            message: pdfResult.success ? 'PDF data compatible' : pdfResult.error?.message,
            context: { dataType, documentId: data.id }
          };

        case 'field':
          // Test field data with field mock
          const fieldResults = data.map((field: any) => 
            mocks.field.lookupField(field.name, 'test-doc')
          );
          const allFieldsValid = fieldResults.every((result: any) => result.success || result.field);
          return {
            isValid: allFieldsValid,
            message: allFieldsValid ? 'Field data compatible' : 'Some fields incompatible',
            context: { dataType, fieldCount: data.length }
          };

        case 'crypto':
          // Test crypto data with crypto mock
          const cryptoResult = mocks.crypto.validateSignature(
            data.pkcs7Data,
            data.certificateData
          );
          return {
            isValid: cryptoResult.success,
            message: cryptoResult.success ? 'Crypto data compatible' : cryptoResult.error?.message,
            context: { dataType }
          };

        default:
          return {
            isValid: false,
            message: `Unknown data type: ${dataType}`,
            context: { dataType }
          };
      }
    } catch (error) {
      return {
        isValid: false,
        message: `Compatibility validation failed: ${error}`,
        context: { dataType, error: String(error) }
      };
    }
  }

  /**
   * Get current test execution context
   */
  getCurrentContext(): TestExecutionContext | null {
    return this.currentContext;
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): TestExecutionResult[] {
    return [...this.executionHistory];
  }

  /**
   * Get comprehensive status of all components
   */
  getStatus(): {
    coordinator: {
      activeContext: string | null;
      executionCount: number;
      lastExecution?: Date;
      options: TestCoordinatorOptions;
    };
    mocks: ReturnType<MockCoordinator['getStatus']>;
    compatibility: {
      dataAlignmentEnabled: boolean;
      errorScenarioSupport: boolean;
      mockCompatibilityEnabled: boolean;
    };
  } {
    const lastExecution = this.executionHistory.length > 0 
      ? new Date(this.executionHistory[this.executionHistory.length - 1].executionTime + Date.now() - 1000)
      : undefined;

    return {
      coordinator: {
        activeContext: this.currentContext?.testId ?? null,
        executionCount: this.executionHistory.length,
        lastExecution,
        options: this.options
      },
      mocks: this.mockCoordinator.getStatus(),
      compatibility: {
        dataAlignmentEnabled: this.currentContext?.generatorConfiguration.dataAlignment.mockCompatibility ?? false,
        errorScenarioSupport: this.currentContext?.generatorConfiguration.dataAlignment.errorScenarioSupport ?? false,
        mockCompatibilityEnabled: this.currentContext?.generatorConfiguration.dataAlignment.fieldConsistency ?? false
      }
    };
  }

  /**
   * Reset all components and clear execution history
   */
  reset(clearHistory: boolean = false): void {
    this.log('Resetting TestCoordinator', { clearHistory });

    this.mockCoordinator.resetAll('TestCoordinator reset');
    this.currentContext = null;

    if (clearHistory) {
      this.executionHistory.length = 0;
    }
  }

  // Private helper methods

  private async validateTestExecution(context: TestExecutionContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    // Validate mock state consistency
    const mockStatus = this.mockCoordinator.getStatus();
    results.push({
      isValid: mockStatus.overall.isClean || !this.options.autoReset,
      message: mockStatus.overall.isClean ? 'Mock state consistent' : 'Mock state has residual data',
      context: { validation: 'mock-state', mockStatus }
    });

    // Validate data alignment
    const alignmentValid = context.generatorConfiguration.dataAlignment.mockCompatibility;
    results.push({
      isValid: alignmentValid,
      message: alignmentValid ? 'Data alignment configured' : 'Data alignment not configured',
      context: { validation: 'data-alignment' }
    });

    return results;
  }

  private createExecutionResult(
    testId: string,
    success: boolean,
    executionTime: number,
    validationResults: ValidationResult[],
    errors: Array<{ type: ErrorType; message: string; context?: Record<string, any> }>
  ): TestExecutionResult {
    const mockStatus = this.mockCoordinator.getStatus();

    return {
      testId,
      success,
      executionTime: Math.max(executionTime, 1), // Ensure minimum execution time of 1ms
      mockStatus,
      generatedDataCount: 0, // Would need to track this during execution
      validationResults,
      errors,
      diagnostics: {
        mockUsage: {
          pdf: mockStatus.pdf.operationsPerformed,
          field: mockStatus.field.lookupsPerformed,
          crypto: mockStatus.crypto.operationsPerformed
        },
        dataGeneration: {
          documentsGenerated: 0, // Would need to track this
          fieldsGenerated: 0, // Would need to track this
          errorScenariosGenerated: 0 // Would need to track this
        },
        compatibility: {
          dataAlignmentSuccess: this.currentContext?.generatorConfiguration.dataAlignment.mockCompatibility ?? false,
          mockCompatibilitySuccess: this.currentContext?.generatorConfiguration.dataAlignment.fieldConsistency ?? false,
          errorHandlingSuccess: this.currentContext?.generatorConfiguration.dataAlignment.errorScenarioSupport ?? false
        }
      }
    };
  }

  private getFieldCountByComplexity(complexity: ComplexityLevel): { min: number; max: number } {
    switch (complexity) {
      case ComplexityLevel.LOW:
        return { min: 1, max: 3 };
      case ComplexityLevel.HIGH:
        return { min: 10, max: 25 };
      default:
        return { min: 3, max: 10 };
    }
  }

  private getGeneratorProfileByComplexity(complexity: ComplexityLevel): 'minimal' | 'standard' | 'comprehensive' {
    switch (complexity) {
      case ComplexityLevel.LOW:
        return 'minimal';
      case ComplexityLevel.HIGH:
        return 'comprehensive';
      default:
        return 'standard';
    }
  }

  private log(message: string, data?: any): void {
    if (this.options.enableLogging) {
      console.log(`[TestCoordinator] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  }
}

/**
 * Global test coordinator instance for easy access
 */
export const globalTestCoordinator = new TestCoordinator({
  autoReset: true,
  enableLogging: false,
  defaultComplexity: ComplexityLevel.MEDIUM
});

/**
 * Utility functions for common coordination operations
 */
export const TestCoordinatorUtils = {
  /**
   * Quick test execution with default settings
   */
  executeQuickTest: async <T>(
    testId: string,
    testFunction: (context: TestExecutionContext) => Promise<T> | T
  ) => globalTestCoordinator.executeTest(testId, testFunction),

  /**
   * Create test context with error scenarios
   */
  createErrorTestContext: (testId: string) => 
    globalTestCoordinator.createTestContext(testId, {
      complexity: ComplexityLevel.HIGH,
      includeErrorScenarios: true
    }),

  /**
   * Generate compatible data for current context
   */
  generateData: (dataType: 'pdf' | 'field' | 'crypto' | 'error-scenario', count?: number) =>
    globalTestCoordinator.generateCompatibleData(dataType, { count }),

  /**
   * Reset all components
   */
  reset: () => globalTestCoordinator.reset(),

  /**
   * Get current status
   */
  getStatus: () => globalTestCoordinator.getStatus()
};