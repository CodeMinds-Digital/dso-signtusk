# Dokploy Quick Start Guide

## ✅ What Was Fixed

The `docker-compose.yml` file has been updated to use environment variable placeholders (`${VAR_NAME}`) instead of hardcoded values. This allows Dokploy to inject the values you configure in its Environment Variables section.

## 🚀 Quick Deployment Steps

### 1. Push Updated Files to Git

```bash
git add docker-compose.yml DOKPLOY_ENV_VARIABLES.md DOKPLOY_QUICK_START.md
git commit -m "Update docker-compose.yml to use Dokploy environment variables"
git push
```

### 2. Configure Dokploy Application

**In Dokploy Dashboard:**

1. **General Tab**:
   - Build Type: `Docker Compose`
   - Compose File: `docker-compose.yml`
   - Port: `3000`

2. **Environment Tab**:
   - Copy all variables from `DOKPLOY_ENV_VARIABLES.md`
   - Use "Bulk Add" feature for faster setup
   - **Important**: Update URL variables to your domain (`intotni.com`)

3. **Domains Tab**:
   - Add your domain: `intotni.com`
   - Enable SSL/TLS
   - Add www redirect if needed

### 3. Deploy

Click **"Deploy"** button and monitor logs.

## 📋 Environment Variables Summary

The `docker-compose.yml` now expects these variables from Dokploy:

### Core Services (Internal Docker)

- `DATABASE_URL` → Points to internal PostgreSQL container
- `REDIS_URL` → Points to internal Redis container
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` → Database credentials

### External Services

- AWS S3 credentials (8 variables)
- Resend email API (5 variables)
- Stripe payment (3 variables)
- PostHog analytics (2 variables)
- Sentry monitoring (2 variables)

### Application Config

- Security keys (7 variables)
- URLs (6 variables - **UPDATE THESE!**)
- Feature flags (3 variables)

**Total**: ~48 variables

See `DOKPLOY_ENV_VARIABLES.md` for the complete list with values.

## 🔍 How It Works

### Before (Hardcoded):

```yaml
environment:
  - DATABASE_URL=postgresql://postgres:password@database:5432/signtusk
```

### After (Dynamic):

```yaml
environment:
  - DATABASE_URL=${DATABASE_URL}
```

Dokploy will inject the value you set in the Environment tab.

## ⚠️ Important Notes

### Database Connection

- Uses internal Docker network
- Hostname: `database` (not `localhost`)
- Port: `5432` (internal)
- Example: `postgresql://postgres:changeme123@database:5432/signtusk`

### Redis Connection

- Uses internal Docker network
- Hostname: `redis` (not `localhost`)
- Port: `6379` (internal)
- Example: `redis://redis:6379`

### URLs Must Be Updated

Replace all instances of `yourdomain.com` with your actual domain:

```bash
NEXT_PUBLIC_WEBAPP_URL=https://intotni.com
NEXT_PUBLIC_APP_URL=https://intotni.com
ALLOWED_ORIGINS=https://intotni.com
# ... etc
```

## 🎯 Deployment Checklist

- [ ] Push updated `docker-compose.yml` to Git
- [ ] Add all environment variables in Dokploy
- [ ] Update URL variables to your domain
- [ ] Configure domain in Dokploy
- [ ] Enable SSL/TLS
- [ ] Deploy application
- [ ] Run database migrations (see below)
- [ ] Test application health

## 🗄️ Post-Deployment: Database Setup

After first successful deployment:

1. Go to Dokploy **Terminal** tab
2. Select `app` container
3. Run migrations:

```bash
npm run prisma:migrate-deploy
npm run prisma:seed
```

## 🔧 Troubleshooting

### Build Fails

- Check all environment variables are set
- Verify no typos in variable names
- Check Dokploy logs for specific errors

### Database Connection Error

- Verify `DATABASE_URL` uses `database` as hostname
- Check `POSTGRES_PASSWORD` matches in both places
- Ensure database container is healthy

### Application Won't Start

- Check logs in Dokploy
- Verify all required env vars are set
- Check port 3000 is not in use

### SSL Certificate Issues

- Ensure domain DNS points to VPS IP
- Wait 5-10 minutes for DNS propagation
- Check Dokploy certificate logs

## 📊 Verify Deployment

### Health Check

```bash
curl https://intotni.com/health
```

Should return: `{"status":"ok"}`

### Check Logs

In Dokploy:

1. Go to **Logs** tab
2. Select service (app, database, redis)
3. View real-time logs

### Monitor Resources

In Dokploy:

1. Go to **Monitoring** tab
2. Check CPU, Memory, Disk usage

## 🎉 Success!

Once deployed, your application will be available at:

- **Main App**: `https://intotni.com`
- **Health Check**: `https://intotni.com/health`
- **API**: `https://intotni.com/api`
- **Swagger Docs**: `https://intotni.com/api/swagger`

## 📚 Additional Resources

- Full deployment guide: `DOKPLOY_DEPLOYMENT_GUIDE.md`
- Environment variables reference: `DOKPLOY_ENV_VARIABLES.md`
- Dokploy documentation: https://docs.dokploy.com

---

**Need Help?** Check the logs in Dokploy or review the troubleshooting section above.
