# Feature Flags

**Epic:** Feature Flags
**Priority:** High
**Depends on:** Organizations, better-auth Integration, Billing/Plans
**Status:** Draft

---

## 1. Context

### Why Feature Flags Are Needed

Feature flags are critical for:

- **Gradual Rollouts** – Deploy new features to a small percentage of users before full release
- **Plan-Based Gating** – Restrict features based on subscription tier (free vs pro vs enterprise)
- **A/B Testing** – Test different feature variants with different user segments
- **Beta Testing** – Enable experimental features for specific organizations
- **Kill Switches** – Quickly disable problematic features without code deployment

### Business Value

| Benefit | Description |
|---------|-------------|
| Reduced Deployment Risk | Roll out features gradually, catch issues early |
| Enable Experimentation | A/B test features to measure impact |
| Monetization Control | Gate premium features behind subscription plans |
| Customer Enablement | Enable beta features for specific customers |
| Operational Control | Disable features instantly without deployment |

### Technical Approach

- **Database-backed** – Flag definitions stored in PostgreSQL with RLS
- **Cached evaluation** – Flag results cached in memory and optionally Redis
- **Server-side evaluation** – Flags evaluated on the server, not exposed to clients
- **Override precedence** – Organization overrides take precedence over default rules
- **Consistent hashing** – Percentage rollouts use deterministic hashing for consistent experiences

---

## 2. User Stories

### US-1: View Enabled Features

**As an** org owner
**I want to** see which features are enabled for my organization
**So that** I understand what capabilities are available to my team

### US-2: Manage Feature Flags (Admin)

**As a** system admin
**I want to** create and manage feature flags
**So that** I can control feature availability across the platform

### US-3: Plan-Based Feature Gating

**As the** system
**I want to** automatically gate features based on subscription plan
**So that** premium features are only available to paying customers

### US-4: Check Feature via API

**As a** developer
**I want to** check if a feature is enabled via API
**So that** I can conditionally show/hide features in my application

### US-5: Beta Feature Access

**As a** system admin
**I want to** enable a feature for specific organizations
**So that** I can run beta tests with select customers

---

## 3. Acceptance Criteria

### US-1: View Enabled Features

- [ ] Features page accessible from organization settings
- [ ] List shows all features with enabled/disabled status
- [ ] Feature descriptions explain what each feature does
- [ ] Plan-gated features show which plan is required
- [ ] Page loads within 500ms (cached)

### US-2: Manage Feature Flags (Admin)

- [ ] Admin-only feature flags management page
- [ ] Create new feature flag with key, name, description, type
- [ ] Edit existing flag properties
- [ ] Delete unused flags (with confirmation)
- [ ] Enable/disable master switch for any flag
- [ ] Configure plan-based access for each flag
- [ ] Configure percentage rollout (0-100%)
- [ ] Add/remove organization overrides

### US-3: Plan-Based Feature Gating

- [ ] Flags can specify which plans have access
- [ ] Free plan users cannot access pro/enterprise features
- [ ] Plan changes immediately affect feature access
- [ ] Downgrade shows warning about feature loss

### US-4: Check Feature via API

- [ ] `GET /features` returns list of enabled features for current org
- [ ] `GET /features/:key` returns boolean for specific feature
- [ ] API respects tenant context and plan
- [ ] Response cached for performance
- [ ] Rate limited to prevent abuse

### US-5: Beta Feature Access

- [ ] Create organization-specific override for any flag
- [ ] Override can enable or disable feature
- [ ] Override includes reason/notes field
- [ ] Override takes precedence over all other rules
- [ ] Audit log captures override changes

---

## 4. Database Schema

### feature_flags Table (Global Flag Definitions)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default random | Unique identifier |
| `key` | `text` | UNIQUE, NOT NULL | Flag identifier (e.g., 'advanced-analytics') |
| `name` | `text` | NOT NULL | Display name |
| `description` | `text` | NULLABLE | What this feature does |
| `type` | `text` | NOT NULL | `'boolean'`, `'percentage'`, `'plan'` |
| `default_value` | `boolean` | NOT NULL, default false | Default enabled state |
| `plans` | `text[]` | NULLABLE | Plans with access: `['pro', 'enterprise']` |
| `percentage` | `integer` | NULLABLE, 0-100 | For percentage rollouts |
| `enabled` | `boolean` | NOT NULL, default true | Master switch |
| `created_at` | `timestamp with time zone` | NOT NULL, default now() | Creation time |
| `updated_at` | `timestamp with time zone` | NOT NULL, default now() | Last update time |

### organization_feature_overrides Table (Per-Org Overrides)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default random | Unique identifier |
| `org_id` | `uuid` | NOT NULL, FK → organizations | Organization reference |
| `flag_id` | `uuid` | NOT NULL, FK → feature_flags | Feature flag reference |
| `enabled` | `boolean` | NOT NULL | Override value |
| `reason` | `text` | NULLABLE | Why this override exists |
| `created_by` | `uuid` | NULLABLE, FK → users | Admin who created override |
| `created_at` | `timestamp with time zone` | NOT NULL, default now() | Creation time |
| `updated_at` | `timestamp with time zone` | NOT NULL, default now() | Last update time |

**Constraints:**
- UNIQUE(org_id, flag_id) – One override per org per flag
- Overrides take precedence over all other evaluation rules

### Schema Definition (Drizzle)

```typescript
// packages/db/src/schema/feature-flags.ts
import { pgTable, uuid, text, boolean, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const featureFlags = pgTable('feature_flags', {
  id: uuid('id').primaryKey().defaultRandom(),
  key: text('key').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  type: text('type').notNull(), // 'boolean' | 'percentage' | 'plan'
  defaultValue: boolean('default_value').notNull().default(false),
  plans: text('plans').array(), // ['free', 'pro', 'enterprise']
  percentage: integer('percentage'), // 0-100
  enabled: boolean('enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  keyIdx: index('feature_flags_key_idx').on(table.key),
  enabledIdx: index('feature_flags_enabled_idx').on(table.enabled),
}));

export const organizationFeatureOverrides = pgTable('organization_feature_overrides', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  flagId: uuid('flag_id').notNull().references(() => featureFlags.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull(),
  reason: text('reason'),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgFlagUnique: unique('org_flag_unique').on(table.orgId, table.flagId),
  orgIdIdx: index('org_feature_overrides_org_id_idx').on(table.orgId),
  flagIdIdx: index('org_feature_overrides_flag_id_idx').on(table.flagId),
}));
```

---

## 5. Flag Types

### Boolean Flags

Simple on/off for everyone. The `default_value` determines the state.

**Example:** `maintenance_mode`
- type: `boolean`
- default_value: `false`
- When enabled, shows maintenance banner to all users

### Plan-Based Flags

Enabled based on the organization's subscription plan.

**Example:** `advanced_analytics`
- type: `plan`
- plans: `['pro', 'enterprise']`
- Free users don't have access

### Percentage Rollout

Enabled for X% of organizations based on consistent hashing.

**Example:** `new_dashboard`
- type: `percentage`
- percentage: `25`
- 25% of orgs see the new dashboard (consistent across sessions)

### Beta/Override

Explicitly enabled/disabled for specific organizations via overrides.

**Example:** `experimental_ai_features`
- type: `boolean`
- default_value: `false`
- Overrides added for beta tester organizations

---

## 6. Evaluation Logic

```typescript
/**
 * Evaluate if a feature is enabled for an organization.
 *
 * @param orgId - Organization ID
 * @param flagKey - Feature flag key
 * @param plan - Organization's subscription plan
 * @returns boolean - Whether the feature is enabled
 */
function isFeatureEnabled(orgId: string, flagKey: string, plan: string): boolean {
  // 1. Get flag by key
  const flag = await getFlag(flagKey);
  if (!flag) return false;

  // 2. Check master switch
  if (!flag.enabled) return false;

  // 3. Check for org-specific override (highest precedence)
  const override = await getOverride(orgId, flag.id);
  if (override !== null) return override.enabled;

  // 4. Evaluate based on flag type
  switch (flag.type) {
    case 'boolean':
      return flag.defaultValue;

    case 'plan':
      return flag.plans?.includes(plan) ?? false;

    case 'percentage':
      // Consistent hash ensures same org always gets same result
      const hash = consistentHash(orgId);
      return hash < (flag.percentage ?? 0);

    default:
      return false;
  }
}

/**
 * Generate consistent hash for percentage rollouts.
 * Same orgId always produces same hash (0-99).
 */
function consistentHash(orgId: string): number {
  let hash = 0;
  for (let i = 0; i < orgId.length; i++) {
    hash = ((hash << 5) - hash) + orgId.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}
```

### Evaluation Order

1. **Master Switch** – If `flag.enabled` is `false`, feature is disabled for everyone
2. **Organization Override** – If override exists, use override value
3. **Type-Based Logic** – Evaluate based on flag type (boolean/plan/percentage)

---

## 7. API Endpoints

### Public Endpoints (For Clients)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/features` | List enabled features for current org | Authenticated |
| `GET` | `/features/:key` | Check if specific feature is enabled | Authenticated |

### Admin Endpoints (System Admin Only)

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `GET` | `/admin/feature-flags` | List all feature flags | System Admin |
| `POST` | `/admin/feature-flags` | Create new flag | System Admin |
| `GET` | `/admin/feature-flags/:id` | Get flag details | System Admin |
| `PATCH` | `/admin/feature-flags/:id` | Update flag | System Admin |
| `DELETE` | `/admin/feature-flags/:id` | Delete flag | System Admin |
| `GET` | `/admin/feature-flags/:id/overrides` | List overrides for flag | System Admin |
| `POST` | `/admin/feature-flags/:id/overrides` | Add org override | System Admin |
| `DELETE` | `/admin/feature-flags/:id/overrides/:orgId` | Remove override | System Admin |

### GET /features (Public)

List all features enabled for the current organization.

```http
GET /api/v1/features
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Response:**

```json
{
  "data": [
    {
      "key": "advanced_analytics",
      "name": "Advanced Analytics",
      "description": "Access to advanced analytics dashboards",
      "enabled": true
    },
    {
      "key": "custom_webhooks",
      "name": "Custom Webhooks",
      "description": "Create custom webhook endpoints",
      "enabled": false,
      "requiredPlan": "pro"
    }
  ]
}
```

### GET /features/:key (Public)

Check if a specific feature is enabled.

```http
GET /api/v1/features/advanced_analytics
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

**Response:**

```json
{
  "key": "advanced_analytics",
  "enabled": true
}
```

### POST /admin/feature-flags (Admin)

Create a new feature flag.

```http
POST /api/v1/admin/feature-flags
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "key": "new_feature",
  "name": "New Feature",
  "description": "Description of the new feature",
  "type": "plan",
  "plans": ["pro", "enterprise"],
  "enabled": true
}
```

### POST /admin/feature-flags/:id/overrides (Admin)

Add an organization override.

```http
POST /api/v1/admin/feature-flags/{flagId}/overrides
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "orgId": "org-uuid",
  "enabled": true,
  "reason": "Beta tester - enabled for early feedback"
}
```

---

## 8. Caching Strategy

### Cache Layers

1. **In-Memory Cache** – Flag definitions cached in application memory
2. **Redis Cache** (optional) – Distributed cache for multi-instance deployments

### Cache Keys

```
feature_flags:all              # All flag definitions (5 min TTL)
feature_flags:org:{orgId}      # Evaluated features for org (1 min TTL)
feature_flags:flag:{key}       # Single flag definition (5 min TTL)
```

### TTL Configuration

| Cache Key | TTL | Reason |
|-----------|-----|--------|
| Flag definitions | 5 minutes | Flags change infrequently |
| Org evaluations | 1 minute | Balance freshness vs performance |
| Overrides | 1 minute | Need quicker updates for beta |

### Cache Invalidation

```typescript
// Invalidate when flag is updated
async function invalidateFlagCache(flagKey: string): Promise<void> {
  await cache.del(`feature_flags:flag:${flagKey}`);
  await cache.del('feature_flags:all');
  // Note: Org caches expire naturally via TTL
}

// Invalidate when override is added/removed
async function invalidateOrgCache(orgId: string): Promise<void> {
  await cache.del(`feature_flags:org:${orgId}`);
}
```

---

## 9. Frontend Components

### Page Structure

```
apps/web/src/app/(dashboard)/
├── settings/
│   └── features/
│       └── page.tsx                  # Org features view (what's enabled)
└── admin/
    └── feature-flags/
        ├── page.tsx                  # Admin flag list
        ├── [id]/
        │   └── page.tsx              # Flag detail/edit
        └── components/
            ├── flag-list.tsx         # List of all flags
            ├── flag-form.tsx         # Create/edit flag form
            ├── flag-type-config.tsx  # Type-specific config (plan/percentage)
            ├── override-list.tsx     # List of org overrides
            └── override-form.tsx     # Add override dialog
```

### Admin Feature Flags Page

```tsx
// apps/web/src/app/(dashboard)/admin/feature-flags/page.tsx
'use client';

import { useState } from 'react';
import { useFeatureFlags, useCreateFlag, useDeleteFlag } from './hooks';
import { FlagList } from './components/flag-list';
import { FlagForm } from './components/flag-form';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Plus } from 'lucide-react';

export default function FeatureFlagsAdminPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const { data: flags, isLoading } = useFeatureFlags();
  const createFlag = useCreateFlag();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Feature Flags</h1>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Flag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <FlagForm
              onSubmit={async (data) => {
                await createFlag.mutateAsync(data);
                setCreateOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <FlagList flags={flags} isLoading={isLoading} />
    </div>
  );
}
```

### Organization Features Page

```tsx
// apps/web/src/app/(dashboard)/settings/features/page.tsx
'use client';

import { useOrgFeatures } from './hooks';
import { Badge } from '@/components/ui/badge';
import { Check, X, Lock } from 'lucide-react';

export default function OrgFeaturesPage() {
  const { data: features, isLoading } = useOrgFeatures();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Features</h1>
        <p className="text-muted-foreground">
          Features available for your organization
        </p>
      </div>

      <div className="grid gap-4">
        {features?.map((feature) => (
          <div
            key={feature.key}
            className="flex items-center justify-between p-4 border rounded-lg"
          >
            <div>
              <h3 className="font-medium">{feature.name}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {feature.enabled ? (
                <Badge variant="success">
                  <Check className="mr-1 h-3 w-3" />
                  Enabled
                </Badge>
              ) : feature.requiredPlan ? (
                <Badge variant="secondary">
                  <Lock className="mr-1 h-3 w-3" />
                  {feature.requiredPlan} plan
                </Badge>
              ) : (
                <Badge variant="outline">
                  <X className="mr-1 h-3 w-3" />
                  Disabled
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 10. SDK / Helper Service

### FeatureFlagsService

```typescript
// apps/api/src/feature-flags/feature-flags.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db, featureFlags, organizationFeatureOverrides } from '@forgestack/db';
import { TenantContext } from '../common/tenant-context';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);

  constructor(private readonly cache: CacheService) {}

  /**
   * Check if a feature is enabled for the current organization.
   * This is the primary method used throughout the application.
   */
  async isEnabled(ctx: TenantContext, flagKey: string): Promise<boolean> {
    const cacheKey = `feature_flags:org:${ctx.orgId}:${flagKey}`;

    // Check cache first
    const cached = await this.cache.get<boolean>(cacheKey);
    if (cached !== null) return cached;

    // Evaluate flag
    const result = await this.evaluateFlag(ctx.orgId, flagKey, ctx.plan);

    // Cache result
    await this.cache.set(cacheKey, result, 60); // 1 min TTL

    return result;
  }

  /**
   * Get all enabled feature keys for an organization.
   */
  async getEnabledFeatures(ctx: TenantContext): Promise<string[]> {
    const allFlags = await this.getAllFlags();
    const enabled: string[] = [];

    for (const flag of allFlags) {
      if (await this.isEnabled(ctx, flag.key)) {
        enabled.push(flag.key);
      }
    }

    return enabled;
  }

  /**
   * Get all features with their enabled status for display.
   */
  async getFeaturesWithStatus(ctx: TenantContext): Promise<FeatureStatus[]> {
    const allFlags = await this.getAllFlags();
    const results: FeatureStatus[] = [];

    for (const flag of allFlags) {
      const enabled = await this.isEnabled(ctx, flag.key);
      results.push({
        key: flag.key,
        name: flag.name,
        description: flag.description,
        enabled,
        requiredPlan: !enabled && flag.type === 'plan'
          ? flag.plans?.[0]
          : undefined,
      });
    }

    return results;
  }

  private async evaluateFlag(
    orgId: string,
    flagKey: string,
    plan: string,
  ): Promise<boolean> {
    // Get flag definition
    const flag = await db.query.featureFlags.findFirst({
      where: eq(featureFlags.key, flagKey),
    });

    if (!flag) return false;
    if (!flag.enabled) return false;

    // Check for override
    const override = await db.query.organizationFeatureOverrides.findFirst({
      where: and(
        eq(organizationFeatureOverrides.orgId, orgId),
        eq(organizationFeatureOverrides.flagId, flag.id),
      ),
    });

    if (override) return override.enabled;

    // Evaluate by type
    switch (flag.type) {
      case 'boolean':
        return flag.defaultValue;
      case 'plan':
        return flag.plans?.includes(plan) ?? false;
      case 'percentage':
        return this.consistentHash(orgId) < (flag.percentage ?? 0);
      default:
        return false;
    }
  }

  private consistentHash(orgId: string): number {
    let hash = 0;
    for (let i = 0; i < orgId.length; i++) {
      hash = ((hash << 5) - hash) + orgId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }

  private async getAllFlags() {
    // Implementation with caching
    const cacheKey = 'feature_flags:all';
    const cached = await this.cache.get<typeof featureFlags.$inferSelect[]>(cacheKey);
    if (cached) return cached;

    const flags = await db.query.featureFlags.findMany({
      where: eq(featureFlags.enabled, true),
    });

    await this.cache.set(cacheKey, flags, 300); // 5 min TTL
    return flags;
  }
}

interface FeatureStatus {
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  requiredPlan?: string;
}
```

### Usage in Other Services

```typescript
// Example: Using feature flags in ProjectsService
@Injectable()
export class ProjectsService {
  constructor(
    private readonly featureFlags: FeatureFlagsService,
  ) {}

  async createProject(ctx: TenantContext, dto: CreateProjectDto) {
    // Check if advanced project features are enabled
    if (dto.useAdvancedSettings) {
      const hasFeature = await this.featureFlags.isEnabled(ctx, 'advanced_project_settings');
      if (!hasFeature) {
        throw new ForbiddenException('Advanced project settings require Pro plan');
      }
    }

    // ... create project
  }
}
```

---

## 11. Predefined Flags (Initial)

The following flags should be created during initial setup:

| Key | Name | Type | Plans | Default | Description |
|-----|------|------|-------|---------|-------------|
| `advanced_analytics` | Advanced Analytics | plan | pro, enterprise | false | Access to advanced analytics dashboards |
| `custom_webhooks` | Custom Webhooks | plan | pro, enterprise | false | Create custom outgoing webhook endpoints |
| `api_access` | API Access | plan | pro, enterprise | false | Access to REST API with API keys |
| `file_uploads` | File Uploads | plan | free, pro, enterprise | true | Upload files (limits vary by plan) |
| `audit_logs` | Audit Logs | plan | enterprise | false | Access to audit log history |
| `sso` | Single Sign-On | plan | enterprise | false | SAML/OIDC single sign-on |
| `beta_features` | Beta Features | boolean | - | false | Access to experimental features (manual override) |
| `custom_branding` | Custom Branding | plan | enterprise | false | Custom logo and branding |
| `advanced_permissions` | Advanced Permissions | plan | pro, enterprise | false | Granular role-based permissions |
| `priority_support` | Priority Support | plan | enterprise | false | Access to priority support channel |

### Seed Migration

```typescript
// packages/db/src/migrations/XXXX_seed_feature_flags.ts
import { db, featureFlags } from '../index';

const defaultFlags = [
  {
    key: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Access to advanced analytics dashboards and reports',
    type: 'plan',
    plans: ['pro', 'enterprise'],
    defaultValue: false,
    enabled: true,
  },
  {
    key: 'custom_webhooks',
    name: 'Custom Webhooks',
    description: 'Create custom outgoing webhook endpoints',
    type: 'plan',
    plans: ['pro', 'enterprise'],
    defaultValue: false,
    enabled: true,
  },
  {
    key: 'api_access',
    name: 'API Access',
    description: 'Access to REST API with API keys',
    type: 'plan',
    plans: ['pro', 'enterprise'],
    defaultValue: false,
    enabled: true,
  },
  {
    key: 'file_uploads',
    name: 'File Uploads',
    description: 'Upload and manage files',
    type: 'plan',
    plans: ['free', 'pro', 'enterprise'],
    defaultValue: true,
    enabled: true,
  },
  {
    key: 'audit_logs',
    name: 'Audit Logs',
    description: 'Access to audit log history and exports',
    type: 'plan',
    plans: ['enterprise'],
    defaultValue: false,
    enabled: true,
  },
  {
    key: 'sso',
    name: 'Single Sign-On',
    description: 'SAML/OIDC single sign-on integration',
    type: 'plan',
    plans: ['enterprise'],
    defaultValue: false,
    enabled: true,
  },
  {
    key: 'beta_features',
    name: 'Beta Features',
    description: 'Access to experimental features (manual enablement)',
    type: 'boolean',
    plans: null,
    defaultValue: false,
    enabled: true,
  },
];

export async function seed() {
  for (const flag of defaultFlags) {
    await db.insert(featureFlags)
      .values(flag)
      .onConflictDoNothing({ target: featureFlags.key });
  }
}
```

---

## 12. Tasks

### Backend (apps/api)

#### 12.1 Create Feature Flags Module
- [ ] Create `apps/api/src/feature-flags/feature-flags.module.ts`
- [ ] Register service, controller
- [ ] Export `FeatureFlagsService` for use in other modules

#### 12.2 Create Feature Flags Service
- [ ] Create `apps/api/src/feature-flags/feature-flags.service.ts`
- [ ] Implement `isEnabled(ctx, flagKey)` method
- [ ] Implement `getEnabledFeatures(ctx)` method
- [ ] Implement `getFeaturesWithStatus(ctx)` method
- [ ] Implement flag evaluation logic (boolean/plan/percentage)
- [ ] Implement consistent hashing for percentage rollouts
- [ ] Add caching layer

#### 12.3 Create Admin Service
- [ ] Create `apps/api/src/feature-flags/feature-flags-admin.service.ts`
- [ ] Implement CRUD for feature flags
- [ ] Implement override management
- [ ] Add cache invalidation on changes

#### 12.4 Create Public Controller
- [ ] Create `apps/api/src/feature-flags/features.controller.ts`
- [ ] Implement `GET /features` endpoint
- [ ] Implement `GET /features/:key` endpoint
- [ ] Apply authentication guard

#### 12.5 Create Admin Controller
- [ ] Create `apps/api/src/feature-flags/feature-flags-admin.controller.ts`
- [ ] Implement CRUD endpoints for flags
- [ ] Implement override endpoints
- [ ] Apply system admin guard

#### 12.6 Create DTOs
- [ ] Create `apps/api/src/feature-flags/dto/create-flag.dto.ts`
- [ ] Create `apps/api/src/feature-flags/dto/update-flag.dto.ts`
- [ ] Create `apps/api/src/feature-flags/dto/create-override.dto.ts`
- [ ] Create `apps/api/src/feature-flags/dto/feature-status.dto.ts`

### Database (packages/db)

#### 12.7 Create Database Schema
- [ ] Create migration `XXXX_add_feature_flags_tables.ts`
- [ ] Add `feature_flags` table
- [ ] Add `organization_feature_overrides` table
- [ ] Add indexes
- [ ] Add unique constraint on (org_id, flag_id)

#### 12.8 Export Schema
- [ ] Add schema to `packages/db/src/schema/index.ts`
- [ ] Create seed migration for default flags

### Frontend (apps/web)

#### 12.9 Admin Feature Flags Page
- [ ] Create `apps/web/src/app/(dashboard)/admin/feature-flags/page.tsx`
- [ ] Create flag list component with filtering
- [ ] Create flag creation dialog/form
- [ ] Create flag edit page
- [ ] Create override management UI

#### 12.10 Organization Features Page
- [ ] Create `apps/web/src/app/(dashboard)/settings/features/page.tsx`
- [ ] Display enabled/disabled features with status
- [ ] Show required plan for gated features
- [ ] Link to upgrade for plan-gated features

#### 12.11 API Integration
- [ ] Create `use-feature-flags.ts` hooks (admin)
- [ ] Create `use-org-features.ts` hooks (public)
- [ ] Add API client methods

---

## 13. Test Plan

### Unit Tests

#### Feature Flags Service Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `isEnabled()` returns false for non-existent flag | false returned |
| `isEnabled()` returns false when master switch off | false returned |
| `isEnabled()` returns override value when exists | Override value returned |
| `isEnabled()` evaluates boolean flag correctly | defaultValue returned |
| `isEnabled()` evaluates plan flag - org has plan | true returned |
| `isEnabled()` evaluates plan flag - org lacks plan | false returned |
| `isEnabled()` percentage rollout consistent | Same org always gets same result |
| `isEnabled()` percentage at 0% | false for all orgs |
| `isEnabled()` percentage at 100% | true for all orgs |
| `getEnabledFeatures()` returns correct list | Only enabled features returned |
| Cache hit returns cached value | No DB query made |
| Cache miss queries DB and caches | Result cached |

#### Admin Service Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Create flag with valid data | Flag created |
| Create flag with duplicate key | Error thrown |
| Update flag properties | Flag updated, cache invalidated |
| Delete flag | Flag deleted, overrides cascade deleted |
| Add override to flag | Override created |
| Add duplicate override | Error thrown |
| Remove override | Override deleted, cache invalidated |

### Integration Tests

#### End-to-End Feature Flag Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Free user checks pro feature | GET /features/advanced_analytics | enabled: false |
| Pro user checks pro feature | GET /features/advanced_analytics | enabled: true |
| Override enables feature | Add override, GET /features/:key | enabled: true |
| Override disables feature | Add disable override | enabled: false |
| Master switch disabled | Disable flag, GET /features/:key | enabled: false |
| Percentage rollout | Check multiple orgs | Consistent results |

#### Admin API Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Non-admin access admin endpoint | GET /admin/feature-flags | 403 Forbidden |
| Admin creates flag | POST /admin/feature-flags | 201 Created |
| Admin updates flag | PATCH /admin/feature-flags/:id | 200 OK |
| Admin deletes flag | DELETE /admin/feature-flags/:id | 204 No Content |
| Admin adds override | POST /admin/feature-flags/:id/overrides | 201 Created |

### E2E Tests (Playwright)

```gherkin
Scenario: Org owner views features
  Given I am logged in as an org owner on free plan
  When I navigate to Settings > Features
  Then I should see a list of features
  And pro features should show "Requires Pro plan"
  And free features should show "Enabled"

Scenario: Admin creates feature flag
  Given I am logged in as a system admin
  When I navigate to Admin > Feature Flags
  And I click "Create Flag"
  And I fill in the flag form
  And I click "Create"
  Then the flag should appear in the list

Scenario: Admin enables beta for specific org
  Given I am logged in as a system admin
  And a "beta_features" flag exists
  When I add an override for org "beta-tester-org"
  Then that org should have beta features enabled
```

---

## 14. Security Considerations

1. **Admin-only management** – Only system admins can create/edit/delete flags
2. **No flag definitions exposed** – Public API only returns enabled status, not flag configuration
3. **Server-side evaluation** – Flags evaluated on server, not client (prevents manipulation)
4. **Input validation** – Flag keys must be lowercase alphanumeric with hyphens only
5. **Audit logging** – All flag changes and override changes logged to audit log
6. **Rate limiting** – Public feature check endpoints rate limited
7. **No sensitive data** – Flag configurations should not contain sensitive information

### Flag Key Validation

```typescript
const FLAG_KEY_REGEX = /^[a-z][a-z0-9_-]{2,63}$/;

function validateFlagKey(key: string): boolean {
  return FLAG_KEY_REGEX.test(key);
}
// Valid: "advanced-analytics", "beta_features", "v2-dashboard"
// Invalid: "Advanced_Analytics", "123-flag", "a"
```

---

## 15. Performance Considerations

1. **Aggressive caching** – Cache flag definitions (5 min) and evaluations (1 min)
2. **Batch flag checks** – `getEnabledFeatures()` batches checks when possible
3. **Index on flag.key** – Fast lookup by key
4. **Efficient hashing** – Simple consistent hash for percentage rollouts
5. **No N+1 queries** – Preload overrides when checking multiple flags
6. **Lazy evaluation** – Only evaluate flags when requested

### Estimated Performance

| Operation | Target | Notes |
|-----------|--------|-------|
| Single flag check (cached) | < 1ms | Memory cache hit |
| Single flag check (uncached) | < 10ms | DB query + cache set |
| All features check | < 50ms | Batch evaluation |
| Admin list flags | < 100ms | Simple query |

---

## 16. Project Structure

```
apps/api/src/
├── feature-flags/
│   ├── feature-flags.module.ts
│   ├── feature-flags.service.ts         # Core evaluation service
│   ├── feature-flags-admin.service.ts   # Admin CRUD operations
│   ├── features.controller.ts           # Public endpoints
│   ├── feature-flags-admin.controller.ts # Admin endpoints
│   └── dto/
│       ├── create-flag.dto.ts
│       ├── update-flag.dto.ts
│       ├── create-override.dto.ts
│       └── feature-status.dto.ts

packages/db/src/
├── schema/
│   └── feature-flags.ts
└── migrations/
    ├── XXXX_add_feature_flags_tables.ts
    └── XXXX_seed_feature_flags.ts

apps/web/src/
├── app/(dashboard)/
│   ├── settings/
│   │   └── features/
│   │       └── page.tsx
│   └── admin/
│       └── feature-flags/
│           ├── page.tsx
│           ├── [id]/
│           │   └── page.tsx
│           └── components/
│               ├── flag-list.tsx
│               ├── flag-form.tsx
│               ├── override-list.tsx
│               └── override-form.tsx
└── hooks/
    ├── use-feature-flags.ts
    └── use-org-features.ts
```

---

## 17. Dependencies

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/cache-manager` | `^2.x` | Caching layer (already installed) |
| `ioredis` | `^5.x` | Redis client for distributed cache (optional) |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | `^5.x` | Data fetching (already installed) |

---

## 18. Future Enhancements

- **User-level flags** – Flags that apply to individual users, not just orgs
- **Time-based flags** – Flags that auto-enable/disable at specific times
- **A/B variants** – Support for multiple variants beyond on/off
- **Flag dependencies** – Flag A requires Flag B to be enabled
- **Analytics integration** – Track feature usage and correlate with flags
- **Self-service beta** – Allow orgs to opt-in to beta features
- **Flag scheduling** – Schedule flag changes for future dates
- **Webhook on change** – Notify external systems when flags change

