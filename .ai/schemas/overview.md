# Database Schema Overview

ForgeStack uses PostgreSQL with Drizzle ORM and Row-Level Security (RLS).

## Schema Location

All schema definitions are in `packages/db/src/schema/`.

## Table Summary

### Core Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `users` | User accounts (better-auth) | No |
| `sessions` | Active sessions | No |
| `accounts` | OAuth accounts | No |
| `verifications` | Email verification tokens | No |
| `organizations` | Tenant organizations | No |
| `organization_members` | User-org membership | No |
| `projects` | Org-scoped projects | Yes |
| `invitations` | Pending member invites | No |

### RBAC Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `roles` | System and custom roles | No |
| `permissions` | Available permissions | No |
| `role_permissions` | Role-permission mapping | No |
| `member_roles` | User role assignments | No |

### Billing Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `customers` | Stripe customer mapping | No |
| `subscriptions` | Active subscriptions | No |
| `plans` | Subscription plans | No |
| `billing_events` | Billing event history | No |
| `usage_records` | Usage tracking | Yes |
| `usage_limits` | Plan-based limits | No |

### Feature Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `api_keys` | API keys | Yes |
| `webhook_endpoints` | Outgoing webhook URLs | Yes |
| `webhook_deliveries` | Delivery attempts | Yes |
| `incoming_webhook_events` | Received webhooks | No |
| `audit_logs` | Org audit trail | Yes |
| `platform_audit_logs` | Platform admin actions | No |
| `activities` | Activity feed | Yes |
| `notifications` | User notifications | Yes |
| `files` | File metadata | Yes |
| `feature_flags` | Feature flag definitions | No |

## Key Relationships

```
users
  ├── organizations (owner)
  ├── organization_members (membership)
  ├── member_roles (role assignments)
  ├── sessions
  └── accounts

organizations
  ├── organization_members
  ├── projects
  ├── api_keys
  ├── webhook_endpoints
  ├── audit_logs
  ├── activities
  ├── files
  ├── customers (1:1)
  ├── subscriptions
  └── usage_records

roles
  ├── role_permissions
  └── member_roles
```

## Common Column Patterns

### Timestamps

```typescript
createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
```

### Foreign Keys

```typescript
// Organization reference (UUID)
orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

// User reference (text - better-auth uses text IDs)
userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
```

### Soft Delete

```typescript
deletedAt: timestamp('deleted_at', { withTimezone: true }),
```

## Type Exports

Each schema file exports types:

```typescript
// packages/db/src/schema/projects.ts
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
```

Import from `@forgestack/db`:

```typescript
import { Project, NewProject, projects } from '@forgestack/db';
```

## Key Tables Detail

### users

```typescript
{
  id: text,              // UUID as text (better-auth)
  name: text,
  email: varchar(255),
  emailVerified: boolean,
  image: text | null,
  isSuperAdmin: boolean,
  suspendedAt: timestamp | null,
  suspendedReason: text | null,
  onboardingCompletedAt: timestamp | null,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

### organizations

```typescript
{
  id: uuid,
  name: varchar(255),
  ownerUserId: text,     // FK to users
  logo: text | null,
  timezone: text,
  language: text,
  suspendedAt: timestamp | null,
  suspendedReason: text | null,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

### projects

```typescript
{
  id: uuid,
  orgId: uuid,           // FK to organizations (RLS)
  name: varchar(255),
  description: text | null,
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

### api_keys

```typescript
{
  id: uuid,
  orgId: uuid,           // FK to organizations (RLS)
  name: text,
  keyPrefix: text,       // Visible prefix "fsk_live_xxx"
  keyHash: text,         // SHA-256 hash for lookup
  scopes: text[],        // ['read', 'write']
  lastUsedAt: timestamp | null,
  expiresAt: timestamp | null,
  revokedAt: timestamp | null,
  createdBy: text,       // FK to users
  createdAt: timestamp,
  updatedAt: timestamp,
}
```

## Migrations

```bash
# Generate migration from schema changes
cd packages/db && pnpm db:generate

# Apply migrations
cd packages/db && pnpm db:migrate

# Push schema directly (dev only)
cd packages/db && pnpm db:push

# Open Drizzle Studio
cd packages/db && pnpm db:studio
```

