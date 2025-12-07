# Billing Feature

ForgeStack integrates with Stripe for subscription billing, usage metering, and customer management.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Pricing Page    │  │ Billing Settings│  │ Usage Dashboard │ │
│  │ Plan selection  │  │ Subscription    │  │ API calls       │ │
│  │ Checkout button │  │ Portal link     │  │ Storage         │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                    │
            ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API (NestJS)                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  BillingController                                           ││
│  │  POST /billing/checkout    → Create Stripe Checkout         ││
│  │  POST /billing/portal      → Create Customer Portal         ││
│  │  GET  /billing/subscription → Get current subscription      ││
│  │  POST /billing/webhook     → Handle Stripe webhooks         ││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  BillingService / StripeService                              ││
│  │  - Customer management                                       ││
│  │  - Checkout session creation                                 ││
│  │  - Subscription queries                                      ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Stripe                                    │
│  - Customers                                                     │
│  - Subscriptions                                                 │
│  - Checkout Sessions                                             │
│  - Customer Portal                                               │
│  - Webhooks                                                      │
└─────────────────────────────────────────────────────────────────┘
            │
            │ Webhook Events
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Worker (BullMQ)                           │
│  stripe-webhook.handler.ts                                       │
│  - checkout.session.completed → Create subscription record      │
│  - customer.subscription.updated → Update subscription          │
│  - invoice.paid → Log billing event                             │
│  - invoice.payment_failed → Notify owners                       │
└─────────────────────────────────────────────────────────────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/billing/billing.controller.ts` | Billing endpoints |
| `apps/api/src/billing/billing.service.ts` | Business logic |
| `apps/api/src/billing/stripe.service.ts` | Stripe API wrapper |
| `apps/api/src/billing/billing.repository.ts` | Database operations |
| `apps/worker/src/handlers/stripe-webhook.handler.ts` | Webhook processing |
| `apps/web/src/hooks/use-billing.ts` | Frontend billing hook |

## Environment Variables

```bash
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRICE_ID_STARTER="price_..."
STRIPE_PRICE_ID_PRO="price_..."
STRIPE_PRICE_ID_ENTERPRISE="price_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## Database Tables

| Table | Purpose |
|-------|---------|
| `customers` | Stripe customer ↔ organization mapping |
| `subscriptions` | Active subscription details |
| `billing_events` | Billing event history |
| `plans` | Available subscription plans |
| `usage_records` | Usage tracking for metered billing |
| `usage_limits` | Plan-based usage limits |

## Frontend Usage

### useBilling Hook

```typescript
import { useBilling } from '@/hooks/use-billing';

function BillingPage() {
  const { subscription, isLoading, startCheckout, openPortal } = useBilling({
    orgId: currentOrg.id,
  });

  // Start checkout for a plan
  const handleUpgrade = async () => {
    await startCheckout('price_pro_monthly');
  };

  // Open Stripe Customer Portal
  const handleManage = async () => {
    await openPortal();
  };
}
```

### useUsageSummary Hook

```typescript
import { useUsageSummary } from '@/hooks/use-usage';

function UsageDashboard() {
  const { data: usage, isLoading } = useUsageSummary({ orgId: currentOrg.id });

  return (
    <div>
      <p>API Calls: {usage.apiCalls.used} / {usage.apiCalls.limit}</p>
      <p>Storage: {usage.storage.usedBytes} / {usage.storage.limitBytes}</p>
    </div>
  );
}
```

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/billing/checkout` | Create checkout session | OWNER |
| `POST` | `/billing/portal` | Create portal session | OWNER |
| `GET` | `/billing/subscription` | Get subscription | Yes |
| `GET` | `/billing/invoices` | List invoices | OWNER |
| `GET` | `/billing/usage` | Get usage summary | Yes |
| `POST` | `/billing/webhook` | Stripe webhook | Public |

## Subscription Plans

| Plan | Features |
|------|----------|
| **Free** | 1 project, 1K API calls/month, 100MB storage |
| **Starter** | 10 projects, 50K API calls/month, 5GB storage |
| **Pro** | Unlimited projects, 500K API calls/month, 50GB storage |
| **Enterprise** | Custom limits, SSO, audit logs, priority support |

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Create customer & subscription |
| `customer.subscription.created` | Store subscription |
| `customer.subscription.updated` | Update subscription status |
| `customer.subscription.deleted` | Mark subscription cancelled |
| `invoice.paid` | Log billing event |
| `invoice.payment_failed` | Notify org owners |

## Usage Metering

```typescript
// Track API call (done automatically by UsageTrackingInterceptor)
await usageTrackingService.trackApiCall(orgId, {
  endpoint: '/api/projects',
  method: 'GET',
  durationMs: 45,
  timestamp: new Date(),
});

// Track storage change
await usageTrackingService.trackStorageChange(orgId, bytesAdded);
```

