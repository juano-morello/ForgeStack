import { pgTable, uuid, text, timestamp, boolean, integer, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { organizations } from './organizations';

/**
 * Feature flags table - global flag definitions
 */
export const featureFlags = pgTable(
  'feature_flags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull().unique(), // e.g., 'advanced-analytics'
    name: text('name').notNull(), // Display name
    description: text('description'),
    type: text('type').notNull().default('boolean'), // 'boolean', 'plan', 'percentage'
    defaultValue: boolean('default_value').notNull().default(false),
    plans: text('plans').array(), // ['pro', 'enterprise']
    percentage: integer('percentage').default(0), // 0-100 for percentage rollouts
    enabled: boolean('enabled').notNull().default(true), // Master switch
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    keyIdx: index('idx_feature_flags_key').on(table.key),
    enabledIdx: index('idx_feature_flags_enabled').on(table.enabled),
  })
);

/**
 * Organization feature overrides - per-org flag overrides
 */
export const organizationFeatureOverrides = pgTable(
  'organization_feature_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orgId: uuid('org_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    flagId: uuid('flag_id')
      .notNull()
      .references(() => featureFlags.id, { onDelete: 'cascade' }),
    enabled: boolean('enabled').notNull(),
    reason: text('reason'), // Why this override exists
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orgFlagUnique: unique('uq_org_feature_override').on(table.orgId, table.flagId),
    orgIdIdx: index('idx_feature_overrides_org_id').on(table.orgId),
    flagIdIdx: index('idx_feature_overrides_flag_id').on(table.flagId),
  })
);

// Relations
export const featureFlagsRelations = relations(featureFlags, ({ many }) => ({
  overrides: many(organizationFeatureOverrides),
}));

export const organizationFeatureOverridesRelations = relations(organizationFeatureOverrides, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationFeatureOverrides.orgId],
    references: [organizations.id],
  }),
  flag: one(featureFlags, {
    fields: [organizationFeatureOverrides.flagId],
    references: [featureFlags.id],
  }),
}));

export type FeatureFlag = typeof featureFlags.$inferSelect;
export type NewFeatureFlag = typeof featureFlags.$inferInsert;
export type OrganizationFeatureOverride = typeof organizationFeatureOverrides.$inferSelect;
export type NewOrganizationFeatureOverride = typeof organizationFeatureOverrides.$inferInsert;

