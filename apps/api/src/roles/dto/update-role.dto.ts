/**
 * Update Role DTO
 */

import { IsString, IsOptional, IsArray, IsUUID, MinLength, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Role name',
    required: false,
    minLength: 1,
    example: 'Project Manager'
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiProperty({
    description: 'Role description',
    required: false,
    example: 'Can manage projects and view reports'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to this role',
    required: false,
    type: [String],
    minItems: 1,
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000']
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  permissionIds?: string[];
}

