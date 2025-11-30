/**
 * Activity Types
 *
 * Type definitions for activity feed.
 */

export interface Activity {
  id: string;
  orgId: string;
  actorId: string | null;
  actorName: string | null;
  actorAvatar: string | null;
  type: string;
  title: string;
  description: string | null;
  resourceType: string | null;
  resourceId: string | null;
  resourceName: string | null;
  metadata: Record<string, unknown> | null;
  aggregationCount: number;
  createdAt: string;
}

export interface ActivityFilters {
  type?: string;
  actorId?: string;
  resourceType?: string;
  limit?: number;
  cursor?: string;
}

export interface ActivitiesResponse {
  data: Activity[];
  nextCursor: string | null;
  hasMore: boolean;
}

