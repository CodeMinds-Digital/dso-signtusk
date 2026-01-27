# Prisma Dependency Fix

## Issue

The Docker build was failing at the runner stage when generating Prisma client:

```
Error reading package.json: The version of the package @prisma/client could not be determined - make sure it is installed as a dependency and not a devDependency
```

## Root Cause

Both `@prisma/client` and `prisma` were in `devDependencies` instead of `dependencies`. In production Docker builds, Prisma needs to:

1. Generate the client at runtime
2. Access the client package to determine version
3. Both packages must be available in production

## The Fix

### Moved to `dependencies`:

```json
"dependencies": {
  "@prisma/client": "^6.19.0",
  "prisma": "^6.19.0",
  ...
}
```

### Removed from `devDependencies`:

```json
"devDependencies": {
  // @prisma/client removed
  // prisma removed
  ...
}
```

## Why Both Packages?

1. **`@prisma/client`**: The runtime client used by your application
   - Required at runtime to query the database
   - Must be in `dependencies`

2. **`prisma`**: The CLI tool
   - Used to generate the client (`prisma generate`)
   - Used to run migrations (`prisma migrate`)
   - Also needed in production for the runner stage

## Dockerfile Already Correct

The Dockerfile already uses the correct flag:

```dockerfile
RUN npm ci --production=false --legacy-peer-deps
```

This ensures all dependencies (including those needed for Prisma generation) are installed.

## What This Fixes

### Before (Error):

```
#58 [runner 13/16] RUN npx prisma generate
#58 10.04  Error reading package.json: The version of the package @prisma/client could not be determined
```

### After (Success):

```
#58 [runner 13/16] RUN npx prisma generate
#58 6.107 Prisma schema loaded from packages/prisma/schema.prisma
#58 11.40 ✔ Generated Prisma Client (v6.19.1) to ./node_modules/@prisma/client in 802ms
#58 11.40 ✔ Generated Kysely types (2.2.1) to ./packages/prisma/generated in 313ms
#58 11.40 ✔ Generated Prisma Json Types Generator (3.6.2) to ./packages/prisma in 821ms
#58 11.40 ✔ Generated Zod Prisma Types to ./packages/prisma/generated/zod in 1.46s
```

## Best Practices

### Production Dependencies

These should be in `dependencies`:

- Runtime packages (`@prisma/client`, `react`, `express`, etc.)
- CLI tools needed in production (`prisma` for migrations/generation)
- Build tools needed at runtime

### Development Dependencies

These should be in `devDependencies`:

- Testing frameworks (`vitest`, `jest`)
- Type definitions (most `@types/*` packages)
- Linters and formatters (`eslint`, `prettier`)
- Build tools only needed during development

## Verification

After this fix, the Prisma generation step will:

1. ✅ Find `@prisma/client` in dependencies
2. ✅ Determine the correct version (6.19.1)
3. ✅ Generate all required types and clients
4. ✅ Complete without errors

## Deploy

Include this fix in your deployment:

```bash
git add package.json
git commit -m "fix: move Prisma packages to dependencies for production builds"
git push origin main
```

## Related Files

- `package.json` - Updated dependency locations
- `Dockerfile.production` - Already configured correctly with `--production=false`
