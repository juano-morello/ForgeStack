/**
 * Usage Aggregation Handler Tests
 */

import { Job } from 'bullmq';
import { handleUsageAggregation, UsageAggregationJobData } from '../usage-aggregation.handler';
import { withServiceContext } from '@forgestack/db';

// Mock database context
jest.mock('@forgestack/db', () => ({
  withServiceContext: jest.fn(),
  usageRecords: {},
  eq: jest.fn(),
  and: jest.fn(),
}));

// Mock the logger
jest.mock('../../telemetry/logger', () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  })),
}));

// Mock config
jest.mock('../../config', () => ({
  config: {
    redis: {
      url: 'redis://localhost:6379',
    },
  },
}));

// Mock IORedis
const mockKeys = jest.fn();
const mockGet = jest.fn();
const mockDel = jest.fn();
const mockQuit = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    keys: mockKeys,
    get: mockGet,
    del: mockDel,
    quit: mockQuit,
  }));
});

describe('UsageAggregationHandler', () => {
  const mockWithServiceContext = withServiceContext as jest.MockedFunction<typeof withServiceContext>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockKeys.mockReset();
    mockGet.mockReset();
    mockDel.mockReset();
    mockQuit.mockReset();
    mockQuit.mockResolvedValue(undefined);
  });

  describe('handleUsageAggregation', () => {
    it('should aggregate usage from Redis to database', async () => {
      const redisKeys = [
        'usage:api_calls:org-1:2024-01-15-10',
        'usage:api_calls:org-2:2024-01-15-10',
      ];

      mockKeys.mockResolvedValue(redisKeys);
      mockGet.mockResolvedValueOnce('1000').mockResolvedValueOnce('500');
      mockDel.mockResolvedValue(1);

      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        // Check if record exists (returns empty for new records)
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [],
              }),
            }),
          }),
          insert: mockInsert,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockInsert.mockReturnValue({ values: mockValues });

      const jobData: UsageAggregationJobData = {
        hourBucket: '2024-01-15-10',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<UsageAggregationJobData>;

      const result = await handleUsageAggregation(mockJob);

      expect(result).toEqual({
        success: true,
        hourBucket: '2024-01-15-10',
        processedKeys: 2,
      });

      expect(mockKeys).toHaveBeenCalledWith('usage:api_calls:*:2024-01-15-10');
      expect(mockGet).toHaveBeenCalledTimes(2);
      expect(mockDel).toHaveBeenCalledTimes(2);
      expect(mockInsert).toHaveBeenCalledTimes(2);
      expect(mockQuit).toHaveBeenCalled();
    });

    it('should update existing usage records', async () => {
      const redisKeys = ['usage:api_calls:org-1:2024-01-15-10'];

      mockKeys.mockResolvedValue(redisKeys);
      mockGet.mockResolvedValue('1500');
      mockDel.mockResolvedValue(1);

      const mockUpdate = jest.fn().mockReturnThis();
      const mockSet = jest.fn().mockReturnThis();
      const mockWhere = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [{ id: 'existing-record' }],
              }),
            }),
          }),
          update: mockUpdate,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockUpdate.mockReturnValue({ set: mockSet });
      mockSet.mockReturnValue({ where: mockWhere });

      const jobData: UsageAggregationJobData = {
        hourBucket: '2024-01-15-10',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<UsageAggregationJobData>;

      const result = await handleUsageAggregation(mockJob);

      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      expect(mockSet).toHaveBeenCalledWith({
        quantity: 1500,
        updatedAt: expect.any(Date),
      });
    });

    it('should skip keys with zero usage', async () => {
      const redisKeys = ['usage:api_calls:org-1:2024-01-15-10'];

      mockKeys.mockResolvedValue(redisKeys);
      mockGet.mockResolvedValue('0');

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({} as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: UsageAggregationJobData = {
        hourBucket: '2024-01-15-10',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<UsageAggregationJobData>;

      const result = await handleUsageAggregation(mockJob);

      expect(result.success).toBe(true);
      expect(mockDel).not.toHaveBeenCalled();
    });

    it('should skip invalid key formats', async () => {
      const redisKeys = [
        'usage:api_calls:org-1:2024-01-15-10',
        'invalid:key:format',
      ];

      mockKeys.mockResolvedValue(redisKeys);
      mockGet.mockResolvedValue('1000');
      mockDel.mockResolvedValue(1);

      const mockInsert = jest.fn().mockReturnThis();
      const mockValues = jest.fn().mockResolvedValue(undefined);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [],
              }),
            }),
          }),
          insert: mockInsert,
        } as unknown as Parameters<typeof callback>[0]);
      });

      mockInsert.mockReturnValue({ values: mockValues });

      const jobData: UsageAggregationJobData = {
        hourBucket: '2024-01-15-10',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<UsageAggregationJobData>;

      const result = await handleUsageAggregation(mockJob);

      expect(result.success).toBe(true);
      expect(mockInsert).toHaveBeenCalledTimes(1); // Only valid key processed
    });

    it('should handle database errors gracefully', async () => {
      const redisKeys = [
        'usage:api_calls:org-1:2024-01-15-10',
        'usage:api_calls:org-2:2024-01-15-10',
      ];

      mockKeys.mockResolvedValue(redisKeys);
      mockGet.mockResolvedValue('1000');
      mockDel.mockResolvedValue(1);

      let callCount = 0;
      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        callCount++;

        // First call fails
        if (callCount === 1) {
          throw new Error('Database error');
        }

        // Second call succeeds
        const mockInsert = jest.fn().mockReturnThis();
        const mockValues = jest.fn().mockResolvedValue(undefined);
        mockInsert.mockReturnValue({ values: mockValues });

        return callback({
          select: () => ({
            from: () => ({
              where: () => ({
                limit: () => [],
              }),
            }),
          }),
          insert: mockInsert,
        } as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: UsageAggregationJobData = {
        hourBucket: '2024-01-15-10',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<UsageAggregationJobData>;

      const result = await handleUsageAggregation(mockJob);

      expect(result.success).toBe(true);
      expect(result.processedKeys).toBe(2);
    });

    it('should use previous hour as default', async () => {
      mockKeys.mockResolvedValue([]);

      mockWithServiceContext.mockImplementation(async (_name, callback) => {
        return callback({} as unknown as Parameters<typeof callback>[0]);
      });

      const jobData: UsageAggregationJobData = {};

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<UsageAggregationJobData>;

      const result = await handleUsageAggregation(mockJob);

      expect(result.success).toBe(true);
      expect(result.hourBucket).toMatch(/^\d{4}-\d{2}-\d{2}-\d{2}$/);
    });

    it('should always quit Redis connection', async () => {
      mockKeys.mockRejectedValue(new Error('Redis error'));

      const jobData: UsageAggregationJobData = {
        hourBucket: '2024-01-15-10',
      };

      const mockJob = {
        id: 'job-123',
        data: jobData,
      } as Job<UsageAggregationJobData>;

      await expect(handleUsageAggregation(mockJob)).rejects.toThrow('Redis error');
      expect(mockQuit).toHaveBeenCalled();
    });
  });
});


