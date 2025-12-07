# Webhooks Feature

ForgeStack supports both outgoing webhooks (sending events to external URLs) and incoming webhooks (receiving events from Stripe).

## Outgoing Webhooks

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        API (NestJS)                              │
│  Event occurs (e.g., project.created)                            │
│           │                                                      │
│           ▼                                                      │
│  WebhooksService.triggerEvent(ctx, 'project.created', payload)  │
│           │                                                      │
│           ▼                                                      │
│  Queue webhook-delivery job for each matching endpoint           │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Worker (BullMQ)                           │
│  webhook-delivery.handler.ts                                     │
│  1. Fetch endpoint details                                       │
│  2. Sign payload with HMAC-SHA256                                │
│  3. POST to endpoint URL                                         │
│  4. Record delivery status                                       │
│  5. Retry on failure (exponential backoff)                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Endpoint                             │
│  POST https://example.com/webhook                                │
│  Headers:                                                        │
│    X-Webhook-Signature: sha256=abc123...                        │
│    X-Webhook-Event: project.created                              │
│    X-Webhook-Delivery-Id: uuid                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/webhooks/webhooks.controller.ts` | Endpoint CRUD |
| `apps/api/src/webhooks/webhooks.service.ts` | Trigger events |
| `apps/worker/src/handlers/webhook-delivery.handler.ts` | Delivery |
| `packages/db/src/schema/webhook-endpoints.ts` | Endpoints table |
| `packages/db/src/schema/webhook-deliveries.ts` | Deliveries table |

### Event Types

| Event | Trigger |
|-------|---------|
| `project.created` | New project created |
| `project.updated` | Project updated |
| `project.deleted` | Project deleted |
| `member.invited` | Member invitation sent |
| `member.joined` | Member accepted invitation |
| `member.removed` | Member removed from org |
| `member.role_changed` | Member role updated |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/webhooks` | List webhook endpoints |
| `POST` | `/webhooks` | Create endpoint |
| `GET` | `/webhooks/:id` | Get endpoint details |
| `PATCH` | `/webhooks/:id` | Update endpoint |
| `DELETE` | `/webhooks/:id` | Delete endpoint |
| `GET` | `/webhooks/:id/deliveries` | List deliveries |
| `POST` | `/webhooks/:id/test` | Send test event |

### Triggering Webhooks

```typescript
// In any service after an event
await this.webhooksService.triggerEvent(ctx, 'project.created', {
  project: {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
  },
});
```

### Webhook Payload Format

```json
{
  "id": "evt_abc123",
  "type": "project.created",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "project": {
      "id": "proj_xyz",
      "name": "My Project",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Signature Verification (Receiver Side)

```typescript
import crypto from 'crypto';

function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  );
}
```

---

## Incoming Webhooks (Stripe)

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Stripe                                    │
│  Sends webhook to: POST /api/v1/billing/webhook                 │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API (NestJS)                              │
│  BillingController.handleWebhook()                               │
│  1. Verify Stripe signature                                      │
│  2. Log event to billing_events table                            │
│  3. Queue for processing                                         │
│  4. Return 200 immediately                                       │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Worker (BullMQ)                           │
│  stripe-webhook.handler.ts                                       │
│  Process event based on type:                                    │
│  - checkout.session.completed                                    │
│  - customer.subscription.updated                                 │
│  - invoice.paid                                                  │
│  - etc.                                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files

| File | Purpose |
|------|---------|
| `apps/api/src/billing/billing.controller.ts` | Webhook endpoint |
| `apps/api/src/billing/stripe.service.ts` | Signature verification |
| `apps/worker/src/handlers/stripe-webhook.handler.ts` | Processing |
| `packages/db/src/schema/incoming-webhook-events.ts` | Event storage |

### Webhook Endpoint

```typescript
// apps/api/src/billing/billing.controller.ts
@Post('webhook')
@Public()  // No auth required
async handleWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Headers('stripe-signature') signature: string,
) {
  // Verify signature
  const event = this.stripeService.constructWebhookEvent(
    req.rawBody,
    signature,
  );

  // Log and queue
  await this.billingService.handleWebhookEvent(event);
  await this.queueService.addJob('stripe-webhook', {
    eventId: event.id,
    eventType: event.type,
    payload: event,
  });

  return { received: true };
}
```

### Idempotency

Stripe webhooks are idempotent - the same event may be sent multiple times. The handler checks for duplicate events:

```typescript
// Check if already processed
const existing = await this.repository.findByEventId(event.id);
if (existing && existing.processedAt) {
  logger.info('Event already processed, skipping');
  return;
}
```

