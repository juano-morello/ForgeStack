/**
 * AI Rate Limiter Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiRateLimiterService } from './ai-rate-limiter.service';
import { AiRepository } from './ai.repository';
import type { TenantContext } from '@forgestack/db';

// Mock ioredis
const mockRedis = {
  zadd: jest.fn(),
  zremrangebyscore: jest.fn(),
  expire: jest.fn(),
  zcard: jest.fn(),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

describe('AiRateLimiterService', () => {
  let service: AiRateLimiterService;
  let aiRepository: jest.Mocked<AiRepository>;

  const mockTenantContext: TenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'OWNER' as const,
  };

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('when Redis is not configured', () => {
    beforeEach(async () => {
      const mockRepository = {
        recordUsage: jest.fn(),
        getUsageByOrg: jest.fn(),
        getUsageByProvider: jest.fn(),
        getMonthlyUsage: jest.fn(),
      };

      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'redis.url') {
            return undefined;
          }
          return undefined;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiRateLimiterService,
          {
            provide: AiRepository,
            useValue: mockRepository,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<AiRateLimiterService>(AiRateLimiterService);
      aiRepository = module.get(AiRepository);
    });

    it('should skip rate limiting when Redis not configured', async () => {
      await expect(
        service.checkRateLimit(mockTenantContext, 'free')
      ).resolves.not.toThrow();

      expect(mockRedis.zadd).not.toHaveBeenCalled();
    });
  });

  describe('when Redis is configured', () => {
    beforeEach(async () => {
      const mockRepository = {
        recordUsage: jest.fn(),
        getUsageByOrg: jest.fn(),
        getUsageByProvider: jest.fn(),
        getMonthlyUsage: jest.fn(),
      };

      const mockConfigService = {
        get: jest.fn((key: string) => {
          if (key === 'redis.url') {
            return 'redis://localhost:6379';
          }
          return undefined;
        }),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          AiRateLimiterService,
          {
            provide: AiRepository,
            useValue: mockRepository,
          },
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();

      service = module.get<AiRateLimiterService>(AiRateLimiterService);
      aiRepository = module.get(AiRepository);
    });

    describe('free plan', () => {
      it('should allow request when under limit', async () => {
        mockRedis.zcard.mockResolvedValueOnce(50); // Under 60 requests/minute
        aiRepository.getMonthlyUsage.mockResolvedValueOnce(50000); // Under daily limit

        await expect(
          service.checkRateLimit(mockTenantContext, 'free')
        ).resolves.not.toThrow();

        expect(mockRedis.zadd).toHaveBeenCalled();
        expect(mockRedis.zremrangebyscore).toHaveBeenCalled();
        expect(mockRedis.expire).toHaveBeenCalled();
        expect(mockRedis.zcard).toHaveBeenCalled();
      });

      it('should throw 429 when request limit exceeded', async () => {
        mockRedis.zcard.mockResolvedValueOnce(61); // Over 60 requests/minute

        await expect(
          service.checkRateLimit(mockTenantContext, 'free')
        ).rejects.toThrow(HttpException);

        try {
          await service.checkRateLimit(mockTenantContext, 'free');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
          expect((error as HttpException).message).toContain('AI request rate limit exceeded');
        }
      });

      it('should throw 429 when token limit exceeded', async () => {
        // Mock Redis calls for request limit check (should pass)
        mockRedis.zadd.mockResolvedValueOnce(1);
        mockRedis.zremrangebyscore.mockResolvedValueOnce(1);
        mockRedis.expire.mockResolvedValueOnce(1);
        mockRedis.zcard.mockResolvedValueOnce(50); // Under request limit

        // Mock current date to be day 10 of the month
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-10T12:00:00Z'));

        // Monthly usage of 200,000 tokens / 10 days = 20,000 tokens/day average
        // This exceeds the free plan limit of 100,000 tokens/day (actually it doesn't - let me fix)
        // Free plan limit is 100,000 tokens/day, so we need more than 1,000,000 tokens in 10 days
        aiRepository.getMonthlyUsage.mockResolvedValueOnce(1500000);

        await expect(
          service.checkRateLimit(mockTenantContext, 'free')
        ).rejects.toThrow(HttpException);

        jest.useRealTimers();
      });
    });

    describe('starter plan', () => {
      it('should allow request when under limit', async () => {
        mockRedis.zcard.mockResolvedValueOnce(50);
        aiRepository.getMonthlyUsage.mockResolvedValueOnce(500000);

        await expect(
          service.checkRateLimit(mockTenantContext, 'starter')
        ).resolves.not.toThrow();
      });

      it('should throw 429 when token limit exceeded', async () => {
        mockRedis.zcard.mockResolvedValueOnce(50);

        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-10T12:00:00Z'));

        // 15,000,000 tokens / 10 days = 1,500,000 tokens/day average
        // Exceeds starter plan limit of 1,000,000 tokens/day
        aiRepository.getMonthlyUsage.mockResolvedValueOnce(15000000);

        await expect(
          service.checkRateLimit(mockTenantContext, 'starter')
        ).rejects.toThrow(HttpException);

        jest.useRealTimers();
      });
    });

    describe('pro plan', () => {
      it('should allow request when under limit', async () => {
        mockRedis.zcard.mockResolvedValueOnce(50);
        aiRepository.getMonthlyUsage.mockResolvedValueOnce(2000000);

        await expect(
          service.checkRateLimit(mockTenantContext, 'pro')
        ).resolves.not.toThrow();
      });

      it('should throw 429 when token limit exceeded', async () => {
        mockRedis.zcard.mockResolvedValueOnce(50);

        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-10T12:00:00Z'));

        // 60,000,000 tokens / 10 days = 6,000,000 tokens/day average
        // Exceeds pro plan limit of 5,000,000 tokens/day
        aiRepository.getMonthlyUsage.mockResolvedValueOnce(60000000);

        await expect(
          service.checkRateLimit(mockTenantContext, 'pro')
        ).rejects.toThrow(HttpException);

        jest.useRealTimers();
      });
    });

    describe('enterprise plan', () => {
      it('should allow unlimited requests', async () => {
        // Enterprise plan has no limits (null values)
        // Should not call Redis or repository
        await expect(
          service.checkRateLimit(mockTenantContext, 'enterprise')
        ).resolves.not.toThrow();

        // Redis should not be called for enterprise plan
        expect(mockRedis.zadd).not.toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle Redis errors gracefully (fail open)', async () => {
        mockRedis.zadd.mockRejectedValueOnce(new Error('Redis connection error'));

        // Should not throw - fails open
        await expect(
          service.checkRateLimit(mockTenantContext, 'free')
        ).resolves.not.toThrow();
      });

      it('should handle repository errors gracefully (fail open)', async () => {
        mockRedis.zcard.mockResolvedValueOnce(50);
        aiRepository.getMonthlyUsage.mockRejectedValueOnce(new Error('Database error'));

        // Should not throw - fails open
        await expect(
          service.checkRateLimit(mockTenantContext, 'free')
        ).resolves.not.toThrow();
      });

      it('should re-throw HttpException errors', async () => {
        mockRedis.zcard.mockResolvedValueOnce(100); // Over limit

        await expect(
          service.checkRateLimit(mockTenantContext, 'free')
        ).rejects.toThrow(HttpException);
      });
    });

    describe('default plan handling', () => {
      it('should use free plan limits for unknown plan', async () => {
        mockRedis.zcard.mockResolvedValueOnce(61); // Over free plan limit

        await expect(
          service.checkRateLimit(mockTenantContext, 'unknown-plan')
        ).rejects.toThrow(HttpException);

        try {
          await service.checkRateLimit(mockTenantContext, 'unknown-plan');
        } catch (error) {
          expect(error).toBeInstanceOf(HttpException);
          expect((error as HttpException).message).toContain('60 requests per minute');
        }
      });
    });
  });
});

