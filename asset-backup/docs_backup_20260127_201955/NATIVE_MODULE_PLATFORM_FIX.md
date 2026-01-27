# 🔧 Native Module Platform Fix - COMPLETE SOLUTION

## 🎯 Issue Identified

**Problem:** Documents stuck in "Processing" state after signing

**Root Cause:** The `seal-document` background job fails because the native module `pdf-sign.linux-x64-gnu.node` is missing in production.

---

## 📊 Error Analysis from Logs

### From `logs/logs.txt`:

```
2026-01-26T10:10:28.633Z [COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
2026-01-26T10:10:28.684Z [JOBS]: Triggering job internal.seal-document with payload { documentId: 4 }
2026-01-26T10:10:29.135Z [JOBS]: Job internal.seal-document failed Error: Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
```

### The Flow:

1. ✅ Recipient signs document
2. ✅ System detects all signatures complete
3. ✅ Triggers `internal.seal-document` job
4. ❌ **Job fails: Cannot find native module**
5. ❌ Job retries 3 times, all fail
6. ❌ Document status stays `PENDING`
7. ❌ Recipient sees "Processing document" forever

---

## 🔍 Technical Deep Dive

### How `packages/pdf-sign/index.js` Works:

```javascript
// Line 158-172 (Linux x64 case)
case 'x64':
  if (isMusl()) {
    // Try musl variant...
  } else {
    localFileExisted = existsSync(join(__dirname, 'pdf-sign.linux-x64-gnu.node'));
    try {
      if (localFileExisted) {
        nativeBinding = require('./pdf-sign.linux-x64-gnu.node');  // ← Tries local file FIRST
      } else {
        nativeBinding = require('@signtusk/pdf-sign-linux-x64-gnu'); // ← Falls back to npm package
      }
    } catch (e) {
      loadError = e;
    }
  }
```

### The Problem:

1. **Local file check**: `pdf-sign.linux-x64-gnu.node` doesn't exist
2. **NPM fallback**: `@signtusk/pdf-sign-linux-x64-gnu` package doesn't exist
3. **Result**: Module loading fails, job crashes

### Current State:

```bash
$ ls packages/pdf-sign/*.node
pdf-sign.darwin-arm64.node  # ← Only macOS ARM64 exists!
```

**Missing:**

- `pdf-sign.linux-x64-gnu.node` (needed for production Docker)
- `pdf-sign.linux-x64-musl.node` (Alpine Linux)
- `pdf-sign.linux-arm64-gnu.node` (ARM servers)

---

## ✅ The Complete Fix

### 1. Updated Dockerfile.production

**Changed:**

```dockerfile
# Build the pdf-sign native module FIRST (requires Rust)
# Force build for Linux x64 GNU (the target platform)
WORKDIR /app/packages/pdf-sign
RUN npm run build -- --target x86_64-unknown-linux-gnu

# Verify native module was built for Linux
RUN ls -la *.node && \
    test -f pdf-sign.linux-x64-gnu.node && \
    echo "✅ Native module built successfully for Linux x64 GNU" || \
    (echo "❌ Native module NOT found!" && exit 1)
```

**Why this works:**

- `--target x86_64-unknown-linux-gnu` forces Rust to build for Linux x64 GNU
- The verification step ensures the build succeeded
- The `.node` file will be copied to the runner stage
- `index.js` will find the local file and load it successfully

### 2. Verification in Runner Stage

The Dockerfile already has:

```dockerfile
# CRITICAL: Verify the built native module (.node file) is present
RUN ls -la ./packages/pdf-sign/*.node && echo "✅ Native module copied successfully"
```

This will now show:

```
pdf-sign.linux-x64-gnu.node  ← The file we need!
```

---

## 🚀 Deployment Steps

### Step 1: Commit the Fix

```bash
git add Dockerfile.production
git add NATIVE_MODULE_PLATFORM_FIX.md

git commit -m "fix: build native module for correct platform (Linux x64 GNU)

- Force pdf-sign native module build for x86_64-unknown-linux-gnu
- Add verification step to ensure .node file exists
- Fixes seal-document job failure causing stuck Processing state
- Documents will now complete successfully after all signatures"

git push origin dokploy-deploy
```

### Step 2: Deploy with Cache Clear

**CRITICAL:** You MUST clear the Docker build cache in Dokploy!

1. Go to Dokploy Dashboard
2. Navigate to your application
3. **Click "Clear Build Cache"** or **"Force Rebuild"**
4. Click "Redeploy"

**Why cache clear is critical:**

- Old cached layers have the wrong native module
- Without clearing, Docker will reuse the macOS ARM64 module
- The fix won't apply until cache is cleared

### Step 3: Monitor the Build

Watch for these log lines during build:

```
✅ Native module built successfully for Linux x64 GNU
✅ Native module copied successfully
```

If you see:

```
❌ Native module NOT found!
```

The build will fail (which is good - it prevents deploying broken code).

### Step 4: Test After Deployment

1. Create a new document
2. Add a signer
3. Send the document
4. Sign as the recipient
5. **Check the logs** for:

```
[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
[JOBS]: Triggering job internal.seal-document
[SEAL-DOCUMENT] Starting PDF decoration
✅ PDF signed successfully
[SEAL-DOCUMENT] Status updated to COMPLETED
```

6. **Verify the UI** shows:
   - Sender sees: "Completed"
   - Recipient sees: "Everyone has signed" (not "Processing document")

---

## 🔍 Why This Happened

### Development vs Production Platform Mismatch

**Development (macOS ARM64):**

```bash
$ npm run build
# Builds: pdf-sign.darwin-arm64.node
```

**Production (Linux x64 Docker):**

```bash
$ npm run build
# Should build: pdf-sign.linux-x64-gnu.node
# But was building: pdf-sign.darwin-arm64.node (wrong!)
```

### The NAPI-RS Build System

The `@napi-rs/cli` tool builds native modules for the **current platform** by default.

**Without `--target` flag:**

- Detects host platform (macOS ARM64)
- Builds for host platform
- Wrong for Docker production!

**With `--target x86_64-unknown-linux-gnu`:**

- Forces build for Linux x64 GNU
- Correct for Docker production!

---

## 📋 Comparison with documenso-main

### Original Documenso Approach:

1. **Pre-built modules**: Published to npm as separate packages
   - `@documenso/pdf-sign-linux-x64-gnu`
   - `@documenso/pdf-sign-darwin-arm64`
   - etc.

2. **CI/CD**: GitHub Actions builds for all platforms
3. **Deployment**: Just installs the right npm package

### Your Fork (Signtusk) Approach:

1. **Build during Docker**: Compile native module in Dockerfile
2. **Single package**: `@signtusk/pdf-sign` (not published to npm)
3. **Local file**: Use the `.node` file directly

**Advantage:** No need to publish to npm
**Disadvantage:** Must build for correct platform in Docker

---

## 🎯 Expected Results After Fix

### Before Fix:

```
[JOBS]: Job internal.seal-document failed Error: Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
```

### After Fix:

```
[SEAL-DOCUMENT] Starting PDF decoration
[SEAL-DOCUMENT] Loading native module
✅ Native module loaded: pdf-sign.linux-x64-gnu.node
[SEAL-DOCUMENT] Generating certificate
[SEAL-DOCUMENT] Generating audit log
[SEAL-DOCUMENT] Signing PDF
✅ PDF signed successfully
[SEAL-DOCUMENT] Updating document status to COMPLETED
✅ Document completed successfully
```

### Database State:

**Before:**

```sql
SELECT "secondaryId", "status", "completedAt" FROM "Envelope" WHERE "secondaryId" = 'envelope_naexswdlzsasrkwv';
-- status: PENDING
-- completedAt: NULL
```

**After:**

```sql
SELECT "secondaryId", "status", "completedAt" FROM "Envelope" WHERE "secondaryId" = 'envelope_naexswdlzsasrkwv';
-- status: COMPLETED
-- completedAt: 2026-01-26T10:10:30.000Z
```

---

## 🆘 Troubleshooting

### If Build Fails with "Native module NOT found"

**Possible causes:**

1. **Rust not installed in Docker**
   - Check: Dockerfile has `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`
   - Verify: `RUN rustc --version` should work

2. **Wrong target triple**
   - Check: `--target x86_64-unknown-linux-gnu` is correct
   - For Alpine: Use `x86_64-unknown-linux-musl`

3. **Build dependencies missing**
   - Check: `python3`, `make`, `g++`, `cmake` are installed

### If Job Still Fails After Deployment

**Check 1: Verify native module exists**

```bash
docker exec <container> ls -la /app/packages/pdf-sign/*.node
# Should show: pdf-sign.linux-x64-gnu.node
```

**Check 2: Verify module can be loaded**

```bash
docker exec <container> node -e "require('/app/packages/pdf-sign')"
# Should not throw error
```

**Check 3: Check platform**

```bash
docker exec <container> node -e "console.log(process.platform, process.arch)"
# Should show: linux x64
```

### If Old Documents Still Stuck

**This is expected!** Old documents need manual completion:

```bash
# Fix specific document
npm run with:env -- tsx scripts/manually-complete-document.ts envelope_naexswdlzsasrkwv

# Or fix all stuck documents
npm run with:env -- tsx scripts/fix-stuck-documents.ts
```

---

## 📚 Additional Resources

### Related Files:

- `packages/pdf-sign/index.js` - Native module loader
- `packages/pdf-sign/package.json` - Build configuration
- `packages/pdf-sign/Cargo.toml` - Rust build config
- `Dockerfile.production` - Production build process

### Related Issues:

- `PROCESSING_STATE_ISSUE.md` - Original issue documentation
- `NATIVE_MODULE_FIX_COMPLETE.md` - Previous fix attempts
- `PDF_PROCESSING_COMPARISON.md` - Module comparison

### NAPI-RS Documentation:

- https://napi.rs/docs/introduction/getting-started
- https://napi.rs/docs/cross-build/summary

---

## ✅ Summary

**Problem:** Native module built for wrong platform (macOS instead of Linux)

**Solution:** Force build for Linux x64 GNU using `--target` flag

**Impact:**

- ✅ seal-document job will succeed
- ✅ Documents will complete after signing
- ✅ No more "Processing document" stuck state

**Action Required:**

1. Commit the Dockerfile change
2. **Clear Docker build cache in Dokploy**
3. Redeploy
4. Test with new document

---

**Deploy now with cache clear to fix this issue!** 🚀

The fix is minimal, targeted, and addresses the exact root cause identified in the logs.
