/**
 * Notification Constants
 *
 * Constants and helper functions for notification types and priorities.
 */

export const NOTIFICATION_TYPES = {
  'member.invited': { 
    label: 'Organization Invitations', 
    icon: 'user-plus', 
    priority: 'high' 
  },
  'member.role_changed': { 
    label: 'Role Changes', 
    icon: 'shield', 
    priority: 'high' 
  },
  'billing.payment_failed': { 
    label: 'Payment Issues', 
    icon: 'credit-card', 
    priority: 'high' 
  },
  'billing.subscription_cancelled': { 
    label: 'Subscription Cancelled', 
    icon: 'credit-card', 
    priority: 'high' 
  },
  'project.shared': { 
    label: 'Project Sharing', 
    icon: 'share', 
    priority: 'medium' 
  },
  'file.shared': { 
    label: 'File Sharing', 
    icon: 'file', 
    priority: 'medium' 
  },
  'webhook.failed': { 
    label: 'Webhook Failures', 
    icon: 'webhook', 
    priority: 'medium' 
  },
  'member.joined': { 
    label: 'New Members', 
    icon: 'user-check', 
    priority: 'low' 
  },
  'project.created': { 
    label: 'Project Creation', 
    icon: 'folder-plus', 
    priority: 'low' 
  },
} as const;

export const PRIORITY_LABELS = {
  high: 'Critical',
  medium: 'Important',
  low: 'Updates',
} as const;

export const PRIORITY_COLORS = {
  high: 'text-destructive',
  medium: 'text-orange-500',
  low: 'text-muted-foreground',
} as const;

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
export function getNotificationPriority(type: string): 'high' | 'medium' | 'low' {
  const notificationType = NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES];
  return notificationType?.priority || 'low';
}

/**
 * Get the color class for a priority level
 */
export function getPriorityColor(priority: string): string {
  return PRIORITY_COLORS[priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.low;
}

/**
 * Get the label for a priority level
 */
export function getPriorityLabel(priority: string): string {
  return PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] || priority;
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
    grouped[config.priority as keyof typeof grouped].push({
      type,
      label: config.label,
      icon: config.icon,
    });
  });

  return grouped;
}

