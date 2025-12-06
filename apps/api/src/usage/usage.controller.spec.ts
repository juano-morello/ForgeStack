/**
 * Usage Controller Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsageController } from './usage.controller';
import { UsageService } from './usage.service';
import type { TenantContext } from '@forgestack/db';

describe('UsageController', () => {
  let controller: UsageController;
  let usageService: jest.Mocked<UsageService>;

  const mockTenantContext: TenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'MEMBER',
  };

  const mockUsageSummary = {
    billingPeriod: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31'),
    },
    usage: {
      apiCalls: {
        used: 1000,
        limit: 10000,
        percentUsed: 10,
      },
      storage: {
        usedBytes: 5000000,
        limitBytes: 10000000,
        percentUsed: 50,
      },
      seats: {
        active: 5,
        limit: 10,
        percentUsed: 50,
      },
    },
  };

  beforeEach(async () => {
    const mockUsageService = {
      getCurrentUsage: jest.fn(),
      getUsageHistory: jest.fn(),
      getUsageLimits: jest.fn(),
      checkLimit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsageController],
      providers: [
        {
          provide: UsageService,
          useValue: mockUsageService,
        },
      ],
    }).compile();

    controller = module.get<UsageController>(UsageController);
    usageService = module.get(UsageService);

    jest.clearAllMocks();
  });

  describe('getUsageSummary', () => {
    it('should return formatted usage summary', async () => {
      usageService.getCurrentUsage.mockResolvedValue(mockUsageSummary);

      const result = await controller.getUsageSummary(mockTenantContext);

      expect(result).toMatchObject({
        billingPeriod: {
          start: expect.any(String),
          end: expect.any(String),
        },
        plan: 'pro',
        usage: {
          apiCalls: {
            used: 1000,
            limit: 10000,
            percentUsed: 10,
            overage: 0,
          },
          storage: {
            usedBytes: 5000000,
            limitBytes: 10000000,
            percentUsed: 50,
            usedFormatted: expect.any(String),
            limitFormatted: expect.any(String),
          },
          seats: {
            active: 5,
            limit: 10,
            percentUsed: 50,
          },
        },
      });
    });

    it('should calculate overage correctly', async () => {
      const overageSummary = {
        ...mockUsageSummary,
        usage: {
          ...mockUsageSummary.usage,
          apiCalls: {
            used: 15000,
            limit: 10000,
            percentUsed: 150,
          },
        },
      };

      usageService.getCurrentUsage.mockResolvedValue(overageSummary);

      const result = await controller.getUsageSummary(mockTenantContext);

      expect(result.usage.apiCalls.overage).toBe(5000);
    });
  });

  describe('getUsageHistory', () => {
    it('should return usage history', async () => {
      const mockHistory = [
        {
          period: new Date('2024-01-01'),
          apiCalls: 1000,
          storageBytes: 5000000,
          activeSeats: 5,
        },
      ];

      usageService.getUsageHistory.mockResolvedValue(mockHistory);

      const result = await controller.getUsageHistory(mockTenantContext);

      expect(result.history).toHaveLength(1);
      expect(result.history[0]).toMatchObject({
        period: expect.any(String),
        apiCalls: 1000,
        storageBytes: 5000000,
        activeSeats: 5,
      });
      expect(usageService.getUsageHistory).toHaveBeenCalledWith(mockTenantContext, 6);
    });

    it('should accept custom months parameter', async () => {
      usageService.getUsageHistory.mockResolvedValue([]);

      await controller.getUsageHistory(mockTenantContext, '12');

      expect(usageService.getUsageHistory).toHaveBeenCalledWith(mockTenantContext, 12);
    });
  });

  describe('getApiCallsBreakdown', () => {
    it('should return API calls breakdown', async () => {
      usageService.getCurrentUsage.mockResolvedValue(mockUsageSummary);

      const result = await controller.getApiCallsBreakdown(mockTenantContext);

      expect(result).toEqual({
        total: 1000,
        limit: 10000,
        percentUsed: 10,
      });
    });
  });

  describe('getStorageUsage', () => {
    it('should return storage usage', async () => {
      usageService.getCurrentUsage.mockResolvedValue(mockUsageSummary);

      const result = await controller.getStorageUsage(mockTenantContext);

      expect(result).toEqual({
        usedBytes: 5000000,
        limitBytes: 10000000,
        percentUsed: 50,
      });
    });
  });

  describe('getSeatsUsage', () => {
    it('should return seats usage', async () => {
      usageService.getCurrentUsage.mockResolvedValue(mockUsageSummary);

      const result = await controller.getSeatsUsage(mockTenantContext);

      expect(result).toEqual({
        active: 5,
        limit: 10,
        percentUsed: 50,
      });
    });
  });

  describe('getUsageLimits', () => {
    it('should return usage limits', async () => {
      const mockLimits = [
        {
          id: 'limit-1',
          orgId: 'org-123',
          metricType: 'api_calls_monthly',
          limitValue: 10000,
          isHardLimit: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      usageService.getUsageLimits.mockResolvedValue(mockLimits);

      const result = await controller.getUsageLimits(mockTenantContext);

      expect(result.limits).toHaveLength(1);
      expect(result.limits[0]).toMatchObject({
        id: 'limit-1',
        metricType: 'api_calls_monthly',
        limitValue: 10000,
        isHardLimit: true,
      });
    });
  });
});

