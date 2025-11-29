import { IsEnum } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsEnum(['OWNER', 'MEMBER'])
  role!: 'OWNER' | 'MEMBER';
}

