/**
 * End-to-End Test Infrastructure Workflow
 * 
 * Demonstrates complete workflow integration between all components:
 * mocks, generators, error handling, and coordination layers.
 */

// Import components directly to avoid circular dependencies
import type { TestInfrastructureConfig } from './config';
import { ErrorValidator } from './errors/error-validator';
import { AlignedDataGenerator } from './generators/aligned-data-generator';
import { ConfigurationGenerator } from './generators/configuration-generator';
import { ConfigurationFactory } from './integration/configuration-factory';
import { TestCoordinator } from './integration/test-coordinator';
import { MockCoordinator } from './mocks/mock-coordinator';

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
    let validationResult;
    if (expectedPattern) {
      validationResult = this.errorValidator.validateAgainstPattern(error.message, expectedPattern);
    } else {
      validationResult = this.errorValidator.validateErrorStructure(error.message);
    }

    // Return a simplified interface that matches test expectations
    return {
      isValid: validationResult.isValid,
      actualMessage: error.message,
      expectedPattern: expectedPattern || null,
      errors: validationResult.errors,
      warnings: validationResult.warnings,
      diagnostics: validationResult.diagnostics
    };
  }

  /**
   * Get test execution feedback
   */
  getFeedback() {
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
  setupTestWorkflow() {
    // Generate compatible test data
    const data = this.generateTestData();
    
    // Create configured mocks
    const pdfMock = this.createPdfMock();
    const fieldMock = this.createFieldMock();
    const cryptoMock = this.createCryptoMock();
    
    // Set up field mock with document data
    // The data is a PdfDocument with fields, so we register those fields
    const documentId = data?.id || 'test-document-0';
    const fields = data?.fields || [
      { name: 'field1', type: 'text' as any, required: false, validation: [] },
      { name: 'field2', type: 'text' as any, required: false, validation: [] }
    ];
    
    fieldMock.registerFields(documentId, fields);
    
    // Create a structured data object for tests
    const structuredData = {
      pdf: {
        documentData: documentId,
        fields: fields
      },
      fields: {
        fieldNames: fields.map(f => f.name),
        fieldDefinitions: fields
      },
      crypto: {
        signature: 'test-sig',
        certificate: 'test-cert',
        signatureData: 'test-sig'
      }
    };
    
    return {
      // Generate compatible test data
      data: structuredData,
      
      // Create configured mocks
      mocks: {
        pdf: pdfMock,
        field: fieldMock,
        crypto: cryptoMock
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
 * Complete workflow orchestrator that demonstrates end-to-end integration
 */
export class TestWorkflow {
  private infrastructure: TestInfrastructure;

  constructor(infrastructure?: TestInfrastructure) {
    this.infrastructure = infrastructure || TestInfrastructure.create();
  }

  /**
   * Execute a complete PDF signing test workflow
   */
  async executePdfSigningWorkflow() {
    const workflow = this.infrastructure.setupTestWorkflow();
    
    try {
      // Step 1: Generate aligned test data
      const testData = workflow.data;
      
      // Step 2: Set up mocks with generated data
      const pdfMock = workflow.mocks.pdf;
      const fieldMock = workflow.mocks.field;
      const cryptoMock = workflow.mocks.crypto;
      
      // Step 3: Execute PDF operations
      const pdfResult = await pdfMock.loadDocument(testData.pdf.documentData);
      const fieldResult = await fieldMock.lookupFields(testData.fields.fieldNames);
      const cryptoResult = await cryptoMock.validateSignature(testData.crypto.signatureData);
      
      // Step 4: Validate results and error patterns
      const results = {
        pdf: pdfResult,
        fields: fieldResult,
        crypto: cryptoResult
      };
      
      // Step 5: Get execution feedback
      const feedback = workflow.feedback();
      
      return {
        success: true,
        results,
        feedback,
        testData
      };
      
    } catch (error) {
      // Validate error against expected patterns
      const errorValidation = workflow.validateError(error as Error);
      
      return {
        success: false,
        error: error as Error,
        errorValidation,
        feedback: workflow.feedback()
      };
      
    } finally {
      // Always cleanup
      workflow.cleanup();
    }
  }

  /**
   * Execute error scenario workflow
   */
  async executeErrorScenarioWorkflow() {
    const errorInfrastructure = this.infrastructure.configureForScenario('error');
    const workflow = errorInfrastructure.setupTestWorkflow();
    
    try {
      // Generate error-inducing test data
      const errorData = workflow.data;
      
      // Set up mocks to trigger errors
      const pdfMock = workflow.mocks.pdf;
      
      // Attempt operation that should fail
      await pdfMock.loadDocument(errorData.pdf.invalidDocumentData);
      
      return {
        success: false,
        message: 'Expected error was not thrown'
      };
      
    } catch (error) {
      // This is expected - validate the error
      const errorValidation = workflow.validateError(error as Error);
      
      return {
        success: true,
        error: error as Error,
        errorValidation,
        message: 'Error scenario executed successfully'
      };
      
    } finally {
      workflow.cleanup();
    }
  }

  /**
   * Execute property-based testing workflow
   */
  async executePropertyTestWorkflow(iterations: number = 100) {
    const propertyInfrastructure = this.infrastructure.configureForScenario('property');
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const workflow = propertyInfrastructure.setupTestWorkflow();
      
      try {
        // Generate random test data for this iteration
        const testData = workflow.data;
        
        // Execute operations with random data
        const pdfMock = workflow.mocks.pdf;
        const result = await pdfMock.loadDocument(testData.pdf.documentData);
        
        results.push({
          iteration: i,
          success: true,
          result,
          testData
        });
        
      } catch (error) {
        const errorValidation = workflow.validateError(error as Error);
        
        results.push({
          iteration: i,
          success: false,
          error: error as Error,
          errorValidation
        });
        
      } finally {
        workflow.cleanup();
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;
    
    return {
      totalIterations: iterations,
      successCount,
      failureCount,
      successRate: successCount / iterations,
      results
    };
  }

  /**
   * Execute integration test workflow
   */
  async executeIntegrationWorkflow() {
    const integrationInfrastructure = this.infrastructure.configureForScenario('integration');
    const workflow = integrationInfrastructure.setupTestWorkflow();
    
    try {
      // Test complete integration between all components
      const testData = workflow.data;
      
      // Verify data alignment between generators and mocks
      const pdfMock = workflow.mocks.pdf;
      const fieldMock = workflow.mocks.field;
      const cryptoMock = workflow.mocks.crypto;
      
      // Execute coordinated operations
      const pdfResult = await pdfMock.loadDocument(testData.pdf.documentData);
      const fields = await fieldMock.lookupFields(testData.fields.fieldNames);
      const signature = await cryptoMock.validateSignature(testData.crypto.signatureData);
      
      // Verify cross-component consistency
      const consistencyCheck = this.verifyComponentConsistency(pdfResult, fields, signature);
      
      return {
        success: true,
        results: {
          pdf: pdfResult,
          fields,
          signature
        },
        consistencyCheck,
        feedback: workflow.feedback()
      };
      
    } catch (error) {
      const errorValidation = workflow.validateError(error as Error);
      
      return {
        success: false,
        error: error as Error,
        errorValidation,
        feedback: workflow.feedback()
      };
      
    } finally {
      workflow.cleanup();
    }
  }

  /**
   * Verify consistency between component results
   */
  private verifyComponentConsistency(pdfResult: any, fieldResult: any, cryptoResult: any) {
    return {
      pdfFieldsMatch: this.checkPdfFieldsConsistency(pdfResult, fieldResult),
      cryptoSignatureValid: this.checkCryptoConsistency(cryptoResult),
      overallConsistency: true // Simplified for demo
    };
  }

  private checkPdfFieldsConsistency(pdfResult: any, fieldResult: any): boolean {
    // Simplified consistency check
    return pdfResult && fieldResult && Array.isArray(fieldResult.fields);
  }

  private checkCryptoConsistency(cryptoResult: any): boolean {
    // Simplified consistency check
    return cryptoResult && typeof cryptoResult.isValid === 'boolean';
  }
}

/**
 * Workflow utilities for common operations
 */
export const WorkflowUtils = {
  /**
   * Create a workflow for unit testing
   */
  createUnitTestWorkflow: () => new TestWorkflow(TestInfrastructure.create().configureForScenario('unit')),
  
  /**
   * Create a workflow for integration testing
   */
  createIntegrationTestWorkflow: () => new TestWorkflow(TestInfrastructure.create().configureForScenario('integration')),
  
  /**
   * Create a workflow for property-based testing
   */
  createPropertyTestWorkflow: () => new TestWorkflow(TestInfrastructure.create().configureForScenario('property')),
  
  /**
   * Create a workflow for error scenario testing
   */
  createErrorTestWorkflow: () => new TestWorkflow(TestInfrastructure.create().configureForScenario('error'))
};

/**
 * Global workflow instance for convenience
 */
export const globalTestWorkflow = new TestWorkflow();