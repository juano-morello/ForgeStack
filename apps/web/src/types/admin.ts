/**
 * Admin Types
 *
 * Type definitions for super-admin dashboard functionality.
 */

export interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  isSuperAdmin: boolean;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  suspendedBy: string | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminOrganization {
  id: string;
  name: string;
  ownerUserId: string;
  suspendedAt: Date | null;
  suspendedReason: string | null;
  suspendedBy: string | null;
  createdAt: Date;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlatformAuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourceName: string | null;
  targetOrgId: string | null;
  targetOrgName: string | null;
  changes: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface SuspendUserRequest {
  reason: string;
}

export interface SuspendOrganizationRequest {
  reason: string;
}

export interface TransferOwnershipRequest {
  newOwnerId: string;
}

export interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  suspendedUsers: number;
  suspendedOrganizations: number;
}

