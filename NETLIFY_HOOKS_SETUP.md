# Netlify Deploy Hooks and Webhooks Setup Guide

This guide explains how to configure Netlify deploy hooks and webhooks for the multi-site deployment automation.

## Overview

The deployment automation system uses:
- **Deploy Hooks**: URLs that trigger builds when called (used by GitHub Actions)
- **Webhooks**: HTTP endpoints that Netlify calls when events occur (for notifications)
- **Rollback Scripts**: Tools for managing deployment rollbacks

## Prerequisites

1. Netlify account with appropriate permissions
2. Netlify Personal Access Token
3. Site IDs for all applications (marketing, remix, docs)
4. Optional: Slack/Discord webhook URLs for notifications

## Setup Steps

### 1. Get Netlify Access Token

1. Go to [Netlify User Settings](https://app.netlify.com/user/applications)
2. Click "New access token"
3. Give it a descriptive name (e.g., "Multi-site Deploy Automation")
4. Copy the token and store it securely

### 2. Get Site IDs

For each of your Netlify sites:
1. Go to Site Settings → General
2. Copy the Site ID from the "Site details" section

### 3. Configure Environment Variables

Set these environment variables in your deployment environment:

```bash
# Required
NETLIFY_ACCESS_TOKEN=your_access_token_here

# Site IDs
NETLIFY_MARKETING_SITE_ID=your_marketing_site_id
NETLIFY_REMIX_SITE_ID=your_remix_site_id  
NETLIFY_DOCS_SITE_ID=your_docs_site_id

# Optional: Notification webhooks
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
WEBHOOK_NOTIFICATION_URL=https://your-domain.com/webhook
NETLIFY_WEBHOOK_SECRET=your_webhook_secret
```

### 4. Run the Setup Script

```bash
# Install dependencies if needed
npm install

# Run the setup script
node scripts/netlify-hooks-setup.js
```

This will:
- Create deploy hooks for each site (production and preview)
- Set up webhooks for build notifications
- Generate GitHub Secrets configuration
- Save configuration to `netlify-hooks-config.json`

### 5. Configure GitHub Secrets

Add the generated secrets to your GitHub repository:

1. Go to Repository Settings → Secrets and variables → Actions
2. Add the following secrets (values will be provided by the setup script):

```
NETLIFY_MARKETING_HOOK_PROD=https://api.netlify.com/build_hooks/...
NETLIFY_MARKETING_HOOK_PREVIEW=https://api.netlify.com/build_hooks/...
NETLIFY_REMIX_HOOK_PROD=https://api.netlify.com/build_hooks/...
NETLIFY_REMIX_HOOK_PREVIEW=https://api.netlify.com/build_hooks/...
NETLIFY_DOCS_HOOK_PROD=https://api.netlify.com/build_hooks/...
NETLIFY_DOCS_HOOK_PREVIEW=https://api.netlify.com/build_hooks/...
```

## Deploy Hooks Usage

Deploy hooks are automatically triggered by the GitHub Actions workflow when:
- Code is pushed to `main` branch (production hooks)
- Code is pushed to `develop` branch or PR is created (preview hooks)
- Only when relevant files are changed (path-based detection)

### Manual Trigger

You can manually trigger deployments using curl:

```bash
# Trigger production deployment
curl -X POST -d {} "https://api.netlify.com/build_hooks/YOUR_HOOK_ID"

# Trigger with build title
curl -X POST -d '{"title": "Manual deployment"}' \
  -H "Content-Type: application/json" \
  "https://api.netlify.com/build_hooks/YOUR_HOOK_ID"
```

## Webhooks Configuration

### Webhook Events

The system listens for these Netlify events:
- `deploy-building`: Build started
- `deploy-succeeded`: Build completed successfully  
- `deploy-failed`: Build failed
- `deploy-locked`: Deployment locked
- `deploy-unlocked`: Deployment unlocked

### Webhook Handler

Deploy the webhook handler to receive notifications:

```bash
# Run locally for testing
node scripts/netlify-webhook-handler.js

# Or deploy as serverless function (example for Vercel)
# Place in api/netlify-webhook.js and deploy
```

### Notification Channels

Configure notifications for:
- **Slack**: Team notifications in dedicated channels
- **Discord**: Development team notifications
- **Email**: Critical failure notifications
- **Custom**: HTTP endpoints for integration with other tools

## Rollback Procedures

### Automatic Rollback

The system supports automatic rollback on deployment failures:

```bash
# Rollback to previous successful deployment
node scripts/netlify-rollback.js SITE_ID previous

# Rollback to specific deployment
node scripts/netlify-rollback.js SITE_ID DEPLOY_ID specific

# Interactive rollback with deployment history
node scripts/netlify-rollback.js SITE_ID "" interactive

# List deployment history
node scripts/netlify-rollback.js SITE_ID "" list
```

### Emergency Rollback

For emergency situations:

1. **Via Netlify Dashboard**:
   - Go to Site → Deploys
   - Find the last known good deployment
   - Click "Publish deploy"

2. **Via API Script**:
   ```bash
   # Quick rollback to previous
   NETLIFY_ACCESS_TOKEN=your_token node scripts/netlify-rollback.js SITE_ID
   ```

3. **Via GitHub Actions**:
   - Revert the problematic commit
   - Push to main branch
   - Automated deployment will trigger

## Monitoring and Alerting

### Build Status Monitoring

The webhook handler provides real-time build status updates:
- Build start notifications
- Success/failure notifications with details
- Performance metrics (build duration)
- Error details and logs

### Health Checks

Set up monitoring for:
- Deploy hook availability
- Webhook endpoint health
- Site availability after deployment
- Build queue status

### Alerting Rules

Configure alerts for:
- Build failures (immediate)
- Long build times (> 10 minutes)
- Webhook delivery failures
- Site downtime after deployment

## Troubleshooting

### Common Issues

1. **Deploy Hook Not Triggering**:
   - Check GitHub Secrets are correctly set
   - Verify hook URL is valid
   - Check GitHub Actions logs

2. **Webhook Not Receiving Events**:
   - Verify webhook URL is accessible
   - Check Netlify webhook configuration
   - Validate webhook signature

3. **Build Failures**:
   - Check build logs in Netlify dashboard
   - Verify environment variables
   - Check dependency installation

4. **Rollback Issues**:
   - Verify Netlify access token permissions
   - Check deployment history availability
   - Ensure target deployment is valid

### Debug Commands

```bash
# Test webhook handler locally
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "payload"}'

# Verify deploy hook
curl -X POST -d {} "YOUR_DEPLOY_HOOK_URL"

# Check site status
node -e "
const { NetlifyRollbackManager } = require('./scripts/netlify-rollback.js');
const manager = new NetlifyRollbackManager(process.env.NETLIFY_ACCESS_TOKEN);
manager.getSite('SITE_ID').then(console.log);
"
```

## Security Considerations

1. **Access Tokens**: Store securely, rotate regularly
2. **Webhook Secrets**: Use strong secrets, verify signatures
3. **Deploy Hooks**: Treat as sensitive URLs, don't expose publicly
4. **Environment Variables**: Use secure storage, avoid logging

## Maintenance

### Regular Tasks

- Review deployment logs weekly
- Update access tokens quarterly  
- Test rollback procedures monthly
- Monitor webhook delivery success rates

### Updates

When updating the system:
1. Test changes in staging environment
2. Update webhook handlers before deploy hooks
3. Verify rollback procedures still work
4. Update documentation and runbooks

## Support

For issues with this setup:
1. Check the troubleshooting section above
2. Review Netlify build logs and webhook delivery logs
3. Test individual components (hooks, webhooks, rollbacks)
4. Consult Netlify API documentation for advanced configuration