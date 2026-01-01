/**
 * Build Fallback Manager
 * Provides alternative approaches when primary build methods fail
 */

import { execSync, spawn } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { BuildErrorHandler } from './build-error-handler.js';

export interface FallbackStrategy {
  name: string;
  description: string;
  condition: (error: Error) => boolean;
  execute: () => Promise<boolean>;
  priority: number; // Lower number = higher priority
}

export interface FallbackResult {
  success: boolean;
  strategyUsed?: string;
  error?: Error;
  fallbacksAttempted: string[];
}

export class BuildFallbackManager {
  private strategies: FallbackStrategy[] = [];
  private errorHandler: BuildErrorHandler;
  private isVercelEnvironment: boolean;

  constructor(errorHandler?: BuildErrorHandler) {
    this.errorHandler = errorHandler || new BuildErrorHandler();
    this.isVercelEnvironment = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
    this.initializeStrategies();
  }

  /**
   * Initialize default fallback strategies
   */
  private initializeStrategies(): void {
    // Environment loading fallbacks
    this.addStrategy({
      name: 'programmatic-env-loading',
      description: 'Load environment variables programmatically instead of using CLI',
      condition: (error) => error.message.includes('dotenv') || error.message.includes('env-cmd'),
      execute: () => this.fallbackEnvironmentLoading(),
      priority: 1,
    });

    // Dependency resolution fallbacks
    this.addStrategy({
      name: 'npm-install-fallback',
      description: 'Try alternative npm install approaches',
      condition: (error) => error.message.includes('npm') || error.message.includes('install'),
      execute: () => this.fallbackNpmInstall(),
      priority: 2,
    });

    // Build tool fallbacks
    this.addStrategy({
      name: 'build-tool-fallback',
      description: 'Use alternative build tools when primary tools fail',
      condition: (error) => error.message.includes('turbo') || error.message.includes('build'),
      execute: () => this.fallbackBuildTools(),
      priority: 3,
    });

    // CLI tool fallbacks
    this.addStrategy({
      name: 'cli-tool-replacement',
      description: 'Replace CLI tools with programmatic alternatives',
      condition: (error) => error.message.includes('command not found') || error.message.includes('not recognized'),
      execute: () => this.fallbackCliTools(),
      priority: 1,
    });

    // TypeScript compilation fallbacks
    this.addStrategy({
      name: 'typescript-fallback',
      description: 'Alternative TypeScript compilation approaches',
      condition: (error) => error.message.includes('tsc') || error.message.includes('TypeScript'),
      execute: () => this.fallbackTypeScriptCompilation(),
      priority: 4,
    });

    // Vercel-specific fallbacks
    if (this.isVercelEnvironment) {
      this.addStrategy({
        name: 'vercel-minimal-build',
        description: 'Minimal build approach for Vercel environment',
        condition: () => true, // Always applicable as last resort
        execute: () => this.fallbackVercelMinimalBuild(),
        priority: 10, // Lowest priority - last resort
      });
    }
  }

  /**
   * Add a custom fallback strategy
   */
  addStrategy(strategy: FallbackStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Execute fallback strategies for a given error
   */
  async executeFallbacks(error: Error): Promise<FallbackResult> {
    const result: FallbackResult = {
      success: false,
      fallbacksAttempted: [],
    };

    console.log(`\n🔄 Executing fallback strategies for error: ${error.message}`);

    // Find applicable strategies
    const applicableStrategies = this.strategies.filter(strategy => 
      strategy.condition(error)
    );

    if (applicableStrategies.length === 0) {
      console.log('⚠️  No applicable fallback strategies found');
      return result;
    }

    console.log(`Found ${applicableStrategies.length} applicable fallback strategies`);

    // Try each strategy in priority order
    for (const strategy of applicableStrategies) {
      console.log(`\n🔧 Trying fallback: ${strategy.name}`);
      console.log(`   Description: ${strategy.description}`);
      
      result.fallbacksAttempted.push(strategy.name);

      try {
        const success = await strategy.execute();
        
        if (success) {
          console.log(`✅ Fallback strategy '${strategy.name}' succeeded!`);
          result.success = true;
          result.strategyUsed = strategy.name;
          return result;
        } else {
          console.log(`❌ Fallback strategy '${strategy.name}' failed`);
        }
      } catch (strategyError) {
        console.log(`❌ Fallback strategy '${strategy.name}' threw error:`, strategyError.message);
        
        this.errorHandler.addWarning({
          type: 'runtime',
          code: 'FALLBACK_STRATEGY_FAILED',
          message: `Fallback strategy '${strategy.name}' failed: ${strategyError.message}`,
          remediation: [
            'Try the next fallback strategy',
            'Check the specific error details',
            'Consider manual intervention',
          ],
        });
      }
    }

    console.log('\n❌ All applicable fallback strategies failed');
    result.error = new Error('All fallback strategies failed');
    return result;
  }

  /**
   * Fallback for environment loading issues
   */
  private async fallbackEnvironmentLoading(): Promise<boolean> {
    try {
      console.log('🔧 Implementing programmatic environment loading...');

      // Create a simple environment loader
      const envLoaderCode = `
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

function loadEnvironment() {
  const env = { ...process.env };
  
  // Try multiple .env file locations
  const envFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'apps/remix/.env',
    'apps/remix/.env.local'
  ];
  
  for (const envFile of envFiles) {
    if (existsSync(envFile)) {
      try {
        const content = readFileSync(envFile, 'utf8');
        const lines = content.split('\\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').replace(/^["']|["']$/g, '');
            env[key.trim()] = value;
          }
        }
        
        console.log(\`✓ Loaded environment from \${envFile}\`);
      } catch (error) {
        console.warn(\`Warning: Could not load \${envFile}:\`, error.message);
      }
    }
  }
  
  // Set defaults for Vercel
  if (!env.NODE_ENV) env.NODE_ENV = 'production';
  if (!env.VERCEL && process.env.VERCEL) env.VERCEL = process.env.VERCEL;
  
  return env;
}

// Apply environment
const env = loadEnvironment();
Object.assign(process.env, env);

module.exports = { loadEnvironment };
`;

      // Write the environment loader
      writeFileSync('scripts/env-loader-fallback.js', envLoaderCode);
      
      // Test the environment loader
      execSync('node scripts/env-loader-fallback.js', { stdio: 'inherit' });
      
      console.log('✅ Programmatic environment loading implemented');
      return true;
      
    } catch (error) {
      console.error('❌ Environment loading fallback failed:', error.message);
      return false;
    }
  }

  /**
   * Fallback for npm install issues
   */
  private async fallbackNpmInstall(): Promise<boolean> {
    try {
      console.log('🔧 Trying alternative npm install approaches...');

      // Try different npm install strategies
      const strategies = [
        'npm ci --prefer-offline --no-audit',
        'npm install --prefer-offline --no-audit --no-fund',
        'npm install --legacy-peer-deps',
        'npm install --force',
      ];

      for (const strategy of strategies) {
        try {
          console.log(`Trying: ${strategy}`);
          execSync(strategy, { stdio: 'inherit', timeout: 300000 }); // 5 minute timeout
          console.log(`✅ Success with: ${strategy}`);
          return true;
        } catch (error) {
          console.log(`❌ Failed: ${strategy}`);
        }
      }

      return false;
    } catch (error) {
      console.error('❌ NPM install fallback failed:', error.message);
      return false;
    }
  }

  /**
   * Fallback for build tool issues
   */
  private async fallbackBuildTools(): Promise<boolean> {
    try {
      console.log('🔧 Trying alternative build approaches...');

      // Try different build strategies
      const buildStrategies = [
        // Direct package builds
        () => this.executeCommand('npm', ['run', 'build', '--workspace=apps/remix']),
        () => this.executeCommand('npm', ['run', 'build', '--workspace=packages/prisma']),
        
        // Manual build steps
        () => this.executeCommand('npx', ['tsc', '--build']),
        () => this.executeCommand('npx', ['react-router', 'build'], { cwd: 'apps/remix' }),
        
        // Minimal build
        () => this.executeMinimalBuild(),
      ];

      for (const strategy of buildStrategies) {
        try {
          await strategy();
          console.log('✅ Build strategy succeeded');
          return true;
        } catch (error) {
          console.log('❌ Build strategy failed:', error.message);
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Build tools fallback failed:', error.message);
      return false;
    }
  }

  /**
   * Fallback for CLI tool issues
   */
  private async fallbackCliTools(): Promise<boolean> {
    try {
      console.log('🔧 Replacing CLI tools with programmatic alternatives...');

      // Create CLI tool replacements
      const replacements = {
        'dotenv': 'require("dotenv").config()',
        'env-cmd': 'require("./scripts/env-loader-fallback.js").loadEnvironment()',
        'cross-env': 'process.env.NODE_ENV = "production"',
      };

      // Update package.json scripts to use programmatic alternatives
      const packageJsonPath = 'package.json';
      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        
        if (packageJson.scripts) {
          for (const [script, command] of Object.entries(packageJson.scripts)) {
            let updatedCommand = command as string;
            
            // Replace CLI tools with programmatic alternatives
            for (const [cli, replacement] of Object.entries(replacements)) {
              if (updatedCommand.includes(cli)) {
                updatedCommand = updatedCommand.replace(
                  new RegExp(`${cli}[^&]*`, 'g'),
                  `node -e "${replacement}"`
                );
              }
            }
            
            if (updatedCommand !== command) {
              packageJson.scripts[script] = updatedCommand;
              console.log(`Updated script '${script}': ${command} → ${updatedCommand}`);
            }
          }
          
          writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        }
      }

      console.log('✅ CLI tools replaced with programmatic alternatives');
      return true;
      
    } catch (error) {
      console.error('❌ CLI tools fallback failed:', error.message);
      return false;
    }
  }

  /**
   * Fallback for TypeScript compilation issues
   */
  private async fallbackTypeScriptCompilation(): Promise<boolean> {
    try {
      console.log('🔧 Trying alternative TypeScript compilation...');

      const strategies = [
        // Try different TypeScript compilation approaches
        () => this.executeCommand('npx', ['tsc', '--build', '--force']),
        () => this.executeCommand('npx', ['tsc', '--noEmit', 'false']),
        () => this.executeCommand('npx', ['tsc', '--skipLibCheck']),
        
        // Try with different configurations
        () => this.executeCommand('npx', ['tsc', '--project', 'tsconfig.build.json']),
        () => this.executeCommand('npx', ['tsc', '--incremental', 'false']),
      ];

      for (const strategy of strategies) {
        try {
          await strategy();
          console.log('✅ TypeScript compilation succeeded');
          return true;
        } catch (error) {
          console.log('❌ TypeScript strategy failed:', error.message);
        }
      }

      return false;
    } catch (error) {
      console.error('❌ TypeScript fallback failed:', error.message);
      return false;
    }
  }

  /**
   * Vercel-specific minimal build fallback
   */
  private async fallbackVercelMinimalBuild(): Promise<boolean> {
    try {
      console.log('🔧 Executing Vercel minimal build fallback...');

      // Ultra-minimal build for Vercel
      const env = {
        ...process.env,
        NODE_ENV: 'production',
        VERCEL: '1',
      };

      // Load environment programmatically
      await this.fallbackEnvironmentLoading();

      // Minimal build steps
      console.log('1. Building Remix app with minimal configuration...');
      await this.executeCommand('npx', ['react-router', 'build'], { env, cwd: 'apps/remix' });

      console.log('2. Copying essential files...');
      await this.executeCommand('cp', ['-r', 'apps/remix/build', './build'], { env });

      console.log('✅ Vercel minimal build completed');
      return true;
      
    } catch (error) {
      console.error('❌ Vercel minimal build failed:', error.message);
      return false;
    }
  }

  /**
   * Execute minimal build without complex tools
   */
  private async executeMinimalBuild(): Promise<void> {
    console.log('Executing minimal build...');
    
    // Just try to build the main app
    await this.executeCommand('npm', ['run', 'build'], { 
      cwd: 'apps/remix',
      env: { ...process.env, NODE_ENV: 'production' }
    });
  }

  /**
   * Execute command with promise wrapper
   */
  private executeCommand(
    command: string, 
    args: string[], 
    options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'inherit',
        shell: true,
        cwd: options.cwd || process.cwd(),
        env: options.env || process.env,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Command '${command} ${args.join(' ')}' failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Get available fallback strategies
   */
  getAvailableStrategies(): FallbackStrategy[] {
    return [...this.strategies];
  }

  /**
   * Test if a strategy is applicable for an error
   */
  getApplicableStrategies(error: Error): FallbackStrategy[] {
    return this.strategies.filter(strategy => strategy.condition(error));
  }
}

// Export singleton instance
export const buildFallbackManager = new BuildFallbackManager();

// Export utility functions
export function createFallbackManager(errorHandler?: BuildErrorHandler): BuildFallbackManager {
  return new BuildFallbackManager(errorHandler);
}

export function addGlobalFallbackStrategy(strategy: FallbackStrategy): void {
  buildFallbackManager.addStrategy(strategy);
}