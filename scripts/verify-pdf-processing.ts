#!/usr/bin/env tsx
/**
 * Verify that pdf-processing module is available at runtime
 */

console.log("🔍 Verifying pdf-processing module...\n");

try {
  // Try to import the module
  const pdfProcessing = require("@signtusk/pdf-processing");

  console.log("✅ Module imported successfully!");
  console.log("📦 Available exports:", Object.keys(pdfProcessing));

  // Check if key functions exist
  const requiredExports = ["generateCertificate", "generateAuditLog"];
  const missing = requiredExports.filter((exp) => !pdfProcessing[exp]);

  if (missing.length > 0) {
    console.log("❌ Missing exports:", missing);
    process.exit(1);
  }

  console.log("✅ All required exports present");
  console.log("\n✅ PDF processing module is working correctly!");
} catch (error) {
  console.error("❌ Failed to import pdf-processing module:");
  console.error(error);

  console.log("\n🔍 Checking file system...");
  const fs = require("fs");
  const path = require("path");

  const distPath = path.join(process.cwd(), "packages/pdf-processing/dist");

  if (fs.existsSync(distPath)) {
    console.log("✅ dist/ folder exists");
    console.log("📁 Contents:", fs.readdirSync(distPath));
  } else {
    console.log("❌ dist/ folder NOT found at:", distPath);
  }

  process.exit(1);
}
