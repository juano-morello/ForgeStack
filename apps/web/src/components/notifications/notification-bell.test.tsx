/**
 * NotificationBell Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationBell } from './notification-bell';
import * as useNotificationsModule from '@/hooks/use-notifications';

// Mock the hooks
vi.mock('@/hooks/use-notifications');

describe('NotificationBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNotificationsModule.useUnreadCount).mockReturnValue({
      count: 0,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });
  });

  it('renders bell icon', () => {
    render(<NotificationBell />);

    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();
  });

  it('shows badge when there are unread notifications', () => {
    vi.mocked(useNotificationsModule.useUnreadCount).mockReturnValue({
      count: 5,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<NotificationBell />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('shows 99+ when count exceeds 99', () => {
    vi.mocked(useNotificationsModule.useUnreadCount).mockReturnValue({
      count: 150,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<NotificationBell />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('does not show badge when count is 0', () => {
    vi.mocked(useNotificationsModule.useUnreadCount).mockReturnValue({
      count: 0,
      isLoading: false,
      error: null,
      refresh: vi.fn(),
    });

    render(<NotificationBell />);

    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});

