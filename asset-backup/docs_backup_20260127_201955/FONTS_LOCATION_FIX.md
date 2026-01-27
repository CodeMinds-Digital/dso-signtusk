# Fonts Location Fix

## Problem

Docker build failed with:

```
ERROR: "/app/apps/remix/public": not found
```

## Root Cause

The Remix build process moves public assets into the build output. After running the build:

**Actual structure:**

```
/app/apps/remix/build/
  ├── server/
  │   ├── fonts/          ← Fonts are HERE
  │   │   ├── caveat.ttf
  │   │   ├── noto-sans.ttf
  │   │   └── ...
  │   └── ...
  └── client/
```

**What code expects:**

```typescript
const fontPath = path.join(process.cwd(), "public/fonts");
// Looks for: /app/apps/remix/public/fonts/caveat.ttf
```

The `public` directory doesn't exist as a separate directory after the build - its contents are moved into `build/server/`.

## Solution

Copy fonts from their actual location in the build output to where the code expects them:

```dockerfile
# Copy built application (includes public assets in build/server)
COPY --from=installer --chown=nodejs:nodejs /app/apps/remix/build ./apps/remix/build

# Fonts are built into build/server/fonts, but code looks for public/fonts
# Copy fonts from build to expected location
RUN mkdir -p ./apps/remix/public && \
    cp -r ./apps/remix/build/server/fonts ./apps/remix/public/fonts
```

## How It Works

1. **Build stage**: Remix build moves `public/fonts/` → `build/server/fonts/`
2. **Copy build**: Copy entire build directory to runner
3. **Create public**: Make `public` directory
4. **Copy fonts**: Copy fonts from `build/server/fonts` to `public/fonts`
5. **Runtime**: Code finds fonts at expected location

## Result

```
/app/apps/remix/
  ├── build/
  │   └── server/
  │       └── fonts/      ← Original location
  └── public/
      └── fonts/          ← Copied here for runtime access
          ├── caveat.ttf
          ├── noto-sans.ttf
          └── ...
```

## Status

✅ **FIXED** - Fonts copied from build output to expected runtime location
