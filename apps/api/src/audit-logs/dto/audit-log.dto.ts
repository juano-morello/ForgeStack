/**
 * Audit log response DTO
 */
import { ApiProperty } from '@nestjs/swagger';

class AuditLogActorDto {
  @ApiProperty({ description: 'Actor user ID', nullable: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string | null;

  @ApiProperty({ description: 'Actor type', example: 'user' })
  type!: string;

  @ApiProperty({ description: 'Actor name', nullable: true, example: 'John Doe' })
  name!: string | null;

  @ApiProperty({ description: 'Actor email', nullable: true, example: 'user@example.com' })
  email!: string | null;
}

class AuditLogResourceDto {
  @ApiProperty({ description: 'Resource type', example: 'project' })
  type!: string;

  @ApiProperty({ description: 'Resource ID', nullable: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string | null;

  @ApiProperty({ description: 'Resource name', nullable: true, example: 'My Project' })
  name!: string | null;
}

export class AuditLogDto {
  @ApiProperty({ description: 'Audit log ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'Actor who performed the action', type: AuditLogActorDto })
  actor!: AuditLogActorDto;

  @ApiProperty({ description: 'Action performed', example: 'project.created' })
  action!: string;

  @ApiProperty({ description: 'Resource affected', type: AuditLogResourceDto })
  resource!: AuditLogResourceDto;

  @ApiProperty({ description: 'Changes made', nullable: true, example: { name: { old: 'Old Name', new: 'New Name' } } })
  changes!: Record<string, unknown> | null;

  @ApiProperty({ description: 'Additional metadata', nullable: true, example: { source: 'web' } })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ description: 'IP address of the actor', nullable: true, example: '192.168.1.1' })
  ipAddress!: string | null;

  @ApiProperty({ description: 'User agent of the actor', nullable: true, example: 'Mozilla/5.0...' })
  userAgent!: string | null;

  @ApiProperty({ description: 'Timestamp when the action occurred', example: '2024-12-04T12:00:00Z' })
  createdAt!: Date;
}

class AuditLogPaginationDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 50 })
  limit!: number;

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 2 })
  totalPages!: number;
}

/**
 * Paginated audit logs response
 */
export class PaginatedAuditLogsDto {
  @ApiProperty({ description: 'Array of audit logs', type: [AuditLogDto] })
  data!: AuditLogDto[];

  @ApiProperty({ description: 'Pagination metadata', type: AuditLogPaginationDto })
  pagination!: AuditLogPaginationDto;
}

class AuditLogActorStatsDto {
  @ApiProperty({ description: 'Actor user ID', nullable: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  actorId!: string | null;

  @ApiProperty({ description: 'Actor name', nullable: true, example: 'John Doe' })
  actorName!: string | null;

  @ApiProperty({ description: 'Number of actions', example: 10 })
  count!: number;
}

class AuditLogPeriodDto {
  @ApiProperty({ description: 'Period start date', nullable: true, example: '2024-12-01T00:00:00Z' })
  start!: string | null;

  @ApiProperty({ description: 'Period end date', nullable: true, example: '2024-12-31T23:59:59Z' })
  end!: string | null;
}

/**
 * Audit log statistics response
 */
export class AuditLogStatsDto {
  @ApiProperty({ description: 'Total number of audit logs', example: 100 })
  totalLogs!: number;

  @ApiProperty({ description: 'Count by action type', example: { 'project.created': 10, 'project.updated': 20 } })
  byAction!: Record<string, number>;

  @ApiProperty({ description: 'Count by resource type', example: { 'project': 30, 'member': 15 } })
  byResourceType!: Record<string, number>;

  @ApiProperty({ description: 'Count by actor', type: [AuditLogActorStatsDto] })
  byActor!: AuditLogActorStatsDto[];

  @ApiProperty({ description: 'Time period for statistics', type: AuditLogPeriodDto })
  period!: AuditLogPeriodDto;
}

/**
 * Export options DTO
 */
export class AuditLogExportDto {
  @ApiProperty({ description: 'Export format', enum: ['csv', 'json'], example: 'csv' })
  format!: 'csv' | 'json';
}

