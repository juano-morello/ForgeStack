import { pgTable, uuid, varchar, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizationMembers } from './organization-members';
import { projects } from './projects';
import { invitations } from './invitations';
import { roles } from './roles';
import { memberRoles } from './member-roles';

/**
 * Organizations table - tenant entities for multi-tenancy
 */
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerUserId: text('owner_user_id')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Organization relations
 */
export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  // Owner of the organization
  owner: one(users, {
    fields: [organizations.ownerUserId],
    references: [users.id],
  }),
  // Members of the organization
  members: many(organizationMembers),
  // Projects in the organization
  projects: many(projects),
  // Pending invitations
  invitations: many(invitations),
  // Custom roles for this organization
  roles: many(roles),
  // Member role assignments
  memberRoles: many(memberRoles),
}));

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

