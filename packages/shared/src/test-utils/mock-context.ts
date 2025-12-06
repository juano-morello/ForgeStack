/**
 * Mock Context Utilities
 * Helpers for creating mock tenant contexts and requests
 *
 * NOTE: This file should NOT import from @forgestack/db to avoid triggering
 * database connections in unit tests.
 */

import { mockUUID } from './index';

/**
 * Tenant context interface
 * Define locally to avoid importing @forgestack/db
 */
interface TenantContext {
  orgId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
}

/**
 * Create a mock tenant context for testing
 */
export function createMockTenantContext(
  overrides: Partial<TenantContext> = {},
): TenantContext {
  return {
    orgId: mockUUID(),
    userId: mockUUID(),
    role: 'OWNER',
    ...overrides,
  };
}

/**
 * Create a mock request with user info
 * Compatible with NestJS/Express request objects
 */
export function createMockRequest(userId?: string) {
  const actualUserId = userId || mockUUID();
  return {
    user: { id: actualUserId },
    tenantContext: createMockTenantContext({ userId: actualUserId }),
  };
}

