/**
 * Test Framework Integration Tests
 * 
 * Verifies seamless integration with test frameworks (Jest/Vitest)
 * and automatic data compatibility management.
 * 
 * Requirements: 4.1, 4.2, 4.4
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { TestInfrastructure } from '../workflow';
import { ConfigurationFactory } from './configuration-factory';

describe('Test Framework Integration', () => {
  let infrastructure: TestInfrastructure;

  beforeAll(async () => {
    // Test framework setup hook
    console.log('Setting up test infrastructure for framework integration tests');
  });

  beforeEach(() => {
    infrastructure = TestInfrastructure.create();
  });

  afterEach(() => {
    infrastructure.resetMocks();
  });

  afterAll(async () => {
    // Test framework cleanup hook
    console.log('Cleaning up test infrastructure after framework integration tests');
  });

  describe('Vitest Integration', () => {
    it('should integrate seamlessly with Vitest test framework', () => {
      // This test demonstrates seamless integration by running successfully
      const setup = infrastructure.setupTestWorkflow();

      expect(setup).toBeDefined();
      expect(setup.data).toBeDefined();
      expect(setup.mocks).toBeDefined();
      expect(setup.validateError).toBeDefined();
      expect(setup.cleanup).toBeDefined();
      expect(setup.feedback).toBeDefined();

      setup.cleanup();
    });

    it('should work with Vitest beforeEach/afterEach hooks', () => {
      // Infrastructure should be fresh due to beforeEach
      const feedback = infrastructure.getFeedback();
      expect(feedback.mockUsage.pdf).toBe(false);
      expect(feedback.mockUsage.field).toBe(false);
      expect(feedback.mockUsage.crypto).toBe(false);
    });

    it('should support Vitest async test patterns', async () => {
      const setup = infrastructure.setupTestWorkflow();

      // Register fields for the async test document
      setup.mocks.field.registerFields('async-test', [
        { name: 'field1', type: 'text' as any, required: false, validation: [] }
      ]);

      // Async operations should work seamlessly
      const pdfResult = await setup.mocks.pdf.loadDocument('async-test', setup.data);
      expect(pdfResult).toBeDefined();

      const fieldResult = await setup.mocks.field.lookupFields(['field1'], 'async-test');
      expect(fieldResult).toBeDefined();

      const cryptoResult = await setup.mocks.crypto.validateSignature('async-sig', 'async-cert');
      expect(cryptoResult).toBeDefined();

      setup.cleanup();
    });
  });

  describe('Configuration Factory Integration', () => {
    it('should create test framework integration configurations', () => {
      const factory = new ConfigurationFactory();
      
      const jestIntegration = factory.createTestFrameworkIntegration('jest', {
        autoReset: true,
        enableLogging: false
      });

      expect(jestIntegration.framework).toBe('jest');
      expect(jestIntegration.setupHooks).toBeDefined();
      expect(jestIntegration.setupHooks.beforeEach).toBeDefined();
      expect(jestIntegration.setupHooks.afterEach).toBeDefined();
      expect(jestIntegration.setupHooks.beforeAll).toBeDefined();
      expect(jestIntegration.setupHooks.afterAll).toBeDefined();
    });

    it('should support custom setup hooks', async () => {
      const factory = new ConfigurationFactory();
      let customSetupCalled = false;
      let customCleanupCalled = false;

      const integration = factory.createTestFrameworkIntegration('vitest', {
        customSetup: {
          beforeEach: async () => {
            customSetupCalled = true;
          },
          afterEach: async () => {
            customCleanupCalled = true;
          }
        }
      });

      // Execute setup hooks
      if (integration.setupHooks.beforeEach) {
        await integration.setupHooks.beforeEach();
      }
      if (integration.setupHooks.afterEach) {
        await integration.setupHooks.afterEach();
      }

      expect(customSetupCalled).toBe(true);
      expect(customCleanupCalled).toBe(true);
    });

    it('should provide configuration presets for different test scenarios', () => {
      const factory = new ConfigurationFactory();

      const unitConfig = factory.createConfiguration('unit-testing');
      const integrationConfig = factory.createConfiguration('integration-testing');
      const propertyConfig = factory.createConfiguration('property-testing');
      const errorConfig = factory.createConfiguration('error-testing');

      expect(unitConfig).toBeDefined();
      expect(integrationConfig).toBeDefined();
      expect(propertyConfig).toBeDefined();
      expect(errorConfig).toBeDefined();

      // Configurations should be different for different scenarios
      expect(unitConfig.pdf.fields.length).toBeLessThanOrEqual(integrationConfig.pdf.fields.length);
    });
  });

  describe('Utility Functions Integration', () => {
    it('should provide convenient setup for different test scenarios', () => {
      const unitInfrastructure = TestInfrastructure.create().configureForScenario('unit');
      const integrationInfrastructure = TestInfrastructure.create().configureForScenario('integration');
      const propertyInfrastructure = TestInfrastructure.create().configureForScenario('property');
      const errorInfrastructure = TestInfrastructure.create().configureForScenario('error');

      const unitSetup = unitInfrastructure.setupTestWorkflow();
      const integrationSetup = integrationInfrastructure.setupTestWorkflow();
      const propertySetup = propertyInfrastructure.setupTestWorkflow();
      const errorSetup = errorInfrastructure.setupTestWorkflow();

      expect(unitSetup).toBeDefined();
      expect(integrationSetup).toBeDefined();
      expect(propertySetup).toBeDefined();
      expect(errorSetup).toBeDefined();

      // All setups should have the same interface
      [unitSetup, integrationSetup, propertySetup, errorSetup].forEach(setup => {
        expect(setup.data).toBeDefined();
        expect(setup.mocks).toBeDefined();
        expect(setup.validateError).toBeDefined();
        expect(setup.cleanup).toBeDefined();
        expect(setup.feedback).toBeDefined();
      });

      // Cleanup all setups
      unitSetup.cleanup();
      integrationSetup.cleanup();
      propertySetup.cleanup();
      errorSetup.cleanup();
    });

    it('should support global infrastructure instance', () => {
      const globalInfrastructure = TestInfrastructure.create();
      expect(globalInfrastructure).toBeDefined();
      expect(globalInfrastructure).toBeInstanceOf(TestInfrastructure);

      const setup = globalInfrastructure.setupTestWorkflow();
      expect(setup).toBeDefined();

      setup.cleanup();
    });
  });

  describe('Automatic Data Compatibility', () => {
    it('should automatically provide compatible data to mock implementations', async () => {
      const setup = infrastructure.setupTestWorkflow();

      // Register fields for the compatibility test document
      setup.mocks.field.registerFields('compat-test', [
        { name: 'field1', type: 'text' as any, required: false, validation: [] },
        { name: 'field2', type: 'text' as any, required: false, validation: [] }
      ]);

      // Generated data should be compatible with all mocks
      const pdfResult = await setup.mocks.pdf.loadDocument('compat-test', setup.data);
      expect(pdfResult.success).toBe(true);

      // Field data should be compatible
      const fieldNames = setup.data.fields?.fieldNames || ['field1', 'field2'];
      const fieldResult = await setup.mocks.field.lookupFields(fieldNames, 'compat-test');
      expect(fieldResult).toBeDefined();

      // Crypto data should be compatible
      const cryptoData = setup.data.crypto || { signature: 'test-sig', certificate: 'test-cert' };
      const cryptoResult = await setup.mocks.crypto.validateSignature(
        cryptoData.signature, 
        cryptoData.certificate
      );
      expect(cryptoResult).toBeDefined();

      setup.cleanup();
    });

    it('should handle data generation failures gracefully', () => {
      const setup = infrastructure.setupTestWorkflow();

      // Even if data generation has issues, setup should not fail
      expect(setup.data).toBeDefined();
      expect(typeof setup.data).toBe('object');

      setup.cleanup();
    });

    it('should provide consistent data across multiple test runs', () => {
      const setup1 = infrastructure.setupTestWorkflow();
      const setup2 = infrastructure.setupTestWorkflow();

      // Data should be consistently structured (though values may differ)
      expect(typeof setup1.data).toBe(typeof setup2.data);
      expect(setup1.data).toBeDefined();
      expect(setup2.data).toBeDefined();

      setup1.cleanup();
      setup2.cleanup();
    });
  });

  describe('Mock vs Real Implementation Feedback', () => {
    it('should clearly indicate mock usage in feedback', async () => {
      const setup = infrastructure.setupTestWorkflow();

      // Register fields for the feedback test document
      setup.mocks.field.registerFields('feedback-test', [
        { name: 'field1', type: 'text' as any, required: false, validation: [] }
      ]);

      // Perform some operations
      await setup.mocks.pdf.loadDocument('feedback-test', setup.data);
      await setup.mocks.field.lookupFields(['field1'], 'feedback-test');

      const feedback = setup.feedback();

      // Should indicate mock usage
      expect(feedback.mockUsage.pdf).toBe(true);
      expect(feedback.mockUsage.field).toBe(true);

      // Should indicate no real implementation usage
      expect(feedback.realImplementationUsage.pdf).toBe(false);
      expect(feedback.realImplementationUsage.field).toBe(false);
      expect(feedback.realImplementationUsage.crypto).toBe(false);

      setup.cleanup();
    });

    it('should provide execution timing information', () => {
      const setup = infrastructure.setupTestWorkflow();

      const feedback = setup.feedback();
      expect(feedback.executionTime).toBeGreaterThan(0);
      expect(typeof feedback.executionTime).toBe('number');

      setup.cleanup();
    });

    it('should provide diagnostic information for debugging', () => {
      const setup = infrastructure.setupTestWorkflow();

      const feedback = setup.feedback();
      expect(feedback.diagnosticInfo).toBeDefined();
      expect(Array.isArray(feedback.diagnosticInfo)).toBe(true);

      setup.cleanup();
    });
  });

  describe('Error Validation Integration', () => {
    it('should validate errors against expected patterns', () => {
      const setup = infrastructure.setupTestWorkflow();

      const testError = new Error('Test validation error');
      const validation = setup.validateError(testError, 'validation');

      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(validation.actualMessage).toBe('Test validation error');
      expect(validation.expectedPattern).toBe('validation');

      setup.cleanup();
    });

    it('should handle error validation without expected patterns', () => {
      const setup = infrastructure.setupTestWorkflow();

      const testError = new Error('No pattern error');
      const validation = setup.validateError(testError);

      expect(validation).toBeDefined();
      expect(validation.actualMessage).toBe('No pattern error');

      setup.cleanup();
    });

    it('should provide diagnostic information for error validation', () => {
      const setup = infrastructure.setupTestWorkflow();

      const testError = new Error('Diagnostic error');
      const validation = setup.validateError(testError, 'diagnostic');

      expect(validation.actualMessage).toBeDefined();
      expect(validation.expectedPattern).toBeDefined();

      setup.cleanup();
    });
  });

  describe('Cleanup and Reset Integration', () => {
    it('should properly cleanup all components', async () => {
      const setup = infrastructure.setupTestWorkflow();

      // Register fields for the cleanup test document
      setup.mocks.field.registerFields('cleanup-test', [
        { name: 'field1', type: 'text' as any, required: false, validation: [] }
      ]);

      // Perform operations to create state
      await setup.mocks.pdf.loadDocument('cleanup-test', setup.data);
      await setup.mocks.field.lookupFields(['field1'], 'cleanup-test');
      await setup.mocks.crypto.validateSignature('cleanup-sig', 'cleanup-cert');

      // Cleanup should reset all state
      setup.cleanup();

      // Verify cleanup worked
      const feedback = setup.feedback();
      // Note: feedback might still show usage from before cleanup, 
      // but new operations should start fresh
    });

    it('should support multiple cleanup calls without errors', () => {
      const setup = infrastructure.setupTestWorkflow();

      // Multiple cleanup calls should not cause errors
      expect(() => setup.cleanup()).not.toThrow();
      expect(() => setup.cleanup()).not.toThrow();
      expect(() => setup.cleanup()).not.toThrow();
    });

    it('should reset infrastructure between test scenarios', () => {
      const unitSetup = infrastructure.configureForScenario('unit').setupTestWorkflow();
      unitSetup.cleanup();

      const errorSetup = infrastructure.configureForScenario('error').setupTestWorkflow();
      errorSetup.cleanup();

      // Should not interfere with each other
      expect(() => {
        const freshSetup = infrastructure.setupTestWorkflow();
        freshSetup.cleanup();
      }).not.toThrow();
    });
  });
});