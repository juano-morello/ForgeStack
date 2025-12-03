'use client';

/**
 * usePermissionsList Hook
 *
 * Hook for fetching the list of all available permissions.
 */

import { useState, useCallback, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Permission, PermissionsResponse } from '@/types/rbac';

export function usePermissionsList() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedByResource, setGroupedByResource] = useState<Record<string, Permission[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<PermissionsResponse>('/permissions');
      setPermissions(data.permissions);
      setGroupedByResource(data.groupedByResource);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch permissions';
      setError(message);
      console.error('Error fetching permissions:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    groupedByResource,
    isLoading,
    error,
    refetch: fetchPermissions,
  };
}

