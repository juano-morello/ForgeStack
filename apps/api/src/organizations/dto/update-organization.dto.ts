import { IsString, MinLength, MaxLength, IsOptional, IsUrl } from 'class-validator';

export class UpdateOrganizationDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl()
  logo?: string;

  @IsOptional()
  @IsString()
  timezone?: string; // TODO: Add IANA timezone validation

  @IsOptional()
  @IsString()
  language?: string; // TODO: Add locale format validation (e.g., 'en', 'es', 'fr')
}

