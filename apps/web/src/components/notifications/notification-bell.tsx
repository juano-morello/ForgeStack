'use client';

/**
 * Notification Bell Component
 *
 * Bell icon with unread count badge that opens notification dropdown.
 */

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useUnreadCount } from '@/hooks/use-notifications';
import { NotificationDropdown } from './notification-dropdown';

export function NotificationBell() {
  const { count, refresh } = useUnreadCount(30000); // Poll every 30 seconds

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {count > 99 ? '99+' : count}
            </Badge>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <NotificationDropdown onRefresh={refresh} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

