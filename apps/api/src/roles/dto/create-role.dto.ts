/**
 * Create Role DTO
 */

import { IsString, IsOptional, IsArray, IsUUID, MinLength, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Role name',
    minLength: 1,
    example: 'Project Manager'
  })
  @IsString()
  @MinLength(1)
  name!: string;

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
    type: [String],
    minItems: 1,
    example: ['123e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000']
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  permissionIds!: string[];
}

