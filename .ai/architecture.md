# ForgeStack Architecture

## Overview

ForgeStack is a production-grade multi-tenant SaaS starter kit built with:

- **Backend**: NestJS 11 + Drizzle ORM + PostgreSQL with Row-Level Security (RLS)
- **Frontend**: Next.js 16 + React 19 + Tailwind CSS + shadcn/ui
- **Background Jobs**: BullMQ workers with Redis
- **Package Manager**: pnpm with Turborepo

## Monorepo Structure

```
ForgeStack/
├── apps/
│   ├── api/              # NestJS backend (port 4000)
│   │   └── src/
│   │       ├── core/     # Guards, decorators, interceptors
│   │       ├── auth/     # Authentication (better-auth)
│   │       ├── organizations/  # Org management
│   │       ├── projects/      # Sample CRUD resource
│   │       ├── billing/       # Stripe integration
│   │       ├── api-keys/      # API key management
│   │       ├── webhooks/      # Outgoing webhooks
│   │       ├── audit-logs/    # Immutable audit logs
│   │       ├── feature-flags/ # Feature gating
│   │       ├── files/         # File upload (R2/S3)
│   │       ├── notifications/ # In-app notifications
│   │       └── queue/         # BullMQ job dispatch
│   │
│   ├── web/              # Next.js frontend (port 3000)
│   │   └── src/
│   │       ├── app/      # App Router pages
│   │       ├── components/  # Feature components
│   │       ├── hooks/    # Data fetching hooks
│   │       └── lib/      # Utilities
│   │
│   └── worker/           # BullMQ job processors
│       └── src/
│           ├── handlers/ # Job handlers
│           └── services/ # Email, etc.
│
├── packages/
│   ├── db/               # Drizzle ORM + schema + RLS
│   │   └── src/
│   │       ├── schema/   # Table definitions
│   │       ├── context.ts  # withTenantContext, withServiceContext
│   │       └── migrations/ # SQL migrations
│   │
│   ├── shared/           # Shared types, DTOs, constants
│   │   └── src/
│   │       ├── types/    # TypeScript types
│   │       └── queues.ts # Queue name constants
│   │
│   ├── ui/               # Shared UI components
│   └── sdk/              # TypeScript SDK for API
│
└── docs/
    ├── agents.md         # Project configuration
    ├── specs/            # Feature specifications
    └── decisions/        # Architecture Decision Records
```

## Critical Architecture Concepts

### 1. Multi-Tenancy with PostgreSQL RLS

Every organization is a tenant. Row-Level Security (RLS) policies enforce data isolation at the database level.

```typescript
// ALWAYS use withTenantContext for org-scoped queries
import { withTenantContext, type TenantContext } from '@forgestack/db';

async function getProjects(ctx: TenantContext) {
  return withTenantContext(ctx, async (tx) => {
    // RLS automatically filters by ctx.orgId
    return tx.select().from(projects);
  });
}
```

**TenantContext** contains:
- `orgId: string` - Current organization UUID
- `userId: string` - Current user UUID
- `role: OrgRole` - User's role in the organization ('OWNER' | 'MEMBER')

### 2. Backend Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│                   Controller                         │
│  • HTTP handling, validation, Swagger docs          │
│  • Injects TenantContext via @CurrentTenant()       │
│  • Permission checks via @RequirePermission()       │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                    Service                           │
│  • Business logic, orchestration                    │
│  • Calls Repository for DB operations               │
│  • Triggers audit logs, activities, notifications   │
│  • Queues background jobs                           │
└─────────────────────┬───────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────┐
│                  Repository                          │
│  • Database access only                             │
│  • Uses withTenantContext for RLS                   │
│  • Drizzle ORM queries                              │
└─────────────────────────────────────────────────────┘
```

### 3. Background Job Processing

```
┌─────────────────┐         ┌─────────────┐         ┌─────────────────┐
│    NestJS API   │         │    Redis    │         │   BullMQ Worker │
│                 │         │             │         │                 │
│  QueueService   │ ──────▶ │   Queues    │ ◀────── │   Handlers      │
│  (enqueue job)  │         │             │         │  (process job)  │
└─────────────────┘         └─────────────┘         └─────────────────┘
```

Jobs are enqueued by the API and processed asynchronously by workers:
- Email sending (welcome, invitations, notifications)
- Webhook delivery with retries
- Audit log persistence
- Activity feed updates
- Stripe webhook processing
- File cleanup

### 4. Type System

All shared types live in `@forgestack/shared`:

```typescript
import {
  type TenantContext,
  type OrgRole,
  QUEUE_NAMES,
  type QueueName,
} from '@forgestack/shared';
```

### 5. Permission System (RBAC)

33 permissions across 11 resources:

| Resource | Actions |
|----------|---------|
| `organization` | `read`, `update`, `delete` |
| `member` | `read`, `invite`, `update`, `remove` |
| `role` | `read`, `create`, `update`, `delete`, `assign` |
| `project` | `read`, `create`, `update`, `delete` |
| `billing` | `read`, `manage` |
| `api_key` | `read`, `create`, `revoke` |
| `webhook` | `read`, `create`, `update`, `delete` |
| `file` | `read`, `upload`, `delete` |
| `audit_log` | `read`, `export` |
| `feature_flag` | `read` |
| `settings` | `read`, `update` |

```typescript
@RequirePermission('project', 'create')
async createProject(@CurrentTenant() ctx: TenantContext, @Body() dto: CreateProjectDto) { }
```

