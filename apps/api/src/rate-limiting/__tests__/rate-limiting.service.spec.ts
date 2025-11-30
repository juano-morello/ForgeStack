/**
 * Rate limiting service tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RateLimitingService } from '../rate-limiting.service';

describe('RateLimitingService', () => {
  let service: RateLimitingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitingService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'redis.url') {
                return undefined; // Simulate Redis not configured
              }
              return undefined;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RateLimitingService>(RateLimitingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkLimit (Redis disabled)', () => {
    it('should allow requests when Redis is not configured', async () => {
      const result = await service.checkLimit('test-key', 100, 'minute');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100);
      expect(result.remaining).toBe(100);
      expect(result.reset).toBeGreaterThan(0);
    });
  });

  describe('checkOrgLimit (Redis disabled)', () => {
    it('should allow requests for free plan', async () => {
      const result = await service.checkOrgLimit('org-123', 'free');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100); // Free plan minute limit
    });

    it('should allow requests for pro plan', async () => {
      const result = await service.checkOrgLimit('org-123', 'pro');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(2000); // Pro plan minute limit
    });

    it('should default to free plan for unknown plan', async () => {
      const result = await service.checkOrgLimit('org-123', 'unknown');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(100); // Free plan minute limit
    });
  });

  describe('checkIpLimit (Redis disabled)', () => {
    it('should allow requests for public endpoints', async () => {
      const result = await service.checkIpLimit('192.168.1.1', 'public');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(60); // Public IP limit
    });

    it('should allow requests for auth endpoints', async () => {
      const result = await service.checkIpLimit('192.168.1.1', 'auth');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(20); // Auth IP limit
    });
  });

  describe('onModuleDestroy', () => {
    it('should not throw when Redis is not configured', async () => {
      await expect(service.onModuleDestroy()).resolves.not.toThrow();
    });
  });
});

