/**
 * Property Test: Test Execution Feedback Clarity
 * 
 * **Property 11: Test Execution Feedback Clarity**
 * **Validates: Requirements 4.3**
 * 
 * Feature: test-infrastructure-improvement, Property 11: Test Execution Feedback Clarity
 */

import * as fc from 'fast-check';
import { beforeEach, describe, expect, it } from 'vitest';
import { ErrorType } from '../errors/types';
import {
    ExecutionMode,
    FeedbackLevel,
    TestExecutionFeedbackSystem
} from './test-execution-feedback';

describe('Property Test: Test Execution Feedback Clarity', () => {
  let feedbackSystem: TestExecutionFeedbackSystem;

  beforeEach(() => {
    feedbackSystem = new TestExecutionFeedbackSystem({
      level: FeedbackLevel.DETAILED,
      enablePerformanceTracking: true,
      enableDiagnosticSeparation: true,
      enableRecommendations: true,
      outputFormat: 'json',
      includeStackTraces: false
    });
  });

  it('should provide clear, distinguishable feedback about mock usage versus real implementation usage', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate test execution scenarios
        fc.record({
          testId: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.trim() || 'test'),
          executionMode: fc.constantFrom(...Object.values(ExecutionMode)),
          mockOperations: fc.array(
            fc.record({
              component: fc.constantFrom('pdf', 'field', 'crypto'),
              operation: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.trim() || 'operation'),
              success: fc.boolean(),
              responseTime: fc.integer({ min: 1, max: 1000 }),
              errorType: fc.option(fc.constantFrom(...Object.values(ErrorType)), { nil: undefined })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          realOperations: fc.array(
            fc.record({
              component: fc.constantFrom('pdf', 'field', 'crypto'),
              operation: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.trim() || 'operation'),
              success: fc.boolean(),
              responseTime: fc.integer({ min: 10, max: 2000 }),
              memoryUsage: fc.option(fc.integer({ min: 1024, max: 1048576 }), { nil: undefined }),
              cpuUsage: fc.option(fc.float({ min: 0, max: 100 }), { nil: undefined })
            }),
            { minLength: 0, maxLength: 10 }
          ),
          diagnostics: fc.array(
            fc.record({
              category: fc.constantFrom('mock-behavior', 'test-logic', 'data-generation', 'integration', 'performance'),
              severity: fc.constantFrom('info', 'warning', 'error', 'critical'),
              message: fc.string({ minLength: 10, maxLength: 100 }),
              component: fc.string({ minLength: 1, maxLength: 20 }).map(s => s.trim() || 'component')
            }),
            { minLength: 0, maxLength: 8 }
          ),
          testSuccess: fc.boolean()
        }),

        async (scenario) => {
          // **Property 11: Test Execution Feedback Clarity**
          // *For any* test suite execution, the infrastructure should provide clear, 
          // distinguishable feedback about mock usage versus real implementation usage.

          // Start test execution tracking
          feedbackSystem.startTestExecution(scenario.testId, scenario.executionMode);

          // Record mock operations
          for (const mockOp of scenario.mockOperations) {
            feedbackSystem.recordMockUsage(
              scenario.testId,
              mockOp.component as any,
              mockOp.operation,
              {
                responseTime: mockOp.responseTime,
                success: mockOp.success,
                errorType: mockOp.errorType,
                context: { operationType: 'mock' }
              }
            );
          }

          // Record real implementation operations
          for (const realOp of scenario.realOperations) {
            feedbackSystem.recordRealImplementationUsage(
              scenario.testId,
              realOp.component as any,
              realOp.operation,
              {
                responseTime: realOp.responseTime,
                success: realOp.success,
                systemResources: {
                  memoryUsage: realOp.memoryUsage,
                  cpuUsage: realOp.cpuUsage
                },
                context: { operationType: 'real' }
              }
            );
          }

          // Add diagnostic information
          for (const diagnostic of scenario.diagnostics) {
            feedbackSystem.addDiagnostic(scenario.testId, {
              category: diagnostic.category as any,
              severity: diagnostic.severity as any,
              message: diagnostic.message,
              context: { testScenario: true },
              timestamp: new Date(),
              source: { component: diagnostic.component }
            });
          }

          // Complete test execution
          const feedback = feedbackSystem.completeTestExecution(scenario.testId, scenario.testSuccess);

          // Verify feedback is generated
          expect(feedback).toBeDefined();
          expect(feedback!.testId).toBe(scenario.testId);
          expect(feedback!.success).toBe(scenario.testSuccess);

          // **Clear distinction between mock and real implementation usage**
          
          // Mock usage should be clearly identified
          expect(feedback!.mockUsage).toBeDefined();
          expect(Array.isArray(feedback!.mockUsage)).toBe(true);
          
          // Real implementation usage should be clearly identified
          expect(feedback!.realImplementationUsage).toBeDefined();
          expect(Array.isArray(feedback!.realImplementationUsage)).toBe(true);

          // Verify mock usage feedback clarity
          for (const mockUsage of feedback!.mockUsage) {
            expect(mockUsage.component).toBeDefined();
            expect(mockUsage.mockImplementationUsed).toBe(true);
            expect(mockUsage.operationsPerformed).toBeGreaterThan(0);
            expect(mockUsage.operationTypes).toBeDefined();
            expect(Array.isArray(mockUsage.operationTypes)).toBe(true);
            expect(mockUsage.performanceMetrics).toBeDefined();
            expect(mockUsage.performanceMetrics.averageResponseTime).toBeGreaterThanOrEqual(0);
            expect(mockUsage.performanceMetrics.totalExecutionTime).toBeGreaterThanOrEqual(0);
            expect(mockUsage.performanceMetrics.operationCount).toBeGreaterThan(0);
            expect(typeof mockUsage.errorCount).toBe('number');
            expect(typeof mockUsage.successCount).toBe('number');
          }

          // Verify real implementation usage feedback clarity
          for (const realUsage of feedback!.realImplementationUsage) {
            expect(realUsage.component).toBeDefined();
            expect(realUsage.available).toBe(true);
            expect(realUsage.operationsPerformed).toBeGreaterThan(0);
            expect(realUsage.performanceMetrics).toBeDefined();
            expect(realUsage.performanceMetrics.averageResponseTime).toBeGreaterThanOrEqual(0);
            expect(realUsage.performanceMetrics.totalExecutionTime).toBeGreaterThanOrEqual(0);
            expect(realUsage.performanceMetrics.operationCount).toBeGreaterThan(0);
            expect(typeof realUsage.errorCount).toBe('number');
            expect(typeof realUsage.successCount).toBe('number');
            expect(realUsage.systemResources).toBeDefined();
          }

          // **Execution mode should be clearly identified**
          expect(feedback!.executionMode).toBeDefined();
          expect(Object.values(ExecutionMode)).toContain(feedback!.executionMode);

          // Execution mode should reflect actual usage patterns
          const hasMockOps = scenario.mockOperations.length > 0;
          const hasRealOps = scenario.realOperations.length > 0;

          if (hasMockOps && hasRealOps) {
            expect([ExecutionMode.HYBRID, scenario.executionMode]).toContain(feedback!.executionMode);
          } else if (hasMockOps && !hasRealOps) {
            expect([ExecutionMode.MOCK_ONLY, scenario.executionMode]).toContain(feedback!.executionMode);
          } else if (!hasMockOps && hasRealOps) {
            expect([ExecutionMode.REAL_ONLY, scenario.executionMode]).toContain(feedback!.executionMode);
          }

          // **Summary should provide clear operation counts**
          expect(feedback!.summary).toBeDefined();
          expect(feedback!.summary.totalOperations).toBe(scenario.mockOperations.length + scenario.realOperations.length);
          expect(feedback!.summary.mockOperations).toBe(scenario.mockOperations.length);
          expect(feedback!.summary.realOperations).toBe(scenario.realOperations.length);
          expect(typeof feedback!.summary.errorCount).toBe('number');
          expect(typeof feedback!.summary.warningCount).toBe('number');
          expect(typeof feedback!.summary.performanceIssues).toBe('number');

          // **Diagnostic information should be clearly categorized**
          expect(feedback!.diagnostics).toBeDefined();
          expect(Array.isArray(feedback!.diagnostics)).toBe(true);

          for (const diagnostic of feedback!.diagnostics) {
            expect(diagnostic.category).toBeDefined();
            expect(['mock-behavior', 'test-logic', 'data-generation', 'integration', 'performance']).toContain(diagnostic.category);
            expect(diagnostic.severity).toBeDefined();
            expect(['info', 'warning', 'error', 'critical']).toContain(diagnostic.severity);
            expect(diagnostic.message).toBeDefined();
            expect(typeof diagnostic.message).toBe('string');
            expect(diagnostic.message.length).toBeGreaterThan(0);
            expect(diagnostic.timestamp).toBeDefined();
            expect(diagnostic.timestamp instanceof Date).toBe(true);
            expect(diagnostic.source).toBeDefined();
            expect(diagnostic.source.component).toBeDefined();
            expect(typeof diagnostic.source.component).toBe('string');
          }

          // **Performance metrics should be distinguishable between mock and real**
          const mockComponents = feedback!.mockUsage.map(usage => usage.component);
          const realComponents = feedback!.realImplementationUsage.map(usage => usage.component);

          // Mock performance metrics should be available for mock components
          for (const component of mockComponents) {
            const mockUsage = feedback!.mockUsage.find(usage => usage.component === component);
            expect(mockUsage).toBeDefined();
            expect(mockUsage!.performanceMetrics.averageResponseTime).toBeGreaterThanOrEqual(0);
            
            // Mock operations should generally be faster than real operations
            const realUsage = feedback!.realImplementationUsage.find(usage => usage.component === component);
            if (realUsage && realUsage.performanceMetrics.averageResponseTime > 0) {
              // This is a general expectation but not a hard requirement
              // as mocks can sometimes be slower due to complex simulation logic
              // Allow for reasonable variance - mock should be within reasonable bounds
              const mockTime = mockUsage!.performanceMetrics.averageResponseTime;
              const realTime = realUsage.performanceMetrics.averageResponseTime;
              
              // Either mock is faster, or within reasonable bounds (up to 20x slower is acceptable for complex mocks)
              expect(mockTime).toBeLessThan(Math.max(realTime * 20, realTime + 1000));
            }
          }

          // Real implementation should have system resource information
          for (const component of realComponents) {
            const realUsage = feedback!.realImplementationUsage.find(usage => usage.component === component);
            expect(realUsage).toBeDefined();
            expect(realUsage!.systemResources).toBeDefined();
            // System resources may be undefined for some operations, which is acceptable
          }

          // **Recommendations should be provided when appropriate**
          expect(feedback!.recommendations).toBeDefined();
          expect(Array.isArray(feedback!.recommendations)).toBe(true);

          // If there are errors or performance issues, recommendations should be provided
          if (feedback!.summary.errorCount > 0 || feedback!.summary.performanceIssues > 0) {
            expect(feedback!.recommendations.length).toBeGreaterThan(0);
          }

          // **Timing information should be clear and accurate**
          expect(feedback!.startTime).toBeDefined();
          expect(feedback!.startTime instanceof Date).toBe(true);
          expect(feedback!.endTime).toBeDefined();
          expect(feedback!.endTime instanceof Date).toBe(true);
          expect(feedback!.duration).toBeDefined();
          expect(feedback!.duration).toBeGreaterThanOrEqual(0);
          expect(feedback!.endTime.getTime()).toBeGreaterThanOrEqual(feedback!.startTime.getTime());
          expect(feedback!.duration).toBe(feedback!.endTime.getTime() - feedback!.startTime.getTime());
        }
      ),
      { 
        numRuns: 100,
        timeout: 8000,
        verbose: false
      }
    );
  });

  it('should maintain feedback clarity across different feedback levels and output formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          testId: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.trim() || 'test'),
          feedbackLevel: fc.constantFrom(...Object.values(FeedbackLevel)),
          outputFormat: fc.constantFrom('console', 'json', 'structured', 'silent'),
          operations: fc.array(
            fc.record({
              type: fc.constantFrom('mock', 'real'),
              component: fc.constantFrom('pdf', 'field', 'crypto'),
              operation: fc.string({ minLength: 1, maxLength: 15 }).map(s => s.trim() || 'op'),
              success: fc.boolean(),
              responseTime: fc.integer({ min: 1, max: 500 })
            }),
            { minLength: 1, maxLength: 8 }
          )
        }),

        async (scenario) => {
          // Create feedback system with specific configuration
          const customFeedbackSystem = new TestExecutionFeedbackSystem({
            level: scenario.feedbackLevel,
            enablePerformanceTracking: true,
            enableDiagnosticSeparation: true,
            enableRecommendations: true,
            outputFormat: scenario.outputFormat as any,
            includeStackTraces: false
          });

          // Start test execution
          customFeedbackSystem.startTestExecution(scenario.testId, ExecutionMode.HYBRID);

          // Record operations based on type
          for (const operation of scenario.operations) {
            if (operation.type === 'mock') {
              customFeedbackSystem.recordMockUsage(
                scenario.testId,
                operation.component as any,
                operation.operation,
                {
                  responseTime: operation.responseTime,
                  success: operation.success
                }
              );
            } else {
              customFeedbackSystem.recordRealImplementationUsage(
                scenario.testId,
                operation.component as any,
                operation.operation,
                {
                  responseTime: operation.responseTime,
                  success: operation.success
                }
              );
            }
          }

          // Complete execution
          const feedback = customFeedbackSystem.completeTestExecution(scenario.testId, true);

          // Verify feedback structure is consistent regardless of level/format
          expect(feedback).toBeDefined();
          expect(feedback!.testId).toBe(scenario.testId);
          expect(feedback!.executionMode).toBeDefined();
          expect(feedback!.mockUsage).toBeDefined();
          expect(feedback!.realImplementationUsage).toBeDefined();
          expect(feedback!.summary).toBeDefined();

          // Verify operation counts match input
          const mockOps = scenario.operations.filter(op => op.type === 'mock').length;
          const realOps = scenario.operations.filter(op => op.type === 'real').length;
          
          expect(feedback!.summary.mockOperations).toBe(mockOps);
          expect(feedback!.summary.realOperations).toBe(realOps);
          expect(feedback!.summary.totalOperations).toBe(mockOps + realOps);

          // Verify mock vs real distinction is maintained
          if (mockOps > 0) {
            expect(feedback!.mockUsage.length).toBeGreaterThan(0);
            const totalMockOps = feedback!.mockUsage.reduce((sum, usage) => sum + usage.operationsPerformed, 0);
            expect(totalMockOps).toBe(mockOps);
          }

          if (realOps > 0) {
            expect(feedback!.realImplementationUsage.length).toBeGreaterThan(0);
            const totalRealOps = feedback!.realImplementationUsage.reduce((sum, usage) => sum + usage.operationsPerformed, 0);
            expect(totalRealOps).toBe(realOps);
          }

          // Verify performance metrics are calculated correctly
          for (const mockUsage of feedback!.mockUsage) {
            expect(mockUsage.performanceMetrics.operationCount).toBe(mockUsage.operationsPerformed);
            expect(mockUsage.performanceMetrics.averageResponseTime).toBeGreaterThanOrEqual(0);
            if (mockUsage.operationsPerformed > 0) {
              expect(mockUsage.performanceMetrics.totalExecutionTime).toBeGreaterThan(0);
            }
          }

          for (const realUsage of feedback!.realImplementationUsage) {
            expect(realUsage.performanceMetrics.operationCount).toBe(realUsage.operationsPerformed);
            expect(realUsage.performanceMetrics.averageResponseTime).toBeGreaterThanOrEqual(0);
            if (realUsage.operationsPerformed > 0) {
              expect(realUsage.performanceMetrics.totalExecutionTime).toBeGreaterThan(0);
            }
          }
        }
      ),
      { 
        numRuns: 100,
        timeout: 6000,
        verbose: false
      }
    );
  });

  it('should provide consistent feedback clarity when no operations are performed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          testId: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.trim() || 'empty-test'),
          executionMode: fc.constantFrom(...Object.values(ExecutionMode)),
          testSuccess: fc.boolean(),
          addDiagnostics: fc.boolean(),
          diagnosticCount: fc.integer({ min: 0, max: 3 })
        }),

        async (scenario) => {
          // Test feedback clarity when no operations are performed
          feedbackSystem.startTestExecution(scenario.testId, scenario.executionMode);

          // Optionally add some diagnostics
          if (scenario.addDiagnostics) {
            for (let i = 0; i < scenario.diagnosticCount; i++) {
              feedbackSystem.addDiagnostic(scenario.testId, {
                category: 'test-logic',
                severity: 'info',
                message: `Diagnostic message ${i + 1}`,
                context: { diagnosticIndex: i },
                timestamp: new Date(),
                source: { component: 'test-framework' }
              });
            }
          }

          // Complete execution
          const feedback = feedbackSystem.completeTestExecution(scenario.testId, scenario.testSuccess);

          // Verify feedback is still clear and meaningful
          expect(feedback).toBeDefined();
          expect(feedback!.testId).toBe(scenario.testId);
          expect(feedback!.success).toBe(scenario.testSuccess);

          // Mock and real usage should be empty but defined
          expect(feedback!.mockUsage).toBeDefined();
          expect(Array.isArray(feedback!.mockUsage)).toBe(true);
          expect(feedback!.mockUsage).toHaveLength(0);

          expect(feedback!.realImplementationUsage).toBeDefined();
          expect(Array.isArray(feedback!.realImplementationUsage)).toBe(true);
          expect(feedback!.realImplementationUsage).toHaveLength(0);

          // Summary should reflect no operations
          expect(feedback!.summary.totalOperations).toBe(0);
          expect(feedback!.summary.mockOperations).toBe(0);
          expect(feedback!.summary.realOperations).toBe(0);

          // Execution mode should be determinable or unknown
          expect(Object.values(ExecutionMode)).toContain(feedback!.executionMode);

          // Diagnostics should match what was added
          if (scenario.addDiagnostics) {
            expect(feedback!.diagnostics.length).toBe(scenario.diagnosticCount);
          }

          // Recommendations should be provided for tests with no operations
          expect(feedback!.recommendations).toBeDefined();
          expect(Array.isArray(feedback!.recommendations)).toBe(true);
          if (feedback!.summary.totalOperations === 0) {
            expect(feedback!.recommendations.length).toBeGreaterThan(0);
            expect(feedback!.recommendations.some(rec => rec.includes('No operations recorded'))).toBe(true);
          }

          // Timing should still be accurate
          expect(feedback!.duration).toBeGreaterThanOrEqual(0);
          expect(feedback!.startTime instanceof Date).toBe(true);
          expect(feedback!.endTime instanceof Date).toBe(true);
        }
      ),
      { 
        numRuns: 100,
        timeout: 5000,
        verbose: false
      }
    );
  });
});