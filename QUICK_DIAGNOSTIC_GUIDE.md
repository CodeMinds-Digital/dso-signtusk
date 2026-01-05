# Quick Diagnostic Guide - Stuck Completion Page

## 🚨 Symptom

Page stuck on "Processing document" after signing.

## ⚡ 30-Second Diagnosis

```bash
npx tsx scripts/check-completion-flow.ts <your-token>
```

Replace `<your-token>` with the token from your stuck URL.

Example: If URL is `https://www.signtusk.com/sign/St3TgPEP-AjfQZQoAYjWZ/complete`
Then token is: `St3TgPEP-AjfQZQoAYjWZ`

## 📊 What You'll See

### ✅ If Everything is OK

```
✅ All recipients signed: YES
✅ Document status: COMPLETED
✅ seal-document job: COMPLETED
```

**Action:** None needed, document is complete.

### ⚠️ If Certificate is Missing

```
✅ All recipients signed: YES
❌ Document status: PENDING
❌ seal-document job: FAILED
   Error: Certificate file not found
```

**Action:** Follow "Fix Certificate" below.

### ⚠️ If Job Never Ran

```
✅ All recipients signed: YES
❌ Document status: PENDING
❌ No seal-document jobs found
```

**Action:** Job was never triggered. Check logs and manually trigger.

## 🔧 Fix Certificate

### Local Development

1. Add to `.env`:

   ```env
   NEXT_PRIVATE_SIGNING_TRANSPORT=local
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=./apps/remix/example/cert.p12
   NEXT_PRIVATE_SIGNING_PASSPHRASE=
   ```

2. Restart server

### Production (Vercel)

```bash
# 1. Prepare certificate
base64 -i apps/remix/example/cert.p12 > cert.base64.txt

# 2. Add to Vercel (paste content when prompted)
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production

# 3. Redeploy
vercel --prod
```

## 🔄 Fix Stuck Documents

After fixing certificate:

```bash
npx tsx scripts/fix-stuck-documents.ts
```

This will re-process all stuck documents.

## ✅ Verify Fix

```bash
# Check setup
npx tsx scripts/check-signing-setup.ts

# Should show:
# ✓ NEXT_PRIVATE_SIGNING_TRANSPORT: local
# ✓ NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH: ./apps/remix/example/cert.p12
# ✓ Certificate file exists
```

## 🧪 Test

1. Create new document
2. Send for signing
3. Sign it
4. Should complete in 5-10 seconds
5. Should show "Everyone has signed"

## 📚 Detailed Guides

| Guide                         | When to Use         |
| ----------------------------- | ------------------- |
| `FIX_STUCK_COMPLETION.md`     | Quick fix guide     |
| `COMPLETION_FLOW_STUCK.md`    | Detailed diagnostic |
| `COMPLETION_ISSUE_SUMMARY.md` | Complete analysis   |
| `VERCEL_SETUP_COMPLETE.md`    | Certificate setup   |

## 🆘 Still Stuck?

```bash
# Full diagnostic
npx tsx scripts/debug-signing-issue.ts <envelope-id>

# Check logs
vercel logs --follow

# Check all scripts
ls -la scripts/*.ts
```

## 📞 All Diagnostic Commands

```bash
# Check completion flow (use token from URL)
npx tsx scripts/check-completion-flow.ts <token>

# Check certificate setup
npx tsx scripts/check-signing-setup.ts

# Check Vercel environment
npx tsx scripts/check-vercel-signing.ts

# Fix stuck documents
npx tsx scripts/fix-stuck-documents.ts

# Test seal-document manually
npx tsx scripts/test-seal-document.ts <token>

# Full diagnostic
npx tsx scripts/debug-signing-issue.ts <envelope-id>
```

---

**TL;DR:**

1. Run `npx tsx scripts/check-completion-flow.ts <token>`
2. If certificate missing, add to `.env` and Vercel
3. Run `npx tsx scripts/fix-stuck-documents.ts`
4. Test with new document
