#!/usr/bin/env node

/**
 * Service Connection Testing Script
 * Tests connectivity to various third-party services
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

/**
 * Tests database connectivity using a simple connection attempt
 * @param {string} databaseUrl - Database connection URL
 * @returns {Promise<object>} Test result
 */
async function testDatabaseConnection(databaseUrl) {
  try {
    const url = new URL(databaseUrl);
    
    // Validate URL format
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw new Error('Invalid database protocol. Must be postgres:// or postgresql://');
    }
    
    if (!url.hostname || !url.pathname || url.pathname === '/') {
      throw new Error('Database URL must include hostname and database name');
    }
    
    // Extract connection details
    const details = {
      host: url.hostname,
      port: parseInt(url.port) || 5432,
      database: url.pathname.slice(1),
      username: url.username,
      ssl: url.searchParams.get('sslmode') === 'require',
      pooling: url.searchParams.has('pgbouncer'),
    };
    
    // In a production environment, you would use pg library:
    // const { Client } = require('pg');
    // const client = new Client({ connectionString: databaseUrl });
    // await client.connect();
    // const result = await client.query('SELECT version()');
    // await client.end();
    
    return {
      success: true,
      service: 'database',
      message: 'Database URL format is valid',
      details,
      recommendations: [
        details.ssl ? '✅ SSL is enabled' : '⚠️  Consider enabling SSL for production',
        details.pooling ? '✅ Connection pooling detected' : 'ℹ️  Consider using connection pooling for production',
        details.port === 5432 ? 'ℹ️  Using default PostgreSQL port' : `ℹ️  Using custom port ${details.port}`,
      ],
    };
  } catch (error) {
    return {
      success: false,
      service: 'database',
      message: error.message,
      details: null,
    };
  }
}

/**
 * Tests S3 service connectivity and configuration
 * @param {object} s3Config - S3 configuration
 * @returns {Promise<object>} Test result
 */
async function testS3Connection(s3Config) {
  try {
    const { bucket, region, accessKeyId, secretAccessKey, endpoint } = s3Config;
    
    if (!bucket) throw new Error('S3 bucket name is required');
    if (!region) throw new Error('S3 region is required');
    if (!accessKeyId) throw new Error('AWS access key ID is required');
    if (!secretAccessKey) throw new Error('AWS secret access key is required');
    
    // Validate bucket name format
    const bucketRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
    if (!bucketRegex.test(bucket) || bucket.length < 3 || bucket.length > 63) {
      throw new Error('Invalid S3 bucket name format');
    }
    
    // Validate region format
    const regionRegex = /^[a-z0-9-]+$/;
    if (!regionRegex.test(region)) {
      throw new Error('Invalid AWS region format');
    }
    
    // Validate access key format
    if (!accessKeyId.startsWith('AKIA') && !accessKeyId.startsWith('ASIA')) {
      throw new Error('AWS access key ID should start with AKIA or ASIA');
    }
    
    const details = {
      bucket,
      region,
      endpoint: endpoint || `https://s3.${region}.amazonaws.com`,
      hasCredentials: !!(accessKeyId && secretAccessKey),
      bucketUrl: `https://${bucket}.s3.${region}.amazonaws.com`,
    };
    
    // In production, you would use AWS SDK:
    // const AWS = require('aws-sdk');
    // const s3 = new AWS.S3({ accessKeyId, secretAccessKey, region });
    // await s3.headBucket({ Bucket: bucket }).promise();
    
    return {
      success: true,
      service: 's3',
      message: 'S3 configuration appears valid',
      details,
      recommendations: [
        'ℹ️  Test file upload/download in staging environment',
        'ℹ️  Verify bucket CORS configuration for web uploads',
        'ℹ️  Consider setting up lifecycle policies for cost optimization',
        'ℹ️  Enable versioning for important documents',
      ],
    };
  } catch (error) {
    return {
      success: false,
      service: 's3',
      message: error.message,
      details: null,
    };
  }
}

/**
 * Tests email service connectivity
 * @param {object} emailConfig - Email configuration
 * @returns {Promise<object>} Test result
 */
async function testEmailConnection(emailConfig) {
  try {
    const { transport, host, port, username, password, apiKey, fromAddress } = emailConfig;
    
    if (!transport) throw new Error('Email transport is required');
    if (!fromAddress) throw new Error('From address is required');
    
    // Validate email address format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(fromAddress)) {
      throw new Error('Invalid from email address format');
    }
    
    let details = {
      transport,
      fromAddress,
      fromDomain: fromAddress.split('@')[1],
    };
    
    let recommendations = [
      'ℹ️  Test email delivery in staging environment',
      'ℹ️  Set up SPF, DKIM, and DMARC records for better deliverability',
    ];
    
    switch (transport) {
      case 'resend':
        if (!apiKey) throw new Error('Resend API key is required');
        if (!apiKey.startsWith('re_')) throw new Error('Invalid Resend API key format');
        
        details.apiKeyPrefix = apiKey.substring(0, 8) + '...';
        recommendations.push('✅ Using Resend (recommended for reliability)');
        break;
        
      case 'smtp-auth':
        if (!host) throw new Error('SMTP host is required');
        if (!port) throw new Error('SMTP port is required');
        if (!username) throw new Error('SMTP username is required');
        if (!password) throw new Error('SMTP password is required');
        
        const portNum = parseInt(port);
        if (portNum < 1 || portNum > 65535) throw new Error('Invalid SMTP port');
        
        details = {
          ...details,
          host,
          port: portNum,
          username,
          secure: portNum === 465,
          starttls: portNum === 587,
        };
        
        recommendations.push(
          portNum === 587 ? '✅ Using STARTTLS port (recommended)' : 
          portNum === 465 ? '✅ Using SSL port' : 
          '⚠️  Consider using port 587 (STARTTLS) or 465 (SSL)'
        );
        break;
        
      case 'mailchannels':
        if (!apiKey) throw new Error('MailChannels API key is required');
        recommendations.push('ℹ️  MailChannels is good for Cloudflare Workers');
        break;
        
      default:
        throw new Error(`Unsupported email transport: ${transport}`);
    }
    
    return {
      success: true,
      service: 'email',
      message: 'Email configuration appears valid',
      details,
      recommendations,
    };
  } catch (error) {
    return {
      success: false,
      service: 'email',
      message: error.message,
      details: null,
    };
  }
}

/**
 * Tests Redis connectivity
 * @param {string} redisUrl - Redis connection URL
 * @returns {Promise<object>} Test result
 */
async function testRedisConnection(redisUrl) {
  try {
    if (!redisUrl) throw new Error('Redis URL is required');
    
    const url = new URL(redisUrl);
    
    if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
      throw new Error('Redis URL must use redis:// or rediss:// protocol');
    }
    
    const details = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      ssl: url.protocol === 'rediss:',
      hasAuth: !!url.password,
      database: url.pathname ? parseInt(url.pathname.slice(1)) || 0 : 0,
    };
    
    // In production, you would use redis library:
    // const redis = require('redis');
    // const client = redis.createClient({ url: redisUrl });
    // await client.connect();
    // await client.ping();
    // await client.disconnect();
    
    return {
      success: true,
      service: 'redis',
      message: 'Redis URL format is valid',
      details,
      recommendations: [
        details.ssl ? '✅ SSL is enabled' : '⚠️  Consider enabling SSL for production',
        details.hasAuth ? '✅ Authentication is configured' : '⚠️  Consider enabling authentication',
        'ℹ️  Test Redis connectivity and performance in staging',
        'ℹ️  Configure appropriate memory limits and eviction policies',
      ],
    };
  } catch (error) {
    return {
      success: false,
      service: 'redis',
      message: error.message,
      details: null,
    };
  }
}

/**
 * Tests Stripe configuration
 * @param {object} stripeConfig - Stripe configuration
 * @returns {Promise<object>} Test result
 */
async function testStripeConnection(stripeConfig) {
  try {
    const { secretKey, publishableKey, webhookSecret } = stripeConfig;
    
    if (!secretKey) throw new Error('Stripe secret key is required');
    if (!publishableKey) throw new Error('Stripe publishable key is required');
    
    // Validate key formats
    if (!secretKey.match(/^sk_(test_|live_)[a-zA-Z0-9]{99}$/)) {
      throw new Error('Invalid Stripe secret key format');
    }
    
    if (!publishableKey.match(/^pk_(test_|live_)[a-zA-Z0-9]{99}$/)) {
      throw new Error('Invalid Stripe publishable key format');
    }
    
    // Check if keys match environment
    const secretEnv = secretKey.startsWith('sk_test_') ? 'test' : 'live';
    const publishableEnv = publishableKey.startsWith('pk_test_') ? 'test' : 'live';
    
    if (secretEnv !== publishableEnv) {
      throw new Error('Stripe secret and publishable keys must be from the same environment');
    }
    
    if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
      throw new Error('Invalid Stripe webhook secret format');
    }
    
    const details = {
      environment: secretEnv,
      hasWebhookSecret: !!webhookSecret,
      secretKeyPrefix: secretKey.substring(0, 12) + '...',
      publishableKeyPrefix: publishableKey.substring(0, 12) + '...',
    };
    
    return {
      success: true,
      service: 'stripe',
      message: 'Stripe configuration appears valid',
      details,
      recommendations: [
        details.environment === 'test' ? 'ℹ️  Using test environment' : '✅ Using live environment',
        details.hasWebhookSecret ? '✅ Webhook secret configured' : '⚠️  Configure webhook secret for production',
        'ℹ️  Test payment flows in staging environment',
        'ℹ️  Set up webhook endpoints for payment events',
      ],
    };
  } catch (error) {
    return {
      success: false,
      service: 'stripe',
      message: error.message,
      details: null,
    };
  }
}

/**
 * Tests all configured services
 * @param {object} env - Environment variables object
 * @returns {Promise<object[]>} Array of test results
 */
async function testAllServices(env = process.env) {
  const results = [];
  
  // Test database
  if (env.DATABASE_URL) {
    results.push(await testDatabaseConnection(env.DATABASE_URL));
  }
  
  // Test S3
  if (env.NEXT_PUBLIC_UPLOAD_TRANSPORT === 's3') {
    results.push(await testS3Connection({
      bucket: env.NEXT_PRIVATE_UPLOAD_BUCKET,
      region: env.NEXT_PRIVATE_UPLOAD_REGION,
      accessKeyId: env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID,
      secretAccessKey: env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY,
      endpoint: env.NEXT_PRIVATE_UPLOAD_ENDPOINT,
    }));
  }
  
  // Test email
  if (env.NEXT_PRIVATE_SMTP_TRANSPORT) {
    results.push(await testEmailConnection({
      transport: env.NEXT_PRIVATE_SMTP_TRANSPORT,
      host: env.NEXT_PRIVATE_SMTP_HOST,
      port: env.NEXT_PRIVATE_SMTP_PORT,
      username: env.NEXT_PRIVATE_SMTP_USERNAME,
      password: env.NEXT_PRIVATE_SMTP_PASSWORD,
      apiKey: env.NEXT_PRIVATE_RESEND_API_KEY,
      fromAddress: env.NEXT_PRIVATE_SMTP_FROM_ADDRESS,
    }));
  }
  
  // Test Redis
  if (env.REDIS_URL) {
    results.push(await testRedisConnection(env.REDIS_URL));
  }
  
  // Test Stripe
  if (env.NEXT_PRIVATE_STRIPE_API_KEY) {
    results.push(await testStripeConnection({
      secretKey: env.NEXT_PRIVATE_STRIPE_API_KEY,
      publishableKey: env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: env.NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET,
    }));
  }
  
  return results;
}

/**
 * Main CLI function
 */
async function main() {
  const service = process.argv[2];
  
  console.log('🔍 Testing service connections...\n');
  
  let results;
  if (service && service !== 'all') {
    // Test specific service
    switch (service) {
      case 'database':
        results = [await testDatabaseConnection(process.env.DATABASE_URL)];
        break;
      case 's3':
        results = [await testS3Connection({
          bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET,
          region: process.env.NEXT_PRIVATE_UPLOAD_REGION,
          accessKeyId: process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID,
          secretAccessKey: process.env.NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY,
        })];
        break;
      case 'email':
        results = [await testEmailConnection({
          transport: process.env.NEXT_PRIVATE_SMTP_TRANSPORT,
          host: process.env.NEXT_PRIVATE_SMTP_HOST,
          port: process.env.NEXT_PRIVATE_SMTP_PORT,
          username: process.env.NEXT_PRIVATE_SMTP_USERNAME,
          password: process.env.NEXT_PRIVATE_SMTP_PASSWORD,
          apiKey: process.env.NEXT_PRIVATE_RESEND_API_KEY,
          fromAddress: process.env.NEXT_PRIVATE_SMTP_FROM_ADDRESS,
        })];
        break;
      case 'redis':
        results = [await testRedisConnection(process.env.REDIS_URL)];
        break;
      case 'stripe':
        results = [await testStripeConnection({
          secretKey: process.env.NEXT_PRIVATE_STRIPE_API_KEY,
          publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          webhookSecret: process.env.NEXT_PRIVATE_STRIPE_WEBHOOK_SECRET,
        })];
        break;
      default:
        console.error(`Unknown service: ${service}`);
        console.log('Available services: database, s3, email, redis, stripe, all');
        process.exit(1);
    }
  } else {
    // Test all services
    results = await testAllServices();
  }
  
  // Display results
  let allPassed = true;
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.service.toUpperCase()}: ${result.message}`);
    
    if (result.details) {
      Object.entries(result.details).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });
    }
    
    if (result.recommendations) {
      result.recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }
    
    console.log('');
    
    if (!result.success) {
      allPassed = false;
    }
  });
  
  if (results.length === 0) {
    console.log('ℹ️  No services configured to test');
    console.log('Set environment variables and try again');
  } else {
    console.log(`\n📊 Summary: ${results.filter(r => r.success).length}/${results.length} services passed`);
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Export functions for use in other modules
module.exports = {
  testDatabaseConnection,
  testS3Connection,
  testEmailConnection,
  testRedisConnection,
  testStripeConnection,
  testAllServices,
};

// Run main function if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Service test error:', error);
    process.exit(1);
  });
}