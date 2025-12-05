/**
 * Notification Types
 * Types for notification system
 */

export const NOTIFICATION_TYPES = {
  'member.invited': { priority: 'high' as const },
  'member.role_changed': { priority: 'high' as const },
  'billing.payment_failed': { priority: 'high' as const },
  'billing.subscription_cancelled': { priority: 'high' as const },
  'project.shared': { priority: 'medium' as const },
  'file.shared': { priority: 'medium' as const },
  'webhook.failed': { priority: 'medium' as const },
  'member.joined': { priority: 'low' as const },
  'project.created': { priority: 'low' as const },
} as const;

export type NotificationType = keyof typeof NOTIFICATION_TYPES;
export type NotificationPriority = 'high' | 'medium' | 'low';

export interface BaseNotification {
  id: string;
  userId: string;
  orgId: string | null;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  emailSent: boolean;
  createdAt: string;
}

