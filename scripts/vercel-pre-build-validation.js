#!/usr/bin/env node

/**
 * Vercel Pre-Build Validation Script
 * Comprehensive validation specifically for Vercel deployment environment
 * Validates dependencies, environment variables, and Vercel-specific requirements
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class VercelPreBuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.info = [];
    this.validationResults = {};
    this.isVercelEnvironment = this.detectVercelEnvironment();
  }

  /**
   * Detect if running in Vercel build environment
   */
  detectVercelEnvironment() {
    return !!(
      process.env.VERCEL ||
      process.env.VERCEL_ENV ||
      process.env.VERCEL_URL ||
      process.env.CI === 'true' && process.env.VERCEL_GIT_COMMIT_SHA
    );
  }

  /**
   * Run all Vercel-specific pre-build validations
   */
  async validate() {
    console.log('🔍 Running Vercel pre-build validation...\n');

    try {
      // Core validations
      await this.validateVercelEnvironment();
      await this.validateDependencyAvailability();
      await this.validateBuildScriptCompatibility();
      await this.validateEnvironmentVariables();
      await this.validateTurboConfiguration();
      await this.validatePackageJsonCompleteness();
      await this.validateVercelSpecificRequirements();

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
        validationResults: this.validationResults,
        isVercelEnvironment: this.isVercelEnvironment
      };

    } catch (error) {
      this.errors.push(`Vercel pre-build validation failed: ${error.message}`);
      this.reportResults();
      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings,
        info: this.info,
        validationResults: this.validationResults,
        isVercelEnvironment: this.isVercelEnvironment
      };
    }
  }

  /**
   * Validate Vercel environment detection and configuration
   */
  async validateVercelEnvironment() {
    console.log('🌐 Validating Vercel environment...');

    try {
      if (this.isVercelEnvironment) {
        this.info.push('✅ Running in Vercel build environment');
        
        // Check Vercel-specific environment variables
        const vercelVars = {
          'VERCEL': 'Vercel deployment indicator',
          'VERCEL_ENV': 'Vercel environment (development, preview, production)',
          'VERCEL_URL': 'Vercel deployment URL',
          'VERCEL_GIT_COMMIT_SHA': 'Git commit SHA for this deployment'
        };

        for (const [varName, description] of Object.entries(vercelVars)) {
          if (process.env[varName]) {
            this.info.push(`✅ ${varName}: ${process.env[varName]}`);
          } else {
            this.warnings.push({
              type: 'vercel',
              code: 'MISSING_VERCEL_VAR',
              message: `${varName} not set (${description})`,
              remediation: ['This may be normal for local testing']
            });
          }
        }
      } else {
        this.info.push('ℹ️  Running in local/non-Vercel environment');
      }

      this.validationResults.vercelEnvironment = {
        isVercelEnvironment: this.isVercelEnvironment,
        vercelEnv: process.env.VERCEL_ENV || 'local',
        vercelUrl: process.env.VERCEL_URL || 'localhost'
      };

    } catch (error) {
      this.errors.push({
        type: 'vercel',
        code: 'VERCEL_ENV_ERROR',
        message: `Vercel environment validation failed: ${error.message}`,
        remediation: ['Check Vercel environment configuration']
      });
    }
  }

  /**
   * Validate all required dependencies are available as installed packages
   */
  async validateDependencyAvailability() {
    console.log('📦 Validating dependency availability for Vercel...');

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
            'Vercel should install dependencies automatically'
          ]
        });
        return;
      }

      // Critical dependencies that must be available as packages (not global)
      const criticalDependencies = [
        // Build tools
        'cross-env',
        'dotenv',
        'turbo',
        
        // React Router
        '@react-router/dev',
        '@react-router/node',
        '@react-router/serve',
        
        // Core React
        'react',
        'react-dom',
        
        // Database
        '@prisma/client',
        'prisma',
        
        // Build dependencies
        'rollup',
        'typescript',
        'vite'
      ];

      const missingDeps = [];
      const availableDeps = [];

      for (const dep of criticalDependencies) {
        const depPath = path.join('node_modules', dep);
        if (fs.existsSync(depPath)) {
          availableDeps.push(dep);
        } else {
          missingDeps.push(dep);
        }
      }

      if (missingDeps.length > 0) {
        this.errors.push({
          type: 'dependency',
          code: 'MISSING_CRITICAL_DEPS',
          message: `Missing critical dependencies for Vercel build: ${missingDeps.join(', ')}`,
          remediation: [
            'Add missing dependencies to package.json',
            'Run: npm install',
            'Ensure dependencies are in "dependencies" not just "devDependencies"',
            'Check if dependencies are listed in correct package.json files'
          ],
          context: { missingDeps, availableDeps }
        });
      }

      // Check for CLI tools that should NOT be used globally
      const cliToolsToAvoid = [
        'dotenv-cli', // Should use programmatic dotenv instead
        'cross-env', // Should be installed as dependency
        'turbo' // Should be installed as dependency
      ];

      const cliIssues = [];
      for (const tool of cliToolsToAvoid) {
        try {
          // Check if tool is available globally but not locally
          execSync(`which ${tool}`, { stdio: 'ignore' });
          if (!fs.existsSync(path.join('node_modules', '.bin', tool))) {
            cliIssues.push(tool);
          }
        } catch {
          // Tool not available globally, which is good
        }
      }

      if (cliIssues.length > 0) {
        this.warnings.push({
          type: 'dependency',
          code: 'GLOBAL_CLI_TOOLS',
          message: `CLI tools available globally but not locally: ${cliIssues.join(', ')}`,
          remediation: [
            'Install CLI tools as local dependencies',
            'Use npx to run CLI tools from node_modules',
            'Avoid relying on global installations in Vercel'
          ]
        });
      }

      this.validationResults.dependencies = {
        nodeModulesExists: fs.existsSync('node_modules'),
        criticalDepsPresent: availableDeps.length,
        totalCritical: criticalDependencies.length,
        missingDeps: missingDeps.length,
        cliIssues: cliIssues.length
      };

      if (missingDeps.length === 0) {
        this.info.push('✅ All critical dependencies available for Vercel build');
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
   * Validate build scripts are compatible with Vercel environment
   */
  async validateBuildScriptCompatibility() {
    console.log('🔧 Validating build script compatibility...');

    try {
      // Check main package.json build scripts
      const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const buildScripts = rootPackage.scripts || {};

      // Required build scripts for Vercel
      const requiredScripts = ['build', 'build:vercel'];
      const missingScripts = requiredScripts.filter(script => !buildScripts[script]);

      if (missingScripts.length > 0) {
        this.errors.push({
          type: 'build',
          code: 'MISSING_BUILD_SCRIPTS',
          message: `Missing required build scripts: ${missingScripts.join(', ')}`,
          remediation: [
            'Add missing build scripts to package.json',
            'Ensure build:vercel script exists for Vercel deployment',
            'Use Vercel-compatible build commands'
          ]
        });
      }

      // Check for problematic script patterns
      const problematicPatterns = [
        { pattern: /dotenv\s+-e/, issue: 'Uses dotenv CLI instead of programmatic loading' },
        { pattern: /with:env/, issue: 'Uses custom env wrapper that may not work in Vercel' },
        { pattern: /\$\(.*\)/, issue: 'Uses shell command substitution' },
        { pattern: /&&.*dotenv/, issue: 'Chains commands with dotenv CLI' }
      ];

      const scriptIssues = [];
      for (const [scriptName, scriptCommand] of Object.entries(buildScripts)) {
        for (const { pattern, issue } of problematicPatterns) {
          if (pattern.test(scriptCommand)) {
            scriptIssues.push({
              script: scriptName,
              command: scriptCommand,
              issue: issue
            });
          }
        }
      }

      if (scriptIssues.length > 0) {
        this.warnings.push({
          type: 'build',
          code: 'PROBLEMATIC_BUILD_SCRIPTS',
          message: 'Build scripts may not work in Vercel environment',
          remediation: [
            'Replace dotenv CLI usage with programmatic loading',
            'Use cross-env for environment variables',
            'Avoid shell-specific syntax',
            'Test scripts in constrained environment'
          ],
          context: { scriptIssues }
        });
      }

      // Check Remix app build scripts
      const remixPackagePath = 'apps/remix/package.json';
      if (fs.existsSync(remixPackagePath)) {
        const remixPackage = JSON.parse(fs.readFileSync(remixPackagePath, 'utf8'));
        const remixScripts = remixPackage.scripts || {};

        if (!remixScripts['build:vercel']) {
          this.errors.push({
            type: 'build',
            code: 'MISSING_REMIX_VERCEL_SCRIPT',
            message: 'Remix app missing build:vercel script',
            remediation: [
              'Add build:vercel script to apps/remix/package.json',
              'Ensure script uses Vercel-compatible build process',
              'Test script in Vercel environment'
            ]
          });
        }
      }

      this.validationResults.buildScripts = {
        requiredScriptsPresent: requiredScripts.length - missingScripts.length,
        totalRequired: requiredScripts.length,
        scriptIssues: scriptIssues.length,
        remixVercelScriptExists: fs.existsSync(remixPackagePath) && 
          JSON.parse(fs.readFileSync(remixPackagePath, 'utf8')).scripts?.['build:vercel']
      };

      if (missingScripts.length === 0 && scriptIssues.length === 0) {
        this.info.push('✅ Build scripts are Vercel-compatible');
      }

    } catch (error) {
      this.errors.push({
        type: 'build',
        code: 'BUILD_SCRIPT_VALIDATION_ERROR',
        message: `Build script validation failed: ${error.message}`,
        remediation: [
          'Check package.json syntax',
          'Verify build scripts are properly defined'
        ]
      });
    }
  }

  /**
   * Validate environment variables for Vercel deployment
   */
  async validateEnvironmentVariables() {
    console.log('📋 Validating environment variables for Vercel...');

    try {
      // Load environment variables
      const env = this.loadEnvironmentVariables();
      
      // Required variables for Vercel deployment
      const requiredVercelVars = {
        // Build-time variables (must be NEXT_PUBLIC_ or NODE_ENV)
        'NODE_ENV': { required: true, buildTime: true },
        'NEXT_PUBLIC_APP_URL': { required: true, buildTime: true, pattern: /^https?:\/\/.+/ },
        
        // Runtime variables
        'DATABASE_URL': { required: true, runtime: true, pattern: /^postgresql:\/\/.+/ },
        'NEXTAUTH_SECRET': { required: true, runtime: true, minLength: 32 },
        'NEXT_PRIVATE_ENCRYPTION_KEY': { required: true, runtime: true, exactLength: 32 },
        
        // File storage
        'NEXT_PUBLIC_UPLOAD_TRANSPORT': { required: true, buildTime: true },
        'AWS_ACCESS_KEY_ID': { required: true, runtime: true },
        'AWS_SECRET_ACCESS_KEY': { required: true, runtime: true },
        'AWS_REGION': { required: true, runtime: true },
        'NEXT_PRIVATE_UPLOAD_BUCKET': { required: true, runtime: true }
      };

      const missingVars = [];
      const invalidVars = [];

      for (const [varName, config] of Object.entries(requiredVercelVars)) {
        const value = env[varName];
        
        if (!value || value.trim() === '') {
          if (config.required) {
            missingVars.push({
              name: varName,
              buildTime: config.buildTime,
              runtime: config.runtime
            });
          }
          continue;
        }

        // Validate format
        if (config.pattern && !config.pattern.test(value)) {
          invalidVars.push({
            name: varName,
            issue: `Invalid format (expected: ${config.pattern})`
          });
        }

        if (config.minLength && value.length < config.minLength) {
          invalidVars.push({
            name: varName,
            issue: `Too short (minimum: ${config.minLength}, current: ${value.length})`
          });
        }

        if (config.exactLength && value.length !== config.exactLength) {
          invalidVars.push({
            name: varName,
            issue: `Wrong length (expected: ${config.exactLength}, current: ${value.length})`
          });
        }
      }

      if (missingVars.length > 0) {
        const buildTimeVars = missingVars.filter(v => v.buildTime).map(v => v.name);
        const runtimeVars = missingVars.filter(v => v.runtime).map(v => v.name);

        if (buildTimeVars.length > 0) {
          this.errors.push({
            type: 'environment',
            code: 'MISSING_BUILD_TIME_VARS',
            message: `Missing build-time variables for Vercel: ${buildTimeVars.join(', ')}`,
            remediation: [
              'Add variables to Vercel dashboard Environment Variables',
              'Ensure build-time variables start with NEXT_PUBLIC_',
              'Set variables for all environments (Development, Preview, Production)',
              'Redeploy after adding variables'
            ],
            context: { missingVars: buildTimeVars }
          });
        }

        if (runtimeVars.length > 0) {
          this.errors.push({
            type: 'environment',
            code: 'MISSING_RUNTIME_VARS',
            message: `Missing runtime variables for Vercel: ${runtimeVars.join(', ')}`,
            remediation: [
              'Add variables to Vercel dashboard Environment Variables',
              'Runtime variables can have any name',
              'Set variables for appropriate environments',
              'Use secure values for production'
            ],
            context: { missingVars: runtimeVars }
          });
        }
      }

      if (invalidVars.length > 0) {
        this.errors.push({
          type: 'environment',
          code: 'INVALID_ENV_VARS',
          message: 'Environment variables have invalid formats',
          remediation: [
            'Fix variable formats in Vercel dashboard',
            'Ensure URLs include protocol (http:// or https://)',
            'Use proper database connection strings',
            'Generate secure keys with correct lengths'
          ],
          context: { invalidVars }
        });
      }

      // Check for environment variable accessibility in Vercel
      if (this.isVercelEnvironment) {
        const vercelAccessibleVars = Object.keys(process.env).filter(key => 
          key.startsWith('NEXT_PUBLIC_') || 
          key.startsWith('VERCEL_') ||
          !key.startsWith('NEXT_PUBLIC_')
        );

        this.info.push(`✅ ${vercelAccessibleVars.length} environment variables accessible in Vercel`);
      }

      this.validationResults.environment = {
        requiredVarsPresent: Object.keys(requiredVercelVars).length - missingVars.length,
        totalRequired: Object.keys(requiredVercelVars).length,
        invalidVars: invalidVars.length,
        buildTimeVarsMissing: missingVars.filter(v => v.buildTime).length,
        runtimeVarsMissing: missingVars.filter(v => v.runtime).length
      };

      if (missingVars.length === 0 && invalidVars.length === 0) {
        this.info.push('✅ All required environment variables configured for Vercel');
      }

    } catch (error) {
      this.errors.push({
        type: 'environment',
        code: 'ENV_VALIDATION_ERROR',
        message: `Environment validation failed: ${error.message}`,
        remediation: [
          'Check environment variable configuration',
          'Verify Vercel dashboard settings',
          'Test environment loading locally'
        ]
      });
    }
  }

  /**
   * Validate Turbo configuration for Vercel
   */
  async validateTurboConfiguration() {
    console.log('⚡ Validating Turbo configuration for Vercel...');

    try {
      if (!fs.existsSync('turbo.json')) {
        this.errors.push({
          type: 'configuration',
          code: 'MISSING_TURBO_CONFIG',
          message: 'turbo.json configuration file not found',
          remediation: [
            'Create turbo.json in project root',
            'Configure environment variables for Vercel',
            'Define proper task dependencies'
          ]
        });
        return;
      }

      const turboConfig = JSON.parse(fs.readFileSync('turbo.json', 'utf8'));

      // Check for environment variable declarations
      const envVars = turboConfig.globalEnv || [];
      const requiredEnvVars = [
        'NODE_ENV',
        'NEXT_PUBLIC_APP_URL',
        'DATABASE_URL',
        'NEXTAUTH_SECRET',
        'NEXT_PRIVATE_ENCRYPTION_KEY'
      ];

      const missingEnvVars = requiredEnvVars.filter(varName => !envVars.includes(varName));

      if (missingEnvVars.length > 0) {
        this.warnings.push({
          type: 'configuration',
          code: 'MISSING_TURBO_ENV_VARS',
          message: `Turbo config missing environment variables: ${missingEnvVars.join(', ')}`,
          remediation: [
            'Add missing variables to turbo.json globalEnv array',
            'Ensure Vercel can pass environment variables to Turbo tasks',
            'Include all variables needed by build tasks'
          ],
          context: { missingEnvVars }
        });
      }

      // Check for Vercel-compatible caching
      const pipeline = turboConfig.pipeline || {};
      const buildTask = pipeline.build;

      if (buildTask && !buildTask.env) {
        this.warnings.push({
          type: 'configuration',
          code: 'TURBO_BUILD_ENV_MISSING',
          message: 'Turbo build task missing environment variable configuration',
          remediation: [
            'Add env array to build task in turbo.json',
            'Include environment variables needed for build',
            'Ensure proper cache invalidation'
          ]
        });
      }

      this.validationResults.turbo = {
        configExists: true,
        globalEnvVars: envVars.length,
        requiredEnvVarsPresent: requiredEnvVars.length - missingEnvVars.length,
        buildTaskConfigured: !!buildTask,
        buildTaskHasEnv: !!(buildTask && buildTask.env)
      };

      if (missingEnvVars.length === 0) {
        this.info.push('✅ Turbo configuration compatible with Vercel');
      }

    } catch (error) {
      this.errors.push({
        type: 'configuration',
        code: 'TURBO_CONFIG_ERROR',
        message: `Turbo configuration error: ${error.message}`,
        remediation: [
          'Check turbo.json syntax',
          'Validate JSON format',
          'Ensure file is readable'
        ]
      });
    }
  }

  /**
   * Validate package.json completeness for Vercel
   */
  async validatePackageJsonCompleteness() {
    console.log('📋 Validating package.json completeness for Vercel...');

    try {
      // Check root package.json
      const rootPackage = JSON.parse(fs.readFileSync('package.json', 'utf8'));

      // Required fields for Vercel
      const requiredFields = ['name', 'version', 'scripts', 'engines'];
      const missingFields = requiredFields.filter(field => !rootPackage[field]);

      if (missingFields.length > 0) {
        this.warnings.push({
          type: 'configuration',
          code: 'MISSING_PACKAGE_FIELDS',
          message: `Missing package.json fields: ${missingFields.join(', ')}`,
          remediation: [
            'Add missing fields to package.json',
            'Specify Node.js version in engines field',
            'Ensure proper versioning'
          ]
        });
      }

      // Check Node.js version compatibility
      const engines = rootPackage.engines || {};
      if (!engines.node) {
        this.warnings.push({
          type: 'configuration',
          code: 'MISSING_NODE_VERSION',
          message: 'Node.js version not specified in engines field',
          remediation: [
            'Add "node": ">=20.0.0" to engines field',
            'Ensure compatibility with Vercel Node.js runtime',
            'Test with specified Node.js version'
          ]
        });
      } else {
        // Parse Node.js version requirement
        const nodeVersion = engines.node;
        if (!nodeVersion.match(/>=?\d+\.\d+\.\d+/)) {
          this.warnings.push({
            type: 'configuration',
            code: 'INVALID_NODE_VERSION',
            message: `Invalid Node.js version format: ${nodeVersion}`,
            remediation: [
              'Use proper semver format (e.g., ">=20.0.0")',
              'Ensure compatibility with Vercel runtime'
            ]
          });
        }
      }

      // Check for build dependencies in correct location
      const buildDeps = ['cross-env', 'dotenv', 'turbo', 'typescript'];
      const devDependencies = rootPackage.devDependencies || {};
      const dependencies = rootPackage.dependencies || {};

      const misplacedDeps = buildDeps.filter(dep => 
        devDependencies[dep] && !dependencies[dep]
      );

      if (misplacedDeps.length > 0) {
        this.warnings.push({
          type: 'dependency',
          code: 'MISPLACED_BUILD_DEPS',
          message: `Build dependencies in devDependencies: ${misplacedDeps.join(', ')}`,
          remediation: [
            'Move build dependencies to dependencies section',
            'Vercel needs build tools available in production',
            'Keep development-only tools in devDependencies'
          ],
          context: { misplacedDeps }
        });
      }

      this.validationResults.packageJson = {
        requiredFieldsPresent: requiredFields.length - missingFields.length,
        totalRequired: requiredFields.length,
        nodeVersionSpecified: !!engines.node,
        misplacedDeps: misplacedDeps.length
      };

      if (missingFields.length === 0 && misplacedDeps.length === 0) {
        this.info.push('✅ Package.json configuration complete for Vercel');
      }

    } catch (error) {
      this.errors.push({
        type: 'configuration',
        code: 'PACKAGE_JSON_ERROR',
        message: `Package.json validation failed: ${error.message}`,
        remediation: [
          'Check package.json syntax',
          'Validate JSON format',
          'Ensure file is readable'
        ]
      });
    }
  }

  /**
   * Validate Vercel-specific requirements
   */
  async validateVercelSpecificRequirements() {
    console.log('🚀 Validating Vercel-specific requirements...');

    try {
      // Check for vercel.json configuration
      if (fs.existsSync('vercel.json')) {
        const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
        
        // Validate build command
        if (vercelConfig.buildCommand) {
          this.info.push(`✅ Custom build command configured: ${vercelConfig.buildCommand}`);
        } else {
          this.info.push('ℹ️  Using default Vercel build command');
        }

        // Check for function configuration
        if (vercelConfig.functions) {
          this.info.push('✅ Vercel functions configuration found');
        }

        // Check for redirects/rewrites
        if (vercelConfig.redirects || vercelConfig.rewrites) {
          this.info.push('✅ URL routing configuration found');
        }
      } else {
        this.info.push('ℹ️  No vercel.json found (using defaults)');
      }

      // Check for build output directory
      const buildOutputs = [
        'apps/remix/build',
        'apps/remix/.react-router',
        'build',
        'dist'
      ];

      const existingOutputs = buildOutputs.filter(dir => fs.existsSync(dir));
      if (existingOutputs.length > 0) {
        this.info.push(`✅ Build output directories found: ${existingOutputs.join(', ')}`);
      }

      // Check for Vercel-specific files
      const vercelFiles = [
        '.vercelignore',
        'api/',
        'public/'
      ];

      const existingVercelFiles = vercelFiles.filter(file => fs.existsSync(file));
      if (existingVercelFiles.length > 0) {
        this.info.push(`✅ Vercel-specific files found: ${existingVercelFiles.join(', ')}`);
      }

      // Validate build size constraints
      if (fs.existsSync('node_modules')) {
        try {
          const stats = fs.statSync('node_modules');
          // This is a rough check - Vercel has deployment size limits
          this.info.push('ℹ️  Build size validation would require actual build');
        } catch (error) {
          // Ignore size check errors
        }
      }

      this.validationResults.vercelSpecific = {
        vercelConfigExists: fs.existsSync('vercel.json'),
        buildOutputsFound: existingOutputs.length,
        vercelFilesFound: existingVercelFiles.length
      };

      this.info.push('✅ Vercel-specific requirements validated');

    } catch (error) {
      this.warnings.push({
        type: 'vercel',
        code: 'VERCEL_SPECIFIC_ERROR',
        message: `Vercel-specific validation failed: ${error.message}`,
        remediation: [
          'Check vercel.json syntax if it exists',
          'Verify Vercel configuration'
        ]
      });
    }
  }

  /**
   * Load environment variables from files and process.env
   */
  loadEnvironmentVariables() {
    const env = { ...process.env };
    const envFiles = ['.env.local', '.env', '.env.production', '.env.development'];

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
   * Generate validation report
   */
  generateValidationReport() {
    const report = {
      timestamp: new Date().toISOString(),
      environment: this.isVercelEnvironment ? 'vercel' : 'local',
      vercelEnv: process.env.VERCEL_ENV || 'development',
      validationResults: this.validationResults,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        criticalErrors: this.errors.filter(e => 
          e.type === 'dependency' || 
          e.type === 'environment' || 
          e.type === 'build'
        ).length,
        passed: this.errors.length === 0,
        vercelReady: this.errors.length === 0 && this.warnings.length < 5
      }
    };

    // Save report to file
    if (!fs.existsSync('logs')) {
      fs.mkdirSync('logs', { recursive: true });
    }
    
    const reportPath = `logs/vercel-pre-build-validation-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.info.push(`📄 Vercel validation report saved to: ${reportPath}`);
  }

  /**
   * Report validation results
   */
  reportResults() {
    console.log('\n' + '='.repeat(70));
    console.log('VERCEL PRE-BUILD VALIDATION RESULTS');
    console.log('='.repeat(70));

    // Environment info
    console.log(`\n🌐 Environment: ${this.isVercelEnvironment ? 'Vercel' : 'Local'}`);
    if (this.isVercelEnvironment) {
      console.log(`   Vercel Environment: ${process.env.VERCEL_ENV || 'unknown'}`);
      console.log(`   Vercel URL: ${process.env.VERCEL_URL || 'unknown'}`);
    }

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
    console.log(`   Critical Errors: ${this.errors.filter(e => 
      e.type === 'dependency' || e.type === 'environment' || e.type === 'build'
    ).length}`);

    if (this.errors.length === 0) {
      console.log('\n✅ Vercel pre-build validation passed! Deployment can proceed.');
      if (this.warnings.length > 0) {
        console.log('⚠️  Consider addressing warnings for optimal deployment.');
      }
    } else {
      console.log('\n❌ Vercel pre-build validation failed! Fix errors before deploying.');
      console.log('\nNext steps:');
      console.log('1. Review the errors listed above');
      console.log('2. Follow the remediation steps for each error');
      console.log('3. Configure missing environment variables in Vercel dashboard');
      console.log('4. Run this validation again: npm run validate:vercel');
      console.log('5. Once validation passes, deploy to Vercel');
    }

    console.log('\n📚 For detailed setup instructions, see:');
    console.log('   docs/VERCEL_DEPLOYMENT_ENVIRONMENT_SETUP.md');
    console.log('   docs/VERCEL_ENV_QUICK_REFERENCE.md');
    console.log('='.repeat(70));
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new VercelPreBuildValidator();
  validator.validate().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Vercel pre-build validation crashed:', error);
    process.exit(1);
  });
}

module.exports = VercelPreBuildValidator;