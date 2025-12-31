#!/usr/bin/env node

/**
 * Netlify Deployment Rollback Script
 * 
 * This script provides utilities for rolling back Netlify deployments
 * and managing deployment history for emergency situations.
 */

const https = require('https');

class NetlifyRollbackManager {
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
   * Get site information
   */
  async getSite(siteId) {
    try {
      const site = await this.makeRequest(`/sites/${siteId}`);
      return site;
    } catch (error) {
      console.error(`Error getting site ${siteId}:`, error.message);
      throw error;
    }
  }

  /**
   * List deployments for a site
   */
  async listDeployments(siteId, limit = 20) {
    try {
      const deployments = await this.makeRequest(`/sites/${siteId}/deploys?per_page=${limit}`);
      return deployments.map(deploy => ({
        id: deploy.id,
        state: deploy.state,
        created_at: deploy.created_at,
        updated_at: deploy.updated_at,
        commit_ref: deploy.commit_ref,
        commit_url: deploy.commit_url,
        branch: deploy.branch,
        context: deploy.context,
        deploy_url: deploy.deploy_url,
        deploy_ssl_url: deploy.deploy_ssl_url,
        published_at: deploy.published_at
      }));
    } catch (error) {
      console.error(`Error listing deployments for site ${siteId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get current live deployment
   */
  async getCurrentDeployment(siteId) {
    try {
      const deployments = await this.listDeployments(siteId, 1);
      return deployments.find(deploy => deploy.state === 'ready') || deployments[0];
    } catch (error) {
      console.error(`Error getting current deployment for site ${siteId}:`, error.message);
      throw error;
    }
  }

  /**
   * Rollback to a specific deployment
   */
  async rollbackToDeployment(siteId, deployId) {
    try {
      console.log(`🔄 Rolling back site ${siteId} to deployment ${deployId}...`);
      
      const result = await this.makeRequest(`/sites/${siteId}/deploys/${deployId}/restore`, 'POST');
      
      console.log(`✅ Rollback initiated successfully`);
      console.log(`   New deployment ID: ${result.id}`);
      console.log(`   Status: ${result.state}`);
      
      return result;
    } catch (error) {
      console.error(`Error rolling back to deployment ${deployId}:`, error.message);
      throw error;
    }
  }

  /**
   * Rollback to previous successful deployment
   */
  async rollbackToPrevious(siteId) {
    try {
      const deployments = await this.listDeployments(siteId, 10);
      const successfulDeployments = deployments.filter(deploy => 
        deploy.state === 'ready' && deploy.published_at
      );

      if (successfulDeployments.length < 2) {
        throw new Error('No previous successful deployment found');
      }

      const previousDeployment = successfulDeployments[1]; // Second item is previous
      console.log(`📋 Previous successful deployment found:`);
      console.log(`   ID: ${previousDeployment.id}`);
      console.log(`   Branch: ${previousDeployment.branch}`);
      console.log(`   Commit: ${previousDeployment.commit_ref}`);
      console.log(`   Published: ${previousDeployment.published_at}`);

      return await this.rollbackToDeployment(siteId, previousDeployment.id);
    } catch (error) {
      console.error('Error rolling back to previous deployment:', error.message);
      throw error;
    }
  }

  /**
   * Display deployment history
   */
  displayDeploymentHistory(deployments) {
    console.log('\n📋 Deployment History:');
    console.log('─'.repeat(100));
    console.log('ID'.padEnd(12) + 'State'.padEnd(10) + 'Branch'.padEnd(15) + 'Commit'.padEnd(10) + 'Published');
    console.log('─'.repeat(100));

    deployments.forEach((deploy, index) => {
      const marker = index === 0 ? '→ ' : '  ';
      const id = deploy.id.substring(0, 10);
      const state = deploy.state;
      const branch = deploy.branch || 'unknown';
      const commit = deploy.commit_ref ? deploy.commit_ref.substring(0, 8) : 'unknown';
      const published = deploy.published_at ? 
        new Date(deploy.published_at).toLocaleString() : 
        'not published';

      console.log(
        marker + 
        id.padEnd(10) + 
        state.padEnd(10) + 
        branch.padEnd(15) + 
        commit.padEnd(10) + 
        published
      );
    });
    console.log('─'.repeat(100));
  }

  /**
   * Interactive rollback selection
   */
  async interactiveRollback(siteId) {
    try {
      const site = await this.getSite(siteId);
      console.log(`\n🌐 Site: ${site.name} (${site.url})`);

      const deployments = await this.listDeployments(siteId, 10);
      this.displayDeploymentHistory(deployments);

      // In a real implementation, you would use readline for interactive selection
      // For now, we'll just show how to rollback to the previous deployment
      console.log('\n🔄 Rolling back to previous successful deployment...');
      return await this.rollbackToPrevious(siteId);

    } catch (error) {
      console.error('Error in interactive rollback:', error.message);
      throw error;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  const accessToken = process.env.NETLIFY_ACCESS_TOKEN;
  const siteId = process.argv[2];
  const deployId = process.argv[3];
  const action = process.argv[4] || 'previous';

  if (!accessToken) {
    console.error('❌ NETLIFY_ACCESS_TOKEN environment variable is required');
    process.exit(1);
  }

  if (!siteId) {
    console.error('❌ Site ID is required as first argument');
    console.error('Usage: node netlify-rollback.js <site-id> [deploy-id] [action]');
    console.error('Actions: previous (default), specific, interactive');
    process.exit(1);
  }

  const manager = new NetlifyRollbackManager(accessToken);

  try {
    console.log('🚀 Netlify Rollback Manager');
    
    switch (action) {
      case 'previous':
        await manager.rollbackToPrevious(siteId);
        break;
      
      case 'specific':
        if (!deployId) {
          console.error('❌ Deploy ID is required for specific rollback');
          process.exit(1);
        }
        await manager.rollbackToDeployment(siteId, deployId);
        break;
      
      case 'interactive':
        await manager.interactiveRollback(siteId);
        break;
      
      case 'list':
        const deployments = await manager.listDeployments(siteId, 20);
        manager.displayDeploymentHistory(deployments);
        break;
      
      default:
        console.error(`❌ Unknown action: ${action}`);
        process.exit(1);
    }

    console.log('\n✅ Rollback operation completed!');

  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

// Export for testing
module.exports = { NetlifyRollbackManager };

// Run if called directly
if (require.main === module) {
  main();
}