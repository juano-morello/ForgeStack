/**
 * Usage Tracking Service Tests
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UsageTrackingService } from './usage-tracking.service';
import { QueueService } from '../queue/queue.service';

// Mock ioredis
const mockRedis = {
  multi: jest.fn().mockReturnThis(),
  incr: jest.fn().mockReturnThis(),
  expire: jest.fn().mockReturnThis(),
  exec: jest.fn().mockResolvedValue([]),
  incrby: jest.fn().mockResolvedValue(1),
  get: jest.fn().mockResolvedValue('1000'),
  on: jest.fn(),
};

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => mockRedis);
});

describe('UsageTrackingService', () => {
  let service: UsageTrackingService;

  beforeEach(async () => {
    const mockQueueService = {
      addJob: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'REDIS_URL') return 'redis://localhost:6379';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsageTrackingService,
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<UsageTrackingService>(UsageTrackingService);

    jest.clearAllMocks();
  });

  describe('trackApiCall', () => {
    it('should increment API call counter in Redis', async () => {
      const apiCallData = {
        endpoint: '/api/projects',
        method: 'GET',
        durationMs: 100,
        timestamp: new Date(),
      };

      await service.trackApiCall('org-123', apiCallData);

      expect(mockRedis.multi).toHaveBeenCalled();
      expect(mockRedis.incr).toHaveBeenCalled();
      expect(mockRedis.expire).toHaveBeenCalled();
      expect(mockRedis.exec).toHaveBeenCalled();
    });

    it('should not throw on Redis error', async () => {
      mockRedis.exec.mockRejectedValueOnce(new Error('Redis error'));

      const apiCallData = {
        endpoint: '/api/projects',
        method: 'GET',
        durationMs: 100,
        timestamp: new Date(),
      };

      await expect(service.trackApiCall('org-123', apiCallData)).resolves.not.toThrow();
    });
  });

  describe('trackStorageChange', () => {
    it('should increment storage counter', async () => {
      await service.trackStorageChange('org-123', 1000);

      expect(mockRedis.incrby).toHaveBeenCalledWith('usage:storage:org-123', 1000);
    });

    it('should handle negative delta for storage decrease', async () => {
      await service.trackStorageChange('org-123', -500);

      expect(mockRedis.incrby).toHaveBeenCalledWith('usage:storage:org-123', -500);
    });

    it('should not throw on Redis error', async () => {
      mockRedis.incrby.mockRejectedValueOnce(new Error('Redis error'));

      await expect(service.trackStorageChange('org-123', 1000)).resolves.not.toThrow();
    });
  });

  describe('getStorageUsage', () => {
    it('should return storage usage from Redis', async () => {
      mockRedis.get.mockResolvedValueOnce('5000000');

      const result = await service.getStorageUsage('org-123');

      expect(result).toBe(5000000);
      expect(mockRedis.get).toHaveBeenCalledWith('usage:storage:org-123');
    });

    it('should return 0 when no storage data exists', async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      const result = await service.getStorageUsage('org-123');

      expect(result).toBe(0);
    });

    it('should return 0 on Redis error', async () => {
      mockRedis.get.mockRejectedValueOnce(new Error('Redis error'));

      const result = await service.getStorageUsage('org-123');

      expect(result).toBe(0);
    });
  });
});

