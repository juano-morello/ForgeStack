import { Worker, Processor } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config';
import { QUEUE_NAMES } from './queues';
import { handleWelcomeEmail, WelcomeEmailJobData } from './handlers/welcome-email.handler';
import { handleSendInvitation, SendInvitationJobData } from './handlers/send-invitation.handler';
import { handleStripeWebhook, StripeWebhookJobData } from './handlers/stripe-webhook.handler';
import { handleCleanupOrphanedFiles, CleanupOrphanedFilesJobData } from './handlers/cleanup-orphaned-files.handler';
import { handleCleanupDeletedFiles, CleanupDeletedFilesJobData } from './handlers/cleanup-deleted-files.handler';
import { handleWebhookDelivery, WebhookDeliveryJobData } from './handlers/webhook-delivery.handler';
import { handleIncomingWebhookProcessing, IncomingWebhookJobData } from './handlers/incoming-webhook-processing.handler';
import { handleAuditLog, AuditLogJobData } from './handlers/audit-log.handler';
import { handleActivity, ActivityJobData } from './handlers/activity.handler';
import { handleNotificationEmail, NotificationEmailJobData } from './handlers/notification-email.handler';
import { handleUsageAggregation, UsageAggregationJobData } from './handlers/usage-aggregation.handler';
import { handleStripeUsageReport, StripeUsageReportJobData } from './handlers/stripe-usage-report.handler';
import { handleActiveSeats, ActiveSeatsJobData } from './handlers/active-seats.handler';
import { handleAITask, AITaskJobData } from './handlers/ai-task.handler';
import { createLogger } from './telemetry/logger';
import { withTracing } from './telemetry/tracing';

const logger = createLogger('Worker');
const connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });

const workers: Worker[] = [];

/**
 * Helper to create a worker with standard event handlers and tracing
 */
function createWorker<T>(
  queueName: string,
  handler: Processor<T>
): Worker<T> {
  // Wrap handler with tracing
  const tracedHandler = withTracing(queueName, handler);

  const worker = new Worker<T>(queueName, tracedHandler, {
    connection,
    concurrency: config.worker.concurrency,
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: queueName }, 'Job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, queue: queueName, error: err.message },
      'Job failed'
    );
  });

  workers.push(worker);
  return worker;
}

// Register workers for each queue
createWorker<WelcomeEmailJobData>(QUEUE_NAMES.WELCOME_EMAIL, handleWelcomeEmail);
createWorker<SendInvitationJobData>(QUEUE_NAMES.SEND_INVITATION, handleSendInvitation);
createWorker<StripeWebhookJobData>(QUEUE_NAMES.STRIPE_WEBHOOK, handleStripeWebhook);
createWorker<CleanupOrphanedFilesJobData>(QUEUE_NAMES.CLEANUP_ORPHANED_FILES, handleCleanupOrphanedFiles);
createWorker<CleanupDeletedFilesJobData>(QUEUE_NAMES.CLEANUP_DELETED_FILES, handleCleanupDeletedFiles);
createWorker<WebhookDeliveryJobData>(QUEUE_NAMES.WEBHOOK_DELIVERY, handleWebhookDelivery);
createWorker<IncomingWebhookJobData>(QUEUE_NAMES.INCOMING_WEBHOOK_PROCESSING, handleIncomingWebhookProcessing);
createWorker<AuditLogJobData>(QUEUE_NAMES.AUDIT_LOGS, handleAuditLog);
createWorker<ActivityJobData>(QUEUE_NAMES.ACTIVITIES, handleActivity);
createWorker<NotificationEmailJobData>(QUEUE_NAMES.NOTIFICATION_EMAIL, handleNotificationEmail);
createWorker<UsageAggregationJobData>(QUEUE_NAMES.USAGE_AGGREGATION, handleUsageAggregation);
createWorker<StripeUsageReportJobData>(QUEUE_NAMES.STRIPE_USAGE_REPORT, handleStripeUsageReport);
createWorker<ActiveSeatsJobData>(QUEUE_NAMES.ACTIVE_SEATS, handleActiveSeats);
createWorker<AITaskJobData>(QUEUE_NAMES.AI_TASK, handleAITask);

// Graceful shutdown
async function shutdown() {
  logger.info('Shutting down...');
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  logger.info('Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

logger.info(
  {
    concurrency: config.worker.concurrency,
    queues: Object.values(QUEUE_NAMES),
  },
  'Worker started and listening for jobs'
);

