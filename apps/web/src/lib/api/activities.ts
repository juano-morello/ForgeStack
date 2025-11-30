/**
 * Activities API Client
 *
 * API functions for activity feed.
 */

import { api } from '@/lib/api';
import type {
  Activity,
  ActivityFilters,
  ActivitiesResponse,
} from '@/types/activities';

/**
 * List activities with pagination and filters
 */
export async function listActivities(
  orgId: string,
  filters?: ActivityFilters
): Promise<ActivitiesResponse> {
  try {
    const params = new URLSearchParams();
    
    if (filters?.limit) {
      params.set('limit', String(filters.limit));
    }
    if (filters?.cursor) {
      params.set('cursor', filters.cursor);
    }
    if (filters?.type) {
      params.set('type', filters.type);
    }
    if (filters?.actorId) {
      params.set('actorId', filters.actorId);
    }
    if (filters?.resourceType) {
      params.set('resourceType', filters.resourceType);
    }

    const queryString = params.toString();
    const endpoint = `/activities${queryString ? `?${queryString}` : ''}`;

    const response = await api.get<ActivitiesResponse>(endpoint);
    return response;
  } catch (error) {
    console.error('Failed to fetch activities:', error);
    throw error;
  }
}

/**
 * Get recent activities for dashboard widget
 */
export async function getRecentActivities(
  orgId: string,
  limit: number = 10
): Promise<Activity[]> {
  try {
    const params = new URLSearchParams();
    params.set('limit', String(limit));

    const response = await api.get<{ data: Activity[] }>(
      `/activities/recent?${params.toString()}`
    );
    return response.data;
  } catch (error) {
    console.error('Failed to fetch recent activities:', error);
    throw error;
  }
}

