/**
 * Member and Invitation Types
 * Base types imported from @forgestack/shared
 */

import type { OrgRole } from '@forgestack/shared/browser';

export interface Member {
  userId: string;
  email: string;
  name: string | null;
  role: OrgRole;
  joinedAt: string;
  roles?: Array<{
    id: string;
    name: string;
    isSystem: boolean;
  }>;
}

export interface MembersResponse {
  items: Member[];
  total: number;
  page: number;
  limit: number;
}

export interface Invitation {
  id: string;
  orgId: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
  createdAt: string;
}

export interface InvitationsResponse {
  items: Invitation[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateInvitationDto {
  email: string;
  role: OrgRole;
}

export interface AcceptInvitationDto {
  token: string;
}

export interface UpdateMemberRoleDto {
  role: OrgRole;
}

export interface AcceptedInvitationResponse {
  organization: {
    id: string;
    name: string;
  };
  role: OrgRole;
}

