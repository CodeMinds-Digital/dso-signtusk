# Multi-stage Dockerfile for production builds
FROM node:22-alpine AS base

# Upgrade npm to latest version
RUN npm install -g npm@11.8.0

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++ bash
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY packages ./packages
COPY apps ./apps

# Install ALL dependencies (including dev) for building
# Use npm install instead of npm ci to handle lock file sync issues
RUN npm install --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache bash
WORKDIR /app

# Copy dependencies and source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages
COPY --from=deps /app/apps ./apps
COPY package.json package-lock.json* turbo.json ./
COPY lingui.config.ts ./
COPY tsconfig.json ./

# Set build-time environment variables
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
ENV NEXT_TELEMETRY_DISABLED=1

# Generate Prisma Client
RUN npm run prisma:generate

# Build the application
# Note: pdf-sign build script is a no-op (uses pre-built native binaries)
RUN npm run build

# Production image, copy all the files and run the application
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages ./packages

# Copy built application
COPY --from=builder /app/apps/remix/build ./apps/remix/build
# Copy public folder from deps stage (before build) to ensure it exists
COPY --from=deps /app/apps/remix/public ./apps/remix/public
COPY --from=builder /app/apps/remix/package.json ./apps/remix/package.json
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/turbo.json ./turbo.json

# Create necessary directories
RUN mkdir -p /app/uploads /app/logs
RUN chown -R nextjs:nodejs /app /app/uploads /app/logs

USER nextjs

# Expose ports
EXPOSE 3000 9090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "start"]