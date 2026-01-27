# ✅ Action Checklist: Fix Document Processing

## 🎯 Goal

Get documents to complete successfully after all recipients sign.

## 📊 Current Status

- ❌ Native module not loading (primary issue)
- ✅ Certificate configured in environment variable
- ✅ Dockerfile has all necessary fixes
- ❌ Docker cache preventing fixes from being applied

---

## 🚀 Step-by-Step Fix

### Step 1: Clear Docker Build Cache ⏱️ 2 minutes

**Option A: Via Dokploy Dashboard (Easiest)**

- [ ] Log into Dokploy dashboard
- [ ] Navigate to your signtusk application
- [ ] Find "Build Settings" or "Advanced Settings"
- [ ] Enable "Build without cache" or "Force rebuild"
- [ ] Click "Deploy" button

**Option B: Via SSH (Most Reliable)**

```bash
# SSH into Dokploy server
ssh user@your-dokploy-server

# Clear all build cache
docker builder prune -af

# Remove old images
docker images | grep signtusk | awk '{print $3}' | xargs docker rmi -f

# Exit SSH
exit
```

- [ ] SSH into Dokploy server
- [ ] Run cache clear commands
- [ ] Go to Dokploy dashboard and click "Deploy"

---

### Step 2: Monitor Build ⏱️ 10-15 minutes

Watch the build logs for these success indicators:

- [ ] ✅ "Installing Rust toolchain"
- [ ] ✅ "info: downloading installer"
- [ ] ✅ "Rust is installed now"
- [ ] ✅ "Adding x86_64-unknown-linux-gnu target"
- [ ] ✅ "Compiling pdf-sign"
- [ ] ✅ "Finished release [optimized] target"
- [ ] ✅ "Native module ready for Linux x64 GNU"
- [ ] ✅ Build completes successfully

**Red Flags (means cache wasn't cleared):**

- [ ] ❌ "Using cache" for Rust installation steps
- [ ] ❌ Build completes in < 5 minutes
- [ ] ❌ No "Compiling pdf-sign" message

If you see red flags, go back to Step 1 and try the SSH method.

---

### Step 3: Verify Deployment ⏱️ 2 minutes

After deployment completes:

- [ ] Application starts successfully
- [ ] No immediate errors in logs
- [ ] Health check passes: `curl https://your-domain.com/health`

Check startup logs for:

- [ ] ✅ "Starting Signtusk..."
- [ ] ✅ "Database migrations completed successfully"
- [ ] ✅ "Starting Signtusk server..."
- [ ] ⚠️ "Certificate not found at /opt/signtusk/cert.p12" (expected, ignore this)

---

### Step 4: Test Document Signing ⏱️ 5 minutes

**Create Test Document:**

- [ ] Log into application
- [ ] Click "New Document"
- [ ] Upload a PDF file
- [ ] Add a recipient (use a test email you control)
- [ ] Add signature field
- [ ] Click "Send"

**Sign as Recipient:**

- [ ] Open signing link (check email or copy from UI)
- [ ] Draw/type signature
- [ ] Click "Complete"

**Verify Completion:**

- [ ] Document status changes to "COMPLETED"
- [ ] Download button appears
- [ ] Downloaded PDF contains signature

---

### Step 5: Check Logs ⏱️ 2 minutes

After signing, check the application logs for:

**Success Indicators:**

- [ ] ✅ `[COMPLETE-DOCUMENT] All recipients have signed`
- [ ] ✅ `[COMPLETE-DOCUMENT] Triggering seal-document job`
- [ ] ✅ `[SEAL-DOCUMENT] Starting seal-document job`
- [ ] ✅ `[SEAL-DOCUMENT] PDF loaded successfully`
- [ ] ✅ `[SEAL-DOCUMENT] PDF saved, size: 15467 bytes` (or similar)
- [ ] ✅ `[SEAL-DOCUMENT] PDF signed successfully`
- [ ] ✅ `[SEAL-DOCUMENT] Status updated to COMPLETED`

**Failure Indicators (if you see these, something went wrong):**

- [ ] ❌ `Error: Cannot find module '@signtusk/pdf-sign-linux-x64-gnu'`
- [ ] ❌ `Error: Failed to get private key bags`
- [ ] ❌ `Error: Failed to decode certificate contents`

---

## 🔍 Verification Commands

### Check if Native Module Exists

```bash
# SSH into Dokploy server
ssh user@your-dokploy-server

# Get container ID
docker ps | grep signtusk

# Check for native module
docker exec -it <container-id> ls -la /app/packages/pdf-sign/*.node

# Should see:
# pdf-sign.linux-x64-gnu.node
```

- [ ] Native module file exists

### Check Environment Variables

```bash
# Check certificate is set
docker exec -it <container-id> sh -c 'echo $NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS | wc -c'

# Should show a large number (> 1000)
```

- [ ] Certificate environment variable is set
- [ ] Certificate size is > 1000 characters

### Watch Logs in Real-Time

```bash
# Follow logs
docker logs -f <container-id>

# Or in Dokploy dashboard, click "Logs" tab
```

- [ ] Logs show seal-document job running
- [ ] No "Cannot find module" errors

---

## 📈 Success Criteria

You'll know everything is working when:

1. ✅ Build takes 10-15 minutes (not 2-5 minutes)
2. ✅ Build logs show Rust installation and native module compilation
3. ✅ Application starts without errors
4. ✅ Document signing completes successfully
5. ✅ Document status changes to COMPLETED
6. ✅ Logs show seal-document job completing successfully
7. ✅ Downloaded PDF contains the signature

---

## 🆘 Troubleshooting

### Issue: Build Still Uses Cache

**Symptoms:**

- Build completes in < 5 minutes
- No "Installing Rust" in logs
- "Using cache" messages for all steps

**Solution:**

```bash
# Nuclear option - remove everything
docker system prune -af --volumes
docker builder prune -af

# Restart Docker
sudo systemctl restart docker

# Redeploy from Dokploy
```

### Issue: Native Module Still Not Found

**Symptoms:**

- Build shows Rust installation
- But logs still show "Cannot find module"

**Solution:**

```bash
# Check if module was actually built
docker exec -it <container> find /app -name "*.node"

# If not found, check build logs for compilation errors
# Look for "error:" or "failed" in build output
```

### Issue: Certificate Error After Native Module Works

**Symptoms:**

- seal-document job runs
- PDF loads successfully
- But fails at signing step

**Solution:**

```bash
# Verify certificate format
docker exec -it <container> sh -c 'echo $NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS | base64 -d | file -'

# Should show "data" or "PKCS12"

# Verify passphrase is set
docker exec -it <container> sh -c 'echo $NEXT_PRIVATE_SIGNING_PASSPHRASE'

# Should show your passphrase
```

---

## 📞 Quick Reference

### Dokploy Dashboard URLs

- Application: `https://your-dokploy.com/applications/signtusk`
- Logs: `https://your-dokploy.com/applications/signtusk/logs`
- Settings: `https://your-dokploy.com/applications/signtusk/settings`

### Important Files

- Dockerfile: `Dockerfile.production`
- Startup Script: `docker/start.sh`
- Certificate Handler: `packages/signing/transports/local-cert.ts`
- Native Module: `packages/pdf-sign/index.js`

### Environment Variables

- `NEXT_PRIVATE_SIGNING_LOCAL_FILE_CONTENTS` - Base64 encoded certificate
- `NEXT_PRIVATE_SIGNING_PASSPHRASE` - Certificate passphrase
- `NEXT_PRIVATE_SIGNING_TRANSPORT_METHOD` - Should be "local"

---

## ⏱️ Estimated Timeline

| Step        | Duration       | Status |
| ----------- | -------------- | ------ |
| Clear cache | 2 min          | ⬜     |
| Build       | 10-15 min      | ⬜     |
| Deploy      | 2 min          | ⬜     |
| Test        | 5 min          | ⬜     |
| Verify      | 2 min          | ⬜     |
| **Total**   | **~20-25 min** | ⬜     |

---

## 🎉 Success!

When you see this in the logs, you're done:

```
[SEAL-DOCUMENT] PDF signed successfully
[SEAL-DOCUMENT] Status updated to COMPLETED
Document completed!
```

And in the UI:

- Document status: ✅ COMPLETED
- Download button: ✅ Available
- PDF contains: ✅ Signature

---

**Ready? Start with Step 1: Clear Docker Build Cache!** 🚀
