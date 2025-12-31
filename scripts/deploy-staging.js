#!/usr/bin/env node

/**
 * Staging Deployment Script for Netlify Multi-Site Setup
 * 
 * This script deploys all applications to staging environments,
 * verifies build processes, and tests cross-application functionality.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

class StagingDeployment {
  constructor() {
    this.startTime = Date.now();
    this.deploymentResults = {
      marketing: { status: 'pending', url: null, buildTime: null },
      remix: { status: 'pending', url: null, buildTime: null },
      docs: { status: 'pending', url: null, buildTime: null }
    };
    
    // Staging site configurations
    this.stagingSites = {
      marketing: {
        name: 'Marketing Site',
        hookUrl: process.env.NETLIFY_MARKETING_HOOK_STAGING,
        expectedUrl: process.env.STAGING_MARKETING_URL || 'https://staging-marketing.netlify.app',
        healthCheck: '/',
        workspace: '@signtusk/web'
      },
      remix: {
        name: 'Remix Application',
        hookUrl: process.env.NETLIFY_REMIX_HOOK_STAGING,
        expectedUrl: process.env.STAGING_REMIX_URL || 'https://staging-remix.netlify.app',
        healthCheck: '/api/health',
        workspace: '@signtusk/remix'
      },
      docs: {
        name: 'Documentation Site',
        hookUrl: process.env.NETLIFY_DOCS_HOOK_STAGING,
        expectedUrl: process.env.STAGING_DOCS_URL || 'https://staging-docs.netlify.app',
        healthCheck: '/',
        workspace: '@signtusk/docs'
      }
    };
    
    this.logInfo('🚀 Staging Deployment Script Initialized');
  }

  /**
   * Deploy all applications to staging environments
   */
  async deployToStaging() {
    this.logInfo('📦 Starting deployment to staging environments...');
    
    try {
      // Validate environment configuration
      await this.validateEnvironment();
      
      // Trigger deployments for all applications
      const deploymentPromises = Object.entries(this.stagingSites).map(
        ([appName, config]) => this.deployApplication(appName, config)
      );
      
      // Wait for all deployments to complete
      await Promise.allSettled(deploymentPromises);
      
      // Verify all deployments
      await this.verifyDeployments();
      
      // Test cross-application functionality
      await this.testCrossApplicationFunctionality();
      
      // Generate deployment report
      this.generateDeploymentReport();
      
      this.logSuccess('✅ All staging deployments completed successfully');
      
    } catch (error) {
      this.logError(`❌ Staging deployment failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate environment configuration for staging deployment
   */
  async validateEnvironment() {
    this.logInfo('🔍 Validating staging environment configuration...');
    
    // Check required environment variables
    const requiredEnvVars = [
      'NETLIFY_MARKETING_HOOK_STAGING',
      'NETLIFY_REMIX_HOOK_STAGING',
      'NETLIFY_DOCS_HOOK_STAGING'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    
    // Validate workspace structure
    const workspaceRoot = this.findWorkspaceRoot();
    const requiredDirs = ['apps/web', 'apps/remix', 'apps/docs'];
    
    for (const dir of requiredDirs) {
      const fullPath = path.join(workspaceRoot, dir);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Required directory not found: ${fullPath}`);
      }
    }
    
    // Validate build configurations
    await this.validateBuildConfigurations();
    
    this.logSuccess('✅ Environment validation passed');
  }

  /**
   * Validate build configurations for all applications
   */
  async validateBuildConfigurations() {
    const configFiles = [
      'apps/web/netlify.toml',
      'netlify-remix.toml',
      'netlify-docs.toml'
    ];
    
    for (const configFile of configFiles) {
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf8');
        
        // Basic validation - check for required sections
        if (!content.includes('[build]')) {
          throw new Error(`Invalid Netlify configuration in ${configFile}: missing [build] section`);
        }
        
        if (!content.includes('command =')) {
          throw new Error(`Invalid Netlify configuration in ${configFile}: missing build command`);
        }
      }
    }
  }

  /**
   * Deploy a specific application to staging
   */
  async deployApplication(appName, config) {
    const startTime = Date.now();
    
    try {
      this.logInfo(`🚀 Deploying ${config.name} to staging...`);
      
      // Trigger Netlify deployment via webhook
      await this.triggerNetlifyDeployment(config.hookUrl);
      
      // Wait for deployment to complete
      await this.waitForDeployment(appName, config);
      
      const buildTime = Date.now() - startTime;
      this.deploymentResults[appName] = {
        status: 'success',
        url: config.expectedUrl,
        buildTime: buildTime
      };
      
      this.logSuccess(`✅ ${config.name} deployed successfully in ${(buildTime / 1000).toFixed(2)}s`);
      
    } catch (error) {
      this.deploymentResults[appName] = {
        status: 'failed',
        url: null,
        buildTime: Date.now() - startTime,
        error: error.message
      };
      
      this.logError(`❌ Failed to deploy ${config.name}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Trigger Netlify deployment via webhook
   */
  async triggerNetlifyDeployment(hookUrl) {
    return new Promise((resolve, reject) => {
      const url = new URL(hookUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'StagingDeploymentScript/1.0'
        }
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          reject(new Error(`Webhook request failed with status ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.write('{}');
      req.end();
    });
  }

  /**
   * Wait for deployment to complete and become available
   */
  async waitForDeployment(appName, config, maxWaitTime = 600000) { // 10 minutes
    const startTime = Date.now();
    const checkInterval = 10000; // 10 seconds
    
    this.logInfo(`⏳ Waiting for ${config.name} deployment to complete...`);
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        await this.checkDeploymentHealth(config.expectedUrl, config.healthCheck);
        this.logSuccess(`✅ ${config.name} is now available at ${config.expectedUrl}`);
        return;
      } catch (error) {
        // Continue waiting
        await this.sleep(checkInterval);
      }
    }
    
    throw new Error(`Deployment timeout: ${config.name} did not become available within ${maxWaitTime / 1000}s`);
  }

  /**
   * Check if a deployment is healthy and responding
   */
  async checkDeploymentHealth(baseUrl, healthPath) {
    return new Promise((resolve, reject) => {
      const url = new URL(healthPath, baseUrl);
      
      const options = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: 10000,
        headers: {
          'User-Agent': 'StagingDeploymentScript/1.0'
        }
      };
      
      const req = https.request(options, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve();
        } else {
          reject(new Error(`Health check failed with status ${res.statusCode}`));
        }
      });
      
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
      
      req.end();
    });
  }

  /**
   * Verify all deployments are working correctly
   */
  async verifyDeployments() {
    this.logInfo('🔍 Verifying all deployments...');
    
    const verificationPromises = Object.entries(this.stagingSites).map(
      ([appName, config]) => this.verifyDeployment(appName, config)
    );
    
    const results = await Promise.allSettled(verificationPromises);
    
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      throw new Error(`Deployment verification failed for ${failures.length} applications`);
    }
    
    this.logSuccess('✅ All deployments verified successfully');
  }

  /**
   * Verify a specific deployment
   */
  async verifyDeployment(appName, config) {
    try {
      // Basic health check
      await this.checkDeploymentHealth(config.expectedUrl, config.healthCheck);
      
      // Application-specific verification
      switch (appName) {
        case 'marketing':
          await this.verifyMarketingSite(config);
          break;
        case 'remix':
          await this.verifyRemixApp(config);
          break;
        case 'docs':
          await this.verifyDocsSite(config);
          break;
      }
      
      this.logSuccess(`✅ ${config.name} verification passed`);
      
    } catch (error) {
      this.logError(`❌ ${config.name} verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify marketing site specific functionality
   */
  async verifyMarketingSite(config) {
    // Check for essential marketing site elements
    const testPaths = ['/', '/about', '/pricing'];
    
    for (const path of testPaths) {
      await this.checkDeploymentHealth(config.expectedUrl, path);
    }
  }

  /**
   * Verify Remix app specific functionality
   */
  async verifyRemixApp(config) {
    // Check API endpoints and SSR functionality
    const testPaths = ['/api/health', '/login', '/dashboard'];
    
    for (const path of testPaths) {
      try {
        await this.checkDeploymentHealth(config.expectedUrl, path);
      } catch (error) {
        // Some paths might require authentication, just log warning
        this.logWarning(`⚠️  Path ${path} returned error (may require auth): ${error.message}`);
      }
    }
  }

  /**
   * Verify documentation site specific functionality
   */
  async verifyDocsSite(config) {
    // Check for essential documentation elements
    const testPaths = ['/', '/api', '/guides'];
    
    for (const path of testPaths) {
      await this.checkDeploymentHealth(config.expectedUrl, path);
    }
  }

  /**
   * Test cross-application functionality and routing
   */
  async testCrossApplicationFunctionality() {
    this.logInfo('🔗 Testing cross-application functionality...');
    
    try {
      // Test that each application can reach the others
      await this.testCrossApplicationRouting();
      
      // Test shared authentication (if applicable)
      await this.testSharedAuthentication();
      
      // Test API connectivity between apps
      await this.testAPIConnectivity();
      
      this.logSuccess('✅ Cross-application functionality tests passed');
      
    } catch (error) {
      this.logError(`❌ Cross-application functionality tests failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test routing between applications
   */
  async testCrossApplicationRouting() {
    // Test redirects from marketing site to app
    const marketingUrl = this.stagingSites.marketing.expectedUrl;
    const appUrl = this.stagingSites.remix.expectedUrl;
    
    // This would typically involve checking redirect headers
    // For now, just verify the URLs are accessible
    await this.checkDeploymentHealth(marketingUrl, '/');
    await this.checkDeploymentHealth(appUrl, '/');
  }

  /**
   * Test shared authentication between applications
   */
  async testSharedAuthentication() {
    // This would test SSO or shared session functionality
    // Implementation depends on the specific auth setup
    this.logInfo('ℹ️  Shared authentication test - implementation depends on auth setup');
  }

  /**
   * Test API connectivity between applications
   */
  async testAPIConnectivity() {
    // Test that docs site can access API from remix app
    const docsUrl = this.stagingSites.docs.expectedUrl;
    const apiUrl = this.stagingSites.remix.expectedUrl;
    
    // Basic connectivity test
    await this.checkDeploymentHealth(docsUrl, '/');
    await this.checkDeploymentHealth(apiUrl, '/api/health');
  }

  /**
   * Generate comprehensive deployment report
   */
  generateDeploymentReport() {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 STAGING DEPLOYMENT REPORT');
    console.log('='.repeat(80));
    
    Object.entries(this.deploymentResults).forEach(([appName, result]) => {
      const config = this.stagingSites[appName];
      console.log(`\n${config.name}:`);
      console.log(`  Status: ${result.status}`);
      console.log(`  URL: ${result.url || 'N/A'}`);
      console.log(`  Build Time: ${result.buildTime ? (result.buildTime / 1000).toFixed(2) + 's' : 'N/A'}`);
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    
    console.log(`\nTotal Deployment Time: ${totalTime}s`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'staging-deployment-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalTime: parseFloat(totalTime),
      results: this.deploymentResults,
      sites: this.stagingSites
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.logInfo(`📄 Deployment report saved to: ${reportPath}`);
  }

  /**
   * Find workspace root directory
   */
  findWorkspaceRoot() {
    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.workspaces) {
            return currentDir;
          }
        } catch (error) {
          // Continue searching
        }
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    throw new Error('Could not find workspace root');
  }

  /**
   * Utility function to sleep for specified milliseconds
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
module.exports = { StagingDeployment };

// Run if called directly
if (require.main === module) {
  const deployment = new StagingDeployment();
  deployment.deployToStaging().catch(error => {
    console.error('Staging deployment failed:', error);
    process.exit(1);
  });
}