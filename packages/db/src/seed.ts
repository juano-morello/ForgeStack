/* eslint-disable no-console */
/**
 * Seed script for development data
 *
 * Creates sample users, organizations, and projects for local development
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { users, accounts, organizations, organizationMembers, projects, featureFlags } from './schema';
import { seedRbac } from './seed/rbac-seed';

/**
 * Test user password for E2E tests
 * This password is used by Playwright tests in apps/web/e2e/fixtures.ts
 */
const TEST_PASSWORD = 'TestPassword123';

async function seed() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/forgestack_dev',
  });

  const db = drizzle(pool);

  console.log('Seeding database...');

  // Seed RBAC permissions and system roles first
  await seedRbac(db);

  // Pre-hash the test password for both users
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  // Create super-admin user (for platform administration)
  const superAdminId = randomUUID();
  const [superAdmin] = await db
    .insert(users)
    .values({
      id: superAdminId,
      name: 'Super Admin',
      email: 'superadmin@forgestack.dev',
      emailVerified: true,
      isSuperAdmin: true,
    })
    .onConflictDoNothing()
    .returning();

  if (superAdmin) {
    console.log('Created super-admin user:', superAdmin.email);

    // Create credential account for super-admin (for E2E tests)
    await db
      .insert(accounts)
      .values({
        id: randomUUID(),
        accountId: superAdmin.email,
        providerId: 'credential',
        userId: superAdmin.id,
        password: hashedPassword,
      })
      .onConflictDoNothing();

    console.log('Created credential account for super-admin');
  }

  // Create test user (better-auth compatible with id, name, email)
  const userId = randomUUID();
  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      name: 'Admin User',
      email: 'admin@forgestack.dev',
      emailVerified: true,
    })
    .onConflictDoNothing()
    .returning();

  if (user) {
    console.log('Created user:', user.email);

    // Create credential account for test user (for E2E tests)
    await db
      .insert(accounts)
      .values({
        id: randomUUID(),
        accountId: user.email,
        providerId: 'credential',
        userId: user.id,
        password: hashedPassword,
      })
      .onConflictDoNothing();

    console.log('Created credential account for test user (password: TestPassword123!)');

    // Create test organization
    const [org] = await db
      .insert(organizations)
      .values({
        name: 'ForgeStack Demo',
        ownerUserId: user.id,
      })
      .onConflictDoNothing()
      .returning();

    if (org) {
      console.log('Created organization:', org.name);

      // Add user as owner member
      await db
        .insert(organizationMembers)
        .values({
          orgId: org.id,
          userId: user.id,
          role: 'OWNER',
        })
        .onConflictDoNothing();

      console.log('Added user as organization owner');

      // Create sample projects
      const sampleProjects = [
        { name: 'Website Redesign', description: 'Redesign the company website' },
        { name: 'Mobile App', description: 'Build iOS and Android app' },
        { name: 'API Integration', description: 'Integrate with third-party APIs' },
      ];

      for (const proj of sampleProjects) {
        await db
          .insert(projects)
          .values({
            orgId: org.id,
            name: proj.name,
            description: proj.description,
          })
          .onConflictDoNothing();

        console.log('Created project:', proj.name);
      }
    }
  } else {
    console.log('User already exists, skipping seed...');
  }

  // Seed feature flags
  console.log('Seeding feature flags...');
  const defaultFlags = [
    {
      key: 'advanced-analytics',
      name: 'Advanced Analytics',
      description: 'Access to advanced analytics dashboards and reports',
      type: 'plan',
      plans: ['pro', 'enterprise'],
      defaultValue: false,
      enabled: true,
    },
    {
      key: 'api-access',
      name: 'API Access',
      description: 'Access to REST API with API keys',
      type: 'plan',
      plans: ['pro', 'enterprise'],
      defaultValue: false,
      enabled: true,
    },
    {
      key: 'custom-webhooks',
      name: 'Custom Webhooks',
      description: 'Create custom outgoing webhook endpoints',
      type: 'plan',
      plans: ['pro', 'enterprise'],
      defaultValue: false,
      enabled: true,
    },
    {
      key: 'audit-logs',
      name: 'Audit Logs',
      description: 'Access to audit log history and exports',
      type: 'plan',
      plans: ['enterprise'],
      defaultValue: false,
      enabled: true,
    },
    {
      key: 'sso',
      name: 'Single Sign-On',
      description: 'SAML/OIDC single sign-on integration',
      type: 'plan',
      plans: ['enterprise'],
      defaultValue: false,
      enabled: true,
    },
    {
      key: 'beta-features',
      name: 'Beta Features',
      description: 'Access to experimental features (manual enablement)',
      type: 'boolean',
      plans: null,
      defaultValue: false,
      enabled: true,
    },
  ];

  for (const flag of defaultFlags) {
    await db
      .insert(featureFlags)
      .values(flag)
      .onConflictDoNothing();
    console.log('Created feature flag:', flag.key);
  }

  console.log('Seeding complete!');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

