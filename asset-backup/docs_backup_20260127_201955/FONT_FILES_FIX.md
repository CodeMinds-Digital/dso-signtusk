# Font Files Fix

## Problem

After fixing the native module issue, a new error appeared:

```
Error: No such file or directory (os error 2): "/app/apps/remix/public/fonts/caveat.ttf"
at FontLibrary.use
at insertFieldInPDFV2
```

## Root Cause

The `insertFieldInPDFV2` function uses `skia-canvas` to render PDF fields with custom fonts. It loads fonts from the `public/fonts` directory:

```typescript
const fontPath = path.join(process.cwd(), "public/fonts");

FontLibrary.use({
  ["Caveat"]: [path.join(fontPath, "caveat.ttf")],
  ["Noto Sans"]: [path.join(fontPath, "noto-sans.ttf")],
  // ... more fonts
});
```

In the Docker container:

- `process.cwd()` = `/app/apps/remix`
- Expected path: `/app/apps/remix/public/fonts/caveat.ttf`
- **Problem**: The `public` directory was not being copied to the Docker image

## Solution

The Remix build process moves public assets into the build output. The fonts end up in `build/server/fonts/` but the server-side code looks for them at `public/fonts/`.

Updated `Dockerfile.production` to copy fonts from build output to expected location:

```dockerfile
# Copy built application (includes public assets in build/server)
COPY --from=installer --chown=nodejs:nodejs /app/apps/remix/build ./apps/remix/build

# Fonts are built into build/server/fonts, but code looks for public/fonts
# Copy fonts from build to expected location
RUN mkdir -p ./apps/remix/public && \
    cp -r ./apps/remix/build/server/fonts ./apps/remix/public/fonts
```

**Important**: The public directory must be copied FROM the installer stage (where it was already copied with the Remix app source), not from the build context.

## Why This Was Needed

The Remix build process bundles client-side assets into `build/client`, but:

1. **Server-side code** runs from `build/server`
2. **Font loading** happens at runtime on the server
3. **FontLibrary.use()** needs direct file system access to font files
4. The fonts are NOT bundled into the server build

Therefore, the `public/fonts` directory must be available at runtime for server-side PDF generation.

## Fonts Required

The following fonts are used for PDF field rendering:

- `caveat.ttf` - Handwriting/signature style
- `noto-sans.ttf` - Default sans-serif
- `noto-sans-japanese.ttf` - Japanese characters
- `noto-sans-chinese.ttf` - Chinese characters
- `noto-sans-korean.ttf` - Korean characters

## Files Changed

- `Dockerfile.production` - Added public directory copy

## Testing

After deployment:

1. Create document with signature field
2. Sign the document
3. Document should complete successfully
4. Check logs - should NOT see font file errors
5. Verify signed PDF renders correctly

## Related Code

- `packages/lib/server-only/pdf/insert-field-in-pdf-v2.ts` - Uses FontLibrary
- `apps/remix/public/fonts/` - Font files location
- `packages/lib/server-only/pdf/insert-field-in-pdf-v1.ts` - Also uses fonts (via fetch)
- `packages/lib/server-only/pdf/legacy-insert-field-in-pdf.ts` - Legacy font loading

## Status

✅ **FIXED** - Public directory now copied to Docker image for server-side font access.
