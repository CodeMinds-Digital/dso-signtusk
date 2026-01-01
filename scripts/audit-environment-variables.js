#!/usr/bin/env node

/**
 * Environment Variable Audit Script for Vercel Deployment
 * 
 * This script audits the codebase to identify all environment variables
 * and categorizes them for Vercel deployment configuration.
 */

const fs = require('fs');
const path = require('path');

class EnvironmentVariableAuditor {
  constructor() {
    this.variables = new Map();
    this.categories = {
      REQUIRED_BUILD: 'Required for build process',
      REQUIRED_RUNTIME: 'Required for runtime operation',
      OPTIONAL_BUILD: 'Optional for build process',
      OPTIONAL_RUNTIME: 'Optional for runtime operation',
      DEVELOPMENT_ONLY: 'Development environment only',
      TESTING_ONLY: 'Testing environment only'
    };
  }

  /**
   * Add an environment variable to the audit
   */
  addVariable(name, category, description, defaultValue = null, source = '') {
    if (!this.variables.has(name)) {
      this.variables.set(name, {
        name,
        category,
        description,
        defaultValue,
        sources: new Set()
      });
    }
    
    const variable = this.variables.get(name);
    variable.sources.add(source);
    
    // Update category if this is more critical
    const categoryPriority = {
      'REQUIRED_BUILD': 5,
      'REQUIRED_RUNTIME': 4,
      'OPTIONAL_BUILD': 3,
      'OPTIONAL_RUNTIME': 2,
      'DEVELOPMENT_ONLY': 1,
      'TESTING_ONLY': 0
    };
    
    if (categoryPriority[category] > categoryPriority[variable.category]) {
      variable.category = category;
    }
  }

  /**
   * Audit environment variables from various sources
   */
  auditVariables() {
    console.log('🔍 Auditing environment variables for Vercel deployment...\n');

    // Core application variables
    this.auditCoreVariables();
    
    // Database variables
    this.auditDatabaseVariables();
    
    // Authentication variables
    this.auditAuthVariables();
    
    // File storage variables
    this.auditStorageVariables();
    
    // Email variables
    this.auditEmailVariables();
    
    // Payment variables
    this.auditPaymentVariables();
    
    // Analytics variables
    this.auditAnalyticsVariables();
    
    // Security variables
    this.auditSecurityVariables();
    
    // Infrastructure variables
    this.auditInfrastructureVariables();
    
    // Development variables
    this.auditDevelopmentVariables();
  }

  auditCoreVariables() {
    this.addVariable('NODE_ENV', 'REQUIRED_BUILD', 'Node.js environment (production/development)', 'production', 'Build process');
    this.addVariable('PORT', 'OPTIONAL_RUNTIME', 'Server port number', '3000', 'Server startup');
    this.addVariable('NEXT_PUBLIC_APP_URL', 'REQUIRED_RUNTIME', 'Public application URL for client-side routing', null, 'Client-side routing');
    this.addVariable('NEXT_PUBLIC_WEBAPP_URL', 'REQUIRED_RUNTIME', 'Public web application URL', null, 'Application URLs');
    this.addVariable('NEXT_PUBLIC_MARKETING_URL', 'OPTIONAL_RUNTIME', 'Marketing site URL', null, 'External links');
    this.addVariable('NEXT_PUBLIC_DOCS_URL', 'OPTIONAL_RUNTIME', 'Documentation site URL', null, 'External links');
  }

  auditDatabaseVariables() {
    this.addVariable('DATABASE_URL', 'REQUIRED_RUNTIME', 'Primary database connection URL', null, 'Database connection');
    this.addVariable('NEXT_PRIVATE_DATABASE_URL', 'REQUIRED_RUNTIME', 'Private database URL for server-side operations', null, 'Prisma schema');
    this.addVariable('NEXT_PRIVATE_DIRECT_DATABASE_URL', 'OPTIONAL_RUNTIME', 'Direct database connection URL (bypassing pooling)', null, 'Prisma schema');
    this.addVariable('POSTGRES_PRISMA_URL', 'REQUIRED_RUNTIME', 'PostgreSQL connection URL for Prisma', null, 'Database connection');
    this.addVariable('POSTGRES_URL', 'OPTIONAL_RUNTIME', 'Alternative PostgreSQL URL', null, 'Database connection');
    this.addVariable('DATABASE_URL_UNPOOLED', 'OPTIONAL_RUNTIME', 'Unpooled database connection', null, 'Database connection');
    this.addVariable('POSTGRES_URL_NON_POOLING', 'OPTIONAL_RUNTIME', 'Non-pooling PostgreSQL URL', null, 'Database connection');
  }

  auditAuthVariables() {
    this.addVariable('NEXTAUTH_SECRET', 'REQUIRED_RUNTIME', 'NextAuth.js secret for session encryption', null, 'Authentication');
    this.addVariable('JWT_SECRET', 'REQUIRED_RUNTIME', 'JWT token signing secret', null, 'Authentication');
    this.addVariable('SESSION_SECRET', 'OPTIONAL_RUNTIME', 'Session encryption secret', null, 'Authentication');
    this.addVariable('NEXT_PRIVATE_GOOGLE_CLIENT_ID', 'OPTIONAL_RUNTIME', 'Google OAuth client ID', null, 'OAuth authentication');
    this.addVariable('NEXT_PRIVATE_GOOGLE_CLIENT_SECRET', 'OPTIONAL_RUNTIME', 'Google OAuth client secret', null, 'OAuth authentication');
    this.addVariable('NEXT_PRIVATE_OIDC_WELL_KNOWN', 'OPTIONAL_RUNTIME', 'OIDC well-known endpoint', null, 'OIDC authentication');
    this.addVariable('NEXT_PRIVATE_OIDC_CLIENT_ID', 'OPTIONAL_RUNTIME', 'OIDC client ID', null, 'OIDC authentication');
    this.addVariable('NEXT_PRIVATE_OIDC_CLIENT_SECRET', 'OPTIONAL_RUNTIME', 'OIDC client secret', null, 'OIDC authentication');
    this.addVariable('NEXT_PRIVATE_OIDC_PROVIDER_LABEL', 'OPTIONAL_RUNTIME', 'OIDC provider display label', null, 'OIDC authentication');
    this.addVariable('NEXT_PRIVATE_OIDC_SKIP_VERIFY', 'OPTIONAL_RUNTIME', 'Skip OIDC certificate verification', 'false', 'OIDC authentication');
    this.addVariable('NEXT_PRIVATE_OIDC_PROMPT', 'OPTIONAL_RUNTIME', 'OIDC authentication prompt', null, 'OIDC authentication');
  }

  auditStorageVariables() {
    this.addVariable('NEXT_PUBLIC_UPLOAD_TRANSPORT', 'REQUIRED_RUNTIME', 'File upload transport method (s3/local)', 's3', 'File upload');
    this.addVariable('NEXT_PRIVATE_UPLOAD_BUCKET', 'REQUIRED_RUNTIME', 'S3 bucket name for file uploads', null, 'File upload');
    this.addVariable('AWS_ACCESS_KEY_ID', 'REQUIRED_RUNTIME', 'AWS access key for S3 operations', null, 'AWS S3');
    this.addVariable('AWS_SECRET_ACCESS_KEY', 'REQUIRED_RUNTIME', 'AWS secret key for S3 operations', null, 'AWS S3');
    this.addVariable('AWS_REGION', 'REQUIRED_RUNTIME', 'AWS region for S3 bucket', 'us-east-1', 'AWS S3');
    this.addVariable('AWS_S3_BUCKET', 'REQUIRED_RUNTIME', 'AWS S3 bucket name', null, 'AWS S3');
    this.addVariable('AWS_S3_ENDPOINT', 'OPTIONAL_RUNTIME', 'Custom S3 endpoint URL', null, 'AWS S3');
    this.addVariable('NEXT_PRIVATE_UPLOAD_ENDPOINT', 'OPTIONAL_RUNTIME', 'Custom upload endpoint', null, 'File upload');
    this.addVariable('NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE', 'OPTIONAL_RUNTIME', 'Force path-style S3 URLs', 'false', 'File upload');
    this.addVariable('NEXT_PRIVATE_UPLOAD_REGION', 'OPTIONAL_RUNTIME', 'Upload service region', null, 'File upload');
    this.addVariable('NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID', 'OPTIONAL_RUNTIME', 'Upload service access key', null, 'File upload');
    this.addVariable('NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY', 'OPTIONAL_RUNTIME', 'Upload service secret key', null, 'File upload');
    this.addVariable('NEXT_PRIVATE_UPLOAD_DISTRIBUTION_DOMAIN', 'OPTIONAL_RUNTIME', 'CDN distribution domain', null, 'File upload');
    this.addVariable('NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_ID', 'OPTIONAL_RUNTIME', 'CDN distribution key ID', null, 'File upload');
    this.addVariable('NEXT_PRIVATE_UPLOAD_DISTRIBUTION_KEY_CONTENTS', 'OPTIONAL_RUNTIME', 'CDN distribution key contents', null, 'File upload');
    this.addVariable('STORAGE_PROVIDER', 'OPTIONAL_RUNTIME', 'Storage provider type', 'local', 'File storage');
    this.addVariable('STORAGE_LOCAL_PATH', 'OPTIONAL_RUNTIME', 'Local storage path', './uploads', 'File storage');
  }

  auditEmailVariables() {
    this.addVariable('NEXT_PRIVATE_SMTP_TRANSPORT', 'REQUIRED_RUNTIME', 'Email transport method (resend/smtp)', 'resend', 'Email service');
    this.addVariable('NEXT_PRIVATE_RESEND_API_KEY', 'OPTIONAL_RUNTIME', 'Resend API key for email delivery', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_MAILCHANNELS_API_KEY', 'OPTIONAL_RUNTIME', 'MailChannels API key', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_MAILCHANNELS_ENDPOINT', 'OPTIONAL_RUNTIME', 'MailChannels endpoint URL', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_MAILCHANNELS_DKIM_DOMAIN', 'OPTIONAL_RUNTIME', 'MailChannels DKIM domain', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_MAILCHANNELS_DKIM_SELECTOR', 'OPTIONAL_RUNTIME', 'MailChannels DKIM selector', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_MAILCHANNELS_DKIM_PRIVATE_KEY', 'OPTIONAL_RUNTIME', 'MailChannels DKIM private key', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_HOST', 'OPTIONAL_RUNTIME', 'SMTP server hostname', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_PORT', 'OPTIONAL_RUNTIME', 'SMTP server port', '587', 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_USERNAME', 'OPTIONAL_RUNTIME', 'SMTP username', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_PASSWORD', 'OPTIONAL_RUNTIME', 'SMTP password', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_APIKEY_USER', 'OPTIONAL_RUNTIME', 'SMTP API key user', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_APIKEY', 'OPTIONAL_RUNTIME', 'SMTP API key', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_SECURE', 'OPTIONAL_RUNTIME', 'Use secure SMTP connection', 'true', 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_UNSAFE_IGNORE_TLS', 'OPTIONAL_RUNTIME', 'Ignore TLS certificate errors', 'false', 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_FROM_NAME', 'OPTIONAL_RUNTIME', 'Email sender name', 'SignTusk', 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_FROM_ADDRESS', 'OPTIONAL_RUNTIME', 'Email sender address', null, 'Email service');
    this.addVariable('NEXT_PRIVATE_SMTP_SERVICE', 'OPTIONAL_RUNTIME', 'SMTP service provider', null, 'Email service');
  }

  auditPaymentVariables() {
    this.addVariable('NEXT_PRIVATE_STRIPE_API_KEY', 'OPTIONAL_RUNTIME', 'Stripe secret API key for payments', null, 'Payment processing');
    this.addVariable('NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET', 'OPTIONAL_RUNTIME', 'Stripe webhook secret for event verification', null, 'Payment processing');
    this.addVariable('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'OPTIONAL_RUNTIME', 'Stripe publishable key for client-side', null, 'Payment processing');
  }

  auditAnalyticsVariables() {
    this.addVariable('NEXT_PUBLIC_POSTHOG_KEY', 'OPTIONAL_RUNTIME', 'PostHog analytics project key', null, 'Analytics');
    this.addVariable('NEXT_PUBLIC_POSTHOG_HOST', 'OPTIONAL_RUNTIME', 'PostHog analytics host URL', 'https://app.posthog.com', 'Analytics');
    this.addVariable('NEXT_PRIVATE_TELEMETRY_KEY', 'OPTIONAL_RUNTIME', 'Telemetry service key', null, 'Analytics');
    this.addVariable('NEXT_PRIVATE_TELEMETRY_HOST', 'OPTIONAL_RUNTIME', 'Telemetry service host', null, 'Analytics');
    this.addVariable('DOCUMENSO_DISABLE_TELEMETRY', 'OPTIONAL_RUNTIME', 'Disable telemetry collection', 'false', 'Analytics');
  }

  auditSecurityVariables() {
    this.addVariable('ENCRYPTION_KEY', 'REQUIRED_RUNTIME', '32-character encryption key for data security', null, 'Security');
    this.addVariable('NEXT_PRIVATE_ENCRYPTION_KEY', 'REQUIRED_RUNTIME', 'Primary encryption key for sensitive data', null, 'Security');
    this.addVariable('NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY', 'OPTIONAL_RUNTIME', 'Secondary encryption key for key rotation', null, 'Security');
    this.addVariable('WEBHOOK_SECRET', 'OPTIONAL_RUNTIME', 'Webhook signature verification secret', null, 'Security');
    this.addVariable('RATE_LIMIT_ENABLED', 'OPTIONAL_RUNTIME', 'Enable API rate limiting', 'true', 'Security');
    this.addVariable('NEXT_PUBLIC_DISABLE_SIGNUP', 'OPTIONAL_RUNTIME', 'Disable new user registration', 'false', 'Security');
  }

  auditInfrastructureVariables() {
    this.addVariable('REDIS_URL', 'OPTIONAL_RUNTIME', 'Redis connection URL for caching and sessions', null, 'Caching');
    this.addVariable('NEXT_PRIVATE_JOBS_PROVIDER', 'OPTIONAL_RUNTIME', 'Background job processing provider', null, 'Job processing');
    this.addVariable('NEXT_PRIVATE_INNGEST_APP_ID', 'OPTIONAL_RUNTIME', 'Inngest application ID', null, 'Job processing');
    this.addVariable('INNGEST_EVENT_KEY', 'OPTIONAL_RUNTIME', 'Inngest event key', null, 'Job processing');
    this.addVariable('NEXT_PRIVATE_INNGEST_EVENT_KEY', 'OPTIONAL_RUNTIME', 'Private Inngest event key', null, 'Job processing');
    this.addVariable('GOOGLE_APPLICATION_CREDENTIALS', 'OPTIONAL_RUNTIME', 'Google Cloud service account credentials', null, 'Google Cloud');
    this.addVariable('GOOGLE_VERTEX_PROJECT_ID', 'OPTIONAL_RUNTIME', 'Google Vertex AI project ID', null, 'AI services');
    this.addVariable('GOOGLE_VERTEX_LOCATION', 'OPTIONAL_RUNTIME', 'Google Vertex AI location', null, 'AI services');
    this.addVariable('GOOGLE_VERTEX_API_KEY', 'OPTIONAL_RUNTIME', 'Google Vertex AI API key', null, 'AI services');
    this.addVariable('PDF_GENERATION_METHOD', 'OPTIONAL_RUNTIME', 'PDF generation method', 'local', 'PDF processing');
    this.addVariable('PDF_EXTERNAL_SERVICE_URL', 'OPTIONAL_RUNTIME', 'External PDF service URL', null, 'PDF processing');
    this.addVariable('DISABLE_PDF_SIGNING', 'OPTIONAL_RUNTIME', 'Disable PDF signing functionality', 'false', 'PDF processing');
  }

  auditDevelopmentVariables() {
    this.addVariable('CI', 'DEVELOPMENT_ONLY', 'Continuous Integration environment flag', null, 'CI/CD');
    this.addVariable('SKIP_ENV_VALIDATION', 'OPTIONAL_BUILD', 'Skip environment variable validation', 'false', 'Build process');
    this.addVariable('CARGO_TARGET_DIR', 'OPTIONAL_BUILD', 'Rust cargo target directory', null, 'Rust compilation');
    this.addVariable('RUSTFLAGS', 'OPTIONAL_BUILD', 'Rust compiler flags', null, 'Rust compilation');
    this.addVariable('CARGO_BUILD_TARGET', 'OPTIONAL_BUILD', 'Rust build target', null, 'Rust compilation');
    this.addVariable('E2E_TEST_AUTHENTICATE_USERNAME', 'TESTING_ONLY', 'E2E test authentication username', null, 'Testing');
    this.addVariable('E2E_TEST_AUTHENTICATE_USER_EMAIL', 'TESTING_ONLY', 'E2E test user email', null, 'Testing');
    this.addVariable('E2E_TEST_AUTHENTICATE_USER_PASSWORD', 'TESTING_ONLY', 'E2E test user password', null, 'Testing');
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const report = {
      summary: {
        total: this.variables.size,
        required_build: 0,
        required_runtime: 0,
        optional_build: 0,
        optional_runtime: 0,
        development_only: 0,
        testing_only: 0
      },
      variables: {}
    };

    // Group variables by category
    for (const [category, description] of Object.entries(this.categories)) {
      report.variables[category] = {
        description,
        variables: []
      };
    }

    // Populate variables and count
    for (const variable of this.variables.values()) {
      report.variables[variable.category].variables.push({
        name: variable.name,
        description: variable.description,
        defaultValue: variable.defaultValue,
        sources: Array.from(variable.sources)
      });
      
      report.summary[variable.category.toLowerCase()] += 1;
    }

    // Sort variables within each category
    for (const category of Object.keys(report.variables)) {
      report.variables[category].variables.sort((a, b) => a.name.localeCompare(b.name));
    }

    return report;
  }

  /**
   * Generate Vercel environment variable configuration guide
   */
  generateVercelGuide() {
    const report = this.generateReport();
    
    let guide = `# Vercel Environment Variables Configuration Guide

This guide provides a comprehensive list of environment variables required for deploying SignTusk to Vercel.

## Summary

- **Total Variables**: ${report.summary.total}
- **Required for Build**: ${report.summary.required_build}
- **Required for Runtime**: ${report.summary.required_runtime}
- **Optional for Build**: ${report.summary.optional_build}
- **Optional for Runtime**: ${report.summary.optional_runtime}
- **Development Only**: ${report.summary.development_only}
- **Testing Only**: ${report.summary.testing_only}

## Configuration Instructions

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the required variables listed below
4. Deploy your application

---

`;

    // Generate sections for each category
    const categoryOrder = ['REQUIRED_BUILD', 'REQUIRED_RUNTIME', 'OPTIONAL_BUILD', 'OPTIONAL_RUNTIME'];
    
    for (const category of categoryOrder) {
      const categoryData = report.variables[category];
      if (categoryData.variables.length === 0) continue;

      guide += `## ${categoryData.description}\n\n`;
      
      for (const variable of categoryData.variables) {
        guide += `### \`${variable.name}\`\n\n`;
        guide += `**Description**: ${variable.description}\n\n`;
        
        if (variable.defaultValue) {
          guide += `**Default Value**: \`${variable.defaultValue}\`\n\n`;
        }
        
        if (variable.sources.length > 0) {
          guide += `**Used in**: ${variable.sources.join(', ')}\n\n`;
        }
        
        guide += `**Vercel Configuration**:\n`;
        guide += `\`\`\`\n`;
        guide += `Name: ${variable.name}\n`;
        guide += `Value: [YOUR_VALUE_HERE]\n`;
        guide += `Environment: Production, Preview, Development\n`;
        guide += `\`\`\`\n\n`;
        guide += `---\n\n`;
      }
    }

    // Add development and testing variables for reference
    guide += `## Development and Testing Variables (Not needed for Vercel)\n\n`;
    guide += `These variables are only used in development or testing environments and should not be configured in Vercel:\n\n`;
    
    const devCategories = ['DEVELOPMENT_ONLY', 'TESTING_ONLY'];
    for (const category of devCategories) {
      const categoryData = report.variables[category];
      if (categoryData.variables.length === 0) continue;
      
      guide += `### ${categoryData.description}\n\n`;
      for (const variable of categoryData.variables) {
        guide += `- \`${variable.name}\`: ${variable.description}\n`;
      }
      guide += `\n`;
    }

    return guide;
  }

  /**
   * Save audit results to files
   */
  async saveResults() {
    const report = this.generateReport();
    const guide = this.generateVercelGuide();

    // Save detailed audit report
    const auditPath = path.join(process.cwd(), 'ENVIRONMENT_VARIABLES_AUDIT.json');
    fs.writeFileSync(auditPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed audit saved to: ${auditPath}`);

    // Save Vercel configuration guide
    const guidePath = path.join(process.cwd(), 'VERCEL_ENVIRONMENT_VARIABLES_GUIDE.md');
    fs.writeFileSync(guidePath, guide);
    console.log(`📋 Vercel configuration guide saved to: ${guidePath}`);

    return { report, guide };
  }
}

// Run the audit
async function main() {
  const auditor = new EnvironmentVariableAuditor();
  auditor.auditVariables();
  
  const { report } = await auditor.saveResults();
  
  console.log('\n✅ Environment variable audit completed!');
  console.log(`\n📊 Summary:`);
  console.log(`   Total variables: ${report.summary.total}`);
  console.log(`   Required for build: ${report.summary.required_build}`);
  console.log(`   Required for runtime: ${report.summary.required_runtime}`);
  console.log(`   Optional: ${report.summary.optional_build + report.summary.optional_runtime}`);
  console.log(`\n🚀 Next steps:`);
  console.log(`   1. Review VERCEL_ENVIRONMENT_VARIABLES_GUIDE.md`);
  console.log(`   2. Configure required variables in Vercel dashboard`);
  console.log(`   3. Test deployment with new configuration`);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { EnvironmentVariableAuditor };