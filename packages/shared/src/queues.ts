/**
 * Queue Names
 * Shared queue name constants used by API and Worker
 */

export const QUEUE_NAMES = {
  WELCOME_EMAIL: 'welcome-email',
  SEND_INVITATION: 'send-invitation',
  STRIPE_WEBHOOK: 'stripe-webhook',
  CLEANUP_ORPHANED_FILES: 'cleanup-orphaned-files',
  CLEANUP_DELETED_FILES: 'cleanup-deleted-files',
  WEBHOOK_DELIVERY: 'webhook-delivery',
  INCOMING_WEBHOOK_PROCESSING: 'incoming-webhook-processing',
  AUDIT_LOGS: 'audit-logs',
  ACTIVITIES: 'activities',
  NOTIFICATION_EMAIL: 'notification-email',
  USAGE_AGGREGATION: 'usage-aggregation',
  STRIPE_USAGE_REPORT: 'stripe-usage-report',
  ACTIVE_SEATS: 'active-seats',
  AI_TASK: 'ai-task',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

