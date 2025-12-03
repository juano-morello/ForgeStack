/**
 * Member and Invitation Types
 */

export interface Member {
  userId: string;
  email: string;
  name: string | null;
  role: 'OWNER' | 'MEMBER';
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
  role: 'OWNER' | 'MEMBER';
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
  role: 'OWNER' | 'MEMBER';
}

export interface AcceptInvitationDto {
  token: string;
}

export interface UpdateMemberRoleDto {
  role: 'OWNER' | 'MEMBER';
}

export interface AcceptedInvitationResponse {
  organization: {
    id: string;
    name: string;
  };
  role: 'OWNER' | 'MEMBER';
}

