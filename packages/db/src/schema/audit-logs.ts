import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

/**
 * Audit logs table - immutable append-only log of all significant actions
 * All records are scoped to an organization for RLS enforcement
 */
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // org_id is nullable for user-scoped events (e.g., onboarding completion)
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' }),
    
    // Actor information (denormalized for historical accuracy)
    // Note: users.id is text type (better-auth), not uuid
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorType: text('actor_type').notNull(), // 'user', 'api_key', 'system'
    actorName: text('actor_name'), // Denormalized
    actorEmail: text('actor_email'), // Denormalized
    
    // Action information
    action: text('action').notNull(), // 'created', 'updated', 'deleted', etc.
    resourceType: text('resource_type').notNull(), // 'project', 'member', etc.
    resourceId: text('resource_id'),
    resourceName: text('resource_name'), // Denormalized
    
    // Change details
    changes: jsonb('changes'), // { before: {...}, after: {...} }
    metadata: jsonb('metadata'), // Additional context
    
    // Request context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('idx_audit_logs_org_id').on(table.orgId),
    actorIdIdx: index('idx_audit_logs_actor_id').on(table.actorId),
    actionIdx: index('idx_audit_logs_action').on(table.action),
    resourceTypeIdx: index('idx_audit_logs_resource_type').on(table.resourceType),
    resourceIdIdx: index('idx_audit_logs_resource_id').on(table.resourceId),
    createdAtIdx: index('idx_audit_logs_created_at').on(table.createdAt),
    // Composite index for common queries
    orgCreatedIdx: index('idx_audit_logs_org_created').on(table.orgId, table.createdAt),
  })
);

/**
 * Audit log relations
 */
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  organization: one(organizations, {
    fields: [auditLogs.orgId],
    references: [organizations.id],
  }),
  actor: one(users, {
    fields: [auditLogs.actorId],
    references: [users.id],
  }),
}));

// Type exports
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

