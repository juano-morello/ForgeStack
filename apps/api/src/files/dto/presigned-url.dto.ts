/**
 * DTOs for presigned URL generation
 */

import { IsString, IsNotEmpty, IsNumber, Min, Max, IsIn, IsOptional, IsUUID } from 'class-validator';

export class PresignedUrlRequestDto {
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @IsNumber()
  @Min(1)
  @Max(52428800) // 50MB max
  size!: number;

  @IsString()
  @IsIn(['avatar', 'logo', 'attachment'])
  purpose!: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;
}

export class PresignedUrlResponseDto {
  fileId!: string;
  uploadUrl!: string;
  expiresAt!: string;
}

