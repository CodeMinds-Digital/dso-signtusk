#!/usr/bin/env node

/**
 * Netlify Deployment Validation Script
 * 
 * Validates that all requirements are met for successful Netlify deployment
 * and provides actionable feedback for any missing configurations.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NetlifyDeploymentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.success = [];
    this.requiredEnvVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'NEXT_PRIVATE_ENCRYPTION_KEY',
      'NEXT_PUBLIC_WEBAPP_URL',
      'NEXT_PRIVATE_UPLOAD_TRANSPORT',
      'NEXT_PRIVATE_SMTP_TRANSPORT'
    ];
  }

  log(type, message) {
    const timestamp = new Date().toISOString();
    const prefix = {
      error: '❌',
      warning: '⚠️ ',
      success: '✅',
      info: 'ℹ️ '
    }[type] || 'ℹ️ ';
    
    console.log(`${prefix} ${message}`);
    
    switch (type) {
      case 'error':
        this.errors.push(message);
        break;
      case 'warning':
        this.warnings.push(message);
        break;
      case 'success':
        this.success.push(message);
        break;
    }
  }

  /**
   * Validate Netlify configuration files
   */
  validateNetlifyConfig() {
    this.log('info', 'Validating Netlify configuration files...');
    
    // Check netlify.toml exists
    const netlifyTomlPath = path.join('apps', 'remix', 'netlify.toml');
    if (!fs.existsSync(netlifyTomlPath)) {
      this.log('error', `Missing netlify.toml at ${netlifyTomlPath}`);
      return false;
    }
    
    // Validate netlify.toml content
    try {
      const netlifyConfig = fs.readFileSync(netlifyTomlPath, 'utf8');
      
      // Check required sections
      const requiredSections = [
        '[build]',
        'base = "apps/remix"',
        'command = "cd ../.. && NETLIFY_APP_NAME=remix node scripts/netlify-build.js"',
        'publish = "build/client"',
        'functions = "build/server"'
      ];
      
      for (const section of requiredSections) {
        if (!netlifyConfig.includes(section)) {
          this.log('error', `Missing required section in netlify.toml: ${section}`);
          return false;
        }
      }
      
      this.log('success', 'netlify.toml configuration is valid');
      return true;
      
    } catch (error) {
      this.log('error', `Failed to read netlify.toml: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate build scripts
   */
  validateBuildScripts() {
    this.log('info', 'Validating build scripts...');
    
    const buildScript = path.join('scripts', 'netlify-build.js');
    const errorHandler = path.join('scripts', 'netlify-build-error-handler.js');
    
    if (!fs.existsSync(buildScript)) {
      this.log('error', `Missing build script: ${buildScript}`);
      return false;
    }
    
    if (!fs.existsSync(errorHandler)) {
      this.log('error', `Missing error handler: ${errorHandler}`);
      return false;
    }
    
    this.log('success', 'Build scripts are present');
    return true;
  }

  /**
   * Validate package.json configurations
   */
  validatePackageJson() {
    this.log('info', 'Validating package.json configurations...');
    
    try {
      // Check root package.json
      const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (!rootPackage.packageManager || !rootPackage.packageManager.includes('npm@')) {
        this.log('error', 'Root package.json missing or invalid packageManager field');
        return false;
      }
      
      // Check remix app package.json
      const remixPackagePath = path.join('apps', 'remix', 'package.json');
      if (!fs.existsSync(remixPackagePath)) {
        this.log('error', `Missing remix package.json at ${remixPackagePath}`);
        return false;
      }
      
      const remixPackage = JSON.parse(fs.readFileSync(remixPackagePath, 'utf8'));
      
      if (!remixPackage.scripts || !remixPackage.scripts.build) {
        this.log('error', 'Remix package.json missing build script');
        return false;
      }
      
      this.log('success', 'Package.json configurations are valid');
      return true;
      
    } catch (error) {
      this.log('error', `Failed to validate package.json: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate environment variable template
   */
  validateEnvTemplate() {
    this.log('info', 'Validating environment variable template...');
    
    const envTemplate = path.join('.env.netlify.remix.example');
    if (!fs.existsSync(envTemplate)) {
      this.log('error', `Missing environment template: ${envTemplate}`);
      return false;
    }
    
    try {
      const envContent = fs.readFileSync(envTemplate, 'utf8');
      
      // Check for required variable examples
      for (const envVar of this.requiredEnvVars) {
        if (!envContent.includes(envVar)) {
          this.log('warning', `Environment template missing example for: ${envVar}`);
        }
      }
      
      this.log('success', 'Environment variable template is present');
      return true;
      
    } catch (error) {
      this.log('error', `Failed to read environment template: ${error.message}`);
      return false;
    }
  }

  /**
   * Test local build process
   */
  async testLocalBuild() {
    this.log('info', 'Testing local build process...');
    
    try {
      // Test dependency installation
      this.log('info', 'Testing dependency installation...');
      execSync('npm install --legacy-peer-deps --force', { 
        stdio: 'pipe',
        timeout: 300000 // 5 minutes
      });
      this.log('success', 'Dependencies install successfully');
      
      // Test build process
      this.log('info', 'Testing build process...');
      const buildStart = Date.now();
      
      execSync('NETLIFY_APP_NAME=remix node scripts/netlify-build.js', {
        stdio: 'pipe',
        timeout: 600000, // 10 minutes
        env: {
          ...process.env,
          NODE_ENV: 'production',
          SKIP_PATCHES: 'true'
        }
      });
      
      const buildTime = Date.now() - buildStart;
      this.log('success', `Build completed successfully in ${Math.round(buildTime / 1000)}s`);
      
      // Validate build output
      const clientBuild = path.join('apps', 'remix', 'build', 'client');
      const serverBuild = path.join('apps', 'remix', 'build', 'server');
      
      if (!fs.existsSync(clientBuild)) {
        this.log('error', 'Client build output missing');
        return false;
      }
      
      if (!fs.existsSync(serverBuild)) {
        this.log('error', 'Server build output missing');
        return false;
      }
      
      this.log('success', 'Build output validation passed');
      return true;
      
    } catch (error) {
      this.log('error', `Build test failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate Prisma setup
   */
  validatePrismaSetup() {
    this.log('info', 'Validating Prisma setup...');
    
    try {
      // Check if Prisma client is generated
      const prismaClientPath = path.join('node_modules', '.prisma', 'client');
      if (!fs.existsSync(prismaClientPath)) {
        this.log('warning', 'Prisma client not generated - run "npx prisma generate"');
        return false;
      }
      
      // Check for EnvelopeType export (previous issue)
      const clientIndexPath = path.join(prismaClientPath, 'index.d.ts');
      if (fs.existsSync(clientIndexPath)) {
        const clientContent = fs.readFileSync(clientIndexPath, 'utf8');
        if (!clientContent.includes('EnvelopeType')) {
          this.log('warning', 'EnvelopeType not found in Prisma client - may need regeneration');
        } else {
          this.log('success', 'Prisma client includes EnvelopeType export');
        }
      }
      
      this.log('success', 'Prisma setup is valid');
      return true;
      
    } catch (error) {
      this.log('error', `Prisma validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Check for common deployment blockers
   */
  checkDeploymentBlockers() {
    this.log('info', 'Checking for common deployment blockers...');
    
    // Check for package-lock.json (should not exist for Netlify)
    if (fs.existsSync('package-lock.json')) {
      this.log('warning', 'package-lock.json exists - may cause npm ci issues on Netlify');
    }
    
    // Check turbo.json for syntax issues
    try {
      const turboConfig = JSON.parse(fs.readFileSync('turbo.json', 'utf8'));
      this.log('success', 'turbo.json is valid JSON');
    } catch (error) {
      this.log('error', `turbo.json has syntax errors: ${error.message}`);
      return false;
    }
    
    // Check for marketplace package (should be disabled)
    try {
      const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (rootPackage.workspaces && rootPackage.workspaces.includes('packages/marketplace')) {
        this.log('warning', 'Marketplace package is enabled - may cause build issues');
      }
    } catch (error) {
      // Ignore
    }
    
    return true;
  }

  /**
   * Generate deployment readiness report
   */
  generateReport() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 NETLIFY DEPLOYMENT READINESS REPORT');
    console.log('='.repeat(70));
    
    console.log(`\n✅ Successful Checks: ${this.success.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ CRITICAL ISSUES (Must Fix):');
      this.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (Recommended to Fix):');
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }
    
    const isReady = this.errors.length === 0;
    
    console.log('\n' + '='.repeat(70));
    if (isReady) {
      console.log('🚀 DEPLOYMENT STATUS: READY');
      console.log('✅ All critical requirements met');
      console.log('📋 Next: Configure Netlify dashboard settings');
      console.log('📖 Guide: NETLIFY_PRODUCTION_DEPLOYMENT_GUIDE.md');
    } else {
      console.log('🚫 DEPLOYMENT STATUS: NOT READY');
      console.log('❌ Critical issues must be resolved first');
      console.log('🔧 Fix the errors listed above and run validation again');
    }
    console.log('='.repeat(70) + '\n');
    
    return isReady;
  }

  /**
   * Run complete validation
   */
  async runValidation() {
    console.log('🔍 Starting Netlify deployment validation...\n');
    
    // Run all validation checks
    const checks = [
      () => this.validateNetlifyConfig(),
      () => this.validateBuildScripts(),
      () => this.validatePackageJson(),
      () => this.validateEnvTemplate(),
      () => this.validatePrismaSetup(),
      () => this.checkDeploymentBlockers()
    ];
    
    for (const check of checks) {
      try {
        await check();
      } catch (error) {
        this.log('error', `Validation check failed: ${error.message}`);
      }
    }
    
    // Optional: Test local build (can be skipped with --skip-build flag)
    if (!process.argv.includes('--skip-build')) {
      try {
        await this.testLocalBuild();
      } catch (error) {
        this.log('error', `Build test failed: ${error.message}`);
      }
    } else {
      this.log('info', 'Skipping build test (--skip-build flag provided)');
    }
    
    return this.generateReport();
  }
}

// CLI usage
if (require.main === module) {
  const validator = new NetlifyDeploymentValidator();
  
  validator.runValidation()
    .then(isReady => {
      process.exit(isReady ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { NetlifyDeploymentValidator };