# Vercel Environment Variables - Quick Reference

## 🚀 Essential Variables (Copy & Configure)

```bash
# === REQUIRED FOR DEPLOYMENT ===

# Core
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Database
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
NEXT_PRIVATE_DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
POSTGRES_PRISMA_URL=postgresql://user:pass@host:port/db?sslmode=require

# Security
NEXTAUTH_SECRET=your-32-char-secret
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-32-char-encryption-key
NEXT_PRIVATE_ENCRYPTION_KEY=your-32-char-encryption-key

# File Storage
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1

# Email
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=re_...
```

## 🔧 Vercel Dashboard Setup

1. **Go to**: [vercel.com/dashboard](https://vercel.com/dashboard) → Your Project → Settings → Environment Variables
2. **Add each variable**:
   - Name: `DATABASE_URL`
   - Value: `your-actual-value`
   - Environments: ✅ Production ✅ Preview ✅ Development
3. **Click Save** for each variable

## 🛠️ Quick Commands

```bash
# Generate secure keys
openssl rand -base64 32

# Pull Vercel env to local
vercel env pull .env.local

# Add variable via CLI
vercel env add DATABASE_URL

# List all variables
vercel env ls
```

## ⚠️ Common Gotchas

- **Case sensitive**: `DATABASE_URL` ≠ `database_url`
- **32-char keys**: Encryption keys must be exactly 32 characters
- **SSL required**: Add `?sslmode=require` to PostgreSQL URLs
- **All environments**: Enable variables for Production, Preview, AND Development

## 🔍 Validation

```bash
# Test your setup
node scripts/validate-environment.js
```

## 📞 Need Help?

- Missing variable? Check the [full guide](./VERCEL_DEPLOYMENT_ENVIRONMENT_SETUP.md)
- Build failing? Check Vercel function logs
- Database issues? Verify connection string format