# Netlify Configuration Troubleshooting

## Issue: "netlify.to}" Path Resolution Error

**Error Message:**
```
Failed during stage 'Reading and parsing configuration files': 
When resolving config file /opt/build/repo/apps/remix/netlify.to}
```

## Root Cause Analysis

The error shows Netlify is trying to resolve a malformed config file path:
- Expected: `apps/remix/netlify.toml`
- Actual: `apps/remix/netlify.to}` (missing "m" and has stray "}")

## Potential Causes

1. **Netlify Site Settings**: The config file path might be incorrectly set in Netlify dashboard
2. **Environment Variables**: A Netlify environment variable might contain the malformed path
3. **Build Command**: The build command might be constructing the path incorrectly
4. **Git Repository**: There might be a hidden file with the malformed name

## Solutions

### 1. Check Netlify Site Settings

In your Netlify dashboard for the Remix app:

1. Go to **Site Settings** → **Build & Deploy** → **Build Settings**
2. Check the **Config file path** field
3. Ensure it's set to: `apps/remix/netlify.toml` (or leave empty for auto-detection)
4. If it shows `apps/remix/netlify.to}`, correct it to `apps/remix/netlify.toml`

### 2. Verify Environment Variables

Check your Netlify environment variables for any that might contain config paths:

1. Go to **Site Settings** → **Environment Variables**
2. Look for variables like:
   - `NETLIFY_CONFIG_PATH`
   - `CONFIG_FILE_PATH`
   - Any custom variables that might reference netlify config
3. Ensure they don't contain the malformed path `netlify.to}`

### 3. Check Build Commands

Verify your build commands don't construct malformed paths:

```bash
# In Netlify dashboard, check if build command contains:
cd ../.. && NETLIFY_APP_NAME=remix node scripts/netlify-build.js

# Ensure it doesn't reference netlify.to} anywhere
```

### 4. Repository File Check

Run this command to check for any malformed files:

```bash
# Check for any files with malformed names
find . -name "*netlify.to*" -type f
git ls-files | grep -i netlify

# Should only show files ending in .toml, not .to}
```

### 5. Clear Netlify Cache

1. In Netlify dashboard: **Deploys** → **Trigger Deploy** → **Clear cache and deploy**
2. This forces Netlify to re-read all configuration files

### 6. Validate Configuration Files

Run our validation script:

```bash
node scripts/validate-netlify-configs.js
```

## Current Repository Status

✅ **All configuration files are correctly named and formatted:**
- `netlify.toml` (root fallback)
- `netlify-marketing.toml` (marketing site config)
- `netlify-docs.toml` (docs site config)  
- `apps/web/netlify.toml` (web app config)
- `apps/remix/netlify.toml` (remix app config)
- `apps/docs/netlify.toml` (docs app config)

## Recommended Actions

### IMMEDIATE SOLUTION (Most Likely Fix)

1. **Check Netlify Dashboard Site Settings**
   - Go to your Netlify dashboard
   - Select the failing Remix app site
   - Navigate to **Site Settings** → **Build & Deploy** → **Build Settings**
   - Look for the **Config file path** field
   - If it shows `apps/remix/netlify.to}`, change it to `apps/remix/netlify.toml`
   - If the field is empty, leave it empty (auto-detection works)
   - Save the settings

2. **Check Environment Variables**
   - In the same site, go to **Site Settings** → **Environment Variables**
   - Look for any variables that might contain config paths:
     - `NETLIFY_CONFIG_PATH`
     - `CONFIG_FILE_PATH`
     - Any custom variables referencing netlify config
   - If any contain `netlify.to}`, correct them to `netlify.toml`

3. **Clear Cache and Redeploy**
   - Go to **Deploys** tab
   - Click **Trigger Deploy** → **Clear cache and deploy**
   - Monitor the build logs for the error

### ALTERNATIVE SOLUTIONS

4. **Use Root Netlify Configuration**
   - We've created a fallback `netlify.toml` in the repository root
   - In Netlify dashboard, set the config file path to just `netlify.toml`
   - This will use our root configuration which properly handles the Remix app

5. **Verify Build Command**
   - Ensure the build command doesn't construct malformed paths
   - Should be: `cd ../.. && NETLIFY_APP_NAME=remix node scripts/netlify-build.js`
   - Check that no environment variables are corrupting the path

6. **Contact Netlify Support** (if issue persists)
   - Provide the exact error message
   - Mention that all local files are correctly named
   - Ask them to check their internal path resolution
   - Reference this troubleshooting guide

## Prevention

- Always use the full filename `netlify.toml` in configurations
- Avoid dynamic path construction that might truncate the filename
- Use our validation script before commits: `node scripts/validate-netlify-configs.js`

## Files Created/Updated

- ✅ `netlify.toml` - Root fallback configuration
- ✅ `scripts/validate-netlify-configs.js` - Configuration validation script
- ✅ `NETLIFY_CONFIG_TROUBLESHOOTING.md` - This troubleshooting guide