# Stripe Billing Integration

**Epic:** Billing  
**Priority:** #10  
**Depends on:** Priority #6 (Organization Management), Priority #9 (BullMQ Worker)  
**Status:** Draft

---

## 1. Context

### Why Billing Is Needed

ForgeStack requires a billing system to monetize the platform and manage customer subscriptions. Organizations need the ability to:
- Subscribe to paid plans with different feature tiers
- Manage their subscription (upgrade, downgrade, cancel)
- Access billing history and invoices
- Update payment methods

### Business Value

- **Revenue generation** – Enable monetization through subscription plans
- **Self-service billing** – Reduce support overhead with customer billing portal
- **Usage tracking** – Foundation for usage-based billing in the future
- **Compliance** – Proper invoice generation and payment records

### Technical Approach

**Stripe** is the chosen payment provider due to:
- Industry-standard payment processing
- Built-in subscription management
- Customer billing portal (hosted by Stripe)
- Robust webhook system for event-driven updates
- Strong developer experience and documentation

All billing events are processed asynchronously via **BullMQ worker** to ensure reliability and prevent API timeouts.

---

## 2. User Stories

### US-1: Subscribe to a Plan
**As an** organization owner,  
**I want to** subscribe to a plan,  
**So that** my organization can access premium features.

### US-2: Manage Subscription
**As an** organization owner,  
**I want to** upgrade, downgrade, or cancel my subscription,  
**So that** I can adjust my plan based on my needs.

### US-3: Access Billing Portal
**As an** organization owner,  
**I want to** access the Stripe billing portal,  
**So that** I can view invoices, update payment methods, and manage billing details.

### US-4: Process Stripe Webhooks
**As the** system,  
**I want to** process Stripe webhook events reliably,  
**So that** subscription and payment states stay synchronized.

---

## 3. Acceptance Criteria

### US-1: Subscribe to a Plan
- [ ] Organization owner can view available plans
- [ ] Clicking "Subscribe" redirects to Stripe Checkout
- [ ] After successful payment, subscription is active immediately
- [ ] Customer record is created/linked to organization
- [ ] Subscription record is created with correct plan and status
- [ ] Non-owners cannot initiate subscription

### US-2: Manage Subscription
- [ ] Organization owner can view current subscription status
- [ ] Owner can upgrade to a higher tier plan
- [ ] Owner can downgrade to a lower tier plan (effective at period end)
- [ ] Owner can cancel subscription (effective at period end)
- [ ] Owner can reactivate a canceled subscription before period end
- [ ] Subscription changes are reflected in real-time after webhook processing

### US-3: Access Billing Portal
- [ ] Organization owner can click "Manage Billing" to access portal
- [ ] Portal session is created with return URL to app
- [ ] Portal allows viewing invoices and payment history
- [ ] Portal allows updating payment methods
- [ ] Portal allows managing subscription
- [ ] Non-owners cannot access billing portal

### US-4: Process Stripe Webhooks
- [ ] Webhook endpoint accepts POST requests without auth
- [ ] Webhook signature is verified using STRIPE_WEBHOOK_SECRET
- [ ] Invalid signatures return 400 Bad Request
- [ ] Valid webhooks are queued to BullMQ for processing
- [ ] Webhook endpoint returns 200 immediately after queuing
- [ ] Worker processes: `checkout.session.completed`
- [ ] Worker processes: `customer.subscription.created`
- [ ] Worker processes: `customer.subscription.updated`
- [ ] Worker processes: `customer.subscription.deleted`
- [ ] Worker processes: `invoice.paid`
- [ ] Worker processes: `invoice.payment_failed`
- [ ] All webhook events are logged to billing_events table
- [ ] Failed webhook processing retries with exponential backoff

---

## 4. Database Schema

### 4.1 customers Table

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookups
CREATE UNIQUE INDEX idx_customers_org_id ON customers(org_id);
CREATE INDEX idx_customers_stripe_customer_id ON customers(stripe_customer_id);

-- RLS Policy
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY customers_org_isolation ON customers
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

### 4.2 subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_price_id TEXT NOT NULL,
  plan TEXT NOT NULL, -- 'basic', 'pro', 'enterprise'
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', 'unpaid'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- RLS Policy
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY subscriptions_org_isolation ON subscriptions
  USING (org_id = current_setting('app.current_org_id')::uuid);
```

### 4.3 billing_events Table

```sql
CREATE TABLE billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  stripe_event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_billing_events_org_id ON billing_events(org_id);
CREATE INDEX idx_billing_events_stripe_event_id ON billing_events(stripe_event_id);
CREATE INDEX idx_billing_events_event_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_processed_at ON billing_events(processed_at);

-- RLS Policy (nullable org_id for system events)
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY billing_events_org_isolation ON billing_events
  USING (
    org_id IS NULL OR
    org_id = current_setting('app.current_org_id')::uuid
  );
```

---

## 5. API Endpoints

### 5.1 POST /api/v1/billing/checkout – Create Checkout Session

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |
| Required Role | OWNER |
| Request Body | `{ priceId: string, successUrl?: string, cancelUrl?: string }` |
| Response (200) | `{ checkoutUrl: string, sessionId: string }` |
| Response (403) | If user is not OWNER |

**Behavior:**
- Creates or retrieves Stripe customer for organization
- Creates Stripe Checkout session with subscription mode
- Returns Stripe-hosted checkout URL
- Stores checkout session ID for correlation

### 5.2 POST /api/v1/billing/portal – Create Billing Portal Session

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |
| Required Role | OWNER |
| Request Body | `{ returnUrl?: string }` |
| Response (200) | `{ portalUrl: string }` |
| Response (403) | If user is not OWNER |
| Response (404) | If no customer exists for organization |

**Behavior:**
- Retrieves Stripe customer for organization
- Creates Stripe billing portal session
- Returns portal URL for redirect

### 5.3 GET /api/v1/billing/subscription – Get Current Subscription

| Property | Value |
|----------|-------|
| Auth Required | Yes |
| Org Context Required | Yes |
| Required Role | MEMBER (any role) |
| Response (200) | `{ subscription: SubscriptionDto \| null }` |

**Response DTO:**
```typescript
interface SubscriptionDto {
  id: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'unpaid';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}
```

### 5.4 POST /api/v1/billing/webhook – Stripe Webhook Endpoint

| Property | Value |
|----------|-------|
| Auth Required | **No** (public endpoint) |
| Org Context Required | No |
| Request Headers | `stripe-signature` required |
| Request Body | Raw Stripe event payload |
| Response (200) | `{ received: true }` |
| Response (400) | Invalid signature |

**Behavior:**
- Verifies Stripe webhook signature
- Queues event to BullMQ `stripe-webhook` queue
- Returns 200 immediately (async processing)
- Does NOT process inline to avoid timeout

---

## 6. Worker Jobs

### 6.1 handle-stripe-webhook

**Queue:** `stripe-webhook`

**Job Data:**
```typescript
interface StripeWebhookJobData {
  eventId: string;
  eventType: string;
  payload: Stripe.Event;
}
```

**Processing Logic:**

1. **checkout.session.completed**
   - Extract customer ID and subscription ID
   - Link customer to organization (from metadata)
   - Create/update subscription record
   - Log event to billing_events

2. **customer.subscription.created**
   - Create subscription record
   - Set status to subscription.status
   - Extract plan from price metadata
   - Log event to billing_events

3. **customer.subscription.updated**
   - Update subscription status
   - Update period start/end
   - Update cancel_at_period_end flag
   - Handle plan changes
   - Log event to billing_events

4. **customer.subscription.deleted**
   - Update subscription status to 'canceled'
   - Set canceled_at timestamp
   - Log event to billing_events

5. **invoice.paid**
   - Update subscription status if needed
   - Log event to billing_events

6. **invoice.payment_failed**
   - Update subscription status to 'past_due'
   - Log event to billing_events
   - (Future: trigger notification)

**Retry Configuration:**
- Attempts: 5
- Backoff: Exponential (1s, 2s, 4s, 8s, 16s)

### 6.2 sync-subscription-status (Optional/Manual)

**Queue:** `billing-sync`

**Job Data:**
```typescript
interface SyncSubscriptionJobData {
  stripeSubscriptionId: string;
}
```

**Behavior:**
- Fetches latest subscription state from Stripe API
- Updates local subscription record
- Used for reconciliation if webhooks missed

---

## 7. Frontend Pages/Components

### 7.1 Billing Settings Page

**Route:** `/settings/billing`

**Components:**
- Current plan display
- Subscription status badge
- Period end date
- Upgrade/Downgrade buttons
- Cancel subscription button
- Manage Billing button (portal)

**Access Control:**
- Page visible to all org members
- Action buttons visible only to OWNER

### 7.2 Plan Selection Component

**Usage:** Checkout flow, upgrade modal

**Features:**
- Display available plans with features
- Highlight current plan
- Show price per month/year
- "Select Plan" button triggers checkout

### 7.3 Subscription Status Display

**Usage:** Dashboard, billing page

**Features:**
- Plan name badge
- Status indicator (active, past_due, etc.)
- Days remaining in period
- Warning for past_due status

### 7.4 Upgrade/Downgrade Flow

**Features:**
- Modal showing plan comparison
- Preview of prorated charges
- Confirmation before action
- Success/error feedback
- Redirect to Stripe Checkout for payment method if needed

---

## 8. Tasks

### 8.1 Backend (apps/api)

#### 8.1.1 Create Billing Module
- [ ] Create `apps/api/src/billing/billing.module.ts`
- [ ] Import StripeService, BillingService
- [ ] Register controller
- [ ] Export services

#### 8.1.2 Implement Stripe Service
- [ ] Create `apps/api/src/billing/stripe.service.ts`
- [ ] Initialize Stripe client with STRIPE_SECRET_KEY
- [ ] Implement `createCustomer(orgId, email, name)`
- [ ] Implement `getCustomer(stripeCustomerId)`
- [ ] Implement `createCheckoutSession(customerId, priceId, metadata)`
- [ ] Implement `createPortalSession(customerId, returnUrl)`
- [ ] Implement `getSubscription(subscriptionId)`
- [ ] Implement `verifyWebhookSignature(payload, signature)`

#### 8.1.3 Implement Billing Service
- [ ] Create `apps/api/src/billing/billing.service.ts`
- [ ] Implement `getOrCreateCustomer(orgId)`
- [ ] Implement `createCheckout(orgId, priceId, urls)`
- [ ] Implement `createPortalSession(orgId, returnUrl)`
- [ ] Implement `getSubscription(orgId)`
- [ ] Use `withTenantContext()` for all DB operations

#### 8.1.4 Create Billing Controller
- [ ] Create `apps/api/src/billing/billing.controller.ts`
- [ ] Implement `POST /billing/checkout`
- [ ] Implement `POST /billing/portal`
- [ ] Implement `GET /billing/subscription`
- [ ] Implement `POST /billing/webhook` (no auth, raw body)
- [ ] Apply @Roles('OWNER') to checkout and portal
- [ ] Apply @Public() to webhook endpoint

#### 8.1.5 Create DTOs
- [ ] Create `apps/api/src/billing/dto/create-checkout.dto.ts`
- [ ] Create `apps/api/src/billing/dto/create-portal.dto.ts`
- [ ] Create `apps/api/src/billing/dto/subscription.dto.ts`

#### 8.1.6 Add Billing Guards/Decorators
- [ ] Create @Public() decorator for webhook endpoint
- [ ] Configure raw body parsing for webhook endpoint

### 8.2 Database (packages/db)

#### 8.2.1 Add customers Table
- [ ] Create migration for customers table
- [ ] Add Drizzle schema definition
- [ ] Add RLS policy
- [ ] Add indexes

#### 8.2.2 Add subscriptions Table
- [ ] Create migration for subscriptions table
- [ ] Add Drizzle schema definition
- [ ] Add RLS policy
- [ ] Add indexes

#### 8.2.3 Add billing_events Table
- [ ] Create migration for billing_events table
- [ ] Add Drizzle schema definition
- [ ] Add RLS policy (with NULL org_id handling)
- [ ] Add indexes

#### 8.2.4 Create Billing Repository
- [ ] Create `packages/db/src/repositories/billing.repository.ts`
- [ ] Implement `createCustomer()`
- [ ] Implement `findCustomerByOrgId()`
- [ ] Implement `findCustomerByStripeId()`
- [ ] Implement `upsertSubscription()`
- [ ] Implement `findSubscriptionByOrgId()`
- [ ] Implement `logBillingEvent()`

### 8.3 Worker (apps/worker)

#### 8.3.1 Add Stripe Webhook Handler
- [ ] Create `apps/worker/src/handlers/stripe-webhook.handler.ts`
- [ ] Initialize Stripe client
- [ ] Handle `checkout.session.completed`
- [ ] Handle `customer.subscription.created`
- [ ] Handle `customer.subscription.updated`
- [ ] Handle `customer.subscription.deleted`
- [ ] Handle `invoice.paid`
- [ ] Handle `invoice.payment_failed`

#### 8.3.2 Register Stripe Queue
- [ ] Add `stripe-webhook` queue to worker config
- [ ] Configure retry options
- [ ] Add event logging

#### 8.3.3 Add Sync Job Handler (Optional)
- [ ] Create `apps/worker/src/handlers/billing-sync.handler.ts`
- [ ] Implement subscription sync logic

### 8.4 Frontend (apps/web)

#### 8.4.1 Billing Settings Page
- [ ] Create `apps/web/src/app/(dashboard)/settings/billing/page.tsx`
- [ ] Display current subscription
- [ ] Add manage billing button
- [ ] Add upgrade/cancel buttons (OWNER only)

#### 8.4.2 Plan Selection UI
- [ ] Create `apps/web/src/components/billing/plan-selector.tsx`
- [ ] Display plan cards with features
- [ ] Highlight current plan
- [ ] Handle plan selection

#### 8.4.3 Checkout Flow
- [ ] Create `apps/web/src/hooks/use-billing.ts`
- [ ] Implement `startCheckout(priceId)`
- [ ] Handle redirect to Stripe Checkout
- [ ] Handle return from checkout (success/cancel)

#### 8.4.4 Portal Redirect
- [ ] Implement `openBillingPortal()`
- [ ] Handle redirect to Stripe portal
- [ ] Handle return from portal

#### 8.4.5 Subscription Status Component
- [ ] Create `apps/web/src/components/billing/subscription-status.tsx`
- [ ] Display plan and status
- [ ] Show renewal date
- [ ] Warning states for past_due

---

## 9. Test Plan

### 9.1 Unit Tests

#### Stripe Service Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `createCustomer()` calls Stripe API | Customer created with correct params |
| `createCheckoutSession()` returns session URL | Valid Stripe checkout URL |
| `createPortalSession()` returns portal URL | Valid Stripe portal URL |
| `verifyWebhookSignature()` with valid signature | Returns parsed event |
| `verifyWebhookSignature()` with invalid signature | Throws error |

#### Billing Repository Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `createCustomer()` inserts record | Customer record created |
| `findCustomerByOrgId()` returns customer | Correct customer returned |
| `upsertSubscription()` creates new | Subscription created |
| `upsertSubscription()` updates existing | Subscription updated |
| `logBillingEvent()` inserts event | Event logged |

#### Webhook Handler Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Handle `checkout.session.completed` | Customer and subscription created |
| Handle `customer.subscription.updated` | Subscription status updated |
| Handle `customer.subscription.deleted` | Subscription marked canceled |
| Handle `invoice.payment_failed` | Subscription marked past_due |

### 9.2 Integration Tests

#### API Endpoint Tests
| Test Case | Expected Result |
|-----------|-----------------|
| `POST /billing/checkout` as OWNER | Returns checkout URL |
| `POST /billing/checkout` as MEMBER | Returns 403 |
| `POST /billing/checkout` without auth | Returns 401 |
| `POST /billing/portal` as OWNER | Returns portal URL |
| `POST /billing/portal` no customer | Returns 404 |
| `GET /billing/subscription` | Returns subscription or null |
| `POST /billing/webhook` valid signature | Returns 200, job queued |
| `POST /billing/webhook` invalid signature | Returns 400 |

#### Database Tests
| Test Case | Expected Result |
|-----------|-----------------|
| Customer RLS prevents cross-org access | Other org's customers not visible |
| Subscription RLS prevents cross-org access | Other org's subscriptions not visible |
| billing_events with null org_id accessible | System events readable |

### 9.3 E2E Tests (Mocked Stripe)

| Scenario | Steps | Expected |
|----------|-------|----------|
| Complete checkout flow | 1. Select plan 2. Complete checkout (mocked) 3. Webhook fires | Subscription active |
| Upgrade subscription | 1. View billing 2. Click upgrade 3. Complete checkout | Plan upgraded |
| Cancel subscription | 1. View billing 2. Click cancel 3. Confirm | cancel_at_period_end = true |
| Access billing portal | 1. Click Manage Billing 2. Redirect to portal | Portal loads |
| Webhook retry on failure | 1. Simulate handler failure 2. Check retries | Job retried 5 times |
| Non-owner cannot checkout | 1. Login as MEMBER 2. Try checkout | 403 error |

---

## 10. Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | Yes | - |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (frontend) | Yes | - |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Yes | - |
| `STRIPE_PRICE_ID_BASIC` | Price ID for Basic plan | No | - |
| `STRIPE_PRICE_ID_PRO` | Price ID for Pro plan | No | - |
| `STRIPE_PRICE_ID_ENTERPRISE` | Price ID for Enterprise plan | No | - |

**Example `.env`:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_BASIC=price_...
STRIPE_PRICE_ID_PRO=price_...
```

---

## 11. Implementation Notes

### Project Structure

```
apps/api/src/
├── billing/
│   ├── billing.module.ts
│   ├── billing.controller.ts
│   ├── billing.service.ts
│   ├── stripe.service.ts
│   └── dto/
│       ├── create-checkout.dto.ts
│       ├── create-portal.dto.ts
│       └── subscription.dto.ts

packages/db/src/
├── schema/
│   ├── customers.ts
│   ├── subscriptions.ts
│   └── billing-events.ts
├── repositories/
│   └── billing.repository.ts
└── migrations/
    └── XXXX_add_billing_tables.ts

apps/worker/src/
├── handlers/
│   ├── stripe-webhook.handler.ts
│   └── billing-sync.handler.ts
└── config/
    └── queues.ts  # Add stripe-webhook queue

apps/web/src/
├── app/(dashboard)/
│   └── settings/
│       └── billing/
│           └── page.tsx
├── components/
│   └── billing/
│       ├── plan-selector.tsx
│       └── subscription-status.tsx
└── hooks/
    └── use-billing.ts
```

### Webhook Endpoint Raw Body Configuration

```typescript
// apps/api/src/billing/billing.controller.ts
@Post('webhook')
@Public()
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Headers('stripe-signature') signature: string,
) {
  const event = this.stripeService.verifyWebhookSignature(
    req.rawBody,
    signature,
  );

  await this.queueService.addStripeWebhookJob({
    eventId: event.id,
    eventType: event.type,
    payload: event,
  });

  return { received: true };
}
```

### Drizzle Schema Example

```typescript
// packages/db/src/schema/customers.ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { organizations } from './organizations';

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').notNull().unique(),
  email: text('email'),
  name: text('name'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

---

## 12. Security Considerations

1. **Webhook signature verification** – Always verify Stripe signatures; never trust unverified payloads
2. **Secret key protection** – STRIPE_SECRET_KEY must never be exposed to frontend
3. **RLS enforcement** – All billing tables have org_id scoped RLS policies
4. **Role-based access** – Only OWNER can initiate checkout or access portal
5. **Idempotency** – Webhook handlers must be idempotent (use stripe_event_id as unique key)
6. **No PII in logs** – Avoid logging sensitive customer data
7. **HTTPS only** – Webhook endpoint must be HTTPS in production

---

## 13. Dependencies

### Backend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `stripe` | `^14.x` | Stripe Node.js SDK |

### Frontend Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@stripe/stripe-js` | `^2.x` | Stripe.js for frontend |

---

## 14. Observability

### Logging

```
[INFO] [Billing] Creating checkout session for org {orgId}
[INFO] [Billing] Checkout session created: {sessionId}
[INFO] [Worker] Processing stripe-webhook: {eventType} {eventId}
[INFO] [Worker] Subscription updated: {subscriptionId} -> {status}
[ERROR] [Worker] Failed to process webhook: {error}
```

### Metrics (Future)

- Checkout sessions created per day
- Subscription conversions (checkout → active)
- Churn rate (cancellations per month)
- Failed payments count
- Webhook processing latency

---

## 15. Future Enhancements (Out of Scope)

- Usage-based billing
- Multiple subscriptions per organization
- Coupon/discount codes
- Trial periods
- Annual billing discounts
- Invoice PDF download
- Payment failure email notifications
- Subscription pause/resume
- Prorated upgrades preview
- Multi-currency support

---

*End of spec*

