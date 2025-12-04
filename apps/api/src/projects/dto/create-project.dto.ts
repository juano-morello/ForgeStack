import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PROJECT_VALIDATION } from '@forgestack/shared';

export class CreateProjectDto {
  @ApiProperty({ description: 'Project name', minLength: PROJECT_VALIDATION.NAME_MIN_LENGTH, maxLength: PROJECT_VALIDATION.NAME_MAX_LENGTH, example: 'My Project' })
  @IsString()
  @MinLength(PROJECT_VALIDATION.NAME_MIN_LENGTH)
  @MaxLength(PROJECT_VALIDATION.NAME_MAX_LENGTH)
  name!: string;

  @ApiProperty({ description: 'Project description', maxLength: PROJECT_VALIDATION.DESCRIPTION_MAX_LENGTH, required: false, example: 'A sample project' })
  @IsString()
  @IsOptional()
  @MaxLength(PROJECT_VALIDATION.DESCRIPTION_MAX_LENGTH)
  description?: string;
}

