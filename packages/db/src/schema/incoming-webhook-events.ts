import { pgTable, uuid, text, timestamp, integer, jsonb, boolean, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

/**
 * Incoming webhook events table - stores events received from external providers
 * org_id is nullable for system-level webhooks (e.g., Stripe events before org association)
 */
export const incomingWebhookEvents = pgTable(
  'incoming_webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'set null' }),
    provider: text('provider').notNull(), // stripe, github, etc.
    eventType: text('event_type').notNull(),
    eventId: text('event_id').notNull(), // Provider's event ID for idempotency
    payload: jsonb('payload').notNull(),
    signature: text('signature'), // Raw signature header
    verified: boolean('verified').notNull().default(false),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    error: text('error'),
    retryCount: integer('retry_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    // Idempotency constraint
    providerEventIdUnique: unique('uq_incoming_webhook_provider_event').on(table.provider, table.eventId),
    providerIdx: index('idx_incoming_webhook_provider').on(table.provider),
    eventTypeIdx: index('idx_incoming_webhook_event_type').on(table.eventType),
    processedIdx: index('idx_incoming_webhook_processed').on(table.processedAt),
    orgIdIdx: index('idx_incoming_webhook_org_id').on(table.orgId),
  })
);

/**
 * Incoming webhook event relations
 */
export const incomingWebhookEventsRelations = relations(incomingWebhookEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [incomingWebhookEvents.orgId],
    references: [organizations.id],
  }),
}));

// Type exports
export type IncomingWebhookEvent = typeof incomingWebhookEvents.$inferSelect;
export type NewIncomingWebhookEvent = typeof incomingWebhookEvents.$inferInsert;

