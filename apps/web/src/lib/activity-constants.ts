/**
 * Activity Constants
 *
 * Constants and helper functions for activity feed.
 */

import type { Activity } from '@/types/activities';

export const ACTIVITY_TYPES = {
  'project.created': { label: 'Project Created', icon: 'folder-plus', color: 'green' },
  'project.updated': { label: 'Project Updated', icon: 'folder-edit', color: 'blue' },
  'project.deleted': { label: 'Project Deleted', icon: 'folder-minus', color: 'red' },
  'member.joined': { label: 'Member Joined', icon: 'user-plus', color: 'green' },
  'member.invited': { label: 'Member Invited', icon: 'user-plus', color: 'blue' },
  'member.left': { label: 'Member Left', icon: 'user-minus', color: 'gray' },
  'member.removed': { label: 'Member Removed', icon: 'user-minus', color: 'red' },
  'member.role_changed': { label: 'Role Changed', icon: 'user-cog', color: 'blue' },
  'file.uploaded': { label: 'File Uploaded', icon: 'upload', color: 'green' },
  'file.deleted': { label: 'File Deleted', icon: 'trash', color: 'red' },
  'api_key.created': { label: 'API Key Created', icon: 'key', color: 'blue' },
  'api_key.revoked': { label: 'API Key Revoked', icon: 'key', color: 'red' },
  'webhook.created': { label: 'Webhook Created', icon: 'webhook', color: 'purple' },
  'webhook.updated': { label: 'Webhook Updated', icon: 'webhook', color: 'blue' },
  'webhook.deleted': { label: 'Webhook Deleted', icon: 'webhook', color: 'red' },
} as const;

export const RESOURCE_TYPES = {
  project: 'Project',
  file: 'File',
  member: 'Member',
  api_key: 'API Key',
  webhook: 'Webhook',
} as const;

/**
 * Get the icon name for an activity type
 */
export function getActivityIcon(type: string): string {
  const activityType = ACTIVITY_TYPES[type as keyof typeof ACTIVITY_TYPES];
  return activityType?.icon || 'circle';
}

/**
 * Get the color for an activity type
 */
export function getActivityColor(type: string): string {
  const activityType = ACTIVITY_TYPES[type as keyof typeof ACTIVITY_TYPES];
  return activityType?.color || 'gray';
}

/**
 * Format activity title for display
 */
export function formatActivityTitle(activity: Activity): string {
  // If aggregated, show count
  if (activity.aggregationCount > 1) {
    const baseTitle = activity.title.replace(/^(uploaded|deleted|created|updated)\s+/, '');
    const action = activity.title.match(/^(uploaded|deleted|created|updated)/)?.[1] || '';
    return `${action} ${activity.aggregationCount} ${baseTitle}`;
  }
  
  return activity.title;
}

/**
 * Get color class for activity type
 */
export function getActivityColorClass(type: string): string {
  const color = getActivityColor(type);
  const colorMap: Record<string, string> = {
    green: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    blue: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    red: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    purple: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
    gray: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30',
  };
  const grayClass = colorMap.gray as string;
  return colorMap[color] ?? grayClass;
}

