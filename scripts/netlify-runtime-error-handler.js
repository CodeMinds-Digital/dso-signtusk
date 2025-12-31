#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Netlify Runtime Error Handler
 * 
 * Provides comprehensive runtime error handling for Netlify Functions,
 * database connections, and environment variable validation.
 */

class RuntimeErrorHandler {
  constructor(options = {}) {
    this.functionTimeout = options.functionTimeout || 30000; // 30 seconds
    this.dbConnectionTimeout = options.dbConnectionTimeout || 10000; // 10 seconds
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
    
    this.errorLog = [];
    this.connectionPool = new Map();
    
    // Initialize error tracking
    this.initializeErrorTracking();
  }

  /**
   * Initialize error tracking and monitoring
   */
  initializeErrorTracking() {
    // Track unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logError('UNHANDLED_REJECTION', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise.toString()
      });
    });

    // Track uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logError('UNCAUGHT_EXCEPTION', {
        message: error.message,
        stack: error.stack
      });
      
      // Graceful shutdown
      this.gracefulShutdown();
    });
  }

  /**
   * Wrap Netlify Function with comprehensive error handling
   */
  wrapNetlifyFunction(handler, options = {}) {
    const timeout = options.timeout || this.functionTimeout;
    const enableRetry = options.enableRetry !== false;
    
    return async (event, context) => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();
      
      // Set up timeout
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new RuntimeError(
            'Function execution timeout',
            'FUNCTION_TIMEOUT',
            { timeout, requestId, duration: Date.now() - startTime }
          ));
        }, timeout);
      });

      try {
        this.logInfo(`Function started: ${requestId}`);
        
        // Validate environment variables
        await this.validateEnvironmentVariables(options.requiredEnvVars || []);
        
        // Execute function with timeout
        const result = await Promise.race([
          this.executeWithRetry(handler, [event, context], enableRetry),
          timeoutPromise
        ]);
        
        const duration = Date.now() - startTime;
        this.logInfo(`Function completed: ${requestId} (${duration}ms)`);
        
        return this.formatSuccessResponse(result, { requestId, duration });
        
      } catch (error) {
        const duration = Date.now() - startTime;
        this.logError('FUNCTION_ERROR', {
          requestId,
          duration,
          error: error.message,
          stack: error.stack,
          event: this.sanitizeEvent(event)
        });
        
        return this.formatErrorResponse(error, { requestId, duration });
      }
    };
  }

  /**
   * Execute function with retry logic
   */
  async executeWithRetry(handler, args, enableRetry = true) {
    let lastError = null;
    const maxAttempts = enableRetry ? this.maxRetries : 1;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await handler(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts && this.isRetryableError(error)) {
          this.logWarning(`Function attempt ${attempt} failed, retrying...`, {
            error: error.message,
            attempt,
            maxAttempts
          });
          
          await this.sleep(this.retryDelay * attempt);
        } else {
          break;
        }
      }
    }
    
    throw lastError;
  }

  /**
   * Database connection error recovery
   */
  async connectWithRecovery(connectionConfig, connectionKey = 'default') {
    const maxAttempts = 3;
    let lastError = null;
    
    // Check if we have a cached connection
    if (this.connectionPool.has(connectionKey)) {
      const cachedConnection = this.connectionPool.get(connectionKey);
      if (await this.testConnection(cachedConnection)) {
        return cachedConnection;
      } else {
        // Remove stale connection
        this.connectionPool.delete(connectionKey);
      }
    }
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.logInfo(`Database connection attempt ${attempt}/${maxAttempts}`);
        
        const connection = await this.createConnection(connectionConfig);
        
        // Test the connection
        if (await this.testConnection(connection)) {
          this.connectionPool.set(connectionKey, connection);
          this.logInfo(`Database connected successfully on attempt ${attempt}`);
          return connection;
        } else {
          throw new RuntimeError(
            'Connection test failed',
            'CONNECTION_TEST_FAILED',
            { attempt, connectionKey }
          );
        }
        
      } catch (error) {
        lastError = error;
        
        this.logError('DATABASE_CONNECTION_ERROR', {
          attempt,
          maxAttempts,
          error: error.message,
          connectionKey
        });
        
        if (attempt < maxAttempts) {
          const delay = this.retryDelay * Math.pow(2, attempt - 1);
          this.logInfo(`Retrying database connection in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw new RuntimeError(
      'Database connection failed after all retry attempts',
      'DATABASE_CONNECTION_EXHAUSTED',
      {
        attempts: maxAttempts,
        lastError: lastError.message,
        connectionKey
      }
    );
  }

  /**
   * Create database connection based on configuration
   */
  async createConnection(config) {
    const timeout = this.dbConnectionTimeout;
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new RuntimeError(
          'Database connection timeout',
          'CONNECTION_TIMEOUT',
          { timeout, config: this.sanitizeConfig(config) }
        ));
      }, timeout);
      
      try {
        // This would be implemented based on your specific database client
        // For example, with Prisma:
        // const prisma = new PrismaClient(config);
        // prisma.$connect().then(() => {
        //   clearTimeout(timeoutId);
        //   resolve(prisma);
        // }).catch(reject);
        
        // Placeholder implementation
        setTimeout(() => {
          clearTimeout(timeoutId);
          resolve({ connected: true, config });
        }, 100);
        
      } catch (error) {
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * Test database connection health
   */
  async testConnection(connection) {
    try {
      // This would be implemented based on your specific database client
      // For example, with Prisma:
      // await connection.$queryRaw`SELECT 1`;
      
      // Placeholder implementation
      return connection && connection.connected;
    } catch (error) {
      this.logWarning('Connection health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * Comprehensive environment variable validation
   */
  async validateEnvironmentVariables(requiredVars = []) {
    const missingVars = [];
    const invalidVars = [];
    const warnings = [];
    
    // Check required variables
    for (const varName of requiredVars) {
      const value = process.env[varName];
      
      if (!value) {
        missingVars.push(varName);
      } else if (this.isInvalidEnvValue(value)) {
        invalidVars.push({ name: varName, value: this.sanitizeValue(value) });
      }
    }
    
    // Check common variables for validity
    const commonVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'NODE_ENV'
    ];
    
    for (const varName of commonVars) {
      const value = process.env[varName];
      if (value && this.isInvalidEnvValue(value)) {
        warnings.push({ name: varName, issue: 'potentially invalid format' });
      }
    }
    
    // Report issues
    if (missingVars.length > 0) {
      throw new RuntimeError(
        'Required environment variables are missing',
        'MISSING_ENV_VARS',
        { missingVars, requiredVars }
      );
    }
    
    if (invalidVars.length > 0) {
      throw new RuntimeError(
        'Environment variables have invalid values',
        'INVALID_ENV_VARS',
        { invalidVars }
      );
    }
    
    if (warnings.length > 0) {
      this.logWarning('Environment variable warnings', { warnings });
    }
    
    this.logInfo(`Environment validation passed for ${requiredVars.length} variables`);
  }

  /**
   * Check if environment variable value is invalid
   */
  isInvalidEnvValue(value) {
    // Check for common invalid patterns
    const invalidPatterns = [
      /^your-.*-here$/i,
      /^replace.*$/i,
      /^example.*$/i,
      /^test.*$/i,
      /^dummy.*$/i,
      /^placeholder.*$/i
    ];
    
    return invalidPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Determine if error is retryable
   */
  isRetryableError(error) {
    const retryableCodes = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'CONNECTION_TIMEOUT',
      'TEMPORARY_FAILURE'
    ];
    
    if (error.code && retryableCodes.includes(error.code)) {
      return true;
    }
    
    const retryableMessages = [
      'connection reset',
      'timeout',
      'temporary failure',
      'service unavailable',
      'rate limit'
    ];
    
    const errorMessage = error.message.toLowerCase();
    return retryableMessages.some(msg => errorMessage.includes(msg));
  }

  /**
   * Format successful response
   */
  formatSuccessResponse(result, metadata = {}) {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': metadata.requestId,
        'X-Response-Time': `${metadata.duration}ms`
      },
      body: JSON.stringify({
        success: true,
        data: result,
        metadata: {
          requestId: metadata.requestId,
          timestamp: new Date().toISOString(),
          duration: metadata.duration
        }
      })
    };
  }

  /**
   * Format error response
   */
  formatErrorResponse(error, metadata = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      statusCode: this.getStatusCodeFromError(error),
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': metadata.requestId,
        'X-Response-Time': `${metadata.duration}ms`
      },
      body: JSON.stringify({
        success: false,
        error: {
          message: error.message,
          code: error.code || 'INTERNAL_ERROR',
          ...(isProduction ? {} : { stack: error.stack })
        },
        metadata: {
          requestId: metadata.requestId,
          timestamp: new Date().toISOString(),
          duration: metadata.duration
        }
      })
    };
  }

  /**
   * Get appropriate HTTP status code from error
   */
  getStatusCodeFromError(error) {
    const statusMap = {
      'VALIDATION_ERROR': 400,
      'MISSING_ENV_VARS': 500,
      'INVALID_ENV_VARS': 500,
      'DATABASE_CONNECTION_EXHAUSTED': 503,
      'FUNCTION_TIMEOUT': 504,
      'CONNECTION_TIMEOUT': 504
    };
    
    return statusMap[error.code] || 500;
  }

  /**
   * Graceful shutdown procedure
   */
  async gracefulShutdown() {
    this.logInfo('Initiating graceful shutdown...');
    
    try {
      // Close database connections
      for (const [key, connection] of this.connectionPool) {
        try {
          if (connection && typeof connection.disconnect === 'function') {
            await connection.disconnect();
          }
          this.logInfo(`Closed connection: ${key}`);
        } catch (error) {
          this.logWarning(`Failed to close connection ${key}:`, { error: error.message });
        }
      }
      
      this.connectionPool.clear();
      this.logInfo('Graceful shutdown completed');
      
    } catch (error) {
      this.logError('SHUTDOWN_ERROR', { error: error.message });
    }
    
    process.exit(1);
  }

  /**
   * Utility methods
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  sanitizeEvent(event) {
    // Remove sensitive data from event for logging
    const sanitized = { ...event };
    if (sanitized.headers) {
      delete sanitized.headers.authorization;
      delete sanitized.headers.cookie;
    }
    return sanitized;
  }

  sanitizeConfig(config) {
    // Remove sensitive data from config for logging
    const sanitized = { ...config };
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.secret) sanitized.secret = '[REDACTED]';
    return sanitized;
  }

  sanitizeValue(value) {
    if (typeof value === 'string' && value.length > 20) {
      return `${value.substring(0, 10)}...[REDACTED]`;
    }
    return value;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  logInfo(message, data = {}) {
    console.log(`ℹ️  ${message}`, data);
  }

  logWarning(message, data = {}) {
    console.warn(`⚠️  ${message}`, data);
  }

  logError(type, data = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      type,
      ...data
    };
    
    this.errorLog.push(errorEntry);
    console.error(`❌ ${type}:`, data);
  }
}

/**
 * Custom runtime error class
 */
class RuntimeError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Environment variable validation utilities
 */
class EnvironmentValidator {
  static validateDatabaseUrl(url) {
    if (!url) return { valid: false, error: 'Database URL is required' };
    
    try {
      const parsed = new URL(url);
      if (!['postgresql', 'postgres', 'mysql', 'sqlite'].includes(parsed.protocol.replace(':', ''))) {
        return { valid: false, error: 'Unsupported database protocol' };
      }
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid database URL format' };
    }
  }

  static validateJwtSecret(secret) {
    if (!secret) return { valid: false, error: 'JWT secret is required' };
    if (secret.length < 32) return { valid: false, error: 'JWT secret must be at least 32 characters' };
    return { valid: true };
  }

  static validateNodeEnv(env) {
    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(env)) {
      return { valid: false, error: `NODE_ENV must be one of: ${validEnvs.join(', ')}` };
    }
    return { valid: true };
  }
}

module.exports = { 
  RuntimeErrorHandler, 
  RuntimeError, 
  EnvironmentValidator 
};

// Example usage for Netlify Functions
if (require.main === module) {
  const handler = new RuntimeErrorHandler();
  
  // Example function wrapper
  const myFunction = handler.wrapNetlifyFunction(
    async (event, context) => {
      // Your function logic here
      return { message: 'Hello World' };
    },
    {
      timeout: 30000,
      requiredEnvVars: ['DATABASE_URL', 'JWT_SECRET'],
      enableRetry: true
    }
  );
  
  console.log('Runtime error handler initialized');
}