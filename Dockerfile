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

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Stage 2: Development
FROM base AS development

# Install development dependencies globally
RUN npm install -g nodemon

# Expose ports
EXPOSE 13000 5173 5432 6379 8080

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Health check for API
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:13000/api/v1/health || exit 1

# Default command
CMD ["npm", "run", "dev"]
