/**
 * Test Infrastructure - Main Integration Module
 * 
 * This module provides the main entry point for the test infrastructure,
 * wiring together all components (mocks, generators, error handling, and coordination).
 * 
 * Usage:
 * ```typescript
 * import { TestInfrastructure } from './test/infrastructure';
 * 
 * // Initialize infrastructure for a test
 * const infrastructure = TestInfrastructure.create();
 * 
 * // Use in tests
 * const mockData = infrastructure.generateTestData();
 * const mockPdf = infrastructure.createPdfMock(mockData.pdf);
 * ```
 */

// Core component exports
export * from './config';
export * from './errors';
export * from './generators';
export * from './integration';
export * from './mocks';
export * from './types';
export * from './workflow';

// Main infrastructure class
import { TestInfrastructureConfig } from './config';
import { ErrorValidator } from './errors';
import { AlignedDataGenerator, ConfigurationGenerator } from './generators';
import { ConfigurationFactory, TestCoordinator } from './integration';
import { MockCoordinator } from './mocks';
import type { TestExecutionFeedback } from './types';

/**
 * Main test infrastructure class that coordinates all components
 */
export class TestInfrastructure {
  private constructor(
    private readonly coordinator: TestCoordinator,
    private readonly configFactory: ConfigurationFactory,
    private readonly dataGenerator: AlignedDataGenerator,
    private readonly configGenerator: ConfigurationGenerator,
    private readonly mockCoordinator: MockCoordinator,
    private readonly errorValidator: ErrorValidator
  ) {}

  /**
   * Create a new test infrastructure instance with default configuration
   */
  static create(config?: Partial<TestInfrastructureConfig>): TestInfrastructure {
    const configFactory = new ConfigurationFactory();
    const coordinator = new TestCoordinator();
    const dataGenerator = new AlignedDataGenerator();
    const configGenerator = new ConfigurationGenerator();
    const mockCoordinator = new MockCoordinator();
    const errorValidator = new ErrorValidator();

    return new TestInfrastructure(
      coordinator,
      configFactory,
      dataGenerator,
      configGenerator,
      mockCoordinator,
      errorValidator
    );
  }

  /**
   * Generate aligned test data for all components
   */
  generateTestData() {
    return this.dataGenerator.generatePdfDocument();
  }

  /**
   * Create a configured PDF mock
   */
  createPdfMock(config?: any) {
    const mockConfig = this.configGenerator.generateMockConfiguration();
    const mocks = this.mockCoordinator.getMocks();
    if (config) {
      mocks.pdf.updateConfiguration(config);
    }
    return mocks.pdf;
  }

  /**
   * Create a configured field mock
   */
  createFieldMock(config?: any) {
    const mocks = this.mockCoordinator.getMocks();
    if (config) {
      mocks.field.updateConfiguration(config);
    }
    return mocks.field;
  }

  /**
   * Create a configured crypto mock
   */
  createCryptoMock(config?: any) {
    const mocks = this.mockCoordinator.getMocks();
    if (config) {
      mocks.crypto.updateConfiguration(config);
    }
    return mocks.crypto;
  }

  /**
   * Reset all mocks to clean state
   */
  resetMocks() {
    this.mockCoordinator.resetAll();
  }

  /**
   * Validate error messages against expected patterns
   */
  validateError(error: Error, expectedPattern?: string) {
    return this.errorValidator.validate(error.message, expectedPattern);
  }

  /**
   * Get test execution feedback
   */
  getFeedback(): TestExecutionFeedback {
    const status = this.mockCoordinator.getStatus();
    return {
      mockUsage: {
        pdf: status.pdf.operationsPerformed > 0,
        field: status.field.lookupsPerformed > 0,
        crypto: status.crypto.operationsPerformed > 0
      },
      realImplementationUsage: {
        pdf: false,
        field: false,
        crypto: false
      },
      executionTime: Date.now(),
      diagnosticInfo: []
    };
  }

  /**
   * Configure the infrastructure for a specific test scenario
   */
  configureForScenario(scenario: 'unit' | 'integration' | 'property' | 'error') {
    const scenarioMap = {
      'unit': 'unit-testing',
      'integration': 'integration-testing',
      'property': 'property-testing',
      'error': 'error-testing'
    } as const;
    
    const config = this.configFactory.createConfiguration(scenarioMap[scenario] as any);
    this.mockCoordinator.updateAllConfigurations(config);
    return this;
  }

  /**
   * Create a complete test workflow setup
   */
  setupTestWorkflow(): TestSetup {
    return {
      // Generate compatible test data
      data: this.generateTestData(),
      
      // Create configured mocks
      mocks: {
        pdf: this.createPdfMock(),
        field: this.createFieldMock(),
        crypto: this.createCryptoMock()
      },
      
      // Provide error validation
      validateError: (error: Error, pattern?: string) => this.validateError(error, pattern),
      
      // Provide cleanup
      cleanup: () => this.resetMocks(),
      
      // Provide feedback
      feedback: () => this.getFeedback()
    };
  }
}

/**
 * Global infrastructure instance for convenience
 */
export const globalTestInfrastructure = TestInfrastructure.create();

/**
 * Utility functions for common test infrastructure operations
 */
export const TestInfrastructureUtils = {
  /**
   * Quick setup for unit tests
   */
  setupUnitTest: () => globalTestInfrastructure.configureForScenario('unit').setupTestWorkflow(),
  
  /**
   * Quick setup for integration tests
   */
  setupIntegrationTest: () => globalTestInfrastructure.configureForScenario('integration').setupTestWorkflow(),
  
  /**
   * Quick setup for property-based tests
   */
  setupPropertyTest: () => globalTestInfrastructure.configureForScenario('property').setupTestWorkflow(),
  
  /**
   * Quick setup for error scenario tests
   */
  setupErrorTest: () => globalTestInfrastructure.configureForScenario('error').setupTestWorkflow()
};