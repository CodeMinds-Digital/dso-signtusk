# 🎉 GREAT NEWS + Certificate Fix Needed

## ✅ MAJOR SUCCESS: Native Module Working!

The logs show the native module is now loading successfully:

```
[SEAL-DOCUMENT] PDF loaded successfully, pages: 1
[SEAL-DOCUMENT] PDF saved, size: 15448 bytes
```

**This means:**

- ✅ Docker cache was cleared
- ✅ Native module was compiled
- ✅ PDF decoration is working
- ✅ Signature fields are being inserted

## ❌ Certificate Issue

The signing step is failing:

```
Error: Failed to get private key bags
at signWithLocalCert
```

This error means the certificate can't be read. Possible causes:

1. Environment variable has incorrect base64 encoding
2. Passphrase is wrong
3. Certificate format issue

## 🔧 Quick Fix Options

### Option 1: Use File Path Instead (Easiest)

Since you have the certificate at `apps/remix/example/cert.p12` and the Dockerfile now copies it, let's use the file path:

**In Dokploy, update environment variables:**

1. **Remove or comment out:**
   - `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS`

2. **Add:**

   ```
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/app/apps/remix/example/cert.p12
   NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit
   ```

   (Replace `changeit` with your actual passphrase)

3. **Redeploy**

### Option 2: Fix Base64 Encoding

The base64 encoding might have newlines or be corrupted.

**Re-encode the certificate:**

```bash
# On your local machine
base64 -i apps/remix/example/cert.p12 | tr -d '\n' > cert-clean.base64.txt

# Copy the output
cat cert-clean.base64.txt

# Update NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS in Dokploy with this value
```

### Option 3: Verify Passphrase

Test the certificate locally:

```bash
# Test with your passphrase
openssl pkcs12 -in apps/remix/example/cert.p12 -noout -passin pass:YOUR_PASSPHRASE

# If it works, you'll see no errors
# If it fails, you'll see "Mac verify error: invalid password?"
```

## 🎯 Recommended Solution

**Use Option 1 (File Path)** - It's simpler and the file is already in the Docker image.

### Steps:

1. **Go to Dokploy Dashboard**
2. **Navigate to Environment Variables**
3. **Update these variables:**

   ```
   # Remove or set to empty:
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=

   # Add these:
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/app/apps/remix/example/cert.p12
   NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit
   NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=local
   ```

4. **Click Save**
5. **Redeploy** (should be quick, just restart)

## 📊 Expected Results

After fixing the certificate:

```
✅ [SEAL-DOCUMENT] PDF loaded successfully
✅ [SEAL-DOCUMENT] PDF saved, size: 15448 bytes
✅ [SEAL-DOCUMENT] PDF signed successfully  ← NEW!
✅ [SEAL-DOCUMENT] Status updated to COMPLETED  ← NEW!
✅ Document completed!  ← NEW!
```

## 🔍 Verification

### Check Certificate File Exists in Container

```bash
# SSH into Dokploy server
docker exec -it <container-id> ls -la /app/apps/remix/example/cert.p12

# Should show the file
```

### Check Environment Variables

```bash
# Check path is set
docker exec -it <container-id> sh -c 'echo $NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH'

# Should show: /app/apps/remix/example/cert.p12

# Check passphrase is set
docker exec -it <container-id> sh -c 'echo $NEXT_PRIVATE_SIGNING_PASSPHRASE'

# Should show your passphrase
```

### Test Certificate in Container

```bash
# Test reading the certificate
docker exec -it <container-id> sh -c 'ls -la /app/apps/remix/example/cert.p12 && echo "File exists!"'
```

## 🐛 If Still Failing

### Add Debug Logging

Update `packages/signing/transports/local-cert.ts` to add logging:

```typescript
if (localFileContents) {
  try {
    console.log(
      "[CERT] Loading from environment variable, length:",
      localFileContents.length
    );
    cert = Buffer.from(localFileContents, "base64");
    console.log("[CERT] Decoded successfully, buffer size:", cert.length);
  } catch (error) {
    console.error("[CERT] Failed to decode:", error);
    throw new Error("Failed to decode certificate contents");
  }
}

if (!cert) {
  let certPath =
    env("NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH") || "/opt/documenso/cert.p12";

  if (env("NODE_ENV") !== "production") {
    certPath =
      env("NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH") || "./example/cert.p12";
  }

  console.log("[CERT] Loading from file:", certPath);

  try {
    cert = Buffer.from(fs.readFileSync(certPath));
    console.log("[CERT] File read successfully, buffer size:", cert.length);
  } catch (error) {
    console.error("[CERT] Failed to read file:", error);
    throw new Error("Document signing failed: Certificate file not accessible");
  }
}

console.log(
  "[CERT] Attempting to sign with passphrase length:",
  env("NEXT_PRIVATE_SIGNING_PASSPHRASE")?.length || 0
);

const signature = signWithP12({
  cert,
  content: pdfWithoutSignature,
  password: env("NEXT_PRIVATE_SIGNING_PASSPHRASE") || undefined,
});
```

This will help identify exactly where the issue is.

## 📝 Summary

**Status:** 90% Complete! 🎉

**What's Working:**

- ✅ Native module loads
- ✅ PDF decoration works
- ✅ Signature fields inserted

**What Needs Fixing:**

- ❌ Certificate loading/signing

**Next Step:**
Switch to file-based certificate path and redeploy.

**Time to Fix:** 5 minutes

---

## Quick Commands

```bash
# In Dokploy, set these environment variables:
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/app/apps/remix/example/cert.p12
NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit
NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=local

# Remove or clear:
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=

# Then redeploy
```

You're SO close! Just need to fix the certificate loading! 🚀
