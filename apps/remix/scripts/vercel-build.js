#!/usr/bin/env node

/**
 * Vercel-specific build script that works without external CLI dependencies
 * Ensures environment variables are loaded programmatically and validates Vercel environment
 */

import { spawn } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VercelBuildManager {
  constructor() {
    this.rootPath = join(__dirname, '../../..');
    this.errors = [];
    this.warnings = [];
    this.info = [];
  }

  /**
   * Environment file precedence for Vercel builds
   */
  getEnvFilePrecedence() {
    const nodeEnv = process.env.NODE_ENV || 'production';
    
    return [
      '.env',                    // Lowest priority - defaults
      `.env.${nodeEnv}`,        // Environment-specific
      '.env.local',             // Highest priority - local overrides (if exists)
    ];
  }

  /**
   * Parse .env file content
   */
  parseEnvFile(content) {
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

  /**
   * Load environment variables with proper precedence
   */
  loadEnvironmentFiles() {
    const envFiles = this.getEnvFilePrecedence();
    const env = { ...process.env }; // Start with system environment variables
    const loadedFiles = [];

    // Load from files in order (later files override earlier ones)
    for (const envFile of envFiles) {
      const filePath = join(this.rootPath, envFile);
      
      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, 'utf8');
          const fileEnv = this.parseEnvFile(content);
          
          // Merge with existing env (file values override existing if not already set)
          Object.assign(env, fileEnv);
          
          loadedFiles.push(envFile);
          this.info.push(`✓ Loaded environment from ${envFile}`);
        } catch (error) {
          this.warnings.push(`Warning: Could not load ${envFile}: ${error.message}`);
        }
      }
    }

    this.info.push(`Environment loaded from: ${loadedFiles.join(', ') || 'system only'}`);
    return env;
  }

  /**
   * Validate Vercel-specific environment requirements
   */
  validateVercelEnvironment(env) {
    let valid = true;

    // Check for Vercel-specific variables
    if (process.env.VERCEL) {
      this.info.push('✓ Running in Vercel environment');
      
      // Validate Vercel-provided variables
      const vercelVars = ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL'];
      for (const varName of vercelVars) {
        if (process.env[varName]) {
          this.info.push(`✓ Vercel variable ${varName}: ${process.env[varName]}`);
        }
      }
    } else {
      this.info.push('ℹ️ Not running in Vercel environment (local build)');
    }

    // Check required build-time variables
    const requiredBuildVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_WEBAPP_URL',
      'NEXT_PUBLIC_APP_URL'
    ];

    const missing = [];
    for (const varName of requiredBuildVars) {
      if (!env[varName] || env[varName].trim() === '') {
        missing.push(varName);
      }
    }

    if (missing.length > 0) {
      this.errors.push(`Missing required build-time variables: ${missing.join(', ')}`);
      this.errors.push('Configure these variables in Vercel dashboard under Environment Variables');
      valid = false;
    }

    return valid;
  }

  /**
   * Validate build dependencies are available
   */
  async validateBuildDependencies() {
    const requiredCommands = [
      { cmd: 'npx', args: ['--version'], name: 'npx' },
      { cmd: 'node', args: ['--version'], name: 'Node.js' }
    ];

    for (const { cmd, args, name } of requiredCommands) {
      try {
        await this.executeCommand(cmd, args, { stdio: 'pipe' });
        this.info.push(`✓ ${name} is available`);
      } catch (error) {
        this.errors.push(`✗ ${name} is not available: ${error.message}`);
        return false;
      }
    }

    // Check for required packages in node_modules
    const requiredPackages = [
      'cross-env',
      'react-router',
      'rollup'
    ];

    for (const pkg of requiredPackages) {
      const packagePath = join(this.rootPath, 'node_modules', pkg);
      if (!existsSync(packagePath)) {
        this.errors.push(`✗ Required package ${pkg} not found in node_modules`);
        return false;
      } else {
        this.info.push(`✓ Package ${pkg} is available`);
      }
    }

    return true;
  }

  /**
   * Execute command with environment
   */
  executeCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        ...options
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

  /**
   * Execute build steps in sequence
   */
  async executeBuildSteps(env) {
    const buildSteps = [
      {
        name: 'React Router Build',
        command: 'npx',
        args: ['react-router', 'build'],
        env: { ...env, NODE_ENV: 'production' }
      },
      {
        name: 'Rollup Build',
        command: 'npx',
        args: ['rollup', '-c', 'rollup.config.mjs'],
        env: { ...env, NODE_ENV: 'production' }
      },
      {
        name: 'Copy Server File',
        command: 'cp',
        args: ['server/main.js', 'build/server/main.js'],
        env
      }
    ];

    for (const step of buildSteps) {
      try {
        console.log(`\n🔨 ${step.name}...`);
        
        const child = spawn(step.command, step.args, {
          stdio: 'inherit',
          env: step.env,
          shell: true,
          cwd: join(this.rootPath, 'apps/remix')
        });

        await new Promise((resolve, reject) => {
          child.on('close', (code) => {
            if (code === 0) {
              console.log(`✅ ${step.name} completed successfully`);
              resolve();
            } else {
              reject(new Error(`${step.name} failed with exit code ${code}`));
            }
          });

          child.on('error', (error) => {
            reject(new Error(`${step.name} failed: ${error.message}`));
          });
        });

      } catch (error) {
        this.errors.push(`Build step "${step.name}" failed: ${error.message}`);
        throw error;
      }
    }
  }

  /**
   * Report validation results
   */
  reportResults() {
    // Info messages
    if (this.info.length > 0) {
      console.log('\nℹ️  Build Information:');
      this.info.forEach(msg => console.log(`   ${msg}`));
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Build Warnings:');
      this.warnings.forEach(msg => console.log(`   ${msg}`));
    }

    // Errors
    if (this.errors.length > 0) {
      console.log('\n❌ Build Errors:');
      this.errors.forEach(msg => console.log(`   ${msg}`));
      console.log('\nBuild cannot proceed with these errors.');
      console.log('Please fix the configuration and try again.');
    }
  }

  /**
   * Run complete Vercel build process
   */
  async build() {
    try {
      console.log('🚀 Starting Vercel-compatible build process...\n');

      // Step 1: Load environment variables
      console.log('📋 Loading environment variables...');
      const env = this.loadEnvironmentFiles();

      // Step 2: Validate Vercel environment
      console.log('\n🔍 Validating Vercel environment...');
      const envValid = this.validateVercelEnvironment(env);
      
      if (!envValid) {
        this.reportResults();
        process.exit(1);
      }

      // Step 3: Validate build dependencies
      console.log('\n🔧 Validating build dependencies...');
      const depsValid = await this.validateBuildDependencies();
      
      if (!depsValid) {
        this.reportResults();
        process.exit(1);
      }

      // Step 4: Execute build steps
      console.log('\n🏗️  Executing build steps...');
      await this.executeBuildSteps(env);

      // Success
      console.log('\n🎉 Vercel build completed successfully!');
      this.reportResults();

    } catch (error) {
      console.error('\n💥 Build failed:', error.message);
      this.reportResults();
      process.exit(1);
    }
  }
}

// Run build if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const buildManager = new VercelBuildManager();
  buildManager.build();
}

export default VercelBuildManager;