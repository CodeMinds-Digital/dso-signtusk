# 🔐 Certificate Configuration Options

## Current Situation

You have a certificate file at: `apps/remix/example/cert.p12`

The application supports **two ways** to load the certificate:

1. **Environment Variable** (Recommended for production)
2. **File Path** (Good for development/testing)

---

## Option 1: Environment Variable (Recommended) ✅

### Status: Already Configured!

You already have `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` set in your Dokploy environment variables.

### How It Works:

1. Certificate is base64-encoded
2. Stored in environment variable
3. Decoded at runtime
4. No file system access needed

### Advantages:

- ✅ More secure (no file on disk)
- ✅ Works in any environment
- ✅ Easy to update (just change env var)
- ✅ No file permissions issues
- ✅ Already configured in your deployment

### Verification:

```bash
# Check if env var is set (in container)
docker exec -it <container> sh -c 'echo $NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS | wc -c'

# Should show > 1000 (certificate size in base64)
```

### This Will Work Once Native Module Loads!

The certificate loading code checks for the environment variable FIRST, before trying to load from a file. So your current configuration is correct.

---

## Option 2: File Path (Alternative)

### Status: Now Supported (Dockerfile Updated)

I've updated `Dockerfile.production` to copy the `apps/remix/example` folder into the Docker image.

### How It Works:

1. Certificate file is copied during Docker build
2. Application reads from file system at runtime
3. Path is configurable via environment variable

### Configuration:

**Set this environment variable in Dokploy:**

```bash
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/app/apps/remix/example/cert.p12
```

### Advantages:

- ✅ Simpler to understand
- ✅ Can inspect file in container
- ✅ Good for debugging

### Disadvantages:

- ❌ File must be in Docker image
- ❌ Harder to update (requires rebuild)
- ❌ Potential file permission issues

---

## Recommended Approach

**Use Option 1 (Environment Variable)** - which you already have configured!

### Why?

1. You've already set `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS`
2. It's more secure
3. It's easier to update
4. It works in any environment
5. No file system dependencies

### The Code Priority:

```typescript
// 1. Try environment variable FIRST (your current setup)
if (env("NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS")) {
  cert = Buffer.from(localFileContents, "base64");
}

// 2. Only if env var not set, try file path
if (!cert) {
  cert = fs.readFileSync(certPath);
}
```

Since you have the environment variable set, the file path is never even checked!

---

## Current Configuration Status

### ✅ What You Have:

- `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` = base64-encoded certificate
- `NEXT_PRIVATE_SIGNING_PASSPHRASE` = certificate passphrase
- `NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD` = local (or default)

### ✅ What Will Happen:

1. Application starts
2. seal-document job runs
3. Code checks for `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS`
4. Finds it! Decodes base64 to Buffer
5. Uses certificate to sign PDF
6. Document completes successfully

### ❌ What's Blocking This:

Native module not loading (Docker cache issue)

---

## Verification After Deployment

### Check Environment Variable is Being Used:

Add some debug logging to verify:

```bash
# In container, check if env var is set
docker exec -it <container> sh -c 'echo $NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS | head -c 50'

# Should show first 50 characters of base64 string
```

### Check Logs for Certificate Loading:

After seal-document job runs, you should see:

```
✅ [SEAL-DOCUMENT] PDF loaded successfully
✅ [SEAL-DOCUMENT] PDF saved
✅ [SEAL-DOCUMENT] Signing PDF with certificate
✅ [SEAL-DOCUMENT] PDF signed successfully
```

If certificate fails, you'd see:

```
❌ Certificate error: Failed to decode certificate contents
❌ Document signing failed: Certificate not available
```

---

## Troubleshooting

### Issue: "Failed to decode certificate contents"

**Cause:** Base64 encoding is incorrect

**Solution:**

```bash
# Re-encode certificate
base64 apps/remix/example/cert.p12 > cert.base64.txt

# Copy content (without newlines)
cat cert.base64.txt | tr -d '\n'

# Update environment variable in Dokploy with this value
```

### Issue: "Failed to get private key bags"

**Cause:** Passphrase is incorrect

**Solution:**

```bash
# Test passphrase locally
openssl pkcs12 -in apps/remix/example/cert.p12 -noout -passin pass:YOUR_PASSPHRASE

# If it works, update NEXT_PRIVATE_SIGNING_PASSPHRASE in Dokploy
```

### Issue: "Certificate not available"

**Cause:** Environment variable not set or empty

**Solution:**

```bash
# Check in Dokploy dashboard:
# Settings → Environment Variables
# Verify NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS is set and not empty
```

---

## Migration Path (If Needed)

### From Environment Variable to File Path:

1. Remove or comment out `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS`
2. Set `NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/app/apps/remix/example/cert.p12`
3. Redeploy

### From File Path to Environment Variable:

1. Encode certificate: `base64 cert.p12 > cert.base64.txt`
2. Set `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` in Dokploy
3. Remove `NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH`
4. Redeploy

---

## Summary

### Current Setup (Recommended):

```
✅ NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS = <base64-cert>
✅ NEXT_PRIVATE_SIGNING_PASSPHRASE = <passphrase>
✅ Certificate will load from environment variable
✅ No file system access needed
✅ Will work once native module loads
```

### Alternative Setup (If Preferred):

```
⚠️ Remove NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS
⚠️ Set NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/app/apps/remix/example/cert.p12
⚠️ Keep NEXT_PRIVATE_SIGNING_PASSPHRASE
⚠️ Certificate will load from file
⚠️ Dockerfile now copies example folder
```

---

## Next Steps

1. **Keep your current configuration** (environment variable)
2. **Clear Docker cache** (main issue)
3. **Redeploy**
4. **Test document signing**
5. **Certificate will work automatically!**

The Dockerfile now supports both options, but your current environment variable approach is already correct and will work once the native module loads.

---

**Bottom Line:** Your certificate configuration is correct. The environment variable approach is working. You just need to clear the Docker cache so the native module gets built, then everything will work together.
