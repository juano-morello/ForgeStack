/**
 * Rate limiting service
 * Handles rate limit checks using Redis
 */

import { Injectable, Logger, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { RATE_LIMIT_CONFIG, IP_RATE_LIMITS } from './rate-limit.config';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  retryAfter?: number; // Seconds to wait
}

@Injectable()
export class RateLimitingService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitingService.name);
  private redis: Redis | null = null;
  private limiters: Map<string, RateLimiterRedis> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>('redis.url');
    if (!redisUrl || !RATE_LIMIT_CONFIG.enabled) {
      this.logger.warn('Rate limiting disabled - Redis not configured');
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

      this.initializeLimiters();
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error}`);
    }
  }

  private initializeLimiters(): void {
    if (!this.redis) return;

    // Create limiters for each time window
    const windows = [
      { name: 'minute', duration: 60 },
      { name: 'hour', duration: 3600 },
      { name: 'day', duration: 86400 },
    ];

    for (const window of windows) {
      // We'll create plan-specific limiters on-demand
      this.limiters.set(
        `base_${window.name}`,
        new RateLimiterRedis({
          storeClient: this.redis,
          keyPrefix: `rl_${window.name}`,
          points: 1000, // Will be overridden per request
          duration: window.duration,
        }),
      );
    }
  }

  async checkLimit(
    key: string,
    limit: number,
    windowName: 'minute' | 'hour' | 'day',
  ): Promise<RateLimitResult> {
    if (!this.redis || !RATE_LIMIT_CONFIG.enabled) {
      // Rate limiting disabled or Redis unavailable
      return {
        allowed: true,
        limit,
        remaining: limit,
        reset: Math.floor(Date.now() / 1000) + this.getWindowDuration(windowName),
      };
    }

    const limiter = this.limiters.get(`base_${windowName}`);
    if (!limiter) {
      return { allowed: true, limit, remaining: limit, reset: Date.now() / 1000 };
    }

    try {
      const res = await limiter.consume(key, 1);
      return this.formatResult(res, limit, windowName);
    } catch (error) {
      if (error instanceof RateLimiterRes) {
        // Rate limited
        return this.formatRejection(error, limit, windowName);
      }

      // Redis error - fail open or closed based on config and environment
      const isProduction = process.env.NODE_ENV === 'production';
      const shouldFailOpen = RATE_LIMIT_CONFIG.failOpen &&
        (!isProduction || RATE_LIMIT_CONFIG.failOpenInProduction);

      if (shouldFailOpen) {
        this.logger.warn('Rate limiting unavailable, failing open');
        return {
          allowed: true,
          limit,
          remaining: limit,
          reset: Math.floor(Date.now() / 1000) + this.getWindowDuration(windowName),
        };
      } else {
        this.logger.error('Rate limiting unavailable, failing closed');
        throw new ServiceUnavailableException('Service temporarily unavailable');
      }
    }
  }

  async checkOrgLimit(orgId: string, plan: string): Promise<RateLimitResult> {
    const planLimits =
      RATE_LIMIT_CONFIG.limits[plan as keyof typeof RATE_LIMIT_CONFIG.limits] ||
      RATE_LIMIT_CONFIG.limits.free;

    // Check minute limit first (most restrictive)
    const minuteResult = await this.checkLimit(`org:${orgId}:minute`, planLimits.minute, 'minute');
    if (!minuteResult.allowed) return minuteResult;

    // Check hour limit if defined
    if (planLimits.hour) {
      const hourResult = await this.checkLimit(`org:${orgId}:hour`, planLimits.hour, 'hour');
      if (!hourResult.allowed) return hourResult;
    }

    // Check day limit if defined
    if (planLimits.day) {
      const dayResult = await this.checkLimit(`org:${orgId}:day`, planLimits.day, 'day');
      if (!dayResult.allowed) return dayResult;
    }

    return minuteResult; // Return minute result for headers
  }

  async checkIpLimit(ip: string, type: 'auth' | 'public' = 'public'): Promise<RateLimitResult> {
    const limits = IP_RATE_LIMITS[type];
    return this.checkLimit(`ip:${ip}:minute`, limits.minute, 'minute');
  }

  private getWindowDuration(window: string): number {
    switch (window) {
      case 'minute':
        return 60;
      case 'hour':
        return 3600;
      case 'day':
        return 86400;
      default:
        return 60;
    }
  }

  private formatResult(res: RateLimiterRes, limit: number, _window: string): RateLimitResult {
    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - res.consumedPoints),
      reset: Math.floor(Date.now() / 1000) + Math.ceil(res.msBeforeNext / 1000),
    };
  }

  private formatRejection(res: RateLimiterRes, limit: number, _window: string): RateLimitResult {
    const retryAfter = Math.ceil(res.msBeforeNext / 1000);
    return {
      allowed: false,
      limit,
      remaining: 0,
      reset: Math.floor(Date.now() / 1000) + retryAfter,
      retryAfter,
    };
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

