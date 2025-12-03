# Phase 3: Admin Dashboard & Usage Billing

**Epic:** Platform Administration & Usage-Based Billing  
**Priority:** Phase 3  
**Depends on:** Phase 1 (Core Auth/Multi-tenancy), Phase 2 (Billing V1), RBAC  
**Status:** Draft

---

## 1. Overview

Phase 3 introduces two major capabilities to ForgeStack:

### Part A: Super-Admin Dashboard
A platform-level administration interface for managing the entire ForgeStack platform, separate from tenant-level organization admins. Super-admins can:
- Manage users and organizations across ALL tenants
- Monitor system health and platform metrics
- Configure feature flags globally
- View and search platform-wide audit logs
- Manage platform configuration

### Part B: Usage-Based Billing
Extension of the existing Stripe billing integration to support metered usage tracking and consumption-based pricing:
- Track metered usage (API calls, storage, seats)
- Tiered pricing (Free, Pro, Enterprise)
- Usage aggregation and Stripe reporting
- Customer billing portal with usage visibility
- Invoice generation with usage breakdowns

---

## 2. Goals

| Goal | Description |
|------|-------------|
| **Platform Control** | Enable platform operators to manage all tenants from a single dashboard |
| **Operational Visibility** | Real-time insights into platform health and usage patterns |
| **Revenue Optimization** | Implement usage-based billing to align revenue with value delivered |
| **Self-Service Billing** | Customers can view usage, manage subscriptions, and access invoices |
| **Scalability** | Async, non-blocking usage tracking that scales with API volume |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SUPER-ADMIN DASHBOARD                                  │
│                       (Platform-level, no org context)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ User Mgmt   │  │ Org Mgmt    │  │ Metrics     │  │ Feature Flags / Config  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API LAYER                                           │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │  Super-Admin Guard (checks isSuperAdmin flag, bypasses org context)     │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│   ┌─────────────────────┐  ┌────────────────────┐  ┌────────────────────────┐   │
│   │  /admin/users       │  │  /admin/orgs       │  │  /admin/metrics        │   │
│   │  /admin/audit-logs  │  │  /admin/flags      │  │  /admin/config         │   │
│   └─────────────────────┘  └────────────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           USAGE BILLING SYSTEM                                   │
│  ┌──────────────────┐   ┌───────────────────┐   ┌───────────────────────────┐   │
│  │  Usage Tracker   │──▶│  Redis Counters   │──▶│  Async Aggregation Job    │   │
│  │  (Interceptor)   │   │  (Real-time)      │   │  (Hourly flush to DB)     │   │
│  └──────────────────┘   └───────────────────┘   └───────────────────────────┘   │
│                                   │                          │                   │
│                                   ▼                          ▼                   │
│                         ┌────────────────────┐    ┌────────────────────────┐    │
│                         │  usage_records     │    │  Stripe Usage Report   │    │
│                         │  (PostgreSQL)      │    │  (Monthly billing)     │    │
│                         └────────────────────┘    └────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. User Stories

### Part A: Super-Admin Dashboard

#### US-A1: Super-Admin Authentication
**As a** platform operator,  
**I want to** log in as a super-admin,  
**So that** I can access platform-wide administration features.

#### US-A2: User Management
**As a** super-admin,  
**I want to** view, search, and manage all users across the platform,  
**So that** I can support users and enforce platform policies.

#### US-A3: Organization Management
**As a** super-admin,  
**I want to** view, search, and manage all organizations,  
**So that** I can support organizations and handle escalations.

#### US-A4: System Health Dashboard
**As a** super-admin,  
**I want to** view platform health metrics and system status,  
**So that** I can proactively identify and resolve issues.

#### US-A5: Feature Flag Management
**As a** super-admin,  
**I want to** manage feature flags globally and add org-specific overrides,  
**So that** I can control feature rollouts across the platform.

#### US-A6: Platform Audit Logs
**As a** super-admin,  
**I want to** search and view audit logs across all organizations,  
**So that** I can investigate security incidents and compliance issues.

### Part B: Usage Billing

#### US-B1: Track API Usage
**As the** system,  
**I want to** track API calls per organization automatically,  
**So that** usage can be billed accurately.

#### US-B2: Track Storage Usage
**As the** system,  
**I want to** track file storage consumption per organization,  
**So that** storage can be billed based on usage.

#### US-B3: Track Active Seats
**As the** system,  
**I want to** track active member seats per organization,  
**So that** per-seat billing is accurate.

#### US-B4: View Usage Dashboard
**As an** organization owner,  
**I want to** view my organization's usage metrics,  
**So that** I can understand our consumption and costs.

#### US-B5: Usage-Based Invoicing
**As the** system,  
**I want to** report usage to Stripe for metered billing,  
**So that** invoices reflect actual usage.

#### US-B6: Billing Portal Access
**As an** organization owner,  
**I want to** access a billing portal to view invoices and manage payment,  
**So that** I have self-service control over billing.

---

## 5. Acceptance Criteria

### Part A: Super-Admin Dashboard

#### US-A1: Super-Admin Authentication
- [ ] Super-admin flag stored on user record (`is_super_admin` boolean)
- [ ] Super-admin login uses same auth flow but gains elevated access
- [ ] Super-admin bypass org context requirement for admin endpoints
- [ ] Super-admin actions logged to platform-level audit log
- [ ] Super-admin cannot be assigned via API (manual DB/seed only)

#### US-A2: User Management
- [ ] List all users with pagination and search (name, email)
- [ ] View user details including all org memberships
- [ ] Suspend/unsuspend user accounts
- [ ] Force password reset for user
- [ ] Delete user account (with confirmation)
- [ ] View user's login history and sessions

#### US-A3: Organization Management
- [ ] List all organizations with pagination and search
- [ ] View organization details (members, subscription, usage)
- [ ] Transfer organization ownership
- [ ] Suspend/unsuspend organization
- [ ] Delete organization (with confirmation, cascades)
- [ ] View organization's billing and subscription status

#### US-A4: System Health Dashboard
- [ ] Display API request rate (requests/second)
- [ ] Display error rate (4xx, 5xx percentages)
- [ ] Display database connection pool status
- [ ] Display Redis connection status
- [ ] Display BullMQ queue depths and processing rates
- [ ] Display active user/org counts
- [ ] Configurable time range (1h, 24h, 7d, 30d)

#### US-A5: Feature Flag Management
- [ ] List all feature flags with current status
- [ ] Create new feature flags
- [ ] Update flag settings (enabled, plans, percentage)
- [ ] Add organization-specific overrides
- [ ] Remove organization overrides
- [ ] View override history

#### US-A6: Platform Audit Logs
- [ ] Search audit logs across all organizations
- [ ] Filter by org, user, action, resource, date range
- [ ] View detailed audit log entry
- [ ] Export filtered audit logs (CSV/JSON)
- [ ] Platform-level events (super-admin actions) captured

### Part B: Usage Billing

#### US-B1: Track API Usage
- [ ] Every authenticated API request increments org usage counter
- [ ] Counters stored in Redis for real-time tracking
- [ ] Non-blocking (fire-and-forget) tracking
- [ ] Hourly aggregation job flushes to database
- [ ] Usage tracked by endpoint category (read, write, compute)

#### US-B2: Track Storage Usage
- [ ] File upload increments storage used
- [ ] File deletion decrements storage used
- [ ] Current storage usage queryable per org
- [ ] Storage limits enforced based on plan
- [ ] Warning notifications at 80% and 100% usage

#### US-B3: Track Active Seats
- [ ] Active seat = member who logged in within 30 days
- [ ] Daily job calculates active seats per org
- [ ] Seat count used for per-seat billing
- [ ] Seat limits enforced based on plan (soft/hard limits)
- [ ] Owner notified when approaching seat limit

#### US-B4: View Usage Dashboard
- [ ] Display current billing period usage
- [ ] Show API calls with daily breakdown chart
- [ ] Show storage used vs. limit
- [ ] Show active seats vs. limit
- [ ] Show projected invoice amount
- [ ] Accessible to all org members (read) / owners (manage)

#### US-B5: Usage-Based Invoicing
- [ ] Daily job reports usage to Stripe (via Usage Records API)
- [ ] Usage aggregated at end of billing period
- [ ] Stripe generates invoice with usage line items
- [ ] Overages calculated based on plan tier
- [ ] Invoice webhook updates local records

#### US-B6: Billing Portal Access
- [ ] Customer portal link generated via Stripe
- [ ] Portal shows current subscription
- [ ] Portal shows usage-based charges
- [ ] Portal allows payment method update
- [ ] Portal shows invoice history
- [ ] Portal allows subscription cancellation

---

## 6. Database Schema Additions

### 6.1 Super-Admin Flag on Users Table

```typescript
// packages/db/src/schema/users.ts - Add to existing users table
// Add column:
isSuperAdmin: boolean('is_super_admin').default(false).notNull(),
```

### 6.2 Platform Audit Logs Table

```typescript
// packages/db/src/schema/platform-audit-logs.ts
import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Platform-level audit logs for super-admin actions
 * NOT scoped to org_id - platform-wide
 */
export const platformAuditLogs = pgTable('platform_audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Actor (super-admin)
  actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
  actorEmail: text('actor_email'),

  // Action
  action: text('action').notNull(), // 'user.suspended', 'org.deleted', 'flag.updated'
  resourceType: text('resource_type').notNull(), // 'user', 'organization', 'feature_flag'
  resourceId: text('resource_id'),
  resourceName: text('resource_name'),

  // Target org (if action affects an org)
  targetOrgId: uuid('target_org_id'),
  targetOrgName: text('target_org_name'),

  // Details
  changes: jsonb('changes'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  actorIdIdx: index('idx_platform_audit_logs_actor_id').on(table.actorId),
  actionIdx: index('idx_platform_audit_logs_action').on(table.action),
  resourceTypeIdx: index('idx_platform_audit_logs_resource_type').on(table.resourceType),
  targetOrgIdIdx: index('idx_platform_audit_logs_target_org_id').on(table.targetOrgId),
  createdAtIdx: index('idx_platform_audit_logs_created_at').on(table.createdAt),
}));
```

### 6.3 Usage Records Table

```typescript
// packages/db/src/schema/usage-records.ts
import { pgTable, uuid, text, timestamp, bigint, index, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

/**
 * Usage records - aggregated usage per org per time period
 */
export const usageRecords = pgTable('usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Time period (hourly buckets)
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),

  // Usage metrics
  metricType: text('metric_type').notNull(), // 'api_calls', 'storage_bytes', 'active_seats'
  quantity: bigint('quantity', { mode: 'number' }).notNull().default(0),

  // Stripe reporting
  reportedToStripe: boolean('reported_to_stripe').default(false),
  stripeUsageRecordId: text('stripe_usage_record_id'),
  reportedAt: timestamp('reported_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdIdx: index('idx_usage_records_org_id').on(table.orgId),
  periodIdx: index('idx_usage_records_period').on(table.periodStart, table.periodEnd),
  metricTypeIdx: index('idx_usage_records_metric_type').on(table.metricType),
  orgPeriodMetricUnique: unique('uq_usage_records_org_period_metric').on(
    table.orgId, table.periodStart, table.metricType
  ),
}));
```

### 6.4 Usage Limits Table

```typescript
// packages/db/src/schema/usage-limits.ts
import { pgTable, uuid, text, bigint, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

/**
 * Usage limits per organization (overrides plan defaults)
 */
export const usageLimits = pgTable('usage_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  metricType: text('metric_type').notNull(), // 'api_calls_monthly', 'storage_bytes', 'seats'
  limitValue: bigint('limit_value', { mode: 'number' }).notNull(),

  // Optional: soft vs hard limit
  isHardLimit: boolean('is_hard_limit').default(true).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdIdx: index('idx_usage_limits_org_id').on(table.orgId),
  orgMetricUnique: unique('uq_usage_limits_org_metric').on(table.orgId, table.metricType),
}));
```

### 6.5 Plan Definitions Table

```typescript
// packages/db/src/schema/plans.ts
import { pgTable, uuid, text, bigint, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';

/**
 * Plan definitions with default limits and pricing
 */
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: text('name').notNull().unique(), // 'free', 'pro', 'enterprise'
  displayName: text('display_name').notNull(),
  description: text('description'),

  // Stripe price IDs
  stripePriceIdMonthly: text('stripe_price_id_monthly'),
  stripePriceIdYearly: text('stripe_price_id_yearly'),
  stripeMeteredPriceId: text('stripe_metered_price_id'), // For usage-based component

  // Default limits
  limits: jsonb('limits').notNull().default('{}'),
  // Example: { "api_calls_monthly": 10000, "storage_bytes": 1073741824, "seats": 5 }

  // Pricing display
  priceMonthly: bigint('price_monthly', { mode: 'number' }), // In cents
  priceYearly: bigint('price_yearly', { mode: 'number' }),

  // Feature access
  features: jsonb('features').notNull().default('[]'),
  // Example: ["api-access", "advanced-analytics", "audit-logs"]

  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### 6.6 Organization Suspension Fields

```typescript
// packages/db/src/schema/organizations.ts - Add to existing table
// Add columns:
suspendedAt: timestamp('suspended_at', { withTimezone: true }),
suspendedReason: text('suspended_reason'),
suspendedBy: text('suspended_by').references(() => users.id),
```

### 6.7 User Suspension Fields

```typescript
// packages/db/src/schema/users.ts - Add to existing table
// Add columns:
suspendedAt: timestamp('suspended_at', { withTimezone: true }),
suspendedReason: text('suspended_reason'),
suspendedBy: text('suspended_by'),
lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
```

---

## 7. API Endpoints

### 7.1 Super-Admin Endpoints

All super-admin endpoints are prefixed with `/admin` and require the `@RequireSuperAdmin()` guard.

#### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/users` | List all users with pagination/search |
| `GET` | `/admin/users/:id` | Get user details with memberships |
| `PATCH` | `/admin/users/:id/suspend` | Suspend user account |
| `PATCH` | `/admin/users/:id/unsuspend` | Unsuspend user account |
| `POST` | `/admin/users/:id/force-password-reset` | Force password reset |
| `DELETE` | `/admin/users/:id` | Delete user account |
| `GET` | `/admin/users/:id/sessions` | Get user's active sessions |
| `DELETE` | `/admin/users/:id/sessions` | Revoke all user sessions |

#### Organization Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/organizations` | List all organizations |
| `GET` | `/admin/organizations/:id` | Get org details (members, billing, usage) |
| `PATCH` | `/admin/organizations/:id/suspend` | Suspend organization |
| `PATCH` | `/admin/organizations/:id/unsuspend` | Unsuspend organization |
| `PATCH` | `/admin/organizations/:id/transfer-ownership` | Transfer ownership |
| `DELETE` | `/admin/organizations/:id` | Delete organization |
| `GET` | `/admin/organizations/:id/usage` | Get org usage summary |
| `PATCH` | `/admin/organizations/:id/limits` | Override org usage limits |

#### Feature Flags

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/feature-flags` | List all feature flags |
| `POST` | `/admin/feature-flags` | Create new feature flag |
| `PATCH` | `/admin/feature-flags/:id` | Update feature flag |
| `DELETE` | `/admin/feature-flags/:id` | Delete feature flag |
| `POST` | `/admin/feature-flags/:id/overrides` | Add org override |
| `DELETE` | `/admin/feature-flags/:id/overrides/:orgId` | Remove org override |

#### Platform Metrics

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/metrics/overview` | Platform-wide metrics summary |
| `GET` | `/admin/metrics/api-usage` | API request metrics |
| `GET` | `/admin/metrics/errors` | Error rate metrics |
| `GET` | `/admin/metrics/queues` | BullMQ queue metrics |
| `GET` | `/admin/health` | System health check (detailed) |

#### Platform Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/audit-logs` | Search all audit logs (platform + org) |
| `GET` | `/admin/audit-logs/export` | Export audit logs |

### 7.2 Usage Tracking Endpoints

#### Organization Usage (for org owners)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/billing/usage` | Get current period usage summary |
| `GET` | `/billing/usage/history` | Get historical usage data |
| `GET` | `/billing/usage/api-calls` | Detailed API call breakdown |
| `GET` | `/billing/usage/storage` | Storage usage details |
| `GET` | `/billing/usage/seats` | Active seats details |
| `GET` | `/billing/limits` | Get current usage limits |

#### Billing Portal

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/billing/subscription` | Get current subscription (existing) |
| `POST` | `/billing/checkout` | Create checkout session (existing) |
| `POST` | `/billing/portal` | Create billing portal session (existing) |
| `GET` | `/billing/invoices` | List organization invoices |
| `GET` | `/billing/invoices/:id` | Get invoice details |
| `GET` | `/billing/projected-invoice` | Get projected invoice for current period |

---

## 8. API Request/Response Examples

### 8.1 Super-Admin: List Users

**Request:**
```http
GET /api/v1/admin/users?page=1&limit=20&search=john
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "users": [
    {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "emailVerified": true,
      "isSuperAdmin": false,
      "suspendedAt": null,
      "lastLoginAt": "2024-01-15T10:30:00Z",
      "createdAt": "2024-01-01T00:00:00Z",
      "organizationCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### 8.2 Super-Admin: Get Organization Details

**Request:**
```http
GET /api/v1/admin/organizations/{orgId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "id": "org-uuid",
  "name": "Acme Corp",
  "ownerUserId": "user-uuid",
  "owner": {
    "id": "user-uuid",
    "name": "Jane Smith",
    "email": "jane@acme.com"
  },
  "memberCount": 15,
  "subscription": {
    "plan": "pro",
    "status": "active",
    "currentPeriodEnd": "2024-02-01T00:00:00Z"
  },
  "usage": {
    "apiCalls": 45000,
    "apiCallsLimit": 100000,
    "storageBytes": 536870912,
    "storageBytesLimit": 10737418240,
    "activeSeats": 12,
    "seatsLimit": 20
  },
  "suspendedAt": null,
  "createdAt": "2023-06-15T00:00:00Z"
}
```

### 8.3 Get Usage Summary

**Request:**
```http
GET /api/v1/billing/usage
Authorization: Bearer {token}
X-Org-Id: {org-id}
```

**Response (200):**
```json
{
  "billingPeriod": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-02-01T00:00:00Z"
  },
  "plan": "pro",
  "usage": {
    "apiCalls": {
      "used": 45000,
      "limit": 100000,
      "percentUsed": 45,
      "overage": 0
    },
    "storage": {
      "usedBytes": 536870912,
      "limitBytes": 10737418240,
      "percentUsed": 5,
      "usedFormatted": "512 MB",
      "limitFormatted": "10 GB"
    },
    "seats": {
      "active": 12,
      "limit": 20,
      "percentUsed": 60
    }
  },
  "projectedCost": {
    "basePlan": 4900,
    "apiOverage": 0,
    "storageOverage": 0,
    "seatOverage": 0,
    "total": 4900,
    "currency": "usd"
  }
}
```

---

## 9. Super-Admin Guard Implementation

### 9.1 SuperAdmin Decorator and Guard

```typescript
// apps/api/src/core/decorators/require-super-admin.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SUPER_ADMIN_KEY = 'require_super_admin';
export const RequireSuperAdmin = () => SetMetadata(REQUIRE_SUPER_ADMIN_KEY, true);
```

```typescript
// apps/api/src/core/guards/super-admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_SUPER_ADMIN_KEY } from '../decorators/require-super-admin.decorator';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requireSuperAdmin = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SUPER_ADMIN_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requireSuperAdmin) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.isSuperAdmin) {
      throw new ForbiddenException('Super-admin access required');
    }

    return true;
  }
}
```

### 9.2 Admin Module Structure

```
apps/api/src/admin/
├── admin.module.ts
├── admin-users/
│   ├── admin-users.controller.ts
│   ├── admin-users.service.ts
│   └── dto/
├── admin-organizations/
│   ├── admin-organizations.controller.ts
│   ├── admin-organizations.service.ts
│   └── dto/
├── admin-feature-flags/
│   ├── admin-feature-flags.controller.ts
│   └── admin-feature-flags.service.ts
├── admin-metrics/
│   ├── admin-metrics.controller.ts
│   └── admin-metrics.service.ts
├── admin-audit-logs/
│   ├── admin-audit-logs.controller.ts
│   └── admin-audit-logs.service.ts
└── platform-audit/
    ├── platform-audit.service.ts
    └── platform-audit.repository.ts
```

---

## 10. Usage Tracking Implementation

### 10.1 Usage Tracking Interceptor

```typescript
// apps/api/src/usage/usage-tracking.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { UsageTrackingService } from './usage-tracking.service';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  constructor(private usageTrackingService: UsageTrackingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          // Fire-and-forget: don't block response
          this.trackRequest(request, Date.now() - startTime).catch(() => {
            // Silently ignore tracking errors
          });
        },
      }),
    );
  }

  private async trackRequest(request: any, durationMs: number): Promise<void> {
    const orgId = request.tenantContext?.orgId;
    if (!orgId) return; // Skip non-org requests

    await this.usageTrackingService.trackApiCall(orgId, {
      endpoint: request.route?.path || request.url,
      method: request.method,
      durationMs,
      timestamp: new Date(),
    });
  }
}
```

### 10.2 Usage Tracking Service

```typescript
// apps/api/src/usage/usage-tracking.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class UsageTrackingService {
  private readonly logger = new Logger(UsageTrackingService.name);

  constructor(@InjectRedis() private redis: Redis) {}

  /**
   * Increment API call counter for org (stored in Redis)
   * Uses hourly buckets for aggregation
   */
  async trackApiCall(orgId: string, data: ApiCallData): Promise<void> {
    const hourBucket = this.getHourBucket();
    const key = `usage:api_calls:${orgId}:${hourBucket}`;

    try {
      await this.redis
        .multi()
        .incr(key)
        .expire(key, 86400 * 7) // Expire after 7 days
        .exec();
    } catch (error) {
      this.logger.warn(`Failed to track API call: ${error.message}`);
    }
  }

  /**
   * Track storage change (increment/decrement)
   */
  async trackStorageChange(orgId: string, deltaBytes: number): Promise<void> {
    const key = `usage:storage:${orgId}`;

    try {
      await this.redis.incrby(key, deltaBytes);
    } catch (error) {
      this.logger.warn(`Failed to track storage: ${error.message}`);
    }
  }

  /**
   * Get current storage usage for org
   */
  async getStorageUsage(orgId: string): Promise<number> {
    const value = await this.redis.get(`usage:storage:${orgId}`);
    return parseInt(value || '0', 10);
  }

  private getHourBucket(): string {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`;
  }
}
```

### 10.3 Usage Aggregation Job (Worker)

```typescript
// apps/worker/src/handlers/usage-aggregation.handler.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('usage-aggregation')
export class UsageAggregationHandler extends WorkerHost {
  /**
   * Runs hourly to flush Redis counters to PostgreSQL
   */
  async process(job: Job): Promise<void> {
    const previousHour = this.getPreviousHourBucket();

    // Get all org keys for the previous hour
    const keys = await this.redis.keys(`usage:api_calls:*:${previousHour}`);

    for (const key of keys) {
      const [, , orgId] = key.split(':');
      const count = await this.redis.get(key);

      if (count && parseInt(count) > 0) {
        // Upsert usage record in DB
        await this.usageRepository.upsertUsageRecord({
          orgId,
          periodStart: this.parseHourBucket(previousHour),
          periodEnd: this.addHours(this.parseHourBucket(previousHour), 1),
          metricType: 'api_calls',
          quantity: parseInt(count),
        });

        // Delete Redis key after persisting
        await this.redis.del(key);
      }
    }
  }
}
```

---

## 11. Stripe Usage Reporting

### 11.1 Daily Usage Report Job

```typescript
// apps/worker/src/handlers/stripe-usage-report.handler.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import Stripe from 'stripe';

@Processor('stripe-usage-report')
export class StripeUsageReportHandler extends WorkerHost {
  /**
   * Runs daily to report usage to Stripe for metered billing
   */
  async process(job: Job): Promise<void> {
    const yesterday = this.getYesterdayDateRange();

    // Get all orgs with active metered subscriptions
    const subscriptions = await this.billingRepository.findActiveMeteredSubscriptions();

    for (const subscription of subscriptions) {
      const usage = await this.usageRepository.getUsageForPeriod(
        subscription.orgId,
        yesterday.start,
        yesterday.end
      );

      // Report to Stripe using Usage Records API
      await this.stripe.subscriptionItems.createUsageRecord(
        subscription.stripeSubscriptionItemId,
        {
          quantity: usage.apiCalls,
          timestamp: Math.floor(yesterday.end.getTime() / 1000),
          action: 'increment',
        }
      );

      // Mark as reported in DB
      await this.usageRepository.markAsReported(
        subscription.orgId,
        yesterday.start,
        yesterday.end
      );
    }
  }
}
```

---

## 12. Frontend Pages & Components

### 12.1 Super-Admin Dashboard Structure

```
apps/web/src/app/(admin)/
├── layout.tsx                    # Admin layout with sidebar
├── page.tsx                      # Admin dashboard overview
├── users/
│   ├── page.tsx                  # User list with search/filter
│   └── [id]/
│       └── page.tsx              # User detail view
├── organizations/
│   ├── page.tsx                  # Organization list
│   └── [id]/
│       └── page.tsx              # Organization detail view
├── feature-flags/
│   ├── page.tsx                  # Feature flag list
│   └── [id]/
│       └── page.tsx              # Flag detail with overrides
├── audit-logs/
│   └── page.tsx                  # Platform audit log viewer
└── metrics/
    └── page.tsx                  # System health dashboard
```

### 12.2 Usage Dashboard Structure (Org-level)

```
apps/web/src/app/(dashboard)/[orgSlug]/settings/billing/
├── page.tsx                      # Billing overview (existing)
├── usage/
│   └── page.tsx                  # Usage dashboard
├── invoices/
│   ├── page.tsx                  # Invoice list
│   └── [id]/
│       └── page.tsx              # Invoice detail
└── limits/
    └── page.tsx                  # Usage limits view
```

### 12.3 Key Components

#### Admin Components

```
apps/web/src/components/admin/
├── AdminSidebar.tsx              # Admin navigation sidebar
├── AdminHeader.tsx               # Admin header with user menu
├── UserTable.tsx                 # Paginated user table
├── UserDetailCard.tsx            # User info card
├── OrgTable.tsx                  # Paginated org table
├── OrgDetailCard.tsx             # Org info with usage
├── FeatureFlagTable.tsx          # Flag list with toggles
├── FeatureFlagForm.tsx           # Create/edit flag form
├── OverrideList.tsx              # Org override list
├── AuditLogTable.tsx             # Audit log table
├── AuditLogFilters.tsx           # Filter controls
├── MetricsCard.tsx               # Metric display card
├── MetricsChart.tsx              # Time-series chart
├── SystemHealthIndicator.tsx     # Health status indicator
└── SuspendDialog.tsx             # Suspend confirmation dialog
```

#### Usage Components

```
apps/web/src/components/billing/
├── UsageSummaryCard.tsx          # Current period summary
├── UsageProgressBar.tsx          # Usage vs limit bar
├── UsageChart.tsx                # Daily usage chart
├── ApiUsageBreakdown.tsx         # API calls by endpoint
├── StorageUsageCard.tsx          # Storage usage display
├── SeatsUsageCard.tsx            # Active seats display
├── ProjectedInvoice.tsx          # Projected cost card
├── InvoiceTable.tsx              # Invoice history table
├── InvoiceDetail.tsx             # Invoice line items
└── UsageLimitAlert.tsx           # Limit warning banner
```

### 12.4 Admin Dashboard Page Example

```tsx
// apps/web/src/app/(admin)/page.tsx
import { AdminMetricsOverview } from '@/components/admin/AdminMetricsOverview';
import { RecentActivityFeed } from '@/components/admin/RecentActivityFeed';
import { SystemHealthPanel } from '@/components/admin/SystemHealthPanel';

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Platform Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricsCard title="Total Users" metric="users" />
        <MetricsCard title="Total Organizations" metric="organizations" />
        <MetricsCard title="Active Subscriptions" metric="subscriptions" />
        <MetricsCard title="MRR" metric="mrr" format="currency" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SystemHealthPanel />
        <RecentActivityFeed />
      </div>

      <AdminMetricsOverview />
    </div>
  );
}
```

### 12.5 Usage Dashboard Page Example

```tsx
// apps/web/src/app/(dashboard)/[orgSlug]/settings/billing/usage/page.tsx
import { UsageSummaryCard } from '@/components/billing/UsageSummaryCard';
import { UsageChart } from '@/components/billing/UsageChart';
import { ProjectedInvoice } from '@/components/billing/ProjectedInvoice';

export default async function UsageDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Usage & Billing</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <UsageSummaryCard metric="apiCalls" />
        <UsageSummaryCard metric="storage" />
        <UsageSummaryCard metric="seats" />
      </div>

      <UsageChart />

      <ProjectedInvoice />
    </div>
  );
}
```

---

## 13. Stripe Webhook Handling

### 13.1 Extended Webhook Events

Add handling for these additional Stripe events:

| Event | Handler Action |
|-------|----------------|
| `invoice.created` | Create local invoice record |
| `invoice.finalized` | Update invoice status |
| `invoice.paid` | Mark invoice as paid, update subscription |
| `invoice.payment_failed` | Mark as failed, trigger notification |
| `invoice.upcoming` | Send upcoming invoice notification |
| `customer.subscription.updated` | Sync subscription changes |
| `customer.subscription.deleted` | Handle cancellation |
| `usage_record.summary.created` | Log usage summary for audit |

### 13.2 Webhook Handler Extension

```typescript
// apps/api/src/billing/stripe-webhook.handler.ts
@Post('webhook')
async handleWebhook(@Req() req: RawBodyRequest<Request>) {
  const event = this.stripe.webhooks.constructEvent(
    req.rawBody,
    req.headers['stripe-signature'],
    this.configService.get('STRIPE_WEBHOOK_SECRET')
  );

  switch (event.type) {
    case 'invoice.created':
      await this.handleInvoiceCreated(event.data.object);
      break;
    case 'invoice.paid':
      await this.handleInvoicePaid(event.data.object);
      break;
    case 'invoice.payment_failed':
      await this.handleInvoicePaymentFailed(event.data.object);
      break;
    // ... existing handlers
  }
}
```

---

## 14. Security Considerations

### 14.1 Super-Admin Access Control

| Concern | Mitigation |
|---------|------------|
| Super-admin privilege escalation | `isSuperAdmin` can only be set via database migration or seed script, never via API |
| Super-admin impersonation | All super-admin actions logged to `platform_audit_logs` with IP and user agent |
| Org data access | Super-admin endpoints bypass RLS but still require explicit org context for mutations |
| Session hijacking | Super-admin sessions have shorter TTL (4 hours vs 24 hours) |
| Audit trail | All super-admin actions are immutable and cannot be deleted |

### 14.2 Super-Admin vs Org Admin Distinction

| Capability | Org Owner | Super-Admin |
|------------|-----------|-------------|
| Manage own org members | ✅ | ✅ |
| View own org billing | ✅ | ✅ |
| Manage own org settings | ✅ | ✅ |
| View other orgs | ❌ | ✅ |
| Suspend users/orgs | ❌ | ✅ |
| Manage feature flags | ❌ | ✅ |
| View platform metrics | ❌ | ✅ |
| View all audit logs | ❌ | ✅ |
| Override usage limits | ❌ | ✅ |

### 14.3 Usage Tracking Security

| Concern | Mitigation |
|---------|------------|
| Usage data tampering | Usage records are append-only; updates only allowed for `reportedToStripe` flag |
| Billing disputes | Full audit trail of usage with timestamps |
| Rate limiting bypass | Usage tracking is separate from rate limiting |
| Data privacy | Usage data aggregated, no PII in usage records |

### 14.4 Billing Security

| Concern | Mitigation |
|---------|------------|
| Unauthorized billing access | Only org owners can access billing endpoints |
| Stripe webhook spoofing | Webhook signature verification required |
| Invoice tampering | Invoices are read-only from Stripe |
| Payment data exposure | No card data stored locally; Stripe handles PCI compliance |

---

## 15. Graceful Degradation

### 15.1 Billing Service Unavailable

When Stripe or billing services are unavailable:

```typescript
// apps/api/src/billing/billing.service.ts
async getUsageSummary(orgId: string): Promise<UsageSummary> {
  try {
    // Try to get real-time data from Stripe
    return await this.stripeService.getUsageSummary(orgId);
  } catch (error) {
    this.logger.warn(`Stripe unavailable, using cached data: ${error.message}`);

    // Fall back to cached/local data
    return await this.usageRepository.getCachedUsageSummary(orgId);
  }
}
```

### 15.2 Usage Tracking Failures

```typescript
// Usage tracking is fire-and-forget
// If Redis is down, log warning but don't fail the request
async trackApiCall(orgId: string, data: ApiCallData): Promise<void> {
  try {
    await this.redis.incr(key);
  } catch (error) {
    this.logger.warn(`Usage tracking failed: ${error.message}`);
    // Request continues normally
  }
}
```

### 15.3 Degradation Modes

| Service Down | Behavior |
|--------------|----------|
| Redis | Usage tracking skipped; API continues normally |
| Stripe API | Use cached subscription/usage data; show warning |
| PostgreSQL | Full outage; return 503 |
| BullMQ | Jobs queued in Redis; processed when worker recovers |

---

## 16. Environment Variables

### 16.1 New Variables Required

```bash
# Super-Admin
SUPER_ADMIN_SESSION_TTL_HOURS=4

# Usage Tracking
USAGE_AGGREGATION_CRON="0 * * * *"  # Hourly
USAGE_STRIPE_REPORT_CRON="0 2 * * *"  # Daily at 2 AM UTC

# Stripe Metered Billing
STRIPE_METERED_PRICE_ID_API_CALLS=price_xxx
STRIPE_METERED_PRICE_ID_STORAGE=price_xxx
STRIPE_METERED_PRICE_ID_SEATS=price_xxx

# Metrics
METRICS_RETENTION_DAYS=90
```

---

## 17. Implementation Tasks

### Part A: Super-Admin Dashboard

#### Backend Tasks

- [ ] **A-BE-1**: Add `isSuperAdmin` column to users table with migration
- [ ] **A-BE-2**: Add suspension fields to users and organizations tables
- [ ] **A-BE-3**: Create `platform_audit_logs` table with migration
- [ ] **A-BE-4**: Implement `@RequireSuperAdmin()` decorator and guard
- [ ] **A-BE-5**: Create `AdminModule` with sub-modules
- [ ] **A-BE-6**: Implement `AdminUsersController` and service
- [ ] **A-BE-7**: Implement `AdminOrganizationsController` and service
- [ ] **A-BE-8**: Implement `AdminFeatureFlagsController` and service
- [ ] **A-BE-9**: Implement `AdminMetricsController` and service
- [ ] **A-BE-10**: Implement `AdminAuditLogsController` and service
- [ ] **A-BE-11**: Create `PlatformAuditService` for logging super-admin actions
- [ ] **A-BE-12**: Add super-admin seed script for development

#### Frontend Tasks

- [ ] **A-FE-1**: Create admin layout with sidebar navigation
- [ ] **A-FE-2**: Implement admin dashboard overview page
- [ ] **A-FE-3**: Implement user management pages (list, detail)
- [ ] **A-FE-4**: Implement organization management pages (list, detail)
- [ ] **A-FE-5**: Implement feature flag management pages
- [ ] **A-FE-6**: Implement platform audit log viewer
- [ ] **A-FE-7**: Implement system health/metrics dashboard
- [ ] **A-FE-8**: Create admin-specific React Query hooks
- [ ] **A-FE-9**: Add suspend/unsuspend confirmation dialogs
- [ ] **A-FE-10**: Implement audit log export functionality

### Part B: Usage Billing

#### Backend Tasks

- [ ] **B-BE-1**: Create `usage_records` table with migration
- [ ] **B-BE-2**: Create `usage_limits` table with migration
- [ ] **B-BE-3**: Create `plans` table with migration and seed data
- [ ] **B-BE-4**: Implement `UsageTrackingInterceptor`
- [ ] **B-BE-5**: Implement `UsageTrackingService` with Redis counters
- [ ] **B-BE-6**: Implement `UsageRepository` for DB operations
- [ ] **B-BE-7**: Create usage aggregation worker job (hourly)
- [ ] **B-BE-8**: Create Stripe usage reporting worker job (daily)
- [ ] **B-BE-9**: Implement usage billing endpoints
- [ ] **B-BE-10**: Extend Stripe webhook handler for invoice events
- [ ] **B-BE-11**: Implement usage limit enforcement middleware
- [ ] **B-BE-12**: Add usage limit warning notifications

#### Frontend Tasks

- [ ] **B-FE-1**: Create usage dashboard page
- [ ] **B-FE-2**: Implement usage summary cards
- [ ] **B-FE-3**: Implement usage charts (daily breakdown)
- [ ] **B-FE-4**: Implement projected invoice component
- [ ] **B-FE-5**: Create invoice list and detail pages
- [ ] **B-FE-6**: Implement usage limit alerts/warnings
- [ ] **B-FE-7**: Add usage data to billing overview page
- [ ] **B-FE-8**: Create usage-specific React Query hooks

#### Worker Tasks

- [ ] **B-WK-1**: Implement `UsageAggregationHandler` (hourly)
- [ ] **B-WK-2**: Implement `StripeUsageReportHandler` (daily)
- [ ] **B-WK-3**: Implement `ActiveSeatsCalculationHandler` (daily)
- [ ] **B-WK-4**: Implement `UsageLimitNotificationHandler`
- [ ] **B-WK-5**: Add job scheduling via BullMQ repeatable jobs

---

## 18. Test Plan

### 18.1 Unit Tests

#### Super-Admin Tests

| Test | Description |
|------|-------------|
| `SuperAdminGuard` | Verify guard blocks non-super-admin users |
| `SuperAdminGuard` | Verify guard allows super-admin users |
| `AdminUsersService.listUsers` | Verify pagination and search |
| `AdminUsersService.suspendUser` | Verify suspension logic |
| `AdminOrgsService.listOrganizations` | Verify org listing |
| `AdminOrgsService.transferOwnership` | Verify ownership transfer |
| `PlatformAuditService.log` | Verify audit log creation |

#### Usage Tracking Tests

| Test | Description |
|------|-------------|
| `UsageTrackingService.trackApiCall` | Verify Redis increment |
| `UsageTrackingService.trackStorageChange` | Verify storage delta |
| `UsageRepository.upsertUsageRecord` | Verify upsert logic |
| `UsageRepository.getUsageForPeriod` | Verify aggregation |
| `UsageLimitService.checkLimit` | Verify limit enforcement |

### 18.2 Integration Tests

| Test | Description |
|------|-------------|
| `GET /admin/users` | Verify super-admin can list users |
| `GET /admin/users` | Verify non-super-admin gets 403 |
| `PATCH /admin/users/:id/suspend` | Verify user suspension |
| `GET /admin/organizations/:id` | Verify org details with usage |
| `GET /billing/usage` | Verify usage summary response |
| `POST /billing/webhook` | Verify invoice webhook handling |
| Usage aggregation job | Verify Redis to DB flush |
| Stripe usage report job | Verify Stripe API call |

### 18.3 E2E Tests

| Test | Description |
|------|-------------|
| Super-admin login flow | Login and access admin dashboard |
| User suspension flow | Suspend user, verify cannot login |
| Org suspension flow | Suspend org, verify members blocked |
| Feature flag toggle | Toggle flag, verify org access changes |
| Usage dashboard | View usage, verify data displayed |
| Invoice history | View invoices, verify list and detail |
| Billing portal | Access Stripe portal, return to app |

### 18.4 Performance Tests

| Test | Target |
|------|--------|
| Usage tracking overhead | < 5ms per request |
| Usage aggregation job | < 60s for 10k orgs |
| Admin user list (10k users) | < 500ms |
| Admin org list (5k orgs) | < 500ms |
| Audit log search (1M records) | < 2s |

---

## 19. Observability

### 19.1 Metrics to Track

| Metric | Type | Description |
|--------|------|-------------|
| `admin.requests.total` | Counter | Total admin API requests |
| `admin.requests.by_endpoint` | Counter | Requests by endpoint |
| `usage.tracking.success` | Counter | Successful usage tracks |
| `usage.tracking.failures` | Counter | Failed usage tracks |
| `usage.aggregation.duration` | Histogram | Aggregation job duration |
| `stripe.usage_report.success` | Counter | Successful Stripe reports |
| `stripe.usage_report.failures` | Counter | Failed Stripe reports |
| `billing.invoices.created` | Counter | Invoices created |
| `billing.invoices.paid` | Counter | Invoices paid |

### 19.2 Alerts

| Alert | Condition | Severity |
|-------|-----------|----------|
| Usage tracking failure rate | > 5% failures in 5 min | Warning |
| Usage aggregation job failed | Job failed 3 consecutive times | Critical |
| Stripe usage report failed | Report failed | Critical |
| Super-admin action | Any super-admin mutation | Info |
| Org suspended | Organization suspended | Info |
| User suspended | User suspended | Info |

---

## 20. Future Enhancements

| Enhancement | Description | Priority |
|-------------|-------------|----------|
| Usage forecasting | ML-based usage prediction | Low |
| Custom billing periods | Non-monthly billing cycles | Low |
| Usage alerts | Configurable usage thresholds | Medium |
| Admin 2FA | Require 2FA for super-admins | High |
| Audit log retention | Configurable retention policies | Medium |
| Usage export | Export usage data to CSV/JSON | Medium |
| Multi-currency | Support non-USD billing | Low |
| Usage quotas | Hard limits with blocking | Medium |

---

## 21. Dependencies

### 21.1 External Dependencies

| Dependency | Purpose | Version |
|------------|---------|---------|
| Stripe SDK | Billing integration | ^14.x |
| ioredis | Redis client for usage counters | ^5.x |
| @nestjs/bullmq | Job queue for aggregation | ^10.x |
| recharts | Usage charts | ^2.x |

### 21.2 Internal Dependencies

| Module | Dependency |
|--------|------------|
| Admin Module | Auth Module, Users Module, Organizations Module |
| Usage Module | Billing Module, Redis Module |
| Usage Worker | Usage Module, Stripe Module |

---

## 22. Rollout Plan

### Phase 3a: Super-Admin Dashboard (Week 1-2)

1. Database migrations for super-admin and suspension fields
2. Backend: Super-admin guard and admin module
3. Frontend: Admin layout and dashboard
4. Testing and QA

### Phase 3b: Usage Tracking (Week 3-4)

1. Database migrations for usage tables
2. Backend: Usage tracking interceptor and service
3. Worker: Aggregation jobs
4. Testing and QA

### Phase 3c: Usage Billing (Week 5-6)

1. Stripe metered billing setup
2. Backend: Usage reporting to Stripe
3. Frontend: Usage dashboard and invoices
4. End-to-end testing

### Phase 3d: Polish & Launch (Week 7)

1. Performance optimization
2. Documentation
3. Monitoring and alerts setup
4. Production deployment

---

## Appendix A: Plan Limits Reference

| Metric | Free | Pro | Enterprise |
|--------|------|-----|------------|
| API Calls/month | 10,000 | 100,000 | Unlimited |
| Storage | 1 GB | 10 GB | 100 GB |
| Seats | 3 | 20 | Unlimited |
| Audit Log Retention | 7 days | 90 days | 1 year |
| Support | Community | Email | Dedicated |

---

## Appendix B: Stripe Product Structure

```
Products:
├── ForgeStack Free
│   └── Price: $0/month (free tier)
├── ForgeStack Pro
│   ├── Price: $49/month (base)
│   ├── Metered: API Calls ($0.001/call over 100k)
│   ├── Metered: Storage ($0.10/GB over 10GB)
│   └── Metered: Seats ($10/seat over 20)
└── ForgeStack Enterprise
    └── Price: Custom (contact sales)
```

