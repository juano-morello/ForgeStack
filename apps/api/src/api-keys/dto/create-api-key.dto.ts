/**
 * Create API Key DTO
 */

import { IsString, IsNotEmpty, MaxLength, IsArray, IsOptional, IsISO8601 } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsArray()
  @IsString({ each: true })
  scopes!: string[];

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

