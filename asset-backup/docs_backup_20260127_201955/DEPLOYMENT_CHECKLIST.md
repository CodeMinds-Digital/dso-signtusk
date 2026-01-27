# Deployment Checklist - Native Module Fix

## Pre-Deployment

- [x] Identified root cause: Missing Linux native binary for pdf-sign
- [x] Added Rust toolchain to Dockerfile
- [x] Updated pdf-sign build script
- [x] Added pdf-sign to Dockerfile package list
- [x] Created documentation
- [x] Committed all changes

## Deployment Steps

### 1. Clear Docker Cache

- [ ] Open Dokploy Dashboard
- [ ] Navigate to application Settings
- [ ] Click "Clear Cache" button
- [ ] Confirm cache clear

**Why?** Without clearing cache, Docker will use old layers without Rust.

### 2. Trigger Build

- [ ] Go to Deployments tab
- [ ] Click "Deploy" button
- [ ] Note the build start time

### 3. Monitor Build (15-20 minutes)

- [ ] Watch build logs
- [ ] Look for "Installing Rust toolchain"
- [ ] Look for "Building packages/pdf-sign"
- [ ] Look for "Compiled pdf-sign.linux-x64-gnu.node"
- [ ] Wait for "Build completed successfully"

### 4. Verify Deployment

- [ ] Application is accessible
- [ ] Health check returns OK: `curl https://your-domain.com/health`
- [ ] No errors in startup logs

### 5. Test Document Signing

- [ ] Create new document
- [ ] Add recipient (use test email)
- [ ] Add signature field
- [ ] Send document
- [ ] Sign as recipient
- [ ] **VERIFY**: Document completes (not stuck in "Processing")
- [ ] **VERIFY**: Can download signed PDF
- [ ] **VERIFY**: Logs show "[SEAL-DOCUMENT] PDF signed"

### 6. Check for Errors

- [ ] Review Dokploy logs
- [ ] No "Cannot find module" errors
- [ ] No "seal-document failed" errors
- [ ] Background jobs running successfully

## Post-Deployment

### Fix Old Stuck Documents (if needed)

- [ ] Identify stuck documents in database
- [ ] Run fix script: `npm run with:env -- tsx scripts/fix-stuck-documents.ts`
- [ ] Verify old documents are now completed

### Monitor

- [ ] Check logs for next 24 hours
- [ ] Monitor document completion rate
- [ ] Watch for any signing errors

## Rollback Plan (if needed)

If deployment fails:

1. **Revert to previous deployment** in Dokploy
2. **Check logs** for specific error
3. **Verify environment variables** are correct
4. **Check disk space** on server
5. **Contact support** if issue persists

## Success Criteria

✅ Build completes in 15-20 minutes
✅ Application starts without errors
✅ New documents complete successfully
✅ No "Cannot find module" errors in logs
✅ PDF signing works correctly
✅ Signed PDFs are downloadable

## Common Issues

### Build Fails

- **Cause**: Cache not cleared
- **Fix**: Clear cache and rebuild

### Build Timeout

- **Cause**: Server resources
- **Fix**: Check server CPU/RAM, increase timeout

### Runtime Error

- **Cause**: Native module not built
- **Fix**: Verify Rust in build logs, rebuild

### Still Stuck

- **Cause**: Old documents
- **Fix**: Use fix script for old documents

## Environment Variables to Verify

```bash
# Signing
NEXT_PRIVATE_SIGNING_TRANSPORT=local
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<base64-cert>
NEXT_PRIVATE_SIGNING_PASSPHRASE=<password>

# Database
NEXT_PRIVATE_DATABASE_URL=postgresql://...
NEXT_PRIVATE_DIRECT_DATABASE_URL=postgresql://...

# Storage
NEXT_PRIVATE_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_ENDPOINT=https://...
NEXT_PRIVATE_UPLOAD_BUCKET=...
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=...
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=...
```

## Documentation

- `NATIVE_MODULE_FIX_SUMMARY.md` - Quick overview
- `DEPLOY_WITH_NATIVE_MODULE_FIX.md` - Detailed guide
- `docs/fixes/PDF_SIGN_NATIVE_MODULE_FIX.md` - Technical details

## Status

**READY TO DEPLOY** ✅

All changes are complete. Follow this checklist to deploy safely.

---

**Estimated Time**: 30-45 minutes (including testing)
**Risk Level**: Low (can rollback if needed)
**Impact**: Fixes document completion issue
