# Document Completion Flow - Root vs documenso-main Comparison

## Executive Summary

✅ **All completion flow files are IDENTICAL** between root and documenso-main projects.

The issue is **NOT** in the code logic, but in:

1. **Configuration** (missing signing certificate)
2. **Environment setup** (job queue not running)
3. **Runtime errors** (certificate loading failures)

## Files Compared

### 1. Complete Page Route

**File:** `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx`

**Status:** ✅ **IDENTICAL**

**What it does:**

- Displays completion page after signing
- Polls `signingStatus` endpoint every 3 seconds
- Shows different UI based on status:
  - "PENDING" → "Waiting for others to sign"
  - "PROCESSING" → "Processing document" (spinning loader)
  - "COMPLETED" → "Everyone has signed"
  - "REJECTED" → "Document rejected"

**Key Logic:**

```typescript
const { data: signingStatusData } = trpc.envelope.signingStatus.useQuery(
  { token: recipient?.token || "" },
  { refetchInterval: 3000 } // Poll every 3 seconds
);
```

### 2. Signing Status Endpoint

**File:** `packages/trpc/server/envelope-router/signing-status-envelope.ts`

**Status:** ✅ **IDENTICAL**

**What it does:**

- Returns current signing status for a document
- Checks document status and recipient statuses
- Returns one of: PENDING, PROCESSING, COMPLETED, REJECTED

**Key Logic:**

```typescript
// If document status is COMPLETED
if (envelope.status === DocumentStatus.COMPLETED) {
  return { status: "COMPLETED" };
}

// If all recipients signed but document not completed yet
const isComplete = envelope.recipients.every(
  (r) => r.role === RecipientRole.CC || r.signingStatus === SigningStatus.SIGNED
);

if (isComplete) {
  return { status: "PROCESSING" }; // ← THIS IS WHERE IT GETS STUCK
}

return { status: "PENDING" };
```

**Why it gets stuck:**

- All recipients have signed → `isComplete = true`
- But document status is still PENDING (seal-document failed)
- So it returns "PROCESSING"
- Page keeps polling, waiting for "COMPLETED"
- But it never comes because seal-document job failed

### 3. Complete Document Logic

**File:** `packages/lib/server-only/document/complete-document-with-token.ts`

**Status:** ✅ **IDENTICAL**

**What it does:**

- Called when recipient completes signing
- Marks recipient as SIGNED
- Checks if all recipients have signed
- If yes, triggers seal-document job

**Key Logic:**

```typescript
const haveAllRecipientsSigned = await prisma.envelope.findFirst({
  where: {
    id: envelope.id,
    recipients: {
      every: {
        OR: [
          { signingStatus: SigningStatus.SIGNED },
          { role: RecipientRole.CC },
        ],
      },
    },
  },
});

if (haveAllRecipientsSigned) {
  console.log(
    "[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job"
  );

  await jobs.triggerJob({
    name: "internal.seal-document",
    payload: {
      documentId: legacyDocumentId,
      requestMetadata,
    },
  });

  console.log("[COMPLETE-DOCUMENT] Seal-document job triggered successfully");
}
```

**Logging added:** We added console.log statements to track this flow.

### 4. Seal Document Job Handler

**File:** `packages/lib/jobs/definitions/internal/seal-document.handler.ts`

**Status:** ⚠️ **FUNCTIONALLY IDENTICAL** (only import path differences)

**What it does:**

- Decorates PDF with signature fields
- Signs PDF with certificate
- Updates document status to COMPLETED
- Sends completion emails

**Key Steps:**

1. Load PDF from storage
2. Normalize and flatten PDF layers
3. Insert signature fields into PDF
4. Sign PDF with certificate ← **THIS IS WHERE IT FAILS**
5. Save signed PDF
6. Update document status to COMPLETED

**Where it fails:**

```typescript
const pdfBuffer = await signPdf({ pdf: Buffer.from(pdfBytes) });
// ↑ This fails if certificate is missing or invalid
```

**Differences:**

- Only import paths changed (`@signtusk` vs `@documenso`)
- Logic is 100% identical

## The Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Recipient Signs Last Field                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. completeDocumentWithToken()                             │
│    - Mark recipient as SIGNED                              │
│    - Check if all recipients signed                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    All signed?
                          ↓ YES
┌─────────────────────────────────────────────────────────────┐
│ 3. Trigger seal-document Job                               │
│    console.log("[COMPLETE-DOCUMENT] Triggering...")        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. seal-document Job Runs                                  │
│    - Load PDF                                              │
│    - Insert signature fields                               │
│    - Sign PDF with certificate ← FAILS HERE                │
│    - Update status to COMPLETED                            │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    ❌ JOB FAILS
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Document Status Stays PENDING                           │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Complete Page Polls signingStatus                       │
│    - All recipients signed? YES                            │
│    - Document status COMPLETED? NO                         │
│    - Return: "PROCESSING"                                  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Page Shows "Processing document" 🔄                     │
│    Polls every 3 seconds... forever                        │
└─────────────────────────────────────────────────────────────┘
```

## Why documenso-main Works

The documenso-main project works because:

1. ✅ **Certificate is properly configured**

   ```env
   NEXT_PRIVATE_SIGNING_TRANSPORT=local
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=./apps/remix/example/cert.p12
   NEXT_PRIVATE_SIGNING_PASSPHRASE=
   ```

2. ✅ **Certificate file exists** at the specified path

3. ✅ **Job queue is running** (either via worker or serverless)

4. ✅ **All environment variables are set** correctly

## Why Root Project Fails

The root project fails because:

1. ❌ **Certificate is missing or misconfigured**
   - Not in `.env` file
   - Wrong path
   - File doesn't exist
   - Wrong passphrase

2. ❌ **Job queue might not be running**
   - Worker not started
   - Serverless function not configured

3. ❌ **Environment variables not set** in production (Vercel)

## The Fix

### For Local Development

1. **Add certificate to `.env`:**

   ```env
   NEXT_PRIVATE_SIGNING_TRANSPORT=local
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=./apps/remix/example/cert.p12
   NEXT_PRIVATE_SIGNING_PASSPHRASE=
   ```

2. **Verify certificate exists:**

   ```bash
   ls -la apps/remix/example/cert.p12
   ```

3. **Restart dev server**

### For Production (Vercel)

1. **Convert certificate to base64:**

   ```bash
   base64 -i apps/remix/example/cert.p12 > cert.base64.txt
   ```

2. **Add to Vercel environment variables:**

   ```bash
   vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
   # Paste content from cert.base64.txt

   vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
   # Press Enter (empty)

   vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
   # Type: local
   ```

3. **Redeploy:**
   ```bash
   vercel --prod
   ```

## Testing the Fix

### Step 1: Check Configuration

```bash
npx tsx scripts/check-signing-setup.ts
```

Should show:

```
✓ NEXT_PRIVATE_SIGNING_TRANSPORT: local
✓ NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH: ./apps/remix/example/cert.p12
✓ Certificate file exists
```

### Step 2: Check Stuck Document

```bash
npx tsx scripts/check-completion-flow.ts <token>
```

Replace `<token>` with the token from the stuck document URL.

Should show:

- All recipients signed: YES
- seal-document job status: FAILED (with error message)

### Step 3: Fix Stuck Documents

```bash
npx tsx scripts/fix-stuck-documents.ts
```

This will re-trigger seal-document for all stuck documents.

### Step 4: Test New Document

1. Create a new document
2. Send for signing
3. Sign the document
4. Watch the complete page
5. Should show "Everyone has signed" within 5-10 seconds

## Diagnostic Scripts

We created these scripts to help diagnose and fix the issue:

| Script                     | Purpose                             |
| -------------------------- | ----------------------------------- |
| `check-signing-setup.ts`   | Verify certificate configuration    |
| `check-vercel-signing.ts`  | Verify Vercel environment variables |
| `check-completion-flow.ts` | Check document completion status    |
| `test-seal-document.ts`    | Manually trigger seal-document job  |
| `fix-stuck-documents.ts`   | Fix all stuck documents             |
| `debug-signing-issue.ts`   | Comprehensive diagnostic            |

## Logging Added

We added logging to track the flow:

**In `complete-document-with-token.ts`:**

```typescript
console.log(
  "[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job"
);
console.log(
  "[COMPLETE-DOCUMENT] Document ID:",
  legacyDocumentId,
  "Envelope ID:",
  envelope.id
);
console.log("[COMPLETE-DOCUMENT] Seal-document job triggered successfully");
```

**In `seal-document.handler.ts`:**

```typescript
console.log("[SEAL-DOCUMENT] Starting PDF decoration and signing");
console.log("[SEAL-DOCUMENT] PDF signed, size:", pdfBuffer.length, "bytes");
console.log("[SEAL-DOCUMENT] Document data updated successfully");
```

## Conclusion

**The code is identical.** The issue is purely configuration/environment:

1. ✅ **Code Logic:** Identical in both projects
2. ❌ **Configuration:** Missing in root project
3. ❌ **Certificate:** Not set up in root project
4. ❌ **Environment:** Not configured in Vercel

**Fix:** Follow the certificate setup guide in `VERCEL_SETUP_COMPLETE.md`

**Test:** Use the diagnostic scripts to verify the fix

**Monitor:** Watch logs for seal-document job execution

---

**Next Steps:**

1. Run `npx tsx scripts/check-signing-setup.ts` to verify local setup
2. Run `npx tsx scripts/check-completion-flow.ts <token>` to check stuck document
3. Follow certificate setup guide if needed
4. Run `npx tsx scripts/fix-stuck-documents.ts` to fix existing stuck documents
5. Test with a new document to verify the fix
