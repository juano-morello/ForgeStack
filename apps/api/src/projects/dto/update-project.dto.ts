import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { PROJECT_VALIDATION } from '@forgestack/shared';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(PROJECT_VALIDATION.NAME_MIN_LENGTH)
  @MaxLength(PROJECT_VALIDATION.NAME_MAX_LENGTH)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(PROJECT_VALIDATION.DESCRIPTION_MAX_LENGTH)
  description?: string;
}

