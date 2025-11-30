/**
 * Update Feature Flag DTO
 */

import { IsString, IsBoolean, IsOptional, IsArray, IsInt, Min, Max } from 'class-validator';

export class UpdateFeatureFlagDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  type?: 'boolean' | 'plan' | 'percentage';

  @IsOptional()
  @IsBoolean()
  defaultValue?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  plans?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  percentage?: number;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

