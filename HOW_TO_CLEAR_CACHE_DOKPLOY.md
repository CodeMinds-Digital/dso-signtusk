# 🔄 How to Clear Build Cache in Dokploy

**CRITICAL:** You MUST clear the build cache for the fixes to work!

---

## 🎯 Why Clear Cache?

Your Dockerfile changes won't be applied without clearing cache because:

- Docker reuses old layers
- Old `package.json` is cached
- TypeScript warnings persist
- Document completion might still fail

---

## 📋 Step-by-Step Guide

### Method 1: Using Dokploy UI (Easiest)

#### Step 1: Go to Your Application

1. Open Dokploy Dashboard in your browser
2. Navigate to your Signtusk application
3. You should see the application overview

#### Step 2: Find Cache Settings

Look for one of these locations:

- **"Advanced" tab** at the top
- **"Settings" section** in the sidebar
- **"Build Settings"** menu
- **"Docker" section**

#### Step 3: Clear Cache

1. Look for a button labeled:
   - "Clear Build Cache"
   - "Clear Cache"
   - "Rebuild from Scratch"
   - "Force Rebuild"

2. **Click the button**

3. You should see a confirmation message:
   - "Cache cleared successfully"
   - "Build cache removed"

#### Step 4: Redeploy

1. Click the **"Redeploy"** or **"Deploy"** button
2. Monitor the build logs
3. Build should take longer (~10-15 minutes) because it's building from scratch

---

### Method 2: Delete and Recreate (Most Reliable)

If you can't find the cache clear button:

#### Step 1: Note Your Settings

Before deleting, write down:

- Application name
- Repository URL
- Branch name
- Build settings
- Environment variables

#### Step 2: Delete Application

1. Go to your application in Dokploy
2. Find the **"Delete"** or **"Remove"** button
3. Confirm deletion
4. Wait for application to be removed

#### Step 3: Create New Application

1. Click **"New Application"** or **"Add Application"**
2. Enter the same settings:
   - **Name:** signtusk (or your app name)
   - **Repository:** Your GitHub repo URL
   - **Branch:** dokploy-deploy
   - **Build Type:** Dockerfile
   - **Dockerfile Path:** Dockerfile.production
   - **Build Path:** `/`
   - **Docker Context:** `.`

3. Add all environment variables (copy from DOKPLOY_ENV_VARS.txt)

4. Click **"Create"** and **"Deploy"**

---

### Method 3: SSH into Server (Advanced)

If you have SSH access to the Dokploy server:

```bash
# 1. SSH into your server
ssh user@your-server.com

# 2. Remove all Docker build cache
docker builder prune -af

# 3. Confirm
# This will remove:
#   - All build cache
#   - Unused build stages
#   - Dangling images

# 4. Go back to Dokploy UI and click "Redeploy"
```

---

## 🔍 How to Verify Cache Was Cleared

### Check Build Time

**With Cache (Wrong):**

```
Build started: 10:00:00
Build completed: 10:02:30
Duration: ~2-3 minutes
```

**Without Cache (Correct):**

```
Build started: 10:00:00
Build completed: 10:12:45
Duration: ~10-15 minutes
```

If your build completes in less than 5 minutes, **cache was NOT cleared!**

### Check Build Logs

**With Cache (Wrong):**

```
[installer 10/12] RUN cd packages/pdf-processing && npm run build
CACHED
```

**Without Cache (Correct):**

```
[installer 10/12] RUN cd packages/pdf-processing && npm run build
> @signtusk/pdf-processing@0.1.0 build
> tsc
✅ Compiling TypeScript...
```

### Check for TypeScript Warnings

**With Cache (Wrong):**

```
❌ (!) [plugin typescript] Cannot find module '@signtusk/pdf-processing'
```

**Without Cache (Correct):**

```
✅ No TypeScript warnings
✅ created build/server/hono in 31.7s
```

---

## 🆘 Troubleshooting

### "I can't find the Clear Cache button"

Try these locations in Dokploy:

1. Application → Advanced → Clear Cache
2. Application → Settings → Build → Clear Cache
3. Application → Docker → Clear Cache
4. Application → Actions → Clear Cache

If you still can't find it:
→ Use **Method 2** (Delete and Recreate)

### "Cache clear didn't work"

If you cleared cache but still see warnings:

1. **Verify changes were pushed:**

   ```bash
   git log -1 --oneline
   # Should show your latest commit
   ```

2. **Verify Dokploy is pulling latest code:**
   - Check deployment logs
   - Should show latest commit hash

3. **Try Method 2** (Delete and Recreate)

### "Build is still fast (< 5 minutes)"

This means cache wasn't cleared. Try:

1. **Force rebuild by changing Dockerfile:**

   ```dockerfile
   # Add this line at the top
   # Cache bust: 2026-01-26
   ```

2. **Commit and push**

3. **Redeploy**

---

## ✅ Success Indicators

After clearing cache and redeploying:

### Build Logs

```
✅ [installer 10/12] RUN cd packages/pdf-processing && npm run build
✅ > @signtusk/pdf-processing@0.1.0 build
✅ > tsc
✅ [installer 11/12] RUN npx turbo run build
✅ @signtusk/pdf-processing:build: cache hit
✅ created build/server/hono in 31.7s
✅ [Build]: Done!
✅ NO TypeScript warnings
```

### Application Logs

```
✅ 🚀 Starting Signtusk...
✅ 🗄️  Running database migrations...
✅ ✅ Database migrations completed successfully
✅ 🌟 Starting Signtusk server...
```

### Document Completion

```
✅ Create document → Add signer → Send → Sign
✅ Status changes to COMPLETED automatically
✅ Completion emails sent
```

---

## 📋 Quick Checklist

Before clearing cache:

- [ ] Committed all changes
- [ ] Pushed to dokploy-deploy branch
- [ ] Verified latest commit is pushed

Clearing cache:

- [ ] Found cache clear button in Dokploy
- [ ] Clicked "Clear Build Cache"
- [ ] Saw confirmation message
- [ ] Clicked "Redeploy"

After deployment:

- [ ] Build took 10-15 minutes (not 2-3 minutes)
- [ ] No TypeScript warnings in build logs
- [ ] Application started successfully
- [ ] Document completion works

---

## 💡 Remember

**Cache is good for speed, bad for changes!**

- ✅ Use cache for regular deployments (no changes)
- ❌ Clear cache when changing:
  - Dependencies
  - Package structure
  - Build configuration
  - Dockerfile

**When in doubt, clear the cache!** 🔄

---

## 🚀 Next Steps

After clearing cache and deploying:

1. **Test document completion**
2. **Fix any stuck documents:**
   ```bash
   npm run with:env -- tsx scripts/fix-stuck-documents.ts
   ```
3. **Monitor for issues**
4. **Celebrate!** 🎉

---

**IMPORTANT: Don't skip clearing cache! It's the most critical step!** 🚨
