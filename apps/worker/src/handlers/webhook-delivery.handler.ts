/**
 * Webhook Delivery Handler
 * Processes webhook delivery jobs with retry logic
 */

import { Job } from 'bullmq';
import { createHmac } from 'crypto';
import {
  withServiceContext,
  webhookDeliveries,
  eq,
} from '@forgestack/db';

export interface WebhookDeliveryJobData {
  deliveryId: string;
  endpointId: string;
  orgId: string;
  url: string;
  secret: string;
  eventId: string;
  eventType: string;
  payload: object;
  attemptNumber: number;
}

const MAX_ATTEMPTS = 5;
const RETRY_DELAYS = [
  1 * 60 * 1000,      // 1 minute
  5 * 60 * 1000,      // 5 minutes
  30 * 60 * 1000,     // 30 minutes
  2 * 60 * 60 * 1000, // 2 hours
  24 * 60 * 60 * 1000 // 24 hours
];

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
  const { deliveryId, url, secret, payload, eventId, eventType, attemptNumber } = job.data;

  console.log(`[WebhookDelivery] Processing delivery ${deliveryId} for event ${eventType} (attempt ${attemptNumber})`);

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
      console.error(`[WebhookDelivery] Delivery ${deliveryId} failed with status ${response.status}`);
      throw new Error(`Webhook returned ${response.status}`);
    }

    console.log(`[WebhookDelivery] Delivery ${deliveryId} succeeded with status ${response.status}`);
    return { success: true, status: response.status };
  } catch (error: any) {
    const errorMessage = error.name === 'AbortError' ? 'Request timeout' : error.message;

    console.error(`[WebhookDelivery] Delivery ${deliveryId} failed:`, errorMessage);

    await updateDeliveryRecord(deliveryId, {
      error: errorMessage,
      attemptNumber,
      nextRetryAt: attemptNumber < MAX_ATTEMPTS ? calculateNextRetry(attemptNumber) : null,
      failedAt: attemptNumber >= MAX_ATTEMPTS ? new Date() : null,
    });

    throw error;
  }
}

