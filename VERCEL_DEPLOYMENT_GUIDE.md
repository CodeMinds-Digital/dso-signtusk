# Vercel Deployment Configuration Guide

This guide explains how to configure environment variables in Vercel to resolve the build failures.

## Required Environment Variables

### Build-Time Variables (NEXT_PUBLIC_*)
These variables are embedded in the client-side bundle and must be set in Vercel:

```bash
NODE_ENV=production
NEXT_PUBLIC_WEBAPP_URL=https://your-app.vercel.app
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

### Runtime Variables (NEXT_PRIVATE_*)
These variables are used server-side and must be kept secure:

```bash
NEXTAUTH_SECRET=your-32-character-secret-key-here
NEXT_PRIVATE_ENCRYPTION_KEY=your-32-character-encryption-key
NEXT_PRIVATE_DATABASE_URL=postgresql://username:password@host:port/database
```

### Optional but Recommended Variables

```bash
REDIS_URL=redis://your-redis-instance
NEXT_PRIVATE_SMTP_HOST=your-smtp-server.com
NEXT_PRIVATE_SIGNING_TRANSPORT=your-signing-service-url
```

## How to Configure in Vercel

### Method 1: Vercel Dashboard
1. Go to your project in the Vercel dashboard
2. Navigate to Settings → Environment Variables
3. Add each variable with the appropriate value
4. Set the environment scope (Production, Preview, Development)

### Method 2: Vercel CLI
```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Set environment variables
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add NEXT_PRIVATE_DATABASE_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXT_PRIVATE_ENCRYPTION_KEY production

# List all environment variables
vercel env ls
```

### Method 3: Environment Variable File
Create a `.env.production` file (DO NOT commit this to git):

```bash
# Build-time variables
NODE_ENV=production
NEXT_PUBLIC_WEBAPP_URL=https://dso-signtusk.vercel.app
NEXT_PUBLIC_APP_URL=https://dso-signtusk.vercel.app

# Runtime variables
NEXTAUTH_SECRET=your-secure-32-character-secret-here
NEXT_PRIVATE_ENCRYPTION_KEY=your-secure-32-character-key-here
NEXT_PRIVATE_DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional variables
REDIS_URL=redis://your-redis-url
NEXT_PRIVATE_SMTP_HOST=smtp.your-provider.com
NEXT_PRIVATE_SIGNING_TRANSPORT=https://your-signing-service.com
```

## Security Best Practices

### 1. Generate Secure Keys
```bash
# Generate a secure 32-character key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

### 2. Environment Separation
- Use different values for Production, Preview, and Development
- Never use localhost URLs in production
- Use different database instances for each environment

### 3. Database Configuration
- Use a production PostgreSQL database (not local)
- Consider using Vercel's database integrations or external providers like:
  - Neon (PostgreSQL)
  - PlanetScale (MySQL)
  - Supabase (PostgreSQL)

## Troubleshooting

### Build Still Failing?
1. Check that all required variables are set in Vercel
2. Verify the variable names match exactly (case-sensitive)
3. Ensure URLs are valid and accessible
4. Check database connectivity

### Environment Variable Not Loading?
1. Clear Vercel build cache: `vercel --force`
2. Redeploy the application
3. Check the deployment logs for environment loading messages

### Database Connection Issues?
1. Verify the database URL format: `postgresql://user:pass@host:port/db`
2. Ensure the database server allows connections from Vercel IPs
3. Check if the database requires SSL: add `?sslmode=require` to the URL

## Example Vercel Configuration

Here's an example of what your Vercel environment variables should look like:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| NODE_ENV | production | Production |
| NEXT_PUBLIC_APP_URL | https://dso-signtusk.vercel.app | Production |
| NEXT_PUBLIC_WEBAPP_URL | https://dso-signtusk.vercel.app | Production |
| NEXTAUTH_SECRET | [32-char secret] | Production |
| NEXT_PRIVATE_ENCRYPTION_KEY | [32-char key] | Production |
| NEXT_PRIVATE_DATABASE_URL | postgresql://... | Production |

## Next Steps

1. Configure all required environment variables in Vercel
2. Test the deployment by triggering a new build
3. Monitor the build logs to ensure all variables are loaded correctly
4. Verify the application functionality after successful deployment

## Support

If you continue to experience issues:
1. Check the Vercel deployment logs
2. Verify all environment variables are correctly set
3. Test the database connection separately
4. Contact your database provider if connection issues persist