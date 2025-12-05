/**
 * Notification Types
 * Defines all notification types and their default settings
 * Base types from @forgestack/shared
 */

export { NOTIFICATION_TYPES } from '@forgestack/shared';
export type { NotificationType, NotificationPriority } from '@forgestack/shared';

// Backend-specific default settings
export const NOTIFICATION_DEFAULTS: Record<string, { defaultEmail: boolean; defaultInApp: boolean }> = {
  // High Priority (email + in-app)
  'member.invited': { defaultEmail: true, defaultInApp: true },
  'member.role_changed': { defaultEmail: true, defaultInApp: true },
  'billing.payment_failed': { defaultEmail: true, defaultInApp: true },
  'billing.subscription_cancelled': { defaultEmail: true, defaultInApp: true },

  // Medium Priority (in-app, email optional)
  'project.shared': { defaultEmail: false, defaultInApp: true },
  'file.shared': { defaultEmail: false, defaultInApp: true },
  'webhook.failed': { defaultEmail: false, defaultInApp: true },

  // Low Priority (in-app only)
  'member.joined': { defaultEmail: false, defaultInApp: true },
  'project.created': { defaultEmail: false, defaultInApp: true },
};
