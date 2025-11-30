import { IsString, IsUrl, IsNotEmpty } from 'class-validator';

export class CreateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  priceId!: string;

  @IsUrl()
  @IsNotEmpty()
  successUrl!: string;

  @IsUrl()
  @IsNotEmpty()
  cancelUrl!: string;
}

