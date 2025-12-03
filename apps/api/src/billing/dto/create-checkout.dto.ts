import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  priceId!: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  successUrl!: string;

  @IsUrl({ require_tld: false })
  @IsNotEmpty()
  cancelUrl!: string;
}

