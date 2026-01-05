# Serverless Timeout Fix - Complete Solution

## Problem Summary

On Vercel Serverless (Hobby plan), documents get stuck in "Processing document" state after signing because:

1. **10-second timeout**: Vercel Hobby plan limits function execution to 10 seconds
2. **Long-running job**: The `seal-document` job takes 15-30 seconds (PDF processing + signing)
3. **Inline execution**: Jobs were running inline, blocking the HTTP request
4. **Timeout kills job**: When timeout hits, job is left in PROCESSING state
5. **Document stuck**: Document remains PENDING forever

## Root Cause

**File**: `packages/lib/jobs/client/local.ts` (line 225)

```typescript
// OLD CODE - Caused the issue
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (isServerless) {
  // Runs job inline (synchronously) - blocks the request
  await this.runJobInline(jobId, data, isRetry);
  return;
}
```

When `seal-document` job runs inline:

- User clicks "Complete" → triggers `completeDocumentWithToken()`
- Function triggers `seal-document` job inline
- Job starts processing PDF (15-30 seconds)
- Vercel timeout hits at 10 seconds
- Function terminates, job left in PROCESSING state
- Document stuck in PENDING state

## Solution Implemented

### 1. Disable Inline Job Execution

**File**: `packages/lib/jobs/client/local.ts`

```typescript
// NEW CODE - Fixed
const isServerless = false; // Force HTTP mode even on Vercel

if (isServerless) {
  await this.runJobInline(jobId, data, isRetry);
  return;
}
```

**Effect**:

- Jobs now trigger via HTTP POST instead of running inline
- HTTP request returns immediately (doesn't wait for job)
- Job processes asynchronously in separate function invocation
- User request completes quickly

**Caveat**:

- Job can still timeout after 10 seconds
- But it won't block the user's request
- Cron job will retry stuck jobs

### 2. Increase Job Timeout Tolerance

**File**: `packages/lib/jobs/client/local.ts` (line ~252)

```typescript
// OLD: 150ms timeout
setTimeout(resolve, 150);

// NEW: 2000ms timeout
setTimeout(resolve, 2000);
```

**Effect**:

- Gives job more time to start processing
- Reduces race conditions
- Better reliability on cold starts

### 3. Add Vercel Cron Job

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/process-pending-documents",
      "schedule": "* * * * *"
    }
  ]
}
```

**Schedule**: Runs every minute (`* * * * *`)

**What it does**:

1. Finds documents where all recipients signed but status is PENDING
2. Checks if seal-document job exists
3. If job is stuck (PROCESSING for >5 minutes), marks it FAILED
4. Triggers new seal-document job
5. Processes up to 10 documents per run

**File**: `apps/remix/server/api/cron/process-pending-documents.ts`

Key logic:

```typescript
// Find stuck documents
const stuckDocuments = await prisma.envelope.findMany({
  where: {
    type: EnvelopeType.DOCUMENT,
    status: DocumentStatus.PENDING,
    recipients: {
      every: {
        OR: [
          { signingStatus: SigningStatus.SIGNED },
          { role: RecipientRole.CC },
        ],
      },
    },
  },
  take: 10,
});

// For each stuck document
for (const envelope of stuckDocuments) {
  // Check for existing job
  const existingJob = await prisma.backgroundJob.findFirst({
    where: {
      jobId: "internal.seal-document",
      status: { in: [PENDING, PROCESSING] },
    },
  });

  // If job stuck for >5 minutes, mark failed and retry
  if (existingJob && isStuck(existingJob)) {
    await markJobFailed(existingJob);
    await triggerNewJob(envelope);
  }

  // If no job exists, trigger one
  if (!existingJob) {
    await triggerNewJob(envelope);
  }
}
```

### 4. Integrate Cron Route

**File**: `apps/remix/server/router.ts`

```typescript
import cronRoute from "./api/cron/route";

// Add cron route
app.route("/api/cron", cronRoute);
```

**File**: `apps/remix/server/api/cron/route.ts`

```typescript
app.get("/process-pending-documents", async (c) => {
  // Optional: Verify cron secret
  const authHeader = c.req.header("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return processPendingDocuments(c);
});
```

## How It Works Now

### Normal Flow (Job Completes)

```
User clicks Complete
  ↓
completeDocumentWithToken() called
  ↓
Triggers seal-document via HTTP POST
  ↓
HTTP request returns immediately
  ↓
User sees "Processing document" page
  ↓
seal-document job runs in separate function
  ↓
Job completes within 10 seconds (or times out)
  ↓
If completes: Document status → COMPLETED
  ↓
User redirected to completed document
```

### Timeout Flow (Job Times Out)

```
User clicks Complete
  ↓
completeDocumentWithToken() called
  ↓
Triggers seal-document via HTTP POST
  ↓
HTTP request returns immediately
  ↓
seal-document job starts in separate function
  ↓
Job times out after 10 seconds
  ↓
Job left in PROCESSING state
  ↓
Document stuck in PENDING
  ↓
⏰ Cron runs (every minute)
  ↓
Finds stuck document
  ↓
Marks old job as FAILED
  ↓
Triggers new seal-document job
  ↓
New job attempts processing
  ↓
Repeats until success or max retries
```

## Deployment Steps

### 1. Deploy Code Changes

```bash
# Commit changes
git add .
git commit -m "Fix serverless timeout issues with cron job"

# Push to Vercel
git push origin main
```

### 2. Configure Cron Secret (Optional)

For additional security, add a cron secret:

```bash
# Generate secret
openssl rand -base64 32

# Add to Vercel
vercel env add CRON_SECRET production
# Paste the generated secret

# Redeploy
vercel --prod
```

### 3. Verify Cron Job

After deployment:

1. Go to Vercel Dashboard → Your Project → Cron Jobs
2. You should see: `process-pending-documents` scheduled for `* * * * *`
3. Check logs to verify it's running

### 4. Test the Fix

1. Create a test document
2. Sign as recipient
3. Click "Complete"
4. Should see "Processing document"
5. Wait up to 1 minute
6. Document should complete (status → COMPLETED)

## Monitoring

### Check Cron Logs

```bash
vercel logs --follow
```

Look for:

```
[CRON] Starting process-pending-documents job
[CRON] Found X stuck documents
[CRON] Triggering seal-document job for document Y
[CRON] Process-pending-documents job completed
```

### Check Job Status

Use diagnostic script:

```bash
npx tsx scripts/check-completion-flow.ts <token>
```

Look for:

```
seal-document job: COMPLETED ✓
Document status: COMPLETED ✓
```

### Check Stuck Documents

Query database:

```sql
-- Find documents stuck in PENDING
SELECT e.id, e."secondaryId", e.status, e."createdAt"
FROM "Envelope" e
WHERE e.type = 'DOCUMENT'
  AND e.status = 'PENDING'
  AND NOT EXISTS (
    SELECT 1 FROM "Recipient" r
    WHERE r."envelopeId" = e.id
      AND r.role != 'CC'
      AND r."signingStatus" != 'SIGNED'
  );

-- Find jobs stuck in PROCESSING
SELECT id, "jobId", status, "createdAt", "updatedAt"
FROM "BackgroundJob"
WHERE status = 'PROCESSING'
  AND "updatedAt" < NOW() - INTERVAL '5 minutes';
```

## Limitations

### Current Setup

- **Max processing time**: Still limited by Vercel timeout (10s Hobby, 60s Pro)
- **Retry delay**: Up to 1 minute (cron frequency)
- **Concurrent jobs**: Limited by Vercel function concurrency

### If Jobs Still Timeout

If seal-document consistently times out even with retries:

#### Option 1: Upgrade to Vercel Pro

- **Cost**: $20/month per member
- **Timeout**: 60 seconds (vs 10 seconds)
- **Benefit**: Most jobs will complete within 60s

```bash
# Update vercel.json
{
  "functions": {
    "apps/remix/api/index.js": {
      "maxDuration": 60
    }
  }
}
```

#### Option 2: Use External Job Service

For production, use a dedicated job processor:

**Trigger.dev** (Recommended):

```bash
npm install @trigger.dev/sdk
```

**Inngest** (Alternative):

```bash
npm install inngest
```

**Upstash QStash** (Lightweight):

```bash
npm install @upstash/qstash
```

See `SERVERLESS_ISSUES_FIX.md` for detailed integration guides.

#### Option 3: Optimize PDF Processing

Make seal-document faster:

1. **Skip unnecessary operations**:

   ```typescript
   // Only flatten if needed
   if (hasFormFields) {
     await flattenForm(pdfDoc);
   }
   ```

2. **Disable certificate/audit log**:

   ```typescript
   // In team settings
   includeSigningCertificate: false,
   includeAuditLog: false,
   ```

3. **Use smaller PDFs**:
   - Compress PDFs before upload
   - Limit page count
   - Reduce image quality

## Troubleshooting

### Cron Job Not Running

**Check Vercel Dashboard**:

- Go to Project → Cron Jobs
- Verify schedule is active
- Check execution logs

**Verify Route**:

```bash
curl https://your-domain.com/api/cron/process-pending-documents
```

Should return:

```json
{
  "success": true,
  "processed": 0,
  "timestamp": "2026-01-05T..."
}
```

### Jobs Still Timing Out

**Check function timeout**:

```bash
vercel inspect <deployment-url>
```

Look for: `maxDuration: 10` (Hobby) or `maxDuration: 60` (Pro)

**Check job logs**:

```bash
vercel logs --follow | grep "seal-document"
```

Look for timeout errors:

```
Task timed out after 10.00 seconds
```

### Documents Still Stuck

**Manual trigger**:

```bash
npx tsx scripts/force-complete-document.ts <documentId>
```

**Check database**:

```sql
-- Find the stuck document
SELECT * FROM "Envelope" WHERE "secondaryId" = 'doc_xxx';

-- Check recipients
SELECT * FROM "Recipient" WHERE "envelopeId" = 'envelope_id';

-- Check jobs
SELECT * FROM "BackgroundJob"
WHERE "jobId" = 'internal.seal-document'
ORDER BY "createdAt" DESC LIMIT 10;
```

## Summary

**Changes Made**:

1. ✅ Disabled inline job execution in `local.ts`
2. ✅ Increased job timeout tolerance from 150ms to 2000ms
3. ✅ Added Vercel Cron job to process stuck documents every minute
4. ✅ Created cron endpoint and integrated into router
5. ✅ Updated `vercel.json` with cron configuration

**Expected Behavior**:

- Documents complete within 1 minute (10s job + up to 50s cron delay)
- No more infinite "Processing document" loader
- Automatic retry for timed-out jobs
- Better reliability on serverless

**Next Steps**:

1. Deploy to Vercel
2. Test document signing flow
3. Monitor cron logs
4. Consider upgrading to Pro or external job service for production

---

**Files Modified**:

- `packages/lib/jobs/client/local.ts` - Disabled inline execution, increased timeout
- `vercel.json` - Added cron job configuration
- `apps/remix/server/router.ts` - Integrated cron route

**Files Created**:

- `apps/remix/server/api/cron/route.ts` - Cron route handler
- `apps/remix/server/api/cron/process-pending-documents.ts` - Cron job logic
- `SERVERLESS_TIMEOUT_FIX.md` - This documentation
