'use client';

/**
 * Notification Dropdown Component
 *
 * Dropdown panel showing recent notifications with actions.
 */

import Link from 'next/link';
import { CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { useToast } from '@/hooks/use-toast';

interface NotificationDropdownProps {
  onRefresh?: () => void;
}

export function NotificationDropdown({ onRefresh }: NotificationDropdownProps) {
  const { toast } = useToast();
  const { 
    notifications, 
    isLoading, 
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ 
    filters: { limit: 10 },
    autoFetch: true,
  });

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      onRefresh?.();
      toast({
        title: 'All notifications marked as read',
      });
    } catch (err) {
      toast({
        title: 'Failed to mark all as read',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleNotificationClick = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      onRefresh?.();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.readAt);

  return (
    <div className="flex flex-col max-h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-3">
        <h3 className="font-semibold text-sm">Notifications</h3>
        {unreadNotifications.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={handleMarkAllAsRead}
          >
            <CheckCheck className="h-3 w-3 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <Separator />

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && notifications.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No notifications</p>
            <p className="text-xs text-muted-foreground mt-1">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <>
          <Separator />
          <div className="p-2">
            <Link href="/notifications">
              <Button variant="ghost" className="w-full text-xs" size="sm">
                View all notifications
              </Button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

