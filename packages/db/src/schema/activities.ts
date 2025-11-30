import { pgTable, uuid, text, timestamp, jsonb, index, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

/**
 * Activities table - user-friendly timeline of organization activities
 * Unlike audit_logs, activities can be aggregated and cleaned up
 */
export const activities = pgTable(
  'activities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    
    // Actor information (denormalized for display)
    // Note: users.id is text type (better-auth), not uuid
    actorId: text('actor_id').references(() => users.id, { onDelete: 'set null' }),
    actorName: text('actor_name'),
    actorAvatar: text('actor_avatar'),
    
    // Activity type and display
    type: text('type').notNull(), // 'project.created', 'file.uploaded', etc.
    title: text('title').notNull(), // "created a new project"
    description: text('description'), // Optional additional context
    
    // Resource information
    resourceType: text('resource_type'), // 'project', 'file', etc.
    resourceId: text('resource_id'),
    resourceName: text('resource_name'),
    
    // Additional data
    metadata: jsonb('metadata'), // Extra rendering data
    
    // Aggregation support
    aggregationKey: text('aggregation_key'), // For grouping related activities
    aggregationCount: integer('aggregation_count').default(1), // Count of aggregated items
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('idx_activities_org_id').on(table.orgId),
    actorIdIdx: index('idx_activities_actor_id').on(table.actorId),
    typeIdx: index('idx_activities_type').on(table.type),
    createdAtIdx: index('idx_activities_created_at').on(table.createdAt),
    aggregationKeyIdx: index('idx_activities_aggregation_key').on(table.aggregationKey),
    // Composite for efficient org timeline queries
    orgCreatedIdx: index('idx_activities_org_created').on(table.orgId, table.createdAt),
  })
);

export const activitiesRelations = relations(activities, ({ one }) => ({
  organization: one(organizations, {
    fields: [activities.orgId],
    references: [organizations.id],
  }),
  actor: one(users, {
    fields: [activities.actorId],
    references: [users.id],
  }),
}));

export type Activity = typeof activities.$inferSelect;
export type NewActivity = typeof activities.$inferInsert;

