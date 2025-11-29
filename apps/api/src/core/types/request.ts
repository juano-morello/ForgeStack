import { Request } from 'express';
import { TenantContext } from '@forgestack/db';

/**
 * User information attached to authenticated requests
 */
export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
}

/**
 * Session information from better-auth
 */
export interface AuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
}

/**
 * Request with authenticated user (after auth verification)
 * tenantContext is optional - only present when X-Org-Id header is provided
 */
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  session: AuthSession;
  tenantContext?: TenantContext;
}

/**
 * Request with user and required tenant context (after TenantContextGuard with org)
 */
export interface RequestWithTenantContext extends AuthenticatedRequest {
  tenantContext: TenantContext;
}

/**
 * Alias for backwards compatibility - user authenticated, org context optional
 */
export type RequestWithUser = AuthenticatedRequest;

