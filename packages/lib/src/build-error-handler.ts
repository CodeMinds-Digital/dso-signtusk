/**
 * Enhanced Build Error Handler
 * Provides detailed error logging with stack traces and actionable remediation steps
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

// Forward declaration to avoid circular dependency
interface BuildFallbackManager {
  executeFallbacks(error: Error): Promise<any>;
}

export interface BuildError {
  type: 'dependency' | 'environment' | 'configuration' | 'compilation' | 'runtime' | 'unknown';
  code: string;
  message: string;
  details?: string;
  stack?: string;
  file?: string;
  line?: number;
  column?: number;
  timestamp: Date;
  remediation: string[];
  context?: Record<string, any>;
}

export interface BuildErrorReport {
  buildId: string;
  timestamp: Date;
  environment: string;
  errors: BuildError[];
  warnings: BuildError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    criticalErrors: number;
    buildDuration?: number;
  };
}

export class BuildErrorHandler {
  private errors: BuildError[] = [];
  private warnings: BuildError[] = [];
  private buildId: string;
  private startTime: Date;
  private logDir: string;
  private isVercelEnvironment: boolean;
  private fallbackManager?: BuildFallbackManager;

  constructor(buildId?: string, logDir = 'logs') {
    this.buildId = buildId || `build-${Date.now()}`;
    this.startTime = new Date();
    this.logDir = logDir;
    this.isVercelEnvironment = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
    
    // Ensure log directory exists
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Set fallback manager (to avoid circular dependency)
   */
  setFallbackManager(fallbackManager: BuildFallbackManager): void {
    this.fallbackManager = fallbackManager;
  }

  /**
   * Add an error with detailed context and remediation steps
   */
  addError(error: Partial<BuildError> & { message: string; type: BuildError['type'] }): void {
    const buildError: BuildError = {
      code: error.code || `${error.type.toUpperCase()}_ERROR`,
      timestamp: new Date(),
      remediation: error.remediation || this.getDefaultRemediation(error.type),
      ...error,
    };

    this.errors.push(buildError);
    this.logError(buildError);
  }

  /**
   * Add a warning with context
   */
  addWarning(warning: Partial<BuildError> & { message: string; type: BuildError['type'] }): void {
    const buildWarning: BuildError = {
      code: warning.code || `${warning.type.toUpperCase()}_WARNING`,
      timestamp: new Date(),
      remediation: warning.remediation || this.getDefaultRemediation(warning.type),
      ...warning,
    };

    this.warnings.push(buildWarning);
    this.logWarning(buildWarning);
  }

  /**
   * Handle JavaScript/TypeScript errors with enhanced context and fallback suggestions
   */
  handleJavaScriptError(error: Error, context?: { file?: string; operation?: string }): void {
    const buildError: BuildError = {
      type: 'compilation',
      code: 'JS_COMPILATION_ERROR',
      message: error.message,
      details: `Error occurred during ${context?.operation || 'compilation'}`,
      stack: error.stack,
      file: context?.file,
      timestamp: new Date(),
      remediation: this.getJavaScriptErrorRemediation(error),
      context,
    };

    this.errors.push(buildError);
    this.logError(buildError);

    // Suggest fallback strategies if available
    if (this.fallbackManager) {
      const applicableStrategies = this.fallbackManager.getApplicableStrategies(error);
      if (applicableStrategies.length > 0) {
        console.log(`\n💡 Available fallback strategies:`);
        applicableStrategies.forEach((strategy, index) => {
          console.log(`   ${index + 1}. ${strategy.name}: ${strategy.description}`);
        });
        console.log(`   Run with fallback: npm run build:fallback`);
      }
    }
  }

  /**
   * Handle dependency resolution errors with Vercel-specific guidance
   */
  handleDependencyError(packageName: string, version?: string, details?: string): void {
    const vercelRemediation = this.isVercelEnvironment ? [
      `🔧 VERCEL-SPECIFIC FIXES:`,
      `• Ensure ${packageName} is in "dependencies" (not devDependencies) in package.json`,
      `• Check Vercel build logs: https://vercel.com/dashboard`,
      `• Verify package exists in npm registry: https://www.npmjs.com/package/${packageName}`,
      `• Add to vercel.json if needed: {"functions": {"app/api/**": {"includeFiles": "node_modules/${packageName}/**"}}}`,
      `• Documentation: https://vercel.com/docs/concepts/functions/serverless-functions#dependencies`,
    ] : [];

    this.addError({
      type: 'dependency',
      code: 'DEPENDENCY_RESOLUTION_ERROR',
      message: `Failed to resolve dependency: ${packageName}${version ? `@${version}` : ''}`,
      details: this.isVercelEnvironment ? 
        `${details || ''}\n🚀 Running in Vercel environment - check dependency configuration` : 
        details,
      remediation: [
        `Install the missing dependency: npm install ${packageName}${version ? `@${version}` : ''}`,
        'Check if the package name is correct',
        'Verify the package exists in the npm registry',
        'Check for version conflicts with other dependencies',
        'Clear node_modules and package-lock.json, then reinstall: rm -rf node_modules package-lock.json && npm install',
        ...vercelRemediation,
      ],
      context: { packageName, version, isVercel: this.isVercelEnvironment },
    });
  }

  /**
   * Handle environment variable errors with Vercel-specific guidance
   */
  handleEnvironmentError(variableName: string, expectedFormat?: string): void {
    const vercelRemediation = this.isVercelEnvironment ? [
      `🔧 VERCEL-SPECIFIC FIXES:`,
      `• Add ${variableName} in Vercel Dashboard: https://vercel.com/dashboard → Project Settings → Environment Variables`,
      `• Set correct environment scope: Production, Preview, or Development`,
      `• Redeploy after adding environment variables`,
      `• Check variable is available at build time vs runtime`,
      `• Documentation: https://vercel.com/docs/concepts/projects/environment-variables`,
    ] : [];

    this.addError({
      type: 'environment',
      code: 'ENVIRONMENT_VARIABLE_ERROR',
      message: `Missing or invalid environment variable: ${variableName}`,
      details: this.isVercelEnvironment ? 
        `${expectedFormat ? `Expected format: ${expectedFormat}` : ''}\n🚀 Running in Vercel environment - configure in dashboard` : 
        (expectedFormat ? `Expected format: ${expectedFormat}` : undefined),
      remediation: [
        `Add ${variableName} to your .env.local file`,
        'Copy .env.example to .env.local if it doesn\'t exist',
        'Ensure the variable is properly formatted',
        'Check that the variable is loaded in the correct environment',
        'Run: npm run validate:env to check all environment variables',
        ...vercelRemediation,
      ],
      context: { variableName, expectedFormat, isVercel: this.isVercelEnvironment },
    });
  }

  /**
   * Handle Turbo configuration errors
   */
  handleTurboConfigError(issue: string, configPath?: string): void {
    this.addError({
      type: 'configuration',
      code: 'TURBO_CONFIG_ERROR',
      message: `Turbo configuration issue: ${issue}`,
      details: configPath ? `Configuration file: ${configPath}` : undefined,
      remediation: [
        'Check turbo.json for syntax errors',
        'Verify all package paths exist',
        'Ensure output paths match actual build artifacts',
        'Validate task dependencies are correct',
        'Run: npx turbo build --dry-run to test configuration',
      ],
      context: { issue, configPath },
    });
  }

  /**
   * Handle build timeout errors with Vercel-specific guidance
   */
  handleTimeoutError(operation: string, timeout: number): void {
    const vercelRemediation = this.isVercelEnvironment ? [
      `🔧 VERCEL-SPECIFIC FIXES:`,
      `• Vercel has build time limits: Hobby (45min), Pro (45min), Enterprise (custom)`,
      `• Optimize build performance: reduce bundle size, use build cache`,
      `• Consider splitting large builds into multiple deployments`,
      `• Use Vercel's build cache: https://vercel.com/docs/concepts/builds#build-cache`,
      `• Check build logs in Vercel dashboard for bottlenecks`,
      `• Documentation: https://vercel.com/docs/concepts/limits#builds`,
    ] : [];

    this.addError({
      type: 'runtime',
      code: 'BUILD_TIMEOUT_ERROR',
      message: `Build operation timed out: ${operation}`,
      details: this.isVercelEnvironment ? 
        `Timeout after ${timeout}ms\n🚀 Running in Vercel environment - check build time limits` : 
        `Timeout after ${timeout}ms`,
      remediation: [
        'Increase the timeout value in your build configuration',
        'Check for infinite loops or blocking operations',
        'Optimize build performance by reducing bundle size',
        'Consider splitting large operations into smaller chunks',
        'Check system resources (CPU, memory, disk space)',
        ...vercelRemediation,
      ],
      context: { operation, timeout, isVercel: this.isVercelEnvironment },
    });
  }

  /**
   * Handle Vercel-specific CLI tool errors
   */
  handleVercelCliError(command: string, error: string): void {
    this.addError({
      type: 'dependency',
      code: 'VERCEL_CLI_ERROR',
      message: `CLI command not available in Vercel build environment: ${command}`,
      details: `Error: ${error}\n🚀 Vercel build environment has limited CLI tools available`,
      remediation: [
        `🔧 VERCEL-SPECIFIC FIXES:`,
        `• Replace CLI usage with programmatic alternatives`,
        `• Use installed npm packages instead of global commands`,
        `• Example: Replace 'dotenv -e .env' with require('dotenv').config()`,
        `• Ensure all CLI tools are in package.json dependencies`,
        `• Use npx for package-provided CLI tools: npx ${command}`,
        `• Documentation: https://vercel.com/docs/concepts/builds#build-environment`,
        `• Available tools: https://vercel.com/docs/concepts/builds#build-image`,
      ],
      context: { command, error, isVercel: this.isVercelEnvironment },
    });
  }

  /**
   * Handle Vercel deployment configuration errors
   */
  handleVercelConfigError(issue: string, configFile?: string): void {
    this.addError({
      type: 'configuration',
      code: 'VERCEL_CONFIG_ERROR',
      message: `Vercel configuration issue: ${issue}`,
      details: configFile ? `Configuration file: ${configFile}` : undefined,
      remediation: [
        `🔧 VERCEL-SPECIFIC FIXES:`,
        `• Check vercel.json syntax and configuration`,
        `• Validate build command in package.json`,
        `• Ensure output directory matches Vercel expectations`,
        `• Check framework detection: https://vercel.com/docs/concepts/builds#framework-preset`,
        `• Verify environment variables are configured in dashboard`,
        `• Test locally with: vercel dev`,
        `• Documentation: https://vercel.com/docs/project-configuration`,
      ],
      context: { issue, configFile, isVercel: this.isVercelEnvironment },
    });
  }

  /**
   * Handle Node.js version compatibility errors
   */
  handleNodeVersionError(currentVersion: string, requiredVersion?: string): void {
    const vercelRemediation = this.isVercelEnvironment ? [
      `🔧 VERCEL-SPECIFIC FIXES:`,
      `• Specify Node.js version in package.json: "engines": {"node": "${requiredVersion || '>=18.0.0'}"}`,
      `• Or use .nvmrc file with version number`,
      `• Vercel supports Node.js 14.x, 16.x, 18.x, 20.x`,
      `• Check current Vercel Node.js versions: https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/node-js`,
      `• Redeploy after changing Node.js version`,
    ] : [];

    this.addError({
      type: 'environment',
      code: 'NODE_VERSION_ERROR',
      message: `Node.js version compatibility issue`,
      details: `Current: ${currentVersion}${requiredVersion ? `, Required: ${requiredVersion}` : ''}`,
      remediation: [
        'Check Node.js version requirements in package.json',
        'Update Node.js to the required version',
        'Use nvm to manage Node.js versions: nvm use <version>',
        'Ensure all team members use the same Node.js version',
        ...vercelRemediation,
      ],
      context: { currentVersion, requiredVersion, isVercel: this.isVercelEnvironment },
    });
  }

  /**
   * Get default remediation steps based on error type with Vercel-specific guidance
   */
  private getDefaultRemediation(type: BuildError['type']): string[] {
    const baseRemediations = {
      dependency: [
        'Check package.json for missing or incorrect dependencies',
        'Run npm install to ensure all dependencies are installed',
        'Clear node_modules and reinstall if needed',
      ],
      environment: [
        'Check .env.local file exists and contains required variables',
        'Copy .env.example to .env.local if missing',
        'Validate environment variable formats',
      ],
      configuration: [
        'Check configuration files for syntax errors',
        'Validate all paths and references exist',
        'Review documentation for correct configuration format',
      ],
      compilation: [
        'Check for TypeScript/JavaScript syntax errors',
        'Ensure all imports are correct',
        'Verify type definitions are available',
      ],
      runtime: [
        'Check application logs for runtime errors',
        'Verify all services are running',
        'Check network connectivity and permissions',
      ],
      unknown: [
        'Check build logs for more details',
        'Try running the build with verbose logging',
        'Contact support if the issue persists',
      ],
    };

    const vercelRemediations = this.isVercelEnvironment ? {
      dependency: [
        `🔧 VERCEL-SPECIFIC FIXES:`,
        `• Ensure dependencies are in "dependencies" not "devDependencies"`,
        `• Check Vercel build logs: https://vercel.com/dashboard`,
        `• Documentation: https://vercel.com/docs/concepts/functions/serverless-functions#dependencies`,
      ],
      environment: [
        `🔧 VERCEL-SPECIFIC FIXES:`,
        `• Configure environment variables in Vercel Dashboard`,
        `• Set correct environment scope (Production/Preview/Development)`,
        `• Documentation: https://vercel.com/docs/concepts/projects/environment-variables`,
      ],
      configuration: [
        `🔧 VERCEL-SPECIFIC FIXES:`,
        `• Check vercel.json configuration`,
        `• Validate build command and output directory`,
        `• Documentation: https://vercel.com/docs/project-configuration`,
      ],
      compilation: [
        `🔧 VERCEL-SPECIFIC FIXES:`,
        `• Check Node.js version compatibility`,
        `• Ensure build tools are available in Vercel environment`,
        `• Documentation: https://vercel.com/docs/concepts/builds#build-environment`,
      ],
      runtime: [
        `🔧 VERCEL-SPECIFIC FIXES:`,
        `• Check Vercel function logs`,
        `• Verify serverless function configuration`,
        `• Documentation: https://vercel.com/docs/concepts/functions/serverless-functions`,
      ],
      unknown: [
        `🔧 VERCEL-SPECIFIC FIXES:`,
        `• Check Vercel build logs and function logs`,
        `• Contact Vercel support: https://vercel.com/support`,
        `• Community help: https://github.com/vercel/vercel/discussions`,
      ],
    } : {};

    const base = baseRemediations[type] || baseRemediations.unknown;
    const vercel = vercelRemediations[type] || [];
    
    return [...base, ...vercel];
  }

  /**
   * Get specific remediation for JavaScript errors with Vercel-specific guidance
   */
  private getJavaScriptErrorRemediation(error: Error): string[] {
    const message = error.message.toLowerCase();
    
    let baseRemediation: string[] = [];
    
    if (message.includes('module not found') || message.includes('cannot resolve')) {
      baseRemediation = [
        'Install the missing module: npm install <module-name>',
        'Check the import path is correct',
        'Verify the module exists in node_modules',
        'Check for typos in the module name',
      ];
    } else if (message.includes('unexpected token') || message.includes('syntax error')) {
      baseRemediation = [
        'Check for syntax errors in the source code',
        'Ensure proper bracket/parenthesis matching',
        'Verify TypeScript configuration is correct',
        'Check for unsupported JavaScript features',
      ];
    } else if (message.includes('type') && message.includes('not assignable')) {
      baseRemediation = [
        'Check TypeScript type definitions',
        'Ensure proper type imports',
        'Verify interface/type compatibility',
        'Update type definitions if needed',
      ];
    } else {
      baseRemediation = [
        'Check the error stack trace for the exact location',
        'Review the code around the error location',
        'Ensure all dependencies are properly installed',
        'Check for recent changes that might have caused the issue',
      ];
    }

    const vercelRemediation = this.isVercelEnvironment ? [
      `🔧 VERCEL-SPECIFIC FIXES:`,
      `• Check Vercel build logs for complete error details`,
      `• Ensure Node.js version compatibility (check package.json engines)`,
      `• Verify all dependencies are in "dependencies" not "devDependencies"`,
      `• Test build locally with: vercel build`,
      `• Check Vercel's supported Node.js features and limitations`,
      `• Documentation: https://vercel.com/docs/concepts/builds#build-environment`,
    ] : [];

    return [...baseRemediation, ...vercelRemediation];
  }

  /**
   * Log error to console with formatting
   */
  private logError(error: BuildError): void {
    console.error(`\n❌ ${error.type.toUpperCase()} ERROR [${error.code}]`);
    console.error(`   Message: ${error.message}`);
    
    if (error.details) {
      console.error(`   Details: ${error.details}`);
    }
    
    if (error.file) {
      console.error(`   File: ${error.file}${error.line ? `:${error.line}` : ''}`);
    }
    
    if (error.stack) {
      console.error(`   Stack Trace:`);
      console.error(`   ${error.stack.split('\n').slice(0, 5).join('\n   ')}`);
    }
    
    console.error(`   Remediation Steps:`);
    error.remediation.forEach((step, index) => {
      console.error(`   ${index + 1}. ${step}`);
    });
    
    console.error(`   Timestamp: ${error.timestamp.toISOString()}`);
  }

  /**
   * Log warning to console with formatting
   */
  private logWarning(warning: BuildError): void {
    console.warn(`\n⚠️  ${warning.type.toUpperCase()} WARNING [${warning.code}]`);
    console.warn(`   Message: ${warning.message}`);
    
    if (warning.details) {
      console.warn(`   Details: ${warning.details}`);
    }
    
    if (warning.file) {
      console.warn(`   File: ${warning.file}${warning.line ? `:${warning.line}` : ''}`);
    }
    
    console.warn(`   Recommendations:`);
    warning.remediation.forEach((step, index) => {
      console.warn(`   ${index + 1}. ${step}`);
    });
  }

  /**
   * Generate comprehensive error report
   */
  generateReport(): BuildErrorReport {
    const endTime = new Date();
    const buildDuration = endTime.getTime() - this.startTime.getTime();
    
    const report: BuildErrorReport = {
      buildId: this.buildId,
      timestamp: endTime,
      environment: process.env.NODE_ENV || 'development',
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        criticalErrors: this.errors.filter(e => e.type === 'dependency' || e.type === 'environment').length,
        buildDuration,
      },
    };

    return report;
  }

  /**
   * Save error report to file
   */
  saveReport(): string {
    const report = this.generateReport();
    const filename = `error-report-${this.buildId}.json`;
    const filepath = join(this.logDir, filename);
    
    writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Error report saved to: ${filepath}`);
    return filepath;
  }

  /**
   * Print build summary with Vercel-specific information
   */
  printSummary(): void {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log('BUILD ERROR SUMMARY');
    console.log('='.repeat(60));
    console.log(`Build ID: ${report.buildId}`);
    console.log(`Environment: ${report.environment}${this.isVercelEnvironment ? ' (Vercel)' : ''}`);
    console.log(`Duration: ${report.summary.buildDuration}ms`);
    console.log(`Errors: ${report.summary.totalErrors}`);
    console.log(`Warnings: ${report.summary.totalWarnings}`);
    console.log(`Critical Errors: ${report.summary.criticalErrors}`);
    
    if (this.isVercelEnvironment) {
      console.log('\n🚀 VERCEL ENVIRONMENT DETECTED');
      console.log('• Build logs: https://vercel.com/dashboard');
      console.log('• Environment variables: Project Settings → Environment Variables');
      console.log('• Documentation: https://vercel.com/docs');
    }
    
    if (report.summary.totalErrors > 0) {
      console.log('\n🔥 CRITICAL ISSUES TO FIX:');
      report.errors
        .filter(e => e.type === 'dependency' || e.type === 'environment')
        .forEach((error, index) => {
          console.log(`${index + 1}. ${error.message}`);
        });
    }
    
    if (report.summary.totalErrors === 0 && report.summary.totalWarnings === 0) {
      console.log('\n✅ No errors or warnings detected!');
    } else if (report.summary.totalErrors === 0) {
      console.log('\n✅ Build completed with warnings only');
    } else {
      console.log('\n❌ Build failed with errors');
      console.log(`\nNext steps:`);
      console.log(`1. Review the error details above`);
      console.log(`2. Follow the remediation steps for each error`);
      console.log(`3. Run the build again after fixing issues`);
      console.log(`4. Check the full error report: ${this.logDir}/error-report-${this.buildId}.json`);
      
      if (this.isVercelEnvironment) {
        console.log(`\n🚀 VERCEL-SPECIFIC NEXT STEPS:`);
        console.log(`• Check Vercel dashboard for detailed build logs`);
        console.log(`• Verify environment variables are configured correctly`);
        console.log(`• Test locally with: vercel dev`);
        console.log(`• Redeploy after fixing issues`);
      }
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Check if build has critical errors
   */
  hasCriticalErrors(): boolean {
    return this.errors.some(e => e.type === 'dependency' || e.type === 'environment');
  }

  /**
   * Get error count by type
   */
  getErrorsByType(): Record<BuildError['type'], number> {
    const counts: Record<BuildError['type'], number> = {
      dependency: 0,
      environment: 0,
      configuration: 0,
      compilation: 0,
      runtime: 0,
      unknown: 0,
    };

    this.errors.forEach(error => {
      counts[error.type]++;
    });

    return counts;
  }

  /**
   * Clear all errors and warnings
   */
  clear(): void {
    this.errors = [];
    this.warnings = [];
  }
}

// Export singleton instance for global use
export const buildErrorHandler = new BuildErrorHandler();

// Export utility functions
export function createBuildErrorHandler(buildId?: string): BuildErrorHandler {
  return new BuildErrorHandler(buildId);
}

export function handleUnhandledRejection(reason: any, promise: Promise<any>): void {
  buildErrorHandler.addError({
    type: 'runtime',
    code: 'UNHANDLED_PROMISE_REJECTION',
    message: `Unhandled promise rejection: ${reason}`,
    stack: reason?.stack,
    remediation: [
      'Add proper error handling to the promise chain',
      'Use try-catch blocks for async operations',
      'Check for missing await keywords',
      'Verify all promises are properly handled',
    ],
    context: { reason: String(reason) },
  });
}

export function handleUncaughtException(error: Error): void {
  buildErrorHandler.addError({
    type: 'runtime',
    code: 'UNCAUGHT_EXCEPTION',
    message: `Uncaught exception: ${error.message}`,
    stack: error.stack,
    remediation: [
      'Add proper error handling around the failing code',
      'Check for null/undefined values',
      'Verify all required dependencies are available',
      'Review recent code changes for potential issues',
    ],
    context: { errorName: error.name },
  });
  
  buildErrorHandler.saveReport();
  process.exit(1);
}

// Set up global error handlers
process.on('unhandledRejection', handleUnhandledRejection);
process.on('uncaughtException', handleUncaughtException);