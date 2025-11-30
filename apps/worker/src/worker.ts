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

const connection = new IORedis(config.redis.url, { maxRetriesPerRequest: null });

const workers: Worker[] = [];

/**
 * Helper to create a worker with standard event handlers
 */
function createWorker<T>(
  queueName: string,
  handler: Processor<T>
): Worker<T> {
  const worker = new Worker<T>(queueName, handler, {
    connection,
    concurrency: config.worker.concurrency,
  });

  worker.on('completed', (job) => {
    console.log(`[${queueName}] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[${queueName}] Job ${job?.id} failed:`, err.message);
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

// Graceful shutdown
async function shutdown() {
  console.log('[Worker] Shutting down...');
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  console.log('[Worker] Shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

console.log('[Worker] Started and listening for jobs...');

