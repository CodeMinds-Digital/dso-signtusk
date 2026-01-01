#!/usr/bin/env node

/**
 * Vercel Deployment Validator
 * 
 * This script validates that a Vercel deployment meets all requirements
 * and is ready for production use.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VercelDeploymentValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overall: 'unknown',
      categories: {
        environment: { status: 'unknown', checks: [] },
        dependencies: { status: 'unknown', checks: [] },
        build: { status: 'unknown', checks: [] },
        configuration: { status: 'unknown', checks: [] },
        security: { status: 'unknown', checks: [] }
      }
    };
  }

  /**
   * Run all validation checks
   */
  async validate() {
    console.log('🔍 Starting Vercel deployment validation...\n');

    try {
      await this.validateEnvironment();
      await this.validateDependencies();
      await this.validateBuild();
      await this.validateConfiguration();
      await this.validateSecurity();

      this.calculateOverallStatus();
      this.printResults();

      return this.results;
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      this.results.overall = 'failed';
      this.results.error = error.message;
      return this.results;
    }
  }

  /**
   * Validate environment variables
   */
  async validateEnvironment() {
    console.log('🌍 Validating environment variables...');
    const category = this.results.categories.environment;

    const requiredVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_URL',
      'DATABASE_URL',
      'NEXT_PRIVATE_DATABASE_URL',
      'POSTGRES_PRISMA_URL',
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'NEXT_PRIVATE_ENCRYPTION_KEY',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'NEXT_PRIVATE_UPLOAD_BUCKET',
      'NEXT_PUBLIC_UPLOAD_TRANSPORT'
    ];

    const optionalVars = [
      'REDIS_URL',
      'NEXT_PRIVATE_RESEND_API_KEY',
      'NEXT_PRIVATE_STRIPE_API_KEY',
      'NEXT_PUBLIC_POSTHOG_KEY'
    ];

    // Check required variables
    for (const varName of requiredVars) {
      const check = { name: varName, type: 'required' };
      
      if (process.env[varName]) {
        check.status = 'passed';
        check.message = 'Variable is set';
      } else {
        check.status = 'failed';
        check.message = 'Required variable is missing';
      }
      
      category.checks.push(check);
    }

    // Check optional variables
    for (const varName of optionalVars) {
      const check = { name: varName, type: 'optional' };
      
      if (process.env[varName]) {
        check.status = 'passed';
        check.message = 'Optional variable is set';
      } else {
        check.status = 'warning';
        check.message = 'Optional variable not set';
      }
      
      category.checks.push(check);
    }

    // Validate specific formats
    this.validateDatabaseUrl(category);
    this.validateSecrets(category);
    this.validateUrls(category);

    category.status = this.getCategoryStatus(category.checks);
    console.log(`${this.getStatusEmoji(category.status)} Environment validation: ${category.status}\n`);
  }

  /**
   * Validate database URL format
   */
  validateDatabaseUrl(category) {
    const dbUrl = process.env.DATABASE_URL;
    const check = { name: 'DATABASE_URL_FORMAT', type: 'validation' };

    if (!dbUrl) {
      check.status = 'failed';
      check.message = 'DATABASE_URL is not set';
    } else if (!dbUrl.startsWith('postgresql://')) {
      check.status = 'failed';
      check.message = 'DATABASE_URL must be a PostgreSQL connection string';
    } else if (!dbUrl.includes('sslmode=require')) {
      check.status = 'warning';
      check.message = 'DATABASE_URL should include sslmode=require for production';
    } else {
      check.status = 'passed';
      check.message = 'DATABASE_URL format is valid';
    }

    category.checks.push(check);
  }

  /**
   * Validate secrets format and strength
   */
  validateSecrets(category) {
    const secrets = [
      { name: 'NEXTAUTH_SECRET', minLength: 32 },
      { name: 'ENCRYPTION_KEY', exactLength: 32 },
      { name: 'NEXT_PRIVATE_ENCRYPTION_KEY', exactLength: 32 }
    ];

    for (const secret of secrets) {
      const check = { name: `${secret.name}_FORMAT`, type: 'validation' };
      const value = process.env[secret.name];

      if (!value) {
        check.status = 'failed';
        check.message = `${secret.name} is not set`;
      } else if (secret.exactLength && value.length !== secret.exactLength) {
        check.status = 'failed';
        check.message = `${secret.name} must be exactly ${secret.exactLength} characters`;
      } else if (secret.minLength && value.length < secret.minLength) {
        check.status = 'failed';
        check.message = `${secret.name} must be at least ${secret.minLength} characters`;
      } else {
        check.status = 'passed';
        check.message = `${secret.name} format is valid`;
      }

      category.checks.push(check);
    }
  }

  /**
   * Validate URL formats
   */
  validateUrls(category) {
    const urls = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_WEBAPP_URL'];

    for (const urlName of urls) {
      const check = { name: `${urlName}_FORMAT`, type: 'validation' };
      const url = process.env[urlName];

      if (!url) {
        check.status = 'failed';
        check.message = `${urlName} is not set`;
      } else {
        try {
          new URL(url);
          if (url.startsWith('https://')) {
            check.status = 'passed';
            check.message = `${urlName} is a valid HTTPS URL`;
          } else {
            check.status = 'warning';
            check.message = `${urlName} should use HTTPS in production`;
          }
        } catch (error) {
          check.status = 'failed';
          check.message = `${urlName} is not a valid URL`;
        }
      }

      category.checks.push(check);
    }
  }

  /**
   * Validate dependencies
   */
  async validateDependencies() {
    console.log('📦 Validating dependencies...');
    const category = this.results.categories.dependencies;

    // Check package.json exists
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const check1 = { name: 'PACKAGE_JSON_EXISTS', type: 'file' };
    
    if (fs.existsSync(packageJsonPath)) {
      check1.status = 'passed';
      check1.message = 'package.json exists';
    } else {
      check1.status = 'failed';
      check1.message = 'package.json not found';
      category.checks.push(check1);
      category.status = 'failed';
      return;
    }
    category.checks.push(check1);

    // Read and validate package.json
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    // Check for required dependencies
    const requiredDeps = [
      '@remix-run/node',
      '@remix-run/react',
      '@remix-run/serve',
      '@prisma/client',
      'dotenv'
    ];

    for (const dep of requiredDeps) {
      const check = { name: `DEPENDENCY_${dep.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`, type: 'dependency' };
      
      if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
        check.status = 'passed';
        check.message = `${dep} is installed`;
      } else {
        check.status = 'failed';
        check.message = `${dep} is missing from dependencies`;
      }
      
      category.checks.push(check);
    }

    // Check for CLI dependencies that should be avoided
    const avoidedCliDeps = ['dotenv-cli'];
    
    for (const dep of avoidedCliDeps) {
      const check = { name: `AVOID_${dep.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`, type: 'anti-dependency' };
      
      if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
        check.status = 'warning';
        check.message = `${dep} should be avoided in Vercel deployments`;
      } else {
        check.status = 'passed';
        check.message = `${dep} is not used (good)`;
      }
      
      category.checks.push(check);
    }

    category.status = this.getCategoryStatus(category.checks);
    console.log(`${this.getStatusEmoji(category.status)} Dependencies validation: ${category.status}\n`);
  }

  /**
   * Validate build configuration
   */
  async validateBuild() {
    console.log('🏗️ Validating build configuration...');
    const category = this.results.categories.build;

    // Check build scripts
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    const check1 = { name: 'BUILD_SCRIPT_EXISTS', type: 'script' };
    if (packageJson.scripts?.build) {
      check1.status = 'passed';
      check1.message = 'Build script exists';
    } else {
      check1.status = 'failed';
      check1.message = 'Build script is missing';
    }
    category.checks.push(check1);

    // Check for CLI dependencies in build scripts
    const buildScript = packageJson.scripts?.build || '';
    const check2 = { name: 'BUILD_SCRIPT_CLI_DEPS', type: 'script' };
    
    if (buildScript.includes('dotenv ') || buildScript.includes('with:env')) {
      check2.status = 'failed';
      check2.message = 'Build script uses CLI dependencies that may not work in Vercel';
    } else {
      check2.status = 'passed';
      check2.message = 'Build script does not use problematic CLI dependencies';
    }
    category.checks.push(check2);

    // Test build locally
    const check3 = { name: 'BUILD_TEST', type: 'execution' };
    try {
      console.log('  Testing build locally...');
      execSync('npm run build', { stdio: 'pipe', timeout: 120000 });
      check3.status = 'passed';
      check3.message = 'Local build completed successfully';
    } catch (error) {
      check3.status = 'failed';
      check3.message = `Local build failed: ${error.message}`;
    }
    category.checks.push(check3);

    // Check build output
    const buildOutputPath = path.join(process.cwd(), 'apps/remix/build');
    const check4 = { name: 'BUILD_OUTPUT_EXISTS', type: 'file' };
    
    if (fs.existsSync(buildOutputPath)) {
      check4.status = 'passed';
      check4.message = 'Build output directory exists';
    } else {
      check4.status = 'failed';
      check4.message = 'Build output directory not found';
    }
    category.checks.push(check4);

    category.status = this.getCategoryStatus(category.checks);
    console.log(`${this.getStatusEmoji(category.status)} Build validation: ${category.status}\n`);
  }

  /**
   * Validate Vercel configuration
   */
  async validateConfiguration() {
    console.log('⚙️ Validating Vercel configuration...');
    const category = this.results.categories.configuration;

    // Check vercel.json
    const vercelJsonPath = path.join(process.cwd(), 'vercel.json');
    const check1 = { name: 'VERCEL_JSON_EXISTS', type: 'file' };
    
    if (fs.existsSync(vercelJsonPath)) {
      check1.status = 'passed';
      check1.message = 'vercel.json exists';
      
      try {
        const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
        
        // Check build command
        const check2 = { name: 'VERCEL_BUILD_COMMAND', type: 'config' };
        if (vercelConfig.buildCommand) {
          check2.status = 'passed';
          check2.message = `Build command configured: ${vercelConfig.buildCommand}`;
        } else {
          check2.status = 'warning';
          check2.message = 'Build command not specified in vercel.json';
        }
        category.checks.push(check2);

        // Check output directory
        const check3 = { name: 'VERCEL_OUTPUT_DIR', type: 'config' };
        if (vercelConfig.outputDirectory) {
          check3.status = 'passed';
          check3.message = `Output directory configured: ${vercelConfig.outputDirectory}`;
        } else {
          check3.status = 'warning';
          check3.message = 'Output directory not specified in vercel.json';
        }
        category.checks.push(check3);

      } catch (error) {
        const check2 = { name: 'VERCEL_JSON_VALID', type: 'config' };
        check2.status = 'failed';
        check2.message = 'vercel.json is not valid JSON';
        category.checks.push(check2);
      }
    } else {
      check1.status = 'warning';
      check1.message = 'vercel.json not found (will use defaults)';
    }
    category.checks.push(check1);

    // Check turbo.json
    const turboJsonPath = path.join(process.cwd(), 'turbo.json');
    const check4 = { name: 'TURBO_JSON_EXISTS', type: 'file' };
    
    if (fs.existsSync(turboJsonPath)) {
      check4.status = 'passed';
      check4.message = 'turbo.json exists';
      
      try {
        const turboConfig = JSON.parse(fs.readFileSync(turboJsonPath, 'utf8'));
        
        // Check environment variables in turbo config
        const check5 = { name: 'TURBO_ENV_VARS', type: 'config' };
        const buildPipeline = turboConfig.pipeline?.build;
        
        if (buildPipeline?.env && Array.isArray(buildPipeline.env) && buildPipeline.env.length > 0) {
          check5.status = 'passed';
          check5.message = `Turbo build pipeline has ${buildPipeline.env.length} environment variables configured`;
        } else {
          check5.status = 'warning';
          check5.message = 'Turbo build pipeline has no environment variables configured';
        }
        category.checks.push(check5);

      } catch (error) {
        const check5 = { name: 'TURBO_JSON_VALID', type: 'config' };
        check5.status = 'failed';
        check5.message = 'turbo.json is not valid JSON';
        category.checks.push(check5);
      }
    } else {
      check4.status = 'warning';
      check4.message = 'turbo.json not found';
    }
    category.checks.push(check4);

    category.status = this.getCategoryStatus(category.checks);
    console.log(`${this.getStatusEmoji(category.status)} Configuration validation: ${category.status}\n`);
  }

  /**
   * Validate security configuration
   */
  async validateSecurity() {
    console.log('🛡️ Validating security configuration...');
    const category = this.results.categories.security;

    // Check for sensitive files that shouldn't be committed
    const sensitiveFiles = ['.env', '.env.local', '.env.production'];
    
    for (const file of sensitiveFiles) {
      const check = { name: `SENSITIVE_FILE_${file.replace(/\./g, '_').toUpperCase()}`, type: 'security' };
      const filePath = path.join(process.cwd(), file);
      
      if (fs.existsSync(filePath)) {
        // Check if file is in .gitignore
        const gitignorePath = path.join(process.cwd(), '.gitignore');
        if (fs.existsSync(gitignorePath)) {
          const gitignore = fs.readFileSync(gitignorePath, 'utf8');
          if (gitignore.includes(file)) {
            check.status = 'passed';
            check.message = `${file} exists but is properly ignored by git`;
          } else {
            check.status = 'failed';
            check.message = `${file} exists but is not in .gitignore`;
          }
        } else {
          check.status = 'warning';
          check.message = `${file} exists but no .gitignore found`;
        }
      } else {
        check.status = 'passed';
        check.message = `${file} does not exist (good)`;
      }
      
      category.checks.push(check);
    }

    // Check for hardcoded secrets in code
    const check4 = { name: 'HARDCODED_SECRETS_CHECK', type: 'security' };
    try {
      // Simple grep for common secret patterns
      const result = execSync('grep -r "sk_live\\|pk_live\\|whsec_" --include="*.js" --include="*.ts" --include="*.jsx" --include="*.tsx" . || true', { encoding: 'utf8' });
      
      if (result.trim()) {
        check4.status = 'failed';
        check4.message = 'Potential hardcoded secrets found in code';
      } else {
        check4.status = 'passed';
        check4.message = 'No obvious hardcoded secrets found';
      }
    } catch (error) {
      check4.status = 'warning';
      check4.message = 'Could not check for hardcoded secrets';
    }
    category.checks.push(check4);

    category.status = this.getCategoryStatus(category.checks);
    console.log(`${this.getStatusEmoji(category.status)} Security validation: ${category.status}\n`);
  }

  /**
   * Calculate overall status based on category results
   */
  calculateOverallStatus() {
    const categoryStatuses = Object.values(this.results.categories).map(cat => cat.status);
    
    if (categoryStatuses.includes('failed')) {
      this.results.overall = 'failed';
    } else if (categoryStatuses.includes('warning')) {
      this.results.overall = 'warning';
    } else if (categoryStatuses.every(status => status === 'passed')) {
      this.results.overall = 'passed';
    } else {
      this.results.overall = 'unknown';
    }
  }

  /**
   * Get category status based on individual checks
   */
  getCategoryStatus(checks) {
    if (checks.some(check => check.status === 'failed')) {
      return 'failed';
    } else if (checks.some(check => check.status === 'warning')) {
      return 'warning';
    } else if (checks.every(check => check.status === 'passed')) {
      return 'passed';
    } else {
      return 'unknown';
    }
  }

  /**
   * Get emoji for status
   */
  getStatusEmoji(status) {
    const emojis = {
      passed: '✅',
      failed: '❌',
      warning: '⚠️',
      unknown: '❓'
    };
    return emojis[status] || '❓';
  }

  /**
   * Print detailed results
   */
  printResults() {
    console.log('📊 Validation Results');
    console.log('====================');
    console.log(`🕐 Timestamp: ${this.results.timestamp}`);
    console.log(`📈 Overall Status: ${this.getStatusEmoji(this.results.overall)} ${this.results.overall.toUpperCase()}`);
    
    console.log('\n🔍 Category Results:');
    Object.entries(this.results.categories).forEach(([categoryName, category]) => {
      console.log(`\n${this.getStatusEmoji(category.status)} ${categoryName.toUpperCase()}: ${category.status}`);
      
      category.checks.forEach(check => {
        const emoji = this.getStatusEmoji(check.status);
        console.log(`  ${emoji} ${check.name}: ${check.message}`);
      });
    });

    // Summary
    const totalChecks = Object.values(this.results.categories)
      .reduce((total, category) => total + category.checks.length, 0);
    
    const passedChecks = Object.values(this.results.categories)
      .reduce((total, category) => 
        total + category.checks.filter(check => check.status === 'passed').length, 0);
    
    const failedChecks = Object.values(this.results.categories)
      .reduce((total, category) => 
        total + category.checks.filter(check => check.status === 'failed').length, 0);

    console.log(`\n📊 Summary: ${passedChecks}/${totalChecks} checks passed`);
    
    if (failedChecks > 0) {
      console.log(`❌ ${failedChecks} checks failed - deployment may not work correctly`);
    } else if (this.results.overall === 'warning') {
      console.log(`⚠️ Some warnings detected - review before deploying`);
    } else {
      console.log(`🎉 All validations passed - ready for Vercel deployment!`);
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  try {
    const validator = new VercelDeploymentValidator();
    const results = await validator.validate();
    
    // Exit with appropriate code
    process.exit(results.overall === 'passed' ? 0 : 1);
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { VercelDeploymentValidator };