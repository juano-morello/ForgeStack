/**
 * Override DTOs
 */

import { IsString, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateOverrideDto {
  @IsUUID()
  orgId!: string;

  @IsBoolean()
  enabled!: boolean;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class OverrideDto {
  id!: string;
  orgId!: string;
  flagId!: string;
  enabled!: boolean;
  reason!: string | null;
  createdAt!: Date;
  updatedAt!: Date;
}

