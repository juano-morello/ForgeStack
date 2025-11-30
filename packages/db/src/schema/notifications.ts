import { pgTable, uuid, text, timestamp, jsonb, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { organizations } from './organizations';

/**
 * Notifications table - user-scoped notifications
 * Unlike org-scoped tables, notifications belong to individual users
 */
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' }),
    
    type: text('type').notNull(), // 'member.invited', 'project.shared', etc.
    title: text('title').notNull(),
    body: text('body'),
    link: text('link'), // Optional navigation URL
    
    metadata: jsonb('metadata'), // Additional data
    
    readAt: timestamp('read_at', { withTimezone: true }),
    emailSent: boolean('email_sent').default(false),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_notifications_user_id').on(table.userId),
    orgIdIdx: index('idx_notifications_org_id').on(table.orgId),
    typeIdx: index('idx_notifications_type').on(table.type),
    readAtIdx: index('idx_notifications_read_at').on(table.readAt),
    createdAtIdx: index('idx_notifications_created_at').on(table.createdAt),
    // Composite for efficient user timeline queries
    userCreatedIdx: index('idx_notifications_user_created').on(table.userId, table.createdAt),
  })
);

/**
 * Notification preferences - user settings per notification type
 */
export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    orgId: uuid('org_id')
      .references(() => organizations.id, { onDelete: 'cascade' }),
    
    type: text('type').notNull(), // Notification type
    inAppEnabled: boolean('in_app_enabled').notNull().default(true),
    emailEnabled: boolean('email_enabled').notNull().default(true),
    
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_notification_prefs_user_id').on(table.userId),
    userTypeIdx: index('idx_notification_prefs_user_type').on(table.userId, table.type),
  })
);

// Relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  organization: one(organizations, { fields: [notifications.orgId], references: [organizations.id] }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, { fields: [notificationPreferences.userId], references: [users.id] }),
  organization: one(organizations, { fields: [notificationPreferences.orgId], references: [organizations.id] }),
}));

// Type exports
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference = typeof notificationPreferences.$inferInsert;

