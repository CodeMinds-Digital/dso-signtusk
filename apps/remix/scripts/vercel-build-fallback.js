#!/usr/bin/env node

/**
 * Vercel fallback build script - minimal approach when main build fails
 * Uses only essential commands and basic environment loading
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Simple environment loader
 */
function loadBasicEnvironment() {
  const env = { ...process.env };
  
  // Try to load .env file if it exists
  const envPath = join(__dirname, '../../../.env');
  if (existsSync(envPath)) {
    try {
      const content = readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').replace(/^["']|["']$/g, '');
          env[key.trim()] = value;
        }
      }
      
      console.log('✓ Basic environment loaded from .env');
    } catch (error) {
      console.warn('Warning: Could not load .env file:', error.message);
    }
  }
  
  // Ensure NODE_ENV is set
  if (!env.NODE_ENV) {
    env.NODE_ENV = 'production';
  }
  
  return env;
}

/**
 * Execute command with basic error handling
 */
function executeCommand(command, args, env) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      env,
      shell: true,
      cwd: join(__dirname, '..')
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function fallbackBuild() {
  try {
    console.log('🔄 Starting fallback Vercel build...');
    
    // Load basic environment
    const env = loadBasicEnvironment();
    
    // Simple build steps
    console.log('\n1️⃣ Building React Router app...');
    await executeCommand('npx', ['react-router', 'build'], env);
    
    console.log('\n2️⃣ Building server with Rollup...');
    await executeCommand('npx', ['rollup', '-c', 'rollup.config.mjs'], env);
    
    console.log('\n3️⃣ Copying server file...');
    await executeCommand('cp', ['server/main.js', 'build/server/main.js'], env);
    
    console.log('\n✅ Fallback build completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Fallback build failed:', error.message);
    console.error('\nTrying minimal build approach...');
    
    try {
      // Ultra-minimal approach
      const env = { ...process.env, NODE_ENV: 'production' };
      
      console.log('Minimal React Router build...');
      await executeCommand('npx', ['react-router', 'build'], env);
      
      console.log('✅ Minimal build completed!');
    } catch (minimalError) {
      console.error('❌ All build approaches failed:', minimalError.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  fallbackBuild();
}

export { fallbackBuild };
