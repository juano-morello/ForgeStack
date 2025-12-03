import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';

/**
 * Platform-level audit logs for super-admin actions
 * NOT scoped to org_id - platform-wide
 * These logs are immutable and track all super-admin operations
 */
export const platformAuditLogs = pgTable(
  'platform_audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Actor (super-admin who performed the action)
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorEmail: text('actor_email').notNull(),

    // Action details
    action: text('action').notNull(), // e.g., 'user.suspended', 'org.deleted', 'flag.updated'
    resourceType: text('resource_type').notNull(), // e.g., 'user', 'organization', 'feature_flag'
    resourceId: text('resource_id'),
    resourceName: text('resource_name'),

    // Target organization (if action affects an org)
    targetOrgId: uuid('target_org_id').references(() => organizations.id, { onDelete: 'set null' }),
    targetOrgName: text('target_org_name'),

    // Change details
    changes: jsonb('changes'), // Before/after values
    metadata: jsonb('metadata'), // Additional context

    // Request context
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),

    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorIdIdx: index('idx_platform_audit_logs_actor_id').on(table.actorId),
    actionIdx: index('idx_platform_audit_logs_action').on(table.action),
    resourceTypeIdx: index('idx_platform_audit_logs_resource_type').on(table.resourceType),
    targetOrgIdIdx: index('idx_platform_audit_logs_target_org_id').on(table.targetOrgId),
    createdAtIdx: index('idx_platform_audit_logs_created_at').on(table.createdAt),
  })
);

/**
 * Platform audit log relations
 */
export const platformAuditLogsRelations = relations(platformAuditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [platformAuditLogs.actorId],
    references: [users.id],
  }),
  targetOrg: one(organizations, {
    fields: [platformAuditLogs.targetOrgId],
    references: [organizations.id],
  }),
}));

// Type exports
export type PlatformAuditLog = typeof platformAuditLogs.$inferSelect;
export type NewPlatformAuditLog = typeof platformAuditLogs.$inferInsert;

