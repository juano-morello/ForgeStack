/**
 * DTOs for listing files
 */

import { IsOptional, IsString, IsIn, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListFilesQueryDto {
  @ApiProperty({
    description: 'Filter by file purpose',
    enum: ['avatar', 'logo', 'attachment'],
    required: false,
    example: 'avatar'
  })
  @IsOptional()
  @IsString()
  @IsIn(['avatar', 'logo', 'attachment'])
  purpose?: string;

  @ApiProperty({
    description: 'Filter by entity type',
    required: false,
    example: 'project'
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({
    description: 'Filter by entity ID',
    required: false,
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;

  @ApiProperty({
    description: 'Page number',
    required: false,
    minimum: 1,
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({
    description: 'Items per page',
    required: false,
    minimum: 1,
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

