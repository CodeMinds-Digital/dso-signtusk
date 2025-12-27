# Vercel GitHub Actions Setup Guide

## Required GitHub Secrets

You need to add these secrets to your GitHub repository for automated Vercel deployment:

### 1. Get Vercel Token

1. Go to [Vercel Dashboard](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it: `GitHub Actions Token`
4. Set scope: `Full Account`
5. Copy the generated token

### 2. Get Vercel Project IDs

Run these commands in your terminal (after installing Vercel CLI):

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Navigate to your remix app directory
cd apps/remix

# Link to your Vercel project (or create new one)
vercel link

# Get your project details
vercel project ls
```

This will create a `.vercel/project.json` file with your project details.

### 3. Add Secrets to GitHub

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these **Repository secrets**:

#### VERCEL_TOKEN
```
vercel_token_here_from_step_1
```

#### VERCEL_ORG_ID
```bash
# Get this from .vercel/project.json after running vercel link
# Or from your Vercel dashboard URL: vercel.com/[ORG_ID]/[PROJECT_NAME]
```

#### VERCEL_PROJECT_ID
```bash
# Get this from .vercel/project.json after running vercel link
# Or from your Vercel project settings
```

## Alternative: Manual Deployment (No GitHub Actions)

If you prefer manual deployment, you can skip the GitHub Actions setup and deploy directly:

### Option 1: Deploy via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/new)
2. Import your GitHub repository
3. Set root directory to `apps/remix`
4. Configure build settings as shown in `VERCEL_DEPLOYMENT.md`

### Option 2: Deploy via CLI
```bash
# Navigate to remix app
cd apps/remix

# Deploy to Vercel
vercel --prod
```

## Troubleshooting

### Error: "No existing credentials found"
- Make sure you've added `VERCEL_TOKEN` to GitHub secrets
- Verify the token has correct permissions
- Check that `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` are correct

### Error: "Project not found"
- Run `vercel link` in `apps/remix` directory
- Make sure `VERCEL_PROJECT_ID` matches your actual project
- Verify you have access to the Vercel project

### Build Failures
- Check that all environment variables are set in Vercel dashboard
- Verify the build command in `vercel.json` is correct
- Check Vercel function logs for runtime errors

## Security Notes

- Never commit `.vercel/` directory to git (add to `.gitignore`)
- Keep your Vercel token secure and rotate it regularly
- Use environment-specific tokens for different stages (dev/staging/prod)

## Next Steps

1. Add the three secrets to GitHub
2. Push a change to trigger the workflow
3. Monitor the deployment in GitHub Actions tab
4. Check your deployed app on Vercel

The workflow will automatically:
- Deploy to preview URL for pull requests
- Deploy to production for pushes to main branch
- Only trigger when files in `apps/remix/` or `packages/` change