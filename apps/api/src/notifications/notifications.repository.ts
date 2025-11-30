/**
 * Notifications Repository
 * Handles all database operations for notifications
 * Note: Notifications are USER-scoped, not org-scoped
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  eq,
  and,
  count,
  desc,
  isNull,
  withServiceContext,
  notifications,
  notificationPreferences,
  type Notification,
  type NotificationPreference,
  type NewNotification,
  type NewNotificationPreference,
} from '@forgestack/db';

export interface FindAllOptions {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

export interface PaginatedNotifications {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class NotificationsRepository {
  private readonly logger = new Logger(NotificationsRepository.name);

  /**
   * Create a new notification
   */
  async create(data: NewNotification): Promise<Notification> {
    this.logger.debug(`Creating notification for user ${data.userId}`);

    return withServiceContext('NotificationsRepository.create', async (tx) => {
      const [notification] = await tx
        .insert(notifications)
        .values(data)
        .returning();
      
      return notification;
    });
  }

  /**
   * Find notification by ID and user ID
   */
  async findById(userId: string, id: string): Promise<Notification | null> {
    this.logger.debug(`Finding notification ${id} for user ${userId}`);

    return withServiceContext('NotificationsRepository.findById', async (tx) => {
      const [notification] = await tx
        .select()
        .from(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
        .limit(1);

      return notification || null;
    });
  }

  /**
   * Find all notifications for a user with pagination
   */
  async findByUserId(
    userId: string,
    options: FindAllOptions = {}
  ): Promise<PaginatedNotifications> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    this.logger.debug(`Finding notifications for user ${userId}, page ${page}`);

    return withServiceContext('NotificationsRepository.findByUserId', async (tx) => {
      // Build where clause
      const whereConditions = [eq(notifications.userId, userId)];
      if (options.unreadOnly) {
        whereConditions.push(isNull(notifications.readAt));
      }

      // Get total count
      const [countResult] = await tx
        .select({ count: count() })
        .from(notifications)
        .where(and(...whereConditions));

      const total = countResult?.count || 0;

      // Get paginated notifications
      const items = await tx
        .select()
        .from(notifications)
        .where(and(...whereConditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit)
        .offset(offset);

      return {
        items,
        total,
        page,
        limit,
      };
    });
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    this.logger.debug(`Getting unread count for user ${userId}`);

    return withServiceContext('NotificationsRepository.getUnreadCount', async (tx) => {
      const [result] = await tx
        .select({ count: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

      return result?.count || 0;
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(userId: string, id: string): Promise<boolean> {
    this.logger.debug(`Marking notification ${id} as read for user ${userId}`);

    return withServiceContext('NotificationsRepository.markAsRead', async (tx) => {
      const result = await tx
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

      return result.rowCount ? result.rowCount > 0 : false;
    });
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<number> {
    this.logger.debug(`Marking all notifications as read for user ${userId}`);

    return withServiceContext('NotificationsRepository.markAllAsRead', async (tx) => {
      const result = await tx
        .update(notifications)
        .set({ readAt: new Date() })
        .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

      return result.rowCount || 0;
    });
  }

  /**
   * Delete a notification
   */
  async delete(userId: string, id: string): Promise<boolean> {
    this.logger.debug(`Deleting notification ${id} for user ${userId}`);

    return withServiceContext('NotificationsRepository.delete', async (tx) => {
      const result = await tx
        .delete(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));

      return result.rowCount ? result.rowCount > 0 : false;
    });
  }

  /**
   * Get user preferences for a specific org (or global if orgId is null)
   */
  async getPreferences(userId: string, orgId?: string): Promise<NotificationPreference[]> {
    this.logger.debug(`Getting preferences for user ${userId}, org ${orgId || 'global'}`);

    return withServiceContext('NotificationsRepository.getPreferences', async (tx) => {
      const prefs = await tx
        .select()
        .from(notificationPreferences)
        .where(
          orgId
            ? and(eq(notificationPreferences.userId, userId), eq(notificationPreferences.orgId, orgId))
            : and(eq(notificationPreferences.userId, userId), isNull(notificationPreferences.orgId))
        );

      return prefs;
    });
  }

  /**
   * Get preference for a specific notification type
   */
  async getPreference(
    userId: string,
    type: string,
    orgId?: string
  ): Promise<NotificationPreference | null> {
    this.logger.debug(`Getting preference for user ${userId}, type ${type}`);

    return withServiceContext('NotificationsRepository.getPreference', async (tx) => {
      const [pref] = await tx
        .select()
        .from(notificationPreferences)
        .where(
          orgId
            ? and(
                eq(notificationPreferences.userId, userId),
                eq(notificationPreferences.type, type),
                eq(notificationPreferences.orgId, orgId)
              )
            : and(
                eq(notificationPreferences.userId, userId),
                eq(notificationPreferences.type, type),
                isNull(notificationPreferences.orgId)
              )
        )
        .limit(1);

      return pref || null;
    });
  }

  /**
   * Upsert a notification preference
   */
  async upsertPreference(data: NewNotificationPreference): Promise<NotificationPreference> {
    this.logger.debug(`Upserting preference for user ${data.userId}, type ${data.type}`);

    return withServiceContext('NotificationsRepository.upsertPreference', async (tx) => {
      // Try to find existing preference
      const existing = await this.getPreference(data.userId, data.type, data.orgId || undefined);

      if (existing) {
        // Update existing
        const [updated] = await tx
          .update(notificationPreferences)
          .set({
            inAppEnabled: data.inAppEnabled ?? existing.inAppEnabled,
            emailEnabled: data.emailEnabled ?? existing.emailEnabled,
            updatedAt: new Date(),
          })
          .where(eq(notificationPreferences.id, existing.id))
          .returning();

        return updated;
      } else {
        // Insert new
        const [created] = await tx
          .insert(notificationPreferences)
          .values(data)
          .returning();

        return created;
      }
    });
  }
}

