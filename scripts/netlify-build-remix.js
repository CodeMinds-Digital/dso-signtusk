#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Netlify build for Remix app...');

try {
  // Change to repository root
  process.chdir(path.join(__dirname, '..'));
  
  // Set up environment variables for build
  const npmFlags = process.env.NPM_FLAGS || '--include=dev';
  const nodeEnv = process.env.NODE_ENV || 'production';
  
  console.log(`📦 Installing dependencies with flags: ${npmFlags}...`);
  console.log(`🔧 Building in ${nodeEnv} mode...`);
  
  // Install dependencies with proper flags
  const installCommand = `npm ci ${npmFlags}`;
  execSync(installCommand, { stdio: 'inherit' });
  
  console.log('🔧 Building Remix application...');
  execSync('npm run build --workspace=@signtusk/remix', { 
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: nodeEnv
    }
  });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}