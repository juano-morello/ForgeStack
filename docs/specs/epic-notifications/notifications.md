# Notifications

**Epic:** Notifications
**Priority:** TBD
**Depends on:** Organizations, better-auth Integration, BullMQ Worker, Resend
**Status:** Draft

---

## 1. Context

### Why Notifications Are Needed

Notifications are essential for:

- **User Awareness** – Keep users informed about important events in their organization
- **Engagement** – Drive users back to the platform with timely, relevant alerts
- **Collaboration** – Notify users when colleagues take actions that affect them
- **Critical Alerts** – Ensure billing issues and security events are communicated promptly

### Business Value

| Benefit | Description |
|---------|-------------|
| User Engagement | Timely notifications keep users connected to the platform |
| Reduced Churn | Alerts about billing issues prevent involuntary cancellations |
| Collaboration | Team members stay informed about project and permission changes |
| User Control | Preference management respects user communication choices |

### Notification Types

1. **In-App Notifications** – Real-time alerts displayed in the notification bell/inbox within the application
2. **Email Notifications** – External notifications sent via Resend for critical or user-preferred events

### Technical Approach

- **Event-driven architecture** – Services emit notification events after successful operations
- **User-scoped RLS** – Notifications are scoped to `user_id` (not org_id) for privacy
- **Preference-aware** – Check user preferences before sending each notification type
- **Async processing** – Email notifications queued via BullMQ to avoid blocking
- **Resend integration** – Email delivery via Resend with templates and unsubscribe support

---

## 2. User Stories

### US-1: Receive In-App Notifications

**As a** user,
**I want to** receive in-app notifications for important events,
**So that** I stay informed about activity in my organizations without leaving the app.

### US-2: View Unread Notification Count

**As a** user,
**I want to** see how many unread notifications I have,
**So that** I can quickly identify when new activity requires my attention.

### US-3: Mark Notifications as Read

**As a** user,
**I want to** mark notifications as read (individually or all at once),
**So that** I can manage my notification inbox and clear acknowledged items.

### US-4: Configure Notification Preferences

**As a** user,
**I want to** configure my notification preferences per notification type,
**So that** I only receive notifications through channels I prefer.

### US-5: Receive Email Notifications

**As a** user,
**I want to** receive email notifications for critical events,
**So that** I'm alerted even when I'm not actively using the application.

### US-6: Unsubscribe from Email Notifications

**As a** user,
**I want to** unsubscribe from email notifications via a link in the email,
**So that** I can opt out without logging into the application.

---

## 3. Acceptance Criteria

### US-1: Receive In-App Notifications

- [ ] Notification bell icon visible in header/navigation
- [ ] Bell shows badge with unread count when > 0
- [ ] Clicking bell opens notification dropdown/panel
- [ ] Each notification shows: title, body, timestamp, optional link
- [ ] Notifications sorted by newest first
- [ ] Clicking a notification with a link navigates to that destination
- [ ] Only the user's own notifications are visible (RLS on user_id)

### US-2: View Unread Notification Count

- [ ] Unread count displayed as badge on notification bell
- [ ] Count updates in real-time (or on page focus/navigation)
- [ ] Count shows "99+" if more than 99 unread notifications
- [ ] Count is 0 and badge hidden when all notifications are read

### US-3: Mark Notifications as Read

- [ ] Individual notification can be marked as read (click or explicit action)
- [ ] "Mark all as read" button clears all unread notifications
- [ ] Read notifications show visual distinction from unread
- [ ] Read status persists across sessions
- [ ] Navigating to notification link automatically marks it as read

### US-4: Configure Notification Preferences

- [ ] Preferences page accessible from user settings
- [ ] Each notification type can be toggled for in-app and email independently
- [ ] Default preferences applied for new notification types
- [ ] Changes saved immediately with feedback
- [ ] Preferences are per-user (across all organizations)

### US-5: Receive Email Notifications

- [ ] Critical notifications (billing, role changes) send email by default
- [ ] Email only sent if user's email preference allows it
- [ ] Email includes notification title, body, and action link
- [ ] Email includes organization context where relevant
- [ ] Emails use branded templates via Resend
- [ ] email_sent flag tracked on notification record

### US-6: Unsubscribe from Email Notifications

- [ ] Every email includes "Unsubscribe" link in footer
- [ ] Unsubscribe link is signed to prevent tampering
- [ ] Clicking unsubscribe disables email for that notification type
- [ ] Unsubscribe page confirms the action
- [ ] User can re-enable via preferences page

---

## 4. Database Schema

### 4.1 notifications Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default random | Unique identifier |
| `user_id` | `uuid` | NOT NULL, FK → users | Target user (RLS key) |
| `org_id` | `uuid` | NOT NULL, FK → organizations | Organization context |
| `type` | `text` | NOT NULL | Notification type (e.g., 'member.invited') |
| `title` | `text` | NOT NULL | Notification title |
| `body` | `text` | NOT NULL | Notification body/message |
| `link` | `text` | NULLABLE | Optional navigation URL |
| `metadata` | `jsonb` | NULLABLE | Additional context data |
| `read_at` | `timestamp with time zone` | NULLABLE | When marked as read (null = unread) |
| `email_sent` | `boolean` | NOT NULL, default false | Whether email was sent |
| `created_at` | `timestamp with time zone` | NOT NULL, default now() | Creation timestamp |

### Schema Definition (Drizzle)

```typescript
// packages/db/src/schema/notifications.ts
import { pgTable, uuid, text, jsonb, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { organizations } from './organizations';

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  link: text('link'),
  metadata: jsonb('metadata'),
  readAt: timestamp('read_at', { withTimezone: true }),
  emailSent: boolean('email_sent').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('notifications_user_id_idx').on(table.userId),
  orgIdIdx: index('notifications_org_id_idx').on(table.orgId),
  readAtIdx: index('notifications_read_at_idx').on(table.readAt),
  createdAtIdx: index('notifications_created_at_idx').on(table.createdAt),
  // Composite index for efficient unread queries
  userUnreadIdx: index('notifications_user_unread_idx').on(table.userId, table.readAt),
}));
```

### RLS Policy

```sql
-- Notifications are user-scoped, not org-scoped
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY notifications_user_isolation ON notifications
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid);
```

### 4.2 notification_preferences Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, default random | Unique identifier |
| `user_id` | `uuid` | NOT NULL, FK → users | User who owns the preference |
| `type` | `text` | NOT NULL | Notification type |
| `in_app_enabled` | `boolean` | NOT NULL, default true | Enable in-app notifications |
| `email_enabled` | `boolean` | NOT NULL, default true | Enable email notifications |
| `created_at` | `timestamp with time zone` | NOT NULL, default now() | Creation timestamp |
| `updated_at` | `timestamp with time zone` | NOT NULL, default now() | Last update timestamp |

### Schema Definition (Drizzle)

```typescript
// packages/db/src/schema/notification-preferences.ts
import { pgTable, uuid, text, boolean, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  inAppEnabled: boolean('in_app_enabled').notNull().default(true),
  emailEnabled: boolean('email_enabled').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Unique constraint: one preference per user per type
  userTypeIdx: uniqueIndex('notification_preferences_user_type_idx').on(table.userId, table.type),
}));
```

### RLS Policy

```sql
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY notification_preferences_user_isolation ON notification_preferences
  FOR ALL
  USING (user_id = current_setting('app.current_user_id')::uuid);
```

---

## 5. Notification Types

### High Priority (email + in-app by default)

| Type | Title Template | Body Template | Link |
|------|----------------|---------------|------|
| `member.invited` | You've been invited | You've been invited to join {orgName} | /invitations |
| `member.role_changed` | Role Updated | Your role in {orgName} has been changed to {role} | /organizations/{orgId}/settings |
| `billing.payment_failed` | Payment Failed | Payment failed for {orgName}. Please update your payment method. | /organizations/{orgId}/settings/billing |
| `billing.subscription_cancelled` | Subscription Cancelled | Your subscription for {orgName} has been cancelled | /organizations/{orgId}/settings/billing |

### Medium Priority (in-app by default, email optional)

| Type | Title Template | Body Template | Link |
|------|----------------|---------------|------|
| `project.shared` | Project Shared | {actorName} shared project "{projectName}" with you | /projects/{projectId} |
| `file.shared` | File Shared | {actorName} shared a file with you | /files/{fileId} |
| `webhook.failed` | Webhook Failed | Webhook delivery to {endpointUrl} failed after retries | /webhooks/{webhookId} |

### Low Priority (in-app only by default)

| Type | Title Template | Body Template | Link |
|------|----------------|---------------|------|
| `member.joined` | New Member | {actorName} joined {orgName} | /organizations/{orgId}/members |
| `project.created` | New Project | {actorName} created project "{projectName}" | /projects/{projectId} |

---

## 6. API Endpoints

### 6.1 GET /api/v1/notifications – List User's Notifications

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Request Params | `page`, `limit`, `unread_only` (optional boolean) |
| Response (200) | `{ data: Notification[], pagination: {...} }` |

### 6.2 GET /api/v1/notifications/unread-count – Get Unread Count

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Response (200) | `{ count: number }` |

### 6.3 PATCH /api/v1/notifications/:id/read – Mark as Read

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Response (200) | `{ success: true }` |
| Response (404) | Notification not found |

### 6.4 PATCH /api/v1/notifications/read-all – Mark All as Read

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Response (200) | `{ success: true, count: number }` |

### 6.5 DELETE /api/v1/notifications/:id – Delete Notification

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Response (200) | `{ success: true }` |
| Response (404) | Notification not found |

### 6.6 GET /api/v1/notifications/preferences – Get Preferences

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Response (200) | `{ preferences: NotificationPreference[] }` |

### 6.7 PATCH /api/v1/notifications/preferences – Update Preferences

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Request Body | `{ type: string, inAppEnabled?: boolean, emailEnabled?: boolean }` |
| Response (200) | `{ preference: NotificationPreference }` |

### 6.8 GET /api/v1/notifications/unsubscribe – Email Unsubscribe

| Property | Value |
|----------|-------|
| Auth Required | **No** (uses signed token) |
| Request Params | `token` (signed JWT with userId and type) |
| Response (200) | HTML page confirming unsubscribe |
| Response (400) | Invalid or expired token |

---

## 7. Notification Service

### Service Interface

```typescript
// apps/api/src/notifications/notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface SendNotificationDto {
  userId: string;
  orgId: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications') private notificationQueue: Queue,
  ) {}

  /**
   * Send a notification to a user.
   * Checks preferences and queues in-app and/or email notifications.
   */
  async send(dto: SendNotificationDto): Promise<void> {
    try {
      await this.notificationQueue.add('send-notification', dto, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: 100,
        removeOnFail: 1000,
      });
    } catch (error) {
      this.logger.error('Failed to queue notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dto,
      });
    }
  }
}
```

### Usage in Other Services

```typescript
// Example: MembersService
@Injectable()
export class MembersService {
  constructor(
    private readonly notificationsService: NotificationsService,
  ) {}

  async updateRole(ctx: TenantContext, memberId: string, newRole: string): Promise<void> {
    // ... update role logic ...

    // Notify the affected member
    await this.notificationsService.send({
      userId: member.userId,
      orgId: ctx.orgId,
      type: 'member.role_changed',
      title: 'Role Updated',
      body: `Your role in ${org.name} has been changed to ${newRole}`,
      link: `/organizations/${ctx.orgId}/settings`,
      metadata: { previousRole: member.role, newRole },
    });
  }
}
```

---

## 8. Email Integration (Resend)

### Email Service

```typescript
// apps/api/src/notifications/email.service.ts
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendNotificationEmail(
    to: string,
    subject: string,
    body: string,
    link?: string,
    unsubscribeToken?: string,
  ): Promise<boolean> {
    const unsubscribeUrl = `${process.env.APP_URL}/api/v1/notifications/unsubscribe?token=${unsubscribeToken}`;

    const { error } = await this.resend.emails.send({
      from: 'ForgeStack <notifications@forgestack.io>',
      to,
      subject,
      html: this.renderTemplate({ body, link, unsubscribeUrl }),
    });

    return !error;
  }

  private renderTemplate(data: { body: string; link?: string; unsubscribeUrl: string }): string {
    // Use React Email templates or HTML template
    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>ForgeStack Notification</h2>
        <p>${data.body}</p>
        ${data.link ? `<p><a href="${data.link}">View Details</a></p>` : ''}
        <hr />
        <p style="font-size: 12px; color: #666;">
          <a href="${data.unsubscribeUrl}">Unsubscribe from these emails</a>
        </p>
      </div>
    `;
  }
}
```

### Email Templates (using React Email)

| Template | Subject | Purpose |
|----------|---------|---------|
| `invitation.tsx` | You've been invited to join {orgName} | Member invitation |
| `role-change.tsx` | Your role in {orgName} has been updated | Role change notification |
| `payment-failed.tsx` | Action required: Payment failed | Billing alert |
| `general-notification.tsx` | {title} | Generic notification template |

### Unsubscribe Token

```typescript
// Generate signed unsubscribe token
const token = jwt.sign(
  { userId, type: notificationType },
  process.env.JWT_SECRET,
  { expiresIn: '30d' }
);
```

---

## 9. Frontend Components

### Component Structure

```
apps/web/src/
├── app/(dashboard)/
│   └── settings/
│       └── notifications/
│           └── page.tsx              # Notification preferences page
├── components/
│   └── notifications/
│       ├── notification-bell.tsx     # Bell icon with badge
│       ├── notification-dropdown.tsx # Dropdown panel
│       ├── notification-item.tsx     # Single notification
│       ├── notifications-list.tsx    # Full list page/component
│       └── notification-preferences.tsx # Settings component
└── hooks/
    ├── use-notifications.ts          # Query notifications
    ├── use-unread-count.ts           # Query unread count
    └── use-notification-preferences.ts # Query/mutate preferences
```

### NotificationBell Component

```tsx
// apps/web/src/components/notifications/notification-bell.tsx
'use client';

import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/hooks/use-unread-count';
import { NotificationDropdown } from './notification-dropdown';

export function NotificationBell() {
  const { data: unreadCount } = useUnreadCount();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <NotificationDropdown onClose={() => setIsOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
```

### Query Hooks

```tsx
// apps/web/src/hooks/use-notifications.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam = 1 }) => {
      return api.get(`/notifications?page=${pageParam}&limit=20`);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.page < lastPage.pagination.totalPages) {
        return lastPage.pagination.page + 1;
      }
      return undefined;
    },
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      api.patch(`/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}
```


---

## 10. Tasks

### Backend (apps/api)

#### 10.1 Create Notifications Module
- [ ] Create `apps/api/src/notifications/notifications.module.ts`
- [ ] Register NotificationsService, NotificationsController
- [ ] Import BullMQ module with `notifications` queue
- [ ] Export NotificationsService for use in other modules

#### 10.2 Create Notifications Service
- [ ] Create `apps/api/src/notifications/notifications.service.ts`
- [ ] Implement `send(dto)` method (queues notification)
- [ ] Implement `findAll(userId, filters)` with pagination
- [ ] Implement `getUnreadCount(userId)` method
- [ ] Implement `markAsRead(userId, notificationId)` method
- [ ] Implement `markAllAsRead(userId)` method
- [ ] Implement `delete(userId, notificationId)` method

#### 10.3 Create Preferences Service
- [ ] Create `apps/api/src/notifications/preferences.service.ts`
- [ ] Implement `getPreferences(userId)` method
- [ ] Implement `updatePreference(userId, type, settings)` method
- [ ] Implement `getPreferenceForType(userId, type)` method
- [ ] Return defaults if no preference record exists

#### 10.4 Create Email Service
- [ ] Create `apps/api/src/notifications/email.service.ts`
- [ ] Initialize Resend client with `RESEND_API_KEY`
- [ ] Implement `sendNotificationEmail()` method
- [ ] Implement email templates (React Email or HTML)
- [ ] Generate signed unsubscribe tokens

#### 10.5 Create Notifications Controller
- [ ] Create `apps/api/src/notifications/notifications.controller.ts`
- [ ] Implement `GET /notifications` endpoint
- [ ] Implement `GET /notifications/unread-count` endpoint
- [ ] Implement `PATCH /notifications/:id/read` endpoint
- [ ] Implement `PATCH /notifications/read-all` endpoint
- [ ] Implement `DELETE /notifications/:id` endpoint
- [ ] Implement `GET /notifications/preferences` endpoint
- [ ] Implement `PATCH /notifications/preferences` endpoint
- [ ] Implement `GET /notifications/unsubscribe` endpoint (public, signed token)

#### 10.6 Create DTOs
- [ ] Create `list-notifications.dto.ts` (query params)
- [ ] Create `notification.dto.ts` (response)
- [ ] Create `update-preference.dto.ts` (request body)
- [ ] Create `preference.dto.ts` (response)

#### 10.7 Add Notification Triggers
- [ ] Add notification to `MembersService.invite()` → `member.invited`
- [ ] Add notification to `MembersService.updateRole()` → `member.role_changed`
- [ ] Add notification to `BillingService` → `billing.payment_failed`, `billing.subscription_cancelled`
- [ ] Add notification to `ProjectsService.share()` → `project.shared`
- [ ] Add notification to `WebhooksService` → `webhook.failed`

### Database (packages/db)

#### 10.8 Create notifications Table
- [ ] Create migration file `XXXX_add_notifications_table.ts`
- [ ] Add `notifications` table schema
- [ ] Add indexes (user_id, read_at, created_at, org_id)
- [ ] Add composite index (user_id, read_at)
- [ ] Apply RLS policy (user-scoped)

#### 10.9 Create notification_preferences Table
- [ ] Create migration for `notification_preferences` table
- [ ] Add unique constraint on (user_id, type)
- [ ] Apply RLS policy (user-scoped)

#### 10.10 Export Schema
- [ ] Add `notifications` to `packages/db/src/schema/index.ts`
- [ ] Add `notificationPreferences` to schema exports

### Worker (apps/worker)

#### 10.11 Notification Handler
- [ ] Create `apps/worker/src/handlers/notification.handler.ts`
- [ ] Fetch user's preferences for notification type
- [ ] Create in-app notification if `inAppEnabled`
- [ ] Queue email job if `emailEnabled`
- [ ] Handle errors gracefully

#### 10.12 Email Notification Handler
- [ ] Create `apps/worker/src/handlers/email-notification.handler.ts`
- [ ] Fetch user email from database
- [ ] Send email via Resend
- [ ] Update `email_sent` flag on notification record
- [ ] Handle delivery failures with retry

#### 10.13 Register Queues
- [ ] Add `notifications` queue to worker configuration
- [ ] Add `email-notifications` queue to worker configuration
- [ ] Configure retry policies

### Frontend (apps/web)

#### 10.14 Notification Bell Component
- [ ] Create `notification-bell.tsx` with badge
- [ ] Create `notification-dropdown.tsx` with quick view
- [ ] Add to header/navigation layout

#### 10.15 Notifications Page (Optional)
- [ ] Create `apps/web/src/app/(dashboard)/notifications/page.tsx`
- [ ] Full list view with pagination
- [ ] Mark as read / delete actions

#### 10.16 Notification Preferences Page
- [ ] Create `apps/web/src/app/(dashboard)/settings/notifications/page.tsx`
- [ ] List all notification types with toggles
- [ ] In-app and email toggle for each type
- [ ] Save on change with feedback

#### 10.17 API Hooks
- [ ] Create `use-notifications.ts` hook
- [ ] Create `use-unread-count.ts` hook
- [ ] Create `use-notification-preferences.ts` hook
- [ ] Create mutation hooks for mark read, update preferences

---

## 11. Test Plan

### Unit Tests

#### Notifications Service Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `send()` queues notification event | Event added to BullMQ queue |
| `send()` handles queue failure gracefully | No exception thrown, error logged |
| `findAll()` returns paginated results | Correct page size and total count |
| `findAll()` with unread_only filter | Only unread notifications returned |
| `getUnreadCount()` returns correct count | Accurate count of unread |
| `markAsRead()` updates read_at timestamp | Notification marked as read |
| `markAllAsRead()` marks all for user | All user's notifications marked |
| `delete()` removes notification | Notification deleted |

#### Preferences Service Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `getPreferences()` returns user preferences | All preferences returned |
| `getPreferences()` with no records | Default preferences returned |
| `updatePreference()` creates new record | Preference created |
| `updatePreference()` updates existing | Preference updated |
| `getPreferenceForType()` returns settings | Correct in_app/email flags |

#### Email Service Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `sendNotificationEmail()` calls Resend | Email sent successfully |
| `sendNotificationEmail()` handles failure | Returns false, error logged |
| Unsubscribe token generation | Valid signed JWT |
| Unsubscribe token verification | Correctly parsed userId and type |

### Integration Tests

#### API Endpoint Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `GET /notifications` returns user's notifications | Only user's notifications |
| `GET /notifications` with pagination | Correct page returned |
| `GET /notifications/unread-count` | Correct count |
| `PATCH /notifications/:id/read` own notification | 200, marked as read |
| `PATCH /notifications/:id/read` other user's | 404 (RLS blocks) |
| `PATCH /notifications/read-all` | All marked, count returned |
| `DELETE /notifications/:id` own | 200, deleted |
| `GET /notifications/preferences` | User's preferences |
| `PATCH /notifications/preferences` | Preference updated |
| `GET /notifications/unsubscribe` valid token | 200, preference disabled |
| `GET /notifications/unsubscribe` invalid token | 400 |

#### RLS Enforcement Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Query notifications as user A | Only user A's notifications |
| Query notifications as user B | Only user B's notifications |
| Cross-user notification access blocked | Empty result or 404 |
| Preferences isolated per user | Only own preferences visible |

### Worker Handler Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Process notification with in_app enabled | Notification created |
| Process notification with in_app disabled | No notification created |
| Process notification with email enabled | Email job queued |
| Process notification with email disabled | No email job queued |
| Email handler sends successfully | email_sent = true |
| Email handler failure | Retried, then logged |

### E2E Tests (Playwright)

```gherkin
Scenario: View notifications in bell dropdown
  Given I am logged in as a user
  And I have unread notifications
  When I click the notification bell
  Then I should see my recent notifications
  And unread notifications should be highlighted

Scenario: Mark notification as read
  Given I am on the notification dropdown
  When I click on an unread notification
  Then the notification should be marked as read
  And the unread count should decrease

Scenario: Mark all as read
  Given I have multiple unread notifications
  When I click "Mark all as read"
  Then all notifications should be marked as read
  And the badge should disappear

Scenario: Update notification preferences
  Given I am on the notification preferences page
  When I toggle off email for "member.invited"
  Then the preference should be saved
  And I should see a success message

Scenario: Unsubscribe via email link
  Given I receive a notification email
  When I click the unsubscribe link
  Then I should see a confirmation page
  And email should be disabled for that notification type
```

---

## 12. Security Considerations

1. **User-scoped RLS** – Notifications use `user_id` not `org_id` for RLS; users can only see their own notifications
2. **Signed unsubscribe tokens** – Unsubscribe links use signed JWTs to prevent tampering
3. **Token expiration** – Unsubscribe tokens expire after 30 days
4. **Rate limiting** – Rate limit notification creation to prevent spam
5. **No sensitive data in notifications** – Avoid including passwords, tokens, or PII in notification body
6. **Email verification** – Only send emails to verified email addresses
7. **withTenantContext still required** – Even though RLS is user-scoped, use proper context for queries

---

## 13. Performance Considerations

1. **Indexes** – Composite index on (user_id, read_at) for efficient unread queries
2. **Unread count caching** – Consider caching unread count with short TTL
3. **Batch email sending** – Queue emails individually but process in batches
4. **Notification cleanup** – Delete notifications older than 30 days via scheduled job
5. **Pagination required** – All list endpoints must support pagination
6. **Async processing** – All email sending is async via BullMQ
7. **Efficient queries** – Use cursor-based pagination for large notification lists

---

## 14. Project Structure

```
apps/api/src/
├── notifications/
│   ├── notifications.module.ts
│   ├── notifications.controller.ts
│   ├── notifications.service.ts
│   ├── preferences.service.ts
│   ├── email.service.ts
│   └── dto/
│       ├── list-notifications.dto.ts
│       ├── notification.dto.ts
│       ├── update-preference.dto.ts
│       └── preference.dto.ts

packages/db/src/
├── schema/
│   ├── notifications.ts
│   └── notification-preferences.ts
└── migrations/
    └── XXXX_add_notifications_tables.ts

apps/worker/src/
├── handlers/
│   ├── notification.handler.ts
│   └── email-notification.handler.ts
└── config/
    └── queues.ts  # Add notifications, email-notifications queues

apps/web/src/
├── app/(dashboard)/
│   ├── notifications/
│   │   └── page.tsx              # Full notifications list (optional)
│   └── settings/
│       └── notifications/
│           └── page.tsx          # Preferences page
├── components/
│   └── notifications/
│       ├── notification-bell.tsx
│       ├── notification-dropdown.tsx
│       ├── notification-item.tsx
│       ├── notifications-list.tsx
│       └── notification-preferences.tsx
└── hooks/
    ├── use-notifications.ts
    ├── use-unread-count.ts
    └── use-notification-preferences.ts
```

---

## 15. Dependencies

### Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `resend` | `^3.x` | Email delivery API |
| `@nestjs/bullmq` | `^10.x` | BullMQ integration (already installed) |
| `jsonwebtoken` | `^9.x` | Unsubscribe token signing |

### Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | `^5.x` | Data fetching (already installed) |
| `lucide-react` | `^0.x` | Icons (already installed) |

---

## 16. Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `RESEND_API_KEY` | Resend API key for email delivery | Yes |
| `APP_URL` | Base URL for email links and unsubscribe | Yes |
| `JWT_SECRET` | Secret for signing unsubscribe tokens | Yes (existing) |

---

## 17. Future Enhancements (Out of Scope)

- **Real-time updates** – WebSocket/SSE for instant notification delivery
- **Push notifications** – Mobile push via FCM/APNs
- **Notification digest** – Daily/weekly email digest option
- **Rich notifications** – Support for images, buttons, expandable content
- **Notification center page** – Full-page notification history
- **Snooze notifications** – Temporarily mute specific types
- **Do not disturb** – Global quiet hours setting
- **Read receipts** – Track when emails are opened
- **Bulk actions** – Select and delete/archive multiple notifications
- **Search** – Search through notification history

---

*End of spec*

