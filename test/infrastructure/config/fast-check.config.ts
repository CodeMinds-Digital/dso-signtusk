/**
 * Fast-check Configuration for Property-Based Testing
 * 
 * This configuration provides standardized settings for property-based testing
 * across the test infrastructure components.
 */

import { Parameters } from 'fast-check';

/**
 * Default configuration for property-based tests
 * Minimum 100 iterations as specified in the design document
 */
export const DEFAULT_PROPERTY_TEST_CONFIG: Parameters<unknown[]> = {
  numRuns: 100,
  seed: 42, // Fixed seed for reproducible tests
  verbose: true,
  markInterruptAsFailure: true,
  interruptAfterTimeLimit: 30000, // 30 seconds timeout
  skipAllAfterTimeLimit: 60000, // 60 seconds total timeout
};

/**
 * Configuration for intensive property tests
 * Used for critical properties that need more thorough testing
 */
export const INTENSIVE_PROPERTY_TEST_CONFIG: Parameters<unknown[]> = {
  ...DEFAULT_PROPERTY_TEST_CONFIG,
  numRuns: 1000,
  interruptAfterTimeLimit: 60000, // 60 seconds timeout
  skipAllAfterTimeLimit: 120000, // 2 minutes total timeout
};

/**
 * Configuration for quick property tests
 * Used during development for faster feedback
 */
export const QUICK_PROPERTY_TEST_CONFIG: Parameters<unknown[]> = {
  ...DEFAULT_PROPERTY_TEST_CONFIG,
  numRuns: 50,
  interruptAfterTimeLimit: 10000, // 10 seconds timeout
  skipAllAfterTimeLimit: 20000, // 20 seconds total timeout
};

/**
 * Get property test configuration based on environment
 */
export function getPropertyTestConfig(): Parameters<unknown[]> {
  const env = process.env.NODE_ENV;
  const testMode = process.env.TEST_MODE;

  if (testMode === 'quick' || env === 'development') {
    return QUICK_PROPERTY_TEST_CONFIG;
  }

  if (testMode === 'intensive' || env === 'ci') {
    return INTENSIVE_PROPERTY_TEST_CONFIG;
  }

  return DEFAULT_PROPERTY_TEST_CONFIG;
}

/**
 * Property test tag format as specified in the design document
 * Format: "Feature: test-infrastructure-improvement, Property {number}: {property_text}"
 */
export function createPropertyTestTag(propertyNumber: number, propertyText: string): string {
  return `Feature: test-infrastructure-improvement, Property ${propertyNumber}: ${propertyText}`;
}