#!/usr/bin/env node

/**
 * Pre-Build Validation Script
 * Comprehensive validation before starting the build process
 * Validates environment variables and checks for common configuration issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PreBuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.validationResults = {};
  }

  /**
   * Run all pre-build validations
   */
  async validate() {
    console.log('🔍 Running pre-build validation...\n');

    try {
      // Core validations
      await this.validateEnvironmentVariables();
      await this.validateDependencies();
      await this.validateTurboConfiguration();
      await this.validatePackageConfigurations();
      await this.validateBuildScripts();
      await this.checkCommonIssues();

      // Generate validation report
      this.generateValidationReport();
      
      // Report results
      this.reportResults();

      const success = this.errors.length === 0;
      return {
        success,
        errors: this.errors,
        warnings: this.warnings,
        info: this.info,
        validationResults: this.validationResults
      };

    } catch (error) {
      this.errors.push(`Pre-build validation failed: ${error.message}`);
      this.reportResults();
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        info: this.info,
        validationResults: this.validationResults
      };
    }
  }

  /**
   * Validate environment variables
   */
  async validateEnvironmentVariables() {
    console.log('📋 Validating environment variables...');

    try {
      // Load environment variables
      const env = this.loadEnvironmentVariables();
      
      // Required build-time variables
      const requiredBuildVars = [
        'NODE_ENV',
        'NEXT_PUBLIC_WEBAPP_URL',
        'NEXT_PUBLIC_APP_URL'
      ];

      // Required runtime variables
      const requiredRuntimeVars = [
        'NEXTAUTH_SECRET',
        'NEXT_PRIVATE_ENCRYPTION_KEY',
        'NEXT_PRIVATE_DATABASE_URL'
      ];

      // Check build-time variables
      const missingBuildVars = requiredBuildVars.filter(v => !env[v] || env[v].trim() === '');
      if (missingBuildVars.length > 0) {
        this.errors.push({
          type: 'environment',
          code: 'MISSING_BUILD_VARS',
          message: `Missing required build-time variables: ${missingBuildVars.join(', ')}`,
          remediation: [
            'Add missing variables to .env.local',
            'Copy .env.example to .env.local if it doesn\'t exist',
            'Ensure build-time variables start with NEXT_PUBLIC_',
            'Run: npm run validate:env for detailed validation'
          ],
          context: { missingVars: missingBuildVars }
        });
      }

      // Check runtime variables
      const missingRuntimeVars = requiredRuntimeVars.filter(v => !env[v] || env[v].trim() === '');
      if (missingRuntimeVars.length > 0) {
        this.errors.push({
          type: 'environment',
          code: 'MISSING_RUNTIME_VARS',
          message: `Missing required runtime variables: ${missingRuntimeVars.join(', ')}`,
          remediation: [
            'Add missing variables to .env.local',
            'Ensure runtime variables start with NEXT_PRIVATE_',
            'Generate secure values for encryption keys (32+ characters)',
            'Set up database connection string'
          ],
          context: { missingVars: missingRuntimeVars }
        });
      }

      // Validate variable formats
      this.validateEnvironmentFormats(env);

      this.validationResults.environment = {
        buildVarsPresent: requiredBuildVars.length - missingBuildVars.length,
        runtimeVarsPresent: requiredRuntimeVars.length - missingRuntimeVars.length,
        totalRequired: requiredBuildVars.length + requiredRuntimeVars.length,
        envFilesFound: this.getEnvFilesFound()
      };

      if (missingBuildVars.length === 0 && missingRuntimeVars.length === 0) {
        this.info.push('✅ All required environment variables present');
      }

    } catch (error) {
      this.errors.push({
        type: 'environment',
        code: 'ENV_VALIDATION_ERROR',
        message: `Environment validation failed: ${error.message}`,
        remediation: [
          'Check .env files for syntax errors',
          'Ensure .env files are readable',
          'Verify file permissions'
        ]
      });
    }
  }

  /**
   * Validate dependencies are installed and compatible
   */
  async validateDependencies() {
    console.log('📦 Validating dependencies...');

    try {
      // Check if node_modules exists
      if (!fs.existsSync('node_modules')) {
        this.errors.push({
          type: 'dependency',
          code: 'MISSING_NODE_MODULES',
          message: 'node_modules directory not found',
          remediation: [
            'Run: npm install',
            'Ensure package.json exists',
            'Check npm is installed and working'
          ]
        });
        return;
      }

      // Check package-lock.json exists
      if (!fs.existsSync('package-lock.json')) {
        this.warnings.push({
          type: 'dependency',
          code: 'MISSING_PACKAGE_LOCK',
          message: 'package-lock.json not found',
          remediation: [
            'Run: npm install to generate package-lock.json',
            'Commit package-lock.json to version control'
          ]
        });
      }

      // Check for common missing dependencies
      const criticalDependencies = [
        '@react-router/node',
        '@react-router/serve',
        'react',
        'react-dom',
        '@prisma/client',
        'turbo'
      ];

      const missingDeps = [];
      for (const dep of criticalDependencies) {
        if (!fs.existsSync(path.join('node_modules', dep))) {
          missingDeps.push(dep);
        }
      }

      if (missingDeps.length > 0) {
        this.errors.push({
          type: 'dependency',
          code: 'MISSING_CRITICAL_DEPS',
          message: `Missing critical dependencies: ${missingDeps.join(', ')}`,
          remediation: [
            'Run: npm install',
            'Check package.json for correct dependency versions',
            'Clear node_modules and reinstall if needed: rm -rf node_modules package-lock.json && npm install'
          ],
          context: { missingDeps }
        });
      }

      // Check for peer dependency warnings
      try {
        const npmLsOutput = execSync('npm ls --depth=0 2>&1', { encoding: 'utf8' });
        if (npmLsOutput.includes('UNMET PEER DEPENDENCY') || npmLsOutput.includes('peer dep missing')) {
          this.warnings.push({
            type: 'dependency',
            code: 'UNMET_PEER_DEPS',
            message: 'Unmet peer dependencies detected',
            remediation: [
              'Run: npm ls to see detailed dependency tree',
              'Install missing peer dependencies',
              'Update dependencies to compatible versions'
            ]
          });
        }
      } catch (error) {
        // npm ls can exit with non-zero code for warnings, which is normal
        if (!error.stdout?.includes('npm ERR!')) {
          this.warnings.push({
            type: 'dependency',
            code: 'DEPENDENCY_CHECK_WARNING',
            message: 'Could not fully validate dependency tree',
            remediation: ['Run: npm ls manually to check dependencies']
          });
        }
      }

      this.validationResults.dependencies = {
        nodeModulesExists: fs.existsSync('node_modules'),
        packageLockExists: fs.existsSync('package-lock.json'),
        criticalDepsPresent: criticalDependencies.length - missingDeps.length,
        totalCritical: criticalDependencies.length
      };

      if (missingDeps.length === 0) {
        this.info.push('✅ All critical dependencies present');
      }

    } catch (error) {
      this.errors.push({
        type: 'dependency',
        code: 'DEPENDENCY_VALIDATION_ERROR',
        message: `Dependency validation failed: ${error.message}`,
        remediation: [
          'Check npm is installed and working',
          'Verify package.json is valid JSON',
          'Try: npm install --verbose for detailed output'
        ]
      });
    }
  }

  /**
   * Validate Turbo configuration
   */
  async validateTurboConfiguration() {
    console.log('⚡ Validating Turbo configuration...');

    try {
      if (!fs.existsSync('turbo.json')) {
        this.errors.push({
          type: 'configuration',
          code: 'MISSING_TURBO_CONFIG',
          message: 'turbo.json configuration file not found',
          remediation: [
            'Create turbo.json in project root',
            'Define build tasks and dependencies',
            'Specify output paths for each package'
          ]
        });
        return;
      }

      // Parse turbo.json
      const turboConfig = JSON.parse(fs.readFileSync('turbo.json', 'utf8'));

      // Check for required tasks
      const requiredTasks = ['build', 'dev'];
      const missingTasks = requiredTasks.filter(task => !turboConfig.pipeline?.[task]);
      
      if (missingTasks.length > 0) {
        this.warnings.push({
          type: 'configuration',
          code: 'MISSING_TURBO_TASKS',
          message: `Missing Turbo tasks: ${missingTasks.join(', ')}`,
          remediation: [
            'Add missing tasks to turbo.json pipeline',
            'Define appropriate outputs for each task',
            'Set up task dependencies if needed'
          ]
        });
      }

      // Validate output paths exist
      const outputIssues = [];
      if (turboConfig.pipeline) {
        for (const [taskName, taskConfig] of Object.entries(turboConfig.pipeline)) {
          if (taskConfig.outputs) {
            for (const output of taskConfig.outputs) {
              // Skip glob patterns and relative paths for now
              if (!output.includes('*') && !output.startsWith('./')) {
                const outputPath = path.resolve(output);
                if (!fs.existsSync(path.dirname(outputPath))) {
                  outputIssues.push(`${taskName}: ${output}`);
                }
              }
            }
          }
        }
      }

      if (outputIssues.length > 0) {
        this.warnings.push({
          type: 'configuration',
          code: 'TURBO_OUTPUT_PATH_ISSUES',
          message: `Turbo output paths may not exist: ${outputIssues.join(', ')}`,
          remediation: [
            'Verify output paths match actual build artifacts',
            'Create missing directories if needed',
            'Update turbo.json with correct paths'
          ]
        });
      }

      this.validationResults.turbo = {
        configExists: true,
        tasksConfigured: Object.keys(turboConfig.pipeline || {}).length,
        requiredTasksPresent: requiredTasks.length - missingTasks.length,
        outputIssues: outputIssues.length
      };

      if (missingTasks.length === 0 && outputIssues.length === 0) {
        this.info.push('✅ Turbo configuration looks good');
      }

    } catch (error) {
      this.errors.push({
        type: 'configuration',
        code: 'TURBO_CONFIG_ERROR',
        message: `Turbo configuration error: ${error.message}`,
        remediation: [
          'Check turbo.json for syntax errors',
          'Validate JSON format',
          'Ensure file is readable'
        ]
      });
    }
  }

  /**
   * Validate package configurations
   */
  async validatePackageConfigurations() {
    console.log('📋 Validating package configurations...');

    try {
      // Check main package.json
      if (!fs.existsSync('package.json')) {
        this.errors.push({
          type: 'configuration',
          code: 'MISSING_PACKAGE_JSON',
          message: 'Root package.json not found',
          remediation: [
            'Create package.json in project root',
            'Define project dependencies and scripts',
            'Set up workspace configuration if using monorepo'
          ]
        });
        return;
      }

      const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      // Check for required scripts
      const requiredScripts = ['build', 'dev'];
      const missingScripts = requiredScripts.filter(script => !rootPackage.scripts?.[script]);
      
      if (missingScripts.length > 0) {
        this.warnings.push({
          type: 'configuration',
          code: 'MISSING_PACKAGE_SCRIPTS',
          message: `Missing package scripts: ${missingScripts.join(', ')}`,
          remediation: [
            'Add missing scripts to package.json',
            'Define build and dev commands',
            'Use turbo for monorepo script orchestration'
          ]
        });
      }

      // Check workspace packages
      const workspaceIssues = [];
      if (rootPackage.workspaces) {
        const workspaces = Array.isArray(rootPackage.workspaces) 
          ? rootPackage.workspaces 
          : rootPackage.workspaces.packages || [];

        for (const workspace of workspaces) {
          // Simple glob expansion for common patterns
          const workspacePaths = this.expandWorkspaceGlob(workspace);
          
          for (const workspacePath of workspacePaths) {
            const packageJsonPath = path.join(workspacePath, 'package.json');
            if (!fs.existsSync(packageJsonPath)) {
              workspaceIssues.push(workspacePath);
            }
          }
        }
      }

      if (workspaceIssues.length > 0) {
        this.warnings.push({
          type: 'configuration',
          code: 'WORKSPACE_PACKAGE_ISSUES',
          message: `Workspace packages missing package.json: ${workspaceIssues.join(', ')}`,
          remediation: [
            'Create package.json in missing workspace directories',
            'Update workspace configuration in root package.json',
            'Remove unused workspace entries'
          ]
        });
      }

      this.validationResults.packages = {
        rootPackageExists: true,
        requiredScriptsPresent: requiredScripts.length - missingScripts.length,
        workspaceIssues: workspaceIssues.length,
        workspacesConfigured: rootPackage.workspaces ? true : false
      };

      if (missingScripts.length === 0 && workspaceIssues.length === 0) {
        this.info.push('✅ Package configurations look good');
      }

    } catch (error) {
      this.errors.push({
        type: 'configuration',
        code: 'PACKAGE_CONFIG_ERROR',
        message: `Package configuration error: ${error.message}`,
        remediation: [
          'Check package.json for syntax errors',
          'Validate JSON format',
          'Ensure file is readable'
        ]
      });
    }
  }

  /**
   * Validate build scripts exist and are executable
   */
  async validateBuildScripts() {
    console.log('🔧 Validating build scripts...');

    try {
      const buildScriptPaths = [
        'scripts/validate-build-env.js',
        'scripts/validate-environment.js'
      ];

      const missingScripts = buildScriptPaths.filter(script => !fs.existsSync(script));
      
      if (missingScripts.length > 0) {
        this.warnings.push({
          type: 'configuration',
          code: 'MISSING_BUILD_SCRIPTS',
          message: `Missing build scripts: ${missingScripts.join(', ')}`,
          remediation: [
            'Create missing build scripts',
            'Ensure scripts are executable',
            'Add proper error handling to scripts'
          ]
        });
      }

      // Check script permissions (Unix-like systems)
      if (process.platform !== 'win32') {
        const nonExecutableScripts = buildScriptPaths
          .filter(script => fs.existsSync(script))
          .filter(script => {
            try {
              const stats = fs.statSync(script);
              return !(stats.mode & parseInt('111', 8)); // Check execute permissions
            } catch {
              return false;
            }
          });

        if (nonExecutableScripts.length > 0) {
          this.warnings.push({
            type: 'configuration',
            code: 'NON_EXECUTABLE_SCRIPTS',
            message: `Scripts not executable: ${nonExecutableScripts.join(', ')}`,
            remediation: [
              'Make scripts executable: chmod +x <script-path>',
              'Add shebang line to scripts: #!/usr/bin/env node'
            ]
          });
        }
      }

      this.validationResults.buildScripts = {
        scriptsFound: buildScriptPaths.length - missingScripts.length,
        totalScripts: buildScriptPaths.length,
        allExecutable: missingScripts.length === 0
      };

      if (missingScripts.length === 0) {
        this.info.push('✅ Build scripts are available');
      }

    } catch (error) {
      this.warnings.push({
        type: 'configuration',
        code: 'BUILD_SCRIPT_VALIDATION_ERROR',
        message: `Build script validation failed: ${error.message}`,
        remediation: [
          'Check file system permissions',
          'Verify script paths are correct'
        ]
      });
    }
  }

  /**
   * Check for common configuration issues
   */
  async checkCommonIssues() {
    console.log('🔍 Checking for common issues...');

    const issues = [];

    // Check for .env.example but no .env.local
    if (fs.existsSync('.env.example') && !fs.existsSync('.env.local')) {
      issues.push({
        type: 'configuration',
        code: 'MISSING_ENV_LOCAL',
        message: '.env.example exists but .env.local is missing',
        remediation: [
          'Copy .env.example to .env.local',
          'Fill in actual values in .env.local',
          'Add .env.local to .gitignore'
        ]
      });
    }

    // Check for large node_modules (potential issue)
    if (fs.existsSync('node_modules')) {
      try {
        const stats = fs.statSync('node_modules');
        // This is a rough check - in practice you'd want to calculate actual size
        if (stats.isDirectory()) {
          const nodeModulesContents = fs.readdirSync('node_modules');
          if (nodeModulesContents.length > 1000) {
            issues.push({
              type: 'dependency',
              code: 'LARGE_NODE_MODULES',
              message: 'node_modules directory is very large',
              remediation: [
                'Consider using npm ci for faster installs',
                'Review dependencies for unused packages',
                'Use .npmrc to configure package-lock settings'
              ]
            });
          }
        }
      } catch (error) {
        // Ignore errors checking node_modules size
      }
    }

    // Check for conflicting lock files
    const lockFiles = ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    const presentLockFiles = lockFiles.filter(file => fs.existsSync(file));
    
    if (presentLockFiles.length > 1) {
      issues.push({
        type: 'configuration',
        code: 'MULTIPLE_LOCK_FILES',
        message: `Multiple lock files found: ${presentLockFiles.join(', ')}`,
        remediation: [
          'Choose one package manager and remove other lock files',
          'Ensure team uses consistent package manager',
          'Add unused lock files to .gitignore'
        ]
      });
    }

    // Add issues to warnings
    this.warnings.push(...issues);

    this.validationResults.commonIssues = {
      issuesFound: issues.length,
      envLocalMissing: !fs.existsSync('.env.local') && fs.existsSync('.env.example'),
      multipleLockFiles: presentLockFiles.length > 1
    };

    if (issues.length === 0) {
      this.info.push('✅ No common configuration issues detected');
    }
  }

  /**
   * Load environment variables from files
   */
  loadEnvironmentVariables() {
    const env = { ...process.env };
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];

    for (const envFile of envFiles) {
      if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').replace(/^["']|["']$/g, '');
              if (!env[key]) {
                env[key] = value;
              }
            }
          }
        }
      }
    }

    return env;
  }

  /**
   * Validate environment variable formats
   */
  validateEnvironmentFormats(env) {
    // Check URL formats
    const urlVars = [
      'NEXT_PUBLIC_WEBAPP_URL',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_API_URL'
    ];

    for (const varName of urlVars) {
      if (env[varName] && !env[varName].match(/^https?:\/\/.+/)) {
        this.warnings.push({
          type: 'environment',
          code: 'INVALID_URL_FORMAT',
          message: `${varName} should be a valid HTTP/HTTPS URL`,
          remediation: [
            `Update ${varName} to include http:// or https://`,
            'Ensure URL is properly formatted',
            'Check for typos in the URL'
          ]
        });
      }
    }

    // Check database URL format
    if (env['NEXT_PRIVATE_DATABASE_URL'] && 
        !env['NEXT_PRIVATE_DATABASE_URL'].match(/^postgresql:\/\/.+/)) {
      this.warnings.push({
        type: 'environment',
        code: 'INVALID_DATABASE_URL',
        message: 'NEXT_PRIVATE_DATABASE_URL should be a valid PostgreSQL connection string',
        remediation: [
          'Use format: postgresql://user:password@host:port/database',
          'Ensure database credentials are correct',
          'Test database connection'
        ]
      });
    }

    // Check encryption key lengths
    const encryptionKeys = [
      'NEXTAUTH_SECRET',
      'NEXT_PRIVATE_ENCRYPTION_KEY',
      'JWT_SECRET'
    ];

    for (const key of encryptionKeys) {
      if (env[key] && env[key].length < 32) {
        this.warnings.push({
          type: 'environment',
          code: 'WEAK_ENCRYPTION_KEY',
          message: `${key} should be at least 32 characters for security`,
          remediation: [
            `Generate a longer ${key} (32+ characters)`,
            'Use a secure random string generator',
            'Consider using openssl rand -hex 32'
          ]
        });
      }
    }
  }

  /**
   * Get list of environment files found
   */
  getEnvFilesFound() {
    const envFiles = ['.env', '.env.local', '.env.development', '.env.production', '.env.example'];
    return envFiles.filter(file => fs.existsSync(file));
  }

  /**
   * Simple workspace glob expansion
   */
  expandWorkspaceGlob(workspace) {
    // Handle simple cases like "apps/*" and "packages/*"
    if (workspace.endsWith('/*')) {
      const baseDir = workspace.slice(0, -2);
      if (fs.existsSync(baseDir)) {
        return fs.readdirSync(baseDir)
          .map(dir => path.join(baseDir, dir))
          .filter(dir => fs.statSync(dir).isDirectory());
      }
    }
    
    // Return as-is for non-glob patterns
    return [workspace];
  }

  /**
   * Generate validation report
   */
  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      validationResults: this.validationResults,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        criticalErrors: this.errors.filter(e => e.type === 'environment' || e.type === 'dependency').length,
        passed: this.errors.length === 0
      }
    };

    // Save report to file
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }
    
    const reportPath = `logs/pre-build-validation-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.info.push(`📄 Validation report saved to: ${reportPath}`);
  }

  /**
   * Report validation results
   */
  reportResults() {
    console.log('\n' + '='.repeat(60));
    console.log('PRE-BUILD VALIDATION RESULTS');
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
    console.log('\n📊 VALIDATION SUMMARY:');
    console.log(`   Total Errors: ${this.errors.length}`);
    console.log(`   Total Warnings: ${this.warnings.length}`);
    console.log(`   Critical Errors: ${this.errors.filter(e => e.type === 'environment' || e.type === 'dependency').length}`);

    if (this.errors.length === 0) {
      console.log('\n✅ Pre-build validation passed! Build can proceed.');
    } else {
      console.log('\n❌ Pre-build validation failed! Fix errors before building.');
      console.log('\nNext steps:');
      console.log('1. Review the errors listed above');
      console.log('2. Follow the remediation steps for each error');
      console.log('3. Run this validation again: npm run validate:pre-build');
      console.log('4. Once validation passes, run the build: npm run build');
    }

    console.log('='.repeat(60));
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PreBuildValidator();
  validator.validate().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Pre-build validation crashed:', error);
    process.exit(1);
  });
}

module.exports = PreBuildValidator;