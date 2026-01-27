# Deploy with Native Module Fix

## What Was Fixed

The `seal-document` background job was failing because the `@signtusk/pdf-sign` native Rust module wasn't compiled for Linux. This caused documents to get stuck in "Processing" state after signing.

**Fix Applied:**

- ✅ Added Rust toolchain to Docker build
- ✅ Enabled native module compilation during build
- ✅ Added pdf-sign package to Dockerfile

## Deployment Steps

### 1. Clear Docker Build Cache (CRITICAL)

In Dokploy Dashboard:

1. Go to your application
2. Click **Settings** tab
3. Find **Clear Cache** button
4. Click it and confirm

**Why?** Docker caches layers. Without clearing, it will use old layers without Rust toolchain.

### 2. Trigger Rebuild

1. Go to **Deployments** tab
2. Click **Deploy** button
3. Wait for build to complete

**Expected Build Time:** 15-20 minutes (Rust compilation adds ~5 minutes)

### 3. Monitor Build Progress

Watch the build logs for:

```
✓ Installing Rust toolchain
✓ Building packages/pdf-sign
✓ Compiled pdf-sign.linux-x64-gnu.node
```

### 4. Verify Deployment

After deployment completes:

1. **Check Application Health**

   ```
   curl https://your-domain.com/health
   ```

   Should return: `{"status":"ok"}`

2. **Test Document Signing**
   - Create a new document
   - Add recipient and signature field
   - Sign the document
   - Document should complete (not stuck in "Processing")

3. **Check Logs**
   In Dokploy logs, look for:

   ```
   [SEAL-DOCUMENT] PDF signed, size: XXXXX bytes
   ```

   Should NOT see:

   ```
   Error: Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
   ```

## Environment Variables

Make sure these are set in Dokploy Dashboard:

### Required for Signing

```bash
NEXT_PRIVATE_SIGNING_TRANSPORT=local
NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS=<base64-encoded-p12-certificate>
NEXT_PRIVATE_SIGNING_PASSPHRASE=<certificate-password>
```

### Database (Already Configured)

```bash
NEXT_PRIVATE_DATABASE_URL=postgresql://...
NEXT_PRIVATE_DIRECT_DATABASE_URL=postgresql://...
```

### Storage (S3/Supabase)

```bash
NEXT_PRIVATE_UPLOAD_TRANSPORT=s3
NEXT_PUBLIC_UPLOAD_TRANSPORT=s3
NEXT_PRIVATE_UPLOAD_ENDPOINT=https://...
NEXT_PRIVATE_UPLOAD_REGION=...
NEXT_PRIVATE_UPLOAD_BUCKET=...
NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID=...
NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY=...
```

## Troubleshooting

### Build Fails with "Rust not found"

**Cause:** Docker cache not cleared
**Solution:** Clear cache in Dokploy and rebuild

### Build Takes Too Long (>30 minutes)

**Cause:** Server resources or network issues
**Solution:**

- Check Dokploy server resources (CPU, RAM, disk)
- May need to increase timeout in Dokploy settings

### Runtime Error: "Cannot find module pdf-sign"

**Cause:** Native module not built or not copied to runner stage
**Solution:**

1. Check build logs for "Building packages/pdf-sign"
2. Verify Rust was installed during build
3. Clear cache and rebuild

### Documents Still Stuck in "Processing"

**For NEW documents after fix:**

- Check logs for actual error
- Verify certificate is configured correctly
- Check `NEXT_PRIVATE_SIGNING_TRANSPORT=local`

**For OLD documents (before fix):**

- These need manual completion
- Use script: `npm run with:env -- tsx scripts/fix-stuck-documents.ts`
- Or manually update in database

### Disk Space Error During Build

**Error:** "No space left on device"
**Solution:**

1. SSH into Dokploy server
2. Clean up old Docker images:
   ```bash
   docker system prune -a --volumes
   ```
3. Check disk space: `df -h`
4. May need to increase disk size

## Build Time Breakdown

| Stage           | Time          | Description                         |
| --------------- | ------------- | ----------------------------------- |
| Base setup      | 1-2 min       | Install system dependencies         |
| Rust install    | 2-3 min       | Download and install Rust toolchain |
| npm install     | 3-5 min       | Install all Node.js dependencies    |
| Build packages  | 5-8 min       | Build all workspace packages        |
| Build pdf-sign  | 2-3 min       | Compile Rust native module          |
| Build Remix app | 2-3 min       | Build main application              |
| **Total**       | **15-20 min** | Complete build time                 |

## Verification Checklist

After deployment, verify:

- [ ] Application is accessible at your domain
- [ ] Health check returns OK
- [ ] Can create new document
- [ ] Can add recipients and fields
- [ ] Can sign document
- [ ] Document completes (not stuck in "Processing")
- [ ] Signed PDF is downloadable
- [ ] No errors in Dokploy logs
- [ ] Background jobs are running

## Next Steps

1. **Test thoroughly** with new documents
2. **Fix old stuck documents** if needed using scripts
3. **Monitor logs** for any signing errors
4. **Set up monitoring** for background job failures

## Support

If issues persist:

1. Check `logs/logs.txt` for detailed errors
2. Review Dokploy build logs
3. Verify all environment variables are set
4. Check certificate is valid and not expired

## Files Changed

- `Dockerfile.production` - Added Rust toolchain
- `packages/pdf-sign/package.json` - Enabled build
- `docs/fixes/PDF_SIGN_NATIVE_MODULE_FIX.md` - Detailed fix documentation

## Status

✅ **READY TO DEPLOY**

The fix is complete and ready for deployment. Follow the steps above to deploy.
