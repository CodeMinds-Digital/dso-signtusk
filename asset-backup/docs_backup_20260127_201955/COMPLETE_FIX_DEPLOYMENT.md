# Complete Fix Deployment Guide

## Issues Fixed

### 1. Native Module Missing (pdf-sign)

**Error**: `Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'`
**Fix**: Added Rust toolchain to Docker build to compile native module

### 2. Font Files Missing

**Error**: `No such file or directory: "/app/apps/remix/public/fonts/caveat.ttf"`
**Fix**: Copy public directory to Docker image for server-side font access

## Changes Made

### Dockerfile.production

1. **Added Rust Toolchain** (for native module compilation)

```dockerfile
# Install Rust toolchain for building native modules
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
```

2. **Added pdf-sign Package**

```dockerfile
COPY packages/pdf-sign/package.json ./packages/pdf-sign/package.json
```

3. **Copy Public Directory** (for fonts)

```dockerfile
# Copy public directory for server-side assets (fonts for PDF generation)
COPY --from=installer --chown=nodejs:nodejs /app/apps/remix/public ./apps/remix/public
```

### packages/pdf-sign/package.json

Changed build script from skip to actual build:

```json
{
  "scripts": {
    "build": "napi build --platform --release"
  }
}
```

## Deployment Steps

### 1. Clear Docker Cache (CRITICAL!)

In Dokploy Dashboard:

1. Go to your application
2. Click **Settings** tab
3. Click **Clear Cache** button
4. Confirm

**Why?** Without clearing cache, Docker will use old layers without Rust and without public directory.

### 2. Trigger Rebuild

1. Go to **Deployments** tab
2. Click **Deploy** button
3. Wait for build (15-20 minutes)

### 3. Monitor Build

Watch for these in build logs:

```
✓ Installing Rust toolchain
✓ Building packages/pdf-sign
✓ Compiled pdf-sign.linux-x64-gnu.node
✓ Copying public directory
```

### 4. Verify Deployment

After deployment:

```bash
# Check health
curl https://your-domain.com/health

# Should return: {"status":"ok"}
```

### 5. Test Document Completion

1. **Create new document**
2. **Add recipient** (use test email)
3. **Add signature field**
4. **Send document**
5. **Sign as recipient**
6. **Verify**: Document completes (not stuck in "Processing")
7. **Verify**: Can download signed PDF
8. **Verify**: PDF renders correctly with fonts

### 6. Check Logs

Look for success indicators:

```
✅ [SEAL-DOCUMENT] PDF signed, size: XXXXX bytes
✅ [SEAL-DOCUMENT] Signed PDF stored
```

Should NOT see:

```
❌ Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
❌ No such file or directory: "caveat.ttf"
```

## What Each Fix Does

### Native Module Fix

- Compiles Rust code to platform-specific binary
- Enables PDF signing with P12 certificates
- Required for `signWithP12()` function

### Font Files Fix

- Makes fonts available for server-side rendering
- Enables proper field rendering in PDFs
- Required for `insertFieldInPDFV2()` function

## Build Time

| Stage              | Time          | What's Happening        |
| ------------------ | ------------- | ----------------------- |
| Base setup         | 1-2 min       | System dependencies     |
| Rust install       | 2-3 min       | Download Rust toolchain |
| npm install        | 3-5 min       | Node.js dependencies    |
| Build packages     | 5-8 min       | All workspace packages  |
| **Build pdf-sign** | **2-3 min**   | **Compile Rust module** |
| Build Remix        | 2-3 min       | Main application        |
| **Total**          | **15-20 min** | Complete build          |

## Environment Variables

Verify these are set in Dokploy:

```bash
# Signing (Required)
NEXT_PRIVATE_SIGNING_TRANSPORT=local
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<base64-cert>
NEXT_PRIVATE_SIGNING_PASSPHRASE=<password>

# Database (Required)
NEXT_PRIVATE_DATABASE_URL=postgresql://...
NEXT_PRIVATE_DIRECT_DATABASE_URL=postgresql://...

# Storage (Required)
NEXT_PRIVATE_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_ENDPOINT=https://...
NEXT_PRIVATE_UPLOAD_BUCKET=...
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=...
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=...
```

## Troubleshooting

### Build Fails: "Rust not found"

- **Cause**: Cache not cleared
- **Fix**: Clear cache in Dokploy, rebuild

### Build Fails: "No space left"

- **Cause**: Disk full on server
- **Fix**: SSH to server, run `docker system prune -a`

### Runtime: "Cannot find module pdf-sign"

- **Cause**: Native module not built
- **Fix**: Check build logs for Rust installation, rebuild

### Runtime: "Font file not found"

- **Cause**: Public directory not copied
- **Fix**: Verify Dockerfile has public copy, rebuild

### Documents Still Stuck

- **New documents**: Check logs for actual error
- **Old documents**: Use fix script to manually complete

## Success Criteria

After deployment, verify:

- ✅ Application starts without errors
- ✅ Health check returns OK
- ✅ Can create documents
- ✅ Can sign documents
- ✅ Documents complete successfully
- ✅ No module errors in logs
- ✅ No font errors in logs
- ✅ Signed PDFs render correctly
- ✅ Background jobs running

## Verification Commands

```bash
# Check if native module exists (in container)
docker exec <container-id> ls -la /app/packages/pdf-sign/*.node

# Check if fonts exist (in container)
docker exec <container-id> ls -la /app/apps/remix/public/fonts/

# Check logs
docker logs <container-id> | grep "SEAL-DOCUMENT"

# Test health
curl https://your-domain.com/health
```

## Documentation

- `FONT_FILES_FIX.md` - Font files issue details
- `docs/fixes/PDF_SIGN_NATIVE_MODULE_FIX.md` - Native module details
- `NATIVE_MODULE_FIX_SUMMARY.md` - Quick overview
- `DEPLOYMENT_CHECKLIST.md` - Step-by-step checklist

## Rollback Plan

If deployment fails:

1. **Revert** to previous deployment in Dokploy
2. **Check logs** for specific error
3. **Verify** environment variables
4. **Check** server disk space
5. **Contact support** if needed

## Status

✅ **BOTH FIXES COMPLETE - READY TO DEPLOY**

All changes are committed and ready. Follow this guide to deploy safely.

---

**Estimated Time**: 30-45 minutes (including testing)
**Risk Level**: Low (can rollback if needed)
**Impact**: Fixes document completion completely
