# Vercel Deployment Process Guide

## Overview

This comprehensive guide provides step-by-step instructions for deploying the SignTusk application to Vercel, with specific focus on resolving common deployment failures, environment variable configuration, and troubleshooting build issues.

## Prerequisites

Before starting the deployment process, ensure you have:

- [ ] Vercel account with appropriate permissions
- [ ] Access to the SignTusk repository
- [ ] Database instance (PostgreSQL) ready for production
- [ ] AWS S3 bucket configured for file storage
- [ ] Email service provider (Resend or SMTP) configured
- [ ] All required API keys and secrets generated

## Step-by-Step Deployment Process

### Phase 1: Pre-Deployment Preparation

#### Step 1: Validate Build Environment Locally

Before deploying to Vercel, validate that your build works locally with Vercel-like constraints:

```bash
# 1. Clean install dependencies (simulates Vercel's fresh install)
rm -rf node_modules package-lock.json
npm install

# 2. Run pre-build validation script
node scripts/vercel-pre-build-validation.js

# 3. Test build with production environment
NODE_ENV=production npm run build

# 4. Validate all required dependencies are in package.json
node apps/remix/scripts/audit-build-dependencies.js
```

**Expected Output**: All validation checks should pass without errors.

#### Step 2: Prepare Environment Variables

Create a comprehensive list of all required environment variables:

```bash
# Generate environment variable audit
node scripts/audit-environment-variables.js

# Validate environment variable accessibility
node scripts/validate-vercel-environment.js
```

**Required Variables Checklist**:
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL` (your Vercel domain)
- [ ] `DATABASE_URL` (PostgreSQL connection string)
- [ ] `NEXTAUTH_SECRET` (32-character secret)
- [ ] `ENCRYPTION_KEY` (32-character key)
- [ ] `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- [ ] `NEXT_PRIVATE_UPLOAD_BUCKET` (S3 bucket name)
- [ ] `NEXT_PRIVATE_RESEND_API_KEY` (email service)

#### Step 3: Validate Build Scripts

Ensure all build scripts are Vercel-compatible:

```bash
# Check for CLI dependencies that might not be available in Vercel
grep -r "dotenv" apps/remix/package.json
grep -r "with:env" apps/remix/package.json

# Validate build scripts use programmatic environment loading
node apps/remix/scripts/vercel-build.js --dry-run
```

**Common Issues to Fix**:
- Replace `dotenv` CLI usage with programmatic loading
- Ensure all dependencies are in `package.json`, not global installs
- Verify build scripts don't rely on external CLI tools

### Phase 2: Vercel Project Setup

#### Step 4: Create Vercel Project

1. **Via Vercel Dashboard**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Select the root directory
   - Choose "Other" as framework preset (for monorepo)

2. **Via Vercel CLI**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Initialize project
   vercel --cwd apps/remix
   ```

#### Step 5: Configure Build Settings

In the Vercel dashboard, configure:

- **Build Command**: `npm run build`
- **Output Directory**: `apps/remix/build`
- **Install Command**: `npm install`
- **Root Directory**: `apps/remix`

**Advanced Settings**:
- **Node.js Version**: `18.x` (or latest LTS)
- **Environment Variables**: Configure in next step

#### Step 6: Configure Environment Variables

**Method 1: Vercel Dashboard**
1. Navigate to Project Settings → Environment Variables
2. Add each variable individually:
   - **Name**: `DATABASE_URL`
   - **Value**: Your actual database URL
   - **Environments**: ✅ Production ✅ Preview ✅ Development
3. Repeat for all required variables

**Method 2: Bulk Import via CLI**
```bash
# Create temporary env file (DO NOT commit)
cat > .env.vercel << EOF
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
NEXTAUTH_SECRET=your-32-character-secret
ENCRYPTION_KEY=your-32-character-key
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
NEXT_PRIVATE_UPLOAD_BUCKET=your-bucket
NEXT_PRIVATE_RESEND_API_KEY=re_...
EOF

# Import to Vercel (requires Vercel CLI)
vercel env add < .env.vercel

# Clean up
rm .env.vercel
```

### Phase 3: Deployment Execution

#### Step 7: Initial Deployment

1. **Trigger Deployment**:
   ```bash
   # Via CLI
   vercel --prod
   
   # Or push to main branch (if auto-deploy enabled)
   git push origin main
   ```

2. **Monitor Build Process**:
   - Watch build logs in Vercel dashboard
   - Check for dependency installation errors
   - Verify environment variable loading

#### Step 8: Validate Deployment Success

After deployment completes:

1. **Check Application Health**:
   ```bash
   # Test application endpoints
   curl -I https://your-app.vercel.app
   curl -I https://your-app.vercel.app/api/health
   ```

2. **Verify Core Functionality**:
   - [ ] Application loads without errors
   - [ ] Database connection works
   - [ ] File uploads function correctly
   - [ ] Email sending works
   - [ ] Authentication flows work

3. **Check Performance**:
   - [ ] Page load times are acceptable
   - [ ] API responses are fast
   - [ ] Static assets load correctly

## Troubleshooting Common Issues

### Build Failures

#### Issue: "dotenv: command not found"

**Symptoms**:
```
Error: Command "dotenv" not found
Build failed with exit code 127
```

**Solution**:
1. Replace CLI usage with programmatic loading:
   ```javascript
   // Instead of: "dotenv -- npm run build"
   // Use programmatic loading in build script:
   require('dotenv').config();
   ```

2. Update `package.json` build scripts:
   ```json
   {
     "scripts": {
       "build": "node scripts/vercel-build.js",
       "build:fallback": "node scripts/vercel-build-fallback.js"
     }
   }
   ```

#### Issue: Missing Dependencies

**Symptoms**:
```
Error: Cannot find module 'some-package'
Module not found: Can't resolve 'package-name'
```

**Solution**:
1. Audit and fix dependencies:
   ```bash
   node apps/remix/scripts/audit-build-dependencies.js
   ```

2. Move devDependencies to dependencies if needed for build:
   ```bash
   npm install --save package-name
   ```

#### Issue: Environment Variables Not Loading

**Symptoms**:
```
Error: Environment variable DATABASE_URL is not defined
Build failed: Missing required environment variables
```

**Solution**:
1. Verify variables are set in Vercel dashboard
2. Check variable names match exactly (case-sensitive)
3. Ensure variables are enabled for correct environment
4. Test environment loading:
   ```bash
   node scripts/validate-vercel-environment.js
   ```

### Runtime Errors

#### Issue: Database Connection Failures

**Symptoms**:
```
Error: connect ECONNREFUSED
Database connection timeout
SSL connection required
```

**Solutions**:
1. **Connection String Format**:
   ```bash
   # Correct format with SSL
   DATABASE_URL="postgresql://user:pass@host:port/db?sslmode=require"
   ```

2. **Test Connection**:
   ```bash
   # Test database connectivity
   node -e "
   const { PrismaClient } = require('@prisma/client');
   const prisma = new PrismaClient();
   prisma.\$connect().then(() => console.log('Connected')).catch(console.error);
   "
   ```

3. **Common Fixes**:
   - Add `?sslmode=require` for PostgreSQL
   - Verify database allows connections from Vercel IPs
   - Check database credentials and permissions

#### Issue: File Upload Failures

**Symptoms**:
```
Error: Access Denied (S3)
Upload failed: Invalid credentials
CORS error on file upload
```

**Solutions**:
1. **Verify AWS Configuration**:
   ```bash
   # Test AWS credentials
   aws s3 ls s3://your-bucket-name --region us-east-1
   ```

2. **Check S3 Bucket CORS**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "POST", "PUT", "DELETE"],
       "AllowedOrigins": ["https://your-app.vercel.app"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

3. **Validate Environment Variables**:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `NEXT_PRIVATE_UPLOAD_BUCKET`

### Performance Issues

#### Issue: Slow Build Times

**Solutions**:
1. **Enable Vercel Build Cache**:
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "framework": null,
     "cache": ["node_modules/.cache", ".turbo"]
   }
   ```

2. **Optimize Turbo Configuration**:
   ```json
   // turbo.json
   {
     "pipeline": {
       "build": {
         "cache": true,
         "outputs": ["build/**", "dist/**"]
       }
     }
   }
   ```

#### Issue: Large Bundle Sizes

**Solutions**:
1. **Analyze Bundle**:
   ```bash
   npm run build:analyze
   ```

2. **Enable Tree Shaking**:
   ```javascript
   // Ensure proper imports
   import { specific } from 'library'; // Good
   import * as library from 'library'; // Avoid
   ```

## Advanced Configuration

### Custom Build Process

For complex build requirements, create custom build scripts:

```javascript
// scripts/vercel-build.js
const { execSync } = require('child_process');
require('dotenv').config();

async function build() {
  try {
    // Pre-build validation
    console.log('🔍 Validating build environment...');
    execSync('node scripts/vercel-pre-build-validation.js', { stdio: 'inherit' });
    
    // Environment setup
    console.log('🌍 Loading environment variables...');
    execSync('node scripts/validate-vercel-environment.js', { stdio: 'inherit' });
    
    // Build process
    console.log('🏗️ Building application...');
    execSync('npm run build:remix', { stdio: 'inherit' });
    
    // Post-build validation
    console.log('✅ Validating build output...');
    execSync('node scripts/validate-build-output.js', { stdio: 'inherit' });
    
    console.log('🎉 Build completed successfully!');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    
    // Try fallback build
    console.log('🔄 Attempting fallback build...');
    execSync('node scripts/vercel-build-fallback.js', { stdio: 'inherit' });
  }
}

build();
```

### Monitoring and Alerting

Set up monitoring for deployment health:

1. **Health Check Endpoint**:
   ```javascript
   // app/routes/api.health.ts
   export async function loader() {
     // Check database connectivity
     // Check external services
     // Return health status
   }
   ```

2. **Vercel Analytics**:
   ```bash
   npm install @vercel/analytics
   ```

3. **Error Tracking**:
   ```bash
   npm install @sentry/remix
   ```

## Deployment Checklist

### Pre-Deployment
- [ ] Local build passes all tests
- [ ] Environment variables documented and ready
- [ ] Database migrations completed
- [ ] External services configured (S3, email, etc.)
- [ ] Build scripts validated for Vercel compatibility

### During Deployment
- [ ] Monitor build logs for errors
- [ ] Verify environment variable loading
- [ ] Check dependency installation
- [ ] Validate build output generation

### Post-Deployment
- [ ] Application loads successfully
- [ ] Database connectivity verified
- [ ] File uploads working
- [ ] Email functionality tested
- [ ] Authentication flows validated
- [ ] Performance metrics acceptable

### Rollback Plan
- [ ] Previous deployment version identified
- [ ] Rollback procedure documented
- [ ] Database rollback plan (if needed)
- [ ] Communication plan for users

## Support and Resources

### Documentation Links
- [Vercel Deployment Documentation](https://vercel.com/docs/concepts/deployments/overview)
- [Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Build Configuration](https://vercel.com/docs/concepts/projects/project-configuration)

### Internal Resources
- [Environment Variables Quick Reference](./VERCEL_ENV_QUICK_REFERENCE.md)
- [Environment Setup Guide](./VERCEL_DEPLOYMENT_ENVIRONMENT_SETUP.md)
- Build validation scripts in `/scripts` directory

### Getting Help
1. Check Vercel function logs in dashboard
2. Review build logs for specific error messages
3. Test locally with production environment variables
4. Consult troubleshooting section above
5. Contact team with specific error details

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintained by**: Development Team