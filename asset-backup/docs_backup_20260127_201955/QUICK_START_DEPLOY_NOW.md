# ⚡ Quick Start - Deploy Now!

## 🎯 What You Need to Do (5 Minutes)

All code fixes are complete. You just need to configure the certificate and deploy.

---

## Step 1: Verify Your Passphrase (1 minute)

Run this command on your local machine:

```bash
openssl pkcs12 -in apps/remix/example/cert.p12 -noout -passin pass:changeit
```

Replace `changeit` with your actual passphrase.

- ✅ **If successful**: No output (passphrase is correct)
- ❌ **If failed**: "Mac verify error: invalid password?" (wrong passphrase)

**Write down your correct passphrase** - you'll need it in Step 2.

---

## Step 2: Update Environment Variables in Dokploy (2 minutes)

### Go to: Dokploy Dashboard → Your Application → Environment Variables

### Add/Update These Variables:

```bash
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/app/apps/remix/example/cert.p12
NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit
NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=local
```

⚠️ **IMPORTANT**: Replace `changeit` with your actual passphrase from Step 1!

### Remove or Clear This Variable:

```bash
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=
```

(Set it to empty or delete it)

### Click "Save"

---

## Step 3: Deploy (2 minutes)

Click the "Redeploy" button in Dokploy.

This should be quick - just a restart, no rebuild needed.

---

## Step 4: Verify (5 minutes)

### Test Document Signing:

1. Create a new document
2. Add a recipient
3. Send for signing
4. Have recipient sign
5. **Check**: Document status should change to "Completed"

### Check Logs:

Look for these success messages:

```
✅ [CERT] Loading from file: /app/apps/remix/example/cert.p12
✅ [CERT] File read successfully
✅ [CERT] Signature generated successfully
✅ [CERT] PDF signed successfully
✅ [SEAL-DOCUMENT] Status updated to COMPLETED
```

### Test Delete:

1. Go to a document
2. Click "Delete" under Actions
3. **Check**: Document should be deleted without errors

---

## 🎉 Success!

If you see:

- ✅ Documents completing (not stuck)
- ✅ Delete button working
- ✅ No errors in logs

**You're done!** All issues are fixed! 🚀

---

## 🐛 If Something Goes Wrong

### Issue: "Failed to get private key bags"

**Most likely**: Wrong passphrase

**Fix**:

1. Go back to Step 1
2. Test different passphrases
3. Update `NEXT_PRIVATE_SIGNING_PASSPHRASE` in Dokploy
4. Redeploy

### Issue: "Failed to read file"

**Most likely**: Docker cache issue

**Fix**:

1. In Dokploy, clear Docker build cache
2. Rebuild (not just redeploy)
3. Wait for build to complete
4. Test again

### Issue: Still stuck

**Share these logs**:

- Any lines starting with `[CERT]`
- Any lines starting with `[SEAL-DOCUMENT]`
- Any error messages

The debug logging will tell us exactly what's wrong!

---

## 📋 Quick Checklist

- [ ] Verified passphrase with openssl (Step 1)
- [ ] Updated environment variables in Dokploy (Step 2)
- [ ] Removed `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` variable
- [ ] Saved environment variables
- [ ] Redeployed application (Step 3)
- [ ] Tested document signing (Step 4)
- [ ] Tested delete functionality (Step 4)
- [ ] Checked logs for success messages (Step 4)

---

## ⏱️ Total Time: ~10 minutes

- Step 1: 1 minute
- Step 2: 2 minutes
- Step 3: 2 minutes
- Step 4: 5 minutes

---

**Ready? Let's do this!** 🚀

Start with Step 1 - verify your passphrase!
