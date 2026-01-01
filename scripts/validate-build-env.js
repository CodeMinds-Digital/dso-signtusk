#!/usr/bin/env node

/**
 * Build-time Environment Validation Script
 * Validates environment variables before starting the build process
 */

const fs = require('fs');
const path = require('path');

class BuildEnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  /**
   * Load environment variables with proper precedence
   */
  loadEnvironmentWithPrecedence() {
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // Environment file precedence (lowest to highest priority)
    const envFiles = [
      '.env',                    // Defaults
      `.env.${nodeEnv}`,        // Environment-specific
      '.env.local',             // Local overrides
    ];

    const env = { ...process.env }; // Start with system env

    // Load files in order (later files override earlier ones)
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        try {
          const content = fs.readFileSync(envFile, 'utf8');
          const fileEnv = this.parseEnvFile(content);
          
          // Override with file values
          Object.assign(env, fileEnv);
          this.info.push(`✓ Loaded: ${envFile}`);
        } catch (error) {
          this.warnings.push(`Could not load ${envFile}: ${error.message}`);
        }
      }
    }

    return env;
  }

  /**
   * Parse environment file content
   */
  parseEnvFile(content) {
    const env = {};
    const lines = content.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }

    return env;
  }

  /**
   * Validate build-time variables
   */
  validateBuildTimeVariables(env) {
    const requiredBuildVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_WEBAPP_URL',
      'NEXT_PUBLIC_APP_URL'
    ];

    const missing = [];
    for (const varName of requiredBuildVars) {
      if (!env[varName] || env[varName].trim() === '') {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      this.errors.push(`Missing required build-time variables: ${missing.join(', ')}`);
      return false;
    }

    this.info.push('✓ All required build-time variables present');
    return true;
  }

  /**
   * Validate runtime variables
   */
  validateRuntimeVariables(env) {
    const requiredRuntimeVars = [
      'NEXTAUTH_SECRET',
      'NEXT_PRIVATE_ENCRYPTION_KEY',
      'NEXT_PRIVATE_DATABASE_URL'
    ];

    const missing = [];
    for (const varName of requiredRuntimeVars) {
      if (!env[varName] || env[varName].trim() === '') {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      this.errors.push(`Missing required runtime variables: ${missing.join(', ')}`);
      return false;
    }

    this.info.push('✓ All required runtime variables present');
    return true;
  }

  /**
   * Validate variable formats and values
   */
  validateVariableFormats(env) {
    let valid = true;

    // Check encryption key lengths
    const encryptionKeys = [
      'NEXTAUTH_SECRET',
      'NEXT_PRIVATE_ENCRYPTION_KEY',
      'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY',
      'JWT_SECRET',
      'ENCRYPTION_KEY'
    ];

    for (const key of encryptionKeys) {
      if (env[key] && env[key].length < 32) {
        this.warnings.push(`${key} should be at least 32 characters for security`);
      }
    }

    // Check URL formats
    const urlVars = [
      'NEXT_PUBLIC_WEBAPP_URL',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_API_URL',
      'NEXT_PRIVATE_INTERNAL_WEBAPP_URL'
    ];

    for (const key of urlVars) {
      if (env[key] && !env[key].match(/^https?:\/\/.+/)) {
        this.errors.push(`${key} must be a valid HTTP/HTTPS URL`);
        valid = false;
      }
    }

    // Check database URL
    if (env['NEXT_PRIVATE_DATABASE_URL'] && 
        !env['NEXT_PRIVATE_DATABASE_URL'].match(/^postgresql:\/\/.+/)) {
      this.errors.push('NEXT_PRIVATE_DATABASE_URL must be a valid PostgreSQL connection string');
      valid = false;
    }

    // Check port
    if (env['PORT'] && isNaN(parseInt(env['PORT']))) {
      this.errors.push('PORT must be a valid number');
      valid = false;
    }

    return valid;
  }

  /**
   * Check for common configuration issues
   */
  checkCommonIssues(env) {
    // Check for development vs production mismatches
    if (env['NODE_ENV'] === 'production') {
      if (env['NEXT_PUBLIC_WEBAPP_URL'] && env['NEXT_PUBLIC_WEBAPP_URL'].includes('localhost')) {
        this.warnings.push('Production build with localhost URL detected');
      }
      
      if (!env['NEXTAUTH_SECRET'] || env['NEXTAUTH_SECRET'].length < 32) {
        this.errors.push('Production builds require a secure NEXTAUTH_SECRET (32+ characters)');
      }
    }

    // Check for missing optional but important variables
    const importantOptional = [
      'REDIS_URL',
      'NEXT_PRIVATE_SMTP_HOST',
      'NEXT_PRIVATE_SIGNING_TRANSPORT'
    ];

    const missingOptional = importantOptional.filter(v => !env[v]);
    if (missingOptional.length > 0) {
      this.warnings.push(`Missing optional but recommended variables: ${missingOptional.join(', ')}`);
    }
  }

  /**
   * Generate environment summary for build logs
   */
  generateBuildSummary(env) {
    const summary = {
      nodeEnv: env['NODE_ENV'] || 'development',
      webappUrl: env['NEXT_PUBLIC_WEBAPP_URL'] || 'not set',
      databaseConfigured: !!env['NEXT_PRIVATE_DATABASE_URL'],
      redisConfigured: !!env['REDIS_URL'],
      smtpConfigured: !!env['NEXT_PRIVATE_SMTP_HOST'],
      signingConfigured: !!env['NEXT_PRIVATE_SIGNING_TRANSPORT'],
      buildTimeVars: Object.keys(env).filter(k => k.startsWith('NEXT_PUBLIC_')).length,
      runtimeVars: Object.keys(env).filter(k => k.startsWith('NEXT_PRIVATE_')).length
    };

    this.info.push('📊 Build Environment Summary:');
    this.info.push(`   Environment: ${summary.nodeEnv}`);
    this.info.push(`   Webapp URL: ${summary.webappUrl}`);
    this.info.push(`   Database: ${summary.databaseConfigured ? '✓' : '✗'}`);
    this.info.push(`   Redis: ${summary.redisConfigured ? '✓' : '✗'}`);
    this.info.push(`   SMTP: ${summary.smtpConfigured ? '✓' : '✗'}`);
    this.info.push(`   Signing: ${summary.signingConfigured ? '✓' : '✗'}`);
    this.info.push(`   Build-time vars: ${summary.buildTimeVars}`);
    this.info.push(`   Runtime vars: ${summary.runtimeVars}`);

    return summary;
  }

  /**
   * Run complete build environment validation
   */
  validate() {
    console.log('🔍 Validating build environment...\n');

    // Load environment with proper precedence
    const env = this.loadEnvironmentWithPrecedence();

    // Run validations
    const buildTimeValid = this.validateBuildTimeVariables(env);
    const runtimeValid = this.validateRuntimeVariables(env);
    const formatsValid = this.validateVariableFormats(env);
    
    // Check for common issues
    this.checkCommonIssues(env);

    // Generate summary
    this.generateBuildSummary(env);

    // Report results
    this.reportResults();

    const success = buildTimeValid && runtimeValid && formatsValid && this.errors.length === 0;

    return {
      success,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info,
      environment: env
    };
  }

  /**
   * Report validation results
   */
  reportResults() {
    // Info messages
    if (this.info.length > 0) {
      console.log('ℹ️  Information:');
      this.info.forEach(msg => console.log(`   ${msg}`));
      console.log();
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach(msg => console.log(`   ${msg}`));
      console.log();
    }

    // Errors
    if (this.errors.length > 0) {
      console.log('❌ Errors:');
      this.errors.forEach(msg => console.log(`   ${msg}`));
      console.log();
    }

    // Summary
    if (this.errors.length === 0) {
      console.log('✅ Build environment validation passed!');
    } else {
      console.log('❌ Build environment validation failed!');
      console.log('\nBuild cannot proceed with these errors.');
      console.log('Please fix the environment configuration and try again.');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new BuildEnvironmentValidator();
  const result = validator.validate();
  process.exit(result.success ? 0 : 1);
}

module.exports = BuildEnvironmentValidator;