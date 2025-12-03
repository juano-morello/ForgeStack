# API Dockerization & Deployment Templates

**Epic:** Infrastructure  
**Priority:** High  
**Depends on:** Monorepo Setup, All apps functional  
**Status:** Draft

---

## Overview

This specification defines **production-ready Docker containers** for all three ForgeStack applications (API, Worker, Web) along with deployment templates for popular PaaS platforms.

### Goals

1. **Small image sizes** – Multi-stage builds targeting ~100MB for API/Worker, ~150MB for Web
2. **Security** – Non-root users, minimal attack surface, no dev dependencies in production
3. **pnpm monorepo optimization** – Efficient pruning with `pnpm deploy --prod`
4. **Consistent builds** – Same image runs identically across all environments
5. **Platform flexibility** – Deploy to Fly.io, Railway, Render, or any Docker host

### Current State

| Component | Status |
|-----------|--------|
| `docker-compose.yml` | ✅ Postgres + Redis for local dev |
| API Dockerfile | ❌ Missing |
| Worker Dockerfile | ❌ Missing |
| Web Dockerfile | ❌ Missing |
| Deployment templates | ❌ Missing |
| CI/CD for containers | ❌ Missing |

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GitHub Container Registry                        │
│                              (ghcr.io)                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  forgestack-api:latest   forgestack-worker:latest   forgestack-web:latest│
└────────────┬────────────────────────┬───────────────────────┬───────────┘
             │                        │                       │
             ▼                        ▼                       ▼
      ┌──────────────┐        ┌──────────────┐        ┌──────────────┐
      │   Fly.io     │        │   Railway    │        │    Render    │
      │   or other   │        │   or other   │        │   or other   │
      └──────────────┘        └──────────────┘        └──────────────┘
```

---

## Acceptance Criteria

### API Dockerfile (`apps/api/Dockerfile`)
- [ ] Multi-stage build with `deps`, `builder`, `runner` stages
- [ ] Base image: `node:20-alpine`
- [ ] Final image size: ≤100MB
- [ ] Uses `pnpm deploy --prod` for pruning
- [ ] Runs as non-root user (`node`)
- [ ] Exposes port 4000
- [ ] Health check: `GET /api/health`
- [ ] Environment variables documented
- [ ] Works with workspace dependencies (`@forgestack/db`, `@forgestack/shared`)

### Worker Dockerfile (`apps/worker/Dockerfile`)
- [ ] Multi-stage build matching API pattern
- [ ] Base image: `node:20-alpine`
- [ ] Final image size: ≤100MB
- [ ] No HTTP port exposed (background process only)
- [ ] Graceful shutdown handling preserved
- [ ] Runs as non-root user (`node`)
- [ ] Works with workspace dependencies

### Web Dockerfile (`apps/web/Dockerfile`)
- [ ] Multi-stage build with Next.js standalone output
- [ ] Base image: `node:20-alpine`
- [ ] Final image size: ≤150MB
- [ ] Uses `output: 'standalone'` in next.config.ts
- [ ] Copies static files and public assets correctly
- [ ] Exposes port 3000
- [ ] Runs as non-root user (`node`)
- [ ] Health check configured

### Root Docker Compose (`docker-compose.prod.yml`)
- [ ] Builds all three apps from Dockerfiles
- [ ] Connects to Postgres and Redis services
- [ ] Proper depends_on with health checks
- [ ] Environment variable configuration
- [ ] Volume mounts for persistent data

### Deployment Templates
- [ ] `fly.toml` for Fly.io with regions, scaling, health checks
- [ ] `railway.json` for Railway with build commands
- [ ] `render.yaml` for Render with service definitions
- [ ] Environment variable templates for each platform

### CI/CD (GitHub Actions)
- [ ] `.github/workflows/docker-build.yml` workflow
- [ ] Triggers on push to `main` branch
- [ ] Builds all three images in parallel
- [ ] Pushes to GitHub Container Registry (ghcr.io)
- [ ] Multi-platform builds (linux/amd64, linux/arm64)
- [ ] Tags with `latest` and commit SHA
- [ ] Build cache for faster subsequent builds

---

## Technical Design

### Base Image Selection

| Consideration | Decision |
|--------------|----------|
| OS | Alpine Linux (smallest footprint) |
| Node Version | 20 LTS (active support until 2026) |
| Image | `node:20-alpine` (~50MB base) |
| Alternative | `node:20-slim` if Alpine issues arise |

### Multi-Stage Build Pattern

All Dockerfiles follow this pattern:

```
Stage 1: deps      → Install ALL dependencies (including dev)
Stage 2: builder   → Build the application
Stage 3: runner    → Minimal production image
```

**Key principles:**
- Each stage starts from a clean base image
- Only production artifacts are copied to the final stage
- Dev dependencies never reach the runner stage
- `pnpm deploy` creates a self-contained production bundle

### pnpm Workspace Pruning Strategy

The `pnpm deploy` command creates a production-ready bundle:

```bash
# Prunes to only production dependencies for the target app
pnpm deploy --filter=@forgestack/api --prod /app/pruned
```

This:
1. Resolves all workspace dependencies (`@forgestack/db`, `@forgestack/shared`)
2. Copies only production `node_modules`
3. Creates a flat, self-contained directory
4. Eliminates need for full monorepo in production

---

### API Dockerfile

```dockerfile
# apps/api/Dockerfile
# ===================
# Production Dockerfile for NestJS API
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
COPY apps/api/package.json ./apps/api/
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
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy source files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/api ./apps/api
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared

# Build packages first, then API
RUN pnpm --filter=@forgestack/shared build && \
    pnpm --filter=@forgestack/db build && \
    pnpm --filter=@forgestack/api build

# Create production bundle with pnpm deploy
RUN pnpm deploy --filter=@forgestack/api --prod /app/pruned

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-alpine AS runner

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

WORKDIR /app

# Copy production bundle
COPY --from=builder --chown=nestjs:nodejs /app/pruned ./
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist

USER nestjs

# Environment
ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

CMD ["node", "dist/main.js"]
```

**API Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `BETTER_AUTH_SECRET` | Auth secret key | `your-secret-key` |
| `BETTER_AUTH_URL` | Auth callback URL | `https://api.example.com` |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_live_...` |
| `S3_ENDPOINT` | S3/R2 endpoint | `https://xxx.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` | S3 access key | `...` |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | `...` |
| `S3_BUCKET_NAME` | S3 bucket name | `forgestack-uploads` |

---

### Worker Dockerfile

```dockerfile
# apps/worker/Dockerfile
# ======================
# Production Dockerfile for BullMQ Worker
# Target size: ~100MB

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

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

# Create production bundle
RUN pnpm deploy --filter=@forgestack/worker --prod /app/pruned

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 worker

WORKDIR /app

# Copy production bundle
COPY --from=builder --chown=worker:nodejs /app/pruned ./
COPY --from=builder --chown=worker:nodejs /app/apps/worker/dist ./dist

USER worker

ENV NODE_ENV=production

# No EXPOSE - worker doesn't serve HTTP

# No health check via HTTP - container orchestrator uses process status
# For Kubernetes, use livenessProbe with exec command

CMD ["node", "dist/index.js"]
```

**Worker Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://host:6379` |
| `RESEND_API_KEY` | Resend email API key | `re_...` |
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_live_...` |
| `S3_ENDPOINT` | S3/R2 endpoint | `https://xxx.r2.cloudflarestorage.com` |
| `S3_ACCESS_KEY_ID` | S3 access key | `...` |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | `...` |

---

### Web Dockerfile

```dockerfile
# apps/web/Dockerfile
# ===================
# Production Dockerfile for Next.js Web App
# Target size: ~150MB

# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace config files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/db/package.json ./packages/db/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/

# Install ALL dependencies
RUN pnpm install --frozen-lockfile

# ============================================
# Stage 2: Builder
# ============================================
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/packages/ui/node_modules ./packages/ui/node_modules

# Copy source files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY apps/web ./apps/web
COPY packages/db ./packages/db
COPY packages/shared ./packages/shared
COPY packages/ui ./packages/ui

# Build packages first, then web
RUN pnpm --filter=@forgestack/shared build && \
    pnpm --filter=@forgestack/db build && \
    pnpm --filter=@forgestack/ui build && \
    pnpm --filter=@forgestack/web build

# ============================================
# Stage 3: Runner
# ============================================
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
```

**Required next.config.ts Update:**

```typescript
// apps/web/next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',  // <-- ADD THIS for Docker
  transpilePackages: ['@forgestack/ui', '@forgestack/shared', '@forgestack/db'],
  serverExternalPackages: ['pg'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
```

**Web Environment Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Public API URL | `https://api.example.com` |
| `DATABASE_URL` | PostgreSQL (for SSR) | `postgresql://user:pass@host:5432/db` |
| `BETTER_AUTH_SECRET` | Auth secret | `your-secret-key` |
| `BETTER_AUTH_URL` | Auth URL | `https://app.example.com` |

---

### Docker Compose for Production Testing

```yaml
# docker-compose.prod.yml
# =======================
# For local production-like testing
# Usage: docker compose -f docker-compose.prod.yml up --build

services:
  postgres:
    image: postgres:15-alpine
    container_name: forgestack-postgres-prod
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: forgestack
    volumes:
      - postgres_prod_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: forgestack-redis-prod
    volumes:
      - redis_prod_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    container_name: forgestack-api
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/forgestack
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
      # Add other required env vars
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  worker:
    build:
      context: .
      dockerfile: apps/worker/Dockerfile
    container_name: forgestack-worker
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/forgestack
      REDIS_URL: redis://redis:6379
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    container_name: forgestack-web
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://api:4000
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/forgestack
      NODE_ENV: production
    depends_on:
      - api

volumes:
  postgres_prod_data:
  redis_prod_data:
```

---

## Deployment Templates

### Fly.io Configuration

```toml
# fly.toml (for API - create separate files for each app)
# =======================================================

app = "forgestack-api"
primary_region = "iad"  # US East (Virginia)

[build]
  dockerfile = "apps/api/Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "4000"

[http_service]
  internal_port = 4000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1
  processes = ["app"]

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  path = "/api/health"
  timeout = "5s"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

```toml
# fly.worker.toml (for Worker)
# ============================

app = "forgestack-worker"
primary_region = "iad"

[build]
  dockerfile = "apps/worker/Dockerfile"

[env]
  NODE_ENV = "production"

[processes]
  worker = "node dist/index.js"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 512
```

```toml
# fly.web.toml (for Web)
# ======================

app = "forgestack-web"
primary_region = "iad"

[build]
  dockerfile = "apps/web/Dockerfile"

[env]
  NODE_ENV = "production"
  PORT = "3000"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[http_service.checks]]
  grace_period = "15s"
  interval = "30s"
  method = "GET"
  path = "/"
  timeout = "5s"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 1024
```

---

### Railway Configuration

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "apps/api/Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/main.js",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 10,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

---

### Render Configuration

```yaml
# render.yaml
# ===========
# Render Blueprint for all services

services:
  # API Service
  - type: web
    name: forgestack-api
    runtime: docker
    dockerfilePath: apps/api/Dockerfile
    dockerContext: .
    region: oregon
    plan: starter
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: forgestack-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: forgestack-redis
          type: redis
          property: connectionString
      - key: NODE_ENV
        value: production
    healthCheckPath: /api/health

  # Worker Service
  - type: worker
    name: forgestack-worker
    runtime: docker
    dockerfilePath: apps/worker/Dockerfile
    dockerContext: .
    region: oregon
    plan: starter
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: forgestack-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          name: forgestack-redis
          type: redis
          property: connectionString

  # Web Service
  - type: web
    name: forgestack-web
    runtime: docker
    dockerfilePath: apps/web/Dockerfile
    dockerContext: .
    region: oregon
    plan: starter
    envVars:
      - key: NEXT_PUBLIC_API_URL
        fromService:
          name: forgestack-api
          type: web
          property: host
      - key: NODE_ENV
        value: production
    healthCheckPath: /

databases:
  - name: forgestack-db
    plan: starter
    databaseName: forgestack
    user: forgestack

# Note: Redis must be created separately on Render
```

---

## GitHub Actions CI/CD

```yaml
# .github/workflows/docker-build.yml
# ===================================
# Build and push Docker images to GitHub Container Registry

name: Build and Push Docker Images

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_PREFIX: ${{ github.repository_owner }}/forgestack

jobs:
  build-api:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-api
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push API
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/api/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          platforms: linux/amd64,linux/arm64
          cache-from: type=gha
          cache-to: type=gha,mode=max

  build-worker:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-worker
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push Worker
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/worker/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          platforms: linux/amd64,linux/arm64
          cache-from: type=gha
          cache-to: type=gha,mode=max

  build-web:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to GHCR
        if: github.event_name != 'pull_request'
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_PREFIX }}-web
          tags: |
            type=ref,event=branch
            type=sha,prefix=
            type=raw,value=latest,enable=${{ github.ref == 'refs/heads/main' }}

      - name: Build and push Web
        uses: docker/build-push-action@v5
        with:
          context: .
          file: apps/web/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          platforms: linux/amd64,linux/arm64
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## Implementation Tasks

### 1. Dockerfile Creation
- [ ] 1.1 Create `apps/api/Dockerfile` with multi-stage build
- [ ] 1.2 Create `apps/worker/Dockerfile` with multi-stage build
- [ ] 1.3 Create `apps/web/Dockerfile` with Next.js standalone
- [ ] 1.4 Create `.dockerignore` at project root
- [ ] 1.5 Update `apps/web/next.config.ts` to add `output: 'standalone'`

### 2. Docker Compose Updates
- [ ] 2.1 Create `docker-compose.prod.yml` for production testing
- [ ] 2.2 Update root `.env.example` with all required variables
- [ ] 2.3 Test full stack with `docker compose -f docker-compose.prod.yml up --build`

### 3. Deployment Templates
- [ ] 3.1 Create `fly.toml` for API deployment
- [ ] 3.2 Create `fly.worker.toml` for Worker deployment
- [ ] 3.3 Create `fly.web.toml` for Web deployment
- [ ] 3.4 Create `railway.json` template
- [ ] 3.5 Create `render.yaml` blueprint

### 4. CI/CD Pipeline
- [ ] 4.1 Create `.github/workflows/docker-build.yml`
- [ ] 4.2 Configure GHCR authentication
- [ ] 4.3 Test workflow on PR branch
- [ ] 4.4 Verify multi-platform builds work
- [ ] 4.5 Verify image sizes meet targets

### 5. Documentation
- [ ] 5.1 Update root README.md with Docker instructions
- [ ] 5.2 Document environment variables for each app
- [ ] 5.3 Add deployment guide for each platform
- [ ] 5.4 Document local Docker development workflow

---

## Test Plan

### Local Docker Build Tests

| Test | Command | Expected |
|------|---------|----------|
| Build API image | `docker build -f apps/api/Dockerfile -t api .` | Builds successfully |
| Build Worker image | `docker build -f apps/worker/Dockerfile -t worker .` | Builds successfully |
| Build Web image | `docker build -f apps/web/Dockerfile -t web .` | Builds successfully |
| Check API size | `docker images api --format "{{.Size}}"` | ≤100MB |
| Check Worker size | `docker images worker --format "{{.Size}}"` | ≤100MB |
| Check Web size | `docker images web --format "{{.Size}}"` | ≤150MB |

### Container Runtime Tests

| Test | Steps | Expected |
|------|-------|----------|
| API starts | Run container, check logs | "Application running on port 4000" |
| API health check | `curl localhost:4000/api/health` | 200 OK with JSON |
| Worker starts | Run container, check logs | "Worker started, waiting for jobs..." |
| Worker processes job | Queue job, check logs | Job processed successfully |
| Web starts | Run container, check logs | "Ready on http://0.0.0.0:3000" |
| Web renders | `curl localhost:3000` | HTML response |

### Full Stack Integration Test

```bash
# Start everything
docker compose -f docker-compose.prod.yml up --build -d

# Wait for services
sleep 10

# Test health endpoints
curl -f http://localhost:4000/api/health
curl -f http://localhost:3000

# Test API functionality
curl http://localhost:4000/api/v1/health

# Check logs
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml logs worker
docker compose -f docker-compose.prod.yml logs web

# Cleanup
docker compose -f docker-compose.prod.yml down -v
```

### CI/CD Validation

| Test | Steps | Expected |
|------|-------|----------|
| PR build | Open PR, check Actions | All 3 images build successfully |
| Main push | Merge to main | Images pushed to GHCR |
| Multi-platform | Check image manifests | Both amd64 and arm64 available |
| Image tags | Check GHCR | `latest` and SHA tags present |

---

## Security Considerations

1. **Non-root users** – All containers run as non-root (`node` or custom user)
2. **No secrets in images** – All secrets via environment variables
3. **Minimal base image** – Alpine reduces attack surface
4. **No dev dependencies** – Production images don't include dev tools
5. **Read-only filesystem** – Consider `--read-only` flag in production
6. **Resource limits** – Set memory/CPU limits in orchestrator
7. **Image scanning** – Consider adding Trivy or Snyk scanning to CI

---

## Platform Comparison

| Feature | Fly.io | Railway | Render |
|---------|--------|---------|--------|
| Free tier | Yes (limited) | $5 credit | Yes (750h/mo) |
| Docker support | ✅ Native | ✅ Native | ✅ Native |
| Auto-scaling | ✅ | ✅ | ❌ (manual) |
| Regions | 30+ | 2 | 4 |
| Private networking | ✅ | ✅ | ✅ |
| Managed Postgres | ✅ | ✅ | ✅ |
| Managed Redis | ✅ (Upstash) | ✅ | ❌ |
| GitHub integration | ✅ | ✅ | ✅ |
| CLI | `flyctl` | `railway` | N/A |

---

## Notes

- All Dockerfiles are designed to be built from the **repository root** (context = `.`)
- The `pnpm deploy` command requires pnpm 7.0+
- Next.js standalone output requires the `output: 'standalone'` config option
- For Fly.io, run `fly launch` in each app directory to create the apps
- Consider using Docker layer caching in CI for faster builds
- Multi-platform builds (amd64/arm64) enable running on both Intel and ARM servers

---

*End of spec*

