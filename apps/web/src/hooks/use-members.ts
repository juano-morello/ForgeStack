'use client';

/**
 * useMembers Hook
 * Hook for managing organization members
 */

import { useState, useEffect, useCallback } from 'react';
import { api, ApiError } from '@/lib/api';
import type {
  Member,
  MembersResponse,
  Invitation,
  InvitationsResponse,
  CreateInvitationDto,
  UpdateMemberRoleDto,
} from '@/types/member';

interface UseMembersOptions {
  orgId: string | null;
}

export function useMembers({ orgId }: UseMembersOptions) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch members
  const fetchMembers = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<MembersResponse>(`/organizations/${orgId}/members`);
      setMembers(data.items);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to fetch members';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Fetch pending invitations
  const fetchInvitations = useCallback(async () => {
    if (!orgId) return;
    try {
      const data = await api.get<InvitationsResponse>(`/organizations/${orgId}/invitations`);
      setInvitations(data.items);
    } catch (err) {
      // Silently fail for non-owners (403)
      if (err instanceof ApiError && err.status === 403) {
        setInvitations([]);
      } else {
        console.error('Failed to fetch invitations:', err);
      }
    }
  }, [orgId]);

  // Invite a member
  const inviteMember = useCallback(async (dto: CreateInvitationDto): Promise<Invitation> => {
    if (!orgId) throw new Error('No organization selected');
    const invitation = await api.post<Invitation>(`/organizations/${orgId}/invitations`, dto);
    setInvitations(prev => [...prev, invitation]);
    return invitation;
  }, [orgId]);

  // Cancel an invitation
  const cancelInvitation = useCallback(async (invitationId: string): Promise<void> => {
    if (!orgId) throw new Error('No organization selected');
    await api.delete(`/organizations/${orgId}/invitations/${invitationId}`);
    setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
  }, [orgId]);

  // Update member role
  const updateMemberRole = useCallback(async (
    userId: string,
    dto: UpdateMemberRoleDto
  ): Promise<Member> => {
    if (!orgId) throw new Error('No organization selected');
    const member = await api.patch<Member>(`/organizations/${orgId}/members/${userId}`, dto);
    setMembers(prev => prev.map(m => m.userId === userId ? member : m));
    return member;
  }, [orgId]);

  // Remove member
  const removeMember = useCallback(async (userId: string): Promise<void> => {
    if (!orgId) throw new Error('No organization selected');
    await api.delete(`/organizations/${orgId}/members/${userId}`);
    setMembers(prev => prev.filter(m => m.userId !== userId));
  }, [orgId]);

  // Fetch on mount and when orgId changes
  useEffect(() => {
    if (orgId) {
      fetchMembers();
      fetchInvitations();
    }
  }, [orgId, fetchMembers, fetchInvitations]);

  return {
    members,
    invitations,
    isLoading,
    error,
    fetchMembers,
    fetchInvitations,
    inviteMember,
    cancelInvitation,
    updateMemberRole,
    removeMember,
  };
}

