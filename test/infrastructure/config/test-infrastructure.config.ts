/**
 * Test Infrastructure Configuration
 * 
 * This configuration provides centralized settings for all test infrastructure
 * components including mocks, generators, error handling, and integration.
 */

/**
 * Mock implementation configuration
 */
export const MOCK_CONFIG = {
  // PDF Mock settings
  pdf: {
    defaultFieldCount: 5,
    maxFieldCount: 20,
    defaultDocumentSize: 1024 * 1024, // 1MB
    maxDocumentSize: 10 * 1024 * 1024, // 10MB
    supportedFieldTypes: ['text', 'signature', 'checkbox', 'radio', 'dropdown'] as const,
  },
  
  // Field Mock settings
  field: {
    defaultValidationRules: ['required', 'format'] as const,
    maxValidationRules: 5,
    supportedFormats: ['email', 'phone', 'date', 'number'] as const,
  },
  
  // Crypto Mock settings
  crypto: {
    defaultValidationDelay: 100, // milliseconds
    maxValidationDelay: 1000,
    supportedAlgorithms: ['SHA256', 'SHA512'] as const,
    supportedKeyTypes: ['RSA', 'ECDSA'] as const,
  },
} as const;

/**
 * Generator configuration
 */
export const GENERATOR_CONFIG = {
  // Data alignment settings
  alignment: {
    mockCompatibility: true,
    fieldConsistency: true,
    errorScenarioSupport: true,
  },
  
  // Constraint settings
  constraints: {
    fieldCount: { min: 1, max: 20 },
    documentSize: { min: 1024, max: 10 * 1024 * 1024 },
    validationComplexity: 'medium' as 'low' | 'medium' | 'high',
  },
  
  // Error scenario settings
  errorScenarios: {
    frequency: 0.2, // 20% of generated data should trigger errors
    types: ['validation', 'format', 'crypto', 'field'] as const,
  },
} as const;

/**
 * Error handling configuration
 */
export const ERROR_CONFIG = {
  // Pattern settings
  patterns: {
    includeStackTrace: false, // For test environments
    includeDiagnostics: true,
    maxMessageLength: 500,
  },
  
  // Validation settings
  validation: {
    strictPatternMatching: true,
    requireDiagnosticInfo: true,
    allowCustomMessages: false,
  },
} as const;

/**
 * Integration configuration
 */
export const INTEGRATION_CONFIG = {
  // Test framework settings
  framework: {
    autoMockReset: true,
    clearBetweenTests: true,
    verboseLogging: false,
  },
  
  // Coordination settings
  coordination: {
    autoDataAlignment: true,
    validateCompatibility: true,
    trackMockUsage: true,
  },
} as const;

/**
 * Complete test infrastructure configuration
 */
export const TEST_INFRASTRUCTURE_CONFIG = {
  mock: MOCK_CONFIG,
  generator: GENERATOR_CONFIG,
  error: ERROR_CONFIG,
  integration: INTEGRATION_CONFIG,
} as const;

/**
 * Type definitions for configuration
 */
export type MockConfig = typeof MOCK_CONFIG;
export type GeneratorConfig = typeof GENERATOR_CONFIG;
export type ErrorConfig = typeof ERROR_CONFIG;
export type IntegrationConfig = typeof INTEGRATION_CONFIG;
export type TestInfrastructureConfig = typeof TEST_INFRASTRUCTURE_CONFIG;