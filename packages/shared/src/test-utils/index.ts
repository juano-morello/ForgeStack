/**
 * Shared Test Utilities
 * Reusable test fixtures and data factories for consistent test data generation
 * across the monorepo.
 *
 * NOTE: This file should NOT import from @forgestack/db to avoid triggering
 * database connections in unit tests.
 */

/**
 * Generate a mock UUID v4
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
 * Create mock user data
 */
export function createMockUser(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUID(),
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: false,
    image: null as string | null,
    isSuperAdmin: false,
    suspendedAt: null as Date | null,
    suspendedReason: null as string | null,
    suspendedBy: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
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
    orgId: mockUUID(),
    name: 'Test Project',
    description: 'Test project description',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock organization member data
 */
export function createMockMember(overrides: Record<string, unknown> = {}) {
  return {
    orgId: mockUUID(),
    userId: mockUUID(),
    role: 'MEMBER' as const,
    joinedAt: new Date(),
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
    orgId: mockUUID(),
    email: 'invite@example.com',
    role: 'MEMBER' as const,
    token: 'a'.repeat(64), // 64 char hex string
    expiresAt,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock API key data
 */
export function createMockApiKey(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUID(),
    orgId: mockUUID(),
    name: 'Test API Key',
    keyPrefix: 'fsk_test_abc123',
    keyHash: 'a'.repeat(64), // SHA-256 hash
    scopes: [] as string[],
    lastUsedAt: null as Date | null,
    expiresAt: null as Date | null,
    revokedAt: null as Date | null,
    createdBy: mockUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock activity data
 */
export function createMockActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUID(),
    orgId: mockUUID(),
    actorId: mockUUID(),
    actorName: 'Test User',
    actorAvatar: null as string | null,
    type: 'project.created',
    title: 'created a new project',
    description: null as string | null,
    resourceType: 'project',
    resourceId: mockUUID(),
    resourceName: 'Test Project',
    metadata: null as Record<string, unknown> | null,
    aggregationKey: null as string | null,
    aggregationCount: 1,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock notification data
 */
export function createMockNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUID(),
    userId: mockUUID(),
    orgId: mockUUID(),
    type: 'member.invited',
    title: 'You have been invited to an organization',
    body: 'Test Organization has invited you to join',
    link: null as string | null,
    metadata: null as Record<string, unknown> | null,
    readAt: null as Date | null,
    emailSent: false,
    createdAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock webhook endpoint data
 */
export function createMockWebhookEndpoint(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUID(),
    orgId: mockUUID(),
    url: 'https://example.com/webhook',
    description: null as string | null,
    secret: 'whsec_' + 'a'.repeat(32),
    events: [] as string[],
    enabled: true,
    createdBy: mockUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/**
 * Create mock webhook delivery data
 */
export function createMockWebhookDelivery(overrides: Record<string, unknown> = {}) {
  return {
    id: mockUUID(),
    orgId: mockUUID(),
    endpointId: mockUUID(),
    eventType: 'project.created',
    eventId: mockUUID(),
    payload: { test: 'data' } as Record<string, unknown>,
    requestHeaders: null as Record<string, unknown> | null,
    responseStatus: null as number | null,
    responseBody: null as string | null,
    responseHeaders: null as Record<string, unknown> | null,
    attemptNumber: 1,
    nextRetryAt: null as Date | null,
    deliveredAt: null as Date | null,
    failedAt: null as Date | null,
    error: null as string | null,
    createdAt: new Date(),
    ...overrides,
  };
}

// Re-export mock context utilities
export { createMockTenantContext, createMockRequest } from './mock-context';

