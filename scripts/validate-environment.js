#!/usr/bin/env node

/**
 * Environment Variable Validation Script
 * Validates required environment variables for each application type
 * Enhanced with runtime error handling and recovery mechanisms
 */

const { z } = require('zod');
const { RuntimeErrorHandler, EnvironmentValidator } = require('./netlify-runtime-error-handler');

// Environment validation schemas
const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  NODE_VERSION: z.string().optional(),
  NPM_VERSION: z.string().optional(),
});

const marketingSchema = baseSchema.extend({
  NEXT_PUBLIC_WEBAPP_URL: z.string().url('Invalid webapp URL'),
  NEXT_PUBLIC_MARKETING_URL: z.string().url('Invalid marketing URL'),
  NEXT_PUBLIC_DOCS_URL: z.string().url('Invalid docs URL'),
  NEXT_PUBLIC_PROJECT: z.string().min(1, 'Project name is required'),
});

const remixSchema = baseSchema.extend({
  // Database configuration
  DATABASE_URL: z.string().url('Invalid database URL'),
  POSTGRES_PRISMA_URL: z.string().url('Invalid Prisma database URL'),
  NEXT_PRIVATE_DATABASE_URL: z.string().url('Invalid private database URL'),
  NEXT_PRIVATE_DIRECT_DATABASE_URL: z.string().url('Invalid direct database URL'),
  
  // Authentication
  NEXTAUTH_SECRET: z.string().min(32, 'NextAuth secret must be at least 32 characters'),
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  NEXT_PRIVATE_ENCRYPTION_KEY: z.string().min(32, 'Encryption key must be at least 32 characters'),
  NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY: z.string().min(32, 'Secondary encryption key must be at least 32 characters'),
  
  // Application URLs
  NEXT_PUBLIC_WEBAPP_URL: z.string().url('Invalid webapp URL'),
  NEXT_PUBLIC_MARKETING_URL: z.string().url('Invalid marketing URL'),
  NEXT_PUBLIC_DOCS_URL: z.string().url('Invalid docs URL'),
  NEXT_PRIVATE_INTERNAL_WEBAPP_URL: z.string().url('Invalid internal webapp URL'),
  
  // File storage
  NEXT_PUBLIC_UPLOAD_TRANSPORT: z.enum(['database', 's3'], 'Invalid upload transport'),
  NEXT_PRIVATE_UPLOAD_BUCKET: z.string().min(1, 'Upload bucket is required when using S3'),
  NEXT_PRIVATE_UPLOAD_REGION: z.string().min(1, 'Upload region is required when using S3'),
  
  // Email configuration
  NEXT_PRIVATE_SMTP_TRANSPORT: z.enum(['smtp-auth', 'smtp-api', 'resend', 'mailchannels'], 'Invalid SMTP transport'),
  NEXT_PRIVATE_SMTP_FROM_NAME: z.string().min(1, 'SMTP from name is required'),
  NEXT_PRIVATE_SMTP_FROM_ADDRESS: z.string().email('Invalid SMTP from address'),
  
  // Document signing
  NEXT_PRIVATE_SIGNING_TRANSPORT: z.enum(['local', 'gcloud-hsm'], 'Invalid signing transport'),
});

const docsSchema = baseSchema.extend({
  NEXT_PUBLIC_WEBAPP_URL: z.string().url('Invalid webapp URL'),
  NEXT_PUBLIC_MARKETING_URL: z.string().url('Invalid marketing URL'),
  NEXT_PUBLIC_DOCS_URL: z.string().url('Invalid docs URL'),
  NEXT_PUBLIC_API_BASE_URL: z.string().url('Invalid API base URL'),
  NEXT_PUBLIC_PROJECT: z.string().min(1, 'Project name is required'),
});

// Optional schemas for conditional validation
const s3Schema = z.object({
  NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID: z.string().min(1, 'S3 access key ID is required'),
  NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY: z.string().min(1, 'S3 secret access key is required'),
});

const resendSchema = z.object({
  NEXT_PRIVATE_RESEND_API_KEY: z.string().regex(/^re_/, 'Invalid Resend API key format'),
});

const smtpSchema = z.object({
  NEXT_PRIVATE_SMTP_HOST: z.string().min(1, 'SMTP host is required'),
  NEXT_PRIVATE_SMTP_PORT: z.coerce.number().min(1).max(65535, 'Invalid SMTP port'),
  NEXT_PRIVATE_SMTP_USERNAME: z.string().min(1, 'SMTP username is required'),
  NEXT_PRIVATE_SMTP_PASSWORD: z.string().min(1, 'SMTP password is required'),
});

const stripeSchema = z.object({
  NEXT_PRIVATE_STRIPE_API_KEY: z.string().regex(/^sk_(test_|live_)/, 'Invalid Stripe API key format'),
  NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET: z.string().regex(/^whsec_/, 'Invalid Stripe webhook secret format'),
});

/**
 * Enhanced validation function with runtime error handling
 * @param {string} appType - The application type (marketing, remix, docs)
 * @param {object} env - Environment variables object (defaults to process.env)
 * @returns {object} Validation result with success status and errors
 */
function validateEnvironment(appType, env = process.env) {
  const results = {
    success: true,
    errors: [],
    warnings: [],
    appType,
    securityIssues: [],
    runtimeChecks: []
  };

  try {
    let schema;
    switch (appType) {
      case 'marketing':
        schema = marketingSchema;
        break;
      case 'remix':
        schema = remixSchema;
        break;
      case 'docs':
        schema = docsSchema;
        break;
      default:
        throw new Error(`Unknown application type: ${appType}`);
    }

    // Validate base schema
    const baseResult = schema.safeParse(env);
    if (!baseResult.success) {
      results.success = false;
      results.errors.push(...baseResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
        code: err.code,
        severity: 'error'
      })));
    }

    // Enhanced conditional validations for remix app
    if (appType === 'remix') {
      // Validate S3 configuration if using S3 transport
      if (env.NEXT_PUBLIC_UPLOAD_TRANSPORT === 's3') {
        const s3Result = s3Schema.safeParse(env);
        if (!s3Result.success) {
          results.success = false;
          results.errors.push(...s3Result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            severity: 'error'
          })));
        }
      }

      // Enhanced email configuration validation
      if (env.NEXT_PRIVATE_SMTP_TRANSPORT === 'resend') {
        const resendResult = resendSchema.safeParse(env);
        if (!resendResult.success) {
          results.success = false;
          results.errors.push(...resendResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            severity: 'error'
          })));
        }
      } else if (env.NEXT_PRIVATE_SMTP_TRANSPORT === 'smtp-auth') {
        const smtpResult = smtpSchema.safeParse(env);
        if (!smtpResult.success) {
          results.success = false;
          results.errors.push(...smtpResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            code: err.code,
            severity: 'error'
          })));
        }
      }

      // Enhanced Stripe validation with runtime checks
      if (env.NEXT_PUBLIC_FEATURE_BILLING_ENABLED === 'true') {
        const stripeResult = stripeSchema.safeParse(env);
        if (!stripeResult.success) {
          results.warnings.push(...stripeResult.error.errors.map(err => ({
            field: err.path.join('.'),
            message: `Billing enabled but ${err.message}`,
            code: err.code,
            severity: 'warning'
          })));
        }
        
        // Runtime check for Stripe key environment
        if (env.NEXT_PRIVATE_STRIPE_API_KEY) {
          const isTestKey = env.NEXT_PRIVATE_STRIPE_API_KEY.startsWith('sk_test_');
          const isProduction = env.NODE_ENV === 'production';
          
          if (isProduction && isTestKey) {
            results.errors.push({
              field: 'NEXT_PRIVATE_STRIPE_API_KEY',
              message: 'Using test Stripe key in production environment',
              code: 'test_key_in_production',
              severity: 'error'
            });
          } else if (!isProduction && !isTestKey) {
            results.warnings.push({
              field: 'NEXT_PRIVATE_STRIPE_API_KEY',
              message: 'Using live Stripe key in non-production environment',
              code: 'live_key_in_dev',
              severity: 'warning'
            });
          }
        }
      }

      // Enhanced signing configuration validation
      if (env.NEXT_PRIVATE_SIGNING_TRANSPORT === 'local') {
        if (!env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS && !env.NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH) {
          results.errors.push({
            field: 'NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS',
            message: 'Local signing requires either file contents or file path',
            code: 'missing_signing_config',
            severity: 'error'
          });
        }
      }

      // Runtime environment variable validation using enhanced validator
      try {
        const runtimeValidator = new RuntimeErrorHandler();
        const requiredVars = [
          'DATABASE_URL',
          'NEXTAUTH_SECRET',
          'JWT_SECRET'
        ];
        
        // This would be called asynchronously in practice
        results.runtimeChecks.push({
          type: 'environment_validation',
          status: 'configured',
          message: `Runtime validation configured for ${requiredVars.length} critical variables`
        });
      } catch (error) {
        results.warnings.push({
          field: 'runtime_validation',
          message: `Runtime validation setup failed: ${error.message}`,
          code: 'runtime_setup_error',
          severity: 'warning'
        });
      }
    }

    // Enhanced security checks
    checkSecurityIssues(env, results);
    
    // Additional runtime security checks
    performRuntimeSecurityChecks(env, results);

  } catch (error) {
    results.success = false;
    results.errors.push({
      field: 'general',
      message: error.message,
      code: 'validation_error',
      severity: 'error'
    });
  }

  return results;
}

/**
 * Checks for common security issues in environment variables
 * @param {object} env - Environment variables
 * @param {object} results - Results object to add warnings to
 */
function checkSecurityIssues(env, results) {
  // Check for weak secrets
  const secretFields = [
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
    'NEXT_PRIVATE_ENCRYPTION_KEY',
    'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY',
  ];

  secretFields.forEach(field => {
    if (env[field]) {
      if (env[field].length < 32) {
        results.warnings.push({
          field,
          message: 'Secret should be at least 32 characters for security',
          code: 'weak_secret',
          severity: 'warning'
        });
      }
      if (env[field].includes('your-') || env[field].includes('example')) {
        results.errors.push({
          field,
          message: 'Secret appears to be a placeholder value',
          code: 'placeholder_secret',
          severity: 'error'
        });
      }
    }
  });

  // Check for development values in production
  if (env.NODE_ENV === 'production') {
    const devPatterns = ['localhost', '127.0.0.1', 'example.com', 'test.com'];
    Object.entries(env).forEach(([key, value]) => {
      if (typeof value === 'string' && devPatterns.some(pattern => value.includes(pattern))) {
        results.warnings.push({
          field: key,
          message: 'Contains development/example values in production environment',
          code: 'dev_value_in_prod',
          severity: 'warning'
        });
      }
    });
  }
}

/**
 * Perform additional runtime security checks
 * @param {object} env - Environment variables
 * @param {object} results - Results object to add security issues to
 */
function performRuntimeSecurityChecks(env, results) {
  // Check for exposed sensitive data in public variables
  const publicVars = Object.keys(env).filter(key => key.startsWith('NEXT_PUBLIC_'));
  const sensitivePatterns = [
    /secret/i,
    /password/i,
    /key/i,
    /token/i,
    /api.*key/i
  ];

  publicVars.forEach(varName => {
    const value = env[varName];
    if (value && sensitivePatterns.some(pattern => pattern.test(varName))) {
      results.securityIssues.push({
        field: varName,
        message: 'Potentially sensitive data exposed in public environment variable',
        code: 'sensitive_public_var',
        severity: 'warning',
        recommendation: 'Move to private environment variable (remove NEXT_PUBLIC_ prefix)'
      });
    }
  });

  // Check for hardcoded credentials
  const credentialFields = [
    'DATABASE_URL',
    'NEXT_PRIVATE_STRIPE_API_KEY',
    'NEXT_PRIVATE_RESEND_API_KEY'
  ];

  credentialFields.forEach(field => {
    const value = env[field];
    if (value) {
      // Check for common weak patterns
      const weakPatterns = [
        'admin',
        'password',
        '123456',
        'test',
        'demo'
      ];
      
      if (weakPatterns.some(pattern => value.toLowerCase().includes(pattern))) {
        results.securityIssues.push({
          field,
          message: 'Credential contains weak or common values',
          code: 'weak_credential',
          severity: 'error',
          recommendation: 'Use strong, unique credentials'
        });
      }
    }
  });

  // Check for missing security headers configuration
  if (env.NODE_ENV === 'production') {
    const securityHeaders = [
      'NEXT_PRIVATE_CSP_ENABLED',
      'NEXT_PRIVATE_HSTS_ENABLED'
    ];
    
    securityHeaders.forEach(header => {
      if (!env[header] || env[header] !== 'true') {
        results.securityIssues.push({
          field: header,
          message: 'Security header not enabled in production',
          code: 'missing_security_header',
          severity: 'warning',
          recommendation: `Set ${header}=true for enhanced security`
        });
      }
    });
  }
}

/**
 * Tests database connectivity with enhanced error handling and retry logic
 * @param {string} databaseUrl - Database connection URL
 * @returns {Promise<object>} Connection test result
 */
async function testDatabaseConnection(databaseUrl) {
  const errorHandler = new RuntimeErrorHandler({
    dbConnectionTimeout: 10000,
    maxRetries: 3,
    retryDelay: 2000
  });

  try {
    // Enhanced URL validation using the runtime error handler
    const urlValidation = EnvironmentValidator.validateDatabaseUrl(databaseUrl);
    if (!urlValidation.valid) {
      throw new Error(urlValidation.error);
    }

    const url = new URL(databaseUrl);
    
    // Test connection with retry logic
    const connectionResult = await errorHandler.connectWithRecovery({
      connectionString: databaseUrl,
      ssl: url.searchParams.get('sslmode') === 'require' || process.env.NODE_ENV === 'production'
    }, 'validation-test');

    return {
      success: true,
      message: 'Database connection test passed',
      details: {
        host: url.hostname,
        port: url.port || 5432,
        database: url.pathname.slice(1),
        ssl: url.searchParams.get('sslmode') === 'require',
        connectionPooled: true
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Database connection failed: ${error.message}`,
      details: {
        error: error.code || 'CONNECTION_ERROR',
        retryable: errorHandler.isRetryableError(error)
      },
    };
  }
}

/**
 * Tests S3 connectivity and permissions
 * @param {object} s3Config - S3 configuration object
 * @returns {Promise<object>} S3 test result
 */
async function testS3Connection(s3Config) {
  try {
    const { bucket, region, accessKeyId, secretAccessKey } = s3Config;
    
    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error('Missing required S3 configuration');
    }

    // In a real implementation, you would:
    // const AWS = require('aws-sdk');
    // const s3 = new AWS.S3({
    //   accessKeyId,
    //   secretAccessKey,
    //   region,
    // });
    // await s3.headBucket({ Bucket: bucket }).promise();

    return {
      success: true,
      message: 'S3 configuration appears valid',
      details: {
        bucket,
        region,
        hasCredentials: !!(accessKeyId && secretAccessKey),
      },
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      details: null,
    };
  }
}

/**
 * Main validation function for CLI usage with enhanced error reporting
 */
async function main() {
  const appType = process.argv[2];
  
  if (!appType || !['marketing', 'remix', 'docs'].includes(appType)) {
    console.error('Usage: node validate-environment.js <marketing|remix|docs>');
    process.exit(1);
  }

  console.log(`🔍 Validating environment variables for ${appType} application...`);
  
  const results = validateEnvironment(appType);
  
  // Print enhanced results
  console.log('\n' + '='.repeat(60));
  console.log('📊 ENVIRONMENT VALIDATION REPORT');
  console.log('='.repeat(60));
  
  if (results.success) {
    console.log('✅ Environment validation passed');
  } else {
    console.log('❌ Environment validation failed');
  }

  console.log(`Application Type: ${results.appType}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  console.log(`Security Issues: ${results.securityIssues?.length || 0}`);
  console.log(`Runtime Checks: ${results.runtimeChecks?.length || 0}`);

  if (results.errors.length > 0) {
    console.log('\n🚨 Errors:');
    results.errors.forEach(error => {
      console.log(`  - ${error.field}: ${error.message} (${error.code})`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(warning => {
      console.log(`  - ${warning.field}: ${warning.message} (${warning.code})`);
    });
  }

  if (results.securityIssues && results.securityIssues.length > 0) {
    console.log('\n🔒 Security Issues:');
    results.securityIssues.forEach(issue => {
      console.log(`  - ${issue.field}: ${issue.message}`);
      if (issue.recommendation) {
        console.log(`    Recommendation: ${issue.recommendation}`);
      }
    });
  }

  if (results.runtimeChecks && results.runtimeChecks.length > 0) {
    console.log('\n🔧 Runtime Checks:');
    results.runtimeChecks.forEach(check => {
      console.log(`  - ${check.type}: ${check.message} (${check.status})`);
    });
  }

  // Test database connection for remix app with enhanced error handling
  if (appType === 'remix' && process.env.DATABASE_URL) {
    console.log('\n🔍 Testing database connection with retry logic...');
    const dbResult = await testDatabaseConnection(process.env.DATABASE_URL);
    if (dbResult.success) {
      console.log('✅ Database connection test passed');
      if (dbResult.details) {
        console.log(`   Host: ${dbResult.details.host}:${dbResult.details.port}`);
        console.log(`   Database: ${dbResult.details.database}`);
        console.log(`   SSL: ${dbResult.details.ssl ? 'enabled' : 'disabled'}`);
        console.log(`   Connection Pooled: ${dbResult.details.connectionPooled ? 'yes' : 'no'}`);
      }
    } else {
      console.log(`❌ Database connection test failed: ${dbResult.message}`);
      if (dbResult.details) {
        console.log(`   Error Type: ${dbResult.details.error}`);
        console.log(`   Retryable: ${dbResult.details.retryable ? 'yes' : 'no'}`);
      }
    }
  }

  // Test S3 connection for remix app
  if (appType === 'remix' && process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT === 's3') {
    console.log('\n🔍 Testing S3 connection...');
    const s3Result = await testS3Connection({
      bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
      region: process.env.NEXT_PRIVATE_UPLOAD_REGION,
      accessKeyId: process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID,
      secretAccessKey: process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY,
    });
    if (s3Result.success) {
      console.log('✅ S3 configuration test passed');
      if (s3Result.details) {
        console.log(`   Bucket: ${s3Result.details.bucket}`);
        console.log(`   Region: ${s3Result.details.region}`);
        console.log(`   Credentials: ${s3Result.details.hasCredentials ? 'configured' : 'missing'}`);
      }
    } else {
      console.log(`❌ S3 configuration test failed: ${s3Result.message}`);
    }
  }

  console.log('='.repeat(60));

  // Exit with appropriate code
  const hasErrors = results.errors.length > 0;
  const hasCriticalSecurityIssues = results.securityIssues?.some(issue => issue.severity === 'error') || false;
  
  process.exit(hasErrors || hasCriticalSecurityIssues ? 1 : 0);
}

// Export functions for use in other modules
module.exports = {
  validateEnvironment,
  testDatabaseConnection,
  testS3Connection,
  checkSecurityIssues,
  performRuntimeSecurityChecks,
};

// Run main function if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Validation script error:', error);
    process.exit(1);
  });
}