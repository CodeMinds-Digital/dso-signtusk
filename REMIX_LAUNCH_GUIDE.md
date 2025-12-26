# Remix App Launch Guide - Signtusk Platform

## 🚨 Current Issue Analysis

You mentioned launching the Remix app but encountering an "already logged in account but not loaded" issue. This typically indicates:

1. **Session persistence issues** - Authentication state exists but user data isn't loading
2. **Database connection problems** - Session exists but user lookup fails
3. **Environment configuration issues** - Missing or incorrect environment variables
4. **Cache/cookie conflicts** - Stale authentication data

## 🔧 Pre-Launch Checklist

### 1. Environment Setup Verification

Before launching, ensure your environment is properly configured:

```bash
# Navigate to project root
cd docusign-alternative-implementation

# Check if environment files exist
ls -la .env*

# Verify environment variables are set
cat .env.development | grep -E "(DATABASE_URL|JWT_SECRET|SESSION_SECRET)"
```

**Required Environment Variables:**
```bash
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/signtusk_dev

# Authentication
JWT_SECRET=your-jwt-secret-key-that-is-at-least-32-characters-long
SESSION_SECRET=your-session-secret-key-that-is-at-least-32-characters-long
ENCRYPTION_KEY=your-encryption-key-32-characters

# App Configuration
NEXT_PUBLIC_WEB_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Database State Check

Verify your database is properly set up and accessible:

```bash
# Check if database container is running
docker-compose -f docker-compose.dev.yml ps database

# Test database connection
docker-compose -f docker-compose.dev.yml exec database psql -U postgres -d signtusk_dev -c "\dt"

# Check if user tables exist and have data
docker-compose -f docker-compose.dev.yml exec database psql -U postgres -d signtusk_dev -c "SELECT COUNT(*) FROM \"User\";"
```

### 3. Clear Authentication State

Before launching, clear any stale authentication data:

```bash
# Clear browser data (manual step)
# - Open browser DevTools (F12)
# - Go to Application/Storage tab
# - Clear all cookies for localhost:3000
# - Clear Local Storage
# - Clear Session Storage

# Or use incognito/private browsing mode
```

## 🚀 Proper Launch Sequence

### Option 1: Full Reset and Launch (Recommended)

```bash
# 1. Stop any running services
./scripts/dev-stop.sh

# 2. Reset the development environment
npm run dev:reset

# 3. Run the complete setup
./scripts/dev-setup.sh

# 4. Start services in the correct order
./scripts/dev-start.sh services

# 5. Wait for services to be ready (check logs)
docker-compose -f docker-compose.dev.yml logs -f database redis

# 6. Start the Remix app
cd apps/remix
npm run dev
```

### Option 2: Targeted Remix Launch

```bash
# 1. Ensure infrastructure services are running
docker-compose -f docker-compose.dev.yml up -d database redis mailhog

# 2. Navigate to Remix app
cd apps/remix

# 3. Install dependencies if needed
npm ci

# 4. Run database migrations
npm run db:migrate

# 5. Start Remix in development mode
npm run dev
```

### Option 3: Docker-based Launch

```bash
# Start everything with Docker Compose
docker-compose -f docker-compose.dev.yml up --build

# Or start in detached mode
docker-compose -f docker-compose.dev.yml up -d --build
```

## 🔍 Troubleshooting Authentication Issues

### Issue: "Already logged in but not loaded"

**Step 1: Check Session Storage**
```bash
# In browser DevTools Console:
console.log('Cookies:', document.cookie);
console.log('LocalStorage:', localStorage);
console.log('SessionStorage:', sessionStorage);
```

**Step 2: Verify Database User Data**
```bash
# Check if user exists in database
docker-compose -f docker-compose.dev.yml exec database psql -U postgres -d signtusk_dev -c "SELECT id, email, name FROM \"User\" LIMIT 5;"
```

**Step 3: Check Server Logs**
```bash
# View application logs
docker-compose -f docker-compose.dev.yml logs -f app

# Or if running locally:
cd apps/remix && npm run dev
# Check terminal output for errors
```

**Step 4: Test Authentication Endpoints**
```bash
# Test health endpoint
curl http://localhost:3000/health

# Test authentication status
curl -b cookies.txt http://localhost:3000/api/auth/me
```

### Common Fixes

1. **Clear All Authentication Data**
   ```javascript
   // Run in browser console
   document.cookie.split(";").forEach(function(c) { 
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
   });
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Reset Database Sessions**
   ```bash
   # Clear all sessions from database
   docker-compose -f docker-compose.dev.yml exec database psql -U postgres -d signtusk_dev -c "DELETE FROM \"Session\";"
   ```

3. **Regenerate Secrets**
   ```bash
   # Generate new secrets
   node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
   node -e "console.log('ENCRYPTION_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
   ```

## 🎯 Post-Launch Verification

### 1. Service Health Check

Visit these URLs to verify everything is working:

- **Application**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Database Admin**: http://localhost:8080 (login: postgres/password)
- **Email Testing**: http://localhost:8025
- **Redis Admin**: http://localhost:8081

### 2. Authentication Flow Test

1. **Clear browser data** (cookies, localStorage, sessionStorage)
2. **Visit** http://localhost:3000
3. **Should redirect** to sign-in page
4. **Create new account** or sign in with existing credentials
5. **Verify** successful authentication and dashboard access

### 3. Create Test User

If you need a clean test user:

```bash
# Option 1: Use the application UI
# - Go to http://localhost:3000/signup
# - Create account: test@example.com / TestPass123!

# Option 2: Direct database insert (if needed)
docker-compose -f docker-compose.dev.yml exec database psql -U postgres -d signtusk_dev -c "
INSERT INTO \"User\" (id, email, name, password, emailVerified, createdAt, updatedAt) 
VALUES (
  gen_random_uuid(), 
  'admin@test.local', 
  'Admin User', 
  '\$2b\$10\$hash_here', 
  NOW(), 
  NOW(), 
  NOW()
);"
```

## 🛠️ Development Workflow

### Daily Development Routine

```bash
# 1. Start development environment
./scripts/dev-start.sh

# 2. Open application
open http://localhost:3000

# 3. Start coding with hot reload enabled
cd apps/remix
npm run dev

# 4. Run tests when needed
npm run test

# 5. Stop when done
./scripts/dev-stop.sh
```

### Debugging Tools

1. **React DevTools** - Browser extension for React debugging
2. **Remix DevTools** - Built into development mode
3. **Database Browser** - Prisma Studio at http://localhost:5555
4. **Email Testing** - MailHog at http://localhost:8025
5. **API Testing** - Use curl or Postman for API endpoints

## 📋 Quick Commands Reference

```bash
# Environment Management
./scripts/dev-setup.sh          # Initial setup
./scripts/dev-start.sh           # Start all services
./scripts/dev-stop.sh            # Stop services
npm run dev:reset                # Reset environment

# Remix Development
cd apps/remix
npm run dev                      # Start Remix dev server
npm run build                    # Build for production
npm run typecheck               # TypeScript checking

# Database Operations
npm run db:migrate              # Run migrations
npm run db:seed                 # Seed database
npm run db:reset                # Reset database
npm run db:studio               # Open Prisma Studio

# Testing
npm run test                    # Run all tests
npm run test:watch              # Watch mode
npm run test:e2e                # End-to-end tests

# Docker Operations
docker-compose -f docker-compose.dev.yml ps     # Check services
docker-compose -f docker-compose.dev.yml logs   # View logs
docker-compose -f docker-compose.dev.yml down   # Stop all
```

## 🚨 Emergency Reset

If everything is broken and you need a complete reset:

```bash
# Nuclear option - reset everything
./scripts/dev-stop.sh true true  # Stop and remove everything
docker system prune -f           # Clean Docker
rm -rf node_modules              # Remove dependencies
rm .env.development .env.local   # Remove environment files
./scripts/dev-setup.sh           # Complete setup from scratch
```

## 💡 Pro Tips

1. **Always use incognito mode** when testing authentication flows
2. **Check browser console** for JavaScript errors
3. **Monitor server logs** in terminal while developing
4. **Use database admin tools** to inspect data directly
5. **Test with multiple user accounts** to verify multi-user scenarios
6. **Keep Docker Desktop running** for database and Redis services

## 🎉 Success Indicators

You'll know everything is working when:

- ✅ Application loads at http://localhost:3000
- ✅ Authentication redirects work properly
- ✅ User registration/login functions correctly
- ✅ Dashboard loads with user data
- ✅ No errors in browser console or server logs
- ✅ Database queries execute successfully

---

**Need help?** Check the logs, verify your environment variables, and ensure all services are running. The most common issues are related to database connectivity and authentication configuration.