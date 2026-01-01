#!/usr/bin/env node

/**
 * Vercel-compatible Prisma generation script
 * Handles cleanup issues that occur in Vercel's build environment
 */

import { spawn } from "child_process";
import { existsSync, mkdirSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class VercelPrismaGenerator {
  constructor() {
    this.packagePath = join(__dirname, "..");
    this.generatedPath = join(this.packagePath, "generated");
    this.zodPath = join(this.generatedPath, "zod");
  }

  /**
   * Force cleanup of generated directories
   */
  forceCleanup() {
    console.log("🧹 Cleaning up generated directories...");

    try {
      if (existsSync(this.zodPath)) {
        console.log(`Removing ${this.zodPath}...`);
        rmSync(this.zodPath, { recursive: true, force: true });
        console.log("✓ Zod directory cleaned");
      }

      if (existsSync(this.generatedPath)) {
        console.log(`Removing ${this.generatedPath}...`);
        rmSync(this.generatedPath, { recursive: true, force: true });
        console.log("✓ Generated directory cleaned");
      }

      // Recreate the directories
      mkdirSync(this.generatedPath, { recursive: true });
      console.log("✓ Generated directory recreated");
    } catch (error) {
      console.warn(`Warning: Cleanup failed: ${error.message}`);
      console.log("Continuing with generation...");
    }
  }

  /**
   * Execute Prisma generate with proper error handling
   */
  async generatePrisma() {
    return new Promise((resolve, reject) => {
      console.log("🔨 Running Prisma generate...");

      const child = spawn("npx", ["prisma", "generate"], {
        stdio: "inherit",
        shell: true,
        cwd: this.packagePath,
        env: {
          ...process.env,
          // Disable Prisma telemetry in CI
          CHECKPOINT_DISABLE: "1",
        },
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log("✅ Prisma generate completed successfully");
          resolve();
        } else {
          reject(new Error(`Prisma generate failed with exit code ${code}`));
        }
      });

      child.on("error", (error) => {
        reject(new Error(`Prisma generate failed: ${error.message}`));
      });
    });
  }

  /**
   * Run the complete generation process
   */
  async run() {
    try {
      console.log("🚀 Starting Vercel-compatible Prisma generation...\n");

      // Step 1: Force cleanup
      this.forceCleanup();

      // Step 2: Generate Prisma client and types
      await this.generatePrisma();

      console.log("\n🎉 Prisma generation completed successfully!");
    } catch (error) {
      console.error("\n💥 Prisma generation failed:", error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new VercelPrismaGenerator();
  generator.run();
}

export default VercelPrismaGenerator;
