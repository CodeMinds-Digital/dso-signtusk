# Serverless Environment Issues - Complete Fix

## Root Cause Identified

You're running on **Vercel Serverless** with these constraints:

- **Function timeout:** 10 seconds (Hobby) / 60 seconds (Pro)
- **Memory:** 2GB
- **Execution:** Functions terminate after timeout
- **Jobs:** Run inline (synchronously) in the same function

## The Problems

### 1. Document Processing Stuck

**What happens:**

```
User clicks Complete
  ↓
completeDocumentWithToken() called
  ↓
Triggers seal-document job (inline)
  ↓
Job starts: Load PDF, insert fields, sign PDF...
  ↓
⏰ Vercel function times out (10 seconds)
  ↓
Job left in PROCESSING state
  ↓
Document stuck in PENDING
```

**Why:** PDF processing + signing takes 15-30 seconds, but Vercel times out at 10 seconds.

### 2. Fields Auto-Adding Recipients

**What happens:**

```
Add field to document
  ↓
Database update starts
  ↓
⏰ Function times out before commit
  ↓
Partial data saved
  ↓
Next request sees inconsistent state
  ↓
Auto-creates recipient to fix inconsistency
```

**Why:** Race condition due to function timeout during database transaction.

### 3. Sync Issues

**What happens:**

- Multiple requests hit different serverless instances
- Each instance has its own database connection
- No shared state between instances
- Updates from one instance not immediately visible to others

**Why:** Serverless functions are stateless and isolated.

## Solutions

### Solution 1: Use Background Job Service (Recommended)

Vercel serverless functions are NOT suitable for long-running jobs. You need a dedicated job processor.

**Options:**

#### A. Trigger.dev (Easiest)

```bash
npm install @trigger.dev/sdk
```

**Pros:**

- Built for long-running jobs
- Handles retries automatically
- Free tier available
- Easy integration

**Setup:**

1. Sign up at trigger.dev
2. Get API key
3. Update job client to use Trigger.dev
4. Jobs run on their infrastructure

#### B. Inngest (Alternative)

```bash
npm install inngest
```

**Pros:**

- Similar to Trigger.dev
- Good free tier
- Built for serverless

#### C. Upstash QStash (Lightweight)

```bash
npm install @upstash/qstash
```

**Pros:**

- Simple HTTP-based queue
- Very affordable
- Easy to integrate

#### D. Self-hosted Worker (Most Control)

Deploy a separate worker service:

```bash
# On a VPS or container
npm run jobs:worker
```

**Pros:**

- Full control
- No timeout limits
- Can run indefinitely

**Cons:**

- Need to manage infrastructure
- Additional cost

### Solution 2: Optimize for Serverless (Temporary)

If you can't use a background job service immediately, optimize the current setup:

#### A. Increase Vercel Timeout

**Upgrade to Pro plan:**

- 60-second timeout (vs 10 seconds)
- More memory
- Better performance

**Cost:** $20/month per member

#### B. Optimize PDF Processing

Make the seal-document job faster:

**File:** `packages/lib/jobs/definitions/internal/seal-document.handler.ts`

Add caching and optimization:

```typescript
// Cache PDF operations
const pdfDoc = await PDFDocument.load(pdfData, {
  updateMetadata: false, // Skip metadata updates
  ignoreEncryption: true, // Skip encryption checks
});

// Skip unnecessary operations
// Only flatten if needed
if (needsFlattening) {
  await flattenForm(pdfDoc);
}
```

#### C. Split Job into Smaller Tasks

Break seal-document into multiple smaller jobs:

1. **prepare-document** (2-3 seconds)
   - Load PDF
   - Validate fields

2. **insert-fields** (3-5 seconds)
   - Insert signature fields
   - Flatten form

3. **sign-document** (5-10 seconds)
   - Sign PDF
   - Save result

4. **finalize-document** (2-3 seconds)
   - Update status
   - Send emails

Each job completes within timeout, triggers the next one.

### Solution 3: Use Vercel Cron Jobs

For the seal-document job specifically, use Vercel Cron:

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/process-pending-documents",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

**Create:** `apps/remix/server/api/cron/process-pending-documents.ts`

```typescript
// Runs every minute
// Finds documents where all signed but not completed
// Triggers seal-document for each
```

**Pros:**

- Works within Vercel
- No external service needed
- Reliable

**Cons:**

- Up to 1-minute delay
- Still subject to timeout

## Immediate Fix (Quick Workaround)

### Step 1: Disable Inline Job Execution

**File:** `packages/lib/jobs/client/local.ts`

Change line 225:

```typescript
// Before
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

// After - Force HTTP mode even on Vercel
const isServerless = false;
```

This makes jobs use HTTP requests instead of inline execution.

**Effect:**

- Jobs trigger via HTTP
- Don't block the main request
- Can timeout independently

**Caveat:**

- Jobs might still timeout
- But won't block user requests

### Step 2: Increase Job Timeout Tolerance

**File:** `packages/lib/jobs/client/local.ts`

Change line 252:

```typescript
// Before
await Promise.race([
  fetch(endpoint, ...),
  new Promise((resolve) => {
    setTimeout(resolve, 150);  // 150ms timeout
  }),
]);

// After - Wait longer for job to start
await Promise.race([
  fetch(endpoint, ...),
  new Promise((resolve) => {
    setTimeout(resolve, 5000);  // 5 second timeout
  }),
]);
```

**Effect:**

- Waits 5 seconds for job to start
- Gives more time for job to begin processing

### Step 3: Add Job Retry Logic

**File:** `packages/lib/jobs/client/local.ts`

In `runJobInline`, increase max retries:

```typescript
const jobHasExceededRetries =
  backgroundJob.retried >= 5 && // Increase from 3 to 5
  !(error instanceof BackgroundTaskFailedError);
```

**Effect:**

- Jobs retry more times before failing
- Better chance of completion

## Database Sync Issues Fix

### Problem: Race Conditions

Multiple serverless instances updating database simultaneously.

### Solution: Use Database Transactions

**File:** `packages/lib/server-only/envelope/create-envelope.ts`

Wrap all database operations in transactions:

```typescript
await prisma.$transaction(async (tx) => {
  // All database operations here
  // Either all succeed or all fail
  // No partial updates
});
```

### Solution: Add Optimistic Locking

Add version field to prevent concurrent updates:

```prisma
model Envelope {
  id      String
  version Int    @default(0)
  // ... other fields
}
```

Update logic:

```typescript
await prisma.envelope.update({
  where: {
    id: envelopeId,
    version: currentVersion, // Only update if version matches
  },
  data: {
    // updates
    version: { increment: 1 }, // Increment version
  },
});
```

## Recommended Architecture

For production, use this architecture:

```
┌─────────────────────────────────────────────────────────┐
│ Vercel Serverless Functions                            │
│ - Handle HTTP requests                                  │
│ - Quick operations only (<5 seconds)                    │
│ - Trigger background jobs                               │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Job Queue (Trigger.dev / Inngest / QStash)             │
│ - Receives job requests                                 │
│ - Manages job execution                                 │
│ - Handles retries                                       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Job Worker (Separate service or Trigger.dev)           │
│ - Processes long-running jobs                           │
│ - No timeout limits                                     │
│ - seal-document, send-emails, etc.                      │
└─────────────────────────────────────────────────────────┘
```

## Quick Test

To verify the timeout issue:

1. **Check Vercel logs:**

   ```bash
   vercel logs --follow
   ```

2. **Look for:**

   ```
   Task timed out after 10.00 seconds
   ```

3. **Check job status:**

   ```bash
   npx tsx scripts/check-completion-flow.ts <token>
   ```

4. **Look for:**
   ```
   seal-document job: PROCESSING (stuck)
   ```

## Implementation Priority

### Immediate (Today)

1. ✅ Apply inline execution fix (disable serverless mode)
2. ✅ Increase job timeout tolerance
3. ✅ Add more logging

### Short-term (This Week)

1. Upgrade to Vercel Pro (60s timeout)
2. Optimize PDF processing
3. Add database transactions

### Long-term (This Month)

1. Integrate Trigger.dev or Inngest
2. Move all long-running jobs to background service
3. Add proper job monitoring

## Summary

**Root Cause:** Vercel serverless 10-second timeout kills long-running jobs

**Immediate Fix:** Disable inline job execution, use HTTP mode

**Proper Fix:** Use dedicated background job service (Trigger.dev/Inngest)

**Cost:** Free tier available for most job services

---

**Next Steps:**

1. Apply immediate fix (disable inline execution)
2. Test document completion
3. Plan migration to proper job service
