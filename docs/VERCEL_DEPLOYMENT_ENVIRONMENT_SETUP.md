# Vercel Environment Variables Setup Guide

This comprehensive guide helps you configure all necessary environment variables for deploying SignTusk to Vercel.

## Quick Start Checklist

### ✅ Minimum Required Variables for Basic Deployment

These variables are **absolutely required** for the application to start:

```bash
# Core Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Database (Required)
DATABASE_URL=postgresql://user:password@host:port/database
NEXT_PRIVATE_DATABASE_URL=postgresql://user:password@host:port/database
POSTGRES_PRISMA_URL=postgresql://user:password@host:port/database

# Authentication (Required)
NEXTAUTH_SECRET=your-32-character-secret-key-here
JWT_SECRET=your-jwt-secret-key-here

# Encryption (Required)
ENCRYPTION_KEY=your-32-character-encryption-key
NEXT_PRIVATE_ENCRYPTION_KEY=your-32-character-encryption-key

# File Storage (Required)
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_BUCKET=your-s3-bucket-name
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# Email Service (Required)
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=your-resend-api-key
```

### 🔧 Vercel Dashboard Configuration Steps

1. **Access Environment Variables**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Select your project
   - Navigate to **Settings** → **Environment Variables**

2. **Add Variables**:
   - Click **Add New**
   - Enter **Name** (e.g., `DATABASE_URL`)
   - Enter **Value** (your actual value)
   - Select **Environments**: Check all three (Production, Preview, Development)
   - Click **Save**

3. **Bulk Import** (Recommended):
   - Create a `.env.vercel` file with your variables
   - Use Vercel CLI: `vercel env pull .env.vercel`
   - Or copy-paste from the template below

## Environment Variable Templates

### 🗄️ Database Configuration

```bash
# PostgreSQL Database (Neon, Supabase, or other)
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
NEXT_PRIVATE_DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
POSTGRES_PRISMA_URL="postgresql://username:password@host:port/database?sslmode=require"

# Optional: Direct connection (for migrations)
NEXT_PRIVATE_DIRECT_DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

**Setup Instructions**:
- **Neon**: Copy connection string from Neon dashboard
- **Supabase**: Use the connection pooler URL
- **Railway**: Copy PostgreSQL connection URL
- **PlanetScale**: Use the Prisma connection string

### 🔐 Authentication & Security

```bash
# Authentication Secrets (Generate secure random strings)
NEXTAUTH_SECRET="your-32-character-nextauth-secret-here"
JWT_SECRET="your-jwt-secret-for-token-signing-here"

# Encryption Keys (Must be exactly 32 characters)
ENCRYPTION_KEY="your-32-character-encryption-key"
NEXT_PRIVATE_ENCRYPTION_KEY="your-32-character-encryption-key"

# Optional: Secondary encryption key for rotation
NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY="your-secondary-32-char-key"
```

**Generate Secure Keys**:
```bash
# Generate 32-character keys
openssl rand -base64 32
# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 📁 File Storage (AWS S3)

```bash
# S3 Configuration
NEXT_PUBLIC_UPLOAD_TRANSPORT="s3"
NEXT_PRIVATE_UPLOAD_BUCKET="your-s3-bucket-name"
AWS_ACCESS_KEY_ID="AKIA..."
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"

# Optional: Custom S3 endpoint
AWS_S3_ENDPOINT="https://s3.amazonaws.com"
```

**AWS S3 Setup**:
1. Create S3 bucket in AWS Console
2. Create IAM user with S3 permissions
3. Generate access keys for the IAM user
4. Configure bucket CORS for web uploads

### 📧 Email Service

```bash
# Resend (Recommended)
NEXT_PRIVATE_SMTP_TRANSPORT="resend"
NEXT_PRIVATE_RESEND_API_KEY="re_..."

# Alternative: SMTP
NEXT_PRIVATE_SMTP_TRANSPORT="smtp"
NEXT_PRIVATE_SMTP_HOST="smtp.gmail.com"
NEXT_PRIVATE_SMTP_PORT="587"
NEXT_PRIVATE_SMTP_USERNAME="your-email@gmail.com"
NEXT_PRIVATE_SMTP_PASSWORD="your-app-password"
NEXT_PRIVATE_SMTP_FROM_ADDRESS="noreply@yourdomain.com"
```

### 🌐 Application URLs

```bash
# Public URLs (Update with your actual domains)
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"
NEXT_PUBLIC_WEBAPP_URL="https://your-app.vercel.app"

# Optional: External sites
NEXT_PUBLIC_MARKETING_URL="https://your-marketing-site.com"
NEXT_PUBLIC_DOCS_URL="https://docs.your-app.com"
```

### 💳 Payment Processing (Optional)

```bash
# Stripe Integration
NEXT_PRIVATE_STRIPE_API_KEY="sk_live_..."
NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
```

### 📊 Analytics (Optional)

```bash
# PostHog Analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com"
```

### ⚡ Performance & Caching (Optional)

```bash
# Redis for caching and sessions
REDIS_URL="redis://username:password@host:port"

# Rate limiting
RATE_LIMIT_ENABLED="true"
```

## Vercel-Specific Configuration

### Environment Scoping

Configure variables for appropriate environments:

- **Production**: Live application variables
- **Preview**: Staging/preview deployment variables  
- **Development**: Local development overrides

### Build-Time vs Runtime Variables

- **Build-time**: Available during `npm run build`
  - `NODE_ENV`
  - `SKIP_ENV_VALIDATION`
  
- **Runtime**: Available when the application runs
  - Database URLs
  - API keys
  - Authentication secrets

### Vercel CLI Commands

```bash
# Pull environment variables to local file
vercel env pull .env.local

# Add environment variable via CLI
vercel env add VARIABLE_NAME

# List all environment variables
vercel env ls
```

## Troubleshooting

### Common Issues

1. **Build Fails with Missing Environment Variables**:
   - Check that all required variables are set in Vercel dashboard
   - Verify variable names match exactly (case-sensitive)
   - Ensure variables are enabled for the correct environment

2. **Database Connection Errors**:
   - Verify database URL format and credentials
   - Check if database allows connections from Vercel IPs
   - Ensure SSL mode is configured correctly

3. **File Upload Errors**:
   - Verify AWS credentials and bucket permissions
   - Check bucket CORS configuration
   - Ensure bucket region matches AWS_REGION variable

4. **Email Delivery Issues**:
   - Verify email service API keys
   - Check SMTP credentials and server settings
   - Ensure sender email is verified with email service

### Validation Script

Run this script to validate your environment configuration:

```bash
# In your project root
node scripts/validate-environment.js
```

## Security Best Practices

1. **Never commit secrets to Git**:
   - Use `.env.local` for local development
   - Add `.env*` to `.gitignore`

2. **Use strong, unique secrets**:
   - Generate random 32-character keys
   - Use different keys for different environments

3. **Rotate secrets regularly**:
   - Update API keys periodically
   - Use secondary encryption keys for rotation

4. **Limit access**:
   - Use IAM roles with minimal required permissions
   - Regularly audit access to secrets

## Support

If you encounter issues:

1. Check the [Vercel documentation](https://vercel.com/docs/concepts/projects/environment-variables)
2. Review application logs in Vercel dashboard
3. Test locally with the same environment variables
4. Contact support with specific error messages

---

**Last Updated**: January 2025
**Version**: 1.0.0