# Environment Variables Configuration Guide

This document provides comprehensive guidance for configuring environment variables across all Netlify deployments in the monorepo.

## Overview

Each application in the monorepo requires specific environment variables for proper functionality. This guide covers:

- Environment variable templates for each application
- Security best practices
- Environment-specific configurations
- Validation and troubleshooting

## Application-Specific Templates

### Marketing Site (apps/web)
**Template File:** `.env.netlify.marketing.example`
**Netlify Site:** Marketing site deployment

**Required Variables:**
- `NODE_ENV=production`
- `NEXT_PUBLIC_WEBAPP_URL` - URL to the main Remix application
- `NEXT_PUBLIC_MARKETING_URL` - URL to the marketing site itself
- `NEXT_PUBLIC_DOCS_URL` - URL to the documentation site

**Optional Variables:**
- Analytics keys (PostHog, Google Analytics)
- CMS integration keys
- Contact form webhook URLs

### Remix Application (apps/remix)
**Template File:** `.env.netlify.remix.example`
**Netlify Site:** Main application deployment

**Required Variables:**
- Database connection strings
- Authentication secrets (NextAuth, JWT)
- File storage configuration (S3)
- Email service configuration
- Document signing certificates

**Optional Variables:**
- OAuth provider credentials
- Billing integration (Stripe)
- Analytics and monitoring
- AI services integration

### Documentation Site (apps/docs)
**Template File:** `.env.netlify.docs.example`
**Netlify Site:** Documentation deployment

**Required Variables:**
- `NEXT_PUBLIC_API_BASE_URL` - Base URL for API examples
- Application URLs for cross-linking

**Optional Variables:**
- Search integration (Algolia)
- Analytics configuration
- Interactive example credentials

## Environment-Specific Configuration

### Production Environment
```bash
NODE_ENV=production
NETLIFY_CACHE_ENABLED=true
NETLIFY_BUILD_DEBUG=false
```

### Deploy Preview Environment
```bash
NODE_ENV=production
NETLIFY_CACHE_ENABLED=true
NETLIFY_BUILD_DEBUG=true
```

### Branch Deploy Environment
```bash
NODE_ENV=development
NETLIFY_CACHE_ENABLED=false
NETLIFY_BUILD_DEBUG=true
```

## Security Best Practices

### 1. Secret Generation
Generate secure secrets using these commands:

```bash
# For NextAuth and JWT secrets (32+ characters)
openssl rand -base64 32

# For encryption keys (64 hex characters)
openssl rand -hex 32

# For webhook secrets
openssl rand -base64 24
```

### 2. Variable Naming Conventions

- **Public variables** (exposed to browser): `NEXT_PUBLIC_*`
- **Private variables** (server-only): `NEXT_PRIVATE_*`
- **Build variables**: `NODE_*`, `NPM_*`, `TURBO_*`
- **Legacy variables**: Maintain for backward compatibility

### 3. Secure Storage Guidelines

#### Netlify Environment Variables UI
1. Navigate to Site Settings → Environment Variables
2. Use "Sensitive" flag for secrets and API keys
3. Set appropriate scopes (Production, Deploy Preview, Branch Deploy)
4. Use different values for different environments

#### Variable Scoping
- **Production only**: Database URLs, API keys, certificates
- **All contexts**: Public URLs, feature flags
- **Deploy preview**: Test API keys, staging database URLs

### 4. Environment Isolation

Each Netlify site should have completely isolated environment variables:

```bash
# Marketing Site
NEXT_PUBLIC_WEBAPP_URL=https://app.yourdomain.com
NEXT_PUBLIC_MARKETING_URL=https://yourdomain.com

# Remix App
DATABASE_URL=postgresql://prod-user:pass@prod-host/prod-db
NEXTAUTH_SECRET=prod-secret-32-chars

# Docs Site
NEXT_PUBLIC_API_BASE_URL=https://app.yourdomain.com/api
```

## Database Configuration

### Primary Database (Required for Remix App)
```bash
# Connection pooling URL (for application)
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require

# Direct connection URL (for migrations)
POSTGRES_PRISMA_URL=postgresql://user:pass@host:port/db?sslmode=require
```

### Environment-Specific Databases
- **Production**: Use production database with SSL
- **Deploy Preview**: Use staging database or production read-replica
- **Branch Deploy**: Use development database or staging

## Third-Party Service Configuration

### File Storage (S3)
```bash
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_BUCKET=your-bucket-name
NEXT_PRIVATE_UPLOAD_REGION=us-east-1
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=AKIA...
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=secret...
```

### Email Service (Resend - Recommended)
```bash
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=re_...
NEXT_PRIVATE_SMTP_FROM_NAME=Your App Name
NEXT_PRIVATE_SMTP_FROM_ADDRESS=noreply@yourdomain.com
```

### Authentication (OAuth Providers)
```bash
# Google OAuth
NEXT_PRIVATE_GOOGLE_CLIENT_ID=your-client-id
NEXT_PRIVATE_GOOGLE_CLIENT_SECRET=your-client-secret

# Microsoft OAuth
NEXT_PRIVATE_MICROSOFT_CLIENT_ID=your-client-id
NEXT_PRIVATE_MICROSOFT_CLIENT_SECRET=your-client-secret
```

## Environment Variable Validation

### Build-Time Validation
The build process validates required environment variables:

```javascript
// Validation occurs in build scripts
const requiredVars = [
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'NEXT_PUBLIC_WEBAPP_URL'
];

requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});
```

### Runtime Validation
Applications validate environment variables at startup:

```typescript
// Runtime validation in application code
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXT_PUBLIC_WEBAPP_URL: z.string().url(),
});

export const env = envSchema.parse(process.env);
```

## Troubleshooting

### Common Issues

1. **Build Failures Due to Missing Variables**
   - Check Netlify site environment variables
   - Verify variable names match exactly (case-sensitive)
   - Ensure required variables are set for the deployment context

2. **Database Connection Errors**
   - Verify database URL format and credentials
   - Check SSL requirements (`sslmode=require`)
   - Ensure database allows connections from Netlify IPs

3. **File Upload Failures**
   - Verify S3 bucket permissions
   - Check AWS credentials and region
   - Ensure bucket CORS configuration allows your domain

4. **Email Delivery Issues**
   - Verify SMTP credentials or API keys
   - Check sender domain authentication
   - Ensure from address is authorized

### Debugging Environment Variables

1. **Enable Build Debug Mode**
   ```bash
   NETLIFY_BUILD_DEBUG=true
   ```

2. **Check Variable Availability**
   Add temporary logging in build scripts:
   ```javascript
   console.log('Available env vars:', Object.keys(process.env).filter(k => k.startsWith('NEXT_')));
   ```

3. **Validate Variable Values**
   Use Netlify Functions to check runtime variables:
   ```javascript
   exports.handler = async (event, context) => {
     return {
       statusCode: 200,
       body: JSON.stringify({
         hasDatabase: !!process.env.DATABASE_URL,
         hasAuth: !!process.env.NEXTAUTH_SECRET,
       })
     };
   };
   ```

## Migration Checklist

When setting up environment variables for a new deployment:

### Pre-Deployment
- [ ] Copy appropriate template file
- [ ] Generate all required secrets
- [ ] Configure third-party services
- [ ] Set up environment-specific resources (databases, S3 buckets)

### Netlify Configuration
- [ ] Create Netlify site
- [ ] Configure build settings
- [ ] Add environment variables via UI
- [ ] Set appropriate variable scopes
- [ ] Test with deploy preview

### Post-Deployment
- [ ] Verify all functionality works
- [ ] Test email delivery
- [ ] Verify file uploads
- [ ] Check database connectivity
- [ ] Validate OAuth flows

### Security Review
- [ ] Rotate any temporary or default secrets
- [ ] Verify no secrets in git history
- [ ] Confirm environment isolation
- [ ] Set up monitoring and alerting

## Support and Maintenance

### Regular Maintenance Tasks
1. **Monthly**: Review and rotate API keys
2. **Quarterly**: Audit environment variable usage
3. **Annually**: Update certificates and long-term secrets

### Monitoring
Set up alerts for:
- Failed builds due to missing environment variables
- Database connection failures
- Third-party service API errors
- Certificate expiration warnings

### Documentation Updates
Keep this guide updated when:
- Adding new environment variables
- Changing third-party services
- Updating security requirements
- Modifying deployment processes