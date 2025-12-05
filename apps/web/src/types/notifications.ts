/**
 * Notification Types
 *
 * Extended type definitions for notifications system.
 * Base types imported from @forgestack/shared
 */

// Re-export base types from shared
export type { NotificationType, NotificationPriority, BaseNotification } from '@forgestack/shared/browser';
export { NOTIFICATION_TYPES } from '@forgestack/shared/browser';

// Aliases for backward compatibility
import type { BaseNotification } from '@forgestack/shared/browser';
export type Notification = BaseNotification;

// Web-specific types
export interface NotificationFilters {
  unreadOnly?: boolean;
  type?: string;
  limit?: number;
  cursor?: string;
}

export interface NotificationsResponse {
  data: Notification[];
  unreadCount: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export interface NotificationPreference {
  type: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
}

export interface NotificationPreferences {
  preferences: NotificationPreference[];
}

