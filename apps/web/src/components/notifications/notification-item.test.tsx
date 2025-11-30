/**
 * NotificationItem Component Tests
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NotificationItem } from './notification-item';
import type { Notification } from '@/types/notifications';

describe('NotificationItem', () => {
  const mockNotification: Notification = {
    id: '1',
    userId: 'user-1',
    orgId: 'org-1',
    type: 'member.invited',
    title: 'You have been invited',
    body: 'You have been invited to join Acme Corp',
    link: '/invitations',
    metadata: null,
    readAt: null,
    emailSent: false,
    createdAt: new Date().toISOString(),
  };

  it('renders notification title', () => {
    render(<NotificationItem notification={mockNotification} />);
    
    expect(screen.getByText('You have been invited')).toBeInTheDocument();
  });

  it('renders notification body', () => {
    render(<NotificationItem notification={mockNotification} />);
    
    expect(screen.getByText('You have been invited to join Acme Corp')).toBeInTheDocument();
  });

  it('shows unread indicator for unread notifications', () => {
    const { container } = render(<NotificationItem notification={mockNotification} />);
    
    // Check for unread indicator (blue dot)
    const unreadDot = container.querySelector('.bg-primary');
    expect(unreadDot).toBeInTheDocument();
  });

  it('does not show unread indicator for read notifications', () => {
    const readNotification = {
      ...mockNotification,
      readAt: new Date().toISOString(),
    };

    const { container } = render(<NotificationItem notification={readNotification} />);
    
    // Check that unread indicator is not present
    const unreadDot = container.querySelector('.bg-primary.h-2.w-2');
    expect(unreadDot).not.toBeInTheDocument();
  });

  it('renders relative timestamp', () => {
    render(<NotificationItem notification={mockNotification} />);
    
    // Should show "recently" or "X ago"
    const timeElement = screen.getByText(/ago|recently/i);
    expect(timeElement).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<NotificationItem notification={mockNotification} onClick={onClick} />);
    
    const item = screen.getByText('You have been invited').closest('div');
    item?.click();
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders as link when notification has link', () => {
    render(<NotificationItem notification={mockNotification} />);
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/invitations');
  });

  it('does not render as link when notification has no link', () => {
    const notificationWithoutLink = {
      ...mockNotification,
      link: null,
    };

    render(<NotificationItem notification={notificationWithoutLink} />);
    
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});

