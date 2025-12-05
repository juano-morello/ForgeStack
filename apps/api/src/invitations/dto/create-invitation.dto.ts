import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ORG_ROLES, type OrgRole } from '@forgestack/shared';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Email address to invite', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Role to assign', enum: ['OWNER', 'MEMBER'], example: 'MEMBER' })
  @IsEnum(ORG_ROLES)
  role!: OrgRole;
}

