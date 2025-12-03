import { pgTable, uuid, text, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { rolePermissions } from './role-permissions';

/**
 * Permissions table - Available permissions (seeded, global)
 * Format: "resource:action" (e.g., "projects:create")
 */
export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
}, (table) => ({
  resourceActionIdx: uniqueIndex('idx_permissions_resource_action').on(table.resource, table.action),
}));

/**
 * Permission relations
 */
export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
}));

// Type exports
export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;

