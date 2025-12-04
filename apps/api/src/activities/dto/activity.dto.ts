/**
 * Activity DTOs
 * Response formats for activity data
 */

import { ApiProperty } from '@nestjs/swagger';

export class ActivityActorDto {
  @ApiProperty({ description: 'Actor user ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'Actor name', example: 'John Doe' })
  name!: string;

  @ApiProperty({ description: 'Actor avatar URL', required: false, example: 'https://example.com/avatar.png' })
  avatar?: string;
}

export class ActivityResourceDto {
  @ApiProperty({ description: 'Resource type', example: 'project' })
  type!: string;

  @ApiProperty({ description: 'Resource ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'Resource name', example: 'My Project' })
  name!: string;
}

export class ActivityDto {
  @ApiProperty({ description: 'Activity ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'Activity type', example: 'project.created' })
  type!: string;

  @ApiProperty({ description: 'Activity title', example: 'Project created' })
  title!: string;

  @ApiProperty({ description: 'Activity description', required: false, example: 'John Doe created a new project' })
  description?: string;

  @ApiProperty({ description: 'Actor who performed the activity', type: ActivityActorDto })
  actor!: ActivityActorDto;

  @ApiProperty({ description: 'Resource affected by the activity', type: ActivityResourceDto, required: false })
  resource?: ActivityResourceDto;

  @ApiProperty({ description: 'Number of aggregated similar activities', example: 1 })
  aggregationCount!: number;

  @ApiProperty({ description: 'Additional metadata', required: false, example: { key: 'value' } })
  metadata?: Record<string, unknown>;

  @ApiProperty({ description: 'Activity creation timestamp', example: '2024-12-04T12:00:00Z' })
  createdAt!: string;
}

class ActivityPaginationDto {
  @ApiProperty({ description: 'Cursor for next page', required: false, example: 'eyJpZCI6IjEyMyJ9' })
  cursor?: string;

  @ApiProperty({ description: 'Whether there are more items', example: true })
  hasMore!: boolean;
}

export class PaginatedActivitiesDto {
  @ApiProperty({ description: 'Array of activities', type: [ActivityDto] })
  data!: ActivityDto[];

  @ApiProperty({ description: 'Pagination metadata', type: ActivityPaginationDto })
  pagination!: ActivityPaginationDto;
}

