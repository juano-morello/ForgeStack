/**
 * AuthService
 * Handles session verification with better-auth
 */

import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { createHash } from 'crypto';
import { AUTH_CONSTANTS } from '@forgestack/shared';

export interface BetterAuthUser {
  id: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BetterAuthSession {
  id: string;
  userId: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface SessionVerificationResult {
  session: BetterAuthSession;
  user: BetterAuthUser;
}

@Injectable()
export class AuthService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis | null = null;
  private readonly cacheTtlSeconds = AUTH_CONSTANTS.SESSION_CACHE_TTL_SECONDS;
  private readonly authServerUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.authServerUrl = this.configService.get<string>(
      'authServerUrl',
      'http://localhost:3000',
    );
    this.initializeRedis();
  }

  private initializeRedis(): void {
    const redisUrl = this.configService.get<string>('redis.url');
    if (!redisUrl) {
      this.logger.warn('Session caching disabled - Redis not configured');
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

      this.logger.log('Redis session cache initialized');
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  /**
   * Hash session token for secure Redis key storage
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Get Redis key for session cache
   */
  private getCacheKey(token: string): string {
    const hashedToken = this.hashToken(token);
    return `session:${hashedToken}`;
  }

  /**
   * Verify a session token with better-auth
   * Uses caching to reduce calls to auth server
   */
  async verifySession(
    sessionToken: string,
  ): Promise<SessionVerificationResult | null> {
    if (!sessionToken) {
      return null;
    }

    // Check cache first
    const cached = await this.getFromCache(sessionToken);
    if (cached) {
      this.logger.debug(`Session cache hit for token: ${sessionToken.slice(0, 8)}...`);
      return cached;
    }

    try {
      const response = await fetch(
        `${this.authServerUrl}/api/auth/get-session`,
        {
          method: 'GET',
          headers: {
            Cookie: `better-auth.session_token=${sessionToken}`,
          },
        },
      );

      if (!response.ok) {
        this.logger.debug(
          `Session verification failed: ${response.status} ${response.statusText}`,
        );
        return null;
      }

      const data = (await response.json()) as {
        session?: {
          id: string;
          userId: string;
          expiresAt: string;
          ipAddress?: string;
          userAgent?: string;
        };
        user?: {
          id: string;
          email: string;
          name?: string;
          emailVerified?: boolean;
          image?: string;
          createdAt: string;
          updatedAt: string;
        };
      } | null;

      // better-auth returns { session, user } or null
      if (!data || !data.session || !data.user) {
        this.logger.debug('Session verification returned empty data');
        return null;
      }

      const result: SessionVerificationResult = {
        session: {
          id: data.session.id,
          userId: data.session.userId,
          expiresAt: new Date(data.session.expiresAt),
          ipAddress: data.session.ipAddress || null,
          userAgent: data.session.userAgent || null,
        },
        user: {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name || null,
          emailVerified: data.user.emailVerified || false,
          image: data.user.image || null,
          createdAt: new Date(data.user.createdAt),
          updatedAt: new Date(data.user.updatedAt),
        },
      };

      // Cache the result
      await this.setCache(sessionToken, result);
      this.logger.debug(
        `Session verified for user: ${result.user.email}`,
      );

      return result;
    } catch (error) {
      this.logger.error('Session verification error:', error);
      return null;
    }
  }

  /**
   * Extract session token from request
   * Checks cookies first, then Authorization header
   */
  extractSessionToken(request: {
    cookies?: Record<string, string>;
    headers?: Record<string, string | string[] | undefined>;
  }): string | undefined {
    // Check cookies (primary method for browser requests)
    const cookieToken = request.cookies?.['better-auth.session_token'];
    if (cookieToken) {
      return cookieToken;
    }

    // Check Authorization header (for API clients)
    const authHeader = request.headers?.authorization;
    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    return undefined;
  }

  /**
   * Get session from Redis cache
   * Fails open if Redis is unavailable
   */
  private async getFromCache(token: string): Promise<SessionVerificationResult | null> {
    if (!this.redis) {
      return null;
    }

    try {
      const key = this.getCacheKey(token);
      const cached = await this.redis.get(key);

      if (!cached) {
        return null;
      }

      const result = JSON.parse(cached) as SessionVerificationResult;

      // Parse date strings back to Date objects
      result.session.expiresAt = new Date(result.session.expiresAt);
      result.user.createdAt = new Date(result.user.createdAt);
      result.user.updatedAt = new Date(result.user.updatedAt);

      return result;
    } catch (error) {
      // Fail open - if Redis is down, don't block authentication
      this.logger.warn(`Failed to get session from cache: ${error}`);
      return null;
    }
  }

  /**
   * Set session in Redis cache with TTL
   * Fails open if Redis is unavailable
   */
  private async setCache(token: string, result: SessionVerificationResult): Promise<void> {
    if (!this.redis) {
      return;
    }

    try {
      const key = this.getCacheKey(token);
      const value = JSON.stringify(result);

      // Use SETEX to set value with TTL in one atomic operation
      await this.redis.setex(key, this.cacheTtlSeconds, value);
    } catch (error) {
      // Fail open - if Redis is down, don't block authentication
      this.logger.warn(`Failed to set session in cache: ${error}`);
    }
  }
}

