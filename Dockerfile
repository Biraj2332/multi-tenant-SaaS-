# Multi-stage Dockerfile for TenantOps Monorepo
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache \
    git \
    bash \
    curl \
    openssl \
    python3 \
    make \
    g++ \
    postgresql-client

# Enable pnpm via corepack (pin to v10 for Node 20 compatibility)
RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

# Set working directory
WORKDIR /app

# Copy workspace manifest files first (better layer caching)
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/contracts/package.json ./packages/contracts/
COPY packages/core/package.json ./packages/core/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/typescript-config/package.json ./packages/typescript-config/

# Install all dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy full source code
COPY . .

# Stage 2: Development
FROM base AS development

# Expose ports
EXPOSE 13000 5173

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check for API
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:13000/api/v1/health || exit 1

# Default command (overridden per-service in docker-compose)
CMD ["pnpm", "dev"]
