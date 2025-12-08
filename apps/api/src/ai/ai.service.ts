/**
 * AI Service
 * Core AI operations using Vercel AI SDK
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, streamText, generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { AiRepository } from './ai.repository';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import type { TenantContext } from '@forgestack/db';
import type {
  ChatRequestDto,
  GenerateTextRequestDto,
  GenerateTextResponseDto,
  GenerateObjectRequestDto,
  GenerateObjectResponseDto,
} from './dto';

// Default models per provider
const DEFAULT_MODELS = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-sonnet-latest',
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly aiRepository: AiRepository,
    private readonly rateLimiter: AiRateLimiterService,
  ) {}

  /**
   * Generate text using AI
   */
  async generateText(
    ctx: TenantContext,
    plan: string,
    dto: GenerateTextRequestDto,
  ): Promise<GenerateTextResponseDto> {
    this.logger.debug(`Generating text for org ${ctx.orgId}`);

    // Check rate limits
    await this.rateLimiter.checkRateLimit(ctx, plan);

    const provider = dto.provider || 'openai';
    const model = this.getModel(provider, dto.model);

    try {
      const result = await generateText({
        model,
        prompt: dto.prompt,
        temperature: dto.temperature ?? 0.7,
        maxOutputTokens: dto.maxTokens ?? 4096,
      });

      // Record usage
      await this.aiRepository.recordUsage({
        orgId: ctx.orgId,
        userId: ctx.userId,
        provider,
        model: dto.model || DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS],
        inputTokens: result.usage.inputTokens || 0,
        outputTokens: result.usage.outputTokens || 0,
      });

      return {
        text: result.text,
        inputTokens: result.usage.inputTokens || 0,
        outputTokens: result.usage.outputTokens || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to generate text: ${error}`);
      throw new BadRequestException('Failed to generate text');
    }
  }

  /**
   * Stream text using AI (returns async iterable for SSE)
   */
  async streamText(ctx: TenantContext, plan: string, dto: ChatRequestDto) {
    this.logger.debug(`Streaming chat for org ${ctx.orgId}`);

    // Check rate limits
    await this.rateLimiter.checkRateLimit(ctx, plan);

    const provider = dto.provider || 'openai';
    const model = this.getModel(provider, dto.model);

    try {
      const result = streamText({
        model,
        messages: dto.messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        temperature: dto.temperature ?? 0.7,
        maxOutputTokens: dto.maxTokens ?? 4096,
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to stream text: ${error}`);
      throw new BadRequestException('Failed to stream text');
    }
  }

  /**
   * Generate structured object using AI
   */
  async generateObject(
    ctx: TenantContext,
    plan: string,
    dto: GenerateObjectRequestDto,
  ): Promise<GenerateObjectResponseDto> {
    this.logger.debug(`Generating object for org ${ctx.orgId}`);

    // Check rate limits
    await this.rateLimiter.checkRateLimit(ctx, plan);

    const provider = dto.provider || 'openai';
    const model = this.getModel(provider, dto.model);

    try {
      // Convert JSON schema to Zod schema (simplified)
      const zodSchema = this.jsonSchemaToZod(dto.schema);

      const result = await generateObject({
        model,
        schema: zodSchema,
        prompt: dto.prompt,
      });

      // Record usage
      await this.aiRepository.recordUsage({
        orgId: ctx.orgId,
        userId: ctx.userId,
        provider,
        model: dto.model || DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS],
        inputTokens: result.usage.inputTokens || 0,
        outputTokens: result.usage.outputTokens || 0,
      });

      return {
        object: result.object as Record<string, unknown>,
        inputTokens: result.usage.inputTokens || 0,
        outputTokens: result.usage.outputTokens || 0,
      };
    } catch (error) {
      this.logger.error(`Failed to generate object: ${error}`);
      throw new BadRequestException('Failed to generate object');
    }
  }

  /**
   * Get AI model instance based on provider and model name
   */
  private getModel(provider: string, modelName?: string) {
    const model = modelName || DEFAULT_MODELS[provider as keyof typeof DEFAULT_MODELS];

    if (provider === 'openai') {
      return openai(model);
    } else if (provider === 'anthropic') {
      return anthropic(model);
    }

    throw new BadRequestException(`Unsupported provider: ${provider}`);
  }

  /**
   * Convert JSON schema to Zod schema (simplified implementation)
   * For production, consider using a library like json-schema-to-zod
   */
  private jsonSchemaToZod(schema: Record<string, unknown>): z.ZodObject<any> {
    // Simple implementation: assume schema has properties object
    const properties = schema.properties as Record<string, any> || {};
    const zodShape: Record<string, z.ZodTypeAny> = {};

    for (const [key, prop] of Object.entries(properties)) {
      const type = prop.type as string;

      if (type === 'string') {
        zodShape[key] = z.string();
      } else if (type === 'number') {
        zodShape[key] = z.number();
      } else if (type === 'boolean') {
        zodShape[key] = z.boolean();
      } else if (type === 'array') {
        zodShape[key] = z.array(z.any());
      } else {
        zodShape[key] = z.any();
      }
    }

    return z.object(zodShape);
  }
}

