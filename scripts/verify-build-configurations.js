#!/usr/bin/env node

/**
 * Build Configuration Verification Script
 * 
 * This script verifies that all build processes and configurations work correctly
 * for each application in the monorepo before deployment to staging.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { NetlifyBuilder } = require('./netlify-build');

class BuildVerification {
  constructor() {
    this.startTime = Date.now();
    this.verificationResults = {
      marketing: { status: 'pending', buildTime: null, outputSize: null },
      remix: { status: 'pending', buildTime: null, outputSize: null },
      docs: { status: 'pending', buildTime: null, outputSize: null }
    };
    
    this.applications = [
      {
        name: 'marketing',
        displayName: 'Marketing Site',
        workspace: '@signtusk/web',
        directory: 'apps/web',
        outputDir: '.next',
        configFile: 'apps/web/netlify.toml'
      },
      {
        name: 'remix',
        displayName: 'Remix Application',
        workspace: '@signtusk/remix',
        directory: 'apps/remix',
        outputDir: 'build',
        configFile: 'netlify-remix.toml'
      },
      {
        name: 'docs',
        displayName: 'Documentation Site',
        workspace: '@signtusk/docs',
        directory: 'apps/docs',
        outputDir: '.next',
        configFile: 'netlify-docs.toml'
      }
    ];
    
    this.logInfo('🔍 Build Configuration Verification Initialized');
  }

  /**
   * Run comprehensive build verification for all applications
   */
  async runVerification() {
    try {
      this.logInfo('🚀 Starting build configuration verification...');
      
      // Verify workspace structure
      await this.verifyWorkspaceStructure();
      
      // Verify Netlify configurations
      await this.verifyNetlifyConfigurations();
      
      // Verify dependencies
      await this.verifyDependencies();
      
      // Test build processes
      await this.testBuildProcesses();
      
      // Verify build outputs
      await this.verifyBuildOutputs();
      
      // Generate verification report
      this.generateVerificationReport();
      
      this.logSuccess('✅ All build configurations verified successfully');
      
    } catch (error) {
      this.logError(`❌ Build verification failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verify workspace structure and required files
   */
  async verifyWorkspaceStructure() {
    this.logInfo('📁 Verifying workspace structure...');
    
    // Check root package.json
    const rootPackageJson = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(rootPackageJson)) {
      throw new Error('Root package.json not found');
    }
    
    const rootPackage = JSON.parse(fs.readFileSync(rootPackageJson, 'utf8'));
    if (!rootPackage.workspaces) {
      throw new Error('Workspaces configuration not found in root package.json');
    }
    
    // Check each application directory
    for (const app of this.applications) {
      const appDir = path.join(process.cwd(), app.directory);
      if (!fs.existsSync(appDir)) {
        throw new Error(`Application directory not found: ${app.directory}`);
      }
      
      const appPackageJson = path.join(appDir, 'package.json');
      if (!fs.existsSync(appPackageJson)) {
        throw new Error(`Package.json not found for ${app.displayName}: ${appPackageJson}`);
      }
      
      // Verify package.json has correct name
      const appPackage = JSON.parse(fs.readFileSync(appPackageJson, 'utf8'));
      if (appPackage.name !== app.workspace) {
        throw new Error(`Package name mismatch for ${app.displayName}: expected ${app.workspace}, got ${appPackage.name}`);
      }
    }
    
    // Check Turbo configuration
    const turboConfig = path.join(process.cwd(), 'turbo.json');
    if (!fs.existsSync(turboConfig)) {
      throw new Error('turbo.json configuration not found');
    }
    
    this.logSuccess('✅ Workspace structure verification passed');
  }

  /**
   * Verify Netlify configuration files
   */
  async verifyNetlifyConfigurations() {
    this.logInfo('⚙️  Verifying Netlify configurations...');
    
    for (const app of this.applications) {
      if (fs.existsSync(app.configFile)) {
        const config = fs.readFileSync(app.configFile, 'utf8');
        
        // Check for required sections
        const requiredSections = ['[build]', 'command =', 'publish ='];
        for (const section of requiredSections) {
          if (!config.includes(section)) {
            throw new Error(`Missing required section '${section}' in ${app.configFile}`);
          }
        }
        
        // Check build command references correct workspace
        if (!config.includes(app.workspace)) {
          throw new Error(`Build command in ${app.configFile} does not reference workspace ${app.workspace}`);
        }
        
        // Check publish directory matches expected output
        if (!config.includes(app.outputDir)) {
          throw new Error(`Publish directory in ${app.configFile} does not match expected output ${app.outputDir}`);
        }
        
        this.logInfo(`✅ ${app.displayName} Netlify configuration verified`);
      } else {
        this.logWarning(`⚠️  Netlify configuration not found for ${app.displayName}: ${app.configFile}`);
      }
    }
    
    this.logSuccess('✅ Netlify configuration verification passed');
  }

  /**
   * Verify dependencies and workspace setup
   */
  async verifyDependencies() {
    this.logInfo('📦 Verifying dependencies...');
    
    try {
      // Check if node_modules exists
      const nodeModules = path.join(process.cwd(), 'node_modules');
      if (!fs.existsSync(nodeModules)) {
        this.logInfo('📦 Installing dependencies...');
        execSync('npm ci', { stdio: 'inherit' });
      }
      
      // Verify workspace dependencies are linked
      for (const app of this.applications) {
        const appNodeModules = path.join(process.cwd(), app.directory, 'node_modules');
        
        // Check if workspace has access to shared packages
        const sharedPackages = ['@signtusk/ui', '@signtusk/lib'];
        for (const pkg of sharedPackages) {
          try {
            const pkgPath = path.join(process.cwd(), 'node_modules', pkg);
            if (fs.existsSync(pkgPath)) {
              this.logInfo(`✅ Shared package ${pkg} available for ${app.displayName}`);
            }
          } catch (error) {
            // Package might not exist, which is okay
          }
        }
      }
      
      this.logSuccess('✅ Dependencies verification passed');
      
    } catch (error) {
      throw new Error(`Dependency verification failed: ${error.message}`);
    }
  }

  /**
   * Test build processes for all applications
   */
  async testBuildProcesses() {
    this.logInfo('🔧 Testing build processes...');
    
    const buildPromises = this.applications.map(app => this.testApplicationBuild(app));
    const results = await Promise.allSettled(buildPromises);
    
    // Check for failures
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      const failedApps = failures.map((_, index) => this.applications[index].displayName);
      throw new Error(`Build failed for applications: ${failedApps.join(', ')}`);
    }
    
    this.logSuccess('✅ All build processes completed successfully');
  }

  /**
   * Test build process for a specific application
   */
  async testApplicationBuild(app) {
    const startTime = Date.now();
    
    try {
      this.logInfo(`🔧 Building ${app.displayName}...`);
      
      // Set environment variable for app detection
      process.env.NETLIFY_APP_NAME = app.name;
      
      // Use the NetlifyBuilder to build the application
      const builder = new NetlifyBuilder();
      await builder.run();
      
      const buildTime = Date.now() - startTime;
      this.verificationResults[app.name] = {
        status: 'success',
        buildTime: buildTime,
        outputSize: this.calculateOutputSize(app)
      };
      
      this.logSuccess(`✅ ${app.displayName} built successfully in ${(buildTime / 1000).toFixed(2)}s`);
      
    } catch (error) {
      this.verificationResults[app.name] = {
        status: 'failed',
        buildTime: Date.now() - startTime,
        outputSize: null,
        error: error.message
      };
      
      this.logError(`❌ Failed to build ${app.displayName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Calculate output size for an application
   */
  calculateOutputSize(app) {
    try {
      const outputPath = path.join(process.cwd(), app.directory, app.outputDir);
      if (!fs.existsSync(outputPath)) {
        return null;
      }
      
      const stats = this.getDirectorySize(outputPath);
      return {
        bytes: stats.size,
        files: stats.files,
        humanReadable: this.formatBytes(stats.size)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get directory size recursively
   */
  getDirectorySize(dirPath) {
    let totalSize = 0;
    let totalFiles = 0;
    
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        const subStats = this.getDirectorySize(itemPath);
        totalSize += subStats.size;
        totalFiles += subStats.files;
      } else {
        totalSize += stats.size;
        totalFiles += 1;
      }
    }
    
    return { size: totalSize, files: totalFiles };
  }

  /**
   * Format bytes to human readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Verify build outputs are valid
   */
  async verifyBuildOutputs() {
    this.logInfo('📋 Verifying build outputs...');
    
    for (const app of this.applications) {
      const outputPath = path.join(process.cwd(), app.directory, app.outputDir);
      
      if (!fs.existsSync(outputPath)) {
        throw new Error(`Build output not found for ${app.displayName}: ${outputPath}`);
      }
      
      const outputContents = fs.readdirSync(outputPath);
      if (outputContents.length === 0) {
        throw new Error(`Build output is empty for ${app.displayName}: ${outputPath}`);
      }
      
      // Application-specific output verification
      await this.verifyApplicationOutput(app, outputPath);
      
      this.logInfo(`✅ ${app.displayName} build output verified (${outputContents.length} items)`);
    }
    
    this.logSuccess('✅ All build outputs verified successfully');
  }

  /**
   * Verify application-specific build output
   */
  async verifyApplicationOutput(app, outputPath) {
    switch (app.name) {
      case 'marketing':
      case 'docs':
        // Next.js applications should have static files
        const staticDir = path.join(outputPath, 'static');
        if (fs.existsSync(staticDir)) {
          this.logInfo(`✅ ${app.displayName} has static assets`);
        }
        break;
        
      case 'remix':
        // Remix should have client and server builds
        const clientDir = path.join(outputPath, 'client');
        const serverDir = path.join(outputPath, 'server');
        
        if (fs.existsSync(clientDir)) {
          this.logInfo(`✅ ${app.displayName} has client build`);
        }
        
        if (fs.existsSync(serverDir)) {
          this.logInfo(`✅ ${app.displayName} has server build`);
        }
        break;
    }
  }

  /**
   * Generate comprehensive verification report
   */
  generateVerificationReport() {
    const totalTime = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 BUILD VERIFICATION REPORT');
    console.log('='.repeat(80));
    
    Object.entries(this.verificationResults).forEach(([appName, result]) => {
      const app = this.applications.find(a => a.name === appName);
      console.log(`\n${app.displayName}:`);
      console.log(`  Status: ${result.status}`);
      console.log(`  Build Time: ${result.buildTime ? (result.buildTime / 1000).toFixed(2) + 's' : 'N/A'}`);
      
      if (result.outputSize) {
        console.log(`  Output Size: ${result.outputSize.humanReadable} (${result.outputSize.files} files)`);
      }
      
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    });
    
    console.log(`\nTotal Verification Time: ${totalTime}s`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('='.repeat(80));
    
    // Write report to file
    const reportPath = path.join(process.cwd(), 'build-verification-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      totalTime: parseFloat(totalTime),
      results: this.verificationResults,
      applications: this.applications
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.logInfo(`📄 Verification report saved to: ${reportPath}`);
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
module.exports = { BuildVerification };

// Run if called directly
if (require.main === module) {
  const verification = new BuildVerification();
  verification.runVerification().catch(error => {
    console.error('Build verification failed:', error);
    process.exit(1);
  });
}