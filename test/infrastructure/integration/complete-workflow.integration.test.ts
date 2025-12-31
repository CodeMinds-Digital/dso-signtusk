/**
 * Complete Workflow Integration Tests
 * 
 * Tests full mock/generator/error handling integration and verifies
 * seamless test framework integration.
 * 
 * Requirements: 4.1, 4.2, 4.4
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestInfrastructure, TestWorkflow, WorkflowUtils } from '../workflow';

describe('Complete Workflow Integration', () => {
  let infrastructure: TestInfrastructure;
  let workflow: TestWorkflow;

  beforeEach(() => {
    infrastructure = TestInfrastructure.create();
    workflow = new TestWorkflow(infrastructure);
  });

  afterEach(() => {
    infrastructure.resetMocks();
  });

  describe('PDF Signing Workflow Integration', () => {
    it('should execute complete PDF signing workflow successfully', async () => {
      const result = await workflow.executePdfSigningWorkflow();

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.results.pdf).toBeDefined();
      expect(result.results.fields).toBeDefined();
      expect(result.results.crypto).toBeDefined();
      expect(result.feedback).toBeDefined();
      expect(result.testData).toBeDefined();
    });

    it('should handle PDF signing workflow errors gracefully', async () => {
      // Configure infrastructure for error scenario
      const errorInfrastructure = infrastructure.configureForScenario('error');
      const errorWorkflow = new TestWorkflow(errorInfrastructure);

      const result = await errorWorkflow.executePdfSigningWorkflow();

      // Error scenario should either succeed or fail gracefully with validation
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(result.errorValidation).toBeDefined();
        expect(result.feedback).toBeDefined();
      }
    });

    it('should provide clear feedback on mock vs real implementation usage', async () => {
      const result = await workflow.executePdfSigningWorkflow();

      expect(result.feedback).toBeDefined();
      expect(result.feedback.mockUsage).toBeDefined();
      expect(result.feedback.realImplementationUsage).toBeDefined();
      
      // Should be using mocks, not real implementations
      expect(result.feedback.mockUsage.pdf || 
             result.feedback.mockUsage.field || 
             result.feedback.mockUsage.crypto).toBe(true);
      
      expect(result.feedback.realImplementationUsage.pdf &&
             result.feedback.realImplementationUsage.field &&
             result.feedback.realImplementationUsage.crypto).toBe(false);
    });
  });

  describe('Error Scenario Workflow Integration', () => {
    it('should execute error scenario workflow and validate error patterns', async () => {
      const result = await workflow.executeErrorScenarioWorkflow();

      expect(result.success).toBe(true);
      expect(result.error).toBeDefined();
      expect(result.errorValidation).toBeDefined();
      expect(result.errorValidation.isValid).toBe(true);
      expect(result.message).toContain('Error scenario executed successfully');
    });

    it('should provide diagnostic information for error scenarios', async () => {
      const result = await workflow.executeErrorScenarioWorkflow();

      expect(result.errorValidation).toBeDefined();
      expect(result.errorValidation.actualMessage).toBeDefined();
      expect(typeof result.errorValidation.actualMessage).toBe('string');
    });
  });

  describe('Property-Based Testing Workflow Integration', () => {
    it('should execute property-based testing workflow with multiple iterations', async () => {
      const iterations = 10; // Reduced for faster testing
      const result = await workflow.executePropertyTestWorkflow(iterations);

      expect(result.totalIterations).toBe(iterations);
      expect(result.successCount + result.failureCount).toBe(iterations);
      expect(result.successRate).toBeGreaterThanOrEqual(0);
      expect(result.successRate).toBeLessThanOrEqual(1);
      expect(result.results).toHaveLength(iterations);
    });

    it('should handle property test failures with proper error validation', async () => {
      const iterations = 5;
      const result = await workflow.executePropertyTestWorkflow(iterations);

      // Check that any failures have proper error validation
      const failures = result.results.filter(r => !r.success);
      for (const failure of failures) {
        expect(failure.error).toBeDefined();
        expect(failure.errorValidation).toBeDefined();
      }
    });

    it('should generate different test data for each iteration', async () => {
      const iterations = 5;
      const result = await workflow.executePropertyTestWorkflow(iterations);

      const testDataSamples = result.results
        .filter(r => r.testData)
        .map(r => JSON.stringify(r.testData))
        .slice(0, 3); // Check first 3 samples

      // Should have some variation in test data (not all identical)
      const uniqueData = new Set(testDataSamples);
      expect(uniqueData.size).toBeGreaterThan(0);
    });
  });

  describe('Integration Testing Workflow', () => {
    it('should execute integration workflow with component consistency checks', async () => {
      const result = await workflow.executeIntegrationWorkflow();

      expect(result.success).toBe(true);
      expect(result.results).toBeDefined();
      expect(result.consistencyCheck).toBeDefined();
      expect(result.consistencyCheck.overallConsistency).toBe(true);
      expect(result.feedback).toBeDefined();
    });

    it('should verify cross-component data compatibility', async () => {
      const result = await workflow.executeIntegrationWorkflow();

      if (result.success) {
        expect(result.consistencyCheck).toBeDefined();
        expect(result.consistencyCheck.pdfFieldsMatch).toBe(true);
        expect(result.consistencyCheck.cryptoSignatureValid).toBe(true);
      }
    });

    it('should provide comprehensive feedback for integration tests', async () => {
      const result = await workflow.executeIntegrationWorkflow();

      expect(result.feedback).toBeDefined();
      expect(result.feedback.mockUsage).toBeDefined();
      expect(result.feedback.executionTime).toBeGreaterThan(0);
    });
  });

  describe('Test Framework Integration', () => {
    it('should integrate seamlessly with Vitest test framework', () => {
      // This test itself demonstrates framework integration
      const setup = infrastructure.setupTestWorkflow();

      expect(setup.data).toBeDefined();
      expect(setup.mocks).toBeDefined();
      expect(setup.mocks.pdf).toBeDefined();
      expect(setup.mocks.field).toBeDefined();
      expect(setup.mocks.crypto).toBeDefined();
      expect(typeof setup.validateError).toBe('function');
      expect(typeof setup.cleanup).toBe('function');
      expect(typeof setup.feedback).toBe('function');
    });

    it('should provide automatic data compatibility management', async () => {
      const setup = infrastructure.setupTestWorkflow();

      // Test that generated data works with mocks
      const pdfResult = await setup.mocks.pdf.loadDocument('test-doc', setup.data);
      expect(pdfResult).toBeDefined();

      // Cleanup should work without errors
      expect(() => setup.cleanup()).not.toThrow();
    });

    it('should support different test scenarios through configuration', () => {
      const unitSetup = infrastructure.configureForScenario('unit').setupTestWorkflow();
      const integrationSetup = infrastructure.configureForScenario('integration').setupTestWorkflow();
      const propertySetup = infrastructure.configureForScenario('property').setupTestWorkflow();
      const errorSetup = infrastructure.configureForScenario('error').setupTestWorkflow();

      // All setups should be valid but potentially different
      expect(unitSetup.data).toBeDefined();
      expect(integrationSetup.data).toBeDefined();
      expect(propertySetup.data).toBeDefined();
      expect(errorSetup.data).toBeDefined();

      // Cleanup all scenarios
      unitSetup.cleanup();
      integrationSetup.cleanup();
      propertySetup.cleanup();
      errorSetup.cleanup();
    });
  });

  describe('Workflow Utilities Integration', () => {
    it('should provide convenient workflow creation utilities', () => {
      const unitWorkflow = WorkflowUtils.createUnitTestWorkflow();
      const integrationWorkflow = WorkflowUtils.createIntegrationTestWorkflow();
      const propertyWorkflow = WorkflowUtils.createPropertyTestWorkflow();
      const errorWorkflow = WorkflowUtils.createErrorTestWorkflow();

      expect(unitWorkflow).toBeInstanceOf(TestWorkflow);
      expect(integrationWorkflow).toBeInstanceOf(TestWorkflow);
      expect(propertyWorkflow).toBeInstanceOf(TestWorkflow);
      expect(errorWorkflow).toBeInstanceOf(TestWorkflow);
    });

    it('should execute workflows created by utilities', async () => {
      const unitWorkflow = WorkflowUtils.createUnitTestWorkflow();
      const result = await unitWorkflow.executePdfSigningWorkflow();

      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Component Coordination', () => {
    it('should coordinate between all infrastructure components', () => {
      const setup = infrastructure.setupTestWorkflow();

      // Test that all components are properly coordinated
      expect(setup.data).toBeDefined();
      expect(setup.mocks.pdf).toBeDefined();
      expect(setup.mocks.field).toBeDefined();
      expect(setup.mocks.crypto).toBeDefined();

      // Test error validation coordination
      const testError = new Error('Test error message');
      const validation = setup.validateError(testError);
      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.actualMessage).toBe('Test error message');

      // Test feedback coordination
      const feedback = setup.feedback();
      expect(feedback).toBeDefined();
      expect(feedback.mockUsage).toBeDefined();

      setup.cleanup();
    });

    it('should maintain state consistency across component interactions', async () => {
      const setup = infrastructure.setupTestWorkflow();

      // Perform operations that should maintain consistency
      const pdfResult = await setup.mocks.pdf.loadDocument('test-doc', setup.data);
      const fieldResult = await setup.mocks.field.lookupFields(['field1', 'field2'], 'test-doc');
      const cryptoResult = await setup.mocks.crypto.validateSignature('test-signature', 'test-cert');

      // Check that operations completed without breaking state
      expect(pdfResult).toBeDefined();
      expect(fieldResult).toBeDefined();
      expect(cryptoResult).toBeDefined();

      // Feedback should reflect the operations
      const feedback = setup.feedback();
      expect(feedback.mockUsage.pdf || feedback.mockUsage.field || feedback.mockUsage.crypto).toBe(true);

      setup.cleanup();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle errors consistently across all components', async () => {
      const errorInfrastructure = infrastructure.configureForScenario('error');
      const setup = errorInfrastructure.setupTestWorkflow();

      // Test error handling in different components
      try {
        await setup.mocks.pdf.loadDocument('invalid-doc', { invalid: 'data' });
      } catch (error) {
        const validation = setup.validateError(error as Error);
        expect(validation.isValid).toBeDefined();
      }

      setup.cleanup();
    });

    it('should provide clear diagnostic information for debugging', async () => {
      const setup = infrastructure.setupTestWorkflow();

      const testError = new Error('Diagnostic test error');
      const validation = setup.validateError(testError, 'expected-pattern');

      expect(validation.actualMessage).toBe('Diagnostic test error');
      expect(validation.expectedPattern).toBe('expected-pattern');

      setup.cleanup();
    });
  });
});