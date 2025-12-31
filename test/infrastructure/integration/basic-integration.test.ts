/**
 * Basic Integration Tests
 * 
 * Simple tests to verify basic integration functionality works.
 * Requirements: 4.1, 4.2, 4.4
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TestInfrastructure } from '../workflow';

describe('Basic Integration Tests', () => {
  let infrastructure: TestInfrastructure;

  beforeEach(() => {
    infrastructure = TestInfrastructure.create();
  });

  afterEach(() => {
    infrastructure.resetMocks();
  });

  describe('Infrastructure Creation', () => {
    it('should create infrastructure successfully', () => {
      expect(infrastructure).toBeDefined();
      expect(infrastructure).toBeInstanceOf(TestInfrastructure);
    });

    it('should provide test workflow setup', () => {
      const setup = infrastructure.setupTestWorkflow();

      expect(setup).toBeDefined();
      expect(setup.data).toBeDefined();
      expect(setup.mocks).toBeDefined();
      expect(setup.mocks.pdf).toBeDefined();
      expect(setup.mocks.field).toBeDefined();
      expect(setup.mocks.crypto).toBeDefined();
      expect(typeof setup.validateError).toBe('function');
      expect(typeof setup.cleanup).toBe('function');
      expect(typeof setup.feedback).toBe('function');

      setup.cleanup();
    });
  });

  describe('Mock Integration', () => {
    it('should create and configure mocks', () => {
      const pdfMock = infrastructure.createPdfMock();
      const fieldMock = infrastructure.createFieldMock();
      const cryptoMock = infrastructure.createCryptoMock();

      expect(pdfMock).toBeDefined();
      expect(fieldMock).toBeDefined();
      expect(cryptoMock).toBeDefined();
    });

    it('should reset mocks successfully', () => {
      expect(() => infrastructure.resetMocks()).not.toThrow();
    });
  });

  describe('Data Generation', () => {
    it('should generate test data', () => {
      const data = infrastructure.generateTestData();
      expect(data).toBeDefined();
      expect(typeof data).toBe('object');
    });
  });

  describe('Error Validation', () => {
    it('should validate errors', () => {
      const testError = new Error('Test error message');
      const validation = infrastructure.validateError(testError);

      expect(validation).toBeDefined();
      expect(validation.isValid).toBeDefined();
      expect(typeof validation.isValid).toBe('boolean');
    });
  });

  describe('Feedback System', () => {
    it('should provide execution feedback', () => {
      const feedback = infrastructure.getFeedback();

      expect(feedback).toBeDefined();
      expect(feedback.mockUsage).toBeDefined();
      expect(feedback.realImplementationUsage).toBeDefined();
      expect(feedback.executionTime).toBeDefined();
      expect(feedback.diagnosticInfo).toBeDefined();
    });
  });

  describe('Scenario Configuration', () => {
    it('should configure for different scenarios', () => {
      expect(() => infrastructure.configureForScenario('unit')).not.toThrow();
      expect(() => infrastructure.configureForScenario('integration')).not.toThrow();
      expect(() => infrastructure.configureForScenario('property')).not.toThrow();
      expect(() => infrastructure.configureForScenario('error')).not.toThrow();
    });

    it('should return configured infrastructure', () => {
      const unitInfrastructure = infrastructure.configureForScenario('unit');
      expect(unitInfrastructure).toBe(infrastructure); // Should return same instance
    });
  });

  describe('Component Coordination', () => {
    it('should coordinate all components without errors', () => {
      const setup = infrastructure.setupTestWorkflow();

      // Basic operations should not throw
      expect(() => setup.feedback()).not.toThrow();
      expect(() => setup.cleanup()).not.toThrow();

      // Error validation should work
      const testError = new Error('Coordination test error');
      expect(() => setup.validateError(testError)).not.toThrow();
    });
  });
});