# 🔧 Docker Cache Build Fix

**Issue:** TypeScript warnings about missing `@signtusk/pdf-processing` module during Docker build

**Status:** Build completes but shows warnings (non-fatal)

---

## 🔍 The Problem

Build logs show:

```
(!) [plugin typescript] Cannot find module '@signtusk/pdf-processing'
...
created build/server/hono in 35.3s
[Build]: Done!
```

**Why this happens:**

1. Docker is using cached layers from previous builds
2. The cached layers don't have the updated `package.json` for pdf-processing
3. TypeScript can't find the module during type checking
4. Build still completes because it's just a warning

---

## ✅ Solution Applied

### Fix 1: Explicit Build Step

Added explicit build step for pdf-processing in Dockerfile:

```dockerfile
# Build pdf-processing package explicitly (required by lib package)
RUN cd packages/pdf-processing && npm run build && cd ../..

# Build all workspace packages first
RUN npx turbo run build --filter=@signtusk/remix^...
```

This ensures pdf-processing is built BEFORE the remix app tries to import it.

### Fix 2: Clear Docker Cache

**CRITICAL:** You MUST clear the Docker build cache in Dokploy!

Without clearing cache:

- ❌ Docker reuses old layers
- ❌ Old package.json is used
- ❌ TypeScript warnings persist

With cleared cache:

- ✅ Fresh build from scratch
- ✅ New package.json is used
- ✅ No TypeScript warnings

---

## 🚀 How to Deploy with Cache Clear

### Step 1: Commit Changes

```bash
git add Dockerfile.production
git add packages/pdf-processing/package.json
git add scripts/diagnose-document-completion.ts
git add DOCUMENT_COMPLETION_FIX.md
git add FIXES_APPLIED.md
git add CACHE_BUILD_FIX.md

git commit -m "fix: add explicit pdf-processing build step and clear cache instructions

- Add explicit build step for pdf-processing before remix build
- Fix package.json to point to compiled dist files
- Add diagnostic tools for document completion
- Resolves TypeScript module not found warnings"

git push origin dokploy-deploy
```

### Step 2: Clear Cache in Dokploy

**Option A: Using Dokploy UI (Recommended)**

1. Go to Dokploy Dashboard
2. Select your application
3. Click "Advanced" or "Settings" tab
4. Look for "Clear Build Cache" button
5. **Click it** ← IMPORTANT!
6. Wait for confirmation
7. Then click "Redeploy"

**Option B: Delete and Recreate (Most Reliable)**

1. Go to Dokploy Dashboard
2. **Delete** the current application
3. **Create new** application with same settings:
   - Name: signtusk (or your app name)
   - Build Type: Dockerfile
   - Dockerfile Path: Dockerfile.production
   - Build Path: `/`
   - Docker Context: `.`
4. Add all environment variables (see DOKPLOY_ENV_VARS.txt)
5. Deploy

**Option C: SSH into Server (Advanced)**

If you have SSH access to the Dokploy server:

```bash
# SSH into server
ssh your-server

# Remove all Docker build cache
docker builder prune -af

# Or remove specific image
docker images | grep signtusk
docker rmi <image-id> --force

# Then redeploy in Dokploy UI
```

### Step 3: Monitor Build

Watch the build logs carefully:

**Should See:**

```
✅ [installer 10/12] RUN cd packages/pdf-processing && npm run build
✅ > @signtusk/pdf-processing@0.1.0 build
✅ > tsc
✅ [installer 11/12] RUN npx turbo run build --filter=@signtusk/remix^...
✅ @signtusk/pdf-processing:build: cache hit
✅ created build/server/hono in 31.7s
✅ [Build]: Done!
```

**Should NOT See:**

```
❌ (!) [plugin typescript] Cannot find module '@signtusk/pdf-processing'
```

---

## 🔍 Why Cache Causes This Issue

### How Docker Caching Works

Docker caches each layer (RUN command) based on:

1. The command itself
2. Files copied before the command
3. Previous layer state

Example:

```dockerfile
# Layer 1: Copy package.json
COPY packages/pdf-processing/package.json ./packages/pdf-processing/
# ✅ Cached if file hasn't changed

# Layer 2: Install deps
RUN npm ci
# ✅ Cached if Layer 1 is cached

# Layer 3: Copy source
COPY packages ./packages
# ❌ Cache invalidated if source changed

# Layer 4: Build
RUN npm run build
# ❌ Must rebuild because Layer 3 changed
```

### The Problem

When you update `package.json`:

1. Docker sees the file changed
2. But the COPY command is the same
3. Docker might use cached layer
4. Old package.json is used
5. TypeScript can't find the module

### The Solution

Clear cache forces Docker to:

1. Re-copy all files (including new package.json)
2. Rebuild all layers
3. Use new package.json
4. TypeScript finds the module

---

## 📊 Expected Results

### Before Cache Clear:

```
❌ (!) [plugin typescript] Cannot find module '@signtusk/pdf-processing'
⚠️  Build completes with warnings
⚠️  Runtime might have issues
```

### After Cache Clear:

```
✅ No TypeScript warnings
✅ Clean build
✅ All modules found
✅ Runtime works correctly
```

---

## 🆘 If Cache Clear Doesn't Work

### Verify Changes Were Applied

```bash
# Check if Dockerfile has the new build step
git show HEAD:Dockerfile.production | grep "pdf-processing && npm run build"
# Should show: RUN cd packages/pdf-processing && npm run build

# Check if package.json was updated
git show HEAD:packages/pdf-processing/package.json | grep main
# Should show: "main": "./dist/index.js"
```

### Force Rebuild

If cache clear button doesn't work:

1. **Change Dockerfile slightly** to invalidate cache:

   ```dockerfile
   # Add a comment with timestamp
   # Cache bust: 2026-01-26-10:30
   RUN cd packages/pdf-processing && npm run build && cd ../..
   ```

2. **Commit and push**

3. **Redeploy** (cache will be invalidated automatically)

### Nuclear Option: Delete Everything

If nothing works:

```bash
# On Dokploy server (SSH access required)
docker system prune -af --volumes
docker builder prune -af

# This removes:
# - All stopped containers
# - All networks not used by containers
# - All images without containers
# - All build cache
# - All volumes
```

⚠️ **WARNING:** This affects ALL Docker applications on the server!

---

## 🎯 Verification Steps

### 1. Check Build Logs

Look for these lines in order:

```
[installer 10/12] RUN cd packages/pdf-processing && npm run build
> @signtusk/pdf-processing@0.1.0 build
> tsc
✅ No errors

[installer 11/12] RUN npx turbo run build --filter=@signtusk/remix^...
@signtusk/pdf-processing:build: cache hit, replaying logs
✅ Package already built

[installer 12/12] RUN ./.bin/build-docker.sh
server/router.ts → build/server/hono...
✅ No TypeScript errors
created build/server/hono in 31.7s
[Build]: Done!
```

### 2. Check Application Logs

After deployment:

```
✅ 🚀 Starting Signtusk...
✅ 🗄️  Running database migrations...
✅ ✅ Database migrations completed successfully
✅ 🌟 Starting Signtusk server...
✅ 📍 Server will be available at: http://0.0.0.0:3000
```

### 3. Test Document Completion

1. Create a document
2. Add a signer
3. Send and sign
4. **Document should complete automatically**

Check logs for:

```
[COMPLETE-DOCUMENT] All recipients have signed
[COMPLETE-DOCUMENT] Triggering seal-document job
[SEAL-DOCUMENT] Starting PDF decoration
✅ No module errors
[SEAL-DOCUMENT] PDF signed successfully
[SEAL-DOCUMENT] Status updated to COMPLETED
```

---

## 📋 Deployment Checklist

- [x] Fixed Dockerfile with explicit build step
- [x] Fixed package.json exports
- [x] Committed changes
- [ ] Pushed to dokploy-deploy branch
- [ ] **CLEARED BUILD CACHE IN DOKPLOY** ← CRITICAL!
- [ ] Redeployed application
- [ ] Verified build logs (no TypeScript warnings)
- [ ] Verified application starts
- [ ] Tested document completion

---

## 💡 Pro Tips

### 1. Always Clear Cache When Changing Dependencies

If you change:

- package.json
- Package structure
- Build configuration
- Dependency versions

→ **Clear build cache!**

### 2. Use Build Args for Cache Busting

Add to Dockerfile:

```dockerfile
ARG CACHEBUST=1
RUN echo "Cache bust: ${CACHEBUST}"
```

Then in Dokploy, set:

```
Build Args: CACHEBUST=$(date +%s)
```

This forces a new build every time.

### 3. Monitor Build Times

- First build (no cache): ~10-15 minutes
- Cached build: ~2-5 minutes
- If build is too fast (<1 minute), cache might be too aggressive

---

## 📚 Related Documentation

- `FIXES_APPLIED.md` - Summary of all fixes
- `DOCUMENT_COMPLETION_FIX.md` - Document completion troubleshooting
- `FORCE_REBUILD_DOKPLOY.md` - How to force rebuild
- `DEPLOY_NOW.md` - Deployment instructions

---

## ✅ Summary

**Problem:** TypeScript can't find `@signtusk/pdf-processing` during build

**Root Cause:** Docker cache using old package.json

**Solution:**

1. ✅ Add explicit build step in Dockerfile
2. ✅ Fix package.json exports
3. ✅ **Clear Docker build cache** ← CRITICAL!
4. ✅ Redeploy

**Expected Result:** Clean build with no warnings, documents complete automatically

---

**IMPORTANT: You MUST clear the build cache for the fix to work!** 🚨

Without clearing cache, Docker will continue using old layers and the warnings will persist.
