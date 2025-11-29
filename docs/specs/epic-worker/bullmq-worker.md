# BullMQ Worker

**Epic:** Worker  
**Priority:** #9  
**Depends on:** Priority #8 (Projects CRUD), Redis running via Docker Compose  
**Status:** Draft

---

## Overview

This specification defines the **BullMQ worker** setup for ForgeStack. The worker handles reliable background job processing, running as a separate process that connects to Redis and processes jobs queued from the API.

### Key Components

1. **BullMQ** – Reliable job queue library built on Redis
2. **Redis** – Queue backend (running at `localhost:6379` via Docker Compose)
3. **Worker Process** – Standalone Node.js process in `/apps/worker`
4. **Queue Service** – NestJS service in API for dispatching jobs
5. **Sample Job** – WelcomeEmail job to demonstrate the pattern

### Architecture

```
┌─────────────────┐         ┌─────────────┐         ┌─────────────────┐
│    NestJS API   │         │    Redis    │         │   BullMQ Worker │
│                 │         │             │         │                 │
│  QueueService   │ ──────▶ │   Queues    │ ◀────── │  Job Handlers   │
│  (enqueue job)  │         │             │         │  (process job)  │
└─────────────────┘         └─────────────┘         └─────────────────┘
```

### Request Flow

```
1. User signs up or test endpoint called
2. API's QueueService adds job to 'welcome-email' queue
3. Job is stored in Redis with job data
4. Worker polls Redis, picks up the job
5. WelcomeEmailHandler processes the job
6. Handler logs, simulates email send (1s delay)
7. Job marked complete in Redis
```

### Key Principles

- **Separate process** – Worker runs independently from API
- **Reliable delivery** – Jobs persist in Redis until completed
- **Retry with backoff** – Failed jobs retry with exponential backoff
- **Graceful shutdown** – SIGTERM/SIGINT complete pending jobs before exit
- **Observability** – All job lifecycle events are logged

---

## Acceptance Criteria

### Worker Setup
- [ ] BullMQ worker configured in `/apps/worker`
- [ ] Connects to Redis using `REDIS_URL` environment variable
- [ ] Graceful shutdown on SIGTERM/SIGINT signals
- [ ] Job retry with exponential backoff (3 attempts, 1s → 2s → 4s)
- [ ] Failed job handling with error logging
- [ ] Configurable concurrency (default: 5 concurrent jobs)
- [ ] Health check endpoint at `GET /health` (optional)

### Sample Job - WelcomeEmail
- [ ] Queue name: `welcome-email`
- [ ] Job data schema: `{ userId: string, email: string }`
- [ ] Handler logs "Sending welcome email to {email}"
- [ ] Simulates email send with 1 second delay
- [ ] Logs job completion with job ID
- [ ] Marks job as complete

### API Integration
- [ ] QueueModule registered in NestJS API
- [ ] QueueService provides `addWelcomeEmailJob(userId, email)` method
- [ ] Test endpoint `POST /api/v1/jobs/test-welcome-email` triggers sample job
- [ ] Endpoint requires authentication (uses TenantContextGuard)
- [ ] Job queued when user signs up (stretch goal - via better-auth hooks)

---

## Tasks & Subtasks

### 1. Worker Setup Tasks

#### 1.1 Install BullMQ Dependencies
- [ ] Add `bullmq` to `/apps/worker`
- [ ] Add `ioredis` to `/apps/worker`
- [ ] Add `dotenv` for environment configuration
- [ ] Ensure `@forgestack/db` workspace dependency is available

#### 1.2 Create Worker Configuration
- [ ] Create `src/config/index.ts` with environment loading
- [ ] Define `REDIS_URL` configuration (default: `redis://localhost:6379`)
- [ ] Define worker options (concurrency, limiter, etc.)
- [ ] Create `src/config/queues.ts` with queue definitions

#### 1.3 Create Job Handlers Structure
- [ ] Create `src/handlers/` directory
- [ ] Create `src/handlers/index.ts` for handler registry
- [ ] Create base handler pattern/interface

#### 1.4 Implement WelcomeEmailHandler
- [ ] Create `src/handlers/welcome-email.handler.ts`
- [ ] Implement job processing logic
- [ ] Add 1 second simulated delay
- [ ] Add structured logging with job metadata
- [ ] Handle errors gracefully

#### 1.5 Create Worker Bootstrap
- [ ] Create `src/worker.ts` as main entry point
- [ ] Initialize Redis connection
- [ ] Register job handlers with queues
- [ ] Implement graceful shutdown handler
- [ ] Log worker startup and connection status

#### 1.6 Add Logging
- [ ] Create `src/utils/logger.ts` for structured logging
- [ ] Log job received, processing, completed, failed events
- [ ] Include job ID, queue name, and relevant data in logs

#### 1.7 Update Package Scripts
- [ ] Add `dev` script: runs worker with ts-node and watch mode
- [ ] Add `start` script: runs compiled worker
- [ ] Add `build` script: compiles TypeScript
- [ ] Add environment variable handling

### 2. API Integration Tasks

#### 2.1 Install BullMQ in API
- [ ] Add `bullmq` to `/apps/api`
- [ ] Add `ioredis` to `/apps/api`

#### 2.2 Create QueueModule
- [ ] Create `src/queue/queue.module.ts`
- [ ] Configure BullMQ connection to Redis
- [ ] Define queue instances
- [ ] Export QueueService

#### 2.3 Create QueueService
- [ ] Create `src/queue/queue.service.ts`
- [ ] Implement `addWelcomeEmailJob(userId: string, email: string)` method
- [ ] Add job options (attempts, backoff, delay)
- [ ] Return job ID for tracking

#### 2.4 Add Test Endpoint
- [ ] Create `src/queue/queue.controller.ts`
- [ ] Add `POST /api/v1/jobs/test-welcome-email` endpoint
- [ ] Accept request body: `{ email: string }`
- [ ] Use authenticated user's ID and provided email
- [ ] Return job ID in response

---

## Test Plan

### Worker Tests

| Test Case | Expected Result |
|-----------|-----------------|
| Worker starts and connects to Redis | Logs "Connected to Redis", no errors |
| Worker processes welcome-email job | Job handler executes, logs completion |
| Job with invalid data | Job fails, error logged, not retried |
| Transient failure (simulated) | Job retries with backoff |
| Max retries exceeded | Job moved to failed, error logged |
| SIGTERM during idle | Worker shuts down immediately |
| SIGTERM during job processing | Pending job completes, then shutdown |

### Integration Tests

| Test Case | Expected Result |
|-----------|-----------------|
| API queues job via QueueService | Job appears in Redis queue |
| Worker picks up API-queued job | Job processed within seconds |
| Test endpoint queues job | Returns 201 with job ID |
| Test endpoint without auth | Returns 401 Unauthorized |

### E2E Test Scenarios

| Scenario | Steps | Expected |
|----------|-------|----------|
| Queue and process job | 1. Call test endpoint 2. Check worker logs | Job processed, email logged |
| Worker restart | 1. Queue job 2. Stop worker 3. Start worker | Job processed after restart |
| Multiple jobs | 1. Queue 10 jobs rapidly | All processed with concurrency |

---

## Implementation Notes

### Project Structure

```
apps/worker/
├── src/
│   ├── worker.ts                  # Bootstrap and main entry
│   ├── config/
│   │   ├── index.ts               # Environment configuration
│   │   └── queues.ts              # Queue definitions
│   ├── handlers/
│   │   ├── index.ts               # Handler registry
│   │   └── welcome-email.handler.ts
│   └── utils/
│       └── logger.ts              # Structured logging
├── package.json
└── tsconfig.json
```

### Worker Bootstrap Pattern

```typescript
// src/worker.ts
import { Worker, Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { config } from './config';
import { welcomeEmailHandler } from './handlers/welcome-email.handler';

const connection = new Redis(config.redisUrl, { maxRetriesPerRequest: null });

const welcomeEmailWorker = new Worker(
  'welcome-email',
  welcomeEmailHandler,
  {
    connection,
    concurrency: config.concurrency,
  }
);

// Graceful shutdown
const shutdown = async () => {
  console.log('Shutting down worker...');
  await welcomeEmailWorker.close();
  await connection.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('Worker started, waiting for jobs...');
```

### WelcomeEmailHandler Pattern

```typescript
// src/handlers/welcome-email.handler.ts
import { Job } from 'bullmq';

interface WelcomeEmailJobData {
  userId: string;
  email: string;
}

export async function welcomeEmailHandler(job: Job<WelcomeEmailJobData>) {
  const { userId, email } = job.data;

  console.log(`[Job ${job.id}] Sending welcome email to ${email}`);

  // Simulate email send
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log(`[Job ${job.id}] Welcome email sent to ${email}`);

  return { success: true, email };
}
```

### QueueService Pattern (API)

```typescript
// apps/api/src/queue/queue.service.ts
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private welcomeEmailQueue: Queue;

  constructor() {
    this.welcomeEmailQueue = new Queue('welcome-email', {
      connection: { host: 'localhost', port: 6379 },
    });
  }

  async addWelcomeEmailJob(userId: string, email: string) {
    const job = await this.welcomeEmailQueue.add('send', { userId, email }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
    });
    return job.id;
  }
}
```

### Environment Variables

```env
# Worker Configuration
REDIS_URL=redis://localhost:6379
WORKER_CONCURRENCY=5
NODE_ENV=development

# Shared with API
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/forgestack_dev
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/worker.ts",
    "start": "node dist/worker.js",
    "build": "tsc --build",
    "clean": "rm -rf dist"
  }
}
```

---

## Dependencies

### Worker (`/apps/worker`)

| Package | Version | Purpose |
|---------|---------|---------|
| `bullmq` | `^5.x` | Job queue library |
| `ioredis` | `^5.x` | Redis client |
| `dotenv` | `^16.x` | Environment loading |
| `@forgestack/db` | `workspace:*` | Database access (for future jobs) |
| `tsx` | `^4.x` | Dev-time TypeScript runner |

### API (`/apps/api`)

| Package | Version | Purpose |
|---------|---------|---------|
| `bullmq` | `^5.x` | Job queue library |
| `ioredis` | `^5.x` | Redis client |

---

## Security Considerations

1. **Redis authentication** – Use `REDIS_URL` with password in production
2. **Job data validation** – Validate job data before processing
3. **No sensitive data in jobs** – Store IDs, not PII; fetch from DB if needed
4. **Test endpoint protection** – Must require authentication
5. **Rate limiting** – Consider limiting job queue rate per user

---

## Observability

### Logging

All job lifecycle events should be logged:

```
[INFO] Worker started, connected to redis://localhost:6379
[INFO] [Job abc123] Received: welcome-email
[INFO] [Job abc123] Processing: Sending welcome email to user@example.com
[INFO] [Job abc123] Completed in 1023ms
[ERROR] [Job def456] Failed: Connection timeout (attempt 1/3)
[ERROR] [Job def456] Failed permanently after 3 attempts
```

### Metrics (Future)

- Jobs processed per minute
- Job processing duration
- Failed job count
- Queue depth
- Redis connection status

---

## Future Enhancements (Out of Scope)

- BullMQ Dashboard (Bull Board) for job monitoring
- Dead letter queue for permanently failed jobs
- Job scheduling (delayed/recurring jobs)
- Priority queues
- Job progress reporting
- Additional job types (notifications, cleanup, reports)
- Integration with actual email service (SendGrid, Resend)

---

*End of spec*

