/**
 * Organization Types
 *
 * Type definitions for organization-related data structures.
 */

export type OrgRole = 'OWNER' | 'MEMBER';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  role?: OrgRole;
  memberCount?: number;
}

export interface OrganizationsResponse {
  items: Organization[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateOrganizationDto {
  name: string;
}

export interface UpdateOrganizationDto {
  name?: string;
}

