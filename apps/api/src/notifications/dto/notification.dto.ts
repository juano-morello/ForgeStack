/**
 * Notification DTOs
 * Response formats for notification data
 */

export class NotificationDto {
  id!: string;
  userId!: string;
  orgId?: string;
  type!: string;
  title!: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  readAt?: string;
  emailSent!: boolean;
  createdAt!: string;
}

export class PaginatedNotificationsDto {
  data!: NotificationDto[];
  pagination!: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class UnreadCountDto {
  count!: number;
}

