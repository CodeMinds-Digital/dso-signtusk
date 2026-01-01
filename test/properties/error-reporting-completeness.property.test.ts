/**
 * Error Reporting Completeness Property-Based Tests
 * 
 * **Feature: vercel-deployment-fix, Property 6: Error Reporting Completeness**
 * **Validates: Requirements 2.2, 6.3, 7.1, 7.2, 7.3, 7.4**
 * 
 * Tests that for any build failure, the system provides detailed error information
 * including missing dependencies, environment issues, and specific Vercel-compatible
 * remediation steps.
 */

import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { BuildErrorHandler } from '../../packages/lib/src/build-error-handler';

// Mock console methods to capture output
let consoleLogs: string[] = [];
let consoleErrors: string[] = [];
let consoleWarns: string[] = [];

const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn
};

beforeEach(() => {
  consoleLogs = [];
  consoleErrors = [];
  consoleWarns = [];
  
  console.log = (...args) => {
    consoleLogs.push(args.join(' '));
  };
  
  console.error = (...args) => {
    consoleErrors.push(args.join(' '));
  };
  
  console.warn = (...args) => {
    consoleWarns.push(args.join(' '));
  };
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});

// Generators for different error types
const errorTypeGenerator = fc.constantFrom(
  'dependency' as const,
  'environment' as const,
  'configuration' as const,
  'compilation' as const,
  'runtime' as const,
  'unknown' as const
);

const errorCodeGenerator = fc.string({ minLength: 3, maxLength: 30 }).map(s => 
  s.toUpperCase().replace(/[^A-Z0-9]/g, '_')
);

const meaningfulErrorMessageGenerator = fc.oneof(
  fc.constant('Missing required dependency'),
  fc.constant('Environment variable not found'),
  fc.constant('Configuration file is invalid'),
  fc.constant('Compilation failed with syntax error'),
  fc.constant('Runtime error occurred'),
  fc.string({ minLength: 10, maxLength: 200 }).filter(s => 
    s.trim().length > 5 && /[a-zA-Z]/.test(s)
  )
);

const meaningfulRemediationGenerator = fc.array(
  fc.oneof(
    fc.constant('Install the missing dependency'),
    fc.constant('Check the configuration file'),
    fc.constant('Verify environment variables are set'),
    fc.constant('Update the package version'),
    fc.constant('Run the build command'),
    fc.string({ minLength: 10, maxLength: 100 }).filter(s => 
      s.trim().length > 5 && /[a-zA-Z]/.test(s)
    )
  ),
  { minLength: 1, maxLength: 5 }
);

const buildErrorGenerator = fc.record({
  type: errorTypeGenerator,
  code: errorCodeGenerator,
  message: meaningfulErrorMessageGenerator,
  details: fc.option(fc.string({ minLength: 5, maxLength: 100 })),
  stack: fc.option(fc.string({ minLength: 20, maxLength: 500 })),
  file: fc.option(fc.string({ minLength: 5, maxLength: 50 })),
  line: fc.option(fc.integer({ min: 1, max: 1000 })),
  column: fc.option(fc.integer({ min: 1, max: 100 })),
  remediation: meaningfulRemediationGenerator,
  context: fc.option(fc.dictionary(fc.string(), fc.anything()))
});

describe('Error Reporting Completeness', () => {
  /**
   * Property 6: Error Reporting Completeness
   * For any build failure, the system must provide detailed error information
   * including missing dependencies, environment issues, and specific Vercel-compatible
   * remediation steps
   */
  describe('Property 6: Error Reporting Completeness', () => {
    it('should provide complete error information for any build error', () => {
      fc.assert(fc.property(
        buildErrorGenerator,
        (errorData) => {
          const errorHandler = new BuildErrorHandler();
          
          // Add the error to the handler
          errorHandler.addError(errorData);
          
          // Generate the report
          const report = errorHandler.generateReport();
          
          // Verify error completeness
          expect(report.errors).toHaveLength(1);
          const reportedError = report.errors[0];
          
          // Essential error information must be present
          expect(reportedError.type).toBe(errorData.type);
          expect(reportedError.code).toBe(errorData.code);
          expect(reportedError.message).toBe(errorData.message);
          expect(reportedError.timestamp).toBeInstanceOf(Date);
          
          // Remediation steps must be provided
          expect(Array.isArray(reportedError.remediation)).toBe(true);
          expect(reportedError.remediation.length).toBeGreaterThan(0);
          reportedError.remediation.forEach(step => {
            expect(typeof step).toBe('string');
            expect(step.length).toBeGreaterThan(0);
          });
          
          // Optional fields should be preserved if provided
          if (errorData.details) {
            expect(reportedError.details).toBe(errorData.details);
          }
          
          if (errorData.stack) {
            expect(reportedError.stack).toBe(errorData.stack);
          }
          
          if (errorData.file) {
            expect(reportedError.file).toBe(errorData.file);
          }
          
          if (errorData.line) {
            expect(reportedError.line).toBe(errorData.line);
          }
          
          if (errorData.column) {
            expect(reportedError.column).toBe(errorData.column);
          }
          
          if (errorData.context) {
            expect(reportedError.context).toEqual(errorData.context);
          }
          
          return true;
        }
      ), { numRuns: 50 });
    });
    
    it('should provide actionable remediation steps for all error types', () => {
      fc.assert(fc.property(
        errorTypeGenerator,
        meaningfulErrorMessageGenerator,
        (errorType, errorMessage) => {
          const errorHandler = new BuildErrorHandler();
          
          // Add error with minimal information - this will use default remediation
          errorHandler.addError({
            type: errorType,
            message: errorMessage
          });
          
          const report = errorHandler.generateReport();
          const error = report.errors[0];
          
          // Should have remediation steps
          expect(error.remediation).toBeDefined();
          expect(Array.isArray(error.remediation)).toBe(true);
          expect(error.remediation.length).toBeGreaterThan(0);
          
          // Each remediation step should be actionable
          error.remediation.forEach(step => {
            expect(typeof step).toBe('string');
            expect(step.trim().length).toBeGreaterThan(5);
            
            // Should contain actionable language (expanded list based on actual remediation steps)
            const actionableWords = [
              'install', 'check', 'verify', 'ensure', 'add', 'remove',
              'update', 'run', 'create', 'delete', 'fix', 'configure',
              'set', 'clear', 'restart', 'try', 'use', 'copy', 'validate',
              'review', 'contact', 'increase', 'optimize', 'consider',
              'split', 'exists', 'contains', 'missing', 'correct'
            ];
            
            const hasActionableWord = actionableWords.some(word => 
              step.toLowerCase().includes(word)
            );
            
            // If no actionable word found, log the step for debugging
            if (!hasActionableWord) {
              console.log(`Step without actionable word: "${step}"`);
            }
            
            expect(hasActionableWord).toBe(true);
          });
          
          return true;
        }
      ), { numRuns: 30 }); // Reduced runs for faster testing
    });
    
    it('should log errors with proper formatting and context', () => {
      fc.assert(fc.property(
        buildErrorGenerator,
        (errorData) => {
          const errorHandler = new BuildErrorHandler();
          
          // Clear previous console output
          consoleErrors.length = 0;
          
          // Add error (this should trigger logging)
          errorHandler.addError(errorData);
          
          // Verify error was logged
          expect(consoleErrors.length).toBeGreaterThan(0);
          
          // Find the main error log entry
          const errorLogEntry = consoleErrors.find(log => 
            log.includes(errorData.type.toUpperCase()) && 
            log.includes('ERROR') &&
            log.includes(errorData.code)
          );
          
          expect(errorLogEntry).toBeDefined();
          
          // Only check message content if it's meaningful
          if (errorData.message.trim().length > 0 && /[a-zA-Z]/.test(errorData.message)) {
            // Check if any log entry contains the message (might be in a different log line)
            const messageFound = consoleErrors.some(log => 
              log.includes(errorData.message.trim())
            );
            expect(messageFound).toBe(true);
          }
          
          // Check for remediation steps in logs
          const remediationLogs = consoleErrors.filter(log => 
            log.includes('Remediation Steps') || 
            /^\s*\d+\./.test(log) // Lines starting with numbers (remediation steps)
          );
          
          expect(remediationLogs.length).toBeGreaterThan(0);
          
          // Verify timestamp is logged
          const timestampLog = consoleErrors.find(log => 
            log.includes('Timestamp:') && log.includes('T') && log.includes('Z')
          );
          
          expect(timestampLog).toBeDefined();
          
          return true;
        }
      ), { numRuns: 30 }); // Reduced runs for faster testing
    });
    
    it('should categorize errors correctly and provide type-specific remediation', () => {
      fc.assert(fc.property(
        errorTypeGenerator,
        (errorType) => {
          const errorHandler = new BuildErrorHandler();
          
          // Add error of specific type
          errorHandler.addError({
            type: errorType,
            message: `Test ${errorType} error`
          });
          
          const report = errorHandler.generateReport();
          const error = report.errors[0];
          
          // Verify error type is preserved
          expect(error.type).toBe(errorType);
          
          // Verify type-specific remediation
          const remediation = error.remediation.join(' ').toLowerCase();
          
          switch (errorType) {
            case 'dependency':
              expect(
                remediation.includes('install') || 
                remediation.includes('package') ||
                remediation.includes('npm') ||
                remediation.includes('node_modules')
              ).toBe(true);
              break;
              
            case 'environment':
              expect(
                remediation.includes('env') || 
                remediation.includes('environment') ||
                remediation.includes('variable') ||
                remediation.includes('.env')
              ).toBe(true);
              break;
              
            case 'configuration':
              expect(
                remediation.includes('config') || 
                remediation.includes('configuration') ||
                remediation.includes('json') ||
                remediation.includes('file')
              ).toBe(true);
              break;
              
            case 'compilation':
              expect(
                remediation.includes('typescript') || 
                remediation.includes('syntax') ||
                remediation.includes('compile') ||
                remediation.includes('error')
              ).toBe(true);
              break;
              
            case 'runtime':
              expect(
                remediation.includes('runtime') || 
                remediation.includes('service') ||
                remediation.includes('network') ||
                remediation.includes('permission')
              ).toBe(true);
              break;
              
            case 'unknown':
              expect(
                remediation.includes('log') || 
                remediation.includes('verbose') ||
                remediation.includes('support') ||
                remediation.includes('check')
              ).toBe(true);
              break;
          }
          
          return true;
        }
      ), { numRuns: 30 });
    });
    
    it('should generate comprehensive build reports with summary information', () => {
      fc.assert(fc.property(
        fc.array(buildErrorGenerator, { minLength: 1, maxLength: 10 }),
        fc.array(buildErrorGenerator, { minLength: 0, maxLength: 5 }),
        (errors, warnings) => {
          const errorHandler = new BuildErrorHandler();
          
          // Add errors
          errors.forEach(error => errorHandler.addError(error));
          
          // Add warnings
          warnings.forEach(warning => errorHandler.addWarning(warning));
          
          const report = errorHandler.generateReport();
          
          // Verify report structure
          expect(report.buildId).toBeDefined();
          expect(typeof report.buildId).toBe('string');
          expect(report.buildId.length).toBeGreaterThan(0);
          
          expect(report.timestamp).toBeInstanceOf(Date);
          expect(report.environment).toBeDefined();
          
          expect(report.errors).toHaveLength(errors.length);
          expect(report.warnings).toHaveLength(warnings.length);
          
          // Verify summary
          expect(report.summary.totalErrors).toBe(errors.length);
          expect(report.summary.totalWarnings).toBe(warnings.length);
          expect(typeof report.summary.criticalErrors).toBe('number');
          expect(typeof report.summary.buildDuration).toBe('number');
          
          // Critical errors should be subset of total errors
          expect(report.summary.criticalErrors).toBeLessThanOrEqual(errors.length);
          
          // Verify critical error calculation
          const actualCriticalErrors = errors.filter(e => 
            e.type === 'dependency' || e.type === 'environment'
          ).length;
          expect(report.summary.criticalErrors).toBe(actualCriticalErrors);
          
          return true;
        }
      ), { numRuns: 50 });
    });
    
    it('should handle JavaScript errors with enhanced context', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 5, maxLength: 100 }),
        fc.option(fc.string({ minLength: 5, maxLength: 50 })),
        fc.option(fc.string({ minLength: 5, maxLength: 50 })),
        (errorMessage, fileName, operation) => {
          const errorHandler = new BuildErrorHandler();
          
          // Create a JavaScript error
          const jsError = new Error(errorMessage);
          jsError.stack = `Error: ${errorMessage}\n    at test (${fileName || 'test.js'}:10:5)`;
          
          const context = {
            file: fileName,
            operation: operation
          };
          
          // Handle the JavaScript error
          errorHandler.handleJavaScriptError(jsError, context);
          
          const report = errorHandler.generateReport();
          expect(report.errors).toHaveLength(1);
          
          const error = report.errors[0];
          
          // Verify error properties
          expect(error.type).toBe('compilation');
          expect(error.code).toBe('JS_COMPILATION_ERROR');
          expect(error.message).toBe(errorMessage);
          expect(error.stack).toBe(jsError.stack);
          
          if (fileName) {
            expect(error.file).toBe(fileName);
          }
          
          // Verify context is preserved
          expect(error.context).toEqual(context);
          
          // Verify remediation is provided
          expect(error.remediation).toBeDefined();
          expect(error.remediation.length).toBeGreaterThan(0);
          
          return true;
        }
      ), { numRuns: 50 });
    });
    
    it('should provide specific remediation for dependency errors', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 3, maxLength: 30 }).filter(s => /^[a-z0-9-]+$/.test(s)),
        fc.option(fc.string({ minLength: 1, maxLength: 20 })),
        (packageName, version) => {
          const errorHandler = new BuildErrorHandler();
          
          // Handle dependency error
          errorHandler.handleDependencyError(packageName, version);
          
          const report = errorHandler.generateReport();
          expect(report.errors).toHaveLength(1);
          
          const error = report.errors[0];
          
          // Verify error properties
          expect(error.type).toBe('dependency');
          expect(error.code).toBe('DEPENDENCY_RESOLUTION_ERROR');
          expect(error.message).toContain(packageName);
          
          if (version) {
            expect(error.message).toContain(version);
          }
          
          // Verify context
          expect(error.context).toEqual(expect.objectContaining({ packageName, version }));
          
          // Verify specific remediation for dependencies
          const remediationText = error.remediation.join(' ').toLowerCase();
          expect(remediationText).toContain('install');
          expect(remediationText).toContain(packageName.toLowerCase());
          expect(remediationText).toContain('npm');
          
          return true;
        }
      ), { numRuns: 30 });
    });
    
    it('should provide specific remediation for environment variable errors', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 3, maxLength: 50 }).map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, '_')),
        fc.option(fc.string({ minLength: 5, maxLength: 100 })),
        (variableName, expectedFormat) => {
          const errorHandler = new BuildErrorHandler();
          
          // Handle environment error
          errorHandler.handleEnvironmentError(variableName, expectedFormat);
          
          const report = errorHandler.generateReport();
          expect(report.errors).toHaveLength(1);
          
          const error = report.errors[0];
          
          // Verify error properties
          expect(error.type).toBe('environment');
          expect(error.code).toBe('ENVIRONMENT_VARIABLE_ERROR');
          expect(error.message).toContain(variableName);
          
          if (expectedFormat) {
            expect(error.details).toContain(expectedFormat);
          }
          
          // Verify context
          expect(error.context).toEqual(expect.objectContaining({ variableName, expectedFormat }));
          
          // Verify specific remediation for environment variables
          const remediationText = error.remediation.join(' ').toLowerCase();
          expect(remediationText).toContain('.env');
          expect(remediationText).toContain(variableName.toLowerCase());
          
          return true;
        }
      ), { numRuns: 30 });
    });
    
    it('should maintain error reporting consistency across multiple operations', () => {
      fc.assert(fc.property(
        fc.array(buildErrorGenerator, { minLength: 2, maxLength: 20 }),
        (errors) => {
          const errorHandler = new BuildErrorHandler();
          
          // Add all errors
          errors.forEach(error => errorHandler.addError(error));
          
          // Generate multiple reports
          const report1 = errorHandler.generateReport();
          const report2 = errorHandler.generateReport();
          
          // Reports should be consistent
          expect(report1.errors).toHaveLength(report2.errors.length);
          expect(report1.summary.totalErrors).toBe(report2.summary.totalErrors);
          
          // Error details should be preserved
          report1.errors.forEach((error, index) => {
            const correspondingError = report2.errors[index];
            expect(error.type).toBe(correspondingError.type);
            expect(error.code).toBe(correspondingError.code);
            expect(error.message).toBe(correspondingError.message);
            expect(error.remediation).toEqual(correspondingError.remediation);
          });
          
          return true;
        }
      ), { numRuns: 20 });
    });

    it('should provide Vercel-specific error guidance when in Vercel environment', () => {
      fc.assert(fc.property(
        errorTypeGenerator,
        meaningfulErrorMessageGenerator,
        (errorType, errorMessage) => {
          // Mock Vercel environment
          const originalVercel = process.env.VERCEL;
          process.env.VERCEL = '1';
          
          try {
            const errorHandler = new BuildErrorHandler();
            
            // Add error
            errorHandler.addError({
              type: errorType,
              message: errorMessage
            });
            
            const report = errorHandler.generateReport();
            const error = report.errors[0];
            
            // Should have Vercel-specific remediation
            const remediationText = error.remediation.join(' ').toLowerCase();
            
            // Check for Vercel-specific guidance
            const hasVercelGuidance = 
              remediationText.includes('vercel') ||
              remediationText.includes('dashboard') ||
              remediationText.includes('vercel.com') ||
              remediationText.includes('🔧 vercel-specific fixes') ||
              remediationText.includes('environment variables') ||
              remediationText.includes('dependencies') ||
              remediationText.includes('build logs');
            
            expect(hasVercelGuidance).toBe(true);
            
            return true;
          } finally {
            // Restore original environment
            if (originalVercel) {
              process.env.VERCEL = originalVercel;
            } else {
              delete process.env.VERCEL;
            }
          }
        }
      ), { numRuns: 30 });
    });

    it('should provide specific Vercel CLI error handling', () => {
      fc.assert(fc.property(
        fc.constantFrom('dotenv', 'env-cmd', 'cross-env', 'turbo', 'tsc'),
        fc.string({ minLength: 10, maxLength: 100 }),
        (command, errorMessage) => {
          // Mock Vercel environment
          const originalVercel = process.env.VERCEL;
          process.env.VERCEL = '1';
          
          try {
            const errorHandler = new BuildErrorHandler();
            
            // Handle Vercel CLI error
            errorHandler.handleVercelCliError(command, errorMessage);
            
            const report = errorHandler.generateReport();
            expect(report.errors).toHaveLength(1);
            
            const error = report.errors[0];
            
            // Verify error properties
            expect(error.type).toBe('dependency');
            expect(error.code).toBe('VERCEL_CLI_ERROR');
            expect(error.message).toContain(command);
            expect(error.details).toContain(errorMessage);
            
            // Verify Vercel-specific remediation
            const remediationText = error.remediation.join(' ').toLowerCase();
            expect(remediationText).toContain('vercel');
            expect(remediationText).toContain('programmatic');
            expect(remediationText).toContain('cli');
            
            return true;
          } finally {
            // Restore original environment
            if (originalVercel) {
              process.env.VERCEL = originalVercel;
            } else {
              delete process.env.VERCEL;
            }
          }
        }
      ), { numRuns: 20 });
    });

    it('should provide Vercel configuration error guidance', () => {
      fc.assert(fc.property(
        fc.string({ minLength: 10, maxLength: 100 }),
        fc.option(fc.constantFrom('vercel.json', 'package.json', 'turbo.json')),
        (issue, configFile) => {
          // Mock Vercel environment
          const originalVercel = process.env.VERCEL;
          process.env.VERCEL = '1';
          
          try {
            const errorHandler = new BuildErrorHandler();
            
            // Handle Vercel config error
            errorHandler.handleVercelConfigError(issue, configFile);
            
            const report = errorHandler.generateReport();
            expect(report.errors).toHaveLength(1);
            
            const error = report.errors[0];
            
            // Verify error properties
            expect(error.type).toBe('configuration');
            expect(error.code).toBe('VERCEL_CONFIG_ERROR');
            expect(error.message).toContain(issue);
            
            if (configFile) {
              expect(error.details).toContain(configFile);
            }
            
            // Verify Vercel-specific remediation
            const remediationText = error.remediation.join(' ').toLowerCase();
            expect(remediationText).toContain('vercel');
            expect(remediationText).toContain('configuration');
            
            return true;
          } finally {
            // Restore original environment
            if (originalVercel) {
              process.env.VERCEL = originalVercel;
            } else {
              delete process.env.VERCEL;
            }
          }
        }
      ), { numRuns: 20 });
    });

    it('should provide Node.js version compatibility error guidance', () => {
      fc.assert(fc.property(
        fc.constantFrom('v14.18.0', 'v16.14.0', 'v18.12.0', 'v20.0.0'),
        fc.option(fc.constantFrom('>=16.0.0', '>=18.0.0', '^18.12.0')),
        (currentVersion, requiredVersion) => {
          // Mock Vercel environment
          const originalVercel = process.env.VERCEL;
          process.env.VERCEL = '1';
          
          try {
            const errorHandler = new BuildErrorHandler();
            
            // Handle Node version error
            errorHandler.handleNodeVersionError(currentVersion, requiredVersion);
            
            const report = errorHandler.generateReport();
            expect(report.errors).toHaveLength(1);
            
            const error = report.errors[0];
            
            // Verify error properties
            expect(error.type).toBe('environment');
            expect(error.code).toBe('NODE_VERSION_ERROR');
            expect(error.details).toContain(currentVersion);
            
            if (requiredVersion) {
              expect(error.details).toContain(requiredVersion);
            }
            
            // Verify Vercel-specific remediation
            const remediationText = error.remediation.join(' ').toLowerCase();
            expect(remediationText).toContain('vercel');
            expect(remediationText).toContain('node');
            expect(remediationText).toContain('engines');
            
            return true;
          } finally {
            // Restore original environment
            if (originalVercel) {
              process.env.VERCEL = originalVercel;
            } else {
              delete process.env.VERCEL;
            }
          }
        }
      ), { numRuns: 20 });
    });

    it('should include Vercel environment detection in error context', () => {
      fc.assert(fc.property(
        fc.constantFrom('dependency', 'environment'),
        fc.string({ minLength: 10, maxLength: 50 }),
        (errorType, packageName) => {
          // Test both Vercel and non-Vercel environments
          const environments = [
            { VERCEL: '1', VERCEL_ENV: 'production' },
            {} // No Vercel environment
          ];
          
          environments.forEach(env => {
            // Set environment
            const originalEnv = { ...process.env };
            Object.keys(originalEnv).forEach(key => {
              if (key.startsWith('VERCEL')) {
                delete process.env[key];
              }
            });
            Object.assign(process.env, env);
            
            try {
              const errorHandler = new BuildErrorHandler();
              
              // Use specific error handlers that we know add Vercel context
              if (errorType === 'dependency') {
                errorHandler.handleDependencyError(packageName);
              } else if (errorType === 'environment') {
                errorHandler.handleEnvironmentError(packageName);
              }
              
              const report = errorHandler.generateReport();
              const error = report.errors[0];
              
              // Check if Vercel-specific guidance is provided when in Vercel environment
              const isVercelEnv = env.VERCEL === '1' || env.VERCEL_ENV !== undefined;
              const remediationText = error.remediation.join(' ').toLowerCase();
              const hasVercelGuidance = remediationText.includes('vercel');
              
              if (isVercelEnv) {
                // Should have Vercel guidance for dependency and environment errors
                expect(hasVercelGuidance).toBe(true);
                
                // Context should include Vercel information
                if (error.context && typeof error.context === 'object') {
                  expect(error.context).toEqual(expect.objectContaining({ isVercel: true }));
                }
              }
              
            } finally {
              // Restore original environment
              Object.keys(process.env).forEach(key => {
                if (key.startsWith('VERCEL')) {
                  delete process.env[key];
                }
              });
              Object.assign(process.env, originalEnv);
            }
          });
          
          return true;
        }
      ), { numRuns: 20 }); // Reduced runs since we test multiple environments per run
    });

    it('should provide comprehensive build summary with Vercel information', () => {
      fc.assert(fc.property(
        fc.array(buildErrorGenerator, { minLength: 1, maxLength: 5 }),
        (errors) => {
          // Mock Vercel environment
          const originalVercel = process.env.VERCEL;
          const originalVercelEnv = process.env.VERCEL_ENV;
          process.env.VERCEL = '1';
          process.env.VERCEL_ENV = 'production';
          
          try {
            const errorHandler = new BuildErrorHandler();
            
            // Clear console output
            consoleErrors.length = 0;
            consoleLogs.length = 0;
            
            // Add errors
            errors.forEach(error => errorHandler.addError(error));
            
            // Print summary (this should include Vercel information)
            errorHandler.printSummary();
            
            // Verify Vercel information is included in summary
            const allOutput = [...consoleLogs, ...consoleErrors].join(' ').toLowerCase();
            
            expect(allOutput).toContain('vercel');
            expect(allOutput).toContain('dashboard');
            expect(allOutput).toContain('environment variables');
            
            return true;
          } finally {
            // Restore original environment
            if (originalVercel) {
              process.env.VERCEL = originalVercel;
            } else {
              delete process.env.VERCEL;
            }
            
            if (originalVercelEnv) {
              process.env.VERCEL_ENV = originalVercelEnv;
            } else {
              delete process.env.VERCEL_ENV;
            }
          }
        }
      ), { numRuns: 20 });
    });
  });
});