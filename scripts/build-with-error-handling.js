#!/usr/bin/env node

/**
 * Build Script with Enhanced Error Handling
 * Wraps the build process with comprehensive error reporting and diagnostics
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Import our error handler (if available)
let BuildErrorHandler;
try {
  const { BuildErrorHandler: Handler } = require('../packages/lib/src/build-error-handler');
  BuildErrorHandler = Handler;
} catch (error) {
  console.warn('⚠️  Build error handler not available, using basic error reporting');
  BuildErrorHandler = null;
}

class EnhancedBuildRunner {
  constructor() {
    this.errorHandler = BuildErrorHandler ? new BuildErrorHandler() : null;
    this.startTime = Date.now();
  }

  /**
   * Run the complete build process with error handling
   */
  async runBuild() {
    console.log('🚀 Starting enhanced build process...\n');

    try {
      // Step 1: Pre-build validation
      await this.runPreBuildValidation();

      // Step 2: Environment validation
      await this.runEnvironmentValidation();

      // Step 3: Run the actual build
      await this.runTurboBuild();

      // Step 4: Post-build validation
      await this.runPostBuildValidation();

      console.log('\n✅ Build completed successfully!');
      this.printBuildSummary(true);
      
      return { success: true };

    } catch (error) {
      console.error('\n❌ Build failed!');
      
      if (this.errorHandler) {
        this.errorHandler.handleJavaScriptError(error, {
          operation: 'build process',
          file: 'build-with-error-handling.js'
        });
        this.errorHandler.printSummary();
        this.errorHandler.saveReport();
      } else {
        console.error('Error:', error.message);
        if (error.stack) {
          console.error('Stack:', error.stack);
        }
      }

      this.printBuildSummary(false);
      return { success: false, error };
    }
  }

  /**
   * Run pre-build validation
   */
  async runPreBuildValidation() {
    console.log('🔍 Running pre-build validation...');

    try {
      const result = execSync('node scripts/pre-build-validation.js', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log(result);
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.addError({
          type: 'configuration',
          code: 'PRE_BUILD_VALIDATION_FAILED',
          message: 'Pre-build validation failed',
          details: error.stdout || error.message,
          remediation: [
            'Fix the validation errors listed above',
            'Ensure all required environment variables are set',
            'Check that all dependencies are installed',
            'Verify configuration files are correct'
          ]
        });
      }
      throw new Error(`Pre-build validation failed: ${error.message}`);
    }
  }

  /**
   * Run environment validation
   */
  async runEnvironmentValidation() {
    console.log('🌍 Validating build environment...');

    try {
      const result = execSync('node scripts/validate-build-env.js', {
        encoding: 'utf8',
        stdio: 'pipe'
      });
      console.log(result);
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleEnvironmentError('BUILD_ENVIRONMENT', 'Valid build environment');
      }
      throw new Error(`Environment validation failed: ${error.message}`);
    }
  }

  /**
   * Run Turbo build with enhanced error handling
   */
  async runTurboBuild() {
    console.log('⚡ Running Turbo build...');

    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npx', ['turbo', 'run', 'build'], {
        stdio: 'pipe',
        env: process.env
      });

      let stdout = '';
      let stderr = '';

      buildProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        process.stdout.write(output);
      });

      buildProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        process.stderr.write(output);

        // Parse common error patterns
        this.parseAndHandleBuildErrors(output);
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          const error = new Error(`Build process exited with code ${code}`);
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
        }
      });

      buildProcess.on('error', (error) => {
        if (this.errorHandler) {
          this.errorHandler.addError({
            type: 'runtime',
            code: 'BUILD_PROCESS_ERROR',
            message: `Build process error: ${error.message}`,
            remediation: [
              'Check that Turbo is installed: npm install turbo',
              'Verify turbo.json configuration is correct',
              'Ensure all workspace packages are properly configured',
              'Try: npx turbo run build --dry-run to test configuration'
            ]
          });
        }
        reject(error);
      });
    });
  }

  /**
   * Parse build output and handle common error patterns
   */
  parseAndHandleBuildErrors(output) {
    if (!this.errorHandler) return;

    const lines = output.split('\n');
    
    for (const line of lines) {
      // TypeScript errors
      if (line.includes('TS') && line.includes('error')) {
        const match = line.match(/(.+\.tsx?)\((\d+),(\d+)\): error TS(\d+): (.+)/);
        if (match) {
          const [, file, lineNum, col, code, message] = match;
          this.errorHandler.addError({
            type: 'compilation',
            code: `TS${code}`,
            message: `TypeScript error: ${message}`,
            file: file,
            line: parseInt(lineNum),
            column: parseInt(col),
            remediation: this.getTypeScriptErrorRemediation(code, message)
          });
        }
      }

      // Module not found errors
      if (line.includes('Module not found') || line.includes('Cannot resolve module')) {
        const moduleMatch = line.match(/Module not found: (.+)/);
        if (moduleMatch) {
          const moduleName = moduleMatch[1].replace(/['"]/g, '');
          this.errorHandler.handleDependencyError(moduleName);
        }
      }

      // Environment variable errors
      if (line.includes('Environment variable') && line.includes('not found')) {
        const envMatch = line.match(/Environment variable (.+) not found/);
        if (envMatch) {
          this.errorHandler.handleEnvironmentError(envMatch[1]);
        }
      }

      // Turbo errors
      if (line.includes('turbo') && line.includes('error')) {
        this.errorHandler.handleTurboConfigError(line);
      }

      // Build timeout
      if (line.includes('timeout') || line.includes('TIMEOUT')) {
        this.errorHandler.handleTimeoutError('build', 300000); // 5 minutes default
      }
    }
  }

  /**
   * Get TypeScript error remediation
   */
  getTypeScriptErrorRemediation(code, message) {
    const remediations = {
      '2307': [ // Cannot find module
        'Install the missing module: npm install <module-name>',
        'Check the import path is correct',
        'Verify the module has TypeScript definitions',
        'Add type definitions: npm install @types/<module-name>'
      ],
      '2322': [ // Type not assignable
        'Check the types match the expected interface',
        'Update type definitions if needed',
        'Use type assertion if types are correct: value as Type',
        'Review the function/variable signature'
      ],
      '2339': [ // Property does not exist
        'Check the property name is spelled correctly',
        'Verify the object has the expected shape',
        'Update interface definitions if needed',
        'Use optional chaining: object?.property'
      ]
    };

    return remediations[code] || [
      'Check TypeScript documentation for error code TS' + code,
      'Review the code around the error location',
      'Ensure all types are properly defined',
      'Consider updating TypeScript configuration'
    ];
  }

  /**
   * Run post-build validation
   */
  async runPostBuildValidation() {
    console.log('✅ Running post-build validation...');

    // Check that expected build outputs exist
    const expectedOutputs = [
      'apps/remix/build',
      'packages/prisma/dist'
    ];

    const missingOutputs = expectedOutputs.filter(output => !fs.existsSync(output));
    
    if (missingOutputs.length > 0) {
      if (this.errorHandler) {
        this.errorHandler.addError({
          type: 'configuration',
          code: 'MISSING_BUILD_OUTPUTS',
          message: `Missing expected build outputs: ${missingOutputs.join(', ')}`,
          remediation: [
            'Check turbo.json output configurations',
            'Verify build scripts are generating outputs correctly',
            'Ensure all packages have proper build scripts',
            'Check for build errors in individual packages'
          ],
          context: { missingOutputs }
        });
      }
      throw new Error(`Missing build outputs: ${missingOutputs.join(', ')}`);
    }

    console.log('✅ All expected build outputs present');
  }

  /**
   * Print build summary
   */
  printBuildSummary(success) {
    const duration = Date.now() - this.startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    console.log('\n' + '='.repeat(60));
    console.log('BUILD SUMMARY');
    console.log('='.repeat(60));
    console.log(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Duration: ${minutes}m ${seconds}s`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    if (this.errorHandler) {
      const errorsByType = this.errorHandler.getErrorsByType();
      console.log(`Errors: ${Object.values(errorsByType).reduce((a, b) => a + b, 0)}`);
      console.log(`Critical Errors: ${this.errorHandler.hasCriticalErrors() ? 'YES' : 'NO'}`);
    }
    
    console.log('='.repeat(60));

    if (!success) {
      console.log('\n🔧 TROUBLESHOOTING TIPS:');
      console.log('1. Check the error details above');
      console.log('2. Run: npm run validate:all to check configuration');
      console.log('3. Try: npm run clean && npm install to reset dependencies');
      console.log('4. Check logs directory for detailed error reports');
      console.log('5. Review recent changes that might have caused issues');
    }
  }
}

// Run build if called directly
if (require.main === module) {
  const runner = new EnhancedBuildRunner();
  runner.runBuild().then(result => {
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Build runner crashed:', error);
    process.exit(1);
  });
}

module.exports = EnhancedBuildRunner;