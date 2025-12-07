/**
 * Generate DTOs
 * Request and response types for AI text generation and structured output
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsObject,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { AIProvider } from './chat.dto';

export class GenerateTextRequestDto {
  @ApiProperty({ description: 'Prompt for text generation' })
  @IsString()
  prompt!: string;

  @ApiPropertyOptional({ description: 'Model name', example: 'gpt-4o-mini' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ enum: AIProvider, description: 'AI provider' })
  @IsOptional()
  @IsEnum(AIProvider)
  provider?: AIProvider;

  @ApiPropertyOptional({ description: 'Temperature (0-2)', minimum: 0, maximum: 2, default: 0.7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ description: 'Max tokens to generate', minimum: 1, maximum: 16000, default: 4096 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(16000)
  maxTokens?: number;
}

export class GenerateObjectRequestDto {
  @ApiProperty({ description: 'Prompt for object generation' })
  @IsString()
  prompt!: string;

  @ApiProperty({ description: 'JSON schema for the output object', type: Object })
  @IsObject()
  schema!: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Model name', example: 'gpt-4o-mini' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ enum: AIProvider, description: 'AI provider' })
  @IsOptional()
  @IsEnum(AIProvider)
  provider?: AIProvider;

  @ApiPropertyOptional({ description: 'Enable streaming partial objects', default: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}

export class GenerateTextResponseDto {
  @ApiProperty({ description: 'Generated text' })
  text!: string;

  @ApiProperty({ description: 'Input tokens used' })
  inputTokens!: number;

  @ApiProperty({ description: 'Output tokens used' })
  outputTokens!: number;
}

export class GenerateObjectResponseDto {
  @ApiProperty({ description: 'Generated object matching schema', type: Object })
  object!: Record<string, unknown>;

  @ApiProperty({ description: 'Input tokens used' })
  inputTokens!: number;

  @ApiProperty({ description: 'Output tokens used' })
  outputTokens!: number;
}

