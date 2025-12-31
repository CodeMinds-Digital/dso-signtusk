/**
 * Shared types for test infrastructure integration
 */

// Re-export types from individual components
export * from './errors/types';
export * from './mocks/types';

/**
 * Test workflow result types
 */
export interface WorkflowResult {
  success: boolean;
  results?: any;
  error?: Error;
  errorValidation?: ErrorValidationResult;
  feedback?: TestExecutionFeedback;
  testData?: any;
}

export interface PropertyTestResult {
  totalIterations: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  results: Array<{
    iteration: number;
    success: boolean;
    result?: any;
    error?: Error;
    errorValidation?: ErrorValidationResult;
    testData?: any;
  }>;
}

export interface IntegrationTestResult {
  success: boolean;
  results?: {
    pdf: any;
    fields: any;
    signature: any;
  };
  consistencyCheck?: {
    pdfFieldsMatch: boolean;
    cryptoSignatureValid: boolean;
    overallConsistency: boolean;
  };
  error?: Error;
  errorValidation?: ErrorValidationResult;
  feedback?: TestExecutionFeedback;
}

/**
 * Error validation result
 */
export interface ErrorValidationResult {
  isValid: boolean;
  expectedPattern?: string;
  actualMessage: string;
  diagnosticInfo?: any;
}

/**
 * Test execution feedback
 */
export interface TestExecutionFeedback {
  mockUsage: {
    pdf: boolean;
    field: boolean;
    crypto: boolean;
  };
  realImplementationUsage: {
    pdf: boolean;
    field: boolean;
    crypto: boolean;
  };
  executionTime: number;
  memoryUsage?: number;
  diagnosticInfo: any[];
}

/**
 * Test scenario configuration
 */
export interface TestScenarioConfig {
  scenario: 'unit' | 'integration' | 'property' | 'error';
  mockBehavior: 'realistic' | 'simplified' | 'error-prone';
  dataGeneration: 'aligned' | 'random' | 'edge-cases';
  errorHandling: 'strict' | 'lenient' | 'debug';
}

/**
 * Complete test setup
 */
export interface TestSetup {
  data: any;
  mocks: {
    pdf: any;
    field: any;
    crypto: any;
  };
  validateError: (error: Error, pattern?: string) => ErrorValidationResult;
  cleanup: () => void;
  feedback: () => TestExecutionFeedback;
}