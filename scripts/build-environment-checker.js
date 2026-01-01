#!/usr/bin/env node

/**
 * Build Environment Checker
 * Implements comprehensive checks for CLI tool availability and package.json dependency completeness
 * Provides clear error messages for missing requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BuildEnvironmentChecker {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.checkResults = {};
  }

  /**
   * Run all build environment checks
   */
  async checkEnvironment() {
    console.log('🔍 Checking build environment...\n');

    try {
      await this.checkCLIToolAvailability();
      await this.validatePackageJsonCompleteness();
      await this.checkBuildDependencies();
      await this.validateBuildScripts();
      await this.checkFileSystemPermissions();
      
      this.reportResults();

      return {
        success: this.errors.length === 0,
        errors: this.errors,
        warnings: this.warnings,
        info: this.info,
        checkResults: this.checkResults
      };

    } catch (error) {
      this.errors.push(`Build environment check failed: ${error.message}`);
      this.reportResults();
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        info: this.info,
        checkResults: this.checkResults
      };
    }
  }

  /**
   * Check CLI tool availability - both local and global
   */
  async checkCLIToolAvailability() {
    console.log('🔧 Checking CLI tool availability...');

    const cliTools = [
      {
        name: 'node',
        command: 'node --version',
        required: true,
        type: 'system',
        description: 'Node.js runtime'
      },
      {
        name: 'npm',
        command: 'npm --version',
        required: true,
        type: 'system',
        description: 'Node Package Manager'
      },
      {
        name: 'cross-env',
        command: 'npx cross-env --version',
        localPath: 'node_modules/.bin/cross-env',
        required: true,
        type: 'build',
        description: 'Cross-platform environment variables'
      },
      {
        name: 'turbo',
        command: 'npx turbo --version',
        localPath: 'node_modules/.bin/turbo',
        required: true,
        type: 'build',
        description: 'Turbo monorepo build system'
      },
      {
        name: 'react-router',
        command: 'npx react-router --version',
        localPath: 'node_modules/.bin/react-router',
        required: true,
        type: 'build',
        description: 'React Router CLI'
      },
      {
        name: 'rollup',
        command: 'npx rollup --version',
        localPath: 'node_modules/.bin/rollup',
        required: true,
        type: 'build',
        description: 'Rollup bundler'
      },
      {
        name: 'typescript',
        command: 'npx tsc --version',
        localPath: 'node_modules/.bin/tsc',
        required: true,
        type: 'build',
        description: 'TypeScript compiler'
      },
      {
        name: 'prisma',
        command: 'npx prisma --version',
        localPath: 'node_modules/.bin/prisma',
        required: false,
        type: 'database',
        description: 'Prisma database toolkit'
      },
      {
        name: 'dotenv',
        command: 'node -e "console.log(require(\'dotenv\').version || \'available\')"',
        localPath: 'node_modules/dotenv',
        required: true,
        type: 'build',
        description: 'Environment variable loader (programmatic)',
        checkProgrammatic: true
      }
    ];

    const toolResults = [];

    for (const tool of cliTools) {
      const result = await this.checkSingleTool(tool);
      toolResults.push(result);

      if (!result.available && tool.required) {
        this.errors.push({
          type: 'cli_tool',
          code: 'MISSING_CLI_TOOL',
          message: `Required CLI tool not available: ${tool.name}`,
          remediation: this.getToolRemediation(tool),
          context: { tool: tool.name, type: tool.type }
        });
      } else if (!result.available && !tool.required) {
        this.warnings.push({
          type: 'cli_tool',
          code: 'OPTIONAL_CLI_TOOL_MISSING',
          message: `Optional CLI tool not available: ${tool.name}`,
          remediation: [`Install ${tool.name} if needed: npm install ${tool.name}`]
        });
      } else if (result.available) {
        this.info.push(`✅ ${tool.name}: ${result.version || 'Available'} (${result.source})`);
      }
    }

    // Check for problematic global dependencies
    await this.checkProblematicGlobalDependencies();

    this.checkResults.cliTools = {
      totalChecked: cliTools.length,
      available: toolResults.filter(r => r.available).length,
      required: cliTools.filter(t => t.required).length,
      requiredAvailable: toolResults.filter(r => r.available && cliTools.find(t => t.name === r.name)?.required).length
    };

    console.log(`   Checked ${cliTools.length} CLI tools`);
  }

  /**
   * Check availability of a single CLI tool
   */
  async checkSingleTool(tool) {
    const result = {
      name: tool.name,
      available: false,
      version: null,
      source: null
    };

    try {
      // For programmatic tools (like dotenv), check if module can be required
      if (tool.checkProgrammatic) {
        try {
          require.resolve(tool.name);
          result.available = true;
          result.source = 'programmatic';
          result.version = 'available';
          return result;
        } catch (error) {
          // Fall through to other checks
        }
      }

      // Check local installation first (preferred for build tools)
      if (tool.localPath && fs.existsSync(tool.localPath)) {
        try {
          const output = execSync(tool.command, { 
            encoding: 'utf8', 
            stdio: 'pipe',
            timeout: 5000 
          });
          result.available = true;
          result.source = 'local';
          result.version = this.extractVersion(output);
          return result;
        } catch (error) {
          // Local tool exists but might not be executable
        }
      }

      // Check if tool is available via npx/global
      try {
        const output = execSync(tool.command, { 
          encoding: 'utf8', 
          stdio: 'pipe',
          timeout: 5000 
        });
        result.available = true;
        result.source = tool.localPath && fs.existsSync(tool.localPath) ? 'local' : 'global';
        result.version = this.extractVersion(output);
        return result;
      } catch (error) {
        // Tool not available
      }

      return result;

    } catch (error) {
      return result;
    }
  }

  /**
   * Extract version from command output
   */
  extractVersion(output) {
    const versionMatch = output.match(/(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : 'unknown';
  }

  /**
   * Get remediation steps for missing tools
   */
  getToolRemediation(tool) {
    const remediation = [];

    switch (tool.type) {
      case 'system':
        remediation.push(`Install ${tool.name} system-wide`);
        if (tool.name === 'node') {
          remediation.push('Download from https://nodejs.org/');
          remediation.push('Use Node Version Manager (nvm) for version management');
        }
        break;

      case 'build':
        remediation.push(`Install ${tool.name} as project dependency: npm install ${tool.name}`);
        remediation.push(`Use npx to run: npx ${tool.name}`);
        remediation.push('Ensure package is in dependencies, not just devDependencies');
        break;

      case 'database':
        remediation.push(`Install ${tool.name}: npm install ${tool.name}`);
        remediation.push('Configure database connection if needed');
        break;

      default:
        remediation.push(`Install ${tool.name}: npm install ${tool.name}`);
    }

    return remediation;
  }

  /**
   * Check for problematic global dependencies that should be local
   */
  async checkProblematicGlobalDependencies() {
    const problematicGlobals = [
      'dotenv-cli', // Should use programmatic dotenv instead
      'cross-env',  // Should be local dependency
      'turbo',      // Should be local dependency
      'react-router' // Should be local dependency
    ];

    const globalIssues = [];

    for (const tool of problematicGlobals) {
      try {
        // Check if available globally
        execSync(`which ${tool}`, { stdio: 'ignore' });
        
        // Check if also available locally
        const localPath = path.join('node_modules', '.bin', tool);
        if (!fs.existsSync(localPath)) {
          globalIssues.push({
            tool,
            issue: 'Available globally but not locally',
            remediation: `Install locally: npm install ${tool}`
          });
        }
      } catch (error) {
        // Tool not available globally, which is fine
      }
    }

    if (globalIssues.length > 0) {
      this.warnings.push({
        type: 'cli_tool',
        code: 'PROBLEMATIC_GLOBAL_DEPS',
        message: 'Some tools are available globally but should be local dependencies',
        remediation: [
          'Install build tools as local dependencies for consistency',
          'Use npx to run tools from node_modules',
          'Avoid relying on global installations in CI/CD'
        ],
        context: { globalIssues }
      });
    }
  }

  /**
   * Validate package.json dependency completeness
   */
  async validatePackageJsonCompleteness() {
    console.log('📦 Validating package.json dependency completeness...');

    try {
      // Check root package.json
      await this.validateSinglePackageJson('.', 'root');

      // Check workspace packages
      const workspaces = this.getWorkspacePackages();
      for (const workspace of workspaces) {
        const packageJsonPath = path.join(workspace, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          await this.validateSinglePackageJson(workspace, path.basename(workspace));
        }
      }

      console.log('   Package.json validation completed');

    } catch (error) {
      this.errors.push({
        type: 'package_json',
        code: 'PACKAGE_JSON_VALIDATION_ERROR',
        message: `Package.json validation failed: ${error.message}`,
        remediation: [
          'Check package.json syntax',
          'Ensure all package.json files are valid JSON',
          'Verify file permissions'
        ]
      });
    }
  }

  /**
   * Validate a single package.json file
   */
  async validateSinglePackageJson(packageDir, packageName) {
    const packageJsonPath = path.join(packageDir, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.warnings.push({
        type: 'package_json',
        code: 'MISSING_PACKAGE_JSON',
        message: `Missing package.json in ${packageName}`,
        remediation: [
          `Create package.json in ${packageDir}`,
          'Initialize with npm init if needed'
        ]
      });
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

      // Required fields
      const requiredFields = ['name', 'version'];
      const missingFields = requiredFields.filter(field => !packageJson[field]);

      if (missingFields.length > 0) {
        this.warnings.push({
          type: 'package_json',
          code: 'MISSING_REQUIRED_FIELDS',
          message: `${packageName} package.json missing fields: ${missingFields.join(', ')}`,
          remediation: [
            'Add missing required fields',
            'Use proper semantic versioning',
            'Ensure package name follows npm conventions'
          ]
        });
      }

      // Check for build script dependencies
      const scripts = packageJson.scripts || {};
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      const buildScriptDeps = this.extractDependenciesFromScripts(scripts);
      const missingDeps = buildScriptDeps.filter(dep => !dependencies[dep]);

      if (missingDeps.length > 0) {
        this.errors.push({
          type: 'package_json',
          code: 'MISSING_SCRIPT_DEPENDENCIES',
          message: `${packageName} scripts reference missing dependencies: ${missingDeps.join(', ')}`,
          remediation: [
            'Add missing dependencies to package.json',
            'Install dependencies: npm install <dependency>',
            'Ensure build tools are available'
          ],
          context: { package: packageName, missingDeps }
        });
      }

      // Check dependency version consistency across workspace
      if (packageName !== 'root') {
        await this.checkDependencyVersionConsistency(packageJson, packageName);
      }

      this.info.push(`✅ ${packageName} package.json validation passed`);

    } catch (error) {
      this.errors.push({
        type: 'package_json',
        code: 'PACKAGE_JSON_PARSE_ERROR',
        message: `Failed to parse ${packageName} package.json: ${error.message}`,
        remediation: [
          'Fix JSON syntax errors',
          'Validate JSON format',
          'Check for trailing commas or other syntax issues'
        ]
      });
    }
  }

  /**
   * Extract dependencies referenced in package scripts
   */
  extractDependenciesFromScripts(scripts) {
    const dependencies = new Set();
    
    for (const script of Object.values(scripts)) {
      // Extract npx commands
      const npxMatches = script.match(/npx\s+([a-zA-Z0-9@/-]+)/g);
      if (npxMatches) {
        npxMatches.forEach(match => {
          const dep = match.replace('npx ', '').split(' ')[0];
          dependencies.add(dep);
        });
      }

      // Extract direct command references
      const commonTools = [
        'cross-env', 'turbo', 'react-router', 'rollup', 'tsc', 'prisma',
        'vite', 'vitest', 'eslint', 'prettier', 'rimraf'
      ];

      for (const tool of commonTools) {
        if (script.includes(tool)) {
          dependencies.add(tool);
        }
      }
    }

    return Array.from(dependencies);
  }

  /**
   * Check dependency version consistency across workspace
   */
  async checkDependencyVersionConsistency(packageJson, packageName) {
    // This is a simplified check - in practice you'd want more sophisticated version comparison
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Check against root package.json
    try {
      const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const rootDeps = { ...rootPackage.dependencies, ...rootPackage.devDependencies };

      const versionMismatches = [];
      for (const [dep, version] of Object.entries(dependencies)) {
        if (rootDeps[dep] && rootDeps[dep] !== version) {
          versionMismatches.push({ dep, packageVersion: version, rootVersion: rootDeps[dep] });
        }
      }

      if (versionMismatches.length > 0) {
        this.warnings.push({
          type: 'package_json',
          code: 'VERSION_MISMATCH',
          message: `${packageName} has dependency version mismatches with root`,
          remediation: [
            'Align dependency versions across workspace',
            'Use workspace protocol for internal dependencies',
            'Consider using syncpack for version management'
          ],
          context: { package: packageName, mismatches: versionMismatches }
        });
      }
    } catch (error) {
      // Ignore root package.json read errors
    }
  }

  /**
   * Get workspace packages
   */
  getWorkspacePackages() {
    try {
      const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const workspaces = rootPackage.workspaces || [];
      
      const packages = [];
      for (const workspace of workspaces) {
        if (workspace.endsWith('/*')) {
          const baseDir = workspace.slice(0, -2);
          if (fs.existsSync(baseDir)) {
            const dirs = fs.readdirSync(baseDir)
              .map(dir => path.join(baseDir, dir))
              .filter(dir => fs.statSync(dir).isDirectory());
            packages.push(...dirs);
          }
        } else {
          packages.push(workspace);
        }
      }
      
      return packages;
    } catch (error) {
      return [];
    }
  }

  /**
   * Check build dependencies are properly installed
   */
  async checkBuildDependencies() {
    console.log('🏗️  Checking build dependencies...');

    const criticalBuildDeps = [
      '@react-router/dev',
      '@react-router/node', 
      '@react-router/serve',
      'react',
      'react-dom',
      'typescript',
      'cross-env',
      'dotenv',
      'turbo'
    ];

    const missingBuildDeps = [];
    const availableBuildDeps = [];

    for (const dep of criticalBuildDeps) {
      try {
        require.resolve(dep);
        availableBuildDeps.push(dep);
      } catch (error) {
        missingBuildDeps.push(dep);
      }
    }

    if (missingBuildDeps.length > 0) {
      this.errors.push({
        type: 'build_dependency',
        code: 'MISSING_BUILD_DEPENDENCIES',
        message: `Missing critical build dependencies: ${missingBuildDeps.join(', ')}`,
        remediation: [
          'Install missing dependencies: npm install',
          'Check package.json for correct dependency declarations',
          'Ensure dependencies are not only in devDependencies if needed for build'
        ],
        context: { missingDeps: missingBuildDeps }
      });
    }

    this.checkResults.buildDependencies = {
      totalCritical: criticalBuildDeps.length,
      available: availableBuildDeps.length,
      missing: missingBuildDeps.length
    };

    if (missingBuildDeps.length === 0) {
      this.info.push('✅ All critical build dependencies available');
    }
  }

  /**
   * Validate build scripts exist and are properly configured
   */
  async validateBuildScripts() {
    console.log('📝 Validating build scripts...');

    try {
      const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = rootPackage.scripts || {};

      // Required build scripts
      const requiredScripts = ['build', 'dev'];
      const missingScripts = requiredScripts.filter(script => !scripts[script]);

      if (missingScripts.length > 0) {
        this.errors.push({
          type: 'build_script',
          code: 'MISSING_BUILD_SCRIPTS',
          message: `Missing required build scripts: ${missingScripts.join(', ')}`,
          remediation: [
            'Add missing build scripts to package.json',
            'Define proper build and development commands',
            'Use turbo for monorepo orchestration'
          ]
        });
      }

      // Check for problematic script patterns
      const problematicPatterns = [
        {
          pattern: /dotenv\s+-e/,
          issue: 'Uses dotenv CLI instead of programmatic loading',
          suggestion: 'Use programmatic dotenv loading or cross-env'
        },
        {
          pattern: /\$\([^)]+\)/,
          issue: 'Uses shell command substitution',
          suggestion: 'Use Node.js scripts for complex logic'
        },
        {
          pattern: /&&.*&&.*&&/,
          issue: 'Complex command chaining',
          suggestion: 'Break into separate scripts or use Node.js'
        }
      ];

      const scriptIssues = [];
      for (const [scriptName, scriptCommand] of Object.entries(scripts)) {
        for (const { pattern, issue, suggestion } of problematicPatterns) {
          if (pattern.test(scriptCommand)) {
            scriptIssues.push({
              script: scriptName,
              issue,
              suggestion,
              command: scriptCommand
            });
          }
        }
      }

      if (scriptIssues.length > 0) {
        this.warnings.push({
          type: 'build_script',
          code: 'PROBLEMATIC_BUILD_SCRIPTS',
          message: 'Build scripts may have compatibility issues',
          remediation: [
            'Simplify complex build scripts',
            'Use cross-env for environment variables',
            'Consider Node.js scripts for complex logic'
          ],
          context: { scriptIssues }
        });
      }

      this.checkResults.buildScripts = {
        requiredScriptsPresent: requiredScripts.length - missingScripts.length,
        totalRequired: requiredScripts.length,
        scriptIssues: scriptIssues.length
      };

      if (missingScripts.length === 0 && scriptIssues.length === 0) {
        this.info.push('✅ Build scripts are properly configured');
      }

    } catch (error) {
      this.errors.push({
        type: 'build_script',
        code: 'BUILD_SCRIPT_VALIDATION_ERROR',
        message: `Build script validation failed: ${error.message}`,
        remediation: [
          'Check package.json syntax',
          'Ensure scripts section is properly formatted'
        ]
      });
    }
  }

  /**
   * Check file system permissions
   */
  async checkFileSystemPermissions() {
    console.log('🔐 Checking file system permissions...');

    const criticalPaths = [
      { path: '.', permission: 'read', description: 'Project root' },
      { path: 'package.json', permission: 'read', description: 'Root package.json' },
      { path: 'node_modules', permission: 'read', description: 'Dependencies' },
      { path: 'apps', permission: 'read', description: 'Applications directory' },
      { path: 'packages', permission: 'read', description: 'Packages directory' }
    ];

    const permissionIssues = [];

    for (const { path: checkPath, permission, description } of criticalPaths) {
      if (fs.existsSync(checkPath)) {
        try {
          const stats = fs.statSync(checkPath);
          
          // Basic permission check (this is simplified)
          if (permission === 'read') {
            fs.accessSync(checkPath, fs.constants.R_OK);
          }
          
          this.info.push(`✅ ${description}: Accessible`);
        } catch (error) {
          permissionIssues.push({
            path: checkPath,
            permission,
            description,
            error: error.message
          });
        }
      }
    }

    if (permissionIssues.length > 0) {
      this.errors.push({
        type: 'permissions',
        code: 'FILE_PERMISSION_ISSUES',
        message: 'File system permission issues detected',
        remediation: [
          'Check file and directory permissions',
          'Ensure build process has necessary access',
          'Fix permission issues: chmod/chown as needed'
        ],
        context: { permissionIssues }
      });
    }

    this.checkResults.permissions = {
      pathsChecked: criticalPaths.length,
      issues: permissionIssues.length
    };
  }

  /**
   * Report check results
   */
  reportResults() {
    console.log('\n' + '='.repeat(60));
    console.log('BUILD ENVIRONMENT CHECK RESULTS');
    console.log('='.repeat(60));

    // Info messages
    if (this.info.length > 0) {
      console.log('\nℹ️  Information:');
      this.info.forEach(msg => console.log(`   ${msg}`));
    }

    // Warnings
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => {
        console.log(`   ${warning.message || warning}`);
        if (warning.remediation) {
          warning.remediation.forEach((step, index) => {
            console.log(`      ${index + 1}. ${step}`);
          });
        }
      });
    }

    // Errors
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => {
        console.log(`   ${error.message || error}`);
        if (error.remediation) {
          error.remediation.forEach((step, index) => {
            console.log(`      ${index + 1}. ${step}`);
          });
        }
      });
    }

    // Summary
    console.log('\n📊 CHECK SUMMARY:');
    console.log(`   Total Errors: ${this.errors.length}`);
    console.log(`   Total Warnings: ${this.warnings.length}`);
    
    if (this.checkResults.cliTools) {
      console.log(`   CLI Tools Available: ${this.checkResults.cliTools.available}/${this.checkResults.cliTools.totalChecked}`);
    }
    
    if (this.checkResults.buildDependencies) {
      console.log(`   Build Dependencies: ${this.checkResults.buildDependencies.available}/${this.checkResults.buildDependencies.totalCritical}`);
    }

    if (this.errors.length === 0) {
      console.log('\n✅ Build environment check passed! Environment is ready for building.');
    } else {
      console.log('\n❌ Build environment check failed! Fix errors before building.');
      console.log('\nNext steps:');
      console.log('1. Review the errors listed above');
      console.log('2. Install missing dependencies and tools');
      console.log('3. Fix package.json configuration issues');
      console.log('4. Run this check again: node scripts/build-environment-checker.js');
    }

    console.log('='.repeat(60));
  }
}

// Run check if called directly
if (require.main === module) {
  const checker = new BuildEnvironmentChecker();
  checker.checkEnvironment().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Build environment check crashed:', error);
    process.exit(1);
  });
}

module.exports = BuildEnvironmentChecker;