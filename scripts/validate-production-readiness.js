#!/usr/bin/env node

/**
 * Production Deployment Readiness Validation Script
 * 
 * This script validates that all environment variables are configured,
 * SSL certificates and domain routing are working, and monitoring/alerting
 * is properly set up for production deployment.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

class ProductionReadinessValidator {
  constructor() {
    this.startTime = Date.now();
    this.validationResults = {
      environmentVariables: { status: 'pending', issues: [] },
      sslCertificates: { status: 'pending', issues: [] },
      domainRouting: { status: 'pending', issues: [] },
      monitoring: { status: 'pending', issues: [] },
      security: { status: 'pending', issues: [] },
      performance: { status: 'pending', issues: [] }
    };
    
    // Production site configurations
    this.productionSites = {
      marketing: {
        name: 'Marketing Site',
        domain: process.env.PRODUCTION_MARKETING_DOMAIN || 'yourdomain.com',
        expectedUrl: process.env.PRODUCTION_MARKETING_URL || 'https://yourdomain.com',
        workspace: '@signtusk/web'
      },
      remix: {
        name: 'Remix Application',
        domain: process.env.PRODUCTION_REMIX_DOMAIN || 'app.yourdomain.com',
        expectedUrl: process.env.PRODUCTION_REMIX_URL || 'https://app.yourdomain.com',
        workspace: '@signtusk/remix'
      },
      docs: {
        name: 'Documentation Site',
        domain: process.env.PRODUCTION_DOCS_DOMAIN || 'docs.yourdomain.com',
        expectedUrl: process.env.PRODUCTION_DOCS_URL || 'https://docs.yourdomain.com',
        workspace: '@signtusk/docs'
      }
    };
    
    this.logInfo('🔍 Production Readiness Validation Initialized');
  }

  /**
   * Run comprehensive production readiness validation
   */
  async validateProductionReadiness() {
    try {
      this.logInfo('🚀 Starting production readiness validation...');
      
      // Validate environment variables
      await this.validateEnvironmentVariables();
      
      // Validate SSL certificates and domain routing
      await this.validateSSLAndDomains();
      
      // Validate monitoring and alerting setup
      await this.validateMonitoringSetup();
      
      // Validate security configuration
      await this.validateSecurityConfiguration();
      
      // Validate performance configuration
      await this.validatePerformanceConfiguration();
      
      // Generate readiness report
      this.generateReadinessReport();
      
      // Check if ready for production
      const isReady = this.isProductionReady();
      
      if (isReady) {
        this.logSuccess('✅ Production deployment readiness validation passed');
      } else {
        throw new Error('Production deployment readiness validation failed - see report for details');
      }
      
    } catch (error) {
      this.logError(`❌ Production readiness validation failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate all required environment variables are configured
   */
  async validateEnvironmentVariables() {
    this.logInfo('🔧 Validating environment variables...');
    
    const issues = [];
    
    // Required environment variables for each application
    const requiredEnvVars = {
      shared: [
        'NODE_ENV',
        'NEXT_PUBLIC_PROJECT',
        'NEXT_PUBLIC_WEBAPP_URL',
        'NEXT_PUBLIC_MARKETING_URL',
        'NEXT_PUBLIC_DOCS_URL'
      ],
      remix: [
        'DATABASE_URL',
        'POSTGRES_PRISMA_URL',
        'NEXTAUTH_SECRET',
        'JWT_SECRET',
        'NEXT_PRIVATE_ENCRYPTION_KEY',
        'NEXT_PRIVATE_UPLOAD_BUCKET',
        'NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID',
        'NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY',
        'NEXT_PRIVATE_SMTP_TRANSPORT',
        'NEXT_PRIVATE_RESEND_API_KEY',
        'NEXT_PRIVATE_SIGNING_TRANSPORT',
        'NEXT_PRIVATE_SIGNING_PASSPHRASE'
      ],
      optional: [
        'NEXT_PRIVATE_STRIPE_API_KEY',
        'NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET',
        'NEXT_PUBLIC_POSTHOG_KEY',
        'NEXT_PRIVATE_GOOGLE_CLIENT_ID',
        'REDIS_URL'
      ]
    };
    
    // Check shared environment variables
    for (const varName of requiredEnvVars.shared) {
      if (!process.env[varName]) {
        issues.push(`Missing required shared environment variable: ${varName}`);
      }
    }
    
    // Check Remix-specific environment variables
    for (const varName of requiredEnvVars.remix) {
      if (!process.env[varName]) {
        issues.push(`Missing required Remix environment variable: ${varName}`);
      }
    }
    
    // Validate environment variable formats
    await this.validateEnvironmentVariableFormats(issues);
    
    // Check for placeholder values
    await this.checkForPlaceholderValues(issues);
    
    this.validationResults.environmentVariables = {
      status: issues.length === 0 ? 'passed' : 'failed',
      issues: issues
    };
    
    if (issues.length === 0) {
      this.logSuccess('✅ Environment variables validation passed');
    } else {
      this.logError(`❌ Environment variables validation failed with ${issues.length} issues`);
    }
  }

  /**
   * Validate environment variable formats
   */
  async validateEnvironmentVariableFormats(issues) {
    // Validate URL formats
    const urlVars = [
      'NEXT_PUBLIC_WEBAPP_URL',
      'NEXT_PUBLIC_MARKETING_URL',
      'NEXT_PUBLIC_DOCS_URL',
      'DATABASE_URL',
      'POSTGRES_PRISMA_URL'
    ];
    
    for (const varName of urlVars) {
      const value = process.env[varName];
      if (value) {
        try {
          new URL(value);
        } catch (error) {
          issues.push(`Invalid URL format for ${varName}: ${value}`);
        }
      }
    }
    
    // Validate secret lengths
    const secretVars = [
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'NEXT_PRIVATE_ENCRYPTION_KEY'
    ];
    
    for (const varName of secretVars) {
      const value = process.env[varName];
      if (value && value.length < 32) {
        issues.push(`${varName} should be at least 32 characters long for security`);
      }
    }
    
    // Validate NODE_ENV
    if (process.env.NODE_ENV !== 'production') {
      issues.push(`NODE_ENV should be 'production' for production deployment, got: ${process.env.NODE_ENV}`);
    }
  }

  /**
   * Check for placeholder values that need to be replaced
   */
  async checkForPlaceholderValues(issues) {
    const placeholderPatterns = [
      'your-',
      'example.com',
      'localhost',
      'test-',
      'placeholder',
      'changeme',
      'secret-here'
    ];
    
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('NEXT_') || key.startsWith('DATABASE_') || key.startsWith('JWT_')) {
        for (const pattern of placeholderPatterns) {
          if (value && value.toLowerCase().includes(pattern)) {
            issues.push(`Environment variable ${key} appears to contain placeholder value: ${value}`);
            break;
          }
        }
      }
    }
  }

  /**
   * Validate SSL certificates and domain routing
   */
  async validateSSLAndDomains() {
    this.logInfo('🔒 Validating SSL certificates and domain routing...');
    
    const issues = [];
    
    for (const [appName, config] of Object.entries(this.productionSites)) {
      try {
        await this.validateDomainSSL(config.expectedUrl, config.name);
        await this.validateDomainRouting(config.expectedUrl, config.name);
      } catch (error) {
        issues.push(`${config.name}: ${error.message}`);
      }
    }
    
    // Test cross-domain redirects
    await this.validateCrossDomainRedirects(issues);
    
    this.validationResults.sslCertificates = {
      status: issues.length === 0 ? 'passed' : 'failed',
      issues: issues
    };
    
    this.validationResults.domainRouting = {
      status: issues.length === 0 ? 'passed' : 'failed',
      issues: issues
    };
    
    if (issues.length === 0) {
      this.logSuccess('✅ SSL and domain validation passed');
    } else {
      this.logError(`❌ SSL and domain validation failed with ${issues.length} issues`);
    }
  }

  /**
   * Validate SSL certificate for a domain
   */
  async validateDomainSSL(url, siteName) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: '/',
        method: 'HEAD',
        timeout: 10000,
        rejectUnauthorized: true // This will fail if SSL is invalid
      };
      
      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        
        if (!cert || Object.keys(cert).length === 0) {
          reject(new Error(`No SSL certificate found for ${siteName}`));
          return;
        }
        
        // Check certificate expiration
        const now = new Date();
        const validTo = new Date(cert.valid_to);
        const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 30) {
          reject(new Error(`SSL certificate for ${siteName} expires in ${daysUntilExpiry} days`));
          return;
        }
        
        this.logInfo(`✅ ${siteName} SSL certificate valid until ${cert.valid_to}`);
        resolve();
      });
      
      req.on('error', (error) => {
        reject(new Error(`SSL validation failed for ${siteName}: ${error.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`SSL validation timeout for ${siteName}`));
      });
      
      req.end();
    });
  }

  /**
   * Validate domain routing and accessibility
   */
  async validateDomainRouting(url, siteName) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: '/',
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'ProductionReadinessValidator/1.0'
        }
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.logInfo(`✅ ${siteName} is accessible at ${url}`);
          resolve();
        } else {
          reject(new Error(`${siteName} returned status ${res.statusCode}`));
        }
      });
      
      req.on('error', (error) => {
        reject(new Error(`Domain routing failed for ${siteName}: ${error.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Domain routing timeout for ${siteName}`));
      });
      
      req.end();
    });
  }

  /**
   * Validate cross-domain redirects
   */
  async validateCrossDomainRedirects(issues) {
    // Test redirect from www to non-www
    const marketingDomain = this.productionSites.marketing.domain;
    const wwwUrl = `https://www.${marketingDomain}`;
    
    try {
      await this.checkRedirect(wwwUrl, this.productionSites.marketing.expectedUrl);
      this.logInfo('✅ WWW redirect working correctly');
    } catch (error) {
      issues.push(`WWW redirect issue: ${error.message}`);
    }
  }

  /**
   * Check if a URL redirects correctly
   */
  async checkRedirect(fromUrl, expectedToUrl) {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(fromUrl);
      
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'ProductionReadinessValidator/1.0'
        }
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          const location = res.headers.location;
          if (location && location.includes(new URL(expectedToUrl).hostname)) {
            resolve();
          } else {
            reject(new Error(`Redirect target incorrect: expected ${expectedToUrl}, got ${location}`));
          }
        } else {
          reject(new Error(`Expected redirect but got status ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Redirect check timeout'));
      });
      
      req.end();
    });
  }

  /**
   * Validate monitoring and alerting setup
   */
  async validateMonitoringSetup() {
    this.logInfo('📊 Validating monitoring and alerting setup...');
    
    const issues = [];
    
    // Check for analytics configuration
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY && !process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      issues.push('No analytics service configured (PostHog or Google Analytics)');
    }
    
    // Check for error monitoring
    if (!process.env.SENTRY_DSN && !process.env.BUGSNAG_API_KEY) {
      issues.push('No error monitoring service configured (Sentry or Bugsnag)');
    }
    
    // Check for uptime monitoring
    if (!process.env.UPTIME_MONITOR_URL) {
      issues.push('No uptime monitoring configured');
    }
    
    // Check for log aggregation
    if (!process.env.LOG_AGGREGATION_URL) {
      issues.push('No log aggregation service configured');
    }
    
    // Check for performance monitoring
    if (!process.env.PERFORMANCE_MONITOR_KEY) {
      issues.push('No performance monitoring configured');
    }
    
    // Validate Netlify monitoring features
    await this.validateNetlifyMonitoring(issues);
    
    this.validationResults.monitoring = {
      status: issues.length === 0 ? 'passed' : 'warning',
      issues: issues
    };
    
    if (issues.length === 0) {
      this.logSuccess('✅ Monitoring setup validation passed');
    } else {
      this.logWarning(`⚠️  Monitoring setup has ${issues.length} recommendations`);
    }
  }

  /**
   * Validate Netlify-specific monitoring features
   */
  async validateNetlifyMonitoring(issues) {
    // Check for Netlify Analytics
    if (!process.env.NETLIFY_ANALYTICS_ENABLED) {
      issues.push('Netlify Analytics not enabled');
    }
    
    // Check for build notifications
    if (!process.env.NETLIFY_BUILD_NOTIFICATIONS_ENABLED) {
      issues.push('Netlify build notifications not configured');
    }
    
    // Check for deploy notifications
    if (!process.env.SLACK_WEBHOOK_URL && !process.env.DISCORD_WEBHOOK_URL) {
      issues.push('No deploy notification webhooks configured');
    }
  }

  /**
   * Validate security configuration
   */
  async validateSecurityConfiguration() {
    this.logInfo('🔐 Validating security configuration...');
    
    const issues = [];
    
    // Check security headers in Netlify configurations
    await this.validateSecurityHeaders(issues);
    
    // Check for secure secrets management
    await this.validateSecretsManagement(issues);
    
    // Check for rate limiting configuration
    await this.validateRateLimiting(issues);
    
    this.validationResults.security = {
      status: issues.length === 0 ? 'passed' : 'failed',
      issues: issues
    };
    
    if (issues.length === 0) {
      this.logSuccess('✅ Security configuration validation passed');
    } else {
      this.logError(`❌ Security configuration validation failed with ${issues.length} issues`);
    }
  }

  /**
   * Validate security headers configuration
   */
  async validateSecurityHeaders(issues) {
    const netlifyConfigs = [
      'apps/web/netlify.toml',
      'netlify-remix.toml',
      'netlify-docs.toml'
    ];
    
    const requiredHeaders = [
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Strict-Transport-Security',
      'Content-Security-Policy'
    ];
    
    for (const configFile of netlifyConfigs) {
      if (fs.existsSync(configFile)) {
        const config = fs.readFileSync(configFile, 'utf8');
        
        for (const header of requiredHeaders) {
          if (!config.includes(header)) {
            issues.push(`Missing security header ${header} in ${configFile}`);
          }
        }
      }
    }
  }

  /**
   * Validate secrets management
   */
  async validateSecretsManagement(issues) {
    // Check that sensitive values are not in environment files
    const envFiles = [
      '.env',
      '.env.local',
      '.env.production'
    ];
    
    const sensitivePatterns = [
      /sk_live_/,  // Stripe live keys
      /pk_live_/,  // Stripe live publishable keys
      /password/i,
      /secret/i
    ];
    
    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        
        for (const pattern of sensitivePatterns) {
          if (pattern.test(content)) {
            issues.push(`Potential sensitive data found in ${envFile} - should be in Netlify environment variables`);
            break;
          }
        }
      }
    }
  }

  /**
   * Validate rate limiting configuration
   */
  async validateRateLimiting(issues) {
    if (!process.env.RATE_LIMIT_ENABLED) {
      issues.push('Rate limiting not enabled');
    }
    
    if (!process.env.RATE_LIMIT_MAX_REQUESTS) {
      issues.push('Rate limit thresholds not configured');
    }
  }

  /**
   * Validate performance configuration
   */
  async validatePerformanceConfiguration() {
    this.logInfo('⚡ Validating performance configuration...');
    
    const issues = [];
    
    // Check build optimization settings
    await this.validateBuildOptimization(issues);
    
    // Check caching configuration
    await this.validateCachingConfiguration(issues);
    
    // Check CDN configuration
    await this.validateCDNConfiguration(issues);
    
    this.validationResults.performance = {
      status: issues.length === 0 ? 'passed' : 'warning',
      issues: issues
    };
    
    if (issues.length === 0) {
      this.logSuccess('✅ Performance configuration validation passed');
    } else {
      this.logWarning(`⚠️  Performance configuration has ${issues.length} recommendations`);
    }
  }

  /**
   * Validate build optimization settings
   */
  async validateBuildOptimization(issues) {
    // Check for Turbo configuration
    if (!fs.existsSync('turbo.json')) {
      issues.push('Turbo configuration not found - builds may be slower');
    }
    
    // Check for build caching
    const netlifyConfigs = ['apps/web/netlify.toml', 'netlify-remix.toml', 'netlify-docs.toml'];
    
    for (const configFile of netlifyConfigs) {
      if (fs.existsSync(configFile)) {
        const config = fs.readFileSync(configFile, 'utf8');
        
        if (!config.includes('cache')) {
          issues.push(`Build caching not configured in ${configFile}`);
        }
      }
    }
  }

  /**
   * Validate caching configuration
   */
  async validateCachingConfiguration(issues) {
    // Check for Redis configuration (optional)
    if (!process.env.REDIS_URL) {
      issues.push('Redis caching not configured (optional but recommended)');
    }
    
    // Check for CDN caching headers
    const netlifyConfigs = ['apps/web/netlify.toml', 'netlify-remix.toml', 'netlify-docs.toml'];
    
    for (const configFile of netlifyConfigs) {
      if (fs.existsSync(configFile)) {
        const config = fs.readFileSync(configFile, 'utf8');
        
        if (!config.includes('Cache-Control')) {
          issues.push(`CDN caching headers not configured in ${configFile}`);
        }
      }
    }
  }

  /**
   * Validate CDN configuration
   */
  async validateCDNConfiguration(issues) {
    // Netlify provides CDN by default, but check for optimization
    if (!process.env.NETLIFY_CDN_OPTIMIZATION_ENABLED) {
      issues.push('Netlify CDN optimization not explicitly enabled');
    }
  }

  /**
   * Check if production is ready based on validation results
   */
  isProductionReady() {
    const criticalChecks = ['environmentVariables', 'sslCertificates', 'domainRouting', 'security'];
    
    for (const check of criticalChecks) {
      if (this.validationResults[check].status === 'failed') {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Generate comprehensive readiness report
   */
  generateReadinessReport() {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 PRODUCTION READINESS REPORT');
    console.log('='.repeat(80));
    
    Object.entries(this.validationResults).forEach(([category, result]) => {
      const statusIcon = result.status === 'passed' ? '✅' : 
                        result.status === 'warning' ? '⚠️' : '❌';
      
      console.log(`\n${statusIcon} ${category.toUpperCase()}: ${result.status.toUpperCase()}`);
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
          console.log(`  - ${issue}`);
        });
      }
    });
    
    const isReady = this.isProductionReady();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`PRODUCTION READY: ${isReady ? '✅ YES' : '❌ NO'}`);
    console.log(`Validation Time: ${totalTime}s`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'production-readiness-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalTime: parseFloat(totalTime),
      isReady: isReady,
      results: this.validationResults,
      sites: this.productionSites
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.logInfo(`📄 Readiness report saved to: ${reportPath}`);
  }

  /**
   * Logging utilities
   */
  logInfo(message) {
    console.log(`ℹ️  ${message}`);
  }

  logSuccess(message) {
    console.log(`✅ ${message}`);
  }

  logWarning(message) {
    console.warn(`⚠️  ${message}`);
  }

  logError(message) {
    console.error(`❌ ${message}`);
  }
}

// Export for testing
module.exports = { ProductionReadinessValidator };

// Run if called directly
if (require.main === module) {
  const validator = new ProductionReadinessValidator();
  validator.validateProductionReadiness().catch(error => {
    console.error('Production readiness validation failed:', error);
    process.exit(1);
  });
}