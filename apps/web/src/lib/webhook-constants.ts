/**
 * Webhook Constants
 *
 * Constants for webhook event types, labels, and groupings.
 * Base types and events imported from @forgestack/shared
 */

import type { WebhookEventType } from '@forgestack/shared/browser';
export { WEBHOOK_EVENTS } from '@forgestack/shared/browser';
export type { WebhookEventType } from '@forgestack/shared/browser';

export const EVENT_LABELS: Record<WebhookEventType, string> = {
  'project.created': 'Project Created',
  'project.updated': 'Project Updated',
  'project.deleted': 'Project Deleted',
  'member.invited': 'Member Invited',
  'member.joined': 'Member Joined',
  'member.removed': 'Member Removed',
  'member.role_changed': 'Member Role Changed',
  'subscription.created': 'Subscription Created',
  'subscription.updated': 'Subscription Updated',
  'subscription.canceled': 'Subscription Canceled',
  'file.uploaded': 'File Uploaded',
  'file.deleted': 'File Deleted',
  'test.ping': 'Test Ping',
};

export const EVENT_GROUPS = {
  projects: ['project.created', 'project.updated', 'project.deleted'] as WebhookEventType[],
  members: ['member.invited', 'member.joined', 'member.removed', 'member.role_changed'] as WebhookEventType[],
  subscriptions: ['subscription.created', 'subscription.updated', 'subscription.canceled'] as WebhookEventType[],
  files: ['file.uploaded', 'file.deleted'] as WebhookEventType[],
  test: ['test.ping'] as WebhookEventType[],
} as const;

export const EVENT_GROUP_LABELS: Record<keyof typeof EVENT_GROUPS, string> = {
  projects: 'Projects',
  members: 'Members',
  subscriptions: 'Subscriptions',
  files: 'Files',
  test: 'Test',
};

