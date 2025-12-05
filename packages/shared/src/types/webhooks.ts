/**
 * Webhook Types
 * Types for webhook management
 */

export const WEBHOOK_EVENTS = [
  'project.created',
  'project.updated',
  'project.deleted',
  'member.invited',
  'member.joined',
  'member.removed',
  'member.role_changed',
  'subscription.created',
  'subscription.updated',
  'subscription.canceled',
  'file.uploaded',
  'file.deleted',
  'test.ping',
] as const;

export type WebhookEventType = (typeof WEBHOOK_EVENTS)[number];

export interface WebhookPayload {
  id: string;
  type: WebhookEventType;
  created_at: string;
  org_id: string;
  data: Record<string, unknown>;
}

export interface BaseWebhookEndpoint {
  id: string;
  url: string;
  description: string | null;
  events: WebhookEventType[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookEndpointWithSecret extends BaseWebhookEndpoint {
  secret: string;
}

export interface CreateWebhookEndpointInput {
  url: string;
  description?: string;
  events: WebhookEventType[];
  enabled?: boolean;
}

export interface UpdateWebhookEndpointInput {
  url?: string;
  description?: string;
  events?: WebhookEventType[];
  enabled?: boolean;
}

