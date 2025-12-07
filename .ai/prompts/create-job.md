# Prompt: Create Background Job

> Copy this prompt and fill in the placeholders to create a new BullMQ background job.

---

## Prompt Template

```
I need to create a new background job for [JOB_PURPOSE] in ForgeStack.

## Context
This is a ForgeStack project using BullMQ with Redis for background job processing.

Please read these files for patterns:
- .ai/patterns/background-job.md
- .ai/architecture.md

## Requirements

### Job: [JOB_NAME]
- Purpose: [What this job does]
- Trigger: [When/how this job is queued - e.g., "after user signup", "on webhook received"]

### Job Data:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| [field1] | [type] | [yes/no] | [description] |
| [field2] | [type] | [yes/no] | [description] |

### Job Behavior:
- Retry attempts: [number, default: 3]
- Backoff strategy: [exponential/fixed]
- Timeout: [seconds]
- Priority: [1-10, lower = higher priority]

### Side Effects:
- [ ] Sends email
- [ ] Makes HTTP request (webhook)
- [ ] Updates database
- [ ] Triggers other jobs
- [ ] Other: [specify]

## Deliverables
1. Queue name constant (packages/shared/src/queues.ts)
2. Job handler (apps/worker/src/handlers/[job-name].handler.ts)
3. Worker registration (apps/worker/src/worker.ts)
4. Service method to queue job (apps/api/src/queue/queue.service.ts)
5. Unit tests for handler
```

---

## Example: Creating an Export Report Job

```
I need to create a new background job for exporting audit logs to CSV in ForgeStack.

## Context
This is a ForgeStack project using BullMQ with Redis for background job processing.

Please read .ai/patterns/background-job.md for the implementation pattern.

## Requirements

### Job: AUDIT_LOG_EXPORT
- Purpose: Generate CSV export of audit logs for a date range and email to user
- Trigger: User clicks "Export" button in audit logs UI

### Job Data:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| orgId | string (uuid) | yes | Organization ID |
| userId | string (uuid) | yes | Requesting user ID |
| userEmail | string | yes | Email to send export to |
| startDate | string (ISO) | yes | Start of date range |
| endDate | string (ISO) | yes | End of date range |
| filters | object | no | Additional filters applied |

### Job Behavior:
- Retry attempts: 3
- Backoff strategy: exponential (1s, 2s, 4s)
- Timeout: 300 seconds (5 minutes for large exports)
- Priority: 5 (medium)

### Side Effects:
- [x] Queries database for audit logs (uses withServiceContext)
- [x] Generates CSV file
- [x] Uploads to R2/S3 storage
- [x] Sends email with download link
- [x] Creates notification for user

## Deliverables
Create all files following the pattern in .ai/patterns/background-job.md
```

---

## Checklist for AI Response

After the AI generates code, verify:

- [ ] Queue name added to `packages/shared/src/queues.ts`
- [ ] Queue name exported from `packages/shared/src/index.ts`
- [ ] Job data interface is fully typed
- [ ] Handler uses `createLogger` for logging
- [ ] Handler logs job start and completion
- [ ] Handler throws errors for retry (not swallows them)
- [ ] Worker registered in `apps/worker/src/worker.ts` with typed generic
- [ ] QueueService method added for queueing
- [ ] Unit tests mock external dependencies
- [ ] Error cases tested

