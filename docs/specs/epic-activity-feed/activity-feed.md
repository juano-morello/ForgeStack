# Activity Feed

**Epic:** Activity Feed
**Priority:** TBD
**Depends on:** Organizations, better-auth Integration, BullMQ Worker
**Status:** Draft

---

## 1. Context

### Why Activity Feed Is Needed

The Activity Feed provides team awareness and collaboration visibility:

- **Team Awareness** – See what teammates are working on in real-time
- **Collaboration** – Stay informed about project updates and changes
- **Onboarding** – New team members can quickly catch up on recent activity
- **Engagement** – Increase user engagement by surfacing relevant activities

### Business Value

| Benefit | Description |
|---------|-------------|
| Team Collaboration | Real-time visibility into team activities |
| User Engagement | Keep users informed and engaged with the platform |
| Quick Context | Understand recent changes without digging through history |
| Social Proof | See that the organization is active and productive |

### Activity Feed vs Audit Logs

| Aspect | Audit Logs | Activity Feed |
|--------|------------|---------------|
| Purpose | Compliance/Security | Collaboration/Awareness |
| Access | OWNER only | All org members |
| Retention | Permanent (90+ days) | Shorter (e.g., 30 days) |
| Format | Technical, detailed | User-friendly, concise |
| Aggregation | None (every action logged) | Yes (grouped activities) |
| Updates | Append-only (immutable) | Can update for aggregation |
| Data | IP, user agent, changes | Human-readable summary |

### Technical Approach

- **Event-driven architecture** – Services emit activity events after operations
- **Aggregation** – Group similar activities within time windows
- **Async processing** – Events queued via BullMQ to avoid blocking
- **Denormalized data** – Actor names/avatars stored for display
- **Cursor pagination** – For efficient infinite scroll
- **RLS-scoped** – All records include `org_id` for tenant isolation

---

## 2. User Stories

### US-1: View Recent Organization Activities

**As an** org member
**I want to** see recent activities in my organization
**So that** I can stay informed about what's happening

### US-2: Filter Activities

**As an** org member
**I want to** filter activities by type, user, or project
**So that** I can focus on activities relevant to me

### US-3: View Aggregated Activities

**As an** org member
**I want to** see aggregated activities (e.g., "5 files uploaded")
**So that** I'm not overwhelmed by repetitive entries

### US-4: View Activity Details

**As an** org member
**I want to** click on an activity to see more details
**So that** I can understand the full context

### US-5: See Activities on Dashboard

**As an** org member
**I want to** see a summary of recent activities on my dashboard
**So that** I get immediate awareness when I log in

### US-6: Automatic Activity Generation

**As the** system
**I want to** automatically generate activities for key events
**So that** the feed stays current without manual intervention

---

## 3. Acceptance Criteria

### US-1: View Recent Organization Activities

- [ ] Activity feed page accessible from main navigation
- [ ] Activities displayed in reverse chronological order
- [ ] Each activity shows: avatar, actor name, action, timestamp
- [ ] Infinite scroll pagination for loading more activities
- [ ] All org members (not just OWNER) can view activities
- [ ] Relative timestamps ("2 hours ago", "Yesterday")

### US-2: Filter Activities

- [ ] Filter by activity type (projects, members, files, etc.)
- [ ] Filter by actor (specific user)
- [ ] Filter by date range
- [ ] Filters can be combined
- [ ] Filter state preserved in URL

### US-3: View Aggregated Activities

- [ ] Similar activities within 5-minute window are grouped
- [ ] Aggregated entry shows count ("uploaded 5 files")
- [ ] Expanding aggregated entry shows individual items
- [ ] Same actor + same type = aggregatable

### US-4: View Activity Details

- [ ] Clicking activity shows detail panel/modal
- [ ] Detail view shows resource link (if applicable)
- [ ] Detail view shows full description
- [ ] Can navigate to related resource

### US-5: See Activities on Dashboard

- [ ] Dashboard shows "Recent Activity" widget
- [ ] Widget displays 5-10 most recent activities
- [ ] "View all" link to full activity feed
- [ ] Widget refreshes periodically

### US-6: Automatic Activity Generation

- [ ] Project CRUD operations generate activities
- [ ] Member join/leave generates activities
- [ ] File uploads generate activities (aggregatable)
- [ ] API key creation generates activities
- [ ] Webhook creation generates activities
- [ ] Activity creation failures don't affect main operations

---

## 4. Database Schema

### activities Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default random | Unique identifier |
| `org_id` | `uuid` | NOT NULL, FK → organizations | Tenant isolation (RLS) |
| `actor_id` | `uuid` | NOT NULL, FK → users | User who performed action |
| `actor_name` | `text` | NOT NULL | Denormalized display name |
| `actor_avatar` | `text` | NULLABLE | Denormalized avatar URL |
| `type` | `text` | NOT NULL | Activity type (e.g., `project.created`) |
| `title` | `text` | NOT NULL | Human-readable title |
| `description` | `text` | NULLABLE | Additional context |
| `resource_type` | `text` | NULLABLE | Resource category (`project`, `file`, etc.) |
| `resource_id` | `text` | NULLABLE | ID of related resource |
| `resource_name` | `text` | NULLABLE | Denormalized resource name |
| `metadata` | `jsonb` | NULLABLE | Additional data for rendering |
| `aggregation_key` | `text` | NULLABLE | Key for grouping related activities |
| `aggregate_count` | `integer` | DEFAULT 1 | Count of aggregated items |
| `is_aggregated` | `boolean` | DEFAULT false | Whether this is an aggregate entry |
| `created_at` | `timestamp with time zone` | NOT NULL, default now() | Activity timestamp |

### Schema Definition (Drizzle)

```typescript
// packages/db/src/schema/activities.ts
import { pgTable, uuid, text, jsonb, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const activities = pgTable('activities', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  actorId: uuid('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  actorName: text('actor_name').notNull(),
  actorAvatar: text('actor_avatar'),
  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  resourceType: text('resource_type'),
  resourceId: text('resource_id'),
  resourceName: text('resource_name'),
  metadata: jsonb('metadata'),
  aggregationKey: text('aggregation_key'),
  aggregateCount: integer('aggregate_count').notNull().default(1),
  isAggregated: boolean('is_aggregated').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdIdx: index('activities_org_id_idx').on(table.orgId),
  createdAtIdx: index('activities_created_at_idx').on(table.createdAt),
  typeIdx: index('activities_type_idx').on(table.type),
  actorIdIdx: index('activities_actor_id_idx').on(table.actorId),
  aggregationKeyIdx: index('activities_aggregation_key_idx').on(table.aggregationKey),
  // Composite index for common query pattern
  orgCreatedIdx: index('activities_org_created_idx').on(table.orgId, table.createdAt),
}));
```

### RLS Policy

```sql
-- All org members can read activities
CREATE POLICY activities_select ON activities
  FOR SELECT
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Insert for service accounts (via worker)
CREATE POLICY activities_insert ON activities
  FOR INSERT
  WITH CHECK (org_id = current_setting('app.current_org_id')::uuid);

-- Update allowed for aggregation (unlike audit logs)
CREATE POLICY activities_update ON activities
  FOR UPDATE
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Delete allowed for cleanup (unlike audit logs)
CREATE POLICY activities_delete ON activities
  FOR DELETE
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

### Retention Policy

Unlike audit logs, activities can be cleaned up:

```sql
-- Scheduled job to clean up old activities (30 days retention)
DELETE FROM activities
WHERE created_at < NOW() - INTERVAL '30 days';
```

---

## 5. Activity Types

### Projects

| Type | Title Template | Aggregatable |
|------|---------------|--------------|
| `project.created` | "{actor} created project {project}" | No |
| `project.updated` | "{actor} updated project {project}" | No |
| `project.deleted` | "{actor} deleted project {project}" | No |

### Members

| Type | Title Template | Aggregatable |
|------|---------------|--------------|
| `member.joined` | "{actor} joined the organization" | No |
| `member.invited` | "{actor} invited {user} to the organization" | Yes |
| `member.left` | "{actor} left the organization" | No |
| `member.removed` | "{actor} removed {user} from the organization" | No |
| `member.role_changed` | "{actor} changed {user}'s role to {role}" | No |

### Files

| Type | Title Template | Aggregatable |
|------|---------------|--------------|
| `file.uploaded` | "{actor} uploaded {file}" | Yes |
| `file.deleted` | "{actor} deleted {file}" | Yes |

### API Keys

| Type | Title Template | Aggregatable |
|------|---------------|--------------|
| `api_key.created` | "{actor} created API key {name}" | No |
| `api_key.revoked` | "{actor} revoked API key {name}" | No |

### Webhooks

| Type | Title Template | Aggregatable |
|------|---------------|--------------|
| `webhook.created` | "{actor} created webhook {name}" | No |
| `webhook.updated` | "{actor} updated webhook {name}" | No |
| `webhook.deleted` | "{actor} deleted webhook {name}" | No |

### Aggregation Examples

| Individual Activities | Aggregated Display |
|----------------------|-------------------|
| "John uploaded file1.pdf" | "John uploaded 5 files" |
| "John uploaded file2.pdf" | |
| "John uploaded file3.pdf" | |
| "John uploaded file4.pdf" | |
| "John uploaded file5.pdf" | |

---


## 6. API Endpoints

### Endpoints Overview

| Method | Path | Description | Role |
|--------|------|-------------|------|
| `GET` | `/activities` | List activities with pagination and filters | All members |
| `GET` | `/activities/recent` | Get recent activities (dashboard widget) | All members |

### List Activities

```http
GET /api/v1/activities?limit=20&cursor=xxx&type=project.created
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | `number` | Items per page (default: 20, max: 50) |
| `cursor` | `string` | Cursor for pagination (opaque string) |
| `type` | `string` | Filter by activity type |
| `actorId` | `uuid` | Filter by actor ID |
| `resourceType` | `string` | Filter by resource type |
| `since` | `ISO 8601` | Filter activities from this date |

#### Response

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "project.created",
      "title": "created project My Project",
      "description": null,
      "actor": {
        "id": "user-uuid",
        "name": "John Doe",
        "avatar": "https://..."
      },
      "resource": {
        "type": "project",
        "id": "project-uuid",
        "name": "My Project"
      },
      "aggregateCount": 1,
      "createdAt": "2024-01-15T10:30:00Z",
      "relativeTime": "2 hours ago"
    }
  ],
  "pagination": {
    "cursor": "next-cursor-string",
    "hasMore": true
  }
}
```

### Get Recent Activities (Dashboard)

```http
GET /api/v1/activities/recent?limit=10
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | `number` | Number of activities (default: 10, max: 20) |

#### Response

Same structure as list, but no cursor pagination.

---

## 7. Activity Service

### Service Interface

```typescript
// apps/api/src/activities/activity.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface CreateActivityEvent {
  orgId: string;
  actorId: string;
  actorName: string;
  actorAvatar?: string;
  type: string;
  title: string;
  description?: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
  aggregatable?: boolean;
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectQueue('activities') private activityQueue: Queue,
  ) {}

  /**
   * Queue an activity event for async processing.
   * IMPORTANT: This method never throws - activity logging
   * should not affect main operations.
   */
  async create(event: CreateActivityEvent): Promise<void> {
    try {
      await this.activityQueue.add('process-activity', event, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      });
    } catch (error) {
      // Log error but don't throw - activity logging should never break operations
      this.logger.error('Failed to queue activity event', {
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
    private readonly activityService: ActivityService,
  ) {}

  async create(ctx: TenantContext, dto: CreateProjectDto): Promise<Project> {
    const project = await withTenantContext(ctx, async (db) => {
      return db.insert(projects).values({
        orgId: ctx.orgId,
        name: dto.name,
      }).returning();
    });

    // Create activity after successful operation
    await this.activityService.create({
      orgId: ctx.orgId,
      actorId: ctx.userId,
      actorName: ctx.userName,
      actorAvatar: ctx.userAvatar,
      type: 'project.created',
      title: `created project ${project.name}`,
      resourceType: 'project',
      resourceId: project.id,
      resourceName: project.name,
    });

    return project;
  }
}
```

---

## 8. Aggregation Logic

### Aggregation Rules

Activities are aggregated when:
1. **Same actor** – Performed by the same user
2. **Same type** – Same activity type
3. **Same org** – Within the same organization
4. **Within time window** – Within 5 minutes of each other
5. **Aggregatable type** – Activity type supports aggregation

### Aggregation Key Format

```
{orgId}:{actorId}:{type}:{windowStart}
```

Where `windowStart` is the timestamp rounded down to the nearest 5-minute interval.

### Worker Implementation

```typescript
// apps/worker/src/handlers/activity.handler.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { db } from '@forgestack/db';
import { activities } from '@forgestack/db/schema';
import { and, eq, gte } from 'drizzle-orm';

const AGGREGATION_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const AGGREGATABLE_TYPES = ['file.uploaded', 'file.deleted', 'member.invited'];

@Processor('activities')
export class ActivityHandler extends WorkerHost {
  private readonly logger = new Logger(ActivityHandler.name);

  async process(job: Job<CreateActivityEvent>): Promise<void> {
    const event = job.data;

    try {
      if (AGGREGATABLE_TYPES.includes(event.type) && event.aggregatable !== false) {
        await this.processWithAggregation(event);
      } else {
        await this.processSimple(event);
      }
    } catch (error) {
      this.logger.error('Failed to process activity', { error, event });
      throw error;
    }
  }

  private async processSimple(event: CreateActivityEvent): Promise<void> {
    await db.insert(activities).values({
      orgId: event.orgId,
      actorId: event.actorId,
      actorName: event.actorName,
      actorAvatar: event.actorAvatar,
      type: event.type,
      title: event.title,
      description: event.description,
      resourceType: event.resourceType,
      resourceId: event.resourceId,
      resourceName: event.resourceName,
      metadata: event.metadata,
    });
  }

  private async processWithAggregation(event: CreateActivityEvent): Promise<void> {
    const windowStart = new Date(
      Math.floor(Date.now() / AGGREGATION_WINDOW_MS) * AGGREGATION_WINDOW_MS
    );
    const aggregationKey = `${event.orgId}:${event.actorId}:${event.type}:${windowStart.toISOString()}`;

    // Try to find existing aggregatable activity
    const existing = await db.query.activities.findFirst({
      where: and(
        eq(activities.aggregationKey, aggregationKey),
        eq(activities.isAggregated, true),
        gte(activities.createdAt, windowStart),
      ),
    });

    if (existing) {
      // Update aggregate count and metadata
      const currentItems = (existing.metadata as any)?.items || [];
      await db.update(activities)
        .set({
          aggregateCount: existing.aggregateCount + 1,
          title: `uploaded ${existing.aggregateCount + 1} files`,
          metadata: {
            ...existing.metadata,
            items: [...currentItems, {
              resourceId: event.resourceId,
              resourceName: event.resourceName,
            }].slice(-10), // Keep last 10 items
          },
        })
        .where(eq(activities.id, existing.id));
    } else {
      // Create new aggregate entry
      await db.insert(activities).values({
        orgId: event.orgId,
        actorId: event.actorId,
        actorName: event.actorName,
        actorAvatar: event.actorAvatar,
        type: event.type,
        title: event.title,
        description: event.description,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        resourceName: event.resourceName,
        metadata: {
          ...event.metadata,
          items: [{
            resourceId: event.resourceId,
            resourceName: event.resourceName,
          }],
        },
        aggregationKey,
        isAggregated: true,
        aggregateCount: 1,
      });
    }
  }
}
```

---


## 9. Frontend Components

### Page Structure

```
apps/web/src/
├── app/(dashboard)/
│   └── activity/
│       └── page.tsx                    # Main activity feed page
├── components/
│   └── activity/
│       ├── activity-feed.tsx           # Activity feed container
│       ├── activity-item.tsx           # Single activity entry
│       ├── activity-item-aggregated.tsx # Aggregated activity (expandable)
│       ├── activity-filters.tsx        # Filter controls
│       ├── activity-timeline.tsx       # Timeline view
│       └── activity-widget.tsx         # Dashboard widget
└── hooks/
    └── use-activities.ts               # Query hook
```

### Main Page Component

```tsx
// apps/web/src/app/(dashboard)/activity/page.tsx
'use client';

import { useState } from 'react';
import { ActivityFeed } from '@/components/activity/activity-feed';
import { ActivityFilters } from '@/components/activity/activity-filters';

export default function ActivityPage() {
  const [filters, setFilters] = useState<ActivityFilters>({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activity</h1>
      </div>

      <ActivityFilters filters={filters} onFiltersChange={setFilters} />
      <ActivityFeed filters={filters} />
    </div>
  );
}
```

### Activity Item Component

```tsx
// apps/web/src/components/activity/activity-item.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/date';

interface ActivityItemProps {
  activity: {
    id: string;
    type: string;
    title: string;
    actor: {
      id: string;
      name: string;
      avatar?: string;
    };
    resource?: {
      type: string;
      id: string;
      name: string;
    };
    aggregateCount: number;
    createdAt: string;
  };
}

export function ActivityItem({ activity }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4 py-4 border-b last:border-b-0">
      <Avatar className="h-8 w-8">
        <AvatarImage src={activity.actor.avatar} />
        <AvatarFallback>
          {activity.actor.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.actor.name}</span>
          {' '}
          <span className="text-muted-foreground">{activity.title}</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>

      {activity.resource && (
        <a
          href={`/${activity.resource.type}s/${activity.resource.id}`}
          className="text-sm text-primary hover:underline"
        >
          View
        </a>
      )}
    </div>
  );
}
```

### Dashboard Widget

```tsx
// apps/web/src/components/activity/activity-widget.tsx
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ActivityItem } from './activity-item';
import { useRecentActivities } from '@/hooks/use-activities';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export function ActivityWidget() {
  const { data, isLoading } = useRecentActivities({ limit: 5 });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <Link
          href="/activity"
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        ) : (
          <div className="divide-y">
            {data?.data.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Query Hook

```tsx
// apps/web/src/hooks/use-activities.ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ActivityFilters {
  type?: string;
  actorId?: string;
  resourceType?: string;
  since?: string;
}

export function useActivities(filters: ActivityFilters) {
  return useInfiniteQuery({
    queryKey: ['activities', filters],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        limit: '20',
        ...(pageParam && { cursor: pageParam }),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, v]) => v !== undefined)
        ),
      });
      return api.get(`/activities?${params}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      return lastPage.pagination.hasMore
        ? lastPage.pagination.cursor
        : undefined;
    },
  });
}

export function useRecentActivities(options?: { limit?: number }) {
  return useQuery({
    queryKey: ['activities', 'recent', options?.limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        limit: String(options?.limit || 10),
      });
      return api.get(`/activities/recent?${params}`);
    },
    refetchInterval: 60000, // Refresh every minute
  });
}
```

---


## 10. Tasks

### Backend (apps/api)

#### 10.1 Create Activities Module
- [ ] Create `apps/api/src/activities/activities.module.ts`
- [ ] Register service and controller
- [ ] Import BullMQ module with `activities` queue
- [ ] Export `ActivityService` for use in other modules

#### 10.2 Create Activity Service
- [ ] Create `apps/api/src/activities/activity.service.ts`
- [ ] Implement `create(event)` method (queues to BullMQ)
- [ ] Implement `findAll(orgId, filters)` with cursor pagination
- [ ] Implement `getRecent(orgId, limit)` method

#### 10.3 Create Activities Controller
- [ ] Create `apps/api/src/activities/activities.controller.ts`
- [ ] Implement `GET /activities` endpoint with filters
- [ ] Implement `GET /activities/recent` endpoint
- [ ] No role restriction (all members can access)

#### 10.4 Create DTOs
- [ ] Create `apps/api/src/activities/dto/list-activities.dto.ts` (query params)
- [ ] Create `apps/api/src/activities/dto/activity.dto.ts` (response)

#### 10.5 Add Activity Generation to Existing Services
- [ ] Add activity generation to `OrganizationsService`
- [ ] Add activity generation to `ProjectsService`
- [ ] Add activity generation to `MembersService`
- [ ] Add activity generation to `ApiKeysService`
- [ ] Add activity generation to `WebhooksService`
- [ ] Add activity generation to file upload handlers

### Database (packages/db)

#### 10.6 Create activities Table
- [ ] Create migration file `XXXX_add_activities_table.ts`
- [ ] Add `activities` table schema
- [ ] Add indexes (org_id, created_at, type, actor_id, aggregation_key)
- [ ] Add composite index (org_id, created_at)
- [ ] Apply RLS policies (SELECT, INSERT, UPDATE, DELETE)

#### 10.7 Export Schema
- [ ] Add `activities` to `packages/db/src/schema/index.ts`
- [ ] Add TypeScript types for activity events

### Worker (apps/worker)

#### 10.8 Activity Processing Handler
- [ ] Create `apps/worker/src/handlers/activity.handler.ts`
- [ ] Implement `processSimple()` for non-aggregatable activities
- [ ] Implement `processWithAggregation()` with aggregation logic
- [ ] Add error handling with retries

#### 10.9 Register Queue
- [ ] Add `activities` queue to worker configuration
- [ ] Configure retry policy (3 attempts, exponential backoff)

#### 10.10 Retention Cleanup Job
- [ ] Create scheduled job for activity cleanup
- [ ] Implement 30-day retention policy
- [ ] Run cleanup daily

### Frontend (apps/web)

#### 10.11 Activity Feed Page
- [ ] Create `apps/web/src/app/(dashboard)/activity/page.tsx`
- [ ] Add page to main navigation
- [ ] Implement infinite scroll

#### 10.12 Activity Components
- [ ] Create `activity-feed.tsx` - Main feed container
- [ ] Create `activity-item.tsx` - Single activity entry
- [ ] Create `activity-item-aggregated.tsx` - Expandable aggregated entry
- [ ] Create `activity-filters.tsx` - Filter controls
- [ ] Add loading and empty states

#### 10.13 Dashboard Widget
- [ ] Create `activity-widget.tsx` - Dashboard widget
- [ ] Add widget to dashboard page
- [ ] Implement auto-refresh (every 60 seconds)

#### 10.14 API Integration
- [ ] Create `use-activities.ts` hook with infinite query
- [ ] Create `useRecentActivities.ts` hook for widget
- [ ] Add API client methods for activity endpoints

---

## 11. Test Plan

### Unit Tests

#### Activity Service Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `create()` queues event successfully | Event added to BullMQ queue |
| `create()` handles queue failure gracefully | No exception thrown, error logged |
| `findAll()` returns cursor-paginated results | Correct page size and cursor |
| `findAll()` applies type filter | Only matching type activities returned |
| `findAll()` applies actorId filter | Only matching actor activities returned |
| `findAll()` applies since filter | Only activities after date returned |
| `getRecent()` returns limited results | Correct number of activities |

#### Controller Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `GET /activities` as MEMBER | 200 OK with activities |
| `GET /activities` as OWNER | 200 OK with activities |
| `GET /activities` with invalid cursor | 400 Bad Request |
| `GET /activities/recent` returns limited results | Max 20 activities |
| Activities only from current org | RLS enforced |

#### Worker Handler Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Process simple activity | Activity inserted |
| Process aggregatable activity (first) | New aggregate entry created |
| Process aggregatable activity (subsequent) | Existing entry count updated |
| Process with missing required fields | Job failed, error logged |
| Aggregation window boundary | New entry after 5 minutes |

### Integration Tests

#### End-to-End Activity Flow

| Scenario | Steps | Expected |
|----------|-------|----------|
| Project creation generates activity | Create project via API | Activity entry created |
| Member join generates activity | User joins org | Activity entry created |
| File upload aggregates | Upload 5 files in 2 minutes | Single entry with count 5 |
| Activity visible to all members | Query as MEMBER role | Activities returned |

#### Aggregation Tests

| Scenario | Steps | Expected |
|----------|-------|----------|
| Same user, same type, within window | Upload 3 files in 1 minute | Count = 3 |
| Same user, same type, across window | Upload 1 file, wait 6 min, upload 1 | Two entries |
| Different users, same type | User A and B both upload | Two separate entries |
| Non-aggregatable type | Create 2 projects | Two separate entries |

#### RLS Enforcement Tests

| Scenario | Steps | Expected |
|-----------|-------|----------|
| Cross-org query blocked | Query with wrong org_id | Empty result (RLS blocks) |
| Own org activities accessible | Query with correct org_id | Activities returned |

### E2E Tests (Playwright)

```gherkin
Scenario: View activity feed as org member
  Given I am logged in as an org MEMBER
  When I navigate to the Activity page
  Then I should see recent activities
  And activities should be sorted newest first

Scenario: Filter activities by type
  Given I am on the activity feed page
  When I select "Projects" from the type filter
  Then I should only see project-related activities

Scenario: View aggregated activities
  Given there are 5 file upload activities from the same user
  When I view the activity feed
  Then I should see "uploaded 5 files"
  When I click to expand
  Then I should see the individual file names

Scenario: Dashboard shows recent activity widget
  Given I am on the dashboard
  Then I should see the Recent Activity widget
  And it should show up to 5 activities
  And there should be a "View all" link

Scenario: Infinite scroll loads more activities
  Given there are more than 20 activities
  When I scroll to the bottom of the feed
  Then more activities should load
```

### Performance Tests

| Scenario | Target | Notes |
|----------|--------|-------|
| List 20 activities | < 100ms | With indexes |
| Dashboard widget (10 activities) | < 50ms | Cached query |
| Aggregation check | < 50ms | Index on aggregation_key |
| Cursor pagination | < 100ms | Consistent performance |
| High-volume activity creation | 500 events/min | BullMQ throughput |

---

## 12. Security Considerations

1. **RLS enforcement** – All queries must use `withTenantContext()` for tenant isolation
2. **All members can view** – Unlike audit logs, activity feed is visible to all org members
3. **No sensitive data** – Activity titles should not contain passwords, tokens, or PII
4. **Denormalized names** – Store actor/resource names for display (no joins at query time)
5. **Avatar URLs** – Only store validated avatar URLs from auth provider
6. **Rate limiting** – Consider rate limiting activity creation to prevent spam

---

## 13. Performance Considerations

1. **Async creation** – All activity events queued via BullMQ
2. **Cursor pagination** – Use cursor-based pagination for consistent performance
3. **Indexes** – Composite index on (org_id, created_at) for common query
4. **Aggregation** – Reduces total number of entries in feed
5. **Retention** – 30-day retention keeps table size manageable
6. **Caching** – Dashboard widget can be cached/memoized
7. **Limit payload** – Metadata limited to essential display data

---

## 14. Project Structure

```
apps/api/src/
├── activities/
│   ├── activities.module.ts
│   ├── activities.controller.ts
│   ├── activity.service.ts
│   └── dto/
│       ├── list-activities.dto.ts
│       └── activity.dto.ts

packages/db/src/
├── schema/
│   └── activities.ts
└── migrations/
    └── XXXX_add_activities_table.ts

apps/worker/src/
├── handlers/
│   ├── activity.handler.ts
│   └── activity-cleanup.handler.ts
└── config/
    └── queues.ts  # Add activities queue

apps/web/src/
├── app/(dashboard)/
│   └── activity/
│       └── page.tsx
├── components/
│   └── activity/
│       ├── activity-feed.tsx
│       ├── activity-item.tsx
│       ├── activity-item-aggregated.tsx
│       ├── activity-filters.tsx
│       └── activity-widget.tsx
└── hooks/
    └── use-activities.ts
```

---

## 15. Dependencies

### Backend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/bullmq` | `^10.x` | BullMQ integration (already installed) |

### Frontend Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | `^5.x` | Data fetching (already installed) |
| `date-fns` | `^3.x` | Relative time formatting (already installed) |

---

## 16. Future Enhancements

- **Real-time updates** – WebSocket subscription for live activity updates
- **Notifications** – Push notifications for important activities
- **Mentions** – "@mention" support in activity descriptions
- **Activity reactions** – Allow users to react to activities (like, comment)
- **Customizable feed** – User preferences for activity types to show/hide
- **Activity search** – Full-text search across activity content
- **Team/project filters** – Filter by specific team or project scope
