#!/usr/bin/env node

/**
 * Vercel Environment Setup Script
 *
 * This script helps set up the required environment variables for Vercel deployment
 * by generating secrets and providing configuration guidance.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

class VercelEnvironmentSetup {
  constructor() {
    this.requiredVars = {
      // Authentication & Security (Critical)
      NEXTAUTH_SECRET: {
        type: "secret",
        length: 32,
        description: "NextAuth.js session encryption secret",
      },
      JWT_SECRET: {
        type: "secret",
        length: 32,
        description: "JWT token signing secret",
      },
      ENCRYPTION_KEY: {
        type: "hex",
        length: 32,
        description: "Application encryption key",
      },

      // Application URLs (Critical)
      NEXTAUTH_URL: {
        type: "url",
        description: "Canonical URL of your Vercel deployment",
      },
      NEXT_PUBLIC_WEBAPP_URL: { type: "url", description: "Public webapp URL" },

      // Database (Critical)
      DATABASE_URL: {
        type: "connection",
        description: "PostgreSQL connection string",
      },

      // Environment
      NODE_ENV: {
        type: "literal",
        value: "production",
        description: "Node environment",
      },
    };

    this.optionalVars = {
      // Redis
      REDIS_URL: {
        type: "connection",
        description: "Redis connection string (optional)",
      },

      // Email Service
      RESEND_API_KEY: {
        type: "api_key",
        description: "Resend email service API key",
      },
      EMAIL_FROM: { type: "email", description: "From email address" },

      // OAuth Providers
      GOOGLE_CLIENT_ID: {
        type: "oauth",
        description: "Google OAuth client ID",
      },
      GOOGLE_CLIENT_SECRET: {
        type: "oauth",
        description: "Google OAuth client secret",
      },
      MICROSOFT_CLIENT_ID: {
        type: "oauth",
        description: "Microsoft OAuth client ID",
      },
      MICROSOFT_CLIENT_SECRET: {
        type: "oauth",
        description: "Microsoft OAuth client secret",
      },

      // File Storage
      AWS_ACCESS_KEY_ID: { type: "aws", description: "AWS access key ID" },
      AWS_SECRET_ACCESS_KEY: {
        type: "aws",
        description: "AWS secret access key",
      },
      AWS_REGION: { type: "aws", description: "AWS region" },
      AWS_S3_BUCKET: { type: "aws", description: "AWS S3 bucket name" },
    };
  }

  generateSecret(length = 32) {
    return crypto.randomBytes(length).toString("base64");
  }

  generateHexKey(length = 32) {
    return crypto.randomBytes(length).toString("hex");
  }

  generateSecrets() {
    console.log("🔐 Generating Required Secrets for Vercel\n");

    const secrets = {};

    // Generate authentication secrets
    secrets.NEXTAUTH_SECRET = this.generateSecret(32);
    secrets.JWT_SECRET = this.generateSecret(32);
    secrets.ENCRYPTION_KEY = this.generateHexKey(32);

    console.log("Generated Secrets (copy these to Vercel dashboard):");
    console.log("=".repeat(60));

    Object.entries(secrets).forEach(([key, value]) => {
      console.log(`${key}=${value}`);
    });

    console.log("=".repeat(60));
    console.log("");

    return secrets;
  }

  generateVercelConfig() {
    const secrets = this.generateSecrets();

    console.log("📋 Complete Vercel Environment Variable Configuration\n");

    console.log("REQUIRED VARIABLES (must be set):");
    console.log("-".repeat(40));

    // Required variables with generated values or placeholders
    Object.entries(this.requiredVars).forEach(([key, config]) => {
      let value;

      if (secrets[key]) {
        value = secrets[key];
      } else if (config.value) {
        value = config.value;
      } else if (config.type === "url") {
        value = "https://your-app-name.vercel.app";
      } else if (config.type === "connection") {
        value = "<your-database-connection-string>";
      } else {
        value = "<your-value>";
      }

      console.log(`${key}=${value}`);
      console.log(`  # ${config.description}`);
      console.log("");
    });

    console.log("\nOPTIONAL VARIABLES (set if needed):");
    console.log("-".repeat(40));

    Object.entries(this.optionalVars).forEach(([key, config]) => {
      console.log(`# ${key}=<your-value>`);
      console.log(`#   ${config.description}`);
    });

    console.log("\n📝 Next Steps:");
    console.log("1. Copy the required variables to your Vercel dashboard");
    console.log("2. Replace placeholder values with your actual values");
    console.log("3. Set optional variables as needed for your features");
    console.log("4. Redeploy your Vercel application");
  }

  validateCurrentEnvironment() {
    console.log("🔍 Validating Current Environment\n");

    const missing = [];
    const present = [];

    Object.keys(this.requiredVars).forEach((key) => {
      if (process.env[key]) {
        present.push(key);
      } else {
        missing.push(key);
      }
    });

    if (present.length > 0) {
      console.log("✅ Present variables:");
      present.forEach((key) => console.log(`  - ${key}`));
      console.log("");
    }

    if (missing.length > 0) {
      console.log("❌ Missing variables:");
      missing.forEach((key) => {
        const config = this.requiredVars[key];
        console.log(`  - ${key}: ${config.description}`);
      });
      console.log("");
    }

    return { missing, present };
  }

  createVercelConfigFile() {
    const config = {
      functions: {
        "app/server.js": {
          maxDuration: 30,
        },
      },
      build: {
        env: {
          PRISMA_GENERATE_DATAPROXY: "true",
        },
      },
      env: Object.keys(this.requiredVars).reduce((acc, key) => {
        acc[key] = `@${key.toLowerCase()}`;
        return acc;
      }, {}),
    };

    const configPath = path.join(process.cwd(), "vercel.json");

    // Read existing config if it exists
    let existingConfig = {};
    if (fs.existsSync(configPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      } catch (error) {
        console.log("⚠️  Warning: Could not parse existing vercel.json");
      }
    }

    // Merge configurations
    const mergedConfig = {
      ...existingConfig,
      ...config,
      env: {
        ...existingConfig.env,
        ...config.env,
      },
    };

    fs.writeFileSync(configPath, JSON.stringify(mergedConfig, null, 2));
    console.log(`✅ Updated vercel.json configuration`);
  }

  run() {
    const args = process.argv.slice(2);
    const command = args[0] || "help";

    switch (command) {
      case "generate":
        this.generateSecrets();
        break;

      case "config":
        this.generateVercelConfig();
        break;

      case "validate":
        this.validateCurrentEnvironment();
        break;

      case "setup":
        this.generateVercelConfig();
        this.createVercelConfigFile();
        break;

      default:
        console.log("🚀 Vercel Environment Setup\n");
        console.log("Usage:");
        console.log("  node scripts/vercel-environment-setup.js <command>\n");
        console.log("Commands:");
        console.log("  generate  - Generate required secrets only");
        console.log(
          "  config    - Generate complete environment configuration"
        );
        console.log("  validate  - Validate current environment variables");
        console.log("  setup     - Generate config and update vercel.json");
        console.log("");
        console.log("Examples:");
        console.log("  node scripts/vercel-environment-setup.js generate");
        console.log("  node scripts/vercel-environment-setup.js config");
        break;
    }
  }
}

// Run the script
if (require.main === module) {
  const setup = new VercelEnvironmentSetup();
  setup.run();
}

module.exports = VercelEnvironmentSetup;
