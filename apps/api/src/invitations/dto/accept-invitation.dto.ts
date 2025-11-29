import { IsString, Length } from 'class-validator';
import { INVITATION_VALIDATION } from '@forgestack/shared';

export class AcceptInvitationDto {
  @IsString()
  @Length(INVITATION_VALIDATION.TOKEN_LENGTH, INVITATION_VALIDATION.TOKEN_LENGTH)
  token!: string;
}

