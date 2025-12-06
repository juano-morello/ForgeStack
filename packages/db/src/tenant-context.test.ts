import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { withTenantContext, withServiceContext } from './context.js';
import { createTestUser, createTestOrg, cleanupTestData } from './test/helpers.js';
import { projects } from './schema/index.js';
import { sql } from 'drizzle-orm';

/**
 * Integration tests for tenant context functions.
 * These tests require a real PostgreSQL database connection.
 * They will be skipped if DATABASE_URL is not set or the database is unreachable.
 */

// Check database connectivity before running any tests
async function checkDatabaseConnection(): Promise<boolean> {
  if (!process.env.DATABASE_URL) {
    return false;
  }
  try {
    await withServiceContext('connectivity-check', async (db) => {
      await db.execute(sql`SELECT 1`);
    });
    return true;
  } catch {
    return false;
  }
}

// This will be set by the beforeAll hook
let dbAvailable = false;
let testUser: { id: string; email: string };
let testOrg: { id: string; name: string };

describe('Tenant Context', () => {
  beforeAll(async () => {
    dbAvailable = await checkDatabaseConnection();
    if (!dbAvailable) {
      console.log('⚠️  Skipping tenant context tests: Database not available');
      return;
    }

    // Clean up any existing test data first
    await cleanupTestData();

    // Create test user and org
    const user = await createTestUser('test@example.com');
    if (!user) throw new Error('Failed to create test user');
    testUser = user;

    const org = await createTestOrg('Test Org', testUser.id);
    if (!org) throw new Error('Failed to create test org');
    testOrg = org;
  });

  afterAll(async () => {
    if (dbAvailable) {
      await cleanupTestData();
    }
  });

  describe('withServiceContext', () => {
    it('allows all operations with service context', async () => {
      if (!dbAvailable) return;
      const result = await withServiceContext('test', async (db) => {
        return db.select().from(projects);
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('sets bypass_rls session variable', async () => {
      if (!dbAvailable) return;
      const result = await withServiceContext('test-bypass', async (db) => {
        const queryResult = await db.execute<{ bypass: string }>(
          sql`SELECT current_setting('app.bypass_rls', true) as bypass`
        );
        const rows = queryResult.rows as Array<{ bypass: string }>;
        return rows[0]?.bypass;
      });
      expect(result).toBe('true');
    });

    it('sets service_reason session variable', async () => {
      if (!dbAvailable) return;
      const reason = 'test-reason-check';
      const result = await withServiceContext(reason, async (db) => {
        const queryResult = await db.execute<{ reason: string }>(
          sql`SELECT current_setting('app.service_reason', true) as reason`
        );
        const rows = queryResult.rows as Array<{ reason: string }>;
        return rows[0]?.reason;
      });
      expect(result).toBe(reason);
    });
  });

  describe('withTenantContext', () => {
    it('sets org_id session variable', async () => {
      if (!dbAvailable) return;
      const result = await withTenantContext(
        { orgId: testOrg.id, userId: testUser.id, role: 'OWNER' },
        async (db) => {
          const queryResult = await db.execute<{ org_id: string }>(
            sql`SELECT current_setting('app.current_org_id', true) as org_id`
          );
          const rows = queryResult.rows as Array<{ org_id: string }>;
          return rows[0]?.org_id;
        }
      );
      expect(result).toBe(testOrg.id);
    });

    it('sets user_id session variable', async () => {
      if (!dbAvailable) return;
      const result = await withTenantContext(
        { orgId: testOrg.id, userId: testUser.id, role: 'OWNER' },
        async (db) => {
          const queryResult = await db.execute<{ user_id: string }>(
            sql`SELECT current_setting('app.current_user_id', true) as user_id`
          );
          const rows = queryResult.rows as Array<{ user_id: string }>;
          return rows[0]?.user_id;
        }
      );
      expect(result).toBe(testUser.id);
    });

    it('sets role session variable', async () => {
      if (!dbAvailable) return;
      const result = await withTenantContext(
        { orgId: testOrg.id, userId: testUser.id, role: 'MEMBER' },
        async (db) => {
          const queryResult = await db.execute<{ role: string }>(
            sql`SELECT current_setting('app.current_role', true) as role`
          );
          const rows = queryResult.rows as Array<{ role: string }>;
          return rows[0]?.role;
        }
      );
      expect(result).toBe('MEMBER');
    });

    it('rejects invalid orgId format', async () => {
      if (!dbAvailable) return;
      await expect(
        withTenantContext({ orgId: 'invalid-id', userId: testUser.id, role: 'OWNER' }, async (db) => {
          return db.select().from(projects);
        })
      ).rejects.toThrow('Invalid orgId format');
    });

    it('rejects invalid userId format', async () => {
      if (!dbAvailable) return;
      await expect(
        withTenantContext({ orgId: testOrg.id, userId: 'not-a-uuid', role: 'OWNER' }, async (db) => {
          return db.select().from(projects);
        })
      ).rejects.toThrow('Invalid userId format');
    });

    it('rejects invalid role', async () => {
      if (!dbAvailable) return;
      await expect(
        withTenantContext(
          { orgId: testOrg.id, userId: testUser.id, role: 'ADMIN' as 'OWNER' },
          async (db) => {
            return db.select().from(projects);
          }
        )
      ).rejects.toThrow('Invalid role');
    });
  });

  describe('Context isolation', () => {
    it('requires context to be provided', async () => {
      // This test doesn't need database - it tests validation
      await expect(
        // @ts-expect-error - Testing null context
        withTenantContext(null, async (db) => {
          return db.select().from(projects);
        })
      ).rejects.toThrow('Database context is required');
    });
  });
});

