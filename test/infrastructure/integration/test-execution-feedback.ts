/**
 * Test Execution Feedback System
 * 
 * Provides clear mock vs real implementation feedback and diagnostic information separation for debugging.
 * Implements clear feedback mechanisms for test execution and debugging support.
 */

import { ErrorType } from '../errors/types';

export enum FeedbackLevel {
  MINIMAL = 'MINIMAL',
  STANDARD = 'STANDARD',
  DETAILED = 'DETAILED',
  VERBOSE = 'VERBOSE'
}

export enum ExecutionMode {
  MOCK_ONLY = 'MOCK_ONLY',
  REAL_ONLY = 'REAL_ONLY',
  HYBRID = 'HYBRID',
  UNKNOWN = 'UNKNOWN'
}

export interface MockUsageFeedback {
  component: 'pdf' | 'field' | 'crypto';
  operationsPerformed: number;
  mockImplementationUsed: boolean;
  realImplementationUsed: boolean;
  operationTypes: string[];
  performanceMetrics: {
    averageResponseTime: number;
    totalExecutionTime: number;
    operationCount: number;
  };
  errorCount: number;
  successCount: number;
}

export interface RealImplementationFeedback {
  component: 'pdf' | 'field' | 'crypto';
  available: boolean;
  operationsPerformed: number;
  performanceMetrics: {
    averageResponseTime: number;
    totalExecutionTime: number;
    operationCount: number;
  };
  errorCount: number;
  successCount: number;
  systemResources: {
    memoryUsage?: number;
    cpuUsage?: number;
    diskIO?: number;
  };
}

export interface DiagnosticInformation {
  category: 'mock-behavior' | 'test-logic' | 'data-generation' | 'integration' | 'performance';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  context: Record<string, any>;
  timestamp: Date;
  source: {
    component: string;
    operation?: string;
    location?: string;
  };
  suggestions?: string[];
  relatedDiagnostics?: string[];
}

export interface TestExecutionFeedback {
  testId: string;
  executionMode: ExecutionMode;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  mockUsage: MockUsageFeedback[];
  realImplementationUsage: RealImplementationFeedback[];
  diagnostics: DiagnosticInformation[];
  summary: {
    totalOperations: number;
    mockOperations: number;
    realOperations: number;
    errorCount: number;
    warningCount: number;
    performanceIssues: number;
  };
  recommendations: string[];
}

export interface FeedbackSystemOptions {
  level: FeedbackLevel;
  enablePerformanceTracking: boolean;
  enableDiagnosticSeparation: boolean;
  enableRecommendations: boolean;
  outputFormat: 'console' | 'json' | 'structured' | 'silent';
  includeStackTraces: boolean;
}

export class TestExecutionFeedbackSystem {
  private readonly options: Required<FeedbackSystemOptions>;
  private readonly activeFeedback: Map<string, TestExecutionFeedback> = new Map();
  private readonly diagnosticHistory: DiagnosticInformation[] = [];
  private readonly performanceBaselines: Map<string, number> = new Map();

  constructor(options: Partial<FeedbackSystemOptions> = {}) {
    this.options = {
      level: options.level ?? FeedbackLevel.STANDARD,
      enablePerformanceTracking: options.enablePerformanceTracking ?? true,
      enableDiagnosticSeparation: options.enableDiagnosticSeparation ?? true,
      enableRecommendations: options.enableRecommendations ?? true,
      outputFormat: options.outputFormat ?? 'console',
      includeStackTraces: options.includeStackTraces ?? false
    };
  }

  /**
   * Start tracking test execution feedback
   */
  startTestExecution(testId: string, executionMode: ExecutionMode = ExecutionMode.UNKNOWN): void {
    const feedback: TestExecutionFeedback = {
      testId,
      executionMode,
      startTime: new Date(),
      endTime: new Date(), // Will be updated on completion
      duration: 0,
      success: false,
      mockUsage: [],
      realImplementationUsage: [],
      diagnostics: [],
      summary: {
        totalOperations: 0,
        mockOperations: 0,
        realOperations: 0,
        errorCount: 0,
        warningCount: 0,
        performanceIssues: 0
      },
      recommendations: []
    };

    this.activeFeedback.set(testId, feedback);
    this.log(`Started tracking test execution: ${testId}`, { executionMode });
  }

  /**
   * Record mock implementation usage
   */
  recordMockUsage(testId: string, component: 'pdf' | 'field' | 'crypto', operation: string, options?: {
    responseTime?: number;
    success?: boolean;
    errorType?: ErrorType;
    context?: Record<string, any>;
  }): void {
    const feedback = this.activeFeedback.get(testId);
    if (!feedback) {
      this.addDiagnostic(testId, {
        category: 'test-logic',
        severity: 'warning',
        message: `Attempted to record mock usage for unknown test: ${testId}`,
        context: { component, operation },
        timestamp: new Date(),
        source: { component: 'feedback-system' }
      });
      return;
    }

    let mockUsage = feedback.mockUsage.find(usage => usage.component === component);
    if (!mockUsage) {
      mockUsage = {
        component,
        operationsPerformed: 0,
        mockImplementationUsed: true,
        realImplementationUsed: false,
        operationTypes: [],
        performanceMetrics: {
          averageResponseTime: 0,
          totalExecutionTime: 0,
          operationCount: 0
        },
        errorCount: 0,
        successCount: 0
      };
      feedback.mockUsage.push(mockUsage);
    }

    // Update usage statistics
    mockUsage.operationsPerformed++;
    if (!mockUsage.operationTypes.includes(operation)) {
      mockUsage.operationTypes.push(operation);
    }

    const responseTime = options?.responseTime ?? 0;
    const success = options?.success ?? true;

    // Update performance metrics
    mockUsage.performanceMetrics.operationCount++;
    mockUsage.performanceMetrics.totalExecutionTime += responseTime;
    mockUsage.performanceMetrics.averageResponseTime = 
      mockUsage.performanceMetrics.totalExecutionTime / mockUsage.performanceMetrics.operationCount;

    // Update success/error counts
    if (success) {
      mockUsage.successCount++;
    } else {
      mockUsage.errorCount++;
      feedback.summary.errorCount++;
    }

    feedback.summary.mockOperations++;
    feedback.summary.totalOperations++;

    // Add diagnostic information for mock usage
    if (this.options.enableDiagnosticSeparation) {
      this.addDiagnostic(testId, {
        category: 'mock-behavior',
        severity: success ? 'info' : 'warning',
        message: `Mock ${component} performed ${operation}: ${success ? 'success' : 'failure'}`,
        context: {
          component,
          operation,
          responseTime,
          success,
          errorType: options?.errorType,
          ...options?.context
        },
        timestamp: new Date(),
        source: { component: `mock-${component}`, operation }
      });
    }

    this.log(`Recorded mock usage: ${component}.${operation}`, { testId, success, responseTime });
  }

  /**
   * Record real implementation usage
   */
  recordRealImplementationUsage(testId: string, component: 'pdf' | 'field' | 'crypto', operation: string, options?: {
    responseTime?: number;
    success?: boolean;
    systemResources?: { memoryUsage?: number; cpuUsage?: number; diskIO?: number };
    context?: Record<string, any>;
  }): void {
    const feedback = this.activeFeedback.get(testId);
    if (!feedback) {
      this.addDiagnostic(testId, {
        category: 'test-logic',
        severity: 'warning',
        message: `Attempted to record real implementation usage for unknown test: ${testId}`,
        context: { component, operation },
        timestamp: new Date(),
        source: { component: 'feedback-system' }
      });
      return;
    }

    let realUsage = feedback.realImplementationUsage.find(usage => usage.component === component);
    if (!realUsage) {
      realUsage = {
        component,
        available: true,
        operationsPerformed: 0,
        performanceMetrics: {
          averageResponseTime: 0,
          totalExecutionTime: 0,
          operationCount: 0
        },
        errorCount: 0,
        successCount: 0,
        systemResources: {}
      };
      feedback.realImplementationUsage.push(realUsage);
    }

    // Update usage statistics
    realUsage.operationsPerformed++;

    const responseTime = options?.responseTime ?? 0;
    const success = options?.success ?? true;

    // Update performance metrics
    realUsage.performanceMetrics.operationCount++;
    realUsage.performanceMetrics.totalExecutionTime += responseTime;
    realUsage.performanceMetrics.averageResponseTime = 
      realUsage.performanceMetrics.totalExecutionTime / realUsage.performanceMetrics.operationCount;

    // Update system resources
    if (options?.systemResources) {
      realUsage.systemResources = { ...realUsage.systemResources, ...options.systemResources };
    }

    // Update success/error counts
    if (success) {
      realUsage.successCount++;
    } else {
      realUsage.errorCount++;
      feedback.summary.errorCount++;
    }

    feedback.summary.realOperations++;
    feedback.summary.totalOperations++;

    // Update execution mode if it was unknown
    if (feedback.executionMode === ExecutionMode.UNKNOWN) {
      feedback.executionMode = feedback.summary.mockOperations > 0 ? ExecutionMode.HYBRID : ExecutionMode.REAL_ONLY;
    }

    // Add diagnostic information for real implementation usage
    if (this.options.enableDiagnosticSeparation) {
      this.addDiagnostic(testId, {
        category: 'integration',
        severity: success ? 'info' : 'error',
        message: `Real ${component} performed ${operation}: ${success ? 'success' : 'failure'}`,
        context: {
          component,
          operation,
          responseTime,
          success,
          systemResources: options?.systemResources,
          ...options?.context
        },
        timestamp: new Date(),
        source: { component: `real-${component}`, operation }
      });
    }

    this.log(`Recorded real implementation usage: ${component}.${operation}`, { testId, success, responseTime });
  }

  /**
   * Add diagnostic information with automatic separation
   */
  addDiagnostic(testId: string, diagnostic: Omit<DiagnosticInformation, 'relatedDiagnostics'>): void {
    const fullDiagnostic: DiagnosticInformation = {
      ...diagnostic,
      relatedDiagnostics: this.findRelatedDiagnostics(diagnostic)
    };

    // Add to test-specific feedback
    const feedback = this.activeFeedback.get(testId);
    if (feedback) {
      feedback.diagnostics.push(fullDiagnostic);

      // Update summary counts
      if (diagnostic.severity === 'warning') {
        feedback.summary.warningCount++;
      } else if (diagnostic.severity === 'error' || diagnostic.severity === 'critical') {
        feedback.summary.errorCount++;
      }

      if (diagnostic.category === 'performance') {
        feedback.summary.performanceIssues++;
      }
    }

    // Add to global diagnostic history
    this.diagnosticHistory.push(fullDiagnostic);

    // Generate recommendations if enabled
    if (this.options.enableRecommendations && feedback) {
      const recommendations = this.generateRecommendations(fullDiagnostic, feedback);
      feedback.recommendations.push(...recommendations);
    }

    this.log(`Added diagnostic: ${diagnostic.category} - ${diagnostic.severity}`, { testId, message: diagnostic.message });
  }

  /**
   * Complete test execution and generate final feedback
   */
  completeTestExecution(testId: string, success: boolean): TestExecutionFeedback | null {
    const feedback = this.activeFeedback.get(testId);
    if (!feedback) {
      this.log(`Cannot complete unknown test execution: ${testId}`, { success });
      return null;
    }

    // Update final execution details
    feedback.endTime = new Date();
    feedback.duration = feedback.endTime.getTime() - feedback.startTime.getTime();
    feedback.success = success;

    // Determine final execution mode if still unknown
    if (feedback.executionMode === ExecutionMode.UNKNOWN) {
      if (feedback.summary.mockOperations > 0 && feedback.summary.realOperations > 0) {
        feedback.executionMode = ExecutionMode.HYBRID;
      } else if (feedback.summary.mockOperations > 0) {
        feedback.executionMode = ExecutionMode.MOCK_ONLY;
      } else if (feedback.summary.realOperations > 0) {
        feedback.executionMode = ExecutionMode.REAL_ONLY;
      }
    }

    // Generate final recommendations
    if (this.options.enableRecommendations) {
      feedback.recommendations.push(...this.generateFinalRecommendations(feedback));
    }

    // Output feedback based on configuration
    this.outputFeedback(feedback);

    // Remove from active tracking
    this.activeFeedback.delete(testId);

    this.log(`Completed test execution: ${testId}`, { 
      success, 
      duration: feedback.duration, 
      executionMode: feedback.executionMode 
    });

    return feedback;
  }

  /**
   * Get current feedback for active test
   */
  getCurrentFeedback(testId: string): TestExecutionFeedback | null {
    return this.activeFeedback.get(testId) || null;
  }

  /**
   * Get diagnostic history with filtering options
   */
  getDiagnosticHistory(options?: {
    category?: DiagnosticInformation['category'];
    severity?: DiagnosticInformation['severity'];
    component?: string;
    since?: Date;
    limit?: number;
  }): DiagnosticInformation[] {
    let filtered = [...this.diagnosticHistory];

    if (options?.category) {
      filtered = filtered.filter(d => d.category === options.category);
    }

    if (options?.severity) {
      filtered = filtered.filter(d => d.severity === options.severity);
    }

    if (options?.component) {
      filtered = filtered.filter(d => d.source.component === options.component);
    }

    if (options?.since) {
      filtered = filtered.filter(d => d.timestamp >= options.since!);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * Clear diagnostic history
   */
  clearDiagnosticHistory(): void {
    this.diagnosticHistory.length = 0;
    this.log('Cleared diagnostic history');
  }

  /**
   * Get feedback system status
   */
  getStatus(): {
    activeTests: number;
    totalDiagnostics: number;
    options: FeedbackSystemOptions;
    performanceBaselines: number;
  } {
    return {
      activeTests: this.activeFeedback.size,
      totalDiagnostics: this.diagnosticHistory.length,
      options: this.options,
      performanceBaselines: this.performanceBaselines.size
    };
  }

  // Private helper methods

  private findRelatedDiagnostics(diagnostic: DiagnosticInformation): string[] {
    // Find diagnostics with similar context or from the same component
    const related = this.diagnosticHistory
      .filter(d => 
        d.source.component === diagnostic.source.component ||
        d.category === diagnostic.category ||
        (d.context && diagnostic.context && this.hasOverlappingContext(d.context, diagnostic.context))
      )
      .slice(-3) // Get last 3 related diagnostics
      .map(d => `${d.category}:${d.severity} - ${d.message.substring(0, 50)}...`);

    return related;
  }

  private hasOverlappingContext(context1: Record<string, any>, context2: Record<string, any>): boolean {
    const keys1 = Object.keys(context1);
    const keys2 = Object.keys(context2);
    const commonKeys = keys1.filter(key => keys2.includes(key));
    
    return commonKeys.some(key => context1[key] === context2[key]);
  }

  private generateRecommendations(diagnostic: DiagnosticInformation, feedback: TestExecutionFeedback): string[] {
    const recommendations: string[] = [];

    switch (diagnostic.category) {
      case 'mock-behavior':
        if (diagnostic.severity === 'error') {
          recommendations.push('Consider updating mock configuration to handle this scenario');
          recommendations.push('Verify mock implementation matches expected behavior');
        }
        break;

      case 'test-logic':
        if (diagnostic.severity === 'warning' || diagnostic.severity === 'error') {
          recommendations.push('Review test logic for potential issues');
          recommendations.push('Ensure test setup and teardown are properly configured');
        }
        break;

      case 'performance':
        if (diagnostic.severity === 'warning') {
          recommendations.push('Consider optimizing test data generation');
          recommendations.push('Review mock implementation performance');
        }
        break;

      case 'integration':
        if (diagnostic.severity === 'error') {
          recommendations.push('Verify real implementation is available and configured');
          recommendations.push('Check system resources and dependencies');
        }
        break;
    }

    return recommendations;
  }

  private generateFinalRecommendations(feedback: TestExecutionFeedback): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (feedback.duration > 5000) { // 5 seconds
      recommendations.push('Test execution time is high - consider optimizing test data or mock responses');
    }

    // Error rate recommendations
    const errorRate = feedback.summary.errorCount / Math.max(feedback.summary.totalOperations, 1);
    if (errorRate > 0.1) { // 10% error rate
      recommendations.push('High error rate detected - review test configuration and mock behavior');
    }

    // Execution mode recommendations
    if (feedback.executionMode === ExecutionMode.UNKNOWN) {
      recommendations.push('Execution mode could not be determined - ensure proper usage tracking');
    }

    // Mock vs real usage recommendations
    if (feedback.summary.mockOperations === 0 && feedback.summary.realOperations === 0) {
      recommendations.push('No operations recorded - verify test is actually exercising the system');
    }

    return recommendations;
  }

  private outputFeedback(feedback: TestExecutionFeedback): void {
    if (this.options.outputFormat === 'silent') {
      return;
    }

    switch (this.options.outputFormat) {
      case 'console':
        this.outputConsoleFormat(feedback);
        break;
      case 'json':
        console.log(JSON.stringify(feedback, null, 2));
        break;
      case 'structured':
        this.outputStructuredFormat(feedback);
        break;
    }
  }

  private outputConsoleFormat(feedback: TestExecutionFeedback): void {
    if (this.options.level === FeedbackLevel.MINIMAL) {
      console.log(`[${feedback.testId}] ${feedback.success ? 'PASS' : 'FAIL'} (${feedback.duration}ms) - ${feedback.executionMode}`);
      return;
    }

    console.log(`\n=== Test Execution Feedback: ${feedback.testId} ===`);
    console.log(`Status: ${feedback.success ? 'PASS' : 'FAIL'}`);
    console.log(`Duration: ${feedback.duration}ms`);
    console.log(`Execution Mode: ${feedback.executionMode}`);
    console.log(`Operations: ${feedback.summary.totalOperations} (${feedback.summary.mockOperations} mock, ${feedback.summary.realOperations} real)`);
    
    if (feedback.summary.errorCount > 0) {
      console.log(`Errors: ${feedback.summary.errorCount}`);
    }

    if (this.options.level === FeedbackLevel.DETAILED || this.options.level === FeedbackLevel.VERBOSE) {
      if (feedback.mockUsage.length > 0) {
        console.log('\nMock Usage:');
        feedback.mockUsage.forEach(usage => {
          console.log(`  ${usage.component}: ${usage.operationsPerformed} ops, ${usage.performanceMetrics.averageResponseTime.toFixed(2)}ms avg`);
        });
      }

      if (feedback.realImplementationUsage.length > 0) {
        console.log('\nReal Implementation Usage:');
        feedback.realImplementationUsage.forEach(usage => {
          console.log(`  ${usage.component}: ${usage.operationsPerformed} ops, ${usage.performanceMetrics.averageResponseTime.toFixed(2)}ms avg`);
        });
      }
    }

    if (this.options.level === FeedbackLevel.VERBOSE && feedback.diagnostics.length > 0) {
      console.log('\nDiagnostics:');
      feedback.diagnostics.forEach(diagnostic => {
        console.log(`  [${diagnostic.severity.toUpperCase()}] ${diagnostic.category}: ${diagnostic.message}`);
      });
    }

    if (feedback.recommendations.length > 0) {
      console.log('\nRecommendations:');
      feedback.recommendations.forEach(rec => {
        console.log(`  • ${rec}`);
      });
    }

    console.log('='.repeat(50));
  }

  private outputStructuredFormat(feedback: TestExecutionFeedback): void {
    const structured = {
      test: feedback.testId,
      result: feedback.success ? 'PASS' : 'FAIL',
      duration: `${feedback.duration}ms`,
      mode: feedback.executionMode,
      operations: {
        total: feedback.summary.totalOperations,
        mock: feedback.summary.mockOperations,
        real: feedback.summary.realOperations
      },
      issues: {
        errors: feedback.summary.errorCount,
        warnings: feedback.summary.warningCount,
        performance: feedback.summary.performanceIssues
      },
      recommendations: feedback.recommendations.length
    };

    console.log(JSON.stringify(structured, null, 2));
  }

  private log(message: string, data?: any): void {
    if (this.options.level === FeedbackLevel.VERBOSE) {
      console.log(`[FeedbackSystem] ${message}`, data ? JSON.stringify(data) : '');
    }
  }
}

/**
 * Global feedback system instance
 */
export const globalTestExecutionFeedback = new TestExecutionFeedbackSystem({
  level: FeedbackLevel.STANDARD,
  enablePerformanceTracking: true,
  enableDiagnosticSeparation: true,
  enableRecommendations: true,
  outputFormat: 'console',
  includeStackTraces: false
});

/**
 * Utility functions for common feedback operations
 */
export const TestExecutionFeedbackUtils = {
  /**
   * Start tracking test with mock-only mode
   */
  startMockTest: (testId: string) => 
    globalTestExecutionFeedback.startTestExecution(testId, ExecutionMode.MOCK_ONLY),

  /**
   * Start tracking test with real implementation mode
   */
  startRealTest: (testId: string) => 
    globalTestExecutionFeedback.startTestExecution(testId, ExecutionMode.REAL_ONLY),

  /**
   * Start tracking test with hybrid mode
   */
  startHybridTest: (testId: string) => 
    globalTestExecutionFeedback.startTestExecution(testId, ExecutionMode.HYBRID),

  /**
   * Record mock operation
   */
  recordMock: (testId: string, component: 'pdf' | 'field' | 'crypto', operation: string, success: boolean = true) =>
    globalTestExecutionFeedback.recordMockUsage(testId, component, operation, { success }),

  /**
   * Record real operation
   */
  recordReal: (testId: string, component: 'pdf' | 'field' | 'crypto', operation: string, success: boolean = true) =>
    globalTestExecutionFeedback.recordRealImplementationUsage(testId, component, operation, { success }),

  /**
   * Add diagnostic
   */
  addDiagnostic: (testId: string, category: DiagnosticInformation['category'], severity: DiagnosticInformation['severity'], message: string, context?: Record<string, any>) =>
    globalTestExecutionFeedback.addDiagnostic(testId, {
      category,
      severity,
      message,
      context: context || {},
      timestamp: new Date(),
      source: { component: 'test-utils' }
    }),

  /**
   * Complete test
   */
  complete: (testId: string, success: boolean) =>
    globalTestExecutionFeedback.completeTestExecution(testId, success),

  /**
   * Get current feedback
   */
  getFeedback: (testId: string) =>
    globalTestExecutionFeedback.getCurrentFeedback(testId),

  /**
   * Get status
   */
  getStatus: () =>
    globalTestExecutionFeedback.getStatus()
};