/**
 * Webhook Delivery Handler
 * Processes webhook delivery jobs with retry logic
 */

import { Job } from 'bullmq';
import { createHmac } from 'crypto';
import {
  withServiceContext,
  webhookDeliveries,
  webhookEndpoints,
  eq,
} from '@forgestack/db';
import { WEBHOOK_CONSTANTS } from '@forgestack/shared';
import { createLogger } from '../telemetry/logger';

const logger = createLogger('WebhookDelivery');

export interface WebhookDeliveryJobData {
  deliveryId: string;
  endpointId: string;
  orgId: string;
  url: string;
  // secret removed - will be fetched from DB
  eventId: string;
  eventType: string;
  payload: object;
  attemptNumber: number;
}

const MAX_ATTEMPTS = WEBHOOK_CONSTANTS.MAX_DELIVERY_ATTEMPTS;
const RETRY_DELAYS = WEBHOOK_CONSTANTS.RETRY_DELAYS_MS;

// TODO: Implement circuit breaker pattern to automatically disable
// endpoints after N consecutive failures across multiple deliveries.
// This prevents resource waste on dead endpoints.
// For now, we log a warning when an endpoint exhausts all retries.

/**
 * Sign a webhook payload using HMAC-SHA256
 */
function signPayload(secret: string, timestamp: number, payload: string): string {
  const signaturePayload = `${timestamp}.${payload}`;
  const signature = createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Calculate next retry time based on attempt number
 */
function calculateNextRetry(attemptNumber: number): Date | null {
  if (attemptNumber >= MAX_ATTEMPTS) {
    return null;
  }
  const delay = RETRY_DELAYS[attemptNumber] ?? RETRY_DELAYS[RETRY_DELAYS.length - 1] ?? 60000;
  return new Date(Date.now() + delay);
}

/**
 * Fetch endpoint secret from database
 */
async function getEndpointSecret(endpointId: string): Promise<string | null> {
  const result = await withServiceContext('WebhookDeliveryHandler.getEndpointSecret', async (tx) => {
    return tx
      .select({ secret: webhookEndpoints.secret })
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.id, endpointId))
      .limit(1);
  });

  return result[0]?.secret ?? null;
}

/**
 * Update delivery record in database
 */
async function updateDeliveryRecord(
  deliveryId: string,
  data: {
    responseStatus?: number;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    attemptNumber: number;
    nextRetryAt?: Date | null;
    deliveredAt?: Date | null;
    failedAt?: Date | null;
    error?: string | null;
  }
) {
  await withServiceContext('WebhookDeliveryHandler.updateDeliveryRecord', async (tx) => {
    await tx
      .update(webhookDeliveries)
      .set(data)
      .where(eq(webhookDeliveries.id, deliveryId));
  });
}

/**
 * Webhook Delivery Handler
 * Makes HTTP POST request to webhook endpoint with signed payload
 */
export async function handleWebhookDelivery(job: Job<WebhookDeliveryJobData>) {
  const startTime = Date.now();
  const { deliveryId, endpointId, url, payload, eventId, eventType, attemptNumber } = job.data;

  logger.info({ jobId: job.id, deliveryId, eventType, attemptNumber }, 'Starting webhook delivery job');

  // Fetch secret from database
  const secret = await getEndpointSecret(endpointId);
  if (!secret) {
    const duration = Date.now() - startTime;
    logger.error({ endpointId, deliveryId, durationMs: duration }, 'Endpoint not found or secret missing');

    // Record failed delivery
    await updateDeliveryRecord(deliveryId, {
      error: 'Endpoint not found or secret missing',
      attemptNumber,
      failedAt: new Date(),
      nextRetryAt: null,
    });

    return { success: false, error: 'Endpoint not found' };
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  const signature = signPayload(secret, timestamp, payloadString);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Id': eventId,
        'X-Webhook-Timestamp': timestamp.toString(),
        'X-Webhook-Signature': signature,
        'User-Agent': 'ForgeStack-Webhooks/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // Update delivery record
    await updateDeliveryRecord(deliveryId, {
      responseStatus: response.status,
      responseBody: responseBody.substring(0, 10000), // Limit response body size
      responseHeaders,
      attemptNumber,
      deliveredAt: response.ok ? new Date() : null,
      failedAt: !response.ok && attemptNumber >= MAX_ATTEMPTS ? new Date() : null,
      nextRetryAt: !response.ok && attemptNumber < MAX_ATTEMPTS ? calculateNextRetry(attemptNumber) : null,
      error: response.ok ? null : `HTTP ${response.status}`,
    });

    if (!response.ok) {
      const duration = Date.now() - startTime;
      logger.error({ deliveryId, status: response.status, durationMs: duration }, 'Webhook delivery failed');

      // Log warning when endpoint has exhausted all retry attempts
      if (attemptNumber >= MAX_ATTEMPTS) {
        logger.warn(
          { endpointId, url, deliveryId },
          'Webhook endpoint has exhausted all retry attempts. Consider disabling if failures persist.',
        );
      }

      throw new Error(`Webhook returned ${response.status}`);
    }

    const duration = Date.now() - startTime;
    logger.info({ jobId: job.id, deliveryId, status: response.status, durationMs: duration }, 'Webhook delivery completed successfully');
    return { success: true, status: response.status };
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error
      ? (error.name === 'AbortError' ? 'Request timeout' : error.message)
      : 'Unknown error';

    logger.error({ jobId: job.id, deliveryId, durationMs: duration, error: errorMessage }, 'Webhook delivery job failed');

    await updateDeliveryRecord(deliveryId, {
      error: errorMessage,
      attemptNumber,
      nextRetryAt: attemptNumber < MAX_ATTEMPTS ? calculateNextRetry(attemptNumber) : null,
      failedAt: attemptNumber >= MAX_ATTEMPTS ? new Date() : null,
    });

    // Log warning when endpoint has exhausted all retry attempts
    if (attemptNumber >= MAX_ATTEMPTS) {
      logger.warn(
        { endpointId, url, deliveryId },
        'Webhook endpoint has exhausted all retry attempts. Consider disabling if failures persist.',
      );
    }

    throw error;
  }
}

