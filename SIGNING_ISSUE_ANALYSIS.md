# Document Signing Issue - Analysis & Fix

## Problem Description

After a recipient signs a document:

1. **Status remains "Pending"** instead of updating to "Completed"
2. **PDF doesn't load** - shows "Something went wrong while loading the document"
3. **Downloaded PDF is only 1KB** (empty/corrupted)

## Root Cause Analysis

### The Signing Flow

When a recipient completes signing:

1. **Field Signing** (`sign-field-with-token.ts`): Individual fields are marked as signed
2. **Document Completion** (`complete-document-with-token.ts`):
   - Recipient's `signingStatus` is updated to `SIGNED`
   - Checks if all recipients have signed
   - If yes, triggers `internal.seal-document` job
3. **Seal Document Job** (`seal-document.handler.ts`):
   - Fetches the original PDF
   - Inserts all signed fields into the PDF
   - Signs the PDF cryptographically
   - Saves the signed PDF
   - Updates envelope status to `COMPLETED`

### Potential Issues

#### Issue 1: Job Not Triggering

The `seal-document` job may not be triggered if:

- The check for "all recipients signed" fails
- Job system is not running properly
- Serverless environment terminates before job completes

#### Issue 2: Job Failing Silently

The job may fail during execution due to:

- PDF signing certificate not available
- PDF processing errors (flatten, normalize, sign)
- Storage backend issues (S3 or database)
- Transaction failures

#### Issue 3: Empty PDF Data

The 1KB PDF suggests:

- The signed PDF is not being saved correctly
- The `documentData.data` field is not being updated
- Storage backend is returning empty data

## Changes Made

### 1. Added Comprehensive Logging

Added logging throughout the signing flow to track:

- When seal-document job is triggered
- PDF processing steps (load, flatten, sign)
- PDF sizes at each step
- Document data updates
- Transaction completion

**Files Modified:**

- `packages/lib/jobs/definitions/internal/seal-document.handler.ts`
- `packages/lib/server-only/document/complete-document-with-token.ts`

### 2. Added Cleanup for Temporary Document Data

The seal-document process creates a temporary `DocumentData` record with the signed PDF, then copies the data to the original record. Added cleanup to delete the temporary record after copying.

**File Modified:**

- `packages/lib/jobs/definitions/internal/seal-document.handler.ts`

### 3. Created Debug Script

Created `scripts/debug-signing-issue.ts` to diagnose issues:

- Lists recent pending envelopes
- Shows recipient signing status
- Checks document data state
- Examines background job status
- Provides recommendations

## How to Debug

### Step 1: Run the Debug Script

```bash
# List recent pending envelopes
npx tsx scripts/debug-signing-issue.ts

# Debug specific envelope
npx tsx scripts/debug-signing-issue.ts <envelopeId>
```

### Step 2: Check Server Logs

Look for log entries with `[SEAL-DOCUMENT]` and `[COMPLETE-DOCUMENT]` prefixes:

```bash
# If using Docker
docker logs <container-name> | grep -E "\[SEAL-DOCUMENT\]|\[COMPLETE-DOCUMENT\]"

# If running locally
# Check your console output or log files
```

### Step 3: Check Background Jobs Table

```sql
SELECT * FROM "BackgroundJob"
WHERE name = 'internal.seal-document'
ORDER BY "createdAt" DESC
LIMIT 10;
```

Look for:

- Jobs stuck in `PENDING` or `PROCESSING` status
- Jobs with `FAILED` status
- Jobs that were never created

### Step 4: Check Document Data

```sql
SELECT
  e.id as envelope_id,
  e.status,
  e."completedAt",
  ei.id as item_id,
  dd.type as data_type,
  LENGTH(dd.data) as data_length,
  LENGTH(dd."initialData") as initial_data_length,
  (dd.data = dd."initialData") as data_unchanged
FROM "Envelope" e
JOIN "EnvelopeItem" ei ON ei."envelopeId" = e.id
JOIN "DocumentData" dd ON dd.id = ei."documentDataId"
WHERE e.status = 'PENDING'
ORDER BY e."updatedAt" DESC
LIMIT 10;
```

If `data_unchanged` is `true` for a completed envelope, the signed PDF was never saved.

## Common Issues & Solutions

### Issue: Job Never Triggered

**Symptoms:**

- No `internal.seal-document` jobs in database
- Log shows "Not all recipients have signed yet"

**Solution:**

- Check recipient signing status in database
- Verify CC recipients are being handled correctly
- Check the `haveAllRecipientsSigned` query logic

### Issue: Job Fails with Certificate Error

**Symptoms:**

- Log shows "Certificate not available for document signing"
- Job status is `FAILED`

**Solution:**

- Verify `NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH` or `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` is set
- Check certificate file exists and is readable
- Verify `NEXT_PRIVATE_SIGNING_PASSPHRASE` is correct

### Issue: Job Stuck in PENDING/PROCESSING

**Symptoms:**

- Job exists but never completes
- No error logs

**Solution:**

- Check if job endpoint is accessible
- Verify `NEXT_PRIVATE_INTERNAL_WEBAPP_URL` is correct
- In serverless environments, jobs run inline - check for timeout issues
- Restart the application

### Issue: PDF Processing Fails

**Symptoms:**

- Log shows PDF loaded but fails during flatten/sign
- Job fails with PDF-related errors

**Solution:**

- Check if PDF is corrupted or encrypted
- Verify pdf-lib can process the PDF
- Check for memory issues with large PDFs

### Issue: Storage Backend Fails

**Symptoms:**

- Log shows "PDF signed" but fails to store
- S3 or database errors

**Solution:**

- Verify `NEXT_PUBLIC_UPLOAD_TRANSPORT` setting (s3 or database)
- Check S3 credentials and permissions
- Check database connection and storage limits

## Testing the Fix

### 1. Create a Test Document

1. Create a new document with one recipient
2. Send for signing
3. Sign the document as the recipient

### 2. Monitor the Logs

Watch for these log entries in sequence:

```
[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
[COMPLETE-DOCUMENT] Document ID: X Envelope ID: Y
[COMPLETE-DOCUMENT] Seal-document job triggered successfully
[SEAL-DOCUMENT] Starting PDF decoration and signing for envelope item: X
[SEAL-DOCUMENT] PDF data retrieved, size: X bytes
[SEAL-DOCUMENT] PDF loaded successfully, pages: X
[SEAL-DOCUMENT] PDF saved, size: X bytes
[SEAL-DOCUMENT] PDF signed, size: X bytes
[SEAL-DOCUMENT] Storing signed PDF with name: X
[SEAL-DOCUMENT] Signed PDF stored, new document data ID: X
[SEAL-DOCUMENT] Document data updated successfully
[SEAL-DOCUMENT] Temporary document data deleted
```

### 3. Verify the Result

1. Check document status is `COMPLETED`
2. Verify PDF loads in viewer
3. Download PDF and verify it's not 1KB
4. Open downloaded PDF and verify signatures are visible

## Environment Variables to Check

```bash
# Signing configuration
NEXT_PRIVATE_SIGNING_TRANSPORT=local  # or gcloud-hsm
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/path/to/cert.p12
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<base64-encoded-cert>
NEXT_PRIVATE_SIGNING_PASSPHRASE=<cert-password>

# Storage configuration
NEXT_PUBLIC_UPLOAD_TRANSPORT=database  # or s3

# Job configuration
NEXT_PRIVATE_INTERNAL_WEBAPP_URL=http://localhost:3000  # or your domain
```

## Next Steps

1. **Deploy the changes** with the added logging
2. **Reproduce the issue** with a test document
3. **Collect logs** and run the debug script
4. **Identify the specific failure point** from the logs
5. **Apply the appropriate solution** based on the issue found

## Additional Notes

- The job system runs inline in serverless environments (Vercel, AWS Lambda)
- Jobs have a retry mechanism (max 3 retries by default)
- Large PDFs may timeout in serverless environments
- The signing certificate must be available and valid
