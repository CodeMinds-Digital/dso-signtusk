# Vercel Signing Setup - Action Required

## Critical Issue Identified

Your Vercel production environment is **missing the signing certificate**, which is why documents remain in "Pending" status after signing.

### What's Missing

❌ `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` - Certificate in base64 format
❌ `NEXT_PRIVATE_SIGNING_PASSPHRASE` - Certificate passphrase
⚠️ `NEXT_PRIVATE_SIGNING_TRANSPORT` - Set but has incorrect value

## Quick Fix (5 minutes)

I've prepared everything for you. Just follow these steps:

### Step 1: Copy Certificate to Clipboard

```bash
# macOS
cat ./cert.base64.txt | pbcopy

# Linux
cat ./cert.base64.txt | xclip -selection clipboard

# Windows (Git Bash)
cat ./cert.base64.txt | clip
```

### Step 2: Add to Vercel (Production)

```bash
# Add certificate
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS production
# Paste the certificate from clipboard (Cmd+V or Ctrl+V)

# Add passphrase (just press Enter for empty)
vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE production
# Press Enter (empty for example cert)

# Fix transport value
vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT production
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT production
# Type: local
```

### Step 3: Add to Preview & Development (Optional but Recommended)

```bash
# Preview
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS preview
vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE preview
vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT preview
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT preview

# Development
vercel env add NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS development
vercel env add NEXT_PRIVATE_SIGNING_PASSPHRASE development
vercel env rm NEXT_PRIVATE_SIGNING_TRANSPORT development
vercel env add NEXT_PRIVATE_SIGNING_TRANSPORT development
```

### Step 4: Redeploy

```bash
vercel --prod
```

### Step 5: Verify

```bash
# Check configuration
npx tsx scripts/check-vercel-signing.ts

# Watch logs after deployment
vercel logs --follow
```

## Alternative: Use Vercel Dashboard

If you prefer using the web interface:

1. Go to https://vercel.com/dashboard
2. Select project: `dso-signtusk-remix-vpsy`
3. Go to: **Settings** → **Environment Variables**
4. Add these three variables:

| Variable Name                              | Value                        | Environments                     |
| ------------------------------------------ | ---------------------------- | -------------------------------- |
| `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` | (paste from cert.base64.txt) | Production, Preview, Development |
| `NEXT_PRIVATE_SIGNING_PASSPHRASE`          | (leave empty)                | Production, Preview, Development |
| `NEXT_PRIVATE_SIGNING_TRANSPORT`           | `local`                      | Production, Preview, Development |

5. Click **Save**
6. Go to **Deployments** → Click **...** → **Redeploy**

## What This Fixes

After adding these variables and redeploying:

✅ Documents will complete signing process
✅ Status will change from "Pending" to "Completed"
✅ PDFs will load correctly (not error message)
✅ Downloaded PDFs will be full size (not 1KB)
✅ Signatures will be visible in PDFs

## Testing After Setup

1. **Create a test document** in production
2. **Sign it** as a recipient
3. **Check the status** - should change to "Completed"
4. **View the PDF** - should load without errors
5. **Download the PDF** - should be full size with signatures

## Monitoring

Watch the logs to see the signing process:

```bash
vercel logs --follow
```

Look for these log entries:

```
[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
[SEAL-DOCUMENT] Starting PDF decoration and signing
[SEAL-DOCUMENT] PDF signed, size: XXXXX bytes
[SEAL-DOCUMENT] Document data updated successfully
```

## Security Notes

⚠️ **Important:**

1. **Delete cert.base64.txt after setup:**

   ```bash
   rm cert.base64.txt
   ```

2. **Never commit certificates to git** (already added to .gitignore)

3. **Use production certificate for production** (currently using example cert)

4. **Rotate certificates regularly** (set reminders)

## Files Created

- `cert.base64.txt` - Base64 encoded certificate (DELETE after setup)
- `scripts/setup-vercel-signing.ts` - Automated setup script
- `scripts/check-vercel-signing.ts` - Configuration checker
- `VERCEL_SIGNING_SETUP.md` - Detailed setup guide
- `VERCEL_SETUP_COMPLETE.md` - This file

## Troubleshooting

### Issue: "Failed to add environment variable"

**Solution:** Make sure you're logged in to Vercel:

```bash
vercel login
```

### Issue: "Project not found"

**Solution:** Link the project first:

```bash
vercel link
```

### Issue: Still not working after setup

**Solution:**

1. Verify variables are set: `vercel env ls`
2. Pull and check: `vercel env pull .env.vercel.local`
3. Run checker: `npx tsx scripts/check-vercel-signing.ts`
4. Check logs: `vercel logs --follow`

## Next Steps

1. ✅ Certificate converted to base64 (done)
2. ⏳ Add to Vercel environment variables (do this now)
3. ⏳ Redeploy to production
4. ⏳ Test with a document
5. ⏳ Fix any stuck documents: `npx tsx scripts/fix-stuck-documents.ts`

## Support

If you need help:

1. **Check configuration:** `npx tsx scripts/check-vercel-signing.ts`
2. **Debug issues:** `npx tsx scripts/debug-signing-issue.ts`
3. **View detailed guide:** `VERCEL_SIGNING_SETUP.md`
4. **Check logs:** `vercel logs --follow`

---

**Status:** Ready to deploy
**Action Required:** Add environment variables to Vercel
**Estimated Time:** 5 minutes
**Impact:** Fixes document signing in production
