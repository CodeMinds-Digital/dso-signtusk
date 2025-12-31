#!/usr/bin/env node

/**
 * Generate Secure Secrets for Netlify Environment Variables
 * 
 * This script generates cryptographically secure secrets for use in
 * Netlify environment variables. Run this before setting up your
 * Netlify deployment.
 */

const crypto = require('crypto');

console.log('\n' + '='.repeat(70));
console.log('🔐 NETLIFY SECRETS GENERATOR');
console.log('='.repeat(70));

console.log('\n📋 GENERATED SECRETS FOR NETLIFY ENVIRONMENT VARIABLES:');
console.log('Copy these values to your Netlify dashboard environment variables.\n');

// Generate various types of secrets
const secrets = {
    'NEXTAUTH_SECRET': crypto.randomBytes(32).toString('base64'),
    'JWT_SECRET': crypto.randomBytes(32).toString('base64'),
    'NEXT_PRIVATE_ENCRYPTION_KEY': crypto.randomBytes(32).toString('hex'),
    'NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY': crypto.randomBytes(32).toString('hex'),
    'SESSION_SECRET': crypto.randomBytes(32).toString('base64'),
    'WEBHOOK_SECRET': crypto.randomBytes(24).toString('base64'),
    'NEXT_PRIVATE_SIGNING_PASSPHRASE': crypto.randomBytes(16).toString('base64')
};

// Display secrets in a format ready for copy-paste
Object.entries(secrets).forEach(([key, value]) => {
    console.log(`${key}=${value}`);
});

console.log('\n' + '='.repeat(70));
console.log('🔒 SECURITY NOTES:');
console.log('='.repeat(70));
console.log('1. These secrets are cryptographically secure');
console.log('2. Store them securely - they cannot be regenerated');
console.log('3. Use different secrets for different environments');
console.log('4. Mark as "Sensitive" in Netlify dashboard');
console.log('5. Never commit these to version control');

console.log('\n📝 NETLIFY SETUP INSTRUCTIONS:');
console.log('1. Go to your Netlify site dashboard');
console.log('2. Navigate to: Site Settings → Environment Variables');
console.log('3. Add each variable above');
console.log('4. Check "Sensitive" for all secret values');
console.log('5. Set appropriate scopes (Production/Deploy Preview/Branch Deploy)');

console.log('\n🔄 ADDITIONAL SECRETS YOU NEED TO CONFIGURE:');
console.log('- DATABASE_URL (your PostgreSQL connection string)');
console.log('- NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID (AWS S3 access key)');
console.log('- NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY (AWS S3 secret key)');
console.log('- NEXT_PRIVATE_RESEND_API_KEY (Resend email API key)');
console.log('- NEXT_PRIVATE_STRIPE_API_KEY (Stripe secret key, if using billing)');

console.log('\n' + '='.repeat(70));
console.log('✅ Secrets generated successfully!');
console.log('='.repeat(70) + '\n');