import { pgTable, uuid, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

/**
 * Webhook endpoints table - stores webhook endpoint configurations
 * All endpoints are scoped to an organization for RLS enforcement
 */
export const webhookEndpoints = pgTable(
  'webhook_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    description: text('description'),
    secret: text('secret').notNull(), // Webhook signing secret
    events: text('events').array().notNull().default(sql`ARRAY[]::text[]`),
    enabled: boolean('enabled').notNull().default(true),
    // Note: users.id is text type (better-auth), not uuid
    createdBy: text('created_by')
      .notNull()
      .references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    orgIdIdx: index('idx_webhook_endpoints_org_id').on(table.orgId),
    enabledIdx: index('idx_webhook_endpoints_enabled').on(table.orgId, table.enabled),
  })
);

/**
 * Webhook endpoint relations
 */
export const webhookEndpointsRelations = relations(webhookEndpoints, ({ one }) => ({
  organization: one(organizations, {
    fields: [webhookEndpoints.orgId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [webhookEndpoints.createdBy],
    references: [users.id],
  }),
}));

// Type exports
export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;

