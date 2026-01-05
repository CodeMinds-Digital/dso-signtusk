# Simple Checklist - Fix Document Signing

## Understanding (Read First)

- [ ] Read `CERTIFICATE_EXPLAINED.md` to understand what "local" means
- [ ] Understand that "local" works for BOTH development AND production
- [ ] Know that the certificate is already converted to base64 in `cert.base64.txt`

## Adding Certificate to Vercel (Choose One Method)

### Method A: Using Terminal (Faster)

- [ ] Open terminal in project directory
- [ ] Run: `cat cert.base64.txt` (to see the certificate)
- [ ] Run: `vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production`
- [ ] Paste the certificate content when prompted
- [ ] Run: `vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production`
- [ ] Press Enter (leave empty)
- [ ] Run: `vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT production`
- [ ] Run: `vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production`
- [ ] Type: `local`

### Method B: Using Vercel Dashboard (Visual)

- [ ] Run: `cat cert.base64.txt | pbcopy` (copies to clipboard)
- [ ] Go to: https://vercel.com/dashboard
- [ ] Click your project: `dso-signtusk-remix-vpsy`
- [ ] Click: Settings → Environment Variables
- [ ] Add variable:
  - Key: `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS`
  - Value: Paste certificate (Cmd+V)
  - Environments: ✅ All three
- [ ] Add variable:
  - Key: `NEXT_PRIVATE_SIGNING_PASSPHRASE`
  - Value: (leave empty)
  - Environments: ✅ All three
- [ ] Edit existing `NEXT_PRIVATE_SIGNING_TRANSPORT`:
  - Change value to: `local`
  - Environments: ✅ All three

## Deploy & Verify

- [ ] Run: `vercel --prod` (or redeploy from dashboard)
- [ ] Wait for deployment to complete (2-5 minutes)
- [ ] Run: `npx tsx scripts/check-vercel-signing.ts`
- [ ] Verify all checks pass ✅

## Clean Up

- [ ] Run: `rm cert.base64.txt` (delete the certificate file)

## Test

- [ ] Create a test document in production
- [ ] Sign the document
- [ ] Verify status changes to "Completed"
- [ ] Verify PDF loads correctly
- [ ] Verify PDF downloads (not 1KB)

## Fix Stuck Documents (If Any)

- [ ] Run: `npx tsx scripts/debug-signing-issue.ts`
- [ ] If stuck documents found, run: `npx tsx scripts/fix-stuck-documents.ts`

## Done! 🎉

Your document signing should now work in production.

---

## Need Help?

**Detailed instructions:** `ADD_CERT_TO_VERCEL.md`
**Understanding certificates:** `CERTIFICATE_EXPLAINED.md`
**Quick fix:** `QUICK_FIX.md`
**Full analysis:** `FINAL_SUMMARY.md`

**Check configuration:**

```bash
npx tsx scripts/check-vercel-signing.ts
```

**Debug issues:**

```bash
npx tsx scripts/debug-signing-issue.ts
```
