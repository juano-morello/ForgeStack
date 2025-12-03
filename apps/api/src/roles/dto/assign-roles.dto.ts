/**
 * Assign Roles DTO
 */

import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class AssignRolesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  roleIds!: string[];
}

