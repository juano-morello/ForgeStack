import { pgTable, uuid, text, timestamp, integer, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { webhookEndpoints } from './webhook-endpoints';

/**
 * Webhook deliveries table - stores webhook delivery attempts and responses
 * All deliveries are scoped to an organization for RLS enforcement
 */
export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    endpointId: uuid('endpoint_id')
      .notNull()
      .references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    eventId: text('event_id').notNull(),
    payload: jsonb('payload').notNull(),
    requestHeaders: jsonb('request_headers'),
    responseStatus: integer('response_status'),
    responseBody: text('response_body'),
    responseHeaders: jsonb('response_headers'),
    attemptNumber: integer('attempt_number').notNull().default(1),
    nextRetryAt: timestamp('next_retry_at', { withTimezone: true }),
    deliveredAt: timestamp('delivered_at', { withTimezone: true }),
    failedAt: timestamp('failed_at', { withTimezone: true }),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgIdIdx: index('idx_webhook_deliveries_org_id').on(table.orgId),
    endpointIdIdx: index('idx_webhook_deliveries_endpoint_id').on(table.endpointId),
    eventTypeIdx: index('idx_webhook_deliveries_event_type').on(table.eventType),
    statusIdx: index('idx_webhook_deliveries_status').on(table.deliveredAt, table.failedAt),
    createdAtIdx: index('idx_webhook_deliveries_created_at').on(table.orgId, table.createdAt),
    pendingRetryIdx: index('idx_webhook_deliveries_pending_retry').on(table.nextRetryAt),
  })
);

/**
 * Webhook delivery relations
 */
export const webhookDeliveriesRelations = relations(webhookDeliveries, ({ one }) => ({
  organization: one(organizations, {
    fields: [webhookDeliveries.orgId],
    references: [organizations.id],
  }),
  endpoint: one(webhookEndpoints, {
    fields: [webhookDeliveries.endpointId],
    references: [webhookEndpoints.id],
  }),
}));

// Type exports
export type WebhookDelivery = typeof webhookDeliveries.$inferSelect;
export type NewWebhookDelivery = typeof webhookDeliveries.$inferInsert;

