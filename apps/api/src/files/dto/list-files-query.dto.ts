/**
 * DTOs for listing files
 */

import { IsOptional, IsString, IsIn, IsUUID, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListFilesQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['avatar', 'logo', 'attachment'])
  purpose?: string;

  @IsOptional()
  @IsString()
  entityType?: string;

  @IsOptional()
  @IsUUID()
  entityId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

