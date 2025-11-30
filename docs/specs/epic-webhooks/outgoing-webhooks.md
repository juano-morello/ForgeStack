# Outgoing Webhooks

**Epic:** Webhooks  
**Priority:** #12  
**Depends on:** Priority #9 (BullMQ Worker)  
**Status:** Draft

---

## 1. Context

### Why Webhooks Are Needed

Outgoing webhooks enable ForgeStack to notify external systems about events in real-time, supporting:

- **Automation** – Trigger external workflows when events occur (e.g., project created, member invited)
- **Third-party integrations** – Connect with CRMs, project management tools, notification services
- **Custom workflows** – Allow customers to build their own integrations without polling APIs
- **Event-driven architecture** – Decouple ForgeStack from downstream systems

### Business Value

| Benefit | Description |
|---------|-------------|
| Real-time updates | External systems receive instant notifications |
| Reduced API load | Eliminates need for polling |
| Customer empowerment | Customers can build custom integrations |
| Enterprise readiness | Standard feature expected by enterprise customers |

### Technical Approach

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   ForgeStack    │     │     Redis       │     │  BullMQ Worker  │
│     Events      │────▶│   (webhook-     │────▶│  (webhook       │
│                 │     │    delivery)    │     │   delivery)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
                                                ┌─────────────────┐
                                                │   External      │
                                                │   Endpoint      │
                                                │   (HTTPS)       │
                                                └─────────────────┘
```

1. **Event occurs** in ForgeStack (e.g., project created)
2. **Event dispatcher** matches event to subscribed endpoints
3. **Job queued** to `webhook-delivery` BullMQ queue
4. **Worker processes** delivery with retry logic
5. **Delivery logged** with response tracking

---

## 2. User Stories

### US-1: Register Webhook Endpoints

**As an org owner**, I want to register webhook endpoints so that I can receive notifications about events in my organization.

**Acceptance Criteria:**
- [ ] Can create a webhook endpoint with a URL (HTTPS only)
- [ ] Can provide a description for the endpoint
- [ ] System generates a unique secret for signing
- [ ] Endpoint is associated with my organization (org_id)
- [ ] Only OWNER role can manage webhook endpoints
- [ ] Endpoint starts in enabled state by default

### US-2: Select Webhook Events

**As an org owner**, I want to select which events trigger webhooks so that I only receive relevant notifications.

**Acceptance Criteria:**
- [ ] Can select from a list of available event types
- [ ] Can select multiple events per endpoint
- [ ] Can update event selection after creation
- [ ] Endpoint only receives events it's subscribed to
- [ ] Can subscribe to all events with wildcard (*)

### US-3: View Delivery Logs

**As an org owner**, I want to view webhook delivery logs so that I can monitor webhook reliability and debug issues.

**Acceptance Criteria:**
- [ ] Can view list of recent deliveries per endpoint
- [ ] Delivery shows: event type, timestamp, status, response code
- [ ] Can view full delivery details including payload and response
- [ ] Logs are scoped to my organization (RLS)
- [ ] Logs retained for 30 days

### US-4: Automatic Retry Logic

**As the system**, I want to retry failed webhook deliveries so that transient failures don't result in lost events.

**Acceptance Criteria:**
- [ ] Failed deliveries retry up to 5 times
- [ ] Exponential backoff: 1min, 5min, 30min, 2hr, 24hr
- [ ] Mark as permanently failed after all attempts exhausted
- [ ] Track attempt number in delivery record
- [ ] Log each retry attempt

### US-5: Test Webhook Endpoints

**As an org owner**, I want to test webhook endpoints so that I can verify my integration is working.

**Acceptance Criteria:**
- [ ] Can send a test event to any enabled endpoint
- [ ] Test event has distinct type: `test.ping`
- [ ] Test delivery is logged like regular deliveries
- [ ] Response shown immediately in UI

### US-6: Rotate Webhook Secrets

**As an org owner**, I want to regenerate webhook secrets so that I can maintain security if a secret is compromised.

**Acceptance Criteria:**
- [ ] Can regenerate secret for any endpoint
- [ ] New secret shown once after regeneration
- [ ] Old secret immediately invalidated
- [ ] Audit log captures secret rotation

---

## 3. Acceptance Criteria Summary

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| F1 | CRUD operations for webhook endpoints | Must Have |
| F2 | Event subscription per endpoint | Must Have |
| F3 | Webhook delivery via BullMQ worker | Must Have |
| F4 | HMAC-SHA256 request signing | Must Have |
| F5 | Delivery logging with response tracking | Must Have |
| F6 | Retry with exponential backoff | Must Have |
| F7 | Test endpoint functionality | Should Have |
| F8 | Secret rotation | Should Have |
| F9 | Manual retry from UI | Should Have |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NF1 | Webhook delivery timeout | 30 seconds |
| NF2 | Delivery log retention | 30 days |
| NF3 | Max retry attempts | 5 |
| NF4 | Max endpoints per org | 10 |
| NF5 | Max payload size | 256 KB |

---

## 4. Database Schema

### webhook_endpoints Table

```sql
CREATE TABLE webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  description TEXT,
  secret TEXT NOT NULL,  -- Stored encrypted
  events TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT webhook_endpoints_url_https CHECK (url LIKE 'https://%'),
  CONSTRAINT webhook_endpoints_events_not_empty CHECK (array_length(events, 1) > 0)
);

-- RLS Policy
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_endpoints_tenant_isolation ON webhook_endpoints
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Indexes
CREATE INDEX idx_webhook_endpoints_org_id ON webhook_endpoints(org_id);
CREATE INDEX idx_webhook_endpoints_enabled ON webhook_endpoints(org_id, enabled) WHERE enabled = true;
```

### Drizzle Schema (webhook_endpoints)

```typescript
// packages/db/src/schema/webhook-endpoints.ts
import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { users } from './users';

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  description: text('description'),
  secret: text('secret').notNull(),
  events: text('events').array().notNull().default([]),
  enabled: boolean('enabled').notNull().default(true),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### webhook_deliveries Table

```sql
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  endpoint_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_id TEXT NOT NULL,  -- Unique event identifier (evt_xxx)
  payload JSONB NOT NULL,
  request_headers JSONB,
  response_status INTEGER,
  response_body TEXT,
  response_headers JSONB,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  next_retry_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT webhook_deliveries_status_check CHECK (
    (delivered_at IS NOT NULL AND failed_at IS NULL) OR
    (delivered_at IS NULL AND failed_at IS NOT NULL) OR
    (delivered_at IS NULL AND failed_at IS NULL)
  )
);

-- RLS Policy
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_deliveries_tenant_isolation ON webhook_deliveries
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- Indexes
CREATE INDEX idx_webhook_deliveries_org_id ON webhook_deliveries(org_id);
CREATE INDEX idx_webhook_deliveries_endpoint_id ON webhook_deliveries(endpoint_id);
CREATE INDEX idx_webhook_deliveries_event_type ON webhook_deliveries(org_id, event_type);
CREATE INDEX idx_webhook_deliveries_status ON webhook_deliveries(org_id, delivered_at, failed_at);
CREATE INDEX idx_webhook_deliveries_created_at ON webhook_deliveries(org_id, created_at DESC);
CREATE INDEX idx_webhook_deliveries_pending ON webhook_deliveries(next_retry_at)
  WHERE delivered_at IS NULL AND failed_at IS NULL AND next_retry_at IS NOT NULL;
```

### Drizzle Schema (webhook_deliveries)

```typescript
// packages/db/src/schema/webhook-deliveries.ts
import { pgTable, uuid, text, integer, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';
import { webhookEndpoints } from './webhook-endpoints';

export const webhookDeliveries = pgTable('webhook_deliveries', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  endpointId: uuid('endpoint_id').notNull().references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  eventId: text('event_id').notNull(),
  payload: jsonb('payload').notNull(),
  requestHeaders: jsonb('request_headers'),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  responseHeaders: jsonb('response_headers'),
  attemptNumber: integer('attempt_number').notNull().default(1),
  nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  failedAt: timestamp('failed_at', { withTimezone: true }),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## 5. Supported Events

### Event Types

| Category | Event Type | Description |
|----------|------------|-------------|
| **Projects** | `project.created` | A new project was created |
| | `project.updated` | A project was updated |
| | `project.deleted` | A project was deleted |
| **Members** | `member.invited` | A user was invited to the org |
| | `member.joined` | A user accepted an invitation |
| | `member.removed` | A member was removed from the org |
| | `member.role_changed` | A member's role was changed |
| **Subscriptions** | `subscription.created` | A new subscription was created |
| | `subscription.updated` | A subscription was updated |
| | `subscription.canceled` | A subscription was canceled |
| **Files** | `file.uploaded` | A file was uploaded |
| | `file.deleted` | A file was deleted |
| **Test** | `test.ping` | Test event for endpoint verification |

### Event Type Enum

```typescript
// packages/db/src/schema/enums.ts
export const webhookEventTypes = [
  'project.created',
  'project.updated',
  'project.deleted',
  'member.invited',
  'member.joined',
  'member.removed',
  'member.role_changed',
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
  'file.uploaded',
  'file.deleted',
  'test.ping',
] as const;

export type WebhookEventType = typeof webhookEventTypes[number];
```

---

## 6. API Endpoints

### Webhook Endpoints Management

| Method | Path | Description | Role |
|--------|------|-------------|------|
| `POST` | `/webhooks/endpoints` | Create a new webhook endpoint | OWNER |
| `GET` | `/webhooks/endpoints` | List all webhook endpoints | OWNER |
| `GET` | `/webhooks/endpoints/:id` | Get a specific endpoint | OWNER |
| `PATCH` | `/webhooks/endpoints/:id` | Update an endpoint | OWNER |
| `DELETE` | `/webhooks/endpoints/:id` | Delete an endpoint | OWNER |
| `POST` | `/webhooks/endpoints/:id/test` | Send a test event | OWNER |
| `POST` | `/webhooks/endpoints/:id/rotate-secret` | Regenerate secret | OWNER |

### Webhook Deliveries

| Method | Path | Description | Role |
|--------|------|-------------|------|
| `GET` | `/webhooks/deliveries` | List deliveries (with filters) | OWNER |
| `GET` | `/webhooks/deliveries/:id` | Get delivery details | OWNER |
| `POST` | `/webhooks/deliveries/:id/retry` | Manually retry a delivery | OWNER |

### Request/Response Examples

#### Create Endpoint

```http
POST /api/v1/webhooks/endpoints
Content-Type: application/json
Authorization: Bearer {token}
X-Org-Id: {org_id}

{
  "url": "https://example.com/webhooks/forgestack",
  "description": "Production webhook endpoint",
  "events": ["project.created", "project.updated", "member.joined"]
}
```

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "url": "https://example.com/webhooks/forgestack",
  "description": "Production webhook endpoint",
  "secret": "whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "events": ["project.created", "project.updated", "member.joined"],
  "enabled": true,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

> **Note:** The `secret` is only returned in full on creation and rotation. Subsequent GET requests return a masked version.

#### List Deliveries

```http
GET /api/v1/webhooks/deliveries?endpoint_id={id}&status=failed&limit=20
Authorization: Bearer {token}
X-Org-Id: {org_id}
```

```json
{
  "data": [
    {
      "id": "660e8400-e29b-41d4-a716-446655440001",
      "endpointId": "550e8400-e29b-41d4-a716-446655440000",
      "eventType": "project.created",
      "eventId": "evt_abc123",
      "responseStatus": null,
      "attemptNumber": 3,
      "nextRetryAt": "2024-01-01T02:00:00Z",
      "error": "Connection timeout",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0
  }
}
```

---

## 7. Webhook Payload Format

### Standard Payload Structure

```json
{
  "id": "evt_abc123xyz",
  "type": "project.created",
  "created_at": "2024-01-01T00:00:00.000Z",
  "org_id": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "New Project",
    "description": "Project description",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Event-Specific Payloads

#### project.created / project.updated

```json
{
  "id": "evt_proj_123",
  "type": "project.created",
  "created_at": "2024-01-01T00:00:00.000Z",
  "org_id": "org_xxx",
  "data": {
    "id": "proj_xxx",
    "name": "Project Name",
    "description": "Project description",
    "created_by": "user_xxx",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### member.invited

```json
{
  "id": "evt_member_456",
  "type": "member.invited",
  "created_at": "2024-01-01T00:00:00.000Z",
  "org_id": "org_xxx",
  "data": {
    "invitation_id": "inv_xxx",
    "email": "invited@example.com",
    "role": "MEMBER",
    "invited_by": "user_xxx",
    "expires_at": "2024-01-08T00:00:00.000Z"
  }
}
```

#### test.ping

```json
{
  "id": "evt_test_789",
  "type": "test.ping",
  "created_at": "2024-01-01T00:00:00.000Z",
  "org_id": "org_xxx",
  "data": {
    "message": "This is a test webhook event",
    "endpoint_id": "endpoint_xxx"
  }
}
```

---

## 8. Request Signing

### HMAC-SHA256 Signature

All webhook requests are signed using HMAC-SHA256 to allow receivers to verify authenticity.

### Headers

| Header | Description |
|--------|-------------|
| `X-Webhook-Signature` | Signature in format `t={timestamp},v1={signature}` |
| `X-Webhook-Timestamp` | Unix timestamp (seconds) when signature was generated |
| `X-Webhook-Id` | Unique event ID for idempotency |

### Signature Generation

```typescript
// Signature is computed over: {timestamp}.{payload}
const signPayload = (secret: string, timestamp: number, payload: string): string => {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
};
```

### Verification Example (Receiver)

```typescript
const verifyWebhookSignature = (
  payload: string,
  signature: string,
  secret: string,
  toleranceSeconds: number = 300
): boolean => {
  const parts = signature.split(',');
  const timestamp = parseInt(parts[0].split('=')[1]);
  const receivedSig = parts[1].split('=')[1];

  // Check timestamp tolerance (default 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > toleranceSeconds) {
    throw new Error('Timestamp outside tolerance window');
  }

  // Compute expected signature
  const signedPayload = `${timestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(receivedSig),
    Buffer.from(expectedSig)
  );
};
```

---

## 9. Retry Logic

### Retry Schedule

| Attempt | Delay | Total Time Elapsed |
|---------|-------|-------------------|
| 1 | Immediate | 0 |
| 2 | 1 minute | 1 minute |
| 3 | 5 minutes | 6 minutes |
| 4 | 30 minutes | 36 minutes |
| 5 | 2 hours | 2 hours 36 minutes |
| 6 | 24 hours | ~26 hours 36 minutes |

### Retry Configuration

```typescript
const WEBHOOK_RETRY_CONFIG = {
  maxAttempts: 5,
  backoffSchedule: [
    1 * 60 * 1000,      // 1 minute
    5 * 60 * 1000,      // 5 minutes
    30 * 60 * 1000,     // 30 minutes
    2 * 60 * 60 * 1000, // 2 hours
    24 * 60 * 60 * 1000 // 24 hours
  ],
  timeout: 30 * 1000,   // 30 seconds
};
```

### Success Criteria

A delivery is considered successful if:
- Response status code is 2xx (200-299)
- Response received within timeout (30 seconds)

### Failure Scenarios

| Scenario | Action |
|----------|--------|
| Connection timeout | Retry with backoff |
| Connection refused | Retry with backoff |
| Non-2xx response | Retry with backoff |
| SSL/TLS error | Retry with backoff |
| Max attempts reached | Mark as permanently failed |

---

## 10. Worker Jobs

### Queue Configuration

```typescript
// apps/worker/src/config/queues.ts
export const WEBHOOK_DELIVERY_QUEUE = 'webhook-delivery';

export const webhookDeliveryJobOptions = {
  attempts: 5,
  backoff: {
    type: 'custom' as const,
    delay: (attemptsMade: number) => {
      const delays = [0, 60000, 300000, 1800000, 7200000, 86400000];
      return delays[attemptsMade] || delays[delays.length - 1];
    },
  },
  removeOnComplete: 100,
  removeOnFail: false,
};
```

### Job Data Interface

```typescript
interface WebhookDeliveryJobData {
  deliveryId: string;
  endpointId: string;
  orgId: string;
  url: string;
  secret: string;
  eventId: string;
  eventType: string;
  payload: object;
  attemptNumber: number;
}
```

### Webhook Delivery Handler

```typescript
// apps/worker/src/handlers/webhook-delivery.handler.ts
import { Job } from 'bullmq';
import { WebhookDeliveryJobData } from '../types';

export async function webhookDeliveryHandler(job: Job<WebhookDeliveryJobData>) {
  const { deliveryId, url, secret, payload, eventId, eventType, attemptNumber } = job.data;

  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signature = signPayload(secret, timestamp, payloadString);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Id': eventId,
        'X-Webhook-Timestamp': timestamp.toString(),
        'X-Webhook-Signature': signature,
        'User-Agent': 'ForgeStack-Webhooks/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000),
    });

    // Update delivery record
    await updateDeliveryRecord(deliveryId, {
      responseStatus: response.status,
      responseBody: await response.text(),
      responseHeaders: Object.fromEntries(response.headers),
      deliveredAt: response.ok ? new Date() : null,
      error: response.ok ? null : `HTTP ${response.status}`,
      attemptNumber,
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }

    return { success: true, status: response.status };
  } catch (error) {
    await updateDeliveryRecord(deliveryId, {
      error: error.message,
      attemptNumber,
      nextRetryAt: calculateNextRetry(attemptNumber),
      failedAt: attemptNumber >= 5 ? new Date() : null,
    });
    throw error;
  }
}
```

---

## 11. Frontend Components

### Component Structure

```
apps/web/src/
├── app/(dashboard)/settings/webhooks/
│   ├── page.tsx                    # Webhooks list page
│   ├── [id]/page.tsx               # Endpoint details page
│   └── new/page.tsx                # Create endpoint page
└── components/webhooks/
    ├── endpoint-list.tsx           # List of webhook endpoints
    ├── endpoint-form.tsx           # Create/edit endpoint form
    ├── endpoint-card.tsx           # Individual endpoint card
    ├── event-selector.tsx          # Multi-select for events
    ├── delivery-logs-table.tsx     # Table of delivery attempts
    ├── delivery-details-modal.tsx  # Modal with full delivery info
    ├── test-webhook-button.tsx     # Button to send test event
    ├── secret-display.tsx          # Show/copy secret component
    └── rotate-secret-dialog.tsx    # Confirmation dialog for rotation
```

### Key UI Features

| Component | Functionality |
|-----------|---------------|
| Endpoint List | Show all endpoints with status, event count, last delivery |
| Event Selector | Checkbox list grouped by category, select all option |
| Delivery Logs | Filterable table with status badges, expandable rows |
| Secret Display | Show once on create, masked otherwise, copy button |
| Test Button | Immediate feedback with delivery result |

---

## 12. Tasks

### Backend (apps/api)

#### 12.1 Create Webhooks Module
- [ ] Create `apps/api/src/webhooks/webhooks.module.ts`
- [ ] Register service, controller, and event dispatcher
- [ ] Import QueueModule for job dispatching
- [ ] Import DrizzleModule for database access

#### 12.2 Implement Webhook Endpoints Service
- [ ] Create `apps/api/src/webhooks/webhooks.service.ts`
- [ ] Implement `create(ctx, dto)` – creates endpoint with generated secret
- [ ] Implement `findAll(ctx)` – returns org's endpoints (masked secrets)
- [ ] Implement `findOne(ctx, id)` – returns single endpoint
- [ ] Implement `update(ctx, id, dto)` – updates URL, description, events, enabled
- [ ] Implement `remove(ctx, id)` – deletes endpoint and associated deliveries
- [ ] Implement `rotateSecret(ctx, id)` – generates new secret
- [ ] Implement `testEndpoint(ctx, id)` – sends test.ping event

#### 12.3 Implement Webhook Controller
- [ ] Create `apps/api/src/webhooks/webhooks.controller.ts`
- [ ] Add `POST /webhooks/endpoints` endpoint
- [ ] Add `GET /webhooks/endpoints` endpoint
- [ ] Add `GET /webhooks/endpoints/:id` endpoint
- [ ] Add `PATCH /webhooks/endpoints/:id` endpoint
- [ ] Add `DELETE /webhooks/endpoints/:id` endpoint
- [ ] Add `POST /webhooks/endpoints/:id/test` endpoint
- [ ] Add `POST /webhooks/endpoints/:id/rotate-secret` endpoint
- [ ] Apply `@Roles('OWNER')` guard to all endpoints

#### 12.4 Implement Deliveries Service
- [ ] Create `apps/api/src/webhooks/deliveries.service.ts`
- [ ] Implement `findAll(ctx, filters)` – paginated delivery list
- [ ] Implement `findOne(ctx, id)` – single delivery with full details
- [ ] Implement `retry(ctx, id)` – re-queue failed delivery

#### 12.5 Implement Deliveries Controller
- [ ] Create `apps/api/src/webhooks/deliveries.controller.ts`
- [ ] Add `GET /webhooks/deliveries` endpoint with filters
- [ ] Add `GET /webhooks/deliveries/:id` endpoint
- [ ] Add `POST /webhooks/deliveries/:id/retry` endpoint
- [ ] Apply `@Roles('OWNER')` guard to all endpoints

#### 12.6 Implement Signing Utility
- [ ] Create `apps/api/src/webhooks/utils/signing.ts`
- [ ] Implement `generateSecret()` – generates `whsec_` prefixed secret
- [ ] Implement `signPayload(secret, timestamp, payload)` – HMAC-SHA256
- [ ] Implement `verifySignature()` – for testing purposes

#### 12.7 Implement Event Dispatcher
- [ ] Create `apps/api/src/webhooks/event-dispatcher.service.ts`
- [ ] Implement `dispatch(orgId, eventType, data)` – main dispatch method
- [ ] Query subscribed endpoints for org + event type
- [ ] Create delivery record for each endpoint
- [ ] Queue delivery job via QueueService
- [ ] Handle errors gracefully (don't fail main operation)

#### 12.8 Create DTOs
- [ ] Create `apps/api/src/webhooks/dto/create-endpoint.dto.ts`
- [ ] Create `apps/api/src/webhooks/dto/update-endpoint.dto.ts`
- [ ] Create `apps/api/src/webhooks/dto/delivery-query.dto.ts`
- [ ] Add class-validator decorators

### Database (packages/db)

#### 12.9 Add Database Tables
- [ ] Create `packages/db/src/schema/webhook-endpoints.ts`
- [ ] Create `packages/db/src/schema/webhook-deliveries.ts`
- [ ] Export from `packages/db/src/schema/index.ts`

#### 12.10 Create Migration
- [ ] Generate migration for `webhook_endpoints` table
- [ ] Generate migration for `webhook_deliveries` table
- [ ] Add RLS policies
- [ ] Add indexes

### Worker (apps/worker)

#### 12.11 Add Webhook Delivery Queue
- [ ] Add `webhook-delivery` queue to `config/queues.ts`
- [ ] Configure custom backoff schedule

#### 12.12 Implement Delivery Handler
- [ ] Create `apps/worker/src/handlers/webhook-delivery.handler.ts`
- [ ] Implement HTTP POST with signing
- [ ] Implement timeout handling (30s)
- [ ] Update delivery record with response
- [ ] Handle success/failure scenarios

#### 12.13 Register Handler
- [ ] Register handler in `apps/worker/src/worker.ts`
- [ ] Add connection and worker configuration

### Frontend (apps/web)

#### 12.14 Create Webhooks Settings Page
- [ ] Create `apps/web/src/app/(dashboard)/settings/webhooks/page.tsx`
- [ ] Implement endpoint list view
- [ ] Add create endpoint button
- [ ] Show endpoint status and stats

#### 12.15 Create Endpoint Form
- [ ] Create `apps/web/src/components/webhooks/endpoint-form.tsx`
- [ ] URL input with HTTPS validation
- [ ] Description textarea
- [ ] Event selector component
- [ ] Enabled toggle

#### 12.16 Create Event Selector
- [ ] Create `apps/web/src/components/webhooks/event-selector.tsx`
- [ ] Group events by category
- [ ] Select all / deselect all
- [ ] Checkbox list UI

#### 12.17 Create Delivery Logs UI
- [ ] Create `apps/web/src/components/webhooks/delivery-logs-table.tsx`
- [ ] Filterable by status (success, failed, pending)
- [ ] Sortable by date
- [ ] Status badges
- [ ] Expandable row for details

#### 12.18 Create Supporting Components
- [ ] Create `apps/web/src/components/webhooks/secret-display.tsx`
- [ ] Create `apps/web/src/components/webhooks/test-webhook-button.tsx`
- [ ] Create `apps/web/src/components/webhooks/rotate-secret-dialog.tsx`
- [ ] Create `apps/web/src/components/webhooks/delivery-details-modal.tsx`

#### 12.19 Add API Hooks
- [ ] Create `apps/web/src/hooks/use-webhooks.ts`
- [ ] Implement `useWebhookEndpoints()` – list endpoints
- [ ] Implement `useWebhookEndpoint(id)` – single endpoint
- [ ] Implement `useWebhookDeliveries(filters)` – delivery logs
- [ ] Implement mutations for CRUD operations

---

## 13. Test Plan

### Unit Tests

#### Signing Utility Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `generateSecret()` returns prefixed string | Matches `whsec_[a-zA-Z0-9]{32}` |
| `signPayload()` produces consistent signature | Same input → same output |
| `signPayload()` produces different signatures | Different inputs → different outputs |
| Signature format is correct | Matches `t={timestamp},v1={hex}` |

#### Event Dispatcher Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Dispatches to subscribed endpoints | Creates delivery + queues job |
| Ignores disabled endpoints | No delivery created |
| Ignores unsubscribed events | No delivery created |
| Handles no matching endpoints | Returns gracefully |
| Database error doesn't throw | Logs error, returns gracefully |

#### Retry Logic Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Calculates correct backoff delays | Matches schedule |
| Marks as failed after max attempts | `failedAt` set |
| Updates `nextRetryAt` on failure | Correct timestamp |

### Integration Tests

#### Endpoint CRUD Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Create endpoint with valid data | 201, returns endpoint with secret |
| Create endpoint without HTTPS | 400 validation error |
| Create endpoint as non-OWNER | 403 Forbidden |
| List endpoints returns org's endpoints | Only org's endpoints |
| Update endpoint URL | 200, URL updated |
| Delete endpoint | 204, cascade deletes deliveries |
| Rotate secret | 200, new secret returned |
| Test endpoint sends test.ping | Delivery created and queued |

#### Delivery Tests
| Test Case | Expected Result |
|-----------|-----------------|
| List deliveries with filters | Correctly filtered results |
| Get delivery details | Full payload and response |
| Manual retry queues job | New job added to queue |
| Manual retry updates attempt number | Incremented |

### Worker Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Successful delivery | `deliveredAt` set, 2xx status logged |
| Failed delivery (timeout) | Error logged, job retried |
| Failed delivery (non-2xx) | Response logged, job retried |
| Max retries exceeded | `failedAt` set, no more retries |
| Signature is valid | Receiver can verify |

### E2E Test Scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| Create and test endpoint | 1. Create endpoint 2. Click test 3. Check logs | Test delivery appears in logs |
| Event triggers webhook | 1. Create endpoint for project.created 2. Create project | Webhook delivered |
| Retry failed delivery | 1. Create endpoint with bad URL 2. Create project 3. Fix URL 4. Manual retry | Delivery succeeds |
| Rotate secret | 1. Create endpoint 2. Rotate secret 3. Test | New signature valid |

---

## 14. Security Considerations

| Consideration | Implementation |
|---------------|----------------|
| HTTPS only | URL validation rejects non-HTTPS URLs |
| Secret storage | Secrets stored encrypted at rest |
| Secret exposure | Full secret only shown once on create/rotate |
| Request timeout | 30 second timeout prevents hanging |
| No secrets in logs | Secrets are masked in all log output |
| RLS enforcement | All queries use `withTenantContext()` |
| Role-based access | Only OWNER role can manage webhooks |
| Signature timestamps | Receivers should validate timestamp tolerance |
| Idempotency | Event IDs enable receiver-side deduplication |

---

## 15. Constraints

| Constraint | Requirement |
|------------|-------------|
| RLS | All tables include `org_id`, all queries use `withTenantContext()` |
| Role | Only OWNER role can manage endpoints |
| Processing | Deliveries processed via BullMQ worker |
| Protocol | Only HTTPS URLs accepted |
| Payload size | Max 256 KB per webhook payload |
| Endpoints limit | Max 10 endpoints per organization |
| Retention | Delivery logs retained for 30 days |

---

## 16. Implementation Notes

### Project Structure

```
apps/api/src/webhooks/
├── webhooks.module.ts
├── webhooks.controller.ts
├── webhooks.service.ts
├── deliveries.controller.ts
├── deliveries.service.ts
├── event-dispatcher.service.ts
├── dto/
│   ├── create-endpoint.dto.ts
│   ├── update-endpoint.dto.ts
│   └── delivery-query.dto.ts
└── utils/
    └── signing.ts

apps/worker/src/handlers/
└── webhook-delivery.handler.ts

packages/db/src/schema/
├── webhook-endpoints.ts
└── webhook-deliveries.ts

apps/web/src/
├── app/(dashboard)/settings/webhooks/
│   ├── page.tsx
│   ├── [id]/page.tsx
│   └── new/page.tsx
└── components/webhooks/
    ├── endpoint-list.tsx
    ├── endpoint-form.tsx
    ├── event-selector.tsx
    ├── delivery-logs-table.tsx
    └── ...
```

### Environment Variables

```env
# Webhook Configuration
WEBHOOK_DELIVERY_TIMEOUT=30000  # 30 seconds
WEBHOOK_MAX_RETRIES=5
WEBHOOK_LOG_RETENTION_DAYS=30
WEBHOOK_MAX_ENDPOINTS_PER_ORG=10
```

---

## 17. Dependencies

### Backend (`/apps/api`)

| Package | Version | Purpose |
|---------|---------|---------|
| `bullmq` | `^5.x` | Job queue (already installed) |
| `crypto` | built-in | HMAC-SHA256 signing |

### Worker (`/apps/worker`)

| Package | Version | Purpose |
|---------|---------|---------|
| `bullmq` | `^5.x` | Job processing (already installed) |
| `node-fetch` | `^3.x` | HTTP client (or native fetch) |

### Frontend (`/apps/web`)

| Package | Version | Purpose |
|---------|---------|---------|
| `@tanstack/react-query` | existing | Data fetching |
| (existing UI libraries) | - | Components |

---

*End of spec*

