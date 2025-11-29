import { users, organizations, organizationMembers, projects } from '../schema/index.js';
import { withServiceContext } from '../context.js';
import { randomUUID } from 'crypto';

/**
 * Create a test user with the given email
 */
export async function createTestUser(email: string) {
  return withServiceContext('test-setup', async (db) => {
    const [user] = await db.insert(users).values({
      id: randomUUID(),
      email,
      name: email.split('@')[0] || 'Test User', // Use email prefix as name
      emailVerified: false,
    }).returning();
    return user;
  });
}

/**
 * Create a test organization with the given name and owner
 */
export async function createTestOrg(name: string, ownerUserId: string) {
  return withServiceContext('test-setup', async (db) => {
    const [org] = await db
      .insert(organizations)
      .values({
        name,
        ownerUserId,
      })
      .returning();

    if (org) {
      await db.insert(organizationMembers).values({
        orgId: org.id,
        userId: ownerUserId,
        role: 'OWNER',
      });
    }

    return org;
  });
}

/**
 * Create a test project for an organization
 */
export async function createTestProject(orgId: string, name: string, description?: string) {
  return withServiceContext('test-setup', async (db) => {
    const [project] = await db
      .insert(projects)
      .values({
        orgId,
        name,
        description,
      })
      .returning();
    return project;
  });
}

/**
 * Clean up all test data in reverse order of dependencies
 */
export async function cleanupTestData() {
  return withServiceContext('test-cleanup', async (db) => {
    await db.delete(projects);
    await db.delete(organizationMembers);
    await db.delete(organizations);
    await db.delete(users);
  });
}

