/**
 * AI Rate Limiter Service
 * Handles rate limiting for AI operations based on plan limits
 */

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AiRepository } from './ai.repository';
import type { TenantContext } from '@forgestack/db';

// AI-specific rate limits by plan (from spec)
const AI_RATE_LIMITS = {
  free: {
    tokensPerMinute: 10000,
    tokensPerDay: 100000,
    requestsPerMinute: 60,
  },
  starter: {
    tokensPerMinute: 50000,
    tokensPerDay: 1000000,
    requestsPerMinute: 60,
  },
  pro: {
    tokensPerMinute: 200000,
    tokensPerDay: 5000000,
    requestsPerMinute: 60,
  },
  enterprise: {
    tokensPerMinute: null, // Unlimited
    tokensPerDay: null, // Unlimited
    requestsPerMinute: null, // Unlimited
  },
};

@Injectable()
export class AiRateLimiterService {
  private readonly logger = new Logger(AiRateLimiterService.name);
  private redis: Redis | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiRepository: AiRepository,
  ) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>('redis.url');
    if (!redisUrl) {
      this.logger.warn('AI rate limiting disabled - Redis not configured');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
      });

      this.redis.on('error', (err) => {
        this.logger.error(`Redis error: ${err.message}`);
      });
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error}`);
    }
  }

  /**
   * Check if AI request is allowed based on rate limits
   * @throws HttpException with 429 status if rate limit exceeded
   */
  async checkRateLimit(ctx: TenantContext, plan: string): Promise<void> {
    if (!this.redis) {
      // Rate limiting disabled
      return;
    }

    const limits = AI_RATE_LIMITS[plan as keyof typeof AI_RATE_LIMITS] || AI_RATE_LIMITS.free;

    // Check request rate limit
    if (limits.requestsPerMinute !== null) {
      await this.checkRequestLimit(ctx.orgId, limits.requestsPerMinute);
    }

    // Check token limits (based on historical usage)
    if (limits.tokensPerDay !== null) {
      await this.checkTokenLimit(ctx, limits.tokensPerDay);
    }
  }

  /**
   * Check request-based rate limit (requests per minute)
   */
  private async checkRequestLimit(orgId: string, limit: number): Promise<void> {
    const key = `ai:requests:${orgId}:minute`;
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    try {
      // Use sorted set to track requests in time window
      await this.redis!.zadd(key, now, `${now}`);
      await this.redis!.zremrangebyscore(key, 0, windowStart);
      await this.redis!.expire(key, 60);

      const count = await this.redis!.zcard(key);

      if (count > limit) {
        this.logger.warn(`AI request rate limit exceeded for org ${orgId}: ${count}/${limit}`);
        throw new HttpException(
          `AI request rate limit exceeded. Maximum ${limit} requests per minute allowed.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to check request limit: ${error}`);
      // Fail open on Redis errors
    }
  }

  /**
   * Check token-based rate limit (tokens per day)
   */
  private async checkTokenLimit(ctx: TenantContext, dailyLimit: number): Promise<void> {
    try {
      const monthlyUsage = await this.aiRepository.getMonthlyUsage(ctx);
      const dailyAverage = monthlyUsage / new Date().getDate();

      // Simple heuristic: if daily average exceeds limit, block
      if (dailyAverage > dailyLimit) {
        this.logger.warn(`AI token limit exceeded for org ${ctx.orgId}: ${dailyAverage}/${dailyLimit}`);
        throw new HttpException(
          `AI token limit exceeded. Maximum ${dailyLimit} tokens per day allowed.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Failed to check token limit: ${error}`);
      // Fail open on errors
    }
  }
}

