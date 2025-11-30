/**
 * Activity Icon Component
 *
 * Displays an icon for an activity type with color coding.
 */

import {
  FolderPlus,
  FolderEdit,
  FolderMinus,
  UserPlus,
  UserMinus,
  UserCog,
  Upload,
  Trash,
  Key,
  Webhook,
  Circle,
} from 'lucide-react';
import { getActivityIcon, getActivityColorClass } from '@/lib/activity-constants';
import { cn } from '@/lib/utils';

interface ActivityIconProps {
  type: string;
  className?: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'folder-plus': FolderPlus,
  'folder-edit': FolderEdit,
  'folder-minus': FolderMinus,
  'user-plus': UserPlus,
  'user-minus': UserMinus,
  'user-cog': UserCog,
  'upload': Upload,
  'trash': Trash,
  'key': Key,
  'webhook': Webhook,
  'circle': Circle,
};

export function ActivityIcon({ type, className }: ActivityIconProps) {
  const iconName = getActivityIcon(type);
  const colorClass = getActivityColorClass(type);
  const IconComponent = iconMap[iconName] || Circle;

  return (
    <div className={cn('flex items-center justify-center rounded-full p-2', colorClass, className)}>
      <IconComponent className="h-4 w-4" />
    </div>
  );
}

