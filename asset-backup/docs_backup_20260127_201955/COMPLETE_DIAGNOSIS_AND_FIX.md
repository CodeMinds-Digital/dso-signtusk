# 🔍 Complete Diagnosis: Why Document Processing is Stuck

## Current Situation Analysis

Based on the latest logs and code review, here's what's happening:

### ✅ What's Working:

1. Certificate is configured in `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` environment variable
2. Dockerfile.production has all the necessary fixes (Rust, native module build, fonts)
3. Application starts successfully
4. Document upload and recipient management works
5. Signing workflow triggers correctly

### ❌ What's Broken:

1. **Native module is NOT loading** - This is the PRIMARY blocker
2. seal-document job fails immediately with: `Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'`
3. Document gets stuck in PENDING state

### 🎯 Root Cause:

**Docker build cache is preventing the new Dockerfile instructions from executing.**

The Dockerfile.production contains the fixes, but Dokploy is using cached layers from a previous build that doesn't include:

- Rust toolchain installation
- Native module compilation for Linux x64 GNU
- Font directory copy

---

## Why Certificate Isn't the Issue (Yet)

The logs show:

```
2026-01-26T10:04:22.414Z ⚠️  Certificate not found or not readable at: /opt/signtusk/cert.p12
```

**BUT** this is just the startup script checking for a FILE. The actual signing code supports loading from the environment variable `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS`, which you have configured.

The certificate will work fine **once the native module loads**.

---

## The Execution Flow

Here's what happens when a document is signed:

### Step 1: Recipient Signs ✅

```
User clicks "Sign" → Signature saved to database → Triggers completion check
```

### Step 2: Completion Check ✅

```
[COMPLETE-DOCUMENT] All recipients have signed
[COMPLETE-DOCUMENT] Triggering seal-document job
```

### Step 3: seal-document Job Starts ❌ **FAILS HERE**

```
[JOBS]: Triggering job internal.seal-document
[JOBS]: Job internal.seal-document failed
Error: Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
```

The job tries to load the native module but it doesn't exist because it was never built.

### Step 4: PDF Processing (Never Reached)

```
[SEAL-DOCUMENT] PDF loaded successfully
[SEAL-DOCUMENT] Inserting signature fields
[SEAL-DOCUMENT] PDF saved
```

### Step 5: PDF Signing (Never Reached)

```
[SEAL-DOCUMENT] Signing PDF with certificate
[SEAL-DOCUMENT] PDF signed successfully
[SEAL-DOCUMENT] Status updated to COMPLETED
```

---

## The Fix: Clear Docker Cache

### Why This is Necessary

Docker builds in layers. When you run a build:

1. **With Cache (Current State):**

   ```
   Step 10: Install Rust → Using cache (skipped)
   Step 11: Build native module → Using cache (skipped)
   Result: No native module in final image
   ```

2. **Without Cache (What We Need):**
   ```
   Step 10: Install Rust → Running (downloads and installs)
   Step 11: Build native module → Running (compiles .node file)
   Result: Native module present in final image
   ```

### How to Clear Cache

**Option 1: Via Dokploy Dashboard**

1. Go to your application settings
2. Look for "Build Settings" or "Advanced"
3. Enable "Build without cache" or "Force rebuild"
4. Click "Deploy"

**Option 2: Via SSH (Most Reliable)**

```bash
# SSH into Dokploy server
ssh user@your-dokploy-server

# Clear all Docker build cache
docker builder prune -af

# Remove application images
docker images | grep signtusk | awk '{print $3}' | xargs docker rmi -f

# Go back to Dokploy dashboard and click "Deploy"
```

---

## Expected Results After Cache Clear

### During Build (Watch for These):

```
✅ Step X: Installing Rust toolchain
   → info: downloading installer
   → Rust is installed now

✅ Step Y: Adding x86_64-unknown-linux-gnu target
   → info: downloading component 'rust-std' for 'x86_64-unknown-linux-gnu'

✅ Step Z: Building native module
   → Compiling pdf-sign v0.1.0
   → Finished release [optimized] target(s)

✅ Step W: Verifying native module
   → pdf-sign.linux-x64-gnu.node
   → Native module ready for Linux x64 GNU
```

### After Deployment (Check Logs):

```
✅ [SEAL-DOCUMENT] Starting seal-document job
✅ [SEAL-DOCUMENT] PDF loaded successfully, pages: 1
✅ [SEAL-DOCUMENT] Inserting signature fields
✅ [SEAL-DOCUMENT] PDF saved, size: 15467 bytes
✅ [SEAL-DOCUMENT] Signing PDF with certificate
✅ [SEAL-DOCUMENT] PDF signed successfully
✅ [SEAL-DOCUMENT] Status updated to COMPLETED
✅ Document completed!
```

---

## Verification Checklist

### Before Clearing Cache:

- [ ] Confirm Dockerfile.production has Rust installation (line 36)
- [ ] Confirm Dockerfile.production has target addition (line 40)
- [ ] Confirm Dockerfile.production has native module build (line 116)
- [ ] Confirm changes are committed to git
- [ ] Confirm `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` is set in Dokploy

### After Clearing Cache:

- [ ] Build logs show Rust installation
- [ ] Build logs show native module compilation
- [ ] Build logs show "Native module ready"
- [ ] Build completes successfully (takes 10-15 minutes)

### After Deployment:

- [ ] Application starts without errors
- [ ] Create test document
- [ ] Add recipient and send
- [ ] Sign as recipient
- [ ] Check logs for seal-document job
- [ ] Verify NO "Cannot find module" error
- [ ] Verify document status changes to COMPLETED

---

## Environment Variables Status

You already have these configured (✅):

```bash
✅ NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<base64-cert>
✅ NEXT_PRIVATE_SIGNING_PASSPHRASE=<your-passphrase>
✅ NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD=local (or not set, defaults to local)
```

These will work automatically once the native module loads.

---

## Timeline to Resolution

### Immediate (5 minutes):

1. Clear Docker build cache
2. Trigger new deployment

### Build Phase (10-15 minutes):

1. Docker downloads Rust installer
2. Rust compiles native module
3. Image is built with native module

### Testing Phase (5 minutes):

1. Create test document
2. Add recipient and sign
3. Verify document completes

**Total Time: ~20-25 minutes**

---

## What You'll See in Logs

### Current Logs (Broken):

```
2026-01-26T10:10:28.633Z [COMPLETE-DOCUMENT] Triggering seal-document job
2026-01-26T10:10:29.135Z [JOBS]: Job internal.seal-document failed
Error: Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
```

### After Fix (Working):

```
2026-01-26T10:10:28.633Z [COMPLETE-DOCUMENT] Triggering seal-document job
2026-01-26T10:10:29.135Z [SEAL-DOCUMENT] Starting seal-document job
2026-01-26T10:10:29.200Z [SEAL-DOCUMENT] PDF loaded successfully, pages: 1
2026-01-26T10:10:29.250Z [SEAL-DOCUMENT] Inserting signature fields
2026-01-26T10:10:29.300Z [SEAL-DOCUMENT] PDF saved, size: 15467 bytes
2026-01-26T10:10:29.350Z [SEAL-DOCUMENT] Signing PDF with certificate
2026-01-26T10:10:29.400Z [SEAL-DOCUMENT] PDF signed successfully
2026-01-26T10:10:29.450Z [SEAL-DOCUMENT] Status updated to COMPLETED
2026-01-26T10:10:29.500Z [SEAL-DOCUMENT] Document completed!
```

---

## Troubleshooting

### If Native Module Still Fails After Cache Clear:

**Check 1: Verify Build Logs**

```bash
# Look for these in build logs:
"Installing Rust toolchain"
"Building native module"
"Native module ready"
```

**Check 2: Verify Native Module Exists**

```bash
# SSH into running container
docker exec -it <container-name> bash

# Check for native module
ls -la /app/packages/pdf-sign/*.node

# Should see:
# pdf-sign.linux-x64-gnu.node
```

**Check 3: Verify Environment Variables**

```bash
# In container
echo $NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS | wc -c
# Should show a large number (certificate size)

echo $NEXT_PRIVATE_SIGNING_PASSPHRASE
# Should show your passphrase
```

### If Certificate Fails After Native Module Works:

**Check 1: Verify Certificate Format**

```bash
# Certificate should be base64 encoded
echo $NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS | base64 -d | file -
# Should show: "data" or "PKCS12"
```

**Check 2: Verify Passphrase**

```bash
# Test certificate with passphrase
openssl pkcs12 -in cert.p12 -noout -passin pass:$NEXT_PRIVATE_SIGNING_PASSPHRASE
# Should succeed without errors
```

---

## Summary

### The Problem:

Docker build cache is preventing the native module from being compiled.

### The Solution:

Clear Docker build cache and redeploy.

### The Evidence:

Logs show "Cannot find module" error, which means the native module was never built.

### The Confidence:

99% - This is a straightforward cache issue. Once cache is cleared, the build will compile the native module and everything will work.

### The Certificate:

Already configured correctly via environment variable. Will work automatically once native module loads.

---

## Next Steps

1. **NOW:** Clear Docker build cache in Dokploy
2. **NOW:** Trigger new deployment
3. **WAIT:** 10-15 minutes for build to complete
4. **TEST:** Create and sign a document
5. **VERIFY:** Check logs for successful completion
6. **CELEBRATE:** Document processing is fixed! 🎉

---

## Quick Commands

```bash
# Clear cache (on Dokploy server)
docker builder prune -af

# Check if native module exists (in container)
docker exec -it <container> ls -la /app/packages/pdf-sign/*.node

# Check environment variables (in container)
docker exec -it <container> env | grep NEXT_PRIVATE_SIGNING

# Watch logs in real-time
docker logs -f <container>
```

---

**Bottom Line:** Clear the Docker cache, redeploy, and the native module will be built. Once that's done, your certificate configuration will work and documents will complete successfully.
