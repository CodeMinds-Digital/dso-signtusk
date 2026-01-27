# 🎉 ALMOST THERE! Certificate Setup Required

## Current Status

✅ **Native module** - WORKING  
✅ **Fonts** - WORKING (PDF decoration successful)  
❌ **Certificate** - MISSING (PDF signing fails)  
⚠️ **Emails** - React rendering issue (separate problem)

---

## What the Logs Show

### ✅ Success: PDF Decoration

```
[SEAL-DOCUMENT] PDF loaded successfully, pages: 1
[SEAL-DOCUMENT] PDF saved, size: 15467 bytes
```

The PDF grew from 2115 to 15467 bytes - **fields were successfully inserted!**

### ❌ Failure: PDF Signing

```
Error: Failed to get private key bags
at signWithLocalCert
```

The job fails at the **final step** - signing the PDF with a certificate.

---

## Why Certificate is Missing

At startup, you see:

```
⚠️  Certificate not found or not readable at: /opt/signtusk/cert.p12
💡 Tip: document signing will be unavailable
```

The application expects a certificate file at `/opt/signtusk/cert.p12` but it's not there.

---

## 🔧 Solution: Add Certificate

### Option 1: Generate Self-Signed Certificate (Quick Test)

For testing purposes, generate a self-signed certificate:

```bash
# Generate a self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=signtusk.local"

# Convert to PKCS12 format
openssl pkcs12 -export -out cert.p12 -inkey key.pem -in cert.pem -passout pass:changeit

# Encode to base64 for environment variable
base64 cert.p12 > cert.base64.txt
```

### Option 2: Use Existing Certificate

If you have a certificate from a CA:

```bash
# Convert to base64
base64 your-cert.p12 > cert.base64.txt
```

### Option 3: Mount Certificate in Dokploy

1. **Upload certificate to Dokploy server:**

   ```bash
   scp cert.p12 user@dokploy-server:/opt/signtusk/cert.p12
   ```

2. **Add volume mount in Dokploy:**
   - Go to your app in Dokploy
   - Find "Volumes" or "Mounts" section
   - Add mount:
     - Host path: `/opt/signtusk/cert.p12`
     - Container path: `/opt/signtusk/cert.p12`

3. **Set environment variable:**
   ```
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/opt/signtusk/cert.p12
   NEXT_PRIVATE_SIGNING_PASSPHRASE=your-passphrase
   ```

### Option 4: Use Environment Variable (RECOMMENDED)

Store the certificate as a base64-encoded environment variable:

1. **Encode certificate:**

   ```bash
   base64 cert.p12 > cert.base64.txt
   cat cert.base64.txt
   ```

2. **Add to Dokploy environment variables:**

   ```
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<paste base64 content>
   NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit
   ```

3. **Redeploy**

---

## 🚀 Quick Start: Generate and Deploy Certificate

### Step 1: Generate Certificate Locally

```bash
# Generate self-signed cert
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=US/ST=California/L=San Francisco/O=Signtusk/CN=signtusk.local"

# Convert to PKCS12
openssl pkcs12 -export -out cert.p12 -inkey key.pem -in cert.pem -passout pass:changeit

# Encode to base64
base64 cert.p12 > cert.base64.txt

# Display (copy this)
cat cert.base64.txt
```

### Step 2: Add to Dokploy

1. Go to Dokploy Dashboard
2. Find your app → Environment Variables
3. Add these variables:

   ```
   NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<paste base64 from cert.base64.txt>
   NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit
   NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=local
   ```

4. Click "Save" and "Redeploy"

### Step 3: Verify

After deployment, check logs for:

```
✅ Certificate loaded successfully
```

Instead of:

```
⚠️  Certificate not found
```

### Step 4: Test Document Signing

1. Create document
2. Add recipient
3. Send and sign
4. Check logs for:

```
✅ [SEAL-DOCUMENT] PDF signed successfully
✅ [SEAL-DOCUMENT] Status updated to COMPLETED
```

---

## 📊 Expected Results

### Before (Current):

```
✅ [SEAL-DOCUMENT] PDF loaded successfully
✅ [SEAL-DOCUMENT] PDF saved (fields inserted)
❌ Error: Failed to get private key bags
```

### After (With Certificate):

```
✅ [SEAL-DOCUMENT] PDF loaded successfully
✅ [SEAL-DOCUMENT] PDF saved (fields inserted)
✅ [SEAL-DOCUMENT] PDF signed successfully
✅ [SEAL-DOCUMENT] Status updated to COMPLETED
✅ Document completed!
```

---

## 🔍 Environment Variables Reference

### Required for Certificate:

```bash
# Method 1: File path (if mounted)
NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH=/opt/signtusk/cert.p12
NEXT_PRIVATE_SIGNING_PASSPHRASE=your-passphrase

# Method 2: Base64 content (RECOMMENDED)
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<base64-encoded-cert>
NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit

# Transport method
NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=local
```

### Optional (for production):

```bash
# Use external signing service
NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=documenso
NEXT_PRIVATE_SIGNING_DOCUMENSO_API_KEY=your-api-key
```

---

## 🆘 Other Issues (Lower Priority)

### Issue 1: Email Rendering

The React email rendering error won't block document completion, but emails won't be sent.

**Error:**

```
TypeError: Cannot read properties of null (reading 'useRef')
at I18nProvider
```

**Cause:** React hooks not properly initialized in server-side email rendering.

**Fix (if needed later):**
Check `packages/email/render.js` and ensure React context is initialized before rendering.

### Issue 2: Email Validation

```
"validation": "email",
"message": "Invalid email"
```

**Cause:** Organization email settings have an invalid email.

**Fix:** Check organization settings and update email to valid format.

---

## 📝 Summary

**What's Fixed:**

- ✅ Native module (seal-document runs)
- ✅ Fonts (PDF decoration works)

**What Needs Fixing:**

- ❌ Certificate (PDF signing fails)
- ⚠️ Emails (won't be sent, but doesn't block completion)

**Next Step:**
Add certificate via environment variable and redeploy.

**Confidence:** 99% that adding the certificate will complete the fix!

---

## 🎯 Quick Commands

```bash
# Generate certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes \
  -subj "/C=US/ST=CA/L=SF/O=Signtusk/CN=signtusk.local"

openssl pkcs12 -export -out cert.p12 -inkey key.pem -in cert.pem -passout pass:changeit

base64 cert.p12 > cert.base64.txt

# Copy output
cat cert.base64.txt

# Add to Dokploy env vars:
# NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<paste>
# NEXT_PRIVATE_SIGNING_PASSPHRASE=changeit
# NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=local

# Redeploy and test!
```

You're SO close! Just need the certificate now! 🚀
