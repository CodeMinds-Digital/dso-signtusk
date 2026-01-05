# Quick Fix: Stuck "Processing document" Page

## 🔴 Problem

After signing, the page shows "Processing document" and never completes.

## ⚡ Quick Diagnosis (30 seconds)

```bash
# Replace <token> with the token from your stuck URL
# Example: St3TgPEP-AjfQZQoAYjWZ
npx tsx scripts/check-completion-flow.ts <token>
```

This will tell you exactly what's wrong.

## 🛠️ Quick Fix (5 minutes)

### If Certificate is Missing

**Local Development:**

1. Add to `.env`:

   ```env
   NEXT_PRIVATE_SIGNING_TRANSPORT=local
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=./apps/remix/example/cert.p12
   NEXT_PRIVATE_SIGNING_PASSPHRASE=
   ```

2. Restart server

**Production (Vercel):**

```bash
# 1. Convert certificate
base64 -i apps/remix/example/cert.p12 > cert.base64.txt

# 2. Add to Vercel
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
# Paste content from cert.base64.txt

vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
# Press Enter (empty)

vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
# Type: local

# 3. Redeploy
vercel --prod
```

### Fix Stuck Documents

```bash
npx tsx scripts/fix-stuck-documents.ts
```

## 📊 What's Happening

```
Recipient signs → All signed → Trigger seal-document job
                                        ↓
                                   Job FAILS (no certificate)
                                        ↓
                              Document stays PENDING
                                        ↓
                            Page shows "Processing" forever
```

## ✅ Verify Fix

```bash
# Check setup
npx tsx scripts/check-signing-setup.ts

# Test with stuck document
npx tsx scripts/test-seal-document.ts <token>

# Create new document and test
```

## 📚 Detailed Guides

- `COMPLETION_FLOW_STUCK.md` - Full diagnostic guide
- `COMPLETION_FLOW_COMPARISON.md` - Code comparison
- `VERCEL_SETUP_COMPLETE.md` - Certificate setup
- `ADD_CERT_TO_VERCEL.md` - Step-by-step Vercel guide

## 🆘 Still Stuck?

```bash
# Full diagnostic
npx tsx scripts/debug-signing-issue.ts <envelope-id>

# Check logs
vercel logs --follow

# Check Vercel env vars
npx tsx scripts/check-vercel-signing.ts
```

---

**TL;DR:** The seal-document job is failing because the signing certificate is missing. Add it to your environment variables and redeploy.
