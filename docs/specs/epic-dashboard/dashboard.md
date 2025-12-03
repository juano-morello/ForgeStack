# Dashboard

**Epic:** Dashboard
**Priority:** Phase 4C
**Depends on:** Authentication, Organization Management, Projects CRUD, Activity Feed, API Keys
**Status:** Draft

---

## Overview

This specification defines the main dashboard functionality in ForgeStack. The dashboard is the primary landing page for authenticated users, providing an overview of their organization's activity, projects, and quick access to common actions.

### Core Capabilities

- **Welcome header** – Personalized greeting with user and organization context
- **Stats overview** – Key metrics at a glance (projects, members, API keys, storage)
- **Recent activity** – Stream of recent actions within the organization
- **Recent projects** – Quick access to most recently updated projects
- **Quick actions** – Common tasks accessible from dashboard
- **Organization health** – Subscription and usage status for owners

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                           │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Dashboard Page (/dashboard)                   ││
│  │  ┌───────────────────────────────────────────────────────────┐  ││
│  │  │  WelcomeHeader                                             │  ││
│  │  │  - Greeting + User Name + Org Name                         │  ││
│  │  │  - Quick Action Buttons                                    │  ││
│  │  └───────────────────────────────────────────────────────────┘  ││
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐  ││
│  │  │ StatCard    │ │ StatCard    │ │ StatCard    │ │ StatCard  │  ││
│  │  │ Projects    │ │ Members     │ │ API Keys    │ │ Storage   │  ││
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘  ││
│  │  ┌────────────────────────┐  ┌────────────────────────────────┐ ││
│  │  │ RecentActivity         │  │ RecentProjects                 │ ││
│  │  │ - Activity feed (5-10) │  │ - Last 3-5 projects            │ ││
│  │  │ - "View All" link      │  │ - "View All" link              │ ││
│  │  └────────────────────────┘  └────────────────────────────────┘ ││
│  │  ┌────────────────────────┐  ┌────────────────────────────────┐ ││
│  │  │ QuickActions           │  │ OrgHealth (OWNER only)         │ ││
│  │  │ - New Project          │  │ - Subscription status          │ ││
│  │  │ - API Keys             │  │ - Usage summary                │ ││
│  │  │ - Webhooks             │  │ - Alerts/warnings              │ ││
│  │  │ - Billing (OWNER)      │  │                                │ ││
│  │  └────────────────────────┘  └────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
                                   │ X-Org-Id Header
                                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         Backend (NestJS)                              │
│  ┌──────────────────────────────────────────────────────────────────┐│
│  │                    DashboardModule                                ││
│  │  ┌─────────────────────┐  ┌─────────────────────────────────┐   ││
│  │  │ DashboardService    │  │ DashboardController             │   ││
│  │  │ - getSummary()      │  │ GET /dashboard/summary          │   ││
│  │  └─────────────────────┘  └─────────────────────────────────┘   ││
│  └──────────────────────────────────────────────────────────────────┘│
│                                                                       │
│  Aggregates from existing services:                                   │
│  - ProjectsService.count()                                            │
│  - MembersService.count()                                             │
│  - ApiKeysService.count()                                             │
│  - UsageService.getStorageUsed() (if file uploads enabled)            │
│  - ActivitiesService.findRecent()                                     │
│  - ProjectsService.findRecent()                                       │
│  - SubscriptionsService.getStatus() (for owners)                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Principles

- **Org-scoped data** – All dashboard data is scoped to the current organization
- **Role-based visibility** – Some sections only visible to OWNER role
- **Performance optimized** – Single endpoint aggregates multiple data sources
- **Responsive design** – Grid on desktop, stacked layout on mobile
- **Progressive loading** – Loading skeletons while data fetches

---

## Acceptance Criteria

### API Endpoints

#### GET /api/v1/dashboard/summary – Get Dashboard Summary

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes (`X-Org-Id` header) |
| Required Role | OWNER or MEMBER |
| Response (200) | See response schema below |

**Response Schema:**
```typescript
{
  // Stats
  stats: {
    projectsCount: number;
    membersCount: number;
    apiKeysCount: number;
    storageUsedBytes: number | null; // null if file uploads disabled
  };
  
  // Recent activity (last 5-10 items)
  recentActivity: {
    items: Activity[];
    totalCount: number;
  };
  
  // Recent projects (last 3-5)
  recentProjects: {
    items: Project[];
    totalCount: number;
  };
  
  // Organization health (only for OWNER role)
  orgHealth?: {
    subscription: {
      plan: string;
      status: 'active' | 'trialing' | 'past_due' | 'canceled';
      currentPeriodEnd: string;
    };
    usage: {
      projectsUsed: number;
      projectsLimit: number;
      membersUsed: number;
      membersLimit: number;
      storageUsedBytes: number;
      storageLimitBytes: number;
    };
    alerts: Array<{
      type: 'warning' | 'error';
      message: string;
    }>;
  };
}
```

**Behavior:**
- Aggregates data from multiple services
- Returns `orgHealth` only if user role is OWNER
- Returns `storageUsedBytes: null` if file uploads feature is disabled
- Limits recentActivity to 10 items max
- Limits recentProjects to 5 items max
- Sorted by most recent first

### Frontend Requirements

#### 1. Dashboard Page (`/dashboard`)

**Layout Requirements:**
- Responsive grid layout (4 columns on desktop, 2 on tablet, 1 on mobile)
- Loading skeletons for all async sections
- Error boundaries for graceful failure handling

**Components:**
- `PageHeader` from `@forgestack/ui` for welcome section
- `StatCard` from `@forgestack/ui` for metrics
- Custom `RecentActivity` and `RecentProjects` widgets

#### 2. Welcome Header Component

| Element | Description |
|---------|-------------|
| Greeting | Dynamic based on time of day ("Good morning/afternoon/evening") |
| User Name | Display authenticated user's name |
| Org Name | Current organization name |
| Quick Actions | "New Project" and "Invite Member" buttons |

#### 3. Stats Overview Component

| Stat Card | Data Source | Icon |
|-----------|-------------|------|
| Projects | `stats.projectsCount` | Folder icon |
| Team Members | `stats.membersCount` | Users icon |
| API Keys | `stats.apiKeysCount` | Key icon |
| Storage Used | `stats.storageUsedBytes` (formatted) | HardDrive icon |

- Storage card hidden if `storageUsedBytes` is null
- Each card links to its respective management page

#### 4. Recent Activity Widget

| Element | Description |
|---------|-------------|
| Activity List | Shows 5-10 most recent activities |
| Activity Item | Icon + description + relative timestamp |
| View All Link | Links to `/activities` page |
| Empty State | "No recent activity" message |

#### 5. Recent Projects Widget

| Element | Description |
|---------|-------------|
| Project Cards | Shows 3-5 most recent projects |
| Project Card | Name + status badge + updated timestamp |
| View All Link | Links to `/projects` page |
| Empty State | "No projects yet" with create button |

#### 6. Quick Actions Panel

| Action | Visible To | Destination |
|--------|------------|-------------|
| Create New Project | All members | `/projects/new` |
| View API Keys | All members | `/settings/api-keys` |
| Manage Webhooks | All members | `/settings/webhooks` |
| View Billing | OWNER only | `/settings/billing` |

#### 7. Organization Health Panel (OWNER only)

| Section | Content |
|---------|---------|
| Subscription Status | Plan name, status badge, renewal date |
| Usage Summary | Progress bars for projects/members/storage limits |
| Alerts | Warning/error messages for issues |

- Hidden entirely for non-OWNER users
- Shows "Upgrade" button if approaching limits

#### 8. Navigation Update

- Update main navigation to show "Dashboard" as primary item
- `/dashboard` should be the default redirect after login
- Update breadcrumbs to start from Dashboard

---

## Tasks & Subtasks

### Backend Tasks

#### 1. Create DashboardModule
- [ ] Create `apps/api/src/dashboard/dashboard.module.ts`
- [ ] Register service and controller
- [ ] Import required dependencies (ProjectsModule, MembersModule, etc.)

#### 2. Create DashboardService
- [ ] Create `apps/api/src/dashboard/dashboard.service.ts`
- [ ] Implement `getSummary(ctx: TenantContext)` method
- [ ] Aggregate stats from existing services:
  - [ ] `ProjectsService.countByOrg(orgId)` for projects count
  - [ ] `MembersService.countByOrg(orgId)` for members count
  - [ ] `ApiKeysService.countByOrg(orgId)` for API keys count
  - [ ] `UsageService.getStorageUsed(orgId)` for storage (optional)
- [ ] Fetch recent data:
  - [ ] `ActivitiesService.findRecent(orgId, limit: 10)` for activities
  - [ ] `ProjectsService.findRecent(orgId, limit: 5)` for projects
- [ ] Fetch org health (for owners only):
  - [ ] `SubscriptionsService.getStatus(orgId)` for subscription
  - [ ] `UsageService.getSummary(orgId)` for usage
  - [ ] Generate alerts based on usage thresholds

#### 3. Create DashboardController
- [ ] Create `apps/api/src/dashboard/dashboard.controller.ts`
- [ ] Implement `GET /dashboard/summary` endpoint
- [ ] Extract tenant context from request
- [ ] Call service and return response

#### 4. Create DTOs
- [ ] Create `apps/api/src/dashboard/dto/dashboard-summary.dto.ts`
- [ ] Define response types with proper serialization

#### 5. Add Count Methods to Existing Services
- [ ] Add `countByOrg(orgId)` to ProjectsService (if not exists)
- [ ] Add `countByOrg(orgId)` to MembersService (if not exists)
- [ ] Add `countByOrg(orgId)` to ApiKeysService (if not exists)
- [ ] Add `findRecent(orgId, limit)` to ProjectsService (if not exists)

### Frontend Tasks

#### 1. Create Dashboard Page
- [ ] Create `apps/web/src/app/(dashboard)/dashboard/page.tsx`
- [ ] Implement responsive grid layout
- [ ] Fetch summary data on mount
- [ ] Handle loading and error states

#### 2. Create useDashboard Hook
- [ ] Create `apps/web/src/hooks/use-dashboard.ts`
- [ ] Fetch dashboard summary from API
- [ ] Return data, loading, error states
- [ ] Implement SWR/React Query for caching and revalidation

#### 3. Create WelcomeHeader Component
- [ ] Create `apps/web/src/components/dashboard/welcome-header.tsx`
- [ ] Dynamic greeting based on time of day
- [ ] Display user name and org name
- [ ] Quick action buttons (New Project, Invite Member)

#### 4. Create StatsOverview Component
- [ ] Create `apps/web/src/components/dashboard/stats-overview.tsx`
- [ ] Use StatCard compound component from `@forgestack/ui`
- [ ] Display 4 stat cards in responsive grid
- [ ] Conditionally hide storage if null

#### 5. Create RecentActivity Widget
- [ ] Create `apps/web/src/components/dashboard/recent-activity.tsx`
- [ ] Render activity list with icons and timestamps
- [ ] "View All" link to `/activities`
- [ ] Empty state component

#### 6. Create RecentProjects Widget
- [ ] Create `apps/web/src/components/dashboard/recent-projects.tsx`
- [ ] Render project cards with status
- [ ] "View All" link to `/projects`
- [ ] Empty state with create button

#### 7. Create QuickActions Panel
- [ ] Create `apps/web/src/components/dashboard/quick-actions.tsx`
- [ ] Grid of action buttons/links
- [ ] Conditionally show billing for OWNER

#### 8. Create OrgHealth Panel
- [ ] Create `apps/web/src/components/dashboard/org-health.tsx`
- [ ] Subscription status section
- [ ] Usage progress bars
- [ ] Alerts list
- [ ] Only render for OWNER role

#### 9. Create Loading Skeletons
- [ ] Create `apps/web/src/components/dashboard/dashboard-skeleton.tsx`
- [ ] Skeleton components for each section
- [ ] Match layout of actual components

#### 10. Update Navigation
- [ ] Update `apps/web/src/components/layout/sidebar.tsx` (or nav component)
- [ ] Add Dashboard as primary nav item
- [ ] Update post-login redirect to `/dashboard`
- [ ] Update breadcrumb root to Dashboard

---

## Test Plan

### Backend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `DashboardService.getSummary()` returns stats | All counts are correct |
| `DashboardService.getSummary()` returns recent activity | Activities sorted by date desc |
| `DashboardService.getSummary()` returns recent projects | Projects sorted by updatedAt desc |
| `DashboardService.getSummary()` returns orgHealth for OWNER | orgHealth present in response |
| `DashboardService.getSummary()` omits orgHealth for MEMBER | orgHealth undefined in response |
| `DashboardService.getSummary()` omits storage when disabled | storageUsedBytes is null |
| `DashboardService.getSummary()` generates usage alerts | Alerts present when thresholds exceeded |

### Backend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| `GET /dashboard/summary` returns 200 with data | Full summary returned |
| `GET /dashboard/summary` without auth returns 401 | Unauthorized error |
| `GET /dashboard/summary` without X-Org-Id returns 400 | Bad request error |
| `GET /dashboard/summary` for non-member org returns 403 | Forbidden error |
| `GET /dashboard/summary` as OWNER includes orgHealth | orgHealth in response |
| `GET /dashboard/summary` as MEMBER excludes orgHealth | No orgHealth field |
| `GET /dashboard/summary` respects RLS | Only org data returned |

### Frontend Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| WelcomeHeader renders greeting with name | User name visible |
| WelcomeHeader shows correct time-based greeting | "Good morning/afternoon/evening" |
| StatsOverview renders all stat cards | 4 cards visible |
| StatsOverview hides storage when null | 3 cards visible |
| RecentActivity renders activity list | All items displayed |
| RecentActivity shows empty state | Empty message when no items |
| RecentProjects renders project cards | All projects displayed |
| QuickActions shows billing for OWNER | Billing button visible |
| QuickActions hides billing for MEMBER | Billing button hidden |
| OrgHealth renders for OWNER | Component visible |
| OrgHealth hidden for MEMBER | Component not rendered |
| Dashboard skeleton renders | All skeleton sections visible |

### Frontend Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Dashboard fetches and displays summary | API called, data rendered |
| Dashboard handles loading state | Skeletons shown while loading |
| Dashboard handles error state | Error message displayed |
| Stats link to correct pages | Navigation works |
| View All links work | Navigate to respective pages |
| Quick actions navigate correctly | Pages open |

### E2E Tests (Playwright)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Dashboard loads after login | Login → Redirect to /dashboard | Dashboard displays |
| Stats show correct counts | Create project → Reload dashboard | Projects count incremented |
| Recent projects show new project | Create project → Check dashboard | New project in list |
| Activity shows in feed | Perform action → Check dashboard | Action in recent activity |
| OWNER sees org health | Login as OWNER → View dashboard | Org health visible |
| MEMBER doesn't see org health | Login as MEMBER → View dashboard | Org health hidden |
| Quick actions work | Click "New Project" | Navigates to create page |
| Responsive layout works | Resize browser | Layout adjusts correctly |

---

## Implementation Notes

### Project Structure

```
apps/api/src/
├── dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts
│   ├── dashboard.service.ts
│   └── dto/
│       └── dashboard-summary.dto.ts
└── ...

apps/web/src/
├── app/
│   └── (dashboard)/
│       └── dashboard/
│           └── page.tsx
├── components/
│   └── dashboard/
│       ├── welcome-header.tsx
│       ├── stats-overview.tsx
│       ├── recent-activity.tsx
│       ├── recent-projects.tsx
│       ├── quick-actions.tsx
│       ├── org-health.tsx
│       └── dashboard-skeleton.tsx
├── hooks/
│   └── use-dashboard.ts
└── ...
```

### Service Implementation Example

```typescript
// apps/api/src/dashboard/dashboard.service.ts
@Injectable()
export class DashboardService {
  constructor(
    private projectsService: ProjectsService,
    private membersService: MembersService,
    private apiKeysService: ApiKeysService,
    private activitiesService: ActivitiesService,
    private usageService: UsageService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async getSummary(ctx: TenantContext): Promise<DashboardSummaryDto> {
    const [
      projectsCount,
      membersCount,
      apiKeysCount,
      storageUsed,
      recentActivity,
      recentProjects,
    ] = await Promise.all([
      this.projectsService.countByOrg(ctx.orgId),
      this.membersService.countByOrg(ctx.orgId),
      this.apiKeysService.countByOrg(ctx.orgId),
      this.usageService.getStorageUsed(ctx.orgId),
      this.activitiesService.findRecent(ctx.orgId, 10),
      this.projectsService.findRecent(ctx.orgId, 5),
    ]);

    const summary: DashboardSummaryDto = {
      stats: {
        projectsCount,
        membersCount,
        apiKeysCount,
        storageUsedBytes: storageUsed,
      },
      recentActivity,
      recentProjects,
    };

    // Only include org health for owners
    if (ctx.role === 'OWNER') {
      const [subscription, usage] = await Promise.all([
        this.subscriptionsService.getStatus(ctx.orgId),
        this.usageService.getSummary(ctx.orgId),
      ]);

      summary.orgHealth = {
        subscription,
        usage,
        alerts: this.generateAlerts(usage),
      };
    }

    return summary;
  }

  private generateAlerts(usage: UsageSummary): Alert[] {
    const alerts: Alert[] = [];

    if (usage.projectsUsed >= usage.projectsLimit * 0.9) {
      alerts.push({
        type: 'warning',
        message: 'Approaching project limit',
      });
    }

    if (usage.membersUsed >= usage.membersLimit) {
      alerts.push({
        type: 'error',
        message: 'Member limit reached',
      });
    }

    return alerts;
  }
}
```

### Frontend Component Example

```typescript
// apps/web/src/components/dashboard/stats-overview.tsx
import { StatCard } from '@forgestack/ui';
import { Folder, Users, Key, HardDrive } from 'lucide-react';
import { formatBytes } from '@/lib/utils';

interface StatsOverviewProps {
  stats: {
    projectsCount: number;
    membersCount: number;
    apiKeysCount: number;
    storageUsedBytes: number | null;
  };
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Projects"
        value={stats.projectsCount}
        icon={<Folder className="h-4 w-4" />}
        href="/projects"
      />
      <StatCard
        title="Team Members"
        value={stats.membersCount}
        icon={<Users className="h-4 w-4" />}
        href="/settings/members"
      />
      <StatCard
        title="API Keys"
        value={stats.apiKeysCount}
        icon={<Key className="h-4 w-4" />}
        href="/settings/api-keys"
      />
      {stats.storageUsedBytes !== null && (
        <StatCard
          title="Storage Used"
          value={formatBytes(stats.storageUsedBytes)}
          icon={<HardDrive className="h-4 w-4" />}
          href="/settings/usage"
        />
      )}
    </div>
  );
}
```

### Time-based Greeting Utility

```typescript
// apps/web/src/lib/greeting.ts
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
```

---

## Security Considerations

1. **Org isolation** – All data scoped to current organization via RLS
2. **Role-based visibility** – orgHealth only returned for OWNER role
3. **Authorization** – TenantContextGuard ensures membership
4. **Data minimization** – Only return necessary fields
5. **Rate limiting** – Apply standard rate limits to endpoint

---

## Dependencies

- **Authentication** – User must be authenticated
- **Organization Management** – Org context required
- **Projects CRUD** – For project counts and recent list
- **Activity Feed** – For recent activities
- **API Keys** – For key counts
- **Billing/Subscriptions** – For org health (if enabled)
- **Usage Service** – For storage and usage metrics
- **@forgestack/ui** – StatCard, PageHeader components

---

## Future Enhancements (Out of Scope for v1)

- Customizable dashboard widgets
- Dashboard widget reordering
- Dashboard widget preferences persistence
- Real-time activity updates via WebSocket
- Dashboard announcements/notifications banner
- Quick search from dashboard
- Pinned/favorite projects widget
- Team activity heatmap
- Analytics charts and graphs

---

*End of spec*

