import { Worker, Job, Processor } from 'bullmq';
import IORedis from 'ioredis';
import { config } from './config';
import { QUEUE_NAMES } from './queues';
import { handleWelcomeEmail, WelcomeEmailJobData } from './handlers/welcome-email.handler';
import { handleSendInvitation, SendInvitationJobData } from './handlers/send-invitation.handler';

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

