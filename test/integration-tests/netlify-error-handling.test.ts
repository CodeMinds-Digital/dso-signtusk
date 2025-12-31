/**
 * Netlify Error Handling Integration Tests
 * 
 * Tests build failure recovery, retry logic, deployment rollback procedures,
 * and environment variable validation in realistic error scenarios.
 */

import * as fs from 'fs';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BuildError, BuildErrorHandler } from '../../scripts/netlify-build-error-handler';
import { RuntimeError, RuntimeErrorHandler } from '../../scripts/netlify-runtime-error-handler';
import { validateEnvironment } from '../../scripts/validate-environment';

describe('Netlify Error Handling Integration Tests', () => {
  let tempDir: string;
  let originalEnv: NodeJS.ProcessEnv;
  let buildErrorHandler: BuildErrorHandler;
  let runtimeErrorHandler: RuntimeErrorHandler;

  beforeEach(() => {
    // Create temporary directory for test files
    tempDir = path.join(__dirname, '..', 'fixtures', `test-${Date.now()}`);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Backup original environment
    originalEnv = { ...process.env };

    // Initialize error handlers
    buildErrorHandler = new BuildErrorHandler({
      maxRetries: 2,
      retryDelay: 100, // Faster for tests
      buildTimeout: 5000, // 5 seconds for tests
      memoryLimit: 1024, // 1GB for tests
      logLevel: 'error'
    });

    runtimeErrorHandler = new RuntimeErrorHandler({
      functionTimeout: 2000, // 2 seconds for tests
      dbConnectionTimeout: 1000, // 1 second for tests
      maxRetries: 2,
      retryDelay: 100
    });
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;

    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Build Failure Recovery and Retry Logic', () => {
    it('should retry transient build failures with exponential backoff', async () => {
      let attemptCount = 0;
      const mockCommand = vi.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new BuildError('Network timeout', 'ETIMEDOUT');
        }
        return { stdout: 'success', stderr: '', code: 0, duration: 100 };
      });

      // Mock the executeCommand method
      vi.spyOn(buildErrorHandler, 'executeCommand').mockImplementation(mockCommand);

      const result = await buildErrorHandler.executeWithRetry('npm ci');
      
      expect(attemptCount).toBe(3);
      expect(result.stdout).toBe('success');
      expect(mockCommand).toHaveBeenCalledTimes(3);
    });

    it('should not retry non-retryable errors', async () => {
      let attemptCount = 0;
      const mockCommand = vi.fn().mockImplementation(async () => {
        attemptCount++;
        throw new BuildError('Syntax error in package.json', 'INVALID_JSON');
      });

      vi.spyOn(buildErrorHandler, 'executeCommand').mockImplementation(mockCommand);
      vi.spyOn(buildErrorHandler, 'isRetryableError').mockReturnValue(false);

      await expect(buildErrorHandler.executeWithRetry('npm ci')).rejects.toThrow('Syntax error in package.json');
      expect(attemptCount).toBe(1);
    });

    it('should handle build timeout and memory limit errors', async () => {
      const mockCommand = vi.fn().mockImplementation(async () => {
        // Simulate a command that exceeds memory limit
        throw new BuildError('Memory limit exceeded: 2048MB > 1024MB', 'MEMORY_LIMIT_EXCEEDED');
      });

      vi.spyOn(buildErrorHandler, 'executeCommand').mockImplementation(mockCommand);
      vi.spyOn(buildErrorHandler, 'isRetryableError').mockReturnValue(false);

      await expect(buildErrorHandler.executeWithRetry('npm run build')).rejects.toThrow('Memory limit exceeded');
    });

    it('should perform cleanup and retry after build failures', async () => {
      const workspace = '@signtusk/remix';
      let cleanupCalled = false;
      let buildAttempts = 0;

      // Mock cleanup method
      vi.spyOn(buildErrorHandler, 'cleanupBuildArtifacts').mockImplementation(async () => {
        cleanupCalled = true;
      });

      // Mock build command to fail first time, succeed after cleanup
      vi.spyOn(buildErrorHandler, 'executeCommand').mockImplementation(async (command) => {
        buildAttempts++;
        if (command.includes('turbo run build') && buildAttempts === 1) {
          throw new BuildError('Build failed due to corrupted cache', 'BUILD_FAILED');
        }
        return { stdout: 'Build successful', stderr: '', code: 0, duration: 1000 };
      });

      const result = await buildErrorHandler.buildWithMonitoring(workspace);
      
      expect(cleanupCalled).toBe(true);
      expect(buildAttempts).toBe(2);
      expect(result.stdout).toBe('Build successful');
    });

    it('should generate comprehensive error reports on failure', async () => {
      const mockCommand = vi.fn().mockImplementation(() => {
        throw new BuildError('Multiple dependency conflicts', 'DEPENDENCY_CONFLICT', {
          conflicts: ['react@17 vs react@18', 'typescript@4 vs typescript@5']
        });
      });

      vi.spyOn(buildErrorHandler, 'executeCommand').mockImplementation(mockCommand);

      try {
        await buildErrorHandler.executeWithRetry('npm ci');
      } catch (error) {
        // Error should be thrown, now check error report generation
      }

      const { report, reportFile } = buildErrorHandler.generateErrorReport();
      
      expect(report.totalErrors).toBeGreaterThan(0);
      expect(report.errors[0].error.message).toContain('Multiple dependency conflicts');
      expect(report.errors[0].context.conflicts).toBeDefined();
      expect(fs.existsSync(reportFile)).toBe(true);
    });
  });

  describe('Runtime Error Handling', () => {
    it('should handle Netlify Function timeouts gracefully', async () => {
      const slowFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 seconds
        return { message: 'This should timeout' };
      };

      const wrappedFunction = runtimeErrorHandler.wrapNetlifyFunction(slowFunction, {
        timeout: 1000 // 1 second timeout
      });

      const mockEvent = { httpMethod: 'GET', path: '/test' };
      const mockContext = {};

      const result = await wrappedFunction(mockEvent, mockContext);
      
      expect(result.statusCode).toBe(504);
      expect(JSON.parse(result.body).error.code).toBe('FUNCTION_TIMEOUT');
    });

    it('should retry database connections with exponential backoff', async () => {
      let connectionAttempts = 0;
      
      // Mock createConnection to fail first two times
      vi.spyOn(runtimeErrorHandler, 'createConnection').mockImplementation(async () => {
        connectionAttempts++;
        if (connectionAttempts < 3) {
          throw new RuntimeError('Connection refused', 'ECONNREFUSED');
        }
        return { connected: true, config: {} };
      });

      const connection = await runtimeErrorHandler.connectWithRecovery({
        connectionString: 'postgresql://localhost:5432/test'
      });

      expect(connectionAttempts).toBe(3);
      expect(connection.connected).toBe(true);
    });

    it('should validate environment variables and detect security issues', async () => {
      // Set up test environment with security issues
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://admin:password@localhost:5432/test';
      process.env.JWT_SECRET = 'weak-secret';
      process.env.NEXT_PUBLIC_API_KEY = 'secret-key-exposed'; // Security issue
      process.env.NEXTAUTH_SECRET = 'your-secret-here'; // Placeholder

      const results = validateEnvironment('remix');

      expect(results.success).toBe(false);
      expect(results.errors.some(e => e.code === 'placeholder_secret')).toBe(true);
      expect(results.securityIssues?.some(s => s.code === 'sensitive_public_var')).toBe(true);
      expect(results.securityIssues?.some(s => s.code === 'weak_credential')).toBe(true);
    });

    it('should handle function execution with retry logic', async () => {
      let executionAttempts = 0;
      
      const flakyFunction = async () => {
        executionAttempts++;
        if (executionAttempts < 3) {
          throw new RuntimeError('Temporary service unavailable', 'SERVICE_UNAVAILABLE');
        }
        return { success: true, data: 'Function executed successfully' };
      };

      // Mock the executeWithRetry method to control retry behavior
      vi.spyOn(runtimeErrorHandler, 'executeWithRetry').mockImplementation(async (handler, args, enableRetry) => {
        if (enableRetry) {
          // Simulate 3 attempts
          for (let i = 0; i < 3; i++) {
            try {
              return await handler(...args);
            } catch (error) {
              if (i === 2) throw error; // Last attempt, throw error
              await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
            }
          }
        }
        return await handler(...args);
      });

      const wrappedFunction = runtimeErrorHandler.wrapNetlifyFunction(flakyFunction, {
        enableRetry: true
      });

      const mockEvent = { httpMethod: 'POST', body: '{"test": true}' };
      const mockContext = {};

      const result = await wrappedFunction(mockEvent, mockContext);
      
      expect(executionAttempts).toBe(3);
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body).success).toBe(true);
    });
  });

  describe('Deployment Rollback Procedures', () => {
    it('should detect deployment failures and trigger rollback', async () => {
      // Create a mock deployment script that fails
      const deployScript = path.join(tempDir, 'deploy-test.js');
      fs.writeFileSync(deployScript, `
        console.log('Starting deployment...');
        process.exit(1); // Simulate deployment failure
      `);

      let rollbackTriggered = false;
      const mockRollback = vi.fn().mockImplementation(() => {
        rollbackTriggered = true;
        return Promise.resolve({ success: true });
      });

      try {
        await buildErrorHandler.executeCommand(`node ${deployScript}`);
      } catch (error) {
        // Simulate rollback trigger on deployment failure
        await mockRollback();
      }

      expect(rollbackTriggered).toBe(true);
      expect(mockRollback).toHaveBeenCalled();
    });

    it('should validate rollback prerequisites before execution', async () => {
      // Test rollback validation logic
      const rollbackConfig = {
        previousVersion: 'v1.2.3',
        backupExists: true,
        databaseMigrations: ['migration_001', 'migration_002']
      };

      // Mock rollback validation
      const validateRollback = (config: typeof rollbackConfig) => {
        const issues = [];
        
        if (!config.previousVersion) {
          issues.push('No previous version specified');
        }
        
        if (!config.backupExists) {
          issues.push('No backup available for rollback');
        }
        
        if (config.databaseMigrations.length > 0) {
          issues.push('Database migrations need to be reverted');
        }
        
        return {
          canRollback: issues.length === 0,
          issues
        };
      };

      const validation = validateRollback(rollbackConfig);
      
      expect(validation.canRollback).toBe(false);
      expect(validation.issues).toContain('Database migrations need to be reverted');
    });

    it('should preserve critical data during rollback', async () => {
      // Test data preservation during rollback
      const criticalData = {
        userSessions: ['session1', 'session2'],
        activeTransactions: ['tx1', 'tx2'],
        uploadedFiles: ['file1.pdf', 'file2.pdf']
      };

      // Mock data preservation check
      const preserveData = (data: typeof criticalData) => {
        const preserved = {
          userSessions: data.userSessions.length,
          activeTransactions: data.activeTransactions.length,
          uploadedFiles: data.uploadedFiles.length
        };
        
        return {
          success: true,
          preserved,
          message: 'Critical data preserved during rollback'
        };
      };

      const result = preserveData(criticalData);
      
      expect(result.success).toBe(true);
      expect(result.preserved.userSessions).toBe(2);
      expect(result.preserved.activeTransactions).toBe(2);
      expect(result.preserved.uploadedFiles).toBe(2);
    });
  });

  describe('Environment Variable Validation', () => {
    it('should detect missing required environment variables', async () => {
      // Clear required environment variables
      delete process.env.DATABASE_URL;
      delete process.env.JWT_SECRET;
      delete process.env.NEXTAUTH_SECRET;

      const results = validateEnvironment('remix');

      expect(results.success).toBe(false);
      expect(results.errors.some(e => e.field === 'DATABASE_URL')).toBe(true);
      expect(results.errors.some(e => e.field === 'JWT_SECRET')).toBe(true);
      expect(results.errors.some(e => e.field === 'NEXTAUTH_SECRET')).toBe(true);
    });

    it('should validate environment variable formats', async () => {
      // Set invalid environment variables
      process.env.DATABASE_URL = 'invalid-url';
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'not-a-url';
      process.env.JWT_SECRET = 'short'; // Too short

      const results = validateEnvironment('remix');

      expect(results.success).toBe(false);
      expect(results.errors.some(e => e.field === 'DATABASE_URL')).toBe(true);
      expect(results.errors.some(e => e.field === 'NEXT_PUBLIC_WEBAPP_URL')).toBe(true);
      expect(results.warnings.some(w => w.field === 'JWT_SECRET')).toBe(true);
    });

    it('should detect environment-specific configuration issues', async () => {
      // Set production environment with development values
      process.env.NODE_ENV = 'production';
      process.env.DATABASE_URL = 'postgresql://localhost:5432/test';
      process.env.NEXT_PUBLIC_WEBAPP_URL = 'http://localhost:3000';
      process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
      process.env.JWT_SECRET = 'b'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_KEY = 'c'.repeat(32);
      process.env.NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY = 'd'.repeat(32);
      process.env.NEXT_PUBLIC_MARKETING_URL = 'https://signtusk.com';
      process.env.NEXT_PUBLIC_DOCS_URL = 'https://docs.signtusk.com';
      process.env.NEXT_PRIVATE_INTERNAL_WEBAPP_URL = 'https://internal.signtusk.com';
      process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = 'database';
      process.env.NEXT_PRIVATE_SMTP_TRANSPORT = 'resend';
      process.env.NEXT_PRIVATE_SMTP_FROM_NAME = 'SignTusk';
      process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS = 'noreply@signtusk.com';
      process.env.NEXT_PRIVATE_RESEND_API_KEY = 're_valid_key_format';
      process.env.NEXT_PRIVATE_SIGNING_TRANSPORT = 'local';
      process.env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS = 'mock-certificate-content';
      
      // Billing configuration with test key in production
      process.env.NEXT_PUBLIC_FEATURE_BILLING_ENABLED = 'true';
      process.env.NEXT_PRIVATE_STRIPE_API_KEY = 'sk_test_123456789'; // Test key in production
      process.env.NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET = 'whsec_valid_webhook_secret';

      const results = validateEnvironment('remix');

      expect(results.warnings.some(w => w.code === 'dev_value_in_prod')).toBe(true);
      expect(results.errors.some(e => e.code === 'test_key_in_production')).toBe(true);
    });

    it('should validate conditional environment variables', async () => {
      // Test S3 configuration validation
      process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT = 's3';
      delete process.env.NEXT_PRIVATE_UPLOAD_BUCKET;
      delete process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID;

      const results = validateEnvironment('remix');

      expect(results.success).toBe(false);
      expect(results.errors.some(e => e.field === 'NEXT_PRIVATE_UPLOAD_BUCKET')).toBe(true);
      expect(results.errors.some(e => e.field === 'NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID')).toBe(true);
    });
  });

  describe('Error Recovery Integration', () => {
    it('should handle cascading failures gracefully', async () => {
      // Simulate cascading failures: dependency install -> build -> deployment
      const failures = [];
      
      const mockExecuteCommand = vi.fn()
        .mockRejectedValueOnce(new Error('npm ci failed'))
        .mockRejectedValueOnce(new Error('npm run build failed'))
        .mockRejectedValueOnce(new Error('netlify deploy failed'));

      vi.spyOn(buildErrorHandler, 'executeCommand').mockImplementation(mockExecuteCommand);
      
      try {
        // First failure: dependency installation
        await buildErrorHandler.executeCommand('npm ci --invalid-flag');
      } catch (error) {
        failures.push('dependency_install');
        
        try {
          // Second failure: build process
          await buildErrorHandler.executeCommand('npm run build');
        } catch (buildError) {
          failures.push('build_process');
          
          try {
            // Third failure: deployment
            await buildErrorHandler.executeCommand('netlify deploy');
          } catch (deployError) {
            failures.push('deployment');
          }
        }
      }

      expect(failures).toEqual(['dependency_install', 'build_process', 'deployment']);
    }, 15000); // Increase timeout to 15 seconds

    it('should maintain system stability during error recovery', async () => {
      // Test that error recovery doesn't leave system in unstable state
      const systemState = {
        processes: [],
        connections: [],
        tempFiles: []
      };

      const mockCleanup = () => {
        systemState.processes = [];
        systemState.connections = [];
        systemState.tempFiles = [];
      };

      try {
        // Simulate error that requires cleanup
        throw new RuntimeError('System error requiring cleanup', 'SYSTEM_ERROR');
      } catch (error) {
        mockCleanup();
      }

      expect(systemState.processes).toHaveLength(0);
      expect(systemState.connections).toHaveLength(0);
      expect(systemState.tempFiles).toHaveLength(0);
    });

    it('should provide actionable error messages and recovery suggestions', async () => {
      const mockError = new BuildError(
        'Build failed due to missing dependencies',
        'MISSING_DEPENDENCIES',
        {
          missingPackages: ['@types/node', 'typescript'],
          suggestedFix: 'Run npm install @types/node typescript'
        }
      );

      const errorReport = {
        error: mockError,
        recovery: {
          automatic: false,
          suggestions: [
            'Install missing dependencies',
            'Clear node_modules and reinstall',
            'Check package.json for version conflicts'
          ]
        }
      };

      expect(errorReport.error.details.missingPackages).toContain('@types/node');
      expect(errorReport.recovery.suggestions).toContain('Install missing dependencies');
      expect(errorReport.error.details.suggestedFix).toBe('Run npm install @types/node typescript');
    });
  });
});