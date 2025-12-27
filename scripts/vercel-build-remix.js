#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting optimized Vercel build for Remix app...');

try {
  // Set environment variables for build optimization
  process.env.TURBO_TELEMETRY_DISABLED = '1';
  process.env.NODE_ENV = 'production';
  
  console.log('📦 Installing dependencies with npm ci...');
  execSync('npm ci --prefer-offline --no-audit --no-fund', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('🔧 Building Remix application with Turbo...');
  execSync('npm run build --workspace=@signtusk/remix', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}