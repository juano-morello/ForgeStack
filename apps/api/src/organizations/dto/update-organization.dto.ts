import { IsString, MinLength, MaxLength, IsOptional, IsUrl, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrganizationDto {
  @ApiProperty({ description: 'Organization name', minLength: 2, maxLength: 100, required: false, example: 'Acme Corp' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ description: 'Organization logo URL', required: false, example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  @IsUrl()
  logo?: string;

  @ApiProperty({ description: 'Organization timezone (IANA format)', required: false, example: 'America/New_York' })
  @IsOptional()
  @IsString()
  @Matches(
    /^[A-Za-z_]+\/[A-Za-z_]+(?:\/[A-Za-z_]+)?$/,
    { message: 'Timezone must be in IANA format (e.g., America/New_York, Europe/London)' }
  )
  timezone?: string;

  @ApiProperty({ description: 'Organization language (locale format)', required: false, example: 'en' })
  @IsOptional()
  @IsString()
  language?: string; // TODO: Add locale format validation (e.g., 'en', 'es', 'fr')
}

