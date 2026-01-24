# Dokploy Configuration Fix Guide

## 🚨 The Problem

Dokploy is treating `docker-compose.yml` as a Dockerfile instead of a Docker Compose file. This causes the error:

```
ERROR: failed to solve: dockerfile parse error on line 4: unknown instruction: services:
```

## ✅ The Solution

You need to change the **Build Type** in Dokploy from "Dockerfile" to "Docker Compose".

## 📋 Step-by-Step Fix

### 1. In Dokploy Dashboard

1. Go to your application: **intotni-signtusk**
2. Click on **"General"** tab
3. Look for **"Build Type"** or **"Source Type"** setting
4. Change from **"Dockerfile"** to **"Docker Compose"**
5. Set **"Compose File Path"**: `docker-compose.yml`

### 2. Verify Settings

Make sure these are configured:

```yaml
Build Type: Docker Compose
Compose File: docker-compose.yml
Build Path: . (root directory)
Port: 3000
```

### 3. Save and Redeploy

1. Click **"Save"** or **"Update"**
2. Click **"Redeploy"**
3. Monitor the logs

## 🧪 Test Locally First

Before deploying to Dokploy, test your docker-compose.yml locally:

### Test 1: Validate Syntax

```bash
docker-compose config
```

This should show your parsed configuration without errors.

### Test 2: Build Images

```bash
docker-compose build
```

This will build the Docker images defined in your compose file.

### Test 3: Start Services (Optional)

```bash
# Start in detached mode
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

## 🔍 Alternative: Use Dockerfile Build Type

If Dokploy doesn't support Docker Compose properly, you can use **Dockerfile** build type with external services:

### In Dokploy:

1. **Build Type**: `Dockerfile`
2. **Dockerfile Path**: `Dockerfile`
3. **Port**: `3000`

### Update Environment Variables:

Use **external services** instead of internal Docker containers:

```bash
# Use Neon Database (already configured)
DATABASE_URL=postgresql://neondb_owner:npg_7Zyqa2nNKJcl@ep-round-river-a1cizlzb-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Use Upstash Redis (already configured)
REDIS_URL=redis://default:ASkIAAIncDE3NGY2ZWZjMmQ5ODM0MjBjOGI5ZWYzZmE2ODVkNmRmZHAxMTA1MDQ@set-panther-10504.upstash.io:6379
```

This way, you only deploy the app container, and use external managed services for database and Redis.

## 📝 Dokploy Configuration Checklist

### Option 1: Docker Compose (Recommended)

- [ ] Build Type: **Docker Compose**
- [ ] Compose File: `docker-compose.yml`
- [ ] Environment variables added (48 variables)
- [ ] Domain configured
- [ ] SSL enabled

### Option 2: Dockerfile Only (Simpler)

- [ ] Build Type: **Dockerfile**
- [ ] Dockerfile Path: `Dockerfile`
- [ ] Port: `3000`
- [ ] Use external DATABASE_URL (Neon)
- [ ] Use external REDIS_URL (Upstash)
- [ ] Environment variables added
- [ ] Domain configured
- [ ] SSL enabled

## 🎯 Recommended Approach

**Use Option 2 (Dockerfile Only)** because:

- ✅ Simpler deployment
- ✅ Less VPS resource usage
- ✅ Managed database backups (Neon)
- ✅ Managed Redis (Upstash)
- ✅ Better for Hostinger VPS limitations
- ✅ Dokploy handles it better

## 🔧 Quick Fix Commands

### If you want to test locally:

```bash
# Validate docker-compose.yml
docker-compose config

# Build without starting
docker-compose build --no-cache

# Check for syntax errors
docker-compose -f docker-compose.yml config --quiet && echo "✅ Valid" || echo "❌ Invalid"
```

### If you want to use Dockerfile only:

```bash
# Test Dockerfile build
docker build -t signtusk-test .

# Run container
docker run -p 3000:3000 --env-file .env.vercel.local signtusk-test
```

## 📊 Comparison

| Feature         | Docker Compose          | Dockerfile Only         |
| --------------- | ----------------------- | ----------------------- |
| Complexity      | Higher                  | Lower                   |
| VPS Resources   | More (DB + Redis + App) | Less (App only)         |
| Setup Time      | Longer                  | Faster                  |
| Maintenance     | More                    | Less                    |
| Cost            | VPS only                | VPS + External services |
| Dokploy Support | Sometimes buggy         | Better support          |

## 🚀 Next Steps

1. **Choose your approach** (Docker Compose or Dockerfile)
2. **Configure Dokploy** accordingly
3. **Test locally** (optional but recommended)
4. **Deploy to Dokploy**
5. **Monitor logs**
6. **Run migrations** after successful deployment

## ⚠️ Important Notes

### For Docker Compose:

- Requires more VPS resources (4GB+ RAM)
- All services run on your VPS
- Full control over data

### For Dockerfile Only:

- Requires external services (Neon, Upstash)
- Less VPS resource usage (2GB RAM sufficient)
- Managed backups and scaling

## 📞 Need Help?

If deployment still fails:

1. Check Dokploy logs for specific errors
2. Verify all environment variables are set
3. Ensure domain DNS is configured
4. Try the Dockerfile-only approach
5. Check VPS resources (RAM, CPU, Disk)

---

**Recommendation**: Start with **Dockerfile Only** approach for easier deployment and better Dokploy compatibility.
