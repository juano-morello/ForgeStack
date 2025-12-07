import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';
import { users } from './users';

/**
 * AI Usage table - tracks AI token usage per organization
 * Used for billing, rate limiting, and analytics
 */
export const aiUsage = pgTable('ai_usage', {
  id: uuid('id').primaryKey().defaultRandom(),
  orgId: uuid('org_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .references(() => users.id, { onDelete: 'set null' }),
  
  provider: text('provider').notNull(), // 'openai', 'anthropic', 'google'
  model: text('model').notNull(), // 'gpt-4o', 'claude-3-5-sonnet-latest', etc.
  
  inputTokens: integer('input_tokens').notNull().default(0),
  outputTokens: integer('output_tokens').notNull().default(0),
  
  // Optional: estimated cost in cents
  estimatedCost: integer('estimated_cost'), // In cents
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  orgIdIdx: index('idx_ai_usage_org_id').on(table.orgId),
  createdAtIdx: index('idx_ai_usage_created_at').on(table.createdAt),
  orgDateIdx: index('idx_ai_usage_org_date').on(table.orgId, table.createdAt),
}));

/**
 * AI Usage relations
 */
export const aiUsageRelations = relations(aiUsage, ({ one }) => ({
  organization: one(organizations, {
    fields: [aiUsage.orgId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [aiUsage.userId],
    references: [users.id],
  }),
}));

// Type exports
export type AiUsage = typeof aiUsage.$inferSelect;
export type NewAiUsage = typeof aiUsage.$inferInsert;

