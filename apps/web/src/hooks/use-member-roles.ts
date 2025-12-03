'use client';

/**
 * useMemberRoles Hook
 *
 * Hook for managing member role assignments.
 */

import { useState, useCallback, useEffect } from 'react';
import { api, ApiError } from '@/lib/api';
import type { MemberRoles, AssignRolesDto } from '@/types/rbac';

interface UseMemberRolesOptions {
  userId: string | null;
  autoFetch?: boolean;
}

export function useMemberRoles({ userId, autoFetch = true }: UseMemberRolesOptions) {
  const [memberRoles, setMemberRoles] = useState<MemberRoles | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch member roles
  const fetchMemberRoles = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<MemberRoles>(`/members/${userId}/roles`);
      setMemberRoles(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch member roles';
      setError(message);
      console.error('Error fetching member roles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Assign roles to member
  const assignRoles = useCallback(
    async (dto: AssignRolesDto): Promise<MemberRoles> => {
      if (!userId) throw new Error('No user selected');

      const data = await api.patch<MemberRoles>(`/members/${userId}/roles`, dto);
      setMemberRoles(data);
      return data;
    },
    [userId]
  );

  // Auto-fetch on mount if enabled
  useEffect(() => {
    if (autoFetch && userId) {
      fetchMemberRoles();
    }
  }, [autoFetch, userId, fetchMemberRoles]);

  return {
    memberRoles,
    isLoading,
    error,
    fetchMemberRoles,
    assignRoles,
  };
}

