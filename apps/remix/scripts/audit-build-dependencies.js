#!/usr/bin/env node

/**
 * Build Dependencies Audit Script
 * Validates that all CLI tools and dependencies used in build scripts are properly installed
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class BuildDependencyAuditor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.packageJsonPath = join(__dirname, '..', 'package.json');
  }

  /**
   * Load package.json
   */
  loadPackageJson() {
    try {
      const content = readFileSync(this.packageJsonPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      this.errors.push(`Failed to load package.json: ${error.message}`);
      return null;
    }
  }

  /**
   * Extract CLI tools from build scripts
   */
  extractCliToolsFromScripts(scripts) {
    const cliTools = new Set();
    const scriptCommands = Object.values(scripts).join(' ');

    // Common CLI patterns
    const patterns = [
      /npx\s+([a-zA-Z0-9@/-]+)/g,
      /cross-env/g,
      /rollup/g,
      /rimraf/g,
      /tsc/g,
      /react-router/g,
      /typescript/g,
      /babel/g,
      /eslint/g,
      /prettier/g,
      /vitest/g,
      /playwright/g
    ];

    for (const pattern of patterns) {
      const matches = scriptCommands.matchAll(pattern);
      for (const match of matches) {
        if (match[1]) {
          cliTools.add(match[1]);
        } else {
          cliTools.add(match[0]);
        }
      }
    }

    return Array.from(cliTools);
  }

  /**
   * Check if a package is available in dependencies or devDependencies
   */
  isPackageAvailable(packageName, packageJson) {
    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};
    
    // Check exact match
    if (deps[packageName] || devDeps[packageName]) {
      return { available: true, location: deps[packageName] ? 'dependencies' : 'devDependencies' };
    }

    // Check for scoped packages or related packages
    const relatedPackages = [
      `@types/${packageName}`,
      `${packageName}-cli`,
      `@${packageName}/cli`,
      `@react-router/dev`, // for react-router
      `@rollup/plugin-typescript`, // for rollup
    ];

    for (const related of relatedPackages) {
      if (deps[related] || devDeps[related]) {
        return { available: true, location: deps[related] ? 'dependencies' : 'devDependencies', package: related };
      }
    }

    return { available: false };
  }

  /**
   * Check if a CLI tool is available via npx
   */
  async checkNpxAvailability(toolName) {
    return new Promise((resolve) => {
      const child = spawn('npx', ['--help', toolName], { 
        stdio: 'pipe',
        shell: true 
      });

      child.on('close', (code) => {
        resolve(code === 0);
      });

      child.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Validate build dependencies
   */
  async validateBuildDependencies() {
    const packageJson = this.loadPackageJson();
    if (!packageJson) {
      return false;
    }

    const cliTools = this.extractCliToolsFromScripts(packageJson.scripts || {});
    this.info.push(`Found CLI tools in scripts: ${cliTools.join(', ')}`);

    let allValid = true;

    for (const tool of cliTools) {
      const availability = this.isPackageAvailable(tool, packageJson);
      
      if (availability.available) {
        this.info.push(`✓ ${tool} available in ${availability.location}${availability.package ? ` (as ${availability.package})` : ''}`);
      } else {
        // Check if available via npx
        const npxAvailable = await this.checkNpxAvailability(tool);
        
        if (npxAvailable) {
          this.warnings.push(`⚠ ${tool} available via npx but not in package.json - consider adding to dependencies`);
        } else {
          this.errors.push(`✗ ${tool} not available - add to package.json dependencies`);
          allValid = false;
        }
      }
    }

    return allValid;
  }

  /**
   * Check for required build dependencies
   */
  validateRequiredDependencies(packageJson) {
    const requiredForBuild = [
      'cross-env',
      'rimraf',
      '@react-router/dev',
      'rollup',
      'typescript'
    ];

    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    let allPresent = true;

    for (const required of requiredForBuild) {
      if (!deps[required]) {
        this.errors.push(`Missing required build dependency: ${required}`);
        allPresent = false;
      } else {
        this.info.push(`✓ Required dependency present: ${required}`);
      }
    }

    return allPresent;
  }

  /**
   * Check for Vercel-specific requirements
   */
  validateVercelCompatibility(packageJson) {
    const vercelIssues = [];

    // Check for CLI dependencies that might not work in Vercel
    const problematicCli = ['dotenv-cli'];
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    for (const cli of problematicCli) {
      if (deps[cli]) {
        vercelIssues.push(`${cli} may not work in Vercel build environment`);
      }
    }

    // Check for programmatic alternatives
    const alternatives = {
      'dotenv-cli': 'dotenv (programmatic usage)',
    };

    for (const [problematic, alternative] of Object.entries(alternatives)) {
      if (deps[problematic]) {
        this.warnings.push(`Consider replacing ${problematic} with ${alternative} for Vercel compatibility`);
      }
    }

    // Check if dotenv is available for programmatic use
    if (!deps['dotenv']) {
      this.warnings.push('Consider adding dotenv package for programmatic environment loading');
    }

    return vercelIssues.length === 0;
  }

  /**
   * Generate dependency recommendations
   */
  generateRecommendations(packageJson) {
    const recommendations = [];

    // Check if important packages are in devDependencies but should be in dependencies for Vercel
    const shouldBeInDependencies = [
      'cross-env',
      'rimraf',
      '@react-router/dev',
      'rollup',
      'typescript'
    ];

    const deps = packageJson.dependencies || {};
    const devDeps = packageJson.devDependencies || {};

    for (const pkg of shouldBeInDependencies) {
      if (devDeps[pkg] && !deps[pkg]) {
        recommendations.push(`Move ${pkg} from devDependencies to dependencies for Vercel compatibility`);
      }
    }

    if (recommendations.length > 0) {
      this.info.push('📋 Recommendations:');
      recommendations.forEach(rec => this.info.push(`   ${rec}`));
    }

    return recommendations;
  }

  /**
   * Run complete audit
   */
  async audit() {
    console.log('🔍 Auditing build dependencies...\n');

    const packageJson = this.loadPackageJson();
    if (!packageJson) {
      this.reportResults();
      return { success: false, errors: this.errors };
    }

    // Run validations
    const dependenciesValid = await this.validateBuildDependencies();
    const requiredValid = this.validateRequiredDependencies(packageJson);
    const vercelCompatible = this.validateVercelCompatibility(packageJson);

    // Generate recommendations
    this.generateRecommendations(packageJson);

    // Report results
    this.reportResults();

    const success = dependenciesValid && requiredValid && vercelCompatible && this.errors.length === 0;

    return {
      success,
      errors: this.errors,
      warnings: this.warnings,
      info: this.info
    };
  }

  /**
   * Report audit results
   */
  reportResults() {
    // Info messages
    if (this.info.length > 0) {
      console.log('ℹ️  Information:');
      this.info.forEach(msg => console.log(`   ${msg}`));
      console.log();
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      this.warnings.forEach(msg => console.log(`   ${msg}`));
      console.log();
    }

    // Errors
    if (this.errors.length > 0) {
      console.log('❌ Errors:');
      this.errors.forEach(msg => console.log(`   ${msg}`));
      console.log();
    }

    // Summary
    if (this.errors.length === 0) {
      console.log('✅ Build dependency audit passed!');
    } else {
      console.log('❌ Build dependency audit failed!');
      console.log('\nPlease fix the dependency issues and try again.');
    }
  }
}

// Run audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new BuildDependencyAuditor();
  const result = await auditor.audit();
  process.exit(result.success ? 0 : 1);
}

export default BuildDependencyAuditor;