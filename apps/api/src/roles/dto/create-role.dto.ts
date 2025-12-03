/**
 * Create Role DTO
 */

import { IsString, IsOptional, IsArray, IsUUID, MinLength, ArrayMinSize } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  permissionIds!: string[];
}

