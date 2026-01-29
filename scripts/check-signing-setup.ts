import { env } from "@signtusk/lib/utils/env";
import * as fs from "node:fs";

/**
 * Check if the PDF signing setup is configured correctly
 *
 * Run with: npx tsx scripts/check-signing-setup.ts
 */

function checkSigningSetup() {
  console.log("=== PDF Signing Setup Check ===\n");

  let hasIssues = false;

  // Check transport
  const transport = env("NEXT_PRIVATE_SIGNING_TRANSPORT") || "local";
  console.log(`✓ Signing Transport: ${transport}`);

  if (transport === "local") {
    console.log("\n--- Local Certificate Check ---");

    // Check for certificate contents
    const certContents = env("NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS");
    if (certContents) {
      console.log("✓ Certificate contents provided via environment variable");
      try {
        const decoded = Buffer.from(certContents, "base64");
        console.log(`  Size: ${decoded.length} bytes`);
      } catch (error) {
        console.log("✗ Failed to decode certificate contents");
        hasIssues = true;
      }
    } else {
      console.log(
        "  Certificate contents not provided (checking file path instead)"
      );

      // Check for certificate file
      let certPath = env("NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH");

      if (!certPath) {
        if (env("NODE_ENV") === "production") {
          certPath = "/opt/signtusk/cert.p12";
        } else {
          certPath = "./example/cert.p12";
        }
        console.log(`  Using default path: ${certPath}`);
      } else {
        console.log(`  Using configured path: ${certPath}`);
      }

      // Check if file exists
      try {
        const stats = fs.statSync(certPath);
        console.log(`✓ Certificate file found`);
        console.log(`  Size: ${stats.size} bytes`);
        console.log(`  Modified: ${stats.mtime}`);

        // Check if readable
        try {
          fs.accessSync(certPath, fs.constants.R_OK);
          console.log(`✓ Certificate file is readable`);
        } catch (error) {
          console.log(`✗ Certificate file is not readable`);
          hasIssues = true;
        }
      } catch (error) {
        console.log(`✗ Certificate file not found: ${certPath}`);
        console.log(
          `  Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
        hasIssues = true;
      }
    }

    // Check passphrase
    const passphrase = env("NEXT_PRIVATE_SIGNING_PASSPHRASE");
    if (passphrase) {
      console.log("✓ Certificate passphrase is set");
    } else {
      console.log("  Certificate passphrase not set (may not be required)");
    }
  } else if (transport === "gcloud-hsm") {
    console.log("\n--- Google Cloud HSM Check ---");
    console.log("  Google Cloud HSM configuration not checked by this script");
    console.log("  Ensure your GCP credentials and HSM setup are correct");
  }

  // Check storage configuration
  console.log("\n--- Storage Configuration ---");
  const uploadTransport = env("NEXT_PUBLIC_UPLOAD_TRANSPORT") || "database";
  console.log(`✓ Upload Transport: ${uploadTransport}`);

  if (uploadTransport === "s3") {
    const s3Bucket = env("AWS_S3_BUCKET");
    const s3Region = env("AWS_REGION");

    if (s3Bucket) {
      console.log(`✓ S3 Bucket: ${s3Bucket}`);
    } else {
      console.log("✗ S3 Bucket not configured");
      hasIssues = true;
    }

    if (s3Region) {
      console.log(`✓ S3 Region: ${s3Region}`);
    } else {
      console.log("✗ S3 Region not configured");
      hasIssues = true;
    }
  }

  // Check job configuration
  console.log("\n--- Job Configuration ---");
  const jobsProvider = env("NEXT_PRIVATE_JOBS_PROVIDER") || "local";
  console.log(`✓ Jobs Provider: ${jobsProvider}`);

  const internalUrl = env("NEXT_PRIVATE_INTERNAL_WEBAPP_URL");
  if (internalUrl) {
    console.log(`✓ Internal Webapp URL: ${internalUrl}`);
  } else {
    console.log(
      "⚠ Internal Webapp URL not set (may cause issues in production)"
    );
  }

  // Check if running in serverless
  const isServerless =
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    console.log("\n--- Serverless Environment Detected ---");
    console.log("  Jobs will run inline instead of via HTTP requests");
    console.log(
      "  Make sure function timeout is sufficient for PDF processing"
    );
  }

  // Summary
  console.log("\n=== Summary ===");
  if (hasIssues) {
    console.log("✗ Issues found! Please fix the problems above.");
    console.log("\nCommon fixes:");
    console.log(
      "1. Set NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH in your .env file"
    );
    console.log("2. Ensure the certificate file exists and is readable");
    console.log("3. For S3 storage, configure AWS credentials");
    process.exit(1);
  } else {
    console.log("✓ All checks passed! PDF signing should work correctly.");
    console.log("\nIf you still have issues:");
    console.log("1. Run: npx tsx scripts/debug-signing-issue.ts");
    console.log("2. Check server logs for [SEAL-DOCUMENT] entries");
    console.log("3. See SIGNING_FIX_INSTRUCTIONS.md for more help");
  }
}

checkSigningSetup();
