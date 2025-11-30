'use client';

/**
 * useActivities Hook
 *
 * Hook for managing activities state.
 * Provides methods to fetch activities with cursor-based pagination.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import {
  listActivities,
  getRecentActivities as getRecentActivitiesApi,
} from '@/lib/api/activities';
import type {
  Activity,
  ActivityFilters,
} from '@/types/activities';

interface UseActivitiesOptions {
  orgId: string;
  filters?: ActivityFilters;
  autoFetch?: boolean;
}

export function useActivities({ orgId, filters, autoFetch = true }: UseActivitiesOptions) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities
  const fetchActivities = useCallback(async (currentFilters?: ActivityFilters, append = false) => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await listActivities(orgId, currentFilters);
      
      if (append) {
        setActivities((prev) => [...prev, ...response.data]);
      } else {
        setActivities(response.data);
      }
      
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch activities';
      setError(message);
      console.error('Error fetching activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Load more activities (pagination)
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoading) return;

    await fetchActivities({ ...filters, cursor: nextCursor }, true);
  }, [hasMore, nextCursor, isLoading, filters, fetchActivities]);

  // Refresh activities
  const refresh = useCallback(async () => {
    await fetchActivities(filters, false);
  }, [filters, fetchActivities]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchActivities(filters, false);
    }
  }, [autoFetch, orgId, filters, fetchActivities]);

  return {
    activities,
    isLoading,
    error,
    hasMore,
    fetchActivities,
    loadMore,
    refresh,
  };
}

interface UseRecentActivitiesOptions {
  orgId: string;
  limit?: number;
  autoFetch?: boolean;
}

export function useRecentActivities({ orgId, limit = 10, autoFetch = true }: UseRecentActivitiesOptions) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch recent activities
  const fetchRecentActivities = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getRecentActivitiesApi(orgId, limit);
      setActivities(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch recent activities';
      setError(message);
      console.error('Error fetching recent activities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, limit]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchRecentActivities();
    }
  }, [autoFetch, orgId, fetchRecentActivities]);

  return {
    activities,
    isLoading,
    error,
    fetchRecentActivities,
  };
}

