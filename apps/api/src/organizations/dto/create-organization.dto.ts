import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrganizationDto {
  @ApiProperty({ description: 'Organization name', minLength: 2, maxLength: 100, example: 'Acme Corp' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}

