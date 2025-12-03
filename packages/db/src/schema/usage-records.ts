import { pgTable, uuid, text, bigint, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

/**
 * Usage records - aggregated usage per org per time period
 * Tracks API calls, storage, and seats for billing purposes
 */
export const usageRecords = pgTable('usage_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  // Time period (hourly buckets)
  periodStart: timestamp('period_start', { withTimezone: true }).notNull(),
  periodEnd: timestamp('period_end', { withTimezone: true }).notNull(),

  // Usage metrics
  metricType: text('metric_type').notNull(), // 'api_calls', 'storage_bytes', 'active_seats'
  quantity: bigint('quantity', { mode: 'number' }).notNull().default(0),

  // Stripe reporting
  reportedToStripe: boolean('reported_to_stripe').default(false),
  stripeUsageRecordId: text('stripe_usage_record_id'),
  reportedAt: timestamp('reported_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdIdx: index('idx_usage_records_org_id').on(table.orgId),
  periodIdx: index('idx_usage_records_period').on(table.periodStart, table.periodEnd),
  metricTypeIdx: index('idx_usage_records_metric_type').on(table.metricType),
  orgPeriodMetricUnique: unique('uq_usage_records_org_period_metric').on(
    table.orgId, table.periodStart, table.metricType
  ),
}));

/**
 * Usage record relations
 */
export const usageRecordsRelations = relations(usageRecords, ({ one }) => ({
  organization: one(organizations, {
    fields: [usageRecords.orgId],
    references: [organizations.id],
  }),
}));

// Type exports
export type UsageRecord = typeof usageRecords.$inferSelect;
export type NewUsageRecord = typeof usageRecords.$inferInsert;

