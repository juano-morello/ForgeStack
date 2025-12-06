# ADR-005: Background Jobs with BullMQ

## Status
Accepted

## Context

ForgeStack requires background job processing for:
1. **Email delivery** - Welcome emails, invitations, notifications
2. **Webhook delivery** - Outgoing webhooks with retries
3. **Stripe webhooks** - Processing incoming Stripe events
4. **Usage aggregation** - Daily/monthly usage calculations
5. **File cleanup** - Removing deleted/orphaned files
6. **Audit logging** - Async audit log processing
7. **Activity feed** - Async activity creation

Requirements:
- Reliable job execution with retries
- Job prioritization and scheduling
- Concurrent job processing
- Job progress tracking
- Dead letter queue for failed jobs
- Redis-based for performance
- TypeScript support
- Observability (logging, metrics)

## Decision

We chose **BullMQ** as our background job processing library.

### Architecture

**1. Queue Service (API):**
```typescript
// apps/api/src/queue/queue.service.ts
@Injectable()
export class QueueService {
  private queues: Map<string, Queue>;
  
  async add(queueName: string, jobName: string, data: any, opts?: JobsOptions) {
    const queue = this.queues.get(queueName);
    return queue.add(jobName, data, opts);
  }
}
```

**2. Worker Process:**
```typescript
// apps/worker/src/index.ts
import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '@forgestack/shared';

const emailWorker = new Worker(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    switch (job.name) {
      case 'welcome-email':
        return handleWelcomeEmail(job);
      case 'send-invitation':
        return handleSendInvitation(job);
      default:
        throw new Error(`Unknown job: ${job.name}`);
    }
  },
  { connection: redis }
);
```

**3. Job Handlers:**
```typescript
// apps/worker/src/handlers/welcome-email.handler.ts
export async function handleWelcomeEmail(job: Job<WelcomeEmailData>) {
  const { userId, email, name } = job.data;
  
  await sendEmail({
    to: email,
    subject: 'Welcome to ForgeStack',
    html: renderWelcomeEmail({ name }),
  });
  
  return { success: true };
}
```

### Queue Organization

We use separate queues for different job types:

| Queue | Purpose | Concurrency |
|-------|---------|-------------|
| `email` | Email delivery | 5 |
| `webhooks` | Webhook delivery | 10 |
| `stripe` | Stripe webhook processing | 3 |
| `billing` | Billing operations | 2 |
| `usage` | Usage aggregation | 2 |
| `files` | File cleanup | 1 |
| `audit` | Audit log processing | 5 |
| `activity` | Activity feed | 5 |

### Job Options

```typescript
// Retry configuration
await queueService.add('email', 'welcome-email', data, {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000, // 1s, 2s, 4s
  },
});

// Delayed job
await queueService.add('files', 'cleanup-deleted', data, {
  delay: 24 * 60 * 60 * 1000, // 24 hours
});

// Scheduled job (cron)
await queueService.add('usage', 'aggregate-daily', data, {
  repeat: {
    pattern: '0 0 * * *', // Daily at midnight
  },
});

// Priority
await queueService.add('email', 'urgent-notification', data, {
  priority: 1, // Higher priority
});
```

## Consequences

### Positive

1. **Reliability**: Guaranteed job execution
   - Jobs persisted to Redis
   - Automatic retries with backoff
   - Dead letter queue for failed jobs
   - At-least-once delivery

2. **Performance**: Fast and efficient
   - Redis-backed for speed
   - Concurrent job processing
   - Minimal overhead
   - Scales horizontally

3. **Developer Experience**: Easy to use
   - Simple API
   - TypeScript support
   - Good documentation
   - Active development

4. **Features**: Rich feature set
   - Job prioritization
   - Delayed jobs
   - Scheduled jobs (cron)
   - Job progress tracking
   - Rate limiting
   - Job events

5. **Observability**: Built-in monitoring
   - Job events (completed, failed, etc.)
   - Progress tracking
   - Metrics export
   - Integration with Bull Board UI

6. **Separation of Concerns**: Dedicated worker process
   - API doesn't block on long tasks
   - Worker can scale independently
   - Different resource allocation

7. **Testing**: Easy to test
   - Can test handlers in isolation
   - Mock queue service
   - Integration tests with real Redis

### Negative

1. **Redis Dependency**: Requires Redis
   - Additional infrastructure
   - Redis must be highly available
   - Mitigated by managed Redis (Upstash)

2. **Complexity**: Additional moving parts
   - Need to run worker process
   - Monitor queue health
   - Handle worker failures

3. **Debugging**: Harder to debug than sync code
   - Jobs run in separate process
   - Need to check logs
   - Mitigated by good logging

4. **Job Data Size**: Limited by Redis
   - Large payloads can be slow
   - Should store references, not full data

5. **Ordering**: No strict ordering guarantees
   - Jobs may execute out of order
   - Need to design for eventual consistency

## Alternatives Considered

### 1. Agenda (MongoDB-based)

**Pros:**
- MongoDB-backed (if already using MongoDB)
- Simple API
- Scheduled jobs

**Cons:**
- **Not using MongoDB**: Would need additional database
- **Slower than Redis**: MongoDB is slower for queues
- **Less active**: Smaller community than BullMQ

**Rejected because:** We're using PostgreSQL, not MongoDB. Redis is better suited for queues.

### 2. Bee-Queue

**Pros:**
- Simple, minimal API
- Redis-backed
- Fast

**Cons:**
- **Limited features**: No job prioritization, scheduling
- **Less active**: Not as actively maintained
- **No TypeScript**: Types are community-maintained

**Rejected because:** Too minimal. Missing features we need like scheduling and prioritization.

### 3. pg-boss (PostgreSQL-based)

**Pros:**
- Uses existing PostgreSQL database
- No additional infrastructure
- ACID guarantees

**Cons:**
- **Slower than Redis**: PostgreSQL not optimized for queues
- **Polling overhead**: Uses polling instead of pub/sub
- **Limited features**: Fewer features than BullMQ

**Rejected because:** PostgreSQL is not ideal for high-throughput job queues. Redis is purpose-built for this.

### 4. AWS SQS / Google Cloud Tasks

**Pros:**
- Fully managed
- Highly scalable
- No infrastructure to manage

**Cons:**
- **Vendor lock-in**: Tied to cloud provider
- **Cost**: Pay per request
- **Latency**: Network latency for each job
- **Complexity**: Additional service to configure

**Rejected because:** As a template, we want to avoid cloud vendor lock-in. Self-hosted Redis is more flexible.

### 5. Celery (Python)

**Pros:**
- Very mature
- Feature-rich
- Large ecosystem

**Cons:**
- **Python-only**: Can't use with Node.js
- **Complexity**: Heavy framework

**Rejected because:** ForgeStack is TypeScript/Node.js. Celery is Python-only.

### 6. Synchronous Processing (No Queue)

**Pros:**
- Simpler architecture
- No additional infrastructure
- Easier to debug

**Cons:**
- **Blocking**: API requests block on long tasks
- **No retries**: Failed tasks are lost
- **No scheduling**: Can't delay or schedule tasks
- **Poor UX**: Slow response times

**Rejected because:** Unacceptable for production SaaS. Users shouldn't wait for emails to send.

## Implementation Notes

### Adding a New Job Handler

1. **Define job data type:**
   ```typescript
   // apps/worker/src/handlers/task-reminder.handler.ts
   export interface TaskReminderData {
     taskId: string;
     userId: string;
   }
   ```

2. **Implement handler:**
   ```typescript
   export async function handleTaskReminder(job: Job<TaskReminderData>) {
     const { taskId, userId } = job.data;
     
     logger.info({ taskId, userId }, 'Processing task reminder');
     
     // Business logic here
     
     return { success: true };
   }
   ```

3. **Register handler:**
   ```typescript
   // apps/worker/src/index.ts
   worker.process('task-reminder', handleTaskReminder);
   ```

4. **Queue job from API:**
   ```typescript
   // apps/api/src/tasks/tasks.service.ts
   await this.queueService.add('tasks', 'task-reminder', {
     taskId: task.id,
     userId: user.id,
   });
   ```

### Error Handling

```typescript
export async function handleJob(job: Job) {
  try {
    // Job logic
    return { success: true };
  } catch (error) {
    logger.error({ error, jobId: job.id }, 'Job failed');
    
    // Throw to trigger retry
    throw error;
  }
}
```

### Testing Job Handlers

```typescript
describe('WelcomeEmailHandler', () => {
  it('should send welcome email', async () => {
    const job = {
      data: {
        userId: 'user-1',
        email: 'user@example.com',
        name: 'John Doe',
      },
    } as Job<WelcomeEmailData>;
    
    const result = await handleWelcomeEmail(job);
    
    expect(result.success).toBe(true);
    expect(sendEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      subject: 'Welcome to ForgeStack',
      html: expect.any(String),
    });
  });
});
```

### Monitoring with Bull Board

```typescript
// apps/api/src/queue/queue.module.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';

const serverAdapter = new ExpressAdapter();
createBullBoard({
  queues: queues.map(q => new BullMQAdapter(q)),
  serverAdapter,
});

// Mount at /admin/queues
app.use('/admin/queues', serverAdapter.getRouter());
```

## References

- [BullMQ Documentation](https://docs.bullmq.io/)
- [BullMQ GitHub](https://github.com/taskforcesh/bullmq)
- [Bull Board](https://github.com/felixmosh/bull-board)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

