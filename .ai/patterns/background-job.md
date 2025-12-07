# Pattern: Creating Background Jobs

> How to add new BullMQ background jobs in ForgeStack.

## Overview

ForgeStack uses BullMQ for reliable background job processing:
- **API** queues jobs via `QueueService`
- **Redis** stores job data
- **Worker** processes jobs asynchronously

## Step-by-Step Guide

### Step 1: Add Queue Name

```typescript
// packages/shared/src/queues.ts
export const QUEUE_NAMES = {
  // ... existing queues
  MY_NEW_JOB: 'my-new-job',
} as const;
```

### Step 2: Create Job Handler

```typescript
// apps/worker/src/handlers/my-new-job.handler.ts
import { Job } from 'bullmq';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('MyNewJob');

// Define typed job data
export interface MyNewJobData {
  userId: string;
  action: string;
  payload: Record<string, unknown>;
}

// Define job result (optional)
export interface MyNewJobResult {
  success: boolean;
  processedAt: Date;
}

export async function handleMyNewJob(job: Job<MyNewJobData>): Promise<MyNewJobResult> {
  const { userId, action, payload } = job.data;

  logger.info({ jobId: job.id, userId, action }, 'Processing job');

  try {
    // Your job logic here
    await processAction(userId, action, payload);

    logger.info({ jobId: job.id }, 'Job completed successfully');
    
    return {
      success: true,
      processedAt: new Date(),
    };
  } catch (error) {
    logger.error({ jobId: job.id, error }, 'Job failed');
    throw error; // BullMQ will retry based on configuration
  }
}

async function processAction(userId: string, action: string, payload: Record<string, unknown>) {
  // Implementation
}
```

### Step 3: Register Worker

```typescript
// apps/worker/src/worker.ts
import { handleMyNewJob, MyNewJobData } from './handlers/my-new-job.handler';

// Add to existing worker registrations
createWorker<MyNewJobData>(QUEUE_NAMES.MY_NEW_JOB, handleMyNewJob);
```

### Step 4: Queue Jobs from API

```typescript
// apps/api/src/some-module/some.service.ts
import { Injectable } from '@nestjs/common';
import { QueueService } from '../queue/queue.service';
import { QUEUE_NAMES } from '@forgestack/shared';

@Injectable()
export class SomeService {
  constructor(private readonly queueService: QueueService) {}

  async doSomethingAsync(userId: string) {
    // Queue the job
    await this.queueService.add(QUEUE_NAMES.MY_NEW_JOB, {
      userId,
      action: 'process',
      payload: { timestamp: new Date().toISOString() },
    });
  }
}
```

## Job Configuration Options

```typescript
// Custom job options
await this.queueService.add(
  QUEUE_NAMES.MY_NEW_JOB,
  { userId, action, payload },
  {
    attempts: 3,                    // Retry up to 3 times
    backoff: {
      type: 'exponential',
      delay: 1000,                  // 1s, 2s, 4s
    },
    delay: 5000,                    // Delay 5 seconds before processing
    priority: 1,                    // Higher priority (lower number = higher priority)
    removeOnComplete: true,         // Remove job data after completion
    removeOnFail: false,            // Keep failed jobs for inspection
  }
);
```

## Common Job Patterns

### Email Job

```typescript
// handlers/notification-email.handler.ts
export interface NotificationEmailJobData {
  to: string;
  subject: string;
  template: 'welcome' | 'invitation' | 'notification';
  variables: Record<string, string>;
}

export async function handleNotificationEmail(job: Job<NotificationEmailJobData>) {
  const { to, subject, template, variables } = job.data;
  
  const html = renderTemplate(template, variables);
  
  await sendEmail({ to, subject, html });
  
  return { sent: true };
}
```

### Webhook Delivery Job

```typescript
// handlers/webhook-delivery.handler.ts
export interface WebhookDeliveryJobData {
  url: string;
  secret: string;
  payload: Record<string, unknown>;
  attemptNumber: number;
}

export async function handleWebhookDelivery(job: Job<WebhookDeliveryJobData>) {
  const { url, secret, payload, attemptNumber } = job.data;
  
  const signature = signPayload(secret, payload);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Webhook failed: ${response.status}`);
  }
  
  return { status: response.status };
}
```

### Audit Log Job

```typescript
// handlers/audit-log.handler.ts
export interface AuditLogJobData {
  orgId: string;
  actorId: string;
  actorType: 'user' | 'api_key' | 'system';
  action: string;
  resourceType: string;
  resourceId: string;
  metadata?: Record<string, unknown>;
}

export async function handleAuditLog(job: Job<AuditLogJobData>) {
  await withServiceContext('Audit log worker', async (tx) => {
    await tx.insert(auditLogs).values({
      ...job.data,
      createdAt: new Date(),
    });
  });
  
  return { logged: true };
}
```

## Testing Jobs

```typescript
// apps/worker/src/handlers/__tests__/my-new-job.handler.test.ts
import { describe, it, expect, vi } from 'vitest';
import { handleMyNewJob } from '../my-new-job.handler';

describe('handleMyNewJob', () => {
  it('processes job successfully', async () => {
    const mockJob = {
      id: 'job-123',
      data: {
        userId: 'user-123',
        action: 'process',
        payload: { key: 'value' },
      },
    };

    const result = await handleMyNewJob(mockJob as any);

    expect(result.success).toBe(true);
    expect(result.processedAt).toBeInstanceOf(Date);
  });

  it('throws on failure for retry', async () => {
    const mockJob = {
      id: 'job-123',
      data: {
        userId: 'invalid',
        action: 'fail',
        payload: {},
      },
    };

    await expect(handleMyNewJob(mockJob as any)).rejects.toThrow();
  });
});
```

## Checklist

- [ ] Queue name added to `packages/shared/src/queues.ts`
- [ ] Job data interface defined with types
- [ ] Handler function created with proper logging
- [ ] Worker registered in `apps/worker/src/worker.ts`
- [ ] `@forgestack/shared` re-exported types
- [ ] Unit tests written for handler
- [ ] Error handling with proper retry logic

