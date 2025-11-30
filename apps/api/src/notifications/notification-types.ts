/**
 * Notification Types
 * Defines all notification types and their default settings
 */

export const NOTIFICATION_TYPES = {
  // High Priority (email + in-app)
  'member.invited': { priority: 'high', defaultEmail: true, defaultInApp: true },
  'member.role_changed': { priority: 'high', defaultEmail: true, defaultInApp: true },
  'billing.payment_failed': { priority: 'high', defaultEmail: true, defaultInApp: true },
  
  // Medium Priority (in-app, email optional)
  'project.shared': { priority: 'medium', defaultEmail: false, defaultInApp: true },
  'webhook.failed': { priority: 'medium', defaultEmail: false, defaultInApp: true },
  
  // Low Priority (in-app only)
  'member.joined': { priority: 'low', defaultEmail: false, defaultInApp: true },
  'project.created': { priority: 'low', defaultEmail: false, defaultInApp: true },
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;

