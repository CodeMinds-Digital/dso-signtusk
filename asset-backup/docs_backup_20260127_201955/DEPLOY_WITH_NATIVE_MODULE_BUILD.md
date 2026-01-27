# Deploy with Native Module Build Fix

## Issue Fixed

Documents were stuck in "Processing" state because the `seal-document` job couldn't load the `@signtusk/pdf-sign` native module.

**Error in logs:**

```
[JOBS]: Job internal.seal-document failed Error: Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
```

## What Changed

The Dockerfile now:

1. **Explicitly builds** the pdf-sign native module using Rust
2. **Verifies** the `.node` binary file is created
3. **Copies** the built binary to the runner stage
4. **Verifies** the binary is present at runtime

## Deployment Steps

### 1. Clear Docker Build Cache (CRITICAL!)

In Dokploy:

1. Go to your application
2. Click "Advanced" tab
3. Find "Clear Build Cache" button
4. Click it and confirm

**Why?** Docker caches layers. Without clearing, it will reuse old layers that don't have the native module build.

### 2. Commit and Push Changes

```bash
git add Dockerfile.production docs/fixes/NATIVE_MODULE_BUILD_FIX.md
git commit -m "fix: build pdf-sign native module in Docker"
git push origin main
```

### 3. Deploy in Dokploy

1. Go to your application in Dokploy
2. Click "Deploy" button
3. Wait for build to complete (will take longer due to Rust compilation)

### 4. Monitor Build Logs

Watch for these success indicators:

```
✅ Native module built successfully
```

And later in the runner stage:

```
✅ Native module copied successfully
```

### 5. Verify Runtime

After deployment, check the application logs for:

```
[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
[JOBS]: Triggering job internal.seal-document with payload
```

**Should NOT see:**

```
Error: Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
```

## Testing

### Test with NEW Document

1. Log in to your application
2. Create a new document
3. Add recipients (e.g., 2 signers)
4. Add signature fields for each recipient
5. Send the document
6. Sign as first recipient
7. Sign as second recipient
8. **Expected**: Document automatically completes (status changes from "Processing" to "Completed")

### Check Logs

```bash
# In Dokploy, view application logs
# Look for:
[COMPLETE-DOCUMENT] All recipients have signed, triggering seal-document job
[JOBS]: Triggering job internal.seal-document with payload
# Should complete without errors
```

## Fix Existing Stuck Documents

Old documents that are already stuck need manual intervention:

### Option 1: Fix All Stuck Documents

```bash
# SSH into your server or use Dokploy console
cd /app
npm run with:env -- tsx scripts/fix-stuck-documents.ts
```

### Option 2: Fix Specific Document

```bash
# Replace <documentId> with the actual document ID
npm run with:env -- tsx scripts/manually-complete-document.ts <documentId>
```

## Build Time

Expect the build to take **5-10 minutes longer** than before due to:

- Rust toolchain installation
- Native module compilation
- Cargo dependency downloads

This is normal and only happens during build, not at runtime.

## Troubleshooting

### Build Fails with "cargo: command not found"

**Cause**: Rust installation failed
**Fix**: Check if the Rust installation step completed successfully in build logs

### Build Fails with "error: linker `cc` not found"

**Cause**: Missing build tools
**Fix**: Ensure `g++` and `make` are installed in the installer stage (already in Dockerfile)

### Runtime Error: "Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'"

**Cause**: Native module wasn't copied to runner stage
**Fix**:

1. Check if "✅ Native module copied successfully" appears in logs
2. Clear Docker build cache and rebuild

### Document Still Stuck in "Processing"

**Causes**:

1. Old document from before the fix
2. Different error (check logs)

**Fix**:

1. Check logs for actual error
2. For old documents, use manual fix scripts
3. Test with NEW document to verify fix works

## Environment Variables

No changes needed to environment variables. The fix is purely in the Docker build process.

## Rollback

If you need to rollback:

```bash
git revert HEAD
git push origin main
```

Then redeploy in Dokploy.

## Success Criteria

✅ Build completes without errors
✅ "Native module built successfully" in build logs
✅ "Native module copied successfully" in build logs
✅ Application starts without errors
✅ NEW documents complete automatically after all recipients sign
✅ No "Cannot find module" errors in logs

## Next Steps

After successful deployment:

1. Test document completion with new documents
2. Fix any existing stuck documents using scripts
3. Monitor logs for any other issues
4. Consider adding automated tests for document completion flow

## Related Documentation

- `docs/fixes/NATIVE_MODULE_BUILD_FIX.md` - Technical details
- `docs/deployment/DOKPLOY_DEPLOYMENT.md` - General deployment guide
- `docs/troubleshooting/PROCESSING_STATE_ISSUE.md` - Original issue analysis
