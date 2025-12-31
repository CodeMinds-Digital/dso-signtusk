/**
 * Property Test: Generator Configuration Effectiveness
 * 
 * Feature: test-infrastructure-improvement, Property 7: Generator Configuration Effectiveness
 * Validates: Requirements 2.5
 * 
 * Tests that different generator configurations produce measurably different data characteristics
 * appropriate for their intended test scenarios.
 */

import * as fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { ComplexityLevel, DocumentState } from '../mocks/types';
import { ConfigurationGenerator } from './configuration-generator';

describe('Property Test: Generator Configuration Effectiveness', () => {
  test('Property 7: Generator Configuration Effectiveness - Different configurations produce different characteristics', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('minimal', 'standard', 'comprehensive'),
        (profile) => {
          const generator = new ConfigurationGenerator();
          
          // Generate configuration for the profile
          const config = generator.generateGeneratorConfiguration(profile as 'minimal' | 'standard' | 'comprehensive');
          
          // Verify configuration structure
          expect(config.dataAlignment).toBeDefined();
          expect(config.constraints).toBeDefined();
          
          // Verify data alignment properties
          expect(typeof config.dataAlignment.mockCompatibility).toBe('boolean');
          expect(typeof config.dataAlignment.fieldConsistency).toBe('boolean');
          expect(typeof config.dataAlignment.errorScenarioSupport).toBe('boolean');
          
          // Verify constraints structure
          expect(config.constraints.fieldCount).toBeDefined();
          expect(config.constraints.documentSize).toBeDefined();
          expect(config.constraints.validationComplexity).toBeDefined();
          
          // Verify field count ranges are valid
          expect(config.constraints.fieldCount.min).toBeGreaterThan(0);
          expect(config.constraints.fieldCount.max).toBeGreaterThanOrEqual(config.constraints.fieldCount.min);
          
          // Verify document size ranges are valid
          expect(config.constraints.documentSize.min).toBeGreaterThan(0);
          expect(config.constraints.documentSize.max).toBeGreaterThanOrEqual(config.constraints.documentSize.min);
          
          // Verify complexity level is valid
          expect(Object.values(ComplexityLevel)).toContain(config.constraints.validationComplexity);
          
          // Profile-specific validations
          switch (profile) {
            case 'minimal':
              expect(config.constraints.fieldCount.max).toBeLessThanOrEqual(5);
              expect(config.constraints.validationComplexity).toBe(ComplexityLevel.LOW);
              expect(config.dataAlignment.errorScenarioSupport).toBe(false);
              break;
              
            case 'comprehensive':
              expect(config.constraints.fieldCount.min).toBeGreaterThanOrEqual(10);
              expect(config.constraints.validationComplexity).toBe(ComplexityLevel.HIGH);
              expect(config.dataAlignment.errorScenarioSupport).toBe(true);
              break;
              
            case 'standard':
              expect(config.constraints.fieldCount.min).toBeGreaterThanOrEqual(3);
              expect(config.constraints.fieldCount.max).toBeLessThanOrEqual(10);
              expect(config.constraints.validationComplexity).toBe(ComplexityLevel.MEDIUM);
              expect(config.dataAlignment.errorScenarioSupport).toBe(true);
              break;
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Property 7a: Scenario configurations produce appropriate characteristics', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('error-testing', 'performance-testing', 'integration-testing'),
        (scenario) => {
          const generator = new ConfigurationGenerator();
          
          // Generate configuration for the scenario
          const config = generator.generateScenarioConfiguration(scenario as 'error-testing' | 'performance-testing' | 'integration-testing');
          
          // Verify basic structure
          expect(config.dataAlignment).toBeDefined();
          expect(config.constraints).toBeDefined();
          
          // Scenario-specific validations
          switch (scenario) {
            case 'error-testing':
              expect(config.dataAlignment.errorScenarioSupport).toBe(true);
              expect(config.constraints.validationComplexity).toBe(ComplexityLevel.HIGH);
              break;
              
            case 'performance-testing':
              expect(config.constraints.fieldCount.min).toBeGreaterThanOrEqual(50);
              expect(config.constraints.documentSize.min).toBeGreaterThanOrEqual(1048576); // 1MB
              expect(config.constraints.validationComplexity).toBe(ComplexityLevel.HIGH);
              break;
              
            case 'integration-testing':
              expect(config.dataAlignment.mockCompatibility).toBe(true);
              expect(config.dataAlignment.fieldConsistency).toBe(true);
              expect(config.dataAlignment.errorScenarioSupport).toBe(true);
              expect(config.constraints.validationComplexity).toBe(ComplexityLevel.MEDIUM);
              break;
          }
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Property 7b: Mock configuration generation produces valid configurations', () => {
    fc.assert(
      fc.property(
        fc.record({
          fieldCount: fc.record({
            min: fc.integer({ min: 1, max: 3 }),
            max: fc.integer({ min: 4, max: 8 })
          }),
          documentState: fc.constantFrom(...Object.values(DocumentState)),
          validationComplexity: fc.constantFrom(...Object.values(ComplexityLevel)),
          includeErrorScenarios: fc.boolean(),
          errorScenarioCount: fc.integer({ min: 1, max: 5 })
        }),
        (configOptions) => {
          const generator = new ConfigurationGenerator();
          
          // Generate mock configuration
          const mockConfig = generator.generateMockConfiguration(configOptions);
          
          // Verify PDF configuration
          expect(mockConfig.pdf).toBeDefined();
          expect(Array.isArray(mockConfig.pdf.fields)).toBe(true);
          expect(mockConfig.pdf.fields.length).toBeGreaterThanOrEqual(configOptions.fieldCount.min);
          expect(mockConfig.pdf.fields.length).toBeLessThanOrEqual(configOptions.fieldCount.max);
          expect(mockConfig.pdf.documentState).toBe(configOptions.documentState);
          expect(mockConfig.pdf.validationBehavior).toBeDefined();
          expect(typeof mockConfig.pdf.validationBehavior.shouldSucceed).toBe('boolean');
          
          // Verify crypto configuration
          expect(mockConfig.crypto).toBeDefined();
          expect(Array.isArray(mockConfig.crypto.validationResults)).toBe(true);
          expect(Array.isArray(mockConfig.crypto.errorScenarios)).toBe(true);
          
          // Verify error scenarios based on configuration
          if (configOptions.includeErrorScenarios) {
            expect(mockConfig.crypto.errorScenarios.length).toBeGreaterThan(0);
            expect(mockConfig.crypto.errorScenarios.length).toBeLessThanOrEqual(configOptions.errorScenarioCount);
          }
          
          // Verify error patterns
          expect(mockConfig.errorPatterns).toBeDefined();
          expect(typeof mockConfig.errorPatterns).toBe('object');
          
          // Verify field definitions are well-formed
          mockConfig.pdf.fields.forEach(field => {
            expect(field.name).toBeDefined();
            expect(field.type).toBeDefined();
            expect(typeof field.required).toBe('boolean');
            expect(Array.isArray(field.validation)).toBe(true);
          });
          
          // Verify validation results are well-formed
          mockConfig.crypto.validationResults.forEach(result => {
            expect(typeof result.isValid).toBe('boolean');
            if (!result.isValid) {
              expect(result.errorType).toBeDefined();
            }
          });
        }
      ),
      { numRuns: 15 }
    );
  });

  test('Property 7c: Configuration batch generation produces varied configurations', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 5 }),
        (batchSize) => {
          const generator = new ConfigurationGenerator();
          
          // Generate batch of configurations with variations
          const configurations = generator.generateConfigurationBatch(batchSize, {
            includeVariations: true,
            complexityLevels: [ComplexityLevel.LOW, ComplexityLevel.MEDIUM, ComplexityLevel.HIGH],
            documentStates: [DocumentState.LOADED, DocumentState.MODIFIED]
          });
          
          // Verify batch size
          expect(configurations.length).toBe(batchSize);
          
          // Verify each configuration is valid
          configurations.forEach(config => {
            expect(config.pdf).toBeDefined();
            expect(config.crypto).toBeDefined();
            expect(config.errorPatterns).toBeDefined();
            
            expect(Array.isArray(config.pdf.fields)).toBe(true);
            expect(config.pdf.fields.length).toBeGreaterThan(0);
            expect(Object.values(DocumentState)).toContain(config.pdf.documentState);
          });
          
          // If batch size > 1, verify there's some variation in configurations
          if (batchSize > 1) {
            const fieldCounts = configurations.map(c => c.pdf.fields.length);
            const documentStates = configurations.map(c => c.pdf.documentState);
            const validationBehaviors = configurations.map(c => c.pdf.validationBehavior.shouldSucceed);
            
            // At least one of these should show variation
            const fieldCountVariation = new Set(fieldCounts).size > 1;
            const stateVariation = new Set(documentStates).size > 1;
            const behaviorVariation = new Set(validationBehaviors).size > 1;
            
            expect(fieldCountVariation || stateVariation || behaviorVariation).toBe(true);
          }
        }
      ),
      { numRuns: 10 }
    );
  });
});