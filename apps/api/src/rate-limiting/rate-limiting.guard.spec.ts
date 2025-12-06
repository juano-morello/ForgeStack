/**
 * Rate Limiting Guard Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimitGuard } from './rate-limiting.guard';
import { RateLimitingService } from './rate-limiting.service';
import { RateLimitException } from './rate-limit.exception';
import { RATE_LIMIT_CONFIG } from './rate-limit.config';

describe('RateLimitGuard', () => {
  let guard: RateLimitGuard;
  let rateLimitingService: jest.Mocked<RateLimitingService>;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(async () => {
    const mockRateLimitingService = {
      checkOrgLimit: jest.fn(),
      checkIpLimit: jest.fn(),
    };

    const mockReflector = {
      getAllAndOverride: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RateLimitGuard,
        {
          provide: RateLimitingService,
          useValue: mockRateLimitingService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RateLimitGuard>(RateLimitGuard);
    rateLimitingService = module.get(RateLimitingService);
    reflector = module.get(Reflector);

    jest.clearAllMocks();
    RATE_LIMIT_CONFIG.enabled = true;
  });

  const createMockExecutionContext = (request: unknown, response: Record<string, unknown> = {}): ExecutionContext => {
    const mockResponse = {
      setHeader: jest.fn(),
      ...response,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => mockResponse,
        getNext: jest.fn(),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;
  };

  describe('canActivate', () => {
    it('should return true when rate limiting is disabled', async () => {
      RATE_LIMIT_CONFIG.enabled = false;
      const context = createMockExecutionContext({});

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rateLimitingService.checkOrgLimit).not.toHaveBeenCalled();
      expect(rateLimitingService.checkIpLimit).not.toHaveBeenCalled();
    });

    it('should return true when skip option is set', async () => {
      reflector.getAllAndOverride.mockReturnValue({ skip: true });
      const context = createMockExecutionContext({});

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rateLimitingService.checkOrgLimit).not.toHaveBeenCalled();
    });

    it('should check org limit for authenticated requests', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const mockRequest = {
        tenantContext: {
          orgId: 'org-123',
          plan: 'pro',
        },
      };

      const mockResult = {
        allowed: true,
        limit: 1000,
        remaining: 999,
        reset: Date.now() + 60000,
      };

      rateLimitingService.checkOrgLimit.mockResolvedValue(mockResult);

      const context = createMockExecutionContext(mockRequest);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rateLimitingService.checkOrgLimit).toHaveBeenCalledWith('org-123', 'pro');
    });

    it('should check IP limit for unauthenticated requests', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const mockRequest = {
        headers: {},
        ip: '192.168.1.1',
        path: '/api/public',
      };

      const mockResult = {
        allowed: true,
        limit: 100,
        remaining: 99,
        reset: Date.now() + 60000,
      };

      rateLimitingService.checkIpLimit.mockResolvedValue(mockResult);

      const context = createMockExecutionContext(mockRequest);
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(rateLimitingService.checkIpLimit).toHaveBeenCalledWith('192.168.1.1', 'public');
    });

    it('should throw RateLimitException when limit exceeded', async () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const mockRequest = {
        headers: {},
        ip: '192.168.1.1',
        path: '/api/public',
      };

      const mockResult = {
        allowed: false,
        limit: 100,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfter: 60,
      };

      rateLimitingService.checkIpLimit.mockResolvedValue(mockResult);

      const context = createMockExecutionContext(mockRequest);

      await expect(guard.canActivate(context)).rejects.toThrow(RateLimitException);
    });
  });
});

