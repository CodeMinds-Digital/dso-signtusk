# Troubleshooting Guide - "It Worked Yesterday"

## 🚨 Current Issue Analysis

**Problem**: Application worked yesterday but not today
**Symptoms**: Docker commands not found, services not starting

## 🔍 Diagnostic Steps

### 1. Check Docker Installation

```bash
# Check if Docker is installed
which docker
docker --version

# Check if Docker Desktop is running (macOS/Windows)
docker info
```

**If Docker is not found:**
- **macOS**: Install Docker Desktop from https://docs.docker.com/desktop/mac/install/
- **Linux**: Install Docker Engine: `curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh`
- **Windows**: Install Docker Desktop from https://docs.docker.com/desktop/windows/install/

### 2. Check Docker Service Status

```bash
# macOS - Check if Docker Desktop is running
open -a Docker

# Linux - Check Docker service
sudo systemctl status docker
sudo systemctl start docker  # If not running

# Verify Docker is working
docker run hello-world
```

### 3. Environment State Check

```bash
cd docusign-alternative-implementation

# Check what processes are running on common ports
lsof -i :3000  # Remix app
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Check if any containers are running
docker ps -a  # (if Docker is available)
```

## 🛠️ Recovery Options

### Option 1: Docker-based Development (Recommended)

If Docker is available:

```bash
# 1. Start Docker Desktop (macOS/Windows)
open -a Docker  # macOS
# Or start Docker Desktop from Applications

# 2. Wait for Docker to be ready
docker info

# 3. Start development environment
npm run dev:setup    # One-time setup
npm run dev:start    # Start services
```

### Option 2: Local Development (No Docker)

If Docker isn't available, you can run without containers:

```bash
# 1. Install PostgreSQL locally
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib

# 2. Install Redis locally  
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server

# 3. Start local services
# PostgreSQL: brew services start postgresql (macOS)
# Redis: brew services start redis (macOS)

# 4. Update environment variables
cp .env.example .env.local
# Edit .env.local with local database URLs:
# DATABASE_URL=postgresql://postgres:password@localhost:5432/signtusk_dev
# REDIS_URL=redis://localhost:6379

# 5. Setup database
npm run prisma:migrate-dev
npm run prisma:seed

# 6. Start Remix app
cd apps/remix
npm run dev
```

### Option 3: SQLite Development (Simplest)

For quick testing without external dependencies:

```bash
# 1. Update database URL to use SQLite
echo 'DATABASE_URL="file:./dev.db"' > .env.local

# 2. Run migrations
npm run prisma:migrate-dev

# 3. Seed database
npm run prisma:seed

# 4. Start app
cd apps/remix
npm run dev
```

## 🔧 Common Issues & Solutions

### Issue: "Port already in use"

```bash
# Find and kill processes using ports
lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
lsof -ti:5432 | xargs kill -9  # Kill process on port 5432
```

### Issue: "Database connection failed"

```bash
# Check if database is running
pg_isready -h localhost -p 5432  # PostgreSQL
redis-cli ping  # Redis

# Reset database
npm run prisma:migrate-reset
npm run prisma:seed
```

### Issue: "Module not found" errors

```bash
# Clear and reinstall dependencies
rm -rf node_modules package-lock.json
npm ci

# Regenerate Prisma client
npm run prisma:generate
```

### Issue: "Authentication not working"

```bash
# Clear browser data
# In browser console:
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## 🚀 Quick Recovery Commands

### Full Reset (Nuclear Option)

```bash
# Stop everything
npm run dev:stop 2>/dev/null || true
pkill -f "node.*remix" || true
pkill -f "react-router" || true

# Clean everything
rm -rf node_modules package-lock.json
rm -rf apps/remix/.react-router
rm -rf apps/remix/build

# Fresh install
npm ci
npm run prisma:generate

# Start fresh
npm run dev:setup  # If Docker available
# OR
npm run dev       # Direct app start
```

### Quick Docker Fix

```bash
# If Docker is installed but not working
docker system prune -f  # Clean Docker
docker-compose -f docker-compose.dev.yml down -v  # Stop and remove volumes
npm run dev:setup  # Fresh setup
```

## 📋 Environment Verification Checklist

- [ ] Docker Desktop is running (if using Docker)
- [ ] Node.js version 18+ is installed
- [ ] npm is working correctly
- [ ] Ports 3000, 5432, 6379 are available
- [ ] Environment files (.env.development, .env.local) exist
- [ ] Database is accessible
- [ ] Prisma client is generated

## 🎯 Success Indicators

You'll know it's working when:

- ✅ `npm run dev:status` shows services running
- ✅ `curl http://localhost:3000/health` returns OK
- ✅ Browser loads http://localhost:3000 without errors
- ✅ Authentication flow works completely
- ✅ No console errors in browser DevTools

## 💡 Prevention Tips

1. **Always check Docker status** before starting development
2. **Use consistent environment** (same terminal, same directory)
3. **Keep environment files** (.env.development, .env.local) backed up
4. **Document your setup** if you make custom changes
5. **Use version control** for configuration changes

## 🆘 If Nothing Works

Try this minimal setup:

```bash
# 1. Use SQLite for simplicity
echo 'DATABASE_URL="file:./dev.db"' > .env.local
echo 'REDIS_URL=""' >> .env.local

# 2. Skip Redis-dependent features
echo 'ENABLE_REDIS=false' >> .env.local

# 3. Start just the app
cd apps/remix
npm run dev
```

---

**Most likely cause**: Docker Desktop stopped running or was uninstalled. Check Docker first!