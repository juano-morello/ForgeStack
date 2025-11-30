/**
 * Webhook Event DTOs
 */

import { IsString, IsBoolean, IsOptional, IsInt, Min } from 'class-validator';

export class WebhookEventResponseDto {
  @IsString()
  id!: string;

  @IsString()
  provider!: string;

  @IsString()
  eventType!: string;

  @IsString()
  eventId!: string;

  @IsBoolean()
  verified!: boolean;

  @IsOptional()
  @IsString()
  processedAt?: string | null;

  @IsOptional()
  @IsString()
  error?: string | null;

  @IsInt()
  retryCount!: number;

  @IsString()
  createdAt!: string;
}

export class WebhookEventQueryDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  eventType?: string;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsBoolean()
  processed?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}

