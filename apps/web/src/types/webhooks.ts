/**
 * Webhooks Types
 *
 * Type definitions for webhook management.
 */

export type WebhookEventType =
  | 'project.created' | 'project.updated' | 'project.deleted'
  | 'member.invited' | 'member.joined' | 'member.removed' | 'member.role_changed'
  | 'subscription.created' | 'subscription.updated' | 'subscription.canceled'
  | 'file.uploaded' | 'file.deleted'
  | 'test.ping';

export interface WebhookEndpoint {
  id: string;
  url: string;
  description: string | null;
  events: WebhookEventType[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEndpointWithSecret extends WebhookEndpoint {
  secret: string; // Only shown on creation
}

export interface WebhookDelivery {
  id: string;
  endpointId: string;
  eventType: WebhookEventType;
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

export interface CreateWebhookEndpointRequest {
  url: string;
  description?: string;
  events: WebhookEventType[];
  enabled?: boolean;
}

export interface UpdateWebhookEndpointRequest {
  url?: string;
  description?: string;
  events?: WebhookEventType[];
  enabled?: boolean;
}

