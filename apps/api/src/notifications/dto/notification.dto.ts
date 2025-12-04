/**
 * Notification DTOs
 * Response formats for notification data
 */

import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {
  @ApiProperty({ description: 'Notification ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'User ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  userId!: string;

  @ApiProperty({ description: 'Organization ID', required: false, example: '123e4567-e89b-12d3-a456-426614174000' })
  orgId?: string;

  @ApiProperty({ description: 'Notification type', example: 'project.created' })
  type!: string;

  @ApiProperty({ description: 'Notification title', example: 'New project created' })
  title!: string;

  @ApiProperty({ description: 'Notification body', required: false, example: 'John Doe created a new project' })
  body?: string;

  @ApiProperty({ description: 'Link to related resource', required: false, example: '/projects/123' })
  link?: string;

  @ApiProperty({ description: 'Additional metadata', required: false, example: { projectId: '123' } })
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Timestamp when notification was read', required: false, example: '2024-12-04T12:00:00Z' })
  readAt?: string;

  @ApiProperty({ description: 'Whether email was sent', example: false })
  emailSent!: boolean;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-12-04T12:00:00Z' })
  createdAt!: string;
}

class NotificationPaginationDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages!: number;
}

export class PaginatedNotificationsDto {
  @ApiProperty({ description: 'Array of notifications', type: [NotificationDto] })
  data!: NotificationDto[];

  @ApiProperty({ description: 'Pagination metadata', type: NotificationPaginationDto })
  pagination!: NotificationPaginationDto;
}

export class UnreadCountDto {
  @ApiProperty({ description: 'Number of unread notifications', example: 5 })
  count!: number;
}

