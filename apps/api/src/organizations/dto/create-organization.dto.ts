import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ORGANIZATION_VALIDATION } from '@forgestack/shared';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Organization name',
    minLength: ORGANIZATION_VALIDATION.NAME_MIN_LENGTH,
    maxLength: ORGANIZATION_VALIDATION.NAME_MAX_LENGTH,
    example: 'Acme Corp'
  })
  @IsString()
  @MinLength(ORGANIZATION_VALIDATION.NAME_MIN_LENGTH)
  @MaxLength(ORGANIZATION_VALIDATION.NAME_MAX_LENGTH)
  name!: string;
}
