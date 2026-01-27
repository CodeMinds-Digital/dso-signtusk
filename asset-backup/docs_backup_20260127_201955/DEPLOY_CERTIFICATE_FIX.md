# 🚀 Deploy Certificate Fix - Action Required

## ✅ What's Been Fixed

1. **Native module compilation** - Working ✅
2. **Font files** - Working ✅
3. **PDF decoration** - Working ✅
4. **Debug logging added** - Ready to deploy ✅

## ❌ Current Issue

Certificate signing fails with:

```
Error: Failed to get private key bags
```

This means the certificate can't be read properly. The issue is either:

- Base64 encoding is corrupted
- Passphrase is incorrect
- Certificate format issue

## 🎯 Solution: Two Options

### Option 1: Use File Path (RECOMMENDED - Simpler)

The certificate file `cert.p12` is already in the Docker image at `/app/apps/remix/example/cert.p12`.

**Steps:**

1. **Go to Dokploy Dashboard** → Your Application → Environment Variables

2. **Remove or clear this variable:**

   ```
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=
   ```

3. **Add/Update these variables:**

   ```
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/app/apps/remix/example/cert.p12
   NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit
   NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=local
   ```

   ⚠️ **IMPORTANT**: Replace `changeit` with your actual certificate passphrase!

4. **Save and Redeploy**

### Option 2: Fix Base64 Encoding

If you prefer to use the environment variable approach:

1. **On your local machine, re-encode the certificate:**

   ```bash
   base64 -i apps/remix/example/cert.p12 | tr -d '\n' > cert-clean.base64.txt
   cat cert-clean.base64.txt
   ```

2. **Copy the output and update in Dokploy:**

   ```
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<paste the clean base64 here>
   NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit
   NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=local
   ```

3. **Remove this variable:**

   ```
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=
   ```

4. **Save and Redeploy**

## 🔍 Verify Passphrase (Important!)

Before deploying, verify your passphrase is correct:

```bash
# Test locally
openssl pkcs12 -in apps/remix/example/cert.p12 -noout -passin pass:YOUR_PASSPHRASE

# If correct: No output (success)
# If wrong: "Mac verify error: invalid password?"
```

## 📊 Expected Results After Fix

With the new debug logging, you'll see:

```
✅ [CERT] Loading from file: /app/apps/remix/example/cert.p12
✅ [CERT] File read successfully, buffer size: 2345
✅ [CERT] Attempting to sign with passphrase: set (length: 8)
✅ [CERT] Signature generated successfully, size: 1234
✅ [CERT] PDF signed successfully, final size: 16789
✅ [SEAL-DOCUMENT] PDF signed successfully
✅ [SEAL-DOCUMENT] Status updated to COMPLETED
✅ Document completed!
```

If it fails, you'll see exactly where:

```
❌ [CERT] Failed to sign with certificate: Error: Failed to get private key bags
```

This will tell us if it's a passphrase issue or certificate format issue.

## 🐛 Troubleshooting

### If you see "Failed to read file"

The file isn't in the Docker image. Verify:

```bash
# SSH into Dokploy server
docker exec -it <container-id> ls -la /app/apps/remix/example/cert.p12
```

Should show the file. If not, the Dockerfile needs to be rebuilt with cache cleared.

### If you see "Failed to get private key bags"

This is a passphrase issue. Double-check:

1. Passphrase is correct (test with openssl command above)
2. Environment variable `NEXT_PRIVATE_SIGNING_PASSPHRASE` is set correctly
3. No extra spaces or quotes in the passphrase

### If you see "Failed to decode"

The base64 encoding is corrupted. Use Option 1 (file path) instead.

## 📝 Deployment Checklist

- [ ] Choose Option 1 (file path) or Option 2 (base64)
- [ ] Verify passphrase with openssl command
- [ ] Update environment variables in Dokploy
- [ ] Remove conflicting variables (if using file path, remove base64 var)
- [ ] Save environment variables
- [ ] Redeploy application
- [ ] Check logs for `[CERT]` debug messages
- [ ] Test document signing workflow
- [ ] Verify document status changes to COMPLETED

## 🎉 Success Indicators

1. **Logs show:**
   - `[CERT] File read successfully` or `[CERT] Decoded successfully`
   - `[CERT] Signature generated successfully`
   - `[CERT] PDF signed successfully`
   - `[SEAL-DOCUMENT] Status updated to COMPLETED`

2. **In the UI:**
   - Document status changes from "Processing" to "Completed"
   - All recipients can download the signed PDF
   - No more stuck documents

## ⏱️ Time to Fix

- **Option 1 (File Path)**: 5 minutes
- **Option 2 (Base64)**: 10 minutes

## 🆘 If Still Failing

Share the logs showing the `[CERT]` debug messages. They will tell us exactly what's wrong:

- Which method is being used (file vs base64)
- If the certificate is being read
- If the passphrase is set
- The exact error from the signing library

---

**Next Step**: Choose your option and update the environment variables in Dokploy! 🚀
