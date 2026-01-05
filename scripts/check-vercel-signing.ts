#!/usr/bin/env node
import { execSync } from "node:child_process";
import * as fs from "node:fs";

/**
 * Check Vercel Signing Configuration
 *
 * This script verifies that all required environment variables
 * for document signing are properly configured in Vercel.
 */

console.log("=== Vercel Signing Configuration Check ===\n");

let hasIssues = false;

// Check if Vercel CLI is available
try {
  const version = execSync("vercel --version", { encoding: "utf-8" }).trim();
  console.log(`✓ Vercel CLI: ${version}\n`);
} catch (error) {
  console.error("✗ Vercel CLI not found");
  console.error("  Install with: npm install -g vercel\n");
  process.exit(1);
}

// Pull latest environment variables
console.log("Pulling latest environment variables from Vercel...");
try {
  execSync("vercel env pull .env.vercel.local --yes", { stdio: "pipe" });
  console.log("✓ Environment variables pulled\n");
} catch (error) {
  console.error("✗ Failed to pull environment variables");
  console.error("  Make sure you are logged in: vercel login\n");
  process.exit(1);
}

// Check if .env.vercel.local exists
if (!fs.existsSync(".env.vercel.local")) {
  console.error("✗ .env.vercel.local not found");
  console.error("  Run: vercel env pull .env.vercel.local\n");
  process.exit(1);
}

// Read and parse environment variables
const envContent = fs.readFileSync(".env.vercel.local", "utf-8");
const envVars: Record<string, string> = {};

envContent.split("\n").forEach((line) => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const [, key, value] = match;
    envVars[key] = value.replace(/^["']|["']$/g, "");
  }
});

console.log("=== Required Variables Check ===\n");

// Check NEXT_PRIVATE_SIGNING_TRANSPORT
const transport = envVars["NEXT_PRIVATE_SIGNING_TRANSPORT"];
if (transport) {
  if (transport === "local" || transport === "gcloud-hsm") {
    console.log(`✓ NEXT_PRIVATE_SIGNING_TRANSPORT: ${transport}`);
  } else {
    console.log(`⚠️  NEXT_PRIVATE_SIGNING_TRANSPORT: ${transport}`);
    console.log('   Expected: "local" or "gcloud-hsm"');
    hasIssues = true;
  }
} else {
  console.log("✗ NEXT_PRIVATE_SIGNING_TRANSPORT: Not set");
  hasIssues = true;
}

// Check certificate configuration based on transport
if (transport === "local") {
  console.log("\n--- Local Certificate Configuration ---");

  const certContents = envVars["NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS"];
  if (certContents) {
    console.log(
      `✓ NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS: Set (${certContents.length} chars)`
    );

    // Try to decode to verify it's valid base64
    try {
      Buffer.from(certContents, "base64");
      console.log("  ✓ Valid base64 encoding");
    } catch (error) {
      console.log("  ✗ Invalid base64 encoding");
      hasIssues = true;
    }
  } else {
    console.log("✗ NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS: Not set");
    console.log("  This is REQUIRED for signing in Vercel!");
    hasIssues = true;
  }

  const passphrase = envVars["NEXT_PRIVATE_SIGNING_PASSPHRASE"];
  if (passphrase !== undefined) {
    if (passphrase === "") {
      console.log("✓ NEXT_PRIVATE_SIGNING_PASSPHRASE: Set (empty)");
    } else {
      console.log("✓ NEXT_PRIVATE_SIGNING_PASSPHRASE: Set (not empty)");
    }
  } else {
    console.log("⚠️  NEXT_PRIVATE_SIGNING_PASSPHRASE: Not set");
    console.log("   May be required depending on your certificate");
  }

  // Check that file path is NOT set (shouldn't be used in Vercel)
  const filePath = envVars["NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH"];
  if (filePath) {
    console.log(`⚠️  NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH: ${filePath}`);
    console.log(
      "   This will be ignored in Vercel (use FILE_CONTENTS instead)"
    );
  }
} else if (transport === "gcloud-hsm") {
  console.log("\n--- Google Cloud HSM Configuration ---");

  const keyPath = envVars["NEXT_PRIVATE_SIGNING_GCLOUD_HSM_KEY_PATH"];
  if (keyPath) {
    console.log(`✓ NEXT_PRIVATE_SIGNING_GCLOUD_HSM_KEY_PATH: ${keyPath}`);
  } else {
    console.log("✗ NEXT_PRIVATE_SIGNING_GCLOUD_HSM_KEY_PATH: Not set");
    hasIssues = true;
  }

  const credentials =
    envVars["NEXT_PRIVATE_SIGNING_GCLOUD_APPLICATION_CREDENTIALS_CONTENTS"];
  if (credentials) {
    console.log(
      `✓ NEXT_PRIVATE_SIGNING_GCLOUD_APPLICATION_CREDENTIALS_CONTENTS: Set (${credentials.length} chars)`
    );
  } else {
    console.log(
      "✗ NEXT_PRIVATE_SIGNING_GCLOUD_APPLICATION_CREDENTIALS_CONTENTS: Not set"
    );
    hasIssues = true;
  }

  const publicCert =
    envVars["NEXT_PRIVATE_SIGNING_GCLOUD_HSM_PUBLIC_CRT_FILE_CONTENTS"];
  if (publicCert) {
    console.log(
      `✓ NEXT_PRIVATE_SIGNING_GCLOUD_HSM_PUBLIC_CRT_FILE_CONTENTS: Set`
    );
  } else {
    console.log(
      "⚠️  NEXT_PRIVATE_SIGNING_GCLOUD_HSM_PUBLIC_CRT_FILE_CONTENTS: Not set"
    );
    console.log("   May be required for certificate embedding");
  }
}

// Check other related variables
console.log("\n--- Other Configuration ---");

const uploadTransport = envVars["NEXT_PUBLIC_UPLOAD_TRANSPORT"];
if (uploadTransport) {
  console.log(`✓ NEXT_PUBLIC_UPLOAD_TRANSPORT: ${uploadTransport}`);
} else {
  console.log(
    "⚠️  NEXT_PUBLIC_UPLOAD_TRANSPORT: Not set (will default to database)"
  );
}

const internalUrl = envVars["NEXT_PRIVATE_INTERNAL_WEBAPP_URL"];
if (internalUrl) {
  console.log(`✓ NEXT_PRIVATE_INTERNAL_WEBAPP_URL: ${internalUrl}`);
} else {
  console.log("⚠️  NEXT_PRIVATE_INTERNAL_WEBAPP_URL: Not set");
}

const jobsProvider = envVars["NEXT_PRIVATE_JOBS_PROVIDER"];
if (jobsProvider) {
  console.log(`✓ NEXT_PRIVATE_JOBS_PROVIDER: ${jobsProvider}`);
} else {
  console.log("  NEXT_PRIVATE_JOBS_PROVIDER: Not set (will default to local)");
}

// Check Vercel-specific settings
console.log("\n--- Vercel Environment ---");
console.log("  Running in serverless mode");
console.log("  Jobs will execute inline (not via HTTP)");
console.log("  Certificate must be provided via environment variable");

// Summary
console.log("\n=== Summary ===\n");

if (hasIssues) {
  console.log("✗ Configuration issues found!\n");
  console.log("To fix:");
  console.log("1. Run: npx tsx scripts/setup-vercel-signing.ts");
  console.log("2. Follow the instructions to add missing variables");
  console.log("3. Redeploy: vercel --prod");
  console.log("4. Run this check again\n");

  console.log("Quick fix commands:");
  if (!envVars["NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS"]) {
    console.log(
      "  vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production"
    );
  }
  if (transport && transport !== "local" && transport !== "gcloud-hsm") {
    console.log("  vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT production");
    console.log("  vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production");
  }

  process.exit(1);
} else {
  console.log("✓ All required variables are configured!\n");
  console.log("Document signing should work in Vercel.\n");
  console.log("Next steps:");
  console.log("1. Deploy: vercel --prod");
  console.log("2. Test signing a document");
  console.log("3. Check logs: vercel logs --follow");
  console.log("4. Look for [SEAL-DOCUMENT] entries\n");
}
