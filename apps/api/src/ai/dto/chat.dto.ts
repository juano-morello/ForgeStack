/**
 * Chat DTOs
 * Request and response types for AI chat endpoints
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';

export enum MessageRole {
  SYSTEM = 'system',
  USER = 'user',
  ASSISTANT = 'assistant',
}

export enum AIProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

export class ChatMessageDto {
  @ApiProperty({ enum: MessageRole, description: 'Message role' })
  @IsEnum(MessageRole)
  role!: MessageRole;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  content!: string;
}

export class ChatRequestDto {
  @ApiProperty({ type: [ChatMessageDto], description: 'Array of chat messages' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[];

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

  @ApiPropertyOptional({ description: 'Enable streaming', default: true })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}

export class UsageDto {
  @ApiProperty({ description: 'Input tokens used' })
  inputTokens!: number;

  @ApiProperty({ description: 'Output tokens used' })
  outputTokens!: number;

  @ApiProperty({ description: 'Total tokens used' })
  totalTokens!: number;
}

export class ChatResponseDto {
  @ApiProperty({ description: 'Response ID' })
  id!: string;

  @ApiProperty({ description: 'Generated content' })
  content!: string;

  @ApiProperty({ enum: MessageRole, description: 'Response role' })
  role!: string;

  @ApiProperty({ type: UsageDto, description: 'Token usage' })
  usage!: UsageDto;
}

