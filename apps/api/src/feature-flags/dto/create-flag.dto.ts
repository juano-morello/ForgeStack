/**
 * Create Feature Flag DTO
 */

import { IsString, IsBoolean, IsOptional, IsArray, IsInt, Min, Max, Matches } from 'class-validator';

export class CreateFeatureFlagDto {
  @IsString()
  @Matches(/^[a-z][a-z0-9_-]{2,63}$/, {
    message: 'Flag key must be lowercase alphanumeric with hyphens/underscores, 3-64 characters',
  })
  key!: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  type!: 'boolean' | 'plan' | 'percentage';

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

