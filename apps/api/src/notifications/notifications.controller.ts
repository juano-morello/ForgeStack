/**
 * Notifications Controller
 * Handles HTTP requests for notification operations
 * Note: All endpoints use @NoOrgRequired since notifications are user-scoped
 */

import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  Logger,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NoOrgRequired } from '../core/decorators/no-org-required.decorator';
import { NotificationQueryDto, UpdatePreferencesDto } from './dto';
import type { RequestWithUser } from '../core/types';

@Controller('notifications')
@NoOrgRequired()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications - List user's notifications
   */
  @Get()
  async findAll(
    @Req() request: RequestWithUser,
    @Query() query: NotificationQueryDto,
  ) {
    const userId = request.user.id;
    this.logger.debug(`GET /notifications - User: ${userId}`);
    return this.notificationsService.findAll(userId, query);
  }

  /**
   * GET /notifications/unread-count - Get unread count
   */
  @Get('unread-count')
  async getUnreadCount(@Req() request: RequestWithUser) {
    const userId = request.user.id;
    this.logger.debug(`GET /notifications/unread-count - User: ${userId}`);
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * PATCH /notifications/:id/read - Mark as read
   */
  @Patch(':id/read')
  async markAsRead(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ) {
    const userId = request.user.id;
    this.logger.debug(`PATCH /notifications/${id}/read - User: ${userId}`);
    await this.notificationsService.markAsRead(userId, id);
    return { success: true };
  }

  /**
   * PATCH /notifications/read-all - Mark all as read
   */
  @Patch('read-all')
  async markAllAsRead(@Req() request: RequestWithUser) {
    const userId = request.user.id;
    this.logger.debug(`PATCH /notifications/read-all - User: ${userId}`);
    const result = await this.notificationsService.markAllAsRead(userId);
    return { success: true, count: result.count };
  }

  /**
   * DELETE /notifications/:id - Delete notification
   */
  @Delete(':id')
  async delete(
    @Req() request: RequestWithUser,
    @Param('id') id: string,
  ) {
    const userId = request.user.id;
    this.logger.debug(`DELETE /notifications/${id} - User: ${userId}`);
    await this.notificationsService.delete(userId, id);
    return { success: true };
  }

  /**
   * GET /notifications/preferences - Get preferences
   */
  @Get('preferences')
  async getPreferences(@Req() request: RequestWithUser) {
    const userId = request.user.id;
    this.logger.debug(`GET /notifications/preferences - User: ${userId}`);
    const preferences = await this.notificationsService.getPreferences(userId);
    return { preferences };
  }

  /**
   * PATCH /notifications/preferences - Update preferences
   */
  @Patch('preferences')
  async updatePreferences(
    @Req() request: RequestWithUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const userId = request.user.id;
    this.logger.debug(`PATCH /notifications/preferences - User: ${userId}, Type: ${dto.type}`);
    const preference = await this.notificationsService.updatePreferences(
      userId,
      dto.type,
      dto.inAppEnabled,
      dto.emailEnabled,
    );
    return { preference };
  }
}

