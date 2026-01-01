# Vercel Configuration Templates

## Overview

This document provides ready-to-use configuration templates, checklists, and monitoring setups for deploying SignTusk to Vercel. These templates ensure consistent deployments and help prevent common configuration issues.

## Environment Variable Templates

### Production Environment Template

Copy this template and replace placeholder values with your actual configuration:

```bash
# === CORE APPLICATION ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_WEBAPP_URL=https://your-app.vercel.app

# === DATABASE CONFIGURATION ===
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
NEXT_PRIVATE_DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
POSTGRES_PRISMA_URL=postgresql://username:password@host:port/database?sslmode=require
NEXT_PRIVATE_DIRECT_DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# === AUTHENTICATION & SECURITY ===
NEXTAUTH_SECRET=your-32-character-nextauth-secret-here
JWT_SECRET=your-jwt-secret-for-token-signing-here
ENCRYPTION_KEY=your-32-character-encryption-key-here
NEXT_PRIVATE_ENCRYPTION_KEY=your-32-character-encryption-key-here

# === FILE STORAGE (AWS S3) ===
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_ENDPOINT=https://s3.amazonaws.com

# === EMAIL SERVICE ===
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=re_your-resend-api-key
NEXT_PRIVATE_SMTP_FROM_ADDRESS=noreply@yourdomain.com

# === OPTIONAL SERVICES ===
# Redis (for caching and sessions)
REDIS_URL=redis://username:password@host:port

# Stripe (for payments)
NEXT_PRIVATE_STRIPE_API_KEY=sk_live_...
NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# PostHog (for analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Rate limiting
RATE_LIMIT_ENABLED=true

# Build optimization
SKIP_ENV_VALIDATION=false
ANALYZE_BUNDLE=false
```

### Preview/Staging Environment Template

```bash
# === CORE APPLICATION ===
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app-preview.vercel.app
NEXT_PUBLIC_WEBAPP_URL=https://your-app-preview.vercel.app

# === DATABASE CONFIGURATION (Use staging database) ===
DATABASE_URL=postgresql://username:password@staging-host:port/staging_db?sslmode=require
NEXT_PRIVATE_DATABASE_URL=postgresql://username:password@staging-host:port/staging_db?sslmode=require
POSTGRES_PRISMA_URL=postgresql://username:password@staging-host:port/staging_db?sslmode=require

# === AUTHENTICATION & SECURITY (Use different secrets) ===
NEXTAUTH_SECRET=your-staging-32-character-secret
JWT_SECRET=your-staging-jwt-secret
ENCRYPTION_KEY=your-staging-32-character-key
NEXT_PRIVATE_ENCRYPTION_KEY=your-staging-32-character-key

# === FILE STORAGE (Use staging bucket) ===
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_BUCKET=your-staging-s3-bucket
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-staging-aws-secret
AWS_REGION=us-east-1

# === EMAIL SERVICE (Use test mode) ===
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=re_your-test-api-key
NEXT_PRIVATE_SMTP_FROM_ADDRESS=staging@yourdomain.com

# === DEVELOPMENT FLAGS ===
SKIP_ENV_VALIDATION=false
ANALYZE_BUNDLE=true
```

### Development Environment Template

```bash
# === CORE APPLICATION ===
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WEBAPP_URL=http://localhost:3000

# === DATABASE CONFIGURATION (Local or dev database) ===
DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/signtusk_dev
NEXT_PRIVATE_DATABASE_URL=postgresql://dev_user:dev_pass@localhost:5432/signtusk_dev
POSTGRES_PRISMA_URL=postgresql://dev_user:dev_pass@localhost:5432/signtusk_dev

# === AUTHENTICATION & SECURITY (Development secrets) ===
NEXTAUTH_SECRET=dev-secret-32-characters-long-here
JWT_SECRET=dev-jwt-secret
ENCRYPTION_KEY=dev-encryption-key-32-chars-long
NEXT_PRIVATE_ENCRYPTION_KEY=dev-encryption-key-32-chars-long

# === FILE STORAGE (Local or dev bucket) ===
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_BUCKET=signtusk-dev-uploads
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=dev-aws-secret
AWS_REGION=us-east-1

# === EMAIL SERVICE (Development mode) ===
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=re_dev-api-key
NEXT_PRIVATE_SMTP_FROM_ADDRESS=dev@localhost

# === DEVELOPMENT FLAGS ===
SKIP_ENV_VALIDATION=true
ANALYZE_BUNDLE=false
```

## Vercel Project Configuration Templates

### vercel.json Template

```json
{
  "version": 2,
  "framework": null,
  "buildCommand": "npm run build",
  "outputDirectory": "apps/remix/build",
  "installCommand": "npm install",
  "devCommand": "npm run dev",
  "regions": ["iad1"],
  "functions": {
    "apps/remix/build/server/index.js": {
      "maxDuration": 30
    }
  },
  "routes": [
    {
      "src": "/build/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/apps/remix/build/server/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  },
  "build": {
    "env": {
      "NODE_ENV": "production",
      "SKIP_ENV_VALIDATION": "false"
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### package.json Build Scripts Template

```json
{
  "scripts": {
    "build": "node scripts/vercel-build.js",
    "build:remix": "remix build",
    "build:fallback": "node scripts/vercel-build-fallback.js",
    "build:validate": "node scripts/validate-build-output.js",
    "prebuild": "node scripts/vercel-pre-build-validation.js",
    "postbuild": "node scripts/validate-build-output.js",
    "dev": "remix dev",
    "start": "remix-serve build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint --ignore-path .gitignore --cache --cache-location ./node_modules/.cache/eslint .",
    "test": "vitest --run",
    "test:e2e": "playwright test"
  }
}
```

### Turbo Configuration Template

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["build/**", "dist/**", ".next/**"],
      "env": [
        "NODE_ENV",
        "NEXT_PUBLIC_APP_URL",
        "NEXT_PUBLIC_WEBAPP_URL",
        "DATABASE_URL",
        "NEXT_PRIVATE_DATABASE_URL",
        "POSTGRES_PRISMA_URL",
        "NEXTAUTH_SECRET",
        "JWT_SECRET",
        "ENCRYPTION_KEY",
        "NEXT_PRIVATE_ENCRYPTION_KEY",
        "AWS_ACCESS_KEY_ID",
        "AWS_SECRET_ACCESS_KEY",
        "AWS_REGION",
        "NEXT_PRIVATE_UPLOAD_BUCKET",
        "NEXT_PUBLIC_UPLOAD_TRANSPORT",
        "NEXT_PRIVATE_SMTP_TRANSPORT",
        "NEXT_PRIVATE_RESEND_API_KEY",
        "REDIS_URL",
        "SKIP_ENV_VALIDATION"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"]
    }
  }
}
```

## Deployment Checklists

### Pre-Deployment Checklist

#### Environment Setup
- [ ] **Database Ready**
  - [ ] Production PostgreSQL instance created
  - [ ] Database credentials secured
  - [ ] Connection string tested
  - [ ] SSL/TLS configured
  - [ ] Migrations applied

- [ ] **External Services Configured**
  - [ ] AWS S3 bucket created and configured
  - [ ] S3 CORS policy set for your domain
  - [ ] IAM user created with S3 permissions
  - [ ] Email service (Resend) API key obtained
  - [ ] Email sender domain verified

- [ ] **Security Secrets Generated**
  - [ ] NEXTAUTH_SECRET (32 characters)
  - [ ] JWT_SECRET (strong random string)
  - [ ] ENCRYPTION_KEY (32 characters)
  - [ ] All secrets unique per environment

#### Code Preparation
- [ ] **Build Scripts Validated**
  - [ ] No CLI dependencies (dotenv, etc.)
  - [ ] All dependencies in package.json
  - [ ] Build scripts tested locally
  - [ ] Fallback mechanisms implemented

- [ ] **Environment Variables**
  - [ ] All required variables identified
  - [ ] Variable names documented
  - [ ] Example values provided
  - [ ] Validation scripts created

- [ ] **Testing Complete**
  - [ ] Unit tests passing
  - [ ] Integration tests passing
  - [ ] Property-based tests passing
  - [ ] E2E tests passing

### Deployment Execution Checklist

#### Vercel Project Setup
- [ ] **Project Configuration**
  - [ ] Vercel project created
  - [ ] Repository connected
  - [ ] Build settings configured
  - [ ] Framework preset set to "Other"
  - [ ] Root directory set to "apps/remix"

- [ ] **Environment Variables**
  - [ ] All production variables added
  - [ ] Variable scopes set correctly
  - [ ] Sensitive variables marked as encrypted
  - [ ] Test variables for preview environment

- [ ] **Build Configuration**
  - [ ] Build command: `npm run build`
  - [ ] Output directory: `apps/remix/build`
  - [ ] Install command: `npm install`
  - [ ] Node.js version: 18.x or latest LTS

#### Deployment Process
- [ ] **Initial Deployment**
  - [ ] Deployment triggered
  - [ ] Build logs monitored
  - [ ] No dependency errors
  - [ ] Environment variables loaded
  - [ ] Build completed successfully

- [ ] **Post-Deployment Validation**
  - [ ] Application loads without errors
  - [ ] Health check endpoint responds
  - [ ] Database connectivity verified
  - [ ] File upload functionality tested
  - [ ] Email sending tested
  - [ ] Authentication flows working

### Post-Deployment Checklist

#### Functionality Validation
- [ ] **Core Features**
  - [ ] User registration/login
  - [ ] Document upload
  - [ ] Document signing
  - [ ] Email notifications
  - [ ] File downloads

- [ ] **Performance**
  - [ ] Page load times < 3 seconds
  - [ ] API response times < 1 second
  - [ ] Static assets loading quickly
  - [ ] No console errors

- [ ] **Security**
  - [ ] HTTPS enforced
  - [ ] Security headers present
  - [ ] No sensitive data in client bundle
  - [ ] Authentication working correctly

#### Monitoring Setup
- [ ] **Health Monitoring**
  - [ ] Health check endpoint configured
  - [ ] Uptime monitoring enabled
  - [ ] Error tracking configured
  - [ ] Performance monitoring active

- [ ] **Alerting**
  - [ ] Error rate alerts
  - [ ] Performance degradation alerts
  - [ ] Uptime alerts
  - [ ] Database connection alerts

## Monitoring and Validation Templates

### Health Check Endpoint Template

```typescript
// app/routes/api.health.ts
import { json } from "@remix-run/node";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function loader() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: "healthy",
    checks: {
      database: "unknown",
      storage: "unknown",
      email: "unknown"
    }
  };

  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`;
    checks.checks.database = "healthy";
  } catch (error) {
    checks.checks.database = "unhealthy";
    checks.status = "unhealthy";
  }

  try {
    // S3 check (optional)
    // Add S3 connectivity check here
    checks.checks.storage = "healthy";
  } catch (error) {
    checks.checks.storage = "unhealthy";
  }

  try {
    // Email service check (optional)
    // Add email service connectivity check here
    checks.checks.email = "healthy";
  } catch (error) {
    checks.checks.email = "unhealthy";
  }

  const status = checks.status === "healthy" ? 200 : 503;
  return json(checks, { status });
}
```

### Build Validation Script Template

```javascript
// scripts/validate-build-output.js
const fs = require('fs');
const path = require('path');

function validateBuildOutput() {
  const buildDir = path.join(__dirname, '../apps/remix/build');
  const requiredFiles = [
    'server/index.js',
    'client/manifest.json',
    'client/assets'
  ];

  console.log('🔍 Validating build output...');

  let allValid = true;

  requiredFiles.forEach(file => {
    const filePath = path.join(buildDir, file);
    if (fs.existsSync(filePath)) {
      console.log(`✅ ${file} exists`);
    } else {
      console.error(`❌ ${file} missing`);
      allValid = false;
    }
  });

  // Check bundle sizes
  const clientDir = path.join(buildDir, 'client');
  if (fs.existsSync(clientDir)) {
    const stats = fs.statSync(clientDir);
    console.log(`📦 Client bundle size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  }

  if (allValid) {
    console.log('✅ Build output validation passed');
    process.exit(0);
  } else {
    console.error('❌ Build output validation failed');
    process.exit(1);
  }
}

validateBuildOutput();
```

### Environment Validation Script Template

```javascript
// scripts/validate-vercel-environment.js
const requiredVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'ENCRYPTION_KEY',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'NEXT_PRIVATE_UPLOAD_BUCKET'
];

const optionalVars = [
  'REDIS_URL',
  'NEXT_PRIVATE_RESEND_API_KEY',
  'NEXT_PRIVATE_STRIPE_API_KEY'
];

function validateEnvironment() {
  console.log('🌍 Validating environment variables...');

  let allValid = true;
  const missing = [];
  const present = [];

  // Check required variables
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
      console.log(`✅ ${varName} is set`);
    } else {
      missing.push(varName);
      console.error(`❌ ${varName} is missing`);
      allValid = false;
    }
  });

  // Check optional variables
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`ℹ️  ${varName} is set (optional)`);
    } else {
      console.log(`⚠️  ${varName} is not set (optional)`);
    }
  });

  // Validate specific formats
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.error('❌ DATABASE_URL must be a PostgreSQL connection string');
    allValid = false;
  }

  if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
    console.error('❌ NEXTAUTH_SECRET must be at least 32 characters');
    allValid = false;
  }

  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
    console.error('❌ ENCRYPTION_KEY must be exactly 32 characters');
    allValid = false;
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Present: ${present.length}/${requiredVars.length} required variables`);
  if (missing.length > 0) {
    console.log(`❌ Missing: ${missing.join(', ')}`);
  }

  if (allValid) {
    console.log('✅ Environment validation passed');
    return true;
  } else {
    console.error('❌ Environment validation failed');
    return false;
  }
}

if (require.main === module) {
  const isValid = validateEnvironment();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateEnvironment };
```

## Quick Setup Commands

### One-Command Environment Setup

```bash
# Create all necessary files and configurations
curl -o vercel.json https://raw.githubusercontent.com/your-org/signtusk/main/templates/vercel.json
curl -o .env.template https://raw.githubusercontent.com/your-org/signtusk/main/templates/.env.production.template

# Generate secure secrets
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.production
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.production
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env.production

# Validate setup
node scripts/validate-vercel-environment.js
```

### Bulk Environment Variable Import

```bash
# Using Vercel CLI
vercel env add NODE_ENV production
vercel env add NEXT_PUBLIC_APP_URL https://your-app.vercel.app
# ... continue for all variables

# Or import from file
vercel env add < .env.production
```

## Troubleshooting Templates

### Common Error Solutions

#### Build Error: "dotenv: command not found"
```bash
# Fix: Replace CLI usage with programmatic loading
# In package.json, change:
# "build": "dotenv -- npm run build"
# To:
# "build": "node scripts/vercel-build.js"
```

#### Runtime Error: "Environment variable not found"
```bash
# Fix: Verify in Vercel dashboard
# 1. Go to Project Settings → Environment Variables
# 2. Check variable name matches exactly
# 3. Ensure variable is enabled for correct environment
# 4. Redeploy to pick up changes
```

#### Database Connection Error
```bash
# Fix: Check connection string format
# Correct: postgresql://user:pass@host:port/db?sslmode=require
# Test connection:
node -e "const { PrismaClient } = require('@prisma/client'); new PrismaClient().\$connect().then(() => console.log('OK')).catch(console.error);"
```

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained by**: Development Team