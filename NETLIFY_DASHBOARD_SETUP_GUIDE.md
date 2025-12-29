# Netlify Dashboard Setup Guide

## Overview
While we've resolved all local build issues, the Netlify deployment requires specific dashboard configurations to work properly. This guide covers all the Netlify-side settings needed.

## 🚨 Critical Netlify Dashboard Settings

### 1. Site Configuration

#### Build Settings
Navigate to: **Site Settings → Build & Deploy → Build Settings**

```toml
# Build command
cd ../.. && NETLIFY_APP_NAME=remix node scripts/netlify-build.js

# Publish directory
build/client

# Functions directory  
build/server

# Base directory
apps/remix
```

#### Config File Path
- **Leave empty** for auto-detection, OR
- Set to: `apps/remix/netlify.toml`
- **❌ NEVER set to**: `apps/remix/netlify.to}` (this was causing the original error)

### 2. Environment Variables Setup

Navigate to: **Site Settings → Environment Variables**

#### Required Core Variables
```bash
# Build Configuration
NODE_ENV=production
NODE_VERSION=22
NETLIFY_APP_NAME=remix
SKIP_PATCHES=true

# Database (REQUIRED - Replace with your values)
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
NEXT_PRIVATE_DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
NEXT_PRIVATE_DIRECT_DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# Authentication (REQUIRED - Generate secure values)
NEXTAUTH_SECRET=your-32-character-secret-here
JWT_SECRET=your-32-character-jwt-secret-here
NEXT_PRIVATE_ENCRYPTION_KEY=your-32-character-encryption-key

# Application URLs (REQUIRED - Replace with your domains)
NEXT_PUBLIC_WEBAPP_URL=https://your-app-domain.com
NEXT_PUBLIC_MARKETING_URL=https://your-marketing-domain.com
NEXT_PUBLIC_DOCS_URL=https://your-docs-domain.com

# File Storage (REQUIRED - Configure your S3)
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_BUCKET=your-s3-bucket-name
NEXT_PRIVATE_UPLOAD_REGION=us-east-1
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=your-aws-access-key
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=your-aws-secret-key

# Email Service (REQUIRED - Choose one)
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=re_your_resend_api_key
NEXT_PRIVATE_SMTP_FROM_ADDRESS=noreply@yourdomain.com

# Document Signing (REQUIRED)
NEXT_PRIVATE_SIGNING_TRANSPORT=local
NEXT_PRIVATE_SIGNING_PASSPHRASE=your-signing-passphrase
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=your-base64-p12-certificate
```

#### Variable Scoping
Set appropriate scopes for each variable:
- **Production**: Live database, real API keys, production domains
- **Deploy Preview**: Staging database, test API keys, preview domains  
- **Branch Deploy**: Development database, test credentials

### 3. Build Environment Settings

Navigate to: **Site Settings → Build & Deploy → Environment**

```bash
# Node.js Configuration
NODE_VERSION=22
NPM_VERSION=10.7.0
NPM_FLAGS=--legacy-peer-deps --force

# Build Optimization
NODE_OPTIONS=--max-old-space-size=4096
TURBO_TELEMETRY_DISABLED=1
NETLIFY_CACHE_ENABLED=true

# Skip problematic packages
SKIP_PATCHES=true
INSTALL_PLAYWRIGHT=false
```

### 4. Functions Configuration

Navigate to: **Site Settings → Functions**

```bash
# Functions directory: build/server
# Node.js version: 22.x
# Timeout: 30 seconds (or higher for document processing)
```

### 5. Domain & HTTPS Settings

Navigate to: **Site Settings → Domain Management**

#### Custom Domain Setup
1. Add your custom domain (e.g., `app.yourdomain.com`)
2. Configure DNS records:
   ```
   Type: CNAME
   Name: app
   Value: your-site-name.netlify.app
   ```
3. Enable HTTPS (automatic with Let's Encrypt)
4. Force HTTPS redirect

#### Domain Aliases
Configure redirects for:
- `www.app.yourdomain.com` → `app.yourdomain.com`
- Old domain patterns if migrating

### 6. Deploy Settings

Navigate to: **Site Settings → Build & Deploy → Deploy Contexts**

#### Production Branch
- **Branch**: `main` or `production`
- **Build command**: Use site default
- **Environment variables**: Production scope

#### Deploy Previews
- **Enable**: ✅ Deploy previews from pull requests
- **Environment variables**: Deploy preview scope
- **Build command**: Use site default

#### Branch Deploys
- **Enable**: ✅ Deploy only production branch
- **Environment variables**: Branch deploy scope

### 7. Security Headers (Already configured in netlify.toml)

The security headers are configured in the `netlify.toml` file, but verify they're active:

Navigate to: **Site Settings → Build & Deploy → Post Processing**
- **Asset optimization**: Enable
- **Form detection**: Enable if using forms
- **Snippet injection**: Disable unless needed

## 🔧 Troubleshooting Common Issues

### Build Failures

1. **Check Build Logs**
   - Go to: **Deploys** tab
   - Click on failed deploy
   - Review build log for specific errors

2. **Clear Cache**
   - Go to: **Deploys** tab  
   - Click: **Trigger Deploy → Clear cache and deploy**

3. **Environment Variable Issues**
   - Verify all required variables are set
   - Check variable names (case-sensitive)
   - Ensure no trailing spaces in values

### Function Deployment Issues

1. **Function Size Limits**
   - Individual function: 50MB
   - Total functions: 200MB
   - If exceeded, optimize bundle size

2. **Function Timeout**
   - Default: 10 seconds
   - Maximum: 30 seconds (Pro plan)
   - Increase if processing large documents

### Domain & SSL Issues

1. **DNS Propagation**
   - Can take up to 48 hours
   - Use DNS checker tools to verify

2. **SSL Certificate Issues**
   - Netlify auto-generates Let's Encrypt certificates
   - May take a few minutes after domain setup

## 📋 Pre-Deployment Checklist

### Before First Deploy
- [ ] All environment variables configured
- [ ] Database accessible from Netlify
- [ ] S3 bucket created and configured
- [ ] Email service configured and tested
- [ ] Domain DNS records configured
- [ ] SSL certificates ready

### Deploy Verification
- [ ] Build completes successfully
- [ ] Functions deploy without errors
- [ ] Application loads correctly
- [ ] Database connections work
- [ ] File uploads functional
- [ ] Email sending works
- [ ] Authentication flows work

### Post-Deploy Testing
- [ ] All application features functional
- [ ] Performance acceptable
- [ ] Security headers active
- [ ] Redirects working correctly
- [ ] Error pages display properly

## 🔐 Security Considerations

### Environment Variables
- Use Netlify's "Sensitive" flag for secrets
- Never commit secrets to git
- Rotate secrets regularly
- Use different values per environment

### Access Control
- Limit team access to production site
- Use deploy keys for automated deployments
- Enable two-factor authentication

### Monitoring
- Set up uptime monitoring
- Configure error tracking
- Monitor build performance
- Track deployment success rates

## 📞 Support Resources

### Netlify Support
- Documentation: https://docs.netlify.com
- Community: https://community.netlify.com
- Support: Available through dashboard

### Common Support Scenarios
1. **Build timeout issues**: Contact support to increase limits
2. **Function size limits**: Request limit increases
3. **Custom domain issues**: DNS configuration help
4. **SSL certificate problems**: Certificate renewal assistance

## 🚀 Next Steps After Setup

1. **Test Deploy Preview**: Create a pull request to test preview deployments
2. **Monitor Performance**: Set up monitoring and alerting
3. **Optimize Build**: Review build times and optimize if needed
4. **Security Audit**: Review all security settings
5. **Backup Strategy**: Ensure database and file backups are configured

---

**Note**: This guide assumes you're using the Remix application. For other applications (marketing, docs), use their respective environment variable templates and configurations.