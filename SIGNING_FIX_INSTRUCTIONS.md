# How to Fix the Document Signing Issue

## Quick Summary

The issue is that after recipients sign documents, the `seal-document` background job either:

1. Never gets triggered
2. Fails during execution
3. Completes but doesn't save the signed PDF correctly

I've added comprehensive logging and diagnostic tools to help identify and fix the issue.

## Changes Made

### 1. Added Logging

- Added detailed logging throughout the signing flow
- Logs show PDF processing steps, sizes, and any errors
- Look for `[SEAL-DOCUMENT]` and `[COMPLETE-DOCUMENT]` in logs

### 2. Fixed Environment Configuration

- Updated `.env` to include the signing certificate path
- Certificate is located at `./apps/remix/example/cert.p12`

### 3. Added Cleanup

- The seal-document process now properly cleans up temporary document data records

### 4. Created Diagnostic Tools

- `scripts/debug-signing-issue.ts` - Diagnose specific issues
- `scripts/fix-stuck-documents.ts` - Fix documents stuck in PENDING status

## Step-by-Step Fix Process

### Step 1: Check Current State

Run the debug script to see if you have stuck documents:

```bash
npx tsx scripts/debug-signing-issue.ts
```

This will show you:

- Recent PENDING envelopes
- Which ones have all recipients signed (these are stuck)
- Background job status

### Step 2: Check Server Logs

If your application is running, check the logs for errors:

```bash
# If using Docker
docker logs <container-name> | grep -E "\[SEAL-DOCUMENT\]|\[COMPLETE-DOCUMENT\]"

# If running locally, check your console output
```

Look for:

- "Certificate not available" errors
- PDF processing errors
- Storage/database errors

### Step 3: Verify Environment Variables

Make sure these are set in your `.env` file:

```bash
# Signing configuration (REQUIRED)
NEXT_PRIVATE_SIGNING_TRANSPORT="local"
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH="./apps/remix/example/cert.p12"
NEXT_PRIVATE_SIGNING_PASSPHRASE=""

# Storage configuration
NEXT_PUBLIC_UPLOAD_TRANSPORT="database"

# Job configuration
NEXT_PRIVATE_INTERNAL_WEBAPP_URL="http://localhost:3000"
NEXT_PRIVATE_JOBS_PROVIDER="local"
```

### Step 4: Restart the Application

After updating the environment variables:

```bash
# If using Docker
docker-compose restart

# If running locally
# Stop the server (Ctrl+C) and restart it
npm run dev
```

### Step 5: Fix Stuck Documents

If you have documents stuck in PENDING status:

```bash
# First, do a dry run to see what will be fixed
npx tsx scripts/fix-stuck-documents.ts --dry-run

# If it looks good, run it for real
npx tsx scripts/fix-stuck-documents.ts
```

This will manually trigger the seal-document job for each stuck document.

### Step 6: Test with a New Document

1. Create a new test document
2. Add yourself as a recipient
3. Send and sign the document
4. Watch the logs for the signing process
5. Verify the document status changes to COMPLETED
6. Verify you can view and download the signed PDF

## Common Issues & Solutions

### Issue 1: "Certificate not available" Error

**Cause:** Signing certificate is not configured or not found

**Solution:**

```bash
# Make sure this is set in .env
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH="./apps/remix/example/cert.p12"

# Verify the file exists
ls -la ./apps/remix/example/cert.p12
```

### Issue 2: Job Never Triggers

**Cause:** The check for "all recipients signed" is failing

**Solution:**

1. Run the debug script to check recipient status
2. Look for recipients with `signingStatus` not set to `SIGNED`
3. Check if CC recipients are being handled correctly

### Issue 3: Job Fails Silently

**Cause:** Job is failing but errors aren't visible

**Solution:**

1. Check the `BackgroundJob` table in your database:

```sql
SELECT * FROM "BackgroundJob"
WHERE name = 'internal.seal-document'
AND status = 'FAILED'
ORDER BY "createdAt" DESC;
```

2. Check server logs for error details
3. Look for PDF processing errors or storage errors

### Issue 4: PDF is 1KB (Empty)

**Cause:** Signed PDF is not being saved to the database

**Solution:**

1. Check if the seal-document job completed successfully
2. Verify storage backend is working (database or S3)
3. Check for transaction failures in logs
4. Run the fix-stuck-documents script to retry

### Issue 5: Serverless Timeout

**Cause:** In serverless environments (Vercel, AWS Lambda), the job may timeout

**Solution:**

1. Check function timeout settings
2. Consider using an external job queue (Trigger.dev, Inngest)
3. For large PDFs, increase timeout or use async processing

## Monitoring

### Check Background Jobs

```sql
-- Recent seal-document jobs
SELECT
  id,
  status,
  "createdAt",
  "completedAt",
  retried,
  payload
FROM "BackgroundJob"
WHERE name = 'internal.seal-document'
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Check Document Status

```sql
-- Documents that should be completed but aren't
SELECT
  e.id,
  e.title,
  e.status,
  e."completedAt",
  COUNT(r.id) as total_recipients,
  COUNT(CASE WHEN r."signingStatus" = 'SIGNED' THEN 1 END) as signed_recipients
FROM "Envelope" e
JOIN "Recipient" r ON r."envelopeId" = e.id
WHERE e.status = 'PENDING'
GROUP BY e.id
HAVING COUNT(r.id) = COUNT(CASE WHEN r."signingStatus" = 'SIGNED' OR r.role = 'CC' THEN 1 END);
```

### Watch Logs in Real-Time

```bash
# If using Docker
docker logs -f <container-name> | grep -E "\[SEAL-DOCUMENT\]|\[COMPLETE-DOCUMENT\]"

# If running locally, just watch your console
```

## Expected Log Flow

When a document is signed successfully, you should see:

```
[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
[COMPLETE-DOCUMENT] Document ID: 123 Envelope ID: env_abc123
[COMPLETE-DOCUMENT] Seal-document job triggered successfully
[SEAL-DOCUMENT] Starting PDF decoration and signing for envelope item: item_xyz
[SEAL-DOCUMENT] PDF data retrieved, size: 50000 bytes
[SEAL-DOCUMENT] PDF loaded successfully, pages: 2
[SEAL-DOCUMENT] PDF saved, size: 52000 bytes
[SEAL-DOCUMENT] PDF signed, size: 53000 bytes
[SEAL-DOCUMENT] Storing signed PDF with name: document_signed.pdf
[SEAL-DOCUMENT] Signed PDF stored, new document data ID: dd_123
[SEAL-DOCUMENT] Document data updated successfully
[SEAL-DOCUMENT] Temporary document data deleted
```

If you don't see this flow, there's an issue at one of these steps.

## Need More Help?

1. **Run the debug script** with a specific envelope ID:

   ```bash
   npx tsx scripts/debug-signing-issue.ts <envelope-id>
   ```

2. **Check the analysis document** for detailed technical information:
   - See `SIGNING_ISSUE_ANALYSIS.md`

3. **Enable more verbose logging** by setting:

   ```bash
   LOG_LEVEL=debug
   ```

4. **Check database directly** using the SQL queries above

## Testing Checklist

After applying the fix:

- [ ] Environment variables are set correctly
- [ ] Certificate file exists and is readable
- [ ] Application has been restarted
- [ ] Stuck documents have been fixed (if any)
- [ ] New test document can be created
- [ ] Test document can be signed
- [ ] Document status changes to COMPLETED
- [ ] Signed PDF can be viewed
- [ ] Signed PDF can be downloaded (not 1KB)
- [ ] Downloaded PDF shows signatures

## Files Modified

- `packages/lib/jobs/definitions/internal/seal-document.handler.ts` - Added logging and cleanup
- `packages/lib/server-only/document/complete-document-with-token.ts` - Added logging
- `.env` - Added signing certificate configuration
- `scripts/debug-signing-issue.ts` - New diagnostic tool
- `scripts/fix-stuck-documents.ts` - New fix tool
- `SIGNING_ISSUE_ANALYSIS.md` - Detailed technical analysis
- `SIGNING_FIX_INSTRUCTIONS.md` - This file
