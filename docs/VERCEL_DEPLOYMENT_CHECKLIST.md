# Vercel Deployment Checklist

## Quick Reference Checklist

Use this checklist to ensure successful Vercel deployments. Check off each item as you complete it.

## Phase 1: Pre-Deployment Preparation

### 🗄️ Database Setup
- [ ] Production PostgreSQL database created
- [ ] Database connection string obtained
- [ ] Database allows connections from Vercel IPs
- [ ] SSL/TLS enabled (`?sslmode=require` in connection string)
- [ ] Database migrations applied
- [ ] Database user has appropriate permissions

### 🔐 Security & Authentication
- [ ] NEXTAUTH_SECRET generated (32+ characters)
- [ ] JWT_SECRET generated (strong random string)
- [ ] ENCRYPTION_KEY generated (exactly 32 characters)
- [ ] All secrets are unique and secure
- [ ] Secrets stored securely (not in code)

### 📁 File Storage (AWS S3)
- [ ] S3 bucket created
- [ ] IAM user created with S3 permissions
- [ ] AWS access keys generated
- [ ] S3 bucket CORS configured for your domain
- [ ] Bucket region matches AWS_REGION variable

### 📧 Email Service
- [ ] Email service provider chosen (Resend recommended)
- [ ] API key obtained
- [ ] Sender domain verified (if required)
- [ ] Email templates configured

### 🔧 Build Environment
- [ ] Local build passes: `npm run build`
- [ ] No CLI dependencies (dotenv, etc.)
- [ ] All dependencies in package.json (not devDependencies)
- [ ] Build scripts use programmatic environment loading
- [ ] Pre-build validation script passes

## Phase 2: Vercel Project Configuration

### 📋 Project Setup
- [ ] Vercel project created
- [ ] Git repository connected
- [ ] Framework preset: "Other" (for monorepo)
- [ ] Root directory: `apps/remix`
- [ ] Build command: `npm run build`
- [ ] Output directory: `apps/remix/build`
- [ ] Install command: `npm install`
- [ ] Node.js version: 18.x or latest LTS

### 🌍 Environment Variables Configuration

#### Required Variables
- [ ] `NODE_ENV=production`
- [ ] `NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`
- [ ] `DATABASE_URL=postgresql://...`
- [ ] `NEXT_PRIVATE_DATABASE_URL=postgresql://...`
- [ ] `POSTGRES_PRISMA_URL=postgresql://...`
- [ ] `NEXTAUTH_SECRET=your-32-char-secret`
- [ ] `JWT_SECRET=your-jwt-secret`
- [ ] `ENCRYPTION_KEY=your-32-char-key`
- [ ] `NEXT_PRIVATE_ENCRYPTION_KEY=your-32-char-key`
- [ ] `AWS_ACCESS_KEY_ID=AKIA...`
- [ ] `AWS_SECRET_ACCESS_KEY=your-secret`
- [ ] `AWS_REGION=us-east-1`
- [ ] `NEXT_PRIVATE_UPLOAD_BUCKET=your-bucket`
- [ ] `NEXT_PUBLIC_UPLOAD_TRANSPORT=s3`
- [ ] `NEXT_PRIVATE_SMTP_TRANSPORT=resend`
- [ ] `NEXT_PRIVATE_RESEND_API_KEY=re_...`

#### Optional Variables
- [ ] `REDIS_URL=redis://...` (for caching)
- [ ] `NEXT_PRIVATE_STRIPE_API_KEY=sk_...` (for payments)
- [ ] `NEXT_PUBLIC_POSTHOG_KEY=phc_...` (for analytics)
- [ ] `RATE_LIMIT_ENABLED=true`

#### Environment Scoping
- [ ] All variables enabled for Production
- [ ] Preview environment variables configured
- [ ] Development environment variables configured

## Phase 3: Deployment Execution

### 🚀 Initial Deployment
- [ ] Deployment triggered (via CLI or Git push)
- [ ] Build logs monitored in Vercel dashboard
- [ ] No dependency installation errors
- [ ] Environment variables loaded successfully
- [ ] Build completed without errors
- [ ] Deployment URL accessible

### ✅ Post-Deployment Validation

#### Application Health
- [ ] Application loads without errors
- [ ] Health check endpoint responds: `/api/health`
- [ ] No JavaScript console errors
- [ ] No network request failures

#### Core Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Document upload works
- [ ] Document signing works
- [ ] Email notifications sent
- [ ] File downloads work

#### Database Connectivity
- [ ] Database queries execute successfully
- [ ] User data persists correctly
- [ ] No connection timeout errors

#### External Services
- [ ] File uploads to S3 work
- [ ] Email sending works
- [ ] Payment processing works (if enabled)
- [ ] Analytics tracking works (if enabled)

#### Performance
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] Static assets load quickly
- [ ] No performance warnings in console

## Phase 4: Monitoring & Maintenance

### 📊 Monitoring Setup
- [ ] Health check endpoint configured
- [ ] Uptime monitoring enabled
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring active
- [ ] Log aggregation configured

### 🚨 Alerting Configuration
- [ ] Error rate alerts configured
- [ ] Performance degradation alerts
- [ ] Uptime alerts
- [ ] Database connection alerts
- [ ] Storage quota alerts

### 🔄 Backup & Recovery
- [ ] Database backup strategy implemented
- [ ] File storage backup configured
- [ ] Rollback procedure documented
- [ ] Recovery testing completed

## Troubleshooting Quick Fixes

### Build Failures
- [ ] **"dotenv: command not found"**
  - Replace CLI usage with programmatic loading
  - Update build scripts to use `require('dotenv').config()`

- [ ] **"Module not found"**
  - Move package from devDependencies to dependencies
  - Run `npm install --save package-name`

- [ ] **Environment variable errors**
  - Verify all variables set in Vercel dashboard
  - Check variable names match exactly (case-sensitive)
  - Ensure variables enabled for correct environment

### Runtime Errors
- [ ] **Database connection failures**
  - Verify connection string format
  - Add `?sslmode=require` for PostgreSQL
  - Check database allows Vercel IP connections

- [ ] **File upload errors**
  - Verify AWS credentials
  - Check S3 bucket CORS configuration
  - Ensure bucket permissions are correct

- [ ] **Email delivery issues**
  - Verify email service API key
  - Check sender domain verification
  - Test email service connectivity

## Validation Commands

Run these commands to validate your setup:

```bash
# Validate environment variables
node scripts/validate-vercel-environment.js

# Test build locally
NODE_ENV=production npm run build

# Validate build output
node scripts/validate-build-output.js

# Test database connection
node -e "const { PrismaClient } = require('@prisma/client'); new PrismaClient().\$connect().then(() => console.log('DB OK')).catch(console.error);"

# Test health endpoint
curl -I https://your-app.vercel.app/api/health
```

## Emergency Rollback

If deployment fails or causes issues:

1. **Immediate Rollback**:
   - Go to Vercel dashboard → Deployments
   - Find previous working deployment
   - Click "Promote to Production"

2. **Investigate Issues**:
   - Check Vercel function logs
   - Review build logs for errors
   - Verify environment variables
   - Test locally with production config

3. **Fix and Redeploy**:
   - Fix identified issues
   - Test locally first
   - Deploy to preview environment
   - Validate preview deployment
   - Promote to production

## Support Resources

- **Documentation**: [Vercel Deployment Process Guide](./VERCEL_DEPLOYMENT_PROCESS_GUIDE.md)
- **Configuration**: [Vercel Configuration Templates](./VERCEL_CONFIGURATION_TEMPLATES.md)
- **Environment Setup**: [Vercel Environment Setup Guide](./VERCEL_DEPLOYMENT_ENVIRONMENT_SETUP.md)
- **Quick Reference**: [Vercel Environment Variables Quick Reference](./VERCEL_ENV_QUICK_REFERENCE.md)

---

**Deployment Date**: ___________  
**Deployed By**: ___________  
**Version**: ___________  
**Notes**: ___________

---

**Last Updated**: January 2025  
**Version**: 1.0.0