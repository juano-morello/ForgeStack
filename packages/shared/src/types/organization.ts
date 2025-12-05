/**
 * Organization Types
 * Base types for organization entities
 */

import type { OrgRole } from './roles';

export interface BaseOrganization {
  id: string;
  name: string;
  logo?: string | null;
  timezone?: string | null;
  language?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationWithRole extends BaseOrganization {
  role?: OrgRole;
  memberCount?: number;
  effectivePermissions?: string[];
}

export interface CreateOrganizationInput {
  name: string;
}

export interface UpdateOrganizationInput {
  name?: string;
  logo?: string;
  timezone?: string;
  language?: string;
}

