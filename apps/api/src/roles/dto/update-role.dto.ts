/**
 * Update Role DTO
 */

import { IsString, IsOptional, IsArray, IsUUID, MinLength, ArrayMinSize } from 'class-validator';

export class UpdateRoleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  permissionIds?: string[];
}

