# 🔧 Document Completion Issues - Diagnosis & Fix

**Issues:**

1. Build warning: Cannot find module `@signtusk/pdf-processing`
2. Documents stuck in "Processing" state after all recipients sign

---

## Issue 1: PDF Processing Package Not Found

### Problem

Build logs show:

```
Cannot find module '@signtusk/pdf-processing' or its corresponding type declarations.
```

### Root Cause

The `packages/pdf-processing/package.json` is pointing to TypeScript source files instead of compiled JavaScript:

```json
{
  "main": "./index.ts", // ❌ Wrong - points to source
  "types": "./index.ts" // ❌ Wrong - points to source
}
```

### Fix

Update `packages/pdf-processing/package.json`:

```json
{
  "main": "./dist/index.js", // ✅ Correct - points to compiled JS
  "types": "./dist/index.d.ts", // ✅ Correct - points to type definitions
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  }
}
```

---

## Issue 2: Documents Stuck in "Processing" State

### Problem

After all recipients sign a document:

- Document status remains `PENDING`
- UI shows "Processing document..."
- Document never changes to `COMPLETED`

### Root Cause Analysis

The document completion flow works like this:

1. **Recipient signs** → `complete-document-with-token.ts`
2. **Check if all signed** → If yes, trigger `seal-document` job
3. **seal-document job** → Processes PDF, updates status to `COMPLETED`
4. **Send completion emails** → Notify all parties

**Possible failure points:**

#### A. Job Not Triggering

- `seal-document` job fails to trigger
- Job system not configured properly
- Network/timeout issues

#### B. Job Failing Silently

- PDF processing errors
- Certificate/signing errors
- Database transaction failures
- Missing dependencies

#### C. Job Running But Not Completing

- Timeout (job takes too long)
- Memory issues
- PDF too large
- Too many fields to process

### Diagnosis Steps

#### Step 1: Check if Job is Triggering

```bash
# Check application logs for:
[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
[COMPLETE-DOCUMENT] Seal-document job triggered successfully
```

If you see these logs, the job is triggering. If not, there's an issue with the completion check.

#### Step 2: Check if Job is Running

```bash
# Check database for background jobs
SELECT * FROM "BackgroundJob"
WHERE "jobId" = 'internal.seal-document'
ORDER BY "submittedAt" DESC
LIMIT 10;
```

Look for:

- `status = 'PENDING'` → Job queued but not started
- `status = 'PROCESSING'` → Job running
- `status = 'FAILED'` → Job failed (check error)
- `status = 'COMPLETED'` → Job succeeded

#### Step 3: Check Job Logs

```bash
# In application logs, search for:
[SEAL-DOCUMENT]
```

This will show you exactly where the job is failing.

### Common Failure Scenarios

#### Scenario 1: PDF Processing Timeout

**Symptoms:**

- Job starts but never completes
- No error messages
- Status stuck at `PROCESSING`

**Cause:** PDF processing takes too long (>30 seconds)

**Fix:** Increase job timeout or optimize PDF processing

#### Scenario 2: Certificate/Signing Error

**Symptoms:**

- Job fails with signing error
- Logs show: "Failed to sign PDF"

**Cause:**

- Missing certificate
- Invalid certificate
- Certificate passphrase wrong

**Fix:** Check environment variables:

```bash
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<base64-certificate>
NEXT_PRIVATE_SIGNING_PASSPHRASE=<passphrase>
DISABLE_PDF_SIGNING=false
```

#### Scenario 3: Missing Dependencies

**Symptoms:**

- Job fails immediately
- Error: "Cannot find module"

**Cause:** Missing `@signtusk/pdf-processing` or other packages

**Fix:** Apply Issue 1 fix above

#### Scenario 4: Database Transaction Failure

**Symptoms:**

- Job fails at the end
- Logs show: "Transaction failed"

**Cause:** Database connection issues or constraint violations

**Fix:** Check database connection and logs

---

## Complete Fix Implementation

### Fix 1: Update PDF Processing Package

```bash
# Edit packages/pdf-processing/package.json
```

```json
{
  "name": "@signtusk/pdf-processing",
  "version": "0.1.0",
  "private": true,
  "description": "Server-side PDF processing package for certificates and audit logs",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "lint": "eslint .",
    "type-check": "tsc --noEmit",
    "test": "vitest --run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "pdf-lib": "^1.17.1",
    "qrcode": "^1.5.3",
    "zod": "^3.22.4",
    "luxon": "^3.4.4"
  },
  "devDependencies": {
    "@types/qrcode": "^1.5.6",
    "@types/luxon": "^3.7.1",
    "typescript": "^5.6.2",
    "eslint": "^8.56.0",
    "vitest": "^1.6.0",
    "fast-check": "^3.15.0"
  },
  "peerDependencies": {
    "@signtusk/lib": "*"
  },
  "license": "Private - Part of Signtusk Platform"
}
```

### Fix 2: Ensure Package is Built

```bash
# Build the pdf-processing package
cd packages/pdf-processing
npm run build

# Verify dist folder exists
ls -la dist/
# Should see: index.js, index.d.ts, engines/, types/
```

### Fix 3: Add Build Step to Dockerfile

Ensure Dockerfile builds all packages:

```dockerfile
# In installer stage, after copying packages
RUN npx turbo run build --filter=@signtusk/remix^...
```

This builds all dependencies of the remix app, including pdf-processing.

### Fix 4: Enable Job Logging

Add environment variable to see detailed job logs:

```bash
# In Dokploy environment variables
DEBUG=jobs:*
LOG_LEVEL=debug
```

### Fix 5: Add Cron Job for Stuck Documents

The cron job at `apps/remix/server/api/cron/process-pending-documents.ts` should automatically process stuck documents.

Ensure it's configured in your deployment:

```bash
# Vercel: Add to vercel.json
{
  "crons": [{
    "path": "/api/cron/process-pending-documents",
    "schedule": "*/5 * * * *"
  }]
}

# Dokploy: Set up external cron or use a service like cron-job.org
# to call: https://your-domain.com/api/cron/process-pending-documents
# every 5 minutes
```

---

## Testing the Fix

### Test 1: Build Test

```bash
# Clean build
npm run clean
npm ci
npm run build

# Should complete without errors
# Should NOT see: "Cannot find module '@signtusk/pdf-processing'"
```

### Test 2: Document Completion Test

1. Create a new document
2. Add a signer
3. Send the document
4. Sign as the recipient
5. Check logs for:
   ```
   [COMPLETE-DOCUMENT] All recipients have signed
   [COMPLETE-DOCUMENT] Seal-document job triggered
   [SEAL-DOCUMENT] Starting PDF decoration
   [SEAL-DOCUMENT] PDF signed successfully
   [SEAL-DOCUMENT] Document data updated
   ```
6. Verify document status changes to `COMPLETED`
7. Verify completion email is sent

### Test 3: Database Check

```sql
-- Check document status
SELECT
  "secondaryId",
  "status",
  "completedAt",
  "createdAt"
FROM "Envelope"
WHERE "type" = 'DOCUMENT'
ORDER BY "createdAt" DESC
LIMIT 10;

-- Check background jobs
SELECT
  "jobId",
  "status",
  "submittedAt",
  "completedAt",
  "retried"
FROM "BackgroundJob"
WHERE "jobId" = 'internal.seal-document'
ORDER BY "submittedAt" DESC
LIMIT 10;
```

---

## Manual Fix for Stuck Documents

If you have documents stuck in "Processing" state:

### Option 1: Use the Fix Script

```bash
npm run with:env -- tsx scripts/fix-stuck-documents.ts
```

This will:

1. Find all documents where all recipients signed but status is still PENDING
2. Trigger seal-document job for each
3. Show progress

### Option 2: Manual Database Update (NOT RECOMMENDED)

Only use if seal-document job is completely broken:

```sql
-- WARNING: This bypasses the PDF signing process!
-- Only use for testing or emergency fixes

UPDATE "Envelope"
SET
  "status" = 'COMPLETED',
  "completedAt" = NOW()
WHERE
  "id" = '<envelope-id>'
  AND "status" = 'PENDING'
  AND NOT EXISTS (
    SELECT 1 FROM "Recipient"
    WHERE "envelopeId" = "Envelope"."id"
    AND "signingStatus" != 'SIGNED'
    AND "role" != 'CC'
  );
```

### Option 3: Trigger Job Manually

```bash
# Use the manual completion script
npm run with:env -- tsx scripts/manually-complete-document.ts <document-id>
```

---

## Monitoring & Prevention

### Add Health Check

Create a monitoring endpoint to check for stuck documents:

```typescript
// apps/remix/server/api/health/stuck-documents.ts
export const checkStuckDocuments = async () => {
  const stuckDocs = await prisma.envelope.findMany({
    where: {
      status: DocumentStatus.PENDING,
      updatedAt: {
        lt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      },
    },
    include: {
      recipients: true,
    },
  });

  const actuallyStuck = stuckDocs.filter((doc) =>
    doc.recipients.every(
      (r) =>
        r.signingStatus === SigningStatus.SIGNED || r.role === RecipientRole.CC
    )
  );

  return {
    count: actuallyStuck.length,
    documents: actuallyStuck.map((d) => d.secondaryId),
  };
};
```

### Set Up Alerts

Monitor for:

- Documents in PENDING state for >30 minutes with all recipients signed
- Failed seal-document jobs
- High job retry counts

---

## Summary

### Immediate Actions:

1. ✅ Fix `packages/pdf-processing/package.json` to point to dist files
2. ✅ Rebuild the package: `cd packages/pdf-processing && npm run build`
3. ✅ Commit and deploy changes
4. ✅ Test document completion flow
5. ✅ Fix any stuck documents using scripts

### Long-term Solutions:

1. Set up cron job for automatic stuck document processing
2. Add monitoring for stuck documents
3. Improve job error logging
4. Add retry logic for failed jobs
5. Consider job queue system (BullMQ, etc.) for better reliability

---

## Files to Update

1. `packages/pdf-processing/package.json` - Fix main/types paths
2. `Dockerfile.production` - Ensure packages are built
3. Environment variables - Add DEBUG and LOG_LEVEL
4. Cron configuration - Set up stuck document processor

---

**After applying these fixes, documents should complete automatically after all recipients sign!** ✅
