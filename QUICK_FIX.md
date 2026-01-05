# 🚨 QUICK FIX - Document Signing Issue

## The Problem

Documents stay "Pending" after signing. PDFs are 1KB/corrupted.

## The Cause

Missing signing certificate in Vercel production environment.

## The Fix (5 minutes)

### Step 1: Copy Certificate

```bash
cat ./cert.base64.txt | pbcopy
```

### Step 2: Add to Vercel

```bash
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
# Paste certificate (Cmd+V)

vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
# Press Enter (empty)

vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT production
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
# Type: local
```

### Step 3: Deploy

```bash
vercel --prod
```

### Step 4: Verify

```bash
npx tsx scripts/check-vercel-signing.ts
```

### Step 5: Clean Up

```bash
rm cert.base64.txt
```

## Done!

Test by signing a document in production. It should now complete successfully.

## Need Help?

- **Detailed guide:** `VERCEL_SETUP_COMPLETE.md`
- **Full analysis:** `FINAL_SUMMARY.md`
- **Check setup:** `npx tsx scripts/check-vercel-signing.ts`
- **Debug issues:** `npx tsx scripts/debug-signing-issue.ts`
- **Fix stuck docs:** `npx tsx scripts/fix-stuck-documents.ts`
