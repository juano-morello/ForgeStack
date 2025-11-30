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
} as const;

