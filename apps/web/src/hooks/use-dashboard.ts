'use client';

/**
 * useDashboard Hook
 *
 * Hook for fetching dashboard summary data.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import { dashboardApi } from '@/lib/api';
import type { DashboardSummary } from '@/types/dashboard';

interface UseDashboardOptions {
  orgId: string;
  autoFetch?: boolean;
}

export function useDashboard({ orgId, autoFetch = true }: UseDashboardOptions) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const summary = await dashboardApi.getSummary();
      setData(summary);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch dashboard data';
      setError(message);
      console.error('Error fetching dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchDashboard();
    }
  }, [autoFetch, orgId, fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refresh: fetchDashboard,
  };
}

