/**
 * Webhook Signing Utilities
 * Provides functions for generating secrets and signing webhook payloads
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Generate a new webhook secret with whsec_ prefix
 * @returns A base64url-encoded secret with whsec_ prefix
 */
export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString('base64url')}`;
}

/**
 * Sign a webhook payload using HMAC-SHA256
 * @param payload - The JSON string payload to sign
 * @param secret - The webhook secret
 * @param timestamp - Unix timestamp in seconds
 * @returns Signature in format: t={timestamp},v1={signature}
 */
export function signWebhookPayload(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signaturePayload = `${timestamp}.${payload}`;
  const signature = createHmac('sha256', secret)
    .update(signaturePayload)
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verify a webhook signature
 * @param payload - The JSON string payload
 * @param signature - The signature header value
 * @param secret - The webhook secret
 * @param toleranceSeconds - Maximum age of timestamp (default: 5 minutes)
 * @returns true if signature is valid, false otherwise
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  toleranceSeconds = 300
): boolean {
  try {
    // Parse signature header
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parseInt(parts.t, 10);
    const providedSig = parts.v1;

    if (!timestamp || !providedSig) {
      return false;
    }

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSeconds) {
      return false;
    }

    // Compute expected signature
    const expectedSig = createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    if (expectedSig.length !== providedSig.length) {
      return false;
    }
    return timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig));
  } catch {
    return false;
  }
}

