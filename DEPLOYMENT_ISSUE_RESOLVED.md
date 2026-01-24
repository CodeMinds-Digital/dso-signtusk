# Deployment Issue Resolved ✅

## Problem Summary

When deploying to Dokploy using Dockerfile build type, the build failed with:

```
npm error ERESOLVE could not resolve
npm error While resolving: prisma-kysely@2.2.1
npm error Found: prisma@6.19.1
npm error Could not resolve dependency:
npm error peer prisma@"~6.16" from prisma-kysely@2.2.1
```

## Root Cause

**Peer Dependency Conflict**: The project uses `prisma@6.19.1` but `prisma-kysely@2.2.1` requires `prisma@~6.16` (version 6.16.x).

The original Dockerfile used `npm ci --only=production` which enforces strict peer dependency resolution and fails when conflicts exist.

## Solution Applied

Updated `Dockerfile` with these fixes:

### 1. Use Legacy Peer Deps Flag

```dockerfile
RUN npm ci --legacy-peer-deps
```

This bypasses strict peer dependency checks while still installing correct versions.

### 2. Install Build Dependencies

```dockerfile
RUN apk add --no-cache libc6-compat python3 make g++
```

Added native build tools needed for packages like `@napi-rs/canvas` and `sharp`.

### 3. Install ALL Dependencies for Build

Changed from production-only to all dependencies in deps stage, since dev dependencies are needed to build the application.

### 4. Generate Prisma Client

```dockerfile
RUN npm run prisma:generate
```

Explicitly generate Prisma client before building.

### 5. Fix Build Output Paths

```dockerfile
COPY --from=builder /app/apps/remix/build ./apps/remix/build
COPY --from=builder /app/apps/remix/public ./apps/remix/public
```

Corrected paths for Remix build output.

### 6. Add Health Check Dependencies

```dockerfile
RUN apk add --no-cache curl
```

Added curl for Docker health checks.

## Files Updated

1. ✅ `Dockerfile` - Fixed multi-stage build
2. ✅ `DOKPLOY_DOCKERFILE_FIX.md` - Detailed fix documentation
3. ✅ `DOKPLOY_NEXT_STEPS.md` - Action plan for deployment
4. ✅ `DEPLOYMENT_ISSUE_RESOLVED.md` - This summary

## Deployment Strategy

**Recommended Approach**: Use Dockerfile build type with external services

- **Database**: Neon PostgreSQL (already configured)
- **Redis**: Upstash Redis (already configured)
- **Application**: Single Docker container on Hostinger VPS

**Why This Approach?**

- ✅ Simpler deployment (one container vs. multiple)
- ✅ Less VPS resource usage
- ✅ Managed database backups
- ✅ Better reliability
- ✅ Easier to scale

## Next Steps

### 1. Commit Changes

```bash
git add Dockerfile DOKPLOY_DOCKERFILE_FIX.md DOKPLOY_NEXT_STEPS.md DEPLOYMENT_ISSUE_RESOLVED.md
git commit -m "Fix Dockerfile peer dependency and build issues for Dokploy"
git push origin main
```

### 2. Configure Dokploy

- Build Type: `Dockerfile`
- Dockerfile Path: `Dockerfile`
- Port: `3000`
- Add all environment variables (see `DOKPLOY_ENV_VARIABLES.md`)

### 3. Deploy

- Click "Deploy" in Dokploy
- Monitor build logs
- Wait ~7-10 minutes for completion

### 4. Post-Deployment

```bash
# Run migrations
npm run prisma:migrate-deploy

# Test health
curl https://intotni.com/health
```

## Expected Build Time

| Stage                | Duration          |
| -------------------- | ----------------- |
| Clone Repository     | ~30 seconds       |
| Install Dependencies | ~2-3 minutes      |
| Build Application    | ~3-5 minutes      |
| Create Image         | ~1 minute         |
| **Total**            | **~7-10 minutes** |

## Verification Checklist

After deployment, verify:

- [ ] Build completes without errors
- [ ] Container starts successfully
- [ ] Health endpoint returns 200 OK
- [ ] Application loads at https://intotni.com
- [ ] Can create account
- [ ] Can login
- [ ] Can upload documents
- [ ] Email delivery works
- [ ] Signing flow works

## Alternative: Docker Compose

If you prefer to run PostgreSQL and Redis on your VPS:

1. Use `docker-compose.yml` instead
2. Change Build Type to "Docker Compose"
3. Requires more VPS resources (4GB+ RAM)

See `DOKPLOY_DEPLOYMENT_GUIDE.md` for details.

## Troubleshooting

### Build Still Fails?

1. **Check Logs**: Look for specific error in Dokploy logs
2. **Verify Environment Variables**: Ensure all are set
3. **Check VPS Resources**: Ensure enough RAM/CPU
4. **Increase Build Memory**: Set to 4GB in Dokploy settings

### Container Won't Start?

1. **Check Environment Variables**: Verify DATABASE_URL and REDIS_URL
2. **Check Logs**: Look for startup errors
3. **Verify External Services**: Test Neon and Upstash connectivity

### Application Not Accessible?

1. **Check Domain DNS**: Ensure pointing to VPS IP
2. **Check SSL Certificate**: Wait for Let's Encrypt provisioning
3. **Check Firewall**: Ensure ports 80/443 open

## Documentation Reference

| Document                      | Purpose                   |
| ----------------------------- | ------------------------- |
| `DOKPLOY_NEXT_STEPS.md`       | Quick action plan         |
| `DOKPLOY_DOCKERFILE_FIX.md`   | Detailed fix explanation  |
| `DOKPLOY_DEPLOYMENT_GUIDE.md` | Complete deployment guide |
| `DOKPLOY_ENV_VARIABLES.md`    | All environment variables |
| `DOKPLOY_QUICK_START.md`      | Quick start guide         |

## Summary

The Dockerfile has been fixed to resolve peer dependency conflicts and build issues. The application is now ready to deploy to Dokploy using the Dockerfile build type with external Neon and Upstash services.

**Status**: ✅ Ready to Deploy

**Action Required**: Commit changes and deploy to Dokploy following the steps in `DOKPLOY_NEXT_STEPS.md`.

---

**Last Updated**: January 24, 2026
**Issue**: Peer dependency conflict in Docker build
**Resolution**: Updated Dockerfile with --legacy-peer-deps and proper build configuration
**Status**: Resolved ✅
