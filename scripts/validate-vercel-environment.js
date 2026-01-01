#!/usr/bin/env node

/**
 * Vercel Environment Variables Validation Script
 * 
 * This script validates that all required environment variables are properly
 * configured for Vercel deployment.
 */

const fs = require('fs');
const path = require('path');

class VercelEnvironmentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    
    // Define required variables for Vercel deployment
    this.requiredVariables = {
      // Core application
      'NODE_ENV': {
        description: 'Node.js environment',
        expectedValue: 'production',
        required: true
      },
      'NEXT_PUBLIC_APP_URL': {
        description: 'Public application URL',
        pattern: /^https?:\/\/.+/,
        required: true
      },
      
      // Database
      'DATABASE_URL': {
        description: 'Primary database connection URL',
        pattern: /^postgresql:\/\/.+/,
        required: true
      },
      'NEXT_PRIVATE_DATABASE_URL': {
        description: 'Private database URL for server operations',
        pattern: /^postgresql:\/\/.+/,
        required: true
      },
      'POSTGRES_PRISMA_URL': {
        description: 'PostgreSQL URL for Prisma',
        pattern: /^postgresql:\/\/.+/,
        required: true
      },
      
      // Authentication & Security
      'NEXTAUTH_SECRET': {
        description: 'NextAuth.js secret for session encryption',
        minLength: 32,
        required: true
      },
      'JWT_SECRET': {
        description: 'JWT token signing secret',
        minLength: 16,
        required: true
      },
      'ENCRYPTION_KEY': {
        description: '32-character encryption key',
        exactLength: 32,
        required: true
      },
      'NEXT_PRIVATE_ENCRYPTION_KEY': {
        description: 'Primary encryption key for sensitive data',
        exactLength: 32,
        required: true
      },
      
      // File Storage
      'NEXT_PUBLIC_UPLOAD_TRANSPORT': {
        description: 'File upload transport method',
        expectedValue: 's3',
        required: true
      },
      'NEXT_PRIVATE_UPLOAD_BUCKET': {
        description: 'S3 bucket name for file uploads',
        required: true
      },
      'AWS_ACCESS_KEY_ID': {
        description: 'AWS access key for S3 operations',
        pattern: /^AKIA[0-9A-Z]{16}$/,
        required: true
      },
      'AWS_SECRET_ACCESS_KEY': {
        description: 'AWS secret key for S3 operations',
        minLength: 20,
        required: true
      },
      'AWS_REGION': {
        description: 'AWS region for S3 bucket',
        pattern: /^[a-z0-9-]+$/,
        required: true
      },
      
      // Email Service
      'NEXT_PRIVATE_SMTP_TRANSPORT': {
        description: 'Email transport method',
        allowedValues: ['resend', 'smtp', 'mailchannels'],
        required: true
      }
    };
    
    // Optional but recommended variables
    this.recommendedVariables = {
      'NEXT_PRIVATE_RESEND_API_KEY': {
        description: 'Resend API key for email delivery',
        pattern: /^re_[a-zA-Z0-9]+$/,
        condition: (env) => env.NEXT_PRIVATE_SMTP_TRANSPORT === 'resend'
      },
      'REDIS_URL': {
        description: 'Redis connection URL for caching',
        pattern: /^redis:\/\/.+/
      },
      'NEXT_PUBLIC_POSTHOG_KEY': {
        description: 'PostHog analytics key',
        pattern: /^phc_[a-zA-Z0-9]+$/
      }
    };
  }

  /**
   * Load environment variables from various sources
   */
  loadEnvironment() {
    // Try to load from .env.local first (Vercel development)
    const envFiles = ['.env.local', '.env', '.env.production'];
    
    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        this.parseEnvFile(envContent);
        this.info.push(`✓ Loaded environment from ${envFile}`);
        break;
      }
    }
    
    // Also check process.env (for actual Vercel environment)
    this.info.push(`✓ Checking process environment variables`);
  }

  /**
   * Parse .env file content
   */
  parseEnvFile(content) {
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          process.env[key] = value;
        }
      }
    }
  }

  /**
   * Validate a single environment variable
   */
  validateVariable(name, config, value) {
    const issues = [];
    
    if (!value || value.trim() === '') {
      if (config.required) {
        issues.push(`❌ ${name} is required but not set`);
      }
      return issues;
    }
    
    // Check exact length
    if (config.exactLength && value.length !== config.exactLength) {
      issues.push(`❌ ${name} must be exactly ${config.exactLength} characters (current: ${value.length})`);
    }
    
    // Check minimum length
    if (config.minLength && value.length < config.minLength) {
      issues.push(`❌ ${name} must be at least ${config.minLength} characters (current: ${value.length})`);
    }
    
    // Check pattern
    if (config.pattern && !config.pattern.test(value)) {
      issues.push(`❌ ${name} format is invalid (expected pattern: ${config.pattern})`);
    }
    
    // Check expected value
    if (config.expectedValue && value !== config.expectedValue) {
      issues.push(`⚠️  ${name} should be "${config.expectedValue}" (current: "${value}")`);
    }
    
    // Check allowed values
    if (config.allowedValues && !config.allowedValues.includes(value)) {
      issues.push(`❌ ${name} must be one of: ${config.allowedValues.join(', ')} (current: "${value}")`);
    }
    
    return issues;
  }

  /**
   * Validate all environment variables
   */
  validate() {
    console.log('🔍 Validating Vercel environment variables...\n');
    
    this.loadEnvironment();
    
    // Validate required variables
    console.log('📋 Checking required variables:\n');
    for (const [name, config] of Object.entries(this.requiredVariables)) {
      const value = process.env[name];
      const issues = this.validateVariable(name, config, value);
      
      if (issues.length === 0) {
        console.log(`✅ ${name}: OK`);
      } else {
        issues.forEach(issue => {
          console.log(`   ${issue}`);
          if (issue.startsWith('❌')) {
            this.errors.push(issue);
          } else {
            this.warnings.push(issue);
          }
        });
      }
    }
    
    // Validate recommended variables
    console.log('\n📋 Checking recommended variables:\n');
    for (const [name, config] of Object.entries(this.recommendedVariables)) {
      const value = process.env[name];
      
      // Check condition if specified
      if (config.condition && !config.condition(process.env)) {
        console.log(`⏭️  ${name}: Skipped (condition not met)`);
        continue;
      }
      
      if (!value) {
        console.log(`⚠️  ${name}: Not set (recommended for production)`);
        this.warnings.push(`${name} is recommended but not set`);
        continue;
      }
      
      const issues = this.validateVariable(name, config, value);
      if (issues.length === 0) {
        console.log(`✅ ${name}: OK`);
      } else {
        issues.forEach(issue => {
          console.log(`   ${issue}`);
          this.warnings.push(issue);
        });
      }
    }
    
    // Additional validations
    this.validateDatabaseConnections();
    this.validateSecurityConfiguration();
    this.validateFileStorageConfiguration();
  }

  /**
   * Validate database connection strings
   */
  validateDatabaseConnections() {
    console.log('\n🗄️  Database Configuration:\n');
    
    const dbUrls = ['DATABASE_URL', 'NEXT_PRIVATE_DATABASE_URL', 'POSTGRES_PRISMA_URL'];
    const urls = dbUrls.map(name => process.env[name]).filter(Boolean);
    
    if (urls.length === 0) {
      this.errors.push('❌ No database URLs configured');
      return;
    }
    
    // Check if all URLs are consistent
    const uniqueUrls = [...new Set(urls)];
    if (uniqueUrls.length > 1) {
      console.log('⚠️  Multiple different database URLs detected');
      this.warnings.push('Database URLs should typically be the same');
    } else {
      console.log('✅ Database URLs are consistent');
    }
    
    // Check SSL mode for production
    const hasSSL = urls.some(url => url.includes('sslmode=require'));
    if (process.env.NODE_ENV === 'production' && !hasSSL) {
      console.log('⚠️  SSL mode not detected in database URLs');
      this.warnings.push('Consider adding ?sslmode=require to database URLs for production');
    } else if (hasSSL) {
      console.log('✅ SSL mode configured for database connections');
    }
  }

  /**
   * Validate security configuration
   */
  validateSecurityConfiguration() {
    console.log('\n🔐 Security Configuration:\n');
    
    // Check encryption key consistency
    const encKey1 = process.env.ENCRYPTION_KEY;
    const encKey2 = process.env.NEXT_PRIVATE_ENCRYPTION_KEY;
    
    if (encKey1 && encKey2 && encKey1 !== encKey2) {
      console.log('⚠️  Different encryption keys detected');
      this.warnings.push('ENCRYPTION_KEY and NEXT_PRIVATE_ENCRYPTION_KEY should typically be the same');
    } else if (encKey1 && encKey2) {
      console.log('✅ Encryption keys are consistent');
    }
    
    // Check for development secrets in production
    if (process.env.NODE_ENV === 'production') {
      const devSecrets = ['development', 'dev', 'test', 'local'];
      const secrets = [
        process.env.NEXTAUTH_SECRET,
        process.env.JWT_SECRET,
        process.env.ENCRYPTION_KEY
      ].filter(Boolean);
      
      for (const secret of secrets) {
        if (devSecrets.some(dev => secret.toLowerCase().includes(dev))) {
          console.log('❌ Development secret detected in production environment');
          this.errors.push('Replace development secrets with production-grade secrets');
          break;
        }
      }
    }
  }

  /**
   * Validate file storage configuration
   */
  validateFileStorageConfiguration() {
    console.log('\n📁 File Storage Configuration:\n');
    
    const transport = process.env.NEXT_PUBLIC_UPLOAD_TRANSPORT;
    
    if (transport === 's3') {
      const s3Vars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_REGION', 'NEXT_PRIVATE_UPLOAD_BUCKET'];
      const missingS3Vars = s3Vars.filter(name => !process.env[name]);
      
      if (missingS3Vars.length > 0) {
        console.log(`❌ S3 transport selected but missing variables: ${missingS3Vars.join(', ')}`);
        this.errors.push('S3 configuration incomplete');
      } else {
        console.log('✅ S3 configuration appears complete');
      }
    } else if (transport) {
      console.log(`ℹ️  Using ${transport} transport (ensure it's properly configured)`);
    }
  }

  /**
   * Generate summary report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 All environment variables are properly configured!');
      console.log('✅ Ready for Vercel deployment');
    } else {
      if (this.errors.length > 0) {
        console.log(`❌ ${this.errors.length} error(s) found:`);
        this.errors.forEach(error => console.log(`   ${error}`));
      }
      
      if (this.warnings.length > 0) {
        console.log(`⚠️  ${this.warnings.length} warning(s):`);
        this.warnings.forEach(warning => console.log(`   ${warning}`));
      }
      
      if (this.errors.length > 0) {
        console.log('\n🚫 Fix errors before deploying to Vercel');
        process.exit(1);
      } else {
        console.log('\n⚠️  Consider addressing warnings for optimal deployment');
      }
    }
    
    console.log('\n📚 For detailed setup instructions, see:');
    console.log('   docs/VERCEL_DEPLOYMENT_ENVIRONMENT_SETUP.md');
    console.log('   docs/VERCEL_ENV_QUICK_REFERENCE.md');
  }
}

// Run validation
async function main() {
  const validator = new VercelEnvironmentValidator();
  validator.validate();
  validator.generateReport();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { VercelEnvironmentValidator };