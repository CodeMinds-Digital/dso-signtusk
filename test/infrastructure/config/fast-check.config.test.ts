/**
 * Fast-check Configuration Tests
 * 
 * Tests to verify that fast-check is properly configured and working.
 */

import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
    DEFAULT_PROPERTY_TEST_CONFIG,
    INTENSIVE_PROPERTY_TEST_CONFIG,
    QUICK_PROPERTY_TEST_CONFIG,
    createPropertyTestTag,
    getPropertyTestConfig
} from './fast-check.config';

describe('Fast-check Configuration', () => {
  it('should have valid default configuration', () => {
    expect(DEFAULT_PROPERTY_TEST_CONFIG.numRuns).toBe(100);
    expect(DEFAULT_PROPERTY_TEST_CONFIG.seed).toBe(42);
    expect(DEFAULT_PROPERTY_TEST_CONFIG.verbose).toBe(true);
  });

  it('should have valid quick configuration', () => {
    expect(QUICK_PROPERTY_TEST_CONFIG.numRuns).toBe(50);
    expect(QUICK_PROPERTY_TEST_CONFIG.interruptAfterTimeLimit).toBe(10000);
  });

  it('should have valid intensive configuration', () => {
    expect(INTENSIVE_PROPERTY_TEST_CONFIG.numRuns).toBe(1000);
    expect(INTENSIVE_PROPERTY_TEST_CONFIG.interruptAfterTimeLimit).toBe(60000);
  });

  it('should return appropriate config based on environment', () => {
    const config = getPropertyTestConfig();
    expect(config).toBeDefined();
    expect(config.numRuns).toBeGreaterThan(0);
  });

  it('should create properly formatted property test tags', () => {
    const tag = createPropertyTestTag(1, 'Mock Consistency');
    expect(tag).toBe('Feature: test-infrastructure-improvement, Property 1: Mock Consistency');
  });

  it('should run a basic property test with fast-check', () => {
    // Simple property test to verify fast-check is working
    fc.assert(
      fc.property(fc.integer(), (n) => {
        return n + 0 === n;
      }),
      QUICK_PROPERTY_TEST_CONFIG
    );
  });
});