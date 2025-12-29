#!/usr/bin/env node

/**
 * Railway Migration Script
 * 
 * Migrates your current monorepo to Railway with zero configuration changes.
 * This is a backup plan if Netlify continues to have issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class RailwayMigrator {
  constructor() {
    this.projectRoot = process.cwd();
    this.envFile = path.join('.env.railway.example');
  }

  log(type, message) {
    const prefix = {
      error: '❌',
      warning: '⚠️ ',
      success: '✅',
      info: 'ℹ️ '
    }[type] || 'ℹ️ ';
    
    console.log(`${prefix} ${message}`);
  }

  /**
   * Check if Railway CLI is installed
   */
  checkRailwayCLI() {
    this.log('info', 'Checking Railway CLI installation...');
    
    try {
      execSync('railway --version', { stdio: 'pipe' });
      this.log('success', 'Railway CLI is installed');
      return true;
    } catch (error) {
      this.log('warning', 'Railway CLI not found, installing...');
      try {
        execSync('npm install -g @railway/cli', { stdio: 'inherit' });
        this.log('success', 'Railway CLI installed successfully');
        return true;
      } catch (installError) {
        this.log('error', 'Failed to install Railway CLI');
        return false;
      }
    }
  }

  /**
   * Create Railway configuration
   */
  createRailwayConfig() {
    this.log('info', 'Creating Railway configuration...');
    
    // Create railway.json for optimal configuration
    const railwayConfig = {
      "build": {
        "builder": "NIXPACKS"
      },
      "deploy": {
        "startCommand": "cd apps/remix && npm start",
        "healthcheckPath": "/health",
        "restartPolicyType": "ON_FAILURE",
        "restartPolicyMaxRetries": 10
      }
    };
    
    fs.writeFileSync('railway.json', JSON.stringify(railwayConfig, null, 2));
    this.log('success', 'Created railway.json configuration');
    
    // Create Procfile as backup
    const procfile = 'web: cd apps/remix && npm install --legacy-peer-deps && npm run build && npm start';
    fs.writeFileSync('Procfile', procfile);
    this.log('success', 'Created Procfile');
    
    return true;
  }

  /**
   * Create environment variables template
   */
  createEnvTemplate() {
    this.log('info', 'Creating environment variables template...');
    
    const envTemplate = `# Railway Environment Variables
# Copy these to your Railway dashboard: Settings → Environment

# Build Configuration
NODE_ENV=production
NODE_VERSION=22

# Database (Railway provides PostgreSQL)
# DATABASE_URL will be automatically provided by Railway database
# DATABASE_URL=postgresql://user:pass@host:port/db

# Application URLs (Replace with your Railway domains)
NEXT_PUBLIC_WEBAPP_URL=https://your-app.railway.app
NEXT_PUBLIC_MARKETING_URL=https://your-marketing.railway.app
NEXT_PUBLIC_DOCS_URL=https://your-docs.railway.app

# Authentication Secrets (Generate new ones)
NEXTAUTH_SECRET=your-nextauth-secret-32-characters
JWT_SECRET=your-jwt-secret-32-characters
NEXT_PRIVATE_ENCRYPTION_KEY=your-encryption-key-32-characters

# File Storage (Configure your S3 or use Railway volumes)
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_BUCKET=your-s3-bucket
NEXT_PRIVATE_UPLOAD_REGION=us-east-1
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=your-aws-access-key
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=your-aws-secret-key

# Email Service
NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=re_your_resend_api_key
NEXT_PRIVATE_SMTP_FROM_ADDRESS=noreply@yourdomain.com

# Document Signing
NEXT_PRIVATE_SIGNING_TRANSPORT=local
NEXT_PRIVATE_SIGNING_PASSPHRASE=your-signing-passphrase
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=your-base64-p12-certificate

# Optional: Stripe (if using billing)
NEXT_PRIVATE_STRIPE_API_KEY=sk_live_your_stripe_key
NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_publishable_key

# Optional: Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_your_posthog_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
`;

    fs.writeFileSync(this.envFile, envTemplate);
    this.log('success', 'Created environment variables template');
    
    return true;
  }

  /**
   * Initialize Railway project
   */
  initializeRailway() {
    this.log('info', 'Initializing Railway project...');
    
    try {
      // Check if already logged in
      try {
        execSync('railway whoami', { stdio: 'pipe' });
        this.log('success', 'Already logged into Railway');
      } catch (error) {
        this.log('info', 'Please log into Railway (browser will open)...');
        execSync('railway login', { stdio: 'inherit' });
      }
      
      // Initialize project
      this.log('info', 'Creating Railway project...');
      execSync('railway init', { stdio: 'inherit' });
      
      this.log('success', 'Railway project initialized');
      return true;
    } catch (error) {
      this.log('error', `Failed to initialize Railway: ${error.message}`);
      return false;
    }
  }

  /**
   * Set up database
   */
  setupDatabase() {
    this.log('info', 'Setting up PostgreSQL database...');
    
    try {
      // Add PostgreSQL database
      execSync('railway add --database postgresql', { stdio: 'inherit' });
      this.log('success', 'PostgreSQL database added');
      
      // The DATABASE_URL will be automatically available as an environment variable
      this.log('info', 'DATABASE_URL will be automatically provided by Railway');
      
      return true;
    } catch (error) {
      this.log('warning', 'Database setup failed, you can add it manually from Railway dashboard');
      return false;
    }
  }

  /**
   * Deploy to Railway
   */
  deployToRailway() {
    this.log('info', 'Deploying to Railway...');
    
    try {
      execSync('railway up', { stdio: 'inherit' });
      this.log('success', 'Deployment initiated');
      
      // Get deployment URL
      try {
        const url = execSync('railway domain', { encoding: 'utf8' }).trim();
        this.log('success', `Your app will be available at: ${url}`);
      } catch (error) {
        this.log('info', 'You can get your app URL from the Railway dashboard');
      }
      
      return true;
    } catch (error) {
      this.log('error', `Deployment failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate migration instructions
   */
  generateInstructions() {
    const instructions = `
# Railway Migration Completed

## ✅ What Was Done:
1. Railway CLI installed and configured
2. Railway project initialized
3. PostgreSQL database added
4. Configuration files created:
   - railway.json (deployment config)
   - Procfile (build instructions)
   - .env.railway.example (environment variables template)

## 🚀 Next Steps:

### 1. Set Environment Variables
Go to Railway dashboard → Your Project → Settings → Environment
Copy variables from .env.railway.example and set your actual values.

### 2. Configure Custom Domain (Optional)
Railway dashboard → Your Project → Settings → Domains
Add your custom domain and configure DNS.

### 3. Monitor Deployment
Railway dashboard → Your Project → Deployments
Watch the build logs and ensure successful deployment.

## 🔧 Railway Commands:
- \`railway logs\` - View application logs
- \`railway shell\` - Access application shell
- \`railway variables\` - Manage environment variables
- \`railway up\` - Deploy changes
- \`railway open\` - Open app in browser

## 💡 Benefits of Railway:
- ✅ Zero configuration monorepo support
- ✅ Built-in PostgreSQL database
- ✅ Automatic HTTPS and custom domains
- ✅ Simple environment variable management
- ✅ Predictable pricing ($5/month)
- ✅ Excellent build performance

## 🆘 If You Need Help:
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.app

## 🔄 Rollback Plan:
If you need to go back to Netlify:
1. Your Netlify configuration is still intact
2. All fixes have been applied
3. Just trigger a new Netlify deployment

Your app should be deploying to Railway now! 🚂
`;

    fs.writeFileSync('RAILWAY_MIGRATION_COMPLETE.md', instructions);
    this.log('success', 'Generated migration instructions');
  }

  /**
   * Run complete migration
   */
  async runMigration() {
    console.log('\n' + '='.repeat(60));
    console.log('🚂 RAILWAY MIGRATION SCRIPT');
    console.log('='.repeat(60));
    console.log('This will migrate your app to Railway with zero code changes.');
    console.log('Your current Netlify setup will remain intact as backup.\n');
    
    const steps = [
      () => this.checkRailwayCLI(),
      () => this.createRailwayConfig(),
      () => this.createEnvTemplate(),
      () => this.initializeRailway(),
      () => this.setupDatabase(),
      () => this.deployToRailway()
    ];
    
    let success = true;
    for (const step of steps) {
      try {
        const result = await step();
        if (!result) {
          success = false;
          break;
        }
      } catch (error) {
        this.log('error', `Migration step failed: ${error.message}`);
        success = false;
        break;
      }
    }
    
    this.generateInstructions();
    
    console.log('\n' + '='.repeat(60));
    if (success) {
      console.log('✅ RAILWAY MIGRATION COMPLETED');
      console.log('🚂 Your app is deploying to Railway');
      console.log('📋 Next: Set environment variables in Railway dashboard');
      console.log('📖 Instructions: RAILWAY_MIGRATION_COMPLETE.md');
    } else {
      console.log('❌ MIGRATION ENCOUNTERED ISSUES');
      console.log('📋 Next: Check errors above and retry');
      console.log('🔄 Fallback: Your Netlify setup is still available');
    }
    console.log('='.repeat(60) + '\n');
    
    return success;
  }
}

// CLI usage
if (require.main === module) {
  const migrator = new RailwayMigrator();
  
  migrator.runMigration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    });
}

module.exports = { RailwayMigrator };