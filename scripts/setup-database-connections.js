#!/usr/bin/env node

/**
 * Database Connection Setup Script
 * Configures database connections for different environments
 */

const fs = require('fs');
const path = require('path');

/**
 * Database connection configurations for different environments
 */
const DATABASE_CONFIGS = {
  production: {
    description: 'Production database with connection pooling',
    template: {
      DATABASE_URL: 'postgresql://prod_user:${PROD_DB_PASSWORD}@${PROD_DB_HOST}:5432/${PROD_DB_NAME}?sslmode=require&pgbouncer=true',
      POSTGRES_PRISMA_URL: 'postgresql://prod_user:${PROD_DB_PASSWORD}@${PROD_DB_HOST}:5432/${PROD_DB_NAME}?sslmode=require&pgbouncer=true',
      NEXT_PRIVATE_DATABASE_URL: 'postgresql://prod_user:${PROD_DB_PASSWORD}@${PROD_DB_HOST}:5432/${PROD_DB_NAME}?sslmode=require&pgbouncer=true',
      NEXT_PRIVATE_DIRECT_DATABASE_URL: 'postgresql://prod_user:${PROD_DB_PASSWORD}@${PROD_DB_DIRECT_HOST}:5432/${PROD_DB_NAME}?sslmode=require',
    },
    notes: [
      'Uses connection pooling (pgbouncer) for application connections',
      'Direct connection bypasses pooling for migrations',
      'SSL is required for production',
      'Separate read replicas can be configured for scaling',
    ],
  },
  
  staging: {
    description: 'Staging database for testing',
    template: {
      DATABASE_URL: 'postgresql://staging_user:${STAGING_DB_PASSWORD}@${STAGING_DB_HOST}:5432/${STAGING_DB_NAME}?sslmode=require',
      POSTGRES_PRISMA_URL: 'postgresql://staging_user:${STAGING_DB_PASSWORD}@${STAGING_DB_HOST}:5432/${STAGING_DB_NAME}?sslmode=require',
      NEXT_PRIVATE_DATABASE_URL: 'postgresql://staging_user:${STAGING_DB_PASSWORD}@${STAGING_DB_HOST}:5432/${STAGING_DB_NAME}?sslmode=require',
      NEXT_PRIVATE_DIRECT_DATABASE_URL: 'postgresql://staging_user:${STAGING_DB_PASSWORD}@${STAGING_DB_HOST}:5432/${STAGING_DB_NAME}?sslmode=require',
    },
    notes: [
      'Mirrors production structure but with staging data',
      'Can use smaller instance sizes',
      'SSL recommended but not always required',
    ],
  },
  
  development: {
    description: 'Local development database',
    template: {
      DATABASE_URL: 'postgresql://dev_user:dev_password@localhost:5432/signtusk_dev',
      POSTGRES_PRISMA_URL: 'postgresql://dev_user:dev_password@localhost:5432/signtusk_dev',
      NEXT_PRIVATE_DATABASE_URL: 'postgresql://dev_user:dev_password@localhost:5432/signtusk_dev',
      NEXT_PRIVATE_DIRECT_DATABASE_URL: 'postgresql://dev_user:dev_password@localhost:5432/signtusk_dev',
    },
    notes: [
      'Local PostgreSQL instance',
      'No SSL required for local development',
      'Can use Docker for consistent setup',
    ],
  },
};

/**
 * Service connection configurations
 */
const SERVICE_CONFIGS = {
  s3: {
    production: {
      NEXT_PUBLIC_UPLOAD_TRANSPORT: 's3',
      NEXT_PRIVATE_UPLOAD_BUCKET: '${PROD_S3_BUCKET}',
      NEXT_PRIVATE_UPLOAD_REGION: 'us-east-1',
      NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID: '${PROD_AWS_ACCESS_KEY_ID}',
      NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY: '${PROD_AWS_SECRET_ACCESS_KEY}',
      NEXT_PRIVATE_UPLOAD_ENDPOINT: '', // Use default AWS endpoint
      NEXT_PRIVATE_UPLOAD_FORCE_PATH_STYLE: 'false',
    },
    staging: {
      NEXT_PUBLIC_UPLOAD_TRANSPORT: 's3',
      NEXT_PRIVATE_UPLOAD_BUCKET: '${STAGING_S3_BUCKET}',
      NEXT_PRIVATE_UPLOAD_REGION: 'us-east-1',
      NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID: '${STAGING_AWS_ACCESS_KEY_ID}',
      NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY: '${STAGING_AWS_SECRET_ACCESS_KEY}',
    },
    development: {
      NEXT_PUBLIC_UPLOAD_TRANSPORT: 'database', // Use database for local dev
      STORAGE_PROVIDER: 'local',
      STORAGE_PATH: './uploads',
    },
  },
  
  email: {
    production: {
      NEXT_PRIVATE_SMTP_TRANSPORT: 'resend',
      NEXT_PRIVATE_RESEND_API_KEY: '${PROD_RESEND_API_KEY}',
      NEXT_PRIVATE_SMTP_FROM_NAME: 'Signtusk',
      NEXT_PRIVATE_SMTP_FROM_ADDRESS: 'noreply@yourdomain.com',
    },
    staging: {
      NEXT_PRIVATE_SMTP_TRANSPORT: 'resend',
      NEXT_PRIVATE_RESEND_API_KEY: '${STAGING_RESEND_API_KEY}',
      NEXT_PRIVATE_SMTP_FROM_NAME: 'Signtusk Staging',
      NEXT_PRIVATE_SMTP_FROM_ADDRESS: 'noreply-staging@yourdomain.com',
    },
    development: {
      NEXT_PRIVATE_SMTP_TRANSPORT: 'smtp-auth',
      NEXT_PRIVATE_SMTP_HOST: '127.0.0.1',
      NEXT_PRIVATE_SMTP_PORT: '1025',
      NEXT_PRIVATE_SMTP_USERNAME: '',
      NEXT_PRIVATE_SMTP_PASSWORD: '',
      NEXT_PRIVATE_SMTP_FROM_NAME: 'Signtusk Dev',
      NEXT_PRIVATE_SMTP_FROM_ADDRESS: 'noreply@localhost',
      NEXT_PRIVATE_SMTP_SECURE: 'false',
    },
  },
  
  redis: {
    production: {
      REDIS_URL: 'redis://:${PROD_REDIS_PASSWORD}@${PROD_REDIS_HOST}:6379',
    },
    staging: {
      REDIS_URL: 'redis://:${STAGING_REDIS_PASSWORD}@${STAGING_REDIS_HOST}:6379',
    },
    development: {
      REDIS_URL: 'redis://localhost:6379',
    },
  },
  
  stripe: {
    production: {
      NEXT_PRIVATE_STRIPE_API_KEY: '${PROD_STRIPE_SECRET_KEY}',
      NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET: '${PROD_STRIPE_WEBHOOK_SECRET}',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '${PROD_STRIPE_PUBLISHABLE_KEY}',
    },
    staging: {
      NEXT_PRIVATE_STRIPE_API_KEY: '${STAGING_STRIPE_SECRET_KEY}',
      NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET: '${STAGING_STRIPE_WEBHOOK_SECRET}',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '${STAGING_STRIPE_PUBLISHABLE_KEY}',
    },
    development: {
      NEXT_PRIVATE_STRIPE_API_KEY: '${DEV_STRIPE_SECRET_KEY}',
      NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET: '${DEV_STRIPE_WEBHOOK_SECRET}',
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: '${DEV_STRIPE_PUBLISHABLE_KEY}',
    },
  },
};

/**
 * Generates environment configuration for a specific environment and services
 * @param {string} environment - Environment name (production, staging, development)
 * @param {string[]} services - Array of service names to include
 * @returns {object} Environment configuration object
 */
function generateEnvironmentConfig(environment, services = ['s3', 'email', 'redis']) {
  const config = {
    // Database configuration
    ...DATABASE_CONFIGS[environment]?.template || {},
  };

  // Add service configurations
  services.forEach(service => {
    if (SERVICE_CONFIGS[service] && SERVICE_CONFIGS[service][environment]) {
      Object.assign(config, SERVICE_CONFIGS[service][environment]);
    }
  });

  return config;
}

/**
 * Generates a complete environment file for a specific environment
 * @param {string} environment - Environment name
 * @param {string} appType - Application type (marketing, remix, docs)
 * @param {string[]} services - Services to include
 * @returns {string} Environment file content
 */
function generateEnvironmentFile(environment, appType, services = ['s3', 'email', 'redis']) {
  const config = generateEnvironmentConfig(environment, services);
  
  let content = `# Environment Configuration for ${appType} - ${environment}\n`;
  content += `# Generated on ${new Date().toISOString()}\n\n`;
  
  // Add database section
  if (DATABASE_CONFIGS[environment]) {
    content += `# Database Configuration\n`;
    content += `# ${DATABASE_CONFIGS[environment].description}\n`;
    Object.entries(DATABASE_CONFIGS[environment].template).forEach(([key, value]) => {
      content += `${key}=${value}\n`;
    });
    content += '\n';
    
    // Add notes
    if (DATABASE_CONFIGS[environment].notes) {
      content += '# Database Notes:\n';
      DATABASE_CONFIGS[environment].notes.forEach(note => {
        content += `# - ${note}\n`;
      });
      content += '\n';
    }
  }
  
  // Add service sections
  services.forEach(service => {
    if (SERVICE_CONFIGS[service] && SERVICE_CONFIGS[service][environment]) {
      content += `# ${service.toUpperCase()} Configuration\n`;
      Object.entries(SERVICE_CONFIGS[service][environment]).forEach(([key, value]) => {
        content += `${key}=${value}\n`;
      });
      content += '\n';
    }
  });
  
  return content;
}

/**
 * Creates database setup SQL script
 * @param {string} environment - Environment name
 * @returns {string} SQL script content
 */
function generateDatabaseSetupSQL(environment) {
  const dbName = environment === 'production' ? 'signtusk_prod' : 
                 environment === 'staging' ? 'signtusk_staging' : 'signtusk_dev';
  const username = environment === 'production' ? 'prod_user' : 
                   environment === 'staging' ? 'staging_user' : 'dev_user';
  
  return `-- Database setup for ${environment} environment
-- Run this script as a PostgreSQL superuser

-- Create database
CREATE DATABASE ${dbName};

-- Create user
CREATE USER ${username} WITH PASSWORD 'CHANGE_THIS_PASSWORD';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${username};

-- Connect to the database and set up extensions
\\c ${dbName}

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO ${username};
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ${username};
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ${username};

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO ${username};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO ${username};

-- Create connection pooling user (for production)
${environment === 'production' ? `
CREATE USER pgbouncer WITH PASSWORD 'CHANGE_THIS_PGBOUNCER_PASSWORD';
GRANT CONNECT ON DATABASE ${dbName} TO pgbouncer;
` : ''}

-- Notes:
-- 1. Change all passwords to secure values
-- 2. Consider using connection pooling (PgBouncer) for production
-- 3. Set up SSL certificates for production databases
-- 4. Configure backup and monitoring
-- 5. Set appropriate connection limits and timeouts
`;
}

/**
 * Main CLI function
 */
async function main() {
  const command = process.argv[2];
  const environment = process.argv[3];
  const appType = process.argv[4];
  
  if (!command || !['generate', 'validate', 'setup-db'].includes(command)) {
    console.log('Usage:');
    console.log('  node setup-database-connections.js generate <environment> <app-type>');
    console.log('  node setup-database-connections.js validate <environment>');
    console.log('  node setup-database-connections.js setup-db <environment>');
    console.log('');
    console.log('Environments: production, staging, development');
    console.log('App types: marketing, remix, docs');
    process.exit(1);
  }
  
  switch (command) {
    case 'generate':
      if (!environment || !appType) {
        console.error('Environment and app type are required for generate command');
        process.exit(1);
      }
      
      const services = appType === 'remix' ? ['s3', 'email', 'redis', 'stripe'] : [];
      const envContent = generateEnvironmentFile(environment, appType, services);
      
      const filename = `.env.${environment}.${appType}`;
      fs.writeFileSync(filename, envContent);
      console.log(`Generated environment configuration: ${filename}`);
      break;
      
    case 'validate':
      if (!environment) {
        console.error('Environment is required for validate command');
        process.exit(1);
      }
      
      console.log(`Validating ${environment} environment configuration...`);
      // This would integrate with the validation script
      const { validateEnvironment } = require('./validate-environment.js');
      const result = validateEnvironment('remix'); // Validate against remix schema as it's most comprehensive
      
      if (result.success) {
        console.log('✅ Environment configuration is valid');
      } else {
        console.log('❌ Environment configuration has issues:');
        result.errors.forEach(error => {
          console.log(`  - ${error.field}: ${error.message}`);
        });
      }
      break;
      
    case 'setup-db':
      if (!environment) {
        console.error('Environment is required for setup-db command');
        process.exit(1);
      }
      
      const sqlContent = generateDatabaseSetupSQL(environment);
      const sqlFilename = `setup-database-${environment}.sql`;
      fs.writeFileSync(sqlFilename, sqlContent);
      console.log(`Generated database setup script: ${sqlFilename}`);
      console.log('Run this script as a PostgreSQL superuser to set up the database');
      break;
  }
}

// Export functions for use in other modules
module.exports = {
  generateEnvironmentConfig,
  generateEnvironmentFile,
  generateDatabaseSetupSQL,
  DATABASE_CONFIGS,
  SERVICE_CONFIGS,
};

// Run main function if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Setup script error:', error);
    process.exit(1);
  });
}