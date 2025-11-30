/**
 * Notification Types
 *
 * Type definitions for notifications system.
 */

export interface Notification {
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

