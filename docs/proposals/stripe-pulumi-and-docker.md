# Stripe Pulumi Component & Docker Infrastructure Research

**Status:** Proposal  
**Date:** 2025-12-02  
**Author:** AI Assistant  

---

## Table of Contents

1. [Stripe Custom Pulumi Component](#1-stripe-custom-pulumi-component)
2. [Docker Infrastructure for API](#2-docker-infrastructure-for-api)
3. [Recommendations](#3-recommendations)
4. [Next Steps](#4-next-steps)

---

## 1. Stripe Custom Pulumi Component

### 1.1 Resources to Manage

Based on ForgeStack's billing implementation (`apps/api/src/billing/stripe.service.ts`), we need to manage:

| Resource | Purpose | Stripe API |
|----------|---------|------------|
| **Products** | Define service tiers (Free, Pro, Enterprise) | `stripe.products.create()` |
| **Prices** | Pricing for each product (monthly/yearly) | `stripe.prices.create()` |
| **Webhook Endpoints** | Receive billing events | `stripe.webhookEndpoints.create()` |
| **Customer Portal** | Self-service billing management | `stripe.billingPortal.configurations.create()` |

### 1.2 Existing Solutions

#### Terraform Provider (Bridgeable to Pulumi)

| Provider | Status | Resources | Last Updated |
|----------|--------|-----------|--------------|
| `franckverrot/terraform-provider-stripe` | ⚠️ Stale | Products, Prices, Webhooks, Portal | June 2022 |

**Pros:**
- Covers all needed resources
- MPL-2.0 license (compatible)
- Can be bridged to Pulumi with `pulumi-terraform-bridge`

**Cons:**
- Last updated 2+ years ago
- May not support latest Stripe API features
- Stripe SDK v20 has breaking changes since 2022

#### Native Pulumi Provider

**None exists.** No official or community Pulumi provider for Stripe.

### 1.3 Implementation Approaches

#### Option A: Pulumi Dynamic Provider (Recommended)

Create a TypeScript dynamic provider wrapping the Stripe SDK directly.

```typescript
// infra/src/providers/stripe/product.ts
import * as pulumi from "@pulumi/pulumi";
import Stripe from "stripe";

interface StripeProductInputs {
  name: string;
  description?: string;
  metadata?: Record<string, string>;
}

const stripeProductProvider: pulumi.dynamic.ResourceProvider = {
  async create(inputs: StripeProductInputs) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const product = await stripe.products.create({
      name: inputs.name,
      description: inputs.description,
      metadata: inputs.metadata,
    });
    return { id: product.id, outs: { ...product } };
  },

  async update(id: string, olds: StripeProductInputs, news: StripeProductInputs) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const product = await stripe.products.update(id, {
      name: news.name,
      description: news.description,
      metadata: news.metadata,
    });
    return { outs: { ...product } };
  },

  async delete(id: string) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    await stripe.products.update(id, { active: false }); // Stripe doesn't allow hard delete
  },

  async read(id: string) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const product = await stripe.products.retrieve(id);
    return { id: product.id, props: { ...product } };
  },
};

export class StripeProduct extends pulumi.dynamic.Resource {
  public readonly stripeId!: pulumi.Output<string>;
  public readonly name!: pulumi.Output<string>;

  constructor(name: string, args: StripeProductInputs, opts?: pulumi.CustomResourceOptions) {
    super(stripeProductProvider, name, { stripeId: undefined, ...args }, opts);
  }
}
```

**Effort Estimate:**

| Component | Complexity | Time |
|-----------|------------|------|
| Product resource | Low | 2 hours |
| Price resource | Medium | 3 hours |
| Webhook resource | Medium | 3 hours |
| Portal config | Medium | 3 hours |
| Testing & docs | Medium | 4 hours |
| **Total** | | **~15 hours** |

#### Option B: Terraform Bridge

Bridge the existing `terraform-provider-stripe` to Pulumi.

```bash
# Requires building a bridge package
pulumi package add terraform-provider franckverrot/stripe
```

**Effort Estimate:** ~8 hours (but risk of outdated API)

#### Option C: ComponentResource (No State Management)

Use Stripe SDK directly without Pulumi state tracking.

```typescript
// Simple but no drift detection or state management
export class StripeSetup extends pulumi.ComponentResource {
  constructor(name: string, opts?: pulumi.ComponentResourceOptions) {
    super("forgestack:billing:StripeSetup", name, {}, opts);
    // Imperative setup - runs every time
  }
}
```

**Not recommended** - loses IaC benefits.

### 1.4 Comparison Matrix

| Approach | Type Safety | State Mgmt | Maintenance | Stripe SDK Version |
|----------|-------------|------------|-------------|-------------------|
| Dynamic Provider | ✅ Full | ✅ Yes | Medium | ✅ Latest (v20) |
| Terraform Bridge | ⚠️ Generated | ✅ Yes | Low | ❌ Outdated |
| ComponentResource | ✅ Full | ❌ No | Low | ✅ Latest |

---

## 2. Docker Infrastructure for API

### 2.1 Current State

**Finding: No Dockerfiles exist in ForgeStack.**

```bash
$ find . -name "Dockerfile*"
# (no results)
```

The `docker-compose.yml` only contains local development services:

```yaml
services:
  postgres:
    image: postgres:15-alpine
  redis:
    image: redis:7-alpine
```

The README references Docker commands that don't work:
```bash
# These commands fail - Dockerfiles don't exist
docker build -t forgestack-api -f apps/api/Dockerfile .
docker build -t forgestack-web -f apps/web/Dockerfile .
```

### 2.2 What's Needed for Containerization

#### NestJS API Dockerfile

```dockerfile
# apps/api/Dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/db/package.json ./packages/db/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/db ./packages/db
COPY apps/api ./apps/api

# Build
RUN pnpm --filter @forgestack/db build
RUN pnpm --filter api build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Install pnpm for production deps
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy built artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/packages/db/dist ./node_modules/@forgestack/db/dist
COPY --from=builder /app/packages/db/package.json ./node_modules/@forgestack/db/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

EXPOSE 4000

CMD ["node", "dist/main.js"]
```

#### Key Considerations

| Aspect | Approach |
|--------|----------|
| **Monorepo** | Multi-stage build with workspace dependencies |
| **Package Manager** | pnpm with `--frozen-lockfile` |
| **Base Image** | `node:20-alpine` (small, secure) |
| **Health Check** | Uses existing `/health` endpoint |
| **Secrets** | Environment variables at runtime |

### 2.3 Registry Strategy Options

| Registry | Pros | Cons | Cost |
|----------|------|------|------|
| **GitHub Container Registry** | Integrated with repo, free for public | 500MB free for private | Free-$4/GB |
| **Docker Hub** | Universal, well-known | Rate limits | Free tier limited |
| **Cloudflare R2** | Already using R2 | Not a container registry | N/A |

**Recommendation:** GitHub Container Registry (GHCR)
- Already using GitHub
- Integrates with GitHub Actions
- Free for public repos

### 2.4 Platform-Specific Configurations

#### Fly.io

```toml
# fly.toml
app = "forgestack-api"
primary_region = "iad"

[build]
  dockerfile = "apps/api/Dockerfile"

[env]
  PORT = "4000"
  NODE_ENV = "production"

[http_service]
  internal_port = 4000
  force_https = true

[[services.http_checks]]
  path = "/health"
  interval = "10s"
  timeout = "2s"
```

#### Railway

```json
// railway.json
{
  "build": {
    "dockerfilePath": "apps/api/Dockerfile"
  },
  "deploy": {
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## 3. Recommendations

### 3.1 Stripe Pulumi Component

**Recommendation: Pulumi Dynamic Provider**

| Factor | Decision |
|--------|----------|
| Approach | Dynamic Provider wrapping Stripe SDK |
| Language | TypeScript (matches codebase) |
| SDK Version | Stripe v20 (current) |
| Effort | ~15 hours |

**Rationale:**
1. Full control over Stripe API version
2. Type-safe with current SDK
3. No dependency on stale Terraform provider
4. Matches team's TypeScript expertise

### 3.2 Docker Infrastructure

**Recommendation: Create Dockerfiles + GHCR**

| Component | Priority | Effort |
|-----------|----------|--------|
| `apps/api/Dockerfile` | High | 2 hours |
| `apps/web/Dockerfile` | Medium | 2 hours |
| `apps/worker/Dockerfile` | Medium | 1 hour |
| `.dockerignore` | High | 30 min |
| GitHub Actions workflow | High | 2 hours |
| **Total** | | **~8 hours** |

---

## 4. Next Steps

### If Proceeding with Stripe Pulumi Component

1. [ ] Create `infra/src/providers/stripe/` directory structure
2. [ ] Implement `StripeProduct` dynamic resource
3. [ ] Implement `StripePrice` dynamic resource
4. [ ] Implement `StripeWebhook` dynamic resource
5. [ ] Implement `StripePortalConfig` dynamic resource
6. [ ] Add integration tests with Stripe test mode
7. [ ] Document usage in `infra/README.md`

### If Proceeding with Docker Infrastructure

1. [ ] Create `apps/api/Dockerfile`
2. [ ] Create `.dockerignore` at repo root
3. [ ] Test local build: `docker build -t forgestack-api -f apps/api/Dockerfile .`
4. [ ] Create GitHub Actions workflow for building/pushing images
5. [ ] Update README with correct Docker instructions
6. [ ] Create Dockerfiles for `apps/web` and `apps/worker`

---

## References

- [Pulumi Dynamic Providers](https://www.pulumi.com/docs/iac/concepts/resources/dynamic-providers/)
- [Stripe API Reference](https://stripe.com/docs/api)
- [terraform-provider-stripe](https://github.com/franckverrot/terraform-provider-stripe)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
