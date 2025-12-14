/**
 * Update API Key DTO
 */

import { IsString, IsOptional, MaxLength, IsArray, ArrayNotEmpty, IsIn } from 'class-validator';
import { AVAILABLE_SCOPES } from '../key-utils';

export class UpdateApiKeyDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one scope is required' })
  @IsIn(AVAILABLE_SCOPES, { each: true, message: 'Invalid scope provided' })
  scopes?: string[];
}

