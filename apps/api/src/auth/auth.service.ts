/**
 * AuthService
 * Handles session verification with better-auth
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

// Simple in-memory cache for session verification
interface CacheEntry {
  result: SessionVerificationResult;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly sessionCache = new Map<string, CacheEntry>();
  private readonly cacheTtlMs = 30000; // 30 seconds cache
  private readonly authServerUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.authServerUrl = this.configService.get<string>(
      'authServerUrl',
      'http://localhost:3000',
    );
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
    const cached = this.getFromCache(sessionToken);
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
      this.setCache(sessionToken, result);
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

  private getFromCache(token: string): SessionVerificationResult | null {
    const entry = this.sessionCache.get(token);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.sessionCache.delete(token);
      return null;
    }

    return entry.result;
  }

  private setCache(token: string, result: SessionVerificationResult): void {
    this.sessionCache.set(token, {
      result,
      expiresAt: Date.now() + this.cacheTtlMs,
    });

    // Cleanup old entries periodically (simple cleanup on each write)
    if (this.sessionCache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.sessionCache.entries()) {
      if (now > entry.expiresAt) {
        this.sessionCache.delete(key);
      }
    }
  }
}

