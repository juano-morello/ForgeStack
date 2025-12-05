import { IsEnum } from 'class-validator';
import { ORG_ROLES, type OrgRole } from '@forgestack/shared';

export class UpdateMemberRoleDto {
  @IsEnum(ORG_ROLES)
  role!: OrgRole;
}
