'use client';

/**
 * useAuditLogs Hook
 *
 * Hook for managing audit logs state.
 * Provides methods to fetch audit logs with pagination and filters.
 */

import { useState, useCallback, useEffect } from 'react';
import { ApiError } from '@/lib/api';
import {
  listAuditLogs,
  getAuditLogStats,
} from '@/lib/api/audit-logs';
import type {
  AuditLog,
  AuditLogFilters,
  AuditLogStats,
} from '@/types/audit-logs';

interface UseAuditLogsOptions {
  orgId: string;
  filters?: AuditLogFilters;
  autoFetch?: boolean;
}

export function useAuditLogs({ orgId, filters, autoFetch = true }: UseAuditLogsOptions) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Fetch audit logs
  const fetchLogs = useCallback(async (currentFilters?: AuditLogFilters) => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await listAuditLogs(orgId, currentFilters);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch audit logs';
      setError(message);
      console.error('Error fetching audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Load specific page
  const loadPage = useCallback(async (page: number) => {
    await fetchLogs({ ...filters, page });
  }, [filters, fetchLogs]);

  // Refresh current page
  const refresh = useCallback(async () => {
    await fetchLogs({ ...filters, page: pagination.page });
  }, [filters, pagination.page, fetchLogs]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchLogs(filters);
    }
  }, [autoFetch, orgId, filters, fetchLogs]);

  return {
    logs,
    isLoading,
    error,
    pagination,
    fetchLogs,
    loadPage,
    refresh,
  };
}

interface UseAuditLogStatsOptions {
  orgId: string;
  filters?: AuditLogFilters;
  autoFetch?: boolean;
}

export function useAuditLogStats({ orgId, filters, autoFetch = true }: UseAuditLogStatsOptions) {
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch audit log stats
  const fetchStats = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getAuditLogStats(orgId, filters);
      setStats(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch audit log stats';
      setError(message);
      console.error('Error fetching audit log stats:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, filters]);

  // Auto-fetch on mount and when filters change
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchStats();
    }
  }, [autoFetch, orgId, fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
}

