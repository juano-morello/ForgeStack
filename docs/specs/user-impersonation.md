# User Impersonation

**Epic:** Platform Administration  
**Priority:** P2  
**Depends on:** Super-Admin Dashboard, better-auth integration, Platform Audit Logs  
**Status:** Draft

---

## Overview

Allow super admins to impersonate any user in the system for debugging and customer support purposes. This feature enables platform operators to see exactly what a user sees, reproduce issues, and provide better support without requiring screen sharing or password access.

### Key Components
- Impersonation session management (separate from regular sessions)
- Backend API for starting/ending impersonation
- Frontend impersonation banner with exit capability
- Full audit trail for compliance
- Security restrictions (cannot impersonate other super admins)
- RLS integration (use impersonated user's context)

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SUPER-ADMIN DASHBOARD                                │
│                                                                             │
│   [User List] → [View User] → [Impersonate Button]                         │
│                                                                             │
└─────────────────────────────────────────────┬───────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      IMPERSONATION API FLOW                                  │
│                                                                             │
│   POST /admin/impersonate/:userId                                           │
│   ├── Verify super-admin access                                             │
│   ├── Verify target is NOT a super-admin                                    │
│   ├── Create impersonation session (separate cookie)                        │
│   ├── Log to platform_audit_logs                                            │
│   └── Return impersonation token                                            │
│                                                                             │
│   POST /admin/impersonate/end                                               │
│   ├── Verify active impersonation session                                   │
│   ├── Clear impersonation cookie                                            │
│   ├── Log end of impersonation                                              │
│   └── Redirect to admin dashboard                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      IMPERSONATED USER VIEW                                  │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  ⚠️ IMPERSONATION BANNER                                           │   │
│   │  You are viewing as: john@example.com | [End Impersonation]         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   [Normal user dashboard - all actions visible but restricted]              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Acceptance Criteria

### Authentication & Authorization
- [ ] Only users with `isSuperAdmin: true` can initiate impersonation
- [ ] Cannot impersonate another super-admin user
- [ ] Cannot impersonate suspended users
- [ ] Impersonation sessions are separate from regular sessions
- [ ] Original super-admin session remains valid during impersonation
- [ ] Impersonation sessions have a maximum duration (default: 1 hour)

### Session Management
- [ ] Impersonation uses a separate cookie (`better-auth.impersonation_token`)
- [ ] TenantContextGuard detects impersonation and uses impersonated user's context
- [ ] Session includes both `originalUserId` (super-admin) and `impersonatedUserId`
- [ ] Impersonation session can be ended at any time
- [ ] Session expires automatically after time limit
- [ ] All active impersonation sessions can be viewed in admin dashboard

### Security Restrictions
- [ ] Cannot change password while impersonating
- [ ] Cannot enable/disable MFA while impersonating
- [ ] Cannot change email while impersonating
- [ ] Cannot access billing/payment methods while impersonating
- [ ] Cannot delete account while impersonating
- [ ] Cannot modify security settings while impersonating
- [ ] Cannot create/modify API keys while impersonating

### Audit Logging
- [ ] Log impersonation start: who, whom, when, IP address
- [ ] Log impersonation end: duration, actions count
- [ ] Log all actions during impersonation with `isImpersonated: true` flag
- [ ] Logs are immutable and stored in `platform_audit_logs`
- [ ] Audit logs show both original actor (super-admin) and impersonated user

### Frontend Experience
- [ ] Clear visual indicator (banner) when impersonating
- [ ] Banner shows impersonated user's email/name
- [ ] One-click "End Impersonation" button in banner
- [ ] Banner is sticky and always visible
- [ ] Restricted actions show tooltip explaining restriction
- [ ] Color scheme change to indicate impersonation mode

### RLS Integration
- [ ] Impersonation uses impersonated user's org memberships
- [ ] RLS policies enforce impersonated user's access
- [ ] Super-admin permissions do NOT apply during impersonation
- [ ] Can switch between impersonated user's organizations

---

## Tasks & Subtasks

### 1. Backend Tasks

#### 1.1 Database Schema
- [ ] Create `impersonation_sessions` table with migration
- [ ] Add indexes for `actorId`, `targetUserId`, `expiresAt`
- [ ] Add `isImpersonated` and `impersonatedBy` to audit log events

#### 1.2 Impersonation Service
- [ ] Create `ImpersonationService` with start/end methods
- [ ] Implement session token generation (UUID-based)
- [ ] Add session validation and expiry logic
- [ ] Implement restricted action checks

#### 1.3 Impersonation Controller
- [ ] Create `POST /admin/impersonate/:userId` endpoint
- [ ] Create `POST /admin/impersonate/end` endpoint
- [ ] Create `GET /admin/impersonate/session` endpoint (current status)
- [ ] Create `GET /admin/impersonate/active` endpoint (list active sessions)

#### 1.4 Guard/Middleware Updates
- [ ] Update `TenantContextGuard` to detect impersonation cookie
- [ ] Create `ImpersonationRestrictedGuard` for sensitive endpoints
- [ ] Add `@ImpersonationRestricted()` decorator

#### 1.5 Audit Integration
- [ ] Log impersonation events to `platform_audit_logs`
- [ ] Add `impersonatedBy` field to action context
- [ ] Track action count during impersonation session

### 2. Frontend Tasks

#### 2.1 Impersonation Banner
- [ ] Create `ImpersonationBanner` component
- [ ] Add sticky positioning at top of viewport
- [ ] Style with warning colors (orange/yellow theme)
- [ ] Add "End Impersonation" button
- [ ] Display impersonated user info

#### 2.2 Admin Dashboard Integration
- [ ] Add "Impersonate" button to user detail page
- [ ] Add confirmation dialog before impersonating
- [ ] Add "Active Impersonations" section to admin dashboard
- [ ] Add ability to force-end other admin's impersonation sessions

#### 2.3 Auth Context Updates
- [ ] Update `useSession` hook to expose impersonation state
- [ ] Create `useImpersonation` hook
- [ ] Add impersonation context provider
- [ ] Handle restricted action UI states

#### 2.4 Restricted Action UI
- [ ] Disable restricted buttons during impersonation
- [ ] Add tooltips explaining restrictions
- [ ] Hide sensitive actions (password change, MFA, etc.)

### 3. Worker Tasks

#### 3.1 Session Cleanup
- [ ] Add job to clean up expired impersonation sessions
- [ ] Run every 15 minutes
- [ ] Log session expirations

### 4. Testing Tasks

#### 4.1 Backend Tests
- [ ] Unit tests for `ImpersonationService`
- [ ] Unit tests for `ImpersonationRestrictedGuard`
- [ ] Integration tests for impersonation endpoints
- [ ] Test RLS context switching during impersonation

#### 4.2 Frontend Tests
- [ ] Storybook stories for `ImpersonationBanner`
- [ ] Unit tests for `useImpersonation` hook
- [ ] Component tests for restricted action states

#### 4.3 E2E Tests
- [ ] Test full impersonation flow (start → navigate → end)
- [ ] Test restricted action blocking
- [ ] Test audit log generation
- [ ] Test session expiry handling

---

## Test Plan

### Unit Tests
- [ ] `ImpersonationService.start()` creates valid session
- [ ] `ImpersonationService.start()` rejects impersonating super-admin
- [ ] `ImpersonationService.start()` rejects impersonating suspended user
- [ ] `ImpersonationService.end()` clears session and logs duration
- [ ] `ImpersonationRestrictedGuard` blocks restricted endpoints
- [ ] `TenantContextGuard` correctly uses impersonated user context

### Integration Tests
- [ ] `POST /admin/impersonate/:userId` returns session token
- [ ] `POST /admin/impersonate/:userId` with super-admin target returns 403
- [ ] `POST /admin/impersonate/end` clears impersonation
- [ ] Impersonated requests use target user's org memberships
- [ ] Restricted endpoints return 403 during impersonation
- [ ] Audit logs contain impersonation metadata

### E2E Tests
- [ ] Super-admin can impersonate regular user
- [ ] Impersonation banner displays correctly
- [ ] "End Impersonation" returns to admin dashboard
- [ ] Cannot access password change while impersonating
- [ ] Session expires after time limit
- [ ] Audit log shows complete impersonation trail

---

## API Reference

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/impersonate/:userId` | Start impersonating a user |
| POST | `/admin/impersonate/end` | End current impersonation session |
| GET | `/admin/impersonate/session` | Get current impersonation status |
| GET | `/admin/impersonate/active` | List all active impersonation sessions |
| DELETE | `/admin/impersonate/:sessionId` | Force-end an impersonation session |

### Request/Response Examples

```json
// POST /admin/impersonate/:userId
// Request: No body required

// Response (200):
{
  "success": true,
  "impersonation": {
    "sessionId": "uuid",
    "targetUser": {
      "id": "user-uuid",
      "email": "john@example.com",
      "name": "John Doe"
    },
    "expiresAt": "2024-01-15T11:00:00Z",
    "startedAt": "2024-01-15T10:00:00Z"
  }
}

// Response (403 - Target is super-admin):
{
  "statusCode": 403,
  "message": "Cannot impersonate another super-admin",
  "error": "Forbidden"
}

// Response (403 - Target is suspended):
{
  "statusCode": 403,
  "message": "Cannot impersonate a suspended user",
  "error": "Forbidden"
}
```

```json
// POST /admin/impersonate/end
// Request: No body required

// Response (200):
{
  "success": true,
  "session": {
    "duration": 1800,
    "actionsPerformed": 15,
    "endedAt": "2024-01-15T10:30:00Z"
  }
}
```

```json
// GET /admin/impersonate/session
// Response (200 - Active impersonation):
{
  "isImpersonating": true,
  "session": {
    "sessionId": "uuid",
    "targetUser": {
      "id": "user-uuid",
      "email": "john@example.com",
      "name": "John Doe"
    },
    "startedAt": "2024-01-15T10:00:00Z",
    "expiresAt": "2024-01-15T11:00:00Z",
    "remainingSeconds": 1800
  }
}

// Response (200 - No active impersonation):
{
  "isImpersonating": false,
  "session": null
}
```

```json
// GET /admin/impersonate/active
// Response (200):
{
  "sessions": [
    {
      "sessionId": "uuid",
      "actor": {
        "id": "admin-uuid",
        "email": "admin@example.com",
        "name": "Admin User"
      },
      "targetUser": {
        "id": "user-uuid",
        "email": "john@example.com",
        "name": "John Doe"
      },
      "startedAt": "2024-01-15T10:00:00Z",
      "expiresAt": "2024-01-15T11:00:00Z"
    }
  ],
  "count": 1
}
```

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `impersonation.started` | `{ actorId, targetUserId, sessionId }` | Logged when impersonation begins |
| `impersonation.ended` | `{ actorId, targetUserId, duration, actionsCount }` | Logged when impersonation ends |
| `impersonation.expired` | `{ actorId, targetUserId, sessionId }` | Logged when session expires |
| `impersonation.action` | `{ actorId, targetUserId, action, resource }` | Logged for each action during impersonation |

---

## Database Schema

### impersonation_sessions Table

```typescript
// packages/db/src/schema/impersonation-sessions.ts
import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { users } from './users';

export const impersonationSessions = pgTable('impersonation_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),

  // Actor (super-admin who initiated)
  actorId: text('actor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Target user being impersonated
  targetUserId: text('target_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Session token (stored in cookie)
  token: text('token').notNull().unique(),

  // Session timing
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),

  // Metrics
  actionsCount: integer('actions_count').notNull().default(0),

  // Request context
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
}, (table) => ({
  actorIdIdx: index('idx_impersonation_sessions_actor_id').on(table.actorId),
  targetUserIdIdx: index('idx_impersonation_sessions_target_user_id').on(table.targetUserId),
  tokenIdx: index('idx_impersonation_sessions_token').on(table.token),
  expiresAtIdx: index('idx_impersonation_sessions_expires_at').on(table.expiresAt),
}));
```

---

## Multi-Tenancy Considerations

- [ ] Impersonation uses target user's org memberships
- [ ] RLS context is set with impersonated user's `userId`
- [ ] Super-admin cannot bypass RLS during impersonation (intentional)
- [ ] Impersonation sessions are NOT org-scoped (platform-level)
- [ ] Can navigate between target user's organizations

---

## Security Considerations

### Access Control
| Restriction | Reason |
|-------------|--------|
| Cannot impersonate super-admins | Prevent privilege escalation loops |
| Cannot impersonate suspended users | Suspended users should remain inaccessible |
| Cannot change password | Security-critical action |
| Cannot manage MFA | Security-critical action |
| Cannot change email | Account ownership protection |
| Cannot access payment methods | PCI compliance |
| Cannot create API keys | Prevent credential creation |
| Cannot delete account | Irreversible action protection |

### Session Security
| Control | Implementation |
|---------|---------------|
| Time limit | Sessions expire after 1 hour (configurable) |
| Separate cookie | `better-auth.impersonation_token` (HttpOnly, Secure, SameSite=Lax) |
| Token rotation | New token for each impersonation session |
| Audit trail | All actions logged with `isImpersonated: true` |
| Force termination | Super-admins can end any impersonation session |

### Compliance
- All impersonation events are logged immutably
- Audit logs include IP address and user agent
- Session duration and action count tracked
- Logs cannot be deleted or modified

---

## Environment Variables

```bash
# Impersonation Configuration
IMPERSONATION_SESSION_DURATION_MINUTES=60  # Default: 60 minutes
IMPERSONATION_SESSION_CLEANUP_CRON="*/15 * * * *"  # Every 15 minutes
```

---

## Frontend Components

### ImpersonationBanner

```tsx
// apps/web/src/components/admin/impersonation-banner.tsx
interface ImpersonationBannerProps {
  targetUser: {
    id: string;
    email: string;
    name: string | null;
  };
  expiresAt: Date;
  onEndImpersonation: () => void;
}
```

**Visual Design:**
- Fixed position at top of viewport
- Orange/amber background color
- Contains: Warning icon, user info, remaining time, "End" button
- Z-index above all other content
- Cannot be dismissed except by ending impersonation

### useImpersonation Hook

```tsx
// apps/web/src/hooks/use-impersonation.ts
interface UseImpersonationReturn {
  isImpersonating: boolean;
  session: ImpersonationSession | null;
  startImpersonation: (userId: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
  remainingTime: number; // seconds
  isLoading: boolean;
  error: Error | null;
}
```

---

## Restricted Endpoints

The following endpoints should be decorated with `@ImpersonationRestricted()`:

```typescript
// User security
PATCH /users/me/password
POST /users/me/mfa/enable
POST /users/me/mfa/disable
PATCH /users/me/email

// API Keys (all)
POST /api-keys
DELETE /api-keys/:id
PATCH /api-keys/:id

// Billing
POST /billing/checkout
POST /billing/portal
PATCH /billing/subscription

// Account
DELETE /users/me
```

---

## Open Questions

1. **Session persistence:** Should impersonation survive browser refresh? (Recommended: Yes, via cookie)
2. **Multiple tabs:** How to handle impersonation across browser tabs? (Recommended: Sync via cookie, banner in all tabs)
3. **Notification to user:** Should impersonated user be notified? (Recommended: No, for debugging purposes)
4. **Read-only mode option:** Allow a "view-only" impersonation that cannot perform any writes? (Future enhancement)

