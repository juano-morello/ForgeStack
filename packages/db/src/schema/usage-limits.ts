import { pgTable, uuid, text, bigint, boolean, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

/**
 * Usage limits per organization (overrides plan defaults)
 * Allows custom limits to be set for specific organizations
 */
export const usageLimits = pgTable('usage_limits', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),

  metricType: text('metric_type').notNull(), // 'api_calls_monthly', 'storage_bytes', 'seats'
  limitValue: bigint('limit_value', { mode: 'number' }).notNull(),

  // Optional: soft vs hard limit
  isHardLimit: boolean('is_hard_limit').default(true).notNull(),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdIdx: index('idx_usage_limits_org_id').on(table.orgId),
  orgMetricUnique: unique('uq_usage_limits_org_metric').on(table.orgId, table.metricType),
}));

/**
 * Usage limit relations
 */
export const usageLimitsRelations = relations(usageLimits, ({ one }) => ({
  organization: one(organizations, {
    fields: [usageLimits.orgId],
    references: [organizations.id],
  }),
}));

// Type exports
export type UsageLimit = typeof usageLimits.$inferSelect;
export type NewUsageLimit = typeof usageLimits.$inferInsert;

