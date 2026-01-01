#!/usr/bin/env node

/**
 * Vercel-compatible build script that loads environment variables programmatically
 * Replaces the need for dotenv CLI command
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment file precedence (highest to lowest priority)
function getEnvFilePrecedence() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return [
    '.env',                    // Lowest priority - defaults
    `.env.${nodeEnv}`,        // Environment-specific
    '.env.local',             // Highest priority - local overrides
  ];
}

// Parse .env file content
function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    // Parse key=value pairs
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex === -1) {
      continue;
    }

    const key = trimmed.substring(0, equalIndex).trim();
    let value = trimmed.substring(equalIndex + 1).trim();

    // Remove surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    env[key] = value;
  }

  return env;
}

// Load environment variables from files with proper precedence
function loadEnvironmentFiles(rootPath = process.cwd()) {
  const envFiles = getEnvFilePrecedence();
  const env = { ...process.env }; // Start with system environment variables
  const loadedFiles = [];

  // Load from files in order (later files override earlier ones)
  for (const envFile of envFiles) {
    const filePath = join(rootPath, envFile);
    
    if (existsSync(filePath)) {
      try {
        const content = readFileSync(filePath, 'utf8');
        const fileEnv = parseEnvFile(content);
        
        // Merge with existing env (file values override existing if not already set)
        Object.assign(env, fileEnv);
        
        loadedFiles.push(envFile);
        console.log(`✓ Loaded environment from ${envFile}`);
      } catch (error) {
        console.warn(`Warning: Could not load ${envFile}: ${error.message}`);
      }
    }
  }

  console.log(`Environment loaded from: ${loadedFiles.join(', ') || 'system only'}`);
  return env;
}

// Execute command with loaded environment
function executeWithEnv(command, args, env) {
  return new Promise((resolve, reject) => {
    console.log(`Executing: ${command} ${args.join(' ')}`);
    
    const child = spawn(command, args, {
      stdio: 'inherit',
      env: { ...env },
      shell: true
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

async function main() {
  try {
    // Get the root path (two levels up from apps/remix/scripts)
    const rootPath = join(__dirname, '../../..');
    
    // Load environment variables
    console.log('Loading environment variables...');
    const env = loadEnvironmentFiles(rootPath);
    
    // Get command line arguments (everything after the script name)
    const commandArgs = process.argv.slice(2);
    
    if (commandArgs.length === 0) {
      console.error('Usage: node build-with-env.js <command> [args...]');
      process.exit(1);
    }

    // Execute the command with loaded environment
    await executeWithEnv(commandArgs[0], commandArgs.slice(1), env);
    
    console.log('✓ Command completed successfully');
  } catch (error) {
    console.error('✗ Build failed:', error.message);
    process.exit(1);
  }
}

main();