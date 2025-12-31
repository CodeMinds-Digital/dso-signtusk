#!/usr/bin/env node

/**
 * SSL Certificate Setup and Monitoring Script
 * 
 * This script helps set up and monitor SSL certificates for Netlify sites
 * and provides tools for certificate management and security validation.
 */

const fs = require('fs');
const https = require('https');
const { execSync } = require('child_process');

// Load domain configuration
require('dotenv').config({ path: '.env.domain' });

const SITES = {
  marketing: {
    name: 'Marketing Site',
    domain: process.env.NETLIFY_MARKETING_DOMAIN,
    netlifyAppId: process.env.NETLIFY_MARKETING_APP_ID
  },
  remix: {
    name: 'Remix Application',
    domain: process.env.NETLIFY_REMIX_DOMAIN,
    netlifyAppId: process.env.NETLIFY_REMIX_APP_ID
  },
  docs: {
    name: 'Documentation Site',
    domain: process.env.NETLIFY_DOCS_DOMAIN,
    netlifyAppId: process.env.NETLIFY_DOCS_APP_ID
  }
};

/**
 * Check SSL certificate status for a domain
 */
function checkSSLCertificate(domain) {
  return new Promise((resolve, reject) => {
    if (!domain) {
      resolve({ error: 'No domain configured' });
      return;
    }

    const options = {
      hostname: domain,
      port: 443,
      method: 'HEAD',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      const cert = res.socket.getPeerCertificate();
      
      if (cert && Object.keys(cert).length > 0) {
        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        const daysUntilExpiry = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
        
        resolve({
          domain,
          issuer: cert.issuer.CN || cert.issuer.O,
          subject: cert.subject.CN,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysUntilExpiry,
          fingerprint: cert.fingerprint,
          serialNumber: cert.serialNumber,
          isValid: now >= validFrom && now <= validTo,
          isExpiringSoon: daysUntilExpiry <= 30
        });
      } else {
        resolve({ error: 'No certificate found' });
      }
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Connection timeout' });
    });

    req.end();
  });
}

/**
 * Check security headers for a domain
 */
function checkSecurityHeaders(domain) {
  return new Promise((resolve, reject) => {
    if (!domain) {
      resolve({ error: 'No domain configured' });
      return;
    }

    const options = {
      hostname: domain,
      port: 443,
      path: '/',
      method: 'HEAD',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      const headers = res.headers;
      
      const securityHeaders = {
        'strict-transport-security': headers['strict-transport-security'],
        'x-frame-options': headers['x-frame-options'],
        'x-content-type-options': headers['x-content-type-options'],
        'x-xss-protection': headers['x-xss-protection'],
        'referrer-policy': headers['referrer-policy'],
        'content-security-policy': headers['content-security-policy'],
        'permissions-policy': headers['permissions-policy'],
        'cross-origin-embedder-policy': headers['cross-origin-embedder-policy'],
        'cross-origin-opener-policy': headers['cross-origin-opener-policy'],
        'cross-origin-resource-policy': headers['cross-origin-resource-policy']
      };

      // Filter out undefined headers
      const presentHeaders = Object.fromEntries(
        Object.entries(securityHeaders).filter(([key, value]) => value !== undefined)
      );

      resolve({
        domain,
        headers: presentHeaders,
        score: calculateSecurityScore(presentHeaders)
      });
    });

    req.on('error', (error) => {
      resolve({ error: error.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Connection timeout' });
    });

    req.end();
  });
}

/**
 * Calculate security score based on present headers
 */
function calculateSecurityScore(headers) {
  const requiredHeaders = [
    'strict-transport-security',
    'x-frame-options',
    'x-content-type-options',
    'x-xss-protection',
    'referrer-policy',
    'content-security-policy'
  ];

  const presentCount = requiredHeaders.filter(header => headers[header]).length;
  return Math.round((presentCount / requiredHeaders.length) * 100);
}

/**
 * Generate SSL certificate provisioning commands
 */
function generateSSLCommands() {
  console.log('\n=== SSL Certificate Provisioning Commands ===\n');
  
  Object.entries(SITES).forEach(([key, site]) => {
    if (!site.domain || !site.netlifyAppId) {
      console.log(`⚠️  ${site.name}: Missing domain or app ID configuration`);
      return;
    }

    console.log(`# ${site.name} (${site.domain})`);
    console.log(`netlify ssl:provision --site-id ${site.netlifyAppId}`);
    console.log(`netlify ssl:show --site-id ${site.netlifyAppId}`);
    console.log('');
  });
}

/**
 * Check all SSL certificates
 */
async function checkAllSSLCertificates() {
  console.log('\n=== SSL Certificate Status ===\n');
  
  for (const [key, site] of Object.entries(SITES)) {
    console.log(`🔍 Checking ${site.name}...`);
    
    const result = await checkSSLCertificate(site.domain);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      console.log(`   ✅ Certificate found`);
      console.log(`   📋 Issuer: ${result.issuer}`);
      console.log(`   📅 Valid until: ${result.validTo}`);
      console.log(`   ⏰ Days until expiry: ${result.daysUntilExpiry}`);
      
      if (result.isExpiringSoon) {
        console.log(`   ⚠️  Certificate expires soon!`);
      }
      
      if (!result.isValid) {
        console.log(`   ❌ Certificate is not valid!`);
      }
    }
    
    console.log('');
  }
}

/**
 * Check all security headers
 */
async function checkAllSecurityHeaders() {
  console.log('\n=== Security Headers Status ===\n');
  
  for (const [key, site] of Object.entries(SITES)) {
    console.log(`🔍 Checking ${site.name}...`);
    
    const result = await checkSecurityHeaders(site.domain);
    
    if (result.error) {
      console.log(`   ❌ Error: ${result.error}`);
    } else {
      console.log(`   📊 Security Score: ${result.score}%`);
      console.log(`   📋 Headers found: ${Object.keys(result.headers).length}`);
      
      Object.entries(result.headers).forEach(([header, value]) => {
        const truncatedValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
        console.log(`      ${header}: ${truncatedValue}`);
      });
    }
    
    console.log('');
  }
}

/**
 * Generate HSTS preload submission instructions
 */
function generateHSTSPreloadInstructions() {
  console.log('\n=== HSTS Preload Submission ===\n');
  
  console.log('To submit your domains to the HSTS preload list:');
  console.log('');
  console.log('1. Ensure all domains have HSTS headers with:');
  console.log('   - max-age >= 31536000 (1 year)');
  console.log('   - includeSubDomains directive');
  console.log('   - preload directive');
  console.log('');
  console.log('2. Visit https://hstspreload.org/ and submit each domain:');
  
  Object.entries(SITES).forEach(([key, site]) => {
    if (site.domain) {
      console.log(`   - ${site.domain}`);
    }
  });
  
  console.log('');
  console.log('3. Monitor the submission status and wait for approval.');
  console.log('');
}

/**
 * Create SSL monitoring report
 */
async function createSSLReport() {
  const report = {
    timestamp: new Date().toISOString(),
    sites: {}
  };
  
  for (const [key, site] of Object.entries(SITES)) {
    const sslResult = await checkSSLCertificate(site.domain);
    const headersResult = await checkSecurityHeaders(site.domain);
    
    report.sites[key] = {
      name: site.name,
      domain: site.domain,
      ssl: sslResult,
      securityHeaders: headersResult
    };
  }
  
  fs.writeFileSync('ssl-report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 SSL monitoring report saved to ssl-report.json');
  
  return report;
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  console.log('🔒 SSL Certificate and Security Setup');
  console.log('====================================');
  
  switch (command) {
    case 'ssl-commands':
      generateSSLCommands();
      break;
    
    case 'check-ssl':
      checkAllSSLCertificates();
      break;
    
    case 'check-headers':
      checkAllSecurityHeaders();
      break;
    
    case 'hsts-preload':
      generateHSTSPreloadInstructions();
      break;
    
    case 'report':
      createSSLReport();
      break;
    
    case 'all':
      generateSSLCommands();
      await checkAllSSLCertificates();
      await checkAllSecurityHeaders();
      generateHSTSPreloadInstructions();
      await createSSLReport();
      break;
    
    default:
      console.log('Usage: node ssl-setup.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  ssl-commands   - Generate SSL provisioning commands');
      console.log('  check-ssl      - Check SSL certificate status');
      console.log('  check-headers  - Check security headers');
      console.log('  hsts-preload   - Generate HSTS preload instructions');
      console.log('  report         - Create comprehensive SSL report');
      console.log('  all            - Run all commands');
      console.log('');
      console.log('Make sure to configure .env.domain first!');
      process.exit(1);
  }
}

module.exports = {
  SITES,
  checkSSLCertificate,
  checkSecurityHeaders,
  calculateSecurityScore,
  generateSSLCommands,
  checkAllSSLCertificates,
  checkAllSecurityHeaders,
  generateHSTSPreloadInstructions,
  createSSLReport
};