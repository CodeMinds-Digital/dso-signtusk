#!/usr/bin/env node

/**
 * Domain Setup Script for Netlify Multi-Site Deployment
 * 
 * This script helps set up custom domains for each Netlify site
 * and configures the necessary DNS records and SSL certificates.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load domain configuration
require('dotenv').config({ path: '.env.domain' });

const SITES = {
  marketing: {
    name: 'Marketing Site',
    domain: process.env.NETLIFY_MARKETING_DOMAIN,
    aliases: [process.env.NETLIFY_MARKETING_WWW].filter(Boolean),
    netlifyAppId: process.env.NETLIFY_MARKETING_APP_ID,
    configPath: 'apps/web/netlify.toml'
  },
  remix: {
    name: 'Remix Application',
    domain: process.env.NETLIFY_REMIX_DOMAIN,
    aliases: [],
    netlifyAppId: process.env.NETLIFY_REMIX_APP_ID,
    configPath: 'apps/remix/netlify.toml'
  },
  docs: {
    name: 'Documentation Site',
    domain: process.env.NETLIFY_DOCS_DOMAIN,
    aliases: [],
    netlifyAppId: process.env.NETLIFY_DOCS_APP_ID,
    configPath: 'apps/docs/netlify.toml'
  }
};

/**
 * Generate DNS configuration instructions
 */
function generateDNSInstructions() {
  console.log('\n=== DNS Configuration Instructions ===\n');
  
  Object.entries(SITES).forEach(([key, site]) => {
    if (!site.domain) {
      console.log(`⚠️  ${site.name}: No domain configured`);
      return;
    }

    console.log(`📋 ${site.name} (${site.domain}):`);
    console.log(`   CNAME: ${site.domain} → your-netlify-site.netlify.app`);
    
    site.aliases.forEach(alias => {
      console.log(`   CNAME: ${alias} → your-netlify-site.netlify.app`);
    });
    
    console.log('');
  });

  console.log('📝 Additional DNS Records:');
  console.log('   TXT: _netlify → your-netlify-verification-code (for domain verification)');
  console.log('   CAA: yourdomain.com → 0 issue "letsencrypt.org" (for SSL certificates)');
  console.log('');
}

/**
 * Generate Netlify CLI commands for domain setup
 */
function generateNetlifyCLICommands() {
  console.log('\n=== Netlify CLI Commands ===\n');
  
  Object.entries(SITES).forEach(([key, site]) => {
    if (!site.domain || !site.netlifyAppId) {
      console.log(`⚠️  ${site.name}: Missing domain or app ID configuration`);
      return;
    }

    console.log(`# ${site.name}`);
    console.log(`netlify sites:update --site-id ${site.netlifyAppId} --name ${key}-production`);
    console.log(`netlify domains:create --site-id ${site.netlifyAppId} ${site.domain}`);
    
    site.aliases.forEach(alias => {
      console.log(`netlify domains:create --site-id ${site.netlifyAppId} ${alias}`);
    });
    
    console.log(`netlify ssl:provision --site-id ${site.netlifyAppId}`);
    console.log('');
  });
}

/**
 * Validate domain configuration
 */
function validateDomainConfig() {
  console.log('\n=== Domain Configuration Validation ===\n');
  
  let isValid = true;
  
  Object.entries(SITES).forEach(([key, site]) => {
    console.log(`🔍 Validating ${site.name}...`);
    
    if (!site.domain) {
      console.log(`   ❌ No domain configured for ${key}`);
      isValid = false;
      return;
    }
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(site.domain)) {
      console.log(`   ❌ Invalid domain format: ${site.domain}`);
      isValid = false;
    } else {
      console.log(`   ✅ Domain format valid: ${site.domain}`);
    }
    
    // Validate aliases
    site.aliases.forEach(alias => {
      if (!domainRegex.test(alias)) {
        console.log(`   ❌ Invalid alias format: ${alias}`);
        isValid = false;
      } else {
        console.log(`   ✅ Alias format valid: ${alias}`);
      }
    });
    
    // Check if Netlify config exists
    if (!fs.existsSync(site.configPath)) {
      console.log(`   ❌ Netlify config not found: ${site.configPath}`);
      isValid = false;
    } else {
      console.log(`   ✅ Netlify config exists: ${site.configPath}`);
    }
    
    console.log('');
  });
  
  if (isValid) {
    console.log('✅ All domain configurations are valid!');
  } else {
    console.log('❌ Domain configuration validation failed. Please fix the issues above.');
    process.exit(1);
  }
  
  return isValid;
}

/**
 * Check domain DNS resolution
 */
function checkDNSResolution() {
  console.log('\n=== DNS Resolution Check ===\n');
  
  Object.entries(SITES).forEach(([key, site]) => {
    if (!site.domain) return;
    
    console.log(`🔍 Checking DNS for ${site.domain}...`);
    
    try {
      // Check if domain resolves
      const result = execSync(`nslookup ${site.domain}`, { encoding: 'utf8', timeout: 5000 });
      
      if (result.includes('NXDOMAIN') || result.includes('can\'t find')) {
        console.log(`   ⚠️  Domain not found in DNS: ${site.domain}`);
      } else if (result.includes('netlify')) {
        console.log(`   ✅ Domain points to Netlify: ${site.domain}`);
      } else {
        console.log(`   ⚠️  Domain exists but may not point to Netlify: ${site.domain}`);
      }
    } catch (error) {
      console.log(`   ❌ DNS lookup failed for ${site.domain}: ${error.message}`);
    }
  });
}

/**
 * Generate domain verification instructions
 */
function generateVerificationInstructions() {
  console.log('\n=== Domain Verification Instructions ===\n');
  
  console.log('1. Add the following DNS records to verify domain ownership:');
  console.log('');
  
  Object.entries(SITES).forEach(([key, site]) => {
    if (!site.domain) return;
    
    console.log(`   ${site.name} (${site.domain}):`);
    console.log(`   TXT: _netlify.${site.domain} → "your-verification-code-from-netlify"`);
    console.log('');
  });
  
  console.log('2. After adding DNS records, run the following commands:');
  console.log('');
  console.log('   netlify domains:verify --site-id <site-id> <domain>');
  console.log('');
  console.log('3. Once verified, SSL certificates will be automatically provisioned.');
  console.log('');
}

/**
 * Create domain configuration summary
 */
function createDomainSummary() {
  const summary = {
    timestamp: new Date().toISOString(),
    sites: {}
  };
  
  Object.entries(SITES).forEach(([key, site]) => {
    summary.sites[key] = {
      name: site.name,
      domain: site.domain,
      aliases: site.aliases,
      netlifyAppId: site.netlifyAppId,
      configPath: site.configPath
    };
  });
  
  fs.writeFileSync('domain-config-summary.json', JSON.stringify(summary, null, 2));
  console.log('\n📄 Domain configuration summary saved to domain-config-summary.json');
}

// CLI interface
if (require.main === module) {
  const command = process.argv[2];
  
  console.log('🌐 Netlify Multi-Site Domain Setup');
  console.log('==================================');
  
  switch (command) {
    case 'validate':
      validateDomainConfig();
      break;
    
    case 'dns-instructions':
      generateDNSInstructions();
      break;
    
    case 'cli-commands':
      generateNetlifyCLICommands();
      break;
    
    case 'check-dns':
      checkDNSResolution();
      break;
    
    case 'verify-instructions':
      generateVerificationInstructions();
      break;
    
    case 'summary':
      createDomainSummary();
      break;
    
    case 'all':
      validateDomainConfig();
      generateDNSInstructions();
      generateNetlifyCLICommands();
      generateVerificationInstructions();
      createDomainSummary();
      break;
    
    default:
      console.log('Usage: node setup-domains.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  validate           - Validate domain configuration');
      console.log('  dns-instructions   - Generate DNS setup instructions');
      console.log('  cli-commands       - Generate Netlify CLI commands');
      console.log('  check-dns          - Check current DNS resolution');
      console.log('  verify-instructions - Generate domain verification steps');
      console.log('  summary            - Create configuration summary');
      console.log('  all                - Run all commands');
      console.log('');
      console.log('Make sure to configure .env.domain first!');
      process.exit(1);
  }
}

module.exports = {
  SITES,
  validateDomainConfig,
  generateDNSInstructions,
  generateNetlifyCLICommands,
  checkDNSResolution,
  generateVerificationInstructions,
  createDomainSummary
};