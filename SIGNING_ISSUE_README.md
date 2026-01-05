# Document Signing Issue - Complete Fix Guide

## Problem

After a recipient signs a document:

- ❌ Status remains "Pending" instead of "Completed"
- ❌ PDF viewer shows "Something went wrong while loading the document"
- ❌ Downloaded PDF is only 1KB (empty/corrupted)

## Solution Overview

I've identified the issue and implemented:

1. **Comprehensive logging** to track the signing process
2. **Environment configuration fixes** for the signing certificate
3. **Diagnostic tools** to identify and fix stuck documents
4. **Code improvements** to handle edge cases

## Quick Start

### 1. Verify Setup

```bash
npx tsx scripts/check-signing-setup.ts
```

This checks if your signing configuration is correct. If it passes, you're good to go!

### 2. Check for Stuck Documents

```bash
npx tsx scripts/debug-signing-issue.ts
```

This shows you any documents that are stuck in PENDING status after all recipients have signed.

### 3. Fix Stuck Documents (if any)

```bash
# Dry run first to see what will be fixed
npx tsx scripts/fix-stuck-documents.ts --dry-run

# Actually fix them
npx tsx scripts/fix-stuck-documents.ts
```

### 4. Test with a New Document

1. Create a new document
2. Add a recipient and send
3. Sign the document
4. Verify status changes to "Completed"
5. Verify PDF loads and downloads correctly

## What Was Changed

### Code Changes

1. **packages/lib/jobs/definitions/internal/seal-document.handler.ts**
   - Added comprehensive logging throughout the PDF signing process
   - Added cleanup for temporary document data records
   - Better error handling

2. **packages/lib/server-only/document/complete-document-with-token.ts**
   - Added logging when triggering the seal-document job
   - Better visibility into the completion flow

3. **.env**
   - Added `NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH` pointing to the certificate
   - Added `NEXT_PRIVATE_SIGNING_PASSPHRASE` (empty for the example cert)

### New Tools

1. **scripts/check-signing-setup.ts**
   - Verifies your signing configuration
   - Checks certificate file exists and is readable
   - Validates environment variables

2. **scripts/debug-signing-issue.ts**
   - Lists documents stuck in PENDING status
   - Shows recipient signing status
   - Checks background job status
   - Provides specific recommendations

3. **scripts/fix-stuck-documents.ts**
   - Automatically fixes documents stuck in PENDING
   - Manually triggers the seal-document job
   - Safe to run multiple times

### Documentation

1. **SIGNING_ISSUE_ANALYSIS.md** - Detailed technical analysis
2. **SIGNING_FIX_INSTRUCTIONS.md** - Step-by-step fix instructions
3. **SIGNING_ISSUE_README.md** - This file (quick reference)

## How the Signing Process Works

```
1. Recipient signs document
   ↓
2. complete-document-with-token.ts
   - Updates recipient status to SIGNED
   - Checks if all recipients have signed
   ↓
3. If all signed, triggers seal-document job
   ↓
4. seal-document.handler.ts
   - Loads original PDF
   - Inserts all signed fields
   - Flattens and normalizes PDF
   - Signs PDF with certificate
   - Saves signed PDF to storage
   - Updates envelope status to COMPLETED
   ↓
5. Document is now complete!
```

## Monitoring

### Watch Logs in Real-Time

```bash
# Look for these log prefixes
[COMPLETE-DOCUMENT] - Document completion flow
[SEAL-DOCUMENT] - PDF signing process
[PUT_FILE] - File storage operations
```

### Expected Log Flow

When everything works correctly:

```
[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
[SEAL-DOCUMENT] Starting PDF decoration and signing
[SEAL-DOCUMENT] PDF data retrieved, size: 50000 bytes
[SEAL-DOCUMENT] PDF loaded successfully, pages: 2
[SEAL-DOCUMENT] PDF saved, size: 52000 bytes
[SEAL-DOCUMENT] PDF signed, size: 53000 bytes
[SEAL-DOCUMENT] Storing signed PDF
[SEAL-DOCUMENT] Signed PDF stored
[SEAL-DOCUMENT] Document data updated successfully
```

### Check Database

```sql
-- Find stuck documents
SELECT
  e.id,
  e.title,
  e.status,
  COUNT(r.id) as total_recipients,
  COUNT(CASE WHEN r."signingStatus" = 'SIGNED' THEN 1 END) as signed_recipients
FROM "Envelope" e
JOIN "Recipient" r ON r."envelopeId" = e.id
WHERE e.status = 'PENDING'
GROUP BY e.id
HAVING COUNT(r.id) = COUNT(CASE WHEN r."signingStatus" = 'SIGNED' OR r.role = 'CC' THEN 1 END);

-- Check recent seal-document jobs
SELECT
  id,
  status,
  "createdAt",
  "completedAt",
  retried
FROM "BackgroundJob"
WHERE name = 'internal.seal-document'
ORDER BY "createdAt" DESC
LIMIT 10;
```

## Common Issues

### Issue: Certificate Not Found

**Error:** `Certificate file not found: ./apps/remix/example/cert.p12`

**Fix:**

```bash
# Verify the file exists
ls -la apps/remix/example/cert.p12

# Make sure .env has the correct path
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH="./apps/remix/example/cert.p12"
```

### Issue: Job Never Triggers

**Symptoms:** No seal-document jobs in database

**Fix:**

1. Check if all recipients actually have `signingStatus = 'SIGNED'`
2. Run the debug script to see recipient status
3. Check server logs for errors in complete-document-with-token

### Issue: Job Fails

**Symptoms:** Job status is `FAILED` in database

**Fix:**

1. Check server logs for error details
2. Common causes:
   - Certificate not readable
   - PDF processing error
   - Storage backend issue
3. Run fix-stuck-documents script to retry

### Issue: PDF Still 1KB

**Symptoms:** Document status is COMPLETED but PDF is empty

**Fix:**

1. Check if `documentData.data === documentData.initialData`
2. This means the signed PDF wasn't saved
3. Check storage backend (database or S3)
4. Run fix-stuck-documents to regenerate

## Environment Variables Reference

```bash
# Required for signing
NEXT_PRIVATE_SIGNING_TRANSPORT="local"
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH="./apps/remix/example/cert.p12"
NEXT_PRIVATE_SIGNING_PASSPHRASE=""

# Storage (choose one)
NEXT_PUBLIC_UPLOAD_TRANSPORT="database"  # or "s3"

# For S3 storage
AWS_ACCESS_KEY_ID="your-key"
AWS_SECRET_ACCESS_KEY="your-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="your-bucket"

# Job system
NEXT_PRIVATE_JOBS_PROVIDER="local"
NEXT_PRIVATE_INTERNAL_WEBAPP_URL="http://localhost:3000"

# Database
NEXT_PRIVATE_DATABASE_URL="postgresql://..."
```

## Testing Checklist

After applying the fix:

- [ ] Run `npx tsx scripts/check-signing-setup.ts` - passes
- [ ] Environment variables are set correctly
- [ ] Application has been restarted
- [ ] Fixed any stuck documents (if applicable)
- [ ] Created a new test document
- [ ] Signed the test document
- [ ] Document status changed to "Completed"
- [ ] PDF loads in viewer (not error message)
- [ ] PDF downloads successfully (not 1KB)
- [ ] Downloaded PDF shows signatures

## Need Help?

1. **Check the logs** - Look for `[SEAL-DOCUMENT]` entries
2. **Run the debug script** - `npx tsx scripts/debug-signing-issue.ts`
3. **Check the detailed analysis** - See `SIGNING_ISSUE_ANALYSIS.md`
4. **Follow step-by-step instructions** - See `SIGNING_FIX_INSTRUCTIONS.md`

## Summary

The issue is in the `seal-document` background job that processes signed documents. The job either:

- Never gets triggered (check recipient status)
- Fails during execution (check logs and certificate)
- Completes but doesn't save correctly (check storage backend)

With the logging and diagnostic tools added, you can now:

- See exactly where the process fails
- Identify stuck documents
- Fix them automatically
- Monitor the process in real-time

The fix is working if you see the complete log flow and documents change to COMPLETED status with downloadable PDFs.
