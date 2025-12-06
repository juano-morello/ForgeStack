/**
 * Usage Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsageService } from './usage.service';
import { UsageRepository } from './usage.repository';
import { UsageTrackingService } from './usage-tracking.service';
import type { TenantContext } from '@forgestack/db';

describe('UsageService', () => {
  let service: UsageService;
  let usageRepository: jest.Mocked<UsageRepository>;

  const mockTenantContext: TenantContext = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'MEMBER',
  };

  const mockUsageSummary = {
    apiCalls: 1000,
    storageBytes: 5000000,
    activeSeats: 5,
  };

  const mockUsageLimits = [
    {
      id: 'limit-1',
      orgId: 'org-123',
      metricType: 'api_calls_monthly',
      limitValue: 10000,
      isHardLimit: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'limit-2',
      orgId: 'org-123',
      metricType: 'storage_bytes',
      limitValue: 10000000,
      isHardLimit: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'limit-3',
      orgId: 'org-123',
      metricType: 'seats',
      limitValue: 10,
      isHardLimit: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(async () => {
    const mockUsageRepository = {
      upsertUsageRecord: jest.fn(),
      getUsageForPeriod: jest.fn(),
      getUsageSummary: jest.fn(),
      getUsageHistory: jest.fn(),
      getUsageLimits: jest.fn(),
    };

    const mockUsageTrackingService = {
      trackApiCall: jest.fn(),
      trackStorageUsage: jest.fn(),
      trackSeatUsage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageService,
        {
          provide: UsageRepository,
          useValue: mockUsageRepository,
        },
        {
          provide: UsageTrackingService,
          useValue: mockUsageTrackingService,
        },
      ],
    }).compile();

    service = module.get<UsageService>(UsageService);
    usageRepository = module.get(UsageRepository);

    jest.clearAllMocks();
  });

  describe('getCurrentUsage', () => {
    it('should return current usage summary with limits', async () => {
      usageRepository.getUsageSummary.mockResolvedValue(mockUsageSummary);
      usageRepository.getUsageLimits.mockResolvedValue(mockUsageLimits);

      const result = await service.getCurrentUsage(mockTenantContext);

      expect(result).toMatchObject({
        billingPeriod: {
          start: expect.any(Date),
          end: expect.any(Date),
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
      });
    });

    it('should handle no limits', async () => {
      usageRepository.getUsageSummary.mockResolvedValue(mockUsageSummary);
      usageRepository.getUsageLimits.mockResolvedValue([]);

      const result = await service.getCurrentUsage(mockTenantContext);

      expect(result.usage.apiCalls.limit).toBeNull();
      expect(result.usage.apiCalls.percentUsed).toBe(0);
      expect(result.usage.storage.limitBytes).toBeNull();
      expect(result.usage.seats.limit).toBeNull();
    });
  });

  describe('getUsageHistory', () => {
    it('should return usage history grouped by period', async () => {
      const mockRecords = [
        {
          id: 'rec-1',
          orgId: 'org-123',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          metricType: 'api_calls',
          quantity: 500,
          reportedToStripe: false,
          stripeUsageRecordId: '',
          reportedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'rec-2',
          orgId: 'org-123',
          periodStart: new Date('2024-01-01'),
          periodEnd: new Date('2024-01-31'),
          metricType: 'storage_bytes',
          quantity: 1000000,
          reportedToStripe: false,
          stripeUsageRecordId: '',
          reportedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      usageRepository.getUsageHistory.mockResolvedValue(mockRecords);

      const result = await service.getUsageHistory(mockTenantContext, 6);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        period: new Date('2024-01-01'),
        apiCalls: 500,
        storageBytes: 1000000,
      });
    });
  });

  describe('getUsageLimits', () => {
    it('should return usage limits', async () => {
      usageRepository.getUsageLimits.mockResolvedValue(mockUsageLimits);

      const result = await service.getUsageLimits(mockTenantContext);

      expect(result).toEqual(mockUsageLimits);
      expect(usageRepository.getUsageLimits).toHaveBeenCalledWith(mockTenantContext);
    });
  });

  describe('checkLimit', () => {
    it('should return exceeded true when limit is exceeded', async () => {
      usageRepository.getUsageLimits.mockResolvedValue(mockUsageLimits);
      usageRepository.getUsageSummary.mockResolvedValue({
        apiCalls: 15000, // Exceeds limit of 10000
        storageBytes: 5000000,
        activeSeats: 5,
      });

      const result = await service.checkLimit(mockTenantContext, 'api_calls_monthly');

      expect(result).toEqual({
        exceeded: true,
        current: 15000,
        limit: 10000,
      });
    });

    it('should return exceeded false when under limit', async () => {
      usageRepository.getUsageLimits.mockResolvedValue(mockUsageLimits);
      usageRepository.getUsageSummary.mockResolvedValue(mockUsageSummary);

      const result = await service.checkLimit(mockTenantContext, 'api_calls_monthly');

      expect(result).toEqual({
        exceeded: false,
        current: 1000,
        limit: 10000,
      });
    });

    it('should return exceeded false when no limit exists', async () => {
      usageRepository.getUsageLimits.mockResolvedValue([]);

      const result = await service.checkLimit(mockTenantContext, 'api_calls_monthly');

      expect(result).toEqual({
        exceeded: false,
        current: 0,
        limit: null,
      });
    });

    it('should check storage_bytes limit', async () => {
      usageRepository.getUsageLimits.mockResolvedValue(mockUsageLimits);
      usageRepository.getUsageSummary.mockResolvedValue(mockUsageSummary);

      const result = await service.checkLimit(mockTenantContext, 'storage_bytes');

      expect(result).toEqual({
        exceeded: false,
        current: 5000000,
        limit: 10000000,
      });
    });

    it('should check seats limit', async () => {
      usageRepository.getUsageLimits.mockResolvedValue(mockUsageLimits);
      usageRepository.getUsageSummary.mockResolvedValue(mockUsageSummary);

      const result = await service.checkLimit(mockTenantContext, 'seats');

      expect(result).toEqual({
        exceeded: false,
        current: 5,
        limit: 10,
      });
    });
  });
});

