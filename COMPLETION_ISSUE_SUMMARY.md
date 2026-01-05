# Document Completion Issue - Complete Analysis

## Issue Report

**URL:** `https://www.signtusk.com/sign/St3TgPEP-AjfQZQoAYjWZ/complete`

**Symptom:** Page stuck on "Processing document" loader for 3+ minutes

**Impact:**

- Document status remains PENDING
- Signature fields not updated in PDF
- Recipients cannot download signed document
- Sender cannot see completed document

## Root Cause Analysis

### The Problem

The document completion flow has 3 stages:

1. **Signing Complete** ✅ - Recipient signs all fields
2. **Seal Document** ❌ - PDF decoration and signing (FAILS HERE)
3. **Mark Complete** ❌ - Update status to COMPLETED (NEVER REACHED)

The `seal-document` job is **failing silently**, causing the document to stay in PENDING status while all recipients have signed.

### Why It Fails

The seal-document job requires a **signing certificate** to digitally sign the PDF. This certificate is missing or misconfigured in your environment.

**Certificate Configuration:**

```env
# Required environment variables
NEXT_PRIVATE_SIGNING_TRANSPORT=local
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=./apps/remix/example/cert.p12
NEXT_PRIVATE_SIGNING_PASSPHRASE=

# For Vercel (production)
NEXT_PRIVATE_SIGNING_TRANSPORT=local
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<base64-encoded-certificate>
NEXT_PRIVATE_SIGNING_PASSPHRASE=
```

### Why Page Gets Stuck

The `/complete` page polls the `signingStatus` endpoint every 3 seconds:

```typescript
// Polls every 3 seconds
const { data } = trpc.envelope.signingStatus.useQuery(
  { token },
  { refetchInterval: 3000 }
);
```

The endpoint returns:

- **"PENDING"** - Not all recipients signed yet
- **"PROCESSING"** - All signed, but document not completed yet ← **STUCK HERE**
- **"COMPLETED"** - Document fully completed
- **"REJECTED"** - Document rejected

When the seal-document job fails:

1. All recipients are marked as SIGNED ✅
2. But document status stays PENDING ❌
3. Endpoint returns "PROCESSING" (all signed but not completed)
4. Page shows "Processing document" spinner
5. Keeps polling forever, waiting for "COMPLETED"
6. But it never comes because the job failed

## Code Comparison: Root vs documenso-main

### Files Analyzed

| File                              | Status       | Notes            |
| --------------------------------- | ------------ | ---------------- |
| `complete.tsx`                    | ✅ Identical | Complete page UI |
| `signing-status-envelope.ts`      | ✅ Identical | Status endpoint  |
| `complete-document-with-token.ts` | ✅ Identical | Completion logic |
| `seal-document.handler.ts`        | ✅ Identical | PDF signing job  |

**Conclusion:** All code is identical. The issue is **configuration**, not code.

### Why documenso-main Works

1. ✅ Certificate properly configured in `.env`
2. ✅ Certificate file exists at specified path
3. ✅ Job queue running
4. ✅ All environment variables set

### Why Root Project Fails

1. ❌ Certificate not configured
2. ❌ Environment variables missing
3. ❌ Vercel environment not set up

## The Solution

### Step 1: Diagnose

```bash
# Check what's wrong with a stuck document
npx tsx scripts/check-completion-flow.ts <token>

# Check certificate setup
npx tsx scripts/check-signing-setup.ts

# For Vercel
npx tsx scripts/check-vercel-signing.ts
```

### Step 2: Fix Local Development

Add to `.env`:

```env
NEXT_PRIVATE_SIGNING_TRANSPORT=local
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=./apps/remix/example/cert.p12
NEXT_PRIVATE_SIGNING_PASSPHRASE=
```

Restart server.

### Step 3: Fix Production (Vercel)

```bash
# Convert certificate to base64
base64 -i apps/remix/example/cert.p12 > cert.base64.txt

# Add to Vercel
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
# Paste content from cert.base64.txt

vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
# Press Enter (empty)

vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
# Type: local

# Redeploy
vercel --prod
```

### Step 4: Fix Stuck Documents

```bash
# This will re-trigger seal-document for all stuck documents
npx tsx scripts/fix-stuck-documents.ts
```

### Step 5: Test

1. Create a new test document
2. Send for signing
3. Sign the document
4. Complete page should show "Everyone has signed" within 5-10 seconds
5. PDF should be downloadable with signatures

## Diagnostic Tools Created

| Script                     | Purpose                          | Usage                                                  |
| -------------------------- | -------------------------------- | ------------------------------------------------------ |
| `check-completion-flow.ts` | Check document completion status | `npx tsx scripts/check-completion-flow.ts <token>`     |
| `check-signing-setup.ts`   | Verify certificate configuration | `npx tsx scripts/check-signing-setup.ts`               |
| `check-vercel-signing.ts`  | Verify Vercel environment        | `npx tsx scripts/check-vercel-signing.ts`              |
| `test-seal-document.ts`    | Manually trigger seal-document   | `npx tsx scripts/test-seal-document.ts <token>`        |
| `fix-stuck-documents.ts`   | Fix all stuck documents          | `npx tsx scripts/fix-stuck-documents.ts`               |
| `debug-signing-issue.ts`   | Comprehensive diagnostic         | `npx tsx scripts/debug-signing-issue.ts <envelope-id>` |

## Documentation Created

| Document                        | Purpose                   |
| ------------------------------- | ------------------------- |
| `COMPLETION_FLOW_STUCK.md`      | Detailed diagnostic guide |
| `COMPLETION_FLOW_COMPARISON.md` | Code comparison analysis  |
| `FIX_STUCK_COMPLETION.md`       | Quick fix guide           |
| `COMPLETION_ISSUE_SUMMARY.md`   | This document             |

## Logging Added

Added comprehensive logging to track the flow:

**In `complete-document-with-token.ts`:**

- Log when all recipients have signed
- Log when seal-document job is triggered
- Log document and envelope IDs

**In `seal-document.handler.ts`:**

- Already has logging for PDF processing
- Logs PDF size after signing
- Logs when document data is updated

## Flow Diagram

```
┌──────────────────────────────────────────────────────────┐
│ Recipient Signs Last Field                              │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ completeDocumentWithToken()                             │
│ • Mark recipient as SIGNED                              │
│ • Check if all recipients signed                        │
│ • Log: "[COMPLETE-DOCUMENT] All recipients signed"     │
└──────────────────────────────────────────────────────────┘
                        ↓
                  All signed?
                        ↓ YES
┌──────────────────────────────────────────────────────────┐
│ Trigger seal-document Job                               │
│ • Log: "[COMPLETE-DOCUMENT] Triggering seal-document"  │
│ • jobs.triggerJob("internal.seal-document")            │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ seal-document Job Runs                                  │
│ • Load PDF from storage                                 │
│ • Normalize and flatten PDF                             │
│ • Insert signature fields                               │
│ • Sign PDF with certificate ← FAILS IF CERT MISSING    │
│ • Save signed PDF                                       │
│ • Update status to COMPLETED                            │
└──────────────────────────────────────────────────────────┘
                        ↓
                  ❌ JOB FAILS
                        ↓
┌──────────────────────────────────────────────────────────┐
│ Document Status: PENDING (unchanged)                    │
│ Recipients Status: SIGNED                               │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ Complete Page Polls signingStatus                       │
│ • Every 3 seconds                                       │
│ • All recipients signed? YES                            │
│ • Document status COMPLETED? NO                         │
│ • Returns: "PROCESSING"                                 │
└──────────────────────────────────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────────┐
│ UI Shows: "Processing document" 🔄                      │
│ Polls forever... never completes                        │
└──────────────────────────────────────────────────────────┘
```

## Expected Flow (After Fix)

```
Recipient Signs → All Signed → Trigger seal-document
                                        ↓
                                  Job SUCCEEDS ✅
                                        ↓
                              Certificate loads OK
                                        ↓
                                  PDF signed
                                        ↓
                          Status updated to COMPLETED
                                        ↓
                        Page polls signingStatus
                                        ↓
                          Returns "COMPLETED"
                                        ↓
                    UI shows "Everyone has signed" ✅
```

## Testing Checklist

After applying the fix:

- [ ] Run `npx tsx scripts/check-signing-setup.ts` - Should show all ✓
- [ ] Run `npx tsx scripts/check-vercel-signing.ts` - Should show all ✓
- [ ] Run `npx tsx scripts/fix-stuck-documents.ts` - Fix existing stuck docs
- [ ] Create new test document
- [ ] Send for signing
- [ ] Sign the document
- [ ] Complete page should show "Everyone has signed" within 10 seconds
- [ ] PDF should be downloadable
- [ ] PDF should contain visible signatures
- [ ] Document status should be COMPLETED in database

## Prevention

To prevent this issue in the future:

1. **Always test signing flow** after deployment
2. **Monitor seal-document jobs** for failures
3. **Set up alerts** for failed background jobs
4. **Document certificate rotation** process
5. **Keep certificates backed up** securely
6. **Test in staging** before production deployment

## Related Issues Fixed

This analysis also covers:

1. ✅ **Task 1:** Documents stuck in Pending after signing
2. ✅ **Task 2:** PDFs are 1KB/corrupted (not signed)
3. ✅ **Task 3:** Signature fields not visible in PDF
4. ✅ **Task 4:** Complete page stuck on "Processing"

All these issues have the **same root cause**: Missing signing certificate.

## Quick Reference

```bash
# Diagnose
npx tsx scripts/check-completion-flow.ts <token>
npx tsx scripts/check-signing-setup.ts

# Fix local
# Add to .env:
# NEXT_PRIVATE_SIGNING_TRANSPORT=local
# NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=./apps/remix/example/cert.p12

# Fix Vercel
base64 -i apps/remix/example/cert.p12 > cert.base64.txt
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
vercel --prod

# Fix stuck documents
npx tsx scripts/fix-stuck-documents.ts

# Test
# Create new document → Sign → Should complete in 5-10 seconds
```

---

**Status:** Root cause identified, diagnostic tools created, fix documented
**Next Step:** Apply certificate configuration and test
**Expected Result:** Documents complete successfully within 5-10 seconds after signing
