import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';
import { pool } from '@forgestack/db';
import Redis from 'ioredis';

// Mock the database pool
jest.mock('@forgestack/db', () => ({
  pool: {
    connect: jest.fn(),
  },
}));

// Mock ioredis
jest.mock('ioredis');

describe('HealthController', () => {
  let controller: HealthController;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'redis.url') {
        return 'redis://localhost:6379';
      }
      return undefined;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('check', () => {
    it('should return status ok', () => {
      const result = controller.check();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(typeof result.timestamp).toBe('string');
    });

    it('should return a valid ISO timestamp', () => {
      const result = controller.check();

      // Verify timestamp is a valid ISO date string
      const parsedDate = new Date(result.timestamp);
      expect(parsedDate.toISOString()).toBe(result.timestamp);
    });
  });

  describe('checkReady', () => {
    it('should return healthy status when all dependencies are up', async () => {
      // Mock successful database connection
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      // Mock successful Redis connection
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
        disconnect: jest.fn(),
      };
      (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

      const result = await controller.checkReady();

      expect(result.status).toBe('healthy');
      expect(result.checks.database.status).toBe('up');
      expect(result.checks.redis.status).toBe('up');
      expect(result.checks.database.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.checks.redis.latencyMs).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should throw 503 when database is down', async () => {
      // Mock failed database connection
      (pool.connect as jest.Mock).mockRejectedValue(new Error('Connection refused'));

      // Mock successful Redis connection
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
        disconnect: jest.fn(),
      };
      (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

      await expect(controller.checkReady()).rejects.toThrow(HttpException);

      try {
        await controller.checkReady();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        const response = (error as HttpException).getResponse() as any;
        expect(response.status).toBe('unhealthy');
        expect(response.checks.database.status).toBe('down');
        expect(response.checks.database.error).toBe('Connection refused');
      }
    });

    it('should throw 503 when Redis is down', async () => {
      // Mock successful database connection
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      // Mock failed Redis connection
      const mockRedis = {
        ping: jest.fn().mockRejectedValue(new Error('ECONNREFUSED')),
        disconnect: jest.fn(),
      };
      (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

      await expect(controller.checkReady()).rejects.toThrow(HttpException);

      try {
        await controller.checkReady();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
        const response = (error as HttpException).getResponse() as any;
        expect(response.status).toBe('unhealthy');
        expect(response.checks.redis.status).toBe('down');
        expect(response.checks.redis.error).toBe('ECONNREFUSED');
      }
    });

    it('should handle Redis not configured', async () => {
      // Mock successful database connection
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      // Mock ConfigService to return undefined for redis.url
      mockConfigService.get.mockReturnValue(undefined);

      await expect(controller.checkReady()).rejects.toThrow(HttpException);

      try {
        await controller.checkReady();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const response = (error as HttpException).getResponse() as any;
        expect(response.checks.redis.status).toBe('down');
        expect(response.checks.redis.error).toBe('Redis not configured');
      }

      // Restore mock
      mockConfigService.get.mockImplementation((key: string) => {
        if (key === 'redis.url') {
          return 'redis://localhost:6379';
        }
        return undefined;
      });
    });

    it('should disconnect Redis client after check', async () => {
      // Mock successful database connection
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      // Mock successful Redis connection
      const mockRedis = {
        ping: jest.fn().mockResolvedValue('PONG'),
        disconnect: jest.fn(),
      };
      (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

      await controller.checkReady();

      expect(mockRedis.disconnect).toHaveBeenCalled();
    });

    it('should disconnect Redis client even on error', async () => {
      // Mock successful database connection
      const mockClient = {
        query: jest.fn().mockResolvedValue({}),
        release: jest.fn(),
      };
      (pool.connect as jest.Mock).mockResolvedValue(mockClient);

      // Mock failed Redis connection
      const mockRedis = {
        ping: jest.fn().mockRejectedValue(new Error('Connection error')),
        disconnect: jest.fn(),
      };
      (Redis as unknown as jest.Mock).mockImplementation(() => mockRedis);

      try {
        await controller.checkReady();
      } catch {
        // Expected to throw
      }

      expect(mockRedis.disconnect).toHaveBeenCalled();
    });
  });
});

