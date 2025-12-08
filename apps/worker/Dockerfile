# apps/worker/Dockerfile
# ======================
# Production Dockerfile for BullMQ Worker
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
COPY apps/worker ./apps/worker
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY packages/emails ./packages/emails

# Install ALL dependencies (needed for build) - must happen after copying sources
# so pnpm can properly link workspace packages
RUN pnpm install --frozen-lockfile

# Build all packages in dependency order using turbo
RUN pnpm turbo build --filter=@forgestack/worker

# Prune dev dependencies for production
RUN pnpm prune --prod

# ============================================
# Stage 2: Runner
# ============================================
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

WORKDIR /app

# Copy node_modules and built packages
COPY --from=builder --chown=worker:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=worker:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=worker:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=worker:nodejs /app/packages/db/dist ./packages/db/dist
COPY --from=builder --chown=worker:nodejs /app/packages/db/package.json ./packages/db/
COPY --from=builder --chown=worker:nodejs /app/packages/emails/dist ./packages/emails/dist
COPY --from=builder --chown=worker:nodejs /app/packages/emails/package.json ./packages/emails/
COPY --from=builder --chown=worker:nodejs /app/apps/worker/dist ./apps/worker/dist
COPY --from=builder --chown=worker:nodejs /app/apps/worker/package.json ./apps/worker/

USER worker

# Environment
ENV NODE_ENV=production

# No EXPOSE - worker doesn't serve HTTP

# No health check via HTTP - container orchestrator uses process status
# For Kubernetes, use livenessProbe with exec command

CMD ["node", "apps/worker/dist/index.js"]

