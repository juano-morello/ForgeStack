/**
 * Organization Types
 *
 * Extended type definitions for organization-related data structures.
 * Base types imported from @forgestack/shared
 */

// Re-export base types from shared
export type { OrgRole, BaseOrganization, CreateOrganizationInput, UpdateOrganizationInput } from '@forgestack/shared/browser';
export type { OrganizationWithRole } from '@forgestack/shared/browser';

// Alias for backward compatibility
import type { OrganizationWithRole } from '@forgestack/shared/browser';
export type Organization = OrganizationWithRole;

// Web-specific response types
export interface OrganizationsResponse {
  items: Organization[];
  total: number;
  page: number;
  limit: number;
}

// Backward compatibility aliases
export type CreateOrganizationDto = { name: string };
export type UpdateOrganizationDto = { name?: string };

