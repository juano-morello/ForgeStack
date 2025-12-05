/**
 * Notifications Service
 * Handles business logic for notification operations
 * IMPORTANT: send() method never throws - notifications should not break operations
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './notifications.repository';
import { QueueService } from '../queue/queue.service';
import { NOTIFICATION_TYPES, NOTIFICATION_DEFAULTS } from './notification-types';
import { NotificationDto, PaginatedNotificationsDto, NotificationQueryDto, UnreadCountDto } from './dto';
import type { Notification } from '@forgestack/db';

/**
 * Event data for sending a notification
 */
export interface SendNotificationEvent {
  userId: string;
  orgId?: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Send a notification to a user.
   * IMPORTANT: This method never throws - notification sending
   * should not affect main operations.
   */
  async send(event: SendNotificationEvent): Promise<void> {
    try {
      // Check if notification type exists
      const typeConfig = NOTIFICATION_TYPES[event.type as keyof typeof NOTIFICATION_TYPES];
      if (!typeConfig) {
        this.logger.warn(`Unknown notification type: ${event.type}`);
        return;
      }

      // Get user preferences for this notification type
      const preference = await this.notificationsRepository.getPreference(
        event.userId,
        event.type,
        event.orgId
      );

      // Get defaults for this notification type
      const defaults = NOTIFICATION_DEFAULTS[event.type] || { defaultInApp: true, defaultEmail: false };

      // Determine if we should send in-app and/or email
      const inAppEnabled = preference?.inAppEnabled ?? defaults.defaultInApp;
      const emailEnabled = preference?.emailEnabled ?? defaults.defaultEmail;

      // Create in-app notification if enabled
      if (inAppEnabled) {
        await this.notificationsRepository.create({
          userId: event.userId,
          orgId: event.orgId || null,
          type: event.type,
          title: event.title,
          body: event.body || null,
          link: event.link || null,
          metadata: event.metadata || null,
          emailSent: false,
        });
        this.logger.debug(`Created in-app notification for user ${event.userId}`);
      }

      // Queue email if enabled
      if (emailEnabled) {
        await this.queueService.addJob('notification-email', {
          userId: event.userId,
          orgId: event.orgId,
          type: event.type,
          title: event.title,
          body: event.body,
          link: event.link,
        });
        this.logger.debug(`Queued email notification for user ${event.userId}`);
      }
    } catch (error) {
      // Log error but don't throw - notification sending should never break operations
      this.logger.error('Failed to send notification', {
        error: error instanceof Error ? error.message : 'Unknown error',
        event,
      });
    }
  }

  /**
   * Find all notifications for a user with filters and pagination
   */
  async findAll(userId: string, query: NotificationQueryDto): Promise<PaginatedNotificationsDto> {
    this.logger.debug(`Finding notifications for user ${userId}`);

    const result = await this.notificationsRepository.findByUserId(userId, {
      page: query.page,
      limit: query.limit,
      unreadOnly: query.unreadOnly,
    });

    return {
      data: result.items.map((notification) => this.mapToDto(notification)),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    this.logger.debug(`Getting unread count for user ${userId}`);

    const count = await this.notificationsRepository.getUnreadCount(userId);
    return { count };
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(userId: string, id: string): Promise<void> {
    this.logger.debug(`Marking notification ${id} as read for user ${userId}`);

    const success = await this.notificationsRepository.markAsRead(userId, id);
    if (!success) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    this.logger.debug(`Marking all notifications as read for user ${userId}`);

    const count = await this.notificationsRepository.markAllAsRead(userId);
    return { count };
  }

  /**
   * Delete a notification
   */
  async delete(userId: string, id: string): Promise<void> {
    this.logger.debug(`Deleting notification ${id} for user ${userId}`);

    const success = await this.notificationsRepository.delete(userId, id);
    if (!success) {
      throw new NotFoundException('Notification not found');
    }
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string, orgId?: string) {
    this.logger.debug(`Getting preferences for user ${userId}`);

    const preferences = await this.notificationsRepository.getPreferences(userId, orgId);

    // Return all notification types with their preferences (or defaults)
    const allTypes = Object.keys(NOTIFICATION_TYPES);
    return allTypes.map((type) => {
      const pref = preferences.find((p) => p.type === type);
      const defaults = NOTIFICATION_DEFAULTS[type] || { defaultInApp: true, defaultEmail: false };

      return {
        type,
        inAppEnabled: pref?.inAppEnabled ?? defaults.defaultInApp,
        emailEnabled: pref?.emailEnabled ?? defaults.defaultEmail,
      };
    });
  }

  /**
   * Update user preferences for a notification type
   */
  async updatePreferences(
    userId: string,
    type: string,
    inAppEnabled?: boolean,
    emailEnabled?: boolean,
    orgId?: string
  ) {
    this.logger.debug(`Updating preferences for user ${userId}, type ${type}`);

    // Validate notification type
    if (!NOTIFICATION_TYPES[type as keyof typeof NOTIFICATION_TYPES]) {
      throw new NotFoundException(`Unknown notification type: ${type}`);
    }

    const preference = await this.notificationsRepository.upsertPreference({
      userId,
      orgId: orgId || null,
      type,
      inAppEnabled: inAppEnabled ?? true,
      emailEnabled: emailEnabled ?? true,
    });

    return {
      id: preference.id,
      userId: preference.userId,
      orgId: preference.orgId || undefined,
      type: preference.type,
      inAppEnabled: preference.inAppEnabled,
      emailEnabled: preference.emailEnabled,
      createdAt: preference.createdAt.toISOString(),
      updatedAt: preference.updatedAt.toISOString(),
    };
  }

  /**
   * Map database notification to DTO
   */
  private mapToDto(notification: Notification): NotificationDto {
    return {
      id: notification.id,
      userId: notification.userId,
      orgId: notification.orgId || undefined,
      type: notification.type,
      title: notification.title,
      body: notification.body || undefined,
      link: notification.link || undefined,
      metadata: notification.metadata ? (notification.metadata as Record<string, unknown>) : undefined,
      readAt: notification.readAt?.toISOString(),
      emailSent: notification.emailSent || false,
      createdAt: notification.createdAt.toISOString(),
    };
  }
}

