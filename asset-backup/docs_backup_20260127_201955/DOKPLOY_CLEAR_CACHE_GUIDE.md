# 🧹 How to Clear Docker Build Cache in Dokploy

## Problem

Docker is using cached layers from previous builds, preventing new Dockerfile instructions (like Rust installation and native module compilation) from executing.

---

## Solution 1: Via Dokploy Dashboard (Easiest)

### Step 1: Access Your Application

1. Log into Dokploy dashboard
2. Navigate to your application (signtusk)

### Step 2: Find Build Settings

Look for one of these options:

- **"Build Settings"** tab
- **"Advanced Settings"** section
- **"Deployment Options"** menu

### Step 3: Enable No-Cache Build

Look for options like:

- ☑️ "Build without cache"
- ☑️ "Clear build cache"
- ☑️ "Force rebuild"
- ☑️ "No cache"

### Step 4: Redeploy

Click "Deploy" or "Redeploy" button

---

## Solution 2: Via Docker CLI (Most Reliable)

### Step 1: SSH into Dokploy Server

```bash
ssh user@your-dokploy-server.com
```

### Step 2: Clear All Build Cache

```bash
# Clear builder cache (recommended)
docker builder prune -af

# Clear all unused data (more aggressive)
docker system prune -af

# Clear specific application images
docker images | grep signtusk | awk '{print $3}' | xargs docker rmi -f
```

### Step 3: Redeploy from Dashboard

Go back to Dokploy dashboard and trigger a new deployment.

---

## Solution 3: Force Rebuild via Git

### Step 1: Make a Trivial Change

```bash
# Add a comment to Dockerfile to force rebuild
echo "# Force rebuild $(date)" >> Dockerfile.production

# Commit and push
git add Dockerfile.production
git commit -m "chore: Force Docker rebuild"
git push origin main
```

### Step 2: Redeploy

Trigger deployment from Dokploy dashboard.

---

## Verification: How to Know Cache Was Cleared

### During Build

Watch the build logs. You should see:

```
Step 1/50 : FROM node:22-bookworm-slim AS base
 ---> Pulling from library/node
 ---> [downloading layers]

Step 10/50 : RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
 ---> Running in [new container id]
info: downloading installer
```

**BAD SIGN** (cache still being used):

```
Step 10/50 : RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
 ---> Using cache
 ---> [cached layer id]
```

### After Build

Check the application logs:

**SUCCESS:**

```
[SEAL-DOCUMENT] PDF loaded successfully
[SEAL-DOCUMENT] PDF saved, size: 15467 bytes
```

**FAILURE (cache not cleared):**

```
Error: Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'
```

---

## Common Dokploy Cache Locations

If you have SSH access, you can manually clear these:

```bash
# Dokploy build cache
rm -rf /var/lib/dokploy/cache/*

# Docker build cache
docker builder prune -af

# Docker images
docker image prune -af

# Everything (nuclear option)
docker system prune -af --volumes
```

---

## Troubleshooting

### Issue: "Permission Denied"

```bash
# Use sudo
sudo docker builder prune -af
```

### Issue: "Cannot connect to Docker daemon"

```bash
# Check Docker is running
sudo systemctl status docker

# Start Docker if needed
sudo systemctl start docker
```

### Issue: "Still using cache after clearing"

```bash
# Nuclear option - remove everything
docker system prune -af --volumes

# Remove specific images
docker images -a | grep signtusk | awk '{print $3}' | xargs docker rmi -f

# Restart Docker daemon
sudo systemctl restart docker
```

---

## Quick Command Reference

```bash
# Clear build cache only
docker builder prune -af

# Clear all unused Docker data
docker system prune -af

# Clear everything including volumes
docker system prune -af --volumes

# Remove specific application images
docker images | grep signtusk | awk '{print $3}' | xargs docker rmi -f

# Check disk space before/after
df -h
docker system df
```

---

## Expected Results

### Before Cache Clear:

- Build completes in ~2-5 minutes (using cache)
- Native module NOT built
- seal-document job fails with "Cannot find module"

### After Cache Clear:

- Build takes ~10-15 minutes (no cache)
- Rust toolchain installed
- Native module compiled
- seal-document job runs successfully
- Only certificate error remains

---

## 🎯 Success Checklist

After clearing cache and redeploying:

- [ ] Build logs show "Installing Rust toolchain"
- [ ] Build logs show "Building native module"
- [ ] Build logs show "Native module ready for Linux x64 GNU"
- [ ] Application starts successfully
- [ ] seal-document job runs (doesn't fail immediately)
- [ ] Logs show "PDF loaded successfully"
- [ ] Only certificate error remains (expected)

---

## Next Steps After Cache Clear

Once the native module is working:

1. ✅ Verify seal-document job runs
2. ✅ Verify PDF decoration works
3. ⏭️ Add certificate (see CERTIFICATE_SETUP_GUIDE.md)
4. ⏭️ Test complete document signing workflow

---

**Remember:** Clearing cache is essential because Docker will reuse old layers that don't include the Rust toolchain or native module compilation steps!
