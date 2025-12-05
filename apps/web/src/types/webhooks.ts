/**
 * Webhooks Types
 *
 * Extended type definitions for webhook management.
 * Base types imported from @forgestack/shared
 */

// Re-export base types from shared
export type { WebhookEventType, BaseWebhookEndpoint, WebhookEndpointWithSecret, CreateWebhookEndpointInput, UpdateWebhookEndpointInput, WebhookPayload } from '@forgestack/shared/browser';
export { WEBHOOK_EVENTS } from '@forgestack/shared/browser';

// Aliases for backward compatibility
import type { BaseWebhookEndpoint, CreateWebhookEndpointInput, UpdateWebhookEndpointInput } from '@forgestack/shared/browser';
export type WebhookEndpoint = BaseWebhookEndpoint;
export type CreateWebhookEndpointRequest = CreateWebhookEndpointInput;
export type UpdateWebhookEndpointRequest = UpdateWebhookEndpointInput;

// Web-specific types
export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: string;
  eventId: string;
  payload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  attemptNumber: number;
  deliveredAt: string | null;
  failedAt: string | null;
  error: string | null;
  createdAt: string;
}

