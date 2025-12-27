#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Netlify build for Remix app...');

try {
  // Change to repository root
  process.chdir(path.join(__dirname, '..'));
  
  console.log('📦 Installing dependencies...');
  execSync('npm ci', { stdio: 'inherit' });
  
  console.log('🔧 Building Remix application...');
  execSync('npm run build --workspace=@signtusk/remix', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}