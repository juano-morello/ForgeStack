'use client';

/**
 * useNotifications Hook
 *
 * Hook for managing notifications state with cursor-based pagination.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import {
  listNotifications,
  getUnreadCount,
  markAsRead as markAsReadApi,
  markAllAsRead as markAllAsReadApi,
  deleteNotification as deleteNotificationApi,
  getPreferences as getPreferencesApi,
  updatePreferences as updatePreferencesApi,
} from '@/lib/api/notifications';
import type {
  Notification,
  NotificationFilters,
  NotificationPreference,
  NotificationPreferences,
} from '@/types/notifications';

interface UseNotificationsOptions {
  filters?: NotificationFilters;
  autoFetch?: boolean;
  pollInterval?: number; // in milliseconds
}

export function useNotifications({ 
  filters, 
  autoFetch = true,
  pollInterval,
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (currentFilters?: NotificationFilters, append = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listNotifications(currentFilters);
      
      if (append) {
        setNotifications((prev) => [...prev, ...response.data]);
      } else {
        setNotifications(response.data);
      }
      
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      setUnreadCount(response.unreadCount);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch notifications';
      setError(message);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load more notifications (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoading) return;

    await fetchNotifications({ ...filters, cursor: nextCursor }, true);
  }, [hasMore, nextCursor, isLoading, filters, fetchNotifications]);

  // Refresh notifications
  const refresh = useCallback(async () => {
    await fetchNotifications(filters, false);
  }, [filters, fetchNotifications]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadApi(notificationId);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, readAt: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to mark as read';
      setError(message);
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadApi();
      
      // Update local state
      const now = new Date().toISOString();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: n.readAt || now }))
      );
      setUnreadCount(0);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to mark all as read';
      setError(message);
      console.error('Error marking all notifications as read:', err);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationApi(notificationId);
      
      // Update local state
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete notification';
      setError(message);
      console.error('Error deleting notification:', err);
    }
  }, []);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch) {
      fetchNotifications(filters, false);
    }
  }, [autoFetch, filters, fetchNotifications]);

  // Polling for updates
  useEffect(() => {
    if (!pollInterval) return;

    const interval = setInterval(() => {
      fetchNotifications(filters, false);
    }, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval, filters, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    hasMore,
    fetchNotifications,
    loadMore,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

/**
 * useUnreadCount Hook
 *
 * Hook for fetching and polling unread notification count.
 * Handles authentication state and network errors gracefully.
 */
export function useUnreadCount(pollInterval: number = 30000) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fetchCount = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getUnreadCount();
      // Only update state if not aborted
      if (!signal?.aborted) {
        setCount(response.count);
      }
    } catch (err) {
      // Don't update state if aborted (component unmounted)
      if (signal?.aborted) return;

      // Handle different error types
      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        // Network error - API might be unavailable
        // Silently fail in development, user might not be logged in
        setError('Unable to connect to server');
        // Only log in development for debugging
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.debug('[useUnreadCount] Network error - API may be unavailable');
        }
      } else if (err instanceof ApiError) {
        // API returned an error response
        if (err.status === 401) {
          // User not authenticated - this is expected, don't treat as error
          setError(null);
          setCount(0);
        } else {
          setError(err.message);
          console.error('[useUnreadCount] API error:', err.message);
        }
      } else {
        const message = 'Failed to fetch unread count';
        setError(message);
        console.error('[useUnreadCount] Unexpected error:', err);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Track mount state for SSR safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initial fetch with abort controller
  useEffect(() => {
    if (!isMounted) return;

    const abortController = new AbortController();
    fetchCount(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [fetchCount, isMounted]);

  // Polling with abort on unmount
  useEffect(() => {
    if (!isMounted || !pollInterval) return;

    const abortController = new AbortController();
    const interval = setInterval(() => {
      fetchCount(abortController.signal);
    }, pollInterval);

    return () => {
      clearInterval(interval);
      abortController.abort();
    };
  }, [pollInterval, fetchCount, isMounted]);

  // Manual refresh function
  const refresh = useCallback(() => {
    return fetchCount();
  }, [fetchCount]);

  return {
    count,
    isLoading,
    error,
    refresh,
  };
}

/**
 * useNotificationPreferences Hook
 *
 * Hook for managing notification preferences.
 */
export function useNotificationPreferences(orgId: string) {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchPreferences = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getPreferencesApi(orgId);
      setPreferences(response);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch preferences';
      setError(message);
      console.error('Error fetching notification preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  const updatePreference = useCallback(async (updatedPreferences: NotificationPreference[]) => {
    if (!orgId) return;

    setIsSaving(true);
    setError(null);

    try {
      await updatePreferencesApi(orgId, updatedPreferences);
      setPreferences({ preferences: updatedPreferences });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to update preferences';
      setError(message);
      console.error('Error updating notification preferences:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    isLoading,
    error,
    isSaving,
    updatePreference,
    refresh: fetchPreferences,
  };
}

