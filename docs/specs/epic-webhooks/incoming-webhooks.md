# Incoming Webhooks

**Epic:** Webhooks  
**Priority:** #13  
**Depends on:** Priority #9 (BullMQ Worker), Priority #10 (Stripe Billing Integration)  
**Status:** Draft

---

## 1. Context

### Why Incoming Webhooks Are Needed

Incoming webhooks enable ForgeStack to receive real-time event notifications from external services, supporting:

- **Stripe billing events** – Subscription changes, payment success/failures, customer updates
- **Third-party integrations** – Future support for GitHub, Resend, and other providers
- **Real-time synchronization** – Keep internal state in sync with external systems
- **Event-driven architecture** – Process external events asynchronously via worker queues

### Business Value

| Benefit | Description |
|---------|-------------|
| Real-time sync | Subscription and payment states always up-to-date |
| Reliability | Async processing prevents webhook timeouts |
| Auditability | All incoming events logged for debugging |
| Idempotency | Duplicate events handled gracefully |
| Security | Signature verification prevents spoofed events |

### Technical Approach

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   External      │     │   ForgeStack    │     │     Redis       │
│   Provider      │────▶│   Webhook       │────▶│  (incoming-     │
│   (Stripe, etc.)│     │   Endpoint      │     │   webhook)      │
└─────────────────┘     └────────┬────────┘     └────────┬────────┘
                                 │                       │
                                 ▼                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Database      │     │  BullMQ Worker  │
                        │   (raw event    │     │  (event         │
                        │    storage)     │     │   processing)   │
                        └─────────────────┘     └─────────────────┘
```

1. **External service** sends webhook POST to provider-specific endpoint
2. **Endpoint stores** raw event in database immediately
3. **Signature verified** using provider-specific method
4. **Idempotency checked** via provider's event ID
5. **Event queued** to BullMQ for async processing
6. **Worker processes** event and updates internal state
7. **200 returned** to provider immediately after storing

---

## 2. User Stories

### US-1: Receive Stripe Webhook Events

**As the system**, I want to receive Stripe webhook events securely, so that billing state stays synchronized with Stripe.

**Acceptance Criteria:**
- [ ] Webhook endpoint receives POST requests at `/webhooks/stripe`
- [ ] Raw payload stored in database before any processing
- [ ] Stripe signature verified using `STRIPE_WEBHOOK_SECRET`
- [ ] Invalid signatures return 400 and event marked as unverified
- [ ] Valid events queued for async processing
- [ ] Endpoint returns 200 immediately after storing/queuing
- [ ] Endpoint is public (no auth required)

### US-2: Verify Webhook Signatures

**As the system**, I want to verify webhook signatures per provider, so that only authentic events are processed.

**Acceptance Criteria:**
- [ ] Stripe: Uses `stripe.webhooks.constructEvent()` for verification
- [ ] Verification uses provider-specific secret from environment
- [ ] Failed verification logged but event still stored (for debugging)
- [ ] Verified status tracked in database record
- [ ] Only verified events are processed by worker

### US-3: Process Webhook Events Idempotently

**As the system**, I want to process webhook events idempotently, so that duplicate events don't cause inconsistent state.

**Acceptance Criteria:**
- [ ] Unique constraint on (provider, event_id) prevents duplicates
- [ ] Duplicate events return 200 (already received acknowledgment)
- [ ] processed_at timestamp tracks if event was already handled
- [ ] Worker skips events already marked as processed
- [ ] Idempotency check happens before queuing

### US-4: View Incoming Webhook Logs

**As an admin**, I want to view incoming webhook logs, so that I can monitor and debug webhook processing.

**Acceptance Criteria:**
- [ ] Admin-only endpoint lists incoming webhook events
- [ ] Events filterable by provider, event_type, verified status
- [ ] Event details include full payload, signature, and processing status
- [ ] Events show processing errors if any
- [ ] Events sortable by created_at (newest first)

### US-5: Retry Failed Webhook Processing

**As the system**, I want to retry failed webhook processing, so that transient failures don't result in missed events.

**Acceptance Criteria:**
- [ ] Worker retries failed processing with exponential backoff
- [ ] Max 5 retry attempts before marking as permanently failed
- [ ] Retry count tracked in database record
- [ ] Admin can manually trigger retry for failed events
- [ ] Successful retry clears error and sets processed_at

---

## 3. Acceptance Criteria Summary

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| F1 | Provider-specific webhook endpoints | Must Have |
| F2 | Signature verification per provider | Must Have |
| F3 | Raw event storage for audit trail | Must Have |
| F4 | Idempotency via event_id unique constraint | Must Have |
| F5 | Async processing via BullMQ worker | Must Have |
| F6 | Stripe event handlers for billing sync | Must Have |
| F7 | Admin webhook log viewer | Should Have |
| F8 | Manual retry for failed events | Should Have |
| F9 | Future provider support (GitHub, Resend) | Nice to Have |

### Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NF1 | Return 200 within 5 seconds | Always |
| NF2 | Event log retention | 90 days |
| NF3 | Max retry attempts | 5 |
| NF4 | Worker processing timeout | 30 seconds |
| NF5 | Support for RLS (org_id scoping) | Where applicable |

---

## 4. Database Schema

### incoming_webhook_events Table

```sql
CREATE TABLE incoming_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,                    -- 'stripe', 'github', etc.
  event_type TEXT NOT NULL,                  -- 'customer.subscription.updated', etc.
  event_id TEXT NOT NULL,                    -- Provider's unique event ID
  payload JSONB NOT NULL,                    -- Raw event payload
  signature TEXT,                            -- Raw signature header
  verified BOOLEAN NOT NULL DEFAULT false,   -- Signature verification status
  processed_at TIMESTAMPTZ,                  -- When successfully processed
  error TEXT,                                -- Last error message
  retry_count INTEGER NOT NULL DEFAULT 0,    -- Number of retry attempts
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Idempotency constraint
  CONSTRAINT incoming_webhook_events_idempotency UNIQUE (provider, event_id)
);

-- Indexes
CREATE INDEX idx_incoming_webhook_events_org_id ON incoming_webhook_events(org_id);
CREATE INDEX idx_incoming_webhook_events_provider ON incoming_webhook_events(provider);
CREATE INDEX idx_incoming_webhook_events_event_type ON incoming_webhook_events(provider, event_type);
CREATE INDEX idx_incoming_webhook_events_verified ON incoming_webhook_events(verified);
CREATE INDEX idx_incoming_webhook_events_processed ON incoming_webhook_events(processed_at);
CREATE INDEX idx_incoming_webhook_events_created ON incoming_webhook_events(created_at DESC);
CREATE INDEX idx_incoming_webhook_events_pending ON incoming_webhook_events(created_at)
  WHERE processed_at IS NULL AND verified = true;

-- RLS Policy (nullable org_id for system-level webhooks)
ALTER TABLE incoming_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY incoming_webhook_events_isolation ON incoming_webhook_events
  USING (
    org_id IS NULL OR
    org_id = current_setting('app.current_org_id')::uuid
  );
```

### Drizzle Schema

```typescript
// packages/db/src/schema/incoming-webhook-events.ts
import { pgTable, uuid, text, boolean, integer, jsonb, timestamp, unique } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const incomingWebhookEvents = pgTable('incoming_webhook_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'set null' }),
  provider: text('provider').notNull(),
  eventType: text('event_type').notNull(),
  eventId: text('event_id').notNull(),
  payload: jsonb('payload').notNull(),
  signature: text('signature'),
  verified: boolean('verified').notNull().default(false),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  error: text('error'),
  retryCount: integer('retry_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  idempotencyConstraint: unique('incoming_webhook_events_idempotency').on(table.provider, table.eventId),
}));
```

---

## 5. Supported Providers

### Initial Provider: Stripe

Stripe is the primary provider for V1, handling billing-related events.

| Event Type | Description | Action |
|------------|-------------|--------|
| `checkout.session.completed` | Customer completed checkout | Create/link customer and subscription |
| `customer.subscription.created` | New subscription created | Create subscription record |
| `customer.subscription.updated` | Subscription changed | Update status, plan, period dates |
| `customer.subscription.deleted` | Subscription canceled | Mark as canceled |
| `invoice.paid` | Payment successful | Update subscription status |
| `invoice.payment_failed` | Payment failed | Mark subscription past_due |
| `customer.updated` | Customer info changed | Update customer record |

### Future Providers (Not in V1)

| Provider | Use Case | Event Examples |
|----------|----------|----------------|
| GitHub | Repository webhooks | `push`, `pull_request`, `issues` |
| Resend | Email delivery status | `email.sent`, `email.delivered`, `email.bounced` |

---

## 6. API Endpoints

### Public Webhook Receivers

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| `POST` | `/webhooks/stripe` | Receive Stripe webhooks | None (signature verified) |
| `POST` | `/webhooks/github` | Receive GitHub webhooks (future) | None (signature verified) |

### Admin Endpoints

| Method | Path | Description | Role |
|--------|------|-------------|------|
| `GET` | `/admin/webhooks/incoming` | List incoming events | ADMIN |
| `GET` | `/admin/webhooks/incoming/:id` | Get event details | ADMIN |
| `POST` | `/admin/webhooks/incoming/:id/retry` | Retry failed processing | ADMIN |

### Request/Response Examples

#### Stripe Webhook Receiver

```http
POST /webhooks/stripe
Content-Type: application/json
Stripe-Signature: t=1234567890,v1=abc123...

{
  "id": "evt_1234567890",
  "type": "customer.subscription.updated",
  "data": { ... }
}
```

```json
{
  "received": true
}
```

#### List Incoming Events (Admin)

```http
GET /admin/webhooks/incoming?provider=stripe&verified=true&limit=20
Authorization: Bearer {token}
```

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "provider": "stripe",
      "eventType": "customer.subscription.updated",
      "eventId": "evt_1234567890",
      "verified": true,
      "processedAt": "2024-01-01T00:00:05Z",
      "error": null,
      "retryCount": 0,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 156,
    "limit": 20,
    "offset": 0
  }
}
```

#### Retry Failed Event (Admin)

```http
POST /admin/webhooks/incoming/550e8400-e29b-41d4-a716-446655440000/retry
Authorization: Bearer {token}
```

```json
{
  "queued": true,
  "jobId": "incoming-webhook:abc123"
}
```

---

## 7. Signature Verification

### Stripe Verification

Stripe uses HMAC-SHA256 signatures with a timestamp to prevent replay attacks.

```typescript
// apps/api/src/webhooks/incoming/stripe-webhook.service.ts
import Stripe from 'stripe';

export class StripeWebhookService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  verifyAndParse(rawBody: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }
}
```

### GitHub Verification (Future)

GitHub uses HMAC-SHA256 with the `X-Hub-Signature-256` header.

```typescript
// Future: apps/api/src/webhooks/incoming/github-webhook.service.ts
import crypto from 'crypto';

export function verifyGitHubSignature(
  rawBody: Buffer,
  signature: string,
  secret: string
): boolean {
  const expected = 'sha256=' + crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## 8. Event Processing Flow

### Webhook Receipt Flow

```
1. Receive POST request
   │
2. Extract raw body and signature header
   │
3. Store raw event in database (immediately)
   │
4. Attempt signature verification
   │  ├── Success: Mark verified = true
   │  └── Failure: Mark verified = false, return 400
   │
5. Check idempotency (event_id already exists?)
   │  ├── Exists + processed: Return 200 (already handled)
   │  └── Exists + unprocessed: Return 200 (in progress)
   │
6. Queue event for async processing
   │
7. Return 200 to provider immediately
```

### Worker Processing Flow

```
1. Dequeue event from incoming-webhook-processing queue
   │
2. Fetch event record from database
   │
3. Check if already processed (processed_at not null)
   │  └── If processed: Skip, mark job complete
   │
4. Check if verified
   │  └── If not verified: Skip, log warning
   │
5. Route to provider-specific handler
   │  ├── stripe: StripeWebhookHandler
   │  └── github: GitHubWebhookHandler (future)
   │
6. Handler processes based on event_type
   │
7. On success:
   │  ├── Set processed_at = NOW()
   │  └── Clear error
   │
8. On failure:
   │  ├── Increment retry_count
   │  ├── Set error message
   │  └── Throw to trigger BullMQ retry
```

---

## 9. Worker Handler

### Queue Configuration

```typescript
// apps/worker/src/config/queues.ts
export const INCOMING_WEBHOOK_QUEUE = 'incoming-webhook-processing';

export const incomingWebhookJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000, // 1s, 2s, 4s, 8s, 16s
  },
  removeOnComplete: 100,
  removeOnFail: false,
};
```

### Job Data Interface

```typescript
interface IncomingWebhookJobData {
  eventRecordId: string;  // UUID of incoming_webhook_events record
  provider: string;
  eventType: string;
  eventId: string;
}
```

### Main Handler

```typescript
// apps/worker/src/handlers/incoming-webhook.handler.ts
import { Job } from 'bullmq';
import { IncomingWebhookJobData } from '../types';

export async function incomingWebhookHandler(job: Job<IncomingWebhookJobData>) {
  const { eventRecordId, provider, eventType } = job.data;

  // Fetch event from database
  const event = await getEventRecord(eventRecordId);

  if (!event) {
    throw new Error(`Event record not found: ${eventRecordId}`);
  }

  if (event.processedAt) {
    // Already processed, skip
    return { skipped: true, reason: 'already_processed' };
  }

  if (!event.verified) {
    // Not verified, skip with warning
    console.warn(`Skipping unverified event: ${eventRecordId}`);
    return { skipped: true, reason: 'not_verified' };
  }

  try {
    // Route to provider handler
    switch (provider) {
      case 'stripe':
        await handleStripeEvent(event);
        break;
      case 'github':
        await handleGitHubEvent(event);
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    // Mark as processed
    await markEventProcessed(eventRecordId);

    return { success: true };
  } catch (error) {
    // Update retry count and error
    await updateEventError(eventRecordId, error.message, event.retryCount + 1);
    throw error; // Re-throw for BullMQ retry
  }
}
```

---

## 10. Stripe Event Handlers

### Handler Implementation

```typescript
// apps/worker/src/handlers/stripe-events.handler.ts
import Stripe from 'stripe';
import { IncomingWebhookEvent } from '@forgestack/db';

export async function handleStripeEvent(event: IncomingWebhookEvent) {
  const stripeEvent = event.payload as Stripe.Event;

  switch (stripeEvent.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(stripeEvent.data.object as Stripe.Checkout.Session);
      break;
    case 'customer.subscription.created':
      await handleSubscriptionCreated(stripeEvent.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(stripeEvent.data.object as Stripe.Subscription);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(stripeEvent.data.object as Stripe.Subscription);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(stripeEvent.data.object as Stripe.Invoice);
      break;
    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(stripeEvent.data.object as Stripe.Invoice);
      break;
    case 'customer.updated':
      await handleCustomerUpdated(stripeEvent.data.object as Stripe.Customer);
      break;
    default:
      console.log(`Unhandled Stripe event type: ${stripeEvent.type}`);
  }
}
```

### Event Handler Details

#### checkout.session.completed

```typescript
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Extract org_id from metadata (set during checkout creation)
  const orgId = session.metadata?.org_id;
  if (!orgId) throw new Error('Missing org_id in checkout metadata');

  // Create or update customer record
  await upsertCustomer({
    orgId,
    stripeCustomerId: session.customer as string,
    email: session.customer_email,
  });

  // Subscription is created via customer.subscription.created
}
```

#### customer.subscription.updated

```typescript
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find customer by Stripe customer ID
  const customer = await findCustomerByStripeId(subscription.customer as string);
  if (!customer) {
    console.warn(`Customer not found for subscription: ${subscription.id}`);
    return;
  }

  // Update subscription record
  await upsertSubscription({
    orgId: customer.orgId,
    customerId: customer.id,
    stripeSubscriptionId: subscription.id,
    stripePriceId: subscription.items.data[0]?.price.id,
    plan: extractPlanFromPrice(subscription.items.data[0]?.price),
    status: mapStripeStatus(subscription.status),
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    canceledAt: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000)
      : null,
  });
}
```

#### invoice.payment_failed

```typescript
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  // Update subscription to past_due
  await updateSubscriptionStatus(subscriptionId, 'past_due');

  // Future: Send notification to org owner
}
```

---

## 11. Frontend Components

### Admin Incoming Webhooks Page (Optional for V1)

```
apps/web/src/
├── app/(dashboard)/admin/webhooks/incoming/
│   ├── page.tsx                    # Incoming events list
│   └── [id]/page.tsx               # Event details page
└── components/admin/webhooks/
    ├── incoming-events-table.tsx   # Table with filters
    ├── event-details-modal.tsx     # Full event payload view
    ├── event-status-badge.tsx      # Verified/Processed status
    └── retry-button.tsx            # Manual retry action
```

### Key UI Features

| Component | Functionality |
|-----------|---------------|
| Events Table | List events with provider, type, status, timestamp |
| Status Badge | Show verified (✓/✗) and processed (✓/pending/failed) |
| Filters | Filter by provider, event_type, status |
| Payload View | Expandable JSON viewer for full payload |
| Retry Button | Trigger manual retry for failed events |
| Error Display | Show last error message for failed events |

---

## 12. Tasks

### Backend (apps/api)

#### 12.1 Create Incoming Webhooks Module
- [ ] Create `apps/api/src/webhooks/incoming/incoming-webhooks.module.ts`
- [ ] Register services and controllers
- [ ] Import QueueModule for job dispatching
- [ ] Import DrizzleModule for database access

#### 12.2 Implement Stripe Webhook Endpoint
- [ ] Create `apps/api/src/webhooks/incoming/stripe-webhook.controller.ts`
- [ ] Implement `POST /webhooks/stripe` endpoint
- [ ] Configure raw body parsing for signature verification
- [ ] Apply @Public() decorator (no auth required)
- [ ] Return 200 immediately after storing/queuing

#### 12.3 Implement Stripe Webhook Service
- [ ] Create `apps/api/src/webhooks/incoming/stripe-webhook.service.ts`
- [ ] Implement `verifyAndParse(rawBody, signature)` using Stripe SDK
- [ ] Implement `storeEvent(event)` to save raw event
- [ ] Implement `checkIdempotency(provider, eventId)`
- [ ] Implement `queueForProcessing(eventRecordId)`

#### 12.4 Implement Admin Endpoints
- [ ] Create `apps/api/src/webhooks/incoming/incoming-webhooks-admin.controller.ts`
- [ ] Implement `GET /admin/webhooks/incoming` with filters
- [ ] Implement `GET /admin/webhooks/incoming/:id`
- [ ] Implement `POST /admin/webhooks/incoming/:id/retry`
- [ ] Apply @Roles('ADMIN') guard

#### 12.5 Create DTOs
- [ ] Create `apps/api/src/webhooks/incoming/dto/incoming-event-query.dto.ts`
- [ ] Create `apps/api/src/webhooks/incoming/dto/incoming-event-response.dto.ts`
- [ ] Add class-validator decorators

### Database (packages/db)

#### 12.6 Add incoming_webhook_events Table
- [ ] Create `packages/db/src/schema/incoming-webhook-events.ts`
- [ ] Export from `packages/db/src/schema/index.ts`
- [ ] Generate migration
- [ ] Add RLS policies
- [ ] Add indexes

### Worker (apps/worker)

#### 12.7 Add Incoming Webhook Processing Queue
- [ ] Add `incoming-webhook-processing` queue to `config/queues.ts`
- [ ] Configure retry options with exponential backoff

#### 12.8 Implement Incoming Webhook Handler
- [ ] Create `apps/worker/src/handlers/incoming-webhook.handler.ts`
- [ ] Implement main handler with provider routing
- [ ] Implement error handling and retry count update

#### 12.9 Implement Stripe Event Handlers
- [ ] Create `apps/worker/src/handlers/stripe-events.handler.ts`
- [ ] Implement `handleCheckoutCompleted()`
- [ ] Implement `handleSubscriptionCreated()`
- [ ] Implement `handleSubscriptionUpdated()`
- [ ] Implement `handleSubscriptionDeleted()`
- [ ] Implement `handleInvoicePaid()`
- [ ] Implement `handleInvoicePaymentFailed()`
- [ ] Implement `handleCustomerUpdated()`

#### 12.10 Register Handler
- [ ] Register handler in `apps/worker/src/worker.ts`
- [ ] Add connection and worker configuration

### Frontend (apps/web) - Optional for V1

#### 12.11 Create Admin Webhooks Page
- [ ] Create `apps/web/src/app/(dashboard)/admin/webhooks/incoming/page.tsx`
- [ ] Implement incoming events list view
- [ ] Add filters (provider, status)

#### 12.12 Create Supporting Components
- [ ] Create `apps/web/src/components/admin/webhooks/incoming-events-table.tsx`
- [ ] Create `apps/web/src/components/admin/webhooks/event-details-modal.tsx`
- [ ] Create `apps/web/src/components/admin/webhooks/retry-button.tsx`

---

## 13. Test Plan

### Unit Tests

#### Signature Verification Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Valid Stripe signature | Event parsed successfully |
| Invalid Stripe signature | Throws verification error |
| Missing signature header | Throws error |
| Expired timestamp (replay attack) | Throws verification error |

#### Idempotency Tests
| Test Case | Expected Result |
|-----------|-----------------|
| New event (unique event_id) | Event stored, job queued |
| Duplicate event (same provider + event_id) | Returns 200, no duplicate |
| Same event_id, different provider | Both events stored |

#### Event Handler Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `checkout.session.completed` | Customer created, linked to org |
| `customer.subscription.created` | Subscription record created |
| `customer.subscription.updated` | Subscription status/dates updated |
| `customer.subscription.deleted` | Subscription marked canceled |
| `invoice.paid` | Subscription status updated to active |
| `invoice.payment_failed` | Subscription status updated to past_due |

### Integration Tests

#### Webhook Endpoint Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Valid Stripe webhook | 200, event stored, job queued |
| Invalid signature | 400 Bad Request |
| Duplicate event | 200, no duplicate stored |
| Missing Stripe-Signature header | 400 Bad Request |

#### Worker Processing Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Process verified event | processed_at set, no error |
| Skip unverified event | Skipped with warning |
| Skip already processed event | Skipped |
| Handler error | retry_count incremented, error logged |
| Max retries exceeded | Job failed, not requeued |

### E2E Test Scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| Stripe subscription sync | 1. Stripe sends subscription.updated 2. Worker processes | Local subscription matches Stripe |
| Payment failure handling | 1. Stripe sends invoice.payment_failed 2. Worker processes | Subscription marked past_due |
| Duplicate webhook handling | 1. Send same event twice | Second returns 200, no duplicate processing |
| Admin view logs | 1. Receive webhooks 2. Admin views log | Events visible with correct status |
| Manual retry | 1. Event processing fails 2. Admin retries | Event reprocessed successfully |

---

## 14. Security Considerations

| Consideration | Implementation |
|---------------|----------------|
| Signature verification | Always verify signatures before processing |
| Public endpoints | Webhook endpoints are public but signature-protected |
| Raw payload storage | Store raw payload for debugging and audit |
| No auth on receivers | Webhook endpoints bypass auth middleware |
| Secrets management | Provider secrets stored in environment variables |
| RLS compliance | org_id nullable for system-level events |
| Timing attacks | Use constant-time comparison for signature verification |
| Replay prevention | Stripe signatures include timestamp |
| Return fast | Return 200 immediately, process async |

---

## 15. Constraints

| Constraint | Requirement |
|------------|-------------|
| Endpoint security | Webhooks verified by signature, not auth token |
| Response time | Must return 200 within 5 seconds |
| Processing mode | All processing via BullMQ worker (async) |
| Idempotency | Unique constraint on (provider, event_id) |
| RLS | org_id nullable for webhooks without org context |
| Retry limit | Max 5 retry attempts per event |
| Verification | Only verified events are processed |

---

## 16. Implementation Notes

### Project Structure

```
apps/api/src/webhooks/incoming/
├── incoming-webhooks.module.ts
├── stripe-webhook.controller.ts       # POST /webhooks/stripe
├── stripe-webhook.service.ts          # Verification, storage, queuing
├── incoming-webhooks-admin.controller.ts  # Admin endpoints
└── dto/
    ├── incoming-event-query.dto.ts
    └── incoming-event-response.dto.ts

apps/worker/src/handlers/
├── incoming-webhook.handler.ts        # Main handler with routing
└── stripe-events.handler.ts           # Stripe-specific event handlers

packages/db/src/schema/
└── incoming-webhook-events.ts

apps/web/src/  (optional for V1)
├── app/(dashboard)/admin/webhooks/incoming/
│   ├── page.tsx
│   └── [id]/page.tsx
└── components/admin/webhooks/
    ├── incoming-events-table.tsx
    └── event-details-modal.tsx
```

### Raw Body Configuration for NestJS

```typescript
// apps/api/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,  // Enable raw body access
  });

  // Configure raw body for webhook endpoints
  app.use('/webhooks', json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  }));

  await app.listen(3000);
}
```

### Controller Implementation

```typescript
// apps/api/src/webhooks/incoming/stripe-webhook.controller.ts
import { Controller, Post, Req, Headers, HttpCode, BadRequestException } from '@nestjs/common';
import { Public } from '@/auth/decorators/public.decorator';
import { StripeWebhookService } from './stripe-webhook.service';

@Controller('webhooks')
export class StripeWebhookController {
  constructor(private stripeWebhookService: StripeWebhookService) {}

  @Post('stripe')
  @Public()  // No auth required
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: { rawBody: Buffer },
    @Headers('stripe-signature') signature: string,
  ) {
    if (!signature) {
      throw new BadRequestException('Missing stripe-signature header');
    }

    const result = await this.stripeWebhookService.handleWebhook(
      req.rawBody,
      signature,
    );

    return { received: true, eventId: result.eventId };
  }
}
```

---

## 17. Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Yes | - |
| `GITHUB_WEBHOOK_SECRET` | GitHub webhook secret (future) | No | - |
| `INCOMING_WEBHOOK_RETENTION_DAYS` | How long to keep event logs | No | 90 |

**Example `.env`:**
```env
# Webhook Secrets
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Future providers
# GITHUB_WEBHOOK_SECRET=xxx

# Configuration
INCOMING_WEBHOOK_RETENTION_DAYS=90
```

---

## 18. Dependencies

### Backend (`/apps/api`)

| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | `^14.x` | Stripe SDK (already installed via billing) |

### Worker (`/apps/worker`)

| Package | Version | Purpose |
|---------|---------|---------|
| `bullmq` | `^5.x` | Job processing (already installed) |
| `stripe` | `^14.x` | Stripe SDK for event types |

---

## 19. Observability

### Logging

```
[INFO] [Webhook] Received Stripe webhook: evt_123 (customer.subscription.updated)
[INFO] [Webhook] Event stored: 550e8400-...
[INFO] [Webhook] Event queued for processing: 550e8400-...
[INFO] [Worker] Processing incoming webhook: 550e8400-...
[INFO] [Worker] Stripe event handled: customer.subscription.updated
[INFO] [Worker] Event marked as processed: 550e8400-...
[WARN] [Worker] Skipping unverified event: 550e8400-...
[ERROR] [Worker] Failed to process webhook: {error}
```

### Metrics (Future)

- Webhooks received per provider per hour
- Verification success/failure rate
- Processing latency (received → processed)
- Retry rate per event type
- Failed events count

---

## 20. Relationship with Stripe Billing Integration

This spec extends the Stripe Billing Integration (Priority #10) by:

1. **Replacing inline webhook processing** – Instead of processing webhooks directly in the API endpoint, events are stored and queued
2. **Adding observability** – All incoming events are logged for debugging
3. **Improving reliability** – Worker processing with retries ensures events aren't lost
4. **Enabling idempotency** – Duplicate events are handled gracefully

The existing `billing_events` table from the Stripe Integration spec can be deprecated in favor of `incoming_webhook_events`, or kept for backward compatibility.

---

*End of spec*

