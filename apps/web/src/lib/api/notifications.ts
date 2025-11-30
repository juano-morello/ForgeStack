/**
 * Notifications API Client
 *
 * API functions for notifications.
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
  try {
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

    const response = await api.get<NotificationsResponse>(endpoint);
    return response;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  try {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response;
  } catch (error) {
    console.error('Failed to fetch unread count:', error);
    throw error;
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<void> {
  try {
    await api.patch(`/notifications/${notificationId}/read`);
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<void> {
  try {
    await api.patch('/notifications/read-all');
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
}

/**
 * Get notification preferences
 */
export async function getPreferences(_orgId: string): Promise<NotificationPreferences> {
  try {
    const response = await api.get<NotificationPreferences>('/notifications/preferences');
    return response;
  } catch (error) {
    console.error('Failed to fetch notification preferences:', error);
    throw error;
  }
}

/**
 * Update notification preferences
 */
export async function updatePreferences(
  _orgId: string,
  preferences: NotificationPreference[]
): Promise<void> {
  try {
    await api.patch('/notifications/preferences', { preferences });
  } catch (error) {
    console.error('Failed to update notification preferences:', error);
    throw error;
  }
}

