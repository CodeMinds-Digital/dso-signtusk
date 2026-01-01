#!/usr/bin/env node

/**
 * Vercel Deployment Monitoring Script
 * 
 * This script monitors a Vercel deployment and validates its health.
 * It can be used for continuous monitoring or post-deployment validation.
 */

const https = require('https');
const { execSync } = require('child_process');

class VercelDeploymentMonitor {
  constructor(config = {}) {
    this.config = {
      appUrl: process.env.NEXT_PUBLIC_APP_URL || config.appUrl,
      healthEndpoint: '/api/health',
      timeout: 30000,
      retries: 3,
      retryDelay: 5000,
      ...config
    };

    if (!this.config.appUrl) {
      throw new Error('App URL is required. Set NEXT_PUBLIC_APP_URL or pass appUrl in config.');
    }
  }

  /**
   * Perform a comprehensive health check of the deployment
   */
  async performHealthCheck() {
    console.log('🏥 Starting comprehensive health check...');
    console.log(`📍 Target URL: ${this.config.appUrl}`);

    const results = {
      timestamp: new Date().toISOString(),
      appUrl: this.config.appUrl,
      checks: {},
      overall: 'unknown'
    };

    try {
      // Basic connectivity check
      results.checks.connectivity = await this.checkConnectivity();
      
      // Health endpoint check
      results.checks.healthEndpoint = await this.checkHealthEndpoint();
      
      // SSL certificate check
      results.checks.ssl = await this.checkSSL();
      
      // Performance check
      results.checks.performance = await this.checkPerformance();
      
      // Security headers check
      results.checks.security = await this.checkSecurityHeaders();

      // Determine overall status
      const failedChecks = Object.values(results.checks).filter(check => check.status === 'failed');
      results.overall = failedChecks.length === 0 ? 'healthy' : 'unhealthy';

      this.printResults(results);
      return results;

    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      results.overall = 'failed';
      results.error = error.message;
      return results;
    }
  }

  /**
   * Check basic connectivity to the application
   */
  async checkConnectivity() {
    console.log('🔗 Checking connectivity...');
    
    try {
      const response = await this.makeRequest('/', { method: 'HEAD' });
      
      if (response.statusCode >= 200 && response.statusCode < 400) {
        console.log('✅ Connectivity check passed');
        return {
          status: 'passed',
          statusCode: response.statusCode,
          responseTime: response.responseTime
        };
      } else {
        console.log(`❌ Connectivity check failed: HTTP ${response.statusCode}`);
        return {
          status: 'failed',
          statusCode: response.statusCode,
          error: `HTTP ${response.statusCode}`
        };
      }
    } catch (error) {
      console.log(`❌ Connectivity check failed: ${error.message}`);
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Check the health endpoint
   */
  async checkHealthEndpoint() {
    console.log('🏥 Checking health endpoint...');
    
    try {
      const response = await this.makeRequest(this.config.healthEndpoint);
      
      if (response.statusCode === 200) {
        const healthData = JSON.parse(response.body);
        console.log('✅ Health endpoint check passed');
        return {
          status: 'passed',
          data: healthData,
          responseTime: response.responseTime
        };
      } else {
        console.log(`❌ Health endpoint check failed: HTTP ${response.statusCode}`);
        return {
          status: 'failed',
          statusCode: response.statusCode,
          error: `HTTP ${response.statusCode}`
        };
      }
    } catch (error) {
      console.log(`⚠️ Health endpoint not available: ${error.message}`);
      return {
        status: 'warning',
        error: error.message,
        note: 'Health endpoint may not be implemented'
      };
    }
  }

  /**
   * Check SSL certificate validity
   */
  async checkSSL() {
    console.log('🔒 Checking SSL certificate...');
    
    if (!this.config.appUrl.startsWith('https://')) {
      return {
        status: 'warning',
        note: 'Not using HTTPS'
      };
    }

    try {
      const url = new URL(this.config.appUrl);
      const response = await this.makeRequest('/', { method: 'HEAD' });
      
      console.log('✅ SSL certificate check passed');
      return {
        status: 'passed',
        certificate: {
          valid: true,
          issuer: response.certificate?.issuer,
          validFrom: response.certificate?.valid_from,
          validTo: response.certificate?.valid_to
        }
      };
    } catch (error) {
      console.log(`❌ SSL certificate check failed: ${error.message}`);
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Check application performance
   */
  async checkPerformance() {
    console.log('⚡ Checking performance...');
    
    try {
      const startTime = Date.now();
      const response = await this.makeRequest('/');
      const responseTime = Date.now() - startTime;
      
      const performance = {
        responseTime,
        status: responseTime < 3000 ? 'passed' : 'warning'
      };

      if (performance.status === 'passed') {
        console.log(`✅ Performance check passed (${responseTime}ms)`);
      } else {
        console.log(`⚠️ Performance check warning: slow response (${responseTime}ms)`);
      }

      return performance;
    } catch (error) {
      console.log(`❌ Performance check failed: ${error.message}`);
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Check security headers
   */
  async checkSecurityHeaders() {
    console.log('🛡️ Checking security headers...');
    
    try {
      const response = await this.makeRequest('/', { method: 'HEAD' });
      const headers = response.headers;
      
      const securityHeaders = {
        'x-content-type-options': headers['x-content-type-options'],
        'x-frame-options': headers['x-frame-options'],
        'x-xss-protection': headers['x-xss-protection'],
        'strict-transport-security': headers['strict-transport-security'],
        'content-security-policy': headers['content-security-policy']
      };

      const presentHeaders = Object.entries(securityHeaders)
        .filter(([key, value]) => value)
        .map(([key]) => key);

      const missingHeaders = Object.keys(securityHeaders)
        .filter(key => !securityHeaders[key]);

      if (presentHeaders.length >= 3) {
        console.log(`✅ Security headers check passed (${presentHeaders.length}/5 headers present)`);
        return {
          status: 'passed',
          presentHeaders,
          missingHeaders
        };
      } else {
        console.log(`⚠️ Security headers check warning: only ${presentHeaders.length}/5 headers present`);
        return {
          status: 'warning',
          presentHeaders,
          missingHeaders
        };
      }
    } catch (error) {
      console.log(`❌ Security headers check failed: ${error.message}`);
      return {
        status: 'failed',
        error: error.message
      };
    }
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(path, options = {}) {
    const url = new URL(path, this.config.appUrl);
    
    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        const startTime = Date.now();
        const response = await this.httpRequest(url, options);
        response.responseTime = Date.now() - startTime;
        return response;
      } catch (error) {
        if (attempt === this.config.retries) {
          throw error;
        }
        console.log(`⚠️ Attempt ${attempt} failed, retrying in ${this.config.retryDelay}ms...`);
        await this.sleep(this.config.retryDelay);
      }
    }
  }

  /**
   * Make HTTP request (Promise wrapper for Node.js https module)
   */
  httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        method: options.method || 'GET',
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'Vercel-Deployment-Monitor/1.0',
          ...options.headers
        }
      };

      const req = https.request(url, requestOptions, (res) => {
        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
            certificate: res.connection?.getPeerCertificate?.()
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Print formatted results
   */
  printResults(results) {
    console.log('\n📊 Health Check Results');
    console.log('========================');
    console.log(`🕐 Timestamp: ${results.timestamp}`);
    console.log(`🌐 URL: ${results.appUrl}`);
    console.log(`📈 Overall Status: ${this.getStatusEmoji(results.overall)} ${results.overall.toUpperCase()}`);
    
    console.log('\n🔍 Detailed Results:');
    Object.entries(results.checks).forEach(([checkName, result]) => {
      const emoji = this.getStatusEmoji(result.status);
      console.log(`  ${emoji} ${checkName}: ${result.status}`);
      
      if (result.responseTime) {
        console.log(`    ⏱️  Response time: ${result.responseTime}ms`);
      }
      
      if (result.error) {
        console.log(`    ❗ Error: ${result.error}`);
      }
      
      if (result.note) {
        console.log(`    ℹ️  Note: ${result.note}`);
      }
    });

    if (results.overall === 'unhealthy') {
      console.log('\n⚠️ Issues detected. Please review the failed checks above.');
    } else if (results.overall === 'healthy') {
      console.log('\n🎉 All checks passed! Deployment is healthy.');
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
      healthy: '🟢',
      unhealthy: '🔴',
      unknown: '❓'
    };
    return emojis[status] || '❓';
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const config = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value) {
      config[key] = value;
    }
  }

  try {
    const monitor = new VercelDeploymentMonitor(config);
    const results = await monitor.performHealthCheck();
    
    // Exit with appropriate code
    process.exit(results.overall === 'healthy' ? 0 : 1);
  } catch (error) {
    console.error('❌ Monitoring failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { VercelDeploymentMonitor };