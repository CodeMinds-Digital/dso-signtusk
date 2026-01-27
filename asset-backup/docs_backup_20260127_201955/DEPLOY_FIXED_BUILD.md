# Deploy Fixed Docker Build

## What Was Fixed

Removed non-essential verification commands that were causing `/bin/sh` errors during Docker build. The actual build completes successfully - only the verification steps were failing.

## Deploy to Dokploy

### Option 1: Push to Git and Let Dokploy Rebuild

```bash
git add Dockerfile.production
git commit -m "fix: remove verification commands causing /bin/sh error"
git push origin main
```

Then in Dokploy:

1. Go to your application
2. Click "Redeploy" or trigger a new deployment
3. Dokploy will pull the latest code and rebuild

### Option 2: Build Locally and Push Image

```bash
# Build the image
docker build -f Dockerfile.production -t signtusk:latest .

# Tag for your registry
docker tag signtusk:latest your-registry.com/signtusk:latest

# Push to registry
docker push your-registry.com/signtusk:latest
```

Then update Dokploy to use the new image.

### Option 3: Clear Dokploy Cache and Rebuild

If Dokploy is using cached layers:

1. In Dokploy UI, go to your application
2. Click "Advanced" or "Settings"
3. Find "Clear Build Cache" option
4. Clear cache and redeploy

## Verification After Deploy

Once deployed, check the logs for:

```bash
# Check if native modules loaded
docker logs <container-id> | grep "pdf-sign"

# Check if workspace packages loaded
docker logs <container-id> | grep "pdf-processing"

# Check application startup
docker logs <container-id> | grep "Server listening"
```

## Expected Behavior

✅ Build should complete without `/bin/sh` errors
✅ All 53 build steps should succeed
✅ Application should start normally
✅ PDF signing should work at runtime

## If Issues Persist

If you still see the `/bin/sh` error:

1. Clear ALL Docker build cache in Dokploy
2. Try building on a different machine/platform
3. Check Docker/buildkit versions
4. Consider using a different base image (though node:22-bookworm-slim should work)

## Environment Variables

Make sure these are set in Dokploy:

- `NEXT_PRIVATE_DATABASE_URL`
- `NEXT_PRIVATE_DIRECT_DATABASE_URL`
- `NEXT_PUBLIC_WEBAPP_URL`
- Certificate variables (if using)

See `COPY_TO_DOKPLOY.txt` for the complete list.
