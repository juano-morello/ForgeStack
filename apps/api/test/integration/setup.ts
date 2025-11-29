/**
 * Integration Test Setup
 *
 * Provides utilities for setting up and tearing down integration tests
 * that verify RLS policies with a real database connection.
 *
 * PREREQUISITES:
 * - Database must be running and accessible via DATABASE_URL
 * - Migrations must be applied (including RLS policies)
 *   Run: cd packages/db && pnpm db:migrate
 *
 * The tests will be skipped if DATABASE_URL is not set.
 */

import { randomUUID } from 'crypto';
import {
  withServiceContext,
  users,
  organizations,
  organizationMembers,
  projects,
  closePool,
  type User,
  type Organization,
} from '@forgestack/db';

/**
 * Test context containing test users and organizations
 */
export interface TestContext {
  testUser: User;
  testOrg: Organization;
  otherUser: User;
  otherOrg: Organization;
}

/**
 * Setup test database with two users in two separate organizations
 * 
 * This creates:
 * - User A with Organization A (User A is OWNER)
 * - User B with Organization B (User B is OWNER)
 * 
 * This setup allows testing cross-tenant isolation.
 */
export async function setupTestDatabase(): Promise<TestContext> {
  // Create first user
  const testUser = await withServiceContext('integration-test-setup', async (db) => {
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: 'test-user-a@integration.test',
        name: 'Test User A',
        emailVerified: false,
      })
      .returning();
    return user;
  });

  if (!testUser) {
    throw new Error('Failed to create test user');
  }

  // Create first organization
  const testOrg = await withServiceContext('integration-test-setup', async (db) => {
    const [org] = await db
      .insert(organizations)
      .values({
        name: 'Test Organization A',
        ownerUserId: testUser.id,
      })
      .returning();

    if (org) {
      // Add user as OWNER member
      await db.insert(organizationMembers).values({
        orgId: org.id,
        userId: testUser.id,
        role: 'OWNER',
      });
    }

    return org;
  });

  if (!testOrg) {
    throw new Error('Failed to create test organization');
  }

  // Create second user
  const otherUser = await withServiceContext('integration-test-setup', async (db) => {
    const [user] = await db
      .insert(users)
      .values({
        id: randomUUID(),
        email: 'test-user-b@integration.test',
        name: 'Test User B',
        emailVerified: false,
      })
      .returning();
    return user;
  });

  if (!otherUser) {
    throw new Error('Failed to create other user');
  }

  // Create second organization
  const otherOrg = await withServiceContext('integration-test-setup', async (db) => {
    const [org] = await db
      .insert(organizations)
      .values({
        name: 'Test Organization B',
        ownerUserId: otherUser.id,
      })
      .returning();

    if (org) {
      // Add user as OWNER member
      await db.insert(organizationMembers).values({
        orgId: org.id,
        userId: otherUser.id,
        role: 'OWNER',
      });
    }

    return org;
  });

  if (!otherOrg) {
    throw new Error('Failed to create other organization');
  }

  return {
    testUser,
    testOrg,
    otherUser,
    otherOrg,
  };
}

/**
 * Clean up all test data
 *
 * Deletes all test data in reverse order of dependencies.
 * Uses service context to bypass RLS.
 */
export async function cleanupTestDatabase(): Promise<void> {
  await withServiceContext('integration-test-cleanup', async (db) => {
    // Delete in reverse order of dependencies
    await db.delete(projects);
    await db.delete(organizationMembers);
    await db.delete(organizations);
    await db.delete(users);
  });
}

/**
 * Close the database pool
 *
 * Should be called after all tests are complete to allow Jest to exit cleanly.
 */
export async function closeDatabasePool(): Promise<void> {
  await closePool();
}

