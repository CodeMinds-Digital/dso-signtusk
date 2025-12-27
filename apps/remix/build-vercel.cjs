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
  const remixDir = __dirname;
  
  console.log('📦 Installing dependencies...');
  
  // Install dependencies from root
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
  
  console.log('🌐 Extracting and compiling translations...');
  // Run translation commands from root where lingui is available
  try {
    execSync('npm run translate', { 
      stdio: 'inherit',
      cwd: rootDir
    });
  } catch (translateError) {
    console.warn('⚠️ Translation step failed, continuing without translations...');
  }
  
  console.log('🏗️ Building Remix application...');
  // Run the build commands directly from remix directory
  execSync('npm run build:app', { 
    stdio: 'inherit',
    cwd: remixDir
  });
  
  execSync('npm run build:server', { 
    stdio: 'inherit',
    cwd: remixDir
  });
  
  console.log('📁 Copying server files...');
  // Copy over the entry point for the server
  const serverMainSrc = path.join(remixDir, 'server/main.js');
  const serverMainDest = path.join(remixDir, 'build/server/main.js');
  
  if (fs.existsSync(serverMainSrc)) {
    fs.copyFileSync(serverMainSrc, serverMainDest);
  }
  
  // Copy over translations if they exist
  const translationsSrc = path.join(rootDir, 'packages/lib/translations');
  const translationsDest = path.join(remixDir, 'build/server/hono/packages/lib/translations');
  
  if (fs.existsSync(translationsSrc)) {
    // Create destination directory if it doesn't exist
    const destDir = path.dirname(translationsDest);
    fs.mkdirSync(destDir, { recursive: true });
    
    // Copy translations recursively
    execSync(`cp -r "${translationsSrc}" "${translationsDest}"`, { 
      stdio: 'inherit'
    });
  }
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.error('Error details:', error);
  process.exit(1);
}