'use client';

/**
 * Notification Item Component
 *
 * Displays a single notification with icon, title, body, and timestamp.
 */

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { 
  Bell, 
  UserPlus, 
  Shield, 
  CreditCard, 
  Share, 
  File, 
  Webhook, 
  UserCheck, 
  FolderPlus 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getNotificationIcon } from '@/lib/notification-constants';
import type { Notification } from '@/types/notifications';

interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'bell': Bell,
  'user-plus': UserPlus,
  'shield': Shield,
  'credit-card': CreditCard,
  'share': Share,
  'file': File,
  'webhook': Webhook,
  'user-check': UserCheck,
  'folder-plus': FolderPlus,
};

export function NotificationItem({
  notification,
  onClick,
}: NotificationItemProps) {
  const isUnread = !notification.readAt;
  
  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const iconName = getNotificationIcon(notification.type);
  const IconComponent = iconMap[iconName] || Bell;

  const content = (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer',
        isUnread ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-muted',
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 mt-1">
        <div className={cn(
          'rounded-full p-2',
          isUnread ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
        )}>
          <IconComponent className="h-4 w-4" />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm',
            isUnread ? 'font-semibold' : 'font-normal'
          )}>
            {notification.title}
          </p>
          {isUnread && (
            <div className="flex-shrink-0 h-2 w-2 rounded-full bg-primary mt-1" />
          )}
        </div>
        
        {notification.body && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.body}
          </p>
        )}
        
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
    </div>
  );

  if (notification.link) {
    return (
      <Link href={notification.link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

