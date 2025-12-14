import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ListInvoicesDto {
  @ApiProperty({
    description: 'Number of invoices to return',
    required: false,
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiProperty({
    description: 'Stripe invoice ID to start pagination after (cursor-based pagination)',
    required: false,
    example: 'in_1234567890',
  })
  @IsOptional()
  @IsString()
  startingAfter?: string;
}

