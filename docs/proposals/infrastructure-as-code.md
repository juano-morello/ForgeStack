# Infrastructure as Code: Pulumi vs Terraform

**Status:** Proposal  
**Date:** 2025-12-02  
**Author:** ForgeStack Team

---

## Context: ForgeStack Infrastructure Dependencies

| Component | Current Provider | Notes |
|-----------|-----------------|-------|
| Database | PostgreSQL (Neon/Supabase) | Managed serverless |
| Cache/Queue | Redis + BullMQ | Upstash or self-hosted |
| Object Storage | Cloudflare R2 | S3-compatible |
| Payments | Stripe | Webhooks, products, prices |
| Frontend | Next.js on Vercel | Edge functions |
| Backend | NestJS API | Containerized or serverless |
| Auth | better-auth | Session/cookie management |

---

## Executive Summary

| Aspect | Terraform | Pulumi | Winner for ForgeStack |
|--------|-----------|--------|----------------------|
| Language | HCL (domain-specific) | TypeScript, Python, Go | **Pulumi** ✓ |
| Learning Curve | New syntax to learn | Use existing TS skills | **Pulumi** ✓ |
| Provider Ecosystem | 3,000+ providers | 170+ (uses TF bridge) | Terraform |
| State Management | Multiple backends | Pulumi Cloud (free tier) | Tie |
| Type Safety | None (validation only) | Full compile-time | **Pulumi** ✓ |
| Debugging | Plan/apply cycle | Real debugger | **Pulumi** ✓ |
| Cost | Free OSS, paid cloud | Free OSS, paid cloud | Tie |
| License | BSL 1.1 (controversial) | Apache 2.0 | **Pulumi** ✓ |

**Recommendation: Pulumi** — Better fit for a TypeScript-focused team with type safety, familiar tooling, and modern developer experience.

---

## 1. Language & Developer Experience

### Terraform

```hcl
# HCL - HashiCorp Configuration Language
resource "cloudflare_r2_bucket" "uploads" {
  account_id = var.cloudflare_account_id
  name       = "forgestack-uploads"
  location   = "WNAM"
}

resource "vercel_project" "web" {
  name      = "forgestack-web"
  framework = "nextjs"
  
  git_repository {
    type = "github"
    repo = "PulseDevLabs/ForgeStack"
  }
}
```

| Aspect | Assessment |
|--------|------------|
| **Syntax** | HCL is declarative, readable, but limited |
| **Learning Curve** | 2-4 weeks to become proficient |
| **IDE Support** | VS Code extension, basic completion |
| **Type Checking** | None — runtime validation only |
| **Debugging** | `terraform plan` / `terraform console` |
| **Logic/Loops** | Limited: `count`, `for_each`, `dynamic` blocks |
| **Testing** | `terraform test` (new), Terratest (Go) |

### Pulumi

```typescript
// TypeScript - Full language features
import * as cloudflare from "@pulumi/cloudflare";
import * as vercel from "@pulumiverse/vercel";

const uploadsBucket = new cloudflare.R2Bucket("uploads", {
  accountId: config.requireSecret("cloudflareAccountId"),
  name: "forgestack-uploads",
  location: "WNAM",
});

const webProject = new vercel.Project("web", {
  name: "forgestack-web",
  framework: "nextjs",
  gitRepository: {
    type: "github",
    repo: "PulseDevLabs/ForgeStack",
  },
});

// Export outputs with full type safety
export const bucketName = uploadsBucket.name;
export const projectId = webProject.id;
```

| Aspect | Assessment |
|--------|------------|
| **Syntax** | Native TypeScript — use what you know |
| **Learning Curve** | Hours if you know TypeScript |
| **IDE Support** | Full IntelliSense, go-to-definition, refactoring |
| **Type Checking** | Compile-time errors catch issues early |
| **Debugging** | VS Code debugger, breakpoints, step-through |
| **Logic/Loops** | Full language: `if`, `for`, `map`, async/await |
| **Testing** | Standard testing frameworks (Vitest, Jest) |

### Verdict: Language & DX

| Criterion | Winner | Reason |
|-----------|--------|--------|
| Learning curve for TS team | **Pulumi** | Zero new syntax |
| IDE experience | **Pulumi** | Full TypeScript tooling |
| Complex logic | **Pulumi** | Real programming language |
| Code reuse | **Pulumi** | npm packages, classes |
| Debugging | **Pulumi** | Actual debugger |

---

## 2. Provider Ecosystem

### ForgeStack Required Providers

| Provider | Terraform | Pulumi | Notes |
|----------|-----------|--------|-------|
| **Cloudflare** | ✅ Official | ✅ Native (v6.11) | R2, DNS, Workers |
| **Vercel** | ✅ Official | ✅ Community (v3.15) | Projects, domains, env vars |
| **PostgreSQL** | ✅ Official | ✅ Native | Databases, roles, schemas |
| **Stripe** | ⚠️ Community | ⚠️ Via REST/SDK | Products, prices, webhooks |
| **Redis** | ⚠️ Community | ⚠️ Via cloud providers | Upstash has Terraform provider |
| **GitHub** | ✅ Official | ✅ Native | Repos, secrets, actions |

### Ecosystem Comparison

| Aspect | Terraform | Pulumi |
|--------|-----------|--------|
| **Total Providers** | 3,000+ | 170+ native |
| **Provider Source** | HashiCorp + community | Native + Terraform bridge |
| **Registry** | registry.terraform.io | pulumi.com/registry |
| **Quality** | Varies widely | Consistent (bridged from TF) |
| **Updates** | Provider-dependent | Tracks TF providers |

### Key Insight

Pulumi can use **any Terraform provider** via the Terraform Bridge. This means:
- Access to the entire Terraform ecosystem
- Native TypeScript types generated automatically
- No loss of functionality

### Verdict: Provider Ecosystem

| Criterion | Winner | Reason |
|-----------|--------|--------|
| Raw provider count | Terraform | 3,000+ vs 170+ |
| ForgeStack providers | **Tie** | All required providers available |
| Type safety | **Pulumi** | Generated TypeScript types |
| Future-proofing | **Tie** | Pulumi bridges TF providers |

---

## 3. State Management

### Terraform State

```hcl
# Backend configuration
terraform {
  backend "s3" {
    bucket         = "forgestack-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

| Feature | Terraform OSS | Terraform Cloud |
|---------|--------------|-----------------|
| **Storage** | S3, GCS, Azure, local | Managed |
| **Locking** | DynamoDB, Consul, etc. | Built-in |
| **Encryption** | Server-side + optional | Automatic |
| **History** | Manual versioning | Automatic |
| **Cost** | Self-managed infra | Free (5 users) / $20/user |

### Pulumi State

```typescript
// Pulumi.yaml - Backend configuration
name: forgestack-infra
runtime: nodejs
backend:
  url: https://api.pulumi.com  // or s3://bucket, file://path
```

| Feature | Pulumi OSS | Pulumi Cloud |
|---------|-----------|--------------|
| **Storage** | S3, GCS, Azure, R2, local | Managed |
| **Locking** | Manual / S3 locks | Built-in |
| **Encryption** | Manual | Automatic |
| **History** | Manual | Automatic |
| **Cost** | Self-managed | Free (individual) / $40/user |

### State Management Comparison

| Feature | Terraform | Pulumi |
|---------|-----------|--------|
| Self-hosted backend | ✅ Many options | ✅ Many options |
| Managed backend | Terraform Cloud | Pulumi Cloud |
| State locking | Requires DynamoDB | Built-in with Cloud |
| Secrets in state | Encrypted at rest | Encrypted per-value |
| Drift detection | `terraform plan` | `pulumi refresh` |
| Import existing | `terraform import` | `pulumi import` |

### Verdict: State Management

| Criterion | Winner | Reason |
|-----------|--------|--------|
| Self-hosted options | **Tie** | Both support S3, GCS, etc. |
| Managed backend | **Tie** | Both have free tiers |
| Secrets handling | **Pulumi** | Per-value encryption |
| Setup simplicity | **Pulumi** | Less infra to manage |

---

## 4. Extensibility & Future-Proofing

### Multi-Cloud Support

| Cloud | Terraform | Pulumi |
|-------|-----------|--------|
| AWS | ✅ Official | ✅ Native |
| GCP | ✅ Official | ✅ Native |
| Azure | ✅ Official | ✅ Native |
| Cloudflare | ✅ Official | ✅ Native |
| DigitalOcean | ✅ Official | ✅ Native |
| Kubernetes | ✅ Official | ✅ Native + strong typing |

### Kubernetes Support

**Terraform:**
```hcl
resource "kubernetes_deployment" "api" {
  metadata {
    name = "forgestack-api"
  }
  spec {
    # ... lots of nested blocks
  }
}
```

**Pulumi:**
```typescript
import * as k8s from "@pulumi/kubernetes";

const api = new k8s.apps.v1.Deployment("api", {
  metadata: { name: "forgestack-api" },
  spec: {
    // Full TypeScript types for all K8s resources
    replicas: 3,
    selector: { matchLabels: { app: "api" } },
    template: {
      metadata: { labels: { app: "api" } },
      spec: {
        containers: [{
          name: "api",
          image: "forgestack/api:latest",
          ports: [{ containerPort: 4000 }],
        }],
      },
    },
  },
});
```

### Custom Resource Development

| Aspect | Terraform | Pulumi |
|--------|-----------|--------|
| **Language** | Go only | Any supported language |
| **Complexity** | High (gRPC plugin) | Medium (ComponentResource) |
| **Testing** | Terratest (Go) | Standard test frameworks |
| **Publishing** | Terraform Registry | npm, PyPI, etc. |

### Multi-Environment Management

**Terraform Workspaces:**
```bash
terraform workspace new staging
terraform workspace select prod
terraform apply
```

**Pulumi Stacks:**
```bash
pulumi stack init staging
pulumi stack select prod
pulumi up
```

| Feature | Terraform | Pulumi |
|---------|-----------|--------|
| Environment isolation | Workspaces | Stacks |
| Config per environment | `.tfvars` files | `Pulumi.<stack>.yaml` |
| Secret management | External (Vault, etc.) | Built-in encryption |
| Cross-stack references | Data sources | `StackReference` |

### Verdict: Extensibility

| Criterion | Winner | Reason |
|-----------|--------|--------|
| Multi-cloud | **Tie** | Both have excellent support |
| Kubernetes | **Pulumi** | Strongly typed resources |
| Custom providers | **Pulumi** | Use TypeScript, not Go |
| Multi-environment | **Pulumi** | Stacks are more intuitive |

---

## 5. CI/CD Integration

### GitHub Actions: Terraform

```yaml
name: Terraform
on:
  pull_request:
    paths: ['infra/**']

jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3

      - name: Terraform Init
        run: terraform init

      - name: Terraform Plan
        run: terraform plan -no-color
        continue-on-error: true

      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            // Post plan output to PR
```

### GitHub Actions: Pulumi

```yaml
name: Pulumi
on:
  pull_request:
    paths: ['infra/**']

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Dependencies
        run: npm ci
        working-directory: infra

      - uses: pulumi/actions@v5
        with:
          command: preview
          stack-name: staging
          comment-on-pr: true
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
```

### CI/CD Comparison

| Feature | Terraform | Pulumi |
|---------|-----------|--------|
| **GitHub Action** | `hashicorp/setup-terraform` | `pulumi/actions` |
| **PR Comments** | Manual (github-script) | Built-in |
| **Plan/Preview** | `terraform plan` | `pulumi preview` |
| **Drift Detection** | `terraform plan` | `pulumi refresh` |
| **Managed CI/CD** | Terraform Cloud | Pulumi Deployments |
| **Cost** | Free tier available | Free tier available |

### Secrets Management

| Approach | Terraform | Pulumi |
|----------|-----------|--------|
| Environment vars | ✅ | ✅ |
| GitHub Secrets | ✅ | ✅ |
| Vault integration | ✅ Native | ✅ Via ESC |
| Built-in secrets | ❌ | ✅ Pulumi ESC |
| OIDC (keyless) | ✅ | ✅ |

### Verdict: CI/CD Integration

| Criterion | Winner | Reason |
|-----------|--------|--------|
| GitHub Actions | **Pulumi** | Better PR comments |
| PR preview | **Tie** | Both support well |
| Secrets | **Pulumi** | Built-in ESC |
| Setup simplicity | **Pulumi** | Less configuration |

---

## 6. Cost & Licensing

### Open Source Licensing

| Tool | License | Implications |
|------|---------|--------------|
| **Terraform** | BSL 1.1 | Restrictive for competing products |
| **OpenTofu** | MPL 2.0 | Community fork, fully open |
| **Pulumi** | Apache 2.0 | Permissive, business-friendly |

### Managed Service Pricing

#### Terraform Cloud

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | 500 resources, 1 concurrent run |
| Team | $20/user/mo | SSO, policies, 5 concurrent runs |
| Business | Custom | Advanced security, audit logs |

#### Pulumi Cloud

| Tier | Price | Features |
|------|-------|----------|
| Individual | Free forever | Unlimited updates, 500 resources |
| Team | $40/user/mo | 10 users, OIDC, webhooks, AI |
| Enterprise | $400/mo base | Unlimited users, SSO, RBAC |

### Cost Analysis for ForgeStack

**Assumptions:**
- 3-5 team members
- ~200-500 managed resources
- Need: SSO, secrets, CI/CD integration

| Scenario | Terraform Cloud | Pulumi Cloud |
|----------|----------------|--------------|
| Individual dev | Free | Free |
| Small team (3) | $60/mo | Free (Individual) or $120/mo |
| Growing team (5) | $100/mo | Free or $200/mo |
| With SSO | $100+/mo | $400/mo (Enterprise) |

### Self-Hosted Options

| Backend | Terraform | Pulumi |
|---------|-----------|--------|
| S3 + DynamoDB | ~$5/mo | ~$3/mo (no DynamoDB) |
| Cloudflare R2 | ❌ Not supported | ✅ Supported |
| Local file | ✅ | ✅ |

### Verdict: Cost & Licensing

| Criterion | Winner | Reason |
|-----------|--------|--------|
| Open source license | **Pulumi** | Apache 2.0 is more permissive |
| Free tier | **Tie** | Both generous |
| Team pricing | Terraform | $20 vs $40/user |
| Self-hosted | **Pulumi** | R2 support, simpler setup |

---

## 7. Comparison Summary Table

| Dimension | Terraform | Pulumi | ForgeStack Winner |
|-----------|-----------|--------|-------------------|
| **Language** | HCL | TypeScript | **Pulumi** |
| **Learning Curve** | 2-4 weeks | Hours | **Pulumi** |
| **Type Safety** | None | Full | **Pulumi** |
| **IDE Experience** | Basic | Excellent | **Pulumi** |
| **Provider Count** | 3,000+ | 170+ (+TF bridge) | Terraform |
| **Required Providers** | All available | All available | **Tie** |
| **State Management** | Mature | Modern | **Tie** |
| **Secrets** | External | Built-in ESC | **Pulumi** |
| **Kubernetes** | Good | Excellent typing | **Pulumi** |
| **Custom Resources** | Go only | Any language | **Pulumi** |
| **CI/CD** | Good | Better DX | **Pulumi** |
| **License** | BSL 1.1 | Apache 2.0 | **Pulumi** |
| **Team Pricing** | $20/user | $40/user | Terraform |
| **Community** | Massive | Growing | Terraform |

**Overall Score: Pulumi 10 — Terraform 3 — Tie 2**

---

## 8. Recommendation

### Decision: **Pulumi** ✅

For ForgeStack, Pulumi is the clear winner based on:

1. **TypeScript Alignment** — Our team already uses TypeScript for frontend (Next.js) and backend (NestJS). No new language to learn.

2. **Type Safety** — Catch infrastructure errors at compile time, not deploy time. IDE shows exactly what properties are required.

3. **Modern Developer Experience** — Use VS Code debugger, write unit tests with Vitest, publish reusable packages to npm.

4. **Sufficient Provider Coverage** — All required providers (Cloudflare, Vercel, PostgreSQL, GitHub) have native or bridged support.

5. **Permissive License** — Apache 2.0 has no restrictions. BSL 1.1 could be problematic if we ever offer infrastructure services.

6. **Self-Hosted Flexibility** — Can use Cloudflare R2 as state backend, aligning with our existing infrastructure.

### When Terraform Might Be Better

- Team has existing Terraform expertise
- Need providers not available in Pulumi
- Prefer declarative-only configuration
- Budget-constrained on team pricing

---

## 9. Proposed Initial Scope

### Phase 1: Foundation (Week 1)

| Task | Description |
|------|-------------|
| Setup Pulumi project | Create `infra/` directory with TypeScript config |
| Configure state backend | Pulumi Cloud (free) or Cloudflare R2 |
| GitHub Actions | Add preview on PR, deploy on merge |

### Phase 2: Core Infrastructure (Week 2)

| Resource | Provider | Priority |
|----------|----------|----------|
| Cloudflare R2 buckets | `@pulumi/cloudflare` | P0 |
| Cloudflare DNS records | `@pulumi/cloudflare` | P0 |
| Vercel project | `@pulumiverse/vercel` | P0 |
| Vercel environment variables | `@pulumiverse/vercel` | P0 |

### Phase 3: Extended Infrastructure (Week 3-4)

| Resource | Provider | Priority |
|----------|----------|----------|
| GitHub repository settings | `@pulumi/github` | P1 |
| GitHub Actions secrets | `@pulumi/github` | P1 |
| Stripe products/prices | Custom component | P2 |
| Database configuration | `@pulumi/postgresql` | P2 |

### Proposed Directory Structure

```
infra/
├── Pulumi.yaml              # Project configuration
├── Pulumi.dev.yaml          # Dev stack config
├── Pulumi.staging.yaml      # Staging stack config
├── Pulumi.prod.yaml         # Production stack config
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── index.ts                 # Main entrypoint
├── src/
│   ├── cloudflare/
│   │   ├── r2.ts            # R2 bucket resources
│   │   └── dns.ts           # DNS records
│   ├── vercel/
│   │   ├── project.ts       # Vercel project
│   │   └── domains.ts       # Custom domains
│   ├── github/
│   │   └── repository.ts    # Repo settings
│   └── components/
│       └── stripe-config.ts # Custom Stripe component
└── __tests__/
    └── resources.test.ts    # Infrastructure tests
```

---

## 10. Next Steps

If we proceed with Pulumi:

### Immediate Actions

1. **Install Pulumi CLI**
   ```bash
   brew install pulumi
   pulumi login  # Creates free Pulumi Cloud account
   ```

2. **Initialize Project**
   ```bash
   mkdir infra && cd infra
   pulumi new typescript
   npm install @pulumi/cloudflare @pulumiverse/vercel
   ```

3. **Create First Resource**
   ```typescript
   // Start with a simple R2 bucket
   import * as cloudflare from "@pulumi/cloudflare";

   const uploads = new cloudflare.R2Bucket("uploads", {
     accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
     name: "forgestack-uploads-dev",
     location: "WNAM",
   });

   export const bucketName = uploads.name;
   ```

4. **Add to CI/CD**
   ```yaml
   # .github/workflows/infra.yml
   - uses: pulumi/actions@v5
     with:
       command: preview
       stack-name: dev
   ```

### Documentation to Create

- [ ] `docs/INFRASTRUCTURE.md` — How to work with IaC
- [ ] `infra/README.md` — Quick start for the infra directory
- [ ] Runbook for common operations

### Team Preparation

- [ ] 30-min Pulumi overview session
- [ ] Set up Pulumi Cloud organization
- [ ] Create API tokens for CI/CD
- [ ] Define stack naming convention

---

## References

- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [Pulumi Registry](https://www.pulumi.com/registry/)
- [Pulumi vs Terraform](https://www.pulumi.com/docs/iac/comparisons/terraform/)
- [Terraform Documentation](https://developer.hashicorp.com/terraform/docs)
- [OpenTofu](https://opentofu.org/) (open-source Terraform fork)

