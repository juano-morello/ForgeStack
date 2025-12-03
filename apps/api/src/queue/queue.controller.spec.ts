import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';

describe('QueueController', () => {
  let controller: QueueController;
  let queueService: jest.Mocked<QueueService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    // Create mock QueueService
    const mockQueueService = {
      addJob: jest.fn(),
    };

    // Create mock ConfigService
    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
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

    controller = module.get<QueueController>(QueueController);
    queueService = module.get(QueueService);
    configService = module.get(ConfigService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('testWelcomeEmail', () => {
    const testBody = {
      userId: 'user-123',
      email: 'test@example.com',
    };

    it('should return job status when in development environment', async () => {
      // Mock development environment
      configService.get.mockReturnValue('development');

      const mockJob = {
        id: 'job-123',
        name: 'welcome-email',
        data: testBody,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queueService.addJob.mockResolvedValue(mockJob as any);

      const result = await controller.testWelcomeEmail(testBody);

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV', 'development');
      expect(queueService.addJob).toHaveBeenCalledWith('welcome-email', testBody);
      expect(result).toEqual({
        jobId: 'job-123',
        status: 'queued',
      });
    });

    it('should return job status when in test environment', async () => {
      // Mock test environment
      configService.get.mockReturnValue('test');

      const mockJob = {
        id: 'job-456',
        name: 'welcome-email',
        data: testBody,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queueService.addJob.mockResolvedValue(mockJob as any);

      const result = await controller.testWelcomeEmail(testBody);

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV', 'development');
      expect(queueService.addJob).toHaveBeenCalledWith('welcome-email', testBody);
      expect(result).toEqual({
        jobId: 'job-456',
        status: 'queued',
      });
    });

    it('should throw ForbiddenException when in production environment', async () => {
      // Mock production environment
      configService.get.mockReturnValue('production');

      await expect(controller.testWelcomeEmail(testBody)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(controller.testWelcomeEmail(testBody)).rejects.toThrow(
        'Test endpoints are not available in production',
      );

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV', 'development');
      expect(queueService.addJob).not.toHaveBeenCalled();
    });

    it('should call QueueService.addJob with correct parameters', async () => {
      configService.get.mockReturnValue('development');

      const customBody = {
        userId: 'user-999',
        email: 'custom@example.com',
      };

      const mockJob = {
        id: 'job-789',
        name: 'welcome-email',
        data: customBody,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queueService.addJob.mockResolvedValue(mockJob as any);

      await controller.testWelcomeEmail(customBody);

      expect(queueService.addJob).toHaveBeenCalledWith('welcome-email', customBody);
      expect(queueService.addJob).toHaveBeenCalledTimes(1);
    });

    it('should use default environment value when NODE_ENV is not set', async () => {
      // Mock undefined NODE_ENV (should default to 'development')
      configService.get.mockReturnValue('development');

      const mockJob = {
        id: 'job-default',
        name: 'welcome-email',
        data: testBody,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queueService.addJob.mockResolvedValue(mockJob as any);

      const result = await controller.testWelcomeEmail(testBody);

      expect(configService.get).toHaveBeenCalledWith('NODE_ENV', 'development');
      expect(result).toEqual({
        jobId: 'job-default',
        status: 'queued',
      });
    });

    it('should return correct response structure', async () => {
      configService.get.mockReturnValue('development');

      const mockJob = {
        id: 'job-structure-test',
        name: 'welcome-email',
        data: testBody,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      queueService.addJob.mockResolvedValue(mockJob as any);

      const result = await controller.testWelcomeEmail(testBody);

      expect(result).toHaveProperty('jobId');
      expect(result).toHaveProperty('status');
      expect(result.jobId).toBe('job-structure-test');
      expect(result.status).toBe('queued');
    });
  });
});

