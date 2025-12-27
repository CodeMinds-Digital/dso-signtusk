# Vercel Deployment Guide for Remix App

## Quick Setup

### 1. Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Select the `apps/remix` folder as the root directory

### 2. Configure Project Settings

**Framework Preset:** Other
**Root Directory:** `apps/remix`
**Build Command:** `cd ../.. && npm ci && npm run build --workspace=@signtusk/remix`
**Output Directory:** `build/client`
**Install Command:** `cd ../.. && npm ci`

### 3. Environment Variables

Add these environment variables in your Vercel project settings:

#### Essential Variables
```bash
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_SECRET=SSZX04SZAWFwPxFh+7udnpeiR7ZWl2zsOo8ZIidBdSU=
JWT_SECRET=fP9qFYma2xypYKzdB/2GeZ/oSVl6jkLBtSTBCpEN8k0=
NEXT_PUBLIC_WEBAPP_URL=https://your-project.vercel.app
```

#### File Upload (if using S3)
```bash
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_BUCKET=your-s3-bucket
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
```

#### Email (if using Resend)
```bash
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=your-resend-key
```

#### Billing (if using Stripe)
```bash
NEXT_PRIVATE_STRIPE_API_KEY=sk_live_your_stripe_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key
NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 4. Deploy

Click "Deploy" and Vercel will:
1. Install dependencies from the monorepo root
2. Build your Remix app
3. Deploy static assets to CDN
4. Deploy server functions for SSR

## Vercel Configuration Files

The following files have been created for your deployment:

- `vercel.json` - Vercel project configuration
- `api/index.js` - Serverless function entry point
- `.env.vercel.example` - Environment variables template
- `VERCEL_DEPLOYMENT.md` - This deployment guide

## Monorepo Considerations

Since you're deploying from a monorepo:

1. **Root Directory:** Set to `apps/remix` in Vercel settings
2. **Build Command:** Must navigate to repo root for workspace dependencies
3. **Install Command:** Runs `npm ci` from repo root to install all workspace dependencies

## Custom Domains

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Update `NEXT_PUBLIC_WEBAPP_URL` environment variable

## Troubleshooting

### Build Failures
- Check that all workspace dependencies are properly installed
- Verify environment variables are set correctly
- Check build logs for specific error messages

### Runtime Errors
- Ensure database connection string is correct
- Verify all required environment variables are set
- Check function logs in Vercel dashboard

### Performance Issues
- Enable Vercel Analytics for performance monitoring
- Use Vercel's built-in caching for static assets
- Consider using Vercel's Edge Functions for better performance

## Monitoring

Enable these Vercel features for better monitoring:

1. **Analytics:** Track Core Web Vitals and user experience
2. **Speed Insights:** Monitor page load performance
3. **Function Logs:** Debug serverless function issues
4. **Real-time Logs:** Monitor application behavior

## Security

1. Use Vercel's environment variables (encrypted at rest)
2. Enable HTTPS (automatic with Vercel)
3. Configure proper CORS headers if needed
4. Use Vercel's built-in DDoS protection