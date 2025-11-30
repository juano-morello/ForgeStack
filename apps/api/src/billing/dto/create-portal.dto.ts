import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreatePortalDto {
  @IsUrl()
  @IsNotEmpty()
  returnUrl!: string;
}

