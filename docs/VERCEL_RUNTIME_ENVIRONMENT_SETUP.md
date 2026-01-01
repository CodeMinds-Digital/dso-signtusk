# Vercel Runtime Environment Setup Guide

## Overview

This guide provides comprehensive instructions for configuring environment variables in Vercel dashboard to ensure proper runtime functionality of the SignTusk application.

## Critical Runtime Environment Variables

### Required Variables (Must be configured in Vercel dashboard)

#### 1. Authentication Variables

```bash
# NextAuth.js Configuration
NEXTAUTH_SECRET=your-32-character-secret-here
NEXTAUTH_URL=https://your-vercel-app.vercel.app

# JWT Configuration
JWT_SECRET=your-32-character-jwt-secret-here
```

**Generation Commands:**

```bash
# Generate NEXTAUTH_SECRET (32+ characters)
openssl rand -base64 32

# Generate JWT_SECRET (32+ characters)
openssl rand -base64 32
```

#### 2. Database Configuration

```bash
# Primary Database Connection
DATABASE_URL=postgresql://username:password@host:port/database

# Prisma-specific (if using Neon or similar)
POSTGRES_PRISMA_URL=postgresql://username:password@host:port/database?pgbouncer=true&connect_timeout=15
POSTGRES_URL_NON_POOLING=postgresql://username:password@host:port/database
```

#### 3. Application URLs

```bash
# Public URLs (must match your Vercel deployment)
NEXT_PUBLIC_WEBAPP_URL=https://your-vercel-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-vercel-app.vercel.app

# Environment
NODE_ENV=production
```

### Optional Runtime Variables

#### Email Configuration

```bash
# Email Provider (Resend recommended)
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-api-key

# Alternative SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com
```

#### File Storage (AWS S3)

```bash
STORAGE_PROVIDER=s3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name
```

#### Security & Encryption

```bash
ENCRYPTION_KEY=your-32-character-encryption-key
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

## Vercel Dashboard Configuration

### Step 1: Access Environment Variables

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Environment Variables**

### Step 2: Add Required Variables

For each environment variable:

1. Click **Add New**
2. Enter the **Name** (e.g., `NEXTAUTH_SECRET`)
3. Enter the **Value** (generated secret)
4. Select environments:
   - ✅ **Production**
   - ✅ **Preview** (recommended)
   - ✅ **Development** (optional)
5. Click **Save**

### Step 3: Verify Configuration

After adding all variables, verify by:

1. Triggering a new deployment
2. Checking function logs for environment variable errors
3. Testing authentication and database connectivity

## Environment Variable Validation Script

Use this script to validate your environment configuration:

```bash
# Run from project root
node scripts/vercel-runtime-error-analyzer.js
```

This will check:

- ✅ Required variables are present
- ✅ Variable formats are correct
- ✅ Database connectivity
- ✅ Server function compatibility

## Common Runtime Issues & Solutions

### Issue 1: "NEXTAUTH_URL is not defined"

**Cause:** Missing NEXTAUTH_URL in Vercel environment variables

**Solution:**

```bash
# Add to Vercel dashboard
NEXTAUTH_URL=https://your-vercel-app.vercel.app
```

### Issue 2: "Database connection failed"

**Cause:** Incorrect DATABASE_URL or missing database credentials

**Solution:**

1. Verify DATABASE_URL format: `postgresql://user:pass@host:port/db`
2. Test connection from local environment
3. Ensure database allows connections from Vercel IPs

### Issue 3: "NextAuth session errors"

**Cause:** NEXTAUTH_SECRET not configured or too short

**Solution:**

```bash
# Generate secure secret (32+ characters)
openssl rand -base64 32

# Add to Vercel dashboard as NEXTAUTH_SECRET
```

### Issue 4: "Email sending failed"

**Cause:** Missing email configuration

**Solution:**

```bash
# For Resend (recommended)
EMAIL_PROVIDER=resend
RESEND_API_KEY=your-resend-key

# For SMTP
SMTP_HOST=your-smtp-host
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASSWORD=your-password
```

## Security Best Practices

### 1. Secret Generation

- Use cryptographically secure random generators
- Minimum 32 characters for all secrets
- Never reuse secrets across environments

### 2. Environment Separation

- Use different secrets for Production/Preview/Development
- Never commit secrets to version control
- Rotate secrets regularly

### 3. Access Control

- Limit team member access to production secrets
- Use Vercel's team permissions appropriately
- Monitor environment variable access logs

## Deployment Checklist

Before deploying to Vercel:

- [ ] All required environment variables configured
- [ ] Database connection tested
- [ ] NEXTAUTH_URL matches deployment URL
- [ ] Email configuration tested
- [ ] File storage (S3) configured
- [ ] Security keys generated and added
- [ ] Environment validation script passes

## Troubleshooting Commands

```bash
# Check environment variable configuration
node scripts/vercel-runtime-error-analyzer.js

# Validate Vercel deployment readiness
node scripts/vercel-pre-build-validation.js

# Test database connectivity
cd packages/prisma && npx prisma db pull

# Generate Prisma client
cd packages/prisma && npx prisma generate
```

## Support

If you encounter issues:

1. Check Vercel function logs in dashboard
2. Run validation scripts locally
3. Verify environment variable configuration
4. Test individual components (auth, database, email)

For additional help, refer to:

- [Vercel Environment Variables Documentation](https://vercel.com/docs/concepts/projects/environment-variables)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
- [Prisma Database Configuration](https://www.prisma.io/docs/reference/database-reference/connection-urls)
