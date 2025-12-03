# apps/worker/Dockerfile
# ======================
# Production Dockerfile for BullMQ Worker
# Target size: ~100MB

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/worker/package.json ./apps/worker/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/

# Install ALL dependencies (needed for build)
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/worker/node_modules ./apps/worker/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/worker ./apps/worker
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared

# Build packages first, then worker
RUN pnpm --filter=@forgestack/shared build && \
    pnpm --filter=@forgestack/db build && \
    pnpm --filter=@forgestack/worker build

# Create production bundle with pnpm deploy
RUN pnpm deploy --filter=@forgestack/worker --prod /app/pruned

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

WORKDIR /app

# Copy production bundle
COPY --from=builder --chown=worker:nodejs /app/pruned ./
COPY --from=builder --chown=worker:nodejs /app/apps/worker/dist ./dist

USER worker

# Environment
ENV NODE_ENV=production

# No EXPOSE - worker doesn't serve HTTP

# No health check via HTTP - container orchestrator uses process status
# For Kubernetes, use livenessProbe with exec command

CMD ["node", "dist/index.js"]

