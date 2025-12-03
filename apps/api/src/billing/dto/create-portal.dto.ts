import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreatePortalDto {
  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  returnUrl!: string;
}

