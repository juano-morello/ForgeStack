/**
 * Seed script for development data
 *
 * Creates sample users, organizations, and projects for local development
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import { users, organizations, organizationMembers, projects } from './schema';

async function seed() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/forgestack_dev',
  });

  const db = drizzle(pool);

  console.log('Seeding database...');

  // Create test user (better-auth compatible with id, name, email)
  const [user] = await db
    .insert(users)
    .values({
      id: randomUUID(),
      name: 'Admin User',
      email: 'admin@forgestack.dev',
      emailVerified: true,
    })
    .onConflictDoNothing()
    .returning();

  if (user) {
    console.log('Created user:', user.email);

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

  console.log('Seeding complete!');

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

