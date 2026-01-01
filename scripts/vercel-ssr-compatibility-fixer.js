#!/usr/bin/env node

/**
 * Vercel SSR Compatibility Fixer
 *
 * This script identifies and fixes server-side rendering issues that may cause
 * problems in Vercel's serverless environment, including:
 * 1. File system access patterns
 * 2. Process.cwd() usage
 * 3. Child process spawning
 * 4. Synchronous operations that may timeout
 */

const fs = require("fs");
const path = require("path");

class VercelSSRCompatibilityFixer {
  constructor() {
    this.fixes = [];
    this.issues = [];
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

  /**
   * Fix file system access patterns for Vercel compatibility
   */
  fixFileSystemAccess() {
    this.log("Fixing file system access patterns for Vercel compatibility...");

    const problematicPatterns = [
      {
        pattern: /process\.cwd\(\)/g,
        replacement: "__dirname",
        description:
          "Replace process.cwd() with __dirname for better serverless compatibility",
      },
      {
        pattern: /fs\.writeFileSync\(/g,
        replacement: "fs.promises.writeFile(",
        description: "Replace synchronous file writes with async operations",
      },
      {
        pattern: /fs\.readFileSync\(/g,
        replacement: "fs.promises.readFile(",
        description: "Replace synchronous file reads with async operations",
      },
    ];

    // Focus on server-side files that are likely to cause issues
    const serverFiles = [
      "apps/remix/server",
      "apps/remix/app",
      "packages/lib/server-only",
    ];

    serverFiles.forEach((serverPath) => {
      const fullPath = path.join(this.projectRoot, serverPath);
      if (fs.existsSync(fullPath)) {
        this.processDirectoryForFixes(fullPath, problematicPatterns);
      }
    });
  }

  processDirectoryForFixes(dirPath, patterns) {
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });

      files.forEach((file) => {
        const filePath = path.join(dirPath, file.name);

        if (
          file.isDirectory() &&
          !file.name.startsWith(".") &&
          file.name !== "node_modules"
        ) {
          this.processDirectoryForFixes(filePath, patterns);
        } else if (
          file.isFile() &&
          (file.name.endsWith(".ts") || file.name.endsWith(".js"))
        ) {
          this.processFileForFixes(filePath, patterns);
        }
      });
    } catch (error) {
      this.log(`Failed to process directory: ${dirPath}`, "warning");
    }
  }

  processFileForFixes(filePath, patterns) {
    try {
      let content = fs.readFileSync(filePath, "utf8");
      let modified = false;

      patterns.forEach(({ pattern, replacement, description }) => {
        if (pattern.test(content)) {
          // Only suggest fixes for now, don't automatically apply them
          this.issues.push({
            file: filePath,
            pattern: pattern.source,
            description,
            suggestion: `Replace ${pattern.source} with ${replacement}`,
          });
        }
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }

  /**
   * Create Vercel-compatible utility functions
   */
  createVercelCompatibilityUtils() {
    this.log("Creating Vercel compatibility utilities...");

    const utilsContent = `/**
 * Vercel Serverless Compatibility Utilities
 * 
 * These utilities help ensure code works correctly in Vercel's serverless environment
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promises as fs } from 'fs';

/**
 * Get the current directory in a way that works in both Node.js and serverless environments
 */
export function getCurrentDir(importMetaUrl?: string): string {
  if (importMetaUrl) {
    // ESM environment
    return dirname(fileURLToPath(importMetaUrl));
  }
  
  // CommonJS fallback
  return process.cwd();
}

/**
 * Safely read a file with proper error handling for serverless environments
 */
export async function safeReadFile(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    console.warn(\`Failed to read file: \${filePath}\`, error);
    return null;
  }
}

/**
 * Safely write a file with proper error handling for serverless environments
 */
export async function safeWriteFile(filePath: string, content: string): Promise<boolean> {
  try {
    // Ensure directory exists
    const dir = dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.warn(\`Failed to write file: \${filePath}\`, error);
    return false;
  }
}

/**
 * Check if a file exists in a serverless-compatible way
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get environment-specific paths that work in Vercel
 */
export function getVercelPaths() {
  const isVercel = process.env.VERCEL === '1';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    isVercel,
    isProduction,
    tempDir: isVercel ? '/tmp' : './tmp',
    uploadsDir: isVercel ? '/tmp/uploads' : './uploads',
    cacheDir: isVercel ? '/tmp/cache' : './cache'
  };
}

/**
 * Execute a function with timeout for serverless environments
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 25000 // Vercel has 30s timeout, leave some buffer
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(\`Operation timed out after \${timeoutMs}ms\`)), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * Memory-efficient file processing for large files in serverless environments
 */
export async function processFileInChunks(
  filePath: string,
  processor: (chunk: string) => Promise<void>,
  chunkSize: number = 1024 * 1024 // 1MB chunks
): Promise<void> {
  const fileHandle = await fs.open(filePath, 'r');
  
  try {
    let position = 0;
    const buffer = Buffer.alloc(chunkSize);
    
    while (true) {
      const { bytesRead } = await fileHandle.read(buffer, 0, chunkSize, position);
      
      if (bytesRead === 0) break;
      
      const chunk = buffer.subarray(0, bytesRead).toString('utf8');
      await processor(chunk);
      
      position += bytesRead;
    }
  } finally {
    await fileHandle.close();
  }
}`;

    const utilsPath = path.join(
      this.remixAppPath,
      "app/utils/vercel-compatibility.ts"
    );

    // Ensure directory exists
    const utilsDir = path.dirname(utilsPath);
    if (!fs.existsSync(utilsDir)) {
      fs.mkdirSync(utilsDir, { recursive: true });
    }

    fs.writeFileSync(utilsPath, utilsContent);
    this.fixes.push({
      type: "utility_creation",
      file: utilsPath,
      description: "Created Vercel compatibility utilities",
    });

    this.log(
      `Created Vercel compatibility utilities at: ${utilsPath}`,
      "success"
    );
  }

  /**
   * Fix specific server-side rendering issues
   */
  fixServerSideIssues() {
    this.log("Fixing specific server-side rendering issues...");

    // Fix PDF processing for serverless environment
    this.fixPDFProcessing();

    // Fix file upload handling
    this.fixFileUploadHandling();

    // Fix environment loading
    this.fixEnvironmentLoading();
  }

  fixPDFProcessing() {
    const pdfHelperPath = path.join(
      this.remixAppPath,
      "server/api/files/files.helpers.ts"
    );

    if (fs.existsSync(pdfHelperPath)) {
      let content = fs.readFileSync(pdfHelperPath, "utf8");

      // Check if it needs Vercel-specific fixes
      if (
        content.includes("process.cwd()") ||
        content.includes("fs.writeFileSync")
      ) {
        this.issues.push({
          file: pdfHelperPath,
          description: "PDF processing may need Vercel compatibility fixes",
          suggestion:
            "Use async file operations and /tmp directory for temporary files",
        });
      }
    }
  }

  fixFileUploadHandling() {
    // Check for file upload routes that might have serverless issues
    const routesPath = path.join(this.remixAppPath, "app/routes");

    if (fs.existsSync(routesPath)) {
      this.scanForFileUploadIssues(routesPath);
    }
  }

  scanForFileUploadIssues(dirPath) {
    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });

      files.forEach((file) => {
        const filePath = path.join(dirPath, file.name);

        if (file.isDirectory()) {
          this.scanForFileUploadIssues(filePath);
        } else if (
          file.isFile() &&
          (file.name.endsWith(".ts") || file.name.endsWith(".tsx"))
        ) {
          const content = fs.readFileSync(filePath, "utf8");

          // Check for file upload patterns that might cause issues
          if (content.includes("formData") && content.includes("file")) {
            if (
              content.includes("fs.writeFileSync") ||
              content.includes("process.cwd()")
            ) {
              this.issues.push({
                file: filePath,
                description:
                  "File upload route may have serverless compatibility issues",
                suggestion:
                  "Use async file operations and proper temporary directory handling",
              });
            }
          }
        }
      });
    } catch (error) {
      // Skip directories that can't be read
    }
  }

  fixEnvironmentLoading() {
    // Check environment loading patterns
    const envLoaderPath = path.join(
      this.projectRoot,
      "packages/lib/src/env-loader.ts"
    );

    if (fs.existsSync(envLoaderPath)) {
      const content = fs.readFileSync(envLoaderPath, "utf8");

      if (content.includes("process.cwd()")) {
        this.issues.push({
          file: envLoaderPath,
          description:
            "Environment loader uses process.cwd() which may not work in serverless",
          suggestion: "Use import.meta.url or __dirname for path resolution",
        });
      }
    }
  }

  /**
   * Generate Vercel-specific server configuration
   */
  createVercelServerConfig() {
    this.log("Creating Vercel-specific server configuration...");

    const serverConfigContent = `/**
 * Vercel Server Configuration
 * 
 * This configuration ensures the server works correctly in Vercel's serverless environment
 */

import type { ServerBuild } from '@react-router/node';

// Vercel-specific environment detection
export const isVercelEnvironment = process.env.VERCEL === '1';
export const isProduction = process.env.NODE_ENV === 'production';

// Vercel-compatible paths
export const vercelPaths = {
  tempDir: isVercelEnvironment ? '/tmp' : './tmp',
  uploadsDir: isVercelEnvironment ? '/tmp/uploads' : './uploads',
  cacheDir: isVercelEnvironment ? '/tmp/cache' : './cache',
  staticDir: isVercelEnvironment ? '/var/task/build/client' : './build/client'
};

// Vercel-specific server options
export const vercelServerOptions = {
  // Disable clustering in serverless environment
  cluster: !isVercelEnvironment,
  
  // Adjust timeouts for serverless
  timeout: isVercelEnvironment ? 25000 : 30000,
  
  // Memory limits
  maxMemory: isVercelEnvironment ? '1024mb' : '2048mb',
  
  // File upload limits
  maxFileSize: isVercelEnvironment ? '50mb' : '100mb'
};

/**
 * Initialize server with Vercel-specific configuration
 */
export function initializeVercelServer(build: ServerBuild) {
  // Ensure temp directories exist
  if (isVercelEnvironment) {
    const fs = require('fs');
    Object.values(vercelPaths).forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  return {
    build,
    paths: vercelPaths,
    options: vercelServerOptions
  };
}`;

    const configPath = path.join(this.remixAppPath, "server/vercel-config.ts");

    // Ensure directory exists
    const configDir = path.dirname(configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFileSync(configPath, serverConfigContent);
    this.fixes.push({
      type: "server_config",
      file: configPath,
      description: "Created Vercel-specific server configuration",
    });

    this.log(
      `Created Vercel server configuration at: ${configPath}`,
      "success"
    );
  }

  /**
   * Generate compatibility report
   */
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        totalFixes: this.fixes.length,
        vercelReady: this.issues.length === 0,
      },
      issues: this.issues,
      fixes: this.fixes,
      recommendations: [
        "Use async file operations instead of synchronous ones",
        "Use /tmp directory for temporary files in Vercel",
        "Avoid process.cwd(), use __dirname or import.meta.url",
        "Implement proper timeout handling for serverless functions",
        "Use the created compatibility utilities for file operations",
      ],
    };

    // Save report
    const reportPath = path.join(
      this.projectRoot,
      "logs",
      `vercel-ssr-compatibility-${Date.now()}.json`
    );

    // Ensure logs directory exists
    const logsDir = path.dirname(reportPath);
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    this.log(`SSR compatibility report saved to: ${reportPath}`);

    return report;
  }

  /**
   * Run complete SSR compatibility analysis and fixes
   */
  async run() {
    this.log("Starting Vercel SSR compatibility analysis and fixes...");

    try {
      this.fixFileSystemAccess();
      this.createVercelCompatibilityUtils();
      this.fixServerSideIssues();
      this.createVercelServerConfig();

      const report = this.generateReport();

      // Print summary
      console.log("\n" + "=".repeat(60));
      console.log("VERCEL SSR COMPATIBILITY SUMMARY");
      console.log("=".repeat(60));
      console.log(`Issues Found: ${report.summary.totalIssues}`);
      console.log(`Fixes Applied: ${report.summary.totalFixes}`);
      console.log(
        `Vercel Ready: ${report.summary.vercelReady ? "✅ YES" : "⚠️ NEEDS ATTENTION"}`
      );
      console.log("=".repeat(60));

      if (report.summary.totalIssues > 0) {
        console.log("\n⚠️ ISSUES THAT NEED ATTENTION:");
        this.issues.forEach((issue, index) => {
          console.log(`${index + 1}. ${issue.description}`);
          console.log(`   File: ${issue.file}`);
          console.log(`   Suggestion: ${issue.suggestion}`);
          console.log("");
        });
      }

      if (report.summary.totalFixes > 0) {
        console.log("\n✅ FIXES APPLIED:");
        this.fixes.forEach((fix, index) => {
          console.log(`${index + 1}. ${fix.description}`);
          console.log(`   File: ${fix.file}`);
        });
      }

      console.log("\n💡 RECOMMENDATIONS:");
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });

      return report;
    } catch (error) {
      this.log(`SSR compatibility analysis failed: ${error.message}`, "error");
      return null;
    }
  }
}

// Run analysis if called directly
if (require.main === module) {
  const fixer = new VercelSSRCompatibilityFixer();
  fixer
    .run()
    .then((report) => {
      process.exit(report && report.summary.vercelReady ? 0 : 1);
    })
    .catch((error) => {
      console.error("SSR compatibility analysis failed:", error);
      process.exit(1);
    });
}

module.exports = VercelSSRCompatibilityFixer;
