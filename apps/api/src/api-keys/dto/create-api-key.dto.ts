/**
 * Create API Key DTO
 */

import { IsString, IsNotEmpty, MaxLength, IsArray, IsOptional, IsISO8601, ArrayNotEmpty, IsIn } from 'class-validator';
import { AVAILABLE_SCOPES } from '../key-utils';

export class CreateApiKeyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsArray()
  @ArrayNotEmpty({ message: 'At least one scope is required' })
  @IsIn(AVAILABLE_SCOPES, { each: true, message: 'Invalid scope provided' })
  scopes!: string[];

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}

