# Vercel Deployment Troubleshooting

## Common Issues and Solutions

### 1. patch-package: command not found

**Problem:** The postinstall script tries to run `patch-package` before it's installed.

**Solution Applied:**
- Modified `package.json` postinstall script to skip patches when `SKIP_PATCHES=true`
- Added `SKIP_PATCHES=true` to Vercel environment variables
- This allows the build to proceed without patches (safe if no patches exist)

### 2. Build Command Issues

**Current Configuration:**
```json
{
  "buildCommand": "SKIP_PATCHES=true npm ci && npm run build --workspace=@signtusk/remix",
  "installCommand": "echo 'Using buildCommand for installation'"
}
```

**Alternative Configurations:**

#### Option A: Use Custom Build Script
```json
{
  "buildCommand": "node build-vercel.js",
  "installCommand": "echo 'Using custom build script'"
}
```

#### Option B: Separate Install and Build
```json
{
  "buildCommand": "npm run build --workspace=@signtusk/remix",
  "installCommand": "SKIP_PATCHES=true npm ci"
}
```

### 3. Monorepo Workspace Issues

**Problem:** Vercel might not properly handle npm workspaces.

**Solutions:**
1. Ensure `package.json` has correct workspace configuration
2. Use full workspace names in build commands
3. Set correct root directory in Vercel settings

### 4. Environment Variables

**Required Environment Variables in Vercel:**
```bash
NODE_ENV=production
TURBO_TELEMETRY_DISABLED=1
INSTALL_PLAYWRIGHT=false
SKIP_PATCHES=true

# Your app-specific variables
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret
JWT_SECRET=your_jwt_secret
# ... other variables from .env.vercel.example
```

### 5. Function Timeout Issues

**Problem:** Serverless functions timing out.

**Solution:** Increase timeout in `vercel.json`:
```json
{
  "functions": {
    "api/index.js": {
      "runtime": "nodejs20.x",
      "maxDuration": 60
    }
  }
}
```

### 6. Build Memory Issues

**Problem:** Build runs out of memory.

**Solutions:**
1. Add to `vercel.json`:
```json
{
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=4096"
  }
}
```

2. Optimize dependencies in `.vercelignore`

### 7. Static Asset Issues

**Problem:** Static assets not loading correctly.

**Solution:** Check rewrites in `vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/build/(.*)",
      "destination": "/build/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/api"
    }
  ]
}
```

## Debugging Steps

### 1. Check Build Logs
- Go to Vercel dashboard → Your project → Deployments
- Click on failed deployment
- Check "Build Logs" for specific errors

### 2. Test Locally
```bash
# Test the exact build command locally
cd apps/remix
SKIP_PATCHES=true npm ci
npm run build --workspace=@signtusk/remix
```

### 3. Verify Dependencies
```bash
# Check if all workspace dependencies are available
npm ls --workspace=@signtusk/remix
```

### 4. Test API Function
```bash
# Test the API entry point
node -e "console.log(require('./api/index.js'))"
```

## Alternative Deployment Methods

### Method 1: Vercel CLI
```bash
cd apps/remix
vercel --prod
```

### Method 2: GitHub Integration
1. Connect repository to Vercel via GitHub app
2. Set root directory to `apps/remix`
3. Let Vercel auto-detect settings

### Method 3: Docker Deployment
Use the existing Dockerfile for containerized deployment.

## Performance Optimization

### 1. Build Caching
Add to `vercel.json`:
```json
{
  "github": {
    "silent": true
  },
  "env": {
    "VERCEL_ANALYTICS_ID": "$VERCEL_ANALYTICS_ID"
  }
}
```

### 2. Function Optimization
- Use Edge Runtime for faster cold starts
- Minimize bundle size
- Use proper caching headers

### 3. Static Asset Optimization
- Enable compression
- Use proper cache headers
- Optimize images and fonts

## Getting Help

1. **Vercel Support:** https://vercel.com/support
2. **Community:** https://github.com/vercel/vercel/discussions
3. **Documentation:** https://vercel.com/docs

## Current Status

✅ **Fixed Issues:**
- patch-package command not found
- Monorepo workspace detection
- Environment variable configuration
- Build optimization

⚠️ **Monitor:**
- Build performance
- Function cold starts
- Memory usage during builds