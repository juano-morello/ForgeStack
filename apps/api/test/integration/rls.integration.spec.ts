/**
 * RLS Integration Tests
 *
 * These tests verify that Row-Level Security (RLS) policies work correctly
 * with a real database connection. They ensure that:
 *
 * 1. Users can only see data in their own organization
 * 2. Users cannot access data from other organizations
 * 3. RLS policies block unauthorized access at the database level
 * 4. Cross-tenant isolation is enforced
 */

import { setupTestDatabase, cleanupTestDatabase, closeDatabasePool, type TestContext } from './setup';
import {
  withTenantContext,
  withServiceContext,
  projects,
  organizationMembers,
  eq,
  pool,
  sql,
} from '@forgestack/db';

describe('RLS Integration Tests', () => {
  let ctx: TestContext;

  beforeAll(async () => {
    // Skip tests if DATABASE_URL is not available
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set, skipping RLS integration tests');
      return;
    }

    // Setup test database with two users in two organizations
    ctx = await setupTestDatabase();
  });

  afterAll(async () => {
    if (ctx) {
      await cleanupTestDatabase();
    }
    // Close the database pool to allow Jest to exit cleanly
    await closeDatabasePool();
  });

  describe('RLS Setup Verification', () => {
    it('should have RLS enabled on org-scoped tables', async () => {
      if (!ctx) return;

      // Query to check if RLS is enabled on tables
      const client = await pool.connect();
      try {
        const result = await client.query(`
          SELECT tablename, rowsecurity
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename IN ('organizations', 'organization_members', 'projects', 'invitations')
          ORDER BY tablename
        `);

        // All tables should have RLS enabled
        expect(result.rows.length).toBe(4);

        const rlsStatus = result.rows.reduce((acc, row) => {
          acc[row.tablename] = row.rowsecurity;
          return acc;
        }, {} as Record<string, boolean>);

        // If RLS is not enabled, provide helpful error message
        if (!result.rows.every((row) => row.rowsecurity === true)) {
          console.error('\n❌ RLS is not enabled on all tables!');
          console.error('Current RLS status:', rlsStatus);
          console.error('\nTo fix this, run migrations:');
          console.error('  cd packages/db && pnpm db:migrate\n');
        }

        expect(rlsStatus.organizations).toBe(true);
        expect(rlsStatus.organization_members).toBe(true);
        expect(rlsStatus.projects).toBe(true);
        expect(rlsStatus.invitations).toBe(true);
      } finally {
        client.release();
      }
    });
  });

  describe('Projects RLS', () => {
    it('should allow user to see projects in their organization', async () => {
      // Skip if no context (DATABASE_URL not set)
      if (!ctx) return;

      // Create a project in testOrg using service context
      const project = await withServiceContext('test-create-project', async (db) => {
        const [p] = await db
          .insert(projects)
          .values({
            orgId: ctx.testOrg.id,
            name: 'Test Project A',
            description: 'Project in Organization A',
          })
          .returning();
        return p;
      });

      // Query as testUser in testOrg context - should see the project
      const result = await withTenantContext(
        {
          orgId: ctx.testOrg.id,
          userId: ctx.testUser.id,
          role: 'OWNER',
        },
        async (db) => {
          return db.select().from(projects).where(eq(projects.id, project!.id));
        }
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe(project!.id);
      expect(result[0]?.name).toBe('Test Project A');
    });

    it('should NOT allow user to see projects in other organizations', async () => {
      if (!ctx) return;

      // Create a project in otherOrg using service context
      const project = await withServiceContext('test-create-project', async (db) => {
        const [p] = await db
          .insert(projects)
          .values({
            orgId: ctx.otherOrg.id,
            name: 'Test Project B',
            description: 'Project in Organization B',
          })
          .returning();
        return p;
      });

      // Query as testUser in testOrg context - should NOT see the project
      const result = await withTenantContext(
        {
          orgId: ctx.testOrg.id,
          userId: ctx.testUser.id,
          role: 'OWNER',
        },
        async (db) => {
          return db.select().from(projects).where(eq(projects.id, project!.id));
        }
      );

      // RLS should block access - result should be empty
      expect(result).toHaveLength(0);
    });

    it('should NOT allow user to update projects in other organizations', async () => {
      if (!ctx) return;

      // Create a project in otherOrg
      const project = await withServiceContext('test-create-project', async (db) => {
        const [p] = await db
          .insert(projects)
          .values({
            orgId: ctx.otherOrg.id,
            name: 'Project to Update',
            description: 'Should not be updatable by testUser',
          })
          .returning();
        return p;
      });

      // Try to update as testUser in testOrg context
      const result = await withTenantContext(
        {
          orgId: ctx.testOrg.id,
          userId: ctx.testUser.id,
          role: 'OWNER',
        },
        async (db) => {
          return db
            .update(projects)
            .set({ name: 'Hacked Name' })
            .where(eq(projects.id, project!.id))
            .returning();
        }
      );

      // RLS should block the update - no rows affected
      expect(result).toHaveLength(0);

      // Verify the project was not updated
      const unchanged = await withServiceContext('test-verify', async (db) => {
        const [p] = await db.select().from(projects).where(eq(projects.id, project!.id));
        return p;
      });

      expect(unchanged?.name).toBe('Project to Update');
    });

    it('should NOT allow user to delete projects in other organizations', async () => {
      if (!ctx) return;

      // Create a project in otherOrg
      const project = await withServiceContext('test-create-project', async (db) => {
        const [p] = await db
          .insert(projects)
          .values({
            orgId: ctx.otherOrg.id,
            name: 'Project to Delete',
            description: 'Should not be deletable by testUser',
          })
          .returning();
        return p;
      });

      // Try to delete as testUser in testOrg context
      const result = await withTenantContext(
        {
          orgId: ctx.testOrg.id,
          userId: ctx.testUser.id,
          role: 'OWNER',
        },
        async (db) => {
          return db.delete(projects).where(eq(projects.id, project!.id)).returning();
        }
      );

      // RLS should block the delete - no rows affected
      expect(result).toHaveLength(0);

      // Verify the project still exists
      const stillExists = await withServiceContext('test-verify', async (db) => {
        const [p] = await db.select().from(projects).where(eq(projects.id, project!.id));
        return p;
      });

      expect(stillExists).toBeDefined();
      expect(stillExists?.name).toBe('Project to Delete');
    });
  });

  describe('Organization Members RLS', () => {
    it('should allow user to see members in their organization', async () => {
      if (!ctx) return;

      // Query as testUser in testOrg context - should see members
      const result = await withTenantContext(
        {
          orgId: ctx.testOrg.id,
          userId: ctx.testUser.id,
          role: 'OWNER',
        },
        async (db) => {
          return db
            .select()
            .from(organizationMembers)
            .where(eq(organizationMembers.orgId, ctx.testOrg.id));
        }
      );

      // Should see at least the owner (testUser)
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((m) => m.userId === ctx.testUser.id)).toBe(true);
    });

    it('should NOT allow user to see members in other organizations', async () => {
      if (!ctx) return;

      // Query as testUser in testOrg context - should NOT see otherOrg members
      const result = await withTenantContext(
        {
          orgId: ctx.testOrg.id,
          userId: ctx.testUser.id,
          role: 'OWNER',
        },
        async (db) => {
          return db
            .select()
            .from(organizationMembers)
            .where(eq(organizationMembers.orgId, ctx.otherOrg.id));
        }
      );

      // RLS should block access - result should be empty
      expect(result).toHaveLength(0);
    });
  });

  describe('Cross-tenant isolation', () => {
    it('should completely isolate data between organizations', async () => {
      if (!ctx) return;

      // Create projects in both organizations
      await withServiceContext('test-create-projects', async (db) => {
        await db.insert(projects).values([
          {
            orgId: ctx.testOrg.id,
            name: 'Org A Project 1',
          },
          {
            orgId: ctx.testOrg.id,
            name: 'Org A Project 2',
          },
          {
            orgId: ctx.otherOrg.id,
            name: 'Org B Project 1',
          },
          {
            orgId: ctx.otherOrg.id,
            name: 'Org B Project 2',
          },
        ]);
      });

      // Query as testUser in testOrg context
      const testOrgProjects = await withTenantContext(
        {
          orgId: ctx.testOrg.id,
          userId: ctx.testUser.id,
          role: 'OWNER',
        },
        async (db) => {
          return db.select().from(projects);
        }
      );

      // Should only see testOrg projects
      expect(testOrgProjects.length).toBeGreaterThanOrEqual(2);
      expect(testOrgProjects.every((p) => p.orgId === ctx.testOrg.id)).toBe(true);
      expect(testOrgProjects.some((p) => p.name.startsWith('Org A'))).toBe(true);
      expect(testOrgProjects.some((p) => p.name.startsWith('Org B'))).toBe(false);

      // Query as otherUser in otherOrg context
      const otherOrgProjects = await withTenantContext(
        {
          orgId: ctx.otherOrg.id,
          userId: ctx.otherUser.id,
          role: 'OWNER',
        },
        async (db) => {
          return db.select().from(projects);
        }
      );

      // Should only see otherOrg projects
      expect(otherOrgProjects.length).toBeGreaterThanOrEqual(2);
      expect(otherOrgProjects.every((p) => p.orgId === ctx.otherOrg.id)).toBe(true);
      expect(otherOrgProjects.some((p) => p.name.startsWith('Org B'))).toBe(true);
      expect(otherOrgProjects.some((p) => p.name.startsWith('Org A'))).toBe(false);
    });
  });
});

