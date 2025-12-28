#!/usr/bin/env node

/**
 * Netlify Deploy Hooks and Webhooks Configuration Script
 * 
 * This script helps configure Netlify deploy hooks and webhooks for the multi-site deployment.
 * It provides utilities for setting up build notifications, status updates, and rollback procedures.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class NetlifyHooksManager {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseUrl = 'https://api.netlify.com/api/v1';
  }

  /**
   * Make authenticated API request to Netlify
   */
  async makeRequest(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        method,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(url, options, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(response);
            } else {
              reject(new Error(`API Error: ${res.statusCode} - ${response.message || body}`));
            }
          } catch (error) {
            reject(new Error(`Parse Error: ${error.message}`));
          }
        });
      });

      req.on('error', reject);

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * List all sites for the authenticated user
   */
  async listSites() {
    try {
      const sites = await this.makeRequest('/sites');
      return sites;
    } catch (error) {
      console.error('Error listing sites:', error.message);
      throw error;
    }
  }

  /**
   * Create a deploy hook for a site
   */
  async createDeployHook(siteId, title, branch = 'main') {
    try {
      const hookData = {
        title,
        branch
      };
      
      const hook = await this.makeRequest(`/sites/${siteId}/build_hooks`, 'POST', hookData);
      console.log(`✅ Created deploy hook for ${title}: ${hook.url}`);
      return hook;
    } catch (error) {
      console.error(`Error creating deploy hook for ${title}:`, error.message);
      throw error;
    }
  }

  /**
   * Create webhook for build notifications
   */
  async createWebhook(siteId, url, event = 'deploy-succeeded') {
    try {
      const webhookData = {
        url,
        event
      };
      
      const webhook = await this.makeRequest(`/sites/${siteId}/hooks`, 'POST', webhookData);
      console.log(`✅ Created webhook for ${event}: ${webhook.id}`);
      return webhook;
    } catch (error) {
      console.error(`Error creating webhook for ${event}:`, error.message);
      throw error;
    }
  }

  /**
   * Get site deployments for rollback purposes
   */
  async getDeployments(siteId, limit = 10) {
    try {
      const deployments = await this.makeRequest(`/sites/${siteId}/deploys?per_page=${limit}`);
      return deployments;
    } catch (error) {
      console.error('Error getting deployments:', error.message);
      throw error;
    }
  }

  /**
   * Rollback to a specific deployment
   */
  async rollbackDeployment(siteId, deployId) {
    try {
      const result = await this.makeRequest(`/sites/${siteId}/deploys/${deployId}/restore`, 'POST');
      console.log(`✅ Rolled back to deployment: ${deployId}`);
      return result;
    } catch (error) {
      console.error(`Error rolling back to deployment ${deployId}:`, error.message);
      throw error;
    }
  }

  /**
   * Setup complete hooks configuration for all sites
   */
  async setupAllHooks(siteConfigs, webhookUrl) {
    const results = {
      deployHooks: {},
      webhooks: {},
      errors: []
    };

    for (const config of siteConfigs) {
      try {
        console.log(`\n🔧 Setting up hooks for ${config.name}...`);
        
        // Create production deploy hook
        const prodHook = await this.createDeployHook(
          config.siteId, 
          `${config.name} Production Deploy`, 
          'main'
        );
        
        // Create preview deploy hook
        const previewHook = await this.createDeployHook(
          config.siteId, 
          `${config.name} Preview Deploy`, 
          'develop'
        );

        results.deployHooks[config.name] = {
          production: prodHook.url,
          preview: previewHook.url
        };

        // Create webhooks for notifications
        if (webhookUrl) {
          const successWebhook = await this.createWebhook(
            config.siteId, 
            `${webhookUrl}?site=${config.name}&event=success`, 
            'deploy-succeeded'
          );
          
          const failureWebhook = await this.createWebhook(
            config.siteId, 
            `${webhookUrl}?site=${config.name}&event=failure`, 
            'deploy-failed'
          );

          results.webhooks[config.name] = {
            success: successWebhook.id,
            failure: failureWebhook.id
          };
        }

      } catch (error) {
        results.errors.push({
          site: config.name,
          error: error.message
        });
      }
    }

    return results;
  }
}

/**
 * Generate GitHub Secrets configuration
 */
function generateGitHubSecrets(deployHooks) {
  console.log('\n📋 GitHub Secrets Configuration:');
  console.log('Add these secrets to your GitHub repository:\n');
  
  for (const [siteName, hooks] of Object.entries(deployHooks)) {
    const secretName = siteName.toUpperCase().replace('-', '_');
    console.log(`NETLIFY_${secretName}_HOOK_PROD=${hooks.production}`);
    console.log(`NETLIFY_${secretName}_HOOK_PREVIEW=${hooks.preview}`);
  }
}

/**
 * Save configuration to file
 */
function saveConfiguration(results, outputPath = 'netlify-hooks-config.json') {
  const config = {
    timestamp: new Date().toISOString(),
    deployHooks: results.deployHooks,
    webhooks: results.webhooks,
    errors: results.errors
  };

  fs.writeFileSync(outputPath, JSON.stringify(config, null, 2));
  console.log(`\n💾 Configuration saved to ${outputPath}`);
}

/**
 * Main execution function
 */
async function main() {
  const accessToken = process.env.NETLIFY_ACCESS_TOKEN;
  const webhookUrl = process.env.WEBHOOK_NOTIFICATION_URL;

  if (!accessToken) {
    console.error('❌ NETLIFY_ACCESS_TOKEN environment variable is required');
    process.exit(1);
  }

  const manager = new NetlifyHooksManager(accessToken);

  try {
    // Example site configurations - update with actual site IDs
    const siteConfigs = [
      { name: 'marketing', siteId: process.env.NETLIFY_MARKETING_SITE_ID },
      { name: 'remix', siteId: process.env.NETLIFY_REMIX_SITE_ID },
      { name: 'docs', siteId: process.env.NETLIFY_DOCS_SITE_ID }
    ].filter(config => config.siteId);

    if (siteConfigs.length === 0) {
      console.error('❌ No site IDs configured. Set NETLIFY_*_SITE_ID environment variables');
      process.exit(1);
    }

    console.log('🚀 Setting up Netlify hooks and webhooks...');
    
    const results = await manager.setupAllHooks(siteConfigs, webhookUrl);
    
    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors encountered:');
      results.errors.forEach(error => {
        console.log(`  - ${error.site}: ${error.error}`);
      });
    }

    generateGitHubSecrets(results.deployHooks);
    saveConfiguration(results);

    console.log('\n✅ Netlify hooks setup completed!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Export for testing
module.exports = { NetlifyHooksManager, generateGitHubSecrets, saveConfiguration };

// Run if called directly
if (require.main === module) {
  main();
}