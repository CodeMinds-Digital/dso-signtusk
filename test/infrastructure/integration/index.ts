/**
 * Integration Components
 * 
 * Integration coordination and configuration components for test infrastructure.
 */

export * from './configuration-factory';
export * from './test-coordinator';
export * from './test-execution-feedback';

// Re-export utility instances for convenience
export { ConfigurationFactoryUtils, globalConfigurationFactory } from './configuration-factory';
export { TestCoordinatorUtils, globalTestCoordinator } from './test-coordinator';
export { TestExecutionFeedbackUtils, globalTestExecutionFeedback } from './test-execution-feedback';
