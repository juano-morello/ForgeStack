/**
 * Webhook Events
 * Defines all supported webhook event types and payload structure
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

/**
 * Standard webhook payload structure
 */
export interface WebhookPayload {
  id: string;
  type: WebhookEventType;
  created_at: string;
  org_id: string;
  data: Record<string, unknown>;
}

