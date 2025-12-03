import { pgTable, uuid, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';
import { roles } from './roles';

/**
 * Member-Role junction table
 * Replaces the role column in organization_members
 */
export const memberRoles = pgTable('member_roles', {
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  assignedAt: timestamp('assigned_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.orgId, table.userId, table.roleId] }),
  userIdIdx: index('idx_member_roles_user_id').on(table.userId),
  roleIdIdx: index('idx_member_roles_role_id').on(table.roleId),
}));

/**
 * Member-Role relations
 */
export const memberRolesRelations = relations(memberRoles, ({ one }) => ({
  organization: one(organizations, {
    fields: [memberRoles.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [memberRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [memberRoles.roleId],
    references: [roles.id],
  }),
}));

// Type exports
export type MemberRole = typeof memberRoles.$inferSelect;
export type NewMemberRole = typeof memberRoles.$inferInsert;

