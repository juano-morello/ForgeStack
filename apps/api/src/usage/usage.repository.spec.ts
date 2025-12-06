/**
 * Usage Repository Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { UsageRepository } from './usage.repository';
import type { TenantContext } from '@forgestack/db';

// Mock @forgestack/db
const mockDb = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
};

jest.mock('@forgestack/db', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  gte: jest.fn(),
  lte: jest.fn(),
  desc: jest.fn(),
  withServiceContext: jest.fn((name, fn) => fn(mockDb)),
  withTenantContext: jest.fn((ctx, fn) => fn(mockDb)),
  usageRecords: {},
  usageLimits: {},
}));

describe('UsageRepository', () => {
  let repository: UsageRepository;

  const mockUsageRecord = {
    id: 'rec-1',
    orgId: 'org-123',
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    metricType: 'api_calls',
    quantity: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsageLimit = {
    id: 'limit-1',
    orgId: 'org-123',
    metricType: 'api_calls_monthly',
    limitValue: 10000,
    isHardLimit: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsageRepository],
    }).compile();

    repository = module.get<UsageRepository>(UsageRepository);

    jest.clearAllMocks();
  });

  describe('upsertUsageRecord', () => {
    it('should insert new usage record when not exists', async () => {
      const newRecord = {
        orgId: 'org-123',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        metricType: 'api_calls',
        quantity: 1000,
      };

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([]);

      mockDb.insert.mockReturnValueOnce(mockDb);
      mockDb.values.mockReturnValueOnce(mockDb);
      mockDb.returning.mockResolvedValueOnce([mockUsageRecord]);

      const result = await repository.upsertUsageRecord(newRecord);

      expect(result).toEqual(mockUsageRecord);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should update existing usage record', async () => {
      const existingRecord = mockUsageRecord;
      const updateData = {
        orgId: 'org-123',
        periodStart: new Date('2024-01-01'),
        periodEnd: new Date('2024-01-31'),
        metricType: 'api_calls',
        quantity: 2000,
      };

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.limit.mockResolvedValueOnce([existingRecord]);

      mockDb.update.mockReturnValueOnce(mockDb);
      mockDb.set.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.returning.mockResolvedValueOnce([{ ...existingRecord, quantity: 2000 }]);

      const result = await repository.upsertUsageRecord(updateData);

      expect(result.quantity).toBe(2000);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('getUsageForPeriod', () => {
    it('should return usage records for a period', async () => {
      const records = [mockUsageRecord];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(records);

      const result = await repository.getUsageForPeriod(
        'org-123',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toEqual(records);
    });
  });

  describe('getUsageSummary', () => {
    it('should return aggregated usage summary', async () => {
      const records = [
        { ...mockUsageRecord, metricType: 'api_calls', quantity: 500 },
        { ...mockUsageRecord, metricType: 'api_calls', quantity: 500 },
        { ...mockUsageRecord, metricType: 'storage_bytes', quantity: 1000000 },
        { ...mockUsageRecord, metricType: 'active_seats', quantity: 5 },
      ];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(records);

      const result = await repository.getUsageSummary(
        'org-123',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toEqual({
        apiCalls: 1000,
        storageBytes: 1000000,
        activeSeats: 5,
      });
    });

    it('should handle empty records', async () => {
      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce([]);

      const result = await repository.getUsageSummary(
        'org-123',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result).toEqual({
        apiCalls: 0,
        storageBytes: 0,
        activeSeats: 0,
      });
    });
  });

  describe('getUsageHistory', () => {
    it('should return usage history for specified months', async () => {
      const records = [mockUsageRecord];

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockReturnValueOnce(mockDb);
      mockDb.orderBy.mockResolvedValueOnce(records);

      const result = await repository.getUsageHistory('org-123', 6);

      expect(result).toEqual(records);
    });
  });

  describe('getUsageLimits', () => {
    it('should return usage limits for an organization', async () => {
      const limits = [mockUsageLimit];
      const ctx: TenantContext = { orgId: 'org-123', userId: 'user-123', role: 'MEMBER' };

      mockDb.select.mockReturnValueOnce(mockDb);
      mockDb.from.mockReturnValueOnce(mockDb);
      mockDb.where.mockResolvedValueOnce(limits);

      const result = await repository.getUsageLimits(ctx);

      expect(result).toEqual(limits);
    });
  });
});

