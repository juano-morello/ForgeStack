/**
 * Notification Constants
 *
 * Constants and helper functions for notification types and priorities.
 * Base types imported from @forgestack/shared
 */

import { type NotificationPriority } from '@forgestack/shared/browser';

// Extended notification type info for UI display
export const NOTIFICATION_TYPES = {
  'member.invited': {
    label: 'Organization Invitations',
    icon: 'user-plus',
    priority: 'high' as NotificationPriority
  },
  'member.role_changed': {
    label: 'Role Changes',
    icon: 'shield',
    priority: 'high' as NotificationPriority
  },
  'billing.payment_failed': {
    label: 'Payment Issues',
    icon: 'credit-card',
    priority: 'high' as NotificationPriority
  },
  'billing.subscription_cancelled': {
    label: 'Subscription Cancelled',
    icon: 'credit-card',
    priority: 'high' as NotificationPriority
  },
  'project.shared': {
    label: 'Project Sharing',
    icon: 'share',
    priority: 'medium' as NotificationPriority
  },
  'file.shared': {
    label: 'File Sharing',
    icon: 'file',
    priority: 'medium' as NotificationPriority
  },
  'webhook.failed': {
    label: 'Webhook Failures',
    icon: 'webhook',
    priority: 'medium' as NotificationPriority
  },
  'member.joined': {
    label: 'New Members',
    icon: 'user-check',
    priority: 'low' as NotificationPriority
  },
  'project.created': {
    label: 'Project Creation',
    icon: 'folder-plus',
    priority: 'low' as NotificationPriority
  },
} as const;

export const PRIORITY_LABELS: Record<NotificationPriority, string> = {
  high: 'Critical',
  medium: 'Important',
  low: 'Updates',
};

export const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  high: 'text-destructive',
  medium: 'text-orange-500',
  low: 'text-muted-foreground',
};

/**
 * Get the icon name for a notification type
 */
export function getNotificationIcon(type: string): string {
  const notificationType = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
  return notificationType?.icon || 'bell';
}

/**
 * Get the label for a notification type
 */
export function getNotificationLabel(type: string): string {
  const notificationType = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
  return notificationType?.label || type;
}

/**
 * Get the priority for a notification type
 */
export function getNotificationPriority(type: string): NotificationPriority {
  const notificationType = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
  return notificationType?.priority || 'low';
}

/**
 * Get the color class for a priority level
 */
export function getPriorityColor(priority: string): string {
  return PRIORITY_COLORS[priority as NotificationPriority] || PRIORITY_COLORS.low;
}

/**
 * Get the label for a priority level
 */
export function getPriorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority as NotificationPriority] || priority;
}

/**
 * Group notification types by priority
 */
export function getNotificationTypesByPriority(): {
  high: Array<{ type: string; label: string; icon: string }>;
  medium: Array<{ type: string; label: string; icon: string }>;
  low: Array<{ type: string; label: string; icon: string }>;
} {
  const grouped = {
    high: [] as Array<{ type: string; label: string; icon: string }>,
    medium: [] as Array<{ type: string; label: string; icon: string }>,
    low: [] as Array<{ type: string; label: string; icon: string }>,
  };

  Object.entries(NOTIFICATION_TYPES).forEach(([type, config]) => {
    grouped[config.priority].push({
      type,
      label: config.label,
      icon: config.icon,
    });
  });

  return grouped;
}

