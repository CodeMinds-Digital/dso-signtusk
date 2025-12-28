#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { BuildErrorHandler, BuildError } = require('./netlify-build-error-handler');

/**
 * Netlify Multi-Site Build Script
 * 
 * This script provides workspace-aware builds for Netlify deployments,
 * with app detection, selective building, and comprehensive error handling.
 */

// Workspace mapping for different applications
const WORKSPACE_MAP = {
  'marketing': '@signtusk/web',
  'web': '@signtusk/web',
  'remix': '@signtusk/remix',
  'app': '@signtusk/remix',
  'docs': '@signtusk/docs',
  'documentation': '@signtusk/docs'
};

// Build configuration for each app type
const BUILD_CONFIG = {
  '@signtusk/web': {
    name: 'Marketing Site',
    buildCommand: 'build',
    outputDir: '.next',
    requiresSSR: false,
    memoryLimit: 4096,
    dependencies: ['@signtusk/ui', '@signtusk/lib', '@signtusk/trpc']
  },
  '@signtusk/remix': {
    name: 'Remix Application',
    buildCommand: 'build',
    outputDir: 'build',
    requiresSSR: true,
    memoryLimit: 6144,
    dependencies: ['@signtusk/api', '@signtusk/auth', '@signtusk/lib', '@signtusk/prisma', '@signtusk/ui']
  },
  '@signtusk/docs': {
    name: 'Documentation Site',
    buildCommand: 'build',
    outputDir: '.next',
    requiresSSR: false,
    memoryLimit: 2048,
    dependencies: ['@signtusk/api', '@signtusk/sdk', '@signtusk/ui']
  }
};

class NetlifyBuildError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'NetlifyBuildError';
    this.code = code;
    this.details = details;
  }
}

class NetlifyBuilder {
  constructor() {
    this.startTime = Date.now();
    this.appName = this.detectApp();
    this.workspace = this.resolveWorkspace();
    this.config = BUILD_CONFIG[this.workspace];
    
    // Initialize error handler
    this.errorHandler = new BuildErrorHandler({
      maxRetries: 3,
      retryDelay: 5000,
      buildTimeout: 1800000, // 30 minutes
      memoryLimit: this.config.memoryLimit || 4096,
      logLevel: process.env.LOG_LEVEL || 'info'
    });
    
    // Ensure we're in the repository root
    this.repositoryRoot = this.findRepositoryRoot();
    process.chdir(this.repositoryRoot);
    
    this.logInfo('🚀 Netlify Build Script Initialized');
    this.logInfo(`📱 App: ${this.appName} (${this.workspace})`);
    this.logInfo(`📂 Repository Root: ${this.repositoryRoot}`);
  }

  /**
   * Detect the application being built based on environment variables
   */
  detectApp() {
    // Check various environment variables that might indicate the app
    const appIndicators = [
      process.env.NETLIFY_APP_NAME,
      process.env.APP_NAME,
      process.env.SITE_NAME,
      process.env.BUILD_CONTEXT
    ].filter(Boolean);

    if (appIndicators.length > 0) {
      return appIndicators[0].toLowerCase();
    }

    // Try to detect from build directory or current working directory
    const cwd = process.cwd();
    if (cwd.includes('/apps/web')) return 'web';
    if (cwd.includes('/apps/remix')) return 'remix';
    if (cwd.includes('/apps/docs')) return 'docs';

    // Default fallback
    this.logWarning('⚠️  Could not detect app name, defaulting to remix');
    return 'remix';
  }

  /**
   * Resolve workspace name from app name
   */
  resolveWorkspace() {
    const workspace = WORKSPACE_MAP[this.appName];
    if (!workspace) {
      throw new NetlifyBuildError(
        `Unknown application: ${this.appName}`,
        'UNKNOWN_APP',
        { appName: this.appName, availableApps: Object.keys(WORKSPACE_MAP) }
      );
    }
    return workspace;
  }

  /**
   * Find the repository root by looking for package.json with workspaces
   */
  findRepositoryRoot() {
    let currentDir = process.cwd();
    
    while (currentDir !== path.dirname(currentDir)) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
          if (packageJson.workspaces) {
            return currentDir;
          }
        } catch (error) {
          // Continue searching if package.json is invalid
        }
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    throw new NetlifyBuildError(
      'Could not find repository root with workspaces configuration',
      'NO_WORKSPACE_ROOT'
    );
  }

  /**
   * Validate build environment and dependencies
   */
  validateEnvironment() {
    this.logInfo('🔍 Validating build environment...');

    // Check Node.js version
    const nodeVersion = process.version;
    const requiredNodeVersion = '22.0.0';
    if (!this.isVersionCompatible(nodeVersion.slice(1), requiredNodeVersion)) {
      throw new NetlifyBuildError(
        `Node.js version ${nodeVersion} is not compatible. Required: >=${requiredNodeVersion}`,
        'INCOMPATIBLE_NODE_VERSION',
        { current: nodeVersion, required: requiredNodeVersion }
      );
    }

    // Check if workspace exists
    const workspaceDir = this.getWorkspaceDirectory();
    if (!fs.existsSync(workspaceDir)) {
      throw new NetlifyBuildError(
        `Workspace directory not found: ${workspaceDir}`,
        'WORKSPACE_NOT_FOUND',
        { workspace: this.workspace, directory: workspaceDir }
      );
    }

    // Check if package.json exists in workspace
    const packageJsonPath = path.join(workspaceDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new NetlifyBuildError(
        `Package.json not found in workspace: ${packageJsonPath}`,
        'PACKAGE_JSON_NOT_FOUND',
        { workspace: this.workspace, path: packageJsonPath }
      );
    }

    this.logSuccess('✅ Environment validation passed');
  }

  /**
   * Install dependencies with proper workspace support
   */
  async installDependencies() {
    this.logInfo('📦 Installing dependencies with enhanced error handling...');

    try {
      await this.errorHandler.installDependencies({
        stdio: 'inherit'
      });
      this.logSuccess('✅ Dependencies installed successfully');
    } catch (error) {
      throw new NetlifyBuildError(
        'Failed to install dependencies with retry logic',
        'DEPENDENCY_INSTALL_FAILED',
        { 
          error: error.message,
          details: error.details || {}
        }
      );
    }
  }

  /**
   * Build the application using Turbo for optimization
   */
  async buildApplication() {
    this.logInfo(`🔧 Building ${this.config.name} with enhanced monitoring...`);

    try {
      await this.errorHandler.buildWithMonitoring(this.workspace, {
        stdio: 'inherit'
      });
      this.logSuccess(`✅ ${this.config.name} built successfully`);
    } catch (error) {
      throw new NetlifyBuildError(
        `Failed to build ${this.config.name}`,
        'BUILD_FAILED',
        {
          workspace: this.workspace,
          error: error.message,
          details: error.details || {}
        }
      );
    }
  }

  /**
   * Validate that build output exists and is valid
   */
  validateBuildOutput() {
    const workspaceDir = this.getWorkspaceDirectory();
    const outputDir = path.join(workspaceDir, this.config.outputDir);

    if (!fs.existsSync(outputDir)) {
      throw new NetlifyBuildError(
        `Build output directory not found: ${outputDir}`,
        'BUILD_OUTPUT_NOT_FOUND',
        { 
          workspace: this.workspace,
          expectedOutput: outputDir,
          workspaceDir
        }
      );
    }

    // Check if output directory has content
    const outputContents = fs.readdirSync(outputDir);
    if (outputContents.length === 0) {
      throw new NetlifyBuildError(
        `Build output directory is empty: ${outputDir}`,
        'BUILD_OUTPUT_EMPTY',
        { 
          workspace: this.workspace,
          outputDir
        }
      );
    }

    this.logInfo(`📁 Build output validated: ${outputContents.length} items in ${this.config.outputDir}`);
  }

  /**
   * Get the workspace directory path
   */
  getWorkspaceDirectory() {
    const appName = this.workspace.split('/')[1]; // Extract app name from @signtusk/app
    return path.join(this.repositoryRoot, 'apps', appName);
  }

  /**
   * Check if version is compatible
   */
  isVersionCompatible(current, required) {
    const currentParts = current.split('.').map(Number);
    const requiredParts = required.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, requiredParts.length); i++) {
      const currentPart = currentParts[i] || 0;
      const requiredPart = requiredParts[i] || 0;

      if (currentPart > requiredPart) return true;
      if (currentPart < requiredPart) return false;
    }

    return true; // Equal versions are compatible
  }

  /**
   * Run the complete build process
   */
  async run() {
    try {
      this.logInfo(`🏗️  Starting build for ${this.config.name}`);
      
      this.validateEnvironment();
      await this.installDependencies();
      await this.buildApplication();
      
      const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
      this.logSuccess(`🎉 Build completed successfully in ${duration}s`);
      
      // Print build summary
      this.printBuildSummary();
      
    } catch (error) {
      this.handleError(error);
      
      // Generate comprehensive error report
      if (this.errorHandler) {
        const { reportFile } = this.errorHandler.generateErrorReport();
        this.logError(`📄 Error report generated: ${reportFile}`);
      }
      
      process.exit(1);
    }
  }

  /**
   * Print build summary information
   */
  printBuildSummary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BUILD SUMMARY');
    console.log('='.repeat(60));
    console.log(`Application: ${this.config.name}`);
    console.log(`Workspace: ${this.workspace}`);
    console.log(`Output Directory: ${this.config.outputDir}`);
    console.log(`SSR Required: ${this.config.requiresSSR ? 'Yes' : 'No'}`);
    console.log(`Build Duration: ${duration}s`);
    console.log(`Node.js Version: ${process.version}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log('='.repeat(60));
  }

  /**
   * Handle and format errors
   */
  handleError(error) {
    console.error('\n' + '❌'.repeat(20));
    console.error('💥 BUILD FAILED');
    console.error('❌'.repeat(20));
    
    if (error instanceof NetlifyBuildError) {
      console.error(`Error Code: ${error.code}`);
      console.error(`Message: ${error.message}`);
      
      if (Object.keys(error.details).length > 0) {
        console.error('Details:');
        console.error(JSON.stringify(error.details, null, 2));
      }
    } else {
      console.error(`Unexpected Error: ${error.message}`);
      console.error(error.stack);
    }
    
    console.error('❌'.repeat(20));
  }

  /**
   * Logging utilities
   */
  logInfo(message) {
    console.log(`ℹ️  ${message}`);
  }

  logSuccess(message) {
    console.log(`✅ ${message}`);
  }

  logWarning(message) {
    console.warn(`⚠️  ${message}`);
  }

  logError(message) {
    console.error(`❌ ${message}`);
  }
}

// Export for testing
module.exports = { NetlifyBuilder, NetlifyBuildError, WORKSPACE_MAP, BUILD_CONFIG };

// Run if called directly
if (require.main === module) {
  const builder = new NetlifyBuilder();
  builder.run();
}