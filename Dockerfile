# Multi-stage Dockerfile for production builds
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY turbo.json ./
COPY packages ./packages
COPY apps ./apps

# Install ALL dependencies (including dev) for building
RUN npm ci --legacy-peer-deps

# Rebuild the source code only when needed
FROM base AS builder
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
COPY --from=builder /app/apps/remix/public ./apps/remix/public
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