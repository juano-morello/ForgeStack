import { pgTable, uuid, text, bigint, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

/**
 * Files table - stores metadata for uploaded files in R2/S3
 * All files are scoped to an organization for RLS enforcement
 */
export const files = pgTable('files', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  // Note: users.id is text type (better-auth), not uuid
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'set null' }),

  // Storage location
  bucket: text('bucket').notNull(),
  key: text('key').notNull(),

  // File metadata
  filename: text('filename').notNull(),
  contentType: text('content_type').notNull(),
  size: bigint('size', { mode: 'number' }).notNull(),

  // Purpose and linking
  purpose: text('purpose').notNull(), // 'avatar', 'logo', 'attachment'
  entityType: text('entity_type'), // 'user', 'organization', 'project', etc.
  entityId: uuid('entity_id'),

  // Timestamps
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }), // null until complete
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  orgIdIdx: index('idx_files_org_id').on(table.orgId),
  userIdIdx: index('idx_files_user_id').on(table.userId),
  purposeIdx: index('idx_files_purpose').on(table.purpose),
  entityIdx: index('idx_files_entity').on(table.entityType, table.entityId),
  keyIdx: index('idx_files_key').on(table.key),
}));

/**
 * File relations
 */
export const filesRelations = relations(files, ({ one }) => ({
  // Organization that owns the file
  organization: one(organizations, {
    fields: [files.orgId],
    references: [organizations.id],
  }),
  // User who uploaded the file
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
}));

// Type exports
export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;

