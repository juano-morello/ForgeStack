/**
 * Activity Query DTOs
 * Query parameters for filtering and pagination
 */

import { IsOptional, IsString, IsInt, Min, Max, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ActivityQueryDto {
  @ApiProperty({
    description: 'Number of items to return',
    required: false,
    minimum: 1,
    maximum: 50,
    default: 20,
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiProperty({
    description: 'Pagination cursor for next page',
    required: false,
    example: 'eyJpZCI6IjEyMyJ9'
  })
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiProperty({
    description: 'Filter by activity type',
    required: false,
    example: 'project.created'
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Filter by actor user ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  actorId?: string;

  @ApiProperty({
    description: 'Filter by resource type',
    required: false,
    example: 'project'
  })
  @IsOptional()
  @IsString()
  resourceType?: string;

  @ApiProperty({
    description: 'Filter activities since this ISO 8601 timestamp',
    required: false,
    example: '2024-12-01T00:00:00Z'
  })
  @IsOptional()
  @IsString()
  since?: string;
}

export class RecentActivitiesQueryDto {
  @ApiProperty({
    description: 'Number of recent activities to return',
    required: false,
    minimum: 1,
    maximum: 20,
    default: 10,
    example: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 10;
}

