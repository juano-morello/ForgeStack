'use client';

/**
 * useRoles Hook
 *
 * Hook for managing roles - CRUD operations for roles.
 */

import { useState, useCallback, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import type { Role, RolesResponse, CreateRoleDto, UpdateRoleDto } from '@/types/rbac';

interface UseRolesOptions {
  orgId: string | null;
  autoFetch?: boolean;
}

export function useRoles({ orgId, autoFetch = true }: UseRolesOptions) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<RolesResponse>('/roles');
      setRoles(data.roles);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch roles';
      setError(message);
      console.error('Error fetching roles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Fetch single role
  const fetchRole = useCallback(
    async (roleId: string): Promise<Role> => {
      const role = await api.get<Role>(`/roles/${roleId}`);
      return role;
    },
    []
  );

  // Create role
  const createRole = useCallback(
    async (dto: CreateRoleDto): Promise<Role> => {
      if (!orgId) throw new Error('No organization selected');

      const role = await api.post<Role>('/roles', dto);
      setRoles((prev) => [...prev, role]);
      return role;
    },
    [orgId]
  );

  // Update role
  const updateRole = useCallback(
    async (roleId: string, dto: UpdateRoleDto): Promise<Role> => {
      if (!orgId) throw new Error('No organization selected');

      const role = await api.patch<Role>(`/roles/${roleId}`, dto);
      setRoles((prev) => prev.map((r) => (r.id === roleId ? role : r)));
      return role;
    },
    [orgId]
  );

  // Delete role
  const deleteRole = useCallback(
    async (roleId: string): Promise<void> => {
      if (!orgId) throw new Error('No organization selected');

      await api.delete(`/roles/${roleId}`);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    },
    [orgId]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && orgId) {
      fetchRoles();
    }
  }, [autoFetch, orgId, fetchRoles]);

  return {
    roles,
    isLoading,
    error,
    fetchRoles,
    fetchRole,
    createRole,
    updateRole,
    deleteRole,
  };
}

