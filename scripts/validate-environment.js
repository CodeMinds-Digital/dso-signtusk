#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates all required environment variables for the SignTusk application
 */

const fs = require('fs');
const path = require('path');

// Define required environment variables by category
const REQUIRED_ENV_VARS = {
  // Core Authentication & Security
  auth: [
    'NEXTAUTH_SECRET',
    'NEXT_PRIVATE_ENCRYPTION_KEY',
    'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY',
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'SESSION_SECRET'
  ],
  
  // Application URLs
  urls: [
    'NEXT_PUBLIC_WEBAPP_URL',
    'NEXT_PRIVATE_INTERNAL_WEBAPP_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_API_URL'
  ],
  
  // Database Configuration
  database: [
    'NEXT_PRIVATE_DATABASE_URL',
    'NEXT_PRIVATE_DIRECT_DATABASE_URL'
  ],
  
  // Server Configuration
  server: [
    'PORT',
    'NODE_ENV'
  ],
  
  // Email/SMTP Configuration
  email: [
    'NEXT_PRIVATE_SMTP_FROM_NAME',
    'NEXT_PRIVATE_SMTP_FROM_ADDRESS'
  ],
  
  // Storage Configuration
  storage: [
    'NEXT_PUBLIC_UPLOAD_TRANSPORT',
    'NEXT_PRIVATE_SIGNING_TRANSPORT'
  ],
  
  // Background Jobs
  jobs: [
    'NEXT_PRIVATE_JOBS_PROVIDER'
  ]
};

// Optional but recommended environment variables
const RECOMMENDED_ENV_VARS = {
  redis: ['REDIS_URL'],
  smtp: [
    'NEXT_PRIVATE_SMTP_HOST',
    'NEXT_PRIVATE_SMTP_PORT',
    'NEXT_PRIVATE_SMTP_USERNAME',
    'NEXT_PRIVATE_SMTP_PASSWORD'
  ],
  features: [
    'PDF_GENERATION_METHOD',
    'DOCUMENSO_DISABLE_TELEMETRY'
  ]
};

// Build-time specific variables
const BUILD_TIME_VARS = [
  'NODE_ENV',
  'NEXT_PUBLIC_WEBAPP_URL',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_UPLOAD_TRANSPORT',
  'NEXT_PUBLIC_FEATURE_BILLING_ENABLED',
  'NEXT_PUBLIC_DISABLE_SIGNUP',
  'NEXT_PUBLIC_POSTHOG_KEY',
  'NEXT_PUBLIC_DOCUMENT_SIZE_UPLOAD_LIMIT'
];

// Runtime specific variables
const RUNTIME_VARS = [
  'NEXTAUTH_SECRET',
  'NEXT_PRIVATE_ENCRYPTION_KEY',
  'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY',
  'NEXT_PRIVATE_DATABASE_URL',
  'NEXT_PRIVATE_DIRECT_DATABASE_URL',
  'NEXT_PRIVATE_INTERNAL_WEBAPP_URL',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
  'SESSION_SECRET'
];

class EnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  /**
   * Load environment variables from multiple sources
   */
  loadEnvironmentVariables() {
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
    const envVars = { ...process.env };

    // Load from .env files
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').replace(/^["']|["']$/g, '');
              if (!envVars[key]) {
                envVars[key] = value;
              }
            }
          }
        }
        this.info.push(`✓ Loaded environment file: ${envFile}`);
      }
    }

    return envVars;
  }

  /**
   * Validate required environment variables
   */
  validateRequired(envVars) {
    let missingCount = 0;

    for (const [category, vars] of Object.entries(REQUIRED_ENV_VARS)) {
      const missing = [];
      
      for (const varName of vars) {
        if (!envVars[varName] || envVars[varName].trim() === '') {
          missing.push(varName);
          missingCount++;
        }
      }

      if (missing.length > 0) {
        this.errors.push(`Missing required ${category} variables: ${missing.join(', ')}`);
      } else {
        this.info.push(`✓ All ${category} variables present`);
      }
    }

    return missingCount === 0;
  }

  /**
   * Validate recommended environment variables
   */
  validateRecommended(envVars) {
    for (const [category, vars] of Object.entries(RECOMMENDED_ENV_VARS)) {
      const missing = [];
      
      for (const varName of vars) {
        if (!envVars[varName] || envVars[varName].trim() === '') {
          missing.push(varName);
        }
      }

      if (missing.length > 0) {
        this.warnings.push(`Missing recommended ${category} variables: ${missing.join(', ')}`);
      }
    }
  }

  /**
   * Validate environment variable values
   */
  validateValues(envVars) {
    // Check encryption key lengths
    const encryptionKeys = [
      'NEXT_PRIVATE_ENCRYPTION_KEY',
      'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY',
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'SESSION_SECRET'
    ];

    for (const key of encryptionKeys) {
      if (envVars[key] && envVars[key].length < 32) {
        this.warnings.push(`${key} should be at least 32 characters long for security`);
      }
    }

    // Check URL formats
    const urlVars = [
      'NEXT_PUBLIC_WEBAPP_URL',
      'NEXT_PRIVATE_INTERNAL_WEBAPP_URL',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_API_URL'
    ];

    for (const key of urlVars) {
      if (envVars[key] && !envVars[key].match(/^https?:\/\/.+/)) {
        this.warnings.push(`${key} should be a valid HTTP/HTTPS URL`);
      }
    }

    // Check database URL format
    if (envVars['NEXT_PRIVATE_DATABASE_URL'] && 
        !envVars['NEXT_PRIVATE_DATABASE_URL'].match(/^postgresql:\/\/.+/)) {
      this.warnings.push('NEXT_PRIVATE_DATABASE_URL should be a valid PostgreSQL connection string');
    }

    // Check port is numeric
    if (envVars['PORT'] && isNaN(parseInt(envVars['PORT']))) {
      this.errors.push('PORT must be a valid number');
    }
  }

  /**
   * Check build vs runtime variable classification
   */
  validateBuildTimeVsRuntime(envVars) {
    const buildMissing = BUILD_TIME_VARS.filter(v => !envVars[v]);
    const runtimeMissing = RUNTIME_VARS.filter(v => !envVars[v]);

    if (buildMissing.length > 0) {
      this.warnings.push(`Missing build-time variables: ${buildMissing.join(', ')}`);
    }

    if (runtimeMissing.length > 0) {
      this.errors.push(`Missing runtime variables: ${runtimeMissing.join(', ')}`);
    }
  }

  /**
   * Create .env.local from .env.example if missing
   */
  ensureLocalEnvFile() {
    if (!fs.existsSync('.env.local') && fs.existsSync('.env.example')) {
      try {
        fs.copyFileSync('.env.example', '.env.local');
        this.info.push('✓ Created .env.local from .env.example');
        return true;
      } catch (error) {
        this.errors.push(`Failed to create .env.local: ${error.message}`);
        return false;
      }
    } else if (fs.existsSync('.env.local')) {
      this.info.push('✓ .env.local already exists');
      return true;
    } else {
      this.warnings.push('No .env.example found to copy to .env.local');
      return false;
    }
  }

  /**
   * Generate environment template with missing variables
   */
  generateMissingEnvTemplate() {
    const envVars = this.loadEnvironmentVariables();
    const allRequired = Object.values(REQUIRED_ENV_VARS).flat();
    const missing = allRequired.filter(v => !envVars[v]);

    if (missing.length === 0) {
      return null;
    }

    let template = '# Missing Environment Variables\n';
    template += '# Add these to your .env.local file\n\n';

    for (const [category, vars] of Object.entries(REQUIRED_ENV_VARS)) {
      const categoryMissing = vars.filter(v => missing.includes(v));
      if (categoryMissing.length > 0) {
        template += `# ${category.toUpperCase()} CONFIGURATION\n`;
        for (const varName of categoryMissing) {
          template += `${varName}=""\n`;
        }
        template += '\n';
      }
    }

    return template;
  }

  /**
   * Run complete validation
   */
  validate() {
    console.log('🔍 Validating environment configuration...\n');

    // Ensure .env.local exists
    this.ensureLocalEnvFile();

    // Load all environment variables
    const envVars = this.loadEnvironmentVariables();

    // Run validations
    const requiredValid = this.validateRequired(envVars);
    this.validateRecommended(envVars);
    this.validateValues(envVars);
    this.validateBuildTimeVsRuntime(envVars);

    // Generate missing template if needed
    const missingTemplate = this.generateMissingEnvTemplate();
    if (missingTemplate) {
      fs.writeFileSync('.env.missing', missingTemplate);
      this.info.push('✓ Generated .env.missing with template for missing variables');
    }

    // Report results
    this.reportResults();

    return {
      success: requiredValid && this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info
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
      console.log('✅ Environment validation passed!');
    } else {
      console.log('❌ Environment validation failed!');
      console.log('\nTo fix these issues:');
      console.log('1. Check .env.missing for a template of missing variables');
      console.log('2. Add missing variables to .env.local');
      console.log('3. Run this script again to verify');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new EnvironmentValidator();
  const result = validator.validate();
  process.exit(result.success ? 0 : 1);
}

module.exports = EnvironmentValidator;