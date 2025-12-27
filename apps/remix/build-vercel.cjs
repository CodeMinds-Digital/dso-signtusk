#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Vercel build for Remix app...');

try {
  // Set environment variables
  process.env.TURBO_TELEMETRY_DISABLED = '1';
  process.env.INSTALL_PLAYWRIGHT = 'false';
  process.env.NODE_ENV = 'production';
  
  const rootDir = path.join(__dirname, '../..');
  
  console.log('📦 Installing dependencies...');
  
  // First, try to install with scripts to get patch-package
  try {
    execSync('npm ci', { 
      stdio: 'inherit',
      cwd: rootDir,
      timeout: 300000 // 5 minutes timeout
    });
  } catch (error) {
    console.warn('⚠️ Full install failed, trying without scripts...');
    
    // If that fails, install without scripts and manually handle patches
    execSync('npm ci --ignore-scripts', { 
      stdio: 'inherit',
      cwd: rootDir
    });
    
    // Try to run patch-package if it exists
    try {
      execSync('npx patch-package', { 
        stdio: 'inherit',
        cwd: rootDir
      });
    } catch (patchError) {
      console.warn('⚠️ Patch-package not available, continuing without patches...');
    }
  }
  
  console.log('🏗️ Building Remix application...');
  execSync('npm run build --workspace=@signtusk/remix', { 
    stdio: 'inherit',
    cwd: rootDir
  });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}