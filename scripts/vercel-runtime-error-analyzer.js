#!/usr/bin/env node

/**
 * Vercel Runtime Error Analyzer
 *
 * This script helps analyze and debug Vercel runtime errors by:
 * 1. Checking environment variable configuration
 * 2. Validating server-side code compatibility
 * 3. Testing API routes and functions
 * 4. Providing diagnostic information for common runtime issues
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

class VercelRuntimeAnalyzer {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.fixes = [];
    this.projectRoot = process.cwd();
    this.remixAppPath = path.join(this.projectRoot, "apps/remix");
  }

  log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix =
      {
        info: "📋",
        success: "✅",
        warning: "⚠️",
        error: "❌",
        fix: "🔧",
      }[type] || "📋";

    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  addError(message, details = null) {
    this.errors.push({ message, details, timestamp: new Date().toISOString() });
    this.log(message, "error");
  }

  addWarning(message, details = null) {
    this.warnings.push({
      message,
      details,
      timestamp: new Date().toISOString(),
    });
    this.log(message, "warning");
  }

  addFix(message, action = null) {
    this.fixes.push({ message, action, timestamp: new Date().toISOString() });
    this.log(message, "fix");
  }

  /**
   * Analyze Vercel configuration for runtime issues
   */
  analyzeVercelConfig() {
    this.log("Analyzing Vercel configuration for runtime issues...");

    const vercelConfigPath = path.join(this.remixAppPath, "vercel.json");

    if (!fs.existsSync(vercelConfigPath)) {
      this.addError("vercel.json not found in apps/remix directory");
      return;
    }

    try {
      const config = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8"));

      // Check runtime configuration
      if (config.functions) {
        const serverFunction = config.functions["build/server/main.js"];
        if (serverFunction) {
          this.log(
            `Server function runtime: ${serverFunction.runtime}`,
            "success"
          );

          // Check for Node.js version compatibility
          if (
            serverFunction.runtime &&
            !serverFunction.runtime.startsWith("nodejs")
          ) {
            this.addError(
              "Server function runtime is not Node.js based",
              serverFunction.runtime
            );
          }
        } else {
          this.addError("Server function configuration missing in vercel.json");
        }
      }

      // Check environment variables configuration
      if (config.env) {
        this.log(
          `Build environment variables configured: ${Object.keys(config.env).length}`,
          "success"
        );
      } else {
        this.addWarning("No environment variables configured in vercel.json");
      }

      // Check routes configuration
      if (config.routes && config.routes.length > 0) {
        this.log(`Routes configured: ${config.routes.length}`, "success");

        // Check for catch-all route
        const catchAllRoute = config.routes.find(
          (route) => route.src === "/(.*)"
        );
        if (!catchAllRoute) {
          this.addWarning(
            "No catch-all route found - may cause 404 errors for dynamic routes"
          );
        }
      } else {
        this.addError("No routes configured in vercel.json");
      }
    } catch (error) {
      this.addError("Failed to parse vercel.json", error.message);
    }
  }

  /**
   * Check environment variables for runtime issues
   */
  analyzeEnvironmentVariables() {
    this.log("Analyzing environment variables for runtime issues...");

    const requiredRuntimeVars = [
      "DATABASE_URL",
      "NEXTAUTH_SECRET",
      "NEXTAUTH_URL",
      "NODE_ENV",
    ];

    const optionalRuntimeVars = [
      "NEXT_PUBLIC_WEBAPP_URL",
      "NEXT_PUBLIC_APP_URL",
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASSWORD",
    ];

    // Check for environment variable files
    const envFiles = [
      ".env",
      ".env.local",
      ".env.production",
      "apps/remix/.env",
      "apps/remix/.env.local",
      "apps/remix/.env.production",
    ];

    let envVarsFound = new Set();

    envFiles.forEach((envFile) => {
      const envPath = path.join(this.projectRoot, envFile);
      if (fs.existsSync(envPath)) {
        try {
          const envContent = fs.readFileSync(envPath, "utf8");
          const vars = envContent.match(/^[A-Z_][A-Z0-9_]*=/gm) || [];
          vars.forEach((varLine) => {
            const varName = varLine.split("=")[0];
            envVarsFound.add(varName);
          });
          this.log(
            `Found environment file: ${envFile} with ${vars.length} variables`
          );
        } catch (error) {
          this.addWarning(
            `Failed to read environment file: ${envFile}`,
            error.message
          );
        }
      }
    });

    // Check required variables
    requiredRuntimeVars.forEach((varName) => {
      if (!envVarsFound.has(varName) && !process.env[varName]) {
        this.addError(
          `Required runtime environment variable missing: ${varName}`
        );
        this.addFix(`Add ${varName} to Vercel dashboard environment variables`);
      } else {
        this.log(`Required variable found: ${varName}`, "success");
      }
    });

    // Check optional variables
    optionalRuntimeVars.forEach((varName) => {
      if (!envVarsFound.has(varName) && !process.env[varName]) {
        this.addWarning(
          `Optional runtime environment variable missing: ${varName}`
        );
      }
    });
  }

  /**
   * Analyze server-side code for Vercel compatibility issues
   */
  analyzeServerSideCode() {
    this.log("Analyzing server-side code for Vercel compatibility...");

    const serverPaths = ["apps/remix/app", "apps/remix/server", "packages"];

    const incompatiblePatterns = [
      {
        pattern: /require\(['"]fs['"]\)/g,
        issue: "Direct fs module usage may not work in serverless environment",
        fix: "Use fs operations carefully, prefer async operations",
      },
      {
        pattern: /process\.cwd\(\)/g,
        issue:
          "process.cwd() may not work as expected in serverless environment",
        fix: "Use __dirname or import.meta.url for file paths",
      },
      {
        pattern: /\.writeFileSync\(/g,
        issue: "Synchronous file writes may fail in serverless environment",
        fix: "Use async file operations or temporary directories",
      },
      {
        pattern: /child_process/g,
        issue: "Child processes may not work in serverless environment",
        fix: "Avoid spawning child processes, use libraries instead",
      },
    ];

    serverPaths.forEach((serverPath) => {
      const fullPath = path.join(this.projectRoot, serverPath);
      if (fs.existsSync(fullPath)) {
        this.scanDirectoryForIssues(fullPath, incompatiblePatterns);
      }
    });
  }

  scanDirectoryForIssues(dirPath, patterns) {
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });

      files.forEach((file) => {
        const filePath = path.join(dirPath, file.name);

        if (
          file.isDirectory() &&
          !file.name.startsWith(".") &&
          file.name !== "node_modules"
        ) {
          this.scanDirectoryForIssues(filePath, patterns);
        } else if (
          file.isFile() &&
          (file.name.endsWith(".ts") || file.name.endsWith(".js"))
        ) {
          try {
            const content = fs.readFileSync(filePath, "utf8");

            patterns.forEach(({ pattern, issue, fix }) => {
              const matches = content.match(pattern);
              if (matches) {
                this.addWarning(
                  `${issue} in ${filePath}`,
                  `Found ${matches.length} occurrences`
                );
                this.addFix(fix);
              }
            });
          } catch (error) {
            // Skip files that can't be read
          }
        }
      });
    } catch (error) {
      this.addWarning(`Failed to scan directory: ${dirPath}`, error.message);
    }
  }

  /**
   * Test API routes and server functions
   */
  async testServerFunctions() {
    this.log("Testing server functions for runtime compatibility...");

    // Check if server build exists
    const serverBuildPath = path.join(this.remixAppPath, "build/server");
    if (!fs.existsSync(serverBuildPath)) {
      this.addError("Server build not found - run build first");
      this.addFix("Run: cd apps/remix && npm run build:vercel");
      return;
    }

    // Check main server file
    const mainServerPath = path.join(serverBuildPath, "main.js");
    if (!fs.existsSync(mainServerPath)) {
      this.addError("Main server file not found at build/server/main.js");
      this.addFix(
        "Verify Remix build configuration generates correct server output"
      );
      return;
    }

    this.log("Server build files found", "success");

    // Test server file syntax
    try {
      // Basic syntax check by attempting to require the file
      const serverModule = require(mainServerPath);
      this.log("Server module loads successfully", "success");
    } catch (error) {
      this.addError("Server module failed to load", error.message);
      this.addFix(
        "Check server code for syntax errors or missing dependencies"
      );
    }
  }

  /**
   * Check database connectivity issues
   */
  async testDatabaseConnectivity() {
    this.log("Testing database connectivity for runtime issues...");

    try {
      // Check if Prisma client is available
      const prismaPath = path.join(this.projectRoot, "packages/prisma");
      if (fs.existsSync(prismaPath)) {
        // Check if Prisma client is generated
        const prismaClientPath = path.join(
          prismaPath,
          "node_modules/.prisma/client"
        );
        if (!fs.existsSync(prismaClientPath)) {
          this.addWarning("Prisma client not generated");
          this.addFix("Run: cd packages/prisma && npx prisma generate");
        } else {
          this.log("Prisma client found", "success");
        }
      }

      // Check DATABASE_URL format
      const databaseUrl = process.env.DATABASE_URL;
      if (databaseUrl) {
        if (
          databaseUrl.startsWith("postgresql://") ||
          databaseUrl.startsWith("postgres://")
        ) {
          this.log("PostgreSQL database URL format valid", "success");
        } else if (databaseUrl.startsWith("mysql://")) {
          this.log("MySQL database URL format valid", "success");
        } else {
          this.addWarning(
            "Database URL format may not be supported",
            databaseUrl.substring(0, 20) + "..."
          );
        }
      }
    } catch (error) {
      this.addWarning("Database connectivity test failed", error.message);
    }
  }

  /**
   * Generate runtime error report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        totalFixes: this.fixes.length,
        runtimeReady: this.errors.length === 0,
      },
      errors: this.errors,
      warnings: this.warnings,
      fixes: this.fixes,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
      },
    };

    // Save report to file
    const reportPath = path.join(
      this.projectRoot,
      "logs",
      `vercel-runtime-analysis-${Date.now()}.json`
    );

    // Ensure logs directory exists
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`Runtime analysis report saved to: ${reportPath}`);

    return report;
  }

  /**
   * Run complete runtime analysis
   */
  async analyze() {
    this.log("Starting Vercel runtime error analysis...");

    try {
      this.analyzeVercelConfig();
      this.analyzeEnvironmentVariables();
      this.analyzeServerSideCode();
      await this.testServerFunctions();
      await this.testDatabaseConnectivity();

      const report = this.generateReport();

      // Print summary
      console.log("\n" + "=".repeat(60));
      console.log("VERCEL RUNTIME ANALYSIS SUMMARY");
      console.log("=".repeat(60));
      console.log(`Errors: ${report.summary.totalErrors}`);
      console.log(`Warnings: ${report.summary.totalWarnings}`);
      console.log(`Suggested Fixes: ${report.summary.totalFixes}`);
      console.log(
        `Runtime Ready: ${report.summary.runtimeReady ? "✅ YES" : "❌ NO"}`
      );
      console.log("=".repeat(60));

      if (report.summary.totalErrors > 0) {
        console.log("\n🔧 CRITICAL ISSUES TO FIX:");
        this.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.message}`);
          if (error.details) {
            console.log(`   Details: ${error.details}`);
          }
        });
      }

      if (report.summary.totalFixes > 0) {
        console.log("\n💡 SUGGESTED FIXES:");
        this.fixes.forEach((fix, index) => {
          console.log(`${index + 1}. ${fix.message}`);
        });
      }

      return report;
    } catch (error) {
      this.addError("Runtime analysis failed", error.message);
      console.error("Analysis failed:", error);
      return null;
    }
  }
}

// Run analysis if called directly
if (require.main === module) {
  const analyzer = new VercelRuntimeAnalyzer();
  analyzer
    .analyze()
    .then((report) => {
      process.exit(report && report.summary.runtimeReady ? 0 : 1);
    })
    .catch((error) => {
      console.error("Analysis failed:", error);
      process.exit(1);
    });
}

module.exports = VercelRuntimeAnalyzer;
