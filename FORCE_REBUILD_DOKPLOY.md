# 🔄 Force Rebuild in Dokploy - Fix Cached Build

Your Dockerfile changes are committed, but Dokploy is using a **cached Docker image** from before the fix.

---

## 🔍 The Problem

**Logs show:**

```
👥 GitHub: https://github.com/documenso/documenso  ❌ Old build!
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@react-email/render'
```

**This means:**

- Dokploy is using cached Docker layers
- The old Dockerfile (without workspace packages) is being used
- New changes aren't being applied

---

## ✅ Solution: Force Complete Rebuild

### Step 1: Commit Dockerfile Change

```bash
git add Dockerfile.production
git commit -m "fix: force rebuild - update Dockerfile timestamp to clear cache"
git push origin dokploy-deploy
```

### Step 2: Clear Build Cache in Dokploy

**Option A: Use Dokploy UI**

1. Go to Dokploy Dashboard
2. Select your application
3. Click **"Advanced"** or **"Settings"** tab
4. Look for **"Clear Build Cache"** button
5. Click it
6. Then click **"Redeploy"**

**Option B: Delete and Recreate**

1. Go to Dokploy Dashboard
2. **Delete** the current application
3. **Create new** application with same settings:
   - Build Path: `/`
   - Build Type: `Dockerfile`
   - Docker File: `Dockerfile.production`
   - Docker Context Path: `.`
4. Add all environment variables
5. Deploy

**Option C: Use Docker CLI (if you have access)**

```bash
# SSH into Dokploy server
ssh your-server

# Remove all Docker build cache
docker builder prune -af

# Or remove specific image
docker rmi $(docker images | grep signtusk | awk '{print $3}')

# Then redeploy in Dokploy UI
```

---

## 🎯 Verify the Fix

After rebuild, check the logs:

### Before (Cached - Wrong)

```
👥 GitHub: https://github.com/documenso/documenso  ❌
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@react-email/render'
```

### After (Fresh Build - Correct)

```
👥 GitHub: https://github.com/documenso/documenso  ✅ (will be fixed in next commit)
[No module errors - server starts successfully]
```

---

## 📝 Additional Fix: Update GitHub Link

The logs still show Documenso GitHub link. Let's fix that too:

**File:** `docker/start.sh`

Find this line:

```bash
printf "👥 GitHub: https://github.com/documenso/documenso\n\n"
```

Change to:

```bash
printf "👥 GitHub: https://github.com/your-org/signtusk\n\n"
```

Or remove it entirely:

```bash
# printf "👥 GitHub: https://github.com/documenso/documenso\n\n"
```

---

## 🚀 Complete Fix Steps

### 1. Update Dockerfile (Already Done)

```bash
# Already committed in previous step
git log -1 --oneline
# Should show: "fix: force rebuild..."
```

### 2. Update start.sh (Optional)

```bash
# Edit docker/start.sh
# Remove or update GitHub link
git add docker/start.sh
git commit -m "chore: update startup message"
git push origin dokploy-deploy
```

### 3. Force Rebuild in Dokploy

Choose one method:

- **Clear Build Cache** (easiest)
- **Delete and recreate** (most reliable)
- **Docker CLI prune** (if you have server access)

### 4. Monitor Deployment

Watch the logs:

```
🚀 Starting Signtusk...
🗄️  Running database migrations...
✅ Database migrations completed successfully
🌟 Starting Signtusk server...
📍 Server will be available at: http://0.0.0.0:3000
[Server should start without errors]
```

---

## 🔍 Why Docker Cache Causes This

### How Docker Caching Works

```dockerfile
# Layer 1: Base image
FROM node:22-bookworm-slim AS base
# ✅ Cached (unchanged)

# Layer 2: Install deps
RUN npm ci --omit=dev
# ❌ Cached (OLD version - this is the problem!)

# Layer 3: Copy build
COPY --from=installer /app/apps/remix/build ./apps/remix/build
# ✅ New (but uses old layer 2)
```

**The Problem:**

- Layer 2 is cached with old `npm ci --omit=dev`
- Even though we changed it to `npm ci --production=false`
- Docker doesn't rebuild because it thinks nothing changed

**The Solution:**

- Clear cache to force rebuild of all layers
- Or change something early in Dockerfile to invalidate cache

---

## 💡 Pro Tip: Invalidate Cache Automatically

Add a build arg that changes each build:

```dockerfile
# At the top of Dockerfile
ARG CACHEBUST=1

# Use it somewhere
RUN echo "Cache bust: ${CACHEBUST}"
```

Then in Dokploy, set:

```
Build Args: CACHEBUST=$(date +%s)
```

This forces a new build every time.

---

## 📊 Expected Timeline

### After Clearing Cache and Redeploying:

1. **Build starts** (0-2 min)
   - Pulls base image
   - Installs dependencies (no cache)
   - Builds application

2. **Build completes** (5-10 min)
   - Creates Docker image
   - Pushes to registry

3. **Deployment starts** (1-2 min)
   - Pulls new image
   - Starts container
   - Runs migrations

4. **Application ready** (30 sec)
   - Server starts
   - Health check passes
   - Domain accessible

**Total: ~10-15 minutes for complete rebuild**

---

## ✅ Success Indicators

### Logs Should Show:

```
🚀 Starting Signtusk...
🔐 Checking certificate configuration...
⚠️  Certificate not found or not readable at: /opt/signtusk/cert.p12
💡 Tip: Signtusk will still start, but document signing will be unavailable
📚 Useful Links:
🏥 Health check: http://localhost:3000/health
📊 API docs: http://localhost:3000/api/swagger
🗄️  Running database migrations...
Prisma schema loaded from ../../packages/prisma/schema.prisma
Datasource "db": PostgreSQL database "dso"
145 migrations found in prisma/migrations
No pending migrations to apply.
✅ Database migrations completed successfully
🌟 Starting Signtusk server...
📍 Server will be available at: http://0.0.0.0:3000

[No errors - server keeps running]
```

### Application Should:

- ✅ Be accessible at your domain
- ✅ Not show 502 Bad Gateway
- ✅ Allow user signup
- ✅ Send confirmation emails
- ✅ No module not found errors in logs

---

## 🆘 If Still Failing

### Check These:

1. **Verify latest commit is deployed**

   ```bash
   git log -1 --oneline
   # Should show your latest commit
   ```

2. **Check Dokploy is pulling latest code**
   - In Dokploy, verify branch is `dokploy-deploy`
   - Check last deployment time
   - Should be recent (after your push)

3. **Verify Dockerfile changes are in repo**

   ```bash
   git show HEAD:Dockerfile.production | grep "production=false"
   # Should show: RUN npm ci --production=false
   ```

4. **Check build logs in Dokploy**
   - Look for "npm ci --production=false"
   - Should NOT see "npm ci --omit=dev"

---

## 📋 Quick Checklist

- [ ] Dockerfile.production updated (committed)
- [ ] Changes pushed to dokploy-deploy branch
- [ ] Build cache cleared in Dokploy
- [ ] Redeployed application
- [ ] Build logs show new commands
- [ ] Server starts without errors
- [ ] Application accessible
- [ ] No 502 errors

---

**Next Action:** Clear build cache in Dokploy and redeploy!
