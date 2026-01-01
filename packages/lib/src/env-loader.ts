/**
 * Environment Variable Loading Utility
 * Ensures proper precedence order and validates build-time vs runtime variables
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

// Vercel-compatible directory resolution
function getWorkspaceRoot(): string {
  if (typeof __dirname !== "undefined") {
    // CommonJS environment - find workspace root
    let currentDir = __dirname;
    while (
      currentDir !== "/" &&
      !existsSync(join(currentDir, "package.json"))
    ) {
      currentDir = join(currentDir, "..");
    }
    return currentDir;
  }

  // ESM or serverless environment
  try {
    return process.cwd();
  } catch {
    // Fallback for serverless environments
    return ".";
  }
}

export interface EnvConfig {
  [key: string]: string | undefined;
}

export interface EnvValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  loadedFiles: string[];
}

export class EnvironmentLoader {
  private static instance: EnvironmentLoader;
  private loadedEnv: EnvConfig = {};
  private loadedFiles: string[] = [];

  private constructor() {}

  public static getInstance(): EnvironmentLoader {
    if (!EnvironmentLoader.instance) {
      EnvironmentLoader.instance = new EnvironmentLoader();
    }
    return EnvironmentLoader.instance;
  }

  /**
   * Environment file precedence order (highest to lowest priority):
   * 1. process.env (system environment variables)
   * 2. .env.local (local overrides, should not be committed)
   * 3. .env.development / .env.production (environment-specific)
   * 4. .env (default values, committed to repo)
   */
  private getEnvFilePrecedence(): string[] {
    const nodeEnv = process.env.NODE_ENV || "development";

    return [
      ".env", // Lowest priority - defaults
      `.env.${nodeEnv}`, // Environment-specific
      ".env.local", // Highest priority - local overrides
    ];
  }

  /**
   * Load environment variables from files with proper precedence
   */
  public loadEnvironmentFiles(
    rootPath: string = getWorkspaceRoot()
  ): EnvConfig {
    const envFiles = this.getEnvFilePrecedence();
    const env: EnvConfig = {};
    this.loadedFiles = [];

    // Start with process.env (highest priority)
    Object.assign(env, process.env);

    // Load from files in reverse order (lowest to highest priority)
    for (const envFile of envFiles) {
      const filePath = join(rootPath, envFile);

      if (existsSync(filePath)) {
        try {
          const content = readFileSync(filePath, "utf8");
          const fileEnv = this.parseEnvFile(content);

          // Merge with existing env (file values don't override existing)
          for (const [key, value] of Object.entries(fileEnv)) {
            if (env[key] === undefined) {
              env[key] = value;
            }
          }

          this.loadedFiles.push(envFile);
        } catch (error) {
          console.warn(`Warning: Could not load ${envFile}: ${error}`);
        }
      }
    }

    this.loadedEnv = env;
    return env;
  }

  /**
   * Parse .env file content
   */
  private parseEnvFile(content: string): EnvConfig {
    const env: EnvConfig = {};
    const lines = content.split("\n");

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      // Parse key=value pairs
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex === -1) {
        continue;
      }

      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // Remove surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }

    return env;
  }

  /**
   * Get build-time environment variables (NEXT_PUBLIC_* and NODE_ENV)
   */
  public getBuildTimeVariables(): EnvConfig {
    const buildTimeVars: EnvConfig = {};

    for (const [key, value] of Object.entries(this.loadedEnv)) {
      if (
        key.startsWith("NEXT_PUBLIC_") ||
        key === "NODE_ENV" ||
        key === "PORT"
      ) {
        buildTimeVars[key] = value;
      }
    }

    return buildTimeVars;
  }

  /**
   * Get runtime environment variables (NEXT_PRIVATE_* and others)
   */
  public getRuntimeVariables(): EnvConfig {
    const runtimeVars: EnvConfig = {};

    for (const [key, value] of Object.entries(this.loadedEnv)) {
      if (
        key.startsWith("NEXT_PRIVATE_") ||
        key.startsWith("JWT_") ||
        key.startsWith("ENCRYPTION_") ||
        key.startsWith("SESSION_") ||
        key.startsWith("DATABASE_") ||
        key.startsWith("REDIS_") ||
        key.startsWith("SMTP_") ||
        key === "NEXTAUTH_SECRET"
      ) {
        runtimeVars[key] = value;
      }
    }

    return runtimeVars;
  }

  /**
   * Validate environment variables for build process
   */
  public validateForBuild(): EnvValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required build-time variables
    const requiredBuildVars = [
      "NODE_ENV",
      "NEXT_PUBLIC_WEBAPP_URL",
      "NEXT_PUBLIC_APP_URL",
    ];

    for (const varName of requiredBuildVars) {
      if (!this.loadedEnv[varName]) {
        errors.push(`Missing required build-time variable: ${varName}`);
      }
    }

    // Required runtime variables
    const requiredRuntimeVars = [
      "NEXTAUTH_SECRET",
      "NEXT_PRIVATE_ENCRYPTION_KEY",
      "NEXT_PRIVATE_DATABASE_URL",
    ];

    for (const varName of requiredRuntimeVars) {
      if (!this.loadedEnv[varName]) {
        errors.push(`Missing required runtime variable: ${varName}`);
      }
    }

    // Validate encryption key lengths
    const encryptionKeys = [
      "NEXTAUTH_SECRET",
      "NEXT_PRIVATE_ENCRYPTION_KEY",
      "NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY",
      "JWT_SECRET",
      "ENCRYPTION_KEY",
    ];

    for (const key of encryptionKeys) {
      const value = this.loadedEnv[key];
      if (value && value.length < 32) {
        warnings.push(`${key} should be at least 32 characters for security`);
      }
    }

    // Validate URL formats
    const urlVars = [
      "NEXT_PUBLIC_WEBAPP_URL",
      "NEXT_PUBLIC_APP_URL",
      "NEXT_PUBLIC_API_URL",
    ];

    for (const key of urlVars) {
      const value = this.loadedEnv[key];
      if (value && !value.match(/^https?:\/\/.+/)) {
        warnings.push(`${key} should be a valid HTTP/HTTPS URL`);
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
      loadedFiles: this.loadedFiles,
    };
  }

  /**
   * Get all loaded environment variables
   */
  public getAll(): EnvConfig {
    return { ...this.loadedEnv };
  }

  /**
   * Get a specific environment variable
   */
  public get(key: string): string | undefined {
    return this.loadedEnv[key];
  }

  /**
   * Check if a variable is defined
   */
  public has(key: string): boolean {
    return this.loadedEnv[key] !== undefined;
  }

  /**
   * Initialize environment loading for the application
   */
  public static initializeEnvironment(rootPath?: string): EnvValidationResult {
    const loader = EnvironmentLoader.getInstance();
    loader.loadEnvironmentFiles(rootPath);
    return loader.validateForBuild();
  }
}

// Export singleton instance
export const envLoader = EnvironmentLoader.getInstance();

// Export utility functions
export function loadEnvironment(rootPath?: string): EnvConfig {
  return envLoader.loadEnvironmentFiles(rootPath);
}

export function validateEnvironment(): EnvValidationResult {
  return envLoader.validateForBuild();
}

export function getBuildTimeEnv(): EnvConfig {
  return envLoader.getBuildTimeVariables();
}

export function getRuntimeEnv(): EnvConfig {
  return envLoader.getRuntimeVariables();
}
