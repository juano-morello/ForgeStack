/**
 * AI Controller
 * REST API endpoints for AI operations
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Logger,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AiService } from './ai.service';
import { AiRepository } from './ai.repository';
import { BillingService } from '../billing/billing.service';
import { CurrentTenant } from '../core/decorators/tenant-context.decorator';
import type { TenantContext } from '@forgestack/db';
import {
  ChatRequestDto,
  ChatResponseDto,
  GenerateTextRequestDto,
  GenerateTextResponseDto,
  GenerateObjectRequestDto,
  GenerateObjectResponseDto,
  GetUsageQueryDto,
  GetUsageResponseDto,
  UsagePeriod,
} from './dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(
    private readonly aiService: AiService,
    private readonly aiRepository: AiRepository,
    private readonly billingService: BillingService,
  ) {}

  /**
   * POST /ai/chat - Streaming chat completion
   */
  @Post('chat')
  @ApiOperation({ summary: 'Chat completion with streaming', description: 'Send chat messages and receive streaming AI response' })
  @ApiResponse({ status: 200, description: 'Streaming response (SSE)' })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async chat(
    @CurrentTenant() ctx: TenantContext,
    @Body() dto: ChatRequestDto,
    @Res() res: Response,
  ) {
    this.logger.debug(`POST /ai/chat for org ${ctx.orgId}`);

    // Get org's plan
    const subscription = await this.billingService.getSubscription(ctx);
    const plan = subscription.plan;

    if (dto.stream !== false) {
      // Streaming response
      const result = await this.aiService.streamText(ctx, plan, dto);

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Stream the response
      for await (const chunk of result.textStream) {
        res.write(`data: ${JSON.stringify({ type: 'text-delta', text: chunk })}\n\n`);
      }

      // Send finish event with usage
      const usage = await result.usage;
      res.write(`data: ${JSON.stringify({
        type: 'finish',
        usage: {
          inputTokens: usage.inputTokens || 0,
          outputTokens: usage.outputTokens || 0,
        }
      })}\n\n`);

      // Record usage after streaming completes
      await this.aiRepository.recordUsage({
        orgId: ctx.orgId,
        userId: ctx.userId,
        provider: dto.provider || 'openai',
        model: dto.model || 'gpt-4o-mini',
        inputTokens: usage.inputTokens || 0,
        outputTokens: usage.outputTokens || 0,
      });

      res.end();
    } else {
      // Non-streaming response
      const result = await this.aiService.generateText(ctx, plan, {
        prompt: dto.messages.map(m => `${m.role}: ${m.content}`).join('\n'),
        model: dto.model,
        provider: dto.provider,
        temperature: dto.temperature,
        maxTokens: dto.maxTokens,
      });

      const response: ChatResponseDto = {
        id: `chat_${Date.now()}`,
        content: result.text,
        role: 'assistant' as const,
        usage: {
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          totalTokens: result.inputTokens + result.outputTokens,
        },
      };

      res.json(response);
    }
  }

  /**
   * POST /ai/generate - Text generation
   */
  @Post('generate')
  @ApiOperation({ summary: 'Generate text', description: 'Generate text from a prompt' })
  @ApiResponse({ status: 200, type: GenerateTextResponseDto })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async generate(
    @CurrentTenant() ctx: TenantContext,
    @Body() dto: GenerateTextRequestDto,
  ): Promise<GenerateTextResponseDto> {
    this.logger.debug(`POST /ai/generate for org ${ctx.orgId}`);

    const subscription = await this.billingService.getSubscription(ctx);
    return this.aiService.generateText(ctx, subscription.plan, dto);
  }

  /**
   * POST /ai/generate-object - Structured output generation
   */
  @Post('generate-object')
  @ApiOperation({ summary: 'Generate structured object', description: 'Generate a structured object matching a schema' })
  @ApiResponse({ status: 200, type: GenerateObjectResponseDto })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded' })
  async generateObject(
    @CurrentTenant() ctx: TenantContext,
    @Body() dto: GenerateObjectRequestDto,
  ): Promise<GenerateObjectResponseDto> {
    this.logger.debug(`POST /ai/generate-object for org ${ctx.orgId}`);

    const subscription = await this.billingService.getSubscription(ctx);
    return this.aiService.generateObject(ctx, subscription.plan, dto);
  }

  /**
   * GET /ai/usage - Get AI usage statistics
   */
  @Get('usage')
  @ApiOperation({ summary: 'Get AI usage', description: 'Get AI usage statistics for the organization' })
  @ApiResponse({ status: 200, type: GetUsageResponseDto })
  async getUsage(
    @CurrentTenant() ctx: TenantContext,
    @Query() query: GetUsageQueryDto,
  ): Promise<GetUsageResponseDto> {
    this.logger.debug(`GET /ai/usage for org ${ctx.orgId}`);

    const period = query.period || UsagePeriod.MONTH;
    const { startDate, endDate } = this.getDateRange(period);

    // Get usage stats
    const usage = await this.aiRepository.getUsageByOrg(ctx, startDate, endDate);
    const providerUsage = await this.aiRepository.getUsageByProvider(ctx, startDate, endDate);

    // Get plan limits
    const subscription = await this.billingService.getSubscription(ctx);
    const plan = subscription.plan;

    // Simplified limits (from rate limiter config)
    const dailyLimit = plan === 'free' ? 100000 : plan === 'starter' ? 1000000 : 5000000;
    const remaining = Math.max(0, dailyLimit - usage.totalTokens);

    // Convert provider usage to map
    const byProvider: Record<string, { tokens: number; requests: number }> = {};
    for (const p of providerUsage) {
      byProvider[p.provider] = {
        tokens: p.tokens,
        requests: p.requests,
      };
    }

    return {
      period,
      usage: {
        totalTokens: usage.totalTokens,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        requestCount: usage.requestCount,
      },
      byProvider,
      limit: {
        tokensPerDay: dailyLimit,
        remaining,
      },
    };
  }

  /**
   * Helper to get date range for usage period
   */
  private getDateRange(period: UsagePeriod): { startDate: Date; endDate: Date } {
    const now = new Date();
    const endDate = now;
    let startDate: Date;

    if (period === UsagePeriod.DAY) {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === UsagePeriod.WEEK) {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      // Month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { startDate, endDate };
  }
}

