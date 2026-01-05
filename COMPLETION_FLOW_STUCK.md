# Document Completion Flow Stuck - "Processing document" Issue

## 🔴 Problem

After a recipient completes signing:

- Page redirects to `/sign/<token>/complete`
- Shows "Processing document" with spinning loader
- **Stays stuck for 3+ minutes** (or indefinitely)
- Document status remains **PENDING** instead of **COMPLETED**
- Signature fields are not updated in the final PDF

## 🔍 Root Cause

The completion flow has multiple steps, and it's getting stuck at the **seal-document** job:

### Normal Flow (What Should Happen)

```
1. Recipient signs last field
   ↓
2. completeDocumentWithToken() is called
   ↓
3. Recipient marked as SIGNED in database
   ↓
4. Check: Have all recipients signed?
   ↓ YES
5. Trigger seal-document job
   ↓
6. seal-document job runs:
   - Decorates PDF with signatures
   - Signs PDF with certificate
   - Updates document status to COMPLETED
   ↓
7. Complete page polls signingStatus endpoint
   ↓
8. signingStatus returns "COMPLETED"
   ↓
9. Page shows "Everyone has signed" ✅
```

### What's Happening (Stuck Flow)

```
1. Recipient signs last field ✅
   ↓
2. completeDocumentWithToken() is called ✅
   ↓
3. Recipient marked as SIGNED in database ✅
   ↓
4. Check: Have all recipients signed? ✅
   ↓
5. Trigger seal-document job ✅
   ↓
6. seal-document job runs:
   ❌ FAILS (likely due to missing certificate or other error)
   ↓
7. Document status stays PENDING
   ↓
8. Complete page polls signingStatus endpoint
   ↓
9. signingStatus returns "PROCESSING" (because all signed but status is PENDING)
   ↓
10. Page shows "Processing document" 🔄 STUCK FOREVER
```

## 🎯 The Issue

The `/complete` page uses `trpc.envelope.signingStatus` which returns:

- **"PENDING"** - Not all recipients have signed
- **"PROCESSING"** - All recipients signed, but document status is still PENDING
- **"COMPLETED"** - Document status is COMPLETED
- **"REJECTED"** - Document was rejected

**The page gets stuck on "PROCESSING"** because:

1. All recipients have signed (so it's not "PENDING")
2. But the seal-document job failed (so status is not "COMPLETED")
3. The page keeps polling every 3 seconds, waiting for "COMPLETED"
4. But it never comes because the job failed

## 🔧 Diagnostic Steps

### Step 1: Check the Completion Flow

```bash
npx tsx scripts/check-completion-flow.ts <token>
```

Replace `<token>` with the recipient token from the URL (e.g., `St3TgPEP-AjfQZQoAYjWZ`)

This will show:

- ✅ Whether all recipients have signed
- ✅ Whether seal-document job was created
- ✅ Job status (PENDING, RUNNING, FAILED, COMPLETED)
- ✅ Error messages if job failed

### Step 2: Check Signing Certificate Setup

The most common reason for seal-document failure is **missing signing certificate**.

```bash
npx tsx scripts/check-signing-setup.ts
```

You should see:

```
✓ NEXT_PRIVATE_SIGNING_TRANSPORT: local
✓ NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH: ./apps/remix/example/cert.p12
✓ Certificate file exists
```

If you see errors, the certificate is missing or misconfigured.

### Step 3: Check Application Logs

Look for errors in your application logs:

**Local Development:**

```bash
# Check terminal where app is running
# Look for errors containing "seal-document" or "signing"
```

**Production (Vercel):**

```bash
vercel logs --follow
```

Look for:

- `[SEAL-DOCUMENT]` log entries
- Errors about certificates
- Errors about PDF processing

## 🛠️ Solutions

### Solution 1: Fix Missing Certificate (Most Common)

**For Local Development:**

1. Make sure certificate is in the right location:

   ```bash
   ls -la apps/remix/example/cert.p12
   ```

2. Update `.env`:

   ```env
   NEXT_PRIVATE_SIGNING_TRANSPORT=local
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=./apps/remix/example/cert.p12
   NEXT_PRIVATE_SIGNING_PASSPHRASE=
   ```

3. Restart your dev server

**For Production (Vercel):**

1. Convert certificate to base64:

   ```bash
   base64 -i apps/remix/example/cert.p12 > cert.base64.txt
   ```

2. Add to Vercel:

   ```bash
   # Add certificate
   vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
   # Paste the content from cert.base64.txt

   # Add passphrase (empty for example cert)
   vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
   # Press Enter (leave empty)

   # Set transport
   vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
   # Type: local
   ```

3. Redeploy:
   ```bash
   vercel --prod
   ```

See `VERCEL_SETUP_COMPLETE.md` for detailed instructions.

### Solution 2: Fix Stuck Documents

If you have documents that are already stuck:

```bash
npx tsx scripts/fix-stuck-documents.ts
```

This will:

1. Find all documents where all recipients signed but status is PENDING
2. Manually trigger the seal-document job for each
3. Show progress and results

### Solution 3: Check Job Queue

If jobs are not running at all:

**Check if job worker is running:**

```bash
# Local development - check if this is in your package.json scripts
npm run jobs:worker

# Or check if it's running in a separate terminal
```

**For Vercel:**

- Jobs run automatically via serverless functions
- Check Vercel logs for job execution

### Solution 4: Manual Database Fix (Last Resort)

If the seal-document job keeps failing and you need to unblock users:

```sql
-- WARNING: This marks document as complete WITHOUT signing the PDF
-- Only use if you understand the implications

UPDATE "Envelope"
SET
  status = 'COMPLETED',
  "completedAt" = NOW()
WHERE
  id = '<envelope-id>'
  AND status = 'PENDING';
```

**Note:** This will mark the document as complete, but the PDF won't have signatures embedded. Only use this as a temporary workaround while you fix the underlying issue.

## 🔍 Comparing with documenso-main

Both projects have **identical** completion flow logic:

### Files Compared

| File                              | Root | documenso-main | Status            |
| --------------------------------- | ---- | -------------- | ----------------- |
| `complete.tsx`                    | ✅   | ✅             | Identical         |
| `signing-status-envelope.ts`      | ✅   | ✅             | Identical         |
| `complete-document-with-token.ts` | ✅   | ✅             | Identical         |
| `seal-document.handler.ts`        | ⚠️   | ✅             | Check differences |

### Key Differences to Check

1. **Signing certificate configuration**
   - Root: May be missing or misconfigured
   - documenso-main: Properly configured

2. **Job queue setup**
   - Root: Check if jobs worker is running
   - documenso-main: Jobs worker running

3. **Environment variables**
   - Root: Check all signing-related env vars
   - documenso-main: All env vars set correctly

## 📊 Status Transitions

### Document Status Flow

```
DRAFT → PENDING → COMPLETED
                ↘ REJECTED
```

### Recipient Signing Status Flow

```
NOT_SIGNED → SIGNED
           ↘ REJECTED
```

### What Triggers Status Changes

| Event                    | Document Status | Recipient Status |
| ------------------------ | --------------- | ---------------- |
| Document sent            | PENDING         | NOT_SIGNED       |
| Recipient signs          | PENDING         | SIGNED           |
| All sign + seal succeeds | COMPLETED       | SIGNED           |
| Recipient rejects        | REJECTED        | REJECTED         |
| Seal job fails           | PENDING (stuck) | SIGNED           |

## 🎬 Testing the Fix

After applying the fix:

1. **Create a test document**

   ```bash
   # In your app, create a new document and send for signing
   ```

2. **Sign the document**

   ```bash
   # Open the signing link and complete all fields
   ```

3. **Watch the logs**

   ```bash
   # Local
   # Check terminal output for [SEAL-DOCUMENT] logs

   # Vercel
   vercel logs --follow
   ```

4. **Verify completion**
   - Page should show "Everyone has signed" within 5-10 seconds
   - Document status should be COMPLETED
   - PDF should be downloadable with signatures

## 🚨 Common Errors

### Error: "Failed to sign PDF"

**Cause:** Missing or invalid signing certificate

**Fix:** Follow Solution 1 above

### Error: "Document is not complete"

**Cause:** Not all recipients have signed, but seal-document was triggered

**Fix:** Check recipient signing status in database

### Error: "Certificate file not found"

**Cause:** `NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH` points to wrong location

**Fix:** Update path in `.env` to correct location

### Error: "Invalid passphrase"

**Cause:** Wrong passphrase for certificate

**Fix:** Update `NEXT_PRIVATE_SIGNING_PASSPHRASE` in `.env`

## 📝 Prevention

To prevent this issue in the future:

1. **Always test signing flow** after deployment
2. **Monitor seal-document jobs** for failures
3. **Set up alerts** for failed jobs
4. **Keep certificates** in secure, backed-up location
5. **Document certificate rotation** process

## 🔗 Related Files

- `apps/remix/app/routes/_recipient+/sign.$token+/complete.tsx` - Complete page
- `packages/trpc/server/envelope-router/signing-status-envelope.ts` - Status endpoint
- `packages/lib/server-only/document/complete-document-with-token.ts` - Completion logic
- `packages/lib/jobs/definitions/internal/seal-document.handler.ts` - PDF signing job
- `scripts/check-completion-flow.ts` - Diagnostic script (NEW)
- `scripts/fix-stuck-documents.ts` - Fix script
- `VERCEL_SETUP_COMPLETE.md` - Certificate setup guide

## 📞 Quick Reference

```bash
# Check completion flow
npx tsx scripts/check-completion-flow.ts <token>

# Check certificate setup
npx tsx scripts/check-signing-setup.ts

# Fix stuck documents
npx tsx scripts/fix-stuck-documents.ts

# Check Vercel setup
npx tsx scripts/check-vercel-signing.ts

# View logs
vercel logs --follow
```

---

**Status:** Diagnostic tools created, awaiting test results
**Next Steps:** Run diagnostic script with actual stuck document token
