/**
 * Test Infrastructure Integration Foundation Tests
 * 
 * Tests to verify that the test infrastructure foundation components
 * work together correctly and fast-check integration is functional.
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
    createPropertyTestTag,
    DEFAULT_PROPERTY_TEST_CONFIG,
    TEST_INFRASTRUCTURE_CONFIG
} from './config';

describe('Test Infrastructure Integration Foundation', () => {
  it('should have all configuration components available', () => {
    expect(TEST_INFRASTRUCTURE_CONFIG).toBeDefined();
    expect(TEST_INFRASTRUCTURE_CONFIG.mock).toBeDefined();
    expect(TEST_INFRASTRUCTURE_CONFIG.generator).toBeDefined();
    expect(TEST_INFRASTRUCTURE_CONFIG.error).toBeDefined();
    expect(TEST_INFRASTRUCTURE_CONFIG.integration).toBeDefined();
  });

  it('should support property-based testing with fast-check', () => {
    const tag = createPropertyTestTag(1, 'Foundation Integration Test');
    expect(tag).toBe('Feature: test-infrastructure-improvement, Property 1: Foundation Integration Test');

    // Run a property test to verify fast-check integration
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 1, max: 100 })),
        (numbers) => {
          const sum = numbers.reduce((a, b) => a + b, 0);
          return sum >= 0; // Sum of positive integers should be positive
        }
      ),
      {
        ...DEFAULT_PROPERTY_TEST_CONFIG,
        numRuns: 10, // Reduced for quick test
      }
    );
  });

  it('should have proper mock configuration structure', () => {
    const mockConfig = TEST_INFRASTRUCTURE_CONFIG.mock;
    
    expect(mockConfig.pdf.defaultFieldCount).toBe(5);
    expect(mockConfig.pdf.supportedFieldTypes).toContain('signature');
    expect(mockConfig.field.supportedFormats).toContain('email');
    expect(mockConfig.crypto.supportedAlgorithms).toContain('SHA256');
  });

  it('should have proper generator configuration structure', () => {
    const generatorConfig = TEST_INFRASTRUCTURE_CONFIG.generator;
    
    expect(generatorConfig.alignment.mockCompatibility).toBe(true);
    expect(generatorConfig.constraints.fieldCount.min).toBe(1);
    expect(generatorConfig.errorScenarios.frequency).toBe(0.2);
  });

  it('should have proper error configuration structure', () => {
    const errorConfig = TEST_INFRASTRUCTURE_CONFIG.error;
    
    expect(errorConfig.patterns.includeDiagnostics).toBe(true);
    expect(errorConfig.validation.strictPatternMatching).toBe(true);
  });

  it('should have proper integration configuration structure', () => {
    const integrationConfig = TEST_INFRASTRUCTURE_CONFIG.integration;
    
    expect(integrationConfig.framework.autoMockReset).toBe(true);
    expect(integrationConfig.coordination.autoDataAlignment).toBe(true);
  });
});