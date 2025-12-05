/**
 * DTOs for presigned URL generation
 */

import { IsString, IsNotEmpty, IsNumber, Min, Max, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FILE_LIMITS } from '@forgestack/shared';

export class PresignedUrlRequestDto {
  @ApiProperty({
    description: 'Name of the file to upload',
    example: 'avatar.png'
  })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/png'
  })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({
    description: 'Size of the file in bytes (max 50MB)',
    example: 1024000,
    minimum: 1,
    maximum: FILE_LIMITS.MAX_SIZE_BYTES
  })
  @IsNumber()
  @Min(1)
  @Max(FILE_LIMITS.MAX_SIZE_BYTES)
  size!: number;

  @ApiProperty({
    description: 'Purpose of the file upload',
    enum: ['avatar', 'logo', 'attachment'],
    example: 'avatar'
  })
  @IsString()
  @IsIn(['avatar', 'logo', 'attachment'])
  purpose!: string;

  @ApiProperty({
    description: 'Type of entity this file is associated with',
    example: 'project',
    required: false
  })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiProperty({
    description: 'ID of the entity this file is associated with',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false
  })
  @IsOptional()
  @IsUUID()
  entityId?: string;
}

export class PresignedUrlResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the file',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  fileId!: string;

  @ApiProperty({
    description: 'Presigned URL for uploading the file to S3',
    example: 'https://s3.amazonaws.com/bucket/file?signature=...'
  })
  uploadUrl!: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp when the presigned URL expires',
    example: '2024-12-04T12:00:00Z'
  })
  expiresAt!: string;
}

