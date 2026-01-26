# 📊 Dockerfile Comparison: Documenso vs Signtusk

Detailed comparison between the official Documenso Dockerfile and our Signtusk implementation.

---

## 🔍 Key Differences

### 1. Base Image

**Documenso (Official):**

```dockerfile
FROM node:22-alpine3.20 AS base
RUN apk add --no-cache openssl font-freefont
```

- ✅ Uses Alpine (smaller, ~50MB base)
- ✅ Includes fonts for PDF generation
- ✅ Minimal dependencies

**Signtusk (Ours):**

```dockerfile
FROM node:22-bookworm-slim AS base
RUN apt-get update && apt-get install -y openssl ca-certificates curl
```

- ❌ Uses Debian Bookworm Slim (~100MB base)
- ❌ No fonts included
- ⚠️ Larger base image

**Impact:** Alpine is 50% smaller but can have compatibility issues with native modules.

---

### 2. Turbo Prune Strategy

**Documenso (Official):**

```dockerfile
FROM base AS builder
COPY . .
RUN npm install -g "turbo@^1.9.3"
RUN turbo prune --scope=@documenso/remix --docker
```

- ✅ Uses `turbo prune` to create minimal workspace
- ✅ Only copies necessary files
- ✅ Smaller context, faster builds

**Signtusk (Ours):**

```dockerfile
FROM base AS installer
COPY package.json package-lock.json ./
COPY apps/remix/package.json ./apps/remix/
COPY packages/*/package.json ./packages/
# ... copy everything manually
```

- ❌ No `turbo prune`
- ❌ Copies files manually
- ⚠️ Larger build context

**Impact:** Without `turbo prune`, we copy more files than needed, increasing build time.

---

### 3. Dependency Installation

**Documenso (Official):**

```dockerfile
# Installer stage
RUN npm ci

# Runner stage
RUN npm ci --only=production
```

- ✅ Clean install in both stages
- ✅ Only production deps in runner
- ✅ Smaller final image

**Signtusk (Ours):**

```dockerfile
# Installer stage
RUN npm ci --legacy-peer-deps

# Runner stage
RUN npm ci --production=false --legacy-peer-deps
```

- ⚠️ Uses `--legacy-peer-deps` (workaround)
- ❌ Installs ALL deps in runner (including dev)
- ⚠️ Larger final image

**Impact:** Our approach installs ~2x more dependencies in the final image.

---

### 4. Build Tools in Runner

**Documenso (Official):**

```dockerfile
FROM base AS runner
# No build tools installed
RUN addgroup --system --gid 1001 nodejs
```

- ✅ No Python, make, g++ in runner
- ✅ Smaller image
- ✅ More secure (fewer tools)

**Signtusk (Ours):**

```dockerfile
FROM base AS runner
RUN apt-get install -y python3 make g++
RUN groupadd --system --gid 1001 nodejs
```

- ❌ Installs Python, make, g++ in runner
- ⚠️ Needed for pkcs11js native module
- ⚠️ Larger image, more attack surface

**Impact:** We need build tools because we install all deps (including native modules) in runner.

---

### 5. Workspace Packages

**Documenso (Official):**

```dockerfile
# Only copy tailwind-config
COPY --from=builder /app/out/full/packages/tailwind-config ./packages/tailwind-config
```

- ✅ Only copies needed packages
- ✅ Minimal runtime dependencies
- ✅ Smaller image

**Signtusk (Ours):**

```dockerfile
# Copy ALL packages
COPY --from=installer /app/packages ./packages
```

- ❌ Copies all workspace packages
- ⚠️ Needed because we don't use turbo prune
- ⚠️ Larger image

**Impact:** We copy ~10x more package code than necessary.

---

### 6. Package Manager

**Documenso (Official):**

```dockerfile
# Uses npm (default)
RUN npm ci
```

- ✅ Standard npm
- ✅ Works everywhere
- ⚠️ Slower than alternatives

**Signtusk (Ours):**

```dockerfile
# Also uses npm
RUN npm ci --legacy-peer-deps
```

- ✅ Same as Documenso
- ⚠️ Needs `--legacy-peer-deps` flag

**Note:** Documenso also has `Dockerfile.pnpm` and `Dockerfile.bun` alternatives.

---

## 📊 Image Size Comparison

| Stage       | Documenso (Alpine) | Signtusk (Debian) | Difference |
| ----------- | ------------------ | ----------------- | ---------- |
| **Base**    | ~50MB              | ~100MB            | +100%      |
| **Builder** | ~500MB             | ~800MB            | +60%       |
| **Runner**  | ~200MB             | ~600MB            | +200%      |

**Why Signtusk is Larger:**

1. Debian base vs Alpine (+50MB)
2. All deps vs production only (+200MB)
3. All packages vs minimal (+100MB)
4. Build tools in runner (+50MB)

---

## 🎯 What We Should Fix

### Priority 1: Use Turbo Prune (High Impact)

**Add builder stage:**

```dockerfile
FROM base AS builder
WORKDIR /app
COPY . .
RUN npm install -g "turbo@^2.6.3"
RUN turbo prune --scope=@signtusk/remix --docker
```

**Benefits:**

- ✅ Smaller build context
- ✅ Faster builds
- ✅ Only copy necessary files
- ✅ Smaller final image

---

### Priority 2: Production-Only Deps in Runner (High Impact)

**Change runner stage:**

```dockerfile
# Instead of:
RUN npm ci --production=false

# Use:
RUN npm ci --only=production
```

**Benefits:**

- ✅ 50% smaller final image
- ✅ Fewer dependencies
- ✅ More secure

**Challenge:** Need to ensure workspace packages work without dev deps.

---

### Priority 3: Remove Build Tools from Runner (Medium Impact)

**If we fix Priority 2, we can remove:**

```dockerfile
# Remove this from runner:
RUN apt-get install -y python3 make g++
```

**Benefits:**

- ✅ Smaller image (~50MB)
- ✅ More secure
- ✅ Faster startup

**Requirement:** Must use production-only deps (no native module rebuilds).

---

### Priority 4: Consider Alpine (Low Priority)

**Switch to Alpine:**

```dockerfile
FROM node:22-alpine3.20 AS base
RUN apk add --no-cache openssl font-freefont
```

**Benefits:**

- ✅ 50% smaller base image
- ✅ Faster pulls
- ✅ Industry standard

**Challenges:**

- ⚠️ May have compatibility issues with native modules
- ⚠️ Different package manager (apk vs apt)
- ⚠️ Requires testing

---

## 🔧 Recommended Dockerfile Structure

Based on Documenso best practices:

```dockerfile
###########################
#     BASE CONTAINER      #
###########################
FROM node:22-alpine3.20 AS base
RUN apk add --no-cache openssl font-freefont

###########################
#    BUILDER CONTAINER    #
###########################
FROM base AS builder
RUN apk add --no-cache libc6-compat jq
WORKDIR /app
COPY . .
RUN npm install -g "turbo@^2.6.3"
RUN turbo prune --scope=@signtusk/remix --docker

###########################
#   INSTALLER CONTAINER   #
###########################
FROM base AS installer
RUN apk add --no-cache libc6-compat jq make cmake g++ openssl bash
WORKDIR /app

ENV HUSKY=0
ENV DOCKER_OUTPUT=1
ENV NEXT_TELEMETRY_DISABLED=1

# Copy pruned workspace
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
COPY --from=builder /app/lingui.config.ts ./lingui.config.ts

RUN npm ci

# Copy source and build
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN npm install -g "turbo@^2.6.3"
RUN turbo run build --filter=@signtusk/remix...

###########################
#     RUNNER CONTAINER    #
###########################
FROM base AS runner

ENV HUSKY=0
ENV DOCKER_OUTPUT=1
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs
USER nodejs

WORKDIR /app

# Copy minimal files
COPY --from=builder --chown=nodejs:nodejs /app/out/json/ .
COPY --from=builder --chown=nodejs:nodejs /app/out/full/packages/tailwind-config ./packages/tailwind-config

# Install production deps only
RUN npm ci --only=production

# Copy build output
COPY --from=installer --chown=nodejs:nodejs /app/apps/remix/build ./apps/remix/build
COPY --from=installer --chown=nodejs:nodejs /app/packages/prisma/schema.prisma ./packages/prisma/schema.prisma
COPY --from=installer --chown=nodejs:nodejs /app/packages/prisma/migrations ./packages/prisma/migrations

# Generate Prisma client
RUN npx prisma generate --schema ./packages/prisma/schema.prisma

# Copy start script
COPY --chown=nodejs:nodejs ./docker/start.sh /app/apps/remix/start.sh

WORKDIR /app/apps/remix
CMD ["sh", "start.sh"]
```

---

## 📋 Migration Plan

### Phase 1: Quick Wins (Do Now)

1. ✅ Add Python to runner (already done)
2. ✅ Copy all packages (already done)
3. ✅ Get it working first

### Phase 2: Optimize (After It Works)

1. Add turbo prune
2. Use production-only deps
3. Remove build tools from runner
4. Test thoroughly

### Phase 3: Advanced (Optional)

1. Switch to Alpine
2. Multi-architecture builds
3. Layer caching optimization

---

## 🎯 Current Status

**What Works:**

- ✅ Builds successfully
- ✅ Includes all dependencies
- ✅ Has build tools for native modules

**What's Not Optimal:**

- ❌ Large image size (~600MB vs ~200MB)
- ❌ Includes dev dependencies
- ❌ No turbo prune
- ❌ Copies all packages

**Priority:** Get it working first, optimize later!

---

## 💡 Key Takeaways

### From Documenso Dockerfile:

1. **Turbo Prune is Essential**
   - Reduces build context by 80%
   - Faster builds
   - Smaller images

2. **Production-Only Deps**
   - 50% smaller final image
   - More secure
   - Faster startup

3. **Minimal Package Copying**
   - Only copy what's needed at runtime
   - Tailwind config is the only package needed

4. **Alpine Base**
   - Industry standard
   - Smaller images
   - Faster deployments

5. **No Build Tools in Runner**
   - More secure
   - Smaller image
   - Cleaner separation

---

## 🚀 Next Steps

### Immediate (Get It Working):

1. ✅ Keep current Dockerfile
2. ✅ Deploy and test
3. ✅ Verify functionality

### Short Term (Optimize):

1. Add turbo prune
2. Switch to production-only deps
3. Remove unnecessary packages

### Long Term (Perfect):

1. Consider Alpine
2. Implement layer caching
3. Multi-stage optimization

---

## 📚 References

- [Documenso Dockerfile](documenso-main/docker/Dockerfile)
- [Turbo Prune Docs](https://turbo.build/repo/docs/reference/command-line-reference/prune)
- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Alpine vs Debian](https://www.docker.com/blog/how-to-use-the-alpine-docker-official-image/)

---

**Summary:** Our Dockerfile works but is 3x larger than optimal. After it's working, we should implement turbo prune and production-only deps to match Documenso's efficiency.
