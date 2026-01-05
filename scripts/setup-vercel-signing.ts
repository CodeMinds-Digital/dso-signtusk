#!/usr/bin/env node
import { execSync } from "node:child_process";
import * as fs from "node:fs";

/**
 * Automated Vercel Signing Setup Script
 *
 * This script helps you set up document signing for Vercel deployment
 * by converting the certificate to base64 and guiding you through
 * adding it to Vercel environment variables.
 */

const CERT_PATH = "./apps/remix/example/cert.p12";
const BASE64_OUTPUT = "./cert.base64.txt";

console.log("=== Vercel Document Signing Setup ===\n");

// Step 1: Check if certificate exists
console.log("Step 1: Checking certificate file...");
if (!fs.existsSync(CERT_PATH)) {
  console.error(`✗ Certificate not found at: ${CERT_PATH}`);
  console.error("\nPlease ensure you have a valid .p12 certificate file.");
  process.exit(1);
}

const stats = fs.statSync(CERT_PATH);
console.log(`✓ Certificate found (${stats.size} bytes)\n`);

// Step 2: Convert to base64
console.log("Step 2: Converting certificate to base64...");
try {
  const certBuffer = fs.readFileSync(CERT_PATH);
  const base64Cert = certBuffer.toString("base64");

  fs.writeFileSync(BASE64_OUTPUT, base64Cert);
  console.log(`✓ Base64 certificate saved to: ${BASE64_OUTPUT}`);
  console.log(`  Size: ${base64Cert.length} characters\n`);
} catch (error) {
  console.error("✗ Failed to convert certificate:", error);
  process.exit(1);
}

// Step 3: Check Vercel CLI
console.log("Step 3: Checking Vercel CLI...");
try {
  const version = execSync("vercel --version", { encoding: "utf-8" }).trim();
  console.log(`✓ Vercel CLI installed: ${version}\n`);
} catch (error) {
  console.error("✗ Vercel CLI not found");
  console.error("\nInstall it with: npm install -g vercel");
  process.exit(1);
}

// Step 4: Check current Vercel env vars
console.log("Step 4: Checking current Vercel environment variables...");
try {
  const envList = execSync("vercel env ls", { encoding: "utf-8" });

  const hasTransport = envList.includes("NEXT_PRIVATE_SIGNING_TRANSPORT");
  const hasCertContents = envList.includes(
    "NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS"
  );
  const hasPassphrase = envList.includes("NEXT_PRIVATE_SIGNING_PASSPHRASE");

  console.log(
    `  NEXT_PRIVATE_SIGNING_TRANSPORT: ${hasTransport ? "✓ Set" : "✗ Missing"}`
  );
  console.log(
    `  NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS: ${hasCertContents ? "✓ Set" : "✗ Missing"}`
  );
  console.log(
    `  NEXT_PRIVATE_SIGNING_PASSPHRASE: ${hasPassphrase ? "✓ Set" : "✗ Missing"}`
  );
  console.log("");

  if (hasCertContents) {
    console.log("⚠️  Certificate contents already set in Vercel.");
    console.log("   If you want to update it, remove it first:");
    console.log(
      "   vercel env rm NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production\n"
    );
  }
} catch (error) {
  console.error("✗ Failed to check Vercel environment variables");
  console.error("  Make sure you are logged in: vercel login");
  process.exit(1);
}

// Step 5: Instructions
console.log("=== Next Steps ===\n");
console.log("The certificate has been converted to base64.");
console.log(`File location: ${BASE64_OUTPUT}\n`);

console.log("Now add it to Vercel using ONE of these methods:\n");

console.log("METHOD 1: Using Vercel CLI (Recommended)\n");
console.log("Run these commands:\n");

console.log("# 1. Add certificate contents");
console.log(
  "vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production"
);
console.log(`# When prompted, paste the contents from: ${BASE64_OUTPUT}\n`);

console.log("vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS preview");
console.log(
  "vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS development\n"
);

console.log(
  "# 2. Add passphrase (press Enter for empty if using example cert)"
);
console.log("vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production");
console.log("vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE preview");
console.log("vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE development\n");

console.log("# 3. Set/fix transport value");
console.log("vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT production");
console.log("vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production");
console.log("# Enter: local\n");

console.log("vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT preview");
console.log("vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT preview");
console.log("vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT development");
console.log("vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT development\n");

console.log("# 4. Redeploy");
console.log("vercel --prod\n");

console.log("METHOD 2: Using Vercel Dashboard\n");
console.log("1. Go to: https://vercel.com/dashboard");
console.log("2. Select your project");
console.log("3. Go to: Settings → Environment Variables");
console.log("4. Add the variables listed above\n");

console.log("=== Quick Copy Commands ===\n");
console.log("# Copy certificate to clipboard (macOS)");
console.log(`cat ${BASE64_OUTPUT} | pbcopy\n`);

console.log("# Copy certificate to clipboard (Linux)");
console.log(`cat ${BASE64_OUTPUT} | xclip -selection clipboard\n`);

console.log("# View certificate contents");
console.log(`cat ${BASE64_OUTPUT}\n`);

console.log("=== Security Notes ===\n");
console.log("⚠️  IMPORTANT:");
console.log("1. Do NOT commit cert.base64.txt to git");
console.log("2. Delete cert.base64.txt after adding to Vercel");
console.log("3. Use different certificates for production vs development\n");

console.log("After setup, verify with:");
console.log("npx tsx scripts/check-vercel-signing.ts\n");
