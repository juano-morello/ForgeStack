import { IsEmail, IsEnum } from 'class-validator';
import { OrgRole } from '@forgestack/db';

export class CreateInvitationDto {
  @IsEmail()
  email!: string;

  @IsEnum(['OWNER', 'MEMBER'])
  role!: OrgRole;
}

