/**
 * DTO for starting impersonation
 */

import { IsUUID, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartImpersonationDto {
  @ApiPropertyOptional({
    description: 'Session duration in minutes (default: 60)',
    example: 60,
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;
}

