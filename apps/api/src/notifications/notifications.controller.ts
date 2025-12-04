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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { NoOrgRequired } from '../core/decorators/no-org-required.decorator';
import { NotificationQueryDto, UpdatePreferencesDto } from './dto';
import type { RequestWithUser } from '../core/types';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@NoOrgRequired()
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications - List user's notifications
   */
  @Get()
  @ApiOperation({
    summary: 'List notifications',
    description: 'Get a paginated list of notifications for the current user'
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (1-100)', example: 20 })
  @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Filter to unread notifications only', example: false })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get unread count',
    description: 'Get the count of unread notifications for the current user'
  })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnreadCount(@Req() request: RequestWithUser) {
    const userId = request.user.id;
    this.logger.debug(`GET /notifications/unread-count - User: ${userId}`);
    return this.notificationsService.getUnreadCount(userId);
  }

  /**
   * PATCH /notifications/:id/read - Mark as read
   */
  @Patch(':id/read')
  @ApiOperation({
    summary: 'Mark notification as read',
    description: 'Mark a specific notification as read'
  })
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all notifications for the current user as read'
  })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a specific notification'
  })
  @ApiParam({ name: 'id', description: 'Notification ID', type: String })
  @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Get notification preferences',
    description: 'Get notification preferences for the current user'
  })
  @ApiResponse({ status: 200, description: 'Preferences retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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
  @ApiOperation({
    summary: 'Update notification preferences',
    description: 'Update notification preferences for a specific notification type'
  })
  @ApiResponse({ status: 200, description: 'Preferences updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
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

