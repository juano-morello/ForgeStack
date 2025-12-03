import { pgTable, uuid, text, bigint, boolean, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

/**
 * Plan definitions with default limits and pricing
 * Defines available subscription plans and their features
 */
export const plans = pgTable('plans', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: text('name').notNull().unique(), // 'free', 'pro', 'enterprise'
  displayName: text('display_name').notNull(),
  description: text('description'),

  // Stripe price IDs
  stripePriceIdMonthly: text('stripe_price_id_monthly'),
  stripePriceIdYearly: text('stripe_price_id_yearly'),
  stripeMeteredPriceId: text('stripe_metered_price_id'), // For usage-based component

  // Default limits
  limits: jsonb('limits').notNull().default('{}'),
  // Example: { "api_calls_monthly": 10000, "storage_bytes": 1073741824, "seats": 5 }

  // Pricing display
  priceMonthly: bigint('price_monthly', { mode: 'number' }), // In cents
  priceYearly: bigint('price_yearly', { mode: 'number' }),

  // Feature access
  features: jsonb('features').notNull().default('[]'),
  // Example: ["api-access", "advanced-analytics", "audit-logs"]

  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0),

  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// Type exports
export type Plan = typeof plans.$inferSelect;
export type NewPlan = typeof plans.$inferInsert;

