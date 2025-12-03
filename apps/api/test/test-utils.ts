/**
 * Test Utilities
 * Helpers for creating test modules and mock data
 *
 * NOTE: This file should NOT import from @forgestack/db or AppModule
 * to avoid triggering database connections in unit tests.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ModuleMetadata } from '@nestjs/common';

// Define TenantContext locally to avoid importing @forgestack/db
interface TenantContext {
  orgId: string;
  userId: string;
  role: 'OWNER' | 'MEMBER';
}

/**
 * Create a test module with common configurations
 */
export async function createTestModule(
  metadata: ModuleMetadata,
): Promise<TestingModule> {
  const moduleRef = await Test.createTestingModule(metadata).compile();
  return moduleRef;
}

/**
 * Generate a mock UUID
 * All IDs in the system are UUIDs (better-auth configured to generate UUIDs)
 */
export function mockUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
 */
export function createMockRequest(userId?: string) {
  const actualUserId = userId || mockUUID();
  return {
    user: { id: actualUserId },
    tenantContext: createMockTenantContext({ userId: actualUserId }),
  };
}

/**
 * Create mock organization data
 */
export function createMockOrganization(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUID(),
    name: 'Test Organization',
    ownerUserId: mockUUID(),
    logo: null as string | null,
    timezone: 'UTC',
    language: 'en',
    suspendedAt: null as Date | null,
    suspendedReason: null as string | null,
    suspendedBy: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock project data
 */
export function createMockProject(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUID(),
    orgId: 'test-org-id',
    name: 'Test Project',
    description: 'Test project description',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock invitation data
 */
export function createMockInvitation(overrides: Record<string, unknown> = {}) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  return {
    id: mockUUID(),
    orgId: 'test-org-id',
    email: 'test@example.com',
    role: 'MEMBER' as const,
    token: 'a'.repeat(64), // 64 char hex string
    expiresAt,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock db context helpers
 * These mock the withServiceContext and withTenantContext functions
 */
export const mockDbContextHelpers = {
  withServiceContext: jest.fn(
    async (_name: string, callback: (tx: unknown) => Promise<unknown>) => {
      return callback({});
    },
  ),
  withTenantContext: jest.fn(
    async (_ctx: TenantContext, callback: (tx: unknown) => Promise<unknown>) => {
      return callback({});
    },
  ),
};

/**
 * Reset all mock db context helpers
 */
export function resetDbMocks(): void {
  mockDbContextHelpers.withServiceContext.mockClear();
  mockDbContextHelpers.withTenantContext.mockClear();
}

