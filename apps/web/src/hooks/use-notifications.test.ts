/**
 * useNotifications Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useNotifications, useUnreadCount } from './use-notifications';
import * as notificationsApi from '@/lib/api/notifications';

// Mock the API
vi.mock('@/lib/api/notifications');

describe('useNotifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches notifications on mount', async () => {
    const mockResponse = {
      data: [
        {
          id: '1',
          userId: 'user-1',
          orgId: 'org-1',
          type: 'member.invited',
          title: 'Test notification',
          body: 'Test body',
          link: null,
          metadata: null,
          readAt: null,
          emailSent: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(notificationsApi.listNotifications).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useNotifications({ autoFetch: true }));

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    expect(result.current.notifications[0].title).toBe('Test notification');
    expect(result.current.unreadCount).toBe(1);
  });

  it('handles loading state', async () => {
    vi.mocked(notificationsApi.listNotifications).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useNotifications({ autoFetch: true }));

    expect(result.current.isLoading).toBe(true);
  });

  it('handles error state', async () => {
    vi.mocked(notificationsApi.listNotifications).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() => useNotifications({ autoFetch: true }));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });

  it('marks notification as read', async () => {
    const mockResponse = {
      data: [
        {
          id: '1',
          userId: 'user-1',
          orgId: 'org-1',
          type: 'member.invited',
          title: 'Test notification',
          body: 'Test body',
          link: null,
          metadata: null,
          readAt: null,
          emailSent: false,
          createdAt: new Date().toISOString(),
        },
      ],
      unreadCount: 1,
      nextCursor: null,
      hasMore: false,
    };

    vi.mocked(notificationsApi.listNotifications).mockResolvedValue(mockResponse);
    vi.mocked(notificationsApi.markAsRead).mockResolvedValue();

    const { result } = renderHook(() => useNotifications({ autoFetch: true }));

    await waitFor(() => {
      expect(result.current.notifications).toHaveLength(1);
    });

    await result.current.markAsRead('1');

    await waitFor(() => {
      expect(result.current.notifications[0].readAt).toBeTruthy();
      expect(result.current.unreadCount).toBe(0);
    });
  });
});

describe('useUnreadCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches unread count on mount', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockResolvedValue({ count: 5 });

    const { result } = renderHook(() => useUnreadCount(0));

    await waitFor(() => {
      expect(result.current.count).toBe(5);
    });
  });

  it('handles error state', async () => {
    vi.mocked(notificationsApi.getUnreadCount).mockRejectedValue(
      new Error('Failed to fetch')
    );

    const { result } = renderHook(() => useUnreadCount(0));

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});

