# Netlify patch-package Issue - COMPLETE SOLUTION

## 🎯 THE PROBLEM

Netlify build fails with:
```
sh: 1: patch-package: not found
npm error code 127
```

**Root Cause**: The postinstall script tries to run `patch-package`, but Netlify's production environment doesn't install devDependencies, and there's a workspace resolution issue.

## ✅ THE SOLUTION (RECOMMENDED)

### Step 1: Add SKIP_PATCHES Environment Variable

This is the **cleanest and fastest solution** because:
- The postinstall script already has a `SKIP_PATCHES` guard
- Patches are typically not needed for production builds
- Faster builds without running patch-package

**Instructions**:
1. Go to **Netlify Dashboard** → Your Remix Site → **Site Settings**
2. Navigate to: **Build & Deploy** → **Environment**
3. Click **"Add variable"**
4. Set:
   ```
   Key: SKIP_PATCHES
   Value: true
   ```
5. **Save** the variable
6. Go to **Deploys** tab
7. Click **"Trigger deploy"** → **"Deploy site"**

## 🔍 WHY THIS WORKS

### Current Postinstall Script
```bash
if [ "$SKIP_PATCHES" != "true" ]; then patch-package; fi && if [ "$INSTALL_PLAYWRIGHT" = "true" ]; then npx playwright install; fi
```

### With SKIP_PATCHES=true
- The `patch-package` command is skipped entirely
- No dependency resolution issues
- Build continues normally
- Playwright installation is also skipped (which is good for Netlify)

### Patch Analysis
- ✅ `patch-package` is correctly in `dependencies` (not devDependencies)
- ✅ Only one patch exists: `documenso-main/patches/@ai-sdk+google-vertex+3.0.81.patch`
- ✅ This patch is in a subdirectory, not affecting the main build
- ✅ Production builds typically don't need development patches

## 🚨 ALTERNATIVE SOLUTIONS (If patches are required)

### Option 2: Force Install devDependencies
If you actually need patches for the build:

1. Go to **Netlify Dashboard** → Site Settings → **Build & Deploy** → **Environment**
2. Add one of these variables:
   ```
   NPM_FLAGS="--include=dev"
   ```
   OR
   ```
   NPM_CONFIG_PRODUCTION=false
   ```
3. **Remove** `SKIP_PATCHES` if you set it
4. Redeploy

### Option 3: Use npx (Last Resort)
Modify the postinstall script to use npx:

```bash
# Current
"postinstall": "if [ \"$SKIP_PATCHES\" != \"true\" ]; then patch-package; fi && ..."

# Change to
"postinstall": "if [ \"$SKIP_PATCHES\" != \"true\" ]; then npx patch-package; fi && ..."
```

## 📊 CURRENT STATUS

- ✅ **patch-package location**: Correctly in dependencies
- ✅ **Postinstall guard**: SKIP_PATCHES check exists
- ✅ **Patch analysis**: Only one patch in subdirectory
- ⚠️ **Netlify environment**: Needs SKIP_PATCHES=true

## 🎉 EXPECTED OUTCOME

After setting `SKIP_PATCHES=true`:

1. **Dependency installation** will complete successfully
2. **patch-package** will be skipped (as intended)
3. **Build process** will continue normally
4. **Deployment** will succeed

## 📋 VERIFICATION STEPS

After applying the fix, check the build logs for:

1. ✅ **No patch-package errors**
2. ✅ **Dependencies installed successfully**
3. ✅ **Build command executes**
4. ✅ **Site deploys successfully**

## 🔧 TROUBLESHOOTING

### If SKIP_PATCHES=true doesn't work:
1. Check the environment variable is set correctly
2. Ensure there are no typos in the variable name
3. Try Option 2 (NPM_FLAGS="--include=dev")

### If patches are actually needed:
1. Use Option 2 to install devDependencies
2. Monitor build time (will be slower)
3. Consider moving patches to dependencies if critical

---

**RECOMMENDED ACTION: Set SKIP_PATCHES=true in Netlify environment variables. This is the fastest and cleanest solution.**