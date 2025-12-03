# apps/api/Dockerfile
# ===================
# Production Dockerfile for NestJS API
# Target size: ~100MB

# ============================================
# Stage 1: Builder
# ============================================
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy all workspace files needed for build
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json turbo.json ./
COPY apps/api ./apps/api
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared

# Install ALL dependencies (needed for build) - must happen after copying sources
# so pnpm can properly link workspace packages
RUN pnpm install --frozen-lockfile

# Build all packages in dependency order using turbo
RUN pnpm turbo build --filter=@forgestack/api

# Prune dev dependencies for production
RUN pnpm prune --prod

# ============================================
# Stage 2: Runner
# ============================================
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy node_modules and built packages
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=nestjs:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=nestjs:nodejs /app/packages/db/package.json ./packages/db/
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./apps/api/

USER nestjs

# Environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/v1/health || exit 1

CMD ["node", "apps/api/dist/main.js"]

