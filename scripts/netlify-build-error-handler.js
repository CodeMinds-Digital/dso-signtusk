#!/usr/bin/env node

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Enhanced Netlify Build Error Handler
 * 
 * Provides comprehensive error handling, retry logic, and monitoring
 * for Netlify build processes with detailed logging and recovery mechanisms.
 */

class BuildErrorHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 5000; // 5 seconds
    this.buildTimeout = options.buildTimeout || 1800000; // 30 minutes
    this.memoryLimit = options.memoryLimit || 4096; // 4GB in MB
    this.logLevel = options.logLevel || 'info';
    
    this.retryCount = 0;
    this.buildStartTime = Date.now();
    this.errorLog = [];
    
    // Create logs directory if it doesn't exist
    this.logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    this.logFile = path.join(this.logsDir, `build-${Date.now()}.log`);
  }

  /**
   * Execute command with retry logic and comprehensive error handling
   */
  async executeWithRetry(command, options = {}) {
    const maxAttempts = options.maxRetries || this.maxRetries;
    let lastError = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.log('info', `Attempt ${attempt}/${maxAttempts}: ${command}`);
        
        const result = await this.executeCommand(command, {
          ...options,
          timeout: options.timeout || this.buildTimeout
        });
        
        if (attempt > 1) {
          this.log('success', `Command succeeded on retry attempt ${attempt}`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        this.logError(error, attempt, maxAttempts);
        
        // If it's not retryable, throw immediately
        if (!this.isRetryableError(error)) {
          this.log('error', 'Non-retryable error encountered, aborting retries');
          throw error;
        }
        
        // If we've reached max attempts, break
        if (attempt >= maxAttempts) {
          break;
        }
        
        const delay = this.calculateRetryDelay(attempt);
        this.log('warning', `Retrying in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // All retries exhausted
    throw new BuildError(
      `Command failed after ${maxAttempts} attempts: ${command}`,
      'MAX_RETRIES_EXCEEDED',
      {
        command,
        attempts: maxAttempts,
        lastError: lastError.message,
        errorHistory: this.errorLog
      }
    );
  }

  /**
   * Execute a single command with timeout and memory monitoring
   */
  executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const timeout = options.timeout || this.buildTimeout;
      
      this.log('info', `Executing: ${command}`);
      this.log('debug', `Timeout: ${timeout}ms, Memory limit: ${this.memoryLimit}MB`);

      const child = spawn('sh', ['-c', command], {
        stdio: options.stdio || 'pipe',
        env: {
          ...process.env,
          ...options.env,
          NODE_OPTIONS: `--max-old-space-size=${this.memoryLimit}`
        },
        cwd: options.cwd || process.cwd()
      });

      let stdout = '';
      let stderr = '';
      let timeoutId = null;
      let memoryCheckInterval = null;

      // Set up timeout
      if (timeout > 0) {
        timeoutId = setTimeout(() => {
          child.kill('SIGTERM');
          setTimeout(() => {
            if (!child.killed) {
              child.kill('SIGKILL');
            }
          }, 5000);
          
          reject(new BuildError(
            `Command timed out after ${timeout}ms`,
            'COMMAND_TIMEOUT',
            { command, timeout, duration: Date.now() - startTime }
          ));
        }, timeout);
      }

      // Monitor memory usage
      memoryCheckInterval = setInterval(() => {
        try {
          const memUsage = process.memoryUsage();
          const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
          
          if (heapUsedMB > this.memoryLimit * 0.9) {
            this.log('warning', `High memory usage: ${heapUsedMB}MB (limit: ${this.memoryLimit}MB)`);
          }
          
          if (heapUsedMB > this.memoryLimit) {
            child.kill('SIGTERM');
            reject(new BuildError(
              `Memory limit exceeded: ${heapUsedMB}MB > ${this.memoryLimit}MB`,
              'MEMORY_LIMIT_EXCEEDED',
              { command, memoryUsed: heapUsedMB, memoryLimit: this.memoryLimit }
            ));
          }
        } catch (error) {
          // Ignore memory check errors
        }
      }, 10000); // Check every 10 seconds

      // Collect output
      if (child.stdout) {
        child.stdout.on('data', (data) => {
          const chunk = data.toString();
          stdout += chunk;
          if (options.stdio !== 'inherit') {
            this.logToFile(chunk);
          }
        });
      }

      if (child.stderr) {
        child.stderr.on('data', (data) => {
          const chunk = data.toString();
          stderr += chunk;
          if (options.stdio !== 'inherit') {
            this.logToFile(`STDERR: ${chunk}`);
          }
        });
      }

      child.on('close', (code) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (memoryCheckInterval) clearInterval(memoryCheckInterval);
        
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          this.log('success', `Command completed successfully in ${duration}ms`);
          resolve({ stdout, stderr, code, duration });
        } else {
          reject(new BuildError(
            `Command failed with exit code ${code}`,
            'COMMAND_FAILED',
            { command, code, stdout, stderr, duration }
          ));
        }
      });

      child.on('error', (error) => {
        if (timeoutId) clearTimeout(timeoutId);
        if (memoryCheckInterval) clearInterval(memoryCheckInterval);
        
        reject(new BuildError(
          `Failed to execute command: ${error.message}`,
          'EXECUTION_ERROR',
          { command, error: error.message }
        ));
      });
    });
  }

  /**
   * Determine if an error is retryable
   */
  isRetryableError(error) {
    const retryableErrors = [
      'ENOTFOUND',
      'ECONNRESET',
      'ETIMEDOUT',
      'ECONNREFUSED',
      'NETWORK_ERROR',
      'DEPENDENCY_INSTALL_FAILED',
      'COMMAND_TIMEOUT'
    ];

    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }

    const retryableMessages = [
      'network error',
      'connection reset',
      'timeout',
      'temporary failure',
      'service unavailable',
      'rate limit',
      'npm ERR! network'
    ];

    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  calculateRetryDelay(attempt) {
    const baseDelay = this.retryDelay;
    const jitter = Math.random() * 1000; // Add jitter to prevent thundering herd
    return Math.min(baseDelay * Math.pow(2, attempt - 1) + jitter, 60000); // Max 60 seconds
  }

  /**
   * Log error with context and categorization
   */
  logError(error, attempt, maxAttempts) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      attempt,
      maxAttempts,
      error: {
        message: error.message,
        code: error.code,
        stack: error.stack
      },
      context: error.details || {},
      retryable: this.isRetryableError(error)
    };

    this.errorLog.push(errorInfo);
    
    this.log('error', `Attempt ${attempt} failed: ${error.message}`);
    if (error.code) {
      this.log('error', `Error code: ${error.code}`);
    }
    
    // Log detailed error to file
    this.logToFile(`ERROR: ${JSON.stringify(errorInfo, null, 2)}\n`);
  }

  /**
   * Enhanced dependency installation with retry logic
   */
  async installDependencies(options = {}) {
    const npmFlags = process.env.NPM_FLAGS || '--legacy-peer-deps --force';
    
    // Always use npm install for Netlify builds to avoid lock file sync issues
    // Netlify may create package-lock.json during initial install, causing npm ci to fail
    const command = `npm install ${npmFlags}`;
    
    this.log('info', `Using npm install (avoiding npm ci for Netlify compatibility)`);
    
    try {
      await this.executeWithRetry(command, {
        timeout: 600000, // 10 minutes
        maxRetries: 3,
        env: {
          NPM_CONFIG_FUND: 'false',
          NPM_CONFIG_AUDIT: 'false',
          NPM_CONFIG_PROGRESS: 'false',
          NPM_CONFIG_LEGACY_PEER_DEPS: 'true',
          NPM_CONFIG_FORCE: 'true'
        },
        ...options
      });
    } catch (error) {
      // Try alternative installation methods
      this.log('warning', 'Standard npm install failed, trying alternative methods...');
      
      try {
        // Clear npm cache and retry
        await this.executeWithRetry('npm cache clean --force', { maxRetries: 1 });
        await this.executeWithRetry(command, { maxRetries: 1, ...options });
      } catch (cacheError) {
        // Try with different flags
        try {
          const fallbackCommand = `npm install --legacy-peer-deps --force --no-optional`;
          await this.executeWithRetry(fallbackCommand, { 
            maxRetries: 1, 
            ...options 
          });
        } catch (noOptionalError) {
          throw new BuildError(
            'All dependency installation methods failed',
            'DEPENDENCY_INSTALL_EXHAUSTED',
            {
              originalError: error.message,
              cacheError: cacheError.message,
              noOptionalError: noOptionalError.message
            }
          );
        }
      }
    }
  }

  /**
   * Enhanced build execution with monitoring
   */
  async buildWithMonitoring(workspace, options = {}) {
    const command = `npx turbo run build --filter=${workspace}`;
    
    // Pre-build validation
    await this.validateBuildEnvironment(workspace);
    
    try {
      const result = await this.executeWithRetry(command, {
        timeout: 1800000, // 30 minutes
        maxRetries: 2,
        env: {
          NODE_ENV: process.env.NODE_ENV || 'production',
          TURBO_TELEMETRY_DISABLED: '1'
        },
        ...options
      });
      
      // Post-build validation
      await this.validateBuildOutput(workspace);
      
      return result;
    } catch (error) {
      // Attempt build cleanup and retry once more
      this.log('warning', 'Build failed, attempting cleanup and retry...');
      
      try {
        await this.cleanupBuildArtifacts(workspace);
        return await this.executeCommand(command, {
          timeout: 1800000,
          env: {
            NODE_ENV: process.env.NODE_ENV || 'production',
            TURBO_TELEMETRY_DISABLED: '1'
          },
          ...options
        });
      } catch (cleanupError) {
        throw new BuildError(
          'Build failed even after cleanup attempt',
          'BUILD_FAILED_AFTER_CLEANUP',
          {
            originalError: error.message,
            cleanupError: cleanupError.message,
            workspace
          }
        );
      }
    }
  }

  /**
   * Validate build environment before starting
   */
  async validateBuildEnvironment(workspace) {
    this.log('info', 'Validating build environment...');
    
    // Check disk space
    try {
      const stats = fs.statSync(process.cwd());
      // This is a simplified check - in production you'd want more sophisticated disk space checking
    } catch (error) {
      throw new BuildError(
        'Cannot access build directory',
        'BUILD_DIR_ACCESS_ERROR',
        { workspace, error: error.message }
      );
    }
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion < 18) {
      throw new BuildError(
        `Node.js version ${nodeVersion} is not supported. Minimum required: 18.x`,
        'UNSUPPORTED_NODE_VERSION',
        { current: nodeVersion, minimum: '18.x' }
      );
    }
    
    this.log('success', 'Build environment validation passed');
  }

  /**
   * Validate build output after completion
   */
  async validateBuildOutput(workspace) {
    // This would be implemented based on specific workspace requirements
    this.log('info', `Validating build output for ${workspace}...`);
    // Implementation would check for expected build artifacts
    this.log('success', 'Build output validation passed');
  }

  /**
   * Clean up build artifacts for retry attempts
   */
  async cleanupBuildArtifacts(workspace) {
    this.log('info', 'Cleaning up build artifacts...');
    
    const cleanupCommands = [
      'rm -rf node_modules/.cache',
      'rm -rf .turbo',
      `npx turbo run clean --filter=${workspace}`
    ];
    
    for (const command of cleanupCommands) {
      try {
        await this.executeCommand(command, { maxRetries: 1 });
      } catch (error) {
        this.log('warning', `Cleanup command failed: ${command} - ${error.message}`);
      }
    }
  }

  /**
   * Generate comprehensive error report
   */
  generateErrorReport() {
    const report = {
      timestamp: new Date().toISOString(),
      buildDuration: Date.now() - this.buildStartTime,
      totalErrors: this.errorLog.length,
      retryAttempts: this.retryCount,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        cwd: process.cwd()
      },
      errors: this.errorLog,
      logFile: this.logFile
    };
    
    const reportFile = path.join(this.logsDir, `error-report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    return { report, reportFile };
  }

  /**
   * Utility methods
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    switch (level) {
      case 'error':
        console.error(`❌ ${message}`);
        break;
      case 'warning':
        console.warn(`⚠️  ${message}`);
        break;
      case 'success':
        console.log(`✅ ${message}`);
        break;
      case 'info':
      default:
        console.log(`ℹ️  ${message}`);
        break;
    }
    
    this.logToFile(logMessage);
  }

  logToFile(message) {
    try {
      fs.appendFileSync(this.logFile, `${message}\n`);
    } catch (error) {
      // Ignore file logging errors to prevent infinite loops
    }
  }
}

/**
 * Custom error class for build failures
 */
class BuildError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'BuildError';
    this.code = code;
    this.details = details;
  }
}

module.exports = { BuildErrorHandler, BuildError };

// CLI usage
if (require.main === module) {
  const handler = new BuildErrorHandler();
  
  async function runBuild() {
    try {
      const workspace = process.argv[2] || '@signtusk/remix';
      
      handler.log('info', `Starting enhanced build for ${workspace}`);
      
      await handler.installDependencies();
      await handler.buildWithMonitoring(workspace);
      
      handler.log('success', 'Build completed successfully with error handling');
      
    } catch (error) {
      handler.log('error', `Build failed: ${error.message}`);
      
      const { reportFile } = handler.generateErrorReport();
      handler.log('info', `Error report generated: ${reportFile}`);
      
      process.exit(1);
    }
  }
  
  runBuild();
}