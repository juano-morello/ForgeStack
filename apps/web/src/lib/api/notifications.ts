/**
 * Notifications API Client
 *
 * API functions for notifications.
 * Note: Error logging is handled by the calling hooks, not here.
 */

import { api } from '@/lib/api';
import type {
  NotificationFilters,
  NotificationsResponse,
  NotificationPreference,
  NotificationPreferences,
} from '@/types/notifications';

/**
 * List notifications with pagination and filters
 */
export async function listNotifications(
  filters?: NotificationFilters
): Promise<NotificationsResponse> {
  const params = new URLSearchParams();

  if (filters?.limit) {
    params.set('limit', String(filters.limit));
  }
  if (filters?.cursor) {
    params.set('cursor', filters.cursor);
  }
  if (filters?.type) {
    params.set('type', filters.type);
  }
  if (filters?.unreadOnly !== undefined) {
    params.set('unreadOnly', String(filters.unreadOnly));
  }

  const queryString = params.toString();
  const endpoint = `/notifications${queryString ? `?${queryString}` : ''}`;

  return api.get<NotificationsResponse>(endpoint);
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  return api.get<{ count: number }>('/notifications/unread-count');
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await api.patch(`/notifications/${notificationId}/read`);
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  await api.patch('/notifications/read-all');
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`/notifications/${notificationId}`);
}

/**
 * Get notification preferences
 */
export async function getPreferences(_orgId: string): Promise<NotificationPreferences> {
  return api.get<NotificationPreferences>('/notifications/preferences');
}

/**
 * Update notification preferences
 */
export async function updatePreferences(
  _orgId: string,
  preferences: NotificationPreference[]
): Promise<void> {
  await api.patch('/notifications/preferences', { preferences });
}

