/**
 * Rate limiting guard
 * Enforces rate limits on all API requests
 */

import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitingService } from './rate-limiting.service';
import { RATE_LIMIT_KEY, RateLimitOptions } from './rate-limit.decorator';
import { RateLimitException } from './rate-limit.exception';
import { RATE_LIMIT_CONFIG } from './rate-limit.config';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimitingService: RateLimitingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (!RATE_LIMIT_CONFIG.enabled) {
      return true;
    }

    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Skip rate limiting if decorator says so
    if (options?.skip) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    let result;

    // Determine rate limit type
    if (request.tenantContext?.orgId) {
      // Authenticated request - use org-based limiting
      const plan = (request.tenantContext as { plan?: string }).plan || 'free';
      result = await this.rateLimitingService.checkOrgLimit(request.tenantContext.orgId, plan);
    } else {
      // Unauthenticated - use IP-based limiting
      const ip = this.getClientIp(request);
      const type = this.isAuthEndpoint(request) ? 'auth' : 'public';
      result = await this.rateLimitingService.checkIpLimit(ip, type);
    }

    // Set rate limit headers
    response.setHeader('X-RateLimit-Limit', result.limit);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.reset);

    if (!result.allowed) {
      response.setHeader('Retry-After', result.retryAfter);
      throw new RateLimitException(
        result.retryAfter!,
        result.limit,
        result.remaining,
        result.reset,
      );
    }

    return true;
  }

  private getClientIp(request: {
    headers: Record<string, string | string[] | undefined>;
    connection?: { remoteAddress?: string };
    ip?: string;
  }): string {
    const forwardedFor = request.headers['x-forwarded-for'];
    const forwardedForStr = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
    return (
      forwardedForStr?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.connection?.remoteAddress ||
      request.ip ||
      '0.0.0.0'
    );
  }

  private isAuthEndpoint(request: { path?: string; url?: string }): boolean {
    const path = request.path || request.url;
    return path?.includes('/auth/') || path?.includes('/login') || false;
  }
}

