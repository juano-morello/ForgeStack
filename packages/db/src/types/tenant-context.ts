/**
 * Tenant context types for RLS enforcement
 */

import type { OrgRole } from '../schema/organization-members.js';

/**
 * Tenant context for RLS
 *
 * This context is set at the beginning of each database transaction
 * and used by PostgreSQL RLS policies to determine row-level access.
 */
export interface TenantContext {
  /** The current organization ID */
  orgId: string;
  /** The authenticated user ID */
  userId: string;
  /** The user's role in the current organization */
  role: OrgRole;
}

/**
 * Service context for bypassing RLS
 *
 * Used for system operations like migrations, admin tasks, and background jobs.
 * Should NEVER be exposed to user-facing API routes.
 */
export interface ServiceContext {
  /** Flag to bypass RLS policies */
  bypassRls: true;
  /** Reason for bypassing RLS (for audit logging) */
  reason: string;
}

/**
 * Union type for all context types
 */
export type DatabaseContext = TenantContext | ServiceContext;

/**
 * Type guard to check if context is a service context
 */
export function isServiceContext(ctx: DatabaseContext): ctx is ServiceContext {
  return 'bypassRls' in ctx && ctx.bypassRls === true;
}

/**
 * Type guard to check if context is a tenant context
 */
export function isTenantContext(ctx: DatabaseContext): ctx is TenantContext {
  return 'orgId' in ctx && 'userId' in ctx && 'role' in ctx;
}

