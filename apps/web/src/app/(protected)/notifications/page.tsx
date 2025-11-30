'use client';

/**
 * Notifications Page
 *
 * Full page view of all notifications with filtering and actions.
 */

import { useState } from 'react';
import { CheckCheck, Loader2, Trash2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationItem } from '@/components/notifications/notification-item';
import { useToast } from '@/hooks/use-toast';
import { getNotificationTypesByPriority } from '@/lib/notification-constants';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [unreadOnlyFilter, setUnreadOnlyFilter] = useState(false);

  const { 
    notifications, 
    isLoading, 
    error,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications({ 
    filters: { 
      limit: 20,
      type: typeFilter === 'all' ? undefined : typeFilter,
      unreadOnly: unreadOnlyFilter,
    },
    autoFetch: true,
  });

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
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
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleDelete = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await deleteNotification(notificationId);
      toast({
        title: 'Notification deleted',
      });
    } catch (err) {
      toast({
        title: 'Failed to delete notification',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.readAt).length;
  const notificationTypes = getNotificationTypesByPriority();
  const allTypes = [
    ...notificationTypes.high,
    ...notificationTypes.medium,
    ...notificationTypes.low,
  ];

  return (
    <div className="container max-w-4xl py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline">
            <CheckCheck className="h-4 w-4 mr-2" />
            Mark all read
          </Button>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {allTypes.map((type) => (
                  <SelectItem key={type.type} value={type.type}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant={unreadOnlyFilter ? 'default' : 'outline'}
            onClick={() => setUnreadOnlyFilter(!unreadOnlyFilter)}
          >
            Unread only
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading && notifications.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No notifications found</p>
            </div>
          ) : (
            <>
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div key={notification.id} className="relative group">
                    <NotificationItem
                      notification={notification}
                      onClick={() => handleNotificationClick(notification.id)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={(e) => handleDelete(notification.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="p-4 text-center border-t">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load more'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

