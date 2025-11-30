# Audit Logs

**Epic:** Audit Logs
**Priority:** TBD
**Depends on:** Organizations, better-auth Integration, BullMQ Worker
**Status:** Draft

---

## 1. Context

### Why Audit Logs Are Needed

Audit logs are critical for:

- **Compliance** – SOC2, HIPAA, and GDPR require organizations to maintain records of user actions
- **Security** – Detecting and investigating unauthorized access or suspicious activity
- **Debugging** – Tracing issues back to specific user actions or system events
- **Accountability** – Providing transparency into who did what and when

### Business Value

| Benefit | Description |
|---------|-------------|
| SOC2/HIPAA Compliance | Required audit trails for security certifications |
| Incident Investigation | Quickly identify who performed actions during security incidents |
| Customer Trust | Enterprise customers require audit capabilities |
| Internal Operations | Debug issues and understand system behavior |

### Technical Approach

- **Event-driven architecture** – Services emit audit events after successful operations
- **Append-only storage** – Logs are immutable; no updates or deletes allowed
- **Async processing** – Events queued via BullMQ to avoid blocking main operations
- **Denormalized data** – Actor and resource names stored for historical accuracy
- **RLS-scoped** – All records include `org_id` for tenant isolation

---

## 2. User Stories

### US-1: View Organization Audit Logs

**As an** org owner
**I want to** view all actions taken in my organization
**So that** I can monitor activity and ensure accountability

### US-2: Filter and Search Logs

**As an** org owner
**I want to** filter logs by actor, action, resource type, or date range
**So that** I can quickly find relevant events during investigations

### US-3: Export Audit Logs

**As an** org owner
**I want to** export audit logs as CSV or JSON
**So that** I can provide compliance reports to auditors

### US-4: Automatic Event Logging

**As the** system
**I want to** automatically log all significant user and system actions
**So that** a complete audit trail is maintained without manual intervention

### US-5: Retention Policy Management

**As an** org owner
**I want to** configure log retention policies
**So that** I can balance storage costs with compliance requirements

---

## 3. Acceptance Criteria

### US-1: View Organization Audit Logs

- [ ] Audit logs page accessible from organization settings
- [ ] Logs displayed in reverse chronological order (newest first)
- [ ] Each log entry shows: timestamp, actor, action, resource, and metadata
- [ ] Pagination support for large log volumes
- [ ] Only users with OWNER role can access audit logs

### US-2: Filter and Search Logs

- [ ] Filter by actor (user name or email)
- [ ] Filter by action type (e.g., `created`, `updated`, `deleted`)
- [ ] Filter by resource type (e.g., `project`, `member`, `settings`)
- [ ] Filter by date range (start/end dates)
- [ ] Filters can be combined
- [ ] Filter state preserved in URL for sharing

### US-3: Export Audit Logs

- [ ] Export button available on audit logs page
- [ ] Support CSV format export
- [ ] Support JSON format export
- [ ] Export respects current filters
- [ ] Export includes all fields (not just visible columns)
- [ ] Large exports handled asynchronously with download link

### US-4: Automatic Event Logging

- [ ] All CRUD operations on core resources are logged
- [ ] Authentication events (login, logout, failures) are logged
- [ ] Settings changes are logged
- [ ] API key operations are logged
- [ ] Webhook endpoint changes are logged
- [ ] Logging failures do not affect main operations

### US-5: Retention Policy Management

- [ ] Default retention period of 90 days
- [ ] Configurable retention per organization (enterprise feature)
- [ ] Automatic cleanup of logs past retention period
- [ ] Warning before logs are purged

---

## 4. Database Schema

### audit_logs Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default random | Unique identifier |
| `org_id` | `uuid` | NOT NULL, FK → organizations | Tenant isolation (RLS) |
| `actor_id` | `uuid` | NULLABLE | User who performed action (null for system) |
| `actor_type` | `text` | NOT NULL | `'user'`, `'api_key'`, `'system'` |
| `actor_name` | `text` | NULLABLE | Denormalized actor display name |
| `actor_email` | `text` | NULLABLE | Denormalized actor email |
| `action` | `text` | NOT NULL | Verb: `'created'`, `'updated'`, `'deleted'`, etc. |
| `resource_type` | `text` | NOT NULL | `'project'`, `'member'`, `'settings'`, etc. |
| `resource_id` | `text` | NULLABLE | ID of affected resource |
| `resource_name` | `text` | NULLABLE | Denormalized resource name |
| `changes` | `jsonb` | NULLABLE | Before/after diff for updates |
| `metadata` | `jsonb` | NULLABLE | Additional context |
| `ip_address` | `text` | NULLABLE | Client IP address |
| `user_agent` | `text` | NULLABLE | Client user agent |
| `created_at` | `timestamp with time zone` | NOT NULL, default now() | Event timestamp |

### Schema Definition (Drizzle)

```typescript
// packages/db/src/schema/audit-logs.ts
import { pgTable, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id'),
  actorType: text('actor_type').notNull(), // 'user' | 'api_key' | 'system'
  actorName: text('actor_name'),
  actorEmail: text('actor_email'),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id'),
  resourceName: text('resource_name'),
  changes: jsonb('changes'),
  metadata: jsonb('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdIdx: index('audit_logs_org_id_idx').on(table.orgId),
  createdAtIdx: index('audit_logs_created_at_idx').on(table.createdAt),
  actionIdx: index('audit_logs_action_idx').on(table.action),
  resourceTypeIdx: index('audit_logs_resource_type_idx').on(table.resourceType),
  actorIdIdx: index('audit_logs_actor_id_idx').on(table.actorId),
  // Composite index for common query pattern
  orgCreatedIdx: index('audit_logs_org_created_idx').on(table.orgId, table.createdAt),
}));
```

### RLS Policy

```sql
-- Read-only access for org members with OWNER role
CREATE POLICY audit_logs_select ON audit_logs
  FOR SELECT
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Insert only (no update/delete policies)
CREATE POLICY audit_logs_insert ON audit_logs
  FOR INSERT
  WITH CHECK (org_id = current_setting('app.current_org_id')::uuid);

-- IMPORTANT: No UPDATE or DELETE policies - audit logs are append-only
```

### Constraints

- **Append-only**: No `UPDATE` or `DELETE` operations allowed at application level
- **RLS-scoped**: All queries must use `withTenantContext()`
- **Immutable**: Database triggers can enforce no-modification rules

---

## 5. Audited Actions

### Authentication Events

| Action | Description | Resource Type |
|--------|-------------|---------------|
| `user.login` | User successfully logged in | `auth` |
| `user.logout` | User logged out | `auth` |
| `user.login_failed` | Failed login attempt | `auth` |
| `user.password_changed` | User changed password | `auth` |
| `user.mfa_enabled` | User enabled MFA | `auth` |
| `user.mfa_disabled` | User disabled MFA | `auth` |

### Member Events

| Action | Description | Resource Type |
|--------|-------------|---------------|
| `member.invited` | User invited to organization | `member` |
| `member.joined` | User accepted invitation | `member` |
| `member.removed` | Member removed from organization | `member` |
| `member.role_changed` | Member's role updated | `member` |

### Project Events

| Action | Description | Resource Type |
|--------|-------------|---------------|
| `project.created` | New project created | `project` |
| `project.updated` | Project details updated | `project` |
| `project.deleted` | Project deleted | `project` |

### Settings Events

| Action | Description | Resource Type |
|--------|-------------|---------------|
| `settings.updated` | Organization settings changed | `settings` |
| `billing.plan_changed` | Subscription plan changed | `billing` |
| `billing.payment_method_updated` | Payment method updated | `billing` |

### API Key Events

| Action | Description | Resource Type |
|--------|-------------|---------------|
| `api_key.created` | New API key created | `api_key` |
| `api_key.revoked` | API key revoked | `api_key` |
| `api_key.rotated` | API key rotated | `api_key` |

### Webhook Events

| Action | Description | Resource Type |
|--------|-------------|---------------|
| `webhook_endpoint.created` | Webhook endpoint created | `webhook` |
| `webhook_endpoint.updated` | Webhook endpoint updated | `webhook` |
| `webhook_endpoint.deleted` | Webhook endpoint deleted | `webhook` |

### File Events

| Action | Description | Resource Type |
|--------|-------------|---------------|
| `file.uploaded` | File uploaded | `file` |
| `file.deleted` | File deleted | `file` |

---

## 6. API Endpoints

### Endpoints Overview

| Method | Path | Description | Role |
|--------|------|-------------|------|
| `GET` | `/audit-logs` | List audit logs with pagination and filters | OWNER |
| `GET` | `/audit-logs/:id` | Get single audit log entry | OWNER |
| `GET` | `/audit-logs/export` | Export logs as CSV/JSON | OWNER |
| `GET` | `/audit-logs/stats` | Get log statistics | OWNER |

### List Audit Logs

```http
GET /api/v1/audit-logs?page=1&limit=50&action=created&resource_type=project
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 50, max: 100) |
| `actor_id` | `uuid` | Filter by actor ID |
| `actor_email` | `string` | Filter by actor email (partial match) |
| `action` | `string` | Filter by action (e.g., `created`) |
| `resource_type` | `string` | Filter by resource type |
| `resource_id` | `string` | Filter by specific resource |
| `start_date` | `ISO 8601` | Filter logs from this date |
| `end_date` | `ISO 8601` | Filter logs until this date |

#### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "actor": {
        "id": "user-uuid",
        "type": "user",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "action": "created",
      "resource": {
        "type": "project",
        "id": "project-uuid",
        "name": "My Project"
      },
      "changes": null,
      "metadata": {
        "source": "web"
      },
      "ipAddress": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1250,
    "totalPages": 25
  }
}
```

### Get Single Audit Log

```http
GET /api/v1/audit-logs/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

### Export Audit Logs

```http
GET /api/v1/audit-logs/export?format=csv&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `format` | `string` | Export format: `csv` or `json` |
| All filter params | - | Same filters as list endpoint |

### Get Audit Log Stats

```http
GET /api/v1/audit-logs/stats?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

#### Response

```json
{
  "totalLogs": 1250,
  "byAction": {
    "created": 450,
    "updated": 600,
    "deleted": 200
  },
  "byResourceType": {
    "project": 800,
    "member": 300,
    "settings": 150
  },
  "byActor": [
    { "actorId": "user-1", "actorName": "John Doe", "count": 500 },
    { "actorId": "user-2", "actorName": "Jane Smith", "count": 450 }
  ],
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  }
}
```


---

## 7. Audit Log Service

### Service Interface

```typescript
// apps/api/src/audit-logs/audit-log.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface AuditLogEvent {
  orgId: string;
  actorId?: string;
  actorType: 'user' | 'api_key' | 'system';
  actorName?: string;
  actorEmail?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  changes?: {
    before?: Record<string, unknown>;
    after?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(
    @InjectQueue('audit-logs') private auditQueue: Queue,
  ) {}

  /**
   * Queue an audit log event for async processing.
   * IMPORTANT: This method never throws - logging failures
   * should not affect main operations.
   */
  async log(event: AuditLogEvent): Promise<void> {
    try {
      await this.auditQueue.add('process-audit-log', event, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 1000,
      });
    } catch (error) {
      // Log error but don't throw - audit logging should never break operations
      this.logger.error('Failed to queue audit log event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        event,
      });
    }
  }
}
```

### Usage in Services

```typescript
// Example: ProjectsService
@Injectable()
export class ProjectsService {
  constructor(
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(ctx: TenantContext, dto: CreateProjectDto): Promise<Project> {
    const project = await withTenantContext(ctx, async (db) => {
      return db.insert(projects).values({
        orgId: ctx.orgId,
        name: dto.name,
        // ...
      }).returning();
    });

    // Log after successful operation
    await this.auditLogService.log({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      actorType: 'user',
      actorName: ctx.userName,
      actorEmail: ctx.userEmail,
      action: 'created',
      resourceType: 'project',
      resourceId: project.id,
      resourceName: project.name,
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return project;
  }

  async update(ctx: TenantContext, id: string, dto: UpdateProjectDto): Promise<Project> {
    const [before, after] = await withTenantContext(ctx, async (db) => {
      const existing = await db.query.projects.findFirst({
        where: eq(projects.id, id),
      });

      const updated = await db.update(projects)
        .set(dto)
        .where(eq(projects.id, id))
        .returning();

      return [existing, updated];
    });

    await this.auditLogService.log({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      actorType: 'user',
      actorName: ctx.userName,
      actorEmail: ctx.userEmail,
      action: 'updated',
      resourceType: 'project',
      resourceId: id,
      resourceName: after.name,
      changes: {
        before: { name: before.name, description: before.description },
        after: { name: after.name, description: after.description },
      },
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
    });

    return after;
  }
}
```

### Worker Handler

```typescript
// apps/worker/src/handlers/audit-log.handler.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { db } from '@forgestack/db';
import { auditLogs } from '@forgestack/db/schema';

@Processor('audit-logs')
export class AuditLogHandler extends WorkerHost {
  private readonly logger = new Logger(AuditLogHandler.name);

  async process(job: Job<AuditLogEvent>): Promise<void> {
    const event = job.data;

    try {
      await db.insert(auditLogs).values({
        orgId: event.orgId,
        actorId: event.actorId,
        actorType: event.actorType,
        actorName: event.actorName,
        actorEmail: event.actorEmail,
        action: event.action,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        resourceName: event.resourceName,
        changes: event.changes,
        metadata: event.metadata,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
      });

      this.logger.debug(`Audit log processed: ${event.action} ${event.resourceType}`);
    } catch (error) {
      this.logger.error('Failed to process audit log', {
        error: error instanceof Error ? error.message : 'Unknown error',
        event,
      });
      throw error; // Rethrow to trigger retry
    }
  }
}
```

---

## 8. Frontend Components

### Page Structure

```
apps/web/src/app/(dashboard)/settings/audit-logs/
├── page.tsx                    # Main audit logs page
├── components/
│   ├── audit-log-list.tsx      # Log entries table/list
│   ├── audit-log-entry.tsx     # Single log entry row
│   ├── audit-log-detail.tsx    # Detail modal/panel
│   ├── audit-log-filters.tsx   # Filter panel
│   ├── audit-log-export.tsx    # Export dialog
│   └── audit-log-timeline.tsx  # Timeline view (optional)
└── hooks/
    └── use-audit-logs.ts       # Query hook
```

### Main Page Component

```tsx
// apps/web/src/app/(dashboard)/settings/audit-logs/page.tsx
'use client';

import { useState } from 'react';
import { AuditLogList } from './components/audit-log-list';
import { AuditLogFilters } from './components/audit-log-filters';
import { AuditLogExport } from './components/audit-log-export';
import { useAuditLogs } from './hooks/use-audit-logs';

export default function AuditLogsPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({});
  const { data, isLoading, fetchNextPage, hasNextPage } = useAuditLogs(filters);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <AuditLogExport filters={filters} />
      </div>

      <AuditLogFilters filters={filters} onFiltersChange={setFilters} />

      <AuditLogList
        logs={data}
        isLoading={isLoading}
        hasMore={hasNextPage}
        onLoadMore={fetchNextPage}
      />
    </div>
  );
}
```

### Filter Components

```tsx
// apps/web/src/app/(dashboard)/settings/audit-logs/components/audit-log-filters.tsx
interface AuditLogFiltersProps {
  filters: {
    actorEmail?: string;
    action?: string;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
  };
  onFiltersChange: (filters: AuditLogFilters) => void;
}

export function AuditLogFilters({ filters, onFiltersChange }: AuditLogFiltersProps) {
  return (
    <div className="flex flex-wrap gap-4 p-4 border rounded-lg bg-muted/50">
      {/* Actor filter */}
      <Input
        placeholder="Search by actor email..."
        value={filters.actorEmail || ''}
        onChange={(e) => onFiltersChange({ ...filters, actorEmail: e.target.value })}
      />

      {/* Action type select */}
      <Select
        value={filters.action}
        onValueChange={(value) => onFiltersChange({ ...filters, action: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Action" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Actions</SelectItem>
          <SelectItem value="created">Created</SelectItem>
          <SelectItem value="updated">Updated</SelectItem>
          <SelectItem value="deleted">Deleted</SelectItem>
        </SelectContent>
      </Select>

      {/* Resource type select */}
      <Select
        value={filters.resourceType}
        onValueChange={(value) => onFiltersChange({ ...filters, resourceType: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Resource" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Resources</SelectItem>
          <SelectItem value="project">Project</SelectItem>
          <SelectItem value="member">Member</SelectItem>
          <SelectItem value="settings">Settings</SelectItem>
          <SelectItem value="api_key">API Key</SelectItem>
          <SelectItem value="webhook">Webhook</SelectItem>
        </SelectContent>
      </Select>

      {/* Date range picker */}
      <DateRangePicker
        startDate={filters.startDate}
        endDate={filters.endDate}
        onDateChange={(start, end) =>
          onFiltersChange({ ...filters, startDate: start, endDate: end })
        }
      />

      {/* Clear filters */}
      <Button variant="ghost" onClick={() => onFiltersChange({})}>
        Clear Filters
      </Button>
    </div>
  );
}
```

### Query Hook

```tsx
// apps/web/src/app/(dashboard)/settings/audit-logs/hooks/use-audit-logs.ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAuditLogs(filters: AuditLogFilters) {
  return useInfiniteQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: String(pageParam),
        limit: '50',
        ...filters,
      });
      return api.get(`/audit-logs?${params}`);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}
```



---

## 9. Tasks

### Backend (apps/api)

#### 9.1 Create Audit Logs Module
- [ ] Create `apps/api/src/audit-logs/audit-logs.module.ts`
- [ ] Register service, controller, and queue
- [ ] Import BullMQ module with `audit-logs` queue
- [ ] Export `AuditLogService` for use in other modules

#### 9.2 Create Audit Log Service
- [ ] Create `apps/api/src/audit-logs/audit-log.service.ts`
- [ ] Implement `log(event)` method (queues to BullMQ)
- [ ] Implement `findAll(orgId, filters)` with pagination
- [ ] Implement `findOne(orgId, id)` method
- [ ] Implement `getStats(orgId, filters)` method
- [ ] Implement `export(orgId, filters, format)` method

#### 9.3 Create Audit Logs Controller
- [ ] Create `apps/api/src/audit-logs/audit-logs.controller.ts`
- [ ] Implement `GET /audit-logs` endpoint with filters
- [ ] Implement `GET /audit-logs/:id` endpoint
- [ ] Implement `GET /audit-logs/export` endpoint
- [ ] Implement `GET /audit-logs/stats` endpoint
- [ ] Apply `@Roles('OWNER')` guard to all endpoints

#### 9.4 Create DTOs
- [ ] Create `apps/api/src/audit-logs/dto/list-audit-logs.dto.ts` (query params)
- [ ] Create `apps/api/src/audit-logs/dto/export-audit-logs.dto.ts`
- [ ] Create `apps/api/src/audit-logs/dto/audit-log.dto.ts` (response)

#### 9.5 Add Audit Logging to Existing Services
- [ ] Add audit logging to `OrganizationsService`
- [ ] Add audit logging to `ProjectsService`
- [ ] Add audit logging to `MembersService`
- [ ] Add audit logging to `ApiKeysService`
- [ ] Add audit logging to `WebhooksService`
- [ ] Add audit logging to `SettingsService`
- [ ] Add audit logging to auth events (better-auth hooks)

### Database (packages/db)

#### 9.6 Create audit_logs Table
- [ ] Create migration file `XXXX_add_audit_logs_table.ts`
- [ ] Add `audit_logs` table schema
- [ ] Add indexes (org_id, created_at, action, resource_type, actor_id)
- [ ] Add composite index (org_id, created_at)
- [ ] Apply RLS policies (SELECT and INSERT only)
- [ ] Add database trigger to prevent UPDATE/DELETE (optional)

#### 9.7 Export Schema
- [ ] Add `auditLogs` to `packages/db/src/schema/index.ts`
- [ ] Add TypeScript types for audit log events

### Worker (apps/worker)

#### 9.8 Audit Log Processing Handler
- [ ] Create `apps/worker/src/handlers/audit-log.handler.ts`
- [ ] Implement `process()` method to insert log entries
- [ ] Add error handling with retries
- [ ] Add dead letter queue for failed logs

#### 9.9 Register Queue
- [ ] Add `audit-logs` queue to worker configuration
- [ ] Configure retry policy (3 attempts, exponential backoff)

### Frontend (apps/web)

#### 9.10 Audit Logs Page
- [ ] Create `apps/web/src/app/(dashboard)/settings/audit-logs/page.tsx`
- [ ] Add page to settings navigation
- [ ] Implement role-based access (OWNER only)

#### 9.11 Log Entry Components
- [ ] Create `audit-log-list.tsx` - Table/list view
- [ ] Create `audit-log-entry.tsx` - Single row component
- [ ] Create `audit-log-detail.tsx` - Detail modal/panel
- [ ] Add loading and empty states
- [ ] Add infinite scroll or pagination

#### 9.12 Filter Components
- [ ] Create `audit-log-filters.tsx` - Filter panel
- [ ] Implement actor filter (email search)
- [ ] Implement action type filter
- [ ] Implement resource type filter
- [ ] Implement date range picker
- [ ] Sync filters with URL params

#### 9.13 Export Functionality
- [ ] Create `audit-log-export.tsx` - Export dialog
- [ ] Implement CSV export
- [ ] Implement JSON export
- [ ] Add download progress for large exports

#### 9.14 API Integration
- [ ] Create `use-audit-logs.ts` hook with infinite query
- [ ] Create `use-export-audit-logs.ts` hook
- [ ] Add API client methods for audit log endpoints

---

## 10. Test Plan

### Unit Tests

#### Audit Log Service Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `log()` queues event successfully | Event added to BullMQ queue |
| `log()` handles queue failure gracefully | No exception thrown, error logged |
| `findAll()` returns paginated results | Correct page size and total count |
| `findAll()` applies actor filter | Only matching actor logs returned |
| `findAll()` applies action filter | Only matching action logs returned |
| `findAll()` applies date range filter | Only logs within range returned |
| `findAll()` combines multiple filters | Filters applied with AND logic |
| `findOne()` returns single log | Correct log entry returned |
| `findOne()` returns 404 for non-existent | NotFoundError thrown |
| `getStats()` calculates correctly | Correct counts by action/resource |
| `export()` generates valid CSV | Proper CSV format with headers |
| `export()` generates valid JSON | Valid JSON array |

#### Controller Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `GET /audit-logs` without OWNER role | 403 Forbidden |
| `GET /audit-logs` with OWNER role | 200 OK with logs |
| `GET /audit-logs` with invalid filters | 400 Bad Request |
| `GET /audit-logs/:id` with valid ID | 200 OK with log |
| `GET /audit-logs/:id` with invalid ID | 404 Not Found |
| `GET /audit-logs/export` returns file | 200 with file download |
| `GET /audit-logs/stats` returns stats | 200 OK with statistics |

#### Worker Handler Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Process valid audit log event | Log inserted to database |
| Process event with missing required fields | Job failed, error logged |
| Process event after 3 failed attempts | Job moved to dead letter queue |

### Integration Tests

#### End-to-End Audit Logging Flow
| Scenario | Steps | Expected |
|----------|-------|----------|
| Project creation logged | Create project via API | Audit log entry created with action `project.created` |
| Member invite logged | Invite member via API | Audit log entry with action `member.invited` |
| Settings update logged | Update org settings | Audit log entry with changes diff |
| API key creation logged | Create API key | Audit log entry (key value not logged) |
| Login event logged | User logs in | Auth event logged with IP/user agent |

#### Query and Filter Tests
| Scenario | Steps | Expected |
|----------|-------|----------|
| List logs by actor | Filter by actor_email | Only logs from that actor |
| List logs by action | Filter by action=created | Only created actions |
| List logs by date range | Filter last 7 days | Only recent logs |
| Combined filters | Multiple filters | AND logic applied |
| Pagination | Request page 2 | Correct offset/limit |

#### RLS Enforcement Tests
| Scenario | Steps | Expected |
|----------|-------|----------|
| Cross-org query blocked | Query with wrong org_id | Empty result (RLS blocks) |
| Own org logs accessible | Query with correct org_id | Logs returned |

### E2E Tests (Playwright)

#### Audit Logs Page Tests
```gherkin
Scenario: View audit logs as org owner
  Given I am logged in as an org OWNER
  When I navigate to Settings > Audit Logs
  Then I should see the audit logs list
  And logs should be sorted by newest first

Scenario: Filter audit logs by action
  Given I am on the audit logs page
  When I select "Created" from the action filter
  Then I should only see logs with action "created"
  And the URL should reflect the filter

Scenario: Export audit logs
  Given I am on the audit logs page
  And I have applied date filters
  When I click "Export" and select CSV
  Then a CSV file should download
  And it should contain the filtered logs

Scenario: Access denied for non-owner
  Given I am logged in as an org MEMBER (not OWNER)
  When I try to navigate to Settings > Audit Logs
  Then I should see an access denied message
```

### Performance Tests

| Scenario | Target | Notes |
|----------|--------|-------|
| List 50 logs | < 200ms | With indexes |
| Filter by date range (30 days) | < 300ms | Composite index |
| Export 10,000 logs | < 10s | Streaming response |
| High-volume logging | 1000 events/min | BullMQ throughput |

---

## 11. Security Considerations

1. **Immutability** – Audit logs must be append-only; no UPDATE or DELETE at application or database level
2. **Denormalization** – Store actor/resource names at time of event for historical accuracy
3. **Sensitive data** – Never log passwords, tokens, or full API keys; use masked values
4. **RLS enforcement** – All queries must use `withTenantContext()` for tenant isolation
5. **Role-based access** – Only OWNER role can view audit logs
6. **IP logging** – Include IP address and user agent for security forensics
7. **Retention limits** – Implement configurable retention to manage storage and comply with data policies

---

## 12. Performance Considerations

1. **Async logging** – All audit events queued via BullMQ to avoid blocking operations
2. **Indexes** – Composite index on (org_id, created_at) for common query pattern
3. **Pagination** – Mandatory pagination with max 100 items per page
4. **No full table scans** – All queries must use indexed columns
5. **Streaming exports** – Large exports streamed to avoid memory issues
6. **Table partitioning** – Consider partitioning by date for high-volume organizations
7. **Read replicas** – Route audit log queries to read replicas in production

---

## 13. Project Structure

```
apps/api/src/
├── audit-logs/
│   ├── audit-logs.module.ts
│   ├── audit-logs.controller.ts
│   ├── audit-log.service.ts
│   └── dto/
│       ├── list-audit-logs.dto.ts
│       ├── export-audit-logs.dto.ts
│       └── audit-log.dto.ts

packages/db/src/
├── schema/
│   └── audit-logs.ts
└── migrations/
    └── XXXX_add_audit_logs_table.ts

apps/worker/src/
├── handlers/
│   └── audit-log.handler.ts
└── config/
    └── queues.ts  # Add audit-logs queue

apps/web/src/
├── app/(dashboard)/
│   └── settings/
│       └── audit-logs/
│           ├── page.tsx
│           ├── components/
│           │   ├── audit-log-list.tsx
│           │   ├── audit-log-entry.tsx
│           │   ├── audit-log-detail.tsx
│           │   ├── audit-log-filters.tsx
│           │   └── audit-log-export.tsx
│           └── hooks/
│               └── use-audit-logs.ts
```

---

## 14. Dependencies

### Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/bullmq` | `^10.x` | BullMQ integration (already installed) |
| `json2csv` | `^6.x` | CSV export generation |

### Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | `^5.x` | Data fetching (already installed) |
| `date-fns` | `^3.x` | Date formatting (already installed) |

---

## 15. Future Enhancements

- **Real-time updates** – WebSocket subscription for live audit log updates
- **Alerting** – Configure alerts for specific audit events (e.g., failed logins)
- **SIEM integration** – Export to external security tools (Splunk, DataDog)
- **Audit log API** – Allow external systems to query audit logs via API
- **Compliance reports** – Pre-built reports for SOC2/HIPAA audits
- **Log archival** – Archive old logs to cold storage (S3) for cost optimization