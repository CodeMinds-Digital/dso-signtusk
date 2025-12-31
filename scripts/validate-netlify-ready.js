#!/usr/bin/env node

/**
 * Simple Netlify Deployment Validation
 * 
 * Quick validation that deployment is ready without running full build.
 * This checks configuration and critical dependencies only.
 */

const fs = require('fs');
const path = require('path');

class NetlifyValidator {
  constructor() {
    this.remixPath = path.join('apps', 'remix');
    this.issues = [];
    this.checks = [];
  }

  log(type, message) {
    const prefix = {
      error: '❌',
      warning: '⚠️ ',
      success: '✅',
      info: 'ℹ️ '
    }[type] || 'ℹ️ ';
    
    console.log(`${prefix} ${message}`);
    
    if (type === 'error') {
      this.issues.push(message);
    } else if (type === 'success') {
      this.checks.push(message);
    }
  }

  /**
   * Check package.json configuration
   */
  checkPackageJson() {
    this.log('info', 'Checking package.json configuration...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.remixPath, 'package.json'), 'utf8'));
      
      // Check build scripts
      const requiredScripts = ['build', 'build:app', 'build:server'];
      for (const script of requiredScripts) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.log('success', `Build script '${script}' configured`);
        } else {
          this.log('error', `Build script '${script}' missing`);
        }
      }
      
      // Check that scripts don't use cross-env (for simplicity)
      if (packageJson.scripts['build:app'] && !packageJson.scripts['build:app'].includes('cross-env')) {
        this.log('success', 'Build scripts use native NODE_ENV setting');
      }
      
      // Check critical dependencies
      const criticalDeps = ['@react-router/dev', 'rollup', 'typescript'];
      for (const dep of criticalDeps) {
        if (packageJson.dependencies && packageJson.dependencies[dep]) {
          this.log('success', `Critical dependency '${dep}' in dependencies`);
        } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
          this.log('warning', `Critical dependency '${dep}' in devDependencies (may cause issues)`);
        } else {
          this.log('error', `Critical dependency '${dep}' missing`);
        }
      }
      
    } catch (error) {
      this.log('error', `Failed to read package.json: ${error.message}`);
    }
  }

  /**
   * Check Netlify configuration
   */
  checkNetlifyConfig() {
    this.log('info', 'Checking Netlify configuration...');
    
    try {
      const netlifyConfigPath = path.join(this.remixPath, 'netlify.toml');
      
      if (!fs.existsSync(netlifyConfigPath)) {
        this.log('error', 'netlify.toml not found');
        return;
      }
      
      const netlifyConfig = fs.readFileSync(netlifyConfigPath, 'utf8');
      
      // Check build configuration
      if (netlifyConfig.includes('base = "apps/remix"')) {
        this.log('success', 'Base directory configured correctly');
      } else {
        this.log('error', 'Base directory not configured');
      }
      
      if (netlifyConfig.includes('publish = "build/client"')) {
        this.log('success', 'Publish directory configured correctly');
      } else {
        this.log('error', 'Publish directory not configured');
      }
      
      if (netlifyConfig.includes('functions = "build/server"')) {
        this.log('success', 'Functions directory configured correctly');
      } else {
        this.log('error', 'Functions directory not configured');
      }
      
      // Check build command
      if (netlifyConfig.includes('NETLIFY_APP_NAME=remix node scripts/netlify-build.js')) {
        this.log('success', 'Build command configured correctly');
      } else {
        this.log('error', 'Build command not configured correctly');
      }
      
      // Check NPM flags
      if (netlifyConfig.includes('--include=dev')) {
        this.log('success', 'NPM flags include dev dependencies');
      } else {
        this.log('warning', 'NPM flags may not include dev dependencies');
      }
      
    } catch (error) {
      this.log('error', `Failed to read netlify.toml: ${error.message}`);
    }
  }

  /**
   * Check build script exists
   */
  checkBuildScript() {
    this.log('info', 'Checking build script...');
    
    const buildScriptPath = path.join('scripts', 'netlify-build.js');
    
    if (fs.existsSync(buildScriptPath)) {
      this.log('success', 'Netlify build script exists');
    } else {
      this.log('error', 'Netlify build script missing');
    }
    
    const errorHandlerPath = path.join('scripts', 'netlify-build-error-handler.js');
    
    if (fs.existsSync(errorHandlerPath)) {
      this.log('success', 'Build error handler exists');
    } else {
      this.log('warning', 'Build error handler missing');
    }
  }

  /**
   * Check environment variables template
   */
  checkEnvTemplate() {
    this.log('info', 'Checking environment variables template...');
    
    const envTemplatePath = '.env.netlify.remix.example';
    
    if (fs.existsSync(envTemplatePath)) {
      this.log('success', 'Environment variables template exists');
      
      const envContent = fs.readFileSync(envTemplatePath, 'utf8');
      const requiredVars = ['NODE_ENV', 'DATABASE_URL', 'NEXTAUTH_SECRET'];
      
      for (const envVar of requiredVars) {
        if (envContent.includes(envVar)) {
          this.log('success', `Environment variable ${envVar} documented`);
        } else {
          this.log('warning', `Environment variable ${envVar} not documented`);
        }
      }
    } else {
      this.log('warning', 'Environment variables template missing');
    }
  }

  /**
   * Generate deployment checklist
   */
  generateChecklist() {
    const checklist = `
# Netlify Deployment Checklist

## ✅ Configuration Validation Results
- **Checks Passed**: ${this.checks.length}
- **Issues Found**: ${this.issues.length}

${this.issues.length === 0 ? '🚀 **READY FOR DEPLOYMENT**' : '⚠️ **FIX ISSUES BEFORE DEPLOYMENT**'}

## 📋 Deployment Steps

### 1. Commit and Push Changes
\`\`\`bash
git add .
git commit -m "Apply Netlify deployment fixes and remove cross-env dependency"
git push origin main
\`\`\`

### 2. Netlify Dashboard Setup
1. **Go to**: https://app.netlify.com
2. **Site Settings → Build & Deploy → Build Settings**:
   - Base directory: \`apps/remix\`
   - Build command: \`cd ../.. && NETLIFY_APP_NAME=remix node scripts/netlify-build.js\`
   - Publish directory: \`build/client\`
   - Functions directory: \`build/server\`

### 3. Environment Variables
**Required Variables** (Site Settings → Environment Variables):
\`\`\`
NODE_ENV=production
NODE_VERSION=22
NETLIFY_APP_NAME=remix
SKIP_PATCHES=true
NPM_FLAGS=--legacy-peer-deps --force --include=dev
NODE_OPTIONS=--max-old-space-size=4096
\`\`\`

**Application Variables**:
Copy from \`.env.netlify.remix.example\` and set your actual values:
- DATABASE_URL
- NEXTAUTH_SECRET
- JWT_SECRET
- NEXT_PUBLIC_WEBAPP_URL
- (and others as needed)

### 4. Deploy
1. **Trigger Deploy**: Click "Trigger deploy" in Netlify dashboard
2. **Monitor Build**: Expected time ~90-120 seconds
3. **Check Logs**: Watch for any errors during build

## 🔧 If Deployment Fails

### Quick Fixes:
1. **Check Environment Variables**: Ensure all required variables are set
2. **Clear Cache**: Use "Clear cache and deploy" option
3. **Check Build Logs**: Look for specific error messages

### Backup Plan:
If Netlify continues to have issues, run:
\`\`\`bash
node scripts/migrate-to-railway.js
\`\`\`

## 📊 Expected Performance
- **Build Time**: 90-120 seconds
- **Dependencies**: ~60 seconds
- **Client Build**: ~30 seconds
- **Server Build**: ~20 seconds

${this.issues.length > 0 ? `
## ❌ Issues to Fix:
${this.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

---
**Status**: ${this.issues.length === 0 ? '✅ Ready for deployment' : '⚠️ Fix issues first'}
**Backup**: Railway migration available if needed
`;

    fs.writeFileSync('NETLIFY_DEPLOYMENT_CHECKLIST.md', checklist);
    this.log('success', 'Generated deployment checklist');
  }

  /**
   * Run validation
   */
  validate() {
    console.log('\n' + '='.repeat(60));
    console.log('🔍 NETLIFY DEPLOYMENT VALIDATION');
    console.log('='.repeat(60));
    console.log('Quick validation of deployment readiness...\n');
    
    this.checkPackageJson();
    this.checkNetlifyConfig();
    this.checkBuildScript();
    this.checkEnvTemplate();
    
    this.generateChecklist();
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Checks Passed: ${this.checks.length}`);
    console.log(`❌ Issues Found: ${this.issues.length}`);
    
    if (this.issues.length === 0) {
      console.log('\n🚀 DEPLOYMENT STATUS: READY');
      console.log('✅ Configuration validated - proceed with deployment');
      console.log('📋 Next: Follow NETLIFY_DEPLOYMENT_CHECKLIST.md');
    } else {
      console.log('\n⚠️ DEPLOYMENT STATUS: ISSUES FOUND');
      console.log('❌ Fix issues above before deploying');
      console.log('🔄 Alternative: Railway migration available');
    }
    console.log('='.repeat(60) + '\n');
    
    return this.issues.length === 0;
  }
}

// CLI usage
if (require.main === module) {
  const validator = new NetlifyValidator();
  const isReady = validator.validate();
  process.exit(isReady ? 0 : 1);
}

module.exports = { NetlifyValidator };