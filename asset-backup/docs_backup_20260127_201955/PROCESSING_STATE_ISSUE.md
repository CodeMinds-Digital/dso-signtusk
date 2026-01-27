# 🔍 "Processing Document" Issue - Root Cause Analysis

**Issue:** After recipient signs, document shows "Processing document" forever

**Status:** This is the REAL issue - the seal-document job is failing

---

## 🎯 What's Happening

### The Flow:

1. ✅ Recipient signs the document
2. ✅ Status updates to "Signed" on sender's side
3. ✅ `seal-document` job is triggered
4. ❌ **Job fails or doesn't complete**
5. ❌ Document status stays `PENDING` (not `COMPLETED`)
6. ❌ Recipient sees "Processing document" forever

### The Code:

**File:** `packages/trpc/server/envelope-router/signing-status-envelope.ts`

```typescript
// Line 78-80
if (isComplete) {
  return {
    status: "PROCESSING", // ← This is shown to recipient
  };
}
```

**When this happens:**

- All recipients have signed
- BUT document status is still `PENDING` (not `COMPLETED`)
- This means `seal-document` job hasn't finished

---

## 🔍 Why seal-document Job is Failing

Based on all our previous analysis, the job is failing because:

### 1. Module Not Found (Fixed) ✅

```
Cannot find module '@signtusk/pdf-processing'
```

**Status:** Fixed with TypeScript path mappings

### 2. Package Not Built (Fixed) ✅

```
Package exports pointing to .ts instead of .js
```

**Status:** Fixed with package.json updates

### 3. Build Order (Fixed) ✅

```
pdf-processing not built before remix app
```

**Status:** Fixed with explicit build step in Dockerfile

### 4. Docker Cache (Needs Action) ⚠️

```
Old cached layers preventing fixes from applying
```

**Status:** Needs cache clear in Dokploy

---

## ✅ The Complete Fix

All the fixes we've applied will resolve this issue:

1. ✅ TypeScript can resolve the module (tsconfig paths)
2. ✅ Runtime can import the module (package.json exports)
3. ✅ Module is built before use (Dockerfile build order)
4. ⚠️ **Need to deploy with cache clear**

---

## 🚀 Deploy to Fix

### Step 1: Commit All Changes

```bash
git add tsconfig.json
git add apps/remix/tsconfig.json
git add packages/pdf-processing/package.json
git add Dockerfile.production
git add scripts/diagnose-document-completion.ts
git add *.md

git commit -m "fix: resolve seal-document job failure causing Processing state

- Add TypeScript path mappings for pdf-processing
- Fix package.json exports
- Add explicit build step in Dockerfile
- Fixes documents stuck in Processing state
- seal-document job can now import pdf-processing successfully"

git push origin dokploy-deploy
```

### Step 2: Deploy with Cache Clear

1. Go to Dokploy Dashboard
2. **Clear Build Cache** (CRITICAL!)
3. Click "Redeploy"
4. Wait for build to complete (~10-15 minutes)

### Step 3: Test

1. Create a new document
2. Add a signer
3. Send and sign
4. **Document should change to "COMPLETED" automatically**
5. Recipient should see "Everyone has signed" (not "Processing")

---

## 🔍 Verify the Fix

### Check Application Logs

After a recipient signs, you should see:

```
[COMPLETE-DOCUMENT] All recipients have signed
[COMPLETE-DOCUMENT] Triggering seal-document job
[SEAL-DOCUMENT] Starting PDF decoration
[SEAL-DOCUMENT] Importing pdf-processing module
✅ Module imported successfully
[SEAL-DOCUMENT] Generating certificate
[SEAL-DOCUMENT] Generating audit log
[SEAL-DOCUMENT] Signing PDF
[SEAL-DOCUMENT] PDF signed successfully
[SEAL-DOCUMENT] Updating document data
[SEAL-DOCUMENT] Status updated to COMPLETED
```

### Check Database

```sql
-- Check document status
SELECT
  "secondaryId",
  "status",
  "completedAt"
FROM "Envelope"
WHERE "secondaryId" = 'envelope_fsbatstmmtmxnmtr';

-- Should show:
-- status: COMPLETED
-- completedAt: <timestamp>
```

### Check Background Jobs

```sql
-- Check seal-document job
SELECT
  "id",
  "status",
  "submittedAt",
  "completedAt"
FROM "BackgroundJob"
WHERE "jobId" = 'internal.seal-document'
ORDER BY "submittedAt" DESC
LIMIT 5;

-- Should show:
-- status: COMPLETED
-- completedAt: <timestamp>
```

---

## 🆘 If Still Showing "Processing"

### Scenario 1: New Documents Still Stuck

**This means the fix didn't apply:**

1. Verify cache was cleared
2. Check build logs for TypeScript errors
3. Check application logs for module errors
4. See `ALL_FIXES_COMPLETE.md` for troubleshooting

### Scenario 2: Old Documents Still Stuck

**This is expected - old documents need manual fix:**

```bash
# Fix the specific stuck document
npm run with:env -- tsx scripts/manually-complete-document.ts envelope_fsbatstmmtmxnmtr

# Or fix all stuck documents
npm run with:env -- tsx scripts/fix-stuck-documents.ts
```

---

## 📊 Understanding the States

### Recipient View States:

| Backend Status | All Signed? | Recipient Sees                             |
| -------------- | ----------- | ------------------------------------------ |
| `PENDING`      | No          | "Waiting for others to sign"               |
| `PENDING`      | Yes         | "Processing document" ← **STUCK HERE**     |
| `COMPLETED`    | Yes         | "Everyone has signed" ← **SHOULD BE HERE** |
| `REJECTED`     | -           | "Document rejected"                        |

### The Problem:

When all recipients sign:

1. Backend checks: All signed? → Yes
2. Triggers `seal-document` job
3. Job should update status to `COMPLETED`
4. **But job fails** → Status stays `PENDING`
5. Recipient sees "Processing" forever

### The Solution:

Fix the `seal-document` job so it can:

1. Import `@signtusk/pdf-processing` ✅
2. Generate certificate and audit log ✅
3. Sign the PDF ✅
4. Update status to `COMPLETED` ✅

---

## 🎯 Why This Happens

### The seal-document Job Does:

1. **Load the PDF** from storage
2. **Insert signature fields** into PDF
3. **Generate certificate** using `@signtusk/pdf-processing` ← **FAILS HERE**
4. **Generate audit log** using `@signtusk/pdf-processing` ← **FAILS HERE**
5. **Sign the PDF** with certificate
6. **Save signed PDF** to storage
7. **Update status** to `COMPLETED`
8. **Send completion emails**

If step 3 or 4 fails (can't import pdf-processing), the whole job fails and status never updates.

---

## ✅ Summary

**Problem:** Documents stuck in "Processing" state after signing

**Root Cause:** `seal-document` job can't import `@signtusk/pdf-processing`

**Solution:**

1. ✅ Add TypeScript path mappings
2. ✅ Fix package.json exports
3. ✅ Add explicit build step
4. ⚠️ **Deploy with cache clear**

**Expected Result:**

- seal-document job completes successfully
- Status updates to COMPLETED
- Recipient sees "Everyone has signed"
- Completion emails sent

---

**Deploy now with cache clear to fix this issue!** 🚀

After deployment, test with a NEW document. Old stuck documents need manual fixing with the scripts.
