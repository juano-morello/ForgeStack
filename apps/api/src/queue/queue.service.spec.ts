import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QueueService } from './queue.service';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

// Mock BullMQ Queue
jest.mock('bullmq', () => ({
  Queue: jest.fn().mockImplementation((name: string) => ({
    name,
    add: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock IORedis
jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    quit: jest.fn(),
  }));
});

describe('QueueService', () => {
  let service: QueueService;
  let configService: jest.Mocked<ConfigService>;
  let mockQueue: jest.Mocked<Queue>;

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create mock ConfigService
    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        if (key === 'REDIS_URL') {
          return 'redis://localhost:6379';
        }
        return defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    configService = module.get(ConfigService);

    // Get the mock queue instance
    mockQueue = new Queue('test-queue') as jest.Mocked<Queue>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with Redis connection from config', () => {
      expect(configService.get).toHaveBeenCalledWith('REDIS_URL');
      expect(IORedis).toHaveBeenCalledWith('redis://localhost:6379', {
        maxRetriesPerRequest: null,
      });
    });

    it('should use default Redis URL when not configured', () => {
      // Clear previous calls
      jest.clearAllMocks();

      // Mock ConfigService to return undefined
      configService.get.mockReturnValue(undefined);

      // Create new service instance
      new QueueService(configService);

      expect(IORedis).toHaveBeenCalledWith('redis://localhost:6379', {
        maxRetriesPerRequest: null,
      });
    });
  });

  describe('getQueue', () => {
    it('should create and return a new queue if not exists', () => {
      const queueName = 'test-queue';

      // Clear previous Queue constructor calls
      jest.mocked(Queue).mockClear();

      const queue = service.getQueue(queueName);

      expect(queue).toBeDefined();
      expect(Queue).toHaveBeenCalledWith(queueName, {
        connection: expect.any(Object),
      });
    });

    it('should return existing queue if already created', () => {
      const queueName = 'existing-queue';

      // Clear previous Queue constructor calls
      jest.mocked(Queue).mockClear();

      // First call creates the queue
      const queue1 = service.getQueue(queueName);
      // Second call should return the same queue
      const queue2 = service.getQueue(queueName);

      expect(queue1).toBe(queue2);
      // Queue constructor should only be called once for this queue
      expect(Queue).toHaveBeenCalledTimes(1);
    });
  });

  describe('addJob', () => {
    it('should add a job to the queue with correct name and data', async () => {
      const queueName = 'welcome-email';
      const jobData = { userId: 'user-123', email: 'test@example.com' };
      const mockJob = { id: 'job-123', name: queueName, data: jobData };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockQueue.add.mockResolvedValue(mockJob as any);

      // Mock getQueue to return our mock queue
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue);

      const result = await service.addJob(queueName, jobData);

      expect(service.getQueue).toHaveBeenCalledWith(queueName);
      expect(mockQueue.add).toHaveBeenCalledWith(queueName, jobData, undefined);
      expect(result).toEqual(mockJob);
    });

    it('should return the job object', async () => {
      const queueName = 'test-queue';
      const jobData = { test: 'data' };
      const mockJob = { id: 'job-456', name: queueName, data: jobData };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockQueue.add.mockResolvedValue(mockJob as any);
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue);

      const result = await service.addJob(queueName, jobData);

      expect(result).toBeDefined();
      expect(result.id).toBe('job-456');
      expect(result.data).toEqual(jobData);
    });

    it('should use default job options when none provided', async () => {
      const queueName = 'test-queue';
      const jobData = { test: 'data' };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockQueue.add.mockResolvedValue({ id: 'job-789' } as any);
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue);

      await service.addJob(queueName, jobData);

      expect(mockQueue.add).toHaveBeenCalledWith(queueName, jobData, undefined);
    });

    it('should pass job options when provided', async () => {
      const queueName = 'test-queue';
      const jobData = { test: 'data' };
      const options = { delay: 5000 };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockQueue.add.mockResolvedValue({ id: 'job-999' } as any);
      jest.spyOn(service, 'getQueue').mockReturnValue(mockQueue);

      await service.addJob(queueName, jobData, options);

      expect(mockQueue.add).toHaveBeenCalledWith(queueName, jobData, options);
    });
  });

  describe('onModuleDestroy', () => {
    it('should close all queues and quit Redis connection', async () => {
      const mockQueue1 = { close: jest.fn().mockResolvedValue(undefined) };
      const mockQueue2 = { close: jest.fn().mockResolvedValue(undefined) };
      const mockConnection = { quit: jest.fn().mockResolvedValue(undefined) };

      // Access private properties for testing
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).queues = new Map([
        ['queue1', mockQueue1],
        ['queue2', mockQueue2],
      ]);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (service as any).connection = mockConnection;

      await service.onModuleDestroy();

      expect(mockQueue1.close).toHaveBeenCalled();
      expect(mockQueue2.close).toHaveBeenCalled();
      expect(mockConnection.quit).toHaveBeenCalled();
    });
  });
});

