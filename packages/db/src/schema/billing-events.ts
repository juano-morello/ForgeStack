import { pgTable, uuid, text, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

/**
 * Billing Events table - Audit log for Stripe webhook events
 * Tracks all billing-related events for debugging and compliance
 */
export const billingEvents = pgTable('billing_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'set null' }),
  stripeEventId: text('stripe_event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdIdx: index('idx_billing_events_org_id').on(table.orgId),
  stripeEventIdIdx: index('idx_billing_events_stripe_event_id').on(table.stripeEventId),
  eventTypeIdx: index('idx_billing_events_event_type').on(table.eventType),
}));

/**
 * Billing event relations
 */
export const billingEventsRelations = relations(billingEvents, ({ one }) => ({
  organization: one(organizations, {
    fields: [billingEvents.orgId],
    references: [organizations.id],
  }),
}));

// Type exports
export type BillingEvent = typeof billingEvents.$inferSelect;
export type NewBillingEvent = typeof billingEvents.$inferInsert;

