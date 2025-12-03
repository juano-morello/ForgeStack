import { IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { OrgRole } from '@forgestack/db';

export class CreateInvitationDto {
  @ApiProperty({ description: 'Email address to invite', example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Role to assign', enum: ['OWNER', 'MEMBER'], example: 'MEMBER' })
  @IsEnum(['OWNER', 'MEMBER'])
  role!: OrgRole;
}

