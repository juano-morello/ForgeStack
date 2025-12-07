/**
 * Usage DTOs
 * Request and response types for AI usage tracking
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export enum UsagePeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
}

export class GetUsageQueryDto {
  @ApiPropertyOptional({ enum: UsagePeriod, description: 'Usage period', default: UsagePeriod.MONTH })
  @IsOptional()
  @IsEnum(UsagePeriod)
  period?: UsagePeriod;
}

export class ProviderUsageDto {
  @ApiProperty({ description: 'Total tokens used' })
  tokens!: number;

  @ApiProperty({ description: 'Number of requests' })
  requests!: number;
}

export class UsageStatsDto {
  @ApiProperty({ description: 'Total tokens used' })
  totalTokens!: number;

  @ApiProperty({ description: 'Input tokens used' })
  inputTokens!: number;

  @ApiProperty({ description: 'Output tokens used' })
  outputTokens!: number;

  @ApiProperty({ description: 'Total number of requests' })
  requestCount!: number;
}

export class UsageLimitDto {
  @ApiProperty({ description: 'Tokens per day limit' })
  tokensPerDay!: number;

  @ApiProperty({ description: 'Remaining tokens for current period' })
  remaining!: number;
}

export class GetUsageResponseDto {
  @ApiProperty({ enum: UsagePeriod, description: 'Usage period' })
  period!: UsagePeriod;

  @ApiProperty({ type: UsageStatsDto, description: 'Usage statistics' })
  usage!: UsageStatsDto;

  @ApiProperty({ 
    type: 'object',
    description: 'Usage breakdown by provider',
    additionalProperties: { type: 'object' }
  })
  byProvider!: Record<string, ProviderUsageDto>;

  @ApiProperty({ type: UsageLimitDto, description: 'Usage limits' })
  limit!: UsageLimitDto;
}

