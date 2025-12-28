#!/usr/bin/env node

/**
 * Netlify Webhook Handler
 * 
 * This script provides a webhook endpoint handler for Netlify build notifications
 * and status updates. It can be deployed as a serverless function or standalone server.
 */

const http = require('http');
const url = require('url');
const crypto = require('crypto');

class NetlifyWebhookHandler {
  constructor(options = {}) {
    this.secret = options.secret || process.env.NETLIFY_WEBHOOK_SECRET;
    this.slackWebhookUrl = options.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
    this.discordWebhookUrl = options.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL;
    this.emailConfig = options.emailConfig;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload, signature) {
    if (!this.secret) {
      console.warn('⚠️  No webhook secret configured, skipping signature verification');
      return true;
    }

    const expectedSignature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }

  /**
   * Parse Netlify webhook payload
   */
  parseWebhookPayload(body) {
    try {
      const payload = JSON.parse(body);
      
      return {
        id: payload.id,
        site_id: payload.site_id,
        build_id: payload.build_id,
        state: payload.state,
        name: payload.name,
        url: payload.url,
        ssl_url: payload.ssl_url,
        admin_url: payload.admin_url,
        deploy_url: payload.deploy_url,
        deploy_ssl_url: payload.deploy_ssl_url,
        created_at: payload.created_at,
        updated_at: payload.updated_at,
        user_id: payload.user_id,
        error_message: payload.error_message,
        required: payload.required || [],
        required_functions: payload.required_functions || [],
        commit_ref: payload.commit_ref,
        commit_url: payload.commit_url,
        branch: payload.branch,
        context: payload.context,
        title: payload.title,
        review_id: payload.review_id,
        review_url: payload.review_url,
        published_at: payload.published_at
      };
    } catch (error) {
      throw new Error(`Invalid webhook payload: ${error.message}`);
    }
  }

  /**
   * Format deployment message for notifications
   */
  formatDeploymentMessage(deployment, event) {
    const siteName = this.getSiteNameFromUrl(deployment.url) || 'Unknown Site';
    const status = this.getStatusEmoji(deployment.state);
    const timestamp = new Date(deployment.updated_at || deployment.created_at).toLocaleString();

    let message = `${status} **${siteName}** deployment ${deployment.state}\n`;
    message += `📅 ${timestamp}\n`;
    message += `🌿 Branch: ${deployment.branch || 'unknown'}\n`;
    
    if (deployment.commit_ref) {
      message += `📝 Commit: ${deployment.commit_ref.substring(0, 8)}\n`;
    }
    
    if (deployment.context) {
      message += `🏷️ Context: ${deployment.context}\n`;
    }

    if (deployment.state === 'ready' && deployment.ssl_url) {
      message += `🔗 Live URL: ${deployment.ssl_url}\n`;
    }

    if (deployment.deploy_ssl_url && deployment.context === 'deploy-preview') {
      message += `👀 Preview URL: ${deployment.deploy_ssl_url}\n`;
    }

    if (deployment.error_message) {
      message += `❌ Error: ${deployment.error_message}\n`;
    }

    if (deployment.admin_url) {
      message += `⚙️ Admin: ${deployment.admin_url}\n`;
    }

    return message;
  }

  /**
   * Get site name from URL
   */
  getSiteNameFromUrl(siteUrl) {
    if (!siteUrl) return null;
    
    const siteNameMap = {
      'marketing': ['web', 'www', 'main'],
      'remix': ['app', 'remix', 'platform'],
      'docs': ['docs', 'documentation', 'api']
    };

    const urlLower = siteUrl.toLowerCase();
    
    for (const [name, keywords] of Object.entries(siteNameMap)) {
      if (keywords.some(keyword => urlLower.includes(keyword))) {
        return name.charAt(0).toUpperCase() + name.slice(1);
      }
    }

    return null;
  }

  /**
   * Get status emoji for deployment state
   */
  getStatusEmoji(state) {
    const emojiMap = {
      'building': '🔨',
      'ready': '✅',
      'error': '❌',
      'failed': '💥',
      'cancelled': '⏹️',
      'skipped': '⏭️',
      'enqueued': '⏳',
      'processing': '⚙️'
    };

    return emojiMap[state] || '📦';
  }

  /**
   * Send Slack notification
   */
  async sendSlackNotification(message, deployment) {
    if (!this.slackWebhookUrl) {
      console.log('📱 Slack webhook URL not configured, skipping Slack notification');
      return;
    }

    try {
      const payload = {
        text: message,
        attachments: [{
          color: deployment.state === 'ready' ? 'good' : 
                deployment.state === 'error' || deployment.state === 'failed' ? 'danger' : 
                'warning',
          fields: [
            {
              title: 'Deployment ID',
              value: deployment.id,
              short: true
            },
            {
              title: 'Build ID',
              value: deployment.build_id || 'N/A',
              short: true
            }
          ],
          ts: Math.floor(new Date(deployment.updated_at || deployment.created_at).getTime() / 1000)
        }]
      };

      const response = await fetch(this.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Slack API error: ${response.status}`);
      }

      console.log('✅ Slack notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Slack notification:', error.message);
    }
  }

  /**
   * Send Discord notification
   */
  async sendDiscordNotification(message, deployment) {
    if (!this.discordWebhookUrl) {
      console.log('🎮 Discord webhook URL not configured, skipping Discord notification');
      return;
    }

    try {
      const embed = {
        title: `Deployment ${deployment.state}`,
        description: message,
        color: deployment.state === 'ready' ? 0x00ff00 : 
               deployment.state === 'error' || deployment.state === 'failed' ? 0xff0000 : 
               0xffff00,
        timestamp: deployment.updated_at || deployment.created_at,
        fields: [
          {
            name: 'Deployment ID',
            value: deployment.id,
            inline: true
          },
          {
            name: 'Build ID',
            value: deployment.build_id || 'N/A',
            inline: true
          }
        ]
      };

      if (deployment.ssl_url) {
        embed.url = deployment.ssl_url;
      }

      const payload = {
        embeds: [embed]
      };

      const response = await fetch(this.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.status}`);
      }

      console.log('✅ Discord notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error.message);
    }
  }

  /**
   * Handle webhook request
   */
  async handleWebhook(req, res) {
    try {
      // Parse request
      const parsedUrl = url.parse(req.url, true);
      const { site, event } = parsedUrl.query;

      // Read request body
      let body = '';
      req.on('data', chunk => body += chunk);
      
      await new Promise(resolve => req.on('end', resolve));

      // Verify signature if configured
      const signature = req.headers['x-netlify-signature'];
      if (signature && !this.verifySignature(body, signature)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid signature' }));
        return;
      }

      // Parse webhook payload
      const deployment = this.parseWebhookPayload(body);
      
      console.log(`📨 Received webhook for site: ${site}, event: ${event}, state: ${deployment.state}`);

      // Format notification message
      const message = this.formatDeploymentMessage(deployment, event);

      // Send notifications
      await Promise.all([
        this.sendSlackNotification(message, deployment),
        this.sendDiscordNotification(message, deployment)
      ]);

      // Log deployment info
      console.log('📋 Deployment Info:');
      console.log(`   Site: ${site}`);
      console.log(`   State: ${deployment.state}`);
      console.log(`   Branch: ${deployment.branch}`);
      console.log(`   Commit: ${deployment.commit_ref}`);
      console.log(`   URL: ${deployment.ssl_url || deployment.url}`);

      // Respond with success
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        deployment_id: deployment.id
      }));

    } catch (error) {
      console.error('❌ Webhook processing error:', error.message);
      
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Webhook processing failed',
        message: error.message
      }));
    }
  }

  /**
   * Start webhook server
   */
  startServer(port = 3000) {
    const server = http.createServer((req, res) => {
      // Enable CORS
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Netlify-Signature');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method === 'POST') {
        this.handleWebhook(req, res);
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    server.listen(port, () => {
      console.log(`🚀 Netlify webhook handler listening on port ${port}`);
      console.log(`📡 Webhook URL: http://localhost:${port}/webhook`);
    });

    return server;
  }
}

/**
 * Main execution function
 */
async function main() {
  const port = process.env.PORT || 3000;
  const handler = new NetlifyWebhookHandler();
  
  handler.startServer(port);
}

// Export for testing and serverless deployment
module.exports = { NetlifyWebhookHandler };

// Run if called directly
if (require.main === module) {
  main();
}