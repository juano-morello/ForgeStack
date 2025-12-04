/**
 * DTOs for file responses
 */

import { ApiProperty } from '@nestjs/swagger';

export class FileDto {
  @ApiProperty({ description: 'File ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;

  @ApiProperty({ description: 'File name', example: 'avatar.png' })
  filename!: string;

  @ApiProperty({ description: 'MIME type', example: 'image/png' })
  contentType!: string;

  @ApiProperty({ description: 'File size in bytes', example: 1024000 })
  size!: number;

  @ApiProperty({ description: 'File purpose', enum: ['avatar', 'logo', 'attachment'], example: 'avatar' })
  purpose!: string;

  @ApiProperty({ description: 'Associated entity type', example: 'project', required: false })
  entityType?: string;

  @ApiProperty({ description: 'Associated entity ID', example: '123e4567-e89b-12d3-a456-426614174000', required: false })
  entityId?: string;

  @ApiProperty({ description: 'Presigned download URL', example: 'https://s3.amazonaws.com/bucket/file?signature=...' })
  url!: string;

  @ApiProperty({ description: 'Creation timestamp', example: '2024-12-04T12:00:00Z' })
  createdAt!: string;
}

class PaginationDto {
  @ApiProperty({ description: 'Current page number', example: 1 })
  page!: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit!: number;

  @ApiProperty({ description: 'Total number of items', example: 100 })
  total!: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages!: number;
}

export class PaginatedFilesDto {
  @ApiProperty({ description: 'Array of files', type: [FileDto] })
  data!: FileDto[];

  @ApiProperty({ description: 'Pagination metadata', type: PaginationDto })
  pagination!: PaginationDto;
}

