import { pgTable, uuid, text, timestamp, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

/**
 * Impersonation Sessions table - tracks super-admin impersonation sessions
 * Platform-level table (not org-scoped) for security and compliance
 */
export const impersonationSessions = pgTable(
  'impersonation_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Actor (super-admin who initiated)
    actorId: text('actor_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Target user being impersonated
    targetUserId: text('target_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Session token (stored as SHA-256 hash for security)
    token: text('token').notNull().unique(),

    // Session timing
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),

    // Metrics
    actionsCount: integer('actions_count').notNull().default(0),

    // Request context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    actorIdIdx: index('idx_impersonation_sessions_actor_id').on(table.actorId),
    targetUserIdIdx: index('idx_impersonation_sessions_target_user_id').on(table.targetUserId),
    tokenIdx: index('idx_impersonation_sessions_token').on(table.token),
    expiresAtIdx: index('idx_impersonation_sessions_expires_at').on(table.expiresAt),
  }),
);

/**
 * Impersonation session relations
 */
export const impersonationSessionsRelations = relations(impersonationSessions, ({ one }) => ({
  actor: one(users, {
    fields: [impersonationSessions.actorId],
    references: [users.id],
    relationName: 'impersonation_actor',
  }),
  targetUser: one(users, {
    fields: [impersonationSessions.targetUserId],
    references: [users.id],
    relationName: 'impersonation_target',
  }),
}));

// Type exports
export type ImpersonationSession = typeof impersonationSessions.$inferSelect;
export type NewImpersonationSession = typeof impersonationSessions.$inferInsert;

