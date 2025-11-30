/**
 * Activity Item Component
 *
 * Displays a single activity entry with avatar, title, and timestamp.
 */

import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ActivityIcon } from './activity-icon';
import type { Activity } from '@/types/activities';

interface ActivityItemProps {
  activity: Activity;
  showIcon?: boolean;
}

export function ActivityItem({ activity, showIcon = true }: ActivityItemProps) {
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const getResourceLink = () => {
    if (!activity.resourceType || !activity.resourceId) return null;

    const linkMap: Record<string, string> = {
      project: `/projects/${activity.resourceId}`,
      file: `/files/${activity.resourceId}`,
      member: `/settings/organization`,
      api_key: `/settings/api-keys`,
      webhook: `/settings/webhooks`,
    };

    return linkMap[activity.resourceType];
  };

  const resourceLink = getResourceLink();

  return (
    <div className="flex items-start gap-3 py-3">
      {showIcon && (
        <div className="flex-shrink-0">
          <ActivityIcon type={activity.type} />
        </div>
      )}
      
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={activity.actorAvatar || undefined} />
        <AvatarFallback className="text-xs">
          {getInitials(activity.actorName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{activity.actorName || 'Unknown'}</span>
          {' '}
          <span className="text-muted-foreground">{activity.title}</span>
          {activity.aggregationCount > 1 && (
            <span className="ml-1 text-xs font-medium text-primary">
              ({activity.aggregationCount})
            </span>
          )}
        </p>
        {activity.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {activity.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {formatRelativeTime(activity.createdAt)}
        </p>
      </div>

      {resourceLink && activity.resourceName && (
        <Link
          href={resourceLink}
          className="text-xs text-primary hover:underline flex-shrink-0"
        >
          View
        </Link>
      )}
    </div>
  );
}

